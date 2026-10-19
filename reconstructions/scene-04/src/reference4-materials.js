import {stoneMaterial} from './scene04-surfaces.js';
import {scannedStoneMaps,scannedStoneRepeatMetres} from './scene04-scanned-stone.js';
import * as T from 'three';
let generatedMaps=null;
let generatedMapsPromise=null;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const linearToSrgb=x=>x<=.0031308?12.92*x:1.055*Math.pow(x,1/2.4)-.055;
function textureFromMaterialSource(T,source,name){
  const image=source.image,width=image.width,height=image.height,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw Error('Canvas readback unavailable for generated material '+name);
  context.drawImage(image,0,0);const sourcePixels=context.getImageData(0,0,width,height).data,count=width*height,luma=new Float32Array(count);let mean=0,square=0;
  for(let i=0;i<count;i++){const r=sourcePixels[i*4]/255,g=sourcePixels[i*4+1]/255,b=sourcePixels[i*4+2]/255,v=.2126*r+.7152*g+.0722*b;luma[i]=v;mean+=v;square+=v*v;}
  mean/=count;const sigma=Math.max(.015,Math.sqrt(Math.max(0,square/count-mean*mean))),albedo=new Uint8Array(count*4),heightMap=new Uint8Array(count*4),roughness=new Uint8Array(count*4);
  for(let i=0;i<count;i++){const z=clamp((luma[i]-mean)/sigma,-1.6,1.6),albedoValue=Math.round(255*linearToSrgb(clamp(.82+.055*z))),heightValue=Math.round(255*clamp(.5+.13*z)),roughnessValue=Math.round(255*clamp(.83-.055*z));for(const [data,value]of[[albedo,albedoValue],[heightMap,heightValue],[roughness,roughnessValue]]){const at=i*4;data[at]=data[at+1]=data[at+2]=value;data[at+3]=255;}}
  const make=(data,label,color=false)=>{const t=new T.DataTexture(data,width,height,T.RGBAFormat);t.name='generated-'+name+'-'+label;t.wrapS=t.wrapT=T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.anisotropy=8;if(color)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;};
  source.dispose();return{albedo:make(albedo,'neutralized-albedo',true),height:make(heightMap,'microheight'),roughness:make(roughness,'roughness'),sourceStatistics:{meanLuma:mean,lumaSigma:sigma,dimensions:[width,height]}};
}
export function loadReference4GeneratedMaps(){
  if(generatedMaps)return Promise.resolve(generatedMaps);
  if(generatedMapsPromise)return generatedMapsPromise;
  generatedMapsPromise=(async()=>{
    const root=new URL('../assets/generated-materials-20261019/',import.meta.url),loader=new T.TextureLoader(),items=await Promise.all([
      ['wood','lacquered-cedar-source.png'],['granite','warm-granite-source.png'],['slate','charcoal-mineral-source.png']
    ].map(async([key,file])=>{const source=await loader.loadAsync(new URL(file,root).href);return[key,textureFromMaterialSource(T,source,key)];}));
    generatedMaps=Object.fromEntries(items);return generatedMaps;
  })();return generatedMapsPromise;
}
export function getReference4GeneratedMaps(){if(!generatedMaps)throw Error('Generated PBR material detail is not ready');return generatedMaps;}
// Material successor prepared against the actually viewed reference-4 v3.
// Pure material/texture construction; no exposure, lighting, or geometry edits.
export function createReference4MaterialSet(T, options={}) {
  if(!generatedMaps)throw Error('Generated PBR material detail must load before scene04 construction');
  const palette={
    cedar:[0x81442b,.84,0],red:[0x91452e,.82,0],endwood:[0x875a39,.84,0],darkwood:[0x302018,.88,0],
    gold:[0xd0a34e,.34,.70],oldgold:[0xa77c3d,.57,.54],black:[0x272b29,.65,.08],
    slate:[0x38434b,.76,0],tileEdge:[0x717878,.81,0],stone:[0x62676c,.95,0],
    granite:[0x73777b,.95,0],plaster:[0xc4baa3,.92,0],paper:[0xb5aa8c,.97,0]
  };
  const materials=[],textures=[],mats={};
  for(const [key,[color,roughness,metalness]] of Object.entries(palette)) {
    const woodLike=['cedar','red','endwood','darkwood'].includes(key);
    const m=options.materials?.[key]||(['stone','granite'].includes(key)?stoneMaterial('reference4_'+key,color,{seed:key==='stone'?31:73}):key==='slate'?new T.MeshPhysicalMaterial({name:'kiln-fired-ceramic',color,roughness:.47,metalness:0,envMapIntensity:.38,clearcoat:.12,clearcoatRoughness:.34}):woodLike?new T.MeshPhysicalMaterial({name:'reference4_'+key,color,roughness,metalness,clearcoat:key==='darkwood'?.08:.18,clearcoatRoughness:.32}):new T.MeshStandardMaterial({name:'reference4_'+key,color,roughness,metalness}));
    mats[key]=m;if(!options.materials?.[key])materials.push(m);
  }
  const wood=generatedMaps.wood.albedo,woodHeight=generatedMaps.wood.height,stone=generatedMaps.slate.albedo,stoneHeight=generatedMaps.slate.height;
  const generatedTextureSet=Object.values(generatedMaps).flatMap(m=>[m.albedo,m.height,m.roughness]);textures.push(...generatedTextureSet);
  for(const key of ['red','cedar','endwood','darkwood'])if(materials.includes(mats[key])) {
    Object.assign(mats[key],{map:wood,bumpMap:woodHeight,bumpScale:key==='red'?.0045:.0035,roughnessMap:generatedMaps.wood.roughness});
  }
  for(const key of ['slate'])if(materials.includes(mats[key])) {
    Object.assign(mats[key],{map:stone,bumpMap:stoneHeight,bumpScale:.0028,roughnessMap:generatedMaps.slate.roughness});
  }
  for(const key of['stone','granite'])if(mats[key]?.userData.maps){
    const material=mats[key],old=material.userData.maps;for(const texture of Object.values(old))textures.push(texture);
    material.map=generatedMaps.granite.albedo;material.bumpMap=generatedMaps.granite.height;material.bumpScale=.0022;material.roughnessMap=generatedMaps.granite.roughness;
    material.userData.maps={...old,map:material.map,bumpMap:material.bumpMap,roughnessMap:material.roughnessMap};
  }
  // The entrance tread caps are warmer limestone-granite than the garden
  // paving. Give the real staircase blocks their own muted ochre-gray response.
  if(!scannedStoneMaps)throw Error('The licensed granite scan must load before stair material construction');
  const baseGranite=mats.granite,stairGranite=baseGranite.clone(),stairMapScale=1/scannedStoneRepeatMetres,baseCompile=baseGranite.onBeforeCompile;
  stairGranite.name='reference4-warm-weathered-scanned-stair-granite';stairGranite.color.set('#8b7d69');stairGranite.roughness=.94;
  stairGranite.map=scannedStoneMaps.map;stairGranite.normalMap=scannedStoneMaps.normalMap;stairGranite.normalScale.set(.78,.78);stairGranite.roughnessMap=scannedStoneMaps.roughnessMap;stairGranite.bumpMap=null;
  stairGranite.onBeforeCompile=shader=>{baseCompile(shader);const old='ssPosition*4.0',scale=`ssPosition*${stairMapScale.toFixed(8)}`;if(!shader.fragmentShader.includes(old))throw Error('Pinned triplanar stair-granite mapping changed');shader.fragmentShader=shader.fragmentShader.replaceAll(old,scale);};
  stairGranite.customProgramCacheKey=()=>`${baseGranite.customProgramCacheKey()}-cc0-stair-${stairMapScale.toFixed(5)}`;
  stairGranite.userData.maps={map:stairGranite.map,normalMap:stairGranite.normalMap,roughnessMap:stairGranite.roughnessMap};stairGranite.userData.physicalTextureRepeatMetres=scannedStoneRepeatMetres;stairGranite.userData.materialProvider='Poly Haven Granite Tile 04, CC0-1.0';
  materials.push(stairGranite);mats.stairGranite=stairGranite;
  const tiles=mats.slate.clone();tiles.name='reference4_variegated_tiles';tiles.vertexColors=true;
  tiles.onBeforeCompile=mats.slate.onBeforeCompile;tiles.customProgramCacheKey=mats.slate.customProgramCacheKey;
  materials.push(tiles);mats.tiles=tiles;
  return {mats,materials,textures,palette};
}
