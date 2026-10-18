/**
 * REAL single-reference restoration frame using existing site-production scene.
 * One macOS Metal renderer per reference, no screenshots reused. Actual geometry
 * and materials remain from the existing current-source reconstruction; no AI.
 */
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const ref=Number(process.env.REFERENCE_ID),size=Number(process.env.RENDER_SIZE||512);
if(!Number.isInteger(ref)||ref<1||ref>10||!Number.isInteger(size)||size<320||size>640||size%2)throw Error('Explicit 1..10 reference and 320..640 even-sized native frame required');
const variant=ref===10?'reference10-porch':'shared';
const labels={1:'0-照片-1.jpg',2:'1-照片-2.jpg',3:'2-照片-3.jpg',4:'3-照片-4.jpg',5:'5-照片-6.jpg',6:'4-照片-5.jpg',7:'6-照片-7.jpg',8:'7-照片-8.jpg',9:'8-照片-9.jpg',10:'9-照片-10.jpg'};
const path='references/hd/'+labels[ref],folder='output/reference-recovery-'+String(ref).padStart(2,'0');
await mkdir(folder,{recursive:true});
const hash=data=>createHash('sha256').update(data).digest('hex');
const sources={};for(const name of(await readdir('src')).filter(n=>n.endsWith('.js')).sort())sources[name]=hash(await readFile('src/'+name));
const report={reference:ref,sceneVariant:variant,pixels:[size,size],sourceRevision:JSON.parse(await readFile('frozen-manifest.json')).revision,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHash:hash(JSON.stringify(sources)),photoSha256:hash(await readFile(path)),status:'created',cameraRecoveryClaim:false,photoSimilarityAccepted:false,wholeSceneGeometryRetained:true,temporaryShadowBufferBudget:true,errors:[],warnings:[],startedAt:new Date().toISOString()};
const save=()=>writeFile(folder+'/report.json',JSON.stringify(report,null,2));await save();
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const {server}=await import('./server.mjs');let browser,page;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});report.browserVersion=browser.version();
 page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('crash',()=>report.errors.push('Metal page crashed'));
 page.on('console',m=>{const s=m.text();if(m.type()==='error')report.errors.push(s);else if(m.type()==='warning')report.warnings.push(s);if(['error','warning'].includes(m.type()))console.log('browser:',m.type(),s.slice(0,450))});
 await page.route('**/*',route=>{const u=new URL(route.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?route.continue():route.abort('blockedbyclient')});
 const url='http://127.0.0.1:4317/site-production.html?w='+size+'&h='+size+'&scope=site&scene='+variant+'&reference='+ref;
 report.status='loading';await save();await page.goto(url,{waitUntil:'load',timeout:300000});await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});
 const view=await page.evaluate(({ref,variant})=>window.production.getReferenceView(ref,{sceneVariant:variant}),{ref,variant});
 report.view=view;report.status='rendering';await save();
 const data=await page.evaluate(v=>{
  const p=window.production;
  p.renderer.resetState=()=>{};
  p.world.update(v.time);
  p.renderer.shadowMap.needsUpdate=true;
  return{...p.capture(v),info:p.info()};
 },view);
 const png=Buffer.from(data.png.split(',')[1],'base64');delete data.png;
 if(!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||png.length<25000)throw Error('Missing genuine PNG pixel buffer');
 if(data.glError||data.info.contextLost||data.pixels.nonzero<size*size*.65||!data.info.programs.every(p=>p.linked))throw Error('Invalid WebGL draw '+JSON.stringify({gl:data.glError,pixels:data.pixels}));
 if(report.errors.length||report.warnings.some(s=>/OUT_OF_MEMORY|buffer is not big enough/.test(s)))throw Error('GPU errors; do not pass this reconstruction frame');
 const real=folder+'/real-reference-'+String(ref).padStart(2,'0')+'.png';
 await writeFile(real,png);report.nativeFrame=real;report.nativeSha256=hash(png);
 report.frame=data;report.status='real-WebGL-validated';await save();
 const pair=folder+'/reference-left-'+String(ref).padStart(2,'0')+'-current-right.png';
 const graph='[0:v]scale='+size+':'+size+'[a];[a][1:v]hstack[out]';
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',path,'-i',real,'-filter_complex',graph,'-map','[out]','-frames:v','1',pair],{timeout:60000});report.comparison=pair;
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1}finally{
 report.finishedAt=new Date().toISOString();await save();console.log(JSON.stringify({reference:ref,status:report.status,frame:report.nativeFrame||null,error:report.error||null}));
 if(page)await page.close().catch(()=>{});if(browser)await browser.close().catch(()=>{});server.close();
}
