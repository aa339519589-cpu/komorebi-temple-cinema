/** Read the real final OutputPass from an explicit RGBA8 target.
 * Avoids the browser/compositor canvas snapshot path. No scene content,
 * camera, lights, materials, AO, reflections or tone mapping are substituted.
 */
import * as T from '../vendor/build/three.module.js';
export function captureOutputTarget(temple, draw) {
 if(!temple?.renderer?.isWebGLRenderer||typeof draw!=='function')throw Error('Require actual renderer and synchronous frame callback');
 const {renderer,composer}=temple,pass=composer.passes.filter(p=>p.enabled).at(-1);
 if(!pass?.isOutputPass)throw Error('The last enabled pass must be the existing OutputPass');
 const size=renderer.getDrawingBufferSize(new T.Vector2()),width=size.x,height=size.y;
 if(width<1||height<1||width>4096||height>4096)throw Error('Invalid bounded capture size');
 const target=new T.WebGLRenderTarget(width,height,{format:T.RGBAFormat,type:T.UnsignedByteType,minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:false,stencilBuffer:false});
 target.texture.name='actual-output-pass-readback';
 const prior={screen:composer.renderToScreen,render:pass.render,target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel()};
 const stages=[],start=performance.now();const stage=name=>{const e={stage:name,at:performance.now()};stages.push(e);console.info('OUTPUT_TARGET '+JSON.stringify(e));};
 let pose,pixels,glError;
 try{
  composer.renderToScreen=false;
  pass.render=function(r,ignored,readBuffer){this.renderToScreen=false;return prior.render.call(this,r,target,readBuffer);};
  stage('drawing');pose=draw();if(pose&&typeof pose.then==='function')throw Error('Frame callback must be synchronous');stage('frame-drawn');
  pixels=new Uint8Array(width*height*4);renderer.readRenderTargetPixels(target,0,0,width,height,pixels);stage('pixels-read');
  glError=renderer.getContext().getError();if(glError)throw Error('Output target readback GL error '+glError);
 }finally{pass.render=prior.render;composer.renderToScreen=prior.screen;renderer.setRenderTarget(prior.target,prior.face,prior.mip);target.dispose();}
 const row=width*4,topDown=new Uint8Array(pixels.length);for(let y=0;y<height;y++)topDown.set(pixels.subarray((height-1-y)*row,(height-y)*row),y*row);
 let binary='';for(let at=0;at<topDown.length;at+=32768)binary+=String.fromCharCode(...topDown.subarray(at,at+32768));
 const encoded=btoa(binary);stage('rgba-encoded');
 return{width,height,rgbaBase64:encoded,pose,glError,seconds:(performance.now()-start)/1000,stages,provenance:'Existing final OutputPass, unchanged tone mapping and sRGB transfer, explicit RGBA8 target; top-down raw RGBA'};
}
