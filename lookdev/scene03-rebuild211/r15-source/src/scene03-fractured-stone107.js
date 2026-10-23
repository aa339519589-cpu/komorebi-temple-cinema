import * as T from 'three';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';

const fract=x=>x-Math.floor(x),hash=(x,y,z)=>fract(Math.sin(x*127.13+y*311.77+z*73.19)*43758.5453);
function noise(x,y,z){
 const i=Math.floor(x),j=Math.floor(y),k=Math.floor(z),u=x-i,v=y-j,w=z-k,s=a=>a*a*(3-2*a),mix=T.MathUtils.lerp;
 return mix(mix(mix(hash(i,j,k),hash(i+1,j,k),s(u)),mix(hash(i,j+1,k),hash(i+1,j+1,k),s(u)),s(v)),mix(mix(hash(i,j,k+1),hash(i+1,j,k+1),s(u)),mix(hash(i,j+1,k+1),hash(i+1,j+1,k+1),s(u)),s(v)),s(w));
}

// Intersect real joint planes, then subdivide their actual faces. This is
// deliberately not a rounded sphere with a rock texture. Shared face edges
// retain identical positions; only the interiors have shallow mineral loss.
export function createFracturedStone107(seed=1,{bearing=false}={}){
 const planes=[...[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map((n,i)=>({n:new T.Vector3(...n),d:i===2?.71:i===3?.66:.95}))];
 for(let j=0;j<18;j++){
  const a=j*2.399963+seed*.67,y=-.82+1.64*(j+.5)/18,r=Math.sqrt(1-y*y),n=new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);
  planes.push({n,d:(bearing?1.02:.88)+.15*hash(seed,j,3)});
 }
 const vertices=[];
 for(let a=0;a<planes.length;a++)for(let b=a+1;b<planes.length;b++)for(let c=b+1;c<planes.length;c++){
  const A=planes[a],B=planes[b],C=planes[c],bc=B.n.clone().cross(C.n),den=A.n.dot(bc);if(Math.abs(den)<1e-7)continue;
  const q=bc.multiplyScalar(A.d).add(C.n.clone().cross(A.n).multiplyScalar(B.d)).add(A.n.clone().cross(B.n).multiplyScalar(C.d)).divideScalar(den);
  if(planes.some(P=>P.n.dot(q)>P.d+1e-7)||vertices.some(v=>v.distanceToSquared(q)<1e-12))continue;vertices.push(q);
 }
 const p=[],uv=[],colors=[],normalFor=(q,n)=>{
  const damp=.63+.23*noise(q.x*3+seed,q.y*3,q.z*3),lichen=noise(q.x*13+seed*4,q.y*13,q.z*13),moss=noise(q.x*5+seed,q.y*5,q.z*5);
  let c=new T.Color().setRGB(damp*.88,damp*.95,damp*.94);
  if(lichen>.68)c.lerp(new T.Color().setRGB(.55,.58,.44),T.MathUtils.smoothstep(lichen,.68,.82)*.58);
  if(n.y>.10&&moss>.62)c.lerp(new T.Color().setRGB(.20,.28,.105),T.MathUtils.smoothstep(moss,.62,.84)*T.MathUtils.smoothstep(n.y,.10,.65)*.82);
  return c;
 };
 const segments=bearing?7:8;
 for(const P of planes){
  const polygon=vertices.filter(v=>Math.abs(P.n.dot(v)-P.d)<1e-6);if(polygon.length<3)continue;
  const centre=polygon.reduce((s,v)=>s.add(v),new T.Vector3()).divideScalar(polygon.length),u=new T.Vector3(0,1,0).cross(P.n);if(u.lengthSq()<.01)u.set(1,0,0);u.normalize();const v=P.n.clone().cross(u).normalize();
  polygon.sort((a,b)=>Math.atan2(a.clone().sub(centre).dot(v),a.clone().sub(centre).dot(u))-Math.atan2(b.clone().sub(centre).dot(v),b.clone().sub(centre).dot(u)));
  const point=(A,B,C,i,j)=>{
   const a=1-(i+j)/segments,b=i/segments,c=j/segments,q=A.clone().multiplyScalar(a).addScaledVector(B,b).addScaledVector(C,c),edge=Math.min(a,b,c),loss=(noise(q.x*22+seed,q.y*22,q.z*22)-.5)*.011*Math.min(1,edge*18);
   return q.addScaledVector(P.n,loss);
  };
  const push=q=>{p.push(q.x,q.y,q.z);uv.push(q.dot(u)/.63+seed*.713,q.dot(v)/.63+seed*.417);colors.push(...normalFor(q,P.n).toArray());};
  for(let f=0;f<polygon.length;f++){
   const A=centre,B=polygon[f],C=polygon[(f+1)%polygon.length];
   for(let i=0;i<segments;i++)for(let j=0;j<segments-i;j++){
    push(point(A,B,C,i,j));push(point(A,B,C,i+1,j));push(point(A,B,C,i,j+1));
    if(i+j<segments-1){push(point(A,B,C,i+1,j));push(point(A,B,C,i+1,j+1));push(point(A,B,C,i,j+1));}
   }
  }
 }
 let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g=toCreasedNormals(g,.38);
 g.name=`scene03-closed-fractured-${bearing?'bearing':'garden'}-stone107-${seed}`;g.computeBoundingBox();
 g.userData.fracturedStone107={closedJointPlaneIntersection:true,planeCount:planes.length,lossDepthMetres:.0055,referencePhotoUsed:false,lichen:'authored mineral/moss vertex pigment, independently lit'};return g;
}

export async function createBankStoneMaterial107({mats,textures}){
 const loader=new T.TextureLoader(),maps=await Promise.all(['diff','nor_gl','rough'].map(k=>loader.loadAsync(new URL(`../assets/granite-tile-04/granite-face-${k}.png`,import.meta.url).href)));
 for(let i=0;i<maps.length;i++){const t=maps[i];t.name='scene03-independent-CC0-fractured-granite107-'+i;t.wrapS=t.wrapT=T.MirroredRepeatWrapping;t.anisotropy=8;if(i===0)t.colorSpace=T.SRGBColorSpace;textures.add(t);}
 const material=new T.MeshPhysicalMaterial({name:'scene03-damp-fractured-mineral-lichen107',color:'#5c6965',map:maps[0],normalMap:maps[1],normalScale:new T.Vector2(.58,.58),roughness:.94,roughnessMap:maps[2],metalness:0,clearcoat:.12,clearcoatRoughness:.53,vertexColors:true});mats[material.name]=material;
 material.userData.independentSurface={source:'Poly Haven granite_tile_04 / Amal Kumar / CC0-1.0',role:'mineral surface only, on authored closed fractured garden stones',wetting:'standard PBR pigment and roughness, no image projection'};
 return material;
}

export function createKeyedScanBearing107(original,index,{level=true}={}){
 const g=original.clone();g.computeBoundingBox();const b=g.boundingBox,s=b.getSize(new T.Vector3()),p=g.attributes.position;
 for(let k=0;k<p.count;k++){const t=(p.getY(k)-b.min.y)/s.y;p.setXYZ(k,(p.getX(k)-b.min.x)/s.x-.5,level?T.MathUtils.clamp((t-.07)/.86,0,1):t,(p.getZ(k)-b.min.z)/s.z-.5);}
 g.computeVertexNormals();g.computeBoundingBox();g.name=`scene03-${level?'level-keyed-bearing':'normalized-scan-solid'}107-${index}`;g.userData.keyedBearing107={originalUV:true,fullOriginalTopology:true,flatFootAndHead:level,excludedOpenProviderVariant:'rock04',referenceRGB:false};return g;
}

export function buildBridgeBearings107({at,emit,box,bridgeModel,material,capMaterial,gardenAssets}){
 const bearing=createFracturedStone107(10771,{bearing:true}),records=[];
 at(bridgeModel.position,bridgeModel.yaw,()=>{
  for(const sign of[-1,1]){
   const x=sign*(bridgeModel.span/2-.02),ratio=bridgeModel.deckDepth/1.94;
   // Four narrow closed keys carry the cap, while actual full scan solids
   // make three interlocking courses. No tall broad polygon face remains.
   const bottom=-.72,top=.989,h=top-bottom;
   for(let k=0;k<4;k++){
    const z=(-.69+k*.46)*ratio;
    emit(bearing,material,[x,(top+bottom)/2-.0312,z],[.16,h/1.37,.12*ratio],[0,0,0],.85);
   }
   const levels=[[-.72,-.12],[-.14,.45],[.43,.989]];
   for(let row=0;row<3;row++)for(let k=0;k<4;k++){
    const [lo,hi]=levels[row],half=[.88,.76,.69][row],depth=[.76,.63,.62][row],z=(-half+k*half*2/3)*ratio,xx=x+.035*Math.sin(k*2.8+row);
    gardenAssets.plant('bearingRock',k+row*3,[xx,lo,z],[.94+(row===0?.14:0),hi-lo,depth*ratio],[0,(k-1.5)*.028+sign*.012,0],.84+.045*((row+k)%3));
   }
   const capX=sign*(bridgeModel.span/2-.22);
   box([capX,1.055,0],[.64,.15,2.15*ratio],capMaterial);
   for(let j=0;j<7;j++){
    const z=(-1.35+j*.44)*ratio,dx=sign*(.45+.16*Math.sin(j*1.9)),s=.46+.065*(j%3);
    gardenAssets.plant('rock',j,[x+dx,-.47,z],[s*1.55,s*1.26,s*1.22],[0,j*.91,0],.86+.04*(j%3));
    if(j%2===0)gardenAssets.plant('groundcover',j,[x+dx,-.13,z],[.65,.60,.70],[0,j*.8,0],.84);
   }
   records.push({side:sign,capCentre:[capX,1.055,0],capTop:1.13,coreBottom:bottom,coreNominalTop:top,courseHalfDepths:[1.26,1.075,1.0].map(v=>v*ratio),capHalfDepth:1.075*ratio,core:'closed angular keys; lower spread footing and tapered overlapping scan-stone courses contained by the cap at the top'});
  }
 });return{revision:108,bearings:records,bridgePoseChanged:false,photographicAccepted:false};
}
