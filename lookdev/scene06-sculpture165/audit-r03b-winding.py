"""Read-only SC07 triangle orientation audit; no graphics/Blender execution."""
import json,struct,math,hashlib,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
def read(path):
    d=path.read_bytes();m,n,ni,_,_=struct.unpack_from('<4sIIII',d)
    assert m==b'SC07' and len(d)==20+32*n+4*ni
    p=list(struct.iter_unpack('<fff',d[20:20+12*n]))
    no=list(struct.iter_unpack('<fff',d[20+12*n:20+24*n]))
    f=list(struct.iter_unpack('<III',d[20+32*n:]));return p,no,f
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def audit(path,limit=None):
    p,n,f=read(path);fs=f[:limit] if limit else f
    sign=[0,0,0];area=[0.,0.];edges={};normal=[0.,0.,0.]
    for a,b,c in fs:
        nn=cross(sub(p[b],p[a]),sub(p[c],p[a]));ar=math.sqrt(dot(nn,nn));vv=tuple(n[a][j]+n[b][j]+n[c][j] for j in range(3));s=dot(nn,vv)
        sign[0 if s>1e-15 else 1 if s< -1e-15 else 2]+=1
        area[0 if s>=0 else 1]+=ar
        for aa,bb in((a,b),(b,c),(c,a)):
            key=tuple(sorted((aa,bb)));edges[key]=edges.get(key,0)+1
        for j in range(3):normal[j]+=nn[j]
    return {'vertices':len(p),'triangles':len(fs),'windingAgreementPositiveNegativeZero':sign,'areaPositiveNegative':area,'boundaryEdges':sum(v==1 for v in edges.values()),'nonmanifoldEdges':sum(v>2 for v in edges.values()),'summedAreaNormal':normal}
def match_knee():
    sp,sn,sf=read(ROOT/'lookdev/statue-cc0-drapery169/r03/crossed-knees-hips-source-surface.sc07.bin')
    dest=next((HERE/'r03b/sc07').glob('central-body-cloth-*.bin'));dp,dn,df=read(dest)
    tx=json.loads((HERE/'r03b/build-report.json').read_text())['bodyTransform']
    def t(p):return tuple(sum(tx[j][k]*p[k]for k in range(3))+tx[j][3]for j in range(3))
    def key(p):return tuple(round(x,5)for x in p)
    source={tuple(sorted(key(t(sp[v]))for v in f)):f for f in sf}
    # First object in cloth batch is exactly this knee surface. Compare each
    # face's geometric normal to its original after the declared positive affine.
    same=flip=missing=0;worst=[]
    for d in df[:len(sf)]:
        orig=source.get(tuple(sorted(key(dp[v])for v in d)))
        if orig is None:missing+=1;continue
        a,b,c=(t(sp[v])for v in orig);orig_n=cross(sub(b,a),sub(c,a))
        a,b,c=(dp[v]for v in d);dest_n=cross(sub(b,a),sub(c,a))
        if dot(orig_n,dest_n)>=0:same+=1
        else:flip+=1
    return {'sameAsOriginalWinding':same,'reversedFromOriginalWinding':flip,'unmatchedTriangles':missing}

snapshot=HERE/'r03b-native-source';snapshot.mkdir(exist_ok=True)
for name in('src','index.html'):
    src=ROOT/'reconstructions/scene-06'/name;dest=snapshot/name
    if not dest.exists():shutil.copytree(src,dest)if src.is_dir()else shutil.copy2(src,dest)
if not(snapshot/'publish-candidate.mjs').exists():shutil.copy2(HERE/'publish-candidate.mjs',snapshot/'publish-candidate.mjs')
rp=ROOT/'qa/ten-reference/06/iteration-scene06-sculpture165-r03b-hero-native/report.json';r=json.loads(rp.read_text())
identity={'source':r['source'],'sceneRevision':'scene-06-sculpture165-r03b-measured-cloth-clean-head','visualAccepted':False}
(snapshot/'source-identity.json').write_text(json.dumps(identity,indent=2))
paths=[ROOT/'lookdev/statue-cc0-drapery169/r03'/n for n in('crossed-knees-hips-source-surface.sc07.bin','torso-cloak-core-source-surface.sc07.bin')]
out={str(p.relative_to(ROOT)):audit(p)for p in paths}
p=next((HERE/'r03b/sc07').glob('central-body-cloth-*.bin'));out[str(p.relative_to(ROOT))]=audit(p);out['kneeComparison']=match_knee()
(HERE/'r03b-winding-audit.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
