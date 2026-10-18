export * from '../vendor/build/three.module.js';
import * as T from '../vendor/build/three.module.js';
/** Render scope, not a changed whole-site model. The full site remains available
 * with scope=site; this room-only entry omits exterior indirect/shadow contributors. */
export class WebGLRenderer extends T.WebGLRenderer {
 constructor(options){
  super(options);
  const interior=new URLSearchParams(location.search).get('scope')!=='site';
  const audited=new WeakMap(),reports=[];const raw=this.render.bind(this);
  this.transmissionResolutionScale=.5;
  const volume=new T.Box3(new T.Vector3(-8.9,2.95,-18),new T.Vector3(5.9,19.6,4.2));
  const fitShadow=light=>{
   const shadow=light.shadow;shadow.mapSize.set(2048,2048);shadow.updateMatrices(light);
   const corners=[];for(const x of [volume.min.x,volume.max.x])for(const y of [volume.min.y,volume.max.y])for(const z of [volume.min.z,volume.max.z])corners.push(new T.Vector3(x,y,z).applyMatrix4(shadow.camera.matrixWorldInverse));
   const b=new T.Box3().setFromPoints(corners),c=shadow.camera;
   c.left=b.min.x-1.5;c.right=b.max.x+1.5;c.bottom=b.min.y-1.5;c.top=b.max.y+1.5;c.near=Math.max(.1,-b.max.z-4);c.far=-b.min.z+4;c.updateProjectionMatrix();shadow.updateMatrices(light);
  };
  this.render=(scene,camera)=>{
   if(interior&&scene.isScene&&scene.getObjectByName('restoration-reference6-altar')){
    if(!audited.has(scene)){
     scene.updateMatrixWorld(true);const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o)});
     const report={scope:'sanctuary geometry intersection, not whole-site fidelity',bounds:{min:volume.min.toArray(),max:volume.max.toArray()},keptMeshes:0,removedMeshes:0,keptInstances:0,removedInstances:0,keptTriangles:0,removedTriangles:0,retainedTransformsChanged:0,referencePixelsUsed:false,reflectionSamples:0};
     const m=new T.Matrix4(),local=new T.Matrix4(),box=new T.Box3();
     for(const mesh of meshes){
      const g=mesh.geometry;g.computeBoundingBox();const tris=(g.index?.count??g.attributes.position.count)/3;
      if(mesh.isReflector){if(mesh.name==='restoration-sanctuary-floor-clearcoat'){const rt=mesh.getRenderTarget();rt.samples=0;const n=Math.min(1536,Math.max(768,Math.round(this.domElement.width*1.2)));rt.setSize(n,n);const u=mesh.material.uniforms;if(u.floorTexel)u.floorTexel.value.set(1/n,1/n);report.reflectionSize=n;}else{mesh.visible=false;mesh.removeFromParent();report.removedMeshes++;}continue;}
      if(mesh.isInstancedMesh){
       const ids=[];
       for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,local);m.multiplyMatrices(mesh.matrixWorld,local);box.copy(g.boundingBox).applyMatrix4(m);if(box.intersectsBox(volume))ids.push(i);}
       report.keptInstances+=ids.length;report.removedInstances+=mesh.count-ids.length;report.keptTriangles+=tris*ids.length;report.removedTriangles+=tris*(mesh.count-ids.length);
       if(!ids.length){mesh.removeFromParent();report.removedMeshes++;continue;}
       if(ids.length!==mesh.count){
        const matrices=new Float32Array(ids.length*16),colors=mesh.instanceColor?new Float32Array(ids.length*3):null;
        for(let at=0;at<ids.length;at++){const i=ids[at];matrices.set(mesh.instanceMatrix.array.subarray(i*16,i*16+16),at*16);if(colors)colors.set(mesh.instanceColor.array.subarray(i*3,i*3+3),at*3);}
        mesh.instanceMatrix=new T.InstancedBufferAttribute(matrices,16);mesh.instanceMatrix.needsUpdate=true;if(colors){mesh.instanceColor=new T.InstancedBufferAttribute(colors,3);mesh.instanceColor.needsUpdate=true;}
        mesh.count=ids.length;mesh.boundingBox=null;mesh.boundingSphere=null;mesh.computeBoundingBox();mesh.computeBoundingSphere();
       }
       report.keptMeshes++;
      }else{
       box.copy(g.boundingBox).applyMatrix4(mesh.matrixWorld);
       if(box.intersectsBox(volume)){report.keptMeshes++;report.keptTriangles+=tris;}else{mesh.removeFromParent();report.removedMeshes++;report.removedTriangles+=tris;}
      }
     }
     audited.set(scene,report);reports.push(report);console.info('SANCTUARY_GPU_SCOPE',JSON.stringify(report));
    }
    scene.traverse(o=>{if(o.isDirectionalLight&&o.castShadow)fitShadow(o)});
   }
   return raw(scene,camera);
  };
  this.productionMemoryScope=()=>({interior,scopes:reports,transmissionResolutionScale:this.transmissionResolutionScale});
 }
}
