import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

/** Render and read the actual framebuffer in one browser task. */
export async function renderAndReadRgba(page,job){
 const result=await page.evaluate(j=>{
  const t=window.temple,r=t.renderer,gl=r.getContext();
  const draw=()=>j.camera?t.renderView(j.camera.position,j.camera.target,j.camera.time??0,j.camera.fov??48):t.renderReference(j.reference);
  const started=performance.now();let camera=draw();
  if(Number.isFinite(j.exposure)){r.toneMappingExposure=j.exposure;camera=draw();}
  gl.finish();const rendered=performance.now();
  console.info(JSON.stringify({readbackStage:'rendered',id:j.id,renderSeconds:(rendered-started)/1000}));
  const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight;
  if(!width||!height||width>4096||height>4096)throw Error('Invalid actual framebuffer dimensions');
  const previous=gl.getParameter(gl.FRAMEBUFFER_BINDING),beforeError=gl.getError(),bytes=new Uint8Array(width*height*4);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  try{gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,bytes);}finally{gl.bindFramebuffer(gl.FRAMEBUFFER,previous);}
  const afterError=gl.getError(),read=performance.now();
  console.info(JSON.stringify({readbackStage:'rgba-read',id:j.id,seconds:(read-rendered)/1000,beforeError,afterError}));
  let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+16384,bytes.length)));
  return {camera,width,height,beforeError,afterError,renderSeconds:(rendered-started)/1000,readSeconds:(read-rendered)/1000,rgbaBase64:btoa(binary),renderer:r.brdfLookupAtlasInfo?.()||null,info:t.info()};
 },job);
 const bytes=Buffer.from(result.rgbaBase64,'base64');delete result.rgbaBase64;
 if(bytes.length!==result.width*result.height*4)throw Error('Framebuffer transfer byte count mismatch');
 result.rgbaSha256=createHash('sha256').update(bytes).digest('hex');
 return {receipt:result,bytes};
}

/** ffmpeg only encodes the existing bytes and flips WebGL's bottom-up rows. */
export function encodeRgbaPng({receipt,bytes},file){
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size',`${receipt.width}x${receipt.height}`,'-i','pipe:0','-vf','vflip','-frames:v','1','-c:v','png',file],{input:bytes,maxBuffer:16*1024*1024});
}
