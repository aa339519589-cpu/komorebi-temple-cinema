import {mkdir,writeFile,appendFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const out='output/live-entry-diagnostic';await mkdir(out,{recursive:true});
const report={startedAt:new Date().toISOString(),commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),events:[],status:'running'};
const save=()=>writeFile(out+'/report.json',JSON.stringify(report,null,2));await save();
const log=(type,data)=>{const e={at:new Date().toISOString(),type,data};report.events.push(e);console.log(JSON.stringify(e));};
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),{server}=await import('./server.mjs');let browser,page;
const deadline=setTimeout(async()=>{report.status='hard-timeout';await save();process.exit(2)},360000);
const heartbeat=setInterval(()=>log('node-alive',{elapsedSeconds:(Date.now()-Date.parse(report.startedAt))/1000}),15000);
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog']});
 for(const [name,url] of [['compat-smoke','/qa/live-compat-smoke.html'],['full-scene','/render-live.html?render=1&defer=1&w=640&h=640&scene=shared']]){
  page=await browser.newPage({viewport:{width:640,height:640}});let fail;
  const fatal=new Promise((_,reject)=>{fail=reject});fatal.catch(()=>{});
  page.on('pageerror',e=>{log('pageerror',String(e.stack||e));fail(e)});page.on('crash',()=>{log('page-crash',name);fail(Error('Page crashed'))});
  page.on('console',m=>log('browser-'+m.type(),m.text().slice(0,3000)));page.on('requestfailed',r=>log('request-failed',{url:r.url(),failure:r.failure()}));
  log('open',{name,url});await Promise.race([page.goto('http://127.0.0.1:4317'+url,{waitUntil:'load',timeout:180000}),fatal]);
  await Promise.race([page.waitForFunction(n=>n==='compat-smoke'?window.ready:window.temple?.ready,name,{timeout:180000}),fatal]);
  if(name==='compat-smoke'){report.smoke=await page.evaluate(()=>window.smoke);if(!report.smoke.passed)throw Error('Compatibility fixture failed');await page.screenshot({path:out+'/compat-smoke.png'});}
  else{report.scene=await page.evaluate(()=>window.temple.info());log('scene-ready',report.scene);}
  await save();await page.close();page=null;
 }
 report.status='passed';
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;log('error',report.error)}finally{
 clearInterval(heartbeat);clearTimeout(deadline);report.finishedAt=new Date().toISOString();await save();
 if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,'passed='+(report.status==='passed')+'\n');
 const cleanup=setTimeout(()=>process.exit(process.exitCode||0),10000);cleanup.unref();if(browser)await browser.close().catch(()=>{});server.close();
}
