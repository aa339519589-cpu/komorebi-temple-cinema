"""Physical night transport / material calibration on the exact frozen R10 mesh.

Every iteration opens the original R01 import. No scene geometry is rebuilt,
removed or decimated. A crop is a newly sampled Cycles camera border, never an
enlarged section of an existing image.
"""
import bpy,json,math,os,time,hashlib
from pathlib import Path

BASE=Path('lookdev/scene09-solmax-cycles-20261021').resolve()
BASE_RENDER=BASE/'cycles-r01'
OUT=Path(os.environ.get('CYCLES_OUTPUT',str(BASE/'cycles-r02'))).resolve();OUT.mkdir(parents=True,exist_ok=True)
record=json.loads((BASE_RENDER/'report.json').read_text())
if record['sourceHash']!='b2d659097d51b2a49b720f3ff83a6bdf84e6c265dd2a89225e5c8ba074637715':raise RuntimeError('Frozen R10 source identity differs')
bpy.ops.wm.open_mainfile(filepath=str(BASE_RENDER/'scene09-r10-physical-r01.blend'))
scene=bpy.context.scene;camera_matrix=[list(row) for row in scene.camera.matrix_world]
report={'sourceCommit':record['sourceCommit'],'sourceHash':record['sourceHash'],'sourceStatistics':record['sourceStatistics'],'importedTriangles':record['importedTriangles'],'excludedCollapsedInstanceCount':record['excludedCollapsedInstanceCount'],'affinePreservation':record['affinePreservation'],'geometryDecimated':False,'geometryChanged':False,'cameraChanged':False,'baselineRender':'cycles-r01/scene09-r10-physical-r01.png','baselineReport':'cycles-r01/report.json','renderScript':{'file':Path(__file__).name,'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'visualAccepted':False,'started':time.time(),'status':'calibrating','warnings':[]}
paper_gain=float(os.environ.get('CYCLES_PAPER_RADIANCE_GAIN','10'))
paper_transmission=float(os.environ.get('CYCLES_PAPER_TRANSMISSION','.72'))
paper_color=tuple(float(v) for v in os.environ.get('CYCLES_PAPER_TRANSMISSION_COLOR','.87,.70,.42').split(','))
emission_rgb_gain=tuple(float(v) for v in os.environ.get('CYCLES_PAPER_RGB_GAIN','1,1,1').split(','))
stone_gain=float(os.environ.get('CYCLES_STONE_DIFFUSE_GAIN','2.0'))
stone_coat_roughness=float(os.environ.get('CYCLES_STONE_COAT_ROUGHNESS','.065'))
changed_paper=[];changed_stone=[]
for mat in bpy.data.materials:
    if not mat.use_nodes:continue
    n=mat.node_tree.nodes;links=mat.node_tree.links
    bs=next((node for node in n if node.type=='BSDF_PRINCIPLED'),None)
    out=next((node for node in n if node.type=='OUTPUT_MATERIAL'),None)
    if not bs or not out:continue
    name=mat.name.lower()
    if any(s in name for s in ['washi-tissue103','room-paper','pagoda-paper','lantern-inset-paper','lantern-warm-paper']):
        em_socket=bs.inputs['Emission Color'];em_strength=float(bs.inputs['Emission Strength'].default_value)
        # Separate real surface emission from the scattering branch, preserving
        # the corrected source emissive RGB times source material-space map.
        em=n.new('ShaderNodeEmission');em.inputs['Strength'].default_value=em_strength*paper_gain
        spectral=n.new('ShaderNodeVectorMath');spectral.operation='MULTIPLY';spectral.inputs[1].default_value=emission_rgb_gain
        if em_socket.is_linked:links.new(em_socket.links[0].from_socket,spectral.inputs[0])
        else:spectral.inputs[0].default_value=em_socket.default_value[:3]
        links.new(spectral.outputs['Vector'],em.inputs['Color'])
        bs.inputs['Emission Strength'].default_value=0
        thin=n.new('ShaderNodeBsdfTranslucent');thin.inputs['Color'].default_value=paper_color+(1,)
        scatter=n.new('ShaderNodeMixShader');scatter.inputs[0].default_value=paper_transmission
        links.new(bs.outputs['BSDF'],scatter.inputs[1]);links.new(thin.outputs['BSDF'],scatter.inputs[2])
        add=n.new('ShaderNodeAddShader');links.new(scatter.outputs[0],add.inputs[0]);links.new(em.outputs['Emission'],add.inputs[1]);links.new(add.outputs[0],out.inputs['Surface'])
        changed_paper.append({'name':mat.name,'sourceEmissionStrength':em_strength,'physicalEmissionStrength':em.inputs['Strength'].default_value,'emissiveRGBGainAfterSourceMapMultiply':emission_rgb_gain,'thinDiffuseTransmission':paper_transmission,'transmissionLinearRGB':paper_color})
    if name.startswith('scene09-cc0-wet-granite-veranda-paver-'):
        socket=bs.inputs['Base Color'];old=socket.links[0].from_socket if socket.is_linked else None
        gain=n.new('ShaderNodeVectorMath');gain.operation='SCALE';gain.inputs[3].default_value=stone_gain
        if old:links.new(old,gain.inputs[0])
        else:gain.inputs[0].default_value=socket.default_value[:3]
        links.new(gain.outputs['Vector'],socket)
        bs.inputs['Coat IOR'].default_value=1.333;bs.inputs['Coat Weight'].default_value=1;bs.inputs['Coat Roughness'].default_value=stone_coat_roughness
        changed_stone.append({'name':mat.name,'sourceDiffuseGain':stone_gain,'coatIOR':1.333,'coatWeight':1,'coatRoughness':stone_coat_roughness})
fixture_gain=float(os.environ.get('CYCLES_FIXTURE_GAIN','1'))
spot_gain=float(os.environ.get('CYCLES_SPOT_GAIN',str(fixture_gain)))
moon_gain=float(os.environ.get('CYCLES_MOON_GAIN','1'))
fill_gain=float(os.environ.get('CYCLES_FILL_GAIN','1'))
light_changes=[]
for obj in scene.objects:
    if obj.type!='LIGHT':continue
    light=obj.data;source_energy=light.energy
    if light.type=='SUN':light.energy*=fill_gain if 'warm-courtyard-reflected-light-proxy' in obj.name else moon_gain
    else:light.energy*=spot_gain if light.type=='SPOT' else fixture_gain
    light_changes.append({'name':obj.name,'sourceEnergy':source_energy,'calibratedEnergy':light.energy,'positionZUp':list(obj.location),'physicalShadows':True})
water_mat=bpy.data.materials.get('scene09 physical pond water IOR1.333')
wn=water_mat.node_tree.nodes;wl=water_mat.node_tree.links
wbs=next(node for node in wn if node.type=='BSDF_PRINCIPLED')
bump=next(node for node in wn if node.type=='BUMP')
old_height=bump.inputs['Height'].links[0].from_socket
amplitude=float(os.environ.get('CYCLES_WATER_RIPPLE_GAIN','2.6'))
wave_gain=wn.new('ShaderNodeMath');wave_gain.operation='MULTIPLY';wave_gain.inputs[1].default_value=amplitude;wl.new(old_height,wave_gain.inputs[0])
pos=next(node for node in wn if node.type=='NEW_GEOMETRY')
noise=wn.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=12;noise.inputs['Detail'].default_value=3;noise.inputs['Roughness'].default_value=.72;wl.new(pos.outputs['Position'],noise.inputs['Vector'])
noise_height=wn.new('ShaderNodeMath');noise_height.operation='MULTIPLY_ADD';noise_height.inputs[1].default_value=.0012;noise_height.inputs[2].default_value=-.0006;wl.new(noise.outputs['Fac'],noise_height.inputs[0])
add=wn.new('ShaderNodeMath');add.operation='ADD';wl.new(wave_gain.outputs[0],add.inputs[0]);wl.new(noise_height.outputs[0],add.inputs[1]);wl.new(add.outputs[0],bump.inputs['Height'])
wbs.inputs['Roughness'].default_value=float(os.environ.get('CYCLES_WATER_ROUGHNESS','.032'))
report['paperTransport']={'reason':'R01 source PBR panes were opaque and blocked internal source lamps under physical occlusion. Real washi is a thin diffuse transmitter. Calibrated source surface radiance plus energy-conserving 72% thin scattering permits actual fixture light to enter the courtyard.','materials':changed_paper,'sourcePositionsAndRelativeFluxPreserved':True,'emissionRGBAndTexturePreserved':True,'referencePhotoPixelsUsed':False}
report['wetGraniteCalibration']={'reason':'R01 actual scan times source very dark base tint gave unreadable near facets. Diffuse gain fits plausible wet-granite reflectance while physical water coating and original normal/facet geometry retain the measured wet response.','materials':changed_stone,'noFloatingMirror':True}
report['waterCalibration']={'IOR':1.333,'baseWaveAmplitudeMultiplier':amplitude,'uncoloredMicroChopAmplitudeMetres':.0012,'chopScalePerMetre':12,'roughness':wbs.inputs['Roughness'].default_value,'reflection':'Physical source geometry, fixtures and sky; no painted strokes or reference image projection'}
report['lightCalibration']={'fixtureGain':fixture_gain,'spotGain':spot_gain,'moonGain':moon_gain,'sourceWarmFillGain':fill_gain,'sourceLights':light_changes,'newLightsAdded':False,'sourcePointPowerConversion':'Numerical source candela * 4pi radiant proxy; spectral efficacy is unknown.','nativeShadowDifference':'All source lights physically occlude; original native local pools often had no shadows.'}
scene.render.engine='CYCLES';scene.cycles.samples=int(os.environ.get('CYCLES_SAMPLES','64'));scene.cycles.use_denoising=True
for layer in scene.view_layers:layer.cycles.use_denoising=True
scene.cycles.max_bounces=14;scene.cycles.diffuse_bounces=8;scene.cycles.glossy_bounces=8;scene.cycles.transmission_bounces=10;scene.cycles.sample_clamp_indirect=12
scene.render.resolution_x=int(os.environ.get('CYCLES_SIZE','1254'));scene.render.resolution_y=scene.render.resolution_x;scene.render.resolution_percentage=100
scene.view_settings.exposure=float(os.environ.get('CYCLES_EXPOSURE',str(math.log2(.95))));scene.view_settings.view_transform='AgX';scene.view_settings.gamma=1
sky_camera_gain=float(os.environ.get('CYCLES_SKY_CAMERA_GAIN','1'))
for node in scene.world.node_tree.nodes:
    if node.type=='BACKGROUND' and node.inputs['Color'].is_linked and node.inputs['Color'].links[0].from_node.type=='TEX_IMAGE':node.inputs['Strength'].default_value=sky_camera_gain
report['skyCameraRadianceGain']=sky_camera_gain
scene.render.use_border=False
crop=os.environ.get('CYCLES_CROP')
if crop:
    x0,y0,x1,y1=[float(v) for v in crop.split(',')]
    if not(0<=x0<x1<=1 and 0<=y0<y1<=1):raise ValueError('CYCLES_CROP uses normalized left,bottom,right,top')
    scene.render.use_border=True;scene.render.use_crop_to_border=True
    scene.render.border_min_x=x0;scene.render.border_min_y=y0;scene.render.border_max_x=x1;scene.render.border_max_y=y1
    report['detailCapture']={'method':'Independent full-sensor Cycles ray sampling with render border; no image upscale','fullSensorPixels':[scene.render.resolution_x,scene.render.resolution_y],'normalizedBorder':[x0,y0,x1,y1]}
render_name=os.environ.get('CYCLES_RENDER_NAME','scene09-r10-physical-r02.png')
if Path(render_name).name!=render_name:raise ValueError('Render name must be a filename')
scene.render.filepath=str(OUT/render_name)
if os.environ.get('CYCLES_PACK_MODEL','0')=='1':
    unique={};dedup=0
    for image in list(bpy.data.images):
        key=(bpy.path.abspath(image.filepath),image.colorspace_settings.name,image.alpha_mode,image.source)
        if image.source!='FILE' or not key[0]:continue
        if key in unique:image.user_remap(unique[key]);bpy.data.images.remove(image);dedup+=1
        else:unique[key]=image
    bpy.ops.file.pack_all();report['packedModel']={'textureDeduplications':dedup,'allUsedFileImagesPacked':all(i.packed_file for i in bpy.data.images if i.users and i.source=='FILE')}
if os.environ.get('CYCLES_SAVE_BLEND','1')=='1':
    blend_name=os.environ.get('CYCLES_BLEND_NAME','scene09-r10-physical-r02.blend')
    if Path(blend_name).name!=blend_name:raise ValueError('Blend name must be a filename')
    blend_path=OUT/blend_name;bpy.ops.wm.save_as_mainfile(filepath=str(blend_path),compress=True)
    report['editableModel']={'file':blend_name,'bytes':blend_path.stat().st_size,'sha256':hashlib.sha256(blend_path.read_bytes()).hexdigest(),'largeReleaseAssetNotGitBlob':True}
report['rendererLimits']=record['rendererLimits'];report['viewTransform']={'name':'AgX','exposureStops':scene.view_settings.exposure,'nativeWebglPixelEquivalence':False}
report['cameraMatrixZUp']=camera_matrix;report['cameraUnchangedDuringCalibration']=camera_matrix==[list(row) for row in scene.camera.matrix_world]
report['status']='rendering';(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
start=time.time();bpy.ops.render.render(write_still=True)
report['renderSeconds']=time.time()-start;report['renderSha256']=hashlib.sha256(Path(scene.render.filepath).read_bytes()).hexdigest();report['finished']=time.time();report['status']='path-traced-review'
report['resolution']=[scene.render.resolution_x,scene.render.resolution_y];report['samples']=scene.cycles.samples
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print('SCENE09_PHYSICAL_ITERATION_COMPLETE',json.dumps({k:report[k] for k in ['sourceHash','status','renderSeconds','renderSha256','visualAccepted']}),flush=True)
