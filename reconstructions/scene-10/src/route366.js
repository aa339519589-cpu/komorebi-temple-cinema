import * as T from 'three';
import {scene10Layout125 as L,bridgePoint125 as P,bridgeToWorld125} from './layout125.js';
import {createLaidRainStones321,auditGround321} from './ground321.js';

// RainHD10 construction only. Every plan coordinate is supplied by scene10;
// none of the sunset scene01 layout, camera, materials or lighting is reused.
const V=p=>new T.Vector3(...p),UP=V([0,1,0]),hash=(a,b)=>{const n=Math.sin(a*127.1+b*311.7+366.17)*43758.5453;return n-Math.floor(n);};
const area=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2;
function metric(g){const raw=g.index?g.toNonIndexed():g,p=raw.attributes.position,uv=[];for(let i=0;i<p.count;i+=3){const a=V([p.getX(i),p.getY(i),p.getZ(i)]),b=V([p.getX(i+1),p.getY(i+1),p.getZ(i+1)]),c=V([p.getX(i+2),p.getY(i+2),p.getZ(i+2)]),n=b.sub(a).cross(c.sub(a));for(let j=i;j<i+3;j++)if(Math.abs(n.y)>Math.max(Math.abs(n.x),Math.abs(n.z)))uv.push(p.getX(j),-p.getZ(j));else if(Math.abs(n.x)>Math.abs(n.z))uv.push(p.getZ(j),p.getY(j));else uv.push(p.getX(j),p.getY(j));}raw.setAttribute('uv',new T.Float32BufferAttribute(uv,2));raw.computeVertexNormals();if(raw!==g)g.dispose();return raw;}
function solid(poly,lo,hi,name){
 if(area(poly)<0)poly=[...poly].reverse();const p=[],ix=[],N=poly.length;
 for(const y of[lo,hi])for(const q of poly)p.push(q[0],typeof y==='function'?y(q):y,q[1]);
 const cap=T.ShapeUtils.triangulateShape(poly.map(p=>new T.Vector2(...p)),[]);
 for(const[a,b,c]of cap)ix.push(a,c,b,a+N,b+N,c+N);
 for(let i=0;i<N;i++){const j=(i+1)%N;ix.push(i,j,i+N,j,j+N,i+N);}
 let volume=0;for(let i=0;i<ix.length;i+=3)volume+=V(p.slice(ix[i]*3,ix[i]*3+3)).dot(V(p.slice(ix[i+1]*3,ix[i+1]*3+3)).cross(V(p.slice(ix[i+2]*3,ix[i+2]*3+3))))/6;
 if(volume<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.name='366-closed-'+name;g.userData={route366:true,closedVolume:Math.abs(volume)};return metric(g);
}
const at=(o,a,u,v,y)=>[o[0]+a[0]*u-a[1]*v,y,o[2]+a[1]*u+a[0]*v];
function clip(poly,k,value,sign){const out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],a=sign*(p[k]-value),b=sign*(q[k]-value);if(a>=0)out.push(p);if((a>=0)!==(b>=0)){const t=a/(a-b);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}}return out;}

function arch(api,a,b,z,w,top,bottom,mat,name){
 const n=Math.max(2,Math.ceil((b-a)*L.bridge.span/.09)),outline=[];
 for(let i=0;i<=n;i++){const p=P(a+(b-a)*i/n);outline.push([p[0],p[1]+top]);}
 for(let i=n;i>=0;i--){const p=P(a+(b-a)*i/n);outline.push([p[0],p[1]+bottom]);}
 const shape=new T.Shape();outline.forEach((p,i)=>i?shape.lineTo(...p):shape.moveTo(...p));shape.closePath();
 const g=new T.ExtrudeGeometry(shape,{depth:w-.004,steps:1,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:2});g.translate(0,0,z-w/2+.002);g.name='366-closed-'+name;g.userData={route366:true,physicalArch:true};api.emit(g,mat);
}

// A rectangular closed timber sweep replaces round pipes. Each real rail is
// fitted between post centres; the deck remains a separately carried arch.
export function rail366(emit,points,width=.10,height=.075,material='red'){
 if(points.every(p=>V(p).distanceTo(V(points[0]))<.00001))return;
 const curve=new T.CatmullRomCurve3(points.map(V),false,'centripetal'),N=Math.max(2,Math.ceil(curve.getLength()/.09)),p=[],ix=[];
 for(let i=0;i<=N;i++){const q=curve.getPointAt(i/N),d=curve.getTangentAt(i/N).setY(0).normalize(),side=V([-d.z,0,d.x]);for(const[v,y]of[[-1,-1],[1,-1],[1,1],[-1,1]])p.push(...q.clone().addScaledVector(side,v*width/2).addScaledVector(UP,y*height/2).toArray());}
 for(let i=0;i<N;i++)for(let k=0;k<4;k++){const a=i*4+k,b=i*4+(k+1)%4;ix.push(a,b,a+4,b,b+4,a+4);}const n=N*4;ix.push(0,2,1,0,3,2,n,n+1,n+2,n,n+2,n+3);
 let volume=0;for(let i=0;i<ix.length;i+=3)volume+=V(p.slice(ix[i]*3,ix[i]*3+3)).dot(V(p.slice(ix[i+1]*3,ix[i+1]*3+3)).cross(V(p.slice(ix[i+2]*3,ix[i+2]*3+3))))/6;if(volume<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.name='366-closed-rectangular-housed-route-rail';g.userData={route366:true,physicalSection:[width,height]};emit(metric(g),material);
}

export function buildRainBridge366(api){
 const {emit,box,group,between}=api,b=L.bridge;
 group(...b.position,b.yaw,()=>{
  for(const z of[-.98,0,.98])arch(api,0,1,z,.20,-.18,-.48,'darkwood','continuous-asymmetric-rain-bridge-girder');
  for(let j=0;j<43;j++){const a=j/43+.00015,c=(j+1)/43-.00015;arch(api,a,c,0,2.35,0,-b.deckThickness,'cedar','seated-transverse-rain-deck-flag');}
  for(const side of[-1,1]){
   for(const[a,c]of[[0,1/3],[1/3,2/3],[2/3,1]]){arch(api,a+.00015,c-.00015,side*1.12,.08,-.13,-.36,'red','scarfed-upper-vermilion-arch-board');arch(api,a+.00015,c-.00015,side*1.115,.075,-.365,-.48,'darkwood','recessed-lower-arch-board');}
   arch(api,0,1,side*1.17,.022,-.138,-.162,'cedar','continuous-arch-weather-edge');
   const end=side<0?b.exitRailCutT:1,start=side>0?b.entryFlatT||0:0,stations=[...new Set([0,...Array.from({length:10},(_,i)=>i/9).filter(t=>t<end-1e-8&&(t===0||t>=start)),...(start>0?[start]:[]),end])].sort((a,b)=>a-b);
   for(const t0 of stations){const t=side>0&&t0===0?b.entryFirstPostT||0:t0,p=P(t,side*1.10);box(p[0],p[1]+.50,p[2],.145,1.04,.145,'red');emit(new T.LatheGeometry([[0,0],[.08,0],[.085,.025],[.057,.05],[.057,.092],[.070,.13],[.051,.17],[0,.19]].map(p=>new T.Vector2(...p)),24),'oldgold',p[0],p[1]+1.02,p[2]);}
   const actual=stations.filter(t=>t>=start-1e-8);for(let i=0;i<actual.length-1;i++)for(const[h,w,d]of[[.25,.085,.075],[.60,.095,.078],[1.0,.115,.085]])rail366(emit,Array.from({length:9},(_,k)=>P(actual[i]+(actual[i+1]-actual[i])*k/8,side*1.10,h)),w,d,'red');
  }
  // Lower cross ties bear against all three main arches, with visible short
  // ends. They are timber assemblies, not extra columns in the water.
  for(let i=1;i<8;i++){const t=i/8,p=P(t),g=new T.BoxGeometry(.13,.13,2.48);emit(g,'darkwood',p[0],p[1]-.48,0);}
  for(const t of[.22,.50,.78]){const p=P(t,1.205,-.29);emit(new T.TorusGeometry(.105,.010,7,32),'oldgold',...p);for(let k=0;k<8;k++){const a=k*Math.PI/4;emit(new T.SphereGeometry(1,8,6),'oldgold',p[0]+Math.cos(a)*.061,p[1]+Math.sin(a)*.061,p[2]+.008,.034,.014,.010,[0,0,a]);}}
 });
 return{revision:'route366-r04',nearDeckY:b.position[1]+P(0)[1],farDeckY:b.position[1]+P(1)[1],actualScene10Curve:true,carryingGirders:3,deckFlags:43,rectangularRails:true,originalRainMaterialsRetained:true,photographicAccepted:false};
}

export function buildStoneFlight366(api,spec,key){
 const {emit}=api,o=spec.start,a=spec.axis||spec.unit,floor=u=>o[1]+spec.rise*T.MathUtils.clamp(u/spec.run,0,1),world=poly=>poly.map(([u,v])=>{const p=at(o,a,u,v,0);return[p[0],p[2]];}),along=q=>(q[0]-o[0])*a[0]+(q[1]-o[2])*a[1],records=[];
 const left=(u,i)=>spec.stepClipX?Math.max(-spec.width/2,(spec.stepClipX[i]-o[0]-a[0]*u)/(-a[1])):-spec.width/2;
 for(const s of spec.steps){const u0=s.along?s.along[0]:spec.run*s.index/spec.count,u1=s.along?s.along[1]:spec.run*(s.index+1)/spec.count,top=s.top;
  const body=world([[u0+.014,left(u0+.014,s.index)],[u1,left(u1,s.index)],[u1,spec.width/2],[u0+.014,spec.width/2]]);emit(solid(body,q=>floor(along(q))-.50,top-.075,key+'-seated-setback-riser-'+s.index),'supportStone207');
  const bed=world([[u0,left(u0,s.index)],[u1,left(u1,s.index)],[u1,spec.width/2],[u0,spec.width/2]]);emit(solid(bed,q=>floor(along(q))-.53,q=>floor(along(q))-.50,key+'-continuous-mineral-bearing-bed-'+s.index),'supportCore207');
  const cap=[[u0-.025,left(u0-.025,s.index)],[u1,left(u1,s.index)],[u1,spec.width/2],[u0-.025,spec.width/2]],N=spec.width>1.8?3:2,lo=Math.min(...cap.map(p=>p[1])),hi=spec.width/2;
  for(let i=0;i<N;i++){let cell=clip(clip(cap,1,lo+(hi-lo)*i/N+.0015,1),1,lo+(hi-lo)*(i+1)/N-.0015,-1);if(cell.length<3||Math.abs(area(cell))<.01)continue;const laid=createLaidRainStones321({points:world(cell),seed:366071+s.index*37+i*83+(key==='hall-flight'?71:0),id:key+'-'+s.index+'-'+i});
   for(const f of laid.fragments){const g=f.geometry,p=g.attributes.position;for(let j=0;j<p.count;j++)p.setY(j,top+(p.getY(j)-.0485)*(.075/.1405));g.computeVertexNormals();g.name='366-closed-individual-riven-'+key+'-tread-flag';g.userData={route366:true,ground321Audit:auditGround321(g),seatedFlagThickness:.075,noseProjection:.039,wearSource:'Existing scene10 closed cap, shared stone edges and sparse physical chips; no new material or reflection response'};emit(g,'routeStone207',0,0,0,1,1,1,0,.93+.11*hash(s.index,i));f.water?.dispose();}
  }
  records.push({index:s.index,top,front:at(o,a,u0,0,top),back:at(o,a,u1,0,top),closed:true,nosing:.039});
 }
 for(const side of[-1,1])for(let k=0;k<3;k++){const u0=spec.run*k/3+.002,u1=spec.run*(k+1)/3-.002,inner=side*(spec.width/2+.015),outer=side*(spec.width/2+.175),poly=world([[u0,inner],[u1,inner],[u1,outer],[u0,outer]]);emit(solid(poly,q=>floor(along(q))-.50,q=>floor(along(q))+.09,key+'-raking-bearing-cheek-'+k),'supportStone207');emit(solid(poly,q=>floor(along(q))+.09,q=>floor(along(q))+.16,key+'-riven-raking-coping-'+k),'routeStone207');}
 if(key==='hall-flight'){
  for(const v of[-.82,0,.82]){const poly=world([[0,v-.085],[spec.run,v-.085],[spec.run,v+.085],[0,v+.085]]);emit(solid(poly,q=>floor(along(q))-.70,q=>floor(along(q))-.53,'hall-flight-seated-inclined-timber-stringer'),'darkwood');}
  for(const u of[0,spec.run]){const f=floor(u),cross=world([[u-.12,-1.16],[u+.12,-1.16],[u+.12,1.16],[u-.12,1.16]]);emit(solid(cross,f-.86,f-.70,'hall-flight-short-bent-crosshead'),'darkwood');for(const v of[-.82,.82]){const cap=world([[u-.32,v-.31],[u+.32,v-.31],[u+.32,v+.31],[u-.32,v+.31]]),post=world([[u-.12,v-.12],[u+.12,v-.12],[u+.12,v+.12],[u-.12,v+.12]]);emit(solid(cap,f-1.35,f-1.20,'hall-flight-bank-embedded-stone-shoe'),'supportStone207');emit(solid(post,f-1.20,f-.86,'hall-flight-short-stone-seated-timber-bent'),'darkwood');}}
 }
 return{revision:'route366-r04',steps:records,closed:true,individuallyClosedWornFlags:true,noseProjection:.039,flagThickness:.075,bankBedded:true,oldHallFlightTrestlesRemoved:key==='hall-flight',shortStoneSeatedBentCount:key==='hall-flight'?2:0};
}

export function createStairBearingBank366(plan){
 const o=plan.start,a=plan.unit,front=-.52,back=plan.run+.62,width=1.68,ground=-.22;
 const floor=u=>o[1]+plan.rise*T.MathUtils.clamp(u/plan.run,0,1),height=(u,v)=>{
  const gate=T.MathUtils.smoothstep(u,front,-.12)*(1-T.MathUtils.smoothstep(u,back-.20,back)),edge=T.MathUtils.clamp((Math.abs(v)-1.10)/(width-1.10),0,1),terrace=1-.43*T.MathUtils.smoothstep(edge,.05,.40)-.57*T.MathUtils.smoothstep(edge,.52,1),ridge=floor(u)-1.25;
  return ground+Math.max(0,ridge-ground)*gate*terrace+.022*Math.sin(u*7.3+v*4.1)*gate*terrace*T.MathUtils.smoothstep(Math.abs(v),1.10,1.22);
 },atBank=(u,v)=>at(o,a,u,v,height(u,v)),p=[],uv=[],ix=[],N=56,M=42;
 for(let j=0;j<=N;j++)for(let i=0;i<=M;i++){const u=front+(back-front)*j/N,v=-width+2*width*i/M;p.push(...atBank(u,v));uv.push(u,v);}
 for(let j=0;j<N;j++)for(let i=0;i<M;i++){const n=j*(M+1)+i;ix.push(n,n+1,n+M+1,n+1,n+M+2,n+M+1);}
 const edge=[...Array.from({length:M+1},(_,i)=>i),...Array.from({length:N},(_,j)=>(j+1)*(M+1)+M),...Array.from({length:M},(_,i)=>N*(M+1)+M-1-i),...Array.from({length:N-1},(_,j)=>(N-1-j)*(M+1))],bottom=[];
 for(const n of edge){bottom.push(p.length/3);p.push(p[n*3],-.38,p[n*3+2]);uv.push(0,0);}for(let i=0;i<edge.length;i++){const j=(i+1)%edge.length;ix.push(edge[i],bottom[i],edge[j],edge[j],bottom[i],bottom[j]);}
 const centre=p.length/3;p.push(o[0],-.38,o[2]);uv.push(0,0);for(let i=0;i<bottom.length;i++)ix.push(centre,bottom[(i+1)%bottom.length],bottom[i]);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.name='366-closed-compact-mineral-stair-bearing-core';g.userData={route366:true,ground321Audit:auditGround321(g)};
 return{geometry:g,at:atBank,heightAt:height,plan,ownedBy207:true,ownedBy366:true,info:{revision:'route366-r04',kind:'Compact closed stair bearing core, separately dressed with interlocked real mineral courses; no broad smooth soil cone',width:width*2,front,back,hallStairClearance:1.25,openCentralBridgeChannel:true,photographicAccepted:false}};
}

export function buildReturningGallery366(api,L,plan){
 const {emit,box}=api,path=plan.galleryApproach.points,width=plan.galleryApproach.width,records=[];
 for(let segment=0;segment<path.length-1;segment++){
  const A=V(path[segment]),B=V(path[segment+1]),d=B.clone().sub(A),run=Math.hypot(d.x,d.z),axis=[d.x/run,d.z/run],floor=u=>A.y+(B.y-A.y)*u/run,poly=(a,b,v0,v1)=>[[a,v0],[b,v0],[b,v1],[a,v1]].map(([u,v])=>{const p=at(A.toArray(),axis,u,v,0);return[p[0],p[2]];}),along=q=>(q[0]-A.x)*axis[0]+(q[1]-A.z)*axis[1],count=Math.max(3,Math.ceil(run/.48));
  for(let i=0;i<count;i++){const a=run*i/count+.002,b=run*(i+1)/count-.002;emit(solid(poly(a,b,-width/2,width/2),q=>floor(along(q))-.13,q=>floor(along(q)), 'returning-gallery-seated-flag-'+segment+'-'+i),'routeStone207');}
  for(const side of[-1,1])emit(solid(poly(0,run,side*(width/2-.14)-.075,side*(width/2-.14)+.075),q=>floor(along(q))-.34,q=>floor(along(q))-.13,'returning-gallery-continuous-timber-stringer'),'darkwood');
  records.push({from:A.toArray(),to:B.toArray(),width,closedFlags:count});
 }
 // The bend is carried by a real short bent on the far mineral terrace.
 const elbow=path[1],top=elbow[1]-.34;for(const side of[-1,1]){const x=elbow[0]+side*.35,poly=[[x-.18,elbow[2]-.18],[x+.18,elbow[2]-.18],[x+.18,elbow[2]+.18],[x-.18,elbow[2]+.18]];emit(solid(poly,.72,top,'gallery-elbow-seated-stone-bearing'),'supportStone207');}box(elbow[0],elbow[1]-.25,elbow[2],1.02,.18,.25,'darkwood');
 for(const side of[-1,1]){const points=path.map((p,i)=>{const prev=path[Math.max(0,i-1)],next=path[Math.min(path.length-1,i+1)],d=V(next).sub(V(prev)).setY(0).normalize(),w=i===0?1.10:i===path.length-1?plan.width/2-.08:width/2;return[p[0]-d.z*side*w,p[1]+1.0,p[2]+d.x*side*w];});for(const h of[0,-.40])rail366(emit,points.map(p=>[p[0],p[1]+h,p[2]]),.095,.075,'red');for(const p of points)box(p[0],p[1]-.48,p[2],.13,1.04,.13,'red');}
 return{revision:'route366-r04',records,closed:true,narrowReturningRoute:true,photographicAccepted:false};
}

export function buildBankOutcrops366({emit},bank,scanned){
 const surfaces=[],records=[],materials=scanned.variants.map((s,i)=>{const m=s.wet.clone();m.name='366-rooted-rain-dark-bank-mineral-'+i;m.color.multiplyScalar(.74);m.onBeforeCompile=s.wet.onBeforeCompile;m.customProgramCacheKey=s.wet.customProgramCacheKey;return m;}),plan=bank.plan,far=plan.bridgeEnd,A=[Math.cos(L.bridge.yaw),-Math.sin(L.bridge.yaw)],B=[-A[1],A[0]],toFar=(u,v)=>[far[0]+A[0]*u+B[0]*v,far[2]+A[1]*u+B[1]*v];
 const foot=[toFar(-.58,-2.65),toFar(1.18,-2.65),toFar(1.18,1.40),toFar(-.58,1.40)],top=[toFar(-.22,-2.42),toFar(.92,-2.42),toFar(.92,1.14),toFar(-.22,1.14)],core=solid(foot,-.25,.75,'separate-far-bridge-mineral-bearing-terrace'),cp=core.attributes.position;for(let i=0;i<cp.count;i++)if(cp.getY(i)>.74){let k=0;for(let j=1;j<foot.length;j++)if(Math.hypot(cp.getX(i)-foot[j][0],cp.getZ(i)-foot[j][1])<Math.hypot(cp.getX(i)-foot[k][0],cp.getZ(i)-foot[k][1]))k=j;cp.setX(i,top[k][0]);cp.setZ(i,top[k][1]);}core.computeVertexNormals();core.userData.ground321Audit=auditGround321(core);emit(core,'supportCore207');const coreMesh=new T.Mesh(core,new T.MeshBasicMaterial());coreMesh.updateMatrixWorld(true);surfaces.push(coreMesh);
 function place(kind,u,v,top,size,variant,rotation,farLocal=false){const scan=scanned.variants[variant],q=new T.Quaternion().setFromEuler(new T.Euler(...rotation)),bounds=new T.Box3().setFromBufferAttribute(scan.geometry.attributes.position).applyMatrix4(new T.Matrix4().compose(V([0,0,0]),q,V([size,size,size]))),p=farLocal?toFar(u,v):[bank.at(u,v)[0],bank.at(u,v)[2]];let y=top-bounds.max.y;if(farLocal)y=Math.min(y,-.20-bounds.min.y);const material=materials[variant];emit(scan.geometry,material,p[0],y,p[1],size,size,size,rotation);const mesh=new T.Mesh(scan.geometry,material);mesh.position.set(p[0],y,p[1]);mesh.quaternion.copy(q);mesh.scale.setScalar(size);mesh.updateMatrixWorld(true);surfaces.push(mesh);records.push({kind,position:[p[0],y,p[1]],top:y+bounds.max.y,bottom:y+bounds.min.y,uniformScale:size,variant,source:'Unmodified existing CC0 wet mineral mesh, fully embedded in a closed bearing core or the preceding mineral course'});}
 // Independent staggered geological courses cover both exposed stair sides.
 for(const side of[-1,1])for(let j=0;j<4;j++){const u=.05+plan.run*j/3,crest=bank.heightAt(u,side*1.10)+.10,rows=Math.max(1,Math.ceil((crest+.18)/.56));for(let row=0;row<rows;row++){const cap=Math.min(crest,-.18+(row+1)*.56),v=side*(1.12+.19*(1-row/rows)),size=.78+.06*hash(j,row),variant=[0,1,4,5][(j+row+(side>0?1:0))%4];place('Interlocked mineral course at backed stair',u+(row%2?.15:-.08),v,cap,size,variant,[.025,j*.73+row*.34,-.025]);}}
 for(const[i,u,v,cap,size]of[[0,-.20,1.14,.82,.82],[1,.64,1.24,.78,.84],[2,.75,-.64,.81,.86],[3,.65,-1.56,1.12,.88],[4,.44,-2.34,1.18,.86],[5,-.22,-1.60,.85,.80]])place('Rooted far-bridge abutment mineral return',u,v,cap,size,[0,4,1,5,0,4][i],[.025,i*.77,-.025],true);
 return{surfaces,materials,info:{revision:'route366-r04',records,photographicAccepted:false}};
}
