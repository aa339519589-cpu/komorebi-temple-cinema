/** Actual site scene / four reproducible cameras; reference-4 restoration preflight. */
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const dir='output/reference4-camera-study',size=640;await mkdir(dir,{recursive:true});
const sha=data=>createHash('sha256').update(data).digest('hex');
const source={};for(const file of (await readdir('src')).filter(f=>f.endsWith('.js')).sort())source[file]=sha(await readFile('src/'+file));
const reference='references/hd/3-照片-4.jpg',sourceHash=sha(JSON.stringify(source));
const candidates=[
 {id:'a-porch',position:[-1.540726762,1.1,23.0],target:[-1.540726762,6.1,-7.115090396],fov:60,time:24.5},
 {id:'b-complete-roof',position:[-1.540726762,1.2,28.0],target:[-1.540726762,6.5,-7.115090396],fov:54,time:24.5},
 {id:'c-full-approach',position:[-1.540726762,1.5,31.0],target:[-1.540726762,7.0,-7.115090396],fov:51,time:24.5},
 {id:'d-wide-low',position:[-1.540726762,1.3,22.0],target:[-1.540726762,7.5,-7.115090396],fov:66,time:24.5}
];
const report={sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHash,referenceSha256:sha(await readFile(reference)),scene:'original full site with preview-only light-buffer resolution',reference:4,candidates,frames:[],status:'starting',referenceFidelityAccepted:false,errors:[],started:new Date().toISOString()};
const save=()=>writeFile(dir+'/report.json',JSON.stringify(report,null,2));await save();
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),{server}=await import('./server.mjs');let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});
 const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(['error','warning'].includes(m.type()))console.log(m.type(),m.text().slice(0,1000))});
 await page.route('**/*',route=>{const u=new URL(route.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?route.continue():route.abort('blockedbyclient')});
 await page.goto('http://127.0.0.1:4317/site-production.html?w=640&h=640&scope=site&scene=shared&reference=4',{waitUntil:'load',timeout:300000});
 await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});report.status='rendering';await save();
 for(const camera of candidates){
  const result=await page.evaluate(view=>{const p=window.production;p.renderer.resetState=()=>{};p.world.update(view.time);p.renderer.shadowMap.needsUpdate=true;const r=p.capture(view),info=p.info();return{...r,info};},camera);
  const pixels=Buffer.from(result.png.split(',')[1],'base64');delete result.png;
  if(!pixels.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Actual framebuffer failed to return PNG for '+camera.id);
  const valid=!result.glError&&!result.info.contextLost&&result.info.programs.every(p=>p.linked)&&result.pixels.nonzero>size*size*.7;
  if(!valid)throw Error('Unusable 3D frame '+camera.id+': '+JSON.stringify({glError:result.glError,nonzero:result.pixels.nonzero}));
  const file=dir+'/render-'+camera.id+'.png',pair=dir+'/reference-left-'+camera.id+'-right.png';await writeFile(file,pixels);
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',reference,'-i',file,'-filter_complex','[0:v]scale=640:640[a];[a][1:v]hstack[out]','-map','[out]','-frames:v','1',pair],{timeout:60000});
  report.frames.push({camera,shot:camera.id,pixels:result.pixels,glError:result.glError,mode:result.info?.lightingMode,renderSha256:sha(pixels),renderBytes:pixels.length,status:'3d-rendered',pair:'reference-left-'+camera.id+'-right.png'});await save();
  console.log('CAMERA_3D_REVIEW',JSON.stringify({camera:camera.id,glError:result.glError,pixelHash:sha(pixels)}));
 }
 report.status=report.errors.length?'rendered-with-console-errors':'rendered-review';if(report.errors.length)process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;}finally{report.finished=new Date().toISOString();await save();console.log(JSON.stringify({status:report.status,frames:report.frames.length,error:report.error}));if(browser)await browser.close().catch(()=>{});server.close();}
