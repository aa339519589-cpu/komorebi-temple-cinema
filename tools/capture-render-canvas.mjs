import {writeFile} from 'node:fs/promises';
/** Read the renderer's actual output buffer, not a UI screenshot or generated image. */
export async function captureRenderCanvas(page,file){
 const result=await page.evaluate(()=>{
  const renderer=window.temple?.renderer;
  if(!renderer?.domElement)throw Error('Actual temple renderer is unavailable');
  if(!renderer.getContext().getContextAttributes().preserveDrawingBuffer)throw Error('Canvas capture requires preserved real render output');
  renderer.getContext().finish();
  const canvas=renderer.domElement;
  return {url:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height};
 });
 if(!result.url.startsWith('data:image/png;base64,'))throw Error('WebGL canvas did not return a PNG');
 const png=Buffer.from(result.url.slice('data:image/png;base64,'.length),'base64');
 if(png.length<33||png.length>32*1024*1024||!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Invalid canvas PNG');
 if(png.readUInt32BE(16)!==result.width||png.readUInt32BE(20)!==result.height)throw Error('Canvas PNG dimensions do not match render buffer');
 await writeFile(file,png);
 return {width:result.width,height:result.height,bytes:png.length,capture:'preserved WebGL canvas PNG'};
}
