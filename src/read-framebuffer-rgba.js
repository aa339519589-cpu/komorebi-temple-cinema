/** Exact RGBA8 readback; does not modify the draw framebuffer or scene rendering. */
export function readFramebufferRGBA(renderer,{target=null,width,height}={}){
 if(!renderer?.isWebGLRenderer)throw Error('Actual WebGL renderer required');
 const gl=renderer.getContext();width??=target?.width??gl.drawingBufferWidth;height??=target?.height??gl.drawingBufferHeight;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>4096||height>4096||gl.isContextLost())throw Error('Invalid readback extent/context');
 const framebuffer=target?renderer.properties.get(target).__webglFramebuffer:null;
 if(target&&(!framebuffer||Array.isArray(framebuffer)||target.samples))throw Error('Require initialized single-sample RGBA target');
 const previous={read:gl.getParameter(gl.READ_FRAMEBUFFER_BINDING),packBuffer:gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING),alignment:gl.getParameter(gl.PACK_ALIGNMENT),rowLength:gl.getParameter(gl.PACK_ROW_LENGTH),skipRows:gl.getParameter(gl.PACK_SKIP_ROWS),skipPixels:gl.getParameter(gl.PACK_SKIP_PIXELS)};
 const pixels=new Uint8Array(width*height*4),audit={target:target?'explicit-rgba8':'native-default',readBindingAlreadyMatched:previous.read===framebuffer,width,height};
 let savedReadBuffer;
 try{
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER,framebuffer);
  savedReadBuffer=gl.getParameter(gl.READ_BUFFER);
  if(gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Read framebuffer incomplete');
  gl.readBuffer(framebuffer?gl.COLOR_ATTACHMENT0:gl.BACK);
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);gl.pixelStorei(gl.PACK_ALIGNMENT,1);gl.pixelStorei(gl.PACK_ROW_LENGTH,0);gl.pixelStorei(gl.PACK_SKIP_ROWS,0);gl.pixelStorei(gl.PACK_SKIP_PIXELS,0);
  gl.finish();gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);audit.glError=gl.getError();
  if(audit.glError)throw Error('Explicit RGBA readback GL error '+audit.glError);
 }finally{
  if(savedReadBuffer!==undefined)gl.readBuffer(savedReadBuffer);
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER,previous.read);gl.bindBuffer(gl.PIXEL_PACK_BUFFER,previous.packBuffer);
  gl.pixelStorei(gl.PACK_ALIGNMENT,previous.alignment);gl.pixelStorei(gl.PACK_ROW_LENGTH,previous.rowLength);gl.pixelStorei(gl.PACK_SKIP_ROWS,previous.skipRows);gl.pixelStorei(gl.PACK_SKIP_PIXELS,previous.skipPixels);
 }
 return{pixels,audit};
}
