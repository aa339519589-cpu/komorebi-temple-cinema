import {mkdir,readFile,writeFile,readdir,access} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {launchRenderBrowser} from './render-runtime.mjs';
import {encodeWebglPng} from './encode-webgl-png.mjs';
import {acquireGpuRenderSlot} from './gpu-render-slot.mjs';
import {reconstructionSourceIdentity} from './reconstruction-source-identity.mjs';
import {createMotionJournal,NATIVE_CAPTURE_CONTRACT} from './native-motion-journal.mjs';

const reference=Number(process.env.REFERENCE),id=String(reference).padStart(2,'0');
if(!Number.isInteger(reference)||reference<1||reference>10)throw Error('REFERENCE must be 1..10.');
const worktree=resolve(process.env.WORKTREE||process.cwd()),size=Number(process.env.SIZE||768);
const iteration=process.env.ITERATION||'01',port=Number(process.env.PORT||4500);
const motionFps=Number(process.env.MOTION_FPS||0),motionDuration=7;
const requireMsaa=process.env.FILM_REQUIRE_MSAA==='1';
const renderScale=Number(process.env.MOTION_RENDER_SCALE||1);
if(![1,1.5,2].includes(renderScale)||(!motionFps&&renderScale!==1))throw Error('MOTION_RENDER_SCALE must be1,1.5or2 and applies only to motion.');
const renderSize=Math.round(size*renderScale);
const renderDriverSha256=createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex');
const detailCrop=process.env.DETAIL_CROP?process.env.DETAIL_CROP.split(',').map(Number):null;
const pickValues=process.env.PICK_PIXELS?process.env.PICK_PIXELS.split(',').map(Number):[];
if(pickValues.length%2||pickValues.some(v=>!Number.isFinite(v)||v<0||v>1))throw Error('PICK_PIXELS requires normalized u,v pairs.');
const pickPixels=Array.from({length:pickValues.length/2},(_,i)=>pickValues.slice(i*2,i*2+2));
const viewPose=process.env.VIEW_POSITION||process.env.VIEW_TARGET?{position:process.env.VIEW_POSITION?.split(',').map(Number),target:process.env.VIEW_TARGET?.split(',').map(Number),fov:process.env.VIEW_FOV?Number(process.env.VIEW_FOV):null}:null;
if(viewPose&&(![viewPose.position,viewPose.target].every(a=>a?.length===3&&a.every(Number.isFinite))||(viewPose.fov!==null&&(!Number.isFinite(viewPose.fov)||viewPose.fov<10||viewPose.fov>120))||motionFps||process.env.SHOT_TIMES||detailCrop))throw Error('VIEW_POSITION/VIEW_TARGET require finite3-vectors and an independent still view.');
if(detailCrop&&(detailCrop.length!==4||!detailCrop.every(Number.isInteger)||Math.min(...detailCrop)<0||detailCrop[2]<1||detailCrop[3]<1||detailCrop[0]+detailCrop[2]>detailCrop[3]||detailCrop[1]+detailCrop[2]>detailCrop[3]||motionFps||process.env.SHOT_TIMES))throw Error('DETAIL_CROP requires x,y,size,fullSize and a still reference view.');
if(motionFps!==0&&![24,25,30,60].includes(motionFps))throw Error('MOTION_FPS must be 24,25,30 or60.');
const entry=`reconstructions/scene-${id}/index.html`,out=resolve(worktree,`qa/ten-reference/${id}/iteration-${iteration}`);
if(!/^[a-z0-9-]+$/i.test(iteration))throw Error('Invalid iteration name.');
await access(resolve(worktree,entry));await mkdir(out,{recursive:true});
const videoFile=resolve(out,'motion-review.mp4');
if(motionFps&&existsSync(videoFile))throw Error('Motion output exists; use a new ITERATION to retain previous evidence.');
const journal=motionFps?await createMotionJournal(out,{reference,iteration,worktree,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:worktree,encoding:'utf8'}).trim(),driverSha256:renderDriverSha256,outputSize:size,requestedNativeSize:renderSize,fps:motionFps,expectedFrames:motionFps*motionDuration,videoFile,requireMsaa}):null;
async function sourceIdentity(){
 return reconstructionSourceIdentity(worktree,id);
}
const releaseGpu=await acquireGpuRenderSlot(`reference-${id}-${iteration}`);
const identity=await sourceIdentity(),startedAt=new Date().toISOString();
const report={reference,entry,worktree,size,startedAt,source:identity,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:worktree,encoding:'utf8'}).trim(),status:'building',visualAccepted:false,errors:[],requests:[],renderDriver:{path:'tools/render-one-reconstruction.mjs',sha256:renderDriverSha256},renderSampling:{nativeWidth:renderSize,nativeHeight:renderSize,outputWidth:size,outputHeight:size,scale:renderScale,downsampling:renderScale===1?'none':'Lanczos from genuine higher-resolution native frames'}};
report.captureContract={id:NATIVE_CAPTURE_CONTRACT,observabilityVersion:'motion-journal-msaa334-v1',captureCallsAndEncoderUnchanged:true};
await journal?.started({...report,backend:process.env.RENDER_BACKEND||(process.platform==='darwin'?'metal':'swiftshader')});
if(viewPose)report.inspectionView={...viewPose,scope:'Actual existing renderView API, explicit model-review camera, not the photographic reference pose.'};
if(detailCrop)report.detailCrop={pixels:detailCrop,scope:'A second genuine native 3D subfrustum render from the unchanged physical reference camera; not an upscaled screenshot.'};
const server=spawn(process.execPath,[resolve(worktree,'tools/server.mjs')],{cwd:worktree,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
const serverReady=new Promise((yes,no)=>{server.stdout.on('data',b=>{if(b.toString().includes('http://'))yes();});server.on('error',no);server.on('exit',c=>no(Error('Preview server exited '+c)));});
let browser,encoder,encoded,encoderError;
try{
 await serverReady;const runtime=await launchRenderBrowser();browser=runtime.browser;report.backend=runtime.backend;
 const page=await browser.newPage({viewport:{width:renderSize,height:renderSize},deviceScaleFactor:1});
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
 await Promise.race([page.goto(`http://127.0.0.1:${port}/${entry}?render&defer&w=${renderSize}&h=${renderSize}`,{waitUntil:'load',timeout:600000}),fatal]);
 await Promise.race([page.waitForFunction(()=>window.temple?.ready&&typeof window.temple.renderReference==='function',null,{timeout:600000}),fatal]);
 const frames=motionFps?Array.from({length:motionFps*motionDuration},(_,i)=>(i+.5)/motionFps):process.env.SHOT_TIMES?process.env.SHOT_TIMES.split(',').map(Number):detailCrop?[null,null]:[null];
 function startEncoder(width,height){
  report.renderSampling.requestedNativeWidth=renderSize;report.renderSampling.requestedNativeHeight=renderSize;
  report.renderSampling.nativeWidth=width;report.renderSampling.nativeHeight=height;
  report.renderSampling.scale=width/size;
  encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size',`${width}x${height}`,'-framerate',String(motionFps),'-i','pipe:0','-an','-vf',`vflip,scale=${size}:${size}:flags=lanczos:in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p`,'-frames:v',String(frames.length),'-c:v','libx264','-preset','fast','-crf','15','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','iec61966-2-1','-movflags','+faststart',videoFile],{stdio:['pipe','ignore','inherit']});
  encoder.stdin.on('error',e=>encoderError=e);
  encoded=new Promise((yes,no)=>{encoder.on('error',no);encoder.on('close',code=>code===0?yes():no(Error('Motion encoder exited '+code)));});
  encoded.catch(e=>encoderError=e);
 }
 if(motionFps)report.motion={duration:motionDuration,fps:motionFps,expectedFrames:frames.length,file:videoFile,scope:'One actual seven-second native-camera shot; not the complete film.',audio:false,visualAccepted:false};
 report.frames=[];
 for(const localTime of frames){
  if(encoderError)throw encoderError;
  const crop=detailCrop&&report.frames.length===1?detailCrop:null;
  const result=await Promise.race([page.evaluate(async({reference,localTime,crop,viewPose,pickPixels,captureMsaa})=>{
   const t=window.temple,r=t.renderer,gl=r.getContext();
   if(crop)t.camera.setViewOffset(crop[3],crop[3],crop[0],crop[1],crop[2],crop[2]);else t.camera.clearViewOffset();
   const mainPasses=[],originalRender=r.render;
   if(captureMsaa)r.render=function(scene,camera){
    if(scene===t.scene&&camera===t.camera){const target=this.getRenderTarget();mainPasses.push({override:!!scene.overrideMaterial,width:target?.width??gl.drawingBufferWidth,height:target?.height??gl.drawingBufferHeight,declaredSamples:target?.samples??0,actualSamples:Number(gl.getParameter(gl.SAMPLES)||0),defaultFramebuffer:!target});}
    return originalRender.apply(this,arguments);
   };
   let pose;
   try{pose=viewPose?t.renderView(viewPose.position,viewPose.target,0,viewPose.fov??t.camera.fov):localTime===null?t.renderReference(reference):t.renderShot(localTime);}
   finally{if(captureMsaa)r.render=originalRender;}
   gl.finish();
   const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight,bytes=new Uint8Array(width*height*4);
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
   const glError=gl.getError(),programs=r.info.programs.map(p=>({linked:gl.getProgramParameter(p.program,gl.LINK_STATUS),log:gl.getProgramInfoLog(p.program)}));let binary='';
   for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
   const picked=[];
   if(pickPixels.length){
    const {Raycaster,Vector2,Box3,Matrix4}=await import('three');
    for(const [u,v]of pickPixels){
     const ray=new Raycaster();ray.setFromCamera(new Vector2(u*2-1,1-v*2),t.camera);
     const hits=ray.intersectObject(t.scene,true).filter(h=>h.object.isMesh).slice(0,6);
     picked.push({pixel:[u,v],hits:hits.map(h=>{
      const o=h.object,matrix=o.matrixWorld.clone();
      if(h.instanceId!==undefined){const instance=new Matrix4();o.getMatrixAt(h.instanceId,instance);matrix.multiply(instance);}
      const bounds=new Box3().setFromBufferAttribute(o.geometry.attributes.position).applyMatrix4(matrix);
      return{distance:h.distance,point:h.point.toArray(),name:o.name,instanceId:h.instanceId,geometry:o.geometry.type,parameters:o.geometry.parameters,material:(Array.isArray(o.material)?o.material:[o.material]).map(m=>({name:m.name,type:m.type,opacity:m.opacity})),bounds:[bounds.min.toArray(),bounds.max.toArray()]};
     })});
    }
   }
   return{pose,width,height,glError,programs,contextLost:gl.isContextLost(),msaaEvidence:{contextAntialias:!!gl.getContextAttributes()?.antialias,maxSamples:r.capabilities.maxSamples,mainPasses},rgbaBase64:btoa(binary),info:t.info(),...(picked.length?{picked}:{} )};
  },{reference,localTime,crop,viewPose,pickPixels,captureMsaa:!!motionFps}),fatal]);
  const bytes=Buffer.from(result.rgbaBase64,'base64');delete result.rgbaBase64;
  let nonblack=0,opaque=0;for(let i=0;i<bytes.length;i+=4){if(Math.max(bytes[i],bytes[i+1],bytes[i+2])>3)nonblack++;if(bytes[i+3]===255)opaque++;}
  const msaaValid=!requireMsaa||result.msaaEvidence.mainPasses.some(p=>!p.override&&p.width>=renderSize&&p.height>=renderSize&&p.actualSamples>=2);
  const valid=msaaValid&&result.glError===0&&!result.contextLost&&result.programs.every(p=>p.linked)&&nonblack>result.width*result.height*.05&&report.errors.length===0;
  const index=report.frames.length,name=viewPose?'inspection-view':crop?'detail-native':motionFps?`frame-${String(index).padStart(4,'0')}`:localTime===null?'reference':`shot-${String(localTime).replace('.','p')}`;
  const savePixels=!motionFps||index===0||index===Math.floor(frames.length/2)||index===frames.length-1;
  if(valid&&savePixels)await writeFile(resolve(out,name+'.png'),encodeWebglPng(result.width,result.height,bytes));
  report.frames.push({...result,name,localTime,detailCrop:crop,valid,pngSaved:savePixels,nonblackFraction:nonblack/(result.width*result.height),opaqueFraction:opaque/(result.width*result.height),rgbaSha256:createHash('sha256').update(bytes).digest('hex')});
  await journal?.frame(report.frames[report.frames.length-1],index);
  if(!valid)throw Error('Actual GPU frame failed: '+name+(msaaValid?'':' (main-scene MSAA evidence missing)'));
  if(motionFps){
   if(!encoder)startEncoder(result.width,result.height);
   if(result.width!==report.renderSampling.nativeWidth||result.height!==report.renderSampling.nativeHeight||bytes.length!==result.width*result.height*4)throw Error('Native framebuffer dimensions changed during capture.');
   if(!encoder.stdin.write(bytes))await Promise.race([new Promise(resolve=>encoder.stdin.once('drain',resolve)),encoded.then(()=>{throw Error('Encoder closed before the last frame');})]);
   if(index===0||(index+1)%motionFps===0||index===frames.length-1)console.log(JSON.stringify({event:'motion-frame',reference,frame:index+1,total:frames.length,time:localTime}));
  }
 }
 if(motionFps){
  await journal.encoding();
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
 report.completedAt=new Date().toISOString();
 try{
  // Retain one complete scene description. The native per-frame pose, pixels,
  // GL/MSAA/program observations and geometry counters remain recorded.
  // Serializing hundreds of copies of a dense static mesh diagnostic exceeded
  // V8's string limit in G07 after all168 frames had already been encoded.
  if(motionFps){
   report.frameInformationPolicy={revision:'motion-info345',completeSceneDescriptionFrame:0,subsequentFrames:'Full information SHA256 plus observed frame/camera/renderer counters; complete native pose/GL/pixel hash remain in every frame.'};
   for(let i=0;i<report.frames.length;i++){
    const frame=report.frames[i];if(!frame.info)continue;
    frame.infoSha256=createHash('sha256').update(JSON.stringify(frame.info)).digest('hex');
    if(i>0){const info=frame.info;frame.infoSummary={frames:info.frames,camera:info.camera,renderer:info.renderer,shadowCache:info.shadowCache};delete frame.info;}
   }
  }
  await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
  await journal?.finish(report.status,{reportFile:resolve(out,'report.json'),error:report.error??null,capturedFrames:report.frames?.length??0});
 }finally{
  // Receipt failure must not strand this exact job's server/browser or GPU slot.
  if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');releaseGpu();
 }
 console.log(JSON.stringify({reference,status:report.status,error:report.error,out,errors:report.errors}));
}
