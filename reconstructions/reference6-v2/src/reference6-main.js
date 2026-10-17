import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {buildReference6Scene,REFERENCE6_FOUNDATION} from './reference6-scene.js';
import {createRestorationScatteringPass} from './restoration-lighting.js';
import {installRestorationRenderDiagnostics} from './restoration-render-diagnostics.js';

const query=new URLSearchParams(location.search),dimension=(key,fallback)=>{const n=Number(query.get(key));return Number.isFinite(n)&&n>=64?Math.min(2048,Math.round(n)):fallback;};
const width=dimension('w',960),height=dimension('h',960);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
const diagnostics=installRestorationRenderDiagnostics(renderer);
window.templeDiagnostics=Object.freeze({snapshot:diagnostics.snapshot});
renderer.setPixelRatio(1);renderer.setSize(width,height);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.setClearColor(0x000000,1);document.body.appendChild(renderer.domElement);
renderer.domElement.style.cssText='display:block;width:100vw;height:100vh;object-fit:contain';
const camera=new T.PerspectiveCamera(REFERENCE6_FOUNDATION.camera.fov,width/height,.06,60);camera.position.fromArray(REFERENCE6_FOUNDATION.camera.position);camera.lookAt(new T.Vector3(...REFERENCE6_FOUNDATION.camera.target));camera.updateMatrixWorld(true);
let room;
try {room=diagnostics.run('reference6-room-build',()=>buildReference6Scene({reflectionSize:768,shadowSize:2048,roomCubeSize:128}));diagnostics.run('reference6-room-environment-capture',()=>room.initializeEnvironment(renderer));}catch(error){renderer.dispose();throw error;}
const {scene,sun}=room;
const depthTarget=new T.WebGLRenderTarget(width,height,{type:T.UnsignedByteType,depthBuffer:true,stencilBuffer:false});depthTarget.depthTexture=new T.DepthTexture(width,height,T.UnsignedIntType);depthTarget.texture.minFilter=depthTarget.texture.magFilter=T.NearestFilter;
const depthMaterial=new T.MeshDepthMaterial({side:T.DoubleSide});depthMaterial.colorWrite=false;
const composer=new EffectComposer(renderer,new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:true,samples:0}));composer.setSize(width,height);composer.addPass(new RenderPass(scene,camera));
const scattering=createRestorationScatteringPass(camera,sun,depthTarget.depthTexture,{density:.022});
const inheritedMask='float room=(1.0-smoothstep(11.0,12.2,abs(p.x-6.0)))*smoothstep(-20.5,-19.6,p.z)*(1.0-smoothstep(-2.2,-1.6,p.z));\n          room*=smoothstep(6.03,6.32,p.y)*(1.0-smoothstep(16.8,17.8,p.y));';
if(scattering.material.fragmentShader.split(inheritedMask).length!==2)throw Error('Pinned scattering mask changed.');
scattering.material.fragmentShader=scattering.material.fragmentShader.replace(inheritedMask,'float room=(1.0-smoothstep(6.65,6.8,abs(p.x)))*smoothstep(-5.8,-5.55,p.z)*(1.0-smoothstep(9.8,10.0,p.z));\n          room*=smoothstep(.02,.10,p.y)*(1.0-smoothstep(7.05,7.2,p.y));');
scattering.material.needsUpdate=true;composer.addPass(scattering);composer.addPass(new OutputPass());
let frame=0;
function renderOpaqueDepth(){
 const oldTarget=renderer.getRenderTarget(),oldAuto=renderer.autoClear,oldOverride=scene.overrideMaterial,oldBackground=scene.background,oldClear=renderer.getClearColor(new T.Color()),oldAlpha=renderer.getClearAlpha();
 const visibility=room.depthExclusions.map(o=>[o,o.visible]);
 try {for(const[o]of visibility)o.visible=false;scene.overrideMaterial=depthMaterial;scene.background=null;renderer.autoClear=true;renderer.setClearColor(0xffffff,1);renderer.setRenderTarget(depthTarget);renderer.clear();renderer.render(scene,camera);}
 finally {for(const[o,v]of visibility)o.visible=v;scene.overrideMaterial=oldOverride;scene.background=oldBackground;renderer.autoClear=oldAuto;renderer.setClearColor(oldClear,oldAlpha);renderer.setRenderTarget(oldTarget);}
}
function renderReference(reference=6){if(Number(reference)!==6)throw Error('This isolated foundation reconstructs reference 6 only.');return diagnostics.run('reference6-render-frame',()=>{camera.updateMatrixWorld(true);renderOpaqueDepth();scattering.sync({mist:.022});composer.render(0);frame++;return{reference:6,frame,width,height,revision:REFERENCE6_FOUNDATION.revision,camera:{position:camera.position.toArray(),target:[...REFERENCE6_FOUNDATION.camera.target],fov:camera.fov},quality:{sunShadow:2048,pointShadow:256,roomCube:128,floorReflection:768},validation:'Visual foundation candidate, not photographic acceptance.'};});}
const counts={meshes:0,instances:0,triangles:0};scene.traverse(o=>{if(o.isMesh){counts.meshes++;const n=o.isInstancedMesh?o.count:1;counts.instances+=n;counts.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*n;}});
function info(){return{revision:REFERENCE6_FOUNDATION.revision,reference:6,frame,counts:{...counts},independentInterior:true,exteriorWorldBuilt:false,photoPlanes:false,exposure:renderer.toneMappingExposure,lights:{sun:1,indirectAreaProxies:6,practicals:2},quality:{sunShadow:2048,pointShadow:256,roomCube:128,floorReflection:768},limits:[...room.limits],diagnostics:diagnostics.snapshot()};}
window.temple=Object.freeze({renderer,renderReference,info,getRenderDiagnostics:diagnostics.snapshot});
const loading=document.getElementById('loading');if(loading)loading.style.display='none';const ui=document.getElementById('ui');if(ui)ui.style.display='none';
if(!query.has('defer'))renderReference(6);
