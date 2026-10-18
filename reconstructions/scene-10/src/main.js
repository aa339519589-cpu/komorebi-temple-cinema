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
import {buildNearBankOutcrop} from './near-bank-outcrop.js';
import {createDollyPath} from './dolly-path.js';
import {createOptics} from './optics.js';
const query=new URLSearchParams(location.search),W=Math.min(1800,+(query.get('w')||768)),H=Math.min(1800,+(query.get('h')||768));
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setPixelRatio(1);renderer.setSize(W,H);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.info.autoReset=false;document.body.appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#aeb9be');scene.fog=new T.FogExp2('#a3afb8',.0135);
const camera=new T.PerspectiveCamera(65,W/H,.08,220),fixed={position:[0,1.0,14],target:[0,5.4,-14],fov:60};
const optics=createOptics(renderer,W,H,camera,{fstop:4.8});
let seed=1037;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296},R=(a,b)=>a+(b-a)*rand(),V=a=>new T.Vector3(...a);
const set=createReference4MaterialSet(T),m=set.mats;
const scannedStones=await loadScannedGardenStones();
const graniteLoader=new T.TextureLoader(),graniteNames=['diff','nor_gl','rough'];
const graniteMaps=await Promise.all(graniteNames.map(k=>graniteLoader.loadAsync('/reconstructions/scene-04/assets/granite-tile-04/granite-face-'+k+'.png')));
for(const [i,t]of graniteMaps.entries()){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3.151,3.151);t.anisotropy=8;if(i===0)t.colorSpace=T.SRGBColorSpace;}
m.red.color.set('#65291c');m.red.roughness=.30;m.cedar.color.set('#4e2c1c');m.darkwood.color.set('#211a16');m.slate.color.set('#526573');m.slate.roughness=.36;m.tileEdge.color.set('#64747c');m.tileEdge.roughness=.43;m.gold.color.set('#bd9146');m.gold.roughness=.23;m.stone.color.set('#50554b');m.granite.color.set('#62665b');
m.buddha=m.gold.clone();m.buddha.roughness=.30;m.buddha.color.set('#bf9952');m.plaster.color.set('#97886a');m.paper.color.set('#705637');m.paper.emissive=new T.Color('#ce8435');m.paper.emissiveIntensity=.32;
for(let i=0;i<5;i++){m['window'+i]=m.paper.clone();m['window'+i].color.set(['#342b20','#4f412d','#6c5433','#956838','#c18b44'][i]);m['window'+i].emissiveIntensity=[.012,.05,.14,.32,.75][i];}
m.lanternPaper=m.paper.clone();m.lanternPaper.color.set('#c8a86f');m.lanternPaper.emissive.set('#ffb346');m.lanternPaper.emissiveIntensity=2.2;m.stonePaper=m.lanternPaper.clone();m.stonePaper.emissiveIntensity=1.7;m.stonePaper.emissive.set('#ffaa28');
m.pagodaPaper=m.paper.clone();m.pagodaPaper.color.set('#806344');m.pagodaPaper.emissive.set('#ffac48');m.pagodaPaper.emissiveIntensity=1.35;
m.moss=new T.MeshStandardMaterial({color:'#29391e',roughness:.86});m.leaf=new T.MeshPhysicalMaterial({color:'#354a28',roughness:.38,clearcoat:.60,clearcoatRoughness:.12,side:T.DoubleSide});m.maple=new T.MeshStandardMaterial({color:'#8c1e10',roughness:.48,side:T.DoubleSide});m.pink=new T.MeshStandardMaterial({color:'#a89594',roughness:.8,side:T.DoubleSide});m.black.roughness=.25;m.carvedStone=new T.MeshStandardMaterial({color:'#7b7b6d',roughness:.76,bumpMap:m.granite.bumpMap,bumpScale:.012});installSurfaceDetail(m.carvedStone,'stone');m.leaf.emissive=new T.Color('#122108');m.leaf.emissiveIntensity=.10;m.maple.emissive=new T.Color('#280a02');m.maple.emissiveIntensity=.12;

m.nearLacquer=new T.MeshPhysicalMaterial({color:'#7b2419',map:m.red.map,bumpMap:m.red.bumpMap,bumpScale:.002,roughness:.24,clearcoat:.95,clearcoatRoughness:.055});installSurfaceDetail(m.nearLacquer,'wood');
for(const key of['stone','granite','carvedStone']){m[key].map=graniteMaps[0];m[key].normalMap=graniteMaps[1];m[key].normalScale.set(.58,.58);m[key].roughnessMap=graniteMaps[2];m[key].roughness=.84;m[key].bumpMap=null;m[key].color.set('#b7b4ab');}
m.rainDrop=new T.MeshPhysicalMaterial({name:'actual-rain-droplets',color:'#e6eef0',roughness:.07,metalness:0,ior:1.333,transmission:.92,thickness:.002,clearcoat:1,clearcoatRoughness:.055});
for(const k of['cedar','red','darkwood','endwood'])installSurfaceDetail(m[k],'wood');for(const k of['stone','granite','slate'])installSurfaceDetail(m[k],'stone');installSurfaceDetail(m.moss,'moss');for(const k of['gold','oldgold'])installSurfaceDetail(m[k],'gold');
const buckets=new Map(),stack=[new T.Matrix4()],cube=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(1,1,1,16),sphere=new T.SphereGeometry(1,14,10),geos=new Set([cube,cyl,sphere]);
function emit(g,ma,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0,tint=1){if(typeof g==='string')g=({box:cube,sphere,cylinder:cyl})[g];if(!g?.isBufferGeometry)throw Error('Invalid emitted geometry');ma=typeof ma==='string'?m[ma]:ma;if(!ma)throw Error('Material missing');const e=Array.isArray(rot)?new T.Euler(...rot):new T.Euler(0,rot||0,0);const quaternion=rot?.isQuaternion?rot:new T.Quaternion().setFromEuler(e);const matrix=new T.Matrix4().compose(V([x,y,z]),quaternion,V([sx,sy,sz])).premultiply(stack.at(-1));if(!matrix.elements.every(Number.isFinite))throw Error('Nonfinite emitter transform');let b=buckets.get(g.uuid+ma.uuid);if(!b){b={g,ma,matrix:[],tint:[]};buckets.set(g.uuid+ma.uuid,b);}b.matrix.push(matrix);b.tint.push(tint);geos.add(g);}
const roundedBoxes=new Map();function box(x,y,z,w,h,d,ma='cedar',rot=0,tint=1){if(!(w>0&&h>0&&d>0))return;const r=Math.min(.012,w*.06,h*.06,d*.06),key=[w,h,d,r].map(v=>v.toFixed(4)).join(':');let g=roundedBoxes.get(key);if(!g){g=new RoundedBoxGeometry(w,h,d,1,r);roundedBoxes.set(key,g);}emit(g,ma,x,y,z,1,1,1,rot,tint);}
function group(x,y,z,yaw,fn,scale=1){stack.push(stack.at(-1).clone().multiply(new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromAxisAngle(V([0,1,0]),yaw),V(Array.isArray(scale)?scale:[scale,scale,scale]))));try{fn();}finally{stack.pop();}}
function between(a,b,r,ma='cedar',square=false){a=V(a);b=V(b);const d=b.clone().sub(a),matrix=new T.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(V([0,1,0]),d.clone().normalize()),V([r,d.length(),r])).premultiply(stack.at(-1));let g=square?cube:cyl,key=g.uuid+m[ma].uuid,bk=buckets.get(key);if(!bk){bk={g,ma:m[ma],matrix:[],tint:[]};buckets.set(key,bk);}bk.matrix.push(matrix);bk.tint.push(1);}
const arch=createRestorationArchitecture({instance:emit,box,group,stack,columns:[],roofAudit:[]});
function tube(points,r,ma='slate'){emit(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(V)),Math.max(12,points.length*3),r,7,false),ma);}
function roof(w,d,y,rise,curl=.55){const pp=[],uv=[];const P=(side,t,u)=>{const hw=w/2,hd=d/2,ridge=w*.25,span=ridge+(hw-ridge)*t;let x,z;if(side%2===0){x=u*span;z=(side===0?1:-1)*hd*t;}else{x=(side===1?1:-1)*span;z=u*hd*t;}return [x,y+rise*Math.pow(1-t,1.6)+curl*Math.pow(t,8)*(.25+.75*Math.pow(Math.abs(u),8)),z];};
const tri=(a,b,c)=>{if((b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2])<0)[b,c]=[c,b];for(const p of[a,b,c]){pp.push(...p);uv.push(p[0]*.3,p[2]*.3);}};
for(let side=0;side<4;side++){for(let j=0;j<18;j++)for(let i=0;i<50;i++){let a=P(side,j/18,-1+i/25),b=P(side,j/18,-1+(i+1)/25),c=P(side,(j+1)/18,-1+i/25),d0=P(side,(j+1)/18,-1+(i+1)/25);tri(a,c,b);tri(b,c,d0);}for(let i=0;i<=Math.ceil(w/.25);i++){let u=-1+2*i/Math.ceil(w/.25),pts=[];for(let j=0;j<=14;j++){let p=P(side,j/14,u);p[1]+=.045;pts.push(p);}tube(pts,.045,'slate');}for(let j=0;j<26;j++){const t=(j+1)/26;for(let i=0;i<50;i++){const u=-1+2*i/50,pa=P(side,t,u),pb=P(side,t,u+2/50);pa[1]+=.023;pb[1]+=.023;between(pa,pb,.024,'tileEdge');}}let edge=[];for(let i=0;i<=32;i++)edge.push(P(side,1,-1+i/16));tube(edge,.12,'slate');for(const sign of[-1,1])tube(Array.from({length:20},(_,i)=>P(side,i/19,sign)),.095,'slate');
for(const t of[.35,.53,.71,.88]){for(let j=0;j<32;j++){const a=P(side,t,-1+j/16),b=P(side,t,-1+(j+1)/16);a[1]-=.25;b[1]-=.25;between(a,b,.075,'darkwood',true);}}
// closely spaced visible red rafters and gold end caps
for(let i=0;i<=Math.ceil(w/.19);i++){const u=-1+2*i/Math.ceil(w/.19);for(let j=0;j<16;j++){const a=P(side,.28+.72*j/16,u),b=P(side,.28+.72*(j+1)/16,u);a[1]-=.25;b[1]-=.25;between(a,b,.075,'cedar',true);}const end=P(side,1,u);end[1]-=.25;emit(sphere,'oldgold',end[0],end[1],end[2],.045,.045,.045);}}
const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();emit(g,'slate');box(0,y+rise+.07,0,w*.53,.17,.19,'slate');}
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
 },s);const light=new T.PointLight('#ffb34f',hanging?9:5,5.5,2);light.position.set(x,y,z).applyMatrix4(stack.at(-1));scene.add(light);}
// Five diminishing storeys, broad upturned eaves, glowing small latticed bays.
group(-7.4,7.5,-20,-.10,()=>{box(0,.42,0,8.8,.8,8.8,'stone');for(let l=0;l<5;l++){const s=1-l*.075,y=l*3.45+.55,w=6.2*s;group(0,y,0,0,()=>{arch.pagodaStoreyFrame({w,d:w,y:0,level:l,scale:s,roofWidth:w+3*s,roofDepth:w+3*s,roofRise:2.75*s,roofY:2.9,windowMaterial:'pagodaPaper',detail:true});rail(-w/2-.35,w/2+.35,.35,w/2+.5,.65);arch.pagodaRoof({y:2.9,w:w+3*s,d:w+3*s,rise:2.75*s,wallWidth:w,wallDepth:w,frameScale:s,detail:true});});}const top=.55+4*3.45+2.9+2.75*.7;between([0,top,0],[0,top+6.3,0],.055,'oldgold');for(let i=0;i<20;i++){const yy=top+.4+i*.255;emit(new T.TorusGeometry(.35-i*.011,.036,6,20),'oldgold',0,yy,0,1,1,1,[Math.PI/2,0,0]);}emit(sphere,'gold',0,top+6.12,0,.13,.24,.13);},[.95,.76,.95]);
// Double roof main hall: long gallery, broad dark tiled canopy, deep warm doorway.
group(14,3.6,-14,-.58,()=>{box(0,-1.245,0,20,5.09,12,'stone');for(let j=0;j<17;j++)for(let k=0;k<19;k++){let x=-9.6+k*1.06+(j%2)*.45;box(x,-3.64+j*.30,6.025,1.01,.28,.18,'granite',0,R(.72,1.20));}for(let i=0;i<25;i++){const top=-3.68+i*.204+.105,bottom=-3.789;box(-.8,(top+bottom)*.5,11.6-i*.22,5.8,top-bottom,.6,'granite');}box(0,4.1,-2,18.1,5.4,5.8,'darkwood');for(let level=0;level<2;level++){let base=1.3+level*4.4,top=base+4.1;for(let i=0;i<9;i++){let x=-8.2+i*2.05;if(!(level===0&&(i===3||i===4)))arch.footColumn(x,4.3,base,4.0,.22);arch.brackets(x,top,4.3,.76,{detail:true,interlocked:true});for(let z of[-4,0]){arch.footColumn(x,z,base,4,.20);arch.brackets(x,top,z,.7,{detail:true});}if(i<8){let xx=x+1.025;const material=level===1?'window'+(i%4===2?2:0):'window'+([1,2,1,0,0,3,4,2][i]);if(!(level===0&&(i===2||i===3||i===4)))box(xx,base+1.95,3.28,1.62,3.1,.10,material);if(!(level===0&&(i===2||i===3||i===4)))box(xx,base+.35,3.45,1.75,.65,.16,'red');box(xx,top-.55,3.34,1.75,.72,.16,'plaster');between([xx-.72,top-.82,3.46],[xx+.72,top-.28,3.46],.055,'cedar',true);between([xx+.72,top-.82,3.46],[xx-.72,top-.28,3.46],.055,'cedar',true);if(!(level===0&&(i===2||i===3||i===4))){for(let j=0;j<9;j++)box(xx-.8+j*.2,base+1.95,3.52,.027,3.1,.04,'darkwood');for(let j=0;j<14;j++)box(xx,base+.43+j*.225,3.55,1.7,.024,.04,'darkwood');}}if(!(level===0&&(i===3||i===4)))box(x,base+.15,4.3,.51,.26,.51,'black');}for(let j=0;j<=18;j++){const bx=-9+j;arch.brackets(bx,top+.12,5.15,.54,{detail:true,interlocked:true});for(let k=0;k<3;k++)box(bx,top+.28+k*.15,5.0+k*.30,.60-k*.10,.10,.24,'cedar');}for(const yy of[base+.25,top-.3,top+.18])box(0,yy,4.3,18.5,.25,.29,'red');if(level===1)rail(-9,9,base+.3,5.05,.86);group(0,0,.2,0,()=>roof(level?21.5:23,level?12.9:13.6,top+.65,level?7.7:3.45,level?.4:1.1));}group(-.8,0,0,0,()=>{box(0,3.8,1.0,3.5,4.5,.18,'darkwood');box(0,1.58,0,3.3,.22,3.1,'darkwood');for(const side of[-1,1]){arch.footColumn(0+side*1.15,2.3,1.5,4.0,.13);for(let yy=2.2;yy<5.2;yy+=.35)box(0+side*1.15,yy,2.32,.21,.07,.19,'oldgold');}emitRestoredBuddha(emit,{x:0,y:2.25,z:1.48,scale:.52});emit(new T.LatheGeometry([[.52,0],[.64,.08],[.62,.16],[.48,.24]].map(p=>new T.Vector2(...p)),40),'oldgold',0,2.02,1.48);for(let i=0;i<20;i++){let a=i*Math.PI/10;emit(sphere,'gold',Math.cos(a)*.54,2.15,1.48+Math.sin(a)*.4,.10,.16,.04,[0,-a,0]);}for(let k=0;k<12;k++){let a=k*Math.PI/6;tube([[0+Math.cos(a)*.68,4+Math.sin(a)*.78,1.38],[0+Math.cos(a)*.78,4+Math.sin(a)*.88,1.39]],.018,'oldgold');}for(const x of[-1.8,1.8]){box(x,3.8,4.0,.16,4.5,.15,'gold');}box(0,6.1,4,3.8,.28,.24,'darkwood');tube([[-2.1,5.96,4.14],[-1.3,6.40,4.14],[0,6.58,4.14],[1.3,6.40,4.14],[2.1,5.96,4.14]],.047,'oldgold');for(let k=0;k<17;k++){let x=-1.8+k*.225;for(const sign of[-1,1])tube([[x-.08,6.05,4.15],[x,6.17+sign*.06,4.17],[x+.08,6.08,4.15]],.013,'oldgold');}for(let i=0;i<7;i++)emit(sphere,'oldgold',-1.5+i*.5,6.1,4.2,.19,.09,.035);});for(const x of[-7,-3,5,8])lantern(x,3.5,4.9,.62,true);const light=new T.PointLight('#ffbd75',18,8,2);light.position.set(-.8,3,3);light.applyMatrix4(stack.at(-1));scene.add(light);},[1.12,.95,1.12]);
// A real arched bridge runs diagonally through the garden into the hall.
group(2.7,1.4,-4.2,.12,()=>{const n=40,pp=[],uv=[],P=(t,s,dy=0)=>[-5.25+10.5*t,.25+1.35*Math.sin(Math.PI*(t-.55*t*(1-t)))+.65*t+dy,s];for(let i=0;i<n;i++){const a=P(i/n,-1),b=P((i+1)/n,-1),c=P(i/n,1),d=P((i+1)/n,1);for(const p of[a,c,b,b,c,d]){pp.push(...p);uv.push(p[0],p[2]);}between(a,b,.14,'cedar',true);between(c,d,.14,'cedar',true);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();emit(g,'darkwood');for(const s of[-1.1,1.1]){for(let i=0;i<=10;i++){let p=P(i/10,s);box(p[0],p[1]+.52,s,.13,1.04,.13,'red');emit(sphere,'oldgold',p[0],p[1]+1.10,s,.07,.075,.07);}for(const h of[.25,.6,1.0])tube(Array.from({length:41},(_,i)=>P(i/40,s,h)),.06,'red');}for(const t of[.12,.5,.88]){const p=P(t,0),top=1.4+p[1]-.13,n=Math.ceil(top/.30);for(let j=0;j<n;j++){const h=Math.min(.30,top-j*.30);box(p[0],-1.4+j*.30+h*.5,0,.70,h,1.55,'granite',0,R(.8,1.2));}}for(let j=0;j<9;j++)box(-5.25-j*.30,.22-j*.18,0,.48,.18,2.05,'granite',0,R(.85,1.08));});
for(let i=0;i<10;i++){let t=i/9,x=7.91+(8.5-7.91)*t,z=-4.83+(-8+4.83)*t,y=2.3+(4.7-2.3)*t;box(x,y*.5,z,2.2,y,.50,'granite',.12,R(.8,1.1));}
// Sheltered foreground: a cropped massive lacquer column, black shoe, overhead eave.
group(-3.65,0,7.9,0,()=>{emit(cyl,'nearLacquer',0,4.3,0,.50,8.6,.50);emit(cyl,'black',0,.49,0,.515,.98,.515);emit(createWeatheredBoulderGeometry(T,{scale:[1,.7,1],seed:31,sectors:48,rings:18}),'granite',0,.10,0,.78,.22,.78);box(-1.7,7.9,-1.8,4.5,.33,8.2,'cedar');for(let i=0;i<17;i++){box(-1.6,7.65,-5+i*.47,4.7,.17,.17,'red');for(let j=0;j<5;j++)box(-3.6+j*.96,7.53,-5+i*.47,.28,.22,.29,'darkwood');}box(-3.3,8,-2,1,.6,8,'slate');});lantern(-2.65,6.1,6.35,.76,true);
// One near post and the cropped rail returning toward the camera.
const finialProfile=[[0,0],[.21,0],[.225,.025],[.225,.058],[.204,.078],[.155,.092],[.128,.127],[.145,.157],[.210,.203],[.244,.263],[.236,.318],[.198,.366],[.136,.405],[.082,.435],[.060,.459],[.059,.491],[.040,.527],[0,.566]].map(([r,y])=>new T.Vector2(r,y));
const finialGeo=new T.LatheGeometry(finialProfile,48);
box(3.20,.85,8.0,.31,1.70,.31,'nearLacquer');box(3.2,1.70,8,.43,.11,.43,'black');emit(finialGeo,'gold',3.2,1.76,8);
for(const yy of[1.80,1.88,2.22])emit(new T.TorusGeometry(.205,.016,6,40),'oldgold',3.2,yy,8,1,1,1,[Math.PI/2,0,0]);
// The near handrails return diagonally into the lower-right foreground.
for(const y of[.50,.92,1.54]){
 const a=[3.2,y,8.05],b=[1.91,y,14.2],d=V(b).sub(V(a)),q=new T.Quaternion().setFromUnitVectors(V([0,0,1]),d.clone().normalize());
 emit(new RoundedBoxGeometry(.22,.16,d.length(),2,.028),'nearLacquer',...(V(a).add(V(b)).multiplyScalar(.5)).toArray(),1,1,1,q);
}
// Wet paving is built as individually shaped solid slabs with fine irregular seams.
function noiseTexture(){const N=256,data=new Uint8Array(N*N*4);for(let y=0;y<N;y++)for(let x=0;x<N;x++){let q=R(.30,.70)+.12*Math.sin(x*.08+Math.sin(y*.07));let i=(y*N+x)*4;data[i]=data[i+1]=data[i+2]=Math.round(q*255);data[i+3]=255;}const t=new T.DataTexture(data,N,N);t.needsUpdate=true;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3,3);t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;return t;}
const wetBump=noiseTexture(),wetStone=new T.MeshPhysicalMaterial({color:'#171814',roughness:.39,metalness:0,bumpMap:wetBump,bumpScale:.014,clearcoat:.20,clearcoatRoughness:.075,specularIntensity:.55});const normalBytes=new Uint8Array(256*256*4),heightData=wetBump.image.data;for(let y=0;y<256;y++)for(let x=0;x<256;x++){const h=(dx,dy)=>heightData[(((y+dy+256)%256)*256+(x+dx+256)%256)*4]/255;let dx=(h(1,0)-h(-1,0))*.75,dy=(h(0,1)-h(0,-1))*.75,n=new T.Vector3(-dx,-dy,1).normalize(),i=(y*256+x)*4;normalBytes[i]=(n.x*.5+.5)*255;normalBytes[i+1]=(n.y*.5+.5)*255;normalBytes[i+2]=(n.z*.5+.5)*255;normalBytes[i+3]=255;}const wetNormal=new T.DataTexture(normalBytes,256,256);wetNormal.wrapS=wetNormal.wrapT=T.RepeatWrapping;wetNormal.repeat.set(1.40,1.40);wetNormal.generateMipmaps=true;wetNormal.minFilter=T.LinearMipmapLinearFilter;wetNormal.magFilter=T.LinearFilter;wetNormal.needsUpdate=true;
wetStone.clearcoat=.55;wetStone.clearcoatNormalMap=wetNormal;wetStone.clearcoatNormalScale=new T.Vector2(.86,.86);const lacquerNormal=wetNormal.clone();lacquerNormal.repeat.set(6,5);lacquerNormal.needsUpdate=true;m.nearLacquer.clearcoatNormalMap=lacquerNormal;m.nearLacquer.clearcoatNormalScale=new T.Vector2(.20,.20);
wetStone.map=graniteMaps[0];wetStone.normalMap=graniteMaps[1];wetStone.normalScale.set(.43,.43);wetStone.roughnessMap=graniteMaps[2];wetStone.bumpMap=wetBump;wetStone.bumpScale=.002;wetStone.color.set('#8f9a9d');wetStone.envMapIntensity=1.5;m.wet=wetStone;installSurfaceDetail(wetStone,'wet');
m.wetNear=wetStone.clone();m.wetNear.name='twelve-real-stone-surfaces-with-existing-actual-scene-probe';m.wetNear.envMapIntensity=1.0;installSurfaceDetail(m.wetNear,'wet');
const nearSurfaceBuilder=createNearSurfaceReflectionMask(T);
box(0,-.22,8,9,.06,22,'darkwood');const floorPolygons=[],nearStoneRecords=[],rows=26,cols=8,verts=[];for(let j=0;j<=rows;j++){verts[j]=[];for(let i=0;i<=cols;i++){const t=j/rows,left=-3.9-.65*t,right=1.6+2.81*t;verts[j][i]=[left+(right-left)*i/cols+(i&&i<cols?R(-.13,.13):0),-2+j*.82+(j&&j<rows?R(-.14,.14):0)];};}
m.nearJointGrit=new T.MeshStandardMaterial({name:'near-rain-joint-soil-and-granite-grit',color:'#34372d',map:graniteMaps[0],normalMap:graniteMaps[1],normalScale:new T.Vector2(.26,.26),roughness:.96,roughnessMap:graniteMaps[2]});
for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
 const slabSeed=seed,original=[verts[j][i],verts[j][i+1],verts[j+1][i+1],verts[j+1][i]],hash=Math.sin((j*13+i*37+41)*12.9898)*43758.5453;
 const wetness=.28+.72*(hash-Math.floor(hash)),topOffset=R(-.005,.005),tint=R(.74,1.13);
 for(const points of clipPavingAtDrain(original)){
  const cx=points.reduce((a,p)=>a+p[0],0)/points.length,cz=points.reduce((a,p)=>a+p[1],0)/points.length,shape=new T.Shape();
  const chipped=[];
  points.forEach((p,k)=>{const next=points[(k+1)%points.length];for(let n=0;n<5;n++){
   const t=n/5;let x=p[0]*(1-t)+next[0]*t,z=p[1]*(1-t)+next[1]*t;
   // Inset every piece so the actual dark inter-slab gaps stay legible.
   x+=(cx-x)*.013+R(-.006,.006);z+=(cz-z)*.013+R(-.006,.006);chipped.push([x,z]);
   k||n?shape.lineTo(x,-z):shape.moveTo(x,-z);
  }});
  shape.closePath();
  const id=j+':'+i,near=!!nearRainStoneProfiles[id],g=near?createNearRainFlagstone(T,{points:chipped,topOffset,seed:j*97+i*37+1037,id}):createWornFlagstone(T,{points:chipped,topOffset,seed:j*97+i*37+1037});
  floorPolygons.push({points:near?g.userData.rainStoneFootprint:chipped,wetness,...(near?{edgeFadeMetres:[.002,.009]}:{})});
  if(near){nearSurfaceBuilder.add(g,id);nearStoneRecords.push(g.userData.nearRainStone);for(const bedPoints of clipPavingAtDrain(original)){const bed=createNearJointBed(T,{points:bedPoints,seed:j*97+i*37+1037});emit(bed,'nearJointGrit');}}
  emit(g,near?'wetNear':'wet',0,0,0,1,1,1,0,tint);
 }
 // Keep the existing independent garden layout unchanged by clipping topology.
 seed=slabSeed;for(let k=0;k<42;k++)rand();
}
const floorWetMap=createPavingWetMask(T,floorPolygons);wetStone.userData.floorWetMap=floorWetMap;m.wetNear.userData.floorWetMap=floorWetMap;
const nearSurface=nearSurfaceBuilder.finish();
installNearSurfaceWaterResponse(T,m.wetNear,nearSurface);
// Narrow iron drainage grille crosses the lower frame diagonally.
group(-1.9,-.004,8.5,.46,()=>{box(0,-.105,0,.19,.025,13,'black');for(const side of[-1,1])box(side*.077,0,0,.016,.027,13,'black');for(let i=0;i<215;i++)box(0,0,-6.4+i*.060,.165,.014,.019,'black');});
// Rain-film reflection uses actual geometry and a bounded physical plane.
const mirror=new Reflector(new T.PlaneGeometry(8.9,22),{clipBias:.002,textureWidth:768,textureHeight:768,color:0x808080,multisample:2});mirror.rotation.x=-Math.PI/2;mirror.position.set(-.1,.066,8.5);mirror.material.transparent=true;mirror.material.depthWrite=false;mirror.material.uniforms.floorWetMap={value:floorWetMap};
mirror.material.vertexShader='varying vec3 vFilmPosition;\n'+mirror.material.vertexShader.replace('vUv = textureMatrix * vec4( position, 1.0 );','vUv = textureMatrix * vec4( position, 1.0 );vFilmPosition=(modelMatrix*vec4(position,1.0)).xyz;');
mirror.material.fragmentShader='uniform sampler2D floorWetMap;varying vec3 vFilmPosition;\n'+detailNoise+mirror.material.fragmentShader;
mirror.material.fragmentShader=mirror.material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec3 sp=vFilmPosition;
float film=sdFbm(sp*9.4);vec4 uv=vUv;
// Tiny actual reflection fragments follow stable centimetre ripples.
vec2 rip=vec2(sdNoise(sp*91.),sdNoise(sp*113.+2.3))-.5;
uv.xy+=rip*vec2(.0022,.0048)*uv.w;
vec4 base=texture2DProj(tDiffuse,uv)*.82;vec4 u2=uv;u2.y+=.0016*uv.w;base+=texture2DProj(tDiffuse,u2)*.18;`)
.replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',`vec4 wet=texture2D(floorWetMap,vec2((sp.x+4.6)/9.2,(sp.z+2.)/21.4));
float pave=wet.b,wetPatch=smoothstep(.43,.66,film);
float grazing=pow(1.-clamp(abs(normalize(cameraPosition-sp).y),0.,1.),3.);
float alpha=mix(.17,wet.r*(.19+.71*wet.g)*(.22+.78*wetPatch)*(.30+.70*grazing),pave);
vec2 dp=vec2(sp.x+1.9,sp.z-8.5);float drain=abs(cos(.46)*dp.x-sin(.46)*dp.y);float drainZ=abs(sin(.46)*dp.x+cos(.46)*dp.y);
alpha*=mix(1.,smoothstep(.085,.113,drain),step(drainZ,6.5));
gl_FragColor=vec4(base.rgb,alpha);`);scene.add(mirror);
installNearSurfacePlaneExclusion(T,mirror,nearSurface);
// Shallow garden water, irregular rock-and-moss margins.
m.water=new T.MeshPhysicalMaterial({color:'#33413d',roughness:.18,metalness:.1,clearcoat:1});box(0,-.11,-5,45,.08,37,'water');
const rocks=Array.from({length:8},(_,i)=>createWeatheredBoulderGeometry(T,{scale:[1,.85,1],seed:1703+i*71,sectors:48,rings:22})),rockMoss=rocks.map((g,i)=>createBoulderMossGeometry(T,g,{seed:1703+i*71,offset:.004}));
function rock(x,z,s){const y=s*.32,variant=Math.floor(rand()*8),sy=R(.6,.95)*s,sz=R(.7,1.3)*s,rot=R(0,6),tint=R(.75,1.2);const scan=scannedStones.variants[variant%6];emit(scan.geometry,scan.wet,x,y-.12,z,s,sy,sz,rot,tint);let microSeed=0;for(let k=0;k<48;k++)microSeed=(microSeed+rand()*(k+1)*.723)%1;}
for(let k=0;k<85;k++){const z=R(-23,5),x=(rand()<.45?-1:1)*R(4.5,16);rock(x,z,R(.35,1.45));}for(let k=0;k<16;k++)rock(R(-4,-2),R(-8,-2),R(.2,.6));
// Ornamental stone lanterns have distinct carved shafts, open glowing chambers, hip caps.
function stoneCanopy(){const pp=[],uv=[],N=24;function P(x,z){const t=Math.max(Math.abs(x),Math.abs(z));return [x*.83,2.80+.48*Math.pow(1-t,1.6)+.16*Math.pow(Math.abs(x*z),4)+.012*Math.sin(x*17+z*13),z*.83];}function tri(a,b,c){for(const p of[a,b,c]){pp.push(...p);uv.push(p[0],p[2]);}}for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=P(-1+2*i/N,-1+2*j/N),b=P(-1+2*(i+1)/N,-1+2*j/N),c=P(-1+2*i/N,-1+2*(j+1)/N),d=P(-1+2*(i+1)/N,-1+2*(j+1)/N);tri(a,c,b);tri(b,c,d);}for(let side=0;side<4;side++)for(let j=0;j<N;j++){let u=-1+j*2/N,v=-1+(j+1)*2/N,a=side===0?P(u,-1):side===1?P(1,u):side===2?P(-u,1):P(-1,-u),b=side===0?P(v,-1):side===1?P(1,v):side===2?P(-v,1):P(-1,-v),c=[a[0],a[1]-.13,a[2]],d=[b[0],b[1]-.13,b[2]];tri(a,b,c);tri(b,d,c);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}
const stoneCap=stoneCanopy(),pedestal=new T.LatheGeometry([[.48,0],[.52,.07],[.47,.16],[.31,.25],[.29,.37],[.22,.45],[.18,.59],[.17,1.31],[.24,1.44],[.34,1.51],[.40,1.62],[.38,1.72]].map(p=>new T.Vector2(...p)),12);
function stoneLantern(x,z,s=1){const isNear=x===-2.9,baseY=isNear?1.10:0;group(x,baseY,z,R(-.12,.12),()=>{
 box(0,.12,0,1.08,.24,1.08,'carvedStone');emit(pedestal,'carvedStone',0,.25,0);box(0,1.97,0,.88,.18,.88,'carvedStone');
 // A recessed warm core, four solid corner piers and genuine open apertures.
 emit(new T.CylinderGeometry(.145,.16,.50,12),'stonePaper',0,2.38,0);
 for(const a of[-1,1])for(const b of[-1,1]){box(a*.32,2.38,b*.32,.14,.76,.14,'carvedStone');box(a*.32,2.03,b*.32,.19,.10,.19,'carvedStone');box(a*.32,2.71,b*.32,.19,.10,.19,'carvedStone');}
 for(let f=0;f<4;f++)group(0,0,0,f*Math.PI/2,()=>{box(0,2.08,.35,.58,.13,.13,'carvedStone');box(0,2.72,.35,.70,.14,.13,'carvedStone');for(let j=0;j<5;j++)box(-.24+j*.12,2.38,.35,.015,.55,.024,'darkwood');for(let j=0;j<4;j++)box(0,2.16+j*.145,.36,.52,.014,.022,'darkwood');
 emit(new T.TorusGeometry(.105,.023,6,18),'carvedStone',0,1.45,.19,1,1,1);for(let j=0;j<5;j++)box(-.10+j*.05,1.07,.18,.016,.38,.02,'carvedStone');});
 emit(stoneCap,'carvedStone');for(let i=0;i<17;i++){const a=R(0,6.28),r=R(.18,.75);emit(rocks[i%8],'moss',Math.cos(a)*r,2.87+.3*(1-r),Math.sin(a)*r,R(.10,.24),R(.025,.045),R(.12,.24),R(0,6));}
 emit(new T.LatheGeometry([[.22,0],[.24,.06],[.16,.12],[.15,.20],[.23,.30],[.21,.41],[.10,.50],[.08,.61],[0,.69]].map(p=>new T.Vector2(...p)),14),'carvedStone',0,3.29,0);
 },isNear?[s*.82,1.10,s*.82]:s);const l=new T.PointLight('#ffc981',7*s,5.2,2);l.position.set(x,2.35*(isNear?1.10:s)+baseY,z);scene.add(l);}
stoneLantern(-2.9,-3.0,1.30);for(const [x,z,s]of[[-6,-2.7,.72],[-7.5,-6,.8],[-9,-10,.7],[-2,-7,.64],[4,-10,.75],[10,-1,.65]])stoneLantern(x,z,s);
// All foliage is three-dimensional leaf geometry attached to irregular woody branching.
const leafPos=[],leafUv=[];const leafP=(u,t)=>{const width=Math.sin(Math.PI*t)*.22;return[u*width,Math.sin(Math.PI*t)*.06+Math.abs(u)*.035,(t-.5)*.65];};for(let j=0;j<4;j++)for(let i=0;i<2;i++){const a=leafP(-1+i,j/4),b=leafP(i,j/4),c=leafP(-1+i,(j+1)/4),d=leafP(i,(j+1)/4);for(const p of[a,c,b,b,c,d]){leafPos.push(...p);leafUv.push(p[0],p[2]);}}const leafGeo=new T.BufferGeometry();leafGeo.setAttribute('position',new T.Float32BufferAttribute(leafPos,3));leafGeo.setAttribute('uv',new T.Float32BufferAttribute(leafUv,2));leafGeo.computeVertexNormals();
const mapleShape=new T.Shape();const mp=[[0,.9],[.12,.35],[.46,.65],[.35,.16],[.83,.2],[.38,-.08],[.50,-.40],[.13,-.22],[0,-.63],[-.13,-.22],[-.5,-.4],[-.38,-.08],[-.83,.2],[-.35,.16],[-.46,.65],[-.12,.35]];mp.forEach((p,i)=>i?mapleShape.lineTo(...p):mapleShape.moveTo(...p));mapleShape.closePath();const mapleGeo=new T.ShapeGeometry(mapleShape);mapleGeo.rotateX(Math.PI/2);
const canopyGeos=Array.from({length:7},(_,seed)=>{let g=new T.IcosahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+.16*Math.sin(x*6+seed)*Math.sin(z*6-y*3)+.11*Math.sin(y*8+z*4+seed);p.setXYZ(i,x*n,y*n,z*n);}g.deleteAttribute('normal');g.deleteAttribute('uv');g=mergeVertices(g,1e-5);g.computeVertexNormals();return g;});
for(const [key,color]of[['leafBody','#23321f'],['mapleBody','#661b0f'],['pinkBody','#706968']]){m[key]=new T.MeshStandardMaterial({color,roughness:.89});installSurfaceDetail(m[key],'moss');}
function foliage(cx,cy,cz,r,ma='leaf',n=180){if(ma==='leaf')emit(canopyGeos[Math.floor(rand()*7)],ma+'Body',cx,cy-r*.08,cz,r*.83,r*.32,r*.77,[R(-.18,.18),R(0,6.28),R(-.18,.18)],R(.82,1.16));for(let k=0;k<n;k++){const a=R(0,6.283),rr=Math.sqrt(rand())*r,x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr,y=cy+R(-.33,.35)*r;let s=ma==='maple'?R(.075,.14):R(.20,.37);emit(ma==='maple'?mapleGeo:leafGeo,ma,x,y,z,s,R(.7,1.3)*s,s,[R(-.75,.75),R(0,6.3),R(-.55,.55)],R(.78,1.35));}}
function shrub(x,z,s=1){for(let i=0;i<9;i++){const dx=R(-.55,.55)*s,dz=R(-.55,.55)*s,yy=R(.28,.75)*s;between([x,0,z],[x+dx,yy,z+dz],.015*s,'darkwood');foliage(x+dx,yy,z+dz,.38*s,'leaf',80);}}
for(let k=0;k<130;k++){const z=R(-24,5),x=(rand()<.5?-1:1)*R(4.4,18);shrub(x,z,R(.55,1.6));}
for(let i=0;i<44;i++){const z=R(-6,2),x=(rand()<.5?-1:1)*R(3.1,5.5);shrub(x,z,R(.60,1.20));}
// Tapered bent woody stems branch close to the ground; foliage also grows on intermediate boughs.
const taperCylinder=new T.CylinderGeometry(.47,1,1,9);
function branch(a,b,r){a=V(a);b=V(b);const d=b.clone().sub(a),q=new T.Quaternion().setFromUnitVectors(V([0,1,0]),d.clone().normalize()),e=new T.Euler().setFromQuaternion(q);emit(taperCylinder,'darkwood',...(a.clone().add(b).multiplyScalar(.5)).toArray(),r,d.length(),r,[e.x,e.y,e.z]);}
function tree(x,z,h,ma='leaf',spread=1){const base=[x,-.1,z];function fork(a,dir,len,r,depth){const b=[a[0]+dir[0]*len,a[1]+dir[1]*len,a[2]+dir[2]*len],mid=[(a[0]+b[0])*.5+R(-.15,.15)*len,(a[1]+b[1])*.5,(a[2]+b[2])*.5+R(-.15,.15)*len];branch(a,mid,r);branch(mid,b,r*.72);if(depth===0){foliage(...b,len*.48+spread*.46,ma,ma==='maple'?180:220);return;}if(depth<2)foliage(...b,len*.35+spread*.3,ma,80);for(let i=0;i<3;i++){const ang=R(0,Math.PI*2),d=[dir[0]*.40+Math.cos(ang)*R(.45,.8),R(.5,.85),dir[2]*.40+Math.sin(ang)*R(.45,.8)];fork(b,d,len*R(.59,.76),r*.49,depth-1);}}fork(base,[R(-.16,.16),1,R(-.16,.16)],h*.32,h*.016,3);}
function cedar(x,z,h){const tilt=R(-.05,.05);branch([x,0,z],[x+tilt*h*.96,h*.96,z+.04*h],h*.012);foliage(x+tilt*h*.96,h*.96,z+.04*h,h*.04,'leaf',160);for(let l=0;l<14;l++){const t=l/14,y=h*(.20+t*.76),radius=h*(1-t)*R(.14,.21);for(let i=0;i<5;i++){let a=R(0,6.283),end=[x+tilt*y+Math.cos(a)*radius,y+R(-.2,.4),z+Math.sin(a)*radius];branch([x+tilt*y,y,z],end,h*.005*(1-t));foliage(...end,radius*.40+.16,'leaf',100);}}}
for(let i=0;i<47;i++){const x=R(-43,39),z=R(-62,-34),h=R(15,27);cedar(x,z,h);}
for(const p of[[-15,-14,9],[-17,-23,12],[-5,-29,13],[18,-17,12],[19,-2,10],[-6,-8,7]])tree(...p,'leaf',1.3);
for(const p of[[-12,-7,7],[-5,-13,6],[16,-1,10],[-18,-1,9]])tree(...p,'maple',1.2);tree(6.7,3,14,'maple',1.8);
for(const p of[[-4,-14,5],[-1,-13,5],[-11,-15,6]])tree(...p,'pink',1.1);
// Ferns and wet grasses fill the rocky water margins at a much smaller scale.
for(let i=0;i<270;i++){const x=(rand()<.5?-1:1)*R(3.4,7.7),z=R(-11,3),h=R(.16,.44);for(let j=0;j<7;j++){let a=R(0,6.28),r=R(.08,.32);branch([x,.03,z],[x+Math.cos(a)*r,.03+h,z+Math.sin(a)*r],.005);for(let k=0;k<5;k++){let f=k/5;for(const side of[-1,1])emit(leafGeo,'leaf',x+Math.cos(a)*r*f+Math.cos(a+Math.PI/2)*side*.06,.03+h*f,z+Math.sin(a)*r*f+Math.sin(a+Math.PI/2)*side*.06,.15,.12,.16,[.1,a,side*.25],R(.8,1.2));}}}
for(let i=0;i<26;i++){const z=R(-3,5),edge=1.6+2.81*((z+2)/21.32);rock(edge+R(.2,1.0),z,R(.36,.92));shrub(edge+R(.45,1.15),z,R(.52,.95));}
for(let i=0;i<15;i++){const z=-3-i*.72;box(-2.5,.06,z,2.3,.15,.70,'granite',R(-.015,.015),R(.75,1.08));}
function hillHeight(x,z){const d=Math.hypot(x+8,(z+20)*1.2),t=T.MathUtils.clamp((20-d)/13,0,1);const r=T.MathUtils.clamp((3-x)/6,0,1);return 7.5*t*t*(3-2*t)*r*r*(3-2*r);}
const terrainPos=[],terrainUv=[];function terrainP(i,j){const x=-31+i*.75,z=-42+j*.75,h=hillHeight(x,z);return[x,h+.08*Math.sin(x*2.1+z)*Math.min(h,1),z];}for(let j=0;j<64;j++)for(let i=0;i<64;i++){const a=terrainP(i,j),b=terrainP(i+1,j),c=terrainP(i,j+1),d=terrainP(i+1,j+1);for(const p of[a,c,b,b,c,d]){terrainPos.push(...p);terrainUv.push(p[0]*.2,p[2]*.2);}}const terrainGeo=new T.BufferGeometry();terrainGeo.setAttribute('position',new T.Float32BufferAttribute(terrainPos,3));terrainGeo.setAttribute('uv',new T.Float32BufferAttribute(terrainUv,2));terrainGeo.computeVertexNormals();emit(terrainGeo,'moss');
for(let i=0;i<65;i++){const x=R(-16,-1),z=R(-17,-8),h=hillHeight(x,z);group(0,h,0,0,()=>{rock(x,z,R(.25,.60));shrub(x,z,R(.8,1.6));});}
for(const [x,z,h,kind]of[[-4,-12,4.8,'pink'],[-1.6,-15,4.2,'pink'],[-10,-10,4.4,'maple']])group(0,hillHeight(x,z),0,0,()=>tree(x,z,h,kind,1.05));
for(const [x,z,sx,sz,h]of[[2.3,-4.3,2.0,1.3,1.0],[5.1,-5.1,2.2,1.4,1.2],[7.2,-5.8,2.0,1.6,1.35]]){const scan=scannedStones.variants[3];emit(scan.geometry,scan.wet,x,h*.42,z,sx,h*1.2,sz,.2);const surface=new T.Mesh(scan.geometry,scan.wet);surface.position.set(x,h*.42,z);surface.scale.set(sx,h*1.2,sz);surface.rotation.y=.2;surface.updateMatrixWorld(true);const ray=new T.Raycaster();for(let i=0;i<12;i++){let xx=x+R(-.8,.8)*sx,zz=z+R(-.65,.65)*sz;ray.set(V([xx,15,zz]),V([0,-1,0]));const hit=ray.intersectObject(surface,false)[0],base=hit?hit.point.y-.035:h*.42;group(0,base,0,0,()=>shrub(xx,zz,R(.55,.90)));}}
// Red maple leaves on wet stone: actual tiny lobed meshes lie against the paving.
for(let i=0;i<65;i++){const x=R(-4.3,4.2),z=R(1,18),s=R(.06,.15);emit(mapleGeo,'maple',x,.062,z,s,s,s,[0,R(0,6.28),0],R(.7,1.4));}
// Raised planted banks hide most of the bridge piers. Every plant roots into
// a real irregular stone/soil surface; the path to the left stays open.
for(const [x,z,sx,sz,top]of[[.9,-2.7,1.35,1.2,1.1],[2.8,-2.9,1.6,1.4,1.65],[4.8,-3.6,1.55,1.6,1.75],[6.6,-4.3,1.35,1.6,1.8]]){
 const variant=Math.floor(rand()*8),y=top*.43,sy=top*.86;
 const scan=scannedStones.variants[variant%6];emit(scan.geometry,scan.wet,x,y,z,sx,sy,sz,.3,R(.68,.88));R(.80,1.20);
 const surface=new T.Mesh(scan.geometry,scan.wet);surface.position.set(x,y,z);surface.scale.set(sx,sy,sz);surface.rotation.y=.3;surface.updateMatrixWorld(true);const ray=new T.Raycaster();
 for(let k=0;k<14;k++){
  const xx=x+R(-.66,.66)*sx,zz=z+R(-.56,.56)*sz;ray.set(V([xx,12,zz]),V([0,-1,0]));const hit=ray.intersectObject(surface,false)[0];
  if(hit)group(0,hit.point.y-.035,0,0,()=>shrub(xx,zz,R(.82,1.23)));
 }
}
// A single exposed, grounded near-right bank mass replaces the thin-slice
// reading of this margin; it does not consume the garden's shared RNG.
const nearBankOutcrop=buildNearBankOutcrop(scannedStones,emit);
// Broad evergreen branches interrupt the right facade, as in the photograph.
tree(10.4,-2.7,11.7,'leaf',1.45);
const skyDome=new T.Mesh(new T.SphereGeometry(170,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:`varying vec3 vSky;void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:detailNoise+`varying vec3 vSky;void main(){vec3 d=normalize(vSky);float cloud=.75*sdFbm(vec3(d.x*6.,d.y*18.,d.z*6.)+vec3(0.,3.,0.))+.25*sdFbm(d*31.);vec3 c=mix(vec3(.27,.32,.36),vec3(.72,.77,.80),smoothstep(.25,.75,cloud));c=mix(c,vec3(.64,.69,.71),pow(1.-max(d.y,0.),3.)*.6);gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}` }));skyDome.renderOrder=-10;scene.add(skyDome);
// Soft broad grey sky with stable directional penumbrae.
const hemi=new T.HemisphereLight('#d1dae1','#171e17',.72);scene.add(hemi);const skyLight=new T.DirectionalLight('#d7e2eb',1.15);skyLight.position.set(-15,38,12);skyLight.castShadow=true;skyLight.shadow.mapSize.set(4096,4096);Object.assign(skyLight.shadow.camera,{left:-40,right:40,top:45,bottom:-25,near:1,far:120});skyLight.shadow.bias=-.00005;skyLight.shadow.normalBias=.006;skyLight.shadow.radius=4;scene.add(skyLight);
const envScene=new T.Scene();envScene.background=new T.Color('#bac1c5');envScene.add(new T.HemisphereLight('#dbe1e5','#44473c',3));const envGround=new T.Mesh(new T.SphereGeometry(75,24,16),new T.MeshBasicMaterial({color:'#8e999c',side:T.BackSide}));envScene.add(envGround);const envTop=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshBasicMaterial({color:'#d8dfe4'}));envTop.rotation.x=Math.PI/2;envTop.position.y=35;envScene.add(envTop);const pmrem=new T.PMREMGenerator(renderer);const env=pmrem.fromScene(envScene,.08,.1,120);scene.environment=env.texture;scene.environmentIntensity=.58;pmrem.dispose();
// Three-dimensional adhered rain beads, with water IOR and real highlights.
{let beadSeed=479151;const br=()=>{beadSeed=(Math.imul(beadSeed,1664525)+1013904223)>>>0;return beadSeed/4294967296;};
 for(let k=0;k<1600;k++){const a=-Math.PI*.10+br()*Math.PI*1.2,rad=.501,r=.0014+.0038*br();emit(sphere,'rainDrop',-3.65+Math.cos(a)*rad,.99+br()*5.9,7.9+Math.sin(a)*rad,r,r*(1.0+br()*1.8),r*.65,[0,-a,0]);}
 const qa=V([3.2,1.63,8.05]),qb=V([1.91,1.63,14.2]);for(let k=0;k<600;k++){const t=br(),q=qa.clone().lerp(qb,t),r=.0016+.0037*br();q.x+=(br()-.5)*.17;emit(sphere,'rainDrop',q.x,q.y,q.z,r,r*.55,r*1.2);}}
// Batch repeated details into InstancedMeshes, merge unique forms per material.
const unique=new Map();let objects=0;for(const b of buckets.values()){if(b.matrix.length===1){let g=b.g.clone();g.applyMatrix4(b.matrix[0]);if(g.index)g=g.toNonIndexed();if(!g.attributes.normal)g.computeVertexNormals();for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));let a=unique.get(b.ma);if(!a){a=[];unique.set(b.ma,a);}a.push(g);continue;}const mesh=new T.InstancedMesh(b.g,b.ma,b.matrix.length);for(let i=0;i<b.matrix.length;i++){mesh.setMatrixAt(i,b.matrix[i]);mesh.setColorAt(i,new T.Color().setScalar(b.tint[i]));}mesh.castShadow=b.ma!==m.rainDrop;mesh.receiveShadow=true;scene.add(mesh);objects+=b.matrix.length;}
for(const [ma,gs]of unique){const geometry=mergeGeometries(gs,false);if(!geometry)throw Error('Failed merging '+ma.name);const mesh=new T.Mesh(geometry,ma);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);for(const g of gs)g.dispose();objects+=gs.length;}
// Fixed rain rings remain geometrically stable; time changes expansion smoothly.
const impactCount=55,ringCount=impactCount*2,ringGeo=new T.TorusGeometry(1,.0035,4,64),ringMat=new T.MeshBasicMaterial({color:'#cbd4d4',transparent:true,opacity:.38,depthWrite:false}),rings=new T.InstancedMesh(ringGeo,ringMat,ringCount),ringSeeds=[];rings.rotation.x=-Math.PI/2;for(let i=0;i<impactCount;i++)ringSeeds.push({x:R(-3.7,3.7),z:R(2,15),phase:rand(),radius:R(.035,.085)});scene.add(rings);
const ringAlpha=new T.InstancedBufferAttribute(new Float32Array(ringCount),1);ringGeo.setAttribute('ringCycleAlpha',ringAlpha);
ringMat.onBeforeCompile=shader=>{shader.vertexShader='attribute float ringCycleAlpha;varying float vRingCycleAlpha;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRingCycleAlpha=ringCycleAlpha;');shader.fragmentShader='varying float vRingCycleAlpha;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vRingCycleAlpha;');};ringMat.customProgramCacheKey=()=> 'smooth-rain-ring-cycle-v1';
const rainPos=[],rainBase=[];for(let i=0;i<1800;i++){const x=R(-21,21),y=R(0,27),z=R(-30,12);if(x< -2.8&&z>0)continue;rainPos.push(x,y,z,x-.055,y-.35,z+.03);rainBase.push(y,y);}
const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.Float32BufferAttribute(rainPos,3));rainGeo.setAttribute('rainBaseHeight',new T.Float32BufferAttribute(rainBase,1));
const rainTime={value:0},rainMaterial=new T.LineBasicMaterial({color:'#c5d0d4',transparent:true,opacity:.12,depthWrite:false});
rainMaterial.onBeforeCompile=shader=>{shader.uniforms.rainTime=rainTime;shader.vertexShader='attribute float rainBaseHeight;uniform float rainTime;varying float vRainFade;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
float fallingBase=mod(rainBaseHeight-rainTime*6.5+270.,27.);transformed.y+=fallingBase-rainBaseHeight;vRainFade=smoothstep(0.,.22,fallingBase)*(1.-smoothstep(26.5,27.,fallingBase));`);shader.fragmentShader='varying float vRainFade;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vRainFade;');};rainMaterial.customProgramCacheKey=()=> 'independently-phased-continuous-rain-v1';
const rain=new T.LineSegments(rainGeo,rainMaterial);scene.add(rain);
function update(time){let mat=new T.Matrix4();for(let i=0;i<ringSeeds.length;i++){const q=ringSeeds[i],phase=(time*.36+q.phase)%1,r=q.radius*(.42+phase*1.7),a=T.MathUtils.smoothstep(phase,0,.12)*(1-T.MathUtils.smoothstep(phase,.62,1));for(let j=0;j<2;j++){const rr=r*(j?.72:1);mat.compose(V([q.x,-q.z,.070+j*.0002]),new T.Quaternion(),V([rr,rr,1]));rings.setMatrixAt(i*2+j,mat);ringAlpha.setX(i*2+j,a*(j?.68:1));}}rings.instanceMatrix.needsUpdate=true;ringAlpha.needsUpdate=true;rainTime.value=time;}
const nearEnvironmentTarget=new T.WebGLCubeRenderTarget(256,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter}),nearCubeCamera=new T.CubeCamera(.08,220,nearEnvironmentTarget);nearCubeCamera.position.set(0,2.3,7);let nearEnvironmentReady=false;
function captureNearEnvironment(){if(nearEnvironmentReady)return;nearEnvironmentReady=true;if(!renderer.capabilities)return;const hidden=[];scene.traverse(o=>{if(o.isMesh&&(o.material===m.gold||o.material===m.oldgold)){hidden.push([o,o.visible]);o.visible=false;}});const wasMirror=mirror.visible;mirror.visible=false;nearCubeCamera.update(renderer,scene);mirror.visible=wasMirror;for(const [o,v]of hidden)o.visible=v;renderer.shadowMap.needsUpdate=true;for(const mat of[m.gold,m.oldgold,m.nearLacquer,m.wetNear]){mat.envMap=nearEnvironmentTarget.texture;mat.needsUpdate=true;}}
function renderView(position,target,time=0,fov=65){camera.position.fromArray(position);camera.userData.focusDistance=new T.Vector3(...position).distanceTo(new T.Vector3(...target));camera.fov=fov;camera.updateProjectionMatrix();camera.lookAt(...target);camera.updateMatrixWorld(true);update(time);scene.updateMatrixWorld(true);captureNearEnvironment();renderer.info.reset();optics.render(scene,camera);return {position,target,time,fov,width:W,height:H};}
function renderReference(n=10){if(n!==10)throw Error('Only scene 10 exists');return renderView(fixed.position,fixed.target,0,fixed.fov);}
const dolly=createDollyPath({points:[[-.7,.25,9],[-.75,.34,10.5],[-.2,.85,12.8],fixed.position],nearTarget:[-.8,.067,7.8],farTarget:fixed.target,fov:fixed.fov});
function renderShot(localTime=0){const p=dolly(localTime);return renderView(p.position,p.target,localTime,p.fov);}
window.temple={ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info:()=>({reference:10,revision:'scene10-local-real-surface-probe-and-low-point-water80',nearStoneRecords,nearBankOutcrop,nearSurfaceReflection:{...nearSurface.info,planeY:mirror.position.y,material:m.wetNear.name,probeReady:nearEnvironmentReady,probePosition:nearCubeCamera.position.toArray(),probeIntensity:m.wetNear.envMapIntensity,probeAssigned:m.wetNear.envMap===nearEnvironmentTarget.texture,roughness:m.wetNear.roughness,clearcoat:m.wetNear.clearcoat},scannedStone:scannedStones.info,objects,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,camera:fixed,features:['five-storey-pagoda','double-roof-hall','arched-red-bridge','wet-irregular-solid-slabs','actual-planar-reflections','near-column-and-lantern','gold-finial-near-railing','geometric-foliage-and-rain']}),dispose(){const usedGeometry=new Set(geos),usedMaterials=new Set(),usedTextures=new Set();scene.traverse(o=>{if(o.geometry)usedGeometry.add(o.geometry);for(const mat of(Array.isArray(o.material)?o.material:o.material?[o.material]:[])){usedMaterials.add(mat);for(const value of Object.values(mat))if(value?.isTexture&&value!==env.texture&&value!==nearEnvironmentTarget.texture)usedTextures.add(value);if(mat.userData.floorWetMap)usedTextures.add(mat.userData.floorWetMap);}});for(const g of usedGeometry)g.dispose();for(const mat of usedMaterials)mat.dispose();for(const texture of usedTextures)texture.dispose();optics.dispose();scannedStones.dispose();nearSurface.texture.dispose();mirror.dispose();skyLight.shadow.dispose();env.dispose();nearEnvironmentTarget.dispose();renderer.dispose();renderer.domElement?.remove?.();window.temple.ready=false;}};document.querySelector('#loading').remove();if(!query.has('defer'))renderReference();
