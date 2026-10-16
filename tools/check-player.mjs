import { homedir } from 'node:os';
import { access, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
let pw;
try {
  pw = await import('playwright');
} catch {
  pw = await import(homedir() + '/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
}
let executablePath = process.env.CHROME_PATH;
const local = homedir() + '/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium';
try {
  if (!executablePath) {
    await access(local);
    executablePath = local;
  }
} catch {}
const browser = await pw.chromium.launch({
  headless: true,
  executablePath,
  args: ['--autoplay-policy=no-user-gesture-required']
});
const page = await browser.newPage({
    viewport: {
      width: 1280,
      height: 900
    }
  }),
  errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto('http://127.0.0.1:4317/film.html');
await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
const short = await page.evaluate(async () => {
  const v = document.querySelector('video');
  v.muted = true;
  await v.play();
  await new Promise(r => setTimeout(r, 1400));
  return {
    duration: v.duration,
    width: v.videoWidth,
    height: v.videoHeight,
    currentTime: v.currentTime,
    error: v.error?.message || null
  };
});
assert(Math.abs(short.duration - 60) < .05);
assert.equal(short.width, 1920);
assert(short.currentTime > 1);
await page.evaluate(async () => {
  const v = document.querySelector('video');
  await new Promise(r => {
    v.addEventListener('seeked', r, {
      once: true
    });
    v.currentTime = 35;
  });
});
await page.click('button[data-length="70"]');
await page.waitForFunction(() => Math.abs(document.querySelector('video').duration - 70) < .05 && document.querySelector('video').readyState >= 2);
const full = await page.evaluate(() => {
  const v = document.querySelector('video');
  return {
    duration: v.duration,
    width: v.videoWidth,
    height: v.videoHeight,
    error: v.error?.message || null
  };
});
assert.equal(full.width, 1920);
assert.equal(full.error, null);
assert.equal(errors.length, 0);
const response = await page.request.head('http://127.0.0.1:4317/output/komorebi-60s.mp4', {
  headers: {
    Range: 'bytes=0-1023'
  }
});
assert.equal(response.status(), 206);
await page.screenshot({
  path: 'qa/player.png'
});
const report = {
  short,
  full,
  seek: true,
  rangeRequests: true,
  errors,
  passed: true
};
await writeFile('qa/player-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
