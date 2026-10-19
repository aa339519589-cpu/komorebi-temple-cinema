import * as T from 'three';
import {createGatePlaque,createGateColumnShoe} from './gate-hardware.js';

// Single coherent metric layout hypothesis from the supplied corridor view.
// Reference pixels are measurements only; no image is loaded by this module.
export const CORRIDOR_LAYOUT=Object.freeze({
 revision:'scene08-connected-corridor-layout122',
 portal:{origin:[.02,0,8.10],yaw:-.10,halfSpan:2.17,columnWidth:.61,columnDepth:.64,floor:.94,columnTop:6.425,beamCentre:6.62,beamDepth:.40,rafterBottom:6.82},
 nearRail:{a:[-2.06501,4.88844],b:[1.62798,8.34852],floor:.94,handrailHeight:.97,postT:.27,postHeight:1.75},
 hall:{position:[-6.70,2.95,-5.8],yaw:.08,w:11,d:8,h:4.5,raised:2.0,roofRise:4.8,roofEaveDrop:.45,roofCurl:1.1},
 wing:{position:[-1.86,1.5,-7.5],yaw:-.55,w:5.3,d:10.3,h:3.7,raised:3.0},
 pagoda:{position:[4.7,3.016,-24],yaw:-.40,scale:1.2,tierPitch:2.75,roomHeight:1.9,topRoofRise:2.0,spireLocalOffset:-2.68,foundationGround:1.70},
 middleGallery:{position:[1.47,4.28,-9],yaw:-.1,h:2.02,floor:4.5},
 rightGallery:{position:[7.9,3.7,-10],yaw:-.15,h:4.8,floor:4.2},
 bridge:{a:[1.90,2.95,-3.7],b:[7.50189,4.2,-7.36591],width:1.5,arch:.32,segments:28},
 stair:{a:[1.90,2.95,-3.7],b:[1.30,4.5,-7.1],width:1.11,steps:10},
});

export function buildCorridorPortal(api,heroPlaque){
 const {group,box,emit,between,lantern}=api,P=CORRIDOR_LAYOUT.portal;
 group(...P.origin,P.yaw,()=>{
  for(const sign of [-1,1]){
   const x=sign*P.halfSpan,height=P.columnTop-P.floor;
   box(x,P.floor+height/2,0,P.columnWidth,height,P.columnDepth,'red');
   for(const y of [1.9,5.7])for(const part of createGatePlaque(.47,y===1.9?1.35:.85))emit(part.geometry,part.material,x,y,.34);
   for(const part of createGateColumnShoe(.61,.64,.24))emit(part.geometry,part.material,x,P.floor+.12,0);
   const facing=-sign,hardware=sign<0?[[3.30,.42,.58]]:[[5.28,.44,.84],[2.58,.44,.93]];
   for(const [y,w,h]of hardware)for(const part of sign<0?heroPlaque.parts:createGatePlaque(w,h))emit(part.geometry,part.material,x+facing*.317,y,0,1,1,1,[0,facing*Math.PI/2,0]);
  }
  // Closed beam seats on the column tops; rafters start at the beam top,
  // boarding begins at the rafter top. No disjoint height-anchor fitting.
  box(0,P.beamCentre,.10,5.0,P.beamDepth,1.5,'red');
  for(let i=0;i<20;i++){
   const x=-2.75+i*5.5/19;box(x,P.rafterBottom+.12,.05,.17,.24,2.8,'redlight');
   box(x,P.rafterBottom+.055,1.46,.12,.10,.05,'gold');
  }
  for(let j=0;j<8;j++)box(0,P.rafterBottom+.28,-1.4+j*.50,5.8,.08,.49,'redlight');
  box(0,P.rafterBottom+.37,.35,6.0,.10,3.9,'wood');
  lantern(-1.75,6.35,-1.30,.48,P.rafterBottom+.23);
 });
 const rotate=new T.Matrix4().makeTranslation(...P.origin).multiply(new T.Matrix4().makeRotationY(P.yaw));
 heroPlaque.info.layoutWorldPosition=new T.Vector3(-P.halfSpan+.317,3.3,0).applyMatrix4(rotate).toArray();
}

export function buildCorridorNearRail(api){
 const {box,emit,between}=api,C=CORRIDOR_LAYOUT.nearRail;
 const direction=new T.Vector3(C.b[0]-C.a[0],0,C.b[1]-C.a[1]),length=direction.length(),normal=new T.Vector3(-direction.z,0,direction.x).normalize(),point=t=>[C.a[0]+direction.x*t,C.floor,C.a[1]+direction.z*t];
 // Actual lower veranda floor, with a raised entry floor and three full-width
 // treads behind the gate. The handrail remains a constant-height guard.
 const poly=new T.Shape();poly.moveTo(C.a[0]-.55,C.a[1]-.52);poly.lineTo(C.b[0]+.65,C.b[1]+.10);poly.lineTo(3.2,18);poly.lineTo(-3.2,18);poly.closePath();
 const deck=new T.ExtrudeGeometry(poly,{depth:.24,steps:1,bevelEnabled:false});deck.rotateX(Math.PI/2);deck.translate(0,C.floor,0);emit(deck,'wood');
 box(0,1.17,13.7,6.4,.46,9.0,'wood');
 for(let i=0;i<3;i++){const top=C.floor+(1.4-C.floor)*(i+1)/3;box(0,(top+C.floor)/2,8.78+i*.26,4.4,top-C.floor,.27,'wood');}
 const handY=C.floor+C.handrailHeight;
 for(const dy of [.18,C.handrailHeight])between([C.a[0],C.floor+dy,C.a[1]],[C.b[0],C.floor+dy,C.b[1]],dy>.5?.14:.12,'redlight',false,dy>.5?.19:.15);
 const profile=[[.09,0],[.09,.08],[.06,.16],[.045,.28],[.045,.48],[.072,.58],[.09,.66],[.09,.74]],baluster=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),12);
 for(let i=1;i<5;i++){
  const t=i/5;if(Math.abs(t-C.postT)<.085)continue;const [x,,z]=point(t);emit(baluster,'red',x,C.floor+.19,z,1,1,1,[0,Math.PI/8,0]);
 }
 const [x,,z]=point(C.postT);box(x,C.floor+C.postHeight/2,z,.26,C.postHeight,.26,'red');
 for(const p of [C.a,C.b])box(p[0],C.floor+C.handrailHeight/2,p[1],.14,C.handrailHeight,.16,'red');
 // A substantial closed metal finial replaces the old repeated gold balls.
 const finial=new T.LatheGeometry([[0,0],[.17,0],[.17,.08],[.14,.13],[.14,.20],[.12,.28],[.05,.34],[0,.36]].map(p=>new T.Vector2(...p)),24);emit(finial,'gold',x,C.floor+C.postHeight,z);
 // The side return uses the same floor/handrail height; it does not invent a
 // second unsupported rail height to fit the partly occluded photograph.
 const sideEnd=[-2.58,C.floor,7.65];
 box(sideEnd[0],C.floor+C.handrailHeight/2,sideEnd[2],.14,C.handrailHeight,.16,'red');
 for(const dy of [.18,C.handrailHeight])between([C.a[0],C.floor+dy,C.a[1]],[sideEnd[0],C.floor+dy,sideEnd[2]],dy>.5?.14:.12,'redlight',false,.16);
 for(let i=1;i<=2;i++){const t=i/3;emit(baluster,'red',C.a[0]+(sideEnd[0]-C.a[0])*t,C.floor+.19,C.a[1]+(sideEnd[2]-C.a[1])*t);}
 return {point:point(C.postT),handrailY:handY,planLength:length,normal:normal.toArray()};
}

export function buildCorridorBridge(api){
 const {box,between,railing}=api,C=CORRIDOR_LAYOUT.bridge,dx=C.b[0]-C.a[0],dz=C.b[2]-C.a[2],run=Math.hypot(dx,dz),yaw=Math.atan2(-dz,dx),normal=[-dz/run,dx/run],height=t=>C.a[1]+(C.b[1]-C.a[1])*t+C.arch*Math.sin(t*Math.PI);
 for(let i=0;i<C.segments;i++){const t=(i+.5)/C.segments;box(C.a[0]+dx*t,height(t)-.10,C.a[2]+dz*t,run/C.segments+.015,.19,C.width,'wood',yaw);}
 for(const sign of [-1,1])railing([C.a[0]+normal[0]*sign*(C.width/2-.08),C.a[2]+normal[1]*sign*(C.width/2-.08)],[C.b[0]+normal[0]*sign*(C.width/2-.08),C.b[2]+normal[1]*sign*(C.width/2-.08)],height);
 for(const [p,ground]of [[C.b,.95]])box(p[0],(p[1]-.15+ground)/2,p[2],1.05,p[1]-.15-ground,C.width+.2,'stone',yaw);
 return {run,yaw,landingA:C.a,landingB:C.b,width:C.width,arch:C.arch};
}
