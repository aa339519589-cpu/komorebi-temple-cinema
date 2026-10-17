/** Pixel-identical native HDR-target reuse audit, before enabling motion optimization. */
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const out='output/target-reuse-audit';await mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const {server}=await import('./server.mjs');let browser,report={status:'starting',modes:[],startedAt:new Date().toISOString()};
const poses=[
 {position:[-1.540726762,4.26,-2.375090396],target:[-1.540726762,6,-9.755090396],fov:78,time:41.95},
 {position:[-2.140726762,4.36,-1.975090396],target:[-1.540726762,6,-9.755090396],fov:78,time:41.95},
 {position:[-1.540726762,4.26,-2.375090396],target:[-1.540726762,6,-9.755090396],fov:78,time:41.95}
];
const config={exposure:1.4,environmentGain:1,metalGain:1.1,sunGain:1.6,practicalGain:1.35,floorLod:.6,floorStrength:1.1,hazeGain:.25,redWood:true,warmTimber:true,giltColor:'#c58b29',agedGoldColor:'#815021',statueGoldColor:'#b98021',backingColor:'#81421b',metalRoughnessGain:.88,key:7,rim:2,front:1};
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog']});
 for(const reuse of [false,true]){
  const page=await browser.newPage({viewport:{width:640,height:640}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route('**/*',r=>{const u=new URL(r.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?r.continue():r.abort('blockedbyclient')});
  await page.goto('http://127.0.0.1:4317/sanctuary-production.html?w=640&h=640&scope=interior'+(reuse?'&reuseTargets=1':''),{waitUntil:'load',timeout:300000});
  await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});
  await page.evaluate(c=>window.production.configure(c),config);
  const mode={reuse,info:await page.evaluate(()=>window.production.info()),frames:[],errors};
  for(let i=0;i<poses.length;i++){
   const x=await page.evaluate(p=>{const t=window.production;const f=t.capture(p);return{png:f.png,pixels:f.pixels,seconds:f.seconds,glError:f.glError,targetState:f.targetState,info:t.info()}},poses[i]);
   const bytes=Buffer.from(x.png.split(',')[1],'base64');await writeFile(out+'/'+(reuse?'reuse':'baseline')+'-'+i+'.png',bytes);
   mode.frames.push({pose:poses[i],sha256:sha(bytes),bytes:bytes.length,pixels:x.pixels,seconds:x.seconds,glError:x.glError,targetState:x.targetState,contextLost:x.info.contextLost,shaderLinked:x.info.programs.every(q=>q.linked)});
  }
  mode.valid=mode.frames.every(x=>x.bytes>20000&&x.glError===0&&!x.contextLost&&x.shaderLinked&&x.pixels.nonzero>400000)&&mode.frames[0].sha256===mode.frames[2].sha256&&mode.frames[0].sha256!==mode.frames[1].sha256&&!errors.length;
  report.modes.push(mode);await page.close();
 }
 const a=report.modes[0],b=report.modes[1];report.pixelIdentity=a.frames.every((f,i)=>f.sha256===b.frames[i].sha256);
 report.speedupFactor=a.frames.slice(1).reduce((s,f)=>s+f.seconds,0)/b.frames.slice(1).reduce((s,f)=>s+f.seconds,0);
 report.passed=a.valid&&b.valid&&report.pixelIdentity&&report.speedupFactor>0;
 report.status=report.passed?'passed':'failed';if(!report.passed)process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;}finally{report.completedAt=new Date().toISOString();await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,error:report.error,pixelIdentity:report.pixelIdentity,speedup:report.speedupFactor,modes:report.modes.map(x=>({reuse:x.reuse,valid:x.valid,frames:x.frames.map(f=>f.sha256)}))}));if(browser)await browser.close().catch(()=>{});server.close()}
