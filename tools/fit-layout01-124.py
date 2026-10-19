"""Canonical HD01 contour recovery at the fixed low reference camera.
Only selected visible contours constrain pose; source uncertainty is explicit.
Requires numpy/scipy; no reference pixels enter scene geometry or materials.
"""
from pathlib import Path
import numpy as np,json
from scipy.optimize import least_squares
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa/ten-reference/01/iteration-layout124-measurement';OUT.mkdir(exist_ok=True)
C=np.array([0.,3.2,17.]);target=np.array([0.,6.2,-13.]);Z=target-C;Z/=np.linalg.norm(Z);X=np.cross(Z,[0,1.,0]);X/=np.linalg.norm(X);Y=np.cross(X,Z);f=627/np.tan(np.deg2rad(59)/2)
def project(v):
 p=np.atleast_2d(v)-C;return np.stack([627+f*(p@X)/(p@Z),627-f*(p@Y)/(p@Z)],axis=-1)
def transform(v,p):
 x,y,z,sx,sy,sz,yaw=p;c,s=np.cos(yaw),np.sin(yaw);return np.asarray(v)*[sx,sy,sz]@np.array([[c,0,-s],[0,1,0],[s,0,c]])+[x,y,z]
def ray(px,y):
 d=Z+(px[0]-627)/f*X-(px[1]-627)/f*Y;return C+d*((y-C[1])/d[1])
# Finial and 3 near/outer corners at the first and fifth roof.
pt=np.array([[413,78],[377,220],[276,268],[537,269],[367,555],[267,577],[548,592]],float)
def tower_points(q):
 x,y,z,yaw,pitch,wb,wt,fh=q;pts=[[0,5.6+4*pitch+1.25+fh,0]]
 for i,corners in [(4,[(1,1),(-1,1),(1,-1)]),(0,[(1,1),(-1,1),(1,-1)])]:
  w=wb+(wt-wb)*i/4;e=5.6+i*pitch
  pts.extend([[xx*w/2,e+.44,zz*w/2] for xx,zz in corners])
 return transform(pts,[x,y,z,.9,1.035,.9,yaw])
tower_old=np.array([-6.65,1.25,-17,-.58,2.70,7.50,6.15,4.90])
def tres(q):return np.r_[(project(tower_points(q))-pt).ravel(),(q-tower_old)*[.4,.5,.4,2,3,2,2,2]]
tower=least_squares(tres,[-6.7,2,-17,-.85,2.4,6.9,6.5,5.6],bounds=([-9,-1,-23,-1.2,2.0,5.8,5.8,4.2],[-4,4,-11,-.3,3.0,8.2,7.5,6.5])).x
# Actual bridge girder contour at the near left end, near crest and right end.
# The left end is partly under planting, hence deliberately lower weight.
bt=np.array([[132,766],[355,747],[626,796]],float)
def bridge_points(q):
 x,y,z,sx,sz,yaw,rise,slope=q;half=3.85;pose=[x,y,z,sx,1,sz,yaw];xx=np.array([-1.,0.,1.])
 def point(t):return transform([[t,2.35+rise*(1-(t/half)**2)+slope*t/half-.64,1.05]],pose)[0]
 samples=transform(np.c_[xx,2.35+rise*(1-(xx/half)**2)+slope*xx/half-.64,np.full(3,1.05)],pose)-C
 n=np.polyfit(xx,samples@Y,2);d=np.polyfit(xx,samples@Z,2);roots=np.roots([n[0]*d[1]-n[1]*d[0],2*(n[0]*d[2]-n[2]*d[0]),n[1]*d[2]-n[2]*d[1]])
 options=[float(t.real) for t in roots if abs(t.imag)<1e-6 and -half<t.real<half]+[-half,half]
 peak=min(options,key=lambda t:project([point(t)])[0,1])
 return np.array([point(-half),point(peak),point(half)])
bold=np.array([-3.35,0,.10,1,1,0,1.10,-.35])
def bres(q):return np.r_[(project(bridge_points(q))-bt).ravel(),(q-bold)*[1.5,1.5,1.5,15,8,200,10,7]]
bridge=least_squares(bres,bold,bounds=([-5,-.4,-4,.75,.85,-.01,.45,-.60],[-1,1.3,2,1.15,1.35,.01,1.5,.4])).x
# Common post bearing/handrail height, coupled by one physical rail, not
# independently placing each gold cap as if the image were a depth surface.
railY=2.62;railL=ray([85,938],railY);railN=ray([550,1130],railY)
tangent=ray([80,938],railY);normal=np.array([17-tangent[2],0,tangent[0]]);normal/=np.linalg.norm(normal)
column=tangent-normal*.24;column[1]=0
columnDepthScale=1.18
column[[0,2]]=C[[0,2]]+(column[[0,2]]-C[[0,2]])*columnDepthScale
tangent=C+(tangent-C)*columnDepthScale
hall={'position':[9.86,2.35,-11.9],'yaw':-.67,'scale':[1,1,1],'mainRoofRise':6.2,'lowerEave':6.60,'upperEave':10.05}
# Recovered façade columns use the same floor and supporting beam grid. Wider
# portal opening is retained; the left window field gets the missing short bays.
def local_x_for_pixel(u):
 return least_squares(lambda a:project(transform([[a[0],1.35,5.15]],[*hall['position'],1,1,1,hall['yaw']]))[0,0]-u,[-5]).x[0]
axes=[local_x_for_pixel(u) for u in [575,643,700,768,848,1056,1146,1240]]
axes += [axes[-1]+(axes[-1]-axes[-2])*k for k in [1,2,3]]
top=transform([[-.75,1.325,6.10]],[*hall['position'],1,1,1,hall['yaw']])[0];bottom=ray([860,795],2.1)
layout={'camera':{'position':C.tolist(),'target':target.tolist(),'fov':59,'deckY':1.8},'pagoda':{'position':tower[:3].tolist(),'yaw':float(tower[3]),'scale':[.9,1.035,.9],'tierPitch':float(tower[4]),'bottomRoofWidth':float(tower[5]),'topRoofWidth':float(tower[6]),'finialHeight':float(tower[7])},'bridge':{'position':bridge[:3].tolist(),'scale':[float(bridge[3]),1,float(bridge[4])],'yaw':float(bridge[5]),'archRise':float(bridge[6]),'slope':float(bridge[7]),'deckBaseline':2.35,'halfSpan':3.85},'hall':{**hall,'frontAxes':axes},'foreground':{'postL':railL.tolist(),'postN':railN.tolist(),'postRadii':[.22,.095],'postHeadY':railY,'deckY':1.8,'columnPosition':column.tolist(),'columnRadius':.24*columnDepthScale,'columnTop':9.595,'ceilingY':10.3},'stair':{'top':top.tolist(),'bottom':bottom.tolist(),'width':3.50,'steps':9,'landingY':2.1,'bearingY':1.95,'topLanding':{'forwardOffset':.90,'backWidth':4.50,'pavingBackZ':5.64,'wallFrontZ':5.90}},'waterfall':{'x':2.05,'lips':[1.35,.75],'basinY':.15,'z':[-1.35,-.60]}}
report={'reference':'references/hd/0-照片-1.jpg','referencePixels':[1254,1254],'sourceHash':'988668375f41c19386115b7514ccead940e2f89a6bf5f6b8c71fa6c6df02835d','historicalCollageNotUsed':'references/01.png (265x197)', 'camera':layout['camera'],'visualAccepted':False,'uncertaintyPixels':{'clearContours':4,'partlyOccluded':8,'hiddenEnds':12},'fitMethod':'Fixed low camera; actual connected group dimensions and poses recovered from visible contours. Selected projection errors do not establish photographic fidelity.','tower':{'parameters':tower.tolist(),'targets':pt.tolist(),'beforeProjection':project(tower_points(tower_old)).tolist(),'afterProjection':project(tower_points(tower)).tolist()},'bridge':{'parameters':bridge.tolist(),'targets':bt.tolist(),'beforeProjection':project(bridge_points(bold)).tolist(),'afterProjection':project(bridge_points(bridge)).tolist()},'foreground':layout['foreground'],'hall':hall,'stair':layout['stair'],'landmarks':[]}
for i in [0,1,4,5,6]:report['landmarks'].append({'id':'P'+str(i),'group':'pagoda','reference':pt[i].tolist(),'before':report['tower']['beforeProjection'][i],'after':report['tower']['afterProjection'][i]})
for i in range(3):report['landmarks'].append({'id':'B'+str(i),'group':'bridge','reference':bt[i].tolist(),'before':report['bridge']['beforeProjection'][i],'after':report['bridge']['afterProjection'][i]})
for ident,ref,p in [('R1',[85,938],railL),('R2',[550,1130],railN),('C1',[80,938],tangent)]:report['landmarks'].append({'id':ident,'group':'foreground','reference':ref,'after':project([p])[0].tolist()})
for ident,ref,p in [('H1',[575,721],[axes[0],1.35,5.15]),('H2',[848,718],[axes[4],1.35,5.15])]:report['landmarks'].append({'id':ident,'group':'hall','reference':ref,'after':project(transform([p],[*hall['position'],1,1,1,hall['yaw']]))[0].tolist()})
for ident,ref,p in [('S1',[875,716],top),('S2',[860,795],bottom)]:report['landmarks'].append({'id':ident,'group':'stair','reference':ref,'after':project([p])[0].tolist()})
(OUT/'fixed-camera-contour-fit.json').write_text(json.dumps(report,indent=2)+'\n')
(ROOT/'reconstructions/scene-01/src/layout124.js').write_text('// Group geometry recovery from canonical HD01. See tools/fit-layout01-124.py.\n// Coordinates are physical XYZ metres; no photographic pixels or depth planes.\nexport const layout124 = '+json.dumps(layout,indent=2)+';\n')
print(json.dumps({'pagoda':layout['pagoda'],'bridge':layout['bridge'],'foreground':layout['foreground'],'hallAxes':axes,'stair':layout['stair']}))
