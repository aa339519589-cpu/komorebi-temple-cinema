import { spawn } from 'node:child_process';
const encode = duration => new Promise((resolve, reject) => {
  const p = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', `output/komorebi-${duration}s.mp4`, '-map', '0:v:0', '-map', '0:a:0', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '25', '-cpu-used', '5', '-row-mt', '1', '-tile-columns', '2', '-threads', '4', '-pix_fmt', 'yuv420p', '-c:a', 'libopus', '-b:a', '160k', '-t', String(duration), `output/komorebi-${duration}s.webm`], {
    stdio: 'inherit'
  });
  p.on('error', reject);
  p.on('close', c => c ? reject(Error('VP9 encoder exited ' + c)) : resolve());
});
await Promise.all([encode(60), encode(70)]);
console.log('Created full-resolution VP9 + Opus previews for browsers without H.264/AAC support.');
