import {createDollyPath} from '/reconstructions/camera-dolly.js';
import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {buildScene,POSE} from './scene.js';
import {DOLLY} from './tier-layout.js';
const q=new URLSearchParams(location.search),dim=k=>Math.max(64,Math.min(2048,Number(q.get(k))||768));
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(dim('w'),dim('h'));renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
document.querySelector('#stage').append(renderer.domElement);
const world=await buildScene(),scene=world.scene;
const camera=new T.PerspectiveCamera(POSE.fov,dim('w')/dim('h'),.08,200);
const composerTarget=new T.WebGLRenderTarget(dim('w'),dim('h'),{type:T.HalfFloatType,samples:4});
const composer=new EffectComposer(renderer,composerTarget);composer.addPass(new RenderPass(scene,camera));
const contactAO=new GTAOPass(scene,camera,dim('w'),dim('h'));contactAO.updateGtaoMaterial({radius:.38,distanceExponent:2,thickness:.32,distanceFallOff:1,samples:32});contactAO.blendIntensity=.45;contactAO.updatePdMaterial({radius:5,samples:24,lumaPhi:6,depthPhi:2,normalPhi:3});
composer.addPass(contactAO);composer.addPass(new OutputPass());renderer.info.autoReset=false;
function setPose(position,target,fov){camera.position.fromArray(position);camera.fov=fov;camera.lookAt(...target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);}
function draw(){scene.updateMatrixWorld(true);renderer.info.reset();renderer.setRenderTarget(null);composer.render(0);renderer.setRenderTarget(null);return {camera:camera.position.toArray(),fov:camera.fov,triangles:renderer.info.render.triangles,calls:renderer.info.render.calls};}
function renderReference(n=5){if(n!==5)throw new RangeError('Scene 05 only');setPose(POSE.position,POSE.target,POSE.fov);return draw();}
function renderView(position,target,time=0,fov=POSE.fov){setPose(position,target,fov);return draw();}
const dolly=createDollyPath(DOLLY);
function renderShot(localTime=0){const p=dolly(localTime);return renderView(p.position,p.target,localTime,p.fov);}
window.temple={ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info:()=>({...world.info(),renderer:renderer.info.render,referencePose:POSE}),dispose(){world.dispose();contactAO.dispose();composer.dispose();renderer.dispose();}};
if(!q.has('defer'))renderReference();
