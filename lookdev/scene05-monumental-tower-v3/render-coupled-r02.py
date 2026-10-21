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
MODE=os.environ.get('LIGHTING_MODE','outdoor-day')
SUN_ELEVATION=math.radians(float(os.environ.get('PHYSICAL_SUN_ELEVATION','25')))
SUN_ENERGY=float(os.environ.get('PHYSICAL_SUN_ENERGY','3.0'))
SUN_RGB=(1.0,.84,.65)
VERMILION_TINT=tuple(float(x) for x in os.environ.get('PHYSICAL_VERMILION_TINT','1,1,1').split(','))
GROUND_RADIANCE=tuple(float(x) for x in os.environ.get('PHYSICAL_GROUND_RADIANCE','0,0,0').split(','))
COURTYARD=os.environ.get('PHYSICAL_COURTYARD','0')=='1'
COURTYARD_ALBEDO=tuple(float(x) for x in os.environ.get('PHYSICAL_COURTYARD_ALBEDO','.38,.34,.28').split(','))
HDRI_PATH=os.environ.get('TEMPLE_SKY_EXR')
BOUNCE_POWER=float(os.environ.get('PHYSICAL_BOUNCE_POWER','0'))
SUN_DIRECTION=Vector((-18,0,23)).normalized()*math.cos(SUN_ELEVATION)+Vector((0,math.sin(SUN_ELEVATION),0))
scene_data=json.loads((ROOT/'scene.json').read_text())
report={'sourceStatistics':scene_data['statistics'],'lightingMode':MODE,'blender':bpy.app.version_string,'scope':scene_data.get('renderingScope'),'geometryRebuilt':False,'excluded':scene_data['excluded'],'warnings':[],'status':'importing','started':time.time()}
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
for rec in scene_data['materials']:
    mat=bpy.data.materials.new(rec['name'] or rec['id']);mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();links=mat.node_tree.links
    bs=n.new('ShaderNodeBsdfPrincipled');out=n.new('ShaderNodeOutputMaterial');links.new(bs.outputs['BSDF'],out.inputs['Surface'])
    color=tuple(rec.get('color') or [.5,.5,.5])+ (1,)
    if rec['name'].lower().endswith('_red') or rec['name'].lower()=='kit_cedar':color=tuple(color[i]*VERMILION_TINT[i] for i in range(3))+(1,)
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
        emissive_product=n.new('ShaderNodeMixRGB');emissive_product.blend_type='MULTIPLY';emissive_product.inputs[0].default_value=1;emissive_product.inputs[2].default_value=emission;links.new(tex_nodes['emissiveMap'].outputs['Color'],emissive_product.inputs[1])
        for name in ['Emission Color','Emission']:
            if name in bs.inputs:links.new(emissive_product.outputs[0],bs.inputs[name]);break
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

if COURTYARD:
    # The original close-up omits local ground entirely. Add documented real
    # courtyard context BELOW the unchanged, upward-looking source camera.
    # It reflects the physical sun and sky, receives the tower's shadows, and
    # participates in occluded diffuse GI. It is not a camera/background plate.
    y=-.12;extent=40.0
    mesh=bpy.data.meshes.new('scene05-context-stone-courtyard')
    mesh.from_pydata([(-extent,y,-extent),(extent,y,-extent),(extent,y,extent),(-extent,y,extent)],[],[(0,3,2),(0,2,1)]);mesh.update()
    obj=bpy.data.objects.new('scene05-context-stone-courtyard',mesh);scene.collection.objects.link(obj)
    mat=bpy.data.materials.new('scene05-context-warm-gray-courtyard-stone');mat.use_nodes=True
    nodes=mat.node_tree.nodes;links=mat.node_tree.links;bs=nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=COURTYARD_ALBEDO+(1,);bs.inputs['Roughness'].default_value=.94
    value(bs,['Specular IOR Level'],.18)
    texture=nodes.new('ShaderNodeTexNoise');texture.inputs['Scale'].default_value=6;texture.inputs['Detail'].default_value=2
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.25;bump.inputs['Distance'].default_value=.004;links.new(texture.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])
    mesh.materials.append(mat)
    report['addedContext']={'kind':'Actual shadow-receiving stone courtyard mesh','sourceY':y,'sourceBoundsXZ':[-extent,extent,-extent,extent],'linearDiffuseReflectance':list(COURTYARD_ALBEDO),'roughness':.94,'geometry':'4vertices,2triangles; independent ground context, source visible meshes unchanged','assumption':'Unseen courtyard plane inferred below source low camera; not a measured floor from the close-up reference.'}

if BOUNCE_POWER>0:
    # A real sized, shadow-casting photographic source models a production
    # bounce board, rather than lifting shadows in compositing or hiding them.
    light=bpy.data.lights.new('scene05-production-bounce-board','AREA');light.energy=BOUNCE_POWER;light.shape='RECTANGLE';light.size=10;light.size_y=8;light.color=(1,.83,.63)
    obj=bpy.data.objects.new('scene05-production-bounce-board',light);scene.collection.objects.link(obj);obj.location=(7,2.8,13)
    obj.rotation_euler=(Vector((0,12,0))-obj.location).to_track_quat('-Z','Y').to_euler()
    report['photographicBounce']={'kind':'Actual shadow-casting rectangular AREA light','sourcePositionYUp':[7,2.8,13],'targetYUp':[0,12,0],'sizeMetres':[10,8],'powerWatts':BOUNCE_POWER,'linearRGB':[1,.83,.63],'purpose':'Inferred photographic bounce-board source, explicitly not claimed as recovered natural illumination.'}

for rec in scene_data['lights']:
    if rec['intensity']<=0 or rec['type']=='HemisphereLight':continue
    # The original WebGL directional bounce helper is replaced by traced GI.
    if MODE=='outdoor-day' and rec['type']=='DirectionalLight' and rec['intensity']<=1:continue
    typ={'DirectionalLight':'SUN','PointLight':'POINT','SpotLight':'SPOT','RectAreaLight':'AREA'}.get(rec['type'])
    if not typ:continue
    light=bpy.data.lights.new(rec['name'] or typ,typ);light.color=rec['color'];obj=bpy.data.objects.new(rec['name'] or typ,light);scene.collection.objects.link(obj);obj.matrix_world=Matrix(np.array(rec['matrix']).reshape(4,4).T.tolist())
    intensity=rec['intensity']
    if typ=='SUN':
        light.energy=SUN_ENERGY if MODE=='outdoor-day' else intensity*float(os.environ.get('CYCLES_SUN_GAIN','.28'));light.angle=math.radians(.53)
        if MODE=='outdoor-day':light.color=SUN_RGB
    elif typ=='AREA':light.shape='RECTANGLE';light.size=rec.get('width',1);light.size_y=rec.get('height',1);light.energy=intensity*light.size*light.size_y*math.pi
    else:light.energy=intensity*4*math.pi;light.shadow_soft_size=.05
    if typ=='SPOT':light.spot_size=2*(rec.get('angle') or .8);light.spot_blend=rec.get('penumbra') or .2
    if typ in ['SUN','SPOT'] and rec.get('target'):
        direction=-SUN_DIRECTION if MODE=='outdoor-day' and typ=='SUN' else Vector(rec['target'])-obj.location;obj.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
    if MODE=='upper-window' and rec['name']=='production-left-window-bounce':
        obj.location=(-6.4,10.7,-6);obj.rotation_euler=(Vector((-1.54,8.4,-9.7))-obj.location).to_track_quat('-Z','Y').to_euler();light.size=2.2;light.size_y=3.5;light.energy=460
    if MODE=='upper-window' and rec['name']=='production-front-room-bounce':light.energy*=.3

cam_data=bpy.data.cameras.new('source-reference05-camera');camera=bpy.data.objects.new('source-reference05-camera',cam_data);scene.collection.objects.link(camera);camera.matrix_world=Matrix(np.array(scene_data['cameraMatrix']).reshape(4,4).T.tolist());cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=24;cam_data.lens=12/math.tan(math.radians(scene_data['view']['fov'])/2);cam_data.clip_start=.1;cam_data.clip_end=200;scene.camera=camera
# Explicit source sensor-crop intrinsics, omitted by the generic exporter.
# Same source optical pose and square raster; this is a physically shifted
# perspective frustum, not a geometry warp or a composited photograph.
principal=(.30303030,.77495212)
cam_data.shift_x=.5-principal[0];cam_data.shift_y=principal[1]-.5
report['sourceCameraIntrinsics']={'verticalFov':scene_data['view']['fov'],'principalNormalized':list(principal),'blenderShift':[cam_data.shift_x,cam_data.shift_y],'referenceRaster':[1254,1254],'source':'reconstructions/scene-05/src/tier-layout.js and main.js','scope':'Common shifted perspective sensor, same for complete scene and every object; photographic crop remains a reconstruction hypothesis.'}
if MODE=='outdoor-day':
    # Rigidly convert the entire recovered world, including every light and
    # the camera, into Blender's ordinary Z-up frame. Distances, silhouette
    # and relative camera pose are preserved by this single shared rotation.
    conversion=Matrix.Rotation(math.pi/2,4,'X')
    for obj in list(scene.objects):obj.matrix_world=conversion@obj.matrix_world
    report['worldCoordinateConversion']='All source meshes, lights and camera jointly rotated +90 degrees about X: Y-up to Z-up, no deformation.'
world=bpy.data.worlds.new('Procedural exterior fill for path-traced review');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.45,.55,.7,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=float(os.environ.get('CYCLES_WORLD_GAIN','.3'))
if MODE=='outdoor-day':
    nodes=world.node_tree.nodes;links=world.node_tree.links
    sky=nodes.new('ShaderNodeTexSky');sky.sky_type='MULTIPLE_SCATTERING' if bpy.app.version>=(5,0,0) else 'NISHITA';sky.sun_disc=False
    direct=next((r for r in scene_data['lights'] if r['type']=='DirectionalLight' and r['intensity']>1),None)
    direction=SUN_DIRECTION.copy()
    if MODE!='outdoor-day' and direct and direct.get('target'):
        transform=Matrix(np.array(direct['matrix']).reshape(4,4).T.tolist());direction=(transform.translation-Vector(direct['target'])).normalized()
    sky.sun_elevation=math.asin(max(-1,min(1,direction.y)));sky.sun_rotation=math.atan2(-direction.z,direction.x)
    sky.altitude=150;sky.air_density=.8;sky.ozone_density=1.3
    if hasattr(sky,'dust_density'):sky.dust_density=.12
    links.new(sky.outputs['Color'],nodes['Background'].inputs['Color'])
    if any(GROUND_RADIANCE):
        # Analytic radiance of unseen sunlit courtyard stone. This is an
        # environment-light approximation, not a new floor or image plate.
        ground=nodes.new('ShaderNodeBackground');ground.inputs['Color'].default_value=GROUND_RADIANCE+(1,);ground.inputs['Strength'].default_value=1
        coords=nodes.new('ShaderNodeTexCoord');separate=nodes.new('ShaderNodeSeparateXYZ');links.new(coords.outputs['Generated'],separate.inputs[0])
        mask=nodes.new('ShaderNodeMath');mask.operation='LESS_THAN';mask.inputs[1].default_value=0;links.new(separate.outputs['Z'],mask.inputs[0])
        mix=nodes.new('ShaderNodeMixShader');links.new(mask.outputs[0],mix.inputs[0]);links.new(nodes['Background'].outputs[0],mix.inputs[1]);links.new(ground.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],nodes['World Output'].inputs['Surface'])
        report['lowerHemisphere']={'linearRadiance':list(GROUND_RADIANCE),'scope':'Analytic unseen courtyard-stone radiance; source scene contains no ground mesh. No visible mesh added.'}
    report['outdoorSky']={'airDensity':sky.air_density,'ozoneDensity':sky.ozone_density,'type':sky.sky_type,'source':'Blender atmospheric scattering, no bitmap background','sunDisc':False,'worldUp':'Whole scene converted to Z-up','sourceDirectionYUp':list(direction)}
if HDRI_PATH:
    nodes=world.node_tree.nodes;links=world.node_tree.links
    env=nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(Path(HDRI_PATH).resolve()));env.image.colorspace_settings.name='Linear Rec.709'
    coordinates=nodes.new('ShaderNodeTexCoord');mapping=nodes.new('ShaderNodeMapping')
    pixels=np.empty(env.image.size[0]*env.image.size[1]*4,dtype=np.float32);env.image.pixels.foreach_get(pixels)
    rgb=pixels.reshape(env.image.size[1],env.image.size[0],4)[:,:,:3];luminance=rgb@np.asarray([.2126,.7152,.0722],dtype=np.float32)
    sun_y,sun_x=np.unravel_index(np.argmax(luminance),luminance.shape)
    measured_azimuth=math.pi-2*math.pi*((sun_x+.5)/env.image.size[0]);measured_altitude=math.pi*((sun_y+.5)/env.image.size[1]-.5)
    source_sun=max((r for r in scene_data['lights'] if r['type']=='DirectionalLight'),key=lambda r:r['intensity'])
    source_position=Matrix(np.array(source_sun['matrix']).reshape(4,4).T.tolist()).translation
    source_direction=(source_position-Vector(source_sun['target'])).normalized()
    target_azimuth=math.atan2(-source_direction.z,source_direction.x);target_altitude=math.asin(max(-1,min(1,source_direction.y)))
    tilt_axis=Vector((math.sin(measured_azimuth),-math.cos(measured_azimuth),0))
    yaw=Matrix.Rotation(measured_azimuth-target_azimuth,4,'Z');tilt=Matrix.Rotation(measured_altitude-target_altitude,4,tilt_axis);rotation=tilt@yaw
    mapping.inputs['Rotation'].default_value=rotation.to_euler('XYZ')
    measured_direction=Vector((math.cos(measured_altitude)*math.cos(measured_azimuth),math.cos(measured_altitude)*math.sin(measured_azimuth),math.sin(measured_altitude)))
    mapped_sun=rotation.to_3x3().inverted()@measured_direction;target_zup=Vector((source_direction.x,-source_direction.z,source_direction.y))
    report['environmentOrientation']={'longitudeFormula':'phi=pi-2*pi*u','coordinateConvention':'Outward=-TextureCoordinateNormal because background sd.N=-ray_D','sourceSunDirectionYUp':list(source_direction),'targetSunDirectionZUp':list(target_zup),'correctMappedSunVectorZUp':list(mapped_sun),'targetAltitudeDegrees':math.degrees(target_altitude),'eulerXYZ':list(mapping.inputs['Rotation'].default_value),'alignmentDegrees':math.degrees(math.acos(max(-1,min(1,mapped_sun.normalized().dot(target_zup.normalized()))))),'primarySources':['https://github.com/blender/blender/blob/main/intern/cycles/kernel/camera/projection.h','https://github.com/blender/blender/blob/main/intern/cycles/kernel/geom/shader_data.h','https://github.com/blender/blender/blob/main/intern/cycles/kernel/svm/tex_coord.h']}
    outward=nodes.new('ShaderNodeVectorMath');outward.operation='MULTIPLY';outward.inputs[1].default_value=(-1,-1,-1);links.new(coordinates.outputs['Normal'],outward.inputs[0]);links.new(outward.outputs['Vector'],mapping.inputs['Vector']);links.new(mapping.outputs['Vector'],env.inputs['Vector']);links.new(env.outputs['Color'],nodes['Background'].inputs['Color']);links.new(nodes['Background'].outputs[0],nodes['World Output'].inputs['Surface'])
    for obj in list(scene.objects):
        if obj.type=='LIGHT' and obj.data.type=='SUN':bpy.data.objects.remove(obj,do_unlink=True)
    report['environmentRadiance']={'maximum':float(np.max(luminance)),'mean':float(np.mean(luminance)),'sunPixel':[int(sun_x),int(sun_y)],'sunAltitudeDegrees':math.degrees(measured_altitude)}
    provenance=json.loads((Path(HDRI_PATH).resolve().parent/'provenance.json').read_text())
    report['measuredSky']={'file':str(Path(HDRI_PATH).resolve()),'rotationRadians':mapping.inputs['Rotation'].default_value[2],'license':provenance['license'],'provider':'Poly Haven','asset':provenance['asset'],'authors':['Greg Zaal','Jarod Guest'],'sunLightsRemoved':True,'environmentRole':'Actual full-radiance3D illumination/reflection; not a reference photograph or camera plate.','provenance':provenance}
    scene.cycles.seed=505204;scene.cycles.use_animated_seed=False

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
scene.cycles.max_bounces=12;scene.cycles.diffuse_bounces=6;scene.cycles.glossy_bounces=4;scene.cycles.transmission_bounces=6;scene.cycles.volume_bounces=1;scene.cycles.sample_clamp_indirect=8
scene.render.resolution_x=int(os.environ.get('CYCLES_SIZE','640'));scene.render.resolution_y=scene.render.resolution_x;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.threads_mode='FIXED';scene.render.threads=int(os.environ.get('CYCLES_THREADS','4'))
try:scene.view_settings.view_transform='AgX'
except:scene.view_settings.view_transform='Filmic'
try:scene.view_settings.look='AgX - Medium High Contrast'
except:pass
scene.view_settings.exposure=float(os.environ.get('CYCLES_EXPOSURE','.35'));scene.view_settings.gamma=1
render_name=os.environ.get('CYCLES_RENDER_NAME','sanctuary-cycles.png')
if Path(render_name).name!=render_name:raise ValueError('CYCLES_RENDER_NAME must be a filename')
scene.render.filepath=str(OUT/render_name);scene.render.film_transparent=False
report['importedTriangles']=imported_triangles;report['geometryTriangleCountPreserved']=imported_triangles==scene_data['statistics']['triangles'];report['status']='rendering';report['materialTransfer']='Original portable PBR parameters and source procedural textures; custom GLSL not portable. Planar approximations replaced by physical reflection.';report['vermilionAlbedoCalibration']={'linearMultiplier':list(VERMILION_TINT),'materialScope':'Original red lacquer / kit cedar only; source UVs and scanned albedo, normal and roughness maps retained'};report['physicalSun']={'elevationDegrees':math.degrees(SUN_ELEVATION),'directionYUp':list(SUN_DIRECTION),'energy':SUN_ENERGY,'linearRGB':list(SUN_RGB),'angularDiameterDegrees':.53,'indirectLight':'Cycles diffuse GI; WebGL directional bounce helpers omitted'};report['lightCalibration']={'transfer':'One source sun azimuth with calibrated elevation/energy; atmospheric sky and traced GI. Original portable PBR maps/UV preserved.','sunGain':float(os.environ.get('CYCLES_SUN_GAIN','.28')),'worldGain':float(os.environ.get('CYCLES_WORLD_GAIN','.3')),'exposure':scene.view_settings.exposure,'nativeWebglPixelEquivalence':False}
if HDRI_PATH:report['physicalSun']={'mode':'Measured HDRI sole sun','measuredAssetSunAltitudeDegrees':report['environmentRadiance']['sunAltitudeDegrees'],'correctMappedSunVectorZUp':report['environmentOrientation']['correctMappedSunVectorZUp'],'targetAltitudeDegrees':report['environmentOrientation']['targetAltitudeDegrees'],'sunLightObjects':0,'powerFromMeasuredRadiance':True};report['lightCalibration']['transfer']='Measured CC0 HDRI radiance, actual stone-courtyard diffuse GI; source WebGL sun and ground-bounce helper lamps are omitted; no added production bounce board.'
(OUT/'report.json').write_text(json.dumps(report,indent=2));
if os.environ.get('CYCLES_SAVE_BLEND','1')=='1':
    blend_name=os.environ.get('CYCLES_BLEND_NAME','existing-sanctuary-cycles.blend')
    if Path(blend_name).name!=blend_name:raise ValueError('CYCLES_BLEND_NAME must be a filename')
    if os.environ.get('CYCLES_PACK_TEXTURES','1')=='1':bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/blend_name),compress=True)
bpy.ops.render.render(write_still=True)
report['status']='path-traced-review';report['finished']=time.time();report['resolution']=[scene.render.resolution_x,scene.render.resolution_y];report['samples']=scene.cycles.samples;report['photographicAcceptance']=False;(OUT/'report.json').write_text(json.dumps(report,indent=2));print('CYCLES_REVIEW_COMPLETE',json.dumps(report),flush=True)
