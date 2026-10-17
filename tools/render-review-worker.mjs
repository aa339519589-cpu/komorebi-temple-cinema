/** Actual current-source WebGL review; never substitutes generated artwork. */
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
const root=fileURLToPath(new URL('..',import.meta.url));process.chdir(root);
const output=resolve(process.env.OUTPUT_DIR||'output/real-review');await mkdir(output,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),sourceFiles={};
for(const file of (await readdir('src')).filter(f=>f.endsWith('.js')).sort())sourceFiles['src/'+file]=hash(await readFile('src/'+file));
const sourceHash=hash(JSON.stringify(sourceFiles));
let commit='unavailable';try{commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()}catch{}
const revision=JSON.parse(await readFile('frozen-manifest.json','utf8')).revision;
const requestPath=process.env.REQUEST_FILE||'tools/render-review-request.json';
const request=existsSync(requestPath)?JSON.parse(await readFile(requestPath,'utf8')):{label:'baseline',jobs:[{id:'sanctuary-baseline',reference:6,width:640}]};
if(!Array.isArray(request.jobs)||!request.jobs.length||request.jobs.length>12)throw Error('Require 1 to 12 review jobs');
const report={revision,commit,sourceHash,sourceFiles,request,startedAt:new Date().toISOString(),status:'starting',jobs:[],stages:[],referenceFidelityAccepted:false};
let pendingSave=Promise.resolve();const save=()=>pendingSave=pendingSave.then(()=>writeFile(join(output,'report.json'),JSON.stringify(report,null,2)));await save();
const spec=process.env.PLAYWRIGHT_MODULE||'playwright';const {chromium}=await import(spec.startsWith('/')?pathToFileURL(spec).href:spec);
const {server}=await import('./server.mjs');let browser,browserServer,page,identity='',active=null;
const references={1:'0-照片-1.jpg',2:'1-照片-2.jpg',3:'2-照片-3.jpg',4:'3-照片-4.jpg',5:'5-照片-6.jpg',6:'4-照片-5.jpg',7:'6-照片-7.jpg',8:'7-照片-8.jpg',9:'8-照片-9.jpg',10:'9-照片-10.jpg'};
const timeout=Number(process.env.RENDER_TIMEOUT_MS||600000);
if(!Number.isFinite(timeout)||timeout<1000||timeout>1800000)throw Error('Invalid bounded review timeout');
async function bounded(promise,label,ms=timeout){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' timed out after '+ms+'ms')),ms)})])}finally{clearTimeout(timer)}}
let fatalReject;let fatal;
function attach(p){
 fatal=new Promise((_,reject)=>{fatalReject=reject});fatal.catch(()=>{});
 p.on('pageerror',e=>{(active?.errors||report.errors||= []).push(String(e));fatalReject(e);});
 p.on('crash',()=>fatalReject(Error('Browser page crashed')));
 p.on('console',m=>{const text=m.text();console.log('browser:',m.type(),text.slice(0,2400));
  if(m.type()==='error'){(active?.errors||report.errors||= []).push(text);if(/WebGLProgram|Shader Error|VALIDATE_STATUS/.test(text))fatalReject(Error(text.slice(0,1600)));}
  if(m.type()==='info'){report.stages.push({at:new Date().toISOString(),job:active?.id||'smoke',message:text.slice(0,2400)});save().catch(()=>{});}
 });
}
async function checked(promise,label,ms=timeout){return bounded(Promise.race([promise,fatal]),label,ms)}
async function closePage(){if(!page)return;try{await bounded(page.close({runBeforeUnload:false}),'Close old page',10000)}catch{throw Error('Old render page failed to close; aborting rather than opening duplicate workload');}page=null;}
const heartbeat=setInterval(()=>{console.log(JSON.stringify({event:'heartbeat',job:active?.id||null,phase:active?.status||report.status,lastStage:report.stages.at(-1),at:new Date().toISOString()}));},30000);
async function terminate(signal){report.status='interrupted';report.signal=signal;report.finishedAt=new Date().toISOString();await save().catch(()=>{});browserServer?.process()?.kill('SIGKILL');server.close();process.exit(130);}
process.once('SIGTERM',()=>void terminate('SIGTERM'));process.once('SIGINT',()=>void terminate('SIGINT'));
try{
 const backend=process.env.RENDER_BACKEND||(process.platform==='darwin'?'metal':'swiftshader');
 if(!['metal','swiftshader'].includes(backend))throw Error('Unknown backend');
 const args=['--disable-dev-shm-usage','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--disable-background-timer-throttling','--disable-renderer-backgrounding','--force-color-profile=srgb'];
 if(backend==='metal')args.push('--use-angle=metal');else args.push('--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader');
 browserServer=await chromium.launchServer({headless:process.env.RENDER_HEADLESS!=='false',args});browser=await chromium.connect(browserServer.wsEndpoint());
 report.browser=browser.version();report.requestedBackend=backend;report.platform=process.platform;report.executionEnvironment=process.env.GITHUB_ACTIONS?'GitHub Actions hosted runner, not owner Mac':'Explicit local process';
 report.status='compatibility-smoke';page=await browser.newPage({viewport:{width:128,height:128}});attach(page);
 await checked(page.goto(`http://127.0.0.1:${process.env.PORT||4317}/qa/render-compat-smoke.html`,{waitUntil:'load',timeout:60000}),'Import-map wrapper smoke',60000);
 await checked(page.waitForFunction(()=>window.compatSmoke?.ready,null,{timeout:60000}),'Renderer wrapper smoke',60000);
 report.compatSmoke=await page.evaluate(()=>window.compatSmoke);if(report.compatSmoke.glError||report.compatSmoke.programs.some(p=>!p.linked))throw Error('Actual renderer wrapper smoke failed');await save();await closePage();
 for(const job of request.jobs){
  if(!/^[a-z0-9-]{1,80}$/.test(job.id)||!Number.isInteger(job.reference)||job.reference<1||job.reference>10)throw Error('Invalid job');
  const width=job.width??640,variant=job.scene??'shared';if(!Number.isInteger(width)||width<320||width>1600||!['shared','reference10-porch'].includes(variant))throw Error('Invalid size or scene');
  active={id:job.id,job,sourceHash,status:'building',startedAt:new Date().toISOString(),errors:[]};report.jobs.push(active);report.status='running';await save();
  const began=performance.now(),key=variant+':'+width+':'+(job.query||'');
  if(identity!==key){await closePage();page=await browser.newPage({viewport:{width,height:width},deviceScaleFactor:1});page.setDefaultTimeout(timeout);attach(page);
   await page.route('**/*',route=>{const u=new URL(route.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port===String(process.env.PORT||4317))?route.continue():route.abort('blockedbyclient')});
   await checked(page.goto(`http://127.0.0.1:${process.env.PORT||4317}/render-live.html?render=1&defer=1&w=${width}&h=${width}&scene=${variant}${job.query||''}`,{waitUntil:'load',timeout}),'Current scene build');
   await checked(page.waitForFunction(()=>window.temple?.ready,null,{timeout}),'Current scene ready');identity=key;
  }
  active.buildSeconds=(performance.now()-began)/1000;active.status='rendering';await save();console.log(JSON.stringify({event:'render',id:job.id,buildSeconds:active.buildSeconds}));
  const frameBegan=performance.now();
  active.camera=await checked(page.evaluate(j=>{const t=window.temple,draw=()=>j.camera?t.renderView(j.camera.position,j.camera.target,j.camera.time??0,j.camera.fov??48):t.renderReference(j.reference);let pose=draw();if(j.review){if(typeof t.configureVisualReview!=='function')throw Error('Visual review API unavailable');t.configureVisualReview(j.review);pose=draw();}if(Number.isFinite(j.exposure)){t.renderer.toneMappingExposure=j.exposure;pose=draw();}t.renderer.getContext().finish();return pose},job),'Full frame render');
  active.renderSeconds=(performance.now()-frameBegan)/1000;active.status='capturing';await save();
  const file=join(output,job.id+'.png');await checked(page.locator('canvas').first().screenshot({path:file,type:'png',timeout}),'Capture actual canvas');
  active.info=await checked(page.evaluate(()=>window.temple.info()),'Scene receipt');active.glError=await page.evaluate(()=>window.temple.renderer.getContext().getError());active.atlas=await page.evaluate(()=>window.temple.renderer.brdfLookupAtlasInfo?.()??null);
  const png=await readFile(file);active.pngSha256=hash(png);active.pngBytes=png.length;active.png=job.id+'.png';
  const ref=join('references/hd',references[job.reference]);if(existsSync(ref)){
   const pair=job.id+'-left-reference-right-render.png';execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',ref,'-i',file,'-filter_complex',`[0:v]scale=${width}:${width}:force_original_aspect_ratio=decrease,pad=${width}:${width}:(ow-iw)/2:(oh-ih)/2:black[a];[1:v]scale=${width}:${width}[b];[a][b]hstack[out]`,'-map','[out]','-frames:v','1',join(output,pair)],{timeout:60000});active.referenceFile=ref;active.referenceSha256=hash(await readFile(ref));active.comparison=pair;
  }
  active.status=active.errors.length||active.glError?'rendered-with-errors':'rendered-review';active.completedAt=new Date().toISOString();await save();console.log(JSON.stringify({event:'rendered',id:job.id,status:active.status,renderSeconds:active.renderSeconds,gpu:active.info.gpu,pngSha256:active.pngSha256}));
 }
 report.status=report.jobs.every(j=>j.status==='rendered-review')?'rendered-review':'errors';if(report.status==='errors')process.exitCode=1;
}catch(error){report.status='failed';report.error=String(error.stack||error);process.exitCode=1;console.error(error)}finally{
 clearInterval(heartbeat);report.finishedAt=new Date().toISOString();await save();
 // Kill only the browser this process launched. Never wait indefinitely in pagehide cleanup.
 if(browserServer){try{await bounded(browserServer.close(),'Browser close',5000)}catch{browserServer.process()?.kill('SIGKILL');}}
 server.close();
}
