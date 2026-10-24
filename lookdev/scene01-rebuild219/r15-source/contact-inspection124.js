import * as T from 'three';

// Internal negative shot ID only. Reuse the existing emitted instance matrices,
// geometry, materials and lights; omit plants/soil to expose masonry contacts.
// Normal reference and seven-second movie paths never enter this function.
export function renderStairContact124(scene,renderView){
 const roles=['great-hall-stone-platform','great-hall-massive-columns','layout124-connected-hall-flight-and-landing'],allowed=new Set(roles),hidden=[],clones=[],group=new T.Group();
 group.name='actual-source-instances-only-stair-contact-inspection';scene.updateMatrixWorld(true);
 scene.traverse(o=>{
  if(!o.isMesh)return;hidden.push([o,o.visible]);o.visible=false;
  if(!o.isInstancedMesh||!o.userData.instanceRoles)return;
  const ids=o.userData.instanceRoles.flatMap((role,i)=>allowed.has(role)?[i]:[]);if(!ids.length)return;
  const clone=new T.InstancedMesh(o.geometry,o.material,ids.length),matrix=new T.Matrix4(),color=new T.Color();clone.matrixAutoUpdate=false;clone.matrix.copy(o.matrixWorld);clone.name=o.name;clone.castShadow=o.castShadow;clone.receiveShadow=o.receiveShadow;
  ids.forEach((id,i)=>{o.getMatrixAt(id,matrix);clone.setMatrixAt(i,matrix);if(o.instanceColor){o.getColorAt(id,color);clone.setColorAt(i,color);}});clone.instanceMatrix.needsUpdate=true;clone.computeBoundingSphere();group.add(clone);clones.push(clone);
 });
 const inspection={kind:'actual-source-instance-contact-view',omitted:'Vegetation, soil, water, sky and non-target meshes are hidden for this structural inspection only.',roles,position:[-.5,5.7,-3.1],target:[4.85,3,-7.4],fov:55,instances:clones.reduce((n,m)=>n+m.count,0),visualAccepted:false};
 scene.add(group);
 try{return{...renderView(inspection.position,inspection.target,0,inspection.fov),inspection};}
 finally{scene.remove(group);for(const [o,visible]of hidden)o.visible=visible;for(const clone of clones)clone.dispose();}
}
