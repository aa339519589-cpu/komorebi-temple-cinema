/** Six seconds of genuine moving-camera R14 Three.js, 30 frames/sec.
 * Real WebGL pixels, restartable 1-second lossless source frame sequence.
 * The final H264/AAC review clip is not an accepted finished 70-second film.
 */
import {mkdir,readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const width=640,rate=30,duration=6,total=duration*rate,folder='output/r14-sanctuary-real-motion';
await mkdir(folder,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const referenceSha256=hash(await readFile('references/hd/4-照片-5.jpg'));
const files=['reconstructions/reference6-v13/src/reference6-r14-main.js',
 'reconstructions/reference6-v13/src/reference6-r14-depth.js',
 'reconstructions/reference6-v13/src/reference6-scene.js',
 'reconstructions/reference6-v13/src/restoration-altar.js',
 'reconstructions/reference6-v13/src/restoration-buddha.js'];
const sourceHashes={};for(const file of files)sourceHashes[file]=hash(await readFile(file));
const report={reviewType:'Actual continuous R14 camera capture, not final film',
 sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 sourceHashes,referenceSha256,sourceGeometryUnchanged:true,sculptureIsRealGeometry:true,
 nativeResolution:[width,width],fps:rate,seconds:duration,totalFrames:total,
 sequence:[],segments:[],status:'starting',startedAt:new Date().toISOString(),
 errors:[],visualFidelityAccepted:false};
const save=()=>writeFile(folder+'/report.json',JSON.stringify(report,null,2));await save();
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const {server}=await import('./server.mjs');let browser,encoding;
async function run(args,bytes){
 const p=spawn('ffmpeg',args,{stdio:[bytes?'pipe':'ignore','ignore','pipe']});
 let stderr='';p.stderr.on('data',b=>stderr+=b.toString());
 const complete=new Promise((res,rej)=>{p.on('error',rej);p.on('close',code=>code===0?res():rej(Error('ffmpeg '+code+' '+stderr.slice(-1300))))});
 if(bytes)p.stdin.end(bytes);
 await complete;
}
function position(index){
 const u=index/(total-1);
 return {u,position:[.14*Math.sin((u-.5)*Math.PI*1.08),1.15+.25*u,7.55-2.12*u],
 target:[0,2.27+.22*u,-2.3],fov:68};
}
function validatePixel(summary,index){
 if(summary.w!==width||summary.h!==width||summary.glError||summary.lost||
  summary.nonzero<width*width*.65||summary.opaque<width*width*.95||
  summary.max-summary.min<12)throw Error('Rejected real GPU motion frame '+index+': '+JSON.stringify(summary));
}
let fatal=false;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 report.browser=browser.version();
 const page=await browser.newPage({viewport:{width,height:width},deviceScaleFactor:1});
 page.on('pageerror',e=>{fatal=true;report.errors.push(String(e))});
 page.on('crash',()=>{fatal=true;report.errors.push('Browser GPU process crashed')});
 page.on('console',m=>{if(m.type()==='error'){report.errors.push(m.text());console.log('BROWSER_ERROR',m.text().slice(0,1000))}});
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());
  return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?route.continue():route.abort('blockedbyclient');
 });
 await page.goto('http://127.0.0.1:4317/reconstructions/reference6-v13/r14.html?render&defer&r14=1&w=640&h=640',{waitUntil:'load',timeout:480000});
 await page.waitForFunction(()=>window.temple?.renderCameraPose&&window.temple?.r14?.audit(),null,{timeout:480000});
 report.model=await page.evaluate(()=>({info:window.temple.info(),r14:window.temple.r14.audit()}));report.status='preflight';await save();
 async function capture(i){
  if(fatal)throw Error('Browser reported GPU or shader failure');
  const pose=position(i);
  const shot=await page.evaluate((p)=>{
   const temple=window.temple,gl=temple.renderer.getContext(),frame=temple.renderCameraPose(p),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
   gl.finish();const pixels=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   let nonzero=0,opaque=0,min=255,max=0,sum=0;
   for(let j=0;j<pixels.length;j+=4){
    const a=pixels[j],b=pixels[j+1],c=pixels[j+2];
    if(a+b+c>4)nonzero++;if(pixels[j+3]===255)opaque++;min=Math.min(min,a,b,c);max=Math.max(max,a,b,c);sum+=a+b+c;
   }
   const glError=gl.getError(),lost=gl.isContextLost();
   const shaderErrors=temple.renderer.info.programs?.filter(x=>!gl.getProgramParameter(x.program,gl.LINK_STATUS)).map(x=>gl.getProgramInfoLog(x.program))||[];
   let binary='';for(let offset=0;offset<pixels.length;offset+=16384)binary+=String.fromCharCode(...pixels.subarray(offset,offset+16384));
   return{w,h,glError,lost,nonzero,opaque,min,max,mean:sum/(3*w*h),shaderErrors,frame,raw:btoa(binary)};
  },pose);
  const raw=Buffer.from(shot.raw,'base64');delete shot.raw;
  validatePixel(shot,i);
  if(shot.shaderErrors.length||raw.length!==width*width*4)throw Error('Invalid shader/byte count');
  return{pose,shot,raw};
 }
 const previews=new Map();for(const i of[0,90,179]){
  const frame=await capture(i);
  previews.set(i,frame);
  const filename=folder+'/preview-'+String(i).padStart(3,'0')+'.png';
  if(existsSync(filename))throw Error('Refuse previous preview overwrite '+filename);
  await run(['-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size','640x640','-framerate','1','-i','pipe:0','-vf','vflip','-frames:v','1',filename],frame.raw);
 }
 report.preflight={indices:[0,90,179],status:'three-different-valid-real-frames',geometry:report.model.r14};report.status='encoding';await save();
 for(let segment=0;segment<duration;segment++){
  const dest=folder+'/segment-'+String(segment).padStart(2,'0')+'.mkv';
  if(existsSync(dest))throw Error('Refuse previous segment overwrite');
  encoding=spawn('ffmpeg',['-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size','640x640','-framerate','30','-i','pipe:0','-vf','vflip','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-g','30','-threads','2',dest],{stdio:['pipe','ignore','pipe']});
  let stderr='';encoding.stderr.on('data',b=>stderr+=b.toString());
  const done=new Promise((res,rej)=>{encoding.on('error',rej);encoding.on('close',code=>code===0?res():rej(Error('Encoder exit '+code+' '+stderr.slice(-1000))))});
  done.catch(()=>{});
  for(let offset=0;offset<rate;offset++){
   const index=segment*rate+offset;
   const frame=previews.get(index)||await capture(index);
   const frameHash=hash(frame.raw);
   if(!encoding.stdin.write(frame.raw))await new Promise((resolve,reject)=>{encoding.stdin.once('drain',resolve);encoding.stdin.once('error',reject)});
   report.sequence.push({frame:index,time:index/rate,pose:frame.pose,rgbaSha256:frameHash,meanRGB:frame.shot.mean});
   if(index%10===0){await save();console.log('REAL_MOTION_FRAME',index+1,'/',total,frameHash.slice(0,12))}
  }
  encoding.stdin.end();await done;encoding=null;
  const frameProbe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-count_frames','-show_streams','-of','json',dest],{encoding:'utf8'}));
  if(Number(frameProbe.streams[0].nb_read_frames)!==rate)throw Error('Segment frame count corrupted');
  report.segments.push({file:dest.split('/').at(-1),frameCount:rate,sha256:hash(await readFile(dest))});await save();
 }
 if(report.sequence.length!==total||new Set(report.sequence.map(f=>f.rgbaSha256)).size<total*.95)throw Error('Invalid video frame timeline or repetitions');
 const concat=folder+'/segments.txt';
 await writeFile(concat,report.segments.map(s=>'file '+JSON.stringify(s.file)).join('\n')+'\n');
 const filename=folder+'/reference6-r14-real-6s.mp4';
 if(existsSync(filename))throw Error('Refuse previous film overwrite');
 await run(['-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',concat,'-ss','25','-t',String(duration),'-i','music/PerituneMaterial_Oboro.mp3',
  '-map','0:v','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-pix_fmt','yuv420p','-movflags','+faststart','-t',String(duration),filename]);
 const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_format','-show_streams','-of','json',filename],{encoding:'utf8',maxBuffer:1024*1024}));
 const video=meta.streams.find(s=>s.codec_type==='video'),audio=meta.streams.find(s=>s.codec_type==='audio');
 if(Number(video.nb_read_frames)!==total||Number(meta.format.duration)<duration-.15||video.width!==width||video.height!==width||!audio||audio.codec_name!=='aac')throw Error('Final film count/size/audio failed');
 execFileSync('ffmpeg',['-v','error','-i',filename,'-f','null','-'],{timeout:120000});
 for(const [file,s]of Object.entries(sourceHashes))if(hash(await readFile(file))!==s)throw Error('Source mutated during real film capture '+file);
 report.status='verified-real-motion-review';report.film='reference6-r14-real-6s.mp4';report.filmSha256=hash(await readFile(filename));
 report.output={frames:total,sourceFramesUnique:new Set(report.sequence.map(x=>x.rgbaSha256)).size,videoCodec:video.codec_name,audioCodec:audio.codec_name,resolution:[width,width],fps:rate,duration:Number(meta.format.duration),decodedWithoutError:true};
}catch(e){report.status='failed';report.error=String(e.stack||e);console.error(e);process.exitCode=1;if(encoding)encoding.kill('SIGTERM')}
finally{report.finishedAt=new Date().toISOString();await save();console.log('REAL_SANCTUARY_FILM',JSON.stringify({status:report.status,frames:report.sequence.length,error:report.error,sha256:report.filmSha256}));if(browser)await browser.close().catch(()=>{});server.close()}
