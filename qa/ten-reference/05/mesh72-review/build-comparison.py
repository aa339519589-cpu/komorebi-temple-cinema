"""Pillow contact sheets: reference photo is comparison input only.

Labels distinguish enlarged source crops from genuine native 3D subfrusta.
No retouching, replacement frames, projected photo or inferred image depth.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,math

ROOT=Path(__file__).resolve().parents[4]
QA=ROOT/'qa/ten-reference/05';OUT=Path(__file__).resolve().parent
REFERENCE=ROOT/'references/hd/5-照片-6.jpg'
if not REFERENCE.exists(): REFERENCE=Path('/Users/mima1234/temple-cinema-live-sync/references/hd/5-照片-6.jpg')
BASE=QA/'iteration-struct64-native/reference.png'
FINAL=QA/'iteration-mesh72/reference.png'
font=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',18)
small=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',14)
def sheet(items,name,size=512):
    out=Image.new('RGB',(size*len(items),size+65),'#151515');d=ImageDraw.Draw(out)
    for i,(title,subtitle,path,crop) in enumerate(items):
        im=Image.open(path).convert('RGB')
        if crop:
            x,y,w=crop;im=im.crop((x,y,x+w,y+w))
        out.paste(im.resize((size,size),Image.Resampling.LANCZOS),(i*size,65))
        d.text((i*size+10,10),title,fill='white',font=font);d.text((i*size+10,38),subtitle,fill='#c8c8c8',font=small)
    out.save(OUT/name)
sheet([
 ('Original HD photo','Comparison photograph',REFERENCE,None),
 ('struct64 selected baseline','Actual 1254px original low camera',BASE,None),
 ('mesh72 unselected candidate','Actual 1254px original low camera',FINAL,None),
],'comparison-full-photo64-72.png',600)
sheet([
 ('Original HD crop','320px crop enlarged for comparison',REFERENCE,(745,690,320)),
 ('struct64 actual crop','Actual 320px full-render crop enlarged',BASE,(745,690,320)),
 ('mesh71 first pass','Actual 1254px native subfrustum',QA/'iteration-mesh71/detail-native.png',None),
 ('mesh72 current candidate','Actual 1254px native subfrustum',QA/'iteration-mesh72/detail-native.png',None),
],'comparison-column-eaves-photo64-71-72.png')
reports={n:json.loads((QA/f'iteration-mesh{n}/report.json').read_text()) for n in [71,72]}
solids=json.loads((OUT/'solid-receipt.json').read_text())
old_alt=math.degrees(math.atan2(21,math.hypot(18,23)))
new_alt=math.degrees(math.atan2(16,math.hypot(18,23)))
review={
 'candidate':'mesh72','status':'unselected-review-candidate','visualAccepted':False,
 'baseline':'struct64-native; current scene05 matched exact retained source identity before editing',
 'baselineSourceHash':'4f52366ca8dc7be8e5c31163f5c9d77f0106d5b9a8159dc93849a7df8a42e840',
 'nativeSourceHash':reports[72]['source']['hash'],
 'scope':['Closed thin copper end sleeves with broad floral/volute relief','Warm pigmented timber and physically shaded sun/courtyard-source calibration'],
 'sourceModules':['reconstructions/scene-05/src/rafter-end-copper.js','reconstructions/scene-05/src/scanned-timber.js','reconstructions/scene-05/src/scene.js','reconstructions/scene-05/src/architecture.js'],
 'metalGeometry':['Closed four-sided copper return and thin front plate','Eight smooth closed curved petals with interior surface vertices','Four finite-width closed volutes and corner lobes','Lower dark patinated groove floor and rounded rivets','End sleeves on hanging corner timbers aligned with their actual cut-plane normal','Lower subdivisions for small fittings; very small/detail-false legacy pieces remain'],
 'timber':{'source':'Unchanged Poly Haven CC0 lacquered_cherry_wood scan','method':'Opaque pigment over mean-normalized scanned luminance; original normal and roughness maps retained','sourceMeanLinearLuminance':reports[72]['frames'][0]['info']['timber']['sourceMeanLinearLuma'],'pigments':{'red':'#b65325','cedar':'#9d592f'},'modulationRange':[.68,1]},
 'lighting':{'exposureUnchanged':.95,'sunIntensityUnchanged':4.4,'sunColor':['#fff0ce','#ffe4b9'],'sunAltitudeDegrees':[old_alt,new_alt],'sunAzimuthUnchanged':True,'courtyardBounceIntensity':[.20,.28],'courtyardBounceNowCastsActualShadows':True,'approximation':'Inferred first-bounce directional proxy and analytical environment, not measured full GI'},
 'unchanged':['Reference camera and FOV','Tower/site and storey anchors','Roof geometry/layout','Deep blue-gray roof material colors/roughness','Canopy geometry and placement','Global source assets'],
 'referenceCamera':reports[72]['frames'][0]['info']['referencePose'],
 'referencePhotographUsedAsTexture':False,'scenePhotoCard':False,'photoDepth':False,'cc0MaterialScanUsed':True,
 'newCopperClosure':{detail:{'finite':all(p['finite'] for p in parts),'boundaryEdges':sum(p['boundaryEdges'] for p in parts),'nonmanifoldEdges':sum(p['nonmanifoldEdges'] for p in parts),'triangles':sum(p['triangles'] for p in parts)} for detail,parts in solids['details'].items()},
 'nativeRenders':{str(n):{'sourceHash':r['source']['hash'],'errors':r['errors'],'frames':[{'name':f['name'],'valid':f['valid'],'detailCrop':f['detailCrop']} for f in r['frames']]} for n,r in reports.items()},
 'unresolved':['Flower and volute forms remain simplified and are not a measured copy of each original copper casting','Timber paint is more uniform than the aged photographed surface; gloss and wear still differ','Some copper highlights still lose fine carving under the direct sun','Tiny legacy end pieces and existing window ornament remain coarse','Courtyard bounce is an explicit shadowed proxy rather than full GI','Broader roof/body proportions, ceramic corner masks and foliage still differ outside this bounded pass'],
 'validation':'Exactly two queued1254 full+native-detail renders, local copper topology inspection and JS parse checks. No test suite or movie run. Closed geometry and linked programs are not visual acceptance.',
 'comparisonSourceHashes':{str(p.relative_to(ROOT)) if p.is_relative_to(ROOT) else str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in [REFERENCE,BASE,FINAL,QA/'iteration-mesh71/detail-native.png',QA/'iteration-mesh72/detail-native.png']}
}
(OUT/'visual-review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
print('Wrote full and local column/eave comparisons with visual-review.json')
