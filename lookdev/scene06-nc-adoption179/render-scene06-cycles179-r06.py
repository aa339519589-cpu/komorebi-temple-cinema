"""Scene06 adoption179 R06 physical Cycles comparison, imported from frozen native geometry.

Owns only this lookdev directory. No photograph pixels, camera plate, AI frame,
mesh replacement, scene source mutation, or native screen-space volume planes.
Importer derived from the affine/instanceColor-parity Scene01 importer; copied
here as editable source so no foreign scene/world/water logic is executed.
"""
import bpy,json,math,os,sys,time,hashlib
from pathlib import Path
import numpy as np
from mathutils import Matrix,Vector,Quaternion
HERE=Path(__file__).resolve().parent
ROOT=Path(os.environ.get('SCENE_PACKAGE',str(HERE/'cycles-r06-export'))).resolve()
OUT=Path(os.environ.get('CYCLES_OUTPUT',str(HERE/'cycles-r06-physical-full'))).resolve();OUT.mkdir(parents=True,exist_ok=True)
MODE='source-sun-physical-apertures'
scene_data=json.loads((ROOT/'scene.json').read_text());source_export=json.loads((ROOT/'export-report.json').read_text())
assert source_export['status']=='exported-existing-geometry'
assert source_export['sourceHash']=='d4ebd5c9b2855de36771c9b4f24821594cde9d78230c39843869773f04d5cad6'
assert scene_data['view']['reference']==6
report={'sourceCommit':source_export['sourceCommit'],'sourceHash':source_export['sourceHash'],'exportSceneSha256':hashlib.sha256((ROOT/'scene.json').read_bytes()).hexdigest(),'renderScript':{'file':Path(__file__).name,'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'sourceStatistics':scene_data['statistics'],'lightingMode':MODE,'blender':bpy.app.version_string,'scope':scene_data['renderingScope'],'geometryRebuilt':False,'excluded':scene_data['excluded'],'warnings':[],'status':'importing','started':time.time(),'visualAccepted':False,'photographicAcceptance':False}
report.update({'license':'CC-BY-NC-SA-4.0','licenseUrl':'https://creativecommons.org/licenses/by-nc-sa/4.0/','personalNoncommercialUseOnly':True,'sourceURL':'https://zenodo.org/records/21353739','sourceAttribution':json.loads((HERE/'license-and-adoption179.json').read_text())['attribution'],'noBlendSaved':True,'renderPurpose':'Single actual full-frame physical GI comparison; not a native WebGL pixel-equivalence or film claim.'})
(OUT/'report.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene
def binary(record):
    kind={'Float32Array':'<f4','Uint32Array':'<u4','Uint16Array':'<u2'}[record['type']]
    data=np.fromfile(ROOT/'assets'/record['file'],dtype=kind)
    if len(data)!=record['count']: raise ValueError('Truncated geometry buffer '+record['file'])
    return data

def value(node,names,v):
    for name in names:
        if name in node.inputs: node.inputs[name].default_value=v;return node.inputs[name]
    return None

instance_colored={mid for o in scene_data['meshes'] if 'instanceColors' in o for mid in o['materials']}
textures={t['id']:t for t in scene_data['textures']}; material_records={m['id']:m for m in scene_data['materials']};materials={};geometry_materials={}
image_cache={}
varnish_coat_roughness=float(os.environ.get('CYCLES_VARNISH_COAT_ROUGHNESS','.17'))
for rec in scene_data['materials']:
    mat=bpy.data.materials.new(rec['name'] or rec['id']);mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();links=mat.node_tree.links
    bs=n.new('ShaderNodeBsdfPrincipled');out=n.new('ShaderNodeOutputMaterial');links.new(bs.outputs['BSDF'],out.inputs['Surface'])
    color=tuple(rec.get('color') or [.5,.5,.5])+ (1,)
    value(bs,['Base Color'],color);value(bs,['Metallic'],float(rec.get('metalness') or 0));value(bs,['Roughness'],max(.04,float(rec.get('roughness') or .4)))
    value(bs,['IOR'],float(rec.get('ior') or 1.5));value(bs,['Transmission Weight','Transmission'],float(rec.get('transmission') or 0))
    value(bs,['Specular IOR Level'],.5*float(rec.get('specularIntensity') if rec.get('specularIntensity') is not None else 1))
    value(bs,['Coat Weight','Clearcoat'],float(rec.get('clearcoat') or 0));value(bs,['Coat Roughness','Clearcoat Roughness'],float(rec.get('clearcoatRoughness') or .15))
    if rec['name']=='reference6-varnished-red-brown-floor-body':
        value(bs,['Coat Roughness','Clearcoat Roughness'],varnish_coat_roughness)
    emission=tuple(rec.get('emissive') or [0,0,0])+(1,);value(bs,['Emission Color','Emission'],emission);value(bs,['Emission Strength'],float(rec.get('emissiveIntensity') or 0))
    value(bs,['Alpha'],float(rec.get('opacity',1)))
    uv=n.new('ShaderNodeTexCoord'); tex_nodes={}
    for channel,tid in rec['textures'].items():
        tex=textures[tid]
        if 'file' not in tex: report['warnings'].append('No portable image for '+rec['name']+'/'+channel);continue
        color_space='sRGB' if channel in ['map','emissiveMap'] and tex.get('colorSpace')=='srgb' else 'Non-Color'
        digest=source_export['exportedAssets'][tex['file']]['sha256']
        image_key=(digest,color_space)
        if image_key not in image_cache:
            image=bpy.data.images.load(str(ROOT/'assets'/tex['file']),check_existing=False)
            image.colorspace_settings.name=color_space;image_cache[image_key]=image
        image=image_cache[image_key]
        tn=n.new('ShaderNodeTexImage');tn.image=image;tn.extension='REPEAT';tn.interpolation='Linear';tex_nodes[channel]=tn
        # Exact Three.js Matrix3.setUvTransform, then bitmap flip convention.
        sx,sy=tex.get('repeat',[1,1]);ox,oy=tex.get('offset',[0,0]);cx,cy=tex.get('center',[0,0]);rot=tex.get('rotation',0);c=math.cos(rot);sn=math.sin(rot)
        row_x=[sx*c,sx*sn,0];row_y=[-sy*sn,sy*c,0]
        tx=-sx*(c*cx+sn*cy)+cx+ox;ty=-sy*(-sn*cx+c*cy)+cy+oy
        if not tex.get('flipY',True):row_y=[-v for v in row_y];ty=1-ty
        xy=[]
        for row,offset in [(row_x,tx),(row_y,ty)]:
            dot=n.new('ShaderNodeVectorMath');dot.operation='DOT_PRODUCT';dot.inputs[1].default_value=row;links.new(uv.outputs['UV'],dot.inputs[0])
            add=n.new('ShaderNodeMath');add.operation='ADD';add.inputs[1].default_value=offset;links.new(dot.outputs['Value'],add.inputs[0]);xy.append(add.outputs[0])
        combine=n.new('ShaderNodeCombineXYZ');links.new(xy[0],combine.inputs['X']);links.new(xy[1],combine.inputs['Y']);links.new(combine.outputs[0],tn.inputs['Vector'])
    base_socket=None
    if 'map' in tex_nodes:
        mul=n.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;mul.inputs[2].default_value=color;links.new(tex_nodes['map'].outputs['Color'],mul.inputs[1]);base_socket=mul.outputs[0]
        if rec.get('alphaTest',0)>0:links.new(tex_nodes['map'].outputs['Alpha'],bs.inputs['Alpha'])
    if rec.get('vertexColors'):
        attr=n.new('ShaderNodeVertexColor');attr.layer_name='sourceColor';mul=n.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;links.new(attr.outputs['Color'],mul.inputs[1]);
        if base_socket:links.new(base_socket,mul.inputs[2])
        else:mul.inputs[2].default_value=color
        base_socket=mul.outputs[0]
    if rec['id'] in instance_colored:
        inst_attr=n.new('ShaderNodeAttribute');inst_attr.attribute_name='instanceColor';inst_attr.attribute_type='INSTANCER'
        inst_mul=n.new('ShaderNodeMixRGB');inst_mul.blend_type='MULTIPLY';inst_mul.inputs[0].default_value=1
        links.new(inst_attr.outputs['Color'],inst_mul.inputs[1])
        if base_socket:links.new(base_socket,inst_mul.inputs[2])
        else:inst_mul.inputs[2].default_value=color
        base_socket=inst_mul.outputs[0]
    if base_socket:links.new(base_socket,bs.inputs['Base Color'])
    if 'bumpMap' in tex_nodes:
        bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.45;bump.inputs['Distance'].default_value=abs(float(rec.get('bumpScale') or .003));links.new(tex_nodes['bumpMap'].outputs['Color'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])
    if 'normalMap' in tex_nodes:
        normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=(rec.get('normalScale') or [1])[0];links.new(tex_nodes['normalMap'].outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],bs.inputs['Normal'])
    for ch,input_name,component,factor in [('roughnessMap','Roughness','G',rec.get('roughness',.4)),('metalnessMap','Metallic','B',rec.get('metalness',0))]:
        if ch in tex_nodes:
            sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes[ch].outputs['Color'],sep.inputs['Color']);mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=float(factor);links.new(sep.outputs[{'G':'Green','B':'Blue'}[component]],mul.inputs[0]);links.new(mul.outputs[0],bs.inputs[input_name])
    if 'alphaMap' in tex_nodes:
        sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes['alphaMap'].outputs['Color'],sep.inputs['Color']);links.new(sep.outputs['Green'],bs.inputs['Alpha'])
    if 'emissiveMap' in tex_nodes:
        for name in ['Emission Color','Emission']:
            if name in bs.inputs:links.new(tex_nodes['emissiveMap'].outputs['Color'],bs.inputs[name]);break
    materials[rec['id']]=mat
    if rec['id'] in instance_colored:
        geometry_mat=mat.copy();geometry_mat.name=(mat.name+' [GEOMETRY instanceColor]').strip()
        for node in geometry_mat.node_tree.nodes:
            if node.type=='ATTRIBUTE' and getattr(node,'attribute_name','')=='instanceColor':node.attribute_type='GEOMETRY'
        geometry_materials[rec['id']]=geometry_mat
    else:geometry_materials[rec['id']]=mat

geo={g['id']:g for g in scene_data['geometries']}; loaded={}; mesh_cache={}; template_objects={}; imported_triangles=0; collapsed_instance_count=0;collapsed_triangle_count=0
linked_instance_count=0; sheared_instance_count=0; sheared_vertex_count=0; sheared_triangle_count=0; max_trs_residual=0.0; max_shear_residual=0.0
conversion=Matrix.Rotation(math.pi/2,4,'X')
template_collection=bpy.data.collections.new('Geometry Nodes source meshes (hidden; linked, not flattened)')
scene.collection.children.link(template_collection)

def mesh_for(record,g,data,at):
    key=(g['id'],tuple(record['materials']))
    if key in mesh_cache:return mesh_cache[key]
    p=data['position']; indices=data['index']; vcount=len(p); fcount=len(indices)
    mesh=bpy.data.meshes.new((record['name'] or 'source-mesh-'+str(at))[:60]+' source')
    mesh.vertices.add(vcount);mesh.vertices.foreach_set('co',p.astype(np.float32,copy=False).ravel())
    faces=indices.astype(np.int32,copy=False)
    mesh.loops.add(faces.size);mesh.loops.foreach_set('vertex_index',faces.ravel())
    mesh.polygons.add(fcount);mesh.polygons.foreach_set('loop_start',np.arange(fcount,dtype=np.int32)*3);mesh.polygons.foreach_set('loop_total',np.full(fcount,3,dtype=np.int32));mesh.polygons.foreach_set('use_smooth',np.ones(fcount,dtype=np.bool_));mesh.update(calc_edges=True)
    if 'normal' in data:
        try:mesh.normals_split_custom_set_from_vertices(data['normal'].astype(np.float32,copy=False).tolist())
        except Exception as e:report['warnings'].append('Custom normals '+str(record['name'])+': '+str(e))
    if 'uv' in data:
        uv=data['uv'][faces.ravel(),:2].astype(np.float32,copy=False);layer=mesh.uv_layers.new(name='sourceUV');layer.data.foreach_set('uv',uv.ravel())
    needs_color=any(material_records[mid].get('vertexColors') for mid in record['materials'])
    if needs_color:
        colors=np.ones((vcount,4),dtype=np.float32)
        if 'color' in data:colors[:,:min(4,data['color'].shape[1])]=data['color'][:,:4]
        attr=mesh.color_attributes.new(name='sourceColor',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',colors.ravel())
    if any(mid in instance_colored for mid in record['materials']):
        attr=mesh.color_attributes.new(name='instanceColor',type='FLOAT_COLOR',domain='POINT');white=np.ones((vcount,4),dtype=np.float32);attr.data.foreach_set('color',white.ravel())
    for mid in record['materials']:mesh.materials.append(materials[mid])
    if len(record['materials'])>1 and g['groups']:
        owners=np.zeros(fcount,dtype=np.int32)
        for group in g['groups']:owners[group['start']//3:(group['start']+group['count'])//3]=group.get('materialIndex',0)
        mesh.polygons.foreach_set('material_index',owners)
    mesh_cache[key]=mesh;return mesh

def load_geometry(g):
    if g['id'] not in loaded:
        loaded[g['id']]={k:binary(v).reshape(-1,v['itemSize']) for k,v in g['attributes'].items()}
        loaded[g['id']]['index']=binary(g['index']).reshape(-1,3).astype(np.int64)
    return loaded[g['id']]

def use_geometry_variant(obj,material_ids):
    for i,mid in enumerate(material_ids):
        if mid not in instance_colored:continue
        slot=obj.material_slots[i];slot.link='OBJECT';slot.material=geometry_materials[mid]

def build_gn_group(template):
    tree=bpy.data.node_groups.new('Exact linked source instances (orthogonal TRS only)','GeometryNodeTree')
    geo_in=tree.interface.new_socket(name='Points',in_out='INPUT',socket_type='NodeSocketGeometry')
    geo_out=tree.interface.new_socket(name='Instances',in_out='OUTPUT',socket_type='NodeSocketGeometry')
    nodes=tree.nodes;links=tree.links;gin=nodes.new('NodeGroupInput');gout=nodes.new('NodeGroupOutput')
    obj_info=nodes.new('GeometryNodeObjectInfo');obj_info.transform_space='ORIGINAL';obj_info.inputs['Object'].default_value=template;obj_info.inputs['As Instance'].default_value=True
    rotate_attr=nodes.new('GeometryNodeInputNamedAttribute');rotate_attr.data_type='FLOAT_VECTOR';rotate_attr.inputs['Name'].default_value='sourceRotationEuler'
    scale_attr=nodes.new('GeometryNodeInputNamedAttribute');scale_attr.data_type='FLOAT_VECTOR';scale_attr.inputs['Name'].default_value='sourceScale'
    euler=nodes.new('FunctionNodeEulerToRotation');links.new(rotate_attr.outputs['Attribute'],euler.inputs['Euler'])
    color_attr=nodes.new('GeometryNodeInputNamedAttribute');color_attr.data_type='FLOAT_COLOR';color_attr.inputs['Name'].default_value='instanceColor'
    store_color=nodes.new('GeometryNodeStoreNamedAttribute');store_color.data_type='FLOAT_COLOR';store_color.domain='POINT';store_color.inputs['Name'].default_value='instanceColor';links.new(gin.outputs[geo_in.name],store_color.inputs['Geometry']);links.new(color_attr.outputs['Attribute'],store_color.inputs['Value'])
    instance=nodes.new('GeometryNodeInstanceOnPoints');links.new(store_color.outputs['Geometry'],instance.inputs['Points']);links.new(obj_info.outputs['Geometry'],instance.inputs['Instance']);links.new(euler.outputs['Rotation'],instance.inputs['Rotation']);links.new(scale_attr.outputs['Attribute'],instance.inputs['Scale']);links.new(instance.outputs['Instances'],gout.inputs[geo_out.name])
    return tree

for at,record in enumerate(scene_data['meshes']):
    g=geo[record['geometry']];data=load_geometry(g);p=data['position'];indices=data['index'];fcount=len(indices);vcount=len(p)
    source_mesh=mesh_for(record,g,data,at);world=Matrix(np.array(record['matrix'],dtype=np.float64).reshape(4,4).T.tolist());objname=(record['name'] or 'source-object-'+str(at))[:56]
    if 'instanceMatrices' not in record:
        obj=bpy.data.objects.new(objname,source_mesh);scene.collection.objects.link(obj);obj.matrix_world=world;use_geometry_variant(obj,record['materials']);imported_triangles+=fcount
        continue
    count=record['instances'];raw=binary(record['instanceMatrices']).reshape(count,4,4).transpose(0,2,1);instance_colors=binary(record['instanceColors']).reshape(count,3) if 'instanceColors' in record else None
    good=[];bad=[];positions=[];rotations=[];scales=[];all_dets=np.linalg.det(raw[:,:3,:3]);valid=np.isfinite(all_dets)&(np.abs(all_dets)>1e-12)
    if not np.all(valid):
        collapsed_instance_count+=int(np.count_nonzero(~valid));collapsed_triangle_count+=int(np.count_nonzero(~valid))*fcount;report.setdefault('excludedCollapsedInstances',[]).append({'name':record['name'],'count':int(np.count_nonzero(~valid)),'reason':'Singular source transform has no invertible normal matrix; excluded only because it has zero or near-zero area.'})
    for i in np.flatnonzero(valid):
        m=Matrix(raw[i].tolist());loc,quat,scale=m.decompose();recon=Matrix.LocRotScale(loc,quat,scale)
        residual=max(abs(float(m[r][c]-recon[r][c])) for r in range(3) for c in range(3))
        normalized=[];linear=raw[i,:3,:3];lens=np.linalg.norm(linear,axis=0)
        gram=linear.T@linear
        for a in range(3):
            for b in range(a+1,3):normalized.append(abs(float(gram[a,b]/max(lens[a]*lens[b],1e-30))))
        shear=max(normalized,default=0.0)
        if shear>1e-7:
            bad.append(int(i));max_shear_residual=max(max_shear_residual,shear)
        else:
            good.append(int(i));positions.append(tuple(loc));rotations.append(tuple(quat.to_euler('XYZ')));scales.append(tuple(scale));max_trs_residual=max(max_trs_residual,residual)
    if good:
        point_mesh=bpy.data.meshes.new((objname+' points')[:62]);point_mesh.vertices.add(len(good));point_mesh.vertices.foreach_set('co',np.asarray(positions,dtype=np.float32).ravel())
        rotattr=point_mesh.attributes.new(name='sourceRotationEuler',type='FLOAT_VECTOR',domain='POINT');rotattr.data.foreach_set('vector',np.asarray(rotations,dtype=np.float32).ravel())
        scaleattr=point_mesh.attributes.new(name='sourceScale',type='FLOAT_VECTOR',domain='POINT');scaleattr.data.foreach_set('vector',np.asarray(scales,dtype=np.float32).ravel())
        pointcolors=np.ones((len(good),4),dtype=np.float32)
        if instance_colors is not None:pointcolors[:,:3]=instance_colors[good]
        colorattr=point_mesh.attributes.new(name='instanceColor',type='FLOAT_COLOR',domain='POINT');colorattr.data.foreach_set('color',pointcolors.ravel())
        points=bpy.data.objects.new(objname+' linked instances',point_mesh);scene.collection.objects.link(points);points.matrix_world=world
        mod=points.modifiers.new('Linked source geometry; exact TRS matrices','NODES')
        template=template_objects.get((g['id'],tuple(record['materials'])))
        if template is None:
            template=bpy.data.objects.new((objname+' source geometry')[:62],source_mesh);template_collection.objects.link(template);template.hide_render=True;template.hide_set(True);template_objects[(g['id'],tuple(record['materials']))]=template
        mod.node_group=build_gn_group(template)
        linked_instance_count+=len(good);imported_triangles+=len(good)*fcount
    if bad:
        n=len(bad);coords=np.empty((n*vcount,3),dtype=np.float32);normals=np.empty_like(coords) if 'normal' in data else None
        faces=np.tile(indices[None,:,:],(n,1,1)).astype(np.int64,copy=False)+(np.arange(n,dtype=np.int64)*vcount)[:,None,None]
        colors=np.ones((n*vcount,4),dtype=np.float32) if any(material_records[mid].get('vertexColors') for mid in record['materials']) else None
        if colors is not None and 'color' in data:colors[:,:min(4,data['color'].shape[1])]=np.tile(data['color'],(n,1))[:,:4]
        shear_instance_colors=np.ones((n*vcount,4),dtype=np.float32) if any(mid in instance_colored for mid in record['materials']) else None
        if shear_instance_colors is not None and instance_colors is not None:
            for j,i in enumerate(bad):shear_instance_colors[j*vcount:(j+1)*vcount,:3]=instance_colors[i]
        uv=data['uv'][faces.reshape(-1)%vcount,:2].astype(np.float32,copy=False) if 'uv' in data else None
        for j,i in enumerate(bad):
            transform=raw[i];sl=slice(j*vcount,(j+1)*vcount);coords[sl]=p@transform[:3,:3].T+transform[:3,3]
            if normals is not None:
                ns=data['normal']@np.linalg.inv(transform[:3,:3]);length=np.maximum(np.linalg.norm(ns,axis=1),1e-12);normals[sl]=ns/length[:,None]
            if np.linalg.det(transform[:3,:3])<0:faces[j]=faces[j][:,[0,2,1]]
        mesh=bpy.data.meshes.new((objname+' exact affine shears')[:62]);mesh.vertices.add(len(coords));mesh.vertices.foreach_set('co',coords.ravel());mesh.loops.add(faces.size);mesh.loops.foreach_set('vertex_index',faces.ravel().astype(np.int32));mesh.polygons.add(len(faces.reshape(-1,3)));mesh.polygons.foreach_set('loop_start',np.arange(len(faces.reshape(-1,3)),dtype=np.int32)*3);mesh.polygons.foreach_set('loop_total',np.full(len(faces.reshape(-1,3)),3,dtype=np.int32));mesh.polygons.foreach_set('use_smooth',np.ones(len(faces.reshape(-1,3)),dtype=np.bool_));mesh.update(calc_edges=True)
        if normals is not None:
            try:mesh.normals_split_custom_set_from_vertices(normals.tolist())
            except Exception as e:report['warnings'].append('Sheared custom normals '+str(record['name'])+': '+str(e))
        if uv is not None:uvlayer=mesh.uv_layers.new(name='sourceUV');uvlayer.data.foreach_set('uv',uv.ravel())
        if colors is not None:attr=mesh.color_attributes.new(name='sourceColor',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',colors.ravel())
        if shear_instance_colors is not None:attr=mesh.color_attributes.new(name='instanceColor',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',shear_instance_colors.ravel())
        for mid in record['materials']:mesh.materials.append(geometry_materials[mid])
        if len(record['materials'])>1 and g['groups']:
            owners=np.zeros(fcount,dtype=np.int32)
            for group in g['groups']:owners[group['start']//3:(group['start']+group['count'])//3]=group.get('materialIndex',0)
            mesh.polygons.foreach_set('material_index',np.tile(owners,n))
        baked=bpy.data.objects.new(objname+' baked affine shear subset',mesh);scene.collection.objects.link(baked);baked.matrix_world=world
        sheared_instance_count+=n;sheared_vertex_count+=len(coords);sheared_triangle_count+=len(faces.reshape(-1,3));imported_triangles+=len(faces.reshape(-1,3))
    if at%50==0:print('SOURCE_MESH',at,'/',len(scene_data['meshes']),'linked',linked_instance_count,'affine-baked',sheared_instance_count,flush=True)

report['affinePreservation']={'parentMatrices':'Retained as full source object matrices; all 1933 exported parent matrices are orthogonal/no shear.','linkedLocalMatrices':'Geometry Nodes Object Info + Instance on Points with TRS decomposition only for matrices with normalized column shear residual <= 1e-7; retained translations, rotations and scales.','linkedInstances':linked_instance_count,'bakedShearedInstances':sheared_instance_count,'bakedShearedTriangles':sheared_triangle_count,'bakedShearedVertices':sheared_vertex_count,'maxLinkedTRSMatrixResidual':max_trs_residual,'maxBakedShearResidual':max_shear_residual,'flattenedOnlyForShearedTransforms':True,'geometryDecimated':False}


# Physical incident-light boundary: sky outside the real room plus the source sun.
# Native interior area/spot/hemisphere proxies approximate transport and would
# double-count the bounced light now solved by Cycles. They are not imported.
report['omittedNativeLightProxies']=[]
physical_lights=[]
sun_rec=next(r for r in scene_data['lights'] if r['type']=='DirectionalLight')
sun_from_target=(Vector(sun_rec['matrix'][12:15])-Vector(sun_rec['target'])).normalized()
for rec in scene_data['lights']:
    if rec['type'] not in ['DirectionalLight','PointLight']:
        report['omittedNativeLightProxies'].append({'name':rec['name'],'type':rec['type'],'intensity':rec['intensity'],'reason':'Native unoccluded indirect/finite-window approximation replaced by shadowed exterior sky and actual multi-bounce transport.'});continue
    typ='SUN' if rec['type']=='DirectionalLight' else 'POINT'
    light=bpy.data.lights.new(rec['name'],typ);light.color=rec['color']
    obj=bpy.data.objects.new(rec['name'],light);scene.collection.objects.link(obj);obj.matrix_world=Matrix(np.asarray(rec['matrix']).reshape(4,4).T.tolist())
    if typ=='SUN':
        light.energy=float(os.environ.get('CYCLES_SUN_ENERGY','90'))
        light.angle=math.radians(float(os.environ.get('CYCLES_SUN_ANGLE','0.53')))
        if MODE=='verified-upper-window':
            # Optional comparison is allowed only after an actual geometry ray test.
            target=Vector((0,4.4,-1.4));aperture=Vector((-6.80,5.18,-4.50))
            sun_from_target=(aperture-target).normalized();obj.location=target+sun_from_target*40
            rec_target=target
        else:rec_target=Vector(rec['target'])
        obj.rotation_euler=(rec_target-obj.location).to_track_quat('-Z','Y').to_euler()
    else:
        light.energy=rec['intensity']*4*math.pi*float(os.environ.get('CYCLES_PRACTICAL_GAIN','1'))
        light.shadow_soft_size=.045
    physical_lights.append({'name':obj.name,'type':typ,'colorLinear':list(light.color),'energy':light.energy,'positionYUp':list(obj.location)})

cam_data=bpy.data.cameras.new('source-reference-camera');camera=bpy.data.objects.new('source-reference-camera',cam_data);scene.collection.objects.link(camera)
camera.matrix_world=Matrix(np.asarray(scene_data['cameraMatrix']).reshape(4,4).T.tolist());cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=24
cam_data.lens=12/math.tan(math.radians(scene_data['view']['fov'])/2);cam_data.clip_start=.10;cam_data.clip_end=260;scene.camera=camera
bpy.context.view_layer.update()
for obj in list(scene.objects):obj.matrix_world=conversion@obj.matrix_world
bpy.context.view_layer.update()
report['worldCoordinateConversion']='All source mesh objects, source lights, linked-instance parents and source camera jointly rotated +90 degrees about X: Y-up to Z-up, no deformation.'
report['physicalLights']=physical_lights

# Rays are measured against the actual imported opaque geometry, never a mask.
depsgraph=bpy.context.evaluated_depsgraph_get()
def trace_yup(origin,direction,distance=80):
    origin3=conversion.to_3x3()@Vector(origin);direction3=(conversion.to_3x3()@Vector(direction)).normalized()
    hit,loc,normal,index,obj,matrix=scene.ray_cast(depsgraph,origin3,direction3,distance=distance)
    return {'clearToExterior':not hit,'firstOccluder':obj.name if hit else None,'hitYUp':list(conversion.inverted().to_3x3()@loc) if hit else None}
ray_samples=[]
for label,point in [('central-face',(0,5.13,-1.78)),('main-raised-hand',(-.36,4.68,-1.89)),('legacy-aperture-target',(0,4.4,-1.4)),('foreground-floor',(0,.035,3.5)),('front-left-floor',(-3,.035,4))]:
    ray_samples.append({'sample':label,'originYUp':point,'directionToSunYUp':list(sun_from_target),'geometryRay':trace_yup(point,sun_from_target)})
floor_sun=[]
for x in [-4,-3,-2,-1,0,1,2,3,4]:
    for z in [0,1,2,3,4,5,6,7,8]:
        result=trace_yup((x,.035,z),sun_from_target)
        if result['clearToExterior']:floor_sun.append([x,.035,z])
legacy_dir=(Vector((-6.80,5.18,-4.50))-Vector((0,4.4,-1.4))).normalized()
legacy_probe=trace_yup((0,4.4,-1.4),legacy_dir)
report['actualApertureAudit']={'method':'Cycles scene.ray_cast against imported opaque geometry, after exact instance/affine import and coordinate conversion; no volume shell during audit.','sourceSunDirectionYUp':list(sun_from_target),'keyRays':ray_samples,'floorGridClearSunRaysYUp':floor_sun,'testedFloorGridSamples':81,'legacyUpperWindowCandidate':{'targetYUp':[0,4.4,-1.4],'apertureYUp':[-6.80,5.18,-4.50],'ray':legacy_probe,'applied':MODE=='verified-upper-window'}}
if MODE=='verified-upper-window' and not legacy_probe['clearToExterior']:raise RuntimeError('Legacy upper-window fit is occluded by actual R9 geometry; refusing to present it as an open ray.')

# Sky radiance is a uniform exterior illumination boundary; room occlusion is
# solved for every path. No camera-only world, reference image or envmap plate.
world=bpy.data.worlds.new('Exterior daylight through actual apertures');scene.world=world;world.use_nodes=True
nodes=world.node_tree.nodes;nodes.clear();links=world.node_tree.links
background=nodes.new('ShaderNodeBackground');background.name='Scene06 exterior sky radiance'
background.inputs['Color'].default_value=(1.0,.94,.82,1)
background.inputs['Strength'].default_value=float(os.environ.get('CYCLES_SKY_STRENGTH','6.0'))
output=nodes.new('ShaderNodeOutputWorld');links.new(background.outputs[0],output.inputs['Surface'])
report['exteriorSkyBoundary']={'type':'Uniform exterior sky radiance, visible only through actual room openings and shared by camera/diffuse/glossy paths','linearColor':[1,.94,.82],'strength':background.inputs['Strength'].default_value,'sourcePixelTextureUsed':False,'nativeCubeEnvironmentImported':False,'nativeHemisphereImported':False}

# A genuine low-extinction participating medium. No emission, view-facing
# geometry, additive ray quads, volumetric shader screenshots or light masks.
density=float(os.environ.get('CYCLES_HAZE_DENSITY','.0025'))
if density>0:
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0));fog=bpy.context.object;fog.name='Physical room air: bounded homogeneous scattering only'
    fog.matrix_world=conversion@Matrix.Translation(Vector((0,3.60,2.10)));fog.scale=(13.58,7.16,15.78)
    # Setting scale after a world rotation acts along local axes, preserving Y-up box bounds.
    fogmat=bpy.data.materials.new('Room air extinction and forward scattering; zero emission');fogmat.use_nodes=True;fn=fogmat.node_tree.nodes;fn.clear();fl=fogmat.node_tree.links
    scatter=fn.new('ShaderNodeVolumeScatter');scatter.name='Scene06 real air scattering';scatter.inputs['Color'].default_value=(.97,.98,1,1);scatter.inputs['Density'].default_value=density;scatter.inputs['Anisotropy'].default_value=float(os.environ.get('CYCLES_HAZE_ANISOTROPY','.35'))
    absorption=fn.new('ShaderNodeVolumeAbsorption');absorption.inputs['Color'].default_value=(.94,.97,1,1);absorption.inputs['Density'].default_value=density*.08
    add=fn.new('ShaderNodeAddShader');fl.new(scatter.outputs[0],add.inputs[0]);fl.new(absorption.outputs[0],add.inputs[1]);fout=fn.new('ShaderNodeOutputMaterial');fl.new(add.outputs[0],fout.inputs['Volume']);fog.data.materials.append(fogmat)
report['participatingMedium']={'type':'Actual volume scatter plus absorption','boundsYUp':{'x':[-6.79,6.79],'y':[.02,7.18],'z':[-5.79,9.99]},'scatteringDensityPerMetre':density,'absorptionDensityPerMetre':density*.08,'anisotropy':float(os.environ.get('CYCLES_HAZE_ANISOTROPY','.35')),'emission':0,'nativeDisplayVolumePlanesImported':False,'requiresActualApertureLightVisibility':True}

scene.render.engine='CYCLES';scene.cycles.samples=128;scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE'
scene.cycles.max_bounces=12;scene.cycles.diffuse_bounces=6;scene.cycles.glossy_bounces=6;scene.cycles.transmission_bounces=8;scene.cycles.volume_bounces=2;scene.cycles.transparent_max_bounces=8;scene.cycles.sample_clamp_indirect=12
scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.025
requested_device=os.environ.get('CYCLES_DEVICE','METAL')
if requested_device=='METAL':
    prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
    for dev in prefs.devices:dev.use=dev.type=='METAL'
    available=[dev.name for dev in prefs.devices if dev.type=='METAL'];assert available,'No Metal device available';scene.cycles.device='GPU';report['device']={'type':'METAL','names':available}
else:scene.cycles.device='CPU';report['device']={'type':'CPU'}
scene.render.resolution_x=scene.render.resolution_y=1254;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8'
scene.render.threads_mode='FIXED';scene.render.threads=int(os.environ.get('CYCLES_THREADS','4'))
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=float(os.environ.get('CYCLES_EXPOSURE','.45'))
# Optional camera subfrustum: actual new rays at full output resolution.
crop=''
if crop:
    x,y,size,full=[float(v) for v in crop.split(',')];assert 0<=x and 0<=y and size>0 and x+size<=full and y+size<=full
    original_frame=[v.copy() for v in cam_data.view_frame(scene=scene)]
    original_slopes=np.asarray([(v.x/-v.z,v.y/-v.z) for v in original_frame]);l,b=original_slopes.min(axis=0);r,t=original_slopes.max(axis=0)
    desired=np.array([l+(r-l)*x/full,r-(r-l)*(full-x-size)/full,b+(t-b)*(full-y-size)/full,t-(t-b)*y/full])
    cam_data.lens*=full/size
    def frame_bounds():
        slopes=np.asarray([(v.x/-v.z,v.y/-v.z) for v in cam_data.view_frame(scene=scene)]);lo=slopes.min(axis=0);hi=slopes.max(axis=0);return np.array([lo[0],hi[0],lo[1],hi[1]])
    initial=frame_bounds();cam_data.shift_x=1;dx=(frame_bounds()-initial)[0];cam_data.shift_x=0
    cam_data.shift_y=1;dy=(frame_bounds()-initial)[2];cam_data.shift_y=0
    cam_data.shift_x=float((desired[0]-initial[0])/dx);cam_data.shift_y=float((desired[2]-initial[2])/dy)
    actual=frame_bounds();error=float(np.max(np.abs(actual-desired)));assert error<2e-6,(actual,desired,error)
    report['trueSubfrustum']={'cropInFullSourcePixels':[x,y,size,full],'outputResolution':scene.render.resolution_x,'sourceCameraMatrixUnchanged':True,'lensMm':cam_data.lens,'shift':[cam_data.shift_x,cam_data.shift_y],'desiredCameraLocalRaySlopes':desired.tolist(),'actualCameraLocalRaySlopes':actual.tolist(),'maxAbsoluteRaySlopeError':error,'upsampledScreenshot':False}
render_name='scene06-nc-adoption179-r06-cycles-full-CC-BY-NC-SA-4.0.png';assert Path(render_name).name==render_name;scene.render.filepath=str(OUT/render_name)
report['materialAttributeParity']={'linkedInstances':'Instancer attribute plus explicit Geometry Nodes Store Named Attribute','bakedShearAndDirect':'Geometry-domain material variants, direct white instanceColor fallback and actual RGB for baked shear','vertexColors':'sourceColor multiplied only when source vertexColors is true','uvTransform':'Exact Three.js rotation, repeat, center, offset and flipY','deduplicatedImageBuffers':len(image_cache),'textureCoordinatesAndPixelsPreserved':True}
report['importedTriangles']=imported_triangles;report['sourceTriangleCount']=scene_data['statistics']['triangles'];report['geometryTriangleCountPreserved']=imported_triangles==scene_data['statistics']['triangles'];report['excludedCollapsedTriangles']=collapsed_triangle_count;report['noncollapsedSourceTriangleCount']=scene_data['statistics']['triangles']-collapsed_triangle_count;report['renderableTriangleCountPreserved']=imported_triangles==report['noncollapsedSourceTriangleCount'];assert report['renderableTriangleCountPreserved']
report['excludedCollapsedInstanceCount']=collapsed_instance_count
report['physicalVarnishCalibration']={'sourceClearcoatRoughness':.17,'cyclesClearcoatRoughness':varnish_coat_roughness,'sourceClearcoatWeight':.72,'sourceBaseAlbedoAndRoughnessMapKept':True,'reason':'Native floor GLSL samples room-reflection radiance with a custom small image footprint; Cycles instead uses actual ray-traced clearcoat with an explicitly calibrated physical lobe. This is not native pixel parity.'}
report['materialTransfer']='Exported linear PBR colors, all source map/bump/roughness textures, metallic, roughness, transmission and clearcoat parameters. Cycles Principled BSDF is a physical cross-renderer approximation; native GLSL hooks, PMREM cube environment, tone mapping and screen-space reflector are not ported. Actual imported floor reflects actual room geometry through its physical clearcoat.'
report['lightCalibration']={'sunDirection':'Exact exported source direction unless a separately declared verified-upper-window experiment is selected','sunEnergyWPerSquareMetre':float(os.environ.get('CYCLES_SUN_ENERGY','90')),'sunEnergyNotPhotometricEquivalence':True,'nativeIndirectProxiesRemoved':True,'actualMultiBounceGI':True,'maxBounces':12,'diffuseBounces':6,'glossyBounces':6,'volumeBounces':2,'practicals':'Point source source intensity * 4pi physical power calibration; actual lamp positions retained','exteriorRadianceCalibration':'Exterior daylight strength is an explicitly calibrated boundary, not a measured HDR environment','exposureEV':scene.view_settings.exposure,'toneMap':'AgX Medium High Contrast; Three ACESFilmic differs','nativeWebglPixelEquivalence':False}
report['camera']={'sourcePositionYUp':scene_data['view']['position'],'sourceFovDegrees':scene_data['view']['fov'],'sourceMatrix':scene_data['cameraMatrix'],'depthOfField':False}
report['scopeLimits']=['Same actual native R06 sculpture, thin flared lotus geometry and whole repaired room. Exact source geometry, matrices, UVs, colors and full low reference camera retained.','Actual Scan-the-World Sainsbury Japanese Amida central source under CC BY-NC-SA4.0; raw source face/anatomy retained under positive uniform runtime fit. Different artifact from reference; independent CC BY attendant heads retained.','Exact face likeness, ornament pattern, proportions and photographic fidelity remain unaccepted.','Exported source-frame.rgba is provenance evidence only and is never loaded as a texture or background.']
report['status']='rendering';(OUT/'report.json').write_text(json.dumps(report,indent=2))
report['blendSaved']=False
bpy.ops.render.render(write_still=True)
report['output']=str(OUT/render_name);report['sha256']=hashlib.sha256((OUT/render_name).read_bytes()).hexdigest();report['elapsedSeconds']=time.time()-report['started'];report['resolution']=[scene.render.resolution_x,scene.render.resolution_y];report['samples']=scene.cycles.samples;report['status']='path-traced-review';report['finished']=time.time()
(OUT/'report.json').write_text(json.dumps(report,indent=2));print('SCENE06_CYCLES_REPORT',json.dumps({k:report[k] for k in ['status','output','elapsedSeconds','sha256','visualAccepted']}),flush=True)
