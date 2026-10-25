import * as T from 'three';

// Read-only geometric evidence from the actual complete native scene. Runs
// once inside its official render job; no alternate scene or shadow proxy.
export function auditDaylight284(scene,sun,camera){
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const objects=[];scene.traverseVisible(o=>{if(o.isMesh&&!o.isReflector&&!o.material?.isShaderMaterial&&o.material?.visible!==false)objects.push(o);});
 const D=sun.position.clone().sub(sun.target.position).normalize(),oldD=new T.Vector3(-.72,.50,-.48).normalize();
 const trace=(origin,direction,max=30)=>{
  const r=new T.Raycaster(new T.Vector3(...origin),direction.clone().normalize(),.0001,max),all=r.intersectObjects(objects,false),hits=[];
  for(const h of all){
   if(hits.some(p=>p.objectUUID===h.object.uuid&&p.instance===h.instanceId&&Math.abs(p.distance-h.distance)<1e-5))continue;
   const o=h.object,m=(Array.isArray(o.material)?o.material:[o.material])[h.face?.materialIndex??0],matrix=o.matrixWorld.clone();
   if(h.instanceId!==undefined){const im=new T.Matrix4();o.getMatrixAt(h.instanceId,im);matrix.multiply(im);}
   const normal=h.face.normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(matrix));
   const ancestry=[];for(let q=o;q;q=q.parent)if(q.name)ancestry.unshift(q.name);
   hits.push({objectUUID:o.uuid,name:o.name,ancestry,instance:h.instanceId,distance:h.distance,triangle:h.faceIndex,material:m.name,positionYUp:h.point.toArray(),outwardFaceNormalYUp:normal.toArray(),paper:m.name.startsWith('scene06-paper234-'),transparent:!!m.transparent,frontFace:normal.dot(direction)<0});
  }return hits;
 };
 const witnessPoint=new T.Vector3(.077323146,5.399013914,-2.285690482),from=camera.position.toArray(),cameraDirection=witnessPoint.clone().sub(camera.position).normalize();
 const witness=trace(from,cameraDirection).find(h=>h.material.includes('central-ordinary-PBR'));
 const rows=[];
 if(witness){const p=witness.positionYUp.map((v,k)=>v+witness.outwardFaceNormalYUp[k]*.003),normal=new T.Vector3(...witness.outwardFaceNormalYUp);for(const[label,d]of[['old-sun-actual-camera-visible-face',oldD],['new-sun-actual-camera-visible-face',D]])rows.push({label,originYUp:p,normalDotToSun:normal.dot(d),hits:trace(p,d).slice(0,14)});}
 for(const[label,p]of[['central-floor',[0,.05,4]],['left-floor',[-3,.05,4]],['central-altar-front',[0,1.5,1.2]],['left-altar-front',[-2,2,0]],['upper-halo-left',[-1.5,5.9,-3]]])rows.push({label,originYUp:p,hits:trace(p,D).slice(0,14)});
 const floorGrid=[];for(const x of[-4,-2,0,2,4])for(const z of[0,2,4,6,8]){const hits=trace([x,.05,z],D);floorGrid.push({originYUp:[x,.05,z],firstHits:hits.slice(0,3),opaqueBlocked:hits.some(h=>!h.paper&&!h.transparent),paperFrontEvents:hits.filter(h=>h.paper&&h.frontFace).length});}
 return{schema:'scene06-daylight284-native-triangle-rays-v1',scope:'Read-only exact scene mesh/instance raycasts; same official GPU job; not radiometric path tracing',sunDirectionYUp:D.toArray(),sunElevationDegrees:Math.asin(D.y)*180/Math.PI,oldSunDirectionYUp:oldD.toArray(),actualCameraVisibleWitness:witness,sourceMeshRecords:objects.length,rays:rows,floorGrid,photographicAccepted:false};
}
