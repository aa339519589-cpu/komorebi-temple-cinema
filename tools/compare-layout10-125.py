"""Label supplied reference and unchanged actual saved frames for review.

Only comparison resizing is performed. The actual native frame/report remain
separate; no photograph, depth image or generated replacement enters the scene.
"""
from pathlib import Path
import argparse, hashlib, json
from PIL import Image, ImageDraw

parser=argparse.ArgumentParser()
parser.add_argument('--iteration',required=True)
parser.add_argument('--frame',default='shot--1250')
parser.add_argument('--label',required=True)
args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa/ten-reference/10/layout125'
render=ROOT/'qa/ten-reference/10'/('iteration-'+args.iteration)
paths=[ROOT/'references/hd/9-照片-10.jpg',OUT/'baseline-current-r02.png',render/(args.frame+'.png')]
labels=['SUPPLIED REFERENCE','BASELINE ACTUAL R02 / comparison resize',args.label]
sheet=Image.new('RGB',(3*627,659),'#242424')
for i,(path,label)in enumerate(zip(paths,labels)):
    im=Image.open(path).convert('RGB').resize((627,627),Image.Resampling.LANCZOS)
    sheet.paste(im,(i*627,32));ImageDraw.Draw(sheet).text((i*627+7,9),label,fill='white')
sheet.save(OUT/'comparison-reference-baseline-actual.png')
if args.iteration=='layout125-d':
    route=Image.new('RGB',(1160,472),'#242424')
    before=ROOT/'qa/ten-reference/10/iteration-layout125-c/shot--125.png'
    after=render/'shot--125.png'
    for i,(path,label)in enumerate([(before,'C ACTUAL: turn crossed by guard'),(after,'D ACTUAL: open turning landing')]):
        route.paste(Image.open(path).convert('RGB').crop((360,345,940,785)),(i*580,32))
        ImageDraw.Draw(route).text((i*580+7,9),label,fill='white')
    route.save(OUT/'route-c-before-d-after.png')
report=json.loads((render/'report.json').read_text())
receipt={'scope':'Labelled comparison resize only; source reference and actual native renders retained unchanged','actualSourceCommit':report['sourceCommit'],'actualSourceHash':report['source']['hash'],'actualReport':str((render/'report.json').relative_to(ROOT)),'sources':[{'file':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'label':label} for path,label in zip(paths,labels)],'baselineProvenance':'baseline-provenance.json','output':'comparison-reference-baseline-actual.png'}
if args.iteration=='layout125-d':
    receipt['routeComparison']={'file':'route-c-before-d-after.png','scope':'Two unchanged actual side-view pixel crops at the same pose, no resampling','cropXYXY':[360,345,940,785],'sources':[{'file':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [before,after]]}
(OUT/'comparison-provenance.json').write_text(json.dumps(receipt,indent=2)+'\n')
