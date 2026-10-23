import {createDollyPath} from '/reconstructions/camera-dolly.js';
import {installScannedTimber,addTimberExtent} from './scanned-timber.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from 'three';
import {buildReference4Architecture} from './reference4-architecture.js';
import {createRestorationLotusLeaf} from './restoration-lotus-leaf.js';
import {createRestorationLotusPetal,createRestorationLotusBud} from './restoration-lotus-petal.js';
import {granite} from './reference4-natural-forms.js';
import {hallPlacement,referenceCamera,hallFixtureMatrix} from './hall-layout.js';
import {createPondSurface} from './water-surface.js';
import {createLotusPetalMaterials,createLotusLeafMaterial} from './lotus-material.js';
import {createLotusBudMaterial98,foregroundBudPose98} from './lotus-bud98.js';
import {installCircleOfConfusion03,updateCircleOfConfusion03} from './lens03-coc101.js';
import {installRanmaRelief} from './ranma-relief.js';
import {createEntranceSanctuary} from './entrance-sanctuary.js';
import {installEntryGranite} from './granite-entry-steps.js';
import {buildArchedBridge03} from './scene03-arched-bridge.js';

const q=new URLSearchParams(location.search),W=Math.min(2400,+(q.get('w')||960)),H=Math.min(2400,+(q.get('h')||960));
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
document.body.appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#91bde8');scene.fog=new T.Fog('#a9c5ca',55,130);
const camera=new T.PerspectiveCamera(58,W/H,.08,180);
const V=a=>new T.Vector3(...a);let seed=31018;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296},range=(a,b)=>a+(b-a)*rand();
const mats={},geos=new Set(),textures=new Set(),batches=new Map(),unitBox=new RoundedBoxGeometry(1,1,1,2,.018),unitSphere=new T.SphereGeometry(1,12,8),unitCylinder=new T.CylinderGeometry(1,1,1,16);let root=new T.Matrix4();
function mat(key,color,roughness=.8,metalness=0){return mats[key]=new T.MeshStandardMaterial({name:key,color,roughness,metalness});}
const wood=mat('bridge lacquer cedar','#8f3622',.48),woodDark=mat('bridge exposed endgrain','#492719'),gold=mat('warm worn bronze','#ba8b33',.37,.78),black=mat('oxidised bronze','#3b3826',.65,.62),stone=mat('grainy cut granite','#77776d'),bankStone=mat('weathered grey-green garden granite','#687065',.96),bankEarth=mat('warm planted bank soil','#6d634d',1),moss=mat('sunlit moss','#617744'),bark=mat('textured living bark','#554334'),leaf=mat('deep maple leaves','#5f7a30'),pine=mat('pine clusters','#426132');
function emit(g,m,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0],tint=1){let key=g.uuid+':'+m.uuid,b=batches.get(key);if(!b)batches.set(key,b={g,m,a:[]});const matrix=new T.Matrix4().compose(V(pos),new T.Quaternion().setFromEuler(new T.Euler(...rot)),V(scale)).premultiply(root);b.a.push({matrix,tint});geos.add(g);}
function box(p,s,m=wood,r=[0,0,0]){emit(unitBox,m,p,s,r)}
function ell(p,s,m=stone,t=1){emit(unitSphere,m,p,s,[0,0,0],t)}
function between(a,b,r,m=bark,boxy=false,d=r){a=V(a);b=V(b);let vec=b.clone().sub(a),matrix=new T.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),vec.clone().normalize()),new T.Vector3(r,vec.length(),d));let g=boxy?unitBox:unitCylinder,key=g.uuid+':'+m.uuid;if(!batches.has(key))batches.set(key,{g,m,a:[]});batches.get(key).a.push({matrix:root.clone().multiply(matrix),tint:1});}
function at(p,yaw,fn){let old=root;root=root.clone().multiply(new T.Matrix4().compose(V(p),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw),new T.Vector3(1,1,1)));fn();root=old;}
function sweep(points,r,m){let g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(V)),Math.max(12,points.length*4),r,8,false);emit(g,m);}
function tex(kind){let n=256,data=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){let i=(y*n+x)*4;let f=kind==='wood'?.58+.18*Math.sin(x*.6+2.5*Math.sin(y*.023))+.08*Math.sin(x*1.5+y*.012):.48+.19*Math.sin(x*3.1+y*4.1)*Math.sin(x*1.7-y*.9)+.10*(Math.sin(x*127.1+y*311.7)*43758.5453%1);const grit=Math.sin(x*127.1+y*311.7)*43758.5453,hn=grit-Math.floor(grit),c=kind==='wood'?160+f*90:hn<.05?63:hn>.955?247:90+Math.max(0,Math.min(1,f))*153;for(let k=0;k<3;k++)data[i+k]=Math.round(c);data[i+3]=255}let t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;textures.add(t);return t}
// Analytical HDR sky supplies outdoor reflections to the bronze and gilded fittings.
// Low warm key light from the front-left keeps the pond-level view reverent
// while stretching roof and bridge shadows like the late-afternoon reference.
const envWidth=256,envHeight=128,envPixels=new Float32Array(envWidth*envHeight*4),sunAxis=V([-20,21,16]).normalize();
function skyNoise(x,y){const h=(i,j)=>{let k=Math.sin(i*127.1+j*311.7)*43758.5453;return k-Math.floor(k)},i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,a=u*u*(3-2*u),b=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(h(i,j),h(i+1,j),a),T.MathUtils.lerp(h(i,j+1),h(i+1,j+1),a),b)}
for(let j=0;j<envHeight;j++)for(let i=0;i<envWidth;i++){const phi=(i/envWidth-.5)*Math.PI*2,theta=Math.PI-j/envHeight*Math.PI,dir=new T.Vector3(Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi));const c=dir.y>0?new T.Color('#c8d9e4').lerp(new T.Color('#719cce'),Math.pow(dir.y,.45)):new T.Color('#a5a28a').lerp(new T.Color('#485543'),Math.pow(-dir.y,.35));const x=i/envWidth*18,y=j/envHeight*11,n=skyNoise(x,y)*.52+skyNoise(x*2.1,y*2.1)*.25+skyNoise(x*4.3,y*4.3)*.15+skyNoise(x*8.5,y*8.5)*.08;const coverage=T.MathUtils.smoothstep(n,.51,.70)*T.MathUtils.smoothstep(dir.y,.05,.3);c.lerp(new T.Color('#f7f7ed'),coverage*.90);const disc=Math.pow(Math.max(0,dir.dot(sunAxis)),1500)*11,k=(j*envWidth+i)*4;envPixels[k]=c.r+disc;envPixels[k+1]=c.g+disc*.88;envPixels[k+2]=c.b+disc*.66;envPixels[k+3]=1;}
const skyEnv=new T.DataTexture(envPixels,envWidth,envHeight,T.RGBAFormat,T.FloatType);skyEnv.mapping=T.EquirectangularReflectionMapping;skyEnv.needsUpdate=true;scene.environment=skyEnv;scene.environmentIntensity=.8;textures.add(skyEnv);
const skyDome=new T.Mesh(new T.SphereGeometry(150,64,32),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:`varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 skyDirection;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.)),f.x),f.y);}void main(){vec3 d=normalize(skyDirection);vec3 col=mix(vec3(.38,.67,.95),vec3(.06,.27,.66),pow(max(0.,d.y),.45));vec2 p=d.xz/max(.18,d.y)*2.8;float f=.52*n(p)+.26*n(p*2.1)+.14*n(p*4.2)+.08*n(p*8.5);float cloud=smoothstep(.50,.69,f)*smoothstep(.02,.20,d.y);col=mix(col,vec3(1.,.995,.96),cloud*.94);gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>
#include <colorspace_fragment>}` }));scene.add(skyDome);
const grain=tex('wood'),speck=tex('stone');for(let m of[wood,woodDark,bark]){m.map=grain;m.bumpMap=grain;m.bumpScale=.025}for(const m of[stone,bankStone]){m.map=speck;m.bumpMap=speck;m.bumpScale=m===bankStone?.09:.065;}
scene.add(new T.HemisphereLight('#d4e7ff','#66563b',1.30));const sun=new T.DirectionalLight('#ffd19a',5.5);sun.position.set(-20,21,16);sun.castShadow=true;sun.shadow.mapSize.set(3072,3072);Object.assign(sun.shadow.camera,{left:-29,right:29,top:32,bottom:-17,near:1,far:90});sun.shadow.normalBias=.045;sun.shadow.bias=-.00014;scene.add(sun);scene.add(sun.target);const pondBounce=new T.DirectionalLight('#e8d9bb',.80);pondBounce.position.set(-5,7,21);pondBounce.target.position.set(3,9,-3);scene.add(pondBounce,pondBounce.target);
// The double-roofed sanctuary is deliberately offset right and very close to the pond.
const architecture=buildReference4Architecture(T,{stairTopY:4.0,stairBottomZ:7.8,stairWidth:5.5,lowerRoofWidth:17.4,capitalTop:9.1,ridgeY:19.6,hallElevation:hallPlacement.y,hallYaw:hallPlacement.yaw,towerPosition:[-5.4-hallPlacement.x,-.4-hallPlacement.y,-11.3-hallPlacement.z],towerHeight:27.0,towerSceneScale:1.06});architecture.group.position.set(hallPlacement.x,hallPlacement.y,hallPlacement.z);scene.add(architecture.group);
architecture.materials.red.color.set('#84472f');architecture.materials.cedar.color.set('#75472f');architecture.materials.endwood.color.set('#785336');architecture.materials.darkwood.color.set('#302118');architecture.materials.slate.color.set('#2e414f');architecture.materials.slate.roughness=.72;architecture.materials.slate.bumpScale=.0015;architecture.materials.tileEdge.color.set('#687b86');architecture.materials.gold.color.set('#c6a157');architecture.materials.oldgold.color.set('#987442');
architecture.materials.plaster.color.set('#b2a285');architecture.materials.stairBed.color.set('#85877e');architecture.materials.stairBed.map=speck;architecture.materials.stairBed.bumpMap=speck;architecture.materials.stairBed.bumpScale=.05;architecture.materials.stairBed.roughness=.94;
for(const key of['red','cedar','endwood','darkwood'])architecture.materials[key].bumpScale=.006;
const stairFootprint=(x,z,pad=.25)=>{const dx=x-hallPlacement.x,dz=z-hallPlacement.z+4,c=Math.cos(hallPlacement.yaw),s=Math.sin(hallPlacement.yaw),localX=c*dx-s*dz,localZ=s*dx+c*dz-4;return localZ>=-pad&&localZ<=7.8+pad&&Math.abs(localX)<=2.75+pad;};
// Close return eave at the right edge: underside is visible from the low pond.
const nearCeiling=architecture.materials.darkwood.clone();nearCeiling.side=T.DoubleSide;mats.nearCeiling=nearCeiling;
at([9.4,0,8.0],.10,()=>{
 const pp=[],uv=[],n=28,profile=(x,z)=>10.7+.055*x+.10*Math.pow(z/3.4,6),tri=(a,b,c)=>{for(const p of[a,b,c]){pp.push(...p);uv.push(p[0],p[2]);}};
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){let x=-4.1+8.2*i/n,z=-3.4+6.8*j/n,xx=x+8.2/n,zz=z+6.8/n;tri([x,profile(x,z),z],[x,profile(x,zz),zz],[xx,profile(xx,z),z]);tri([xx,profile(xx,z),z],[x,profile(x,zz),zz],[xx,profile(xx,zz),zz]);}
 let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();emit(g,nearCeiling);
 for(let j=0;j<38;j++){let x=-4.05+j*8.1/37;between([x,10.37,-3.4],[x,10.37,3.4],.10,woodDark,true,.16);box([x,10.38,3.45],[.10,.16,.07],gold);}
 for(let z of[-2.5,0,2.5])box([0,10.15,z],[8.4,.28,.24],woodDark);
 for(let j=0;j<3;j++)box([-3.9,10.52+j*.08,0],[.18,.08,6.9],j===1?gold:woodDark);
});
// Ground is broken into real islands beside an open reflective pond corridor.
box([0,-.65,-10],[70,1,38],bankEarth);for(let side of[-1,1]){box([side*15,-.48,7],[16,.7,32],bankEarth);}
const rocks=Array.from({length:7},(_,i)=>granite(i+17));
const openPondChannel=(x,z)=>((x-1.4)/5.1)**2+((z-7.3)/4.4)**2<1.12;
for(let i=0;i<118;i++){let z=range(2,17),x=(rand()<.5?-1:1)*range(z<7?5.2:7,13),s=range(.22,.85),py=range(-.15,.4),sy=s*range(.7,1.1),sz=s*range(.8,1.6),yaw=range(0,6.28),tint=range(.65,1.15),keep=!openPondChannel(x,z);if(keep)emit(rocks[i%7],bankStone,[x,py,z],[s,sy,sz],[0,yaw,0],tint);if(keep&&i%3===0)emit(rocks[i%7],moss,[x,s*.5,z],[s*.82,s*.26,s*.74]);}
// Broad red arch runs diagonally across the midground, with individual plank joints.
const bridgeModel=buildArchedBridge03(T,{at,emit,box,ell,between,sweep,wood,woodDark,gold,black,seal:bridgeSeal});
// Closed landing caps bear on two connected granite abutments down to the
// pond bed. The arch remains open between them; neither deck end floats.
at(bridgeModel.position,-.28,()=>{
 for(const sign of[-1,1]){
  const x=sign*3.58;
  emit(rocks[sign>0?4:1],bankStone,[x,-.25,0],[1.08,.77,1.48],[0,sign*.16,0],.94);
  for(let row=0;row<3;row++)for(let k=0;k<3;k++){
   const z=-.72+k*.72,xx=x+.13*Math.sin(row*2.1+k*1.7);
   emit(rocks[(row*3+k+(sign>0?2:4))%7],bankStone,[xx,-.25+row*.48,z],[.56+.045*Math.cos(k+row),.65,.58],[.07*Math.sin(k),sign*.22+row*.43,.05*Math.cos(row+k)],.90+.065*((k+row)%3));
  }
  box([x,1.055,0],[.88,.15,2.15],stone);
  for(const z of[-1.12,1.12]){emit(rocks[sign>0?5:1],bankStone,[x+sign*.30,-.05,z],[.72,.70,.60],[0,z*.5,0],1.02);emit(rocks[6],moss,[x+sign*.25,.40,z],[.61,.11,.49],[0,z*.5,0],1.04);}
 }
});
function bridgeSeal(p,r){const [x,y,z]=p;sweep([[x,y+r,z],[x+r*.72,y,z],[x,y-r,z],[x-r*.72,y,z],[x,y+r,z]],.009,gold);for(const sign of[-1,1]){const pts=[];for(let i=0;i<22;i++){let t=i/21,a=t*Math.PI*2*1.15,rr=r*.70*(1-t*.65);pts.push([x+sign*r*.82+sign*Math.cos(a)*rr,y+Math.sin(a)*rr,z]);}sweep(pts,.008,gold);}ell([x,y,z],[r*.15,r*.15,.018],gold);}
function rosette(p,r){ell(p,[r*.5,r*.5,.035],gold);for(let j=0;j<12;j++){let a=j*Math.PI/6;emit(unitSphere,gold,[p[0]+Math.cos(a)*r*.72,p[1]+Math.sin(a)*r*.72,p[2]],[r*.29,r*.12,.027],[0,0,a]);}}
// Stone toro are fully modelled: framed light chambers and ridged hip caps.
const warm=mat('lantern paper','#e7be78',.9);warm.emissive.set('#db963b');warm.emissiveIntensity=.35;
function curvedLanternCap(){let pp=[],uv=[],n=20;const P=(i,j)=>{let x=-.68+1.36*i/n,z=-.68+1.36*j/n,t=Math.max(Math.abs(x),Math.abs(z))/.68,y=.48*Math.pow(1-t,1.6)+.10*Math.pow(t,7)+.045*Math.pow(Math.abs(x*z)/.46,3);return[x,y,z]},tri=(a,b,c)=>{for(let p of[a,b,c]){pp.push(...p);uv.push(p[0],p[2]);}};for(let j=0;j<n;j++)for(let i=0;i<n;i++){let a=P(i,j),b=P(i+1,j),c=P(i,j+1),d=P(i+1,j+1);tri(a,c,b);tri(b,c,d);}for(let k=0;k<n;k++)for(let side=0;side<4;side++){let a=side===0?P(k,0):side===1?P(n,k):side===2?P(n-k,n):P(0,n-k),b=side===0?P(k+1,0):side===1?P(n,k+1):side===2?P(n-k-1,n):P(0,n-k-1);let aa=[a[0],a[1]-.15,a[2]],bb=[b[0],b[1]-.15,b[2]];tri(a,b,aa);tri(b,bb,aa);}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}
function lantern(x,y,z,s=1){at([x,y,z],0,()=>{box([0,.08*s,0],[.94*s,.16*s,.94*s],stone);box([0,.22*s,0],[.64*s,.15*s,.64*s],stone);box([0,.88*s,0],[.40*s,1.24*s,.40*s],stone);box([0,1.54*s,0],[.86*s,.17*s,.86*s],stone);box([0,1.96*s,0],[.70*s,.76*s,.70*s],warm);for(let a=0;a<4;a++)at([0,0,0],a*Math.PI/2,()=>{for(let sign of[-1,1]){box([sign*.30*s,1.97*s,.38*s],[.12*s,.78*s,.14*s],stone);box([0,(1.97+sign*.34)*s,.38*s],[.72*s,.10*s,.14*s],stone);}box([0,1.97*s,.33*s],[.45*s,.53*s,.015*s],warm);for(let j=-1;j<=1;j++)box([j*.14*s,1.97*s,.445*s],[.035*s,.55*s,.03*s],woodDark);box([0,1.98*s,.45*s],[.48*s,.035*s,.03*s],woodDark);});
let roof=curvedLanternCap();emit(roof,stone,[0,2.36*s,0],[s,s,s]);ell([0,2.85*s,0],[.19*s,.21*s,.19*s],stone);ell([0,3.06*s,0],[.095*s,.11*s,.095*s],stone);for(let k=0;k<15;k++){let a=range(0,6.28),r=range(.15,.57);ell([Math.cos(a)*r,2.63*s,Math.sin(a)*r],[.13*s,.035*s,.11*s],moss);}});}
lantern(6.25,.15,8.0,2.15);lantern(4.05,1.85,4.3,.88);lantern(-8.2,.12,6.2,1.0);lantern(11,1.1,1.7,1.3);
// The stair-side lantern stands on a connected weathered boulder footing.
emit(rocks[2],bankStone,[4.05,1.12,4.30],[.76,1.04,.78],[0,.3,0],1.05);
emit(rocks[5],moss,[4.05,1.82,4.30],[.66,.095,.68],[0,.3,0],1.05);
// Gold hanging fixtures, door curtains and chrysanthemum crests animate the hall facade.
const curtain=mat('ivory woven noren','#e4dbc1');
root=hallFixtureMatrix(T);
for(let x of[1.6,5,8.4]){box([x,6.95,-2.15],[1.35,2.10,.045],x===5?curtain:architecture.materials.black);rosette([x,6.95,-2.1],.31);}
for(let x of[-.8,2.0,8.0,10.8]){between([x,8.4,-.9],[x,7.7,-.9],.022,gold);emit(new T.CylinderGeometry(.23,.18,.65,8),gold,[x,7.38,-.9]);box([x,7.38,-.655],[.25,.45,.015],warm);for(let k=0;k<6;k++)box([x-.14+k*.056,7.38,-.64],[.015,.46,.025],gold);ell([x,6.95,-.9],[.08,.18,.08],gold);}
// A substantial openwork gilt hanging lantern occupies the sanctuary, with
// actual radial ribs and rings revealing a warm paper core behind the metal.
at([6.3,5.25,-4.0],0,()=>{const profile=[[0,.15],[.12,.29],[.27,.40],[.46,.43],[.65,.38],[.82,.25],[.92,.13]],R=y=>{let k=Math.min(profile.length-2,Math.floor(y/.92*(profile.length-1))),t=(y-profile[k][0])/(profile[k+1][0]-profile[k][0]);return T.MathUtils.lerp(profile[k][1],profile[k+1][1],t);};emit(new T.CylinderGeometry(.27,.27,.65,24),warm,[0,.46,0]);for(let k=0;k<16;k++){let a=k*Math.PI*2/16;sweep(profile.map(([y,r])=>[Math.cos(a)*r,y,Math.sin(a)*r]),.022,gold);for(let j=0;j<5;j++){let y0=.12+j*.14,y1=y0+.14,a1=a+.16;between([Math.cos(a)*R(y0),y0,Math.sin(a)*R(y0)],[Math.cos(a1)*R(y1),y1,Math.sin(a1)*R(y1)],.011,gold);}}for(const [y,r]of profile)emit(new T.TorusGeometry(r,.025,8,32),gold,[0,y,0],[1,1,1],[Math.PI/2,0,0]);ell([0,-.07,0],[.13,.11,.13],gold);ell([0,-.22,0],[.04,.13,.04],gold);between([0,.93,0],[0,3.15,0],.013,gold);});
// The former isolated bowl/table is replaced by a supported inner shrine.
root.identity();
// Irregular flowering cherries, airy maples and angular pine branches: no crown spheres.
let bladeGeom=(()=>{const p=[],uv=[],ids=[],rows=8,cols=4;for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){let t=j/rows,u=-1+2*i/cols,w=.044*Math.pow(Math.sin(Math.PI*t),.65);p.push(u*w,.025*Math.sin(Math.PI*t)*(1-.55*u*u),.20*t);uv.push(i/cols,t);}for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let k=j*(cols+1)+i;ids.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g})();leaf.side=T.DoubleSide;pine.side=T.DoubleSide;
let petalSmall=new T.SphereGeometry(1,5,3);const blooms=[mat('pale cherry','#f6d7db'),mat('warm cherry','#ffe6df'),mat('pink cherry','#e5b9cf')];
function tree(x,z,height,flowering=false){let trunk=[[x,0,z],[x+.18,height*.30,z+.12],[x-.14,height*.57,z],[x+.25,height*.82,z-.12]];for(let i=1;i<trunk.length;i++)between(trunk[i-1],trunk[i],.19*(1-i*.17),bark);for(let b=0;b<(flowering?21:17);b++){let a=b*2.399,y=height*range(.39,.85),l=height*range(.26,.52),start=[x+range(-.1,.1),y,z],end=[x+Math.cos(a)*l,y+range(.2,1.2),z+Math.sin(a)*l*.75],mid=[(start[0]+end[0])/2,y+.18,(start[2]+end[2])/2];between(start,mid,.065,bark);between(mid,end,.036,bark);for(let twig=0;twig<(flowering?9:7);twig++){let t=twig/(flowering?9:7),px=mid[0]+(end[0]-mid[0])*t+range(-.25,.25),py=mid[1]+(end[1]-mid[1])*t,pz=mid[2]+(end[2]-mid[2])*t+range(-.25,.25);for(let k=0;k<(flowering?125:92);k++){let p=[px+range(-.45,.45),py+range(-.16,.30),pz+range(-.40,.40)];if(flowering){let r=range(.018,.034);emit(petalSmall,blooms[k%3],p,[r*1.7,r*.72,r],[range(0,3),range(0,6),range(0,3)]);}else emit(bladeGeom,leaf,p,[range(.5,1.1),1,range(.6,1.2)],[range(-.6,.6),range(0,6),range(-.5,.5)],range(.8,1.2));}}}}
tree(-10,1,7.1,true);tree(-7.3,-2,5.8,true);tree(-11,-6,8.3,true);tree(-3.7,-1.2,7.2,false);tree(12.5,-1,7.1,false);tree(10.8,8,3.4,true);tree(-10,13,7.8,false);
// Foreground maple branches frame the upper-left sky with individually lobed leaves.
const mapleShape=new T.Shape();for(let k=0;k<50;k++){let a=k/50*Math.PI*2,r=.20*(.63+.37*Math.cos(a*5));let x=Math.cos(a)*r,z=Math.sin(a)*r;if(k===0)mapleShape.moveTo(x,z);else mapleShape.lineTo(x,z);}mapleShape.closePath();const mapleLeaf=new T.ShapeGeometry(mapleShape);mapleLeaf.rotateX(-Math.PI/2);
for(let j=0;j<5;j++){let end=[-6.5+j*.9,10.7+j*.74,5.6-j*.4];between([-11,9.8,6.3],end,.05-j*.006,bark);for(let k=0;k<84;k++){let p=[end[0]+range(-1.28,1.28),end[1]+range(-.45,.45),end[2]+range(-1.28,1.28)];if(p[0]>-4.35&&p[0]<-3.50&&p[2]>3.7&&p[2]<6.2)continue;emit(mapleLeaf,leaf,p,[range(.65,1.1),1,range(.65,1.1)],[range(-.5,.4),range(0,6.28),range(-.3,.3)],range(.7,1.25));}}
// Stemmed foliage grows through the bridge abutment joints and overlaps the
// supported landing edge, rather than screening a rectangular soil block.
at(bridgeModel.position,-.28,()=>{for(const sign of[-1,1])for(let j=0;j<120;j++){const x=sign*3.58+range(-.65,.65),z=(j%2?1:-1)*range(.80,1.30),y=range(.35,.90);emit(bladeGeom,leaf,[x,y,z],[range(.9,1.6),1,range(1.0,1.9)],[range(-.55,.7),range(0,6.28),range(-.3,.3)],range(.83,1.18));}});
// Shrubs and sword irises attach the bridge and lantern bases to the garden.
for(let i=0;i<75;i++){let x=(rand()<.5?-1:1)*range(5.7,11.8),z=range(2,13),y=range(.1,.45),keep=!openPondChannel(x,z)&&!stairFootprint(x,z,.5);for(let j=0;j<144;j++){const px=x+range(-.45,.45),py=y+range(0,.8),pz=z+range(-.45,.45),sx=range(.6,1.3),sz=range(.8,1.8),rx=range(-.7,.5),ry=range(0,6.28),tint=range(.8,1.4);if(keep)emit(bladeGeom,leaf,[px,py,pz],[sx,1,sz],[rx,ry,0],tint);}}
for(let i=0;i<12;i++){let x=range(1.8,5.6),z=range(7.3,10.1);for(let j=0;j<13;j++){let a=j*2.39996,pp=[],ids=[];for(let k=0;k<=8;k++){let t=k/8,r=.035+.52*t*t,y=.86*t-.10*t*t,w=.018*(1-t)+.001;for(let sign of[-1,1])pp.push(Math.cos(a)*r+sign*Math.sin(a)*w,y,Math.sin(a)*r-sign*Math.cos(a)*w);}for(let k=0;k<8;k++){let n=k*2;ids.push(n,n+1,n+2,n+1,n+3,n+2);}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setIndex(ids);g.computeVertexNormals();emit(g,leaf,[x,.1,z]);}}
// Broken banks screen the structural plinth; the central arch keeps a water opening.
for(let i=0;i<60;i++){let x=range(-7.5,9.5),z=range(4.3,8.5);if(x> -4.1&&x<-.8&&z>5.3)continue;const keep=!openPondChannel(x,z)&&!stairFootprint(x,z,.45),r=range(.16,.42),py=range(-.04,.16),sx=r*range(1.0,1.55),sy=r*range(.5,1.05),sz=r*range(.8,1.35),yaw=range(0,6.28),tint=range(.76,1.12);if(keep)emit(rocks[i%7],bankStone,[x,py,z],[sx,sy,sz],[0,yaw,0],tint);if(keep&&i%2===0)emit(rocks[i%7],moss,[x,r*.44,z],[r*.8,r*.15,r*.7]);for(let j=0;j<11;j++){const px=x+range(-.20,.20),py=r*.3+range(.1,.35),pz=z+range(-.2,.2),rx=range(-.5,.5),ry=range(0,6.28),leafTint=range(.9,1.3);if(keep)emit(bladeGeom,leaf,[px,py,pz],[.5,1,.7],[rx,ry,0],leafTint);}}
// Raised garden pockets mask the stair cheek and expose individual step treads.
for(let k=0;k<30;k++){let side=k%2?1:-1,x=side>0?range(8.0,10):range(2.3,3.6),z=range(3.0,6.3),r=range(.22,.48),keep=!openPondChannel(x,z)&&!stairFootprint(x,z,.62),py=range(.1,.38),sy=r*range(.72,1.15),yaw=range(0,6.28),tint=range(.82,1.18);if(keep)emit(rocks[k%7],bankStone,[x,py,z],[r,sy,r*1.2],[0,yaw,0],tint);for(let j=0;j<190;j++){const px=x+range(-.56,.56),leafY=range(.5,1.35),pz=z+range(-.44,.44),sz=range(.5,.85),rx=range(-.4,.5),ry=range(0,6.28),leafTint=range(.9,1.32);if(keep)emit(bladeGeom,leaf,[px,leafY,pz],[.58,1,sz],[rx,ry,0],leafTint);}}
// The elevated temple terrace is planted, not an exposed concrete plinth.
for(let i=0;i<65;i++){let x=i%2?range(-2.2,2.8):range(8.8,11.8),z=range(-1.5,3.9),h=range(.25,1.9),r=range(.22,.52);if(stairFootprint(x,z,.62))continue;emit(rocks[i%7],bankStone,[x,h*.30,z],[r*1.18,r*.86,r*1.15],[0,range(0,6.28),0],range(.82,1.16));for(let j=0;j<24;j++)emit(bladeGeom,leaf,[x+range(-.5,.5),h+range(.1,.8),z+range(-.5,.5)],[range(.45,.85),1,range(.5,1.0)],[range(-.5,.5),range(0,6.28),range(-.2,.2)],range(.9,1.24));}
// Original 03 has steep, densely planted stone banks beside the light stair.
// These pockets follow the actual turned hall terrace, rather than scattering
// tiny grass strips on a bare grey box. A private seed keeps lotus anchors fixed.
{
 let gardenSeed=33872;const gRand=()=>{gardenSeed=(Math.imul(gardenSeed,1664525)+1013904223)|0;return(gardenSeed>>>0)/4294967296;},gRange=(a,b)=>a+(b-a)*gRand();
 const shrubMats=[mat('azalea deep leaves','#294b23',.76),mat('azalea sunlit leaves','#506b2c',.75),mat('azalea olive leaves','#697439',.82)];for(const m of shrubMats)m.side=T.DoubleSide;
 const pp=[],ii=[],rows=6,cols=4;for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const t=j/rows,u=-1+2*i/cols,w=.072*Math.pow(Math.sin(Math.PI*t),.85);pp.push(u*w,.017*Math.sin(Math.PI*t)*(1-u*u)-.017*u*u,.25*t);}for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let n=j*(cols+1)+i;ii.push(n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2);}const shrubLeaf=new T.BufferGeometry();shrubLeaf.setAttribute('position',new T.Float32BufferAttribute(pp,3));shrubLeaf.setIndex(ii);shrubLeaf.computeVertexNormals();
 const bankOffset=(side,z)=>2.65*T.MathUtils.smoothstep((z-.22)/7,.22,.92);
 const bankY=(x,z)=>(4.0+hallPlacement.y-.22)*Math.pow(Math.max(0,1-(z-.22)/7.0),1.05)+.12*Math.sin(x*2.7+z*2.1);
 at([hallPlacement.x,0,hallPlacement.z-4],hallPlacement.yaw,()=>at([0,0,4],0,()=>{
  for(const side of[-1,1]){
   const p=[],uv=[],nX=18,nZ=24,P=(i,j)=>{const t=j/nZ,z=.22+7*t,x=side*(3.14+(4.7+.27*Math.sin(t*7))*i/nX+bankOffset(side,z));return[x,bankY(x,z)-.11,z];},tri=(a,b,c)=>{for(const v of[a,b,c]){p.push(...v);uv.push(v[0],v[2]);}};
   for(let j=0;j<nZ;j++)for(let i=0;i<nX;i++){const a=P(i,j),b=P(i+1,j),c=P(i,j+1),d=P(i+1,j+1);if(side>0){tri(a,c,b);tri(b,c,d);}else{tri(a,b,c);tri(b,d,c);}}
   const border=[...Array.from({length:nX},(_,i)=>P(i,0)),...Array.from({length:nZ},(_,j)=>P(nX,j)),...Array.from({length:nX},(_,i)=>P(nX-i,nZ)),...Array.from({length:nZ},(_,j)=>P(0,nZ-j))],base=[side*6,-.44,3.72];
   for(let k=0;k<border.length;k++){const a=border[k],b=border[(k+1)%border.length],aa=[a[0],-.44,a[2]],bb=[b[0],-.44,b[2]];if(side>0){tri(a,b,aa);tri(b,bb,aa);tri(base,aa,bb);}else{tri(a,aa,b);tri(b,aa,bb);tri(base,bb,aa);}}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();emit(g,bankEarth);
   for(let j=0;j<13;j++)for(let i=0;i<9;i++){const z=.25+j*.56+gRange(-.15,.15),x=side*(3.12+i*.59+gRange(-.14,.14)+bankOffset(side,z)),y=bankY(x,z),r=gRange(.34,.66);emit(rocks[(j+i)%7],bankStone,[x,y-.055,z],[r*gRange(1,1.45),r*gRange(.68,1.03),r*gRange(.9,1.35)],[gRange(-.2,.2),gRange(0,6.28),gRange(-.1,.1)],gRange(.80,1.16));if((i+j)%2===0)emit(rocks[(j+i)%7],moss,[x,y+r*.40,z],[r*.82,r*.13,r*.72],[0,gRange(0,6.28),0],gRange(.86,1.12));}
   for(let b=0;b<76;b++){const z=gRange(.4,7.0),x=side*(gRange(3.25,7.75)+bankOffset(side,z)),y=bankY(x,z),r=gRange(.34,.75),h=gRange(.34,.89);between([x,y-.07,z],[x+.08,y+h,z+.02],.022,bark);for(let k=0;k<180;k++){const a=gRange(0,Math.PI*2),rr=r*Math.sqrt(gRand()),px=x+Math.cos(a)*rr,py=y+h*(.2+.8*Math.sqrt(Math.max(0,1-(rr/r)**2)))+gRange(-.09,.10),pz=z+Math.sin(a)*rr;if(Math.abs(px)<2.98)continue;emit(shrubLeaf,shrubMats[(b+k%3)%3],[px,py,pz],[gRange(.75,1.4),1,gRange(.75,1.4)],[gRange(-.6,.55),a+gRange(-.9,.9),gRange(-.5,.5)],gRange(.8,1.15));if(b%6===0&&k%8===0){const rr=.031;emit(petalSmall,blooms[b%3],[x+Math.cos(a)*r*.8,py+.055,z+Math.sin(a)*r*.8],[rr*1.7,rr*.6,rr*1.4],[0,a,0]);}}}
  }
 }));
}
// Lotus surfaces use sculpted, radial pleats and separate curved veins.
const leafMaterialSet=await createLotusLeafMaterial(),lotusLeaf=leafMaterialSet.material;mats.lotusLeaf=lotusLeaf;for(const t of leafMaterialSet.textures)textures.add(t);const lotusUnder=mat('lotus stems','#738346',.65);
const lotusGeos=Array.from({length:6},(_,i)=>createRestorationLotusLeaf(i+3));
const petalMaterialSet=createLotusPetalMaterials(),pinks=petalMaterialSet.materials;textures.add(petalMaterialSet.texture);
const pollen=mat('lotus golden pollen','#e7b933',.76);
let petalGeos=Array.from({length:15},(_,i)=>createRestorationLotusPetal(i%5+5,Math.floor(i/5)));
function lotus(x,z,y,size,bloom=false,pose=null){let stem=[x+range(-.12,.12),-.05,z+.1];
 if(!bloom){const g=lotusGeos[Math.floor(rand()*6)],rot=pose?.rotation??[range(-.25,.40),range(0,6.28),range(-.25,.25)],tint=pose?.tint??range(.83,1.1),attachment=new T.Vector3(0,-.0354*size,0).applyEuler(new T.Euler(...rot)).add(V([x,y,z]));between(stem,attachment.toArray(),Math.min(.013,.018*size),lotusUnder);emit(g,lotusLeaf,[x,y,z],[size,size,size],rot,tint);return;}
 between(stem,[x,y,z],.018*size,lotusUnder);let old=root;root=root.clone().multiply(new T.Matrix4().makeTranslation(x,y,z)).multiply(new T.Matrix4().makeRotationX(.16));ell([0,.50*size,0],[.12*size,.065*size,.12*size],pollen);for(let layer=0;layer<3;layer++){let count=[10,9,7][layer];for(let j=0;j<count;j++){let angle=j/count*Math.PI*2+layer*.28+.045*Math.sin(j*3.1+layer);let g=petalGeos[layer*5+j%5];emit(g,pinks[layer],[Math.sin(angle)*.045*size,layer*.035*size,Math.cos(angle)*.045*size],[size,size,size],[.11*Math.sin(j*3.1+layer),angle,.038*Math.cos(j*2.7),'YXZ']);}}const pollenSamples=Array.from({length:26},()=>range(.07,.16));for(let j=0;j<64;j++){let a=j*2.4,r=pollenSamples[j%26]*size;between([Math.cos(a)*r,.50*size,Math.sin(a)*r],[Math.cos(a)*r*1.05,.62*size,Math.sin(a)*r*1.05],.0035*size,pollen);ell([Math.cos(a)*r*1.05,.63*size,Math.sin(a)*r*1.05],[.009*size,.012*size,.009*size],pollen);}root=old;}
for(let i=0;i<114;i++){let z=range(9,19),x=range(-10,12);if(z>15.8&&Math.abs(x+2.4)<3)continue;if(Math.abs(x-1)<3.4&&z<17&&rand()<.90)continue;let bloom=i%13===0&&x>.8&&z<15.0;lotus(x,z,bloom?range(.55,.95):range(.01,.21),bloom?range(.15,.27):range(.43,.93),bloom);}
// One near flower is the main pond subject; the others stand among the bank
// leaves at varied physical stem heights. The central water channel stays open.
lotus(-3.62,15.35,.85,1.72,false,{rotation:[.72,.55,-.28],tint:1.12});
lotus(-1.95,17.25,.02,2.10,false,{rotation:[.20,-.30,-.14],tint:.91});
lotus(-2.45,16.95,-.035,2.10,false,{rotation:[.32,-.13,.15],tint:.90});
lotus(-2.30,14.70,.60,.35,true);
lotus(1.25,12.1,.78,.25,true);lotus(.20,13.3,.59,.24,true);lotus(3.15,10.4,.80,.21,true);
for(let j=0;j<18;j++){const x=.15+(j%6)*.55+range(-.20,.20),z=10.5+Math.floor(j/6)*1.10+range(-.20,.25);lotus(x,z,range(.24,.57),range(.60,1.10),false);}
lotus(-3.9,13.0,.30,.17,true);lotus(-1.65,15.3,.07,1.25,false);lotus(-1.9,13.0,.08,.88,false);
// The left foreground reference is a closed bud, not another open flower.
{const bud=createLotusBudMaterial98(),pose=foregroundBudPose98,[x,y,z]=pose.position;mats.lotusBud98=bud.material;for(const t of bud.textures)textures.add(t);emit(createRestorationLotusBud(),bud.material,pose.position,[pose.scale,pose.scale,pose.scale],pose.rotation);const neck=new T.Vector3(0,.05*pose.scale,0).applyEuler(new T.Euler(...pose.rotation)).add(V(pose.position));between([x-.15,-.08,z+.08],neck.toArray(),.0048,lotusUnder);}
// Procedural cloud volume, beyond the architectural silhouette.

// A low trained pine has a curved trunk, tiered branch fans and real needle
// sprays, keeping the garden's silhouette irregular rather than spherical.
const needleMat=mat('living pine needle sprays','#526c2c',.78),needleVariants=[];
for(let variant=0;variant<5;variant++){let pp=[];for(let j=0;j<24;j++){const a=j*2.39996+variant*.33,h=.018+.075*(.5+.5*Math.sin(j*7.1+variant)),rad=.035+.035*(.5+.5*Math.cos(j*4.2)),tip=new T.Vector3(Math.cos(a)*rad,h,Math.sin(a)*rad),axis=tip.clone().normalize(),side=new T.Vector3(-axis.z,0,axis.x).normalize(),up=new T.Vector3().crossVectors(axis,side),base=[];for(let k=0;k<3;k++){let aa=k*Math.PI*2/3;base.push(side.clone().multiplyScalar(Math.cos(aa)*.0024).addScaledVector(up,Math.sin(aa)*.0024));}for(let k=0;k<3;k++)for(const p of[base[k],base[(k+1)%3],tip])pp.push(...p.toArray());}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.computeVertexNormals();needleVariants.push(g);}
at([5.3,.12,5.5],0,()=>{const trunk=[[0,0,0],[.08,.75,-.12],[.34,1.6,-.21],[.20,2.65,-.24]];for(let k=0;k<3;k++)between(trunk[k],trunk[k+1],.085-k*.023,bark);for(let tier=0;tier<6;tier++)for(let fan=0;fan<2;fan++){let y=.73+tier*.34,a=tier*2.39996+fan*.92,reach=1.16-tier*.10,start=[.12+tier*.02,y,-.1-tier*.02],end=[start[0]+Math.cos(a)*reach,y+.15,start[2]+Math.sin(a)*reach];between(start,end,.030-tier*.003,bark);for(let j=0;j<75;j++){let t=range(.30,1.12),x=start[0]+(end[0]-start[0])*t+range(-.27,.27),z=start[2]+(end[2]-start[2])*t+range(-.27,.27);emit(needleVariants[j%5],needleMat,[x,y+.15+range(-.035,.07),z],[range(.8,1.3),range(.9,1.3),range(.8,1.3)],[range(-.18,.18),range(0,6.28),range(-.18,.18)],range(.78,1.2));}}});
// Sparse duckweed patches break the continuous mirror without obscuring the water.
const duckweed=mat('small duckweed','#819d4a',.7);for(let k=0;k<16;k++){const cx=range(-7,10),cz=range(9,20);for(let j=0;j<34;j++){let r=range(.014,.038);ell([cx+range(-.7,.7),-.037,cz+range(-.55,.55)],[r,.004,r*.82],duckweed,range(.75,1.15));}}
// CC0 surface-only pass: preserve dense41 geometry, camera and batch grouping.
const scannedTimber=await installScannedTimber({red:architecture.materials.red,cedar:architecture.materials.cedar,endwood:architecture.materials.endwood,darkwood:architecture.materials.darkwood,bridge:wood,bridgeDark:woodDark,ceiling:nearCeiling});
const entryGranite=await installEntryGranite(T,architecture.materials.stairGranite);
const sanctuary=createEntranceSanctuary(T,architecture);
const ranma=await installRanmaRelief(T,architecture);
architecture.group.traverse(object=>{if(object.geometry&&scannedTimber.materials.has(object.material))addTimberExtent(object.geometry);});
// Flush batches: ordinary, lit, shadow-casting meshes only.
let instances=0;for(let {g,m,a}of batches.values()){if(scannedTimber.materials.has(m))addTimberExtent(g);let mesh=new T.InstancedMesh(g,m,a.length);for(let i=0;i<a.length;i++){mesh.setMatrixAt(i,a[i].matrix);mesh.setColorAt(i,new T.Color().setScalar(a[i].tint));}mesh.castShadow=mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);instances+=a.length;}
// Actual reflection is blended with the pond bed by water's Fresnel response.
// The old material.opacity assignment never reached Reflector's fixed-alpha shader.
const water=createPondSurface(W,H);scene.add(water);
const waterBase=new T.Mesh(new T.PlaneGeometry(65,60),mat('pond green depths','#2b4838',1));waterBase.rotation.x=-Math.PI/2;waterBase.position.set(0,-.30,10);scene.add(waterBase);
const colourTarget=new T.WebGLRenderTarget(W,H,{type:T.HalfFloatType,depthBuffer:true});colourTarget.depthTexture=new T.DepthTexture(W,H,T.UnsignedIntType);colourTarget.samples=4;
const postScene=new T.Scene(),postCamera=new T.Camera();let geometryRender={calls:0,triangles:0};
const lens=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tColour:{value:colourTarget.texture},tDepth:{value:colourTarget.depthTexture},inverseSize:{value:new T.Vector2(1/W,1/H)},cameraNear:{value:camera.near},cameraFar:{value:camera.far},focusDistance:{value:18.0},inverseProjection:{value:camera.projectionMatrixInverse}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`varying vec2 vUv;uniform sampler2D tColour;uniform sampler2D tDepth;uniform vec2 inverseSize;uniform float cameraNear;uniform float cameraFar;uniform float focusDistance;uniform mat4 inverseProjection;vec3 viewPoint(vec2 uv){float d=texture2D(tDepth,uv).x;vec4 v=inverseProjection*vec4(uv*2.-1.,d*2.-1.,1.);return v.xyz/v.w;}void main(){float d=texture2D(tDepth,vUv).x;float viewDepth=(cameraNear*cameraFar)/(cameraFar-(cameraFar-cameraNear)*d);float radius=clamp(abs(1./max(viewDepth,.1)-1./focusDistance)*2.6,0.,2.4);vec3 col=texture2D(tColour,vUv).rgb;float total=1.;for(int i=0;i<12;i++){float fi=float(i),a=fi*2.39996323,r=sqrt((fi+.5)/12.)*radius;col+=texture2D(tColour,vUv+vec2(cos(a),sin(a))*r*inverseSize).rgb;total+=1.;}float ao=1.;if(d<.99999){vec3 p=viewPoint(vUv),normal=normalize(cross(dFdx(p),dFdy(p)));float occ=0.;for(int j=0;j<8;j++){float a=float(j)*2.39996323;vec3 v=viewPoint(vUv+vec2(cos(a),sin(a))*5.*inverseSize)-p;float len=length(v);if(len>.003&&len<.65)occ+=max(0.,dot(normal,v/len)-.06)*(1.-len/.65);}ao=1.-clamp(occ*.12,0.,.28);}gl_FragColor=vec4(col/total*ao,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
installCircleOfConfusion03(lens,{width:W,height:H,camera});
postScene.add(new T.Mesh(new T.PlaneGeometry(2,2),lens));
const ref=referenceCamera;let frames=0,lastTarget=ref.target;
function renderView(position,target,time=0,fov=58,focus=18){lens.uniforms.focusDistance.value=focus;water.material.uniforms.waterTime.value=time;camera.position.fromArray(position);camera.fov=fov;camera.lookAt(...target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);updateCircleOfConfusion03(lens,camera);lastTarget=[...target];renderer.setRenderTarget(colourTarget);renderer.render(scene,camera);geometryRender={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};renderer.setRenderTarget(null);renderer.render(postScene,postCamera);frames++;return{frame:frames,position:camera.position.toArray(),target,fov,time}}
function renderReference(n=3){if(n!==3)throw Error('Reference 03 only');return renderView(ref.position,ref.target,0,ref.fov)}
const dolly=createDollyPath({points:[[-2.65,.68,16.55],[-2.65,.64,17.2],[-1.1,.45,18.4],ref.position],nearTarget:[-2.35,.52,15.5],farTarget:ref.target,fov:ref.fov});
function renderShot(localTime=0){const p=dolly(localTime),nearFocus=Math.hypot(.30,.16,1.05),rack=T.MathUtils.smoothstep(p.phase,.04,.38),focus=1/((1-rack)/nearFocus+rack/18);return renderView(p.position,p.target,localTime,p.fov,focus);}
function info(){return{reference:3,revision:'scene-03-hall-carpentry104-grounded-garden104',ready:true,frames,camera:{position:camera.position.toArray(),target:lastTarget,fov:camera.fov},hallPlacement:{...hallPlacement},bridge:bridgeModel,optics:lens.userData.optics,water:{fresnelF0:((1.333-1)/(2.333))**2,phase:'world-space metres',opaqueMirror:false},geometryInstances:instances,architecture:architecture.stats,ranma:ranma.info,sanctuary:sanctuary.info,entryGranite:entryGranite.info,renderer:{calls:geometryRender.calls,triangles:geometryRender.triangles,compositeCalls:renderer.info.render.calls},assets:'Authored closed hall/gallery/carpentry, bridge girders and grounded rock/soil banks; retained shrine and105closed granite stair/cap stones at20height-corrected levels; independent CC0 surface PBR, no reference image textures'}}
function dispose(){entryGranite.dispose();sanctuary.dispose();ranma.dispose();scannedTimber.dispose();colourTarget.dispose();lens.dispose();water.dispose();water.geometry.dispose();waterBase.geometry.dispose();skyDome.geometry.dispose();skyDome.material.dispose();postScene.children.forEach(o=>o.geometry?.dispose());architecture.dispose();for(let g of geos)g.dispose();for(let t of textures)t.dispose();for(let m of Object.values(mats))m.dispose();pinks.forEach(m=>m.dispose());renderer.dispose()}
window.temple={ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info,dispose};document.querySelector('#loading').remove();if(!q.has('defer'))renderReference();
