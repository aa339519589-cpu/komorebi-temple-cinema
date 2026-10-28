import * as T from 'three';
import {buildScene,CAMERA} from './scene.js';
import {createOptics} from './optics.js';
import {createDollyPath} from './dolly-path.js';
import {renderStairContact124} from './contact-inspection124.js';
import {renderStructure208} from './bridge-court208.js';
const query=new URLSearchParams(location.search),dim=k=>Math.min(2048,Math.max(64,Number(query.get(k))||768)),width=dim('w'),height=dim('h');
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance',alpha:false});renderer.setPixelRatio(1);renderer.setSize(width,height);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.setClearColor(0x2c2316,1);document.body.appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(CAMERA.fov,width/height,CAMERA.near,CAMERA.far);const world=await buildScene({width,height});world.initializeEnvironment(renderer);
// Both fixed directional-light maps were rendered by the real six-face
// environment capture. Geometry and lights stay static; camera, reflection,
// ripple shading and every native color frame continue to render normally.
const staticShadowMaps=[];world.scene.traverse(o=>{if(o.isLight&&o.castShadow){if(!o.shadow?.map)throw new Error('Static shadow map was not initialized: '+o.type);staticShadowMaps.push({name:o.name||o.type,type:o.type,initialized:true});}});
if(staticShadowMaps.length!==5)throw new Error('Expected the fixed solar map and four finite courtyard shadow maps');
renderer.shadowMap.autoUpdate=false;
const optics=createOptics(renderer,width,height,camera,{worldScene:world.scene,reflectors:[world.water]});renderer.info.autoReset=false;let frames=0,disposed=false;
function setCamera(position,target,fov){camera.position.fromArray(position);camera.userData.focusDistance=new T.Vector3(...position).distanceTo(new T.Vector3(...target));camera.fov=fov;camera.aspect=width/height;camera.lookAt(...target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);}
function render(time=0){if(disposed)throw Error('Scene is disposed');world.setTime(time);world.scene.updateMatrixWorld(true);renderer.info.reset();optics.render(world.scene,camera);frames++;return{reference:1,frame:frames,width,height,camera:{position:camera.position.toArray(),fov:camera.fov},triangles:renderer.info.render.triangles,calls:renderer.info.render.calls};}
function renderReference(n=1){if(n!==1)throw new RangeError('Independent reconstruction supports reference 01 only');setCamera(CAMERA.position,CAMERA.target,CAMERA.fov);return render(0);}
function renderView(position,target,time=0,fov=CAMERA.fov){if(!Array.isArray(position)||!Array.isArray(target)||position.length!==3||target.length!==3||![...position,...target,time,fov].every(Number.isFinite))throw new TypeError('Finite camera and target arrays are required');setCamera(position,target,fov);return render(time);}
// Low380: the physical veranda walking surface is Y1.8. The complete
// 7-second rail stays 0.80–0.98m above it and on the deck side of the
// balustrade. Its top rail is Y2.595: the eye clears that solid rail,
// while a gently rising sightline keeps the temple/finial above it.
// Fixed59-degree optics and a1.88m physical retreat give a true3D pullback.
const dolly=createDollyPath({points:[[-.8,2.60,16.25],[-.9,2.62,16.7],[-.1,2.72,17.3],[.45,2.78,17.5]],nearTarget:[-.11444479342937874,2.82,15.286643668267336],farTarget:CAMERA.target,fov:CAMERA.fov});
function renderShot(localTime=0){if(localTime===-209)return renderStructure208(world.scene,renderView,'plan');if(localTime===-208)return renderStructure208(world.scene,renderView,'side');if(localTime===-125)return renderReference(1);if(localTime===-124)return renderStairContact124(world.scene,renderView);if(localTime===-131)return{...renderView([-2.55,7.12,10.9],[-3.53,7.1,8.35],0,50),inspection:{kind:'hardware131-actual-camera-close-view',scope:'Physical close camera on the existing hexagonal lantern; full scene and actual geometry/materials retained.',visualAccepted:false}};const p=dolly(localTime);setCamera(p.position,p.target,p.fov);return render(localTime);}
window.temple={ready:true,renderer,scene:world.scene,camera,renderReference,renderView,renderShot,info:()=>({...world.info(),frames,optics353:optics.info,renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,staticShadowMaps,toneMapping:renderer.toneMapping,toneMappingExposure:renderer.toneMappingExposure,outputColorSpace:renderer.outputColorSpace}}),dispose(){if(disposed)return;disposed=true;optics.dispose();world.dispose();renderer.dispose();renderer.domElement.remove();}};setCamera(CAMERA.position,CAMERA.target,CAMERA.fov);document.getElementById('loading')?.remove();if(!query.has('defer'))renderReference(1);
