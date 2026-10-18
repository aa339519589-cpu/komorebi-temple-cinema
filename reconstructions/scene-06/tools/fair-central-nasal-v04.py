"""Second local sculpt pass: sink the rejected v03 spherical alar envelope.

Explicit monotone artist-drawn nasal section curves constrain the already
closed surface. This is a compact vertex sculpt of an actual mesh, not an
image/depth projection. No new lobe is added. Unrelated vertices, materials,
camera, crown, neck and body stay fixed. The failed v03 remains available.
"""
from pathlib import Path
import bpy,bmesh,json,hashlib,shutil
import numpy as np
ROOT=Path(__file__).resolve().parents[3]
SRC=ROOT/'reconstructions/scene-06/assets/learned-face-v03-nasal'
BASE=ROOT/'reconstructions/scene-06/assets/learned-face-v02'
OUT=ROOT/'reconstructions/scene-06/assets/learned-face-v04-nasal'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SRC/'central-face.blend'))
o=bpy.data.objects['scene06-learned-central-face-and-ears'];root=o.parent
p=np.array([tuple(v.co) for v in o.data.vertices],dtype=np.float64)

def step(a,b,t):
 q=np.clip((t-a)/(b-a),0,1);return q*q*(3-2*q)
x=np.abs(p[:,0]);y=p[:,1];z=p[:,2]
window=step(.012,.027,x)*(1-step(.117,.139,x))*step(2.674,2.689,y)*(1-step(2.757,2.781,y))*step(.220,.248,z)
# Transverse nasal section control coordinates, in artist Three Y-up axes.
# The central tip is retained. The rejected high caps at +/- .065 are lowered
# into a continuous sloping shoulder before fairing their old Boolean seams.
xs=np.array([0,.015,.035,.055,.075,.100,.130,.141])
ys=np.array([2.677,2.698,2.728,2.755,2.781])
rows=np.array([
 [.330,.325,.297,.279,.268,.260,.264,.265],
 [.352,.347,.322,.302,.286,.270,.267,.268],
 [.369,.365,.342,.317,.301,.280,.269,.270],
 [.367,.363,.342,.318,.298,.273,.268,.269],
 [.360,.356,.335,.309,.281,.266,.267,.268]])
def pchip(q,knots,values):
 d=np.diff(values)/np.diff(knots);m=np.zeros_like(values);m[0]=d[0];m[-1]=d[-1]
 for i in range(1,len(values)-1):
  if d[i-1]*d[i]>0:
   h0=knots[i]-knots[i-1];h1=knots[i+1]-knots[i];w0=2*h1+h0;w1=h1+2*h0;m[i]=(w0+w1)/(w0/d[i-1]+w1/d[i])
 i=np.clip(np.searchsorted(knots,q,side='right')-1,0,len(knots)-2);h=knots[i+1]-knots[i];t=np.clip((q-knots[i])/h,0,1)
 return (2*t**3-3*t**2+1)*values[i]+(t**3-2*t**2+t)*h*m[i]+(-2*t**3+3*t**2)*values[i+1]+(t**3-t**2)*h*m[i+1]
sections=np.array([pchip(x,xs,row) for row in rows]);i=np.clip(np.searchsorted(ys,y,side='right')-1,0,len(ys)-2);t=np.clip((y-ys[i])/(ys[i+1]-ys[i]),0,1);t=t*t*(3-2*t);k=np.arange(len(p));target=sections[i,k]*(1-t)+sections[i+1,k]*t
# Compress only protruding vertices. Mapping remains monotone along Z and
# retains 15 percent of the local height surplus, preserving solid thickness.
q=p.copy();q[:,2]-=np.maximum(0,z-target)*window*.85
sculpt_delta=np.linalg.norm(q-p,axis=1)
o.data.vertices.foreach_set('co',q.astype(np.float32).ravel());o.data.update()
vg=o.vertex_groups.new(name='ONLY sunk alar cap seams; all other anatomy locked')
for j,w in enumerate(window):
 if w>0:vg.add([j],float(w),'REPLACE')
bpy.context.view_layer.objects.active=o
mod=o.modifiers.new('Fair alar shoulders into retained nasal root','SMOOTH');mod.vertex_group=vg.name;mod.factor=.62;mod.iterations=80
bpy.ops.object.modifier_apply(modifier=mod.name)
for f in o.data.polygons:f.use_smooth=True
bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();o.data.update()
after=np.array([tuple(v.co) for v in o.data.vertices],dtype=np.float64)
# The hidden unmodified source is part of the editable inherited Blend.
source=bpy.data.objects['SOURCE unmodified learned-face-v02, hidden']
base=np.array([tuple(v.co) for v in source.data.vertices],dtype=np.float64)
protected=base[~((np.abs(base[:,0])>.010)&(np.abs(base[:,0])<.141)&(base[:,1]>2.672)&(base[:,1]<2.783)&(base[:,2]>.218))]
keys={tuple(np.round(v,7)) for v in after};unmatched=[v.tolist() for v in protected if tuple(np.round(v,7)) not in keys]
if unmatched:raise RuntimeError('Unrelated original vertices moved: '+str(len(unmatched)))
bm=bmesh.new();bm.from_mesh(o.data)
topo={'vertices':len(bm.verts),'triangles':sum(len(f.verts)-2 for f in bm.faces),'boundaryEdges':sum(e.is_boundary for e in bm.edges),'nonmanifoldEdges':sum(not e.is_manifold for e in bm.edges),'signedVolumeUnits3':bm.calc_volume(signed=True),'euler':len(bm.verts)-len(bm.edges)+len(bm.faces)};bm.free()
if topo['boundaryEdges'] or topo['nonmanifoldEdges']:raise RuntimeError('Nasal sculpt broke closure')
bpy.ops.object.select_all(action='DESELECT');o.hide_set(False);o.select_set(True);root.select_set(True);bpy.context.view_layer.objects.active=o
bpy.context.view_layer.update();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'central-face.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'central-face.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_materials='NONE',export_vertex_color='NONE',export_texcoords=True,export_normals=True)
shutil.copy2(__file__,OUT/'build-source.py')
report={'status':'local-nasal-section-sculpt-unaccepted-candidate','photographicAcceptance':False,'sourceCommit':'8082e52','sourceAsset':'learned-face-v03-nasal','sourceAssetSha256':hashlib.sha256((SRC/'central-face.glb').read_bytes()).hexdigest(),'underlyingLearnedFaceAssetSha256':hashlib.sha256((BASE/'central-face.glb').read_bytes()).hexdigest(),'previousCandidate':'nasal87: closed openings but objectionable spherical wings, preserved and rejected','topology':topo,'controlSectionsArtistYUp':{'absX':xs.tolist(),'Y':ys.tolist(),'Zrows':rows.tolist(),'method':'Monotone cubic X interpolation and smooth Y blending; explicit numeric sculpture sections, no image input'},'compression':{'surplusRetention':.15,'maxMovementUnits':float(sculpt_delta.max())},'localFairing':{'factor':.62,'iterations':80,'maxMovementUnits':float(np.linalg.norm(after-q,axis=1).max()),'weightedVertices':int((window>0).sum())},'protectedOriginalVertices':len(protected),'protectedVerticesMissingOrMoved':len(unmatched),'operationBoundsArtistYUp':{'absX':[.010,.141],'Y':[2.672,2.783],'ZGreaterThan':.218},'bitmapLoaded':False,'imagesUsed':False,'materialsChanged':False,'placementChanged':False,'cameraChanged':False,'neckCrownBodyChanged':False,'editableSourceAndClosureSolidsInBlend':True,'limitations':['Artist-guided local repair of a learned mesh; exact historical anatomy remains unmeasured.','Nose-side volume and nasal recesses require native photographic comparison.','Mouth, eyes and other learned facial differences deliberately remain unchanged.','Closed topology alone is not visual acceptance.']}
for name in ['central-face.glb','central-face.blend','build-source.py']:report[name+'Sha256']=hashlib.sha256((OUT/name).read_bytes()).hexdigest()
(OUT/'build-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('NASAL_LOCAL_SECTION_SCULPT',json.dumps({'topology':topo,'maxSectionMovement':float(sculpt_delta.max()),'maxFairMovement':float(np.linalg.norm(after-q,axis=1).max()),'unrelatedVerticesMoved':len(unmatched)}),flush=True)
