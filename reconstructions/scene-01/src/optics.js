import * as T from 'three';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
// Depth comes from the real scene render. Only objects within the near veranda
// receive appreciable defocus; the bridge, tower and main hall stay in focus.
export function createOptics(renderer,width,height,camera){
 const target=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,format:T.RGBAFormat,depthBuffer:true,stencilBuffer:false,samples:4});target.texture.name='scene01-linear-hdr';target.depthTexture=new T.DepthTexture(width,height,T.UnsignedIntType);
 const ao=new GTAOPass(null,camera,width,height);ao.setGBuffer(target.depthTexture);ao.output=GTAOPass.OUTPUT.Off;ao.updateGtaoMaterial({radius:.42,thickness:.35,distanceExponent:1.25,distanceFallOff:.70,scale:1,samples:16});ao.updatePdMaterial({radius:3,depthPhi:4,normalPhi:4,samples:16});const noise=new Uint8Array(64*64*4);let seed=81937;for(let i=0;i<noise.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;noise[i]=seed>>>24;}ao.pdNoiseTexture.dispose();ao.pdNoiseTexture=new T.DataTexture(noise,64,64);ao.pdNoiseTexture.wrapS=ao.pdNoiseTexture.wrapT=T.RepeatWrapping;ao.pdNoiseTexture.needsUpdate=true;ao.pdMaterial.uniforms.tNoise.value=ao.pdNoiseTexture;
 const material=new T.ShaderMaterial({name:'scene01-physical-depth-softness',depthTest:false,depthWrite:false,uniforms:{tColor:{value:target.texture},tDepth:{value:target.depthTexture},tAO:{value:ao.gtaoMap},resolution:{value:new T.Vector2(width,height)},cameraNear:{value:camera.near},cameraFar:{value:camera.far}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
 varying vec2 vUv;uniform sampler2D tColor;uniform sampler2D tDepth;uniform sampler2D tAO;uniform vec2 resolution;uniform float cameraNear;uniform float cameraFar;
 #include <packing>
 void main(){float d=texture2D(tDepth,vUv).x;float distance=-perspectiveDepthToViewZ(d,cameraNear,cameraFar);float nearBlur=clamp((10.0-distance)/9.0,0.,1.);float farBlur=clamp((distance-65.)/100.,0.,1.)*.24;float radius=.14+8.5*nearBlur+farBlur;vec3 color=texture2D(tColor,vUv).rgb*.20;float weight=.20;
 for(int k=0;k<16;k++){float a=float(k)*2.3999632;float r=sqrt((float(k)+.5)/16.);vec2 offset=vec2(cos(a),sin(a))*r*radius/resolution;float w=.05;color+=texture2D(tColor,vUv+offset).rgb*w;weight+=w;}
 color/=weight;float contact=texture2D(tAO,vUv).r;color*=mix(1.,contact,.58);gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const quad=new T.Mesh(new T.PlaneGeometry(2,2),material),scene=new T.Scene(),screenCamera=new T.Camera();scene.add(quad);
 return{render(scene,camera){renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);ao.render(renderer,null,target);renderer.setRenderTarget(null);renderer.clear();renderer.render(quad.parent,screenCamera);},dispose(){ao.gtaoMaterial.dispose();ao.blendMaterial.dispose();ao.dispose();target.dispose();target.depthTexture.dispose();quad.geometry.dispose();material.dispose();}};
}
