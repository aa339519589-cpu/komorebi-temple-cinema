/** Exact sampler sharing for identical maps and lossless normal/roughness channel packing. */
import * as T from '../vendor/build/three.module.js';
const textureKeys=['map','normalMap','roughnessMap','bumpMap','emissiveMap','metalnessMap','alphaMap','aoMap'];
const guarded=new WeakMap();
const packedByNormal=new WeakMap();
const ownedPacked=new Set();
const notes=new Map();
function equalSettings(a,b){
 const scalar=['format','type','colorSpace','mapping','channel','wrapS','wrapT','magFilter','minFilter','anisotropy','flipY','premultiplyAlpha','generateMipmaps','unpackAlignment'];
 if(scalar.some(k=>a[k]!==b[k]))return false;
 if(a.matrixAutoUpdate)a.updateMatrix();if(b.matrixAutoUpdate)b.updateMatrix();
 return a.matrix.equals(b.matrix);
}
export function packNormalRoughness(normal,roughness){
 if(normal===roughness&&normal?.userData?.komorebiRoughnessInAlpha)return normal;
 const ni=normal?.image,ri=roughness?.image;
 if(!normal?.isDataTexture||!roughness?.isDataTexture||!equalSettings(normal,roughness)||normal.format!==T.RGBAFormat||normal.type!==T.UnsignedByteType||normal.colorSpace!==T.NoColorSpace||ni.width!==ri.width||ni.height!==ri.height||!(ni.data instanceof Uint8Array)||!(ri.data instanceof Uint8Array))throw Error('Normal/roughness packing requires equal native linear RGBA8 grids and samplers');
 let cache=packedByNormal.get(normal);if(cache?.has(roughness))return cache.get(roughness);
 const data=ni.data.slice();for(let i=0;i<data.length;i+=4)data[i+3]=ri.data[i+1];
 const texture=new T.DataTexture();texture.copy(normal);texture.source=new T.Source({data,width:ni.width,height:ni.height});texture.name='native-normal-rgb-roughness-a';texture.userData={...normal.userData,komorebiRoughnessInAlpha:true};texture.needsUpdate=true;
 if(!cache){cache=new WeakMap();packedByNormal.set(normal,cache);}cache.set(roughness,texture);ownedPacked.add(texture);return texture;
}
function expandIncludes(source,depth=0){
 if(depth>32)throw Error('Shader chunk include cycle');
 return source.replace(/^[ \t]*#include +<([\w\d./]+)>/gm,(all,name)=>{const chunk=T.ShaderChunk[name];if(typeof chunk!=='string')throw Error('Unknown pinned shader chunk '+name);return expandIncludes(chunk,depth+1);});
}
export function shareFragmentSamplers(fragment,aliases,packed){
 let source=expandIncludes(fragment);
 if(packed){const before='roughnessFactor *= texelRoughness.g;';if(!source.includes(before)&&!source.includes('roughnessFactor *= texelRoughness.a;'))throw Error('Pinned roughness channel hook changed');source=source.replace(before,'roughnessFactor *= texelRoughness.a;');}
 for(const [alias,target] of aliases){
  source=source.replace(new RegExp('uniform\\s+sampler2D\\s+'+alias+'\\s*;','g'),'');
  source=source.replace(new RegExp('\\b'+alias+'\\b','g'),target);
 }
 return source;
}
export function prepareMaterialSamplers(material){
 if(!material?.isMeshStandardMaterial||!/^(foliageGreen|foliageDark|foliageGold|foliageRed|needleGreen|wet-flagstone-[0-7])$/.test(material.name))return;
 if(/^wet-flagstone-[0-7]$/.test(material.name)&&material.normalMap&&material.roughnessMap&&material.normalMap!==material.roughnessMap){const packed=packNormalRoughness(material.normalMap,material.roughnessMap);material.normalMap=material.roughnessMap=packed;material.needsUpdate=true;}
 const aliases=[],seen=new Map();for(const key of textureKeys){const texture=material[key];if(!texture?.isTexture)continue;if(seen.has(texture))aliases.push([key,seen.get(texture)]);else seen.set(texture,key);}
 const packed=material.normalMap===material.roughnessMap&&!!material.normalMap?.userData?.komorebiRoughnessInAlpha;
 if(!aliases.length&&!packed)return;
 const signature=JSON.stringify({aliases,packed}),prior=guarded.get(material);
 if(prior&&material.onBeforeCompile===prior.compile&&material.customProgramCacheKey===prior.key&&prior.signature===signature)return;
 const originalCompile=material.onBeforeCompile,originalKey=material.customProgramCacheKey;
 const compile=function(shader,renderer){originalCompile.call(this,shader,renderer);shader.fragmentShader=shareFragmentSamplers(shader.fragmentShader,aliases,packed);};
 const key=function(){const context=Object.create(this);context.onBeforeCompile=originalCompile;return originalKey.call(context)+'|komorebi-exact-sampler-sharing-v1:'+signature;};
 material.onBeforeCompile=compile;material.customProgramCacheKey=key;material.needsUpdate=true;
 guarded.set(material,{compile,key,signature});notes.set(material.uuid,{name:material.name,type:material.type,aliases,roughnessInNormalAlpha:packed,removedLights:0,removedMaps:0});
}
export function installMaterialSamplerSharing(renderer){
 const originalRender=renderer.render.bind(renderer);let busy=false;
 renderer.render=function(scene,camera){
  if(!busy){busy=true;try{const materials=new Set();scene.traverseVisible(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});for(const material of materials)prepareMaterialSamplers(material);}finally{busy=false;}}
  return originalRender(scene,camera);
 };
 renderer.materialSamplerSharingInfo=()=>({policy:'Same Texture object aliases retain all original UVs and channels; wet-stone normal RGB and roughness green bytes packed without resampling',materials:[...notes.values()],packedTextures:ownedPacked.size});
}
