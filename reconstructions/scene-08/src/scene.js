import * as T from 'three';
import {loadScannedPeony171} from './scanned-peony171.js';
import {buildGrandBearing171} from './grand-bearing171.js';
import {createSpatialPortals191,SPATIAL191_REVISION} from './spatial-portals191.js';
import {installMaterialHierarchy191,captureEntryCourt191} from './material-hierarchy191.js';
import{createNaturalJoinery197}from'./natural-joinery197.js';
import{createGardenJoinery213}from'./garden-joinery213.js';
import{installSun197,captureHallCourt197,NATURAL197_REVISION}from'./natural-light197.js';
import {Reflector} from '../../../vendor/examples/jsm/objects/Reflector.js';
import {createWeatheredBoulderGeometry,createBoulderMossGeometry} from './rocks.js';
import {createGalleryCurvedJoinery,createContinuousTimber,createClayCoverTile,createClayPanTile} from './gallery-joinery.js';
import {createGatePlaque,createGateColumnShoe} from './gate-hardware.js';
import {loadCourtyardBotany} from './courtyard-botany148.js';
import {createCourtyardRelief} from './courtyard-relief147.js';
import {installCourtyardRadiance} from './courtyard-radiance148.js';
import {loadCourtyardStones} from './courtyard-stones147.js';
import{createWeatheredToro213,REBUILD213_REVISION}from'./weathered-toro213.js';
import{dressLayeredBanks213,installDampStone213,createGardenGround213}from'./layered-banks213.js';
import{createGrandRoofProfile213}from'./fine-hall213.js';
export async function buildScene({renderer}={}){
const scene=new T.Scene();scene.background=new T.Color('#a4c3df');scene.fog=new T.Fog('#b2c5c1',47,105);
const botany=await loadCourtyardBotany(),relief=createCourtyardRelief(),scannedStones=await loadCourtyardStones(),peony=await loadScannedPeony171();let grandMass171=null,grandRoof191=null;
let seed=80247;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),rr=(a,b)=>a+(b-a)*random();
const mats={},geometries=new Set(),materials=[],textures=[],buckets=new Map(),stack=[new T.Matrix4()],roles={};let role='architecture';
function material(name,color,roughness=.75,metalness=0){const m=new T.MeshStandardMaterial({name,color,roughness,metalness});materials.push(m);return mats[name]=m;}
material('red','#8c321b',.58);material('redlight','#a04c28',.62);material('wood','#61301f');material('dark','#302b26');material('gold','#c99943',.38,.86);material('oldgold','#9b7539',.49,.78);material('tile','#243b52',.39,.08);material('tileedge','#344857',.48,0);material('wall','#e0d4b7');material('stone','#96958a',.95);material('rock','#72796a',.97);material('moss','#536333',1);material('hallFoundation','#5d574b',.96);mats.rock.color.set('#777a72');mats.rock.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vMineral;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMineral=position;');shader.fragmentShader='varying vec3 vMineral;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float mineral=sin(vMineral.x*19.+sin(vMineral.z*13.)*2.)*sin(vMineral.y*23.+vMineral.z*11.);float vein=pow(max(0.,sin(vMineral.y*14.+vMineral.x*3.+sin(vMineral.z*8.)*.7)),12.);diffuseColor.rgb*=.84+.18*mineral-.15*vein;`);};material('bark','#554735',.98);material('leaf','#385b2e',.73);material('leaflight','#708b43',.70);material('maple','#a2473a',.90);material('flower','#e28c91',.84);material('paper','#e9c985',.8);material('lanternamber','#d6a04e',.82);mats.lanternamber.emissive=new T.Color('#d58b2b');mats.lanternamber.emissiveIntensity=.35;mats.paper.emissive=new T.Color('#f7aa34');mats.paper.emissiveIntensity=.28;
material('joinerygilt','#8d682d',.55,.73);material('hardwarebrass','#a67c36',.49,.84);material('hardwareRecess','#69502c',.57,.80);material('gallerytile','#526b8a',.46,.025);material('tileEnd','#172c41',.84,.015);mats.tileedge.color.set('#263e5b');mats.tile.color.set('#2f4867');
// Procedural mineral/bark detail; the namespaced CC0 timber scan is installed below.
function texture(kind){const n=128,d=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const p=(y*n+x)*4,h=(()=>{const q=Math.sin((x+17.3)*(y+41.7)*12.9898)*43758.5453;return q-Math.floor(q);})(),warp=x+3.4*Math.sin(y*.055)+1.1*Math.sin(y*.17+x*.025),grain=Math.sin(warp*.46)+.42*Math.sin(warp*1.91+y*.08)+.18*Math.sin(warp*5.7+y*.22),broad=Math.sin(x*.07+Math.sin(y*.031)*2.0),q=kind==='wood'?.84+.052*grain+.024*broad+.018*(h-.5):kind==='plaster'?.91+.06*(h-.5)+.014*Math.sin(x*.22+y*.12):.73+.22*(h-.5)+.035*Math.sin(x*.4+Math.sin(y*.13)*2.);const r=T.MathUtils.clamp(q,0,1),g=T.MathUtils.clamp(q*(kind==='wood'?.96:1),0,1),b=T.MathUtils.clamp(q*(kind==='wood'?.89:1),0,1);d[p]=255*r;d[p+1]=255*g;d[p+2]=255*b;d[p+3]=255;random();}const t=new T.DataTexture(d,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;textures.push(t);return t;}
const envW=256,envH=128,envData=new Uint8Array(envW*envH*4),fract=x=>x-Math.floor(x),hash2=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453),noise2=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=hash2(ix,iy),b=hash2(ix+1,iy),c=hash2(ix,iy+1),d=hash2(ix+1,iy+1);return(a+(b-a)*sx)+((c+(d-c)*sx)-(a+(b-a)*sx))*sy;},envSmooth=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};for(let ey=0;ey<envH;ey++)for(let ex=0;ex<envW;ex++){const u=ex/(envW-1),v=ey/(envH-1),q=(ey*envW+ex)*4,upper=v<.5,t=upper?v*2:(v-.5)*2,top=[.25,.48,.80],horizon=[.70,.82,.94],ground=[.12,.14,.08],base=upper?top.map((c,k)=>c+(horizon[k]-c)*t):horizon.map((c,k)=>c+(ground[k]-c)*t);let n=0,a=.53,x=u*9,y=v*7;for(let octave=0;octave<5;octave++){n+=a*noise2(x,y);x=x*2.02+13.1;y=y*2.02+7.7;a*=.48;}const du=Math.min(Math.abs(u-.81),1-Math.abs(u-.81)),sunHalo=Math.exp(-Math.pow(du/.095,2)-Math.pow((v-.445)/.075,2)),sunDisk=Math.exp(-Math.pow(du/.010,2)-Math.pow((v-.445)/.014,2)),cloud=envSmooth(.49,.66,n)*envSmooth(.06,.44,v)*(1-envSmooth(.77,.98,v)),west= Math.exp(-Math.pow(du/.23,2))*Math.exp(-Math.pow((v-.48)/.20,2)),cloudTint=[1.0,.98,.94],out=[];for(let k=0;k<3;k++){let c=base[k];c+=(cloudTint[k]-c)*cloud*.62;c+=(k===0?1:k===1?.62:.28)*sunHalo*.42;c+=(k===0?1:k===1?.88:.64)*sunDisk;c+=(k===0?1:k===1?.55:.33)*west*.04;out.push(Math.round(T.MathUtils.clamp(c,0,1)*255));}envData[q]=out[0];envData[q+1]=out[1];envData[q+2]=out[2];envData[q+3]=255;}const env=new T.DataTexture(envData,envW,envH);env.mapping=T.EquirectangularReflectionMapping;env.colorSpace=T.SRGBColorSpace;env.needsUpdate=true;textures.push(env);scene.environment=env;scene.environmentIntensity=.58;
const wood=texture('wood'),stone=texture('stone');mats.wall.map=texture('plaster');mats.moss.map=stone;mats.bark.map=wood;mats.bark.bumpMap=stone;mats.bark.bumpScale=.055;for(const n of ['red','redlight','wood','dark']){mats[n].map=wood;mats[n].bumpMap=wood;mats[n].bumpScale=.012;}for(const n of ['rock','tile']){mats[n].map=stone;mats[n].bumpMap=stone;mats[n].bumpScale=.025;}mats.stone.map=null;mats.stone.bumpMap=null;mats.stone.color.set('#85857a');mats.stone.roughness=.94;
// Declared CC0 PBR scans add surface-scale grain to authored geometry. They
// contain neither the reference photograph nor a replacement scene image.
const loader=new T.TextureLoader(),assetUrl=p=>new URL('../assets/'+p,import.meta.url).href;
const [timberColor,timberNormal,timberRough,graniteColor,graniteNormal,graniteRough]=await Promise.all([
 'timber/diffuse-2k.jpg','timber/normal-gl-2k.png','timber/roughness-2k.jpg',
 'granite/granite-face-diff.png','granite/granite-face-nor_gl.png','granite/granite-face-rough.png'
].map(p=>loader.loadAsync(assetUrl(p))));
for(const t of[timberColor,timberNormal,timberRough,graniteColor,graniteNormal,graniteRough]){t.wrapS=t.wrapT=T.MirroredRepeatWrapping;t.anisotropy=8;textures.push(t);}
timberColor.colorSpace=graniteColor.colorSpace=T.SRGBColorSpace;
// The source is a lacquer scan. Its raw low roughness would make the painted
// structure mirror-like; preserve its variation inside a weathered range.
{const canvas=document.createElement('canvas');canvas.width=timberRough.image.width;canvas.height=timberRough.image.height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(timberRough.image,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height);for(let i=0;i<pixels.data.length;i+=4){const q=173+Math.round(pixels.data[i+1]*.30);pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=q;}c.putImageData(pixels,0,0);timberRough.image=canvas;timberRough.needsUpdate=true;}
for(const name of['red','redlight','wood','dark']){mats[name].bumpMap=null;mats[name].normalMap=timberNormal;mats[name].normalScale=new T.Vector2(.055,.055);mats[name].roughnessMap=timberRough;mats[name].roughness=name==='dark'?.92:name==='wood'?.78:.66;}
mats.wood.map=timberColor;mats.wood.color.set('#573f2b');
// Authored paint is baked as a portable PBR albedo from the independent scan.
// The physical grain remains visible without multiplying two dark pigments.
const paintedTimberMaps=new Map();
const scanCanvas=document.createElement('canvas');scanCanvas.width=1024;scanCanvas.height=1024;
const scanContext=scanCanvas.getContext('2d',{willReadFrequently:true});scanContext.drawImage(timberColor.image,0,0,1024,1024);const scanPixels=scanContext.getImageData(0,0,1024,1024).data;
const toLinear=q=>q<=.04045?q/12.92:Math.pow((q+.055)/1.055,2.4),toSRGB=q=>q<=.0031308?q*12.92:1.055*Math.pow(q,1/2.4)-.055;
function pigmentTimber(m,color){
 if(!paintedTimberMaps.has(color)){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const c=canvas.getContext('2d'),out=c.createImageData(1024,1024),paint=new T.Color(color),rgb=[paint.r,paint.g,paint.b];
  for(let i=0;i<scanPixels.length;i+=4){
   const l=.2126*toLinear(scanPixels[i]/255)+.7152*toLinear(scanPixels[i+1]/255)+.0722*toLinear(scanPixels[i+2]/255),grain=T.MathUtils.clamp(Math.pow(Math.max(.00001,l)/.015051207361250781,.42),.68,1.34);
   for(let k=0;k<3;k++)out.data[i+k]=Math.round(toSRGB(Math.min(.98,rgb[k]*grain))*255);out.data[i+3]=255;
  }
  c.putImageData(out,0,0);const map=new T.CanvasTexture(canvas);map.wrapS=map.wrapT=T.MirroredRepeatWrapping;map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;textures.push(map);paintedTimberMaps.set(color,map);
 }
 m.map=paintedTimberMaps.get(color);m.color.set('#ffffff');m.onBeforeCompile=()=>{};m.customProgramCacheKey=()=> 'scene08-portable-pigment148';return m;
}
for(const name of['red','redlight','wood','dark'])pigmentTimber(mats[name],{red:'#8c321b',redlight:'#a04c28',wood:'#4d2e20',dark:'#241d16'}[name]);
const finish191=installMaterialHierarchy191(mats,materials,peony);const finegilt213=mats.castgilt191.clone();finegilt213.name='scene08-213-weathered-cast-structural-end-shoes';finegilt213.color.setRGB(.60,.36,.105);finegilt213.roughness=.63;finegilt213.metalness=.76;mats.finegilt213=finegilt213;materials.push(finegilt213);mats.joinerygilt.color.setRGB(.37,.22,.065);mats.joinerygilt.roughness=.62;mats.joinerygilt.metalness=.82;

for(const t of[graniteColor,graniteNormal,graniteRough])t.repeat.set(2,1.5);
mats.rock.map=graniteColor;mats.rock.bumpMap=null;mats.rock.normalMap=graniteNormal;mats.rock.normalScale=new T.Vector2(.30,.30);mats.rock.roughnessMap=graniteRough;mats.rock.color.setRGB(.72,.74,.68);mats.rock.normalScale.set(.55,.55);mats.rock.roughness=.95;mats.rock.onBeforeCompile=()=>{};mats.rock.customProgramCacheKey=()=> 'scene08-independent-granite213';installDampStone213(mats.rock);
const [carvedAlbedo,stairAlbedo]=await Promise.all(['granite/carved-gray-albedo148.png','granite/stair-gray-albedo148.png'].map(p=>loader.loadAsync(assetUrl(p))));for(const t of[carvedAlbedo,stairAlbedo]){t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.MirroredRepeatWrapping;t.anisotropy=8;textures.push(t);}mats.stone.map=stairAlbedo;mats.stone.color.set('#ffffff');mats.stone.normalMap=graniteNormal;mats.stone.normalScale=new T.Vector2(.38,.38);mats.stone.roughnessMap=graniteRough;
const carvedGranite=[carvedAlbedo,graniteNormal,graniteRough].map(t=>{const c=t.clone();c.repeat.set(1.5,3);textures.push(c);return c;});
const boxG=new T.BoxGeometry(1,1,1),cylG=new T.CylinderGeometry(1,1,1,12),ballG=new T.SphereGeometry(1,8,6),torusG=new T.TorusGeometry(1,.12,5,16),leafG=new T.BufferGeometry();{const pos=[];for(let i=0;i<6;i++){const a=i/6,b=(i+1)/6,wa=Math.sin(a*Math.PI)*.34,wb=Math.sin(b*Math.PI)*.34,ya=Math.sin(a*Math.PI)*.11,yb=Math.sin(b*Math.PI)*.11;for(const side of[-1,1])for(const p of[[0,ya,a],[side*wa,ya*.2,a],[side*wb,yb*.2,b],[0,ya,a],[side*wb,yb*.2,b],[0,yb,b]])pos.push(...p);}leafG.setAttribute('position',new T.Float32BufferAttribute(pos,3));leafG.computeVertexNormals();}mats.leaf.side=mats.leaflight.side=mats.maple.side=mats.flower.side=T.DoubleSide;
{
 const p=leafG.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)/.68+.5,p.getZ(i));leafG.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 const n=128,h=256,data=new Uint8Array(n*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<n;x++){
  const u=x/(n-1)*2-1,v=y/(h-1),rib=Math.exp(-u*u/.0018),vein=Math.exp(-Math.pow(Math.sin((v*7.0+Math.abs(u)*1.6)*Math.PI)*16,2)),shade=.89+.055*rib+.035*vein+.014*Math.sin(v*29+u*3),q=(y*n+x)*4;
  data[q]=data[q+1]=data[q+2]=Math.round(shade*255);data[q+3]=255;
 }
 const leafTexture=new T.DataTexture(data,n,h);leafTexture.colorSpace=T.SRGBColorSpace;leafTexture.needsUpdate=true;textures.push(leafTexture);
 for(const ma of[mats.leaf,mats.leaflight,mats.maple]){ma.map=leafTexture;ma.bumpMap=leafTexture;ma.bumpScale=.0006;}
}

const galleryJoinery=createGardenJoinery213(),clayCoverG=createClayCoverTile(),clayPanG=createClayPanTile();for(const g of galleryJoinery.resources)geometries.add(g);for(const g of relief.resources)geometries.add(g);mats.gallerytile=new T.MeshPhysicalMaterial({name:'scene08-aged-glazed-cover-tile147',color:'#2b4258',roughness:.38,metalness:.015,clearcoat:.24,clearcoatRoughness:.32,map:stone,bumpMap:stone,bumpScale:.004});materials.push(mats.gallerytile);mats.ceramictile=mats.gallerytile.clone();mats.ceramictile.name='scene08-aged-closed-ceramic148';mats.ceramictile.color.set('#304457');mats.ceramictile.roughness=.46;mats.ceramictile.clearcoat=.18;materials.push(mats.ceramictile);
mats.leaf.color.set('#526932');mats.leaflight.color.set('#879948');mats.leaf.roughness=.46;mats.leaflight.roughness=.49;
material('pine','#426330',.82);const needleG=new T.BufferGeometry(),needleP=[];for(let k=0;k<9;k++){const a=k*2.39996,dx=Math.cos(a),dz=Math.sin(a),p=[[0,0,0],[dx*.027,.11,dz*.027],[dx*.09,.23,dz*.09]];for(let j=0;j<2;j++){const aa=p[j],bb=p[j+1],ww=.016*(1-j*.45);needleP.push(aa[0]-dz*ww,aa[1],aa[2]+dx*ww,aa[0]+dz*ww,aa[1],aa[2]-dx*ww,...bb);}}needleG.setAttribute('position',new T.Float32BufferAttribute(needleP,3));needleG.computeVertexNormals();mats.pine.side=T.DoubleSide;
const v=a=>new T.Vector3(...a);
function resolveMaterial191(ma){return typeof ma==='string'?(role==='foreground-veranda'&&mats['entry191_'+ma]?mats['entry191_'+ma]:mats[ma]):ma;}
const carvedMaterials197=new Map();function realCarvingMaterial197(g,m){if(!g.userData.closedCarvedTimber197)return m;if(!carvedMaterials197.has(m)){const q=m.clone();q.name=m.name+'-real-carved197';q.onBeforeCompile=m.onBeforeCompile;q.customProgramCacheKey=m.customProgramCacheKey;q.normalMap=null;q.roughness=.86;if(q.isMeshPhysicalMaterial){q.clearcoat=.045;q.clearcoatRoughness=.55;}materials.push(q);carvedMaterials197.set(m,q);}return carvedMaterials197.get(m);}
function emit(g,ma,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=[0,0,0],tint=1){const m=realCarvingMaterial197(g,resolveMaterial191(ma)),key=g.uuid+m.uuid;let b=buckets.get(key);if(!b)buckets.set(key,b={g,m,items:[]});const matrix=new T.Matrix4().compose(v([x,y,z]),new T.Quaternion().setFromEuler(new T.Euler(...rot)),v([sx,sy,sz])).premultiply(stack.at(-1));b.items.push({matrix,tint});geometries.add(g);roles[role]=(roles[role]||0)+1;}
const bevels=new Map();function bevelBox(w,h,d){const key=[w,h,d].join(',');if(bevels.has(key))return bevels.get(key);const geo=new T.BoxGeometry(w,h,d,3,3,3),p=geo.attributes.position,n=geo.attributes.normal,r=Math.min(.028,Math.min(w,h,d)*.13),half=[w/2-r,h/2-r,d/2-r];for(let i=0;i<p.count;i++){const point=new T.Vector3(p.getX(i),p.getY(i),p.getZ(i)),core=point.clone();core.x=T.MathUtils.clamp(core.x,-half[0],half[0]);core.y=T.MathUtils.clamp(core.y,-half[1],half[1]);core.z=T.MathUtils.clamp(core.z,-half[2],half[2]);const normal=point.clone().sub(core).normalize();point.copy(core).addScaledVector(normal,r);p.setXYZ(i,point.x,point.y,point.z);n.setXYZ(i,normal.x,normal.y,normal.z);}const dims=[w,h,d],longest=dims.indexOf(Math.max(...dims)),uv2=[];
for(let i=0;i<p.count;i++){
 const coords=[p.getX(i),p.getY(i),p.getZ(i)],nn=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],face=nn.indexOf(Math.max(...nn)),along=longest===face?(face+1)%3:longest,across=[0,1,2].find(k=>k!==face&&k!==along);
 uv2.push(coords[along],coords[across]);
}
geo.setAttribute('uv',new T.Float32BufferAttribute(uv2,2));bevels.set(key,geo);return geo;}const bevelRoles=new Set(['foreground-veranda','left-grand-hall','layered-walkways','main-hall-sanctum','five-tier-pagoda','arched-stream-bridge','gallery-stone-stair','upper-descending-gallery','right-court-hall171']);const box=(x,y,z,w,h,d,ma='red',yaw=0)=>bevelRoles.has(role)?emit(bevelBox(w,h,d),ma,x,y,z,1,1,1,[0,yaw,0]):emit(boxG,ma,x,y,z,w,h,d,[0,yaw,0]);
function group(x,y,z,yaw,fn,scale=1){stack.push(stack.at(-1).clone().multiply(new T.Matrix4().compose(v([x,y,z]),new T.Quaternion().setFromAxisAngle(v([0,1,0]),yaw),v(Array.isArray(scale)?scale:[scale,scale,scale]))));fn();stack.pop();}
function between(a,b,r,ma='red',round=false,depth=r){const av=v(a),bv=v(b),delta=bv.clone().sub(av),m=new T.Matrix4().compose(av.add(bv).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(v([0,1,0]),delta.clone().normalize()),v([r,delta.length(),depth])).premultiply(stack.at(-1)),g=round?cylG:boxG,mat=resolveMaterial191(ma),key=g.uuid+mat.uuid;let bucket=buckets.get(key);if(!bucket)buckets.set(key,bucket={g,m:mat,items:[]});bucket.items.push({matrix:m,tint:1});geometries.add(g);roles[role]=(roles[role]||0)+1;}
function line(points,r,ma='gold'){const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v)),Math.max(6,points.length*3),r,5,false);emit(g,ma);}
function rosette(x,y,z,r=.13){emit(torusG,'oldgold',x,y,z,r,r,r);for(let i=0;i<8;i++){const a=i*Math.PI/4;emit(ballG,'gold',x+Math.cos(a)*r*.65,y+Math.sin(a)*r*.65,z+.015,r*.25,r*.14,r*.12,[0,0,a]);}emit(ballG,'gold',x,y,z+.025,r*.29,r*.29,r*.14);}
function plaque(x,y,z,w,h){for(const p of createGatePlaque(w,h))emit(p.geometry,p.material,x,y,z);}
const columnShapes=new Map();
function column(x,z,y,h,r=.20){emit(cylG,role==='left-grand-hall'?'hallFoundation':'stone',x,y+.10,z,r*1.37,.20,r*1.37);const key=r+','+h;let shaft=columnShapes.get(key);
if(!shaft){shaft=new T.CylinderGeometry(r,r,h,24);const uv=shaft.attributes.uv;for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);uv.setXY(i,v*h,u*Math.PI*2*r);}columnShapes.set(key,shaft);}
emit(shaft,'red',x,y+h/2+.2,z);for(const yy of[y+.24,y+h-.03])emit(cylG,'oldgold',x,yy,z,r*1.04,.075,r*1.04);for(let k=0;k<3;k++)box(x,y+h-.08+k*.04,z+r*.99,r*1.4,.045,.035,'gold');}
const corbelShape=new T.Shape();corbelShape.moveTo(-.5,.13);corbelShape.lineTo(-.5,.27);corbelShape.quadraticCurveTo(-.38,.28,-.32,.18);corbelShape.lineTo(-.19,.18);corbelShape.quadraticCurveTo(-.16,-.02,0,-.035);corbelShape.quadraticCurveTo(.16,-.02,.19,.18);corbelShape.lineTo(.32,.18);corbelShape.quadraticCurveTo(.38,.28,.5,.27);corbelShape.lineTo(.5,.13);corbelShape.quadraticCurveTo(.36,.05,.30,-.04);corbelShape.quadraticCurveTo(.15,-.13,0,-.14);corbelShape.quadraticCurveTo(-.15,-.13,-.30,-.04);corbelShape.quadraticCurveTo(-.36,.05,-.5,.13);const corbelG=new T.ExtrudeGeometry(corbelShape,{depth:1,steps:1,curveSegments:5,bevelEnabled:true,bevelThickness:.025,bevelSize:.018,bevelSegments:1});corbelG.translate(0,0,-.5);
function brackets(x,y,z,s=.8){if(role==='five-tier-pagoda'){
 if(s>=.65){for(const p of galleryJoinery.parts)emit(p.geometry,p.material,x,y,z,s*.80,s*.90,s*.80);}
 else{const span=s>=.5?.50:.62;for(const yaw of[0,Math.PI/2])emit(corbelG,'redlight',x,y+.10*s,z,span,.62*s,.18,[0,yaw,0]);box(x,y+.21*s,z,.22,.15,.24,'wood');}
 return;}if(role==='left-grand-hall'){for(const p of galleryJoinery.parts)emit(p.geometry,p.material,x,y,z,s,s,s);return;}for(let level=0;level<3;level++){const off=level*.15*s;for(const dir of[0,1]){const span=(.70+level*.17)*s;emit(corbelG,'red',x,y+off,z,span,.52*s,.15*s,[0,dir*Math.PI/2,0]);for(const sign of[-1,1]){const dx=dir?0:sign*(.22+level*.09)*s,dz=dir?sign*(.22+level*.09)*s:0;box(x+dx,y+off-.07*s,z+dz,.14*s,.17*s,.14*s,'wood');if(level===2)box(x+dx,y+off+.06*s,z+dz,.13*s,.045*s,.13*s,'oldgold');}}}box(x,y+.53*s,z,1.48*s,.12*s,.34*s,'wood');box(x,y+.59*s,z+.18*s,.08*s,.05*s,.035*s,'gold');}
function ceramicTile(a,b,r=.077,tint=1){
 const av=v(a),bv=v(b),tangent=bv.clone().sub(av).normalize(),across=new T.Vector3().crossVectors(v([0,1,0]),tangent).normalize(),up=new T.Vector3().crossVectors(tangent,across).normalize();
 const basis=new T.Matrix4().makeBasis(across,up,tangent),rotation=new T.Euler().setFromRotationMatrix(basis),center=av.clone().add(bv).multiplyScalar(.5);
 emit(clayCoverG,role==='left-grand-hall'?'gallerytile':'ceramictile',center.x,center.y,center.z,r,r,av.distanceTo(bv),[rotation.x,rotation.y,rotation.z],tint);
}
function ceramicPan(a,b){
 const av=v(a),bv=v(b),tangent=bv.clone().sub(av).normalize(),across=new T.Vector3().crossVectors(v([0,1,0]),tangent).normalize(),up=new T.Vector3().crossVectors(tangent,across).normalize(),basis=new T.Matrix4().makeBasis(across,up,tangent),rotation=new T.Euler().setFromRotationMatrix(basis),center=av.clone().add(bv).multiplyScalar(.5);
 emit(clayPanG,role==='left-grand-hall'?'gallerytile':'ceramictile',center.x,center.y,center.z,.20,.12,av.distanceTo(bv),[rotation.x,rotation.y,rotation.z],.95);
}
const tileEndG=new T.CylinderGeometry(1,1,1,24);
function eaveTileEnd(p,side){
 const yaw=side===0?0:side===1?Math.PI/2:side===2?Math.PI:-Math.PI/2;
 group(...p,yaw,()=>{
  emit(tileEndG,'tileEnd',0,0,0,.102,.075,.102,[Math.PI/2,0,0]);
  emit(torusG,'tileedge',0,0,.043,.094,.094,.094);
  if(role==='left-grand-hall'){
   emit(torusG,'tileedge',0,0,.047,.062,.062,.062);
   for(let k=0;k<8;k++){
    const a=k*Math.PI/4;
    emit(ballG,'tileedge',Math.sin(a)*.040,Math.cos(a)*.040,.047,.012,.026,.007,[0,0,-a]);
   }
   emit(ballG,'tileedge',0,0,.051,.019,.019,.008);
  }
 });
}
// Four continuously meeting hip panels, individually curved ceramic rolls,
// deep curved timber rafters, edge discs and gilded fittings.
function roof(w,d,eave,rise,curl=.65,ridgeRatio=.22,hornHeight=.52,grade=0){const hw=w/2,hd=d/2,rh=w*ridgeRatio;
// A single closed four-hip roof owns the continuous descending right eave.
// Its observed freeform plan is inferred in world metres; all four panels
// meet the same ridge and corner curves. No view-dependent deformation occurs.
const falling=role==='left-grand-hall',peak=eave+rise,profile213=falling?createGrandRoofProfile213({frame:grandFrame,w,d,eave,rise,curl,ridgeRatio}):null;
function P(side,t,u){
 if(falling)return profile213.point(side,t,u);
 const span=rh+(hw-rh)*t;let x=side%2?(side===1?1:-1)*span:u*span,z=side%2?u*hd*t:(side===0?1:-1)*hd*t;
 return [x,eave+grade*x+rise*Math.pow(Math.max(0,1-t),1.65)+curl*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),7)),z];
}
// CPU-only geometric bearing query of the exact authored weather surface.
// This uses actual triangle XZ barycentrics, never image depth or camera UVs.
const roofProbe=[];
for(let side=0;side<4;side++)for(let j=0;j<18;j++)for(let i=0;i<36;i++){
 const a=P(side,j/18,-1+2*i/36),b=P(side,(j+1)/18,-1+2*i/36),c=P(side,j/18,-1+2*(i+1)/36),d=P(side,(j+1)/18,-1+2*(i+1)/36);
 for(const [p,q,r]of[[a,b,c],[b,d,c]]){const den=(q[2]-r[2])*(p[0]-r[0])+(r[0]-q[0])*(p[2]-r[2]);if(Math.abs(den)<1e-9)continue;roofProbe.push({p,q,r,den,minX:Math.min(p[0],q[0],r[0]),maxX:Math.max(p[0],q[0],r[0]),minZ:Math.min(p[2],q[2],r[2]),maxZ:Math.max(p[2],q[2],r[2])});}
}
function surfaceY(x,z){let y=-Infinity;for(const t of roofProbe){if(x<t.minX-1e-6||x>t.maxX+1e-6||z<t.minZ-1e-6||z>t.maxZ+1e-6)continue;const{p,q,r,den}=t,a=((q[2]-r[2])*(x-r[0])+(r[0]-q[0])*(z-r[2]))/den,b=((r[2]-p[2])*(x-r[0])+(p[0]-r[0])*(z-r[2]))/den,c=1-a-b;if(Math.min(a,b,c)>=-1e-5)y=Math.max(y,a*p[1]+b*q[1]+c*r[1]);}return Number.isFinite(y)?y:null;}
for(let side=0;side<4;side++){const pp=[],uv=[],tri=(a,b,c)=>{for(const p of[a,b,c]){pp.push(...p);uv.push(p[0],p[2]);}};for(let j=0;j<18;j++)for(let i=0;i<36;i++){const a=P(side,j/18,-1+2*i/36),b=P(side,(j+1)/18,-1+2*i/36),c=P(side,j/18,-1+2*(i+1)/36),d=P(side,(j+1)/18,-1+2*(i+1)/36);if(side%2===0){tri(a,b,c);tri(b,d,c);}else{tri(a,c,b);tri(b,c,d);}}
const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();mats.tile.side=T.DoubleSide;emit(g,'tile');const underside=g.clone(),up=underside.attributes.position;for(let k=0;k<up.count;k++)up.setY(k,up.getY(k)-.14);for(let k=0;k<up.count;k+=3){for(let c=0;c<3;c++){const a=up.array[(k+1)*3+c];up.array[(k+1)*3+c]=up.array[(k+2)*3+c];up.array[(k+2)*3+c]=a;}}underside.computeVertexNormals();mats.wood.side=T.DoubleSide;if(role==='left-grand-hall')mats.red.side=T.DoubleSide;emit(underside,role==='left-grand-hall'?'red':'wood');
const sideWalls=[];for(const edge of[0,1,2,3])for(let j=0;j<24;j++){
 const t0=j/24,t1=(j+1)/24,a=edge===0?P(side,1,-1+2*t0):edge===1?P(side,t0,-1):edge===2?P(side,t0,1):P(side,0,-1+2*t0),b=edge===0?P(side,1,-1+2*t1):edge===1?P(side,t1,-1):edge===2?P(side,t1,1):P(side,0,-1+2*t1),c=[a[0],a[1]-.14,a[2]],d=[b[0],b[1]-.14,b[2]];
 for(const q of[a,c,b,b,c,d])sideWalls.push(...q);
}const closure=new T.BufferGeometry();closure.setAttribute('position',new T.Float32BufferAttribute(sideWalls,3));closure.computeVertexNormals();emit(closure,role==='left-grand-hall'?'red':'wood');
const n=Math.ceil((side%2?d:w)/(role==='left-grand-hall'?.24:.24));for(let i=0;i<=n;i++){const u=-1+2*i/n,p=P(side,1,u);for(let j=0;j<14;j++){const a=P(side,j/14,u),b=P(side,Math.min(1,(j+(role==='left-grand-hall'?1.055:.96))/14),u);a[1]+=.020;b[1]+=.020;ceramicTile(a,b,role==='left-grand-hall'?.107:.078,.91+.11*Math.sin(i*1.33+j*2.71+side*.81));}const discRot=side%2?[0,0,Math.PI/2]:[Math.PI/2,0,0];eaveTileEnd(p,side);if(role==='left-grand-hall'||i%2===0){if(role==='left-grand-hall'){const path=Array.from({length:15},(_,j)=>{const q=P(side,j/14,u);q[1]-=.26;return q;});emit(createContinuousTimber(path,.052,.085,.006),'red');const tail=Array.from({length:6},(_,j)=>{const q=P(side,.72+j*.29/5,u);q[1]-=.18;return q;});emit(createContinuousTimber(tail,.058,.085,.006),'wood');emit(bevelBox(.070,.095,.025),'joinerygilt',p[0],p[1]-.18,p[2]);}else{for(let rj=0;rj<9;rj++){const ra=P(side,rj/9,u),rb=P(side,(rj+1)/9,u);ra[1]-=.26;rb[1]-=.26;between(ra,rb,.075,'redlight',false,.12);}let q=P(side,.72,u);const qq=P(side,1.01,u);q[1]-=.18;qq[1]-=.18;between(q,qq,.09,'wood',false,.12);emit(boxG,'gold',p[0],p[1]-.18,p[2],.07,.095,.07);}}}
for(let i=0;i<Math.ceil((side%2?d:w)/(role==='left-grand-hall'?.24:.24));i++){
 const n=Math.ceil((side%2?d:w)/(role==='left-grand-hall'?.24:.24)),u=-1+(2*i+1)/n;
 for(let j=0;j<14;j++){const a=P(side,j/14,u),b=P(side,Math.min(1,(j+1.055)/14),u);a[1]+=.007;b[1]+=.007;ceramicPan(a,b);}
}
if(role==='left-grand-hall')for(const t of[.61,.72,.83,.94]){
 const path=Array.from({length:33},(_,i)=>{const q=P(side,t,-1+2*i/32);q[1]-=.36;return q;});emit(createContinuousTimber(path,.052,.070,.006),'redlight');
}
for(let i=0;i<36;i++){const a=P(side,1,-1+2*i/36),b=P(side,1,-1+2*(i+1)/36);for(const dy of[-.12,-.25]){a[1]+=dy;b[1]+=dy;between(a,b,dy===-.12?.115:.052,dy===-.12?'wood':'red');a[1]-=dy;b[1]-=dy;}}
for(const u of [-1,1]){const pts=Array.from({length:17},(_,i)=>P(side,i/16,u).map((q,k)=>q+(k===1?.10:0)));line(pts,.095,'tileedge');const tip=P(side,1,u);if(!falling)line([tip,[tip[0]*1.035,tip[1]+hornHeight*.58,tip[2]*1.035],[tip[0]*1.04,tip[1]+hornHeight,tip[2]*1.04]],.09,'tileedge');}}
if(falling)emit(createContinuousTimber(Array.from({length:33},(_,i)=>profile213.ridge(-1+2*i/32).map((v,k)=>v+(k===1?.07:0))),.18,.17,.014),'tileedge');else if(Math.abs(grade)<.00001)box(0,eave+rise+.07,0,rh*2+.3,.19,.25,'tileedge');else between([-rh-.15,eave+rise+.07-grade*(rh+.15),0],[rh+.15,eave+rise+.07+grade*(rh+.15),0],.19,'tileedge',false,.25);if(ridgeRatio>.1&&role!=='upper-descending-gallery')for(const sx of[-1,1]){const p=falling?profile213.ridge(sx):[sx*rh,eave+rise+grade*sx*rh,0];line([p,[p[0]+sx*.13,p[1]+(falling?.22:.34),0],[p[0]+sx*.18,p[1]+(falling?.38:.55),0]],falling?.065:.095,'tileedge');}return{surfaceY,point:P,profile213:profile213?.info};}
// A curved tiled gable is an actual bonnet in front of the hip roof. Its
// stepped timber infill, bargeboards and ceramic rolls share the curved crown.
function curvedGable(cx,z,eave,width=4.0,rise=1.5,depth=2.2,closeFace=true,ornate=true){
 const profile=u=>eave+rise*Math.exp(-3.4*u*u)+.24*Math.pow(Math.abs(u),10);
 const P=(u,t)=>[cx+u*width/2,profile(u)-.33*rise*Math.exp(-3.4*u*u)*t+.58*t,z-depth*t];
 const pp=[],uv=[];for(let j=0;j<16;j++)for(let i=0;i<64;i++){
  const a=P(-1+2*i/64,j/16),b=P(-1+2*(i+1)/64,j/16),c=P(-1+2*i/64,(j+1)/16),d=P(-1+2*(i+1)/64,(j+1)/16);
  for(const v of[a,c,b,b,c,d]){pp.push(...v);uv.push(v[0],v[2]);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();emit(g,'tile');
 if(closeFace){const panel=new T.Shape();panel.moveTo(cx-width/2,eave-.04);for(let i=0;i<=64;i++){const u=-1+2*i/64;panel.lineTo(cx+u*width/2,profile(u)-.16);}panel.lineTo(cx+width/2,eave-.04);panel.closePath();const pg=new T.ExtrudeGeometry(panel,{depth:.13,steps:1,bevelEnabled:true,bevelThickness:.025,bevelSize:.02,bevelSegments:2});emit(pg,'wood',0,0,z-.10);}
 for(const drop of[.05,.20,.31])line(Array.from({length:65},(_,i)=>{const u=-1+2*i/64;return[cx+u*width/2,profile(u)-drop,z+.035];}),drop===.05?.075:drop===.20?.075:.023,drop===.31?'oldgold':drop===.05?'tileedge':'red');
 for(let i=0;i<=24;i++){
  const u=-1+2*i/24;for(let j=0;j<8;j++){const a=P(u,j/8),b=P(u,Math.min(1,(j+1.05)/8));a[1]+=.012;b[1]+=.012;ceramicTile(a,b,.055,.95+.045*Math.sin(i*2.11+j*1.31));}
  const yy=profile(u);emit(cylG,'tileedge',cx+u*width/2,yy+.025,z+.035,.073,.07,.073,[Math.PI/2,0,0]);
  emit(torusG,'tileedge',cx+u*width/2,yy+.025,z+.08,.064,.064,.064);
 }
 for(const sign of[-1,1]){
  const x=cx+sign*width*.47,y=profile(sign*.94)+.05;
  line([[x,y,z+.03],[x+sign*.17,y+.16,z+.03],[x+sign*.12,y+.33,z+.03],[x,y+.30,z+.03]],.055,'tileedge');
  for(let j=0;j<7;j++){
   const xx=cx+sign*(.29+j*.20),u=(xx-cx)/(width/2),top=profile(u)-.35;
   if(top>eave+.06)box(xx,(eave+top)/2,z+.05,.035,top-eave,.035,'redlight');
  }
 }
 if(ornate){rosette(cx,eave+.57,z+.12,.19);for(const sign of[-1,1])line([[cx+sign*.2,eave+.55,z+.13],[cx+sign*.46,eave+.43,z+.13],[cx+sign*.68,eave+.55,z+.13],[cx+sign*.92,eave+.28,z+.13]],.035,'oldgold');}
}
function lattice(x,y,z,w,h){box(x,y,z,w,h,.09,'dark');for(let i=0;i<=Math.ceil(w/.14);i++)box(x-w/2+i*w/Math.ceil(w/.14),y,z+.065,.028,h,.03,'dark');for(let i=0;i<=Math.ceil(h/.19);i++)box(x,y-h/2+i*h/Math.ceil(h/.19),z+.08,w,.028,.03,'wood');for(const sx of[-1,1])box(x+sx*w/2,y,z+.10,.09,h+.12,.13,'red');}
function hall(w,d,h,{raised=.5,walls=true,lanterns=true,roofRise=Math.min(w,d)*.26,buildRoof=true,roofEaveDrop=0,roofCurl=.65,roofHorn=.52,frontHeight=h*.63,frontCenter=raised+h*.42,frontOpening=false}={}){if(role==='left-grand-hall'){box(0,raised-.12,0,w*.9,.24,d*.62,'hallFoundation');}else box(0,raised/2,0,w*.9,raised,d*.86,'stone');box(0,raised+.06,0,w*.88,.12,role==='left-grand-hall'?d*.62:d*.89,role==='left-grand-hall'?'dark':'stone');const front=d*.37;
for(const z of[-front,front]){if(role==='left-grand-hall'&&raised>2)for(let x=-w*.36;x<=w*.37;x+=w*.18)column(x,z,0,raised-.25,.13);for(let x=-w*.36;x<=w*.37;x+=w*.18){if(frontOpening&&z>0&&Math.abs(x)<w*.28)continue;column(x,z,raised,h-.85,.18);brackets(x,h+raised-.7,z,.78);}box(0,h+raised-.12,z,w*.88,.29,.33,'red');box(0,h+raised-.52,z,w*.86,.20,.26,'red');for(let i=0;i<Math.ceil(w/.27);i++)box(-w*.44+i*.27,h+raised-.42,z+.19,.09,.1,.05,'gold');}
for(const x of[-w*.36,w*.36])for(const z of[-d*.18,0,d*.18]){if(role==='left-grand-hall'&&raised>2)column(x,z,0,raised-.25,.13);column(x,z,raised,h-.85,.18);brackets(x,h+raised-.7,z,.78);}
if(walls){if(role==='left-grand-hall'){
 // Each long return is framed as eight narrow timber bays. Small plaster
 // spandrels stop at the sill and lintel; the dark lattice panels sit in the
 // openings instead of floating over one continuous cream wall slab.
 const sideStart=-d*.36,sideSpan=d*.72,sidePitch=sideSpan/8;
 for(const sign of[-1,1]){
  const xx=sign*w*.36;
  for(let i=0;i<8;i++){
   const zz=sideStart+(i+.5)*sidePitch,bayW=sidePitch*.74;
   group(xx-sign*.17,0,zz,sign*Math.PI/2,()=>{
    box(0,raised+.53,0,bayW,.24,.12,'wall');
    lattice(0,raised+2.10,0,bayW*.64,1.95);
    box(0,raised+3.47,0,bayW,.30,.12,'wall');
   });
   group(xx+sign*.15,h+raised-.72,zz,sign*Math.PI/2,()=>brackets(0,0,0,.39));
  }
  for(const yy of[raised+.22,raised+1.08,raised+3.15,raised+h*.65,raised+h*.80])box(xx+sign*.11,yy,0,.22,.16,d*.76,'red');
  for(let j=0;j<=8;j++){
   const zz=sideStart+j*sidePitch;
   box(xx+sign*.11,raised+h*.48,zz,.22,h*.92,.20,'red');
  }
 }
 // A shadowed, timber-gridded inner return gives the front lattice real depth
 // and removes the broad pale wall that showed through every open bay.
 box(0,raised+2.20,-front,w*.72,4.40,.14,'wood');
 for(const x of[-w*.36,-w*.18,0,w*.18,w*.36])box(x,raised+2.20,-front+.12,.14,4.20,.18,'red');
 for(const yy of[raised+.34,raised+1.12,raised+3.47,raised+4.16])box(0,yy,-front+.13,w*.72,.14,.18,'red');
 // Four measured facade bays keep the existing post rhythm but shrink the
 // bright infill to low spandrels around recessed, dark timber screens.
 const facadeXs=[-w*.27,-w*.09,w*.09,w*.27],facadeBay=w*.18;
 for(const x of facadeXs){
  box(x,raised+.52,front-.32,facadeBay*.78,.24,.12,'wall');
  lattice(x,raised+2.55,front-.28,facadeBay*.64,2.30);
  box(x,raised+3.85,front-.32,facadeBay*.78,.28,.12,'wall');
 }
 for(const yy of[raised+1.29,raised+3.70,raised+4.65])box(0,yy,front-.03,w*.76,.13,.18,'red');
}else{
 for(const sign of[-1,1]){const xx=sign*w*.36,sideWallH=h*.79,sideWallY=raised+h*.42;box(xx,sideWallY,0,.14,sideWallH,d*.73,'wall');const sideWindowH=Math.min(4.4,h*.59);for(const zz of[-d*.27,-d*.09,d*.09,d*.27])group(xx+sign*.09,0,zz,sign*Math.PI/2,()=>lattice(0,raised+sideWindowH/2+.25,.0,d*.14,sideWindowH));for(const yy of[raised+.22,raised+h*.65,raised+h*.80])box(xx+sign*.11,yy,0,.22,.21,d*.76,'red');for(let j=0;j<=8;j++){const zz=-d*.36+j*d*.09;box(xx+sign*.11,raised+h*.48,zz,.22,h*.92,.20,'red');if(h>7)brackets(xx+sign*.15,h+raised-.75,zz,.76);}}
 box(0,raised+h*.48,-front,w*.75,h*.87,.16,'wall');box(-w*.36,raised+h*.48,0,.12,h*.87,d*.72,'wall');
 for(const x of[-w*.27,-w*.09,w*.09,w*.27]){lattice(x,frontCenter,front-.22,w*.14,frontHeight);box(x,raised+h*.84,front-.1,w*.14,h*.13,.12,'wall');}
 for(const y of[raised+.2,raised+h*.74])box(0,y,front-.12,w*.76,.18,.19,'red');
}}
// A second, close-spaced bracket line supports the projecting canopy rather
// than leaving a bare rectangular girder across each elevation.
for(const sign of[-1,1]){
 const z=sign*d*.42,n=Math.ceil(w/(role==='left-grand-hall'?.95:.76));for(let i=0;i<=n;i++){
  const x=-w*.42+i*w*.84/n;brackets(x,h+raised-.57,z,role==='left-grand-hall'?.42:.48);
  box(x,h+raised-.82,z,.21,.22,.28,'red');
  group(x,h+raised-.84,z+sign*.16,sign<0?Math.PI:0,()=>rosette(0,0,0,.072));
 }
 for(const yy of[h+raised-.72,h+raised-.93])box(0,yy,sign*d*.375,w*.85,.105,.22,'red');
}
if(buildRoof)roof(w,d,h+raised-roofEaveDrop,roofRise+roofEaveDrop,roofCurl,.22,roofHorn);if(lanterns)for(const x of[-w*.30,w*.30])lantern(x,h+raised-1.25,front+.25,.38);}
function lantern(x,y,z,s=.5){between([x,y+s*.9,z],[x,y+s*2.9,z],s*.045,'oldgold',true);box(x,y,z,s*.92,s*1.45,s*.83,'paper');for(const sx of[-1,1])for(const sz of[-1,1])box(x+sx*s*.47,y,z+sz*s*.43,s*.07,s*1.5,s*.07,'dark');for(let j=-3;j<=3;j++)for(const zz of[-1,1]){box(x+j*s*.13,y,z+zz*s*.45,s*.024,s*1.4,s*.025,'oldgold');box(x,y+j*s*.21,z+zz*s*.46,s*.92,s*.022,s*.025,'oldgold');}for(const yy of[-1,1]){box(x,y+yy*s*.78,z,s*1.08,s*.14,s*1.03,'dark');emit(cylG,'gold',x,y+yy*s*.94,z,s*.2,s*.2,s*.2);}for(const zz of[-1,1])rosette(x,y,z+zz*s*.48,s*.30);}
function recedingWingRoof(){
 const {w,zMin,zMax,lowY,highY}=wingFrame,span=zMax-zMin;
 roof(w+1.0,span+1.0,lowY,1.48,.54,.14,.24);
 const ledgerX=-w/2+.10,ledgerY=lowY-.24;
 box(ledgerX,ledgerY,(zMin+zMax)/2,.18,.25,span+.12,'wood');
 for(const z of wingFrame.postZ){
  column(ledgerX,z,.50,ledgerY-.60,.15);
  brackets(ledgerX,ledgerY-.40,z,.44);
  box(0,lowY-.10,z,w*.98,.16,.20,'wood');
 }
 for(const side of[-1,1]){
  const x=side*w/2;
  for(const y of[lowY-.12,lowY-.39])box(x,y,0,.19,.17,span+.10,'red');
 }
 // Keep the far porch return open: only short infill bands sit behind its
 // post line, while dark framed lattice doors occupy the sheltered bays.
 const wallZ=zMin-.08,bottom=.50,bounds=[-w/2+.08,0,w/2-.08],topAt=x=>lowY-.16;
 for(let b=0;b<2;b++){
  const x0=bounds[b],x1=bounds[b+1],xc=(x0+x1)/2,bayW=x1-x0,windowW=.88,windowBottom=.80,windowTop=Math.max(1.05,topAt(xc)-.42);
  box(xc,.83,wallZ+.05,bayW-.10,.26,.12,'wall');
  box(xc,topAt(xc)-.30,wallZ+.05,bayW-.10,.24,.12,'wall');
  lattice(xc,(windowBottom+windowTop)/2,wallZ+.12,windowW,windowTop-windowBottom);
  for(const y of[windowBottom,windowTop])box(xc,y,wallZ+.16,windowW+.16,.12,.18,'red');
  for(const x of(b===0?[x0,x1]:[x1])){const top=topAt(x);box(x,(bottom+top)/2,wallZ+.10,.16,top-bottom,.19,'red');}
 }
 box(0,.66,wallZ+.10,w*.96,.16,.20,'red');
}

// The reference hall is broad across the image: its short right return
// recedes behind a deep bracket cornice. A two-storey-height rectangular
// screen wall and a reversed roof azimuth had hidden this load path before.
// These coordinates are the physical timber frame, not a camera-space mesh.
const grandFrame={x:-3.954,z:-8.701,yaw:-.28,w:9.30,d:8.50,floor:4.40,lintel:9.25,eave:10.30,rise:4.25};
const spatial191=createSpatialPortals191({emit,box,between,group});
function grandRoofWorld191(x,z){const dx=x-grandFrame.x,dz=z-grandFrame.z,c=Math.cos(grandFrame.yaw),s=Math.sin(grandFrame.yaw);return grandRoof191?.surfaceY(c*dx-s*dz,s*dx+c*dz)??null;}
function inGrandHallFootprint(x,z,padding=.18){
 const dx=x-grandFrame.x,dz=z-grandFrame.z,c=Math.cos(grandFrame.yaw),s=Math.sin(grandFrame.yaw),lx=c*dx-s*dz,lz=s*dx+c*dz;
 return lx> -2.15-padding&&lx<1.35+padding&&lz> -3.60-padding&&lz<2.80+padding;
}
function monumentalHall(){
 const original={red:mats.red,redlight:mats.redlight,wood:mats.wood,dark:mats.dark};
 for(const [name,color]of Object.entries({red:'#8c3a22',redlight:'#934329',wood:'#59301f',dark:'#231a13'})){
  const m=mats[name].clone();m.onBeforeCompile=mats[name].onBeforeCompile;m.customProgramCacheKey=mats[name].customProgramCacheKey;m.name='grand-hall-'+name;pigmentTimber(m,color);if(m.normalMap)m.normalScale.set(.22,.22);m.roughness=name==='wood'?.86:.82;m.envMapIntensity=.55;materials.push(m);mats[name]=m;
 }
 const roof171=roof(grandFrame.w,grandFrame.d,grandFrame.eave,grandFrame.rise,.34,.20,.30);
 grandRoof191=roof171;grandMass171=buildGrandBearing171({emit,box,between,group,lantern,lattice,galleryJoinery,grandFrame,peony,roof171,spatial191});
 Object.assign(mats,original);
}
role='left-grand-hall';group(grandFrame.x,0,grandFrame.z,grandFrame.yaw,monumentalHall);
// A lower hipped gallery is connected to the hall's right return. Its high
// ledger bears against that wall and every outer post meets a stone pier.
const wingYaw=.65,wingScale=.90,wingW=4.2,wingHighWorldY=7.50,wingLowWorldY=6.40,wingGroupY=3.50,wingHighY=(wingHighWorldY-wingGroupY)/wingScale,wingLowY=(wingLowWorldY-wingGroupY)/wingScale,wingZMin=-3.0,wingZMax=3.0,wingPostZ=[-2.7,-1.35,0,1.35,2.7];
const wingAnchorX=grandFrame.x+3.2*Math.cos(grandFrame.yaw)-.60*Math.sin(grandFrame.yaw),wingAnchorZ=grandFrame.z-3.2*Math.sin(grandFrame.yaw)-.60*Math.cos(grandFrame.yaw),wingNearX=wingScale*(-wingW/2*Math.cos(wingYaw)+wingZMax*Math.sin(wingYaw)),wingNearZ=wingScale*(wingW/2*Math.sin(wingYaw)+wingZMax*Math.cos(wingYaw)),wingX=wingAnchorX-wingNearX,wingZ=wingAnchorZ-wingNearZ,wingFrame={x:wingX,y:wingGroupY,z:wingZ,yaw:wingYaw,scale:wingScale,w:wingW,zMin:wingZMin,zMax:wingZMax,lowY:wingLowY,highY:wingHighY,postZ:wingPostZ};
group(grandFrame.x,0,grandFrame.z,grandFrame.yaw,()=>{
 for(let j=0;j<6;j++){const top=grandFrame.floor-j*.075;box(1.48+j*.30,(3.70+top)/2,-.60,.34,top-3.70,1.40,'wood');}
});
const lowerGalleryFrame={x:.0115,z:-9.342,yaw:.738,run:5.097,width:3.10};
role='layered-walkways';
group(lowerGalleryFrame.x,0,lowerGalleryFrame.z,lowerGalleryFrame.yaw,()=>{
 const run=lowerGalleryFrame.run,floorAt=x=>3.75-.50*x/run,eaveAt=x=>6.40-x/run;
 for(let i=0;i<30;i++){const x=-run/2+(i+.5)*run/30;box(x,floorAt(x)-.06,0,run/30-.009,.13,2.42,'wood');}
 for(const z of[-1.02,1.02])emit(createContinuousTimber([[-run/2,floorAt(-run/2)-.20,z],[run/2,floorAt(run/2)-.20,z]],.20,.25,.012),'wood');
 for(let j=0;j<6;j++){
  const x=-run*.46+j*run*.92/5,fy=floorAt(x),ey=eaveAt(x);
  for(const z of[-.92,.92]){
   column(x,z,fy,ey-fy-.67,.175);
   for(const q of galleryJoinery.parts)emit(q.geometry,q.material,x,ey-.61,z,.43,.60,.43);
  }
  if(j<5){const xx=x+run*.092;if(j===2)spatial191.portal({x:xx,z:-.55,lo:floorAt(xx)+.035,hi:eaveAt(xx)-.75,width:.76,depth:.47,jamb:.08,label:'lower-court-stair-bay'});else{box(xx,floorAt(xx)+1.05,-.67,.84,2.04,.12,'dark');lattice(xx,floorAt(xx)+1.10,-.55,.65,1.70);box(xx,eaveAt(xx)-.82,-.52,.85,.26,.13,'wall');}}
  box(x,ey-.31,0,.16,.18,2.55,'red');
 }
 for(const z of[-1.02,1.02])for(const dy of[-.25,-.51])emit(createContinuousTimber([[-run*.5,eaveAt(-run*.5)+dy,z],[run*.5,eaveAt(run*.5)+dy,z]],.18,.21,.011),'red');
 roof(run+.48,3.10,6.40,1.17,.29,.30,.20,-1/run);
 for(const x of[-1.48,1.48])lantern(x,eaveAt(x)-1.0,1.10,.28);
});
group(-2.20,0,-7.45,.12,()=>{for(let i=0;i<4;i++){const top=4.40-i*.105;box(-.30+i*.20,(3.88+top)/2,0,.23,top-3.88,1.16,'wood');}});
// The reference contains an intermediate upper gallery between the large
// near hall and the lower courtyard canopy. Its real pitched roof descends
// along the circulation route; it is not a flat extension of the main hip.
role='upper-descending-gallery';
{
 const a=[-2.09,-7.35],b=[2.24,-9.80],run=Math.hypot(b[0]-a[0],b[1]-a[1]),yaw=Math.atan2(-(b[1]-a[1]),b[0]-a[0]),grade=-1.30/run;
 group((a[0]+b[0])/2,0,(a[1]+b[1])/2,yaw,()=>{
  const floorAt=x=>4.10-.60*x/run,eaveAt=x=>8.75+grade*x;
  // Stone piers and individual deck members share the same sloping datum.
  for(let i=0;i<28;i++){
   const x=-run/2+(i+.5)*run/28,fy=floorAt(x);box(x,fy-.14,0,run/28-.008,.18,2.27,'wood');
   if(i%7===0)for(const z of[-.92,.92])box(x,(fy-1.4)/2+.7,z,.38,fy-1.40,.42,'hallFoundation');
  }
  for(const z of[-.96,.96])emit(createContinuousTimber([[-run/2,floorAt(-run/2)-.25,z],[run/2,floorAt(run/2)-.25,z]],.19,.27,.014),'wood');
  for(let i=0;i<5;i++){
   const x=-run*.46+i*run*.92/4,fy=floorAt(x),ey=eaveAt(x);
   const nearZ=.84,wx=(a[0]+b[0])/2+Math.cos(yaw)*x+Math.sin(yaw)*nearZ,wz=(a[1]+b[1])/2-Math.sin(yaw)*x+Math.cos(yaw)*nearZ;
   spatial191.galleryReceiver({x,z:nearZ,floor:fy,weatherY:grandRoofWorld191(wx,wz),column,galleryJoinery,label:'upper-court-queried-front-'+i});
   for(const z of[-.89,-.30]){
    column(x,z,fy,ey-fy-.83,.18);
    for(const q of galleryJoinery.parts)emit(q.geometry,q.material,x,ey-.75,z,.63,.80,.63);
    box(x,ey-.30,z,.19,.22,.65,'red');
   }
   box(x,ey-.38,0,.18,.20,2.48,'red');
   if(i<4){
    const xx=x+run*.115,doorY=floorAt(xx)+1.64;
    if(i===1||i===2)spatial191.portal({x:xx,z:-.44,lo:floorAt(xx)+.04,hi:eaveAt(xx)-1.02,width:run*.20-.13,depth:.50,jamb:.085,label:'upper-court-connected-door-'+i});
    else{box(xx,doorY,-.57,run*.20,3.15,.15,'dark');lattice(xx,doorY,-.46,run*.16,2.64);box(xx,doorY+1.51,-.42,run*.205,.30,.19,'wall');}
    group(xx,eaveAt(xx)-.81,-.30,0,()=>{for(const q of relief.variants[i])emit(q.geometry,q.material,0,0,0,1.17,.85,1);});
   }
  }
  for(const z of[-1.04,1.04])for(const dy of[-.30,-.65])emit(createContinuousTimber([[-run*.49,eaveAt(-run*.49)+dy,z],[run*.49,eaveAt(run*.49)+dy,z]],.21,.22,.013),'red');
  // This bearing gallery is sheltered by the actual continuous main return
  // roof above. It has no duplicate gabled canopy or floating ridge ornament.
  for(const x of[-run*.36,run*.36])lantern(x,eaveAt(x)-1.29,1.13,.30);
 });
}
role='layered-walkways';group(-4.0,.1,-13,.13,()=>hall(7.5,7.4,5.9),.82);group(-1.5,.0,-17,0,()=>hall(7.6,6.5,4.8),.80);
const rightHallFrame171={x:8.4,y:3.0,z:-14.2,yaw:-.90,scale:.62,floorWorldY:4.302,roofRise:4.20};
role='right-court-hall171';group(rightHallFrame171.x,rightHallFrame171.y,rightHallFrame171.z,rightHallFrame171.yaw,()=>{
 const w=9.2,d=8.3,front=d*.37,raised=2.1,eave=10.70;
 // One real six-axis frame carries five recessed door bays. The previous
 // generic hall plus custom porch duplicated shafts through the door centres.
 const postAxes=[-4.05,-2.43,-.81,.81,2.43,4.05];
 box(0,raised-.06,0,8.60,.18,6.65,'stone');
 for(const z of[-front,front+.13])for(const x of postAxes){column(x,z,raised,6.28,.32);for(const p of galleryJoinery.parts)emit(p.geometry,p.material,x,8.66,z,.80,1.28,.80);}
 for(const side of[-1,1])for(const z of[-2.05,0,2.05]){column(side*4.05,z,raised,6.28,.30);for(const p of galleryJoinery.parts)emit(p.geometry,p.material,side*4.05,8.66,z,.78,1.28,.78);}
 for(const z of[-front,front+.13])box(0,9.68,z,8.48,.25,.50,'red');
 for(const side of[-1,1])box(side*4.05,9.68,0,.44,.25,6.70,'red');
 roof(w,d,eave,rightHallFrame171.roofRise,1.02,.22,.30);
 box(0,raised-.17,0,w*.86,.28,d*.80,'hallFoundation');
 // Five separate doors occupy the back wall; the projecting veranda remains
 // open between its columns, with a coffered timber ceiling overhead.
 for(let bay=0;bay<5;bay++){
  const xx=-3.24+bay*1.62;
  box(xx,5.05,front-1.18,1.48,5.86,.18,'dark');
  lattice(xx,5.15,front-1.05,1.20,4.90);
  for(const yy of[2.48,7.82])box(xx,yy,front-.93,1.53,.18,.20,'red');
  for(const sx of[-1,1])box(xx+sx*.70,5.15,front-.92,.16,5.40,.25,'red');
  for(let k=0;k<5;k++)box(xx-.51+k*.255,3.70,front-.88,.036,2.18,.04,'wood');
  box(xx,7.40,front+.02,1.44,.37,.17,'wood');
  group(xx,7.40,front+.12,0,()=>{for(const p of relief.variants[bay%4])emit(p.geometry,p.material,0,0,0,1.63,1.25,1);});
 }
 for(const x of postAxes)box(x,8.88,front-.13,.22,.20,2.30,'wood');
 for(let i=0;i<12;i++){const x=-3.60+i*.655;box(x,10.28,front+.10,.15,.50,.23,'red');}
 for(const yy of[7.93,8.39,8.92])box(0,yy,front+.15,7.88,.22,.35,'red');
 for(let i=0;i<24;i++)box(-3.75+i*.326,8.83,front-.30,.14,.085,2.17,'wood');
 box(0,9.32,front-.32,7.8,.50,.14,'wall');
 for(let i=0;i<12;i++)group(-3.60+i*.655,9.36,front+.10,0,()=>brackets(0,0,0,.47));
 for(const x of[-2.51,.82,2.51])lantern(x,7.08,front-.17,.40);
 for(const side of[-1,1]){
  box(side*3.85,5.12,-.3,.20,6.02,6.02,'wall');
  for(const zz of[-2.45,-.90,.65,2.20])group(side*3.98,0,zz,side*Math.PI/2,()=>lattice(0,5.05,0,1.23,4.68));
 }
},rightHallFrame171.scale);
role='layered-walkways';
group(2.0,3.5,-21,0,()=>hall(10.0,5.8,3.9),.93);
// The right court has a second low wing; its eave overlaps the tall veranda
// across a real return, rather than ending in a sheer open frame.
group(8.5,3.15,-20.0,-.12,()=>hall(8.3,5.9,4.65,{raised:.8,roofRise:2.15,roofCurl:.62,lanterns:true}),.82);
// A closed masonry platform carries the rear hall above the planted valley.
// The stream terminates at its retaining wall, rather than at low door panels.
group(2.0,0,-21,0,()=>{
 // Actual arched water inlet through the rear hall's deep stone base.
 // The former stream ended at -15m and left a high exposed earth plug.
 const cx=2.80,r=.75,spring=.85,left=cx-r,right=cx+r;
 box((-4.55+left)/2,2,0,left+4.55,4,5.10,'hallFoundation');box((right+4.55)/2,2,0,4.55-right,4,5.10,'hallFoundation');
 const arch=new T.Shape();arch.moveTo(left,4);arch.lineTo(left,spring);for(let i=0;i<=32;i++){const a=Math.PI-i*Math.PI/32;arch.lineTo(cx+Math.cos(a)*r,spring+Math.sin(a)*r);}arch.lineTo(right,4);arch.closePath();const g=new T.ExtrudeGeometry(arch,{depth:5.10,steps:1,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:1,curveSegments:1});g.translate(0,0,-2.55);emit(g,'hallFoundation');
 for(let row=0;row<12;row++)for(let col=0;col<9;col++){
  const x=-4.0+col+(row%2?.18:-.12),y=.18+row*.327;
  if(Math.abs(x-cx)<r+.56&&y<1.98)continue;
  box(x,y,2.58,.94,.30,.22,'rock');
 }
 for(let i=0;i<11;i++){const a=i*Math.PI/11+.014,b=(i+1)*Math.PI/11-.014,q=new T.Shape();q.moveTo(cx+Math.cos(a)*r,spring+Math.sin(a)*r);for(let j=1;j<=4;j++){const t=a+(b-a)*j/4;q.lineTo(cx+Math.cos(t)*r,spring+Math.sin(t)*r);}for(let j=4;j>=0;j--){const t=a+(b-a)*j/4;q.lineTo(cx+Math.cos(t)*(r+.22),spring+Math.sin(t)*(r+.22));}q.closePath();const wedge=new T.ExtrudeGeometry(q,{depth:.28,steps:1,bevelEnabled:true,bevelSize:.007,bevelThickness:.007,bevelSegments:1,curveSegments:1});wedge.translate(0,0,2.48);emit(wedge,'stone');}
 for(const side of[-1,1])for(let j=0;j<3;j++)box(cx+side*(r+.115),.145+j*.28,2.61,.22,.267,.32,'stone');
});
role='main-hall-sanctum';material('statueGold','#b68135',.29,.72);{const statue=new T.SphereGeometry(1,32,24);geometries.add(statue);group(rightHallFrame171.x,rightHallFrame171.y,rightHallFrame171.z,rightHallFrame171.yaw,()=>group(0,(rightHallFrame171.floorWorldY-.625*.70-rightHallFrame171.y)/rightHallFrame171.scale,.70,0,()=>{for(let i=0;i<4;i++){const w=3.35-i*.34,y=.71+i*.18;box(0,y,0,w,.17,1.02-i*.10,'dark');box(0,y+.094,.015,w+.08,.035,1.05-i*.10,'oldgold');for(const x of[-w*.42,-w*.21,0,w*.21,w*.42])rosette(x,y+.12,.54,.055);}box(0,1.58,.02,1.30,.28,.72,'oldgold');emit(statue,'statueGold',0,1.77,.02,.52,.19,.39);emit(statue,'statueGold',0,2.19,-.035,.35,.47,.27);emit(statue,'statueGold',0,2.69,.04,.17,.20,.18);emit(statue,'statueGold',0,2.92,.03,.065,.09,.07);for(const side of[-1,1]){emit(statue,'statueGold',side*.39,2.15,.02,.18,.42,.18,[0,0,side*.18]);emit(statue,'statueGold',side*.55,1.92,.16,.13,.29,.13,[0,0,side*.30]);emit(statue,'statueGold',side*.11,2.64,.04,.045,.14,.045,[0,0,side*.2]);}emit(torusG,'gold',0,2.54,-.28,.52,.52,.055,[0,0,0]);emit(torusG,'oldgold',0,2.54,-.30,.38,.38,.04,[0,0,0]);for(let i=0;i<12;i++){const a=i*Math.PI/6;emit(ballG,'gold',Math.cos(a)*.46,2.54+Math.sin(a)*.46,-.25,.035,.045,.035);}},.70/rightHallFrame171.scale),rightHallFrame171.scale);}
// Source anchors: compact white/red storeys, closely carved cornices,
// a true four-slope blue-tiled crown and narrow many-ring sorin.
role='five-tier-pagoda';group(4.80,2.764,-24,-.40,()=>{
 box(0,.35,0,5.8,.7,5.8,'stone');
 for(let level=0;level<5;level++){
  const floor=.75+level*2.55,h=2.20,w=7.3-level*.29,body=w*.60,hh=body/2;
  box(0,floor+h*.5,0,body-.18,h-.12,body-.18,'dark');
  for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5])group(0,0,0,angle,()=>{
   // Three closed bays: the narrow central shutter sits between the posts;
   // white side infill and small lower grilles remain continuous walls.
   for(const x of[-hh,-body*.22,body*.22,hh]){
    column(x,hh+.055,floor,h-.32,.145);
    brackets(x,floor+h-.68,hh+.12,.66);
   }
   lattice(0,floor+h*.53,hh+.025,body*.38,h*.45);box(0,floor+h*.78,hh-.015,body-.10,h*.14,.18,'wall');
   for(const sign of[-1,1]){
    const x=sign*body*.36;
    box(x,floor+h*.52,hh+.035,body*.20,h*.39,.09,'wall');
    for(let i=0;i<7;i++)box(x-body*.085+i*body*.17/6,floor+h*.405,hh+.10,.018,h*.11,.026,'wood');
    box(x,floor+h*.40,hh+.115,body*.205,.035,.035,'red');
   }
   for(const yy of[floor+.18,floor+.82,floor+h-.63])box(0,yy,hh+.16,body+.22,.13,.22,'red');
   // Deep load-bearing cornice: crossed curved brackets, continuous girders
   // and nested bearing blocks occupy the wall-to-eave transition.
   box(0,floor+h-.31,hh+.20,body+.64,.25,.52,'red');
   box(0,floor+h-.59,hh+.24,body+.48,.16,.45,'wood');
   for(let i=0;i<9;i++){
    const x=-body*.48+i*body*.96/8;
    brackets(x,floor+h-.65,hh+.36,.59);
    box(x,floor+h-.23,hh+.63,.10,.08,.11,'gold');
    for(const dx of[-.09,.09])box(x+dx,floor+h-.51,hh+.55,.07,.13,.10,'oldgold');
   }
   // Raised balcony has a solid decorated sill under the close-spaced rails.
   box(0,floor+.06,hh+.30,body+.80,.17,.94,'red');
   box(0,floor+.26,hh+.69,body+.47,.18,.10,'red');
   for(const yy of[floor+.23,floor+.73])box(0,yy,hh+.69,body+.49,.095,.12,'redlight');
   for(let i=0;i<19;i++)box(-body*.54+i*body*1.08/18,floor+.49,hh+.69,.05,.45,.07,'red');
  });
  // A compact four-slope hip exposes the illuminated right return. The crown
  // rise offsets the higher cornice so its surveyed apex stays at (789,199).
  for(const side of[-1,1])for(let j=0;j<7;j++){const x=-body*.48+j*body*.96/6;box(x,floor+h+.12,side*(hh+.44),.16,.37,.21,'red');brackets(x,floor+h-.10,side*(hh+.44),.42);}
  roof(w*.96,w*.88,floor+h+.59,level===4?2.27:.96,.44,.028,.24);
 }
 const y=14.59;emit(new T.CylinderGeometry(.025,.29,4.25,16),'oldgold',0,y+2.10,0);
 for(let i=0;i<23;i++){
  const r=.34-i*.0116;emit(torusG,'gold',0,y+.16+i*.165,0,r,r*.72,r,[Math.PI/2,0,0]);
 }
 emit(new T.CylinderGeometry(.012,.038,.82,16),'oldgold',0,19.16,0);emit(ballG,'gold',0,19.60,0,.07,.105,.07);
},[1.10,1.20,1.10]);
// Porch is genuinely close to the lens. Its painted members frame distant rooms.
role='foreground-veranda';
material('foregroundSoffit','#9b4b23',.92,0);
// A pitched timber ceiling is visible across the upper frame. Its joists
// meet the front head beam and both close gate posts in actual 3D space.
for(let j=0;j<10;j++){
 const t=j/9,z=9.05-2.65*t,y=4.92+1.36*t;
 emit(boxG,'foregroundSoffit',0,y+.16,z,7.2,.11,.36,[.474,0,0]);
}
for(let i=0;i<25;i++){
 const x=-3.35+i*.29;
 between([x,4.92,9.05],[x,6.28,6.40],.17,'foregroundSoffit',false,.23);
 box(x,5.08,8.50,.13,.10,.035,'oldgold');
}
box(0,5.50,8.20,7.1,.34,.38,'foregroundSoffit');
for(const x of[-2.30,2.25]){
 box(x,2.60,7.9,x<0?.61:.32,5.8,x<0?.64:.42,'red');
 for(const y of[.2,1.9,x<0?5.7:4.40])plaque(x,y,8.24,x<0?.47:.32,y===1.9?(x<0?1.35:1.05):.85);
 for(const part of createGateColumnShoe(x<0?.61:.32,x<0?.64:.42,.24))emit(part.geometry,part.material,x,.27,7.9);
 const facing=x<0?1:-1,innerHardware=x<0?[[3.30,.42,.58]]:[[4.10,.32,.68],[2.58,.32,.78]];
 for(const [py,pw,ph]of innerHardware){
  const parts=createGatePlaque(pw,ph);
  for(const part of parts)emit(part.geometry,part.material,x+facing*(x<0?.317:.175),py,7.9,1,1,1,[0,facing*Math.PI/2,0]);
 }
}
lantern(-1.95,5.52,6.8,.40);
const railBalusterG=new T.LatheGeometry([[.09,0],[.09,.09],[.065,.17],[.05,.30],[.05,.57],[.075,.67],[.10,.76],[.10,.84]].map(p=>new T.Vector2(...p)),8);function railing(a,b,y,near=false){const lift=0;const length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(length/(near?1.45:.9));for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,yy=typeof y==='function'?y(t):y;if(near&&i!==n)emit(railBalusterG,'red',x,yy+.12,z,.76,.82+lift,.76,[0,Math.PI/8,0]);else box(x,yy+(near?.41+lift/2:.425),z,near?.11:.13,near?.82+lift:.85,near?.11:.14,'red');if(near?i===n:i%3===0){const ph=near?.82+lift:.94;box(x,yy+ph/2,z,.14,ph,.14,'red');emit(ballG,'gold',x,yy+ph+.04,z,.065,.065,.065);emit(cylG,'gold',x,yy+ph-.02,z,.075,.08,.075);}if(i<n){const tt=(i+1)/n,ny=typeof y==='function'?y(tt):y;for(const dy of(near?[.12,.57+lift,.76+lift]:[.13,.58,.77]))between([x,yy+dy,z],[a[0]+(b[0]-a[0])*tt,ny+dy,a[1]+(b[1]-a[1])*tt],near?.082:.095,'redlight',false,near?.105:.12);}}}
railing([-2.20,5.70],[2.30,8.07],t=>.54-.27*t,'front');railing([-2.30,7.55],[-1.05,6.72],t=>1.18-.12*t,true);
{
 const x=-1.05,z=6.72,base=.62;
 box(x,base+.58,z,.18,1.16,.18,'red');
 const finial=new T.LatheGeometry([[.11,0],[.13,.06],[.12,.15],[.20,.19],[.21,.27],[.18,.33],[.09,.38],[.055,.43],[0,.48]].map(p=>new T.Vector2(...p)),28);
 emit(finial,'gold',x,base+1.16,z,.83,.83,.83);
 rosette(x,base+.24,z+.103,.070);
}
// The crossing follows the stream in depth: its near landing sits left and its far landing recedes toward the right-hand buildings.
role='arched-stream-bridge';
const bridgeStart=[.40,-5.6],bridgeEnd=[9.40,-13.30],bridgeDX=bridgeEnd[0]-bridgeStart[0],bridgeDZ=bridgeEnd[1]-bridgeStart[1],bridgeRun=Math.hypot(bridgeDX,bridgeDZ),bridgeNX=-bridgeDZ/bridgeRun,bridgeNZ=bridgeDX/bridgeRun,bridgeYaw=Math.atan2(bridgeNX,bridgeNZ),bridgeArch=t=>2.60+.85*t+.45*Math.sin(t*Math.PI),bridgePoint=(t,side=0)=>[bridgeStart[0]+bridgeDX*t+bridgeNX*side,bridgeArch(t),bridgeStart[1]+bridgeDZ*t+bridgeNZ*side];
for(let i=0;i<46;i++){const t=(i+.5)/46,p=bridgePoint(t);box(p[0],p[1]-.09,p[2],.225,.16,1.50,'wood',bridgeYaw);}
for(const side of[-.58,0,.58])line(Array.from({length:41},(_,i)=>{const p=bridgePoint(i/40,side);p[1]-=.21;return p;}),side===0?.15:.095,'wood');
for(let i=2;i<44;i+=4){const p=bridgePoint(i/45);between([p[0]-bridgeNX*.50,p[1]-.18,p[2]-bridgeNZ*.50],[p[0]+bridgeNX*.50,p[1]-.18,p[2]+bridgeNZ*.50],.043,'redlight');}
const bridgeFinial=new T.LatheGeometry([[.065,0],[.085,.035],[.075,.08],[.12,.12],[.13,.18],[.10,.22],[.045,.26],[0,.30]].map(p=>new T.Vector2(...p)),24);
function bridgeRail(side){
 const top=[],low=[];
 for(let i=0;i<=20;i++){
  const t=i/20,p=bridgePoint(t,side*.72);top.push([p[0],p[1]+.88,p[2]]);low.push([p[0],p[1]+.29,p[2]]);
  if(i%2===0){
   const main=i%4===0,h=main?1.02:.75;
   box(p[0],p[1]+h/2,p[2],main?.18:.09,h,main?.18:.115,'red');
   if(main){
    emit(bridgeFinial,'gold',p[0],p[1]+h,p[2]);
    for(const dy of[.12,.82])emit(cylG,'oldgold',p[0],p[1]+dy,p[2],.096,.045,.096);
    rosette(p[0],p[1]+.34,p[2]+side*bridgeNZ*.10,.070);
   }
  }
 }
 line(top,.082,'redlight');line(low,.052,'red');
}
bridgeRail(-1);bridgeRail(1);
for(let j=0;j<3;j++){const t=-(j+1)*.30/bridgeRun,p=bridgePoint(0),top=p[1]-(j+1)*.15;box(p[0]+bridgeDX*t,top-.10,p[2]+bridgeDZ*t,.36,.20,1.55,'stone',bridgeYaw);}

role='gallery-stone-stair';{const a=[9.4,3.45,-13.3],b=[8.7,4.30,-16.7],dx=b[0]-a[0],dz=b[2]-a[2],run=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz),steps=12,width=2.35,profile=new T.Shape();profile.moveTo(0,0);profile.lineTo(0,(b[1]-a[1])/steps);for(let i=0;i<steps;i++){profile.lineTo((i+1)*run/steps,(i+1)*(b[1]-a[1])/steps);if(i<steps-1)profile.lineTo((i+1)*run/steps,(i+2)*(b[1]-a[1])/steps);}profile.lineTo(run,b[1]-a[1]);profile.lineTo(run,0);profile.closePath();const flight=new T.ExtrudeGeometry(profile,{depth:width,steps:1,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:1});flight.translate(0,0,-width/2);group(a[0],a[1],a[2],Math.atan2(-dz,dx),()=>emit(flight,'stone'));for(let i=0;i<steps;i++){const t=(i+.5)/steps,top=a[1]+(b[1]-a[1])*(i+1)/steps,x=a[0]+dx*t,z=a[2]+dz*t;box(x,top-.015,z,2.47,.065,run/steps+.085,'stone',yaw);}for(const side of[-1,1]){const off=side*1.58,p0=[a[0]+Math.cos(yaw)*off,a[1],a[2]-Math.sin(yaw)*off],p1=[b[0]+Math.cos(yaw)*off,b[1],b[2]-Math.sin(yaw)*off];between([p0[0],p0[1]+.08,p0[2]],[p1[0],p1[1]+.08,p1[2]],.105,'stone',false,.17);const upper0=[p0[0],p0[1]+.92,p0[2]],upper1=[p1[0],p1[1]+.92,p1[2]];between(upper0,upper1,.082,'redlight',false,.12);for(let i=0;i<=8;i++){const t=i/8,x=p0[0]+(p1[0]-p0[0])*t,y=p0[1]+.1+(p1[1]-p0[1])*.0+(p1[1]-p0[1])*0,z=p0[2]+(p1[2]-p0[2])*t,yy=a[1]+(b[1]-a[1])*t;box(x,yy+.49,z,.105,.90,.12,'red');}}}
// The central descending stair seen between the layered galleries and the
// near bridge is a solid granite flight with discrete treads and risers.
role='gallery-stone-stair';{
 const a=[.40,2.60,-5.60],b=[1.20,3.75,-8.70],dx=b[0]-a[0],dz=b[2]-a[2],run=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz),count=8;
 for(let j=0;j<count;j++){
  const t=(j+.5)/count,top=a[1]+(b[1]-a[1])*(j+1)/count,x=a[0]+dx*t,z=a[2]+dz*t;
  box(x,(2.18+top)/2,z,1.25,top-2.18,run/count+.015,'hallFoundation',yaw);
  box(x,top-.035,z,1.31,.10,run/count+.050,'stone',yaw);
  for(const sign of[-1,1]){
   const xx=x+Math.cos(yaw)*sign*.74,zz=z-Math.sin(yaw)*sign*.74;
   box(xx,(2.18+top)/2,zz,.18,top-2.18,run/count+.020,'stone',yaw);
  }
 }
}
// A narrow, winding stream cuts a planted shallow valley rather than a full-frame water sheet.
role='garden-ground';
const ground=z=>.50+Math.max(0,Math.min(3.50,(6-z)*.14));
const riverProfile=[[-25,4.95],[-22,4.90],[-19,4.85],[-17,4.75],[-15,4.7],[-13,4.5],[-11,4.3],[-9,4.0],[-7,3.6],[-5,3.1],[-3,2.65],[-1,2.0],[0,1.75],[2,1.35],[4,1.05],[6,.85],[7.5,.75]];
function riverXAt(z){if(z<=riverProfile[0][0])return riverProfile[0][1];if(z>=riverProfile.at(-1)[0])return riverProfile.at(-1)[1];for(let i=0;i<riverProfile.length-1;i++){const [za,xa]=riverProfile[i],[zb,xb]=riverProfile[i+1];if(z>=za&&z<=zb)return T.MathUtils.lerp(xa,xb,(z-za)/(zb-za));}return 0;}
const landHeight=(x,z)=>ground(z)-.08+.035*Math.sin(x*.43+z*.27)*Math.sin(z*.31-x*.22);
const ground213=createGardenGround213(grandFrame),terrainHeight=ground213.sample;
const earth=new T.MeshStandardMaterial({name:'scene08-organic-earth-no-grid',color:'#535a49',roughness:1,metalness:0});earth.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vEarthLocal;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvEarthLocal=transformed;');shader.fragmentShader='varying vec3 vEarthLocal;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat earthMottle=sin(vEarthLocal.x*.63+sin(vEarthLocal.z*.29)*1.8)*sin(vEarthLocal.z*.47-vEarthLocal.x*.17);float earthPatch=sin(vEarthLocal.x*.19+vEarthLocal.z*.11)*sin(vEarthLocal.z*.16-vEarthLocal.x*.08);float earthSoft=sin(vEarthLocal.x*.075+sin(vEarthLocal.z*.095)*2.1)*sin(vEarthLocal.z*.064-vEarthLocal.x*.052);diffuseColor.rgb*=.80+.10*earthMottle+.12*earthPatch+.08*earthSoft;`);};materials.push(earth);
const nx=384,nz=384,pp=[],uv=[],ix=[];
for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-28+i*56/nx,z=-42+j*60/nz,y=terrainHeight(x,z);pp.push(x,y,z);uv.push(x*.08,z*.08);}
for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ix.push(a,c,b,b,c,d);}
const terrain=new T.BufferGeometry();terrain.setAttribute('position',new T.Float32BufferAttribute(pp,3));terrain.setAttribute('uv',new T.Float32BufferAttribute(uv,2));terrain.setIndex(ix);terrain.computeVertexNormals();emit(terrain,earth);geometries.add(terrain);
const waterYAt=z=>.52;const waterPath=riverProfile.map(([z,x])=>new T.Vector3(x,waterYAt(z),z)),waterCurve=new T.CatmullRomCurve3(waterPath,false,'centripetal');
const waterFlatP=[],waterUv=[],waterIx=[],waterN=100,waterM=18;for(let j=0;j<=waterN;j++){const t=j/waterN,center=waterCurve.getPoint(t),tangent=waterCurve.getTangent(t).normalize(),across=new T.Vector3(-tangent.z,0,tangent.x).normalize(),width=(.56+.32*T.MathUtils.smoothstep(t,.18,.78)+.26*T.MathUtils.smoothstep(t,.82,1))*T.MathUtils.smoothstep(t,0,.09);for(let i=0;i<=waterM;i++){const u=i/waterM*2-1,edge=.035*Math.sin(t*79+u*4),p=center.clone().addScaledVector(across,u*width+edge);waterFlatP.push(p.x,-p.z,0);waterUv.push(t*8,i/waterM*2);}}
for(let j=0;j<waterN;j++)for(let i=0;i<waterM;i++){const a=j*(waterM+1)+i,b=a+1,c=a+waterM+1,d=c+1;waterIx.push(a,b,c,b,d,c);}
const waterG=new T.BufferGeometry();waterG.setAttribute('position',new T.Float32BufferAttribute(waterFlatP,3));waterG.setAttribute('uv',new T.Float32BufferAttribute(waterUv,2));waterG.setIndex(waterIx);waterG.computeVertexNormals();
const waterReflectShader={...Reflector.ReflectorShader,uniforms:T.UniformsUtils.clone(Reflector.ReflectorShader.uniforms),vertexShader:Reflector.ReflectorShader.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec2 vWaterUV;').replace('vUv = textureMatrix * vec4( position, 1.0 );','vWaterUV=uv; vUv = textureMatrix * vec4( position, 1.0 );'),fragmentShader:Reflector.ReflectorShader.fragmentShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec2 vWaterUV;').replace('vec4 base = texture2DProj( tDiffuse, vUv );','vec4 uvw=vUv;uvw.xy+=vec2(sin(vWaterUV.x*47.+vWaterUV.y*19.),sin(vWaterUV.y*61.-vWaterUV.x*13.))*.00036*vUv.w;vec4 base=texture2DProj(tDiffuse,uvw);').replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );','gl_FragColor = vec4( mix( color, base.rgb, .52 ), 1.0 );')};const stream=new Reflector(waterG,{color:'#283d2e',textureWidth:1024,textureHeight:1024,clipBias:.003,shader:waterReflectShader,multisample:2});stream.rotation.x=-Math.PI/2;stream.position.y=.52;stream.name='scene08-reflective-meander';stream.receiveShadow=true;scene.add(stream);geometries.add(waterG);
const physicalWaterM=new T.MeshPhysicalMaterial({name:'scene08-physical-stream-water148',color:'#344a39',roughness:.055,metalness:0,ior:1.333,transmission:.10,clearcoat:.30,clearcoatRoughness:.06});materials.push(physicalWaterM);const physicalWater=new T.Mesh(waterG,physicalWaterM);physicalWater.rotation.x=-Math.PI/2;physicalWater.position.y=.515;physicalWater.name='scene08-physical-stream-backing148';physicalWater.receiveShadow=true;scene.add(physicalWater);
// A native detail keeps the main camera subfrustum, while the independent
// reflected scene is captured with its complete physical projection.
const renderReflection=stream.onBeforeRender;
stream.onBeforeRender=function(renderer,world,camera,...args){
 if(!camera.view?.enabled)return renderReflection.call(this,renderer,world,camera,...args);
 const projection=camera.projectionMatrix.clone(),inverse=camera.projectionMatrixInverse.clone(),complete=camera.clone();complete.clearViewOffset();camera.projectionMatrix.copy(complete.projectionMatrix);camera.projectionMatrixInverse.copy(complete.projectionMatrixInverse);
 try{return renderReflection.call(this,renderer,world,camera,...args);}finally{camera.projectionMatrix.copy(projection);camera.projectionMatrixInverse.copy(inverse);}
};
material('waterglint','#b9ab84',.24,.01);mats.waterglint.emissive=new T.Color('#292314');mats.waterglint.emissiveIntensity=.12;role='stream-surface-glints';for(let i=0;i<7;i++){const z=-10+i*2.3,x=riverXAt(z)+Math.sin(i*2.3)*.13,y=waterYAt(z)+.035,length=.18+.08*Math.sin(i*1.7),tangent=new T.Vector3(.045,0,.999).normalize();line([[x-tangent.x*length,y,z-tangent.z*length],[x,y+.006,z],[x+tangent.x*length,y,z+tangent.z*length]],.014,'waterglint');}
const rocks=Array.from({length:9},(_,i)=>createWeatheredBoulderGeometry(T,{scale:[1,1,1],seed:803+i,sectors:32,rings:18})),moss=rocks.map(g=>createBoulderMossGeometry(T,g));
function rock(x,y,z,sx,sy,sz,i){y+=ground(z);emit(rocks[i%9],'rock',x,y,z,sx,sy,sz,[0,i*.71,0]);emit(moss[i%9],'moss',x,y,z,sx,sy,sz,[0,i*.71,0]);}
// Stone pier cores continue below the modeled channel bed and meet the open wing's outer timber posts.
role='lower-gallery-stone-bearing';group(lowerGalleryFrame.x,0,lowerGalleryFrame.z,lowerGalleryFrame.yaw,()=>{
 const f=lowerGalleryFrame;
 for(let j=0;j<6;j++)for(const z of[-.92,.92]){
  const x=-f.run*.46+j*f.run*.92/5,top=3.75-.50*x/f.run,wx=f.x+Math.cos(f.yaw)*x+Math.sin(f.yaw)*z,wz=f.z-Math.sin(f.yaw)*x+Math.cos(f.yaw)*z,bottom=terrainHeight(wx,wz)-.10;
  if(top>bottom+.06){const rows=Math.max(1,Math.ceil((top-bottom)/.23)),course=(top-bottom)/rows;for(let k=0;k<rows;k++)box(x,bottom+(k+.5)*course,z,.37,course-.009,.40,'stone');box(x,top-.11,z,.57,.20,.62,'stone');}
 }
});

function riverRock(x,z,sx,sy,sz,i){if(role==='stream-bank-granite'&&z>-8){const f=1-.60*T.MathUtils.smoothstep(z,-8,6);sx*=f;sz*=f;sy*=.50+.50*f;}if(role==='left-garden-stone-island'||(role==='stream-bank-granite'&&z> -8&&i%3===0)){scannedStones.place({emit,x,z,height:terrainHeight(x,z),width:2*Math.max(sx,sz),heightLimit:sy*1.5,index:i});return;}const y=terrainHeight(x,z)+sy*.70,rot=i*.71;emit(rocks[i%9],'rock',x,y,z,sx,sy,sz,[0,rot,0]);emit(moss[i%9],'moss',x,y,z,sx,sy,sz,[0,rot,0]);}
role='weathered-garden-rocks';rock(-.65,.05,-2.8,.52,1.40,.55,27);for(let i=0;i<78;i++){const z=rr(-21,6),side=i%2?-1:1,x=riverXAt(z)+side*rr(4.1,7.1);rock(x,rr(-.16,.25),z,rr(.32,.98),rr(.38,1.05),rr(.32,.98),i);}
role='stream-bank-granite';for(let i=134;i>0;i--){const z=-19.6+i*.20,side=i%2?-1:1,x=riverXAt(z)+side*rr(1.25,1.80),sx=rr(.34,.72),sy=rr(.28,.62),sz=rr(.34,.72);if(z<-8||i%3===0)riverRock(x,z,sx,sy,sz,i+18);if(i%2===0){const xx=x+side*rr(.40,.68),zz=z+rr(-.13,.13),ssz=rr(.30,.58);if(z<-8||i%6===0&&z<2)riverRock(xx,zz,sx*.70,sy*.76,ssz,i+43);}}
role='left-garden-stone-island';for(const [x,z,sx,sy,sz,i]of[[-7.8,-3.6,1.00,.70,1.05,11],[-6.5,-2.2,1.18,.82,1.02,12],[-5.0,-1.5,.82,.56,.76,13],[-4.2,-.1,1.26,.82,1.10,14],[-2.8,.8,1.02,.70,.84,15],[-6.0,1.2,.88,.58,.92,16],[-8.2,.4,1.16,.76,1.04,17],[-3.8,2.2,.84,.58,.78,18],[-6.6,-4.6,1.02,.70,.96,19]])riverRock(x,z,sx,sy,sz,i);for(const [x,z,sx,sy,sz,i]of[[-.30,2.8,.58,.34,.62,51],[4.8,2.8,1.05,.68,1.08,52],[-1.65,3.6,.66,.42,.70,53],[2.75,5.0,.66,.36,.70,54],[5.0,4.8,.96,.62,.90,55],[-3.2,5.6,1.16,.72,1.25,56]])riverRock(x,z,sx,sy,sz,i);for(const [x,z,sx,sy,sz,i]of[[-5.0,-4.0,1.05,.72,1.12,31],[-3.8,-3.2,1.10,.76,1.02,32],[-2.8,-2.2,.90,.55,.82,33],[-1.6,-1.1,1.00,.66,.92,34],[-5.2,-.7,1.24,.74,1.32,35],[-3.8,.4,1.02,.62,.92,36],[-2.4,1.4,.86,.52,.82,37],[-4.5,2.4,1.12,.72,1.04,38],[-1.4,2.8,.92,.55,.80,39],[-6.5,3.2,1.16,.70,1.12,40],[-2.8,4.0,.94,.62,.86,41],[-.85,3.0,.58,.34,.62,42]])riverRock(x,z,sx,sy,sz,i);rock(-5.8,.20,.2,.9,1.2,.8,5);rock(-6.0,.1,-2.2,.8,1.0,.7,6);rock(-6.8,.05,-.5,.8,1.2,.8,4);rock(5.5,.0,3.5,1.15,.95,1.0,7);rock(-7.2,.2,.6,1.0,1.0,1.1,8);for(let i=0;i<10;i++){const z=-5+i*1.0,side=i%2?1:-1;rock(.3+side*rr(4.4,5.0),.45,z,rr(.55,.88),rr(.58,.92),rr(.48,.78),i+5);}for(const p of[[-5.35,.06,-4.8,1.18,.72,1.05,2],[-5.9,.02,-3.0,.92,.62,.83,5],[-5.35,.08,-1.1,1.12,.72,.86,1],[-5.8,.04,1.1,.85,.52,.74,4],[5.2,.04,-5.3,.9,.62,.86,3],[5.7,.06,-3.5,1.12,.74,.98,6],[5.55,.03,-1.2,.82,.52,.77,0],[5.9,.04,1.0,1.08,.7,.88,7]])rock(...p);
// Weathered, carved granite: a curved four-hip kasa with a double curled rim,
// a pierced lamp chamber, molded lotus collars and an uneven stone shaft.
material('carvedstone','#a7a18f',.96);mats.carvedstone.map=carvedGranite[0];mats.carvedstone.bumpMap=null;mats.carvedstone.normalMap=carvedGranite[1];mats.carvedstone.normalScale=new T.Vector2(.38,.38);mats.carvedstone.roughnessMap=carvedGranite[2];mats.carvedstone.color.set('#ffffff');
mats.carvedstone.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 vCarvedStone;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCarvedStone=position;');
 shader.fragmentShader='varying vec3 vCarvedStone;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float grain=fract(sin(dot(vCarvedStone,vec3(127.1,311.7,73.3)))*43758.5453);
 float weather=sin(vCarvedStone.x*13.+sin(vCarvedStone.z*9.)*2.)*sin(vCarvedStone.y*19.+vCarvedStone.z*7.);
 diffuseColor.rgb*=.81+.22*grain+.10*weather;`);
};
function agedStone(g,amount=.012){const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),q=amount*(Math.sin(x*39.1+y*31.7+z*17.3)*.38+Math.sin(x*17.3-y*23.1+z*43.7)*.34+Math.sin(x*71.7+y*89.1-z*57.3)*.28);p.setXYZ(i,x+n.getX(i)*q,y+n.getY(i)*q,z+n.getZ(i)*q);}g.computeVertexNormals();return g;}
function legacyStoneLantern197(x,z,y,scale){group(x,y,z,.08,()=>{
 const shaftProfile=[[.48,0],[.51,.09],[.48,.19],[.36,.28],[.25,.36],[.23,.61],[.20,1.07],[.29,1.14],[.40,1.21],[.44,1.31],[.38,1.41]],shaftPoints=[];for(let j=0;j<shaftProfile.length-1;j++)for(let k=0;k<6;k++){const t=k/6;shaftPoints.push(new T.Vector2(shaftProfile[j][0]*(1-t)+shaftProfile[j+1][0]*t,shaftProfile[j][1]*(1-t)+shaftProfile[j+1][1]*t));}shaftPoints.push(new T.Vector2(...shaftProfile.at(-1)));const shaft=new T.LatheGeometry(shaftPoints,48);emit(agedStone(shaft,.036),'carvedstone');
 for(let j=0;j<5;j++)emit(torusG,'carvedstone',0,.33+j*.18,0,.245+(j%2)*.014,.245,.245+(j%2)*.014,[Math.PI/2,0,0]);
 emit(new T.CylinderGeometry(.43,.36,.20,8),'carvedstone',0,1.42,0,1,1,1,[0,Math.PI/8,0]);
 emit(agedStone(new T.BoxGeometry(.78,.82,.78,12,12,12),.014),'carvedstone',0,1.98,0);
 for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5])group(0,0,0,angle,()=>{
  box(0,1.98,.398,.53,.57,.025,'lanternamber');
  for(const xx of[-.34,.34]){
   box(xx,1.97,.425,.10,.84,.11,'carvedstone');
   for(const dx of[-.023,.023])box(xx+dx,1.97,.487,.012,.70,.013,'stone');
  }
  for(const xx of[-.19,-.095,0,.095,.19])box(xx,1.98,.424,.018,.57,.028,'dark');
  for(const yy of[1.80,1.98,2.17])box(0,yy,.433,.53,.017,.026,'dark');
  for(const yy of[1.53,1.61,2.36])box(0,yy,.418,.91,.075,.15,'carvedstone');
  for(let j=0;j<7;j++){
   const xx=-.35+j*.116;emit(ballG,'carvedstone',xx,1.65,.454,.043,.055,.035);
   line([[xx-.046,2.30,.455],[xx,2.25,.477],[xx+.046,2.30,.455]],.013,'stone');
  }
 });
 const capM=mats.carvedstone.clone();capM.onBeforeCompile=mats.carvedstone.onBeforeCompile;capM.vertexColors=true;materials.push(capM);
 const W=.70,D=.66,N=40,pp=[],colors=[],indices=[];
 const H=(xx,zz)=>{const u=xx/W,vv=zz/D,t=Math.max(Math.abs(u),Math.abs(vv)),corner=Math.pow(Math.min(Math.abs(u),Math.abs(vv)),7);return 2.48+.57*Math.pow(Math.max(0,1-t),1.6)+.17*Math.pow(t,8)*(.13+.87*corner);};
 for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
  const xx=-W+2*W*i/N,zz=-D+2*D*j/N,yy=H(xx,zz)+.018*Math.sin(xx*47+zz*31)+.007*Math.sin(xx*91-zz*77);pp.push(xx,yy,zz);
  const q=Math.sin(xx*13+Math.sin(zz*9)*1.7)*Math.cos(zz*17-xx*7),c=new T.Color(q>.26?'#5c633d':q<-.5?'#837b65':'#b1aa94');colors.push(c.r,c.g,c.b);
 }
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;indices.push(a,c,b,b,c,d);}
 const cap=new T.BufferGeometry();cap.setAttribute('position',new T.Float32BufferAttribute(pp,3));cap.setAttribute('color',new T.Float32BufferAttribute(colors,3));cap.setIndex(indices);cap.computeVertexNormals();emit(cap,capM);
 // Continuous solid edge thickness follows the compound curvature, with two
 // swept lips instead of the earlier four flat rectangular cap bars.
 for(const side of[0,1,2,3]){
  const edge=t=>{const u=-1+2*t;return side===0?[W*u,H(W*u,D),D]:side===1?[W,H(W,D*u),D*u]:side===2?[W*u,H(W*u,-D),-D]:[-W,H(-W,D*u),D*u];};
  const wall=[];for(let i=0;i<40;i++){
   const a=edge(i/40),b=edge((i+1)/40),c=a.slice(),d=b.slice();c[1]-=.13;d[1]-=.13;for(const q of[a,c,b,b,c,d])wall.push(...q);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(wall,3));g.computeVertexNormals();mats.carvedstone.side=T.DoubleSide;emit(g,'carvedstone');
  for(const drop of[.015,.12])line(Array.from({length:41},(_,i)=>{const p=edge(i/40);p[1]-=drop;return p;}),drop===.015?.035:.025,'carvedstone');
 }
 emit(agedStone(new T.LatheGeometry([[.16,3.0],[.20,3.07],[.19,3.15],[.12,3.23],[.10,3.28]].map(p=>new T.Vector2(...p)),40),.022),'carvedstone');
 emit(agedStone(new T.SphereGeometry(.185,32,24),.023),'carvedstone',0,3.43,0);emit(agedStone(new T.CylinderGeometry(.035,.13,.12,32),.012),'carvedstone',0,3.61,0);
 for(let k=0;k<17;k++){
  const a=k*2.39996,xx=Math.cos(a)*.57,zz=Math.sin(a)*.53;emit(rocks[k%9],'moss',xx,H(xx,zz)+.02,zz,.055,.025,.07,[0,a,0]);
 }
},scale);}
const toro213=createWeatheredToro213({materials:mats,ownedMaterials:materials,ownedTextures:textures});
function stoneLantern(x,z,y,scale){toro213.build({emit,box,group},x,z,y,scale);}
role='stone-lanterns';stoneLantern(-3.55,.6,1.30,1.32);stoneLantern(1.35,-7,2.2,.85);stoneLantern(5.3,-9.2,.65,.65);
// Each crown is a hierarchy of tapering branches with distributed individual
// folded leaves. The silhouettes retain air, asymmetry and branch direction.
function leaf(x,y,z,size,ma='leaf',yaw=0){if(ma==='pine'){emit(needleG,ma,x,y,z,size*3.0,size*3.0,size*3.0,[rr(-.5,.5),yaw,rr(-.8,.8)],rr(.72,1.25));return;}size*=z>4.5?.70:.78;emit(leafG,ma,x,y,z,size*.78,size,size,[rr(-1.15,1.15),yaw,rr(-1.1,1.1)],rr(.67,1.24));}
const bloomG=new T.BufferGeometry(),bloomP=[];for(let k=0;k<5;k++){const a=k*Math.PI*2/5,ca=Math.cos(a),sa=Math.sin(a),fan=[];for(let j=0;j<=7;j++){const t=j/7*Math.PI*2,xx=.038+.028*Math.cos(t),zz=.020*Math.sin(t);fan.push([ca*xx-sa*zz,.008*Math.sin(t)*Math.sin(t),sa*xx+ca*zz]);}for(let j=0;j<7;j++)bloomP.push(0,-.004,0,...fan[j],...fan[j+1]);}bloomG.setAttribute('position',new T.Float32BufferAttribute(bloomP,3));bloomG.computeVertexNormals();
function leafyTwig(a,b,spread,ma='leaf',count=100){between(a,b,count>3000?.068:spread*.026,'bark',true);
if(count>3000)for(let k=0;k<13;k++){const t=(k+.5)/13,q=a.map((v,c)=>v+(b[c]-v)*t),aa=k*2.39996;between(q,[q[0]+Math.cos(aa)*spread*.48,q[1]+Math.sin(k*.8)*spread*.22,q[2]+Math.sin(aa)*spread*.48],.015,'bark',true);}
for(let j=0;j<count;j++){const cl=j%13,t=count>3000?T.MathUtils.clamp((cl+.5)/13+rr(-.045,.045),0,1):random(),pad=count>3000?spread*(.65+.28*Math.sin(cl*2.13)):spread,r=Math.sqrt(random())*pad,aa=rr(0,Math.PI*2),x=a[0]+(b[0]-a[0])*t+Math.cos(aa)*r,y=a[1]+(b[1]-a[1])*t+rr(-.35,.48)*pad,z=a[2]+(b[2]-a[2])*t+Math.sin(aa)*r;if(ma==='cherry'){if(j%3===0)leaf(x,y,z,rr(.075,.14),'leaf',aa);if(j%2===0)emit(bloomG,'flower',x,y,z,.70,.70,.70,[rr(-1,1),aa,rr(-1,1)],rr(.82,1.20));}else leaf(x,y,z,rr(.075,.17),ma,aa);if(ma==='maple'&&j%9===0)emit(bloomG,'flower',x,y+.03,z,rr(.8,1.5),1,rr(.8,1.5),[rr(-1,1),aa,rr(-1,1)],rr(.85,1.2));}}
function shrub(x,y,z,r,h,ma='leaf',count=1000){
 void count;if(inGrandHallFootprint(x,z)||Math.hypot(x+3.55,z-.60)<.85)return;const channelDistance=Math.abs(x-riverXAt(z));if(z>-5.5&&z<7&&channelDistance<2.35)return;if(z>5.5){r=Math.min(r,1.05);h=Math.min(h,.90);}botany.shrub({emit,between,height:(xx,zz)=>Math.max(terrainHeight(xx,zz),waterYAt(zz)-.15)+y,x,z,r,h,kind:ma});
}

function tree(x,z,h,spread,ma='leaf'){const trunk=[[x,0,z],[x-.15,h*.36,z+.1],[x+.10,h*.71,z-.13],[x-.24,h,z]];for(let i=0;i<3;i++)between(trunk[i],trunk[i+1],.23*(1-i*.22),'bark',true);for(let j=0;j<15;j++){const f=.38+j*.041,a=j*2.39996,rad=spread*(.7+.3*Math.sin(j*3)),start=[x+.08,h*f,z],tip=[x+Math.cos(a)*rad,h*f+rr(.35,1.25),z+Math.sin(a)*rad];between(start,tip,.095*(1-f*.7),'bark',true);for(let k=0;k<5;k++){const b=[tip[0]+rr(-.65,.65),tip[1]+rr(-.1,.6),tip[2]+rr(-.65,.65)];leafyTwig(tip,b,spread*.32,ma,390);}}}
let pine171Stats=null;
function pine(x,z,h,spread){
 const pineSeed171=seed;let old=[x,0,z];for(let i=1;i<=8;i++){const q=[x+Math.sin(i*.69)*.55,h*i/8,z+Math.cos(i*.57)*.33];between(old,q,.31*(1-i/10),'bark',true);old=q;}
 // Horizontal, broken crown pads leave the bent trunk and rising branch forks
 // visible instead of filling the whole crown with a vertical olive curtain.
 for(let j=0;j<13;j++){
  const a=j*2.39996,f=.33+j*.041,r=spread*(1-f*.58),start=[x+Math.sin(f*5)*.45,h*f,z],mid=[x+Math.cos(a)*r*.56,h*f-.20,z+Math.sin(a)*r*.56],end=[x+Math.cos(a)*r,h*f+.40,z+Math.sin(a)*r];between(start,mid,.11,'bark',true);between(mid,end,.065,'bark',true);
  for(let k=0;k<4;k++){
   const aa=a+(k-1.5)*.38,c=[end[0]+Math.cos(aa)*.55,end[1]+rr(.03,.25),end[2]+Math.sin(aa)*.55];between(end,c,.022,'bark',true);
   for(let n=0;n<420;n++){
    const rad=Math.sqrt(random()),az=rr(0,6.283),edge=.75+.18*Math.sin(az*3+j*.71)+.07*Math.sin(az*7+k),px=c[0]+Math.cos(az)*rad*.82*edge,pz=c[2]+Math.sin(az)*rad*.61*edge,py=c[1]+.20*Math.sqrt(1-rad*rad)+rr(-.12,.12);
    leaf(px,py,pz,rr(.075,.14),'pine',az);
   }
  }
 }
 seed=pineSeed171;for(let n=0;n<13*4*(1+900*7);n++)random();pine171Stats={root:[x,2.4,z],pads:52,needlesPerPad:420,padHeight:.20,irregularBoundary:true,laterRNGPreserved:true};
}
role='branching-garden-trees';group(0,2.4,0,0,()=>pine(5.60,-13.2,5.8,2.4));tree(9.6,-11.4,9.2,2.4,'maple');tree(-10,-9,15,4.3,'leaf');tree(11,-22,14,3.8,'leaf');tree(-8,-28,13,3.8,'leaf');tree(13,-2,11,3.1,'leaf');for(let i=0;i<5;i++)tree(8+i*3.2,-30-i*1.7,16+i*.8,4.2,'leaf');
group(0,3.0,0,0,()=>tree(.2,-21,7.6,2.4,'leaf'));
role='distant-forest-ridge';{const nx=144,nz=28,pp=[],uv=[],colors=[],ix=[],peaks=[[-29,10.0,8.0],[-18,13.0,7.5],[-5,12.0,8.0],[2,13.0,8.5],[14,14.0,8.0],[26,11.0,7.0]];for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-48+i*96/nx,z=-53+j*25/nz;let ridge=0;for(const [cx,height,width] of peaks)ridge=Math.max(ridge,height*Math.exp(-Math.pow((x-cx)/width,2)*.5));const depthFactor=1-.42*j/nz,grain=Math.sin(x*1.83+z*.43)*Math.sin(z*.71-x*.57)*.24+Math.sin(x*.43+z*.31)*.32,y=-2+ridge*depthFactor+grain;pp.push(x,y,z);uv.push(x*.12,z*.12);const shade=.72+Math.max(0,ridge)*.013+grain*.035;colors.push(shade*.045,shade*.075,shade*.028);}for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ix.push(a,c,b,b,c,d);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();const m=new T.MeshStandardMaterial({name:'distant-forest-ridge',vertexColors:true,roughness:1,metalness:0,side:T.DoubleSide});materials.push(m);emit(g,m);}
role='hanging-veranda-foliage';// Overhanging canopy is high and lateral; the pagoda has a clean sky opening.
for(const [aa,bb,r]of[[[-10.10,10.90,-9.0],[-8.20,12.00,-7.0],.18],[[-8.20,12.00,-7.0],[-5.20,12.90,-4.40],.11],[[12.70,9.90,-2.10],[10.40,11.50,-3.00],.16],[[10.40,11.50,-3.00],[8.00,11.70,-3.50],.095]])between(aa,bb,r,'bark',true);
leafyTwig([-5.2,12.9,-4.4],[.1,12.4,-3.5],1.35,'leaf',18000);leafyTwig([-3.3,12.65,-4.0],[-.3,12.1,-3.0],1.0,'leaflight',9500);leafyTwig([8.0,11.7,-3.5],[4.5,10.3,-2.2],1.65,'leaf',18000);
role='sunward-entry-canopy';
for(const [a,b,r]of[[[-8.2,4.7,14.0],[-6.3,6.2,13.1],.18],[[-6.3,6.2,13.1],[-4.1,7.1,12.2],.09],[[-4.1,7.1,12.2],[-2.9,7.3,10.8],.05]])between(a,b,r,'bark',true);
leafyTwig([-11.0,6.10,14.1],[-8.50,6.60,13.3],1.05,'leaf',15000);
leafyTwig([-6.1,6.2,13.1],[-3.1,7.2,11.1],1.25,'leaf',15500);
leafyTwig([-5.2,6.8,12.2],[-3.6,7.3,14.1],1.05,'leaflight',8500);
role='dense-layered-shrubs';for(let i=54;i>0;i--){const z=rr(-18,6.5),side=i%2?1:-1,x=riverXAt(z)+side*rr(1.7,3.0),r=rr(.40,.78),h=rr(.38,.78);if(i%2===0||z<-8)shrub(x,.08,z,r,h,i%7===0?'leaflight':i%3===0?'leaflight':'leaf',280);}shrub(-2.85,.0,8.05,1.10,.76,'leaf',2200);shrub(6.8,.0,2.3,1.25,.85,'maple',1000);
for(const [x,z,leafKind]of[[-4.8,-3.8,'leaf'],[-3.2,-3.0,'leaflight'],[-5.6,-1.6,'leaf'],[-2.6,-.8,'maple'],[-4.2,.4,'leaf'],[-1.5,1.6,'leaflight']])shrub(x,.05,z,.82,1.18,leafKind,520);shrub(-5.3,.18,-1.2,1.2,1.4,'leaf',1250);shrub(-5.7,.18,-2.0,1.1,2.2,'leaflight',1500);shrub(-7.0,.2,2.0,1.1,1.7,'leaf',1200);shrub(-6.3,.1,1.0,1.0,2.2,'leaf',1400);shrub(7.0,.1,1.8,1.1,1.6,'maple',1300);shrub(7.2,.1,-1.0,1.0,1.8,'leaf',1250);shrub(-5.0,.12,-8.7,1.18,1.25,'leaflight',900);shrub(5.4,.12,-9.0,1.18,1.35,'maple',950);shrub(-4.9,.1,-2.7,1.05,1.35,'leaf',950);shrub(5.0,.1,-2.6,1.10,1.30,'leaflight',900);
shrub(-3.45,.06,-2.3,1.72,2.45,'leaf',2100);shrub(-1.75,.06,-5.5,1.28,2.25,'azalea',1500);shrub(-5.2,.05,1.0,1.10,1.85,'leaf',1500);shrub(-1.80,.06,1.6,1.28,1.38,'leaf',1450);shrub(5.10,.05,-1.4,1.85,2.65,'azalea',2300);shrub(4.45,.03,-5.0,1.30,1.48,'leaf',1400);shrub(4.25,.04,2.6,1.50,1.45,'leaf',1500);shrub(-2.0,-.10,10.1,.90,.80,'leaf',1900);shrub(-2.8,.0,8.9,1.05,.90,'leaflight',2000);
shrub(1.2,.05,-9.3,1.30,1.90,'azalea',1700);shrub(2.1,.03,-10.7,1.30,1.65,'leaf',1500);
for(const [x,z,r,h,kind]of[[-6.6,-3.7,1.75,2.20,'leaf'],[-4.4,-1.0,1.80,2.35,'leaflight'],[-2.1,2.8,1.45,1.50,'leaf'],[-5.4,4.1,1.70,1.80,'leaf'],[5.7,.8,1.65,1.85,'maple'],[3.9,-2.0,1.70,1.90,'leaf'],[2.3,-6.7,1.25,1.55,'leaf'],[6.7,-7.8,1.65,2.20,'maple'],[6.1,-16.0,1.50,2.30,'leaf']])shrub(x,.05,z,r,h,kind);
role='scanned-bank-understory';{
 let s=81771;const r=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);
 for(let j=0;j<118;j++){
  const x=-7.4+r()*6.2,z=-10.6+r()*16.8;
  if(x>-1.8&&z<-4.7||inGrandHallFootprint(x,z,.28))continue;
  botany.place({emit,height:terrainHeight,x,z,width:.18+r()*.15,flower:true,index:j});
 }
}
role='fern-and-ground-cover';for(let j=0;j<180;j++){const z=rr(-18,6.5),side=j%2?1:-1,x=riverXAt(z)+side*rr(2.3,3.9),s=rr(.21,.40);for(let k=0;k<5;k++){const a=k*2.39996+j,h=s*.8;for(let n=1;n<8;n++){const t=n/8,r=s*t,yy=terrainHeight(x,z)+.06+h*Math.sin(t*Math.PI*.9);for(const side of[-1,1])leaf(x+Math.cos(a)*r-side*Math.sin(a)*s*.10,yy,z+Math.sin(a)*r+side*Math.cos(a)*s*.10,s*.20,'leaflight',a+side*.7);}}}
role='garden-flowers';for(let j=0;j<64;j++){const z=rr(-12,4.5),x=riverXAt(z)+rr(4.1,5.9);const y=ground(z)+rr(.5,1.2);if(j%4===0)between([x,.1,z],[x,y,z],.013,'leaf',true);for(let i=0;i<5;i++){const a=i*1.256;leaf(x+Math.cos(a)*.04,y,z+Math.sin(a)*.04,.07,'flower',a);}}
// A few small lotus leaves sit in the slow water, leaving the channel readable.
role='stream-lotus';const lotus=new T.CircleGeometry(1,24,.12,6.04);lotus.rotateX(-Math.PI/2);for(let i=0;i<14;i++){const z=-16+rr(0,20),x=riverXAt(z)+rr(-.36,.36),y=waterYAt(z)+.045,s=rr(.10,.19);emit(lotus,'leaflight',x,y,z,s,1,s*.85,[0,rr(0,6.2),0]);if(i%5===0){const stem=rr(.12,.22);between([x,y,z],[x,y+stem,z],.010,'leaf',true);for(let p=0;p<5;p++)emit(bloomG,'flower',x+Math.cos(p*Math.PI*2/5)*.035,y+stem,z+Math.sin(p*Math.PI*2/5)*.035,.78,1,.78,[0,p*Math.PI*2/5,0],.92);}}
role='layered-bank-details213';const bankDress213=dressLayeredBanks213({emit,scannedStones,botany,height:terrainHeight,riverXAt,materials,grandFrame});bankDress213.terrain=ground213.info;
const skyG=new T.SphereGeometry(120,48,32),skyM=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,toneMapped:false,vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 direction;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}float fbm(vec2 p){float v=0.0,a=.52;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(13.7,8.1);a*=.48;}return v;}void main(){vec3 d=normalize(direction);float h=clamp(d.y,0.0,1.0);vec2 p=d.xz/(.10+abs(d.y))*2.65;float n=fbm(p+vec2(.0,.07*sin(p.x*1.6)));float cloud=smoothstep(.48,.65,n)*smoothstep(.0,.88,h);vec3 zenith=vec3(.25,.51,.83);vec3 horizon=vec3(.79,.87,.97);vec3 c=mix(horizon,zenith,smoothstep(.0,.42,h));float westGlow=exp(-pow((d.x+.43)*2.4,2.0))*exp(-h*2.2);c=mix(c,vec3(1.0,.85,.64),westGlow*.08);c=mix(c,vec3(1.0,.99,.96),cloud*.85);vec3 sunDir=normalize(vec3(-.36,.21,-.93));float sd=dot(d,sunDir);float halo=exp((sd-1.0)*70.0);float disk=smoothstep(.99935,.99978,sd);c=mix(c,vec3(1.0,.89,.64),clamp(halo*.66+disk,0.0,1.0));c=mix(c,vec3(.90,.93,.96),exp(-h*3.6)*.10);gl_FragColor=vec4(pow(c,vec3(2.2)),1.0);}'});
const skyMesh=new T.Mesh(skyG,skyM);skyMesh.renderOrder=-10;scene.add(skyMesh);geometries.add(skyG);materials.push(skyM)
const bounceMats=new Set(['red','redlight','wood','dark','gold','oldgold','wall','joinerygilt','hardwarebrass','hardwareRecess'].map(k=>mats[k]));
let instances=0,triangles=0;for(const {g,m,items} of buckets.values()){const mesh=new T.InstancedMesh(g,m,items.length);for(let i=0;i<items.length;i++){mesh.setMatrixAt(i,items[i].matrix);mesh.setColorAt(i,new T.Color().setScalar(items[i].tint));}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;if(g===leafG)mesh.castShadow=true;mesh.frustumCulled=true;if(bounceMats.has(m)||m.name.startsWith('grand-hall-')||m.name==='foregroundSoffit'||m===peony.material)mesh.layers.enable(1);scene.add(mesh);instances+=items.length;triangles+=(g.index?.count??g.attributes.position.count)/3*items.length;}
const natural197=installSun197(scene),sun=natural197.sun;
skyMesh.visible=false;const measuredSky=await installCourtyardRadiance({renderer,scene,sun});
scene.environmentIntensity=.62;measuredSky.info.environmentIntensity=.62;
let hallCourt197,entryCourt191;measuredSky.beginIndirectCapture();try{hallCourt197=captureHallCourt197({renderer,scene,materials,stream,grandFrame});entryCourt191=captureEntryCourt191({renderer,scene,mats,stream});}finally{measuredSky.endIndirectCapture();}
return {scene,setTime(time){void time;},stats:{instances,triangles,roles,seed:80247,rngFinalState:seed,revision:REBUILD213_REVISION,rebuild213:{toro:toro213.info,banks:bankDress213,joinery:galleryJoinery.info213,grandRoof:grandRoof191?.profile213,grandFineBearing:grandMass171?.joinery213,originalPortalsHeld:true},natural197:{...natural197.info,hallCourt:hallCourt197.info,joinery:galleryJoinery.info197,skyEnvironmentIntensity:.62},spatial191:spatial191.info(),finish191,entryCourt191:entryCourt191.info,externalAssets:true,proceduralPlaqueGeometry:true,description:'Extended occupied grand-hall return, upper sloping gallery with recessed load-bearing post line, foreground lower tiled gallery on distinct terrain-rooted piers, complete five-bay right veranda and low wing, solid central stone flight and connected bridge landing, closed ceramic pans/covers, portable pigmented scan PBR and measured partly cloudy radiance, mature branched broadleaf crowns and carved weathered stone lantern.',botany:botany.stats,grandFrame,grandMass171,scannedPeony:peony.info(),pine171:pine171Stats,rightHall171:{frame:rightHallFrame171,shrineIsHostLocal:true,frontAxes:[-4.05,-2.43,-.81,.81,2.43,4.05],bayCount:5},measuredSky:measuredSky.info,scannedStones:{...scannedStones.info,count:scannedStones.info.count()}},dispose(){hallCourt197.dispose();entryCourt191.dispose();peony.dispose();scannedStones.dispose();measuredSky.dispose();botany.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();stream.dispose();}};
}
