import {T} from './kernel.js';

// Original solid architectural inference from the supplied comparison. The
// existing mass170 roof, outside column seats, stair and camera are retained.
export const SPATIAL186_REVISION='scene02-deep-return-gallery-and-gable186-r05';

export function createPiercedCradle186(width=4.9,height=1.36,depth=.90){
 const s=new T.Shape(),X=x=>x*width,Y=y=>y*height;
 s.moveTo(X(-.5),0);s.bezierCurveTo(X(-.37),Y(.02),X(-.32),Y(.18),X(-.24),Y(.43));s.bezierCurveTo(X(-.13),Y(.83),X(-.075),Y(1),0,Y(.98));s.bezierCurveTo(X(.075),Y(1),X(.13),Y(.83),X(.24),Y(.43));s.bezierCurveTo(X(.32),Y(.18),X(.37),Y(.02),X(.5),0);s.lineTo(X(.5),Y(-.10));s.lineTo(X(-.5),Y(-.10));s.closePath();
 for(const side of[-1,1]){
  const h=new T.Path(),x=q=>side*q*width;
  h.moveTo(x(.34),Y(.09));h.bezierCurveTo(x(.27),Y(.12),x(.235),Y(.26),x(.20),Y(.37));h.bezierCurveTo(x(.145),Y(.55),x(.10),Y(.60),x(.075),Y(.55));h.bezierCurveTo(x(.06),Y(.45),x(.13),Y(.24),x(.17),Y(.18));h.bezierCurveTo(x(.24),Y(.08),x(.27),Y(.06),x(.34),Y(.09));h.closePath();
  const p=h.getPoints(40);if(T.ShapeUtils.isClockWise(p)===T.ShapeUtils.isClockWise(s.getPoints(40)))p.reverse();const hole=new T.Path(p);hole.closePath();s.holes.push(hole);
 }
 const g=new T.ExtrudeGeometry(s,{depth:depth-.032,bevelEnabled:true,bevelSize:.016,bevelThickness:.016,bevelSegments:3,curveSegments:32,steps:1});g.translate(0,0,-depth/2+.016);g.name='scene02-186-closed-pierced-frogleg-gable-carrier';g.userData.source='Original project-authored closed carved timber; no photographed or downloaded surface';
 const edge=[];for(const c of s.curves.slice(0,4))for(const p of c.getPoints(32))edge.push([p.x,p.y-.06,depth/2+.018]);
 return{geometry:g,edge,width,height,depth};
}

export function buildGableCarrying186({b,C,roof,sculpture186=null}){
 const {gableCenterX:cx,gableEave:e,gableRise:r,gableFront:z}=roof,cradle=createPiercedCradle186(),base=e+1.69,depthPlane=z+.32;
 let actualCarving=null;
 b.at([cx,0,0],0,()=>{
  // The pierced carving is a heavy full-depth structural body. Its feet
  // sit inside the retained170 collar beam, not over a flat triangle image.
  b.put(cradle.geometry,'hallBearing',[0,base,depthPlane]);
  b.put(C.sweep(cradle.edge,.075,.064,'scene02-186-closed-gable-carrier-chased-arris'),'carvingBronze157',[0,base,depthPlane]);
  for(const side of[-1,1]){
   b.box(side*cradle.width*.46,base-.015,depthPlane,.60,.25,1.04,'hallOxide');
   C.bearing(side*cradle.width*.46,base+.10,depthPlane,.65,.94,'hallBearing',true);
   C.scroll([side*cradle.width*.295,base+.21,depthPlane+cradle.depth/2+.025],1.25,0,side<0?Math.PI:0,'hallBearing');
   C.leaf([side*cradle.width*.17,base+.52,depthPlane+cradle.depth/2+.045],.62,.67,0,-side*.56,'carvingBronze157',.64);
   // Paired curved cheek struts occupy a second real depth in the loft.
   const q=[[side*2.30,base+.05,z-.30],[side*2.05,base+.65,z-.30],[side*1.28,base+1.45,z-.30],[side*.48,e+r-.66,z-.30]];
   b.put(C.sweep(q,.34,.60,'scene02-186-deep-inner-curved-gable-cheek-'+side),'hallOxide');
  }
  b.box(0,base+cradle.height+.045,depthPlane,.91,.24,1.08,'hallOxide');C.bearing(0,base+cradle.height+.21,depthPlane,.70,.90,'hallBearing',true);
  if(!sculpture186)C.rosette([0,base+.56,depthPlane+cradle.depth/2+.03],.48);
  if(sculpture186)actualCarving=sculpture186.mount(b,base,depthPlane);
  // A deeply framed little vent is concealed behind the pierced channels;
  // diagonal timber bars keep the attic occupied while preserving depth.
  for(const side of[-1,1]){
   const x=side*1.36,lo=base+.23,hi=base+1.27;
   b.box(x,(lo+hi)/2,z-.49,1.28,hi-lo,.12,'carvingRecess157');
   for(let j=0;j<6;j++)b.line([x-.59+j*.21,lo,z-.34],[x-.39+j*.21,hi,z-.34],.043,'hallBearing',true,.09);
  }
 });
 return{revision:SPATIAL186_REVISION,closedPiercedCarrier:{width:cradle.width,height:cradle.height,depth:cradle.depth,base,frontPlane:depthPlane},retained170RakeKingPostCoffersAndCrests:true,actualCarving,newSourceMedia:false,visualAccepted:false};
}

export function buildSpatialGallery186({b,mats,frame,carpentry}){
 const C=carpentry.carved186,floor=2.2,roofSeat=8.05,returnDepth=2.30,zCentre=-.80,cuts=[-4.60,-2.30,0,2.30,4.60],records=[];
 for(const side of[-1,1]){
  const outer=side<0?frame.axes[0]:frame.axes.at(-1),wall=outer-side*returnDepth,centre=(outer+wall)/2;
  // A whole walkable return floor and framed inner enclosure replace the
  // former wall14cm behind the outside columns. Outer column seats stay.
  b.box(centre,floor+.035,zCentre,returnDepth+.35,.10,10.55,'hallBearing');
  for(let i=0;i<42;i++)b.box(centre,floor+.102,-5.98+i*.25,returnDepth+.28,.045,.238,'hallOxide');
  b.at([wall,0,zCentre],side*Math.PI/2,()=>{
   for(let bay=0;bay<cuts.length-1;bay++){
    const a=cuts[bay],c=cuts[bay+1],x=(a+c)/2,w=c-a-.20,lo=3.68,hi=6.62;
    b.box(x,2.98,-.15,w,1.40,.20,'hallOxide');b.box(x,(lo+hi)/2,-.27,w,hi-lo,.15,'carvingRecess157');
    for(const q of[-1,1]){b.box(x+q*w/2,(lo+hi)/2,.04,.12,hi-lo+.15,.38,'hallOxide');b.box(x,(lo+hi)/2+q*(hi-lo)/2,.045,w+.12,.13,.40,'hallBearing');}
    for(let j=1;j<11;j++)b.box(x-w/2+j*w/11,(lo+hi)/2,-.075,.031,hi-lo-.12,.11,'hallBearing');
    for(let j=1;j<12;j++)b.box(x,lo+j*(hi-lo)/12,-.055,w-.12,.028,.11,'hallBearing');
    b.box(x,7.06,-.15,w,.44,.12,'hallPlaster');carpentry.transomBay(x,7.05,.06,w-.04);
    for(const q of[-1,1])C.facePlate(x+q*w*.29,3.26,.015,.30,.25);
   }
   for(const x of cuts){b.box(x,5.16,-.02,.18,5.72,.42,'hallOxide');for(const y of[3.30,6.63,7.65])C.facePlate(x,y,.205,.18,.24);}
   b.box(0,7.89,.01,9.53,.38,.58,'hallOxide');b.box(0,8.17,-.045,9.63,.20,.62,'hallBearing');
  });
  // Independent ceiling ties contact both the inner wall receiver and the
  // held outside column-head ring. Curved knees have true thickness.
  for(const z of[-5.5,-3.2,-.8,1.6,4.0]){
   b.box(centre,7.97,z,returnDepth+.66,.37,.47,'hallOxide');
   b.at([outer,7.78,z],side*Math.PI/2,()=>{
    const q=[[0,0,0],[.18,.11,-.22],[.27,.22,-.64],[.28,.28,-1.44]];
    b.put(C.sweep(q,.22,.35,'scene02-186-closed-return-knee-'+side+'-'+z),'hallBearing');
   });
  }
  for(let z=-5.9;z<4.56;z+=.53)b.box(centre,8.36,z,returnDepth+.50,.23,.14,'hallBearing');
  // Open gallery guard has a continuous top, separate low rail and posts.
  const railX=outer+side*.29;for(const y of[floor+.30,floor+.86])b.box(railX,y,-.58,.12,.105,10.0,'hallOxide');
  for(let z=-5.55;z<4.46;z+=1.25){b.box(railX,floor+.58,z,.13,1.12,.15,'hallOxide');b.box(railX,floor+1.165,z,.19,.055,.22,'hallBearing');}
  for(let z=-5.3;z<4.3;z+=.42)b.box(railX,floor+.58,z,.055,.56,.06,'hallOxide');
  records.push({side,outerColumnX:outer,innerWallX:wall,returnDepthLocal:returnDepth,formerlyLocal:.26,floorY:floor,wallHeadY:roofSeat,outerRoofAndShaftSeatsUnchanged:true});
 }
 return{revision:SPATIAL186_REVISION,returns:records,frameDepthPlanes:['outside column/rail','walkable floor/ceiling ties','deep inner lattice/plaster enclosure','existing sanctuary and rear wall'],photoPixelsSampled:false,visualAccepted:false};
}
