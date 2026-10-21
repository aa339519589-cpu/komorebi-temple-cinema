// Assemble only real, completed native clips whose full source trees match a
// public Git snapshot. Modeling can continue separately without mixing bytes.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const root=process.cwd(),commit=process.env.FILM_SOURCE_COMMIT||'c6841ad';
const iteration=process.env.FILM_ITERATION||'native-rebuild-review-20261021-b';
if(!/^[a-z0-9_-]+$/i.test(iteration)||!/^[a-f0-9]{7,40}$/i.test(commit))throw Error('Invalid snapshot or output');
const snapshot=execFileSync('git',['rev-parse',commit],{encoding:'utf8'}).trim();
const versions=['native-rebuild-review-20261021-a','native-rebuild-review-20261021-a','native-rebuild-review-20261021-a','granite-maple-approach-motion-20261021','pagoda-asymmetric-corner-motion-20261021','connected-sculpture-mudra-motion-20261021','native-rebuild-review-20261021-a','native-rebuild-review-20261021-a','night-physical-courtyard-motion-20261021','rain-solid-relief-motion-20261021-b'];
const out=resolve(root,'output',iteration);await mkdir(out,{recursive:true});
const report={status:'assembling-preserved-native-shots',startedAt:new Date().toISOString(),sourceCommit:snapshot,size:[960,960],fps:24,visualAccepted:false,completeRequestedFidelity:false,scope:'An immutable production checkpoint; later ongoing model revisions are not included.',shots:[]};
const save=()=>writeFile(resolve(out,'film-build.json'),JSON.stringify(report,null,2)+'\n');
const cache=new Map(),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function gitBytes(file){if(!cache.has(file))cache.set(file,execFileSync('git',['show',snapshot+':'+file],{maxBuffer:256*1024*1024}));return cache.get(file);}
async function run(cmd,args){await new Promise((yes,no)=>{const p=spawn(cmd,args,{cwd:root,stdio:'inherit'});p.on('error',no);p.on('exit',code=>code===0?yes():no(Error(cmd+' exited '+code)));});}
try{
 await save();
 for(let reference=1;reference<=10;reference++){
  const id=String(reference).padStart(2,'0'),receiptFile=resolve(root,'qa/ten-reference',id,'iteration-'+versions[reference-1],'report.json');
  const receipt=JSON.parse(await readFile(receiptFile,'utf8'));
  if(receipt.status!=='motion-review-rendered'||receipt.size!==960||receipt.motion?.fps!==24||receipt.motion.expectedFrames!==168)throw Error('Invalid native source clip '+id);
  const names=execFileSync('git',['ls-tree','-r','--name-only',snapshot,'--','reconstructions/scene-'+id],{encoding:'utf8'}).trim().split('\n').filter(f=>/\.(?:m?js|html|json|glb|gltf|bin|png|jpe?g|webp)$/.test(f));
  const dependencies=JSON.parse(gitBytes('reconstructions/scene-'+id+'/asset-dependencies.json').toString());names.push(...dependencies.files);
  const unique=[...new Set(names)].sort(),h=createHash('sha256');
  if(unique.length!==Object.keys(receipt.source.files).length)throw Error('Source file set differs from snapshot '+id);
  for(const file of unique){const bytes=gitBytes(file);if(sha(bytes)!==receipt.source.files[file])throw Error('Source differs from public snapshot: '+file);h.update(file+'\0');h.update(bytes);h.update('\0');}
  if(h.digest('hex')!==receipt.source.hash)throw Error('Source identity mismatch '+id);
  const file=receipt.motion.file,bytes=await readFile(file);
  report.shots.push({reference,file,receipt:receiptFile,source:receipt.source,frames:168,duration:7,actualWebgl:true,reusedIdenticalSourceShot:true,videoSha256:sha(bytes),visualAccepted:false});await save();
 }
 const args=['-y','-hide_banner','-loglevel','error','-filter_complex_threads','1'];
 for(const shot of report.shots)args.push('-i',shot.file);
 args.push('-ss','25','-i',resolve(root,'music/PerituneMaterial_Oboro.mp3'));
 const overlap=[27,27,27,27,27,27,26,26,26],filters=report.shots.map((_,i)=>`[${i}:v]settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[v${i}]`);
 let previous='v0',length=7;
 for(let i=1;i<10;i++){const duration=overlap[i-1]/24,offset=length-duration,label='blend'+i;filters.push(`[${previous}][v${i}]xfade=transition=fade:duration=${duration}:offset=${offset.toFixed(6)}[${label}]`);length+=7-duration;previous=label;}
 const minute=resolve(out,'temple-ten-scenes-60s.mp4');
 args.push('-filter_complex',filters.join(';'),'-map',`[${previous}]`,'-map','10:a:0','-af','loudnorm=I=-20:TP=-2:LRA=9,afade=t=in:d=1.5,afade=t=out:st=57:d=3','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p','-r','24','-fps_mode','cfr','-c:a','aac','-b:a','192k','-ar','48000','-t','60','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','iec61966-2-1','-movflags','+faststart',minute);
 await run('ffmpeg',args);
 const list=resolve(out,'shots.txt');await writeFile(list,report.shots.map(s=>"file '"+s.file.replaceAll("'","'\\''")+"'").join('\n')+'\n');
 const master=resolve(out,'temple-ten-scenes-70s.mp4');await run('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',list,'-ss','25','-i',resolve(root,'music/PerituneMaterial_Oboro.mp3'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-af','loudnorm=I=-20:TP=-2:LRA=9,afade=t=in:d=1.5,afade=t=out:st=67:d=3','-c:a','aac','-b:a','192k','-ar','48000','-t','70','-movflags','+faststart',master]);
 report.status='ten-scene-draft-rendered';report.completedAt=new Date().toISOString();report.sourceFrames=1680;report.sourceDuration=70;report.edits=[{file:minute,duration:60,fps:24,overlapFrames:overlap,sha256:sha(await readFile(minute))},{file:master,duration:70,sourceShotsKeptAtSevenSeconds:true,sha256:sha(await readFile(master))}];
 report.audio={title:'Oboro',composer:'PeriTune / Sei Mutsuki',source:'https://peritune.com/blog/2019/04/08/oboro/',license:'CC BY 4.0',offsetSeconds:25};await save();console.log(JSON.stringify({status:report.status,sourceCommit:snapshot,edits:report.edits,visualAccepted:false}));
}catch(e){report.status='failed';report.error=String(e.stack||e);await save();throw e;}
