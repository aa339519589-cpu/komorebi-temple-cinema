import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
let geometry=null;
let info=null;
export async function loadLearnedCentralFace(){
 const asset=await new GLTFLoader().loadAsync(new URL('../assets/learned-face-v04-nasal/central-face.glb',import.meta.url).href);
 if((asset.parser.json.images?.length??0)||(asset.parser.json.textures?.length??0))throw Error('The learned face must be an untextured explicit mesh');
 asset.scene.updateMatrixWorld(true);const meshes=[];asset.scene.traverse(o=>{if(o.isMesh)meshes.push(o)});
 if(meshes.length!==1)throw Error('One prepared facial mesh is required');
 const mesh=meshes[0];geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const b=geometry.boundingBox;if(b.min.y<2.35||b.max.y>3.215||b.max.x-b.min.x>1.1)throw Error('Prepared face is outside the unchanged statue frame');
 if(!geometry.attributes.uv){const p=geometry.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push(Math.atan2(p.getX(i),p.getZ(i)+.1)/(2*Math.PI)+.5,(p.getY(i)-2.36)/.845);geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));}
 geometry.name='learned-central-face-and-ears';info={asset:'learned-face-v04-nasal',source:'Original MIT TripoSG shape with closed local alar repair with continuous section fairing; bridge, lips and other facial volume retained',triangles:(geometry.index?.count??geometry.attributes.position.count)/3,bounds:[b.min.toArray(),b.max.toArray()],images:0,textures:0,visualAccepted:false};
 mesh.geometry.dispose();for(const m of(Array.isArray(mesh.material)?mesh.material:[mesh.material]))m?.dispose();return info;
}
export function learnedCentralFace(){return geometry;}
export function learnedCentralFaceInfo(){return info;}
