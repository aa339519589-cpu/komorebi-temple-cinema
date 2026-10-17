import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const out='output/material-packing-gpu';await mkdir(out,{recursive:true});
const html=await readFile('qa/material-packing-gpu.html','utf8');const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];if(!script)throw Error('Missing fixture');await writeFile(out+'/fixture.mjs',script);execFileSync(process.execPath,['--check',out+'/fixture.mjs']);
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);const {server}=await import('./server.mjs');let browser;const errors=[];let report={status:'starting',errors};
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog']});const page=await browser.newPage({viewport:{width:384,height:256}});let rejectFatal;const fatal=new Promise((_,reject)=>{rejectFatal=reject});fatal.catch(()=>{});
 page.on('pageerror',e=>{errors.push(String(e));rejectFatal(e)});page.on('console',m=>{if(m.type()==='error')errors.push(m.text());console.log(m.type(),m.text().slice(0,2000))});
 await Promise.race([page.goto('http://127.0.0.1:4317/qa/material-packing-gpu.html',{waitUntil:'load',timeout:60000}),fatal]);await Promise.race([page.waitForFunction(()=>window.ready,null,{timeout:60000}),fatal]);
 report=await Promise.race([page.evaluate(()=>window.auditPacking()),fatal]);report.errors=errors;report.browser=browser.version();report.environment='GitHub Actions hosted Mac Metal';report.commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 for(const frame of report.frames){await writeFile(out+'/'+frame.mode+'.png',Buffer.from(frame.png.split(',')[1],'base64'));frame.png=frame.mode+'.png';}if(!report.passed||errors.length)process.exitCode=1;
}catch(error){report.error=String(error.stack||error);process.exitCode=1;}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(browser)await browser.close();server.close();}
