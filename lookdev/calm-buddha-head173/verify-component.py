"""Independent read-only float32/source-trace/topology verification. No Blender."""
from pathlib import Path
from array import array
import struct,json,hashlib,math
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'component-r01';m=json.loads((OUT/'manifest.json').read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for item in m['files'].values():assert sha(OUT/item['file'])==item['sha256']
assert sha(ROOT/'build-component.mjs')==m['builderSha256']
raw=(ROOT/'sources/fb17c123ad9c4c0fb6baf723b3fffd79/source-original.glb').read_bytes();g=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]]);blob=memoryview(raw)[28+struct.unpack_from('<I',raw,12)[0]:]
assert hashlib.sha256(raw).hexdigest()==m['sourceSha256'];assert 'CC-BY-4.0' in g['asset']['extras']['license']
def accessor(index):
 a=g['accessors'][index];v=g['bufferViews'][a['bufferView']];n={'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']];code={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']];fmt='<'+code*n;size=struct.calcsize(fmt);start=v.get('byteOffset',0)+a.get('byteOffset',0);step=v.get('byteStride',size)
 return [struct.unpack_from(fmt,blob,start+i*step)for i in range(a['count'])]
# This exact source has one non-identity root matrix; reject silent hierarchy changes.
root_matrix=g['nodes'][0]['matrix'];assert all('matrix'not in n and not any(k in n for k in ('rotation','scale','translation'))for n in g['nodes'][1:])
S=array('d');SN=array('d');SF=array('I')
for record in m['sourcePrimitives']:
 prim=g['meshes'][record['mesh']]['primitives'][record['primitive']];p=accessor(prim['attributes']['POSITION']);n=accessor(prim['attributes']['NORMAL']);idx=accessor(prim['indices']);base=len(S)//3
 for point,normal in zip(p,n):
  q=[sum(root_matrix[k+4*j]*point[j]for j in range(3))+root_matrix[12+k]for k in range(3)];r=[sum(root_matrix[k+4*j]*normal[j]for j in range(3))for k in range(3)];length=math.sqrt(sum(v*v for v in r))
  S.extend((q[k]-m['sourceWorldCenter'][k])*m['sourceUniformScale']for k in range(3));SN.extend(v/length for v in r)
 SF.extend(base+i[0]for i in idx)
data=(OUT/m['files']['sc07']['file']).read_bytes();magic,n,ni,_,_=struct.unpack_from('<4sIIII',data);assert magic==b'SC07'and len(data)==20+32*n+4*ni
P=array('f');P.frombytes(data[20:20+12*n]);N=array('f');N.frombytes(data[20+12*n:20+24*n]);F=array('I');F.frombytes(data[20+32*n:]);assert max(F)<n
tr=(OUT/'source-vertex-barycentric-trace.bin').read_bytes();assert len(tr)==n*16
max_p=max_n=0
for i,(parent,a,b,c)in enumerate(struct.iter_unpack('<Ifff',tr)):
 assert parent<len(SF)//3 and abs(a+b+c-1)<2e-7;idx=SF[parent*3:parent*3+3];w=(a,b,c);rebuild=[sum(w[j]*S[idx[j]*3+k]for j in range(3))for k in range(3)];rebuild[1]-=m['cutPlanesSourceNormalized']['neck'];rn=[sum(w[j]*SN[idx[j]*3+k]for j in range(3))for k in range(3)];length=math.sqrt(sum(x*x for x in rn));max_p=max(max_p,math.sqrt(sum((rebuild[k]-P[3*i+k])**2 for k in range(3))));max_n=max(max_n,math.sqrt(sum((rn[k]/length-N[3*i+k])**2 for k in range(3))))
assert max_p<2e-7 and max_n<2e-7
parents=array('I');parents.frombytes((OUT/'source-triangle-trace.bin').read_bytes());assert len(parents)==ni//3 and max(parents)<len(SF)//3
uf=array('I',range(n));edges={};opposed=degenerate=0

def find(a):
 while uf[a]!=a:uf[a]=uf[uf[a]];a=uf[a]
 return a
for i in range(0,ni,3):
 f=F[i:i+3];a,b,c=[P[3*v:3*v+3]for v in f];u=[b[k]-a[k]for k in range(3)];v=[c[k]-a[k]for k in range(3)];cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];avg=[sum(N[3*j+k]for j in f)for k in range(3)]
 degenerate+=sum(x*x for x in cross)<1e-28;opposed+=sum(cross[k]*avg[k]for k in range(3))<0
 for j in range(3):
  a,b=f[j],f[(j+1)%3];key=(min(a,b),max(a,b));edges[key]=edges.get(key,0)+1;ra,rb=find(a),find(b)
  if ra!=rb:uf[rb]=ra
components=len({find(i)for i in range(n)});boundary=[e for e,count in edges.items()if count==1];nonmanifold=sum(count>2 for count in edges.values());euler=n-len(edges)+ni//3
assert components==1 and nonmanifold==0 and degenerate==0 and opposed==0 and euler==0
rings=json.loads((OUT/'measured-rings.json').read_text());assert len(boundary)==sum(l['pointCount']for key in ('neck','crown')for l in rings[key]['loops']);assert all(l['closed']for key in ('neck','crown')for l in rings[key]['loops'])
render=json.loads((ROOT/'evidence/component-r01/report.json').read_text());assert render['sourceGlbSha256']==m['files']['glb']['sha256']and render['builderSha256']==m['builderSha256']
for image in render['views']:assert sha(ROOT/'evidence/component-r01'/image['file'])==image['sha256']
report=dict(valid=True,sourceAndLicenseVerified=True,sc07Float32Vertices=n,triangles=ni//3,connectedComponents=components,eulerCharacteristic=euler,openMountBoundaryEdges=len(boundary),nonmanifoldEdges=nonmanifold,degenerateTriangles=degenerate,sourceNormalOpposedTriangles=opposed,publishedFloat32SourcePositionMaxError=max_p,publishedFloat32SourceNormalMaxError=max_n,renderImageHashesVerified=True,visualAccepted=False)
(OUT/'independent-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
