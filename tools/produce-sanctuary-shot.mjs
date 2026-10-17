/** Render one genuinely moving sanctuary camera directly from v60 Three.js geometry. */
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {spawn,execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
const out='output/sanctuary-shot';await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),cfg=JSON.parse(await readFile('tools/sanctuary-shot-request.json','utf8'));
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
 page.on('pageerror',e=>{fail=true;report.errors.push(String(e))});
 page.on('crash',()=>{fail=true;report.errors.push('Renderer process crashed')});
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text().slice(0,1200))});
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?r.continue():r.abort('blockedbyclient')});
 await page.goto('http://127.0.0.1:4317/sanctuary-production.html?w='+cfg.size+'&h='+cfg.size+'&scope=interior',{waitUntil:'load',timeout:300000});
 await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});
 report.scene=await page.evaluate(()=>window.production.info());
 demand(!report.scene.contextLost&&report.scene.programs.every(p=>p.linked),'Invalid baseline WebGL shaders');
 await page.evaluate(options=>window.production.configure(options),cfg.finish);
 report.status='rendering';await save();
 const fps=30,count=fps*cfg.duration,shape=cfg.size;
 const picture=out+'/'+cfg.id+'-picture.mp4',movie=out+'/'+cfg.id+'.mp4';
 encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','png','-framerate','30','-i','pipe:0','-an','-vf','scale=720:720:flags=lanczos,format=yuv420p','-c:v','libx264','-preset','medium','-crf','17','-r','30','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',picture],{stdio:['pipe','inherit','inherit']});
 let pipeError=null;encoder.stdin.on('error',e=>pipeError=e);
 done=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(Error('ffmpeg failed: '+code)))});done.catch(()=>{});
 let previous=null,changed=0;
 for(let i=0;i<count;i++){
  demand(!fail&&!pipeError,'Lost browser or encoder: '+report.errors.join(' | '));
  const u=i/(count-1),s=u*u*(3-2*u),pose={position:cfg.from.map((x,j)=>x+(cfg.to[j]-x)*s),target:cfg.target,time:cfg.time,fov:cfg.fov};
  const frame=await page.evaluate(pose=>{const p=window.production,result=p.capture(pose),info=p.info();return{png:result.png,pose:result.pose,glError:result.glError,pixels:result.pixels,contextLost:info.contextLost,programsLinked:info.programs.every(x=>x.linked),duration:result.seconds}},pose);
  demand(frame.glError===0&&!frame.contextLost&&frame.programsLinked&&frame.pixels.nonzero>shape*shape*.85,'Rejected blank/invalid GPU frame '+i);
  const bytes=Buffer.from(frame.png.split(',')[1],'base64');demand(bytes.length>20000&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'PNG from GPU invalid');
  const digest=hash(bytes);if(previous&&previous!==digest)changed++;previous=digest;
  if([0,Math.floor((count-1)/2),count-1].includes(i))await writeFile(out+'/frame-'+String(i).padStart(4,'0')+'.png',bytes);
  if(!encoder.stdin.write(bytes))await once(encoder.stdin,'drain');
  if(i%15===0||i===count-1){report.frames.push({index:i,sha256:digest,pose:frame.pose,pixels:frame.pixels,renderSeconds:frame.duration});report.lastFrame=i;await save();console.log(JSON.stringify({frame:i+1,total:count,sha256:digest}))}
 }
 encoder.stdin.end();await done;
 demand(changed>=count*.75,'Video lacks verified real camera movement');
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',picture,'-ss','25','-t',String(cfg.duration),'-i','music/PerituneMaterial_Oboro.mp3','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','224k','-ar','48000','-ac','2','-af','afade=t=in:st=0:d=1,afade=t=out:st='+String(cfg.duration-1.5)+':d=1.5','-t',String(cfg.duration),'-movflags','+faststart',movie],{timeout:180000});
 const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',movie],{encoding:'utf8',timeout:120000}));
 const v=meta.streams.find(s=>s.codec_type==='video'),a=meta.streams.find(s=>s.codec_type==='audio');
 demand(v?.width===720&&v.height===720&&Number(v.nb_read_frames)===count&&v.codec_name==='h264'&&a?.codec_name==='aac'&&a.sample_rate==='48000','Invalid movie codec/timing');
 demand(Math.abs(+meta.format.duration-cfg.duration)<.1,'Wrong final movie duration');
 execFileSync('ffmpeg',['-v','error','-i',movie,'-f','null','-'],{timeout:120000});
 report.status='rendered-motion-review';report.movie=cfg.id+'.mp4';report.movieSha256=hash(await readFile(movie));report.verification={realFrames:count,changedFrames:changed,decoded:true,fps:30,audio:'AAC',video:'H264/720x720'};
 report.note='Continuous camera motion rendered from actual Three.js geometry, no generated/interpolated images; still not photographic-fidelity acceptance or the final film.';
}catch(e){report.status='failed';report.errors.push(String(e.stack||e));encoder?.kill('SIGTERM');process.exitCode=1}finally{report.finishedAt=new Date().toISOString();await save();if(browser)await browser.close().catch(()=>{});server.close();console.log(JSON.stringify({status:report.status,lastFrame:report.lastFrame??-1,errors:report.errors.slice(0,3)}))}
