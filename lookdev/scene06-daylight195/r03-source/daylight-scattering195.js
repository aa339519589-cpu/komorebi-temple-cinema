import * as T from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';

// World-fixed air and actual sun-shadow visibility. Finite-sun filtering uses
// distance from the real left window wall as a penumbra estimate; it is not a
// full multiple-scattering transport solver or a screen-space beam pattern.
export function createDaylightScattering195(camera,sun,depth){
 const pass=new ShaderPass({defines:{RESTORATION_SHADOW_PCF:1},uniforms:{
  tDiffuse:{value:null},tDepth:{value:depth},tShadow:{value:null},
  inverseProjection:{value:camera.projectionMatrixInverse},cameraWorld:{value:camera.matrixWorld},sunShadowMatrix:{value:sun.shadow.matrix},
  sunDirection:{value:new T.Vector3()},sunColor:{value:new T.Color()},shadowWorldSpan:{value:new T.Vector2(24,22)},shadowTexel:{value:new T.Vector2()},
  density:{value:.004},scatteringGain:{value:1.75},shadowReady:{value:0}
 },vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
  uniform sampler2D tDiffuse,tDepth;
  #if RESTORATION_SHADOW_PCF == 1
   uniform highp sampler2DShadow tShadow;
  #else
   uniform sampler2D tShadow;
  #endif
  uniform mat4 inverseProjection,cameraWorld,sunShadowMatrix;
  uniform vec3 sunDirection,sunColor;uniform vec2 shadowWorldSpan,shadowTexel;
  uniform float density,scatteringGain,shadowReady;varying vec2 vUv;
  float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  float air(vec3 p){vec3 c=floor(p),f=fract(p);f=f*f*(3.-2.*f);
   return mix(mix(mix(hash3(c),hash3(c+vec3(1,0,0)),f.x),mix(hash3(c+vec3(0,1,0)),hash3(c+vec3(1,1,0)),f.x),f.y),
              mix(mix(hash3(c+vec3(0,0,1)),hash3(c+vec3(1,0,1)),f.x),mix(hash3(c+vec3(0,1,1)),hash3(c+vec3(1,1,1)),f.x),f.y),f.z);}
  float visibility(vec3 p){vec4 q=sunShadowMatrix*vec4(p,1.);q.xyz/=max(q.w,.00001);
   if(any(lessThan(q.xyz,vec3(0)))||any(greaterThan(q.xyz,vec3(1))))return 0.;
   float travel=max(0.,(p.x+6.8)/max(abs(sunDirection.x),.1));
   // 0.265 degree solar angular radius; broad source edges soften with distance.
   float radius=.008+travel*.004625;vec2 spread=radius/shadowWorldSpan+shadowTexel*.35;
   float result=0.;for(int k=0;k<8;k++){float a=float(k)*2.39996323,r=sqrt((float(k)+.5)/8.);
    vec2 at=q.xy+vec2(cos(a),sin(a))*r*spread;
    #if RESTORATION_SHADOW_PCF == 1
     result+=texture(tShadow,vec3(at,q.z-.00012));
    #else
     result+=step(q.z-.00012,texture2D(tShadow,at).r);
    #endif
   }return result*.125;}
  void main(){vec4 base=texture2D(tDiffuse,vUv);if(shadowReady<.5){gl_FragColor=base;return;}
   float z=texture2D(tDepth,vUv).r;vec4 v=inverseProjection*vec4(vUv*2.-1.,z*2.-1.,1.);v/=sign(v.w)*max(abs(v.w),.00001);
   vec3 origin=cameraWorld[3].xyz,end=(cameraWorld*v).xyz,delta=end-origin;float lengthRay=max(length(delta),.0001);
   vec3 ray=delta/lengthRay;float stepSize=min(lengthRay,40.)/88.,transmission=1.,radiance=0.;
   for(int i=0;i<88;i++){vec3 p=origin+ray*(float(i)+.5)*stepSize;
    float room=(1.-smoothstep(6.65,6.8,abs(p.x)))*smoothstep(-5.8,-5.55,p.z)*(1.-smoothstep(9.8,10.,p.z));
    room*=smoothstep(.02,.10,p.y)*(1.-smoothstep(7.05,7.2,p.y));
    float rho=density*room*(.84+.16*air(p*vec3(.19,.13,.23)));
    float extinction=exp(-rho*stepSize);
    if(room>.001)radiance+=transmission*(1.-extinction)*visibility(p);transmission*=extinction;
   }
   float g=.20,c=dot(ray,sunDirection),phase=(1.-g*g)/pow(max(.05,1.+g*g-2.*g*c),1.5);
   gl_FragColor=vec4(base.rgb*transmission+sunColor*radiance*phase*.07957747*scatteringGain,base.a);
  }`
 });
 Object.assign(pass.uniforms.tDepth,{value:depth});pass.uniforms.inverseProjection.value=camera.projectionMatrixInverse;pass.uniforms.cameraWorld.value=camera.matrixWorld;pass.uniforms.sunShadowMatrix.value=sun.shadow.matrix;
 pass.sync=()=>{
  const texture=sun.shadow.map?.depthTexture;pass.uniforms.tShadow.value=texture??null;pass.uniforms.shadowReady.value=texture?1:0;
  const hardware=texture?.compareFunction!=null?1:0;if(pass.material.defines.RESTORATION_SHADOW_PCF!==hardware){pass.material.defines.RESTORATION_SHADOW_PCF=hardware;pass.material.needsUpdate=true;}
  pass.uniforms.sunDirection.value.copy(sun.position).sub(sun.target.position).normalize();pass.uniforms.sunColor.value.copy(sun.color).multiplyScalar(sun.intensity);
  pass.uniforms.shadowTexel.value.set(1/sun.shadow.mapSize.x,1/sun.shadow.mapSize.y);const c=sun.shadow.camera;pass.uniforms.shadowWorldSpan.value.set(c.right-c.left,c.top-c.bottom);
 };
 pass.sync();return pass;
}
