import {loadGardenPlantMeshes,buildScanPlanting} from './scanned-planting144.js';
import {installMeasuredSky} from './sky-radiance144.js';
import {loadForest150,buildForest150} from './forest150.js';
import {buildMomijiFraming151,advanceLegacyMomijiRandom151} from './momiji-framing151.js';
import {buildOccupiedUpperHall152} from './occupied-hall152.js';
import {createHallCorbels153} from './hall-corbels153.js';
import {createGrandFrame182} from './grand-frame182.js';
import {loadCarvedFriezes154} from './carved-friezes154.js';
import {loadScannedFrieze157} from './scanned-frieze157.js';
import {addCourtyardBounce167} from './courtyard-bounce167.js';
const forestLibrary150=await loadForest150();
import {buildHeroPines,advanceLegacyPineRandom148} from './hero-pines158.js';
import {buildReferenceLayout118} from './reference-layout118.js';
import {gardenHeight,gardenTerrainGeometry,gardenShrubShoot,isGardenRoute,GARDEN_REBUILD_REVISION} from './garden-terrain.js';
import {buildGardenAccents} from './garden-accents.js';
import {buildVerandaBell} from './veranda-bell.js';
import {createDollyPath} from '/reconstructions/camera-dolly.js';
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {needleSpray,pineNeedleSpray,fern,leafySprig,watersideReeds,distantCrown,halfBarrel,stoneLanternRoof,barkBranch} from './natural-details.js';
import {createRestorationArchitecture} from './architecture-kernel.js';
import {flagstone} from './reference4-natural-forms.js';
import {buildReference4Sanctuary} from './sanctuary.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {createWeatheredBoulderGeometry,createBoulderMossGeometry} from './boulder.js';
import {installScannedTimber,addTimberExtent} from './scanned-timber.js';
import {loadScannedGardenStones} from './scanned-garden-stones.js';
import {createRoofMaterials,buildPhysicalRoof,physicalRoofHeight153,PHYSICAL_ROOF_REVISION} from './physical-roofs.js';
import {buildForegroundGalleryRoof,FOREGROUND_ROOF_REVISION,FOREGROUND_ROOF_LAYOUT} from './foreground-gallery-roof.js';
import {loadIslandLanternStone,buildIslandStoneLantern} from './island-stone-lantern156.js';
const qp=new URLSearchParams(location.search),W=+(qp.get('w')||innerWidth),H=+(qp.get('h')||innerHeight);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color(0x9bafbd);scene.fog=new T.FogExp2(0xb9a588,.0038);const camera=new T.PerspectiveCamera(46,W/H,.1,350);
let seed=718193;const R=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296),rr=(a,b)=>a+(b-a)*R(),V=a=>new T.Vector3(...a),TAU=Math.PI*2;
const geo={box:new T.BoxGeometry(1,1,1),cyl:new T.CylinderGeometry(1,1,1,12),ball:new T.SphereGeometry(1,10,6),leaf:new T.SphereGeometry(1,5,3),disk:new T.CircleGeometry(1,12),cone:new T.ConeGeometry(1,1,6)};
const mats={},palette={red:[0x8e3524,.55,0],wood:[0x653a25,.74,0],dark:[0x241c18,.85,0],gold:[0xb99550,.42,.76],plaster:[0xe0c9a0,.86,0],tile:[0x41586b,.28,.10],stone:[0x9a9b8e,.9,0],moss:[0x4e6026,.92,0],soil:[0x343c24,1,0],trunk:[0x4b3823,1,0],leaf:[0x314f18,.83,0],leaf2:[0x8a9c3c,.79,0],pink:[0xffd2d7,.76,0],pink2:[0xeaaabb,.78,0],white:[0xeee1c3,.85,0]};
function texture(kind){const n=128,d=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const q=kind==='wood'?.7+.14*Math.sin(x*.9+Math.sin(y*.1)*.4)+.13*R():.7+R()*.3;let i=(y*n+x)*4;d[i]=d[i+1]=d[i+2]=q*255;d[i+3]=255;}const t=new T.DataTexture(d,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true;return t;}
const woodtex=texture('wood'),stonetex=texture('stone');for(const [k,[color,roughness,metalness]]of Object.entries(palette))mats[k]=new T.MeshStandardMaterial({color,roughness,metalness,map:['wood','red','trunk'].includes(k)?woodtex:['stone','tile','soil'].includes(k)?stonetex:null});mats.red=new T.MeshPhysicalMaterial({color:0x733b29,roughness:.48,clearcoat:.20,clearcoatRoughness:.36,map:woodtex,bumpMap:woodtex,bumpScale:.008});mats.ceramicEnd=new T.MeshStandardMaterial({color:0x263239,roughness:.40,metalness:.03});mats.rock=new T.MeshStandardMaterial({color:0x7b7d70,roughness:.87,map:stonetex,bumpMap:stonetex,bumpScale:.07});mats.windowGlow=new T.MeshStandardMaterial({color:0xb9a681,emissive:0xffad36,emissiveIntensity:.18,roughness:.7});mats.glow=new T.MeshStandardMaterial({color:0xffd183,emissive:0xffa83d,emissiveIntensity:.4,roughness:.7});
const scannedTimber=await installScannedTimber(mats);const scannedStones=await loadScannedGardenStones();mats.plinthMortar=new T.MeshStandardMaterial({color:0x515447,roughness:.94,map:stonetex,bumpMap:stonetex,bumpScale:.045});
mats.terraceStone=new T.MeshStandardMaterial({name:'scene07-weathered-cool-terrace-stone',color:0x747d7b,roughness:.94,map:stonetex,bumpMap:stonetex,bumpScale:.025});
mats.gardenShrub=new T.MeshStandardMaterial({name:'scene07-deep-evergreen-bank-leaves',color:0x36522a,roughness:.84,side:T.DoubleSide});mats.gardenShrubLit=mats.gardenShrub.clone();mats.gardenShrubLit.name='scene07-sunlit-evergreen-bank-leaves';mats.gardenShrubLit.color.setHex(0x667a39);
const batches=new Map();let transform=new T.Matrix4();const stk=[];function emit(g,m,x,y,z,sx=1,sy=1,sz=1,rot=[0,0,0],tint=1){m=typeof m==='string'?mats[m]:m;const mx=new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromEuler(new T.Euler(...rot)),V([sx,sy,sz])).premultiply(transform);const key=g.uuid+m.uuid;let b=batches.get(key);if(!b){b={g,m,items:[]};batches.set(key,b);}b.items.push([mx,tint]);}
const timberBoxes152=new Map();
function box(x,y,z,w,h,d,m='wood',rot=[0,0,0],tint=1){
 const material=typeof m==='string'?mats[m]:m;
 if(material?.userData?.scannedTimber){
  const key=[w,h,d].map(v=>v.toFixed(4)).join(','),radius=Math.min(.014,w*.12,h*.12,d*.12);
  if(!timberBoxes152.has(key))timberBoxes152.set(key,new RoundedBoxGeometry(w,h,d,2,radius));
  emit(timberBoxes152.get(key),material,x,y,z,1,1,1,rot,tint);
 }else emit(geo.box,material,x,y,z,w,h,d,rot,tint);
}
function group(x,y,z,a,s,fn){stk.push(transform);transform=transform.clone().multiply(new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromEuler(new T.Euler(0,a,0)),V([s,s,s])));fn();transform=stk.pop();}
const taperGeos=new Map();function rod(a,b,r,m='wood',r2=r){const ratio=Math.round(r2/r*16)/16;let g=geo.cyl;if(r!==r2){if(!taperGeos.has(ratio))taperGeos.set(ratio,new T.CylinderGeometry(ratio,1,1,9));g=taperGeos.get(ratio);}const p=V(a),q=V(b),dif=q.clone().sub(p);const mx=new T.Matrix4().compose(p.add(q).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(V([0,1,0]),dif.clone().normalize()),V([r,dif.length(),r])).premultiply(transform);const key=g.uuid+mats[m].uuid;let e=batches.get(key);if(!e){e={g,m:mats[m],items:[]};batches.set(key,e);}e.items.push([mx,1]);}
function tube(points,r,m='gold'){const c=new T.CatmullRomCurve3(points.map(V));emit(new T.TubeGeometry(c,Math.max(8,points.length*4),r,6,false),m,0,0,0);}
function sphere(x,y,z,sx,sy,sz,m){emit(geo.ball,m,x,y,z,sx,sy,sz);}
function ring(x,y,z,r,t,m='gold'){emit(new T.TorusGeometry(r,t,5,16),m,x,y,z,1,1,1,[Math.PI/2,0,0]);}
let arch;
function column(x,z,y,h,r=.23){arch.footColumn(x,z,y,h-.30,r);}
function bracket(x,y,z,s=1,options={}){arch.brackets(x,y,z,s,{detail:true,...options});}
function rail(points,height=.9){for(let i=0;i<points.length;i++){const [x,y,z]=points[i];box(x,y+height/2,z,.15,height,.15,'red');emit(geo.cyl,'gold',x,y+height+.05,z,.105,.12,.105);sphere(x,y+height+.16,z,.10,.13,.10,'gold');if(i){const p=points[i-1];for(const h of[.22,height-.1])rod([p[0],p[1]+h,p[2]],[x,y+h,z],.065,'red');for(let j=1;j<=2;j++){const t=j/3;box(p[0]+(x-p[0])*t,p[1]+(y-p[1])*t+height*.5,p[2]+(z-p[2])*t,.055,height*.56,.055,'red');}}}}
// Each ceramic ridge is made of overlapping half-round segments; four curved roof surfaces join at the hips.
const halfTile=halfBarrel(10),nearHalfTile=halfBarrel(24,TAU);
function tile(a,b,r=.07,near=false){const tileGeometry=near?nearHalfTile:halfTile;const p=V(a),q=V(b),z=q.clone().sub(p),l=z.length();z.normalize();const x=V([0,1,0]).cross(z).normalize(),y=z.clone().cross(x).normalize();let mx=new T.Matrix4().makeBasis(x,y,z).scale(V([r,r,l])).setPosition(p.add(q).multiplyScalar(.5).addScaledVector(y,near?r*.75:0)).premultiply(transform);const key=tileGeometry.uuid+mats.tile.uuid;let e=batches.get(key);if(!e){e={g:tileGeometry,m:mats.tile,items:[]};batches.set(key,e);}e.items.push([mx,rr(.85,1.14)]);}
const medallionRing=new T.TorusGeometry(.116,.014,6,24),medallionPetal=new T.TorusGeometry(.040,.009,5,14);
function roof(w,d,e,rise,curl=.5,near=false,gabled=false){const ridge=w*(gabled?.20:.24),hw=w/2,hd=d/2;const P=(side,t,u)=>{const span=ridge+(hw-ridge)*(gabled?Math.max(0,(t-.45)/.55):t);return side%2?[side===1?span:-span,e+rise*Math.pow(Math.max(0,1-t),1.65)+curl*Math.pow(t,7)*(.2+.8*Math.pow(Math.abs(u),5)),u*hd*t]:[u*span,e+rise*Math.pow(Math.max(0,1-t),1.65)+curl*Math.pow(t,7)*(.2+.8*Math.pow(Math.abs(u),5)),side===0?hd*t:-hd*t];};
for(let s=0;s<4;s++){if(near&&s!==0)continue;const p=[],uv=[];const nu=32,nt=18;for(let j=0;j<nt;j++)for(let i=0;i<nu;i++){if(gabled&&s%2===1&&j/nt<.44)continue;const a=P(s,j/nt,-1+i*2/nu),b=P(s,j/nt,-1+(i+1)*2/nu),c=P(s,(j+1)/nt,-1+i*2/nu),d=P(s,(j+1)/nt,-1+(i+1)*2/nu);for(const v of[a,c,b,b,c,d]){p.push(...v);uv.push(v[0],v[2]);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();const ma=mats.tile.clone();ma.side=T.DoubleSide;emit(g,ma,0,0,0);const n=Math.ceil((s%2?d:w)/(near?.54:.19));for(let i=0;i<=n;i++){const u=-1+2*i/n;const steps=near?9:18;for(let j=0;j<steps;j++){if(gabled&&s%2===1&&j/steps<.44)continue;tile(P(s,j/steps,u),P(s,(j+1.015)/steps,u),near?.25:.07,near);}const ep=P(s,1,u);arch.tileEnd(V(ep),s*Math.PI/2,near?.24:.075,i%3===0);if(near&&s%2===0){for(const tt of[.20,.42]){const cp=P(s,tt,u),ra=P(s,Math.max(0,tt-.14),u),rb=P(s,tt,u);ra[1]+=.32;rb[1]+=.32;tile(ra,rb,.28,true);group(cp[0],cp[1]+.53,cp[2]+(s===0?.19:-.19),s*Math.PI/2,1,()=>{transform.multiply(new T.Matrix4().makeRotationX(-.65));emit(geo.cyl,'ceramicEnd',0,0,.015,.24,.10,.24,[Math.PI/2,0,0]);emit(medallionRing,'gold',0,0,.061);for(let k=0;k<5;k++){const a=k*TAU/5;emit(medallionPetal,'gold',Math.cos(a)*.050,Math.sin(a)*.050,.063,1,1,1,[0,0,a]);}rosette(0,0,.073,.041);});}}const a=P(s,.82,u),b=P(s,1.035,u);a[1]-=.22;b[1]-=.22;rod(a,b,.065,'red');}for(let j=0;j<40;j++){const a=P(s,1,-1+j*.05),b=P(s,1,-1+(j+1)*.05);a[1]-=.14;b[1]-=.14;rod(a,b,.10,'wood');}for(const sign of[-1,1]){tube(Array.from({length:20},(_,j)=>P(s,j/19,sign)),.10,'tile');}}
if(gabled){const low=e+rise*Math.pow(.55,1.65)-.1;for(const sign of[-1,1]){const pp=[],zz=d*.5*.45;for(let i=0;i<40;i++){const za=-zz+i*2*zz/40,zb=-zz+(i+1)*2*zz/40,ya=e+rise*Math.pow(1-Math.abs(za)/(d*.5),1.65),yb=e+rise*Math.pow(1-Math.abs(zb)/(d*.5),1.65);for(const q of[[sign*ridge,low,za],[sign*ridge,ya,za],[sign*ridge,low,zb],[sign*ridge,ya,za],[sign*ridge,yb,zb],[sign*ridge,low,zb]])pp.push(...q);}const wall=new T.BufferGeometry();wall.setAttribute('position',new T.Float32BufferAttribute(pp,3));wall.computeVertexNormals();const ma=mats.dark.clone();ma.onBeforeCompile=mats.dark.onBeforeCompile;ma.customProgramCacheKey=mats.dark.customProgramCacheKey;ma.side=T.DoubleSide;emit(wall,ma,0,0,0);for(let i=0;i<=14;i++){const z=-zz+2*zz*i/14,top=e+rise*Math.pow(1-Math.abs(z)/(d*.5),1.65)-.13;box(sign*(ridge+.03),(low+top)/2,z,.13,Math.max(.03,top-low),.11,'red');for(let y=low+.25;y<top;y+=.38)box(sign*(ridge+.06),y,z,.05,.055,.20,'gold');}tube(Array.from({length:41},(_,i)=>{const z=-zz+2*zz*i/40;return[sign*(ridge+.04),e+rise*Math.pow(1-Math.abs(z)/(d*.5),1.65),z];}),.12,'red');rod([sign*(ridge+.04),low,-zz],[sign*(ridge+.04),low,zz],.1,'wood');}}box(0,e+rise+.13,0,ridge*2+.15,.25,.28,'tile');if(!near)for(let i=-Math.floor(ridge/.5);i<=Math.floor(ridge/.5);i++)sphere(i*.5,e+rise+.2,.16,.08,.08,.035,'gold');for(const s of[-1,1])tube([[s*ridge,e+rise+.1,0],[s*(ridge+.2),e+rise+.3,0],[s*(ridge+.23),e+rise+.65,0],[s*(ridge+.08),e+rise+.8,0]],.075,'gold');}
function lattice(x,y,z,w,h){box(x,y,z,w,h,.15,'dark');box(x,y,z+.09,w-.1,h-.1,.03,'windowGlow');for(let i=0;i<13;i++)box(x-w/2+i*w/12,y,z+.13,.025,h,.035,'wood');for(let j=0;j<19;j++)box(x,y-h/2+j*h/18,z+.13,w,.025,.035,'wood');}
const masonryForms=Array.from({length:7},(_,i)=>flagstone(103+i*17));
const keyAlias={cedar:'wood',endwood:'wood',darkwood:'dark',oldgold:'gold',slate:'tile',tileEdge:'tile',black:'dark'};
arch=createRestorationArchitecture({instance(g,m,x,y,z,sx,sy,sz,rot,tint){emit(g,keyAlias[m]||m,x,y,z,sx,sy,sz,Array.isArray(rot)?rot:[0,rot||0,0],tint);},group(x,y,z,a,fn,sc=1){group(x,y,z,a,sc,fn);},box(x,y,z,w,h,d,m,rot=0,tint=1){box(x,y,z,w,h,d,keyAlias[m]||m,Array.isArray(rot)?rot:[0,rot||0,0],tint);},roofAudit:[]});
const carvedFriezes154=await loadCarvedFriezes154({emit,mats});
const scannedFrieze157=await loadScannedFrieze157({emit,mats});
const roofMaterials=createRoofMaterials(),physicalRoofAudits=[];
const hallCorbels153=createHallCorbels153({emit,box,group,mats});
const grandFrame182=createGrandFrame182({emit,box,group,mats});
const lowerRoof153={w:16.2,d:16,e:7.38,rise:1.37,curl:.48},upperRoof153={w:14.8,d:18.7,e:10.6,rise:6.15,curl:.65,gabled:true};
function hallEaveFrame153(x,z,bottom,nominalHead,radius,upper=false){
 const spec=upper?upperRoof153:lowerRoof153,centreX=upper?.35:0,centreZ=upper?-3:-2;
 const forward=z>0?1:-1;
 // Fit the top of the outer two cantilever seats to the same roof equation
 // used by actual tiles and receivers, including the falling corner hips.
 const roofBottom=Math.min(...[x-.62,x,x+.62].map(xx=>physicalRoofHeight153(spec,xx-centreX,z+forward*.77-centreZ)-.40));
 grandFrame182.frame(x,z,bottom,roofBottom,radius,{front:forward,upper});
}
mats.tile=roofMaterials.ceramic;
function physicalRoof(spec,oldDimensions){
  physicalRoofAudits.push(buildPhysicalRoof({emit,box,rod,bracket,materials:roofMaterials},spec));
  // Keep the established downstream garden sequence exactly registered.
  // The former roof used one random tint per individual cylindrical segment.
  const [w,d,gabled=false]=oldDimensions;
  for(let face=0;face<4;face++){const n=Math.ceil((face%2?d:w)/.19);for(let i=0;i<=n;i++)for(let j=0;j<18;j++)if(!(gabled&&face%2===1&&j/18<.44))R();}
}
function rosette(x,y,z,r=.09){for(let i=0;i<8;i++){const a=i*TAU/8;emit(geo.ball,'gold',x+Math.cos(a)*r*.5,y+Math.sin(a)*r*.5,z,r*.45,r*.17,r*.09,[0,0,a]);}sphere(x,y,z+.005,r*.22,r*.22,r*.12,'gold');}
function carvedPanel(x,y,z,w,h){if(w>1.5){box(x,y,z,w,h,.10,'wood');box(x,y,z+.06,w-.07,h-.035,.028,'dark');if(Math.abs(x)<.2&&h>.32)scannedFrieze157.panel(x,y,z+.08,w-.12,h-.045);else carvedFriezes154.panel(x,y,z+.09,w-.12,h-.045);return;}box(x,y,z,w,h,.10,'wood');box(x,y,z+.06,w-.08,h-.08,.035,'dark');for(const yy of[-h/2+.05,h/2-.05])box(x,y+yy,z+.09,w-.12,.026,.025,'gold');for(const xx of[-w/2+.05,w/2-.05])box(x+xx,y,z+.09,.026,h-.12,.025,'gold');for(const side of[-1,1])for(let j=0;j<3;j++){const xx=x+side*w*(.16+j*.105);tube([[xx-side*w*.09,y-h*.23,z+.085],[xx-side*w*.05,y+h*.18,z+.1],[xx+side*w*.04,y+h*.11,z+.1],[xx+side*w*.07,y-h*.19,z+.085]],.015,'gold');}rosette(x,y,z+.12,Math.min(.14,h*.33));}
function hangingLamp(x,y,z,anchor){rod([x,anchor,z],[x,y+.40,z],.012,'gold');const bottom=new T.LatheGeometry([new T.Vector2(.08,0),new T.Vector2(.24,.05),new T.Vector2(.26,.12),new T.Vector2(.20,.18)],6),top=new T.LatheGeometry([new T.Vector2(.19,0),new T.Vector2(.28,.10),new T.Vector2(.22,.19),new T.Vector2(.06,.25)],6);emit(bottom,'gold',x,y-.36,z);emit(top,'gold',x,y+.29,z);for(let k=0;k<6;k++){const a=k*TAU/6,xx=x+Math.cos(a)*.21,zz=z+Math.sin(a)*.21;rod([xx,y-.20,zz],[xx,y+.31,zz],.020,'gold');group(x,y,z,-a+Math.PI/2,1,()=>{box(0,.035,.175,.18,.45,.018,'windowGlow');for(const xx of[-.06,0,.06])box(xx,.035,.19,.009,.45,.014,'gold');for(const yy of[-.13,.02,.17])box(0,yy,.19,.18,.009,.014,'gold');});}sphere(x,y-.43,z,.055,.10,.055,'gold');const l=new T.PointLight(0xffb34e,17,8,2);l.position.copy(V([x,y,z]).applyMatrix4(transform));scene.add(l);}
let occupiedHall152;
function hall(){group(4.6,5.0,-9,-.25,1,()=>{transform.multiply(new T.Matrix4().makeScale(1,.88,1));
// The hall floor is above a shallow retaining course embedded in the actual
// bank. Its capped wall and the shortened lower storey share one floor datum.
box(0,1.37,-.4,16.1,2.74,10.6,'plinthMortar');box(0,2.76,-.4,16.4,.15,10.9,'terraceStone');
for(let row=0;row<7;row++)for(let col=0;col<20;col++){const x=-7.65+col*.80+(row%2)*.40;if(x>7.85)continue;const v=scannedStones.variants[(row*3+col*5)%6],s=.42+rr(-.018,.018);emit(v.geometry,v.dry,x,.08+row*.42,4.95,s,s,s,[0,(col%2)*.13,rr(-.035,.035)],rr(.80,1.10));}
// Entire stone stair, landing and its rail are built as one continuous route in layout118.
// Deep interior wall, lacquered beams, actual side passage and thick front columns.
box(0,4.76,-4.65,14.4,4.05,.25,'dark');for(const x of[-7.1,7.1])box(x,4.76,-.7,.2,4.05,8,'wood');
for(const z of[-3.9,3.7])for(const x of[-6.9,-4.6,-2.3,2.3,4.6,6.9])hallEaveFrame153(x,z,2.85,6.55,.31);
for(const z of[-1.2,1.2])for(const x of[-6.9,-2.3,2.3,6.9]){column(x,z,2.85,3.65,.22);bracket(x,6.4,z,.72);}
for(const yy of[5.75,6.12,6.42])box(0,yy,3.7,14.9,yy===6.12?.32:.19,.46,'red');
for(let i=-3;i<3;i++)carvedPanel((i+.5)*2.30,6.13,3.96,1.80,.24);
for(const x of[-5.8,-3.5,3.5,5.8]){lattice(x,4.08,.75,1.25,2.15);carvedPanel(x,5.4,.92,1.8,.43);}
for(const x of[-2.1,2.1]){box(x,4.3,1.9,.18,3.0,.35,'gold');for(let j=0;j<11;j++)rosette(x,2.95+j*.27,2.13,.085);}
carvedPanel(0,5.6,3.90,1.9,.36);for(const x of[-5.7,-2.6,2.6,5.7])hangingLamp(x,4.7,3.8,6.55);
for(let ix=-5;ix<=5;ix++)for(let iz=0;iz<5;iz++){box(ix*1.25,6.05,-3+iz*1.2,1.1,.08,1.04,'dark');rosette(ix*1.25,6.0,-3+iz*1.2,.08);}
group(0,0,-2,0,1,()=>physicalRoof({w:16.2,d:16,e:7.38,rise:1.37,curl:.48,label:'hall-lower-roof',innerCollar:{minX:-6.70,maxX:6.70,minZ:-2.70,maxZ:4.65,topY:8.48},supports:[{xs:[-6.9,-4.6,-2.3,2.3,4.6,6.9],z:5.7,head:7.14},{xs:[-6.9,-4.6,-2.3,2.3,4.6,6.9],z:-1.9,head:7.14}]},[17.5,16]));
occupiedHall152=buildOccupiedUpperHall152({box,group,column,bracket,carvedPanel,lattice,rail,eaveFrame:(x,z,bottom,head,r)=>hallEaveFrame153(x,z,bottom,head,r,true)});
group(.35,0,-3,0,1,()=>physicalRoof({w:14.8,d:18.7,e:10.6,rise:6.15,curl:.65,gabled:true,label:'hall-upper-irimoya-roof',supports:[{xs:[-7.01,-4.79,-2.57,-.35,1.87,4.09,6.31],z:6.4,head:11.10},{xs:[-7.01,-4.79,-2.57,-.35,1.87,4.09,6.31],z:-1.55,head:11.10}]},[17.5,18.7,true]));
});
const sanctuary=buildReference4Sanctuary(T,{floorY:2.85});sanctuary.group.position.set(4.971,7.50,-10.453);sanctuary.group.rotation.y=-.25;sanctuary.group.scale.set(.84,.78,.84);scene.add(sanctuary.group);
for(const x of[2.3,6.9]){const l=new T.PointLight(0xffb24f,18,12,2);l.position.set(x,8.5,-6);scene.add(l);}
}
function tower(){group(-13.2,6.9,-12.8,0,1,()=>{transform.multiply(new T.Matrix4().makeScale(.82,.83,.82));box(0,-2.85,0,6,6.3,6,'plinthMortar');
// The plinth is a real irregular stone wall, using the scan's preserved UVs.
const jitter=n=>{const q=Math.sin(n*127.1+913.7)*43758.5453;return q-Math.floor(q);};
for(let face=0;face<2;face++)group(0,0,0,face*Math.PI/2,1,()=>{for(let row=0;row<24;row++)for(let col=0;col<8;col++){const x=-2.88+col*.82+(row%2)*.41;if(x>2.90)continue;const id=(row*3+col*5+face)%scannedStones.variants.length,v=scannedStones.variants[id],q=jitter(row*31+col*7+face*101);const scale=.39+q*.025;emit(v.geometry,v.dry,x,-5.84+row*.26,3.04,scale,scale,scale,[0,(v.extent.z>v.extent.x?Math.PI/2:0)+(q-.5)*.10,(q-.5)*.04],.85+q*.15);}});
// Tier datums are rebuilt as real floor/frame sections. The spire tip and
// tower placement stay fixed; reducing the naked upper wall intervals leaves
// room for the longer physical finial seen above the compact top roof.
const ys=[3.7,6.4,9.05,11.65,14.2],ws=[8.1,7.75,7.35,6.95,6.55],oldWs=[8.7,8.3,7.8,7.35,6.85];
for(let l=0;l<5;l++){
  const y=ys[l],w=ws[l],floor=l?ys[l-1]+.61:.6,b=w*.64,core=b*.74;
  box(0,(y+floor)/2,0,core,y-floor-.08,core,'dark');
  box(0,floor-.035,0,b+.46,.18,b+.46,'wood');
  box(0,floor+.075,0,b+.34,.065,b+.34,'red');
  // The recessed enclosure and actual lattice/boarding are built on all four
  // sides, including the formerly bare right face visible from the camera.
  for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,1,()=>{
    for(let bay=-1;bay<=1;bay++){
      const x=bay*core*.31;
      lattice(x,(floor+y)/2-.04,core/2+.025,core*.245,(y-floor)*.56);
      box(x,floor+.20,core/2+.015,core*.28,.29,.10,'red');
      box(x,y-.38,core/2+.015,core*.28,.25,.10,'red');
    }
    for(const xx of[-core/2,-core/6,core/6,core/2])box(xx,(floor+y)/2,core/2+.085,.095,y-floor,.13,'red');
    rail(Array.from({length:9},(_,i)=>[-b*.54+i*b*1.08/8,floor+.04,b/2+.20]),.55);
    for(const yy of[y-.70,y-.38])box(0,yy,b/2,b+.36,.17,.27,'red');
    for(let k=0;k<9;k++)bracket(-b*.48+k*b*.96/8,y-.48,b/2,.44,{interlocked:true});
  });
  const posts=new Set();for(const z of[-b/2,b/2])for(const x of[-b/2,0,b/2])posts.add(x+','+z);for(const x of[-b/2,b/2])posts.add(x+',0');
  for(const p of posts){const [x,z]=p.split(',').map(Number);column(x,z,floor,y-floor-.30,.14);bracket(x,y-.32,z,.68,{interlocked:true});}
  physicalRoof({w,d:w,e:y,rise:1.12,curl:.48,pagoda:true,label:'pagoda-tier-'+(l+1),supports:[{xs:[-b/2,0,b/2],z:b/2,head:y+.23},{xs:[-b/2,0,b/2],z:-b/2,head:y+.23}]},[oldWs[l],oldWs[l]]);
}
rod([0,15.25,0],[0,21.4,0],.065,'gold');
for(let j=0;j<17;j++)ring(0,15.60+j*.32,0,.56-j*.023,.035);
for(const yy of[15.36,15.48])box(0,yy,0,.49,.10,.49,'gold');
sphere(0,21.4,0,.13,.26,.13,'gold');});}
hall();tower();
// Roofed galleries fill the actual complex, including the left courtyard pavilion.
function gallery(x,z,w,rot=0){group(x,4,z,rot,1,()=>{box(0,-.65,0,w,3.3,3.2,'stone');for(let row=0;row<14;row++)for(let col=0;col<Math.ceil(w/.66);col++){const xx=-w/2+.33+col*.66+(row%2)*.17;if(xx>w/2-.2)continue;emit(masonryForms[(row+col)%7],'stone',xx,-2.13+row*.23,1.69,.64,.225,.32,[0,0,0],rr(.72,1.06));}for(let i=0;i<=Math.ceil(w/1.7);i++){const xx=-w/2+i*w/Math.ceil(w/1.7);column(xx,1.1,1,2.5,.12);bracket(xx,3.5,1.1,.45);lattice(xx,2.0,-.9,1.1,1.3);}rail(Array.from({length:Math.ceil(w)+1},(_,i)=>[-w/2+i*w/Math.ceil(w),1,1.35]),.6);roof(w+1.2,4.3,3.8,1,.25);});}
// The former12m left wing projected its roof through the main sanctuary.
// End the joined wing outside that wall, retaining the old downstream garden
// random sequence independently of the changed architectural length.
const gallerySeed152=seed;
gallery(-7.7,-9,7.7);
seed=gallerySeed152;
for(let row=0;row<14;row++)for(let col=0;col<Math.ceil(12/.66);col++)if(-6+.33+col*.66+(row%2)*.17<=5.8)R();
for(let side=0;side<4;side++)for(let i=0;i<=Math.ceil((side%2?4.3:13.2)/.19);i++)for(let j=0;j<18;j++)R();
gallery(-18,-3,6);gallery(17,-10,6,Math.PI/2);
// The photograph's buildings stand above the sunken water garden on connected garden terraces.
const hillHeight=gardenHeight,hillGeo=gardenTerrainGeometry(),bankSoil=mats.soil.clone();bankSoil.name='scene07-connected-garden-earth';bankSoil.color.setHex(0x48503b);bankSoil.vertexColors=true;emit(hillGeo,bankSoil,0,0,0);
// Terrain is below the water and each island is actual protruding geology.
transform=new T.Matrix4().makeTranslation(0,0,-3).multiply(new T.Matrix4().makeScale(1,1,.6));
box(0,-.8,0,160,1,150,'soil');
const rockForms=Array.from({length:7},(_,i)=>createWeatheredBoulderGeometry(T,{scale:[1,.7,1],seed:i*133+9,sectors:28,rings:14}));
const rockMoss=rockForms.map(g=>createBoulderMossGeometry(T,g));
const gardenShoots=[gardenShrubShoot(7),gardenShrubShoot(131),gardenShrubShoot(947)];
function rock(x,y,z,s=1){const idx=Math.floor(R()*scannedStones.variants.length),v=scannedStones.variants[idx],sy=rr(.75,1.22)*s,rot=[rr(-.13,.13),rr(0,TAU),rr(-.09,.09)];emit(v.geometry,y<.55?v.wet:v.dry,x,y,z,s,sy,s,rot,rr(.68,1.17));R(); /* preserve the old moss-tint draw and downstream garden layout */} 
// Irregular retaining slopes, not a blank green ramp or a smooth tall wall.
const gardenTransform=transform;transform=new T.Matrix4();for(let i=0;i<290;i++){const x=rr(-24,19),z=rr(-8.5,4.2);if(isGardenRoute(x,z,.90))continue;const y=hillHeight(x,z);rock(x,y-.18,z,rr(.45,1.3));}transform=gardenTransform;
// The former second freestanding masonry screen is removed. Retaining stones
// now belong to the hall wall above, with planted slopes rising to meet it.
transform=new T.Matrix4();for(let i=0;i<27*21;i++)R();
// The short forecourt meets the rotated stair and the raised bridge rather than a bare box face.
// The observed landing is rebuilt with the bridge; retain its64 former random draws.
for(let i=0;i<64;i++)R();transform=gardenTransform;
const pondOutline=[[-15,3],[-10,0],[-5,-3],[-8,-6],[-10,-8],[-10,-10],[-6,-12],[0,-12],[4,-10],[7,-7],[8,-3],[8,0],[14,7],[15,12],[12,15],[16,22],[15,30],[9,34],[1,32],[-8,28],[-14,27],[-16,20],[-13,15],[-16,10]];
const sh=new T.Shape();pondOutline.forEach(([x,z],i)=>i?sh.lineTo(x,-z):sh.moveTo(x,-z));sh.closePath();const wg=new T.ShapeGeometry(sh,60);const water=new Reflector(wg,{textureWidth:1536,textureHeight:1536,multisample:0,color:0x6d8e82,clipBias:.005});water.rotation.x=-Math.PI/2;water.scale.y=.6;water.position.set(0,.035,-3);scene.add(water);
// Capture the complete physical reflected scene for a cropped main view.
// The main framebuffer retains its actual subfrustum; reflection UVs project
// world positions into the independent complete reflection camera.
const reflectWater=water.onBeforeRender;
water.onBeforeRender=function(renderer,scene,camera,...args){
 if(!camera.view?.enabled)return reflectWater.call(this,renderer,scene,camera,...args);
 const projection=camera.projectionMatrix.clone(),inverse=camera.projectionMatrixInverse.clone(),complete=camera.clone();complete.clearViewOffset();camera.projectionMatrix.copy(complete.projectionMatrix);camera.projectionMatrixInverse.copy(complete.projectionMatrixInverse);
 try{return reflectWater.call(this,renderer,scene,camera,...args);}finally{camera.projectionMatrix.copy(projection);camera.projectionMatrixInverse.copy(inverse);}
};water.material.uniforms.color.value.setHex(0x648b82);water.material.onBeforeCompile=shader=>{
 shader.vertexShader=shader.vertexShader.replace('void main() {','varying vec3 vWater; void main() { vWater=position;');
 shader.fragmentShader=shader.fragmentShader.replace('void main() {','varying vec3 vWater; void main() {')
  .replace('texture2DProj( tDiffuse, vUv )','texture2DProj( tDiffuse, vUv + vec4((sin(vWater.y*9.0+vWater.x*2.7+sin(vWater.x*3.4))*sin(vWater.x*5.2-vWater.y*2.1))*.00058*vUv.w,(sin(vWater.y*13.0+vWater.x*1.9)+.5*sin(vWater.y*22.0-vWater.x*4.9))*.00026*vUv.w,0.,0.) )')
  .replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',
   'float ripple=.5+.24*sin(vWater.y*21.0+sin(vWater.x*6.0))+.16*sin(vWater.x*17.0-vWater.y*13.0)+.10*cos(vWater.x*31.0+vWater.y*24.0); vec3 wp=vec3(vWater.x,0.,-vWater.y*.6-3.); vec3 eye=normalize(cameraPosition-wp); vec3 wn=normalize(vec3(.055*sin(wp.z*8.+wp.x*1.7)+.022*sin(wp.z*17.),1.,.042*sin(wp.z*12.-wp.x*1.4))); vec3 sunDir=normalize(vec3(-.58,.035,-.81)); float highlight=max(dot(reflect(-sunDir,wn),eye),0.); float broad=pow(highlight,22.); float sharp=pow(highlight,128.); float grazing=1.-max(dot(eye,wn),0.); vec3 reflected=base.rgb*vec3(.70,.84,.85); float reflectedLum=dot(base.rgb,vec3(.2126,.7152,.0722)); float reflectWeight=clamp(mix(.38,.77,smoothstep(.035,.35,reflectedLum))+.08*pow(grazing,3.),.34,.88); vec3 waterColor=mix(vec3(.025,.070,.065),reflected,reflectWeight); waterColor+=vec3(.012,.024,.021)*ripple+vec3(1.,.74,.40)*(broad*.13+sharp*.46); gl_FragColor=vec4(waterColor,1.0);');
};
for(let i=0;i<pondOutline.length;i++){const a=pondOutline[i],b=pondOutline[(i+1)%pondOutline.length];for(let k=0;k<10;k++){let t=k/10;const x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;rock(x,rr(-.08,.25),z,rr(.35,.85));}}
function island(x,z,rx,rz,rise=0){if(rise){const lower=scannedStones.variants[1],upper=scannedStones.variants[4];emit(lower.geometry,lower.wet,x,.55,z,1.65,1.65,1.65,[0,.42,0]);emit(upper.geometry,upper.dry,x+.16,1.18,z-.12,1.10,1.10,1.10,[0,-.57,.06]);}else emit(geo.ball,'soil',x,-.22,z,rx,.68,rz);for(let i=0;i<35;i++){const a=rr(0,TAU),r=rr(.45,1);rock(x+Math.cos(a)*rx*r,rr(-.1,.3)+rise*Math.sqrt(Math.max(0,1-r*r)),z+Math.sin(a)*rz*r,rr(.3,.8));}for(let i=0;i<270;i++){const a=rr(0,TAU),r=Math.sqrt(R()),xx=x+Math.cos(a)*rx*r,zz=z+Math.sin(a)*rz*r,low=.21+rise*Math.sqrt(Math.max(0,1-r*r)),scale=rr(.55,1.0);emit(gardenShoots[i%3],i%4?'gardenShrub':'gardenShrubLit',xx,low,zz,scale,rr(.45,.85),scale,[0,rr(0,TAU),0],rr(.8,1.1));} }
island(4.876137218447144,14.2,2.1,2.4,1.75);island(-7,15.8,3.5,2.5);island(13,22,3.9,4.6);island(-13,7,4,3);island(8,7,3.6,2);
// Bridge and near veranda are built together from the measured layout below.
// Jointed tree skeletons carry thousands of individual needle sprays; there are no green globe crowns.
const leafG=needleSpray(),pineNeedleG=pineNeedleSpray();mats.needle=mats.leaf.clone();mats.needle.side=T.DoubleSide;mats.needle2=mats.leaf2.clone();mats.needle2.side=T.DoubleSide;for(const m of[mats.needle,mats.needle2]){m.roughness=.57;m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n vec3 plantSun=normalize((viewMatrix*vec4(-.58,.035,-.81,0.0)).xyz);float thinScatter=pow(max(dot(-normal,plantSun),0.0),3.0);reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(1.0,.67,.25)*thinScatter*.62;');};}
mats.pineNeedleDry=new T.MeshPhysicalMaterial({name:'scene07-pine-needle-dry',color:0x23452d,roughness:.80,metalness:0,clearcoat:.035,clearcoatRoughness:.52,side:T.DoubleSide});
mats.pineNeedleSunlit=new T.MeshPhysicalMaterial({name:'scene07-pine-needle-sunlit',color:0x566f35,roughness:.65,metalness:0,clearcoat:.08,clearcoatRoughness:.40,side:T.DoubleSide});
for(const m of[mats.pineNeedleDry,mats.pineNeedleSunlit,mats.gardenShrub,mats.gardenShrubLit]){m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n vec3 needleSun=normalize((viewMatrix*vec4(-.58,.035,-.81,0.0)).xyz);float needleTransmission=pow(max(dot(-normal,needleSun),0.0),2.2);reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(1.0,.68,.30)*needleTransmission*.28;');};m.customProgramCacheKey=()=> 'scene07-thin-foliage-aligned-backscatter146';}
function pinePad(x,y,z,rx,rz,heading=0){
 // Each pad is an open, tiered skeleton: primary boughs, forked branchlets,
 // then small axis-aligned needle fascicles. Crown volume comes from foliage,
 // not an opaque hull, so gaps remain between neighboring sprays.
 // Advance the scene's original random stream exactly as the previous pad
 // did, while a coordinate-seeded stream varies this denser pine geometry.
 const branchSeed=seed>>>0;let replay=seed;
 const replayR=()=>((replay=Math.imul(replay,1664525)+1013904223>>>0)/4294967296),replayRange=(a,b)=>a+(b-a)*replayR();
 const oldBoughs=3+Math.floor(replayR()*3);
 for(let old=0;old<oldBoughs;old++){
  replayRange(-.22,.22);replayRange(.56,1.02);replayRange(.38,.76);replayRange(-.10,.10);replayRange(.04,.22);
  replayRange(.021,.034);replayRange(.010,.017);replayRange(.010,.017);
  for(let station=0;station<4;station++)for(let side=0;side<2;side++){
   if(replayR()<.10)continue;
   replayRange(.64,1.12);replayRange(.20,.43);replayRange(-.08,.14);replayRange(.008,.013);
   replayRange(0,.76);replayRange(-.38,.38);replayRange(0,TAU);replayRange(1.05,1.75);replayR();
   replayRange(.88,1.10);replayRange(.86,1.12);replayRange(1.0,1.36);replayRange(.82,1.12);
  }
 }
 seed=replay;
 let localSeed=(branchSeed^Math.imul(Math.floor((x+37.2)*871.3),374761393)^Math.imul(Math.floor((z+23.8)*631.7),668265263)^Math.floor((y+3.4)*994.3))>>>0;
 const pR=()=>((localSeed=Math.imul(localSeed,1664525)+1013904223>>>0)/4294967296),pRR=(a,b)=>a+(b-a)*pR();
 const boughs=4+Math.floor(pR()*3);
 const sprayAt=(base,end,size=1,verticalScale=1)=>{
  const direction=new T.Vector3(end[0]-base[0],end[1]-base[1],end[2]-base[2]).normalize(),
   q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction);
  q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),pRR(-.8,.8)));
  const e=new T.Euler().setFromQuaternion(q),material=pR()<.72?'pineNeedleDry':'pineNeedleSunlit',scale=size*pRR(1.02,1.30);
  emit(pineNeedleG,material,end[0],end[1],end[2],scale*pRR(.91,1.08),scale*pRR(.90,1.13)*verticalScale,scale*pRR(.91,1.12),[e.x,e.y,e.z],pRR(.82,1.12));
 };
 for(let i=0;i<boughs;i++){
  const f=boughs===1?.5:i/(boughs-1),a=heading+(f-.5)*1.18+pRR(-.22,.22),reach=rx*pRR(.62,1.02),spread=rz*pRR(.45,.82),start=[x,y,z],mid=[x+Math.cos(a)*reach*.55,y+pRR(-.10,.10)*spread,z+Math.sin(a)*reach*.55],tip=[x+Math.cos(a)*reach,y+pRR(.04,.22)*spread,z+Math.sin(a)*reach];
  rod(start,mid,pRR(.021,.034),'trunk',pRR(.010,.017));rod(mid,tip,pRR(.010,.017),'trunk',.0045);
  for(let station=0;station<5;station++){
   const t=.17+station*.16,base=[start[0]+(tip[0]-start[0])*t,start[1]+(tip[1]-start[1])*t,start[2]+(tip[2]-start[2])*t];
   for(const side of[-1,1]){
    if(pR()<.13)continue;
    const aa=a+side*pRR(.66,1.12)+pRR(-.18,.18),twigLength=spread*pRR(.24,.44)*(1-.14*t),joint=[base[0]+Math.cos(aa)*twigLength*.56,base[1]+pRR(-.05,.08)*spread,base[2]+Math.sin(aa)*twigLength*.56],end=[base[0]+Math.cos(aa)*twigLength,base[1]+pRR(-.08,.14)*spread,base[2]+Math.sin(aa)*twigLength];
    rod(base,joint,pRR(.008,.013),'trunk',.0045);rod(joint,end,pRR(.0045,.0075),'trunk',.0025);sprayAt(joint,end,pRR(.84,1.18));
    // A few tertiary forks break the straight comb-like outline without
    // closing the shadow gaps between adjacent sprays.
    if(pR()<.46){const fa=aa+side*pRR(.48,.92),fl=twigLength*pRR(.36,.55),fb=[joint[0]+Math.cos(aa)*twigLength*.20,joint[1]+pRR(-.015,.04)*spread,joint[2]+Math.sin(aa)*twigLength*.20],fe=[fb[0]+Math.cos(fa)*fl,fb[1]+pRR(-.035,.06)*spread,fb[2]+Math.sin(fa)*fl];rod(fb,fe,.005,'trunk',.002);sprayAt(fb,fe,pRR(.63,.88));}
    if(pR()<.35)sprayAt(base,joint,pRR(.68,.90));
    if(station===4&&pR()<.28)sprayAt(base,end,pRR(.62,.82));
   }
  }
  sprayAt(mid,tip,pRR(.72,.96));
 }
 // A pruned crown also has densely overlapping upward shoots inside its
 // bough envelope. These are separate 3D fascicles carried by short forked
 // twigs, with irregular lobes and open margins; there is no foliage hull.
 const ca=Math.cos(heading),sa=Math.sin(heading),shoots=Math.ceil(160+rx*rz*24);
 for(let j=0;j<shoots;j++){
  const a=pR()*TAU,rho=Math.sqrt(pR()),u=Math.cos(a)*rho*rx*.72+rx*.18,v=Math.sin(a)*rho*rz*.94,
   crown=.08+Math.sqrt(Math.max(0,1-rho*rho))*rx*.11,
   ex=x+ca*u-sa*v,ez=z+sa*u+ca*v,ey=y+pRR(-.06,.08)+crown*pRR(.24,.80),
   base=[x+ca*u*.74-sa*v*.55,y-.055,z+sa*u*.74+ca*v*.55],
   end=[ex,ey,ez],dir=[ex-ca*.035,ey-.27,ez-sa*.035];
  if(j%3===0)rod(base,end,pRR(.0038,.006),'trunk',.0018);
  sprayAt(dir,end,pRR(1.12,1.58),.47);
 }
}
function pine(x,z,h,spread=1,bend=null){group(0,Math.max(0,hillHeight(x,z*.6-3)),0,0,1,()=>{const lean=bend===null?rr(-.25,.25):bend,tr=[[x,.15,z],[x-h*.07,h*.23,z-.2],[x+lean*h*.55,h*.51,z+.15],[x+lean*h,h*.85,z-.2]];emit(barkBranch(tr,h*.048,h*.006,Math.floor(x*19+z*17)),'trunk',0,0,0);for(let k=0;k<5;k++){const a=k*TAU/5;emit(barkBranch([[x,.25,z],[x+Math.cos(a)*h*.055,.08,z+Math.sin(a)*h*.055],[x+Math.cos(a)*h*.12,.025,z+Math.sin(a)*h*.12]],h*.012,h*.003,k+1),'trunk',0,0,0);}for(let j=0;j<11;j++){const tier=Math.floor(j/3),t=[.31,.47,.63,.77][tier],cy=h*t,a=j*2.399+rr(-.35,.35),r=h*spread*([.33,.37,.31,.23][tier])*rr(.8,1.12),bx=x+lean*h*t,ex=bx+Math.cos(a)*r,ez=z+Math.sin(a)*r,ey=cy+h*.13;const mid=[bx+Math.cos(a)*r*.55,cy-h*.025,z+Math.sin(a)*r*.6];emit(barkBranch([[bx,cy,z],mid,[ex,ey,ez]],h*.012*(1-t),h*.002,j+Math.floor(x*11)),'trunk',0,0,0);pinePad(ex,ey,ez,h*spread*(tier===3?.15:.18),h*spread*.13,a);if(j%3===1)pinePad(mid[0],cy+h*.07,mid[2],h*spread*.12,h*spread*.095,a);}pinePad(x+lean*h,h*.91,z-.2,h*spread*.21,h*spread*.15,0);});}
seed=advanceLegacyPineRandom148(seed);const heroPines148=await buildHeroPines({emit,mats,hillHeight,group});
const petalG=new T.SphereGeometry(1,5,3);function cherry(x,z,h,spread=3){group(0,Math.max(0,hillHeight(x,z*.6-3)),0,0,1,()=>{let tr=[[x,0,z],[x-.2,h*.4,z+.15],[x+.2,h*.7,z]];rod(tr[0],tr[1],.20,'trunk',.12);rod(tr[1],tr[2],.12,'trunk',.06);for(let j=0;j<13;j++){const a=j*2.4,r=rr(.4,1)*spread,end=[x+Math.cos(a)*r,h*.56+rr(0,h*.32),z+Math.sin(a)*r];rod(tr[1],end,.06,'trunk',.018);for(let k=0;k<190;k++){const aa=rr(0,TAU),r=Math.cbrt(R())*1.15,cy=rr(-1,1),hr=Math.sqrt(1-cy*cy)*r,xx=end[0]+Math.cos(aa)*hr,zz=end[2]+Math.sin(aa)*hr,yy=end[1]+cy*r*.72;const color=R()>.22?'pink':'pink2';for(let f=0;f<5;f++){const a=f*TAU/5+rr(-.1,.1);emit(petalG,color,xx+Math.cos(a)*.035,yy,zz+Math.sin(a)*.035,.045,.018,.04,[rr(-.4,.4),a,rr(-.4,.4)],rr(.85,1.12));}if(k%8===0)emit(leafG,'needle',xx,yy-.04,zz,.55,.55,.55,[0,rr(0,TAU),0]);}}});}
cherry(-12,6,6.2,3);cherry(-17,13,4.8,3);cherry(15,22,4,3.1);cherry(-4,-3,4.6,2.6);cherry(18,1,5,3);
// Layered bank growth: blades, moss, tiny flowers, and individual stones remain visible from the raised veranda.
const grassG=(()=>{const p=[];for(let i=0;i<5;i++){const a=i*2.4,x=Math.cos(a),z=Math.sin(a);p.push(x*.03,0,z*.03,x*.13,.3+i*.015,z*.13,-x*.03,0,-z*.03);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;})();
for(let i=0;i<5500;i++){const side=R()<.5?-1:1,x=side*rr(12,24),z=rr(0,32);emit(grassG,'needle2',x,Math.max(.07,hillHeight(x,z*.6-3)+.035),z,rr(.5,1.2),rr(.6,1.8),rr(.5,1.3),[0,rr(0,TAU),0],rr(.7,1.2));if(i%7===0)sphere(x,.2,z,.06,.04,.06,i%3?'pink':'white');}
for(let j=0;j<1700;j++){const idx=Math.floor(R()*pondOutline.length),a=pondOutline[idx],b=pondOutline[(idx+1)%pondOutline.length],t=R(),x=a[0]+(b[0]-a[0])*t+rr(-.6,.6),z=a[1]+(b[1]-a[1])*t+rr(-.6,.6);emit(grassG,'needle2',x,Math.max(.08,hillHeight(x,z*.6-3)+.025),z,rr(.4,1),rr(.5,1.3),rr(.4,1),[0,rr(0,TAU),0]);if(j%4===0)sphere(x,.23,z,.07,.035,.07,j%3?'white':'pink');}
// Break the grass-only waterline with taller, arched blades that catch the
// sunset and overlap stones at different depths along the irregular bank.
const reedG=watersideReeds(1807),reedHash=n=>{const q=Math.sin(n*127.1+82.4)*43758.5453;return q-Math.floor(q);};
mats.reed=new T.MeshStandardMaterial({name:'scene07-waterside-sedge-deep',color:0x4b5f2d,roughness:.88,side:T.DoubleSide});mats.reedLit=new T.MeshStandardMaterial({name:'scene07-waterside-sedge-sunward',color:0x8fa45c,roughness:.86,side:T.DoubleSide});
for(let i=0;i<180;i++){const edge=i%pondOutline.length,row=Math.floor(i/pondOutline.length),a=pondOutline[edge],b=pondOutline[(edge+1)%pondOutline.length],t=(row+.12+reedHash(i+91)*.76)/Math.ceil(180/pondOutline.length);let x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,dx=x, dz=z-14,dl=Math.max(.001,Math.hypot(dx,dz)),offset=.28+reedHash(i+233)*.95;x+=dx/dl*offset;z+=dz/dl*offset;if(isGardenRoute(x,z*.6-3,.45))continue;const y=Math.max(-.04,hillHeight(x,z*.6-3)+.035),s=.82+reedHash(i+411)*.74;emit(reedG,i%4?mats.reed:mats.reedLit,x,y,z,s,1.05+reedHash(i+529)*.66,s,[0,reedHash(i+617)*TAU,0],.66+reedHash(i+701)*.38);}
const fernG=fern(),sprigForms=gardenShoots;mats.fern=mats.gardenShrub.clone();mats.fern.side=T.DoubleSide;mats.shrub=mats.gardenShrubLit.clone();mats.shrub.side=T.DoubleSide;
// Individual shore colonies are anchored to stones and soil, leaving the real water channel open.
for(const [cx,cz,rx,rz]of[[4.876137218447144,14.2,2.0,2.3],[-7,15.8,3.3,2.3],[13,22,3.6,4.1],[-13,7,3.7,2.8],[8,7,3.2,1.8]])for(let i=0;i<210;i++){const a=rr(0,TAU),r=Math.sqrt(R()),x=cx+Math.cos(a)*r*rx,z=cz+Math.sin(a)*r*rz;emit(i%3?fernG:sprigForms[i%3],i%3?'fern':'shrub',x,rr(.2,.5)+(cx===4.876137218447144?1.75*Math.sqrt(Math.max(0,1-r*r)):0),z,rr(.4,1.1),rr(.45,1.2),rr(.5,1),[0,rr(0,TAU),0],rr(.7,1.1));if(i%9===0){rod([x,.45,z],[x,.8,z],.009,'leaf');for(let k=0;k<5;k++){const aa=k*TAU/5;emit(petalG,i%2?'pink':'white',x+Math.cos(aa)*.045,.81,z+Math.sin(aa)*.045,.05,.022,.047,[0,aa,0]);}}}
const bankTransform=transform;transform=new T.Matrix4();for(let i=0;i<3200;i++){const x=rr(-26,22),z=rr(-13,6);if(isGardenRoute(x,z,.45))continue;if(z>3&&Math.abs(x)<11)continue;const y=hillHeight(x,z),sf=rr(.4,1.4);emit(i%4? sprigForms[i%3]:fernG,i%4?'shrub':'fern',x,y+.05,z,sf,rr(.5,1.8),sf,[0,rr(0,TAU),0],rr(.6,1.15));}for(let i=0;i<85;i++){const x=rr(-20,18),z=rr(-5,4);if(isGardenRoute(x,z,1.3))continue;const y=hillHeight(x,z);for(let j=0;j<12;j++){const a=rr(0,TAU),r=rr(0,.8);emit(sprigForms[j%3],'shrub',x+Math.cos(a)*r,y+rr(0,.5),z+Math.sin(a)*r,rr(1.0,1.8),rr(1.2,2.5),rr(1,1.8),[0,rr(0,TAU),0],rr(.6,.95));}}transform=bankTransform;
const plantLibrary=await loadGardenPlantMeshes();
const plantingTransform=transform;transform=new T.Matrix4();const scanPlanting=buildScanPlanting({library:plantLibrary,emit,height:hillHeight});transform=plantingTransform;
const accentsTransform=transform;transform=new T.Matrix4();const gardenAccents=buildGardenAccents({emit,rod,mats,scannedStones,shoots:gardenShoots,height:hillHeight});transform=accentsTransform;
// Lily leaves are planar botanical geometry with stems and separate emerging petals.
const lilyShape=new T.Shape();lilyShape.moveTo(0,0);for(let j=0;j<=24;j++){const a=.23+j*(TAU-.46)/24;lilyShape.lineTo(Math.cos(a),Math.sin(a));}lilyShape.lineTo(0,0);const lilyG=new T.ShapeGeometry(lilyShape);lilyG.rotateX(-Math.PI/2);mats.lily=new T.MeshStandardMaterial({color:0x58763b,roughness:.55,side:T.DoubleSide});for(let i=0;i<240;i++){const x=rr(-12,14),z=rr(17,31);if((x-3)**2+(z-22)**2<10||x>11||x<-10)continue;emit(lilyG,'lily',x,.05,z,rr(.1,.3),1,rr(.1,.3),[rr(-.05,.05),rr(0,TAU),0],rr(.8,1.2));if(i%14===0){rod([x,.04,z],[x,.38,z],.015,'leaf');for(let j=0;j<8;j++){const a=j*TAU/8;emit(petalG,'pink',x+Math.cos(a)*.10,.38+.025*Math.cos(a*2),z+Math.sin(a)*.10,.10,.026,.045,[Math.cos(a)*.40,-a,Math.sin(a)*.40]);}}}
// Rooted pond colonies occupy bounded patches, leaving the main reflected
// channel open. Pads have a real botanical notch and separate open petals.
const lilyLit=mats.lily.clone();lilyLit.color.setHex(0x6e833d);let lilySeed=713179;
const lilyR=()=>((lilySeed=Math.imul(lilySeed,1664525)+1013904223>>>0)/4294967296),lilyRange=(a,b)=>a+(b-a)*lilyR();
const inPond=(x,z)=>{let inside=false;for(let i=0,j=pondOutline.length-1;i<pondOutline.length;j=i++){const a=pondOutline[i],b=pondOutline[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
let additionalLilyPads=0;
for(const [cx,cz,rx,rz]of[[11.9,29.3,2.5,3.4],[8.0,30.4,1.7,2.8],[-2.2,25.3,2.0,2.1],[-9.8,20.1,1.4,1.9]])for(let j=0;j<155;j++){
 const a=lilyRange(0,TAU),r=Math.sqrt(lilyR()),x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r;
 if(!inPond(x,z)||hillHeight(x,z*.6-3)>.04)continue;
 if(Math.hypot((x-4.876)/2.2,(z-14.2)/2.5)<1)continue;
 const size=lilyRange(.12,.28);emit(lilyG,j%4?mats.lily:lilyLit,x,.061+lilyRange(-.004,.006),z,size,1,size*lilyRange(.82,1.15),[lilyRange(-.035,.035),lilyRange(0,TAU),lilyRange(-.02,.02)],lilyRange(.78,1.15));additionalLilyPads++;
 if(j%23===0){rod([x,.04,z],[x,.27,z],.009,'leaf');for(let k=0;k<9;k++){const aa=k*TAU/9;emit(petalG,j%2?'pink':'white',x+Math.cos(aa)*.085,.27+.018*Math.cos(k),z+Math.sin(aa)*.085,.095,.024,.040,[Math.cos(aa)*.38,-aa,Math.sin(aa)*.38]);}}
}
const gardenLanterns=[];
function lantern(x,z,h=3.7,base=.10){const lamp=buildIslandStoneLantern({parentMatrix:transform.clone(),anchor:[x,base,z],uniformScale:h/4.05,maps:{...islandStoneMaps,textures:[]},glowMaterial:mats.glow});lamp.group.name='scene07-bank-carved-stone-lantern-'+gardenLanterns.length;scene.add(lamp.group);gardenLanterns.push(lamp);}
const islandStoneMaps=await loadIslandLanternStone(),islandLantern=buildIslandStoneLantern({parentMatrix:new T.Matrix4(),anchor:[4.876137218447144,1.8749026581769392,5.52],uniformScale:1.1287694126373844,maps:islandStoneMaps,glowMaterial:mats.glow});scene.add(islandLantern.group);
lantern(-6.8,3,5.5,2.8);lantern(9,2,5.7,2.8);lantern(-14,8,2.5);lantern(2.3,5,2.5);for(const [cx,cz]of[[-6.8,3],[9,2]])for(let j=0;j<24;j++){const a=rr(0,TAU),r=rr(.3,1.2);rock(cx+Math.cos(a)*r,1.8+rr(0,.5),cz+Math.sin(a)*r*1.5,rr(.5,.85));}
// Foreground is a built veranda and a separate low roof seen from above.
transform=new T.Matrix4();
let foregroundRoof;
group(...FOREGROUND_ROOF_LAYOUT.position,FOREGROUND_ROOF_LAYOUT.yaw,1,()=>{foregroundRoof=buildForegroundGalleryRoof({emit,box,rod,tube});});
// The former near roof advanced 24 lanes * (9 courses + 2 extra pipes).
// Preserve downstream framing/maple/forest randomness without retaining PVC.
for(let i=0;i<24*(9+2);i++)R();
const rebuiltLayout=buildReferenceLayout118({emit,box,rod,group,mats,scannedStones,scannedFrieze:scannedFrieze157,graniteMaps:islandStoneMaps,terrainHeight:hillHeight});
// Massive near eave across the upper-right corner and a real cast-bronze hanging bell.
group(14,19.1,15,0,1,()=>{for(let i=0;i<12;i++)box(-5+i*.8,0,0,.35,.65,8,'red');for(let i=0;i<5;i++)box(0,-.35,i*1.4-3,12,.4,.32,'wood');});
// The framing corner is part of a roof, not a suspended display grid. Its
// closed ceramic bed and bearing timbers continue to ground-founded supports
// outside the fixed photograph's side edges. Hidden dimensions are inferred.
group(14,0,15,0,1,()=>{physicalRoofAudits.push(buildPhysicalRoof({emit,box,rod,bracket,materials:roofMaterials},{w:14.4,d:8.5,e:19.56,rise:1.42,curl:.18,label:'veranda-framing-corner-roof',supports:[]}));});
for(const x of[9.0,17.8])box(x,18.82,23.5,.48,.72,25,'wood');
for(const z of[28,36]){box(14,18.40,z,26.8,.94,.82,'wood');for(const x of[1.0,27.0]){box(x,.22,z,1.18,1.04,1.18,'terraceStone');box(x,9.54,z,.78,17.60,.78,'wood');box(x,18.18,z,1.05,.30,1.05,'red');}}
box(11.5,18.88,12.7,1.1,.20,.20,'wood');let verandaBell;group(11.5,16.6,12.7,0,1.25,()=>{verandaBell=buildVerandaBell({emit,rod,box,mats});});
// Fixed close mature maple: natural-scale serrated cupped leaves and veins.
seed=advanceLegacyMomijiRandom151(seed);const momiji151=buildMomijiFraming151({emit});
// Mountains use connected terrain ridges and a varied, irregular forest silhouette.
function noise2(x,z){const ix=Math.floor(x),iz=Math.floor(z),a=x-ix,b=z-iz,u=a*a*(3-2*a),v=b*b*(3-2*b),h=(i,j)=>{const q=Math.sin(i*127.1+j*311.7)*43758.5453123;return q-Math.floor(q);};return (1-v)*((1-u)*h(ix,iz)+u*h(ix+1,iz))+v*((1-u)*h(ix,iz+1)+u*h(ix+1,iz+1));}
const forestProfiles=[];const forestForms=Array.from({length:5},(_,i)=>distantCrown(273+i*41));
for(let layer=3;layer>=0;layer--){const p=[],id=[],nx=480,nz=100;const base=-48-layer*19;const surface=(x,z)=>{const ridge=8+layer*1.7+(8+layer)*Math.pow(.5+.5*Math.sin(x*.025+layer*1.3),2)+3.5*Math.sin(x*.062+layer*.7),j=(base-z)/.96;const leftDrop=12*Math.max(0,Math.min(1,(-x-20)/40));return Math.max(-2,ridge*(1-.65*j/nz)+.7*Math.sin(x*.12+j*.7)+1.8*(noise2(x*.6,z*.6)-.5)+.6*(noise2(x*1.8,z*1.8)-.5)-leftDrop);};forestProfiles.push({base,surface});for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-150+i*300/nx,z=base-j*.96;p.push(x,surface(x,z),z);}for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){let k=j*(nx+1)+i;id.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);}const frontStart=p.length/3,frontNZ=44;for(let j=0;j<frontNZ;j++){const t=j/frontNZ,z=base+22*(1-t),blend=t*t*(3-2*t);for(let i=0;i<=nx;i++){const x=-150+i*300/nx,y=-3+(surface(x,base)+3)*blend+1.5*(noise2(x*.22,z*.22)-.5)*Math.sin(t*Math.PI);p.push(x,y,z);}}const frontIndex=(i,j)=>j===frontNZ?i:frontStart+j*(nx+1)+i;for(let j=0;j<frontNZ;j++)for(let i=0;i<nx;i++){const a=frontIndex(i,j),b=frontIndex(i+1,j),c=frontIndex(i,j+1),d=frontIndex(i+1,j+1);id.push(a,c,b,b,c,d);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(id);g.computeVertexNormals();const forestColors=[];for(let k=0;k<p.length;k+=3){const q=.48+.36*noise2(p[k]*.7,p[k+2]*.7)+.16*noise2(p[k]*2,p[k+2]*2);forestColors.push(q*.91,q,q*.78);}g.setAttribute('color',new T.Float32BufferAttribute(forestColors,3));const ma=new T.MeshStandardMaterial({color:[0x263b26,0x394932,0x59604b,0x7a7960][layer],roughness:1,side:T.DoubleSide,vertexColors:true});emit(g,ma,0,0,0);const treeMa=ma.clone();treeMa.vertexColors=false;if(layer<3)for(let i=0;i<950;i++){const x=rr(-120,120),z=base+rr(-8,21),y=z>base?(()=>{const t=1-(z-base)/22,blend=t*t*(3-2*t);return -3+(surface(x,base)+3)*blend+1.5*(noise2(x*.22,z*.22)-.5)*Math.sin(t*Math.PI);})():surface(x,z);emit(forestForms[i%5],treeMa,x,y,z,rr(1.45,2.70),rr(.85,2.20),rr(1.40,2.60),[0,rr(0,TAU),0],rr(.72,1.15));}}
// The nearest mountain forest uses the original connected scanned variants.
const forestHeight150=(x,z)=>{let y=-Infinity;for(const {base,surface}of forestProfiles){if(z>base+22||z<base-96)continue;const t=1-(z-base)/22,blend=t*t*(3-2*t);y=Math.max(y,z>base?-3+(surface(x,base)+3)*blend+1.5*(noise2(x*.22,z*.22)-.5)*Math.sin(t*Math.PI):surface(x,z));}return y;};
const scannedForest150=buildForest150({library:forestLibrary150,emit,height:forestHeight150});
const sky=new T.Mesh(new T.SphereGeometry(250,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 v;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}float fb(vec2 p){return n(p)*.5+n(p*2.1)*.25+n(p*4.3)*.125+n(p*8.9)*.065+n(p*18.1)*.032+n(p*37.0)*.016;}void main(){vec3 d=normalize(v);float h=max(0.,d.y);vec3 c=mix(vec3(1.0,.50,.19),vec3(.30,.49,.70),smoothstep(-.12,.4,h));vec3 sun=normalize(vec3(-.58,.035,-.81));float a=max(dot(d,sun),0.);c+=vec3(1.,.48,.12)*pow(a,25.)*.62;float cloud=fb(d.xz/(h+.14)*8.4+vec2(5.));float s=smoothstep(.45,.63,cloud);vec3 cc=mix(vec3(.52,.42,.34),vec3(1.0,.82,.63),smoothstep(.43,.71,cloud));cc+=vec3(.26,.09,.008)*pow(a,8.);c=mix(c,cc,s*.82*smoothstep(.02,.12,h));float edge=exp(-pow((cloud-.49)/.027,2.))*pow(a,9.);c+=vec3(.95,.39,.07)*edge*.12;c+=vec3(1.,.38,.07)*(pow(a,180.)*.22+smoothstep(.9995,.9998,a)*.48);gl_FragColor=vec4(pow(max(c,vec3(0.0)),vec3(1.9))*.60,1.);}` }));sky.renderOrder=-10;scene.add(sky);
scene.add(new T.HemisphereLight(0xe2d9cc,0x3a3020,.45));const sun=new T.DirectionalLight(0xffbf77,6.6);sun.position.copy(new T.Vector3(-.58,.035,-.81).normalize().multiplyScalar(100).add(new T.Vector3(0,3,3)));sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:225});sun.shadow.bias=-.00015;sun.shadow.normalBias=.018;sun.target.position.set(0,3,3);scene.add(sun,sun.target);const fill=new T.DirectionalLight(0xffd5a5,.65);fill.position.set(-35,24,38);scene.add(fill);
sky.visible=false;const skyRadiance=await installMeasuredSky({renderer,scene,sun});
const courtyardBounce167=addCourtyardBounce167(scene);
// Finalize ordinary instanced meshes only once, keeping deterministic frozen geometry.
let instanceCount=0,triangles=0;for(const {g,m,items}of batches.values()){if(m.userData?.scannedTimber)addTimberExtent(g);const obj=new T.InstancedMesh(g,m,items.length);for(let i=0;i<items.length;i++){obj.setMatrixAt(i,items[i][0]);obj.setColorAt(i,new T.Color().setScalar(items[i][1]));}obj.castShadow=obj.receiveShadow=true;obj.instanceMatrix.needsUpdate=true;obj.instanceColor.needsUpdate=true;scene.add(obj);instanceCount+=items.length;triangles+=(g.index?.count||g.attributes.position.count)/3*items.length;}scene.updateMatrixWorld(true);
// Static geometry and fixed lights share one immutable shadow map across all dolly poses.
renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
// HDR radiance is installed once before rendering.
function ensureRadiance(){}
// Geometry-based ambient contact shading resolves recessed brackets, stone joins and foliage depth.
let composer=null;if(renderer.isWebGLRenderer){composer=new EffectComposer(renderer,new T.WebGLRenderTarget(W,H,{type:T.HalfFloatType,samples:4}));composer.setSize(W,H);composer.addPass(new RenderPass(scene,camera));const ao=new GTAOPass(scene,camera,W,H,undefined,{radius:.48,thickness:.35,distanceExponent:1.2,distanceFallOff:1,scale:1,samples:16},{radius:4,samples:12,rings:2});ao.blendIntensity=.38;composer.addPass(ao);composer.addPass(new OutputPass());}
function renderView(position,target,time=0,fov=46){ensureRadiance();camera.position.fromArray(position);camera.fov=fov;camera.aspect=W/H;camera.lookAt(V(target));camera.updateProjectionMatrix();renderer.setRenderTarget(null);if(composer)composer.render(0);else renderer.render(scene,camera);renderer.setRenderTarget(null);return true;}
function renderReference(n=7){return renderView([10.7,12.8,36.0],[0.0,7.0,-2.0],0,47);}
const dolly=createDollyPath({points:[[8.2,8.55,29.3],[8.7,9.1,30.6],[10.1,11.7,34.7],[10.7,12.8,36]],nearTarget:[5.941572,8.13,24.153507],farTarget:[0,7,-2],fov:47});
function renderShot(localTime=0){const p=dolly(localTime);return renderView(p.position,p.target,localTime,p.fov);}
window.temple={ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info:()=>({scene:7,revision:GARDEN_REBUILD_REVISION,garden:{...gardenAccents.info,independentPlanting:scanPlanting,momiji151:momiji151.info,scannedForest150,skyRadiance:skyRadiance.info,courtyardBounce167:courtyardBounce167.info,additionalLilyPads,clearWalkingSurfaces:true},layout:rebuiltLayout.audit,roofRevision:PHYSICAL_ROOF_REVISION,foregroundRoof:foregroundRoof.audit,islandLantern:islandLantern.info,verandaBell:verandaBell.info,physicalRoofs:physicalRoofAudits,occupiedHall152,hallCorbels153:hallCorbels153.info(),carvedFriezes154:carvedFriezes154.info(),scannedFrieze157:scannedFrieze157.info(),instances:instanceCount,triangles,referenceCamera:[10.7,12.8,36],externalAssets:true,assetProvenance: "reconstructions/scene-07/assets/scanned-timber-provenance.json",stoneAssetProvenance:"reconstructions/scene-07/assets/scanned-garden-stones-provenance.json",roofProvenance:"reconstructions/scene-07/assets/physical-roof-provenance.json",pineFoliage:{heroPines148,construction:'Connected aged wood and branch fans carry closed retained-fascicle interiors and finer outer paired needles; r05 cloud-pad overlap, no hulls or scene cards',legacySprayGeometryNotUsedForHero:true,sprayTriangles:pineNeedleG.attributes.position.count/3,needleGroups:9,roughness:{dry:mats.pineNeedleDry.roughness,sunlit:mats.pineNeedleSunlit.roughness},lightGapSampling:true}}),dispose(){scannedFrieze157.dispose();carvedFriezes154.dispose();momiji151.dispose();forestLibrary150.dispose();skyRadiance.dispose();courtyardBounce167.dispose();plantLibrary.dispose();verandaBell.dispose();for(const lamp of gardenLanterns)lamp.dispose();gardenAccents.dispose();rebuiltLayout.dispose();islandLantern.dispose();foregroundRoof.dispose();scannedTimber.dispose();scannedStones.dispose();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();});renderer.dispose();}};if(!qp.has('defer')){renderReference();if(!qp.has('render')){let start=performance.now();function animate(){renderShot((performance.now()-start)*.001%7);requestAnimationFrame(animate);}requestAnimationFrame(animate);}}console.log('temple07 ready',window.temple.info());
