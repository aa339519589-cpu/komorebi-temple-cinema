/** Lossless sampler consolidation for the existing scene's material textures. */
import * as T from '../vendor/build/three.module.js';
const PREFIX='KOMOREBI_';
const FLAGS=['BUMP_USES_MAP','EMISSIVE_USES_MAP','ROUGHNESS_USES_MAP','ROUGHNESS_IN_NORMAL_ALPHA'];
let installation=null;
function one(source,needle,replacement,label){if(source.split(needle).length!==2)throw Error('Pinned material shader changed: '+label);return source.replace(needle,replacement);}
export function patchMaterialSamplerChunks(input){
 const next={...input};
 for(const [chunk,uniform,flag] of [['bumpmap_pars_fragment','bumpMap','BUMP_USES_MAP'],['emissivemap_pars_fragment','emissiveMap','EMISSIVE_USES_MAP']])next[chunk]=one(next[chunk],`uniform sampler2D ${uniform};`,`#ifdef ${PREFIX+flag}\n #define ${uniform} map\n#else\n uniform sampler2D ${uniform};\n#endif`,chunk);
 next.roughnessmap_pars_fragment=one(next.roughnessmap_pars_fragment,'uniform sampler2D roughnessMap;',`#if defined(${PREFIX}ROUGHNESS_IN_NORMAL_ALPHA)\n #define roughnessMap normalMap\n#elif defined(${PREFIX}ROUGHNESS_USES_MAP)\n #define roughnessMap map\n#else\n uniform sampler2D roughnessMap;\n#endif`,'roughness uniform');
 next.roughnessmap_fragment=one(next.roughnessmap_fragment,'roughnessFactor *= texelRoughness.g;',`#ifdef ${PREFIX}ROUGHNESS_IN_NORMAL_ALPHA\n roughnessFactor *= texelRoughness.a;\n#else\n roughnessFactor *= texelRoughness.g;\n#endif`,'roughness channel');
 return next;
}
function equivalentSampling(a,b){
 const fields=['format','type','colorSpace','mapping','channel','wrapS','wrapT','minFilter','magFilter','anisotropy','generateMipmaps','flipY','premultiplyAlpha','unpackAlignment','rotation','matrixAutoUpdate'];
 return fields.every(k=>a[k]===b[k])&&['offset','repeat','center'].every(k=>a[k].equals(b[k]))&&(a.matrixAutoUpdate||a.matrix.equals(b.matrix));
}
export function packNormalRoughnessBytes(normal,roughness){
 if(!(normal instanceof Uint8Array)||!(roughness instanceof Uint8Array)||normal.length!==roughness.length||normal.length%4)throw Error('Require equal RGBA8 normal and roughness arrays');
 const data=new Uint8Array(normal);for(let i=0;i<data.length;i+=4)data[i+3]=roughness[i+1];return data;
}
export function canPackNormalRoughness(normal,roughness){
 return normal?.isDataTexture&&roughness?.isDataTexture&&normal!==roughness&&normal.format===T.RGBAFormat&&normal.type===T.UnsignedByteType&&normal.colorSpace===T.NoColorSpace&&roughness.colorSpace===T.NoColorSpace&&normal.image.width===roughness.image.width&&normal.image.height===roughness.image.height&&normal.image.data instanceof Uint8Array&&roughness.image.data instanceof Uint8Array&&normal.image.data.length===normal.image.width*normal.image.height*4&&roughness.image.data.length===normal.image.data.length&&normal.mipmaps.length===0&&roughness.mipmaps.length===0&&equivalentSampling(normal,roughness);
}
export function installMaterialSamplerPacking(){
 if(installation)return installation.acquire();
 if(T.REVISION!=='186')throw Error('Material sampler packing requires review for a different Three.js revision');
 const keys=['bumpmap_pars_fragment','emissivemap_pars_fragment','roughnessmap_pars_fragment','roughnessmap_fragment'];
 const originals=Object.fromEntries(keys.map(k=>[k,T.ShaderChunk[k]])),patched=patchMaterialSamplerChunks(originals);
 for(const key of keys)T.ShaderChunk[key]=patched[key];
 const materials=new Map(),textures=new Map();let users=0;
 function prepareMaterial(material){
  if(!material?.isMeshStandardMaterial)return;
  let record=materials.get(material);
  if(!record){record={material,normal:null,roughness:null,packed:null};materials.set(material,record);}
  // Native Material.clone() shares textures. Adopt provenance so that the
  // clone retains the original roughness signal in the packed alpha channel.
  if(!record.packed&&material.normalMap===material.roughnessMap&&textures.has(material.normalMap))Object.assign(record,textures.get(material.normalMap),{packed:material.normalMap});
  if(record.packed&&material.normalMap===record.packed&&material.roughnessMap===record.packed){
   if(record.normal.version!==record.normalVersion||record.roughness.version!==record.roughnessVersion){material.normalMap=record.normal;material.roughnessMap=record.roughness;record.packed=null;}
  }else if(record.packed)record.packed=null;
  if(!record.packed&&canPackNormalRoughness(material.normalMap,material.roughnessMap)){
   const normal=material.normalMap,roughness=material.roughnessMap;
   const packed=normal.clone();packed.name=(normal.name||material.name||'surface')+'-native-normal-roughness';
   packed.source=new T.Source({width:normal.image.width,height:normal.image.height,data:packNormalRoughnessBytes(normal.image.data,roughness.image.data)});
   packed.needsUpdate=true;record.normal=normal;record.roughness=roughness;record.normalVersion=normal.version;record.roughnessVersion=roughness.version;record.packed=packed;
   textures.set(packed,{normal,roughness,normalVersion:normal.version,roughnessVersion:roughness.version});
   material.normalMap=packed;material.roughnessMap=packed;material.needsUpdate=true;
  }
  const values={BUMP_USES_MAP:!!(material.map&&material.bumpMap===material.map),EMISSIVE_USES_MAP:!!(material.map&&material.emissiveMap===material.map),ROUGHNESS_USES_MAP:!!(!record.packed&&material.map&&material.roughnessMap===material.map),ROUGHNESS_IN_NORMAL_ALPHA:!!record.packed};
  let changed=false;const defines={...(material.defines||{})};
  for(const[flag,value]of Object.entries(values)){const k=PREFIX+flag;if(value){if(defines[k]!==1){defines[k]=1;changed=true;}}else if(k in defines){delete defines[k];changed=true;}}
  if(changed){material.defines=defines;material.needsUpdate=true;}
  record.flags=Object.entries(values).filter(([,value])=>value).map(([flag])=>flag);
 }
 function prepare(scene){
  const seen=new Set();const visit=material=>{if(Array.isArray(material)){material.forEach(visit);return;}if(material&&!seen.has(material)){seen.add(material);prepareMaterial(material);}};
  visit(scene.overrideMaterial);scene.traverse(object=>{if(object.isMesh)visit(object.material);});
 }
 const state={acquire(){users++;let disposed=false;return{prepare,info(){return{enabled:true,lightsRemoved:0,shadowsRemoved:0,textureMapsDiscarded:0,packedTextureCount:textures.size,materials:[...materials.values()].filter(r=>r.flags?.length).map(r=>({name:r.material.name,flags:r.flags,normalRgbUnchanged:!!r.packed,roughnessGreenStoredInNormalAlpha:!!r.packed}))};},dispose(){
  if(disposed)return;disposed=true;if(--users)return;
  for(const r of materials.values()){
   const m=r.material;if(r.packed&&m.normalMap===r.packed&&m.roughnessMap===r.packed){m.normalMap=r.normal;m.roughnessMap=r.roughness;}
   const d={...(m.defines||{})};for(const flag of FLAGS)delete d[PREFIX+flag];m.defines=d;m.needsUpdate=true;
  }
  for(const texture of textures.keys())texture.dispose();for(const key of keys)if(T.ShaderChunk[key]===patched[key])T.ShaderChunk[key]=originals[key];if(installation===state)installation=null;
 }}}};installation=state;return state.acquire();
}
