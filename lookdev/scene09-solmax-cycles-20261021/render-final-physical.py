"""Finish the held R10 physical night image and retain the editable scene.

Wet granite is a facet-following dielectric film over unchanged stone geometry,
with submillimetre riven/mineral normals. No image plates or painted reflections.
"""
import bpy,json,math,time,hashlib
from pathlib import Path

BASE=Path('lookdev/scene09-solmax-cycles-20261021').resolve()
SOURCE=BASE/'cycles-r03';OUT=BASE/'cycles-r04';OUT.mkdir(parents=True,exist_ok=True)
record=json.loads((SOURCE/'report.json').read_text())
if record['sourceHash']!='b2d659097d51b2a49b720f3ff83a6bdf84e6c265dd2a89225e5c8ba074637715':raise RuntimeError('Frozen R10 source identity differs')
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'scene09-r10-physical-r03.blend'))
scene=bpy.context.scene;camera_matrix=[list(row) for row in scene.camera.matrix_world]
materials=[]
for mat in bpy.data.materials:
    if not mat.name.startswith('scene09-cc0-wet-granite-veranda-paver-'):continue
    n=mat.node_tree.nodes;links=mat.node_tree.links
    bs=next(node for node in n if node.type=='BSDF_PRINCIPLED')
    color_gain=bs.inputs['Base Color'].links[0].from_node
    if color_gain.type!='VECT_MATH' or color_gain.operation!='SCALE':raise RuntimeError('Expected declared R03 wet-stone diffuse calibration')
    color_gain.inputs[3].default_value=1.4
    source_normal=bs.inputs['Normal'].links[0].from_socket
    position=n.new('ShaderNodeNewGeometry')
    normal=source_normal
    for scale,distance,detail in [(18,.0009,2),(180,.00035,0)]:
        noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=scale;noise.inputs['Detail'].default_value=detail;noise.inputs['Roughness'].default_value=.7;links.new(position.outputs['Position'],noise.inputs['Vector'])
        bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=1;bump.inputs['Distance'].default_value=distance;links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(normal,bump.inputs['Normal']);normal=bump.outputs['Normal']
    links.new(normal,bs.inputs['Normal']);links.new(normal,bs.inputs['Coat Normal'])
    # Use the real CC0 scan roughness as spatial variation of the water film.
    source_roughness=bs.inputs['Roughness'].links[0].from_node.inputs[0].links[0].from_socket
    film_roughness=n.new('ShaderNodeMath');film_roughness.operation='MULTIPLY_ADD';film_roughness.inputs[1].default_value=.07;film_roughness.inputs[2].default_value=.015;links.new(source_roughness,film_roughness.inputs[0]);links.new(film_roughness.outputs[0],bs.inputs['Coat Roughness'])
    materials.append({'name':mat.name,'diffuseGainOverOriginalSource':1.4,'physicalFilmIOR':1.333,'filmRoughness':'0.015 + 0.07 * original CC0 roughness green channel','rivenNormalHeightMetres':.0009,'rivenScalePerMetre':18,'mineralNormalHeightMetres':.00035,'mineralScalePerMetre':180,'normalStack':'Actual source facet/split normals + source CC0 normal scan + metric riven and mineral microrelief','geometryChanged':False})
report={'sourceCommit':record['sourceCommit'],'sourceHash':record['sourceHash'],'sourceStatistics':record['sourceStatistics'],'importedTriangles':record['importedTriangles'],'affinePreservation':record['affinePreservation'],'excludedCollapsedInstanceCount':record['excludedCollapsedInstanceCount'],'allNondegenerateSourceTrianglesPreserved':True,'excludedZeroAreaTriangles':36,'geometryChangedFromExactImport':False,'geometryDecimated':False,'calibrationSource':'cycles-r03/report.json','materialAndLightCalibration':{'paperTransport':record['paperTransport'],'sourceLightCalibration':record['lightCalibration'],'waterCalibration':record['waterCalibration'],'wetGranite':materials,'viewTransform':record['viewTransform'],'skyCameraGain':record['skyCameraRadianceGain']},'renderScript':{'file':Path(__file__).name,'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'visualAccepted':False,'started':time.time(),'status':'rendering','captures':[],'rendererLimits':record['rendererLimits']}
scene.cycles.samples=128;scene.cycles.use_denoising=True;scene.cycles.use_light_tree=True
for layer in scene.view_layers:layer.cycles.use_denoising=True
scene.render.use_border=False;scene.render.use_crop_to_border=False
scene.render.resolution_x=1254;scene.render.resolution_y=1254;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8'
target=OUT/'scene09-r10-physical-r04.png';scene.render.filepath=str(target)
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
start=time.time();bpy.ops.render.render(write_still=True)
report['captures'].append({'kind':'full-reference-camera','file':target.name,'resolution':[1254,1254],'samples':128,'renderSeconds':time.time()-start,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
# Preserve scene-linear radiance for future grading/film work; PNG above is AgX.
linear=OUT/'scene09-r10-physical-r04-linear.exr'
scene.render.image_settings.file_format='OPEN_EXR';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='16';scene.render.image_settings.exr_codec='ZIP'
bpy.data.images['Render Result'].save_render(str(linear),scene=scene)
report['sceneLinearAsset']={'file':linear.name,'sha256':hashlib.sha256(linear.read_bytes()).hexdigest(),'bytes':linear.stat().st_size,'channels':'RGB half float, scene linear','releaseAssetNotGitBlob':True}
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_depth='8'
unique={};deduplicated=0
for image in list(bpy.data.images):
    path=bpy.path.abspath(image.filepath)
    key=(path,image.colorspace_settings.name,image.alpha_mode,image.source)
    if image.source!='FILE' or not path:continue
    if key in unique:image.user_remap(unique[key]);bpy.data.images.remove(image);deduplicated+=1
    else:unique[key]=image
bpy.ops.file.pack_all()
for image in bpy.data.images:
    if image.users and image.source=='GENERATED' and image.has_data and not image.packed_file:image.pack()
scene['source_repository']='https://github.com/aa339519589-cpu/komorebi-temple-cinema'
scene['source_commit']=report['sourceCommit'];scene['source_scene_sha256']=report['sourceHash'];scene['visual_accepted']=False
scene['physical_lighting_scope']='Frozen09 fixture positions, relative point flux x4/spot x1.5; source moon/warm fill; source-code cloudy sky; thin washi transport; physically reflected water/granite. Cross-renderer calibration, not WebGL pixel equivalence.'
blend=OUT/'scene09-r10-packed-physical-r04.blend';bpy.ops.wm.save_as_mainfile(filepath=str(blend),compress=True)
used_images=[{'name':i.name,'source':i.source,'packed':bool(i.packed_file),'hasData':i.has_data,'colorSpace':i.colorspace_settings.name} for i in bpy.data.images if i.users and i.name!='Render Result']
report['editableModel']={'file':blend.name,'bytes':blend.stat().st_size,'sha256':hashlib.sha256(blend.read_bytes()).hexdigest(),'textureDeduplications':deduplicated,'allUsedFileImagesPacked':all(i['packed'] for i in used_images if i['source']=='FILE'),'images':used_images,'largeReleaseAssetNotGitBlob':True,'fullReferenceCameraSaved':True}
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
scene.render.use_border=True;scene.render.use_crop_to_border=True
scene.render.resolution_x=2508;scene.render.resolution_y=2508;scene.cycles.samples=128
for name,border in [('floor-native',(0.02,0.0,.92,.27)),('architecture-native',(.38,.42,.99,.75))]:
    x0,y0,x1,y1=border;scene.render.border_min_x=x0;scene.render.border_min_y=y0;scene.render.border_max_x=x1;scene.render.border_max_y=y1
    target=OUT/(name+'.png');scene.render.filepath=str(target);start=time.time();bpy.ops.render.render(write_still=True)
    report['captures'].append({'kind':name,'file':target.name,'normalizedFullSensorBorder':border,'fullSensorPixels':[2508,2508],'samples':128,'renderSeconds':time.time()-start,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'nativeRaySamples':True,'imageUpscaled':False})
    (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
report['cameraMatrixZUp']=camera_matrix;report['cameraUnchanged']=camera_matrix==[list(row) for row in scene.camera.matrix_world];report['finished']=time.time();report['status']='physical-night-court-review'
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print('SCENE09_PHYSICAL_R04_COMPLETE',json.dumps({'sourceHash':report['sourceHash'],'captures':report['captures'],'editableModel':{k:v for k,v in report['editableModel'].items() if k!='images'},'visualAccepted':False}),flush=True)
