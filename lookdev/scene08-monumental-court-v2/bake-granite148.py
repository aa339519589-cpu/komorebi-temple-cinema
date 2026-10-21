from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib
src=Path('reconstructions/scene-08/assets/granite/granite-face-diff.png');raw=np.asarray(Image.open(src).convert('RGB')).astype(np.float64)/255
linear=np.where(raw<=.04045,raw/12.92,((raw+.055)/1.055)**2.4);mean=linear.mean(axis=(0,1));root=src.parent
outputs=[]
for name,target in [('carved-gray-albedo148.png',[.37,.35,.30]),('stair-gray-albedo148.png',[.255,.25,.225])]:
 out=np.clip(np.power(linear/mean,.84)*np.array(target),.005,.90)
 out=np.where(out<=.0031308,out*12.92,1.055*np.power(out,1/2.4)-.055);out=np.rint(np.clip(out,0,1)*255).astype(np.uint8)
 path=root/name;Image.fromarray(out).save(path,optimize=True);outputs.append({'file':name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'linearTargetMeanRGB':target})
p={'source':'Poly Haven Granite Tile04 single original face crop','license':'CC0-1.0','originalFile':src.name,'originalSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'originalLinearMeanRGB':mean.tolist(),'formula':'linearRGB = clamp(pow(originalLinearRGB / perChannelMean,0.84) * authoredTargetRGB,0.005,0.90). Bake to sRGB PNG. Original mineral pattern retained, neutral weathered limestone/granite pigment authored for temple stone. Original source immutable.','outputs':outputs,'referencePhotographSampled':False,'sourceScript':'lookdev/scene08-monumental-court-v2/bake-granite148.py'}
(root/'gray-albedo148-provenance.json').write_text(json.dumps(p,indent=2)+'\n')
