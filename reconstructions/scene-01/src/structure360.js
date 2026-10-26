import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {layout124 as L} from './layout124.js';
import {prism124,stairLandingPlan124} from './layout-components124.js';
import {bridgeMedallion298} from './foreground-craft298.js';

// Measured in metres. HD01 determines silhouette and assembly; the photographs
// never enter a material, scene plane, texture, height field or depth surface.
// The held353 camera, hall/stair anchors, bridge endpoints and lighting remain.
const G=L.bridge,H=G.halfSpan,S=L.stair;
const oldDeck=x=>G.deckBaseline+.085+G.archRise*(1-(x/H)**2)+G.slope*x/H;
export const bridgeDeck360=x=>oldDeck(x)+.23*Math.max(0,1-(x/H)**2);
const soffit=x=>oldDeck(x)-.53;
const bridgeMatrix=new T.Matrix4().compose(new T.Vector3(...G.position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),G.yaw),new T.Vector3(...G.scale));
const worldBridge=(u,v)=>new T.Vector3(u,0,v).applyMatrix4(bridgeMatrix);
const localBridge=(x,z)=>new T.Vector3(x,G.position[1],z).applyMatrix4(bridgeMatrix.clone().invert());
const bearingX=-.50;

function bridgeFinishes(B){
 // Role-specific inferred lacquer pigments. The353 scan maps, metric UVs,
 // weathering/roughness shaders, light boundary and outdoor finish remain.
 for(const [name,base,pigment]of[['structure360UpperGirder','red',[.070,.0135,.0115]],['structure360LowerGirder','wood',[.030,.0070,.0085]],['structure360Bent','wood',[.058,.020,.010]]]){
  if(B.m[name])continue;const source=B.m[base],m=source.clone();m.name=name;
  m.onBeforeCompile=source.onBeforeCompile;m.customProgramCacheKey=()=>source.customProgramCacheKey()+':'+name;
  m.color.setRGB(...pigment);m.userData={...source.userData,timberPaletteRole353:name,surface353:{...source.userData.surface353,pigmentLinear:pigment,scope:'Inferred aged bridge lacquer fromHD01, not measured reflectance.'}};B.m[name]=m;
 }
}

function member(B,{a=-H,b=H,z=0,width=.26,top,bottom,material='wood',name='arched-timber',notches=[]}){
 const samples=Array.from({length:65},(_,i)=>({x:a+(b-a)*i/64,n:false}));
 for(const x of notches){const l=x-.072,r=x+.072;if(l<=a||r>=b)continue;
  for(let j=samples.length-1;j>=0;j--)if(samples[j].x>=l&&samples[j].x<=r)samples.splice(j,1);
  samples.push({x:l,n:false},{x:l,n:true},{x:r,n:true},{x:r,n:false});
 }
 samples.sort((p,q)=>p.x-q.x);
 const p=samples.map(q=>[q.x,q.n?bridgeDeck360(q.x)-.29:top(q.x)]);
 p.push(...[...new Set(samples.map(q=>q.x))].reverse().map(x=>[x,bottom(x)]));
 const s=new T.Shape();s.moveTo(...p[0]);for(const q of p.slice(1))s.lineTo(...q);s.closePath();
 const bevel=.0025;let g=new T.ExtrudeGeometry(s,{depth:width-2*bevel,steps:1,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2});
 // Near-straight short arcs can give ExtrudeGeometry collapsed bevel
 // triangles. Remove only zero-area primitives and keep the original UVs,
 // normals and vertices of all genuine physical member faces.
 const positions=g.attributes.position,keep=[];
 for(let i=0;i<positions.count;i+=3){const a=new T.Vector3().fromBufferAttribute(positions,i),b=new T.Vector3().fromBufferAttribute(positions,i+1),c=new T.Vector3().fromBufferAttribute(positions,i+2);if(b.sub(a).cross(c.sub(a)).lengthSq()>1e-22)keep.push(i,i+1,i+2);}
 if(keep.length<positions.count){const clean=new T.BufferGeometry();for(const [name,attr]of Object.entries(g.attributes)){const data=new Float32Array(keep.length*attr.itemSize);for(let i=0;i<keep.length;i++)for(let k=0;k<attr.itemSize;k++)data[i*attr.itemSize+k]=attr.array[keep[i]*attr.itemSize+k];clean.setAttribute(name,new T.BufferAttribute(data,attr.itemSize,attr.normalized));}g.dispose();g=clean;}
 g.translate(0,0,z-width/2+bevel);g.name='structure360-closed-'+name;g.userData={structure360:true,physicalMember:true,arrisesMetres:bevel};B.emit(g,material);
}

function metricUV(g){
 const raw=g.index?g.toNonIndexed():g,p=raw.attributes.position,uv=[];
 for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2),n=b.sub(a).cross(c.sub(a));
  for(let j=i;j<i+3;j++)if(Math.abs(n.y)>Math.max(Math.abs(n.x),Math.abs(n.z)))uv.push(p.getX(j),p.getZ(j));else if(Math.abs(n.x)>Math.abs(n.z))uv.push(p.getZ(j),p.getY(j));else uv.push(p.getX(j),p.getY(j));
 }
 raw.setAttribute('uv',new T.Float32BufferAttribute(uv,2));raw.computeVertexNormals();if(raw!==g)g.dispose();return raw;
}

function loft(bottom,top,lo,hi,name){
 const p=[],ix=[],N=bottom.length;
 for(const [poly,y]of[[bottom,lo],[top,hi]])for(const q of poly)p.push(q[0],typeof y==='function'?y(q):y,q[1]);
 for(let i=1;i<N-1;i++)ix.push(0,i+1,i,N,N+i,N+i+1);
 for(let i=0;i<N;i++){const j=(i+1)%N;ix.push(i,j,N+i,j,N+j,N+i);}
 let volume=0;for(let i=0;i<ix.length;i+=3){const a=new T.Vector3().fromArray(p,ix[i]*3),b=new T.Vector3().fromArray(p,ix[i+1]*3),c=new T.Vector3().fromArray(p,ix[i+2]*3);volume+=a.dot(b.cross(c))/6;}
 if(volume<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.name='structure360-closed-'+name;g.userData={structure360:true,closedVolume:Math.abs(volume)};return metricUV(g);
}

const stoneCache=new Map();
function dressedStone(w,h,d,seed=0){
 const key=[w,h,d,seed%4].map(x=>Number(x).toFixed(4)).join('|');if(stoneCache.has(key))return stoneCache.get(key);
 const g=new RoundedBoxGeometry(w,h,d,2,Math.min(.006,h*.10)),p=g.attributes.position;
 // Millimetre-scale foot wear is geometric and confined to the top/nose.
 // The underside remains planar and fully seated on its masonry bed.
 for(let i=0;i<p.count;i++)if(p.getY(i)>h/2-.007){
  const x=p.getX(i),z=p.getZ(i),nose=1-T.MathUtils.smoothstep(z,-d*.5,-d*.05),riven=.5+.25*Math.sin(x*29.7+seed*1.31)+.25*Math.sin(x*63.2-seed*.71),wear=(h<.09?.0045:.0018)*nose*(.25+.75*riven);
  p.setY(i,p.getY(i)-wear);if(h<.09&&z<-d/2+.009)p.setZ(i,z+.003*nose*riven);
 }
 g.computeVertexNormals();g.name='structure360-closed-dressed-stone-riven-soft-nose';g.userData={structure360:true,physicalWearMetres:h<.09?.0045:.0018,rivenNoseEdgeMetres:h<.09?.003:0,arrisesMetres:.006};stoneCache.set(key,g);return g;
}

function cutBlock(B,x,y,z,w,h,d,material='stone',seed=0,yaw=0){const tint=['stone','stoneLight'].includes(material)?.965+.070*(.5+.5*Math.sin(seed*12.413+.73)):1;B.emit(dressedStone(w,h,d,seed),material,x,y,z,1,1,1,yaw,tint);}

function pierStone(B,u,v,lo,hi,halfWidth,halfDepth,seed){
 const bottom=[[-halfWidth,-halfDepth],[halfWidth,-halfDepth],[halfWidth,halfDepth],[-halfWidth,halfDepth]].map(q=>[u+q[0],v+q[1]]),top=bottom.map(([x,z])=>[u+(x-u)*.94,v+(z-v)*.94]);
 B.emit(loft(bottom,top,lo,hi,'battered-bearing-stone-'+seed),'shore298Rock');
}

export function bridgeBearingTerrain360(x,z,current){
 const q=localBridge(x,z),r=Math.min(...[-.55,.55].map(v=>Math.hypot((q.x-bearingX)/.89,(q.z-v)/.77)));
 const shoulder=1.28*(1-T.MathUtils.smoothstep(r,.32,1));
 let height=Math.max(current,shoulder);
 // The abutment's lower courses are backed by an actual bank. The mound
 // falls away inside the span and leaves the open middle channel intact.
 for(const sign of[-1,1]){
  const u=sign*q.x,radial=Math.hypot((u-(H+.28))/1.16,q.z/1.80),outside=T.MathUtils.smoothstep(Math.abs(q.z),1.10,1.28),endTop=G.position[1]+oldDeck(sign*H)-.61+.37*outside;
  const back=1-T.MathUtils.smoothstep(radial,.44,1.20),mouth=T.MathUtils.smoothstep(u,H-.88,H-.17);
  height=Math.max(height,.13+(endTop-.13)*back*mouth);
 }
 return height;
}

function housedPost(B,x,z,major){
 const y=bridgeDeck360(x),foot=major?.19:.14,head=major?.153:.127;
 const half=h=>(foot+(head-foot)*T.MathUtils.clamp((h+.30)/1.095,0,1))/2;
 const rect=(h,z0=null,z1=null)=>{const w=half(h);return[[x-w,z0??z-w],[x+w,z0??z-w],[x+w,z1??z+w],[x-w,z1??z+w]];};
 const openings=[[.155,.086,.080],[.412,.077,.085],[.745,.082,.105]];
 let lo=-.30;
 for(const [height,h,w]of openings){
  const a=height-h/2-.002,b=height+h/2+.002;
  B.emit(loft(rect(lo),rect(a),q=>bridgeDeck360(q[0])+lo,q=>bridgeDeck360(q[0])+a,'post-solid-between-rail-mortises'),'red');
  // A through mortise has two real side cheeks. The rails pass into its
  // open end grain; no opaque post cube intersects the received rail.
  for(const side of[-1,1]){
   const z0=side<0?z-half(a):z+w/2+.001,z1=side<0?z-w/2-.001:z+half(a);
   const t0=side<0?z-half(b):z+w/2+.001,t1=side<0?z-w/2-.001:z+half(b);
   B.emit(loft(rect(a,z0,z1),rect(b,t0,t1),q=>bridgeDeck360(q[0])+a,q=>bridgeDeck360(q[0])+b,'post-cheek-around-real-through-mortise'),'red');
  }
  lo=b;
 }
 B.emit(loft(rect(lo),rect(.795),q=>bridgeDeck360(q[0])+lo,y+.795,'post-head-above-top-rail-mortise'),'red');
 // The wooden peg crosses the middle housed rail and remains seated in
 // both mortise cheeks, with only its small round head exposed.
 B.emit(new T.CylinderGeometry(.010,.010,head+.012,12).rotateX(Math.PI/2),'darkwood',x,y+.412,z);
 return {y,head,w:foot};
}

function fittedHeelHardware(B,x,y,side,w,head){
 const face=h=>Math.max(1.170,1.085+(w+(head-w)*T.MathUtils.clamp((h+.30)/1.095,0,1))/2);
 const g=new T.BoxGeometry(w*.62,.205,.008),p=g.attributes.position;
 for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)+side*(face(p.getY(i)-.195)+.004));
 g.computeVertexNormals();g.name='structure360-closed-heel-strap-fitted-to-tapered-post-and-fascia';g.userData={structure360:true,solidStrapThicknessMetres:.008,backFaceSeated:true};B.emit(g,'bronze',x,y-.195,0);
 for(const h of[-.260,-.130])B.emit(new T.CylinderGeometry(.014,.014,.008,12).rotateX(Math.PI/2),'goldDark',x,y+h,side*(face(h)+.010));
}

export function buildBridge360(B){
 bridgeFinishes(B);
 B.label('structure208-half-lapped-arched-garden-bridge',()=>B.with(...G.position,G.yaw,()=>{
  const joists=Array.from({length:13},(_,i)=>-H+.18+(2*H-.36)*i/12);
  const binders=joists.filter((x,i)=>i%2===0);
  // The deck crown rises within the held end planes. Its original lower
  // silhouette stays fixed: the reference has a deep arch fascia and a
  // low, open balustrade rather than a thin deck below a tall fence.
  for(const z of[-.96,0,.96]){
   member(B,{z,width:.27,top:x=>bridgeDeck360(x)-.17,bottom:x=>bridgeDeck360(x)-.36,notches:joists,material:'structure360UpperGirder',name:'housed-arch-girder-upper'});
   member(B,{z,width:.27,top:x=>bridgeDeck360(x)-.36,bottom:soffit,material:'structure360LowerGirder',name:'deep-continuous-arch-girder'});
  }
  for(const x of joists)member(B,{a:x-.072,b:x+.072,z:0,width:2.21,top:a=>bridgeDeck360(a)-.17,bottom:a=>bridgeDeck360(a)-.29,name:'cross-joist-seated-in-three-girders'});
  for(const x of binders)member(B,{a:x-.060,b:x+.060,z:0,width:2.39,top:soffit,bottom:a=>soffit(a)-.105,material:'structure360LowerGirder',name:'lower-cross-binder-seated-under-three-arched-girders'});
  for(let i=0;i<57;i++){const a=-H+2*H*i/57+.0012,b=-H+2*H*(i+1)/57-.0012;member(B,{a,b,z:0,width:2.18,top:bridgeDeck360,bottom:x=>bridgeDeck360(x)-.17,material:'wood',name:'transverse-deck-plank'});}
  for(const side of[-1,1]){
   // The main inner girders are continuous. Scarfed outer cover boards are
   // individually closed, with 2mm joints and matching arched beds.
   for(const [a,b]of[[-H,-H/3],[-H/3,H/3],[H/3,H]]){
    member(B,{a:a+.001,b:b-.001,z:side*1.120,width:.100,top:x=>bridgeDeck360(x)-.025,bottom:x=>bridgeDeck360(x)-.34,material:'structure360UpperGirder',name:'scarfed-upper-arch-fascia'});
    member(B,{a:a+.001,b:b-.001,z:side*1.095,width:.075,top:x=>bridgeDeck360(x)-.35,bottom:soffit,material:'structure360LowerGirder',name:'scarfed-lower-arch-fascia'});
   }
   member(B,{z:side*1.140,width:.025,top:x=>soffit(x)+.035,bottom:x=>soffit(x)+.012,material:'structure360LowerGirder',name:'continuous-lower-arch-edge-moulding-seated-on-fascia'});
   member(B,{z:side*1.147,width:.018,top:x=>bridgeDeck360(x)-.040,bottom:x=>bridgeDeck360(x)-.065,material:'wood',name:'deck-edge-weathering-bead'});
   const postXs=Array.from({length:9},(_,i)=>-H+2*H*i/8);
   for(let span=0;span<8;span++)for(const [height,h,w]of[[.745,.082,.105],[.412,.077,.085],[.155,.086,.080]]){
    member(B,{a:postXs[span]+.002,b:postXs[span+1]-.002,z:side*1.085,width:w,top:x=>bridgeDeck360(x)+height+h/2,bottom:x=>bridgeDeck360(x)+height-h/2,material:'redLight',name:'separate-curved-rail-received-through-post-mortises'});
   }
   for(let i=0;i<postXs.length;i++){
    const x=postXs[i],z=side*1.085,major=i%2===0,{y,head,w}=housedPost(B,x,z,major);
    // Small collars, fitted heel straps and pins sit on actual timber.
    B.box(x,y+.788,z,head+.018,.026,head+.018,'bronze');
    fittedHeelHardware(B,x,y,side,w,head);
    // The cast plate's original back is Z1.14895. Its21mm move seats it
    // into the new Z1.170 upper fascia face, retaining all chased relief.
    B.with(0,0,side*.021,0,()=>bridgeMedallion298(B,x,y-.075,side));
    B.box(x,y-.430,side*1.139,.127,.191,.014,'goldDark');
    for(const dx of[-.050,.050])B.box(x+dx,y-.430,side*1.149,.008,.167,.006,'gold');
    for(const yy of[-.506,-.354])B.box(x,y+yy,side*1.149,.105,.008,.006,'gold');
    if(major){
     const cap=new T.LatheGeometry([[0,0],[.093,0],[.098,.016],[.069,.038],[.062,.080],[.087,.123],[.080,.165],[.048,.195],[.024,.221],[0,.236]].map(q=>new T.Vector2(...q)),40);cap.name='structure360-closed-bronze-giboshi';B.emit(cap,B.m.hardwareBronze131??B.m.bronze,x,y+.807,z);
    }
   }
  }
  const bx=bearingX,beamBottom=soffit(bx)-.145,shoeTop=1.50-G.position[1];
  member(B,{a:bx-.17,b:bx+.17,z:0,width:2.19,top:soffit,bottom:()=>beamBottom,material:'structure360LowerGirder',name:'transverse-bent-saddle-matching-three-arch-soffits'});
  for(const side of[-1,1]){
   const z=side*.55;
   // Buried rough footing, two offset bedding courses and a compact dressed
   // cap carry a short shaft. No freestanding 2.2m needle starts at water.
   pierStone(B,bx,z,-.22-G.position[1],.42-G.position[1],.46,.44,0);
   pierStone(B,bx,z,.42-G.position[1],.88-G.position[1],.40,.39,1);
   pierStone(B,bx,z,.88-G.position[1],1.39-G.position[1],.34,.33,2);
   cutBlock(B,bx,1.445-G.position[1],z,.69,.11,.67,'shore298Rock',side+2);
   if(side>0){
    const bottom=[[bx-.130,z-.145],[bx+.130,z-.145],[bx+.130,z+.145],[bx-.130,z+.145]],top=bottom.map(([x,v])=>[bx+(x-bx)*.94,z+(v-z)*.94]);
    B.emit(loft(bottom,top,shoeTop,beamBottom,'short-tapered-timber-bent-shaft'),'structure360Bent');
    B.box(bx,shoeTop+.035,z,.275,.070,.305,'bronze');
    B.between([bx,beamBottom-.38,z],[bx,beamBottom-.015,.98],.105,.125,'structure360Bent');
    for(const sign of[-1,1]){const target=bx+sign*.50,tx=binders.reduce((a,b)=>Math.abs(b-target)<Math.abs(a-target)?b:a,binders[0]);B.between([bx,beamBottom-.29,z],[tx,soffit(tx)-.085,z],.080,.110,'structure360Bent');}
   }else cutBlock(B,bx,(shoeTop+beamBottom)/2,z,.28,beamBottom-shoeTop,.30,'shore298Rock',3);
   const scan=B.scannedStones.variants[side>0?4:2];scan.geometry.computeBoundingBox();
   const sx=.65,sy=1.0,sz=.60,rockY=1.43-G.position[1]-scan.geometry.boundingBox.max.y*sy;
   B.emit(scan.geometry,scan.dry,bx-.30,rockY,z+side*.29,sx,sy,sz,[0,side*.43,0]);
   if(scan.mossGeometry)B.emit(scan.mossGeometry,'moss',bx-.30,rockY,z+side*.29,sx,sy,sz,[0,side*.43,0]);
  }
  for(const sign of[-1,1])for(const z of[-.96,0,.96]){
   const end=sign*H,seat=soffit(end);member(B,{a:end-.225,b:end+.225,z,width:.40,top:x=>soffit(T.MathUtils.clamp(x,-H,H)),bottom:()=>seat-.07,name:'end-sleeper-seated-in-masonry-pocket'});
  }
 },G.scale));
 B.layout124??={};B.layout124.bridge360={revision:'structure360-r08',reference:'HD01 bridge and bearing assembly',endpointsHeld:true,originalSoffitHeld:true,deckCrownIncreaseMetres:.23,handrailAboveDeck:.745,centralPierStoneCapTop:1.50,pairCentredEarthShoulderTop:1.28,shortTimberShaft:true,timberShaftWidthMetres:.26,closedMembers:true,throughMortisedRailPostJoints:54,lowerCrossBinders:7,upperFasciaProjectsBeyondLowerMetres:.0375,castMedallionsAndHeelHardwareSeatedOnActualFaces:true,taperConformingHeelStrapsAndPins:true,earthBackedAbutments:true,recessedPhysicalBeddingBetweenCourses:true,bankClearOfReceivingPockets:true,returnStonesCappedFromActualAuthoredBank:true,roleSpecificInferredAgedLacquer:true,cameraDollyAndLightHeld353:true,photographicAccepted:false};
}

export function buildBridgeEndLanding360(B,sign){
 const end=sign*H,outer=sign>0?H+1.06:-H-1.15,top=G.position[1]+oldDeck(end),seat=top-.53,inner=end-sign*.26;
 const poly=(a,b,z0,z1)=>[[a,z0],[b,z0],[b,z1],[a,z1]].map(([u,v])=>{const q=worldBridge(u,v);return[q.x,q.z];});
 const rows=Math.max(1,Math.ceil((seat-.14)/.42)),dy=(seat-.14)/rows;
 B.label('structure208-bearing-bridge-landings-and-turning-stair-route',()=>{
  for(let row=0;row<rows;row++){
   const lo=.05+row*dy,hi=.05+(row+1)*dy-.008,spread=.23*(1-row/rows),cuts=row%2?[-1.17,-.77,0,.77,1.17]:[-1.17,-.39,.39,1.17];
   for(let k=0;k<cuts.length-1;k++){
    const bottom=poly(inner-sign*spread,outer+sign*spread,cuts[k]-.12*spread,cuts[k+1]+.12*spread),upper=poly(inner-sign*spread*.7,outer+sign*spread*.7,cuts[k]+.004,cuts[k+1]-.004);
    B.emit(loft(bottom,upper,lo,hi,'battered-staggered-bridge-abutment-course'),'route219Masonry');
   }
  }
  // Recessed mineral bedding carries the separate dressed courses. The
  // visible8mm horizontal joints do not leave unsupported floating stones.
  const bedding=poly(inner+sign*.020,outer-sign*.020,-1.145,1.145);
  for(let row=1;row<=rows;row++){const level=.05+row*dy;B.emit(metricUV(prism124(bedding,level-.008,level,'structure360-closed-recessed-abutment-course-bedding')),'rock');}
  // Three genuine open receiving pockets, with a continuous cap bed behind
  // their ends. The six timber shoes retain the exact held end-plane seats.
  for(const [v0,v1]of[[-.75,-.21],[.21,.75]])B.emit(metricUV(prism124(poly(inner,end+sign*.235,v0,v1),seat-.09,seat+.012,'structure360-stone-cheek-between-open-bearing-pockets')),'route219Masonry');
  B.emit(metricUV(prism124(poly(end+sign*.235,outer,-1.17,1.17),seat-.09,top-.075,'structure360-abutment-back-bed')),'route219Masonry');
  B.emit(metricUV(prism124(poly(end,end+sign*.235,-1.17,1.17),seat+.012,top-.075,'structure360-landing-lintel-above-receiving-pockets')),'route219Masonry');
  for(let j=0;j<4;j++)B.emit(metricUV(prism124(poly(end,outer,-1.17+2.34*j/4+.002,-1.17+2.34*(j+1)/4-.002),top-.075,top,'structure360-closed-end-landing-flag')),'stoneLight');
  // Interlocked outer stones tie the dressed bearing to the earth bank.
  // Their feet are buried; the walking cap and all six pockets stay clear.
  for(const [j,u,v,sx,sy,sz]of[[0,end-sign*.22,1.37,.68,.45,.55],[1,end+sign*.42,1.57,.73,.42,.62],[2,end-sign*.59,1.03,.58,.43,.50],[3,end+sign*.57,-1.42,.71,.44,.56]]){
   const scan=B.scannedStones.variants[(j+(sign>0?1:3))%B.scannedStones.variants.length],q=worldBridge(u,v),rotation=new T.Quaternion().setFromEuler(new T.Euler(.025,sign*.18+j*.23,-.035)),matrix=new T.Matrix4().compose(new T.Vector3(),rotation,new T.Vector3(sx,sy,sz));
   const ground=bridgeBearingTerrain360(q.x,q.z,.13),cap=Math.min(top-.10,ground+.16);
   scan.geometry.computeBoundingBox();const bounds=scan.geometry.boundingBox.clone().applyMatrix4(matrix),base=cap-bounds.max.y;
   B.emit(scan.geometry,scan.dry,q.x,base,q.z,sx,sy,sz,[.025,sign*.18+j*.23,-.035]);
   if(scan.mossGeometry)B.emit(scan.mossGeometry,'moss',q.x,base,q.z,sx,sy,sz,[.025,sign*.18+j*.23,-.035]);
  }
 });
}

export function buildStair360(B){
 const P=stairLandingPlan124(),a=new T.Vector3(...S.bottom),b=new T.Vector3(...P.flightTop),axis=b.clone().sub(a).setY(0).normalize(),across=new T.Vector3(axis.z,0,-axis.x),run=P.run,yaw=Math.atan2(axis.x,axis.z),riser=(b.y-a.y)/S.steps,tread=run/S.steps;
 const at=(u,t)=>a.clone().addScaledVector(across,u).addScaledVector(axis,t),worldPoly=points=>points.map(([u,t])=>{const q=at(u,t);return[q.x,q.z];});
 B.label('layout124-connected-hall-flight-and-landing',()=>{
  B.emit(metricUV(prism124(P.supportWorld,P.supportBottomY,P.capBottomY,'structure360-buried-upper-platform-bearing-core')),'stone');
  // Separate flags on the held trapezoidal upper landing; the underlying
  // bed meets the hall floor and the head of the last riser continuously.
  const cap=P.capWorld;
  B.emit(metricUV(prism124(cap,P.capBottomY,P.capTopY-.035,'structure360-upper-platform-paving-bed')),'stone');
  const localCap=cap.map(q=>{const p=new T.Vector3(q[0]-a.x,0,q[1]-a.z);return[p.dot(across),p.dot(axis)];});
  const clip=(poly,k,value,sign)=>{const out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dp=sign*(p[k]-value),dq=sign*(q[k]-value);if(dp>=0)out.push(p);if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}}return out;};
  const minT=Math.min(...localCap.map(p=>p[1])),maxT=Math.max(...localCap.map(p=>p[1])),minU=Math.min(...localCap.map(p=>p[0])),maxU=Math.max(...localCap.map(p=>p[0]));
  for(let row=0;minT+row*.58<maxT;row++)for(let col=-1;minU+col*.72<maxU;col++){
   const u0=minU+col*.72+(row%2)*.36,u1=u0+.72,t0=minT+row*.58,t1=t0+.58;
   let cell=localCap;for(const [k,value,sign]of[[0,u0,1],[0,u1,-1],[1,t0,1],[1,t1,-1]])cell=clip(cell,k,value,sign);
   if(cell.length<3)continue;const area=cell.reduce((s,p,i)=>{const q=cell[(i+1)%cell.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2;if(Math.abs(area)<.0001)continue;
   const c=cell.reduce((s,p)=>[s[0]+p[0]/cell.length,s[1]+p[1]/cell.length],[0,0]),inset=cell.map(p=>{const d=Math.hypot(c[0]-p[0],c[1]-p[1]),f=Math.min(.15,.002/d);return[p[0]+(c[0]-p[0])*f,p[1]+(c[1]-p[1])*f];});
   B.emit(metricUV(prism124(worldPoly(inset),P.capTopY-.035,P.capTopY,'structure360-closed-staggered-upper-landing-flag')),'stoneLight');
  }
  B.emit(metricUV(prism124(P.flightFootingWorld,P.supportBottomY,S.bearingY,'structure360-buried-continuous-stair-footing')),'stone');
  for(let i=0;i<S.steps;i++){
   const centre=at(0,(i+.5)*tread),top=a.y+(i+1)*riser,bed=top-riser-.006,capThickness=.065;
   B.with(centre.x,0,centre.z,yaw,()=>{
    if(bed>S.bearingY)B.box(0,(S.bearingY+bed)/2,0,S.width,bed-S.bearingY,tread,'stone');
    const cuts=i%2?[ -S.width/2,-.44,.48,S.width/2 ]:[-S.width/2,-.52,.39,S.width/2];
    for(let k=0;k<cuts.length-1;k++){
     const w=cuts[k+1]-cuts[k]-.003,x=(cuts[k]+cuts[k+1])/2;
     // The lower riser is genuinely set back. Its upper bedding surface
     // receives a closed 65mm flag with a 30mm projecting stone nose.
     cutBlock(B,x,(bed+top-capThickness)/2,.009,w,top-capThickness-bed,tread-.018,'stone',i+k);
     cutBlock(B,x,top-capThickness/2,-.006,w,capThickness,tread+.012,'stoneLight',i+k);
    }
   });
  }
  // Continuous raking cheek walls replace nine projecting little cap steps.
  // Three thick coping stones share the exact rise/run of the flight.
  for(const side of[-1,1]){
   const inner=side*(S.width/2+.025),outer=side*(S.width/2+.245),topAt=t=>a.y+(b.y-a.y)*T.MathUtils.clamp(t/run,0,1)+.205;
   for(let part=0;part<3;part++){
    const t0=run*part/3+.003,t1=run*(part+1)/3-.003,poly=worldPoly([[inner,t0],[outer,t0],[outer,t1],[inner,t1]]);
    const along=q=>new T.Vector3(q[0]-a.x,0,q[1]-a.z).dot(axis);
    B.emit(loft(poly,poly,S.bearingY,q=>topAt(along(q))-.075,'raking-stone-stair-cheek-wall'),'stone');
    B.emit(loft(poly,poly,q=>topAt(along(q))-.075,q=>topAt(along(q)),'continuous-raking-stair-coping'),'stoneLight');
   }
   const foot=at(side*(S.width/2+.135),-.025);cutBlock(B,foot.x,a.y+.135,foot.z,.29,.31,.34,'stone',side+2,yaw);
  }
 });
 B.layout124??={};B.layout124.stair={hallPavingReference:S.top,flightTop:P.flightTop,bottom:S.bottom,width:S.width,steps:S.steps,run,riser,tread,connectedHallFloorY:P.capTopY,landingY:S.landingY,bearingY:S.bearingY,continuousFootingBottomY:P.supportBottomY,revision:'structure360-closed-cut-stone-flight-and-raking-cheeks',individuallyClosedTreadStones:27,rakingCopingCourses:3,topAndBottomAnchorsHeld:true,photographicAccepted:false};
}
