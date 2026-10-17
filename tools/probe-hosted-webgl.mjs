import {mkdir,writeFile,appendFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const out='output/hosted-mac';await mkdir(out,{recursive:true});
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const report={platform:process.platform,arch:process.arch,startedAt:new Date().toISOString(),ownerMac:false,attempts:[]};
let usable=false;
for(const headless of [true,false]){
 let browser;
 try{
  browser=await chromium.launch({headless,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-watchdog','--force-color-profile=srgb']});
  const page=await browser.newPage({viewport:{width:256,height:256}});
  await page.setContent('<!doctype html><canvas width="128" height="128"></canvas>');
  const result=await page.evaluate(()=>{const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl2',{preserveDrawingBuffer:true});if(!gl)return{webgl2:false};const ext=gl.getExtension('WEBGL_debug_renderer_info');gl.clearColor(.25,.5,.75,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.finish();const pixel=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);return{webgl2:true,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),vendor:ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR),maxTextureSize:gl.getParameter(gl.MAX_TEXTURE_SIZE),pixel:Array.from(pixel),glError:gl.getError()}});
  const hardware=result.webgl2&&/Apple|Metal/i.test(result.renderer||'')&&!/SwiftShader|Software|llvmpipe/i.test(result.renderer||'')&&result.glError===0&&Math.abs(result.pixel[0]-64)<=1&&Math.abs(result.pixel[1]-128)<=1;
  report.attempts.push({headless,browserVersion:browser.version(),...result,hardwareCandidate:hardware});
  if(hardware){usable=true;report.preferredHeadless=headless;break;}
 }catch(error){report.attempts.push({headless,error:String(error)})}finally{if(browser)await browser.close().catch(()=>{})}
}
report.usable=usable;report.finishedAt=new Date().toISOString();await writeFile(out+'/probe.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`usable=${usable}\nheadless=${report.preferredHeadless!==false}\n`);
