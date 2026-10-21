"""Scene08 physical review of the verified existing Three.js reconstruction.
Exact indexed source geometry, RGB and full affine transforms are retained.
Orthogonal transforms stay instanced; shears are baked without simplification.
Generic importer derived from the repository Scene02/Scene06 transfer, copied
locally under Scene08 ownership; no temple reconstruction happens in Blender.
"""
import bpy,json,math,os,sys,time,hashlib
from pathlib import Path
import numpy as np
from mathutils import Matrix,Vector,Quaternion
HERE=Path(__file__).resolve().parent
ROOT=Path(os.environ.get('SCENE_PACKAGE',str(HERE/'export-r03'))).resolve()
OUT=Path(os.environ.get('CYCLES_OUTPUT',str(HERE/'cycles-r03'))).resolve();OUT.mkdir(parents=True,exist_ok=True)
MODE='scene08-current-source-affine-PBR-and-measured-radiance'
scene_data=json.loads((ROOT/'scene.json').read_text());source_export=json.loads((ROOT/'export-report.json').read_text())
assert source_export['status']=='exported-existing-geometry'
assert source_export['sourceHash']==os.environ['SCENE_EXPECTED_HASH'], 'Current source export is not the expected frozen candidate'
assert scene_data['view']['reference']==8
report={'genericImporterProvenance':{'source':'lookdev/scene02-monumental-v2/render-physical161-r03.py','sha256':'b5ee093d5002faf7d1364479f0e6541ba78a1c31142c19172a413e935519f284'},'sourceCommit':source_export['sourceCommit'],'sourceHash':source_export['sourceHash'],'exportSceneSha256':hashlib.sha256((ROOT/'scene.json').read_bytes()).hexdigest(),'renderScript':{'file':Path(__file__).name,'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'sourceStatistics':scene_data['statistics'],'lightingMode':MODE,'blender':bpy.app.version_string,'scope':scene_data['renderingScope'],'geometryRebuilt':False,'excluded':scene_data['excluded'],'warnings':[],'status':'importing','started':time.time(),'visualAccepted':False,'photographicAcceptance':False}
for asset,info in source_export['exportedAssets'].items():
    assert hashlib.sha256((ROOT/'assets'/asset).read_bytes()).hexdigest()==info['sha256'],asset
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
timber_ids=set() # Scene08 pigment/roughness is already baked into portable PBR textures.
for rec in scene_data['materials']:
    mat=bpy.data.materials.new(rec['name'] or rec['id']);mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();links=mat.node_tree.links
    bs=n.new('ShaderNodeBsdfPrincipled');out=n.new('ShaderNodeOutputMaterial');links.new(bs.outputs['BSDF'],out.inputs['Surface'])
    color=tuple(rec.get('color') or [.5,.5,.5])+ (1,)
    value(bs,['Base Color'],color);value(bs,['Metallic'],float(rec.get('metalness') or 0));value(bs,['Roughness'],max(.04,float(rec.get('roughness') or .4)))
    value(bs,['IOR'],float(rec.get('ior') or 1.5));value(bs,['Transmission Weight','Transmission'],float(rec.get('transmission') or 0))
    value(bs,['Specular IOR Level'],.5*float(rec.get('specularIntensity') if rec.get('specularIntensity') is not None else 1))
    value(bs,['Coat Weight','Clearcoat'],float(rec.get('clearcoat') or 0));value(bs,['Coat Roughness','Clearcoat Roughness'],float(rec.get('clearcoatRoughness') or .15))
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
        map_color=tex_nodes['map'].outputs['Color']
        mul=n.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;mul.inputs[2].default_value=color;links.new(map_color,mul.inputs[1]);base_socket=mul.outputs[0]
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
            sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes[ch].outputs['Color'],sep.inputs['Color']);mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=float(factor);links.new(sep.outputs[{'G':'Green','B':'Blue'}[component]],mul.inputs[0]);factor_socket=mul.outputs[0]
            links.new(factor_socket,bs.inputs[input_name])
    if 'alphaMap' in tex_nodes:
        sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes['alphaMap'].outputs['Color'],sep.inputs['Color']);links.new(sep.outputs['Green'],bs.inputs['Alpha'])
    if 'emissiveMap' in tex_nodes:
        for name in ['Emission Color','Emission']:
            if name in bs.inputs:links.new(tex_nodes['emissiveMap'].outputs['Color'],bs.inputs[name]);break
    # Energy-conserving physical thin-leaf transport replaces the native
    # shader's unshadowed approximation. It sees actual source occlusion.
    if rec['name'] in ['leaf','leaflight','maple','flower','pine'] or any(k in rec['name'] for k in ['scanned-blade148','scanned-foliage148','periwinkle-plant']):
        thin=n.new('ShaderNodeBsdfTranslucent')
        if base_socket:links.new(base_socket,thin.inputs['Color'])
        else:thin.inputs['Color'].default_value=color
        mix=n.new('ShaderNodeMixShader');mix.inputs[0].default_value=.20 if rec['name']=='pine' else .27;links.new(bs.outputs['BSDF'],mix.inputs[1]);links.new(thin.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],out.inputs['Surface'])
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

gn_expected_audit={}
for at,record in enumerate(scene_data['meshes']):
    g=geo[record['geometry']];data=load_geometry(g);p=data['position'];indices=data['index'];fcount=len(indices);vcount=len(p)
    source_mesh=mesh_for(record,g,data,at);world=Matrix(np.array(record['matrix'],dtype=np.float64).reshape(4,4).T.tolist());objname=(record['name'] or 'source-object-'+str(at))[:56]
    if 'instanceMatrices' not in record:
        obj=bpy.data.objects.new(objname,source_mesh);scene.collection.objects.link(obj);obj.matrix_world=world;use_geometry_variant(obj,record['materials']);imported_triangles+=fcount
        continue
    native_timber=any(mid in timber_ids for mid in record['materials']) and 'timberExtent' in data
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
        if shear>1e-7 or native_timber:
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
        if len(gn_expected_audit)<40:
            gn_expected_audit[points.name]=[{'matrix':np.asarray(world)@raw[i],'bestResidual':1e30} for i in good[:4]]
        linked_instance_count+=len(good);imported_triangles+=len(good)*fcount
    if bad:
        n=len(bad);coords=np.empty((n*vcount,3),dtype=np.float32);normals=np.empty_like(coords) if 'normal' in data else None
        faces=np.tile(indices[None,:,:],(n,1,1)).astype(np.int64,copy=False)+(np.arange(n,dtype=np.int64)*vcount)[:,None,None]
        colors=np.ones((n*vcount,4),dtype=np.float32) if any(material_records[mid].get('vertexColors') for mid in record['materials']) else None
        if colors is not None and 'color' in data:colors[:,:min(4,data['color'].shape[1])]=np.tile(data['color'],(n,1))[:,:4]
        shear_instance_colors=np.ones((n*vcount,4),dtype=np.float32) if any(mid in instance_colored for mid in record['materials']) else None
        if shear_instance_colors is not None and instance_colors is not None:
            for j,i in enumerate(bad):shear_instance_colors[j*vcount:(j+1)*vcount,:3]=instance_colors[i]
        uv=None
        metric_uv=np.empty((n*vcount,2),dtype=np.float32) if native_timber else None
        for j,i in enumerate(bad):
            transform=raw[i];sl=slice(j*vcount,(j+1)*vcount);coords[sl]=p@transform[:3,:3].T+transform[:3,3]
            if normals is not None:
                ns=data['normal']@np.linalg.inv(transform[:3,:3]);length=np.maximum(np.linalg.norm(ns,axis=1),1e-12);normals[sl]=ns/length[:,None]
            if np.linalg.det(transform[:3,:3])<0:faces[j]=faces[j][:,[0,2,1]]
            if native_timber:
                member_scale=np.linalg.norm(transform[:3,:3],axis=0);spans=data['timberExtent'][0]*member_scale;pm=p*member_scale;nn=np.abs(data['normal']);pair=np.empty((vcount,2),dtype=np.float64)
                if spans[1]>=spans[0] and spans[1]>=spans[2]:pair[:,0]=pm[:,1];pair[:,1]=np.where(nn[:,0]>nn[:,2],pm[:,2],pm[:,0])
                elif spans[0]>=spans[2]:pair[:,0]=pm[:,0];pair[:,1]=np.where(nn[:,1]>nn[:,2],pm[:,2],pm[:,1])
                else:pair[:,0]=pm[:,2];pair[:,1]=np.where(nn[:,1]>nn[:,0],pm[:,0],pm[:,1])
                h=math.sin(float(transform[:3,3]@np.array([12.713,4.13,5.71])))*43758.5453;offset=h-math.floor(h);pair+=np.array([offset,offset*.37]);metric_uv[sl]=pair
        if native_timber:uv=metric_uv[faces.reshape(-1)]
        elif 'uv' in data:uv=data['uv'][faces.reshape(-1)%vcount,:2].astype(np.float32,copy=False)
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

report['affinePreservation']={'parentMatrices':'Retained as full exported source object matrices.','linkedLocalMatrices':'Geometry Nodes Object Info + Instance on Points with TRS decomposition only for matrices with normalized column shear residual <= 1e-7; retained translations, rotations and scales.','linkedInstances':linked_instance_count,'bakedShearedInstances':sheared_instance_count,'bakedShearedTriangles':sheared_triangle_count,'bakedShearedVertices':sheared_vertex_count,'maxLinkedTRSMatrixResidual':max_trs_residual,'maxBakedShearResidual':max_shear_residual,'flattenedForShearedTransformsAndNativeMetricTimberUV':True,'geometryDecimated':False}



# Exact source framing, converted once with the whole model into Z-up.
SUN=max((r for r in scene_data['lights'] if r['type']=='DirectionalLight'),key=lambda r:r['intensity'])
physical_lights=[]
for rec in scene_data['lights']:
    if rec is not SUN and rec['type']!='PointLight':continue
    typ='SUN' if rec is SUN else 'POINT';ld=bpy.data.lights.new(rec['name'] or 'Scene08 source warm sun',typ);ld.color=rec['color'];obj=bpy.data.objects.new(ld.name,ld);scene.collection.objects.link(obj);obj.matrix_world=Matrix(np.asarray(rec['matrix']).reshape(4,4).T.tolist())
    if typ=='SUN':ld.energy=float(os.environ.get('CYCLES_SUN_ENERGY','4.20'));ld.angle=math.radians(.53);obj.rotation_euler=(Vector(rec['target'])-obj.location).to_track_quat('-Z','Y').to_euler()
    else:ld.energy=rec['intensity']*4*math.pi;ld.shadow_soft_size=.06
    physical_lights.append({'name':obj.name,'type':typ,'energy':ld.energy,'sourceLinearRGB':list(ld.color)})
cam_data=bpy.data.cameras.new('Scene08 exact original reference lens');camera=bpy.data.objects.new(cam_data.name,cam_data);scene.collection.objects.link(camera);camera.matrix_world=Matrix(np.asarray(scene_data['cameraMatrix']).reshape(4,4).T.tolist());cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=36;cam_data.lens=18/math.tan(math.radians(scene_data['view']['fov'])/2);cam_data.clip_start=.06;cam_data.clip_end=10000;scene.camera=camera
cam_data.dof.use_dof=True;cam_data.dof.focus_distance=22.420133808699713;cam_data.dof.aperture_fstop=2.8;cam_data.dof.aperture_blades=9
for obj in list(scene.objects):obj.matrix_world=conversion@obj.matrix_world
bpy.context.view_layer.update()
# Audit actual evaluated instances, independently of the decomposition code.
audit_graph=bpy.context.evaluated_depsgraph_get();audit_conversion=np.asarray(conversion)
for group in gn_expected_audit.values():
    for sample in group:sample['matrix']=audit_conversion@sample['matrix']
for inst in audit_graph.object_instances:
    if not inst.is_instance or not inst.parent:continue
    group=gn_expected_audit.get(inst.parent.original.name)
    if not group:continue
    actual=np.asarray(inst.matrix_world)
    for sample in group:
        if np.max(np.abs(actual[:3,3]-sample['matrix'][:3,3]))<.0001:sample['bestResidual']=min(sample['bestResidual'],float(np.max(np.abs(actual-sample['matrix']))))
rows=[{'parent':parent,'sampledInstances':len(group),'maxAbsoluteMatrixResidual':max(s['bestResidual'] for s in group)} for parent,group in gn_expected_audit.items()]
report['evaluatedGNMatrixAudit']={'groups':rows,'maxAbsoluteMatrixResidual':max(r['maxAbsoluteMatrixResidual'] for r in rows),'tolerance':.0001}
assert report['evaluatedGNMatrixAudit']['maxAbsoluteMatrixResidual']<.0001,'Actual evaluated source instance transform differs'
# Same independent original CC0 measured sky as native, solar-aligned using
# the exact rotation retained in the actual matching native frame receipt.
native=json.loads(Path(os.environ['SCENE_NATIVE_REPORT']).read_text());assert native['source']['hash']==source_export['sourceHash'];sky_info=native['frames'][0]['info']['measuredSky'];sky_path=Path(os.environ['SCENE_WORKTREE'])/sky_info['source'];assert sky_path.is_file()
angles=sky_info['rotation'][:3];rx,ry,rz=angles;cx,sx=math.cos(rx),math.sin(rx);cy,sy=math.cos(ry),math.sin(ry);cz,sz=math.cos(rz),math.sin(rz)
Rx=np.array([[1,0,0],[0,cx,-sx],[0,sx,cx]]);Ry=np.array([[cy,0,sy],[0,1,0],[-sy,0,cy]]);Rz=np.array([[cz,-sz,0],[sz,cz,0],[0,0,1]]);native_rotation=Rx@Ry@Rz
sky_image=bpy.data.images.load(str(sky_path),check_existing=False);sky_image.colorspace_settings.name='Non-Color';sky_image.pack()
lon_steps,lat_steps=128,64;verts=[];radius=3000
for j in range(lat_steps+1):
    lat=(j/lat_steps-.5)*math.pi;cl=math.cos(lat)
    for i in range(lon_steps+1):
        lon=(i/lon_steps-.5)*2*math.pi;v=native_rotation@np.array([cl*math.cos(lon),math.sin(lat),cl*math.sin(lon)]);verts.append((radius*v[0],-radius*v[2],radius*v[1]))
faces=[]
for j in range(lat_steps):
    for i in range(lon_steps):a=j*(lon_steps+1)+i;faces.append((a,a+1,a+lon_steps+2,a+lon_steps+1))
mesh=bpy.data.meshes.new('Original calibrated CC0 sky radiance dome');mesh.from_pydata(verts,[],faces);mesh.update();uv=mesh.uv_layers.new(name='nativeMeasuredRadianceUV')
for poly in mesh.polygons:
    for li in poly.loop_indices:
        j,i=divmod(mesh.loops[li].vertex_index,lon_steps+1);uv.data[li].uv=(i/lon_steps,j/lat_steps)
mat=bpy.data.materials.new('Independent measured sky transport');mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();l=mat.node_tree.links;tex=n.new('ShaderNodeTexImage');tex.image=sky_image;tex.extension='REPEAT';coord=n.new('ShaderNodeTexCoord');l.new(coord.outputs['UV'],tex.inputs['Vector']);em=n.new('ShaderNodeEmission');l.new(tex.outputs['Color'],em.inputs['Color']);path=n.new('ShaderNodeLightPath');mix=n.new('ShaderNodeMix');mix.data_type='FLOAT';mix.inputs[2].default_value=float(os.environ.get('CYCLES_WORLD_GAIN',str(sky_info['environmentIntensity'])));mix.inputs[3].default_value=float(os.environ.get('CYCLES_SKY_GAIN',str(sky_info['cameraRadianceGain'])));l.new(path.outputs['Is Camera Ray'],mix.inputs[0]);l.new(mix.outputs[0],em.inputs['Strength']);out=n.new('ShaderNodeOutputMaterial');l.new(em.outputs[0],out.inputs['Surface']);mesh.materials.append(mat);dome=bpy.data.objects.new('Scene08 original sky radiance boundary',mesh);scene.collection.objects.link(dome);dome.visible_shadow=False
world=bpy.data.worlds.new('Black outside the radiance boundary');world.use_nodes=True;world.node_tree.nodes.get('Background').inputs['Strength'].default_value=0;scene.world=world
report['skyTransfer']={'nativeInfo':sky_info,'exrSha256':hashlib.sha256(sky_path.read_bytes()).hexdigest(),'worldDirectionMapping':'Same XYZ Euler matrix Rx@Ry@Rz, native inverse lookup represented by forward rotated explicit UV dome, then common Y-up to Z-up conversion.','cameraGain':float(os.environ.get('CYCLES_SKY_GAIN',str(sky_info['cameraRadianceGain']))),'otherRayGain':float(os.environ.get('CYCLES_WORLD_GAIN',str(sky_info['environmentIntensity']))),'referencePhotoUsed':False}
report['physicalLights']=physical_lights;report['omittedNativeLightProxies']=[{'type':r['type'],'intensity':r['intensity']} for r in scene_data['lights'] if r is not SUN and r['type']!='PointLight'];report['physicalFoliageAdaptation']='27% energy-conserving diffuse transmission with actual light occlusion;20% pine. Source GLSL thin-leaf approximation is not pixel-equivalent.'
scene.render.engine='CYCLES';scene.cycles.samples=int(os.environ.get('CYCLES_SAMPLES','64'));scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.max_bounces=10;scene.cycles.diffuse_bounces=6;scene.cycles.glossy_bounces=6;scene.cycles.transmission_bounces=8;scene.cycles.volume_bounces=2;scene.cycles.transparent_max_bounces=16;scene.cycles.sample_clamp_indirect=12;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.035
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for dev in prefs.devices:dev.use=dev.type=='METAL'
assert any(dev.use for dev in prefs.devices),'No Metal GPU';scene.cycles.device='GPU'
scene.render.resolution_x=scene.render.resolution_y=int(os.environ.get('CYCLES_SIZE','1254'));scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.threads_mode='FIXED';scene.render.threads=4
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=float(os.environ.get('CYCLES_EXPOSURE','.14'))
report['camera']={'sourcePositionYUp':scene_data['view']['position'],'sourceFovDegrees':scene_data['view']['fov'],'sourceMatrix':scene_data['cameraMatrix'],'unchangedMatrix':True,'sensorHeightMM':36,'physicalFocalLengthMM':cam_data.lens,'focusDistanceM':cam_data.dof.focus_distance,'apertureFStop':cam_data.dof.aperture_fstop}
report['materialTransfer']={'sourceOriginalAssets':'All original compressed declared source assets remain immutable; verified exporter retains file hashes and decoded pixel buffers. Every exported binary and texture hash checked before import.','geometry':'Original indexed positions/indices/normals and complete matrices retained without decimation; shear subsets baked exactly.','RGB':'Original source vertex RGB only when enabled, multiplied separately by exact source per-instance RGB. Linked instances use INSTANCER; direct/shear meshes use GEOMETRY.','paint':'Portable pigmented PBR albedo baked by the actual Scene08 native source; no Blender pigment override.','water':'Exact source-authored meander backing immediately beneath the WebGL-only Reflector. Same source PBR values; real surface transport replaces planar reflection capture.','limits':['Native AO/PMREM/fog and custom GLSL do not match physical ray transport.','ACESFilmic native and AgX are different camera curves.','No photographic acceptance or native pixel equivalence is claimed.']}
report['importedTriangles']=imported_triangles;report['sourceTriangles']=scene_data['statistics']['triangles'];report['excludedCollapsedTriangles']=collapsed_triangle_count;assert imported_triangles==scene_data['statistics']['triangles']-collapsed_triangle_count
report['renderableTriangleCountPreserved']=True;report['resolution']=[scene.render.resolution_x,scene.render.resolution_y];report['samples']=scene.cycles.samples;report['exposureEV']=scene.view_settings.exposure;report['nativeWebglPixelEquivalence']=False;report['visualAccepted']=False;report['status']='rendering';(OUT/'report.json').write_text(json.dumps(report,indent=2))
blend=OUT/'scene08-current-source-physical148.blend';bpy.ops.wm.save_as_mainfile(filepath=str(blend),compress=True);report['blend']=str(blend)
render=OUT/'scene08-current-source-physical148.png';scene.render.filepath=str(render);bpy.ops.render.render(write_still=True)
report['full']={'path':str(render),'sha256':hashlib.sha256(render.read_bytes()).hexdigest(),'resolution':[scene.render.resolution_x,scene.render.resolution_y],'samples':scene.cycles.samples}
if os.environ.get('CYCLES_TRUE_DETAIL','1')=='1':
    original_lens=cam_data.lens;original_fstop=cam_data.dof.aperture_fstop;frame=[v.copy() for v in cam_data.view_frame(scene=scene)];slopes=np.asarray([(v.x/-v.z,v.y/-v.z) for v in frame]);l,b=slopes.min(axis=0);r,t=slopes.max(axis=0);x,y,size,full=320,270,640,1254;desired=np.array([l+(r-l)*x/full,r-(r-l)*(full-x-size)/full,b+(t-b)*(full-y-size)/full,t-(t-b)*y/full]);cam_data.lens*=full/size;focus_mm=cam_data.dof.focus_distance*1000;cam_data.dof.aperture_fstop=original_fstop*(full/size)*(focus_mm-original_lens)/(focus_mm-cam_data.lens)
    def bounds():
        a=np.asarray([(v.x/-v.z,v.y/-v.z) for v in cam_data.view_frame(scene=scene)]);lo=a.min(axis=0);hi=a.max(axis=0);return np.array([lo[0],hi[0],lo[1],hi[1]])
    initial=bounds();cam_data.shift_x=1;dx=(bounds()-initial)[0];cam_data.shift_x=0;cam_data.shift_y=1;dy=(bounds()-initial)[2];cam_data.shift_y=0;cam_data.shift_x=float((desired[0]-initial[0])/dx);cam_data.shift_y=float((desired[2]-initial[2])/dy);error=float(np.max(np.abs(bounds()-desired)));assert error<2e-6
    scene.cycles.samples=int(os.environ.get('CYCLES_DETAIL_SAMPLES','48'));detail=OUT/'scene08-true-detail-physical148.png';scene.render.filepath=str(detail);bpy.ops.render.render(write_still=True);report['trueDetail']={'path':str(detail),'sha256':hashlib.sha256(detail.read_bytes()).hexdigest(),'cropInSourcePixels':[x,y,size,full],'nativeResolution':[scene.render.resolution_x,scene.render.resolution_y],'samples':scene.cycles.samples,'sourceCameraMatrixUnchanged':True,'maximumRaySlopeError':error,'originalApertureAndCoCPreserved':True,'upsampledScreenshot':False};cam_data.lens=original_lens;cam_data.dof.aperture_fstop=original_fstop;cam_data.shift_x=cam_data.shift_y=0
report['render']=str(render);report['renderSha256']=hashlib.sha256(render.read_bytes()).hexdigest();report['blendSha256']=hashlib.sha256(blend.read_bytes()).hexdigest();report['status']='physical-current-source-review';report['elapsedSeconds']=time.time()-report['started'];(OUT/'report.json').write_text(json.dumps(report,indent=2));print('SCENE08_PHYSICAL148',json.dumps({k:report[k] for k in ['status','sourceHash','render','renderSha256','elapsedSeconds','visualAccepted']}),flush=True)
