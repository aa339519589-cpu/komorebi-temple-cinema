"""Independent native ray samples of held Scene09 physical surfaces and joinery."""
import bpy,json,time,hashlib
from pathlib import Path

BASE=Path('lookdev/scene09-solmax-cycles-20261021').resolve()
SOURCE=BASE/'cycles-r03';OUT=BASE/'details-r03';OUT.mkdir(parents=True,exist_ok=True)
record=json.loads((SOURCE/'report.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'scene09-r10-physical-r03.blend'))
scene=bpy.context.scene;matrix=[list(row) for row in scene.camera.matrix_world]
scene.render.resolution_x=2508;scene.render.resolution_y=2508;scene.render.resolution_percentage=100
scene.cycles.samples=96;scene.cycles.use_denoising=True;scene.render.use_border=True;scene.render.use_crop_to_border=True
results=[]
for name,border in [('floor-native',(0.02,0.0,.92,.27)),('architecture-native',(.38,.42,.99,.75))]:
    x0,y0,x1,y1=border;scene.render.border_min_x=x0;scene.render.border_min_y=y0;scene.render.border_max_x=x1;scene.render.border_max_y=y1
    target=OUT/(name+'.png');scene.render.filepath=str(target)
    start=time.time();bpy.ops.render.render(write_still=True)
    results.append({'file':target.name,'normalizedBorder':border,'fullSensorResolution':[2508,2508],'renderedPixelDimensions':[round((x1-x0)*2508),round((y1-y0)*2508)],'samples':96,'renderSeconds':time.time()-start,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
    report={'sourceCommit':record['sourceCommit'],'sourceHash':record['sourceHash'],'calibratedSource':'cycles-r03/report.json','method':'Independent native Cycles samples using full2508 sensor border; no source image cropping/upscaling','sourceGeometryPreserved':True,'cameraMatrixZUp':matrix,'cameraUnchanged':matrix==[list(row) for row in scene.camera.matrix_world],'captures':results,'visualAccepted':False}
    (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print('SCENE09_PHYSICAL_DETAILS_COMPLETE',json.dumps(results),flush=True)
