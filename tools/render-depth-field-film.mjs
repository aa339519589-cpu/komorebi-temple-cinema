import {spawn,execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url)),iteration=process.env.FILM_ITERATION??'depth-field-film-v02';
if(!/^[\w-]+$/.test(iteration))throw Error('Invalid iteration.');
const out=resolve(root,'output',iteration);await mkdir(out,{recursive:true});
const size=Number(process.env.FILM_SIZE??1080),report={status:'rendering-ten-real-3d-shots',startedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),method:'Independent Apache2.0 DepthAnythingV2Small depth → colored anisotropic3D Gaussians → Three/Spark camera rendering.',fps:30,size:[size,size],shots:[],visualAccepted:false,completeRequestedFidelity:false,limitations:['Visible-surface reconstruction; unseen geometry is inferred or absent.','Photographic lighting is baked into point radiance; this is not a relightable closed CAD model.']};
const save=()=>writeFile(resolve(out,'film-build.json'),JSON.stringify(report,null,2)+'\n');
async function run(cmd,args,env={}){await new Promise((yes,no)=>{const p=spawn(cmd,args,{cwd:root,env:{...process.env,...env},stdio:'inherit'});p.once('error',no);p.once('exit',c=>c===0?yes():no(Error(cmd+' exited '+c)));});}
try{
 for(let n=1;n<=10;n++){
  const id=String(n).padStart(2,'0');await run(process.execPath,['tools/render-depth-field-shot.mjs'],{SCENE:id,FILM_ITERATION:iteration,FILM_SIZE:String(size)});
  const folder=resolve(out,'shots',id),receipt=JSON.parse(await readFile(resolve(folder,'report.json'),'utf8'));
  if(receipt.status!=='actual-3d-shot-rendered')throw Error('Shot incomplete '+id);
  report.shots.push({scene:id,file:receipt.clip.file,sha256:receipt.clip.sha256,frames:receipt.expectedFrames,duration:7,model:receipt.model,metadata:receipt.metadata,sourceCommit:receipt.sourceCommit});await save();
 }
 const list=resolve(out,'shots.txt');await writeFile(list,report.shots.map(s=>"file '"+s.file.replaceAll("'","'\\''")+"'").join('\n')+'\n');
 const silent=resolve(out,'ten-shots-70s-silent.mp4'),music=resolve(root,'music/PerituneMaterial_Oboro.mp3');
 await run('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',silent]);
 const full=resolve(out,'temple-ten-scenes-70s.mp4');
 await run('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',silent,'-ss','25','-i',music,'-map','0:v:0','-map','1:a:0','-c:v','copy','-af','loudnorm=I=-20:TP=-2:LRA=9,afade=t=in:d=1.5,afade=t=out:st=67:d=3','-c:a','aac','-b:a','192k','-ar','48000','-t','70','-movflags','+faststart',full]);
 const args=['-y','-hide_banner','-loglevel','error','-filter_complex_threads','1'];for(const shot of report.shots)args.push('-i',shot.file);args.push('-ss','25','-i',music);
 const filters=report.shots.map((_,i)=>`[${i}:v]settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v${i}]`);let previous='v0',duration=7;
 for(let i=1;i<10;i++){const overlap=i===9?1.2:1.1,label='dissolve'+i;filters.push(`[${previous}][v${i}]xfade=transition=fade:duration=${overlap}:offset=${(duration-overlap).toFixed(3)}[${label}]`);duration+=7-overlap;previous=label;}
 const minute=resolve(out,'temple-ten-scenes-60s.mp4');
 args.push('-filter_complex',filters.join(';'),'-map',`[${previous}]`,'-map','10:a:0','-af','loudnorm=I=-20:TP=-2:LRA=9,afade=t=in:d=1.5,afade=t=out:st=57:d=3','-c:v','libx264','-preset','fast','-crf','15','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','192k','-ar','48000','-t','60','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','iec61966-2-1','-movflags','+faststart',minute);
 await run('ffmpeg',args);
 report.status='ten-3d-scene-films-rendered';report.completedAt=new Date().toISOString();report.sourceFrames=2100;report.edits=[{file:minute,duration:60,overlapFrames:[33,33,33,33,33,33,33,33,36]},{file:full,duration:70,sourceShotSeconds:7}];report.audio={title:'Oboro',composer:'PeriTune / SeiMutsuki',license:'CC BY4.0',source:'https://peritune.com/blog/2019/04/08/oboro/',file:'music/PerituneMaterial_Oboro.mp3',offsetSeconds:25};await save();console.log(JSON.stringify({status:report.status,edits:report.edits}));
}catch(e){report.status='failed';report.error=String(e.stack??e);await save();throw e;}
