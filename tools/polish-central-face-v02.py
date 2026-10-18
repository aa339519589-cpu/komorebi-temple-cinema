"""Local sculpt fairing of the explicit facial mesh, with no bitmap input.

The anatomical frame, native crown/neck and statue seats stay fixed. Small
closed floating components from the learned surface are removed except for
the separately generated forehead urna. Weighted relaxation targets only the
noisy nose wings and lower cheeks; eyelids and the major nose bridge survive.
"""
from pathlib import Path
import bpy,bmesh,json,hashlib
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'reconstructions/scene-06/assets/learned-face-v01'
OUT=ROOT/'reconstructions/scene-06/assets/learned-face-v02'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SRC/'central-face.blend'))
o=bpy.data.objects['scene06-learned-central-face-and-ears']
bm=bmesh.new();bm.from_mesh(o.data)
remaining=set(bm.verts);removed=[];retained=[]
while remaining:
 start=remaining.pop();seen={start};stack=[start]
 while stack:
  v=stack.pop()
  for e in v.link_edges:
   w=e.other_vert(v)
   if w in remaining:remaining.remove(w);seen.add(w);stack.append(w)
 if len(seen)<1000:
  c=np.array([tuple(v.co) for v in seen]);centre=c.mean(0)
  urna=abs(centre[0])<.035 and 3.03<centre[1]<3.14 and centre[2]>.25
  record={'vertices':len(seen),'centre':centre.tolist()}
  if urna:retained.append(record)
  else:removed.append(record);bmesh.ops.delete(bm,geom=list(seen),context='VERTS')
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();o.data.update()
n=len(o.data.vertices);before=np.empty(n*3,np.float32);o.data.vertices.foreach_get('co',before);p=before.reshape(-1,3)
def field(cx,cy,rx,ry):return np.exp(-2*((p[:,0]-cx)/rx)**2-2*((p[:,1]-cy)/ry)**2)
nose=np.maximum(field(-.068,2.735,.062,.064),field(.068,2.735,.062,.064))
cheek=np.maximum(field(-.18,2.655,.12,.20),field(.18,2.655,.12,.20))
mouth=field(0,2.58,.17,.072)
front=np.clip((p[:,2]-.16)/.11,0,1)
weights=np.maximum(nose*.96,np.maximum(cheek*.65,mouth*.45))*front
vg=o.vertex_groups.new(name='local casting cleanup, fixed eyelids and frame')
for i,w in enumerate(weights):
 if w>.002:vg.add([i],float(w),'REPLACE')
bpy.context.view_layer.objects.active=o
bpy.ops.object.select_all(action='DESELECT');o.select_set(True)
mod=o.modifiers.new('Fair nose wings and lower cheek tool noise','SMOOTH')
mod.vertex_group=vg.name;mod.factor=.65;mod.iterations=48
bpy.ops.object.modifier_apply(modifier=mod.name)
after=np.empty(n*3,np.float32);o.data.vertices.foreach_get('co',after)
movement=np.linalg.norm((after-before).reshape(-1,3),axis=1)
for f in o.data.polygons:f.use_smooth=True
bm=bmesh.new();bm.from_mesh(o.data)
topology={'vertices':len(bm.verts),'triangles':sum(len(f.verts)-2 for f in bm.faces),'boundaryEdges':sum(e.is_boundary for e in bm.edges),'nonmanifoldEdges':sum(not e.is_manifold for e in bm.edges),'signedVolumeUnits3':bm.calc_volume(signed=True)};bm.free()
if topology['boundaryEdges'] or topology['nonmanifoldEdges']:raise RuntimeError('Fairing broke the facial surface')
root=o.parent;root.select_set(True);bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'central-face.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'central-face.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_materials='NONE',export_vertex_color='NONE',export_texcoords=True,export_normals=True)
report={'status':'local-fairing-unaccepted-candidate','photographicAcceptance':False,'sourceAssetSha256':hashlib.sha256((SRC/'central-face.glb').read_bytes()).hexdigest(),'topology':topology,'removedSmallClosedComponents':removed,'retainedUrnaComponents':retained,'localRelaxation':{'factor':.65,'iterations':48,'maxMovementUnits':float(movement.max()),'meanMovementUnits':float(movement.mean())},'bitmapLoaded':False,'texturesUsed':False,'placementChanged':False,'limitations':['This is a repaired learned surface, not an exact recovery of the pictured statue.','Local nose and mouth anatomy still needs comparison in the real scene.']}
for f in ['central-face.glb','central-face.blend']:report[f+'Sha256']=hashlib.sha256((OUT/f).read_bytes()).hexdigest()
(OUT/'build-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('CENTRAL_FACE_LOCAL_FAIRING',json.dumps(topology),flush=True)
