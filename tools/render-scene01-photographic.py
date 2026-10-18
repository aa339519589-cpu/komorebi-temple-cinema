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
        em=n.new('ShaderNodeMixRGB');em.blend_type='MULTIPLY';em.inputs[0].default_value=1;em.inputs[2].default_value=emission
        links.new(tex_nodes['emissiveMap'].outputs['Color'],em.inputs[1])
        for name in ['Emission Color','Emission']:
            if name in bs.inputs:links.new(em.outputs[0],bs.inputs[name]);break
    # Real thin-leaf/paper transmission, using the same source colour/map.
    thin_foliage=rec['name'].lower().startswith(('leaf','maple','lotusleaf','pineleaf')) or rec['name'] in ['lotus','lotusInside','pink','pinkLight']
    thin_paper=('paper' in rec['name'].lower() and max(emission[:3])>0)
    if thin_foliage or thin_paper:
        translucent=n.new('ShaderNodeBsdfTranslucent')
        if base_socket:links.new(base_socket,translucent.inputs['Color'])
        else:translucent.inputs['Color'].default_value=color
        mix=n.new('ShaderNodeMixShader');mix.inputs[0].default_value=.42
        links.new(bs.outputs['BSDF'],mix.inputs[1]);links.new(translucent.outputs['BSDF'],mix.inputs[2]);links.new(mix.outputs[0],out.inputs['Surface'])
    if rec['name'].lower() in ['wood','red','redlight','darkwood','endwood']:
        bevel=n.new('ShaderNodeBevel');bevel.inputs['Radius'].default_value=.002;bevel.samples=4
        previous=bs.inputs['Normal'].links[0].from_socket if bs.inputs['Normal'].is_linked else None
        if previous:links.new(previous,bevel.inputs['Normal'])
        links.new(bevel.outputs['Normal'],bs.inputs['Normal'])
    if rec['name'] in ['stone','stoneLight']:
        # The native granite's world-space GLSL is rebuilt as actual Cycles
        # surface nodes rather than silently losing its mineral structure.
        position=n.new('ShaderNodeNewGeometry');grain=n.new('ShaderNodeTexNoise');grain.inputs['Scale'].default_value=210;grain.inputs['Detail'].default_value=2.5
        links.new(position.outputs['Position'],grain.inputs['Vector'])
        ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.28;ramp.color_ramp.elements[0].color=(.35,.37,.35,1);ramp.color_ramp.elements[1].position=.72;ramp.color_ramp.elements[1].color=(1.45,1.43,1.32,1)
        links.new(grain.outputs['Fac'],ramp.inputs['Fac']);mul=n.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1
        current=bs.inputs['Base Color'].links[0].from_socket if bs.inputs['Base Color'].is_linked else None
        if current:links.new(current,mul.inputs[1])
        else:mul.inputs[1].default_value=color
        links.new(ramp.outputs['Color'],mul.inputs[2]);links.new(mul.outputs['Color'],bs.inputs['Base Color'])
        fine=n.new('ShaderNodeBump');fine.inputs['Distance'].default_value=.0024;fine.inputs['Strength'].default_value=.24;links.new(grain.outputs['Fac'],fine.inputs['Height'])
        previous=bs.inputs['Normal'].links[0].from_socket if bs.inputs['Normal'].is_linked else None
        if previous:links.new(previous,fine.inputs['Normal'])
        links.new(fine.outputs['Normal'],bs.inputs['Normal'])
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

for rec in scene_data['lights']:
    if rec['intensity']<=0 or rec['type']=='HemisphereLight' or (rec['type']=='DirectionalLight' and rec['intensity']<3):continue
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

cam_data=bpy.data.cameras.new('source-reference6-camera');camera=bpy.data.objects.new('source-reference6-camera',cam_data);scene.collection.objects.link(camera);camera.matrix_world=Matrix(np.array(scene_data['cameraMatrix']).reshape(4,4).T.tolist());cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=24;cam_data.lens=12/math.tan(math.radians(scene_data['view']['fov'])/2);cam_data.clip_start=.1;cam_data.clip_end=800;scene.camera=camera
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
    sky=nodes.new('ShaderNodeTexSky');sky.sky_type='MULTIPLE_SCATTERING' if bpy.app.version>=(5,0,0) else 'NISHITA';sky.sun_disc=False
    direct=next((r for r in scene_data['lights'] if r['type']=='DirectionalLight' and r['intensity']>1),None)
    direction=Vector((-.5,.72,.48))
    if direct and direct.get('target'):
        transform=Matrix(np.array(direct['matrix']).reshape(4,4).T.tolist());direction=(transform.translation-Vector(direct['target'])).normalized()
    sky.sun_elevation=math.asin(max(-1,min(1,direction.y)));sky.sun_rotation=math.atan2(-direction.z,direction.x)
    sky.altitude=150;sky.air_density=1;sky.ozone_density=1.0
    if hasattr(sky,'dust_density'):sky.dust_density=.75
    links.new(sky.outputs['Color'],nodes['Background'].inputs['Color'])
    report['outdoorSky']={'type':sky.sky_type,'source':'Blender atmospheric scattering, no bitmap background','sunDisc':False,'worldUp':'Whole scene converted to Z-up','sourceDirectionYUp':list(direction)}

# Source pond footprint, now a closed dielectric volume for physical reflection.
water=bpy.data.materials.new('source01 physical pond water');water.use_nodes=True
nodes=water.node_tree.nodes;links=water.node_tree.links;bs=nodes.get('Principled BSDF')
bs.inputs['Base Color'].default_value=(.88,.94,.92,1);bs.inputs['Roughness'].default_value=.055;bs.inputs['Metallic'].default_value=0
bs.inputs['IOR'].default_value=1.333;bs.inputs['Transmission Weight'].default_value=1
coord=nodes.new('ShaderNodeTexCoord');noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=26;noise.inputs['Detail'].default_value=2.5
links.new(coord.outputs['Generated'],noise.inputs['Vector']);bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.008
links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])
absorb=nodes.new('ShaderNodeVolumeAbsorption');absorb.inputs['Color'].default_value=(.28,.42,.34,1);absorb.inputs['Density'].default_value=.12
links.new(absorb.outputs['Volume'],nodes.get('Material Output').inputs['Volume'])
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-5.2,-.87));pond=bpy.context.object;pond.name='source01 pond 34x31m with top at sourceY0.13';pond.dimensions=(34,31,2);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);pond.data.materials.append(water)
for obj in scene.objects:
    if 'individual-falling-water-ribbons' in obj.name:
        obj.data.materials.clear();obj.data.materials.append(water)
        skin=obj.modifiers.new('actual thin water film','SOLIDIFY');skin.thickness=.006
# Small atmospheric transport volume gives depth/raking sunlight rather than
# a colour filter. Density is explicitly inferred, not recovered from photo.
haze=bpy.data.materials.new('single scattering atmospheric depth');haze.use_nodes=True;hn=haze.node_tree.nodes;hl=haze.node_tree.links;hn.clear()
scatter=hn.new('ShaderNodeVolumeScatter');scatter.inputs['Density'].default_value=.0008;scatter.inputs['Anisotropy'].default_value=.35
output=hn.new('ShaderNodeOutputMaterial');hl.new(scatter.outputs['Volume'],output.inputs['Volume'])
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,45));volume=bpy.context.object;volume.name='inferred low atmospheric scattering';volume.dimensions=(600,600,110);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);volume.data.materials.append(haze)
mud=bpy.data.materials.new('actual soil pond bottom');mud.use_nodes=True
mud.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.035,.047,.023,1)
mud.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.94
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-5.2,-2.02));bed=bpy.context.object;bed.name='closed source-footprint pond bed';bed.dimensions=(34,31,.3);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);bed.data.materials.append(mud)
report['addedPhysicalContext']=['Closed source-footprint pond and thin waterfall films','Actual soil bed prevents sky transmission through missing bottom.','Thin atmospheric transport volume with inferred density.']
# Optional measured high dynamic range sky. Its radiance is used by actual
# world transport; it is not a projected reference photograph.
hdri_path=os.environ.get('TEMPLE_SKY_EXR')
if hdri_path:
    wn=world.node_tree.nodes;wl=world.node_tree.links
    env=wn.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(Path(hdri_path).resolve()));env.image.colorspace_settings.name='Linear Rec.709'
    uv=wn.new('ShaderNodeTexCoord');mapping=wn.new('ShaderNodeMapping');pixels=np.empty(env.image.size[0]*env.image.size[1]*4,dtype=np.float32);env.image.pixels.foreach_get(pixels)
    light_pixels=pixels.reshape(env.image.size[1],env.image.size[0],4)[:,:,:3];luminance=light_pixels@np.asarray([.2126,.7152,.0722],dtype=np.float32)
    sun_y,sun_x=np.unravel_index(np.argmax(luminance),luminance.shape)
    measured_azimuth=-2*math.pi*((sun_x+.5)/env.image.size[0]-.5)
    measured_altitude=math.pi*((sun_y+.5)/env.image.size[1]-.5)
    target_azimuth=math.atan2(-direction.z,direction.x)
    target_altitude=math.asin(max(-1,min(1,direction.y)))
    tilt_axis=Vector((math.sin(measured_azimuth),-math.cos(measured_azimuth),0))
    yaw=Matrix.Rotation(measured_azimuth-target_azimuth,4,'Z')
    tilt=Matrix.Rotation(measured_altitude-target_altitude,4,tilt_axis)
    mapping.inputs['Rotation'].default_value=(tilt@yaw).to_euler('XYZ')
    report['environmentOrientation']={'formula':'Blender Cycles sphere_to_equirectangular longitude=pi-2*pi*u','source':'https://github.com/blender/blender/blob/main/intern/cycles/kernel/camera/projection.h','worldDirection':'TextureCoordinate Normal inverted because background sd.N=-ray_D','targetSunAltitude':math.degrees(target_altitude),'euler':list(mapping.inputs['Rotation'].default_value)}
    report['environmentRadiance']={'maximum':float(np.max(luminance)),'mean':float(np.mean(luminance)),'sunPixel':[int(sun_x),int(sun_y)],'sunAltitudeDegrees':math.degrees(measured_altitude)}
    outward=wn.new('ShaderNodeVectorMath');outward.operation='MULTIPLY';outward.inputs[1].default_value=(-1,-1,-1);wl.new(uv.outputs['Normal'],outward.inputs[0]);wl.new(outward.outputs['Vector'],mapping.inputs['Vector']);wl.new(mapping.outputs['Vector'],env.inputs['Vector']);wl.new(env.outputs['Color'],wn['Background'].inputs['Color'])
    for lamp in list(scene.objects):
        if lamp.type=='LIGHT' and lamp.data.type=='SUN':bpy.data.objects.remove(lamp,do_unlink=True)
    report['measuredSky']={'file':str(Path(hdri_path).resolve()),'rotationRadians':mapping.inputs['Rotation'].default_value[2],'license':'CC0-1.0'}
# A declared off-camera film light opens the deep portico, while retaining
# actual geometric shadows, material response, GI and measured sky transport.
fill_power=float(os.environ.get('CYCLES_FRONT_BOUNCE','0'))
if fill_power>0:
    fill=bpy.data.lights.new('off-camera broad warm production fill','AREA');fill.energy=fill_power;fill.shape='RECTANGLE';fill.size=14;fill.size_y=10;fill.color=(1,.83,.65)
    obj=bpy.data.objects.new(fill.name,fill);scene.collection.objects.link(obj);obj.location=(-9,-10,12)
    obj.rotation_euler=(Vector((1,8,5))-obj.location).to_track_quat('-Z','Y').to_euler()
    report['productionFill']={'powerWatts':fill_power,'sizeMetres':[14,10],'positionZUp':list(obj.location),'targetZUp':[1,8,5],'purpose':'Declared cinematic shadow-side fill; not recovered reference lighting'}
sun_break=float(os.environ.get('CYCLES_SUN_BREAK','0'))
if sun_break>0:
    lamp=bpy.data.lights.new('golden sun breaking through the cloud field','SUN');lamp.energy=sun_break;lamp.angle=.0093;lamp.color=(1,.74,.46)
    obj=bpy.data.objects.new(lamp.name,lamp);scene.collection.objects.link(obj);sun_direction=Vector((direction.x,-direction.z,direction.y));obj.rotation_euler=(-sun_direction).to_track_quat('-Z','Y').to_euler()
    report['authoredSunBreak']={'energy':sun_break,'directionZUp':list(sun_direction),'colorLinear':[1,.74,.46],'purpose':'Authored direct golden sunlight added to the low-contrast cloudy environment; not claimed as unchanged measured lighting'}
scene.cycles.seed=73061;scene.cycles.use_animated_seed=False
fstop=float(os.environ.get('CYCLES_FSTOP','0'))
if fstop>0:
    cam_data.dof.use_dof=True;cam_data.dof.aperture_fstop=fstop;cam_data.dof.focus_distance=28;cam_data.dof.aperture_blades=9
    report['lensOptics']={'focusDistanceMetres':28,'fstop':fstop,'apertureBlades':9,'cameraPosePreserved':True}

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
if os.environ.get('CYCLES_CONTRAST'):
    scene.view_settings.look=os.environ['CYCLES_CONTRAST']
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
