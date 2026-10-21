"""Fresh fixed-sample Cycles subfrustum, with raw/denoised images from one render.

Uses only the packed, already-verified R9 whole-room prototype. The raw Noisy
Image and OIDN Combined passes are written from identical Monte Carlo samples;
no camera, light, mesh or material differs between the two outputs.
"""
import bpy,json,math,os,time,hashlib,shutil
from pathlib import Path
import numpy as np
HERE=Path(__file__).resolve().parent
BASE=HERE/'scene06-r9-physical-portable.blend'
OUT=Path(os.environ.get('CYCLES_OUTPUT',str(HERE/'iteration-06-fixed192-head-comparison'))).resolve();OUT.mkdir(parents=True,exist_ok=True)
LABEL=os.environ.get('CYCLES_DETAIL_LABEL','head-hands')
source=json.loads((HERE/'iteration-03-thinner-air/report.json').read_text())
assert source['status']=='path-traced-review' and source['sourceHash']=='061e581d9b6fdf04e08a8133ad6f45b28bc9c6531c6a41aefd3b142ca2deefe0'
started=time.time();bpy.ops.wm.open_mainfile(filepath=str(BASE));scene=bpy.context.scene
assert scene['sourceHash']==source['sourceHash']
geometry_counts={'objects':len(scene.objects),'meshes':len(bpy.data.meshes),'vertices':sum(len(m.vertices) for m in bpy.data.meshes),'polygons':sum(len(m.polygons) for m in bpy.data.meshes)}
cam=scene.camera.data;camera_matrix=[float(v) for row in scene.camera.matrix_world for v in row]
assert abs(cam.shift_x)<1e-8 and abs(cam.shift_y)<1e-8,'Expected full source camera in portable prototype'
scene.render.resolution_x=scene.render.resolution_y=1254;scene.render.resolution_percentage=100
crop=[float(v) for v in os.environ.get('CYCLES_DETAIL_CROP','520,329,230,1254').split(',')];x,y,size,full=crop
assert 0<=x and 0<=y and size>0 and x+size<=full and y+size<=full
original=np.asarray([(v.x/-v.z,v.y/-v.z) for v in cam.view_frame(scene=scene)]);l,b=original.min(axis=0);r,t=original.max(axis=0)
desired=np.array([l+(r-l)*x/full,l+(r-l)*(x+size)/full,b+(t-b)*(full-y-size)/full,t-(t-b)*y/full])
cam.lens*=full/size
def bounds():
 a=np.asarray([(v.x/-v.z,v.y/-v.z) for v in cam.view_frame(scene=scene)]);lo=a.min(axis=0);hi=a.max(axis=0);return np.array([lo[0],hi[0],lo[1],hi[1]])
initial=bounds();cam.shift_x=1;dx=(bounds()-initial)[0];cam.shift_x=0;cam.shift_y=1;dy=(bounds()-initial)[2];cam.shift_y=0
cam.shift_x=float((desired[0]-initial[0])/dx);cam.shift_y=float((desired[2]-initial[2])/dy)
actual=bounds();ray_error=float(np.max(np.abs(actual-desired)));assert ray_error<2e-6
scene.render.engine='CYCLES';scene.cycles.samples=192;scene.cycles.use_adaptive_sampling=False;scene.cycles.seed=0;scene.cycles.use_animated_seed=False
scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';scene.view_layers[0].cycles.use_denoising=True;scene.view_layers[0].cycles.denoising_store_passes=True
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for dev in prefs.devices:dev.use=dev.type=='METAL'
assert any(d.type=='METAL' for d in prefs.devices);scene.cycles.device='GPU'
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8'
scene.render.filepath=str(OUT/(LABEL+'-denoised.png'));scene.render.use_compositing=True
# Blender 5.2's compositor is a standalone node group. The built-in Cycles
# Noisy Image pass is the same source samples used for its OIDN Combined pass.
tree=bpy.data.node_groups.new('Same192 samples: raw physical radiance and OIDN','CompositorNodeTree');scene.compositing_node_group=tree
rl=tree.nodes.new('CompositorNodeRLayers');rl.scene=scene;rl.layer=scene.view_layers[0].name
assert 'Noisy Image' in rl.outputs
out=tree.nodes.new('NodeGroupOutput');tree.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor');tree.links.new(rl.outputs['Image'],out.inputs['Image'])
fileout=tree.nodes.new('CompositorNodeOutputFile');fileout.directory=str(OUT);fileout.file_name='raw-physical-same-samples';fileout.format.file_format='PNG';fileout.format.color_mode='RGB';fileout.format.color_depth='8'
if hasattr(fileout.format,'color_management'):fileout.format.color_management='FOLLOW_SCENE'
item=fileout.file_output_items.new('RGBA','raw');tree.links.new(rl.outputs['Noisy Image'],fileout.inputs['raw'])
report={'status':'rendering','started':started,'sourceCommit':source['sourceCommit'],'sourceHash':source['sourceHash'],'sourceExportSceneSha256':source['exportSceneSha256'],'sourcePortableBlendSha256':hashlib.sha256(BASE.read_bytes()).hexdigest(),'sourceImportScriptSha256':source['renderScript']['sha256'],'renderScript':{'file':Path(__file__).name,'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'basePhysicalCandidate':'iteration-03-thinner-air','label':LABEL,'resolution':[1254,1254],'samplesPerPixel':192,'adaptiveSampling':False,'seed':0,'denoiser':'OPENIMAGEDENOISE','sameMonteCarloSamplesForBothOutputs':True,'rawPass':'Cycles Noisy Image','denoisedPass':'Cycles Combined / OpenImageDenoise','externalImageInput':False,'referencePhotoLoaded':False,'sourceGeometryCounts':geometry_counts,'sourceBufferTriangleCount':source['importedTriangles'],'sourceAttributeAudit':'export-attribute-audit.json','cameraMatrixUnchanged':True,'trueSubfrustum':{'cropInFullSourcePixels':crop,'lensMm':cam.lens,'shift':[cam.shift_x,cam.shift_y],'desiredCameraLocalRaySlopes':desired.tolist(),'actualCameraLocalRaySlopes':actual.tolist(),'maxAbsoluteRaySlopeError':ray_error,'upsampledScreenshot':False},'physicalCalibration':{'sky':source['exteriorSkyBoundary'],'lights':source['physicalLights'],'medium':source['participatingMedium'],'varnish':source['physicalVarnishCalibration'],'toneMapExposure':source['lightCalibration']['exposureEV'],'materialPositionsOrLightingChanged':False},'visualAccepted':False,'photographicAcceptance':False}
(OUT/'report.json').write_text(json.dumps(report,indent=2));(OUT/'render-source.py').write_text(Path(__file__).read_text())
bpy.ops.render.render(write_still=True)
files=[p for p in OUT.rglob('*.png') if p.name!=(LABEL+'-denoised.png')]
assert len(files)==1,('Expected one raw PNG from Cycles Noisy Image pass',files)
raw_path=OUT/(LABEL+'-raw.png')
if files[0]!=raw_path:shutil.copyfile(files[0],raw_path)
report['outputs']={}
for name,p in [('raw',raw_path),('denoised',OUT/(LABEL+'-denoised.png'))]:
 im=bpy.data.images.load(str(p),check_existing=False);assert list(im.size)==[1254,1254]
 report['outputs'][name]={'file':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'colorManagement':'Same scene AgX Medium High Contrast, exposure .45 EV'}
assert camera_matrix==[float(v) for row in scene.camera.matrix_world for v in row]
report.update(status='path-traced-same-sample-review',elapsedSeconds=time.time()-started,finished=time.time())
(OUT/'report.json').write_text(json.dumps(report,indent=2));print('SAME_SAMPLE_COMPARISON',json.dumps({k:report[k] for k in ['status','elapsedSeconds','label','samplesPerPixel','sameMonteCarloSamplesForBothOutputs','visualAccepted']}),flush=True)
