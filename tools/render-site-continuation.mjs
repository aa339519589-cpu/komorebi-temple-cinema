import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const ref=+(process.env.REFERENCE||3),size=+(process.env.SIZE||640),variant=ref===10?'reference10-porch':'shared';
if(![3,4,9,10].includes(ref)||!Number.isInteger(size)||size<320||size>1280)throw Error('Invalid site job');
const out='output/site-reference-'+ref;await mkdir(out,{recursive:true});
const report={reference:ref,variant,size,status:'starting',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),errors:[],accepted:false};
const save=()=>writeFile(out+'/report.json',JSON.stringify(report,null,2));await save();
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),{server}=await import('./server.mjs');let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});
 const page=await browser.newPage({viewport:{width:size,height:size}});page.on('pageerror',e=>{report.errors.push(String(e));console.error(e)});page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());console.log(m.type(),m.text().slice(0,1000))});
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?r.continue():r.abort('blockedbyclient')});
 await page.goto(`http://127.0.0.1:4317/sanctuary-production.html?w=${size}&h=${size}&scope=site&scene=${variant}`,{waitUntil:'load',timeout:300000});
 await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});report.status='scene-built';await save();
 const frame=await page.evaluate(({reference,variant})=>{const p=window.production;p.renderer.resetState=()=>{};const view=p.getReferenceView(reference,{sceneVariant:variant});return{...p.capture(view),info:p.info()};},{reference:ref,variant});
 const bytes=Buffer.from(frame.png.split(',')[1],'base64');delete frame.png;await writeFile(out+'/reference-'+ref+'.png',bytes);report.frame=frame;report.pngBytes=bytes.length;report.pngSha256=createHash('sha256').update(bytes).digest('hex');
 const refs={3:'2-照片-3.jpg',4:'3-照片-4.jpg',9:'8-照片-9.jpg',10:'9-照片-10.jpg'};
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i','references/hd/'+refs[ref],'-i',out+'/reference-'+ref+'.png','-filter_complex',`[0:v]scale=${size}:${size}[a];[a][1:v]hstack[out]`,'-map','[out]','-frames:v','1',out+'/comparison.png']);
 if(frame.glError||frame.info.contextLost||!frame.info.programs.every(p=>p.linked)||frame.pixels.nonzero<.7*size*size||report.errors.length)throw Error('Site frame has render errors; inspect report');
 report.status='rendered-review';
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();await save();console.log(JSON.stringify({status:report.status,reference:ref,error:report.error}));if(browser)await browser.close().catch(()=>{});server.close()}
