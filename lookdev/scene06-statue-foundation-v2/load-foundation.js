import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Optional integration adapter. This module does not change the live scene.
// Both candidates are real indexed, lit meshes and contain zero image maps.
const revisions={
  r04:'r04-japanese-scan-head/japanese-buddha-real-head-foundation.glb',
  r06:'r06-japanese-face-neck-study/japanese-buddha-hybrid-foundation.glb',
};

/** Load the isolated foundation into an existing Three.js scene.
 * The optional height is in the caller's world units, measured over the full
 * statue and lotus assembly. The returned origin lies at the lotus root.
 * This helper deliberately leaves camera/lighting and final placement to the
 * existing scene owner. Loading it is not photographic acceptance.
 */
export async function loadStatueFoundation({revision='r06',height=null,includeLotus=true}={}){
  if(!revisions[revision])throw new Error('Unknown statue foundation revision: '+revision);
  const gltf=await new GLTFLoader().loadAsync(new URL(revisions[revision],import.meta.url).href);
  const group=gltf.scene;group.name='unaccepted-scene06-japanese-foundation-'+revision;
  const components={head:[],hair:[],body:[],hands:[],robeApron:[],jewelry:[],lotus:[]};
  group.traverse(o=>{
    if(!o.isMesh)return;
    o.castShadow=true;o.receiveShadow=true;
    const n=o.name;
    if(n.startsWith('01_'))components.head.push(o);
    else if(n.startsWith('05_'))components.hair.push(o);
    else if(n.startsWith('06_'))components.body.push(o);
    else if(n.startsWith('08_'))components.hands.push(o);
    else if(n.startsWith('10_'))components.robeApron.push(o);
    else if(n.startsWith('11_'))components.jewelry.push(o);
    else if(n.startsWith('12_')){components.lotus.push(o);o.visible=includeLotus;}
  });
  group.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3());
  if(!(size.y>0))throw new Error('Statue foundation has no finite upright extent.');
  if(height!==null){
    if(!(Number.isFinite(height)&&height>0))throw new Error('Foundation height must be positive.');
    group.scale.multiplyScalar(height/size.y);
  }
  group.updateMatrixWorld(true);
  const placedBounds=new THREE.Box3().setFromObject(group),center=placedBounds.getCenter(new THREE.Vector3());
  group.position.sub(new THREE.Vector3(center.x,placedBounds.min.y,center.z));
  group.userData={...group.userData,revision,visualAccepted:false,
    attribution:'Buddha Head by beachmouse, CC BY 4.0, via Sketchfab and Objaverse; cropped, rigidly retargeted, subdivided and regilded. New body, two raised hands, hair, ornaments and lotus authored for this study.',
    source:'https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab',
    sourceLicense:'https://creativecommons.org/licenses/by/4.0/',
    sourceLocation:'Japanese tea garden, California; maker/date/origin undocumented.',
    status:'Independent modeling study; full native room comparison remains required.'};
  return{group,components,sourceBounds:bounds,sourceHeight:size.y,revision,visualAccepted:false};
}
