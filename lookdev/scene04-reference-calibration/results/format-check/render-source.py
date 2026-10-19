"""One512 scene-linear calibration pass; no material appearance changes."""
import bpy,json,time,hashlib
from pathlib import Path

HERE=Path('lookdev/scene04-reference-calibration').resolve();OUT=Path('output/scene04-reference-calibration').resolve();OUT.mkdir(parents=True,exist_ok=True)
BASE=Path('lookdev/scene04-nishita-coupled/results/scene04-nishita-coupled.blend').resolve()
classes=json.loads((HERE/'material-classes.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(BASE));s=bpy.context.scene
before_camera=[v for row in s.camera.matrix_world for v in row];triangles=sum(len(o.data.polygons) for o in s.objects if o.type=='MESH');assert triangles==23669477
def classify(name):
    return next((key for key,r in classes.items() if name in r['names'] or any(name.startswith(p) for p in r['startsWith'])),None)
materials=[]
for index,m in enumerate(sorted(bpy.data.materials,key=lambda m:m.name),1):
    m.pass_index=index;category=classify(m.name);nodes=m.node_tree.nodes;links=m.node_tree.links
    bs=next((n for n in nodes if n.bl_idname=='ShaderNodeBsdfPrincipled'),None)
    record={'index':index,'name':m.name,'category':category,'baseColorDefault':list(bs.inputs['Base Color'].default_value) if bs else None,'metalness':bs.inputs['Metallic'].default_value if bs else 0,'roughness':bs.inputs['Roughness'].default_value if bs else None}
    materials.append(record)
    if category=='paving':
        aov=nodes.new('ShaderNodeOutputAOV');aov.name='wet_coverage';aov.label='Analysis only: original film coverage'
        coat=bs.inputs['Coat Weight']
        if coat.is_linked:links.new(coat.links[0].from_socket,aov.inputs['Value'])
        else:aov.inputs['Value'].default_value=coat.default_value
layer=s.view_layers[0];layer.use_pass_diffuse_color=True;layer.use_pass_diffuse_direct=True;layer.use_pass_diffuse_indirect=True;layer.use_pass_material_index=True
aov=layer.aovs.add();aov.name='wet_coverage';aov.type='VALUE'
preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
for device in preferences.devices:device.use=device.type=='METAL'
if not any(device.use for device in preferences.devices):raise RuntimeError('Metal unavailable')
s.cycles.device='GPU';s.cycles.samples=64;s.cycles.seed=904101;s.cycles.use_animated_seed=False;s.cycles.use_denoising=False
s.render.resolution_x=s.render.resolution_y=512;s.render.resolution_percentage=100;s.render.use_border=False
s.render.image_settings.file_format='OPEN_EXR_MULTILAYER';s.render.image_settings.color_depth='32';s.render.image_settings.exr_codec='ZIP';s.render.filepath=str(OUT/'calibration-pass512.exr')
metadata={'status':'rendering-statistics-only','baseBlend':str(BASE),'sourceHash':'d1f02ccbe5cd1489e5211d8a831508aa592908cbe24733f3dee8bc74f37ce2a8','triangles':triangles,'camera':before_camera,'size':[512,512],'samples':64,'seed':s.cycles.seed,'sceneLinear':True,'display':{'device':s.display_settings.display_device,'view':s.view_settings.view_transform,'look':s.view_settings.look,'exposureEV':s.view_settings.exposure,'gamma':s.view_settings.gamma,'ocioConfig':'/Applications/Blender.app/Contents/Resources/5.2/datafiles/colormanagement/config.ocio'},'passes':['Combined','DiffuseColor','DiffuseDirect','DiffuseIndirect','IndexMA','wet_coverage'],'materials':materials,'appearanceChanged':False,'analysisOnlyMaterialIndicesAndAOV':True,'started':time.time()}
(OUT/'pass-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
bpy.ops.render.render(write_still=True)
assert before_camera==[v for row in s.camera.matrix_world for v in row]
metadata.update(status='actual-statistics-pass',finished=time.time());(OUT/'pass-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n');print('STATISTICS_PASS_COMPLETE',flush=True)
