"""One actual1254 path trace of the solved global exposure and four RGB gains."""
import bpy,json,hashlib,time
from pathlib import Path

HERE=Path('lookdev/scene04-reference-calibration').resolve();OUT=HERE/'results';BASE=Path('lookdev/scene04-nishita-coupled/results/scene04-nishita-coupled.blend').resolve()
fit=json.loads((OUT/'fit.json').read_text());classes=json.loads((HERE/'material-classes.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(BASE));s=bpy.context.scene
def classify(name):return next((k for k,r in classes.items() if name in r['names'] or any(name.startswith(x) for x in r['startsWith'])),None)
def serial(v):
    try:return list(v)
    except TypeError:return v
def graph(tree,category=None):
    nodes=[]
    for n in tree.nodes:
        if n.label=='Solved constant class baseColor gain':continue
        entry={'name':n.name,'type':n.bl_idname,'operation':getattr(n,'operation',None),'image':getattr(getattr(n,'image',None),'name',None),'extension':getattr(n,'extension',None),'inputs':[(i.identifier,serial(i.default_value) if hasattr(i,'default_value') else None) for i in n.inputs if not(category and n.bl_idname=='ShaderNodeBsdfPrincipled' and i.name=='Base Color')]}
        for name in ['sky_type','sun_disc','sun_intensity','sun_size','sun_elevation','sun_rotation','altitude','air_density','aerosol_density','dust_density','ozone_density']:
            if hasattr(n,name):entry[name]=getattr(n,name)
        nodes.append(entry)
    links=[(l.from_node.name,l.from_socket.identifier,l.to_node.name,l.to_socket.identifier) for l in tree.links if l.from_node.label!='Solved constant class baseColor gain' and l.to_node.label!='Solved constant class baseColor gain' and not(category and l.to_node.bl_idname=='ShaderNodeBsdfPrincipled' and l.to_socket.name=='Base Color')]
    return {'nodes':nodes,'links':links}
def protected_state():
    return {'objects':[(o.name,o.type,[v for row in o.matrix_world for v in row],len(o.data.vertices) if o.type=='MESH' else None,len(o.data.polygons) if o.type=='MESH' else None) for o in s.objects],'camera':{'matrix':[v for row in s.camera.matrix_world for v in row],'lens':s.camera.data.lens,'sensorHeight':s.camera.data.sensor_height},'world':graph(s.world.node_tree),'lights':[(o.name,o.data.type,o.data.energy,list(o.data.color),o.data.angle if o.data.type=='SUN' else None) for o in s.objects if o.type=='LIGHT'],'materials':[(m.name,graph(m.node_tree,classify(m.name))) for m in bpy.data.materials if m.use_nodes],'render':{'size':[s.render.resolution_x,s.render.resolution_y],'samples':s.cycles.samples,'seed':s.cycles.seed,'view':s.view_settings.view_transform,'look':s.view_settings.look,'gamma':s.view_settings.gamma}}
before=protected_state();fingerprint=hashlib.sha256(json.dumps(before,sort_keys=True).encode()).hexdigest();changes=[]
assert sum(len(o.data.polygons) for o in s.objects if o.type=='MESH')==23669477
assert s.view_settings.exposure==0 and s.render.resolution_x==s.render.resolution_y==1254
for m in bpy.data.materials:
    category=classify(m.name)
    if not category:continue
    bs=next(n for n in m.node_tree.nodes if n.bl_idname=='ShaderNodeBsdfPrincipled');socket=bs.inputs['Base Color'];gain=fit['classGains'][category]
    old=list(socket.default_value);source=None
    if socket.is_linked:
        link=socket.links[0];source=link.from_socket;source_description=[link.from_node.name,source.name];m.node_tree.links.remove(link)
        node=m.node_tree.nodes.new('ShaderNodeVectorMath');node.operation='MULTIPLY';node.label='Solved constant class baseColor gain';node.inputs[1].default_value=gain;m.node_tree.links.new(source,node.inputs[0]);m.node_tree.links.new(node.outputs[0],socket)
    else:
        source_description='Original constant';socket.default_value=tuple(old[i]*gain[i] for i in range(3))+(old[3],)
    changes.append({'material':m.name,'category':category,'gainRGB':gain,'previousBaseDefault':old,'originalBaseInput':source_description})
s.view_settings.exposure=fit['exposureEV']
assert before==protected_state()
preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
for device in preferences.devices:device.use=device.type=='METAL'
if not any(device.use for device in preferences.devices):raise RuntimeError('Metal unavailable')
s.cycles.device='GPU';s.render.filepath=str(OUT/'scene04-reference-calibrated.png')
report={'status':'rendering','sourceHash':fit['sourceHash'],'baseBlend':str(BASE),'globalExposureEV':[0,s.view_settings.exposure],'classGains':fit['classGains'],'materialChanges':changes,'protectedStateSHA256':fingerprint,'protectedStatePreserved':True,'sourceTriangles':23669477,'onlyAppearanceChanges':'One global view exposure and four constant RGB multipliers on existing PBR baseColor inputs.','referenceImageOrSpatialGainImported':False,'roughnessMetalnessIORNormalClearcoatLightWorldCameraGeometryChanged':False,'size':[1254,1254],'samples':s.cycles.samples,'seed':s.cycles.seed,'fitLimit':'Boundary solution is a diagnostic artistic fit, not measured albedo. The actual path trace validates the one-pass GI/metal response approximation.','started':time.time(),'photographicAcceptance':False}
(OUT/'render-report.json').write_text(json.dumps(report,indent=2)+'\n');bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'scene04-reference-calibrated.blend'),compress=True)
bpy.ops.render.render(write_still=True)
assert before==protected_state()
report.update(status='actual-one-shot-calibration-review',finished=time.time());(OUT/'render-report.json').write_text(json.dumps(report,indent=2)+'\n');print('FITTED_FULL_COMPLETE',json.dumps({'exposure':s.view_settings.exposure,'materialCount':len(changes),'protected':True}),flush=True)
