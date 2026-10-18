import {mkdir,writeFile,appendFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {execFileSync} from 'node:child_process';
const out='output/runtime-trace';await mkdir(out,{recursive:true});
const began=performance.now();const report={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),events:[],status:'starting',environment:'GitHub Actions hosted Mac; not owner Mac'};
const save=()=>writeFile(out+'/report.json',JSON.stringify(report,null,2));
function record(kind,message){const event={seconds:(performance.now()-began)/1000,kind,message};report.events.push(event);console.log(JSON.stringify(event));return appendFile(out+'/events.jsonl',JSON.stringify(event)+'\n')}
await save();
const deadline=setTimeout(async()=>{report.status='deadline';await record('deadline','The trace exceeded five minutes; preserving evidence.');await save();process.exit(2);},300000);
let browser,server;
try{
 const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
 ({server}=await import('./server.mjs'));
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});
 const page=await browser.newPage({viewport:{width:480,height:480}});let rejectFatal;
 const fatal=new Promise((_,reject)=>{rejectFatal=reject});fatal.catch(()=>{});
 page.on('pageerror',e=>{record('pageerror',String(e.stack||e));rejectFatal(e)});
 page.on('console',m=>record(m.type(),m.text().slice(0,6000)));
 page.on('requestfailed',r=>{record('requestfailed',{url:r.url(),failure:r.failure()});rejectFatal(Error('Request failed '+r.url()))});
 page.on('response',r=>{if(r.status()>=400){record('http-error',{url:r.url(),status:r.status()});rejectFatal(Error('HTTP '+r.status()+' '+r.url()))}});
 await page.goto('http://127.0.0.1:4317/',{waitUntil:'domcontentloaded'});
 const constructor=await Promise.race([page.evaluate(async()=>{const T=await import('/src/three-render-compat.js');const r=new T.WebGLRenderer();const info=r.brdfLookupAtlasInfo();r.dispose();r.forceContextLoss();return info}),fatal]);
 report.constructor=constructor;await record('constructor-passed',constructor);await save();
 await Promise.race([page.goto('http://127.0.0.1:4317/render-live.html?render=1&defer=1&w=480&h=480&scene=shared',{waitUntil:'commit',timeout:120000}),fatal]);
 await Promise.race([page.waitForFunction(()=>window.temple?.ready,null,{timeout:240000}),fatal]);
 report.info=await Promise.race([page.evaluate(()=>window.temple.info()),fatal]);await record('scene-ready',report.info);await save();
 report.pose=await Promise.race([page.evaluate(()=>{const p=window.temple.renderReference(6);window.temple.renderer.getContext().finish();return p}),fatal]);
 await page.locator('canvas').first().screenshot({path:out+'/current-sanctuary.png',type:'png',timeout:120000});
 report.glError=await page.evaluate(()=>window.temple.renderer.getContext().getError());report.status=report.glError?'rendered-with-gl-error':'rendered';await record('rendered',report.pose);
}catch(error){report.status='failed';report.error=String(error.stack||error);await record('failed',report.error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();await save();clearTimeout(deadline);const hardExit=setTimeout(()=>process.exit(process.exitCode||0),5000);try{if(browser)await browser.close();if(server)server.close();}finally{clearTimeout(hardExit)}}
