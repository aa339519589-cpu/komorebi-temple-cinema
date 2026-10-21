import {T,V,gridGeometry} from './kernel.js';
import {layout} from './layout117.js';

export function ensureBankSoil147(mats){
 if(mats.bankSoil147)return;
 const soil=mats.stone.clone();soil.name='scene02-continuous-planted-bank-mineral-soil';soil.color.setHex(0x66513a);soil.roughness=1;soil.metalness=0;soil.bumpScale=.018;mats.bankSoil147=soil;
}

// Continuous closed earth shoulders follow the actual stair and bridge seats.
// Embedded eroded rock outcrops carry the slope. Original scanned understory
// roots meet that same surface; foliage never replaces the terrain volume.
export function buildPlantedShoulders147({b,mats,scanned,understory}){
 ensureBankSoil147(mats);
 let state=0x1475eed;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const stats={continuousSoilVolumes:0,embeddedOutcrops:0,scannedShrubs:0,scannedPeriwinkle:0,rootContact:'All original botanical base vertices are normalized to root y0 and embedded25mm into the evaluated physical soil surface',stairShoulders:[]};
 for(const [key,variants]of Object.entries({shrub:understory.shrub,periwinkle:understory.periwinkle}))for(const [i,v]of variants.entries())mats[`scene02Understory147${key}${i}`]=v.material;
 function solidSurface(rows,name,bottom=-.34){
  const top=gridGeometry(rows),positions=Array.from(top.attributes.position.array),indices=Array.from(top.index.array),width=rows[0].length,height=rows.length,ring=[];
  let yNormal=0;for(let i=0;i<top.attributes.normal.count;i++)yNormal+=top.attributes.normal.getY(i);
  if(yNormal<0)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  for(let i=0;i<width;i++)ring.push(i);for(let j=1;j<height;j++)ring.push(j*width+width-1);for(let i=width-2;i>=0;i--)ring.push((height-1)*width+i);for(let j=height-2;j>0;j--)ring.push(j*width);
  if(yNormal<0)ring.reverse();
  const lower=ring.map(i=>{const n=positions.length/3;positions.push(positions[i*3],bottom,positions[i*3+2]);return n;}),c=positions.length/3;let cx=0,cz=0;
  for(const i of ring){cx+=positions[i*3];cz+=positions[i*3+2];}positions.push(cx/ring.length,bottom,cz/ring.length);
  for(let i=0;i<ring.length;i++){const j=(i+1)%ring.length;indices.push(ring[i],ring[j],lower[i],ring[j],lower[j],lower[i],c,lower[i],lower[j]);}
  const g=new T.BufferGeometry(),uv=[];for(let i=0;i<positions.length;i+=3)uv.push(positions[i]*1.9,positions[i+2]*1.9);
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.name=name;top.dispose();b.put(g,'bankSoil147');stats.continuousSoilVolumes++;
 }
 function solidRadialBank(surface,name,bottom=-.40){
  // Unique rings and true poles avoid the rejected wrapped-grid cap, whose
  // duplicated seam generated non-manifold edges under the bearing core.
  const N=64,R=18,positions=[...surface(0,0)],uv=[0,0],indices=[];
  for(let ring=1;ring<=R;ring++)for(let j=0;j<N;j++){const p=surface(ring/R,j*Math.PI*2/N);positions.push(...p);uv.push(p[0]*1.9,p[2]*1.9);}
  for(let j=0;j<N;j++)indices.push(0,1+(j+1)%N,1+j);
  for(let ring=0;ring<R-1;ring++)for(let j=0;j<N;j++){
   const a=1+ring*N+j,c=a+N,q=(j+1)%N,bb=1+ring*N+q,d=bb+N;indices.push(a,bb,c,bb,d,c);
  }
  const lower=positions.length/3,outer=1+(R-1)*N;
  for(let j=0;j<N;j++){const a=(outer+j)*3;positions.push(positions[a],bottom,positions[a+2]);uv.push(positions[a]*1.9,positions[a+2]*1.9);}
  const center=positions.length/3,pole=surface(0,0);positions.push(pole[0],bottom,pole[2]);uv.push(pole[0]*1.9,pole[2]*1.9);
  for(let j=0;j<N;j++){const q=(j+1)%N;indices.push(outer+j,outer+q,lower+j,outer+q,lower+q,lower+j,center,lower+j,lower+q);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.name=name;b.put(g,'bankSoil147');stats.continuousSoilVolumes++;
 }
 function outcrop(p,r,index,embed=.42){
  const item=scanned.variants[index%scanned.variants.length],scale=[r*(.86+random()*.28),r*(.76+random()*.34),r*(.75+random()*.48)],rotation=[(random()-.5)*.48,random()*Math.PI*2,(random()-.5)*.42],matrix=new T.Matrix4().compose(V([0,0,0]),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),V(scale)),v=new T.Vector3(),positions=item.geometry.attributes.position;let min=Infinity,max=-Infinity;
  for(let i=0;i<positions.count;i++){v.fromBufferAttribute(positions,i).applyMatrix4(matrix);min=Math.min(min,v.y);max=Math.max(max,v.y);}
  const y=p[1]-min-(max-min)*embed;b.put(item.geometry,p[1]<.12?item.wet:item.dry,[p[0],y,p[2]],scale,rotation,.77+random()*.24);stats.embeddedOutcrops++;
 }
 function plant(kind,p,height,index,yaw=null){
  const variants=understory[kind],item=variants[index%variants.length],s=height/item.height,rotation=[(random()-.5)*.045,yaw??random()*Math.PI*2,(random()-.5)*.045];
  b.put(item.geometry,item.material,[p[0],p[1]-.025,p[2]],[s*(.89+random()*.22),s,s*(.91+random()*.22)],rotation,.77+random()*.29);
  if(kind==='shrub')stats.scannedShrubs++;else stats.scannedPeriwinkle++;
 }
 const hall=new T.Matrix4().compose(V(layout.hall.position),new T.Quaternion().setFromAxisAngle(V([0,1,0]),layout.hall.yaw),V(layout.hall.scale)),top=V([0,2.2,6.15]).applyMatrix4(hall),bottom=V([5.55722966,1.7,1.34483218]),direction=top.clone().sub(bottom),run=Math.hypot(direction.x,direction.z),along=V([direction.x/run,0,direction.z/run]),across=V([along.z,0,-along.x]),smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 function shoulder(t,u,side){
  const q=Math.max(0,Math.min(1,t)),width=2.35+3.75*smooth(q/.85)+.28*Math.sin(t*9+side),inner= t<0?.20+(bottom.y-.38)*smooth((t+.22)/.22):T.MathUtils.lerp(bottom.y-.18,top.y-.18,q),end=t>1?1-smooth((t-1)/.22):1,outer=-.105,shape=u<.72?1-.45*u:.676*(1-smooth((u-.72)/.28)),height=outer+(inner-outer)*shape*end+.13*Math.sin(t*13+side*2)*Math.sin(u*Math.PI)**2;
  const reach=1.59+u*width,p=bottom.clone().addScaledVector(along,t*run).addScaledVector(across,side*reach);return[p.x,height,p.z];
 }
 for(const side of[-1,1]){
  solidSurface(Array.from({length:51},(_,j)=>Array.from({length:23},(_,i)=>shoulder(-.22+1.44*j/50,i/22,side))),`scene02-closed-continuous-stair-soil-shoulder-${side}`);
  for(let j=0;j<19;j++)for(let band=0;band<3;band++){
   const t=-.13+(j+.15+random()*.65)/19*1.28,u=.12+band*.29+(random()-.5)*.11,p=shoulder(t,u,side),r=.43+random()*.42+(band===0?.12:0);
   if((j+band)%5!==1)outcrop(p,r,j*3+band+(side<0?2:0),.48);
   const plantU=Math.min(.94,u+.10+random()*.12),plantP=shoulder(t+(random()-.5)*.025,plantU,side);
   if((j+band)%3!==0)plant('shrub',plantP,.65+random()*.50,j*3+band);
   for(let k=0;k<2;k++){const pp=shoulder(t+(random()-.5)*.036,Math.min(.97,plantU+(random()-.5)*.21),side);plant('periwinkle',pp,.21+random()*.17,j*7+band*3+k);}
  }
  stats.stairShoulders.push({side,innerBearing:'Actual stair cheek toe1.59metres from the fixed stair axis',runMetres:run,range:[-.22,1.22],surface:'Closed irregular graded soil, with a rolling outer toe and interlocked eroded outcrops'});
 }
 // A continuous raised garden shoulder wraps the exposed east foundation.
 // Its crest meets the side wall below the terrace, instead of terminating
 // inside the building as the first narrow stair-only shoulder did.
 function eastTerrace(t,u){
  const z=-6.8+14.3*t,x=9.25+(7.1+.45*Math.sin(t*8))*u,p=V([x,0,z]).applyMatrix4(hall),crest=4.08+.16*Math.sin(t*5.7),shape=1-smooth(u),end=t<.07?smooth(t/.07):t>1.02?1-smooth((t-1.02)/.25):1;
  return[p.x,-.11+(crest+.11)*shape*end,p.z];
 }
 solidSurface(Array.from({length:43},(_,j)=>Array.from({length:22},(_,i)=>eastTerrace(j/42*1.27,i/21))),'scene02-closed-planted-east-foundation-shoulder');
 for(let j=0;j<28;j++)for(let band=0;band<3;band++){
  const t=.06+(j+.2+random()*.5)/28*1.13,u=.08+band*.24+(random()-.5)*.10,p=eastTerrace(t,u);
  if((j+band)%4!==0)outcrop(p,.43+random()*.43,j*3+band+2,.48);
  if((j+band)%3===1)plant('shrub',eastTerrace(t,Math.min(.96,u+.10)),.67+random()*.45,j+band+1);
 }
 for(let j=0;j<35;j++)for(let band=0;band<9;band++){
  const t=.04+(j+.15+random()*.65)/35*1.19,u=.07+(band+.15+random()*.6)/9*.86;
  if(Math.sin(t*26+u*17)+Math.cos(t*15-u*18)>.95)continue;
  plant('periwinkle',eastTerrace(t,u),.29+random()*.17,j*3+band+2);
 }
 const bridge=new T.Matrix4().compose(V(layout.bridge.position),new T.Quaternion().setFromAxisAngle(V([0,1,0]),layout.bridge.yaw),V(layout.bridge.scale));
 for(const side of[-1,1]){
  const center=V([side*7.08,0,0]).applyMatrix4(bridge),peak=side<0?.57:1.09,rx=side<0?2.30:2.42,rz=2.72;
  function bank(t,a){
   const shape=Math.pow(Math.max(0,1-t*t),1.30),r=1+.075*Math.sin(a*5+side)+.04*Math.sin(a*9),x=center.x+Math.cos(a)*rx*t*r,z=center.z+Math.sin(a)*rz*t*r;return[x,-.12+(peak+.12)*shape,z];
  }
  solidRadialBank(bank,`scene02-closed-planted-bridge-shoulder-${side}`,-.40);
  for(let j=0;j<20;j++){
   const a=j*2.399+side*.6,t=.59+random()*.27,p=bank(t,a);outcrop(p,.43+random()*.40,j+2,.43);
   if(j%3!==0){const pp=bank(Math.min(.95,t+.035),a+.16);plant('shrub',pp,.34+random()*.44,j+side+5);}
   for(let k=0;k<3;k++)plant('periwinkle',bank(Math.min(.96,t+.055+random()*.05),a+.10+(k-1)*.11),.18+random()*.19,j*3+k);
  }
 }
 // Continuous low mats follow the evaluated shoulder surface. Smaller
 // original variants keep plant detail fine while the patch coverage is dense.
 for(const side of[-1,1])for(let j=0;j<43;j++)for(let band=0;band<10;band++){
  const t=-.13+(j+.12+random()*.75)/43*1.22,u=.10+(band+.15+random()*.68)/10*.86;
  if(Math.sin(t*24+u*15+side)+Math.cos(t*13-u*19)>.98)continue;
  const p=shoulder(t,u,side);plant('periwinkle',p,.29+random()*.18,j*5+band);
 }
 // This soil strip follows the actual bounded pond edge rather than the old
 // straight x10 approximation, so its roots stand on land at every station.
 const shoreline=[[4.8,10.7],[8.1,11.5],[11,12.4],[15,13.4],[20.5,14.8],[23.4,15.45]],shoreX=z=>{let i=0;while(i<shoreline.length-2&&z>shoreline[i+1][0])i++;const a=shoreline[i],c=shoreline[i+1],t=Math.max(0,Math.min(1,(z-a[0])/(c[0]-a[0])));return a[1]+(c[1]-a[1])*t;};
 const shorePoint=(z,u)=>[shoreX(z)+.04+u*.82,-.09+.34*Math.sin(Math.PI*u*.80)**.72,z];
 solidSurface(Array.from({length:55},(_,j)=>Array.from({length:10},(_,i)=>shorePoint(4.8+j*18.6/54,i/9))),'scene02-closed-pondside-understory-soil-strip');
 for(let j=0;j<53;j++){
  const z=4.85+j*.35,p=shorePoint(z,.58);
  if(j%3!==1)plant('shrub',p,.43+random()*.38,j+3);
  for(let k=0;k<3;k++)plant('periwinkle',shorePoint(z+(random()-.5)*.13,.18+k*.22),.25+random()*.15,j*3+k);
 }
 return{...stats,understory:understory.info,bridgeDeckAndCameraChanged:false,visualAccepted:false};
}
