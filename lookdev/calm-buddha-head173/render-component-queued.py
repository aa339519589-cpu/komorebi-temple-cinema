"""Review the actual crown/neck-clipped CC BY scan; official FIFO only."""
import bpy,math,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent;COMP=ROOT/'component-r01';OUT=ROOT/'evidence/component-r01';OUT.mkdir(exist_ok=True)
manifest=json.loads((COMP/'manifest.json').read_text());source=COMP/manifest['files']['glb']['file']
assert hashlib.sha256(source.read_bytes()).hexdigest()==manifest['files']['glb']['sha256']
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(source))
head=next(o for o in bpy.context.scene.objects if o.type=='MESH');head.name='Actual_CC_BY_source_face_ears_neck_r01'
material=bpy.data.materials.new('Untextured medium neutral clay');material.use_nodes=True;p=material.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.28,.28,.28,1);p.inputs['Metallic'].default_value=0;p.inputs['Roughness'].default_value=.76
head.data.materials.clear();head.data.materials.append(material)
for face in head.data.polygons:face.material_index=0
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.cycles.device='GPU';prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for device in prefs.devices:device.use=device.type=='METAL'
world=bpy.data.worlds.new('Neutral gray studio');world.use_nodes=True;scene.world=world;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.12,.12,.12,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.4
center=Vector((0,0,.50));lights=[]
for name,location,power,size in [('Soft key',(-2.4,-3,3.3),240,2.4),('Face fill',(2.5,-3,1.5),75,2.8),('Rim',(2,2,2),140,2)]:
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=location;obj.rotation_euler=(center-obj.location).to_track_quat('-Z','Y').to_euler();lights.append(obj)
camera_data=bpy.data.cameras.new('Orthographic anatomy review');camera=bpy.data.objects.new('Orthographic anatomy review',camera_data);scene.collection.objects.link(camera);scene.camera=camera;camera_data.type='ORTHO';camera_data.ortho_scale=1.43
scene.render.resolution_x=896;scene.render.resolution_y=896;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
views=[]
for label,deg in [('front-clay',0),('three-quarter-clay',32),('profile-clay',90)]:
 angle=math.radians(deg);camera.location=(3.4*math.sin(angle),-3.4*math.cos(angle),.52);camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/(label+'.png'));bpy.ops.render.render(write_still=True);path=Path(scene.render.filepath);views.append(dict(file=path.name,cameraLocation=list(camera.location),target=list(center),sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
# Preserve the actual editable surface and studio; no photo or image texture used.
scene.render.filepath=str(OUT/'front-clay.png');camera.location=(0,-3.4,.52);camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(COMP/'actual-source-component-editable.blend'),compress=True)
report=dict(revision=manifest['revision'],sourceGlbSha256=manifest['files']['glb']['sha256'],builderSha256=manifest['builderSha256'],renderScriptSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),sourceLicense='CC-BY-4.0',coordinateSystem='+Y-up/+Z-front GLB imported by Blender to +Z-up',renderBackend='Cycles Metal through tools/run-blender-queued.mjs official FIFO',material='Neutral gray clay; no source textures, photo maps, normal maps or displacement',views=views,vertices=len(head.data.vertices),triangles=sum(len(f.vertices)-2 for f in head.data.polygons),openMountBoundaries='One source-preserving neck loop and one crown loop; exact ring coordinates in measured-rings.json. Donor side hair remains.',visualAccepted=False)
(OUT/'report.json').write_text(json.dumps(report,indent=2));print('HEAD173_COMPONENT_RENDER_READY',json.dumps(report),flush=True)
