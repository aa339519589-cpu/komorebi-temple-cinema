import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {writeFileSync,appendFileSync,existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {deflateSync} from 'node:zlib';
import {performance} from 'node:perf_hooks';
const output=resolve(process.env.OUTPUT_DIR||'output/hosted-metal-review');await mkdir(output,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const sourceFiles={};for(const name of (await readdir('src')).filter(n=>n.endsWith('.js')).sort())sourceFiles['src/'+name]=hash(await readFile('src/'+name));
const sourceHash=hash(JSON.stringify(sourceFiles));
const request=JSON.parse(await readFile(process.env.REQUEST_FILE||'tools/render-hosted-request.json','utf8'));
if(!Array.isArray(request.jobs)||!request.jobs.length||request.jobs.length>12)throw Error('Require 1 to 12 render jobs');
const timeout=Number(process.env.RENDER_TIMEOUT_MS||300000);
const report={startedAt:new Date().toISOString(),status:'starting',sourceHash,sourceFiles,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),request,executionEnvironment:'GitHub Actions hosted Mac Metal, not owner Mac',jobs:[],events:[],referenceFidelityAccepted:false};
const save=()=>writeFileSync(join(output,'report.json'),JSON.stringify(report,null,2));
const event=(kind,data={})=>{const e={at:new Date().toISOString(),kind,...data};report.events.push(e);appendFileSync(join(output,'events.ndjson'),JSON.stringify(e)+'\n');save();console.log(JSON.stringify(e));};
const references={1:'0-照片-1.jpg',2:'1-照片-2.jpg',3:'2-照片-3.jpg',4:'3-照片-4.jpg',5:'5-照片-6.jpg',6:'4-照片-5.jpg',7:'6-照片-7.jpg',8:'7-照片-8.jpg',9:'8-照片-9.jpg',10:'9-照片-10.jpg'};
function pngFromRgba(bytes,width,height){
 if(bytes.length!==width*height*4)throw Error('Incomplete WebGL readback');
 const crc=data=>{let c=0xffffffff;for(const v of data){c^=v;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
 const chunk=(name,data)=>{const type=Buffer.from(name),body=Buffer.concat([type,data]),head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE(crc(body));return Buffer.concat([head,body,tail]);};
 const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 const scanlines=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++)bytes.copy(scanlines,y*(width*4+1)+1,(height-y-1)*width*4,(height-y)*width*4);
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('sRGB',Buffer.from([0])),chunk('IDAT',deflateSync(scanlines,{level:6})),chunk('IEND',Buffer.alloc(0))]);
}
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);const {server}=await import('./server.mjs');let browser,page,key='',active=null,rejectFatal;
let fatal=new Promise(()=>{});
async function timed(promise,label){let t;try{return await Promise.race([promise,fatal,new Promise((_,reject)=>{t=setTimeout(()=>reject(Error(label+' timeout')),timeout);})]);}finally{clearTimeout(t)}}
try{
 const backend=process.env.RENDER_BACKEND||'metal';const args=['--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb','--disable-background-timer-throttling','--disable-renderer-backgrounding'];
 if(backend==='metal')args.push('--use-angle=metal');else if(backend==='swiftshader')args.push('--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader');else throw Error('Unknown backend');
 browser=await chromium.launch({headless:process.env.RENDER_HEADLESS!=='false',args});report.browser=browser.version();report.backend=backend;
 for(const job of request.jobs){
  const width=job.width||640,variant=job.scene||'shared';
  if(!/^[a-z0-9-]{1,80}$/.test(job.id)||!Number.isInteger(job.reference)||job.reference<1||job.reference>10||!Number.isInteger(width)||width<320||width>1600||!['shared','reference10-porch'].includes(variant))throw Error('Invalid job');
  active={id:job.id,job,status:'building',startedAt:new Date().toISOString(),errors:[]};report.jobs.push(active);event('job-start',{id:job.id});
  const identity=variant+':'+width+':'+(job.query||'');const begin=performance.now();
  if(identity!==key){
   if(page){event('closing-prior-scene');await timed(page.close({runBeforeUnload:false}),'Prior scene close');}
   page=await browser.newPage({viewport:{width,height:width},deviceScaleFactor:1});
   fatal=new Promise((_,reject)=>{rejectFatal=reject;});fatal.catch(()=>{});
   page.on('console',m=>{const text=m.text();event('browser-console',{type:m.type(),text:text.slice(0,4000)});if(m.type()==='error')active?.errors.push(text);});
   page.on('pageerror',error=>{const message=String(error.stack||error);active?.errors.push(message);event('page-error',{message});rejectFatal(error);});
   page.on('crash',()=>{event('page-crashed');rejectFatal(Error('Renderer process crashed'));});
   page.on('requestfailed',req=>event('request-failed',{url:req.url(),error:req.failure()?.errorText}));
   await page.route('**/*',route=>{const u=new URL(route.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?route.continue():route.abort('blockedbyclient')});
   const url=`http://127.0.0.1:4317/render-live.html?render=1&defer=1&w=${width}&h=${width}&scene=${variant}${job.query||''}`;event('load',{url});
   await timed(page.goto(url,{waitUntil:'load',timeout}),'Page load');await timed(page.waitForFunction(()=>window.temple?.ready,null,{timeout}),'Scene build');key=identity;
  }
  active.buildSeconds=(performance.now()-begin)/1000;active.status='rendering';event('scene-ready',{id:job.id,seconds:active.buildSeconds});
  const started=performance.now();
  const frame=await timed(page.evaluate(j=>{
   const t=window.temple,r=t.renderer,g=r.getContext();
   const camera=j.camera?t.renderView(j.camera.position,j.camera.target,j.camera.time??0,j.camera.fov??48):t.renderReference(j.reference);
   if(Number.isFinite(j.exposure)){r.toneMappingExposure=j.exposure;t.composer.render();}
   g.finish();const width=g.drawingBufferWidth,height=g.drawingBufferHeight;
   const pixels=new Uint8Array(width*height*4);g.readPixels(0,0,width,height,g.RGBA,g.UNSIGNED_BYTE,pixels);const glError=g.getError();
   let binary='';for(let i=0;i<pixels.length;i+=16384)binary+=String.fromCharCode(...pixels.subarray(i,i+16384));
   const types=[g.SAMPLER_2D,g.SAMPLER_CUBE,g.SAMPLER_2D_SHADOW,g.SAMPLER_CUBE_SHADOW,g.SAMPLER_2D_ARRAY,g.SAMPLER_2D_ARRAY_SHADOW];
   const programs=r.info.programs.map(p=>{const linked=g.getProgramParameter(p.program,g.LINK_STATUS),samplers=[];if(linked)for(let i=0;i<g.getProgramParameter(p.program,g.ACTIVE_UNIFORMS);i++){const u=g.getActiveUniform(p.program,i);if(types.includes(u.type))samplers.push({name:u.name,size:u.size});}return{linked,samplers,count:samplers.reduce((s,x)=>s+x.size,0),log:linked?'':g.getProgramInfoLog(p.program)};});
   return{camera,width,height,rgbaBase64:btoa(binary),glError,info:t.info(),exposure:r.toneMappingExposure,brdfAtlas:r.brdfLookupAtlasInfo?.()??null,materialPacking:r.materialSamplerPackingInfo?.()??null,shaderAudit:{maxTextureUnits:g.getParameter(g.MAX_TEXTURE_IMAGE_UNITS),programs}};
  },job),'Frame and native RGBA readback');
  const rgba=Buffer.from(frame.rgbaBase64,'base64');delete frame.rgbaBase64;Object.assign(active,frame);active.renderAndReadbackSeconds=(performance.now()-started)/1000;
  const bytes=pngFromRgba(rgba,frame.width,frame.height),file=join(output,job.id+'.png');await writeFile(file,bytes);
  active.captureMethod='Synchronous actual WebGL RGBA readPixels, row-flipped and losslessly PNG-encoded';active.png=job.id+'.png';active.pngSha256=hash(bytes);event('actual-pixels-saved',{id:job.id,seconds:active.renderAndReadbackSeconds,bytes:bytes.length});
  const reference=join('references/hd',references[job.reference]);if(existsSync(reference)){const pair=join(output,job.id+'-left-reference-right-render.png');execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',reference,'-i',file,'-filter_complex',`[0:v]scale=${width}:${width}:force_original_aspect_ratio=decrease,pad=${width}:${width}:(ow-iw)/2:(oh-ih)/2:black[a];[1:v]scale=${width}:${width}[b];[a][b]hstack[out]`,'-map','[out]','-frames:v','1',pair]);active.comparison=job.id+'-left-reference-right-render.png';active.referenceSha256=hash(await readFile(reference));}
  active.status=active.glError||active.errors.length||active.shaderAudit.programs.some(p=>!p.linked)?'rendered-with-errors':'rendered-review';active.completedAt=new Date().toISOString();event('job-finished',{id:job.id,status:active.status,gpu:active.info.gpu});
 }
 report.status=report.jobs.every(j=>j.status==='rendered-review')?'rendered-review':'errors';if(report.status==='errors')process.exitCode=1;
}catch(error){report.status='failed';report.error=String(error.stack||error);event('failure',{message:report.error});process.exitCode=1;}finally{
 report.finishedAt=new Date().toISOString();save();server.close();const killer=setTimeout(()=>process.exit(process.exitCode||0),6000);
 if(browser)await Promise.race([browser.close().catch(()=>{}),new Promise(r=>setTimeout(r,4500))]);clearTimeout(killer);process.exit(process.exitCode||0);
}
