import * as T from 'three';
import {carvedTimber197} from './natural-joinery197.js';
import {createSteppedReceiver213} from './garden-joinery213.js';
import {createContinuousTimber} from './gallery-joinery.js';

const arms=new Map(),capitals=new Map();
// Closed timber profiles have two successive curved shoulders and a real
// incised cove. The silhouette and load path are geometry, not normal art.
export function cloudCross213(span=.84,depth=.13,notch='none'){
 const key=['cross',span,depth,notch].join(',');if(arms.has(key))return arms.get(key);
 const h=span/2,neck=h*.18,q=new T.Shape();q.moveTo(-h,.075);
 if(notch==='top'){q.lineTo(-neck,.075);q.lineTo(-neck,-.035);q.lineTo(neck,-.035);q.lineTo(neck,.075);}q.lineTo(h,.075);q.lineTo(h,.015);q.lineTo(h*.93,.015);
 q.bezierCurveTo(h*.88,.010,h*.84,-.045,h*.72,-.060);q.bezierCurveTo(h*.62,-.095,h*.50,-.055,h*.36,-.090);q.bezierCurveTo(h*.25,-.11,h*.24,-.17,neck,-.18);
 if(notch==='bottom'){q.lineTo(neck,-.035);q.lineTo(-neck,-.035);q.lineTo(-neck,-.18);}else q.lineTo(-neck,-.18);
 q.bezierCurveTo(-h*.24,-.17,-h*.25,-.11,-h*.36,-.09);q.bezierCurveTo(-h*.50,-.055,-h*.62,-.095,-h*.72,-.060);q.bezierCurveTo(-h*.84,-.045,-h*.88,.010,-h*.93,.015);q.lineTo(-h,.015);q.closePath();
 const paths=[-1,1].map(s=>[[s*(h-.04),.035],[s*(h-.095),-.026],[s*h*.48,-.035],[s*.115,-.115]]),g=carvedTimber197(q,depth,paths,'scene08-213-cloud-shoulder-crossed-arm');g.userData.profile213={points:q.getPoints(24).map(p=>p.toArray()),depth};arms.set(key,g);return g;
}

export function risingCloud213(length,rise,depth=.135,kind='primary'){
 const key=['rising',length.toFixed(4),rise.toFixed(4),depth.toFixed(4),kind].join(',');if(arms.has(key))return arms.get(key);
 const L=length,R=rise,q=new T.Shape();q.moveTo(-.095,.065);q.bezierCurveTo(L*.28,R*.10+.065,L*.70,R*.88+.065,L,R+.065);q.lineTo(L,R-.018);q.lineTo(L*.95,R-.018);
 q.bezierCurveTo(L*.90,R-.02,L*.88,R-.078,L*.76,R-.092);q.bezierCurveTo(L*.59,R*.68-.14,L*.42,R*.32-.13,L*.23,R*.10-.13);q.bezierCurveTo(.03,-.12,-.055,-.125,-.095,-.085);q.closePath();
 const path=[[-.015,-.018],[L*.30,R*.16-.040],[L*.62,R*.68-.045],[L-.055,R+.014]],g=carvedTimber197(q,depth,[path],'scene08-213-continuous-rising-cloud-bearing');g.userData.profile213={points:q.getPoints(24).map(p=>p.toArray()),depth};g.userData.risingCloud213={length,rise,depth,kind,startTop:.065,endTop:R+.065};arms.set(key,g);return g;
}

// Only a 40 mm profiled terminal field is gilded; it is not a whole pale
// timber sleeve. Two 3 mm closed metal plates sit on the actual broad faces.
export function terminalInlay213(source,sign=1){
 const {points,depth}=source.userData.profile213,ring=points.map(p=>new T.Vector2(...p));if(ring[0].distanceTo(ring.at(-1))<1e-7)ring.pop();
 const edge=sign>0?Math.max(...ring.map(p=>p.x)):Math.min(...ring.map(p=>p.x)),cut=edge-sign*.040,poly=[];
 for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],fa=sign*(a.x-cut),fb=sign*(b.x-cut);if(fa>=0)poly.push(a.clone());if((fa>=0)!==(fb>=0))poly.push(a.clone().lerp(b,fa/(fa-fb)));}
 const cy=(Math.min(...poly.map(p=>p.y))+Math.max(...poly.map(p=>p.y)))/2,cx=edge-sign*.021,rx=.0155,ry=Math.min(.030,(Math.max(...poly.map(p=>p.y))-Math.min(...poly.map(p=>p.y)))*.30),shape=new T.Shape();
 for(let i=0;i<=64;i++){const a=i/64*Math.PI*2,r=1+.16*Math.cos(a*4),x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r;i?shape.lineTo(x,y):shape.moveTo(x,y);}shape.closePath();const hole=new T.Path();hole.absellipse(cx,cy,rx*.46,ry*.48,0,Math.PI*2,true);shape.holes.push(hole);
 return[-1,1].map(side=>{const g=new T.ExtrudeGeometry(shape,{depth:.003,steps:1,bevelEnabled:true,bevelSize:.0006,bevelThickness:.0006,bevelSegments:1,curveSegments:16});g.translate(0,0,side>0?depth/2+.001:-depth/2-.004);g.name='scene08-213-pierced-four-lobed-gilt-inlay';g.userData.closedTerminalInlay213=true;return g;});
}

export function createOrnateHead213(){
 const parts=[],resources=new Set(),add=(g,ma,p=[0,0,0],yaw=0)=>{const q=g.clone();q.rotateY(yaw);q.translate(...p);resources.add(q);parts.push({geometry:q,material:ma});},block=(w,h,d)=>createSteppedReceiver213(w,h,d,.68);
 add(block(.49,.11,.49),'hallBeam213',[0,-.14,0]);
 for(const yaw of[0,Math.PI/2]){const g=cloudCross213(.84,.13,yaw?'bottom':'top');add(g,'hallArm213',[0,.045,0],yaw);for(const sign of[-1,1])for(const inlay of terminalInlay213(g,sign))add(inlay,'hallInlay213',[0,.045,0],yaw);}
 for(const sign of[-1,1]){add(block(.135,.10,.135),'hallReceiver213',[sign*.245,.10,0]);add(block(.135,.10,.135),'hallReceiver213',[0,.10,sign*.245]);}
 const upper=cloudCross213(.68,.115);
 for(const sign of[-1,1])for(const [p,yaw]of[[[sign*.245,.285,0],Math.PI/2],[[0,.285,sign*.245],0]]){add(upper,'hallArm213',p,yaw);for(const end of[-1,1])for(const inlay of terminalInlay213(upper,end))add(inlay,'hallInlay213',p,yaw);}
 for(const x of[-.245,.245])for(const z of[-.245,.245])add(block(.125,.09,.125),'hallReceiver213',[x,.35,z]);
 for(const z of[-.245,.245])add(new T.BoxGeometry(.94,.10,.125),'hallBeam213',[0,.49,z]);
 add(new T.BoxGeometry(.125,.10,.72),'hallBeam213',[0,.49,0]);
 return{parts,resources,info213:{revision:'scene08-interlocked-pierced-inlay-head213-r19',envelopeWidth:.94,lowerBase:-.14,upperPlane:.54,physicalCurvedShoulders:true,terminalGiltWidthMetres:.040,piercedMetalFields:true,fullPaleSleevesRetired:true,visualAccepted:false}};
}

export function capitalHead213(r=.295){
 if(capitals.has(r))return capitals.get(r);const parts=[],profile=[[0,-.17],[r*.97,-.17],[r*1.01,-.13],[r*1.035,-.075],[r*1.15,-.015],[r*1.23,.040],[r*1.24,.080],[r*1.18,.105],[0,.105]],body=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),48);parts.push({g:body,ma:'hallLacquer213',p:[0,0,0],rot:[0,0,0]});
 for(const y of[-.135,.065])parts.push({g:new T.TorusGeometry(r*(y>0?1.22:1.01),.008,8,48),ma:'hallInlay213',p:[0,y,0],rot:[Math.PI/2,0,0]});
 const petal=new T.Shape();petal.moveTo(0,0);petal.bezierCurveTo(-.023,.025,-.030,.065,0,.100);petal.bezierCurveTo(.030,.065,.023,.025,0,0);petal.closePath();const leaf=new T.ExtrudeGeometry(petal,{depth:.004,steps:1,curveSegments:12,bevelEnabled:true,bevelSize:.001,bevelThickness:.001,bevelSegments:1});leaf.translate(0,0,-.002);
 for(let j=0;j<12;j++){const a=j*Math.PI/6;parts.push({g:leaf,ma:'hallInlay213',p:[Math.sin(a)*r*1.075,-.095,Math.cos(a)*r*1.075],rot:[0,a,0]});}
 capitals.set(r,parts);return parts;
}

export function lintelSpandrel213(width=1.43,depth=.14){
 const h=width/2,q=new T.Shape();q.moveTo(-h,.06);q.lineTo(h,.06);q.lineTo(h,-.23);q.bezierCurveTo(h*.74,-.235,h*.70,-.11,h*.47,-.105);q.bezierCurveTo(h*.24,-.09,h*.19,-.045,0,-.055);q.bezierCurveTo(-h*.19,-.045,-h*.24,-.09,-h*.47,-.105);q.bezierCurveTo(-h*.70,-.11,-h*.74,-.235,-h,-.23);q.closePath();
 for(const sign of[-1,1]){const cx=sign*h*.72,cy=-.030,hole=new T.Path();hole.moveTo(cx,cy-.041);hole.bezierCurveTo(cx-.041,cy-.027,cx-.041,cy+.024,cx,cy+.048);hole.bezierCurveTo(cx+.041,cy+.024,cx+.041,cy-.027,cx,cy-.041);hole.closePath();q.holes.push(hole);}
 const g=new T.ExtrudeGeometry(q,{depth:depth-.008,steps:1,curveSegments:24,bevelEnabled:true,bevelSize:.003,bevelThickness:.004,bevelSegments:2});g.translate(0,0,-depth/2+.004);g.name='scene08-213-closed-pierced-lintel-spandrel';g.userData={closedCarvedTimber197:true,closedPiercedTimber213:true,piercedLeafVoids:2,lintelProfile213:{lower:q.getPoints(24).slice(2,-1).map(p=>p.toArray()),depth}};return g;
}

export function lintelMouldings213(source){
 const{lower,depth}=source.userData.lintelProfile213;
 return[[.022,.022,depth/2+.001,'hallBeam213'],[.010,.010,depth/2+.014,'hallInlay213']].map(([w,h,z,ma])=>{const g=createContinuousTimber(lower.map(([x,y])=>[x,y,z]),w,h,.002);g.name='scene08-213-closed-carved-lintel-border';g.userData.closedMould213=true;return{g,ma};});
}

// A genuine moulded section, including two 14 mm longitudinal recesses,
// replaces plain box faces. End and side UVs stay in physical metre units.
const beamCache=new Map();
export function mouldedBeam213(width,height=.25,depth=.40){
 const key=[width,height,depth].join(',');if(beamCache.has(key))return beamCache.get(key);
 const d=depth/2,h=height/2,c=.012,profile=[[-d+c,-h],[d-c,-h],[d,-h+c],[d,-height*.32],[d-.014,-height*.24],[d-.014,height*.20],[d,height*.28],[d,h-c],[d-c,h],[-d+c,h],[-d,h-c],[-d,height*.28],[-d+.014,height*.20],[-d+.014,-height*.24],[-d,-height*.32],[-d,-h+c]],q=new T.Shape();profile.forEach(([x,y],i)=>i?q.lineTo(x,y):q.moveTo(x,y));q.closePath();
 const g=new T.ExtrudeGeometry(q,{depth:width,steps:1,curveSegments:1,bevelEnabled:true,bevelSize:.0025,bevelThickness:.003,bevelSegments:2});g.translate(0,0,-width/2);g.rotateY(Math.PI/2);
 const p=g.attributes.position,n=g.attributes.normal,uv=[];for(let i=0;i<p.count;i++){const a=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],face=a.indexOf(Math.max(...a));uv.push(face===0?p.getZ(i):p.getX(i),face===1?p.getZ(i):p.getY(i));}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.name='scene08-213-closed-recessed-structural-crossbeam';g.userData={authoredClosedMouldedBeam213:true,actualLongitudinalRecessDepth:.014,physicalMetreUVs:true};beamCache.set(key,g);return g;
}
