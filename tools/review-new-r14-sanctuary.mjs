/* Actual OpenGL pixels from the two newest independently reconstructed 3D scenes. */
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
const reference=Number(process.env.KOMOREBI_REFERENCE||0),size=Number(process.env.KOMOREBI_SIZE||640);
if(reference!==6||!Number.isInteger(size)||size<320||size>960)throw Error('Explicit reference 4/6 and valid render size required');
const revision=reference===4?'reference4-v4':'reference6-v13';
const sceneRoot='reconstructions/'+revision;
const photo=reference===4?'references/hd/3-照片-4.jpg':'references/hd/4-照片-5.jpg';
const output='output/independent-'+revision+'-r14';await mkdir(output,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const report={reference,sourceRoot:sceneRoot,sourceRevision:JSON.parse(await readFile(sceneRoot+'/runtime.json','utf8')),
 photoSha256:hash(await readFile(photo)),commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 size,status:'building',startedAt:new Date().toISOString(),errors:[],
 referencePhotoUsedAsSceneTexture:false,photoSimilarityAccepted:false};
const save=()=>writeFile(output+'/report.json',JSON.stringify(report,null,2));await save();
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const {server}=await import('./server.mjs');let browser;
async function ffmpeg(args,buf){
 const child=spawn('ffmpeg',args,{stdio:[buf?'pipe':'ignore','ignore','pipe']});
 let stderr='';child.stderr.on('data',b=>stderr+=b.toString());
 const done=new Promise((res,rej)=>{child.on('error',rej);child.on('close',code=>code===0?res():rej(Error('ffmpeg '+code+' '+stderr.slice(-1000))))});
 if(buf)child.stdin.end(buf);
 await done;
}
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});
 report.browser=browser.version();
 const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('crash',()=>report.errors.push('Browser render process crashed'));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(['warning','error'].includes(m.type()))console.log('browser '+m.type()+': '+m.text().slice(0,600))});
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());
  return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?route.continue():route.abort('blockedbyclient');
 });
 const start=performance.now();
 const url='http://127.0.0.1:4317/'+sceneRoot+'/r14.html?render&defer&r14=1&w='+size+'&h='+size;
 await page.goto(url,{waitUntil:'load',timeout:480000});
 await page.waitForFunction(()=>window.temple&&typeof window.temple.renderReference==='function',null,{timeout:480000});
 report.buildSeconds=(performance.now()-start)/1000;report.status='rendering';await save();
 const t=performance.now();
 const result=await page.evaluate(ref=>{
  const scene=window.temple,gl=scene.renderer.getContext();
  const frame=scene.renderReference(ref);
  gl.finish();
  if(gl.isContextLost())throw Error('Native scene lost GPU context');
  const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,pixels=new Uint8Array(w*h*4);
  gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  const error=gl.getError(),programs=(scene.renderer.info.programs||[]).map(p=>({name:p.name,linked:gl.getProgramParameter(p.program,gl.LINK_STATUS),log:gl.getProgramInfoLog(p.program)}));
  let nonzero=0,opaque=0,min=255,max=0,sum=0;
  for(let i=0;i<pixels.length;i+=4){
   const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
   if(r+g+b>4)nonzero++;if(pixels[i+3]===255)opaque++;
   min=Math.min(min,r,g,b);max=Math.max(max,r,g,b);sum+=r+g+b;
  }
  let binary='';for(let i=0;i<pixels.length;i+=16384)binary+=String.fromCharCode(...pixels.subarray(i,i+16384));
  return{frame,sourceInfo:scene.info(),viewport:[w,h],error,programs,nonzero,opaque,min,max,mean:sum/(w*h*3),rgba:btoa(binary)};
 },reference);
 report.renderSeconds=(performance.now()-t)/1000;
 const raw=Buffer.from(result.rgba,'base64');delete result.rgba;
 const {viewport,nonzero,opaque,min,max,error,programs}=result;
 if(viewport[0]!==size||viewport[1]!==size||raw.length!==size*size*4||error||
    nonzero<size*size*.6||opaque<size*size*.95||max-min<12||
    programs.some(p=>!p.linked))throw Error('Actual GPU frame failed validation '+JSON.stringify({viewport,nonzero,opaque,min,max,error,failed:programs.filter(p=>!p.linked).map(x=>x.log)}));
 report.frame=result.frame;report.sourceInfo=result.sourceInfo;
 report.metrics={viewport,nonzero,opaque,min,max,mean:result.mean,error,programs};
 report.rgbaSha256=hash(raw);
 const native=output+'/real-'+revision+'-r14.png';
 if(existsSync(native))throw Error('Refuse to overwrite existing native render');
 await ffmpeg(['-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size',size+'x'+size,'-framerate','1','-i','pipe:0','-vf','vflip','-frames:v','1',native],raw);
 if((await stat(native)).size<30000)throw Error('Blank encoded render');
 report.nativeFile='real-'+revision+'-r14.png';report.nativeSha256=hash(await readFile(native));
 const pair=output+'/reference-left-'+revision+'-r14-right.png';
 if(existsSync(pair))throw Error('Refuse to overwrite existing comparison');
 await ffmpeg(['-hide_banner','-loglevel','error','-i',photo,'-i',native,
  '-filter_complex','[0:v]scale='+size+':'+size+'[a];[a][1:v]hstack[out]','-map','[out]','-frames:v','1',pair]);
 report.comparison='reference-left-'+revision+'-r14-right.png';
 report.status=report.errors.length?'rendered-with-browser-errors':'real-webgl-rendered';
 if(report.errors.length)process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1}
finally{
 report.finishedAt=new Date().toISOString();await save();
 console.log('V67_GENUINE_3D_REVIEW',JSON.stringify({reference,status:report.status,nativeSha256:report.nativeSha256,error:report.error}));
 if(browser)await browser.close().catch(()=>{});server.close();
}
