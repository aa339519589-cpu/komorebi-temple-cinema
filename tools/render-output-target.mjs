import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {writeFileSync,appendFileSync,existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out=resolve('output/output-target-review');await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),sourceFiles={};
for(const f of (await readdir('src')).filter(f=>f.endsWith('.js')).sort())sourceFiles['src/'+f]=hash(await readFile('src/'+f));
const requestFile='tools/output-target-request.json';
const request=existsSync(requestFile)?JSON.parse(await readFile(requestFile)):{jobs:[{id:'sanctuary-fbo-baseline',reference:6,width:640,scene:'shared'}]};
const report={startedAt:new Date().toISOString(),commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHash:hash(JSON.stringify(sourceFiles)),sourceFiles,request,status:'starting',jobs:[],events:[],notOwnerMac:true,referenceFidelityAccepted:false};
function event(stage,data={}){const e={at:new Date().toISOString(),stage,...data};report.events.push(e);writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));appendFileSync(join(out,'events.ndjson'),JSON.stringify(e)+'\n');console.log(JSON.stringify(e));}
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),{server}=await import('./server.mjs');
let browser,page,active,fail;let fatal=new Promise(()=>{});
async function bounded(p,label,ms=300000){let timer;try{return await Promise.race([p,fatal,new Promise((_,r)=>timer=setTimeout(()=>r(Error(label+' timeout')),ms))]);}finally{clearTimeout(timer)}}
function attach(p){fatal=new Promise((_,r)=>{fail=r});fatal.catch(()=>{});p.on('pageerror',e=>{event('page-error',{message:String(e)});fail(e)});p.on('crash',()=>fail(Error('page crashed')));p.on('console',m=>{event('console',{type:m.type(),text:m.text().slice(0,3000)});if(m.type()==='error')active?.errors.push(m.text())});}
const refFiles={1:'0-照片-1.jpg',2:'1-照片-2.jpg',3:'2-照片-3.jpg',4:'3-照片-4.jpg',5:'5-照片-6.jpg',6:'4-照片-5.jpg',7:'6-照片-7.jpg',8:'7-照片-8.jpg',9:'8-照片-9.jpg',10:'9-照片-10.jpg'};
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb','--disable-background-timer-throttling','--disable-renderer-backgrounding']});report.browser=browser.version();
 page=await browser.newPage({viewport:{width:192,height:128}});attach(page);
 await bounded(page.goto('http://127.0.0.1:4317/qa/capture-target-fixture.html',{waitUntil:'load'}),'Fixture load',60000);
 await bounded(page.waitForFunction(()=>window.captureTestResult,null,{timeout:60000}),'Fixture result',60000);
 report.fixture=await page.evaluate(()=>window.captureTestResult);event('fixture',report.fixture);if(!report.fixture.passed)throw Error('Output target native comparison failed');
 await page.close();page=null;let key='';
 if(!Array.isArray(request.jobs)||request.jobs.length<1||request.jobs.length>12)throw Error('Require 1 to 12 jobs');
 for(const job of request.jobs){
  const width=job.width??640,scene=job.scene??'shared';
  if(!/^[a-z0-9-]{1,80}$/.test(job.id)||!Number.isInteger(width)||width<320||width>1600||!Number.isInteger(job.reference)||job.reference<1||job.reference>10||!['shared','reference10-porch'].includes(scene))throw Error('Invalid job');
  active={job,status:'building',errors:[],startedAt:new Date().toISOString()};report.jobs.push(active);event('job-start',{id:job.id});
  const identity=width+':'+scene+':'+(job.query||'');const begin=performance.now();
  if(key!==identity){if(page)await bounded(page.close(),'Old page close',10000);page=await browser.newPage({viewport:{width,height:width},deviceScaleFactor:1});attach(page);await page.route('**/*',r=>{const u=new URL(r.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?r.continue():r.abort('blockedbyclient')});
   await bounded(page.goto(`http://127.0.0.1:4317/render-live.html?render&defer&w=${width}&h=${width}&scene=${scene}${job.query||''}`,{waitUntil:'load',timeout:300000}),'Scene load');await bounded(page.waitForFunction(()=>window.temple?.ready,null,{timeout:300000}),'Scene ready');key=identity;
  }
  active.buildSeconds=(performance.now()-begin)/1000;active.status='rendering';event('ready',{id:job.id,seconds:active.buildSeconds});
  const result=await bounded(page.evaluate(async j=>{const {captureOutputTarget}=await import('/src/capture-output-target.js');const t=window.temple;return captureOutputTarget(t,()=>{if(Number.isFinite(j.exposure))t.renderer.toneMappingExposure=j.exposure;return j.camera?t.renderView(j.camera.position,j.camera.target,j.camera.time??0,j.camera.fov??48):t.renderReference(j.reference)});},job),'Full output target render/readback');
  const rgba=Buffer.from(result.rgbaBase64,'base64');delete result.rgbaBase64;if(rgba.length!==width*width*4)throw Error('Wrong pixel byte count');
  active.capture=result;const raw=join(out,job.id+'.rgba'),png=join(out,job.id+'.png');await writeFile(raw,rgba);
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size',`${width}x${width}`,'-i',raw,'-frames:v','1',png],{timeout:60000});
  active.png=job.id+'.png';active.pngSha256=hash(await readFile(png));active.info=await bounded(page.evaluate(()=>window.temple.info()),'Scene info');
  active.shaderAudit=await bounded(page.evaluate(()=>{const r=window.temple.renderer,g=r.getContext();return{glError:g.getError(),programs:r.info.programs.map(p=>({linked:g.getProgramParameter(p.program,g.LINK_STATUS),log:g.getProgramInfoLog(p.program)})),atlas:r.brdfLookupAtlasInfo?.(),packing:r.materialSamplerPackingInfo?.()};}),'Shader info');
  active.groups=await bounded(page.evaluate(()=>{const result=[];window.temple.scene.traverse(o=>{if(o.isGroup&&o.name)result.push({name:o.name,parent:o.parent?.name||'',matrix:o.matrixWorld.toArray()})});return result;}),'Scene groups');
  const ref='references/hd/'+refFiles[job.reference],pair=job.id+'-left-reference-right-render.png';execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',ref,'-i',png,'-filter_complex',`[0:v]scale=${width}:${width}[a];[a][1:v]hstack[out]`,'-map','[out]','-frames:v','1',join(out,pair)],{timeout:60000});active.comparison=pair;active.referenceSha256=hash(await readFile(ref));
  active.status=active.errors.length||active.shaderAudit.glError||active.shaderAudit.programs.some(p=>!p.linked)?'rendered-with-errors':'rendered-review';event('job-finished',{id:job.id,status:active.status});
 }
 report.status=report.jobs.every(j=>j.status==='rendered-review')?'rendered-review':'errors';if(report.status==='errors')process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);event('failed',{message:report.error});process.exitCode=1}finally{report.finishedAt=new Date().toISOString();event('finished',{status:report.status});server.close();const timer=setTimeout(()=>process.exit(process.exitCode||0),6000);if(browser)await Promise.race([browser.close().catch(()=>{}),new Promise(r=>setTimeout(r,4500))]);clearTimeout(timer);process.exit(process.exitCode||0);}
