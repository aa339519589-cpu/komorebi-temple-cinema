import * as T from 'three';

// One source image is shared by native and portable Cycles materials. The
// original scanned spatial variation survives the documented numeric remap.
export async function installBridgeCoating(M,materials,textures){
  const roughness=await new T.TextureLoader().loadAsync(new URL('../assets/bridge-coating-roughness-2k.png',import.meta.url).href);
  roughness.colorSpace=T.NoColorSpace;roughness.wrapS=roughness.wrapT=T.RepeatWrapping;roughness.anisotropy=8;roughness.needsUpdate=true;textures.push(roughness);
  M.bridgeRed=M.red.clone();M.bridgeRed.name='scene09-bridge-vermilion-coating';M.bridgeRed.onBeforeCompile=M.red.onBeforeCompile;M.bridgeRed.customProgramCacheKey=M.red.customProgramCacheKey;materials.push(M.bridgeRed);
  M.bridgeTimber.name='scene09-bridge-structural-wood';M.bridgeDeck.name='scene09-bridge-deck-wood';
  for(const material of[M.bridgeRed,M.bridgeTimber,M.bridgeDeck]){material.roughnessMap=roughness;material.roughness=1;material.needsUpdate=true;}
  return{revision:'scene09-bridge-shared-roughness-74',image:'reconstructions/scene-09/assets/bridge-coating-roughness-2k.png',formula:'roughness = 0.50 + 0.20 * originalScanG',factor:1,scope:'Three bridge coatings only; source albedo/colors/normals/metalness/IOR/lights/exposure retained'};
}
