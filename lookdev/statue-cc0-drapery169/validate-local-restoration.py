"""Verify local restoration provenance, bounds, mounts and physical-view identity."""
from pathlib import Path
import argparse,hashlib,importlib.util,json,struct
import numpy as np
from scipy.spatial import cKDTree

HERE=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--variant',default='iteration-02',choices=['conservative','iteration-02']);args=parser.parse_args()
DEST=HERE/'r04-local-restoration'
if args.variant=='iteration-02':DEST=DEST/'iteration-02'
spec=importlib.util.spec_from_file_location('export169',HERE/'build-components.py');B=importlib.util.module_from_spec(spec);spec.loader.exec_module(B)
manifest=json.loads((DEST/'manifest.json').read_text())
receipt=json.loads((DEST/'comparison-views/render-receipt.json').read_text())
baseline=json.loads((DEST/'r03-immutability.json').read_text())['before']
current={str(p.relative_to(HERE/'r03')):hashlib.sha256(p.read_bytes()).hexdigest()for p in (HERE/'r03').rglob('*')if p.is_file()}
assert baseline==current

def glb_parts(path):
    g,b=B.read_glb(path);parts={}
    for node in g['nodes']:
        if 'mesh'not in node:continue
        primitive=g['meshes'][node['mesh']]['primitives'][0];a=primitive['attributes']
        parts[node['name']]=dict(positions=B.accessor(g,b,a['POSITION']),normals=B.accessor(g,b,a['NORMAL']),faces=B.accessor(g,b,primitive['indices']).reshape(-1,3))
    return parts

results=[]
normal_face_data={}
for c in manifest['components']:
    old=np.load(DEST/c['originalMesh']);new=np.load(DEST/c['restoredMesh']);delta=np.load(DEST/c['deltaFile'])
    p0,p1=old['positions'],new['positions'];f=old['triangles'];n0,n1=old['normals'],new['normals']
    assert np.array_equal(f,new['triangles'])
    displacement=p1.astype(np.float64)-p0
    assert np.max(np.linalg.norm(displacement-delta['vertexDelta'],axis=1))<1e-9
    normals_delta=n1.astype(np.float64)-n0
    assert np.max(np.linalg.norm(normals_delta-delta['normalDelta'],axis=1))<1e-7
    movement=np.linalg.norm(displacement,axis=1)
    assert float(movement.max())<=max(c['settings']['maxOutward'],c['settings']['maxInward'])+1e-7
    outside=delta['mask']<=0
    assert np.array_equal(p1[outside],p0[outside])
    locks=delta['boundaryLock']|delta['coherentSharpEdgeLock']
    if 'coherentFoldLock'in delta:locks|=delta['coherentFoldLock']
    assert np.array_equal(p1[locks],p0[locks])
    assert np.array_equal(n1[locks],n0[locks])
    loops=json.loads((DEST/c['mountLoops']).read_text());ids=np.unique([i for loop in loops['records']for i in loop['vertices']])
    assert np.array_equal(p1[ids],p0[ids]) and np.array_equal(n1[ids],n0[ids])
    old_parts=glb_parts(DEST/c['parentGLB']);new_parts=glb_parts(DEST/c['glb'])
    assert old_parts.keys()==new_parts.keys()
    for name in old_parts:
        if name==c['name']:continue
        for key in ['positions','normals','faces']:assert np.array_equal(old_parts[name][key],new_parts[name][key])
    for key,expected in [('positions',p1),('normals',n1),('faces',f)]:assert np.array_equal(new_parts[c['name']][key],expected)
    raw=(DEST/c['nativeSC07']['file']).read_bytes();magic,count,ni,_,_=struct.unpack_from('<4sIIII',raw)
    assert magic==b'SC07'and count==len(p1)and ni==len(f)*3
    assert np.array_equal(np.frombuffer(raw,'<f4',count=count*3,offset=20).reshape(-1,3),p1)
    assert np.array_equal(np.frombuffer(raw,'<f4',count=count*3,offset=20+count*12).reshape(-1,3),n1)
    assert np.array_equal(np.frombuffer(raw,'<u4',count=ni,offset=20+count*32).reshape(-1,3),f)
    changed=np.linalg.norm(displacement,axis=1)>1e-9
    assert np.array_equal(changed,delta['changedVertex'])
    assert np.array_equal(np.any(changed[f],axis=1),delta['affectedFace'])
    normal_changed=np.linalg.norm(normals_delta,axis=1)>1e-7
    normal_faces=np.any(normal_changed[f],axis=1)
    source_trace=np.load(DEST/c['parentOriginalSourceTrace'])
    normal_face_data[c['name']+'-normalAffectedFace']=normal_faces
    normal_face_data[c['name']+'-sourceMesh']=source_trace['faceMesh'][normal_faces]
    normal_face_data[c['name']+'-sourceFace']=source_trace['faceSource'][normal_faces]
    before_cross=np.cross(p0[f[:,1]]-p0[f[:,0]],p0[f[:,2]]-p0[f[:,0]])
    after_cross=np.cross(p1[f[:,1]]-p1[f[:,0]],p1[f[:,2]]-p1[f[:,0]])
    valid=np.linalg.norm(before_cross,axis=1)>1e-12
    assert np.all(np.sum(before_cross[valid]*after_cross[valid],axis=1)>0)
    area_ratio=np.linalg.norm(after_cross[valid],axis=1)/np.linalg.norm(before_cross[valid],axis=1)
    # A 75 mm neighborhood average of the actual vertex delta describes macro
    # drift. It is a diagnostic only; actual clay/gold views decide form quality.
    tree=cKDTree(p0);macro=[]
    for i in np.flatnonzero(changed)[::8]:
        neighbors=tree.query_ball_point(p0[i],.075)
        macro.append(float(np.linalg.norm(displacement[neighbors].mean(0))))
    rendered=next(i for i in receipt['inputComponents']if i['revision']=='after-r04'and i['component']==c['name'])
    assert hashlib.sha256((DEST/c['glb']).read_bytes()).hexdigest()==rendered['sha256']==c['glbSha256']
    results.append(dict(component=c['name'],unchangedTopology=True,exactMountAndCapGeometry=True,exactLockedFeaturePositionsAndNormals=True,
        exactUnchangedPositionsOutsideMask=True,deltaReconstructionVerified=True,nativeSC07Exact=True,renderedGLBIdentityExact=True,
        movedVertices=int(changed.sum()),movedFaces=int(delta['affectedFace'].sum()),normalChangedFaces=int(normal_faces.sum()),
        maxMovementMetres=float(movement.max()),macro75mmMeanDeltaMaxMetres=max(macro,default=0),
        areaRatioPercentiles=np.quantile(area_ratio,[0,.01,.5,.99,1]).tolist(),remainingFaceFlips=0,
        primaryAcceptance='Actual paired physical clay and gold frames; these numerical checks do not accept the finish.'))
np.savez_compressed(DEST/'normal-affected-original-faces.npz',**normal_face_data)
for v in receipt['views']:
    assert hashlib.sha256((DEST/'comparison-views'/v['file']).read_bytes()).hexdigest()==v['sha256']
for prefix in ['knees-front','knees-three-quarter','torso-front','torso-three-quarter']:
    for mat in ['clay','aged-gold']:
        pair=[v for v in receipt['views']if v['file'].startswith(prefix+'-'+mat+'-')]
        assert len(pair)==2
        for key in ['cameraBlender','targetBlender','orthographicScale']:assert pair[0][key]==pair[1][key]
report=dict(status='PASS: bounded local deltas, locked mounts/features, exact topology and actual matched render identities verified',
    variant=args.variant,r03AllFilesByteUnchanged=True,components=results,pairedPhysicalFrames=16,
    sourceCulture='Explicitly restored derived Chinese Tang CC0 donor; different artifact from Japanese reference06',
    visualAccepted=False,validationScriptSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest())
(DEST/'restoration-validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
