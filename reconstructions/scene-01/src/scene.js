import * as T from 'three';
import {installScannedTimber} from './scanned-timber.js';
import {loadBlenderJoinery} from './blender-joinery.js';
import {loadScannedGardenStones} from './scanned-garden-stones.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {Builder,materialSet,V,noise,rng,TAU} from './kernel.js';
import {architecture} from './architecture.js';
import {garden} from './garden.js';
import {loadMeasuredSky} from './measured-sky.js';
import {createDistantLandscape} from './distant-landscape.js';
import {layout124 as L} from './layout124.js';
import {installHardwareMaterials131} from './foreground-hardware131.js';
import {loadCarvedSources185} from './carved-sources185.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
export const CAMERA={position:[0,3.20,17],target:[0,6.20,-13],fov:59,near:.1,far:260,deckY:1.8,eyeAboveDeck:1.4};
// One fixed angular direction drives the sun, sky and leaf transmission.
const sunCamera=new T.PerspectiveCamera(CAMERA.fov,1,CAMERA.near,CAMERA.far);sunCamera.position.fromArray(CAMERA.position);sunCamera.lookAt(...CAMERA.target);sunCamera.updateMatrixWorld(true);
export const SUN_DIRECTION=new T.Vector3(185/1254*2-1,1-496/1254*2,.5).unproject(sunCamera).sub(sunCamera.position).normalize();
const waterShader={name:'garden-ripple-planar-reflection',uniforms:{color:{value:new T.Color(0x324634)},tDiffuse:{value:null},textureMatrix:{value:null},time:{value:0}},vertexShader:`uniform mat4 textureMatrix;
varying vec4 vUv;
varying vec3 vWorld;
void main(){
  vUv=textureMatrix*vec4(position,1.);
  vWorld=(modelMatrix*vec4(position,1.)).xyz;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}`,fragmentShader:`uniform sampler2D tDiffuse;
uniform vec3 color;
uniform float time;
varying vec4 vUv;
varying vec3 vWorld;

float waterHash(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
float waterNoise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.-2.*f);
  float a=waterHash(i),b=waterHash(i+vec2(1.,0.));
  float c=waterHash(i+vec2(0.,1.)),d=waterHash(i+vec2(1.,1.));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
void main(){
  vec2 p=vWorld.xz;

  // Layered slow swells, cross-ripples, and capillary waves share one
  // continuous surface; analytic slopes keep reflection motion coherent.
  vec2 slope=vec2(0.);
  float phase=dot(p,vec2(.76,.65))*.48+time*.105;
  slope+=.050*.48*cos(phase)*vec2(.76,.65);
  phase=dot(p,vec2(.38,-.92))*.73-time*.072;
  slope+=.031*.73*cos(phase)*vec2(.38,-.92);
  phase=dot(p,vec2(.91,.41))*2.25+time*.125;
  slope+=.010*2.25*cos(phase)*vec2(.91,.41);
  phase=dot(p,vec2(.54,-.84))*3.65-time*.094;
  slope+=.0065*3.65*cos(phase)*vec2(.54,-.84);
  phase=dot(p,vec2(.82,.57))*14.0+time*.036;
  slope+=.0018*14.0*cos(phase)*vec2(.82,.57);
  phase=dot(p,vec2(.36,-.93))*20.0-time*.029;
  slope+=.0010*20.0*cos(phase)*vec2(.36,-.93);

  vec2 uv=vUv.xy/vUv.w;
  vec2 warp=vec2(slope.x+.22*slope.y,slope.y-.18*slope.x);
  uv+=warp*vec2(.016,-.010);
  float roughnessField=.58*waterNoise(p*.78+vec2(2.7,8.1))
                     +.29*waterNoise(p*1.85-vec2(4.2,1.6))
                     +.13*waterNoise(p*4.1+vec2(6.4,2.3));
  float roughness=.25+.24*roughnessField;
  float blurScale=.58+roughness*1.38;
  vec2 blurNear=vec2(.00065,.00095)*blurScale;
  vec2 blurFar=vec2(.0021,.0032)*blurScale;
  vec3 reflection=texture2D(tDiffuse,uv).rgb*.52;
  reflection+=(texture2D(tDiffuse,uv+vec2(blurNear.x,0.)).rgb
              +texture2D(tDiffuse,uv-vec2(blurNear.x,0.)).rgb
              +texture2D(tDiffuse,uv+vec2(0.,blurNear.y)).rgb
              +texture2D(tDiffuse,uv-vec2(0.,blurNear.y)).rgb)*.075;
  reflection+=(texture2D(tDiffuse,uv+blurFar).rgb
              +texture2D(tDiffuse,uv-blurFar).rgb
              +texture2D(tDiffuse,uv+vec2(blurFar.x,-blurFar.y)).rgb
              +texture2D(tDiffuse,uv+vec2(-blurFar.x,blurFar.y)).rgb)*.045;
  float reflectedLum=dot(reflection,vec3(.2126,.7152,.0722));
  reflection=mix(reflection,vec3(reflectedLum),.035)
            *vec3(1.045,.995,.91)*(1.07+.08*roughnessField);

  vec3 rippleNormal=normalize(vec3(-slope.x,1.,-slope.y));
  vec3 viewDirection=normalize(cameraPosition-vWorld);
  float nDotV=max(dot(rippleNormal,viewDirection),0.);
  float fresnelTerm=pow(1.-nDotV,5.);
  vec3 f0=vec3(.020,.022,.024);
  vec3 fresnel=f0+(vec3(1.)-f0)*fresnelTerm;
  // The small microfacet floor keeps broken wave reflections readable;
  // the water body itself remains dark green.
  float reflectance=clamp(.055+fresnel.r*1.20,.07,.97);
  vec3 base=vec3(.010,.020,.012);
  vec3 outc=mix(base,reflection*1.16,reflectance);

  // Soft sunset paths support the specular flecks without drawing a stripe.
  float sunsetPath=p.x+4.4+.12*(p.y-3.)+.24*sin(p.y*.17);
  float sunsetTrail=exp(-pow(sunsetPath/4.7,2.))
                  *smoothstep(-8.,-2.,p.y)*(1.-smoothstep(13.,19.,p.y));
  float centerPath=p.x-(1.65+.095*(p.y-3.)+.18*sin(p.y*.22+1.));
  float centerTrail=exp(-pow(centerPath/3.25,2.))
                  *smoothstep(-7.,-1.,p.y)*(1.-smoothstep(14.,19.,p.y));
  float waterBreakup=.48+.52*waterNoise(p*.92+vec2(11.3,4.7));
  outc+=vec3(.042,.017,.0045)*sunsetTrail*waterBreakup;
  outc+=vec3(.027,.010,.0025)*centerTrail*waterBreakup;

  // Static world-space flecks break both reflection paths into fine fragments.
  // Their placement is independent of time, so they cannot flicker or crawl.
  vec2 grid=p/vec2(.34,.52);
  vec2 cell=floor(grid),local=fract(grid);
  float seed=waterHash(cell);
  vec2 center=vec2(.15+.70*waterHash(cell+vec2(7.1,1.7)),
                   .14+.72*waterHash(cell+vec2(2.9,8.3)));
  vec2 q=local-center;
  float angle=(waterHash(cell+vec2(5.6,3.2))-.5)*.52;
  q=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*q;
  float width=.12+.20*waterHash(cell+vec2(8.4,6.1));
  float length=.055+.095*waterHash(cell+vec2(3.3,9.8));
  float fragment=(1.-smoothstep(width*.48,width,abs(q.x)))
                *(1.-smoothstep(length*.42,length,abs(q.y)));
  float trailMask=max(.72*sunsetTrail,centerTrail);
  float sparse=smoothstep(.31,.83,seed);
  float brokenEdge=.58+.42*waterNoise(p*2.3+cell*1.7);
  float amberFragments=fragment*sparse*trailMask*brokenEdge;
  outc+=vec3(1.0,.43,.105)*amberFragments*(.13+.10*roughnessField);

  // Energy-limited GGX sun glints stay tied to the moving ripple normal.
  vec3 sunDirection=normalize(vec3(-.373972,.114733,-.920316));
  vec3 halfVector=normalize(viewDirection+sunDirection);
  float nDotL=max(dot(rippleNormal,sunDirection),0.);
  float nDotH=max(dot(rippleNormal,halfVector),0.);
  float vDotH=max(dot(viewDirection,halfVector),0.);
  float alpha=roughness*roughness;
  float alpha2=alpha*alpha;
  float denom=nDotH*nDotH*(alpha2-1.)+1.;
  float distribution=alpha2/max(3.14159265*denom*denom,.0001);
  float k=(alpha+1.)*(alpha+1.)*.125;
  float geometryV=nDotV/(nDotV*(1.-k)+k);
  float geometryL=nDotL/(nDotL*(1.-k)+k);
  float directFresnel=.020+.98*pow(1.-vDotH,5.);
  float sunGlint=distribution*geometryV*geometryL*directFresnel
                /max(4.*nDotV*nDotL,.06);
  outc+=vec3(1.0,.58,.25)*min(sunGlint*.022,.12);

  gl_FragColor=vec4(outc,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`};

export async function buildScene({width=768,height=768}={}){const scene=new T.Scene();scene.name='Reference 01: sunset temple pond from low veranda';scene.fog=new T.FogExp2(0xc6a27a,.0048);const mats=materialSet();
// Continuous 3D weathering breaks the old flat-colored stone and painted wood.
const weatherNoise=`float wh(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}float wn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(wh(i),wh(i+vec3(1,0,0)),f.x),mix(wh(i+vec3(0,1,0)),wh(i+vec3(1,1,0)),f.x),f.y),mix(mix(wh(i+vec3(0,0,1)),wh(i+vec3(1,0,1)),f.x),mix(wh(i+vec3(0,1,1)),wh(i+vec3(1,1,1)),f.x),f.y),f.z);}float wf(vec3 p){return .57*wn(p)+.28*wn(p*2.07+4.1)+.15*wn(p*4.17+7.2);}`;
for(const key of['rock','rockWet','stone','stoneLight']){mats[key].onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vRockPosition;varying vec3 vRockNormal;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRockPosition=position;vRockNormal=normal;');shader.fragmentShader='varying vec3 vRockPosition;varying vec3 vRockNormal;'+weatherNoise+'\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float grain=wn(vRockPosition*165.);float mineral=wf(vRockPosition*28.);diffuseColor.rgb*=.76+.40*grain;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.18,.17,.12),smoothstep(.66,.79,mineral)*.40);float mossNoise=wf(vRockPosition*5.5);float moss=smoothstep(.58,.88,vRockNormal.y*.39+mossNoise*.80);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.022,.042,.006)*( .64+.50*mineral),moss*${key.startsWith('rock')?'.92':'.46'});`);};mats[key].customProgramCacheKey=()=>key+'-continuous-weathering-v3';}
for(const key of['wood','red','redLight','darkwood','endwood']){mats[key].onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vAgedPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
vec4 ageWorld=vec4(transformed,1.);
#ifdef USE_INSTANCING
ageWorld=instanceMatrix*ageWorld;
#endif
vAgedPosition=(modelMatrix*ageWorld).xyz;`);shader.fragmentShader='varying vec3 vAgedPosition;'+weatherNoise+'\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float age=wf(vAgedPosition*vec3(3.1,.32,3.1));float chip=wf(vAgedPosition*38.);diffuseColor.rgb*=.73+.40*age;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.17,.084,.031),smoothstep(.72,.83,chip)*.16);`);};mats[key].customProgramCacheKey=()=>key+'-old-painted-wood-v3';}
for(const key of['leaf','leafLight','leafDark','lotusLeaf','mapleLeaf','mapleLight','mapleDark','pineLeaf','vineLeaf']){mats[key].onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <shadowmap_pars_fragment>','#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>');shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
vec3 leafSunView=normalize((viewMatrix*vec4(${SUN_DIRECTION.x.toFixed(7)},${SUN_DIRECTION.y.toFixed(7)},${SUN_DIRECTION.z.toFixed(7)},0.)).xyz);float transmitted=pow(max(0.,-dot(normal,leafSunView)),.75);totalEmissiveRadiance+=diffuseColor.rgb*vec3(1.5,.93,.18)*transmitted*mix(.32,1.,getShadowMask())*${key==='lotusLeaf'?'.14':key.startsWith('maple')?'1.05':'.43'};`);};mats[key].customProgramCacheKey=()=>key+'-thin-leaf-transmission-v7';}
mats.bark.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vBarkField;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBarkField=position;');shader.fragmentShader='varying vec3 vBarkField;'+weatherNoise+'\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float lichen=wf(vBarkField*vec3(9.,12.,9.));float islands=smoothstep(.62,.78,lichen);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.17,.165,.115),islands*.85);`);};mats.bark.customProgramCacheKey=()=> 'scene01-132-bark-lichen-field';
const timber=await installScannedTimber(mats);
const hardware=installHardwareMaterials131(mats);
const joineryKit=await loadBlenderJoinery();
const scannedStones=await loadScannedGardenStones();
const carvedSources185=await loadCarvedSources185();
const B=new Builder(mats);B.joineryKit=joineryKit;B.scannedStones=scannedStones;B.carvedSources185=carvedSources185;const A=architecture(B),G=garden(B,A);scene.add(B.finish());
const measuredSky=await loadMeasuredSky(SUN_DIRECTION),sky=measuredSky.mesh;scene.add(sky);
const rand=rng(12191),landscape=createDistantLandscape();scene.add(landscape.group);
const water=new Reflector(new T.PlaneGeometry(34,31),{clipBias:.003,textureWidth:Math.min(1024,width),textureHeight:Math.min(1024,height),multisample:0,shader:waterShader});water.rotation.x=-Math.PI/2;water.position.set(0,.13,5.2);water.name='real-reflected-garden-pond-ripple-surface';scene.add(water);
// Keep the real main subfrustum while the independent reflection captures the
// complete physical projection. Restore both matrices before the main draw.
const reflectScene148=water.onBeforeRender;
water.onBeforeRender=function(renderer,world,camera,...args){
 if(!camera.view?.enabled)return reflectScene148.call(this,renderer,world,camera,...args);
 const projection=camera.projectionMatrix.clone(),inverse=camera.projectionMatrixInverse.clone(),full=camera.clone();full.clearViewOffset();camera.projectionMatrix.copy(full.projectionMatrix);camera.projectionMatrixInverse.copy(full.projectionMatrixInverse);
 try{return reflectScene148.call(this,renderer,world,camera,...args);}finally{camera.projectionMatrix.copy(projection);camera.projectionMatrixInverse.copy(inverse);}
};
// Two low rock ledges frame a physically falling stream at the far bank.
const fallGeoms=[],fp=[],fu=[],fi=[];for(let level=0;level<2;level++)for(let k=0;k<14;k++){const x=L.waterfall.x+(k-6.5)*.055+.026*Math.sin(k*4),z=L.waterfall.z[level],ytop=L.waterfall.lips[level]+.044*Math.sin(k*1.7+level),ybottom=(level?L.waterfall.basinY:L.waterfall.lips[1])+.018*Math.sin(k*2.1),width=.016+.022*(.5+.5*Math.sin(k*7));const base=fp.length/3;for(let j=0;j<18;j++){const t=j/17,y=ytop+(ybottom-ytop)*t,zz=z+(level?.57:.67)*t*t;for(const dx of[-width,width]){fp.push(x+dx+.013*Math.sin(j*.8+k),y+.018*Math.sin(j*1.7+k),zz);fu.push(dx<0?0:1,t+(k%4)*.027+level*.047);}if(j<17){const a=base+j*2;fi.push(a,a+2,a+1,a+1,a+2,a+3);}}}const fgeom=new T.BufferGeometry();fgeom.setAttribute('position',new T.Float32BufferAttribute(fp,3));fgeom.setAttribute('uv',new T.Float32BufferAttribute(fu,2));fgeom.setIndex(fi);fgeom.computeVertexNormals();const fallTime={value:0};
const fallMat=new T.MeshPhysicalMaterial({color:0xb5d0cf,roughness:.18,metalness:.02,transparent:true,opacity:1,depthWrite:false,side:T.DoubleSide,specularIntensity:.75});
fallMat.onBeforeCompile=shader=>{
 shader.uniforms.fallTime=fallTime;
 shader.vertexShader='varying vec2 vFallUv;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvFallUv=uv;');
 shader.fragmentShader='varying vec2 vFallUv;uniform float fallTime;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float flowPhase=vFallUv.y*17.0+fallTime*7.5+sin(vFallUv.x*6.283)*.8;
 float flow=.5+.5*sin(flowPhase);
 float foam=smoothstep(.61,.96,flow)*(.65+.35*sin(vFallUv.x*3.14159));
 float edge=smoothstep(0.,.18,vFallUv.x)*(1.-smoothstep(.82,1.,vFallUv.x));
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.97,.95),foam*.72);
 diffuseColor.a*=edge*(.035+.18*foam);`);
};fallMat.customProgramCacheKey=()=> 'scene01-deterministic-flowing-clear-water-v1';const falls=new T.Mesh(fgeom,fallMat);falls.name='individual-falling-water-ribbons';scene.add(falls);
const foam=new Builder(mats);for(let k=0;k<130;k++){const s=.013+rand()*.035;foam.sphere(L.waterfall.x+(rand()-.5)*1.4,.15+rand()*.06,L.waterfall.z[1]+.57+(rand()-.5)*.35,s,s*.3,s*1.3,'stoneLight',0,.8+rand()*.3);}scene.add(foam.finish());
const sun=new T.DirectionalLight(0xffbd70,7.2);sun.target.position.set(0,4,-5);sun.position.copy(sun.target.position).addScaledVector(SUN_DIRECTION,64);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);sun.shadow.camera.left=-24;sun.shadow.camera.right=25;sun.shadow.camera.top=29;sun.shadow.camera.bottom=-22;sun.shadow.camera.near=1;sun.shadow.camera.far=100;sun.shadow.bias=-.000035;sun.shadow.normalBias=.005;sun.shadow.radius=2.0;scene.add(sun,sun.target);const hemi=new T.HemisphereLight(0xaec9ed,0xa9713b,.42);scene.add(hemi);const fill=new T.DirectionalLight(0xffd8ad,1.62);fill.name='warm-courtyard-reflected-daylight';fill.position.set(-22,19,12);fill.target.position.set(2,6,-10);fill.castShadow=true;fill.shadow.mapSize.set(4096,4096);Object.assign(fill.shadow.camera,{left:-23,right:25,top:24,bottom:-22,near:1,far:85});fill.shadow.bias=-.000025;fill.shadow.normalBias=.004;fill.shadow.radius=3;scene.add(fill,fill.target);
const porchLight=new T.PointLight(0xffa83e,5,7,2);porchLight.position.set(-3.53,6.94,8.35);scene.add(porchLight);const sanctuary=new T.PointLight(0xffca83,11,9,2);sanctuary.position.set(8.4,4.8,-12.5);scene.add(sanctuary);const lanternLight=new T.PointLight(0xffbd62,10,5,2);lanternLight.position.set(5.30,3.40,6.2);scene.add(lanternLight);
for(const x of[-8,-4,1,5,8]){const local=new T.Vector3(x,3.7,5.9).applyAxisAngle(new T.Vector3(0,1,0),-.67).add(new T.Vector3(...L.hall.position)),lamp=new T.PointLight(0xffc686,1.5,2.6,2);lamp.position.copy(local);scene.add(lamp);}
 RectAreaLightUniformsLib.init();const court185=new T.RectAreaLight(0xffd5a0,2.0,6.0,3.8);court185.name='scene01-finite-warm-stone-court-radiance185';court185.position.set(4.0,3.1,-3.7);court185.lookAt(9.2,9.4,-11.3);scene.add(court185);
 let env=null,localEnv=null;return{scene,water,sky,stats:B.stats,initializeEnvironment(renderer){const pmrem=new T.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();env=pmrem.fromEquirectangular(measuredSky.texture);scene.environment=env.texture;scene.environmentRotation.copy(measuredSky.rotation);scene.environmentIntensity=.34;const captureTarget=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter}),capture=new T.CubeCamera(.2,200,captureTarget);capture.position.set(1,5.5,3);water.visible=false;capture.update(renderer,scene);water.visible=true;localEnv=pmrem.fromCubemap(captureTarget.texture);for(const key of['gold','goldDark','goldLight','bronze','giltBronze','hardwareGold131','hardwareBronze131','hardwarePatina131','hardwareRelief131','hardwareFinial131','hall149Gilt','hall149OldGilt','hall185ActualGilt','hall185ActualFloralGilt']){mats[key].envMap=localEnv.texture;mats[key].envMapRotation.set(0,0,0);mats[key].envMapIntensity=.85;mats[key].needsUpdate=true;}captureTarget.dispose();pmrem.dispose();},setTime(t){water.material.uniforms.time.value=t;fallTime.value=t;},info(){return{revision:'scene01-spatial-carved-court185-r04',camera:CAMERA,sunDirection:SUN_DIRECTION.toArray(),spatial185:{construction:B.hallStructure185.info,seats:B.hallStructure185.seats,carving:B.carvedSources185Info,lanternSupports:B.hallStructure185.lanterns,portalForwardShiftMetres:.72,retainedCameraSiteAnchors:true},lighting:{court185:{position:court185.position.toArray(),width:6.0,height:3.8,radiance:2.0,solvedDiffuseGI:false},sunIntensity:sun.intensity,sunColor:'#ffbd70',hemisphere:hemi.intensity,hemisphereGround:'#a9713b',courtyardFill:fill.intensity,environmentIntensity:scene.environmentIntensity},layout:B.layout124,architecture:B.stats,garden:G.stats,proceduralOnly:false,measuredSky:measuredSky.info,scannedTimber:timber.info,hardware131:hardware,scannedStones:scannedStones.info,joinery:joineryKit.info,planarReflection:true};},dispose(){carvedSources185.dispose();scannedStones.dispose();joineryKit.dispose();timber.dispose();for(const g of B.resources)g.dispose();for(const ma of new Set([...Object.values(mats),...[...B.buckets.values()].map(b=>b.m)])){for(const key of['map','bumpMap','roughnessMap'])ma[key]?.dispose();ma.dispose();}water.dispose();env?.dispose();localEnv?.dispose();measuredSky.dispose();landscape.dispose();scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh){o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();}});scene.clear();}};
}
