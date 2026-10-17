/** Preserve material inputs while reducing duplicate fragment samplers. */
import * as T from '../vendor/build/three.module.js';

function equivalentCoordinates(a,b){
 const scalar=['channel','wrapS','wrapT','magFilter','minFilter','anisotropy','flipY','generateMipmaps','mapping','premultiplyAlpha','unpackAlignment'];
 return scalar.every(k=>a[k]===b[k])&&a.offset.equals(b.offset)&&a.repeat.equals(b.repeat)&&a.center.equals(b.center)&&a.rotation===b.rotation&&a.matrix.equals(b.matrix);
}
export function packNormalRoughness(normal,roughness){
 const n=normal?.image,r=roughness?.image;
 if(!normal?.isDataTexture||!roughness?.isDataTexture||normal.format!==T.RGBAFormat||roughness.format!==T.RGBAFormat||normal.type!==T.UnsignedByteType||roughness.type!==T.UnsignedByteType||normal.colorSpace!==T.NoColorSpace||roughness.colorSpace!==T.NoColorSpace||!n||!r||n.width!==r.width||n.height!==r.height||!(n.data instanceof Uint8Array)||!(r.data instanceof Uint8Array)||n.data.length!==r.data.length||!equivalentCoordinates(normal,roughness))throw Error('Normal/roughness packing requires identical unsigned-byte linear texture domains');
 const bytes=n.data.slice();for(let i=3;i<bytes.length;i+=4)bytes[i]=r.data[i-2];
 const packed=new T.DataTexture();packed.copy(normal);packed.source=new T.TextureSource({data:bytes,width:n.width,height:n.height});packed.name=(normal.name||'normal')+'-roughness-in-alpha';packed.needsUpdate=true;
 return packed;
}
function chunk(source,name,transform){
 const tag='#include <'+name+'>';
 if(!source.includes(tag))return source;
 return source.split(tag).join(transform(T.ShaderChunk[name]));
}
export function shareSamplerShader(shader,{bump=false,emissive=false,roughnessAlpha=false}={}){
 let s=shader.fragmentShader;
 if(bump)s=chunk(s,'bumpmap_pars_fragment',code=>code.replace(/uniform\s+sampler2D\s+bumpMap\s*;/g,'').replace(/\bbumpMap\b/g,'map'));
 if(emissive){
  s=chunk(s,'emissivemap_pars_fragment',code=>code.replace(/uniform\s+sampler2D\s+emissiveMap\s*;/g,''));
  s=chunk(s,'emissivemap_fragment',code=>code.replace(/\bemissiveMap\b/g,'map'));
 }
 if(roughnessAlpha){
  s=chunk(s,'roughnessmap_pars_fragment',code=>code.replace(/uniform\s+sampler2D\s+roughnessMap\s*;/g,''));
  s=chunk(s,'roughnessmap_fragment',code=>code.replace(/\broughnessMap\b/g,'normalMap').replace(/texelRoughness\.g/g,'texelRoughness.a'));
 }
 shader.fragmentShader=s;
}
export function createMaterialSamplerSharing(){
 const records=new Map();let disposed=false;
 function prepareMaterial(material){
  if(!material?.isMeshStandardMaterial||records.has(material))return;
  const bump=!!material.map&&material.bumpMap===material.map;
  const emissive=!!material.map&&material.emissiveMap===material.map;
  const roughnessAlpha=/^wet-flagstone-\d+$/.test(material.name)&&!!material.normalMap&&!!material.roughnessMap;
  if(!bump&&!emissive&&!roughnessAlpha){records.set(material,null);return;}
  const before=material.onBeforeCompile,cache=material.customProgramCacheKey;
  const oldCacheValue=cache.call(material),originalNormal=material.normalMap,originalRoughness=material.roughnessMap;
  const packed=roughnessAlpha?packNormalRoughness(originalNormal,originalRoughness):null;
  if(packed){material.normalMap=packed;material.roughnessMap=packed;}
  const flags={bump,emissive,roughnessAlpha};
  const beforeWrapper=function(shader,renderer){before.call(this,shader,renderer);shareSamplerShader(shader,flags);};
  const cacheWrapper=()=>oldCacheValue+'|shared-native-samplers-v1:'+Number(bump)+Number(emissive)+Number(roughnessAlpha);
  material.onBeforeCompile=beforeWrapper;material.customProgramCacheKey=cacheWrapper;material.needsUpdate=true;
  records.set(material,{before,cache,beforeWrapper,cacheWrapper,originalNormal,originalRoughness,packed,flags});
 }
 return {
  prepare(scene){if(disposed)throw Error('Sampler-sharing owner disposed');scene.traverse(o=>{if(!o.isMesh)return;for(const material of Array.isArray(o.material)?o.material:[o.material])prepareMaterial(material);});},
  info(){const changed=[...records].filter(([,r])=>r);return {materialsVisited:records.size,materialsOptimized:changed.length,packedStoneTextures:changed.filter(([,r])=>r.packed).length,policy:'Identical source texture aliases; original normal RGB plus original roughness green in alpha. No lighting or geometry removal.',materials:changed.map(([m,r])=>({name:m.name,...r.flags}))};},
  dispose(){if(disposed)return;disposed=true;for(const[material,r]of records){if(!r)continue;if(material.onBeforeCompile===r.beforeWrapper)material.onBeforeCompile=r.before;if(material.customProgramCacheKey===r.cacheWrapper)material.customProgramCacheKey=r.cache;if(r.packed){if(material.normalMap===r.packed)material.normalMap=r.originalNormal;if(material.roughnessMap===r.packed)material.roughnessMap=r.originalRoughness;r.packed.dispose();}material.needsUpdate=true;}records.clear();}
 };
}
