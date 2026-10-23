import * as T from 'three';
import {HALL_ENVELOPE143 as H,roofBearing143} from './hall-envelope143.js';

// Original solid architectural reconstruction. All bearings are expressed in
// metres in the same building frame as the ceramic roof. No image is sampled.
export const MASS181_REVISION='scene09-occupied-hall-and-carried-pagoda181-r04';

export function continuousTimber181(points,width,height,bevel=.014){
 const p=[],uv=[],ix=[],w=width/2,h=height/2,c=Math.min(bevel,w*.24,h*.24),profile=[[-w+c,-h],[w-c,-h],[w,-h+c],[w,h-c],[w-c,h],[-w+c,h],[-w,h-c],[-w,-h+c]],frames=[];
 let distance=0;
 for(let i=0;i<points.length;i++){
  const q=new T.Vector3(...points[i]),before=new T.Vector3(...points[Math.max(0,i-1)]),after=new T.Vector3(...points[Math.min(points.length-1,i+1)]),t=after.sub(before).normalize(),side=new T.Vector3(t.z,0,-t.x).normalize(),up=new T.Vector3().crossVectors(t,side).normalize();
  if(i)distance+=q.distanceTo(frames.at(-1).q);frames.push({q,t,side,up,distance});
  for(const [a,b]of profile){p.push(...q.clone().addScaledVector(side,a).addScaledVector(up,b).toArray());uv.push(distance,a+b);}
 }
 for(let j=0;j<frames.length-1;j++)for(let i=0;i<8;i++){const k=(i+1)%8,a=j*8+i,b=j*8+k,d=(j+1)*8+i,e=(j+1)*8+k;ix.push(a,d,b,b,d,e);}
 const a=p.length/3;p.push(...frames[0].q.toArray(),...frames.at(-1).q.toArray());uv.push(0,0,distance,0);
 for(let i=0;i<8;i++){const j=(i+1)%8;ix.push(a,i,j,a+1,(frames.length-1)*8+j,(frames.length-1)*8+i);}
 for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 const g=new T.BufferGeometry();g.name='scene09-181-closed-chamfered-continuous-timber';g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}

export function cloudCarrier181(length,rise,depth=.38){
 const L=length,R=rise,s=new T.Shape();s.moveTo(-.22,.16);s.lineTo(.10,.16);s.bezierCurveTo(L*.33,R*.27+.16,L*.70,R*.83+.16,L,R+.16);s.lineTo(L+.025,R-.025);s.bezierCurveTo(L-.12,R-.13,L-.20,R-.22,L-.35,R-.20);s.bezierCurveTo(L*.52,R*.49-.18,L*.24,R*.22-.38,.06,-.22);s.lineTo(-.22,-.15);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:depth-.024,steps:1,curveSegments:22,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:3});g.translate(0,0,-depth/2+.012);g.name='scene09-181-closed-curved-cantilever';return g;
}

export function createMassCarpentry181(api,C){
 const {emit,box,between,group,materials:M}=api,contacts=[];
 const sweep=(points,w,h,m=M.wood)=>emit(continuousTimber181(points,w,h),m);
 function transfer(a,b,y,z,h=.44,d=.66){
  const points=Array.from({length:25},(_,i)=>{const u=i/24;return[a+(b-a)*u,y+.07*Math.sin(Math.PI*u),z];});sweep(points,d,h,M.red);
  sweep(points.map(p=>[p[0],p[1]-.17,p[2]+d*.37]),.12,.15,M.wood);
  C.frieze(a+.10,b-.10,y+.005,z+d*.51,h*.62,M.carvedTimber);
 }
 function capital(x,z,base,top,scale=1,depth=1.30){
  const height=Math.max(.22,top-base);C.capital(x,base,z,scale,depth,height/1.37);contacts.push({kind:'crossed-capital',axis:[x,z],shaftTop:base,roofBearing:top,capitalHeight:height});
 }
 function carry(x,z,base,dx,dz,reach,upper){
  const end=[x+dx*reach,z+dz*reach],top=roofBearing143(...end,upper),start=Math.min(base+.23,top-.08),yaw=Math.atan2(-dz,dx);
  for(const lateral of[-.19,.19]){
   const px=-dz*lateral,pz=dx*lateral;
   emit(cloudCarrier181(reach,top-start,.31),M.wood,x+px,start,z+pz,1,1,1,[0,yaw,0]);
  }
  // Two staggered transverse arms and solid cushions transfer force into
  // the paired tails; their end blocks touch the queried roof receiver.
  for(const u of[.37,.72]){
   const q=[x+dx*reach*u,start+(top-start)*u,z+dz*reach*u];
   between([q[0]-dz*.52,q[1]+.11,q[2]+dx*.52],[q[0]+dz*.52,q[1]+.11,q[2]-dx*.52],.18,.25,M.red);
   box(q[0],q[1]+.24,q[2],.30,.18,.32,M.wood);
  }
  box(end[0],top+.08,end[1],.43,.16,.43,M.wood);contacts.push({kind:'paired-cantilever',from:[x,start,z],to:[end[0],top+.16,end[1]],upper});
  return[end[0],top+.08,end[1]];
 }
 return{sweep,transfer,capital,carry,contacts};
}

export function buildNightHallMass181(api,C){
 const {emit,box,between,group,post,lantern,materials:M}=api,K=createMassCarpentry181(api,C),floor=H.floor,lower=[-9.40,-6.40,-3.20,0,3.20,6.40,9.40],upper=[-8.35,-5.57,-2.78,0,2.78,5.57,8.35],front=4.80,rear=-4.50,shaftTop=7.10,gallery=8.66,upperTop=10.04;
 box(0,1.25,0,21,3.5,12,M.cutStoneDark);box(0,3.02,0,21.2,.14,12.2,M.cutStone);
 box(0,floor+.035,.4,19.7,.08,10.8,M.dark);
 for(let i=0;i<73;i++)box(-9.75+i*.27,floor+.085,.4,.257,.045,10.62,M.wood);
 for(const z of[front,rear]){
  const ends=[];
  for(const x of lower){
   post(x,z,floor,shaftTop-floor-.30,.315,M.red);K.capital(x,z,shaftTop,roofBearing143(x,z,false),.98,1.38);
   ends.push(K.carry(x,z,shaftTop,0,z>0?1:-1,z>0?2.45:1.12,false));
   C.fitting(x,shaftTop-.22,z+.325,.25,.31);
  }
  K.sweep(ends,.37,.29,M.wood);
  for(let i=0;i<lower.length-1;i++){
   const a=lower[i],b=lower[i+1];K.transfer(a,b,6.97,z,.44,.68);C.bayArch(a+.10,b-.10,6.72,z+.10);
   const x=(a+b)/2;K.capital(x,z,7.24,roofBearing143(x,z,false),.64,1.33);
   between([a+.15,7.31,z],[b-.15,7.31,z],.22,.32,M.wood);
  }
 }
 // The side returns have the same storey height, full shafts and two real
 // structural planes. They are part of the occupied hall, not thin skins.
 for(const side of[-1,1]){
  const ends=[];
  for(const z of[-3.3,-.9,1.5,3.6]){
   post(side*8.28,z,floor,shaftTop-floor-.30,.295,M.red);
   group(side*8.28,0,z,side*Math.PI/2,()=>{K.capital(0,0,shaftTop,roofBearing143(side*8.28,z,false),.88,1.31);});
   ends.push(K.carry(side*8.28,z,shaftTop,side,0,1.37,false));
   box(side*8.28,7.92,z,.39,.38,.42,M.wood);
  }
  K.sweep(ends,.32,.27,M.wood);box(side*8.28,7.10,.30,.52,.44,9.4,M.red);
  for(const z of[-3.2,-.8,1.6,3.6])group(side*8.28,0,z,side*Math.PI/2,()=>C.frieze(-1.02,1.02,7.02,.34,.27));
 }
 function screen(x,z,w=.76,lo=3.27,hi=6.68){
  const y=(lo+hi)/2,h=hi-lo;box(x,y,z,w,h,.13,M.dark);box(x,y,z+.079,w-.13,h-.14,.018,M.windowPaper);
  for(const dx of[-w/2,w/2])box(x+dx,y,z+.13,.085,h+.13,.19,M.red);
  for(const yy of[lo-.025,hi+.025])box(x,yy,z+.135,w+.12,.105,.20,M.wood);
  for(let i=0;i<=5;i++)box(x-w*.40+i*w*.16,y,z+.115,.025,h-.13,.06,M.wood);
  for(let j=0;j<=12;j++)box(x,lo+.10+j*(h-.20)/12,z+.125,w-.08,.028,.065,M.bronze);
 }
 function portal(a,b,z,depth=2.5){
  const cx=(a+b)/2,w=b-a,lo=3.20,hi=6.86;
  for(const x of[a,b]){
   box(x,(lo+hi)/2,z,.27,hi-lo,.58,M.red);box(x,(lo+hi)/2,z-depth/2,.20,hi-lo,depth,M.wood);
   for(const yy of[3.40,6.57])C.fitting(x,yy,z+.32,.21,.28);
   for(const face of[-1,1])group(x+face*.112,0,z-depth/2,face*Math.PI/2,()=>{
    const pw=depth-.22,ph=hi-lo-.28;box(0,(lo+hi)/2,.015,pw,ph,.035,M.eaveDark);
    for(const dx of[-pw/2,pw/2])box(dx,(lo+hi)/2,.063,.095,ph+.07,.115,M.wood);
    for(const yy of[lo+.14,hi-.14])box(0,yy,.065,pw+.08,.10,.12,M.wood);
    for(let row=0;row<8;row++)for(const sign of[-1,1])C.flower(sign*pw*.24,lo+.39+row*(ph-.45)/7,.105,.135,M.darkGilt);
    for(const yy of[4.12,5.84])C.frieze(-pw/2+.08,pw/2-.08,yy,.09,.23,M.carvedTimber);
   });
  }
  box(cx,hi,z-depth/2,w+.25,.34,depth+.36,M.dark);K.transfer(a-.12,b+.12,6.86,z+.17,.44,.66);
  for(let i=0,n=Math.ceil(w/.29);i<=n;i++)box(a+i*w/n,6.66,z-depth/2,.095,.16,depth+.15,M.wood);
  box(cx,3.16,z-depth/2,w+.12,.14,depth+.24,M.wood);
  C.bayArch(a+.08,b-.08,6.60,z+.18);
  for(const side of[-1,1]){
   screen(side<0?a+.52:b-.52,z-.11,.70);
   group(side<0?a+.93:b-.93,0,z-.42,side*.88,()=>{
    for(const dx of[-.35,.35]){box(dx,4.99,0,.085,3.46,.16,M.wood);box(dx,4.99,.095,.027,3.42,.038,M.bronze);}
    for(const yy of[3.29,4.36,5.56,6.69])box(0,yy,.015,.78,.10,.18,M.wood);
    for(let row=0;row<9;row++){const y=3.49+row*.36;C.flower(0,y,.082,.155,M.darkGilt);for(const side of[-1,1])between([side*.02,y-.12,.02],[side*.30,y+.13,.02],.038,.062,M.wood);}
   });
  }
 }
 portal(-7.22,-3.10,1.24);portal(3.10,7.22,1.24);
 for(const [a,b]of[[-9.40,-7.32],[7.32,9.40]]){
  const cx=(a+b)/2;box(cx,4.98,1.11,b-a,3.57,.29,M.wood);box(cx,5.04,1.285,b-a-.27,3.18,.05,M.ivory);
  for(const y of[3.25,4.06,6.81])box(cx,y,1.35,b-a+.06,.14,.23,M.red);screen(cx,1.41,.77);
 }
 for(const side of[-1,1])group(side*7.13,0,-1.17,side*Math.PI/2,()=>{portal(-4.10,-.20,.05,1.65);portal(.20,4.10,.05,1.65);});
 box(0,5.02,-4.45,18.70,3.81,.28,M.dark);
 // Actual rear framed furnishings occupy the deep open room. Small gilt
 // fields stay recessed, with broad timber separating independent bays.
 for(const [cx,w]of[[-5.17,3.12],[5.17,3.12],[-1.10,4.50]]){
  box(cx,4.99,-.04,w,3.62,.18,M.dark);
  for(const dx of[-w/2,0,w/2])box(cx+dx,4.99,.10,.145,3.67,.25,M.red);
  for(const yy of[3.19,6.57,6.84])box(cx,yy,.11,w+.10,.14,.27,M.wood);
  for(let col=0;col<4;col++){
   const x=cx-w*.375+col*w*.25;box(x,4.95,.078,w*.22,3.34,.06,M.sanctuaryGilt);
   for(let row=0;row<11;row++)for(const dx of[-.14,.14])C.flower(x+dx,3.43+row*.285,.125,.115,row%4?M.darkGilt:M.gold);
  }
  C.frieze(cx-w/2,cx+w/2,6.66,.25,.34);
 }
 for(const x of[-2.72,2.72]){
  box(x,5.03,3.20,.44,3.78,.61,M.red);box(x,5.03,3.525,.31,3.60,.045,M.bronze);
  for(let row=0;row<10;row++)C.flower(x,3.39+row*.36,3.565,.145,M.darkGilt);
 }
 K.transfer(-2.95,2.95,6.91,3.29,.52,.82);C.bayArch(-2.67,2.67,6.61,3.41);
 for(const sign of[-1,1])group(sign*3.07,0,2.47,sign*.80,()=>{
  for(const x of[-.72,.72])box(x,4.98,0,.115,3.55,.21,M.wood);
  for(const y of[3.27,4.38,5.58,6.70])box(0,y,.015,1.55,.12,.23,M.wood);
  for(const x of[-.47,0,.47])box(x,4.99,.01,.043,3.30,.09,M.bronze);
  for(let row=0;row<9;row++)for(const col of[-1,0,1]){
   const x=col*.43,y=3.49+row*.35;C.flower(x,y,.085,.155,M.darkGilt);
   for(const side of[-1,1])between([x,y-.16,.018],[x+side*.18,y+.13,.018],.033,.045,M.wood);
  }
  C.frieze(-.75,.75,6.62,.13,.27);
 });
 for(const [x,z,w,d]of[[-1.1,1.3,2.48,1.65],[6.05,-.20,1.70,1.25]]){
  box(x,3.17,z,w,.16,d,M.dark);box(x,3.28,z,w+.06,.08,d+.06,M.bronze);
  for(const yy of[3.12,3.25,3.32])box(x,yy,z+d/2+.015,w+.08,.025,.045,M.gold);
 }
 for(const x of[-2.25,.05])for(const z of[2.29,2.75])box(x,3.34,z,.12,.46,.12,M.wood);
 box(-1.1,3.58,2.52,2.74,.13,.71,M.wood);C.frieze(-2.47,.27,3.49,2.91,.17);
 for(const x of[-7.9,-4.8,-1.6,1.6,4.8,7.9]){
  box(x,7.68,.29,.29,.43,9.35,M.wood);for(const z of[-3.8,-1.4,1.0,3.4])box(x,7.44,z,2.97,.13,.14,M.wood);
 }
 for(const [a,b]of[[-9.6,-3.5],[3.5,9.6]]){
  for(const y of[floor+.27,floor+.79])box((a+b)/2,y,5.73,b-a,.11,.15,M.red);
  for(let i=0,n=Math.ceil((b-a)/.78);i<=n;i++){const x=a+(b-a)*i/n;box(x,floor+.51,5.73,.105,1.02,.12,M.red);if(i%2===0)C.fitting(x,floor+.90,5.81,.14,.13);}
 }
 // The upper occupied floor is seated on the lower roof receivers and on
 // the inner colonnade. Its deep rim and joists remain visible in 3/4 views.
 box(0,gallery-.22,.45,18.86,.34,10.56,M.dark);box(0,gallery-.015,.45,18.68,.09,10.48,M.wood);
 for(let i=0;i<58;i++)box(-9.18+i*.322,gallery+.05,.45,.308,.055,10.3,M.wood);
 box(0,gallery-.23,5.34,19.0,.37,.58,M.red);
 for(const x of lower){const bottom=roofBearing143(x,front,false),top=gallery-.39;if(top>bottom)box(x,(bottom+top)/2,front,.37,top-bottom+.02,.48,M.red);}
 for(const side of[-1,1]){
  box(side*8.28,gallery-.23,.45,.46,.38,9.55,M.wood);
  for(let i=0;i<11;i++)box(side*8.72,gallery-.26,-4.10+i*.91,1.51,.31,.21,M.wood);
 }
 for(const z of[3.18,-4.45]){
  const lo=gallery+.15,hi=10.47;box(0,(lo+hi)/2,z,18.40,hi-lo,.23,M.dark);
  for(let i=0;i<upper.length-1;i++){
   const a=upper[i],b=upper[i+1],cx=(a+b)/2;
   for(const [y,h]of[[8.99,.41],[9.61,.44],[10.17,.28]])box(cx,y,z+.155,b-a-.28,h,.075,M.ivory);
   for(const y of[8.75,9.28,9.93,10.42])box(cx,y,z+.20,b-a,.15,.29,M.red);
   C.frieze(a+.10,b-.10,9.31,z+.26,.24);C.bayArch(a+.10,b-.10,10.48,z+.20);
   for(const x of[a,b])box(x,9.60,z+.21,.15,1.94,.29,M.red);
  }
 }
 for(const z of[5.20,-4.30]){
  const ends=[];
  for(const x of upper){post(x,z,gallery+.04,upperTop-gallery-.34,.225,M.red);K.capital(x,z,upperTop,roofBearing143(x,z,true),.94,1.36);C.fitting(x,9.65,z+.25,.24,.31);ends.push(K.carry(x,z,upperTop,0,z>0?1:-1,z>0?2.64:1.08,true));}
  K.sweep(ends,.36,.29,M.wood);
  for(let i=0;i<upper.length-1;i++){
   const a=upper[i],b=upper[i+1],x=(a+b)/2;K.transfer(a,b,10.03,z,.34,.59);K.capital(x,z,10.34,roofBearing143(x,z,true),.61,1.38);
  }
  for(const y of[gallery+.29,gallery+.83])box(0,y,z+.32,18.7,.10,.12,M.red);
  for(let i=0;i<=41;i++)box(-9.1+i*18.2/41,gallery+.56,z+.32,i%7===0?.105:.053,.66,.073,M.red);
 }
 for(const side of[-1,1]){
  const zs=[-3.4,-1.1,1.2,3.45],ends=[];
  for(const z of zs){post(side*8.28,z,gallery+.04,upperTop-gallery-.34,.213,M.red);group(side*8.28,0,z,side*Math.PI/2,()=>K.capital(0,0,upperTop,roofBearing143(side*8.28,z,true),.86,1.31));ends.push(K.carry(side*8.28,z,upperTop,side,0,1.20,true));}
  K.sweep(ends,.32,.27,M.wood);box(side*8.28,10.02,.43,.45,.34,9.50,M.red);
  for(const y of[gallery+.29,gallery+.83])box(side*9.10,y,.45,.12,.10,9.45,M.red);
  for(let i=0;i<=23;i++)box(side*9.10,gallery+.56,-4.23+i*9.38/23,.073,.66,.053,M.red);
  group(side*6.86,0,-.58,side*Math.PI/2,()=>{
   const axes=[-3.5,-1.17,1.17,3.5];for(let i=0;i<3;i++){const a=axes[i],b=axes[i+1],cx=(a+b)/2;box(cx,9.59,-.08,b-a-.08,1.85,.23,M.dark);for(const [y,h]of[[9.02,.42],[9.63,.45],[10.18,.27]])box(cx,y,.065,b-a-.34,h,.07,M.ivory);for(const yy of[8.76,9.28,9.94,10.42])box(cx,yy,.12,b-a,.15,.28,M.red);C.frieze(a+.08,b-.08,9.32,.17,.23);}
   for(const x of axes)box(x,9.6,.13,.16,1.96,.28,M.red);
  });
 }
 for(const x of[-9,-6,-3,3,6,9]){lantern(x,5.95,4.94,.80);lantern(x,10.19,5.28,.48);}
 return{revision:MASS181_REVISION,floor,galleryFloor:gallery,lowerShaftTop:shaftTop,upperShaftTop:upperTop,lowerAxes:lower,upperAxes:upper,lowerShaftRadius:.315,upperShaftRadius:.225,lowerPortalDepth:2.5,lowerEnclosureFront:1.24,upperEnclosureFront:3.18,roofBearings:K.contacts,completeLoadPath:true,scenePhotoSampled:false,visualAccepted:false};
}

export function buildNightGableMass181(api,C){
 const {emit,box,group,materials:M}=api,S=H.upper,cut=S.gableCut,base=S.e+S.rise*Math.pow(1-cut,S.slopePower)-.25,roof=z=>S.e+S.rise*Math.pow(Math.max(0,1-Math.abs(z)/(z>=0?S.frontDepth:S.backDepth)),S.slopePower),K=createMassCarpentry181(api,C);
 for(const side of[-1,1]){
  const rx=side>0?S.ridgeRight:-S.ridgeLeft;
  group(rx,0,0,side*Math.PI/2,()=>{
   const zAt=u=>-side*u,lo=side>0?-S.frontDepth*cut:-S.backDepth*cut,hi=side>0?S.backDepth*cut:S.frontDepth*cut,top=u=>roof(zAt(u));
   // Full-depth boarded loft behind a deep shaped rake, with open vent
   // slots and heavy inner king-post/truss planes in front of the boards.
   for(let u=lo+.11;u<hi;u+=.22){const h=top(u)-base-.20;if(h>.03)box(u,base+h/2,-.37,.216,h,.70,M.eaveDark);}
   box((lo+hi)/2,base+.12,.10,hi-lo+.15,.42,.75,M.red);box(0,(base+S.e+S.rise-.32)/2,.11,.31,S.e+S.rise-.32-base,.69,M.red);
   const rake=Array.from({length:65},(_,j)=>{const u=lo+(hi-lo)*j/64;return[u,top(u)-.17,.17];});K.sweep(rake,.54,.41,M.red);K.sweep(rake.map(p=>[p[0],p[1]-.11,p[2]+.23]),.14,.13,M.wood);
   for(const sign of[-1,1]){
    const end=sign<0?lo:hi,pts=[[0,S.e+S.rise-.45,.11],[end*.24,base+(S.e+S.rise-base)*.47,.12],[end*.61,base+.45,.16],[end*.90,base+.14,.16]];K.sweep(pts,.55,.31,M.wood);
    const mid=end*.43;box(mid,base+.48,.09,Math.abs(end)*.65,.22,.63,M.wood);
    for(const u of[end*.30,end*.58]){const h=top(u)-base-.61;if(h>.18){box(u,base+.42+h/2,-.075,.075,h,.22,M.wood);C.flower(u,base+.38,.43,.18,M.darkGilt);}}
   }
   for(let i=0;i<3;i++){const u=lo+(hi-lo)*(i+1)/4,w=(hi-lo)*.17;box(u,base+.48,-.02,w,.56,.34,M.dark);C.frieze(u-w/2,u+w/2,base+.48,.23,.40);}
   C.flower(0,S.e+S.rise-.78,.48,.31,M.darkGilt);
  });
 }
 return{revision:'scene09-181-deep-boarded-gable-loft',boardDepth:.70,rakeDepth:.54,rakeHeight:.41,comparisonOnlyPhotograph:true};
}
