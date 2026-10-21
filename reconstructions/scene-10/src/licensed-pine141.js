import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Poly Haven CC0 true branching/needle geometry. The botanical model supplies
// the distant crown; inferred mature stems and root placements remain modeled.
export async function loadLicensedPine141(){
 const url=new URL('../assets/pine-sapling-cc0-141/pine_sapling_small_1k.gltf',import.meta.url).href,
  asset=await new GLTFLoader().loadAsync(url),variants=[],textures=new Set();
 asset.scene.updateMatrixWorld(true);
 for(const root of asset.scene.children){
  const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});if(!meshes.length)continue;
  const parts=meshes.map(o=>({geometry:o.geometry.clone().applyMatrix4(o.matrixWorld),sourceMaterial:o.material})),bounds=new T.Box3();
  for(const p of parts){p.geometry.computeBoundingBox();bounds.union(p.geometry.boundingBox);}
  const height=bounds.max.y-bounds.min.y;let sx=0,sz=0,count=0;
  for(const part of parts){const p=part.geometry.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)<bounds.min.y+height*.018){sx+=p.getX(i);sz+=p.getZ(i);count++;}}
  const rootX=count?sx/count:bounds.getCenter(new T.Vector3()).x,rootZ=count?sz/count:bounds.getCenter(new T.Vector3()).z;
  let triangles=0;
  for(const part of parts){
   part.geometry.translate(-rootX,-bounds.min.y,-rootZ);part.geometry.scale(1/height,1/height,1/height);part.geometry.computeBoundingBox();
   const material=part.sourceMaterial.clone();material.name='licensed-pine141-'+part.sourceMaterial.name;
   material.metalness=0;material.roughness=.82;material.color.multiplyScalar(.78);if(material.normalScale)material.normalScale.multiplyScalar(.65);
   for(const key of['map','normalMap','roughnessMap','metalnessMap','aoMap'])if(material[key])textures.add(material[key]);
   part.material=material;delete part.sourceMaterial;triangles+=(part.geometry.index?.count||part.geometry.attributes.position.count)/3;
  }
  variants.push({parts,sourceName:root.name,sourceHeight:height,sourceBounds:[bounds.min.toArray(),bounds.max.toArray()],normalizedRoot:[rootX,bounds.min.y,rootZ],triangles});
 }
 if(variants.length!==3)throw Error('Expected three rigid pine variants.');
 const trunkMaterial=variants[0].parts.find(p=>p.material.name.includes('bark')).material.clone();trunkMaterial.name='licensed-pine141-mature-stem-bark';
 for(const key of['map','normalMap','roughnessMap','metalnessMap','aoMap'])if(trunkMaterial[key]){const t=trunkMaterial[key].clone();t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,10);textures.add(t);trunkMaterial[key]=t;}
 return{variants,trunkMaterial,info:{asset:'Pine Sapling Small',source:'https://polyhaven.com/a/pine_sapling_small',license:'CC0-1.0',variants:variants.map(v=>({name:v.sourceName,sourceHeight:v.sourceHeight,triangles:v.triangles})),use:'Unchanged rigid 3D branch/needle mesh, uniformly scaled as a crown on an authored mature stem; no scene image/projection.',botanicalMatchAccepted:false},dispose(){for(const v of variants)for(const p of v.parts){p.geometry.dispose();p.material.dispose();}trunkMaterial.dispose();for(const t of textures)t.dispose();}};
}
