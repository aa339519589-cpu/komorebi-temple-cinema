"""Retain rank-deficient source transforms rather than treating them as empty.

Source normal matrices cannot invert at rank2, but the transformed geometry can
still have finite area. Preserve every original vertex/index/UV/RGB and let the
path tracer recalculate flat planar normals only for that singular subset.
"""
import bpy,json,math
from pathlib import Path
import numpy as np
from mathutils import Matrix

def restore_singular_source(package):
    root=Path(package).resolve();source=json.loads((root/'scene.json').read_text());scene=bpy.context.scene
    geo={r['id']:r for r in source['geometries']};materials={r['id']:r for r in source['materials']};conversion=Matrix.Rotation(math.pi/2,4,'X')
    def binary(rec):
        data=np.fromfile(root/'assets'/rec['file'],dtype={'Float32Array':'<f4','Uint16Array':'<u2','Uint32Array':'<u4'}[rec['type']])
        if len(data)!=rec['count']:raise RuntimeError('Truncated source buffer')
        return data
    restored=[];triangle_count=0
    for at,rec in enumerate(source['meshes']):
        if 'instanceMatrices' not in rec:continue
        raw=binary(rec['instanceMatrices']).reshape(rec['instances'],4,4).transpose(0,2,1)
        det=np.linalg.det(raw[:,:3,:3]);singular=np.flatnonzero(np.isfinite(det)&(np.abs(det)<=1e-12))
        if not len(singular):continue
        g=geo[rec['geometry']];p=binary(g['attributes']['position']).reshape(-1,3);indices=binary(g['index']).reshape(-1,3)
        uv=binary(g['attributes']['uv']).reshape(-1,g['attributes']['uv']['itemSize']) if 'uv' in g['attributes'] else None
        vertex_colors=binary(g['attributes']['color']).reshape(-1,g['attributes']['color']['itemSize']) if 'color' in g['attributes'] else None
        instance_colors=binary(rec['instanceColors']).reshape(-1,3) if 'instanceColors' in rec else None
        parent=Matrix(np.asarray(rec['matrix']).reshape(4,4).T.tolist())
        for i in singular:
            name='scene09 exact rank-deficient source '+str(at)+'-'+str(i)
            if bpy.data.objects.get(name):raise RuntimeError('Singular source instance already present; avoid duplication')
            m=raw[i];coords=p@m[:3,:3].T+m[:3,3]
            mesh=bpy.data.meshes.new(name);mesh.from_pydata(coords.tolist(),[],indices.tolist());mesh.update(calc_edges=True)
            # Native inverse-transpose normals are undefined. Flat face normals
            # are the declared physical-normal replacement; positions are exact.
            for polygon in mesh.polygons:polygon.use_smooth=False
            if uv is not None:
                layer=mesh.uv_layers.new(name='sourceUV');layer.data.foreach_set('uv',uv[indices.ravel(),:2].astype(np.float32).ravel())
            if any(materials[mid].get('vertexColors') for mid in rec['materials']):
                color=np.ones((len(p),4),dtype=np.float32)
                if vertex_colors is not None:color[:,:vertex_colors.shape[1]]=vertex_colors
                attr=mesh.color_attributes.new(name='sourceColor',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',color.ravel())
            color=np.ones((len(p),4),dtype=np.float32)
            if instance_colors is not None:color[:,:3]=instance_colors[i]
            attr=mesh.color_attributes.new(name='instanceColor',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',color.ravel())
            for mid in rec['materials']:
                base=materials[mid]['name'] or mid
                mat=bpy.data.materials.get(base+' [GEOMETRY instanceColor]') or bpy.data.materials.get(base)
                if not mat:raise RuntimeError('Source material is absent for rank-deficient mesh '+mid)
                mesh.materials.append(mat)
            for group in g.get('groups',[]):
                for polygon in mesh.polygons[group['start']//3:(group['start']+group['count'])//3]:polygon.material_index=group.get('materialIndex',0)
            obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj);obj.matrix_world=conversion@parent
            a=coords[indices[:,0]];b=coords[indices[:,1]];c=coords[indices[:,2]];area=np.linalg.norm(np.cross(b-a,c-a),axis=1)/2
            restored.append({'sourceRecordIndex':at,'sourceInstanceIndex':int(i),'materialIDs':rec['materials'],'exactSourceLocalMatrixColumnMajor':m.T.reshape(-1).tolist(),'sourceTriangles':len(indices),'nonzeroAreaTriangles':int(np.count_nonzero(area>1e-12)),'transformedAreaLocalMetres2':float(area.sum()),'normalAdaptation':'Recalculated planar geometric normals; singular inverse-transpose is undefined.','positionsIndicesUVsInstanceRGBPreserved':True})
            triangle_count+=len(indices)
    return {'restoredInstances':len(restored),'restoredIndexedTriangles':triangle_count,'instances':restored,'sourceGeometryChanged':False,'normalAdaptationOnlyForSingularSubset':True,'referenceImageUsed':False}
