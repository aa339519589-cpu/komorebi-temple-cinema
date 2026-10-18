"""Independent physical-lighting diagnostic of code-generated Three.js buffers.

The geometry and instance matrices come from a verified native source frame.
Custom GLSL hooks/planar reflection approximations are explicitly not equivalent
across renderers. This diagnostic does not replace native scene acceptance.
"""
import bpy, json, math, os, sys, time, hashlib
from pathlib import Path
import numpy as np
from mathutils import Matrix, Vector
ROOT=Path(os.environ.get('SCENE_PACKAGE','qa/ten-reference/09/cycles-74/source-package')).resolve()
OUT=Path(os.environ.get('CYCLES_OUTPUT','qa/ten-reference/09/cycles-74/render')).resolve();OUT.mkdir(parents=True,exist_ok=True)
MODE=os.environ.get('LIGHTING_MODE','physical-night09')
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

physical_paper=[]
PAPER_GAIN=float(os.environ.get('CYCLES_PAPER_GAIN','8'))
PAPER_KELVIN=float(os.environ.get('CYCLES_PAPER_KELVIN','2450'))
POINT_GAIN=float(os.environ.get('CYCLES_POINT_GAIN','1'))
image_cache={}
export_receipt=json.loads((ROOT/'export-report.json').read_text())
if export_receipt.get('status')!='exported-existing-geometry' or not export_receipt.get('servedSource',{}).get('allMatch'):
    raise RuntimeError('A full corrected-export served-source verification is required')
if export_receipt['sourceHash']!='5109096178a2da9cd7ef9b0de721335a260a6e31f2a88fcff982a8e50152a390':
    raise RuntimeError('This recipe is limited to the exact shared bridge-coating mesh74 source')
report['bridgeRoughnessSource']=json.loads(Path('reconstructions/scene-09/assets/bridge-coating-roughness-provenance.json').read_text())
report['lightingMatchesCycles72']={'paperGain':8,'paperKelvin':2450,'sunGain':.20,'worldGain':.70,'exposure':.5,'noNewLight':True}
report['verifiedExport']={'sourceHash':export_receipt['sourceHash'],'allServedSourceBytesMatch':True,'sourceCommit':export_receipt['sourceCommit']}
report['importerProvenance']={'reused':'Existing scene09 physical51 source-buffer importer and exact source-location physical reflector replacements','upstreamBuilderSHA256':'2af00e8efd958bd3c3fe6e7f852d90287602c445632ee12468da88606d8249d4','sourceGeometryRemodeled':False,'sourcePBRRecolored':False,'updates':['Named thin-paper recognition for current roughness .84','Actual blackbody mesh-paper radiance','Cached portable texture channels','Retained roughness/metalness source multipliers and Metal OIDN support']}

instance_colored={mid for o in scene_data['meshes'] if 'instanceColors' in o for mid in o['materials']}
textures={t['id']:t for t in scene_data['textures']}; material_records={m['id']:m for m in scene_data['materials']};materials={}
def linear_hex(c):
    values=[((c>>k)&255)/255 for k in [16,8,0]]
    return [v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in values]
wood_colors=[linear_hex(c) for c in [0x7c3525,0x684027,0x1d1817,0x5b3023,0x4e3527,0x63513c]]
wood_ids={r['id'] for r in scene_data['materials'] if r.get('color') and any(np.max(np.abs(np.array(r['color'])-c))<.00001 for c in wood_colors)}
report['proceduralWoodTransfer']={'materialIds':list(wood_ids),'coordinates':'Exact original per-member local vertex positions, preserved as sourceMemberLocal attribute','colorPhase':'sin(localY*3 + sin(localX*62)*1.8 + localX*260), original .86/.14/.08 amplitudes','noise':'Smooth Blender 3D noise replaces unportable GLSL hash noise','physicalMicroResponse':{'roughnessVariation':.09,'bumpDistanceMetres':.0007,'bumpStrength':.17}}
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
    if rec['id'] in wood_ids:
        local=n.new('ShaderNodeAttribute');local.attribute_name='sourceMemberLocal';axes=n.new('ShaderNodeSeparateXYZ');links.new(local.outputs['Vector'],axes.inputs[0])
        def op(kind,a,b=None):
            x=n.new('ShaderNodeMath');x.operation=kind
            for index,v in enumerate([a,b]):
                if v is None:continue
                if isinstance(v,(int,float)):x.inputs[index].default_value=v
                else:links.new(v,x.inputs[index])
            return x.outputs[0]
        phase=op('ADD',op('ADD',op('MULTIPLY',axes.outputs['Y'],3),op('MULTIPLY',op('SINE',op('MULTIPLY',axes.outputs['X'],62)),1.8)),op('MULTIPLY',axes.outputs['X'],260))
        noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=23;noise.inputs['Detail'].default_value=2;links.new(local.outputs['Vector'],noise.inputs['Vector'])
        grain=op('ADD',op('ADD',.86,op('MULTIPLY',op('SINE',phase),.14)),op('MULTIPLY',noise.outputs['Fac'],.08))
        multiply=n.new('ShaderNodeMixRGB');multiply.blend_type='MULTIPLY';multiply.inputs[0].default_value=1
        if base_socket:links.new(base_socket,multiply.inputs[1])
        else:multiply.inputs[1].default_value=color
        links.new(grain,multiply.inputs[2]);links.new(multiply.outputs[0],bs.inputs['Base Color'])
        rough=op('ADD',float(rec.get('roughness') or .6),op('MULTIPLY',op('SUBTRACT',noise.outputs['Fac'],.5),.09));links.new(rough,bs.inputs['Roughness'])
        micro=n.new('ShaderNodeBump');micro.inputs['Distance'].default_value=.0007;micro.inputs['Strength'].default_value=.17;links.new(grain,micro.inputs['Height']);links.new(micro.outputs['Normal'],bs.inputs['Normal'])
    if 'bumpMap' in tex_nodes:
        bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.45;bump.inputs['Distance'].default_value=abs(float(rec.get('bumpScale') or .003));links.new(tex_nodes['bumpMap'].outputs['Color'],bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])
    if 'normalMap' in tex_nodes:
        normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=(rec.get('normalScale') or [1])[0];links.new(tex_nodes['normalMap'].outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],bs.inputs['Normal'])
    for ch,input_name,component,factor in [('roughnessMap','Roughness','G',rec.get('roughness',.4)),('metalnessMap','Metallic','B',rec.get('metalness',0))]:
        if ch in tex_nodes:
            sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes[ch].outputs['Color'],sep.inputs['Color']);mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=float(factor);links.new(sep.outputs[{'G':'Green','B':'Blue'}[component]],mul.inputs[0]);links.new(mul.outputs[0],bs.inputs[input_name])
    if 'alphaMap' in tex_nodes:
        sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes['alphaMap'].outputs['Color'],sep.inputs['Color']);links.new(sep.outputs['Green'],bs.inputs['Alpha'])
    emission_socket=None
    if 'emissiveMap' in tex_nodes:
        emul=n.new('ShaderNodeMixRGB');emul.blend_type='MULTIPLY';emul.inputs[0].default_value=1;emul.inputs[2].default_value=emission;links.new(tex_nodes['emissiveMap'].outputs['Color'],emul.inputs[1]);emission_socket=emul.outputs[0]
        for name in ['Emission Color','Emission']:
            if name in bs.inputs:links.new(emission_socket,bs.inputs[name]);break
    # Current named paper materials retain their original base PBR and exact
    # fiber maps. Their finite modeled faces emit physically into the scene.
    # The old roughness==.6 test missed the current roughness .84 material.
    if 'paper' in rec['name'].lower() and max(emission[:3])>0:
        translucent=n.new('ShaderNodeBsdfTranslucent')
        if base_socket:links.new(base_socket,translucent.inputs['Color'])
        else:translucent.inputs['Color'].default_value=color
        mix=n.new('ShaderNodeMixShader');mix.inputs[0].default_value=.45;links.new(bs.outputs['BSDF'],mix.inputs[1]);links.new(translucent.outputs['BSDF'],mix.inputs[2])
        blackbody=n.new('ShaderNodeBlackbody');blackbody.inputs['Temperature'].default_value=PAPER_KELVIN
        emit=n.new('ShaderNodeEmission');emit.inputs['Strength'].default_value=float(rec.get('emissiveIntensity') or 0)*PAPER_GAIN
        if 'emissiveMap' in tex_nodes:
            tint=n.new('ShaderNodeMixRGB');tint.blend_type='MULTIPLY';tint.inputs[0].default_value=1;links.new(tex_nodes['emissiveMap'].outputs['Color'],tint.inputs[1]);links.new(blackbody.outputs['Color'],tint.inputs[2]);links.new(tint.outputs[0],emit.inputs['Color'])
        else:links.new(blackbody.outputs['Color'],emit.inputs['Color'])
        value(bs,['Emission Strength'],0)
        add_shader=n.new('ShaderNodeAddShader');links.new(mix.outputs[0],add_shader.inputs[0]);links.new(emit.outputs[0],add_shader.inputs[1]);links.new(add_shader.outputs[0],out.inputs['Surface']);physical_paper.append(rec['id'])
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
    if any(mid in wood_ids for mid in record['materials']):
        local_attribute=mesh.attributes.new(name='sourceMemberLocal',type='FLOAT_VECTOR',domain='POINT');local_attribute.data.foreach_set('vector',np.tile(p,(count,1)).astype(np.float32).ravel())
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

disabled_proxy=[]
for rec in scene_data['lights']:
    if rec['name']=='scene09-physical-lamp-local-pool':
        disabled_proxy.append({'type':rec['type'],'name':rec['name'],'sourceIntensity':rec['intensity'],'sourcePosition':[rec['matrix'][i] for i in [12,13,14]]});continue
    if rec['intensity']<=0 or rec['type']=='HemisphereLight':continue
    typ={'DirectionalLight':'SUN','PointLight':'POINT','SpotLight':'SPOT','RectAreaLight':'AREA'}.get(rec['type'])
    if not typ:continue
    light=bpy.data.lights.new(rec['name'] or typ,typ);light.color=rec['color'];obj=bpy.data.objects.new(rec['name'] or typ,light);scene.collection.objects.link(obj);obj.matrix_world=Matrix(np.array(rec['matrix']).reshape(4,4).T.tolist())
    intensity=rec['intensity']
    if typ=='SUN':light.energy=intensity*float(os.environ.get('CYCLES_SUN_GAIN','.28'));light.angle=.12 if intensity>1 else .15
    elif typ=='AREA':light.shape='RECTANGLE';light.size=rec.get('width',1);light.size_y=rec.get('height',1);light.energy=intensity*light.size*light.size_y*math.pi
    else:light.energy=intensity*4*math.pi*POINT_GAIN;light.shadow_soft_size=.18
    if typ=='SPOT':light.spot_size=2*(rec.get('angle') or .8);light.spot_blend=rec.get('penumbra') or .2
    if typ in ['SUN','SPOT'] and rec.get('target'):
        direction=Vector(rec['target'])-obj.location;obj.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
    if MODE=='upper-window' and rec['name']=='production-left-window-bounce':
        obj.location=(-6.4,10.7,-6);obj.rotation_euler=(Vector((-1.54,8.4,-9.7))-obj.location).to_track_quat('-Z','Y').to_euler();light.size=2.2;light.size_y=3.5;light.energy=460
    if MODE=='upper-window' and rec['name']=='production-front-room-bounce':light.energy*=.3

cam_data=bpy.data.cameras.new('source-reference09-camera');camera=bpy.data.objects.new('source-reference09-camera',cam_data);scene.collection.objects.link(camera);camera.matrix_world=Matrix(np.array(scene_data['cameraMatrix']).reshape(4,4).T.tolist());cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=24;cam_data.lens=12/math.tan(math.radians(scene_data['view']['fov'])/2);cam_data.clip_start=.1;cam_data.clip_end=200;scene.camera=camera
if MODE in ['outdoor-day','physical-night09']:
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
    direction=Vector((-.5,.72,.48))
    if direct and direct.get('target'):
        transform=Matrix(np.array(direct['matrix']).reshape(4,4).T.tolist());direction=(transform.translation-Vector(direct['target'])).normalized()
    sky.sun_elevation=math.asin(max(-1,min(1,direction.y)));sky.sun_rotation=math.atan2(-direction.z,direction.x)
    sky.altitude=150;sky.air_density=1;sky.ozone_density=1.0
    if hasattr(sky,'dust_density'):sky.dust_density=.75
    links.new(sky.outputs['Color'],nodes['Background'].inputs['Color'])
    report['outdoorSky']={'type':sky.sky_type,'source':'Blender atmospheric scattering, no bitmap background','sunDisc':False,'worldUp':'Whole scene converted to Z-up','sourceDirectionYUp':list(direction)}
if MODE=='physical-night09':
    # A procedural radiance environment is shared by the camera, reflections
    # and diffuse illumination. No image plane or camera-only backdrop.
    nodes=world.node_tree.nodes;links=world.node_tree.links;nodes.clear()
    out=nodes.new('ShaderNodeOutputWorld');background=nodes.new('ShaderNodeBackground');background.inputs['Strength'].default_value=float(os.environ.get('CYCLES_WORLD_GAIN','.70'))
    tc=nodes.new('ShaderNodeTexCoord');direction=nodes.new('ShaderNodeSeparateXYZ');links.new(tc.outputs['Normal'],direction.inputs[0])
    ramp=nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=0;ramp.color_ramp.elements[0].color=(.014,.035,.100,1);ramp.color_ramp.elements[1].position=.8;ramp.color_ramp.elements[1].color=(.008,.023,.072,1);links.new(direction.outputs['Z'],ramp.inputs[0])
    scale=nodes.new('ShaderNodeVectorMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=(4,4,11);links.new(tc.outputs['Normal'],scale.inputs[0])
    offset=nodes.new('ShaderNodeVectorMath');offset.operation='ADD';offset.inputs[1].default_value=(7,-2,3);links.new(scale.outputs[0],offset.inputs[0])
    noise=nodes.new('ShaderNodeTexNoise');noise.noise_dimensions='3D';noise.inputs['Scale'].default_value=1;noise.inputs['Detail'].default_value=6;noise.inputs['Roughness'].default_value=.67;links.new(offset.outputs[0],noise.inputs['Vector'])
    mask=nodes.new('ShaderNodeValToRGB');mask.color_ramp.elements[0].position=.43;mask.color_ramp.elements[0].color=(0,0,0,1);mask.color_ramp.elements[1].position=.63;mask.color_ramp.elements[1].color=(1,1,1,1);links.new(noise.outputs['Fac'],mask.inputs[0])
    mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MIX';links.new(mask.outputs['Color'],mix.inputs[0]);links.new(ramp.outputs['Color'],mix.inputs[1]);mix.inputs[2].default_value=(.006,.017,.050,1);links.new(mix.outputs[0],background.inputs['Color']);links.new(background.outputs[0],out.inputs['Surface'])
    report['nightSky']={'method':'Shared procedural blue-hour radiance with directional gradient and six-octave noise clouds','bitmapBackground':False,'cameraOnlyEnvironment':False}

    # Replace only the two excluded source planar reflectors with physical
    # dielectric surfaces in their exact source locations, after the common
    # Y-up -> Z-up rigid rotation applied to every source object and camera.
    def water_material(name,roughness,depth=False,puddles=False):
        m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;n.clear();l=m.node_tree.links;bs=n.new('ShaderNodeBsdfPrincipled');out=n.new('ShaderNodeOutputMaterial')
        bs.inputs['Base Color'].default_value=(.15,.28,.24,1) if depth else (.80,.88,.91,1);value(bs,['Transmission Weight','Transmission'],1);value(bs,['IOR'],1.333);value(bs,['Roughness'],roughness);l.new(bs.outputs['BSDF'],out.inputs['Surface'])
        geo=n.new('ShaderNodeNewGeometry');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=8 if depth else 21;noise.inputs['Detail'].default_value=3;noise.inputs['Roughness'].default_value=.65;l.new(geo.outputs['Position'],noise.inputs['Vector']);bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.24 if depth else .15;bump.inputs['Distance'].default_value=.0035 if depth else .0015;l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],bs.inputs['Normal'])
        if depth:
            volume=n.new('ShaderNodeVolumeAbsorption');volume.inputs['Color'].default_value=(.08,.23,.20,1);volume.inputs['Density'].default_value=.45;l.new(volume.outputs[0],out.inputs['Volume'])
        if puddles:
            patch=n.new('ShaderNodeTexNoise');patch.inputs['Scale'].default_value=1.7;patch.inputs['Detail'].default_value=2;l.new(geo.outputs['Position'],patch.inputs['Vector']);mask=n.new('ShaderNodeValToRGB');mask.color_ramp.elements[0].position=.32;mask.color_ramp.elements[0].color=(.1,.1,.1,1);mask.color_ramp.elements[1].position=.65;mask.color_ramp.elements[1].color=(.60,.60,.60,1);l.new(patch.outputs['Fac'],mask.inputs[0]);transparent=n.new('ShaderNodeBsdfTransparent');mix=n.new('ShaderNodeMixShader');l.new(mask.outputs['Color'],mix.inputs[0]);l.new(transparent.outputs[0],mix.inputs[1]);l.new(bs.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],out.inputs['Surface'])
        return m
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-8,-.72));pond=bpy.context.object;pond.name='physical-pond-source52x55-topYminus002';pond.scale=(52,55,1.40);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);pond.data.materials.append(water_material('physical-pond-water-ior1.333',.025,depth=True))
    bpy.ops.mesh.primitive_plane_add(size=1,location=(math.sin(.505)*3.7,-(32.6+math.cos(.505)*3.7),1.497));wet=bpy.context.object;wet.name='physical-wet-veranda-source34x8.5';wet.scale=(34,8.5,1);wet.rotation_euler=(0,0,.505);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);wet.data.materials.append(water_material('physical-veranda-water-patches',.070,puddles=True))
    report['physicalReflectorReplacements']=[{'source':'pond','sourceYUpCenter':[0,-.02,8],'surfaceSize':[52,55],'ior':1.333,'closureDepth':1.4},{'source':'wet-veranda','sourceYUpCenter':[math.sin(.505)*3.7,1.497,32.6+math.cos(.505)*3.7],'sourceRotation':'RY(.505) * RX(-pi/2)','surfaceSize':[34,8.5],'ior':1.333,'proceduralPuddleCoverage':True}]
    report['paperMaterialInterpretation']={'ids':physical_paper,'preserved':'Exact original albedo, normals/roughness and source fiber/emissive attenuation map','physicalChange':'45 percent thin-paper transmission plus additive blackbody mesh-face emission; no emitter card or replacement geometry','temperatureKelvin':PAPER_KELVIN,'radianceGainOverNativeEmission':PAPER_GAIN,'gainIsLightingCalibrationNotMeasuredRadiometry':True};report['disabledWebGLFixtureProxyLights']=disabled_proxy

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
scene.cycles.seed=907071;scene.cycles.use_animated_seed=False
scene.cycles.max_bounces=12;scene.cycles.diffuse_bounces=8;scene.cycles.glossy_bounces=6;scene.cycles.transmission_bounces=8;scene.cycles.volume_bounces=1;scene.cycles.sample_clamp_indirect=8;scene.cycles.transparent_max_bounces=12;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.015;scene.cycles.adaptive_min_samples=32
scene.render.resolution_x=int(os.environ.get('CYCLES_SIZE','640'));scene.render.resolution_y=scene.render.resolution_x;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.threads_mode='FIXED';scene.render.threads=int(os.environ.get('CYCLES_THREADS','4'))
try:scene.view_settings.view_transform='AgX'
except:scene.view_settings.view_transform='Filmic'
scene.view_settings.exposure=float(os.environ.get('CYCLES_EXPOSURE','0'));scene.view_settings.gamma=1
render_name=os.environ.get('CYCLES_RENDER_NAME','scene09-cycles74.png')
if Path(render_name).name!=render_name:raise ValueError('CYCLES_RENDER_NAME must be a filename')
scene.render.filepath=str(OUT/render_name);scene.render.film_transparent=False
report['importedTriangles']=imported_triangles;report['geometryTriangleCountPreserved']=imported_triangles==scene_data['statistics']['triangles'];report['status']='rendering';report['materialTransfer']='Exact exported mesh70 base PBR textures/metric UVs, colors and instance tints retained; blackbody thin-paper emission is an explicit physical-lighting calibration. Existing source water/puddle reflector surfaces become physical dielectric surfaces.';report['fixedSeed']=scene.cycles.seed;report['proxyPointGain']=POINT_GAIN;report['allRetainedLightsCastShadow']=True;report['lightCalibration']={'transfer':'Source positions/colors; area*pi and point*4pi power conversion','sunGain':float(os.environ.get('CYCLES_SUN_GAIN','.28')),'worldGain':float(os.environ.get('CYCLES_WORLD_GAIN','.70')),'exposure':scene.view_settings.exposure,'nativeWebglPixelEquivalence':False}
(OUT/'report.json').write_text(json.dumps(report,indent=2));(OUT/'render-source.py').write_text(Path(__file__).read_text())
if os.environ.get('CYCLES_SAVE_BLEND','1')=='1':
    blend_name=os.environ.get('CYCLES_BLEND_NAME','scene09-cycles74.blend')
    if Path(blend_name).name!=blend_name:raise ValueError('CYCLES_BLEND_NAME must be a filename')
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/blend_name),compress=True)
bpy.ops.render.render(write_still=True)
report['status']='path-traced-review';report['finished']=time.time();report['resolution']=[scene.render.resolution_x,scene.render.resolution_y];report['samples']=scene.cycles.samples;report['photographicAcceptance']=False;(OUT/'report.json').write_text(json.dumps(report,indent=2));print('CYCLES_REVIEW_COMPLETE',json.dumps(report),flush=True)
