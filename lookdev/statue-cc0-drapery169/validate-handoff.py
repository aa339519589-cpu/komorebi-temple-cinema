"""CPU-only source/GLB/SC07/anchor/render-identity verification for handoff."""
from pathlib import Path
import importlib.util, hashlib, json, struct
import numpy as np

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('cloth169_builder',HERE/'build-components.py')
B=importlib.util.module_from_spec(spec);spec.loader.exec_module(B)
DEST=HERE/'r03'
manifest=json.loads((DEST/'manifest.json').read_text())
receipt=json.loads((DEST/'clay-views/render-receipt.json').read_text())
rows=B.load_source();by_mesh={r['mesh']:r for r in rows}
results=[]
trace_members={}
for component in manifest['components']:
    name=component['name'];data=np.load(DEST/component['editableMesh'])
    g,b=B.read_glb(DEST/component['glb']);p=g['meshes'][0]['primitives'][0]
    positions=B.accessor(g,b,p['attributes']['POSITION']);normals=B.accessor(g,b,p['attributes']['NORMAL']);triangles=B.accessor(g,b,p['indices']).reshape(-1,3)
    assert np.array_equal(positions,data['positions'])
    assert np.array_equal(normals,data['normals'])
    assert np.array_equal(triangles,data['triangles'])
    assert 'images' not in g and 'textures' not in g
    sg,sb=B.read_glb(DEST/(name+'-surface-only.glb'));sp=sg['meshes'][0]['primitives'][0]
    assert np.array_equal(B.accessor(sg,sb,sp['attributes']['POSITION']),positions)
    assert np.array_equal(B.accessor(sg,sb,sp['attributes']['NORMAL']),normals)
    native=component['nativeSC07'];raw=(DEST/native['file']).read_bytes();magic,n,ni,_,_=struct.unpack_from('<4sIIII',raw)
    assert magic==b'SC07' and n==len(positions) and ni==len(triangles)*3 and len(raw)==20+n*32+ni*4
    assert np.array_equal(np.frombuffer(raw,'<f4',count=n*3,offset=20).reshape(-1,3),positions)
    assert np.array_equal(np.frombuffer(raw,'<f4',count=n*3,offset=20+n*12).reshape(-1,3),normals)
    assert np.array_equal(np.frombuffer(raw,'<u4',count=ni,offset=20+n*32).reshape(-1,3),triangles)
    assert np.all(np.frombuffer(raw,'<f4',count=n*2,offset=20+n*24)==0)
    assert hashlib.sha256(raw).hexdigest()==native['sha256']
    rendered=next(c for c in receipt['componentIdentities']if c['file']==component['glb'])
    assert hashlib.sha256((DEST/component['glb']).read_bytes()).hexdigest()==rendered['sha256']==component['glbSha256']
    trace=np.load(DEST/component['sourceTrace'])
    trace_members[name]=set(zip(trace['faceMesh'].tolist(),trace['faceSource'].tolist()))
    max_position=max_normal=0
    origin=np.array(component['sourceNormalizedAnchor'])
    for mi,row in by_mesh.items():
        ids=np.flatnonzero(trace['vertexMesh']==mi)
        bary=trace['vertexBary'][ids].astype(np.float64);fs=row['faces'][trace['vertexTriangle'][ids]]
        expected=np.einsum('ni,nij->nj',bary,row['positions'][fs])-origin
        max_position=max(max_position,float(np.linalg.norm(expected-positions[ids],axis=1).max(initial=0)))
        expected_normal=np.einsum('ni,nij->nj',bary,row['normals'][fs]);expected_normal/=np.maximum(np.linalg.norm(expected_normal,axis=1,keepdims=True),1e-20)
        max_normal=max(max_normal,float(np.linalg.norm(expected_normal-normals[ids],axis=1).max(initial=0)))
    assert max_position<1.2e-7 and max_normal<1.2e-7
    loops=json.loads((DEST/component['loopFile']).read_text())
    max_loop_error=0
    for loop in loops['records']:
        max_loop_error=max(max_loop_error,float(np.linalg.norm(positions[loop['vertices']]-np.array(loop['coordinates']),axis=1).max(initial=0)))
    assert max_loop_error<8e-8
    results.append(dict(component=name,sourceGLBAndEditableBufferExact=True,nativeSC07Exact=True,
        renderedGLBIdentityExact=True,originalSurfaceTraceMaxPositionError=max_position,
        originalSurfaceTraceMaxNormalError=max_normal,mountLoopToBufferMaxPositionError=max_loop_error,
        originalWholeTriangles=component['retainedWholeTriangles'],boundaryFragments=component['boundaryClippedTriangles'],
        texturesAndImages=False))
anchors=json.loads((DEST/'surface-anchors.json').read_text())
anchor_results=[]
for name,a in anchors['anchors'].items():
    row=by_mesh[a['sourceMesh']];triangle=row['positions'][row['faces'][a['sourceTriangle']]]
    expected=np.array(a['barycentric'])@triangle;actual=np.array(a['sourceNormalizedPoint'])
    error=float(np.linalg.norm(expected-actual));assert error<1e-12
    members=[]
    for c in manifest['components']:
        if (a['sourceMesh'],a['sourceTriangle']) not in trace_members[c['name']]:continue
        if all(float(actual@np.array(pl['normal']))<=pl['distance']+1e-10 for pl in c['cutPlanes']):members.append(c['name'])
    assert members, name+' must belong to an actually retained component'
    anchor_results.append(dict(anchor=name,retainedBy=members,sourceTriangleReconstructionError=error))
report=dict(status='PASS: source geometry, native buffers, mount loops, anchors and rendered asset identities agree',
    sourceSha256=manifest['sourceSha256'],builderSha256=hashlib.sha256((HERE/'build-components.py').read_bytes()).hexdigest(),
    validationScriptSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),components=results,anchors=anchor_results,
    renderedAssetBytesUnchangedBySC07AndAnchorHandoff=True,
    renderReceiptBuilderSha256=receipt['builderSha256'],currentBuilderSha256=manifest['builderSha256'],
    builderDifference='Later CPU handoff metadata, source pinning and native buffers changed the builder source; both GLBs remain byte-identical to the rendered assets.',
    visualAcceptance=False,limit='This validation proves identity and source traceability, not photographic fidelity, clean manufacture, or an integrated statue.')
(DEST/'handoff-validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
