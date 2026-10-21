"""Actual CC BY Japanese head scan, rigid normalization and uniform regilding.
Run only with tools/run-blender-queued.mjs. The original source bytes are kept.
"""
import bpy,bmesh,math,json,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
OUT=Path(__file__).resolve().parent
SOURCE=OUT/'sources/ccby-beachmouse-japanese-head/source-objaverse.glb'
DEST=OUT/'japanese-scan-head-study';DEST.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();o=bpy.context.object
o.name='CC_BY_beachmouse_actual_Japanese_Buddha_bust'
world=o.matrix_world.copy();o.parent=None;o.matrix_parent_inverse=Matrix.Identity(4);o.matrix_world=Matrix.Identity(4);o.data.transform(world)
bounds=[Vector(v.co)for v in o.data.vertices];minimum=Vector([min(v[k]for v in bounds)for k in range(3)]);maximum=Vector([max(v[k]for v in bounds)for k in range(3)])
scale=1.80/(maximum.z-minimum.z);center=(minimum+maximum)/2
o.data.transform(Matrix.Scale(scale,4)@Matrix.Translation((-center.x,-center.y,-minimum.z)))
bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(o.data);bm.free();o.data.update()
def rgb(s):
 a=[int(s[k:k+2],16)/255 for k in (0,2,4)]
 return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in a)+(1,)
m=bpy.data.materials.new('New uniform physical regilding, scan texture removed');m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=rgb('d4a84d');p.inputs['Metallic'].default_value=.94;p.inputs['Roughness'].default_value=.34
o.data.materials.clear();o.data.materials.append(m)
for f in o.data.polygons:f.material_index=0;f.use_smooth=True
o['attribution']='Buddha Head by beachmouse, CC BY 4.0, via Sketchfab / Objaverse. Rigidly normalized and re-gilded; original bytes preserved.'
o['source']='https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab'
o['license']='https://creativecommons.org/licenses/by/4.0/'
scene=bpy.context.scene;world=bpy.data.worlds.new('Neutral studio');world.use_nodes=True;scene.world=world;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.13,.13,.13,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.22
def area(name,loc,energy,size,color):
 light=bpy.data.lights.new(name,'AREA');light.energy=energy;light.shape='DISK';light.size=size;light.color=color
 ob=bpy.data.objects.new(name,light);scene.collection.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector((0,0,.9))-ob.location).to_track_quat('-Z','Y').to_euler()
area('Broad neutral key',(-2.5,-3.5,4),650,3.2,(1,.94,.84));area('Fill',(2.8,-3,2),210,2.5,(.86,.92,1));area('Rim',(1.2,2.5,3.4),550,2.5,(1,.78,.48))
camera_data=bpy.data.cameras.new('Actual scan camera');camera=bpy.data.objects.new('Actual scan camera',camera_data);scene.collection.objects.link(camera);scene.camera=camera;camera_data.lens=75
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True;scene.cycles.device='GPU';prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.resolution_x=1254;scene.render.resolution_y=1254;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
report={'sourceFile':str(SOURCE.relative_to(OUT)),'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'sourceLicense':'CC-BY-4.0','author':'beachmouse','attribution':o['attribution'],'sourceBounds':[list(minimum),list(maximum)],'normalizationScale':scale,'normalizedHeight':1.8,'vertices':len(o.data.vertices),'triangles':sum(len(f.vertices)-2 for f in o.data.polygons),'visualAccepted':False,'geometryChanges':'Rigid normalization, weld coincident UV seam positions at 1e-6, recalculate normals. No reshaping or photo-derived geometry. All scan textures removed.','views':[]}
for name,angle in [('front',0),('three-quarter',math.radians(32)),('opposite',math.radians(180))]:
 camera.location=(4.45*math.sin(angle),-4.45*math.cos(angle),1.15);camera.rotation_euler=(Vector((0,0,.92))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(DEST/(name+'.png'));bpy.ops.render.render(write_still=True);report['views'].append(name+'.png')
bpy.ops.wm.save_as_mainfile(filepath=str(DEST/'editable-actual-japanese-head.blend'),compress=True)
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
bpy.ops.export_scene.gltf(filepath=str(DEST/'actual-japanese-head-regilded.glb'),use_selection=True,export_format='GLB',export_apply=True)
(DEST/'report.json').write_text(json.dumps(report,indent=2))
print('ACTUAL_JAPANESE_HEAD_READY',json.dumps(report),flush=True)
