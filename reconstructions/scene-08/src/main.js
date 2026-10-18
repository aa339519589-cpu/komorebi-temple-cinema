import * as T from 'three';
import {buildScene} from './scene.js';
import {createCameraPass} from './post.js';
const Q=new URLSearchParams(location.search),w=Math.min(2048,+(Q.get('w')||768)),h=Math.min(2048,+(Q.get('h')||768));
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(w,h);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;document.body.append(renderer.domElement);
const {scene,stats,dispose}=buildScene(),camera=new T.PerspectiveCamera(49,w/h,.06,180);
const cameraPass=createCameraPass(renderer,w,h);
const reference={position:[0,2.65,13],target:[0,6.65,-9],fov:49};
function renderView(position,target,time=0,fov=49){camera.position.fromArray(position);camera.fov=fov;camera.lookAt(...target);camera.updateProjectionMatrix();scene.updateMatrixWorld(true);cameraPass.render(scene,camera);return {position,target,time,fov};}
function renderReference(n=8){if(n!==8)throw Error('Independent reference 08');return renderView(reference.position,reference.target,0,reference.fov);}
function renderShot(time=0){const t=T.MathUtils.clamp(time/7,0,1),s=t*t*(3-2*t);return renderView([-.6+.6*s,2.1+.55*s,9.2+3.8*s],[-1.25+1.25*s,3.8+2.85*s,-7-2*s],time,49);}
window.temple={ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info:()=>({reference:8,revision:'08-veranda-garden-r8',...stats,camera:reference,renderer:cameraPass.info()}),dispose(){cameraPass.dispose();dispose();renderer.dispose();}};
if(!Q.has('defer'))renderReference();
