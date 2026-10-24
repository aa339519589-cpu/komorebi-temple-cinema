import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {detailNoise} from './surface-detail.js';
import {createPineShoot158,buildPineGeometry158,HERO_PINE_ORIGINS} from './pine-shoot193.js';
import {createBridgeHallStairPlan125} from './layout125.js';
import {pondContains207,pondShoreDistance207,createApproachPlan207,nearIslandHeight207,nearRouteGround207,hallShoreHeight207} from './support-route207.js';
import {nearEcology210,bankBedHeight210,towerBenchHeight210,buildRainBanks210} from './rain-banks210.js';

// Rain garden193. The field is a physical triangulated landform. All plants
// use its triangle height or a downward hit on an actually transformed rock.
// Independent RNG keeps the existing architecture, paving and rain untouched.
const TAU=Math.PI*2,UP=new T.Vector3(0,1,0),V=p=>new T.Vector3(...p);
const rng=s=>()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);
const smooth=(x,a,b)=>T.MathUtils.smoothstep(x,a,b);
const hash=(x,z)=>{const t=Math.sin(x*127.1+z*311.7)*43758.5453;return t-Math.floor(t);};
function noise(x,z){const ix=Math.floor(x),iz=Math.floor(z),a=x-ix,b=z-iz,u=a*a*(3-2*a),v=b*b*(3-2*b);return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iz),hash(ix+1,iz),u),T.MathUtils.lerp(hash(ix,iz+1),hash(ix+1,iz+1),u),v);}
function fbm(x,z){return .57*noise(x,z)+.28*noise(x*2.03+9,z*2.03-4)+.15*noise(x*4.11-2,z*4.11+8);}

export async function loadShrubs193(){
 const gltf=await new GLTFLoader().loadAsync('/assets/polyhaven/shrub-02/shrub_02_4k.gltf'),variants=[];
 gltf.scene.updateMatrixWorld(true);
 for(const root of gltf.scene.children){
  const bounds=new T.Box3().setFromObject(root),centre=bounds.getCenter(new T.Vector3()),height=bounds.max.y-bounds.min.y,parts=[];
  root.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.translate(-centre.x,-bounds.min.y,-centre.z);geometry.scale(1/height,1/height,1/height);
   const material=new T.MeshPhysicalMaterial({name:'natural193-whole-CC0-shrub',map:o.material.map,normalMap:o.material.normalMap,normalScale:new T.Vector2(.58,.58),roughnessMap:o.material.roughnessMap,metalness:0,color:'#c1c5a5',roughness:.86,clearcoat:.10,clearcoatRoughness:.36,alphaTest:.46,side:T.DoubleSide});
   for(const k of ['map','normalMap','roughnessMap'])if(material[k])material[k].anisotropy=8;
   parts.push({geometry,material});
  });
  variants.push({parts,name:root.name,sourceHeight:height});
 }
 return{variants,info:{source:'https://polyhaven.com/a/shrub_02',author:'Rico Cilliers',license:'CC0-1.0',use:'Whole original 3D plants; rigid uniform scale and yaw only; original UVs/normals retained.'}};
}

class Mesh193{
 constructor(){this.p=[];this.uv=[];this.col=[];this.ix=[];}
 vertex(p,uv=[0,0],shade=1){const i=this.p.length/3;this.p.push(...(p.isVector3?p.toArray():p));this.uv.push(...uv);this.col.push(shade,shade,shade);return i;}
 tube(points,r0,r1,sides=7,steps=8,seed=1){
  const curve=new T.CatmullRomCurve3(points.map(V)),frames=curve.computeFrenetFrames(steps,false),start=this.p.length/3,length=curve.getLength();
  for(let j=0;j<=steps;j++){const t=j/steps,c=curve.getPointAt(t),r=T.MathUtils.lerp(r0,r1,t);
   for(let k=0;k<=sides;k++){const a=k/sides*TAU,rr=r*(1+.055*Math.sin(a*5+seed+t*3)+.025*Math.cos(a*9-seed));this.vertex(c.clone().addScaledVector(frames.normals[j],Math.cos(a)*rr).addScaledVector(frames.binormals[j],Math.sin(a)*rr),[a*r0*.60,t*length*.6],.87+.12*noise(a*3+seed,t*8));}
  }
  for(let j=0;j<steps;j++)for(let k=0;k<sides;k++){const a=start+j*(sides+1)+k,b=a+1,c=a+sides+1;this.ix.push(a,b,c,b,c+1,c);}
  for(const [j,flip]of[[0,true],[steps,false]]){const c=this.vertex(curve.getPointAt(j/steps));for(let k=0;k<sides;k++){const a=start+j*(sides+1)+k;this.ix.push(c,flip?a+1:a,flip?a:a+1);}}
 }
 needle(base,direction,length,width,shade){
  const d=direction.clone().normalize(),a=new T.Vector3().crossVectors(d,Math.abs(d.y)>.9?V([1,0,0]):UP).normalize(),b=d.clone().cross(a).normalize(),ids=[];
  for(let k=0;k<3;k++){const t=k/3*TAU;ids.push(this.vertex(base.clone().addScaledVector(a,Math.cos(t)*width).addScaledVector(b,Math.sin(t)*width),[k/3,0],shade));}
  const tip=this.vertex(base.clone().addScaledVector(d,length),[.5,1],shade*1.06);this.ix.push(ids[0],ids[2],ids[1],ids[0],ids[1],tip,ids[1],ids[2],tip,ids[2],ids[0],tip);
 }
 leaf(base,dir,length,width,shade){
  const z=dir.clone().normalize(),x=z.clone().cross(UP).normalize();if(x.lengthSq()<.01)x.set(1,0,0);const y=x.clone().cross(z).normalize(),rows=[],root=this.vertex(base,[.59,.885],shade);
  for(let j=1;j<3;j++){const t=j/3,c=base.clone().addScaledVector(z,t*length).addScaledVector(y,Math.sin(t*Math.PI)*length*.11),w=Math.sin(t*Math.PI)*width,ids=[];for(const side of[-1,0,1])ids.push(this.vertex(c.clone().addScaledVector(x,w*side).addScaledVector(y,Math.abs(side)*length*.035),[.59+t*.30,.885+side*.105],shade));rows.push(ids);}
  const tip=this.vertex(base.clone().addScaledVector(z,length),[.89,.885],shade);
  for(let k=0;k<2;k++){this.ix.push(root,rows[0][k],rows[0][k+1]);const a=rows[0][k],b=rows[0][k+1],c=rows[1][k],d=rows[1][k+1];this.ix.push(a,c,b,b,c,d,rows[1][k],tip,rows[1][k+1]);}
 }
 geometry(name){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('uv',new T.Float32BufferAttribute(this.uv,2));g.setAttribute('color',new T.Float32BufferAttribute(this.col,3));g.setIndex(this.ix);g.computeVertexNormals();g.computeBoundingBox();g.name=name;return g;}
}

export function createBroadleaf193(seed=19371,blossom=false){
 const random=rng(seed),R=(a,b)=>a+(b-a)*random(),wood=new Mesh193(),leaves=new Mesh193(),h=6,leader=[[0,-.025,0],[.08,1.3,.05],[-.12,2.7,.09],[.30,3.9,.15],[.20,4.9,.08],[.45,5.8,.14]];
 wood.tube(leader,.14,.012,9,22,seed);const curve=new T.CatmullRomCurve3(leader.map(V));
 for(let k=0;k<22;k++){
  const t=.28+k*.028,origin=curve.getPoint(t),az=k*2.399+R(-.5,.5),reach=R(1.0,2.55)*(1-t*.28),end=origin.clone().add(V([Math.cos(az)*reach,R(.40,1.10),Math.sin(az)*reach]));
  const mainPoints=[origin.toArray(),origin.clone().lerp(end,.5).add(V([0,.20,0])).toArray(),end.toArray()],mainCurve=new T.CatmullRomCurve3(mainPoints.map(V));wood.tube(mainPoints,.045*(1-t)+.012,.0035,5,7,seed+k);
  for(let j=0;j<8;j++){
   const u=.15+j*.108,root=mainCurve.getPointAt(u),a=az+(j%2?1:-1)*R(.45,1.10),tip=root.clone().add(V([Math.cos(a)*R(.35,.9),R(.12,.55),Math.sin(a)*R(.35,.9)]));wood.tube([root.toArray(),tip.toArray()],.007,.0012,4,3,seed+j);
   for(let n=0;n<14;n++){
    const v=.08+n*.063,base=root.clone().lerp(tip,v),b=a+(n%2?1:-1)*R(.65,1.65),direction=V([Math.cos(b),R(-.32,.55),Math.sin(b)]),length=blossom?R(.055,.085):R(.12,.19);
    leaves.leaf(base,direction,length,length*(blossom?.50:.31),R(.74,1.17));
    if(blossom){leaves.leaf(base,direction.clone().applyAxisAngle(UP,1.8),length*.9,length*.38,R(.85,1.12));leaves.leaf(base,direction.clone().applyAxisAngle(UP,-1.8),length*.9,length*.38,R(.85,1.12));}
   }
  }
 }
 return{wood:wood.geometry('natural193-connected-garden-wood-'+seed),foliage:leaves.geometry('natural193-attached-'+(blossom?'cupped-blossom':'broadleaf')+'-'+seed)};
}

// Small evergreen bushes have real rooted stems and dense, attached cupped
// leaves. The sparse scanned nettle-like shrub is retained only as an accent.
export function createEvergreenBush193(seed){
 const random=rng(seed),R=(a,b)=>a+(b-a)*random(),wood=new Mesh193(),leaves=new Mesh193();
 for(let k=0;k<9;k++){
  const a=k*2.4+R(-.4,.4),reach=R(.26,.45),root=V([Math.cos(a)*.025,-.035,Math.sin(a)*.025]),end=V([Math.cos(a)*reach,R(.65,1.0),Math.sin(a)*reach]),mid=root.clone().lerp(end,.52).add(V([0,.07,0])),curve=new T.CatmullRomCurve3([root,mid,end]);wood.tube([root.toArray(),mid.toArray(),end.toArray()],.010,.002,5,7,seed+k);
  for(let j=0;j<7;j++){
   const t=.20+j*.105,base=curve.getPointAt(t),az=a+(j%2?1:-1)*R(.7,1.65),tip=base.clone().add(V([Math.cos(az)*R(.20,.37),R(.04,.18),Math.sin(az)*R(.20,.37)]));wood.tube([base.toArray(),tip.toArray()],.0035,.0006,4,3,seed+j);
   for(let n=0;n<9;n++)for(const side of[-1,1]){const anchor=base.clone().lerp(tip,.12+n*.10),b=az+side*R(.7,1.6),length=R(.085,.14);leaves.leaf(anchor,V([Math.cos(b),R(-.22,.35),Math.sin(b)]),length,length*.37,R(.75,1.18));}
  }
 }
 return{wood:wood.geometry('natural193-real-rooted-bush-wood-'+seed),foliage:leaves.geometry('natural193-real-attached-evergreen-leaves-'+seed)};
}

export function createFern193(seed){
 const random=rng(seed),R=(a,b)=>a+(b-a)*random(),stems=new Mesh193(),leaves=new Mesh193();
 for(let k=0;k<13;k++){
  const a=k*2.4+R(-.35,.35),reach=R(.25,.55),end=V([Math.cos(a)*reach,R(.20,.43),Math.sin(a)*reach]),mid=V([end.x*.44,R(.38,.59),end.z*.44]),root=V([0,-.02,0]),curve=new T.CatmullRomCurve3([root,mid,end]);stems.tube([root.toArray(),mid.toArray(),end.toArray()],.0035,.0007,4,9,seed+k);
  for(let j=0;j<12;j++)for(const side of[-1,1]){const t=.14+j*.071,base=curve.getPointAt(t),width=.10*Math.sin(Math.PI*t)*R(.75,1.20),az=a+side*1.03;leaves.leaf(base,V([Math.cos(az),.04,Math.sin(az)]),width,width*.19,R(.76,1.13));}
 }
 return{wood:stems.geometry('natural193-fern-real-curved-stems-'+seed),foliage:leaves.geometry('natural193-fern-attached-pinnae-'+seed)};
}

// Rooted young evergreen understory beside the actual bridge head. All
// stems and blades grow forward of the pier envelope and below the walk.
// A complete self-supporting woody plant, never a leafy card or wall plane.
export function createBankCreeper193(seed){
 const random=rng(seed),R=(a,b)=>a+(b-a)*random(),wood=new Mesh193(),leaves=new Mesh193(),leader=[[0,-.025,0],[.03,.25,-.10],[-.05,.62,-.16],[.04,1.02,-.16],[-.02,1.48,-.14]],curve=new T.CatmullRomCurve3(leader.map(V));wood.tube(leader,.018,.0025,6,12,seed);
 for(let k=0;k<14;k++){
  const t=.10+k*.058,base=curve.getPointAt(t),side=k%2?1:-1,end=base.clone().add(V([side*R(.28,.58),R(.04,.18),R(.09,.23)]));wood.tube([base.toArray(),end.toArray()],.006,.0008,4,5,seed+k);
  for(let j=0;j<5;j++){
   const root=base.clone().lerp(end,.15+j*.16),tip=root.clone().add(V([side*R(.03,.15),R(.04,.15),R(.06,.18)]));wood.tube([root.toArray(),tip.toArray()],.0025,.0005,3,2,seed+j);
   for(let n=0;n<7;n++)for(const sign of[-1,1]){const anchor=root.clone().lerp(tip,.12+n*.13),dir=V([sign*R(.55,.85),R(-.12,.32),R(.45,.85)]),length=R(.105,.155);leaves.leaf(anchor,dir,length,length*.36,R(.80,1.14));}
  }
 }
 return{wood:wood.geometry('natural193-rooted-wall-creeper-wood-'+seed),foliage:leaves.geometry('natural193-wall-creeper-attached-leaves-'+seed)};
}

// A mature, volumetric evergreen for the stream bank: several bent stems,
// laterals, tertiary short shoots and paired textured leaves. Optical crown
// mass comes from living anatomy and overlapping blades, not a solid hull.
export function createMatureBankShrub193(seed){
 const random=rng(seed),R=(a,b)=>a+(b-a)*random(),wood=new Mesh193(),leaves=new Mesh193();
 for(let k=0;k<9;k++){
  const a=k*2.39996+R(-.35,.35),root=V([Math.cos(a)*.035,-.035,Math.sin(a)*.035]),reach=R(.35,.65),end=V([Math.cos(a)*reach,R(.76,1.12),Math.sin(a)*reach]),mid=root.clone().lerp(end,.52).add(V([0,.13,0])),main=new T.CatmullRomCurve3([root,mid,end]);wood.tube([root.toArray(),mid.toArray(),end.toArray()],.016,.002,5,8,seed+k);
  for(let j=0;j<6;j++){
   const t=.30+j*.112,base=main.getPointAt(t),az=a+(j%2?1:-1)*R(.8,1.85),tip=base.clone().add(V([Math.cos(az)*R(.22,.42),R(.07,.25),Math.sin(az)*R(.22,.42)]));wood.tube([base.toArray(),tip.toArray()],.006,.001,4,4,seed+j);
   for(let q=0;q<5;q++){
    const start=base.clone().lerp(tip,.18+q*.17),b=az+(q%2?1:-1)*R(.5,1.5),finish=start.clone().add(V([Math.cos(b)*R(.13,.24),R(.04,.18),Math.sin(b)*R(.13,.24)]));wood.tube([start.toArray(),finish.toArray()],.0027,.0005,3,2,seed+q);
    for(let n=0;n<7;n++)for(const side of[-1,1]){const p=start.clone().lerp(finish,.10+n*.13),c=b+side*R(.65,1.4),length=R(.10,.16);leaves.leaf(p,V([Math.cos(c),R(-.24,.45),Math.sin(c)]),length,length*.37,R(.80,1.15));}
   }
  }
 }
 return{wood:wood.geometry('natural193-mature-bank-shrub-wood-'+seed),foliage:leaves.geometry('natural193-mature-bank-shrub-real-cupped-leaves-'+seed)};
}

function groundMaterial193(){
 const ma=new T.MeshStandardMaterial({name:'natural193-eroded-soil-mineral-moss',color:'#67634b',roughness:.98});
 ma.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vNatural193;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvNatural193=(modelMatrix*vec4(transformed,1.)).xyz;');
  shader.fragmentShader='varying vec3 vNatural193;\n'+detailNoise+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float coarse=sdFbm(vNatural193*.90),soilPatch=sdFbm(vNatural193*4.7),fine=sdFiltered(vNatural193*180.);
   float slope=1.-abs(normalize(cross(dFdx(vNatural193),dFdy(vNatural193))).y);
   float moss=smoothstep(.38,.67,coarse+.18*soilPatch-.38*slope);
   vec3 loam=mix(vec3(.019,.014,.009),vec3(.060,.047,.029),.55*soilPatch+.45*fine);
   vec3 green=mix(vec3(.010,.021,.006),vec3(.044,.064,.015),.6*soilPatch+.4*fine);
   diffuseColor.rgb=mix(loam,green,moss)*( .83+.30*fine );`);
 };
 ma.customProgramCacheKey=()=> 'natural193-soil-mineral-moss-r01';return ma;
}

export function buildNatural193({emit,scene,scannedStones,shrubs,groundcover,pines,hillHeight,forestHeight,reserved,channel,stairEmbankment,layout,mineralMaterial,ecologyAnchors207,bearingSurfaces207=[]}){
 const random=rng(193091),R=(a,b)=>a+(b-a)*random(),approach207=createApproachPlan207(layout),info={revision:'scene10-rain210-rebuilt-banks-and-living-crowns-r10',visualAccepted:false,roots:[],rocks:[],forest:[],gardenTreePoses207:[],counts:{},licenses:[{asset:'Pine Sapling Small',license:'CC0-1.0'},{asset:'Shrub 02',license:'CC0-1.0'},{asset:'Periwinkle Plant',license:'CC0-1.0'},{asset:'Rock Moss Set 01',license:'CC0-1.0'}]};
 const soil=groundMaterial193(),wood=pines.trunkMaterial.clone();wood.name='natural193-rain-dark-connected-bark';wood.vertexColors=true;wood.color.set('#7f8171');wood.roughness=.94;
 const leafSource=groundcover.leaves[0].material,leaf=new T.MeshPhysicalMaterial({name:'natural193-cupped-attached-garden-leaves-with-CC0-veins',map:leafSource.map,normalMap:leafSource.normalMap,normalScale:new T.Vector2(.42,.42),roughnessMap:leafSource.roughnessMap,color:'#bac7a7',vertexColors:true,roughness:.78,clearcoat:.23,clearcoatRoughness:.24,envMapIntensity:.30,side:T.DoubleSide});
 for(const v of groundcover.variants)for(const p of v.parts){p.material.roughness=.75;p.material.clearcoat=.28;p.material.clearcoatRoughness=.20;p.material.envMapIntensity=.30;}
 const pineInterior=new T.MeshStandardMaterial({name:'natural193-closed-retained-ribbed-pine-fascicles',color:'#3d562d',roughness:.92,vertexColors:true}),pineTips=new T.MeshPhysicalMaterial({name:'natural193-paired-pine-needles',color:'#708449',roughness:.79,clearcoat:.04,clearcoatRoughness:.48,vertexColors:true,side:T.DoubleSide});
 const evergreenBushes=Array.from({length:4},(_,i)=>createEvergreenBush193(193615+i*83));
 const blossom=new T.MeshStandardMaterial({name:'natural193-small-cupped-blossoms',color:'#bd8995',vertexColors:true,roughness:.9,side:T.DoubleSide});
 const wetStones=scannedStones.variants.map(s=>{const ma=s.wet.clone();ma.name='natural193-porous-wet-mineral';ma.color.set('#9b9e8b');ma.roughness=.83;ma.clearcoat=.12;ma.clearcoatRoughness=.32;ma.envMapIntensity=.5;ma.normalScale.set(.82,.82);return ma;});
 const rawHeight=(x,z)=>{
  const base=Math.max(hillHeight(x,z),forestHeight(x,z)),n=fbm(x*.30,z*.30),rough=(fbm(x*.95+13,z*.95-4)-.5)*.30;
  const slope=T.MathUtils.clamp((Math.abs(hillHeight(x+.35,z)-hillHeight(x-.35,z))+Math.abs(hillHeight(x,z+.35)-hillHeight(x,z-.35)))*1.3,0,1);
  const gullyGate=smooth(z,-20,-17)*(1-smooth(z,-9,-6))*(1-smooth(Math.abs(x-(-2.5+.132*(z+3))),1.55,2.2));
  const protectedWalk=1-gullyGate,runoff=(Math.exp(-(((x+9+.55*Math.sin(z*.44))/.68)**2))+.6*Math.exp(-(((x+12+.32*Math.sin(z*.61))/.84)**2)))*.55*smooth(z,-21,-16)*(1-smooth(z,-9,-6))*protectedWalk;
  let y=base-.22*(1-smooth(base,.15,.60))+(n-.5)*(.16+.34*smooth(-z,18,40))+rough*(.22+.65*slope)-runoff;
  const near=smooth(z,-18,-12)*(1-smooth(z,5,7)),axis=2.5+.55*Math.sin((z+5)*.7),distance=Math.abs(x-axis)-(.86+.12*Math.sin(z*1.9));
  const leftCentre=-4.75+.23*Math.sin(z*.63),rightCentre=z>-2?5.15+.18*Math.sin(z*.7):6.0+.32*Math.sin(z*.39),left=1-smooth(Math.abs(x-leftCentre),.40,1.15),right=1-smooth(Math.abs(x-rightCentre),.55,1.40),finger=(1-smooth(Math.abs(x-(.25+.20*Math.sin(z*.7))),.38,.90))*smooth(z,-9,-7.8)*(1-smooth(z,-3.4,-2.4)),outer=Math.max(smooth(-x,6.8,8.0),smooth(x,9.3,10.6));
  const shore=Math.max(left,right,finger,outer),bank=-.22+shore*(.19+.08*fbm(x*.8+4,z*.8));
  y=Math.max(y,bank*near-.22*(1-near));
  if(stairEmbankment.ownedBy207&&z>-16&&!pondContains207(x,z)){
   const shoreDistance=x<-9||x>13?1:pondShoreDistance207(x,z),rise=smooth(shoreDistance,.08,.70);
   y=Math.max(y,T.MathUtils.lerp(-.18,.08+.07*fbm(x*.8+19,z*.8),rise));
  }
  y=towerBenchHeight210(x,z,y);
  const coherentBed=bankBedHeight210(x,z);if(coherentBed!==null)y=Math.max(y,coherentBed);
  const nearIsland=nearIslandHeight207(x,z,approach207),hallShore=hallShoreHeight207(x,z,layout);
  if(nearIsland!==null)y=Math.max(y,nearIsland);
  if(hallShore!==null)y=Math.max(y,hallShore);
  if(channel(x,z))y=-.20;
  if(reserved(x,z)){
   const bed207=z< -2.2?nearRouteGround207(x,z,approach207):null;if(bed207!==null)return bed207;
   if(z< -7.65&&z>=-13&&Math.abs(x-(-2.5+.132*(z+3)))<1.18)return towerBenchHeight210(x,z,hillHeight(x,z))-.025;
   return -.22;
  }
  return y;
 };
 const x0=-58,z0=-86,step=.25,nx=464,nz=424,positions=[],uv=[],indices=[],heights=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=x0+i*step,z=z0+j*step,h=rawHeight(x,z);positions.push(x,h,z);heights.push(h);uv.push(x*.7,z*.7);}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
 const terrain=new T.BufferGeometry();terrain.setAttribute('position',new T.Float32BufferAttribute(positions,3));terrain.setAttribute('uv',new T.Float32BufferAttribute(uv,2));terrain.setIndex(indices);terrain.computeVertexNormals();terrain.name='natural193-continuous-erosion-and-creek-bed';
 const soilIndices=[],mineralIndices=[],a193=new T.Vector3(),b193=new T.Vector3(),c193=new T.Vector3();
 for(let k=0;k<indices.length;k+=3){const ids=indices.slice(k,k+3);a193.fromArray(positions,ids[0]*3);b193.fromArray(positions,ids[1]*3);c193.fromArray(positions,ids[2]*3);const centre=a193.clone().add(b193).add(c193).multiplyScalar(1/3),normal=b193.clone().sub(a193).cross(c193.clone().sub(a193)).normalize(),steep=1-Math.abs(normal.y),exposed=centre.y>.40&&centre.z>-29&&centre.z<-6&&centre.x<-2.5&&steep>.12&&fbm(centre.x*.83+17,centre.z*.83)>.47;(exposed?mineralIndices:soilIndices).push(...ids);}
 terrain.setIndex(soilIndices);emit(terrain,soil);
 const mineral=mineralMaterial.clone();mineral.name='natural193-exposed-connected-mineral-strata';mineral.color.set('#8e9584');mineral.roughness=.9;if(mineral.normalScale)mineral.normalScale.set(.75,.75);const exposed=terrain.clone();exposed.setIndex(mineralIndices);exposed.name='natural193-actual-connected-eroded-mineral-faces';emit(exposed,mineral);
 // A broken mineral bank replaces the smooth exposed clay wedge. The upper
 // bearing strip remains intact under the already solid granite stair.
 const supportPlan=createBridgeHallStairPlan125(),fracturedBank=stairEmbankment.geometry.clone(),bp=fracturedBank.attributes.position;
 for(let i=0;i<bp.count&&!stairEmbankment.ownedBy207;i++){
  const x=bp.getX(i),y=bp.getY(i),z=bp.getZ(i);if(y<=-.12)continue;
  const dx=x-supportPlan.bridgeEnd[0],dz=z-supportPlan.bridgeEnd[2],u=dx*supportPlan.unit[0]+dz*supportPlan.unit[1],v=-dx*supportPlan.unit[1]+dz*supportPlan.unit[0],openUnderLanding=(1-smooth(u,.20,1.02))*(1-smooth(Math.abs(v),2.0,3.15));
  if(openUnderLanding>0){bp.setY(i,T.MathUtils.lerp(y,-.13,openUnderLanding));continue;}
  if(reserved(x,z))continue;
  const seam=fbm(x*1.9+51,z*1.9-7),relief=(seam-.46)*.54+Math.sin(y*15+fbm(x*.7,z*.7)*5)*.065;
  bp.setY(i,Math.max(-.13,y+relief*smooth(y,-.12,.25)));
 }
 bp.needsUpdate=true;fracturedBank.computeVertexNormals();fracturedBank.name=stairEmbankment.ownedBy207?'207-narrow-stair-bearing-core':'natural193-connected-fractured-mineral-stair-bank';emit(fracturedBank,stairEmbankment.ownedBy207?'supportCore207':mineral);
 // Match the exact diagonal convention of the rendered indexed field.
 function heightAt(x,z){const fx=(x-x0)/step,fz=(z-z0)/step,i=Math.max(0,Math.min(nx-1,Math.floor(fx))),j=Math.max(0,Math.min(nz-1,Math.floor(fz))),u=T.MathUtils.clamp(fx-i,0,1),v=T.MathUtils.clamp(fz-j,0,1),a=j*(nx+1)+i,A=heights[a],B=heights[a+1],C=heights[a+nx+1],D=heights[a+nx+2];return u+v<=1?A+(B-A)*u+(C-A)*v:D+(C-D)*(1-u)+(B-D)*(1-v);}
 const bankMesh=new T.Mesh(fracturedBank,mineral);bankMesh.updateMatrixWorld(true);const ray=new T.Raycaster(),rockSurfaces=[],bearingBounds207=bearingSurfaces207.map(mesh=>({mesh,bounds:new T.Box3().setFromObject(mesh)}));
 const surfaceAt=(x,z,includeRocks=false)=>{let y=heightAt(x,z);ray.set(V([x,45,z]),V([0,-1,0]));const foots=bearingBounds207.filter(o=>x>=o.bounds.min.x&&x<=o.bounds.max.x&&z>=o.bounds.min.z&&z<=o.bounds.max.z).map(o=>o.mesh),hit=ray.intersectObjects(includeRocks?[bankMesh,...foots,...rockSurfaces]:[bankMesh,...foots],false)[0];if(hit&&hit.point.y>y)y=hit.point.y;return y;};
 const lamps=[[-2.8,-3,1.05],[-6,-2.7,.55],[-7.5,-6,.6],[-9,-10,.55],[-2,-7,.50],[4,-10,.55],[10,-1,.5]];
 function clear(x,z,r=.25){if(reserved(x,z)||channel(x,z))return false;for(const [xx,zz,rr]of lamps)if(Math.hypot(xx-x,zz-z)<rr+r)return false;for(const a of[0,Math.PI/2,Math.PI,Math.PI*1.5])if(reserved(x+Math.cos(a)*r,z+Math.sin(a)*r))return false;return true;}
 const rock=(x,z,size,variant=Math.floor(R(0,6)),root=null)=>{
  if(nearEcology210(x,z))return null;
  if(!clear(x,z,size*.60))return null;const scan=scannedStones.variants[variant],rotation=[R(-.14,.14),R(0,TAU),R(-.13,.13)],matrix=new T.Matrix4().makeRotationFromEuler(new T.Euler(...rotation)).scale(V([size,size,size])),p=scan.geometry.attributes.position,pt=new T.Vector3();let min=Infinity,max=-Infinity;
  for(let i=0;i<p.count;i++){pt.fromBufferAttribute(p,i).applyMatrix4(matrix);min=Math.min(min,pt.y);max=Math.max(max,pt.y);}
  const ground=root===null?surfaceAt(x,z):root,bottom=ground-size*R(.22,.38),y=bottom-min;emit(scan.geometry,wetStones[variant],x,y,z,size,size,size,rotation,R(.80,1.08));
  const mesh=new T.Mesh(scan.geometry,wetStones[variant]);mesh.position.set(x,y,z);mesh.scale.setScalar(size);mesh.rotation.set(...rotation);mesh.updateMatrixWorld(true);rockSurfaces.push(mesh);info.rocks.push({position:[x,y,z],size,variant,rotation,bottom,ground,top:y+max,burial:ground-bottom,uniformScale:true});return{mesh,top:y+max};
 };
 // Interlocking fragments follow the toe of the planted land and actual walk.
 for(let k=0;k<155;k++){const z=R(-16,5),x=R(-15,16);if(k%3===0&&z<-9)continue;const h=heightAt(x,z);if(h<-.04||h>5.7)continue;rock(x,z,R(.22,.65));}
 const chains=[[-4.45,3.4,-4.7,-3.4,16],[4.85,4.15,6.0,-3.9,19],[-1.25,-3.8,.65,-7.1,11],[3.9,-7.9,8.4,-9.5,14]];
 for(const [ax,az,bx,bz,n]of chains)for(let i=0;i<n;i++){const t=i/(n-1),x=T.MathUtils.lerp(ax,bx,t)+R(-.25,.25),z=T.MathUtils.lerp(az,bz,t)+R(-.20,.20);rock(x,z,R(.29,.65));}
 for(const [x,z,s,v]of[[4.92,4.12,.70,3],[4.63,3.35,.54,1],[5.51,3.64,.48,4],[-4.25,1.15,.66,2],[-4.65,.52,.52,0],[-.15,-4.35,.52,3],[.7,-5.9,.50,1],[5.1,-3.2,.63,4]])rock(x,z,s,v);
 // Root every whole licensed botanical on the actual highest supporting face.
 const plant=(x,z,h,type='shrub',onRocks=true)=>{
  if(nearEcology210(x,z))return false;
  if(!clear(x,z,h*(type==='shrub'?.58:.48)))return false;const y=surfaceAt(x,z,onRocks);if(y<-.075)return false;const variant=Math.floor(R(0,4)),yaw=R(0,TAU);
  if(type==='shrub'){
   const g=evergreenBushes[variant];emit(g.wood,wood,x,y-.018,z,h,h,h,yaw,R(.84,1.12));emit(g.foliage,leaf,x,y-.018,z,h,h,h,yaw,R(.88,1.14));
  }else{const model=groundcover.variants[variant%groundcover.variants.length];for(const part of model.parts)emit(part.geometry,part.material,x,y-.012,z,h,h,h,yaw,R(.84,1.12));}
  info.roots.push({position:[x,y,z],height:h,type,variant,yaw,uniformScale:true,contact:'Actual terrain triangle / stair embankment / transformed stone ray hit; root buried 12–18 mm'});return true;
 };
 for(let k=0;k<650;k++){
  const z=R(-26,4.8),x=R(-21,23),y=heightAt(x,z);if(y<-.02||x>13&&z>-10)continue;
  const cluster=fbm(x*.22+5,z*.22-2);if(cluster<.39)continue;plant(x,z,R(.35,1.15)*(z<-15?1.30:1),'shrub');
  if(k%3===0)for(let q=0;q<2;q++)plant(x+R(-.7,.7),z+R(-.7,.7),R(.19,.42),'groundcover');
 }
 for(const record of info.rocks){const[x,,z]=record.position;for(let q=0;q<2;q++)plant(x+R(-.35,.35)*record.size,z+R(-.35,.35)*record.size,R(.18,.40),'groundcover');if(random()<.36)plant(x+R(-.3,.3),z+R(-.3,.3),R(.34,.66),'shrub');}
 // Purposeful dense pockets on the former bare tower slope, rooted independently.
 for(let k=0;k<195;k++){const x=R(-17,-1.8),z=R(-21,-7.2);plant(x,z,R(.88,1.85),'shrub');if(k%3===0)rock(x+R(-.4,.4),z+R(-.4,.4),R(.30,.62));}
 // Woodland-floor leaves interrupt the remaining bare soil between large
 // bushes. These are whole original CC0 three-dimensional plants, not mats.
 for(let k=0;k<1420;k++){
  const x=R(-17,-3.6),z=R(-22,-7.2);if(fbm(x*.72+3,z*.72)<.36)continue;plant(x,z,R(.28,.49),'groundcover',false);
 }
 // Small fern groups use the same true supporting face as each adjoining rock.
 const ferns=Array.from({length:3},(_,i)=>createFern193(193827+i*37));
 for(let k=0;k<105;k++){
  const ref=info.rocks[k%info.rocks.length],x=ref.position[0]+R(-.55,.55),z=ref.position[2]+R(-.55,.55),size=R(.7,1.35);if(!clear(x,z,size*.31))continue;const y=surfaceAt(x,z,true);if(y<-.06)continue;const g=ferns[k%3],yaw=R(0,TAU);emit(g.wood,wood,x,y-.015,z,size,size,size,yaw);emit(g.foliage,leaf,x,y-.015,z,size,size,size,yaw);info.roots.push({position:[x,y,z],height:size*.59,type:'curved-frond-fern',variant:k%3,yaw,uniformScale:true,contact:'Actual highest transformed rock/embankment/terrain triangle'});
 }
 // The physically backed stair is dressed with broken, buried mineral pieces.
 for(const sign of[-1,1])for(let row=0;row<3;row++)for(let j=0;j<18;j++){const p=stairEmbankment.at(-1.2+j*.38,sign*([2.08,2.66,3.16][row]+R(-.09,.10)));rock(p[0],p[2],R(.35,.60),j%6);if(j%3===0)plant(p[0]+R(-.2,.2),p[2]+R(-.2,.2),R(.28,.52),row===2?'shrub':'groundcover');}
 for(let k=0;k<140;k++){const p=stairEmbankment.at(R(-1.1,5.3),(random()<.5?-1:1)*R(1.7,3.25));plant(p[0],p[2],R(.25,.51),'groundcover');}
 // The diagnostic rays identified both the mineral slope and the protected
 // landing's front face. Rock toes and rooted creepers occupy only the space
 // in front of that face. Their exact mesh maximum stays below deck level.
 const landing=createBridgeHallStairPlan125().turningLanding,wallZ=landing.center[2]+landing.halfWidth,bankShrubs=Array.from({length:3},(_,i)=>createMatureBankShrub193(193991+i*53));
 info.bridgeHeadGarden193=[];
 for(let k=0;k<(stairEmbankment.ownedBy207?0:5);k++){
  const x=landing.center[0]-1.38+k*.68,variant=[0,4,2,5,1][k],size=.59+.04*(k%2),scan=scannedStones.variants[variant],yaw=.37+k*.82,matrix=new T.Matrix4().makeRotationY(yaw).scale(V([size,size,size])),p=scan.geometry.attributes.position,v=new T.Vector3();let minY=Infinity,minZ=Infinity,maxY=-Infinity;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);minY=Math.min(minY,v.y);minZ=Math.min(minZ,v.z);maxY=Math.max(maxY,v.y);}
  const plannedBush=bankShrubs[k%3];plannedBush.foliage.computeBoundingBox();plannedBush.wood.computeBoundingBox();const plannedBounds=plannedBush.foliage.boundingBox.clone().union(plannedBush.wood.boundingBox),plannedRootZ=wallZ+.055-plannedBounds.min.z*1.02;
  const z=Math.max(plannedRootZ,wallZ+.035-minZ),bottom=heightAt(x,z)-.075,y=bottom-minY;emit(scan.geometry,wetStones[variant],x,y,z,size,size,size,yaw,.94);
  const mesh=new T.Mesh(scan.geometry,wetStones[variant]);mesh.position.set(x,y,z);mesh.scale.setScalar(size);mesh.rotation.y=yaw;mesh.updateMatrixWorld(true);rockSurfaces.push(mesh);
  const g=bankShrubs[k%3];g.foliage.computeBoundingBox();g.wood.computeBoundingBox();const bounds=g.foliage.boundingBox.clone().union(g.wood.boundingBox),scale=1.02,rootZ=wallZ+.055-bounds.min.z*scale,rootY=surfaceAt(x,rootZ,true),heightLimit=landing.top-.24-rootY,finalScale=Math.min(scale,Math.max(.45,heightLimit/bounds.max.y)),finalRootZ=wallZ+.055-bounds.min.z*finalScale,finalRootY=surfaceAt(x,finalRootZ,true);
  emit(g.wood,wood,x,finalRootY-.018,finalRootZ,finalScale,finalScale,finalScale);emit(g.foliage,leaf,x,finalRootY-.018,finalRootZ,finalScale,finalScale,finalScale);
  const minLeafZ=bounds.min.z*finalScale+finalRootZ,maxPlantY=bounds.max.y*finalScale+finalRootY-.018;
  info.bridgeHeadGarden193.push({root:[x,finalRootY,finalRootZ],scale:finalScale,stoneBottom:bottom,stoneTop:y+maxY,wallFrontZ:wallZ,minimumPlantZ:minLeafZ,faceClearance:minLeafZ-wallZ,plantTop:maxPlantY,walkTop:landing.top,verticalWalkClearance:landing.top-maxPlantY,source:'Authored mature multi-stem evergreen on positive-uniform original CC0 toe rock; actual complete leaves, all vertices forward of protected pier envelope and below its walk'});
 }
 // A few whole licensed wild shrubs remain in the sheltered rear understory.
 for(let k=0;k<18;k++){const x=R(-22,21),z=R(-34,-24),y=heightAt(x,z),s=R(.40,.72),v=k%4;for(const part of shrubs.variants[v].parts)emit(part.geometry,part.material,x,y-.018,z,s,s,s,R(0,TAU));}
 // Local authored pine158 branch studies supply coherent mature crowns. The
 // full positive-uniform tree growth transform retains their needle packets;
 // no other scene module, backdrop, crown hull or depth card is loaded.
 const rainBanks210=buildRainBanks210({emit,scannedStones,heightAt,reserved,wood,leaf,groundcover,makeShrub:createMatureBankShrub193,makeFern:createFern193,layout});info.rainBanks210=rainBanks210.info;info.roots.push(...rainBanks210.info.roots);info.rocks.push(...rainBanks210.info.rocks);
 const pineShoots=Array.from({length:12},(_,i)=>createPineShoot158(158701+i*73)),conifers=[2,5,6].map((i,k)=>buildPineGeometry158({...HERO_PINE_ORIGINS[i],id:'natural193-mature-pine-'+k,x:0,z:0,h:7.8,seed:193571+k*151}));
 const heldMature207=ecologyAnchors207?.forest.filter(x=>x.growthScale),heldYoung207=ecologyAnchors207?.forest.filter(x=>!x.growthScale);let heldMatureIndex207=0;
 const placeConifer=(x,z,h,variant,yaw)=>{
  if(heldMature207?.[heldMatureIndex207]){const a=heldMature207[heldMatureIndex207];[x,,z]=a.root;h=a.height;variant=a.variant;yaw=a.yaw;}heldMatureIndex207++;
  const y=heightAt(x,z),g=conifers[variant%3],s=h/7.8,q=new T.Quaternion().setFromAxisAngle(UP,yaw),root=V([x,y-.07,z]);
  emit(g.bark,wood,x,y-.07,z,s,s,s,yaw);emit(g.cuts,wood,x,y-.07,z,s,s,s,yaw);
  for(const item of g.shoots){const shoot=pineShoots[item.variant],p=V(item.p).multiplyScalar(s).applyQuaternion(q).add(root),local=new T.Quaternion().setFromEuler(new T.Euler(...item.rotation)),rotation=q.clone().multiply(local),scale=item.scale*s;
   emit(shoot.twig,wood,...p.toArray(),scale,scale,scale,rotation,item.tint);if(shoot.interior.attributes.position.count)emit(shoot.interior,pineInterior,...p.toArray(),scale,scale,scale,rotation,item.tint);emit(shoot.needle,pineTips,...p.toArray(),scale,scale,scale,rotation,item.tint);
  }
  info.forest.push({root:[x,y,z],height:h,variant,yaw,kind:'Continuous authored mature pine > bearing boughs > bent cushion spines > laterals > short twig shoots > individually closed retained needle ribs and paired needles',uniformScale:true,growthScale:s,terminalShoots:g.shoots.length,nominalSourceHeight:7.8});
 };
 // Unequal rows interleave in depth, so individual mature crowns overlap.
 for(let k=0;k<27;k++){const row=Math.floor(k/9),x=-28+(k%9)*6.6+R(-2.2,2.2),z=-36-row*10+R(-3,3);placeConifer(x,z,R(16.0,24),k%3,R(0,TAU));}
 for(const [x,z,h]of[[8.7,-43,27],[4.7,-44.7,23.4],[-.4,-44,20.6],[13.8,-49,25.0],[-6.2,-38.5,18.4]])placeConifer(x,z,h,Math.floor(R(0,3)),R(0,TAU));
 // Mature garden pines break the formerly bare tower slope into coherent
 // rooted crown layers while the historic walk remains open underneath.
 placeConifer(-10.0,-10.4,5.8,1,.30);placeConifer(-5.6,-10.8,3.8,2,-.40);
 // Real original CC0 young trees make the lower woodland transition.
 for(let k=0;k<22;k++){let x=R(-27,25),z=R(-41,-29),h=R(3.4,7.0),variant=k%3,yaw=R(0,TAU);if(heldYoung207?.[k]){const a=heldYoung207[k];[x,,z]=a.root;h=a.height;variant=a.variant;yaw=a.yaw;}const y=heightAt(x,z);for(const part of pines.variants[variant].parts)emit(part.geometry,part.material,x,y-.025,z,h,h,h,yaw,R(.88,1.08));info.forest.push({root:[x,y,z],height:h,variant,yaw,kind:'Whole source CC0 sapling, original geometry/UV/normal',uniformScale:true});}
 const gardenTrees=[[-13,-14,7.1,0],[-17,-23,9.6,1],[-5.7,-28,10.2,2],[19,-16,8.8,3],[19,-2,8.6,0],[-6.1,-8.6,5.1,1],[10.4,-4.8,7.7,2]];
 const broad=Array.from({length:4},(_,i)=>createBroadleaf193(19371+i*97));
 const heldGarden207=(geometry,x,z,yaw)=>ecologyAnchors207?.gardenTrees?.poses.find(p=>p.geometry===geometry&&p.position[0]===x&&p.position[2]===z)?.yaw??yaw;
 for(const [x,z,h,v]of gardenTrees){const y=heightAt(x,z),s=h/6,candidateYaw=R(0,TAU),g=broad[v],yaw=heldGarden207(g.wood.name,x,z,candidateYaw);emit(g.wood,wood,x,y-.03,z,s,s,s,yaw);emit(g.foliage,leaf,x,y-.03,z,s,s,s,yaw);info.gardenTreePoses207.push({geometry:g.wood.name,position:[x,y-.03,z],scale:[s,s,s],yaw});info.roots.push({position:[x,y,z],height:h,type:'connected-mature-garden-tree',contact:'Actual rendered triangle'});}
 const flowers=createBroadleaf193(193932,true);
 for(const [x,z,h]of[[-5.4,-13.9,4.5],[-.8,-13.8,4.0],[-11.2,-6.0,4.7],[1.0,-10.5,4.6]]){const y=heightAt(x,z),s=h/6,candidateYaw=R(0,TAU),yaw=heldGarden207(flowers.wood.name,x,z,candidateYaw);emit(flowers.wood,wood,x,y-.025,z,s,s,s,yaw);emit(flowers.foliage,blossom,x,y-.025,z,s,s,s,yaw);info.gardenTreePoses207.push({geometry:flowers.wood.name,position:[x,y-.025,z],scale:[s,s,s],yaw});info.roots.push({position:[x,y,z],height:h,type:'connected-small-blossom-tree',contact:'Actual rendered triangle'});}
 info.counts={terrainVertices:positions.length/3,terrainTriangles:indices.length/3,mineralFaceTriangles:mineralIndices.length/3,stones:info.rocks.length,rootedPlants:info.roots.length,forestTrees:info.forest.length,coniferVariants:conifers.map(g=>g.stats),evergreenBushVariants:evergreenBushes.map(g=>({woodTriangles:g.wood.index.count/3,leafTriangles:g.foliage.index.count/3}))};
 info.heightField={bounds:[x0,z0,x0+nx*step,z0+nz*step],step,contact:'Exact barycentric rendered grid triangle, not the analytic approximation',creekWaterline:-.07,walkReserved:true,clearCirculation207:{insideHeight:-.22,insideHeightScope:'Foreground paving/curb/column/apron cells; raised island routes separately use their actual local top minus .13m',raisedRouteBedOffset:-.13,slabSideBuffer:.45,rightCurbBuffer:.65,verandaHalfExtents:[1.22,1.16],apronBounds:[.55,10.95,5.05,20.45],shoreTransition:[.08,.70],purpose:'All triangle vertices adjoining the actual foreground paving, curb, column receiver and returning-rail apron stay below their physical bottoms; outside creek rise blends over .62m.'}};
 info.underLandingWater193={scope:'207 retires the broad193 mineral cone and wall-hiding shrubs. The current hall flight uses real closed treads, sloping bed, stringers, crossheads and bed-seated pads; only a narrow submerged core remains.',waterBed:-.13,submergedCoreWidth:stairEmbankment.info.width};
 info.preservation='R10 explicit reconstruction: wrong near slopes, scattered understory and lantern profile/plinth rebuilt. Old forest anchors are implementation history, not user constraints; tree roots follow the actual revised terrain. Camera, foreground paving/rain inputs and upper hall/tower mass remain unchanged in this candidate.';
 info.retiredNaturalAssemblies193=['Old mature cedar crown stacks141','Old generic broadleaf/pink shrubs and fern strokes','Old smooth terrain141/142','Old isolated island/near-bank/hall-shore/solmax piles141/142'];
 info.materials={soil:'Rain-dark loam/mineral and moss patches respond to actual slope and world scale; no photograph',wetStone:'CC0 scan PBR, porous dielectric roughness .83 / clearcoat .12, no blanket scene grading',needles:'Opaque closed needle solids, roughness .86; branch-aligned actual geometry'};
 return{info,materials:[soil,mineral,wood,leaf,blossom,pineInterior,pineTips,...wetStones,...rainBanks210.materials,...groundcover.variants.flatMap(v=>v.parts.map(p=>p.material))],heightAt};
}
