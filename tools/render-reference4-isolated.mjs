/** Independent actual reference-4 camera run, one Chrome and one GPU frame per process.
 * Explicitly avoids reused framebuffer state which blacked frame B in the prior survey.
 */
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const variants={
 a:{id:'a-porch',position:[-1.540726762,1.1,23.0],target:[-1.540726762,6.1,-7.115090396],fov:60,time:24.5},
 b:{id:'b-complete-roof',position:[-1.540726762,1.2,28.0],target:[-1.540726762,6.5,-7.115090396],fov:54,time:24.5},
 c:{id:'c-full-approach',position:[-1.540726762,1.5,31.0],target:[-1.540726762,7.0,-7.115090396],fov:51,time:24.5},
 d:{id:'d-wide-low',position:[-1.540726762,1.3,22.0],target:[-1.540726762,7.5,-7.115090396],fov:66,time:24.5}
};
const k=process.env.CAMERA_ID||'b',view=variants[k],size=640;
if(!view)throw Error('Unknown reference-4 camera ID');
const out='output/reference4-isolated-'+k;
await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),sources={};
for(const n of(await readdir('src')).filter(n=>n.endsWith('.js')).sort())sources[n]=hash(await readFile('src/'+n));
const reference='references/hd/3-照片-4.jpg';
const report={cameraId:k,view,size,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHash:hash(JSON.stringify(sources)),referenceSha256:hash(await readFile(reference)),status:'starting',referenceSimilarityAccepted:false,errors:[],attemptedFrameCount:0,startedAt:new Date().toISOString(),exteriorGeometryModified:false};
const save=()=>writeFile(out+'/report.json',JSON.stringify(report,null,2));await save();
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const {server}=await import('./server.mjs');let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});
 const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(['error','warning'].includes(m.type()))console.log('browser:',m.type(),m.text().slice(0,600));});
 await page.route('**/*',route=>{const u=new URL(route.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?route.continue():route.abort('blockedbyclient')});
 await page.goto('http://127.0.0.1:4317/site-production.html?w=640&h=640&scope=site&scene=shared&reference=4',{waitUntil:'load',timeout:300000});
 await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});
 report.prepare=await page.evaluate(v=>{const p=window.production;p.renderer.resetState=()=>{};p.world.update(v.time);p.renderer.shadowMap.needsUpdate=true;return{info:p.info(),camera:v}},view);
 report.status='rendering';await save();
 // EXACTLY one frame per page/browser, no stale read buffer or successive reset.
 const result=await page.evaluate(v=>{const p=window.production;const frame=p.capture(v);return{...frame,info:p.info()}},view);
 report.attemptedFrameCount=1;
 const png=Buffer.from(result.png.split(',')[1],'base64');delete result.png;
 if(png.length<40000||!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Invalid actual WebGL PNG bytes');
 if(result.glError||result.info.contextLost||!result.info.programs.every(x=>x.linked)||result.pixels.nonzero<size*size*.70)throw Error('Invalid real pixels '+JSON.stringify({glError:result.glError,pixels:result.pixels}));
 report.frame=result;report.pngSha256=hash(png);report.pngBytes=png.length;report.status='rendered-review';
 const file=out+'/render-'+view.id+'.png',pair=out+'/reference-left-'+view.id+'-right.png';
 await writeFile(file,png);report.render=file;
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',reference,'-i',file,'-filter_complex','[0:v]scale=640:640[a];[a][1:v]hstack[out]','-map','[out]','-frames:v','1',pair],{timeout:60000});report.comparison=pair;
 if(report.errors.length){report.status='rendered-with-errors';process.exitCode=1}
}catch(error){report.status='failed';report.error=String(error.stack||error);process.exitCode=1}
finally{report.finishedAt=new Date().toISOString();await save();console.log(JSON.stringify({status:report.status,camera:k,pngSha256:report.pngSha256,error:report.error}));if(browser)await browser.close().catch(()=>{});server.close()}
