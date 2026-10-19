"""Measured silhouette planning, not image reconstruction or fidelity scoring."""
from pathlib import Path
import json,math
import numpy as np
from scipy.optimize import least_squares
root=Path(__file__).resolve().parents[1]
base=json.loads((root/'qa/ten-reference/09/layout123/baseline-hall-projection.json').read_text())
# Hand annotations of visible outlines; the right ridge is partly occluded by
# the foreground lantern. Correspondence uncertainty is not a zero-pixel goal.
observations={
'ridgeLeft':([711,309],8),'ridgeRight':([977,246],20),
'upperFrontLeft':([497,451],6),'upperFrontRight':([956,334],14),
'upperRearRight':([1176,397],8),'lowerFrontLeft':([505,545],6),
'lowerFrontRight':([978,467],8),'porchFrontLeft':([566,700],12),
'porchFrontRight':([1014,656],14)}
eye=np.array([6,2.7,33.]);f=np.array([0,5.5,-10.])-eye;f/=np.linalg.norm(f);r=np.cross(f,[0,1,0]);r/=np.linalg.norm(r);up=np.cross(r,f);focal=627/math.tan(math.radians(52)/2)
def project(world):
 d=world-eye;z=d@f;return np.array([627+focal*(d@r)/z,627-focal*(d@up)/z])
def prediction(name,p):
 tx,ty,tz,yaw,sx,sy,sz,leftRidge=p;q=np.array(base['points'][name]['local'],float)
 if name=='ridgeLeft':q[0]=-leftRidge
 q*=np.array([sx,sy,sz]);c,s=math.cos(yaw),math.sin(yaw);world=np.array([c*q[0]+s*q[2],q[1],-s*q[0]+c*q[2]])+np.array([tx,ty,tz]);return project(world)
start=np.array([7.7,0,-14,-.64,1,1.17,1,2.45])
def residual(p):
 e=[]
 for n,(target,sigma) in observations.items():e.extend((prediction(n,p)-target)/sigma)
 # Keep meaningful dimensions near their authored scale; hidden3D depth is
 # underdetermined by a single photograph, not independently measured.
 e.extend([(p[4]-1)*2,(p[6]-1)*2,p[1]*.2]);return e
fit=least_squares(residual,start,bounds=([0,-2,-30,-1.25,.55,.75,.5,2],[18,4,-3,-.25,1.25,1.65,1.8,9]),max_nfev=1500)
rows=[]
for n,(target,sigma) in observations.items():
 old=prediction(n,start);new=prediction(n,fit.x);rows.append({'name':n,'observed':target,'annotationSigmaPixels':sigma,'before':old.tolist(),'after':new.tolist(),'beforeError':float(np.linalg.norm(old-target)),'afterError':float(np.linalg.norm(new-target))})
record={'status':'planning-only, no model change or new render yet','camera':base['camera'],'parameterOrder':['x','y','z','yaw','scaleX','scaleY','scaleZ','leftRidgeHalfMetres'],'beforeParameters':start.tolist(),'candidateParameters':fit.x.tolist(),'landmarks':rows,'warning':'Sparse manual silhouette constraints; stair and bridge topology require independent reconstruction; not a likeness score.'}
(root/'qa/ten-reference/09/layout123/hall-fit-planning.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(record,indent=2))
