import { spawn } from 'node:child_process';
const run = args => new Promise((resolve, reject) => {
  const p = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], {
    stdio: 'inherit'
  });
  p.on('error', reject);
  p.on('close', code => code ? reject(Error('ffmpeg exited ' + code)) : resolve());
});
for (const duration of (process.argv.length>2?process.argv.slice(2).map(Number):[70,60])) {
  const audio = `atrim=duration=${duration},asetpts=PTS-STARTPTS,loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=in:st=0:d=1.6,afade=t=out:st=${duration - 3.2}:d=3.2`;
  await run(['-i', `output/komorebi-picture-${duration}s.mp4`, '-ss', '25', '-i', 'music/PerituneMaterial_Oboro.mp3', '-map', '0:v:0', '-map', '1:a:0', '-af', audio, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-t', String(duration), '-movflags', '+faststart', '-metadata', 'title=Komorebi — A Study in Golden Light', '-metadata', 'artist=Procedural Three.js scene', '-metadata', 'comment=Music: Oboro by PeriTune / Sei Mutsuki | CC BY 4.0 | https://peritune.com/blog/2019/04/08/oboro/ | https://creativecommons.org/licenses/by/4.0/ | Cropped and faded.', `output/komorebi-${duration}s.mp4`]);
  console.log(`Mastered ${duration}s, with licensed music.`);
}
