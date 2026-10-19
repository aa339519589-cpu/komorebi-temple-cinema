import {createDollyPath} from '/reconstructions/camera-dolly.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import * as T from 'three';
import {buildReference4Scene} from './reference4-scene.js';
import {reference4Config as C} from './reference4-config.js';
import {loadScannedStoneMaps} from './scene04-scanned-stone.js';
import {loadTracedStoneMaps04} from './traced-stone-material04.js';
import {loadReference4ForegroundScans} from './reference4-foreground-scans.js';
await Promise.all([loadScannedStoneMaps(),loadTracedStoneMaps04(),loadReference4ForegroundScans()]);
const query=new URLSearchParams(location.search),size=k=>Math.min(2048,Math.max(64,Number(query.get(k))||960));
const width=size('w'),height=size('h');
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(width,height);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=C.lighting.exposure;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.info.autoReset=false;
document.querySelector('#stage').appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(C.camera.fov,width/height,C.camera.near,C.camera.far);
const world=buildReference4Scene();world.initializeEnvironment(renderer);let frames=0;
// Initialization captures temporarily hide receivers. Only a later complete
// beauty frame may establish the static, fixed-light-space shadow cache.
let shadowCacheEnabled=true,shadowCacheFrozen=false,shadowCacheFirstBeautyFrame=null;
let shadowProfileRequest=null,shadowProfileActive=null,shadowProfileLast=null,shadowRenderPhase='beauty';
const renderShadowMaps=renderer.shadowMap.render;
renderer.shadowMap.render=function(...args){
 if(!shadowProfileActive)return renderShadowMaps.apply(this,args);
 const gl=renderer.getContext();gl.finish();
 const start=performance.now(),triangles=renderer.info.render.triangles,calls=renderer.info.render.calls,autoUpdate=this.autoUpdate,needsUpdate=this.needsUpdate;
 const result=renderShadowMaps.apply(this,args);gl.finish();
 shadowProfileActive.shadowInvocations.push({phase:shadowRenderPhase,autoUpdate,needsUpdate,triangles:renderer.info.render.triangles-triangles,calls:renderer.info.render.calls-calls,gpuSynchronizedMs:performance.now()-start});
 return result;
};
class SurfaceContactAO extends GTAOPass{
 _renderOverride(...args){
  const hidden=[],shadow=renderer.shadowMap,autoUpdate=shadow.autoUpdate,needsUpdate=shadow.needsUpdate,phase=shadowRenderPhase;
  world.scene.traverse(o=>{if(o.visible&&((o.isMesh&&(o.material?.alphaTest>0||o.material?.transparent))||o===world.sky||o===world.distantForest.group)){hidden.push(o);o.visible=false;}});
  // NormalMaterial uses no shadow sampling. needsUpdate can override autoUpdate,
  // so suppress both only for this reduced-visibility pass, then restore both.
  if(shadowCacheEnabled){shadow.autoUpdate=false;shadow.needsUpdate=false;}
  shadowRenderPhase='ao-normal';
  try{return super._renderOverride(...args);}
  finally{hidden.forEach(o=>o.visible=true);shadow.autoUpdate=autoUpdate;shadow.needsUpdate=needsUpdate;shadowRenderPhase=phase;}
 }
}
const composer=new EffectComposer(renderer);composer.renderTarget1.samples=4;composer.renderTarget2.samples=4;composer.setSize(width,height);composer.addPass(new RenderPass(world.scene,camera));
const contactAO=new SurfaceContactAO(world.scene,camera,width,height,undefined,{radius:.25,thickness:.12,distanceExponent:1,distanceFallOff:.65},{radius:3,lumaPhi:8,depthPhi:3,normalPhi:4});contactAO.blendIntensity=.48;composer.addPass(contactAO);composer.addPass(new OutputPass());

function shadowMapSnapshot(){return{map:world.sun.shadow.map?.texture.uuid??null,matrix:world.sun.shadow.matrix.toArray(),cameraLayers:camera.layers.mask};}
function draw(){
 world.scene.updateMatrixWorld(true);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);renderer.setRenderTarget(null);renderer.info.reset();
 if(shadowCacheEnabled&&!shadowCacheFrozen){renderer.shadowMap.autoUpdate=true;renderer.shadowMap.needsUpdate=true;}
 const profiling=shadowProfileRequest!==null,gl=renderer.getContext();
 if(profiling){gl.finish();shadowProfileActive={mode:shadowProfileRequest,frame:frames+1,shadowInvocations:[],before:shadowMapSnapshot()};}
 const start=profiling?performance.now():0;
 composer.render(0);
 if(shadowCacheEnabled){
  if(!world.sun.shadow.map)throw Error('A complete beauty-frame shadow map is required before freezing.');
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
  if(!shadowCacheFrozen)shadowCacheFirstBeautyFrame=frames+1;
  shadowCacheFrozen=true;
 }
 frames++;
 if(profiling){
  gl.finish();Object.assign(shadowProfileActive,{gpuSynchronizedFrameMs:performance.now()-start,triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,after:shadowMapSnapshot(),cacheFrozenAfter:shadowCacheFrozen,shadowAutoUpdateAfter:renderer.shadowMap.autoUpdate,shadowNeedsUpdateAfter:renderer.shadowMap.needsUpdate});
  shadowProfileLast=shadowProfileActive;shadowProfileActive=null;
 }
 return{reference:4,revision:C.revision,width,height,frame:frames,camera:{position:camera.position.toArray(),fov:camera.fov}};
}
function renderReference(n=4){if(n!==4)throw new RangeError('Scene 04 contains reference 4.');camera.position.fromArray(C.camera.position);camera.fov=C.camera.fov;camera.lookAt(...C.camera.target);return draw();}
function renderView(position,target,time=0,fov=C.camera.fov){camera.position.fromArray(position);camera.fov=fov;camera.lookAt(...target);return draw();}
function renderInspection(kind){const poses={floor:{p:[0,.65,19.5],t:[.15,.045,17.6],fov:58},eaves:{p:[0,5.8,11.5],t:[0,8.7,.5],fov:46},lantern:{p:[-4.8,1.65,18],t:[-3.6,1.75,14.5],fov:55},stairsSide:{p:[8,10,16],t:[0,5.5,-1],fov:64}};const q=poses[kind];if(!q)throw Error('Unknown inspection '+kind);return renderView(q.p,q.t,0,q.fov);}
const dolly=createDollyPath({points:[[0,.55,20.4],[.08,.62,21.4],[.1,1.10,22.4],C.camera.position],nearTarget:[0,.05,18.8],farTarget:C.camera.target,fov:C.camera.fov});
function renderShot(localTime=0){
 // Three bounded QA stills through the existing shared renderer, never a film
 // path change: original reference, cached reference, existing dolly at t=6.
 const profiles={[-11040]:'legacy-reference',[-11041]:'cached-first-reference',[-11042]:'cached-moving-t6'};
 if(profiles[localTime]){
  const prior=shadowCacheEnabled;shadowProfileRequest=profiles[localTime];
  if(localTime===-11040){shadowCacheEnabled=false;shadowCacheFrozen=false;renderer.shadowMap.autoUpdate=true;renderer.shadowMap.needsUpdate=false;}
  try{return localTime===-11042?renderShot(6):renderReference(4);}
  finally{shadowCacheEnabled=prior;shadowProfileRequest=null;}
 }
 // Negative values select bounded QA poses only; the seven-second dolly is unchanged.
 const inspections={[-104]:'floor',[-105]:'eaves',[-106]:'lantern',[-121]:'stairsSide'};if(inspections[localTime])return renderInspection(inspections[localTime]);const p=dolly(localTime);return renderView(p.position,p.target,localTime,p.fov);
}
function surfaceAudit(){const seen=new Set(),out=[];world.scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m?.userData.maps||seen.has(m))continue;seen.add(m);const data=m.normalMap.image.data||[];let lo=data.length?255:null,hi=data.length?0:null;for(let i=0;i<data.length;i+=4){lo=Math.min(lo,data[i],data[i+1]);hi=Math.max(hi,data[i],data[i+1]);}out.push({name:m.name,albedoSize:[m.map.image.width,m.map.image.height],normalXYByteRange:[lo,hi],physicalRepeatMetres:m.userData.physicalTextureRepeatMetres??.25,materialMap:m.map.uuid,compiledUniformMap:m.userData.compiledShader?.uniforms.map?.value?.uuid??null,shaderCompiled:!!m.userData.compiledShader});}});return out;}
function info(){return{surfaceAudit:surfaceAudit(),...world.info(),camera:{position:camera.position.toArray(),fov:camera.fov,reference:C.camera},renderer:{triangles:renderer.info.render.triangles,calls:renderer.info.render.calls},shadowCache:{scope:'Static geometry and fixed world-space directional light; camera motion only',frozen:shadowCacheFrozen,firstCompleteBeautyFrame:shadowCacheFirstBeautyFrame,autoUpdate:renderer.shadowMap.autoUpdate,needsUpdate:renderer.shadowMap.needsUpdate,lastProfile:shadowProfileLast},shot:{duration:7,eyeHeight:[.55,C.camera.position[1]],automaticAnimation:false},surfaceScale:{otherGraniteRepeatMetres:.25,pavingMineralRepeatMetres:.60,observedPavingSlabs:31,authoredRearSlabs:world.garden.records.stoneSlabs.filter(r=>r.id.startsWith("authored-rear-continuation-")).length,pavingThicknessMetres:.14,paverRadialCornerInsetMetres:.015,paverEdgeBevelMetres:.006,authoredPoreDepthMetres:[.00025,.00105],hiddenContinuation:"Authored inference outside the reference view"},contactAO:{radiusMetres:.25,blend:.48,alphaCardsExcludedFromDepth:true}};}
function dispose(){world.architecture.dispose();world.garden.dispose();world.scene.traverse(o=>{if(o.isMesh){o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m?.dispose();}});composer.dispose();contactAO.dispose();renderer.dispose();}
window.temple={ready:true,renderer,scene:world.scene,camera,renderReference,renderView,renderShot,renderInspection,info,dispose};
document.querySelector('#loading')?.remove();if(!query.has('defer'))renderReference(4);
