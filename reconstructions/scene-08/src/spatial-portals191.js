import * as T from 'three';
import {createContinuousTimber} from './gallery-joinery.js';
import {createArmCladding191,createCantileverCladding191} from './arm-cladding191.js';

// Original full-depth carpentry. The existing171 roof/shaft/site contacts
// remain the exterior frame; these members build its occupied inner layers.
export const SPATIAL191_REVISION='scene08-occupied-portals-and-carried-gallery191-r06';

export function createFlaredCollar191(r=.295){
 const profile=[[0,-.16],[r*.97,-.16],[r*1.025,-.13],[r*1.035,-.075],[r*1.16,-.015],[r*1.29,.040],[r*1.32,.085],[r*1.27,.115],[0,.115]],g=new T.LatheGeometry(profile.map(q=>new T.Vector2(...q)),48);g.name='scene08-191-closed-flared-capital-cladding';return g;
}

export function createPortalHeader191(width,depth=.36){
 const w=width/2,s=new T.Shape();s.moveTo(-w,.12);s.lineTo(w,.12);s.lineTo(w,-.055);s.bezierCurveTo(w*.69,-.08,w*.57,-.28,w*.36,-.22);s.bezierCurveTo(w*.22,-.16,w*.19,-.08,0,-.12);s.bezierCurveTo(-w*.19,-.08,-w*.22,-.16,-w*.36,-.22);s.bezierCurveTo(-w*.57,-.28,-w*.69,-.08,-w,-.055);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:depth-.024,steps:1,curveSegments:18,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:3});g.translate(0,0,-depth/2+.012);g.name='scene08-191-closed-shaped-portal-head';return g;
}

export function createSpatialPortals191({emit,box,between,group}){
 const portals=[],caps=[],receivers=[],skippedReceivers=[],headerCache=new Map(),collarCache=new Map(),claddingCache=new WeakMap(),claddingMounts=[],cantileverCladding=[];
 function cladJoinery(x,y,z,sx,sy,sz,kit,label){
  if(!claddingCache.has(kit))claddingCache.set(kit,createArmCladding191(kit));const fitted=claddingCache.get(kit);
  for(const p of fitted.parts)emit(p.geometry,p.material,x,y,z,sx,sy,sz);
  claddingMounts.push({label,axis:[x,y,z],scale:[sx,sy,sz],sleeves:fitted.parts.length,actualArmProfile:true});
 }
 function cladCantilever(source,x,y,z,yaw,label){emit(createCantileverCladding191(source),'castgilt191',x,y,z,1,1,1,[0,yaw,0]);cantileverCladding.push({label,axis:[x,y,z],yaw,actualArmProfile:true});}
 const leafShape=new T.Shape();leafShape.moveTo(0,0);leafShape.bezierCurveTo(-.050,.045,-.044,.125,0,.158);leafShape.bezierCurveTo(.044,.125,.050,.045,0,0);leafShape.closePath();const leaf=new T.ExtrudeGeometry(leafShape,{depth:.014,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,curveSegments:10});leaf.translate(0,0,-.007);
 function collar(x,z,seat,r){
  if(!collarCache.has(r))collarCache.set(r,createFlaredCollar191(r));emit(collarCache.get(r),'oldgold',x,seat-.015,z);
  const rim=new T.TorusGeometry(r*1.23,.014,8,48);emit(rim,'joinerygilt',x,seat+.085,z,1,1,1,[Math.PI/2,0,0]);
  for(let j=0;j<12;j++){const a=j*Math.PI/6,rr=r*1.15;emit(leaf,'joinerygilt',x+Math.sin(a)*rr,seat-.11,z+Math.cos(a)*rr,1,1,1,[0,a,0]);}
  caps.push({axis:[x,z],shaftReceiver:seat,radius:r,closedMetalCladding:true});
 }
 function leafDoor(hingeX,lo,z,width,height,sign,yaw){
  group(hingeX,lo,z,yaw,()=>{
   const cx=sign*width/2;for(const x of[0,sign*width])box(x,height/2,0,.065,height,.11,'red');
   for(const y of[.035,.63,height-.035])box(cx,y,0,width+.055,.085,.13,'wood');
   box(cx,.32,-.018,width-.075,.49,.065,'red');
   for(let j=0;j<5;j++)box(cx-width*.38+j*width*.19,(height+.72)/2,.017,.020,Math.max(.25,height-.79),.034,'dark');
   for(let j=0;j<9;j++)box(cx,.77+j*Math.max(.25,height-.84)/8,.026,width-.07,.020,.036,'wood');
   for(const y of[.24,.54,height-.18])box(sign*.015,y,.069,.078,.095,.014,'joinerygilt');
  });
 }
 function portal({x=0,z=0,lo,hi,width,depth=1.25,jamb=.105,label,doors=true}){
  const h=hi-lo;if(h<.50||width<.35)throw Error('Invalid191 portal dimensions');
  group(x,0,z,0,()=>{
   // No dark plane spans the aperture: full returns, threshold, ceiling
   // joists and folded leaves reveal the actual room/garden behind it.
   for(const side of[-1,1]){
    const xx=side*width/2;box(xx,(lo+hi)/2,-depth/2,jamb,h,depth+.12,'red');box(xx,(lo+hi)/2,.035,jamb+.035,h+.09,.23,'wood');
    for(const y of[lo+.20,hi-.22])box(xx,y,.17,jamb*.81,.15,.020,'joinerygilt');
    if(doors)leafDoor(xx-side*.035,lo+.04,-.13,width*.32,h-.10,-side,-side*1.18);
   }
   box(0,hi-.035,-depth/2,width+.18,.22,depth+.14,'wood');box(0,lo+.035,-depth/2,width+.12,.09,depth+.18,'wood');
   const key=width.toFixed(4);if(!headerCache.has(key))headerCache.set(key,createPortalHeader191(width+.08));emit(headerCache.get(key),'red',0,hi-.075,.065);
   for(let i=0,n=Math.ceil(width/.20);i<=n;i++)box(-width/2+width*i/n,hi-.17,-depth/2,.055,.095,depth+.13,'redlight');
   for(let j=0,n=Math.ceil(depth/.22);j<n;j++)box(0,lo+.092,-.08-(j+.5)*depth/n,width-.055,.025,depth/n-.006,'wood');
  });
  portals.push({label,front:[x,z],bottom:lo,top:hi,width,depth,clearWidth:width-jamb,openVolume:true,foldedLeaves:doors});
 }
 function interior({floor,front,back,width,seat}){
  // Longitudinal and transverse members create a continuous occupied room,
  // rather than four unconnected shallow grid panels behind the column row.
  for(const x of[-width*.34,0,width*.34])box(x,seat-.74,(front+back)/2,.16,.24,front-back+.12,'wood');
  for(let z=back+.15;z<front;z+=.66){box(0,seat-.84,z,width,.19,.17,'red');for(let j=0;j<6;j++)box(-width*.42+j*width*.84/5,seat-.94,z+.28,.055,.06,.47,'wood');}
  // A fixed low bench is supported on the held floor, behind the openings.
  box(-width*.30,floor+.48,-.47,.45,.12,1.82,'wood');for(const z of[-1.17,.22])for(const x of[-width*.30-.14,-width*.30+.14])box(x,floor+.245,z,.065,.47,.075,'red');
 }
 function galleryReceiver({x,z,floor,weatherY,column,galleryJoinery,label}){
  if(!Number.isFinite(weatherY)){skippedReceivers.push({label,axis:[x,z],reason:"Outside actual roof coverage; no forced post emitted"});return false;}const roofUnder=weatherY-.38,base=roofUnder-.65,h=base-floor-.20;if(h<.70){skippedReceivers.push({label,axis:[x,z],reason:"Insufficient actual roof height; no forced post emitted"});return false;}
  column(x,z,floor,h,.145);for(const q of galleryJoinery.parts)emit(q.geometry,q.material,x,base,z,.49,.64,.49);cladJoinery(x,base,z,.49,.64,.49,galleryJoinery,label);box(x,roofUnder-.065,z,.29,.16,.33,'wood');
  receivers.push({label,axis:[x,z],floor,shaftTop:base,roofReceiver:roofUnder+.015,weatherY,actualRoofQueried:true});return true;
 }
 return{portal,collar,interior,galleryReceiver,cladJoinery,cladCantilever,info:()=>({revision:SPATIAL191_REVISION,portals,caps,receivers,skippedReceivers,claddingMounts,cantileverCladding,photographSampled:false,newScannedInstances:0,visualAccepted:false})};
}
