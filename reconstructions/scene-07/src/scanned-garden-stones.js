import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// The scan supplies each stone's eroded outline and surface. Placement, size,
// banks and waterfalls remain three-dimensional scene construction.
export async function loadScannedGardenStones(){
 const asset=await new GLTFLoader().loadAsync('/assets/polyhaven/rock-moss-set-01/rock_moss_set_01_4k.gltf');
 asset.scene.updateMatrixWorld(true);
 const variants=[],textures=new Set();
 asset.scene.traverse(o=>{
  if(!o.isMesh)return;
  const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);
  geometry.computeBoundingBox();
  const center=geometry.boundingBox.getCenter(new T.Vector3()),size=geometry.boundingBox.getSize(new T.Vector3());
  geometry.translate(-center.x,-center.y,-center.z);
  // Keep the scan's squat geological proportions. Stretching every axis to
  // the old unit sphere would turn flat weathered stones into tall pinnacles.
  const scale=2/Math.max(size.x,size.z);geometry.scale(scale,scale,scale);
  const dry=o.material.clone();dry.name='scene07-scanned-weathered-moss-stone-'+variants.length;dry.metalness=0;dry.roughness=.96;dry.color.setRGB(.66,.80,.83);
  if(dry.normalScale)dry.normalScale.set(.85,.85);
  const wet=new T.MeshPhysicalMaterial({
   name:dry.name+'-wet',color:dry.color,map:dry.map,normalMap:dry.normalMap,
   normalScale:dry.normalScale,roughnessMap:dry.roughnessMap,roughness:.60,
   metalness:0,clearcoat:.30,clearcoatRoughness:.17
  });
  wet.color.multiplyScalar(.70);
  for(const key of ['map','normalMap','roughnessMap','aoMap'])if(dry[key])textures.add(dry[key]);
  variants.push({geometry,dry,wet});
 });
 if(variants.length!==6)throw Error('Expected six separate scanned garden stones, got '+variants.length);
 return {variants,info:{asset:'rock_moss_set_01',author:'Kless Gyzen',license:'CC0-1.0',pieces:variants.length,source:'https://polyhaven.com/a/rock_moss_set_01'},
  dispose(){for(const v of variants){v.geometry.dispose();v.dry.dispose();v.wet.dispose();}for(const t of textures)t.dispose();}};
}
