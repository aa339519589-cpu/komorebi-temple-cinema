import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {isGardenRoute} from './garden-terrain.js';

// Original independent CC0 botanical variants, seated on the modeled soil.
export async function loadGardenPlantMeshes(){
 const loader=new GLTFLoader(),assets=[];
 for(const [id,file] of [['shrub-02','shrub_02_4k.gltf'],['periwinkle-plant','periwinkle_plant_4k.gltf']]){
  const gltf=await loader.loadAsync(`/assets/polyhaven/${id}/${file}`);gltf.scene.updateMatrixWorld(true);const variants=[];
  for(const root of gltf.scene.children){
   const bounds=new T.Box3().setFromObject(root),centre=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),parts=[];
   root.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.translate(-centre.x,-bounds.min.y,-centre.z);const material=o.material.clone();material.name=`scene07-cc0-${id}-${root.name}`;material.shadowSide=T.DoubleSide;if(material.map)material.map.anisotropy=8;if(material.normalMap)material.normalMap.anisotropy=8;parts.push({geometry,material});});
   if(parts.length)variants.push({name:root.name,width:Math.max(size.x,size.z),height:size.y,parts});
  }
  assets.push({id,variants});
 }
 return {assets,dispose(){for(const a of assets)for(const v of a.variants)for(const p of v.parts){p.geometry.dispose();p.material.dispose();}}};
}

export function buildScanPlanting({library,emit,height}){
 let seed=714419;const R=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296),range=(a,b)=>a+(b-a)*R(),TAU=Math.PI*2;
 const colonies=[[-7.4,6.2,1.5,1.1],[-8.4,8.2,1.6,1.1],[-12.7,9.7,1.8,1.4],[12.2,3.1,1.7,1.5],[14.7,4.3,1.8,1.5],[10.2,7,1.2,1.3],[14.9,8.2,1.7,1.5],[-9.9,.8,1.4,1.1],[-8.8,2.7,1.3,1.2],[12.8,.2,1.7,1.6]];
 const ground=(x,z)=>{const r=Math.hypot((x-4.876)/2.08,(z-5.52)/1.40);return Math.max(height(x,z),r<1?.28+1.75*Math.sqrt(1-r*r):-Infinity);};
 let plants=0,flowering=0;
 function plant(x,z,flower,index,width){
  if(isGardenRoute(x,z,.48))return;const y=ground(x,z);if(y<.10)return;
  const variants=library.assets[flower?1:0].variants,v=variants[index%variants.length],scale=width/v.width,
   normal=new T.Vector3(-(ground(x+.08,z)-ground(x-.08,z))*.22,1,-(ground(x,z+.08)-ground(x,z-.08))*.22).normalize(),
   q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),normal).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),range(0,TAU))),rot=new T.Euler().setFromQuaternion(q);
  for(const p of v.parts)emit(p.geometry,p.material,x,y-.012,z,scale,scale,scale,[rot.x,rot.y,rot.z],range(.94,1.04));
  plants++;if(flower)flowering++;
 }
 for(let k=0;k<colonies.length;k++){
  const [cx,cz,rx,rz]=colonies[k];
  for(let j=0;j<11;j++){const a=range(0,TAU),r=Math.sqrt(R()),x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r;plant(x,z,j%3!==0,k*7+j,j%3?range(.30,.68):range(.30,.50));}
 }
 for(let j=0;j<34;j++){const a=j*2.399+range(-.16,.16),r=range(.52,.96),x=4.876+Math.cos(a)*2.08*r,z=5.52+Math.sin(a)*1.40*r;plant(x,z,true,j,range(.30,.58));}
 return {revision:'scene07-cc0-rooted-planting144',plants,flowering,source:'Independent Poly Haven Shrub02 and Periwinkle Plant original meshes/4K PBR maps; actual soil/island placement, no reference-scene image projection',visualAccepted:false};
}
