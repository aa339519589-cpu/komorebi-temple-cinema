import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out='output/production';await mkdir(out,{recursive:true});
const request=existsSync('tools/production-request.json')?JSON.parse(await readFile('tools/production-request.json','utf8')):{label:'native-sanctuary-r1',width:640,height:640,jobs:[{id:'sanctuary-native-baseline',reference:6}]};
const report={request,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),status:'running',errors:[],frames:[],referenceFidelityAccepted:false};
await writeFile(out+'/report.json',JSON.stringify(report,null,2));
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);const {server}=await import('./server.mjs');let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--disable-background-timer-throttling','--force-color-profile=srgb']});
 const page=await browser.newPage({viewport:{width:request.width,height:request.height},deviceScaleFactor:1});
 page.on('pageerror',e=>{report.errors.push(String(e));console.error(e)});page.on('console',m=>{console.log(m.type(),m.text().slice(0,1800));if(m.type()==='error')report.errors.push(m.text())});
 await page.goto(`http://127.0.0.1:4317/sanctuary-production.html?w=${request.width}&h=${request.height}`,{waitUntil:'load',timeout:300000});
 await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});
 const inventory=await page.evaluate(()=>{const p=window.production,lights=[],materials=new Map(),groups=[];p.scene.traverse(o=>{if(o.isLight)lights.push({name:o.name,type:o.type,intensity:o.intensity,color:o.color.getHexString(),position:o.position.toArray(),world:o.getWorldPosition(new p.T.Vector3()).toArray(),shadow:o.castShadow});if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&!materials.has(m.uuid))materials.set(m.uuid,{name:m.name,type:m.type,color:m.color?.getHexString(),metalness:m.metalness,roughness:m.roughness,envMapIntensity:m.envMapIntensity,emissive:m.emissive?.getHexString(),emissiveIntensity:m.emissiveIntensity,onBeforeCompile:String(m.onBeforeCompile).slice(0,140)});}if(o.isGroup&&o.name)groups.push({name:o.name,position:o.position.toArray(),children:o.children.length});});return{lights,materials:[...materials.values()],groups,hallMatrix:p.world.hallMatrix.elements,worldKeys:Object.keys(p.world),lightingKeys:Object.keys(p.world.restorationLighting)}});
 await writeFile(out+'/scene-inventory.json',JSON.stringify(inventory,null,2));
 for(const job of request.jobs){
  if(!/^[a-z0-9-]+$/.test(job.id))throw Error('Invalid frame id');
  const frame=await page.evaluate(j=>{const p=window.production;if(j.config&&p.configure)p.configure(j.config);return p.capture(j.camera||p.getReferenceView(j.reference||6));},job);
  const bytes=Buffer.from(frame.png.split(',')[1],'base64');delete frame.png;await writeFile(`${out}/${job.id}.png`,bytes);frame.id=job.id;frame.sha256=createHash('sha256').update(bytes).digest('hex');frame.bytes=bytes.length;
  report.frames.push(frame);report.info=await page.evaluate(()=>window.production.info());await writeFile(out+'/report.json',JSON.stringify(report,null,2));
  if(frame.pixels.max<=3||frame.pixels.nonzero<frame.pixels.total*.2||frame.glError||report.info.contextLost||report.info.programs.some(p=>!p.linked))throw Error('Frame validation failed: '+job.id);
  const ref='references/hd/4-照片-5.jpg';
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',ref,'-i',`${out}/${job.id}.png`,'-filter_complex',`[0:v]scale=${request.width}:${request.height}:force_original_aspect_ratio=decrease,pad=${request.width}:${request.height}:(ow-iw)/2:(oh-ih)/2:black[a];[a][1:v]hstack[out]`,'-map','[out]','-frames:v','1',`${out}/${job.id}-comparison.png`]);
  console.log(JSON.stringify({frame:job.id,pixels:frame.pixels,seconds:frame.seconds,sha256:frame.sha256}));
 }
 report.status=report.errors.length?'rendered-with-errors':'rendered';if(report.errors.length)process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);console.error(e);process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();await writeFile(out+'/report.json',JSON.stringify(report,null,2));if(browser)await browser.close().catch(()=>{});server.close();}
