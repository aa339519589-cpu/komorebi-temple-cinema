import * as T from 'three';
import {scene10Layout125 as L} from './layout125.js';

// Ordinary runtime geometry. Dimensions are metres; no photograph, depth
// image, screen texture or downloaded replacement ground is read here.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),fract=v=>v-Math.floor(v);
const hash=(a,b,s=1)=>fract(Math.sin(a*127.1+b*311.7+s*17.13)*43758.5453);
const noise=(x,z,s)=>{const a=Math.floor(x),b=Math.floor(z),u=x-a,v=z-b,S=t=>t*t*(3-2*t),q=S(u),r=S(v);return(1-r)*((1-q)*hash(a,b,s)+q*hash(a+1,b,s))+r*((1-q)*hash(a,b+1,s)+q*hash(a+1,b+1,s));};
const drainDistance=(x,z)=>Math.cos(L.drain.yaw)*(x-L.drain.position[0])-Math.sin(L.drain.yaw)*(z-L.drain.position[2]);
const area=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2;
const keyEdge=(a,b)=>a<b?a+':'+b:b+':'+a;

function refineCap(points,spacing=.043){
 const p=points.map(v=>[...v]);let faces=T.ShapeUtils.triangulateShape(points.map(v=>new T.Vector2(...v)),[]);
 for(let iteration=0;iteration<10;iteration++){
  const edges=new Map();for(const f of faces)for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3],A=p[a],B=p[b],key=keyEdge(a,b);if((A[0]-B[0])**2+(A[1]-B[1])**2>spacing*spacing&&!edges.has(key)){edges.set(key,p.length);p.push([(A[0]+B[0])*.5,(A[1]+B[1])*.5]);}}
  if(!edges.size)break;const next=[];
  for(const f of faces){let[a,b,c]=f,ab=edges.get(keyEdge(a,b)),bc=edges.get(keyEdge(b,c)),ca=edges.get(keyEdge(c,a)),n=Number(ab!==undefined)+Number(bc!==undefined)+Number(ca!==undefined);if(!n){next.push(f);continue;}if(n===3){next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);continue;}if(n===1){if(bc!==undefined){[a,b,c]=[b,c,a];ab=bc;}else if(ca!==undefined){[a,b,c]=[c,a,b];ab=ca;}next.push([a,ab,c],[ab,b,c]);}else{if(ab===undefined){[a,b,c]=[b,c,a];[ab,bc]=[bc,ca];}else if(bc===undefined){[a,b,c]=[c,a,b];[ab,bc]=[ca,ab];}next.push([b,bc,ab],[a,ab,c],[ab,bc,c]);}}
  faces=next;if(faces.length>65000)throw Error('Ground321 stone cap budget exceeded');
 }
 for(const f of faces){const[a,b,c]=f.map(i=>p[i]);if((b[1]-a[1])*(c[0]-a[0])-(b[0]-a[0])*(c[1]-a[1])<0)[f[1],f[2]]=[f[2],f[1]];}
 const edges=new Map();for(const f of faces)for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3],key=keyEdge(a,b);if(!edges.has(key))edges.set(key,[]);edges.get(key).push([a,b]);}
 return{points:p,faces,boundary:[...edges.values()].filter(a=>a.length===1).map(a=>a[0])};
}
function writer(){
 const p=[],n=[],uv=[];
 const emit=(v,normal)=>{p.push(...v);n.push(...normal);if(Math.abs(normal[1])>.55)uv.push(v[0],-v[2]);else if(Math.abs(normal[0])>=Math.abs(normal[2]))uv.push(v[2],v[1]);else uv.push(v[0],v[1]);};
 const tri=(a,b,c,out)=>{let normal=new T.Vector3(...b).sub(new T.Vector3(...a)).cross(new T.Vector3(...c).sub(new T.Vector3(...a)));if(normal.lengthSq()<1e-28)return;if(out&&normal.dot(out)<0){[b,c]=[c,b];normal.negate();}normal.normalize();for(const v of[a,b,c])emit(v,normal.toArray());};
 return{tri,emit,finish(name){const g=new T.BufferGeometry();g.name=name;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;}};
}
export function auditGround321(g){
 const p=g.attributes.position,ix=g.index,count=ix?.count??p.count,index=i=>ix?ix.getX(i):i,V=i=>new T.Vector3().fromBufferAttribute(p,i),coordinate=i=>[p.getX(i),p.getY(i),p.getZ(i)],key=i=>coordinate(i).map(v=>Object.is(v,-0)?0:v).join(':'),nearKey=i=>coordinate(i).map(v=>Math.round(v*1e6)).join(':'),edges=new Map(),nearEdges=new Map();let volume=0,collapsed=0,collapsedAt1um=0;
 const append=(map,k)=>{for(let j=0;j<3;j++){const a=k[j],b=k[(j+1)%3],e=a<b?a+'|'+b:b+'|'+a;if(!map.has(e))map.set(e,{n:0,d:0});const q=map.get(e);q.n++;q.d+=a<b?1:-1;}};
 for(let i=0;i<count;i+=3){const f=[index(i),index(i+1),index(i+2)],k=f.map(key),near=f.map(nearKey);if(new Set(k).size<3){collapsed++;continue;}volume+=V(f[0]).dot(V(f[1]).cross(V(f[2])))/6;append(edges,k);if(new Set(near).size<3)collapsedAt1um++;else append(nearEdges,near);}
 return{triangles:count/3,finite:Array.from(p.array).every(Number.isFinite),volume,boundary:[...edges.values()].filter(e=>e.n!==2).length,inconsistent:[...edges.values()].filter(e=>e.d!==0).length,collapsed,actualTopology:'Exact positions written to the native Float32 graphics buffer; distinct nearby vertices are not silently merged.',approximate1umDiagnostic:{nonTwoValenceEdges:[...nearEdges.values()].filter(e=>e.n!==2).length,inconsistentEdges:[...nearEdges.values()].filter(e=>e.d!==0).length,collapsedTriangles:collapsedAt1um,scope:'Proximity diagnostic only. A coarse weld may create new contacts between distinct valid native vertices.'}};
}

function closedHeightSolid(points,height,bottom,name,spacing=.043){
 const cap=refineCap(points,spacing),positions=cap.points.flatMap(([x,z])=>[x,height(x,z),z]),g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(cap.faces.flat());g.computeVertexNormals();const w=writer(),normal=g.attributes.normal,P=i=>positions.slice(i*3,i*3+3),B=i=>[cap.points[i][0],bottom,cap.points[i][1]];
 for(const f of cap.faces)for(const i of f)w.emit(P(i),[normal.getX(i),normal.getY(i),normal.getZ(i)]);
 for(const[a,b]of cap.boundary){const A=P(a),C=P(b),out=new T.Vector3(-(C[2]-A[2]),0,C[0]-A[0]);w.tri(B(a),A,B(b),out);w.tri(B(b),A,C,out);}
 for(const f of cap.faces)w.tri(...f.map(B),new T.Vector3(0,-1,0));g.dispose();const result=w.finish(name);result.userData.ground321Audit=auditGround321(result);return{geometry:result,cap,positions};
}
function clipLine(p,nx,nz,d,sign){const out=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],A=sign*(nx*a[0]+nz*a[1]-d)-.0035,B=sign*(nx*b[0]+nz*b[1]-d)-.0035;if(A>=0)out.push(a);if((A>=0)!==(B>=0)){const t=A/(A-B);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}return out;}
function chippedOutline(base,seed){
 if(area(base)<0)base=[...base].reverse();const points=[],drops=[];
 for(let k=0;k<base.length;k++){const A=base[k],B=base[(k+1)%base.length],dx=B[0]-A[0],dz=B[1]-A[1],length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length,N=Math.max(2,Math.ceil(length/.070)),centres=[.20+.18*hash(k,4,seed),.64+.20*hash(k,6,seed)];
  for(let j=0;j<N;j++){const t=j/N,s=t*length;let cut=0,loss=0;for(let q=0;q<2;q++){const width=.035+.065*hash(k,q+19,seed),v=Math.max(0,1-Math.abs(s-centres[q]*length)/width);cut+=(.004+.011*hash(k,q+23,seed))*v;loss+=(.003+.009*hash(k,q+29,seed))*v;}
   const inset=j?(.003+.0015*hash(k,j,seed)+cut):.003;points.push([A[0]+dx*t+nx*inset,A[1]+dz*t+nz*inset]);drops.push(.0015+.0023*hash(k,j+37,seed)+loss);
  }
 }
 return{points,drops};
}
function nearestEdge(x,z,p){let best=Infinity,index=0,fraction=0;for(let k=0;k<p.length;k++){const a=p[k],b=p[(k+1)%p.length],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1),d=Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);if(d<best){best=d;index=k;fraction=t;}}return{distance:best,index,fraction};}

function removeCoincidentWaterFaces321(input){
 const p=input.attributes.position,ix=input.index,vertices=[],lookup=new Map(),remap=[];for(let i=0;i<p.count;i++){const q=[p.getX(i),p.getY(i),p.getZ(i)],key=q.map(v=>Object.is(v,-0)?0:v).join(':');if(!lookup.has(key)){lookup.set(key,vertices.length/3);vertices.push(...q);}remap.push(lookup.get(key));}
 const records=[],faces=new Map();let collapsed=0,cancelledPairs=0,duplicates=0;const rotation=f=>[f.join(','),[f[1],f[2],f[0]].join(','),[f[2],f[0],f[1]].join(',')].sort()[0];
 for(let i=0;i<ix.count;i+=3){const f=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)].map(v=>remap[v]);if(new Set(f).size<3){collapsed++;continue;}const key=[...f].sort((a,b)=>a-b).join(':'),sign=rotation(f)<rotation([f[0],f[2],f[1]])?1:-1,old=faces.get(key);if(old){if(old.sign!==sign){records[old.index].removed=true;faces.delete(key);cancelledPairs++;}else duplicates++;continue;}faces.set(key,{index:records.length,sign});records.push({f,removed:false});}
 const indices=records.filter(r=>!r.removed).flatMap(r=>r.f),uv=[];for(let i=0;i<vertices.length;i+=3)uv.push(vertices[i],-vertices[i+2]);const g=new T.BufferGeometry();g.name=input.name;g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return{geometry:g,repair:{weldTolerance:'exact-Float32-coincidence',collapsed,cancelledCoincidentPairs:cancelledPairs,duplicateFacesRemoved:duplicates}};
}

// Clip the actual triangular stone top against a shallow spill level. The
// water has a horizontal top, a stone-following lower face and closed shores.
// It is a bounded3D volume; reflections come from the actual scene probe.
function puddleFromCap(cap,positions,requestedWaterY,attempt=0,initialLevel=requestedWaterY,levelAttempts=[]){
 const point=i=>positions.slice(i*3,i*3+3).map(Math.fround),heights=cap.points.map((_,i)=>Math.fround(positions[i*3+1]));let waterY=requestedWaterY,limit=waterY-.00035;
 // Avoid sub-float iso cuts passing directly through a mesh vertex. The
 // bounded level correction is micrometres, and is retained in the receipt.
 let levelShift=0;for(let k=0;k<401;k++){const shift=k===0?0:(k%2?1:-1)*Math.ceil(k/2)*.000001,candidate=requestedWaterY+shift,cut=candidate-.00035;if(heights.every(y=>Math.abs(y-cut)>.0000025)){waterY=candidate;limit=cut;levelShift=shift;break;}}
 const vertices=[],faces=[],map=new Map(),add=(key,p)=>{if(map.has(key))return map.get(key);const i=vertices.length;vertices.push(p.map(Math.fround));map.set(key,i);return i;},source=i=>({key:'v'+i,point:point(i)});
 function intersection(a,b){const low=Math.min(a,b),high=Math.max(a,b),key='e'+low+':'+high,A=point(low),B=point(high),t=(A[1]-limit)/(A[1]-B[1]);return{key,point:A.map((v,k)=>v+(B[k]-v)*t)};}
 for(const f of cap.faces){const polygon=[];for(let i=0;i<3;i++){const a=f[i],b=f[(i+1)%3],A=point(a)[1]-limit,B=point(b)[1]-limit;if(A<0)polygon.push(source(a));if((A<0)!==(B<0))polygon.push(intersection(a,b));}if(polygon.length<3)continue;const ids=polygon.map(p=>add(p.key,p.point));for(let k=1;k<ids.length-1;k++)faces.push([ids[0],ids[k],ids[k+1]]);}
 if(!faces.length)return null;const E=new Map();for(const f of faces)for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3],key=keyEdge(a,b);if(!E.has(key))E.set(key,[]);E.get(key).push([a,b]);}
 const N=vertices.length,p=[],uv=[],ix=[],smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
 for(let side=0;side<2;side++)for(const[x,y,z]of vertices){const depth=waterY-y+.00005,fade=smooth((depth-.00040)/.004),wave=fade*(.00043*Math.sin(x*29.1+z*18.7)+.00024*Math.sin(z*39.3-x*13.4));p.push(x,side?y-.00005:waterY+wave,z);uv.push(x,-z);}
 for(const[a,b,c]of faces)ix.push(a,b,c,a+N,c+N,b+N);
 for(const value of E.values())if(value.length===1){const[a,b]=value[0];ix.push(a,a+N,b,b,a+N,b+N);}
 let g=new T.BufferGeometry();g.name='scene10-closed-corrugated-stone-basin-water321';g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();let audit=auditGround321(g),topologyRepair=null;if(audit.boundary||audit.inconsistent){const fixed=removeCoincidentWaterFaces321(g);g.dispose();g=fixed.geometry;topologyRepair=fixed.repair;audit=auditGround321(g);}if(audit.boundary||audit.inconsistent||audit.volume<=0){levelAttempts.push({level:waterY,changeFromRequested:waterY-initialLevel,boundary:audit.boundary,inconsistent:audit.inconsistent,volume:audit.volume});if(attempt<8){g.dispose();return puddleFromCap(cap,positions,requestedWaterY-.0001,attempt+1,initialLevel,levelAttempts);}throw Error('Ground321 water solid remains invalid '+JSON.stringify({audit,levelAttempts}));}g.userData.ground321Audit=audit;g.userData.water321={level:waterY,requestedLevel:initialLevel,physicalDrainageLevelAdjustment:waterY-initialLevel,levelAttempts,numericalLevelShift:levelShift,topologyRepair,minimumThickness:.00040,maximumPhysicalWave:.00067,wave:'Actual submillimetre top vertices; fades to zero at the shallow closed shore. Frozen frame-zero capillary corrugation, existing impact rings remain animated.',bottom:'Actual stone cap with50micron contact overlap; no floating underside',referencePixels:false};return g;
}

export function createLaidRainStones321({points,topOffset=0,seed,id}){
 if(area(points)<0)points=[...points].reverse();const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cz=points.reduce((s,p)=>s+p[1],0)/points.length,split=hash(seed,17)>.81,angle=.38+hash(seed,19)*1.12,nx=Math.cos(angle),nz=Math.sin(angle),d=nx*cx+nz*cz;
 if(Math.abs(area(points))<.025)return{fragments:[],split:false,packedOnly:true};
 topOffset*=.42;
 const pieces=split?[clipLine(points,nx,nz,d,1),clipLine(points,nx,nz,d,-1)].filter(p=>p.length>=3&&Math.abs(area(p))>.045):[points],fragments=[];
 for(let q=0;q<pieces.length;q++){
  const s=seed+q*719,outline=chippedOutline(pieces[q],s),p=outline.points,x=p.reduce((v,a)=>v+a[0],0)/p.length,z=p.reduce((v,a)=>v+a[1],0)/p.length,width=Math.max(...p.map(p=>p[0]))-Math.min(...p.map(p=>p[0])),depth=Math.max(...p.map(p=>p[1]))-Math.min(...p.map(p=>p[1])),tiltX=(hash(s,31)-.5)*.008,tiltZ=(hash(s,37)-.5)*.008,waterY=.049+(hash(s,39)-.5)*.0008;
  const bx=x+(hash(s,41)-.5)*width*.24,bz=z+(hash(s,43)-.5)*depth*.24,rx=Math.max(.12,width*.38),rz=Math.max(.12,depth*.39),basin=.0025+.0035*hash(s,47),chips=Array.from({length:4},(_,k)=>({x:x+(hash(s,k+53)-.5)*width*.80,z:z+(hash(s,k+61)-.5)*depth*.80,rx:.035+.070*hash(s,k+67),rz:.025+.045*hash(s,k+71),depth:.002+.004*hash(s,k+79)}));
  const height=(X,Z)=>{const edge=nearestEdge(X,Z,p),drop=outline.drops[edge.index]*(1-edge.fraction)+outline.drops[(edge.index+1)%p.length]*edge.fraction,r=Math.hypot((X-bx)/rx,(Z-bz)/rz);let y=.0485+topOffset+tiltX*(X-x)+tiltZ*(Z-z)+.0018*(noise(X*11,Z*11,s)-.5)-basin*Math.max(0,1-r)**.65-drop*Math.exp(-((edge.distance/.028)**2));for(const c of chips){const u=Math.max(Math.abs((X-c.x)/c.rx),Math.abs((Z-c.z)/c.rz),Math.abs((X-c.x)/c.rx+(Z-c.z)/c.rz)*.66);if(u<1)y-=c.depth*(1-u);}return y;};
  const solid=closedHeightSolid(p,height,-.092+topOffset,'scene10-settled-split-wet-flag321'),ys=solid.positions.filter((_,i)=>i%3===1),range=[Math.min(...ys),Math.max(...ys)],record={id:id+'-'+q,seed:s,split,profile:{basin:[0,0,rx,rz,basin]},topYRange:range,spillWaterY:waterY,nominalBodyDepth:.144,pitCount:4,capMaxInteriorEdgeMetres:.043,chipSetbackMetres:[.009,.030],construction:'Independent closed broken stone, shared-edge cap/side/bottom; sparse angular spalls, real settlement/tilt, basin and flakes; metric CC0 granite UVs',audit:solid.geometry.userData.ground321Audit};solid.geometry.userData.nearRainStone=record;solid.geometry.userData.rainStoneFootprint=p;solid.geometry.userData.heightAt=height;solid.geometry.userData.topYMax=range[1];
  const water=puddleFromCap(solid.cap,solid.positions,waterY);if(water)record.spillWaterY=water.userData.water321.level;fragments.push({geometry:solid.geometry,water,points:p,record,heightAt:height,waterY:record.spillWaterY});
 }
 return{fragments,split};
}

export function createJointBed321(points,seed){
 const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cz=points.reduce((s,p)=>s+p[1],0)/points.length,p=points.map(([x,z])=>{const d=Math.hypot(x-cx,z-cz);return[x+(x-cx)/d*.014,z+(z-cz)/d*.014];});return closedHeightSolid(p,(x,z)=>.027+.0023*(noise(x*38,z*38,seed)-.5),-.105,'scene10-recessed-supported-granite-grit321',.080).geometry;
}
export function createJointWater321(points){
 const w=writer();let pieces=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(l<.030)continue;const nx=dz/l,nz=-dx/l,ux=dx/l,uz=dz/l,mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;if(Math.abs(drainDistance(mx,mz))<L.drain.halfWidth+.037)continue;
  const start=[a[0]+ux*.006+nx*.008,a[1]+uz*.006+nz*.008],end=[b[0]-ux*.006+nx*.008,b[1]-uz*.006+nz*.008],p=[];for(let k=0;k<=8;k++){const t=-Math.PI/2+k/8*Math.PI;p.push([end[0]+ux*Math.cos(t)*.005+nx*Math.sin(t)*.005,end[1]+uz*Math.cos(t)*.005+nz*Math.sin(t)*.005]);}for(let k=0;k<=8;k++){const t=Math.PI/2+k/8*Math.PI;p.push([start[0]+ux*Math.cos(t)*.005+nx*Math.sin(t)*.005,start[1]+uz*Math.cos(t)*.005+nz*Math.sin(t)*.005]);}
  const g=closedHeightSolid(p,()=>.0405,.0256,'closed-capillary-joint-cell321',.15).geometry,position=g.attributes.position,normal=g.attributes.normal;for(let k=0;k<position.count;k++)w.emit([position.getX(k),position.getY(k),position.getZ(k)],[normal.getX(k),normal.getY(k),normal.getZ(k)]);g.dispose();pieces++;
 }
 if(!pieces)return null;const g=w.finish('scene10-closed-capillary-grit-joint-water321');g.userData.ground321Audit=auditGround321(g);g.userData.jointWater321={level:.0405,bottom:.0256,depth:.0149,closedRoundedFlowCells:pieces};return g;
}

export function createVerandaReceiver321(){
 const N=72,R=5,p=[],uv=[],ix=[],outer=[],radius=.4358;
 for(let i=0;i<N;i++){const a=i/N*Math.PI*2,c=Math.cos(a),s=Math.sin(a),gain=1+.018*Math.sin(i*1.71)-.024*Math.max(0,Math.sin(i*2.37))**4;outer.push([Math.sign(c)*Math.abs(c)**.44*.77*gain,Math.sign(s)*Math.abs(s)**.44*.70*gain]);}
 for(let r=0;r<=R;r++)for(let k=0;k<N;k++){const a=k/N*Math.PI*2,t=r/R,x=radius*Math.cos(a)*(1-t)+outer[k][0]*t,z=radius*Math.sin(a)*(1-t)+outer[k][1]*t,drop=.018*t**5+.008*Math.max(0,Math.sin(k*1.83))**5*t*t,y=.231+.006*Math.sin(x*17+z*9)*Math.sin(z*13-x*7)-drop;p.push(x,y,z);uv.push(x,-z);}
 for(let r=0;r<R;r++)for(let k=0;k<N;k++){const a=r*N+k,b=r*N+(k+1)%N,c=a+N,d=b+N;ix.push(a,c,b,b,c,d);}
 const w=writer(),P=i=>p.slice(i*3,i*3+3),up=new T.Vector3(0,1,0);for(let i=0;i<ix.length;i+=3)w.tri(P(ix[i]),P(ix[i+1]),P(ix[i+2]),up);
 for(let k=0;k<N;k++){const j=(k+1)%N,A=P(R*N+k),B=P(R*N+j),a=[outer[k][0],-.17,outer[k][1]],b=[outer[j][0],-.17,outer[j][1]],out=new T.Vector3((A[0]+B[0])/2,0,(A[2]+B[2])/2);w.tri(a,A,b,out);w.tri(b,A,B,out);const I=P(k),J=P(j),i=[I[0],0,I[2]],q=[J[0],0,J[2]],inside=out.clone().negate();w.tri(i,q,I,inside);w.tri(q,J,I,inside);w.tri([0,0,0],i,q,up);w.tri([0,-.17,0],b,a,up.clone().negate());}
 const g=w.finish('scene10-closed-spalled-column-receiver321');g.userData.ground321Audit=auditGround321(g);g.userData.receiver321={socketRadius:radius,socketBottom:0,underside:-.17,nominalTop:.231,outerEdgeLoss:[.012,.026],columnShoeDatumRetained:true,outerFootprint:outer};return g;
}

export function buildDrain321({emit,box,group,materials}){
 const stats={length:13,waterY:-.052,waterBottom:-.1136,waterDepth:.0616,channelFloorTop:-.1135,ironTopRange:[.020,.025],closedChannel:true,modules:13};
 group(...L.drain.position,L.drain.yaw,()=>{
  const h=L.drain.halfWidth;box(0,-.122,0,h*2,.025,13,'groundDrain321');for(const sign of[-1,1])box(sign*(h-.009),-.043,0,.018,.16,13,'groundDrain321');
  box(0,-.0788,0,h*2-.022,.0616,12.99,'groundWater321');
  for(let m=0;m<13;m++){const z=-6+m,loss=(hash(m,7)-.5)*.002;for(const side of[-1,1])box(side*(h-.022),.014+loss,z,.012,.015,.985,'groundIron321');for(let k=0;k<16;k++){const d=.016+.003*hash(m,k),x=(hash(m,k+23)-.5)*.002;box(x,.021+loss,z-.458+k*.060,h*2-.033,.011,d,'groundIron321');}}
 });return stats;
}

let gritPrototypes;
export function emitJointGrit321({points,seed,bedSeed=seed,emit}){
 if(!gritPrototypes)gritPrototypes=Array.from({length:3},(_,k)=>{const g=new T.IcosahedronGeometry(1,0),p=g.attributes.position;for(let i=0;i<p.count;i++){const gain=.79+.27*hash(p.getX(i)*7+p.getY(i)*11,p.getZ(i)*17+k*31);p.setXYZ(i,p.getX(i)*gain,p.getY(i)*gain,p.getZ(i)*gain);}g.computeVertexNormals();g.computeBoundingBox();return g;});
 let count=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),N=Math.max(1,Math.floor(length/.12));for(let k=0;k<N;k++){if(hash(i,k+311,seed)<.68)continue;const t=(k+.25+.5*hash(i,k+317,seed))/N,offset=.005+.007*hash(i,k+331,seed),x=a[0]+dx*t+dz/length*offset,z=a[1]+dz*t-dx/length*offset,g=gritPrototypes[(i+k)%3],sx=.005+.009*hash(i,k+337,seed),sy=.003+.005*hash(i,k+347,seed),sz=.004+.008*hash(i,k+349,seed),bed=.027+.0023*(noise(x*38,z*38,bedSeed)-.5),y=bed-g.boundingBox.min.y*sy;emit(g,'groundGrit321',x,y,z,sx,sy,sz,[.2*hash(i,k+353,seed),hash(i,k+359,seed)*Math.PI*2,.15*hash(i,k+367,seed)],.76+.33*hash(i,k+373,seed));count++;}}
 return count;
}

export function buildColumnCollar321({receiver,emit}){
 const outer=receiver.userData.receiver321.outerFootprint,N=outer.length;
 function annulus(top,bottom,name){const w=writer(),P=(i,scale,y)=>[outer[i][0]*scale,y,outer[i][1]*scale],up=new T.Vector3(0,1,0);for(let i=0;i<N;i++){const j=(i+1)%N,A=P(i,.998,top),B=P(j,.998,top),C=P(i,1.17,top),D=P(j,1.17,top),a=P(i,.998,bottom),b=P(j,.998,bottom),c=P(i,1.17,bottom),d=P(j,1.17,bottom);w.tri(A,C,B,up);w.tri(B,C,D,up);w.tri(a,b,c,up.clone().negate());w.tri(b,d,c,up.clone().negate());const inside=new T.Vector3(-(A[0]+B[0])/2,0,-(A[2]+B[2])/2),outside=inside.clone().negate();w.tri(a,A,b,inside);w.tri(b,A,B,inside);w.tri(c,d,C,outside);w.tri(d,D,C,outside);}const g=w.finish(name);g.userData.ground321Audit=auditGround321(g);return g;}
 const bed=annulus(.0305,-.105,'scene10-column-grit-contact-collar321'),film=annulus(.040,.03045,'scene10-column-shallow-runoff-collar321');emit(bed,'groundBed321');emit(film,'groundWater321');
 return{sectors:N,baseY:-.105,bedTop:.0305,waterTop:.040,waterBottom:.03045,waterDepth:.00955,solidAudits:[bed.userData.ground321Audit,film.userData.ground321Audit],physicalSupport:'Closed annular grit bedding and9.55mm runoff volume contact the actual spalled receiver side; source socket/shoe datums retained.',referencePixels:false};
}

export function groundGritAudits321(){return(gritPrototypes??[]).map(g=>auditGround321(g));}
