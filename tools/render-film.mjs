import {homedir} from 'node:os';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {performance} from 'node:perf_hooks';
const root=resolve(new URL('..',import.meta.url).pathname);process.chdir(root);
const {server}=await import('./server.mjs');
const {chromium}=await import(homedir()+'/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const width=+(process.env.WIDTH||1920),height=Math.round(width*9/16),fps=30,handles=5,samples=+(process.env.SAMPLES||3);
const browser=await chromium.launch({headless:true,executablePath:homedir()+'/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium',args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--force-color-profile=srgb']});
const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(`http://127.0.0.1:${process.env.PORT||4318}/render-v3.html?render=1&w=${width}&h=${height}`,{waitUntil:'load',timeout:120000});
await page.waitForFunction(()=>window.temple?.ready,null,{timeout:240000});
const manifest=JSON.parse(await readFile('qa/v3/frozen-manifest.json','utf8')),audit=await page.evaluate(()=>window.temple.auditCameras());
await writeFile('qa/v3/frozen-camera-audit.json',JSON.stringify(audit,null,2));
if(audit.shots.some(s=>s.columnCollisions.length))throw Error('Camera intersects a generated column; inspect frozen-camera-audit.json before rendering');
console.log(JSON.stringify({sourceHash:manifest.sourceHash,scene:await page.evaluate(()=>window.temple.info()),samples,shutter:1/60}));
const selected=process.env.SHOTS?process.env.SHOTS.split(',').map(Number):Array.from({length:10},(_,i)=>i);
for(const duration of (process.env.DURATIONS||'70').split(',').map(Number)){
 const core=duration/10,frames=Math.round(core*fps)+handles*2,folder=`output/draft-v3/${duration}s`;await mkdir(folder,{recursive:true});
 for(const index of selected){
  const dest=`${folder}/shot-${String(index+1).padStart(2,'0')}.mkv`,metadata={sourceHash:manifest.sourceHash,shot:index+1,duration,coreSeconds:core,frames,fps,handles,samples,shutter:1/60,renderResolution:[width,height],encodedResolution:[1920,1080],format:'FFV1 lossless 10-bit 4:4:4 intermediate',reviewOnly:true};
  const ff=spawn('ffmpeg',['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-vcodec','png','-framerate',String(fps),'-i','pipe:0','-an','-vf','scale=1920:1080:flags=lanczos:in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv444p10le','-c:v','ffv1','-level','3','-coder','1','-context','1','-g','1','-pix_fmt','yuv444p10le','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',dest],{stdio:['pipe','inherit','inherit']});
  let encodeError=null;ff.stdin.on('error',e=>{encodeError=e});const finished=new Promise((res,rej)=>ff.on('close',c=>c?rej(Error('ffmpeg exit '+c)):res()));
  console.log('Rendering '+dest);const began=performance.now();
  for(let frame=0;frame<frames;frame++){
   if(encodeError)throw encodeError;
   const localTime=(frame-handles)/fps*(7/core),worldTime=index*7+localTime;
   await page.evaluate(({index,localTime,worldTime,samples,shutter})=>window.temple.renderExposure(index,localTime,worldTime,samples,shutter),{index,localTime,worldTime,samples,shutter:(1/60)*(7/core)});
   if(errors.length)throw Error(errors.join('\n').slice(0,5000));
   const png=await page.screenshot({type:'png',timeout:120000});if(!ff.stdin.write(png))await new Promise(r=>ff.stdin.once('drain',r));
   if(frame%15===0||frame===frames-1){const progress={...metadata,frame:frame+1,totalFrames:frames,elapsedSeconds:(performance.now()-began)/1000,createdAt:new Date().toISOString()};await writeFile('qa/v3/render-progress.json',JSON.stringify(progress,null,2));console.log(JSON.stringify(progress));}
  }
  ff.stdin.end();await finished;await writeFile(dest+'.json',JSON.stringify(metadata,null,2));
 }
}
await writeFile('qa/v3/render-errors.json',JSON.stringify(errors,null,2));await browser.close();server.close();
