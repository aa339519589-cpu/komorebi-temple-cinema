import {ExtrudeGeometry,Matrix4,Shape} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Small, bevel-shouldered timber keys make the receiver crossings read as
// locked half-laps. Their backs sink into the receiver; only the shallow crown
// rises above the side grain, leaving the top bearing plane untouched.
const lapKeyProfile=()=>{
 const s=new Shape();
 s.moveTo(-.072,-.015);s.lineTo(-.050,-.027);s.lineTo(.050,-.027);s.lineTo(.072,-.015);
 s.lineTo(.072,.015);s.lineTo(.050,.027);s.lineTo(-.050,.027);s.lineTo(-.072,.015);s.closePath();
 return s;
};
const LAP_KEY_DEPTH=.010,LAP_KEY_BEVEL=.0025,LAP_KEY_CROWN=.0015;
function lapKey(longAxis,side,along,y,face){
 const geometry=new ExtrudeGeometry(lapKeyProfile(),{depth:LAP_KEY_DEPTH,steps:1,bevelEnabled:true,
  bevelSegments:1,bevelThickness:LAP_KEY_BEVEL,bevelSize:.002});
 const rotation=longAxis==='x'
  ?new Matrix4().makeRotationY(side>0?0:Math.PI)
  :new Matrix4().makeRotationY(side>0?Math.PI/2:-Math.PI/2);
 const outwardSpan=LAP_KEY_DEPTH+LAP_KEY_BEVEL,base=face-side*(outwardSpan-LAP_KEY_CROWN);
 const position=longAxis==='x'?[along,y,base]:[base,y,along];
 geometry.applyMatrix4(rotation);
 geometry.translate(...position);
 return geometry;
}
function fitReceiverLapKeys(geometry,name){
 geometry.computeBoundingBox();const box=geometry.boundingBox,keys=[];
 if(name.startsWith('bracket_receiver_x_')){
  const y=(box.min.y+box.max.y)/2;
  for(const side of[-1,1])keys.push(lapKey('x',side,0,y,side<0?box.min.z:box.max.z));
 }else if(name==='bracket_receiver_z'){
  const y=(box.min.y+box.max.y)/2;
  for(const side of[-1,1])for(const along of[-.415,.415])
   keys.push(lapKey('z',side,along,y,side<0?box.min.x:box.max.x));
 }
 if(!keys.length)return geometry;
 const parts=[geometry,...keys],expanded=parts.map(g=>g.index?g.toNonIndexed():g.clone());
 const joined=mergeGeometries(expanded,false);
 for(const part of expanded)part.dispose();
 for(const key of keys)key.dispose();
 geometry.dispose();
 if(!joined)throw Error('Unable to fit receiver half-lap keys');
 return joined;
}

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
   let geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);
   if(o.name.startsWith('bracket_receiver_'))geometry=fitReceiverLapKeys(geometry,o.name);
   geometries.push(geometry);
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
 return {bracket,relief,materials,info:{source:'Blender source-built solid kit v01 with fitted receiver lap keys',bracketPieces:bracket.length,
  receiverLapKeys:8,
  fittingTriangles:(relief.index?.count??relief.attributes.position.count)/3,
  guideRole:'Image-assisted non-metric relief depth; no source-photo albedo'},
  dispose(){for(const g of geometries)g.dispose();for(const m of Object.values(materials)){for(const value of Object.values(m))if(value?.isTexture)value.dispose();m.dispose();}}};
}
