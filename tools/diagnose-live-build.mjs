import {mkdir,writeFile,appendFile,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const out='output/live-build-diagnostic';await mkdir(out,{recursive:true});
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);const {server}=await import('./server.mjs');
const report={startedAt:new Date().toISOString(),commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),events:[],status:'starting',ownerMac:false};
const save=()=>writeFile(out+'/report.json',JSON.stringify(report,null,2));
let browser,page;
const log=(type,message)=>{const event={at:new Date().toISOString(),type,message};report.events.push(event);console.log(JSON.stringify(event));appendFile(out+'/events.ndjson',JSON.stringify(event)+'\n').catch(()=>{});save().catch(()=>{});};
const timer=setTimeout(()=>{report.status='hard-timeout';save().finally(()=>process.exit(124));},540000);
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});
 page=await browser.newPage({viewport:{width:320,height:320}});
 let fail;const fatal=new Promise((_,reject)=>{fail=reject});fatal.catch(()=>{});
 page.on('pageerror',e=>{log('pageerror',String(e.stack||e));fail(e)});page.on('crash',()=>{log('crash','Renderer page crashed');fail(Error('Page crashed'))});page.on('console',m=>log(m.type(),m.text().slice(0,3000)));
 await page.route('**/wrapper-smoke.html',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><link rel="icon" href="data:,"><script type="importmap">{"imports":{"three":"/src/three-render-compat.js","three/addons/":"/vendor/examples/jsm/"}}</script></head><body><script type="module">import * as T from 'three';const r=new T.WebGLRenderer({preserveDrawingBuffer:true});r.setSize(32,32);document.body.append(r.domElement);const s=new T.Scene(),c=new T.PerspectiveCamera(45,1,.1,10);c.position.z=3;s.add(new T.Mesh(new T.SphereGeometry(.8,12,8),new T.MeshStandardMaterial({color:0xd9ad60})));s.add(new T.HemisphereLight(0xffffff,0x555555,2));r.render(s,c);r.getContext().finish();window.smoke={revision:T.REVISION,atlas:r.brdfLookupAtlasInfo(),error:r.getContext().getError()};r.dispose();r.forceContextLoss();</script></body></html>`}));
 await Promise.race([page.goto('http://127.0.0.1:4317/wrapper-smoke.html',{waitUntil:'load',timeout:45000}),fatal]);
 await Promise.race([page.waitForFunction(()=>window.smoke,null,{timeout:45000}),fatal]);report.smoke=await page.evaluate(()=>window.smoke);log('smoke',report.smoke);
 if(report.smoke.error)throw Error('Wrapper smoke GL error');
 await page.close();page=await browser.newPage({viewport:{width:320,height:320}});
 page.on('pageerror',e=>{log('pageerror',String(e.stack||e));fail(e)});page.on('crash',()=>{log('crash','Scene page crashed');fail(Error('Scene page crashed'))});page.on('console',m=>log(m.type(),m.text().slice(0,3000)));
 report.status='building';await save();
 await Promise.race([page.goto('http://127.0.0.1:4317/render-live.html?render=1&defer=1&w=320&h=320&scene=shared',{waitUntil:'load',timeout:300000}),fatal]);
 await Promise.race([page.waitForFunction(()=>window.temple?.ready,null,{timeout:300000}),fatal]);
 report.info=await page.evaluate(()=>window.temple.info());log('scene-ready',{gpu:report.info.gpu,triangles:report.info.triangles});report.status='rendering';await save();
 await Promise.race([page.evaluate(()=>{window.temple.renderReference(6);window.temple.renderer.getContext().finish()}),fatal,new Promise((_,reject)=>setTimeout(()=>reject(Error('Frame timed out')),180000))]);
 await page.locator('canvas').first().screenshot({path:out+'/sanctuary-320.png',timeout:45000});report.info=await page.evaluate(()=>window.temple.info());report.status='rendered';
}catch(e){report.status='failed';report.error=String(e.stack||e);log('failure',report.error);process.exitCode=1;}finally{clearTimeout(timer);report.finishedAt=new Date().toISOString();await save();console.log(JSON.stringify(report));const cleanup=setTimeout(()=>process.exit(process.exitCode||0),8000);if(browser)await browser.close().catch(()=>{});server.close();clearTimeout(cleanup)}
