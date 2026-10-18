"""One light-only revision of the exact mesh70 physical Cycles scene.

Load the packed, source-verified cycles71 scene. No source mesh, base PBR
channel, UV, instance placement or camera is reconstructed or transformed.
"""
import bpy,json,hashlib,time,math
from pathlib import Path

HERE=Path(__file__).resolve().parent
PRIOR=HERE.parent/'cycles-71'
OUT=HERE/'render';OUT.mkdir(parents=True,exist_ok=True)
report=json.loads((PRIOR/'render/report.json').read_text())
if report['nativeSourceHash']!='5f09b47e0314ef352e01552371a19e722e8740859060e7840fe8054a093c0ae4' or not report['geometryTriangleCountPreserved']:
    raise RuntimeError('The exact source-verified mesh70 scene is required')
bpy.ops.wm.open_mainfile(filepath=str(PRIOR/'render/scene09-cycles71.blend'))
scene=bpy.context.scene
before={'objects':len(scene.objects),'meshFaces':sum(len(o.data.polygons) for o in scene.objects if o.type=='MESH'),'cameraMatrix':[list(r) for r in scene.camera.matrix_world]}
changed_paper=[]
for material in bpy.data.materials:
    if not material.use_nodes or 'paper' not in material.name.lower():continue
    for node in material.node_tree.nodes:
        if node.bl_idname=='ShaderNodeBlackbody':node.inputs['Temperature'].default_value=2450
        if node.bl_idname=='ShaderNodeEmission':
            node.inputs['Strength'].default_value*=8/12
            changed_paper.append({'material':material.name,'radianceStrength':node.inputs['Strength'].default_value})
for obj in scene.objects:
    if obj.type=='LIGHT' and obj.data.type=='SUN':obj.data.energy*=.20/.08
for node in scene.world.node_tree.nodes:
    if node.bl_idname=='ShaderNodeValToRGB' and abs(node.color_ramp.elements[0].position)<1e-5:
        node.color_ramp.elements[0].color=(.014,.035,.100,1)
        node.color_ramp.elements[1].color=(.008,.023,.072,1)
    if node.bl_idname=='ShaderNodeMixRGB':node.inputs[2].default_value=(.006,.017,.050,1)
scene.render.engine='CYCLES';scene.cycles.device='GPU';scene.cycles.samples=48;scene.cycles.seed=907071;scene.cycles.use_animated_seed=False
preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
for device in preferences.devices:device.use=device.type=='METAL'
if not any(device.use for device in preferences.devices):raise RuntimeError('Metal GPU is required')
scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE'
for layer in scene.view_layers:layer.cycles.use_denoising=True
scene.render.resolution_x=scene.render.resolution_y=1254;scene.render.resolution_percentage=100
scene.render.filepath=str(OUT/'scene09-cycles72.png')
after={'objects':len(scene.objects),'meshFaces':sum(len(o.data.polygons) for o in scene.objects if o.type=='MESH'),'cameraMatrix':[list(r) for r in scene.camera.matrix_world]}
if before!=after:raise RuntimeError('Light-only revision changed geometry or camera')
report.update({'status':'rendering','started':time.time(),'finished':None,'priorPhysicalCandidate':'cycles-71','relightScript':{'file':Path(__file__).name,'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'lightOnlyRevision':{'meshCountsAndCameraUnchanged':True,'counts':after,'paperGain':8,'paperBlackbodyKelvin':2450,'paperMaterials':changed_paper,'sourceDirectionalGain':.20,'nightGradientLinearColors':[[.014,.035,.100],[.008,.023,.072]],'cloudLinearColor':[.006,.017,.050],'worldStrength':.70,'exposure':.5,'sourceBasePBRChanged':False},'fixedSeed':907071,'samples':48,'cyclesDevice':'GPU','denoisingEnabled':True,'photographicAcceptance':False})
report['lightCalibration']['sunGain']=.20
report['paperMaterialInterpretation']['temperatureKelvin']=2450
report['paperMaterialInterpretation']['radianceGainOverNativeEmission']=8
(OUT/'report.json').write_text(json.dumps(report,indent=2))
(OUT/'render-source.py').write_text(Path(__file__).read_text())
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'scene09-cycles72.blend'),compress=True)
bpy.ops.render.render(write_still=True)
report.update({'status':'path-traced-review','finished':time.time(),'resolution':[1254,1254]})
(OUT/'report.json').write_text(json.dumps(report,indent=2))
print('SCENE09_LIGHT_ONLY_CYCLES_REVIEW_COMPLETE',json.dumps({'status':report['status'],'resolution':report['resolution'],'samples':48,'seed':907071,'geometryCameraUnchanged':before==after}),flush=True)
