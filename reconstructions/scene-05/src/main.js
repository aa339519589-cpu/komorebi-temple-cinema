import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {buildScene,POSE} from './scene.js';
const q=new URLSearchParams(location.search),dim=k=>Math.max(64,Math.min(2048,Number(q.get(k))||768));
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(dim('w'),dim('h'));renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
document.querySelector('#stage').append(renderer.domElement);
const world=buildScene(),scene=world.scene;
const camera=new T.PerspectiveCamera(POSE.fov,dim('w')/dim('h'),.08,200);
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const contactAO=new GTAOPass(scene,camera,dim('w'),dim('h'));contactAO.updateGtaoMaterial({radius:.48,distanceExponent:2,thickness:.38,distanceFallOff:1});contactAO.blendIntensity=.72;
composer.addPass(contactAO);composer.addPass(new OutputPass());renderer.info.autoReset=false;
function setPose(position,target,fov){camera.position.fromArray(position);camera.fov=fov;camera.lookAt(...target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);}
function draw(){scene.updateMatrixWorld(true);renderer.info.reset();renderer.setRenderTarget(null);composer.render(0);renderer.setRenderTarget(null);return {camera:camera.position.toArray(),fov:camera.fov,triangles:renderer.info.render.triangles,calls:renderer.info.render.calls};}
function renderReference(n=5){if(n!==5)throw new RangeError('Scene 05 only');setPose(POSE.position,POSE.target,POSE.fov);return draw();}
function renderView(position,target,time=0,fov=POSE.fov){setPose(position,target,fov);return draw();}
function renderShot(localTime=0){const t=T.MathUtils.clamp(localTime/7,0,1),s=t*t*(3-2*t);const mix=(a,b)=>a.map((v,i)=>T.MathUtils.lerp(v,b[i],s));setPose(mix([6.3,.72,8.6],POSE.position),mix([4.2,7.2,4.2],POSE.target),T.MathUtils.lerp(46,POSE.fov,s));return draw();}
window.temple={ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info:()=>({...world.info(),renderer:renderer.info.render,referencePose:POSE}),dispose(){world.dispose();contactAO.dispose();composer.dispose();renderer.dispose();}};
if(!q.has('defer'))renderReference();
