"""Process the existing CC0 furniture scan into a bridge coating roughness.

Only the roughness channel changes: output = 0.50 + 0.20 * input.
The albedo, normal, metalness, IOR and scene light/exposure are untouched.
Run with the repository's shared queued Blender wrapper; no render occurs.
"""
import bpy,json,hashlib
import numpy as np
from pathlib import Path

REPO=Path(__file__).resolve().parents[3]
SOURCE=REPO/'assets/polyhaven/lacquered-cherry-wood/roughness-2k.jpg'
ASSETS=Path(__file__).resolve().parents[1]/'assets';ASSETS.mkdir(parents=True,exist_ok=True)
OUTPUT=ASSETS/'bridge-coating-roughness-2k.png'
image=bpy.data.images.load(str(SOURCE),check_existing=False);image.colorspace_settings.name='Non-Color'
w,h=image.size;data=np.empty(w*h*4,dtype=np.float32);image.pixels.foreach_get(data);source=data.reshape(h,w,4)[:,:,1]
processed=.50+.20*source
result=np.ones((h,w,4),dtype=np.float32);result[:,:,:3]=processed[:,:,None]
target=bpy.data.images.new('scene09-bridge-shared-coating-roughness',width=w,height=h,alpha=False,float_buffer=False);target.colorspace_settings.name='Non-Color';target.pixels.foreach_set(result.ravel());target.filepath_raw=str(OUTPUT);target.file_format='PNG';target.save()
saved=bpy.data.images.load(str(OUTPUT),check_existing=False);saved.colorspace_settings.name='Non-Color';pixels=np.empty(w*h*4,dtype=np.float32);saved.pixels.foreach_get(pixels);channel=pixels.reshape(h,w,4)[:,:,1]
report={'revision':'scene09-bridge-shared-roughness-74','source':str(SOURCE.relative_to(REPO)),'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'provider':'Poly Haven','asset':'lacquered_cherry_wood','license':'CC0-1.0','sourceURL':'https://polyhaven.com/a/lacquered_cherry_wood','processor':'reconstructions/scene-09/src/process-bridge-roughness.py','processorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'formula':'outputRoughness = 0.50 + 0.20 * originalScanG; material roughness factor = 1.0','output':str(OUTPUT.relative_to(REPO)),'outputSha256':hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),'size':[w,h],'colorSpace':'Non-Color, numeric roughness','sourceValues':{'min':float(source.min()),'median':float(np.median(source)),'max':float(source.max())},'savedOutputValues':{'min':float(channel.min()),'median':float(np.median(channel)),'max':float(channel.max())},'nativeAndCyclesShareOneProcessedImage':True,'materials':['bridge vermilion rails/posts','bridge structural timber','bridge deck timber'],'preserved':['albedo texture and color gains','normal texture/strength','metalness','IOR/specular settings','geometry and camera','lights and exposure'],'reason':'The forensic cycles73 frame preserved red base color but showed91-93 percent glossy luminance on gray sections with effective roughness around0.226. The source furniture-varnish gloss is inconsistent with the reference bridge.','scenePhotographSampled':False}
(ASSETS/'bridge-coating-roughness-provenance.json').write_text(json.dumps(report,indent=2))
print('BRIDGE_ROUGHNESS_PROCESSED',json.dumps(report),flush=True)
