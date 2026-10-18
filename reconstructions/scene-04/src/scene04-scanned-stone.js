import * as T from 'three';
export let scannedStoneMaps=null;
export const scannedStoneRepeatMetres=2*650/4096;
export async function loadScannedStoneMaps(){
 const loader=new T.TextureLoader(),names=['diff','rough','nor_gl'];
 const maps=await Promise.all(names.map(name=>loader.loadAsync(new URL(`../assets/granite-tile-04/granite-face-${name}.png`,import.meta.url).href)));
 for(const [i,t] of maps.entries()){t.name='CC0-PolyHaven-granite-tile04-single-face-'+names[i];t.wrapS=t.wrapT=T.MirroredRepeatWrapping;t.anisotropy=8;if(i===0)t.colorSpace=T.SRGBColorSpace;}
 scannedStoneMaps={map:maps[0],roughnessMap:maps[1],normalMap:maps[2]};return scannedStoneMaps;
}
