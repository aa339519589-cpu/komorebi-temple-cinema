"""Independent physical-lighting diagnostic of code-generated Three.js buffers.

The geometry and instance matrices come from a verified native source frame.
Custom GLSL hooks/planar reflection approximations are explicitly not equivalent
across renderers. This diagnostic does not replace native scene acceptance.
"""
import bpy, json, math, os, sys, time
from pathlib import Path
import numpy as np
from mathutils import Matrix, Vector
ROOT=Path(os.environ.get('SCENE_PACKAGE','output/pathtrace-reference-06')).resolve()
OUT=Path(os.environ.get('CYCLES_OUTPUT','output/pathtrace-light-review-06')).resolve();OUT.mkdir(parents=True,exist_ok=True)
MODE=os.environ.get('LIGHTING_MODE','as-exported')
scene_data=json.loads((ROOT/'scene.json').read_text())
source_export=json.loads((ROOT/'export-report.json').read_text())
canonical_reference=int(scene_data.get('view',{}).get('reference',0))
report={'sourceCommit':source_export.get('sourceCommit'),'sourceHash':source_export.get('sourceHash'),'sourceStatistics':scene_data['statistics'],'lightingMode':MODE,'blender':bpy.app.version_string,'scope':scene_data.get('renderingScope'),'geometryRebuilt':False,'excluded':scene_data['excluded'],'warnings':[],'status':'importing','started':time.time()}
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

instance_colored={mid for o in scene_data['meshes'] if 'instanceColors' in o for mid in o['materials']}
textures={t['id']:t for t in scene_data['textures']}; material_records={m['id']:m for m in scene_data['materials']};materials={}
scene03_water_ids={r['id'] for r in scene_data['materials'] if canonical_reference==3 and r['name']=='pond green depths'}
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
    for i,transform in enumerate(transforms):
        coords[i*vcount:(i+1)*vcount]=p@transform[:3,:3].T+transform[:3,3]
        if normals is not None:
            ns=data['normal']@np.linalg.inv(transform[:3,:3]);length=np.maximum(np.linalg.norm(ns,axis=1),1e-12);normals[i*vcount:(i+1)*vcount]=ns/length[:,None]
    if canonical_reference==3 and any(mid in scene03_water_ids for mid in record['materials']):coords[:,1]+=.245
    faces=(indices[None,:,:]+(np.arange(count,dtype=np.uint32)*vcount)[:,None,None]).reshape(-1,3)
    for i,tr in enumerate(transforms):
        if np.linalg.det(tr[:3,:3])<0:faces[i*fcount:(i+1)*fcount]=faces[i*fcount:(i+1)*fcount][:,[0,2,1]]
    mesh=bpy.data.meshes.new(record['name'] or 'source-mesh-'+str(at));mesh.vertices.add(len(coords));mesh.vertices.foreach_set('co',coords.ravel());mesh.loops.add(faces.size);mesh.loops.foreach_set('vertex_index',faces.ravel().astype(np.int32));mesh.polygons.add(len(faces));mesh.polygons.foreach_set('loop_start',np.arange(len(faces),dtype=np.int32)*3);mesh.polygons.foreach_set('loop_total',np.full(len(faces),3,dtype=np.int32));mesh.polygons.foreach_set('use_smooth',np.ones(len(faces),dtype=np.bool_));mesh.update(calc_edges=True)
    if normals is not None:
        try:mesh.normals_split_custom_set_from_vertices(normals)
        except Exception as e:report['warnings'].append('Custom normals: '+str(e))
    if 'uv' in data:
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
    if rec['intensity']<=0 or rec['type']=='HemisphereLight':continue
    typ={'DirectionalLight':'SUN','PointLight':'POINT','SpotLight':'SPOT','RectAreaLight':'AREA'}.get(rec['type'])
    if not typ:continue
    light=bpy.data.lights.new(rec['name'] or typ,typ);light.color=rec['color'];obj=bpy.data.objects.new(rec['name'] or typ,light);scene.collection.objects.link(obj);obj.matrix_world=Matrix(np.array(rec['matrix']).reshape(4,4).T.tolist())
    intensity=rec['intensity']
    if typ=='SUN':light.energy=intensity*float(os.environ.get('CYCLES_SUN_GAIN','.28'));light.angle=.0093
    elif typ=='AREA':light.shape='RECTANGLE';light.size=rec.get('width',1);light.size_y=rec.get('height',1);light.energy=intensity*light.size*light.size_y*math.pi
    else:light.energy=intensity*4*math.pi;light.shadow_soft_size=.05
    if typ=='SPOT':light.spot_size=2*(rec.get('angle') or .8);light.spot_blend=rec.get('penumbra') or .2
    if typ in ['SUN','SPOT'] and rec.get('target'):
        direction=Vector(rec['target'])-obj.location;obj.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
    if MODE=='upper-window' and rec['name']=='production-left-window-bounce':
        obj.location=(-6.4,10.7,-6);obj.rotation_euler=(Vector((-1.54,8.4,-9.7))-obj.location).to_track_quat('-Z','Y').to_euler();light.size=2.2;light.size_y=3.5;light.energy=460
    if MODE=='upper-window' and rec['name']=='production-front-room-bounce':light.energy*=.3

cam_data=bpy.data.cameras.new('source-reference6-camera');camera=bpy.data.objects.new('source-reference6-camera',cam_data);scene.collection.objects.link(camera);camera.matrix_world=Matrix(np.array(scene_data['cameraMatrix']).reshape(4,4).T.tolist());cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=24;cam_data.lens=12/math.tan(math.radians(scene_data['view']['fov'])/2);cam_data.clip_start=.1;cam_data.clip_end=200;scene.camera=camera
# Light Euler targets must reach matrix_world before the rigid conversion reads it.
bpy.context.view_layer.update()
if MODE=='outdoor-day':
    # Rigidly convert the entire recovered world, including every light and
    # the camera, into Blender's ordinary Z-up frame. Distances, silhouette
    # and relative camera pose are preserved by this single shared rotation.
    conversion=Matrix.Rotation(math.pi/2,4,'X')
    for obj in list(scene.objects):obj.matrix_world=conversion@obj.matrix_world
    bpy.context.view_layer.update()
    report['worldCoordinateConversion']='All source meshes, lights and camera jointly rotated +90 degrees about X: Y-up to Z-up, no deformation.'
world=bpy.data.worlds.new('Procedural exterior fill for path-traced review');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.45,.55,.7,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=float(os.environ.get('CYCLES_WORLD_GAIN','.3'))
if MODE=='outdoor-day':
    nodes=world.node_tree.nodes;links=world.node_tree.links
    direct=next((r for r in scene_data['lights'] if r['type']=='DirectionalLight' and r['intensity']>1),None)
    direction=Vector((-.5,.72,.48))
    if direct and direct.get('target'):
        transform=Matrix(np.array(direct['matrix']).reshape(4,4).T.tolist());direction=(transform.translation-Vector(direct['target'])).normalized()
    hdri=Path(__file__).resolve().parents[1]/'assets/polyhaven/kloppenheim-06-puresky/sky-2k.exr'
    if canonical_reference==3 and os.environ.get('CYCLES_USE_HDRI','0')=='1' and hdri.exists():
        environment=nodes.new('ShaderNodeTexEnvironment');environment.projection='EQUIRECTANGULAR';environment.interpolation='Linear';environment.image=bpy.data.images.load(str(hdri),check_existing=True)
        coordinate=nodes.new('ShaderNodeTexCoord');mapping=nodes.new('ShaderNodeMapping');mapping.inputs['Rotation'].default_value[2]=math.radians(float(os.environ.get('CYCLES_HDRI_ROTATION','0')));links.new(coordinate.outputs['Normal'],mapping.inputs['Vector']);links.new(mapping.outputs['Vector'],environment.inputs['Vector']);links.new(environment.outputs['Color'],nodes['Background'].inputs['Color'])
        report['outdoorSky']={'type':'HDRI','file':'assets/polyhaven/kloppenheim-06-puresky/sky-2k.exr','provider':'Poly Haven CC0-1.0','source':'Measured outdoor radiance for camera, diffuse transport and reflections; no temple or reference geometry','rotationDegrees':float(os.environ.get('CYCLES_HDRI_ROTATION','0')),'worldUp':'Whole scene converted to Z-up','sourceDirectionYUp':list(direction)}
    else:
        sky=nodes.new('ShaderNodeTexSky');sky.sky_type='MULTIPLE_SCATTERING' if bpy.app.version>=(5,0,0) else 'NISHITA';sky.sun_disc=False
        sky.sun_elevation=math.asin(max(-1,min(1,direction.y)));sky.sun_rotation=math.atan2(-direction.z,direction.x)
        sky.altitude=150;sky.air_density=1;sky.ozone_density=1.0
        if hasattr(sky,'dust_density'):sky.dust_density=.75
        # A procedural 3D cloud field keeps the no-bitmap fallback useful.
        coordinate=nodes.new('ShaderNodeTexCoord');cloud_noise=nodes.new('ShaderNodeTexNoise');cloud_noise.inputs['Scale'].default_value=4.2;cloud_noise.inputs['Detail'].default_value=4.0;cloud_noise.inputs['Roughness'].default_value=.67
        links.new(coordinate.outputs['Normal'],cloud_noise.inputs['Vector'])
        density=nodes.new('ShaderNodeValToRGB');density.color_ramp.elements[0].position=.45;density.color_ramp.elements[0].color=(0,0,0,1);density.color_ramp.elements[1].position=.64;density.color_ramp.elements[1].color=(1,1,1,1);mid=density.color_ramp.elements.new(.55);mid.color=(.48,.48,.48,1);links.new(cloud_noise.outputs['Fac'],density.inputs['Fac'])
        separate=nodes.new('ShaderNodeSeparateXYZ');links.new(coordinate.outputs['Normal'],separate.inputs['Vector']);horizon=nodes.new('ShaderNodeValToRGB');horizon.color_ramp.elements[0].position=-.04;horizon.color_ramp.elements[0].color=(0,0,0,1);horizon.color_ramp.elements[1].position=.20;horizon.color_ramp.elements[1].color=(1,1,1,1);links.new(separate.outputs['Z'],horizon.inputs['Fac'])
        cloud_factor=nodes.new('ShaderNodeMath');cloud_factor.operation='MULTIPLY';links.new(density.outputs['Color'],cloud_factor.inputs[0]);links.new(horizon.outputs['Color'],cloud_factor.inputs[1])
        cloud_color=nodes.new('ShaderNodeMixRGB');cloud_color.blend_type='MIX';cloud_color.inputs[2].default_value=(.93,.91,.85,1);links.new(cloud_factor.outputs[0],cloud_color.inputs[0]);links.new(sky.outputs['Color'],cloud_color.inputs[1]);links.new(cloud_color.outputs['Color'],nodes['Background'].inputs['Color'])
        report['outdoorSky']={'type':sky.sky_type,'source':'Blender atmospheric scattering with a code-generated directional 3D noise cloud field; no bitmap background','cloudNoiseScale':4.2,'cloudFactorRamp':[.45,.55,.64],'cloudAltitudeGateZ':[-.04,.20],'sunDisc':False,'worldUp':'Whole scene converted to Z-up','sourceDirectionYUp':list(direction)}
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
scene.cycles.max_bounces=8;scene.cycles.diffuse_bounces=4;scene.cycles.glossy_bounces=4;scene.cycles.transmission_bounces=6;scene.cycles.volume_bounces=1;scene.cycles.sample_clamp_indirect=8
scene.render.resolution_x=int(os.environ.get('CYCLES_SIZE','640'));scene.render.resolution_y=scene.render.resolution_x;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.threads_mode='FIXED';scene.render.threads=int(os.environ.get('CYCLES_THREADS','4'))
try:scene.view_settings.view_transform='AgX'
except:scene.view_settings.view_transform='Filmic'
scene.view_settings.exposure=float(os.environ.get('CYCLES_EXPOSURE','.5'));scene.view_settings.gamma=1
render_name=os.environ.get('CYCLES_RENDER_NAME','sanctuary-cycles.png')
if Path(render_name).name!=render_name:raise ValueError('CYCLES_RENDER_NAME must be a filename')
scene.render.filepath=str(OUT/render_name);scene.render.film_transparent=False
report['importedTriangles']=imported_triangles;report['geometryTriangleCountPreserved']=imported_triangles==scene_data['statistics']['triangles'];report['status']='rendering';report['materialTransfer']='Original portable PBR parameters and source procedural textures; custom GLSL not portable. Planar approximations replaced by physical reflection.';report['lightCalibration']={'transfer':'Source positions/colors; area*pi and point*4pi power conversion','sunGain':float(os.environ.get('CYCLES_SUN_GAIN','.28')),'worldGain':float(os.environ.get('CYCLES_WORLD_GAIN','.3')),'exposure':scene.view_settings.exposure,'nativeWebglPixelEquivalence':False}
(OUT/'report.json').write_text(json.dumps(report,indent=2));
if os.environ.get('CYCLES_SAVE_BLEND','1')=='1':
    blend_name=os.environ.get('CYCLES_BLEND_NAME','existing-sanctuary-cycles.blend')
    if Path(blend_name).name!=blend_name:raise ValueError('CYCLES_BLEND_NAME must be a filename')
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/blend_name),compress=True)
bpy.ops.render.render(write_still=True)
report['status']='path-traced-review';report['finished']=time.time();report['resolution']=[scene.render.resolution_x,scene.render.resolution_y];report['samples']=scene.cycles.samples;report['photographicAcceptance']=False;(OUT/'report.json').write_text(json.dumps(report,indent=2));print('CYCLES_REVIEW_COMPLETE',json.dumps(report),flush=True)
