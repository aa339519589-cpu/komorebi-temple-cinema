"""Reduce broad room-pane overglow while retaining the physical small fixtures.

This is a material-radiance calibration on the packed exact R10 scene. Geometry,
fixture anchors, source point/spot flux calibration, camera and microfacet water
surfaces remain the R04 physical model.
"""
import bpy,json,time,hashlib,runpy
from pathlib import Path

BASE=Path('lookdev/scene09-solmax-cycles-20261021').resolve();SOURCE=BASE/'cycles-r04';OUT=BASE/'cycles-r05';OUT.mkdir(parents=True,exist_ok=True)
record=json.loads((SOURCE/'report.json').read_text())
if record['sourceHash']!='b2d659097d51b2a49b720f3ff83a6bdf84e6c265dd2a89225e5c8ba074637715':raise RuntimeError('Frozen source identity differs')
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'scene09-r10-packed-physical-r04.blend'))
restore_script=BASE/'restore-singular-source.py'
restored=runpy.run_path(str(restore_script))['restore_singular_source'](BASE/'export')
scene=bpy.context.scene;matrix=[list(row) for row in scene.camera.matrix_world];changes=[]
for mat in bpy.data.materials:
    factor=.45 if 'scene09-recessed-room-paper' in mat.name else .70 if 'scene09-pagoda-paper' in mat.name else 1
    if factor==1:continue
    for node in mat.node_tree.nodes:
        if node.type=='EMISSION':
            before=float(node.inputs['Strength'].default_value);node.inputs['Strength'].default_value=before*factor
            changes.append({'material':mat.name,'beforeStrength':before,'factor':factor,'afterStrength':node.inputs['Strength'].default_value,'emissiveRGBAndTextureUnchanged':True})
report=dict(record)
for key in ['finished','editableModel','sceneLinearAsset','cameraMatrixZUp','cameraUnchanged']:report.pop(key,None)
report.update({'calibrationSource':'cycles-r04/report.json','roomPaneBalance':{'reason':'Native architectural detail showed broad cream room panes too close to white. Reduce only room/pagoda pane radiance while keeping actual small lanterns and the original source fixture anchors/flux calibration.','materials':changes},'renderScript':{'file':Path(__file__).name,'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'captures':[],'started':time.time(),'status':'rendering','visualAccepted':False})
report['singularSourceRestoration']=restored
report['singularRestorationScript']={'file':restore_script.name,'sha256':hashlib.sha256(restore_script.read_bytes()).hexdigest()}
report['importedTriangles']=record['importedTriangles']+restored['restoredIndexedTriangles'];report['sourceTriangleCount']=record['sourceStatistics']['triangles'];report['geometryTriangleCountPreserved']=report['importedTriangles']==report['sourceTriangleCount']
if not report['geometryTriangleCountPreserved']:raise RuntimeError('Not all frozen source indexed triangles have been retained')
report['historicalImporterExcludedSingularInstanceCount']=record['excludedCollapsedInstanceCount'];report['excludedCollapsedInstanceCount']=0;report['excludedZeroAreaTriangles']=0
report['affinePreservation']=dict(report['affinePreservation']);report['affinePreservation']['rankDeficientInstancesRetained']=restored['restoredInstances'];report['affinePreservation']['rankDeficientIndexedTrianglesRetained']=restored['restoredIndexedTriangles']
report['rendererLimits']=list(record['rendererLimits'])+['Three rank2 source boxes retain all36 original indexed triangles, with exact transformed positions/UV/RGB; recalculated physical planar normals replace undefined inverse-transpose normals. R01–R04 excluded them under an incorrect zero-area assumption.']
scene.cycles.samples=128;scene.cycles.use_denoising=True
for layer in scene.view_layers:layer.cycles.use_denoising=True
scene.render.use_border=False;scene.render.use_crop_to_border=False;scene.render.resolution_x=1254;scene.render.resolution_y=1254;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8'
target=OUT/'scene09-r10-physical-r05.png';scene.render.filepath=str(target)
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
start=time.time();bpy.ops.render.render(write_still=True)
report['captures'].append({'kind':'full-reference-camera','file':target.name,'resolution':[1254,1254],'samples':128,'renderSeconds':time.time()-start,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
linear=OUT/'scene09-r10-physical-r05-linear.exr';scene.render.image_settings.file_format='OPEN_EXR';scene.render.image_settings.color_depth='16';scene.render.image_settings.exr_codec='ZIP';bpy.data.images['Render Result'].save_render(str(linear),scene=scene)
report['sceneLinearAsset']={'file':linear.name,'bytes':linear.stat().st_size,'sha256':hashlib.sha256(linear.read_bytes()).hexdigest(),'channels':'Scene-linear RGB half float','releaseAssetNotGitBlob':True}
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_depth='8'
scene['physical_lighting_scope']=scene.get('physical_lighting_scope','')+' R05 reduces source room panes0.45 and pagoda panes0.70, leaving small fixtures unchanged.'
bpy.ops.file.pack_all();blend=OUT/'scene09-r10-packed-physical-r05.blend';bpy.ops.wm.save_as_mainfile(filepath=str(blend),compress=True)
images=[{'name':i.name,'source':i.source,'packed':bool(i.packed_file),'hasData':i.has_data,'colorSpace':i.colorspace_settings.name} for i in bpy.data.images if i.users and i.name!='Render Result']
report['editableModel']={'file':blend.name,'bytes':blend.stat().st_size,'sha256':hashlib.sha256(blend.read_bytes()).hexdigest(),'allUsedFileImagesPacked':all(i['packed'] for i in images if i['source']=='FILE'),'allUsedImagesHaveData':all(i['hasData'] for i in images),'images':images,'largeReleaseAssetNotGitBlob':True,'fullReferenceCameraSaved':True}
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
scene.render.resolution_x=2508;scene.render.resolution_y=2508;scene.render.use_border=True;scene.render.use_crop_to_border=True;scene.cycles.samples=96
for name,border in [('floor-native',(0.02,0.0,.92,.27)),('architecture-native',(.38,.42,.99,.75))]:
    x0,y0,x1,y1=border;scene.render.border_min_x=x0;scene.render.border_min_y=y0;scene.render.border_max_x=x1;scene.render.border_max_y=y1
    target=OUT/(name+'.png');scene.render.filepath=str(target);start=time.time();bpy.ops.render.render(write_still=True)
    report['captures'].append({'kind':name,'file':target.name,'fullSensorPixels':[2508,2508],'normalizedFullSensorBorder':border,'samples':96,'renderSeconds':time.time()-start,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'nativeRaySamples':True,'imageUpscaled':False})
    (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
report['cameraMatrixZUp']=matrix;report['cameraUnchanged']=matrix==[list(row) for row in scene.camera.matrix_world];report['finished']=time.time();report['status']='physical-night-court-review'
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print('SCENE09_PHYSICAL_R05_COMPLETE',json.dumps({'sourceHash':report['sourceHash'],'captures':report['captures'],'packedModel':{k:v for k,v in report['editableModel'].items() if k!='images'},'visualAccepted':False}),flush=True)
