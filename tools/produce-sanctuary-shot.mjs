/** Native-resolution motion, captured from the existing v60 scene. */
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {spawn,execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
const out='output/sanctuary-shot';await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const cfg=JSON.parse(await readFile('tools/sanctuary-shot-request.json','utf8'));
function demand(ok,why){if(!ok)throw Error(why);}
demand(/^[a-z0-9-]{1,80}$/.test(cfg.id)&&cfg.fps===30&&Number.isInteger(cfg.duration)&&cfg.duration>=2&&cfg.duration<=12,'Invalid shot duration/name');
demand(Number.isInteger(cfg.size)&&cfg.size>=320&&cfg.size<=1080&&cfg.size%2===0,'Invalid image size');
demand(cfg.from?.length===3&&cfg.to?.length===3&&cfg.target?.length===3&&[...cfg.from,...cfg.to,...cfg.target,cfg.fov,cfg.time].every(Number.isFinite),'Invalid camera');
demand(cfg.time>=35&&cfg.time<42&&cfg.fov>=40&&cfg.fov<=95,'Sanctuary source restriction');
const source={};for(const f of(await readdir('src')).filter(f=>f.endsWith('.js')).sort())source['src/'+f]=hash(await readFile('src/'+f));
const report={status:'initializing',startedAt:new Date().toISOString(),request:cfg,sourceHash:hash(JSON.stringify(source)),sourceFiles:source,frames:[],accepted:false,finalFilm:false,errors:[]};
const save=()=>writeFile(out+'/report.json',JSON.stringify(report,null,2));await save();
const spec=process.env.PLAYWRIGHT_MODULE;demand(spec?.startsWith('/'),'An explicit installed Playwright runtime is required');
const {chromium}=await import(pathToFileURL(spec).href),{server}=await import('./server.mjs');
let browser,encoder,done,fail=false;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 const page=await browser.newPage({viewport:{width:cfg.size,height:cfg.size},deviceScaleFactor:1});
 page.on('pageerror',e=>{fail=true;report.errors.push(String(e))});page.on('crash',()=>{fail=true;report.errors.push('Renderer process crashed')});
 page.on('console',m=>{if(m.type()==='error'){fail=true;report.errors.push(m.text().slice(0,2000));}});
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?r.continue():r.abort('blockedbyclient')});
 await page.goto('http://127.0.0.1:4317/sanctuary-production.html?w='+cfg.size+'&h='+cfg.size+'&scope=interior',{waitUntil:'load',timeout:300000});
 await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});
 report.configuration=await page.evaluate(async options=>{
  const p=window.production;p.renderer.resetState=()=>{};const receipt=p.configure(options.finish);
  if(options.carvedDetail){const m=await import('/src/sanctuary-carved-detail.js');receipt.carving=m.applySanctuaryCarvedDetail(p.world).report;}
  if(options.contact){const m=await import('/src/sanctuary-contact-optics.js');receipt.contact=m.installSanctuaryContactOptics(p,options.contact).info();}
  p.renderer.shadowMap.needsUpdate=true;return receipt;
 },cfg);
 report.framePolicy='Existing current geometry, native noReset, isolated per-frame HDR targets; no interpolation or upscaling';
 const count=30*cfg.duration,shape=cfg.size;
 const poseAt=u=>{const s=u*u*(3-2*u);return{position:cfg.from.map((x,j)=>x+(cfg.to[j]-x)*s),target:cfg.target,time:cfg.time,fov:cfg.fov};};
 const capture=async pose=>{
  demand(!fail,'Browser error: '+report.errors.join(' | '));
  const f=await page.evaluate(pose=>{const p=window.production,r=p.capture(pose),i=p.info();return{png:r.png,pose:r.pose,glError:r.glError,pixels:r.pixels,contextLost:i.contextLost,programsLinked:i.programs.every(x=>x.linked),seconds:r.seconds,contact:p.contactOpticsInfo?.()}},pose);
  demand(f.glError===0&&!f.contextLost&&f.programsLinked&&f.pixels.nonzero>shape*shape*.85,'Rejected blank/invalid GPU frame');
  const bytes=Buffer.from(f.png.split(',')[1],'base64');delete f.png;
  demand(bytes.length>20000&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Invalid captured PNG');
  demand(bytes.readUInt32BE(16)===shape&&bytes.readUInt32BE(20)===shape,'Captured pixels do not match native resolution');
  return{...f,bytes,sha256:hash(bytes)};
 };
 report.status='checking-real-motion';await save();
 const probes=[];
 for(const [i,u] of [0,.5,0].entries()){
  const f=await capture(poseAt(u));probes.push({u,sha256:f.sha256,seconds:f.seconds,pixels:f.pixels});
  await writeFile(out+'/preflight-'+i+'.png',f.bytes);
 }
 report.preflight={frames:probes,returnedPoseIdentical:probes[0].sha256===probes[2].sha256,movedPoseDifferent:probes[0].sha256!==probes[1].sha256};
 demand(report.preflight.returnedPoseIdentical&&report.preflight.movedPoseDifferent,'Motion preflight failed: blank/stale/nondeterministic framebuffer');
 report.scene=await page.evaluate(()=>window.production.info());report.status='rendering';await save();
 const picture=out+'/'+cfg.id+'-picture.mp4',movie=out+'/'+cfg.id+'.mp4';
 encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','png','-framerate','30','-i','pipe:0','-an','-vf','scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-preset','slow','-crf','15','-r','30','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',picture],{stdio:['pipe','inherit','inherit']});
 let pipeError=null;encoder.stdin.on('error',e=>pipeError=e);done=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(Error('ffmpeg failed: '+code)))});done.catch(()=>{});
 let previous=null,changed=0;
 for(let i=0;i<count;i++){
  demand(!pipeError,'Encoder pipe failed');const frame=await capture(poseAt(i/(count-1)));
  if(previous&&previous!==frame.sha256)changed++;previous=frame.sha256;
  if([0,Math.floor((count-1)/2),count-1].includes(i))await writeFile(out+'/frame-'+String(i).padStart(4,'0')+'.png',frame.bytes);
  report.frames.push({index:i,sha256:frame.sha256,pose:frame.pose,pixels:frame.pixels,renderSeconds:frame.seconds,contactFrames:frame.contact?.frames});
  if(!encoder.stdin.write(frame.bytes))await once(encoder.stdin,'drain');
  if(i%15===0||i===count-1){report.lastFrame=i;await save();console.log(JSON.stringify({frame:i+1,total:count,sha256:frame.sha256}));}
 }
 encoder.stdin.end();await done;demand(changed>=count*.75,'Video lacks verified real camera movement');
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',picture,'-ss','25','-t',String(cfg.duration),'-i','music/PerituneMaterial_Oboro.mp3','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','224k','-ar','48000','-ac','2','-af','afade=t=in:st=0:d=1,afade=t=out:st='+String(cfg.duration-1.5)+':d=1.5','-t',String(cfg.duration),'-metadata','comment=Music: Oboro by PeriTune / Sei Mutsuki, CC BY 4.0. Excerpt and fades. Visuals: real current-scene Three.js rendering.','-movflags','+faststart',movie],{timeout:180000});
 const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',movie],{encoding:'utf8',timeout:120000}));
 const v=meta.streams.find(s=>s.codec_type==='video'),a=meta.streams.find(s=>s.codec_type==='audio');
 demand(v?.width===shape&&v.height===shape&&Number(v.nb_read_frames)===count&&v.codec_name==='h264'&&v.r_frame_rate==='30/1'&&a?.codec_name==='aac'&&a.sample_rate==='48000','Invalid native movie codec/timing');
 demand(Math.abs(+meta.format.duration-cfg.duration)<.1,'Wrong final movie duration');execFileSync('ffmpeg',['-v','error','-i',movie,'-f','null','-'],{timeout:120000});
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i','references/hd/4-照片-5.jpg','-i',out+'/frame-0000.png','-filter_complex',`[0:v]scale=${shape}:${shape}[a];[a][1:v]hstack[out]`,'-map','[out]','-frames:v','1',out+'/reference-left-render-right.png']);
 const pair=out+'/'+cfg.id+'-comparison.mp4';
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-loop','1','-framerate','30','-i','references/hd/4-照片-5.jpg','-i',movie,'-filter_complex',`[0:v]scale=${shape}:${shape},setsar=1[a];[a][1:v]hstack=shortest=1,format=yuv420p[out]`,'-map','[out]','-map','1:a:0','-t',String(cfg.duration),'-c:v','libx264','-preset','slow','-crf','17','-c:a','copy','-movflags','+faststart',pair],{timeout:240000});
 report.status='rendered-motion-review';report.movie=cfg.id+'.mp4';report.comparison=cfg.id+'-comparison.mp4';report.movieSha256=hash(await readFile(movie));report.verification={realFrames:count,changedFrames:changed,decoded:true,fps:30,renderResolution:[shape,shape],encodedResolution:[shape,shape],upscaled:false,audio:'AAC',video:'H264'};
 report.note='Real camera motion over existing Three.js geometry, with native scene-depth contact shading and cast ornament detail. Not final photographic-fidelity acceptance or a completed ten-shot film.';
}catch(e){report.status='failed';report.errors.push(String(e.stack||e));encoder?.kill('SIGTERM');process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();await save();if(browser)await browser.close().catch(()=>{});server.close();console.log(JSON.stringify({status:report.status,lastFrame:report.lastFrame??-1,errors:report.errors.slice(0,3)}));}
