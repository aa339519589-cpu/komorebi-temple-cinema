import * as T from 'three';
// Depth comes from the real scene render. Only objects within the near veranda
// receive appreciable defocus; the bridge, tower and main hall stay in focus.
export function createOptics(renderer,width,height,camera){
 const target=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,format:T.RGBAFormat,depthBuffer:true,stencilBuffer:false,samples:4});target.texture.name='scene01-linear-hdr';target.depthTexture=new T.DepthTexture(width,height,T.UnsignedIntType);
 const material=new T.ShaderMaterial({name:'scene01-physical-depth-softness',depthTest:false,depthWrite:false,uniforms:{tColor:{value:target.texture},tDepth:{value:target.depthTexture},resolution:{value:new T.Vector2(width,height)},cameraNear:{value:camera.near},cameraFar:{value:camera.far}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
 varying vec2 vUv;uniform sampler2D tColor;uniform sampler2D tDepth;uniform vec2 resolution;uniform float cameraNear;uniform float cameraFar;
 #include <packing>
 void main(){float d=texture2D(tDepth,vUv).x;float distance=-perspectiveDepthToViewZ(d,cameraNear,cameraFar);float nearBlur=clamp((5.8-distance)/4.8,0.,1.);float farBlur=clamp((distance-65.)/100.,0.,1.)*.24;float radius=.14+3.0*nearBlur+farBlur;vec3 color=texture2D(tColor,vUv).rgb*.20;float weight=.20;
 for(int k=0;k<16;k++){float a=float(k)*2.3999632;float r=sqrt((float(k)+.5)/16.);vec2 offset=vec2(cos(a),sin(a))*r*radius/resolution;float w=.05;color+=texture2D(tColor,vUv+offset).rgb*w;weight+=w;}
 color/=weight;gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const quad=new T.Mesh(new T.PlaneGeometry(2,2),material),scene=new T.Scene(),screenCamera=new T.Camera();scene.add(quad);
 return{render(scene,camera){renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.clear();renderer.render(quad.parent,screenCamera);},dispose(){target.dispose();target.depthTexture.dispose();quad.geometry.dispose();material.dispose();}};
}
