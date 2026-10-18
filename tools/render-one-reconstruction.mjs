import {mkdir,readFile,writeFile,readdir,access} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {launchRenderBrowser} from './render-runtime.mjs';
import {encodeWebglPng} from './encode-webgl-png.mjs';
import {acquireGpuRenderSlot} from './gpu-render-slot.mjs';
import {reconstructionSourceIdentity} from './reconstruction-source-identity.mjs';

const reference=Number(process.env.REFERENCE),id=String(reference).padStart(2,'0');
if(!Number.isInteger(reference)||reference<1||reference>10)throw Error('REFERENCE must be 1..10.');
const worktree=resolve(process.env.WORKTREE||process.cwd()),size=Number(process.env.SIZE||768);
const iteration=process.env.ITERATION||'01',port=Number(process.env.PORT||4500);
const motionFps=Number(process.env.MOTION_FPS||0),motionDuration=7;
const detailCrop=process.env.DETAIL_CROP?process.env.DETAIL_CROP.split(',').map(Number):null;
const viewPose=process.env.VIEW_POSITION||process.env.VIEW_TARGET?{position:process.env.VIEW_POSITION?.split(',').map(Number),target:process.env.VIEW_TARGET?.split(',').map(Number),fov:process.env.VIEW_FOV?Number(process.env.VIEW_FOV):null}:null;
if(viewPose&&(![viewPose.position,viewPose.target].every(a=>a?.length===3&&a.every(Number.isFinite))||(viewPose.fov!==null&&(!Number.isFinite(viewPose.fov)||viewPose.fov<10||viewPose.fov>120))||motionFps||process.env.SHOT_TIMES||detailCrop))throw Error('VIEW_POSITION/VIEW_TARGET require finite3-vectors and an independent still view.');
if(detailCrop&&(detailCrop.length!==4||!detailCrop.every(Number.isInteger)||Math.min(...detailCrop)<0||detailCrop[2]<1||detailCrop[3]<1||detailCrop[0]+detailCrop[2]>detailCrop[3]||detailCrop[1]+detailCrop[2]>detailCrop[3]||motionFps||process.env.SHOT_TIMES))throw Error('DETAIL_CROP requires x,y,size,fullSize and a still reference view.');
if(motionFps!==0&&![24,25,30,60].includes(motionFps))throw Error('MOTION_FPS must be 24,25,30 or60.');
const entry=`reconstructions/scene-${id}/index.html`,out=resolve(worktree,`qa/ten-reference/${id}/iteration-${iteration}`);
if(!/^[a-z0-9-]+$/i.test(iteration))throw Error('Invalid iteration name.');
await access(resolve(worktree,entry));await mkdir(out,{recursive:true});
const videoFile=resolve(out,'motion-review.mp4');
if(motionFps&&existsSync(videoFile))throw Error('Motion output exists; use a new ITERATION to retain previous evidence.');
async function sourceIdentity(){
 return reconstructionSourceIdentity(worktree,id);
}
const releaseGpu=await acquireGpuRenderSlot(`reference-${id}-${iteration}`);
const identity=await sourceIdentity(),startedAt=new Date().toISOString();
const report={reference,entry,worktree,size,startedAt,source:identity,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:worktree,encoding:'utf8'}).trim(),status:'building',visualAccepted:false,errors:[],requests:[]};
if(viewPose)report.inspectionView={...viewPose,scope:'Actual existing renderView API, explicit model-review camera, not the photographic reference pose.'};
if(detailCrop)report.detailCrop={pixels:detailCrop,scope:'A second genuine native 3D subfrustum render from the unchanged physical reference camera; not an upscaled screenshot.'};
const server=spawn(process.execPath,[resolve(worktree,'tools/server.mjs')],{cwd:worktree,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
const serverReady=new Promise((yes,no)=>{server.stdout.on('data',b=>{if(b.toString().includes('http://'))yes();});server.on('error',no);server.on('exit',c=>no(Error('Preview server exited '+c)));});
let browser,encoder,encoded,encoderError;
try{
 await serverReady;const runtime=await launchRenderBrowser();browser=runtime.browser;report.backend=runtime.backend;
 const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
 let fail;const fatal=new Promise((_,reject)=>fail=reject);fatal.catch(()=>{});
 page.on('pageerror',e=>{report.errors.push(String(e));fail(e);});
 page.on('console',m=>{if(m.type()==='error'){report.errors.push(m.text());fail(Error(m.text()));}console.log(id,m.type(),m.text().slice(0,350));});
 page.on('response',response=>{
  if(response.status()>=400){const message=`Scene resource failed: ${response.status()} ${new URL(response.url()).pathname}`;report.errors.push(message);fail(Error(message));}
 });
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.pathname==='/favicon.ico')return route.fulfill({status:204,body:''});
  if(u.protocol==='data:'||(u.protocol==='blob:'&&u.origin===`http://127.0.0.1:${port}`)||(u.hostname==='127.0.0.1'&&u.port===String(port))){if(!['data:','blob:'].includes(u.protocol))report.requests.push(u.pathname);return route.continue();}
  const message='Blocked external scene resource: '+u.origin;report.errors.push(message);fail(Error(message));return route.abort('blockedbyclient');
 });
 await Promise.race([page.goto(`http://127.0.0.1:${port}/${entry}?render&defer&w=${size}&h=${size}`,{waitUntil:'load',timeout:600000}),fatal]);
 await Promise.race([page.waitForFunction(()=>window.temple?.ready&&typeof window.temple.renderReference==='function',null,{timeout:600000}),fatal]);
 const frames=motionFps?Array.from({length:motionFps*motionDuration},(_,i)=>(i+.5)/motionFps):process.env.SHOT_TIMES?process.env.SHOT_TIMES.split(',').map(Number):detailCrop?[null,null]:[null];
 if(motionFps){
  encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size',`${size}x${size}`,'-framerate',String(motionFps),'-i','pipe:0','-an','-vf','vflip,scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p','-frames:v',String(frames.length),'-c:v','libx264','-preset','fast','-crf','15','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','iec61966-2-1','-movflags','+faststart',videoFile],{stdio:['pipe','ignore','inherit']});
  encoder.stdin.on('error',e=>encoderError=e);
  encoded=new Promise((yes,no)=>{encoder.on('error',no);encoder.on('close',code=>code===0?yes():no(Error('Motion encoder exited '+code)));});
  encoded.catch(e=>encoderError=e);
  report.motion={duration:motionDuration,fps:motionFps,expectedFrames:frames.length,file:videoFile,scope:'One actual seven-second shot for motion inspection; not the complete film.',audio:false,visualAccepted:false};
 }
 report.frames=[];
 for(const localTime of frames){
  if(encoderError)throw encoderError;
  const crop=detailCrop&&report.frames.length===1?detailCrop:null;
  const result=await Promise.race([page.evaluate(({reference,localTime,crop,viewPose})=>{
   const t=window.temple,r=t.renderer,gl=r.getContext();
   if(crop)t.camera.setViewOffset(crop[3],crop[3],crop[0],crop[1],crop[2],crop[2]);else t.camera.clearViewOffset();
   const pose=viewPose?t.renderView(viewPose.position,viewPose.target,0,viewPose.fov??t.camera.fov):localTime===null?t.renderReference(reference):t.renderShot(localTime);gl.finish();
   const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight,bytes=new Uint8Array(width*height*4);
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
   const glError=gl.getError(),programs=r.info.programs.map(p=>({linked:gl.getProgramParameter(p.program,gl.LINK_STATUS),log:gl.getProgramInfoLog(p.program)}));let binary='';
   for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
   return{pose,width,height,glError,programs,contextLost:gl.isContextLost(),rgbaBase64:btoa(binary),info:t.info()};
  },{reference,localTime,crop,viewPose}),fatal]);
  const bytes=Buffer.from(result.rgbaBase64,'base64');delete result.rgbaBase64;
  let nonblack=0,opaque=0;for(let i=0;i<bytes.length;i+=4){if(Math.max(bytes[i],bytes[i+1],bytes[i+2])>3)nonblack++;if(bytes[i+3]===255)opaque++;}
  const valid=result.glError===0&&!result.contextLost&&result.programs.every(p=>p.linked)&&nonblack>size*size*.05&&report.errors.length===0;
  const index=report.frames.length,name=viewPose?'inspection-view':crop?'detail-native':motionFps?`frame-${String(index).padStart(4,'0')}`:localTime===null?'reference':`shot-${String(localTime).replace('.','p')}`;
  const savePixels=!motionFps||index===0||index===Math.floor(frames.length/2)||index===frames.length-1;
  if(valid&&savePixels)await writeFile(resolve(out,name+'.png'),encodeWebglPng(result.width,result.height,bytes));
  report.frames.push({...result,name,localTime,detailCrop:crop,valid,pngSaved:savePixels,nonblackFraction:nonblack/(size*size),opaqueFraction:opaque/(size*size),rgbaSha256:createHash('sha256').update(bytes).digest('hex')});
  if(!valid)throw Error('Actual GPU frame failed: '+name);
  if(motionFps){
   if(!encoder.stdin.write(bytes))await Promise.race([new Promise(resolve=>encoder.stdin.once('drain',resolve)),encoded.then(()=>{throw Error('Encoder closed before the last frame');})]);
   if(index===0||(index+1)%motionFps===0||index===frames.length-1)console.log(JSON.stringify({event:'motion-frame',reference,frame:index+1,total:frames.length,time:localTime}));
  }
 }
 if(motionFps){
  encoder.stdin.end();await encoded;
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=width,height,nb_read_frames,r_frame_rate,codec_name,color_space,color_transfer:format=duration','-of','json',videoFile],{encoding:'utf8'}));
  const stream=probe.streams[0];
  if(Number(stream.nb_read_frames)!==frames.length||stream.width!==size||stream.height!==size||Math.abs(Number(probe.format.duration)-motionDuration)>.002)throw Error('Encoded motion dimensions, cadence or duration mismatch');
  execFileSync('ffmpeg',['-v','error','-i',videoFile,'-f','null','-'],{stdio:['ignore','ignore','pipe']});
  report.motion.probe=probe;report.motion.decodeErrors=0;
 }
 if((await sourceIdentity()).hash!==identity.hash)throw Error('Scene source changed during render.');
 report.status=motionFps?'motion-review-rendered':'rendered-review';
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;}
finally{
 if(encoder&&!encoder.stdin.writableEnded){encoder.stdin.destroy();encoder.kill('SIGTERM');await encoded.catch(()=>{});}
 report.completedAt=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');releaseGpu();
 console.log(JSON.stringify({reference,status:report.status,error:report.error,out,errors:report.errors}));
}
