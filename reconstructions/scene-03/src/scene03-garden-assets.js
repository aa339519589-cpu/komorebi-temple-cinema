import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createKeyedScanBearing107} from './scene03-fractured-stone107.js';

// These immutable, independently photographed CC0 assets are garden
// understory and stones only. Lotus, cherry and pine remain authored species.
export async function loadScene03GardenAssets({emit,mats,textures}){
 const loader=new GLTFLoader(),catalog={};
 const definitions=[
  ['shrub','/assets/polyhaven/shrub-02/shrub_02_4k.gltf','Poly Haven / Rico Cilliers / shrub_02'],
  ['groundcover','/assets/polyhaven/periwinkle-plant/periwinkle_plant_4k.gltf','Poly Haven / Amal Kumar / periwinkle_plant'],
  ['rock','/assets/polyhaven/rock-moss-set-01/rock_moss_set_01_4k.gltf','Poly Haven / Kless Gyzen / rock_moss_set_01'],
 ];
 for(const [role,url,credit]of definitions){
  const gltf=await loader.loadAsync(url),items=[],materials=new Map();
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(node=>{
   if(!node.isMesh)return;
   const geometry=node.geometry.clone(),rotationScale=node.matrixWorld.clone();
   // Provider files arrange their variants on a display row. Keep each
   // authored variant's orientation/scale, remove only the display offset.
   rotationScale.setPosition(0,0,0);geometry.applyMatrix4(rotationScale);geometry.computeBoundingBox();
   const b=geometry.boundingBox,size=b.getSize(new T.Vector3()),centre=b.getCenter(new T.Vector3());
   geometry.translate(-centre.x,-b.min.y,-centre.z);
   if(role==='rock')geometry.scale(1/Math.max(size.x,size.z),1/Math.max(size.x,size.z),1/Math.max(size.x,size.z));
   let material=materials.get(node.material);
   if(!material){
    material=node.material.clone();material.name=`scene03-CC0-${role}-${materials.size}`;
    material.transparent=false;material.opacity=1;material.alphaTest=role==='rock'?0:.35;material.depthWrite=true;
    material.side=role==='rock'?T.FrontSide:T.DoubleSide;material.roughness=role==='rock'?.84:.86;
    if(material.normalScale)material.normalScale.setScalar(role==='rock'?.82:.65);
    if(role==='rock')material.color.setRGB(.28,.40,.68);
    if(role==='shrub')material.color.set('#9caf87');
    if(role==='groundcover')material.color.set('#899c71');
    for(const value of Object.values(material))if(value?.isTexture){value.anisotropy=8;textures.add(value);}
    materials.set(node.material,material);mats[material.name]=material;
   }
   geometry.name=`scene03-${role}-${node.name}`;
   geometry.userData.independentGardenAsset={credit,license:'CC0-1.0',providerVariant:node.name,displayOffsetRemoved:true,originalTopology:true,referencePhotoUsed:false};
   items.push({geometry,material,height:role==='rock'?size.y/Math.max(size.x,size.z):size.y});
  });
  catalog[role]=items;
  if(role==='rock'){
   // Preserve the original mineral/lichen UVs on real scan topology. Only
   // the closed variants receive level foot/head fields for keyed bearing.
   catalog.bearingRock=items.filter((_,i)=>i!==3).map((item,i)=>{
    const g=createKeyedScanBearing107(item.geometry,i);
    return{geometry:g,material:item.material,height:1};
   });
   catalog.rockSolid=items.filter((_,i)=>i!==3).map((item,i)=>({geometry:createKeyedScanBearing107(item.geometry,i,{level:false}),material:item.material,height:1}));
  }
 }
 const counts={shrub:0,groundcover:0,rock:0,bearingRock:0,rockSolid:0};
 return{
  plant(role,index,position,scale=[1,1,1],rotation=[0,0,0],tint=1){
   const variants=catalog[role];if(!variants)throw Error('Unknown scene03 garden role '+role);
   const item=variants[Math.abs(index)%variants.length];emit(item.geometry,item.material,position,scale,rotation,tint);counts[role]++;
   return item.height*scale[1];
  },
  info(){return{variants:Object.fromEntries(Object.entries(catalog).map(([k,v])=>[k,v.length])),instances:{...counts},source:'Original Poly Haven 4K glTF geometry, local immutable dependencies',license:'CC0-1.0',lotusCherryPineSubstituted:false,photographicAccepted:false};},
 };
}
