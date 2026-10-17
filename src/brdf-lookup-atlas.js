/**
 * Pack the pinned r186 DFG/LTC lookup tables into one sampler.
 * Keeps every scene light, shadow map, BRDF coefficient and geometry object.
 * DFG uses explicit native-grid bilinear filtering; LTC preserves native filtering.
 */
import * as T from '../vendor/build/three.module.js';
import {RectAreaLightTexturesLib} from 'three/addons/lights/RectAreaLightTexturesLib.js';

const WIDTH=144,HEIGHT=64;
let installed=null;
const chunks=['lights_pars_begin','lights_physical_pars_fragment','lights_fragment_begin'];
function replaceExactly(source,from,to,count,label){
 const found=source.split(from).length-1;
 if(found!==count)throw Error(`Pinned BRDF shader changed: ${label} (${found}, expected ${count})`);
 return source.split(from).join(to);
}
export function patchBrdfChunks(input){
 const next={...input};
 next.lights_pars_begin=replaceExactly(next.lights_pars_begin,'uniform sampler2D ltc_1;\tuniform sampler2D ltc_2;','// LTC tables share komorebiBrdfAtlas.',1,'LTC samplers');
 const helpers=`uniform sampler2D komorebiBrdfAtlas;
vec2 komorebiDFG(vec2 uv){
 vec2 p=clamp(uv,vec2(.03125),vec2(.96875))*16.0-.5;
 ivec2 lo=ivec2(floor(p)),hi=min(lo+ivec2(1),ivec2(15));
 vec2 f=fract(p);ivec2 origin=ivec2(128,0);
 vec2 a=texelFetch(komorebiBrdfAtlas,origin+lo,0).rg;
 vec2 b=texelFetch(komorebiBrdfAtlas,origin+ivec2(hi.x,lo.y),0).rg;
 vec2 c=texelFetch(komorebiBrdfAtlas,origin+ivec2(lo.x,hi.y),0).rg;
 vec2 d=texelFetch(komorebiBrdfAtlas,origin+hi,0).rg;
 return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
vec4 komorebiLTC(vec2 uv,float table){
 vec2 p=clamp(uv,vec2(.0078125),vec2(.9921875))*64.0;
 return texture2D(komorebiBrdfAtlas,(p+vec2(table*64.0,0.0))/vec2(144.0,64.0));
}
`;
 next.lights_physical_pars_fragment=replaceExactly(next.lights_physical_pars_fragment,'uniform sampler2D dfgLUT;',helpers,1,'DFG sampler');
 next.lights_physical_pars_fragment=replaceExactly(next.lights_physical_pars_fragment,'texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg','komorebiDFG( vec2( roughness, dotNV ) )',1,'environment DFG');
 for(const [sampler,index] of [['ltc_1','0.0'],['ltc_2','1.0']]){
  for(const uv of ['uv','uvClearcoat'])next.lights_physical_pars_fragment=replaceExactly(next.lights_physical_pars_fragment,`texture2D( ${sampler}, ${uv} )`,`komorebiLTC( ${uv}, ${index} )`,1,`${sampler}/${uv}`);
 }
 next.lights_fragment_begin=replaceExactly(next.lights_fragment_begin,'texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg','komorebiDFG( vec2( material.roughness, dotNVms ) )',1,'direct DFG');
 return next;
}

export function packBrdfTables(ltc1,ltc2,dfg,{half=false}={}){
 if(ltc1.length!==64*64*4||ltc2.length!==64*64*4||dfg.length!==16*16*2)throw Error('Unexpected native BRDF table dimensions');
 if(half&&(!(ltc1 instanceof Uint16Array)||!(ltc2 instanceof Uint16Array)))throw Error('Half-float LTC table expected');
 if(!(dfg instanceof Uint16Array))throw Error('The pinned DFG table must retain its half-float words');
 const data=half?new Uint16Array(WIDTH*HEIGHT*4):new Float32Array(WIDTH*HEIGHT*4);
 for(let y=0;y<64;y++){
  data.set(ltc1.subarray(y*256,(y+1)*256),(y*WIDTH)*4);
  data.set(ltc2.subarray(y*256,(y+1)*256),(y*WIDTH+64)*4);
 }
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  const src=(y*16+x)*2,dst=(y*WIDTH+128+x)*4;
  data[dst]=half?dfg[src]:T.DataUtils.fromHalfFloat(dfg[src]);
  data[dst+1]=half?dfg[src+1]:T.DataUtils.fromHalfFloat(dfg[src+1]);
  data[dst+3]=half?0x3c00:1;
 }
 return data;
}

function borrowPinnedDfg(renderer){
 // Obtain the renderer's own table, not a separately approximated/recomputed LUT.
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,.1,2);
 camera.position.z=1;
 const geometry=new T.PlaneGeometry(2,2),material=new T.MeshStandardMaterial();
 scene.add(new T.Mesh(geometry,material));
 const target=new T.WebGLRenderTarget(1,1),saved={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),auto:renderer.autoClear,shadow:renderer.shadowMap.enabled,viewport:renderer.getViewport(new T.Vector4()),scissor:renderer.getScissor(new T.Vector4()),scissorTest:renderer.getScissorTest()};
 try{
  renderer.shadowMap.enabled=false;renderer.autoClear=true;renderer.setRenderTarget(target);renderer.render(scene,camera);
  const texture=renderer.properties.get(material).uniforms?.dfgLUT?.value;
  if(!texture?.isDataTexture||texture.name!=='DFG_LUT'||texture.image.width!==16||texture.image.height!==16||!(texture.image.data instanceof Uint16Array))throw Error('Pinned renderer did not expose its native DFG table');
  return texture.image.data.slice();
 }finally{
  renderer.setRenderTarget(saved.target,saved.face,saved.mip);renderer.autoClear=saved.auto;renderer.shadowMap.enabled=saved.shadow;
  renderer.setViewport(saved.viewport);renderer.setScissor(saved.scissor);renderer.setScissorTest(saved.scissorTest);
  material.dispose();geometry.dispose();target.dispose();
 }
}

export function installBrdfLookupAtlas(renderer){
 if(!renderer?.isWebGLRenderer)throw Error('BRDF atlas requires the actual WebGL renderer');
 if(installed)return installed.acquire();
 if(T.REVISION!=='186')throw Error('Review BRDF atlas integration before changing pinned Three.js revision');
 if(renderer.info.programs.length)throw Error('Install the BRDF atlas before any application scene programs');
 const originals=Object.fromEntries(chunks.map(key=>[key,T.ShaderChunk[key]]));
 const patched=patchBrdfChunks(originals),dfg=borrowPinnedDfg(renderer);
 RectAreaLightTexturesLib.init();
 const half=!renderer.extensions.has('OES_texture_float_linear');
 const ltc1=half?RectAreaLightTexturesLib.LTC_HALF_1:RectAreaLightTexturesLib.LTC_FLOAT_1;
 const ltc2=half?RectAreaLightTexturesLib.LTC_HALF_2:RectAreaLightTexturesLib.LTC_FLOAT_2;
 const data=packBrdfTables(ltc1.image.data,ltc2.image.data,dfg,{half});
 const texture=new T.DataTexture(data,WIDTH,HEIGHT,T.RGBAFormat,half?T.HalfFloatType:T.FloatType);
 texture.name='komorebi-native-brdf-lookup-atlas';texture.wrapS=texture.wrapT=T.ClampToEdgeWrapping;
 texture.magFilter=T.LinearFilter;texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
 const clonedTextures=new Set();const clone=texture.clone.bind(texture);
 texture.clone=()=>{const child=clone();clonedTextures.add(child);return child;};
 const libs=[T.ShaderLib.standard,T.ShaderLib.physical],saved=libs.map(lib=>lib.uniforms.komorebiBrdfAtlas);
 for(const [key,value] of Object.entries(patched))T.ShaderChunk[key]=value;
 for(const lib of libs)lib.uniforms.komorebiBrdfAtlas={value:texture};
 const info=Object.freeze({enabled:true,threeRevision:T.REVISION,atlas:[WIDTH,HEIGHT],storage:half?'half-float':'float',nativeTables:{DFG:[16,16],LTC1:[64,64],LTC2:[64,64]},samplersBefore:3,samplersAfter:1,lightsRemoved:0,shadowsRemoved:0,materialMapsRemoved:0,coefficientPolicy:'Original pinned lookup coefficients; native LTC filtering and explicit native-grid DFG bilinear'});
 let users=0;
 const state={acquire(){users++;let released=false;return {info:()=>info,dispose(){
  if(released)return;released=true;if(--users)return;
  for(const key of chunks)if(T.ShaderChunk[key]===patched[key])T.ShaderChunk[key]=originals[key];
  libs.forEach((lib,i)=>{if(saved[i]===undefined)delete lib.uniforms.komorebiBrdfAtlas;else lib.uniforms.komorebiBrdfAtlas=saved[i];});
  for(const child of clonedTextures)child.dispose();texture.dispose();if(installed===state)installed=null;
 }}}};
 installed=state;return state.acquire();
}
