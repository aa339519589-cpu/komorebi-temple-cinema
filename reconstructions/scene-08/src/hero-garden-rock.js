import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// A single authentic CC0 scan. Vertices, normals, indices and UV arrays are
// never edited; one rigid yaw, one uniform scale and placement do all fitting.
export const HERO_ROCK_108=Object.freeze({node:'rock_moss_set_01_rock01',anchorXZ:[-.75,-.15],uniformScale:1.10,pitch:1.15,yaw:.15,embed:.16,neutralTint:[0.5554334918504523,0.8833543991605919,3.538044076536976]});
export async function loadHeroGardenRock(){
 const asset=await new GLTFLoader().loadAsync('/assets/polyhaven/rock-moss-set-01/rock_moss_set_01_4k.gltf');
 let selected;asset.scene.traverse(o=>{if(o.isMesh&&o.name===HERO_ROCK_108.node)selected=o;});
 if(!selected)throw Error('Retained rock01 scan node is required');
 const geometry=selected.geometry.clone(),material=selected.material.clone(),textures=new Set();
 geometry.computeBoundingBox();const bounds=geometry.boundingBox,centre=bounds.getCenter(new T.Vector3());
 material.name='scene08-one-cc0-rock01-neutral';material.color.setRGB(...HERO_ROCK_108.neutralTint);
 // A large constant gain on dark scan channels is valid; bound the resulting
 // diffuse reflectance rather than incorrectly bounding the factor itself.
 material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=min(diffuseColor.rgb,vec3(.85));');};
 material.customProgramCacheKey=()=> 'scene08-rock-neutral112b-bounded-reflectance';
 for(const name of['map','normalMap','roughnessMap','metalnessMap','aoMap'])if(material[name])textures.add(material[name]);
 const info={asset:'Poly Haven rock_moss_set_01',author:'Kless Gyzen',license:'CC0-1.0',source:'https://polyhaven.com/a/rock_moss_set_01',node:selected.name,originalMesh:selected.geometry.name,triangles:(geometry.index?.count??geometry.attributes.position.count)/3,geometryArraysUnmodified:true,originalUVAndPBRMapsRetained:true,nonuniformStretch:false,greenCapAdded:false,placement:HERO_ROCK_108,visualAccepted:false};
 function place(emit,terrainGeometry){
  const C=HERO_ROCK_108,s=C.uniformScale,rotation=new T.Quaternion().setFromEuler(new T.Euler(C.pitch,C.yaw,0)),offset=new T.Vector3(centre.x,0,centre.z).multiplyScalar(s).applyQuaternion(rotation);
  const x=C.anchorXZ[0]-offset.x,z=C.anchorXZ[1]-offset.z;
  const terrainMaterial=new T.MeshBasicMaterial({side:T.DoubleSide}),surface=new T.Mesh(terrainGeometry,terrainMaterial);surface.updateMatrixWorld(true);
  const ray=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0),0,100),p=geometry.attributes.position,candidates=[],rotated=[];
  for(let i=0;i<p.count;i++)rotated.push(new T.Vector3().fromBufferAttribute(p,i).multiplyScalar(s).applyQuaternion(rotation));
  const minY=Math.min(...rotated.map(v=>v.y)),maxY=Math.max(...rotated.map(v=>v.y));
  // First-contact height comes from the real lower scan vertices against the
  // exact existing triangle terrain, not an invented ground plane or new soil.
  for(let i=0;i<p.count;i++){
   if(rotated[i].y>minY+(maxY-minY)*.22)continue;
   const v=rotated[i].clone();v.x+=x;v.z+=z;
   ray.ray.origin.set(v.x,50,v.z);const hit=ray.intersectObject(surface,false)[0];if(hit)candidates.push({height:hit.point.y-v.y,localY:p.getY(i),rigidRotatedY:v.y,x:v.x,z:v.z,terrainY:hit.point.y});
  }
  terrainMaterial.dispose();if(candidates.length<3)throw Error('Scan has no actual terrain support samples');
  const y=Math.max(...candidates.map(p=>p.height))-C.embed;
  const contacts=candidates.filter(p=>p.height-y>=0),worldBounds=new T.Box3().setFromPoints(rotated.map(v=>v.clone().add(new T.Vector3(x,y,z))));
  Object.assign(info,{objectPosition:[x,y,z],support:{method:'Lower original scan vertices raycast onto original triangulated terrain',samples:candidates.length,embeddedSamples:contacts.length,maximumPenetrationMetres:C.embed,contacts:contacts.slice(0,12)},worldBounds:{min:worldBounds.min.toArray(),max:worldBounds.max.toArray()}});
  emit(geometry,material,x,y,z,s,s,s,[C.pitch,C.yaw,0]);
 }
 return{place,info,material,textures:[...textures]};
}
