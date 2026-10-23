"""Rigid licensed head replacement on retained independent side figures.

Run through tools/run-blender-queued.mjs. Actual SC07 solids are clipped,
closed and attached by a small neck overlap. No photograph maps are loaded.
The source scan face is never non-rigidly warped to the reference.
"""
import bpy, bmesh, json, math, struct, hashlib, os, array
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(os.getcwd())
LEGACY=ROOT/'reconstructions/scene-06/assets/sculptural-cast-r11'
FOUNDATION=ROOT/'reconstructions/scene-06/assets/foundation-r08'
OUT=ROOT/'reconstructions/scene-06/assets/attendant-faces-v3'
QA=ROOT/'lookdev/scene06-monumental-altar-v3/attendant-face-build'
OUT.mkdir(parents=True,exist_ok=True);QA.mkdir(parents=True,exist_ok=True)
old=json.loads((LEGACY/'manifest.json').read_text())
new=json.loads((FOUNDATION/'manifest.json').read_text())
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def read_object(path,name):
    raw=path.read_bytes();magic,n,ni,_,_=struct.unpack_from('<4sIIII',raw)
    assert magic==b'SC07' and len(raw)==20+n*32+ni*4
    p=array.array('f');p.frombytes(raw[20:20+n*12])
    ix=array.array('I');ix.frombytes(raw[20+n*32:])
    me=bpy.data.meshes.new(name);me.vertices.add(n);me.vertices.foreach_set('co',p)
    me.loops.add(ni);me.loops.foreach_set('vertex_index',ix)
    me.polygons.add(ni//3);me.polygons.foreach_set('loop_start',range(0,ni,3));me.polygons.foreach_set('loop_total',[3]*(ni//3));me.update()
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);return ob

def close_and_audit(ob,clip_below=None):
    bm=bmesh.new();bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=0.0000008)
    if clip_below is not None:
        bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=0.0000005,plane_co=(0,clip_below,0),plane_no=(0,1,0),clear_outer=True,clear_inner=False)
    # Remove isolated voxel dust from the preserved fused construction.
    seen=set();small=[]
    for start in bm.verts:
        if start in seen:continue
        stack=[start];seen.add(start);component=[]
        while stack:
            v=stack.pop();component.append(v)
            for e in v.link_edges:
                q=e.other_vert(v)
                if q not in seen:seen.add(q);stack.append(q)
        if len(component)<50:small.extend(component)
    if small:bmesh.ops.delete(bm,geom=small,context='VERTS')
    boundary=[e for e in bm.edges if e.is_boundary]
    if boundary:bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.normal_update()
    audit={'vertices':len(bm.verts),'faces':len(bm.faces),'boundaryEdges':sum(e.is_boundary for e in bm.edges),'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges),'removedDustVertices':len(small)}
    if audit['boundaryEdges'] or audit['nonManifoldEdges']:raise RuntimeError(str(audit))
    bm.to_mesh(ob.data);bm.free();ob.data.update()
    for p in ob.data.polygons:p.use_smooth=True
    return audit

def export(ob,variant,material):
    me=ob.data;me.calc_loop_triangles();p=array.array('f');n=array.array('f');uv=array.array('f');ix=array.array('I')
    for v in me.vertices:p.extend(v.co);n.extend(v.normal);uv.extend((.5,.5))
    for t in me.loop_triangles:ix.extend(t.vertices)
    raw=struct.pack('<4sIIII',b'SC07',len(me.vertices),len(ix),0,0)+p.tobytes()+n.tobytes()+uv.tobytes()+ix.tobytes()
    sha=hashlib.sha256(raw).hexdigest();name=f'{variant}-{material}-{sha[:16]}.bin';(OUT/name).write_bytes(raw)
    bounds=[[min(v.co[k] for v in me.vertices)for k in range(3)],[max(v.co[k]for v in me.vertices)for k in range(3)]]
    return {'material':material,'file':name,'vertices':len(me.vertices),'triangles':len(ix)//3,'sha256':sha,'bytes':len(raw),'bounds':bounds}

manifest={'revision':'scene06-attendant-faces-v3','format':new['format'],'variants':{},'materials':{'face':new['materials']['face'],'buddha':new['materials']['cloth']},'sourceAttribution':new['sourceAttribution'],'visualAccepted':False,'scope':'Actual rigidly fitted head/ears/neck core, closed cut on independent R11 side figures; separate original dark cap/crown and different side pose retained.'}
review={'status':'closed-mesh-source-built-unaccepted','visualAccepted':False,'source':'foundation-r08 real beachmouse CC BY4 head','sourceFaceNonRigidWarp':False,'neckAttachment':'Original side body cut/closed atY2.54; rigid new core beginsY2.52 and overlaps0.02 modelunits. No open cap, flange or image surface.','variants':{}}
for variant in['left','right']:
    parts=old['variants'][variant];body=read_object(LEGACY/next(p['file']for p in parts if p['material']=='buddha'),variant+'-closed-retained-body')
    body_audit=close_and_audit(body,2.54)
    core=read_object(FOUNDATION/new['faceCore']['parts'][0]['file'],variant+'-real-licensed-head-core')
    # Uniform rigid normalization preserves the complete scanned face.
    scale=.76;offset=Vector((0,2.52-2.07*scale,0));angle=.025 if variant=='left' else -.025
    rotation=Matrix.Rotation(angle,3,'Y')
    for v in core.data.vertices:v.co=rotation@(v.co*scale)+offset
    head_audit=close_and_audit(core)
    emitted=[export(body,variant,'buddha'),export(core,variant,'face')]
    for p in parts:
        if p['material']=='buddha':continue
        item=dict(p);item['file']=os.path.relpath((LEGACY/p['file']).resolve(),OUT);emitted.append(item)
    manifest['variants'][variant]=emitted
    review['variants'][variant]={'body':body_audit,'head':head_audit,'rigidScale':scale,'neckOverlap':.02,'sourceFile':new['faceCore']['parts'][0]['file'],'parts':emitted}

(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
(OUT/'provenance.json').write_text(json.dumps({'sourceAttribution':new['sourceAttribution'],'sourceURL':'https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab','license':'CC-BY-4.0','licenseURL':'https://creativecommons.org/licenses/by/4.0/','changes':'Actual scan head/ears/neck core rigidly scaled/placed, open cut perimeters closed, connected by0.02unit neck overlap to clipped independently authored prior body. Legacy separate crown/hairstyle and side pose retained. No source images or RGB maps.','provenanceLimit':'Creator records Japanese tea garden in California; maker/date/manufacturing origin undocumented. Different statue from supplied photograph.','visualAccepted':False},indent=2))
(QA/'geometry-report.json').write_text(json.dumps(review,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(QA/'editable-attendants.blend'))
print(json.dumps({'status':'closed-side-casts-exported','out':str(OUT),'visualAccepted':False}))
