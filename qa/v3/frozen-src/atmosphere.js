import * as T from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';

// Deterministic single scattering along the camera ray, occluded by the same
// fixed sun shadow map used by the geometry. No animated noise or light cones.
export function atmospherePass(camera,sun,depth){
 return new ShaderPass({uniforms:{tDiffuse:{value:null},tDepth:{value:depth},tShadow:{value:null},inverseProjection:{value:camera.projectionMatrixInverse},cameraWorld:{value:camera.matrixWorld},sunShadowMatrix:{value:sun.shadow.matrix},sunDirection:{value:sun.position.clone().sub(sun.target.position).normalize()},sunColor:{value:sun.color.clone().multiplyScalar(sun.intensity)}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:`#include <packing>
uniform sampler2D tDiffuse,tDepth,tShadow;uniform mat4 inverseProjection,cameraWorld,sunShadowMatrix;uniform vec3 sunDirection,sunColor;varying vec2 vUv;
float sunlight(vec3 p){vec4 q=sunShadowMatrix*vec4(p,1.0);q.xyz/=q.w;if(any(lessThan(q.xyz,vec3(0.0)))||any(greaterThan(q.xyz,vec3(1.0))))return 1.0;float s=0.0;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float d=unpackRGBAToDepth(texture2D(tShadow,q.xy+vec2(float(x),float(y))/8192.0));s+=step(q.z-.0002,d);}return s/9.0;}
void main(){
 vec4 base=texture2D(tDiffuse,vUv);float depth=texture2D(tDepth,vUv).r;
 vec4 view=inverseProjection*vec4(vUv*2.0-1.0,depth*2.0-1.0,1.0);view/=view.w;
 vec3 origin=cameraWorld[3].xyz,end=(cameraWorld*view).xyz,delta=end-origin;
 float len=min(length(delta),105.0),stepLen=len/56.0;vec3 ray=normalize(delta);float trans=1.0,scatter=0.0;
 for(int i=0;i<56;i++){
  vec3 p=origin+ray*(float(i)+.5)*stepLen;
  float room=(1.0-smoothstep(11.0,14.0,abs(p.x-6.0)))*smoothstep(-23.0,-20.0,p.z)*(1.0-smoothstep(-2.0,2.0,p.z))*smoothstep(4.5,6.0,p.y)*(1.0-smoothstep(17.7,19.0,p.y));
  float density=mix(.00018,.0038,room),atten=exp(-density*stepLen);
  scatter+=trans*(1.0-atten)*sunlight(p);trans*=atten;
 }
 float g=.35,cosTheta=dot(ray,sunDirection),phase=(1.0-g*g)/pow(1.0+g*g-2.0*g*cosTheta,1.5);
 gl_FragColor=vec4(base.rgb*trans+sunColor*scatter*phase*.40,base.a);
}`});
}
