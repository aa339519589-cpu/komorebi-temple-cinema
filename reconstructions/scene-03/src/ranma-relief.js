import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// The approved scalar study was converted to closed solids by the editable
// Blender builder. Its bitmap never enters this module or a visible shader.
export async function installRanmaRelief(T,architecture){
 const url=new URL('../assets/ranma-frieze-v01/ranma-relief.glb',import.meta.url);
 const asset=await new GLTFLoader().loadAsync(url.href);
 asset.scene.updateMatrixWorld(true);
 const parts=[],ownedGeometries=new Set(),ownedMaterials=new Set();
 asset.scene.traverse(object=>{
  if(!object.isMesh)return;
  if(Array.isArray(object.material))throw Error('Ranma prototype needs distinct solid parts');
  const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);
  if(!Array.from(geometry.attributes.position.array).every(Number.isFinite))throw Error('Nonfinite carved ranma geometry');
  const isWood=object.name==='ranma_deep_wood_backplate';
  const material=isWood?architecture.materials.darkwood.clone():object.material;
  if(isWood){
   material.name='ranma-independent-deep-wood-PBR';material.color.set('#352117');material.map=null;material.roughness=.76;
   material.onBeforeCompile=()=>{};material.customProgramCacheKey=()=> 'scene03-ranma-backplate-pbr-v1';
   const p=geometry.attributes.position,uv=new Float32Array(p.count*2);
   for(let i=0;i<p.count;i++){uv[i*2]=p.getX(i);uv[i*2+1]=p.getY(i);}
   geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));object.material.dispose();
  }
  else if(material.map||material.displacementMap||material.emissiveMap)throw Error('Height guide cannot become a visible texture');
  material.side=T.FrontSide;
  ownedGeometries.add(geometry);ownedMaterials.add(material);
  parts.push({geometry,material,name:object.name});object.geometry.dispose();
 });
 if(parts.length!==2||!parts.some(part=>part.name==='ranma_gilt_carved_leaves'))throw Error('Incomplete closed ranma prototype');
 const C=architecture.config,group=new T.Group();group.name='scene03-two-entrance-beams-closed-ranma';
 group.matrixAutoUpdate=false;
 group.matrix.makeTranslation(0,0,-4).multiply(new T.Matrix4().makeRotationY(C.hallYaw??.12)).multiply(new T.Matrix4().makeTranslation(0,0,4));
 const centers=[];
 for(const y of[C.capitalTop-.40,C.capitalTop+.20])for(const x of[-2.01,-.67,.67,2.01]){
  // Two central lower cassettes are the separately loaded real floral scan.
  if(y===C.capitalTop-.40&&Math.abs(x)<1)continue;
  centers.push([x,y,.445]);
 }
 for(const part of parts){
  const mesh=new T.InstancedMesh(part.geometry,part.material,centers.length);
  mesh.name=part.name+'-six-shared-prototype-instances';
  centers.forEach((position,i)=>mesh.setMatrixAt(i,new T.Matrix4().makeTranslation(...position)));
  mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;
  mesh.userData.reference4Roles=['entrance-two-gilt-carved-ranma-beams'];group.add(mesh);
 }
 //180: the gable now has two fitted actual cloud scans; the seven
 // repeated height-study panels remain only in the preserved109/174 source.
 const gableCenters=[];
 architecture.group.add(group);
 const prototypeTriangles=parts.reduce((n,{geometry})=>n+(geometry.index?.count??geometry.attributes.position.count)/3,0);
 const gablePrototypeTriangles=parts.filter(p=>p.name==='ranma_gilt_carved_leaves').reduce((n,{geometry})=>n+(geometry.index?.count??geometry.attributes.position.count)/3,0);
 return {info:{prototypeTriangles,modules:centers.length,gableModules109:gableCenters.length,totalTriangles:prototypeTriangles*centers.length+gablePrototypeTriangles*gableCenters.length,gableApronFrontZ:null,gableBacking:'180 actual scan shoulders on authored timber; procedural gable panels removed',
  localCenters:centers,guideRole:'Approved AI height study drives closed geometry only; no image texture',visualAccepted:false},
  dispose(){architecture.group.remove(group);for(const geometry of ownedGeometries)geometry.dispose();for(const material of ownedMaterials)material.dispose();}};
}
