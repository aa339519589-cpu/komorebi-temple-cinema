import * as T from 'three';
import {stableBumpChunk} from './stable-normals.js';
import {buildWorld} from './world.js';
import {getReferenceView} from './reference-views.js';
T.ShaderChunk.bumpmap_pars_fragment=stableBumpChunk(T.ShaderChunk.bumpmap_pars_fragment);
const params=new URLSearchParams(location.search),width=Number(params.get('w')||640),height=Number(params.get('h')||width);
if(!Number.isInteger(width)||!Number.isInteger(height)||width<128||height<128||width>3840||height>3840)throw Error('Invalid output dimensions');
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setSize(width,height);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.outputColorSpace=T.SRGBColorSpace;
document.body.append(renderer.domElement);
const nativeRender=renderer.render.bind(renderer),shadowPolicy=new Map();let renderCalls=0;
// This is an explicit artistic/compatibility shadow policy, NOT a claim of
// unchanged lighting: retain all light contributions; only the directional
// key casts a shadow in this first native pass. No geometry or maps removed.
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
function render(view=getReferenceView(6)){
 world.update(view.time??41.95);camera.position.fromArray(view.position);camera.lookAt(new T.Vector3(...view.target));camera.fov=view.fov||78;camera.updateProjectionMatrix();camera.updateMatrixWorld();
 renderer.render(scene,camera);renderer.getContext().finish();lastView={position:camera.position.toArray(),target:[...view.target],fov:camera.fov,time:view.time??41.95};return lastView;
}
function capture(view){
 const start=performance.now(),pose=render(view);const gl=renderer.getContext();
 const pixels=new Uint8Array(width*height*4);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,null);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
 let nonzero=0,min=255,max=0,sum=0;for(let i=0;i<pixels.length;i+=4){const v=Math.max(pixels[i],pixels[i+1],pixels[i+2]);if(v>2)nonzero++;min=Math.min(min,v);max=Math.max(max,v);sum+=v;}
 return{png:renderer.domElement.toDataURL('image/png'),pose,seconds:(performance.now()-start)/1000,pixels:{nonzero,total:width*height,min,max,mean:sum/(width*height)},glError:gl.getError()};
}
function info(){const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return{revision:'v60-native-sanctuary-r1',gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),glError:gl.getError(),contextLost:gl.isContextLost(),programs:renderer.info.programs.map(p=>({name:p.name,linked:gl.getProgramParameter(p.program,gl.LINK_STATUS),log:gl.getProgramInfoLog(p.program)})),renderCalls,shadowPolicy:[...shadowPolicy.values()],buildMs,width,height,lastView};}
window.production={ready:true,scene,renderer,camera,world,render,capture,info,T,getReferenceView};console.info('PRODUCTION_READY',buildMs);
