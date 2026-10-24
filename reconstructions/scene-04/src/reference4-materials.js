import {applyStoneFinish212} from './scene04-stone-finish212.js';
import {stoneMaterial} from './scene04-surfaces.js';
import {scannedStoneMaps,scannedStoneRepeatMetres,createNeutralScannedGranite04} from './scene04-scanned-stone.js';
import * as T from 'three';
let generatedMaps=null;
let scannedCedar164=null;
let generatedMapsPromise=null;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const linearToSrgb=x=>x<=.0031308?12.92*x:1.055*Math.pow(x,1/2.4)-.055;
function textureFromMaterialSource(T,source,name){
  const image=source.image,width=image.width,height=image.height,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw Error('Canvas readback unavailable for generated material '+name);
  context.drawImage(image,0,0);const sourcePixels=context.getImageData(0,0,width,height).data,count=width*height,luma=new Float32Array(count);let mean=0,square=0;
  for(let i=0;i<count;i++){const r=sourcePixels[i*4]/255,g=sourcePixels[i*4+1]/255,b=sourcePixels[i*4+2]/255,v=.2126*r+.7152*g+.0722*b;luma[i]=v;mean+=v;square+=v*v;}
  mean/=count;const sigma=Math.max(.015,Math.sqrt(Math.max(0,square/count-mean*mean))),albedo=new Uint8Array(count*4),heightMap=new Uint8Array(count*4),roughness=new Uint8Array(count*4);
  for(let i=0;i<count;i++){const z=clamp((luma[i]-mean)/sigma,-1.6,1.6),timber=name==='wood',albedoValue=Math.round(255*linearToSrgb(clamp(timber?.77+.13*z:.82+.055*z))),heightValue=Math.round(255*clamp(.5+.13*z)),roughnessValue=Math.round(255*clamp(timber?.78-.105*z:.83-.055*z));for(const [data,value]of[[albedo,albedoValue],[heightMap,heightValue],[roughness,roughnessValue]]){const at=i*4;data[at]=data[at+1]=data[at+2]=value;data[at+3]=255;}}
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
    const generated=Object.fromEntries(items);
    // Frozen CC0 scan, with diffuse chroma removed so the timber palette owns
    // its warm varnish. The scan supplies genuine grain and tangent relief.
    const cedarRoot=new URL('/assets/polyhaven/lacquered-cherry-wood/',location.origin),[cedarDiffuse,cedarNormal,cedarRoughness]=await Promise.all(['diffuse-2k.jpg','normal-gl-2k.png','roughness-2k.jpg'].map(file=>loader.loadAsync(new URL(file,cedarRoot).href)));
    const cedar=textureFromMaterialSource(T,cedarDiffuse,'wood');
    for(const texture of[cedarNormal,cedarRoughness]){texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=8;texture.needsUpdate=true;}
    cedarNormal.name='scene04-CC0-lacquered-cherry-tangent-normal';
    // Keep the worn coating rough: the source photograph's polished lacquer
    // roughness is remapped to a weathered physical finish for exterior cedar.
    const image=cedarRoughness.image,canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,image.width,image.height).data;
    for(let i=0;i<data.length;i+=4){const v=Math.round(255*(.70+.26*data[i]/255));data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;}
    const roughness=new T.DataTexture(data,image.width,image.height,T.RGBAFormat);roughness.name='scene04-CC0-weathered-exterior-cedar-roughness';roughness.wrapS=roughness.wrapT=T.RepeatWrapping;roughness.generateMipmaps=true;roughness.minFilter=T.LinearMipmapLinearFilter;roughness.magFilter=T.LinearFilter;roughness.anisotropy=8;roughness.needsUpdate=true;cedarRoughness.dispose();
    scannedCedar164={albedo:cedar.albedo,height:cedar.height,normal:cedarNormal,roughness,sourceStatistics:cedar.sourceStatistics};
    generatedMaps=generated;return generatedMaps;
  })();return generatedMapsPromise;
}
export function getReference4GeneratedMaps(){if(!generatedMaps)throw Error('Generated PBR material detail is not ready');return generatedMaps;}
// Material successor prepared against the actually viewed reference-4 v3.
// Pure material/texture construction; no exposure, lighting, or geometry edits.
export function createReference4MaterialSet(T, options={}) {
  if(!generatedMaps)throw Error('Generated PBR material detail must load before scene04 construction');
  const palette={
    cedar:[0x60391f,.76,0],red:[0x6f2b13,.64,0],endwood:[0x73451f,.78,0],darkwood:[0x34190d,.78,0],
    gold:[0xd4a74b,.31,.86],oldgold:[0xac7f33,.49,.76],black:[0x20231f,.66,.03],
    slate:[0x3b4853,.64,0],tileEdge:[0x596264,.73,0],stone:[0x62676c,.95,0],
    granite:[0x73777b,.95,0],plaster:[0xc4baa3,.92,0],paper:[0xb5aa8c,.97,0]
  };
  const materials=[],textures=[],mats={};
  for(const [key,[color,roughness,metalness]] of Object.entries(palette)) {
    const woodLike=['cedar','red','endwood','darkwood'].includes(key);
    const m=options.materials?.[key]||(['stone','granite'].includes(key)?stoneMaterial('reference4_'+key,color,{seed:key==='stone'?31:73}):key==='slate'?new T.MeshPhysicalMaterial({name:'kiln-fired-ceramic',color,roughness:.43,metalness:0,envMapIntensity:.50,clearcoat:.16,clearcoatRoughness:.29}):woodLike?new T.MeshPhysicalMaterial({name:'reference4_'+key,color,roughness,metalness,clearcoat:key==='red'?.10:key==='darkwood'?.015:.045,clearcoatRoughness:key==='darkwood'?.60:.42}):new T.MeshStandardMaterial({name:'reference4_'+key,color,roughness,metalness}));
    mats[key]=m;if(!options.materials?.[key])materials.push(m);
  }
  const wood=scannedCedar164.albedo,woodHeight=scannedCedar164.height,stone=generatedMaps.slate.albedo,stoneHeight=generatedMaps.slate.height;
  const generatedTextureSet=Object.values(generatedMaps).flatMap(m=>[m.albedo,m.height,m.roughness]);textures.push(...generatedTextureSet,...[scannedCedar164.albedo,scannedCedar164.height,scannedCedar164.normal,scannedCedar164.roughness]);
  for(const key of ['red','cedar','endwood','darkwood'])if(materials.includes(mats[key])) {
    Object.assign(mats[key],{map:wood,normalMap:scannedCedar164.normal,normalScale:new T.Vector2(.52,.52),bumpMap:null,bumpScale:0,roughnessMap:scannedCedar164.roughness});
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
  const stairGranite=createNeutralScannedGranite04('reference4-neutral-weathered-stair-granite','#635e50',1.05);applyStoneFinish212(stairGranite);stairGranite.vertexColors=true;materials.push(stairGranite);mats.stairGranite=stairGranite;
  const retainingStone=createNeutralScannedGranite04('scene04-212-dark-damp-retaining-granite','#4b4c40',1.05);retainingStone.clearcoat=0;retainingStone.roughness=.98;applyStoneFinish212(retainingStone);materials.push(retainingStone);mats.retainingStone=retainingStone;
  const tiles=mats.slate.clone();tiles.name='reference4_variegated_tiles';tiles.vertexColors=true;
  tiles.onBeforeCompile=mats.slate.onBeforeCompile;tiles.customProgramCacheKey=mats.slate.customProgramCacheKey;
  materials.push(tiles);mats.tiles=tiles;
  return {mats,materials,textures,palette};
}
