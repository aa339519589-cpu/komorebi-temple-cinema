"""Local closed-solid nasal repair of the actual untextured TripoSG face.

Reads only the existing explicit v02 Blend. No photograph, bitmap, displacement,
texture or image sampler enters this operation. The two thin folded alar loops
are filled by overlapping closed solid envelopes and fused into the existing
surface. Compact weighted fairing affects only the nose-wing volume. Small
blind nostril recesses are carved into the new solid, not drilled through it.
The source head and editable closure/cutter solids remain in the Blend.
"""
from pathlib import Path
import bpy,bmesh,json,hashlib,math,shutil
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[3]
SRC=ROOT/'reconstructions/scene-06/assets/learned-face-v02'
OUT=ROOT/'reconstructions/scene-06/assets/learned-face-v03-nasal'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SRC/'central-face.blend'))
o=bpy.data.objects['scene06-learned-central-face-and-ears'];root=o.parent
before=np.array([tuple(v.co) for v in o.data.vertices],dtype=np.float64)
source=o.copy();source.data=o.data.copy();source.name='SOURCE unmodified learned-face-v02, hidden'
bpy.context.scene.collection.objects.link(source);source.hide_render=True;source.hide_viewport=True
source.hide_set(True)
steps=[];guides=[]

def audit(obj):
 bm=bmesh.new();bm.from_mesh(obj.data)
 rep={'vertices':len(bm.verts),'triangles':sum(len(f.verts)-2 for f in bm.faces),'boundaryEdges':sum(e.is_boundary for e in bm.edges),'nonmanifoldEdges':sum(not e.is_manifold for e in bm.edges),'signedVolumeUnits3':bm.calc_volume(signed=True),'euler':len(bm.verts)-len(bm.edges)+len(bm.faces)}
 bm.free();return rep

def ellipsoid(name,centre,radii):
 bm=bmesh.new();bmesh.ops.create_uvsphere(bm,u_segments=64,v_segments=40,radius=1)
 for v in bm.verts:
  for i in range(3):v.co[i]=v.co[i]*radii[i]+centre[i]
 data=bpy.data.meshes.new(name);bm.to_mesh(data);bm.free()
 obj=bpy.data.objects.new(name,data);bpy.context.scene.collection.objects.link(obj);obj.parent=root
 bpy.context.view_layer.update();guides.append(obj);return obj

def boolean(part,operation,label):
 bpy.context.view_layer.objects.active=o
 mod=o.modifiers.new(label,'BOOLEAN');mod.operation=operation;mod.solver='EXACT';mod.object=part
 bpy.ops.object.modifier_apply(modifier=mod.name)
 result=audit(o);steps.append({'operation':operation,'label':label,'audit':result})
 if result['boundaryEdges'] or result['nonmanifoldEdges']:
  bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'rejected-nonmanifold.blend'),compress=True)
  (OUT/'rejected-step.json').write_text(json.dumps(steps,indent=2)+'\n')
  raise RuntimeError('Nasal Boolean failed closed-solid audit: '+label)
 part.hide_render=True;part.hide_viewport=True;part.hide_set(True)

initial=audit(o)
# The old front surface is only several mm thick. These plugs overlap its
# inward side and span the actual absent frontal intersections around x=+/- .06.
closures=[]
for side in [-1,1]:
 c=(side*.065,2.720,.285);r=(.055,.038,.045)
 part=ellipsoid(('left' if side<0 else 'right')+' nasal loop closure solid',c,r)
 closures.append({'centre':list(c),'radii':list(r)})
 boolean(part,'UNION','Fuse closed nasal wing; seal curled ring route')

# Fair the genuine fused surface with zero weight outside the compact nose ROI.
# This does not move the nasal bridge, eye, mouth or the back of the learned head.
p=np.array([tuple(v.co) for v in o.data.vertices],dtype=np.float64)
x=np.abs(p[:,0]);y=p[:,1];z=p[:,2]
def smoothstep(a,b,t):
 q=np.clip((t-a)/(b-a),0,1);return q*q*(3-2*q)
window=smoothstep(.012,.027,x)*(1-smoothstep(.117,.139,x))*smoothstep(2.674,2.689,y)*(1-smoothstep(2.757,2.781,y))*smoothstep(.220,.248,z)
vg=o.vertex_groups.new(name='ONLY fused alar wings: bridge and lip locked')
for i,w in enumerate(window):
 if w>0:vg.add([i],float(w),'REPLACE')
bpy.context.view_layer.objects.active=o
mod=o.modifiers.new('Local fairing of filled alar rims','SMOOTH');mod.vertex_group=vg.name;mod.factor=.55;mod.iterations=20
bpy.ops.object.modifier_apply(modifier=mod.name)
after_fair=np.array([tuple(v.co) for v in o.data.vertices],dtype=np.float64)
fair_movement=np.linalg.norm(after_fair-p,axis=1)

# Closed blind dimples under each round alar body; they do not pierce the
# repaired shell or reintroduce the old large circular through-opening.
recesses=[]
for side in [-1,1]:
 c=(side*.064,2.707,.336);r=(.018,.006,.012)
 part=ellipsoid(('left' if side<0 else 'right')+' shallow blind nostril cutter',c,r)
 recesses.append({'centre':list(c),'radii':list(r)})
 boolean(part,'DIFFERENCE','Small blind nasal recess with solid floor')

for f in o.data.polygons:f.use_smooth=True
bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();o.data.update()
final=audit(o)
if final['boundaryEdges'] or final['nonmanifoldEdges']:raise RuntimeError('Nasal repair is not closed')
# Match exact old coordinates outside the operation window. Boolean operations
# may reindex faces, but they must leave unrelated authored geometry in place.
after=np.array([tuple(v.co) for v in o.data.vertices],dtype=np.float64)
def protected_mask(v):
 return ~((np.abs(v[:,0])>.010)&(np.abs(v[:,0])<.141)&(v[:,1]>2.672)&(v[:,1]<2.783)&(v[:,2]>.218))
protected=before[protected_mask(before)];keys={tuple(np.round(v,7)) for v in after}
unmatched=[v.tolist() for v in protected if tuple(np.round(v,7)) not in keys]
if unmatched:raise RuntimeError('Out-of-scope vertices changed: '+str(len(unmatched)))
# Probes are actual mesh ray intersections, not photograph measurements.
bvh=BVHTree.FromPolygons([tuple(v.co) for v in o.data.vertices],[tuple(f.vertices) for f in o.data.polygons],all_triangles=False)
probes=[]
for side in [-1,1]:
 for dx in [-.010,0,.010]:
  x=side*.065+dx;y=2.720
  hit,normal,index,distance=bvh.ray_cast(Vector((x,y,.8)),Vector((0,0,-1)),.6)
  if hit is None or hit.z<.29:raise RuntimeError('Old frontal nasal opening remains at '+str((x,y)))
  probes.append({'xy':[x,y],'firstZ':float(hit.z)})
# Save metric material UVs as before; no material is exported or modified.
for guide in guides:guide.hide_render=True;guide.hide_viewport=True;guide.hide_set(True)
bpy.ops.object.select_all(action='DESELECT');o.hide_set(False);o.select_set(True);root.select_set(True);bpy.context.view_layer.objects.active=o
bpy.context.view_layer.update();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'central-face.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'central-face.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_materials='NONE',export_vertex_color='NONE',export_texcoords=True,export_normals=True)
shutil.copy2(__file__,OUT/'build-source.py')
report={'status':'local-nasal-geometric-repair-unaccepted-candidate','photographicAcceptance':False,'sourceCommit':'8082e52','sourceAsset':'learned-face-v02','sourceAssetSha256':hashlib.sha256((SRC/'central-face.glb').read_bytes()).hexdigest(),'initialTopology':initial,'operations':steps,'closureSolids':closures,'blindRecessCutters':recesses,'topology':final,'localFairing':{'factor':.55,'iterations':20,'maxMovementUnits':float(fair_movement.max()),'weightedVertices':int((window>0).sum()),'outsideWeightsExactlyZero':True},'protectedOriginalVertices':len(protected),'protectedVerticesMissingOrMoved':len(unmatched),'operationBoundsArtistYUp':{'absX':[.010,.141],'Y':[2.672,2.783],'ZGreaterThan':.218},'actualFrontSurfaceProbes':probes,'bitmapLoaded':False,'imagesUsed':False,'materialsChanged':False,'placementChanged':False,'cameraChanged':False,'neckCrownBodyChanged':False,'editableSourceAndClosureSolidsInBlend':True,'referenceForComparisonOnly':'lookdev/trellis2-head-study/reference-head-comparison-only.png; references/hd/4-照片-5.jpg','limitations':['This is a local anatomical hypothesis fitted to the existing learned face, not a recovery of a measured statue.','Mouth, eyes and other remaining learned-face differences are deliberately untouched.','Metal response and photographic fidelity must be judged in actual native scene frames, not by manifold topology.']}
for name in ['central-face.glb','central-face.blend','build-source.py']:report[name+'Sha256']=hashlib.sha256((OUT/name).read_bytes()).hexdigest()
(OUT/'build-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('NASAL_REPAIR',json.dumps({'topology':final,'protectedOriginalVertices':len(protected),'protectedVerticesMissingOrMoved':len(unmatched),'maxFairingMovement':float(fair_movement.max())}),flush=True)
