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
scan=ROOT/'reconstructions/scene-04/assets/granite-tile-04'
diff=np.asarray(Image.open(scan/'granite-face-diff.png').convert('RGB'),np.float32)/255
lin=np.where(diff<=.04045,diff/12.92,((diff+.055)/1.055)**2.4)
# Neutral mineral base, preserving the actual scan's angular grains. This is a
# material tint inference; the image's baked sunlight is not a texture input.
lin*=np.array([.201,.195,.180],np.float32)/lin.mean(axis=(0,1))
nor=np.asarray(Image.open(scan/'granite-face-nor_gl.png').convert('RGB'),np.float32)/127.5-1
rough=np.asarray(Image.open(scan/'granite-face-rough.png').convert('L'),np.float32)/255
period=.82
records=[]
def noise(x,z,s):
 ix=np.floor(x);iz=np.floor(z);a=x-ix;b=z-iz;a=a*a*(3-2*a);b=b*b*(3-2*b)
 def h(q,w):return np.mod(np.sin(q*127.1+w*311.7+s*17.13)*43758.5453,1)
 return (h(ix,iz)*(1-a)+h(ix+1,iz)*a)*(1-b)+(h(ix,iz+1)*(1-a)+h(ix+1,iz+1)*a)*b
for col in range(3):
 for row in range(len(joints[col])-1):
  a,b=joints[col][row:row+2];pix=[[ex(edges[col],a[0]),a[0]],[ex(edges[col+1],a[1]),a[1]],[ex(edges[col+1],b[1]),b[1]],[ex(edges[col],b[0]),b[0]]]
  poly=np.array([world(p) for p in pix]);lo=poly.min(axis=0)-.025;hi=poly.max(axis=0)+.025
  ident='observed-'+['west','centre','east'][col]+'-'+str(row+1).zfill(2)
  size=1024 if max(p[1] for p in pix)>1000 else 512
  xx,zz=np.meshgrid(np.linspace(lo[0],hi[0],size,dtype=np.float32),np.linspace(hi[1],lo[1],size,dtype=np.float32))
  seed=739+col*139+row*31
  sx=((xx/period+.137*seed)%2);sx=np.where(sx>1,2-sx,sx)
  sz=((zz/period+.219*seed)%2);sz=np.where(sz>1,2-sz,sz)
  mx=(sx*(diff.shape[1]-1)).astype(np.float32);my=((1-sz)*(diff.shape[0]-1)).astype(np.float32)
  alb=cv2.remap(lin,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT_101)
  nn=cv2.remap(nor,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT_101)
  rr=cv2.remap(rough,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT_101)
  # Mirrored physical coordinates must mirror the normal's tangent components.
  nn[:,:,0]*=np.where(((xx/period+.137*seed)%2)>1,-1,1)
  nn[:,:,1]*=np.where(((zz/period+.219*seed)%2)>1,-1,1)
  nn[:,:,:2]*=.88;nn/=np.maximum(np.linalg.norm(nn,axis=2,keepdims=True),.01)
  ux=(xx-lo[0])/(hi[0]-lo[0]);uz=(zz-lo[1])/(hi[1]-lo[1]);macro=noise(xx*2.1,zz*2.1,seed+49);meso=noise(xx*11,zz*11,seed+91)
  # Local connected damp basins, especially the west column. Not independent
  # blue flecks and not a reflection painted into RGB. The clear layer obtains
  # reflections from an actual scene capture at render time.
  centrex=[.30,.76,.37][col]+.14*np.sin(row*2.399);centrez=.44+.17*np.cos(row*1.79)
  radius=[1.15,.52,.66][col] if row>4 else [.61,.38,.43][col]
  basin=np.exp(-(((ux-centrex)/radius)**2+((uz-centrez)/(.56+.18*np.sin(row*.7)))**2)*2.0)
  secondary=.48*np.exp(-(((ux-(.8 if col==0 else .08))/.37)**2+((uz-.84)/.51)**2)*2)
  field=basin+secondary+.20*(macro-.5)+.10*(meso-.5)
  wet=np.clip((field-.25)/.44,0,1);wet=wet*wet*(3-2*wet)
  # Worn mineral palette, stable albedo under changing camera/light, with a
  # low contrast weather bloom and darker optically saturated wet pores.
  variation=1+.055*np.sin(seed*1.97)
  alb*=variation*(.91+.20*macro)[:,:,None]
  alb*= (1-.44*wet)[:,:,None]
  # Pale surface weathering remains mineral variation, not painted highlights.
  bloom=np.clip((noise(xx*7.3,zz*7.3,seed+143)-.56)/.23,0,1)*(1-wet)
  alb=alb*(1-.10*bloom[:,:,None])+.034*bloom[:,:,None]
  srgb=np.where(alb<=.0031308,alb*12.92,1.055*np.maximum(alb,0)**(1/2.4)-.055)
  ro=np.clip(.62+.32*rr-.25*wet,.34,.94)
  # R: wet clear-layer coverage, G: roughness of that layer (uniform multiplier
  # 1). B unused. At dry points coverage is zero, avoiding a shell-like sheen.
  coat=np.stack([wet,.095+.12*(1-wet)+.035*meso,np.zeros_like(wet)],axis=-1)
  save=lambda suffix,img:Image.fromarray(np.uint8(np.clip(img,0,1)*255)).save(OUT/(ident+'-'+suffix+'.png'),optimize=True)
  save('basecolor',srgb);save('normal',nn*.5+.5);save('roughness',np.repeat(ro[:,:,None],3,axis=2));save('wetlayer',coat)
  records.append({'id':ident,'boundsXZ':[lo.tolist(),hi.tolist()],'size':size,'physicalGraniteRepeatMetres':period,'source':'CC0 Granite Tile 04; per-stone authored damp/roughness fields','referenceRGBUsed':False})
manifest={'revision':'traced-stone04-78','scope':'PBR material candidates, not accepted photographic matches','layoutSourceSha256':hashlib.sha256(src.encode()).hexdigest(),'referenceRGBUsed':False,'scanSource':'https://polyhaven.com/a/granite_tile_04','scanAuthor':'Amal Kumar','scanLicense':'CC0','physicalGraniteRepeatMetres':period,'albedoDryMeanLinearRGB':[.201,.195,.180],'clearLayerIOR':1.333,'assumptions':['Physical scale and neutral mineral reflectance inferred.','Wet-basin contours authored, not pixel-exact measurements.','Original UV layout is not used to depict an assembled floor.'],'records':records}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Built {len(records)} individually mapped PBR stone sets; reference photograph never read.')
