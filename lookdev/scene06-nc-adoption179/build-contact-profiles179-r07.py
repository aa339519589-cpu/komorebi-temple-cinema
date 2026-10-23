from pathlib import Path
import json,struct,hashlib
ROOT=Path('/Users/mima1234/temple-cinema-live-sync');SCENE=ROOT/'reconstructions/scene-06';LOOK=ROOT/'lookdev/scene06-nc-adoption179'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def convex(points):
 candidates={}
 for x,y,z in points:
  key=(x,z)
  if key not in candidates or y<candidates[key]:candidates[key]=y
 pts=sorted(candidates)
 cross=lambda a,b,c:(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
 lo=[];hi=[]
 for q in pts:
  while len(lo)>1 and cross(lo[-2],lo[-1],q)<=0:lo.pop()
  lo.append(q)
 for q in reversed(pts):
  while len(hi)>1 and cross(hi[-2],hi[-1],q)<=0:hi.pop()
  hi.append(q)
 return [[x,candidates[(x,z)],z]for x,z in lo[:-1]+hi[:-1]]
paths={'central':SCENE/'assets/nc-sainsbury-amida179-CC-BY-NC-SA-4.0/central-sainsbury-r09-CC-BY-NC-SA-4.0-3e33b700a894f466.bin','left':SCENE/'assets/attendant-bearing-v4/left-buddha-bc977f603fa29131.bin','right':SCENE/'assets/attendant-bearing-v4/right-buddha-50241a098469ee60.bin'}
profiles={}
for key,p in paths.items():
 b=p.read_bytes();n=struct.unpack_from('<I',b,4)[0];pts=list(struct.iter_unpack('<fff',b[20:20+n*12]));lo=min(y for x,y,z in pts);low=[p for p in pts if p[1]<=lo+.07];outline=convex(low);scale=[2.5/3.26]*3 if key=='central' else [1.62/3.26*.94,1.62/3.26,1.62/3.26*1.02]
 profiles[key]={'sourceBuffer':str(p.relative_to(ROOT)),'sourceBufferSha256':sha(p),'sourceBufferChanged':False,'sourceMinY':lo,'sourceYThreshold':lo+.07,'sourceSampleCount':len(low),'outlineXYZ':outline,'scale':scale,'contactOnly':True,'sourceScope':'Actual NC-SA Sainsbury body hem only' if key=='central' else 'Existing authored attendant body foot only; no source head sampled','license':'CC-BY-NC-SA-4.0' if key=='central' else 'Retains existing body source license and provenance; separate scan head not sampled.'}
 print(key,len(outline),'points')
out={'revision':'scene06-lotus-contact179-r07','purpose':'Actual3D contact contour for a continuous closed bowl loft below unchanged sculpture geometry; no photograph data. Central profile retains NC-SA; each source body keeps its terms.','profiles':profiles,'visualAccepted':False}
(LOOK/'contact-profiles179-r07.json').write_text(json.dumps(out,indent=2)+'\n')
