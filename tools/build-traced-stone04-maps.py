"""Build metre-scaled per-stone PBR inputs from authored mineral materials.
The supplied temple image is never opened. Layout uses manually observed joints.
Wet regions, material scale, hidden wear and stone reflectance remain hypotheses.
"""
from pathlib import Path
import ast, json, re, hashlib,sys
import numpy as np
from PIL import Image
import cv2
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'reconstructions/scene-04/src/traced-paving04.js'
OUT=ROOT/'reconstructions/scene-04/assets/traced-stone04';OUT.mkdir(parents=True,exist_ok=True)
src=SRC.read_text()
edges=ast.literal_eval(re.search(r'const edgeProfiles=(\[[\s\S]*?\n\]);',src).group(1))
joints=ast.literal_eval(re.search(r'const joints=(\[[\s\S]*?\n\]);',src).group(1))
camera=np.array([0,1.35,23.34]);target=np.array([0,2.3,0]);f=target-camera;f/=np.linalg.norm(f);r=np.cross(f,[0,1,0]);r/=np.linalg.norm(r);u=np.cross(r,f);half=np.tan(np.radians(64.1754241)/2)
def world(p):
 d=f+r*(p[0]/627-1)*half+u*(1-p[1]/627)*half
 q=camera+d*((.048-camera[1])/d[1]);return [q[0],q[2]]
def ex(a,y):
 k=0
 while k<len(a)-2 and y>a[k+1][0]:k+=1
 p,q=a[k],a[k+1];return p[1]+(q[1]-p[1])*(y-p[0])/(q[0]-p[0])
image_assisted='--image-assisted87' in sys.argv
scan=ROOT/('reconstructions/scene-04/assets/granite-image87' if image_assisted else 'reconstructions/scene-04/assets/granite-aggregate04')
prefix='granite-image87' if image_assisted else 'granite-aggregate'
open_scan=lambda suffix:Image.open(scan/(prefix+'-'+suffix+'.png'))
diff=np.asarray(open_scan('diff').convert('RGB'),np.float32)/255
lin=np.where(diff<=.04045,diff/12.92,((diff+.055)/1.055)**2.4)
nor=np.asarray(open_scan('nor_gl').convert('RGB'),np.float32)/127.5-1
rough=np.asarray(open_scan('rough').convert('L'),np.float32)/255
period=np.array([.60,.60] if image_assisted else [.30,.30])
damp_observations=json.loads((OUT/'damp-region-observations.json').read_text())
damp_polygons=[np.array([world(p) for p in polygon],np.float32) for polygon in damp_observations['regions']]
# Convert the scan into a periodic material without a mirrored seam. Each
# shifted window fades to zero at its own wrap boundary; mineral grains remain
# the original scanned grains, with no left/right butterfly duplication.
def periodic_sample(image,px,py):
 return cv2.remap(image,((px%1)*image.shape[1]).astype(np.float32),(((1-py)%1)*image.shape[0]).astype(np.float32),cv2.INTER_LINEAR,borderMode=cv2.BORDER_WRAP)
records=[]
def noise(x,z,s):
 ix=np.floor(x);iz=np.floor(z);a=x-ix;b=z-iz;a=a*a*(3-2*a);b=b*b*(3-2*b)
 def h(q,w):return np.mod(np.sin(q*127.1+w*311.7+s*17.13)*43758.5453,1)
 return (h(ix,iz)*(1-a)+h(ix+1,iz)*a)*(1-b)+(h(ix,iz+1)*(1-a)+h(ix+1,iz+1)*a)*b
for col in range(3):
 for row in range(len(joints[col])-1):
  a,b=joints[col][row:row+2];pix=[[ex(edges[col],a[0]),a[0]],[ex(edges[col+1],a[1]),a[1]],[ex(edges[col+1],b[1]),b[1]],[ex(edges[col],b[0]),b[0]]]
  poly=np.array([world(p) for p in pix]);lo=poly.min(axis=0)-.18;hi=poly.max(axis=0)+.18
  ident='observed-'+['west','centre','east'][col]+'-'+str(row+1).zfill(2)
  size=1024 if max(p[1] for p in pix)>1000 else 512
  xx,zz=np.meshgrid(np.linspace(lo[0],hi[0],size,dtype=np.float32),np.linspace(hi[1],lo[1],size,dtype=np.float32))
  seed=739+col*139+row*31
  angle=(seed*.417)%6.283185307;cc=np.cos(angle);ss=np.sin(angle)
  px=((xx*cc+zz*ss)/period[0]+.137*seed)%1;py=((-xx*ss+zz*cc)/period[1]+.219*seed)%1
  alb=periodic_sample(lin,px,py)
  nn=periodic_sample(nor,px,py)
  rr=periodic_sample(rough,px,py)
  # Rotate the tangent slopes with the independently oriented physical scan.
  nx=nn[:,:,0].copy();ny=nn[:,:,1].copy();nn[:,:,0]=cc*nx-ss*ny;nn[:,:,1]=ss*nx+cc*ny
  nn[:,:,:2]*=.84;nn/=np.maximum(np.linalg.norm(nn,axis=2,keepdims=True),.01)
  ux=(xx-lo[0])/(hi[0]-lo[0]);uz=(zz-lo[1])/(hi[1]-lo[1]);macro=noise(xx*2.1,zz*2.1,seed+49);meso=noise(xx*11,zz*11,seed+91)
  # Local connected damp basins, especially the west column. Not independent
  # blue flecks and not a reflection painted into RGB. The clear layer obtains
  # reflections from an actual scene capture at render time.
  mask=np.zeros((size,size),np.uint8)
  for polygon in damp_polygons:
   pp=np.empty_like(polygon);pp[:,0]=(polygon[:,0]-lo[0])/(hi[0]-lo[0])*(size-1);pp[:,1]=(hi[1]-polygon[:,1])/(hi[1]-lo[1])*(size-1)
   cv2.fillPoly(mask,[np.rint(pp).astype(np.int32)],255)
  # Capillary fringes follow the observed connected contours with a physical
  # 8mm softness and small pore-scale interruptions, without a painted glint.
  sigma=max(1,.028/(hi[0]-lo[0])*size)
  wet=cv2.GaussianBlur(mask.astype(np.float32)/255,(0,0),sigma)
  wet=np.clip((wet-.21+.33*(meso-.5)+.21*(macro-.5))/.62,0,1)
  # Worn mineral palette, stable albedo under changing camera/light, with a
  # low contrast weather bloom and darker optically saturated wet pores.
  variation=1+.055*np.sin(seed*1.97)
  alb*=variation*(.91+.20*macro)[:,:,None]
  alb*= (1-.51*wet)[:,:,None]
  # Pale surface weathering remains mineral variation, not painted highlights.
  bloom=np.clip((noise(xx*7.3,zz*7.3,seed+143)-.56)/.23,0,1)*(1-wet)
  alb=alb*(1-.08*bloom[:,:,None])+.010*bloom[:,:,None]
  srgb=np.where(alb<=.0031308,alb*12.92,1.055*np.maximum(alb,0)**(1/2.4)-.055)
  ro=np.clip(.62+.32*rr-.25*wet,.34,.94)
  # R: wet clear-layer coverage, G: roughness of that layer (uniform multiplier
  # 1). B unused. At dry points coverage is zero, avoiding a shell-like sheen.
  coat=np.stack([wet*.90,.045+.065*(1-wet)+.035*meso,np.zeros_like(wet)],axis=-1)
  save=lambda suffix,img:Image.fromarray(np.uint8(np.clip(img,0,1)*255)).save(OUT/(ident+'-'+suffix+'.png'),optimize=True)
  save('basecolor',srgb);save('normal',nn*.5+.5);save('roughness',np.repeat(ro[:,:,None],3,axis=2));save('wetlayer',coat)
  records.append({'id':ident,'boundsXZ':[lo.tolist(),hi.tolist()],'size':size,'physicalGraniteRepeatMetres':period.tolist(),'source':'Code-built periodic metric mineral volumes and coarsely observed damp material state','referenceRGBUsed':False})
manifest={'revision':'traced-stone04-84','scope':'PBR material candidates, not accepted photographic matches','observationInputSha256':hashlib.sha256(json.dumps({'edges':edges,'joints':joints},separators=(',',':')).encode()).hexdigest(),'referenceRGBUsed':False,'microstructureSource':'tools/build-granite-aggregate04.py','method':'Authored metric mineral volumes; normal is the residual height derivative','microstructureAuthorship':'Code-authored in this public project','physicalGraniteRepeatMetres':period.tolist(),'albedoDryMeanLinearRGB':[.105,.100,.090],'clearLayerIOR':1.333,'assumptions':['Crystal placement and mineral reflectance are authored physical hypotheses.','Damp contours coarsely manually observed; not pixel-exact recovered material state.','Original UV layout is not used to depict an assembled floor.'],'records':records}
if image_assisted:
 manifest.update(revision='traced-stone04-87',microstructureSource='tools/build-image-assisted-granite87.py',method='Generated neutral mineral diffuse with authored shallow residual normal relief; observed floor joints remain actual geometry',microstructureAuthorship='Built-in image_gen material guide and code-derived material estimates',imageGenerationProvenance='lookdev/stone-material87/imagegen-provenance.json',generatedGuideConditionedOnReference=True,referenceSceneRGBProjected=False,albedoDryMeanLinearRGB=[.140,.131,.117])
 for r in manifest['records']:r['source']='Generated neutral mineral material guide and authored estimated microrelief, with coarsely observed damp material state'
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Built {len(records)} individually mapped PBR stone sets; reference photograph never read.')
