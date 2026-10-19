"""One coupled Nishita-sky study of the unchanged frozen scene04 geometry.

One world-only linear-float sample sets a single global radiance scale.
One1254 scene frame follows; no independent SUN, exposure or background gain.
"""
import bpy,json,math,time,hashlib,struct
from pathlib import Path
import numpy as np
from mathutils import Matrix,Vector

BASE=Path('lookdev/scene04-physical/results/physical01/scene04-physical01.blend').resolve()
OUT=Path('lookdev/scene04-nishita-coupled/results').resolve();OUT.mkdir(parents=True,exist_ok=True)
MEASURE=Path('output/scene04-nishita-coupled').resolve();MEASURE.mkdir(parents=True,exist_ok=True)
PACKAGE=Path('output/scene04-physical-frozen-export').resolve()

def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(4*1024*1024),b''):h.update(chunk)
    return h.hexdigest()

source_report=json.loads((PACKAGE/'export-report.json').read_text())
source=json.loads((PACKAGE/'scene.json').read_text())
assert source_report['sourceHash']=='d1f02ccbe5cd1489e5211d8a831508aa592908cbe24733f3dee8bc74f37ce2a8'
bpy.ops.wm.open_mainfile(filepath=str(BASE));s=bpy.context.scene

def state():
    def serial(v):
        try:return list(v)
        except TypeError:return v
    materials=[]
    for m in bpy.data.materials:
        nodes=[]
        for n in m.node_tree.nodes if m.use_nodes else []:
            nodes.append({'name':n.name,'type':n.bl_idname,'operation':getattr(n,'operation',None),'image':getattr(getattr(n,'image',None),'name',None),'extension':getattr(n,'extension',None),'inputs':[(i.identifier,serial(i.default_value) if hasattr(i,'default_value') else None) for i in n.inputs]})
        materials.append({'name':m.name,'nodes':nodes,'links':[(l.from_node.name,l.from_socket.identifier,l.to_node.name,l.to_socket.identifier) for l in m.node_tree.links] if m.use_nodes else []})
    return {'camera':[v for row in s.camera.matrix_world for v in row],'lens':s.camera.data.lens,'sensorHeight':s.camera.data.sensor_height,'objects':[(o.name,o.type,[v for row in o.matrix_world for v in row],len(o.data.vertices) if o.type=='MESH' else None,len(o.data.polygons) if o.type=='MESH' else None) for o in s.objects],'materials':materials,'lights':[(o.name,o.data.type,None if o.data.type=='SUN' else o.data.energy,list(o.data.color),o.data.angle if o.data.type=='SUN' else None) for o in s.objects if o.type=='LIGHT'],'render':{'size':[s.render.resolution_x,s.render.resolution_y],'samples':s.cycles.samples,'seed':s.cycles.seed,'exposure':s.view_settings.exposure,'viewTransform':s.view_settings.view_transform}}

before=state();fingerprint=hashlib.sha256(json.dumps(before,sort_keys=True).encode()).hexdigest()
triangles=sum(len(o.data.polygons) for o in s.objects if o.type=='MESH');assert triangles==23669477
assert s.render.resolution_x==s.render.resolution_y==1254 and s.view_settings.exposure==0
sun=next(o for o in s.objects if o.type=='LIGHT' and o.data.type=='SUN')
direction=-(sun.matrix_world.to_3x3()@Vector((0,0,-1))).normalized()
sun_record=next(r for r in source['lights'] if r['type']=='DirectionalLight')
conversion=Matrix.Rotation(math.pi/2,4,'X');m=Matrix(np.array(sun_record['matrix']).reshape(4,4).T.tolist())
expected=np.array(conversion@m.translation-conversion@Vector(sun_record['target']),dtype=np.float64);expected/=np.linalg.norm(expected)
actual=np.asarray(direction,dtype=np.float64);actual/=np.linalg.norm(actual)
source_dot=float(np.clip(expected@actual,-1,1));source_error=math.degrees(math.acos(source_dot));assert source_error<.01
anchor_red=float(sun.data.energy)*float(direction.z);sun_before=float(sun.data.energy);diameter=float(sun.data.angle)
sun.data.energy=0

world=bpy.data.worlds.new('scene04-coupled-native-Nishita');world.use_nodes=True;s.world=world
nodes=world.node_tree.nodes;nodes.clear();links=world.node_tree.links
sky=nodes.new('ShaderNodeTexSky');available=[i.identifier for i in sky.bl_rna.properties['sky_type'].enum_items]
model=next((name for name in ['NISHITA','SINGLE_SCATTERING'] if name in available),None)
if model is None:raise ValueError('Native Nishita single-scattering enum unavailable: '+repr(available))
sky.sky_type=model
defaults={key:getattr(sky,key) for key in ['sun_disc','sun_intensity','sun_size','sun_elevation','sun_rotation','altitude','air_density','ozone_density']}
aerosol_key='aerosol_density' if hasattr(sky,'aerosol_density') else 'dust_density'
defaults[aerosol_key]=getattr(sky,aerosol_key)
setattr(sky,aerosol_key,1.0) # Documented Nishita clear-day aerosol/dust value.
sky.sun_disc=True;sky.sun_size=diameter;sky.sun_elevation=math.asin(float(direction.z))
# The API angle is reversed by SkyTextureNode::simplify_settings before sky.h.
# For the API: d=(sin(rotation)*cos(elevation),cos(rotation)*cos(elevation),sin(elevation)).
sky.sun_rotation=math.atan2(float(direction.x),float(direction.y))
background=nodes.new('ShaderNodeBackground');background.inputs['Strength'].default_value=1
output=nodes.new('ShaderNodeOutputWorld');links.new(sky.outputs['Color'],background.inputs['Color']);links.new(background.outputs[0],output.inputs['Surface'])
parameters={key:getattr(sky,key) for key in [*defaults.keys(),'sky_type']}
modeled=np.asarray([math.sin(sky.sun_rotation)*math.cos(sky.sun_elevation),math.cos(sky.sun_rotation)*math.cos(sky.sun_elevation),math.sin(sky.sun_elevation)],dtype=np.float64);modeled/=np.linalg.norm(modeled)
model_dot=float(np.clip(modeled@actual,-1,1));assert math.degrees(math.acos(model_dot))<.01

preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
for device in preferences.devices:device.use=device.type=='METAL'
if not any(device.use for device in preferences.devices):raise RuntimeError('Metal unavailable')
s.cycles.device='GPU'

# One empty-world panoramic radiance sample. The camera-to-Cycles basis is
# explicitly inverted so pixel directions equal Cycles' equirectangular D.
# This probe is not linked into the frozen scene, and no photographed RGB is read.
probe=None;probe_file=MEASURE/'native-nishita-world-unit-gain.exr';azimuth_relabel=0;sampling_note='One new world-only float sample of the correctly oriented model.'
if probe_file.exists():
    # Preserve the single existing sample made before the API-angle sign error
    # was caught. Nishita is rotationally symmetric about world Z: rigidly
    # re-label its longitude, preserving every horizontal radiance integral.
    audit=json.loads((OUT/'coordinate-check01/audit.json').read_text())
    if audit['skyEnum']!=model or audit['size']!=[8192,4096]:raise ValueError('Unrecognized cached float probe')
    old_rotation=float(np.float32(math.atan2(-float(direction.x),float(direction.y))))
    sampled_azimuth=math.atan2(math.cos(old_rotation),math.sin(old_rotation))
    azimuth_relabel=math.atan2(float(direction.y),float(direction.x))-sampled_azimuth
    sampling_note='Reused the one existing float probe. Only its longitude is rigidly re-labelled around Z after the documented API-angle sign correction; no second probe render.'
else:
    probe=bpy.data.scenes.new('Nishita-world-only-radiance-measurement');probe.world=world
    camera_data=bpy.data.cameras.new('world-only-panoramic-radiance-camera');camera_data.type='PANO';camera_data.panorama_type='EQUIRECTANGULAR'
    camera=bpy.data.objects.new(camera_data.name,camera_data);probe.collection.objects.link(camera)
    cycles_panorama_basis=Matrix(((0,-1,0,0),(0,0,1,0),(-1,0,0,0),(0,0,0,1)))
    camera.matrix_world=cycles_panorama_basis.inverted();probe.camera=camera
    probe.render.engine='CYCLES';probe.cycles.device='GPU';probe.cycles.samples=8;probe.cycles.use_denoising=False;probe.cycles.seed=904101;probe.cycles.use_animated_seed=False
    probe.render.resolution_x=8192;probe.render.resolution_y=4096;probe.render.resolution_percentage=100
    probe.render.image_settings.file_format='OPEN_EXR';probe.render.image_settings.color_depth='32';probe.render.image_settings.color_mode='RGB';probe.render.image_settings.exr_codec='ZIP'
    probe.view_settings.view_transform='Raw';probe.view_settings.exposure=0;probe.view_settings.gamma=1
    probe.render.filepath=str(probe_file);bpy.ops.render.render(scene=probe.name,write_still=True)
image=bpy.data.images.load(str(probe_file),check_existing=False);image.colorspace_settings.name='Linear Rec.709'
width,height=image.size;pixels=np.empty(width*height*4,dtype=np.float32);image.pixels.foreach_get(pixels);rgb=pixels.reshape(height,width,4)[:,:,:3]
assert np.isfinite(rgb).all() and float(rgb.max())>100
phi=math.pi-2*math.pi*(np.arange(width)+.5)/width+azimuth_relabel;cos_phi=np.cos(phi);sin_phi=np.sin(phi)
solar_radius=diameter/2;cap_radius=solar_radius+math.radians(.15);ring_min=math.radians(.65);ring_max=math.radians(1.0)
total=np.zeros(3);cap=np.zeros(3);ring_radiance=np.zeros(3);ring_solid=0;cap_horizontal_solid=0;cap_solid=0;peak_luminance=-1;peak_pixel=None;centroid=np.zeros(3);centroid_weight=0;solar_pixels=0
for row in range(height):
    altitude=math.pi*((row+.5)/height-.5);z=math.sin(altitude);horizontal=max(0,z)
    solid=(2*math.pi/width)*(math.sin(math.pi*((row+1)/height-.5))-math.sin(math.pi*(row/height-.5)))
    values=rgb[row].astype(np.float64);total+=values.sum(axis=0)*solid*horizontal
    luminance=values@np.asarray([.2126,.7152,.0722]);col=int(np.argmax(luminance))
    if luminance[col]>peak_luminance:peak_luminance=float(luminance[col]);peak_pixel=[col,row]
    x=math.cos(altitude)*cos_phi;y=math.cos(altitude)*sin_phi;dot=x*actual[0]+y*actual[1]+z*actual[2]
    cap_mask=dot>math.cos(cap_radius);ring_mask=(dot<math.cos(ring_min))&(dot>math.cos(ring_max))
    cap+=values[cap_mask].sum(axis=0)*solid*horizontal;cap_horizontal_solid+=int(cap_mask.sum())*solid*horizontal;cap_solid+=int(cap_mask.sum())*solid
    ring_radiance+=values[ring_mask].sum(axis=0)*solid;ring_solid+=int(ring_mask.sum())*solid
    # Centre of the actual rendered solar disc, not just the model property.
    bright=cap_mask&(luminance>1000)
    weights=luminance[bright]*solid
    centroid+=np.asarray([(x[bright]*weights).sum(),(y[bright]*weights).sum(),z*weights.sum()]);centroid_weight+=weights.sum();solar_pixels+=int(bright.sum())
ring_mean=ring_radiance/ring_solid;baseline=ring_mean*cap_horizontal_solid;direct=cap-baseline
if direct[0]<=0 or solar_pixels<20:raise ValueError('World sampling did not find the modeled SUN at source direction')
gain=anchor_red/float(direct[0]);background.inputs['Strength'].default_value=gain
centroid/=np.linalg.norm(centroid);centroid_dot=float(np.clip(centroid@actual,-1,1));centroid_error=math.degrees(math.acos(centroid_dot))
if centroid_error>.1:raise ValueError('Rendered solar direction mismatch '+str(centroid_error))
unit={'horizontalTotalRGB':total.tolist(),'solarCapRGB':cap.tolist(),'solarCapRadiusDegrees':math.degrees(cap_radius),'solarDiscRadiusDegrees':math.degrees(solar_radius),'solarCapSolidAngle':cap_solid,'solarTheoreticalSolidAngle':2*math.pi*(1-math.cos(solar_radius)),'neighborSkyRingDegrees':[.65,1.0],'neighborSkyMeanRadianceRGB':ring_mean.tolist(),'capSkyBaselineRGB':baseline.tolist(),'directSolarRGB':direct.tolist(),'skyWithoutDirectSolarRGB':(total-direct).tolist(),'peakLinearLuminance':peak_luminance,'peakPixel':peak_pixel,'solarPixelsAboveLuminance1000':solar_pixels,'renderedSolarCentroidDirection':centroid.tolist(),'renderedSolarCentroidDot':centroid_dot,'renderedSolarCentroidErrorDegrees':centroid_error}
measurement={'file':str(probe_file),'sha256':digest(probe_file),'size':[width,height],'samples':8,'colorSpace':'scene-linear Rec.709 float32','probeSceneMeshes':0,'uniformModelGain':gain,'actualWorldNodeStrength':background.inputs['Strength'].default_value,'anchorSourceHorizontalR':anchor_red,'anchorMeaning':'Source SUN8*directionY is a working brightness anchor, not measured SI irradiance.','samplingNote':sampling_note,'probeLongitudeRelabelRadians':azimuth_relabel,'unitGainIntegral':unit,'scaledDirectSolarRGB':(direct*gain).tolist(),'scaledSkyRGB':((total-direct)*gain).tolist(),'scaledTotalRGB':(total*gain).tolist(),'directToSkyRatioRGB':(direct/(total-direct)).tolist(),'solarSamplingLimitation':'Finite8-sample/pixel angular quadrature; neighboring sky baseline is an estimate, while all model sun/sky radiance gets the same gain.'}
bpy.data.images.remove(image);del rgb,pixels
if probe is not None:
    bpy.data.scenes.remove(probe);bpy.data.objects.remove(camera,do_unlink=True);bpy.data.cameras.remove(camera_data)
bpy.context.window.scene=s
assert before==state() and sun.data.energy==0
report={'status':'rendering','study':'Independent native Nishita coupled sun/sky','parentCommit':'b93edbfbdb6411dca515bdbe5381bcec702da4ba','sourceCommit':source_report['sourceCommit'],'sourceHash':source_report['sourceHash'],'baseBlend':str(BASE),'baseBlendSHA256':digest(BASE),'blender':bpy.app.version_string,'modelEnum':model,'availableSkyEnums':available,'nativeNodeDefaults':defaults,'actualSkyParameters':parameters,'aerosolChoice':'Nishita documented clear-day value1; air/ozone/altitude unchanged native defaults.','sourceSun':{'originalStrength':sun_before,'newIndependentStrength':sun.data.energy,'angularDiameterRadians':diameter,'worldOutwardDirection':actual.tolist(),'sourceMatrixDot':source_dot,'sourceMatrixErrorDegrees':source_error,'modeledDirection':modeled.tolist(),'modelDirectionDot':model_dot},'environmentMeasurement':measurement,'geometryTriangles':triangles,'preservedStateSHA256':fingerprint,'cameraGeometryMaterialsPracticalLightsAndExposurePreserved':True,'renderer':{'engine':'Cycles','device':'Metal','samples':s.cycles.samples,'seed':s.cycles.seed,'size':[s.render.resolution_x,s.render.resolution_y],'denoiser':s.cycles.denoiser,'exposureEV':s.view_settings.exposure,'viewTransform':s.view_settings.view_transform},'changes':['Replace independently scaled photographed sky and SUN with one native Nishita world including its own solar disc.','Set original independent SUN energy0.','One uniform world gain from actual rendered solar-cap integration; no separate sun/sky/exposure/background adjustment.'],'sourceTechnicalLinks':['https://docs.blender.org/manual/en/3.2/render/shader_nodes/textures/sky.html','https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/sky.html','https://github.com/blender/blender/blob/main/intern/cycles/kernel/svm/sky.h','https://github.com/blender/blender/blob/main/intern/cycles/blender/camera.cpp','https://github.com/blender/blender/blob/main/intern/cycles/kernel/camera/projection.h'],'limits':['No cloud model, so the reference clouds are absent.','World scale uses a declared working anchor, not recovered site illuminance.','Frozen geometry/material reconstruction and previously disclosed nonportable old-stone macro-weather limits remain.'],'started':time.time(),'photographicAcceptance':False}
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
s.render.filepath=str(OUT/'scene04-nishita-coupled.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'scene04-nishita-coupled.blend'),compress=True)
bpy.ops.render.render(scene=s.name,write_still=True)
assert before==state() and sun.data.energy==0
report.update(status='actual-coupled-Nishita-review',finished=time.time(),actualFullFrames=1,worldOnlyFloatSamples=1)
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print('NISHITA_COUPLED_COMPLETE',json.dumps({'gain':gain,'solarRGB':measurement['scaledDirectSolarRGB'],'skyRGB':measurement['scaledSkyRGB'],'directionErrorDegrees':centroid_error,'triangles':triangles}),flush=True)
