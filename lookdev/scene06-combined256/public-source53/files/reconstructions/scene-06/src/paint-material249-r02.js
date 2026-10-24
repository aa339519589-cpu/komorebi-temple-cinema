import * as T from 'three';

// Independent board-surface namespace. No geometry, layout, camera, light,
// reference-image projection, shader patch, or emissive layer is created here.
const base249=new URL('../assets/coffer249/',import.meta.url);
const variants249=Object.freeze({'rear-dark':Object.freeze({revision:'r02',albedo:'coffer-rear-dark-r02-albedo.png',metalness:'coffer-rear-dark-r02-metalness.png',roughness:'coffer-rear-dark-r02-roughness.png'})});
const loaded249=new Map(),pending249=new Map();

function specification249(variant){
 const spec=variants249[variant];if(!spec)throw Error('Unknown coffer249 paint variant: '+variant);return spec;
}

export async function loadPaintMaterial249({variant='rear-dark',anisotropy=8}={}){
 if(loaded249.has(variant))return loaded249.get(variant);
 if(pending249.has(variant))return pending249.get(variant);
 const spec=specification249(variant);
 const promise=(async()=>{
  const loader=new T.TextureLoader();
  const [map,metalnessMap,roughnessMap]=await Promise.all([spec.albedo,spec.metalness,spec.roughness].map(file=>loader.loadAsync(new URL(file,base249).href)));
  for(const texture of[map,metalnessMap,roughnessMap]){texture.wrapS=texture.wrapT=T.ClampToEdgeWrapping;texture.anisotropy=anisotropy;}
  map.name='coffer249-'+variant+'-'+spec.revision+'-independent-pigment-albedo';map.colorSpace=T.SRGBColorSpace;
  metalnessMap.name='coffer249-'+variant+'-'+spec.revision+'-linear-metalness';metalnessMap.colorSpace=T.NoColorSpace;
  roughnessMap.name='coffer249-'+variant+'-'+spec.revision+'-linear-roughness';roughnessMap.colorSpace=T.NoColorSpace;
  const data=Object.freeze({variant,revision:spec.revision,map,metalnessMap,roughnessMap});loaded249.set(variant,data);return data;
 })();
 pending249.set(variant,promise);
 try{return await promise;}finally{pending249.delete(variant);}
}

export function createPaintMaterial249({variant='rear-dark'}={}){
 specification249(variant);
 const data=loaded249.get(variant);if(!data)throw Error('Call await loadPaintMaterial249({variant}) before createPaintMaterial249({variant})');
 const material=new T.MeshStandardMaterial({name:'coffer249-'+variant+'-'+data.revision+'-matte-painted-wood',color:0xffffff,map:data.map,metalness:1,metalnessMap:data.metalnessMap,roughness:1,roughnessMap:data.roughnessMap,emissive:0x000000,emissiveIntensity:0,envMapIntensity:.20,transparent:false,opacity:1,depthWrite:true,side:T.FrontSide});
 material.userData.coffer249={variant,revision:data.revision,independentAuthoredSurface:true,physicalPanelAspect:.6,referenceSceneRGBUsed:false,bakedLighting:false,emission:false,materialOnly:true,woodGeometryOwnedByRoom:true,photographicAcceptance:false};
 return material;
}
