import * as T from 'three';
import {stableBumpChunk} from './stable-normals.js';
import {buildWorld} from './world.js';
import {getReferenceView} from './reference-views.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {readFramebufferRGBA} from './read-framebuffer-rgba.js';
import {createRestorationScatteringPass} from './restoration-lighting.js';
import {createSanctuaryFinishStudy} from './sanctuary-reference-finish.js';
import {createSanctuaryFloorPanelStudy} from './reference6-floor-panels.js';
T.ShaderChunk.bumpmap_pars_fragment=stableBumpChunk(T.ShaderChunk.bumpmap_pars_fragment);
const params=new URLSearchParams(location.search),width=Number(params.get('w')||640),height=Number(params.get('h')||width);
if(!Number.isInteger(width)||!Number.isInteger(height)||width<128||height<128||width>3840||height>3840)throw Error('Invalid output dimensions');
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setSize(width,height);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.outputColorSpace=T.SRGBColorSpace;
document.body.append(renderer.domElement);
const nativeRender=renderer.render.bind(renderer),shadowPolicy=new Map();let renderCalls=0;
// Explicit shadow-budget policy, not unchanged lighting: existing point/spot
// contributions stay, while the directional key casts the 4096 shadow.
renderer.render=function(scene,camera){
 scene.traverse(o=>{if(!o.isLight||!o.shadow)return;if(!shadowPolicy.has(o.uuid))shadowPolicy.set(o.uuid,{name:o.name,type:o.type,originalCastShadow:o.castShadow});
 if(o.isPointLight||o.isSpotLight)o.castShadow=false;
 if(o.isDirectionalLight)o.shadow.mapSize.set(4096,4096);
 });
 const result=nativeRender(scene,camera);renderCalls++;return result;
};
const began=performance.now(),world=buildWorld(renderer,{sceneVariant:params.get('scene')||'shared'});
const scene=world.scene,camera=new T.PerspectiveCamera(78,width/height,.1,200);
const buildMs=performance.now()-began;let lastView=null,configuration=null,finish=null,floorPanels=null,lastTargetState=null;
const hdr=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:true,stencilBuffer:false});
hdr.depthTexture=new T.DepthTexture(width,height,T.UnsignedIntType);
const scattered=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:false,stencilBuffer:false});
const finalTarget=new T.WebGLRenderTarget(width,height,{type:T.UnsignedByteType,depthBuffer:false,stencilBuffer:false});
const outputPass=new OutputPass();outputPass.renderToScreen=false;
const atmosphere=createRestorationScatteringPass(camera,world.sun,hdr.depthTexture,{hallMatrix:world.hallMatrix});atmosphere.renderToScreen=false;
const bounce=new T.Group();bounce.name='production-reference6-window-bounce';
const key=new T.RectAreaLight('#ffe0a7',0,4,4);key.name='production-left-window-bounce';key.position.set(-6.4,7.4,-5.5);key.lookAt(-1.54,6.9,-9.7);
const rim=new T.RectAreaLight('#ffd79b',0,2.3,3);rim.name='production-right-timber-bounce';rim.position.set(3.4,7.8,-7.5);rim.lookAt(-1.54,6.8,-9.7);
const front=new T.RectAreaLight('#ffe0b0',0,5,3);front.name='production-front-room-bounce';front.position.set(-1.54,7,-1.4);front.lookAt(-1.54,7,-9.7);
bounce.add(key,rim,front);bounce.visible=false;scene.add(bounce);
const adapter={scene,renderer,composer:{passes:[atmosphere]},renderReference:reference=>render(getReferenceView(reference)),info:()=>({lightingMode:world.restorationLighting.mode})};
function configure(options={}){
 world.update(41.95);
 const checked=(x,fallback)=>{const v=x??fallback;if(!Number.isFinite(v)||v<0||v>30)throw Error('Invalid bounce intensity');return v;};
 const next={...options,key:checked(options.key,8),rim:checked(options.rim,2.5),front:checked(options.front,1.5),scattering:options.scattering!==false,broadFloor:options.broadFloor!==false};
 finish??=createSanctuaryFinishStudy(adapter);floorPanels??=createSanctuaryFloorPanelStudy(adapter);
 finish.apply(next);
 if(next.broadFloor)floorPanels.apply({reflectionLod:next.floorLod??.8});else floorPanels.restore();
 key.intensity=next.key;rim.intensity=next.rim;front.intensity=next.front;bounce.visible=next.key+next.rim+next.front>0;
 configuration=next;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;return {configuration,finish:finish.info(),floor:floorPanels.info()};
}
function render(view=getReferenceView(6)){
 const time=view.time??41.95;if(configuration&&(time<35||time>=42))throw Error('Configured production look is sanctuary-only');
 world.update(time);camera.position.fromArray(view.position);camera.lookAt(new T.Vector3(...view.target));camera.fov=view.fov||78;camera.updateProjectionMatrix();camera.updateMatrixWorld();
 renderer.resetState();renderer.autoClear=true;renderer.setScissorTest(false);renderer.setViewport(0,0,width,height);renderer.setRenderTarget(hdr);renderer.clear();renderer.render(scene,camera);
 let beauty=hdr;
 if(configuration?.scattering){atmosphere.sync(world.restorationLighting.profile);atmosphere.render(renderer,scattered,hdr);beauty=scattered;}
 outputPass.render(renderer,finalTarget,beauty);renderer.getContext().finish();renderer.shadowMap.autoUpdate=false;
 lastTargetState={targetIsFinal:renderer.getRenderTarget()===finalTarget,viewport:renderer.getViewport(new T.Vector4()).toArray(),scissor:renderer.getScissor(new T.Vector4()).toArray(),autoClear:renderer.autoClear,calls:renderer.info.render.calls,framebuffer:!!renderer.properties.get(finalTarget).__webglFramebuffer};lastView={position:camera.position.toArray(),target:[...view.target],fov:camera.fov,time};return lastView;
}
function capture(view){
 const start=performance.now(),pose=render(view);const gl=renderer.getContext();
 const {pixels,audit}=readFramebufferRGBA(renderer,{target:finalTarget,width,height});
 let nonzero=0,min=255,max=0,sum=0;for(let i=0;i<pixels.length;i+=4){const v=Math.max(pixels[i],pixels[i+1],pixels[i+2]);if(v>2)nonzero++;min=Math.min(min,v);max=Math.max(max,v);sum+=v;}
 const topDown=new Uint8ClampedArray(pixels.length),stride=width*4;for(let y=0;y<height;y++)topDown.set(pixels.subarray((height-y-1)*stride,(height-y)*stride),y*stride);
 const c=document.createElement('canvas');c.width=width;c.height=height;c.getContext('2d').putImageData(new ImageData(topDown,width,height),0,0);
 return{png:c.toDataURL('image/png'),pose,targetState:lastTargetState,readback:audit,seconds:(performance.now()-start)/1000,pixels:{nonzero,total:width*height,min,max,mean:sum/(width*height)},glError:gl.getError()};
}
function info(){const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return{revision:'v60-native-sanctuary-r3',gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),glError:gl.getError(),contextLost:gl.isContextLost(),programs:renderer.info.programs.map(p=>({name:p.name,linked:gl.getProgramParameter(p.program,gl.LINK_STATUS),log:gl.getProgramInfoLog(p.program)})),renderCalls,shadowPolicy:[...shadowPolicy.values()],buildMs,width,height,lastView,lastTargetState,configuration,finish:finish?.info(),floor:floorPanels?.info(),lightingMode:world.restorationLighting.mode,scattering:configuration?.scattering?{type:'existing shadow-occluded volume integration',density:atmosphere.uniforms.density.value}:false,referencePixelsUsedInScene:false};}
window.production={ready:true,scene,renderer,camera,world,render,capture,configure,info,T,getReferenceView};console.info('PRODUCTION_READY',buildMs);
