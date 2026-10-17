/**
 * KOMOREBI continuation renderer. Uses CURRENT src/main.js, never render-v3.html.
 * Runs on the owner's Mac with the installed Playwright/Chromium + Metal backend.
 * Mode: MODE=references (default), MODE=film, or MODE=all.
 * Prints and writes evidence; never uploads private photos or bridge credentials.
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { launchRenderBrowser } from './render-runtime.mjs';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));process.chdir(root);
const mode=process.env.MODE||'references';
if(!['references','film','all'].includes(mode))throw Error('MODE must be references, film or all');
if(process.platform!=='darwin'&&process.env.ALLOW_SOFTWARE!=='1')throw Error('This renderer is Mac/Metal only. No cloud/software fallback without ALLOW_SOFTWARE=1.');
const port=Number(process.env.PORT||4317);
const WIDTH=Number(process.env.WIDTH||1920),FPS=Number(process.env.FPS||30),SAMPLES=Number(process.env.SAMPLES||3),DURATION=Number(process.env.DURATION||70);
if(!Number.isInteger(FPS)||FPS<1||FPS>60||!Number.isInteger(WIDTH)||WIDTH<320||WIDTH>4096||!Number.isInteger(SAMPLES)||SAMPLES<1||SAMPLES>8||![60,70].includes(DURATION))throw Error('Invalid FPS, WIDTH, SAMPLES or DURATION');
const H=Math.round(WIDTH*9/16),refSize=Number(process.env.REF_SIZE||1254);
if(!Number.isInteger(refSize)||refSize<320||refSize>2048)throw Error('Invalid REF_SIZE');
// Index = current message's sequence; canonical = scene's original stable IDs.
const references=[
  {canonical:10,file:'references/hd/9-照片-10.jpg',scene:'reference10-porch'},
  {canonical:9,file:'references/hd/8-照片-9.jpg',scene:'shared'},
  {canonical:7,file:'references/hd/6-照片-7.jpg',scene:'shared'},
  {canonical:8,file:'references/hd/7-照片-8.jpg',scene:'shared'},
  {canonical:4,file:'references/hd/3-照片-4.jpg',scene:'shared'},
  {canonical:6,file:'references/hd/4-照片-5.jpg',scene:'shared'},
  {canonical:5,file:'references/hd/5-照片-6.jpg',scene:'shared'},
  {canonical:2,file:'references/hd/1-照片-2.jpg',scene:'shared'},
  {canonical:3,file:'references/hd/2-照片-3.jpg',scene:'shared'},
  {canonical:1,file:'references/01.png',scene:'shared'}
];
async function sourceHash(){
  const files=[];async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=join(dir,e.name);if(e.isDirectory())await walk(path);else if(e.name.endsWith('.js'))files.push(path);}}
  await walk('src');files.push('render-live.html');files.sort();const hash=createHash('sha256');
  for(const file of files){hash.update(relative(root,resolve(file)));hash.update('\0');hash.update(await readFile(file));hash.update('\0');}
  return hash.digest('hex');
}
const initialHash=await sourceHash(),revision=JSON.parse(await readFile('frozen-manifest.json','utf8')).revision;
const base=resolve('output',`continuation-${revision}-${initialHash.slice(0,12)}`);
await mkdir(base,{recursive:true});
const log={revision,sourceHash:initialHash,createdAt:new Date().toISOString(),mode,renderBackend:'pending',references:[],film:null,notPixelAccepted:true};
const {server}=await import('./server.mjs');
let browser;let page;let currentScene='';let device;
let isReady=false;
const errors=[];
const checkStable=async()=>{const actual=await sourceHash();if(actual!==initialHash)throw Error('Scene source changed during rendering; aborting before mixing revisions.');};
const runCommand=(program,args,stdout=null)=>new Promise((resolve,reject)=>{
 const child=spawn(program,args,{stdio:[stdout===null?'ignore':'pipe','inherit','inherit']});
 child.on('error',reject);child.on('close',n=>n===0?resolve():reject(Error(`${program} exited ${n}`)));
 if(stdout!==null){child.stdin.on('error',reject);child.stdin.end(stdout);}
});
async function openScene(variant,width,height){
 const identity=`${variant}:${width}x${height}`;
 if(isReady&&identity===currentScene)return;
 if(page)await page.close();page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 page.setDefaultTimeout(600000);
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.protocol==='data:'||(url.hostname==='127.0.0.1'&&Number(url.port)===port))return route.continue();
   return route.abort('blockedbyclient');
 });
 const url=`http://127.0.0.1:${port}/render-live.html?render=1&defer=1&w=${width}&h=${height}&scene=${encodeURIComponent(variant)}`;
 const t=performance.now();await page.goto(url,{waitUntil:'load',timeout:600000});
 await page.waitForFunction(()=>window.temple?.ready,null,{timeout:600000});
 if(errors.length)throw Error('Browser scene error: '+errors.join('; ').slice(0,1500));
 currentScene=identity;isReady=true;
 const info=await page.evaluate(()=>window.temple.info());
 if(device.backend==='metal'&&(!/apple|metal/i.test(info.gpu))&&process.env.ALLOW_SOFTWARE!=='1')throw Error('Metal renderer unverified: '+info.gpu);
 console.log(JSON.stringify({event:'scene-ready',scene:variant,revision,gpu:info.gpu,sec:+((performance.now()-t)/1000).toFixed(1)}));
 return info;
}
async function captureReferences(){
 const dir=join(base,'references');await mkdir(dir,{recursive:true});
 for(let i=0;i<references.length;i++){
  const r=references[i],id=String(i+1).padStart(2,'0');
  const filename=join(dir,`${id}-code-ref-${r.canonical}.png`),pair=join(dir,`${id}-left-reference-right-source.png`);
  await checkStable();await openScene(r.scene,refSize,refSize);
  const started=performance.now();const camera=await page.evaluate(n=>window.temple.renderReference(n),r.canonical);
  await page.locator('canvas').screenshot({type:'png',path:filename,timeout:600000});
  const original=resolve(r.file);
  if(!existsSync(original))throw Error('Missing local reference '+r.file);
  // FFmpeg stacks existing user-supplied reference pixels with ACTUAL WebGL screenshot.
  await runCommand('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',original,'-i',filename,
    '-filter_complex',`[0:v]scale=${refSize}:${refSize}:force_original_aspect_ratio=decrease,pad=${refSize}:${refSize}:(ow-iw)/2:(oh-ih)/2:black[left];[1:v]scale=${refSize}:${refSize}[right];[left][right]hstack=inputs=2[out]`,
    '-map','[out]','-frames:v','1',pair]);
  const record={userOrder:i+1,canonicalReference:r.canonical,sceneVariant:r.scene,referenceFile:r.file,renderFile:relative(root,filename),pairFile:relative(root,pair),camera,seconds:+((performance.now()-started)/1000).toFixed(2)};
  log.references.push(record);await writeFile(join(base,'report.json'),JSON.stringify(log,null,2));
  console.log(JSON.stringify({event:'reference-rendered',...record}));
 }
}
function selectedShots(){
 const raw=process.env.SHOTS;const list=raw?raw.split(',').map(Number):Array.from({length:10},(_,i)=>i+1);
 if(!list.length||list.some(n=>!Number.isInteger(n)||n<1||n>10))throw Error('SHOTS must use 1-based scene indices in 1..10');
 return [...new Set(list)];
}
async function frameCount(file){
 return await new Promise((resolveCount,reject)=>{
  let value='';const p=spawn('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=nb_read_frames','-of','csv=p=0',file]);
  p.stdout.on('data',b=>value+=b.toString());p.stderr.on('data',()=>{});
  p.on('error',reject);p.on('close',code=>code===0?resolveCount(Number(value.trim())):resolveCount(0));
 });
}
async function encodeShot(index,dir){
 const perShot=DURATION/10,total=Math.round(perShot*FPS),name=`shot-${String(index).padStart(2,'0')}.mp4`;
 const file=join(dir,name),receipt=file+'.json';
 const wanted={sourceHash:initialHash,revision,duration:DURATION,fps:FPS,width:WIDTH,height:H,samples:SAMPLES,shot:index,frames:total};
 if(existsSync(file)&&existsSync(receipt)){
  try{const old=JSON.parse(await readFile(receipt,'utf8'));
   if(Object.keys(wanted).every(k=>old[k]===wanted[k])&&await frameCount(file)===total){console.log('Reusing verified shot '+index);return file;}
  }catch{}
 }
 await rm(file,{force:true});await rm(receipt,{force:true});
 const out=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','png','-framerate',String(FPS),'-i','pipe:0',
  '-an','-frames:v',String(total),'-vf',`scale=${WIDTH}:${H}:flags=lanczos,format=yuv420p`,
  '-c:v','libx264','-preset','slow','-crf',String(process.env.CRF||15),'-r',String(FPS),
  '-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',file],{stdio:['pipe','inherit','inherit']});
 let encodingError=null;out.stdin.on('error',e=>{encodingError=e});
 const encoded=new Promise((res,rej)=>{out.on('error',rej);out.on('close',code=>code===0?res():rej(Error('ffmpeg failed shot '+index+' '+code)))});
 const begun=performance.now();
 try{
  for(let f=0;f<total;f++){
   if(encodingError)throw encodingError;
   const localTime=(f+.5)/FPS*7/perShot,global=(index-1)*7+localTime;
   await page.evaluate(({index,localTime,global,samples,shutter})=>window.temple.renderExposure(index-1,localTime,global,samples,shutter),
     {index,localTime,global,samples:SAMPLES,shutter:(1/60)*7/perShot});
   if(errors.length)throw Error('Browser errors '+errors.slice(-5).join('; '));
   const png=await page.locator('canvas').screenshot({type:'png',timeout:600000});
   if(!out.stdin.write(png))await new Promise(res=>out.stdin.once('drain',res));
   if(f===0||(f+1)%30===0||f===total-1)console.log(JSON.stringify({event:'frame',shot:index,frame:f+1,total,seconds:+((performance.now()-begun)/1000).toFixed(1)}));
  }
  out.stdin.end();await encoded;
  if(await frameCount(file)!==total)throw Error(`Encoded ${index} shot frame count mismatch`);
  await checkStable();await writeFile(receipt,JSON.stringify({...wanted,createdAt:new Date().toISOString(),codec:'H264',reviewOnly:true},null,2));
  console.log(JSON.stringify({event:'shot-complete',shot:index,file:relative(root,file)}));
  return file;
 }catch(e){out.stdin.destroy();out.kill('SIGTERM');await encoded.catch(()=>{});await rm(receipt,{force:true});throw e;}
}
async function captureFilm(){
 await checkStable();await openScene('shared',WIDTH,H);
 const dir=join(base,`${DURATION}s`);await mkdir(dir,{recursive:true});
 const shots=selectedShots();
 for(const n of shots)await encodeShot(n,dir);
 const all=Array.from({length:10},(_,i)=>join(dir,`shot-${String(i+1).padStart(2,'0')}.mp4`));
 if(!all.every(f=>existsSync(f)&&existsSync(f+'.json'))){console.log('Film partial: waiting for remaining shots.');return;}
 for(const f of all){const r=JSON.parse(await readFile(f+'.json','utf8'));if(r.sourceHash!==initialHash||r.fps!==FPS||r.width!==WIDTH||r.duration!==DURATION||r.samples!==SAMPLES)throw Error('Cross-revision film assembly refused: '+f);}
 const concatenation=all.map(f=>`file '${f.replace(/'/g,"'\\''")}'`).join('\n')+'\n';
 const list=join(dir,'concat.txt');await writeFile(list,concatenation);
 const picture=join(dir,`komorebi-current-${DURATION}s-video.mp4`);
 const final=join(dir,`komorebi-current-${DURATION}s-with-music.mp4`);
 await runCommand('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',picture]);
 if(await frameCount(picture)!==DURATION*FPS)throw Error('Final picture frame count mismatch');
 await runCommand('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',picture,'-ss','25','-i','music/PerituneMaterial_Oboro.mp3',
  '-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-ar','48000','-af',`loudnorm=I=-19:TP=-1.5:LRA=10,afade=t=in:st=0:d=1.5,afade=t=out:st=${DURATION-3}:d=3`,
  '-t',String(DURATION),'-movflags','+faststart',final]);
 if(await frameCount(final)!==DURATION*FPS)throw Error('Final audio-master frame count mismatch');
 log.film={duration:DURATION,frames:DURATION*FPS,picture:relative(root,picture),withMusic:relative(root,final),reviewOnly:true};
 console.log(JSON.stringify({event:'film-created',...log.film}));
}
try{
 device=await launchRenderBrowser();browser=device.browser;log.renderBackend=device.backend;
 console.log(JSON.stringify({event:'start',revision,sourceHash:initialHash,mode,backend:device.backend,root}));
 if(mode==='references'||mode==='all')await captureReferences();
 if(mode==='film'||mode==='all')await captureFilm();
 if(errors.length)throw Error('Browser reported errors '+errors.join('; ').slice(0,1000));
 log.finishedAt=new Date().toISOString();log.status=log.film||log.references.length===10?'rendered-review':'partial-review';
} catch(e){log.status='failed';log.error=String(e?.stack||e);process.exitCode=1;console.error(e);}finally{
 log.finishedAt=log.finishedAt||new Date().toISOString();await writeFile(join(base,'report.json'),JSON.stringify(log,null,2));
 if(page)await page.close().catch(()=>{});if(browser)await browser.close().catch(()=>{});server.close();
}