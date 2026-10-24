import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const FOREGROUND_ROOF_REVISION='scene07-reframed-closed-ceramic-eave214-r01';
// Fixed-camera fit of the whole foreground slope and its two edge families.
// World dimensions/depth are a metric hypothesis, not recovered photo depth.
// The photograph's near veranda roof is a large framing plane, not a small
// corner tile. Extend its distant ridge back while holding the near eave datum
// in the same projected place; slightly wider shoulders carry the roof into
// the lower-left foreground without covering the hall silhouette.
export const FOREGROUND_ROOF_LAYOUT=Object.freeze({position:Object.freeze([-0.64,8.938616,29.73]),yaw:1.078179,ridgeHalf:4.4,eaveHalf:5.4,run:5.60,rise:1.114107,curl:.388020,tilePitch:.48,courses:8});
const TAU=Math.PI*2;
// Independent Rob Tuytel / Poly Haven CC0 ceramic microstructure. The derived
// maps contain joint-free surface samples, never the target scene photograph.
// Module-level await keeps buildForegroundGalleryRoof's existing sync API and
// ensures all local maps are decoded before the scene declares itself ready.
const surfaceDirectory=new URL('../assets/near-gallery149/',import.meta.url).href;
const surfaceNames=['ceramic-neutral-diff.png','ceramic-micro-normal-gl.png','ceramic-glaze-rough.png','ceramic-glaze-weight.png','cast-metal-rough.png','cast-metal-height.png'];
const surfaceTextures=await Promise.all(surfaceNames.map(name=>new T.TextureLoader().loadAsync(surfaceDirectory+name)));
for(const texture of surfaceTextures){texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.anisotropy=8;}
surfaceTextures[0].colorSpace=T.SRGBColorSpace;
const hash=(x,y=0)=>{const q=Math.sin(x*127.1+y*311.7+83.7)*43758.5453;return q-Math.floor(q);};
const lin=(a,b,n)=>Array.from({length:n+1},(_,i)=>a+(b-a)*i/n);
const smooth=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const V=p=>new T.Vector3(...p);

export const foregroundSpan=t=>FOREGROUND_ROOF_LAYOUT.ridgeHalf+(FOREGROUND_ROOF_LAYOUT.eaveHalf-FOREGROUND_ROOF_LAYOUT.ridgeHalf)*t;
// Broad shallow face with a short hip shoulder, rather than the former steep
// wedge which doubled its width over a long near-camera run.
export function foregroundPoint(t,u){const {rise,curl,run}=FOREGROUND_ROOF_LAYOUT;return[u*foregroundSpan(t),rise*Math.pow(Math.max(0,1-t),1.65)+curl*Math.pow(t,7)*(.2+.8*Math.pow(Math.abs(u),5)),run*t];}
function frameAt(t,u,parallel=false){
 const p=V(foregroundPoint(t,u)),e=.0001,ta=Math.max(0,t-e),tb=Math.min(1,t+e),x=p.x,a=V(foregroundPoint(ta,parallel?x/foregroundSpan(ta):u)),b=V(foregroundPoint(tb,parallel?x/foregroundSpan(tb):u)),forward=b.sub(a).normalize(),across=new T.Vector3(0,1,0).cross(forward).normalize(),up=forward.clone().cross(across).normalize();return{p,forward,across,up};
}

// Closed clay shells, with a shallow bevel, millimetre pitting and a real
// lifted lap at the lower edge. All units are local building metres.
export function createGalleryTile(points,width=.32,{cover=true,variant=0,crown=.17,thickness=.025,bed=.24,lap=.028}={}){
 const curve=new T.CatmullRomCurve3(points.map(V)),rows=10,cols=cover?28:16,p=[],uv=[],colors=[],clayState=[],ids=[],stride=(rows+1)*(cols+1),length=curve.getLength(),seed=hash(variant,7);
 for(let layer=0;layer<2;layer++)for(let j=0;j<=rows;j++){
  const t=j/rows,c=curve.getPoint(t),tangent=curve.getTangent(t).normalize(),across=new T.Vector3(0,1,0).cross(tangent).normalize(),up=tangent.clone().cross(across).normalize(),arr=smooth(0,.10,Math.min(t,1-t)),lip=lap*smooth(.0,1,t);
  for(let k=0;k<=cols;k++){
   const q=k/cols*2-1,inset=.004*(1-arr),x=q*(width/2-inset),height=cover?crown*Math.sqrt(Math.max(0,1-q*q)):crown*q*q,wear=.0016*Math.sin(q*7.3+variant*2.1+t*5.7)+.0008*Math.sin(q*17.1-t*9.3+variant),round=.004*(1-arr),v=c.clone().addScaledVector(across,x).addScaledVector(up,bed+height+lip+wear-round-layer*thickness);
   p.push(...v.toArray());
   // Metric UV follows the actual cylinder's cross-arc and the tile run.
   const arc=cover?Math.asin(q)*width/2:x;
   uv.push(arc/.25+hash(variant)*7,t*length/.25+hash(variant,2)*11);
   const f=.86+.22*hash(variant,1)+.016*Math.sin(q*9+t*7+variant),firing=hash(variant,4)-.5;
   colors.push(f*(1+.035*firing),f,f*(1-.035*firing));clayState.push(k/cols,t,seed);
  }
 }
 const tri=(a,b,c)=>ids.push(a,b,c,c+stride,b+stride,a+stride);
 for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j*(cols+1)+k,b=a+1,c=a+cols+1,d=c+1;tri(a,c,b);tri(b,c,d);}
 const edge=[...Array.from({length:cols},(_,k)=>k),...Array.from({length:rows},(_,j)=>j*(cols+1)+cols),...Array.from({length:cols},(_,k)=>rows*(cols+1)+cols-k),...Array.from({length:rows},(_,j)=>(rows-j)*(cols+1))];
 for(let k=0;k<edge.length;k++){const a=edge[k],b=edge[(k+1)%edge.length];ids.push(a,b,a+stride,b,b+stride,a+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('clayState',new T.Float32BufferAttribute(clayState,3));g.setIndex(ids);g.computeVertexNormals();g.name=cover?'gallery-short-closed-cover':'gallery-short-closed-pan';g.userData={closedClay:true,thicknessMetres:thickness,arrisBevelMetres:.004,lapLiftMetres:lap,photoTexture:false};return g;
}
function closedDeck(){
 const nx=64,nz=32,p=[],uv=[],ids=[],stride=(nx+1)*(nz+1);
 for(let side=0;side<2;side++)for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const q=foregroundPoint(j/nz,-1+2*i/nx);p.push(q[0],q[1]+(side?-.04:.20),q[2]);uv.push(q[0],q[2]);}
 const tri=(a,b,c)=>ids.push(a,b,c,c+stride,b+stride,a+stride);
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;tri(a,c,b);tri(b,c,d);}
 const edge=[...Array.from({length:nx},(_,i)=>i),...Array.from({length:nz},(_,j)=>j*(nx+1)+nx),...Array.from({length:nx},(_,i)=>nz*(nx+1)+nx-i),...Array.from({length:nz},(_,j)=>(nz-j)*(nx+1))];
 for(let k=0;k<edge.length;k++){const a=edge[k],b=edge[(k+1)%edge.length];ids.push(a,b,a+stride,b,b+stride,a+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.name='gallery-closed-curved-bedding';return g;
}
function revolvedZ(profile,name){
 const n=64,p=[],uv=[],ids=[],rings=[];
 for(let j=0;j<profile.length;j++){const [r,z]=profile[j],ring=[];if(r===0){ring.push(p.length/3);p.push(0,0,z);uv.push(.5,.5);}else for(let i=0;i<n;i++){const a=i/n*TAU;ring.push(p.length/3);p.push(Math.cos(a)*r,Math.sin(a)*r,z);uv.push(.5+Math.cos(a)*.5,.5+Math.sin(a)*.5);}rings.push(ring);}
 for(let j=0;j<rings.length;j++){const a=rings[j],b=rings[(j+1)%rings.length];if(a.length===1&&b.length===1)continue;for(let i=0;i<n;i++){const k=(i+1)%n;if(a.length===1)ids.push(a[0],b[i],b[k]);else if(b.length===1)ids.push(a[i],b[0],a[k]);else ids.push(a[i],b[i],a[k],a[k],b[i],b[k]);}}
 let volume=0;for(let i=0;i<ids.length;i+=3){const a=V(p.slice(ids[i]*3,ids[i]*3+3)),b=V(p.slice(ids[i+1]*3,ids[i+1]*3+3)),c=V(p.slice(ids[i+2]*3,ids[i+2]*3+3));volume+=a.dot(b.cross(c))/6;}if(volume<0)for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.name=name;g.userData={closedCastMetal:true,photoTexture:false};return g;
}
// The source shows dense shallow scroll/rosette casting over a dark recessed
// bronze field. Build the relief as the front of a closed solid, not a flat
// five-petal cutout. All ribs merge into the cast ground and central boss.
function createCastRelief(variant=0){
 const segments=[],lobes=6,rotation=variant*.019;
 const paths=[
  [[.019,-.004],[.052,-.018],[.088,-.014],[.106,.026]],
  [[.106,.026],[.125,.056],[.068,.077],[.064,.044]],
  [[.064,.044],[.057,.017],[.104,.022],[.084,.047]],
  [[.028,-.010],[.045,-.045],[.088,-.054],[.100,-.023]],
  [[.100,-.023],[.104,-.006],[.075,-.004],[.075,-.025]]
 ];
 for(let l=0;l<lobes;l++){
  const angle=l*TAU/lobes+rotation,c=Math.cos(angle),sn=Math.sin(angle);
  for(let j=0;j<paths.length;j++){
   const path=new T.CubicBezierCurve3(...paths[j].map(([x,y])=>new T.Vector3(c*x-sn*y,sn*x+c*y,0))),points=path.getPoints(18);
   for(let k=0;k<points.length-1;k++){const a=points[k],b=points[k+1],dx=b.x-a.x,dy=b.y-a.y;segments.push([a.x,a.y,dx,dy,1/(dx*dx+dy*dy),j<3?.0050:.0041]);}
  }
 }
 const radius=.134,nr=72,na=192,p=[],uv=[],colors=[],ix=[],dark=new T.Color('#675233'),gold=new T.Color('#c79b49'),worn=new T.Color('#a27a39');
 function height(x,y){
  let rib=0;
  for(const [ax,ay,dx,dy,inverse,width]of segments){const t=T.MathUtils.clamp(((x-ax)*dx+(y-ay)*dy)*inverse,0,1),d=Math.hypot(x-ax-dx*t,y-ay-dy*t)/width;rib=Math.max(rib,Math.exp(-d*d*1.7));}
  const r=Math.hypot(x,y),angle=Math.atan2(y,x),annulus=Math.exp(-(((r-.124)/.0026)**2)),centre=Math.max(0,1-(r/.024)**2)**.65;
  let petal=0,bead=0;
  for(let l=0;l<lobes;l++){const a=l*TAU/lobes+rotation,c=Math.cos(a),sn=Math.sin(a),xx=x*c+y*sn,yy=-x*sn+y*c;petal=Math.max(petal,Math.max(0,1-((xx-.065)/.036)**2-((yy-.012)/.021)**2)**2);}
  for(let k=0;k<24;k++){const a=k*TAU/24,dx=x-Math.cos(a)*.128,dy=y-Math.sin(a)*.128;bead=Math.max(bead,Math.exp(-(dx*dx+dy*dy)/.000006));}
  const relief=Math.max(rib*.018,annulus*.007,centre*.023,petal*.006,bead*.009),pit=.00025*Math.sin(x*731+variant)*Math.cos(y*603-variant);
  return{z:.039+relief+pit,relief,r,angle};
 }
 function vertex(x,y,z,relief=0,front=false){
  p.push(x,y,z);uv.push(.5+x/(2*radius),.5+y/(2*radius));
  const age=.5+.21*Math.sin(x*147+y*89+variant*1.7)+.15*Math.cos(x*293-y*177),crest=smooth(.001,.014,relief),colour=dark.clone().lerp(worn,crest*.32).lerp(gold,crest*(.58+.36*age));
  // Convex cast crests keep a broken thin gilt layer; recesses remain bronze.
  if(!front)colour.copy(dark);colors.push(colour.r,colour.g,colour.b);return p.length/3-1;
 }
 let h=height(0,0);vertex(0,0,h.z,h.relief,true);
 for(let j=1;j<=nr;j++)for(let i=0;i<na;i++){const a=i*TAU/na,r=radius*j/nr,x=Math.cos(a)*r,y=Math.sin(a)*r;h=height(x,y);vertex(x,y,h.z,h.relief,true);}
 for(let i=0;i<na;i++)ix.push(0,1+i,1+(i+1)%na);
 for(let j=1;j<nr;j++)for(let i=0;i<na;i++){const k=(i+1)%na,a=1+(j-1)*na+i,b=1+(j-1)*na+k,c=1+j*na+i,d=1+j*na+k;ix.push(a,c,b,b,c,d);}
 const back=vertex(0,0,.026),backRing=p.length/3;
 for(let i=0;i<na;i++){const a=i*TAU/na;vertex(Math.cos(a)*radius,Math.sin(a)*radius,.026);}
 const outer=1+(nr-1)*na;
 for(let i=0;i<na;i++){const k=(i+1)%na;ix.push(back,backRing+k,backRing+i,outer+i,backRing+i,outer+k,outer+k,backRing+i,backRing+k);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();g.name='gallery-closed-rounded-six-scroll-cast-relief';g.userData={closedCastMetal:true,reliefDepthMetres:.023,connectedCastGround:true,scrollLobes:lobes,castBeads:24,variant,photoTexture:false};return g;
}
function createEndParts(variant=0){
 return[
  {g:revolvedZ([[0,-.035],[.17,-.035],[.187,-.030],[.197,-.018],[.20,-.006],[.198,.007],[.190,.019],[.171,.023],[.166,.018],[0,.018]],'gallery-rounded-solid-ceramic-end-seal'),m:'ceramic'},
  {g:revolvedZ([[0,.018],[.132,.018],[.149,.024],[.153,.034],[.149,.041],[.133,.045],[0,.038]],'gallery-recessed-cast-bronze-medallion-seat'),m:'bronze'},
  {g:revolvedZ([[.142,.037],[.154,.038],[.163,.047],[.164,.055],[.157,.063],[.150,.064],[.147,.057],[.147,.049]],'gallery-aged-bronze-retaining-roll'),m:'bronze'},
  {g:revolvedZ([[.137,.047],[.141,.045],[.146,.050],[.147,.056],[.143,.060],[.138,.058]],'gallery-narrow-rounded-worn-gilt-bead'),m:'gilt'},
  {g:createCastRelief(variant),m:'castRelief'}
 ];
}
function makeMaterials(){
 const[albedo,normal,rough,glaze,metalRough,metalHeight]=surfaceTextures;
 const ceramic=new T.MeshPhysicalMaterial({name:'foreground-neutral-charcoal-partly-glazed-ceramic149',color:'#5b5752',map:albedo,normalMap:normal,normalScale:new T.Vector2(.14,.14),roughness:.49,roughnessMap:rough,metalness:0,ior:1.52,specularIntensity:1,clearcoat:.72,clearcoatMap:glaze,clearcoatRoughness:.34,clearcoatRoughnessMap:rough,clearcoatNormalMap:normal,clearcoatNormalScale:new T.Vector2(.08,.08),vertexColors:true});
 ceramic.onBeforeCompile=shader=>{
  shader.vertexShader='attribute vec3 clayState; varying vec3 vGalleryClayState;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGalleryClayState=clayState;');
  shader.fragmentShader='varying vec3 vGalleryClayState;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   float lapWear=1.-smoothstep(.025,.16,min(vGalleryClayState.y,1.-vGalleryClayState.y));
   float crownWear=pow(abs(vGalleryClayState.x*2.-1.),8.);
   roughnessFactor=clamp(roughnessFactor+.075*lapWear+.035*crownWear+.025*(vGalleryClayState.z-.5),.23,.67);`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
   material.clearcoat*=1.-.38*lapWear-.18*crownWear;`);
 };
 ceramic.customProgramCacheKey=()=> 'scene07-gallery149-metric-sealed-clay-lap-wear-v1';
 const ceramicEnd=new T.MeshPhysicalMaterial({name:'foreground-rounded-charcoal-ceramic-end149',color:'#504b45',map:albedo,normalMap:normal,normalScale:new T.Vector2(.12,.12),roughness:.47,roughnessMap:rough,metalness:0,ior:1.52,specularIntensity:1,clearcoat:.48,clearcoatMap:glaze,clearcoatRoughness:.34,clearcoatRoughnessMap:rough});
 const bronze=new T.MeshPhysicalMaterial({name:'foreground-oxidised-cast-bronze-seat149',color:'#77613d',metalness:.88,roughness:.62,roughnessMap:metalRough,bumpMap:metalHeight,bumpScale:.00024});
 const gilt=new T.MeshPhysicalMaterial({name:'foreground-thin-worn-gilt-bead149',color:'#c49b50',metalness:.94,roughness:.43,roughnessMap:metalRough,bumpMap:metalHeight,bumpScale:.00014});
 const castRelief=new T.MeshPhysicalMaterial({name:'foreground-cast-scroll-relief-with-worn-gilt149',color:'#ffffff',metalness:.91,roughness:.49,roughnessMap:metalRough,bumpMap:metalHeight,bumpScale:.00015,vertexColors:true});
 const deck=new T.MeshStandardMaterial({name:'foreground-dark-fired-clay-bedding149',color:'#25231f',roughness:.95});
 return{ceramic,ceramicEnd,bronze,gilt,castRelief,deck,dispose(){for(const m of[ceramic,ceramicEnd,bronze,gilt,castRelief,deck])m.dispose();for(const t of surfaceTextures)t.dispose();}};
}
// A shell can be watertight yet still sit clear of its neighbour. These seats
// are built from the same actual tile curves/profiles, so the load path and
// end closure meet the retained shells instead of relying on a flat back bed.
function tileSpec(points,width,options={},begin=0,end=1){
 return{points,width,cover:true,variant:0,crown:.17,thickness:.025,bed:.24,lap:.028,...options,begin,end,curve:new T.CatmullRomCurve3(points.map(V))};
}
function tileSample(spec,t,q,inside=false){
 const{curve,width,cover,crown,bed,lap,thickness,variant}=spec,c=curve.getPoint(t),forward=curve.getTangent(t).normalize(),across=new T.Vector3(0,1,0).cross(forward).normalize(),up=forward.clone().cross(across).normalize(),arr=smooth(0,.10,Math.min(t,1-t)),x=q*(width/2-.004*(1-arr)),height=cover?crown*Math.sqrt(Math.max(0,1-q*q)):crown*q*q,wear=.0016*Math.sin(q*7.3+variant*2.1+t*5.7)+.0008*Math.sin(q*17.1-t*9.3+variant),offset=bed+height+lap*smooth(0,1,t)+wear-.004*(1-arr)-(inside?thickness:0),p=c.clone().addScaledVector(across,x).addScaledVector(up,offset);
 return{p,c,forward,across,up,x,axis:c.clone().addScaledVector(up,offset-height)};
}
function closedSurfaceGrid(rows,cols,point,name,userData={}){
 const p=[],uv=[],color=[],clayState=[],ix=[],stride=(rows+1)*(cols+1);
 for(let layer=0;layer<2;layer++)for(let j=0;j<=rows;j++)for(let k=0;k<=cols;k++){const v=point(j/rows,k/cols,layer);p.push(...v.toArray());uv.push(k/cols,j/rows);color.push(.96,.96,.96);clayState.push(k/cols,j/rows,.5);}
 for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j*(cols+1)+k,b=a+1,c=a+cols+1,d=c+1;ix.push(a,c,b,b,c,d,a+stride,b+stride,c+stride,b+stride,d+stride,c+stride);}
 const edge=[...Array.from({length:cols},(_,k)=>k),...Array.from({length:rows},(_,j)=>j*(cols+1)+cols),...Array.from({length:cols},(_,k)=>rows*(cols+1)+cols-k),...Array.from({length:rows},(_,j)=>(rows-j)*(cols+1))];
 for(let i=0;i<edge.length;i++){const a=edge[i],b=edge[(i+1)%edge.length];ix.push(a,b,a+stride,b,b+stride,a+stride);}
 return finishJoinedGeometry(p,uv,color,clayState,ix,name,userData);
}
function finishJoinedGeometry(p,uv,color,clayState,ix,name,userData){
 let volume=0;for(let i=0;i<ix.length;i+=3){const a=V(p.slice(ix[i]*3,ix[i]*3+3)),b=V(p.slice(ix[i+1]*3,ix[i+1]*3+3)),c=V(p.slice(ix[i+2]*3,ix[i+2]*3+3));volume+=a.dot(b.cross(c))/6;}
 if(volume<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.setAttribute('clayState',new T.Float32BufferAttribute(clayState,3));g.setIndex(ix);g.computeVertexNormals();g.name=name;g.userData={closedClay:true,photoTexture:false,...userData};return g;
}
function createTerminalSocket(spec,capCentre,capForward){
 // The front annular wall enters the existing ceramic seal at z=-.019, inside
 // its r=.197 shoulder. Its back follows the real cover/lip and enters that
 // shell by1–24mm; the lower cheeks enter the continuous earthen bedding.
 const rows=12,na=64,p=[],uv=[],color=[],clayState=[],ix=[],length=spec.curve.getLength(),backT=Math.max(0,1-.28/length),end=tileSample(spec,1,0),front=capCentre.clone().addScaledVector(capForward,-.019),delta=front.clone().sub(end.axis),stride=(rows+1)*na;
 for(let layer=0;layer<2;layer++)for(let j=0;j<=rows;j++){
  const f=j/rows,t=1-(1-backT)*f,sample=tileSample(spec,t,0),centre=sample.axis.clone().addScaledVector(delta,(1-f)**2),forward=capForward.clone().lerp(sample.forward,f).normalize(),across=new T.Vector3(0,1,0).cross(forward).normalize(),up=forward.clone().cross(across).normalize(),wall=layer*.025,rx=T.MathUtils.lerp(.194,spec.width/2-.001,f)-wall,upper=T.MathUtils.lerp(.194,spec.crown-.001,f)-wall,lower=T.MathUtils.lerp(.194,Math.min(.11,spec.crown*.65),f)-wall;
  for(let i=0;i<na;i++){const a=i*TAU/na,sy=Math.sin(a),v=centre.clone().addScaledVector(across,Math.cos(a)*rx).addScaledVector(up,sy*(sy>=0?upper:lower));p.push(...v.toArray());uv.push(a*rx/.25,f*.28/.25);color.push(.96,.96,.96);clayState.push((Math.cos(a)+1)/2,.65+.35*(1-f),hash(spec.variant,7));}
 }
 for(let j=0;j<rows;j++)for(let i=0;i<na;i++){const k=(i+1)%na,a=j*na+i,b=j*na+k,c=a+na,d=b+na;ix.push(a,c,b,b,c,d,a+stride,b+stride,c+stride,b+stride,d+stride,c+stride);}
 for(let i=0;i<na;i++){const k=(i+1)%na,a=i,b=k,c=rows*na+i,d=rows*na+k;ix.push(a,b,a+stride,b,b+stride,a+stride,c,c+stride,d,d,c+stride,d+stride);}
 return finishJoinedGeometry(p,uv,color,clayState,ix,'gallery-joined-hollow-ceramic-terminal-socket',{wallMetres:.025,actualCoverCurve:true,backInsetMetres:.28,frontInterlockLocalZ:-.019,capAnchorPreserved:true});
}
function createTerminalBedding(spec){
 const length=spec.curve.getLength(),from=Math.max(0,1-.20/length),to=1-.004/length;
 return closedSurfaceGrid(5,28,(t,v,layer)=>{const q=(v*2-1)*.996,sample=tileSample(spec,from+(to-from)*t,q,true);return layer?sample.c.clone().addScaledVector(sample.across,sample.x).addScaledVector(sample.up,spec.bed-.075):sample.p.addScaledVector(sample.up,.003);},'gallery-closed-conformed-terminal-clay-bedding',{endInsetMetres:.004,bedLengthMetres:.20,coverInnerContactOverlapMetres:.003,seatBaseBelowOwnAxisMetres:.075,underlyingDeckOrCoverContact:true});
}
function createHeadlapSeat(upper,lower){
 const from=lower.begin+.00015,to=Math.min(upper.end,lower.end)-.00015;if(to<=from)return null;
 return closedSurfaceGrid(3,upper.cover?28:16,(t,v,layer)=>{const global=from+(to-from)*t,q=(v*2-1)*.996,a=tileSample(upper,(global-upper.begin)/(upper.end-upper.begin),q,true),b=tileSample(lower,(global-lower.begin)/(lower.end-lower.begin),q),up=a.up.clone().add(b.up).normalize(),centre=a.p.clone().add(b.p).multiplyScalar(.5),half=Math.abs(a.p.clone().sub(b.p).dot(up))*.5+.003;return centre.addScaledVector(up,layer?-half:half);},'gallery-closed-nested-headlap-clay-seat',{actualUpperInnerAndLowerOuter:true,shellContactOverlapMetres:.003,overlapParameter:[from,to],cover:upper.cover});
}
export function buildForegroundGalleryRoof(api){
 const {emit,rod,box}=api,materials=makeMaterials(),covers=[],pans=[],special=[],sockets=[],bedding=[],endVariants=Array.from({length:3},(_,i)=>createEndParts(i)),{ridgeHalf,eaveHalf,tilePitch:pitch,courses,run}=FOREGROUND_ROOF_LAYOUT,lanes=Math.round(2*eaveHalf/pitch),ridgeSegments=Math.ceil(2*ridgeHalf/pitch),counts={covers:0,pans:0,raisedTerminals:0,metalEnds:0,plainCeramicEnds:0,terminalSockets:0,terminalBedding:0,headlapSeats:0},terminalContacts=[],capRequests=[],edgeEndSpecs=new Map();
 // The unadorned alternate cover lanes used to end as black open shells.
 // Close them with full rounded fired-clay end seals. Their shallow relief
 // grows from the seal face; the existing gilded anchors remain untouched.
 const plainSeal=revolvedZ([[0,-.015],[.175,-.015],[.190,-.010],[.198,.004],[.198,.038],[.194,.052],[.178,.061],[0,.061]],'gallery-closed-rounded-plain-ceramic-eave-seal168');
 const plainEndVariants=endVariants.map(parts=>{const relief=parts.find(p=>p.m==='castRelief').g.clone();relief.scale(1,1,.28);relief.translate(0,0,.053);return[{g:plainSeal,m:'ceramic'},{g:relief,m:'ceramic'}];});
 const addTile=(spec,list)=>{list.push(createGalleryTile(spec.points,spec.width,spec));return spec;};
 const addSeats=specs=>{for(let i=1;i<specs.length;i++){const g=createHeadlapSeat(specs[i-1],specs[i]);if(g){bedding.push(g);counts.headlapSeats++;}}};
 emit(closedDeck(),materials.deck,0,0,0);
 for(let i=0;i<=lanes;i++){
  const x=-eaveHalf+pitch*i,start=Math.max(0,(Math.abs(x)-ridgeHalf)/(eaveHalf-ridgeHalf)),coverCourses=[];
  for(let j=0;j<courses;j++){
   const ta=Math.max(start,j/courses),tb=Math.min(1,(j+1)/courses+.008);if(tb<=ta+.001)continue;
   coverCourses.push(addTile(tileSpec(lin(ta,tb,6).map(t=>foregroundPoint(t,x/foregroundSpan(t))),.32,{variant:i*31+j*7},ta,tb),covers));counts.covers++;
  }
  addSeats(coverCourses);
  if(i<lanes){const xx=x+pitch/2,begin=Math.max(0,(Math.abs(xx)-ridgeHalf)/(eaveHalf-ridgeHalf)),panCourses=[];for(let j=0;j<courses;j++){const ta=Math.max(begin,j/courses),tb=Math.min(1,(j+1)/courses+.008);if(tb<=ta+.001)continue;panCourses.push(addTile(tileSpec(lin(ta,tb,6).map(t=>foregroundPoint(t,xx/foregroundSpan(t))),.40,{cover:false,crown:.03,bed:.21,lap:.022,thickness:.022,variant:i*23+j*11},ta,tb),pans));counts.pans++;}addSeats(panCourses);}
  const eaveSpec=coverCourses.at(-1);
  if(eaveSpec){bedding.push(createTerminalBedding(eaveSpec));counts.terminalBedding++;}
  // Same photograph-fitted medallion anchors and matrices. The new socket and
  // clay end bed connect each retained seal to the actual underlying cover.
  capRequests.push({t:1,u:x/eaveHalf,lift:.24,centre:null,tangent:null,spec:eaveSpec,edge:i===0?-1:i===lanes?1:null,plain:i%2===0&&i!==0&&i!==lanes});
  if(i%2===0)for(const t of[.20,.40])if(Math.abs(x)<foregroundSpan(t)-.16){const u=x/foregroundSpan(t),points=lin(t-.05,t,6).map((q,k)=>{const uq=x/foregroundSpan(q),f=frameAt(q,uq,true);return f.p.addScaledVector(f.up,.24+.19*(k/6)**1.3).toArray();}),spec=addTile(tileSpec(points,.40,{bed:0,crown:.20,lap:0,thickness:.028,variant:i*13+t*31},t-.05,t),special);counts.raisedTerminals++;bedding.push(createTerminalBedding(spec));counts.terminalBedding++;capRequests.push({t,u,lift:.43,centre:spec.curve.getPoint(1),tangent:spec.curve.getTangent(1),spec});}
 }
 for(const sign of[-1,1]){const edgeCourses=[];for(let j=0;j<courses;j++){const ta=j/courses,tb=Math.min(1,(j+1)/courses+.008);edgeCourses.push(addTile(tileSpec(lin(ta,tb,6).map(t=>foregroundPoint(t,sign)),.34,{bed:.27,crown:.17,lap:.025,thickness:.027,variant:sign*53+j*19},ta,tb),special));}addSeats(edgeCourses);const endSpec=edgeCourses.at(-1);edgeEndSpecs.set(sign,endSpec);bedding.push(createTerminalBedding(endSpec));counts.terminalBedding++;}
 const ridgeCourses=[];
 for(let j=0;j<ridgeSegments;j++){const xa=-ridgeHalf+j*2*ridgeHalf/ridgeSegments,xb=Math.min(ridgeHalf,-ridgeHalf+(j+1.08)*2*ridgeHalf/ridgeSegments);ridgeCourses.push(addTile(tileSpec(lin(xa,xb,6).map(x=>[x,FOREGROUND_ROOF_LAYOUT.rise+.14,0]),.31,{bed:.035,crown:.17,lap:.025,thickness:.027,variant:j*29},xa,xb),special));}addSeats(ridgeCourses);
 // Two old lane-end seals had no cover at all (start>=1). Join them to the
 // real left/right hip shoulder curves; retain their original face anchors.
 for(const request of capRequests){const spec=request.spec||edgeEndSpecs.get(request.edge);if(!spec)throw Error('Foreground terminal has no physical ceramic seat');placeEnd(request.t,request.u,request.lift,request.centre,request.tangent,spec,request.plain===true);}
 for(const list of[covers,pans,special,sockets,bedding]){if(!list.length)continue;const g=mergeGeometries(list,false);g.name=list===bedding?'foreground-conformed-clay-terminal-and-headlap-bedding':list===sockets?'foreground-joined-ceramic-terminal-sockets':'foreground-lapped-ceramic-assembly';emit(g,list===bedding?materials.deck:materials.ceramic,0,0,0);for(const p of list)p.dispose();}
 for(let i=0;i<=23;i++){const u=-1+2*i/23,a=foregroundPoint(.82,u),b=foregroundPoint(1.035,u);a[1]-=.22;b[1]-=.22;rod(a,b,.065,'red');}
 for(let j=0;j<40;j++){const a=foregroundPoint(1,-1+j*.05),b=foregroundPoint(1,-1+(j+1)*.05);a[1]-=.14;b[1]-=.14;rod(a,b,.10,'wood');}
 box(0,FOREGROUND_ROOF_LAYOUT.rise+.13,0,2*ridgeHalf+.15,.25,.28,'tile');
 function placeEnd(t,u,lift,centre=null,tangent=null,spec=null,plain=false){const f=frameAt(t,u,true),forward=tangent?tangent.clone().normalize():f.forward,across=new T.Vector3(0,1,0).cross(forward).normalize(),up=forward.clone().cross(across).normalize(),p=(centre?centre.clone():f.p.clone().addScaledVector(f.up,lift)).addScaledVector(forward,.035),basis=new T.Matrix4().makeBasis(across,up,forward),e=new T.Euler().setFromRotationMatrix(basis),rot=[e.x,e.y,e.z],variants=plain?plainEndVariants:endVariants,count=plain?counts.plainCeramicEnds:counts.metalEnds;for(const part of variants[count%variants.length])emit(part.g,part.m==='ceramic'?materials.ceramicEnd:materials[part.m],p.x,p.y,p.z,1,1,1,rot);if(spec){sockets.push(createTerminalSocket(spec,p,forward));counts.terminalSockets++;terminalContacts.push({anchor:p.toArray(),rotation:rot,plainCeramicSeal:plain,socketIntoSealLocalZ:-.019,sealRadiusAtSocketMetres:.196,socketFrontOuterRadiusMetres:.194,backFollowsActualTileCurve:true});}if(plain)counts.plainCeramicEnds++;else counts.metalEnds++;}
 return{audit:{revision:FOREGROUND_ROOF_REVISION,footprint:[2*eaveHalf,2*run],visiblePitchFace:{ridgeWidth:2*ridgeHalf,eaveWidth:2*eaveHalf,run,rise:FOREGROUND_ROOF_LAYOUT.rise,curl:FOREGROUND_ROOF_LAYOUT.curl},oldLocalProfilePreserved:false,fittedLayoutPreservedIn149:false,anchorChangedIn214:true,profileChangedIn149:false,worldTransform:{position:[...FOREGROUND_ROOF_LAYOUT.position],yaw:FOREGROUND_ROOF_LAYOUT.yaw},tileLanes:lanes+1,courses,tilePitchMetres:pitch,coverWidthMetres:.32,panWidthMetres:.40,nominalCourseLengthMetres:run/courses,ceramicWallMetres:[.022,.028],arrisBevelMetres:.004,embossDepthMetres:.023,castEnd:{method:'Closed connected six-scroll ground with rounded ribs, central boss and24cast beads; bronze retainer and narrow gilt bead',variants:3,photoTexture:false},terminalConstruction:{provenance:'assets/near-gallery149/terminal-jointing-r02.json',capAnchorsAndMatricesPreserved:true,hollowClosedSockets:true,allEaveThroatsClosedByConformedClay:true,nestedHeadlapsOnActualTileSurfaces:true,terminalContacts},surface:{provenance:'assets/near-gallery149/provenance.json',provider:'Poly Haven',sourceAsset:'grey_roof_01',sourceAuthor:'Rob Tuytel',license:'CC0-1.0',repeatMetres:.25,neutralCharcoalPigment:'#5b5752',dielectricIor:1.52,partlyGlazed:true,metricCrossArcUv:true,glazeWearAtRealLapEdges:true,photoTexture:false},counts,metricScaleInferred:true,formerFitRmsPixels:9.801790877076128,photoTextureOrProjection:false,visualAccepted:false},dispose(){materials.dispose();}};
}
