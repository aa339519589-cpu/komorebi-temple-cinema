"""CPU-only binary validation of a generated statue GLB; not visual acceptance."""
from pathlib import Path
import json,struct,math,hashlib,sys
base=Path(__file__).resolve().parent
candidates=[base/'r06-japanese-face-neck-study/japanese-buddha-hybrid-foundation.glb',base/'r04-japanese-scan-head/japanese-buddha-real-head-foundation.glb']
path=Path(sys.argv[1])if len(sys.argv)>1 else next(p for p in candidates if p.is_file())
b=path.read_bytes();magic,version,length=struct.unpack_from('<4sII',b)
assert magic==b'glTF' and version==2 and length==len(b)
n,kind=struct.unpack_from('<I4s',b,12);assert kind==b'JSON';g=json.loads(b[20:20+n]);cursor=20+n
n,kind=struct.unpack_from('<I4s',b,cursor);assert kind==b'BIN\x00';payload=memoryview(b)[cursor+8:cursor+8+n]
assert not g.get('images') and not g.get('textures'),'A statue geometry study must not carry photographic image maps.'
types={5121:('B',1),5123:('H',2),5125:('I',4),5126:('f',4)}
sizes={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def values(index):
    a=g['accessors'][index];view=g['bufferViews'][a['bufferView']];typ,size=types[a['componentType']];width=sizes[a['type']];start=view.get('byteOffset',0)+a.get('byteOffset',0);stride=view.get('byteStride',size*width)
    assert start+(a['count']-1)*stride+width*size<=len(payload)
    return a,(struct.unpack_from('<'+typ*width,payload,start+i*stride)for i in range(a['count']))
triangles=0;vertices=0;meshcount=0;floats=0
for m in g['meshes']:
    for p in m['primitives']:
        assert p.get('mode',4)==4
        a,coords=values(p['attributes']['POSITION']);vc=a['count'];vertices+=vc
        for xyz in coords:
            assert all(math.isfinite(x)for x in xyz);floats+=len(xyz)
        ia,indices=values(p['indices']);ic=ia['count'];assert ic%3==0
        assert all(0<=v[0]<vc for v in indices)
        triangles+=ic//3;meshcount+=1
        if 'NORMAL'in p['attributes']:
            na,normals=values(p['attributes']['NORMAL']);assert na['count']==vc
            for xyz in normals:assert all(math.isfinite(x)for x in xyz)
report={'file':path.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'status':'finite-indexed-generated-geometry-validated','glbVersion':2,'meshPrimitives':meshcount,'exportedVertices':vertices,'exportedTriangles':triangles,'positionFloatsChecked':floats,'imageMaps':0,'visualAccepted':False,'scope':'Binary integrity, finite positions/normals, triangle index bounds and absent photograph maps. These checks do not establish reference fidelity.'}
(path.parent/'binary-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
