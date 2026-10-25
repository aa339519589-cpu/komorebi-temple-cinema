# Reviewed pure CPU authoring only: no render, viewport draw, scene export,
# blend save, UV bake, image/depth access or GPU operation. Run only through
# the exact Root-reviewed CPU runner, with four Blender/BLAS CPU threads.
import os
for key in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','VECLIB_MAXIMUM_THREADS','NUMEXPR_NUM_THREADS'):
    os.environ[key]='4'
import bpy
import numpy as np
from mathutils import Quaternion, Vector, Matrix
from pathlib import Path
import json, gzip, hashlib, struct, shutil, tempfile, math, time, traceback, subprocess

HERE=Path(__file__).resolve().parent
LANE=HERE.parent
ROOT=LANE.parent.parent
CONFIG_FILE=HERE/'pose-r06.json'
C=json.loads(CONFIG_FILE.read_text())
CONTACT_HELPER=HERE/C['contactSolver']['helper']
if hashlib.sha256(CONTACT_HELPER.read_bytes()).hexdigest()!=C['contactSolver']['sha256']:
    raise RuntimeError('Exact bounded physical contact helper changed')
SUPPORT_FILE=HERE/C['supportConstraints']['file']
GENERATOR_FILE=HERE/C['supportConstraints']['generator']
support_bytes=SUPPORT_FILE.read_bytes()
if hashlib.sha256(support_bytes).hexdigest()!=C['supportConstraints']['sha256']:
    raise RuntimeError('Exact actual cuff support targets changed')
if hashlib.sha256(GENERATOR_FILE.read_bytes()).hexdigest()!=C['supportConstraints']['generatorSha256']:
    raise RuntimeError('Exact actual source constraint generator changed')
SUPPORT=json.loads(support_bytes)
if SUPPORT['sourceRawSha256']!=C['sourceRawSha256'] or SUPPORT['actualR04RawSha256']!=C['supportConstraints']['actualR04RawSha256']:
    raise RuntimeError('Support target source/control identity mismatch')
OUT=LANE/('authored-'+C['revision'])
if OUT.exists():
    raise RuntimeError('Preserve existing authored output: '+str(OUT))
lock=Path(tempfile.gettempdir())/'komorebi-reviewed-cpu-authoring.lock'
owner=json.loads(lock.read_text())
if owner['pid']!=os.getppid() or owner['recipe']!=C['recipe']:
    raise RuntimeError('Exact parent Root-reviewed CPU runner and owned lock required')
if not bpy.app.background:
    raise RuntimeError('Background CPU-only authoring required')
sha=lambda data:hashlib.sha256(data).hexdigest()
SOURCE=ROOT/'reconstructions/scene-06/assets'/C['sourceAsset']
source_manifest_bytes=(SOURCE/'manifest.json').read_bytes()
if sha(source_manifest_bytes)!=C['sourceManifestSha256']:
    raise RuntimeError('Original manifest changed')
M=json.loads(source_manifest_bytes)
D=M['variants']['central'][0]
packed=(SOURCE/D['file']).read_bytes()
if sha(packed)!=D['sha256']:
    raise RuntimeError('Original packed source changed')
raw=gzip.decompress(packed)
if sha(raw)!=C['sourceRawSha256']:
    raise RuntimeError('Original raw source changed')
magic,n,ni,_,_=struct.unpack_from('<5I',raw)
if magic!=0x37304353 or len(raw)!=20+n*32+ni*4:
    raise RuntimeError('Original SC07 identity/layout failed')
P0=np.frombuffer(raw,dtype='<f4',count=n*3,offset=20).reshape((-1,3))
N0=np.frombuffer(raw,dtype='<f4',count=n*3,offset=20+n*12).reshape((-1,3))
I=np.frombuffer(raw,dtype='<u4',count=ni,offset=20+n*32).reshape((-1,3))
HBASE=LANE/C['handControlAsset']
hmanifest_bytes=(HBASE/'manifest.json').read_bytes()
if sha(hmanifest_bytes)!=C['handControlManifestSha256']:
    raise RuntimeError('Frozen original-hand manifest changed')
HM=json.loads(hmanifest_bytes)
hdef=HM['variants']['central'][0]
hpacked=(HBASE/hdef['file']).read_bytes()
if sha(hpacked)!=C['handControlPackedSha256']:
    raise RuntimeError('Frozen original-hand control changed')
hraw=gzip.decompress(hpacked)
if sha(hraw)!=C['handControlRawSha256'] or struct.unpack_from('<I',hraw,4)[0]!=n:
    raise RuntimeError('Frozen hand raw/index identity changed')
HP=np.frombuffer(hraw,dtype='<f4',count=n*3,offset=20).reshape((-1,3))
source_hashes={str(Path(__file__).resolve()):sha(Path(__file__).read_bytes()),str(CONFIG_FILE):sha(CONFIG_FILE.read_bytes()),str(SOURCE/'manifest.json'):sha(source_manifest_bytes),str(HBASE/'manifest.json'):sha(hmanifest_bytes),str(SUPPORT_FILE):sha(support_bytes),str(GENERATOR_FILE):sha(GENERATOR_FILE.read_bytes()),str(CONTACT_HELPER):sha(CONTACT_HELPER.read_bytes())}
OUT.mkdir()
receipt={'revision':C['revision'],'status':'cpu-authoring-active','startedAt':time.time(),'sourceHashes':source_hashes,'canonicalModified':False,'visualAccepted':False,'photographicFidelityAccepted':False}
try:
    # Broad actual source context; boundary and original rear/central/upper body
    # pins surround a wide free garment area instead of one thin DQ seam.
    patch=C['patch']
    keep=(P0[:,0]>patch['minX'])&(P0[:,1]>patch['minY'])&(P0[:,1]<patch['maxY'])
    faces_keep=np.all(keep[I],axis=1)
    original_faces=np.flatnonzero(faces_keep).astype(np.uint32)
    global_ids=np.unique(I[faces_keep]).astype(np.uint32)
    local_map=np.full(n,-1,dtype=np.int32)
    local_map[global_ids]=np.arange(len(global_ids),dtype=np.int32)
    F=local_map[I[faces_keep]].astype(np.int32)
    rest=P0[global_ids].astype(np.float64)
    x,y,z=rest.T
    pins=C['bodyPins']
    body=(z<pins['rearMaxZ'])|((x<pins['chestMaxX'])&(z<pins['chestMaxZ']))|((y>=pins['upperMinY'])&(z<pins['upperMaxZ']))|(y<=pins['lowMaxY'])
    original_degree=np.bincount(I.reshape(-1),minlength=n)
    local_degree=np.bincount(I[faces_keep].reshape(-1),minlength=n)
    boundary=local_degree[global_ids]<original_degree[global_ids]
    # Two fixed rings ensure source boundary positions/normals remain coherent.
    for _ in range(pins['boundaryRings']-1):
        grow=np.zeros(len(global_ids),dtype=bool)
        grow[np.unique(F[np.any(boundary[F],axis=1)])]=True
        boundary|=grow
    body|=boundary
    fold=C.get('sourceFoldPins')
    fold_pin=np.zeros(len(global_ids),dtype=bool)
    if fold:
        fold_pin=np.all(rest>=np.asarray(fold['min']),axis=1)&np.all(rest<=np.asarray(fold['max']),axis=1)
        body|=fold_pin
    shoulder=C['shoulderAnchor']
    body|=np.linalg.norm(rest-np.asarray(shoulder['point']),axis=1)<shoulder['radius']
    h=C['handAnchors']
    hand=(x>h['minX'])&(y>h['minY'])&(z>h['minZ'])
    E=np.asarray(C['elbowSource'],dtype=np.float64)
    Et=np.asarray(C['elbowTarget'],dtype=np.float64)
    W=np.asarray(C['wristSource'],dtype=np.float64)
    Wt=np.asarray(C['wristTarget'],dtype=np.float64)
    elbow=np.linalg.norm(rest-E,axis=1)<C['elbowAnchorRadius']
    body&=~hand
    elbow&=~body&~hand
    support=np.zeros(len(global_ids),dtype=bool)
    support_final=np.zeros((len(global_ids),3),dtype=np.float64)
    support_groups=[]
    for section in SUPPORT['groups']:
        ids=np.asarray([r['vertex'] for r in section['records']],dtype=np.int32)
        lids=local_map[ids]
        if np.any(lids<0) or np.any(body[lids]|hand[lids]|elbow[lids]|support[lids]):
            raise RuntimeError('Whole source cuff profile conflicts with an existing anchor or patch')
        targets=np.asarray([r['target'] for r in section['records']],dtype=np.float64)
        support[lids]=True
        support_final[lids]=targets
        c0=np.mean(rest[lids],axis=0)
        c1=np.mean(targets,axis=0)
        U,_,Vh=np.linalg.svd((rest[lids]-c0).T@(targets-c1))
        rotation=Vh.T@U.T
        if np.linalg.det(rotation)<0:
            Vh[2]*=-1
            rotation=Vh.T@U.T
        residual=targets-((rest[lids]-c0)@rotation.T+c1)
        support_groups.append({'localIDs':lids,'sourceCenter':c0,'targetCenter':c1,'rotation':Matrix(rotation.tolist()).to_quaternion(),'residual':residual,'targets':targets,'station':section['sourceYStation']})
    anchored=body|hand|elbow|support
    if not np.any(hand) or not np.any(elbow) or np.sum(~anchored)<1000:
        raise RuntimeError('Actual source anchor/free domain failed')
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob,do_unlink=True)
    mesh=bpy.data.meshes.new('source295-r06-actual-local-indexed-patch')
    mesh.from_pydata(rest.tolist(),[],F.tolist())
    mesh.update()
    obj=bpy.data.objects.new('source295-r06-cpu-differential-arm-cloth',mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active=obj
    obj.select_set(True)
    group=obj.vertex_groups.new(name='actual-source-body-hand-elbow-anchors')
    group.add(np.flatnonzero(anchored).tolist(),1.0,'REPLACE')
    mod=obj.modifiers.new('CPU-source-detail-preserving-local-pose','LAPLACIANDEFORM')
    mod.vertex_group=group.name
    mod.iterations=C['solver']['iterations']
    bpy.ops.object.laplaciandeform_bind(modifier=mod.name)
    if not mod.is_bind:
        raise RuntimeError('CPU Laplacian source bind failed')
    qh=Quaternion(C['handQuaternionWXYZ'])
    qf=Quaternion(C['forearmQuaternionWXYZ'])
    identity=Quaternion((1.0,0.0,0.0,0.0))
    local=rest.copy()
    solved=np.empty((len(global_ids),3),dtype=np.float32)
    steps=C['solver']['continuationSteps']
    hand_global=global_ids[hand]
    def evaluate_coordinates(coordinates):
        mesh.vertices.foreach_set('co',np.asarray(coordinates,dtype=np.float32).reshape(-1))
        mesh.update()
        bpy.context.view_layer.update()  # CPU depsgraph evaluation; no draw.
        graph=bpy.context.evaluated_depsgraph_get()
        evaluated=obj.evaluated_get(graph)
        evaluated_mesh=evaluated.to_mesh(preserve_all_data_layers=False,depsgraph=graph)
        eval_indices=np.empty(len(F)*3,dtype=np.int32)
        evaluated_mesh.loops.foreach_get('vertex_index',eval_indices)
        if not np.array_equal(eval_indices.reshape((-1,3)),F):
            raise RuntimeError('Position-only solver changed local triangle/index order')
        if len(evaluated_mesh.vertices)!=len(global_ids):
            raise RuntimeError('Position-only solver changed local topology')
        evaluated_mesh.vertices.foreach_get('co',solved.reshape(-1))
        evaluated.to_mesh_clear()
        return solved.astype(np.float64)
    for step in range(1,steps+1):
        t=step/steps
        path=math.sin(math.pi*t)
        hq=identity.slerp(qh,t)
        fq=identity.slerp(qf,t)
        hc=(1-t)*W+t*Wt+np.array([C['solver']['handPathOuterArc']*path,0,C['solver']['handPathFrontArc']*path])
        ec=(1-t)*E+t*Et+np.array([0,0,C['solver']['elbowPathFrontArc']*path])
        hand_target=np.asarray([hq@Vector(p-W)+Vector(hc) for p in rest[hand]],dtype=np.float64)
        elbow_target=np.asarray([fq@Vector(p-E)+Vector(ec) for p in rest[elbow]],dtype=np.float64)
        if step==steps:
            # Exact actual original-hand target, not any rejected R03 garment.
            hand_target=HP[hand_global].astype(np.float64)
        support_step=np.zeros_like(rest)
        for section in support_groups:
            lids=section['localIDs']
            sq=identity.slerp(section['rotation'],t)
            center=(1-t)*section['sourceCenter']+t*section['targetCenter']+np.array([C['solver']['supportPathOuterArc']*path,0,C['solver']['supportPathFrontArc']*path])
            support_step[lids]=np.asarray([sq@Vector(p-section['sourceCenter'])+Vector(center) for p in rest[lids]],dtype=np.float64)+t*section['residual']
            if step==steps:
                support_step[lids]=section['targets']
        local[body]=rest[body]
        local[hand]=hand_target
        local[elbow]=elbow_target
        local[support]=support_step[support]
        local=evaluate_coordinates(local)
        local[body]=rest[body]
        local[hand]=hand_target
        local[elbow]=elbow_target
        local[support]=support_step[support]
        if not np.all(np.isfinite(local)):
            raise RuntimeError('Nonfinite differential solve')
        print(json.dumps({'event':'cpu-local-differential-pose-step','step':step,'steps':steps,'freeVertices':int(np.sum(~anchored))}),flush=True)
    # Keep the successful complete profile supports. Actual free-layer contacts
    # become small positional constraints, with original-source order controls.
    # The only child process is this exact hash-pinned CPU numerical helper;
    # Blender synchronously waits and does no work while the helper runs.
    base_anchored=anchored.copy()
    active=np.zeros(len(global_ids),dtype=bool)
    active_final=np.zeros_like(rest)
    contact_history=[]
    best_contact_state=None
    best_contact_score=(float('inf'),float('inf'))
    cs=C['contactSolver']
    node=shutil.which('node')
    if not node:
        raise RuntimeError('Exact CPU contact helper needs local Node runtime')
    for contact_iteration in range(cs['maximumIterations']+1):
        roles=np.zeros(len(global_ids),dtype=np.uint32)
        roles[body]=1
        roles[hand]=2
        roles[elbow]=3
        roles[support]=4
        roles[active]=5
        compact=np.empty((len(global_ids),5),dtype='<u4')
        compact[:,0]=global_ids
        compact[:,1:4]=np.asarray(local,dtype='<f4').view('<u4')
        compact[:,4]=roles
        position_file=OUT/('contact-%02d-local-positions.bin'%contact_iteration)
        report_file=OUT/('contact-%02d-layer-proposals.json'%contact_iteration)
        position_bytes=struct.pack('<4s4I',b'CP06',n,len(global_ids),20,1)+compact.tobytes()
        position_file.write_bytes(position_bytes)
        child_env=os.environ.copy()
        child_env['UV_THREADPOOL_SIZE']='1'
        subprocess.run([node,'--v8-pool-size=3',str(CONTACT_HELPER),str(position_file),str(report_file),json.dumps(cs['settings'],separators=(',',':'))],cwd=str(ROOT),env=child_env,check=True)
        contact=json.loads(report_file.read_text())
        if contact['sourceRawSha256']!=C['sourceRawSha256'] or contact['localPositionSha256']!=sha(position_bytes):
            raise RuntimeError('Contact proposal did not analyze this exact local source geometry')
        summary={k:contact[k] for k in ('newStrictCrossingPairs','inheritedStrictCrossingPairs','categories','actionablePairs','microscopicPairsBelowActionDepth','blockedHardConstraintPairs','maximumProposedVertexStep')}
        summary.update(iteration=contact_iteration,positions=position_file.name,report=report_file.name)
        contact_history.append(summary)
        score=(contact['actionablePairs'],contact['newStrictCrossingPairs'])
        if score<best_contact_score:
            best_contact_score=score
            best_contact_state={'iteration':contact_iteration,'local':local.copy(),'active':active.copy(),'targets':active_final.copy(),'report':contact}
        print(json.dumps(dict(event='cpu-bounded-source-contact-pass',**summary)),flush=True)
        if not contact['corrections'] or not contact['actionablePairs'] or contact_iteration==cs['maximumIterations']:
            break
        for correction in contact['corrections']:
            v=correction['vertex']
            lid=int(local_map[v]) if 0<=v<n else -1
            if lid<0 or base_anchored[lid]:
                raise RuntimeError('Contact helper attempted to move a hard original body/hand/elbow/profile control')
            target=np.asarray(correction['target'],dtype=np.float64)
            current=np.asarray(correction['current'],dtype=np.float64)
            if not np.all(np.isfinite(target)) or np.linalg.norm(target-current)>cs['settings']['maxStep']*1.001:
                raise RuntimeError('Unbounded/nonfinite physical contact proposal')
            if np.linalg.norm(local[lid]-current)>1e-6:
                raise RuntimeError('Contact original vertex position identity mismatch')
            active[lid]=True
            active_final[lid]=target
        anchored=base_anchored|active
        # Rebind the original rest patch with the expanded physical controls.
        # Four small continuation stages preserve the existing pose branch.
        if mod.is_bind:
            bpy.ops.object.laplaciandeform_bind(modifier=mod.name)
        mesh.vertices.foreach_set('co',np.asarray(rest,dtype=np.float32).reshape(-1))
        mesh.update()
        obj.vertex_groups.remove(group)
        group=obj.vertex_groups.new(name='actual-source-body-hand-elbow-anchors')
        group.add(np.flatnonzero(anchored).tolist(),1.0,'REPLACE')
        mod.vertex_group=group.name
        bpy.ops.object.laplaciandeform_bind(modifier=mod.name)
        if not mod.is_bind:
            raise RuntimeError('Original rest rebind with contact controls failed')
        local=rest.copy()
        for replay in range(1,cs['rebindContinuationSteps']+1):
            t=replay/cs['rebindContinuationSteps']
            path=math.sin(math.pi*t)
            hq=identity.slerp(qh,t)
            fq=identity.slerp(qf,t)
            hc=(1-t)*W+t*Wt+np.array([C['solver']['handPathOuterArc']*path,0,C['solver']['handPathFrontArc']*path])
            ec=(1-t)*E+t*Et+np.array([0,0,C['solver']['elbowPathFrontArc']*path])
            hand_target=np.asarray([hq@Vector(p-W)+Vector(hc) for p in rest[hand]],dtype=np.float64)
            elbow_target=np.asarray([fq@Vector(p-E)+Vector(ec) for p in rest[elbow]],dtype=np.float64)
            if replay==cs['rebindContinuationSteps']:
                hand_target=HP[hand_global].astype(np.float64)
            support_step=np.zeros_like(rest)
            for section in support_groups:
                lids=section['localIDs']
                sq=identity.slerp(section['rotation'],t)
                center=(1-t)*section['sourceCenter']+t*section['targetCenter']+np.array([C['solver']['supportPathOuterArc']*path,0,C['solver']['supportPathFrontArc']*path])
                support_step[lids]=np.asarray([sq@Vector(p-section['sourceCenter'])+Vector(center) for p in rest[lids]],dtype=np.float64)+t*section['residual']
                if replay==cs['rebindContinuationSteps']:
                    support_step[lids]=section['targets']
            active_step=(1-t)*rest[active]+t*active_final[active]+np.array([cs['activePathOuterArc']*path,0,cs['activePathFrontArc']*path])
            if replay==cs['rebindContinuationSteps']:
                active_step=active_final[active]
            local[body]=rest[body]
            local[hand]=hand_target
            local[elbow]=elbow_target
            local[support]=support_step[support]
            local[active]=active_step
            local=evaluate_coordinates(local)
            local[body]=rest[body]
            local[hand]=hand_target
            local[elbow]=elbow_target
            local[support]=support_step[support]
            local[active]=active_step
            if not np.all(np.isfinite(local)):
                raise RuntimeError('Nonfinite local contact-constrained differential solve')
        print(json.dumps({'event':'cpu-local-contact-rebind-complete','pass':contact_iteration+1,'activePhysicalControls':int(np.sum(active))}),flush=True)
    selected_contact_iteration=best_contact_state['iteration']
    local=best_contact_state['local']
    active=best_contact_state['active']
    active_final=best_contact_state['targets']
    contact=best_contact_state['report']
    anchored=base_anchored|active
    print(json.dumps({'event':'cpu-selected-bounded-contact-state','iteration':selected_contact_iteration,'actionable':contact['actionablePairs'],'raw':contact['newStrictCrossingPairs']}),flush=True)
    P=P0.copy()
    P[global_ids]=local.astype(np.float32)
    protected=(P0[:,1]>=C['protected']['headAtOrAboveY'])|(P0[:,0]<=C['protected']['rightAtOrBelowX'])|(P0[:,1]<=C['protected']['legsAtOrBelowY'])
    P[protected]=P0[protected]
    changed=np.any(P!=P0,axis=1)
    touched_faces=np.any(changed[I],axis=1)
    touched=np.zeros(n,dtype=bool)
    touched[np.unique(I[touched_faces])]=True
    incident=np.any(touched[I],axis=1)
    IF=I[incident]
    def geom_normals(pos):
        normals=np.zeros((n,3),dtype=np.float64)
        pp=pos[IF].astype(np.float64)
        cross=np.cross(pp[:,1]-pp[:,0],pp[:,2]-pp[:,0])
        for j in range(3):
            np.add.at(normals,IF[:,j],cross)
        lengths=np.linalg.norm(normals[touched],axis=1)
        if np.any(lengths<1e-20):
            raise RuntimeError('Zero actual modified surface normal')
        normals[touched]/=lengths[:,None]
        return normals
    G0=geom_normals(P0)
    G1=geom_normals(P)
    N=N0.copy()
    normal_values=G1[touched]+N0[touched]-G0[touched]
    normal_values/=np.linalg.norm(normal_values,axis=1)[:,None]
    N[touched]=normal_values.astype(np.float32)
    # The entire retained original hand gets its exact rigid source-normal
    # transport; free cloth gets its actually recomputed geometric normal.
    N[hand_global]=np.asarray([qh@Vector(no) for no in N0[hand_global]],dtype=np.float32)
    N[protected]=N0[protected]
    if np.any(P[protected]!=P0[protected]) or np.any(N[protected]!=N0[protected]):
        raise RuntimeError('Protected source head/right/leg attributes changed')
    if not np.all(np.isfinite(P)) or not np.all(np.isfinite(N)):
        raise RuntimeError('Nonfinite final source attributes')
    before=P0[I[touched_faces]].astype(np.float64)
    after=P[I[touched_faces]].astype(np.float64)
    old_cross=np.cross(before[:,1]-before[:,0],before[:,2]-before[:,0])
    new_cross=np.cross(after[:,1]-after[:,0],after[:,2]-after[:,0])
    old_area=np.linalg.norm(old_cross,axis=1)
    new_area=np.linalg.norm(new_cross,axis=1)
    if np.any(new_area<1e-13):
        raise RuntimeError('Degenerate source triangles after solve')
    ratios=new_area/old_area
    # Coherent local one-ring rotation field for a meaningful orientation
    # diagnostic; world-space normal dot alone would flag real arm rotation.
    edges=np.concatenate((F[:,[0,1]],F[:,[1,2]],F[:,[2,0]]))
    edges=np.unique(np.sort(edges,axis=1),axis=0)
    e0=rest[edges[:,1]]-rest[edges[:,0]]
    e1=local[edges[:,1]]-local[edges[:,0]]
    covariance=np.zeros((len(global_ids),3,3),dtype=np.float64)
    outer=e1[:,:,None]*e0[:,None,:]
    np.add.at(covariance,edges[:,0],outer)
    np.add.at(covariance,edges[:,1],outer)
    U,_,Vh=np.linalg.svd(covariance)
    sign=np.linalg.det(U@Vh)
    U[:,:,2]*=np.where(sign<0,-1,1)[:,None]
    rotations=U@Vh
    local_before=rest[F]
    local_after=local[F]
    old_no=np.cross(local_before[:,1]-local_before[:,0],local_before[:,2]-local_before[:,0])
    new_no=np.cross(local_after[:,1]-local_after[:,0],local_after[:,2]-local_after[:,0])
    expected=np.einsum('fij,fj->fi',np.mean(rotations[F],axis=1),old_no)
    opposed=int(np.sum(np.einsum('fi,fi->f',new_no,expected)<-1e-18))
    output=bytearray(raw)
    output[20:20+n*12]=P.astype('<f4').tobytes()
    output[20+n*12:20+n*24]=N.astype('<f4').tobytes()
    if output[20+n*24:]!=raw[20+n*24:]:
        raise RuntimeError('Original UV/index bytes changed')
    compressed=gzip.compress(bytes(output),compresslevel=7,mtime=0)
    digest=sha(compressed)
    filename='central-left-arm-pose295-r06-differential-'+digest[:16]+'-gzip.bin'
    (OUT/filename).write_bytes(compressed)
    coverage=M['scalpMaterial']['coverage']
    cover=(SOURCE/coverage['file']).read_bytes()
    if sha(cover)!=coverage['sha256']:
        raise RuntimeError('Original CM07 source changed')
    (OUT/coverage['file']).write_bytes(cover)
    for filename_license in ('LICENSE-DONOR173-CC-BY-4.0-ATTRIBUTION.txt','LICENSE-NC-SOURCE-CC-BY-NC-SA-4.0.txt'):
        shutil.copyfile(SOURCE/filename_license,OUT/filename_license)
    shutil.copyfile(CONFIG_FILE,OUT/CONFIG_FILE.name)
    shutil.copyfile(SUPPORT_FILE,OUT/SUPPORT_FILE.name)
    anchor_kind=np.zeros(len(global_ids),dtype=np.uint32)
    anchor_kind[body]=1
    anchor_kind[hand]=2
    anchor_kind[elbow]=3
    anchor_kind[support]=4
    anchor_kind[active]=5
    trace=np.column_stack((global_ids.astype(np.uint32),anchor_kind)).astype('<u4')
    trace_file='actual-source-local-vertex-anchor-identities295-r06.bin'
    (OUT/trace_file).write_bytes(struct.pack('<5I',0x3430414c,n,len(global_ids),8,1)+trace.tobytes())
    audit={'sourceVertices':n,'sourceTriangles':ni//3,'authoredVertices':n,'authoredTriangles':ni//3,'localVertices':len(global_ids),'localTriangles':len(F),'freeClothAndSkinVertices':int(np.sum(~anchored)),'initialFreeClothAndSkinVertices':int(np.sum(~base_anchored)),'activePhysicalContactAnchors':int(np.sum(active)),'activeContactTargetMaxError':float(np.max(np.linalg.norm(P[global_ids[active]]-active_final[active],axis=1))) if np.any(active) else 0.0,'boundedContactHistory':contact_history,'selectedBoundedContactIteration':selected_contact_iteration,'contactCorrectionPassMaximum':cs['maximumIterations'],'boundedContactScope':contact['scope'],'finalBoundedActionableCrossings':contact['actionablePairs'],'finalBoundedRawStrictCrossings':contact['newStrictCrossingPairs'],'finalBoundedMicroscopicCrossings':contact['microscopicPairsBelowActionDepth'],'finalBlockedHardConstraintPairs':contact['blockedHardConstraintPairs'],'fixedBodyAndBoundaryAnchors':int(np.sum(body)),'realOriginalHandAnchors':int(np.sum(hand)),'originalElbowAnchors':int(np.sum(elbow)),'wholeCuffProfileSupportAnchors':int(np.sum(support)),'fixedOriginalFoldPanelVertices':int(np.sum(fold_pin)),'wholeCuffTargetMaxError':float(np.max(np.linalg.norm(P[global_ids[support]]-support_final[support],axis=1))),'wholeProfileTranslations':[g['translation'] for g in SUPPORT['groups']],'boundaryPinnedRings':pins['boundaryRings'],'sourceElbowVertex':C['elbowSourceVertex'],'actualPosedElbowAnchor':P[C['elbowSourceVertex']].astype(float).tolist(),'elbowTarget':C['elbowTarget'],'sourceShoulderPositionOrNormalChanges':int(np.any(P[C['shoulderSourceVertex']]!=P0[C['shoulderSourceVertex']]) or np.any(N[C['shoulderSourceVertex']]!=N0[C['shoulderSourceVertex']])),'changedPositions':int(np.sum(changed)),'changedNormals':int(np.sum(np.any(N!=N0,axis=1))),'protectedPositionOrNormalChanges':0,'sourceHandTargetMaxError':float(np.max(np.linalg.norm(P[hand_global]-HP[hand_global],axis=1))),'indicesAndTriangleOrderByteExact':True,'uvByteExact':True,'scalpCoverageByteExact':True,'vertexAndTriangleIdentityMapping':'Output vertex v and triangle t retain R08a identity v/t, with no appended/reordered vertices or triangles.','localMinimumTwiceArea':float(np.min(new_area)),'localDegenerateTriangles':0,'localAreaRatioPercentiles':dict(zip(('minimum','p01','median','p99','maximum'),map(float,np.quantile(ratios,[0,.01,.5,.99,1])))),'triangleNormalsOpposedToLocalNeighborRotationField':opposed,'normalOrientationDiagnosticScope':'Source local one-ring closest proper rotations. Not a complete collision or injectivity proof.','selfIntersectionsChecked':False,'solver':C['solver'],'visualAccepted':False}
    attribution='Scan-the-World Sainsbury Amida, https://doi.org/10.5281/zenodo.21353739, CC BY-NC-SA4.0; preserved R08a head/ear/scalp derivative additionally incorporates source-supported Buddha head by peel-3d.com, https://sketchfab.com/3d-models/buddha-head-fb17c123ad9c4c0fb6baf723b3fffd79, CC BY4.0, culture/period unspecified. POSE295 R06 is an explicitly declared local differential-coordinate left-arm/garment pose adaptation. Original source hand/finger vertices are rigid anchor targets retained from the R03 hand-only pose; the rejected R03 body is not adopted. R06 adds actual fixed-leg roof support constraints on three complete original cuff profiles; every profile translates rigidly upward and elbowward from its real R04 shape without radial squeezing, and restores the broad neighboring folded cloth to the free differential domain. Bounded actual wrist/sleeve-root strict triangle contacts add small source-order-preserving physical layer-separation controls, with local neighbor propagation and original rest rebinds; inherited source pairs, microscopic residuals and hard-control conflicts are separately reported. This does not claim global intersection freedom. Source chest/rear/large upper sleeve/boundary controls stay fixed while the broad actual neighboring cloth/skin patch is solved in CPU Blender Laplacian Deform. Head/ears/scalp Y>=2.10, figure-right X<=0, legs Y<=.70, bearing/contact band, all original vertex/triangle/UV identities and CM07 mask remain exact from R08a. Actual body and left-arm/palm positions/normals are declared modified. No photograph, depth map, image plane, synthetic hand primitive, scene export or raster sampling is used. Original inputs, source ancestry, licenses and all failed candidates remain retained. Personal noncommercial CC BY-NC-SA4.0 adaptation only; no endorsement implied.'
    mesh_definition=dict(D, file=filename,sha256=digest,uncompressedSha256=sha(output),effectiveGeometrySha256=sha(output),bytes=len(compressed),uncompressedBytes=len(output),topology=dict(D['topology'],poseDerivative=True,sourceIndexOrderExact=True))
    manifest=dict(M,revision='scene06-centralpose295-r06-differential-left-arm-lap-pose',attribution=attribution,visualAccepted=False,photographicFidelityAccepted=False,productionIntegrated=False,variants={'central':[mesh_definition]},sourceContactBearing=dict(M['sourceContactBearing'],bodyUnchangedFrom199R06=False,bodyUnchangedFromR08a=False,contactBandPositionsUnchanged=True,method=M['sourceContactBearing']['method'].replace('below the unchanged body','below the contact-band-preserved posed body')),poseDerivative={'sourceRevision':M['revision'],'sourceGeometrySha256':C['sourceRawSha256'],'sourceManifest':'../sculpture199-r08a-continuous-source-fit-mixed-licenses/manifest.json','sourceBodyAndLeftPalmChanged':True,'sourceIndexMapping':'identity','config':C,'solver':'CPU Blender Laplacian Deform over a broad actual source patch, fixed body/shoulder/boundary and original hand/elbow controls plus actual fixed-leg contact constraints on three whole original cuff profiles.',
        'actualCuffSupportConstraints':dict(C['supportConstraints'],sourceFoldPins=C['sourceFoldPins']),'activePhysicalContacts':C['contactSolver'],'inputHistoricalAttribution':M['attribution'],'handOnlyControl':{'sourceRevision':HM['revision'],'packedSha256':C['handControlPackedSha256'],'rawSha256':C['handControlRawSha256'],'vertices':int(np.sum(hand)),'scope':C['handControlScope']},'sourceAnchors':{'file':trace_file,'sha256':sha((OUT/trace_file).read_bytes()),'format':'LA04 header sourceVertices/localRecords/recordBytes8/version1; uint32 original vertex ID and kind0free1body2hand3elbow4wholeCuffSupport5activePhysicalContact.'},'audit':audit},nativeMaterialStudyChange='Original metallic PBR and CM07 scalp material remain; only actual source left arm/neighbor garments and their corresponding physical normals are modified.')
    provenance={'revision':manifest['revision'],'license':manifest['license'],'licenseUrl':manifest['licenseUrl'],'attribution':attribution,'sourceLicenses':manifest['sourceLicenses'],'source':D,'geometry':mesh_definition,'poseDerivative':manifest['poseDerivative'],'builder':{'file':str(Path(__file__).resolve()),'sourceHashes':source_hashes,'BlenderVersion':bpy.app.version_string},'visualAccepted':False,'photographicFidelityAccepted':False,'limits':C['limitations']}
    for name,value in (('manifest.json',manifest),('provenance.json',provenance),('preflight.json',audit)):
        (OUT/name).write_text(json.dumps(value,indent=2)+'\n')
    for name,digest_expected in source_hashes.items():
        if sha(Path(name).read_bytes())!=digest_expected:
            raise RuntimeError('CPU authoring source changed during execution')
    receipt.update(status='cpu-authored-local-differential-pose-awaiting-native-review',audit=audit,geometry=mesh_definition)
    print(json.dumps(receipt,indent=2),flush=True)
except Exception as error:
    receipt.update(status='failed',error=traceback.format_exc())
    (OUT/'author-result.json').write_text(json.dumps(receipt,indent=2)+'\n')
    raise
finally:
    receipt['completedAt']=time.time()
    (OUT/'author-result.json').write_text(json.dumps(receipt,indent=2)+'\n')
