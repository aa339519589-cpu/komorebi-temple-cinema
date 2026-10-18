"""Fit a learned untextured face to the existing statue's anatomical frame.
Only rigid placement/uniform scale, hidden cap cuts and small mesh repairs.
The existing neck, curl cap, diadem, body and attendants stay in the scene.
"""
from pathlib import Path
import bpy,bmesh,json,math,hashlib
import numpy as np
from mathutils import Matrix
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'lookdev/local-triposg-head/full-precision/head-fp32-untextured.glb';OUT=ROOT/'reconstructions/scene-06/assets/learned-face-v01';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(SRC))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
if len(objects)!=1:raise ValueError('Expected one explicit head mesh')
o=objects[0];bpy.context.view_layer.update();m=np.array(o.matrix_world);p=np.empty(len(o.data.vertices)*3,np.float32);o.data.vertices.foreach_get('co',p);p=p.reshape(-1,3)@m[:3,:3].T+m[:3,3];p=np.stack([p[:,0],p[:,2],-p[:,1]],axis=-1)
raw_bounds=[p.min(0).tolist(),p.max(0).tolist()];p=p*.68+np.array([0,2.917,-.16]);o.parent=None;o.matrix_world=Matrix.Identity(4);o.data.vertices.foreach_set('co',p.astype(np.float32).ravel());o.data.update()
bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
for y,normal in [(2.36,(0,1,0)),(3.205,(0,-1,0))]:
 bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-7,plane_co=(0,y,0),plane_no=normal,clear_inner=True,clear_outer=False)
# Cap only the two hidden joint planes first. The input has no UV splits.
caps=[]
for y in [2.36,3.205]:
 edges=[e for e in bm.edges if e.is_boundary and all(abs(v.co.y-y)<2e-5 for v in e.verts)]
 if edges:
  rr=bmesh.ops.holes_fill(bm,edges=edges,sides=0);caps.append({'jointPlaneY':y,'edges':len(edges),'newFaces':len(rr.get('faces',[]))})
# Inspect actual remaining boundary components and repair only small defects.
remaining=set(e for e in bm.edges if e.is_boundary);patches=[];large=[]
while remaining:
 start=remaining.pop();component={start};stack=list(start.verts);seen=set(stack)
 while stack:
  v=stack.pop()
  for e in v.link_edges:
   if e in remaining:
    remaining.remove(e);component.add(e)
    for w in e.verts:
     if w not in seen:seen.add(w);stack.append(w)
 coords=np.array([tuple(v.co) for v in seen]);diag=float(np.linalg.norm(coords.max(0)-coords.min(0)));record={'edges':len(component),'diameterUnits':diag,'bounds':[coords.min(0).tolist(),coords.max(0).tolist()]}
 if diag<=.10:
  rr=bmesh.ops.holes_fill(bm,edges=list(component),sides=0);record['newFaces']=len(rr.get('faces',[]));patches.append(record)
 else:large.append(record)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));boundary=sum(e.is_boundary for e in bm.edges);nonmanifold=sum(not e.is_manifold for e in bm.edges);bm.to_mesh(o.data);bm.free();o.data.update()
report={'scope':'Only centre facial surface and ears; original native neck/crown/body remain external unchanged geometry','inputSha256':hashlib.sha256(SRC.read_bytes()).hexdigest(),'sourceRawBounds':raw_bounds,'placement':{'uniformScale':.68,'translation':[0,2.917,-.16],'anatomicalTargets':'Closed eye line about2.90; chin about2.38 in the existing sculpture frame'},'hiddenCapPlanes':[2.36,3.205],'caps':caps,'smallBoundaryRepairs':patches,'unrepairedLargeBoundaries':large,'boundaryBeforeSimplification':boundary,'nonmanifoldBeforeSimplification':nonmanifold,'photographicAcceptance':False}
if large or boundary or nonmanifold:
 (OUT/'build-report.json').write_text(json.dumps(report,indent=2)+'\n');raise RuntimeError('Head needs explicit boundary review before publication')
# Reduce the editable sculpt to a portable face mesh, retaining actual creases.
bpy.context.view_layer.objects.active=o;o.select_set(True)
triangles=sum(len(f.vertices)-2 for f in o.data.polygons)
if triangles>220000:
 d=o.modifiers.new('Portable curvature-preserving face','DECIMATE');d.ratio=220000/triangles;d.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=d.name)
before=np.empty(len(o.data.vertices)*3,np.float32);o.data.vertices.foreach_get('co',before)
s=o.modifiers.new('Submillimetre casting polish','SMOOTH');s.factor=.25;s.iterations=4;bpy.ops.object.modifier_apply(modifier=s.name)
after=np.empty(len(o.data.vertices)*3,np.float32);o.data.vertices.foreach_get('co',after);movement=np.linalg.norm((after-before).reshape(-1,3),axis=1)
for f in o.data.polygons:f.use_smooth=True
# A standard cylindrical material UV, unrelated to any image projection.
co=after.reshape(-1,3);index=np.empty(len(o.data.loops),np.int32);o.data.loops.foreach_get('vertex_index',index);q=co[index];uv=np.stack([np.arctan2(q[:,0],q[:,2]+.1)/(2*np.pi)+.5,(q[:,1]-2.36)/.845],axis=1).astype(np.float32);layer=o.data.uv_layers.new(name='metric-gold-material-uv');layer.data.foreach_set('uv',uv.ravel())
o.data.materials.clear();o.name='scene06-learned-central-face-and-ears';root=bpy.data.objects.new('artist-Y-up-to-Blender-Z-up',None);bpy.context.scene.collection.objects.link(root);root.rotation_euler.x=math.pi/2;o.parent=root;bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT');root.select_set(True);o.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'central-face.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'central-face.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_materials='NONE',export_vertex_color='NONE',export_texcoords=True,export_normals=True)
report.update(status='prepared-unaccepted-face-candidate',triangles=sum(len(f.vertices)-2 for f in o.data.polygons),polishMovementMaxUnits=float(movement.max()),polishMovementMeanUnits=float(movement.mean()),rgbTextureUsed=False,requiresOriginalGoldMaterial=True)
(OUT/'build-report.json').write_text(json.dumps(report,indent=2)+'\n');print('LEARNED_FACE_PREPARED',json.dumps({k:report[k] for k in ['status','triangles','polishMovementMaxUnits']}),flush=True)
