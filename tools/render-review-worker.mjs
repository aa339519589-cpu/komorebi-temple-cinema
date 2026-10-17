/** Actual current-source WebGL review with bounded, attributable execution. */
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
process.chdir(fileURLToPath(new URL('..',import.meta.url)));
const out=resolve(process.env.OUTPUT_DIR||'output/real-review');await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),sourceFiles={};
for(const f of (await readdir('src')).filter(f=>f.endsWith('.js')).sort())sourceFiles['src/'+f]=hash(await readFile('src/'+f));
const sourceHash=hash(JSON.stringify(sourceFiles)),revision=JSON.parse(await readFile('frozen-manifest.json')).revision;
const requestPath=process.env.REQUEST_FILE||'tools/render-review-request.json';
const request=existsSync(requestPath)?JSON.parse(await readFile(requestPath)):{jobs:[{id:'sanctuary-baseline',reference:6,width:640}]};
if(!Array.isArray(request.jobs)||!request.jobs.length||request.jobs.length>12)throw Error('Require 1 to 12 jobs');
const report={revision,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHash,sourceFiles,request,status:'starting',startedAt:new Date().toISOString(),jobs:[],stages:[],errors:[],referenceFidelityAccepted:false};
let saves=Promise.resolve();const save=()=>saves=saves.then(()=>writeFile(join(out,'report.json'),JSON.stringify(report,null,2)));await save();
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),{server}=await import('./server.mjs');
const timeout=Number(process.env.RENDER_TIMEOUT_MS||600000);if(!Number.isFinite(timeout)||timeout<1000||timeout>1800000)throw Error('Invalid timeout');
let browserServer,browser,page,active=null,fatal,fail;
async function bounded(p,label,ms=timeout){let t;try{return await Promise.race([p,new Promise((_,reject)=>{t=setTimeout(()=>reject(Error(label+' timeout')),ms)})])}finally{clearTimeout(t)}}
const check=(p,label,ms=timeout)=>bounded(Promise.race([p,fatal]),label,ms);
function attach(p){fatal=new Promise((_,reject)=>{fail=reject});fatal.catch(()=>{});
 p.on('pageerror',e=>{(active?active.errors:report.errors).push(String(e));fail(e)});p.on('crash',()=>fail(Error('Render page crashed')));
 p.on('console',m=>{const text=m.text();console.log('browser:',m.type(),text.slice(0,2400));
  if(m.type()==='error'){(active?active.errors:report.errors).push(text);if(/WebGLProgram|Shader Error|VALIDATE_STATUS/.test(text))fail(Error(text.slice(0,1200)))}
  if(m.type()==='info'){report.stages.push({at:new Date().toISOString(),job:active?.id||'smoke',message:text.slice(0,2400)});save().catch(()=>{})}
 });
}
const refs={1:'0-照片-1.jpg',2:'1-照片-2.jpg',3:'2-照片-3.jpg',4:'3-照片-4.jpg',5:'5-照片-6.jpg',6:'4-照片-5.jpg',7:'6-照片-7.jpg',8:'7-照片-8.jpg',9:'8-照片-9.jpg',10:'9-照片-10.jpg'};
const heartbeat=setInterval(()=>console.log(JSON.stringify({event:'heartbeat',job:active?.id,phase:active?.status||report.status,lastStage:report.stages.at(-1),at:new Date().toISOString()})),30000);
async function stop(signal){report.status='interrupted';report.signal=signal;await save().catch(()=>{});browserServer?.process()?.kill('SIGKILL');process.exit(130)}
process.once('SIGTERM',()=>void stop('SIGTERM'));process.once('SIGINT',()=>void stop('SIGINT'));
try{
 const backend=process.env.RENDER_BACKEND||(process.platform==='darwin'?'metal':'swiftshader');if(!['metal','swiftshader'].includes(backend))throw Error('Invalid backend');
 const args=['--disable-dev-shm-usage','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--disable-background-timer-throttling','--disable-renderer-backgrounding','--force-color-profile=srgb',...(backend==='metal'?['--use-angle=metal']:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])];
 browserServer=await chromium.launchServer({headless:process.env.RENDER_HEADLESS!=='false',args});browser=await chromium.connect(browserServer.wsEndpoint());
 report.browser=browser.version();report.backend=backend;report.environment=process.env.GITHUB_ACTIONS?'GitHub hosted runner, NOT owner Mac':process.platform;
 report.status='compatibility-smoke';page=await browser.newPage({viewport:{width:128,height:128}});attach(page);
 await check(page.goto('http://127.0.0.1:4317/qa/render-compat-smoke.html',{waitUntil:'load',timeout:60000}),'Wrapper import',60000);
 await check(page.waitForFunction(()=>window.compatSmoke?.ready,null,{timeout:60000}),'Wrapper ready',60000);
 report.compatSmoke=await page.evaluate(()=>window.compatSmoke);if(report.compatSmoke.glError||report.compatSmoke.programs.some(p=>!p.linked))throw Error('Wrapper smoke failed');await save();await bounded(page.close(),'Smoke close',10000);page=null;
 let identity='';
 for(const job of request.jobs){
  const width=job.width??640,scene=job.scene??'shared';if(!/^[a-z0-9-]{1,80}$/.test(job.id)||!Number.isInteger(job.reference)||job.reference<1||job.reference>10||!Number.isInteger(width)||width<320||width>1600||!['shared','reference10-porch'].includes(scene))throw Error('Invalid job parameters');
  active={id:job.id,job,sourceHash,status:'building',startedAt:new Date().toISOString(),errors:[]};report.jobs.push(active);report.status='running';await save();const began=performance.now(),key=scene+':'+width+':'+(job.query||'');
  if(identity!==key){if(page)await bounded(page.close(),'Old page close',10000);page=await browser.newPage({viewport:{width,height:width},deviceScaleFactor:1});attach(page);
   await page.route('**/*',r=>{const u=new URL(r.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?r.continue():r.abort('blockedbyclient')});
   await check(page.goto(`http://127.0.0.1:4317/render-live.html?render&defer&w=${width}&h=${width}&scene=${scene}${job.query||''}`,{waitUntil:'load',timeout}),'Scene load');
   await check(page.waitForFunction(()=>window.temple?.ready,null,{timeout}),'Scene ready');identity=key;
  }
  active.buildSeconds=(performance.now()-began)/1000;active.status='rendering';await save();const frameStart=performance.now();
  active.camera=await check(page.evaluate(j=>{const t=window.temple,draw=()=>j.camera?t.renderView(j.camera.position,j.camera.target,j.camera.time??0,j.camera.fov??48):t.renderReference(j.reference);let pose=draw();if(j.review){if(!t.configureVisualReview)throw Error('Review controls missing');t.configureVisualReview(j.review);pose=draw()}if(Number.isFinite(j.exposure)){t.renderer.toneMappingExposure=j.exposure;pose=draw()}t.renderer.getContext().finish();return pose},job),'Frame');
  active.renderSeconds=(performance.now()-frameStart)/1000;active.status='capturing';await save();const file=join(out,job.id+'.png');await check(page.locator('canvas').first().screenshot({path:file,type:'png',timeout}),'PNG');
  active.info=await check(page.evaluate(()=>window.temple.info()),'Info');active.glError=await page.evaluate(()=>window.temple.renderer.getContext().getError());active.atlas=await page.evaluate(()=>window.temple.renderer.brdfLookupAtlasInfo?.()??null);
  const png=await readFile(file);active.png=job.id+'.png';active.pngSha256=hash(png);active.pngBytes=png.length;
  const ref=join('references/hd',refs[job.reference]);if(existsSync(ref)){const pair=job.id+'-left-reference-right-render.png';execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',ref,'-i',file,'-filter_complex',`[0:v]scale=${width}:${width}:force_original_aspect_ratio=decrease,pad=${width}:${width}:(ow-iw)/2:(oh-ih)/2:black[a];[1:v]scale=${width}:${width}[b];[a][b]hstack[out]`,'-map','[out]','-frames:v','1',join(out,pair)],{timeout:60000});active.referenceFile=ref;active.referenceSha256=hash(await readFile(ref));active.comparison=pair}
  active.status=active.errors.length||active.glError?'rendered-with-errors':'rendered-review';active.completedAt=new Date().toISOString();await save();console.log(JSON.stringify({event:'rendered',id:job.id,status:active.status,renderSeconds:active.renderSeconds,gpu:active.info.gpu}));
 }
 report.status=report.jobs.every(j=>j.status==='rendered-review')?'rendered-review':'errors';if(report.status==='errors')process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);console.error(e);process.exitCode=1}finally{clearInterval(heartbeat);report.finishedAt=new Date().toISOString();await save();if(browserServer){try{await bounded(browserServer.close(),'Browser close',5000)}catch{browserServer.process()?.kill('SIGKILL')}}server.close()}
