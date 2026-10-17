/** Execute actual current-source WebGL review jobs. No generated-image service. */
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
const root=fileURLToPath(new URL('..',import.meta.url));process.chdir(root);
const output=resolve(process.env.OUTPUT_DIR||'output/real-review');await mkdir(output,{recursive:true});
const sha256=b=>createHash('sha256').update(b).digest('hex');
const sourceFiles={};
for(const file of (await readdir('src')).filter(f=>f.endsWith('.js')).sort())sourceFiles['src/'+file]=sha256(await readFile('src/'+file));
const sourceHash=sha256(JSON.stringify(sourceFiles));
let commit='unavailable';try{commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()}catch{}
const revision=JSON.parse(await readFile('frozen-manifest.json','utf8')).revision;
const defaults={label:'v60-unmodified-baseline',jobs:[{id:'sanctuary-baseline',reference:6,width:640,scene:'shared'},{id:'rain-courtyard-baseline',reference:10,width:640,scene:'reference10-porch'}]};
const requestPath=process.env.REQUEST_FILE||'tools/render-review-request.json';
const request=existsSync(requestPath)?JSON.parse(await readFile(requestPath,'utf8')):defaults;
if(!Array.isArray(request.jobs)||!request.jobs.length||request.jobs.length>12)throw Error('Require 1 to 12 review jobs');
const report={revision,commit,sourceHash,sourceFiles,request,startedAt:new Date().toISOString(),status:'running',jobs:[],referenceFidelityAccepted:false};
const save=()=>writeFile(join(output,'report.json'),JSON.stringify(report,null,2));await save();
const spec=process.env.PLAYWRIGHT_MODULE||'playwright';const {chromium}=await import(spec.startsWith('/')?pathToFileURL(spec).href:spec);
const {server}=await import('./server.mjs');let browser,page,identity='',activeReceipt=null;
const references={1:'0-照片-1.jpg',2:'1-照片-2.jpg',3:'2-照片-3.jpg',4:'3-照片-4.jpg',5:'5-照片-6.jpg',6:'4-照片-5.jpg',7:'6-照片-7.jpg',8:'7-照片-8.jpg',9:'8-照片-9.jpg',10:'9-照片-10.jpg'};
const timeout=Number(process.env.RENDER_TIMEOUT_MS||1200000);
if(!Number.isFinite(timeout)||timeout<1000||timeout>3600000)throw Error('Invalid render timeout');
async function bounded(promise,label){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' timed out')),timeout)})])}finally{clearTimeout(timer)}}
try{
 const backend=process.env.RENDER_BACKEND||(process.platform==='darwin'?'metal':'swiftshader');
 if(!['metal','swiftshader'].includes(backend))throw Error('Unknown render backend');
 const args=['--disable-dev-shm-usage','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--disable-background-timer-throttling','--disable-renderer-backgrounding','--force-color-profile=srgb'];
 if(backend==='metal')args.push('--use-angle=metal');else args.push('--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader');
 browser=await chromium.launch({headless:process.env.RENDER_HEADLESS!=='false',args});
 report.browser=browser.version();report.requestedBackend=backend;report.executionEnvironment=process.env.GITHUB_ACTIONS?'GitHub Actions hosted runner, not owner Mac':'Explicit local process';report.platform=process.platform;
 for(const job of request.jobs){
  if(!/^[a-z0-9-]{1,80}$/.test(job.id)||!Number.isInteger(job.reference)||job.reference<1||job.reference>10)throw Error('Invalid job identity or reference');
  const width=job.width??640,variant=job.scene??'shared';
  if(!Number.isInteger(width)||width<320||width>1600||!['shared','reference10-porch'].includes(variant))throw Error('Invalid resolution or scene');
  const receipt={id:job.id,job,sourceHash,startedAt:new Date().toISOString(),status:'building',errors:[]};activeReceipt=receipt;report.jobs.push(receipt);await save();console.log(JSON.stringify({event:'build',id:job.id,width,variant}));
  const key=variant+':'+width+':'+(job.query||'');const began=performance.now();
  if(identity!==key){
   if(page)await page.close();page=await browser.newPage({viewport:{width,height:width},deviceScaleFactor:1});
   page.setDefaultTimeout(timeout);page.on('pageerror',e=>activeReceipt?.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')activeReceipt?.errors.push(m.text());if(m.type()==='error'||m.type()==='warning')console.log('browser:',m.type(),m.text().slice(0,1800));});
   await page.route('**/*',route=>{const u=new URL(route.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port===String(process.env.PORT||4317))?route.continue():route.abort('blockedbyclient')});
   await page.goto(`http://127.0.0.1:${process.env.PORT||4317}/render-live.html?render=1&defer=1&w=${width}&h=${width}&scene=${variant}${job.query||''}`,{waitUntil:'load',timeout});
   await page.waitForFunction(()=>window.temple?.ready,null,{timeout});identity=key;
  }
  receipt.buildSeconds=(performance.now()-began)/1000;receipt.status='rendering';await save();console.log(JSON.stringify({event:'render',id:job.id,buildSeconds:receipt.buildSeconds}));
  const started=performance.now();
  receipt.camera=await bounded(page.evaluate(async j=>{const t=window.temple;const draw=()=>j.camera?t.renderView(j.camera.position,j.camera.target,j.camera.time??0,j.camera.fov??48):t.renderReference(j.reference);let pose=draw();if(j.review){if(typeof t.configureVisualReview!=='function')throw Error('Visual review API unavailable');t.configureVisualReview(j.review);pose=draw();}if(Number.isFinite(j.exposure)){t.renderer.toneMappingExposure=j.exposure;pose=draw();}t.renderer.getContext().finish();return pose},job),'Frame render');
  receipt.renderSeconds=(performance.now()-started)/1000;
  const file=join(output,job.id+'.png');await page.locator('canvas').first().screenshot({path:file,type:'png',timeout});
  receipt.info=await page.evaluate(()=>window.temple.info());receipt.glError=await page.evaluate(()=>window.temple.renderer.getContext().getError());
  receipt.review=await page.evaluate(()=>window.temple.visualReviewInfo?.()??null);
  const png=await readFile(file);receipt.pngSha256=sha256(png);receipt.pngBytes=png.length;receipt.png=job.id+'.png';
  const reference=join('references/hd',references[job.reference]);
  if(existsSync(reference)){
    const pair=join(output,job.id+'-left-reference-right-render.png');
    execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',reference,'-i',file,'-filter_complex',`[0:v]scale=${width}:${width}:force_original_aspect_ratio=decrease,pad=${width}:${width}:(ow-iw)/2:(oh-ih)/2:black[a];[1:v]scale=${width}:${width}[b];[a][b]hstack[out]`,'-map','[out]','-frames:v','1',pair]);
    receipt.referenceFile=reference;receipt.referenceSha256=sha256(await readFile(reference));receipt.comparison=job.id+'-left-reference-right-render.png';
  }
  receipt.status=receipt.errors.length||receipt.glError?'rendered-with-errors':'rendered-review';receipt.completedAt=new Date().toISOString();await save();console.log(JSON.stringify({event:'rendered',id:job.id,status:receipt.status,renderSeconds:receipt.renderSeconds,gpu:receipt.info.gpu,sha256:receipt.pngSha256}));
 }
 report.status=report.jobs.every(j=>j.status==='rendered-review')?'rendered-review':'errors';if(report.status==='errors')process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;console.error(e)}finally{report.finishedAt=new Date().toISOString();await save();if(page)await page.close().catch(()=>{});if(browser)await browser.close().catch(()=>{});server.close()}
