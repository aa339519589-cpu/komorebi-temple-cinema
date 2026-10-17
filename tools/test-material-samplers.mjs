import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const out='output/material-sampler-regression';await mkdir(out,{recursive:true});
const html=await readFile('qa/material-sampler-regression.html','utf8'),source=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];if(!source)throw Error('Missing GPU test module');await writeFile(out+'/fixture.mjs',source);execFileSync(process.execPath,['--check',out+'/fixture.mjs']);
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);const {server}=await import('./server.mjs');let browser,report={status:'starting'},errors=[];
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog']});const page=await browser.newPage({viewport:{width:384,height:256}});
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());console.log(m.type(),m.text().slice(0,1500));});
 await page.goto('http://127.0.0.1:4317/qa/material-sampler-regression.html',{waitUntil:'load',timeout:60000});await page.waitForFunction(()=>window.samplerTestReady,null,{polling:100,timeout:60000});report=await page.evaluate(()=>window.testMaterialSamplerSharing());
 for(const r of report.results){await writeFile(out+'/'+r.mode+'.png',Buffer.from(r.png.split(',')[1],'base64'));r.png=r.mode+'.png';}
 report.errors=errors;report.commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();report.browser=browser.version();report.execution='GitHub hosted Mac Metal';if(!report.passed||errors.length)process.exitCode=1;
}catch(error){report.error=String(error.stack||error);report.errors=errors;process.exitCode=1;}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(browser)await browser.close().catch(()=>{});server.close();}
