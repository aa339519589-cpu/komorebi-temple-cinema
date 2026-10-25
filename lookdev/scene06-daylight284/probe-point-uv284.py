"""Tiny real Metal lookup-equivalence test; never a candidate scene frame."""
import bpy, json, math, shutil
from pathlib import Path
import numpy as np
from mathutils import Vector

HERE=Path(__file__).resolve().parent
out=HERE/'point-uv-probe284'
if out.exists(): raise RuntimeError('Keep previous probe evidence')
if shutil.disk_usage(HERE).free < 2*1024**3: raise RuntimeError('Retain2GiB disk floor')
out.mkdir()
bpy.ops.wm.read_factory_settings(use_empty=True)
s=bpy.context.scene;s.render.engine='CYCLES';s.render.threads_mode='FIXED';s.render.threads=4
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
s.cycles.device='GPU';s.cycles.samples=32;s.cycles.use_denoising=False;s.cycles.use_adaptive_sampling=False
s.render.resolution_x=96;s.render.resolution_y=40;s.render.resolution_percentage=100
s.render.image_settings.file_format='OPEN_EXR';s.render.image_settings.color_depth='32';s.render.image_settings.color_mode='RGBA'
s.view_settings.view_transform='Raw';s.view_settings.look='None';s.view_settings.exposure=0;s.view_settings.gamma=1
me=bpy.data.meshes.new('same original triangles');me.from_pydata([[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],[],[[0,1,2],[0,2,3]])
uv=np.asarray([[0,0],[1,0],[1,1],[0,1]],np.float32)
ob=bpy.data.objects.new('hidden original prototype',me);s.collection.objects.link(ob);ob.hide_render=True
mat=bpy.data.materials.new('identical attribute shader');mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();l=mat.node_tree.links
attr=n.new('ShaderNodeAttribute');attr.attribute_type='GEOMETRY';attr.attribute_name='sourceUV'
em=n.new('ShaderNodeEmission');em.inputs['Strength'].default_value=1;dest=n.new('ShaderNodeOutputMaterial')
l.new(attr.outputs['Vector'],em.inputs['Color']);l.new(em.outputs[0],dest.inputs['Surface']);me.materials.append(mat)
# Match the full importer: hidden prototype -> ObjectInfo AsInstance ->
# InstanceOnPoints -> rendered object. Test geometry lookup through GN too.
pm=bpy.data.meshes.new('one point');pm.from_pydata([[0,0,0]],[],[]);po=bpy.data.objects.new('same GN rendered instance',pm);s.collection.objects.link(po)
tree=bpy.data.node_groups.new('same complete prototype path','GeometryNodeTree');tree.interface.new_socket(name='Geometry',in_out='INPUT',socket_type='NodeSocketGeometry');tree.interface.new_socket(name='Geometry',in_out='OUTPUT',socket_type='NodeSocketGeometry')
gin=tree.nodes.new('NodeGroupInput');gout=tree.nodes.new('NodeGroupOutput');obj=tree.nodes.new('GeometryNodeObjectInfo');obj.transform_space='ORIGINAL';obj.inputs['Object'].default_value=ob;obj.inputs['As Instance'].default_value=True
inst=tree.nodes.new('GeometryNodeInstanceOnPoints');tree.links.new(gin.outputs['Geometry'],inst.inputs['Points']);tree.links.new(obj.outputs['Geometry'],inst.inputs['Instance']);tree.links.new(inst.outputs['Instances'],gout.inputs['Geometry'])
mod=po.modifiers.new('actual importer GN path','NODES');mod.node_group=tree
cam_data=bpy.data.cameras.new('lookup camera');cam=bpy.data.objects.new('lookup camera',cam_data);s.collection.objects.link(cam);s.camera=cam
cam.location=(0,0,3);cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam_data.type='ORTHO';cam_data.ortho_scale=2.4
frames=[]
for mode in ['POINT','CORNER']:
    if 'sourceUV' in me.attributes:me.attributes.remove(me.attributes['sourceUV'])
    if mode=='POINT':
        a=me.attributes.new(name='sourceUV',type='FLOAT_VECTOR',domain='POINT');p=np.zeros((4,3),np.float32);p[:,:2]=uv;a.data.foreach_set('vector',p.ravel())
    else:
        a=me.uv_layers.new(name='sourceUV');a.data.foreach_set('uv',uv[[0,1,2,0,2,3]].ravel())
    me.update();bpy.context.view_layer.update();s.cycles.seed=284
    s.render.filepath=str(out/(mode.lower()+'.exr'));bpy.ops.render.render(write_still=True)
    im=bpy.data.images.load(s.render.filepath,check_existing=False);im.colorspace_settings.name='Non-Color'
    pixels=np.empty(96*40*4,np.float32);im.pixels.foreach_get(pixels);frames.append(pixels.reshape(40,96,4).copy())
a=frames[0][4:36,32:64,:3];b=frames[1][4:36,32:64,:3]
residual=float(np.max(np.abs(a-b)));mean=float(a.mean());passed=residual<5e-5 and mean>.1
report={'status':'actual-Metal-point-and-corner-UV-equivalence-pass' if passed else 'FAILED','maximumRGBResidual':residual,'pointPatchMean':mean,'tolerance':5e-5,'resolution':[96,40],'samples':32,'frames':2,'device':s.cycles.device,'blender':bpy.app.version_string,'scope':'Emission of the same named GEOMETRY Attribute Vector from real POINT float3 versus real UV CORNER float2, through the same hidden-prototype/GN-instance path. Identical pixel locations/camera/seed avoid comparing different jitter samples. Lookup calibration only; not a scene06 candidate or replacement frame.'}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if not passed: raise RuntimeError(str(report))
print('POINT_UV284_PROBE '+json.dumps(report),flush=True)
