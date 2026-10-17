import * as T from '../vendor/build/three.module.js';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
/** The final OutputPass has already applied tone mapping and sRGB transfer. */
export function createRenderPixelReadback(temple){
 const {renderer,composer}=temple,size=renderer.getDrawingBufferSize(new T.Vector2());
 const target=new T.WebGLRenderTarget(size.x,size.y,{type:T.UnsignedByteType,format:T.RGBAFormat,depthBuffer:false,stencilBuffer:false,samples:0});
 target.texture.name='actual-film-output-rgba8';target.texture.colorSpace=T.NoColorSpace;
 const material=new T.ShaderMaterial({uniforms:{tImage:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:'uniform sampler2D tImage;varying vec2 vUv;void main(){gl_FragColor=texture2D(tImage,vUv);}',depthTest:false,depthWrite:false,toneMapped:false});
 const quad=new FullScreenQuad(material),bytes=new Uint8Array(size.x*size.y*4);let disposed=false;
 const previousScreen=composer.renderToScreen;composer.renderToScreen=false;
 return {
  width:size.x,height:size.y,bytes,
  read(){
   if(disposed)throw Error('Readback target disposed');
   const old=renderer.getRenderTarget();
   try{material.uniforms.tImage.value=composer.readBuffer.texture;renderer.setRenderTarget(target);quad.render(renderer);renderer.readRenderTargetPixels(target,0,0,size.x,size.y,bytes);const error=renderer.getContext().getError();if(error)throw Error('GPU readback GL error '+error);return {width:size.x,height:size.y,byteLength:bytes.byteLength,firstPixel:Array.from(bytes.subarray(0,4))};}
   finally{renderer.setRenderTarget(old);}
  },
  chunk(offset,length=65536){if(!Number.isInteger(offset)||offset<0||offset>bytes.length||length<1||length>65536)throw Error('Invalid pixel range');const a=bytes.subarray(offset,Math.min(offset+length,bytes.length));let text='';for(let i=0;i<a.length;i+=16384)text+=String.fromCharCode(...a.subarray(i,i+16384));return btoa(text);},
  dispose(){if(disposed)return;disposed=true;composer.renderToScreen=previousScreen;quad.dispose();material.dispose();target.dispose();}
 };
}
