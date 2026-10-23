import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {bridgePoint125,bridgeToWorld125} from './layout125.js';
import {installSurfaceDetail} from './surface-detail.js';

const V=p=>new T.Vector3(...p),U=new T.Vector3(0,1,0),hash=(a,b)=>{const x=Math.sin(a*127.1+b*311.7+207.17)*43758.5453;return x-Math.floor(x);};
export const SUPPORT207_REVISION='scene10-207-recessed-bearing-terrace-and-creek-r05';
export function installSupportMaterials207(m){
 m.supportStone207=new T.MeshPhysicalMaterial({name:'207-rain-dark-dressed-granite',map:m.granite.map,normalMap:m.granite.normalMap,normalScale:new T.Vector2(.70,.70),roughnessMap:m.granite.roughnessMap,color:'#7c8780',roughness:.84,metalness:0,clearcoat:.13,clearcoatRoughness:.30,vertexColors:true});installSurfaceDetail(m.supportStone207,'stone');
 m.supportCore207=new T.MeshStandardMaterial({name:'207-recessed-rubble-mortar-core',color:'#333a31',roughness:1});
 m.supportRecess207=m.supportStone207.clone();m.supportRecess207.name='207-shadowed-setback-stone';m.supportRecess207.color.set('#454d46');m.supportRecess207.roughness=.94;installSurfaceDetail(m.supportRecess207,'stone');
 m.routeStone207=m.supportStone207.clone();m.routeStone207.name='207-wet-worn-route-stone';m.routeStone207.color.set('#a4aaa2');m.routeStone207.roughness=.54;m.routeStone207.clearcoat=.34;m.routeStone207.clearcoatRoughness=.16;installSurfaceDetail(m.routeStone207,'stone');
}

function coloredStone(w,h,d,seed){
 const g=new RoundedBoxGeometry(w,h,d,2,Math.min(.018,h*.06,w*.035,d*.035)),p=g.attributes.position,c=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=hash(Math.floor(x*31)+seed,Math.floor(z*37)+Math.floor(y*29)),edge=Math.max(Math.abs(x)/(w/2),Math.abs(z)/(d/2));if(edge>.82){p.setX(i,x*(1-.010*n));p.setZ(i,z*(1-.012*n));}const tone=.86+.22*hash(Math.floor(x*19)+seed,Math.floor(y*17)+Math.floor(z*23));c.push(tone,tone,tone);}
 g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();g.name='207-closed-worn-bearing-stone-'+seed;return g;
}
function monolithicPier207(w0,w1,height,d0,d1,seed){const g=coloredStone(w0,height,d0,seed),p=g.attributes.position;for(let i=0;i<p.count;i++){const t=T.MathUtils.clamp((p.getY(i)+height/2)/height,0,1);p.setX(i,p.getX(i)*T.MathUtils.lerp(1,w1/w0,t));p.setZ(i,p.getZ(i)*T.MathUtils.lerp(1,d1/d0,t));}g.computeVertexNormals();g.name='207-closed-tapered-monolithic-bearing-pier-'+seed;return g;}

function solidProfile(points,width){
 const shape=new T.Shape();points.forEach(([a,y],i)=>i?shape.lineTo(a,y):shape.moveTo(a,y));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:width,steps:1,bevelEnabled:false});g.translate(0,0,-width/2);g.computeVertexNormals();return g;
}
function footprint(outline,bottom,top){const shape=new T.Shape();outline.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:top-bottom,steps:1,bevelEnabled:false});g.rotateX(-Math.PI/2);g.translate(0,bottom,0);g.computeVertexNormals();return g;}
function frameGeometry(g,origin,axis){const z=V([-axis[1],0,axis[0]]),x=V([axis[0],0,axis[1]]),mat=new T.Matrix4().makeBasis(x,U,z);mat.setPosition(...origin);g.applyMatrix4(mat);return g;}
function point(origin,axis,a,s=0,y=0){return[origin[0]+axis[0]*a-axis[1]*s,y,origin[2]+axis[1]*a+axis[0]*s];}
function inside(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++)if((poly[i][1]>p[1])!==(poly[j][1]>p[1])&&p[0]<(poly[j][0]-poly[i][0])*(p[1]-poly[i][1])/(poly[j][1]-poly[i][1])+poly[i][0])yes=!yes;return yes;}
function edgeDistance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}

export function createApproachPlan207(L){
 const end=bridgeToWorld125(bridgePoint125(0)),axis=[Math.cos(L.bridge.yaw),-Math.sin(L.bridge.yaw)],run=L.bridge.approachCount*L.bridge.approachRun,start=[end[0]-axis[0]*run,L.groundY,end[2]-axis[1]*run],width=1.80,count=L.bridge.approachCount,rise=end[1]-start[1],steps=[];
 for(let i=0;i<count;i++){const a=run*i/count,b=run*(i+1)/count,top=start[1]+rise*(i+1)/count;steps.push({index:i,along:[a,b],top,undersideFront:start[1]+rise*i/count-.22,undersideBack:top-.22,riser:rise/count,tread:run/count});}
 const landingEnd=[start[0]-axis[0]*.76,start[1],start[2]-axis[1]*.76],route=[[-3.72,-1.78],[-4.18,-2.64],[-4.58,-3.56],[landingEnd[0],landingEnd[2]]];
 const curve=new T.CatmullRomCurve3(route.map(([x,z])=>V([x,L.groundY,z])),false,'centripetal'),samples=Array.from({length:33},(_,i)=>curve.getPointAt(i/32)),halfWidth=.76,outline=[];
 for(let side of[-1,1]){const a=[];for(let i=0;i<samples.length;i++){const t=i/(samples.length-1),q=samples[i],d=curve.getTangentAt(t).normalize();a.push([q.x-d.z*halfWidth*side,q.z+d.x*halfWidth*side]);}outline.push(...(side===-1?a:a.reverse()));}
 return{revision:SUPPORT207_REVISION,start,end,axis,run,width,count,rise,riser:rise/count,tread:run/count,steps,bottomLanding:{center:landingEnd,along:[-1.52,0],width:1.84,top:L.groundY},route:{points:route,outline,samples:samples.map(p=>p.toArray()),width:halfWidth*2,top:L.groundY,source:'Continuous closed low stone causeway from the existing forecourt to the bridge stair foot; no water gap'}};
}

export function routeReserved207(x,z,plan,approach){
 const a=approach,dx=x-a.start[0],dz=z-a.start[2],along=dx*a.axis[0]+dz*a.axis[1],side=-dx*a.axis[1]+dz*a.axis[0];
 if(along>=-1.57&&along<=a.run+.08&&Math.abs(side)<a.width/2+.10)return true;
 if(inside([x,z],a.route.outline)||a.route.outline.some((p,i)=>edgeDistance(x,z,p,a.route.outline[(i+1)%a.route.outline.length])<.1))return true;
 if(inside([x,z],plan.turningLanding.outline)||plan.turningLanding.outline.some((p,i)=>edgeDistance(x,z,p,plan.turningLanding.outline[(i+1)%plan.turningLanding.outline.length])<.10))return true;
 const qx=x-plan.start[0],qz=z-plan.start[2],u=qx*plan.unit[0]+qz*plan.unit[1],v=-qx*plan.unit[1]+qz*plan.unit[0];return u>=-.1&&u<=plan.run+.25&&Math.abs(v)<plan.width/2+.12;
}

function emitFlight(api,spec,key){
 const {emit}=api,origin=spec.start,axis=spec.axis||spec.unit,records=[];
 for(const s of spec.steps){const a=s.along?s.along[0]:spec.run*s.index/spec.count,b=s.along?s.along[1]:spec.run*(s.index+1)/spec.count,top=s.top,bf=s.undersideFront,bb=s.undersideBack,g=solidProfile([[a-.018,bf],[b,bb],[b,top],[a-.018,top]],spec.width);g.name='207-'+key+'-closed-riser-tread-'+s.index;frameGeometry(g,[origin[0],0,origin[2]],axis);emit(g,'routeStone207');
  // Separate closed nosing has real thickness and bears on its whole tread.
  const n=coloredStone(.10,.075,spec.width+.035,20711+s.index),mid=point(origin,axis,a+.018,0,top-.0375),q=new T.Quaternion().setFromAxisAngle(U,-Math.atan2(axis[1],axis[0]));emit(n,'routeStone207',...mid,1,1,1,q);records.push({...s,worldFront:point(origin,axis,a,0,top),worldBack:point(origin,axis,b,0,top),width:spec.width,closed:true});
 }
 // Actual sloping carrying bed, not vertical columns extruded to the pond.
 const bed=solidProfile([[0,origin[1]-.36],[spec.run,origin[1]+spec.rise-.36],[spec.run,origin[1]+spec.rise-.22],[0,origin[1]-.22]],spec.width-.12);frameGeometry(bed,[origin[0],0,origin[2]],axis);bed.name='207-'+key+'-closed-sloping-bearing-bed';emit(bed,'supportStone207');
 // Narrow dressed-stone cheek courses carry the tread/bed at both edges.
 let stones=0;if(key!=='hall-flight')for(const sign of[-1,1]){
  const cheekSide=sign*(spec.width/2-.13),max=origin[1]+spec.rise-.36,rows=Math.ceil((max+.16)/.28);
  for(let row=0;row<rows;row++){const low=-.16+row*.28,high=low+.272,offset=row%2?-.30:0;for(let j=0;j<Math.ceil(spec.run/.62)+1;j++){
   let a=Math.max(0,offset+j*.62+.008);const b=Math.min(spec.run,offset+(j+1)*.62-.008);if(b-a<.08)continue;
   // Clip the rising stone at the bed intersection. R03 discarded the whole
   // block when only its low corner was below the course, leaving a notch.
   const crossing=(low-(origin[1]-.36))*spec.run/spec.rise;a=Math.max(a,crossing);
   const ta=Math.max(low,Math.min(high,origin[1]+spec.rise*a/spec.run-.36)),tb=Math.min(high,origin[1]+spec.rise*b/spec.run-.36);if(b-a<.025||tb<=low+.008)continue;
   const polygon=ta<=low+1e-6?[[a,low],[b,low],[b,tb]]:[[a,low],[b,low],[b,tb],[a,ta]],g=solidProfile(polygon,.26);frameGeometry(g,point(origin,axis,0,cheekSide,0),axis);g.name='207-'+key+'-closed-battered-cheek-course-'+row+'-'+j;emit(g,'supportStone207');stones++;
  }}
 }
 if(key==='hall-flight'){
  for(const sign of[-1,1]){const side=sign*(spec.width/2-.22),g=solidProfile([[0,origin[1]-.58],[spec.run,origin[1]+spec.rise-.58],[spec.run,origin[1]+spec.rise-.36],[0,origin[1]-.36]],.24);frameGeometry(g,point(origin,axis,0,side,0),axis);g.name='207-actual-hall-stair-bearing-stringer';emit(g,'darkwood');}
  for(const a of[0,spec.run]){const floor=origin[1]+spec.rise*a/spec.run,p=point(origin,axis,a,0,floor-.67),g=coloredStone(.22,.18,spec.width-.08,207511+Math.round(a*100)),yaw=-Math.atan2(axis[1],axis[0]);emit(g,'darkwood',...p,1,1,1,[0,yaw,0]);for(const sign of[-1,1]){const base=.04,top=floor-.76,h=top-base,side=sign*(spec.width/2-.23),P=point(origin,axis,a,side,(top+base)/2),stone=monolithicPier207(.66,.57,h,.67,.58,207581+Math.round(a*100)+sign);emit(stone,'supportStone207',...P,1,1,1,[0,yaw,0]);const foot=point(origin,axis,a,side,-.10);emit(coloredStone(.94,.28,.94,207601+Math.round(a*100)+sign),'supportStone207',...foot,1,1,1,[0,yaw,0]);}}
 }
 return{steps:records,bedThickness:.14,cheekCourseCount:stones,maximumExposedSideWidth:.26,source:key==='hall-flight'?'Closed wedge treads/bed on actual inclined timber stringers, crossheads and four stone piers on .94m closed pads at riverbed level; full-height side walls removed.':'Closed wedge treads and bearing bed on narrow real stone-course cheeks with exactly cut triangular starts; no tread is a full-height pond column'};
}

function pier(api,center,top,seed,along=[1,0]){
 const {emit}=api,bottom=-.18,height=top-bottom,rows=Math.ceil(height/.27),q=new T.Quaternion().setFromAxisAngle(U,-Math.atan2(along[1],along[0]));
 for(let i=0;i<rows;i++){const y0=bottom+height*i/rows,y1=bottom+height*(i+1)/rows,flare=1-(i+.5)/rows,w=.63+.18*flare,d=.60+.16*flare,g=coloredStone(w,y1-y0-.007,d,seed+i);emit(g,'supportStone207',center[0],(y0+y1)/2,center[1],1,1,1,q);}
 const cap=coloredStone(.85,.16,.82,seed+91);emit(cap,'supportStone207',center[0],top-.08,center[1],1,1,1,q);
 return{center,bottom,top,closedCourses:rows,capFootprint:[.85,.82],source:'Individual closed dressed stone courses, flared submerged foot and bearing cap'};
}

export function buildSupportRoute207(api,L,plan,approach,supports=[]){
 const {emit,box,between,tube}=api,A=[Math.cos(L.bridge.yaw),-Math.sin(L.bridge.yaw)],B=[-A[1],A[0]],far=plan.bridgeEnd,near=approach.end;
 const out={revision:SUPPORT207_REVISION,bridgeEndSupports:supports,nearApproach:emitFlight(api,approach,'near-bridge-approach'),hallStair:emitFlight(api,{...plan,axis:plan.unit},'hall-flight'),before:{nearDeckY:1.47,farDeckY:2.0,span:10.3,turningArea:12.25,hallStairWidth:2.9,hallStepCount:12,hallTread:.20168934999,oldStepBottom:-.18,oldBankWidth:7.1},after:{nearDeckY:near[1],farDeckY:far[1],span:L.bridge.span,turningOutline:plan.turningLanding.outline,hallStairWidth:plan.width,hallRiser:plan.rise/plan.count,hallTread:plan.run/plan.count,nearRiser:approach.riser,nearTread:approach.tread},why:'Photo-led near-end/span adjustment keeps the far bridge x/z anchor and building datums. A real low stone causeway closes the old forecourt/bridge-foot gap; thinner supported flights and a compact turn replace the broad plateau and cement drape.'};
 // Compact polygon turn, carried on two actual stone piers and a crosshead.
 emit(footprint(plan.turningLanding.outline,far[1]-.18,far[1]),'routeStone207');
 const upper=plan.upperLanding;emit(footprint(upper.outline,upper.top-.24,upper.top),'routeStone207');out.upperLanding={...upper,actualBottom:upper.top-.24,bearing:'Front edge on last actual wedge tread/bed; back corners lap the supported hall gallery floor'};
 for(const sign of[-1,1]){const p=[far[0]+B[0]*sign*.90+A[0]*.35,far[2]+B[1]*sign*.90+A[1]*.35],r=pier(api,p,far[1]-.42,207200+(sign+1)*29,A);supports.push(r);}
 const yaw=-Math.atan2(A[1],A[0]),cross=coloredStone(.38,.24,2.62,207271);emit(cross,'darkwood',far[0]+A[0]*.35,far[1]-.30,far[2]+A[1]*.35,1,1,1,[0,yaw,0]);
 // Near bridge bearing is a real capped abutment, attached to the flight head.
 for(const sign of[-1,1])pier(api,[near[0]+B[0]*sign*.76-A[0]*.08,near[2]+B[1]*sign*.76-A[1]*.08],near[1]-.42,207401+(sign+1)*31,A);
 const nc=coloredStone(.30,.24,2.35,207491);emit(nc,'darkwood',near[0]-.08*A[0],near[1]-.30,near[2]-.08*A[1],1,1,1,[0,yaw,0]);
 // A full stone landing joins the lowest tread and continuous curved path.
 const start=approach.start,w=approach.width/2+.03,lower=[point(start,A,-1.52,-w,0),point(start,A,0,-w,0),point(start,A,0,w,0),point(start,A,-1.52,w,0)].map(p=>[p[0],p[2]]);emit(footprint(lower,-.18,L.groundY),'routeStone207');emit(footprint(approach.route.outline,-.18,L.groundY-.04),'supportCore207');
 const samples=approach.route.samples;
 for(let i=0;i<samples.length-1;i++){
  const P=V(samples[i]),Q=V(samples[i+1]),d=Q.clone().sub(P).normalize(),n=V([-d.z,0,d.x]),left=P.clone().addScaledVector(n,-.755),right=P.clone().addScaledVector(n,.755),left2=Q.clone().addScaledVector(n,-.755),right2=Q.clone().addScaledVector(n,.755),poly=[left,right,right2,left2].map(p=>[p.x,p.z]);emit(footprint(poly,L.groundY-.07,L.groundY),'routeStone207');
  for(const sign of[-1,1]){const p=P.clone().addScaledVector(n,sign*.79),q=Q.clone().addScaledVector(n,sign*.79);between([p.x,L.groundY-.11,p.z],[q.x,L.groundY-.11,q.z],.14,'supportStone207',true);}
 }
 // Guards belong to the actual stair side lines, with supported foot posts.
 for(const side of[-1,1]){
  const points=[];for(let i=0;i<=8;i++){const t=i/8,p=point(plan.start,plan.unit,plan.run*t,side*(plan.width/2-.08),plan.start[1]+plan.rise*t+1.0);points.push(p);if(i%2===0){box(p[0],p[1]-.48,p[2],.13,1.04,.13,'red');}}
  for(const h of[0,-.40])tube(points.map(p=>[p[0],p[1]+h,p[2]]),.055,'red');
 }
 const farFront=point(far,A,.85,1.2,far[1]+1.0),endFront=point(far,A,0,1.1,far[1]+1.0),stairRight=point(plan.start,plan.unit,0,plan.width/2-.08,plan.start[1]+1.0),endBack=point(far,A,0,-1.1,far[1]+1.0),stairLeft=point(plan.start,plan.unit,0,-plan.width/2+.08,plan.start[1]+1.0);
 for(const pts of[[endFront,farFront,stairRight],[endBack,stairLeft]])for(const drop of[0,-.40])tube(pts.map(p=>[p[0],p[1]+drop,p[2]]),.055,'red');
 for(const p of[farFront,stairRight,stairLeft])box(p[0],p[1]-.48,p[2],.13,1.04,.13,'red');
 return out;
}

export function createNarrowStairCore207(plan){
 const origin=plan.start,axis=plan.unit,width=plan.width-.58,bottom=-.18,g=solidProfile([[0,bottom],[plan.run,bottom],[plan.run,-.13],[0,-.13]],width);frameGeometry(g,[origin[0],0,origin[2]],axis);g.name='207-closed-submerged-stair-footing-bed';
 const at=(u,v)=>point(plan.bridgeEnd,axis,u,v,-.13);
 return{geometry:g,at,ownedBy207:true,info:{revision:SUPPORT207_REVISION,kind:'closed submerged footing bed; above-water hall flight is carried on real timber stringers/crossheads and stone piers on closed riverbed pads',width,waterline:bottom,topClearance:.36,oldSmoothConeRemoved:true}};
}

export function buildHallFoundation207(api,L){
 const {emit,box}=api,worldBase=-.24,worldCap=3.05,minY=(worldBase-L.hall.position[1])/L.hall.scale[1],capY=(worldCap-L.hall.position[1])/L.hall.scale[1],bodyTop=capY-.18,frontTop=3.80,frontToe=4.50,halfWidth=9.25,back=-6.0,records=[];
 // The wall sits behind the projecting gallery, where the reference shows
 // depth and timber below the floor. R04's flush frontage was too massive.
 // Closed joists and embedded diagonal timber brackets carry that projection.
 const frontAt=y=>T.MathUtils.lerp(frontToe,frontTop,(y-minY)/(bodyTop-minY));
 const core=solidProfile([[back,minY],[frontToe-.20,minY],[frontTop-.20,bodyTop],[back,bodyTop]],halfWidth*2-.18);frameGeometry(core,[0,0,0],[0,1]);core.name='207-closed-battered-hall-retaining-core';emit(core,'supportCore207');
 const courseWeights=[.86,1.08,.91,1.10,.93,1.12],sum=courseWeights.reduce((a,b)=>a+b,0);let low=minY;
 for(let row=0;row<courseWeights.length;row++){
  const high=low+(bodyTop-minY)*courseWeights[row]/sum,h=high-low-.009,face=frontAt((low+high)/2),weights=Array.from({length:21+(row%2)},(_,k)=>.78+.53*hash(20791+row,k)),total=weights.reduce((a,b)=>a+b,0);let x=-halfWidth;
  for(let k=0;k<weights.length;k++){
   const width=weights[k]/total*halfWidth*2,depth=.48+.13*hash(k,row+207),g=coloredStone(width-.012,h,depth,207901+row*23+k),p=g.attributes.position;
   // A continuous batter is retained across every separate closed block.
   for(let i=0;i<p.count;i++){const yy=(low+high)/2+p.getY(i);p.setZ(i,p.getZ(i)+frontAt(yy)-face);}
   g.computeVertexNormals();g.name='207-bonded-battered-terrace-course-'+row+'-'+k;emit(g,'supportStone207',x+width/2,(low+high)/2,face-depth/2,1,1,1,0,.78+.24*hash(row,k+31));records.push({row,x:[x,x+width],y:[low,high],front:[frontAt(low),frontAt(high)],depth,closed:true});x+=width;
  }
  // Full-depth corner stones and side returns actually close the terrace.
  for(const side of[-1,1]){const length=frontAt((low+high)/2)-back,n=Math.ceil(length/1.22);for(let j=0;j<n;j++){const d=length/n-.012,g=coloredStone(.48,h,d,208301+row*41+j+(side+1)*13);emit(g,'supportRecess207',side*(halfWidth-.24),(low+high)/2,back+length*(j+.5)/n,1,1,1,0,.84+.16*hash(j,row));}}
  low=high;
 }
 for(let i=0;i<15;i++){const width=halfWidth*2/15,g=coloredStone(width-.008,.18,.90,209001+i);emit(g,'supportStone207',-halfWidth+width*(i+.5),capY-.09,frontTop-.28);}
 // The complete upper bearing surface is continuous under the occupied hall.
 box(0,capY-.09,(back+frontTop-.40)/2,halfWidth*2-.30,.18,frontTop-.40-back,'supportCore207');
 const piers=[],brackets=[];for(let i=0;i<9;i++){const x=-8.20+i*2.05;for(const z of[2.10,3.55]){const top=.82,g=monolithicPier207(.66,.60,top-capY,.66,.60,209201+i*31+Math.round(z*100));emit(g,'supportStone207',x,(capY+top)/2,z);piers.push({x,z,bottom:capY,top,worldBottom:worldCap,worldTop:L.hall.position[1]+top*L.hall.scale[1],bearing:'Full dressed terrace cap; no individual rock pedestal'});}box(x,.97,2.65,.28,.30,6.90,'darkwood');
  const a=V([x,-.28,3.48]),b=V([x,.84,5.60]),d=b.clone().sub(a),g=new T.BoxGeometry(.20,d.length(),.20),q=new T.Quaternion().setFromUnitVectors(U,d.clone().normalize());g.name='207-closed-embedded-gallery-bracket-'+i;emit(g,'darkwood',...a.clone().add(b).multiplyScalar(.5).toArray(),1,1,1,q);brackets.push({lowerEmbedded:a.toArray(),upperBearing:b.toArray(),section:[.20,.20],beamBottom:.82,upperEmbed:.02});
 }
 box(0,.99,5.35,18.0,.26,.30,'darkwood');box(0,1.21,4.975,19.0,.18,2.35,'darkwood');
 return{revision:SUPPORT207_REVISION,top:1.30,worldBase,worldCap,retainingFront:{top:frontTop,toe:frontToe,batter:frontToe-frontTop},pierRows:[2.10,3.55],beamBottom:.82,beamTop:1.12,galleryFloor:{boundsZ:[3.8,6.15],bottom:1.12,top:1.30,projectionBeyondCap:2.18,bracketBearingZ:5.60,overhangBeyondBracket:.55},frontPiers:piers,brackets,stoneCourses:records,source:'Recessed closed battered terrace, six independently jointed bonded stone courses, continuous cap, short bearings and nine actual embedded gallery brackets. R03 tall repeated piers/rock feet and R04 flush heavy frontage retired.',oldFront20x12mCubeRemoved:true};
}

const pondControls207=[[-7.3,4.0],[-6.9,1.3],[-6.0,-1.3],[-5.25,-2.7],[-5.3,-5.9],[-4.1,-8.4],[-1.2,-9.4],[2.5,-10.3],[5.4,-12.0],[7.5,-12.7],[10.1,-10.9],[11.2,-7.4],[10.25,-4.3],[8.9,-1.7],[7.4,.8],[6.2,3.5],[4.1,5.6],[-1.0,5.9]],pondCurve207=new T.CatmullRomCurve3(pondControls207.map(([x,z])=>V([x,0,z])),true,'centripetal');
export const pondOutline207=Array.from({length:112},(_,i)=>{const p=pondCurve207.getPointAt(i/112);return[p.x,p.z];});
export function createPond207(){const g=footprint(pondOutline207,-.15,-.07);g.name='207-closed-irregular-garden-creek-basin';return g;}
export function createPondReflectionFootprint207(){const s=new T.Shape();pondOutline207.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const g=new T.ShapeGeometry(s);g.name='207-actual-bounded-creek-reflection-surface';return g;}
export function pondContains207(x,z){return inside([x,z],pondOutline207);}
export function pondShoreDistance207(x,z){let distance=Infinity;for(let i=0;i<pondOutline207.length;i++)distance=Math.min(distance,edgeDistance(x,z,pondOutline207[i],pondOutline207[(i+1)%pondOutline207.length]));return pondContains207(x,z)?-distance:distance;}
export function buildPondEdges207(api,plan,approach){
 let stones=0;for(let i=0;i<pondOutline207.length;i++){
  const a=pondOutline207[i],b=pondOutline207[(i+1)%pondOutline207.length],x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;
  if(z>=-1.8&&x>-4.65&&x<4.65||routeReserved207(x,z,plan,approach)||hash(i,207)<.28)continue;
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]),yaw=-Math.atan2(b[1]-a[1],b[0]-a[0]),g=coloredStone(Math.max(.12,length-.012),.18,.24,209101+i);api.emit(g,'supportStone207',x,.005,z,1,1,1,[0,yaw,0]);stones++;
 }
 return{closedStoneCoursePieces:stones,top:.095,width:.24,scope:'Low individual closed retaining-edge stones, intentionally interrupted where actual rock islands/plants or the continuous approach meet the water'};
}

export function buildFoundationRocks207(api,L,plan,scanned){
 // R04 deliberately retires the R03 repeated tall rock-per-pier lattice.
 // Real pad footings now bear the four stair piers; the hall bears on a
 // complete battered stone terrace. Original CC0 garden rocks stay in193.
 return{surfaces:[],materials:[],info:{revision:SUPPORT207_REVISION,records:[],retiredR03RockFeet:22,scope:'Hall retaining terrace and four closed bed-seated stair footing pads replace the repeated source-rock pedestal arrangement; no concealment plants added.'}};
}
