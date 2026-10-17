/** Export the actual postprocessed WebGL frame through a bounded RGBA8 target. */
import * as T from 'three';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
function stats(data){let min=255,max=0,sum=0,nonzero=0,alpha=0;for(let i=0;i<data.length;i+=4){const v=Math.max(data[i],data[i+1],data[i+2]);min=Math.min(min,v);max=Math.max(max,v);sum+=v;if(v>2)nonzero++;if(data[i+3])alpha++;}const n=data.length/4;return{min,max,mean:sum/n,nonzeroFraction:nonzero/n,alphaFraction:alpha/n};}
function encode(bytes,width,height){const pixels=new Uint8ClampedArray(bytes.length);for(let y=0;y<height;y++)pixels.set(bytes.subarray(y*width*4,(y+1)*width*4),(height-y-1)*width*4);const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').putImageData(new ImageData(pixels,width,height),0,0);return canvas.toDataURL('image/png');}
export function capturePixelFrame(temple,draw,{diagnose=false}={}){
 const r=temple.renderer,composer=temple.composer,gl=r.getContext(),width=r.domElement.width,height=r.domElement.height;
 const saved={target:r.getRenderTarget(),screen:composer.renderToScreen,autoClear:r.autoClear};
 const output=new T.WebGLRenderTarget(width,height,{type:T.UnsignedByteType,format:T.RGBAFormat,depthBuffer:false,stencilBuffer:false});output.texture.name='actual-postprocess-rgba8-export';
 const material=new T.ShaderMaterial({uniforms:{source:{value:null}},depthTest:false,depthWrite:false,toneMapped:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D source;varying vec2 vUv;void main(){gl_FragColor=vec4(texture2D(source,vUv).rgb,1.0);}'}),quad=new FullScreenQuad(material);
 const stages=[],originals=[];let pose,bytes,result;
 function copy(source,target){r.setRenderTarget(target);r.autoClear=true;material.uniforms.source.value=source;quad.render(r);gl.finish();}
 try{
  if(diagnose)for(const [index,pass] of composer.passes.entries()){
   const original=pass.render;originals.push([pass,original]);
   pass.render=function(renderer,write,read,...args){const start=performance.now();const ret=original.call(this,renderer,write,read,...args);gl.finish();const errors=[];for(let e=gl.getError();e&&errors.length<8;e=gl.getError())errors.push(e);const actual=r.getRenderTarget();stages.push({index,type:this.constructor.name,enabled:this.enabled,toScreen:this.renderToScreen,needsSwap:this.needsSwap,seconds:(performance.now()-start)/1000,target:actual?{name:actual.texture.name,width:actual.width,height:actual.height,samples:actual.samples,type:actual.texture.type}:null,errors});return ret;};
  }
  composer.renderToScreen=false;pose=draw();gl.finish();
  const composeErrors=[];for(let e=gl.getError();e&&composeErrors.length<8;e=gl.getError())composeErrors.push(e);
  copy(composer.readBuffer.texture,output);
  bytes=new Uint8Array(width*height*4);r.readRenderTargetPixels(output,0,0,width,height,bytes);
  const readError=gl.getError(),pixelStats=stats(bytes);
  // Present exactly the exported RGB. This does not reconstruct or alter scene pixels.
  copy(output.texture,null);const presentationError=gl.getError();
  const canvasPng=r.domElement.toDataURL('image/png');
  result={pose,png:encode(bytes,width,height),canvasPng,pixelStats,composeErrors,readError,presentationError,contextLost:gl.isContextLost(),stages,exportPolicy:'Existing OutputPass tone mapping and sRGB conversion, copied without another color transform to an opaque RGBA8 PNG',capabilities:{maxSamples:gl.getParameter(gl.MAX_SAMPLES),rgba16fSamples:Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,gl.RGBA16F,gl.SAMPLES)||[]),rgba8Samples:Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,gl.RGBA8,gl.SAMPLES)||[]),maxTextureUnits:gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)}};
 }finally{for(const [pass,original] of originals)pass.render=original;composer.renderToScreen=saved.screen;r.autoClear=saved.autoClear;r.setRenderTarget(saved.target);quad.dispose();material.dispose();output.dispose();}
 return result;
}
