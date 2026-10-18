import {mkdir,writeFile} from 'node:fs/promises';
import {launchRenderBrowser} from './render-runtime.mjs';
import {acquireGpuRenderSlot} from './gpu-render-slot.mjs';
import {execFileSync} from 'node:child_process';
const out='qa/ten-reference/review-ui';await mkdir(out,{recursive:true});
const releaseGpu=await acquireGpuRenderSlot('ten-reference-live-ui');
const runtime=await launchRenderBrowser(),browser=runtime.browser;
const report={startedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:'checking',scope:'All ten live review entries, genuine framebuffer, browser errors and photo isolation. This is not image-fidelity acceptance.',visualAccepted:false,frames:[],errors:[],forbiddenScenePhotoRequests:[]};
try{
 const page=await browser.newPage({viewport:{width:1600,height:1100},deviceScaleFactor:1});page.setDefaultTimeout(240000);
 let rejectFatal;const fatal=new Promise((_,reject)=>rejectFatal=reject);fatal.catch(()=>{});
 page.on('pageerror',e=>{report.errors.push(String(e));rejectFatal(e);});
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 page.on('request',r=>{if(/\/references\//.test(r.url())&&r.frame()!==page.mainFrame())report.forbiddenScenePhotoRequests.push(r.url());});
 await Promise.race([page.goto(`http://127.0.0.1:${process.env.PORT||4318}/compare-ten.html?reference=4`,{waitUntil:'load',timeout:240000}),fatal]);
 await Promise.race([page.waitForFunction(()=>window.referenceReview?.state.ready,null,{timeout:240000}),fatal]);
 for(const reference of [4,1,2,3,5,6,7,8,9,10]){
  if(reference!==4)await Promise.race([page.evaluate(index=>window.referenceReview.select(index),reference-1),fatal]);
  await Promise.race([page.waitForFunction(n=>window.referenceReview.state.ready&&window.referenceReview.state.reference===n,reference,{timeout:240000}),fatal]);
  const frame=await page.evaluate(reference=>{
   const review=window.referenceReview,child=document.getElementById('scene').contentWindow,t=child.temple;
   if(!review.state.ready||review.state.reference!==reference||review.state.error)throw Error('Review entry not ready '+reference);
   t.renderReference(reference);const r=t.renderer,g=r.getContext();g.finish();const pixels=new Uint8Array(g.drawingBufferWidth*g.drawingBufferHeight*4);g.readPixels(0,0,g.drawingBufferWidth,g.drawingBufferHeight,g.RGBA,g.UNSIGNED_BYTE,pixels);
   let nonblack=0;for(let i=0;i<pixels.length;i+=4)if(Math.max(pixels[i],pixels[i+1],pixels[i+2])>3)nonblack++;
   return{reference,width:g.drawingBufferWidth,height:g.drawingBufferHeight,glError:g.getError(),contextLost:g.isContextLost(),nonblackFraction:nonblack/(pixels.length/4),programsLinked:r.info.programs.every(p=>g.getProgramParameter(p.program,g.LINK_STATUS)),status:document.getElementById('status').textContent};
  },reference);
  if(frame.glError||frame.contextLost||!frame.programsLinked||frame.nonblackFraction<.05)throw Error('Invalid review framebuffer '+reference);
  report.frames.push(frame);if([4,6,10].includes(reference))await page.screenshot({path:`${out}/reference-${String(reference).padStart(2,'0')}.png`,fullPage:true,timeout:120000});
  console.log(JSON.stringify({event:'review-entry-checked',...frame}));
 }
 if(report.errors.length||report.forbiddenScenePhotoRequests.length)throw Error('Review contains runtime errors or a scene attempted to load a reference photograph.');
 report.status='runtime-checked';
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;}
finally{report.completedAt=new Date().toISOString();await writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();releaseGpu();console.log(JSON.stringify({status:report.status,entries:report.frames.length,error:report.error,errors:report.errors}));}
