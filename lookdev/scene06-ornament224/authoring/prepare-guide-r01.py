from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np
from collections import deque
import hashlib,json,shutil
root=Path(__file__).resolve().parents[1]
asset=root/'candidate-root/reconstructions/scene-06/assets/ornament224-r01'
asset.mkdir(parents=True,exist_ok=True)
source=Path('/Users/mima1234/.codex/generated_images/01a16ad8-2849-70f3-ab04-8a69688ed364/exec-17dd6cb7-a755-4dcd-9e9b-ba9910614428.png')
shutil.copy2(source,asset/'independent-dragon-peony-height-guide.png')
prompt=root/'authoring/prompt-r01.txt'
shutil.copy2(prompt,asset/'prompt.txt')
im=Image.open(source).convert('L')
a=np.asarray(im)
y,x=np.where(a>30)
crop=[int(x.min())-3,int(y.min())-3,int(x.max())+4,int(y.max())+4]
part=im.crop(crop).resize((1536,256),Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(.40))
scalar=np.array(part,dtype=np.uint8)
mask=scalar>24
labels=np.zeros(mask.shape,dtype=np.int32)
sizes=[0];best=0;h,w=mask.shape
for start in np.flatnonzero(mask):
 j,i=divmod(int(start),w)
 if labels[j,i]:continue
 label=len(sizes);queue=deque([(i,j)]);labels[j,i]=label;size=0
 while queue:
  x0,y0=queue.popleft();size+=1
  for xx,yy in ((x0-1,y0),(x0+1,y0),(x0,y0-1),(x0,y0+1)):
   if 0<=xx<w and 0<=yy<h and mask[yy,xx] and not labels[yy,xx]:labels[yy,xx]=label;queue.append((xx,yy))
 sizes.append(size)
 if size>sizes[best]:best=label
kept=labels==best
# Keep only the one connected carving, without adding an enclosing backboard.
# A tiny neutral below-threshold margin prevents isolated single-cell islands.
scalar[~kept]=0
field=asset/'dragon-peony-height.gray8.bin';field.write_bytes(scalar.tobytes())
Image.fromarray(scalar).save(asset/'scalar-preview.png')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
ref=root.parents[1]/'references/hd/4-照片-5.jpg'
metadata={'asset':'Scene06 independent inferred long dragon and peony carved altar field','revision':'ornament224-r01','generator':'built-in image_gen through imagegen skill','sourceImage':str(source),'guideSha256':sha(source),'projectGuide':'independent-dragon-peony-height-guide.png','originalSize':im.size,'scalarCrop':crop,'scalarSize':[1536,256],'scalarSha256':sha(field),'promptRecord':'prompt.txt','promptSha256':sha(prompt),'referencePhoto':'references/hd/4-照片-5.jpg','referenceSha256':sha(ref),'referencePurpose':'broad long low silhouette, traditional cloud/dragon/foliate density and horizontal organization only; no photograph pixels consumed in geometry or material','connectedComponentPixels':int(sizes[best]),'discardedDisconnectedPixels':int(mask.sum()-sizes[best]),'scalarConversion':'Luminance, tight nonblack crop, Lanczos1536x256, Gaussian0.40px, retain largest >24 connected component. Runtime threshold24.5, clipped-grid contour, closed convex-front/rear with rounded actual hole walls.','licenseScope':'New inferred authored carving; not an artifact scan. Surrounding inherited scene retains original mixed licenses, including CC BY-NC-SA4.0 Amida source and CC BY4.0 original carvings. No blanket MIT claim.','visualAccepted':False,'photographicAccepted':False,'limitations':['AI-authored nonmetric sculpt guide, not measured depth or a recovered historical motif.','Generated intensity is treated solely as authored depth; it is not calibrated metric data and contains artistic conventions.','No RGB texture, normal map, photo projection, AO, shading image or guide is assigned to a rendered material.','All native final pixels must be produced by actual geometry under the existing3D light and material response.']}
(asset/'provenance.json').write_text(json.dumps(metadata,indent=2))
print(json.dumps(metadata,indent=2))
