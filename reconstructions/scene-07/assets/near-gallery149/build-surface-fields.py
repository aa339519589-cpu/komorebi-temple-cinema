"""Rebuild declared PBR surface fields. Never reads a scene photograph.
Original Grey Roof01 bytes/metadata remain beside the derived maps.
"""
from pathlib import Path
from PIL import Image
from scipy.ndimage import gaussian_filter
import numpy as np, json, hashlib
P=Path(__file__).resolve().parent
rng=np.random.default_rng(7149149)
N=512
src={k:np.asarray(Image.open(P/f'grey_roof_01_{suffix}_4k.jpg').convert('RGB'),dtype=np.float32)/255 for k,suffix in [('diff','diff'),('normal','nor_gl'),('rough','rough'),('bump','bump')]}
# Select flat interiors from the independent scanned ceramic, avoiding the
# photographed tile laps, interlocking channels and accumulated grout shadows.
normal=src['normal']*2-1
luma=src['diff']@np.array([.2126,.7152,.0722],dtype=np.float32)
candidates=[]
for y in range(64,4032,28):
 for x in range(64,4032,28):
  sl=(slice(y,y+32),slice(x,x+32));n=normal[sl];d=luma[sl]
  score=float(np.mean(n[:,:,:2]**2))
  if float(np.min(d))>.12 and float(np.mean(n[:,:,2]))>.95 and score<.025:
   candidates.append((score,x,y))
assert len(candidates)>64,len(candidates)
candidates.sort()
# Overlap-add samples with a periodic cosine window. Corresponding PBR maps
# share the same chosen pixels. Remove each patch's broad molded-tile normal;
# the actual closed mesh supplies the cylinder/profile instead.
fields={k:np.zeros((N,N,3),np.float32) for k in src};weight=np.zeros((N,N),np.float32)
w=np.outer(np.sin(np.linspace(.01,np.pi-.01,32))**2,np.sin(np.linspace(.01,np.pi-.01,32))**2)
patches=[]
for yy in range(-16,N,16):
 for xx in range(-16,N,16):
  _,x,y=candidates[int(rng.integers(0,min(240,len(candidates))))];patches.append([x,y,32,32])
  yi=(np.arange(32)+yy)%N;xi=(np.arange(32)+xx)%N
  for k in src:
   p=src[k][y:y+32,x:x+32].copy()
   if k=='normal':
    q=p*2-1;q[:,:,:2]-=gaussian_filter(q[:,:,:2],sigma=(6,6,0),mode='reflect');q[:,:,2]=np.sqrt(np.maximum(.1,1-np.sum(q[:,:,:2]**2,axis=2)));p=(q+1)*.5
   else:p=p-gaussian_filter(p,sigma=(7,7,0),mode='reflect')+(.75 if k=='diff' else .5)
   fields[k][np.ix_(yi,xi)]+=p*w[:,:,None]
  weight[np.ix_(yi,xi)]+=w
for k in fields:fields[k]/=weight[:,:,None]
def noise(sigma):
 a=gaussian_filter(rng.normal(size=(N,N)).astype(np.float32),sigma,mode='wrap');return a/max(1e-8,float(a.std()))
macro=noise(35);mid=noise(9);fine=noise(.55)
# A neutral translucent fired glaze. Its patchy reflectance is inferred from
# the target surface class, not copied light, RGB or geometry from the photo.
f=fields['diff'].mean(2)-.75
albedo=np.clip(.87+f*.90+macro*.020+mid*.009,.74,.98)
rough=np.clip(.70+macro*.075+mid*.035+(fields['rough'].mean(2)-.5)*.9,.46,.96)
glaze=np.clip(.70-macro*.11-mid*.04,.27,.96)
n=fields['normal']*2-1;n[:,:,:2]*=1.65;n[:,:,2]=np.sqrt(np.maximum(.05,1-np.sum(n[:,:,:2]**2,axis=2)));n=(n+1)*.5
metal_rough=np.clip(.78+noise(19)*.09+noise(2.6)*.065+fine*.018,.44,.99)
metal_bump=np.clip(.5+noise(1.6)*.08+noise(14)*.04,.1,.9)
for name,a in [('ceramic-neutral-diff.png',albedo),('ceramic-glaze-rough.png',rough),('ceramic-glaze-weight.png',glaze),('ceramic-micro-normal-gl.png',n),('cast-metal-rough.png',metal_rough),('cast-metal-height.png',metal_bump)]:
 if a.ndim==2:a=np.repeat(a[:,:,None],3,2)
 Image.fromarray(np.round(np.clip(a,0,1)*255).astype('uint8'),'RGB').save(P/name)
record={'method':'Deterministic overlap-add of joint-free 32x32 scanned ceramic interiors, broad source normals removed; authored low-frequency firing/glaze and wear fields. No scene photograph is read.','derivedResolution':[N,N],'sourceInteriorCandidateCount':len(candidates),'patches':patches,'runtimeSampleRepeatMetres':.25,'glazeField':'Spatial inference for a partly sealed ceramic surface; not measured target BRDF.','metalFields':'Project-authored periodic multiscale casting pores and roughness, seed7149149.','normalConvention':'OpenGL, tangent +U across tile, +V along run. Low-frequency source tile molding removed so the true tile mesh supplies the curve.'}
(P/'surface-derivation.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps({'candidateCount':len(candidates),'maps':{p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in P.glob('*.png')}},indent=2))
