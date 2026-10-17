import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
const out=process.env.OUTPUT_DIR||'output/reference6-calibration';await mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const sourceFiles={};for(const f of (await readdir('src')).filter(n=>n.endsWith('.js')).sort())sourceFiles[f]=sha(await readFile('src/'+f));
const request=JSON.parse(await readFile('tools/render-reference6-calibration.json','utf8'));
const report={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceFiles,sourceHash:sha(JSON.stringify(sourceFiles)),request,startedAt:new Date().toISOString(),status:'starting',environment:'GitHub Actions hosted Mac Metal, not owner Mac',jobs:[],events:[],referenceFidelityAccepted:false};
const save=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
function event(kind,value){const e={at:new Date().toISOString(),kind,value};report.events.push(e);save();console.log(JSON.stringify(e));}
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);const {server}=await import('./server.mjs');let browser,page,fatal,rejectFatal,active;
async function bound(p,label,ms=300000){let timer;try{return await Promise.race([p,fatal,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error(label+' timeout')),ms))]);}finally{clearTimeout(timer)}}
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 const width=request.jobs[0].width;page=await browser.newPage({viewport:{width,height:width},deviceScaleFactor:1});
 fatal=new Promise((_,reject)=>rejectFatal=reject);fatal.catch(()=>{});
 page.on('pageerror',e=>{event('page-error',String(e.stack||e));rejectFatal(e)});page.on('crash',()=>rejectFatal(Error('Browser renderer crashed')));
 page.on('console',m=>{event('browser-'+m.type(),m.text().slice(0,6000));if(m.type()==='error')active?.errors.push(m.text())});
 await page.route('**/*',route=>{const u=new URL(route.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?route.continue():route.abort('blockedbyclient')});
 const start=performance.now();
 await bound(page.goto(`http://127.0.0.1:4317/render-live.html?render=1&defer=1&w=${width}&h=${width}&scene=shared`,{waitUntil:'load',timeout:300000}),'Load');
 await bound(page.waitForFunction(()=>window.temple?.ready,null,{timeout:300000}),'Scene');report.buildSeconds=(performance.now()-start)/1000;event('scene-ready',report.buildSeconds);
 for(const job of request.jobs){
  if(job.reference!==6||job.width!==width||job.scene!=='shared'||!/^[a-z0-9-]{1,80}$/.test(job.id))throw Error('This controlled pass only accepts shared sanctuary jobs at one resolution');
  active={id:job.id,job,errors:[],status:'drawing'};report.jobs.push(active);event('draw-start',job.id);
  const began=performance.now();
  const result=await bound(page.evaluate(j=>{
   const t=window.temple,r=t.renderer,gl=r.getContext();
   if(gl.isContextLost())throw Error('Context lost before render');
   const draw=()=>j.camera?t.renderView(j.camera.position,j.camera.target,j.camera.time??41.95,j.camera.fov??78):t.renderReference(6);
   let pose=draw();if(Number.isFinite(j.exposure)){r.toneMappingExposure=j.exposure;pose=draw();}gl.finish();
   console.info('readPixels begin '+j.id);
   const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight;
   const previousRead=gl.getParameter(gl.READ_FRAMEBUFFER_BINDING),alignment=gl.getParameter(gl.PACK_ALIGNMENT);
   const pixels=new Uint8Array(width*height*4);let readError;
   try{gl.bindFramebuffer(gl.READ_FRAMEBUFFER,null);gl.readBuffer(gl.BACK);gl.pixelStorei(gl.PACK_ALIGNMENT,1);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);readError=gl.getError();}
   finally{gl.bindFramebuffer(gl.READ_FRAMEBUFFER,previousRead);gl.pixelStorei(gl.PACK_ALIGNMENT,alignment);}
   console.info('readPixels complete '+j.id+' '+readError);
   const chunks=[];for(let i=0;i<pixels.length;i+=16384)chunks.push(String.fromCharCode(...pixels.subarray(i,i+16384)));
   const ext=gl.getExtension('WEBGL_debug_renderer_info');
   const programs=r.info.programs.map(p=>({linked:gl.getProgramParameter(p.program,gl.LINK_STATUS),log:gl.getProgramInfoLog(p.program)}));
   return{width,height,rgbaBase64:btoa(chunks.join('')),readError,pose,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown',programs,atlas:r.brdfLookupAtlasInfo?.(),packing:r.materialSamplerPackingInfo?.(),info:t.info()};
  },job),'Render and native framebuffer readback',180000);
  const bytes=Buffer.from(result.rgbaBase64,'base64');delete result.rgbaBase64;
  if(result.width!==width||result.height!==width||bytes.length!==width*width*4)throw Error('Unexpected actual framebuffer size');
  active.frameSeconds=(performance.now()-began)/1000;active.receipt=result;active.rawBufferSha256=sha(bytes);active.captureMethod='gl.readPixels of default framebuffer in the same task as real 3D draw; external lossless PNG encoding';
  const png=out+'/'+job.id+'.png';
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size',`${width}x${width}`,'-i','pipe:0','-vf','vflip','-frames:v','1',png],{input:bytes,timeout:60000});
  active.png=job.id+'.png';active.pngSha256=sha(await readFile(png));
  const ref='references/hd/4-照片-5.jpg',pair=out+'/'+job.id+'-left-reference-right-render.png';
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',ref,'-i',png,'-filter_complex',`[0:v]scale=${width}:${width}[a];[a][1:v]hstack[out]`,'-map','[out]','-frames:v','1',pair],{timeout:60000});active.comparison=job.id+'-left-reference-right-render.png';active.referenceSha256=sha(await readFile(ref));
  active.status=result.readError||active.errors.length||result.programs.some(p=>!p.linked)?'rendered-with-errors':'rendered-review';event('frame-saved',{id:job.id,status:active.status,seconds:active.frameSeconds});
 }
 report.status=report.jobs.every(j=>j.status==='rendered-review')?'rendered-review':'errors';if(report.status==='errors')process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);event('failed',report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();save();server.close();if(browser)await Promise.race([browser.close().catch(()=>{}),new Promise(r=>setTimeout(r,4000))]);}
