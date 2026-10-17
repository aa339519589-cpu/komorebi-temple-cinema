/** Exact-channel sampler compaction for the remaining v60 shader overflows.
 * Botanical aliases require the exact same Texture object. Wet stone packs
 * unmodified normal RGB and roughness G into independent RGBA channels.
 * No geometry, light, shadow, color coefficient or alpha silhouette is removed.
 */
import * as T from '../vendor/build/three.module.js';
const FLAGS=['KOMOREBI_BUMP_USES_MAP','KOMOREBI_EMISSIVE_USES_MAP','KOMOREBI_ROUGHNESS_IN_NORMAL_ALPHA'];
const CHUNKS=['bumpmap_pars_fragment','emissivemap_pars_fragment','roughnessmap_pars_fragment','roughnessmap_fragment'];
let installed=null;
function replaceOne(source,oldText,newText,label){if(source.split(oldText).length!==2)throw Error('Pinned sampler chunk changed: '+label);return source.replace(oldText,newText);}
export function patchMaterialSamplerChunks(input){
 const out={...input};
 out.bumpmap_pars_fragment=replaceOne(out.bumpmap_pars_fragment,'uniform sampler2D bumpMap;',`#ifdef KOMOREBI_BUMP_USES_MAP\n#define bumpMap map\n#else\nuniform sampler2D bumpMap;\n#endif`,'bump');
 out.emissivemap_pars_fragment=replaceOne(out.emissivemap_pars_fragment,'uniform sampler2D emissiveMap;',`#ifdef KOMOREBI_EMISSIVE_USES_MAP\n#define emissiveMap map\n#else\nuniform sampler2D emissiveMap;\n#endif`,'emissive');
 out.roughnessmap_pars_fragment=replaceOne(out.roughnessmap_pars_fragment,'uniform sampler2D roughnessMap;',`#ifndef KOMOREBI_ROUGHNESS_IN_NORMAL_ALPHA\nuniform sampler2D roughnessMap;\n#endif`,'roughness declaration');
 out.roughnessmap_fragment=replaceOne(out.roughnessmap_fragment,'vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );',`#ifdef KOMOREBI_ROUGHNESS_IN_NORMAL_ALPHA\nvec4 texelRoughness = texture2D( normalMap, vRoughnessMapUv );\ntexelRoughness.g = texelRoughness.a;\n#else\nvec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );\n#endif`,'roughness sample');
 return out;
}
export function packNormalRoughnessBytes(normal,roughness){
 if(!(normal instanceof Uint8Array)||!(roughness instanceof Uint8Array)||normal.length!==roughness.length||normal.length%4)throw Error('Require equally-sized RGBA8 maps');
 const out=new Uint8Array(normal.length);for(let i=0;i<out.length;i+=4){out[i]=normal[i];out[i+1]=normal[i+1];out[i+2]=normal[i+2];out[i+3]=roughness[i+1];}return out;
}
function packedTexture(normal,roughness){
 const a=normal?.image,b=roughness?.image;
 if(!normal?.isDataTexture||!roughness?.isDataTexture||normal.type!==T.UnsignedByteType||roughness.type!==T.UnsignedByteType||normal.format!==T.RGBAFormat||roughness.format!==T.RGBAFormat||normal.colorSpace!==T.NoColorSpace||roughness.colorSpace!==T.NoColorSpace||normal.premultiplyAlpha||roughness.premultiplyAlpha||!a||!b||a.width!==b.width||a.height!==b.height)throw Error('Wet-stone packing requires matching linear RGBA8 normal and roughness textures');
 for(const key of ['wrapS','wrapT','magFilter','minFilter','generateMipmaps','anisotropy','flipY'])if(normal[key]!==roughness[key])throw Error('Wet-stone sampling differs at '+key);
 const texture=new T.DataTexture(packNormalRoughnessBytes(a.data,b.data),a.width,a.height,T.RGBAFormat,T.UnsignedByteType);
 for(const key of ['mapping','wrapS','wrapT','magFilter','minFilter','generateMipmaps','anisotropy','flipY','channel','unpackAlignment'])texture[key]=normal[key];
 texture.colorSpace=T.NoColorSpace;texture.offset.copy(normal.offset);texture.repeat.copy(normal.repeat);texture.center.copy(normal.center);texture.rotation=normal.rotation;texture.matrix.copy(normal.matrix);texture.matrixAutoUpdate=normal.matrixAutoUpdate;
 texture.name=normal.name+'-normal-rgb-roughness-a';texture.needsUpdate=true;return texture;
}
export function installMaterialSamplerCompatibility(){
 if(installed)return installed.acquire();
 if(T.REVISION!=='186')throw Error('Review sampler compaction before upgrading Three.js');
 const originals=Object.fromEntries(CHUNKS.map(k=>[k,T.ShaderChunk[k]])),patched=patchMaterialSamplerChunks(originals);
 for(const [key,value] of Object.entries(patched))T.ShaderChunk[key]=value;
 const records=new Map(),packedOrigins=new WeakMap();let users=0,prepared=0;
 function release(material){
  const record=records.get(material);if(!record)return;
  material.removeEventListener('dispose',record.onDispose);
  if(record.packed&&material.normalMap===record.packed)material.normalMap=record.normal;
  record.packed?.dispose();
  if(material.defines)for(const key of FLAGS){if(record.savedDefines[key]===undefined)delete material.defines[key];else material.defines[key]=record.savedDefines[key];}
  material.needsUpdate=true;records.delete(material);
 }
 function flag(material,key,enabled){
  const present=material.defines?.[key]===1;if(present===enabled)return;
  if(!material.defines)material.defines={};if(enabled)material.defines[key]=1;else delete material.defines[key];material.needsUpdate=true;
 }
 function prepareMaterial(material){
  if(!material?.isMeshStandardMaterial)return;
  let record=records.get(material);
  if(record?.packed&&(material.normalMap!==record.packed||material.roughnessMap!==record.roughness)){release(material);record=null;}
  const shareBump=!!material.map&&material.bumpMap===material.map,shareEmissive=!!material.map&&material.emissiveMap===material.map;
  const wetStone=/^wet-flagstone-\d+$/.test(material.name)&&!!material.normalMap&&!!material.roughnessMap;
  if(!record&&!shareBump&&!shareEmissive&&!wetStone)return;
  if(!record){
   record={savedDefines:Object.fromEntries(FLAGS.map(k=>[k,material.defines?.[k]])),packed:null,normal:null,roughness:null,onDispose:()=>release(material)};
   records.set(material,record);material.addEventListener('dispose',record.onDispose);prepared++;
   if(wetStone){const source=packedOrigins.get(material.normalMap);record.normal=source?.normal||material.normalMap;record.roughness=material.roughnessMap;record.packed=packedTexture(record.normal,record.roughness);packedOrigins.set(record.packed,{normal:record.normal,roughness:record.roughness});material.normalMap=record.packed;material.needsUpdate=true;}
  }
  flag(material,FLAGS[0],shareBump);flag(material,FLAGS[1],shareEmissive);flag(material,FLAGS[2],!!record.packed);
 }
 const state={acquire(){users++;let released=false;return{
  prepareScene(scene){if(released)throw Error('Sampler compatibility lease is disposed');scene.traverse(object=>{const materials=Array.isArray(object.material)?object.material:[object.material];for(const material of materials)prepareMaterial(material)});},
  prepareMaterial,
  info(){return{preparedMaterials:prepared,liveMaterials:records.size,packedStoneMaterials:[...records.values()].filter(r=>r.packed).length,botanicalPolicy:'Alias only identical Texture objects; every original UV channel/transform retained',stonePolicy:'Original normal RGB plus original roughness G in alpha; native filtering and mipmaps retained',lightsRemoved:0,shadowsRemoved:0,geometryRemoved:0};},
  dispose(){if(released)return;released=true;if(--users)return;for(const material of [...records.keys()])release(material);for(const key of CHUNKS)if(T.ShaderChunk[key]===patched[key])T.ShaderChunk[key]=originals[key];if(installed===state)installed=null;}
 }}};
 installed=state;return state.acquire();
}
