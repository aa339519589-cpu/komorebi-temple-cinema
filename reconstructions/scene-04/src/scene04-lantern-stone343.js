import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
const TAU=Math.PI*2,clamp=T.MathUtils.clamp;
export function noise343(x,y,z,s=1){const H=(x,y,z)=>{const q=Math.sin(x*127.1+y*311.7+z*74.7+s*17.13)*43758.5453;return q-Math.floor(q);},a=Math.floor(x),b=Math.floor(y),c=Math.floor(z),f=[x-a,y-b,z-c].map(t=>t*t*(3-2*t)),l=T.MathUtils.lerp;return l(l(l(H(a,b,c),H(a+1,b,c),f[0]),l(H(a,b+1,c),H(a+1,b+1,c),f[0]),f[1]),l(l(H(a,b,c+1),H(a+1,b,c+1),f[0]),l(H(a,b+1,c+1),H(a+1,b+1,c+1),f[0]),f[1]),f[2]);}
export function finishStone343(g,role){
 if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));if(!g.attributes.normal)g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,ix=Array.from(g.index.array),arrays=Object.fromEntries(Object.entries(g.attributes).map(([k,a])=>[k,Array.from(a.array)]));let splits=0;
 for(let t=0;t<ix.length;t+=3){const ids=ix.slice(t,t+3),v=ids.map(i=>new T.Vector3().fromBufferAttribute(p,i)),face=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0]));if(face.lengthSq()<1e-24)continue;face.normalize();for(let k=0;k<3;k++)if(face.dot(new T.Vector3().fromBufferAttribute(n,ids[k]))<=1e-6){ix[t+k]=arrays.position.length/3;splits++;for(const [name,a]of Object.entries(g.attributes))if(name==='normal')arrays.normal.push(...face.toArray());else for(let j=0;j<a.itemSize;j++)arrays[name].push(a.array[ids[k]*a.itemSize+j]);}}
 for(const [name,a]of Object.entries(g.attributes))g.setAttribute(name,new T.Float32BufferAttribute(arrays[name],a.itemSize));g.setIndex(ix);g.computeBoundingBox();g.computeBoundingSphere();g.parameters={stone343:{role,closedStone:true}};g.userData={...g.userData,stone343:{...g.userData.stone343,role,closedStone:true,normalCornerSplits:splits,allAttributesExtendedTogether:true},finalSurfaceNormalsOutward:true};return g;
}
function close343(p,ix,role){const raw=new T.BufferGeometry();raw.setAttribute('position',new T.Float32BufferAttribute(p,3));raw.setIndex(ix);const g=mergeVertices(raw,1e-7);raw.dispose();g.computeVertexNormals();return finishStone343(g,role);}

export function createChiselledShaft343(seed){
 const p=[],ix=[],rows=76,cols=28,stride=cols+1,perimeter=[];
 const motifs=[
  [[-.052,.13],[-.086,.23],[-.057,.36],[.042,.43],[.062,.59],[.008,.80]],
  [[.066,.18],[.027,.29],[-.038,.30],[-.066,.40],[-.012,.49],[.066,.47],[.073,.35]],
  [[.026,.55],[-.071,.58],[-.092,.67],[-.033,.76],[.049,.73]],
 ];
 const routes=motifs.map(q=>new T.SplineCurve(q.map(([x,y])=>new T.Vector2(x,y))).getPoints(64));
 for(let face=0;face<8;face++){
  const a=-Math.PI/8+face*TAU/8,b=a+TAU/8,n=new T.Vector3(Math.sin((a+b)/2),0,Math.cos((a+b)/2)),base=p.length/3;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
   const v=j/rows,u=i/cols,y=.74+1.09*v,r=.345+.015*Math.sin(Math.PI*v)-.012*v,lateral=(u-.5)*2*r*Math.sin(Math.PI/8);let x=T.MathUtils.lerp(Math.sin(a)*r,Math.sin(b)*r,u),z=T.MathUtils.lerp(Math.cos(a)*r,Math.cos(b)*r,u),distance=10;
   for(const route of routes)for(let k=0;k<route.length-1;k++){const A=route[k],B=route[k+1],xx=A.x*(face%3===1?-1:1)+.008*Math.sin(face+seed),yy=A.y+.018*Math.sin(face*1.3),dx=(B.x-A.x)*(face%3===1?-1:1),dy=(B.y-A.y)*.76,t=clamp(((lateral-xx)*dx+(v-yy)*.76*dy)/(dx*dx+dy*dy),0,1);distance=Math.min(distance,Math.hypot(lateral-xx-dx*t,(v-yy)*.76-dy*t));}
   const width=.015+.003*Math.sin(face*.9+seed),fade=Math.sin(Math.PI*u)**2*Math.sin(Math.PI*v)**2,broken=.62+.38*noise343(lateral*29,v*31,face,seed),cut=(.019*Math.exp(-distance*distance/(width*width))-.0035*Math.exp(-Math.pow((distance-width*1.8)/(width*.9),2)))*broken*fade;
   x-=n.x*cut;z-=n.z*cut;p.push(x,y,z);if(j<rows&&i<cols){const q=base+j*stride+i;ix.push(q,q+1,q+stride,q+1,q+stride+1,q+stride);}if(j===0&&i<cols)perimeter.push(base+i);
  }
 }
 const ringLength=8*cols;
 for(const top of [false,true]){const ci=p.length/3;p.push(0,top?1.83:.74,0);const ring=Array.from({length:ringLength},(_,i)=>{const f=Math.floor(i/cols),u=i%cols;return f*(rows+1)*stride+(top?rows*stride:0)+u;});for(let i=0;i<ringLength;i++)top?ix.push(ci,ring[i],ring[(i+1)%ringLength]):ix.push(ci,ring[(i+1)%ringLength],ring[i]);}
 const g=close343(p,ix,'rough-carved-octagonal-shaft');g.userData.stone343.inscription='Independently authored damaged abstract scroll/incision routes. No readable historical text claimed.';g.userData.stone343.incisionLocalMetres=[.012,.019];return g;
}

export function createChamberPier343(seed){
 const rows=30,cols=48,p=[],ix=[];
 for(let j=0;j<=rows;j++){const t=j/rows,y=2.4325+.575*t,w=.144-.022*t+.003*Math.sin(Math.PI*t),r=w/2;for(let i=0;i<cols;i++){const a=i/cols*TAU,s=Math.sin(a),c=Math.cos(a),x=Math.sign(s)*Math.pow(Math.abs(s),.25)*r,z=Math.sign(c)*Math.pow(Math.abs(c),.25)*r;p.push(x,y,z);if(j<rows){const q=j*cols+i,k=j*cols+(i+1)%cols;ix.push(q,k,q+cols,k,k+cols,q+cols);}}}
 for(const j of [0,rows]){const ci=p.length/3;p.push(0,2.4325+.575*j/rows,0);for(let i=0;i<cols;i++){const a=j*cols+i,b=j*cols+(i+1)%cols;j===0?ix.push(ci,b,a):ix.push(ci,a,b);}}
 return close343(p,ix,'tapered-chamber-pier');
}

export function weatherStone343(g,role,seed){
 if(!g.attributes.normal)g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,groups=new Map();
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e6)).join(',');if(!groups.has(key))groups.set(key,{ids:[],point:new T.Vector3().fromBufferAttribute(p,i),normal:new T.Vector3()});const a=groups.get(key);a.ids.push(i);a.normal.add(new T.Vector3().fromBufferAttribute(n,i));}
 let min=0,max=0;const colors=new Float32Array(p.count*3);
 for(const a of groups.values()){
  const q=a.point,N=a.normal.normalize(),r=Math.hypot(q.x,q.z);let gate=1;
  const seats=role==='shaft'?[.74,1.83]:role==='pier'?[2.4325,3.0075]:role==='base'?[0,.745]:role==='upper-seat'?[1.79,2.405]:role==='lintel'?[2.97,3.075]:role==='sill'?[2.3675,2.4425]:[];
  for(const y of seats)gate*=T.MathUtils.smoothstep(Math.abs(q.y-y),.005,.026);
  if(role==='cap'&&((r<.25&&q.y>3.40)||(r<.60&&q.y<3.13)))gate=0;
  if(role==='finial'&&(q.y<3.535||q.y>4.38))gate=0;
  const arris=.25+.75*Math.sqrt(Math.max(0,1-Math.max(Math.abs(N.x),Math.abs(N.y),Math.abs(N.z)))),rough=.0028*(noise343(q.x*17,q.y*19,q.z*17,seed)-.5)+.0010*(noise343(q.x*47,q.y*43,q.z*47,seed+7)-.5),pocket=.0045*T.MathUtils.smoothstep(noise343(q.x*89,q.y*83,q.z*89,seed+17),.67,.88),edge=role==='cap'?.35+.65*T.MathUtils.smoothstep(r,.65,.92):arris,chip=(role==='cap'?.012:.0055)*Math.pow(T.MathUtils.smoothstep(noise343(q.x*31,q.y*29,q.z*31,seed+31),.57,.80),2)*edge,d=(rough-pocket-chip)*gate;
  min=Math.min(min,d);max=Math.max(max,d);const out=q.clone().addScaledVector(N,d),patina=.77+.28*noise343(q.x*4.2,q.y*3.7,q.z*4.2,seed+61),dark=.13*T.MathUtils.smoothstep(noise343(q.x*12,q.y*10,q.z*12,seed+71),.55,.80),c=patina-dark;
  for(const i of a.ids){p.setXYZ(i,out.x,out.y,out.z);colors[i*3]=c*.995;colors[i*3+1]=c;colors[i*3+2]=c*.965;}
 }
 g.setAttribute('color',new T.BufferAttribute(colors,3));g.computeVertexNormals();g.userData.stone343={...g.userData.stone343,role,authoredNormalDisplacementLocalMetres:[min,max],weldedPositionGroups:groups.size,contactSeatsPreserved:true,referenceImagePixelsUsed:false};return finishStone343(g,role);
}

export function pruneMoss343(source,role,seed){
 const p=source.attributes.position,c=source.attributes.moss212Coverage,attributes=source.attributes,out=Object.fromEntries(Object.keys(attributes).map(k=>[k,[]]));let tufts=0,skins=0;
 for(let i=0;i<p.count;){
  const tuft=i+14<p.count&&Array.from({length:15},(_,j)=>Math.abs(c.getX(i+j)-.12)<1e-7).every(Boolean),count=tuft?15:3,q=new T.Vector3();let f=0;
  for(let j=0;j<count;j++){q.add(new T.Vector3().fromBufferAttribute(p,i+j));f+=c.getX(i+j);}q.multiplyScalar(1/count);f/=count;const r=Math.hypot(q.x,q.z),patch=noise343(q.x*23,q.y*17,q.z*23,seed);
  let keep;
  if(role==='base'||role==='upper-seat'){
   const levels=role==='base'?[.18,.45,.685]:[1.96,2.015,2.355],distance=Math.min(...levels.map(y=>Math.abs(q.y-y)));keep=tuft&&distance<(role==='base'?.060:.035)&&r>(role==='base'?.43:.40)&&patch>.48;
  }else keep=tuft?patch>.32:f>(role==='cap'?.05:.06)&&patch>.44;
  if(keep){for(const [name,a]of Object.entries(attributes))for(let j=0;j<count;j++)for(let k=0;k<a.itemSize;k++)out[name].push(a.array[(i+j)*a.itemSize+k]);if(tuft)tufts++;else skins++;}i+=count;
 }
 const g=new T.BufferGeometry();for(const [name,a]of Object.entries(attributes))g.setAttribute(name,new T.Float32BufferAttribute(out[name],a.itemSize));g.userData.adheredMoss212={...source.userData.adheredMoss212,tufts,role343:role,retainedSkinTriangles:skins,baseAndSeatTuftOnly:role==='base'||role==='upper-seat',sourceHostGeometry:true,closedStoneClaim:false};source.dispose();return g;
}
