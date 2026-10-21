"""Native QA boards and exact source checkpoint; no image enters the scene."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,shutil,datetime

BASE=Path(__file__).resolve().parent;REPO=BASE.parents[3];QA=REPO/'qa/ten-reference/09'
groups={'main':QA/'iteration-scene09-solmax-bearing-return-gallery-r14-20261021','oblique':QA/'iteration-scene09-solmax-bearing-return-oblique-r14-20261021','poses':QA/'iteration-scene09-solmax-bearing-return-poses-r14-20261021'}
reports={name:json.loads((path/'report.json').read_text()) for name,path in groups.items()}
hashes={r['source']['hash'] for r in reports.values()}
if len(hashes)!=1:raise RuntimeError('Source hashes do not agree')
if any(r.get('errors') or not r.get('frames') for r in reports.values()):raise RuntimeError('A native capture did not finish')
source=reports['main']['source'];source_hash=next(iter(hashes));mismatches=[]
for rel,want in source['files'].items():
    p=REPO/rel
    if hashlib.sha256(p.read_bytes()).hexdigest()!=want:mismatches.append(rel)
    if p.suffix in ['.js','.mjs','.json','.html','.py']:
        dest=BASE/'retained-source'/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
if mismatches:raise RuntimeError('Held source has changed: '+str(mismatches))
(BASE/'retained-source/source-manifest.json').write_text(json.dumps(source,indent=2)+'\n')
try:font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',20)
except OSError:font=ImageFont.load_default()
def board(items,name):
    images=[Image.open(p).convert('RGB') for _,p in items];width=sum(p.width for p in images);height=max(p.height for p in images)
    result=Image.new('RGB',(width,height+38),(17,19,23));draw=ImageDraw.Draw(result);x=0
    for (label,_),im in zip(items,images):result.paste(im,(x,38));draw.text((x+12,8),label,fill=(235,235,235),font=font);x+=im.width
    result.save(BASE/name)
board([('Reference09 — comparison only',REPO/'references/hd/8-照片-9.jpg'),('Actual native R14 — fidelity unaccepted',groups['main']/'reference.png')],'reference-left-native-right-r14.png')
board([('Retained R10 native',QA/'iteration-scene09-solmax-continuous-sill-contact-r10-20261021/reference.png'),('Actual native R14',groups['main']/'reference.png')],'baseline-left-r14-right.png')
board([(f'Actual shot pose {t}s',groups['poses']/file) for t,file in [(0,'shot-0.png'),(3.5,'shot-3p5.png'),(7,'shot-7.png')]],'three-native-shot-poses-r14.png')
artifacts=[]
for name,path in groups.items():
    for p in sorted(path.glob('*.png')):
        artifacts.append({'kind':name,'file':str(p.relative_to(REPO)),'pixels':list(Image.open(p).size),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
for p in sorted(BASE.glob('*.png')):
    if p.name in ['reference-left-native-right-r14.png','baseline-left-r14-right.png','three-native-shot-poses-r14.png']:artifacts.append({'kind':'comparison-only','file':str(p.relative_to(REPO)),'pixels':list(Image.open(p).size),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
frames=[{'capture':name,'pose':f.get('localTime'),'name':f['name'],'glError':f['glError'],'valid':f['valid'],'linkedPrograms':sum(bool(p['linked']) for p in f['programs']),'rgbaSha256':f['rgbaSha256']} for name,r in reports.items() for f in r['frames']]
manifest={'sourceHash':source_hash,'sourceFilesChecked':len(source['files']),'sourceMismatchFiles':mismatches,'referenceCameraPreserved':{'position':[6,2.7,33],'target':[0,5.5,-10],'fov':52},'sameSourceAcrossAllCaptures':True,'frames':frames,'artifacts':artifacts,'visualAccepted':False,'sourcePictureOrDepthProjected':False,'scope':'Substantive scene09 runtime architectural checkpoint, not complete photographic acceptance','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(BASE/'review-manifest-r14.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'sourceHash':source_hash,'sourceFilesChecked':len(source['files']),'nativeFrames':len(frames),'allGL0':all(f['glError']==0 for f in frames),'allSameSource':True,'visualAccepted':False}))
