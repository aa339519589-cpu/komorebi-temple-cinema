import {T,V,materials} from './kernel.js';
import {buildArchitecture} from './architecture.js';
import {buildGarden} from './garden.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
const query=new URLSearchParams(location.search),width=Math.min(2048,Math.max(64,Number(query.get('w'))||960)),height=Math.min(2048,Math.max(64,Number(query.get('h'))||960));
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setSize(width,height);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;document.body.append(renderer.domElement);
const scene=new T.Scene();scene.name='reference02-completely-rebuilt-veranda';scene.fog=new T.FogExp2(0xc4a47b,.005);
const {mats,textures}=materials();mats.slate.side=T.DoubleSide;
const architecture=buildArchitecture(mats),garden=buildGarden(mats);scene.add(architecture.group,garden.group,...architecture.lights,...garden.lights);
const sunDirection=V([-.87,.23,-.75]).normalize();
// A procedural atmosphere: directional high-frequency cloud structure, atmospheric gradient,
// physically located luminous sun. No image assets or screen-facing photographic geometry.
const skyMaterial=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{sun:{value:sunDirection},skyGain:{value:1}},vertexShader:`varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,fragmentShader:`
varying vec3 vWorld;uniform vec3 sun;uniform float skyGain;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return .5*noise(p)+.25*noise(p*2.03)+.125*noise(p*4.13)+.0625*noise(p*8.31);}
void main(){vec3 d=normalize(vWorld-cameraPosition);float h=max(d.y,0.),nearSun=pow(max(0.,dot(d,sun)),7.);vec3 color=mix(vec3(1.12,.44,.10),vec3(.16,.29,.50),smoothstep(0.,.40,h));color=mix(color,vec3(1.8,.82,.21),nearSun*.26);float glow=pow(max(0.,dot(d,sun)),42.);color+=vec3(1.2,.65,.18)*glow;float disc=smoothstep(.99987,.99993,dot(d,sun));
vec3 p=d/max(.12,d.y)*3.4;float cloud=fbm(p*3.0+vec3(1.1,0,2));float detail=noise(p*25.);float mask=smoothstep(.50,.62,cloud+.05*detail)*smoothstep(.035,.12,h);float relief=fbm(p*3.0+sun*.55+vec3(1.1,0,2));vec3 lit=mix(vec3(.24,.27,.36),vec3(2.2,1.02,.35),smoothstep(.39,.61,relief)*(.5+.5*nearSun));color=mix(color,lit,mask*.90);color+=vec3(10.,7.,2.3)*disc;gl_FragColor=vec4(color*skyGain,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>}
`});
// Shader include directives must start on their own lines.
skyMaterial.fragmentShader=skyMaterial.fragmentShader.replace(';#include',';\n#include');
const sky=new T.Mesh(new T.SphereGeometry(220,40,24),skyMaterial);sky.name='procedural-golden-cloud-atmosphere';scene.add(sky);
const sun=new T.DirectionalLight(0xffbc68,4.2);sun.position.copy(sunDirection.clone().multiplyScalar(70));sun.target.position.set(-2,4,0);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-34,right:34,top:34,bottom:-34,near:1,far:125});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00008;sun.shadow.normalBias=.015;sun.shadow.radius=2;sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;scene.add(sun,sun.target);
scene.add(new T.HemisphereLight(0xc4d3eb,0x684b31,.52));const frontFill=new T.DirectionalLight(0xc9d8ef,.72);frontFill.position.set(18,26,25);scene.add(frontFill);
const camera=new T.PerspectiveCamera(52,width/height,.12,300);
const reference={position:[16.2,2.72,25],target:[-1.0,4.7,-7],fov:52};
const reflectors=[];
function mirror(name,w,d,p,opacity=.8,ripple=.0015){
 const o=new Reflector(new T.PlaneGeometry(w,d),{textureWidth:Math.min(width,1024),textureHeight:Math.min(height,1024),clipBias:.004,color:0x9a9a9a,multisample:0});o.rotation.x=-Math.PI/2;o.position.fromArray(p);o.name=name;o.material.transparent=true;o.material.depthWrite=false;
 o.material.vertexShader=o.material.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv;varying vec3 vMirrorWorld;').replace('void main() {','void main() {vMirrorWorld=(modelMatrix*vec4(position,1.)).xyz;');
 o.material.fragmentShader=o.material.fragmentShader.replace('varying vec4 vUv;','varying vec4 vUv;varying vec3 vMirrorWorld;').replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec4 rippleUV=vUv;rippleUV.xy+=vec2(sin(vMirrorWorld.x*12.7+vMirrorWorld.z*9.4)+sin(vMirrorWorld.z*32.9)*.25,cos(vMirrorWorld.z*10.3-vMirrorWorld.x*7.2)) * ${ripple.toFixed(7)} * vUv.w;vec4 base=texture2DProj(tDiffuse,rippleUV);`).replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',`float fresnel=.44+.56*pow(1.-abs(normalize(cameraPosition-vMirrorWorld).y),3.);gl_FragColor=vec4(base.rgb*vec3(.93,.90,.78),${opacity.toFixed(3)}*fresnel);`);
 const original=o.onBeforeRender;o.onBeforeRender=function(...args){let vis=reflectors.map(r=>r.visible);reflectors.forEach(r=>{if(r!==o)r.visible=false;});try{return original.apply(this,args);}finally{reflectors.forEach((r,i)=>r.visible=vis[i]);}};reflectors.push(o);scene.add(o);return o;
}
const water=new T.Mesh(new T.PlaneGeometry(61.5,61),mats.water);water.rotation.x=-Math.PI/2;water.position.set(-16,.004,15);water.receiveShadow=true;scene.add(water);
mirror('actual-pond-reflection',61.5,61,[-16,.016,15],.97,.0012);
mirror('wet-cedar-veranda-reflection',5.9,30,[17.35,1.356,24],.71,.00012);
// A fixed radiance probe includes the actual gold lamps, red timber, pond and deep
// shadowed architecture, so close polished metal has reflected structural detail.
const environmentScene=new T.Scene(),environmentSky=sky.clone();environmentSky.material=skyMaterial.clone();environmentSky.material.uniforms.skyGain.value=.78;environmentScene.add(environmentSky);
const pmrem=new T.PMREMGenerator(renderer),skyTarget=pmrem.fromScene(environmentScene,.02,.1,250,{size:128});scene.environment=skyTarget.texture;scene.environmentIntensity=.88;
pmrem.dispose();environmentSky.material.dispose();
const probeTarget=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType}),probeCamera=new T.CubeCamera(.16,250,probeTarget);probeCamera.position.set(14,4.2,16.6);reflectors.forEach(o=>o.visible=false);scene.updateMatrixWorld(true);try{probeCamera.update(renderer,scene);}finally{reflectors.forEach(o=>o.visible=true);}
const probePmrem=new T.PMREMGenerator(renderer),envTarget=probePmrem.fromCubemap(probeTarget.texture);scene.environment=envTarget.texture;scene.environmentIntensity=.9;probePmrem.dispose();probeTarget.dispose();scene.traverse(o=>{if(o.isMesh&&o.material?.isMeshStandardMaterial){o.material.envMap=envTarget.texture;o.material.needsUpdate=true;}});
let frames=0,disposed=false;
function setView(position,target,fov=52){camera.position.fromArray(position);camera.fov=fov;camera.updateProjectionMatrix();camera.lookAt(...target);camera.updateMatrixWorld(true);}
function draw(){if(disposed)throw Error('Scene disposed');scene.updateMatrixWorld(true);renderer.setRenderTarget(null);renderer.render(scene,camera);frames++;return {frame:frames,position:camera.position.toArray(),fov:camera.fov,width,height};}
function renderReference(n=2){if(n!==2)throw Error('This independent reconstruction supports reference 02 only.');setView(reference.position,reference.target,reference.fov);return draw();}
function renderView(position,target,time=0,fov=52){setView(position,target,fov);return draw();}
function renderShot(localTime=0){let t=Math.max(0,Math.min(1,localTime/7)),u=t*t*(3-2*t);setView([T.MathUtils.lerp(15.8,16.2,u),T.MathUtils.lerp(2.48,2.72,u),T.MathUtils.lerp(21.8,25,u)],[-1,T.MathUtils.lerp(4.4,4.7,u),-7],T.MathUtils.lerp(47,52,u));return draw();}
function info(){return{reference:2,revision:'scene02-photo-rebuild-06',ready:true,frames,source:'actual procedural three-dimensional geometry only',architecture:architecture.stats,garden:garden.stats,camera:reference,renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},limits:['Visual acceptance pending independent reference comparison.','No external textures, models, HDR maps, image backgrounds or AI visuals.'],visualAcceptance:false};}
function dispose(){disposed=true;scene.traverse(o=>{if(o.isMesh)o.geometry.dispose();});new Set([...Object.values(mats),...scene.children.filter(o=>o.material).map(o=>o.material)]).forEach(m=>m.dispose());textures.forEach(t=>t.dispose());reflectors.forEach(r=>r.getRenderTarget().dispose());envTarget.dispose();skyTarget.dispose();renderer.dispose();}
window.temple={ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info,dispose};document.querySelector('#loading')?.remove();setView(reference.position,reference.target,reference.fov);if(!query.has('defer'))renderReference(2);
