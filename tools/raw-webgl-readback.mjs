import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

/** Keep the draw and the actual default-framebuffer read in the same browser task. */
export async function renderAndReadRgba(page,job){
 // Module loading precedes the synchronous draw/read task, never separates its operations.
 if(job.look||job.details)await page.evaluate(async j=>{
  if(j.look)window.__reference6Looks=await import('/src/reference6-lighting-study.js');
  if(j.details)window.__reference6Details=await import('/src/reference6-detail-study.js');
 },job);
 const result=await page.evaluate(j=>{
  const t=window.temple,r=t.renderer,gl=r.getContext();
  // A new ordinary view must not inherit the prior study's added lights,
  // private material response, floor varnish or fine metal geometry.
  if(!j.look&&t.reference6LookInfo){window.__reference6Looks.disposeReference6Look(t);delete t.reference6LookInfo;if(j.reference===6)r.toneMappingExposure=1.10;}
  if(!j.details&&t.reference6DetailInfo){window.__reference6Details.disposeReference6DetailStudy(t);delete t.reference6DetailInfo;r.shadowMap.needsUpdate=true;t.scene.traverse(o=>{if(o.isLight&&o.castShadow&&o.shadow)o.shadow.needsUpdate=true;});}
  const draw=()=>j.camera?t.renderView(j.camera.position,j.camera.target,j.camera.time??0,j.camera.fov??48):t.renderReference(j.reference);
  const started=performance.now();let camera=draw(),look=null,detail=null,redraw=false;
  if(j.look){if(j.reference!==6)throw Error('Reference6 look cannot apply to another view');look=window.__reference6Looks.applyReference6Look(t,j.look);redraw=true;}
  if(j.details){if(j.reference!==6||j.details!=='filigree')throw Error('Unknown or mismatched reference6 detail study');detail=window.__reference6Details.applyReference6DetailStudy(t,true);redraw=true;}
  if(Number.isFinite(j.exposure)){if(j.exposure<=0||j.exposure>4)throw Error('Exposure is outside review bounds');r.toneMappingExposure=j.exposure;redraw=true;}
  if(redraw)camera=draw();
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
  const programs=r.info.programs.map(p=>({linked:gl.getProgramParameter(p.program,gl.LINK_STATUS),log:gl.getProgramInfoLog(p.program)}));
  return {camera,look,detail,exposure:r.toneMappingExposure,width,height,beforeError,afterError,programs,renderSeconds:(rendered-started)/1000,readSeconds:(read-rendered)/1000,rgbaBase64:btoa(binary),renderer:r.brdfLookupAtlasInfo?.()||null,info:t.info()};
 },job);
 const bytes=Buffer.from(result.rgbaBase64,'base64');delete result.rgbaBase64;
 if(bytes.length!==result.width*result.height*4)throw Error('Framebuffer transfer byte count mismatch');
 let sum=[0,0,0],black=0,opaque=0,max=0,min=255;
 for(let i=0;i<bytes.length;i+=4){for(let c=0;c<3;c++)sum[c]+=bytes[i+c];const v=Math.max(bytes[i],bytes[i+1],bytes[i+2]);max=Math.max(max,v);min=Math.min(min,v);if(v<3)black++;if(bytes[i+3]>250)opaque++;}
 const n=bytes.length/4;result.pixelCheck={rgbMean:sum.map(s=>s/n),blackFraction:black/n,opaqueFraction:opaque/n,min,max};
 if(max-min<8||black/n>.999||opaque/n<.80)throw Error('Rejected empty, uniform or transparent framebuffer: '+JSON.stringify(result.pixelCheck));
 if(result.beforeError||result.afterError||result.programs.some(p=>!p.linked))throw Error('Rejected invalid GPU frame');
 result.rgbaSha256=createHash('sha256').update(bytes).digest('hex');
 return {receipt:result,bytes};
}

/** CPU encoder only flips WebGL rows and encodes these actual pixel bytes. */
export function encodeRgbaPng({receipt,bytes},file){
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size',`${receipt.width}x${receipt.height}`,'-i','pipe:0','-vf','vflip','-frames:v','1','-c:v','png',file],{input:bytes,maxBuffer:16*1024*1024,timeout:60000});
}
