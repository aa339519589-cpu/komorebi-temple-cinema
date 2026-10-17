/** Renderer-platform diagnostic only; no scene source, shader or quality edits. */
import {pathToFileURL} from 'node:url';
const source=process.env.REAL_PLAYWRIGHT_MODULE;if(!source?.startsWith('/'))throw Error('Require explicit installed Playwright path');
const native=await import(pathToFileURL(source).href);
const backend=process.env.WEBGL_PLATFORM_BACKEND||'metal';if(!['metal','gl'].includes(backend))throw Error('Unsupported diagnostic backend');
export const chromium=Object.create(native.chromium);
chromium.launch=options=>{
 const args=(options?.args||[]).filter(a=>!a.startsWith('--use-angle=')&&a!=='--disable-gpu-compositing');
 args.push('--use-gl=angle','--use-angle='+backend,'--disable-gpu-compositing');
 const headless=process.env.WEBGL_PLATFORM_HEADLESS==='false'?false:options?.headless??true;
 console.log(JSON.stringify({rendererPlatformDiagnostic:{backend,headless,browserCompositingDisabled:true,sceneGeometryChanged:false,sceneMaterialsChanged:false}}));
 return native.chromium.launch({...options,args,headless});
};
