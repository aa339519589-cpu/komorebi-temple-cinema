import * as T from 'three';
import {buildReference4Scene} from './reference4-scene.js';
import {reference4Config as C} from './reference4-config.js';
import {installRestorationRenderDiagnostics} from './restoration-render-diagnostics.js';
const query=new URLSearchParams(location.search),size=k=>Math.min(2048,Math.max(64,Number(query.get(k))||960));
const width=size('w'),height=size('h');
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
const diagnostics=installRestorationRenderDiagnostics(renderer);window.templeDiagnostics={snapshot:diagnostics.snapshot};
renderer.setPixelRatio(1);renderer.setSize(width,height);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=C.lighting.exposure;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
document.querySelector('#stage').appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(C.camera.fov,width/height,C.camera.near,C.camera.far);camera.position.fromArray(C.camera.position);camera.lookAt(...C.camera.target);camera.updateMatrixWorld(true);
let world;try{world=diagnostics.run('reference4-exterior-build',()=>buildReference4Scene());diagnostics.run('reference4-environment-capture',()=>world.initializeEnvironment(renderer));}catch(e){renderer.dispose();throw e;}
let frames=0;
function renderReference(reference=4){if(reference!==4)throw new RangeError('This independent scene contains reference 4 only.');return diagnostics.run('reference4-full-render',()=>{world.scene.updateMatrixWorld(true);renderer.render(world.scene,camera);frames++;return{reference,revision:C.revision,width,height,frame:frames,camera:{position:camera.position.toArray(),target:C.camera.target,fov:camera.fov},quality:'actual-three-dimensional-scene',validation:'GPU diagnostics and visual comparison are separate; no visual acceptance asserted.'};});}
function info(){return{...world.info(),renderer:{triangles:renderer.info.render.triangles,calls:renderer.info.render.calls},diagnostics:diagnostics.snapshot()};}
window.temple={renderer,renderReference,info,getRenderDiagnostics:diagnostics.snapshot};
document.querySelector('#loading')?.remove();if(!query.has('defer'))renderReference(4);
