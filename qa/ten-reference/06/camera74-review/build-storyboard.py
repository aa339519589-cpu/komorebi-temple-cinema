"""Contact sheet from the three actual native renders; no movie or fake frame.

Only scale the real 1254px stills for the labelled storyboard display.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageChops,ImageStat
import json,hashlib

ROOT=Path(__file__).resolve().parents[4]
QA=ROOT/'qa/ten-reference/06';OUT=Path(__file__).resolve().parent
report=json.loads((QA/'iteration-camera74/report.json').read_text())
path=json.loads((OUT/'path-receipt.json').read_text())
font=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',20)
small=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',15)
sheet=Image.new('RGB',(1920,720),'#151515');draw=ImageDraw.Draw(sheet)
labels={'shot-0':'Censer cartouche / low kneeling detail','shot-3p5':'Triad and altar reveal','shot-7':'Exact original reference camera'}
images=[]
for i,f in enumerate(report['frames']):
    p=QA/'iteration-camera74'/f"{f['name']}.png";im=Image.open(p).convert('RGB')
    sheet.paste(im.resize((640,640),Image.Resampling.LANCZOS),(i*640,80))
    pose=f['pose'];camera=pose['camera'];focus=pose['focus']
    draw.text((i*640+12,9),f"{f['localTime']:g}s — {labels[f['name']]}",fill='white',font=font)
    focus_text=f"focus {focus['focusDistance']:.2f}m" if focus['enabled'] else 'original focus mode; DOF bypassed'
    draw.text((i*640+12,42),f"eye {camera['position'][1]:.2f}m / FOV {camera['fov']:g} / {focus_text}",fill='#cecece',font=small)
    images.append({'time':f['localTime'],'path':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'actualNativeSize':[1254,1254],'displayScaledTo':[640,640]})
sheet.save(OUT/'actual-three-frame-storyboard.png')
archive=QA/'iteration-seat-contact32/reference.png';end=QA/'iteration-camera74/shot-7.png'
diff=ImageChops.difference(Image.open(archive).convert('RGB'),Image.open(end).convert('RGB'));stats=ImageStat.Stat(diff)
review={
 'candidate':'camera74','status':'three-still-camera-review-candidate','visualAccepted':False,
 'baseCommit':'1f88db08d9f38c584f20c6bb43fb76aa9f987880','branch':'work/camera-reference-06-20261019',
 'sourceHash':report['source']['hash'],'nearSubject':path['subject'],
 'start':report['frames'][0]['pose'],'middle':report['frames'][1]['pose'],'end':report['frames'][2]['pose'],
 'pathMath':path['mathOnlySampling'],'endpointChecks':path['endpoint'],
 'worldGeometryMaterialsAndLightingUnchanged':all(f['unchangedFromBase'] for f in path['retainedWorldFiles']),
 'unselected66HeadImported':path['unselected66HeadImported'],
 'cameraMethod':'Independent cubic position rail and shortest quaternion slerp with quintic minimum-jerk timing; fixed62deg FOV',
 'focusMethod':'Existing opaque-depth CoC; original29.12mm focal length at f/2.8; focus follows actual censer before smoothly pulling to altar; bypass at reference and7s',
 'archivalReferencePixelComparison':{'archive':str(archive.relative_to(ROOT)),'byteIdentical':False,'meanAbsoluteRgbByteDifference':stats.mean,'rmsRgbByteDifference':stats.rms,'interpretation':'Numerical camera, world sources and reference optics mode are retained; archive PNG is not claimed bit-identical across separate render histories. Cause of small pixel differences was not separately attributed.'},
 'actualNativeFrames':images,'rendererErrors':report['errors'],
 'failedPreflight':{'iteration':'camera73','nativeFrames':0,'reason':'Body Z-range guard omitted existing table Z+.62; corrected from model ritual-axis anchor','sourceSnapshot':'qa/ten-reference/06/camera73-source/'},
 'validation':'Two queued GPU jobs total: failed startup without frames, then exactly native0/3.5/7 stills. Pure math inspection at60Hz is not movie rendering. No full movie or test suite.',
 'limits':['Three stills and numerical continuity do not establish full-motion aesthetic acceptance','Opaque-depth defocus approximates transparent glass and hidden background layers','The near view exposes existing censer and Buddha geometry/material limitations; no remodeling was performed'],
 'noPhotoProjection':True,'noSceneImageCards':True,'noPhotographicDepth':True
}
(OUT/'visual-review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
print('Wrote actual three-frame storyboard and honest camera review.')
