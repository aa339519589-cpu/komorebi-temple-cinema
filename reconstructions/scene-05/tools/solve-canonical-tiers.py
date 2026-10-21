import importlib.util,json,math
import numpy as np
from scipy.optimize import least_squares
spec=importlib.util.spec_from_file_location('fit',str(__import__('pathlib').Path(__file__).with_name('solve-perspective.py')));f=importlib.util.module_from_spec(spec);spec.loader.exec_module(f)
DEFAULT=np.array([10.8,13.7,f.DEFAULT[2],f.DEFAULT[3],35.5,4.75,.90,3.5,2.35,3.55,1.12])
lo=np.array([5.2,6.2,-1.25,.35,18,4.1,.72,2.6,1.8,3.2,.9]);hi=np.array([24,26,-.2,1.2,78,5.7,.98,6.8,3.5,4.9,1.8])
def anchor(p,l,k):
 P,q,add,rise,H,B=p[5:];s=q**l;y=.35+P*sum(q**i for i in range(l));R=(8.8+add)/2
 if k.startswith('hip_'):return np.array([(-1 if k.endswith('left')else 1)*(R+.094)*s,y+(H+.799)*s,(R+.094)*s])
 if k.startswith('lantern_'):return np.array([(-1 if k.endswith('left')else 1)*R*1.025*s,y+2.6*s,R*1.025*s])
 if k.startswith('post_head'):return np.array([(-4.4*s if k.endswith('left') else 8.8*s/6 if k.endswith('midright') else 4.4*s),y+s*(H+f.bearing(2*R,8.8,rise,1)-.13-.97*B),4.4*s])
 if k=='tail_cut':return np.array([(4.4+add/2*(1.72/1.75))*s,y+2.25*s,(4.4+add/2*(1.72/1.75))*s])
def points(p):return np.array([anchor(p,l[1],l[2])for l in f.LANDMARKS])
def errors(p):return f.project(p,points(p))-f.OBS
def fun(p):
 e=(errors(p)/f.SIG[:,None]).ravel();prior=(p[5:]-DEFAULT[5:])/np.array([.9,.12,2.0,1.0,.8,.5]);bearing=f.bearing(8.8+p[7],8.8,p[8],1);physical=[max(0,p[5]-(p[9]+p[8]-.15))*20,max(0,p[5]-(p[9]+bearing+1.35))*12]
 return np.r_[e,prior,physical]
best=None
for start in [DEFAULT,np.array([8,10,-.8,.8,52,4.75,.86,4.8,2.35,4.1,1.4]),np.array([13,14,-.85,.68,35,5.2,.8,4.5,2.2,4.1,1.5])]:
 r=least_squares(fun,start,bounds=(lo,hi),loss='soft_l1',f_scale=2,diff_step=1e-4,max_nfev=1500)
 if best is None or np.linalg.norm(r.fun)<np.linalg.norm(best.fun):best=r
p=best.x;world=points(p);pred=f.project(p,world);err=pred-f.OBS
result={'parameterOrder':['cameraX','cameraZ','yawRad','pitchRad','verticalFov','canonicalTierPitch','tierScaleRatio','roofWidthAddition','canonicalRoofRise','canonicalRoofHeight','bearingVerticalScale'],'parameters':p.tolist(),'pose':f.pose(p),'architecture':dict(zip(['tierPitch','tierScaleRatio','roofWidthAddition','roofRise','roofHeight','bearingVerticalScale'],p[5:].tolist())),'rmsPixels':float(np.sqrt(np.mean(np.sum(err*err,axis=1)))),'physicalFloorBelowApex':bool(p[5]<p[9]+p[8]),'landmarks':[{'name':n,'level':l,'anchor':k,'observedPixels':obs,'uncertaintyPixels':sigma,'world':w.tolist(),'projectedPixels':pp.tolist(),'errorPixels':ee.tolist(),'distancePixels':float(np.linalg.norm(ee))}for(n,l,k,obs,sigma),w,pp,ee in zip(f.LANDMARKS,world,pred,err)]}
(f.OUT/'canonical-tier-fit-v03.json').write_text(json.dumps(result,indent=2)+'\n');print('CANONICAL RESULT');print(json.dumps({k:v for k,v in result.items()if k!='landmarks'},indent=2));print([(a['name'],[round(x,1)for x in a['errorPixels']])for a in result['landmarks']])
