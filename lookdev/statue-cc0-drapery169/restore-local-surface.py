"""Bounded, feature-aware local CC0 surface restoration; plain CPU only.

R03 is a read-only input. This changes existing vertices only, in explicit
front-knee erosion and torso-chatter masks. Topology, cap nodes, mount loops,
source trace and macro anatomy remain available unchanged in R03.
"""
from pathlib import Path
import argparse,hashlib, importlib.util, json, math,os
import numpy as np
from scipy.spatial import cKDTree

HERE=Path(__file__).resolve().parent
PARENT=HERE/'r03'
parser=argparse.ArgumentParser()
parser.add_argument('--variant',choices=['conservative','iteration-02'],default='iteration-02')
ARGS=parser.parse_args()
FOCUSED=ARGS.variant=='iteration-02'
DEST=HERE/'r04-local-restoration'
if FOCUSED:DEST=DEST/'iteration-02'
DEST.mkdir(exist_ok=True,parents=True)
spec=importlib.util.spec_from_file_location('cloth169_export',HERE/'build-components.py')
B=importlib.util.module_from_spec(spec);spec.loader.exec_module(B)
parent_manifest=json.loads((PARENT/'manifest.json').read_text())
ANCHOR=np.array(parent_manifest['originSurfaceAnchor']['point'])

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def relative(path):return os.path.relpath(path,DEST)
def smoothstep(a,b,x):
    t=np.clip((x-a)/(b-a),0,1)
    return t*t*(3-2*t)

def weld_for_analysis(p,normal):
    """Coordinate lookup only; output indices/topology are never welded."""
    keys={};groups=[];inverse=[]
    for i,key in enumerate(map(tuple,np.round(p,7))):
        if key not in keys:keys[key]=len(groups);groups.append([])
        groups[keys[key]].append(i);inverse.append(keys[key])
    inverse=np.array(inverse,dtype=np.int32)
    q=np.array([p[g[0]]for g in groups])
    n=np.array([normal[g].mean(0)for g in groups]);n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-20)
    return q,n,inverse,groups

def coherent_sharp_edges(q,faces):
    """Protect source crease chains, not every noisy erosion triangle edge."""
    fn=np.cross(q[faces[:,1]]-q[faces[:,0]],q[faces[:,2]]-q[faces[:,0]])
    fn/=np.maximum(np.linalg.norm(fn,axis=1,keepdims=True),1e-20)
    edges={}
    for fi,face in enumerate(faces):
        for a,b in zip(face,np.roll(face,-1)):
            if a==b:continue
            edges.setdefault(tuple(sorted((int(a),int(b)))),[]).append(fi)
    directions={}
    for (a,b),fs in edges.items():
        if len(fs)!=2 or float(fn[fs[0]]@fn[fs[1]])>math.cos(math.radians(65)):continue
        direction=q[b]-q[a];direction/=max(np.linalg.norm(direction),1e-20)
        directions.setdefault(a,[]).append(direction);directions.setdefault(b,[]).append(direction)
    locked=np.zeros(len(q),dtype=bool)
    for vertex,ds in directions.items():
        for i in range(len(ds)):
            if any(abs(float(ds[i]@ds[j]))>.86 for j in range(i+1,len(ds))):locked[vertex]=True;break
    return locked

def ellipsoid(p,center,radii):
    d=np.linalg.norm((p-np.array(center))/np.array(radii),axis=1)
    return 1-smoothstep(.52,1,d)

def spatial_mask(name,p,n):
    source=p+ANCHOR
    if name=='crossed-knees-hips':
        patches=[dict(name='left_front_knee_erosion',center=[-.39,.632,.355],radii=[.225,.080,.215]),
                 dict(name='right_front_knee_erosion',center=[.37,.601,.385],radii=[.250,.065,.215])]
        mask=np.maximum.reduce([ellipsoid(source,pl['center'],pl['radii'])for pl in patches])
        # These are front knee faces, not the crossed instep/upper robe ridge.
        mask*=smoothstep(-.12,.32,n[:,2])
        return mask,patches,dict(radius=.055 if FOCUSED else .040,maxOutward=.010,maxInward=.003 if FOCUSED else .0015,quantile=.72,mode='local erosion fill')
    patches=[dict(name='front_chest_chatter',center=[.035,1.235,-.325],radii=[.285,.190,.130]),
             dict(name='lower_front_cloak_chatter',center=[.015,1.020,-.185],radii=[.255,.225,.125])]
    mask=np.maximum.reduce([ellipsoid(source,pl['center'],pl['radii'])for pl in patches])
    mask*=smoothstep(.0,.35,n[:,2])
    return mask,patches,dict(radius=.028 if FOCUSED else .018,maxOutward=.003 if FOCUSED else .0018,maxInward=.003 if FOCUSED else .0018,quantile=.50,mode='local chatter attenuation')

def robust_quadratic_target(i,q,n,tree,radius,quantile):
    ids=np.array(tree.query_ball_point(q[i],radius),dtype=np.int32)
    if len(ids)<14:return None
    delta=q[ids]-q[i];dist=np.linalg.norm(delta,axis=1)
    spatial=np.exp(-(dist/(radius*.62))**2)
    macro=np.sum(n[ids]*spatial[:,None],axis=0)
    macro/=max(np.linalg.norm(macro),1e-20)
    if macro@n[i]<0:macro=-macro
    compatible=(n[ids]@macro)>.12
    ids=ids[compatible];delta=delta[compatible];dist=dist[compatible];spatial=spatial[compatible]
    if len(ids)<14:return None
    axis=np.eye(3)[np.argmin(np.abs(macro))]
    u=np.cross(macro,axis);u/=np.linalg.norm(u);v=np.cross(macro,u)
    x=delta@u/radius;y=delta@v/radius;z=delta@macro
    design=np.stack([np.ones(len(ids)),x,y,x*x,x*y,y*y],axis=1)
    normal_weight=np.maximum(n[ids]@macro,.12)**.35
    base=spatial*normal_weight
    beta=np.zeros(6)
    for _ in range(5):
        residual=z-design@beta
        median=np.median(residual);scale=max(1.4826*np.median(np.abs(residual-median)),.00025)
        huber=1/np.maximum(1,np.abs(residual)/(scale*1.6))
        asym=np.where(residual>=0,quantile,1-quantile)
        weights=base*huber*asym
        lhs=design.T@(weights[:,None]*design)+np.eye(6)*weights.sum()*1e-8
        if np.linalg.cond(lhs)>2e5:return None
        beta=np.linalg.solve(lhs,design.T@(weights*z))
    # A coherent one-direction normal change indicates a garment crease.
    # Erosion chatter is less directional, so it receives more restoration.
    nn=n[ids];mean=np.average(nn,axis=0,weights=spatial);centered=nn-mean
    covariance=(centered*spatial[:,None]).T@centered/max(spatial.sum(),1e-20)
    eig=np.linalg.eigvalsh(covariance)[::-1]
    anisotropy=eig[1]/max(eig[0],1e-20)
    feature=float(smoothstep(.025,.09,eig[0])*(1-smoothstep(.12,.36,anisotropy)))
    return float(beta[0]),macro,feature,len(ids),float(np.sqrt(np.average((z-design@beta)**2,weights=base)))

def restored_normals(original_p,new_p,original_normal,faces,inverse,group_count,changed,locked):
    qfaces=inverse[faces]
    triangle_normals=np.cross(new_p[faces[:,1]]-new_p[faces[:,0]],new_p[faces[:,2]]-new_p[faces[:,0]])
    vertex_sum=np.zeros((group_count,3),dtype=np.float64)
    for k in range(3):np.add.at(vertex_sum,qfaces[:,k],triangle_normals)
    vertex_sum/=np.maximum(np.linalg.norm(vertex_sum,axis=1,keepdims=True),1e-20)
    affected=changed.copy()
    incident=np.any(changed[qfaces],axis=1)
    affected[np.unique(qfaces[incident])]=True
    affected[locked]=False
    out=original_normal.copy()
    ids=np.flatnonzero(affected[inverse])
    out[ids]=vertex_sum[inverse[ids]]
    flipped=np.sum(out*original_normal,axis=1)<0
    out[flipped]*=-1
    return out,affected

def cap_parts(component):
    g,b=B.read_glb(PARENT/component['glb']);out=[]
    for node in g['nodes']:
        if 'mesh'not in node or not node['name'].startswith('hidden_mount_cap'):continue
        for primitive in g['meshes'][node['mesh']]['primitives']:
            attrs=primitive['attributes']
            out.append(dict(name=node['name'],positions=B.accessor(g,b,attrs['POSITION']),
                normals=B.accessor(g,b,attrs['NORMAL']),faces=B.accessor(g,b,primitive['indices']).reshape(-1,3)))
    return out

def restore_component(component):
    name=component['name'];data=np.load(PARENT/component['editableMesh'])
    p=data['positions'].astype(np.float64);original_normal=data['normals'].astype(np.float64);faces=data['triangles'].astype(np.int32)
    q,n,inverse,groups=weld_for_analysis(p,original_normal);qfaces=inverse[faces]
    loops=json.loads((PARENT/component['loopFile']).read_text())
    mount_ids=np.unique([v for loop in loops['records']for v in loop['vertices']])
    boundary_distance=cKDTree(p[mount_ids]).query(q)[0]
    boundary_lock=boundary_distance<.014
    sharp=coherent_sharp_edges(q,qfaces)
    raw_mask,patches,settings=spatial_mask(name,q,n)
    boundary_fade=smoothstep(.014,.034,boundary_distance)
    mask=raw_mask*boundary_fade;mask[sharp]=0
    delta=np.zeros_like(q);feature=np.zeros(len(q));feature_lock=np.zeros(len(q),dtype=bool);residual=np.zeros(len(q));support=np.zeros(len(q),dtype=np.int16)
    tree=cKDTree(q)
    selected=np.flatnonzero(mask>.001)
    print('LOCAL_RESTORATION_START',name,'query_vertices',len(selected),flush=True)
    for i in selected:
        result=robust_quadratic_target(i,q,n,tree,settings['radius'],settings['quantile'])
        if result is None:continue
        amount,normal,protection,count,error=result
        feature[i]=protection;support[i]=count;residual[i]=error
        if FOCUSED and protection>.65:
            feature_lock[i]=True
            continue
        amount=float(np.clip(amount,-settings['maxInward'],settings['maxOutward']))
        amount*=mask[i]*(1-protection)**2
        delta[i]=normal*amount
    delta[boundary_lock|sharp|feature_lock]=0
    new_p=p+delta[inverse]
    changed=np.linalg.norm(delta,axis=1)>1e-9
    new_normal,normal_affected=restored_normals(p,new_p,original_normal,faces,inverse,len(q),changed,boundary_lock|sharp|feature_lock)
    assert np.array_equal(new_p[mount_ids],p[mount_ids])
    assert np.max(np.linalg.norm(new_p-p,axis=1))<=max(settings['maxOutward'],settings['maxInward'])+1e-10
    # Reject collapsed/flipped faces; never repair topology to disguise them.
    old_cross=np.cross(p[faces[:,1]]-p[faces[:,0]],p[faces[:,2]]-p[faces[:,0]])
    new_cross=np.cross(new_p[faces[:,1]]-new_p[faces[:,0]],new_p[faces[:,2]]-new_p[faces[:,0]])
    dot=np.sum(old_cross*new_cross,axis=1)
    flipped=(dot<=0)&(np.linalg.norm(old_cross,axis=1)>1e-13)
    # Backtrack the existing displacements around a locally flipped triangle.
    for iteration in range(10):
        if not np.any(flipped):break
        bad_groups=np.unique(inverse[faces[flipped]])
        delta[bad_groups]*=.45
        new_p=p+delta[inverse]
        new_cross=np.cross(new_p[faces[:,1]]-new_p[faces[:,0]],new_p[faces[:,2]]-new_p[faces[:,0]])
        dot=np.sum(old_cross*new_cross,axis=1)
        flipped=(dot<=0)&(np.linalg.norm(old_cross,axis=1)>1e-13)
    if np.any(flipped):raise RuntimeError('Restoration rejected: local source face flips remain.')
    changed=np.linalg.norm(delta,axis=1)>1e-9
    new_normal,normal_affected=restored_normals(p,new_p,original_normal,faces,inverse,len(q),changed,boundary_lock|sharp|feature_lock)
    new_p=new_p.astype(np.float32);new_normal=new_normal.astype(np.float32)
    actual_delta=new_p-p
    changed_vertex=np.linalg.norm(actual_delta,axis=1)>1e-9
    changed_face=np.any(changed_vertex[faces],axis=1)
    surface=dict(name=name,positions=new_p,normals=new_normal,faces=faces)
    extras=dict(sourceLicense='CC0-1.0',sourceAuthor='Daniel Pett',sourceSha256=parent_manifest['sourceSha256'],
        culture='Restored derived Chinese Tang cloth donor, different artifact from Japanese reference06',
        parentRevision='immutable r03',parentGLBSha256=component['glbSha256'],
        restoration='Explicit feature-aware local vertex displacement. Unchanged topology and mount loops. See restoration delta/mask file.',
        deltaFile=name+'-restoration-deltas.npz',visualAccepted=False)
    caps=cap_parts(component)
    glb=DEST/(name+'.glb');B.write_glb(glb,[surface]+caps,extras)
    B.write_glb(DEST/(name+'-surface-only.glb'),[surface],extras)
    native=B.write_sc07(DEST/(name+'-restored-surface.sc07.bin'),surface)
    native['sourceNormalsPreserved']=False
    native['normalChange']='Recomputed on moved-face neighborhoods only; mount/coherent sharp-edge normals preserved.'
    np.savez_compressed(DEST/(name+'-editable-mesh.npz'),positions=new_p,normals=new_normal,triangles=faces.astype(np.uint32),
        mountPositions=data['mountPositions'],mountNormals=data['mountNormals'],mountTriangles=data['mountTriangles'])
    trace=np.load(PARENT/component['sourceTrace'])
    np.savez_compressed(DEST/(name+'-restoration-deltas.npz'),
        vertexDelta=actual_delta.astype(np.float32),normalDelta=(new_normal-original_normal).astype(np.float32),
        mask=mask[inverse].astype(np.float32),rawMask=raw_mask[inverse].astype(np.float32),
        boundaryDistance=boundary_distance[inverse].astype(np.float32),
        coherentSharpEdgeLock=sharp[inverse],coherentFoldLock=feature_lock[inverse],boundaryLock=boundary_lock[inverse],
        featureProtection=feature[inverse].astype(np.float32),localFitResidual=residual[inverse].astype(np.float32),
        localSupportCount=support[inverse],changedVertex=changed_vertex,affectedFace=changed_face,
        affectedOriginalSourceMesh=trace['faceMesh'][changed_face],affectedOriginalSourceFace=trace['faceSource'][changed_face])
    movement=np.linalg.norm(actual_delta,axis=1)
    normals_delta=np.linalg.norm(new_normal-original_normal,axis=1)
    out=dict(name=name,glb=glb.name,glbBytes=glb.stat().st_size,glbSha256=sha(glb),nativeSC07=native,
        parentGLB=relative(PARENT/component['glb']),parentGLBSha256=component['glbSha256'],
        parentOriginalSourceTrace=relative(PARENT/component['sourceTrace']),parentSourceTraceSha256=sha(PARENT/component['sourceTrace']),
        originalMesh=relative(PARENT/component['editableMesh']),restoredMesh=name+'-editable-mesh.npz',deltaFile=name+'-restoration-deltas.npz',
        mountLoops=relative(PARENT/component['loopFile']),mountLoopSha256=sha(PARENT/component['loopFile']),
        sourceNormalizedAnchor=component['sourceNormalizedAnchor'],bounds=[new_p.min(0).tolist(),new_p.max(0).tolist()],
        method='Robust local quadratic surface projection with explicit spatial masks, directional crease protection and mount buffer; no topology change.',
        patches=patches,settings=settings,vertices=len(p),triangles=len(faces),
        changedVertices=int(changed_vertex.sum()),affectedFaces=int(changed_face.sum()),
        exactUnchangedVertices=int(np.sum(~changed_vertex)),
        maxMovement=float(movement.max()),movementPercentiles=np.quantile(movement[movement>1e-9],[.5,.9,.99,1]).tolist() if np.any(movement>1e-9)else[0,0,0,0],
        maxNormalDelta=float(normals_delta.max()),lockedMountVertices=len(mount_ids),mountVertexMaxMovement=float(movement[mount_ids].max()),
        coherentSharpEdgeGroupsLocked=int(sharp.sum()),coherentFoldGroupsLocked=int(feature_lock.sum()),topologyIdentical=True,sourceFaceFlipsRemaining=int(flipped.sum()),
        capGeometryChanged=False,visualAccepted=False)
    print('LOCAL_RESTORATION_READY',name,'changed',out['changedVertices'],'max',out['maxMovement'],flush=True)
    return out

def main():
    baseline={str(p.relative_to(PARENT)):sha(p)for p in PARENT.rglob('*')if p.is_file()}
    for c in parent_manifest['components']:assert sha(PARENT/c['glb'])==c['glbSha256']
    components=[restore_component(c)for c in parent_manifest['components']]
    assert baseline=={str(p.relative_to(PARENT)):sha(p)for p in PARENT.rglob('*')if p.is_file()}
    report=dict(revision='r04-local-restoration-'+ARGS.variant,status='bounded local restoration candidate; matched physical comparison pending',
        visualAccepted=False,productionIntegrated=False,sourceAuthor='Daniel Pett',sourceLicense='CC0-1.0',
        sourceSha256=parent_manifest['sourceSha256'],sourceCulture='Derived/restored Chinese Tang donor; different artifact from Japanese reference06',
        parentManifest=relative(PARENT/'manifest.json'),parentManifestSha256=sha(PARENT/'manifest.json'),
        coordinateSystem='+Y up/+Z front/+X viewer right',originSurfaceAnchor=parent_manifest['originSurfaceAnchor'],
        units='Inferred viewing metres: original full scan normalized to2.0. Actual artifact dimensions undocumented. Movement caps are in this declared viewing scale, not measured conservation dimensions.',
        deformationCaps=dict(kneeOutwardMetres=.010,kneeInwardMetres=.003 if FOCUSED else .0015,torsoBothDirectionsMetres=.003 if FOCUSED else .0018,
            comparisonModelScale=parent_manifest['uniformFitExample']['scale'],
            equivalentKneeMaxAtOwnerModelMetres=.010*parent_manifest['uniformFitExample']['scale']),
        components=components,builderSha256=sha(Path(__file__)),exportHelperSha256=sha(HERE/'build-components.py'),
        r03AllFilesUnchanged=True)
    (DEST/'manifest.json').write_text(json.dumps(report,indent=2))
    (DEST/'r03-immutability.json').write_text(json.dumps(dict(before=baseline,after=baseline,allFilesUnchanged=True),indent=2))
    (DEST/'native-manifest.json').write_text(json.dumps(dict(revision='cc0-tang-cloth169-r04-local-restoration',
        format='SC07:20-byte header, float32 position/normal/neutral UV, uint32 triangle indices',
        coordinateSystem='+Y up/+Z front',variants=dict(central=[c['nativeSC07']for c in components]),
        sourceAttribution='Daniel Pett, CC0-1.0. Locally restored derived Chinese Tang cloth donor; different artifact from reference06.',
        visualAccepted=False),indent=2))

if __name__=='__main__':main()
