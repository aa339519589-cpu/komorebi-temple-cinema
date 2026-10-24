import * as T from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createPavingWetMask,createWetStoneGrain,clipPavingAtDrain} from './paving-mask.js';
import {createWornFlagstone} from './worn-flagstone.js';
import {nearRainStoneProfiles,createNearRainFlagstone,createNearJointBed} from './near-rain-stones.js';
import {createNearSurfaceReflectionMask,installNearSurfacePlaneExclusion,installNearSurfaceWaterResponse} from './near-surface-reflection.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {createRestorationArchitecture} from './architecture.js';
import {createReference4MaterialSet} from './materials.js';
import {granite} from './natural-forms.js';
import {createWeatheredBoulderGeometry,createBoulderMossGeometry} from './weathered-boulder.js';
import {emitRestoredBuddha} from './buddha.js';
import {installSurfaceDetail,detailNoise} from './surface-detail.js';
import {loadScannedGardenStones} from './scanned-garden-stones.js';
import {loadLicensedPine141} from './licensed-pine141.js';
import {buildNatural193,loadShrubs193} from './natural193.js';
import {loadLicensedGroundcover142} from './licensed-groundcover142.js';
import {buildNearBankOutcrop} from './near-bank-outcrop.js';
import {createDollyPath} from './dolly-path.js';
import {createOptics} from './optics.js';
import {createWaterFilmRipples135} from './water-film-ripples135.js';
import {createPalmateMapleLeaf136,buildMatureMapleCanopy136} from './maple-canopy136.js';
import {buildHall132,createHall132Palette,HALL132_REVISION} from './hall-front132.js';
import {createStairEmbankment137} from './stair-embankment137.js';
import {buildStoneLantern} from './stone-lantern.js';
import {buildRainFrameMaple142} from './rain-frame-maple142.js';
import {createVerandaFootstone142} from './solid-receiver142.js';
import {loadLicensedCloud183} from './licensed-cloud183.js';
import {installSupportMaterials207,createApproachPlan207,routeReserved207,buildSupportRoute207,createNarrowStairCore207,createPond207,createPondReflectionFootprint207,buildPondEdges207,buildFoundationRocks207} from './support-route207.js';
import {buildTowerMass183} from './tower-mass183.js';
import {towerBenchHeight210} from './rain-banks210.js';
import {scene10Layout125 as L,bridgePoint125,bridgeToWorld125,hallToWorld125,createBridgeHallStairPlan125,rightPathEdge125,leftPathEdge125} from './layout125.js';
const query=new URLSearchParams(location.search),W=Math.min(1800,+(query.get('w')||768)),H=Math.min(1800,+(query.get('h')||768));
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setPixelRatio(1);renderer.setSize(W,H);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.info.autoReset=false;document.body.appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#aeb9be');scene.fog=new T.FogExp2('#a3afb8',.0110);
const camera=new T.PerspectiveCamera(65,W/H,.08,220),fixed=L.camera;
const optics=createOptics(renderer,W,H,camera,{fstop:4.8});
let seed=1037;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296},R=(a,b)=>a+(b-a)*rand(),V=a=>new T.Vector3(...a);
const set=createReference4MaterialSet(T),m=set.mats;
const scannedStones=await loadScannedGardenStones();
const licensedPines141=await loadLicensedPine141();
const licensedGroundcover142=await loadLicensedGroundcover142();
const carvedCloud183=await loadLicensedCloud183();
const ecologyAnchors207=await (await fetch(new URL('../ecology193-held207.json',import.meta.url))).json();
const shrubs193=await loadShrubs193();
const graniteLoader=new T.TextureLoader(),graniteNames=['diff','nor_gl','rough'];
const graniteMaps=await Promise.all(graniteNames.map(k=>graniteLoader.loadAsync('/reconstructions/scene-04/assets/granite-tile-04/granite-face-'+k+'.png')));
for(const [i,t]of graniteMaps.entries()){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3.151,3.151);t.anisotropy=8;if(i===0)t.colorSpace=T.SRGBColorSpace;}
m.red.color.set('#813a2a');m.red.roughness=.61;m.cedar.color.set('#422b20');m.cedar.roughness=.78;m.darkwood.color.set('#211a16');m.slate.color.set('#34434c');m.slate.roughness=.30;m.tileEdge.color.set('#49565b');m.tileEdge.roughness=.48;m.gold.color.set('#bd9146');m.gold.roughness=.23;m.stone.color.set('#50554b');m.granite.color.set('#62665b');
m.buddha=m.gold.clone();m.buddha.roughness=.30;m.buddha.color.set('#bf9952');m.plaster.color.set('#97886a');m.paper.color.set('#705637');m.paper.emissive=new T.Color('#ce8435');m.paper.emissiveIntensity=.32;
for(let i=0;i<5;i++){m['window'+i]=m.paper.clone();m['window'+i].color.set(['#342b20','#4f412d','#6c5433','#956838','#c18b44'][i]);m['window'+i].emissiveIntensity=[.012,.05,.14,.32,.75][i];}
m.lanternPaper=m.paper.clone();m.lanternPaper.color.set('#c8a86f');m.lanternPaper.emissive.set('#ffb346');m.lanternPaper.emissiveIntensity=2.2;m.stonePaper=m.lanternPaper.clone();m.stonePaper.emissiveIntensity=1.05;m.stonePaper.emissive.set('#ffad35');
m.pagodaPaper=m.paper.clone();m.pagodaPaper.color.set('#806344');m.pagodaPaper.emissive.set('#ffac48');m.pagodaPaper.emissiveIntensity=1.35;
for(let i=0;i<5;i++){m['pagodaWindow'+i]=m.pagodaPaper.clone();m['pagodaWindow'+i].name='pagoda141-warm-room-'+i;m['pagodaWindow'+i].color.set(['#3e2a1b','#72512d','#99703f','#b47f3b','#c19047'][i]);m['pagodaWindow'+i].emissiveIntensity=[.08,.20,.50,.95,1.40][i];}
m.moss=new T.MeshStandardMaterial({color:'#29391e',roughness:.86});m.leaf=new T.MeshPhysicalMaterial({color:'#354a28',roughness:.62,clearcoat:.23,clearcoatRoughness:.20,side:T.DoubleSide});m.maple=new T.MeshStandardMaterial({color:'#a03224',roughness:.48,side:T.DoubleSide});m.pink=new T.MeshStandardMaterial({color:'#bc7c8b',roughness:.82,side:T.DoubleSide});m.pink.emissive=new T.Color('#2d1018');m.pink.emissiveIntensity=.06;m.black.roughness=.25;m.carvedStone=new T.MeshStandardMaterial({color:'#7b7b6d',roughness:.76,bumpMap:m.granite.bumpMap,bumpScale:.012});installSurfaceDetail(m.carvedStone,'stone');m.leaf.emissive=new T.Color('#122108');m.leaf.emissiveIntensity=.025;m.maple.emissive=new T.Color('#320b05');m.maple.emissiveIntensity=.12;
m.mapleAutumn=['#79272b','#8f302b','#a34432','#b45239','#9a473d'].map((color,i)=>new T.MeshPhysicalMaterial({name:'autumn-maple136-'+i,color,roughness:.70,metalness:0,clearcoat:.24,clearcoatRoughness:.28,side:T.DoubleSide}));
m.mapleVeins=new T.MeshStandardMaterial({name:'autumn-maple136-raised-veins',color:'#bd7655',roughness:.78,side:T.DoubleSide});const mapleLeaf136=createPalmateMapleLeaf136();
m.mapleBark=new T.MeshStandardMaterial({name:'mature-maple136-rain-dark-bark',color:'#42291d',roughness:.84});installSurfaceDetail(m.mapleBark,'wood');

// Existing declared CC0 timber scans supply fine physical grain. Their low
// lacquer roughness is bounded for the painted, weathered roof carpentry.
const woodMaps141=await Promise.all(['normal-gl-2k.png','roughness-2k.jpg'].map(n=>graniteLoader.loadAsync('/reconstructions/scene-03/assets/timber/'+n)));
for(const t of woodMaps141){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;}
{const t=woodMaps141[1],canvas=document.createElement('canvas');canvas.width=t.image.width;canvas.height=t.image.height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(t.image,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height);for(let i=0;i<pixels.data.length;i+=4){const q=173+Math.round(pixels.data[i+1]*.30);pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=q;}c.putImageData(pixels,0,0);t.image=canvas;t.needsUpdate=true;}
for(const key of['red','cedar','darkwood','endwood']){m[key].normalMap=woodMaps141[0];m[key].normalScale.set(.055,.055);m[key].roughnessMap=woodMaps141[1];m[key].bumpMap=null;}
m.nearLacquer=new T.MeshPhysicalMaterial({color:'#7b2419',map:m.red.map,normalMap:woodMaps141[0],normalScale:new T.Vector2(.035,.035),roughness:.24,clearcoat:.95,clearcoatRoughness:.055});installSurfaceDetail(m.nearLacquer,'wood');
for(const key of['stone','granite','carvedStone']){m[key].map=graniteMaps[0];m[key].normalMap=graniteMaps[1];m[key].normalScale.set(.58,.58);m[key].roughnessMap=graniteMaps[2];m[key].roughness=.84;m[key].bumpMap=null;m[key].color.set('#b7b4ab');}
m.rainDrop=new T.MeshPhysicalMaterial({name:'actual-rain-droplets',color:'#e6eef0',roughness:.07,metalness:0,ior:1.333,transmission:.92,thickness:.002,clearcoat:1,clearcoatRoughness:.055});
for(const k of['cedar','red','darkwood','endwood'])installSurfaceDetail(m[k],'wood');for(const k of['stone','granite','slate'])installSurfaceDetail(m[k],'stone');installSurfaceDetail(m.moss,'moss');for(const k of['gold','oldgold'])installSurfaceDetail(m[k],'gold');
installSupportMaterials207(m);
const buckets=new Map(),stack=[new T.Matrix4()],cube=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(1,1,1,16),sphere=new T.SphereGeometry(1,14,10),geos=new Set([cube,cyl,sphere]);let suppressGeometry=false;
function emit(g,ma,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0,tint=1){if(suppressGeometry)return;if(typeof g==='string')g=({box:cube,sphere,cylinder:cyl})[g];if(!g?.isBufferGeometry)throw Error('Invalid emitted geometry');ma=typeof ma==='string'?m[ma]:ma;if(!ma)throw Error('Material missing');const e=Array.isArray(rot)?new T.Euler(...rot):new T.Euler(0,rot||0,0);const quaternion=rot?.isQuaternion?rot:new T.Quaternion().setFromEuler(e);const matrix=new T.Matrix4().compose(V([x,y,z]),quaternion,V([sx,sy,sz])).premultiply(stack.at(-1));if(!matrix.elements.every(Number.isFinite))throw Error('Nonfinite emitter transform');let b=buckets.get(g.uuid+ma.uuid);if(!b){b={g,ma,matrix:[],tint:[]};buckets.set(g.uuid+ma.uuid,b);}b.matrix.push(matrix);b.tint.push(tint);geos.add(g);}
const roundedBoxes=new Map();function box(x,y,z,w,h,d,ma='cedar',rot=0,tint=1){if(!(w>0&&h>0&&d>0))return;const r=Math.min(.012,w*.06,h*.06,d*.06),key=[w,h,d,r].map(v=>v.toFixed(4)).join(':');let g=roundedBoxes.get(key);if(!g){g=new RoundedBoxGeometry(w,h,d,1,r);const p=g.attributes.position,n=g.attributes.normal,dims=[w,h,d],longest=dims.indexOf(Math.max(...dims)),uv=[];for(let i=0;i<p.count;i++){const coords=[p.getX(i),p.getY(i),p.getZ(i)],nn=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],face=nn.indexOf(Math.max(...nn)),along=longest===face?(face+1)%3:longest,across=[0,1,2].find(k=>k!==face&&k!==along);uv.push(coords[along],coords[across]);}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));roundedBoxes.set(key,g);}emit(g,ma,x,y,z,1,1,1,rot,tint);}
function group(x,y,z,yaw,fn,scale=1){stack.push(stack.at(-1).clone().multiply(new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromAxisAngle(V([0,1,0]),yaw),V(Array.isArray(scale)?scale:[scale,scale,scale]))));try{fn();}finally{stack.pop();}}
function between(a,b,r,ma='cedar',square=false){if(suppressGeometry)return;a=V(a);b=V(b);const d=b.clone().sub(a),matrix=new T.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(V([0,1,0]),d.clone().normalize()),V([r,d.length(),r])).premultiply(stack.at(-1));let g=square?cube:cyl,key=g.uuid+m[ma].uuid,bk=buckets.get(key);if(!bk){bk={g,ma:m[ma],matrix:[],tint:[]};buckets.set(key,bk);}bk.matrix.push(matrix);bk.tint.push(1);}
const arch=createRestorationArchitecture({instance:emit,box,group,stack,columns:[],roofAudit:[]});
function tube(points,r,ma='slate'){emit(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(V)),Math.max(12,points.length*3),r,7,false),ma);}
function rail(x0,x1,y,z,height=.85){for(let i=0;i<=Math.ceil((x1-x0)/1.1);i++){const x=x0+(x1-x0)*i/Math.ceil((x1-x0)/1.1);box(x,y+height*.5,z,.11,height,.11,'red');emit(sphere,'oldgold',x,y+height+.05,z,.10,.09,.10);}for(const h of[.25,.65,.88])box((x0+x1)/2,y+h*height,z,x1-x0,.075,.075,'red');}
function lantern(x,y,z,s=1,hanging=false){group(x,y,z,.12,()=>{
 // Six open metal frames enclose a small warm paper cylinder.
 emit(new T.CylinderGeometry(.22,.22,.65,6),'lanternPaper',0,0,0);
 for(let f=0;f<6;f++)group(0,0,0,f*Math.PI/3,()=>{
  for(const x of[-.147,.147])box(x,0,.255,.024,.80,.026,'black');
  for(const yy of[-.38,.38])box(0,yy,.255,.32,.035,.035,'oldgold');
  for(const yy of[-.29,.29]){for(let i=0;i<7;i++){let xx=-.12+i*.04;between([xx-.022,yy-.035,.26],[xx+.022,yy+.035,.26],.009,'oldgold');between([xx-.022,yy+.035,.26],[xx+.022,yy-.035,.26],.009,'oldgold');}}
  for(const xx of[-.06,.06])between([xx,-.23,.26],[xx,.23,.26],.009,'oldgold');
 });
 const cap=new T.LatheGeometry([[.32,0],[.34,.03],[.27,.08],[.19,.15],[.06,.21]].map(p=>new T.Vector2(...p)),6);emit(cap,'oldgold',0,.40,0);emit(cap.clone().rotateZ(Math.PI),'oldgold',0,-.40,0,1,.65,1);
 emit(sphere,'gold',0,.69,0,.055,.085,.055);
 if(hanging){for(let i=0;i<13;i++)emit(new T.TorusGeometry(.027,.007,5,12),'black',0,.78+i*.07,0,1,1,1,[i%2*Math.PI/2,0,0]);between([0,-.55,0],[0,-.85,0],.018,'oldgold');for(let i=0;i<24;i++){let a=i*Math.PI/12;between([Math.cos(a)*.035,-.88,Math.sin(a)*.035],[Math.cos(a)*.055,-1.14-R(0,.05),Math.sin(a)*.055],.005,'oldgold');}}
 },s);
 const scale=s*new T.Vector3().setFromMatrixScale(stack.at(-1)).x,light=new T.PointLight('#ffb34f',(hanging?35:24)*scale*scale,0,2);light.name='scene10-inverse-square-existing-lantern';light.position.set(x,y,z).applyMatrix4(stack.at(-1));
 if(light.position.z>5&&light.position.y>4){light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.camera.near=.12;light.shadow.camera.far=60;light.shadow.bias=-.000035;light.shadow.normalBias=.012;}
 scene.add(light);}
// Five diminishing storeys, broad upturned eaves, glowing small latticed bays.
const towerMass183=buildTowerMass183({emit,box,group,between,tube,arch,scene,stack},L);
const pagodaSources141=towerMass183.sources;
// Hall-local physical roof underside, supported timber frame and gilded fittings.
const hall132Palette=createHall132Palette(m),hall132Saved={};
for(const key of Object.keys(hall132Palette)){hall132Saved[key]=m[key];m[key]=hall132Palette[key];}
const hall132=buildHall132({emit,box,group,between,tube,arch,lantern,R,scene,stack,emitRestoredBuddha,carvedCloud183},L);
Object.assign(m,hall132Saved);
// One closed bridge, turning landing and connected hall stair flight.
const bridgeHallPlan=createBridgeHallStairPlan125(),bridgeApproach207=createApproachPlan207(L);
const bridgeEndSupports125=[];
const retainedRed142=m.red;m.bridgeRed142=m.nearLacquer.clone();m.bridgeRed142.name='rain210-bridge-wet-vermilion';m.bridgeRed142.color.set('#922f20');m.bridgeRed142.roughness=.28;m.bridgeRed142.clearcoat=.90;m.bridgeRed142.clearcoatRoughness=.11;installSurfaceDetail(m.bridgeRed142,'wood');m.red=m.bridgeRed142;
function solidFootprint125(outline,bottom,top,material='granite'){
 const shape=new T.Shape();outline.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 const geometry=new T.ExtrudeGeometry(shape,{depth:top-bottom,bevelEnabled:false,steps:1});geometry.rotateX(-Math.PI/2);geometry.translate(0,bottom,0);emit(geometry,material);return geometry;
}
const legacyBridgeRandomCalls=19+[.12,.5,.88].reduce((n,t)=>n+Math.ceil((1.4+.25+1.35*Math.sin(Math.PI*(t-.55*t*(1-t)))+.65*t-.13)/.30),0);
group(...L.bridge.position,L.bridge.yaw,()=>{
 const b=L.bridge,n=40,P=bridgePoint125;
 const archProfile=new T.Shape(),ribStations=72;
 for(let i=0;i<=ribStations;i++){const p=P(i/ribStations);i?archProfile.lineTo(p[0],p[1]-.14):archProfile.moveTo(p[0],p[1]-.14);}
 for(let i=ribStations;i>=0;i--){const p=P(i/ribStations);archProfile.lineTo(p[0],p[1]-.42);}archProfile.closePath();
 const carryingArch=new T.ExtrudeGeometry(archProfile,{depth:.17,steps:1,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:2,curveSegments:1});
 for(const sign of[-1,1]){
  emit(carryingArch,'red',0,0,sign*1.10-.085);
  for(const [drop,r,ma]of[[-.41,.025,'darkwood'],[-.33,.012,'darkwood'],[-.17,.018,'cedar']])tube(Array.from({length:49},(_,i)=>P(i/48,sign*1.205,drop)),r,ma);
 }
 const crestRing=new T.TorusGeometry(.115,.012,7,32);
 for(const t of[.22,.50,.78]){
  const p=P(t,1.218,-.33);emit(crestRing,'oldgold',...p);
  for(let k=0;k<8;k++){const a=k*Math.PI/4;emit(sphere,'oldgold',p[0]+Math.cos(a)*.068,p[1]+Math.sin(a)*.068,p[2]+.008,.040,.017,.012,[0,0,a]);}
  emit(sphere,'gold',p[0],p[1],p[2]+.012,.025,.025,.012);
 }
 for(let i=0;i<n;i++){
  const t0=i/n,t1=(i+1)/n,x0=-b.span/2+b.span*t0,x1=-b.span/2+b.span*t1,w=b.width/2+.20;
  const g=solidFootprint125([[x0,-w],[x1,-w],[x1,w],[x0,w]],-b.deckThickness,0,'darkwood'),position=g.attributes.position;
  for(let k=0;k<position.count;k++){const x=position.getX(k),t=(x+b.span/2)/b.span;position.setY(k,position.getY(k)+P(t,0)[1]);}position.needsUpdate=true;g.computeVertexNormals();
  for(const side of[-w+.12,w-.12])between(P(t0,side,-.12),P(t1,side,-.12),.14,'cedar',true);
 }
 for(const side of[-b.width/2-.1,b.width/2+.1]){
  const end=side<0?b.exitRailCutT:1,railStart=side>0?(b.entryFlatT||0):0,stations=Array.from({length:10},(_,i)=>i/9).filter(t=>t<end-1e-8&&(t===0||t>=railStart));if(railStart>0)stations.push(railStart);stations.push(end);
  for(const t of stations){const postT=side>0&&t===0?(b.entryFirstPostT||0):t,p=P(postT,side);box(p[0],p[1]+.52,side,.14,1.04,.14,'red');emit(sphere,'oldgold',p[0],p[1]+1.10,side,.075,.08,.075);}
  for(const h of[.25,.6,1.0])tube(Array.from({length:41},(_,i)=>P(railStart+(end-railStart)*i/40,side,h)),.065,'red');
 }
});
const support207=buildSupportRoute207({emit,box,between,tube},L,bridgeHallPlan,bridgeApproach207,bridgeEndSupports125);
const foundationRocks207=buildFoundationRocks207({emit},L,bridgeHallPlan,scannedStones);
// Keep the established later garden RNG independent of this structural rewrite.
m.red=retainedRed142;for(let k=0;k<legacyBridgeRandomCalls;k++)rand();
// Existing rigid CC0 scans form a grounded island at the near bridge pier.
const bridgeAbutment125=[],nearBridgeFoot125=bridgeToWorld125(bridgePoint125(0));let footingTop=-.20;
for(const [i,variant,scale]of[[0,0,.72],[1,4,.80]]){
 const scan=scannedStones.variants[variant],yaw=i?.22:-.18,rotation=new T.Matrix4().makeRotationY(yaw).scale(V([scale,scale,scale])),bounds=new T.Box3(),position=scan.geometry.attributes.position;
 for(let j=0;j<position.count;j++)bounds.expandByPoint(V([position.getX(j),position.getY(j),position.getZ(j)]).applyMatrix4(rotation));
 const bottom=i?footingTop-.12:-.20,y=bottom-bounds.min.y;bounds.translate(V([nearBridgeFoot125[0],y,nearBridgeFoot125[2]]));
 if(bounds.max.z>=nearBridgeFoot125[2]+1.1||bounds.min.x<=nearBridgeFoot125[0]-1.1||bounds.max.y>=nearBridgeFoot125[1]+.24)throw Error('Bridge bank stone leaves its bounded support envelope');
 emit(scan.geometry,scan.wet,nearBridgeFoot125[0],y,nearBridgeFoot125[2],scale,scale,scale,yaw);footingTop=bounds.max.y;bridgeAbutment125.push({variant,scale,yaw,position:[nearBridgeFoot125[0],y,nearBridgeFoot125[2]],bounds:[bounds.min.toArray(),bounds.max.toArray()],source:'Existing CC0 scan, positions/normals/UVs retained'});
}
// Sheltered foreground is one supported column and a rotated veranda roof.
group(...L.veranda.column,0,()=>{
 const v=L.veranda,shaftTop=v.ceilingY-.165;
 emit(cyl,'nearLacquer',0,shaftTop/2,0,v.radius,shaftTop,v.radius);emit(cyl,'black',0,v.shoeHeight/2,0,v.radius+.015,v.shoeHeight,v.radius+.015);
 emit(createVerandaFootstone142(T),'granite');
 group(0,0,0,v.ceilingYaw,()=>{
  const [cx,cz]=v.ceilingCenter;box(cx,v.ceilingY,cz,4.5,.33,8.2,'cedar');
  for(let i=0;i<17;i++){const z=cz-3.2+i*.47;box(cx,v.ceilingY-.25,z,4.7,.17,.17,'red');for(let j=0;j<5;j++)box(cx-1.9+j*.96,v.ceilingY-.37,z,.28,.22,.29,'darkwood');}
  box(cx-2.1,v.ceilingY+.10,cz,1,.6,8,'slate');
 });
});lantern(...L.veranda.hangingLamp,L.veranda.lampScale,true);
// One near post and the cropped rail returning toward the camera.
const finialProfile=[[0,0],[.21,0],[.225,.025],[.225,.058],[.204,.078],[.155,.092],[.128,.127],[.145,.157],[.210,.203],[.244,.263],[.236,.318],[.198,.366],[.136,.405],[.082,.435],[.060,.459],[.059,.491],[.040,.527],[0,.566]].map(([r,y])=>new T.Vector2(r,y));
const finialGeo=new T.LatheGeometry(finialProfile,48);
const nearRail=L.foregroundRail,[nearX,,nearZ]=nearRail.position;
box(nearX,(nearRail.postHeight+nearRail.baseY)/2,nearZ,nearRail.postWidth,nearRail.postHeight-nearRail.baseY,nearRail.postWidth,'nearLacquer');box(nearX,nearRail.postHeight,nearZ,nearRail.capWidth,.11,nearRail.capWidth,'black');emit(finialGeo,'gold',nearX,nearRail.finialBase,nearZ,nearRail.finialWidthScale,nearRail.finialHeightScale,nearRail.finialWidthScale);
for(const y of[.04,.12,.46])emit(new T.TorusGeometry(.205,.016,6,40),'oldgold',nearX,nearRail.finialBase+y*nearRail.finialHeightScale,nearZ,nearRail.finialWidthScale,1,nearRail.finialWidthScale,[Math.PI/2,0,0]);
for(const y of nearRail.levels){
 const a=[nearX,y,nearZ+.05],b=[nearRail.returnEnd[0],y,nearRail.returnEnd[2]],d=V(b).sub(V(a)),q=new T.Quaternion().setFromUnitVectors(V([0,0,1]),d.clone().normalize());
 emit(new RoundedBoxGeometry(.22,.16,d.length(),2,.028),'nearLacquer',...(V(a).add(V(b)).multiplyScalar(.5)).toArray(),1,1,1,q);
}
// The returning veranda rail stands on a complete apron, above the water film.
solidFootprint125([[L.path.nearRight,L.path.turnEndZ],[4.6,L.path.turnEndZ],[4.6,20],[L.path.nearRight,20]],-.25,nearRail.baseY,'granite');
// Wet paving is built as individually shaped solid slabs with fine irregular seams.
function noiseTexture(){const N=256,data=new Uint8Array(N*N*4);for(let y=0;y<N;y++)for(let x=0;x<N;x++){let q=R(.30,.70)+.12*Math.sin(x*.08+Math.sin(y*.07));let i=(y*N+x)*4;data[i]=data[i+1]=data[i+2]=Math.round(q*255);data[i+3]=255;}const t=new T.DataTexture(data,N,N);t.needsUpdate=true;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3,3);t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;return t;}
const wetBump=noiseTexture(),wetStone=new T.MeshPhysicalMaterial({color:'#171814',roughness:.39,metalness:0,bumpMap:wetBump,bumpScale:.014,clearcoat:.20,clearcoatRoughness:.075,specularIntensity:.55});const normalBytes=new Uint8Array(256*256*4),heightData=wetBump.image.data;for(let y=0;y<256;y++)for(let x=0;x<256;x++){const h=(dx,dy)=>heightData[(((y+dy+256)%256)*256+(x+dx+256)%256)*4]/255;let dx=(h(1,0)-h(-1,0))*.75,dy=(h(0,1)-h(0,-1))*.75,n=new T.Vector3(-dx,-dy,1).normalize(),i=(y*256+x)*4;normalBytes[i]=(n.x*.5+.5)*255;normalBytes[i+1]=(n.y*.5+.5)*255;normalBytes[i+2]=(n.z*.5+.5)*255;normalBytes[i+3]=255;}const wetNormal=new T.DataTexture(normalBytes,256,256);wetNormal.wrapS=wetNormal.wrapT=T.RepeatWrapping;wetNormal.repeat.set(1.40,1.40);wetNormal.generateMipmaps=true;wetNormal.minFilter=T.LinearMipmapLinearFilter;wetNormal.magFilter=T.LinearFilter;wetNormal.needsUpdate=true;
wetStone.clearcoat=.55;wetStone.clearcoatNormalMap=wetNormal;wetStone.clearcoatNormalScale=new T.Vector2(.30,.30);const lacquerNormal=wetNormal.clone();lacquerNormal.repeat.set(6,5);lacquerNormal.needsUpdate=true;m.nearLacquer.clearcoatNormalMap=lacquerNormal;m.nearLacquer.clearcoatNormalScale=new T.Vector2(.20,.20);
wetStone.map=graniteMaps[0];wetStone.normalMap=graniteMaps[1];wetStone.normalScale.set(.36,.36);wetStone.roughnessMap=graniteMaps[2];wetStone.bumpMap=wetBump;wetStone.bumpScale=.0015;wetStone.color.set('#b9d2e8');wetStone.roughness=.48;wetStone.specularIntensity=.36;wetStone.clearcoat=.60;wetStone.envMapIntensity=.88;wetStone.name='scene10-warm-rain-granite-face-141';m.wet=wetStone;installSurfaceDetail(wetStone,'wet');
m.wetNear=wetStone.clone();m.wetNear.name='twelve-real-stone-surfaces-with-existing-actual-scene-probe';m.wetNear.envMapIntensity=.88;installSurfaceDetail(m.wetNear,'wet');
const nearSurfaceBuilder=createNearSurfaceReflectionMask(T);
// Continuous stone bedding meets every slab underside; the real drainage slot stays open.
for(const outline of clipPavingAtDrain([[-4.6,-2.1],[4.6,-2.1],[4.6,19.5],[-4.6,19.5]]))solidFootprint125(outline,-.28,-.080,'granite');
const floorPolygons=[],nearStoneRecords=[],rows=26,courseDepth=21.32/rows,wetFilmY=.050,pavingRngStart=seed;
const paveHash=(a,b)=>{const q=Math.sin((a*127.1+b*311.7+1037)*12.9898)*43758.5453;return q-Math.floor(q);};
const foreWeights=Array.from({length:rows-14},(_,i)=>.70+.52*paveHash(i,141)),foreSum=foreWeights.reduce((a,b)=>a+b,0),courseZ=[];
for(let j=0;j<=rows;j++)courseZ.push(j<=14?-2+j*courseDepth+(j>0&&j<14?(paveHash(j,239)-.5)*.07:0):-2+14*courseDepth+foreWeights.slice(0,j-14).reduce((a,b)=>a+b,0)/foreSum*(21.32-14*courseDepth));
function courseCuts(j){
 const base=j>=14?[[0,.27,.63,1],[0,.14,.49,.79,1],[0,.38,.71,1]][j%3]:j%2?[0,.08,.24,.40,.56,.72,.88,1]:[0,.14,.30,.46,.62,.78,1];
 return base.map((f,k)=>k===0||k===base.length-1?f:f+(paveHash(j,k)-.5)*(j>=14?.040:.018));
}
// Preserve the later garden/rain RNG stream while replacing the old 8-column vertex grid.
seed=pavingRngStart;for(let k=0;k<(rows+1)*7+(rows-1)*9;k++)rand();
m.nearJointGrit=new T.MeshStandardMaterial({name:'near-rain-joint-soil-and-granite-grit',color:'#34372d',map:graniteMaps[0],normalMap:graniteMaps[1],normalScale:new T.Vector2(.26,.26),roughness:.96,roughnessMap:graniteMaps[2]});
for(let j=0;j<rows;j++){
 const z0=courseZ[j],z1=courseZ[j+1],cuts=courseCuts(j),left0=leftPathEdge125(z0),right0=rightPathEdge125(z0),left1=leftPathEdge125(z1),right1=rightPathEdge125(z1);
 for(let i=0;i<cuts.length-1;i++){
 const slabSeed=seed,f0=cuts[i],f1=cuts[i+1],original=[[left0+(right0-left0)*f0,z0],[left0+(right0-left0)*f1,z0],[left1+(right1-left1)*f1,z1],[left1+(right1-left1)*f0,z1]],hash=Math.sin((j*13+i*37+41)*12.9898)*43758.5453;
 const wetness=.28+.72*(hash-Math.floor(hash)),topOffset=R(j>=14?-.008:-.005,j>=14?.008:.005),tint=R(.74,1.13);
 for(const points of clipPavingAtDrain(original)){
  const cx=points.reduce((a,p)=>a+p[0],0)/points.length,cz=points.reduce((a,p)=>a+p[1],0)/points.length;
  const chipped=[];
  points.forEach((p,k)=>{const next=points[(k+1)%points.length];for(let n=0;n<5;n++){
   const t=n/5;let x=p[0]*(1-t)+next[0]*t,z=p[1]*(1-t)+next[1]*t;
   // A narrow independent inset leaves a 1–3 px real joint at the review size.
   x+=(cx-x)*(j>=14?.008:.006)+R(j>=14?-.009:-.003,j>=14?.009:.003);z+=(cz-z)*(j>=14?.008:.006)+R(j>=14?-.009:-.003,j>=14?.009:.003);chipped.push([x,z]);
  }});
  const id=j+':'+i,near=!!nearRainStoneProfiles[id],g=near?createNearRainFlagstone(T,{points:chipped,topOffset,seed:j*97+i*37+1037,id}):createWornFlagstone(T,{points:chipped,topOffset,seed:j*97+i*37+1037});
  floorPolygons.push({points:g.userData.rainStoneFootprint||chipped,wetness,topY:near?(g.userData.nearRainStone.topYRange[0]+g.userData.nearRainStone.topYRange[1])*.5:.044+topOffset,heightAt:g.userData.heightAt,topYMax:g.userData.topYMax,...(near?{edgeFadeMetres:[.001,.007]}:{})});
  if(near){nearSurfaceBuilder.add(g,id);nearStoneRecords.push(g.userData.nearRainStone);for(const bedPoints of clipPavingAtDrain(original)){const bed=createNearJointBed(T,{points:bedPoints,seed:j*97+i*37+1037});emit(bed,'nearJointGrit');}}
  emit(g,near?'wetNear':'wet',0,0,0,1,1,1,0,tint);
 }
 // Keep the next tile's material and edge variation deterministic.
 seed=slabSeed;for(let k=0;k<42;k++)rand();
 }
}
// The rest of the scene keeps its exact pre-rebuild random sequence.
seed=pavingRngStart;for(let k=0;k<(rows+1)*7+(rows-1)*9+rows*8*42;k++)rand();
// Closed worn curb stones carry the curved path edge into the veranda apron.
const pathCurbRecords125=[];
for(let i=0;i<31;i++){
 const a=-2+i*.70,b=a+.688,x0=rightPathEdge125(a),x1=rightPathEdge125(b),points=[[x0+.012,a],[x0+.22,a],[x1+.22,b],[x1+.012,b]],g=createWornFlagstone(T,{points,topOffset:.035,seed:12591+i*31});
 emit(g,'granite');pathCurbRecords125.push({points,closed:true});
}
const floorWetMap=createPavingWetMask(T,floorPolygons,{filmY:wetFilmY});wetStone.userData.floorWetMap=floorWetMap;m.wetNear.userData.floorWetMap=floorWetMap;
const nearSurface=nearSurfaceBuilder.finish();
installNearSurfaceWaterResponse(T,m.wetNear,nearSurface);
// Narrow iron drainage grille crosses the lower frame diagonally.
group(...L.drain.position,L.drain.yaw,()=>{const half=L.drain.halfWidth;box(0,-.105,0,half*2,.025,13,'black');for(const side of[-1,1])box(side*(half-.018),0,0,.016,.027,13,'black');for(let i=0;i<215;i++)box(0,0,-6.4+i*.060,half*2-.025,.014,.019,'black');});
// Rain-film reflection uses actual geometry and a bounded physical plane.
const mirror=new Reflector(new T.PlaneGeometry(8.9,22),{clipBias:.002,textureWidth:1536,textureHeight:1536,color:0x808080,multisample:2});mirror.rotation.x=-Math.PI/2;mirror.position.set(-.1,wetFilmY,8.5);mirror.material.transparent=true;mirror.material.depthWrite=false;mirror.material.uniforms.floorWetMap={value:floorWetMap};
mirror.material.vertexShader='varying vec3 vFilmPosition;\n'+mirror.material.vertexShader.replace('vUv = textureMatrix * vec4( position, 1.0 );','vUv = textureMatrix * vec4( position, 1.0 );vFilmPosition=(modelMatrix*vec4(position,1.0)).xyz;');
mirror.material.fragmentShader='uniform sampler2D floorWetMap;varying vec3 vFilmPosition;\n'+detailNoise+mirror.material.fragmentShader;
mirror.material.fragmentShader=mirror.material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec3 sp=vFilmPosition;
float film=sdFbm(sp*9.4);vec4 uv=vUv;
// Broken reflected patches stay inside the generated stone margins and their low spots.
vec2 rip=vec2(sdNoise(sp*91.),sdNoise(sp*113.+2.3))-.5;
uv.xy+=rip*vec2(.0016,.0024)*uv.w;
vec4 base=texture2DProj(tDiffuse,uv)*1.02;vec4 u2=uv;u2.y+=.0012*uv.w;base+=texture2DProj(tDiffuse,u2)*.08;`)
.replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',`vec4 wet=texture2D(floorWetMap,vec2((sp.x+4.6)/9.2,(sp.z+2.)/21.4));
float pave=wet.b,seam=wet.r,pool=smoothstep(.08,.78,wet.a);
float broken=smoothstep(.34,.74,film+(sdNoise(sp*47.)-.5)*.22);
float grazing=pow(1.-clamp(abs(normalize(cameraPosition-sp).y),0.,1.),3.);
float sheen=mix(.045,.76,pool)*(.10+.90*broken);
float alpha=pave*seam*wet.g*sheen*(.52+.48*grazing);
vec2 dp=vec2(sp.x-(${L.drain.position[0].toFixed(6)}),sp.z-(${L.drain.position[2].toFixed(6)}));float drain=abs(cos(${L.drain.yaw.toFixed(6)})*dp.x-sin(${L.drain.yaw.toFixed(6)})*dp.y);float drainZ=abs(sin(${L.drain.yaw.toFixed(6)})*dp.x+cos(${L.drain.yaw.toFixed(6)})*dp.y);
alpha*=mix(1.,smoothstep(${(L.drain.halfWidth-.010).toFixed(6)},${(L.drain.halfWidth+.018).toFixed(6)},drain),step(drainZ,6.5));
gl_FragColor=vec4(base.rgb,alpha);`);scene.add(mirror);
installNearSurfacePlaneExclusion(T,mirror,nearSurface);
// Shallow garden water, irregular rock-and-moss margins.
m.water=new T.MeshPhysicalMaterial({color:'#32423d',roughness:.18,metalness:0,ior:1.333,clearcoat:.65,clearcoatRoughness:.08,envMapIntensity:.85});const streamNormal207=wetNormal.clone();streamNormal207.repeat.set(.30,.30);m.water.normalMap=streamNormal207;m.water.normalScale=new T.Vector2(.13,.13);
emit(createPond207(),'water');
// The stream reflects this actual 3D garden at its own water level. The
// photograph is never a texture. Its finite footprint is the basin outline.
const creekMirror207=new Reflector(createPondReflectionFootprint207(),{clipBias:.002,textureWidth:1024,textureHeight:1024,color:0x808080,multisample:2});
creekMirror207.name='207-finite-creek-actual-scene-reflection';creekMirror207.rotation.x=-Math.PI/2;creekMirror207.position.y=-.066;
creekMirror207.material.transparent=true;creekMirror207.material.depthWrite=false;creekMirror207.material.uniforms.creekTime207={value:0};
creekMirror207.material.vertexShader='varying vec3 vCreekPosition207;\n'+creekMirror207.material.vertexShader.replace('vUv = textureMatrix * vec4( position, 1.0 );','vUv = textureMatrix * vec4( position, 1.0 );vCreekPosition207=(modelMatrix*vec4(position,1.0)).xyz;');
creekMirror207.material.fragmentShader='varying vec3 vCreekPosition207;uniform float creekTime207;\n'+detailNoise+creekMirror207.material.fragmentShader;
creekMirror207.material.fragmentShader=creekMirror207.material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec2 ripple207=vec2(sin(vCreekPosition207.x*18.+vCreekPosition207.z*7.+creekTime207*1.8),sin(vCreekPosition207.z*23.-vCreekPosition207.x*9.+creekTime207*1.3));
 ripple207+=vec2(sdFbm(vCreekPosition207*13.),sdFbm(vCreekPosition207*16.+3.))-.5;
 vec4 reflectionUv207=vUv;reflectionUv207.xy+=ripple207*.00085*vUv.w;
 vec4 base=texture2DProj(tDiffuse,reflectionUv207);`);
creekMirror207.material.fragmentShader=creekMirror207.material.fragmentShader.replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',`float cosine207=abs(normalize(cameraPosition-vCreekPosition207).y);
 float fresnel207=.02037+.97963*pow(1.-cosine207,5.);
 gl_FragColor=vec4(base.rgb,clamp(fresnel207*.92,.025,.86));`);
scene.add(creekMirror207);
// Reflection reverses camera handedness. Its off-axis horizontal principal
// point must reverse too; otherwise a genuine crop samples outside the
// reflected frustum and clamps to a false bright patch (preserved R05).
// Keep the original photographic camera untouched and sync one private
// projection source per real camera. Other reflectors are hidden recursively.
for(const [surface,other]of[[mirror,creekMirror207],[creekMirror207,mirror]]){
 const draw=surface.onBeforeRender,sources=new WeakMap();
 surface.onBeforeRender=function(renderer,scene,camera,...rest){
  let source=sources.get(camera);if(!source){source=camera.clone();sources.set(camera,source);}else source.copy(camera,false);
  source.projectionMatrix.copy(camera.projectionMatrix);source.projectionMatrix.elements[8]*=-1;
  if(source.view?.enabled)source.view.offsetX=source.view.fullWidth-source.view.offsetX-source.view.width;
  source.projectionMatrixInverse.copy(source.projectionMatrix).invert();
  this.getReflectionCamera(source).projectionMatrixInverse.copy(source.projectionMatrixInverse);
  const visible=other.visible;other.visible=false;try{return draw.call(this,renderer,scene,source,...rest);}finally{other.visible=visible;}
 };
}
const creekReflection207={kind:'Actual dynamic planar reflection of the existing scene',footprint:'Same closed irregular creek outline as the water basin',waterY:-.07,reflectionY:-.066,target:[1024,1024],ior:1.333,f0:.02037,referencePixelsSampled:false,recursiveReflection:false,offAxisFrustum:'Horizontal principal point mirrored on private reflection source; original reference/inspection camera unchanged'};
const pondEdges207=buildPondEdges207({emit},bridgeHallPlan,bridgeApproach207);
const rocks=Array.from({length:8},(_,i)=>createWeatheredBoulderGeometry(T,{scale:[1,.85,1],seed:1703+i*71,sectors:48,rings:22})),rockMoss=rocks.map((g,i)=>createBoulderMossGeometry(T,g,{seed:1703+i*71,offset:.004}));
function bridgeWaterChannel125(x,z){if(z<=-7.0||z>=-1.8)return false;const axis=2.50+.55*Math.sin((z+5)*.7);return Math.abs(x-axis)<.85;}
function rock(x,z,s){const y=s*.32,variant=Math.floor(rand()*8),sy=R(.6,.95)*s,sz=R(.7,1.3)*s,rot=R(0,6),tint=R(.75,1.2);const scan=scannedStones.variants[variant%6];if(false&&!circulationReserved125(x,z)&&!bridgeWaterChannel125(x,z))emit(scan.geometry,scan.wet,x,y-.12,z,s,sy,sz,rot,tint);let microSeed=0;for(let k=0;k<48;k++)microSeed=(microSeed+rand()*(k+1)*.723)%1;}
for(let k=0;k<85;k++){const z=R(-23,5),x=(rand()<.45?-1:1)*R(4.5,16);rock(x,z,R(.35,1.45));}for(let k=0;k<16;k++)rock(R(-4,-2),R(-8,-2),R(.2,.6));
function circulationReserved125(x,z){
 if(routeReserved207(x,z,bridgeHallPlan,bridgeApproach207))return true;
 if(z>=-13&&z< -7.65&&Math.abs(x-(-2.5+.132*(z+3)))<1.02)return true;
 // Reserve beyond the physical slab/curb by more than one .25m grid
 // diagonal. R03 reserved inside the paving edge and allowed the adjacent
 // raised soil triangle to cross the right curb and the veranda receiver.
 if(z>=-2.45&&z<=20.45&&x>leftPathEdge125(z)-.45&&x<rightPathEdge125(z)+.65)return true;
 if(Math.abs(x-L.veranda.column[0])<=1.22&&Math.abs(z-L.veranda.column[2])<=1.16)return true;
 return z>=L.path.turnEndZ-.45&&z<=20.45&&x>=L.path.nearRight-.45&&x<=5.05;
}
// Porous wet mineral support retains the source shape without the earlier mirror-like film.
for(const scan of scannedStones.variants){scan.wet.roughness=.82;scan.wet.clearcoat=.12;scan.wet.clearcoatRoughness=.32;}
// Hero and garden stone lanterns share a physical, weathered granite assembly.
function stoneLantern(x,z,s=1,isNear=false){buildStoneLantern({T,emit,box,group,R,scene,materials:m,layout:L,x,z,s,isNear});}
{const h=L.heroStoneLantern,w=h.bearingPadWidth||1.22;box(h.position[0],h.position[1]-.07,h.position[2],w,.14,w,'granite');stoneLantern(h.position[0],h.position[2],1.30,true);}for(const [x,z,s]of[[-6,-2.7,.72],[-7.5,-6,.8],[-9,-10,.7],[-2,-7,.64],[4,-10,.75],[10,-1,.65]])stoneLantern(x,z,s);
// All foliage is three-dimensional leaf geometry attached to irregular woody branching.
const leafPos=[],leafUv=[];const leafP=(u,t)=>{const width=Math.sin(Math.PI*t)*.22;return[u*width,Math.sin(Math.PI*t)*.06+Math.abs(u)*.035,(t-.5)*.65];};for(let j=0;j<4;j++)for(let i=0;i<2;i++){const a=leafP(-1+i,j/4),b=leafP(i,j/4),c=leafP(-1+i,(j+1)/4),d=leafP(i,(j+1)/4);for(const p of[a,c,b,b,c,d]){leafPos.push(...p);leafUv.push(p[0],p[2]);}}const leafGeo=new T.BufferGeometry();leafGeo.setAttribute('position',new T.Float32BufferAttribute(leafPos,3));leafGeo.setAttribute('uv',new T.Float32BufferAttribute(leafUv,2));leafGeo.computeVertexNormals();
const mapleShape=new T.Shape();const mp=[[0,.9],[.12,.35],[.46,.65],[.35,.16],[.83,.2],[.38,-.08],[.50,-.40],[.13,-.22],[0,-.63],[-.13,-.22],[-.5,-.4],[-.38,-.08],[-.83,.2],[-.35,.16],[-.46,.65],[-.12,.35]];mp.forEach((p,i)=>i?mapleShape.lineTo(...p):mapleShape.moveTo(...p));mapleShape.closePath();const mapleGeo=new T.ShapeGeometry(mapleShape);mapleGeo.rotateX(Math.PI/2);
function foliage(cx,cy,cz,r,ma='leaf',n=180){
 // The former flattened opaque icosahedra hid all internal plant structure.
 // Each crown now consists of folded leaves in irregular overlapping pads.
 const before=seed,total=Math.ceil(n*(ma==='leaf'?(r<.8?2.6:1.9):1.90));
 for(let k=0;k<total;k++){
  const cl=k%9,ang=cl*2.39996,cr=r*(.24+.32*Math.sin(cl*1.6)**2),cx0=cx+Math.cos(ang)*cr,cz0=cz+Math.sin(ang)*cr,
   a=R(0,6.283),rad=Math.sqrt(rand())*r*.59,x=cx0+Math.cos(a)*rad,z=cz0+Math.sin(a)*rad,
   y=cy+(R(-.30,.28)+.13*Math.cos(cl*.83))*r,s=ma==='maple'?R(.070,.12):R(.075,.12);
  const scaleY=R(.8,1.22),angles=[R(-1.05,1.05),R(0,6.3),R(-.85,.85)],tint=R(.75,1.30),blade=licensedGroundcover142.leaves[k%4];if(ma==='leaf')emit(blade.geometry,blade.material,x,y,z,s*1.10,scaleY*s*1.10,s*1.10,angles,tint);else emit(ma==='maple'?mapleGeo:leafGeo,ma,x,y,z,s,scaleY*s,s,angles,tint);
 }
 // Keep branch, shrub and rain placement independent of the extra leaf count.
 seed=before;for(let i=0;i<(ma==='leaf'?5:0)+n*9;i++)rand();
}
const groundcoverPlacements142=[];
function shrub(x,z,s=1){
 const saved=seed,prior=suppressGeometry,blocked=circulationReserved125(x,z)||bridgeWaterChannel125(x,z);suppressGeometry=true; // Retired193, replay exact legacy random draws.
 try{
  for(let i=0;i<9;i++){
   const dx=R(-.55,.55)*s,dz=R(-.55,.55)*s,yy=R(.28,.75)*s;between([x,0,z],[x+dx,yy,z+dz],.012*s,'darkwood');foliage(x+dx,yy,z+dz,.38*s,'leaf',80);
  }
  for(let k=0;k<3;k++){
   const xx=x+R(-.48,.48)*s,zz=z+R(-.48,.48)*s,height=R(.22,.38)*s,yaw=R(0,Math.PI*2),variant=Math.floor(R(0,licensedGroundcover142.variants.length));
   group(xx,-.012,zz,yaw,()=>{for(const part of licensedGroundcover142.variants[variant].parts)emit(part.geometry,part.material,0,0,0,height,height,height);});
   if(!suppressGeometry)groundcoverPlacements142.push({x:xx,z:zz,height,variant,kind:'whole-3D-CC0-plant-rooted-at-parent-surface'});
  }
 }finally{suppressGeometry=prior;seed=saved;for(let i=0;i<6552;i++)rand();}
}
for(let k=0;k<130;k++){const z=R(-24,5),x=(rand()<.5?-1:1)*R(4.4,18);shrub(x,z,R(.55,1.6));}
for(let i=0;i<44;i++){const z=R(-6,2),x=(rand()<.5?-1:1)*R(3.1,5.5);shrub(x,z,R(.60,1.20));}
// Tapered bent woody stems branch close to the ground; foliage also grows on intermediate boughs.
const taperCylinder=new T.CylinderGeometry(.47,1,1,9);
function branch(a,b,r,material='darkwood'){a=V(a);b=V(b);const d=b.clone().sub(a),q=new T.Quaternion().setFromUnitVectors(V([0,1,0]),d.clone().normalize()),e=new T.Euler().setFromQuaternion(q);emit(taperCylinder,material,...(a.clone().add(b).multiplyScalar(.5)).toArray(),r,d.length(),r,[e.x,e.y,e.z]);}
function tree(x,z,h,ma='leaf',spread=1){const prior193=suppressGeometry;suppressGeometry=true;const base=[x,-.1,z];function fork(a,dir,len,r,depth){const b=[a[0]+dir[0]*len,a[1]+dir[1]*len,a[2]+dir[2]*len],mid=[(a[0]+b[0])*.5+R(-.15,.15)*len,(a[1]+b[1])*.5,(a[2]+b[2])*.5+R(-.15,.15)*len];branch(a,mid,r);branch(mid,b,r*.72);if(depth===0){foliage(...b,len*.48+spread*.46,ma,ma==='maple'?(spread>2?300:180):220);return;}if(depth<2)foliage(...b,len*.35+spread*.3,ma,80);for(let i=0;i<3;i++){const ang=R(0,Math.PI*2),d=[dir[0]*.40+Math.cos(ang)*R(.45,.8),R(.5,.85),dir[2]*.40+Math.sin(ang)*R(.45,.8)];fork(b,d,len*R(.59,.76),r*.49,depth-1);}}fork(base,[R(-.16,.16),1,R(-.16,.16)],h*.32,h*.016,3);suppressGeometry=prior193;}
const licensedForestPlacements141=[];
const matureStem141=new T.CylinderGeometry(.46,1,1,14);
function cedar(x,z,h){
 const retired193=suppressGeometry;suppressGeometry=true;
 const saved=seed,variant=Math.floor(R(0,licensedPines141.variants.length)),model=licensedPines141.variants[variant],yaw=R(0,6.283),crownHeight=h*.64,stemHeight=h-crownHeight,dx=R(-.025,.025)*h,dz=R(-.018,.018)*h;
 const stem=(a,b,r)=>{const A=V(a),B=V(b),delta=B.clone().sub(A),q=new T.Quaternion().setFromUnitVectors(V([0,1,0]),delta.clone().normalize()),e=new T.Euler().setFromQuaternion(q),mid=A.add(B).multiplyScalar(.5);emit(matureStem141,licensedPines141.trunkMaterial,...mid.toArray(),r,delta.length(),r,[e.x,e.y,e.z]);};
 stem([x,0,z],[x+dx*.55,stemHeight*.56,z+dz*.55],h*.010);
 stem([x+dx*.55,stemHeight*.56,z+dz*.55],[x+dx,stemHeight+.05,z+dz],h*.0065);
 group(x+dx,stemHeight,z+dz,yaw,()=>{for(const part of model.parts)emit(part.geometry,part.material,0,0,0,crownHeight*1.50,crownHeight,crownHeight*1.50);});
 const forks=[];for(let side=0;side<6;side++){
  const angle=yaw+side*Math.PI/3+.45,offset=h*(.075+.018*(side%3)),xx=x+dx+Math.cos(angle)*offset,zz=z+dz+Math.sin(angle)*offset,yy=stemHeight+h*(.015+.028*(side%3)),ch=h*(.34+.035*(side%2)),v=(variant+side+1)%licensedPines141.variants.length;
  stem([x+dx,stemHeight-.10,z+dz],[xx,yy,zz],h*.0032);
  group(xx,yy,zz,yaw+side*1.7,()=>{for(const part of licensedPines141.variants[v].parts)emit(part.geometry,part.material,0,0,0,ch*1.48,ch,ch*1.48);});forks.push({x:xx,y:yy,z:zz,variant:v,height:ch});
 }
 licensedForestPlacements141.push({x,z,height:h,variant,yaw,crownHeight,stemHeight,forks,rootTerrainOffset:forestHeight141(x,z)-.04,crownScaleXZ:1.50,supportedLateralCrownScaleXZ:1.48,rigidCrown:true});
 seed=saved;for(let i=0;i<64950;i++)rand();suppressGeometry=retired193;
}
function broadPine141(x,z,h){cedar(x,z,h);}

function forestHeight141(x,z){const rear=T.MathUtils.smoothstep(-z,27,42);return rear*(3+8*Math.exp(-(((x-3)/24)**2+((z+49)/20)**2))+1.1*Math.sin(x*.08)*Math.cos(z*.09))*(.30+.70*T.MathUtils.smoothstep(x,-8,5));}
{const p=[],uv=[],ids=[],nx=80,nz=44;for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-55+i*110/nx,z=-82+j*57/nz;p.push(x,forestHeight141(x,z)+.025,z);uv.push(x*.4,z*.4);if(i<nx&&j<nz){const a=j*(nx+1)+i;ids.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();m.forestSoil141=new T.MeshStandardMaterial({name:'rooted-forest-hill141',color:'#223126',roughness:1});installSurfaceDetail(m.forestSoil141,'moss');/* Forest terrain replaced by connected natural193 field. */}
for(let i=0;i<22;i++){const x=R(-31,30),z=R(-64,-37),h=R(13,23);group(0,forestHeight141(x,z)-.04,0,0,()=>cedar(x,z,h));}
{const prior=seed;seed=141593;for(const [x,z,h]of[[8.8,-43,26],[4,-44,23],[-1,-45,20]])group(0,forestHeight141(x,z)-.04,0,0,()=>broadPine141(x,z,h));seed=prior;}
{const prior=seed;seed=141817;for(let i=0;i<20;i++){
 const x=R(-10,24),z=R(-44,-32),h=R(5.5,9.5),variant=Math.floor(R(0,3)),yaw=R(0,6.283),y=forestHeight141(x,z)-.04;
 /* Whole sapling placement replaced by natural193. */licensedForestPlacements141.push({x,y,z,height:h,variant,yaw,kind:'rooted-understory',rigidCrown:true});
 }seed=prior;}

for(const p of[[-15,-14,9],[-17,-23,12],[-5,-29,13],[18,-17,12],[19,-2,10],[-6,-8,7]])tree(...p,'leaf',1.3);
{const saved=seed;seed=142539;for(const p of[[1,-35,11.5],[5.5,-39,13],[10,-37,12]])group(0,forestHeight141(p[0],p[1])-.03,0,0,()=>tree(...p,'leaf',1.55));seed=saved;}
for(const p of[[-12,-7,7],[-5,-13,6],[16,-1,10],[-18,-1,9]])tree(...p,'maple',1.2);
{const prior=suppressGeometry;suppressGeometry=true;tree(6.7,3,16,'maple',2.7);suppressGeometry=prior;}
const mapleCanopy136=buildRainFrameMaple142({branch,emit,leaf:mapleLeaf136.leaf,veins:mapleLeaf136.veins,palette:m.mapleAutumn,veinMaterial:m.mapleVeins});
for(const p of[[-4,-14,5],[-1,-13,5],[-11,-15,6]])tree(...p,'pink',1.1);
// Mature blossom crowns sit behind the bridge and break up the evergreen wall.
{const blossomSeed=seed;for(const p of[[-12,-5.5,6.4,1.35],[1.2,-11,6.8,1.55],[10.6,-7,5.4,1.25]])tree(p[0],p[1],p[2],'pink',p[3]);seed=blossomSeed;}
// Ferns and wet grasses fill the rocky water margins at a much smaller scale.
for(let i=0;i<270;i++){const x=(rand()<.5?-1:1)*R(3.4,7.7),z=R(-11,3),h=R(.16,.44),prior=suppressGeometry;suppressGeometry=true;try{for(let j=0;j<7;j++){let a=R(0,6.28),r=R(.08,.32);branch([x,.03,z],[x+Math.cos(a)*r,.03+h,z+Math.sin(a)*r],.005);for(let k=0;k<5;k++){let f=k/5;for(const side of[-1,1])emit(leafGeo,'leaf',x+Math.cos(a)*r*f+Math.cos(a+Math.PI/2)*side*.06,.03+h*f,z+Math.sin(a)*r*f+Math.sin(a+Math.PI/2)*side*.06,.15,.12,.16,[.1,a,side*.25],R(.8,1.2));}}}finally{suppressGeometry=prior;}}
for(let i=0;i<26;i++){const z=R(-3,5),edge=rightPathEdge125(z);rock(edge+R(.2,1.0),z,R(.36,.92));shrub(edge+R(.45,1.15),z,R(.52,.95));}
m.farWalk142=new T.MeshPhysicalMaterial({name:'scene10-closed-far-rain-flagstones142',color:'#636e6d',map:graniteMaps[0],normalMap:graniteMaps[1],normalScale:new T.Vector2(.64,.64),roughnessMap:graniteMaps[2],roughness:.48,clearcoat:.54,clearcoatRoughness:.095,metalness:0});installSurfaceDetail(m.farWalk142,'stone');
for(let i=0;i<15;i++){
 const z=-3-i*.72,centre=-2.5-.095*i,x0=centre-1.10,x1=centre+1.10,tint=R(.78,1.10);R(-.015,.015);
 const points=[[x0,z-.34],[x1,z-.34],[x1-.05,z+.34],[x0+.02,z+.34]],g=createWornFlagstone(T,{points,topOffset:.022,seed:142800+i*37});if(i>=7)emit(g,'farWalk142',0,towerBenchHeight210(centre,z,hillHeight(centre,z))+.020,0,1,1,1,0,tint); // Actual bench carries the surviving tower walk.
}
function hillHeight(x,z){
 const d=Math.hypot(x+8,(z+20)*1.2),t=T.MathUtils.clamp((20-d)/13,0,1),r=T.MathUtils.clamp((3-x)/6,0,1),raw=L.pagoda.position[1]*t*t*(3-2*t)*r*r*(3-2*r);
 const axis=-2.5+.132*(z+3),side=T.MathUtils.smoothstep(Math.abs(x-axis),1.05,1.65),gate=T.MathUtils.smoothstep(-z,1.5,3)*(1-T.MathUtils.smoothstep(-z,13,17)),walk=.05+Math.max(0,-z-2)*.085;
 return T.MathUtils.lerp(raw,Math.min(raw,walk),(1-side)*gate);
}
const terrainPos=[],terrainUv=[];function terrainP(i,j){const x=-31+i*.75,z=-42+j*.75,h=hillHeight(x,z);return[x,h+.08*Math.sin(x*2.1+z)*Math.min(h,1),z];}for(let j=0;j<64;j++)for(let i=0;i<64;i++){const a=terrainP(i,j),b=terrainP(i+1,j),c=terrainP(i,j+1),d=terrainP(i+1,j+1);for(const p of[a,c,b,b,c,d]){terrainPos.push(...p);terrainUv.push(p[0]*.2,p[2]*.2);}}const terrainGeo=new T.BufferGeometry();terrainGeo.setAttribute('position',new T.Float32BufferAttribute(terrainPos,3));terrainGeo.setAttribute('uv',new T.Float32BufferAttribute(terrainUv,2));terrainGeo.computeVertexNormals();/* Smooth hill replaced by natural193 exact connected triangle field. */
for(let i=0;i<65;i++){const x=R(-16,-1),z=R(-17,-8),h=hillHeight(x,z);group(0,h,0,0,()=>{rock(x,z,R(.45,.90));shrub(x,z,R(.8,1.6));});}
for(const [x,z,h,kind]of[[-4,-12,4.8,'pink'],[-1.6,-15,4.2,'pink'],[-10,-10,4.4,'maple']])group(0,hillHeight(x,z),0,0,()=>tree(x,z,h,kind,1.05));
// The tower hill is planted ground, with an open rain-walk carved into it.
// Each additional evergreen patch and scan contacts this exact new terrain.
const towerHillPlantings142=[];
{const saved=seed;seed=142705;for(let i=0;i<34;i++){
 const x=R(-17,-2.0),z=R(-20,-8),y=hillHeight(x,z),size=R(1.05,1.60);if(circulationReserved125(x,z))continue;
 group(0,y-.025,0,0,()=>{if(i%3===0)rock(x,z,R(.45,.80));shrub(x,z,size);});towerHillPlantings142.push({x,y,z,size,contact:'rooted to authored hill surface outside the winding walk'});
}seed=saved;}

// Small cupped fallen leaves contact the actual mesh or its shallow water.
const fallenLeaves142=[];
function actualPavingHeight142(x,z){
 for(const stone of floorPolygons){const p=stone.points;let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>z)!==(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])yes=!yes;if(yes)return Math.max(wetFilmY,stone.heightAt?stone.heightAt(x,z):stone.topY);}
 return null;
}
for(let i=0;i<65;i++){
 const x=R(-4.3,4.2),z=R(1,18),s=R(.06,.15),yaw=R(0,6.28),tint=R(.7,1.4),height=actualPavingHeight142(x,z);if(height===null)continue;
 const scale=s*.48,rotation=[-Math.PI/2,0,yaw],material=m.mapleAutumn[i%5];emit(mapleLeaf136.leaf,material,x,height+.001,z,scale,scale,scale,rotation,tint);if(i%3===0)emit(mapleLeaf136.veins,m.mapleVeins,x,height+.0011,z,scale,scale,scale,rotation,tint*.7);fallenLeaves142.push({x,z,top:height,leafScale:scale,contact:'Actual stone heightAt or shallow spill level; cupped seven-lobed blade, no flat star'});
}
// Preserve legacy bank random draws; the independent natural193 rebuild replaces their output.
const retiredBankPrior193=suppressGeometry;suppressGeometry=true;
// Four separated, low rock-and-moss islands leave water visible through the arch.
for(const [x,z,sx,sz,top]of[[.55,-3.05,1.18,.92,.82],[2.7,-5.45,1.42,1.04,1.02],[5.15,-3.05,1.22,.93,.88],[7.9,-5.35,1.35,1.06,1.02]]){
 const variant=Math.floor(rand()*8),y=top*.43,sy=top*.86;
 const scan=scannedStones.variants[variant%6];emit(scan.geometry,scan.wet,x,y,z,sx,sy,sz,.3,R(.68,.88));R(.80,1.20);
 const surface=new T.Mesh(scan.geometry,scan.wet);surface.position.set(x,y,z);surface.scale.set(sx,sy,sz);surface.rotation.y=.3;surface.updateMatrixWorld(true);const ray=new T.Raycaster();
 for(let k=0;k<14;k++){
  const xx=x+R(-.66,.66)*sx,zz=z+R(-.56,.56)*sz;ray.set(V([xx,12,zz]),V([0,-1,0]));const hit=ray.intersectObject(surface,false)[0];
  const prior=suppressGeometry;suppressGeometry=prior||k%5!==0;try{if(hit)group(0,hit.point.y-.035,0,0,()=>shrub(xx,zz,R(.66,.92)));}finally{suppressGeometry=prior;}
 }
}
// A single exposed, grounded near-right bank mass replaces the thin-slice
// reading of this margin; it does not consume the garden's shared RNG.
const nearBankOutcrop=buildNearBankOutcrop(scannedStones,emit,{offsetX:L.path.nearBankOffsetX});
// Broken foundation-edge stones follow the real hall frontage and creek line.
// Each scan sits at the waterline; plants only root where rays hit that rock.
const hallShoreline125=[];
{const shorelineSeed=seed;seed=125904;const placements=[[-8.4,6.55,0,.78,.72,.78],[-6.7,6.65,3,.82,.68,.72],[-4.6,6.45,2,1.25,1.45,1.12],[-3.1,6.70,5,1.20,1.45,1.15],[-.7,6.65,1,.82,.72,.78],[1.6,6.75,4,.75,.65,.70]];
 for(const [lx,lz,variant,sx,sy,sz]of placements){
  const [x,,z]=hallToWorld125([lx,0,lz]),scan=scannedStones.variants[variant],yaw=R(-.52,.54),rotation=new T.Matrix4().makeRotationY(yaw).scale(V([sx,sy,sz])),bounds=new T.Box3().setFromBufferAttribute(scan.geometry.attributes.position).applyMatrix4(rotation),y=-.13-bounds.min.y,tint=R(.78,1.05);
  emit(scan.geometry,scan.wet,x,y,z,sx,sy,sz,yaw,tint);
  const surface=new T.Mesh(scan.geometry,scan.wet);surface.position.set(x,y,z);surface.scale.set(sx,sy,sz);surface.rotation.y=yaw;surface.updateMatrixWorld(true);
  const ray=new T.Raycaster();let rooted=0;
  for(let k=0;k<9;k++){const xx=x+R(-.36,.36)*sx,zz=z+R(-.34,.34)*sz;ray.set(V([xx,3,zz]),V([0,-1,0]));const hit=ray.intersectObject(surface,false)[0];if(!hit)continue;group(0,hit.point.y-.028,0,0,()=>shrub(xx,zz,.34));rooted++;}
  hallShoreline125.push({local:[lx,0,lz],world:[x,y,z],variant,scale:[sx,sy,sz],yaw,bottom:bounds.min.y+y,top:bounds.max.y+y,rootedShrubs:rooted,source:'Scanned CC0 shoreline stone; rooted ground cover ray-hit on this stone'});
 }seed=shorelineSeed;}
// Broad evergreen branches interrupt the right facade, as in the photograph.
const stairEmbankment137=createNarrowStairCore207(bridgeHallPlan);
m.embankmentSoil=m.moss.clone();m.embankmentSoil.name='rain-dark-stair-shore-soil';m.embankmentSoil.color.set('#1e2c1d');m.embankmentSoil.roughness=.98;installSurfaceDetail(m.embankmentSoil,'moss');
emit(stairEmbankment137.geometry,'embankmentSoil');
{const bankSeed=seed;seed=137031;let bankBoulders=0,rootedPlants=0;
 const placeBankRock=(u,v,index)=>{
  const p=stairEmbankment137.at(u,v),scan=scannedStones.variants[index%6],sx=.56+R(0,.26),sy=.40+R(0,.25),sz=.54+R(0,.27),yaw=R(0,6.28);
  const bounds=new T.Box3().setFromBufferAttribute(scan.geometry.attributes.position),bottom=p[1]-.22,y=bottom-bounds.min.y*sy;
  emit(scan.geometry,scan.wet,p[0],y,p[2],sx,sy,sz,yaw,.80+R(0,.20));bankBoulders++;
  if(index%4===0&&!circulationReserved125(p[0],p[2])){group(0,p[1]-.025,0,0,()=>shrub(p[0],p[2],.30+R(0,.16)));rootedPlants++;}
 };
 for(const sign of[-1,1])for(let row=0;row<3;row++)for(let j=0;j<13;j++){
  const u=-1.20+j*.48+.12*Math.sin(j*2.4+row),v=sign*([2.05,2.60,3.12][row]+.10*Math.sin(j*1.7+row));
  placeBankRock(u,v,j+row*13+(sign>0?3:0));
 }
 for(let row=0;row<2;row++)for(let j=0;j<6;j++)placeBankRock(-1.40+row*.62+.08*Math.sin(j),-1.55+j*.61,j+row*7);
 stairEmbankment137.info.bankBoulders=bankBoulders;stairEmbankment137.info.rootedPlantGroups=rootedPlants;seed=bankSeed;
}

tree(10.4,-2.7,11.7,'leaf',1.45);
// Rigid scanned stones form a broken shore. Plants root on ray hits of the
// exact transformed stone, outside the circulation and narrow creek channel.
const solmaxRockBank141=[];
{const saved=seed;seed=141019;
 for(const [x,z,variant,scale,rot]of[[-4.8,2.2,1,1.35,[.10,.25,.18]],[4.7,.8,3,1.30,[-.10,-.45,.20]],[1.4,-2.65,4,1.10,[.14,.20,-.16]],[5.6,-1.3,0,1.15,[-.08,.75,.16]],[-4.1,-1.8,2,1.25,[.12,-.20,-.10]],[-.6,-6.8,2,.95,[.12,.25,-.14]],[.8,-7.7,5,1.10,[-.10,-.45,.18]],[1.3,-7.0,1,.85,[.14,.55,-.12]],[-1.9,-6.5,3,.90,[.08,-.30,.14]]]){
  const scan=scannedStones.variants[variant],matrix=new T.Matrix4().makeRotationFromEuler(new T.Euler(...rot)).scale(V([scale,scale,scale])),bounds=new T.Box3().setFromBufferAttribute(scan.geometry.attributes.position).applyMatrix4(matrix),base=z<-5?hillHeight(x,z)-.10:-.12,y=base-bounds.min.y;
  emit(scan.geometry,scan.wet,x,y,z,scale,scale,scale,rot,.88);
  const surface=new T.Mesh(scan.geometry,scan.wet);surface.position.set(x,y,z);surface.scale.setScalar(scale);surface.rotation.set(...rot);surface.updateMatrixWorld(true);const ray=new T.Raycaster();let roots=0;
  for(let j=0;j<9;j++){
   const xx=x+R(-.43,.43)*scale,zz=z+R(-.36,.36)*scale;if(circulationReserved125(xx,zz)||bridgeWaterChannel125(xx,zz))continue;
   ray.set(V([xx,6,zz]),V([0,-1,0]));const hit=ray.intersectObject(surface,false)[0];if(!hit)continue;
   group(0,hit.point.y-.035,0,0,()=>shrub(xx,zz,R(.38,.64)));roots++;
  }
  solmaxRockBank141.push({x,y,z,variant,scale,rotation:rot,bottom:base,top:y+bounds.max.y,rootedShrubs:roots,source:'Existing licensed rigid CC0 scan, unchanged geometry/UVs'});
 }seed=saved;}

suppressGeometry=retiredBankPrior193;
const natural193=buildNatural193({emit,scene,scannedStones,shrubs:shrubs193,groundcover:licensedGroundcover142,pines:licensedPines141,hillHeight,forestHeight:forestHeight141,reserved:circulationReserved125,channel:bridgeWaterChannel125,stairEmbankment:stairEmbankment137,layout:L,mineralMaterial:m.granite,ecologyAnchors207,bearingSurfaces207:foundationRocks207.surfaces});

// Three broken airborne mist bands recede from the bridge toward the ridge.
function mistLayer(x,y,z,width,height,density,phase){
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{density:{value:density},phase:{value:phase}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:detailNoise+`varying vec2 vUv;uniform float density;uniform float phase;void main(){
 float broad=sdFbm(vec3(vUv.x*9.,vUv.y*4.,phase));float detail=sdFbm(vec3(vUv.x*25.,vUv.y*10.,phase+7.));
 float center=.37+.21*sin(vUv.x*5.4+phase)+.16*(broad-.5);float band=exp(-pow((vUv.y-center)/.22,2.));
 float edge=smoothstep(0.,.09,vUv.x)*(1.-smoothstep(.88,1.,vUv.x))*smoothstep(0.,.17,vUv.y)*(1.-smoothstep(.79,1.,vUv.y));
 float cloud=smoothstep(.28,.68,broad+.18*(detail-.5));float alpha=density*edge*band*cloud*(.68+.32*detail);
 vec3 fog=mix(vec3(.56,.61,.64),vec3(.76,.79,.80),smoothstep(.28,.78,broad));gl_FragColor=vec4(fog,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`});
 const layer=new T.Mesh(new T.PlaneGeometry(width,height),material);layer.position.set(x,y,z);layer.renderOrder=1;scene.add(layer);
}
mistLayer(-4,1.55,-10.8,20,3.2,.10,1.4);mistLayer(1.2,3.6,-18,27,4.2,.15,6.3);mistLayer(-5.5,5.5,-29,36,6.4,.12,3.8);
const skyDome=new T.Mesh(new T.SphereGeometry(170,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:`varying vec3 vSky;void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:detailNoise+`varying vec3 vSky;void main(){vec3 d=normalize(vSky);float cloud=.75*sdFbm(vec3(d.x*6.,d.y*18.,d.z*6.)+vec3(0.,3.,0.))+.25*sdFbm(d*31.);vec3 c=mix(vec3(.28,.35,.45),vec3(.82,.87,.92),smoothstep(.25,.75,cloud));c=mix(c,vec3(.67,.73,.78),pow(1.-max(d.y,0.),3.)*.6);gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}` }));skyDome.renderOrder=-10;scene.add(skyDome);
// Soft broad grey sky with stable directional penumbrae.
const hemi=new T.HemisphereLight('#d1dae1','#121b15',.45);scene.add(hemi);const skyLight=new T.DirectionalLight('#d7e2eb',1.48);skyLight.position.set(-15,38,12);skyLight.castShadow=true;skyLight.shadow.mapSize.set(4096,4096);Object.assign(skyLight.shadow.camera,{left:-40,right:40,top:45,bottom:-25,near:1,far:120});skyLight.shadow.bias=-.00005;skyLight.shadow.normalBias=.006;skyLight.shadow.radius=4;scene.add(skyLight);
const envScene=new T.Scene();envScene.background=new T.Color('#bac1c5');envScene.add(new T.HemisphereLight('#dbe1e5','#44473c',3));const envGround=new T.Mesh(new T.SphereGeometry(75,24,16),new T.MeshBasicMaterial({color:'#8e999c',side:T.BackSide}));envScene.add(envGround);const envTop=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshBasicMaterial({color:'#d8dfe4'}));envTop.rotation.x=Math.PI/2;envTop.position.y=35;envScene.add(envTop);const pmrem=new T.PMREMGenerator(renderer);const env=pmrem.fromScene(envScene,.08,.1,120);scene.environment=env.texture;scene.environmentIntensity=.42;pmrem.dispose();
// Three-dimensional adhered rain beads, with water IOR and real highlights.
{let beadSeed=479151;const br=()=>{beadSeed=(Math.imul(beadSeed,1664525)+1013904223)>>>0;return beadSeed/4294967296;};
 for(let k=0;k<1600;k++){const a=-Math.PI*.10+br()*Math.PI*1.2,r=.0014+.0038*br(),rad=L.veranda.radius+r*.32;emit(sphere,'rainDrop',L.veranda.column[0]+Math.cos(a)*rad,L.veranda.shoeHeight+.01+br()*(L.veranda.ceilingY-L.veranda.shoeHeight-.25),L.veranda.column[2]+Math.sin(a)*rad,r,r*(1.0+br()*1.8),r*.65,[0,-a,0]);}
 const qa=V([nearX,nearRail.levels[2]+.09,nearZ+.05]),qb=V([nearRail.returnEnd[0],nearRail.levels[2]+.09,nearRail.returnEnd[2]]);for(let k=0;k<600;k++){const t=br(),q=qa.clone().lerp(qb,t),r=.0016+.0037*br();q.x+=(br()-.5)*.17;emit(sphere,'rainDrop',q.x,q.y,q.z,r,r*.55,r*1.2);}}
// Batch repeated details into InstancedMeshes, merge unique forms per material.
const unique=new Map();let objects=0;for(const b of buckets.values()){if(b.matrix.length===1){let g=b.g.clone();g.applyMatrix4(b.matrix[0]);if(g.index)g=g.toNonIndexed();if(!g.attributes.normal)g.computeVertexNormals();for(const k of Object.keys(g.attributes))if(!['position','normal','uv',...(b.ma.vertexColors?['color']:[])].includes(k))g.deleteAttribute(k);if(b.ma.vertexColors&&!g.attributes.color)g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));let a=unique.get(b.ma);if(!a){a=[];unique.set(b.ma,a);}a.push(g);continue;}const mesh=new T.InstancedMesh(b.g,b.ma,b.matrix.length);for(let i=0;i<b.matrix.length;i++){mesh.setMatrixAt(i,b.matrix[i]);mesh.setColorAt(i,new T.Color().setScalar(b.tint[i]));}mesh.castShadow=b.ma!==m.rainDrop;mesh.receiveShadow=true;scene.add(mesh);objects+=b.matrix.length;}
for(const [ma,gs]of unique){const geometry=mergeGeometries(gs,false);if(!geometry)throw Error('Failed merging '+ma.name);const mesh=new T.Mesh(geometry,ma);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);for(const g of gs)g.dispose();objects+=gs.length;}
// Existing impact draws retain the exact later rain/scene RNG sequence.
const impactCount=55,ringSeeds=[];for(let i=0;i<impactCount;i++)ringSeeds.push({x:R(-3.7,3.7),z:R(2,15),phase:rand(),radius:R(.035,.085)});
const waterRipples135=createWaterFilmRipples135(T,{impacts:ringSeeds,floorWetMap,floorPolygons,scene,filmY:wetFilmY});
const rainPos=[],rainBase=[];for(let i=0;i<1800;i++){const x=R(-21,21),y=R(0,27),z=R(-30,12);if(x< -2.8&&z>0)continue;rainPos.push(x,y,z,x-.055,y-.35,z+.03);rainBase.push(y,y);}
const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.Float32BufferAttribute(rainPos,3));rainGeo.setAttribute('rainBaseHeight',new T.Float32BufferAttribute(rainBase,1));
const rainTime={value:0},rainMaterial=new T.LineBasicMaterial({color:'#c5d0d4',transparent:true,opacity:.17,depthWrite:false});
rainMaterial.onBeforeCompile=shader=>{shader.uniforms.rainTime=rainTime;shader.vertexShader='attribute float rainBaseHeight;uniform float rainTime;varying float vRainFade;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
float fallingBase=mod(rainBaseHeight-rainTime*6.5+270.,27.);transformed.y+=fallingBase-rainBaseHeight;vRainFade=smoothstep(0.,.22,fallingBase)*(1.-smoothstep(26.5,27.,fallingBase));`);shader.fragmentShader='varying float vRainFade;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vRainFade;');};rainMaterial.customProgramCacheKey=()=> 'independently-phased-continuous-rain-v1';
const rain=new T.LineSegments(rainGeo,rainMaterial);scene.add(rain);
function update(time){waterRipples135.update(time);rainTime.value=time;creekMirror207.material.uniforms.creekTime207.value=time;}
const nearEnvironmentTarget=new T.WebGLCubeRenderTarget(512,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter}),nearCubeCamera=new T.CubeCamera(.08,220,nearEnvironmentTarget);nearCubeCamera.position.set(0,2.3,7);let nearEnvironmentReady=false;
function captureNearEnvironment(){
 if(nearEnvironmentReady)return;nearEnvironmentReady=true;if(!renderer.capabilities)return;
 // All real geometry, including gilt surfaces, stays visible to the probe.
 // Its texture is assigned only after capture, so no self-feedback occurs.
 const wasMirror=mirror.visible,wasCreek=creekMirror207.visible;mirror.visible=false;creekMirror207.visible=false;nearCubeCamera.update(renderer,scene);mirror.visible=wasMirror;creekMirror207.visible=wasCreek;renderer.shadowMap.needsUpdate=true;
 for(const mat of[m.gold,m.oldgold,hall132Palette.gold,hall132Palette.oldgold,m.nearLacquer,m.bridgeRed142,m.wetNear,m.wet,m.water,m.farWalk142,m.leaf,...m.mapleAutumn,...scannedStones.variants.map(s=>s.wet),...natural193.materials,...foundationRocks207.materials,m.supportStone207,m.supportRecess207,m.routeStone207,m.pathStone207]){mat.envMap=nearEnvironmentTarget.texture;mat.needsUpdate=true;}
 waterRipples135.setEnvironment(nearEnvironmentTarget.texture);
}
function renderView(position,target,time=0,fov=65){camera.position.fromArray(position);camera.userData.focusDistance=new T.Vector3(...position).distanceTo(new T.Vector3(...target));camera.fov=fov;camera.updateProjectionMatrix();camera.lookAt(...target);camera.updateMatrixWorld(true);update(time);scene.updateMatrixWorld(true);captureNearEnvironment();renderer.info.reset();optics.render(scene,camera);return {position,target,time,fov,width:W,height:H};}
function renderReference(n=10){if(n!==10)throw Error('Only scene 10 exists');return renderView(fixed.position,fixed.target,0,fixed.fov);}
const dolly=createDollyPath({points:[[.25,.24,8.1],[.30,.28,9.8],[-.2,.74,12.8],fixed.position],nearTarget:[0,4.0,-14],farTarget:fixed.target,fov:fixed.fov});
// Negative values are bounded structural QA poses only; positive film timing is unchanged.
function renderShot(localTime=0){if(localTime===-1250)return renderReference(10);if(localTime===-125)return renderView(L.inspection.position,L.inspection.target,0,L.inspection.fov);const p=dolly(localTime);return renderView(p.position,p.target,localTime,p.fov);}
window.temple={ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info:()=>({reference:10,revision:HALL132_REVISION,layout:L,hall132,towerMass183,carvedCloud183:carvedCloud183.info,natural193:natural193.info,support207,bridgeApproach207,pondEdges207,creekReflection207,foundationRocks207:foundationRocks207.info,towerHillPlantings142,fallenLeaves142,pagodaSources141,solmaxRockBank141,licensedForest141:{...licensedPines141.info,use:'Whole source saplings in natural193; old mature crown assembly retired',legacyPlacementRecordsSuppressed193:true,placements:licensedForestPlacements141},mapleCanopy136,waterRipples135:waterRipples135.info,bridgeHallPlan,bridgeEndSupports125,bridgeAbutment125,hallShoreline125,stairEmbankment137:stairEmbankment137.info,pathCurbRecords125,nearStoneRecords,nearBankOutcrop,nearSurfaceReflection:{...nearSurface.info,planeY:mirror.position.y,material:m.wetNear.name,probeReady:nearEnvironmentReady,probePosition:nearCubeCamera.position.toArray(),probeFacePixels:512,probeGeometryExclusions:['Planar reflector only; all physical gilt, wood, foliage and stone remain'],probeIntensity:m.wetNear.envMapIntensity,probeAssigned:m.wetNear.envMap===nearEnvironmentTarget.texture,roughness:m.wetNear.roughness,clearcoat:m.wetNear.clearcoat},licensedGroundcover142:{...licensedGroundcover142.info,placements:groundcoverPlacements142},scannedStone:scannedStones.info,objects,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,camera:fixed,features:['five-storey-pagoda','double-roof-hall','arched-red-bridge','open-arch-end-bearing-piers','closed-stair-treads-stringers-crossheads-and-bearing-pads','recessed-bonded-retaining-terrace','rooted-hall-shoreline-scans','dense-supported-eave-bracket-bays','palmate-autumn-maple-canopy','layered-rain-mist','wet-irregular-solid-slabs','actual-planar-reflections','near-column-and-lantern','gold-finial-near-railing','geometric-foliage-and-rain']}),dispose(){const usedGeometry=new Set(geos),usedMaterials=new Set(),usedTextures=new Set();scene.traverse(o=>{if(o.geometry)usedGeometry.add(o.geometry);for(const mat of(Array.isArray(o.material)?o.material:o.material?[o.material]:[])){usedMaterials.add(mat);for(const value of Object.values(mat))if(value?.isTexture&&value!==env.texture&&value!==nearEnvironmentTarget.texture)usedTextures.add(value);if(mat.userData.floorWetMap)usedTextures.add(mat.userData.floorWetMap);}});for(const g of usedGeometry)g.dispose();for(const mat of usedMaterials)mat.dispose();for(const texture of usedTextures)texture.dispose();optics.dispose();scannedStones.dispose();licensedPines141.dispose();licensedGroundcover142.dispose();nearSurface.texture.dispose();mirror.dispose();creekMirror207.dispose();skyLight.shadow.dispose();env.dispose();nearEnvironmentTarget.dispose();renderer.dispose();renderer.domElement?.remove?.();window.temple.ready=false;}};document.querySelector('#loading').remove();if(!query.has('defer'))renderReference();
