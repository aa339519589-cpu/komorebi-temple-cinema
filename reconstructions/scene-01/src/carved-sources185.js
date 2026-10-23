import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Actual licensed source surfaces. Uniform install transforms and material
// overrides are separate from the untouched distributed source attributes.
export async function loadCarvedSources185(){
 const directory=new URL('../assets/carved185/',import.meta.url),loader=new GLTFLoader();
 const [dragon,floral]=await Promise.all([loader.loadAsync(new URL('dragon-frieze176.glb',directory).href),loader.loadAsync(new URL('floral157/component.gltf',directory).href)]);
 const originalMaterials=new Set(),records={},models={dragon,floral};
 for(const [key,asset]of Object.entries(models)){
  asset.scene.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(asset.scene,true),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),parts=[];let triangles=0;
  asset.scene.traverse(o=>{if(!o.isMesh)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>originalMaterials.add(m));parts.push({geometry:o.geometry,matrix:o.matrixWorld.clone()});triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
  records[key]={parts,size,center,triangles};
 }
 if(Math.abs(records.dragon.size.x-2)>.0001||records.floral.size.x<.5||records.floral.size.x>.62)throw Error('185 source wrapper dimensions changed');
 function mount(B,center=.6){
  const gilt=new T.MeshStandardMaterial({name:'hall185-declared-aged-gilt-on-actual-carving',color:'#a88342',metalness:.65,roughness:.46});B.m.hall185ActualGilt=gilt;
  const darkGilt=gilt.clone();darkGilt.name='hall185-declared-worn-gilt-on-actual-peony';darkGilt.color.set('#987437');darkGilt.metalness=.54;darkGilt.roughness=.56;B.m.hall185ActualFloralGilt=darkGilt;
  const place=(key,matrix,material)=>{for(const part of records[key].parts)B.put(part.geometry,material,matrix.clone().multiply(part.matrix));};
  B.label('hall185-one-actual-dragon-and-cloud-primary-portal-transom',()=>{
   const matrix=new T.Matrix4().makeTranslation(center,6.05,5.18).multiply(new T.Matrix4().makeScale(2.10,2.10,2.10));place('dragon',matrix,gilt);
  });
  B.label('hall185-two-actual-peony-recessed-jamb-cassettes',()=>{
   for(const side of[-1,1]){
    const matrix=new T.Matrix4().makeTranslation(center+side*2.08,3.62,5.047).multiply(new T.Matrix4().makeRotationZ(side*Math.PI/2)).multiply(new T.Matrix4().makeRotationY(Math.PI)).multiply(new T.Matrix4().makeScale(1.55,1.55,1.55)).multiply(new T.Matrix4().makeTranslation(...records.floral.center.clone().negate().toArray()));
    place('floral',matrix,darkGilt);
   }
  });
  return{revision:185,dragon:{instances:1,source:'SCANOLOGY_3D / Wood Carving of Dragon',license:'CC BY4.0',file:'assets/carved185/dragon-frieze176.glb',sourceComponentSha256:'5bad0e5a3b1c75a0b5f320708a15933c0dabdfd9b713fa46ba002ff77584e2a3',sourceOriginalSha256:'5c0dc99da821e7248d095eb37fa0af348f24c14460f28d83770facc48131f255',prototypeTriangles:records.dragon.triangles,sourceSize:records.dragon.size.toArray(),uniformScale:2.10,position:[center,6.05,5.18],sourceGeometryChanged:false},floral:{instances:2,source:'Diana Liu / Thunk3D actual peony and leaf scan',license:'CC BY4.0',file:'assets/carved185/floral157/component.gltf',sourceBinarySha256:'4b6f16a2aa6efd0bbde92b26547d569c334c5f6516d621284b25c8b02bdb59b5',prototypeTriangles:records.floral.triangles,sourceSize:records.floral.size.toArray(),uniformScale:1.55,sourcePositionNormalIndexChanged:false,croppedMountEdges:'Original selected source boundaries embedded in separate solid timber jamb carriers; not claimed closed source scan'},finish:'Declared uniform aged-gilt PBR hypothesis; no source/reference RGB or generated relief',sourceLimit:'These are different artifacts from the photograph; source culture/era/original architectural role or metric scale is not verified',visualAccepted:false};
 }
 function mountFloralPanel219(B,{x,y,z,scale=1.08}){
  if(!B.m.hall219DoorFloralGilt){const m=B.m.hall185ActualFloralGilt.clone();m.name='hall219-aged-gilt-on-actual-door-floral-relief';m.color.set('#b99b59');m.roughness=.38;m.metalness=.68;B.m.hall219DoorFloralGilt=m;}
  const r=records.floral,matrix=new T.Matrix4().makeTranslation(x,y,z).multiply(new T.Matrix4().makeRotationY(Math.PI)).multiply(new T.Matrix4().makeScale(scale,scale,scale)).multiply(new T.Matrix4().makeTranslation(...r.center.clone().negate().toArray()));
  for(const part of r.parts)B.put(part.geometry,B.m.hall219DoorFloralGilt,matrix.clone().multiply(part.matrix));
  return{source:'Diana Liu / Thunk3D peony and leaf actual source surface',license:'CC BY4.0',sourceAttributesChanged:false,uniformScale:scale};
 }
 return{mount,mountFloralPanel219,dispose(){for(const m of originalMaterials)m.dispose();}};
}
