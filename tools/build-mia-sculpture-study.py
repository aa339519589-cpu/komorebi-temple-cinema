"""Inspect an openly licensed real sculpture as geometry, with new lighting.

The source is a different historical sculpture from the reference. This study
does not assert an exact match, and is not automatically installed in a scene.
"""
import bpy,bmesh,math,json,hashlib,os
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'assets/mia-amoghasiddhi-study/source.glb'
OUT=ROOT/'lookdev/mia-amoghasiddhi-study';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
if not meshes:raise RuntimeError('Museum source contains no actual mesh')
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join()
sculpture=bpy.context.object;sculpture.name='CC0_MIA_Amoghasiddhi_geometry_study'
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
coordinates=[sculpture.matrix_world@Vector(v) for v in sculpture.bound_box]
minimum=Vector([min(p[k] for p in coordinates) for k in range(3)])
maximum=Vector([max(p[k] for p in coordinates) for k in range(3)])
height=maximum.z-minimum.z
if not(height>1e-8):raise RuntimeError('Invalid sculpture bounds')
scale=3.5/height;centre=(minimum+maximum)/2;source_matrix=sculpture.matrix_world.copy()
sculpture.parent=None;sculpture.matrix_parent_inverse=Matrix.Identity(4)
sculpture.delta_location=(0,0,0);sculpture.delta_rotation_euler=(0,0,0);sculpture.delta_scale=(1,1,1)
sculpture.matrix_world=Matrix.Identity(4)
normalization=Matrix.Scale(scale,4)@Matrix.Translation((-centre.x,-centre.y,-minimum.z))
sculpture.data.transform(normalization@source_matrix)
# GLB splits positions along texture seams. Weld only coincident positions
# at one micrometre, retaining the full scanned surface and triangle count.
bm=bmesh.new();bm.from_mesh(sculpture.data)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(sculpture.data);bm.free()
sculpture.data.update();bpy.context.view_layer.update()
checked=[sculpture.matrix_world@Vector(v) for v in sculpture.bound_box]
checked_height=max(v.z for v in checked)-min(v.z for v in checked)
if abs(checked_height-3.5)>1e-4:raise RuntimeError('Source parent transform was not removed; actual normalized height '+str(checked_height))
def rgb(text):
    a=[int(text[k:k+2],16)/255 for k in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in a)+(1,)
gold=bpy.data.materials.new('Study regilding, no baked scan illumination');gold.use_nodes=True
nodes=gold.node_tree.nodes;links=gold.node_tree.links;p=nodes.get('Principled BSDF')
p.inputs['Base Color'].default_value=rgb('d9b15d');p.inputs['Metallic'].default_value=.95;p.inputs['Roughness'].default_value=.3
coord=nodes.new('ShaderNodeTexCoord');noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=180;noise.inputs['Detail'].default_value=2
links.new(coord.outputs['Object'],noise.inputs['Vector'])
rough=nodes.new('ShaderNodeMapRange');rough.inputs['From Min'].default_value=0;rough.inputs['From Max'].default_value=1;rough.inputs['To Min'].default_value=.27;rough.inputs['To Max'].default_value=.34
links.new(noise.outputs['Fac'],rough.inputs['Value']);links.new(rough.outputs['Result'],p.inputs['Roughness'])
bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.10;bump.inputs['Distance'].default_value=.00025
links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs['Normal'],p.inputs['Normal'])
sculpture.data.materials.clear();sculpture.data.materials.append(gold)
for face in sculpture.data.polygons:face.material_index=0;face.use_smooth=True
bm=bmesh.new();bm.from_mesh(sculpture.data)
report={'status':'building','sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
 'sourceLicense':'CC0-1.0','geometry':'Actual museum scan, rigidly normalized; no photograph plane or AI replacement frame.',
 'vertices':len(bm.verts),'triangles':sum(len(f.verts)-2 for f in bm.faces),
 'boundaryEdges':sum(e.is_boundary for e in bm.edges),'sourceSize':list(maximum-minimum),
 'normalizedHeightMetres':checked_height,'worldTransformVerified':True,'visualAccepted':False,
 'limits':['Different historical sculpture; anatomy, drapery and pose must be compared with the supplied reference before use.','Uniform study regilding replaces scan albedo; original source GLB remains unchanged.']}
bm.free()
scene=bpy.context.scene
for o in list(scene.objects):
    if o!=sculpture:bpy.data.objects.remove(o,do_unlink=True)
floor=bpy.data.materials.new('study matte charcoal floor');floor.use_nodes=True
floor.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=rgb('26221e')
floor.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.86
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.008));bpy.context.object.data.materials.append(floor)
world=bpy.data.worlds.new('dim studio field');world.use_nodes=True;scene.world=world
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.3,.36,.48,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.2
def area(name,loc,energy,size,color):
    light=bpy.data.lights.new(name,'AREA');light.energy=energy;light.shape='DISK';light.size=size;light.color=color
    o=bpy.data.objects.new(name,light);scene.collection.objects.link(o);o.location=loc
    o.rotation_euler=(Vector((0,0,1.75))-o.location).to_track_quat('-Z','Y').to_euler()
area('broad warm left window',(-3,-4.5,6),950,3.8,(1,.85,.65))
area('restrained front fill',(3,-3,2.8),180,3.0,(.72,.83,1))
area('sculpture rim',(1,3,4.8),750,2.4,(1,.67,.32))
camera_data=bpy.data.cameras.new('low sculpture study camera');camera=bpy.data.objects.new('low sculpture study camera',camera_data)
scene.collection.objects.link(camera);camera_data.lens=57;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=96;scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.device='GPU'
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
if not any(d.use for d in prefs.devices):raise RuntimeError('Metal GPU is unavailable')
scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.resolution_x=960;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.25
report['views']=[]
for name,angle in [('front',0),('three-quarter',math.radians(27))]:
    camera.location=(7.8*math.sin(angle),-7.8*math.cos(angle),.90)
    camera.rotation_euler=(Vector((0,0,1.78))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/('actual-geometry-'+name+'.png'))
    bpy.ops.render.render(write_still=True)
    report['views'].append({'name':name,'camera':list(camera.location),'file':Path(scene.render.filepath).name})
    if name=='front':bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'editable-sculpture-study.blend'),compress=True)
report['status']='two-actual-scanned-geometry-study-renders'
(OUT/'report.json').write_text(json.dumps(report,indent=2))
print('SCULPTURE_STUDY_COMPLETE',json.dumps(report),flush=True)
