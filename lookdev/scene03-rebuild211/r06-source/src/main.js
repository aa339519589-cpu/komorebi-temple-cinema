import {createDollyPath} from '/reconstructions/camera-dolly.js';
import {installScannedTimber,addTimberExtent} from './scanned-timber.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import * as T from 'three';
import {buildReference4Architecture} from './reference4-architecture.js';
import {createRestorationLotusLeaf} from './restoration-lotus-leaf.js';
import {createRestorationLotusPetal,createRestorationLotusBud} from './restoration-lotus-petal.js';
import {createFracturedStone107,createBankStoneMaterial107,buildBridgeBearings107} from './scene03-fractured-stone107.js';
import {hallPlacement,stairPlacement,referenceCamera,hallFixtureMatrix} from './hall-layout.js';
import {createPondSurface} from './water-surface.js';
import {createLotusPetalMaterials,createLotusLeafMaterial} from './lotus-material.js';
import {createLotusBudMaterial98,foregroundBudPose98} from './lotus-bud98.js';
import {installCircleOfConfusion03,updateCircleOfConfusion03} from './lens03-coc101.js';
import {installRanmaRelief} from './ranma-relief.js';
import {installFloralScan109} from './scene03-floral-scan109.js';
import {installCarvedMount180} from './scene03-carved-mount180.js';
import {buildLanternSupports180} from './scene03-lantern-support180.js';
import {buildHangingLantern211} from './scene03-lantern211.js';
import {buildNoren211} from './scene03-noren211.js';
import {createEntranceSanctuary} from './entrance-sanctuary.js';
import {installEntryGranite} from './granite-entry-steps.js';
import {buildArchedBridge03} from './scene03-arched-bridge.js';
import {loadScene03GardenAssets} from './scene03-garden-assets.js';
import {createCarvedToro03} from './scene03-carved-toro.js';
import {buildLivingBanks03} from './scene03-living-banks.js';
import {ARCHITECTURE106 as fit106} from './architecture-layout106.js';
import {buildTowerGround106} from './scene03-tower-ground106.js';
import {createRootedLotusStem107} from './scene03-lotus-stem107.js';
import {installRootSurfaces108} from './scene03-root-surfaces108.js';
import {buildOverhang108} from './scene03-overhang108.js';
import {installDaylight108} from './scene03-daylight108.js';
import {installAtmosphere109} from './scene03-atmosphere109.js';

const q=new URLSearchParams(location.search),W=Math.min(2400,+(q.get('w')||960)),H=Math.min(2400,+(q.get('h')||960));
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
document.body.appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#91bde8');scene.fog=new T.Fog('#a9c5ca',55,130);
const camera=new T.PerspectiveCamera(58,W/H,.08,180);
const V=a=>new T.Vector3(...a);let seed=31018;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296},range=(a,b)=>a+(b-a)*rand();
const mats={},geos=new Set(),textures=new Set(),batches=new Map(),unitBox=new RoundedBoxGeometry(1,1,1,2,.018),unitSphere=new T.SphereGeometry(1,12,8),unitCylinder=new T.CylinderGeometry(1,1,1,16);let root=new T.Matrix4();
function mat(key,color,roughness=.8,metalness=0){const Material=key==='bridge lacquer cedar'?T.MeshPhysicalMaterial:T.MeshStandardMaterial;return mats[key]=new Material({name:key,color,roughness,metalness,...(key==='bridge lacquer cedar'?{clearcoat:.20,clearcoatRoughness:.34}:{})});}
const wood=mat('bridge lacquer cedar','#8f3622',.48),woodDark=mat('bridge exposed endgrain','#492719'),gold=mat('warm worn bronze','#ba8b33',.37,.78),black=mat('oxidised bronze','#3b3826',.65,.62),stone=mat('grainy cut granite','#77776d'),bankEarth=mat('warm planted bank soil','#393d2b',1),moss=mat('sunlit moss','#455b2d'),bark=mat('textured living bark','#554334'),leaf=mat('deep maple leaves','#5f7a30'),pine=mat('pine clusters','#426132');
const bankStone=await createBankStoneMaterial107({mats,textures});
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
const grain=tex('wood'),speck=tex('stone');for(let m of[wood,woodDark,bark]){m.map=grain;m.bumpMap=grain;m.bumpScale=.025}stone.map=speck;stone.bumpMap=speck;stone.bumpScale=.028;
bankEarth.map=speck;bankEarth.bumpMap=speck;bankEarth.bumpScale=.013;
const rootSurfaces108=await installRootSurfaces108({bankEarth,textures});
const daylight108=await installDaylight108({scene,skyDome,sunAxis,textures});
const atmosphere109=installAtmosphere109({scene,skyDome});
scene.add(new T.HemisphereLight('#d8e7ff','#65513b',.52));const sun=new T.DirectionalLight('#ffdfad',6.0);sun.position.copy(sunAxis).multiplyScalar(33);sun.castShadow=true;sun.shadow.mapSize.set(3072,3072);Object.assign(sun.shadow.camera,{left:-29,right:29,top:32,bottom:-17,near:1,far:90});sun.shadow.normalBias=.018;sun.shadow.bias=-.00005;scene.add(sun);scene.add(sun.target);const pondBounce=new T.DirectionalLight('#e8d9bb',.30);pondBounce.position.set(-5,7,21);pondBounce.target.position.set(3,9,-3);scene.add(pondBounce,pondBounce.target);
// Finite warm radiance from the sunlit stone terrace/pond-side court. This
// native LTC bounce approximation has no solved occlusion or diffuse GI.
RectAreaLightUniformsLib.init();const terraceBounce174=new T.RectAreaLight('#f5d7ad',.95,12.5,7.5);terraceBounce174.name='scene03-sunlit-court-reflected-radiance174';terraceBounce174.position.set(4.6,3.25,6.0);terraceBounce174.lookAt(8.1,12.7,-2.2);scene.add(terraceBounce174);
const reflectedLight174={source:'Finite sunlit stone-court radiance approximation',type:'RectAreaLight / LTC',position:terraceBounce174.position.toArray(),size:[12.5,7.5],radiance:.95,solvedDiffuseGI:false,selfShadowed:false};
// The double-roofed sanctuary is deliberately offset right and very close to the pond.
const architecture=buildReference4Architecture(T,{stairTopY:4.0,stairBottomZ:stairPlacement.run,stairWidth:stairPlacement.width,stairBottomWorldY:stairPlacement.bottomWorldY,stairYawRelative:stairPlacement.relativeYaw,stairCenterX:stairPlacement.centerX,bodyWidthScale:fit106.facade.bodyWidthScale,portalHeight:fit106.facade.portalHeight,lowerRoofWidth:fit106.roof.lowerWidth,lowerEave:fit106.roof.lowerEave,upperRoofWidth:fit106.roof.upperWidth,upperEave:fit106.roof.upperEave,gablePeak:fit106.roof.gablePeak,gableCenter:fit106.roof.gableCenter,capitalTop:fit106.facade.capitalTop,ridgeY:fit106.roof.ridgeY,hallElevation:hallPlacement.y,hallYaw:hallPlacement.yaw,towerPosition:fit106.tower.position.map((v,i)=>v-[hallPlacement.x,hallPlacement.y,hallPlacement.z][i]),towerHeight:fit106.tower.finialHeight,towerSceneScale:fit106.tower.scale,towerYaw:fit106.tower.yaw,towerPitch:fit106.tower.pitch,towerWidthScale:fit106.tower.widthScale});architecture.group.position.set(hallPlacement.x,hallPlacement.y,hallPlacement.z);scene.add(architecture.group);
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
// The flooded base remains dark mineral soil. Leaf litter belongs only to
// the raised banks; stretching it across a submerged16×32m box made the
// above view read as a large image sheet through the shallow pond.
const submergedSoil108=mat('scene03-dark-submerged-mineral-clay108','#1d2c21',.98);submergedSoil108.map=speck;submergedSoil108.bumpMap=speck;submergedSoil108.bumpScale=.006;
function mineralBase108(p,s){const g=new T.BoxGeometry(...s),pos=g.attributes.position,n=g.attributes.normal,uv=[];for(let k=0;k<pos.count;k++){const ax=[Math.abs(n.getX(k)),Math.abs(n.getY(k)),Math.abs(n.getZ(k))],i=ax.indexOf(Math.max(...ax));uv.push((i===0?pos.getZ(k):pos.getX(k))/3,(i===1?pos.getZ(k):pos.getY(k))/3);}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.name='scene03-closed-metric-mineral-substrate108';emit(g,submergedSoil108,p);}
mineralBase108([0,-.65,-10],[70,1,38]);for(let side of[-1,1])mineralBase108([side*15,-.48,7],[16,.7,32]);
const rocks=Array.from({length:7},(_,i)=>createFracturedStone107(i+17));
const gardenAssets=await loadScene03GardenAssets({emit,mats,textures});
const towerGround106=buildTowerGround106({emit,bankEarth,bankStone,rocks,gardenAssets,spec:fit106.tower});
const openPondChannel=(x,z)=>((x-1.4)/5.1)**2+((z-7.3)/4.4)**2<1.12;
for(let i=0;i<118;i++){let z=range(2,17),x=(rand()<.5?-1:1)*range(z<7?5.2:7,13),s=range(.22,.85),py=range(-.15,.4),sy=s*range(.7,1.1),sz=s*range(.8,1.6),yaw=range(0,6.28),tint=range(.65,1.15),keep=!openPondChannel(x,z);if(keep)gardenAssets.plant('rock',i,[x,py-.25,z],[s*1.7,sy*1.3,sz*1.4],[0,yaw,0],tint);}
// Broad red arch runs diagonally across the midground, with individual plank joints.
const bridgeModel=buildArchedBridge03(T,{at,emit,box,ell,between,sweep,wood,woodDark,gold,black,seal:bridgeSeal},fit106.bridge);
// Closed landing caps bear on two connected granite abutments down to the
// pond bed. The arch remains open between them; neither deck end floats.
const bridgeCap107=bankStone.clone();bridgeCap107.name='scene03-cut-damp-bearing-cap107';bridgeCap107.vertexColors=false;bridgeCap107.color.set('#7a8585');bridgeCap107.normalScale.set(.35,.35);bridgeCap107.clearcoat=.045;mats[bridgeCap107.name]=bridgeCap107;
const routeStone108=bridgeCap107.clone();routeStone108.name='scene03-same-granite-supported-route108';routeStone108.color.set('#a1abae');mats[routeStone108.name]=routeStone108;
const bridgeBearings107=buildBridgeBearings107({at,emit,box,bridgeModel,material:bankStone,capMaterial:bridgeCap107,gardenAssets});
function bridgeSeal(p,r){const [x,y,z]=p;sweep([[x,y+r,z],[x+r*.72,y,z],[x,y-r,z],[x-r*.72,y,z],[x,y+r,z]],.009,gold);for(const sign of[-1,1]){const pts=[];for(let i=0;i<22;i++){let t=i/21,a=t*Math.PI*2*1.15,rr=r*.70*(1-t*.65);pts.push([x+sign*r*.82+sign*Math.cos(a)*rr,y+Math.sin(a)*rr,z]);}sweep(pts,.008,gold);}ell([x,y,z],[r*.15,r*.15,.018],gold);}
function rosette(p,r){ell(p,[r*.5,r*.5,.035],gold);for(let j=0;j<12;j++){let a=j*Math.PI/6;emit(unitSphere,gold,[p[0]+Math.cos(a)*r*.72,p[1]+Math.sin(a)*r*.72,p[2]],[r*.29,r*.12,.027],[0,0,a]);}}
// Carved, open light chambers stand on actual granite/soil bearing pockets.
const warm=mat('lantern paper','#edca91',.9);warm.emissive.set('#db963b');warm.emissiveIntensity=.12;
const toros=await createCarvedToro03({emit,at,between,sweep,ell,mats,textures,moss,warm,woodDark});
toros.lantern(6.25,.85,8.0,1.83,.035);toros.lantern(4.216,2.25,4.369,.82,.10);toros.lantern(-8.2,.12,6.2,1.0,.08);toros.lantern(11,1.1,1.7,1.3,.04);
gardenAssets.plant('rock',3,[-8.2,-.23,6.2],[1.25,.62,1.25],[0,.5,0],1.03);
// Gold hanging fixtures, door curtains and chrysanthemum crests animate the hall facade.
const curtain=mat('ivory woven noren','#e4dbc1');const norenGold211=gold.clone();norenGold211.name='scene03-gold-thread-family-crest211';norenGold211.roughness=.68;norenGold211.metalness=.38;mats.norenGold211=norenGold211;
root=hallFixtureMatrix(T);
for(let x of[1.6,5,8.4]){const centre=x===5,y=centre?fit106.facade.curtainY:6.60,xx=x+(centre?fit106.facade.curtainX:0),h=centre?fit106.facade.curtainHeight:1.80;buildNoren211(T,{emit,cloth:centre?curtain:architecture.materials.black,gold:norenGold211},[xx,y,-2.15],centre?1.16:1.22,h,x);}
const lanternSupports180=buildLanternSupports180(T,{emit,box,between,gold,bronze:black,wood:architecture.materials.cedar});
const hangingLanterns211=[];for(const x of[-.8,2.0,8.0,10.8])hangingLanterns211.push(buildHangingLantern211(T,{emit,gold,bronze:black,paper:warm},x,7.38,-.9));
// A substantial openwork gilt hanging lantern occupies the sanctuary, with
// actual radial ribs and rings revealing a warm paper core behind the metal.
at([6.3,5.25,-4.0],0,()=>{const profile=[[0,.15],[.12,.29],[.27,.40],[.46,.43],[.65,.38],[.82,.25],[.92,.13]],R=y=>{let k=Math.min(profile.length-2,Math.floor(y/.92*(profile.length-1))),t=(y-profile[k][0])/(profile[k+1][0]-profile[k][0]);return T.MathUtils.lerp(profile[k][1],profile[k+1][1],t);};emit(new T.CylinderGeometry(.27,.27,.65,24),warm,[0,.46,0]);for(let k=0;k<16;k++){let a=k*Math.PI*2/16;sweep(profile.map(([y,r])=>[Math.cos(a)*r,y,Math.sin(a)*r]),.022,gold);for(let j=0;j<5;j++){let y0=.12+j*.14,y1=y0+.14,a1=a+.16;between([Math.cos(a)*R(y0),y0,Math.sin(a)*R(y0)],[Math.cos(a1)*R(y1),y1,Math.sin(a1)*R(y1)],.011,gold);}}for(const [y,r]of profile)emit(new T.TorusGeometry(r,.025,8,32),gold,[0,y,0],[1,1,1],[Math.PI/2,0,0]);ell([0,-.07,0],[.13,.11,.13],gold);ell([0,-.22,0],[.04,.13,.04],gold);between([0,.93,0],[0,3.15,0],.013,gold);});
// The former isolated bowl/table is replaced by a supported inner shrine.
root.identity();
// Irregular flowering cherries, airy maples and angular pine branches: no crown spheres.
let bladeGeom=(()=>{const p=[],uv=[],ids=[],rows=8,cols=4;for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){let t=j/rows,u=-1+2*i/cols,w=.044*Math.pow(Math.sin(Math.PI*t),.65);p.push(u*w,.025*Math.sin(Math.PI*t)*(1-.55*u*u),.20*t);uv.push(i/cols,t);}for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let k=j*(cols+1)+i;ids.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g})();leaf.side=T.DoubleSide;pine.side=T.DoubleSide;
let petalSmall=new T.SphereGeometry(1,5,3);const blooms=[mat('pale cherry','#e4adb9'),mat('warm cherry','#edd0c9'),mat('pink cherry','#c88fae')];
function tree(x,z,height,flowering=false){let trunk=[[x,-.18,z],[x+.18,height*.30,z+.12],[x-.14,height*.57,z],[x+.25,height*.82,z-.12]];for(let i=1;i<trunk.length;i++)between(trunk[i-1],trunk[i],.19*(1-i*.17),bark);for(let b=0;b<(flowering?21:17);b++){let a=b*2.399,y=height*range(.39,.85),l=height*range(.26,.52),start=[x+range(-.1,.1),y,z],end=[x+Math.cos(a)*l,y+range(.2,1.2),z+Math.sin(a)*l*.75],mid=[(start[0]+end[0])/2,y+.18,(start[2]+end[2])/2];between(start,mid,.065,bark);between(mid,end,.036,bark);for(let twig=0;twig<(flowering?9:7);twig++){let t=twig/(flowering?9:7),px=mid[0]+(end[0]-mid[0])*t+range(-.25,.25),py=mid[1]+(end[1]-mid[1])*t,pz=mid[2]+(end[2]-mid[2])*t+range(-.25,.25);for(let k=0;k<(flowering?125:92);k++){let p=[px+range(-.45,.45),py+range(-.16,.30),pz+range(-.40,.40)];if(flowering){let r=range(.018,.034);emit(petalSmall,blooms[k%3],p,[r*1.7,r*.72,r],[range(0,3),range(0,6),range(0,3)]);}else emit(bladeGeom,leaf,p,[range(.5,1.1),1,range(.6,1.2)],[range(-.6,.6),range(0,6),range(-.5,.5)],range(.8,1.2));}}}}
tree(-10,1,11.0,true);tree(-7.3,-2,6.8,true);tree(-11,-6,8.3,true);tree(-3.7,-1.2,7.2,false);tree(12.5,-1,7.1,false);tree(10.8,8,3.4,true);tree(-10,13,7.8,false);
// A rooted curved branch hierarchy and thin folded leaves replace the old
// parallel staves with flat star silhouettes at the upper-left edge.
const overhang108=buildOverhang108({emit,sweep,between,mat,bark,textures});
// Preserve the retained pond's random stream while replacing its old canopy.
// Existing rooted lotus and shoreline plants therefore retain their positions.
for(let j=0;j<5;j++){const end=[-6.5+j*.9,10.7+j*.74,5.6-j*.4];for(let k=0;k<84;k++){const p=[end[0]+range(-1.28,1.28),end[1]+range(-.45,.45),end[2]+range(-1.28,1.28)];if(p[0]>-4.35&&p[0]<-3.50&&p[2]>3.7&&p[2]<6.2)continue;for(let i=0;i<6;i++)rand();}}
// The garden is rebuilt as closed supported slopes, with true rooted shrub,
// groundcover and azalea branches. The photographed species remain authored.
const livingGarden=buildLivingBanks03({emit,at,between,box,mat,bankEarth,bankStone,routeStone:routeStone108,bark,leaf,hallPlacement,stairPlacement,gardenAssets,rocks,bridgeModel,towerSite:fit106.tower,reliefAt:rootSurfaces108.reliefAt});
// Small rooted plants inhabit the existing bridge abutment joints.
at(bridgeModel.position,bridgeModel.yaw,()=>{for(const sign of[-1,1])for(let j=0;j<8;j++){const x=sign*(bridgeModel.span/2-.02)+range(-.42,.42),z=(j%2?1:-1)*range(.8,1.13),y=.66+range(-.08,.08);gardenAssets.plant('groundcover',j,[x,y,z],[1.6,1.35,1.6],[0,range(0,6.28),0],1.08);}});
// Lotus surfaces use sculpted, radial pleats and separate curved veins.
const leafMaterialSet=await createLotusLeafMaterial(),lotusLeaf=leafMaterialSet.material;mats.lotusLeaf=lotusLeaf;for(const t of leafMaterialSet.textures)textures.add(t);const lotusUnder=mat('lotus stems','#738346',.65);
const lotusDeep=lotusLeaf.clone();lotusDeep.name='lotus-shaded-blue-green-tissue105';lotusDeep.color.multiply(new T.Color().setRGB(.72,.88,1.13)).multiplyScalar(.58);mats.lotusDeep105=lotusDeep;
lotusUnder.vertexColors=true;
function rootedLotusStem03(bottom,top,r){emit(createRootedLotusStem107(bottom,top,r),lotusUnder);}
const lotusGeos=Array.from({length:6},(_,i)=>createRestorationLotusLeaf(i+3));
const petalMaterialSet=createLotusPetalMaterials(),pinks=petalMaterialSet.materials;textures.add(petalMaterialSet.texture);
const pollen=mat('lotus golden pollen','#e7b933',.76);
let petalGeos=Array.from({length:15},(_,i)=>createRestorationLotusPetal(i%5+5,Math.floor(i/5)));
function lotus(x,z,y,size,bloom=false,pose=null){let stem=[x+range(-.12,.12),-.33,z+.1];
 if(!bloom){const g=lotusGeos[pose?.variant??Math.floor(rand()*6)],rot=pose?.rotation??[range(-.25,.40),range(0,6.28),range(-.25,.25)],tint=pose?.tint??range(.83,1.1),attachment=new T.Vector3(0,-.0354*size,0).applyEuler(new T.Euler(...rot)).add(V([x,y,z]));rootedLotusStem03(stem,attachment.toArray(),Math.min(.013,.018*size));emit(g,pose?.material??lotusLeaf,[x,y,z],[size,size,size],rot,tint);return;}
 rootedLotusStem03(stem,[x,y,z],.018*size);let old=root;root=root.clone().multiply(new T.Matrix4().makeTranslation(x,y,z)).multiply(new T.Matrix4().makeRotationX(.16));ell([0,.36*size,0],[.115*size,.055*size,.115*size],pollen);for(let layer=0;layer<3;layer++){let count=[11,9,6][layer];for(let j=0;j<count;j++){let angle=j*2.39996323+layer*.47+.055*Math.sin(j*3.1+layer);let g=petalGeos[layer*5+j%5];emit(g,pinks[layer],[Math.sin(angle)*.045*size,layer*.035*size,Math.cos(angle)*.045*size],[size*(1+.10*Math.sin(j*7.3+layer)),size*(1+.14*Math.sin(j*4.7+layer)),size*(1+.08*Math.sin(j*5.7))],[.12*Math.sin(j*3.1+layer),angle,.10*Math.cos(j*2.7),'YXZ']);}}const pollenSamples=Array.from({length:26},()=>range(.07,.16));for(let j=0;j<64;j++){let a=j*2.4,r=pollenSamples[j%26]*size;between([Math.cos(a)*r,.36*size,Math.sin(a)*r],[Math.cos(a)*r*1.05,(.48+.025*Math.sin(j*3.1))*size,Math.sin(a)*r*1.05],.0035*size,pollen);ell([Math.cos(a)*r*1.05,(.49+.025*Math.sin(j*3.1))*size,Math.sin(a)*r*1.05],[.009*size,.012*size,.009*size],pollen);}root=old;}
for(let i=0;i<114;i++){let z=range(9,19),x=range(-10,12);if(z>15.8&&Math.abs(x+2.4)<3)continue;if(Math.abs(x-1)<3.4&&z<17&&rand()<.90)continue;let bloom=i%13===0&&x>.8&&z<15.0;lotus(x,z,bloom?range(.55,.95):range(.01,.21),bloom?range(.15,.27):range(.43,.93),bloom);}
// One near flower is the main pond subject; the others stand among the bank
// leaves at varied physical stem heights. The central water channel stays open.
lotus(-3.35,15.35,.77,1.50,false,{rotation:[.67,.55,-.28],tint:.88,variant:2});
lotus(-1.0,15.5,.06,.70,false,{rotation:[.10,-.30,-.10],tint:1.05,variant:2});
lotus(-2.90,16.9,-.14,1.28,false,{rotation:[.14,-.30,.10],tint:.82,variant:3,material:lotusDeep});
lotus(-2.30,14.70,.50,.39,true);
lotus(1.25,12.1,.78,.25,true);lotus(.20,13.3,.59,.24,true);lotus(3.15,10.4,.80,.21,true);
for(const [cx,cz,n]of[[.7,12.8,4],[2.45,11.5,4],[3.55,10.3,3],[2.8,13.1,2]])for(let j=0;j<n;j++){
 const a=j*2.39996+cx,r=range(.12,.70),x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r*.82,y=range(.07,.45)+(j%4===0?.18:0);
 lotus(x,z,y,range(.44,.87),false,{rotation:[range(-.42,.32),range(0,6.28),range(-.34,.38)],variant:j%6,tint:range(.79,1.04)});
}
lotus(-3.9,13.0,.30,.17,true);lotus(-1.65,15.3,.03,.68,false);lotus(-1.9,13.0,.04,.55,false);
// The left foreground reference is a closed bud, not another open flower.
{const bud=createLotusBudMaterial98(),pose=foregroundBudPose98,[x,y,z]=pose.position;mats.lotusBud98=bud.material;for(const t of bud.textures)textures.add(t);emit(createRestorationLotusBud(),bud.material,pose.position,[pose.scale,pose.scale,pose.scale],pose.rotation);const neck=new T.Vector3(0,.05*pose.scale,0).applyEuler(new T.Euler(...pose.rotation)).add(V(pose.position));rootedLotusStem03([x-.15,-.33,z+.08],neck.toArray(),.0048);}
// Procedural cloud volume, beyond the architectural silhouette.

// A low trained pine has a curved trunk, tiered branch fans and real needle
// sprays, keeping the garden's silhouette irregular rather than spherical.
const needleMat=mat('living pine needle sprays','#526c2c',.78),needleVariants=[];
for(let variant=0;variant<5;variant++){let pp=[];for(let j=0;j<24;j++){const a=j*2.39996+variant*.33,h=.018+.075*(.5+.5*Math.sin(j*7.1+variant)),rad=.035+.035*(.5+.5*Math.cos(j*4.2)),tip=new T.Vector3(Math.cos(a)*rad,h,Math.sin(a)*rad),axis=tip.clone().normalize(),side=new T.Vector3(-axis.z,0,axis.x).normalize(),up=new T.Vector3().crossVectors(axis,side),base=[];for(let k=0;k<3;k++){let aa=k*Math.PI*2/3;base.push(side.clone().multiplyScalar(Math.cos(aa)*.0024).addScaledVector(up,Math.sin(aa)*.0024));}for(let k=0;k<3;k++)for(const p of[base[k],base[(k+1)%3],tip])pp.push(...p.toArray());}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.computeVertexNormals();needleVariants.push(g);}
at([5.3,.12,5.5],0,()=>{const trunk=[[0,0,0],[.08,.75,-.12],[.34,1.6,-.21],[.20,2.65,-.24]];for(let k=0;k<3;k++)between(trunk[k],trunk[k+1],.085-k*.023,bark);for(let tier=0;tier<6;tier++)for(let fan=0;fan<2;fan++){let y=.73+tier*.34,a=tier*2.39996+fan*.92,reach=1.16-tier*.10,start=[.12+tier*.02,y,-.1-tier*.02],end=[start[0]+Math.cos(a)*reach,y+.15,start[2]+Math.sin(a)*reach];between(start,end,.030-tier*.003,bark);for(let j=0;j<75;j++){let t=range(.30,1.12),x=start[0]+(end[0]-start[0])*t+range(-.27,.27),z=start[2]+(end[2]-start[2])*t+range(-.27,.27);emit(needleVariants[j%5],needleMat,[x,y+.15+range(-.035,.07),z],[range(.8,1.3),range(.9,1.3),range(.8,1.3)],[range(-.18,.18),range(0,6.28),range(-.18,.18)],range(.78,1.2));}}});
// Sparse duckweed patches break the continuous mirror without obscuring the water.
const duckweed=mat('small duckweed','#819d4a',.7);for(let k=0;k<16;k++){const cx=range(-7,10),cz=range(9,20);for(let j=0;j<34;j++){let r=range(.014,.038);ell([cx+range(-.7,.7),-.037,cz+range(-.55,.55)],[r,.004,r*.82],duckweed,range(.75,1.15));}}
// CC0 surface-only pass: preserve dense41 geometry, camera and batch grouping.
const scannedTimber=await installScannedTimber({red:architecture.materials.red,cedar:architecture.materials.cedar,endwood:architecture.materials.endwood,darkwood:architecture.materials.darkwood,gableTimber180:architecture.materials.gableTimber180,gableCarving:architecture.materials.gableCarving,gableRecess:architecture.materials.gableRecess,bridge:wood,bridgeDark:woodDark,ceiling:nearCeiling});
const entryGranite=await installEntryGranite(T,architecture.materials.stairGranite);
const sanctuary=createEntranceSanctuary(T,architecture);
const ranma=await installRanmaRelief(T,architecture);
const floralScan109=await installFloralScan109(T,architecture);
const carvedMount180=await installCarvedMount180(T,architecture);
architecture.group.traverse(object=>{if(object.geometry&&scannedTimber.materials.has(object.material))addTimberExtent(object.geometry);});
// Flush batches: ordinary, lit, shadow-casting meshes only.
let instances=0;for(let {g,m,a}of batches.values()){if(scannedTimber.materials.has(m))addTimberExtent(g);let mesh=new T.InstancedMesh(g,m,a.length);for(let i=0;i<a.length;i++){mesh.setMatrixAt(i,a[i].matrix);mesh.setColorAt(i,new T.Color().setScalar(a[i].tint));}mesh.castShadow=mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);instances+=a.length;}
// Actual reflection is blended with the pond bed by water's Fresnel response.
// The old material.opacity assignment never reached Reflector's fixed-alpha shader.
const water=createPondSurface(W,H);scene.add(water);
const waterBase=new T.Mesh(new T.PlaneGeometry(65,60),mat('dark mineral pond bed105','#122118',1));waterBase.rotation.x=-Math.PI/2;waterBase.position.set(0,-.30,10);scene.add(waterBase);
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
function info(){return{reference:3,revision:'scene-03-coved-hijiki-and-intercolumn-struts211-r06',ready:true,frames,camera:{position:camera.position.toArray(),target:lastTarget,fov:camera.fov},hallPlacement:{...hallPlacement},bridge:bridgeModel,bridgeBearings107,towerGround106,fit106,stairPlacement:{...stairPlacement},livingGarden:livingGarden.info(),rootSurfaces108:rootSurfaces108.info,overhang108,daylight108,atmosphere109,reflectedLight174,toros:toros.info(),optics:lens.userData.optics,water:{fresnelF0:((1.333-1)/(2.333))**2,phase:'world-space metres',opaqueMirror:false},geometryInstances:instances,architecture:architecture.stats,ranma:ranma.info,floralScan109:floralScan109.info,carvedMount180:carvedMount180.info,lanternSupports180,hangingLanterns211,gablePigment180:{timber:architecture.materials.gableTimber180.color.toArray(),carvedTimber:architecture.materials.gableCarving.color.toArray(),recess:architecture.materials.gableRecess.color.toArray(),material:'CC0 wood scan multiplied by physically bounded lacquer pigment; gable-specific sun-facing calibration'},sanctuary:sanctuary.info,entryGranite:entryGranite.info,renderer:{calls:geometryRender.calls,triangles:geometryRender.triangles,compositeCalls:renderer.info.render.calls},assets:'Authored closed hall/gallery/carpentry, bridge girders, folded lotus solids and carved granite toro; rooted CC0 garden understory on closed banks, retained shrine and 105 granite stair/cap stones; no reference scene image textures'}}
function dispose(){entryGranite.dispose();sanctuary.dispose();ranma.dispose();floralScan109.dispose();carvedMount180.dispose();scannedTimber.dispose();colourTarget.dispose();lens.dispose();water.dispose();water.geometry.dispose();waterBase.geometry.dispose();skyDome.geometry.dispose();skyDome.material.dispose();postScene.children.forEach(o=>o.geometry?.dispose());architecture.dispose();for(let g of geos)g.dispose();for(let t of textures)t.dispose();for(let m of Object.values(mats))m.dispose();pinks.forEach(m=>m.dispose());renderer.dispose()}
window.temple={ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info,dispose};document.querySelector('#loading').remove();if(!q.has('defer'))renderReference();
