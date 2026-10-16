import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const req = createRequire(import.meta.url);
let pw;
try {
  pw = await import('playwright');
} catch {
  pw = await import(homedir() + '/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
}
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
process.chdir(root);
const {
  server
} = await import('./server.mjs');
const mode = process.argv[2] || 'preview',
  width = +(process.env.WIDTH || (mode === 'preview' ? 1600 : 3840)),
  height = +(process.env.HEIGHT||Math.round(width * 9 / 16));
const localChrome = homedir() + '/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium';
let executablePath = process.env.CHROME_PATH;
try {
  if (!executablePath) {
    await access(localChrome);
    executablePath = localChrome;
  }
} catch {}
const browser = await pw.chromium.launch({
  headless: true,
  executablePath,
  args: [...(process.platform === 'darwin' ? ['--use-angle=metal'] : []), '--enable-gpu', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--force-color-profile=srgb']
});
const page = await browser.newPage({
  viewport: {
    width,
    height
  },
  deviceScaleFactor: 1
});
const errors = [];
page.on('pageerror', e => {
  errors.push(String(e));
  console.log('ERROR', e.stack);
});
page.on('console', msg => {
  if (['error', 'warning'].includes(msg.type())) console.log(msg.type(), msg.text().slice(0, 900));
});
await page.goto(`http://127.0.0.1:${process.env.PORT || 4317}/${process.env.PAGE||''}?render=1&w=${width}&h=${height}${process.env.QUERY?'&'+process.env.QUERY:''}`, {
  waitUntil: 'load',
  timeout: 120000
});
await page.waitForFunction(() => window.temple?.ready, {
  timeout: 240000
});
const sceneInfo = await page.evaluate(() => window.temple.info());
console.log(JSON.stringify(sceneInfo, null, 2));
await mkdir('qa', {
  recursive: true
});
await writeFile('qa/scene-manifest.json', JSON.stringify({
  ...sceneInfo,
  createdAt: new Date().toISOString()
}, null, 2));
if(process.env.AUDIT_FILE)await writeFile(process.env.AUDIT_FILE,JSON.stringify(await page.evaluate(()=>window.temple.auditCameras()),null,2));
await mkdir('qa', {
  recursive: true
});
const shot = async (t, file) => {
  if(process.env.EXPOSURE_SAMPLES)await page.evaluate(({t,samples})=>window.temple.renderExposure(Math.min(9,Math.floor(t/7)),t%7,t,samples,1/60),{t,samples:+process.env.EXPOSURE_SAMPLES});
  else await page.evaluate(t => window.temple.renderAt(t), t);
  await page.screenshot({
    path: file,
    type: 'png',
    timeout: 120000
  });
};
if (mode === 'preview') {
  const selected = process.env.SHOTS ? process.env.SHOTS.split(',').map(Number) : Array.from({
    length: 10
  }, (_, i) => i);
  for (const i of selected) {
    for (const phase of [0, 0.52, 0.999]) {
      const name = `qa/shot-${String(i + 1).padStart(2, '0')}-${phase === 0 ? 'start' : phase === .52 ? 'mid' : 'end'}.png`;
      await shot(i * 7 + phase * 7, name);
      console.log(name);
    }
  }
} else if (mode === 'still') {
  await shot(Number(process.env.TIME || 5), process.env.FILE || 'qa/still.png');
} else if(mode==='ground'){
  await page.evaluate(()=>window.temple.renderView([0,78,8],[0,-.2,2],12));
  await page.screenshot({path:process.env.FILE||'qa/v3/ground-inspection.png',type:'png',timeout:120000});
} else if(mode==='view'){
  const pose=JSON.parse(process.env.VIEW||'{"position":[6,.9,42],"target":[6,5.52,-6],"fov":64}');
  await page.evaluate(p=>window.temple.renderView(p.position,p.target,p.time||0,p.fov||48),pose);
  await page.screenshot({path:process.env.FILE||'qa/v5/reference-view.png',type:'png',timeout:120000});
} else {
  await mkdir('output', {
    recursive: true
  });
  const baseDuration = +(process.env.DURATION || 70),
    baseFPS = +(process.env.FPS || 30);
  const jobs = process.env.REVIEW_SHOTS ? process.env.REVIEW_SHOTS.split(',').map(Number).map(index=>({duration:70,fps:30,start:index*210,end:(index+1)*210,dest:`output/review-shot-${String(index+1).padStart(2,'0')}.mp4`})) : mode === 'patches' ? [70, 60].flatMap(duration => [0, 6, 9].map(index => ({
    duration,
    fps: 30,
    start: index * duration * 3,
    end: (index + 1) * duration * 3,
    dest: `output/patch-${duration}s-shot-${String(index + 1).padStart(2, '0')}.mp4`
  }))) : [{
    duration: baseDuration,
    fps: baseFPS,
    start: +(process.env.START || 0),
    end: +(process.env.END || Math.round(baseDuration * baseFPS)),
    dest: process.env.DEST || 'output/komorebi-picture-70s.mp4'
  }];
  for (const {
    duration,
    fps,
    start,
    end,
    dest
  } of jobs) {
    console.log('Rendering ' + dest);
    const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-r', String(fps), '-i', 'pipe:0', '-an', '-vf', 'scale=1920:1080:flags=lanczos:in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', dest], {
      stdio: ['pipe', 'inherit', 'inherit']
    });
    const begin = performance.now();
    for (let i = start; i < end; i++) {
      await page.evaluate(t => window.temple.renderAt(t), i / fps * (70 / duration));
      const frame = await page.screenshot({
        type: 'jpeg',
        quality: 97,
        timeout: 120000
      });
      if (!ff.stdin.write(frame)) await new Promise(r => ff.stdin.once('drain', r));
      if ((i - start) % 30 === 0) console.log(JSON.stringify({
        frame: i,
        of: end,
        fps: (i - start + 1) / ((performance.now() - begin) / 1000),
        minutes: ((performance.now() - begin) / 60000).toFixed(1)
      }));
    }
    ff.stdin.end();
    await new Promise((r, j) => ff.on('close', c => c ? j(Error('ffmpeg ' + c)) : r()));
  }
}
await writeFile('qa/browser-errors.json', JSON.stringify(errors, null, 2));
await browser.close();
server.close();
if (errors.length) process.exitCode = 1;
