import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const out='output/brdf-gpu-test';await mkdir(out,{recursive:true});
const html=await readFile('qa/brdf-atlas-test.html','utf8');const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];if(!script)throw Error('Missing fixture module');await writeFile(out+'/fixture.mjs',script);execFileSync(process.execPath,['--check',out+'/fixture.mjs']);
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);const {server}=await import('./server.mjs');let browser;const errors=[];let report={status:'starting',errors};
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog']});const page=await browser.newPage({viewport:{width:384,height:256}});page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());console.log(m.type(),m.text().slice(0,2000))});
 await page.goto('http://127.0.0.1:4317/qa/brdf-atlas-test.html',{waitUntil:'load'});await page.waitForFunction(()=>window.ready,null,{timeout:60000});
 report=await page.evaluate(()=>window.auditBrdf());report.browser=browser.version();report.errors=errors;report.environment='GitHub Actions hosted Mac Metal';report.commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 for(const output of report.outputs){const bytes=Buffer.from(output.png.split(',')[1],'base64');await writeFile(out+'/'+output.mode+'.png',bytes);output.png=output.mode+'.png';}
 if(!report.passed||errors.length)process.exitCode=1;
}catch(e){report.error=String(e.stack||e);process.exitCode=1;}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(browser)await browser.close().catch(()=>{});server.close();}
