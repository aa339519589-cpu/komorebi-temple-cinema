/** Execute actual current-source WebGL review jobs. No generated-image service. */
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
const root=fileURLToPath(new URL('..',import.meta.url));process.chdir(root);
const output=resolve('output/real-review');await mkdir(output,{recursive:true});
const sha256=b=>createHash('sha256').update(b).digest('hex');
const sourceFiles={};
for(const file of (await readdir('src')).filter(f=>f.endsWith('.js')).sort())sourceFiles['src/'+file]=sha256(await readFile('src/'+file));
const sourceHash=sha256(JSON.stringify(sourceFiles));
let commit='unavailable';try{commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()}catch{}
const revision=JSON.parse(await readFile('frozen-manifest.json','utf8')).revision;
const defaults={label:'v60-unmodified-baseline',jobs:[{id:'sanctuary-baseline',reference:6,width:640,scene:'shared'},{id:'rain-courtyard-baseline',reference:10,width:640,scene:'reference10-porch'}]};
const request=existsSync('tools/render-review-request.json')?JSON.parse(await readFile('tools/render-review-request.json','utf8')):defaults;
if(!Array.isArray(request.jobs)||!request.jobs.length||request.jobs.length>12)throw Error('Require 1 to 12 review jobs');
const report={revision,commit,sourceHash,sourceFiles,request,startedAt:new Date().toISOString(),status:'running',jobs:[],referenceFidelityAccepted:false};
const save=()=>writeFile(join(output,'report.json'),JSON.stringify(report,null,2));await save();
const spec=process.env.PLAYWRIGHT_MODULE||'playwright';const {chromium}=await import(spec.startsWith('/')?pathToFileURL(spec).href:spec);
const {server}=await import('./server.mjs');let browser,page,identity='';
const references={1:'0-照片-1.jpg',2:'1-照片-2.jpg',3:'2-照片-3.jpg',4:'3-照片-4.jpg',5:'5-照片-6.jpg',6:'4-照片-5.jpg',7:'6-照片-7.jpg',8:'7-照片-8.jpg',9:'8-照片-9.jpg',10:'9-照片-10.jpg'};
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--disable-background-timer-throttling','--disable-renderer-backgrounding','--force-color-profile=srgb']});
 report.browser=browser.version();report.executionEnvironment='GitHub Actions software WebGL fallback, not owner Mac';
 for(const job of request.jobs){
  if(!/^[a-z0-9-]{1,80}$/.test(job.id)||!Number.isInteger(job.reference)||job.reference<1||job.reference>10)throw Error('Invalid job identity or reference');
  const width=job.width??640,variant=job.scene??'shared';
  if(!Number.isInteger(width)||width<320||width>1600||!['shared','reference10-porch'].includes(variant))throw Error('Invalid resolution or scene');
  const receipt={id:job.id,job,sourceHash,startedAt:new Date().toISOString(),status:'building',errors:[]};report.jobs.push(receipt);await save();console.log(JSON.stringify({event:'build',id:job.id,width,variant}));
  const key=variant+':'+width+':'+(job.query||'');const began=performance.now();
  if(identity!==key){
   if(page)await page.close();page=await browser.newPage({viewport:{width,height:width},deviceScaleFactor:1});
   page.setDefaultTimeout(600000);page.on('pageerror',e=>receipt.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')receipt.errors.push(m.text());if(m.type()==='error'||m.type()==='warning')console.log('browser:',m.type(),m.text().slice(0,1800));});
   await page.route('**/*',route=>{const u=new URL(route.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port===String(process.env.PORT||4317))?route.continue():route.abort('blockedbyclient')});
   await page.goto(`http://127.0.0.1:${process.env.PORT||4317}/render-live.html?render=1&defer=1&w=${width}&h=${width}&scene=${variant}${job.query||''}`,{waitUntil:'load',timeout:600000});
   await page.waitForFunction(()=>window.temple?.ready,null,{timeout:600000});identity=key;
  }
  receipt.buildSeconds=(performance.now()-began)/1000;receipt.status='rendering';await save();console.log(JSON.stringify({event:'render',id:job.id,buildSeconds:receipt.buildSeconds}));
  const started=performance.now();
  receipt.camera=await page.evaluate(j=>{const t=window.temple;if(Number.isFinite(j.exposure))t.renderer.toneMappingExposure=j.exposure;let pose=j.camera?t.renderView(j.camera.position,j.camera.target,j.camera.time??0,j.camera.fov??48):t.renderReference(j.reference);t.renderer.getContext().finish();return pose},job);
  receipt.renderSeconds=(performance.now()-started)/1000;
  const file=join(output,job.id+'.png');await page.locator('canvas').first().screenshot({path:file,type:'png',timeout:600000});
  receipt.info=await page.evaluate(()=>window.temple.info());receipt.glError=await page.evaluate(()=>window.temple.renderer.getContext().getError());
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
