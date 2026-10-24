import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {installMountainTransport238} from './mountain-transport238.js';

// Original licensed geometry and all UV/color attributes remain intact.
// Source photography never enters a material or a backdrop.
export async function loadForest150(){
 const gltf=await new GLTFLoader().loadAsync('/reconstructions/scene-07/assets/forest150/pine-sapling/pine_sapling_small_1k.gltf');
 gltf.scene.updateMatrixWorld(true);const variants=[];
 for(const root of gltf.scene.children){
  const bounds=new T.Box3().setFromObject(root),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),parts=[];
  root.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.translate(-center.x,-bounds.min.y,-center.z);const material=o.material.clone();material.name='forest150-original-pine-'+root.name;material.shadowSide=T.DoubleSide;
   material.normalScale.set(.42,.42);const before=material.onBeforeCompile;
   material.onBeforeCompile=s=>{before.call(material,s);s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=max(roughnessFactor,.64);');};
   material.customProgramCacheKey=()=> 'scene07-far-pine-aggregate-normal-roughness238-r27';installMountainTransport238(material);
   for(const key of ['map','normalMap','roughnessMap','metalnessMap','aoMap'])if(material[key])material[key].anisotropy=8;
   parts.push({geometry,material});
  });
  if(parts.length)variants.push({name:root.name,height:size.y,width:Math.max(size.x,size.z),parts});
 }
 return {variants,dispose(){for(const v of variants)for(const p of v.parts){p.geometry.dispose();p.material.dispose();}}};
}

export function buildForest150({library,emit,height,sunVisibility=()=>1}){
 let state=150071;const R=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296),range=(a,b)=>a+(b-a)*R();let trees=0,triangles=0;
 const roots=[];
 for(let i=0;i<210;i++){
  const x=range(-65,60),z=range(-47,-27);if(x>-20&&x<20&&z>-32)continue;
  const y=height(x,z);if(!Number.isFinite(y))continue;
  const variant=library.variants[i%library.variants.length],h=range(3.3,7.8),scale=h/variant.height,yaw=range(0,Math.PI*2);
  const visibility=sunVisibility(x,y,z,h,variant.width*scale*.5);
  for(const part of variant.parts){emit(part.geometry,part.material,x,y-.025,z,scale,scale,scale,[0,yaw,0],range(.90,1.06),visibility);triangles+=(part.geometry.index?.count||part.geometry.attributes.position.count)/3;}
  roots.push([x,y,z]);trees++;
 }
 return{revision:'scene07-rooted-source-pines-with-terrain-solar-visibility238-r27',trees,triangles,roots,provider:'Poly Haven',asset:'Pine Sapling Small',license:'CC0-1.0',provenance:'assets/forest150/provenance.json',placement:'Uniformly scaled original variants seated on the highest actual modeled ridge surface; original positions/normals/UVs retained. Distance aggregate normal strength/roughness and actual terrain-ray solar visibility are authored approximations.',visualAccepted:false};
}
