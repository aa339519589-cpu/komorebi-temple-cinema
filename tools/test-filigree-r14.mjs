import * as T from '../vendor/build/three.module.js';
import assert from 'node:assert/strict';
import {applySanctuaryPiercedFiligree} from '../src/sanctuary-pierced-filigree-r14.js';
const scene=new T.Scene(),group=new T.Group();group.name='restoration-reference6-side-pendants';scene.add(group);
const material=new T.MeshStandardMaterial({name:'original-r12-backing',color:0xb78b36,metalness:.83,roughness:.4});
for(const x of[-4.15,4.15]){const mesh=new T.Mesh(new T.BoxGeometry(.704,3.13,.020),material);mesh.name='reference6-solid-chased-pendant';mesh.position.set(x,4.70,2.046);group.add(mesh)}
const original=group.children.slice();const oldVertexBuffers=original.map(x=>x.geometry.attributes.position.array.slice());
const f=applySanctuaryPiercedFiligree({scene});let meshes=0,triangles=0;
f.root.traverse(o=>{if(o.isMesh){meshes++;const a=o.geometry.attributes.position.array;for(const v of a)assert(Number.isFinite(v));triangles+=((o.geometry.index?.count??o.geometry.attributes.position.count)/3)*(o.isInstancedMesh?o.count:1);assert(o.castShadow);}});
assert(meshes>=5);assert(triangles>10000);assert.equal(f.report().actualOpenwork,true);assert(original.every(o=>!o.visible));
f.setEnabled(false);assert(original.every(o=>o.visible)&&!f.root.visible);
f.setEnabled(true);assert(original.every(o=>!o.visible));
f.dispose();assert(original.every(o=>o.visible));assert.equal(group.children.length,2);
for(const [i,o]of original.entries())assert.deepEqual(o.geometry.attributes.position.array,oldVertexBuffers[i]);
console.log(JSON.stringify({meshes,triangles,geometryPreserved:true,rollbackWorks:true},null,2));
