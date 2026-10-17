/** Read the unchanged final OutputPass through an explicit RGBA8 target. */
import * as T from '../vendor/build/three.module.js';
import {readFramebufferRGBA} from './read-framebuffer-rgba.js';
export function captureOutputTarget(temple,draw){
 if(!temple?.renderer?.isWebGLRenderer||typeof draw!=='function')throw Error('Require actual renderer and synchronous draw');
 const {renderer,composer}=temple,pass=composer.passes.filter(p=>p.enabled).at(-1);
 if(!pass?.isOutputPass)throw Error('Final enabled pass is not OutputPass');
 const size=renderer.getDrawingBufferSize(new T.Vector2()),width=size.x,height=size.y;
 if(width<1||height<1||width>4096||height>4096)throw Error('Invalid capture size');
 const target=new T.WebGLRenderTarget(width,height,{format:T.RGBAFormat,type:T.UnsignedByteType,minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:false,stencilBuffer:false});
 const prior={screen:composer.renderToScreen,passScreen:pass.renderToScreen,render:pass.render,target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel()},start=performance.now(),stages=[];
 const stage=(name,data={})=>{const e={stage:name,at:performance.now(),...data};stages.push(e);console.info('OUTPUT_TARGET '+JSON.stringify(e));};
 let pose,pixels,glError,calls=0,diagnostics;
 try{
  composer.renderToScreen=false;
  pass.render=function(r,ignored,readBuffer){calls++;this.renderToScreen=false;stage('output-pass-enter',{readSize:[readBuffer.width,readBuffer.height],readType:readBuffer.texture.type,sameRenderer:r===renderer});const result=prior.render.call(this,r,target,readBuffer);stage('output-pass-exit',{framebuffer:!!renderer.properties.get(target).__webglFramebuffer,currentTarget:renderer.getRenderTarget()===target,viewport:renderer.getViewport(new T.Vector4()).toArray()});return result;};
  stage('drawing');pose=draw();if(pose&&typeof pose.then==='function')throw Error('Draw must be synchronous');
  diagnostics={calls,targetProperties:Object.keys(renderer.properties.get(target)),framebuffer:!!renderer.properties.get(target).__webglFramebuffer,contextLost:renderer.getContext().isContextLost(),passes:composer.passes.map(p=>({name:p.constructor.name,enabled:p.enabled,screen:p.renderToScreen})),readBuffer:{width:composer.readBuffer.width,height:composer.readBuffer.height,type:composer.readBuffer.texture.type,framebuffer:!!renderer.properties.get(composer.readBuffer).__webglFramebuffer}};
  stage('frame-drawn',diagnostics);
  if(calls!==1||!diagnostics.framebuffer||diagnostics.contextLost)throw Error('Output target was not populated: '+JSON.stringify(diagnostics));
  const readback=readFramebufferRGBA(renderer,{target,width,height});pixels=readback.pixels;diagnostics.readback=readback.audit;glError=readback.audit.glError;stage('pixels-read',readback.audit);
 }finally{pass.render=prior.render;pass.renderToScreen=prior.passScreen;composer.renderToScreen=prior.screen;renderer.setRenderTarget(prior.target,prior.face,prior.mip);target.dispose();}
 let nonzeroRgb=0,nonzeroAlpha=0,min=255,max=0;for(let i=0;i<pixels.length;i+=4){if(pixels[i]||pixels[i+1]||pixels[i+2])nonzeroRgb++;if(pixels[i+3])nonzeroAlpha++;min=Math.min(min,pixels[i],pixels[i+1],pixels[i+2]);max=Math.max(max,pixels[i],pixels[i+1],pixels[i+2]);}
 const pixelAudit={nonzeroRgb,nonzeroAlpha,min,max,totalPixels:width*height};stage('pixel-audit',pixelAudit);
 if(nonzeroAlpha===0||nonzeroRgb===0)throw Error('Empty output target is not a rendered review: '+JSON.stringify(pixelAudit));
 const row=width*4,topDown=new Uint8Array(pixels.length);for(let y=0;y<height;y++)topDown.set(pixels.subarray((height-1-y)*row,(height-y)*row),y*row);
 let binary='';for(let at=0;at<topDown.length;at+=32768)binary+=String.fromCharCode(...topDown.subarray(at,at+32768));const encoded=btoa(binary);stage('rgba-encoded');
 return{width,height,rgbaBase64:encoded,pose,glError,pixelAudit,diagnostics,seconds:(performance.now()-start)/1000,stages,provenance:'Existing OutputPass, unchanged tone mapping and sRGB transfer; explicitly bound RGBA8 READ_FRAMEBUFFER, top-down raw RGBA'};
}
