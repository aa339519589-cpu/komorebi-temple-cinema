import * as T from 'three';
import {createContinuousTimber} from './gallery-joinery.js';
import{createCantilever197}from'./natural-joinery197.js';
import{createSteppedReceiver213}from'./garden-joinery213.js';
import{createFineCantilever213,createFineHallJoinery213,createFineArmEnd213}from'./fine-hall213.js';
import{createOrnateHead213,capitalHead213,risingCloud213,cloudCross213,terminalInlay213,lintelSpandrel213,lintelMouldings213,mouldedBeam213}from'./ornate-bearing213.js';
// Complete broad-shaft frame. Bearing endpoints are queried from the same
// authored roof triangles, so the curved cantilevers meet its real underside.
export function buildGrandBearing171({emit,box,between,group,lantern,lattice,galleryJoinery,grandFrame,peony,roof171,spatial191}){
 const floor=grandFrame.floor,cap=grandFrame.lintel,bw=3.50,front=3.20,far=-2.40,bd=front-far,xs=[-1.75,0,1.75],sideZ=[-1.00,.40,1.80],caps=[],contacts=[];
 const fineKit=createOrnateHead213(),secondary=[],spandrels=new Map(),mouldings=new Map();
 const spandrel=w=>{if(!spandrels.has(w))spandrels.set(w,lintelSpandrel213(w));return spandrels.get(w);};
 const mould=w=>{if(!mouldings.has(w))mouldings.set(w,lintelMouldings213(spandrel(w)));return mouldings.get(w);};
 const weather=(x,z)=>roof171.surfaceY(x-.40,z-.40);
 function availableReach(x,z,dx,dz,wanted){for(let q=wanted;q>.06;q-=.075)if(weather(x+dx*q,z+dz*q)!==null)return q;return 0;}
 function reachAt(side,z){return availableReach(side*bw/2,z,side,0,side>0?2.40:1.90);}
 function seatAt(x,z){const side=Math.sign(x)||1,reach=reachAt(side,z),outer=weather(side*(bw/2+reach),z),direction=Math.abs(z-front)<.01?1:Math.abs(z-far)<.01?-1:0,q=direction?availableReach(x,z,0,direction,1.20):0,near=direction?weather(x,z+direction*q):null;return Math.min(cap,(outer??weather(x,z)??(cap+1.10))-.94,(near??(cap+1.10))-.94);}
 function shaft(x,z,r){
  const seat=seatAt(x,z),bottom=floor+.22,top=seat-.14,h=top-bottom,profile=[[0,0],[r*.98,0],[r,.10*h],[r*1.035,.38*h],[r*1.02,.62*h],[r*.96,.90*h],[r*.94,h],[0,h]],g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),40),p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++)uv.setXY(i,p.getY(i)/1.6,Math.atan2(p.getZ(i),p.getX(i))*r/.55);g.userData.member='171-entasis-turned-timber-shaft';
  emit(g,'hallLacquer213',x,bottom,z);emit(new T.CylinderGeometry(r*1.36,r*1.48,.20,32),'hallFoundation',x,floor+.10,z);for(const part of capitalHead213(r))emit(part.g,part.ma,x+part.p[0],seat+part.p[1],z+part.p[2],1,1,1,part.rot);caps.push([x,z,seat]);
 }
 function cloudArm(length,rise,depth=.18){return createFineCantilever213(length,rise,depth);}
 function armAt(x,z,seat,dx,dz,wanted){
  const reach=availableReach(x,z,dx,dz,wanted),endX=x+dx*reach,endZ=z+dz*reach,weatherY=weather(endX,endZ),target=(weatherY??(seat+1.08))-.25,yaw=Math.atan2(-dz,dx);
  const levels=4,head=seat+.13,total=target-head;
  for(let level=0;level<levels;level++){
   const start=level?level*reach/levels-.055:0,end=(level+1)*reach/levels,length=end-start,y0=head+total*start/reach,y1=head+total*end/reach,rise=y1-y0;
   const carrier=risingCloud213(length,rise,.138-level*.009);emit(carrier,'hallArm213',x+dx*start,y0,z+dz*start,1,1,1,[0,yaw,0]);
   const cross=Math.min(.47,.32+reach*.065),px=-dz,pz=dx,crossY=y1+(level===levels-1?.018:.095);
   const saddle=cloudCross213(cross,.105,'top');emit(saddle,'hallArm213',x+dx*end,crossY,z+dz*end,1,1,1,[0,yaw+Math.PI/2,0]);
   for(const sign of[-1,1]){const rib=risingCloud213(cross*.42,.14,.080,'return'),ribYaw=Math.atan2(-pz*sign,px*sign);emit(rib,'hallArm213',x+dx*(end-.04)+px*sign*.015,crossY-.16,z+dz*(end-.04)+pz*sign*.015,1,1,1,[0,ribYaw,0]);}
   if(level===1||level===3)for(const sign of[-1,1])for(const metal of terminalInlay213(saddle,sign))emit(metal,'hallInlay213',x+dx*end,crossY,z+dz*end,1,1,1,[0,yaw+Math.PI/2,0]);
   if(level<levels-1)emit(createSteppedReceiver213(.115,.075,.14,.70),'hallReceiver213',x+dx*end,crossY+.04,z+dz*end);
   if(level===levels-1)for(const metal of terminalInlay213(carrier,1))emit(metal,'hallInlay213',x+dx*start,y0,z+dz*start,1,1,1,[0,yaw,0]);
  }
  box(endX,target+.045,endZ,.16,.17,.20,'hallBeam213');contacts.push({shaft:[x,seat,z],roofReceiver:[endX,target+.13,endZ],actualWeatherY:weatherY,curvedStages:levels,tallVerticalSpacerBlocksRetired:true});return[endX,target-.02,endZ];
 }
 group(-.40,0,-.40,0,()=>{
  box(0,floor-.20,(front+far)/2,bw+.56,.28,bd+.48,'hallFoundation');box(0,floor-.035,(front+far)/2,bw+.44,.10,bd+.40,'wood');
  for(let i=0;i<22;i++)box(-1.94+i*.185,floor+.026,(front+far)/2,.174,.025,bd+.27,'wood');
  for(const z of[far,front])for(const x of xs){box(x,(floor-.08)/2,z,.42,floor-.08,.42,'hallFoundation');shaft(x,z,.295);}
  for(const side of[-1,1])for(const z of sideZ){box(side*bw/2,(floor-.08)/2,z,.40,floor-.08,.40,'hallFoundation');shaft(side*bw/2,z,.273);}
  for(const sign of[-1,1])group(0,0,sign>0?front:far,sign<0?Math.PI:0,()=>{
   const seat=Math.min(...xs.map(x=>seatAt(x,sign>0?front:far))),beamY=seat-1.05,windowTop=beamY-.60,windowBottom=floor+.50;
   for(const x of[-.875,.875]){
    if(sign>0&&x>0)spatial191.portal({x,z:-.42,lo:floor+.04,hi:beamY-.26,width:1.37,depth:1.20,label:'grand-front-occupied-entry'});
    else{box(x,floor+.34,-.46,1.43,.48,.22,'wood');lattice(x,(windowBottom+windowTop)/2,-.42,1.37,windowTop-windowBottom);}
    for(const xx of[x-.73,x+.73])box(xx,(floor+.28+windowTop)/2,-.30,.105,windowTop-floor+.38,.25,'red');
    box(x,seat-.49,-.43,1.46,.48,.20,'wall');
   }
   emit(mouldedBeam213(bw+.36,.25,.40),'hallBeam213',0,beamY,-.01);emit(mouldedBeam213(bw+.40,.13,.43),'hallBeam213',0,seat-.05,-.02);
   for(const x of[-.875,.875]){emit(spandrel(1.43),'hallLacquer213',x,beamY-.13,.16);for(const p of mould(1.43))emit(p.g,p.ma,x,beamY-.13,.16);}box(0,beamY-.27,-.15,bw+.37,.12,.31,'wood');
   if(sign>0)peony.panel({emit,x:.875,y:beamY+.015,z:.245,width:1.43,height:.30,copies:2,label:'near-front-bay'});
  });
  for(const side of[-1,1])group(side*bw/2,0,0,side*Math.PI/2,()=>{
   const cuts=side>0?[-front,-1.80,-.40,1.00,-far]:[far,-1.00,.40,1.80,front];
   for(let j=0;j<4;j++){
    const x=(cuts[j]+cuts[j+1])/2,zz=-side*x,seat=seatAt(side*bw/2,zz),beamY=seat-1.05,windowTop=beamY-.60,windowBottom=floor+.50;
    if(side>0&&(j===1||j===3))spatial191.portal({x,z:-.42,lo:floor+.04,hi:beamY-.26,width:1.13,depth:.92,label:'grand-return-open-bay-'+j});
    else{box(x,floor+.33,-.43,1.19,.46,.20,'wood');lattice(x,(windowBottom+windowTop)/2,-.42,1.13,Math.max(.6,windowTop-windowBottom));}box(x,seat-.49,-.43,1.23,.48,.20,'wall');
    for(const xx of[x-.61,x+.61])box(xx,(floor+.28+windowTop)/2,-.30,.10,windowTop-floor+.38,.24,'red');
    emit(mouldedBeam213(1.44,.25,.40),'hallBeam213',x,beamY,0);emit(mouldedBeam213(1.44,.13,.43),'hallBeam213',x,seat-.05,-.015);emit(spandrel(1.13),'hallLacquer213',x,beamY-.13,.16);for(const p of mould(1.13))emit(p.g,p.ma,x,beamY-.13,.16);box(x,beamY-.27,-.13,1.44,.12,.31,'wood');
   }
   if(side>0){const seat=seatAt(bw/2,2.50);peony.panel({emit,x:-2.50,y:seat-1.035,z:.245,width:1.20,height:.28,copies:2,label:'near-return-bay'});}
  });
  spatial191.interior({floor,front:front-.40,back:far+.40,width:bw-.24,seat:Math.min(...caps.map(q=>q[2]))});
  for(const [x,z,seat]of caps){for(const part of fineKit.parts)emit(part.geometry,part.material,x,seat,z);}
  // Inner ring members are hidden behind the carved crossed arms, while
  // each outer carrier is seated directly below the queried roof surface.
  for(const sign of[-1,1]){
   const z=sign>0?front:far,axes=[-1.75,-.875,0,.875,1.75],pts=xs.map(x=>[x,seatAt(x,z)-.18,z]);emit(createContinuousTimber(pts,.22,.18,.008),'hallBeam213');
   const ends=[];for(const x of axes){const seat=seatAt(x,z),reach=1.20;if(!xs.includes(x)){for(const part of fineKit.parts)emit(part.geometry,part.material,x,seat,z,.62,1,.62);secondary.push([x,z,seat]);}ends.push(armAt(x,z,seat,0,sign,reach));}
   emit(createContinuousTimber(ends,.17,.21,.008),'wood');
  }
  for(const side of[-1,1]){
   const ends=[],zs=[far,...sideZ,front],all=zs.flatMap((z,i)=>i+1<zs.length?[z,(z+zs[i+1])/2]:[z]);
   for(const z of all){const x=side*bw/2,seat=seatAt(x,z);if(!zs.includes(z)){for(const part of fineKit.parts)emit(part.geometry,part.material,x,seat,z,.62,1,.62);secondary.push([x,z,seat]);}ends.push(armAt(x,z,seat,side,0,reachAt(side,z)));}
   emit(createContinuousTimber(zs.map(z=>[side*bw/2,seatAt(side*bw/2,z)-.18,z]),.22,.18,.008),'hallBeam213');
   emit(createContinuousTimber(ends,.17,.21,.008),'wood');
  }
  for(const x of[-1.45,1.45])lantern(x,seatAt(x,front)-1.13,front+.33,.38);
 });
 // Pierced three-dimensional ceramic curls and a deep circular tile end
 // replace the too-solid S-shaped trial. The curl has a round fired section;
 // overlapping solid end caps close both tube cuts, never a facing image.
 const curlPoints=[[-.11,.015,0],[-.03,.08,-.01],[.10,.17,0],[.20,.30,.005],[.16,.41,0],[.03,.42,-.005],[-.02,.34,0],[.04,.28,.012],[.10,.31,.02]],curl=new T.TubeGeometry(new T.CatmullRomCurve3(curlPoints.map(p=>new T.Vector3(...p))),72,.035,12,false),capSphere=new T.SphereGeometry(.035,16,12),disc=new T.CylinderGeometry(.135,.135,.065,48),rim=new T.TorusGeometry(.105,.012,8,48);
 curl.userData.member='171-three-dimensional-ceramic-pierced-curl';disc.userData.member='171-deep-circular-ceramic-hip-end';
 for(const [side,u,yaw]of[[0,-1,-Math.PI/4],[0,1,Math.PI/4],[2,-1,-Math.PI*3/4],[2,1,Math.PI*3/4]]){const p=roof171.point(side,1,u);group(p[0],p[1]-.02,p[2],yaw,()=>{emit(curl,'ceramictile');for(const q of[curlPoints[0],curlPoints.at(-1)])emit(capSphere,'ceramictile',...q);emit(disc,'ceramictile',0,-.09,.02,1,1,1,[Math.PI/2,0,0]);emit(rim,'tileedge',0,-.09,.068);});}
 return{revision:'scene08-pierced-moulded-bearing213-r20',frontAxes:xs,sideAxes:sideZ,secondaryBracketAxes:secondary,joinery213:fineKit.info213,shaftRadiusMetres:[.295,.273],deepWindowSetback:.42,innerReturnSetback:1.03,roofCoupling:'Actual same-scene roof-triangle XZ barycentric query, no image depth',bearingHeights:caps.map(([x,z,seat])=>({axis:[x,z],seat})),roofReceivers:contacts,columnHeadFinish:'wood capital with narrow actual inlay bands and twelve small petal plates',curvedLintelSpandrels:12,tallCantileverSpacersRetired:true,returnRibsPerStage:2,halfLappedStageSaddles:true,piercedFourLobedMetalFields:true,realLintelMouldingLayers:2,piercedSpandrelVoids:24,actualBeamCoveDepth:.014,peonyMounts:2,ceramicCornerCaps:4,visualAccepted:false};
}
