"""One declared World1 -> .2 ratio comparison; all other state preserved."""
import bpy,json,hashlib,math,time
from pathlib import Path
from mathutils import Vector

BASE=Path('lookdev/scene04-physical/results/physical01').resolve()
OUT=Path('lookdev/scene04-physical/results/physical02').resolve();OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(BASE/'scene04-physical01.blend'))
s=bpy.context.scene

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
    return {'camera':[v for row in s.camera.matrix_world for v in row],'lens':s.camera.data.lens,'sensorHeight':s.camera.data.sensor_height,'objects':[(o.name,o.type,[v for row in o.matrix_world for v in row],len(o.data.vertices) if o.type=='MESH' else None,len(o.data.polygons) if o.type=='MESH' else None) for o in s.objects],'materials':materials,'lights':[(o.name,o.data.type,o.data.energy,list(o.data.color),o.data.angle if o.data.type=='SUN' else None) for o in s.objects if o.type=='LIGHT'],'render':{'size':[s.render.resolution_x,s.render.resolution_y],'samples':s.cycles.samples,'seed':s.cycles.seed,'exposure':s.view_settings.exposure,'viewTransform':s.view_settings.view_transform}}

before=state();fingerprint=hashlib.sha256(json.dumps(before,sort_keys=True).encode()).hexdigest()
background=next(n for n in s.world.node_tree.nodes if n.bl_idname=='ShaderNodeBackground')
old=background.inputs['Strength'].default_value
if abs(old-1)>1e-6:raise ValueError('Unexpected parent world gain')
background.inputs['Strength'].default_value=.2
preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
for device in preferences.devices:device.use=device.type=='METAL'
if not any(device.use for device in preferences.devices):raise RuntimeError('Metal unavailable')
s.cycles.device='GPU';s.render.filepath=str(OUT/'scene04-physical02.png')
after=state();assert before==after
sun=next(o for o in s.objects if o.type=='LIGHT' and o.data.type=='SUN')
report={'status':'rendering','parentBlend':str(BASE/'scene04-physical01.blend'),'sourceHash':'d1f02ccbe5cd1489e5211d8a831508aa592908cbe24733f3dee8bc74f37ce2a8','onlyLookChange':{'worldStrength':[old,float(background.inputs['Strength'].default_value)]},'hypothesis':'Artistic daylight-to-sky ratio comparison: measured-sky horizontal RGB about[2.96,3.29,3.87] was comparable to source SUN horizontalR4.24. Reduce only sky fill; not measured reference illuminance.','preservedStateSHA256':fingerprint,'cameraGeometryMaterialLightsRenderStatePreserved':True,'sourceTriangles':sum(len(o.data.polygons) for o in s.objects if o.type=='MESH'),'sunStrength':sun.data.energy,'sunAngularDiameterRadians':sun.data.angle,'sunDirection':list((sun.matrix_world.to_3x3()@Vector((0,0,-1))).normalized()),'exposureEV':s.view_settings.exposure,'samples':s.cycles.samples,'seed':s.cycles.seed,'size':[s.render.resolution_x,s.render.resolution_y],'started':time.time(),'photographicAcceptance':False}
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'scene04-physical02.blend'),compress=True)
bpy.ops.render.render(write_still=True)
assert before==state()
report.update(status='path-traced-ratio-comparison',finished=time.time());(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print('WORLD_RATIO02_COMPLETE',json.dumps(report),flush=True)
