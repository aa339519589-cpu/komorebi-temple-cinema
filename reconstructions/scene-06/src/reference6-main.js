import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {createLensBloomPass} from './lens-bloom.js';
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
// Actual format-specific WebGL2 capability query, not the canvas AA flag.
// The composer owns its normal multisample storage/resolve through pinned Three.
const composerAA=diagnostics.run('reference6-composer-aa-capability',()=>{
 const gl=renderer.getContext();
 const colorSamples=Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,gl.RGBA16F,gl.SAMPLES)||[]);
 const depthSamples=Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,gl.SAMPLES)||[]);
 const maxSamples=renderer.capabilities.maxSamples;
 const samples=[4,2].find(n=>n<=maxSamples&&colorSamples.includes(n)&&depthSamples.includes(n))||0;
 return Object.freeze({requestedSamples:4,samples,colorFormat:'RGBA16F',depthFormat:'DEPTH_COMPONENT24',colorSamples:Object.freeze(colorSamples),depthSamples:Object.freeze(depthSamples),maxSamples,active:samples>0,mode:samples>0?'multisample-composer':'unsupported-format-no-aa',scope:'Geometry coverage only; no promise to remove normal-map/specular aliasing.'});
});
const camera=new T.PerspectiveCamera(REFERENCE6_FOUNDATION.camera.fov,width/height,.06,60);camera.position.fromArray(REFERENCE6_FOUNDATION.camera.position);camera.lookAt(new T.Vector3(...REFERENCE6_FOUNDATION.camera.target));camera.updateMatrixWorld(true);
let room;
try {room=diagnostics.run('reference6-room-build',()=>buildReference6Scene({reflectionSize:768,shadowSize:2048,roomCubeSize:128}));diagnostics.run('reference6-room-environment-capture',()=>room.initializeEnvironment(renderer));}catch(error){renderer.dispose();throw error;}
const {scene,sun}=room;
const depthTarget=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:true,stencilBuffer:false});depthTarget.depthTexture=new T.DepthTexture(width,height,T.UnsignedIntType);depthTarget.texture.minFilter=depthTarget.texture.magFilter=T.NearestFilter;
const depthMaterial=new T.MeshNormalMaterial({side:T.DoubleSide});
const composer=new EffectComposer(renderer,new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:true,samples:composerAA.samples}));composer.setSize(width,height);composer.addPass(new RenderPass(scene,camera));
// Reuse the existing real opaque geometry pass as a packed-normal/depth buffer.
// Narrow world-space radius preserves broad photographed light/dark regions.
const contactAO=new GTAOPass(scene,camera,width,height);
contactAO.setGBuffer(depthTarget.depthTexture,depthTarget.texture);
contactAO.updateGtaoMaterial({radius:.18,thickness:.14,distanceExponent:1,distanceFallOff:1,scale:1,samples:16,screenSpaceRadius:false});
contactAO.updatePdMaterial({radius:3.5,samples:16,depthPhi:2,normalPhi:3,lumaPhi:10});
contactAO.blendIntensity=.65;contactAO.output=GTAOPass.OUTPUT.Default;composer.addPass(contactAO);
const scattering=createRestorationScatteringPass(camera,sun,depthTarget.depthTexture,{density:.022});
const inheritedMask='float room=(1.0-smoothstep(11.0,12.2,abs(p.x-6.0)))*smoothstep(-20.5,-19.6,p.z)*(1.0-smoothstep(-2.2,-1.6,p.z));\n          room*=smoothstep(6.03,6.32,p.y)*(1.0-smoothstep(16.8,17.8,p.y));';
if(scattering.material.fragmentShader.split(inheritedMask).length!==2)throw Error('Pinned scattering mask changed.');
scattering.material.fragmentShader=scattering.material.fragmentShader.replace(inheritedMask,'float room=(1.0-smoothstep(6.65,6.8,abs(p.x)))*smoothstep(-5.8,-5.55,p.z)*(1.0-smoothstep(9.8,10.0,p.z));\n          room*=smoothstep(.02,.10,p.y)*(1.0-smoothstep(7.05,7.2,p.y));float leftDust=exp(-pow((p.x+4.7)/1.5,2.0))*smoothstep(-4.5,-2.5,p.z)*(1.0-smoothstep(5.2,7.0,p.z));room*=.003+.997*leftDust;');
scattering.material.needsUpdate=true;composer.addPass(scattering);const lensBloom=createLensBloomPass(width,height);composer.addPass(lensBloom);composer.addPass(new OutputPass());
let frame=0,activeTarget=[...REFERENCE6_FOUNDATION.camera.target];
function renderOpaqueDepth(){
 const oldTarget=renderer.getRenderTarget(),oldAuto=renderer.autoClear,oldOverride=scene.overrideMaterial,oldBackground=scene.background,oldClear=renderer.getClearColor(new T.Color()),oldAlpha=renderer.getClearAlpha();
 const visibility=room.depthExclusions.map(o=>[o,o.visible]);
 try {for(const[o]of visibility)o.visible=false;scene.overrideMaterial=depthMaterial;scene.background=null;renderer.autoClear=true;renderer.setClearColor(0xffffff,1);renderer.setRenderTarget(depthTarget);renderer.clear();renderer.render(scene,camera);}
 finally {for(const[o,v]of visibility)o.visible=v;scene.overrideMaterial=oldOverride;scene.background=oldBackground;renderer.autoClear=oldAuto;renderer.setClearColor(oldClear,oldAlpha);renderer.setRenderTarget(oldTarget);}
}
function renderFrame(reference=6){if(Number(reference)!==6)throw Error('This isolated foundation reconstructs reference 6 only.');return diagnostics.run('reference6-render-frame',()=>{camera.updateMatrixWorld(true);renderOpaqueDepth();scattering.sync({mist:.022});composer.render(0);frame++;return{reference:6,frame,width,height,revision:REFERENCE6_FOUNDATION.revision,camera:{position:camera.position.toArray(),target:[...activeTarget],fov:camera.fov},quality:{sunShadow:2048,pointShadow:256,roomCube:128,roomProbeCount:2,floorReflection:768,composerSamples:composerAA.samples},renderVariant:'scene-06-petal-cast-r12',validation:'Visual foundation candidate, not photographic acceptance.'};});}
const counts={meshes:0,instances:0,triangles:0};scene.traverse(o=>{if(o.isMesh){counts.meshes++;const n=o.isInstancedMesh?o.count:1;counts.instances+=n;counts.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*n;}});
function info(){return{revision:REFERENCE6_FOUNDATION.revision,reference:6,frame,counts:{...counts},independentInterior:true,exteriorWorldBuilt:false,photoPlanes:false,exposure:renderer.toneMappingExposure,lights:{sun:1,indirectAreaProxies:5,frontWindowShadowSamples:6,practicals:2},quality:{sunShadow:2048,pointShadow:256,roomCube:128,roomProbeCount:2,floorReflection:768},renderVariant:'scene-06-petal-cast-r12',composerAA,contactOcclusion:{method:'GTAO',radius:.18,thickness:.14,blendIntensity:.65,source:'Actual opaque geometry normals and depth',limitation:'Screen-space multiply approximation, not physical indirect-only transport'},limits:[...room.limits],diagnostics:diagnostics.snapshot()};}
const shotStart={position:[-.18,.55,3.95],target:[0,3.35,-2.30],fov:68};
function applyView(position,target,fov){activeTarget=[...target];camera.position.fromArray(position);camera.fov=fov;camera.lookAt(new T.Vector3(...target));camera.updateProjectionMatrix();camera.updateMatrixWorld(true);}
function renderReference(n=6){if(Number(n)!==6)throw Error('Scene 06 only.');applyView(REFERENCE6_FOUNDATION.camera.position,REFERENCE6_FOUNDATION.camera.target,REFERENCE6_FOUNDATION.camera.fov);return renderFrame(6);}
function renderView(position,target,time=0,fov=62){applyView(position,target,fov);return renderFrame(6);}
function renderShot(localTime=0){const t=T.MathUtils.clamp(localTime/7,0,1),q=t*t*(3-2*t),mix=(a,b)=>a.map((v,i)=>T.MathUtils.lerp(v,b[i],q));applyView(mix(shotStart.position,REFERENCE6_FOUNDATION.camera.position),mix(shotStart.target,REFERENCE6_FOUNDATION.camera.target),T.MathUtils.lerp(shotStart.fov,REFERENCE6_FOUNDATION.camera.fov,q));return renderFrame(6);}
function dispose(){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material])){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}if(o.isLight){o.shadow?.map?.dispose();o.shadow?.mapPass?.dispose();}});
 if(scene.environment)textures.add(scene.environment);for(const t of textures)t.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
 for(const pass of composer.passes)pass.dispose?.();composer.dispose();room.floor.getRenderTarget().dispose();depthTarget.dispose();depthMaterial.dispose();renderer.dispose();renderer.domElement.remove();
}
window.temple=Object.freeze({ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info,dispose,getRenderDiagnostics:diagnostics.snapshot});
const loading=document.getElementById('loading');if(loading)loading.style.display='none';const ui=document.getElementById('ui');if(ui)ui.style.display='none';
if(!query.has('defer'))renderReference(6);
