"""One unchanged-beauty Cycles frame with material/transport evidence.

Only AOV outputs and render-component outputs are added. No source BSDF,
texture, UV, geometry, light or exposure is repainted or adjusted.
"""
import bpy,json,hashlib,time,math
import numpy as np
from pathlib import Path

HERE=Path(__file__).resolve().parent;OUT=HERE/'render';OUT.mkdir(parents=True,exist_ok=True)
prior=HERE.parent/'cycles-72/render'
source=json.loads((HERE/'source-bridge-audit.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(prior/'scene09-cycles72.blend'))
scene=bpy.context.scene;layer=bpy.context.view_layer
snapshot=lambda:{'objects':len(scene.objects),'faces':sum(len(o.data.polygons) for o in scene.objects if o.type=='MESH'),'camera':[list(r) for r in scene.camera.matrix_world],'exposure':scene.view_settings.exposure,'lights':[(o.name,o.data.energy) for o in scene.objects if o.type=='LIGHT']}
before=snapshot()
for name,kind in [('SourceRedBaseColor','COLOR'),('SourceRedRoughness','VALUE')]:
    aov=layer.aovs.add();aov.name=name;aov.type=kind
for rec in source['redMaterials']:
    mat=bpy.data.materials[rec['id']];nodes=mat.node_tree.nodes;links=mat.node_tree.links;bs=next(n for n in nodes if n.bl_idname=='ShaderNodeBsdfPrincipled')
    for label,input_name,socket_name in [('SourceRedBaseColor','Base Color','Color'),('SourceRedRoughness','Roughness','Value')]:
        n=nodes.new('ShaderNodeOutputAOV');n.aov_name=label
        inp=bs.inputs[input_name]
        if inp.is_linked:links.new(inp.links[0].from_socket,n.inputs[socket_name])
        else:n.inputs[socket_name].default_value=inp.default_value
for prop in ['use_pass_diffuse_direct','use_pass_diffuse_indirect','use_pass_diffuse_color','use_pass_glossy_direct','use_pass_glossy_indirect','use_pass_glossy_color']:
    setattr(layer,prop,True)
layer.update()
tree=bpy.data.node_groups.new('source73-render-component-evidence','CompositorNodeTree');scene.compositing_node_group=tree
tree.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor')
nodes=tree.nodes;links=tree.links;r=nodes.new('CompositorNodeRLayers');r.scene=scene;r.layer=layer.name
groupout=nodes.new('NodeGroupOutput');links.new(r.outputs['Image'],groupout.inputs['Image'])
def output(name,socket,raw=True):
    n=nodes.new('CompositorNodeOutputFile');n.directory=str(OUT/('components' if raw else 'previews')/name);n.file_name=name+'_';n.file_output_items.new('RGBA','Image');n.save_as_render=not raw
    n.format.media_type='IMAGE';n.format.file_format='OPEN_EXR' if raw else 'PNG';n.format.color_mode='RGBA' if raw else 'RGB';n.format.color_depth='32' if raw else '16'
    if raw:n.format.exr_codec='ZIP';n.format.linear_colorspace_settings.name='Linear Rec.709'
    else:n.format.color_management='OVERRIDE';n.format.view_settings.view_transform='Standard';n.format.view_settings.look='None';n.format.view_settings.exposure=0;n.format.view_settings.gamma=1
    links.new(socket,n.inputs['Image'])
def socket(*names):
    return next(r.outputs[n] for n in names if n in r.outputs)
passes={'CombinedLinear':r.outputs['Image'],'SourceRedBaseColor':r.outputs['SourceRedBaseColor'],'SourceRedRoughness':r.outputs['SourceRedRoughness'],'DiffuseDirect':socket('Diffuse Direct'),'DiffuseIndirect':socket('Diffuse Indirect'),'DiffuseColor':socket('Diffuse Color'),'GlossyDirect':socket('Glossy Direct','Specular Direct'),'GlossyIndirect':socket('Glossy Indirect','Specular Indirect'),'GlossyColor':socket('Glossy Color','Specular Color')}
for name,s in passes.items():output(name,s,True)
for name in ['SourceRedBaseColor','DiffuseColor','GlossyDirect','GlossyIndirect']:output(name,passes[name],False)

preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
for device in preferences.devices:device.use=device.type=='METAL'
if not any(d.use for d in preferences.devices):raise RuntimeError('Metal GPU required')
scene.render.engine='CYCLES';scene.cycles.device='GPU';scene.cycles.samples=48;scene.cycles.seed=907071;scene.cycles.use_animated_seed=False
scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';layer.cycles.use_denoising=True
scene.render.resolution_x=scene.render.resolution_y=1254;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'scene09-cycles73.png')
if snapshot()!=before:raise RuntimeError('Evidence outputs changed scene geometry/camera/light/exposure')
report={'status':'rendering','started':time.time(),'nativeSourceHash':source['sourceHash'],'script':{'file':Path(__file__).name,'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'beautyChanges':False,'preserved':before,'basePBRChanged':False,'classificationChanged':False,'samples':48,'seed':907071,'device':'METAL','denoiser':'OPENIMAGEDENOISE','componentFormula':'Diffuse=(DiffDir+DiffInd)*DiffCol; Glossy=(GlossDir+GlossInd)*GlossCol. SourceRedBaseColor is the original BSDF Base Color socket through a non-invasive AOV.','photographicAcceptance':False}
(OUT/'report.json').write_text(json.dumps(report,indent=2));(OUT/'render-source.py').write_text(Path(__file__).read_text())
bpy.ops.render.render(write_still=True)
arrays={}
for name in passes:
    path=next((OUT/'components'/name).glob('*.exr'));image=bpy.data.images.load(str(path),check_existing=False);values=np.empty(image.size[0]*image.size[1]*4,dtype=np.float32);image.pixels.foreach_get(values);arrays[name]=values.reshape(image.size[1],image.size[0],4)
    report.setdefault('rawComponents',{})[name]={'file':str(path.relative_to(HERE)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'size':list(image.size)}
pixel_records=[]
arrays['DiffuseContribution']=(arrays['DiffuseDirect']+arrays['DiffuseIndirect'])*arrays['DiffuseColor']
arrays['GlossyContribution']=(arrays['GlossyDirect']+arrays['GlossyIndirect'])*arrays['GlossyColor']
audit=json.loads((HERE/'saved-transfer-audit.json').read_text())
for hit in audit['cameraRayBridgeSamples']:
    if not hit['materialMatchesSourceRed']:continue
    x,y=hit['pixel'];yy=1253-y;row={'pixel':[x,y],'object':hit['object']}
    for name,a in arrays.items():row[name]=a[max(0,yy-1):yy+2,max(0,x-1):x+2,:3].mean(axis=(0,1)).tolist()
    w=np.array([.2126,.7152,.0722]);d=float(np.dot(row['DiffuseContribution'],w));g=float(np.dot(row['GlossyContribution'],w));row['glossyFractionOfDiffusePlusGlossyLuminance']=g/max(1e-10,d+g);pixel_records.append(row)
report.update({'status':'path-traced-component-evidence','finished':time.time(),'resolution':[1254,1254],'bridgePixelEvidence':pixel_records,'beautySha256':hashlib.sha256((OUT/'scene09-cycles73.png').read_bytes()).hexdigest()})
(OUT/'report.json').write_text(json.dumps(report,indent=2))
print('SCENE09_COMPONENT_EVIDENCE_COMPLETE',json.dumps({'status':report['status'],'bridgePixels':pixel_records}),flush=True)
