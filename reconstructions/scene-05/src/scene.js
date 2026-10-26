import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createRestorationArchitecture} from './architecture.js';
import {createReference4MaterialSet} from './materials.js';
import {buildMapleCanopy} from './foliage.js';
import {loadBlenderJoinery} from './blender-joinery.js';
import {createSculptedJoinery} from './sculpted-joinery.js';
import {createChasedEndBoot220,createPiercedStrap220} from './chased-copper220.js';
import {createClayTile05} from './handlaid-ceramics.js';
import {createDripPan272} from './eave-finish272.js';
import {createAgedPier05} from './aged-pier.js';
import {assignTimberPathUV05} from './timber-path-uv.js';
import {createHipTimber190,closedWire190} from './detail190-solids.js';
import {createLantern275} from './lantern275.js';
import {createHipBoot275} from './hip-boot275.js';
import {createTempleTerminal275} from './terminal275.js';
import {createFittedBearingCopper196} from './bearing-ends196.js';
import {installDaylight196} from './daylight196.js';
import {installScannedTimber,assignMetricTimberUV} from './scanned-timber.js';
import {installMeasuredSky} from './measured-sky.js';
import {installCourtyardReflection220} from './courtyard-reflection220.js';
import {loadLicensedCloud220} from './licensed-cloud220.js';
import {createBearingBoot361} from './eave-craft361.js';
import {POSE,TIER_SPEC,tierPlacement,tierWorldPoint} from './tier-layout.js';
export {POSE};
export async function buildScene(renderer=null){
 const scene=new T.Scene();scene.background=new T.Color('#79b8f2');
 const materialSet=createReference4MaterialSet(T),mats=materialSet.mats;
 mats.red.color.set('#aa5030');mats.cedar.color.set('#985430');mats.endwood.color.set('#c28545');
 mats.slate.color.set('#2b3e4b');mats.slate.roughness=.48;mats.tileEdge.color.set('#a3a69f');mats.darkwood.color.set('#555b4d');mats.paper.color.set('#515346');
 mats.gold.color.set('#e1af46');mats.oldgold.color.set('#c79a43');
 mats.gold.roughness=.33;mats.oldgold.roughness=.42;
 mats.lanternPaper=mats.paper.clone();mats.lanternPaper.name='scene05-lantern-paper';mats.lanternPaper.color.set('#e2cd9c');mats.lanternPaper.emissive.set('#f4ce80');mats.lanternPaper.emissiveIntensity=.065;
 // Private cap surfaces keep the glazed ceramic recess distinct from the roof.
 mats.tileEndCeramic=mats.slate.clone();mats.tileEndCeramic.name='scene05-dark-inset-tile-cap';mats.tileEndCeramic.color.set('#42494d');mats.tileEndCeramic.roughness=.65;
 mats.tileEndRelief=mats.slate.clone();mats.tileEndRelief.name='scene05-worn-ceramic-floral-relief';mats.tileEndRelief.color.set('#9e895e');mats.tileEndRelief.roughness=.66;mats.tileEndRelief.metalness=.28;
 mats.cornerCeramic=mats.slate.clone();mats.cornerCeramic.name='scene05-aged-charcoal-ceramic-corner-carving';mats.cornerCeramic.color.set('#535b60');mats.cornerCeramic.roughness=.68;mats.cornerCeramic.bumpScale=.00035;mats.cornerCeramic.metalness=.025;mats.cornerCeramic.vertexColors=true;
 mats.terminalInlay204=mats.oldgold.clone();mats.terminalInlay204.name='scene05-thin-weathered-terminal-inlay204';mats.terminalInlay204.color.set('#aa8747');mats.terminalInlay204.roughness=.64;mats.terminalInlay204.metalness=.64;

 const baseJoineryKit=await loadBlenderJoinery(),sculptedJoinery=createSculptedJoinery(),endCopper=createHipBoot275(),endCopperSmall=createChasedEndBoot220({type:'small'}),armCopper=createBearingBoot361({type:'primary'}),secondary190=createChasedEndBoot220({type:'lower'}),secondary220=createChasedEndBoot220({type:'lower',variant:1}),chasedStrap=createPiercedStrap220(),lantern190=createLantern275(),mask190=await createTempleTerminal275(),primary196=createFittedBearingCopper196(armCopper.parts),secondary196=createFittedBearingCopper196(secondary190.parts),secondaryFitted220=createFittedBearingCopper196(secondary220.parts),licensedCloud=await loadLicensedCloud220();
 const joineryKit={...baseJoineryKit,bracket:sculptedJoinery.bracket,cornerFan:sculptedJoinery.cornerFan,bracketFittings:sculptedJoinery.bracketFittings,cornerFanFittings:sculptedJoinery.cornerFanFittings,waistBearing:sculptedJoinery.waistBearing,waistFittings:sculptedJoinery.waistFittings,relief:chasedStrap.geometry,fittingParts:endCopper.parts,fittingPartsSmall:endCopperSmall.parts,secondaryFittingParts:secondary190.parts,primaryBearingFitting196:primary196.parts,secondaryBearingFitting196:secondary196.parts,secondaryBearingFitting220:[secondary196.parts,secondaryFitted220.parts],cornerMask:mask190.parts,cornerMaskMount190:mask190.mountParts,sculpted:true,info:{...sculptedJoinery.info,endFitting:endCopper.info,armFitting:armCopper.info,piercedStrap:chasedStrap.info,secondary190:secondary190.info,secondary220:secondary220.info,bearingCut196:primary196.info,lantern190:lantern190.info,mask190:mask190.info},dispose(){baseJoineryKit.dispose();sculptedJoinery.dispose();endCopper.dispose();endCopperSmall.dispose();armCopper.dispose();secondary190.dispose();secondary220.dispose();chasedStrap.dispose();lantern190.dispose();mask190.dispose();primary196.dispose();secondary196.dispose();secondaryFitted220.dispose();}};Object.assign(mats,joineryKit.materials);
 const copperPixels=new Uint8Array(128*128*4);for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   const hash=(a,b)=>{const q=Math.sin(a*127.1+b*311.7)*43758.5453;return q-Math.floor(q);};
   const noise=(a,b)=>{const i=Math.floor(a),j=Math.floor(b),u=a-i,v=b-j,s=u*u*(3-2*u),t=v*v*(3-2*v);return(1-t)*((1-s)*hash(i,j)+s*hash(i+1,j))+t*((1-s)*hash(i,j+1)+s*hash(i+1,j+1));};
   const q=Math.round(255*(.64+.21*noise(x*.045,y*.045)+.10*noise(x*.47,y*.47)+.035*hash(x,y))),i=(y*128+x)*4;copperPixels[i]=copperPixels[i+1]=copperPixels[i+2]=q;copperPixels[i+3]=255;
 }
 const copperFinish=new T.DataTexture(copperPixels,128,128);copperFinish.wrapS=copperFinish.wrapT=T.RepeatWrapping;copperFinish.minFilter=T.LinearMipmapLinearFilter;copperFinish.magFilter=T.LinearFilter;copperFinish.generateMipmaps=true;copperFinish.needsUpdate=true;
 const copperAlbedo=copperFinish.clone();copperAlbedo.colorSpace=T.SRGBColorSpace;copperAlbedo.needsUpdate=true;
 mats.fittingCopper=new T.MeshStandardMaterial({name:'scene05-chased-ancient-brass-folded-floor',color:'#ad8850',metalness:.83,roughness:.47,envMapIntensity:1.18,map:copperAlbedo,bumpMap:copperFinish,bumpScale:.0004,roughnessMap:copperFinish});
 mats.fittingEdge=new T.MeshStandardMaterial({name:'scene05-chased-worn-gold-incised-mask',color:'#eed196',metalness:.94,roughness:.42,envMapIntensity:1.22,map:copperAlbedo,bumpMap:copperFinish,bumpScale:.00024,roughnessMap:copperFinish});
 mats.fittingPatina=new T.MeshStandardMaterial({name:'scene05-oxidised-chasing-floor',color:'#57432d',metalness:.67,roughness:.72,envMapIntensity:.65});
 mats.kit_gilt.color.set('#b89a64');mats.kit_gilt.metalness=.82;mats.kit_gilt.roughness=.49;mats.kit_gilt.map=copperAlbedo;mats.kit_gilt.roughnessMap=copperFinish;
 //361: independently tarnished ground and high relief. Closed fitted sleeves
 // use a diffuse aged gold ground under brighter worked raised details.
 mats.bearingGround361=new T.MeshStandardMaterial({name:'scene05-matte-worn-gilded-end-floor361',color:'#b99a56',metalness:.57,roughness:.62,map:copperAlbedo,roughnessMap:copperFinish,bumpMap:copperFinish,bumpScale:.00028,vertexColors:true,envMapIntensity:1.05});
 mats.bearingGold361=new T.MeshStandardMaterial({name:'scene05-raised-worked-gold-chasing361',color:'#e2c27c',metalness:.84,roughness:.41,map:copperAlbedo,roughnessMap:copperFinish,bumpMap:copperFinish,bumpScale:.00018,vertexColors:true,envMapIntensity:1.18});
 mats.bearingCopper361=new T.MeshStandardMaterial({name:'scene05-folded-warm-aged-brass-return361',color:'#b39a63',metalness:.77,roughness:.53,map:copperAlbedo,roughnessMap:copperFinish,vertexColors:true,envMapIntensity:1.05});
 mats.bearingRecess361=new T.MeshStandardMaterial({name:'scene05-ochre-oxidised-gilt-recess361',color:'#927641',metalness:.42,roughness:.73,vertexColors:true,envMapIntensity:.80});
 mats.tileEndCeramic361=new T.MeshPhysicalMaterial({name:'scene05-rounded-blue-grey-fired-clay-cap361',color:'#47565f',roughness:.63,metalness:.012,clearcoat:.10,clearcoatRoughness:.52,vertexColors:true});
 mats.tileEndLip361=mats.tileEndCeramic361.clone();mats.tileEndLip361.name='scene05-worn-rounded-kiln-rim361';mats.tileEndLip361.color.set('#64727a');mats.tileEndLip361.roughness=.72;mats.tileEndLip361.clearcoat=.055;
 mats.tileEndRelief361=new T.MeshStandardMaterial({name:'scene05-worn-gilded-pressed-clay-flower361',color:'#bba572',roughness:.68,metalness:.34,envMapIntensity:.90,map:copperAlbedo,bumpMap:copperFinish,bumpScale:.00015});
 mats.rafterCopper220=mats.fittingCopper.clone();mats.rafterCopper220.name='scene05-small-rafter-worked-brass';mats.rafterCopper220.color.set('#bd9147');mats.rafterCopper220.roughness=.55;mats.rafterCopper220.envMapIntensity=.90;
 mats.rafterEdge220=mats.fittingEdge.clone();mats.rafterEdge220.name='scene05-small-rafter-cast-edges';mats.rafterEdge220.color.set('#cba052');mats.rafterEdge220.roughness=.48;mats.rafterEdge220.envMapIntensity=.95;
 mats.rafterPatina220=mats.fittingPatina.clone();mats.rafterPatina220.name='scene05-small-rafter-oxidised-recess';
 // Private castwork and kiln surfaces retain the real local reflection probe.
 mats.lanternGilt275=new T.MeshStandardMaterial({name:'scene05-lantern-worn-cast-gilt275',color:'#bba06a',metalness:.89,roughness:.46,map:copperAlbedo,roughnessMap:copperFinish,bumpMap:copperFinish,bumpScale:.00022,vertexColors:true});
 mats.lanternEdge275=mats.lanternGilt275.clone();mats.lanternEdge275.name='scene05-lantern-worked-edge275';mats.lanternEdge275.color.set('#d7bc83');mats.lanternEdge275.roughness=.38;
 mats.lanternFrame275=mats.lanternGilt275.clone();mats.lanternFrame275.name='scene05-lantern-oxidised-bronze-frame275';mats.lanternFrame275.color.set('#78613c');mats.lanternFrame275.roughness=.55;mats.lanternFrame275.metalness=.78;
 mats.lanternRecess275=new T.MeshStandardMaterial({name:'scene05-lantern-deep-cast-recess275',color:'#40392b',roughness:.73,metalness:.56,vertexColors:true});
 mats.lanternPaper275=new T.MeshStandardMaterial({name:'scene05-recessed-ivory-lantern-shade275',color:'#e1d5b6',roughness:.95,metalness:0,emissive:'#f0d6a0',emissiveIntensity:.022,vertexColors:true});
 mats.terminalClay275=new T.MeshPhysicalMaterial({name:'scene05-sculpted-blue-charcoal-glazed-clay275',color:'#35434b',roughness:.57,metalness:.018,clearcoat:.20,clearcoatRoughness:.44,vertexColors:true});
 mats.terminalLip275=mats.terminalClay275.clone();mats.terminalLip275.name='scene05-rolled-grey-blue-glazed-clay-edge275';mats.terminalLip275.color.set('#6e808b');mats.terminalLip275.roughness=.51;mats.terminalLip275.clearcoat=.24;
 mats.terminalRecess275=mats.terminalClay275.clone();mats.terminalRecess275.name='scene05-recessed-glazed-orbital-clay275';mats.terminalRecess275.color.set('#273943');mats.terminalRecess275.roughness=.46;
 mats.terminalGold275=mats.fittingEdge.clone();mats.terminalGold275.name='scene05-worn-seated-ceramic-inlay275';mats.terminalGold275.color.set('#ac925e');mats.terminalGold275.roughness=.53;
 // Solid code-built geometry and the user-authorized image-assisted relief.
 const stack=[new T.Matrix4()],bucket=new Map(),geometryCache=new Map(),columns=[];
 const primitive={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,16,10),cone:new T.ConeGeometry(1,1,16)};
 function instance(geo,mat,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=null,tint=1){
   if(typeof geo==='string')geo=primitive[geo];if(!geo)throw Error('Unknown geometry');
   let material=mats[mat];if(!material)throw Error('Unknown material '+mat);
   const quaternion=rot?.isQuaternion?rot:new T.Quaternion().setFromEuler(new T.Euler(...(Array.isArray(rot)?rot:[0,0,0])));
   const matrix=stack.at(-1).clone().multiply(new T.Matrix4().compose(new T.Vector3(x,y,z),quaternion,new T.Vector3(sx,sy,sz)));
   let woodTint=null;
   if(material.userData.metricTimberGrain){
    if(!geo.boundingBox)geo.computeBoundingBox();const centre=geo.boundingBox.getCenter(new T.Vector3()).applyMatrix4(matrix),fract=v=>v-Math.floor(v),a=fract(Math.sin(centre.x*13.71+centre.y*8.31+centre.z*5.17)*43758.5453),b=fract(Math.sin(centre.x*4.33+centre.y*19.21-centre.z*7.37)*27314.13),gain=.93+.12*a;
    const tone=mat==='windowBars'||mat==='postwood'?[1,1,1]:b<.33?[.80,.83,.88]:b<.70?[.96,.90,.88]:[1.08,1.02,.97];woodTint=tone.map(c=>c*gain);
   }
   if(!bucket.has(material))bucket.set(material,[]);bucket.get(material).push({geo,matrix,tint,woodTint});
 }
 function group(x,y,z,angle,fn){stack.push(stack.at(-1).clone().multiply(new T.Matrix4().makeTranslation(x,y,z)).multiply(new T.Matrix4().makeRotationY(angle)));try{fn();}finally{stack.pop();}}
 function box(x,y,z,w,h,d,ma='cedar',rot=0,tint=1){
   if(ma==='postwood'){
     const key='checked-pier:'+w.toFixed(5)+':'+h.toFixed(5)+':'+d.toFixed(5);
     if(!geometryCache.has(key))geometryCache.set(key,createAgedPier05(w,h,d));
     instance(geometryCache.get(key),ma,x,y,z,1,1,1,[0,rot,0],tint);return;
   }
   if(['red','cedar','endwood','darkwood','architecture_red','architecture_cedar','architecture_endwood','windowBars','postwood'].includes(ma)&&Math.min(w,h,d)>.045){
     const key=[w,h,d].map(n=>n.toFixed(5)).join(':');
     if(!geometryCache.has(key))geometryCache.set(key,new RoundedBoxGeometry(w,h,d,1,Math.min(.014,Math.min(w,h,d)*.10)));
     instance(geometryCache.get(key),ma,x,y,z,1,1,1,[0,rot,0],tint);
   }else instance('box',ma,x,y,z,w,h,d,[0,rot,0],tint);
 }
 mats.handformedClay=new T.MeshPhysicalMaterial({name:'scene05-handformed-grey-fired-clay',color:'#555951',roughness:.63,metalness:.015,clearcoat:.10,clearcoatRoughness:.49,vertexColors:true});
 mats.eaveCeramic272=new T.MeshPhysicalMaterial({name:'scene05-blue-charcoal-concave-eave-pan272',color:'#434f58',roughness:.61,metalness:.015,clearcoat:.12,clearcoatRoughness:.48,vertexColors:true});
 mats.eaveCeramicLip272=new T.MeshStandardMaterial({name:'scene05-worn-grey-fired-eave-lip272',color:'#697774',roughness:.68,metalness:.02,vertexColors:true});
 const arch=createRestorationArchitecture({instance,group,box,materials:mats,columns,stack,joineryKit,handlaidCeramics:true,tierCollarMaterial:'red',pagodaPostMaterial:'postwood',cornerCeramicScale:.82,hipMaterial190:'hipwood',carpenteredBearing220:true});
 mats.architecture_red.color.set('#b35c34');mats.architecture_cedar.color.set('#a9653d');mats.architecture_endwood.color.set('#b47538');mats.architecture_slate.color.set('#293b48');mats.architecture_slate.roughness=.48;mats.architecture_tileEdge.color.set('#a9aca4');mats.architecture_gold.color.set('#e8b84f');mats.architecture_oldgold.color.set('#c99c4e');mats.architecture_darkwood.color.set('#565d50');
 mats.windowBars=mats.architecture_darkwood.clone();mats.windowBars.name='scene05-weathered-gray-window-bars';mats.windowBars.color.set('#73776a');mats.windowBars.map=null;mats.windowBars.bumpMap=null;mats.windowBars.roughnessMap=null;mats.windowBars.roughness=.78;mats.windowBars.envMapIntensity=.55;
 for(const [name,m]of Object.entries(mats)){
   if(['red','cedar','endwood','darkwood'].some(k=>name===k||name==='architecture_'+k)){
     m.roughnessMap=null;m.roughness=name.includes('endwood')?.84:.76;m.envMapIntensity=.28;m.bumpScale=.006;
     m.onBeforeCompile=shader=>{
       shader.vertexShader='varying vec2 vWearUv;\n'+shader.vertexShader;
       shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvWearUv=uv;');
       shader.fragmentShader='varying vec2 vWearUv;\n'+shader.fragmentShader;
       shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float warped=vWearUv.x*470.+sin(vWearUv.y*24.)*2.0+sin(vWearUv.y*57.+vWearUv.x*13.)*.7;
float grainFilter=1.-smoothstep(.65,2.5,fwidth(warped));
float grain=(sin(warped)*.055+sin(warped*2.31)*.032)*grainFilter;
float aged=sin(vWearUv.x*16.+sin(vWearUv.y*8.))*.065;
float split=pow(max(0.,sin(vWearUv.x*169.+sin(vWearUv.y*12.)*.4)),30.)*smoothstep(.0,.6,sin(vWearUv.y*14.+vWearUv.x*31.));
diffuseColor.rgb*=.94+grain+aged-split*.20;
`);
     };m.customProgramCacheKey=()=> 'scene05-aged-wood-grain-v3';
   }
   if(name==='gold'||name==='architecture_gold'){m.roughness=.45;m.envMapIntensity=1.10;}
   if(name==='oldgold'||name==='architecture_oldgold'){m.roughness=.52;m.envMapIntensity=.90;}
 }
 mats.lanternBronze=new T.MeshStandardMaterial({name:'scene05-lantern-aged-bronze',color:'#8a6738',metalness:.64,roughness:.47,envMapIntensity:1.12});
 const scannedTimber=await installScannedTimber(mats);
 mats.windowBars.map=mats.architecture_darkwood.map;mats.windowBars.normalMap=mats.architecture_darkwood.normalMap;mats.windowBars.normalScale.copy(mats.architecture_darkwood.normalScale);mats.windowBars.roughness=.80;mats.windowBars.clearcoat=.055;mats.windowBars.specularIntensity=.34;mats.windowBars.onBeforeCompile=mats.architecture_darkwood.onBeforeCompile;mats.windowBars.customProgramCacheKey=()=> 'scene05-gray-window-tissue220';mats.windowBars.userData.metricTimberGrain=true;
 mats.rafterCut220=mats.red.clone();mats.rafterCut220.name='scene05-matte-warm-upper-rafter-cut';mats.rafterCut220.color.set('#9c4e38');mats.rafterCut220.roughnessMap=null;mats.rafterCut220.roughness=.90;mats.rafterCut220.clearcoat=.010;mats.rafterCut220.specularIntensity=.18;mats.rafterCut220.envMapIntensity=.45;mats.rafterCut220.onBeforeCompile=mats.red.onBeforeCompile;mats.rafterCut220.customProgramCacheKey=()=> 'scene05-matte-rafter-cut220';mats.rafterCut220.userData.metricTimberGrain=true;
 mats.hipwood=mats.red.clone();mats.hipwood.name='scene05-carved-aged-raked-hip-timber';mats.hipwood.color.set('#874b39');mats.hipwood.roughness=.80;mats.hipwood.clearcoat=.060;mats.hipwood.specularIntensity=.52;mats.hipwood.envMapIntensity=.64;mats.hipwood.onBeforeCompile=mats.red.onBeforeCompile;mats.hipwood.customProgramCacheKey=()=> 'scene05-r09-recurved-hip-worn-brown';mats.hipwood.userData.metricTimberGrain=true;
 mats.postwood=mats.architecture_red.clone();mats.postwood.name='scene05-oxidised-gray-red-structural-pier';mats.postwood.color.set('#83675d');mats.postwood.roughness=.89;mats.postwood.clearcoat=.025;mats.postwood.specularIntensity=.40;mats.postwood.onBeforeCompile=mats.architecture_red.onBeforeCompile;mats.postwood.customProgramCacheKey=mats.architecture_red.customProgramCacheKey;mats.postwood.userData.metricTimberGrain=true;
 mats.windowBars.color.set('#82867b');
 mats.transomwood220=mats.cedar.clone();mats.transomwood220.name='scene05-recessed-aged-transom-boards220';mats.transomwood220.color.set('#80533d');mats.transomwood220.roughness=.88;mats.transomwood220.clearcoat=.02;mats.transomwood220.onBeforeCompile=mats.cedar.onBeforeCompile;mats.transomwood220.customProgramCacheKey=mats.cedar.customProgramCacheKey;mats.transomwood220.userData.metricTimberGrain=true;
 mats.scannedWood220=new T.MeshStandardMaterial({name:'scene05-source-cloud-aged-wood',color:'#684431',roughness:.80,metalness:0});
 mats.scannedGilt220=new T.MeshStandardMaterial({name:'scene05-source-cloud-worn-gilt',color:'#b9985e',roughness:.56,metalness:.86,map:copperAlbedo,roughnessMap:copperFinish});
 // Lower story begins at 0.35 m; the low camera sees an architectural tower continuing beyond the top crop.
 mats.carvingGround=new T.MeshStandardMaterial({name:'scene05-dark-carved-ground',color:'#2b2116',roughness:.9});
 const leafShape=new T.Shape();leafShape.moveTo(-.5,0);leafShape.bezierCurveTo(-.15,.23,.29,.28,.5,0);leafShape.bezierCurveTo(.15,-.19,-.2,-.13,-.5,0);
 const carvedLeaf=new T.ExtrudeGeometry(leafShape,{depth:.025,steps:1,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:1,curveSegments:5});
 const levels=[],landmarkWorlds={},licensedMounts220=[];
 for(let level=0;level<5;level++){
   const placement=tierPlacement(level);stack.push(stack.at(-1).clone().multiply(new T.Matrix4().makeTranslation(0,placement.baseY,0)).multiply(new T.Matrix4().makeScale(placement.scale,placement.scale,placement.scale)));
   const scale=1,w=TIER_SPEC.width,y=0,deckWidth=level?w*tierPlacement(level-1).scale/placement.scale:w+.5,roofWidth=w+TIER_SPEC.roofAddition,roofY=placement.roofHeight,roofRise=placement.roofRise,lanternY=placement.lanternHeight;
   box(0,.15,0,deckWidth,.30,deckWidth,'darkwood');
   const next=level<4?tierPlacement(level+1):null,storyPitch=next?(next.baseY-placement.baseY)/placement.scale:null;
   // Below the photographed waist is another occupied timber room. Carry
   // the visible gallery directly on its real purlin; a ghost full roof and
   // a tall solid collar were the wrong construction here (R01/R02 retained).
   const lowerFrame=placement.lowerOccupiedFrame,
     frame=arch.pagodaStoreyFrame({w,d:w,y,level,scale,roofWidth,roofDepth:roofWidth,roofRise,roofY,bracketVerticalScale:placement.bearingVerticalScale,bracketHorizontalScale:TIER_SPEC.bearingHorizontalScale,carvedWindowHalfHeight:level===1?.44:.385,windowMaterial:'paper',detail:true,...(lowerFrame?{floorBearingY:storyPitch,windowHeadY:storyPitch-.13-.3868*placement.bearingVerticalScale-.14}:{})});
   const upperFloor=next?{width:w,depth:w,bottomY:storyPitch,topY:storyPitch+.30*next.scale/placement.scale}:null;
   if(!lowerFrame)arch.pagodaRoof({y:roofY,w:roofWidth,d:roofWidth,rise:roofRise,wallWidth:w,wallDepth:w,frameScale:1,detail:true,soffitMaterial:'darkwood',referenceMode:'scene05-calibrated',upperFloor});
   levels.push({level,y:placement.baseY,scale:placement.scale,width:w*placement.scale,shaftTop:placement.baseY+frame.shaftTop*placement.scale,roofY:placement.baseY+roofY*placement.scale,roofWidth:roofWidth*placement.scale,upperFloor:upperFloor?{width:w*placement.scale,bottomY:next.baseY}:null});
   const R=roofWidth/2;landmarkWorlds[level]={hipNear:tierWorldPoint(level,[R+.125,roofY+.8374,R+.125]),hipLeft:tierWorldPoint(level,[-R-.125,roofY+.8374,R+.125]),postHead:tierWorldPoint(level,[w/2,frame.shaftTop,w/2]),waistNear:tierWorldPoint(level,[deckWidth/2+.04,.58,deckWidth/2+.04]),lanternNear:tierWorldPoint(level,[R*1.025,lanternY,R*1.025]),lanternLeft:tierWorldPoint(level,[-R*1.025,lanternY,R*1.025]),tailSeat:tierWorldPoint(level,tailPath(w,y,scale,1,1,placement).getPoint(0).toArray()),tailCut:tierWorldPoint(level,[w/2+TIER_SPEC.roofAddition/2*TIER_SPEC.tailReach,placement.tailCutHeight,w/2+TIER_SPEC.roofAddition/2*TIER_SPEC.tailReach])};
   balcony(w,y+(level===0?.58:0),scale,deckWidth);
   if(!lowerFrame)cornerTails(w,y,scale,placement);
   pentRoof(w,y+.32,scale,deckWidth);carvedWindowInserts(w,frame.windowCenterY,scale,level);
   // Four identical suspended lanterns, each is fixed to the outer hip beam.
   const r=roofWidth/2;
   if(!lowerFrame)for(const sx of [-1,1])for(const sz of [-1,1])lantern(sx*r*1.025,y+lanternY,sz*r*1.025,.62*scale,[tailPath(w,y,scale,sx,sz,placement).getPoint(.20).toArray(),tailPath(w,y,scale,sx,sz,placement).getPoint(.28).toArray()]);
   // Thin worked straps seat on the real crowned header. The obsolete
   // full-face red strip is removed so its actual eased section is visible.
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
     for(let k=-1;k<=1;k++){
       const x=k*w/3,headerY=frame.windowHeaderY;
       if(level<4){
         instance(chasedStrap.geometry,'fittingEdge',x,headerY,w/2+.131,.10*scale,.46*scale,.10,[0,0,Math.PI/2]);
         for(const sign of[-1,1])instance('sphere','fittingCopper',x+sign*.25*scale,headerY,w/2+.133,.0035*scale,.0035*scale,.0016*scale);
       }
     }
   });
   stack.pop();
 }
 function carvedWindowInserts(w,centerY,s,level){
   if(level===1){
    // A bounded reuse of actual carved wood, mounted on a separate real
    // cassette. Four uniformly scaled, isometrically arranged source pieces
    // replace the former flat leaf/sine icon in this main occupied storey.
    for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>group(0,centerY,w/2,0,()=>{
     for(const sign of[-1,1]){box(sign*.485,0,.005,.055,.85,.14,'red');box(0,sign*.400,.005,.97,.050,.14,'red');}
     box(0,0,.005,.028,.78,.14,'darkwood');box(0,0,.005,.94,.024,.14,'darkwood');
     for(const [mirror,x,y,angle]of[[0,.224,-.375,0],[1,-.224,-.375,0],[0,-.224,.375,Math.PI],[1,.224,.375,Math.PI]]){
      const uniform=.42,q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),angle),matrix=stack.at(-1).clone().multiply(new T.Matrix4().compose(new T.Vector3(x,y,-.055),q,new T.Vector3(uniform,uniform,uniform))),e=matrix.elements,axes=[new T.Vector3(e[0],e[1],e[2]),new T.Vector3(e[4],e[5],e[6]),new T.Vector3(e[8],e[9],e[10])],lengths=axes.map(v=>v.length());
      if(Math.max(...lengths)-Math.min(...lengths)>1e-9)throw Error('Scene05 actual carving would be stretched');
      licensedMounts220.push({level,face,sourceVariant:mirror?'isometric X mirror':'retained orientation',localScale:uniform,worldColumnLengths:lengths,orthogonal:axes.every((a,i)=>axes.every((b,j)=>i===j||Math.abs(a.dot(b))<1e-9)),mount:'Source left cut caps seat on the central closed timber stile; source base/top seats meet cassette rails',sourceGeometryUnstretched:true});
      for(const part of licensedCloud.variants[mirror])instance(part.geometry,part.material,x,y,-.055,uniform,uniform,uniform,q);
     }
    }));return;
   }
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>group(0,centerY,w/2+.09,0,()=>{
     for(const side of [-1,1]){box(side*.47*s,0,0,.055*s,.72*s,.055*s,'red');box(0,side*.34*s,0,.94*s,.05*s,.055*s,'red');}
     for(let n=0;n<3;n++){
       const points=[];for(let j=0;j<=32;j++){const t=j/32,phase=t*Math.PI*2+n*Math.PI*.67;points.push(new T.Vector3((t-.5)*.86*s,Math.sin(phase)*(.19-.02*n)*s,.018+Math.sin(phase*.7)*.012));}
       instance(new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.014*s,6,false),n%2?'oldgold':'cedar');
       for(let j=0;j<7;j++){const t=(j+.5)/7,p=points[Math.round(t*32)],sgn=j%2?1:-1;instance(carvedLeaf,j%3?'oldgold':'gold',p.x,p.y+sgn*.035*s,p.z+.014,.16*s,.22*s,.17,[0,0,sgn*.6+n*.23]);}
     }
     for(let k=0;k<5;k++){
       const cx=-.34+k*.17,points=[];for(let j=0;j<=28;j++){const a=j/28*Math.PI*1.85,r=.077*(1-j/40);points.push(new T.Vector3((cx+Math.cos(a)*r)*s,Math.sin(a)*r*s,.037));}
       instance(new T.TubeGeometry(new T.CatmullRomCurve3(points),28,.008*s,5,false),'oldgold');
     }
   }));
 }
 function tailPath(w,y,s,sx,sz,placement=TIER_SPEC){
   const radius=w/2+TIER_SPEC.roofAddition/2*(1.10/1.75)*s,t=radius/((w+TIER_SPEC.roofAddition)/2),
     // Seat the real brace in the actual diagonal hip timber. The former
     // fixed +.40 start lay inside the ceramic shell, above that bearing.
     hipCentre=placement.roofHeight+placement.roofRise*Math.pow(Math.max(0,1-t),1.43)+.48*Math.pow(t,9)*1.25-.365;
   const start=new T.Vector3(sx*radius,y+hipCentre,sz*radius);
   const end=new T.Vector3(sx*(w/2+TIER_SPEC.roofAddition/2*TIER_SPEC.tailReach*s),y+placement.tailCutHeight,sz*(w/2+TIER_SPEC.roofAddition/2*TIER_SPEC.tailReach*s));
   const mid=start.clone().lerp(end,.55).add(new T.Vector3(sx*.015,.025,sz*.015));return new T.CatmullRomCurve3([start,mid,end]);
 }
 function cornerTails(w,y,s,placement){
   for(const sx of [-1,1])for(const sz of [-1,1]){
     const path=tailPath(w,y,s,sx,sz,placement),end=path.getPoint(1);
     // Rectangular curved timber with real depth, connected to the crossing capital.
     const shaped=createHipTimber190(path,s),geometry=shaped.geometry;assignTimberPathUV05(geometry,path);instance(geometry,'hipwood');
     // One worked surface fitting belongs on each of the two principal
     // photographed hip ranks. It is seated on the true waisted cheek.
     if(placement.level===1||placement.level===2){const m=shaped.face(.68,new T.Vector3(sx,0,sz).normalize()),position=new T.Vector3(),q=new T.Quaternion(),v=new T.Vector3();m.decompose(position,q,v);instance(chasedStrap.geometry,'fittingEdge',...position.toArray(),.14*s,.19*s,.13*s,q);}
     const normal=path.getTangent(1).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),normal);
     const goldEnd=end.clone().addScaledVector(normal,.008);
     // The sleeve and its flower follow the real downward cut-plane normal.
     // The old yaw-only plaque left that true underside as a blank gold box.
     for(const p of endCopper.parts)instance(p.geometry,p.material,...goldEnd.toArray(),.254*s,.344*s,.254*s,q);
     // The recurved timber carries actual longitudinal carved coves. A
     // single thin pierced strap replaces the repeated generic cheek leaves.
   }
 }
 function pentRoof(w,y,s,deckWidth=w+1.5*s){
   const inner=w/2+.035,outer=Math.max(w/2+.25,deckWidth/2+.04);
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
     const p=[],ids=[],rows=5,cols=Math.round((2*outer)/.26),profile=t=>.36*s*Math.pow(Math.max(0,1-t),1.3)+.16*s*Math.pow(t,5);
     for(let j=0;j<=rows;j++)for(let k=0;k<=cols;k++){const t=j/rows,z=inner+(outer-inner)*t,x=(-1+2*k/cols)*(inner+(outer-inner)*t);p.push(x,y+profile(t),z);if(j<rows&&k<cols){const a=j*(cols+1)+k;ids.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}}
     const stride=p.length/3,upper=[...p],original=[...ids];for(let k=0;k<upper.length;k+=3)p.push(upper[k],upper[k+1]-.028,upper[k+2]);for(let k=0;k<original.length;k+=3)ids.push(original[k]+stride,original[k+2]+stride,original[k+1]+stride);
     const border=[...Array.from({length:cols},(_,i)=>i),...Array.from({length:rows},(_,j)=>j*(cols+1)+cols),...Array.from({length:cols},(_,i)=>rows*(cols+1)+cols-i),...Array.from({length:rows},(_,j)=>(rows-j)*(cols+1))];for(let k=0;k<border.length;k++){const a=border[k],b=border[(k+1)%border.length];ids.push(a,b,a+stride,b,b+stride,a+stride);}
     const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();instance(g,'slate');
     const pieces=[];
     for(let j=0;j<=cols;j++){
      const x=-outer+2*outer*j/cols,lo=Math.max(0,(Math.abs(x)-inner)/(outer-inner));
      if(lo<.98){for(let row=0;row<2;row++){const a=lo+(1.025-lo)*row/2,b=lo+(1.025-lo)*(row+1.025)/2,ts=Array.from({length:5},(_,k)=>a+(b-a)*k/4);pieces.push(createClayTile05(ts.map(t=>[x,y+profile(t),inner+(outer-inner)*t]),.163,{cover:true,variant:face*7+j*1.71+row}));if(j<cols){const xx=x+outer/cols,panEnd=1-.18/(outer-inner),aa=a,bb=Math.min(b,panEnd);if(bb>aa){const panTs=Array.from({length:5},(_,k)=>aa+(bb-aa)*k/4);pieces.push(createClayTile05(panTs.map(t=>[xx,y+profile(t),inner+(outer-inner)*t]),.213,{cover:false,variant:face*3+j*.87+row}));}}}}
      arch.tileEnd(new T.Vector3(x,y+.16*s+.028,outer+.045),0,.102,true,j+face*19);
     }
     if(pieces.length){instance(mergeGeometries(pieces,false),'handformedClay');pieces.forEach(g=>g.dispose());}
     box(0,y+.08*s,outer,outer*2,.13*s,.15*s,'red');
     for(let j=1;j<cols;j++){const x=-inner+2*inner*j/cols;box(x,y+.10*s,(inner+outer)/2,.075*s,.105*s,outer-inner,'cedar');}
     // Closed bellied clay pans replace the straight applied scroll strip.
     // The two finite mitres meet the adjacent rotated face at the real hip.
     const waistSample=(_face,t,u)=>new T.Vector3(u*outer*t,y+profile(T.MathUtils.clamp((outer*t-inner)/(outer-inner),0,1.025)),outer*t),
       panOptions={frontRadial:1+.030/outer,rearRadial:1-.20/outer,cornerStart:1+.008/outer,cornerSeat:1-.015/outer,bellyDrop:.120};
     for(let j=0;j<cols;j++){
       const pan=createDripPan272(waistSample,0,-1+2*j/cols,-1+2*(j+1)/cols,{...panOptions,variant:face*19+j});
       instance(pan.body,'eaveCeramic272');instance(pan.lip,'eaveCeramicLip272');
     }
     for(const cornerSign of[-1,1]){
       const pan=createDripPan272(waistSample,0,0,0,{...panOptions,cornerSign,variant:face*19+cornerSign});
       instance(pan.body,'eaveCeramic272');instance(pan.lip,'eaveCeramicLip272');
     }
   });
   for(const sx of[-1,1])for(const sz of[-1,1]){
     const angle=Math.atan2(sx,sz),corner=new T.Vector3(sx*outer,y+.19*s,sz*outer);
     group(...corner.toArray(),angle,()=>{for(const part of joineryKit.cornerMask)instance(part.geometry,part.material.startsWith('terminal')?part.material:part.material==='oldgold'?'oldgold':'cornerCeramic',0,.005,.012,.72,.72,.72);});
     const path=new T.CatmullRomCurve3([new T.Vector3(sx*inner,y+.37*s,sz*inner),new T.Vector3(sx*(inner+outer)/2,y+.24*s,sz*(inner+outer)/2),corner.clone().add(new T.Vector3(0,.025,0))]);
     instance(closedWire190(path.getPoints(16).map(p=>p.toArray()),.065*s,16,10),'cornerCeramic');
     const start=new T.Vector3(sx*(inner-.10),y+.20*s,sz*(inner-.10)),end=new T.Vector3(sx*(outer+.11),y-.12*s,sz*(outer+.11)),direction=end.clone().sub(start),normal=direction.clone().normalize(),mid=start.clone().add(end).multiplyScalar(.5),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),normal);
     instance('box','red',...mid.toArray(),.19*s,.215*s,direction.length(),q);
     for(const part of endCopper.parts)instance(part.geometry,part.material,...end.clone().addScaledVector(normal,.003).toArray(),.195*s,.220*s,.195*s,q);
   }
 }
 function balcony(w,y,s,deckWidth=w+.72){
   const d=deckWidth+.10,base=y+.29,top=base+.82;
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
     box(0,base,d/2,d+.10,.15,.22,'red');box(0,base+.43,d/2,d+.10,.10,.14,'red');box(0,top,d/2,d+.18,.135,.19,'red');
     for(let i=0;i<=6;i++){
       const x=-d/2+i*d/6;box(x,(top+base)/2,d/2,.105,.95,.105,'red');
       if(i%2===0){instance(new T.LatheGeometry([[0,0],[.06,.015],[.09,.06],[.075,.14],[.025,.18],[0,.18]].map(p=>new T.Vector2(...p)),12),'gold',x,top+.02,d/2);
         for(let k=0;k<8;k++){const a=k*Math.PI/4;instance('sphere','oldgold',x+Math.sin(a)*.067,top+.10,d/2+Math.cos(a)*.067,.020,.074,.020);} arch.squareFitting(x,top-.09,d/2+.099,.085,.085,0,true);}
     }
   });
 }
 function lantern(x,y,z,s,beamAnchors){
   group(x,y,z,0,()=>{
    for(const part of lantern190.parts)instance(part.geometry,part.material,0,0,0,s,s,s);
    const anchor=beamAnchors.map(p=>new T.Vector3(...p).sub(new T.Vector3(x,y,z))),top=new T.Vector3(0,1.64*s,0);
    for(let i=0;i<anchor.length;i++){
     const a=anchor[i],mid=a.clone().multiplyScalar(.48);mid.y=Math.max(a.y,top.y)+.08*s;
     instance(closedWire190([a.toArray(),mid.toArray(),top.toArray()],(i?.011:.017)*s,32,10),'lanternBronze');
     box(a.x,a.y,a.z,.075*s,.11*s,.075*s,'lanternBronze');
    }
   });
 }
 const daylight196=installDaylight196(scene),{hemi,sun,groundBounce}=daylight196;
 const measuredSky=await installMeasuredSky(scene,sun.position.clone().sub(sun.target.position));
 const canopy=buildMapleCanopy(scene);
 // Flatten static geometry by material: dense joinery remains real 3D but submission cost stays bounded.
 let triangles=0,parts=0;
 for(const [material,inputRecords]of bucket){
   let records=inputRecords;
   const actualCarvings=records.filter(r=>r.geo.userData.licensedCarving220Shared);
   if(actualCarvings.length){
     const batches=new Map();for(const r of actualCarvings){if(!batches.has(r.geo))batches.set(r.geo,[]);batches.get(r.geo).push(r);}
     for(const[geometry,placements]of batches){const mesh=new T.InstancedMesh(geometry,material,placements.length);mesh.name='scene05-source-preserving-wood-carving220-'+material.name;for(const[i,r]of placements.entries()){mesh.setMatrixAt(i,r.matrix);mesh.setColorAt(i,new T.Color().setRGB(r.tint,r.tint,r.tint));}mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);triangles+=(geometry.index?.count??geometry.attributes.position.count)/3*placements.length;parts+=placements.length;}
     records=records.filter(r=>!r.geo.userData.licensedCarving220Shared);if(!records.length)continue;
   }
   const craft275=records.filter(r=>r.geo.userData.ornament275Shared);
   if(craft275.length){
     const batches=new Map();for(const r of craft275){if(!batches.has(r.geo))batches.set(r.geo,[]);batches.get(r.geo).push(r);}
     for(const[geometry,placements]of batches){const mesh=new T.InstancedMesh(geometry,material,placements.length);mesh.name='scene05-shared-solid-castwork275-'+material.name;for(const[i,r]of placements.entries()){mesh.setMatrixAt(i,r.matrix);mesh.setColorAt(i,new T.Color().setRGB(r.tint,r.tint,r.tint));}mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);triangles+=(geometry.index?.count??geometry.attributes.position.count)/3*placements.length;parts+=placements.length;}
     records=records.filter(r=>!r.geo.userData.ornament275Shared);if(!records.length)continue;
   }
   const terminals=records.filter(r=>r.geo.userData.terminal204Shared);
   if(terminals.length){
     const batches=new Map();for(const r of terminals){if(!batches.has(r.geo))batches.set(r.geo,[]);batches.get(r.geo).push(r);}
     for(const[geometry,placements]of batches){const mesh=new T.InstancedMesh(geometry,material,placements.length);mesh.name='scene05-shared-sculpted-terminal204';for(const[i,r]of placements.entries()){mesh.setMatrixAt(i,r.matrix);mesh.setColorAt(i,new T.Color().setRGB(r.tint,r.tint,r.tint));}mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);triangles+=(geometry.index?.count??geometry.attributes.position.count)/3*placements.length;parts+=placements.length;}
     records=records.filter(r=>!r.geo.userData.terminal204Shared);if(!records.length)continue;
   }
   if([mats.fittingCopper,mats.fittingEdge,mats.fittingPatina,mats.rafterCopper220,mats.rafterEdge220,mats.rafterPatina220].includes(material)){
     // These are the SAME closed end-cup templates at many real timber cut
     // planes. Preserve every vertex/normal/UV and actual placement while
     // sharing the template instead of baking ~10.5M duplicate triangles.
     // Timber stays in the metric-UV merge path below.
     const batches=new Map();for(const record of records){if(!batches.has(record.geo))batches.set(record.geo,[]);batches.get(record.geo).push(record);}
     for(const [template,placements]of batches){
       const geometry=template.clone(),mesh=new T.InstancedMesh(geometry,material,placements.length);mesh.name='scene05-shared-solid-'+material.name;
       for(const [i,r]of placements.entries()){mesh.setMatrixAt(i,r.matrix);mesh.setColorAt(i,new T.Color().setRGB(r.tint,r.tint,r.tint));}
       mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
       triangles+=(geometry.index?.count??geometry.attributes.position.count)/3*placements.length;parts+=placements.length;
     }
     continue;
   }
   const pieces=records.map(({geo,matrix,tint,woodTint})=>{
     const g=geo.index?geo.toNonIndexed():geo.clone();
     // Indexed expansion does not retain Three userData. Keep the authored
     // centreline UV contract before selecting the generic straight-member UV.
     g.userData={...geo.userData};
     if(material.userData.metricTimberGrain)assignMetricTimberUV(g,matrix);
     g.applyMatrix4(matrix);
     for(const attr of Object.keys(g.attributes))if(!['position','normal','uv','color','woodCut190','woodEndUv190'].includes(attr))g.deleteAttribute(attr);
     const n=g.attributes.position.count;if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(n*2),2));
     const existing=g.attributes.color,c=new Float32Array(n*3),tone=woodTint||[1,1,1];for(let i=0;i<n;i++){c[i*3]=(existing?existing.getX(i):1)*tint*tone[0];c[i*3+1]=(existing?existing.getY(i):1)*tint*tone[1];c[i*3+2]=(existing?existing.getZ(i):1)*tint*tone[2];}g.setAttribute('color',new T.Float32BufferAttribute(c,3));material.vertexColors=true;material.needsUpdate=true;
     return g;
   });
   const geo=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());if(!geo)throw Error('Unable to merge '+material.name);
   const mesh=new T.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);triangles+=geo.attributes.position.count/3;parts+=records.length;
 }
 const courtyardReflection220=installCourtyardReflection220(scene,renderer,mats);
 return {scene,info:()=>({reference:5,revision:'scene05-eave361-r05-layered-bearing-boots-and-kiln-rounded-medallions',levels,tierSpec:TIER_SPEC,landmarkWorlds,triangles,parts,licensedCarving220:{...licensedCloud.info,mounts:licensedMounts220},detail361:{geometry:'Large projecting bearing heads rebuilt as actual full-floor folded gilded sleeves with distinct recessed/raised/returned closed geometry; smaller inner cut faces retain their observed exposed timber and open scrolls. Rounded thick clay drums with double worn rims and two sculpted flower whorls replace thin eave caps. Dou receivers use separate smooth coves and hard clipped-square corners.',preserved:'All tier/camera/dolly/light/beam/lantern and bearing contact datums retained.',limits:'Authored visible craft interpretation; photographic fidelity unaccepted'},detail275:{lantern:lantern190.info,terminal:mask190.info,hipMetal:endCopper.info,geometry:'Complete castwork/ceramic reconstruction, not changed tessellation or roughness alone. Retains exact lamp/hip attachment transforms, accepted272 roof/apron and camera/DOLLY.',limits:'Visible anatomy interpreted fromHD05; no identity or photographic fidelity acceptance.'},detail272:{eaves:'Closed18.5mm eave rain pans now have90mm concave front bellies behind the cap front plane and closed7.5mm raised lips. The waist roof uses120mm deep physical pans instead of the shallow applied scroll fascia; its hip ridges are closed. Constant-depth corner mitres meet exactly on the shared hip. Broader outer corner curvature changes only t>.82, retaining centre/hip endpoint and inner structural datums. Flying rafters begin at t=.70 as finite wedges on retained main-rafter tops, gaining90mm depth by t=.84; closed deck follows that upper plane.',finish:'Oxide-red and red-brown timber pigments reduce broad orange bias; retained scanned tissue, lights, exposure, tier axes and camera.',limits:'Authored carpentry/ceramic interpretation; photographic fidelity unaccepted'},detail220:{solidRepairR12:{geometry:'Reverse inherited inward branch end caps and leaf edge-strip triangles. All686 branch and3 leaf prototypes are closed, positive-volume and consistently wound after repair; no primary centreline or lamina position changes from R11.',sourceBoundary:'Only foliage cap/rim indices and this scene revision note differ from R11; no new light/material/camera/exposure change.'},repairR11:{finish:'Bearing cheeks use a distinct browner stain from roof rafters. Member-aligned scan tissue retains moderated47–98% variation; role-specific satin reflectance separates weathered posts, raw cuts, stained timber and94% metallic gilt faces. Probe, direct key, courtyard proxy powers and exposure retained.',canopy:'Primary rooted limb endpoints retained; five-point curves have length-scaled bow and rise with real variable taper/ridged sections. Broader overlapping seven-lobed closed leaf meshes replace the narrow radial arrow-like contour.',limits:'Authored canopy and finish interpretation; no claim of reference-specific botanical or historic surface recovery.'},carpentryR10:{arms:'Carved face skins now share the core9mm inset contour, revealing four actual quarter-round edge bands instead of covering the old chamfer with sharp full-profile skins. Original23 arm prototype bounding envelopes and cut positions retained; real4mm carving recesses retained.',wood:'CC0 scan luminance modulation narrowed from.22–.94 to.62–.98 under role-specific translucent stains. Fine fibres, checks, latewood cuts and scanned normal/roughness remain.',prefiltering:'Both sunless measured sky and actual local6-face cube explicitly PMREM-filtered outside material draws; hardware active samplers are recorded in every native report.'},carpentryR09:{window:'Closed264mm-deep annular rebated surround,152mm-deep eased/crowned vertical bones with26mm shoulder tenons, actual53mm rear half-laps and seated transverse bones; backing front recessed from100mm to222mm. Existing window and carving centres retained.',head:'Real eased and crowned continuous header with24mm raised free heads; obsolete full-face applied red strip removed. Individually recessed vertical transom boarding and eased intermediate stiles.',light:'Actual solid-angle-integrated measured low-sky sectors cast2 near geometry shadow maps; original sun, courtyard spot positions/powers and exposure retained. Same6-face local radiance capture now supplies restrained.22 wood irradiance as well as metal reflections. Screen AO contact radius reduced from.38m to.16m.',limits:'Finite2-sector near sky and one local raster probe are approximations, not measured recovered GI. New timber anatomy is authored from visible reference contours.'},handworkR07:{eaves:'Main/flying widths and eased arrises vary by member; both layers share the same gentle lateral hand bow and endpoint mounts. Primary heights and bearing planes retained.',ceramics:'Cover and rain-pan seams are independently phased, overlapped and staggered. Finite skewed cut ends, pressed radius/width/thickness variations and worn kiln pigment replace coincident uniform checker seams.',reflection:'An actual finite stone courtyard and existing temple/foliage are captured to a128px6-face linear HDR local probe inside the native render. Explicit material envMap is required because this renderer replaces envMapIntensity with scene.environmentIntensity when material.envMap is null.',limits:'One bounded local reflection capture, not physical GI or cross-renderer/Cycles material equivalence.'},sculptingR05:{arms:'Broad-cheek ogee free lengths are hollowed up to70mm locally; actual4mm cut channels in closed timber skins expose a darker solid wood core. Applied generic gold hooks are removed.',longHip:'Recurved free length after t=.34 and actual double-cove cross sections; original endpoints and lantern anchor seats retained.',metal:'R06 repairs R05 flat etching and coarse six-hole collar: low ribbed repousse petals and real chased gaps form the large coffered rosette; fine open curled ribbons form each wider narrow strap, with incised veins, thin border and struck fasteners. Main hip boots now fit the actual timber section and have longer worked returns.',wood:'Independent deep cinnabar/red-brown/raw-end stains, muted weathered red-gray piers, per-member ageing tones and roughness, eccentric latewood endgrain and radial checks.',historicalStatus:'Visible anatomical reconstruction from HD05, not recovered historic carving or a scan attribution.'},capitalTransform:{previousVertical:1.62954148,currentVertical:TIER_SPEC.bearingVerticalScale,purlinRoofAndTierAnchorsRetained:true,shaftAndWindowHeadRecomputedFromBearing:true},cornerDiagonal:'Independent closed hip kneeler rotated toward each actual corner with two real seats under crossing upper arms',bayGirts:'Two closed small-section lengths between each pair of bearing-block cheek faces',secondaryMetal:[secondary190.info,secondary220.info],eaveSections:'Closed finite-end sweeps, exact section-edge normals, narrow arrises and actual shallow side chases; no rounded-box lighting substitute',roofStack:{mainSection:[.100,.170],upperSection:[.074,.090],upperCentreNormalOffset:.130,boardBottomNormalOffset:.175,boardTopNormalOffset:.202,boardNormalThickness:.027,boardSeamM:.0018,primaryCentresAndPurlinAnchorsRetained:true,actualPurlinBirdsmouth:true,ringPurlins:'All three continuous ring sections derive their upper centre curve from the actual main-rafter lower plane; previous54–130mm buried intersections removed, with submillimetre sampled bed error before native review.',construction:'Closed upper narrow rafters have a long real overlap on the main rafter top and continue beyond its outer cut. Individual closed27mm roof boards sit on their upper plane. Inner hidden construction remains a bounded hypothesis.'},windowSurfaces:'Metric scanned tissue aligned to actual gray-green bars, subtle independent bar staining, brighter recessed receiver and private matte warm narrow-rafter cuts; no new scanned or photograph assets.',windowHeads:'Applied14mm frieze follows frame.windowHeaderY at the actual front face; central carved panel and split bars share frame.windowCenterY. The r02 hard-coded tie regression is retained in its source/render receipt.',limits:'Hypothesised joinery and metal motifs; photographic fidelity remains unaccepted'},terminal204:mask190.info,detail196:{bearing:primary196.info,lighting:daylight196.info,contactDatumsUnchanged:false,changedDatums204:{rafterEndCaps:'Flying cut centre +10mm and main cut centre +20mm now match actual generated timber centreline',postSection:'Square nominal width increased .47 to .56m about retained post axes',windowHead:'Roofed-room head now follows actual shaftTop minus .21m; occupied lower room retains its explicit floor-bearing datum',ceramicMounts:mask190.info.changedMounts}},detail190:{hip:'Closed double-cove loft with a free-length recurve after t=.34; original endpoint cut planes and lantern seats retained; thin pierced straps on two actual ranks',lantern:lantern190.info,mask:mask190.info,secondaryCopper:secondary190.info,contactDatumsUnchanged:true},geometry:'Retained measured concentric storeys and compact same-story waist; concave-neck closed receivers preserve flat bearing datums; exposed narrow-foot free noses and fitted copper196; inset arm arrises; folded chrysanthemum sleeves and worked returns; pierced acanthus collars; shallow checks in closed piers; darker raked hip members with actual 3D path arclength grain; one physical low frustum',joineryKit:joineryKit.info,timber:scannedTimber.info,lighting:{localReflection220:courtyardReflection220.info,sunPosition:sun.position.toArray(),sunIntensity:sun.intensity,sunColor:'#fff0d8',hierarchy196:daylight196.info,courtyardBounce:groundBounce.intensity,courtyardBounceType:'unequal finite inverse-square shadow-casting courtyard patches',courtyardBounceCastsShadows:true,hemisphere:hemi.intensity,environmentIntensity:scene.environmentIntensity,measuredSky:measuredSky.info,limits:'Measured CC0 sky/metal radiance with inferred native direct key and finite shadow-casting inverse-square courtyard proxy; not measured GI'},canopy,cameraHeightRange:[.72,.80]}),dispose(){scene.traverse(o=>{o.geometry?.dispose();});Object.values(mats).forEach(m=>m.dispose());joineryKit.dispose();scannedTimber.dispose();measuredSky.dispose();licensedCloud.dispose();courtyardReflection220.dispose();copperFinish.dispose();copperAlbedo.dispose();}};
}
