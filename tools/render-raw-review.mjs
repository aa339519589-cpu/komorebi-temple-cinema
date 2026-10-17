import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {renderAndReadRgba,encodeRgbaPng} from './raw-webgl-readback.mjs';
const out=process.env.OUTPUT_DIR||'output/raw-reference-review';await mkdir(out,{recursive:true});
const request=JSON.parse(await readFile(process.env.REQUEST_FILE||'tools/render-hosted-request.json','utf8'));
const maxJobs=Number(process.env.MAX_JOBS||1),jobs=request.jobs.slice(0,maxJobs),hash=b=>createHash('sha256').update(b).digest('hex');
const sourceFiles={};for(const name of (await readdir('src')).filter(n=>n.endsWith('.js')).sort())sourceFiles['src/'+name]=hash(await readFile('src/'+name));
const report={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHash:hash(JSON.stringify(sourceFiles)),sourceFiles,startedAt:new Date().toISOString(),status:'running',jobs:[],events:[],environment:'Hosted Mac Metal, not owner Mac',referenceFidelityAccepted:false};
const save=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
function event(type,data){report.events.push({at:new Date().toISOString(),type,data});save();console.log(JSON.stringify({type,data}));}
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),{server}=await import('./server.mjs');let browser,page,active;
const references={1:'0-照片-1.jpg',2:'1-照片-2.jpg',3:'2-照片-3.jpg',4:'3-照片-4.jpg',5:'5-照片-6.jpg',6:'4-照片-5.jpg',7:'6-照片-7.jpg',8:'7-照片-8.jpg',9:'8-照片-9.jpg',10:'9-照片-10.jpg'};
const deadline=setTimeout(()=>{report.status='hard-timeout';save();process.exit(2)},600000);
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});report.browser=browser.version();
 let identity='';
 for(const job of jobs){
  const width=job.width||640,scene=job.scene||'shared';if(!/^[a-z0-9-]{1,80}$/.test(job.id)||!references[job.reference]||!Number.isInteger(width)||width<320||width>1600||!['shared','reference10-porch'].includes(scene))throw Error('Invalid explicit review job');
  active={id:job.id,job,status:'building',errors:[]};report.jobs.push(active);event('job-start',job);
  const next=scene+':'+width;
  if(next!==identity){
   if(page)await page.close();page=await browser.newPage({viewport:{width,height:width},deviceScaleFactor:1});let fail;const fatal=new Promise((_,reject)=>{fail=reject});fatal.catch(()=>{});
   page.on('pageerror',e=>{active.errors.push(String(e));event('pageerror',String(e));fail(e)});page.on('console',m=>{event('browser-'+m.type(),m.text().slice(0,3000));if(m.type()==='error')active.errors.push(m.text())});
   page.on('crash',()=>fail(Error('Renderer crashed')));
   await Promise.race([page.goto(`http://127.0.0.1:4317/render-live.html?render=1&defer=1&w=${width}&h=${width}&scene=${scene}`,{waitUntil:'load',timeout:300000}),fatal]);
   await Promise.race([page.waitForFunction(()=>window.temple?.ready,null,{timeout:300000}),fatal]);identity=next;
  }
  event('scene-ready',job.id);active.status='rendering';
  const raw=await renderAndReadRgba(page,job);Object.assign(active,raw.receipt);event('rgba-received',{id:job.id,bytes:raw.bytes.length});
  const file=out+'/'+job.id+'.png';encodeRgbaPng(raw,file);active.png=job.id+'.png';active.pngSha256=hash(await readFile(file));
  const reference='references/hd/'+references[job.reference],pair=out+'/'+job.id+'-left-reference-right-render.png';
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',reference,'-i',file,'-filter_complex',`[0:v]scale=${width}:${width}[a];[a][1:v]hstack[out]`,'-map','[out]','-frames:v','1',pair]);
  active.reference=reference;active.referenceSha256=hash(await readFile(reference));active.comparison=job.id+'-left-reference-right-render.png';
  active.status=active.errors.length||active.beforeError||active.afterError?'rendered-with-errors':'rendered-review';event('saved',{id:job.id,status:active.status});
 }
 report.status=report.jobs.every(j=>j.status==='rendered-review')?'rendered-review':'errors';if(report.status==='errors')process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;event('failure',report.error)}finally{
 clearTimeout(deadline);report.finishedAt=new Date().toISOString();save();server.close();setTimeout(()=>process.exit(process.exitCode||0),5000).unref();if(browser)await browser.close().catch(()=>{});
}
