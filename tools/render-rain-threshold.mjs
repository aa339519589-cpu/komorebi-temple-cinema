import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const name=process.env.STUDY||'wet',size=960,options={control:null,wet:{resolution:1536,stoneGain:.44,strength:1,practicalGain:1},lanterns:{resolution:1536,stoneGain:.42,strength:1,practicalGain:2.2}};
if(!Object.hasOwn(options,name))throw Error('Unknown rain study');
const out='output/rain-threshold-'+name;await mkdir(out,{recursive:true});const hash=b=>createHash('sha256').update(b).digest('hex');const source={};for(const f of(await readdir('src')).filter(x=>x.endsWith('.js')).sort())source[f]=hash(await readFile('src/'+f));
const report={id:name,status:'building',reference:10,size,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHash:hash(JSON.stringify(source)),options:options[name],errors:[],photographicAcceptance:false};const save=()=>writeFile(out+'/report.json',JSON.stringify(report,null,2));await save();
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href),{server}=await import('./server.mjs');let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});const page=await browser.newPage({viewport:{width:size,height:size}});
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());console.log(m.type(),m.text().slice(0,1500));});
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.protocol==='data:'||(u.hostname==='127.0.0.1'&&u.port==='4317')?r.continue():r.abort('blockedbyclient');});
 await page.goto(`http://127.0.0.1:4317/sanctuary-production.html?w=${size}&h=${size}&scope=site&scene=reference10-porch`,{waitUntil:'load',timeout:300000});await page.waitForFunction(()=>window.production?.ready,null,{timeout:300000});
 report.prepared=await page.evaluate(async ({options,name})=>{const p=window.production;p.renderer.resetState=()=>{};const view=p.getReferenceView(10,{sceneVariant:'reference10-porch'});p.world.update(view.time);p.renderer.getContext().finish();if(options){const m=await import('/src/rain-threshold-optics.js');window.rainOptics=m.installRainThresholdOptics(p.world,options);window.rainOptics.update(view.time);}if(name==='lanterns')p.renderer.toneMappingExposure=1.28;p.renderer.shadowMap.needsUpdate=true;return{view,optics:window.rainOptics?.report||null,info:p.info()};},{options:options[name],name});
 report.status='rendering';await save();const frame=await page.evaluate(view=>{const p=window.production;return{...p.capture(view),info:p.info()};},report.prepared.view);
 const png=Buffer.from(frame.png.split(',')[1],'base64');delete frame.png;await writeFile(out+'/rain-'+name+'.png',png);report.frame=frame;report.pngSha256=hash(png);report.pngBytes=png.length;
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i','references/hd/9-照片-10.jpg','-i',out+'/rain-'+name+'.png','-filter_complex',`[0:v]scale=${size}:${size}[a];[a][1:v]hstack[out]`,'-map','[out]','-frames:v','1',out+'/reference-left-render-right.png']);
 if(frame.glError||frame.info.contextLost||!frame.info.programs.every(p=>p.linked)||frame.pixels.nonzero<size*size*.8||report.errors.length)throw Error('Actual rain-frame validation failed');report.status='rendered-review';
}catch(e){report.status='failed';report.error=String(e.stack||e);process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();await save();console.log(JSON.stringify({status:report.status,id:name,error:report.error}));if(browser)await browser.close().catch(()=>{});server.close();}
