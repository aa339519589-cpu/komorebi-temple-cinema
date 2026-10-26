import {T} from './kernel.js';
import {buildGableCarrying186} from './spatial186.js';

// Closed attic and one carried, deep, layered rake in retained hall metres.
// No camera/image coordinates, source-photo surface, or new material/light.
export function buildGableHierarchy368({b,mats,carved:C,roof,sculpture186=null}){
 const {gableWidth:w,gableEave:e,gableRise:r,gableFront:z,gableBack:back,gableCenterX:cx}=roof;
 const profile=t=>e+r*Math.pow(Math.max(0,1-t),1.28)+.38*Math.pow(t,8),stats={revision:'scene02-fine-carved-pediment-and-real-bearing368-r04',closedLoft:true,rakeDepth:.84,piercedRakeCells:0,carriedPendents:0,coffers:0,referencePixelsSampled:false};
 const sweep=(p,width,depth,name,ma)=>b.put(C.sweep(p,width,depth,name),ma);
 function band(sign){
  const s=new T.Shape(),N=96;s.moveTo(0,profile(0)-.18);
  for(let j=1;j<=N;j++){const t=j/N;s.lineTo(sign*w*.5*t,profile(t)-.18);}
  for(let j=N;j>=0;j--){const t=j/N;s.lineTo(sign*w*.5*t,profile(t)-.73);}s.closePath();
  for(let j=0;j<16;j++){
   const t=.045+j*.059,x=sign*w*.5*t,y=profile(t)-.455,dx=sign*w*.5,dy=(profile(t+.001)-profile(t-.001))/.002,L=Math.hypot(dx,dy),a=new T.Vector2(dx/L,dy/L),n=new T.Vector2(-a.y,a.x),p=[];
   for(let k=0;k<28;k++){const angle=k/28*Math.PI*2;p.push(new T.Vector2(x+a.x*Math.cos(angle)*.125+n.x*Math.sin(angle)*.083,y+a.y*Math.cos(angle)*.125+n.y*Math.sin(angle)*.083));}
   if(T.ShapeUtils.isClockWise(p)===T.ShapeUtils.isClockWise(s.getPoints(128)))p.reverse();const hole=new T.Path(p);hole.closePath();s.holes.push(hole);stats.piercedRakeCells++;
  }
  const g=new T.ExtrudeGeometry(s,{depth:.075,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:2,steps:1,curveSegments:8});g.translate(0,0,z+.59);g.name='scene02-368-closed-pierced-rake-facing-'+sign;g.userData={authoredClosedSolid:true,photographicSurface:false};return g;
 }
 b.at([cx,0,0],0,()=>{
  for(const [plane,ma]of[[z-.77,'carvingRecess157'],[back+.10,'hallBearing']])for(let x=-w*.48;x<=w*.481;x+=.29){const top=profile(Math.abs(x)/(w/2))-.19,base=e+.29;if(top>base)b.box(x,(top+base)/2,plane,.288,top-base,.18,ma,0,.92+.06*Math.sin(x*5.1)**2);}
  b.box(0,e+r*.47,z-.16,.31,r*.94,.83,'hallOxide');b.box(0,e+.54,z-.12,w*.86,.34,.86,'hallOxide');b.box(0,e+1.64,z-.13,w*.49,.24,.71,'hallBearing');
  for(const sign of[-1,1]){
   const rake=Array.from({length:65},(_,j)=>{const t=j/64;return[sign*w*.5*t,profile(t)-.40,z+.12];});
   sweep(rake,.74,.84,'scene02-368-deep-continuous-bargeboard-'+sign,'hallOxide');
   sweep(rake.map(p=>[p[0],p[1]-.40,p[2]+.28]),.19,.29,'scene02-368-inner-rake-shoulder-'+sign,'hallBearing');b.put(band(sign),'carvingBronze157');
   for(const drop of[.16,.76])sweep(Array.from({length:65},(_,j)=>{const t=j/64;return[sign*w*.5*t,profile(t)-drop,z+.705];}),.045,.042,'scene02-368-rake-moulding-'+sign+'-'+drop,'carvingBronze157');
   // Separate deep volutes and paired fluted leaves follow the timber's
   // changing tangent. The bronze backing remains recessed between them.
   for(let j=0;j<22;j++){
    const t=.042+j*.0435,dy=(profile(t+.001)-profile(t-.001))/.002,theta=Math.atan2(dy,sign*w*.5),x=sign*w*.5*t,y=profile(t)-.455;
    C.scroll([x,y,z+.705],.46,0,theta,'carvingGold157');
    for(const side of[-1,1])C.leaf([x,y,z+.715],.20,.30,0,theta-Math.PI/2+side*.68,'carvingGold157',.31);
   }
   for(const [j,t]of[.14,.38,.65,.88].entries()){
    const y=profile(t)-.84,x=sign*w*.5*t,size=j===1?.68:.54;
    b.box(x,y+.13,z+.29,.22,.30,.61,'hallBearing');C.bearing(x,y+.06,z+.27,.44,.65,'hallOxide',false);
    for(const side of[-1,1])C.leaf([x+side*.09,y+.03,z+.63],size,.61,0,Math.PI-side*.35,'carvingGold157',.55);
    C.scroll([x,y-.12,z+.65],.48,0,sign<0?Math.PI:0,'carvingBronze157');stats.carriedPendents++;
   }
   sweep([[sign*w*.34,e+.64,z-.02],[sign*w*.225,e+1.32,z-.02],[sign*w*.11,e+r*.64,z-.02],[0,e+r-.72,z-.02]],.245,.83,'scene02-368-deep-inner-curved-truss-'+sign,'hallBearing');
  }
  for(const [i,x]of[-w*.245,0,w*.245].entries()){
   const pw=w*.19,py=e+1.14,ph=.58;b.box(x,py,z-.31,pw,ph,.18,'carvingRecess157');
   for(const side of[-1,1]){b.box(x+side*pw/2,py,z-.04,.105,ph+.12,.52,'hallOxide');b.box(x,py+side*ph/2,z-.04,pw+.10,.09,.52,'hallBearing');}
   sweep(Array.from({length:33},(_,j)=>{const u=-1+2*j/32;return[x+u*pw*.44,py+.06*Math.sin(u*Math.PI*2),z+.24];}),.030,.030,'scene02-368-coffer-stem-'+i,'carvingBronze157');
   for(let j=0;j<6;j++){const u=-.84+j*1.68/5,xx=x+u*pw*.44;C.scroll([xx,py,z+.26],.48,0,j%2?Math.PI:0,'carvingGold157');for(const side of[-1,1])C.leaf([xx+side*.045,py-.03,z+.28],.19,.28,0,side*.85,'carvingBronze157',.31);}C.rosette([x,py,z+.22],.30);stats.coffers++;
  }
  for(const sign of[-1,1]){
   const x=sign*w*.102,py=e+r*.443,pw=w*.105,ph=r*.19;b.box(x,py,z-.51,pw,ph,.14,'carvingRecess157');
   for(const side of[-1,1]){b.box(x+side*pw/2,py,z-.12,.10,ph+.10,.49,'hallBearing');b.box(x,py+side*ph/2,z-.12,pw+.10,.10,.49,'hallOxide');}
   for(let j=0;j<9;j++)b.box(x+(j-4)*pw/9,py,z-.24,.031,ph,.15,'hallBearing');
  }
  const crest=C.prototypes.find(g=>g.name==='scene02-closed-carved-cloud-nose157');if(!crest)throw Error('Missing existing closed crest');
  b.put(crest,'hallTile1542',[0,e+r+.18,z+.22],[.9,1,1],[0,0,-.26]);C.scroll([0,e+r+.20,z+.43],.78,0,-.25,'carvingBronze157');
  for(const y of[e+.62,e+r*.55]){C.facePlate(0,y,z+.34,.35,.34);C.leaf([0,y-.17,z+.37],.34,.51,0,Math.PI,'carvingBronze157',.50);}
 });
 const nose=C.prototypes.find(g=>g.name==='scene02-closed-carved-cloud-nose157'),left=C.prototypes.find(g=>g.name==='scene02-closed-carved-cloud-nose-left157');
 for(const sign of[-1,1]){const p=[cx+sign*roof.roofWidth/2,roof.roofEave+roof.roofCurl,roof.roofFront];b.at(p,0,()=>{b.put(sign<0?left:nose,'hallTile1542',[0,.30,0],[.80,1.25,1.25],[0,0,sign*.12]);b.put(sign<0?left:nose,'hallTile1542',[-sign*.12,.64,-.15],[.44,.74,.80],[0,0,-sign*.35]);C.scroll([-sign*.03,.29,.20],.70,0,sign<0?Math.PI:0,'carvingBronze157');C.leaf([-sign*.21,.09,.25],.45,.61,0,-sign*.35,'carvingBronze157',.7);});}
 stats.retainedCarrier186=buildGableCarrying186({b,C,roof,sculpture186});C.stats.gableBuilt=true;return stats;
}
