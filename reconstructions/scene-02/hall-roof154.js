import {T,V,mix,gridGeometry} from './kernel.js';

// A single hip-and-gable roof family, in the hall's bearing coordinates.
// The upper gable and the four lower aprons share exactly the same inner ring.
// This replaces the old complete hip roof plus an independently offset dormer.
// Ceramic units, closed shells, ridge caps, fascia and timber rafters are solids.
export function buildHallRoof154({b,mats,roof}){
 const {gableCenterX:cx,gableWidth:gW,gableFront:gF,gableBack:gB,gableEave:gE,gableRise:gR,roofWidth:W,roofFront:F,roofBack:B,roofEave:E,roofCurl:curl}=roof;
 const footY=gE+.38,peakY=gE+gR,halfW=W/2,halfG=gW/2,merged=new Map();
 const stats={construction:'One common ridge and seated gable, four joined shallow hip aprons, closed ceramic courses, supported cantilever rafters',bearingAxisLocalX:cx,gableFaceLocalZ:gF,gableRearLocalZ:gB,innerHipSeatLocalY:footY,ridgeLocalY:peakY,ceramicCourses:0,closedCeramicUnits:0,rafters:0,facePhotoTexture:false};
 for(let i=0;i<5;i++){
  const m=mats.slate.clone();m.name=`scene02-hall-fired-blue-tile154-${i}`;m.color.setHex([0x3b4b5c,0x44566a,0x384956,0x4b5b70,0x3d5268][i]);m.roughness=.36+i*.012;m.metalness=.035;m.bumpScale=.010;m.side=T.FrontSide;mats[`hallTile154${i}`]=m;
 }
 const under=mats.darkwood.clone();under.name='scene02-closed-roof-inner-boarding154';under.color.setHex(0x392116);under.roughness=.85;mats.hallRoofUnder154=under;
 function shell(rows,thickness,material){
  const g=gridGeometry(rows),p=Array.from(g.attributes.position.array),uv=Array.from(g.attributes.uv.array),ids=Array.from(g.index.array),N=p.length/3,nx=rows[0].length,ny=rows.length;
  let normalY=0;for(let i=0;i<g.attributes.normal.count;i++)normalY+=g.attributes.normal.getY(i);if(normalY<0)for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];
  const topIds=ids.slice();for(let i=0;i<N;i++){p.push(p[i*3],p[i*3+1]-thickness,p[i*3+2]);uv.push(uv[i*2],uv[i*2+1]);}
  for(let i=0;i<topIds.length;i+=3)ids.push(topIds[i]+N,topIds[i+2]+N,topIds[i+1]+N);
  const ring=[];for(let i=0;i<nx;i++)ring.push(i);for(let j=1;j<ny;j++)ring.push(j*nx+nx-1);for(let i=nx-2;i>=0;i--)ring.push((ny-1)*nx+i);for(let j=ny-2;j>0;j--)ring.push(j*nx);if(normalY<0)ring.reverse();
  for(let i=0;i<ring.length;i++){const a=ring[i],c=ring[(i+1)%ring.length];ids.push(a,c,a+N,c,c+N,a+N);}
  let dst=merged.get(material);if(!dst){dst={positions:[],uv:[],indices:[]};merged.set(material,dst);}const off=dst.positions.length/3;for(const n of ids)dst.indices.push(n+off);dst.positions.push(...p);dst.uv.push(...uv);g.dispose();
 }
 function tileField(P,width,length,offset=0){
  // Width and course pitch describe real roof units rather than an arbitrary
  // object count. Overlapping lower lips catch grazing light at native scale.
  const runs=Math.max(2,Math.round(width/.24)),courses=Math.max(3,Math.ceil(length/.57));stats.ceramicCourses+=courses;
  for(let run=0;run<runs;run++){
   const u=-1+2*(run+.5)/runs,du=2/runs*.485;
   for(let course=0;course<courses;course++){
    const a=course/courses,z=Math.min(1,(course+1.045)/courses),rows=[];
    for(let j=0;j<4;j++){
     const t=mix(a,z,j/3),row=[];
     for(let k=0;k<5;k++){
      const q=-1+2*k/4,p=P(t,u+q*du);p[1]+=.028-.017*(1-q*q)+.015*(1-j/3);row.push(p);
     }rows.push(row);
    }
    shell(rows,.032,`hallTile154${(run*13+course*7+offset)%5}`);stats.closedCeramicUnits++;
   }
   // Half-round cover tiles seat over the adjoining trough edges.
   const edge=-1+2*run/runs;
   for(let j=0;j<courses;j++){
    const a=P(j/courses,edge),c=P((j+1)/courses,edge);a[1]+=.061;c[1]+=.061;b.line(a,c,.047,`hallTile154${(run+offset+1)%5}`);
   }
  }
 }
 function boarding(P,rows=15,cols=29){shell(Array.from({length:rows},(_,j)=>Array.from({length:cols},(_,i)=>{const p=P(j/(rows-1),-1+2*i/(cols-1));p[1]-=.16;return p;})),.045,'hallRoofUnder154');}
 function fascia(points){
  const sections=[];for(let i=0;i<points.length;i++){
   const p=V(points[i]),a=V(points[Math.max(0,i-1)]),c=V(points[Math.min(points.length-1,i+1)]),d=c.sub(a);d.y=0;d.normalize();const n=V([-d.z,0,d.x]);sections.push([p.clone().addScaledVector(n,.080).add(V([0,-.10,0])),p.clone().addScaledVector(n,-.080).add(V([0,-.10,0])),p.clone().addScaledVector(n,-.080).add(V([0,-.36,0])),p.clone().addScaledVector(n,.080).add(V([0,-.36,0]))]);
  }
  const pos=[],ids=[];for(const s of sections)for(const p of s)pos.push(...p.toArray());
  for(let j=0;j<sections.length-1;j++)for(let k=0;k<4;k++){const a=j*4+k,c=j*4+(k+1)%4;ids.push(a,c,a+4,c,c+4,a+4);}ids.push(0,2,1,0,3,2);const n=(sections.length-1)*4;ids.push(n,n+1,n+2,n,n+2,n+3);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(ids);g.computeVertexNormals();g.name='scene02-continuous-closed-eave-fascia154';b.put(g,'hallOxide');
  b.tube(points.map(p=>[p[0],p[1]-.31,p[2]]),.025,'oldgold',80);
 }
 // The attic is an enclosed timber volume above the portico ceiling.
 // These real dark frieze boards close the former ray path through the roof
 // corner while keeping the interlocking brackets open in front of them.
 const wallBottom=8.03,wallTop=footY-.11,wallHeight=wallTop-wallBottom;
 for(const z of[gF-.22,gB+.22]){
  b.box(cx,(wallBottom+wallTop)/2,z,gW-.16,wallHeight,.18,'darkwood');
  for(let x=cx-halfG+.2;x<cx+halfG-.15;x+=.42)b.box(x,(wallBottom+wallTop)/2,z+(z>0?.10:-.10),.405,wallHeight,.045,'hallBearing',0,.72+.14*Math.sin(x*8.1)**2);
 }
 for(const sign of[-1,1]){
  b.box(cx+sign*(halfG-.18),(wallBottom+wallTop)/2,(gF+gB)/2,.18,wallHeight,gF-gB,'darkwood');
  for(let z=gB+.12;z<gF-.1;z+=.42)b.box(cx+sign*(halfG-.075),(wallBottom+wallTop)/2,z,.045,wallHeight,.405,'hallBearing',0,.72+.14*Math.sin(z*7.7)**2);
 }
 const upper=(sign,t,u)=>[cx+sign*halfG*t,gE+gR*Math.pow(1-t,1.28)+.38*Math.pow(t,8),mix(gB,gF,(u+1)/2)];
 for(const sign of[-1,1]){
  const P=(t,u)=>upper(sign,t,u);
  shell(Array.from({length:27},(_,j)=>Array.from({length:49},(_,i)=>P(j/26,-1+2*i/48))),.12,'hallTile1540');boarding(P);tileField(P,gF-gB,Math.hypot(halfG,gR),sign<0?1:2);
  const count=Math.round((gF-gB)/.30);for(let i=0;i<=count;i++){
   const u=-1+2*i/count;for(let j=0;j<13;j++){const a=P(j/13,u),c=P((j+1)/13,u);a[1]-=.245;c[1]-=.245;b.line(a,c,.082,'hallBearing',true,.105);}stats.rafters++;
  }
  for(const z of[gF,gB]){
   const pts=Array.from({length:49},(_,j)=>{const p=upper(sign,j/48,0);p[2]=z;p[1]-=.04;return p;});b.tube(pts,.18,'hallBearing',64);b.tube(pts.map(p=>[p[0],p[1]+.055,p[2]+(z===gF?.10:-.10)]),.043,'oldgold',64);
  }
 }
 function apron(side,t,u){
  let ix,iz,ox,oz;
  if(side<2){ix=cx+u*halfG;ox=cx+u*halfW;iz=side===0?gF:gB;oz=side===0?F:B;}
  else{ix=cx+(side===2?halfG:-halfG);ox=cx+(side===2?halfW:-halfW);iz=mix(gB,gF,(u+1)/2);oz=mix(B,F,(u+1)/2);}
  const sag=.24*4*t*(1-t),edgeCurl=curl*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),6));return[mix(ix,ox,t),mix(footY,E,t)-sag+edgeCurl,mix(iz,oz,t)];
 }
 for(let side=0;side<4;side++){
  const P=(t,u)=>apron(side,t,u),width=side<2?W:F-B,length=side<2?Math.abs((side===0?F-gF:B-gB)):halfW-halfG;
  shell(Array.from({length:19},(_,j)=>Array.from({length:65},(_,i)=>P(j/18,-1+2*i/64))),.11,'hallTile1541');boarding(P,15,49);tileField(P,width,Math.hypot(length,footY-E),side+3);
  const edge=Array.from({length:65},(_,j)=>P(1,-1+2*j/64));fascia(edge);
  const runs=Math.round(width/.24),cap=new T.CylinderGeometry(.062,.062,.055,16);cap.rotateX(Math.PI/2);
  for(let i=0;i<=runs;i++){
   const u=-1+2*i/runs,p=P(1,u),out=V(P(1,u)).sub(V(P(.99,u)));out.y=0;out.normalize();const yaw=Math.atan2(out.x,out.z);p[1]+=.035;
   b.put(cap,'tileEnd',p,[1,1,1],[0,yaw,0]);b.ball(p[0]+out.x*.030,p[1],p[2]+out.z*.030,.032,.032,.026,'tileEnd');
   for(let j=0;j<8;j++){const a=P(j/8,u),c=P((j+1)/8,u);a[1]-=.225;c[1]-=.225;b.line(a,c,.077,'hallBearing',true,.105);}stats.rafters++;
  }
  // Under-eave purlins cross and receive the actual parallel rafter tails.
  for(const t of[.18,.49,.78])b.tube(Array.from({length:49},(_,j)=>{const p=P(t,-1+2*j/48);p[1]-=.32;return p;}),.075,'hallBearing',64);
  if(side<2)for(const sign of[-1,1]){b.tube(Array.from({length:33},(_,j)=>{const p=P(j/32,sign);p[1]+=.10;return p;}),.095,'hallTile1542',48);for(let j=0;j<18;j++){const a=P(j/18,sign),c=P((j+1)/18,sign);a[1]-=.39;c[1]-=.39;b.line(a,c,.20,'hallBearing',true,.26);}}
 }
 // Ridge caps overlap with a real closed seat and terminal curled ornaments.
 b.box(cx,peakY+.12,(gF+gB)/2,.34,.28,gF-gB+.56,'hallTile1542');
 for(const z of[gF,gB]){
  const sign=z===gF?1:-1;
  b.tube([[cx,peakY+.12,z],[cx,peakY+.55,z+sign*.14],[cx,peakY+.80,z+sign*.38]],.13,'hallTile1542',24);b.ball(cx,peakY+.85,z+sign*.38,.13,.16,.12,'oldgold');
  // Solid swept tail and a paired curled ceramic head make the short ridge
  // terminal legible without the former long needle silhouette.
  b.tube([[cx,peakY+.18,z],[cx-.10,peakY+.42,z+sign*.10],[cx-.10,peakY+.69,z+sign*.24],[cx+.02,peakY+.78,z+sign*.37]],.14,'hallTile1543',24);
 }
 for(const[material,d]of merged){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(d.positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(d.uv,2));g.setIndex(d.indices);g.computeVertexNormals();g.name=`scene02-merged-closed-ceramic-and-boarding154-${material}`;b.put(g,material);}
 return stats;
}
