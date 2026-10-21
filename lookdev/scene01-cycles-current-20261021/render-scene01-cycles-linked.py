"""Independent physical-lighting diagnostic of code-generated Three.js buffers.

The geometry and instance matrices come from a verified native source frame.
Custom GLSL hooks/planar reflection approximations are explicitly not equivalent
across renderers. This diagnostic does not replace native scene acceptance.
"""
import bpy, json, math, os, sys, time, hashlib
from pathlib import Path
import numpy as np
from mathutils import Matrix, Vector, Quaternion
ROOT=Path(os.environ.get('SCENE_PACKAGE','lookdev/scene01-cycles-current-20261021/export')).resolve()
OUT=Path(os.environ.get('CYCLES_OUTPUT','lookdev/scene01-cycles-current-20261021/cycles')).resolve();OUT.mkdir(parents=True,exist_ok=True)
MODE=os.environ.get('LIGHTING_MODE','scene01-golden-hour-linked')
REPO=Path(os.environ.get('REPO_ROOT',Path(__file__).resolve().parents[2])).resolve()
scene_data=json.loads((ROOT/'scene.json').read_text())
source_export=json.loads((ROOT/'export-report.json').read_text())
canonical_reference=int(scene_data.get('view',{}).get('reference',0))
report={'sourceCommit':source_export.get('sourceCommit'),'sourceHash':source_export.get('sourceHash'),'renderScript':{'file':Path(__file__).name,'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'sourceStatistics':scene_data['statistics'],'lightingMode':MODE,'blender':bpy.app.version_string,'scope':scene_data.get('renderingScope'),'geometryRebuilt':False,'excluded':scene_data['excluded'],'warnings':[],'status':'importing','started':time.time()}
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene

def binary(record):
    kind={'Float32Array':'<f4','Uint32Array':'<u4','Uint16Array':'<u2'}[record['type']]
    data=np.fromfile(ROOT/'assets'/record['file'],dtype=kind)
    if len(data)!=record['count']: raise ValueError('Truncated geometry buffer '+record['file'])
    return data

def value(node,names,v):
    for name in names:
        if name in node.inputs: node.inputs[name].default_value=v;return node.inputs[name]
    return None

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

def add_scene02_source_sky_dome(scene,sun_yup,report,radius=220.0,include_sun_disk=True):
    width,height=512,256;pixels=scene02_source_shader_sky(width,height,sun_yup,include_sun_disk)
    image=bpy.data.images.new('scene02 source-shader sunset radiance (code-generated)',width=width,height=height,alpha=True,float_buffer=True)
    image.colorspace_settings.name='Non-Color';image.pixels.foreach_set(pixels.reshape(-1))
    lon_steps,lat_steps=128,64;verts=[]
    for j in range(lat_steps+1):
        lat=(j/lat_steps-.5)*math.pi;cl=math.cos(lat)
        for i in range(lon_steps+1):
            lon=(i/lon_steps-.5)*2*math.pi
            # UV and the float map use the same world-locked Z-up directions.
            verts.append((radius*cl*math.sin(lon),radius*cl*math.cos(lon),radius*math.sin(lat)))
    faces=[]
    for j in range(lat_steps):
        for i in range(lon_steps):
            a=j*(lon_steps+1)+i;b=a+1;d=(j+1)*(lon_steps+1)+i;c=d+1;faces.append((a,b,c,d))
    mesh=bpy.data.meshes.new('scene02 code-generated atmospheric shell mesh');mesh.from_pydata(verts,[],faces);mesh.update(calc_edges=True)
    uv=mesh.uv_layers.new(name='sourceShaderEquirectangularUV')
    for poly in mesh.polygons:
        for loop_index in poly.loop_indices:
            vertex_index=mesh.loops[loop_index].vertex_index;j,i=divmod(vertex_index,lon_steps+1);uv.data[loop_index].uv=(i/lon_steps,j/lat_steps)
    material=bpy.data.materials.new('scene02 source ShaderMaterial sky, ported to Cycles emission');material.use_nodes=True;nodes=material.node_tree.nodes;nodes.clear();links=material.node_tree.links
    coordinate=nodes.new('ShaderNodeTexCoord');texture=nodes.new('ShaderNodeTexImage');texture.image=image;texture.extension='REPEAT';texture.interpolation='Linear';links.new(coordinate.outputs['UV'],texture.inputs['Vector'])
    emission=nodes.new('ShaderNodeEmission');emission.inputs['Strength'].default_value=1;links.new(texture.outputs['Color'],emission.inputs['Color']);output=nodes.new('ShaderNodeOutputMaterial');links.new(emission.outputs['Emission'],output.inputs['Surface']);mesh.materials.append(material)
    obj=bpy.data.objects.new('scene02 code-generated source sky dome',mesh);scene.collection.objects.link(obj)
    if hasattr(obj,'visible_shadow'):obj.visible_shadow=False
    report['scene02SkyDome']={'source':'Code port of the existing scene02 ShaderMaterial sky: analytic horizon gradient, exact source sun vector, 10-step cloud scattering/self-shadow; no photograph or generated replacement frame','sunDiskInDome':include_sun_disk,'map':[width,height],'meshRadiusMetres':radius,'UV':'Hand-authored equirectangular coordinates on a Y-up to Z-up converted sphere','radiance':'Linear float texture generated at render time and used as an emissive 3D environment shell','castsShadows':False}
    return obj

instance_colored={mid for o in scene_data['meshes'] if 'instanceColors' in o for mid in o['materials']}
textures={t['id']:t for t in scene_data['textures']}; material_records={m['id']:m for m in scene_data['materials']};materials={};geometry_materials={}
scene03_water_ids={r['id'] for r in scene_data['materials'] if canonical_reference==3 and r['name']=='pond green depths'}
scene02_water_ids={r['id'] for r in scene_data['materials'] if canonical_reference==2 and r['name']=='scene02-water'}
for rec in scene_data['materials']:
    mat=bpy.data.materials.new(rec['name'] or rec['id']);mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();links=mat.node_tree.links
    bs=n.new('ShaderNodeBsdfPrincipled');out=n.new('ShaderNodeOutputMaterial');links.new(bs.outputs['BSDF'],out.inputs['Surface'])
    color=tuple(rec.get('color') or [.5,.5,.5])+ (1,)
    value(bs,['Base Color'],color);value(bs,['Metallic'],float(rec.get('metalness') or 0));value(bs,['Roughness'],max(.04,float(rec.get('roughness') or .4)))
    value(bs,['IOR'],float(rec.get('ior') or 1.5));value(bs,['Transmission Weight','Transmission'],float(rec.get('transmission') or 0))
    value(bs,['Specular IOR Level'],.5*float(rec.get('specularIntensity') if rec.get('specularIntensity') is not None else 1))
    value(bs,['Coat Weight','Clearcoat'],float(rec.get('clearcoat') or 0));value(bs,['Coat Roughness','Clearcoat Roughness'],float(rec.get('clearcoatRoughness') or .15))
    if any(s in rec['name'].lower() for s in ['floor-panel','polished','lacquer','broad-joined-cedar']):
        value(bs,['Coat Weight','Clearcoat'],.38);value(bs,['Coat Roughness','Clearcoat Roughness'],.16)
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
    if 'bumpMap' in tex_nodes:
        bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.14 if rec['id'] in scene02_water_ids else .45;bump.inputs['Distance'].default_value=.0012 if rec['id'] in scene02_water_ids else abs(float(rec.get('bumpScale') or .003));links.new(tex_nodes['bumpMap'].outputs['Color'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])
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
    if rec['id'] in scene03_water_ids:
        value(bs,['Base Color'],(.018,.044,.028,1));value(bs,['Roughness'],.055);value(bs,['IOR'],1.333)
        value(bs,['Metallic'],0);value(bs,['Transmission Weight','Transmission'],.035)
        value(bs,['Coat Weight','Clearcoat'],.72);value(bs,['Coat Roughness','Clearcoat Roughness'],.035)
        position=n.new('ShaderNodeNewGeometry');wave=n.new('ShaderNodeTexNoise');wave.inputs['Scale'].default_value=2.7;wave.inputs['Detail'].default_value=2.4;wave.inputs['Roughness'].default_value=.64
        links.new(position.outputs['Position'],wave.inputs['Vector']);bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.075;bump.inputs['Distance'].default_value=.0009
        links.new(wave.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])
        report['physicalSurfaceReplacement']={'reference':3,'sourceGeometry':'Existing Three.js pond-bed plane with pond green depths material','worldYBeforeThreeToBlender':-.30,'surfaceRiseMetres':.245,'finalWaterHeight':-.055,'material':'Cycles Principled water, IOR 1.333, shallow procedural micro-ripple normal; actual scene geometry and environment reflections','geometryRebuilt':False,'photographUsed':False}
    if rec['id'] in scene02_water_ids:
        value(bs,['Base Color'],(.012,.032,.020,1));value(bs,['Roughness'],.055);value(bs,['IOR'],1.333)
        value(bs,['Metallic'],0);value(bs,['Transmission Weight','Transmission'],.025)
        value(bs,['Coat Weight','Clearcoat'],.62);value(bs,['Coat Roughness','Clearcoat Roughness'],.045)
        report['physicalSurfaceReplacement']={'reference':2,'sourceGeometry':'Existing Three.js water plane and scene02-water PBR/bump data','worldYBeforeThreeToBlender':.004,'surfaceRiseMetres':.012,'finalWaterHeight':.016,'material':'Cycles Principled water, IOR 1.333, source procedural ripple bump and physical scene reflection','geometryRebuilt':False,'photographUsed':False}
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

report['affinePreservation']={'parentMatrices':'Retained as full source object matrices; all 2,185 source parent matrices are orthogonal/no shear.','linkedLocalMatrices':'Geometry Nodes Object Info + Instance on Points with TRS decomposition only for matrices with normalized column shear residual <= 1e-7; retained translations, rotations and scales.','linkedInstances':linked_instance_count,'bakedShearedInstances':sheared_instance_count,'bakedShearedTriangles':sheared_triangle_count,'bakedShearedVertices':sheared_vertex_count,'maxLinkedTRSMatrixResidual':max_trs_residual,'maxBakedShearResidual':max_shear_residual,'flattenedOnlyForShearedTransforms':True,'geometryDecimated':False}

for rec in scene_data['lights']:
    if rec['intensity']<=0 or rec['type']=='HemisphereLight':continue
    typ={'DirectionalLight':'SUN','PointLight':'POINT','SpotLight':'SPOT','RectAreaLight':'AREA'}.get(rec['type'])
    if not typ:continue
    light=bpy.data.lights.new(rec['name'] or typ,typ);light.color=rec['color'];obj=bpy.data.objects.new(rec['name'] or typ,light);scene.collection.objects.link(obj);obj.matrix_world=Matrix(np.array(rec['matrix']).reshape(4,4).T.tolist())
    intensity=rec['intensity']
    if typ=='SUN':light.energy=intensity*float(os.environ.get('CYCLES_SUN_GAIN','1.0'));light.angle=.0093
    elif typ=='AREA':light.shape='RECTANGLE';light.size=rec.get('width',1);light.size_y=rec.get('height',1);light.energy=intensity*light.size*light.size_y*math.pi
    else:light.energy=intensity*4*math.pi;light.shadow_soft_size=.05
    if typ=='SPOT':light.spot_size=2*(rec.get('angle') or .8);light.spot_blend=rec.get('penumbra') or .2
    if typ in ['SUN','SPOT'] and rec.get('target'):
        direction=Vector(rec['target'])-obj.location;obj.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
    if MODE=='upper-window' and rec['name']=='production-left-window-bounce':
        obj.location=(-6.4,10.7,-6);obj.rotation_euler=(Vector((-1.54,8.4,-9.7))-obj.location).to_track_quat('-Z','Y').to_euler();light.size=2.2;light.size_y=3.5;light.energy=460
    if MODE=='upper-window' and rec['name']=='production-front-room-bounce':light.energy*=.3
    if canonical_reference==6 and MODE=='upper-window' and typ=='SUN':
        # In the source reconstruction, the nominal sun passed above the
        # upper edge of the left clerestory. Fit it through a measured clear
        # cell in the rear-left aperture, then onto the Buddha's camera-facing
        # surface so both direct light and the volume path are visible.
        # This changes only incident lighting; all exported scene geometry,
        # camera pose, and source materials remain untouched.
        altar_target=Vector((0.0,4.4,-1.4))
        # Hit the rear-left opening at (-6.68, 5.18, -4.5), avoiding its
        # actual shutter and grille members before raking across the triad.
        sun_from_target=(Vector((-6.68,5.18,-4.5))-altar_target).normalized()
        obj.location=altar_target+sun_from_target*40.0
        obj.rotation_euler=(altar_target-obj.location).to_track_quat('-Z','Y').to_euler()
        light.energy=float(os.environ.get('CYCLES_SCENE06_SUN_ENERGY','28.0'))
        light.angle=math.radians(float(os.environ.get('CYCLES_SCENE06_SUN_ANGLE','0.5')))
        aperture_hit=altar_target+sun_from_target*((-6.8-altar_target.x)/sun_from_target.x)
        report['scene06SunFit']={'method':'Direct sun aimed from the left through the existing rear-left grille cell, then onto the camera-facing side of the modeled Buddha group; no added shadow masks or geometry','targetYUp':list(altar_target),'sourceDirectionFromTargetYUp':list(sun_from_target),'leftWallIntersectionYUp':list(aperture_hit),'apertureBoundsY':[1.05,5.6],'apertureZBounds':[-5.35,-3.65],'incomingEnergy':light.energy,'angularDiameterDegrees':float(os.environ.get('CYCLES_SCENE06_SUN_ANGLE','0.5')),'photographUsed':False}

cam_data=bpy.data.cameras.new('source-reference-camera');camera=bpy.data.objects.new('source-reference-camera',cam_data);scene.collection.objects.link(camera);camera.matrix_world=Matrix(np.array(scene_data['cameraMatrix']).reshape(4,4).T.tolist());cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=24;cam_data.lens=12/math.tan(math.radians(scene_data['view']['fov'])/2);cam_data.clip_start=.1;cam_data.clip_end=260;scene.camera=camera
# Light Euler targets must reach matrix_world before the rigid conversion reads it.
bpy.context.view_layer.update()
if True:
    # One rigid coordinate change preserves every source transform and the exact source camera pose.
    for obj in list(scene.objects):obj.matrix_world=conversion@obj.matrix_world
    bpy.context.view_layer.update()
    report['worldCoordinateConversion']='All source mesh objects, source lights, linked-instance parents and camera jointly rotated +90 degrees about X: Y-up to Z-up, no deformation.'
# Cycles world: the authored sky-only panorama supplies camera radiance, diffuse GI and reflections.
world=bpy.data.worlds.new('Scene01 generated golden-hour sky radiance proxy');scene.world=world;world.use_nodes=True
nodes=world.node_tree.nodes;nodes.clear();links=world.node_tree.links
texcoord=nodes.new('ShaderNodeTexCoord');sep=nodes.new('ShaderNodeSeparateXYZ');links.new(texcoord.outputs['Normal'],sep.inputs['Vector'])
# Convert Blender Z-up ray to source Three.js Y-up, then apply the same quaternion used by measured-sky.js.
yup=nodes.new('ShaderNodeCombineXYZ');links.new(sep.outputs['X'],yup.inputs['X']);links.new(sep.outputs['Z'],yup.inputs['Y']);neg_y=nodes.new('ShaderNodeMath');neg_y.operation='MULTIPLY';neg_y.inputs[1].default_value=-1.0;links.new(sep.outputs['Y'],neg_y.inputs[0]);links.new(neg_y.outputs[0],yup.inputs['Z'])
sunrec=next((r for r in scene_data['lights'] if r['type']=='DirectionalLight' and r.get('target')),None)
sun_yup=Vector((-.369,.20,-.907))
if sunrec:
    sm=Matrix(np.array(sunrec['matrix']).reshape(4,4).T.tolist());sun_yup=(sm.translation-Vector(sunrec['target'])).normalized()
wanted_lon=math.atan2(sun_yup.z,sun_yup.x);wanted_lat=math.asin(max(-1,min(1,sun_yup.y)));source_lon=-math.pi/2;source_lat=math.radians(3.6)
yaw=Quaternion(Vector((0,1,0)),source_lon-wanted_lon);pitch_axis=Vector((-math.sin(wanted_lon),0,math.cos(wanted_lon)));pitch=Quaternion(pitch_axis,wanted_lat-source_lat);orientation=pitch@yaw;world_to_sky=orientation.inverted().to_matrix()
dsky=[]
for row in range(3):
    dot=nodes.new('ShaderNodeVectorMath');dot.operation='DOT_PRODUCT';dot.inputs[1].default_value=tuple(world_to_sky[row]);links.new(yup.outputs['Vector'],dot.inputs[0]);dsky.append(dot.outputs['Value'])
atan=nodes.new('ShaderNodeMath');atan.operation='ARCTAN2';links.new(dsky[2],atan.inputs[0]);links.new(dsky[0],atan.inputs[1]);u=nodes.new('ShaderNodeMath');u.operation='DIVIDE';u.inputs[1].default_value=2*math.pi;links.new(atan.outputs[0],u.inputs[0]);uadd=nodes.new('ShaderNodeMath');uadd.operation='ADD';uadd.inputs[1].default_value=.5;links.new(u.outputs[0],uadd.inputs[0])
asin=nodes.new('ShaderNodeMath');asin.operation='ARCSINE';links.new(dsky[1],asin.inputs[0]);v=nodes.new('ShaderNodeMath');v.operation='DIVIDE';v.inputs[1].default_value=-math.pi;links.new(asin.outputs[0],v.inputs[0]);vadd=nodes.new('ShaderNodeMath');vadd.operation='ADD';vadd.inputs[1].default_value=.5;links.new(v.outputs[0],vadd.inputs[0])
uv=nodes.new('ShaderNodeCombineXYZ');links.new(uadd.outputs[0],uv.inputs['X']);links.new(vadd.outputs[0],uv.inputs['Y'])
sky_asset=REPO/'assets/generated-golden-sky-v01/sky-equirectangular.png';sky_image=bpy.data.images.load(str(sky_asset),check_existing=True);sky_image.colorspace_settings.name='sRGB'
image=nodes.new('ShaderNodeTexImage');image.image=sky_image;image.extension='REPEAT';image.interpolation='Linear';links.new(uv.outputs['Vector'],image.inputs['Vector'])
camera_base=nodes.new('ShaderNodeVectorMath');camera_base.operation='SCALE';camera_base.inputs[3].default_value=.96;links.new(image.outputs['Color'],camera_base.inputs[0])
gi_base=nodes.new('ShaderNodeVectorMath');gi_base.operation='SCALE';gi_base.inputs[3].default_value=1.56;links.new(image.outputs['Color'],gi_base.inputs[0])
sun_source=Vector((math.cos(source_lat)*math.cos(source_lon),math.sin(source_lat),math.cos(source_lat)*math.sin(source_lon)))
dot_sun=nodes.new('ShaderNodeVectorMath');dot_sun.operation='DOT_PRODUCT';dot_sun.inputs[1].default_value=tuple(sun_source)
dsky_vec=nodes.new('ShaderNodeCombineXYZ');links.new(dsky[0],dsky_vec.inputs['X']);links.new(dsky[1],dsky_vec.inputs['Y']);links.new(dsky[2],dsky_vec.inputs['Z']);links.new(dsky_vec.outputs['Vector'],dot_sun.inputs[0])
clampdot=nodes.new('ShaderNodeMath');clampdot.operation='MAXIMUM';clampdot.inputs[1].default_value=0;links.new(dot_sun.outputs['Value'],clampdot.inputs[0])
# The source sun's observed bright core is approximately 1 degree; its warm halo remains in the sky-only panorama.
disk=nodes.new('ShaderNodeMapRange');disk.clamp=True;disk.inputs['From Min'].default_value=.999945;disk.inputs['From Max'].default_value=.999962;disk.inputs['To Min'].default_value=0;disk.inputs['To Max'].default_value=1;links.new(clampdot.outputs[0],disk.inputs['Value'])
halo=nodes.new('ShaderNodeMath');halo.operation='POWER';halo.inputs[1].default_value=190;links.new(clampdot.outputs[0],halo.inputs[0])
disk_rgb=nodes.new('ShaderNodeVectorMath');disk_rgb.operation='SCALE';disk_rgb.inputs[0].default_value=(40,23,8);links.new(disk.outputs['Result'],disk_rgb.inputs[3])
halo_rgb=nodes.new('ShaderNodeVectorMath');halo_rgb.operation='SCALE';halo_rgb.inputs[0].default_value=(.75,.22,.025);links.new(halo.outputs[0],halo_rgb.inputs[3])
cam_add=nodes.new('ShaderNodeVectorMath');cam_add.operation='ADD';links.new(camera_base.outputs['Vector'],cam_add.inputs[0]);links.new(disk_rgb.outputs['Vector'],cam_add.inputs[1]);cam_add2=nodes.new('ShaderNodeVectorMath');cam_add2.operation='ADD';links.new(cam_add.outputs['Vector'],cam_add2.inputs[0]);links.new(halo_rgb.outputs['Vector'],cam_add2.inputs[1])
camera_background=nodes.new('ShaderNodeBackground');camera_background.inputs['Strength'].default_value=1;links.new(cam_add2.outputs['Vector'],camera_background.inputs['Color'])
# The source HemisphereLight has no shadow map; add its measured sky/ground colors as a modest environment contribution for non-camera rays.
hemi_sep=nodes.new('ShaderNodeSeparateXYZ');links.new(yup.outputs['Vector'],hemi_sep.inputs['Vector']);hemi_add=nodes.new('ShaderNodeMath');hemi_add.operation='ADD';hemi_add.inputs[1].default_value=1;links.new(hemi_sep.outputs['Y'],hemi_add.inputs[0]);hemi_factor=nodes.new('ShaderNodeMath');hemi_factor.operation='MULTIPLY';hemi_factor.inputs[1].default_value=.5;links.new(hemi_add.outputs[0],hemi_factor.inputs[0]);hemi_floor=nodes.new('ShaderNodeMath');hemi_floor.operation='MAXIMUM';hemi_floor.inputs[1].default_value=0;links.new(hemi_factor.outputs[0],hemi_floor.inputs[0]);hemi_ceiling=nodes.new('ShaderNodeMath');hemi_ceiling.operation='MINIMUM';hemi_ceiling.inputs[1].default_value=1;links.new(hemi_floor.outputs[0],hemi_ceiling.inputs[0])
hemi_mix=nodes.new('ShaderNodeMixRGB');hemi_mix.blend_type='MIX';hemi_mix.inputs[1].default_value=(.039546,.020289,.008023,1);hemi_mix.inputs[2].default_value=(.423268,.584078,.846873,1);links.new(hemi_ceiling.outputs[0],hemi_mix.inputs[0])
hemi_gain=nodes.new('ShaderNodeVectorMath');hemi_gain.operation='SCALE';hemi_gain.inputs[3].default_value=.36;links.new(hemi_mix.outputs['Color'],hemi_gain.inputs[0]);gi_add=nodes.new('ShaderNodeVectorMath');gi_add.operation='ADD';links.new(gi_base.outputs['Vector'],gi_add.inputs[0]);links.new(hemi_gain.outputs['Vector'],gi_add.inputs[1])
gi_background=nodes.new('ShaderNodeBackground');gi_background.inputs['Strength'].default_value=1;links.new(gi_add.outputs['Vector'],gi_background.inputs['Color'])
light_path=nodes.new('ShaderNodeLightPath');mix_world=nodes.new('ShaderNodeMixShader');links.new(light_path.outputs['Is Camera Ray'],mix_world.inputs[0]);links.new(camera_background.outputs['Background'],mix_world.inputs[1]);links.new(gi_background.outputs['Background'],mix_world.inputs[2]);output=nodes.new('ShaderNodeOutputWorld');links.new(mix_world.outputs[0],output.inputs['Surface'])
report['skyRadianceProxy']={'file':'assets/generated-golden-sky-v01/sky-equirectangular.png','sha256':__import__('hashlib').sha256(sky_asset.read_bytes()).hexdigest(),'provenanceFile':'assets/generated-golden-sky-v01/provenance.json','source':'Sky-only generated image; no reference-photo pixels and no architecture/garden content. sRGB decoded by Blender and used as 3D environment radiance.','linearGain':3.0,'cyclesWorldGain':1.56,'orientation':'Port of measured-sky.js yaw/pitch mapping with Blender Image Texture V-axis orientation accounted for; source glow longitude -90 degrees and latitude 3.6 degrees are aligned to exported analytic DirectionalLight direction.','analyticSunDirectionYUp':list(sun_yup),'cameraRadianceGain':.96,'environmentRadianceGain':1.56,'hemisphereLightApproximation':{'sourceSkyColorLinear':[.423268,.584078,.846873],'sourceGroundColorLinear':[.039546,.020289,.008023],'sourceIntensity':.36,'method':'Shadowed environment radiance added only to non-camera rays'},'analyticSunDisk':'Cycles world camera-ray disk aligned to source SUN_DIRECTION; full-bright angular core about 1.0 degree with a 1.2 degree soft support. The source-aligned directional sun supplies direct/indirect physical illumination; disk excluded from non-camera environment rays.'}
# Physical pond replacement for the excluded native Reflector shader; same rectangle and world-space placement.
water_vertices=[(-17,.13,-10.3),(-17,.13,20.7),(17,.13,20.7),(17,.13,-10.3)]
water_mesh=bpy.data.meshes.new('Scene01 physical pond reflection plane (34x31m)');water_mesh.from_pydata(water_vertices,[],[(0,1,2,3)]);water_mesh.update()
water=bpy.data.objects.new('Scene01 physical pond reflection plane (native Reflector footprint)',water_mesh);scene.collection.objects.link(water);water.matrix_world=conversion
water_mat=bpy.data.materials.new('Scene01 pond water, physical Cycles reflection IOR 1.333');water_mat.use_nodes=True;wnodes=water_mat.node_tree.nodes;wnodes.clear();wlinks=water_mat.node_tree.links;bs=wnodes.new('ShaderNodeBsdfPrincipled');bs.inputs['Base Color'].default_value=(.008,.027,.015,1);bs.inputs['Roughness'].default_value=.16;bs.inputs['IOR'].default_value=1.333;bs.inputs['Metallic'].default_value=0;bs.inputs['Transmission Weight'].default_value=.015;bs.inputs['Coat Weight'].default_value=.22;bs.inputs['Coat Roughness'].default_value=.12
pos=wnodes.new('ShaderNodeNewGeometry');noise=wnodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=2.7;noise.inputs['Detail'].default_value=2.4;noise.inputs['Roughness'].default_value=.64;wlinks.new(pos.outputs['Position'],noise.inputs['Vector']);bump=wnodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.035;bump.inputs['Distance'].default_value=.0007;wlinks.new(noise.outputs['Fac'],bump.inputs['Height']);wlinks.new(bump.outputs['Normal'],bs.inputs['Normal']);wout=wnodes.new('ShaderNodeOutputMaterial');wlinks.new(bs.outputs['BSDF'],wout.inputs['Surface']);water_mesh.materials.append(water_mat)
report['physicalWaterReplacement']={'nativeReflectorPlane':[34,31],'nativeWorldPositionYUp':[0,.13,5.2],'cyclesPlaneVerticesYUp':water_vertices,'material':'Cycles Principled water with actual 1.333 IOR reflection, roughness 0.16, dark-green shallow-water body and subtle procedural micro-normal. Uses full scene geometry and generated sky as reflected radiance.','nativeCustomShader':'The Three.js planar ripple/reflection screen-space shader is renderer-specific and was not transplanted; this is a physical 3D surface approximation, not pixel equivalence.','photographUsed':False}
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=int(os.environ.get('CYCLES_SAMPLES','64'))
if os.environ.get('CYCLES_DEVICE')=='METAL':
    preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
    for device in preferences.devices:device.use=device.type=='METAL'
    if not any(device.use for device in preferences.devices):raise RuntimeError('Requested Metal GPU is unavailable')
    scene.cycles.device='GPU'
report['cyclesDevice']=scene.cycles.device
# Ubuntu's distribution Blender can be built without Intel OpenImageDenoise.
# That build fails during render with "Build without OpenImageDenoiser" when
# use_denoising is true. Render actual Cycles samples without denoising by default.
# Any explicitly requested denoising must have a compatible compiled backend.
denoise_requested=os.environ.get('CYCLES_DENOISE','0').strip()=='1'
if denoise_requested and bpy.app.version<(5,0,0) and not getattr(bpy.app.build_options,'openimagedenoise',False):
    raise RuntimeError('Requested OIDN denoising, but Blender was built without OpenImageDenoiser')
scene.cycles.use_denoising=denoise_requested
if denoise_requested:scene.cycles.denoiser='OPENIMAGEDENOISE'
for layer in scene.view_layers:
    if hasattr(layer,'cycles'):
        layer.cycles.use_denoising=denoise_requested
report['denoisingEnabled']=denoise_requested
report['denoisingReason']='Native Cycles non-denoised output retained for unsupported distribution builds' if not denoise_requested else 'Verified built-in OpenImageDenoise'
scene.cycles.max_bounces=8;scene.cycles.diffuse_bounces=4;scene.cycles.glossy_bounces=4;scene.cycles.transmission_bounces=6;scene.cycles.volume_bounces=1;scene.cycles.sample_clamp_indirect=8
scene.render.resolution_x=int(os.environ.get('CYCLES_SIZE','960'));scene.render.resolution_y=scene.render.resolution_x;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.threads_mode='FIXED';scene.render.threads=int(os.environ.get('CYCLES_THREADS','4'))
try:scene.view_settings.view_transform='AgX'
except:scene.view_settings.view_transform='Filmic'
scene.view_settings.exposure=float(os.environ.get('CYCLES_EXPOSURE','0.043'));scene.view_settings.gamma=1
render_name=os.environ.get('CYCLES_RENDER_NAME','sanctuary-cycles.png')
if Path(render_name).name!=render_name:raise ValueError('CYCLES_RENDER_NAME must be a filename')
scene.render.filepath=str(OUT/render_name);scene.render.film_transparent=False
report['materialAttributeParity']={'linkedInstances':'ShaderNodeAttribute Instancer mode plus explicit point Store Named Attribute','bakedShearAndDirect':'Separate Geometry-domain material variants; direct source mesh instanceColor fallback is white, baked shear retains source RGB','vertexColorMultiply':'Kept only when the source vertexColors flag is true; instanceColors-only records do not also multiply sourceColor.'};report['importedTriangles']=imported_triangles;report['sourceTriangleCount']=scene_data['statistics']['triangles'];report['geometryTriangleCountPreserved']=imported_triangles==scene_data['statistics']['triangles'];report['excludedCollapsedInstanceCount']=collapsed_instance_count;report['status']='rendering';report['materialTransfer']='Exported source PBR parameters/textures; original custom GLSL material hooks are not automatically portable. Original sky shader is represented by the authored sky-only radiance image plus source-aligned analytic Sun. Native planar water shader is replaced by a physical Cycles surface reflection.';report['lightCalibration']={'transfer':'Scene01 source positions/colors; area*pi and point*4pi power conversion; direct SUN coupled to generated sky.','sunGain':float(os.environ.get('CYCLES_SUN_GAIN','1.0')),'worldGain':'Source camera radiance gain 3x0.32=0.96 and source environment/IBL gain 3x0.52=1.56, selected by Cycles Light Path; source HemisphereLight .36 is added as a sky/ground environment contribution to non-camera rays.','exposure':scene.view_settings.exposure,'nativeWebglPixelEquivalence':False,'sunSourceIntensity':6.2,'coolShadowSideSourceIntensity':1.45,'nativeToneMap':'Three ACESFilmic receives linear exposure multiplier 1.03; matching Cycles EV starting point is log2(1.03)=0.043 stops. AgX and ACESFilmic are different curves and are not pixel-equivalent.'}
(OUT/'report.json').write_text(json.dumps(report,indent=2));
if os.environ.get('CYCLES_SAVE_BLEND','1')=='1':
    blend_name=os.environ.get('CYCLES_BLEND_NAME','existing-sanctuary-cycles.blend')
    if Path(blend_name).name!=blend_name:raise ValueError('CYCLES_BLEND_NAME must be a filename')
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/blend_name),compress=True)
bpy.ops.render.render(write_still=True)
report['status']='path-traced-review';report['finished']=time.time();report['resolution']=[scene.render.resolution_x,scene.render.resolution_y];report['samples']=scene.cycles.samples;report['photographicAcceptance']=False;(OUT/'report.json').write_text(json.dumps(report,indent=2));print('CYCLES_REVIEW_COMPLETE',json.dumps(report),flush=True)
