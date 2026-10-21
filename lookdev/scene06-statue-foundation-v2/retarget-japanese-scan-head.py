"""Replace the provisional analytic face with an actual licensed Japanese head.

Requires the completed r03 foundation. Run with the official shared queue.
No photo map, photograph displacement, or scan albedo enters the output.
"""
import bpy,bmesh,json,hashlib,math
from pathlib import Path
from mathutils import Vector,Matrix
OUT=Path(__file__).resolve().parent
BASE=OUT/'r03/editable-japanese-buddha.blend'
SOURCE=OUT/'sources/ccby-beachmouse-japanese-head/source-objaverse.glb'
DEST=OUT/'r04-japanese-scan-head';DEST.mkdir(exist_ok=True)
if not BASE.is_file():raise RuntimeError('Complete the independent r03 queued build before retargeting.')
bpy.ops.wm.open_mainfile(filepath=str(BASE))
scene=bpy.context.scene
for ob in list(scene.objects):
    if ob.type=='MESH' and ob.name.startswith(('01_','02_','03_','05_')):bpy.data.objects.remove(ob,do_unlink=True)
before=set(scene.objects)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
added=[ob for ob in scene.objects if ob not in before];meshes=[ob for ob in added if ob.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for ob in meshes:ob.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();head=bpy.context.object
head.name='01_CC_BY_beachmouse_actual_Japanese_head_rigid_retarget'
world=head.matrix_world.copy();head.parent=None;head.matrix_parent_inverse=Matrix.Identity(4);head.matrix_world=Matrix.Identity(4);head.data.transform(world)
for ob in added:
    if ob!=head and ob.name in bpy.data.objects:bpy.data.objects.remove(ob,do_unlink=True)
positions=[v.co.copy()for v in head.data.vertices]
minimum=Vector([min(v[k]for v in positions)for k in range(3)]);maximum=Vector([max(v[k]for v in positions)for k in range(3)])
source_scale=1.8/(maximum.z-minimum.z);center=(minimum+maximum)/2
head.data.transform(Matrix.Scale(source_scale,4)@Matrix.Translation((-center.x,-center.y,-minimum.z)))
bm=bmesh.new();bm.from_mesh(head.data)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
cut=.45
result=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-6,plane_co=Vector((0,0,cut)),plane_no=Vector((0,0,1)),clear_inner=True,clear_outer=False)
boundary=[e for e in bm.edges if e.is_boundary and all(abs(v.co.z-cut)<1e-4 for v in e.verts)]
if boundary:bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(head.data);bm.free()
surviving=[v.co.copy()for v in head.data.vertices]
upper=[p for p in surviving if p.z>1.02]
cx=(min(p.x for p in upper)+max(p.x for p in upper))/2
cy=(min(p.y for p in upper)+max(p.y for p in upper))/2
retarget_scale=.82;apex=3.49;translation=apex-1.8*retarget_scale
for v in head.data.vertices:
    p=v.co.copy();v.co=(retarget_scale*(p.x-cx),retarget_scale*(p.y-cy)+.035,retarget_scale*p.z+translation)
head.data.update()
gold=bpy.data.materials.get('New warm gold leaf — uniform physical material')
hair=bpy.data.materials.get('Dark lacquered spiral curls')
if not(gold and hair):raise RuntimeError('The foundation physical material identities changed.')
head.data.materials.clear();head.data.materials.append(gold);head.data.materials.append(hair)
hairline=3.24
for face in head.data.polygons:
    z=sum(head.data.vertices[i].co.z for i in face.vertices)/len(face.vertices)
    x=sum(head.data.vertices[i].co.x for i in face.vertices)/len(face.vertices)
    side=max(0,min(1,(abs(x)-.25)/.13))
    face.material_index=1 if z>hairline-.10*side else 0
    face.use_smooth=True
# A low-poly photogrammetry mesh exposes triangle planes under metallic light.
# Two editable Catmull-Clark levels reconstruct a smooth interpolating surface;
# the original cropped source cage remains the actual, undeformed scan.
sub=head.modifiers.new('Smooth actual scan triangles — source cage retained','SUBSURF');sub.subdivision_type='CATMULL_CLARK';sub.levels=2;sub.render_levels=2
head['attribution']='Buddha Head by beachmouse, CC BY 4.0, via Sketchfab and Objaverse; rigidly cropped/retargeted and regilded for temple-cinema foundation study.'
head['source']='https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab'
head['license']='https://creativecommons.org/licenses/by/4.0/'
head['changes']='Rigid normalization and upper-head crop; UV seam weld; two editable Catmull-Clark levels; uniform gold and geometry-threshold dark hair; source photographic material removed.'
head['visualAccepted']=False
scene['candidate']='r04-japanese-scan-head; actual CC BY Japanese face and new independent body/paired mudra hands/lotus'
scene['visual_accepted']=False
bpy.ops.object.select_all(action='DESELECT')
valid=[ob for ob in scene.objects if ob.type=='MESH' and not ob.name.startswith('STUDIO')]
for ob in valid:ob.select_set(True)
bpy.context.view_layer.objects.active=head
bpy.ops.export_scene.gltf(filepath=str(DEST/'japanese-buddha-real-head-foundation.glb'),use_selection=True,export_format='GLB',export_apply=True,export_extras=True)
camera=scene.camera;scene.cycles.samples=64;scene.render.resolution_x=1254;scene.render.resolution_y=1254;scene.render.resolution_percentage=100
def view(name,loc,target,lens):
    camera.location=loc;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens;scene.render.filepath=str(DEST/(name+'.png'));bpy.ops.render.render(write_still=True)
views=[]
for args in [
 ('gold-front',(0,-9.4,2.62),(0,-.02,1.43),65),
 ('gold-three-quarter',(4.5,-8.5,2.85),(0,-.02,1.43),65),
 ('face-and-hands',(0,-5.3,2.96),(0,-.18,2.51),83)
]:view(*args);views.append(args[0]+'.png')
clay=bpy.data.materials.get('Geometry review clay');saved=[]
for ob in valid:
    saved.append((ob,list(ob.data.materials),[p.material_index for p in ob.data.polygons]));ob.data.materials.clear();ob.data.materials.append(clay)
    for p in ob.data.polygons:p.material_index=0
view('clay-front',(0,-9.4,2.62),(0,-.02,1.43),65);views.append('clay-front.png')
for ob,mats,indices in saved:
    ob.data.materials.clear()
    for m in mats:ob.data.materials.append(m)
    for f,idx in zip(ob.data.polygons,indices):f.material_index=idx
camera.location=(0,-9.4,2.62);camera.rotation_euler=(Vector((0,-.02,1.43))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=65
bpy.ops.wm.save_as_mainfile(filepath=str(DEST/'editable-japanese-buddha-real-head.blend'),compress=True)
evaluated_counts=[];depsgraph=bpy.context.evaluated_depsgraph_get()
for ob in valid:
    evaluated=ob.evaluated_get(depsgraph);me=evaluated.to_mesh()
    evaluated_counts.append({'name':ob.name,'vertices':len(me.vertices),'triangles':sum(len(f.vertices)-2 for f in me.polygons)})
    evaluated.to_mesh_clear()
report={'revision':'r04-japanese-scan-head','visualAccepted':False,'status':'actual-licensed-Japanese-head-retarget-study',
 'source':{'title':'Buddha Head','author':'beachmouse','license':'CC-BY-4.0','source':'https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab','sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'bytes':SOURCE.stat().st_size,'attribution':head['attribution']},
 'sourcePhotographicMaterialUsed':False,'sourceCageFacialGeometryReshaped':False,'editableSurfaceSmoothing':'Two Catmull-Clark levels; original cropped source cage retained.',
 'rigidRetarget':{'sourceBounds':[list(minimum),list(maximum)],'sourceNormalizationScale':source_scale,'normalizedCropZ':cut,'retargetScale':retarget_scale,'crownZ':apex,'horizontalCenter':[cx,cy]},
 'headGeometry':{'vertices':len(head.data.vertices),'triangles':sum(len(f.vertices)-2 for f in head.data.polygons)},
 'totalTriangles':sum(q['triangles']for q in evaluated_counts),'evaluatedMeshes':evaluated_counts,
 'views':views,'limits':['Different Japanese sculpture than target; no exactness claim.','Head/ears/curl anatomy comes from the actual licensed mesh; body and hands remain new modeling.','Native room integration and camera-scale comparison still required.','Regilding and topological hair material split are new artistic changes.'],
 'builderSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'foundationBlendSha256':hashlib.sha256(BASE.read_bytes()).hexdigest()}
(DEST/'report.json').write_text(json.dumps(report,indent=2))
print('JAPANESE_REAL_HEAD_RETARGET_READY',json.dumps(report),flush=True)
