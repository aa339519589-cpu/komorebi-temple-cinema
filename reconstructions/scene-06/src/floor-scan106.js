import * as T from 'three';

export async function loadFloorSurface106(){
 const root=new URL('/assets/polyhaven/lacquered-cherry-wood/',location.origin),loader=new T.TextureLoader();
 const [map,roughnessMap,record]=await Promise.all([
  loader.loadAsync(new URL('diffuse-2k.jpg',root).href),
  loader.loadAsync(new URL('roughness-2k.jpg',root).href),
  fetch(new URL('../assets/floor-scan106/material.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Missing floor106 material record');return r.json();})
 ]);
 map.colorSpace=T.SRGBColorSpace;
 for(const t of[map,roughnessMap]){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;t.rotation=record.grainRotationRadians;t.center.set(.5,.5);t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;}
 return{map,roughnessMap,record};
}

export function bindFloorScan106(material,grain,source){
 if(!source)return;
 const rough=source.roughnessMap.clone();rough.repeat.copy(grain.repeat);rough.offset.copy(grain.offset);rough.rotation=grain.rotation;rough.center.copy(grain.center);rough.needsUpdate=true;
 material.roughnessMap=rough;material.roughness=source.record.roughnessMultiplier;
 material.userData.floorScan106={source:'Existing Poly Haven CC0 lacquered cherry wood',authoredMeanReflectance:source.record.authoredTargetLinearMeanRGB,photographicAcceptance:false};
}
