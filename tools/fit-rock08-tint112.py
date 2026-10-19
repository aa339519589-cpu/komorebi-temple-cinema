#!/usr/bin/env python3
"""Fit one constant PBR tint from approximate semantic rock colour patches.

This is a material-colour hypothesis, not an inverse-lighting solution or
spatial projection. Original scan geometry, maps, camera and lights stay intact.
"""
from pathlib import Path
import argparse,hashlib,json,re
import numpy as np
from PIL import Image
parser=argparse.ArgumentParser();parser.add_argument('--maximum-factor',type=float,default=4);args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
rp=root/'references/hd/7-照片-8.jpg';sp=root/'qa/ten-reference/08/iteration-rock108b/reference.png'
r=np.asarray(Image.open(rp).convert('RGB'),dtype=float)/255;s=np.asarray(Image.open(sp).convert('RGB'),dtype=float)/255
pairs=[{'reference':[547,844,9,9],'render':[548,850,9,9]},{'reference':[580,862,9,9],'render':[575,873,9,9]},{'reference':[580,885,9,9],'render':[584,897,9,9]}]
linear=lambda a:np.where(a<=.04045,a/12.92,((a+.055)/1.055)**2.4)
records=[]
for pair in pairs:
 samples=[]
 for image,key in [(r,'reference'),(s,'render')]:
  x,y,w,h=pair[key];samples.append(np.median(image[y:y+h,x:x+w].reshape(-1,3),axis=0))
 records.append({**pair,'referenceMedianSRGB':samples[0].tolist(),'renderMedianSRGB':samples[1].tolist()})
a=np.median([linear(np.array(z['referenceMedianSRGB'])) for z in records],axis=0);b=np.median([linear(np.array(z['renderMedianSRGB'])) for z in records],axis=0)
tint=np.clip(.75*a/np.maximum(b,.005),.08,args.maximum_factor)
record={'status':'one-rock-material-colour-hypothesis','visualAccepted':False,'pairs':records,'tintLinearRGB':tint.tolist(),'oldTintLinearRGB':[.75]*3,'factorMaximum':args.maximum_factor,'effectiveDiffuseReflectanceMaximum':.85,'patchPositionsApproximate':True,'geometryUnchanged':True,'lightAndCameraUnchanged':True,'referenceImageProjected':False,'referenceSha256':hashlib.sha256(rp.read_bytes()).hexdigest(),'sourceFrameSha256':hashlib.sha256(sp.read_bytes()).hexdigest()}
out=root/'qa/ten-reference/08/neutral112';out.mkdir(parents=True,exist_ok=True)
(out/f'colour-inputs-factor{args.maximum_factor:g}.json').write_text(json.dumps(record,indent=2)+'\n')
p=root/'reconstructions/scene-08/src/hero-garden-rock.js';text=p.read_text()
text,count=re.subn(r'neutralTint:\[[^\]]+\]',lambda _: 'neutralTint:'+json.dumps(tint.tolist(),separators=(',',':')),text,count=1)
if count!=1:raise RuntimeError('Expected one array-valued material tint')
p.write_text(text);print(json.dumps({'tintLinearRGB':tint.tolist()}))
