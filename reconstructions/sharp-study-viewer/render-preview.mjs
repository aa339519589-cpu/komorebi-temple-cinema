import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,dirname,relative,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {acquireGpuRenderSlot} from '../../tools/gpu-render-slot.mjs';
import {launchRenderBrowser} from '../../tools/render-runtime.mjs';
import {encodeWebglPng} from '../../tools/encode-webgl-png.mjs';

const viewer=dirname(fileURLToPath(import.meta.url)),root=resolve(viewer,'../..');
const id=String(process.env.SCENE??'01').padStart(2,'0');
if(!/^\d{2}$/.test(id))throw Error('SCENE must be a two-digit scene number.');
const studies=resolve(process.env.STUDY_ROOT??process.env.SHARP_STUDY_ROOT??resolve(root,'output/depth-field-v02'));
const rawPrefix=process.env.META_PREFIX??process.env.STUDY_PREFIX??`/output/${basename(studies)}/`;
const prefix='/'+rawPrefix.replace(/^\/+|\/+$/g,'')+'/';
const metadata=resolve(studies,id,process.env.METADATA??'viewer.json');
const rec=JSON.parse(await readFile(metadata,'utf8'));
const width=Number(rec.intrinsics?.width??rec.image?.width??rec.width);
const height=Number(rec.intrinsics?.height??rec.image?.height??rec.height);
if(!(width>0&&height>0))throw Error('Metadata must give source image dimensions.');
const size=Number(process.env.SIZE??1254),w=Math.round(size),h=Math.round(size*height/width);
const iteration=process.env.ITERATION??'preview01';
if(!/^[a-z0-9-]+$/i.test(iteration))throw Error('Invalid iteration name.');
const out=resolve(process.env.PREVIEW_OUTPUT??process.env.SHARP_PREVIEW_OUTPUT??resolve(studies,id,'viewer-'+iteration));
await mkdir(out,{recursive:true});
const modelURL=rec.model?.url??rec.model?.ply??rec.ply??rec.plyUrl;
const model=modelURL?.startsWith(prefix)?resolve(studies,modelURL.slice(prefix.length)):resolve(dirname(metadata),modelURL??'');
async function hashFile(file){const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex');}
const release=await acquireGpuRenderSlot(`gaussian-${basename(studies)}-${id}-${iteration}`);
let browser,server;
const report={kind:'actual-3d-gaussian-viewer-frames',dataset:basename(studies),metadataPrefix:prefix,scene:id,iteration,startedAt:new Date().toISOString(),visualAccepted:false,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),width:w,height:h,frames:[],errors:[],requests:[]};
try {
  report.model={file:model,sha256:await hashFile(model)};
  report.metadata={file:metadata,sha256:await hashFile(metadata),data:rec};
  const files=[];
  async function visit(dir){for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.name==='review'||entry.name.startsWith('.'))continue;const path=resolve(dir,entry.name);if(entry.isDirectory())await visit(path);else if(/\.(js|mjs|css|html|json|map)$/.test(entry.name)||entry.name.includes('LICENSE'))files.push(path);}}
  await visit(viewer);
  files.push(resolve(root,'vendor/build/three.module.js'),resolve(root,'vendor/build/three.core.js'),resolve(root,'vendor/examples/jsm/postprocessing/Pass.js'));
  report.rendererSource=await Promise.all(files.sort().map(async file=>({file:relative(root,file),sha256:await hashFile(file)})));
  const identity=createHash('sha256').update(JSON.stringify(report.rendererSource)).digest('hex');report.rendererSourceHash=identity;
  const port=Number(process.env.PORT??4521);
  server=spawn(process.execPath,[resolve(viewer,'server.mjs')],{cwd:root,env:{...process.env,STUDY_ROOT:studies,META_PREFIX:prefix,PORT:String(port)},stdio:['ignore','pipe','pipe']});
  await new Promise((yes,no)=>{server.once('error',no);server.once('exit',code=>no(Error('Viewer server exited '+code)));server.stdout.on('data',data=>{if(data.toString().includes('http://'))yes();});server.stderr.on('data',data=>process.stderr.write(data));});
  const runtime=await launchRenderBrowser();browser=runtime.browser;report.backend=runtime.backend;
  const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
  page.on('pageerror',error=>report.errors.push(String(error)));
  page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());console.log(message.type(),message.text().slice(0,600));});
  page.on('response',response=>{if(response.status()>=400)report.errors.push(`HTTP ${response.status()} ${response.url()}`);});
  await page.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.protocol==='data:'||(u.protocol==='blob:'&&u.origin===`http://127.0.0.1:${port}`)||(u.hostname==='127.0.0.1'&&u.port===String(port))){if(!['data:','blob:'].includes(u.protocol))report.requests.push(u.pathname);return route.continue();}
    report.errors.push('External renderer request blocked: '+u.origin);return route.abort('blockedbyclient');
  });
  const meta=`${prefix}${id}/${process.env.METADATA??'viewer.json'}`;
  await page.goto(`http://127.0.0.1:${port}/reconstructions/sharp-study-viewer/index.html?capture&meta=${encodeURIComponent(meta)}&w=${w}&h=${h}`,{waitUntil:'load',timeout:600000});
  await page.waitForFunction(()=>window.temple?.ready||window.temple?.error,null,{timeout:600000});
  await page.evaluate(async()=>{await window.temple.readyPromise;});
  const poses=process.env.SHOT_TIMES?process.env.SHOT_TIMES.split(',').map(value=>{const time=Number(value);if(!Number.isFinite(time)||time<0||time>7)throw Error('SHOT_TIMES must be within0..7.');return{name:'shot-'+String(time).replace('.','p'),time};}):(process.env.POSES??'source,left,right').split(',').map(name=>({name,time:null}));
  report.cameraMode=process.env.SHOT_TIMES?'deterministic forward-dolly-to-source':'explicit research inspection presets';
  for(const frame of poses){
    const {name,time}=frame;
    const result=await page.evaluate(async ({name,time})=>{
      const t=window.temple;const pose=time===null?await t.renderPreset(name):await t.renderShot(time);const gl=t.renderer.getContext();gl.finish();gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight,rgba=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
      let binary='';for(let j=0;j<rgba.length;j+=16384)binary+=String.fromCharCode(...rgba.subarray(j,j+16384));
      return{pose,width,height,glError:gl.getError(),contextLost:gl.isContextLost(),info:t.info(),pixels:btoa(binary)};
    },frame);
    const pixels=Buffer.from(result.pixels,'base64');delete result.pixels;
    await writeFile(resolve(out,name+'.png'),encodeWebglPng(result.width,result.height,pixels));
    report.frames.push({name,time,...result,rgbaSha256:createHash('sha256').update(pixels).digest('hex')});
    console.log(JSON.stringify({event:'gaussian-frame-rendered',name,position:result.pose.position,out}));
    if(result.glError||result.contextLost||report.errors.length)throw Error(`Actual Gaussian frame ${name} failed: ${report.errors.join('; ')}`);
  }
  report.status='rendered-for-visual-review';
}catch(error){report.status='failed';report.error=String(error.stack??error);process.exitCode=1;}
finally{report.completedAt=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));if(browser)await browser.close().catch(()=>{});server?.kill('SIGTERM');release();console.log(JSON.stringify({status:report.status,out,error:report.error}));}
