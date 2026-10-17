import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out='output/production';await mkdir(out,{recursive:true});
const request=existsSync('tools/production-request.json')?JSON.parse(await readFile('tools/production-request.json','utf8')):{label:'native-sanctuary-r1',width:640,height:640,jobs:[{id:'sanctuary-native-baseline',reference:6}]};
let sourceCommit='unavailable';try{sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()}catch{}
const report={request,sourceCommit,startedAt:new Date().toISOString(),status:'running',errors:[],frames:[],referenceFidelityAccepted:false};
const save=()=>writeFile(out+'/report.json',JSON.stringify(report,null,2));await save();
const spec=process.env.PLAYWRIGHT_MODULE||'playwright';const {chromium}=await import(spec.startsWith('/')?pathToFileURL(spec).href:spec);const {server}=await import('./server.mjs');let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--force-color-profile=srgb']});
 const page=await browser.newPage({viewport:{width:request.width,height:request.height},deviceScaleFactor:1});
 page.on('pageerror',e=>{report.errors.push(String(e));console.error(e)});page.on('console',m=>{console.log(m.type(),m.text().slice(0,1800));if(m.type()==='error')report.errors.push(m.text())});
 await page.goto(`http://127.0.0.1:4317/sanctuary-production.html?w=${request.width}&h=${request.height}&scope=${request.scope||'interior'}`,{waitUntil:'load',timeout:300000});
 await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});
 await page.evaluate(policy=>{
  const p=window.production,r=p.renderer,gl=r.getContext();window.frameTrace=[];
  if(policy?.noReset)r.resetState=()=>{};
  if(policy?.updateShadows)Object.defineProperty(r.shadowMap,'autoUpdate',{configurable:true,get:()=>true,set:()=>{}});
  const render=r.render.bind(r);let depth=0;
  r.render=(scene,camera)=>{const current=depth++;const before={depth:current,scene:scene.name||scene.type,camera:camera.position.toArray(),target:r.getRenderTarget()?.texture.uuid??null,viewport:Array.from(gl.getParameter(gl.VIEWPORT)),scissor:Array.from(gl.getParameter(gl.SCISSOR_BOX)),draw:!!gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING),rasterDiscard:gl.isEnabled(gl.RASTERIZER_DISCARD),colorMask:Array.from(gl.getParameter(gl.COLOR_WRITEMASK)),visible:scene.visible};const t=performance.now();try{return render(scene,camera)}finally{depth--;window.frameTrace.push({...before,ms:performance.now()-t,render:{...r.info.render},error:gl.getError()});}};
 },request.framePolicy||{});
 const inventory=await page.evaluate(()=>{const p=window.production,lights=[],materials=new Map(),groups=[];p.scene.traverse(o=>{if(o.isLight)lights.push({name:o.name,type:o.type,intensity:o.intensity,color:o.color.getHexString(),position:o.position.toArray(),world:o.getWorldPosition(new p.T.Vector3()).toArray(),shadow:o.castShadow});if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&!materials.has(m.uuid))materials.set(m.uuid,{name:m.name,type:m.type,color:m.color?.getHexString(),metalness:m.metalness,roughness:m.roughness,envMapIntensity:m.envMapIntensity,emissive:m.emissive?.getHexString(),emissiveIntensity:m.emissiveIntensity});}if(o.isGroup&&o.name)groups.push({name:o.name,position:o.position.toArray(),children:o.children.length});});return{lights,materials:[...materials.values()],groups,hallMatrix:p.world.hallMatrix.elements,worldKeys:Object.keys(p.world),lightingKeys:Object.keys(p.world.restorationLighting)}});
 await writeFile(out+'/scene-inventory.json',JSON.stringify(inventory,null,2));
 const refs={1:'0-照片-1.jpg',2:'1-照片-2.jpg',3:'2-照片-3.jpg',4:'3-照片-4.jpg',5:'5-照片-6.jpg',6:'4-照片-5.jpg',7:'6-照片-7.jpg',8:'7-照片-8.jpg',9:'8-照片-9.jpg',10:'9-照片-10.jpg'};
 for(const job of request.jobs){
  if(!/^[a-z0-9-]+$/.test(job.id))throw Error('Invalid frame id');
  const frame=await page.evaluate(async j=>{await new Promise(resolve=>requestAnimationFrame(()=>resolve()));window.frameTrace=[];const p=window.production;if(j.config&&p.configure)p.configure(j.config);const frame=p.capture(j.camera||p.getReferenceView(j.reference||6));frame.drawTrace=window.frameTrace;return frame;},job);
  const bytes=Buffer.from(frame.png.split(',')[1],'base64');delete frame.png;await writeFile(`${out}/${job.id}.png`,bytes);frame.id=job.id;frame.sha256=createHash('sha256').update(bytes).digest('hex');frame.bytes=bytes.length;
  const previous=report.frames.at(-1);frame.poseChanged=previous?JSON.stringify(previous.pose)!==JSON.stringify(frame.pose):null;frame.identicalToPrevious=previous?.sha256===frame.sha256;
  report.frames.push(frame);report.info=await page.evaluate(()=>window.production.info());await save();
  if(frame.pixels.max<=3||frame.pixels.nonzero<frame.pixels.total*.2||frame.glError||report.info.contextLost||report.info.programs.some(p=>!p.linked)||frame.poseChanged&&frame.identicalToPrevious)throw Error('Frame validation failed: '+job.id);
  const ref='references/hd/'+refs[job.reference||6];
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',ref,'-i',`${out}/${job.id}.png`,'-filter_complex',`[0:v]scale=${request.width}:${request.height}:force_original_aspect_ratio=decrease,pad=${request.width}:${request.height}:(ow-iw)/2:(oh-ih)/2:black[a];[a][1:v]hstack[out]`,'-map','[out]','-frames:v','1',`${out}/${job.id}-comparison.png`]);
  console.log(JSON.stringify({frame:job.id,pixels:frame.pixels,seconds:frame.seconds,sha256:frame.sha256,poseChanged:frame.poseChanged,identical:frame.identicalToPrevious}));
 }
 report.status=report.errors.length?'rendered-with-errors':'rendered';if(report.errors.length)process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);console.error(e);process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();await save();if(browser)await browser.close().catch(()=>{});server.close();}
