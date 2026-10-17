import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const ref=Number(process.env.REFERENCE||3),size=640,variant=ref===10?'reference10-porch':'shared';
if(![3,10].includes(ref))throw Error('Reference outside diagnostic scope');
const out='output/site-pipeline-'+ref;await mkdir(out,{recursive:true});
const report={reference:ref,variant,size,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:'building',attempts:[],errors:[],referenceFidelityAccepted:false};
const save=()=>writeFile(out+'/report.json',JSON.stringify(report,null,2));await save();
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),{server}=await import('./server.mjs');let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});
 const page=await browser.newPage({viewport:{width:size,height:size}});page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());console.log(m.type(),m.text().slice(0,1000));});
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?r.continue():r.abort('blockedbyclient');});
 await page.goto(`http://127.0.0.1:4317/sanctuary-production.html?w=${size}&h=${size}&scope=site&scene=${variant}`,{waitUntil:'load',timeout:300000});await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});
 report.preparation=await page.evaluate(({ref,variant})=>{
  const p=window.production,view=p.getReferenceView(ref,{sceneVariant:variant}),gl=p.renderer.getContext();p.renderer.resetState=()=>{};
  p.world.update(view.time);gl.finish();const reflectors=[];p.scene.traverse(o=>{if(o.isReflector){const t=o.getRenderTarget();reflectors.push({name:o.name,size:[t.width,t.height],samples:t.samples,visible:o.visible});}});
  return{view,reflectors,glError:gl.getError(),info:p.info()};
 },{ref,variant});
 for(const mode of ['prepared-hdr','bounded-reflections','direct-native']){
  const result=await page.evaluate(({mode,ref,variant,size})=>{
   const p=window.production,r=p.renderer,gl=r.getContext(),view=p.getReferenceView(ref,{sceneVariant:variant});const result={mode,errorsBefore:[],reflectionChanges:[]};
   for(let i=0;i<16;i++){const err=gl.getError();if(!err)break;result.errorsBefore.push(err);}
   if(mode==='bounded-reflections')p.scene.traverse(o=>{if(o.isReflector){const rt=o.getRenderTarget();const old={name:o.name,size:[rt.width,rt.height],samples:rt.samples};rt.dispose();rt.samples=0;rt.setSize(1024,1024);const u=o.material.uniforms;for(const name of ['floorTexel','texelSize'])if(u[name]?.value?.isVector2)u[name].value.set(1/1024,1/1024);result.reflectionChanges.push({...old,nextSize:[1024,1024],nextSamples:0});}});
   const start=performance.now();
   try{
    if(mode!=='direct-native'){Object.assign(result,p.capture(view));}
    else{
     p.world.update(view.time);p.camera.position.fromArray(view.position);p.camera.lookAt(new p.T.Vector3(...view.target));p.camera.fov=view.fov;p.camera.updateProjectionMatrix();p.camera.updateMatrixWorld();
     r.setRenderTarget(null);r.setScissorTest(false);r.setViewport(0,0,size,size);r.autoClear=true;r.clear();r.render(p.scene,p.camera);gl.finish();
     const pixels=new Uint8Array(size*size*4);gl.readPixels(0,0,size,size,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let nonzero=0,sum=0;for(let i=0;i<pixels.length;i+=4){const v=Math.max(pixels[i],pixels[i+1],pixels[i+2]);if(v>2)nonzero++;sum+=v;}result.pixels={nonzero,total:size*size,mean:sum/(size*size)};result.glError=gl.getError();result.png=r.domElement.toDataURL('image/png');result.pose=view;
    }
    result.info=p.info();result.valid=result.glError===0&&!result.info.contextLost&&result.info.programs.every(x=>x.linked)&&result.pixels.nonzero>size*size*.70;
   }catch(e){result.error=String(e.stack||e);result.valid=false;result.info=p.info();}
   result.seconds=(performance.now()-start)/1000;return result;
  },{mode,ref,variant,size});
  if(result.png){const bytes=Buffer.from(result.png.split(',')[1],'base64');result.sha256=createHash('sha256').update(bytes).digest('hex');result.bytes=bytes.length;await writeFile(`${out}/${mode}.png`,bytes);delete result.png;}
  report.attempts.push(result);await save();console.log(JSON.stringify({mode,valid:result.valid,seconds:result.seconds,error:result.error}));
 }
 report.status=report.attempts.some(x=>x.valid)?'diagnostic-valid-frame':'failed';
 const reference=ref===3?'2-照片-3.jpg':'9-照片-10.jpg';for(const a of report.attempts.filter(x=>x.valid))execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i','references/hd/'+reference,'-i',`${out}/${a.mode}.png`,'-filter_complex',`[0:v]scale=${size}:${size}[a];[a][1:v]hstack[out]`,'-map','[out]','-frames:v','1',`${out}/${a.mode}-comparison.png`]);
 if(report.status==='failed')process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;}finally{await save();if(browser)await browser.close().catch(()=>{});server.close();}
