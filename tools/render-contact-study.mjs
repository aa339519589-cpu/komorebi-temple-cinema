import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const id=process.env.STUDY||'contact',size=+(process.env.SIZE||800);
if(!['contact','depth','longlens','warm'].includes(id)||size<320||size>1400||size%2)throw Error('Invalid optical study');
const base={exposure:1.4,environmentGain:1,metalGain:1.1,sunGain:1.6,practicalGain:1.35,floorLod:.6,floorStrength:1.1,hazeGain:.25,redWood:true,warmTimber:true,giltColor:'#c58b29',agedGoldColor:'#815021',statueGoldColor:'#b98021',backingColor:'#81421b',metalRoughnessGain:.88,key:7,rim:2,front:1};
const studies={
 contact:{finish:base,ao:{radius:.30,intensity:.85}},
 depth:{finish:{...base,exposure:1.5,environmentGain:.65,metalGain:.9,key:4,rim:1,front:0,hazeGain:.65},ao:{radius:.48,intensity:1.05},darkLacquer:true},
 longlens:{finish:{...base,exposure:1.5,environmentGain:.85,key:5,rim:1,front:.3,hazeGain:.5},ao:{radius:.34,intensity:.85},camera:{position:[-1.540726762,4.6,.25],target:[-1.540726762,6,-9.755090396],fov:62,time:41.95}},
 warm:{finish:{...base,exposure:1.55,environmentGain:.75,metalGain:.85,key:3.5,rim:1,front:.15,hazeGain:.9,giltColor:'#d6a640',statueGoldColor:'#c59030'},ao:{radius:.38,intensity:.9},darkLacquer:true,sunDirection:[-.75,.58,-.30]}
};
const cfg=studies[id],out='output/contact-'+id;await mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');const source={};for(const f of(await readdir('src')).filter(x=>x.endsWith('.js')).sort())source[f]=sha(await readFile('src/'+f));
const report={id,configuration:cfg,size,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHash:sha(JSON.stringify(source)),startedAt:new Date().toISOString(),status:'starting',errors:[],accepted:false};
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),{server}=await import('./server.mjs');let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});
 const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());console.log(m.type(),m.text().slice(0,1000))});
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?r.continue():r.abort('blockedbyclient')});
 await page.goto(`http://127.0.0.1:4317/sanctuary-production.html?w=${size}&h=${size}&scope=interior`,{waitUntil:'load',timeout:300000});await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});
 const frame=await page.evaluate(async cfg=>{
  const p=window.production;p.renderer.resetState=()=>{};p.configure(cfg.finish);
  const module=await import('/src/sanctuary-contact-optics.js');module.installSanctuaryContactOptics(p,cfg.ao);
  if(cfg.darkLacquer){const seen=new Set();p.scene.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&!seen.has(m)){seen.add(m);if(/restoration-black-brown-lacquer|architecture_black/.test(m.name)){m.color.set('#100c08');m.roughness=.27;m.envMapIntensity=.65;}}})}
  if(cfg.sunDirection){const sun=p.world.sun;sun.position.copy(sun.target.position).addScaledVector(new p.T.Vector3(...cfg.sunDirection).normalize(),120);sun.updateMatrixWorld();p.renderer.shadowMap.needsUpdate=true;}
  const pose=cfg.camera||p.getReferenceView(6),result=p.capture(pose);return{...result,info:p.info(),contact:p.contactOpticsInfo()};
 },cfg);
 const png=Buffer.from(frame.png.split(',')[1],'base64');delete frame.png;report.frame=frame;report.pngSha256=sha(png);report.pngBytes=png.length;await writeFile(`${out}/${id}.png`,png);
 const valid=frame.glError===0&&!frame.info.contextLost&&frame.info.programs.every(p=>p.linked)&&frame.pixels.nonzero>size*size*.8&&png.length>25000&&report.errors.length===0;
 report.status=valid?'rendered-review':'rendered-with-errors';
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i','references/hd/4-照片-5.jpg','-i',`${out}/${id}.png`,'-filter_complex',`[0:v]scale=${size}:${size}[a];[a][1:v]hstack[out]`,'-map','[out]','-frames:v','1',`${out}/${id}-comparison.png`]);
 if(!valid)process.exitCode=1;
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({id,status:report.status,error:report.error,errors:report.errors}));if(browser)await browser.close().catch(()=>{});server.close();}
