import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {installLeafScattering214} from './world-radiance214.js';

const ASSET340='/reconstructions/scene-02/assets/fir-sapling/fir_sapling_4k.gltf';
// Existing CC0 complete spatial fir meshes. The original source has opaque
// branch and twig geometry, not a scene plate or a camera-facing tree card.
async function loadFir340(){
 const asset=await new GLTFLoader().loadAsync(ASSET340);asset.scene.updateMatrixWorld(true);
 const variants=[],materials=new Map(),textures=new Set();
 for(const root of asset.scene.children){
  const bounds=new T.Box3().setFromObject(root),height=bounds.max.y-bounds.min.y,centre=bounds.getCenter(new T.Vector3());let x=0,z=0,n=0;
  root.traverse(o=>{if(!o.isMesh||!o.material.name.includes('branches'))return;const p=o.geometry.attributes.position,v=new T.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(v.y<bounds.min.y+height*.025){x+=v.x;z+=v.z;n++;}}});
  const origin=[n?x/n:centre.x,bounds.min.y,n?z/n:centre.z],parts=[],box=new T.Box3();
  root.traverse(o=>{
   if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.translate(-origin[0],-origin[1],-origin[2]);geometry.computeBoundingBox();box.union(geometry.boundingBox);
   let material=materials.get(o.material.name);
   if(!material){
    material=o.material.clone();const twig=o.material.name.includes('twigs');material.name='scene07-original-fir340-'+o.material.name;material.roughness=twig?.89:.96;material.metalness=0;
    // Provider metallicFactor is identically zero. Keeping an inactive
    // metallic sampler would exceed the native shadow/atmosphere budget.
    material.metalnessMap=null;material.side=T.DoubleSide;material.shadowSide=T.DoubleSide;material.transparent=false;material.opacity=1;material.depthWrite=true;
    if(material.normalScale)material.normalScale.set(twig?.75:.55,twig?.75:.55);
    if(twig)installLeafScattering214(material,{strength:.26,power:1.5});
    material.userData.sourceAsset340='Existing CC0 fir_sapling original opaque geometry and4K botanical maps';
    for(const key of['map','normalMap','roughnessMap'])if(material[key]){material[key].anisotropy=8;textures.add(material[key]);}
    materials.set(o.material.name,material);
   }
   parts.push({geometry,material});
  });
  variants.push({name:root.name,height,origin,parts,bounds:box});
 }
 if(variants.length!==3||variants.some(v=>v.parts.length!==2))throw Error('Garden340 requires the three original complete fir variants.');
 return{variants,dispose(){for(const v of variants)for(const p of v.parts)p.geometry.dispose();for(const m of materials.values())m.dispose();for(const t of textures)t.dispose();}};
}

export function placeFirGrove340({emit,groundSurface,library}){
 let seed=340597;const R=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296),rr=(a,b)=>a+(b-a)*R();
 const protectedRoofs=[
  new T.Box3(new T.Vector3(-34.87,5.17,-21.96),new T.Vector3(-24.09,7.76,-15.24)),
  new T.Box3(new T.Vector3(-28.16,4.0,-37.72),new T.Vector3(-17.36,32,-26.92)),
  new T.Box3(new T.Vector3(-12,3,-46),new T.Vector3(17,28,-12))
 ];
 const clusters=[[-37.0,-31.6,8.0,4.2,22,4.8,7.2],[-29.5,-42.0,9.7,5.7,28,6.0,8.8],[-26.5,-52.4,13.0,5.5,28,6.8,9.5],[-16.5,-48.0,4.5,3.3,12,5.0,7.2]],records=[];
 let skippedWet=0,skippedRoof=0,triangles=0;
 for(let k=0;k<clusters.length;k++){
  const [cx,cz,rx,rz,count,h0,h1]=clusters[k];
  for(let j=0;j<count;j++){
   const a=j*2.399963+k*.81+rr(-.17,.17),r=Math.sqrt((j+.28+R()*.48)/count),x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r,ground=groundSurface(x,z);
   if(!Number.isFinite(ground)||ground<.16){skippedWet++;continue;}
   const variant=library.variants[(j+k*2)%3],height=rr(h0,h1)*(j%7===0?.83:1),s=height/variant.height,yaw=rr(0,Math.PI*2),y=ground-.035,matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw),new T.Vector3(s,s,s)),bounds=variant.bounds.clone().applyMatrix4(matrix);
   if(protectedRoofs.some(box=>box.intersectsBox(bounds.clone().expandByScalar(.18)))){skippedRoof++;continue;}
   for(const p of variant.parts){emit(p.geometry,p.material,x,y,z,s,s,s,[0,yaw,0],1);triangles+=(p.geometry.index?.count||p.geometry.attributes.position.count)/3;}
   records.push({cluster:k,variant:variant.name,rootWorld:[x,y,z],soilY:ground,height,uniformScale:s,worldBounds:[bounds.min.toArray(),bounds.max.toArray()],rootBurial:ground-bounds.min.y});
  }
 }
 return{info:{revision:'scene07-layered-visible-natural-fir-crowns340-r06',source:ASSET340,provenance:'reconstructions/scene-02/assets/fir-sapling/provenance.json',license:'CC0-1.0',authors:{modeling:'Rico Cilliers',photography:'Rob Tuytel'},trees:records.length,sourceVariants:3,submittedTriangles:triangles,skippedWet,skippedRoof,records,rootSurface:'Actual rendered Float32 soil triangles; original source root embedded35mm',originalGeometryAndUVs:true,wholeTreeUniformScale:true,originalOpaqueBranchAndTwigGeometry:true,newImageOrMeshAssets:false,cameraFacing:false,referencePixels:false,newLights:0,visualAccepted:false},dispose(){library.dispose();}};
}

export async function buildFirGrove340(args){const library=await loadFir340();return placeFirGrove340({...args,library});}
