import {pondLevel210,pondShore210} from './pond-level210.js';
import {installCourtyardBoundary342,captureHallEnvironment342} from './courtyard-light342.js';
import {createSunSky210,installWetBoardReflection210} from './sky-wet210.js';
import {createDollyPath} from '/reconstructions/camera-dolly.js';
import {T,V,materials} from './kernel.js';
import {installScannedTimber} from './scanned-timber.js';
import {buildPagodaGrounding} from './pagoda-ground.js';
import {buildArchitecture} from './architecture.js';
import {buildGarden} from './garden.js';
import {loadScannedGardenStones} from './scanned-garden-stones.js';
import {layout} from './layout117.js';
import {installArchitecturalFinishes160} from './architectural-finishes160.js';
import {loadForegroundStone120} from './foreground-stone-lantern120.js';
import {loadCarvedGable186} from './gable-source186.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
RectAreaLightUniformsLib.init();
const query=new URLSearchParams(location.search),width=Math.min(2048,Math.max(64,Number(query.get('w'))||960)),height=Math.min(2048,Math.max(64,Number(query.get('h'))||960));
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setSize(width,height);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;document.body.append(renderer.domElement);
const scene=new T.Scene();scene.name='reference02-layout117-recovered-veranda';scene.fog=new T.FogExp2(0xd3b181,.005);
const {mats,textures}=materials();mats.slate.side=T.DoubleSide;
const architecturalFinishes160=installArchitecturalFinishes160(mats);textures.push(...architecturalFinishes160.textures);
const foregroundStone120=await loadForegroundStone120();Object.assign(mats,foregroundStone120.mats);textures.push(...foregroundStone120.textures);
const sharedGardenStones=await loadScannedGardenStones();
const gableSource186=await loadCarvedGable186(mats);
const architecture=buildArchitecture(mats,sharedGardenStones,gableSource186),garden=await buildGarden(mats,sharedGardenStones),grounding=buildPagodaGrounding(mats);scene.add(architecture.group,garden.group,grounding.group,...architecture.lights,...garden.lights);
const sunDirection=V(layout.sunDirection).normalize();
const sky210=createSunSky210(sunDirection),skyMaterial=sky210.material;
const sky=new T.Mesh(new T.SphereGeometry(220,40,24),skyMaterial);sky.name='procedural-golden-cloud-atmosphere';scene.add(sky);
const sun=new T.DirectionalLight(0xffd2a1,8.2);sun.target.position.set(-2,4,0);sun.position.copy(sun.target.position).add(sunDirection.clone().multiplyScalar(90));sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-34,right:34,top:34,bottom:-34,near:1,far:125});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00008;sun.shadow.normalBias=.008;sun.shadow.radius=2;sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;scene.add(sun,sun.target);
scene.add(new T.HemisphereLight(0xb7d0ed,0x665b4c,.34));const frontFill=new T.DirectionalLight(0xdbe9ff,.10);frontFill.name='broad-warm-sky-and-courtyard-bounce';frontFill.position.set(-16,16,24);frontFill.target.position.set(1,6,-8);frontFill.castShadow=false;frontFill.shadow.mapSize.set(4096,4096);Object.assign(frontFill.shadow.camera,{left:-34,right:34,top:31,bottom:-27,near:1,far:100});frontFill.shadow.camera.updateProjectionMatrix();frontFill.shadow.bias=-.000035;frontFill.shadow.normalBias=.006;frontFill.shadow.autoUpdate=false;frontFill.shadow.needsUpdate=true;scene.add(frontFill,frontFill.target);const pondBounce=new T.DirectionalLight(0xe0d6bd,.06);pondBounce.name='soft-pond-bounce-approximation';pondBounce.position.set(-20,3.5,20);pondBounce.target.position.set(-1,5,-7);scene.add(pondBounce,pondBounce.target);
// Finite extended courtyard radiance gives curved lacquer/gilt a broad warm
// reflection. It replaces a hard unshadowed directional fill and its striped
// tree/rafter shadows. Native area lighting uses LTC; geometry-derived GTAO
// supplies nearby contact occlusion, with actual shadowed sun retained.
const courtArea=new T.RectAreaLight(0xffdfb8,0,10,6);courtArea.name='extended-sunlit-courtyard-radiance170';courtArea.position.set(1,3,-1);courtArea.lookAt(3,8,-12);scene.add(courtArea);const westArea=new T.RectAreaLight(0xffdcad,.80,10,8);westArea.name='extended-west-tower-courtyard-radiance170';westArea.position.set(-12.5,3,0);westArea.lookAt(-15.6,12,-16);scene.add(westArea);
const bridgeBounce210=new T.RectAreaLight(0xe4dfca,.8,7.0,2.2);bridgeBounce210.name='finite-reflected-pond-radiance-on-stone-bents210';bridgeBounce210.position.set(1.0,1.1,9.5);bridgeBounce210.lookAt(.8,1.6,4.7);scene.add(bridgeBounce210);
const courtyardBoundary342=installCourtyardBoundary342(scene);
const camera=new T.PerspectiveCamera(52,width/height,.12,300);
const reference={position:layout.referenceCamera.position,target:layout.referenceCamera.target,fov:layout.referenceCamera.fov};
const reflectors=[];
function mirror(name,w,d,p,opacity=.8,ripple=.0015,geometry=null){
 const o=new Reflector(geometry||new T.PlaneGeometry(w,d),{textureWidth:Math.min(width,1024),textureHeight:Math.min(height,1024),clipBias:.004,color:0x9a9a9a,multisample:0});o.rotation.x=-Math.PI/2;o.position.fromArray(p);o.name=name;o.material.transparent=true;o.material.depthWrite=false;
 o.material.vertexShader=o.material.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv;varying vec3 vMirrorWorld;').replace('void main() {','void main() {vMirrorWorld=(modelMatrix*vec4(position,1.)).xyz;');
 o.material.fragmentShader=o.material.fragmentShader.replace('varying vec4 vUv;','varying vec4 vUv;varying vec3 vMirrorWorld;').replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec4 rippleUV=vUv;rippleUV.xy+=vec2(sin(vMirrorWorld.x*12.7+vMirrorWorld.z*9.4)+sin(vMirrorWorld.z*32.9)*.25,cos(vMirrorWorld.z*10.3-vMirrorWorld.x*7.2)) * ${ripple.toFixed(7)} * vUv.w;vec4 base=texture2DProj(tDiffuse,rippleUV);`).replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',`float fresnel=.44+.56*pow(1.-abs(normalize(cameraPosition-vMirrorWorld).y),3.);gl_FragColor=vec4(base.rgb*vec3(.93,.90,.78),${opacity.toFixed(3)}*fresnel);`);
 if(name==='actual-pond-reflection'){
  // Multiscale surface slopes break the actual reflected architecture and
  // sky. The former additive amber stripes were not source reflections.
  const oldWave=`rippleUV.xy+=vec2(sin(vMirrorWorld.x*12.7+vMirrorWorld.z*9.4)+sin(vMirrorWorld.z*32.9)*.25,cos(vMirrorWorld.z*10.3-vMirrorWorld.x*7.2)) * ${ripple.toFixed(7)} * vUv.w;`;
  const wave=`vec2 wp=vMirrorWorld.xz;
  float p0=wp.x*3.7+wp.y*6.1+sin(wp.x*.87)*.8,p1=wp.x*17.3-wp.y*22.9,p2=wp.x*73.2+wp.y*51.1,p3=wp.x*147.0-wp.y*83.0;
  vec2 slope210=vec2(.004*cos(p0)*(3.7+.696*cos(wp.x*.87))+.0012*17.3*cos(p1)+.00042*73.2*cos(p2)+.00014*147.0*cos(p3),.004*6.1*cos(p0)-.0012*22.9*cos(p1)+.00042*51.1*cos(p2)-.00014*83.0*cos(p3));
  vec3 surfaceN210=normalize(vec3(-slope210.x,1.,-slope210.y));rippleUV.xy+=slope210*.022*vUv.w;`;
  o.material.fragmentShader=o.material.fragmentShader.replace(oldWave,wave);
  o.material.fragmentShader=o.material.fragmentShader.replace('float fresnel=.44+.56*pow(1.-abs(normalize(cameraPosition-vMirrorWorld).y),3.);','float fresnel=.0204+.9796*pow(1.-max(0.,dot(surfaceN210,normalize(cameraPosition-vMirrorWorld))),5.);');
 }
 if(name.includes('cedar'))o.material.fragmentShader=o.material.fragmentShader.replace('vec4 base=texture2DProj(tDiffuse,rippleUV);','vec4 base=texture2DProj(tDiffuse,rippleUV)*2.;vec4 q=rippleUV;q.x+=.004*vUv.w;base+=texture2DProj(tDiffuse,q);q.x-=.008*vUv.w;base+=texture2DProj(tDiffuse,q);q=rippleUV;q.y+=.0015*vUv.w;base+=texture2DProj(tDiffuse,q);q.y-=.003*vUv.w;base+=texture2DProj(tDiffuse,q);base/=6.;');
 const original=o.onBeforeRender;o.onBeforeRender=function(...args){
  const camera=args[2],vis=reflectors.map(r=>r.visible),cropped=camera.view?.enabled,projection=cropped?camera.projectionMatrix.clone():null,inverse=cropped?camera.projectionMatrixInverse.clone():null;
  // A genuine native subfrustum must still see the full physical reflected
  // world. Capture that projection, then restore both main-camera matrices
  // before drawing the detailed water surface. No image/crop replacement.
  if(cropped){const full=camera.clone();full.clearViewOffset();camera.projectionMatrix.copy(full.projectionMatrix);camera.projectionMatrixInverse.copy(full.projectionMatrixInverse);}
  reflectors.forEach(r=>{if(r!==o)r.visible=false;});
  try{return original.apply(this,args);}finally{if(cropped){camera.projectionMatrix.copy(projection);camera.projectionMatrixInverse.copy(inverse);}reflectors.forEach((r,i)=>r.visible=vis[i]);}
 };reflectors.push(o);scene.add(o);return o;
}
function pondGeometry(){
 const shore=pondShore210;
 const curve=new T.CatmullRomCurve3(shore.map(([x,z])=>new T.Vector3(x,0,z)),true,'centripetal');
 const points=curve.getPoints(192),shape=new T.Shape(),toLocal=p=>[p.x+16,15-p.z];
 shape.moveTo(...toLocal(points[0]));for(let i=1;i<points.length;i++)shape.lineTo(...toLocal(points[i]));shape.closePath();
 return new T.ShapeGeometry(shape,16);
}
Object.assign(mats.water,{roughness:.36,metalness:0});mats.water.color.setHex(0x13281f);mats.water.bumpMap=null;mats.water.bumpScale=0;
const waterGeometry=pondGeometry(),water=new T.Mesh(waterGeometry,mats.water);water.rotation.x=-Math.PI/2;water.position.set(-16,pondLevel210+.004,15);water.receiveShadow=true;scene.add(water);
mirror('actual-pond-reflection',61.5,61,[-16,pondLevel210+.016,15],.90,.0011,pondGeometry());
// Wet wood is the actual closed board material. Its clearcoat and captured
// scene probe replace the former single mirror6mm above the entire deck.
// Bound capture radiance before convolution: a non-finite shading sample must not
// contaminate every prefiltered roughness mip of the local environment.
const finiteCapture=`vec3 finiteRGB=gl_FragColor.rgb;if(!(finiteRGB.r>=0.0&&finiteRGB.r<10000.0))finiteRGB.r=0.0;if(!(finiteRGB.g>=0.0&&finiteRGB.g<10000.0))finiteRGB.g=0.0;if(!(finiteRGB.b>=0.0&&finiteRGB.b<10000.0))finiteRGB.b=0.0;gl_FragColor.rgb=min(finiteRGB,vec3(64.0));`;
const capturedMaterials=new Set();
scene.traverse(o=>{if(o.isMesh&&o.material&&!capturedMaterials.has(o.material)){
 const material=o.material;capturedMaterials.add(material);
 const leaf=material===mats.leaf||material===mats.leaflight||material.userData.thinLeaf,previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
 material.onBeforeCompile=shader=>{
  previous(shader);
  shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>',finiteCapture+'\n#include <tonemapping_fragment>');
  if(leaf){const transmission=material.userData.thinLeafTransmission??1.4;shader.uniforms.uLeafSun={value:sunDirection};shader.fragmentShader='uniform vec3 uLeafSun;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight+=diffuseColor.rgb*vec3(1.25,.80,.30)*'+Number(transmission).toFixed(3)+'*pow(max(0.,dot(-normal,normalize(mat3(viewMatrix)*uLeafSun))),.7);\n#include <opaque_fragment>');}
 };
 material.customProgramCacheKey=()=>key+(leaf?':scene02-thin-leaf-v3-t'+Number(material.userData.thinLeafTransmission??1.4).toFixed(3):':scene02-finite-capture-v2');material.needsUpdate=true;
}});
const scannedTimber=await installScannedTimber(mats,scene);textures.push(...scannedTimber.textures);
const timberCoat342=[['bearing',mats.hallBearing,.18,.32],['oxide',mats.hallOxide,.20,.30]].map(([role,m,clearcoat,clearcoatRoughness])=>{const original={clearcoat:m.clearcoat,clearcoatRoughness:m.clearcoatRoughness},color=m.color.toArray(),map=m.map,roughnessMap=m.roughnessMap,normalMap=m.normalMap;Object.assign(m,{clearcoat,clearcoatRoughness});m.needsUpdate=true;if(JSON.stringify(color)!==JSON.stringify(m.color.toArray())||m.map!==map||m.roughnessMap!==roughnessMap||m.normalMap!==normalMap)throw Error('Unexpected timber color/map mutation');return{role,name:m.name,original,candidate:{clearcoat,clearcoatRoughness},originalLinearColorAndAllScanMapsHeld:true,inferredAgedLacquerNotMeasurement:true};});
// A fixed radiance probe includes the actual gold lamps, red timber, pond and deep
// shadowed architecture, so close polished metal has reflected structural detail.
const environmentScene=new T.Scene(),environmentSky=sky.clone();environmentSky.material=skyMaterial.clone();environmentSky.material.uniforms.skyGain.value=.65;environmentScene.add(environmentSky);
const pmrem=new T.PMREMGenerator(renderer),skyTarget=pmrem.fromScene(environmentScene,.02,.1,250,{size:128});scene.environment=skyTarget.texture;scene.environmentIntensity=.55;
pmrem.dispose();environmentSky.material.dispose();
const probeTarget=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType}),probeCamera=new T.CubeCamera(.16,250,probeTarget);probeCamera.position.set(14,4.2,16.6);reflectors.forEach(o=>o.visible=false);scene.updateMatrixWorld(true);try{probeCamera.update(renderer,scene);}finally{reflectors.forEach(o=>o.visible=true);}
const probePmrem=new T.PMREMGenerator(renderer),envTarget=probePmrem.fromCubemap(probeTarget.texture);scene.environment=skyTarget.texture;scene.environmentIntensity=.55;probePmrem.dispose();probeTarget.dispose();scene.traverse(o=>{if(o.isMesh&&([mats.gold,mats.oldgold,mats.floor].includes(o.material)||o.material.userData.verandaMetal210)){o.material.envMap=envTarget.texture;o.material.envMapIntensity=o.material===mats.floor?1.0:.9;o.material.needsUpdate=true;}});
const hallEnvironment342=captureHallEnvironment342({scene,renderer,reflectors,mats});
if(mats.eaveGilt342){mats.eaveGilt342.envMap=envTarget.texture;mats.eaveGilt342.envMapIntensity=.9;mats.eaveGilt342.needsUpdate=true;}
const wetBoard210=installWetBoardReflection210({scene,mats,renderer,camera,reflectors,width,height});
// Ground-truth ambient occlusion resolves contacts between the actual beam, tile,
// carved bracket and garden surfaces. Noise rotations are fixed, never time driven.
const composer=new EffectComposer(renderer);composer.setSize(width,height);composer.renderTarget1.samples=4;composer.renderTarget2.samples=4;composer.addPass(new RenderPass(scene,camera));
const ao=new GTAOPass(scene,camera,width,height,undefined,{radius:.38,thickness:.48,distanceExponent:1.1,distanceFallOff:1,samples:16,scale:1.0});ao.blendIntensity=.40;
const noiseBytes=new Uint8Array(16*16*4);for(let j=0;j<256;j++){const a=(Math.sin(j*127.1+27.4)*43758.5453)%1*6.283185;noiseBytes[j*4]=(Math.cos(a)*.5+.5)*255;noiseBytes[j*4+1]=(Math.sin(a)*.5+.5)*255;noiseBytes[j*4+2]=128;noiseBytes[j*4+3]=(j*73)%255;}
const aoNoise=new T.DataTexture(noiseBytes,16,16);aoNoise.wrapS=aoNoise.wrapT=T.RepeatWrapping;aoNoise.needsUpdate=true;ao.gtaoNoiseTexture.dispose();ao.pdNoiseTexture.dispose();ao.gtaoNoiseTexture=aoNoise;ao.pdNoiseTexture=aoNoise;ao.gtaoMaterial.uniforms.tNoise.value=aoNoise;ao.pdMaterial.uniforms.tNoise.value=aoNoise;
const aoRender=ao.render.bind(ao);ao.render=(...args)=>{const callbacks=reflectors.map(o=>o.onBeforeRender);reflectors.forEach(o=>o.onBeforeRender=()=>{});wetBoard210.suspend(true);try{return aoRender(...args);}finally{wetBoard210.suspend(false);reflectors.forEach((o,i)=>o.onBeforeRender=callbacks[i]);}};
composer.addPass(ao);composer.addPass(new OutputPass());
const sourceGeometry342={meshes:0,instances:0,triangles:0};scene.traverse(o=>{if(!o.isMesh)return;sourceGeometry342.meshes++;const n=o.isInstancedMesh?o.count:1;sourceGeometry342.instances+=n;sourceGeometry342.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*n;});
let frames=0,disposed=false;
function setView(position,target,fov=52){camera.position.fromArray(position);camera.fov=fov;camera.updateProjectionMatrix();camera.lookAt(...target);camera.updateMatrixWorld(true);}
function draw(){if(disposed)throw Error('Scene disposed');wetBoard210.beginFrame();scene.updateMatrixWorld(true);renderer.setRenderTarget(null);composer.render(0);frames++;return {frame:frames,position:camera.position.toArray(),fov:camera.fov,width,height};}
function renderReference(n=2){if(n!==2)throw Error('This independent reconstruction supports reference 02 only.');setView(reference.position,reference.target,reference.fov);return draw();}
function renderView(position,target,time=0,fov=52){setView(position,target,fov);return draw();}
// Camera02 low380: a physical seven-second pullback on the walkable veranda.
// Eye height stays about0.65m above the authored deck, with a small upward
// attitude throughout; the rail remains in front of the camera, never crossed.
const dolly=createDollyPath({points:[[15.85,2.35,24.0],[15.30,2.35,25.0],[15.25,2.35,28.0],[15.30,2.35,30.0]],nearTarget:[15.193872543879204,2.43,23.368270846691118],farTarget:[-1,5.5,-7],fov:reference.fov});
function renderShot(localTime=0){const p=dolly(localTime);return renderView(p.position,p.target,localTime,p.fov);}
function info(){hallEnvironment342.snapshot?.();return{reference:2,revision:'scene02-hall368-r04-closed-carved-pediment-and-fitted-bearing',ready:true,frames,source:'Authored three-dimensional architecture and plants with declared CC0 timber and eroded stone scans; no reference-image scene surface',architecture:architecture.stats,finishes:architecturalFinishes160.info,sky210:{...sky210.info,worldSkyGain:.65,worldEnvironmentIntensity:.55},wetBoard210:wetBoard210.info(),timber:scannedTimber.info,garden:garden.stats,grounding:grounding.stats,camera:reference,water210:{pondLevelMetres:pondLevel210,actualSceneReflection:true,subfrustumReflectionCaptureFixed:true,additiveStripeGeometryRemoved:true,waveModel:'Analytic normals of four metric millimetre/submillimetre wave heights perturb the genuine reflected scene; dielectricF0.0204 Schlick response, no painted glints',bridgeBounce:{position:bridgeBounce210.position.toArray(),intensity:bridgeBounce210.intensity,width:bridgeBounce210.width,height:bridgeBounce210.height},solvedDiffuseGI:false},sourceGeometry342,lighting342:{timberCoat:timberCoat342,courtyardBoundary:courtyardBoundary342,hallEnvironment:hallEnvironment342.info,exposureHeld:.94,sunDirectionHeld:true,sourceRGBAndEnergyInferredNotMeasured:true},lighting170:{sun:sun.intensity,exposure:renderer.toneMappingExposure,courtyardArea:{intensity:courtArea.intensity,width:courtArea.width,height:courtArea.height,position:courtArea.position.toArray()},westArea:{intensity:westArea.intensity,width:westArea.width,height:westArea.height,position:westArea.position.toArray()},nativeAreaContact:"LTC area light plus geometry-derived GTAO; shadowed direct sun retained"},renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},limits:['Visual acceptance pending independent reference comparison.','CC0 scanned timber maps with tracked provenance; no photograph or generated replacement frame is used.','Layout is recovered from visible native contours; source perspective and partly occluded geometry retain uncertainty.','Veranda board end joints and concealed framing are inferred where the source photo does not resolve them.'],visualAcceptance:false};}
function dispose(){disposed=true;hallEnvironment342.dispose();wetBoard210.dispose();garden.dispose?.();scene.traverse(o=>{if(o.isMesh)o.geometry.dispose();});new Set([...Object.values(mats),...scene.children.filter(o=>o.material).map(o=>o.material)]).forEach(m=>m.dispose());textures.forEach(t=>t.dispose());reflectors.forEach(r=>r.getRenderTarget().dispose());envTarget.dispose();skyTarget.dispose();ao.dispose();composer.dispose();renderer.dispose();}
window.temple={ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info,dispose};document.querySelector('#loading')?.remove();setView(reference.position,reference.target,reference.fov);if(!query.has('defer'))renderReference(2);
