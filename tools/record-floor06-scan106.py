#!/usr/bin/env python3
"""Record constant material gains for a selected floor-surface increment.

Only the project's existing credited CC0 PBR asset is sampled. The target
reflectance is an authored brown palette choice, not inferred photo albedo.
"""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parents[1]
source=root/'assets/polyhaven/lacquered-cherry-wood'
rgb=np.asarray(Image.open(source/'diffuse-2k.jpg').convert('RGB'),dtype=float)/255
linear=np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4)
mean=linear.mean(axis=(0,1))
rough=np.asarray(Image.open(source/'roughness-2k.jpg').convert('RGB'),dtype=float)[:,:,1]/255
target=np.array([.085,.035,.018])
gain=target/mean
out=root/'reconstructions/scene-06/assets/floor-scan106'
out.mkdir(parents=True,exist_ok=True)
record={'status':'selected-local-surface-increment-unaccepted-scene','visualAccepted':False,
 'source':'Poly Haven lacquered_cherry_wood; CC0; existing original maps retained unchanged',
 'sourceLinearMeanRGB':mean.tolist(),'authoredTargetLinearMeanRGB':target.tolist(),
 'materialLinearGain':gain.tolist(),'maximumEffectiveRGB':(linear*gain).max(axis=(0,1)).tolist(),
 'roughnessGreenMean':float(rough.mean()),'roughnessMultiplier':float(.23/rough.mean()),
 'roughnessTargetMean':.23,'grainRotationRadians':float(np.pi/2),
 'physicalRepeatStatus':'Authored material scale; original provider metric dimensions unavailable in local provenance',
 'sourceSha256':{name:hashlib.sha256((source/name).read_bytes()).hexdigest() for name in ['diffuse-2k.jpg','roughness-2k.jpg','provenance.json']},
 'scope':'Floor body diffuse and roughness only; existing clearcoat, actual board geometry and direct lights retained',
 'referencePhotographSampled':False}
(out/'material.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(record))
