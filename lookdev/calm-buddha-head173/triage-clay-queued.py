"""Actual untextured source mesh studio views. Execute ONLY with run-blender-queued.mjs."""
import bpy,math,json,hashlib,os
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent
UID=os.environ.get('HEAD173_UID','fb17c123ad9c4c0fb6baf723b3fffd79')
SOURCE=ROOT/'sources'/UID/'source-original.glb'
OUT=ROOT/'evidence'/('triage-'+UID);OUT.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();head=bpy.context.object
world=head.matrix_world.copy();head.parent=None;head.matrix_parent_inverse=Matrix.Identity(4);head.matrix_world=Matrix.Identity(4);head.data.transform(world)
minimum=Vector([min(v.co[k]for v in head.data.vertices)for k in range(3)]);maximum=Vector([max(v.co[k]for v in head.data.vertices)for k in range(3)]);center=(minimum+maximum)/2
scale=2/(maximum.z-minimum.z)
head.data.transform(Matrix.Scale(scale,4)@Matrix.Translation(-center))
head.name='actual_scan_neutral_clay'
material=bpy.data.materials.new('Neutral clay no textures');material.use_nodes=True
bs=material.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.39,.39,.39,1);bs.inputs['Roughness'].default_value=.76;bs.inputs['Metallic'].default_value=0
head.data.materials.clear();head.data.materials.append(material)
for face in head.data.polygons:face.material_index=0;face.use_smooth=True
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.cycles.device='GPU'
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for device in prefs.devices:device.use=device.type=='METAL'
world=bpy.data.worlds.new('Neutral studio');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.14,.14,.14,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.4
camera_data=bpy.data.cameras.new('Orthographic source camera');camera=bpy.data.objects.new('Orthographic source camera',camera_data);scene.collection.objects.link(camera);scene.camera=camera;camera_data.type='ORTHO';camera_data.ortho_scale=2.3
lights=[]
for name,power,size in [('Key',650,3),('Fill',180,3),('Rim',350,2)]:
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);lights.append(obj)
scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
report={'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'untextured':True,'vertices':len(head.data.vertices),'triangles':sum(len(f.vertices)-2 for f in head.data.polygons),'rawBounds':[list(minimum),list(maximum)],'geometryChanges':'Rigid recenter and uniform scale only; source topology and normals retained. All texture materials removed.','views':[],'visualAccepted':False}
for angle in [0,90,180,270]:
 a=math.radians(angle);rotation=Matrix.Rotation(a,4,'Z');camera.location=rotation@Vector((0,-5,.04));camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler()
 for obj,loc in zip(lights,[(-3,-4,4),(3,-4,.5),(2,3,2)]):
  obj.location=rotation@Vector(loc);obj.rotation_euler=(-obj.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(OUT/('angle-%03d.png'%angle));bpy.ops.render.render(write_still=True);report['views'].append(scene.render.filepath)
(OUT/'report.json').write_text(json.dumps(report,indent=2));print('HEAD173_SOURCE_TRIAGE',json.dumps(report),flush=True)
