import {captureOutputTarget} from './capture-output-target.js';
/** Apply photographic exposure after world.update selected its lighting mode. */
export function captureSceneFrame(temple,draw,{exposure=null}={}){
 if(exposure!==null&&(!Number.isFinite(exposure)||exposure<.1||exposure>5))throw Error('Exposure must be null or within [0.1,5]');
 const composer=temple.composer,render=composer.render;
 if(exposure!==null)composer.render=function(...args){temple.renderer.toneMappingExposure=exposure;return render.apply(this,args)};
 try{const result=captureOutputTarget(temple,draw);return {...result,exposure:temple.renderer.toneMappingExposure};}
 finally{composer.render=render;}
}
export function captureReferenceFrame(temple,{reference,view=null,exposure=null}={}){
 if(!Number.isInteger(reference)||reference<1||reference>10)throw Error('Reference must be 1..10');
 if(view){
  if(!Array.isArray(view.position)||!Array.isArray(view.target)||view.position.length!==3||view.target.length!==3||![...view.position,...view.target,view.fov,view.time].every(Number.isFinite)||view.fov<10||view.fov>140||view.time<0||view.time>=70)throw Error('Invalid explicit reference camera');
 }
 const capture=captureSceneFrame(temple,()=>view?temple.renderView(view.position,view.target,view.time,view.fov):temple.renderReference(reference),{exposure});
 const info=temple.info();return {...capture,reference,fov:temple.camera.fov,time:view?.time??info.referenceViews.find(v=>v.reference===reference)?.time??0,gpu:info.gpu,sceneVariant:temple.sceneVariant};
}
export function capturedPixelsToPng(capture){
 const {width,height,rgbaBase64,pixelAudit}=capture;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>4096||height>4096||!pixelAudit?.nonzeroAlpha||!pixelAudit?.nonzeroRgb)throw Error('No validated scene pixels to export');
 const binary=atob(rgbaBase64);if(binary.length!==width*height*4)throw Error('Frame byte count mismatch');
 const pixels=new Uint8ClampedArray(binary.length);for(let i=0;i<binary.length;i++)pixels[i]=binary.charCodeAt(i);
 // This CPU canvas only encodes pixels already rendered by the real 3D scene.
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw Error('2D PNG encoder unavailable');
 context.putImageData(new ImageData(pixels,width,height),0,0);return canvas.toDataURL('image/png');
}
