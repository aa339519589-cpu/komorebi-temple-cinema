#!/usr/bin/env python3
"""A fixed global display-colour study on the actual mesh render.

Reference RGB is summarized as channel quantiles only. There is no spatial
correspondence, reference texture, geometry displacement, frame replacement
or time-adaptive transform. This changes colour, not modeling precision.
"""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parents[1]
reference=root/'references/hd/3-照片-4.jpg'
render=root/'qa/ten-reference/04/iteration-shadow104-triplet/shot--11041.png'
ref=np.asarray(Image.open(reference).convert('RGB'),dtype=float).reshape(-1,3)/255
src=np.asarray(Image.open(render).convert('RGB'),dtype=float).reshape(-1,3)/255
q=np.linspace(.01,.99,33)
rq=np.quantile(ref,q,axis=0)
sq=np.quantile(src,q,axis=0)
x=np.linspace(0,1,256)
curves=[]
strength=.6
for channel in range(3):
    xp=np.r_[0,sq[:,channel],1]
    yp=np.r_[0,rq[:,channel],1]
    unique=np.unique(xp)
    grouped=np.array([yp[xp==v].mean() if 0<v<1 else v for v in unique])
    curve=np.interp(x,unique,grouped)
    for _ in range(3):
        curve=np.convolve(np.pad(curve,(2,2),mode='edge'),np.array([1,4,6,4,1])/16,mode='valid')
    curve=np.maximum.accumulate((1-strength)*x+strength*curve)
    curve[0],curve[-1]=0,1
    curves.append(curve.tolist())
out=root/'reconstructions/scene-04/assets/grade109'
out.mkdir(parents=True,exist_ok=True)
record={'status':'unselected-colour-grade-study','visualAccepted':False,
 'purpose':'Fixed global RGB channel-quantile colour grade; does not add or recover scene detail',
 'strength':strength,'samplingDomain':'sRGB display code values after the existing OutputPass',
 'quantiles':q.tolist(),'renderQuantilesRGB':sq.tolist(),'referenceQuantilesRGB':rq.tolist(),
 'curves':curves,'curveEntries':256,'geometryUnchanged':True,'lightingUnchanged':True,
 'referenceSpatialCorrespondenceUsed':False,'referenceImageProjected':False,'adaptivePerFrame':False,
 'referenceSha256':hashlib.sha256(reference.read_bytes()).hexdigest(),
 'renderSha256':hashlib.sha256(render.read_bytes()).hexdigest(),
 'limits':'Global image statistics also reflect differing scene coverage. Colour distribution agreement is not a fidelity metric.'}
(out/'curves.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps({'entries':256,'strength':strength,'status':record['status']}))
