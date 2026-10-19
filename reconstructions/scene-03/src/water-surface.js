import * as T from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';

export function createPondSurface(width,height){
 const surface=new Reflector(new T.PlaneGeometry(60,56),{
  textureWidth:Math.min(1536,width),textureHeight:Math.min(1536,height),
  color:0xffffff,clipBias:.003,multisample:4
 });
 surface.name='view-dependent-pond-water';
 surface.rotation.x=-Math.PI/2;surface.position.set(0,-.055,10);
 // A reflected camera reverses the screen-horizontal basis on this pond.
 // Reflector copies the input projection, including an off-axis view offset.
 // Mirror that offset while it copies the matrix; otherwise a native detail
 // subfrustum samples a clamped column of the reflection target as stripes.
 // The input camera is restored before its own draw; centered film views
 // have zero horizontal offset and therefore keep the same projection.
 const reflect=surface.onBeforeRender;
 surface.onBeforeRender=function(renderer,scene,camera,geometry,material,group){
  const projection=camera.projectionMatrix.elements,offsetX=projection[8];
  projection[8]=-offsetX;
  try{return reflect.call(this,renderer,scene,camera,geometry,material,group);}
  finally{projection[8]=offsetX;}
 };
 const material=surface.material;
 material.transparent=true;material.depthWrite=true;
 material.uniforms.waterTime={value:0};
 if(!material.vertexShader.includes('varying vec4 vUv;')||
    !material.fragmentShader.includes('vec4 base = texture2DProj( tDiffuse, vUv );')||
    !material.fragmentShader.includes('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );')){
  throw Error('Pinned reflector shader changed; water replacement requires review.');
 }
 material.vertexShader=material.vertexShader
  .replace('varying vec4 vUv;','varying vec4 vUv;\nvarying vec3 waterWorld;')
  .replace('void main() {','void main() {\nwaterWorld=(modelMatrix*vec4(position,1.0)).xyz;');
 material.fragmentShader=material.fragmentShader
  .replace('varying vec4 vUv;',`varying vec4 vUv;
varying vec3 waterWorld;
uniform float waterTime;`)
  .replace('vec4 base = texture2DProj( tDiffuse, vUv );',`
// Wave phase is attached to world metres. A moving camera does not drag a
// screen-space ripple pattern across the surface.
vec2 p=waterWorld.xz;
float a=dot(p,vec2(1.73,2.17))-.24*waterTime;
float b=dot(p,vec2(-5.37,3.11))+.37*waterTime;
float c=dot(p,vec2(12.13,7.41))-.48*waterTime;
float fa=1.0-smoothstep(1.5,3.5,fwidth(a));
float fb=1.0-smoothstep(1.5,3.5,fwidth(b));
float fc=1.0-smoothstep(1.5,3.5,fwidth(c));
vec2 slope=.0015*cos(a)*vec2(1.73,2.17)*fa
           +.0004*cos(b)*vec2(-5.37,3.11)*fb
           +.0002*cos(c)*vec2(12.13,7.41)*fc;
vec3 waterNormal=normalize(vec3(-slope.x,1.0,-slope.y));
vec3 toEye=normalize(cameraPosition-waterWorld);
float cosEye=clamp(dot(toEye,waterNormal),0.0,1.0);
float f0=pow((1.333-1.0)/(1.333+1.0),2.0);
float fresnel=f0+(1.0-f0)*pow(1.0-cosEye,5.0);
vec4 rippleUv=vUv;
rippleUv.xy+=slope*.055*vUv.w;
vec4 base=texture2DProj(tDiffuse,rippleUv);`)
  .replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',
           'gl_FragColor=vec4(base.rgb,fresnel);');
 material.needsUpdate=true;
 return surface;
}
