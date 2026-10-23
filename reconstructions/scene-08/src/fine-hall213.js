import * as T from 'three';
import {carvedTimber197} from './natural-joinery197.js';
import {createSteppedReceiver213} from './garden-joinery213.js';

// A lower, wider ridge and a shorter rising return belong to one physical
// four-panel roof. The reference camera is not used to form this surface.
export function createGrandRoofProfile213({frame,w,d,eave,rise,curl,ridgeRatio}){
 const hw=w/2,hd=d/2,rh=w*ridgeRatio,peak=eave+rise,c=Math.cos(frame.yaw),s=Math.sin(frame.yaw),local=([x,y,z])=>{const dx=x-frame.x,dz=z-frame.z;return new T.Vector3(c*dx-s*dz,y,s*dx+c*dz);},edge=new T.CatmullRomCurve3([new T.Vector3(hw,eave,hd),local([.08,9.46,-4.95]),local([1.18,8.93,-6.85]),local([2.75,8.30,-9.15])],false,'centripetal');
 const ridge=u=>[u*rh,peak+.25*Math.pow(Math.abs(u),6)-.16*(1-u*u),0];
 function point(side,t,u){const far=edge.getPoint(1);let boundary,top;
  if(side===0){boundary=new T.Vector3(u*hw,eave+.40*(1-u)/2-.09*(1-u*u),hd);top=new T.Vector3(...ridge(u));}
  else if(side===1){boundary=edge.getPoint((1-u)/2);top=new T.Vector3(...ridge(1));}
  else if(side===2){const f=(u+1)/2;boundary=new T.Vector3(-hw+(far.x+hw)*f,eave+(far.y-eave)*f,-hd+(far.z+hd)*f);top=new T.Vector3(...ridge(u));}
  else{boundary=new T.Vector3(-hw,eave+.40*(u+1)/2-.09*(1-u*u),u*hd);top=new T.Vector3(...ridge(-1));}
  const p=top.clone().lerp(boundary,t);p.y=boundary.y+(top.y-boundary.y)*Math.pow(Math.max(0,1-t),1.65)+curl*Math.pow(t,10)*(.18+.82*Math.pow(Math.abs(u),7));return p.toArray();
 }
 return{point,ridge,info:{revision:'scene08-broad-cambered-ridge-short-return213-r05',ridgeSpan:rh*2,returnWorldAnchors:[[.08,9.46,-4.95],[1.18,8.93,-6.85],[2.75,8.30,-9.15]],referencePixelsUsed:false,visualAccepted:false}};
}

// Thin real timber with a curved waist and squared bearing nose. This is
// carved solid geometry, replacing the old 350mm-deep flying blocks.
const armCache=new Map();
export function createFineCantilever213(length,rise=.015,depth=.18){
 const key=[length,rise,depth].map(v=>v.toFixed(4)).join(',');if(armCache.has(key))return armCache.get(key);
 const L=length,R=rise,nose=Math.min(.11,L*.26),q=new T.Shape();q.moveTo(-.12,.065);q.lineTo(L,R+.065);q.lineTo(L,R-.020);q.lineTo(L-.025,R-.020);q.lineTo(L-.025,R-.042);q.bezierCurveTo(L-nose,R-.045,L*.65,R*.65-.080,L*.48,R*.48-.085);q.bezierCurveTo(L*.20,-.085,0,-.075,-.12,-.075);q.closePath();
 const actualDepth=depth*.85,g=carvedTimber197(q,actualDepth,[[[L-.055,R+.012],[L*.64,R*.64-.035],[.04,-.042]]],'scene08-213-fine-waisted-carved-bearing-arm');g.scale(1,.72,1);g.userData.fineHall213=true;g.userData.fineProfile213={points:q.getPoints(32).map(p=>[p.x,p.y*.72]),depth:actualDepth};armCache.set(key,g);return g;
}

// Cast cut-end shoes follow the very same two-dimensional timber profile.
// Re-extruding that clipped outline avoids clipping Steiner microtriangles.
export function createFineArmEnd213(source,sign=1){
 const {points,depth}=source.userData.fineProfile213,ring=points.slice(0,-1).map(p=>new T.Vector2(...p)),lo=Math.min(...ring.map(p=>p.x)),hi=Math.max(...ring.map(p=>p.x)),cut=sign>0?hi-.105:lo+.105,poly=[];
 for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],fa=sign*(a.x-cut),fb=sign*(b.x-cut);if(fa>=0)poly.push(a.clone());if((fa>=0)!==(fb>=0))poly.push(a.clone().lerp(b,fa/(fa-fb)));}
 const ymin=Math.min(...poly.map(p=>p.y)),ymax=Math.max(...poly.map(p=>p.y)),cy=(ymin+ymax)/2,q=new T.Shape();poly.forEach((p,i)=>{const x=p.x+sign*.003,y=cy+(p.y-cy)*1.055;i?q.lineTo(x,y):q.moveTo(x,y);});q.closePath();const g=new T.ExtrudeGeometry(q,{depth:depth*1.045,steps:1,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:1,curveSegments:1});g.translate(0,0,-depth*1.045/2);g.name='scene08-213-profile-fitted-solid-cast-end';g.userData={sameAuthoredTimberOutline:true,sign,cut,closedExtrudedShoe:true};return g;
}

// The part indices retain the six crossed-arm slots used by actual fitted
// cast end sleeves. The new kit has a 1.05m envelope and a .49m upper plane.
export function createFineHallJoinery213(){
 const parts=[],resources=new Set(),add=(g,material='red',p=[0,0,0],yaw=0)=>{const q=g.clone();q.rotateY(yaw);q.translate(...p);parts.push({geometry:q,material});resources.add(q);return q;},block=(w,h,d)=>createSteppedReceiver213(w,h,d,.70);
 const crossArm=(span,depth,notch='none')=>{const h=span/2,q=new T.Shape();q.moveTo(-h,.065);if(notch==='top'){q.lineTo(-.09,.065);q.lineTo(-.09,-.005);q.lineTo(.09,-.005);q.lineTo(.09,.065);}q.lineTo(h,.065);q.lineTo(h,-.020);q.lineTo(h-.035,-.020);q.bezierCurveTo(h-.13,-.025,h-.16,-.085,.09,-.090);if(notch==='bottom'){q.lineTo(.09,-.005);q.lineTo(-.09,-.005);q.lineTo(-.09,-.090);}else q.lineTo(-.09,-.090);q.bezierCurveTo(-h+.16,-.085,-h+.13,-.025,-h+.035,-.020);q.lineTo(-h,-.020);q.closePath();const g=carvedTimber197(q,depth,[[[-h+.055,.012],[-h*.50,-.035],[0,-.048]],[[h-.055,.012],[h*.50,-.035],[0,-.048]]],'scene08-213-fine-half-lapped-cross-arm');g.scale(1,.80,1);g.userData.fineProfile213={points:q.getPoints(32).map(p=>[p.x,p.y*.80]),depth};return g;};
 add(block(.56,.14,.56),'red',[0,-.14,0]);
 add(crossArm(.88,.16,'top'),'red',[0,.055,0]);add(crossArm(.88,.16,'bottom'),'red',[0,.055,0],Math.PI/2);
 for(const side of[-1,1]){add(block(.17,.12,.17),'red',[side*.26,.105,0]);add(block(.17,.12,.17),'red',[0,.105,side*.26]);}
 const upper=crossArm(.96,.15);for(const side of[-1,1]){add(upper,'red',[side*.26,.24,0],Math.PI/2);add(upper,'red',[0,.24,side*.26]);}
 for(const x of[-.26,.26])for(const z of[-.26,.26])add(block(.15,.10,.15),'red',[x,.29,z]);
 const cap=new T.BoxGeometry(1.05,.12,.15,3,1,1);for(const z of[-.26,.26])add(cap,'red',[0,.43,z]);add(new T.BoxGeometry(.15,.12,.78,1,1,3),'wood',[0,.43,0]);
 for(const i of[1,2,7,8,9,10]){const wood=parts[i].geometry,raw=i<3?crossArm(.88,.16,i===1?'top':'bottom'):upper,p=i<3?[0,.055,0]:i===7?[-.26,.24,0]:i===8?[0,.24,-.26]:i===9?[.26,.24,0]:[0,.24,.26],yaw=i===2||i===7||i===9?Math.PI/2:0;for(const sign of[-1,1])add(createFineArmEnd213(raw,sign),'finegilt213',p,yaw);}
 return{parts,resources,info213:{revision:'scene08-thin-dense-crossed-dou213-r06',envelopeWidth:1.05,lowerBase:-.14,upperPlane:.49,fineArmThickness:.124,physicalCarvedWaists:true,visualAccepted:false}};
}
