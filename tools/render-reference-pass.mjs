import {mkdir,readFile,writeFile,readdir,copyFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const reference=Number(process.env.REFERENCE||6),size=Number(process.env.SIZE||960);
if(!Number.isInteger(reference)||reference<1||reference>10||!Number.isInteger(size)||size<320||size>1600)throw Error('Invalid reference request');
const id=String(reference).padStart(2,'0'),out='output/reference-pass-'+id,variant=reference===10?'reference10-porch':'shared';await mkdir(out,{recursive:true});
const names={1:'0-照片-1.jpg',2:'1-照片-2.jpg',3:'2-照片-3.jpg',4:'3-照片-4.jpg',5:'5-照片-6.jpg',6:'4-照片-5.jpg',7:'6-照片-7.jpg',8:'7-照片-8.jpg',9:'8-照片-9.jpg',10:'9-照片-10.jpg'},refFile='references/hd/'+names[reference];
const hash=b=>createHash('sha256').update(b).digest('hex'),source={};for(const f of(await readdir('src')).filter(x=>x.endsWith('.js')).sort())source[f]=hash(await readFile('src/'+f));
const report={reference,variant,size,status:'building',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHash:hash(JSON.stringify(source)),referenceSha256:hash(await readFile(refFile)),referenceFidelityAccepted:false,errors:[]};const save=()=>writeFile(out+'/report.json',JSON.stringify(report,null,2));await save();
const overrides=existsSync('tools/visual-reference-cameras.json')?JSON.parse(await readFile('tools/visual-reference-cameras.json','utf8')):{};
const finish=JSON.parse(await readFile('tools/sanctuary-shot-request.json','utf8')).finish;
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),{server}=await import('./server.mjs');let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());console.log(m.type(),m.text().slice(0,1200));});
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?r.continue():r.abort('blockedbyclient');});
 await page.goto(`http://127.0.0.1:4317/site-production.html?w=${size}&h=${size}&scope=${reference===6?'interior':'site'}&scene=${variant}&reference=${reference}`,{waitUntil:'load',timeout:300000});await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});
 report.prepared=await page.evaluate(async ({reference,variant,finish,override})=>{const p=window.production;p.renderer.resetState=()=>{};let view=p.getReferenceView(reference,{sceneVariant:variant});if(override)view={...view,...override};p.world.update(view.time);p.renderer.getContext().finish();const changes={};
  if(reference===6){changes.finish=p.configure(finish);const carving=await import('/src/sanctuary-carved-detail.js');changes.carving=carving.applySanctuaryCarvedDetail(p.world).report;const contact=await import('/src/sanctuary-contact-optics.js');changes.contact=contact.installSanctuaryContactOptics(p,{radius:.30,intensity:.85}).info();}
  if(reference===10){const wet=await import('/src/rain-threshold-optics.js');window.wetThreshold=wet.installRainThresholdOptics(p.world,{resolution:1536,stoneGain:.42,strength:1,practicalGain:2.2});window.wetThreshold.update(view.time);changes.wet=window.wetThreshold.report;const atmosphere=await import('/src/reference-rain-atmosphere.js');changes.atmosphere=atmosphere.applyReferenceRainAtmosphere(p.world,p.renderer).report;}
  p.renderer.shadowMap.needsUpdate=true;return{view,changes,initialMode:p.world.referenceScene.initialMode,info:p.info()};
 },{reference,variant,finish,override:overrides[reference]||null});
 report.status='rendering';await save();const frame=await page.evaluate(view=>{const p=window.production;return{...p.capture(view),info:p.info()};},report.prepared.view);
 const png=Buffer.from(frame.png.split(',')[1],'base64');delete frame.png;await writeFile(out+'/render-'+id+'.png',png);await copyFile(refFile,out+'/reference-'+id+'.jpg');report.frame=frame;report.pngSha256=hash(png);report.pngBytes=png.length;
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',refFile,'-i',out+'/render-'+id+'.png','-filter_complex',`[0:v]scale=${size}:${size}[a];[a][1:v]hstack[out]`,'-map','[out]','-frames:v','1',out+'/comparison-'+id+'.png']);
 if(frame.glError||frame.info.contextLost||!frame.info.programs.every(p=>p.linked)||frame.pixels.nonzero<size*size*.70||report.errors.length)throw Error('Reference frame failed real pixel/GL validation');report.status='rendered-review';
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();await save();console.log(JSON.stringify({reference,status:report.status,error:report.error}));if(browser)await browser.close().catch(()=>{});server.close();}
