import * as T from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
// Small bounded lens scatter around actual HDR highlights, with no screen image assets.
export function createLensBloomPass(width,height){
 return new ShaderPass({name:'Scene06LensHighlightScatter',uniforms:{tDiffuse:{value:null},resolution:{value:new T.Vector2(width,height)},strength:{value:.18},threshold:{value:1.2}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`
 uniform sampler2D tDiffuse;uniform vec2 resolution;uniform float strength;uniform float threshold;varying vec2 vUv;
 vec3 bright(vec3 c){float y=dot(c,vec3(.2126,.7152,.0722));return c*smoothstep(threshold,threshold+.65,y);}
 void main(){vec4 base=texture2D(tDiffuse,vUv);vec3 glow=bright(base.rgb)*.12;
 for(int i=0;i<16;i++){float a=6.2831853*float(i)/8.0;float r=i<8?1.35:3.1;float w=i<8?.075:.035;glow+=bright(texture2D(tDiffuse,vUv+vec2(cos(a),sin(a))*r/resolution).rgb)*w;}
 gl_FragColor=vec4(base.rgb+strength*glow,base.a);}`});
}
