"""Scene03's own bounded manual-landmark fit. No photo pixels enter runtime.

Feature names are inferred from an oblique photograph, not a building survey.
The output is a candidate for real native inspection, never photo acceptance.
"""
from pathlib import Path
import json, math
import numpy as np
from scipy.optimize import least_squares

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'qa/ten-reference/03/architecture106-fit'
OUT.mkdir(parents=True,exist_ok=True)
PARAMS={
 'cameraX':(-2.4,-4,5,2.0),'cameraY':(.72,.60,.90,.12),'cameraZ':(18.2,15,25,2.5),
 'viewYaw':(math.atan2(4,21.2),-.02,.45,.10),'viewPitch':(math.atan2(6.38,math.hypot(4,21.2)),.18,.43,.07),'fov':(58,43,70,8),
 'hallX':(7.1163,5.5,9,1),'hallY':(1.25,.8,2.5,.65),'hallZ':(-1.2975,-4,1,1.5),'hallYaw':(-.5942,-.95,-.30,.18),
 'bodyWidthScale':(1,.88,1.12,.09),'capitalY':(9.1,8.1,9.8,.65),
 'lowerWidth':(17.4,15.2,19,1.3),'lowerEave':(10.5,9.3,11.5,.7),
 'upperWidth':(13.6,12,15.8,1.2),'upperEave':(14.6,13.1,15.8,.8),'ridgeY':(19.6,18,21.2,.9),
 'gablePeak':(19.12,17.8,20.3,.8),'gableCenter':(.10,-.6,.7,.35),
 'portalHeight':(4.08,2.9,4.4,.6),'curtainX':(0,-.9,.9,.45),'curtainY':(6.95,5.8,7.5,.55),'curtainHeight':(2.1,1.35,2.3,.4),
 'towerX':(-5.4,-7,-3.8,1.0),'towerY':(-.4,-.5,3.0,1.4),'towerZ':(-11.3,-15,-8,1.6),'towerYaw':(math.pi/4,.45,1.1,.2),
 'towerPitch':(2.55,2.2,3.1,.30),'towerWidthScale':(1,.92,1.10,.08),'towerFinial':(27,22.5,28,1.8),
 'bridgeX':(-3.1,-3.9,-2.3,.45),'bridgeY':(.55,.25,.8,.20),'bridgeZ':(7.05,6,8.0,.65),'bridgeYaw':(-.28,-.55,.45,.28),'bridgeSpan':(7.2,6.6,8.1,.6),'bridgeDepth':(1.94,1.7,3.0,.5),
}
KEYS=list(PARAMS);DEFAULT=np.array([PARAMS[k][0]for k in KEYS]);LO=np.array([PARAMS[k][1]for k in KEYS]);HI=np.array([PARAMS[k][2]for k in KEYS]);PRIOR=np.array([PARAMS[k][3]for k in KEYS])
LANDMARKS=[]
def mark(name,kind,arg,pixel,sigma):LANDMARKS.append((name,kind,arg,pixel,sigma))
# Weather-profile corner/tip semantics have 10–18px uncertainty because
# adjacent tile tails, ridge caps and hanging fittings overlap in the photo.
mark('main upper left ceramic corner','hall_eave',('upper',-1),[480,262],14)
mark('main lower left ceramic corner','hall_eave',('lower',-1),[405,441],13)
mark('front dormer crown weather line','gable',None,[781,76],10)
for x,label,head,foot in [(-2.86,'left inner',[684,499],[686,690]),(2.86,'right inner',[948,448],[958,668])]:
 mark(label+' shaft head','column',(x,'head'),head,16);mark(label+' bearing foot','column',(x,'foot'),foot,20)
mark('portal threshold centre','threshold',None,[832,690],18)
mark('portal carved lintel centre','portal',None,[835,515],21)
mark('white curtain upper midpoint','curtain',1,[780,545],12)
mark('white curtain lower midpoint','curtain',-1,[780,638],12)
for level,left,front in [(0,[105,601],[282,548]),(1,[124,506],[292,451]),(2,[138,416],[300,359]),(3,[155,329],[309,270]),(4,[174,246],[319,178])]:
 mark('tower tier'+str(level+1)+' far left corner','tower',(level,'left'),left,13 if level>0 else 20)
 mark('tower tier'+str(level+1)+' near hip corner','tower',(level,'front'),front,13 if level>0 else 22)
mark('tower gilt finial tip','tower_finial',None,[357,54],9)
# The spherical finial centres are less ambiguous than mixed bud/pole tips.
for j,z,pt,sig in [(4,1,[164,585],12),(8,1,[425,602],12),(12,1,[678,707],14),(12,-1,[764,757],20)]:
 mark('bridge '+('near'if z>0 else'far')+' principal ball '+str(j),'bridge',(j,z),pt,sig)
mark('near granite toro finial','fixed',([6.25,6.523,8]),[1212,424],17)
mark('near lotus pollen centre','fixed',([-2.3,.6925,14.731]),[422,970],16)
mark('closed foreground bud tip','fixed',([-2.763,.637,16.45]),[130,975],23)

def rotate(p,yaw):
 x,y,z=p;c,s=math.cos(yaw),math.sin(yaw);return np.array([c*x+s*z,y,-s*x+c*z])
def hall(p,v):return np.array([p['hallX'],p['hallY'],p['hallZ']-4])+rotate([v[0],v[1],v[2]+4],p['hallYaw'])
def anchor(p,item):
 _,kind,arg,_,_=item
 if kind=='fixed':return np.array(arg)
 if kind=='hall_eave':
  roof,u=arg;t=1.13;w=p[roof+'Width'];e=p[roof+'Eave'];hd=5.2 if roof=='upper'else 5.1;z=-5 if roof=='upper'else-4.5;curl=.72 if roof=='upper'else.56
  return hall(p,[u*(w*.275+w*.225*t),e+curl+.13*.56+.025,z+hd*t])
 if kind=='gable':return hall(p,[p['gableCenter'],p['gablePeak'],.25])
 if kind=='column':
  x,k=arg;return hall(p,[x*p['bodyWidthScale'],p['capitalY']-.30 if k=='head'else 4,0])
 if kind=='threshold':return hall(p,[0,4,-.62])
 if kind=='portal':return hall(p,[0,4+p['portalHeight']+.23,-.62])
 if kind=='curtain':return hall(p,[p['curtainX'],p['curtainY']+arg*p['curtainHeight']/2,.85])
 if kind=='tower_finial':return np.array([p['towerX'],p['towerY']+1.06*p['towerFinial'],p['towerZ']])
 if kind=='tower':
  level,which=arg;w=([6.3,6.12,5.95,5.78,5.60][level])*p['towerWidthScale'];y=6.9+level*p['towerPitch']+.3896
  local=[-w*.5*1.035,y,(-1 if which=='left'else 1)*w*.5*1.035]
  return np.array([p['towerX'],p['towerY'],p['towerZ']])+rotate(np.array(local)*1.06,p['towerYaw'])
 if kind=='bridge':
  j,side=arg;x=-p['bridgeSpan']/2+p['bridgeSpan']*j/12;y=1.13+1.10*(1-(x/(p['bridgeSpan']/2))**2)+1.25
  return np.array([p['bridgeX'],p['bridgeY'],p['bridgeZ']])+rotate([x,y,side*p['bridgeDepth']/2],p['bridgeYaw'])
 raise ValueError(kind)
def project(p,world):
 pos=np.array([p['cameraX'],p['cameraY'],p['cameraZ']]);yaw,pitch=p['viewYaw'],p['viewPitch'];forward=np.array([math.sin(yaw)*math.cos(pitch),math.sin(pitch),-math.cos(yaw)*math.cos(pitch)]);right=np.cross(forward,[0,1,0]);right/=np.linalg.norm(right);up=np.cross(right,forward);v=world-pos;depth=v@forward;F=1/math.tan(math.radians(p['fov'])/2)
 return np.stack([.5+.5*F*(v@right)/depth,.5-.5*F*(v@up)/depth],axis=-1)*1254
OBS=np.array([v[3]for v in LANDMARKS]);SIGMA=np.array([v[4]for v in LANDMARKS]);
def state(v):return dict(zip(KEYS,v.tolist()))
def evaluate(v):
 p=state(v);world=np.array([anchor(p,item)for item in LANDMARKS]);pixels=project(p,world);return p,world,pixels,pixels-OBS
def summary(v):
 p,w,px,err=evaluate(v);pos=[p['cameraX'],p['cameraY'],p['cameraZ']];f=np.array([math.sin(p['viewYaw'])*math.cos(p['viewPitch']),math.sin(p['viewPitch']),-math.cos(p['viewYaw'])*math.cos(p['viewPitch'])]);target=(np.array(pos)+f*22).tolist()
 return {'parameters':p,'camera':{'position':pos,'target':target,'fov':p['fov']},'rmsPixels':float(np.sqrt(np.mean(np.sum(err*err,axis=1)))),'landmarks':[{'name':l[0],'fieldInterpretation':l[1],'argument':l[2],'observed':l[3],'uncertaintyPixels':l[4],'world':world.tolist(),'projected':pixel.tolist(),'error':e.tolist(),'distance':float(np.linalg.norm(e))}for l,world,pixel,e in zip(LANDMARKS,w,px,err)]}
result={'reference':'references/hd/2-照片-3.jpg','scope':'Manually observed oblique architectural correspondences, inferred names/metric dimensions, bounded common low camera. RMS is not a photo-match score.','photographicAccepted':False,'baseline':summary(DEFAULT)}
for name,free_names in [('camera_only',KEYS[:6]),('coupled',KEYS)]:
 free=[KEYS.index(k)for k in free_names]
 def unpack(v):q=DEFAULT.copy();q[free]=v;return q
 def residual(v):
  q=unpack(v);p,_,_,err=evaluate(q);prior=(q-DEFAULT)/PRIOR*.65
  # Keep a real receiving gap, positive tier-body intervals and a finite
  # closed finial. Runtime members must still meet after the candidate fit.
  physical=np.array([max(0,p['capitalY']+.45-p['lowerEave'])*8,max(0,p['lowerEave']+2.5-p['upperEave'])*5,max(0,6.9+4*p['towerPitch']+1.70-p['towerFinial'])*6])
  return np.r_[(err/SIGMA[:,None]).ravel(),prior,physical]
 starts=[DEFAULT.copy()]
 if name=='coupled':
  q=DEFAULT.copy();q[KEYS.index('towerY')]=2.0;q[KEYS.index('towerPitch')]=2.4;q[KEYS.index('towerFinial')]=24.0;starts.append(q)
 best=None
 for start in starts:
  fit=least_squares(residual,start[free],bounds=(LO[free],HI[free]),loss='soft_l1',f_scale=1.6,max_nfev=1400,diff_step=1e-5)
  if best is None or np.linalg.norm(fit.fun)<np.linalg.norm(best.fun):best=fit
 q=unpack(best.x);result[name]=summary(q);result[name]['success']=bool(best.success)
(OUT/'coupled-landmark-candidates.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:{'rmsPixels':v['rmsPixels'],'camera':v['camera'],'parameters':v['parameters']}for k,v in result.items()if isinstance(v,dict)},indent=2))
