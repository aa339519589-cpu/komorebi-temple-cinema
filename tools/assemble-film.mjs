import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname);process.chdir(root);
const run=args=>new Promise((res,rej)=>{const p=spawn('ffmpeg',args,{stdio:'inherit'});p.on('close',c=>c?rej(Error('ffmpeg '+c)):res())});
for(const duration of (process.env.DURATIONS||'70').split(',').map(Number)){
 const core=duration/10,folder=`output/draft-v3/${duration}s`,inputs=[];
 for(let n=1;n<=10;n++)inputs.push('-i',`${folder}/shot-${String(n).padStart(2,'0')}.mkv`);
 const graph=[];for(let i=0;i<10;i++)graph.push(`[${i}:v]settb=1/30,setpts=PTS-STARTPTS,format=yuv444p10le[v${i}]`);
 let previous='v0';for(let i=1;i<10;i++){const next='x'+i;graph.push(`[${previous}][v${i}]xfade=transition=fade:duration=0.333333333:offset=${i*core}[${next}]`);previous=next;}
 graph.push(`[${previous}]trim=start_frame=5:end_frame=${duration*30+5},setpts=PTS-STARTPTS,format=yuv420p[v]`);
 graph.push(`[10:a]atrim=duration=${duration},asetpts=PTS-STARTPTS,loudnorm=I=-19:TP=-1.5:LRA=10,afade=t=in:st=0:d=1.5,afade=t=out:st=${duration-3}:d=3[a]`);
 const mp4=`output/draft-v3/low-angle-review-${duration}s.mp4`,webm=mp4.replace('.mp4','.webm');
 await writeFile(`qa/v3/edit-${duration}s.ffgraph`,graph.join(';\n'));
  await run(['-y','-hide_banner','-loglevel','warning',...inputs,'-ss','25','-i','music/PerituneMaterial_Oboro.mp3','-filter_complex_threads','2','-filter_complex_script',`qa/v3/edit-${duration}s.ffgraph`,'-map','[v]','-map','[a]','-c:v','libx264','-preset','slow','-crf','15','-r','30','-c:a','aac','-b:a','320k','-ar','48000','-ac','2','-t',String(duration),'-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart','-metadata','title=Low-angle reconstruction review — work in progress','-metadata','comment=Music: Oboro by PeriTune / Sei Mutsuki, CC BY 4.0; excerpt, normalization and fades.',mp4]);
 await run(['-y','-hide_banner','-loglevel','warning','-i',mp4,'-c:v','libvpx-vp9','-crf','25','-b:v','0','-cpu-used','5','-row-mt','1','-threads','6','-c:a','libopus','-b:a','160k',webm]);
}
