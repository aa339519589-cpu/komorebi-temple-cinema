import {mkdir,readFile,writeFile,readdir,access} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {launchRenderBrowser} from './render-runtime.mjs';
import {encodeWebglPng} from './encode-webgl-png.mjs';

const reference=Number(process.env.REFERENCE),id=String(reference).padStart(2,'0');
if(!Number.isInteger(reference)||reference<1||reference>10)throw Error('REFERENCE must be 1..10.');
const worktree=resolve(process.env.WORKTREE||`/Users/mima1234/temple-scene-${id}`),size=Number(process.env.SIZE||768);
const iteration=process.env.ITERATION||'01',port=Number(process.env.PORT||4500);
const entry=`reconstructions/scene-${id}/index.html`,out=resolve(worktree,`qa/ten-reference/${id}/iteration-${iteration}`);
await access(resolve(worktree,entry));await mkdir(out,{recursive:true});
async function sourceIdentity(){
 const files=[];async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=resolve(dir,e.name);if(e.isDirectory())await walk(p);else if(/\.(?:m?js|html|json)$/.test(e.name))files.push(p);}}
 await walk(resolve(worktree,`reconstructions/scene-${id}`));files.sort();const h=createHash('sha256'),hashes={};
 for(const file of files){const name=relative(worktree,file),bytes=await readFile(file);hashes[name]=createHash('sha256').update(bytes).digest('hex');h.update(name+'\0');h.update(bytes);h.update('\0');}
 return{hash:h.digest('hex'),files:hashes};
}
const identity=await sourceIdentity(),startedAt=new Date().toISOString();
const report={reference,entry,worktree,size,startedAt,source:identity,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:worktree,encoding:'utf8'}).trim(),status:'building',visualAccepted:false,errors:[],requests:[]};
const server=spawn(process.execPath,[resolve(worktree,'tools/server.mjs')],{cwd:worktree,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
const serverReady=new Promise((yes,no)=>{server.stdout.on('data',b=>{if(b.toString().includes('http://'))yes();});server.on('error',no);server.on('exit',c=>no(Error('Preview server exited '+c)));});
let browser;
try{
 await serverReady;const runtime=await launchRenderBrowser();browser=runtime.browser;report.backend=runtime.backend;
 const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
 let fail;const fatal=new Promise((_,reject)=>fail=reject);fatal.catch(()=>{});
 page.on('pageerror',e=>{report.errors.push(String(e));fail(e);});
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());console.log(id,m.type(),m.text().slice(0,350));});
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.pathname==='/favicon.ico')return route.fulfill({status:204,body:''});
  if(u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port===String(port))){if(u.protocol!=='data:')report.requests.push(u.pathname);return route.continue();}
  report.errors.push('Blocked external scene resource: '+u.origin);return route.abort('blockedbyclient');
 });
 await Promise.race([page.goto(`http://127.0.0.1:${port}/${entry}?render&defer&w=${size}&h=${size}`,{waitUntil:'load',timeout:600000}),fatal]);
 await Promise.race([page.waitForFunction(()=>window.temple?.ready&&typeof window.temple.renderReference==='function',null,{timeout:600000}),fatal]);
 const frames=process.env.SHOT_TIMES?process.env.SHOT_TIMES.split(',').map(Number):[null];
 report.frames=[];
 for(const localTime of frames){
  const result=await Promise.race([page.evaluate(({reference,localTime})=>{
   const t=window.temple,r=t.renderer,gl=r.getContext();
   const pose=localTime===null?t.renderReference(reference):t.renderShot(localTime);gl.finish();
   const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight,bytes=new Uint8Array(width*height*4);
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
   const glError=gl.getError(),programs=r.info.programs.map(p=>({linked:gl.getProgramParameter(p.program,gl.LINK_STATUS),log:gl.getProgramInfoLog(p.program)}));let binary='';
   for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
   return{pose,width,height,glError,programs,contextLost:gl.isContextLost(),rgbaBase64:btoa(binary),info:t.info()};
  },{reference,localTime}),fatal]);
  const bytes=Buffer.from(result.rgbaBase64,'base64');delete result.rgbaBase64;
  let nonblack=0,opaque=0;for(let i=0;i<bytes.length;i+=4){if(Math.max(bytes[i],bytes[i+1],bytes[i+2])>3)nonblack++;if(bytes[i+3]===255)opaque++;}
  const valid=result.glError===0&&!result.contextLost&&result.programs.every(p=>p.linked)&&nonblack>size*size*.05&&report.errors.length===0;
  const name=localTime===null?'reference':`shot-${String(localTime).replace('.','p')}`;
  if(valid)await writeFile(resolve(out,name+'.png'),encodeWebglPng(result.width,result.height,bytes));
  report.frames.push({...result,name,localTime,valid,nonblackFraction:nonblack/(size*size),opaqueFraction:opaque/(size*size),rgbaSha256:createHash('sha256').update(bytes).digest('hex')});
  if(!valid)throw Error('Actual GPU frame failed: '+name);
 }
 if((await sourceIdentity()).hash!==identity.hash)throw Error('Scene source changed during render.');
 report.status='rendered-review';
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;}
finally{
 report.completedAt=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');
 console.log(JSON.stringify({reference,status:report.status,error:report.error,out,errors:report.errors}));
}
