"""Fit whole square storeys, never independent screen-space vertices.

Manual photo coordinates are comparison evidence only. No reference pixels,
texture projection, relief sheet or image geometry enters the runtime model.
"""
from pathlib import Path
import json, math
import numpy as np
from scipy.optimize import least_squares
OUT=Path(__file__).resolve().parent
SIZE=1254
LANDMARKS=[
 ('main_waist_near_hip',1,'waist_near',[916,1074],12),
 ('main_near_hip',1,'hip_near',[920,342],8),
 ('main_far_left_hip',1,'hip_left',[34,977],12),
 ('upper_far_left_hip',2,'hip_left',[251,552],8),
 ('high_far_left_hip',3,'hip_left',[338,286],12),
 ('main_near_lantern',1,'lantern_near',[930,598],7),
 ('upper_near_lantern',2,'lantern_near',[808,141],7),
 ('upper_far_left_lantern',2,'lantern_left',[260,643],7),
 ('high_far_left_lantern',3,'lantern_left',[350,333],8),
 ('main_near_post_head',1,'post_head',[896,850],12),
 ('upper_near_post_head',2,'post_head',[806,382],14),
 ('main_far_left_post_head',1,'post_head_left',[342,1102],16),
 ('main_right_inner_post_head',1,'post_head_midright',[725,951],38),
 ('main_near_hip_tail_cut',1,'tail_cut',[906,722],10),
 ('upper_near_hip_tail_cut',2,'tail_cut',[811,233],10),
]
OBS=np.array([a[3] for a in LANDMARKS]); SIG=np.array([a[4] for a in LANDMARKS])

def bearing(roof_width,wall_width,rise):
 n=max(4,round(roof_width/.29)); u=np.linspace(-1,1,n+1)[1:-1]; lo=np.full_like(u,.34);hi=np.full_like(u,.98);R=roof_width/2
 def under(t):
  dy=-1.43*rise*np.maximum(0,1-t)**.43+9*.48*t**8*(.25+np.abs(u)**7)
  hh=R*np.sqrt(1+u*u); le=np.sqrt(hh*hh+dy*dy)
  return rise*np.maximum(0,1-t)**1.43+.48*t**9*(.25+np.abs(u)**7)-.232-.196*hh/le,R*t+.196*dy*R/(hh*le)
 for _ in range(24):
  t=(lo+hi)/2;_,z=under(t);mask=z<wall_width/2+.145;lo=np.where(mask,t,lo);hi=np.where(mask,hi,t)
 return np.min(under((lo+hi)/2)[0])

def project(p,points):
 x,z,yaw,pitch,fov=p[:5];pos=np.array([x,.8,z]);f=np.array([math.sin(yaw)*math.cos(pitch),math.sin(pitch),-math.cos(yaw)*math.cos(pitch)])
 r=np.cross(f,[0,1,0]);r/=np.linalg.norm(r);up=np.cross(r,f);v=points-pos;depth=v@f;F=1/math.tan(math.radians(fov)/2)
 return np.stack([p[17]+.5*SIZE*F*(v@r)/depth,p[18]-.5*SIZE*F*(v@up)/depth],axis=-1)

# camera5, common roof add/H/rise/bearingScale/tailY/lanternY6,
# whole story uniform scales3 and actual base heights3
INIT=np.array([14.82335137,14.62564576,-.92036215,.51956408,27.8228581,4.38973926,3.85697332,3.5,1.18,1.92,2.6,.90,.69983444,.58545251,6.05,10.81839816,14.80745407,627,627])
LOW=np.array([6,6,-1.35,.08,20,2.8,3.1,2.0,.80,1.45,2.0,.68,.48,.35,4.0,8.8,12.0,0,300])
HIGH=np.array([28,28,-.25,1.05,72,6.8,5.3,4.7,1.65,2.7,3.4,.98,.91,.82,7.9,14.2,19.5,1254,2000])

def bases(p):
 add,H,rise=p[5:8];P=H+rise*(1-8.8/(8.8+add))**1.43+.16
 return np.array([.35,p[14],p[14]+P*p[11],p[14]+P*(p[11]+p[12])])
def anchor(p,level,kind):
 add,H,rise,B,tail,lantern=p[5:11];s=1 if not level else p[10+level];base=bases(p)[level];R=(8.8+add)/2
 if kind.startswith('hip_'):q=[(-1 if kind.endswith('left') else 1)*(R+.094),H+.799,R+.094]
 elif kind.startswith('lantern_'):q=[(-1 if kind.endswith('left') else 1)*R*1.025,lantern,R*1.025]
 elif kind.startswith('waist_'):q=[4.4/p[11]+.04,.58,4.4/p[11]+.04]
 elif kind.startswith('post_head'):q=[-4.4 if kind.endswith('left') else 8.8/6 if kind.endswith('midright') else 4.4,H+bearing(8.8+add,8.8,rise)-.13-.97*B,4.4]
 else:q=[4.4+add/2*(1.72/1.75),tail,4.4+add/2*(1.72/1.75)]
 return np.array(q)*s+np.array([0,base,0])

def points(p):return np.array([anchor(p,a[1],a[2]) for a in LANDMARKS])
def residual(p):
 s=np.r_[1,p[11:14]]; b=bases(p); add,H,rise,B,tail,lantern=p[5:11]
 prior=(p[5:11]-np.array([4.8,4.2,3.7,1.02,1.92,2.6]))/np.array([2.5,1.8,1.7,.35,.6,.7])
 # All complete stories stay centred and square, shrink monotonically and
 # have physically occupied room height and roof/deck intervals.
 phys=[]
 for l in range(3):
  step=(b[l+1]-b[l])/s[l]
  phys.extend([max(0,s[l+1]-.97*s[l])*60,max(0,.65*s[l]-s[l+1])*60,max(0,step-H-rise+.08)*8,max(0,4.1-step)*3])
 return np.r_[((project(p,points(p))-OBS)/SIG[:,None]).ravel(),prior,phys,(p[11]-.90)/.03,(p[17:19]-627)/np.array([600,700])]

best=None
FREE=[i for i in range(len(INIT))if i not in [15,16]]
for start in [INIT,np.r_[INIT[:11],[.87,.68,.54],[6.5,11.3,15.3],INIT[17:]],np.r_[[10,15,-.85,.3,42],INIT[5:17],[760,1150]]]:
 def unpack(v):q=INIT.copy();q[FREE]=v;return q
 fit=least_squares(lambda v:residual(unpack(v)),np.clip(start,LOW+1e-7,HIGH-1e-7)[FREE],bounds=(LOW[FREE],HIGH[FREE]),loss='soft_l1',f_scale=2,diff_step=3e-5,max_nfev=1800)
 if best is None or np.linalg.norm(fit.fun)<np.linalg.norm(best.fun):best=fit
p=unpack(best.x);p[14:17]=bases(p)[1:];pred=project(p,points(p));err=pred-OBS
x,z,yaw,pitch,fov=p[:5];forward=np.array([math.sin(yaw)*math.cos(pitch),math.sin(pitch),-math.cos(yaw)*math.cos(pitch)]);pos=np.array([x,.8,z]);target=pos+forward*(14.2/math.sin(pitch))
result={'status':'bounded-whole-story-hypothesis-not-acceptance','parameterOrder':['cameraX','cameraZ','yaw','pitch','fov','roofAddition','roofHeight','roofRise','bearingScale','tailY','lanternY','scale1','scale2','scale3','base1','base2','base3','principalX','principalY'],'parameters':p.tolist(),'pose':{'position':pos.tolist(),'target':target.tolist(),'fov':fov,'principal':[p[17]/SIZE,p[18]/SIZE]},'rmsPixels':float(np.sqrt(np.mean(np.sum(err*err,axis=1)))),'landmarks':[{'name':a[0],'level':a[1],'kind':a[2],'observedPixels':a[3],'world':w.tolist(),'projectedPixels':pr.tolist(),'errorPixels':e.tolist()}for a,w,pr,e in zip(LANDMARKS,points(p),pred,err)]}
(OUT/'whole-storey-fit-v01.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items()if k!='landmarks'},indent=2)); print([(a['name'],[round(t,1)for t in a['errorPixels']])for a in result['landmarks']])
