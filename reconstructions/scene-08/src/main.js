import {createDollyPath} from '/reconstructions/camera-dolly.js';
import * as T from 'three';
import {buildScene} from './scene.js';
import {createCameraPass} from './post.js';
const Q=new URLSearchParams(location.search),w=Math.min(2048,+(Q.get('w')||768)),h=Math.min(2048,+(Q.get('h')||768));
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(w,h);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;document.body.append(renderer.domElement);
const {scene,stats,dispose,setTime}=await buildScene(),camera=new T.PerspectiveCamera(49,w/h,.06,180);
const cameraPass=createCameraPass(renderer,w,h);
const reference={position:[0,1.78,13],target:[0,6.10,-9],fov:49};
function renderView(position,target,time=0,fov=49){setTime(time);camera.position.fromArray(position);camera.userData.focusDistance=new T.Vector3(...position).distanceTo(new T.Vector3(...target));camera.fov=fov;camera.lookAt(...target);camera.updateProjectionMatrix();scene.updateMatrixWorld(true);cameraPass.render(scene,camera);return {position,target,time,fov};}
function renderReference(n=8){if(n!==8)throw Error('Independent reference 08');return renderView(reference.position,reference.target,0,reference.fov);}
const dolly=createDollyPath({points:[[-.6,1.86,9.25],[-.45,1.90,10.2],[-.1,1.84,11.65],reference.position],nearTarget:[-1.99,3.3,7.9],farTarget:reference.target,fov:reference.fov});
function renderShot(localTime=0){const p=dolly(localTime);return renderView(p.position,p.target,localTime,p.fov);}
window.temple={ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info:()=>({reference:8,revision:'08-code-only-composition-route136',...stats,camera:reference,renderer:cameraPass.info()}),dispose(){cameraPass.dispose();dispose();renderer.dispose();}};
if(!Q.has('defer'))renderReference();
