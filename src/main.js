import * as T from 'three';
import {stableBumpChunk} from './stable-normals.js';
T.ShaderChunk.bumpmap_pars_fragment=stableBumpChunk(T.ShaderChunk.bumpmap_pars_fragment);
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { buildWorld } from './world.js';
import {createRestorationWindowShadowArray} from './restoration-window-shadow-array.js';
import {installRestorationRenderDiagnostics} from './restoration-render-diagnostics.js';
import {createRestorationScatteringPass} from './restoration-lighting.js';
import {shots,cameraPose,cameraPoseForShot} from './cinematography.js';
import {referenceViews,getReferenceView} from './reference-views.js';
const params = new URLSearchParams(location.search),
  renderMode = params.has('render'),sceneVariant=params.get('scene')||'shared';
if(!['shared','reference10-porch'].includes(sceneVariant))throw new RangeError('Unknown scene variant.');
const reference10Only=sceneVariant==='reference10-porch';
if (renderMode) document.body.classList.add('render');
const width = +(params.get('w') || innerWidth),
  height = +(params.get('h') || innerHeight);
const renderer = new T.WebGLRenderer({
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance'
});
const renderDiagnostics=installRestorationRenderDiagnostics(renderer);
window.templeDiagnostics=Object.freeze({snapshot:renderDiagnostics.snapshot});
renderer.setSize(width, height);
renderer.setPixelRatio(renderMode ? 1 : Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFShadowMap;
renderer.toneMapping = params.get('tone')==='agx'?T.AgXToneMapping:T.ACESFilmicToneMapping;
renderer.toneMappingExposure=Number(params.get('exposure')||1.12);
renderer.outputColorSpace = T.SRGBColorSpace;
document.body.prepend(renderer.domElement);
// Persistent shader diagnostics are installed at this pre-build boundary.
// Candidate adoption opts this renderer into the six-window array. A fresh
// renderer with ?window-shadow-array=0 remains an explicit old-source control.
const windowShadowArrayEnabled=params.get('window-shadow-array')!=='0';
let world, windowShadowArrayOwner=null;
try {
  world=renderDiagnostics.run('world-build-and-initial-captures',()=>{
    if(windowShadowArrayEnabled)windowShadowArrayOwner=createRestorationWindowShadowArray(renderer);
    return buildWorld(renderer,{sceneVariant,windowShadowArrayOwner,sunDirection:({back:[-.72,.17,-.51],side:[-.92,.22,.15]})[params.get('sun')],daylightFill:params.has('fill'),reflectionAudit:params.has('audit-reflection')});
  });
}catch(error){
  const failures=[error];
  // No world handle exists on failed startup. Retire only the renderer-owned
  // resources we can actually reach; this is not a per-mesh world disposer.
  if(windowShadowArrayEnabled){
    for(const cleanup of [()=>windowShadowArrayOwner?.dispose(),()=>renderer.dispose()])try{cleanup();}catch(cleanupError){failures.push(cleanupError);}
  }
  if(failures.length===1)throw error;
  throw new AggregateError(failures,'World startup and renderer-owner retirement failed.',{cause:error});
}
const {scene}=world;
const camera = new T.PerspectiveCamera(44, width / height, .12, 550);
const composer = new EffectComposer(renderer);
composer.renderTarget1.samples = 4;
composer.renderTarget2.samples = 4;
const rt = composer.renderTarget1;
const pass = new RenderPass(scene, camera);
composer.addPass(pass);
const previousRandom = Math.random;
let noiseSeed = 9071;
Math.random = () => {
  noiseSeed = 1664525 * noiseSeed + 1013904223 >>> 0;
  return noiseSeed / 4294967296;
};
const gtao = new GTAOPass(scene, camera, width, height);
Math.random = previousRandom;
gtao.output = GTAOPass.OUTPUT.Default;
gtao.blendIntensity = .65;
gtao.updateGtaoMaterial({
  radius: .65,
  distanceExponent: 1.4,
  thickness: 1.2,
  distanceFallOff: 1.0,
  scale: 1,
  samples: 16
});
gtao.updatePdMaterial({
  lumaPhi: 10,
  depthPhi: 2,
  normalPhi: 3,
  radius: 6,
  rings: 2,
  samples: 16
});
if (!params.has('noao')) composer.addPass(gtao);
const previousBefore = gtao._renderOverride.bind(gtao);
gtao._renderOverride = (...args) => {
  const renderNormal=()=>world.restorationLighting.withReflectionsHidden(()=>{
  const normalExclusions=[...world.foliageMeshes,...world.transparentNormalExclusions];
  const visible=normalExclusions.map(o=>o.visible);
  normalExclusions.forEach(o=>o.visible=false);
  try{previousBefore(...args)}finally{normalExclusions.forEach((o,i)=>o.visible=visible[i])}
  const clear=renderer.autoClear;renderer.autoClear=false;
  try{renderer.setRenderTarget(gtao.normalRenderTarget);renderer.render(world.foliageNormalScene,camera)}finally{renderer.autoClear=clear}
  });
  return world.withRoofNormalPass(renderNormal);
};

const dof = new ShaderPass({
  uniforms: {
    tDiffuse: {
      value: null
    },
    tDepth: {
      value: gtao.normalRenderTarget.depthTexture
    },
    focus: {
      value: 30
    },
    aperture: {
      value: .0015
    },
    aspect: {
      value: width / height
    },
    nearClip: {
      value: camera.near
    },
    farClip: {
      value: camera.far
    }
  },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: `uniform sampler2D tDiffuse;uniform sampler2D tDepth;uniform float focus,aperture,aspect,nearClip,farClip;varying vec2 vUv;
float distanceAt(vec2 uv){float z=texture2D(tDepth,uv).x;return nearClip*farClip/(farClip-z*(farClip-nearClip));}
void main(){float z=distanceAt(vUv),blur=min(.0075,aperture*abs(z-focus)/max(1.0,z));vec4 c=texture2D(tDiffuse,vUv)*4.0;float w=4.0;for(int i=0;i<24;i++){float a=float(i)*2.3999632,r=sqrt((float(i)+.5)/24.0);vec2 uv=vUv+vec2(cos(a)/aspect,sin(a))*r*blur;float zz=distanceAt(uv);float weight=zz<z*.72?.15:1.0;c+=texture2D(tDiffuse,uv)*weight;w+=weight;}gl_FragColor=c/w;}`
});
dof.uniforms.tDepth.value = gtao.normalRenderTarget.depthTexture;
const atmosphere=createRestorationScatteringPass(camera,world.sun,gtao.normalRenderTarget.depthTexture,{hallMatrix:world.hallMatrix});
if(!params.has('noao'))composer.addPass(atmosphere);
composer.addPass(dof);
const grade = new ShaderPass({
  uniforms: {
    tDiffuse: {
      value: null
    }
  },
  vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: `uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 p=(vUv-.5)*vec2(1.05,1.0);float vig=1.0-.16*dot(p,p);c.rgb*=vec3(1.035,1.005,.965)*vig;gl_FragColor=c;}`
});
composer.addPass(grade);
const outputPass=new OutputPass();composer.addPass(outputPass);
const exposureTarget=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:false});
const accumulateMaterial=new T.ShaderMaterial({uniforms:{tDiffuse:{value:null},weight:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D tDiffuse;uniform float weight;varying vec2 vUv;void main(){gl_FragColor=texture2D(tDiffuse,vUv)*weight;}',transparent:true,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneFactor,blendEquation:T.AddEquation,depthTest:false,depthWrite:false});
const accumulateQuad=new FullScreenQuad(accumulateMaterial);
let last=-1;
let lastFrameStats=null;
renderer.info.autoReset=false;
function drawPose(p,time){
 return renderDiagnostics.run('render-frame',()=>{
 camera.position.copy(p.position);camera.lookAt(p.target);camera.fov=p.fov;camera.updateProjectionMatrix();
 const focus=p.position.distanceTo(p.target),focal=camera.getFocalLength()/1000,sensorHeight=camera.getFilmHeight()/1000;
 const fStop=T.MathUtils.lerp(p.index===5?3.5:4.5,8,T.MathUtils.clamp(p.u,0,1));
 dof.uniforms.focus.value=focus;
 // Thin-lens circle of confusion, expressed as a radius in image-height units.
 // Inspection views have no blur so that the ground and joinery can be judged.
 dof.uniforms.aperture.value=p.index<0?0:focal*focal/(2*fStop*sensorHeight*Math.max(.05,focus-focal));
 world.update(time);atmosphere.sync(world.restorationLighting.profile);
 renderer.info.reset();composer.render();
 lastFrameStats={...renderer.info.render,scope:"All passes including reflections and AO, not unique scene triangles"};
 renderer.shadowMap.autoUpdate=false;last=time;
 return{shot:p.index,position:p.position.toArray(),target:p.target.toArray(),fStop,focalLengthMm:focal*1000};

 });
}
function sitePose(p){return {...p,position:p.position.clone().applyMatrix4(world.siteMatrix),target:p.target.clone().applyMatrix4(world.siteMatrix)};}
function renderAt(time){if(reference10Only){const v=getReferenceView(10,{sceneVariant});return renderView(v.position,v.target,time,v.fov);}return drawPose(sitePose(cameraPose(time)),time);}
function renderShot(index,localTime,worldTime=index*7+localTime){if(reference10Only){if(index!==9)throw new RangeError('Conditional scene is reference10 only.');return renderAt(worldTime);}return drawPose(sitePose(cameraPoseForShot(index,localTime)),worldTime);}
function renderView(position,target,time=0,fov=48){return drawPose({position:new T.Vector3(...position),target:new T.Vector3(...target),fov,u:1,index:-1},time);}
function renderReference(reference){const view=getReferenceView(reference,{sceneVariant});const frame=renderView(view.position,view.target,view.time,view.fov);return{...frame,reference:view.reference,cameraStatus:view.status,sceneVariant};}
function renderExposure(index,localTime,worldTime,samples=3,shutter=1/60){
 return renderDiagnostics.run('render-exposure',()=>{
  if(reference10Only&&index!==9)throw new RangeError('Conditional scene is reference10 only.');
  const previousScreen=composer.renderToScreen,clearColor=renderer.getClearColor(new T.Color()),clearAlpha=renderer.getClearAlpha();outputPass.enabled=false;composer.renderToScreen=false;
  renderer.setRenderTarget(exposureTarget);renderer.setClearColor(0,0);renderer.clear();
  for(let sample=0;sample<samples;sample++){
    const dt=((sample+.5)/samples-.5)*shutter;
    renderShot(index,localTime+dt,worldTime+dt);
    renderer.setRenderTarget(exposureTarget);renderer.autoClear=false;
    accumulateMaterial.uniforms.tDiffuse.value=composer.readBuffer.texture;accumulateMaterial.uniforms.weight.value=1/samples;
    accumulateQuad.render(renderer);renderer.autoClear=true;
  }
  outputPass.enabled=true;composer.renderToScreen=previousScreen;outputPass.renderToScreen=true;
  outputPass.render(renderer,null,exposureTarget);renderer.setRenderTarget(null);renderer.setClearColor(clearColor,clearAlpha);

 });
}
function auditCameras(){
 if(reference10Only)return{scope:world.referenceScene.status,staticView:getReferenceView(10,{sceneVariant}),animatedCameraPath:false};
 const result=[];
 for(let index=0;index<10;index++){
  let clearance=Infinity,maxTurn=0,maxSpeed=0,previous=null,minPitch=90,maxPitch=-90;const collisions=[];
  for(let f=-10;f<=430;f++){
   const p=sitePose(cameraPoseForShot(index,f/60)),d=p.target.clone().sub(p.position).normalize(),pitch=Math.asin(d.y)*180/Math.PI;
   minPitch=Math.min(minPitch,pitch);maxPitch=Math.max(maxPitch,pitch);
   if(previous){maxTurn=Math.max(maxTurn,Math.acos(T.MathUtils.clamp(d.dot(previous.d),-1,1))*180/Math.PI*60);maxSpeed=Math.max(maxSpeed,p.position.distanceTo(previous.position)*60)}
   for(const c of world.columns)if(p.position.y>c.bottom-.14&&p.position.y<c.top+.14){
    const gap=Math.hypot(p.position.x-c.x,p.position.z-c.z)-c.radius-.14;clearance=Math.min(clearance,gap);if(gap<0)collisions.push({time:f/60,column:[c.x,c.z],gap});
   }
   previous={d,position:p.position};
  }
  result.push({index:index+1,maxTurnDegreesPerSecond:maxTurn,maxMetresPerSecond:maxSpeed,minimumColumnClearance:clearance,viewPitchRange:[minPitch,maxPitch],columnCollisions:collisions});
 }
 return{scope:'Camera path, orientation and actual generated column clearance, including transition handles; does not certify visual similarity or complete geometry clearance.',shots:result};
}
function info() {
  let tris = 0,
    instances = 0,
    meshes = 0;
  scene.traverse(o => {
    if (o.isMesh) {
      meshes++;
      let n = o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3;
      tris += n * (o.isInstancedMesh ? o.count : 1);
      if (o.isInstancedMesh) instances += o.count;
    }
  });
  const gl = renderer.getContext(),
    ext = gl.getExtension('WEBGL_debug_renderer_info');
  return {
    triangles: tris,
    instances,
    meshes,
    materials: world.stats,
    lastFrameStats,
    reflectionAudit:world.reflectionAudit,
    gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown',
    resolution: [width, height],
    shadows: 'fixed 8192 × 8192 PCF map',
    reflectors: 3,
    procedural: true,
    scaleReference:world.scaleReference,
    referenceScene:world.referenceScene,
    cameraPolicy:"Legacy paths transformed with the shared hardscape; explicit renderView coordinates are already world-space",
    lightingMode:world.restorationLighting.mode,
    referenceViews:(reference10Only?[getReferenceView(10,{sceneVariant})]:referenceViews).map(v=>({reference:v.reference,time:v.time,status:v.status})),
    referenceModes:(reference10Only?shots.filter(s=>s.reference===10):shots).map(s=>({reference:s.reference,mode:s.lightingMode})),
    registeredLighting:{pagodaWindows:world.pagodaWindows.length,stoneLanterns:world.stoneLanternEmitters.length,activeWindowSources:world.windowLighting.group.visible?world.windowLighting.sources.length:0,activeStoneSources:world.lanternLighting.group.visible?world.lanternLighting.sources.length:0,cachedRoomModes:world.roomEnvironmentCache.cachedModes},
    roofAudit:{rafters:world.roofAudit.length,priorWorstPenetration:Math.max(...world.roofAudit.map(x=>x.oldPenetration)),correctedMaxTopOffset:Math.max(...world.roofAudit.map(x=>x.newMaximumTopOffset))},
    shots: shots.map(s => s.name)
  };
}
// Offline still jobs request their own first pose. Do not waste a full
// exterior render before every interior diagnostic. Interactive default stays.
if(!renderMode||!params.has('defer')){if(reference10Only)renderReference(10);else renderAt(5.8);}
document.getElementById('loading').remove();
window.temple = {
  ready: true,
  getRenderDiagnostics:renderDiagnostics.snapshot,
  sceneVariant,
  disposeRoomEnvironment:()=>world.disposeRoomEnvironment(),
  renderAt,
  renderShot,
  renderView,
  renderReference,
  renderExposure,
  auditCameras,
  info,
  shots,
  renderer,
  scene,
  camera,
  composer,
  gtao,
  dof
};
if (!renderMode) {
  let playing = true,
    t = 0,
    previous = performance.now();
  const input = document.getElementById('scrub'),
    label = document.getElementById('label'),
    play = document.getElementById('play');
  const audio = new Audio('/music/PerituneMaterial_Oboro.mp3');
  audio.volume = .56;
  input.addEventListener('input', () => {
    t = +input.value;
    audio.currentTime = t + 25;
    renderAt(t);
  });
  play.onclick = () => {
    playing = !playing;
    play.textContent = playing ? '暂停' : '播放';
    if (!playing) audio.pause();
  };
  document.getElementById('music').onclick = () => {
    if (audio.paused) {
      audio.currentTime = t + 25;
      audio.play();
    } else audio.pause();
  };
  function animate(now) {
    const dt = Math.min(.1, (now - previous) / 1000);
    previous = now;
    if (playing) t = (t + dt) % 70;
    renderAt(t);
    input.value = t;
    label.textContent = reference10Only?'参考10条件场景 · 固定可站机位，未标定':shots[Math.min(9,Math.floor(t / 7))].name;
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  window.addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });
}
