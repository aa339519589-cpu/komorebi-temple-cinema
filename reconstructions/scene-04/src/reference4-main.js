import * as T from 'three';
import {buildReference4Scene} from './reference4-scene.js';
import {reference4Config as C} from './reference4-config.js';
const query=new URLSearchParams(location.search),size=k=>Math.min(2048,Math.max(64,Number(query.get(k))||960));
const width=size('w'),height=size('h');
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(width,height);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=C.lighting.exposure;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
document.querySelector('#stage').appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(C.camera.fov,width/height,C.camera.near,C.camera.far);
const world=buildReference4Scene();world.initializeEnvironment(renderer);let frames=0;
function draw(){world.scene.updateMatrixWorld(true);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);renderer.setRenderTarget(null);renderer.render(world.scene,camera);frames++;return{reference:4,revision:C.revision,width,height,frame:frames,camera:{position:camera.position.toArray(),fov:camera.fov}};}
function renderReference(n=4){if(n!==4)throw new RangeError('Scene 04 contains reference 4.');camera.position.fromArray(C.camera.position);camera.fov=C.camera.fov;camera.lookAt(...C.camera.target);return draw();}
function renderView(position,target,time=0,fov=C.camera.fov){camera.position.fromArray(position);camera.fov=fov;camera.lookAt(...target);return draw();}
function renderShot(localTime=0){const t=T.MathUtils.clamp(localTime/7,0,1),u=t*t*(3-2*t),start=new T.Vector3(-1.15,1.05,15.5),end=new T.Vector3(...C.camera.position);camera.position.copy(start.lerp(end,u));camera.fov=T.MathUtils.lerp(57,C.camera.fov,u);const target=new T.Vector3(.2,3.7,-1).lerp(new T.Vector3(...C.camera.target),u);camera.lookAt(target);return draw();}
function info(){return{...world.info(),camera:{position:camera.position.toArray(),fov:camera.fov,reference:C.camera},renderer:{triangles:renderer.info.render.triangles,calls:renderer.info.render.calls},shot:{duration:7,eyeHeight:[1.05,C.camera.position[1]],automaticAnimation:false}};}
function dispose(){world.architecture.dispose();world.garden.dispose();world.scene.traverse(o=>{if(o.isMesh){o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m?.dispose();}});renderer.dispose();}
window.temple={ready:true,renderer,scene:world.scene,camera,renderReference,renderView,renderShot,info,dispose};
document.querySelector('#loading')?.remove();if(!query.has('defer'))renderReference(4);
