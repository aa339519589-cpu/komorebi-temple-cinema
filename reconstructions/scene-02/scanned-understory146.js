import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Independent scene02 loader for the frozen original CC0 botanical meshes.
// Plant roots, species role and terrain placement remain actual scene geometry.
export async function loadScannedUnderstory146(){
 const loader=new GLTFLoader(),textures=new Set(),records={};
 for(const [key,directory,file]of[['shrub','shrub-02','shrub_02_4k.gltf'],['periwinkle','periwinkle-plant','periwinkle_plant_4k.gltf']]){
  const source=await loader.loadAsync(`/assets/polyhaven/${directory}/${file}`);source.scene.updateMatrixWorld(true);const variants=[];
  source.scene.traverse(o=>{
   if(!o.isMesh)return;
   const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.computeBoundingBox();
   const bounds=geometry.boundingBox.clone(),size=bounds.getSize(new T.Vector3()),p=geometry.attributes.position;let x=0,z=0,n=0;
   for(let i=0;i<p.count;i++)if(p.getY(i)<bounds.min.y+size.y*.07){x+=p.getX(i);z+=p.getZ(i);n++;}
   const center=bounds.getCenter(new T.Vector3());geometry.translate(-(n?x/n:center.x),-bounds.min.y,-(n?z/n:center.z));geometry.computeBoundingBox();
   const material=o.material.clone();material.name=`scene02-original-${key}-surface-${variants.length}`;
   // The original JPEG atlases accompany shaped leaf/flower meshes. They have
   // no alpha channel; render those existing shapes as opaque, sorted solids.
   material.transparent=false;material.opacity=1;material.depthWrite=true;material.side=T.DoubleSide;material.alphaTest=0;material.roughness=.89;material.metalness=0;
   if(material.normalScale)material.normalScale.set(.65,.65);
   material.userData.thinLeaf=true;material.userData.thinLeafTransmission=.45;material.userData.provenance=`/assets/polyhaven/${directory}/provenance.json`;
   for(const k of['map','normalMap','roughnessMap','metalnessMap','aoMap'])if(material[k]){material[k].anisotropy=8;textures.add(material[k]);}
   variants.push({geometry,material,height:geometry.boundingBox.max.y,root:[0,0,0],sourceName:o.name});
  });
  if(variants.length!==(key==='shrub'?4:6))throw Error('Unexpected original botanical variants: '+key);
  records[key]=variants;
 }
 return{...records,info:{shrub:{asset:'shrub_02',author:'Rico Cilliers',license:'CC0-1.0',variants:records.shrub.length,role:'Low bank shrub and woody understory; never a pine, cherry or lotus substitute'},periwinkle:{asset:'periwinkle_plant',author:'Amal Kumar',license:'CC0-1.0',variants:records.periwinkle.length,role:'Small planted bank groundcover'},geometry:'Original undecreased glTF mesh positions, normals and UVs, with source collection offsets removed and original root level preserved',maps:'Original4K diffuse, OpenGL normal and ARM atlases; every runtime byte is listed in scene02 asset-dependencies.json'},dispose(){for(const t of textures)t.dispose();}};
}
