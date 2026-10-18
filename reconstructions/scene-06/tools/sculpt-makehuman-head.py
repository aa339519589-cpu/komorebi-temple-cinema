"""CC0 MakeHuman skin topology, reshaped as an unselected gilt sculpture study.

Coordinates remain source Y-up/+Z-front. No photograph is used as a texture or
vertex displacement. The photograph is a manual silhouette/feature reference.
Run through the shared Blender queue; this builder writes editable geometry.
"""
import bpy, bmesh, json, math, os, hashlib
from pathlib import Path
from collections import Counter
from mathutils import Vector

BASE=Path(__file__).resolve().parents[1]
SRC=BASE/'assets/makehuman/source'
OUT=Path(os.environ.get('HEAD_STUDY_OUTPUT', str(BASE.parents[1]/'qa/ten-reference/06/makehuman-head-study')))
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
verts=[];faces=[];uv=[];faceuv=[];group=''
for line in (SRC/'base.obj').read_text().splitlines():
    s=line.split()
    if not s: continue
    if s[0]=='v': verts.append([float(c) for c in s[1:4]])
    elif s[0]=='vt': uv.append([float(c) for c in s[1:3]])
    elif s[0]=='g': group=s[1]
    elif s[0]=='f' and group=='body':
        parts=[c.split('/') for c in s[1:]]
        faces.append([int(c[0])-1 for c in parts]);faceuv.append([int(c[1])-1 for c in parts])
for line in (SRC/'asian-male-young.target').read_text().splitlines():
    s=line.split()
    if not s or s[0].startswith('#'): continue
    i=int(s[0]);verts[i]=[v+float(d) for v,d in zip(verts[i],s[1:4])]

def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)
def brush(x,y,cx,cy,rx,ry):
    # Compact, C1 vertex-sculpt falloff on an existing anatomical topology.
    r=math.hypot((x-cx)/rx,(y-cy)/ry)
    return (1-smooth(r)) if r<1 else 0

# Retain the connected head, both auricles and the neck. Helpers, teeth, eyes,
# genitals and all other bodies are absent. The one lower boundary is buried
# inside the existing garment; it is capped after deformation.
keep=[k for k,f in enumerate(faces) if min(verts[i][1] for i in f)>5.45]
used=sorted({i for k in keep for i in faces[k]});remap={v:i for i,v in enumerate(used)}
co=[]
for i in used:
    x,y,z=verts[i];ax=abs(x);side=1 if x>=0 else -1
    # Half-closed, downward-looking lids: compress the existing palpebral
    # anatomy, retaining upper/lower lid folds rather than overlaying a cord.
    eye=brush(ax,y,.325,7.015,.31,.29)*smooth((z-.85)/.25)
    lid_line=6.995+.018*((ax-.325)/.23)**2
    y += (lid_line-y)*.91*eye
    # Full zygomatic pads and soft lower cheek, directly on the skin surface.
    cheek=brush(ax,y,.40,6.61,.30,.47)*smooth((z-.65)/.45)
    x += side*.072*cheek;z += .080*cheek
    # Compact rounded mandible, keeping the genuine chin-to-throat transition.
    jaw=brush(ax,y,.30,6.03,.43,.35)*smooth((z-.40)/.50)
    x += side*.050*jaw
    chin=brush(x,y,0,5.98,.35,.24)*smooth((z-.65)/.40)
    y += .035*chin;z += .032*chin
    # Modest sculptural mouth: keep the real lip loops, close their aperture,
    # lower the labial unit slightly and broaden the lower lip cushion.
    mouth=brush(x,y,0,6.35,.34,.23)*smooth((z-1.05)/.20)
    y -= .045*mouth
    z += .018*mouth
    # Subtly raised brow ridge; all change is geometric, no painted brow.
    brow=brush(ax,y,.31,7.27,.32,.14)*smooth((z-.75)/.35)
    z += .035*brow
    # Lengthen the actual closed ear lobule. Temporal attachment is retained
    # by fading to zero across the medial root; the helix/concha topology stays.
    ear=smooth((ax-.635)/.075)*(1-smooth((y-7.39)/.13))
    if z<.88 and y>6.48:
        lobe=1-smooth((y-6.55)/.53)
        y -= .57*ear*lobe
        z += .09*ear*lobe
    # Fit the Asian head to the selected statue, preserving head position and
    # upper facial anchors. Widen the existing neck rather than adding collars.
    localy=2.900+(y-7.020)*.460
    neck=1-smooth((localy-2.33)/.20)
    x*=.465*(1+.33*neck)
    localz=(z-.55)*.24+.05
    # Continuous anterior neck has a modest full throat, no incised torus ring.
    localz += .038*neck*smooth((z-.05)/.50)
    co.append((x,localy,localz))
mesh=bpy.data.meshes.new('CC0 Asian head-neck connected skin control cage')
mesh.from_pydata(co,[],[[remap[i] for i in faces[k]] for k in keep]);mesh.update()
layer=mesh.uv_layers.new(name='makehumanUV')
for p,k in zip(mesh.polygons,keep):
    for li,ti in zip(p.loop_indices,faceuv[k]):layer.data[li].uv=uv[ti]
obj=bpy.data.objects.new('scene06 CC0 sculpted continuous head auricles neck',mesh)
bpy.context.collection.objects.link(obj);bpy.context.view_layer.objects.active=obj;obj.select_set(True)
bm=bmesh.new();bm.from_mesh(mesh);boundary=[e for e in bm.edges if e.is_boundary]
cap=bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
for p in mesh.polygons:p.use_smooth=True
obj['assetLicense']='CC0-1.0; MakeHuman base mesh and Asian male young target'
obj['scope']='Unselected source06 anatomical candidate; manual low-camera photo anchors; no photograph textures.'
obj['neck']='Same skin control cage as head and auricles, capped only below visible garment.'
sub=obj.modifiers.new('Anatomical quad-surface refinement','SUBSURF');sub.levels=2;sub.render_levels=2
mat=bpy.data.materials.new('study gilt same native face RGB metalness roughness');mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF')
# Source Three colour #c69a43 converted to linear RGB.
def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
bs.inputs['Base Color'].default_value=tuple(linear(v/255) for v in (198,154,67))+(1,)
bs.inputs['Metallic'].default_value=.88;bs.inputs['Roughness'].default_value=.31
mesh.materials.append(mat)
bpy.context.view_layer.update()
eval_obj=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());baked=eval_obj.to_mesh()
baked.calc_loop_triangles()
positions=[round(c,7) for v in baked.vertices for c in v.co]
normals=[round(c,7) for v in baked.vertices for c in v.normal]
indices=[i for t in baked.loop_triangles for i in t.vertices]
# Runtime skin is generated geometry. Neutral UVs suffice for existing gilt
# microstructure; the official UVs stay editable on the control cage in .blend.
uvs=[c for v in baked.vertices for c in ((v.co.x+.5),v.co.y-2.1)]
data={'position':positions,'normal':normals,'uv':uvs,'index':indices}
asset=BASE/'src/buddha-head-sculpt-data.js'
asset.write_text('// Generated from official CC0 MakeHuman skin; see ../tools/sculpt-makehuman-head.py.\nexport const HEAD_SCULPT='+json.dumps(data,separators=(',',':'))+';\n')
edgecounts=Counter(tuple(sorted((t.vertices[k],t.vertices[(k+1)%3]))) for t in baked.loop_triangles for k in range(3))
receipt={'status':'unselected-candidate','bodyBase':'root 7f095dd / selected seat-contact32','vertices':len(baked.vertices),'triangles':len(baked.loop_triangles),'boundaryEdges':sum(n==1 for n in edgecounts.values()),'nonmanifoldEdges':sum(n>2 for n in edgecounts.values()),'geometryAsset':str(asset),'assetSha256':hashlib.sha256(asset.read_bytes()).hexdigest(),'photoAlbedo':False,'cameraMustRemain':'reference06 selected low camera','anatomicalRecoveryClaim':False}
(OUT/'mesh-receipt.json').write_text(json.dumps(receipt,indent=2))
eval_obj.to_mesh_clear()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'editable-makehuman-head.blend'))
print('HEAD_SCULPT_BUILT',json.dumps(receipt),flush=True)
