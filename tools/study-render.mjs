/** Real scene studies. Preview changes only intermediate map sizes, never geometry or light count. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
const root=resolve(new URL('..',import.meta.url).pathname);process.chdir(root);
const group=process.env.STUDY_GROUP||'room',out=resolve('output/visual-study',group);await mkdir(out,{recursive:true});
const request=JSON.parse(await readFile('tools/visual-study-request.json','utf8'));
const jobs=request.jobs.filter(j=>j.group===group);if(!jobs.length||jobs.length>12)throw Error('Require 1..12 selected jobs.');
const hash=x=>createHash('sha256').update(x).digest('hex');
const report={request,group,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),status:'starting',events:[],jobs:[],sources:{},visualAcceptance:false};
const save=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
let start=performance.now();const event=(kind,data)=>{report.events.push({seconds:+((performance.now()-start)/1000).toFixed(3),kind,...data});console.log(JSON.stringify({kind,...data}));save();};
const sources={};let active=null;
function once(text,from,to){if(text.split(from).length!==2)throw Error('Pinned source hook changed: '+from.slice(0,70));return text.replace(from,to);}
function transform(name,text,quality){
 const original=text;
 if(name==='src/world.js'&&quality==='preview'){
  text=once(text,'sun.shadow.mapSize.set(8192, 8192)','sun.shadow.mapSize.set(512, 512)');
  text=once(text,'altarLight.shadow.mapSize.set(2048,2048)','altarLight.shadow.mapSize.set(512,512)');
  text=once(text,'reflectionSize:1536','reflectionSize:512');
  text=once(text,'{mode,resolution:512,near:.12','{mode,resolution:128,near:.12');
  text=text.replace(/textureWidth:\s*(1024|1536|1600|2048|4096)\b/g,'textureWidth:256').replace(/textureHeight:\s*(800|1024|1536|1600|2048|4096)\b/g,'textureHeight:256');
  text=once(text,'new T.WebGLRenderTarget(1920,1080,{type:T.HalfFloatType,samples:4})','new T.WebGLRenderTarget(256,256,{type:T.HalfFloatType,samples:0})');
  text=text.replace(/multisample:\s*4/g,'multisample:0');
 }
 if(name==='src/main.js'){
  if(quality==='preview'){text=once(text,'antialias: true,','antialias: false,');text=text.replaceAll('.samples = 4;','.samples = 0;');text=once(text,'renderer.setSize(width, height);','renderer.transmissionResolutionScale=.25; renderer.setSize(width, height);');}
  text=once(text,'  scene,\n  camera,','  scene,\n  world,\n  camera,');
  text=once(text,"renderer.setSize(width, height);","console.info('study-renderer-ready');\nrenderer.setSize(width, height);");
  text=once(text,'const world = buildWorld(renderer,','console.info(\'study-building-world\');\nconst world = buildWorld(renderer,');
 }
 sources[name]=text;report.sources[name]={originalSha256:hash(original),executedSha256:hash(text),transformed:text!==original,quality};
 return text;
}
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const {server}=await import('./server.mjs');let browser,page,identity=null,fatalReject;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--disable-background-timer-throttling','--disable-renderer-backgrounding','--force-color-profile=srgb']});
 report.browser=browser.version();report.environment='GitHub hosted Mac, not user Mac';event('browser-ready',{});
 for(const job of jobs){
  if(!/^[a-z0-9-]{1,80}$/.test(job.id)||!Number.isInteger(job.reference)||job.reference<1||job.reference>10)throw Error('Invalid reference job');
  const width=job.width||640,scene=job.scene||'shared',quality=job.quality||'preview';
  if(![320,480,640,960,1254,1440,1600].includes(width)||!['shared','reference10-porch'].includes(scene)||!['preview','full'].includes(quality))throw Error('Invalid study settings');
  const receipt={...job,status:'building',errors:[],startedAt:new Date().toISOString()};active=receipt;report.jobs.push(receipt);save();
  const key=[width,scene,quality].join(':');
  if(key!==identity){
   if(page)await page.close({runBeforeUnload:false});
   page=await browser.newPage({viewport:{width,height:width},deviceScaleFactor:1});page.setDefaultTimeout(360000);
   const fatal=new Promise((_,reject)=>{fatalReject=reject});fatal.catch(()=>{});
   page.on('pageerror',e=>{receipt.errors.push(String(e));event('page-error',{error:String(e)});fatalReject(e)});
   page.on('crash',()=>fatalReject(Error('Renderer page crashed')));
   page.on('console',m=>{if(m.type()==='error'){active?.errors.push(m.text());event('shader-or-runtime-error',{error:m.text().slice(0,4000)});}else if(m.type()==='info')event('scene-stage',{text:m.text().slice(0,2000)});});
   await page.route('**/*',async route=>{try{const u=new URL(route.request().url());if(u.protocol==='data:')return route.continue();if(u.hostname!=='127.0.0.1'||u.port!=='4317')return route.abort();const name=decodeURIComponent(u.pathname).replace(/^\//,'');if(name.endsWith('.js')||name.endsWith('.mjs')){const file=resolve(root,name);if(!file.startsWith(root+'/'))return route.abort();const original=await readFile(file,'utf8');const code=transform(name,original,quality);return route.fulfill({status:200,contentType:'text/javascript',body:code});}return route.continue();}catch(e){event('route-error',{error:String(e)});await route.abort();fatalReject(e)}});
   const began=performance.now();event('loading-scene',{id:job.id,quality,width,scene});
   await Promise.race([page.goto(`http://127.0.0.1:4317/render-live.html?render&defer&w=${width}&h=${width}&scene=${scene}`,{waitUntil:'load',timeout:360000}),fatal]);
   await Promise.race([page.waitForFunction(()=>window.temple?.ready,null,{polling:100,timeout:360000}),fatal]);
   identity=key;receipt.buildSeconds=(performance.now()-began)/1000;
   receipt.resources=await page.evaluate(()=>{const t=window.temple,arrays=new Set(),textures=new Set(),objects=[];t.scene.traverse(o=>{if(!o.isMesh)return;for(const a of Object.values(o.geometry.attributes))arrays.add(a.array);if(o.geometry.index)arrays.add(o.geometry.index.array);if(o.instanceMatrix)arrays.add(o.instanceMatrix.array);if(o.instanceColor)arrays.add(o.instanceColor.array);for(const m of Array.isArray(o.material)?o.material:[o.material])for(const v of Object.values(m))if(v?.isTexture)textures.add(v);objects.push({name:o.name,material:o.material?.name,vertices:o.geometry.attributes.position.count,instances:o.isInstancedMesh?o.count:1});});const gl=t.renderer.getContext();return{uniqueArrayBytes:[...arrays].reduce((s,a)=>s+a.byteLength,0),geometries:t.renderer.info.memory.geometries,textures:t.renderer.info.memory.textures,programs:t.renderer.info.programs.length,textureDimensions:[...textures].map(x=>({name:x.name,w:x.image?.width,h:x.image?.height,type:x.type})),largest:objects.sort((a,b)=>b.vertices*b.instances-a.vertices*a.instances).slice(0,15),beforeRenderGlError:gl.getError(),contextLost:gl.isContextLost()};});
   receipt.host=execFileSync('ps',['-axo','pid,rss,comm'],{encoding:'utf8'}).split('\n').filter(l=>/chrome|chromium|node/i.test(l));event('scene-ready',{id:job.id,seconds:receipt.buildSeconds,resources:receipt.resources});
  }
  receipt.status='rendering';save();const began=performance.now();
  const result=await page.evaluate(async j=>{
   const t=window.temple;
   if(j.camera){const c=j.camera;if(![...c.position,...c.target,c.fov,c.time].every(Number.isFinite))throw Error('Invalid study camera');}
   if(j.samples!==undefined){if(![0,2,4].includes(j.samples))throw Error('Invalid sample diagnostic');for(const target of [t.composer.renderTarget1,t.composer.renderTarget2]){if(target.samples!==j.samples){target.dispose();target.samples=j.samples;}}}
   const {capturePixelFrame}=await import('/src/pixel-capture.js');
   const draw=()=>j.camera?t.renderView(j.camera.position,j.camera.target,j.camera.time,j.camera.fov):t.renderReference(j.reference);
   if(j.exposure!==undefined){if(!Number.isFinite(j.exposure)||j.exposure<=0||j.exposure>3)throw Error('Invalid exposure');t.renderer.toneMappingExposure=j.exposure;}
   const capture=capturePixelFrame(t,draw,{diagnose:true}),gl=t.renderer.getContext();
   const samplerTypes=[gl.SAMPLER_2D,gl.SAMPLER_CUBE,gl.SAMPLER_2D_SHADOW,gl.SAMPLER_CUBE_SHADOW,gl.SAMPLER_2D_ARRAY];
   const programs=t.renderer.info.programs.map(p=>{const linked=gl.getProgramParameter(p.program,gl.LINK_STATUS),samplers=[];if(linked)for(let i=0;i<gl.getProgramParameter(p.program,gl.ACTIVE_UNIFORMS);i++){const u=gl.getActiveUniform(p.program,i);if(samplerTypes.includes(u.type))samplers.push({name:u.name,size:u.size});}return{linked,log:gl.getProgramInfoLog(p.program),samplers,count:samplers.reduce((a,b)=>a+b.size,0)};});
   return{pose:capture.pose,capture,info:t.info(),glError:gl.getError(),programs,atlas:t.renderer.brdfLookupAtlasInfo?.()||null,materialSharing:t.renderer.materialSamplerSharingInfo?.()||null};
  },job);
  receipt.renderSeconds=(performance.now()-began)/1000;
  const png=Buffer.from(result.capture.png.split(',')[1],'base64'),canvasPng=Buffer.from(result.capture.canvasPng.split(',')[1],'base64');delete result.capture.png;delete result.capture.canvasPng;
  Object.assign(receipt,result);await writeFile(out+'/'+job.id+'.png',png);await writeFile(out+'/'+job.id+'-canvas.png',canvasPng);receipt.png=job.id+'.png';receipt.pngSha256=hash(png);receipt.pngBytes=png.length;receipt.canvasPngSha256=hash(canvasPng);save();
  receipt.presentationPolicy='No browser screenshot requested; exported actual offscreen pixels are the authoritative result.';
  const pixels=receipt.capture.pixelStats;
  receipt.status=receipt.errors.length||receipt.glError||receipt.capture.readError||receipt.capture.contextLost||receipt.capture.stages.some(s=>s.errors.length)||receipt.programs.some(p=>!p.linked)||pixels.max-pixels.min<12||pixels.nonzeroFraction<.01?'rendered-with-errors':'rendered-review';receipt.finishedAt=new Date().toISOString();save();event('frame-saved',{id:job.id,status:receipt.status,renderSeconds:receipt.renderSeconds,pixels});
  const refs={1:'0-照片-1.jpg',2:'1-照片-2.jpg',3:'2-照片-3.jpg',4:'3-照片-4.jpg',5:'5-照片-6.jpg',6:'4-照片-5.jpg',7:'6-照片-7.jpg',8:'7-照片-8.jpg',9:'8-照片-9.jpg',10:'9-照片-10.jpg'};
  const reference='references/hd/'+refs[job.reference];receipt.referenceSha256=hash(await readFile(reference));
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',reference,'-i',out+'/'+job.id+'.png','-filter_complex',`[0:v]scale=${width}:${width}:force_original_aspect_ratio=decrease,pad=${width}:${width}:(ow-iw)/2:(oh-ih)/2:black[a];[1:v]scale=${width}:${width}[b];[a][b]hstack[out]`,'-map','[out]','-frames:v','1',out+'/'+job.id+'-comparison.png']);receipt.comparison=job.id+'-comparison.png';save();
 }
 report.status=report.jobs.every(j=>j.status==='rendered-review')?'rendered-review':'errors';if(report.status==='errors')process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);event('failed',{error:report.error});process.exitCode=1;}
finally{
 for(const [name,code] of Object.entries(sources)){const file=out+'/executed-source/'+name;await mkdir(dirname(file),{recursive:true});await writeFile(file,code);}
 report.finishedAt=new Date().toISOString();save();
 const close=async()=>{if(browser)await browser.close().catch(()=>{});server.close();};
 await Promise.race([close(),new Promise(r=>setTimeout(r,3000))]);
 process.exit(process.exitCode||0);
}
