"""Prepare a neutral mineral material asset, never an assembled floor image.

Generated diffuse is a visual hypothesis. Small normal relief is an authored
estimate, not a measured height scan; visible seams and wear remain geometry.
"""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image
import cv2
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'lookdev/stone-material87/generated-granite-albedo-v01.png'
OUT=ROOT/'reconstructions/scene-04/assets/granite-image87';OUT.mkdir(parents=True,exist_ok=True)
im=np.asarray(Image.open(SOURCE).convert('RGB').resize((1536,1536),Image.Resampling.LANCZOS),np.float32)/255
lin=np.where(im<=.04045,im/12.92,((im+.055)/1.055)**2.4)
n=lin.shape[0];v,u=np.meshgrid(np.arange(n,dtype=np.float32)/n,np.arange(n,dtype=np.float32)/n,indexing='ij')
# Two independent half-period shifts fade to zero at each source wrap seam.
# This gives periodic samples without making bilateral mirrored crystals.
periodic=np.zeros_like(lin)
for du in [0,.5]:
 for dv in [0,.5]:
  x=(u+du)%1;y=(v+dv)%1
  w=(np.sin(np.pi*x)**2*np.sin(np.pi*y)**2).astype(np.float32)
  q=cv2.remap(lin,(x*n).astype(np.float32),(y*n).astype(np.float32),cv2.INTER_LINEAR,borderMode=cv2.BORDER_WRAP)
  periodic+=q*w[:,:,None]
mean=periodic.mean((0,1));target=np.array([.140,.131,.117],np.float32)
alb=np.clip((periodic/mean-1)*.70+1,.12,2.4)*target
luma=np.sum(alb*np.array([.2126,.7152,.0722]),axis=2)
grain=luma-cv2.GaussianBlur(np.pad(luma,12,mode='wrap'),(0,0),2.2)[12:-12,12:-12]
height=np.clip(grain/(grain.std()*3),-1,1)*.000075
spacing=.60/n
dx=(np.roll(height,-1,1)-np.roll(height,1,1))/(2*spacing)
dy=(np.roll(height,-1,0)-np.roll(height,1,0))/(2*spacing)
normal=np.stack([-dx,dy,np.ones_like(dx)],axis=-1);normal/=np.linalg.norm(normal,axis=2,keepdims=True)
rough=np.clip(.77+.10*(1-luma/luma.mean()),.63,.89)
srgb=np.where(alb<=.0031308,alb*12.92,1.055*alb**(1/2.4)-.055)
save=lambda name,p:Image.fromarray(np.uint8(np.clip(p,0,1)*255)).save(OUT/name,optimize=True)
save('granite-image87-diff.png',srgb);save('granite-image87-nor_gl.png',normal*.5+.5);save('granite-image87-rough.png',rough)
report={'status':'image-assisted-material-candidate','photographicAcceptance':False,'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'sourceProvenance':'lookdev/stone-material87/imagegen-provenance.json','referenceSceneRGBProjected':False,'size':n,'periodMetres':.60,'targetDryMeanLinearRGB':target.tolist(),'normalHeightRangeMetres':[-.000075,.000075],'heightStatus':'Authored visual estimate, not a measured displacement scan','scope':'Mineral surface only; independent stone solids define all visible floor layout and edges'}
(OUT/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print('IMAGE_ASSISTED_GRANITE_PREPARED',json.dumps(report),flush=True)
