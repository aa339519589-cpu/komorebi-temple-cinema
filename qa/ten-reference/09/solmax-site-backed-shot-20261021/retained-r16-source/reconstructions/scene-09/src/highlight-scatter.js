import {ShaderMaterial,Vector2} from 'three';
import {Pass,FullScreenQuad} from 'three/addons/postprocessing/Pass.js';

// Small, fixed optical spread of bright linear-HDR sources. No temporal noise.
export class HighlightScatterPass extends Pass{
 constructor(width,height,strength=.14,threshold=1.15){
  super();this.material=new ShaderMaterial({name:'scene09-fixed-highlight-scatter',depthTest:false,depthWrite:false,uniforms:{tDiffuse:{value:null},texel:{value:new Vector2(1/width,1/height)},strength:{value:strength},threshold:{value:threshold}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 texel;uniform float strength;uniform float threshold;varying vec2 vUv;void main(){vec4 base=texture2D(tDiffuse,vUv);vec3 scatter=vec3(0.);float sum=0.;for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){float f=exp(-float(x*x+y*y)*.40);vec3 c=texture2D(tDiffuse,vUv+vec2(float(x),float(y))*texel*2.).rgb;scatter+=max(c-vec3(threshold),vec3(0.))*f;sum+=f;}gl_FragColor=vec4(base.rgb+strength*scatter/sum,base.a);}`});this.quad=new FullScreenQuad(this.material);
 }
 setSize(width,height){this.material.uniforms.texel.value.set(1/width,1/height);}
 render(renderer,writeBuffer,readBuffer){this.material.uniforms.tDiffuse.value=readBuffer.texture;renderer.setRenderTarget(this.renderToScreen?null:writeBuffer);if(this.clear)renderer.clear();this.quad.render(renderer);}
 dispose(){this.material.dispose();this.quad.dispose();}
}
