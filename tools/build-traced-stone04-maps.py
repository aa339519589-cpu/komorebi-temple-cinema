"""Build metre-scaled per-stone PBR inputs from an attributed CC0 granite scan.
The supplied temple image is never opened. Layout uses manually observed joints.
Wet regions, material scale, hidden wear and stone reflectance remain hypotheses.
"""
from pathlib import Path
import ast, json, re, hashlib
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
scan=ROOT/'reconstructions/scene-04/assets/rough-granite-wall'
crop=(650,60,1250,370)
open_scan=lambda suffix:Image.open(scan/('granite_wall_'+suffix+'_4k.jpg')).crop(crop)
diff=np.asarray(open_scan('diff').convert('RGB'),np.float32)/255
lin=np.where(diff<=.04045,diff/12.92,((diff+.055)/1.055)**2.4)
# Neutral mineral base, preserving the actual scan's angular grains. This is a
# material tint inference; the image's baked sunlight is not a texture input.
# The scan includes the original wall block's large shape. Remove only that
# broad reflectance gradient; preserve the mineral-scale measured RGB detail.
flat=cv2.GaussianBlur(lin,(0,0),16)
lin=np.clip(lin/np.maximum(flat,.015),.34,2.1)
lin*=np.array([.158,.156,.146],np.float32)/lin.mean(axis=(0,1))
nor=np.asarray(open_scan('nor_gl').convert('RGB'),np.float32)/127.5-1
rough=np.asarray(open_scan('rough').convert('L'),np.float32)/255
# The source block's broad normal curvature belongs to a different object.
# Our individually built slabs already provide that geometry; keep grain slopes.
nor[:,:,:2]-=cv2.GaussianBlur(nor[:,:,:2],(0,0),10)
nor[:,:,:2]*=.62
nor[:,:,2]=1
nor/=np.maximum(np.linalg.norm(nor,axis=2,keepdims=True),.01)
period=np.array([(crop[2]-crop[0])*1.9/4096,(crop[3]-crop[1])*1.9/4096])
damp_observations=json.loads((OUT/'damp-region-observations.json').read_text())
damp_polygons=[np.array([world(p) for p in polygon],np.float32) for polygon in damp_observations['regions']]
# Convert the scan into a periodic material without a mirrored seam. Each
# shifted window fades to zero at its own wrap boundary; mineral grains remain
# the original scanned grains, with no left/right butterfly duplication.
def periodic_sample(image,px,py):
 out=np.zeros(px.shape+(() if image.ndim==2 else (image.shape[2],)),np.float32)
 for ox in [0,.5]:
  for oy in [0,.5]:
   qx=(px+ox)%1;qy=(py+oy)%1
   wx=np.sin(np.pi*qx)**2;wy=np.sin(np.pi*qy)**2;w=wx*wy
   a=cv2.remap(image,(qx*(image.shape[1]-1)).astype(np.float32),((1-qy)*(image.shape[0]-1)).astype(np.float32),cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT_101)
   out+=a*(w if image.ndim==2 else w[:,:,None])
 return out
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
  coat=np.stack([wet*.90,.18+.13*(1-wet)+.045*meso,np.zeros_like(wet)],axis=-1)
  save=lambda suffix,img:Image.fromarray(np.uint8(np.clip(img,0,1)*255)).save(OUT/(ident+'-'+suffix+'.png'),optimize=True)
  save('basecolor',srgb);save('normal',nn*.5+.5);save('roughness',np.repeat(ro[:,:,None],3,axis=2));save('wetlayer',coat)
  records.append({'id':ident,'boundsXZ':[lo.tolist(),hi.tolist()],'size':size,'physicalGraniteRepeatMetres':period.tolist(),'source':'CC0 Granite Tile 04; per-stone authored damp/roughness fields','referenceRGBUsed':False})
manifest={'revision':'traced-stone04-81','scope':'PBR material candidates, not accepted photographic matches','observationInputSha256':hashlib.sha256(json.dumps({'edges':edges,'joints':joints},separators=(',',':')).encode()).hexdigest(),'referenceRGBUsed':False,'scanSource':'https://polyhaven.com/a/granite_wall','scanAuthor':'Dimitrios Savva','scanCropPixels':list(crop),'scanLicense':'CC0','physicalGraniteRepeatMetres':period.tolist(),'albedoDryMeanLinearRGB':[.158,.156,.146],'clearLayerIOR':1.333,'assumptions':['Physical scale and neutral mineral reflectance inferred.','Damp contours coarsely manually observed; not pixel-exact recovered material state.','Original UV layout is not used to depict an assembled floor.'],'records':records}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Built {len(records)} individually mapped PBR stone sets; reference photograph never read.')
