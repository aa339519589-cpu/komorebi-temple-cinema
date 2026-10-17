/** Genuine WebGL A/B pixels from ONE preserved temple scene, not screenshots. */
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {renderAndReadRgba,encodeRgbaPng} from './raw-webgl-readback.mjs';
const dir=resolve('output/r14-filigree-review');await mkdir(dir,{recursive:true});
const hash=data=>createHash('sha256').update(data).digest('hex');
const req=JSON.parse(await readFile('tools/render-r14-request.json','utf8'));
if(!Array.isArray(req.jobs)||req.jobs.length!==2||req.jobs.some(j=>j.reference!==6||j.width!==960||j.scene!=='shared'||!/^&r14=[01]$/.test(j.query)))throw Error('Require two strictly bounded reference6 matching review jobs');
if(req.jobs[0].query!=='&r14=0'||req.jobs[1].query!=='&r14=1'||JSON.stringify(req.jobs[0].camera)!==JSON.stringify(req.jobs[1].camera))throw Error('Reference6 pose mismatch, reject purported A/B');
const sourceFiles={};for(const file of (await readdir('src')).filter(n=>n.endsWith('.js')).sort())sourceFiles['src/'+file]=hash(await readFile('src/'+file));
const report={label:'R14 actual default-framebuffer readPixels, matched scene-camera/materials',commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHash:hash(JSON.stringify(sourceFiles)),request:req,environment:'GitHub hosted Mac Metal (NOT owner Mac)',status:'starting',startedAt:new Date().toISOString(),stages:[],jobs:[],referenceFidelityAccepted:false};
const save=()=>writeFile(join(dir,'report.json'),JSON.stringify(report,null,2));
const stage=(event,details={})=>{const s={event,time:new Date().toISOString(),...details};report.stages.push(s);console.log(JSON.stringify(s));return save();};
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const {server}=await import('./server.mjs');let browser,page;
async function bounded(p,ms){let timer;try{return await Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('WebGL timed out after '+ms+'ms')),ms)})]);}finally{clearTimeout(timer)}}
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 report.browserVersion=browser.version();
 page=await browser.newPage({viewport:{width:960,height:960},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>{errors.push(String(e));console.error(e)});page.on('console',m=>{if(m.type()==='info'||m.type()==='error'||m.type()==='warning')console.log('browser:',m.type(),m.text().slice(0,900));if(m.type()==='error')errors.push(m.text())});page.on('crash',()=>errors.push('Renderer crashed'));
 await page.route('**/*',route=>{const u=new URL(route.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?route.continue():route.abort('blockedbyclient')});
 await stage('build-start',{revision:'current v60 runtime plus opt-in true 3D R14'});
 const started=performance.now();
 await page.goto('http://127.0.0.1:4317/render-live.html?render=1&defer=1&w=960&h=960&scene=shared&r14=1',{waitUntil:'load',timeout:600000});
 await page.waitForFunction(()=>window.temple?.ready&&window.temple?.r14Stage?.filigree,null,{timeout:600000});
 report.buildSeconds=(performance.now()-started)/1000;
 const stats=await page.evaluate(()=>window.temple.r14Stage.filigree.report());
 await stage('build-complete',{seconds:report.buildSeconds,filigree:stats});
 for(const job of req.jobs){
  const entry={id:job.id,config:job,status:'rendering',startedAt:new Date().toISOString()};report.jobs.push(entry);await save();
  const enabled=job.query.endsWith('1');
  const state=await page.evaluate(enable=>{
   const t=window.temple,stage=t.r14Stage;
   stage.filigree.setEnabled(enable);
   t.renderer.shadowMap.needsUpdate=true;
   t.scene.traverse(o=>{if(o.isLight&&o.castShadow&&o.shadow)o.shadow.needsUpdate=true});
   return{filigree:stage.filigree.report(),sceneMeshes:t.scene.children.length};
  },enabled);
  await stage('render-start',{id:job.id,enabled,instances:state.filigree.instances});
  const start=performance.now();
  // Draw the real current Three.js scene and capture the real framebuffer.
  const raw=await bounded(renderAndReadRgba(page,job),540000);
  Object.assign(entry,raw.receipt,{mode:enabled?'pierced':'solid-control',renderAndReadSeconds:(performance.now()-start)/1000,filigree:state.filigree});
  const png=join(dir,job.id+'.png');encodeRgbaPng(raw,png);entry.file=job.id+'.png';entry.pngSha256=hash(await readFile(png));
  const pair=join(dir,job.id+'-left-reference-right-render.png');
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i','references/hd/4-照片-5.jpg','-i',png,'-filter_complex','[0:v]scale=960:960[a];[a][1:v]hstack[out]','-map','[out]','-frames:v','1',pair],{timeout:60000});
  entry.pair=job.id+'-left-reference-right-render.png';entry.status='rendered';entry.finishedAt=new Date().toISOString();await stage('render-complete',{id:job.id,sha256:entry.pngSha256,elapsedSeconds:entry.renderAndReadSeconds,pixels:entry.pixelCheck,glErrors:[entry.beforeError,entry.afterError]});
 }
 if(report.jobs[0].rgbaSha256===report.jobs[1].rgbaSha256)throw Error('Materially changed R14 scene produced same pixel hash: invalid A/B');
 if(report.jobs.some(j=>j.glError||j.beforeError||j.afterError||j.programs.some(p=>!p.linked)))throw Error('Shader/WebGL errors detected');
 report.status=errors.length?'rendered-with-console-errors':'real-3d-frames-verified';report.consoleErrors=errors;
 if(errors.length)process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);console.error(e);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();await save();server.close();if(page)await Promise.race([page.close().catch(()=>{}),new Promise(r=>setTimeout(r,4000))]);if(browser)await Promise.race([browser.close().catch(()=>{}),new Promise(r=>setTimeout(r,4000))]);}
