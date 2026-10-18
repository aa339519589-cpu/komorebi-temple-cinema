"""Pillow contact sheets, for comparison only. No image-generated replacements.

Photographic and full-render crops are explicitly labelled as enlarged crops.
Native detail images are actual 1254px 3D subfrustum renders.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib

ROOT=Path(__file__).resolve().parents[4]
QA=ROOT/'qa/ten-reference/08';OUT=Path(__file__).resolve().parent
REFERENCE=ROOT/'references/hd/7-照片-8.jpg'
if not REFERENCE.exists(): REFERENCE=Path('/Users/mima1234/temple-cinema-live-sync/references/hd/7-照片-8.jpg')
BASELINE=QA/'iteration-struct50/reference.png';FINAL=QA/'iteration-mesh70/reference.png'
font=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',18)
small=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',14)
def sheet(items,name,size=512):
    out=Image.new('RGB',(size*len(items),size+65),'#151515');draw=ImageDraw.Draw(out)
    for i,(title,subtitle,path,crop) in enumerate(items):
        im=Image.open(path).convert('RGB')
        if crop:
            x,y,w=crop;im=im.crop((x,y,x+w,y+w))
        out.paste(im.resize((size,size),Image.Resampling.LANCZOS),(i*size,65))
        draw.text((i*size+10,10),title,fill='white',font=font)
        draw.text((i*size+10,38),subtitle,fill='#c8c8c8',font=small)
    out.save(OUT/name)
sheet([
 ('Original HD photo','Comparison photograph',REFERENCE,None),
 ('struct50 selected baseline','Actual 3D reference camera',BASELINE,None),
 ('mesh70 unselected candidate','Actual 3D reference camera',FINAL,None),
],'comparison-full-photo50-70.png',600)
sheet([
 ('Original HD crop','220px crop enlarged for comparison',REFERENCE,(50,570,220)),
 ('struct50 baseline crop','Actual full-render 220px crop enlarged',BASELINE,(50,570,220)),
 ('mesh70 native hardware','Actual 1254px low-camera subfrustum',QA/'iteration-mesh70/detail-native.png',None),
],'comparison-hardware-photo50-70.png')
sheet([
 ('Original HD crop','320px crop enlarged for comparison',REFERENCE,(230,245,320)),
 ('struct50 baseline crop','Actual full-render 320px crop enlarged',BASELINE,(230,245,320)),
 ('mesh68 native joinery','Actual subfrustum; same solid shapes as70',QA/'iteration-mesh68/detail-native.png',None),
 ('mesh70 latest crop','Actual full-render 320px crop enlarged',FINAL,(230,245,320)),
],'comparison-gallery-photo50-68-70.png')
reports={n:json.loads((QA/f'iteration-mesh{n}/report.json').read_text()) for n in [68,69,70]}
solids=json.loads((OUT/'solid-receipt.json').read_text())
review={
 'candidate':'mesh70','status':'unselected-review-candidate','visualAccepted':False,
 'baseline':'selected struct50; exact scene08 source identity matched before work',
 'baselineSourceHash':'cf36527e7421ac11e84c2afc219407688e4bb099b0437fb388127c8071fd31d6',
 'finalNativeSourceHash':reports[70]['source']['hash'],
 'scope':['Foreground square-column feet and metal fittings','Left grand hall and receding gallery bracket/rafter/cover-tile solids'],
 'sourceModules':['reconstructions/scene-08/src/gate-hardware.js','reconstructions/scene-08/src/gallery-joinery.js'],
 'changed':['16mm bevelled cast plaque back plates, separate field/rim, raised chrysanthemum/acanthus and domed rivets','Closed four-sided column shoes and slim lips','Additional inward-facing column plaques with photo-led inferred dimensions and heights','30-part closed curved bracket kit locally derived from scene01, with half laps, flaring cushions and thin dark-gilt end shoes','Continuous closed solid curved rafters and edge receivers replacing short box segments','Closed-wall semi-cylindrical ceramic covers with head flares and overlapping joints','Lighter existing redlight scanned timber material on new gallery members'],
 'unchanged':['Foreground column/site anchors','Hall and pagoda site/scale','Reference low camera','Pagoda bracket geometry','Garden seed and plant placement','Global light positions and strengths'],
 'camera':{'position':[0,2.65,13],'target':[0,6.65,-9],'fov':49},
 'photographicSceneTexture':False,'photoDepth':False,'pointCloud':False,
 'geometryClosure':{k:{n:g[n] for n in ['parts','finite','boundaryEdges','nonmanifoldEdges','triangles']} for k,g in solids['groups'].items()},
 'joineryGeometryIdenticalToFirstNativeMesh68':solids['geometryMatchesFirstNativeMesh68'],
 'nativeRenders':{str(n):{'sourceHash':r['source']['hash'],'errors':r['errors'],'frames':[{'name':f['name'],'valid':f['valid'],'detailCrop':f['detailCrop']} for f in r['frames']]} for n,r in reports.items()},
 'unresolved':['Plaque relief is a procedural carving in the same decorative family, not a measured copy of the original fitting','Inward-facing plaque placements and dimensions are inferred and still need visual acceptance','Some gallery bracket stacks remain dense and the underside is darker than the photograph','Old roof-end discs and the broader building still retain repetitive forms','Existing foliage, stone lantern, roof proportions and lighting still differ strongly from the photograph'],
 'validation':'Three queued native1254 full+one-detail render calls only; bounded new-solid topology inspection and JS parse checks. No test suite or movie run. Closed geometry and linked shaders do not establish photographic fidelity.',
 'comparisonSourceHashes':{str(p.relative_to(ROOT)) if p.is_relative_to(ROOT) else str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in [REFERENCE,BASELINE,FINAL,QA/'iteration-mesh68/detail-native.png',QA/'iteration-mesh70/detail-native.png']}
}
(OUT/'visual-review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
print('Wrote full, gallery and hardware comparisons plus visual-review.json')
