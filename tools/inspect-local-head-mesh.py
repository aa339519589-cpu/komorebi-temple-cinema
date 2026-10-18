"""Actual multi-view Blender inspection of an untextured learned mesh.
No guide bitmap or reference image is loaded by the renderer.
"""
from pathlib import Path
import bpy,json,math,time,os
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];SRC=Path(os.environ.get('HEAD_MESH_FILE',str(ROOT/'lookdev/local-triposg-head/head-provisional-untextured.glb')));OUT=Path(os.environ.get('HEAD_INSPECTION_OUT',str(ROOT/'lookdev/local-triposg-head/actual-blender-inspection')));OUT.mkdir(parents=True,exist_ok=True)
if not SRC.exists():raise FileNotFoundError('No generated explicit mesh to inspect')
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(SRC));scene=bpy.context.scene
objects=[o for o in scene.objects if o.type=='MESH']
if not objects:raise ValueError('GLB has no real mesh')
bpy.context.view_layer.update();points=[o.matrix_world@Vector(p) for o in objects for p in o.bound_box];lo=Vector(tuple(min(p[i] for p in points) for i in range(3)));hi=Vector(tuple(max(p[i] for p in points) for i in range(3)));centre=(lo+hi)*.5;extent=max(hi-lo)
clay=bpy.data.materials.new('neutral matte clay, no image maps');clay.use_nodes=True;bs=clay.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.27,.27,.27,1);bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.52
for o in objects:o.data.materials.clear();o.data.materials.append(clay)
world=bpy.data.worlds.new('neutral inspection world');world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.23,.25,.28,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35;scene.world=world
for name,power,position,size in [('key',550,(-2.7,-3.8,4.0),3.2),('fill',220,(3.8,-1.7,1.7),3.5),('rim',500,(-1.4,3.2,3.2),2.0)]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=centre+Vector(position)*extent/2;o.rotation_euler=(centre-o.location).to_track_quat('-Z','Y').to_euler()
cam=bpy.data.cameras.new('independent mesh inspection camera');camera=bpy.data.objects.new(cam.name,cam);scene.collection.objects.link(camera);cam.type='ORTHO';cam.ortho_scale=extent*1.16;cam.clip_start=.01;cam.clip_end=100;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.seed=804231;scene.cycles.use_animated_seed=False
preferences=bpy.context.preferences.addons['cycles'].preferences;preferences.compute_device_type='METAL';preferences.get_devices()
for device in preferences.devices:device.use=device.type=='METAL'
if not any(device.use for device in preferences.devices):raise RuntimeError('Metal renderer unavailable')
scene.cycles.device='GPU';scene.render.resolution_x=scene.render.resolution_y=1254;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.threads_mode='FIXED';scene.render.threads=4;scene.view_settings.view_transform='AgX';scene.view_settings.exposure=.3
report={'status':'rendering','input':str(SRC),'scope':'Real standalone mesh inspection, not a film frame or photographic match','guideImageLoaded':False,'referenceImageLoaded':False,'meshObjects':len(objects),'triangles':sum(len(o.data.loop_triangles) if o.data.loop_triangles else sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects),'blenderBounds':[list(lo),list(hi)],'camera':'orthographic only for shape inspection','photographicAcceptance':False,'views':[]}
for name,direction in [('front',(0,-4,.08)),('three-quarter',(2.6,-3.3,.1)),('profile',(4,0,.08))]:
 camera.location=centre+Vector(direction)*extent;camera.rotation_euler=(centre-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True);report['views'].append({'name':name,'file':name+'.png','position':list(camera.location)})
scene.render.filepath=str(OUT/'front.png');bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'head-mesh-inspection.blend'),compress=True);report['status']='actual-mesh-views-rendered';(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print('ACTUAL_HEAD_INSPECTION_DONE',flush=True)
