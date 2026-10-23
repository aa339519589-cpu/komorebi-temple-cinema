import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {createLensBloomPass} from './lens-bloom.js';
import {createReference6CameraShot} from './reference6-camera-shot.js';
import {createShotFocusPass} from './shot-focus.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {buildReference6Scene,REFERENCE6_FOUNDATION} from './reference6-scene.js';
import {loadFloorSurface106,loadTempleWoodTexture} from './floor-scan106.js';
import {createRestorationScatteringPass} from './restoration-lighting.js';
import {installRestorationRenderDiagnostics} from './restoration-render-diagnostics.js';
import {loadSculpturalCastAssets} from './sculptural-cast-assets.js';

const query=new URLSearchParams(location.search),dimension=(key,fallback)=>{const n=Number(query.get(key));return Number.isFinite(n)&&n>=64?Math.min(2048,Math.round(n)):fallback;};
const width=dimension('w',960),height=dimension('h',960);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
const diagnostics=installRestorationRenderDiagnostics(renderer);
window.templeDiagnostics=Object.freeze({snapshot:diagnostics.snapshot});
renderer.setPixelRatio(1);renderer.setSize(width,height);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.20;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.setClearColor(0x000000,1);document.body.appendChild(renderer.domElement);
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
const [floorSurface,timberMap,castManifest]=await Promise.all([loadFloorSurface106(),loadTempleWoodTexture(),loadSculpturalCastAssets()]);
let room;
try {room=diagnostics.run('reference6-room-build',()=>buildReference6Scene({reflectionSize:1024,shadowSize:2048,roomCubeSize:128,floorSurface,timberMap,sculptureMetrics:castManifest.mainMetrics}));diagnostics.run('reference6-room-environment-capture',()=>room.initializeEnvironment(renderer));}catch(error){renderer.dispose();throw error;}
const {scene,sun}=room;
// Locate the actual central bowl/cartouche surface without changing any
// geometry or material. Altar-local Y1.426 lies across the six-lobed body.
scene.updateMatrixWorld(true);
// The table's internal transform advances the complete assembly by .62m.
// Use its existing ritual-axis anchor, not an untransformed table Z guess.
const ritualAxisZ=room.altar.userData.ritualFlameAnchors[0].center[2];
const subjectProbe=room.altar.localToWorld(new T.Vector3(0,1.426,ritualAxisZ+2)),subjectDirection=new T.Vector3(0,0,-1).transformDirection(room.altar.matrixWorld);
const subjectHit=new T.Raycaster(subjectProbe,subjectDirection,.01,6).intersectObject(room.altar,true)[0];
if(!subjectHit)throw Error('Existing central censer detail could not be located.');
const subjectLocal=room.altar.worldToLocal(subjectHit.point.clone());
if(subjectLocal.z<ritualAxisZ+.12||subjectLocal.z>ritualAxisZ+.48)throw Error('Censer focus probe hit a different altar layer: '+subjectLocal.toArray().join(','));
const shot=createReference6CameraShot(REFERENCE6_FOUNDATION.camera,{label:'Existing central six-lobed gilt censer/cartouche and curled handles',point:subjectHit.point.toArray(),altarLocalPoint:subjectLocal.toArray(),mesh:subjectHit.object.name,instanceId:subjectHit.instanceId??null,source:'Raycast against retained altar geometry at local Y1.426; no model edits'});
const depthTarget=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:true,stencilBuffer:false});depthTarget.depthTexture=new T.DepthTexture(width,height,T.UnsignedIntType);depthTarget.texture.minFilter=depthTarget.texture.magFilter=T.NearestFilter;
const depthMaterial=new T.MeshNormalMaterial({side:T.DoubleSide});
const shotFocus=createShotFocusPass(camera,depthTarget.depthTexture,width,height);
const composer=new EffectComposer(renderer,new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:true,samples:composerAA.samples}));composer.setSize(width,height);composer.addPass(new RenderPass(scene,camera));
// Reuse the existing real opaque geometry pass as a packed-normal/depth buffer.
// Narrow world-space radius preserves broad photographed light/dark regions.
const contactAO=new GTAOPass(scene,camera,width,height);
contactAO.setGBuffer(depthTarget.depthTexture,depthTarget.texture);
contactAO.updateGtaoMaterial({radius:.18,thickness:.14,distanceExponent:1,distanceFallOff:1,scale:1,samples:16,screenSpaceRadius:false});
contactAO.updatePdMaterial({radius:3.5,samples:16,depthPhi:2,normalPhi:3,lumaPhi:10});
contactAO.blendIntensity=.65;contactAO.output=GTAOPass.OUTPUT.Default;composer.addPass(contactAO);
const scattering=createRestorationScatteringPass(camera,sun,depthTarget.depthTexture,{density:.009,scatteringGain:2.8});
const inheritedMask='float room=(1.0-smoothstep(11.0,12.2,abs(p.x-6.0)))*smoothstep(-20.5,-19.6,p.z)*(1.0-smoothstep(-2.2,-1.6,p.z));\n          room*=smoothstep(6.03,6.32,p.y)*(1.0-smoothstep(16.8,17.8,p.y));';
if(scattering.material.fragmentShader.split(inheritedMask).length!==2)throw Error('Pinned scattering mask changed.');
scattering.material.fragmentShader=scattering.material.fragmentShader.replace(inheritedMask,'float room=(1.0-smoothstep(6.65,6.8,abs(p.x)))*smoothstep(-5.8,-5.55,p.z)*(1.0-smoothstep(9.8,10.0,p.z));\n          room*=smoothstep(.02,.10,p.y)*(1.0-smoothstep(7.05,7.2,p.y));\n');
scattering.material.needsUpdate=true;composer.addPass(scattering);composer.addPass(shotFocus.pass);const lensBloom=createLensBloomPass(width,height);composer.addPass(lensBloom);composer.addPass(new OutputPass());
let frame=0,activeTarget=[...REFERENCE6_FOUNDATION.camera.target],activeShot=null;
function renderOpaqueDepth(){
 const oldTarget=renderer.getRenderTarget(),oldAuto=renderer.autoClear,oldOverride=scene.overrideMaterial,oldBackground=scene.background,oldClear=renderer.getClearColor(new T.Color()),oldAlpha=renderer.getClearAlpha();
 const visibility=room.depthExclusions.map(o=>[o,o.visible]);
 try {for(const[o]of visibility)o.visible=false;scene.overrideMaterial=depthMaterial;scene.background=null;renderer.autoClear=true;renderer.setClearColor(0xffffff,1);renderer.setRenderTarget(depthTarget);renderer.clear();renderer.render(scene,camera);}
 finally {for(const[o,v]of visibility)o.visible=v;scene.overrideMaterial=oldOverride;scene.background=oldBackground;renderer.autoClear=oldAuto;renderer.setClearColor(oldClear,oldAlpha);renderer.setRenderTarget(oldTarget);}
}
function renderFrame(reference=6){if(Number(reference)!==6)throw Error('This isolated foundation reconstructs reference 6 only.');return diagnostics.run('reference6-render-frame',()=>{camera.updateMatrixWorld(true);renderOpaqueDepth();scattering.sync({mist:.009});composer.render(0);frame++;return{reference:6,frame,width,height,revision:REFERENCE6_FOUNDATION.revision,camera:{position:camera.position.toArray(),target:[...activeTarget],quaternion:camera.quaternion.toArray(),fov:camera.fov},shot:activeShot,focus:shotFocus.info(),quality:{sunShadow:2048,pointShadow:256,roomCube:128,roomProbeCount:2,floorReflection:1024,composerSamples:composerAA.samples},renderVariant:REFERENCE6_FOUNDATION.revision,validation:'Native review candidate; visual match remains under iteration.'};});}
const counts={meshes:0,instances:0,triangles:0};scene.traverse(o=>{if(o.isMesh){counts.meshes++;const n=o.isInstancedMesh?o.count:1;counts.instances+=n;counts.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*n;}});
function info(){return{revision:REFERENCE6_FOUNDATION.revision,sculptureAssetRevision:castManifest.revision,reference:6,frame,counts:{...counts},independentInterior:true,exteriorWorldBuilt:false,photoPlanes:false,exposure:renderer.toneMappingExposure,lights:{sun:1,indirectAreaProxies:room.windowSky.length,frontWindowShadowSamples:6,practicals:2},quality:{sunShadow:2048,pointShadow:256,roomCube:128,roomProbeCount:2,floorReflection:1024},renderVariant:REFERENCE6_FOUNDATION.revision,suspendedCanopy:(()=>{const c=scene.getObjectByName('reference6-central-floral-chain-curtain');return{chainStrands:c.userData.chainStrands,instancedFloralDrops:c.userData.instancedFloralDrops,centerFaceClearanceMeters:c.userData.centerFaceClearanceMeters,visibleHoopRings:c.userData.visibleHoopRings};})(),cameraShot:{...shot.info,current:activeShot,focus:shotFocus.info()},composerAA,solarScattering:{shadowReady:scattering.uniforms.shadowReady.value,hasShadowDepthTexture:Boolean(scattering.uniforms.tShadow.value),pcfDefine:scattering.material.defines.RESTORATION_SHADOW_PCF,density:scattering.uniforms.density.value,gain:scattering.uniforms.scatteringGain.value,sunDirection:scattering.uniforms.sunDirection.value.toArray()},materialSources:{architecturalTimber:'Generated repeating hinoki albedo on modeled columns, beams, and central ceiling; no photo planes.'},contactOcclusion:{method:'GTAO',radius:.18,thickness:.14,blendIntensity:.65,source:'Actual opaque geometry normals and depth',limitation:'Screen-space multiply approximation, not physical indirect-only transport'},limits:[...room.limits],diagnostics:diagnostics.snapshot()};}
function applyView(position,target,fov){activeShot=null;activeTarget=[...target];camera.position.fromArray(position);camera.fov=fov;camera.lookAt(new T.Vector3(...target));camera.updateProjectionMatrix();camera.updateMatrixWorld(true);shotFocus.sync({focusDistance:shot.info.focus.referenceFocusDistance,strength:0,enabled:false});}
function renderReference(n=6){if(Number(n)!==6)throw Error('Scene 06 only.');applyView(REFERENCE6_FOUNDATION.camera.position,REFERENCE6_FOUNDATION.camera.target,REFERENCE6_FOUNDATION.camera.fov);return renderFrame(6);}
function renderView(position,target,time=0,fov=62){applyView(position,target,fov);return renderFrame(6);}
function renderShot(localTime=0,options={}){
 const state=shot.sample(localTime);
 if(state.atEnd)applyView(REFERENCE6_FOUNDATION.camera.position,REFERENCE6_FOUNDATION.camera.target,REFERENCE6_FOUNDATION.camera.fov);
 else{
  camera.position.copy(state.position);camera.quaternion.copy(state.quaternion);camera.fov=state.fov;activeTarget=state.targetWitness.toArray();camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  shotFocus.sync({focusDistance:options.focusDistance??state.focusDistance,fNumber:options.fNumber??state.fNumber,strength:state.focusStrength});
 }
 activeShot={seconds:state.seconds,railProgress:state.u,orientation:'quaternion-slerp',focusPoint:state.focusPoint.toArray(),focusDistance:shotFocus.info().focusDistance,exactReferenceEndpoint:state.atEnd};
 return renderFrame(6);
}
function dispose(){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material])){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}if(o.isLight){o.shadow?.map?.dispose();o.shadow?.mapPass?.dispose();}});
 if(scene.environment)textures.add(scene.environment);for(const t of textures)t.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
 for(const pass of composer.passes)pass.dispose?.();composer.dispose();room.floor.getRenderTarget().dispose();depthTarget.dispose();depthMaterial.dispose();renderer.dispose();renderer.domElement.remove();
}
window.temple=Object.freeze({ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info,dispose,getRenderDiagnostics:diagnostics.snapshot});
const loading=document.getElementById('loading');if(loading)loading.style.display='none';const ui=document.getElementById('ui');if(ui)ui.style.display='none';
if(!query.has('defer'))renderReference(6);
