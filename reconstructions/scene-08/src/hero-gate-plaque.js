import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// A single independently editable cast fitting. Its five exported closed
// solids contain no image, displacement guide or photo-projected material.
export async function loadHeroGatePlaque(){
 const asset=await new GLTFLoader().loadAsync(new URL('../assets/gate-plaque-v04/gate-plaque.glb',import.meta.url).href);
 asset.scene.updateMatrixWorld(true);
 const parts=[],materials=new Set();
 asset.scene.traverse(o=>{
  if(!o.isMesh)return;
  if(Array.isArray(o.material))throw Error('The one plaque needs distinct closed material parts');
  if(o.material.map||o.material.normalMap||o.material.emissiveMap)throw Error('The sculpted plaque cannot carry a guide image');
  const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);
  geometry.computeBoundingBox();parts.push({geometry,material:o.material,name:o.name});materials.add(o.material);o.geometry.dispose();
 });
 if(parts.length!==5||!parts.some(p=>p.name==='gate08_single_cast_floral_plaque'))throw Error('Incomplete one-plaque cast model');
 return{parts,materials:[...materials],info:{asset:'gate-plaque-v04',sceneInstances:1,
  position:[-1.983,3.30,7.9],rotationY:Math.PI/2,
  construction:'One closed unioned cast plate and four closed small domed fixings; hand-authored curves, no image data',
  triangleCount:parts.reduce((n,p)=>n+(p.geometry.index?.count??p.geometry.attributes.position.count)/3,0),
  visualAccepted:false}};
}
