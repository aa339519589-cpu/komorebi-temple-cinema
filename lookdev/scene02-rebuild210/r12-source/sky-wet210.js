import {T} from './kernel.js';
import {Reflector} from 'three/addons/objects/Reflector.js';

export function createSunSky210(sunDirection){
 const material=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{sun:{value:sunDirection},skyGain:{value:1}},vertexShader:`varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}`,fragmentShader:`
 varying vec3 vWorld;uniform vec3 sun;uniform float skyGain;
 float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
 float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float fbm(vec3 p){return .5*noise(p)+.25*noise(p*2.03)+.125*noise(p*4.13)+.0625*noise(p*8.31);}
 void main(){
  vec3 d=normalize(vWorld-cameraPosition);float h=max(d.y,0.),mu=clamp(dot(d,sun),-1.,1.),a=acos(mu),nearSun=pow(max(0.,mu),75.);
  // An angular solar disc and forward-scattered aureole belong to this
  // world atmosphere, so the sky, reflection and every camera see one sun.
  vec3 color=mix(vec3(1.30,.64,.20),vec3(.20,.36,.63),smoothstep(.005,.54,h));
  color+=vec3(1.55,.57,.10)*pow(max(0.,mu),235.);
  color+=vec3(3.0,1.85,.52)*exp(-pow(a/.0105,2.));
  color+=vec3(2.7,1.15,.20)*exp(-a/.026);
  if(d.y>.035){
   float lo=2.2/d.y,hi=3.25/d.y,stepLength=(hi-lo)/12.,trans=1.;vec3 scattered=vec3(0.);
   for(int j=0;j<12;j++){
    vec3 cp=d*(lo+(float(j)+.5)*stepLength),warp=vec3(fbm(cp*.83+1.7),0.,fbm(cp*.91-2.1));
    float layer=smoothstep(2.2,2.43,cp.y)*smoothstep(3.25,2.99,cp.y);
    float n=fbm(cp*4.7+warp*.48+vec3(1.1,0.,2.)),coverage=smoothstep(.46,.62,fbm(vec3(cp.x*1.05,1.3,cp.z*1.05)));
    float density=smoothstep(.525,.675,n)*layer*coverage;
    float sunNoise=fbm((cp+sun*.25)*4.7+warp*.48+vec3(1.1,0.,2.)),selfShadow=exp(-4.4*smoothstep(.51,.665,sunNoise));
    vec3 radiance=mix(vec3(.18,.26,.43),vec3(2.70,1.12,.28),.24+.76*selfShadow)*(.80+.20*nearSun);
    float opacity=1.-exp(-density*stepLength*3.0);scattered+=trans*opacity*radiance;trans*=1.-opacity;
   }color=color*trans+scattered;
  }
  float core=1.-smoothstep(.00440,.00485,a);color+=vec3(28.,22.,10.)*core;
  gl_FragColor=vec4(color*skyGain,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
 return{material,info:{revision:'scene02-angular-sun-and-gold-cloud-cool-sky210-r10',solarAngularRadiusRadians:.00465,cloudField:'Twelve-sample finite altitude layer, broken lower-density gold cloudlets, blue self shadow and world forward scattering',actualWorldSky:true,photographicBackground:false,measuredRadiometry:false}};
}

export function installWetBoardReflection210({scene,mats,renderer,camera,reflectors,width,height}){
 const proxy=new Reflector(new T.PlaneGeometry(1,1),{textureWidth:Math.min(width,1024),textureHeight:Math.min(height,1024),clipBias:.003,multisample:0});
 proxy.rotation.x=-Math.PI/2;proxy.position.y=1.71;proxy.updateMatrixWorld(true);
 // The proxy is never added to the scene or drawn. Its real virtual-camera
 // capture is projected on the actual closed deformed board geometry.
 const matrix=new T.Matrix4(),shaders=new Set(),floors=[];let captured=false,capturing=false,suspended=false,captures=0;
 scene.traverse(o=>{if(o.isMesh&&o.material===mats.floor)floors.push(o);});
 const previous=mats.floor.onBeforeCompile,key=mats.floor.customProgramCacheKey.bind(mats.floor);
 mats.floor.onBeforeCompile=shader=>{
  previous(shader);shader.uniforms.uWetMatrix210={value:matrix};shader.uniforms.uWetReflection210={value:proxy.getRenderTarget().texture};shader.uniforms.uWetEnabled210={value:1};shaders.add(shader);
  shader.vertexShader='uniform mat4 uWetMatrix210;varying vec4 vWetProjection210;varying vec3 vWetWorld210;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 wetPoint210=vec4(transformed,1.);
   #ifdef USE_INSTANCING
    wetPoint210=instanceMatrix*wetPoint210;
   #endif
   wetPoint210=modelMatrix*wetPoint210;vWetWorld210=wetPoint210.xyz;vWetProjection210=uWetMatrix210*wetPoint210;
   #include <project_vertex>`);
  shader.fragmentShader='uniform sampler2D uWetReflection210;uniform float uWetEnabled210;varying vec4 vWetProjection210;varying vec3 vWetWorld210;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
   vec3 wetN210=normalize(inverseTransformDirection(clearcoatNormal,viewMatrix)),wetV210=normalize(cameraPosition-vWetWorld210);
   vec2 wetUv210=vWetProjection210.xy/max(vWetProjection210.w,.0001)+wetN210.xz*.08;
   float wetInside210=step(0.,wetUv210.x)*step(wetUv210.x,1.)*step(0.,wetUv210.y)*step(wetUv210.y,1.);
   float wetBlur210=.00065+.004*material.clearcoatRoughness*material.clearcoatRoughness;
   vec3 wetR210=texture2D(uWetReflection210,wetUv210).rgb*.40;
   wetR210+=(texture2D(uWetReflection210,wetUv210+vec2(wetBlur210,0.)).rgb+texture2D(uWetReflection210,wetUv210-vec2(wetBlur210,0.)).rgb+texture2D(uWetReflection210,wetUv210+vec2(0.,wetBlur210)).rgb+texture2D(uWetReflection210,wetUv210-vec2(0.,wetBlur210)).rgb)*.15;
   float wetF210=.04+.96*pow(1.-max(0.,dot(wetN210,wetV210)),5.);
   float wetWeight210=uWetEnabled210*wetInside210*wetF210*(.14+.40*verandaWet)*smoothstep(.25,.7,wetN210.y);
   outgoingLight=mix(outgoingLight,max(vec3(0.),wetR210),wetWeight210);
   #include <opaque_fragment>`);
 };
 mats.floor.customProgramCacheKey=()=>key()+':actual-deformed-board-planar-coat210-r09';mats.floor.needsUpdate=true;
 for(const mesh of floors){const before=mesh.onBeforeRender;mesh.onBeforeRender=function(r,s,c,...args){
  before?.call(this,r,s,c,...args);for(const shader of shaders)shader.uniforms.uWetEnabled210.value=c===camera&&!suspended?1:0;
  if(c!==camera||captured||capturing||suspended)return;
  captured=true;capturing=true;const visible=floors.map(o=>o.visible),mirrors=reflectors.map(o=>o.visible),cropped=c.view?.enabled,p=cropped?c.projectionMatrix.clone():null,ip=cropped?c.projectionMatrixInverse.clone():null;
  floors.forEach(o=>o.visible=false);reflectors.forEach(o=>o.visible=false);
  try{
   if(cropped){const full=c.clone();full.clearViewOffset();c.projectionMatrix.copy(full.projectionMatrix);c.projectionMatrixInverse.copy(full.projectionMatrixInverse);}
   proxy.onBeforeRender(r,s,c);matrix.copy(proxy.material.uniforms.textureMatrix.value).multiply(proxy.matrixWorld.clone().invert());captures++;
  }finally{if(cropped){c.projectionMatrix.copy(p);c.projectionMatrixInverse.copy(ip);}floors.forEach((o,i)=>o.visible=visible[i]);reflectors.forEach((o,i)=>o.visible=mirrors[i]);capturing=false;}
 };}
 return{beginFrame(){captured=false;},suspend(value){suspended=value;},info(){return{revision:'scene02-actual-board-wet-varnish210-r09',capturePlaneY:1.71,captures,actualDeformedClosedBoards:true,proxyVisible:false,virtualCameraReflection:true,fresnelMixture:true,fullSubfrustumCapture:true,limits:'Native planar thin-coat approximation, not path-traced glossy transport; finite actual board curvature and source scene provide the visible reflection.'};},dispose(){proxy.geometry.dispose();proxy.material.dispose();proxy.getRenderTarget().dispose();}};
}
