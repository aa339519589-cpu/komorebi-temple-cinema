import * as T from 'three';
import {createContinuousTimber} from './gallery-joinery.js';
// Complete broad-shaft frame. Bearing endpoints are queried from the same
// authored roof triangles, so the curved cantilevers meet its real underside.
export function buildGrandBearing171({emit,box,between,group,lantern,lattice,galleryJoinery,grandFrame,peony,roof171}){
 const floor=grandFrame.floor,cap=grandFrame.lintel,bw=3.50,front=3.20,far=-2.40,bd=front-far,xs=[-1.75,0,1.75],sideZ=[-1.00,.40,1.80],caps=[],contacts=[];
 const weather=(x,z)=>roof171.surfaceY(x-.40,z-.40);
 function availableReach(x,z,dx,dz,wanted){for(let q=wanted;q>.06;q-=.075)if(weather(x+dx*q,z+dz*q)!==null)return q;return 0;}
 function reachAt(side,z){return availableReach(side*bw/2,z,side,0,side>0?2.40:1.90);}
 function seatAt(x,z){const side=Math.sign(x)||1,reach=reachAt(side,z),outer=weather(side*(bw/2+reach),z),direction=Math.abs(z-front)<.01?1:Math.abs(z-far)<.01?-1:0,q=direction?availableReach(x,z,0,direction,1.20):0,near=direction?weather(x,z+direction*q):null;return Math.min(cap,(outer??weather(x,z)??(cap+1.10))-.94,(near??(cap+1.10))-.94);}
 function shaft(x,z,r){
  const seat=seatAt(x,z),bottom=floor+.22,top=seat-.14,h=top-bottom,profile=[[0,0],[r*.98,0],[r,.10*h],[r*1.035,.38*h],[r*1.02,.62*h],[r*.96,.90*h],[r*.94,h],[0,h]],g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),40),p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++)uv.setXY(i,p.getY(i)/1.6,Math.atan2(p.getZ(i),p.getX(i))*r/.55);g.userData.member='171-entasis-turned-timber-shaft';
  emit(g,'red',x,bottom,z);emit(new T.CylinderGeometry(r*1.36,r*1.48,.20,32),'hallFoundation',x,floor+.10,z);box(x,seat-.095,z,r*2.38,.17,r*2.38,'wood');caps.push([x,z,seat]);
 }
 function cloudArm(length,rise,depth=.34){
  const s=new T.Shape(),L=length,R=rise;
  s.moveTo(-.22,.13);s.lineTo(.08,.13);s.lineTo(L*.35,R*.35+.13);s.lineTo(L*.73,R*.73+.13);s.lineTo(L,R+.13);
  s.bezierCurveTo(L+.055,R+.02,L-.05,R-.17,L-.18,R-.155);
  s.bezierCurveTo(L-.34,R-.11,L*.66,R*.66-.33,L*.50,R*.50-.27);
  s.quadraticCurveTo(L*.22,R*.22-.10,.055,-.205);s.lineTo(-.22,-.13);s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.013,bevelThickness:.010,bevelSegments:3,curveSegments:20});g.translate(0,0,-depth/2);g.userData.member='171-closed-deep-carved-cantilever';return g;
 }
 function armAt(x,z,seat,dx,dz,wanted){
  const reach=availableReach(x,z,dx,dz,wanted),endX=x+dx*reach,endZ=z+dz*reach,weatherY=weather(endX,endZ),target=(weatherY??(seat+1.08))-.25,yaw=Math.atan2(-dz,dx);
  for(let level=0;level<3;level++){
   const start=level*reach/3,length=reach/3+(level<2?.09:0),y=seat+.10+(target-seat-.10)*level/2;
   emit(cloudArm(Math.max(.18,length),.025,.37-level*.035),'red',x+dx*start,y,z+dz*start,1,1,1,[0,yaw,0]);
   const q=start+length*.60,cross=Math.min(.72,.42+reach*.12),px=-dz,pz=dx;
   emit(cloudArm(cross,.02,.23),'redlight',x+dx*q-px*cross*.5,y+.105,z+dz*q-pz*cross*.5,1,1,1,[0,yaw+Math.PI/2,0]);
   if(level){const h=(target-seat-.10)/2-.025;box(x+dx*start,y-h/2-.035,z+dz*start,.31,Math.max(.14,h),.39,'wood');}
  }
  box(endX,target+.045,endZ,.31,.19,.40,'wood');contacts.push({shaft:[x,seat,z],roofReceiver:[endX,target+.14,endZ],actualWeatherY:weatherY});return[endX,target-.02,endZ];
 }
 group(-.40,0,-.40,0,()=>{
  box(0,floor-.20,(front+far)/2,bw+.56,.28,bd+.48,'hallFoundation');box(0,floor-.035,(front+far)/2,bw+.44,.10,bd+.40,'wood');
  for(let i=0;i<22;i++)box(-1.94+i*.185,floor+.026,(front+far)/2,.174,.025,bd+.27,'wood');
  for(const z of[far,front])for(const x of xs){box(x,(floor-.08)/2,z,.42,floor-.08,.42,'hallFoundation');shaft(x,z,.295);}
  for(const side of[-1,1])for(const z of sideZ){box(side*bw/2,(floor-.08)/2,z,.40,floor-.08,.40,'hallFoundation');shaft(side*bw/2,z,.273);}
  for(const sign of[-1,1])group(0,0,sign>0?front:far,sign<0?Math.PI:0,()=>{
   const seat=Math.min(...xs.map(x=>seatAt(x,sign>0?front:far))),beamY=seat-1.05,windowTop=beamY-.60,windowBottom=floor+.50;
   for(const x of[-.875,.875]){
    box(x,floor+.34,-.46,1.43,.48,.22,'wood');lattice(x,(windowBottom+windowTop)/2,-.42,1.37,windowTop-windowBottom);
    for(const xx of[x-.73,x+.73])box(xx,(floor+.28+windowTop)/2,-.30,.105,windowTop-floor+.38,.25,'red');
    box(x,seat-.49,-.43,1.46,.48,.20,'wall');
   }
   box(0,beamY,-.01,bw+.36,.39,.47,'red');box(0,seat-.05,-.02,bw+.40,.31,.53,'redlight');box(0,beamY-.27,-.15,bw+.37,.12,.31,'wood');
   if(sign>0)peony.panel({emit,x:.875,y:beamY+.015,z:.245,width:1.43,height:.30,copies:2,label:'near-front-bay'});
  });
  for(const side of[-1,1])group(side*bw/2,0,0,side*Math.PI/2,()=>{
   const cuts=side>0?[-front,-1.80,-.40,1.00,-far]:[far,-1.00,.40,1.80,front];
   for(let j=0;j<4;j++){
    const x=(cuts[j]+cuts[j+1])/2,zz=-side*x,seat=seatAt(side*bw/2,zz),beamY=seat-1.05,windowTop=beamY-.60,windowBottom=floor+.50;
    box(x,floor+.33,-.43,1.19,.46,.20,'wood');lattice(x,(windowBottom+windowTop)/2,-.42,1.13,Math.max(.6,windowTop-windowBottom));box(x,seat-.49,-.43,1.23,.48,.20,'wall');
    for(const xx of[x-.61,x+.61])box(xx,(floor+.28+windowTop)/2,-.30,.10,windowTop-floor+.38,.24,'red');
    box(x,beamY,0,1.44,.39,.47,'red');box(x,seat-.05,-.015,1.44,.31,.53,'redlight');box(x,beamY-.27,-.13,1.44,.12,.31,'wood');
   }
   if(side>0){const seat=seatAt(bw/2,2.50);peony.panel({emit,x:-2.50,y:seat-1.035,z:.245,width:1.20,height:.28,copies:2,label:'near-return-bay'});}
  });
  for(let bay=0;bay<4;bay++){
   const z=-1.7+bay*1.4,seat=seatAt(bw/2,z),h=Math.max(2.0,seat-floor-1.3);box(.72,floor+h/2+.18,z,.18,h,1.23,'dark');group(.84,0,z,Math.PI/2,()=>lattice(0,floor+h/2+.23,0,1.10,h-.18));
   box(.35,seat-.68,z,2.55,.19,.24,'wood');for(let j=0;j<5;j++)box(.35,seat-.57,z-.57+j*.28,2.55,.065,.17,'wood');
  }
  for(const [x,z,seat]of caps)for(const part of galleryJoinery.parts)emit(part.geometry,part.material,x,seat-.03,z,.88,.62,.88);
  // Inner ring members are hidden behind the carved crossed arms, while
  // each outer carrier is seated directly below the queried roof surface.
  for(const sign of[-1,1]){
   const z=sign>0?front:far,pts=xs.map(x=>[x,seatAt(x,z)+.15,z]);emit(createContinuousTimber(pts,.29,.32,.012),'red');
   const ends=[];for(const x of xs){const seat=seatAt(x,z),reach=1.20;ends.push(armAt(x,z,seat,0,sign,reach));}
   emit(createContinuousTimber(ends,.25,.32,.014),'wood');
  }
  for(const side of[-1,1]){
   const ends=[],zs=[far,...sideZ,front];
   for(const z of zs){const x=side*bw/2,seat=seatAt(x,z);ends.push(armAt(x,z,seat,side,0,reachAt(side,z)));}
   emit(createContinuousTimber(zs.map(z=>[side*bw/2,seatAt(side*bw/2,z)+.15,z]),.29,.32,.012),'red');
   emit(createContinuousTimber(ends,.25,.32,.014),'wood');
  }
  for(const x of[-1.45,1.45])lantern(x,seatAt(x,front)-1.13,front+.33,.38);
 });
 // Pierced three-dimensional ceramic curls and a deep circular tile end
 // replace the too-solid S-shaped trial. The curl has a round fired section;
 // overlapping solid end caps close both tube cuts, never a facing image.
 const curlPoints=[[-.15,.015,0],[-.06,.09,-.01],[.15,.19,0],[.24,.37,.005],[.14,.52,0],[-.025,.47,-.005],[-.045,.34,0],[.065,.29,.012],[.14,.35,.02]],curl=new T.TubeGeometry(new T.CatmullRomCurve3(curlPoints.map(p=>new T.Vector3(...p))),72,.057,12,false),capSphere=new T.SphereGeometry(.057,16,12),disc=new T.CylinderGeometry(.17,.17,.075,48),rim=new T.TorusGeometry(.137,.017,8,48);
 curl.userData.member='171-three-dimensional-ceramic-pierced-curl';disc.userData.member='171-deep-circular-ceramic-hip-end';
 for(const [side,u,yaw]of[[0,-1,-Math.PI/4],[0,1,Math.PI/4],[2,-1,-Math.PI*3/4],[2,1,Math.PI*3/4]]){const p=roof171.point(side,1,u);group(p[0],p[1]-.02,p[2],yaw,()=>{emit(curl,'ceramictile');for(const q of[curlPoints[0],curlPoints.at(-1)])emit(capSphere,'ceramictile',...q);emit(disc,'ceramictile',0,-.09,.02,1,1,1,[Math.PI/2,0,0]);emit(rim,'tileedge',0,-.09,.068);});}
 return{revision:'scene08-seated-pierced-roof-bearing171-r06',frontAxes:xs,sideAxes:sideZ,shaftRadiusMetres:[.295,.273],deepWindowSetback:.42,innerReturnSetback:1.03,roofCoupling:'Actual same-scene roof-triangle XZ barycentric query, no image depth',bearingHeights:caps.map(([x,z,seat])=>({axis:[x,z],seat})),roofReceivers:contacts,peonyMounts:2,ceramicCornerCaps:4,visualAccepted:false};
}
