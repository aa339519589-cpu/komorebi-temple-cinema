import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Portable source-built solids. The AI image is only a scalar sculpt guide
// used by the Blender builder; no reference photograph enters this scene.
export async function loadBlenderJoinery(){
 const asset=await new GLTFLoader().loadAsync('/assets/temple-joinery-v01/temple-joinery-v01.glb');
 asset.scene.updateMatrixWorld(true);
 const bracket=[],materials={},geometries=[],unusedMaterials=new Set();let relief;
 asset.scene.traverse(o=>{
  if(!o.isMesh)return;
  const material=Array.isArray(o.material)?o.material[0]:o.material;
  if(o.name.startsWith('bracket_')||o.name==='kiku_relief_lod2'){
   const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometries.push(geometry);
   geometry.computeBoundingBox();geometry.computeBoundingSphere();
   if(!Array.from(geometry.attributes.position.array).every(Number.isFinite))throw Error('Nonfinite Blender joinery geometry');
   const key=material.name.includes('gilt')?'kit_gilt':material.name.includes('end-grain')?'kit_endwood':'kit_cedar';
   materials[key]=material;
   if(o.name.startsWith('bracket_'))bracket.push({geometry,material:key});
   else relief=geometry;
  }else unusedMaterials.add(material);
  o.geometry.dispose();
 });
 if(bracket.length!==18||!relief)throw Error('Incomplete Blender joinery kit');
 for(const m of unusedMaterials)if(!Object.values(materials).includes(m))m.dispose();
 return {bracket,relief,materials,info:{source:'Blender source-built solid kit v01',bracketPieces:bracket.length,
  fittingTriangles:(relief.index?.count??relief.attributes.position.count)/3,
  guideRole:'Image-assisted non-metric relief depth; no source-photo albedo'},
  dispose(){for(const g of geometries)g.dispose();for(const m of Object.values(materials)){for(const value of Object.values(m))if(value?.isTexture)value.dispose();m.dispose();}}};
}
