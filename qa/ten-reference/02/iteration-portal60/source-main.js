import {T,V,materials} from './kernel.js';
import {installScannedTimber} from './scanned-timber.js';
import {buildPagodaGrounding} from './pagoda-ground.js';
import {buildArchitecture} from './architecture.js';
import {buildGarden} from './garden.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const query=new URLSearchParams(location.search),width=Math.min(2048,Math.max(64,Number(query.get('w'))||960)),height=Math.min(2048,Math.max(64,Number(query.get('h'))||960));
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setSize(width,height);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;document.body.append(renderer.domElement);
const scene=new T.Scene();scene.name='reference02-completely-rebuilt-veranda';scene.fog=new T.FogExp2(0xd3b181,.005);
const {mats,textures}=materials();mats.slate.side=T.DoubleSide;
const architecture=buildArchitecture(mats),garden=buildGarden(mats),grounding=buildPagodaGrounding(mats);scene.add(architecture.group,garden.group,grounding.group,...architecture.lights,...garden.lights);
const sunDirection=V([-.87,.23,-.75]).normalize();
// A procedural atmosphere: directional high-frequency cloud structure, atmospheric gradient,
// physically located luminous sun. No image assets or screen-facing photographic geometry.
const skyMaterial=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{sun:{value:sunDirection},skyGain:{value:1}},vertexShader:`varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,fragmentShader:`
varying vec3 vWorld;uniform vec3 sun;uniform float skyGain;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return .5*noise(p)+.25*noise(p*2.03)+.125*noise(p*4.13)+.0625*noise(p*8.31);}
void main(){vec3 d=normalize(vWorld-cameraPosition);float h=max(d.y,0.),nearSun=pow(max(0.,dot(d,sun)),56.);vec3 color=mix(vec3(1.22,.35,.035),vec3(.24,.31,.42),smoothstep(.015,.33,h));color=mix(color,vec3(2.4,.62,.008),nearSun*.85);float glow=pow(max(0.,dot(d,sun)),190.);color+=vec3(3.3,.62,.006)*glow;float disc=smoothstep(.99987,.99993,dot(d,sun));
if(d.y>.035){float lo=2.2/d.y,hi=3.4/d.y,stepLength=(hi-lo)/10.;float trans=1.;vec3 scattered=vec3(0.);for(int j=0;j<10;j++){vec3 cp=d*(lo+(float(j)+.5)*stepLength);float shape=smoothstep(2.2,2.48,cp.y)*smoothstep(3.4,3.03,cp.y);float n=fbm(cp*3.0+vec3(1.1,0.,2.));float coverage=smoothstep(.46,.60,fbm(vec3(cp.x*.85,1.3,cp.z*.85)));float density=smoothstep(.52,.68,n)*shape*coverage;float sunNoise=fbm((cp+sun*.32)*3.0+vec3(1.1,0.,2.));float selfShadow=exp(-4.5*smoothstep(.52,.68,sunNoise));vec3 scattering=mix(vec3(.13,.20,.32),vec3(3.0,1.12,.18),.20+.80*selfShadow)*(.70+.30*nearSun);float opacity=1.-exp(-density*stepLength*4.0);scattered+=trans*opacity*scattering;trans*=1.-opacity;}color=color*trans+scattered;}color+=vec3(10.,7.,2.3)*disc;gl_FragColor=vec4(color*skyGain,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>}
`});
// Shader include directives must start on their own lines.
skyMaterial.fragmentShader=skyMaterial.fragmentShader.replace(';#include',';\n#include');
const sky=new T.Mesh(new T.SphereGeometry(220,40,24),skyMaterial);sky.name='procedural-golden-cloud-atmosphere';scene.add(sky);
const sun=new T.DirectionalLight(0xffddb0,8.5);sun.target.position.set(-2,4,0);sun.position.copy(sun.target.position).add(sunDirection.clone().multiplyScalar(90));sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-34,right:34,top:34,bottom:-34,near:1,far:125});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00008;sun.shadow.normalBias=.008;sun.shadow.radius=2;sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;scene.add(sun,sun.target);
scene.add(new T.HemisphereLight(0xc6d5e8,0x3c3023,.10));const frontFill=new T.DirectionalLight(0xd3deec,.08);frontFill.position.set(18,26,25);scene.add(frontFill);const pondBounce=new T.DirectionalLight(0xffd09a,.18);pondBounce.name='soft-pond-bounce-approximation';pondBounce.position.set(-20,3.5,20);pondBounce.target.position.set(-1,5,-7);scene.add(pondBounce,pondBounce.target);
const camera=new T.PerspectiveCamera(52,width/height,.12,300);
const reference={position:[16.2,2.72,25],target:[-1.0,4.7,-7],fov:52};
const reflectors=[];
function mirror(name,w,d,p,opacity=.8,ripple=.0015){
 const o=new Reflector(new T.PlaneGeometry(w,d),{textureWidth:Math.min(width,1024),textureHeight:Math.min(height,1024),clipBias:.004,color:0x9a9a9a,multisample:0});o.rotation.x=-Math.PI/2;o.position.fromArray(p);o.name=name;o.material.transparent=true;o.material.depthWrite=false;
 o.material.vertexShader=o.material.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv;varying vec3 vMirrorWorld;').replace('void main() {','void main() {vMirrorWorld=(modelMatrix*vec4(position,1.)).xyz;');
 o.material.fragmentShader=o.material.fragmentShader.replace('varying vec4 vUv;','varying vec4 vUv;varying vec3 vMirrorWorld;').replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec4 rippleUV=vUv;rippleUV.xy+=vec2(sin(vMirrorWorld.x*12.7+vMirrorWorld.z*9.4)+sin(vMirrorWorld.z*32.9)*.25,cos(vMirrorWorld.z*10.3-vMirrorWorld.x*7.2)) * ${ripple.toFixed(7)} * vUv.w;vec4 base=texture2DProj(tDiffuse,rippleUV);`).replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',`float fresnel=.44+.56*pow(1.-abs(normalize(cameraPosition-vMirrorWorld).y),3.);gl_FragColor=vec4(base.rgb*vec3(.93,.90,.78),${opacity.toFixed(3)}*fresnel);`);
 if(name.includes('cedar'))o.material.fragmentShader=o.material.fragmentShader.replace('vec4 base=texture2DProj(tDiffuse,rippleUV);','vec4 base=texture2DProj(tDiffuse,rippleUV)*2.;vec4 q=rippleUV;q.x+=.004*vUv.w;base+=texture2DProj(tDiffuse,q);q.x-=.008*vUv.w;base+=texture2DProj(tDiffuse,q);q=rippleUV;q.y+=.0015*vUv.w;base+=texture2DProj(tDiffuse,q);q.y-=.003*vUv.w;base+=texture2DProj(tDiffuse,q);base/=6.;');
 const original=o.onBeforeRender;o.onBeforeRender=function(...args){let vis=reflectors.map(r=>r.visible);reflectors.forEach(r=>{if(r!==o)r.visible=false;});try{return original.apply(this,args);}finally{reflectors.forEach((r,i)=>r.visible=vis[i]);}};reflectors.push(o);scene.add(o);return o;
}
const water=new T.Mesh(new T.PlaneGeometry(61.5,61),mats.water);water.rotation.x=-Math.PI/2;water.position.set(-16,.004,15);water.receiveShadow=true;scene.add(water);
mirror('actual-pond-reflection',61.5,61,[-16,.016,15],.97,.0012);
mirror('wet-cedar-veranda-reflection',5.9,30,[17.35,1.356,24],.71,.00012);
// Bound capture radiance before convolution: a non-finite shading sample must not
// contaminate every prefiltered roughness mip of the local environment.
const finiteCapture=`vec3 finiteRGB=gl_FragColor.rgb;if(!(finiteRGB.r>=0.0&&finiteRGB.r<10000.0))finiteRGB.r=0.0;if(!(finiteRGB.g>=0.0&&finiteRGB.g<10000.0))finiteRGB.g=0.0;if(!(finiteRGB.b>=0.0&&finiteRGB.b<10000.0))finiteRGB.b=0.0;gl_FragColor.rgb=min(finiteRGB,vec3(64.0));`;
scene.traverse(o=>{if(o.isMesh&&o.material){const leaf=o.material===mats.leaf||o.material===mats.leaflight;o.material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>',finiteCapture+'\n#include <tonemapping_fragment>');if(leaf){shader.uniforms.uLeafSun={value:sunDirection};shader.fragmentShader='uniform vec3 uLeafSun;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight+=diffuseColor.rgb*vec3(1.25,.80,.30)*1.4*pow(max(0.,dot(-normal,normalize(mat3(viewMatrix)*uLeafSun))),.7);\n#include <opaque_fragment>');}};o.material.customProgramCacheKey=()=>leaf?'scene02-thin-leaf-v1':'scene02-finite-capture-v1';o.material.needsUpdate=true;}});
const scannedTimber=await installScannedTimber(mats,scene);textures.push(...scannedTimber.textures);
// A fixed radiance probe includes the actual gold lamps, red timber, pond and deep
// shadowed architecture, so close polished metal has reflected structural detail.
const environmentScene=new T.Scene(),environmentSky=sky.clone();environmentSky.material=skyMaterial.clone();environmentSky.material.uniforms.skyGain.value=1.0;environmentSky.material.fragmentShader=`varying vec3 vWorld;uniform float skyGain;void main(){vec3 d=normalize(vWorld-cameraPosition);vec3 radiance=mix(vec3(.018,.015,.010),vec3(.28,.38,.52),smoothstep(-.04,.16,d.y));radiance*=.68+.32*sqrt(max(d.y,0.));gl_FragColor=vec4(radiance*skyGain,1.);}`;environmentScene.add(environmentSky);
const pmrem=new T.PMREMGenerator(renderer),skyTarget=pmrem.fromScene(environmentScene,.02,.1,250,{size:128});scene.environment=skyTarget.texture;scene.environmentIntensity=.9;
pmrem.dispose();environmentSky.material.dispose();
const probeTarget=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType}),probeCamera=new T.CubeCamera(.16,250,probeTarget);probeCamera.position.set(14,4.2,16.6);reflectors.forEach(o=>o.visible=false);scene.updateMatrixWorld(true);try{probeCamera.update(renderer,scene);}finally{reflectors.forEach(o=>o.visible=true);}
const probePmrem=new T.PMREMGenerator(renderer),envTarget=probePmrem.fromCubemap(probeTarget.texture);scene.environment=skyTarget.texture;scene.environmentIntensity=.9;probePmrem.dispose();probeTarget.dispose();scene.traverse(o=>{if(o.isMesh&&[mats.gold,mats.oldgold,mats.floor].includes(o.material)){o.material.envMap=envTarget.texture;o.material.envMapIntensity=o.material===mats.floor?.65:.9;o.material.needsUpdate=true;}});
// Ground-truth ambient occlusion resolves contacts between the actual beam, tile,
// carved bracket and garden surfaces. Noise rotations are fixed, never time driven.
const composer=new EffectComposer(renderer);composer.setSize(width,height);composer.renderTarget1.samples=4;composer.renderTarget2.samples=4;composer.addPass(new RenderPass(scene,camera));
const ao=new GTAOPass(scene,camera,width,height,undefined,{radius:.28,thickness:.4,distanceExponent:1.1,distanceFallOff:1,samples:16,scale:1.0});ao.blendIntensity=.30;
const noiseBytes=new Uint8Array(16*16*4);for(let j=0;j<256;j++){const a=(Math.sin(j*127.1+27.4)*43758.5453)%1*6.283185;noiseBytes[j*4]=(Math.cos(a)*.5+.5)*255;noiseBytes[j*4+1]=(Math.sin(a)*.5+.5)*255;noiseBytes[j*4+2]=128;noiseBytes[j*4+3]=(j*73)%255;}
const aoNoise=new T.DataTexture(noiseBytes,16,16);aoNoise.wrapS=aoNoise.wrapT=T.RepeatWrapping;aoNoise.needsUpdate=true;ao.gtaoNoiseTexture.dispose();ao.pdNoiseTexture.dispose();ao.gtaoNoiseTexture=aoNoise;ao.pdNoiseTexture=aoNoise;ao.gtaoMaterial.uniforms.tNoise.value=aoNoise;ao.pdMaterial.uniforms.tNoise.value=aoNoise;
const aoRender=ao.render.bind(ao);ao.render=(...args)=>{const callbacks=reflectors.map(o=>o.onBeforeRender);reflectors.forEach(o=>o.onBeforeRender=()=>{});try{return aoRender(...args);}finally{reflectors.forEach((o,i)=>o.onBeforeRender=callbacks[i]);}};
composer.addPass(ao);composer.addPass(new OutputPass());
let frames=0,disposed=false;
function setView(position,target,fov=52){camera.position.fromArray(position);camera.fov=fov;camera.updateProjectionMatrix();camera.lookAt(...target);camera.updateMatrixWorld(true);}
function draw(){if(disposed)throw Error('Scene disposed');scene.updateMatrixWorld(true);renderer.setRenderTarget(null);composer.render(0);frames++;return {frame:frames,position:camera.position.toArray(),fov:camera.fov,width,height};}
function renderReference(n=2){if(n!==2)throw Error('This independent reconstruction supports reference 02 only.');setView(reference.position,reference.target,reference.fov);return draw();}
function renderView(position,target,time=0,fov=52){setView(position,target,fov);return draw();}
function renderShot(localTime=0){let t=Math.max(0,Math.min(1,localTime/7)),u=t*t*(3-2*t);setView([T.MathUtils.lerp(15.8,16.2,u),T.MathUtils.lerp(2.48,2.72,u),T.MathUtils.lerp(21.8,25,u)],[-1,T.MathUtils.lerp(4.4,4.7,u),-7],T.MathUtils.lerp(47,52,u));return draw();}
function info(){return{reference:2,revision:'scene02-open-altar-bay-60',ready:true,frames,source:'actual procedural three-dimensional geometry only',architecture:architecture.stats,garden:garden.stats,grounding:grounding.stats,camera:reference,renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},limits:['Visual acceptance pending independent reference comparison.','CC0 scanned timber maps with tracked provenance; no photograph or generated replacement frame is used.'],visualAcceptance:false};}
function dispose(){disposed=true;scene.traverse(o=>{if(o.isMesh)o.geometry.dispose();});new Set([...Object.values(mats),...scene.children.filter(o=>o.material).map(o=>o.material)]).forEach(m=>m.dispose());textures.forEach(t=>t.dispose());reflectors.forEach(r=>r.getRenderTarget().dispose());envTarget.dispose();skyTarget.dispose();ao.dispose();composer.dispose();renderer.dispose();}
window.temple={ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info,dispose};document.querySelector('#loading')?.remove();setView(reference.position,reference.target,reference.fov);if(!query.has('defer'))renderReference(2);
