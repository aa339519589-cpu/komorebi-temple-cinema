import * as T from 'three';
import {stableBumpChunk} from './stable-normals.js';
import {buildWorld} from './world.js';
import {getReferenceView} from './reference-views.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {readFramebufferRGBA} from './read-framebuffer-rgba.js';
T.ShaderChunk.bumpmap_pars_fragment=stableBumpChunk(T.ShaderChunk.bumpmap_pars_fragment);
const params=new URLSearchParams(location.search),width=Number(params.get('w')||640),height=Number(params.get('h')||width);
if(!Number.isInteger(width)||!Number.isInteger(height)||width<128||height<128||width>3840||height>3840)throw Error('Invalid output dimensions');
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setSize(width,height);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.outputColorSpace=T.SRGBColorSpace;
document.body.append(renderer.domElement);
const nativeRender=renderer.render.bind(renderer),shadowPolicy=new Map();let renderCalls=0;
// Explicit artistic/compatibility policy: all light contributions are retained;
// the directional key alone casts a shadow. Geometry and maps are not removed.
renderer.render=function(scene,camera){
 scene.traverse(o=>{if(!o.isLight||!o.shadow)return;if(!shadowPolicy.has(o.uuid))shadowPolicy.set(o.uuid,{name:o.name,type:o.type,originalCastShadow:o.castShadow});
 if(o.isPointLight||o.isSpotLight)o.castShadow=false;
 if(o.isDirectionalLight)o.shadow.mapSize.set(4096,4096);
 });
 const result=nativeRender(scene,camera);renderCalls++;return result;
};
const began=performance.now(),world=buildWorld(renderer,{sceneVariant:params.get('scene')||'shared'});
const scene=world.scene,camera=new T.PerspectiveCamera(78,width/height,.1,200);
const buildMs=performance.now()-began;let lastView=null;
const hdr=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:true,stencilBuffer:false});
const finalTarget=new T.WebGLRenderTarget(width,height,{type:T.UnsignedByteType,depthBuffer:false,stencilBuffer:false});
const outputPass=new OutputPass();outputPass.renderToScreen=false;let lastTargetState=null;
function render(view=getReferenceView(6)){
 world.update(view.time??41.95);camera.position.fromArray(view.position);camera.lookAt(new T.Vector3(...view.target));camera.fov=view.fov||78;camera.updateProjectionMatrix();camera.updateMatrixWorld();
 renderer.resetState();renderer.autoClear=true;renderer.setScissorTest(false);renderer.setViewport(0,0,width,height);renderer.setRenderTarget(hdr);renderer.clear();renderer.render(scene,camera);outputPass.render(renderer,finalTarget,hdr);renderer.getContext().finish();
 lastTargetState={targetIsFinal:renderer.getRenderTarget()===finalTarget,viewport:renderer.getViewport(new T.Vector4()).toArray(),scissor:renderer.getScissor(new T.Vector4()).toArray(),autoClear:renderer.autoClear,calls:renderer.info.render.calls,framebuffer:!!renderer.properties.get(finalTarget).__webglFramebuffer};lastView={position:camera.position.toArray(),target:[...view.target],fov:camera.fov,time:view.time??41.95};return lastView;
}
function capture(view){
 const start=performance.now(),pose=render(view);const gl=renderer.getContext();
 const {pixels,audit}=readFramebufferRGBA(renderer,{target:finalTarget,width,height});
 let nonzero=0,min=255,max=0,sum=0;for(let i=0;i<pixels.length;i+=4){const v=Math.max(pixels[i],pixels[i+1],pixels[i+2]);if(v>2)nonzero++;min=Math.min(min,v);max=Math.max(max,v);sum+=v;}
 const topDown=new Uint8ClampedArray(pixels.length),stride=width*4;for(let y=0;y<height;y++)topDown.set(pixels.subarray((height-y-1)*stride,(height-y)*stride),y*stride);
 const c=document.createElement('canvas');c.width=width;c.height=height;c.getContext('2d').putImageData(new ImageData(topDown,width,height),0,0);
 return{png:c.toDataURL('image/png'),pose,targetState:lastTargetState,readback:audit,seconds:(performance.now()-start)/1000,pixels:{nonzero,total:width*height,min,max,mean:sum/(width*height)},glError:gl.getError()};
}
function info(){const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return{revision:'v60-native-sanctuary-r2',gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),glError:gl.getError(),contextLost:gl.isContextLost(),programs:renderer.info.programs.map(p=>({name:p.name,linked:gl.getProgramParameter(p.program,gl.LINK_STATUS),log:gl.getProgramInfoLog(p.program)})),renderCalls,shadowPolicy:[...shadowPolicy.values()],buildMs,width,height,lastView,lastTargetState};}
window.production={ready:true,scene,renderer,camera,world,render,capture,info,T,getReferenceView};console.info('PRODUCTION_READY',buildMs);
