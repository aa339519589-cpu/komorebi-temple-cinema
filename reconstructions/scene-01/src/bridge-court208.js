import * as T from 'three';
import {layout124 as L} from './layout124.js';
import {prism124} from './layout-components124.js';
import {bridgeMedallion298} from './foreground-craft298.js';

// Actual bridge/court recovery208. The original reference and low cameras
// remain. Bridge placement and connected routes are physical 3D construction.
const G=L.bridge,H=G.halfSpan,S=L.stair,C=S.width/2+.17,TAU=Math.PI*2;
const matrix=new T.Matrix4().compose(new T.Vector3(...G.position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),G.yaw),new T.Vector3(...G.scale)),inverse=matrix.clone().invert();
const D=x=>G.deckBaseline+.085+G.archRise*(1-(x/H)**2)+G.slope*x/H;
const W=(u,v)=>new T.Vector3(u,0,v).applyMatrix4(matrix),UV=(x,z)=>new T.Vector3(x,G.position[1],z).applyMatrix4(inverse);
const eastY=G.position[1]+D(H),westY=G.position[1]+D(-H),turnY=(eastY+S.landingY)/2,halfDescent=eastY-turnY;
const hallYaw=L.hall.yaw,axisZ=new T.Vector3(Math.sin(hallYaw),0,Math.cos(hallYaw)),flightTop=new T.Vector3(...S.top).addScaledVector(axisZ,S.topLanding.forwardOffset),foot=new T.Vector3(...S.bottom),forward=foot.clone().sub(flightTop).setY(0).normalize(),across=new T.Vector3(-forward.z,0,forward.x);
const courtBackL=foot.clone().addScaledVector(across,C),courtBackR=foot.clone().addScaledVector(across,-C),courtFrontL=courtBackL.clone().addScaledVector(forward,1.95),courtFrontR=courtBackR.clone().addScaledVector(forward,1.95);
const leftA=UV(courtBackL.x,courtBackL.z),leftB=UV(courtFrontL.x,courtFrontL.z),endU=v=>leftA.x+(leftB.x-leftA.x)*(v-leftA.z)/(leftB.z-leftA.z);
const E=H+1.06,westU=-H-1.15,backV=-3.90,frontV=-2.65;
export const PLAN208={eastEndY:eastY,westEndY:westY,turnY,stairCourtY:S.landingY,bridgeDeckTop:D(0)+G.position[1],eastLanding:{u:[H,E],v:[-1.10,1.10]},northFlight:{u:[H,E],v:[-2.65,-1.10],risers:3},turnLanding:{u:[H,E],v:[backV,frontV]},eastFlight:{u0:E,v:[backV,frontV],risers:3,receivingEdge:'Actual oblique left boundary of forecourt'},westLanding:{u:[westU,-H],v:[-1.10,1.10]},westFlight:{u:[westU,-H],v:[-4.60,-1.10],risers:10},court:[courtBackL,courtBackR,courtFrontR,courtFrontL].map(p=>[p.x,p.z]),stairFoot:S.bottom,cameraOrDollyChanged:false};

function outsideRect(u,v,a,b,c,d){return Math.hypot(Math.max(a-u,0,u-b)*G.scale[0],Math.max(c-v,0,v-d)*G.scale[2]);}
function region208(u,v,margin=0){
 const east=outsideRect(u,v,H,E,-1.10,1.10),north=outsideRect(u,v,H,E,-2.65,-1.10),turn=outsideRect(u,v,H,E,backV,frontV),west=outsideRect(u,v,westU,-H,-1.10,1.10),westFlight=outsideRect(u,v,westU,-H,-4.60,-1.10);
 const vv=T.MathUtils.clamp(v,backV,frontV),eu=endU(vv),eastFlight=outsideRect(u,v,E,eu,backV,frontV);
 return[{distance:east,y:eastY},{distance:north,y:eastY-halfDescent*T.MathUtils.clamp((-v-1.10)/1.55,0,1)},{distance:turn,y:turnY},{distance:eastFlight,y:turnY+(S.landingY-turnY)*T.MathUtils.clamp((u-E)/(eu-E),0,1)},{distance:west,y:westY},{distance:westFlight,y:westY+(1.69-westY)*T.MathUtils.clamp((-v-1.10)/3.50,0,1)}];
}
function courtCoordinates(x,z){const q=new T.Vector3(x,0,z).sub(foot),u=q.dot(across),v=q.dot(forward);return{u,v,distance:Math.hypot(Math.max(Math.abs(u)-C,0),Math.max(-v,0,v-1.95))};}
export function routeClearance208(x,z,margin=.15){
 const p=UV(x,z),regions=region208(p.x,p.z),court=courtCoordinates(x,z);
 return regions.some(q=>q.distance<=margin)||court.distance<=margin;
}
export function routeHeight208(x,z,margin=0){
 const p=UV(x,z),heights=region208(p.x,p.z).filter(r=>r.distance<=margin).map(r=>r.y);if(courtCoordinates(x,z).distance<=margin)heights.push(S.landingY);return heights.length?Math.min(...heights):Infinity;
}
export function bank208(x,z,original){
 const p=UV(x,z);let y=original;
 const pondRecession=1-T.MathUtils.smoothstep(p.z,.55,2.50),cascadeClearance=1-T.MathUtils.smoothstep(p.z,-1.1,-.20)*T.MathUtils.smoothstep(p.x,E-.05,E+.82);
 for(const r of region208(p.x,p.z)){const weight=(1-T.MathUtils.smoothstep(r.distance,.08,1.80))*pondRecession*cascadeClearance;y=Math.max(y,original+Math.max(0,r.y-.43-original)*weight);}
 const court=courtCoordinates(x,z),weight=1-T.MathUtils.smoothstep(court.distance,0,1.45);y=Math.max(y,original+Math.max(0,S.landingY-.19-original)*weight);
 // Keep the occupied channel beneath the bridge open. Raised end shoulders
 // stop at actual masonry abutments instead of filling the arch with a mound.
 const channel=T.MathUtils.smoothstep(p.x,-H+.04,-H+.70)*(1-T.MathUtils.smoothstep(p.x,H-.70,H-.04))*(1-T.MathUtils.smoothstep(Math.abs(p.z),1.28,1.90));y=T.MathUtils.lerp(y,Math.min(y,original+.10),channel);
 return y;
}
function closedGeometry(p,uv,ix,name){
 const kept=[];let volume=0;
 for(let k=0;k<ix.length;k+=3){const [a,b,c]=ix.slice(k,k+3).map(i=>new T.Vector3(...p.slice(i*3,i*3+3)));if(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()<1e-23)continue;volume+=a.dot(b.clone().cross(c))/6;kept.push(...ix.slice(k,k+3));}
 if(volume<0)for(let k=0;k<kept.length;k+=3)[kept[k+1],kept[k+2]]=[kept[k+2],kept[k+1]];
 const g=new T.BufferGeometry();g.name=name;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(kept);g.computeVertexNormals();g.userData={closedBridge208:true,physicalVolume:Math.abs(volume)};return g;
}
function archMember208({z=0,depth=.24,top=x=>D(x)-.17,bottom=x=>D(x)-.53,notches=[]}){
 // Extrude one continuous notched side profile. Sweeping rectangles through
 // a discontinuous seat leaves T-junctions on the timber side; triangulating
 // this entire polygon gives the notch walls shared, closed boundary edges.
 const sections=Array.from({length:81},(_,i)=>({x:-H+2*H*i/80,notch:false}));
 for(const x of notches){const a=x-.072,b=x+.072;for(let i=sections.length-1;i>=0;i--)if(sections[i].x>=a-1e-8&&sections[i].x<=b+1e-8)sections.splice(i,1);sections.push({x:a,notch:false},...Array.from({length:5},(_,i)=>({x:a+(b-a)*i/4,notch:true})),{x:b,notch:false});}
 sections.sort((a,b)=>a.x-b.x);const points=sections.map(s=>[s.x,s.notch?D(s.x)-.29:top(s.x)]),bottomXs=[...new Set(sections.map(s=>s.x))].reverse();
 points.push(...bottomXs.map(x=>[x,bottom(x)]));const shape=new T.Shape();shape.moveTo(...points[0]);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();
 const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1});g.translate(0,0,z-depth/2);g.name='structure208-closed-arched-member-with-joist-seats';g.userData={closedBridge208:true};return g;
}
function curvedCrossbeam208(x0,x1,z0,z1,top,bottom,name){
 const p=[],uv=[],ix=[],N=4;
 for(let j=0;j<=N;j++){const x=x0+(x1-x0)*j/N;for(const q of[[x,bottom(x),z0],[x,bottom(x),z1],[x,top(x),z1],[x,top(x),z0]]){p.push(...q);uv.push(q[0],q[2]);}}
 for(let j=0;j<N;j++)for(let k=0;k<4;k++){const a=j*4+k,b=j*4+(k+1)%4;ix.push(a,b,a+4,b,b+4,a+4);}const n=N*4;ix.push(0,2,1,0,3,2,n,n+1,n+2,n,n+2,n+3);return closedGeometry(p,uv,ix,name);
}
function bronzeTie208(side=1){
 const outline=[[1.167,.24],[1.173,.24],[1.173,-.022],[1.104,-.066],[1.104,-.42],[1.098,-.42],[1.098,-.062],[1.167,-.018]],s=new T.Shape();s.moveTo(...outline[0]);for(const q of outline.slice(1))s.lineTo(...q);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:.065,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:1,steps:1});g.rotateY(-Math.PI/2);g.translate(.0325,0,0);if(side<0){g.scale(1,1,-1);for(const attribute of Object.values(g.attributes)){for(let i=0;i<attribute.count;i+=3)for(let k=0;k<attribute.itemSize;k++){const a=(i+1)*attribute.itemSize+k,b=(i+2)*attribute.itemSize+k,v=attribute.array[a];attribute.array[a]=attribute.array[b];attribute.array[b]=v;}}g.computeVertexNormals();}return g;
}
export function buildBridge208(B){
 B.label('structure208-half-lapped-arched-garden-bridge',()=>B.with(...G.position,G.yaw,()=>{
  const joists=Array.from({length:13},(_,i)=>-H+.18+(2*H-.36)*i/12);
  for(const z of[-.96,0,.96]){
   B.emit(archMember208({z,depth:.26,bottom:x=>D(x)-.35,notches:joists}),'darkwood');
   B.emit(archMember208({z,depth:.26,top:x=>D(x)-.35,bottom:x=>D(x)-.53}),'red');
  }
  for(const side of[-1,1]){
   B.emit(archMember208({z:side*1.105,depth:.050,top:x=>D(x)-.025,bottom:x=>D(x)-.135}),'red');
   B.emit(archMember208({z:side*1.098,depth:.042,top:x=>D(x)-.462,bottom:x=>D(x)-.522}),'wood');
  }
  for(const x of joists)B.emit(curvedCrossbeam208(x-.072,x+.072,-1.105,1.105,a=>D(a)-.17,a=>D(a)-.29,'structure208-closed-cross-joist-on-matching-seats'),'wood');
  // Closed deck boards bear directly on seated joists and the un-notched
  // upper stringer faces. Real seams follow the transverse board direction.
  for(let i=0;i<57;i++){const a=-H+2*H*i/57+.0012,b=-H+2*H*(i+1)/57-.0012;B.emit(curvedCrossbeam208(a,b,-1.09,1.09,D,x=>D(x)-.17,'structure208-closed-transverse-deck-plank'),'wood',0,0,0,1,1,1,0,.93+.07*Math.sin(i*.8));}
  const ties=[bronzeTie208(-1),bronzeTie208(1)];for(const g of ties)B.resources.add(g);
  const cap=new T.LatheGeometry([[0,0],[.103,0],[.103,.018],[.071,.028],[.068,.075],[.093,.115],[.089,.158],[.066,.195],[.031,.221],[.022,.251],[0,.270]].map(p=>new T.Vector2(...p)),40);B.resources.add(cap);
  const headMaterial=B.m.hardwareBronze131??B.m.bronze;
  for(const side of[-1,1]){
   for(const [height,h,d]of[[.91,.108,.135],[.48,.095,.102],[.16,.100,.100]])B.emit(archMember208({z:side*1.085,depth:d,top:x=>D(x)+height+h/2,bottom:x=>D(x)+height-h/2}),'redLight');
   for(let i=0;i<=8;i++){
    const x=-H+2*H*i/8,y=D(x),z=side*1.085,major=i%2===0;
    B.box(x,y+.475,z,major?.168:.121,.950,major?.168:.121,'red');
    // The bent, closed strap lies against the post face and turns down onto
    // the arch girder. It is hardware carrying the post, not a gold rosette.
    B.emit(ties[side>0?1:0],headMaterial,x,y);
    // Oval crown plate and the lower rectangular clasp sit on the real
    // outer girder faces, at the deck edge seen in the supplied reference.
    bridgeMedallion298(B,x,y-.055,side);
    B.box(x,y-.274,side*1.102,.121,.198,.012,'goldDark');
    for(const dx of[-.047,.047])B.box(x+dx,y-.274,side*1.111,.008,.172,.006,'gold');
    for(const yy of[-.354,-.194])B.box(x,y+yy,side*1.111,.100,.008,.006,'gold');
    for(const [yy,zz]of[[.13,1.179],[-.31,1.111]])B.emit(new T.CylinderGeometry(.017,.017,.009,16).rotateX(Math.PI/2),headMaterial,x,y+yy,side*zz);
    if(major){B.box(x,y+.967,z,.204,.025,.204,headMaterial);B.emit(cap,headMaterial,x,y+.979,z);B.emit(new T.TorusGeometry(.072,.004,6,32),'goldDark',x,y+1.045,z,1,1,1,[Math.PI/2,0,0]);}
   }
  }
  // A fitted transverse bent receives all three arch girders. Its curved
  // bearing face shares the exact girder underside; no long floating blocks.
  const bx=-.50,beamBottom=D(bx)-.735,plinthTop=.66-G.position[1],water=.13-G.position[1];
  B.emit(curvedCrossbeam208(bx-.22,bx+.22,-1.09,1.09,x=>D(x)-.53,()=>beamBottom,'structure208-fitted-central-bent-cap'),'wood');
  for(const side of[-1,1]){
   const z=side*.55,r=side>0?.27:.29;
   B.box(bx,(plinthTop+beamBottom)/2,z,r,beamBottom-plinthTop,r,side>0?'wood':'stone');
   B.box(bx,(water-.14+plinthTop)/2,z,.51,plinthTop-water+.14,.53,'stone');
   if(side>0){B.box(bx,plinthTop+.035,z,.285,.070,.285,'bronze');B.between([bx,beamBottom-.43,z],[bx,beamBottom+.01,side*.98],.105,.125,'wood');}
  }
  // The underside of each girder bears on a curved timber sleeper. The
  // outer half of each sleeper enters an actual stone receiving pocket;
  // masonry is emitted separately by buildCourt208 without overlapping it.
  for(const sign of[-1,1]){
   const end=sign*H,seat=D(end)-.53;
   for(const z of[-.96,0,.96])B.emit(curvedCrossbeam208(end-.225,end+.225,z-.20,z+.20,x=>D(T.MathUtils.clamp(x,-H,H))-.53,()=>seat-.07,'structure208-curved-end-sleeper-in-receiving-pocket'),'wood');
  }
 },G.scale));
 B.layout124??={};B.layout124.bridge208={revision:208,closedDeckAndThreeGirders:true,halfLappedJoists:13,bridgePlacement:G,placementRecovery:'Compared HD01 against native1254: moved bridge0.48m west and0.22m down; X scale1.10. Original camera/dolly retained.',handrailHeight:.91,centralBentTop:'matching curved girder underside',centralLegCentersLocal:[[-.50,.55],[-.50,-.55]],endBearing:'Six curved timber sleepers with receiving pockets and0.012m top clearance behind the bridge end plane',oversizedRosettesRemoved:true,actualPlan:PLAN208,visualAccepted:false};
}

function uvPoly208(poly){return poly.map(([u,v])=>{const p=W(u,v);return[p.x,p.z];});}
function block208(B,poly,lo,hi,mat,name){if(hi>lo){
 const raw=prism124(poly,lo,hi,name),g=raw.toNonIndexed();raw.dispose();g.name=name;const p=g.attributes.position,uv=[];
 // Real masonry side faces need metric vertical UVs. A horizontal-only
 // projection stretches one texel through the entire height of a wall.
 for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2),n=b.sub(a).cross(c.sub(a));for(let k=0;k<3;k++){const j=i+k;if(Math.abs(n.y)>Math.max(Math.abs(n.x),Math.abs(n.z)))uv.push(p.getX(j),p.getZ(j));else if(Math.abs(n.x)>Math.abs(n.z))uv.push(p.getZ(j),p.getY(j));else uv.push(p.getX(j),p.getY(j));}}
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();B.emit(g,mat);
}}
function uvBlock208(B,a,b,c,d,lo,hi,mat,name){block208(B,uvPoly208([[a,c],[b,c],[b,d],[a,d]]),lo,hi,mat,name);}
//219-R14: each route foundation retains the exact upper walking boundary,
// but exposes closed laid stones instead of an uninterrupted poured-looking face.
function foundation219(B,poly,lo,hi,name){
 const center=poly.reduce((q,p)=>[q[0]+p[0]/poly.length,q[1]+p[1]/poly.length],[0,0]),inset=poly.map(p=>{const d=Math.hypot(center[0]-p[0],center[1]-p[1]);return[p[0]+(center[0]-p[0])*.10/d,p[1]+(center[1]-p[1])*.10/d];});
 block208(B,inset,lo,hi,'route219Masonry',name+'-closed-inset-bearing-core');
 const rows=Math.max(1,Math.ceil((hi-lo)/.28)),dy=(hi-lo)/rows;
 for(let row=0;row<rows;row++)for(let edge=0;edge<poly.length;edge++){
  const a=poly[edge],b=poly[(edge+1)%poly.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),pieces=Math.max(1,Math.ceil(len/.54)),cuts=[0];
  for(let k=0;k<pieces;k++){const t=(k+.5*(row%2))/pieces;if(t>.001&&t<.999)cuts.push(t);}cuts.push(1);cuts.sort((a,b)=>a-b);
  for(let k=0;k<cuts.length-1;k++){
   const t0=cuts[k]+.005/len,t1=cuts[k+1]-.005/len;if(t1<=t0)continue;
   const p=[a[0]+(b[0]-a[0])*t0,a[1]+(b[1]-a[1])*t0],q=[a[0]+(b[0]-a[0])*t1,a[1]+(b[1]-a[1])*t1],mid=[(p[0]+q[0])/2,(p[1]+q[1])/2],distance=Math.hypot(center[0]-mid[0],center[1]-mid[1]),dx=(center[0]-mid[0])*.17/distance,dz=(center[1]-mid[1])*.17/distance;
   block208(B,[p,q,[q[0]+dx,q[1]+dz],[p[0]+dx,p[1]+dz]],lo+row*dy+.006,lo+(row+1)*dy-.006,'route219Masonry',name+'-individual-staggered-face-stone');
  }
 }
}
function endLanding208(B,sign){
 const end=sign*H,outer=sign>0?E:westU,top=sign>0?eastY:westY,seat=top-.53,sleeperBottom=seat-.07,mouthTop=seat+.012,inner=end-sign*.26,pocketBack=end+sign*.235;
 const span=(a,b,c,d,lo,hi,mat,name)=>{const poly=uvPoly208([[Math.min(a,b),c],[Math.max(a,b),c],[Math.max(a,b),d],[Math.min(a,b),d]]);if(mat==='stone'&&hi-lo>.30)foundation219(B,poly,lo,hi,name);else block208(B,poly,lo,hi,mat==='stone'?'route219Masonry':mat,name);};
 // Continuous buried footing, with six individual receiving recesses. The
 // front bearing ledge reaches below the arch, while the full-height
 // landing begins at the same end plane as the timber deck.
 const rows=Math.ceil((sleeperBottom-.05)/.29),dy=(sleeperBottom-.05)/rows;
 // Thin recessed bedding joins the staggered courses. Every block remains
 // a closed solid, with real mortar joints on the exposed pond-facing end.
 for(let row=0;row<=rows;row++)span(inner,outer,-1.155,1.155,Math.max(.05,.05+row*dy-.004),Math.min(sleeperBottom,.05+row*dy+.004),'rock','structure208-recessed-horizontal-mortar-bedding');
 for(let row=0;row<rows;row++){
  const cuts=row%2?[-1.17,-.77,0,.77,1.17]:[-1.17,-.39,.39,1.17];
  for(let k=0;k<cuts.length-1;k++)span(inner,outer,cuts[k]+.005,cuts[k+1]-.005,.05+row*dy+.004,.05+(row+1)*dy-.004,'stone','structure208-staggered-landing-bearing-course');
  for(const z of cuts.slice(1,-1))span(inner,outer,z-.005,z+.005,.05+row*dy+.004,.05+(row+1)*dy-.004,'rock','structure208-vertical-mortar-between-staggered-blocks');
 }
 const gaps=[[-.75,-.21],[.21,.75]];
 for(const [a,b]of gaps)span(inner,pocketBack,a,b,sleeperBottom,mouthTop,'stone','structure208-stone-cheek-between-bearing-pockets');
 span(pocketBack,outer,-1.17,1.17,sleeperBottom,top-.065,'stone','structure208-landing-solid-behind-pocket-ends');
 span(end,pocketBack,-1.17,1.17,mouthTop,top-.065,'stone','structure208-stone-lintel-above-sleeper-pockets');
 // The pocket mouths remain open to the bridge. Side cheeks outside the
 // outer girders are 10mm clear of the timber, not hidden intersecting cubes.
 for(const [a,b]of[[-1.17,-1.165],[1.165,1.17]])span(inner,pocketBack,a,b,sleeperBottom,mouthTop,'stone','structure208-outer-bearing-pocket-cheek');
 span(end,outer,-1.17,1.17,top-.065,top,'stoneLight','structure208-level-end-landing-cap');
}
export function buildCourt208(B){
 //219-R13: reclaimed masonry is a separate rough original stone finish;
 // retain the existing world-weathering hook rather than cloning it away.
 const masonry=B.m.stone.clone();masonry.name='route219-weathered-cut-bearing-stone';masonry.roughness=.98;masonry.onBeforeCompile=B.m.stone.onBeforeCompile;masonry.customProgramCacheKey=()=>B.m.stone.customProgramCacheKey()+'-route219-cut-masonry';B.m.route219Masonry=masonry;
 B.label('structure208-bearing-bridge-landings-and-turning-stair-route',()=>{
  endLanding208(B,1);endLanding208(B,-1);
  for(let i=0;i<3;i++){
   const a=-1.10-1.55*i/3,b=-1.10-1.55*(i+1)/3,y=eastY-halfDescent*(i+1)/3;
   foundation219(B,uvPoly208([[H,b],[E,b],[E,a],[H,a]]),.05,y-.055,'structure208-north-flight-bearing-course');uvBlock208(B,H,E,b,a,y-.055,y,'stoneLight','structure208-north-flight-tread');
  }
  foundation219(B,uvPoly208([[H,backV],[E,backV],[E,frontV],[H,frontV]]),.05,turnY-.055,'structure208-full-width-corner-landing-footing');uvBlock208(B,H,E,backV,frontV,turnY-.055,turnY,'stoneLight','structure208-full-width-corner-turn-landing');
  for(let i=0;i<3;i++){
   const t0=i/3,t1=(i+1)/3,poly=uvPoly208([[E+(endU(backV)-E)*t0,backV],[E+(endU(backV)-E)*t1,backV],[E+(endU(frontV)-E)*t1,frontV],[E+(endU(frontV)-E)*t0,frontV]]),y=turnY+(S.landingY-turnY)*t1;
   foundation219(B,poly,.05,y-.055,'structure208-angled-flight-bearing-course');block208(B,poly,y-.055,y,'stoneLight','structure208-angled-tread-to-exact-court-boundary');
  }
  for(let i=0;i<10;i++){
   const a=-1.10-3.50*i/10,b=-1.10-3.50*(i+1)/10,y=westY+(1.69-westY)*(i+1)/10;
   foundation219(B,uvPoly208([[westU,b],[-H,b],[-H,a],[westU,a]]),.05,y-.055,'structure208-west-garden-flight-footing');uvBlock208(B,westU,-H,b,a,y-.055,y,'stoneLight','structure208-west-flight-rooted-into-back-bank');
  }
 });
 B.label('structure208-stair-forecourt-meeting-oblique-flight-foot',()=>{
  const poly=PLAN208.court,atCourt=(u,v)=>foot.clone().addScaledVector(across,-C+2*C*u).addScaledVector(forward,1.95*v),patch=(u0,u1,v0,v1)=>[atCourt(u0,v0),atCourt(u1,v0),atCourt(u1,v1),atCourt(u0,v1)].map(p=>[p.x,p.z]);
  // A closed inner footing carries the cut flags. Its exposed faces are
  // actual staggered ashlar courses, meeting the receiving route and bank;
  // no full-height unjointed grey slab remains on the pond side.
  block208(B,patch(.035,.965,.035,.965),.25,2.045,'route219Masonry','structure208-inset-solid-forecourt-masonry-core');
  for(let row=0;row<6;row++){
   const lo=.25+1.795*row/6+.006,hi=.25+1.795*(row+1)/6-.006,cuts=[0];
   for(let k=0;k<6;k++){const u=(k+.5*(row%2))/6;if(u>.001&&u<.999)cuts.push(u);}cuts.push(1);cuts.sort((a,b)=>a-b);
   for(let k=0;k<cuts.length-1;k++){const a=cuts[k]+.0018,b=cuts[k+1]-.0018;block208(B,patch(a,b,.915,1),lo,hi,'route219Masonry','structure208-staggered-pond-facing-forecourt-ashlar');}
   for(const [a,b]of[[0,.085],[.915,1]])for(let j=0;j<4;j++)block208(B,patch(a,b,j/4+.003,(j+1)/4-.003),lo,hi,'route219Masonry','structure208-coursed-forecourt-side-return');
  }
  for(let i=0;i<6;i++)for(let j=0;j<4;j++){
   const at=(u,v)=>foot.clone().addScaledVector(across,-C+2*C*u).addScaledVector(forward,1.95*v),u0=i/6+.0010,u1=(i+1)/6-.0010,v0=j/4+.0015,v1=(j+1)/4-.0015,p=[at(u0,v0),at(u1,v0),at(u1,v1),at(u0,v1)].map(q=>[q.x,q.z]);
   block208(B,p,2.045,2.10,'stoneLight','structure208-court-closed-cut-stone-flag');
  }
 });
 B.layout124??={};B.layout124.court208={revision:'219-r15-weathered-cut-stone-connected-route',plan:PLAN208,continuousMasonryBelowAllTreads:true,individualExposedAshlarCourses:6,exactHallStairFoot:S.bottom,stoneForecourtWidth:2*C,stoneForecourtDepth:1.95,oldRaisedPavingAndNarrowDisconnectedRouteRemoved:true,visualAccepted:false};
}

// Reuse actual source instances for structural views. Full reference, hero,
// low camera and movie never omit anything. Only these explicit inspections
// remove foliage/roof occlusion so bridge/ground/route contact can be reviewed.
export function renderStructure208(scene,renderView,kind='plan'){
 const hidden=[],copies=[],group=new T.Group();group.name='structure208-actual-instance-contact-inspection';scene.updateMatrixWorld(true);
 const keep=role=>(role.startsWith('structure208-')&&role!=='structure208-rooted-rock-and-herb-bridge-shoulders')||['garden-landforms','continuous-soil-bank-from-stair-to-pond','great-hall-stone-platform','layout124-connected-hall-flight-and-landing','layout124-pagoda-supported-ground'].includes(role);
 scene.traverse(o=>{if(!o.isMesh)return;hidden.push([o,o.visible]);o.visible=false;if(!o.isInstancedMesh||!o.userData.instanceRoles)return;
  const ids=o.userData.instanceRoles.flatMap((r,i)=>keep(r)?[i]:[]);if(!ids.length)return;
  const m=new T.InstancedMesh(o.geometry,o.material,ids.length),matrix=new T.Matrix4(),color=new T.Color();m.matrixAutoUpdate=false;m.matrix.copy(o.matrixWorld);m.name=o.name;m.castShadow=o.castShadow;m.receiveShadow=o.receiveShadow;
  ids.forEach((id,i)=>{o.getMatrixAt(id,matrix);m.setMatrixAt(i,matrix);if(o.instanceColor){o.getColorAt(id,color);m.setColorAt(i,color);}});m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();group.add(m);copies.push(m);
 });
 const position=kind==='plan'?[-1,18,1.8]:[4.4,3.7,3.6],target=kind==='plan'?[-1,0,-2.8]:[-1.6,2.1,-2.1],fov=kind==='plan'?61:62;scene.add(group);
 try{return{...renderView(position,target,0,fov),inspection:{revision:208,kind:'actual-3D-'+kind+'-structural-contact-view',omitted:'Plants, dressing rocks, water, sky, roofs and unrelated meshes only in this explicit view; all retained geometry/matrices/materials are the original actual source instances. Frozen full-scene shadows remain.',position,target,fov,instances:copies.reduce((s,m)=>s+m.count,0),visualAccepted:false}};}
 finally{scene.remove(group);for(const [o,v]of hidden)o.visible=v;for(const m of copies)m.dispose();}
}
