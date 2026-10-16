import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const run=promisify(execFile),reports=[],source=JSON.parse(await readFile('qa/v3/frozen-manifest.json','utf8'));
for(const duration of (process.env.DURATIONS||'70').split(',').map(Number)){
 for(let n=1;n<=10;n++){
  const file=`output/draft-v3/${duration}s/shot-${String(n).padStart(2,'0')}.mkv`,metadata=JSON.parse(await readFile(file+'.json','utf8'));
  assert.equal(metadata.sourceHash,source.sourceHash,'Mixed source snapshots');assert.equal(metadata.samples,3);assert.deepEqual(metadata.renderResolution,[1920,1080]);
  const {stdout}=await run('ffprobe',['-v','error','-count_frames','-show_streams','-of','json',file]);const v=JSON.parse(stdout).streams.find(s=>s.codec_type==='video');assert.equal(+v.nb_read_frames,duration*3+10);assert.equal(v.codec_name,'ffv1');
 }
 for(const extension of ['mp4','webm']){
  const file=`output/draft-v3/low-angle-review-${duration}s.${extension}`;
  const {stdout}=await run('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',file]);const metadata=JSON.parse(stdout),v=metadata.streams.find(s=>s.codec_type==='video'),a=metadata.streams.find(s=>s.codec_type==='audio');
  assert.equal(v.width,1920);assert.equal(v.height,1080);assert.equal(+v.nb_read_frames,duration*30);assert.equal(v.r_frame_rate,'30/1');assert.equal(+a.sample_rate,48000);assert.equal(a.channels,2);assert(Math.abs(+metadata.format.duration-duration)<.06);
  const {stdout:frameInfo}=await run('ffprobe',['-v','error','-select_streams','v','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',file],{maxBuffer:4*1024*1024});const frames=JSON.parse(frameInfo).frames,offset=+frames[0].best_effort_timestamp_time;
  for(let i=0;i<frames.length;i++)assert(Math.abs((+frames[i].best_effort_timestamp_time-offset)-i/30)<.0011,'Frame cadence error');
  const decode=await run('ffmpeg',['-v','error','-i',file,'-f','null','-'],{maxBuffer:4*1024*1024});assert.equal(decode.stderr,'');
  const black=await run('ffmpeg',['-hide_banner','-i',file,'-vf','blackdetect=d=.15:pix_th=.015','-an','-f','null','-'],{maxBuffer:4*1024*1024});assert(!black.stderr.includes('black_start:'));
  reports.push({file,width:v.width,height:v.height,frames:frames.length,duration:+metadata.format.duration,codec:v.codec_name,audio:a.codec_name,cadencePassed:true,decodeErrors:0,blackSegments:0,sourceHash:source.sourceHash,sha256:createHash('sha256').update(await readFile(file)).digest('hex')});
 }
}
const report={status:'work-in-progress review, not final film',scope:'File integrity, source consistency, native frame cadence, decode and black-frame checks; aesthetic reference match remains under revision.',verifiedAt:new Date().toISOString(),sourceHash:source.sourceHash,videos:reports,passed:true};await writeFile('qa/v3/video-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
await writeFile('output/review-status.json',JSON.stringify({ready:true,url:'/output/draft-v3/low-angle-review-70s.webm',label:'十镜头低机位重制测试，仍在继续细化'},null,2));
