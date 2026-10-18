import assert from 'node:assert/strict';
import * as T from '../vendor/build/three.module.js';
import {addReference6DecorativeDepth} from '../reconstructions/reference6-v13/src/reference6-r14-depth.js';
const scene=new T.Scene(),source=new T.Group();source.name='restoration-reference6-side-pendants';scene.add(source);
const materials={
 gold:new T.MeshStandardMaterial({color:0xeabc58,metalness:.97,roughness:.25}),
 oldgold:new T.MeshStandardMaterial({color:0x9a7136,metalness:.92,roughness:.36})
};
const sample=new T.Mesh(new T.BoxGeometry(.5,.5,.5),materials.gold);scene.add(sample);
const before=scene.children.slice(),positions=sample.geometry.attributes.position.array.slice();
const addon=addReference6DecorativeDepth({scene,materials,hanging:source});
const audit=addon.audit();
assert.equal(audit.enabled,true);assert.equal(audit.sourceObjects,1);
assert.equal(audit.addMeshes,6);assert(audit.instances>500);
assert(audit.addedTriangles>30000);assert.equal(audit.originalSceneGeometryChanged,false);
assert.equal(audit.usesReferenceTexture,false);assert.equal(audit.hasAlphaPhotoPlanes,false);
addon.root.traverse(o=>{
 if(!o.isInstancedMesh)return;
 assert.equal(o.castShadow,true);assert.equal(o.receiveShadow,true);
 const a=o.geometry.attributes.position.array;
 for(const x of a)assert(Number.isFinite(x));
 for(let i=0;i<o.count;i++){
  const matrix=new T.Matrix4();o.getMatrixAt(i,matrix);
  for(const x of matrix.elements)assert(Number.isFinite(x));
 }
});
addon.setEnabled(false);assert.equal(addon.root.visible,false);
addon.setEnabled(true);assert.equal(addon.root.visible,true);
addon.dispose();assert.equal(scene.children.length,before.length);
assert.deepEqual(sample.geometry.attributes.position.array,positions);
console.log(JSON.stringify({sourceObjects:1,restored:true,...audit}));
