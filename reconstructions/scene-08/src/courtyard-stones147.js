import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import{installDampStone213}from'./layered-banks213.js';

// Original CC0 garden stones. Geometry/PBR bytes are not modified in storage;
// runtime clones retain all original attributes and receive only uniform scale.
export async function loadCourtyardStones(){
 const gltf=await new GLTFLoader().loadAsync('/assets/polyhaven/rock-moss-set-01/rock_moss_set_01_4k.gltf');gltf.scene.updateMatrixWorld(true);
 const variants=[],geometries=new Set(),materials=new Set(),textures=new Set();
 for(const root of gltf.scene.children){
  const box=new T.Box3().setFromObject(root),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),parts=[];
  root.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.translate(-center.x,-box.min.y,-center.z);geometries.add(geometry);
   const material=o.material.clone();material.name='scene08-cc0-moss-granite-'+root.name;material.roughness=Math.max(.86,material.roughness);material.color.multiply(new T.Color(.65,.67,.60));installDampStone213(material);
   for(const key of['map','normalMap','roughnessMap','metalnessMap'])if(material[key]){material[key].anisotropy=8;textures.add(material[key]);}
   materials.add(material);parts.push({geometry,material});
  });if(parts.length)variants.push({name:root.name,width:Math.max(size.x,size.z),height:size.y,parts});
 }
 let count=0;return {info:{asset:'Poly Haven Rock Moss Set01 original4K glTF',license:'CC0-1.0',count:()=>count,finish213:{linearMultiplier:[.65,.67,.60],worldDampBand:[.55,1.0],originalMapFilesHeld:true},variants:variants.map(v=>({name:v.name,width:v.width,height:v.height}))},place({emit,x,z,height,width,heightLimit=width*.55,index=0,allowTall=false}){let v=variants[index%variants.length];if(!allowTall&&v.height/v.width>.70)v=variants[(index+2)%variants.length];const s=Math.min(width/v.width,heightLimit/v.height);for(const p of v.parts)emit(p.geometry,p.material,x,height-.07,z,s,s,s,[0,index*.71,0]);count++;},dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
