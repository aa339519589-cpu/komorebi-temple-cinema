"""FIFO-only actual geometry coordinate inspection. No source writes."""
import bpy, math, json, hashlib
from pathlib import Path
from mathutils import Vector

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SOURCE = ROOT / 'lookdev/buddha-fullscan-source-v1/pett-tang-seated-buddha-study/fullscan-axis-clean-y-up.glb'
OUT = HERE / 'r00-coordinate-inspection'
OUT.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
scene = bpy.context.scene
def mat(name, color):
    m = bpy.data.materials.new(name); m.diffuse_color = (*color, 1); m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value = (*color, 1); p.inputs['Roughness'].default_value = .72
    return m
materials = [mat('source_height_' + str(y), c) for y,c in [
    (.0,(.24,.22,.19)), (.48,(.55,.36,.19)), (.58,(.42,.49,.31)),
    (.72,(.28,.45,.5)), (.84,(.48,.39,.25)), (1.04,(.35,.42,.52)),
    (1.26,(.5,.36,.37)), (1.44,(.35,.48,.42)), (1.51,(.32,.29,.28))]]
bands = [0,.48,.58,.72,.84,1.04,1.26,1.44,1.51]
for ob in [o for o in scene.objects if o.type == 'MESH']:
    ob.data.materials.clear()
    for m in materials: ob.data.materials.append(m)
    for face in ob.data.polygons:
        y = sum((ob.matrix_world @ ob.data.vertices[i].co).z for i in face.vertices) / len(face.vertices)
        face.material_index = max(i for i,b in enumerate(bands) if b <= y)
        face.use_smooth = True
def look(ob, at): ob.rotation_euler = (Vector(at)-ob.location).to_track_quat('-Z','Y').to_euler()
world=bpy.data.worlds.new('neutral'); world.use_nodes=True; world.node_tree.nodes['Background'].inputs['Color'].default_value=(.1,.1,.1,1); world.node_tree.nodes['Background'].inputs['Strength'].default_value=.4; scene.world=world
for name,pos,energy,size in [('Key',(-3,-4,4.0),500,3),('Fill',(3,-2,3),160,2.5),('Rim',(0,3,3),300,3)]:
    d=bpy.data.lights.new(name,'AREA'); d.energy=energy; d.shape='DISK'; d.size=size
    o=bpy.data.objects.new(name,d); scene.collection.objects.link(o); o.location=pos; look(o,(0,0,1))
white=mat('height labels',(.65,.65,.65))
for y in [.48,.58,.72,.84,1.04,1.26,1.44,1.51]:
    d=bpy.data.curves.new('world height '+str(y),'FONT'); d.body=f'{y:.2f}'; d.align_x='RIGHT'; d.size=.048
    o=bpy.data.objects.new(d.name,d); scene.collection.objects.link(o); o.location=(-.78,-.72,y); o.rotation_euler=(math.pi/2,0,0); o.data.materials.append(white)
    verts=[(-.76,-.72,y),(.75,-.72,y)]; edges=[(0,1)]
    curve=bpy.data.curves.new('height guide '+str(y),'CURVE'); curve.dimensions='3D'; curve.bevel_depth=.0012
    line=curve.splines.new('POLY'); line.points.add(1)
    for pt,co in zip(line.points,verts):pt.co=(*co,1)
    lineob=bpy.data.objects.new(curve.name,curve); scene.collection.objects.link(lineob); lineob.data.materials.append(white)
d=bpy.data.cameras.new('source cut camera'); cam=bpy.data.objects.new(d.name,d); scene.collection.objects.link(cam); scene.camera=cam; d.type='ORTHO'; d.ortho_scale=2.3
scene.render.engine='CYCLES'; scene.cycles.samples=24; scene.cycles.use_denoising=True; scene.cycles.device='GPU'
prefs=bpy.context.preferences.addons['cycles'].preferences; prefs.compute_device_type='METAL'; prefs.get_devices()
for device in prefs.devices: device.use=device.type=='METAL'
scene.render.threads_mode='FIXED'; scene.render.threads=4; scene.render.resolution_x=1000; scene.render.resolution_y=1000; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.view_settings.view_transform='AgX'; scene.view_settings.look='AgX - Medium High Contrast'
views=[]
for name,pos,at,scale in [('source-front-height-bands',(0,-5,1.0),(0,0,1),2.3),('source-front-low-detail',(0,-4,.95),(0,0,.65),1.55),('source-three-quarter',(-3,-4,1.4),(0,0,.95),2.3)]:
    cam.location=pos; look(cam,at); d.ortho_scale=scale; scene.render.filepath=str(OUT/(name+'.png')); bpy.ops.render.render(write_still=True); views.append(name+'.png')
(OUT/'receipt.json').write_text(json.dumps(dict(source=str(SOURCE.relative_to(ROOT)),sourceSha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),scriptSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),views=views,coordinateSystem='glTF +Y up/+Z front; Blender +Z up/-Y front',purpose='Actual source geometry with diagnostic height bands; no modeled replacements.'),indent=2))
print('CC0_TANG_HEIGHT_CUT_INSPECTION_READY',flush=True)
