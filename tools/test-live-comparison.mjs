import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const out='output/live-comparison-test';await mkdir(out,{recursive:true});
for(const name of ['compare-live.html','render-live.html']){const html=await readFile(name,'utf8');let i=0;for(const match of html.matchAll(/<script(?![^>]*type="importmap")[^>]*>([\s\S]*?)<\/script>/g)){if(!match[1].trim())continue;const file=out+'/'+name+'-'+i+++'.mjs';await writeFile(file,match[1]);execFileSync(process.execPath,['--check',file]);}}
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),{server}=await import('./server.mjs');
const report={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),status:'starting',events:[],frames:[],ownerMac:false};
const save=()=>writeFile(out+'/report.json',JSON.stringify(report,null,2));
let browser,page;const watchdog=setTimeout(()=>{report.status='hard-timeout';save().finally(()=>process.exit(124))},660000);
async function completed(){await page.waitForFunction(()=>{const s=document.querySelector('#status').textContent;return s.startsWith('已渲染参考')||/失败|场景错误|超时/.test(s)},null,{timeout:300000});const status=await page.locator('#status').textContent();if(!status.startsWith('已渲染参考'))throw Error(status);await page.waitForFunction(()=>document.querySelector('#rendered').complete&&document.querySelector('#rendered').naturalWidth>0,null,{timeout:30000});return status;}
async function capture(id){const image=await page.locator('#rendered').getAttribute('src');if(!image?.startsWith('data:image/png;base64,'))throw Error('Expected encoded real pixels');const bytes=Buffer.from(image.split(',')[1],'base64');await writeFile(out+'/'+id+'.png',bytes);const download=page.waitForEvent('download');await page.locator('#export-camera').click();const file=await download;await file.saveAs(out+'/'+id+'.json');const metadata=JSON.parse(await readFile(out+'/'+id+'.json','utf8'));if(!metadata.actualCapture?.pixelAudit?.nonzeroRgb||!metadata.actualCapture?.pixelAudit?.nonzeroAlpha)throw Error('Empty frame accepted by UI');report.frames.push({id,pngSha256:createHash('sha256').update(bytes).digest('hex'),metadata});await save();}
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});
 page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1,acceptDownloads:true});
 page.on('pageerror',e=>report.events.push({kind:'pageerror',text:String(e)}));page.on('console',m=>{if(m.type()==='error')report.events.push({kind:'console-error',text:m.text()})});
 await page.goto('http://127.0.0.1:4317/compare-live.html?canonical=6&size=640',{waitUntil:'load',timeout:300000});report.baselineStatus=await completed();
 report.mapping=await page.locator('#shots button span').allTextContents();
 if(report.mapping.map(t=>Number(t.split('#')[1])).join(',')!=='10,9,7,8,4,6,5,1,3,2')throw Error('Reference mapping regression');
 const left=await page.locator('#reference').getAttribute('src');if(left!=='/references/hd/4-照片-5.jpg')throw Error('Incorrect left sanctuary reference');
 await capture('sanctuary-ui-native');
 await page.locator('#exposure').fill('1.8');await page.locator('#render').click();report.exposureStatus=await completed();await capture('sanctuary-ui-exposure-18');
 if(Math.abs(report.frames[1].metadata.actualCapture.exposure-1.8)>1e-8)throw Error('Exposure was overridden by scene lighting selection');
 if(report.frames[0].pngSha256===report.frames[1].pngSha256)throw Error('Exposure control did not change actual rendered pixels');
 const pair=page.waitForEvent('download');await page.locator('#save-pair').click();await(await pair).saveAs(out+'/sanctuary-ui-left-reference-right-render.png');
 try{await page.screenshot({path:out+'/comparison-page.png',timeout:20000});}catch(e){report.uiScreenshotWarning=String(e)}
 report.status=report.events.length?'rendered-with-errors':'passed';if(report.events.length)process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;}finally{clearTimeout(watchdog);report.finishedAt=new Date().toISOString();await save();console.log(JSON.stringify(report));server.close();if(browser)await Promise.race([browser.close().catch(()=>{}),new Promise(r=>setTimeout(r,4000))]);process.exit(process.exitCode||0)}
