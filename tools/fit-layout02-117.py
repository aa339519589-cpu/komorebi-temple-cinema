"""Fixed-camera, photo-landmark layout recovery for scene 02.

This measures the supplied 1254px reference, not a photo texture or a depth plane.
Run with numpy/scipy/Pillow available. Retained camera is the real motion endpoint.
The original reference contains imperfect perspective; residuals remain explicit.
"""
from pathlib import Path
import json
import numpy as np
from scipy.optimize import least_squares

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa/ten-reference/02/iteration-layout117-measurement'
OUT.mkdir(parents=True,exist_ok=True)
W=1254
C=np.array([16.2,2.72,25.]);TARGET=np.array([-1.,4.7,-7.])
Z=TARGET-C;Z/=np.linalg.norm(Z);X=np.cross(Z,[0,1.,0]);X/=np.linalg.norm(X);Y=np.cross(X,Z)
f=(W/2)/np.tan(np.deg2rad(52)/2)
def proj(v):
 p=np.atleast_2d(v)-C
 return np.stack([W/2+f*(p@X)/(p@Z),W/2-f*(p@Y)/(p@Z)],axis=-1)
def trans(pts,p):
 x,y,z,sx,sy,sz,yaw=p;c,s=np.cos(yaw),np.sin(yaw)
 R=np.array([[c,0,s],[0,1,0],[-s,0,c]])
 return np.asarray(pts)*[sx,sy,sz]@R.T+[x,y,z]
def ray_at_y(pixel,y):
 direction=Z+(pixel[0]-W/2)/f*X-(pixel[1]-W/2)/f*Y
 return C+direction*((y-C[1])/direction[1])

# Coordinates below are hand-read on the untouched 1254px photograph.
# Approximate uncertainty is +/- 3px at clear outer contours and 5px at foliage.
towerTargets=np.array([[414,77],[390,224],[299,270],[521,264],[389,499],[267,529],[549,529]],float)
def tower_points(p):
 x,y,z,s,sy,yaw,pitch=p
 pts=[[0,.8+4*pitch+2.10+1.4+.4+5.41,0]] # exact finial extension from roof seat
 for level,corners in [(4,[(1,1),(-1,1),(1,-1)]),(0,[(1,1),(-1,1),(1,-1)])]:
  w=9.4-level*.45;eave=.8+level*pitch+2.10
  pts += [[xx*w/2,eave+.52,zz*w/2] for xx,zz in corners]
 return trans(pts,[x,y,z,s,sy,s,yaw])
towerBefore=np.array([-15.6,5.1,-16,.9,1.1,.075,2.65])
def tower_res(p):
 return np.r_[(proj(tower_points(p))-towerTargets).ravel(),(p-towerBefore)*[.3,.3,.3,3,3,0,3]]
tower=least_squares(tower_res,[-15.6,5.8,-16,.84,1.1,-.60,2.48],bounds=([-22,3,-24,.65,.85,-.9,2.1],[-10,8,-8,1.1,1.3,.4,2.8])).x

hallTargets=np.array([[723,196],[606,397],[873,330],[499,418],[879,337],[1128,427],[643,632],[880,610],[643,487],[880,445]],float)
def hall_points(p):
 x,y,z,sx,sy,sz,yaw,roofW,roofF,roofB,gableW,gableF,gableEave,gableTip=p[:14]
 gableX=p[14] if len(p)>14 else 0
 pts=[[gableX,gableTip,gableF+.38],[gableX-gableW/2,gableEave,gableF],[gableX+gableW/2,gableEave,gableF],[-roofW/2,9.7,roofF],[roofW/2,9.7,roofF],[roofW/2,9.7,roofB],[-7.8,2.2,4.7],[7.8,2.2,4.7],[-7.8,7.45,4.7],[7.8,7.45,4.7]]
 return trans(pts,p[:7])
hallBefore=np.array([3.5,2.73,-10,.5,.76,1,0,22.8,7.2,-8.8,10.8,5.5,11.18,16.25])
def hall_res(p):
 # Roof overhang and gable are measured separately from the column grid.
 # Keep metre scales weakly regularised; positions are determined by pixels.
 return np.r_[(proj(hall_points(p))-hallTargets).ravel(),(p-hallBefore)*[.2,.2,.2,5,5,5,1,.25,.25,.25,.25,.25,1,1]]
hall=least_squares(hall_res,hallBefore,bounds=([-3,1,-20,.3,.5,.5,-.6,18,5,-14,8,4,9,15],[9,6,-4,.9,1.1,1.5,.6,30,13,-5,20,11,13,19]),max_nfev=3000).x

# The native candidate exposed the old hip in front of the fitted gable.
# Refit that solid gable at the actual front roof plane, with its centre free.
# Its feet must sit above the lower hip; a small contour residual is honest.
hallBody=hall.copy()
def front_gable_points(q):
 cx,gf,gw,ge,gt=q
 return trans([[cx,gt,gf+.38],[cx-gw/2,ge,gf],[cx+gw/2,ge,gf]],hallBody[:7])
def front_gable_res(q):
 return np.r_[(proj(front_gable_points(q))-hallTargets[:3]).ravel(),(q[1]-(hallBody[8]-.85))*12]
gable=least_squares(front_gable_res,[1.5,hall[8]-.85,hall[10]*.93,hall[12],hall[13]],bounds=([-2,hall[8]-1.6,12,9.5,15],[5,hall[8]-.3,21,12,19])).x
hall[10:14]=[gable[2],gable[1],gable[3],gable[4]]
hall=np.r_[hall,gable[0]]
hallBefore=np.r_[hallBefore,0.]

# Deck arch and handrails are physical curves. Three visible near-side landmarks.
bridgeTargets=np.array([[128,711],[669,674],[430,646]],float)
def bridge_points(p,capH=1.05,railH=.65):
 x,y,z,sx,sz,yaw,rise,slope=p
 pose=[x,y,z,sx,1,sz,yaw]
 samples=np.array([-1.,0.,1.]);local=np.c_[samples,1.2+rise*(1-(samples/7.5)**2)+slope*samples/7.5+railH,np.full(3,1.5)]
 world=trans(local,pose)-C;n=np.polyfit(samples,world@Y,2);d=np.polyfit(samples,world@Z,2)
 roots=np.roots([n[0]*d[1]-n[1]*d[0],2*(n[0]*d[2]-n[2]*d[0]),n[1]*d[2]-n[2]*d[1]])
 options=[float(v.real) for v in roots if abs(v.imag)<1e-6 and -7.5<v.real<7.5]
 options += [-7.5,7.5]
 apex=min(options,key=lambda xx:proj(trans([[xx,1.2+rise*(1-(xx/7.5)**2)+slope*xx/7.5+railH,1.5]],pose))[0,1])
 return trans([[-7.5,1.2+capH-slope,1.5],[7.5,1.2+capH+slope,1.5],[apex,1.2+rise*(1-(apex/7.5)**2)+slope*apex/7.5+railH,1.5]],pose)
bridgeBefore=np.array([1,0,5,.8,1,0,1.25,0])
def bridge_res(p):
 return np.r_[(proj(bridge_points(p))-bridgeTargets).ravel(),(p-bridgeBefore)*[1,1,1,4,3,4,2,2]]
bridge=least_squares(bridge_res,bridgeBefore,bounds=([-3,-.2,1,.5,.5,-.5,.5,-.8],[5,1.5,8,1.1,1.2,.5,2,.8]),max_nfev=3000).x

# A coherent gently curved plan follows the three visible structural post axes.
# The photograph's cap/foot ratios do not admit a perfect straight uniform rail.
railTargets=np.array([[550,855],[887,767],[1147,744]],float)
railBeamTargets=np.array([[550,1020],[887,870],[1147,804]],float)
railPosts=[]
for cap,beam in zip(railTargets,railBeamTargets):
 dc=Z+(cap[0]-W/2)/f*X-(cap[1]-W/2)/f*Y
 db=Z+(beam[0]-W/2)/f*X-(beam[1]-W/2)/f*Y
 distances=np.linalg.lstsq(np.array([dc,-db]).T,[0,.24,0],rcond=None)[0]
 railPosts.append((C+distances[0]*dc).tolist())
railBefore=proj(np.array([[14.6,.27+.8*2.55,z] for z in [22.4,18.8,15.2]]))

report={'reference':'references/hd/1-照片-2.jpg','nativePixels':[W,W],
 'camera':{'position':C.tolist(),'target':TARGET.tolist(),'fov':52,'status':'unchanged'},
 'measurementMethod':'Hand-read visible native photograph contours; metric dimensions fit by pinhole reprojection at fixed reference camera, with weak metric priors. No photographic pixels are consumed by scene geometry or materials.',
 'uncertaintyPixels':{'clearContours':3,'partlyOccluded':5},
 'visualAccepted':False,'limitations':['Original reference perspective is imperfect. Fixed-camera fit retains nonzero contour residuals.','Broad proportions and rail joinery pass only; foliage, lighting, roof finish and many architectural details remain materially different.'],
 'fits':{}}
for name,p,b,fn,tg in [('pagoda',tower,towerBefore,tower_points,towerTargets),('hall',hall,hallBefore,hall_points,hallTargets),('bridge',bridge,bridgeBefore,bridge_points,bridgeTargets)]:
 before=proj(bridge_points(b,1.35,.85) if name=='bridge' else fn(b));after=proj(fn(p));report['fits'][name]={'parameters':p.tolist(),'beforeParameters':b.tolist(),'targets':tg.tolist(),'beforeProjection':before.tolist(),'fitProjection':after.tolist(),'beforeRmsPixels':float(np.sqrt(np.mean(np.sum((before-tg)**2,axis=1)))),'fitRmsPixels':float(np.sqrt(np.mean(np.sum((after-tg)**2,axis=1))))}
report['fits']['rail']={'capToTopRailMetres':.24,'postHeightMetres':1.12,'postAxes':railPosts,'topRailTargets':railBeamTargets.tolist(),'deckHeights':[p[1]-1.12 for p in railPosts],'targets':railTargets.tolist(),'beforeProjection':railBefore.tolist(),'fitProjection':proj(np.array(railPosts)).tolist(),'beforeRmsPixels':float(np.sqrt(np.mean(np.sum((railBefore-railTargets)**2,axis=1)))),'fitRmsPixels':float(np.sqrt(np.mean(np.sum((proj(np.array(railPosts))-railTargets)**2,axis=1)))),'note':'Equal 1.12m post height and equal .24m cap-to-handrail distance recover the actual spatial rail from cap and beam landmarks. A smooth deck edge varies only 69mm in elevation; continuous beams and two inset panels per structural bay share this same path.'}
# Fifteen auditable landmarks; extra fit constraints stay in fits above.
selection=[('P1','pagoda',0,'finial tip'),('P2','pagoda',1,'upper roof near corner'),('P3','pagoda',5,'lowest roof left tip'),('P4','pagoda',6,'lowest roof right tip'),('H1','hall',0,'gable tip'),('H2','hall',3,'front eave left tip'),('H3','hall',4,'front eave right corner'),('H4','hall',6,'left front column foot'),('H5','hall',7,'right front column foot'),('B1','bridge',0,'near left finial tip'),('B2','bridge',1,'near right finial tip'),('B3','bridge',2,'near handrail crest'),('R1','rail',0,'nearest post finial tip'),('R2','rail',1,'middle post finial tip'),('R3','rail',2,'far post finial tip')]
report['landmarks']=[]
for ident,group,i,description in selection:
 fit=report['fits'][group];ref=np.array(fit['targets'][i]);before=np.array(fit['beforeProjection'][i]);after=np.array(fit['fitProjection'][i])
 report['landmarks'].append({'id':ident,'group':group,'description':description,'referencePixel':ref.tolist(),'beforeProjection':before.tolist(),'fitProjection':after.tolist(),'beforeErrorPixels':float(np.linalg.norm(before-ref)),'fitErrorPixels':float(np.linalg.norm(after-ref))})
(OUT/'fixed-camera-fit.json').write_text(json.dumps(report,indent=2)+'\n')
for name,value in report['fits'].items():
 print(name,json.dumps({k:v for k,v in value.items() if k in ['parameters','capY','postAxes','beforeRmsPixels','fitRmsPixels']}))
