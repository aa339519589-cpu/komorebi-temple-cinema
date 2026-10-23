import * as T from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';

// Bounded optical defocus from the actual opaque scene depth. It is active
// only during the dolly; the reference path skips the pass entirely.
export function createShotFocusPass(camera,depth,width,height){
 const state={enabled:false,focusDistance:1,fNumber:2.8,strength:0,focalLengthMm:camera.getFocalLength(),maxRadiusPixels:6};
 const pass=new ShaderPass({name:'Scene06MovingLensFocus',uniforms:{tDiffuse:{value:null},tDepth:{value:depth},resolution:{value:new T.Vector2(width,height)},cameraNear:{value:camera.near},cameraFar:{value:camera.far},focusDistance:{value:1},fNumber:{value:2.8},focalLength:{value:camera.getFocalLength()*.001},sensorHeight:{value:camera.getFilmHeight()*.001},strength:{value:0},maxRadius:{value:6}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`
 #include <packing>
 uniform sampler2D tDiffuse,tDepth;uniform vec2 resolution;uniform float cameraNear,cameraFar,focusDistance,fNumber,focalLength,sensorHeight,strength,maxRadius;varying vec2 vUv;
 float distanceAt(vec2 uv){return -perspectiveDepthToViewZ(texture2D(tDepth,uv).x,cameraNear,cameraFar);}
 float circleRadius(float z){float diameter=focalLength*focalLength*abs(z-focusDistance)/(fNumber*max(.01,focusDistance-focalLength)*max(z,cameraNear));return min(maxRadius,diameter*resolution.y/(2.0*sensorHeight))*strength;}
 void main(){
  vec4 base=texture2D(tDiffuse,vUv);float z=distanceAt(vUv),radius=circleRadius(z);
  if(radius<.15){gl_FragColor=base;return;}
  vec3 sum=base.rgb;float total=1.0;
  for(int i=0;i<24;i++){
   float q=(float(i)+.5)/24.0,a=float(i)*2.39996323;vec2 uv=clamp(vUv+vec2(cos(a),sin(a))*sqrt(q)*radius/resolution,vec2(0.),vec2(1.));
   float sampleZ=distanceAt(uv),sampleRadius=circleRadius(sampleZ);
   // Keep sharply focused foreground edges from being diluted by a distant
   // layer. Hidden background and transparent glass remain approximations.
   float sharpOccluder=step(sampleZ+max(.025,z*.012),z)*(1.0-smoothstep(.25,.85,sampleRadius));
   float weight=(1.0-sharpOccluder)*exp(-abs(sampleZ-z)/max(.20,z*.16));
   sum+=texture2D(tDiffuse,uv).rgb*weight;total+=weight;
  }
  gl_FragColor=vec4(sum/total,base.a);
 }`});
 pass.enabled=false;
 function sync({focusDistance=state.focusDistance,fNumber=2.8,strength=0,enabled=strength>0}={}){
  if(!Number.isFinite(focusDistance)||focusDistance<=camera.near||!Number.isFinite(fNumber)||fNumber<1||!Number.isFinite(strength))throw Error('Invalid cinematic focus settings');
  Object.assign(state,{enabled:!!enabled&&strength>0,focusDistance,fNumber,strength:T.MathUtils.clamp(strength,0,1),focalLengthMm:camera.getFocalLength()});
  pass.enabled=state.enabled;pass.uniforms.focusDistance.value=focusDistance;pass.uniforms.fNumber.value=fNumber;pass.uniforms.strength.value=state.strength;
  pass.uniforms.cameraNear.value=camera.near;pass.uniforms.cameraFar.value=camera.far;pass.uniforms.focalLength.value=state.focalLengthMm*.001;pass.uniforms.sensorHeight.value=camera.getFilmHeight()*.001;
 }
 return {pass,sync,info:()=>({...state,method:'Physical circle-of-confusion diameter with bounded24-tap depth-aware gather',depth:'Existing actual opaque geometry depth; glass and hidden backgrounds are approximations',referenceUnchanged:'Pass disabled for original reference/view and exact7s endpoint'})};
}
