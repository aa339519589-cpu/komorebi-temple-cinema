"""Seeded, periodic 3-D granite microstructure in metres, no reference RGB.
Normal data is the derivative of the surface height, not painted shading.
"""
from pathlib import Path
import numpy as np,cv2,json
from PIL import Image
from scipy.spatial import cKDTree
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'reconstructions/scene-04/assets/granite-aggregate04';OUT.mkdir(parents=True,exist_ok=True)
N=1024;PERIOD=.30;pitch=PERIOD/52;rng=np.random.default_rng(804231)
x,y=np.meshgrid((np.arange(52)+.5)*pitch,(np.arange(52)+.5)*pitch)
points=np.stack([x.ravel(),y.ravel()],axis=1)+rng.uniform(-.42,.42,(52*52,2))*pitch
periodic=np.concatenate([points+[i*PERIOD,j*PERIOD] for j in [-1,0,1] for i in [-1,0,1]])
lookup=np.tile(np.arange(len(points)),9);tree=cKDTree(periodic)
def gaussian_periodic(a,sigma):
 pad=int(np.ceil(sigma*4));ap=np.pad(a,((pad,pad),(pad,pad))+(() if a.ndim==2 else ((0,0),)),mode='wrap');b=cv2.GaussianBlur(ap,(0,0),sigma);return b[pad:-pad,pad:-pad]
u,v=np.meshgrid(np.arange(N,dtype=np.float32)*PERIOD/N,np.arange(N,dtype=np.float32)*PERIOD/N)
def warp_field():
 a=gaussian_periodic(rng.normal(0,1,(N,N)).astype(np.float32),9);a/=a.std();b=gaussian_periodic(rng.normal(0,1,(N,N)).astype(np.float32),31);b/=b.std();return a*.00115+b*.00065
query=np.stack([(u+warp_field()).ravel(),(v+warp_field()).ravel()],axis=1);dist,idx=tree.query(query,k=2,workers=4)
label=lookup[idx[:,0]];site=periodic[idx[:,0]];delta=query-site
r=rng.random(len(points));amp=rng.uniform(.00045,.00135,len(points));angle=rng.uniform(0,np.pi*2,len(points));slope=rng.uniform(.16,.65,len(points));sx=np.cos(angle)*slope;sy=np.sin(angle)*slope
edge=np.clip((dist[:,1]-dist[:,0])/.00135,0,1);edge=edge*edge*(3-2*edge)
cap=np.clip(amp[label]+delta[:,0]*sx[label]+delta[:,1]*sy[label],.00015,.00210)
h=(cap*edge-.00018*(1-edge)).reshape(N,N).astype(np.float32)
fine=gaussian_periodic(rng.normal(0,1,(N,N)).astype(np.float32),1.1);fine/=fine.std();h+=fine*.000075
# Larger resolved relief goes into vertices. The residual goes into tangent
# normals, so the same micro-slope is not counted twice in the physical surface.
low=gaussian_periodic(h,5);low-=low.mean();residual=h-low
step=PERIOD/N;dx=(np.roll(residual,-1,1)-np.roll(residual,1,1))/(2*step);dy=(np.roll(residual,-1,0)-np.roll(residual,1,0))/(2*step)
normal=np.stack([-dx,dy,np.ones_like(dx)],axis=-1);normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
mineral=np.where(r<.18,0,np.where(r>.72,2,1));base=np.empty((len(points),3),np.float32)
for k,colour in enumerate([[.028,.027,.024],[.092,.085,.074],[.192,.185,.166]]):
 take=mineral==k;base[take]=np.array(colour)*rng.uniform(.78,1.24,(take.sum(),1))
colour=base[label].reshape(N,N,3)*( .92+.08*edge.reshape(N,N,1))
colour*=np.clip(1+fine[:,:,None]*.10,.67,1.30)*rng.uniform(.94,1.06,(N,N,1));colour=np.clip(colour,.004,.35)
colour*=np.array([.105,.100,.090])/colour.mean(axis=(0,1))
srgb=np.where(colour<=.0031308,colour*12.92,1.055*colour**(1/2.4)-.055)
rough=np.where(mineral[label]==2,.56,np.where(mineral[label]==0,.61,.78)).reshape(N,N)+rng.uniform(-.04,.04,(N,N))
for suffix,img in [('diff',srgb),('nor_gl',normal*.5+.5),('rough',np.repeat(rough[:,:,None],3,axis=2))]:Image.fromarray(np.uint8(np.clip(img,0,1)*255)).save(OUT/('granite-aggregate-'+suffix+'.png'),optimize=True)
low.astype('<f4').tofile(OUT/'geometry-height.f32.bin')
(OUT/'manifest.json').write_text(json.dumps({'revision':'granite-aggregate04-v01','method':'Periodic Voronoi mineral volumes with actual metric height; finite-difference residual normals','seed':804231,'periodMetres':PERIOD,'size':N,'meanGrainPitchMetres':pitch,'referenceRGBUsed':False,'photographicAcceptance':False,'geometryHeight':{'file':'geometry-height.f32.bin','dtype':'little-endian-float32','imageY':'negative physical V','minMetres':float(low.min()),'maxMetres':float(low.max())},'limits':['Mineral microstructure is an authored hypothesis, not recovered individual crystals.','Visible slab joints remain separately observed geometry.']},indent=2)+'\n')
print(json.dumps({'grains':len(points),'pitchMM':pitch*1000,'normalSlopeP95':float(np.quantile(np.sqrt(dx*dx+dy*dy),.95)),'heightRangeMM':[float(low.min()*1000),float(low.max()*1000)]}))
