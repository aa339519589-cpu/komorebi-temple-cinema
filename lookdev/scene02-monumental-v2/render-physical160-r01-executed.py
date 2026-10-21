"""Scene02 exact current-buffer physical-lighting diagnostic.
Preserves original geometry, affine matrices, RGB instance attributes, original
CC0 decoded maps and native metric timber UV formula. No image replacement.
Importer provenance: scene06 exact-affine/instance-attribute importer, copied
locally; scene02 authored atmosphere is ported mathematically to a float world.
"""
import bpy,json,math,os,sys,time,hashlib
from pathlib import Path
import numpy as np
from mathutils import Matrix,Vector,Quaternion
HERE=Path(__file__).resolve().parent
ROOT=Path(os.environ.get('SCENE_PACKAGE',str(HERE/'export'))).resolve()
OUT=Path(os.environ.get('CYCLES_OUTPUT',str(HERE/'cycles-r01'))).resolve();OUT.mkdir(parents=True,exist_ok=True)
MODE='scene02-source-sun-and-physical-bounce'
scene_data=json.loads((ROOT/'scene.json').read_text());source_export=json.loads((ROOT/'export-report.json').read_text())
assert source_export['status']=='exported-existing-geometry'
assert source_export['sourceHash']==os.environ['SCENE_EXPECTED_HASH'], 'Current source export is not the expected frozen candidate'
assert scene_data['view']['reference']==2
report={'sourceCommit':source_export['sourceCommit'],'sourceHash':source_export['sourceHash'],'exportSceneSha256':hashlib.sha256((ROOT/'scene.json').read_bytes()).hexdigest(),'renderScript':{'file':Path(__file__).name,'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'sourceStatistics':scene_data['statistics'],'lightingMode':MODE,'blender':bpy.app.version_string,'scope':scene_data['renderingScope'],'geometryRebuilt':False,'excluded':scene_data['excluded'],'warnings':[],'status':'importing','started':time.time(),'visualAccepted':False,'photographicAcceptance':False}
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

def native_floor_transfer(nodes,links,bs,source_rough):
    def op(kind,a,b=None):
        n=nodes.new('ShaderNodeMath');n.operation=kind
        if isinstance(a,(int,float)):n.inputs[0].default_value=a
        else:links.new(a,n.inputs[0])
        if b is not None:
            if isinstance(b,(int,float)):n.inputs[1].default_value=b
            else:links.new(b,n.inputs[1])
        return n.outputs[0]
    def clamp(socket,lo,hi):
        n=nodes.new('ShaderNodeClamp');n.inputs['Min'].default_value=lo;n.inputs['Max'].default_value=hi;links.new(socket,n.inputs['Value']);return n.outputs[0]
    geom=nodes.new('ShaderNodeNewGeometry');sep=nodes.new('ShaderNodeSeparateXYZ');links.new(geom.outputs['Position'],sep.inputs[0]);x=sep.outputs['X'];z=op('MULTIPLY',sep.outputs['Y'],-1)
    wear=op('EXPONENT',op('MULTIPLY',op('POWER',op('DIVIDE',op('SUBTRACT',x,15.55),.58),4),-1))
    wet=clamp(op('ADD',op('ADD',.55,op('MULTIPLY',.20,op('SINE',op('ADD',op('MULTIPLY',x,2.1),op('MULTIPLY',z,.37))))),op('MULTIPLY',.14,op('SINE',op('MULTIPLY',z,.83)))),.18,.89)
    rough=clamp(op('SUBTRACT',op('ADD',op('ADD',.25,op('MULTIPLY',source_rough,.23)),op('MULTIPLY',wear,.14)),op('MULTIPLY',wet,.07)),.24,.58)
    coat=clamp(op('SUBTRACT',op('ADD',.62,op('MULTIPLY',wet,.35)),op('MULTIPLY',wear,.12)),.35,.96)
    coat_rough=op('ADD',op('SUBTRACT',.22,op('MULTIPLY',wet,.145)),op('MULTIPLY',wear,.020))
    for names,socket in [(['Coat Weight','Clearcoat'],coat),(['Coat Roughness','Clearcoat Roughness'],coat_rough)]:
        for name in names:
            if name in bs.inputs:links.new(socket,bs.inputs[name]);break
    return rough

instance_colored={mid for o in scene_data['meshes'] if 'instanceColors' in o for mid in o['materials']}
textures={t['id']:t for t in scene_data['textures']}; material_records={m['id']:m for m in scene_data['materials']};materials={};geometry_materials={}
image_cache={}
timber_names={'scene02-red','scene02-cedar','scene02-darkwood','scene02-hall-aged-bearing-timber','scene02-hall-recessed-oxide-lacquer','scene02-hall-deep-vermilion-shaft','scene02-veranda-rubbed-lacquer-shaft','scene02-pagoda-deep-wall-and-soffit160','scene02-pagoda-worn-vermilion160'}
timber_ids={r['id'] for r in scene_data['materials'] if r['name'] in timber_names}
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
        is_floor=rec['name']=='scene02-darkwood' and float(rec.get('clearcoat') or 0)>.7
        painted=rec['id'] in timber_ids and (rec['name'] not in ['scene02-darkwood','scene02-pagoda-deep-wall-and-soffit160'] or is_floor)
        if painted:
            sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(map_color,sep.inputs['Color'])
            weighted=[]
            for component,weight in [('Red',.2126),('Green',.7152),('Blue',.0722)]:
                mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=weight;links.new(sep.outputs[component],mul.inputs[0]);weighted.append(mul.outputs[0])
            add=n.new('ShaderNodeMath');add.operation='ADD';links.new(weighted[0],add.inputs[0]);links.new(weighted[1],add.inputs[1]);add2=n.new('ShaderNodeMath');add2.operation='ADD';links.new(add.outputs[0],add2.inputs[0]);links.new(weighted[2],add2.inputs[1])
            div=n.new('ShaderNodeMath');div.operation='DIVIDE';div.inputs[1].default_value=.01505120736;links.new(add2.outputs[0],div.inputs[0]);power=n.new('ShaderNodeMath');power.operation='POWER';power.inputs[1].default_value=.22 if rec['name']=='scene02-hall-deep-vermilion-shaft' else .55;links.new(div.outputs[0],power.inputs[0])
            low,high=(.86,1.15) if rec['name']=='scene02-hall-deep-vermilion-shaft' else (.52,1.46)
            clamp=n.new('ShaderNodeClamp');clamp.inputs['Min'].default_value=low;clamp.inputs['Max'].default_value=high;links.new(power.outputs[0],clamp.inputs['Value']);map_color=clamp.outputs[0]
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
            if rec['id'] in timber_ids and ch=='roughnessMap':
                shaft=rec['name']=='scene02-hall-deep-vermilion-shaft';scale=n.new('ShaderNodeMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=.45 if shaft else .72;links.new(factor_socket,scale.inputs[0]);add=n.new('ShaderNodeMath');add.operation='ADD';add.inputs[1].default_value=.22 if shaft else .36;links.new(scale.outputs[0],add.inputs[0]);clamp=n.new('ShaderNodeClamp');clamp.inputs['Min'].default_value=.30 if shaft else .42;clamp.inputs['Max'].default_value=.64 if shaft else .94;links.new(add.outputs[0],clamp.inputs['Value']);factor_socket=clamp.outputs[0]
            if rec['name']=='scene02-darkwood' and float(rec.get('clearcoat') or 0)>.7 and ch=='roughnessMap':factor_socket=native_floor_transfer(n,links,bs,mul.outputs[0])
            links.new(factor_socket,bs.inputs[input_name])
    if 'alphaMap' in tex_nodes:
        sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes['alphaMap'].outputs['Color'],sep.inputs['Color']);links.new(sep.outputs['Green'],bs.inputs['Alpha'])
    if 'emissiveMap' in tex_nodes:
        for name in ['Emission Color','Emission']:
            if name in bs.inputs:links.new(tex_nodes['emissiveMap'].outputs['Color'],bs.inputs[name]);break
    # The exact same physical pond surface now reflects geometry with a true
    # dielectric interface. Its old screen-space Reflector remains excluded.
    if rec['name']=='scene02-water':
        value(bs,['Metallic'],0);value(bs,['IOR'],1.333);value(bs,['Roughness'],.065);value(bs,['Transmission Weight','Transmission'],.55);value(bs,['Coat Weight','Clearcoat'],.28);value(bs,['Coat Roughness','Clearcoat Roughness'],.045)
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



def _fract(x): return x-np.floor(x)
def _smoothstep(a,b,x):
    t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def _hash3(p):
    p=_fract(p*.1031);q=np.stack([p[:,1]+33.33,p[:,2]+33.33,p[:,0]+33.33],axis=1);p=p+np.sum(p*q,axis=1)[:,None]
    return _fract((p[:,0]+p[:,1])*p[:,2])
def _noise3(p):
    i=np.floor(p);f=p-i;u=f*f*(3-2*f)
    h=lambda x,y,z:_hash3(i+np.array([x,y,z],dtype=np.float32))
    x00=h(0,0,0)*(1-u[:,0])+h(1,0,0)*u[:,0];x10=h(0,1,0)*(1-u[:,0])+h(1,1,0)*u[:,0]
    x01=h(0,0,1)*(1-u[:,0])+h(1,0,1)*u[:,0];x11=h(0,1,1)*(1-u[:,0])+h(1,1,1)*u[:,0]
    return (x00*(1-u[:,1])+x10*u[:,1])*(1-u[:,2])+(x01*(1-u[:,1])+x11*u[:,1])*u[:,2]
def _fbm3(p):
    return .5*_noise3(p)+.25*_noise3(p*2.03)+.125*_noise3(p*4.13)+.0625*_noise3(p*8.31)
def scene02_source_shader_sky(width=512,height=256,sun_yup=(-.743,.196,-.640),include_sun_disk=True):
    """Float equirect radiance from scene02's authored Three.js sky shader, no scene photograph."""
    sun=np.array(sun_yup,dtype=np.float32,copy=True);sun/=max(float(np.linalg.norm(sun)),1e-12)
    rows=np.empty((height,width,4),dtype=np.float32);u=(np.arange(width,dtype=np.float32)+.5)/width;lon=(u-.5)*(2*np.pi)
    for row in range(height):
        lat=((row+.5)/height-.5)*np.pi;cl=np.cos(lat);d=np.stack([cl*np.sin(lon),np.full(width,np.sin(lat),dtype=np.float32),-cl*np.cos(lon)],axis=1).astype(np.float32)
        h=np.maximum(d[:,1],0);horizon=_smoothstep(.015,.33,h)[:,None];color=np.asarray([1.22,.35,.035],dtype=np.float32)*(1-horizon)+np.asarray([.24,.31,.42],dtype=np.float32)*horizon
        cos=np.clip(d@sun,0,1);near=np.power(cos,56)[:,None];color=color*(1-near*.85)+np.asarray([2.4,.62,.008],dtype=np.float32)*(near*.85)
        color+=np.power(cos,190)[:,None]*np.asarray([3.3,.62,.006],dtype=np.float32)
        if include_sun_disk:color+=_smoothstep(.99987,.99993,cos)[:,None]*np.asarray([10.,7.,2.3],dtype=np.float32)
        visible=np.flatnonzero(d[:,1]>.035)
        if len(visible):
            ray=d[visible];sun_visible=near[visible,0];dy=ray[:,1];lo=2.2/dy;hi=3.4/dy;step=(hi-lo)/10;trans=np.ones(len(visible),dtype=np.float32);scatter=np.zeros((len(visible),3),dtype=np.float32)
            for step_index in range(10):
                cp=ray*(lo+(step_index+.5)*step)[:,None];shape=_smoothstep(2.2,2.48,cp[:,1])*_smoothstep(3.4,3.03,cp[:,1])
                density=_smoothstep(.52,.68,_fbm3(cp*3+np.asarray([1.1,0,2],dtype=np.float32)))*shape*_smoothstep(.46,.60,_fbm3(np.stack([cp[:,0]*.85,np.full(len(cp),1.3,dtype=np.float32),cp[:,2]*.85],axis=1)))
                sun_noise=_fbm3((cp+sun[None,:]*.32)*3+np.asarray([1.1,0,2],dtype=np.float32));self_shadow=np.exp(-4.5*_smoothstep(.52,.68,sun_noise));mix=.20+.80*self_shadow
                cloud_light=np.asarray([.13,.20,.32],dtype=np.float32)[None,:]*(1-mix[:,None])+np.asarray([3.0,1.12,.18],dtype=np.float32)[None,:]*mix[:,None]
                cloud_light*= (.70+.30*sun_visible)[:,None];opacity=1-np.exp(-density*step*4)
                scatter+=trans[:,None]*opacity[:,None]*cloud_light;trans*=1-opacity
            color[visible]=color[visible]*trans[:,None]+scatter
        rows[row,:,:3]=color;rows[row,:,3]=1
    return rows


# Exterior incident radiance is the same authored atmosphere field, mapped to
# a real emissive enclosing dome with explicit UVs so sun/cloud orientation is
# exact. Camera, diffuse and glossy rays all see that same 3D boundary.
SUN=next(r for r in scene_data['lights'] if r['type']=='DirectionalLight' and not r['name'])
sun_dir=(Vector(SUN['matrix'][12:15])-Vector(SUN['target'])).normalized()
physical_lights=[];omitted=[]
for rec in scene_data['lights']:
    if rec['type'] not in ['PointLight'] and rec is not SUN:
        omitted.append({'name':rec['name'],'type':rec['type'],'intensity':rec['intensity'],'reason':'Native unshadowed sky/courtyard proxy replaced by actual sky visibility and multi-bounce transport.'});continue
    typ='SUN' if rec is SUN else 'POINT';light=bpy.data.lights.new(rec['name'] or 'actual-source-sun160',typ);light.color=rec['color'];obj=bpy.data.objects.new(light.name,light);scene.collection.objects.link(obj);obj.matrix_world=Matrix(np.asarray(rec['matrix']).reshape(4,4).T.tolist())
    if typ=='SUN':
        light.energy=float(os.environ.get('CYCLES_SUN_ENERGY','8.5'));light.angle=math.radians(.53);obj.rotation_euler=(Vector(rec['target'])-obj.location).to_track_quat('-Z','Y').to_euler()
    else:light.energy=rec['intensity']*4*math.pi*float(os.environ.get('CYCLES_PRACTICAL_GAIN','1'));light.shadow_soft_size=.055
    physical_lights.append({'name':obj.name,'type':typ,'energy':light.energy,'colorLinear':list(light.color),'positionSourceYUp':list(obj.location)})
cam_data=bpy.data.cameras.new('exact-source-reference-camera160');camera=bpy.data.objects.new(cam_data.name,cam_data);scene.collection.objects.link(camera);camera.matrix_world=Matrix(np.asarray(scene_data['cameraMatrix']).reshape(4,4).T.tolist());cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=24;cam_data.lens=12/math.tan(math.radians(scene_data['view']['fov'])/2);cam_data.clip_start=.10;cam_data.clip_end=300;scene.camera=camera
for obj in list(scene.objects):obj.matrix_world=conversion@obj.matrix_world
bpy.context.view_layer.update()
width,height=2048,1024;pixels=scene02_source_shader_sky(width,height,list(sun_dir),True)
sky_image=bpy.data.images.new('scene02 exact authored atmosphere radiance160',width=width,height=height,alpha=True,float_buffer=True);sky_image.colorspace_settings.name='Non-Color';sky_image.pixels.foreach_set(pixels.reshape(-1))
lon_steps,lat_steps=128,64;verts=[];radius=220
for j in range(lat_steps+1):
    lat=(j/lat_steps-.5)*math.pi;cl=math.cos(lat)
    for i in range(lon_steps+1):lon=(i/lon_steps-.5)*2*math.pi;verts.append((radius*cl*math.sin(lon),radius*cl*math.cos(lon),radius*math.sin(lat)))
faces=[]
for j in range(lat_steps):
    for i in range(lon_steps):a=j*(lon_steps+1)+i;faces.append((a,a+1,a+lon_steps+2,a+lon_steps+1))
mesh=bpy.data.meshes.new('authored sky boundary160');mesh.from_pydata(verts,[],faces);mesh.update();uv=mesh.uv_layers.new(name='authoredAtmosphereUV')
for poly in mesh.polygons:
    for li in poly.loop_indices:
        j,i=divmod(mesh.loops[li].vertex_index,lon_steps+1);uv.data[li].uv=(i/lon_steps,j/lat_steps)
mat=bpy.data.materials.new('authored sky emission160');mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear();links=mat.node_tree.links;coord=nodes.new('ShaderNodeTexCoord');tex=nodes.new('ShaderNodeTexImage');tex.image=sky_image;tex.extension='REPEAT';links.new(coord.outputs['UV'],tex.inputs['Vector']);em=nodes.new('ShaderNodeEmission');em.inputs['Strength'].default_value=float(os.environ.get('CYCLES_SKY_GAIN','1'));links.new(tex.outputs['Color'],em.inputs['Color']);out=nodes.new('ShaderNodeOutputMaterial');links.new(em.outputs[0],out.inputs['Surface']);mesh.materials.append(mat);sky=bpy.data.objects.new('Physical authored atmosphere boundary160',mesh);scene.collection.objects.link(sky);sky.visible_shadow=False
world=bpy.data.worlds.new('Black beyond the physical atmosphere shell160');world.use_nodes=True;world.node_tree.nodes.get('Background').inputs['Strength'].default_value=0;scene.world=world
report['physicalLights']=physical_lights;report['omittedNativeLightProxies']=omitted
report['skyTransfer']={'source':'The exact source-authored analytic/10-step atmosphere GLSL ported as linear floats, original sun direction; no photograph or generated scene image','texture':[width,height],'sphereRadiusMetres':radius,'UV':'Explicit code-generated world-locked UVs, sourceYUp to worldZUp consistent with all geometry','sameForAllRayTypes':True,'strength':float(os.environ.get('CYCLES_SKY_GAIN','1'))}
# True bounded participating air, with no emission or screen-space geometry.
haze_density=float(os.environ.get('CYCLES_HAZE_DENSITY','.0008'))
if haze_density>0:
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,22));fog=bpy.context.object;fog.name='Actual exterior air scattering160';fog.scale=(170,170,56)
    fm=bpy.data.materials.new('Low extinction real atmospheric medium160');fm.use_nodes=True;fn=fm.node_tree.nodes;fn.clear();fl=fm.node_tree.links;scatter=fn.new('ShaderNodeVolumeScatter');scatter.inputs['Color'].default_value=(.97,.98,1,1);scatter.inputs['Density'].default_value=haze_density;scatter.inputs['Anisotropy'].default_value=.35;fo=fn.new('ShaderNodeOutputMaterial');fl.new(scatter.outputs[0],fo.inputs['Volume']);fog.data.materials.append(fm)
report['physicalAir']={'type':'Bounded VolumeScatter','densityPerMetre':haze_density,'emission':0,'boundsZUp':[[-85,-85,-6],[85,85,50]]}
scene.render.engine='CYCLES';scene.cycles.samples=int(os.environ.get('CYCLES_SAMPLES','32'));scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.max_bounces=10;scene.cycles.diffuse_bounces=6;scene.cycles.glossy_bounces=6;scene.cycles.transmission_bounces=8;scene.cycles.volume_bounces=2;scene.cycles.transparent_max_bounces=12;scene.cycles.sample_clamp_indirect=12;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.035
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for dev in prefs.devices:dev.use=dev.type=='METAL'
assert any(dev.use for dev in prefs.devices),'No Metal GPU';scene.cycles.device='GPU'
scene.render.resolution_x=scene.render.resolution_y=int(os.environ.get('CYCLES_SIZE','1254'));scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.threads_mode='FIXED';scene.render.threads=4
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=float(os.environ.get('CYCLES_EXPOSURE','.4'))
report['camera']={'sourcePositionYUp':scene_data['view']['position'],'sourceFovDegrees':scene_data['view']['fov'],'sourceMatrix':scene_data['cameraMatrix'],'unchangedMatrix':True}
report['materialTransfer']={'sourceOriginalAssets':'All original declared compressed source assets remain immutable; the verified exporter retains their file hashes and exports decoded pixels. Every exported binary/image hash is checked before use.','geometry':'All original indexed positions/indices/normals and matrices retained, no decimation. Full affine matrices baked only for shears and metric-timber UV realization.','RGB':'Source vertex RGB only if vertexColors enabled, multiplied separately by exact per-instance RGB. Linked instances read INSTANCER; baked/direct meshes read GEOMETRY.','timberUV':'Original native position/normal, actual instance-column lengths and timberExtent choose longest-axis metric UV exactly by original formula; native phase formula recomputed in CPU double precision, so sin/fract phase can differ from GPU float rounding. UV pixels are original decoded scan maps.','timberPigment':'Original linear material color times normalized decoded linear scan luminance/0.01505120736 with source exponent/clamps; no extra pigment override.','roughness':'Native timber roughness remap ported; individual ceramic source maps, normal maps, clearcoat and all source PBR values retained. The original metric-world wear/wetness formula drives physical floor roughness and clearcoat, with sourceX=worldX and sourceZ=-worldY after the shared coordinate conversion.','water':'Same source pond surface and bump map use physical dielectric IOR1.333/transmission.55/roughness.065 in place of excluded screen-space reflector.','limits':['Native shader leaf transmission is not automatically portable.','Native PMREM/captured-probe, AO, screen-space reflection and ACES differ from physical ray transport and AgX.','Photo fidelity remains unaccepted; Cycles pixels are not WebGL equivalents.']}
report['importedTriangles']=imported_triangles;report['sourceTriangles']=scene_data['statistics']['triangles'];report['excludedCollapsedTriangles']=collapsed_triangle_count;assert imported_triangles==scene_data['statistics']['triangles']-collapsed_triangle_count
report['renderableTriangleCountPreserved']=True;report['resolution']=[scene.render.resolution_x,scene.render.resolution_y];report['samples']=scene.cycles.samples;report['exposureEV']=scene.view_settings.exposure;report['nativeWebglPixelEquivalence']=False;report['visualAccepted']=False;report['status']='rendering';(OUT/'report.json').write_text(json.dumps(report,indent=2))
blend=OUT/'scene02-current-source-physical160.blend';bpy.ops.wm.save_as_mainfile(filepath=str(blend),compress=True);report['blend']=str(blend)
render=OUT/'scene02-current-source-physical160.png';scene.render.filepath=str(render);bpy.ops.render.render(write_still=True)
report['render']=str(render);report['renderSha256']=hashlib.sha256(render.read_bytes()).hexdigest();report['blendSha256']=hashlib.sha256(blend.read_bytes()).hexdigest();report['status']='physical-current-source-review';report['elapsedSeconds']=time.time()-report['started'];(OUT/'report.json').write_text(json.dumps(report,indent=2));print('SCENE02_PHYSICAL160',json.dumps({k:report[k] for k in ['status','sourceHash','render','renderSha256','elapsedSeconds','visualAccepted']}),flush=True)
