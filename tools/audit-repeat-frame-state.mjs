import {mkdir} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const out='output/repeat-frame-audit';await mkdir(out,{recursive:true});
const report={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),events:[],frames:[],status:'building',width:960,height:960};
const save=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
const timer=setTimeout(()=>{report.status='hard-timeout';save();process.exit(2)},480000);
let browser,server;
try{
 const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);({server}=await import('./server.mjs'));
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});
 const page=await browser.newPage({viewport:{width:960,height:960},deviceScaleFactor:1});
 page.on('console',m=>{const e={type:m.type(),text:m.text().slice(0,4000)};report.events.push(e);console.log(JSON.stringify(e));save()});page.on('pageerror',e=>{report.events.push({error:String(e)});save()});
 await page.goto('http://127.0.0.1:4317/render-live.html?render&defer&w=960&h=960&scene=shared',{waitUntil:'load',timeout:240000});await page.waitForFunction(()=>window.temple?.ready,null,{timeout:240000});
 const cases=[{name:'first-reference'},{name:'explicit-identical'},{name:'two-draws-no-read',double:true},{name:'look-baseline',look:'baseline'},{name:'look-exposure',look:'exposure'},{name:'look-warm',look:'warmWindow'},{name:'look-luminous',look:'luminousWindow'},{name:'reset-and-warm',look:'warmWindow',reset:true}];
 for(const job of cases){
  if(job.look)await page.evaluate(async()=>{window.__study=await import('/src/reference6-lighting-study.js')});
  const data=await page.evaluate(j=>{
   const t=window.temple,r=t.renderer,g=r.getContext();
   if(j.reset){r.resetState();r.setRenderTarget(null);r.autoClear=true;r.setViewport(0,0,960,960);}
   let look=null;if(j.look)look=window.__study.applyReference6Look(t,j.look);
   const draw=()=>j.name==='explicit-identical'?t.renderView([-1.540726762,4.26,-2.375090396],[-1.540726762,6,-9.755090396],41.95,78):t.renderReference(6);
   if(j.double)draw();const pose=draw();g.finish();
   const prev=g.getParameter(g.FRAMEBUFFER_BINDING),bytes=new Uint8Array(960*960*4);g.bindFramebuffer(g.FRAMEBUFFER,null);
   try{g.readPixels(0,0,960,960,g.RGBA,g.UNSIGNED_BYTE,bytes)}finally{g.bindFramebuffer(g.FRAMEBUFFER,prev)}
   let sum=[0,0,0,0],max=0;for(let i=0;i<bytes.length;i+=4){for(let c=0;c<4;c++)sum[c]+=bytes[i+c];max=Math.max(max,bytes[i],bytes[i+1],bytes[i+2]);}
   let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
   return{name:j.name,pose,look,pixels:{mean:sum.map(v=>v/(960*960)),max,error:g.getError()},rgba:btoa(binary),attributes:g.getContextAttributes(),renderToScreen:t.composer.renderToScreen,autoClear:r.autoClear,target:r.getRenderTarget()?.texture?.name||null,viewport:Array.from(g.getParameter(g.VIEWPORT)),scissor:g.getParameter(g.SCISSOR_TEST),colorMask:g.getParameter(g.COLOR_WRITEMASK),info:t.info().lastFrameStats};
  },job);
  const rgba=Buffer.from(data.rgba,'base64');delete data.rgba;data.file=job.name+'.rgba';writeFileSync(out+'/'+data.file,rgba);report.frames.push(data);save();console.log('FRAME '+JSON.stringify(data));
 }
 report.status='inspected';
}catch(e){report.error=String(e.stack||e);report.status='failed';process.exitCode=1}finally{save();clearTimeout(timer);server?.close();setTimeout(()=>process.exit(process.exitCode||0),5000).unref();if(browser)await browser.close().catch(()=>{})}
