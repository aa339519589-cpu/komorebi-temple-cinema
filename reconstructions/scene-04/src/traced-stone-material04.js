import {loadAggregateRelief04} from './granite-aggregate04.js';
import * as T from 'three';
const loaded=new Map();
export async function loadTracedStoneMaps04(){
 await loadAggregateRelief04();
 const root=new URL('../assets/traced-stone04/',import.meta.url),manifest=await(await fetch(new URL('manifest.json',root))).json(),loader=new T.TextureLoader();
 await Promise.all(manifest.records.map(async r=>{
  const maps=await Promise.all(['basecolor','normal','roughness','wetlayer'].map(s=>loader.loadAsync(new URL(r.id+'-'+s+'.png',root).href)));
  const lo=r.boundsXZ[0],hi=r.boundsXZ[1];for(const [i,t]of maps.entries()){t.name=r.id+'-'+['basecolor','normal','roughness','wetlayer'][i];t.wrapS=t.wrapT=T.ClampToEdgeWrapping;t.repeat.set(1/(hi[0]-lo[0]),1/(hi[1]-lo[1]));t.offset.set(-lo[0]/(hi[0]-lo[0]),-lo[1]/(hi[1]-lo[1]));t.anisotropy=8;if(i===0)t.colorSpace=T.SRGBColorSpace;}
  loaded.set(r.id,{record:r,maps});
 }));return manifest;
}
export function tracedStoneMaterial04(record){
 const data=loaded.get(record.id);if(!data)throw Error('Missing individually authored stone material '+record.id);
 const [map,normalMap,roughnessMap,coat]=data.maps,m=new T.MeshPhysicalMaterial({name:'traced-granite-'+record.id,color:0xffffff,map,normalMap,normalScale:new T.Vector2(1,1),roughness:1,roughnessMap,metalness:0,ior:1.5,clearcoat:1,clearcoatMap:coat,clearcoatNormalMap:normalMap,clearcoatNormalScale:new T.Vector2(.85,.85),clearcoatRoughness:1,clearcoatRoughnessMap:coat,envMapIntensity:1.0});
 // Three's clearcoat uses n=1.5. This layer is a water film, so its normal-
 // incidence Fresnel reflectance is ((1.333-1)/(1.333+1))^2 instead.
 const waterF0=((1.333-1)/(1.333+1))**2;
 const diffuseProbeGain=.06;
 m.onBeforeCompile=shader=>{const old='material.clearcoatF0 = vec3( 0.04 );',diffuse='iblIrradiance += getIBLIrradiance( geometryNormal );';if(!shader.fragmentShader.includes('#include <lights_physical_fragment>')||!T.ShaderChunk.lights_fragment_maps.includes(diffuse))throw Error('Pinned physical shader changed');shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_fragment>',T.ShaderChunk.lights_physical_fragment.replace(old,`material.clearcoatF0 = vec3( ${waterF0.toFixed(9)} );`)).replace('#include <lights_fragment_maps>',T.ShaderChunk.lights_fragment_maps.replace(diffuse,`iblIrradiance += ${diffuseProbeGain.toFixed(5)} * getIBLIrradiance( geometryNormal );`));};
 m.customProgramCacheKey=()=> 'traced-stone04-water-film89-diffuse-probe06';m.userData.maps={map,normalMap,roughnessMap,clearcoatMap:coat};m.userData.diffuseProbeGain=diffuseProbeGain;m.userData.physicalTextureRepeatMetres=data.record.physicalGraniteRepeatMetres;m.userData.waterLayerIOR=1.333;m.userData.referenceRGBUsed=false;m.userData.materialHypotheses=data.record;return m;
}
