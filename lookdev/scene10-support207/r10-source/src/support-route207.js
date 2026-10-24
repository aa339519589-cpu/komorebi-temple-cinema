import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {bridgePoint125,bridgeToWorld125,hallToWorld125} from './layout125.js';
import {installSurfaceDetail} from './surface-detail.js';
import {createWornFlagstone} from './worn-flagstone.js';
import {towerBenchHeight210} from './rain-banks210.js';

const V=p=>new T.Vector3(...p),U=new T.Vector3(0,1,0),hash=(a,b)=>{const x=Math.sin(a*127.1+b*311.7+207.17)*43758.5453;return x-Math.floor(x);};
export const SUPPORT207_REVISION='scene10-rain210-coherent-islands-and-short-flight-r10';
export function installSupportMaterials207(m){
 m.supportStone207=new T.MeshPhysicalMaterial({name:'207-rain-dark-dressed-granite',map:m.granite.map,normalMap:m.granite.normalMap,normalScale:new T.Vector2(.70,.70),roughnessMap:m.granite.roughnessMap,color:'#7c8780',roughness:.84,metalness:0,clearcoat:.13,clearcoatRoughness:.30,vertexColors:true});installSurfaceDetail(m.supportStone207,'stone');
 m.supportCore207=new T.MeshStandardMaterial({name:'207-recessed-rubble-mortar-core',color:'#333a31',roughness:1});
 m.supportRecess207=m.supportStone207.clone();m.supportRecess207.name='207-shadowed-setback-stone';m.supportRecess207.color.set('#454d46');m.supportRecess207.roughness=.94;installSurfaceDetail(m.supportRecess207,'stone');
 m.routeStone207=m.supportStone207.clone();m.routeStone207.name='207-wet-worn-route-stone';m.routeStone207.color.set('#a4aaa2');m.routeStone207.roughness=.54;m.routeStone207.clearcoat=.34;m.routeStone207.clearcoatRoughness=.16;installSurfaceDetail(m.routeStone207,'stone');
 m.pathStone207=m.routeStone207.clone();m.pathStone207.name='207-dark-earth-bedded-worn-path-flags';m.pathStone207.color.set('#6c7771');m.pathStone207.roughness=.65;m.pathStone207.clearcoat=.24;m.pathStone207.clearcoatRoughness=.25;installSurfaceDetail(m.pathStone207,'stone');
}

function coloredStone(w,h,d,seed,toneScale=1){
 const g=new RoundedBoxGeometry(w,h,d,2,Math.min(.018,h*.06,w*.035,d*.035)),p=g.attributes.position,c=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=hash(Math.floor(x*31)+seed,Math.floor(z*37)+Math.floor(y*29)),edge=Math.max(Math.abs(x)/(w/2),Math.abs(z)/(d/2));if(edge>.82){p.setX(i,x*(1-.010*n));p.setZ(i,z*(1-.012*n));}const tone=toneScale*(.86+.22*hash(Math.floor(x*19)+seed,Math.floor(y*17)+Math.floor(z*23)));c.push(tone,tone,tone);}
 g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();g.name='207-closed-worn-bearing-stone-'+seed;return g;
}
function monolithicPier207(w0,w1,height,d0,d1,seed){const g=coloredStone(w0,height,d0,seed),p=g.attributes.position;for(let i=0;i<p.count;i++){const t=T.MathUtils.clamp((p.getY(i)+height/2)/height,0,1);p.setX(i,p.getX(i)*T.MathUtils.lerp(1,w1/w0,t));p.setZ(i,p.getZ(i)*T.MathUtils.lerp(1,d1/d0,t));}g.computeVertexNormals();g.name='207-closed-tapered-monolithic-bearing-pier-'+seed;return g;}

function solidProfile(points,width){
 const shape=new T.Shape();points.forEach(([a,y],i)=>i?shape.lineTo(a,y):shape.moveTo(a,y));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:width,steps:1,bevelEnabled:false});g.translate(0,0,-width/2);g.computeVertexNormals();return g;
}
function footprint(outline,bottom,top){const shape=new T.Shape();outline.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:top-bottom,steps:1,bevelEnabled:false});g.rotateX(-Math.PI/2);g.translate(0,bottom,0);g.computeVertexNormals();return g;}
function closedWornRouteFlag207(points,seed){
 // Reuse the authored millimetre wear field while closing every refined
 // cap-boundary edge. The older helper's coarse rim has T junctions where
 // its cap refines an edge; that rim is not used for the new route solids.
 const worn=createWornFlagstone(T,{points,seed}),outer=worn.userData.rainStoneFootprint,bottomFaces=T.ShapeUtils.triangulateShape(outer.map(p=>new T.Vector2(...p)),[]),p=worn.attributes.position,capCount=p.count-outer.length*12-bottomFaces.length*3,vertices=[],ids=[],map=new Map(),edges=new Map(),pos=[],uv=[];
 for(let i=0;i<capCount;i++){const q=[p.getX(i),p.getY(i),p.getZ(i)],key=q.map(v=>Math.round(v*1e6)).join(':');if(!map.has(key)){map.set(key,vertices.length);vertices.push(q);}ids.push(map.get(key));pos.push(...q);uv.push(q[0],-q[2]);}
 for(let i=0;i<ids.length;i+=3)for(let j=0;j<3;j++){const a=ids[i+j],b=ids[i+(j+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(':'),e=edges.get(key);if(e)e.count++;else edges.set(key,{a,b,count:1});}
 const boundary=[...edges.values()].filter(e=>e.count===1),unique=[...new Set(boundary.flatMap(e=>[e.a,e.b]))],center=[unique.reduce((s,i)=>s+vertices[i][0],0)/unique.length,-.09,unique.reduce((s,i)=>s+vertices[i][2],0)/unique.length],tri=(a,b,c)=>{for(const q of[a,b,c]){pos.push(...q);uv.push(q[0],-q[2]);}};
 for(const {a,b}of boundary){const A=vertices[a],B=vertices[b],lowA=[A[0],-.09,A[2]],lowB=[B[0],-.09,B[2]];tri(A,lowA,lowB);tri(A,lowB,B);tri(lowA,center,lowB);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.userData={surface:'207-closed-worn-route-flagstone',actualRefinedCapBoundaryEdges:boundary.length,source:'Existing authored wear field, new exactly shared boundary/side/bottom topology'};worn.dispose();return g;
}
function frameGeometry(g,origin,axis){const z=V([-axis[1],0,axis[0]]),x=V([axis[0],0,axis[1]]),mat=new T.Matrix4().makeBasis(x,U,z);mat.setPosition(...origin);g.applyMatrix4(mat);return g;}
function point(origin,axis,a,s=0,y=0){return[origin[0]+axis[0]*a-axis[1]*s,y,origin[2]+axis[1]*a+axis[0]*s];}
function inside(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++)if((poly[i][1]>p[1])!==(poly[j][1]>p[1])&&p[0]<(poly[j][0]-poly[i][0])*(p[1]-poly[i][1])/(poly[j][1]-poly[i][1])+poly[i][0])yes=!yes;return yes;}
function edgeDistance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
function ribbonRoute207(points,startTop,endTop,width){const curve=new T.CatmullRomCurve3(points.map(([x,z])=>V([x,0,z])),false,'centripetal'),samples=Array.from({length:25},(_,i)=>{const p=curve.getPointAt(i/24);p.y=T.MathUtils.lerp(startTop,endTop,T.MathUtils.smoothstep(i/24,.03,.94));return p;}),outline=[];for(const side of[-1,1]){const a=[];for(let i=0;i<samples.length;i++){const p=samples[i],d=curve.getTangentAt(i/(samples.length-1)).normalize();a.push([p.x-d.z*width/2*side,p.z+d.x*width/2*side]);}outline.push(...(side===-1?a:a.reverse()));}return{points,outline,samples:samples.map(p=>p.toArray()),width,topRange:[startTop,endTop]};}

export function createApproachPlan207(L){
 // The bridge datum stays fixed. The photograph's short flight rises from
 // the lantern island, not from the distant forecourt/water-bed elevation.
 const end=bridgeToWorld125(bridgePoint125(0)),axis=[Math.cos(L.bridge.yaw),-Math.sin(L.bridge.yaw)],run=L.bridge.approachCount*L.bridge.approachRun,start=[end[0]-axis[0]*run,L.bridge.approachGroundY,end[2]-axis[1]*run],width=1.84,count=L.bridge.approachCount,rise=end[1]-start[1],steps=[];
 for(let i=0;i<count;i++){const a=run*i/count,b=run*(i+1)/count,top=start[1]+rise*(i+1)/count;steps.push({index:i,along:[a,b],top,undersideFront:start[1]+rise*i/count-.22,undersideBack:top-.22,riser:rise/count,tread:run/count});}
 const landingEnd=[start[0]-axis[0]*.33,start[1],start[2]-axis[1]*.33],route=[[-3.84,-1.72],[-4.10,-2.54],[-4.08,-3.70],[landingEnd[0],landingEnd[2]]];
 const rearTop=towerBenchHeight210(-3.165,-8.04,.5634)+.086,frontRoute=ribbonRoute207(route,L.groundY,start[1],.96),rearRoute=ribbonRoute207([[landingEnd[0],landingEnd[2]],[-4.08,-5.62],[-3.92,-6.80],[-3.165,-7.71]],start[1],rearTop,1.10);
 return{revision:SUPPORT207_REVISION,start,end,axis,run,width,count,rise,riser:rise/count,tread:run/count,steps,bottomLanding:{center:landingEnd,along:[-.66,0],width:1.90,top:start[1]},island:{lanternCenter:L.heroStoneLantern.position,terrainCrest:.58,lanternSoilCrest:.20,closedStonePlinthTop:.65,stoneSupportTop:L.heroStoneLantern.supportTop,source:'Continuous physical soil island and worn stone path; lantern anchor and bridge endpoint unchanged'},route:{...frontRoute,source:'Narrow worn stone ramp around the lantern island, bedded on actual connected earth; compact landing and four real upper steps'},rearRoute:{...rearRoute,source:'Rear branch meets the actual front edge of surviving tower walk slab index7, with a 10mm lap; seven inherited low slabs crossing the lantern/stair island retired'}};
}

function nearestRoute207(x,z,approach){let best=null;for(const route of[approach.route,approach.rearRoute]){const p=route.samples;for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1],dx=b[0]-a[0],dz=b[2]-a[2],t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz),0,1),distance=Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz);if(!best||distance<best.distance)best={distance,top:T.MathUtils.lerp(a[1],b[1],t),width:route.width};}}return best;}

export function nearRouteGround207(x,z,a){
 const dx=x-a.start[0],dz=z-a.start[2],u=dx*a.axis[0]+dz*a.axis[1],v=-dx*a.axis[1]+dz*a.axis[0];
 if(u>=-.71&&u<=a.run+.12&&Math.abs(v)<a.width/2+.32)return a.start[1]-.13;
 const q=nearestRoute207(x,z,a);return q.distance<q.width/2+.32?q.top-.13:null;
}

export function nearIslandHeight207(x,z,a){
 if(x< -5.7||x>-.9||z< -8.8||z>-.9)return null;
 const a0=Math.atan2((z+3.18)/1.55,(x+2.86)/1.50),a1=Math.atan2((z+4.55)/1.30,(x+3.42)/1.45),r0=Math.hypot((x+2.86)/1.50,(z+3.18)/1.55)/(1+.09*Math.sin(a0*5+.4)+.05*Math.sin(a0*9-1)),r1=Math.hypot((x+3.42)/1.45,(z+4.55)/1.30)/(1+.07*Math.sin(a1*7+.8)),r=Math.min(r0,r1),shore=T.MathUtils.smoothstep(r,.34,.87),bench=1-shore,erosion=(.05*Math.sin(x*6.1+z*4.3)+.03*Math.cos(z*8.2-x*3.1))*4*bench*(1-bench),island=-.22+.80*bench+erosion;
 const lowLanternSoil=-.22+.42*(1-T.MathUtils.smoothstep(r0,.28,.85)),stairSoil=-.22+.80*(1-T.MathUtils.smoothstep(r1,.34,.87));const bed=nearRouteGround207(x,z,a);return Math.max(lowLanternSoil,stairSoil,bed??-.22);
}

export function hallShoreHeight207(x,z,L){
 const h=L.hall,c=Math.cos(h.yaw),s=Math.sin(h.yaw),dx=x-h.position[0],dz=z-h.position[2],lx=(c*dx-s*dz)/h.scale[0],lz=(s*dx+c*dz)/h.scale[2];
 if(Math.abs(lx)>10.5||lz<2.7||lz>7.5)return null;
 const shoulder=4.05+.18*Math.sin(lx*.71)+.12*Math.sin(lx*1.67),distance=lz-shoulder,t=T.MathUtils.smoothstep(distance,.02,.96),side=1-T.MathUtils.smoothstep(Math.abs(lx),9.15,10.5),height=1.25+.19*Math.sin(lx*.56+.7)+.12*Math.cos(lx*1.31),fracture=(.11*Math.sin(lx*3.1+lz*4.7)+.075*Math.sin(lx*5.9-lz*2.8))*(1-Math.abs(2*t-1));
 return -.22+((height+.22)*(1-t)+fracture)*side;
}

export function routeReserved207(x,z,plan,approach){
 const a=approach,dx=x-a.start[0],dz=z-a.start[2],along=dx*a.axis[0]+dz*a.axis[1],side=-dx*a.axis[1]+dz*a.axis[0];
 if(along>=-.71&&along<=a.run+.08&&Math.abs(side)<a.width/2+.10)return true;
 for(const r of[a.route,a.rearRoute])if(inside([x,z],r.outline)||r.outline.some((p,i)=>edgeDistance(x,z,p,r.outline[(i+1)%r.outline.length])<.1))return true;
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
 const out={revision:SUPPORT207_REVISION,bridgeEndSupports:supports,nearApproach:emitFlight(api,approach,'near-bridge-approach'),hallStair:emitFlight(api,{...plan,axis:plan.unit},'hall-flight'),before:{nearDeckY:1.47,farDeckY:2.0,span:10.3,turningArea:12.25,hallStairWidth:2.9,hallStepCount:12,hallTread:.20168934999,oldStepBottom:-.18,oldBankWidth:7.1,r06NearCount:9,r06NearRun:2.52,r06NearFootY:.067,r06BottomLandingRun:1.52},after:{nearDeckY:near[1],farDeckY:far[1],span:L.bridge.span,turningOutline:plan.turningLanding.outline,hallStairWidth:plan.width,hallRiser:plan.rise/plan.count,hallTread:plan.run/plan.count,nearRiser:approach.riser,nearTread:approach.tread,nearFootY:approach.start[1],nearRun:approach.run,nearStepCount:approach.count,bottomLandingRun:.66},why:'Bridge and lantern datums held. The former long low flight/causeway is replaced by a raised physical island, compact foot landing, short four-step flight and narrow earth-bedded route around the lantern.'};
 // Compact polygon turn, carried on two actual stone piers and a crosshead.
 emit(footprint(plan.turningLanding.outline,far[1]-.18,far[1]),'routeStone207');
 const upper=plan.upperLanding;emit(footprint(upper.outline,upper.top-.24,upper.top),'routeStone207');out.upperLanding={...upper,actualBottom:upper.top-.24,bearing:'Front edge on last actual wedge tread/bed; back corners lap the supported hall gallery floor'};
 for(const sign of[-1,1]){const p=[far[0]+B[0]*sign*.90+A[0]*.35,far[2]+B[1]*sign*.90+A[1]*.35],r=pier(api,p,far[1]-.42,207200+(sign+1)*29,A);supports.push(r);}
 const yaw=-Math.atan2(A[1],A[0]),cross=coloredStone(.38,.24,2.62,207271);emit(cross,'darkwood',far[0]+A[0]*.35,far[1]-.30,far[2]+A[1]*.35,1,1,1,[0,yaw,0]);
 // Near bridge bearing is a real capped abutment, attached to the flight head.
 for(const sign of[-1,1])pier(api,[near[0]+B[0]*sign*.76-A[0]*.08,near[2]+B[1]*sign*.76-A[1]*.08],near[1]-.42,207401+(sign+1)*31,A);
 const nc=coloredStone(.30,.24,2.35,207491);emit(nc,'darkwood',near[0]-.08*A[0],near[1]-.30,near[2]-.08*A[1],1,1,1,[0,yaw,0]);
 // Thin closed paving sits on the actual raised soil island. It no longer
 // forms a broad isolated solid platform down to the creek bed.
 const start=approach.start,w=approach.width/2+.03,lower=[point(start,A,-.66,-w,0),point(start,A,0,-w,0),point(start,A,0,w,0),point(start,A,-.66,w,0)].map(p=>[p[0],p[2]]);emit(footprint(lower,start[1]-.13,start[1]),'routeStone207');
 out.routePavers207=[];for(const [routeIndex,route]of[approach.route,approach.rearRoute].entries()){
  const samples=route.samples;
  for(let i=0;i<samples.length-1;i+=4){
   const end=Math.min(samples.length-1,i+4),sides=[];
   for(const side of[-1,1]){const edge=[];for(let j=i;j<=end;j++){const P=V(samples[j]),before=V(samples[Math.max(0,j-1)]),after=V(samples[Math.min(samples.length-1,j+1)]),d=after.sub(before);d.y=0;d.normalize();const n=V([-d.z,0,d.x]),half=route.width/2*(.97+.03*hash(routeIndex+207,j));P.addScaledVector(n,side*half);if(j===i)P.addScaledVector(d,.006);if(j===end)P.addScaledVector(d,-.006);edge.push([P.x,P.z]);}sides.push(side===-1?edge:edge.reverse());}
   const seed=208701+routeIndex*31+i,g=closedWornRouteFlag207(sides.flat(),seed),p=g.attributes.position,c=[],blockTone=.79+.22*hash(seed,4);
   for(let k=0;k<p.count;k++){const x=p.getX(k),z=p.getZ(k),top=nearestRoute207(x,z,approach).top;p.setY(k,p.getY(k)-.046+top);const tone=blockTone*(.88+.18*hash(Math.floor(x*31)+seed,Math.floor(z*37)));c.push(tone,tone,tone);}
   g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeVertexNormals();g.name='207-closed-earth-bedded-worn-path-flag-'+routeIndex+'-'+i;emit(g,'pathStone207');out.routePavers207.push({route:routeIndex,sampleSpan:[i,end],width:route.width,nominalThickness:.14,actualWornCrownHollowsAndEdgeSpalls:true,blockTone,physicalJoint:.012});
  }
 }
 // Two short guards share the near bridge post/rail datums. The low route
 // remains open beside the lantern; no guard is planted in the creek.
 for(const sign of[-1,1]){
  const pts=[];for(let i=0;i<=4;i++){const t=i/4,side=sign*T.MathUtils.lerp(.84,1.10,t),p=point(start,A,approach.run*t,side,start[1]+approach.rise*t);pts.push(p);if(i===0||i===2){box(p[0],p[1]+.52,p[2],.13,1.04,.13,'red');}}
  for(const h of[.25,.6,1.0])tube(pts.map(p=>[p[0],p[1]+h,p[2]]),.055,'red');
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
 // Individually closed irregular ashlar. Each horizontal joint changes
 // height across the wall and stones span different joint vertices. This
 // retires R06's six uninterrupted ruler-straight brick bands.
 const cols=40,rows=6,dx=halfWidth*2/cols,joints=Array.from({length:rows+1},(_,r)=>Array.from({length:cols+1},(_,k)=>r===0?minY:r===rows?bodyTop:T.MathUtils.lerp(minY,bodyTop,r/rows)+.14*(hash(r*19,k)-.5)+.045*Math.sin(k*1.7+r)));
 for(let row=0;row<rows;row++){
  let k=0,stone=0;while(k<cols){const span=Math.min(cols-k,2+Math.floor(hash(row+207,k)*3)),end=k+span,poly=[];
   for(let i=k;i<=end;i++)poly.push([-halfWidth+dx*i+(i===k?.006:i===end?-.006:0),joints[row][i]+.006]);
   for(let i=end;i>=k;i--)poly.push([-halfWidth+dx*i+(i===k?.006:i===end?-.006:0),joints[row+1][i]-.006]);
   const seed=207901+row*43+stone,depth=.48+.18*hash(k,row+207),g=solidProfile(poly,depth),p=g.attributes.position,color=[],blockTone=.62+.40*hash(seed,8),faceRelief=.055*(hash(seed,4)-.5);
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),tone=blockTone*(.89+.17*hash(Math.floor(x*23)+seed,Math.floor(y*37)));p.setZ(i,z+frontAt(y)-depth/2+faceRelief);color.push(tone,tone,tone);}
   g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.computeVertexNormals();g.name='207-closed-irregular-bonded-ashlar-'+row+'-'+stone;emit(g,'supportStone207');records.push({row,x:[-halfWidth+dx*k,-halfWidth+dx*end],bottomProfile:joints[row].slice(k,end+1),topProfile:joints[row+1].slice(k,end+1),depth,faceRelief,blockTone,closed:true});k=end;stone++;
  }
  // Deep side returns remain real closed bearing masonry behind the bank.
  const low=T.MathUtils.lerp(minY,bodyTop,row/rows),high=T.MathUtils.lerp(minY,bodyTop,(row+1)/rows),h=high-low-.009;
  for(const side of[-1,1]){const length=frontAt((low+high)/2)-back,n=Math.ceil(length/1.22);for(let j=0;j<n;j++){const d=length/n-.012,g=coloredStone(.48,h,d,208301+row*41+j+(side+1)*13,.68+.22*hash(j,row));emit(g,'supportRecess207',side*(halfWidth-.24),(low+high)/2,back+length*(j+.5)/n);}}
 }
 for(let i=0;i<15;i++){const width=halfWidth*2/15,g=coloredStone(width-.008,.18,.90,209001+i);emit(g,'supportStone207',-halfWidth+width*(i+.5),capY-.09,frontTop-.28);}
 // The complete upper bearing surface is continuous under the occupied hall.
 box(0,capY-.09,(back+frontTop-.40)/2,halfWidth*2-.30,.18,frontTop-.40-back,'supportCore207');
 const piers=[],brackets=[];for(let i=0;i<9;i++){const x=-8.20+i*2.05;for(const z of[2.10,3.55]){const top=.82,g=monolithicPier207(.66,.60,top-capY,.66,.60,209201+i*31+Math.round(z*100));emit(g,'supportStone207',x,(capY+top)/2,z);piers.push({x,z,bottom:capY,top,worldBottom:worldCap,worldTop:L.hall.position[1]+top*L.hall.scale[1],bearing:'Full dressed terrace cap; no individual rock pedestal'});}box(x,.97,2.65,.28,.30,6.90,'darkwood');
  const a=V([x,-.28,3.48]),b=V([x,.84,5.60]),d=b.clone().sub(a),g=new T.BoxGeometry(.20,d.length(),.20),q=new T.Quaternion().setFromUnitVectors(U,d.clone().normalize());g.name='207-closed-embedded-gallery-bracket-'+i;emit(g,'darkwood',...a.clone().add(b).multiplyScalar(.5).toArray(),1,1,1,q);brackets.push({lowerEmbedded:a.toArray(),upperBearing:b.toArray(),section:[.20,.20],beamBottom:.82,upperEmbed:.02});
 }
 box(0,.99,5.35,18.0,.26,.30,'darkwood');box(0,1.21,4.975,19.0,.18,2.35,'darkwood');
 return{revision:SUPPORT207_REVISION,top:1.30,worldBase,worldCap,retainingFront:{top:frontTop,toe:frontToe,batter:frontToe-frontTop},pierRows:[2.10,3.55],beamBottom:.82,beamTop:1.12,galleryFloor:{boundsZ:[3.8,6.15],bottom:1.12,top:1.30,projectionBeyondCap:2.18,bracketBearingZ:5.60,overhangBeyondBracket:.55},frontPiers:piers,brackets,stoneCourses:records,shore:{kind:'Actual connected terrain rises into the lower masonry; broken shoulder follows the hall transform',crestWorldYRange:[.94,1.56],toeRunLocal:.96,newConcealmentPlants:0},source:'Recessed closed battered terrace with independently weathered irregular ashlar, broken joint heights, continuous cap and unchanged actual short bearings/gallery brackets. A real sloping soil/mineral bank embeds the lower courses.',oldFront20x12mCubeRemoved:true};
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
 // Irregular mineral exposures belong to the physical bank. They do not
 // replace the terrace or serve as a repeated rock under each pier.
 const surfaces=[],records=[],approach=createApproachPlan207(L),materials=scanned.variants.map((s,i)=>{const m=s.wet.clone();m.name='207-dark-porous-seated-bank-mineral-'+i;m.color.set('#6f786a');m.roughness=.89;m.clearcoat=.12;m.clearcoatRoughness=.36;m.envMapIntensity=.42;if(m.normalScale)m.normalScale.set(.90,.90);return m;});
 const place=(kind,x,z,variant,size,rotation,ground,burialRatio,localPlan=null)=>{
  const scan=scanned.variants[variant],q=new T.Quaternion().setFromEuler(new T.Euler(...rotation)),matrix=new T.Matrix4().compose(V([0,0,0]),q,V([size,size,size])),bounds=new T.Box3().setFromBufferAttribute(scan.geometry.attributes.position).applyMatrix4(matrix),burial=(bounds.max.y-bounds.min.y)*burialRatio,y=ground-burial-bounds.min.y;
  const corners=[[bounds.min.x,bounds.min.z],[bounds.max.x,bounds.min.z],[bounds.max.x,bounds.max.z],[bounds.min.x,bounds.max.z],[0,0]];
  if(corners.some(([xx,zz])=>routeReserved207(x+xx,z+zz,plan,approach)))return;
  if(kind==='Lantern-island mineral toe'&&bounds.max.z+z>=-2.12)return;
  api.emit(scan.geometry,materials[variant],x,y,z,size,size,size,rotation);
  const mesh=new T.Mesh(scan.geometry,materials[variant]);mesh.position.set(x,y,z);mesh.quaternion.copy(q);mesh.scale.setScalar(size);mesh.updateMatrixWorld(true);surfaces.push(mesh);records.push({kind,localPlan,position:[x,y,z],variant,uniformScale:size,rotation,terrainY:ground,bottom:y+bounds.min.y,top:y+bounds.max.y,burial,burialRatio,worldBounds:[[x+bounds.min.x,y+bounds.min.y,z+bounds.min.z],[x+bounds.max.x,y+bounds.max.y,z+bounds.max.z]],originalGeometryUVNormals:true});
 };
 for(const [lx,lz,variant,size,rx,ry,rz]of[[-8.2,6.1,3,1.10,.12,.30,-.10],[-6.0,6.85,0,.80,-.10,1.20,.08],[-4.7,5.6,5,.95,.16,-.44,-.05],[-.7,6.25,1,1.00,-.08,2.02,.14],[1.8,7.1,4,.85,.11,-1.06,-.12],[4.0,6.2,2,1.10,-.14,.75,.06],[6.4,6.8,0,.90,.08,2.44,-.15],[8.1,6.8,5,.80,-.12,-.82,.10]]){
  const [x,,z]=hallToWorld125([lx,0,lz]);place('Deep-seated hall bank outcrop, not structural pier footing',x,z,variant,size,[rx,ry+L.hall.yaw,rz],hallShoreHeight207(x,z,L)??-.22,.58+.06*hash(lx,lz),[lx,lz]);
 }
 for(const [x,z,variant,size,rotation]of[[-3.28,-2.66,0,.38,[.08,.42,-.06]],[-2.25,-2.90,4,.44,[-.10,-.68,.09]]])place('Lantern-island mineral toe',x,z,variant,size,rotation,nearIslandHeight207(x,z,approach)??-.22,.64);
 return{surfaces,materials,info:{revision:SUPPORT207_REVISION,records,retiredR03RockFeet:22,scope:'Original CC0 rigid mineral pieces deeply buried at the eroded bank toes. Independent of terrace/piers, with actual transformed root-support surfaces. R08 oversized bright high-shoulder poses retired. No new authored plant-placement loops; existing procedural acceptance/rooting may change.'}};
}
