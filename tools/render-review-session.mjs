import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {writeFileSync,appendFileSync,existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
const output=resolve(process.env.OUTPUT_DIR||'output/hosted-metal-review');await mkdir(output,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const sourceFiles={};for(const name of (await readdir('src')).filter(n=>n.endsWith('.js')).sort())sourceFiles['src/'+name]=hash(await readFile('src/'+name));
const sourceHash=hash(JSON.stringify(sourceFiles));
const request=JSON.parse(await readFile(process.env.REQUEST_FILE||'tools/render-hosted-request.json','utf8'));
const timeout=Number(process.env.RENDER_TIMEOUT_MS||300000);
const report={startedAt:new Date().toISOString(),status:'starting',sourceHash,sourceFiles,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),request,executionEnvironment:'GitHub Actions hosted Mac Metal, not owner Mac',jobs:[],events:[],referenceFidelityAccepted:false};
const save=()=>writeFileSync(join(output,'report.json'),JSON.stringify(report,null,2));
const event=(kind,data={})=>{const e={at:new Date().toISOString(),kind,...data};report.events.push(e);appendFileSync(join(output,'events.ndjson'),JSON.stringify(e)+'\n');save();console.log(JSON.stringify(e));};
const references={1:'0-照片-1.jpg',2:'1-照片-2.jpg',3:'2-照片-3.jpg',4:'3-照片-4.jpg',5:'5-照片-6.jpg',6:'4-照片-5.jpg',7:'6-照片-7.jpg',8:'7-照片-8.jpg',9:'8-照片-9.jpg',10:'9-照片-10.jpg'};
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);const {server}=await import('./server.mjs');let browser,page,key='',active=null,rejectFatal;
let fatal=new Promise(()=>{});let timer;
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
   if(page)await page.close({runBeforeUnload:false});
   page=await browser.newPage({viewport:{width,height:width},deviceScaleFactor:1});
   fatal=new Promise((_,reject)=>{rejectFatal=reject;});fatal.catch(()=>{});
   page.on('console',m=>{const text=m.text();event('browser-console',{type:m.type(),text:text.slice(0,4000)});if(m.type()==='error')active?.errors.push(text);});
   page.on('pageerror',error=>{const message=String(error.stack||error);active?.errors.push(message);event('page-error',{message});rejectFatal(error);});
   page.on('crash',()=>{event('page-crashed');rejectFatal(Error('Renderer process crashed'));});
   page.on('requestfailed',req=>event('request-failed',{url:req.url(),error:req.failure()?.errorText}));
   await page.route('**/*',route=>{const u=new URL(route.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?route.continue():route.abort('blockedbyclient')});
   const url=`http://127.0.0.1:4317/render-live.html?render=1&defer=1&w=${width}&h=${width}&scene=${variant}${job.query||''}`;event('load',{url});
   await timed(page.goto(url,{waitUntil:'load',timeout}),'Page load');
   await timed(page.waitForFunction(()=>window.temple?.ready,null,{timeout}),'Scene build');key=identity;
  }
  active.buildSeconds=(performance.now()-begin)/1000;active.status='rendering';event('scene-ready',{id:job.id,seconds:active.buildSeconds});
  const start=performance.now();
  active.camera=await timed(page.evaluate(j=>{const t=window.temple;const draw=()=>j.camera?t.renderView(j.camera.position,j.camera.target,j.camera.time??0,j.camera.fov??48):t.renderReference(j.reference);let result=draw();if(Number.isFinite(j.exposure)){t.renderer.toneMappingExposure=j.exposure;result=draw();}t.renderer.getContext().finish();return result;},job),'Frame');
  active.renderSeconds=(performance.now()-start)/1000;event('frame-drawn',{id:job.id,seconds:active.renderSeconds});
  const file=join(output,job.id+'.png');await timed(page.locator('canvas').first().screenshot({path:file,type:'png',timeout}),'Screenshot');
  active.info=await page.evaluate(()=>window.temple.info());active.glError=await page.evaluate(()=>window.temple.renderer.getContext().getError());active.brdfAtlas=await page.evaluate(()=>window.temple.renderer.brdfLookupAtlasInfo?.()??null);active.png=job.id+'.png';active.pngSha256=hash(await readFile(file));
  const reference=join('references/hd',references[job.reference]);if(existsSync(reference)){const pair=join(output,job.id+'-left-reference-right-render.png');execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',reference,'-i',file,'-filter_complex',`[0:v]scale=${width}:${width}:force_original_aspect_ratio=decrease,pad=${width}:${width}:(ow-iw)/2:(oh-ih)/2:black[a];[1:v]scale=${width}:${width}[b];[a][b]hstack[out]`,'-map','[out]','-frames:v','1',pair]);active.comparison=job.id+'-left-reference-right-render.png';active.referenceSha256=hash(await readFile(reference));}
  active.status=active.glError||active.errors.length?'rendered-with-errors':'rendered-review';active.completedAt=new Date().toISOString();event('job-finished',{id:job.id,status:active.status,gpu:active.info.gpu});
 }
 report.status=report.jobs.every(j=>j.status==='rendered-review')?'rendered-review':'errors';if(report.status==='errors')process.exitCode=1;
}catch(error){report.status='failed';report.error=String(error.stack||error);event('failure',{message:report.error});process.exitCode=1;}finally{
 report.finishedAt=new Date().toISOString();save();server.close();
 // A GPU driver may stall browser teardown; never withhold already-written evidence.
 timer=setTimeout(()=>process.exit(process.exitCode||0),5000);timer.unref();
 if(browser)await Promise.race([browser.close().catch(()=>{}),new Promise(r=>setTimeout(r,4500))]);
 clearTimeout(timer);
}
