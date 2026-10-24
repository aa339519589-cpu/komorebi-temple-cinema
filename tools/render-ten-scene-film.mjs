import {spawn,execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {reconstructionSourceIdentity} from './reconstruction-source-identity.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const iteration=process.env.FILM_ITERATION||'hour-1832-film';
if(!/^[a-zA-Z0-9_-]+$/.test(iteration))throw Error('Invalid film iteration');
const size=Number(process.env.FILM_SIZE||1080),fps=Number(process.env.FILM_FPS||30),shotDuration=7,expectedShotFrames=fps*shotDuration;
if(![24,25,30,60].includes(fps))throw Error('FILM_FPS must be 24,25,30 or60.');
const reuseIterations=(process.env.FILM_REUSE_ITERATIONS||process.env.FILM_REUSE_ITERATION||'').split(',').filter(Boolean);
if(reuseIterations.some(v=>!/^[a-zA-Z0-9_-]+$/.test(v)))throw Error('Invalid cached film iteration');
const out=resolve(root,'output',iteration);await mkdir(out,{recursive:true});
const report={status:'rendering-ten-actual-shots',startedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),size:[size,size],fps,visualAccepted:false,completeRequestedFidelity:false,shots:[]};
const save=()=>writeFile(resolve(out,'film-build.json'),JSON.stringify(report,null,2)+'\n');
const identities=[];for(let reference=1;reference<=10;reference++)identities.push((await reconstructionSourceIdentity(root,String(reference).padStart(2,'0'))).hash);
async function run(cmd,args,env={}){await new Promise((yes,no)=>{const p=spawn(cmd,args,{cwd:root,env:{...process.env,...env},stdio:'inherit'});p.once('error',no);p.once('exit',(code,signal)=>code===0?yes():no(Error(cmd+' exited '+code+' '+(signal||''))));});}
try{
 for(let reference=1;reference<=10;reference++){
  const id=String(reference).padStart(2,'0');
  if((await reconstructionSourceIdentity(root,id)).hash!==identities[reference-1])throw Error('Source changed before shot '+id);
  let receipt=null,reused=false;
  for(const reuseIteration of reuseIterations){
   try{
    const cached=JSON.parse(await readFile(resolve(root,'qa/ten-reference',id,'iteration-'+reuseIteration,'report.json'),'utf8'));
    if(cached.status==='motion-review-rendered'&&cached.source.hash===identities[reference-1]&&cached.size===size&&cached.motion?.fps===fps&&cached.motion.expectedFrames===expectedShotFrames&&(await stat(cached.motion.file)).size>1000){receipt=cached;reused=true;break;}
   }catch(e){if(e.code!=='ENOENT')throw e;}
  }
  if(!receipt){
   await run(process.execPath,['tools/render-one-reconstruction.mjs'],{REFERENCE:String(reference),WORKTREE:root,SIZE:String(size),ITERATION:iteration,MOTION_FPS:String(fps)});
   receipt=JSON.parse(await readFile(resolve(root,'qa/ten-reference',id,'iteration-'+iteration,'report.json'),'utf8'));
  }
  if(receipt.status!=='motion-review-rendered'||receipt.source.hash!==identities[reference-1])throw Error('Shot source/encoding failure '+id);
  const file=receipt.motion.file,videoSha256=createHash('sha256').update(await readFile(file)).digest('hex');
  report.shots.push({reference,file,videoSha256,reusedIdenticalSourceShot:reused,source:receipt.source,frames:receipt.motion.expectedFrames,duration:7,actualWebgl:true,visualAccepted:false});await save();
 }
 const concatFile=resolve(out,'shots.txt');await writeFile(concatFile,report.shots.map(s=>"file '"+s.file.replaceAll("'","'\\''")+"'").join('\n')+'\n');
 const music=resolve(root,'music/PerituneMaterial_Oboro.mp3');
 const master=resolve(out,'temple-ten-scenes-70s.mp4');
 // Copy the original encoded shot streams directly into the musical70s
 // master. Avoid a second full-size silent concatenation on the small SSD;
 // all original seven-second sources and both requested edits are retained.
 await run('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',concatFile,'-ss','25','-i',music,'-map','0:v:0','-map','1:a:0','-c:v','copy','-af','loudnorm=I=-20:TP=-2:LRA=9,afade=t=in:d=1.5,afade=t=out:st=67:d=3','-c:a','aac','-b:a','192k','-ar','48000','-t','70','-movflags','+faststart',master]);
 // The seven-second source shots are kept intact. Distribute exactly ten
 // seconds of overlap across the nine transitions so the edit is 60 seconds.
 const transitionFrames=fps===30?[33,33,33,33,33,33,33,33,36]:Array.from({length:9},(_,i)=>Math.floor(10*fps/9)+(i<10*fps%9?1:0));
 const args=['-y','-hide_banner','-loglevel','error','-filter_complex_threads','1'];for(const shot of report.shots)args.push('-i',shot.file);args.push('-ss','25','-i',music);
 const filters=[];for(let i=0;i<10;i++)filters.push(`[${i}:v]settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v${i}]`);
 let previous='v0',length=7;
 for(let i=1;i<10;i++){const duration=transitionFrames[i-1]/fps,offset=length-duration,label='blend'+i;filters.push(`[${previous}][v${i}]xfade=transition=fade:duration=${duration}:offset=${offset.toFixed(6)}[${label}]`);length+=7-duration;previous=label;}
 const minute=resolve(out,'temple-ten-scenes-60s.mp4');
 args.push('-filter_complex',filters.join(';'),'-map',`[${previous}]`,'-map','10:a:0','-af','loudnorm=I=-20:TP=-2:LRA=9,afade=t=in:d=1.5,afade=t=out:st=57:d=3','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p','-r',String(fps),'-fps_mode','cfr','-c:a','aac','-b:a','192k','-ar','48000','-t','60','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','iec61966-2-1','-movflags','+faststart',minute);
 await run('ffmpeg',args);
 report.status='ten-scene-draft-rendered';report.completedAt=new Date().toISOString();report.sourceFrames=10*expectedShotFrames;report.sourceDuration=70;report.edits=[{file:master,duration:70,sourceShotsKeptAtSevenSeconds:true},{file:minute,duration:60,fps,overlapFrames:transitionFrames}];
 report.audio={file:'music/PerituneMaterial_Oboro.mp3',title:'Oboro',composer:'PeriTune / Sei Mutsuki',source:'https://peritune.com/blog/2019/04/08/oboro/',license:'CC BY 4.0',offsetSeconds:25};
 await save();console.log(JSON.stringify({status:report.status,edits:report.edits,visualAccepted:false}));
}catch(e){report.status='failed';report.error=String(e.stack||e);await save();throw e;}
