"""Physical path-traced rendering of code-generated Three.js buffers.

The geometry and instance matrices come from a verified native source frame.
Custom GLSL hooks/planar reflection approximations are explicitly not equivalent
across renderers. This rendering does not establish photographic acceptance.
"""
import bpy, json, math, os, sys, time, hashlib
from pathlib import Path
import numpy as np
from mathutils import Matrix, Vector, Quaternion
ROOT=Path(os.environ.get('SCENE_PACKAGE','lookdev/scene09-solmax-cycles-20261021/export')).resolve()
OUT=Path(os.environ.get('CYCLES_OUTPUT','lookdev/scene09-solmax-cycles-20261021/cycles')).resolve();OUT.mkdir(parents=True,exist_ok=True)
MODE=os.environ.get('LIGHTING_MODE','scene09-r10-source-physical-transport')
REPO=Path(os.environ.get('REPO_ROOT',Path(__file__).resolve().parents[2])).resolve()
scene_data=json.loads((ROOT/'scene.json').read_text())
source_export=json.loads((ROOT/'export-report.json').read_text())
if source_export.get('status')!='exported-existing-geometry': raise RuntimeError('Source export is not complete: '+str(source_export.get('status')))
if source_export.get('sourceHash')!='b2d659097d51b2a49b720f3ff83a6bdf84e6c265dd2a89225e5c8ba074637715': raise RuntimeError('Frozen Scene09 R10 source identity differs')
canonical_reference=int(scene_data.get('view',{}).get('reference',0))
report={'sourceCommit':source_export.get('sourceCommit'),'sourceHash':source_export.get('sourceHash'),'renderScript':{'file':Path(__file__).name,'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'sourceStatistics':scene_data['statistics'],'lightingMode':MODE,'blender':bpy.app.version_string,'scope':scene_data.get('renderingScope'),'geometryRebuilt':False,'excluded':scene_data['excluded'],'warnings':[],'status':'importing','started':time.time()}
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
if canonical_reference!=9: raise RuntimeError('This script owns Scene09 only')

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
        image=bpy.data.images.load(str(ROOT/'assets'/tex['file']),check_existing=False)
        image.colorspace_settings.name='sRGB' if channel in ['map','emissiveMap'] and tex.get('colorSpace')=='srgb' else 'Non-Color'
        tn=n.new('ShaderNodeTexImage');tn.image=image;tn.extension='REPEAT';tn.interpolation='Linear';tex_nodes[channel]=tn
        mul=n.new('ShaderNodeVectorMath');mul.operation='MULTIPLY';sx,sy=tex.get('repeat',[1,1]);ox,oy=tex.get('offset',[0,0]);
        if not tex.get('flipY',True): sy=-sy;oy=1-oy
        mul.inputs[1].default_value=(sx,sy,1);links.new(uv.outputs['UV'],mul.inputs[0]);add=n.new('ShaderNodeVectorMath');add.operation='ADD';add.inputs[1].default_value=(ox,oy,0);links.new(mul.outputs[0],add.inputs[0]);links.new(add.outputs[0],tn.inputs['Vector'])
        if tex.get('rotation',0):report['warnings'].append('UV texture rotation unported: '+rec['name']+'/'+channel)
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
    # Physical thin-leaf transport replaces the native view-dependent added
    # radiance term. It is a declared material adaptation, not pixel parity.
    leaf_name=rec['name'].lower()
    if leaf_name in ['leaf','leafdark','leaflight','mapleleaf','maplelight','mapledark','vineleaf','pineleaf','lotus','lotusinside','pink','pinklight','flowercream']:
        thin=n.new('ShaderNodeBsdfTranslucent')
        if base_socket:links.new(base_socket,thin.inputs['Color'])
        else:thin.inputs['Color'].default_value=color
        transport=n.new('ShaderNodeMixShader');transport.inputs[0].default_value=.18 if leaf_name=='pineleaf' else .28
        links.new(bs.outputs['BSDF'],transport.inputs[1]);links.new(thin.outputs['BSDF'],transport.inputs[2]);links.new(transport.outputs[0],out.inputs['Surface'])
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
        # Three.js emissiveMap multiplies emissive RGB; replacing it with the
        # grayscale texture would incorrectly turn amber paper white.
        emul=n.new('ShaderNodeMixRGB');emul.blend_type='MULTIPLY';emul.inputs[0].default_value=1;emul.inputs[2].default_value=emission;links.new(tex_nodes['emissiveMap'].outputs['Color'],emul.inputs[1])
        for name in ['Emission Color','Emission']:
            if name in bs.inputs:links.new(emul.outputs[0],bs.inputs[name]);break
    if rec['name'].startswith('scene09-cc0-wet-granite-veranda-paver-'):
        # Preserve the exported scan maps and actual riven facets. A water
        # dielectric coating follows each slab normal, never a floating mirror.
        value(bs,['Coat IOR'],1.333)
        value(bs,['Coat Weight','Clearcoat'],float(os.environ.get('CYCLES_STONE_COAT','1.0')))
        value(bs,['Coat Roughness','Clearcoat Roughness'],float(os.environ.get('CYCLES_STONE_COAT_ROUGHNESS','.065')))
        if 'normalMap' in tex_nodes:
            links.new(normal.outputs['Normal'],bs.inputs['Coat Normal'])
    materials[rec['id']]=mat
    if rec['id'] in instance_colored:
        geometry_mat=mat.copy();geometry_mat.name=(mat.name+' [GEOMETRY instanceColor]').strip()
        for node in geometry_mat.node_tree.nodes:
            if node.type=='ATTRIBUTE' and getattr(node,'attribute_name','')=='instanceColor':node.attribute_type='GEOMETRY'
        geometry_materials[rec['id']]=geometry_mat
    else:geometry_materials[rec['id']]=mat

geo={g['id']:g for g in scene_data['geometries']}; loaded={}; mesh_cache={}; template_objects={}; imported_triangles=0; collapsed_instance_count=0
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
        collapsed_instance_count+=int(np.count_nonzero(~valid));report.setdefault('excludedCollapsedInstances',[]).append({'name':record['name'],'count':int(np.count_nonzero(~valid)),'reason':'Singular source transform has no invertible normal matrix; excluded only because it has zero or near-zero area.'})
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

report['affinePreservation']={'parentMatrices':'Retained as full source object matrices without decomposition; source parent transforms remain exact.','linkedLocalMatrices':'Geometry Nodes Object Info + Instance on Points with TRS decomposition only for matrices with normalized column shear residual <= 1e-7; retained translations, rotations and scales.','linkedInstances':linked_instance_count,'bakedShearedInstances':sheared_instance_count,'bakedShearedTriangles':sheared_triangle_count,'bakedShearedVertices':sheared_vertex_count,'maxLinkedTRSMatrixResidual':max_trs_residual,'maxBakedShearResidual':max_shear_residual,'flattenedOnlyForShearedTransforms':True,'geometryDecimated':False}

# Keep the frozen source fixture anchors, colors, cones and flux ratios. The
# numeric Three.js photometric parameters are explicitly calibrated radiant
# proxies in Cycles; there is no claimed lumen-to-watt spectral recovery.
report['sourceLightTransfer']=[]
fixture_gain=float(os.environ.get('CYCLES_FIXTURE_GAIN','1'))
for rec in scene_data['lights']:
    if rec['intensity']<=0 or rec['type']=='HemisphereLight':continue
    typ={'DirectionalLight':'SUN','PointLight':'POINT','SpotLight':'SPOT','RectAreaLight':'AREA'}.get(rec['type'])
    if not typ:
        report['warnings'].append('Unsupported exported light '+rec['type']);continue
    light=bpy.data.lights.new(rec['name'] or 'source09-'+typ,typ);light.color=rec['color']
    obj=bpy.data.objects.new(light.name,light);scene.collection.objects.link(obj)
    obj.matrix_world=Matrix(np.array(rec['matrix']).reshape(4,4).T.tolist())
    intensity=float(rec['intensity'])
    if typ=='SUN':
        light.energy=intensity*float(os.environ.get('CYCLES_SUN_GAIN','1'))
        light.angle=.0093 if rec['name']!='warm-courtyard-reflected-light-proxy' else .08
    elif typ=='AREA':
        light.shape='RECTANGLE';light.size=rec.get('width') or 1;light.size_y=rec.get('height') or 1
        light.energy=intensity*light.size*light.size_y*math.pi*fixture_gain
    else:
        light.energy=intensity*4*math.pi*fixture_gain
        light.shadow_soft_size=.065 if obj.location.y>6 and obj.location.z>15 else .025
    if typ=='SPOT':
        light.spot_size=2*(rec.get('angle') or .8);light.spot_blend=rec.get('penumbra') or .2
    if typ in ['SUN','SPOT'] and rec.get('target'):
        obj.rotation_euler=(Vector(rec['target'])-obj.location).to_track_quat('-Z','Y').to_euler()
    report['sourceLightTransfer'].append({'name':rec['name'],'type':typ,'positionYUp':list(obj.location),'targetYUp':rec.get('target'),'sourceIntensity':intensity,'cyclesEnergy':light.energy,'linearRGB':list(light.color),'sourceDistanceCutoff':rec.get('distance'),'cyclesFiniteCutoff':False,'castsPhysicalShadows':True})

cam_data=bpy.data.cameras.new('scene09-frozen-source-reference-camera')
camera=bpy.data.objects.new(cam_data.name,cam_data);scene.collection.objects.link(camera)
camera.matrix_world=Matrix(np.array(scene_data['cameraMatrix']).reshape(4,4).T.tolist())
cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=24
cam_data.lens=12/math.tan(math.radians(scene_data['view']['fov'])/2)
cam_data.clip_start=.1;cam_data.clip_end=260;scene.camera=camera
bpy.context.view_layer.update()
for obj in list(scene.objects):obj.matrix_world=conversion@obj.matrix_world
bpy.context.view_layer.update()
report['worldCoordinateConversion']='Source meshes, full affine instance parents, lights and camera jointly rotated +90 degrees about X from Y-up to Z-up; no deformation.'
report['camera']={'sourceView':scene_data['view'],'sourceMatrixColumnMajor':scene_data['cameraMatrix'],'cyclesMatrix':list(camera.matrix_world),'sourcePosePreserved':True,'depthOfField':False}
# Matrix rows become plain lists for JSON.
report['camera']['cyclesMatrix']=[list(row) for row in camera.matrix_world]

def fract(x):return x-np.floor(x)
def source_noise(p):
    i=np.floor(p);f=p-i;f=f*f*(3-2*f)
    def h(x,y,z):
        q=i+np.asarray([x,y,z],dtype=np.float64)
        return fract(np.sin(q@np.asarray([127.1,311.7,74.7]))*43758.5453)
    x00=h(0,0,0)*(1-f[:,0])+h(1,0,0)*f[:,0]
    x10=h(0,1,0)*(1-f[:,0])+h(1,1,0)*f[:,0]
    x01=h(0,0,1)*(1-f[:,0])+h(1,0,1)*f[:,0]
    x11=h(0,1,1)*(1-f[:,0])+h(1,1,1)*f[:,0]
    return (x00*(1-f[:,1])+x10*f[:,1])*(1-f[:,2])+(x01*(1-f[:,1])+x11*f[:,1])*f[:,2]

def source_night_sky(width=2048,height=1024):
    # Exact authored source09 cloud field equations. Float64 CPU sine/hash
    # differs from GPU GLSL precision; this is declared shader translation.
    rows=np.empty((height,width,4),dtype=np.float32)
    lon=((np.arange(width)+.5)/width-.5)*2*np.pi
    for row in range(height):
        lat=((row+.5)/height-.5)*np.pi;cl=np.cos(lat)
        d=np.stack([cl*np.cos(lon),np.full(width,np.sin(lat)),cl*np.sin(lon)],axis=1)
        p=d*np.asarray([8.,18.,8.])+np.asarray([7.,3.,2.])
        a=sum(weight*source_noise(p*freq) for weight,freq in [(.42,1),(.25,2.03),(.16,4.11),(.10,8.29),(.05,16.51),(.02,33.1)])
        c=np.clip((a-.39)/(.55-.39),0,1);c=c*c*(3-2*c)
        t=np.maximum(d[:,1],0)[:,None]
        color=np.asarray([.033,.099,.33])*(1-t)+np.asarray([.025,.066,.235])*t
        color=color*(1-c[:,None]*.90)+np.asarray([.016,.053,.183])*c[:,None]*.90
        rows[row,:,:3]=color;rows[row,:,3]=1
    return rows

sky_width,sky_height=2048,1024
sky_pixels=source_night_sky(sky_width,sky_height)
sky_image=bpy.data.images.new('scene09 source-code-only cloudy blue sky radiance',width=sky_width,height=sky_height,alpha=True,float_buffer=True)
sky_image.colorspace_settings.name='Non-Color';sky_image.pixels.foreach_set(sky_pixels.ravel())
sky_asset=OUT/'scene09-source-shader-clouds.exr';sky_image.filepath_raw=str(sky_asset);sky_image.file_format='OPEN_EXR';sky_image.save()
world=bpy.data.worlds.new('Scene09 source procedural cloudfield + physical hemisphere approximation');world.use_nodes=True;scene.world=world
n=world.node_tree.nodes;n.clear();links=world.node_tree.links
coord=n.new('ShaderNodeTexCoord');sep=n.new('ShaderNodeSeparateXYZ');links.new(coord.outputs['Normal'],sep.inputs['Vector'])
# The generated image's bottom row is the south pole. Source direction is
# (Blender X, Blender Z, -Blender Y), then explicit equirectangular lookup.
neg_y=n.new('ShaderNodeMath');neg_y.operation='MULTIPLY';neg_y.inputs[1].default_value=-1;links.new(sep.outputs['Y'],neg_y.inputs[0])
atan=n.new('ShaderNodeMath');atan.operation='ARCTAN2';links.new(neg_y.outputs[0],atan.inputs[0]);links.new(sep.outputs['X'],atan.inputs[1])
u=n.new('ShaderNodeMath');u.operation='MULTIPLY_ADD';u.inputs[1].default_value=1/(2*math.pi);u.inputs[2].default_value=.5;links.new(atan.outputs[0],u.inputs[0])
asin=n.new('ShaderNodeMath');asin.operation='ARCSINE';links.new(sep.outputs['Z'],asin.inputs[0])
v=n.new('ShaderNodeMath');v.operation='MULTIPLY_ADD';v.inputs[1].default_value=1/math.pi;v.inputs[2].default_value=.5;links.new(asin.outputs[0],v.inputs[0])
uv=n.new('ShaderNodeCombineXYZ');links.new(u.outputs[0],uv.inputs['X']);links.new(v.outputs[0],uv.inputs['Y'])
texture=n.new('ShaderNodeTexImage');texture.image=sky_image;texture.extension='REPEAT';texture.interpolation='Linear';links.new(uv.outputs['Vector'],texture.inputs['Vector'])
camera_bg=n.new('ShaderNodeBackground');camera_bg.inputs['Strength'].default_value=float(os.environ.get('CYCLES_SKY_CAMERA_GAIN','1'));links.new(texture.outputs['Color'],camera_bg.inputs['Color'])
hemi=next((r for r in scene_data['lights'] if r['type']=='HemisphereLight'),None)
def srgb(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
ground=tuple(srgb(v/255) for v in [0x13,0x19,0x0f])
factor=n.new('ShaderNodeMath');factor.operation='MULTIPLY_ADD';factor.inputs[1].default_value=.5;factor.inputs[2].default_value=.5;factor.use_clamp=True;links.new(sep.outputs['Z'],factor.inputs[0])
hemix=n.new('ShaderNodeMixRGB');hemix.inputs[1].default_value=ground+(1,);hemix.inputs[2].default_value=tuple(hemi['color'] if hemi else [.3,.4,.6])+(1,);links.new(factor.outputs[0],hemix.inputs[0])
hemi_radiance=n.new('ShaderNodeVectorMath');hemi_radiance.operation='SCALE';hemi_radiance.inputs[3].default_value=float(hemi['intensity'] if hemi else .26)/math.pi;links.new(hemix.outputs[0],hemi_radiance.inputs[0])
gi_sky=n.new('ShaderNodeVectorMath');gi_sky.operation='SCALE';gi_sky.inputs[3].default_value=float(os.environ.get('CYCLES_SKY_GI_GAIN','1'));links.new(texture.outputs['Color'],gi_sky.inputs[0])
add=n.new('ShaderNodeVectorMath');add.operation='ADD';links.new(gi_sky.outputs['Vector'],add.inputs[0]);links.new(hemi_radiance.outputs['Vector'],add.inputs[1])
gi_bg=n.new('ShaderNodeBackground');gi_bg.inputs['Strength'].default_value=1;links.new(add.outputs['Vector'],gi_bg.inputs['Color'])
path=n.new('ShaderNodeLightPath');mix=n.new('ShaderNodeMixShader');links.new(path.outputs['Is Camera Ray'],mix.inputs[0]);links.new(gi_bg.outputs[0],mix.inputs[1]);links.new(camera_bg.outputs[0],mix.inputs[2])
world_out=n.new('ShaderNodeOutputWorld');links.new(mix.outputs[0],world_out.inputs['Surface'])
report['skyTranslation']={'source':'Frozen source09 procedural six-octave cloud field; linear radiance texture generated by code only, no photographs or replacement scene content','asset':sky_asset.name,'sha256':hashlib.sha256(sky_asset.read_bytes()).hexdigest(),'size':[sky_width,sky_height],'precisionLimit':'CPU float64 sin/hash versus GLSL GPU precision; same authored field equations, not pixel equivalence','sourceSourceFile':'reconstructions/scene-09/src/main.js','cameraGain':camera_bg.inputs['Strength'].default_value,'environmentGain':gi_sky.inputs[3].default_value,'hemisphere':'Source top RGB/intensity and source ground 0x13190f translated to shadowed directional environment radiance at intensity/pi; a physical approximation to native unshadowed hemisphere light'}

# The two native Reflector objects are shader-only capture surfaces, excluded
# by the source exporter. The real floor is already present as closed slabs;
# its physical coating above follows those facets. Only the pond needs a new
# dielectric surface at the exact authored rectangle and elevation.
water_mesh=bpy.data.meshes.new('scene09 physical pond native52x55 footprint')
water_mesh.from_pydata([(-26,-.02,-19.5),(-26,-.02,35.5),(26,-.02,35.5),(26,-.02,-19.5)],[],[(0,1,2,3)]);water_mesh.update()
water=bpy.data.objects.new('scene09 physical pond replaces excluded Reflector',water_mesh);scene.collection.objects.link(water);water.matrix_world=conversion
wm=bpy.data.materials.new('scene09 physical pond water IOR1.333');wm.use_nodes=True
wn=wm.node_tree.nodes;wn.clear();wl=wm.node_tree.links
wbs=wn.new('ShaderNodeBsdfPrincipled');wbs.inputs['Base Color'].default_value=(.055,.10,.12,1);wbs.inputs['Roughness'].default_value=float(os.environ.get('CYCLES_WATER_ROUGHNESS','.038'));wbs.inputs['IOR'].default_value=1.333;wbs.inputs['Metallic'].default_value=0;wbs.inputs['Transmission Weight'].default_value=1
position=wn.new('ShaderNodeNewGeometry');ws=wn.new('ShaderNodeSeparateXYZ');wl.new(position.outputs['Position'],ws.inputs['Vector'])
# Small physical height waves, in metres, with the source ripple directions.
# They alter actual surface normals and trace scene lights. No colored strokes.
def mathnode(operation,a,b=None):
    node=wn.new('ShaderNodeMath');node.operation=operation
    for socket,val in [(node.inputs[0],a),(node.inputs[1],b)]:
        if val is None:continue
        if hasattr(val,'node'):wl.new(val,socket)
        else:socket.default_value=val
    return node.outputs[0]
x=ws.outputs['X'];z=mathnode('MULTIPLY',ws.outputs['Y'],-1)
phase1=mathnode('ADD',mathnode('MULTIPLY',z,1.35),mathnode('MULTIPLY',mathnode('SINE',mathnode('MULTIPLY',x,.24)),1.8))
phase2=mathnode('SUBTRACT',mathnode('MULTIPLY',z,5.2),mathnode('MULTIPLY',x,.62))
phase3=mathnode('ADD',mathnode('MULTIPLY',z,14.5),mathnode('MULTIPLY',x,2.7))
phase4=mathnode('ADD',mathnode('MULTIPLY',x,1.4),mathnode('MULTIPLY',z,.38))
height=None
for phase,amplitude in [(phase1,.0024),(phase2,.00075),(phase3,.00022),(phase4,.0008)]:
    wave=mathnode('MULTIPLY',mathnode('SINE',phase),amplitude)
    height=wave if height is None else mathnode('ADD',height,wave)
bump=wn.new('ShaderNodeBump');bump.inputs['Strength'].default_value=float(os.environ.get('CYCLES_WATER_RIPPLE_GAIN','1'));bump.inputs['Distance'].default_value=1;wl.new(height,bump.inputs['Height']);wl.new(bump.outputs['Normal'],wbs.inputs['Normal'])
wout=wn.new('ShaderNodeOutputMaterial');wl.new(wbs.outputs['BSDF'],wout.inputs['Surface']);water_mesh.materials.append(wm)
# Dark bed below the physically transparent pond supplies extinction/background;
# all reflected architecture remains the original exported 3D geometry.
bedmesh=bpy.data.meshes.new('scene09 physical pond dark bed');bedmesh.from_pydata([(-26,-.80,-19.5),(-26,-.80,35.5),(26,-.80,35.5),(26,-.80,-19.5)],[],[(0,1,2,3)]);bedmesh.update()
bed=bpy.data.objects.new('scene09 pond bed for physical transmission',bedmesh);scene.collection.objects.link(bed);bed.matrix_world=conversion
bm=bpy.data.materials.new('scene09 dark submerged silt');bm.diffuse_color=(.003,.007,.006,1);bm.use_nodes=True;bs=bm.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.003,.007,.006,1);bs.inputs['Roughness'].default_value=.96;bedmesh.materials.append(bm)
report['physicalSurfaceAdaptation']={'pond':{'nativeFootprint':[52,55],'sourcePositionYUp':[0,-.02,8],'IOR':1.333,'roughness':wbs.inputs['Roughness'].default_value,'transmission':1,'rippleHeightMetres':[.0024,.00075,.00022,.0008],'method':'World-space physical micro-normal from source ripple directions; path-traced source geometry/light/environment reflection','bedDepthBelowSurfaceMetres':.78},'floor':{'sourceGeometry':'All original closed clipped riven granite slabs, cut edges, footing and retaining foundation retained unchanged','coating':'Principled physical dielectric coat, IOR1.333, follows source geometry plus scanned normal map','coatWeight':float(os.environ.get('CYCLES_STONE_COAT','1')),'coatRoughness':float(os.environ.get('CYCLES_STONE_COAT_ROUGHNESS','.065')),'floatingMirrorAdded':False},'reflectionImagesOrPaintedStrokes':False,'referencePhotoPixelsUsed':False}

scene.render.engine='CYCLES';scene.cycles.device='CPU'
if os.environ.get('CYCLES_DEVICE','METAL')=='METAL':
    preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
    for device in preferences.devices:device.use=device.type=='METAL'
    if not any(device.use for device in preferences.devices):raise RuntimeError('Requested Metal GPU is unavailable')
    scene.cycles.device='GPU'
scene.cycles.samples=int(os.environ.get('CYCLES_SAMPLES','48'));scene.cycles.use_denoising=os.environ.get('CYCLES_DENOISE','1')=='1';scene.cycles.denoiser='OPENIMAGEDENOISE'
for layer in scene.view_layers:layer.cycles.use_denoising=scene.cycles.use_denoising
scene.cycles.max_bounces=12;scene.cycles.diffuse_bounces=6;scene.cycles.glossy_bounces=6;scene.cycles.transmission_bounces=8;scene.cycles.transparent_max_bounces=12;scene.cycles.volume_bounces=2;scene.cycles.sample_clamp_indirect=10
scene.render.resolution_x=int(os.environ.get('CYCLES_SIZE','768'));scene.render.resolution_y=scene.render.resolution_x;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.film_transparent=False
scene.render.threads_mode='FIXED';scene.render.threads=int(os.environ.get('CYCLES_THREADS','4'))
scene.view_settings.view_transform='AgX';scene.view_settings.exposure=float(os.environ.get('CYCLES_EXPOSURE',str(math.log2(.95))));scene.view_settings.gamma=1
render_name=os.environ.get('CYCLES_RENDER_NAME','scene09-source-r10-physical-r01.png')
if Path(render_name).name!=render_name:raise ValueError('CYCLES_RENDER_NAME must be a filename')
scene.render.filepath=str(OUT/render_name)
scene['source_commit']=report['sourceCommit'];scene['source_scene_sha256']=report['sourceHash'];scene['visual_accepted']=False
report['importedTriangles']=imported_triangles;report['sourceTriangleCount']=scene_data['statistics']['triangles'];report['geometryTriangleCountPreserved']=imported_triangles==scene_data['statistics']['triangles'];report['excludedCollapsedInstanceCount']=collapsed_instance_count
report['materialAttributeParity']={'linkedInstances':'Explicit point attribute to instance; ShaderNodeAttribute INSTANCER lookup','bakedAndDirect':'GEOMETRY-domain material variants, direct source fallback white','vertexColorMultiply':'Only when source vertexColors=true; instanceColors do not double multiply vertex RGB','emissionMap':'Multiply source emissive RGB by emission texture, preserving amber tint'}
report['physicalFoliageAdaptation']='18% needle / 28% named broadleaf diffuse transmission replaces native view-dependent radiance; actual source occlusion and lighting.'
report['rendererLimits']=['Custom onBeforeCompile GLSL surface hooks are not automatically portable; exported actual maps, UVs, vertex/instance RGB and PBR values are retained.','Native captured environment probe and planar reflection shaders are replaced by path-traced source scene and sky radiance.','All source local lights physically occlude in Cycles; some native local pools were unshadowed. Native finite distance cutoffs are replaced by inverse-square transport.','Source FogExp2 is not a recoverable physical volume; this initial Cycles pass has no volume haze.','AgX and Three ACESFilmic differ; numerical light ratios and exposure are calibration starting values, not WebGL pixel equivalence.']
report['lightCalibration']={'fixtureGain':fixture_gain,'sunGain':float(os.environ.get('CYCLES_SUN_GAIN','1')),'pointEnergyConversion':'Source intensity * 4pi, numerical radiant proxy; source photometric spectrum/efficacy unknown','physicalBounces':{'total':12,'diffuse':6,'glossy':6,'transmission':8},'viewTransform':'AgX','exposureStops':scene.view_settings.exposure,'nativeExposureMultiplier':.95,'referencePhotoUsedOnlyForReview':True}
report['status']='rendering';report['visualAccepted']=False;report['cyclesDevice']=scene.cycles.device
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if os.environ.get('CYCLES_SAVE_BLEND','1')=='1':
    blend_name=os.environ.get('CYCLES_BLEND_NAME','scene09-source-r10-physical.blend')
    if Path(blend_name).name!=blend_name:raise ValueError('CYCLES_BLEND_NAME must be a filename')
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/blend_name),compress=True)
started=time.time();bpy.ops.render.render(write_still=True)
report['renderSeconds']=time.time()-started;report['renderSha256']=hashlib.sha256(Path(scene.render.filepath).read_bytes()).hexdigest()
report['status']='path-traced-review';report['finished']=time.time();report['resolution']=[scene.render.resolution_x,scene.render.resolution_y];report['samples']=scene.cycles.samples;report['denoised']=scene.cycles.use_denoising
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print('SCENE09_CYCLES_COMPLETE',json.dumps({k:report[k] for k in ['sourceHash','importedTriangles','geometryTriangleCountPreserved','status','renderSeconds','renderSha256','resolution','samples','visualAccepted']}),flush=True)

