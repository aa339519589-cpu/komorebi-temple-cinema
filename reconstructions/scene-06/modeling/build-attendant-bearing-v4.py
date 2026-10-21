"""Raise authored side-figure collar/shoulder bearings, preserving real heads.

Official runner: tools/run-blender-queued.mjs. No scan vertices, face shapes,
head positions, photographs or material pixels are changed by this build.
"""
import bpy,bmesh,json,struct,hashlib,array,os,math
from pathlib import Path

ROOT=Path(os.getcwd());BASE=ROOT/'reconstructions/scene-06/assets/attendant-faces-v3'
OUT=ROOT/'reconstructions/scene-06/assets/attendant-bearing-v4';OUT.mkdir(parents=True,exist_ok=True)
QA=ROOT/'lookdev/scene06-monumental-altar-v3/attendant-bearing-build';QA.mkdir(parents=True,exist_ok=True)
source=json.loads((BASE/'manifest.json').read_text())
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def read_mesh(path,name):
    raw=path.read_bytes();magic,n,ni,_,_=struct.unpack_from('<4sIIII',raw);assert magic==b'SC07' and len(raw)==20+n*32+ni*4
    p=array.array('f');p.frombytes(raw[20:20+n*12]);ix=array.array('I');ix.frombytes(raw[20+n*32:])
    me=bpy.data.meshes.new(name);me.vertices.add(n);me.vertices.foreach_set('co',p);me.loops.add(ni);me.loops.foreach_set('vertex_index',ix)
    me.polygons.add(ni//3);me.polygons.foreach_set('loop_start',range(0,ni,3));me.polygons.foreach_set('loop_total',[3]*(ni//3));me.update()
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);return ob

def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)

def write_mesh(ob,variant):
    me=ob.data;me.calc_loop_triangles();p=array.array('f');n=array.array('f');uv=array.array('f');ix=array.array('I')
    for v in me.vertices:p.extend(v.co);n.extend(v.normal);uv.extend((.5,.5))
    for t in me.loop_triangles:ix.extend(t.vertices)
    raw=struct.pack('<4sIIII',b'SC07',len(me.vertices),len(ix),0,0)+p.tobytes()+n.tobytes()+uv.tobytes()+ix.tobytes();sha=hashlib.sha256(raw).hexdigest();name=f'{variant}-buddha-{sha[:16]}.bin';(OUT/name).write_bytes(raw)
    return {'material':'buddha','file':name,'vertices':len(me.vertices),'triangles':len(ix)//3,'bytes':len(raw),'sha256':sha,'bounds':[[min(v.co[k]for v in me.vertices)for k in range(3)],[max(v.co[k]for v in me.vertices)for k in range(3)]]}

manifest={**source,'revision':'scene06-attendant-bearing-v4','variants':{},'scope':'Real rigid side heads/caps/crowns unchanged fromV3; authored body upper collar and shoulder bearing raised smoothly under the neck. Different legacy side poses retained.','visualAccepted':False}
report={'status':'authored-bearing-source-built-unaccepted','visualAccepted':False,'scanFaceVerticesChanged':False,'sourceHeadFilesChanged':False,'variants':{}}
for variant,parts in source['variants'].items():
    original=next(p for p in parts if p['material']=='buddha');ob=read_mesh(BASE/original['file'],variant+'-authored-raised-collar-and-shoulder-bearing')
    moved=0;maximum=0
    for v in ob.data.vertices:
        x,y,z=v.co;r=math.hypot(x,z)
        # Broad shoulder/clavicle support rises under the retained actual jaw.
        # The smooth field decays through the same continuous body and upper
        # sleeve roots; independent palms/forearms belowY2.20 remain fixed.
        dy=.18*smooth((y-2.20)/.34)*(1-smooth((r-.55)/.35))
        if dy>0:v.co.y+=dy;moved+=1;maximum=max(maximum,dy)
    bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=0.0000008);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.normal_update()
    audit={'boundaryEdges':sum(e.is_boundary for e in bm.edges),'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges)}
    assert audit['boundaryEdges']==0 and audit['nonManifoldEdges']==0,audit
    bm.to_mesh(ob.data);bm.free();ob.data.update()
    for p in ob.data.polygons:p.use_smooth=True
    emitted=[write_mesh(ob,variant)]
    for p in parts:
        if p['material']=='buddha':continue
        q=dict(p);q['file']=os.path.relpath((BASE/p['file']).resolve(),OUT);emitted.append(q)
        # Preserve an editable assembled side figure alongside the source.
        preview=read_mesh((BASE/p['file']).resolve(),variant+'-unchanged-'+p['material']);preview.location.x=-1.25 if variant=='left' else 1.25
    ob.location.x=-1.25 if variant=='left' else 1.25
    manifest['variants'][variant]=emitted
    report['variants'][variant]={'authoredBodyVerticesMoved':moved,'maximumCollarRise':maximum,'topology':audit,'parts':emitted}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
(OUT/'provenance.json').write_text(json.dumps({'sourceAttribution':source['sourceAttribution'],'license':'CC-BY-4.0','sourceURL':'https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab','changes':'Actual rigid head/ear/neck and separate crown bytes reused unchanged fromV3. Only authored body upper collar/shoulder vertices rise under the existing jaw; full body remains closed. No images or scan deformation.','provenanceLimit':'Creator records Japanese tea garden inCalifornia; maker/date/manufacturing origin undocumented. Different sculpture from reference.','visualAccepted':False},indent=2))
(QA/'geometry-report.json').write_text(json.dumps(report,indent=2));bpy.ops.wm.save_as_mainfile(filepath=str(QA/'editable-attendants-bearing.blend'))
print(json.dumps({'status':'closed-side-bearings-exported','out':str(OUT),'visualAccepted':False}))
