/**
 * Dedicated reference-4 camera-B memory diagnostic.
 * All geometry stays intact; only QA-only render targets and shadow texture
 * sizes are reduced on the ephemeral runner by prepare-site-mode.mjs.
 * Source scene, film cameras, existing frames, and material files are untouched.
 */
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const id='b-complete-roof-lowmem';
const size=512; // 512 output, unchanged original camera parameters.
const view=Object.freeze({id:'b-complete-roof',position:[-1.540726762,1.2,28],target:[-1.540726762,6.5,-7.115090396],fov:54,time:24.5});
const dir='output/reference4-b-lowmem';
await mkdir(dir,{recursive:true});
const sha256=b=>createHash('sha256').update(b).digest('hex');
const sourceFiles={};
for(const f of (await readdir('src')).filter(v=>v.endsWith('.js')).sort())sourceFiles['src/'+f]=sha256(await readFile('src/'+f));
const sourceHash=sha256(JSON.stringify(sourceFiles));
const reference='references/hd/3-照片-4.jpg';
const report={id,view,size,status:'starting',originalGeometryPreserved:true,qaOnlyMemoryBudget:true,referenceSimilarityAccepted:false,sourceHash,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),photoSha256:sha256(await readFile(reference)),startedAt:new Date().toISOString(),errors:[],warnings:[]};
const save=()=>writeFile(dir+'/report.json',JSON.stringify(report,null,2));
await save();
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const {server}=await import('./server.mjs');
let browser,page;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});
 report.browser=browser.version();
 page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('crash',()=>report.errors.push('Browser renderer crashed'));
 page.on('console',m=>{const msg=m.text();if(m.type()==='error')report.errors.push(msg);else if(m.type()==='warning')report.warnings.push(msg);if(m.type()==='error'||m.type()==='warning')console.log('browser:',m.type(),msg.slice(0,500))});
 await page.route('**/*',route=>{const u=new URL(route.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?route.continue():route.abort('blockedbyclient')});
 report.status='building';await save();
 await page.goto('http://127.0.0.1:4317/site-production.html?w=512&h=512&scope=site&scene=shared&reference=4',{waitUntil:'load',timeout:300000});
 await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});
 report.preflight=await page.evaluate(v=>{
  const p=window.production,gl=p.renderer.getContext();
  p.renderer.resetState=()=>{};
  p.world.update(v.time);
  p.renderer.shadowMap.needsUpdate=true;
  return{info:p.info(),memory:{maxTextureSize:gl.getParameter(gl.MAX_TEXTURE_SIZE),maxRenderbufferSize:gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),maxVertexTextureUnits:gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)},errorAfterBootstrap:gl.getError()};
 },view);
 report.status='rendering';await save();
 const result=await page.evaluate(v=>{const p=window.production;return {...p.capture(v),info:p.info()}},view);
 const png=Buffer.from(result.png.split(',')[1],'base64');
 delete result.png;
 const expected=Buffer.from([137,80,78,71,13,10,26,10]);
 if(png.length<30000||!png.subarray(0,8).equals(expected))throw Error('Failed to get actual GPU image bytes');
 if(result.glError||result.info.contextLost||result.pixels.nonzero<size*size*.75||!result.info.programs.every(x=>x.linked))throw Error('Render did not pass GL/context/pixel validation');
 if(report.errors.length||report.warnings.some(w=>/OUT_OF_MEMORY|buffer is not big enough|INVALID_OPERATION/.test(w)))throw Error('GPU errors during render; refuse to accept pixels');
 report.status='validating';report.frame=result;await save();
 const file=dir+'/native-b-512.png';
 await writeFile(file,png);report.pngSha256=sha256(png);report.pngBytes=png.length;
 const comparison=dir+'/reference-left-native-b-512-right.png';
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',reference,'-i',file,'-filter_complex','[0:v]scale=512:512[a];[a][1:v]hstack[out]','-map','[out]','-frames:v','1',comparison],{timeout:60000});
 report.nativeFile=file;report.comparison=comparison;report.status='real-WebGL-validated';
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1}
finally{
 report.finishedAt=new Date().toISOString();await save();console.log(JSON.stringify({status:report.status,id,glError:report.frame?.glError,bytes:report.pngBytes,error:report.error||null}));
 if(page)await page.close().catch(()=>{});if(browser)await browser.close().catch(()=>{});server.close();
}
