import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import * as T from 'three';
import {buildReference4Scene} from './reference4-scene.js';
import {reference4Config as C} from './reference4-config.js';
const query=new URLSearchParams(location.search),size=k=>Math.min(2048,Math.max(64,Number(query.get(k))||960));
const width=size('w'),height=size('h');
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(width,height);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=C.lighting.exposure;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.info.autoReset=false;
document.querySelector('#stage').appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(C.camera.fov,width/height,C.camera.near,C.camera.far);
const world=buildReference4Scene();world.initializeEnvironment(renderer);let frames=0;
class SurfaceContactAO extends GTAOPass{
 _renderOverride(...args){const hidden=[];world.scene.traverse(o=>{if(o.visible&&((o.isMesh&&(o.material?.alphaTest>0||o.material?.transparent))||o===world.sky||o===world.distantForest.group)){hidden.push(o);o.visible=false;}});try{return super._renderOverride(...args);}finally{hidden.forEach(o=>o.visible=true);}}
}
const composer=new EffectComposer(renderer);composer.renderTarget1.samples=4;composer.renderTarget2.samples=4;composer.setSize(width,height);composer.addPass(new RenderPass(world.scene,camera));
const contactAO=new SurfaceContactAO(world.scene,camera,width,height,undefined,{radius:.25,thickness:.12,distanceExponent:1,distanceFallOff:.65},{radius:3,lumaPhi:8,depthPhi:3,normalPhi:4});contactAO.blendIntensity=.48;composer.addPass(contactAO);composer.addPass(new OutputPass());

function draw(){world.scene.updateMatrixWorld(true);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);renderer.setRenderTarget(null);renderer.info.reset();composer.render(0);frames++;return{reference:4,revision:C.revision,width,height,frame:frames,camera:{position:camera.position.toArray(),fov:camera.fov}};}
function renderReference(n=4){if(n!==4)throw new RangeError('Scene 04 contains reference 4.');camera.position.fromArray(C.camera.position);camera.fov=C.camera.fov;camera.lookAt(...C.camera.target);return draw();}
function renderView(position,target,time=0,fov=C.camera.fov){camera.position.fromArray(position);camera.fov=fov;camera.lookAt(...target);return draw();}
function renderInspection(kind){const poses={floor:{p:[0,.65,19.5],t:[.15,.045,17.6],fov:58},eaves:{p:[0,5.8,11.5],t:[0,8.7,.5],fov:46},lantern:{p:[-4.8,1.65,18],t:[-3.6,1.75,14.5],fov:55}};const q=poses[kind];if(!q)throw Error('Unknown inspection '+kind);return renderView(q.p,q.t,0,q.fov);}
function renderShot(localTime=0){const inspections={[-104]:'floor',[-105]:'eaves',[-106]:'lantern'};if(inspections[localTime])return renderInspection(inspections[localTime]);const t=T.MathUtils.clamp(localTime/7,0,1),u=t*t*(3-2*t),start=new T.Vector3(-1.15,1.05,15.5),end=new T.Vector3(...C.camera.position);camera.position.copy(start.lerp(end,u));camera.fov=T.MathUtils.lerp(57,C.camera.fov,u);const target=new T.Vector3(.2,3.7,-1).lerp(new T.Vector3(...C.camera.target),u);camera.lookAt(target);return draw();}
function surfaceAudit(){const seen=new Set(),out=[];world.scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m?.userData.maps||seen.has(m))continue;seen.add(m);const data=m.normalMap.image.data;let lo=255,hi=0;for(let i=0;i<data.length;i+=4){lo=Math.min(lo,data[i],data[i+1]);hi=Math.max(hi,data[i],data[i+1]);}out.push({name:m.name,albedoSize:[m.map.image.width,m.map.image.height],normalXYByteRange:[lo,hi],physicalRepeatMetres:.25,materialMap:m.map.uuid,compiledUniformMap:m.userData.compiledShader?.uniforms.map?.value?.uuid??null,shaderCompiled:!!m.userData.compiledShader});}});return out;}
function info(){return{surfaceAudit:surfaceAudit(),...world.info(),camera:{position:camera.position.toArray(),fov:camera.fov,reference:C.camera},renderer:{triangles:renderer.info.render.triangles,calls:renderer.info.render.calls},shot:{duration:7,eyeHeight:[1.05,C.camera.position[1]],automaticAnimation:false},surfaceScale:{stoneRepeatMetres:.25,pavingThicknessMetres:.075,jointMetres:.024},contactAO:{radiusMetres:.25,blend:.48,alphaCardsExcludedFromDepth:true}};}
function dispose(){world.architecture.dispose();world.garden.dispose();world.scene.traverse(o=>{if(o.isMesh){o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m?.dispose();}});composer.dispose();contactAO.dispose();renderer.dispose();}
window.temple={ready:true,renderer,scene:world.scene,camera,renderReference,renderView,renderShot,renderInspection,info,dispose};
document.querySelector('#loading')?.remove();if(!query.has('defer'))renderReference(4);
