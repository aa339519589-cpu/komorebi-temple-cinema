import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const out='output/live-entry-test';await mkdir(out,{recursive:true});
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);const {server}=await import('./server.mjs');let browser;const report={startedAt:new Date().toISOString(),fixtures:[]};
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
 for(const name of ['render-compat-smoke','live-compat-smoke']){
  const page=await browser.newPage({viewport:{width:128,height:128}});const record={name,events:[],errors:[]};report.fixtures.push(record);
  let rejectFatal;const fatal=new Promise((_,reject)=>{rejectFatal=reject});fatal.catch(()=>{});
  page.on('console',m=>{record.events.push({type:m.type(),text:m.text()});console.log(name,m.type(),m.text());});
  page.on('pageerror',e=>{record.errors.push(String(e.stack||e));rejectFatal(e);});
  try{await Promise.race([page.goto('http://127.0.0.1:4317/qa/'+name+'.html',{waitUntil:'load',timeout:30000}),fatal]);await Promise.race([page.waitForFunction(()=>window.ready,null,{timeout:30000}),fatal]);record.result=await page.evaluate(()=>window.smoke);await page.screenshot({path:out+'/'+name+'.png'});}catch(e){record.error=String(e.stack||e)}finally{await page.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
 }
 report.passed=report.fixtures.every(f=>f.result?.passed&&!f.errors.length&&!f.error);if(!report.passed)process.exitCode=1;
}catch(e){report.error=String(e.stack||e);process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(browser)await browser.close();server.close();}
