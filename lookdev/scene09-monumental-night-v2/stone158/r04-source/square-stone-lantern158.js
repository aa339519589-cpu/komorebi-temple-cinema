import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Source09-specific four-sided tōrō. Only the licensed weathered shaft,
// footing and attached niche relief come from Toro156; its hexagonal head
// and macro silhouette are excluded. Attribution accompanies the exact GLB.
const TAU=Math.PI*2,hash=(x,y=0)=>{const q=Math.sin(x*127.1+y*311.7+158)*43758.5453;return q-Math.floor(q);};
const noise=(x,y,z)=>.48*Math.sin(x*13.7+y*7.1+z*4.3)+.28*Math.cos(x*32.1-y*23.7+z*11.9)+.14*Math.sin(x*71.7+z*43.1+y*37.9);
function metric(g,scale=[1,1,1]){
 const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){const x=p.getX(i)*scale[0],y=p.getY(i)*scale[1],z=p.getZ(i)*scale[2],nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));uv[i*2]=(nx>ny&&nx>nz?z:x)/.3173828125;uv[i*2+1]=(ny>=Math.max(nx,nz)?z:y)/.3173828125;}
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;
}
function age(g,seed=0){const p=g.attributes.position,old=g.attributes.color,c=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=.84+.12*noise(x*.33+seed,y*.31,z*.37)+.04*noise(x*3,y*3,z*3),v=old?.getX(i)??1;for(let k=0;k<3;k++)c[i*3+k]=a*(.79+.21*v);}g.setAttribute('color',new T.Float32BufferAttribute(c,3));return metric(g);}
function course(profile,seed=1){
 const rings=[],p=[],ix=[],N=128,dense=[profile[0]];
 for(let j=1;j<profile.length;j++){const a=profile[j-1],b=profile[j],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.027));for(let k=1;k<=n;k++)dense.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}
 for(const[r,y]of dense){const ring=[];if(r===0){ring.push(p.length/3);p.push(0,y,0);}else for(let k=0;k<N;k++){const a=k*TAU/N,c=Math.cos(a),s=Math.sin(a),rr=r/(Math.abs(c)**28+Math.abs(s)**28)**(1/28),erode=.003*noise(rr*c,y,rr*s)+.0012*noise(rr*c*4,y*4,rr*s*4);ring.push(p.length/3);p.push(c*(rr+erode),y+.0014*Math.sin(a*17+seed),s*(rr+erode));}rings.push(ring);}
 for(let j=0;j<rings.length-1;j++)for(let k=0;k<N;k++){const q=(k+1)%N,a=rings[j],b=rings[j+1];if(a.length===1)ix.push(a[0],b[k],b[q]);else if(b.length===1)ix.push(a[k],b[0],a[q]);else ix.push(a[k],b[k],a[q],a[q],b[k],b[q]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return age(g,seed);
}
function capPoint(t,a,bottom=false){
 const c=Math.cos(a),s=Math.sin(a),r=.90/(Math.abs(c)**32+Math.abs(s)**32)**(1/32),corner=Math.sin(a*2)**12;
 let rr=r*t,y=3.98+.45*(1-t)**1.45-.047*Math.sin(Math.PI*t)**2+.105*t**8*corner;
 for(let k=0;k<29;k++){const ca=hash(k,13)*TAU,w=.015+.032*hash(k,14),delta=(a-ca+Math.PI)%TAU-Math.PI,chip=(.004+.013*hash(k,15))*Math.exp(-((delta/w)**2))*t**16;rr-=chip;y-=chip*.35;}
 y-=.0045*Math.sin(a*31+.7*Math.sin(t*7))**12*Math.sin(Math.PI*t)**2;
 y+=.0022*noise(c*rr,3.98,s*rr);if(bottom)y-=.12+.025*t*t;
 return[c*rr,y,s*rr];
}
function capGeometry(){const p=[],ix=[],A=256,R=42;for(let layer=0;layer<2;layer++)for(let j=0;j<=R;j++)for(let i=0;i<A;i++)p.push(...capPoint(.002+.998*j/R,i*TAU/A,!!layer));const N=(R+1)*A;for(let j=0;j<R;j++)for(let i=0;i<A;i++){const q=(i+1)%A,a=j*A+i,b=j*A+q,c=a+A,d=b+A;ix.push(a,d,c,a,b,d,a+N,c+N,d+N,a+N,d+N,b+N);}for(let i=0;i<A;i++){const q=(i+1)%A,a=R*A+i,b=R*A+q;ix.push(a,a+N,b,a+N,b+N,b,i,q+N,i+N,i,q,q+N);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return age(g,72);}
function mossGeometry(){const proto=new T.ConeGeometry(1,1,4,1),parts=[];for(let i=0;i<1300;i++){const a=hash(i,31)*TAU,t=.17+.82*Math.sqrt(hash(i,32)),p=capPoint(t,a),damp=Math.sin(p[0]*3.7+1)+.67*Math.cos(p[2]*4.1-.7);if(damp<.65||hash(i,33)>.71)continue;const h=.007+.022*hash(i,34),r=.002+.006*hash(i,35),g=proto.clone();g.scale(r,h,r);g.rotateZ((hash(i,36)-.5)*.8);g.rotateY(a);g.translate(p[0],p[1]+h*.44,p[2]);parts.push(g);}const g=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());proto.dispose();return g;}
function valueNoise158(x,y,z){const mix=(a,b,t)=>a+(b-a)*t,ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),sx=x-ix,sy=y-iy,sz=z-iz,u=sx*sx*(3-2*sx),v=sy*sy*(3-2*sy),w=sz*sz*(3-2*sz),h=(a,b,c)=>hash(a+b*157,c*19+73);return mix(mix(mix(h(ix,iy,iz),h(ix+1,iy,iz),u),mix(h(ix,iy+1,iz),h(ix+1,iy+1,iz),u),v),mix(mix(h(ix,iy,iz+1),h(ix+1,iy,iz+1),u),mix(h(ix,iy+1,iz+1),h(ix+1,iy+1,iz+1),u),v),w);}
function mineralRind158(g,seed=1){
 // Area-weighted samples create actual small mineral grains. They do not
 // inherit the triangulation footprint of the carved body or cap.
 const p=g.attributes.position,n=g.attributes.normal,ix=g.index,N=ix?.count??p.count,areas=[],faces=[];let total=0;
 for(let k=0;k<N;k+=3){const ids=[0,1,2].map(j=>ix?ix.getX(k+j):k+j),v=ids.map(i=>new T.Vector3().fromBufferAttribute(p,i)),area=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).length()*.5;if(area<1e-10)continue;total+=area;areas.push(total);faces.push(ids);}
 const proto=new T.IcosahedronGeometry(1,0),parts=[],count=Math.max(250,Math.round(total*310));
 for(let j=0;j<count;j++){
  const wanted=hash(j+seed*97,81)*total;let lo=0,hi=areas.length-1;while(lo<hi){const m=(lo+hi)>>1;if(areas[m]<wanted)lo=m+1;else hi=m;}const ids=faces[lo],u=Math.sqrt(hash(j+seed,83)),v=hash(j+seed,89),weights=[1-u,u*(1-v),u*v],position=new T.Vector3(),normal=new T.Vector3();
  for(let k=0;k<3;k++){position.addScaledVector(new T.Vector3().fromBufferAttribute(p,ids[k]),weights[k]);normal.addScaledVector(new T.Vector3().fromBufferAttribute(n,ids[k]),weights[k]);}normal.normalize();
  const mask=.70*valueNoise158(position.x*11+seed,position.y*11,position.z*11)+.30*valueNoise158(position.x*47,position.y*47+seed,position.z*47);if(mask<.47||normal.y<-.5)continue;
  const size=.0025+.008*hash(j,seed+91)**2,grain=proto.clone();grain.scale(size,.0015+.0035*hash(j,seed+93),size*(.71+.47*hash(j,seed+97)));grain.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),normal));grain.translate(...position.clone().addScaledVector(normal,.001).toArray());const c=new Float32Array(grain.attributes.position.count*3),tone=.69+.25*hash(j,seed+101);c.fill(tone);grain.setAttribute('color',new T.Float32BufferAttribute(c,3));metric(grain);parts.push(grain);
 }
 const out=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());proto.dispose();return out;
}

function strengthenCapturedWeather158(g){
 const profileY=[.47,.57,.70,.78,1.34,1.49,1.60,1.68],profileW=[.44,.44,.345,.325,.325,.365,.38,.38],p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),sourceY=y/1.60;if(sourceY<.48||sourceY>1.67)continue;let k=0;while(k<profileY.length-2&&profileY[k+1]<sourceY)k++;const t=(sourceY-profileY[k])/(profileY[k+1]-profileY[k]),half=(profileW[k]+(profileW[k+1]-profileW[k])*t)*.90,a=Math.atan2(z,x),radius=Math.hypot(x,z),reference=half/(Math.abs(Math.cos(a))**24+Math.abs(Math.sin(a))**24)**(1/24),residual=radius-reference;
  // Boolean niche returns are not weathering samples and are preserved.
  if(Math.abs(residual)>.018)continue;const blend=Math.min(1,(sourceY-.48)/.08,(1.67-sourceY)/.08),extra=Math.max(-.025,Math.min(.025,residual*1.8))*Math.max(0,blend),q=(radius+extra)/radius;p.setXYZ(i,x*q,y,z*q);
 }
 g.computeVertexNormals();return g;
}
function hipGeometry158(a){
 const points=Array.from({length:33},(_,i)=>{const p=capPoint(.14+.86*i/32,a);p[1]+=.011;return new T.Vector3(...p);}),curve=new T.CatmullRomCurve3(points),frames=curve.computeFrenetFrames(40,false),p=[],ix=[],N=40,K=8;
 for(let j=0;j<=N;j++){const c=curve.getPointAt(j/N),r=.016*(.88+.12*Math.sin(j*.71));for(let k=0;k<K;k++){const a=k*TAU/K,v=c.clone().addScaledVector(frames.normals[j],Math.cos(a)*r).addScaledVector(frames.binormals[j],Math.sin(a)*r);p.push(v.x,v.y,v.z);}if(j<N)for(let k=0;k<K;k++){const q=(k+1)%K,u=j*K+k,v=j*K+q;ix.push(u,u+K,v,v,u+K,v+K);}}
 for(const[j,top]of[[0,false],[N,true]]){const c=curve.getPointAt(j/N),id=p.length/3;p.push(c.x,c.y,c.z);for(let k=0;k<K;k++){const a=j*K+k,b=j*K+(k+1)%K;ix.push(id,...(top?[a,b]:[b,a]));}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return age(g,83);
}
function mineral(name,color,maps){
 const m=new T.MeshStandardMaterial({name,color,map:maps[0],normalMap:maps[1],roughnessMap:maps[2],normalScale:new T.Vector2(.34,.34),roughness:.9,metalness:0,vertexColors:true});
 m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
 vec3 aggregate=texture2D(map,vMapUv).rgb;float luminance=dot(aggregate,vec3(.2126,.7152,.0722));diffuseColor.rgb*=clamp(pow(max(luminance,.0001)/.153180782734,.55),.68,1.36);
 #endif`).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(.76+.20*roughnessFactor,.78,.95);');};m.customProgramCacheKey=()=>name+'-unchanged-CC0-mineral158';return m;
}
export async function createSquareStoneLantern158({materials:M,ownedMaterials,ownedTextures}){
 const loader=new T.TextureLoader(),[asset,...maps]=await Promise.all([new GLTFLoader().loadAsync(new URL('../assets/toro09-158/shaft-components158.glb',import.meta.url).href),...['diff','nor_gl','rough'].map(k=>loader.loadAsync(new URL('../assets/granite-tile-04/granite-face-'+k+'.png',import.meta.url).href))]);maps.forEach((t,i)=>{t.wrapS=t.wrapT=T.MirroredRepeatWrapping;t.anisotropy=8;if(i===0)t.colorSpace=T.SRGBColorSpace;ownedTextures.push(t);});
 const stone=mineral('scene09-toro158-eroded-granite',0x7a827c,maps),chamberStone=mineral('scene09-toro158-damp-chamber-stone',0x3e4b46,maps),rind=mineral('scene09-toro158-solid-weathered-mineral-rind',0xa3aa97,maps),cap=mineral('scene09-toro158-damp-square-kasa',0x58625e,maps),moss=new T.MeshStandardMaterial({name:'scene09-toro158-real-moss-fibre-solids',color:0x435137,roughness:1,metalness:0}),bronze=new T.MeshStandardMaterial({name:'scene09-toro158-oxidised-window-castings',color:0x493e2b,roughness:.62,metalness:.62});ownedMaterials.push(stone,chamberStone,rind,cap,moss,bronze);
 const pieces=[];asset.scene.updateMatrixWorld(true);asset.scene.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);const foot=o.name.startsWith('Broad_irregular')||o.name.startsWith('Broad irregular'),scaleXZ=foot?.80:.90;g.scale(scaleXZ,1.60,scaleXZ);if(o.name.startsWith('Captured_weathered')||o.name.startsWith('Captured weathered'))strengthenCapturedWeather158(g);age(g,18);pieces.push(g);});const shaft=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());
 const bed=course([[0,2.60],[.49,2.60],[.56,2.67],[.59,2.77],[.59,2.89],[.56,2.94],[0,2.94]],21),sill=course([[0,2.90],[.50,2.90],[.55,2.96],[.54,3.07],[.49,3.11],[0,3.11]],27),lintel=course([[.31,3.87],[.51,3.87],[.55,3.93],[.53,4.02],[.31,4.02],[.31,3.87]],31),pier=course([[0,0],[.078,0],[.067,.10],[.064,.43],[.077,.80],[.082,.87],[0,.87]],41),roof=capGeometry(),crown=course([[0,4.37],[.10,4.37],[.145,4.43],[.13,4.53],[.09,4.59],[0,4.59]],51),ball=age(new T.SphereGeometry(.125,32,20).translate(0,4.70,0),61),terminal=course([[0,4.81],[.045,4.81],[.043,4.88],[0,4.95]],71),mossGeo=mossGeometry(),cache=new Map();let builds=[];
 const hips=[0,1,2,3].map(i=>hipGeometry158(Math.PI/4+i*Math.PI/2));const weathered=[[shaft,mineralRind158(shaft,11)],[bed,mineralRind158(bed,17)],[sill,mineralRind158(sill,23)],[roof,mineralRind158(roof,29)]];
 function build(api,x,z,s=1,hero=false){const scale=[s*(hero?1:.92),s*(hero?1:4.06/4.95),s*(hero?1:.92)],yaw=-.22;api.group(x,0,z,yaw,()=>{
  const emit=(g,m,px=0,py=0,pz=0,sx=1,sy=1,sz=1,rot=0)=>{let geo=g;if([stone,cap,chamberStone,rind].includes(m)){const key=g.uuid+':'+[scale[0]*sx,scale[1]*sy,scale[2]*sz].map(v=>v.toFixed(5)).join(',');if(!cache.has(key))cache.set(key,metric(g.clone(),[scale[0]*sx,scale[1]*sy,scale[2]*sz]));geo=cache.get(key);}api.emit(geo,m,px,py,pz,sx,sy,sz,rot);};
  for(const g of[shaft,bed,sill])emit(g,stone);emit(lintel,chamberStone);for(const g of[roof,crown,ball,terminal,...hips])emit(g,cap);
  for(const a of[-1,1])for(const b of[-1,1])emit(pier,chamberStone,a*.42,3.06,b*.42);
  for(let face=0;face<4;face++)api.group(0,0,0,face*Math.PI/2,()=>{
   api.box(0,3.49,.409,.735,.745,.012,M.stonePaper);
   for(const xx of[-.37,.37])api.box(xx,3.49,.477,.027,.83,.033,bronze);
   for(const yy of[3.09,3.89])api.box(0,yy,.478,.76,.035,.035,bronze);
   for(const xx of[-.23,0,.23])api.box(xx,3.49,.480,.018,.78,.023,bronze);
   for(const yy of[3.29,3.49,3.69])api.box(0,yy,.482,.735,.017,.025,bronze);
  });
  for(const[,g]of weathered)emit(g,rind);emit(mossGeo,moss);api.light(0,3.49,0,7.2,3.6,{stoneHero158:hero});
 },scale);builds.push({anchor:[x,z],size:s,hero,scale,yaw});}
 return{build,materials:{stone,cap,moss,bronze},info:{revision:'scene09-square-stone-toro158-r04',source:'Japanese Toro by3dlunatic CC BY4.0, exact selected Toro156 shaft/foot/niche components; new source09 square head and cap',componentGLB:'assets/toro09-158/shaft-components158.glb',mapPixelsUnchanged:true,heroLocalHeight:4.95,ordinaryLocalHeight:4.06,squareChamber:true,fourCornerCap:true,newLightsAdded:0,existingPracticalRelocatedToChamber:true,builds,visualAccepted:false}};
}
