from pathlib import Path
from PIL import Image,ImageFilter
from collections import deque
import numpy as np,hashlib,json
root=Path(__file__).resolve().parents[1]
asset=root/'candidate-root/reconstructions/scene-06/assets/ornament224-r01'
w,h=1536,256
raw=np.frombuffer((asset/'dragon-peony-height.gray8.bin').read_bytes(),dtype=np.uint8).reshape((h,w)).copy()
coarse=np.asarray(Image.fromarray(raw).filter(ImageFilter.GaussianBlur(4.8)))
# Exact Euclidean distance transform via the linear lower-envelope algorithm.
# Distance to actual silhouette/through-openings rounds the large carved mass.
def edt1(f):
 n=len(f);v=np.zeros(n,dtype=np.int32);z=np.zeros(n+1);d=np.zeros(n)
 k=0;z[0]=-1e30;z[1]=1e30
 for q in range(1,n):
  s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k])
  while s<=z[k]:
   k-=1;s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k])
  k+=1;v[k]=q;z[k]=s;z[k+1]=1e30
 k=0
 for q in range(n):
  while z[k+1]<q:k+=1
  d[q]=(q-v[k])**2+f[v[k]]
 return d
f=np.where(raw>24,1e9,0.)
for j in range(h):f[j]=edt1(f[j])
for i in range(w):f[:,i]=edt1(f[:,i])
dist=np.sqrt(f)
distance=np.asarray(Image.fromarray(np.clip(dist/20*255,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.48)))
out=asset/'dragon-peony-mass-chisel-r02.gray8.bin'
out.write_bytes(raw.tobytes()+coarse.tobytes()+distance.tobytes())
Image.fromarray(coarse).save(root/'authoring/r02-broad-mass-preview.png')
Image.fromarray(distance).save(root/'authoring/r02-edge-distance-preview.png')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
r={'revision':'ornament224-r02','inputScalarSha256':sha(asset/'dragon-peony-height.gray8.bin'),'multiscaleScalarSha256':sha(out),'layout':'Three planar Uint8 fields1536x256: raw authored scalar for contour/fine chisels; Gaussian4.8px for broad geometry only; exact Euclidean distance/20px blurred0.48px for convex carving thickness.','runtimeIntent':'34mm maximum macro relief,6mm rear thickness, fine detail multiplier1mm applied to raw-minus-broad (typical amplitude well below1mm). Constant uniform gold material receives all scene light.','distanceMaxPixels':float(dist.max()),'noMaterialImage':True,'notMeasuredDepth':True,'visualAccepted':False,'photographicAccepted':False}
(asset/'mass-chisel-r02-provenance.json').write_text(json.dumps(r,indent=2))
print(json.dumps(r,indent=2))
