import { homedir } from 'node:os';
import './server.mjs';
let playwright;
try {
  playwright = await import('playwright');
} catch {
  playwright = await import(homedir() + '/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
}
const {
  chromium
} = playwright;
import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
let localExecutable = process.env.CHROME_PATH;
if (!localExecutable) {
  try {
    await (await import('node:fs/promises')).access(homedir() + '/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium');
    localExecutable = homedir() + '/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium';
  } catch {}
}
const browser = await chromium.launch({
  headless: true,
  executablePath: localExecutable,
  args: [...(process.platform === 'darwin' ? ['--use-angle=metal'] : []), '--enable-gpu', '--ignore-gpu-blocklist']
});
const page = await browser.newPage({
    viewport: {
      width: 1920,
      height: 1080
    }
  }),
  errors = [],
  warnings = [],
  requests = [];
page.on('pageerror', e => errors.push(e.stack));
page.on('console', m => {
  if (m.type() === 'warning' || m.type() === 'error') warnings.push(m.text());
});
page.on('request', r => requests.push(r.url()));
await page.goto(`http://127.0.0.1:${process.env.PORT || 4317}/?render=1&w=1920&h=1080`);
await page.waitForFunction(() => window.temple?.ready, {
  timeout: 240000
});
const hash = b => createHash('sha256').update(b).digest('hex'),
  repeat = [];
for (const t of [0, 7.1, 25.5, 38.3, 49.5, 66.2]) {
  let hashes = [];
  for (let n = 0; n < 2; n++) {
    await page.evaluate(t => window.temple.renderAt(t), t);
    hashes.push(hash(await page.screenshot({
      type: 'png'
    })));
  }
  repeat.push({
    t,
    identical: hashes[0] === hashes[1],
    sha256: hashes[0]
  });
}
const routes = await page.evaluate(() => {
  const out = [];
  for (let i = 0; i < 10; i++) {
    const samples = [];
    for (let n = 0; n <= 28; n++) {
      let t = i * 7 + Math.min(6.999999, n * .25),
        s = window.temple.renderAt(t);
      let distance = Math.hypot(...s.position.map((x, j) => x - s.target[j]));
      samples.push({
        t,
        position: s.position,
        distance
      });
    }
    let min = Math.min(...samples.map(s => s.distance)),
      max = Math.max(...samples.map(s => s.distance));
    out.push({
      shot: i + 1,
      startDistance: samples[0].distance,
      endDistance: samples.at(-1).distance,
      minDistance: min,
      maxDistance: max,
      finite: samples.every(s => s.position.every(Number.isFinite)),
      closeStart: samples[0].distance < 7,
      pullsAway: samples.at(-1).distance > samples[0].distance
    });
  }
  return out;
});
await page.evaluate(() => window.temple.renderAt(6.9));
await page.screenshot({
  path: 'output/poster.png'
});
const info = await page.evaluate(() => window.temple.info());
const report = {
  info,
  errors,
  warnings,
  deterministicFrames: repeat,
  routes,
  externalVisualRequests: requests.filter(x => !x.startsWith(`http://127.0.0.1:${process.env.PORT || 4317}/`)),
  passed: errors.length === 0 && warnings.length === 0 && repeat.every(r => r.identical) && routes.every(r => r.finite && r.closeStart && r.pullsAway)
};
await writeFile('qa/browser-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(report.passed ? 0 : 1);
