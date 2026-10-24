import {loadScannedGardenStones} from './scene04-scanned-garden-stones.js';
let kit=null;
export async function loadReference4ForegroundScans(){kit=await loadScannedGardenStones();return kit.info;}
// Only four dominant near boulders. The rest of the garden and its seeded
// placement sequence remain the existing reconstruction.
export function foregroundScan04(name,sx,sz){
 const slots={'foreground-heavy-boulder--1':3,'foreground-heavy-boulder-1':2,'secondary-front-boulder--1':0,'secondary-front-boulder-1':4};
 if(!(name in slots))return null;if(!kit)throw Error('Foreground scan geometry must load before scene04 construction');
 const variant=kit.variants[slots[name]],geometry=variant.geometry.clone(),scale=Math.max(sx,sz);geometry.scale(scale,scale,scale);geometry.computeBoundingBox();
 const material=variant.dry.clone();material.name='scene04-real-moss-boulder-'+slots[name];material.color.setRGB(.40,.66,1.18);material.roughness=.92;material.normalScale?.set(.75,.75);
 return{geometry,material,source:{...kit.info,variant:slots[name],uniformScale:scale,nonuniformStretch:false}};
}
export function disposeReference4ForegroundScans(){if(!kit)return;kit.variants.forEach(v=>{v.geometry.dispose();v.dry.dispose();v.wet.dispose();});kit.dispose();kit=null;}
