"""Bounded photo-landmark fit; no source pixels enter the actual scene."""
from pathlib import Path
import json,math
import numpy as np
from scipy.optimize import least_squares
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'qa/ten-reference/05/perspective-fit-solmax-20261021'
OUT.mkdir(parents=True,exist_ok=True)
SIZE=1254
# Explicit manually observed feature centres. Masks/unseen contact joints have
# wider uncertainty than the isolated lanterns. These are not surveyed metrics.
LANDMARKS=[
 ('lower_near_hip',0,'hip_near',[916,1074],16),
 ('main_near_hip',1,'hip_near',[920,342],10),
 ('main_far_left_hip',1,'hip_left',[34,977],15),
 ('upper_far_left_hip',2,'hip_left',[251,552],10),
 ('high_far_left_hip',3,'hip_left',[338,286],15),
 ('main_near_lantern',1,'lantern_near',[930,598],9),
 ('upper_near_lantern',2,'lantern_near',[808,141],10),
 ('upper_far_left_lantern',2,'lantern_left',[260,643],10),
 ('high_far_left_lantern',3,'lantern_left',[350,333],12),
 ('main_near_post_head',1,'post_head',[896,850],12),
 ('upper_near_post_head',2,'post_head',[806,382],17),
 ('main_far_left_post_head',1,'post_head_left',[342,1102],18),
 ('main_right_inner_post_head',1,'post_head_midright',[725,951],18),
 ('main_near_hip_tail_cut',1,'tail_cut',[906,722],12),
 ('upper_near_hip_tail_cut',2,'tail_cut',[811,233],12),
]
# Camera XYZ(Y fixed .8m), viewing yaw/pitch, vertical FOV; then global tier
# pitch/taper, full roof-width addition, and roof rise. Wall base remains8.8m.
forward=np.array([-12.5,14.2,-13.7]);forward/=np.linalg.norm(forward)
DEFAULT=np.array([10.8,13.7,math.atan2(forward[0],-forward[2]),math.asin(forward[1]),35.5,4.75,.075,3.5,2.35])
BOUNDS=([5.2,6.2,-1.25,.35,20,4.1,.035,2.6,1.8],[24,26,-.2,1.20,78,5.7,.18,6.8,3.5])
def sample(t,u,radius,rise):
 yy=rise*np.maximum(0,1-t)**1.43+.48*t**9*(.25+np.abs(u)**7)
 return np.stack([u*radius*t,yy,np.ones_like(t)*radius*t],axis=-1)
def bearing(roof_width,wall_width,rise,scale):
 # Exact analytical rafter normal, paired with the native .196m perpendicular
 # underside offset and .232m vertical deck/rafter offset.
 n=max(4,round(roof_width/.29));u=np.linspace(-1,1,n+1)[1:-1];lo=np.full_like(u,.34);hi=np.full_like(u,.98);R=roof_width/2
 def underside(t):
  dy=-1.43*rise*np.maximum(0,1-t)**.43+9*.48*t**8*(.25+np.abs(u)**7)
  horizontal=R*np.sqrt(1+u*u);length=np.sqrt(horizontal*horizontal+dy*dy)
  upy=horizontal/length;upz=-dy*R/(horizontal*length)
  yy=rise*np.maximum(0,1-t)**1.43+.48*t**9*(.25+np.abs(u)**7)
  return yy-.232-.196*upy,R*t-.196*upz
 for _ in range(32):
  t=(lo+hi)/2;_,z=underside(t);keep=z<wall_width/2+.145*scale;lo=np.where(keep,t,lo);hi=np.where(keep,hi,t)
 return np.min(underside((lo+hi)/2)[0])
def anchor(params,level,kind):
 _,_,_,_,_,pitch,taper,roof_add,roof_rise=params
 s=1-level*taper;w=8.8*s;y=.35+level*pitch;R=(8.8+roof_add)*s/2;roofY=y+3.55
 if kind.startswith('hip_'):
  sign=-1 if kind.endswith('left') else 1
  return np.array([sign*(R+.094),roofY+.799,R+.094])
 if kind.startswith('lantern_'):
  sign=-1 if kind.endswith('left') else 1
  return np.array([sign*R*1.025,y+2.60,R*1.025])
 if kind.startswith('post_head'):
  b=bearing(2*R,w,roof_rise*s,s);shaft=roofY+b-(.13+.970*1.12)*s
  return np.array([(-w/2 if kind.endswith('left') else w/6 if kind.endswith('midright') else w/2),shaft,w/2])
 if kind=='tail_cut':
  rr=w/2+roof_add/2*(1.72/1.75)*s
  return np.array([rr,y+2.25,rr])
 raise ValueError(kind)
def project(params,points):
 x,z,yaw,pitch,fov=params[:5];pos=np.array([x,.8,z]);f=np.array([math.sin(yaw)*math.cos(pitch),math.sin(pitch),-math.cos(yaw)*math.cos(pitch)]);r=np.cross(f,[0,1,0]);r/=np.linalg.norm(r);up=np.cross(r,f);v=points-pos;depth=v@f;F=1/math.tan(math.radians(fov)/2)
 return np.stack([.5+.5*F*(v@r)/depth,.5-.5*F*(v@up)/depth],axis=-1)*SIZE
OBS=np.array([l[3] for l in LANDMARKS]);SIG=np.array([l[4] for l in LANDMARKS])
def points(params):return np.array([anchor(params,l[1],l[2]) for l in LANDMARKS])
def errors(params):return project(params,points(params))-OBS
def pose(params):
 x,z,yaw,pitch,fov=params[:5];f=np.array([math.sin(yaw)*math.cos(pitch),math.sin(pitch),-math.cos(yaw)*math.cos(pitch)]);pos=np.array([x,.8,z]);target=pos+f*((15-.8)/math.sin(pitch));return {'position':pos.tolist(),'target':target.tolist(),'fov':float(fov)}
def summarize(params):
 world=points(params);pred=project(params,world);err=pred-OBS
 return {'parameters':params.tolist(),'pose':pose(params),'architecture':dict(zip(['tierPitch','tierTaper','roofWidthAddition','roofRise'],params[5:].tolist())),'rmsPixels':float(np.sqrt(np.mean(np.sum(err*err,axis=1)))),'landmarks':[{'name':name,'level':level,'anchor':kind,'observedPixels':obs,'uncertaintyPixels':sigma,'world':w.tolist(),'projectedPixels':p.tolist(),'errorPixels':e.tolist(),'distancePixels':float(np.linalg.norm(e))}for(name,level,kind,obs,sigma),w,p,e in zip(LANDMARKS,world,pred,err)]}
results={'scope':'A bounded common-camera/common-tier reconstruction hypothesis, not photographic acceptance.','reference':'references/hd/5-照片-6.jpg','referenceSize':[1254,1254],'cameraHeightMetres':.8,'parameterOrder':['cameraX','cameraZ','yawRad','pitchRad','verticalFov','tierPitch','tierTaper','roofWidthAddition','roofRise'],'baseline':summarize(DEFAULT)}
for name,free in [('camera_only',list(range(5))),('camera_overhang',list(range(5))+[7]),('coupled_tiers',list(range(9)))]:
 def unpack(v):p=DEFAULT.copy();p[free]=v;return p
 def residual(v):
  p=unpack(v);r=(errors(p)/SIG[:,None]).ravel()
  if len(free)>5:
   prior=(p[5:]-DEFAULT[5:])/np.array([.65,.025,1.6,.8]);r=np.r_[r,prior]
  return r
 best=None
 for start in [DEFAULT[free],np.array([8.0,10.8,-.76,.80,51,4.75,.075,4.8,2.35])[free],np.array([7.2,10.0,-.86,.92,63,4.6,.08,5.5,2.4])[free]]:
  fit=least_squares(residual,start,bounds=(np.array(BOUNDS[0])[free],np.array(BOUNDS[1])[free]),loss='soft_l1',f_scale=2.0,max_nfev=1200,diff_step=1e-4)
  if best is None or np.linalg.norm(fit.fun)<np.linalg.norm(best.fun):best=fit
 p=unpack(best.x);results[name]=summarize(p);results[name].update(success=bool(best.success),residualNorm=float(np.linalg.norm(best.fun)))
print(json.dumps({k:{'rms':v.get('rmsPixels'),'pose':v.get('pose'),'architecture':v.get('architecture')} for k,v in results.items()if isinstance(v,dict)},indent=2))
(OUT/'landmark-fit-candidates-v02.json').write_text(json.dumps(results,indent=2)+'\n')
