"""Independent CPU checks of R08 export contracts and welded skin connectivity.

Checks do not assert photographic fidelity. Actual front/oblique views remain
the visual evidence. No Blender or browser process is launched here.
"""
from pathlib import Path
from array import array
from collections import Counter
import struct,json,math,hashlib
OUT=Path(__file__).resolve().parent/'r11-joined-cloth-sculpture'
manifest=json.loads((OUT/'sc07/manifest.json').read_text())

def read_glb(path):
    raw=path.read_bytes();magic,version,length=struct.unpack_from('<4sII',raw)
    assert magic==b'glTF' and version==2 and length==len(raw)
    n,t=struct.unpack_from('<I4s',raw,12);assert t==b'JSON';g=json.loads(raw[20:20+n]);offset=20+n;n,t=struct.unpack_from('<I4s',raw,offset);assert t==b'BIN\0';blob=memoryview(raw)[offset+8:offset+8+n]
    assert not g.get('images') and not g.get('textures'),'Unexpected image map in actual geometry export'
    return raw,g,blob

def accessor(g,blob,index):
    a=g['accessors'][index];v=g['bufferViews'][a['bufferView']];typ,size={5121:('B',1),5123:('H',2),5125:('I',4),5126:('f',4)}[a['componentType']];width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];stride=v.get('byteStride',size*width);start=v.get('byteOffset',0)+a.get('byteOffset',0)
    assert start+(a['count']-1)*stride+width*size<=len(blob)
    return a,(struct.unpack_from('<'+typ*width,blob,start+i*stride)for i in range(a['count']))

gltf_checks=[];skin_connected=None
for filename in ['japanese-buddha-body.glb','japanese-buddha-with-lotus.glb','actual-face-ears-neck-core.glb']:
    raw,g,blob=read_glb(OUT/filename);triangles=0;vertices=0
    for mesh in g['meshes']:
        for p in mesh['primitives']:
            assert p.get('mode',4)==4
            a,points=accessor(g,blob,p['attributes']['POSITION']);vertices+=a['count']
            assert all(all(math.isfinite(v)for v in xyz)for xyz in points)
            ia,indices=accessor(g,blob,p['indices']);assert ia['count']%3==0
            assert all(0<=i[0]<a['count']for i in indices);triangles+=ia['count']//3
            if 'NORMAL'in p['attributes']:
                na,norms=accessor(g,blob,p['attributes']['NORMAL']);assert na['count']==a['count'];assert all(all(math.isfinite(v)for v in xyz)for xyz in norms)
    gltf_checks.append({'file':filename,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'vertices':vertices,'triangles':triangles,'imageMaps':0,'finitePositionsNormalsAndIndices':True})
    if filename=='japanese-buddha-body.glb':
        # Material boundaries duplicate export vertices. Weld only exact-ish
        # coincident positions, then measure connected components of the skin.
        meshes=[m for m in g['meshes']if m['name'].startswith('R11_welded_head_neck_robe_arms_hands_legs_skin')]
        assert len(meshes)==1
        point_map={};parent=array('I');weight=array('I')
        def point_id(xyz):
            key=tuple(round(v,6)for v in xyz)
            if key not in point_map:
                q=len(parent);point_map[key]=q;parent.append(q);weight.append(1)
            return point_map[key]
        def find(i):
            while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
            return i
        def union(a,b):
            a=find(a);b=find(b)
            if a==b:return
            if weight[a]<weight[b]:a,b=b,a
            parent[b]=a;weight[a]+=weight[b]
        for p in meshes[0]['primitives']:
            a,points=accessor(g,blob,p['attributes']['POSITION']);ids=array('I',(point_id(xyz)for xyz in points));ia,ix=accessor(g,blob,p['indices']);tri=[]
            for (index,)in ix:
                tri.append(ids[index])
                if len(tri)==3:union(tri[0],tri[1]);union(tri[0],tri[2]);tri=[]
        sizes=Counter(find(i)for i in range(len(parent)))
        skin_connected={'components':len(sizes),'weldedVertices':len(parent),'largestComponents':sorted(sizes.values(),reverse=True)[:12],'weldToleranceDecimalPlaces':6}

sc07_checks=[]
for scope,parts in [('body',manifest['bodyOnly']),('lotus',manifest['lotusOnly']),('faceCore',manifest['faceCore']['parts'])]:
    for p in parts:
        raw=(OUT/'sc07'/p['file']).read_bytes();magic,n,ni,f0,f1=struct.unpack_from('<4sIIII',raw)
        assert magic==b'SC07' and n==p['vertices'] and ni==p['triangles']*3 and len(raw)==20+n*32+ni*4
        assert hashlib.sha256(raw).hexdigest()==p['sha256']
        pos=array('f');pos.frombytes(raw[20:20+n*12]);norm=array('f');norm.frombytes(raw[20+n*12:20+n*24]);ix=array('I');ix.frombytes(raw[20+n*32:]);assert all(math.isfinite(x)for x in pos);assert all(math.isfinite(x)for x in norm);assert max(ix)<n
        bbox=[[min(pos[j::3])for j in range(3)],[max(pos[j::3])for j in range(3)]]
        sc07_checks.append({'scope':scope,'material':p['material'],'file':p['file'],'sha256':p['sha256'],'vertices':n,'triangles':ni//3,'boundsYUp':bbox,'valid':True})

report={'status':'actual-export-contract-checked','visualAccepted':False,'coordinateSystem':manifest['coordinateSystem'],'seatAnchor':manifest['seatAnchor'],'aboveSeatHeight':manifest['bodyBounds']['threeYUp'][1][1],'bodyBounds':manifest['bodyBounds']['threeYUp'],'glb':gltf_checks,'sc07':sc07_checks,'weldedSkinConnectivity':skin_connected,'sourceFaceSurfacePreserved':json.loads((OUT/'report.json').read_text())['renderedSourceVertexMaxDeltaAfterRetopology']==0,'scope':'Binary integrity, finite indexed actual geometry, no image maps, source-preserving join metadata, and skin connectivity. Visual acceptance is independent.'}
(OUT/'geometry-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:report[k]for k in ['status','coordinateSystem','seatAnchor','aboveSeatHeight','weldedSkinConnectivity','visualAccepted']},indent=2))
