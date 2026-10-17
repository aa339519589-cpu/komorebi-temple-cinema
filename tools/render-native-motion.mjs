import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {writeFileSync,existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {encodeWebglPng} from './encode-webgl-png.mjs';
const out='output/native-motion';await mkdir(out,{recursive:true});const sha=b=>createHash('sha256').update(b).digest('hex');
const request=existsSync('tools/native-motion-request.json')?JSON.parse(await readFile('tools/native-motion-request.json','utf8')):{id:'sanctuary-dolly-review',size:720,duration:6,fps:30,exposure:1.8,from:[-1.80,4.26,-2.15],to:[-1.25,4.30,-3.10],target:[-1.540726762,6,-9.755090396],fov:78,time:41.95};
if(!/^[a-z0-9-]{1,80}$/.test(request.id)||!Number.isInteger(request.size)||request.size<320||request.size>1080||request.size%2||request.duration<1||request.duration>12||request.fps!==30||!Number.isInteger(request.duration*30)||![...request.from,...request.to,...request.target,request.fov,request.time,request.exposure].every(Number.isFinite)||request.from.length!==3||request.to.length!==3||request.target.length!==3||request.time<35||request.time>=42||request.fov<30||request.fov>100||request.exposure<.5||request.exposure>3)throw Error('Invalid bounded sanctuary motion request');
const sourceFiles={};for(const file of(await readdir('src')).filter(f=>f.endsWith('.js')).sort())sourceFiles['src/'+file]=sha(await readFile('src/'+file));
const report={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHash:sha(JSON.stringify(sourceFiles)),sourceFiles,request,startedAt:new Date().toISOString(),status:'starting',frames:[],errors:[],ownerMac:false,scope:'Actual current-source moving-camera review; not final architectural fidelity'};
const save=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));save();
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),{server}=await import('./server.mjs');let browser,page,encoder,encodeDone;
const n=request.duration*request.fps,size=request.size,video=out+'/'+request.id+'.mp4';
let fail;const fatal=new Promise((_,reject)=>{fail=reject});fatal.catch(()=>{});
async function bounded(p,label,ms=240000){let t;try{return await Promise.race([p,fatal,new Promise((_,reject)=>{t=setTimeout(()=>reject(Error(label+' timed out')),ms)})]);}finally{clearTimeout(t)}}
const watchdog=setTimeout(()=>{report.status='hard-timeout';save();encoder?.kill('SIGTERM');process.exit(124)},1800000);
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb','--disable-background-timer-throttling','--disable-renderer-backgrounding']});report.browser=browser.version();
 page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
 page.on('pageerror',e=>{report.errors.push(String(e));save();fail(e)});page.on('crash',()=>fail(Error('GPU renderer crashed')));page.on('console',m=>{if(m.type()==='error'){report.errors.push(m.text());save();}console.log(m.type(),m.text().slice(0,600));});
 await bounded(page.goto(`http://127.0.0.1:4317/render-live.html?render&defer&w=${size}&h=${size}&scene=shared`,{waitUntil:'load',timeout:300000}),'Scene load',300000);await bounded(page.waitForFunction(()=>window.temple?.ready,null,{timeout:300000}),'Scene ready',300000);
 report.scene=await page.evaluate(()=>window.temple.info());
 await page.evaluate(async()=>{window.readNativeMotionRGBA=(await import('/src/read-framebuffer-rgba.js')).readFramebufferRGBA;const t=window.temple,original=t.composer.render;t.composer.render=function(...args){t.renderer.toneMappingExposure=window.motionExposure;return original.apply(this,args)};window.motionOriginalRender=original;});
 async function frame(index){
  const u=n===1?0:index/(n-1),s=u*u*(3-2*u),position=request.from.map((v,i)=>v+(request.to[i]-v)*s);
  const result=await bounded(page.evaluate(j=>{
   const t=window.temple,g=t.renderer.getContext();window.motionExposure=j.exposure;
   const pose=t.renderView(j.position,j.target,j.time,j.fov),width=g.drawingBufferWidth,height=g.drawingBufferHeight;
   const readback=window.readNativeMotionRGBA(t.renderer,{width,height}),rgba=readback.pixels,error=readback.audit.glError;
   let visible=0,alpha=0,min=255,max=0,sum=0;for(let k=0;k<rgba.length;k+=4){const r=rgba[k],b=rgba[k+1],c=rgba[k+2];if(r||b||c)visible++;if(rgba[k+3])alpha++;min=Math.min(min,r,b,c);max=Math.max(max,r,b,c);sum+=r+b+c;}
   const pixels={visible,alpha,min,max,meanRgb:sum/(width*height*3)};
   if(error||g.isContextLost()||alpha<width*height*.9||visible<width*height*.8||max-min<8)throw Error('Rejected invalid motion frame '+j.index+': '+JSON.stringify({error,pixels,readback:readback.audit}));
   if(t.renderer.info.programs.some(p=>!g.getProgramParameter(p.program,g.LINK_STATUS)))throw Error('Shader link failure during actual video render');
   let binary='';for(let k=0;k<rgba.length;k+=16384)binary+=String.fromCharCode(...rgba.subarray(k,k+16384));
   return{pose,width,height,error,pixels,readback:readback.audit,rgba:btoa(binary),exposure:t.renderer.toneMappingExposure};
  },{index,position,target:request.target,time:request.time,fov:request.fov,exposure:request.exposure}),'Actual motion frame');
  const rgba=Buffer.from(result.rgba,'base64');delete result.rgba;if(rgba.length!==size*size*4||result.width!==size||result.height!==size)throw Error('Wrong native frame size');return{result,rgba};
 }
 // True start/middle/end renders must all be valid before starting video encoding.
 const previews=new Map();for(const index of[0,Math.floor((n-1)/2),n-1]){const f=await frame(index);previews.set(index,f);await writeFile(out+`/preview-${String(index).padStart(4,'0')}.png`,encodeWebglPng(size,size,f.rgba));}
 report.preflight={positions:[...previews].map(([index,f])=>({index,pose:f.result.pose,pixels:f.result.pixels})),passed:true};report.status='rendering';save();
 encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size',`${size}x${size}`,'-framerate','30','-i','pipe:0','-an','-vf','vflip','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',video],{stdio:['pipe','inherit','inherit']});
 let encodeError=null;encoder.stdin.on('error',e=>{encodeError=e});encodeDone=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(Error('ffmpeg exit '+code)))});encodeDone.catch(()=>{});
 for(let index=0;index<n;index++){
  if(encodeError)throw encodeError;const started=performance.now(),f=previews.get(index)||await frame(index);
  if(!encoder.stdin.write(f.rgba))await bounded(once(encoder.stdin,'drain'),'Encoder drain',60000);
  report.frames.push({index,timeSeconds:index/30,...f.result,rgbaSha256:sha(f.rgba),seconds:(performance.now()-started)/1000});
  if(index%15===0||index===n-1){save();console.log(JSON.stringify({frame:index+1,total:n,mean:f.result.pixels.meanRgb,sourceHash:report.sourceHash}));}
 }
 encoder.stdin.end();await bounded(encodeDone,'Video finalize',120000);
 const metadata=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',video],{encoding:'utf8'}));
 const stream=metadata.streams.find(s=>s.codec_type==='video');if(Number(stream.nb_read_frames)!==n||stream.width!==size||stream.height!==size||stream.r_frame_rate!=='30/1'||Math.abs(Number(metadata.format.duration)-request.duration)>.05)throw Error('Video frame-count/dimensions/timing failed');
 execFileSync('ffmpeg',['-v','error','-i',video,'-f','null','-'],{timeout:60000});
 report.verification={metadata,decodedWithoutError:true,nativeFrameCount:n,uniqueFrameHashes:new Set(report.frames.map(f=>f.rgbaSha256)).size,sourceUnchanged:true};
 for(const[file,h]of Object.entries(sourceFiles))if(sha(await readFile(file))!==h)throw Error('Source changed during film render');
 report.video=request.id+'.mp4';report.videoSha256=sha(await readFile(video));report.status=report.errors.length?'rendered-with-errors':'rendered-motion-review';if(report.errors.length)process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);encoder?.kill('SIGTERM');process.exitCode=1;}finally{clearTimeout(watchdog);report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({status:report.status,frames:report.frames.length,error:report.error}));server.close();if(browser)await Promise.race([browser.close().catch(()=>{}),new Promise(r=>setTimeout(r,4000))]);process.exit(process.exitCode||0)}
