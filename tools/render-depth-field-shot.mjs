import {spawn,execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {createReadStream,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {acquireGpuRenderSlot} from './gpu-render-slot.mjs';
import {launchRenderBrowser} from './render-runtime.mjs';
import {encodeWebglPng} from './encode-webgl-png.mjs';

const root=fileURLToPath(new URL('..',import.meta.url)),id=String(process.env.SCENE??'01').padStart(2,'0');
if(!/^(0[1-9]|10)$/.test(id))throw Error('SCENE must be 01–10.');
const dataRoot=resolve(process.env.STUDY_ROOT??resolve(root,'output/depth-field-v02'));
const prefix='/'+(process.env.META_PREFIX??'/output/depth-field-v02/').replace(/^\/+|\/+$/g,'')+'/';
const size=Number(process.env.FILM_SIZE??1080),fps=30,frameCount=210;
if(!Number.isInteger(size)||size<720||size>2048||size%2)throw Error('Even FILM_SIZE between720 and2048 required.');
const iteration=process.env.FILM_ITERATION??'depth-field-film-v02';
if(!/^[\w-]+$/.test(iteration))throw Error('Invalid film iteration.');
const out=resolve(root,'output',iteration,'shots',id);await mkdir(out,{recursive:true});
const clip=resolve(out,'shot.mp4');if(existsSync(clip))throw Error('Keep existing movie; use a new iteration.');
async function sha(file){const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex');}
const metadataFile=resolve(dataRoot,id,'viewer.json'),metadata=JSON.parse(await readFile(metadataFile,'utf8'));
if(!metadata.reconstruction?.method?.includes('Depth Anything V2 Small'))throw Error('Delivery movie requires the independently generated ApacheSmall field.');
const model=resolve(dataRoot,id,metadata.model.url);
const viewer=resolve(root,'reconstructions/sharp-study-viewer');
const sourceFiles=[];
async function collect(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.name==='review'||e.name.startsWith('.'))continue;const p=resolve(dir,e.name);if(e.isDirectory())await collect(p);else if(/\.(js|mjs|html|css|json)$/.test(e.name))sourceFiles.push(p);}}
await collect(viewer);
sourceFiles.push(resolve(root,'vendor/build/three.module.js'),resolve(root,'vendor/build/three.core.js'));
const source=await Promise.all(sourceFiles.sort().map(async p=>({file:relative(root,p),sha256:await sha(p)})));
const modelHash=await sha(model),metadataHash=await sha(metadataFile);
if(modelHash!==metadata.model.sha256)throw Error('PLY differs from its reconstruction metadata.');
const report={status:'rendering-actual-3d-frames',kind:'photo-depth-reconstructed-3d-gaussian-shot',scene:id,startedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),model:{file:model,sha256:modelHash,count:metadata.model.gaussianCount},metadata:{file:metadataFile,sha256:metadataHash},rendererSource:source,size:[size,size],fps,duration:7,expectedFrames:frameCount,frames:[],errors:[],visualAccepted:false,closedCadModel:false,lighting:'Photographic radiance baked into an inferred visible 3D surface; not a relightable PBR mesh.'};
const release=await acquireGpuRenderSlot('depth-field-film-'+id);
let server,browser,encoder,encoded,encoderError;
try{
 const port=Number(process.env.PORT??4531);
 server=spawn(process.execPath,[resolve(viewer,'server.mjs')],{cwd:root,env:{...process.env,STUDY_ROOT:dataRoot,META_PREFIX:prefix,PORT:String(port)},stdio:['ignore','pipe','pipe']});
 await new Promise((yes,no)=>{server.once('error',no);server.once('exit',c=>no(Error('Server exited '+c)));server.stdout.on('data',b=>{if(b.toString().includes('http://'))yes();});server.stderr.on('data',b=>process.stderr.write(b));});
 const runtime=await launchRenderBrowser();browser=runtime.browser;report.backend=runtime.backend;
 const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)report.errors.push(`HTTP ${r.status()} ${r.url()}`);});
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.protocol==='data:'||((u.protocol==='http:'||u.protocol==='blob:')&&u.origin===`http://127.0.0.1:${port}`))return route.continue();report.errors.push('Unexpected remote rendering dependency '+u.origin);return route.abort();});
 const url=`http://127.0.0.1:${port}/reconstructions/sharp-study-viewer/index.html?capture&meta=${encodeURIComponent(prefix+id+'/viewer.json')}&w=${size}&h=${size}`;
 await page.goto(url,{waitUntil:'load',timeout:300000});
 await page.waitForFunction(()=>window.temple?.ready||window.temple?.error,null,{timeout:300000});
 report.sceneInfo=await page.evaluate(async()=>{await window.temple.readyPromise;return window.temple.info();});
 encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size',`${size}x${size}`,'-framerate',String(fps),'-i','pipe:0','-an','-vf','vflip,scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p','-frames:v',String(frameCount),'-c:v','libx264','-preset','fast','-crf','14','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','iec61966-2-1','-movflags','+faststart',clip],{stdio:['pipe','ignore','inherit']});
 encoder.stdin.on('error',e=>encoderError=e);
 encoded=new Promise((yes,no)=>{encoder.once('error',no);encoder.once('close',c=>c===0?yes():no(Error('Encoder exited '+c)));});encoded.catch(e=>encoderError=e);
 for(let i=0;i<frameCount;i++){
  if(encoderError)throw encoderError;
  const time=7*i/(frameCount-1);
  const frame=await page.evaluate(async time=>{
   const t=window.temple,pose=await t.renderShot(time),gl=t.renderer.getContext();gl.finish();gl.bindFramebuffer(gl.FRAMEBUFFER,null);
   const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,pixels=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   let binary='';for(let j=0;j<pixels.length;j+=16384)binary+=String.fromCharCode(...pixels.subarray(j,j+16384));
   return{pose,width:w,height:h,glError:gl.getError(),contextLost:gl.isContextLost(),rgba:btoa(binary)};
  },time);
  const bytes=Buffer.from(frame.rgba,'base64');delete frame.rgba;
  if(frame.glError||frame.contextLost||frame.width!==size||frame.height!==size||report.errors.length)throw Error('Actual 3D frame failed '+i+' '+report.errors.join('; '));
  report.frames.push({index:i,time,...frame,sha256:createHash('sha256').update(bytes).digest('hex')});
  if(i===0||i===Math.floor(frameCount/2)||i===frameCount-1)await writeFile(resolve(out,`frame-${String(i).padStart(4,'0')}.png`),encodeWebglPng(size,size,bytes));
  if(!encoder.stdin.write(bytes))await Promise.race([new Promise(yes=>encoder.stdin.once('drain',yes)),encoded.then(()=>{throw Error('Encoder closed early.');})]);
  if(i===0||(i+1)%30===0||i===frameCount-1)console.log(JSON.stringify({event:'actual-gaussian-film-frame',scene:id,frame:i+1,total:frameCount}));
 }
 encoder.stdin.end();await encoded;
 report.probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=width,height,nb_read_frames,r_frame_rate:format=duration','-of','json',clip],{encoding:'utf8'}));
 const s=report.probe.streams[0];if(Number(s.nb_read_frames)!==frameCount||Number(report.probe.format.duration)!==7)throw Error('Encoded frame count or duration differs.');
 if(await sha(model)!==modelHash||await sha(metadataFile)!==metadataHash)throw Error('Reconstructed model changed during recording.');
 for(const item of source)if(await sha(resolve(root,item.file))!==item.sha256)throw Error('Renderer changed during recording: '+item.file);
 report.status='actual-3d-shot-rendered';report.clip={file:clip,sha256:await sha(clip)};
}catch(e){report.status='failed';report.error=String(e.stack??e);process.exitCode=1;}
finally{
 if(encoder&&!encoder.stdin.writableEnded){encoder.stdin.destroy();encoder.kill('SIGTERM');await encoded?.catch(()=>{});}
 report.completedAt=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 if(browser)await browser.close().catch(()=>{});server?.kill('SIGTERM');release();
 console.log(JSON.stringify({status:report.status,scene:id,out,error:report.error}));
}
