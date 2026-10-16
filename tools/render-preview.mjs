import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { execFileSync } from 'node:child_process';
import { launchRenderBrowser } from './render-runtime.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url))); process.chdir(root);
const revision = process.env.REVISION;
if (!/^v[0-9]+(?:-[a-z0-9]+)*$/.test(revision || '')) throw Error('Set REVISION to an explicit frozen snapshot, e.g. v5-baseline.');
const manifest = JSON.parse(await readFile(`qa/${revision}/frozen-manifest.json`, 'utf8'));
for (const [name, hash] of Object.entries(manifest.hashes)) {
  const bytes = await readFile(`qa/${revision}/frozen-src/${name}`);
  if (createHash('sha256').update(bytes).digest('hex') !== hash) throw Error(`Frozen source changed: ${name}`);
}
const width = +(process.env.WIDTH || 960), height = +(process.env.HEIGHT || width);
const time = +(process.env.TIME || 41.95), file = process.env.FILE || `qa/${revision}/sanctuary-study.png`;
const view = process.env.VIEW ? JSON.parse(process.env.VIEW) : null;
const startedAt = new Date().toISOString(), began = performance.now();
const { server } = await import('./server.mjs');
let browser;
try {
  const runtime = await launchRenderBrowser(); browser = runtime.browser;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.route('**/*', route => {
    const url=new URL(route.request().url());
    if(url.protocol==='data:'||(url.hostname==='127.0.0.1'&&url.port===(process.env.PORT||'4317')))return route.continue();
    return route.abort('blockedbyclient');
  });
  let failPage;const fatalPageError=new Promise((_,reject)=>{failPage=reject});fatalPageError.catch(()=>{});
  const errors = []; page.on('pageerror', e => {errors.push(String(e));console.error('pageerror:',String(e));failPage(e);});
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('console', m => console.log('browser:', m.type(), m.text().slice(0, 500)));
  console.log(JSON.stringify({ event: 'loading', revision, sourceHash: manifest.sourceHash, width, height, backend: runtime.backend, startedAt }));
  await Promise.race([page.goto(`http://127.0.0.1:${process.env.PORT || 4317}/render-${revision}.html?render=1&defer=1&w=${width}&h=${height}${process.env.AUDIT_REFLECTION ? '&audit-reflection=1' : ''}`, { waitUntil: 'load', timeout: 600000 }),fatalPageError]);
  await Promise.race([page.waitForFunction(() => window.temple?.ready, null, { timeout: 600000 }),fatalPageError]);
  const buildSeconds = (performance.now() - began) / 1000;
  console.log(JSON.stringify({ event: 'scene-ready', buildSeconds }));
  const modes = (process.env.MATERIAL_MODES || process.env.MATERIAL_MODE || 'original').split(',');
  await page.evaluate(() => {
    const materials = new Set(); window.temple.scene.traverse(o => { if (o.isMesh && o.material?.metalness === .96 && o.material.envMap) materials.add(o.material); });
    window.materialAudit = [...materials].map(material => ({ material, envMap: material.envMap, bumpMap: material.bumpMap,
      onBeforeCompile: material.onBeforeCompile, customProgramCacheKey: material.customProgramCacheKey,
      meshes: (() => { const a=[]; window.temple.scene.traverse(o=>{if(o.material===material)a.push(o)});return a; })() }));
  });
  for (const mode of modes) {
    const frameBegan = performance.now();
    await page.evaluate(async mode => {
      const T = await import('/vendor/build/three.module.js');
      for (const original of window.materialAudit) {
        const material = original.material;
        material.envMap=original.envMap;material.bumpMap=original.bumpMap;
        material.onBeforeCompile=original.onBeforeCompile;material.customProgramCacheKey=original.customProgramCacheKey;
        for(const mesh of original.meshes)mesh.material=material;
        if (mode === 'no-local-env') material.envMap = null;
        else if (mode === 'no-bump') material.bumpMap = null;
        else if (mode === 'plain-standard') { material.onBeforeCompile = () => {}; material.customProgramCacheKey = () => 'diagnostic-plain-standard'; material.bumpMap = null; }
        else if (mode === 'basic') { const replacement = new T.MeshBasicMaterial({ color: '#c9aa70' }); for(const mesh of original.meshes)mesh.material=replacement; }
        else if(mode !== 'original')throw Error('Unknown diagnostic material mode');
        material.needsUpdate = true;
      }
      console.info(JSON.stringify({ diagnosticMaterialMode: mode, materials: window.materialAudit.length }));
    }, mode);
    const pose = await page.evaluate(({ view, time }) => view
      ? window.temple.renderView(view.position, view.target, view.time || 0, view.fov || 48)
      : window.temple.renderAt(time), { view, time });
    const output = modes.length > 1 ? file.replace(/\.png$/, '-' + mode + '.png') : file;
    await mkdir(resolve(output, '..'), { recursive: true });
    await page.screenshot({ path: output, type: 'png', timeout: 600000 });
    const info = await page.evaluate(() => window.temple.info());
    const frameSeconds = (performance.now() - frameBegan) / 1000;
    const memory = execFileSync('ps', ['-eo', 'pid,ppid,rss,comm'], { encoding: 'utf8' }).split('\n').filter(x => /chromium|chrome/.test(x));
    const report = { status: errors.length ? 'errors' : 'preview-only', revision, sourceHash: manifest.sourceHash,
      startedAt, completedAt: new Date().toISOString(), file: output, pose, requestedView: view, time,
      buildSeconds, frameSeconds, totalSeconds: (performance.now() - began) / 1000,
      runtime: { backend: runtime.backend, executablePath: runtime.executablePath, browserVersion: browser.version() },
      info, errors, processMemoryRssKiB: memory, notCertified: ['reference fidelity'] };
    if (mode !== 'original') report.diagnosticMaterialMode = mode;
    await writeFile(output + '.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
  }
  if (errors.length) process.exitCode = 1;
} finally { if (browser) await browser.close(); server.close(); }
