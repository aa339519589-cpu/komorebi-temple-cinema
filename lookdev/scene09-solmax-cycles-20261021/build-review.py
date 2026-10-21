"""Compose unaltered native-resolution comparison images and file receipts.

No scene image is generated here. The comparison board places the supplied
photograph and actual Cycles output side by side with labels; both retain all
their original 1254x1254 image pixels.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,datetime

BASE=Path(__file__).resolve().parent;REPO=BASE.parents[1];OUT=BASE/'cycles-r05'
report=json.loads((OUT/'report.json').read_text())
if report['status']!='physical-night-court-review':raise RuntimeError('Wait for every R05 capture to finish')
if not report['geometryTriangleCountPreserved'] or report['importedTriangles']!=51311767:raise RuntimeError('Frozen source geometry count differs')
for rec in report['captures']:
    p=OUT/rec['file']
    if hashlib.sha256(p.read_bytes()).hexdigest()!=rec['sha256']:raise RuntimeError('Image identity differs: '+p.name)
reference=Image.open(REPO/'references/hd/8-照片-9.jpg').convert('RGB')
render=Image.open(OUT/'scene09-r10-physical-r05.png').convert('RGB')
if reference.size!=(1254,1254) or render.size!=(1254,1254):raise RuntimeError('Comparison inputs must be native1254 square')
header=40;board=Image.new('RGB',(2508,1254+header),(15,17,21));board.paste(reference,(0,header));board.paste(render,(1254,header))
draw=ImageDraw.Draw(board)
try:font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',19)
except OSError:font=ImageFont.load_default()
draw.text((14,9),'Reference 09 — comparison only',fill=(235,235,235),font=font)
draw.text((1268,9),'Actual R10 geometry · Cycles R05 · fidelity unaccepted',fill=(235,235,235),font=font)
board_path=BASE/'reference-left-cycles-right-r05.png';board.save(board_path)
files=[OUT/rec['file'] for rec in report['captures']]+[OUT/report['sceneLinearAsset']['file'],OUT/report['editableModel']['file'],board_path]
artifacts=[]
for p in files:
    entry={'file':str(p.relative_to(BASE)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    if p.suffix=='.png':entry['pixels']=list(Image.open(p).size)
    if p.suffix in ['.blend','.exr']:entry['largeLocalReleaseAssetNotGitBlob']=True
    artifacts.append(entry)
scripts=[]
for p in sorted(BASE.glob('*.py')):scripts.append({'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
manifest={'status':'physical-night-court-review','sourceCommit':report['sourceCommit'],'sourceHash':report['sourceHash'],'sourceIndexedTriangles':report['sourceTriangleCount'],'allSourceIndexedTrianglesPreserved':report['geometryTriangleCountPreserved'],'sourceInstances':report['sourceStatistics']['instances'],'sourceCameraPreserved':report['cameraUnchanged'],'visualAccepted':False,'referencePixelsUsedInScene':False,'reflectionImagesOrPaintedStrokes':False,'artifacts':artifacts,'scripts':scripts,'generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(BASE/'review-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'sourceHash':manifest['sourceHash'],'allSourceIndexedTrianglesPreserved':True,'artifacts':artifacts,'visualAccepted':False},indent=2))
