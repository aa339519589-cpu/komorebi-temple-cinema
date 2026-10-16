import {homedir} from 'node:os';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const root=resolve(new URL('..',import.meta.url).pathname);process.chdir(root);
const {server}=await import('./server.mjs'),{chromium}=await import(homedir()+'/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:homedir()+'/Library/Caches/ms-playwright/chromium-1187/chrome-mac/Chromium.app/Contents/MacOS/Chromium',args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--force-color-profile=srgb']});
const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1}),errors=[],external=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(`http://127.0.0.1:${process.env.PORT||4318}/`))external.push(r.url())});
await page.goto(`http://127.0.0.1:${process.env.PORT||4318}/render-v3.html?render=1&w=1600&h=900`,{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>window.temple?.ready,null,{timeout:240000});
for(const [suffix,time] of [['a',24],['b',24+1/3]]){
 await page.evaluate(t=>window.temple.renderShot(3,6,t),time);await page.screenshot({path:`qa/v3/architecture-stability-${suffix}.png`,type:'png'});
}
await page.evaluate(()=>window.temple.renderExposure(5,3.1,38.1,3,1/60));const a=await page.screenshot({path:'qa/v3/repeat-a.png',type:'png'});
await page.evaluate(()=>window.temple.renderExposure(0,3.1,3.1,3,1/60));
await page.evaluate(()=>window.temple.renderExposure(5,3.1,38.1,3,1/60));const b=await page.screenshot({path:'qa/v3/repeat-b.png',type:'png'});
await page.evaluate(()=>window.temple.renderView([0,78,8],[0,-.2,2],12));await page.screenshot({path:'qa/v3/ground-inspection.png',type:'png'});
const info=await page.evaluate(()=>window.temple.info()),cameras=await page.evaluate(()=>window.temple.auditCameras());
const glError=await page.evaluate(()=>window.temple.renderer.getContext().getError());
const shaders=await page.evaluate(()=>window.temple.renderer.info.programs.filter(p=>p.diagnostics?.runnable===false).map(p=>p.diagnostics));
const {stdout}=await promisify(execFile)(homedir()+'/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',['-c',`from PIL import Image,ImageChops
import json
a=Image.open('qa/v3/architecture-stability-a.png').convert('RGB').crop((0,0,1600,520))
b=Image.open('qa/v3/architecture-stability-b.png').convert('RGB').crop((0,0,1600,520))
d=ImageChops.difference(a,b)
d.save('qa/v3/architecture-stability-difference.png')
print(json.dumps({'inspectedRegion':[0,0,1600,520],'changedPixels':sum(px!=(0,0,0) for px in d.getdata()),'maxChannelDifference':max(x[1] for x in d.getextrema())}))`]);
const stability=JSON.parse(stdout),same=a.equals(b),source=JSON.parse(await readFile('qa/v3/frozen-manifest.json','utf8'));
const report={scope:'Frozen review snapshot: deterministic repeated exposure, stationary architecture over changing water time, shader validity, scene requests and generated-column clearance. This is not a certification of full-film quality or reference similarity.',createdAt:new Date().toISOString(),sourceHash:source.sourceHash,info,repeatExposureIdentical:same,repeatHash:createHash('sha256').update(a).digest('hex'),stationaryArchitecture:stability,glError,shaderErrors:shaders,consoleErrors:errors,externalSceneRequests:external,cameras,passed:same&&stability.changedPixels===0&&glError===0&&shaders.length===0&&errors.length===0&&external.length===0&&cameras.shots.every(s=>s.columnCollisions.length===0)};
await writeFile('qa/v3/scene-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,repeatExposureIdentical:same,stability,glError,errors,sourceHash:source.sourceHash},null,2));await browser.close();server.close();if(!report.passed)process.exitCode=1;
