"""Independent physical-lighting diagnostic of code-generated Three.js buffers.

The geometry and instance matrices come from a verified native source frame.
Custom GLSL hooks/planar reflection approximations are explicitly not equivalent
across renderers. This diagnostic does not replace native scene acceptance.
"""
import bpy, json, math, os, sys, time, hashlib
from pathlib import Path
import numpy as np
from mathutils import Matrix, Vector
ROOT=Path(os.environ.get('SCENE_PACKAGE','qa/ten-reference/07/cycles-64/export')).resolve()
OUT=Path(os.environ.get('CYCLES_OUTPUT','qa/ten-reference/07/cycles-64/render')).resolve();OUT.mkdir(parents=True,exist_ok=True)
MODE=os.environ.get('LIGHTING_MODE','golden-hour07')
scene_data=json.loads((ROOT/'scene.json').read_text())
report={'sourceStatistics':scene_data['statistics'],'lightingMode':MODE,'blender':bpy.app.version_string,'scope':scene_data.get('renderingScope'),'geometryRebuilt':False,'excluded':scene_data['excluded'],'warnings':[],'status':'importing','started':time.time()}
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
report['buildScript']={'file':Path(__file__).name,'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
report['nativeSourceHash']=json.loads((ROOT/'export-report.json').read_text())['sourceHash']

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
textures={t['id']:t for t in scene_data['textures']}; material_records={m['id']:m for m in scene_data['materials']};materials={}
scanned_ids={r['id'] for r in scene_data['materials'] if all(k in r['textures'] for k in ['map','normalMap','roughnessMap']) and abs(float(r.get('roughness') or 0)-.9)<.00001 and any(np.max(np.abs(np.array(r.get('color') or [0,0,0])-c))<.00001 for c in [[3.1,3.3,4.3],[2.1,2.3,3.0],[.7,.85,1.1]])}
def linear_hex(c):
    v=[((c>>k)&255)/255 for k in [16,8,0]]
    return np.array([x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v])
leaf_colors=[linear_hex(c) for c in [0x314f18,0x8a9c3c,0x606325,0x58763b,0xffd2d7,0xeaaabb,0xeee1c3]]
leaf_ids={r['id'] for r in scene_data['materials'] if r.get('color') and any(np.max(np.abs(np.array(r['color'])-c))<.00001 for c in leaf_colors)}
paper_ids={r['id'] for r in scene_data['materials'] if .1<float(r.get('emissiveIntensity') or 0)<=.7 and float(r.get('metalness') or 0)==0 and any(float(c)>0 for c in (r.get('emissive') or [0,0,0]))}
report['thinMaterialSelection']={'foliageSourcePaletteIds':list(leaf_ids),'paperNonzeroEmissionIds':list(paper_ids),'defaultIntensityOneNotPaper':True}
image_cache={}
report['scannedTimber']={'materials':list(scanned_ids),'uv':'Exact source shader metric projection from per-member dimensions, normals and instance translation','roughness':'Source shader clamp(.36 + .72 * mapG * .9, .42, .94)','maps':'Original CC0 cherry albedo/OpenGL normal/roughness and source linear color gains'}
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
        space='sRGB' if channel in ['map','emissiveMap'] and tex.get('colorSpace')=='srgb' else 'Non-Color';cache_key=(tex['file'],space)
        if cache_key not in image_cache:
            image=bpy.data.images.load(str(ROOT/'assets'/tex['file']),check_existing=False);image.colorspace_settings.name=space;image_cache[cache_key]=image
        image=image_cache[cache_key]
        tn=n.new('ShaderNodeTexImage');tn.image=image;tn.extension='REPEAT';tn.interpolation='Linear';tex_nodes[channel]=tn
        mul=n.new('ShaderNodeVectorMath');mul.operation='MULTIPLY';sx,sy=tex.get('repeat',[1,1]);ox,oy=tex.get('offset',[0,0]);
        if not tex.get('flipY',True): sy=-sy;oy=1-oy
        mul.inputs[1].default_value=(sx,sy,1);links.new(uv.outputs['UV'],mul.inputs[0]);add=n.new('ShaderNodeVectorMath');add.operation='ADD';add.inputs[1].default_value=(ox,oy,0);links.new(mul.outputs[0],add.inputs[0]);links.new(add.outputs[0],tn.inputs['Vector'])
        if tex.get('rotation',0):report['warnings'].append('UV texture rotation unported: '+rec['name']+'/'+channel)
    base_socket=None
    if 'map' in tex_nodes:
        mul=n.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;mul.inputs[2].default_value=color;links.new(tex_nodes['map'].outputs['Color'],mul.inputs[1]);base_socket=mul.outputs[0]
        if rec.get('alphaTest',0)>0:
            clip=n.new('ShaderNodeMath');clip.operation='GREATER_THAN';clip.inputs[1].default_value=float(rec['alphaTest']);links.new(tex_nodes['map'].outputs['Alpha'],clip.inputs[0]);links.new(clip.outputs[0],bs.inputs['Alpha'])
    if rec.get('vertexColors') or rec['id'] in instance_colored:
        attr=n.new('ShaderNodeVertexColor');attr.layer_name='sourceColor';mul=n.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;links.new(attr.outputs['Color'],mul.inputs[1]);
        if base_socket:links.new(base_socket,mul.inputs[2])
        else:mul.inputs[2].default_value=color
        base_socket=mul.outputs[0]
    if base_socket:links.new(base_socket,bs.inputs['Base Color'])
    if 'bumpMap' in tex_nodes:
        bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.45;bump.inputs['Distance'].default_value=abs(float(rec.get('bumpScale') or .003));links.new(tex_nodes['bumpMap'].outputs['Color'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])
    if 'normalMap' in tex_nodes:
        normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=(rec.get('normalScale') or [1])[0];links.new(tex_nodes['normalMap'].outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],bs.inputs['Normal'])
    for ch,input_name,component,factor in [('roughnessMap','Roughness','G',rec.get('roughness',.4)),('metalnessMap','Metallic','B',rec.get('metalness',0))]:
        if ch in tex_nodes:
            sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes[ch].outputs['Color'],sep.inputs['Color']);mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=float(factor);links.new(sep.outputs[{'G':'Green','B':'Blue'}[component]],mul.inputs[0]);links.new(mul.outputs[0],bs.inputs[input_name])
            if ch=='roughnessMap' and rec['id'] in scanned_ids:
                scale=n.new('ShaderNodeMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=.72;links.new(mul.outputs[0],scale.inputs[0]);add=n.new('ShaderNodeMath');add.operation='ADD';add.inputs[1].default_value=.36;links.new(scale.outputs[0],add.inputs[0]);low=n.new('ShaderNodeMath');low.operation='MAXIMUM';low.inputs[1].default_value=.42;links.new(add.outputs[0],low.inputs[0]);high=n.new('ShaderNodeMath');high.operation='MINIMUM';high.inputs[1].default_value=.94;links.new(low.outputs[0],high.inputs[0]);links.new(high.outputs[0],bs.inputs['Roughness'])
    if 'alphaMap' in tex_nodes:
        sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes['alphaMap'].outputs['Color'],sep.inputs['Color']);links.new(sep.outputs['Green'],bs.inputs['Alpha'])
    if 'emissiveMap' in tex_nodes:
        emul=n.new('ShaderNodeMixRGB');emul.blend_type='MULTIPLY';emul.inputs[0].default_value=1;emul.inputs[2].default_value=emission;links.new(tex_nodes['emissiveMap'].outputs['Color'],emul.inputs[1])
        for name in ['Emission Color','Emission']:
            if name in bs.inputs:links.new(emul.outputs[0],bs.inputs[name]);break
    if rec['id'] in leaf_ids or rec['id'] in paper_ids:
        trans=n.new('ShaderNodeBsdfTranslucent')
        if base_socket:links.new(base_socket,trans.inputs['Color'])
        else:trans.inputs['Color'].default_value=color
        mix=n.new('ShaderNodeMixShader');mix.inputs[0].default_value=.38 if rec['id'] in leaf_ids else .25;links.new(bs.outputs[0],mix.inputs[1]);links.new(trans.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],out.inputs['Surface'])
    if rec['id'] in scanned_ids:
        bevel=n.new('ShaderNodeBevel');bevel.inputs['Radius'].default_value=.0018;bevel.samples=4
        if bs.inputs['Normal'].is_linked:links.new(bs.inputs['Normal'].links[0].from_socket,bevel.inputs['Normal'])
        links.new(bevel.outputs['Normal'],bs.inputs['Normal'])
    materials[rec['id']]=mat

geo={g['id']:g for g in scene_data['geometries']}; loaded={};imported_triangles=0
for at,record in enumerate(scene_data['meshes']):
    g=geo[record['geometry']]
    if g['id'] not in loaded:
        loaded[g['id']]={k:binary(v).reshape(-1,v['itemSize']) for k,v in g['attributes'].items()};loaded[g['id']]['index']=binary(g['index']).reshape(-1,3)
    data=loaded[g['id']];p=data['position'];indices=data['index'];count=record['instances'];vcount=len(p);fcount=len(indices)
    world=np.array(record['matrix'],dtype=np.float64).reshape(4,4).T
    if 'instanceMatrices' in record:
        local=binary(record['instanceMatrices']).reshape(count,4,4).transpose(0,2,1);transforms=np.einsum('ij,njk->nik',world,local)
    else:transforms=world[None,:,:]
    coords=np.empty((count*vcount,3),dtype=np.float32);normals=np.empty_like(coords) if 'normal' in data else None
    metric=np.empty((count*vcount,2),dtype=np.float32) if any(mid in scanned_ids for mid in record['materials']) else None
    extent=np.max(p,axis=0)-np.min(p,axis=0)
    for i,transform in enumerate(transforms):
        coords[i*vcount:(i+1)*vcount]=p@transform[:3,:3].T+transform[:3,3]
        if normals is not None:
            ns=data['normal']@np.linalg.inv(transform[:3,:3]);length=np.maximum(np.linalg.norm(ns,axis=1),1e-12);normals[i*vcount:(i+1)*vcount]=ns/length[:,None]
        if metric is not None:
            scale=np.linalg.norm(transform[:3,:3],axis=0);point=p*scale;spans=extent*scale;nn=np.abs(data['normal']);phase=math.sin(float(np.dot(transform[:3,3],[12.713,4.13,5.71])))*43758.5453;offset=phase-math.floor(phase)
            if spans[1]>=spans[0] and spans[1]>=spans[2]:u=point[:,1];v=np.where(nn[:,0]>nn[:,2],point[:,2],point[:,0])
            elif spans[0]>=spans[2]:u=point[:,0];v=np.where(nn[:,1]>nn[:,2],point[:,2],point[:,1])
            else:u=point[:,2];v=np.where(nn[:,1]>nn[:,0],point[:,0],point[:,1])
            metric[i*vcount:(i+1)*vcount]=np.stack([u+offset,v+offset*.37],axis=1)
    faces=(indices[None,:,:]+(np.arange(count,dtype=np.uint32)*vcount)[:,None,None]).reshape(-1,3)
    for i,tr in enumerate(transforms):
        if np.linalg.det(tr[:3,:3])<0:faces[i*fcount:(i+1)*fcount]=faces[i*fcount:(i+1)*fcount][:,[0,2,1]]
    mesh=bpy.data.meshes.new(record['name'] or 'source-mesh-'+str(at));mesh.vertices.add(len(coords));mesh.vertices.foreach_set('co',coords.ravel());mesh.loops.add(faces.size);mesh.loops.foreach_set('vertex_index',faces.ravel().astype(np.int32));mesh.polygons.add(len(faces));mesh.polygons.foreach_set('loop_start',np.arange(len(faces),dtype=np.int32)*3);mesh.polygons.foreach_set('loop_total',np.full(len(faces),3,dtype=np.int32));mesh.polygons.foreach_set('use_smooth',np.ones(len(faces),dtype=np.bool_));mesh.update(calc_edges=True)
    if normals is not None:
        try:mesh.normals_split_custom_set_from_vertices(normals)
        except Exception as e:report['warnings'].append('Custom normals: '+str(e))
    if metric is not None:
        uv=metric[faces.ravel()];layer=mesh.uv_layers.new(name='sourceMetricUV');layer.data.foreach_set('uv',uv.ravel())
    elif 'uv' in data:
        uv=data['uv'][faces.ravel()%vcount,:2].astype(np.float32);layer=mesh.uv_layers.new(name='sourceUV');layer.data.foreach_set('uv',uv.ravel())
    if 'color' in data or 'instanceColors' in record or any(mid in instance_colored for mid in record['materials']):
        colors=np.ones((len(coords),4),dtype=np.float32)
        if 'color' in data: colors[:,:min(4,data['color'].shape[1])]=np.tile(data['color'],(count,1))[:,:4]
        if 'instanceColors' in record: colors[:,:3]*=np.repeat(binary(record['instanceColors']).reshape(count,3),vcount,axis=0)
        attr=mesh.color_attributes.new(name='sourceColor',type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',colors.ravel())
    for mid in record['materials']:mesh.materials.append(materials[mid])
    if len(record['materials'])>1 and g['groups']:
        owners=np.zeros(fcount,dtype=np.int32)
        for group in g['groups']:owners[group['start']//3:(group['start']+group['count'])//3]=group.get('materialIndex',0)
        mesh.polygons.foreach_set('material_index',np.tile(owners,count))
    obj=bpy.data.objects.new(record['name'] or 'source-object-'+str(at),mesh);scene.collection.objects.link(obj);imported_triangles+=len(faces)
    if at%20==0:print('SOURCE_MESH',at,'/',len(scene_data['meshes']),'triangles',imported_triangles,flush=True)

for rec in scene_data['lights']:
    if rec['intensity']<=0 or rec['type'] in ['HemisphereLight','DirectionalLight']:continue
    typ={'DirectionalLight':'SUN','PointLight':'POINT','SpotLight':'SPOT','RectAreaLight':'AREA'}.get(rec['type'])
    if not typ:continue
    light=bpy.data.lights.new(rec['name'] or typ,typ);light.color=rec['color'];obj=bpy.data.objects.new(rec['name'] or typ,light);scene.collection.objects.link(obj);obj.matrix_world=Matrix(np.array(rec['matrix']).reshape(4,4).T.tolist())
    intensity=rec['intensity']
    if typ=='SUN':light.energy=intensity*float(os.environ.get('CYCLES_SUN_GAIN','.28'));light.angle=.0093
    elif typ=='AREA':light.shape='RECTANGLE';light.size=rec.get('width',1);light.size_y=rec.get('height',1);light.energy=intensity*light.size*light.size_y*math.pi
    else:light.energy=intensity*4*math.pi;light.shadow_soft_size=.10
    if typ=='SPOT':light.spot_size=2*(rec.get('angle') or .8);light.spot_blend=rec.get('penumbra') or .2
    if typ in ['SUN','SPOT'] and rec.get('target'):
        direction=Vector(rec['target'])-obj.location;obj.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
    if MODE=='upper-window' and rec['name']=='production-left-window-bounce':
        obj.location=(-6.4,10.7,-6);obj.rotation_euler=(Vector((-1.54,8.4,-9.7))-obj.location).to_track_quat('-Z','Y').to_euler();light.size=2.2;light.size_y=3.5;light.energy=460
    if MODE=='upper-window' and rec['name']=='production-front-room-bounce':light.energy*=.3

cam_data=bpy.data.cameras.new('source-reference07-camera');camera=bpy.data.objects.new('source-reference07-camera',cam_data);scene.collection.objects.link(camera);camera.matrix_world=Matrix(np.array(scene_data['cameraMatrix']).reshape(4,4).T.tolist());cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=24;cam_data.lens=12/math.tan(math.radians(scene_data['view']['fov'])/2);cam_data.clip_start=.1;cam_data.clip_end=350;scene.camera=camera
if MODE in ['outdoor-day','golden-hour07']:
    # Rigidly convert the entire recovered world, including every light and
    # the camera, into Blender's ordinary Z-up frame. Distances, silhouette
    # and relative camera pose are preserved by this single shared rotation.
    conversion=Matrix.Rotation(math.pi/2,4,'X')
    for obj in list(scene.objects):obj.matrix_world=conversion@obj.matrix_world
    report['worldCoordinateConversion']='All source meshes, lights and camera jointly rotated +90 degrees about X: Y-up to Z-up, no deformation.'
world=bpy.data.worlds.new('Measured CC0 sunset transport');scene.world=world;world.use_nodes=True;wn=world.node_tree.nodes;wl=world.node_tree.links;wn.clear();output=wn.new('ShaderNodeOutputWorld');background=wn.new('ShaderNodeBackground');background.inputs['Strength'].default_value=float(os.environ.get('CYCLES_WORLD_GAIN','1.0'));wl.new(background.outputs[0],output.inputs['Surface'])
hdri_path=Path(os.environ.get('TEMPLE_SKY_EXR','/Users/mima1234/temple-cinema-live-sync/assets/polyhaven/qwantani-sunset-puresky/sky-2k.exr')).resolve()
env=wn.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(hdri_path));env.image.colorspace_settings.name='Linear Rec.709';env.projection='EQUIRECTANGULAR'
pixels=np.empty(env.image.size[0]*env.image.size[1]*4,dtype=np.float32);env.image.pixels.foreach_get(pixels);rgb=pixels.reshape(env.image.size[1],env.image.size[0],4)[:,:,:3];luma=rgb@np.asarray([.2126,.7152,.0722],dtype=np.float32);sun_y,sun_x=np.unravel_index(np.argmax(luma),luma.shape)
measured_azimuth=math.pi-2*math.pi*((sun_x+.5)/env.image.size[0]);measured_altitude=math.pi*((sun_y+.5)/env.image.size[1]-.5)
# Coherent physical calibration uses the authored key bearing/elevation.
# The separate old background sun was only2 degrees and was hill-occluded.
primary=max((r for r in scene_data['lights'] if r['type']=='DirectionalLight'),key=lambda r:r['intensity']);primary_matrix=Matrix(np.array(primary['matrix']).reshape(4,4).T.tolist());target_yup=(primary_matrix.translation-Vector(primary['target'])).normalized();target=Vector((target_yup.x,-target_yup.z,target_yup.y));target_azimuth=math.atan2(target.y,target.x);target_altitude=math.asin(target.z)
tilt_axis=Vector((math.sin(measured_azimuth),-math.cos(measured_azimuth),0));yaw=Matrix.Rotation(measured_azimuth-target_azimuth,4,'Z');tilt=Matrix.Rotation(measured_altitude-target_altitude,4,tilt_axis);lookup=tilt@yaw
uv=wn.new('ShaderNodeTexCoord');outward=wn.new('ShaderNodeVectorMath');outward.operation='MULTIPLY';outward.inputs[1].default_value=(-1,-1,-1);mapping=wn.new('ShaderNodeMapping');mapping.inputs['Rotation'].default_value=lookup.to_euler('XYZ');wl.new(uv.outputs['Normal'],outward.inputs[0]);wl.new(outward.outputs[0],mapping.inputs['Vector']);wl.new(mapping.outputs[0],env.inputs['Vector']);wl.new(env.outputs[0],background.inputs['Color'])
report['measuredSky']={'file':str(hdri_path),'sha256':hashlib.sha256(hdri_path.read_bytes()).hexdigest(),'provider':'Poly Haven','asset':'qwantani_sunset_puresky','license':'CC0-1.0','maximumLuminance':float(luma.max()),'meanLuminance':float(luma.mean()),'sunPixel':[int(sun_x),int(sun_y)],'measuredAzimuthDegrees':math.degrees(measured_azimuth),'measuredAltitudeDegrees':math.degrees(measured_altitude),'targetDirectionYUp':list(target_yup),'targetAzimuthDegrees':math.degrees(target_azimuth),'targetAltitudeDegrees':math.degrees(target_altitude),'lookupEuler':list(mapping.inputs['Rotation'].default_value),'mappingFormula':'phi = pi - 2*pi*u; World TextureCoordinate Normal is -ray_D, multiplied by(-1,-1,-1) BEFORE Mapping','radianceUse':'Same measured environment for camera, GI and reflections; no projected frame','sourceURL':'https://polyhaven.com/a/qwantani_sunset_puresky'}
report['disabledProxyLights']=[{'type':r['type'],'intensity':r['intensity']} for r in scene_data['lights'] if r['type'] in ['HemisphereLight','DirectionalLight']]

# Exact irregular source pond footprint: z-source is stretched .6, then -3.
outline=[[-15,3],[-9,2],[-4,4],[3,3],[9,4],[14,7],[15,12],[12,15],[16,22],[15,30],[9,34],[1,32],[-8,28],[-14,27],[-16,20],[-13,15],[-16,10]]
plan=[(x,3-z*.6) for x,z in outline];area=sum(plan[i][0]*plan[(i+1)%len(plan)][1]-plan[(i+1)%len(plan)][0]*plan[i][1] for i in range(len(plan)))
if area<0:plan.reverse()
N=len(plan);verts=[(x,y,.015) for x,y in plan]+[(x,y,-.285) for x,y in plan];faces=[tuple(range(N)),tuple(reversed(range(N,2*N)))]+[(i,(i+1)%N,(i+1)%N+N,i+N) for i in range(N)]
mesh=bpy.data.meshes.new('source07 irregular pond closed physical volume');mesh.from_pydata(verts,[],faces);mesh.update();pond=bpy.data.objects.new('physical source07 pond - exact visible boundary',mesh);scene.collection.objects.link(pond)
water=bpy.data.materials.new('physical green pond water IOR1.333');water.use_nodes=True;n=water.node_tree.nodes;l=water.node_tree.links;bs=n.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.80,.91,.87,1);bs.inputs['Roughness'].default_value=.030;bs.inputs['IOR'].default_value=1.333;value(bs,['Transmission Weight','Transmission'],1)
geo=n.new('ShaderNodeNewGeometry');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=9;noise.inputs['Detail'].default_value=3;l.new(geo.outputs['Position'],noise.inputs['Vector']);bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.24;bump.inputs['Distance'].default_value=.003;l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs[0],bs.inputs['Normal']);absorption=n.new('ShaderNodeVolumeAbsorption');absorption.inputs['Color'].default_value=(.10,.28,.22,1);absorption.inputs['Density'].default_value=.50;l.new(absorption.outputs[0],n.get('Material Output').inputs['Volume']);mesh.materials.append(water)
report['physicalSurfaceReplacement']={'source':'Only the existing irregular pond Reflector','sourceYUpTop':.015,'planTransform':'(x,z)->(x,z*.6-3)','footprint':outline,'closureDepth':.30,'bed':'Existing source soil box top atY=-.3 retained','wetDeck':'No source wet-deck reflector or floor footprint exists; no visible deck plane is invented'}
# Physical finite atmospheric transport, not a color overlay.
haze=bpy.data.materials.new('inferred atmospheric scattering');haze.use_nodes=True;hn=haze.node_tree.nodes;hl=haze.node_tree.links;hn.clear();scatter=hn.new('ShaderNodeVolumeScatter');scatter.inputs['Density'].default_value=.0002;scatter.inputs['Anisotropy'].default_value=.35;out=hn.new('ShaderNodeOutputMaterial');hl.new(scatter.outputs[0],out.inputs['Volume']);bpy.ops.mesh.primitive_cube_add(size=1,location=(0,60,45));air=bpy.context.object;air.name='finite atmospheric transport - inferred density';air.dimensions=(600,600,110);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);air.data.materials.append(haze)
report['addedPhysicalContext']={'kind':'Finite atmospheric transport','density':.0002,'anisotropy':.35,'inferredNotRecovered':True}
scene.cycles.seed=73067;scene.cycles.use_animated_seed=False
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=int(os.environ.get('CYCLES_SAMPLES','32'))
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
scene.cycles.max_bounces=12;scene.cycles.diffuse_bounces=6;scene.cycles.glossy_bounces=6;scene.cycles.transmission_bounces=8;scene.cycles.volume_bounces=1;scene.cycles.sample_clamp_indirect=8;scene.cycles.transparent_max_bounces=12;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.015;scene.cycles.adaptive_min_samples=32
scene.render.resolution_x=int(os.environ.get('CYCLES_SIZE','640'));scene.render.resolution_y=scene.render.resolution_x;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.threads_mode='FIXED';scene.render.threads=int(os.environ.get('CYCLES_THREADS','4'))
try:scene.view_settings.view_transform='AgX'
except:scene.view_settings.view_transform='Filmic'
scene.view_settings.exposure=float(os.environ.get('CYCLES_EXPOSURE','0'));scene.view_settings.gamma=1
render_name=os.environ.get('CYCLES_RENDER_NAME','scene07-cycles64.png')
if Path(render_name).name!=render_name:raise ValueError('CYCLES_RENDER_NAME must be a filename')
scene.render.filepath=str(OUT/render_name);scene.render.film_transparent=False
report['importedTriangles']=imported_triangles;report['geometryTriangleCountPreserved']=imported_triangles==scene_data['statistics']['triangles'];report['status']='rendering';report['materialTransfer']='Original portable PBR values, source scanned timber metric UV/roughness response and physical thin-leaf transmission. Measured world transport and physical source-footprint pond replace the GLSL approximations.';report['lightCalibration']={'transfer':'Source positions/colors; area*pi and point*4pi power conversion','sunGain':float(os.environ.get('CYCLES_SUN_GAIN','.28')),'worldGain':float(os.environ.get('CYCLES_WORLD_GAIN','1.0')),'exposure':scene.view_settings.exposure,'nativeWebglPixelEquivalence':False}
(OUT/'report.json').write_text(json.dumps(report,indent=2));
if os.environ.get('CYCLES_SAVE_BLEND','1')=='1':
    blend_name=os.environ.get('CYCLES_BLEND_NAME','scene07-cycles64.blend')
    if Path(blend_name).name!=blend_name:raise ValueError('CYCLES_BLEND_NAME must be a filename')
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/blend_name),compress=True)
bpy.ops.render.render(write_still=True)
report['status']='path-traced-review';report['finished']=time.time();report['resolution']=[scene.render.resolution_x,scene.render.resolution_y];report['samples']=scene.cycles.samples;report['photographicAcceptance']=False;(OUT/'report.json').write_text(json.dumps(report,indent=2));print('CYCLES_REVIEW_COMPLETE',json.dumps(report),flush=True)
