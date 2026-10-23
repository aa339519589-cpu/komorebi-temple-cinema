"""Fuse intersecting sculptural construction sections into actual cast meshes.

Run only through tools/run-blender-queued.mjs. This is offline mesh generation,
not a frame generator. Runtime images remain the actual Three.js scene.
"""
import bpy, bmesh, json, math, struct, hashlib, os, time
from pathlib import Path
import numpy as np

ROOT=Path(os.getcwd())
RAW=ROOT/'qa/ten-reference/06/sculptural-cast-r7-build/raw'
OUT=ROOT/'reconstructions/scene-06/assets/sculptural-cast-r8'
OUT.mkdir(parents=True,exist_ok=True)
source=json.loads((RAW/'manifest.json').read_text())
started=time.time()
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def raw_object(part,variant):
    data=(RAW/part['file']).read_bytes()
    magic,n,ni=struct.unpack_from('<4sII',data)
    assert magic==b'R7RW'
    vertices=np.frombuffer(data,dtype='<f4',count=n*3,offset=12).reshape(-1,3)
    triangles=np.frombuffer(data,dtype='<u4',count=ni,offset=12+n*12).reshape(-1,3)
    mesh=bpy.data.meshes.new(variant+'-'+part['material'])
    mesh.vertices.add(n);mesh.vertices.foreach_set('co',vertices.ravel())
    mesh.loops.add(ni);mesh.loops.foreach_set('vertex_index',triangles.ravel())
    mesh.polygons.add(ni//3)
    mesh.polygons.foreach_set('loop_start',np.arange(0,ni,3,dtype=np.int32))
    mesh.polygons.foreach_set('loop_total',np.full(ni//3,3,dtype=np.int32))
    mesh.update();obj=bpy.data.objects.new(mesh.name,mesh);bpy.context.collection.objects.link(obj)
    return obj

def activate(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]

def trim_at_y(obj,height,keep_below):
    bm=bmesh.new();bm.from_mesh(obj.data)
    # Weld the duplicated parametric meridians first. Without this, a clipped
    # loft rim is an open chain and cannot form a reliable solid volume.
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
    cut=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.000001,plane_co=(0,height,0),plane_no=(0,1,0),clear_outer=keep_below,clear_inner=not keep_below)
    edges=[e for e in cut['geom_cut'] if isinstance(e,bmesh.types.BMEdge) and e.is_boundary]
    if edges:bmesh.ops.holes_fill(bm,edges=edges,sides=0)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.normal_update();bm.to_mesh(obj.data);bm.free();obj.data.update()

def scanned_head():
    # Fralin/UVA CC0 structured-light anatomy. Only true mesh positions and
    # topology are used; the source PLY's RGB properties are never serialized.
    path=ROOT/'reconstructions/scene-06/assets/cc0-fralin-buddha-head/BuddhaHead_surfmerg_remesh.ply'
    bpy.ops.wm.ply_import(filepath=str(path));head=bpy.context.object;head.name='Fralin-CC0-retargeted-real-head-anatomy'
    def smooth01(x):
        x=max(0,min(1,x));return x*x*(3-2*x)
    for v in head.data.vertices:
        # The source is already +Y up, +Z front with an identity import matrix.
        # The isolated +Z inspection camera had a pi roll, which caused the
        # rejected r8-01 orientation. Fit the verified world axes directly.
        x=v.co.x*.0057;y=v.co.y*.0086+2.99;z=v.co.z*.0038+.09
        if y<2.53:
            taper=.75+.25*smooth01((y-2.32)/.21);x*=taper;z=.02+(z-.02)*taper
        # Sculpt the submandibular transition into the retained ringed neck.
        # A flat clipped head underside is visible from the low source camera.
        if y<2.46 and not (abs(x)>.32 and z<.17):
            t=smooth01((y-2.40)/.06);x*=.84+.16*t;z=.006+(z-.006)*(.78+.22*t)
        if z>0 and 2.40<y<2.49:z-=.005*math.exp(-((y-2.452)/.012)**2)*max(0,1-(x/.20)**4)
        # Extend only the rear, lateral auricles; leave cheeks/jaw untouched.
        ear=smooth01((abs(x)-.30)/.05)*(1-smooth01((z-.16)/.08))*smooth01((3.03-y)/.10)
        y-=.12*ear*smooth01((3.03-y-.02)/.28)
        if ear>.30 and y<2.59:y=2.59-(2.59-y)*.5
        # Remove the source artifact's eroded circular urna depression as real
        # surface sculpture; the small reference bead is cast onto this plane.
        r2=(x/.070)**2+((y-3.21)/.075)**2
        if z>.23 and r2<1:z+=max(0,.310-z)*(1-r2)**.5
        v.co=(x,y,z)
    # Retain the existing photographed three-ring throat below the chin.
    trim_at_y(head,3.32,True);trim_at_y(head,2.40,False)
    activate([head]);relax=head.modifiers.new('Preserve anatomy, soften submillimetre scan erosion','SMOOTH');relax.factor=.24;relax.iterations=3;bpy.ops.object.modifier_apply(modifier=relax.name)
    # Restore the eroded urna socket as the photographed small raised bead.
    # This is finite cast geometry, unioned with the scanned forehead.
    front=max(v.co.z for v in head.data.vertices if abs(v.co.x)<.025 and 3.195<v.co.y<3.225)
    fills=[]
    for name,center,scale in [('raised-cast-urna',(0,3.21,front+.002),(.013,.015,.010)),('rounded-left-auricle-lobe',(-.345,2.70,.02),(.045,.170,.075)),('rounded-right-auricle-lobe',(.345,2.70,.02),(.045,.170,.075))]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=center);o=bpy.context.object;o.name=name;o.scale=scale;activate([o]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);fills.append(o)
    activate([head]+fills);bpy.ops.object.join()
    return head

def mesh_stats(mesh,clean_object=None):
    # Union-find checks the physical components of the modeled surface. A
    # component count is topology evidence, never photographic acceptance.
    n=len(mesh.vertices);parent=np.arange(n,dtype=np.int32);size=np.ones(n,dtype=np.int32)
    def find(a):
        while parent[a]!=a:
            parent[a]=parent[parent[a]];a=parent[a]
        return a
    edges=np.empty(len(mesh.edges)*2,dtype=np.int32);mesh.edges.foreach_get('vertices',edges)
    for a,b in edges.reshape(-1,2):
        a=find(a);b=find(b)
        if a!=b:
            if size[a]<size[b]:a,b=b,a
            parent[b]=a;size[a]+=size[b]
    counts=sorted((int(size[i]) for i in range(n) if parent[i]==i),reverse=True)
    # Two 8-vertex voxel specks appeared beneath the distal toes in the first
    # bake. They are discretization debris, not anatomy; remove only components
    # smaller than 64 vertices, never a substantial disconnected body part.
    small={i for i in range(n) if parent[i]==i and size[i]<64}
    if clean_object is not None and small and len(counts)>1:
        selected=[i for i in range(n) if find(i) in small]
        activate([clean_object]);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='DESELECT');bpy.ops.object.mode_set(mode='OBJECT')
        for i in selected:mesh.vertices[i].select=True
        bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.delete(type='VERT');bpy.ops.object.mode_set(mode='OBJECT')
        mesh.update();mesh.calc_loop_triangles();stats=mesh_stats(mesh);stats['removedVoxelSpeckVertices']=len(selected);return stats
    return {'vertices':n,'triangles':len(mesh.loop_triangles),'connectedComponents':len(counts),'largestComponents':counts[:16],'largestComponentFraction':counts[0]/n if n else 0}

def save_mesh(obj,variant,material,inspect_topology=False):
    mesh=obj.data
    for p in mesh.polygons:p.use_smooth=True
    mesh.update();mesh.calc_loop_triangles()
    topology=mesh_stats(mesh,obj) if inspect_topology else None
    p=np.empty(len(mesh.vertices)*3,dtype='<f4');mesh.vertices.foreach_get('co',p)
    n=np.empty(len(mesh.vertices)*3,dtype='<f4');mesh.vertices.foreach_get('normal',n)
    indices=np.empty(len(mesh.loop_triangles)*3,dtype='<u4');mesh.loop_triangles.foreach_get('vertices',indices)
    points=p.reshape(-1,3)
    # Neutral cylindrical object UVs serve only the procedural gold micrograin.
    uv=np.empty((len(mesh.vertices),2),dtype='<f4')
    uv[:,0]=np.arctan2(points[:,0],points[:,2])/(2*math.pi);uv[:,1]=points[:,1]*.31
    name=f'{variant}-{material}.bin'
    data=struct.pack('<4sIIII',b'SC07',len(mesh.vertices),len(indices),0,0)+p.tobytes()+n.tobytes()+uv.tobytes()+indices.tobytes()
    (OUT/name).write_bytes(data)
    item={'material':material,'file':name,'vertices':len(mesh.vertices),'triangles':len(indices)//3,'sha256':hashlib.sha256(data).hexdigest(),'bounds':[points.min(axis=0).tolist(),points.max(axis=0).tolist()]}
    if inspect_topology:item['topology']=topology
    return item

manifest={'revision':'scene06-sculptural-cast-r8','format':'SC07:20-byte header, float32 position/normal/uv, uint32 triangle indices','variants':{},'visualAccepted':False}
for variant,parts in source['variants'].items():
    core=[];separate=[]
    for part in parts:
        obj=raw_object(part,variant)
        if part['material'] in ['central','buddha','cloth','hand','face']:core.append(obj)
        elif not (variant=='central' and part['material']=='crease'):separate.append((obj,part['material']))
        else:bpy.data.objects.remove(obj,do_unlink=True)
    activate(core);bpy.ops.object.join();obj=core[0];obj.name=variant+'-continuous-cast'
    if variant=='central':
        # Remove the old smooth procedural head entirely, rather than stacking
        # a scanned surface over it. A closed neckline overlaps the new real
        # head and is physically unioned below with the body and hands.
        trim_at_y(obj,2.49,True);head=scanned_head();activate([obj,head]);bpy.ops.object.join()
        bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free();obj.data.update()
    remesh=obj.modifiers.new('Physical union of cast body, hands and robe','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.0045;remesh.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smooth=obj.modifiers.new('Relax voxel stair steps, preserve sculptural planes','SMOOTH');smooth.factor=.23;smooth.iterations=2
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    decimate=obj.modifiers.new('Surface-preserving export density','DECIMATE');decimate.ratio=.36;decimate.use_collapse_triangulate=True
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    material='central' if variant=='central' else 'buddha'
    manifest['variants'][variant]=[save_mesh(obj,variant,material,True)]
    for o,m in separate:
        activate([o])
        # Fine cast flowers and hair curls are heavily oversampled in source.
        # Weld their duplicate parametric seams before reducing export density.
        bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.00002);bpy.ops.object.mode_set(mode='OBJECT')
        detail=o.modifiers.new('Preserve chased casting silhouette, reduce redundant samples','DECIMATE');detail.ratio=.32 if m=='gold' else .65;detail.use_collapse_triangulate=True
        bpy.ops.object.modifier_apply(modifier=detail.name)
        manifest['variants'][variant].append(save_mesh(o,variant,m))
    print(json.dumps({'event':'fused-cast','variant':variant,'core':manifest['variants'][variant][0]}),flush=True)

(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
provenance={'asset':'scene06-sculptural-cast-r8','createdUtc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'method':'Editable procedural body/cloth and signed-distance hands with a genuine CC0 structured-light head mesh replacing the central procedural head. Closed neckline, scanned head, body, and hands are physically voxel-unioned, gently relaxed, and decimated. No image projection, depth photograph mesh, AI frame, image plane, photographic texture, or source RGB used.','reference':'references/hd/4-照片-5.jpg, visual proportion/pose comparison only','anatomicalBase':'assets/cc0-fralin-buddha-head/provenance.json','source':source['source'],'sourceSha256':source['sourceSha256'],'generator':'reconstructions/scene-06/modeling/build-sculptural-cast.mjs','fuser':'reconstructions/scene-06/modeling/fuse-sculptural-cast.py','blenderVersion':bpy.app.version_string,'voxelSizeModelUnits':.0045,'decimateRatio':.36,'elapsedSeconds':time.time()-started,'visualAccepted':False,'limits':['A valid connected cast mesh does not establish a photo match.','The anatomical source is a different historical artifact, retargeted as a real 3D modeling base; it is not claimed as a scan of the photographed statue.','Voxel union may soften features finer than 4.5mm in pre-conversion model units.','The indoor light field and carved mandorlas remain separate reconstruction candidates.']}
(OUT/'provenance.json').write_text(json.dumps(provenance,indent=2))
print(json.dumps({'event':'cast-assets-written','out':str(OUT),'elapsedSeconds':time.time()-started}),flush=True)
