import {mkdir,writeFile} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const out='output/repeat-frame-audit';await mkdir(out,{recursive:true});
const report={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),events:[],status:'building'};
const save=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
const timer=setTimeout(()=>{report.status='hard-timeout';save();process.exit(2)},480000);
let browser,server;
try{
 const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);({server}=await import('./server.mjs'));
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});
 const page=await browser.newPage({viewport:{width:480,height:480},deviceScaleFactor:1});
 page.on('console',m=>{const e={type:m.type(),text:m.text().slice(0,4000)};report.events.push(e);console.log(JSON.stringify(e));save()});page.on('pageerror',e=>{report.events.push({error:String(e)});save()});
 await page.goto('http://127.0.0.1:4317/render-live.html?render&defer&w=480&h=480&scene=shared',{waitUntil:'load',timeout:240000});await page.waitForFunction(()=>window.temple?.ready,null,{timeout:240000});
 report.frames=await page.evaluate(()=>{
  const t=window.temple,r=t.renderer,g=r.getContext(),frames=[];
  const read=()=>{const prev=g.getParameter(g.FRAMEBUFFER_BINDING),bytes=new Uint8Array(480*480*4);g.bindFramebuffer(g.FRAMEBUFFER,null);try{g.readPixels(0,0,480,480,g.RGBA,g.UNSIGNED_BYTE,bytes)}finally{g.bindFramebuffer(g.FRAMEBUFFER,prev)}let sum=[0,0,0,0],max=0;for(let i=0;i<bytes.length;i+=4){for(let c=0;c<4;c++)sum[c]+=bytes[i+c];max=Math.max(max,bytes[i],bytes[i+1],bytes[i+2]);}return{mean:sum.map(v=>v/(480*480)),max,error:g.getError()};};
  for(const mode of ['first','repeat','shadows-every-frame','different-time','renderer-reset']){
   if(mode==='shadows-every-frame')r.shadowMap.autoUpdate=true;
   if(mode==='renderer-reset'){r.resetState();r.setRenderTarget(null);r.autoClear=true;r.setViewport(0,0,480,480);}
   const pose=mode==='different-time'?t.renderView([-1.540726762,4.26,-2.375090396],[-1.540726762,6,-9.755090396],41.951,78):t.renderReference(6);
   g.finish();const pixels=read();const data={mode,pose,pixels,renderToScreen:t.composer.renderToScreen,autoClear:r.autoClear,shadowAuto:r.shadowMap.autoUpdate,shadowNeeds:r.shadowMap.needsUpdate,target:r.getRenderTarget()?.texture?.name||null,viewport:Array.from(g.getParameter(g.VIEWPORT)),scissor:g.getParameter(g.SCISSOR_TEST),colorMask:g.getParameter(g.COLOR_WRITEMASK),passes:t.composer.passes.map(p=>({name:p.constructor.name,enabled:p.enabled,screen:p.renderToScreen,swap:p.needsSwap})),info:t.info().lastFrameStats};frames.push(data);console.info('REPEAT_FRAME '+JSON.stringify(data));
  }
  return frames;
 });report.status='inspected';
}catch(e){report.error=String(e.stack||e);report.status='failed';process.exitCode=1}finally{save();clearTimeout(timer);server?.close();setTimeout(()=>process.exit(process.exitCode||0),5000).unref();if(browser)await browser.close().catch(()=>{})}
