import * as T from 'three';

const clamp=T.MathUtils.clamp;
const ease=x=>{x=clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
const point=a=>new T.Vector3(...a);
const lookQuaternion=(position,target)=>new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(position,target,new T.Vector3(0,1,0)));

// R08 scene, geometry, materials and reference ending are frozen. This module
// changes only the real camera rail, orientation, lens and optical focus.
export function createReference6CameraShot(reference,legacyCenserLocator){
 const duration=7,end=point(reference.position),endTarget=point(reference.target);
 // Exact retained actual NC source eye-bridge/face vertex40685 under its unchanged
 // positive uniform fit. Provenance: actual-face-focus-point189-r02.json.
 const detail=new T.Vector3(0.07716570895142351,5.389201956438872,-2.2639334277095604);
 const start=new T.Vector3(1.05,1.30,1.95),startAim=new T.Vector3(0,4.70,-2.30);
 // Stay beside the censer and above the foreground table while retreating;
 // descend to the original kneeling eye only after clearing the furniture.
 const controls=[start,new T.Vector3(1.30,1.36,3.85),new T.Vector3(.65,1.18,6.65),end];
 const rail=new T.CubicBezierCurve3(...controls),qStart=lookQuaternion(start,startAim),qEnd=lookQuaternion(end,endTarget);
 const referenceFocus=end.distanceTo(endTarget),openingFov=42;
 function sample(localTime=0){
  const seconds=clamp(Number.isFinite(Number(localTime))?Number(localTime):0,0,duration),t=seconds/duration,u=ease(t),atEnd=seconds===duration;
  const position=atEnd?end.clone():rail.getPoint(u);
  // Quaternion orientation is independent of the rail. Restore world-up after
  // the geodesic interpolation so the sanctuary columns do not acquire roll.
  const interpolated=qStart.clone().slerp(qEnd,u).normalize();
  const direction=new T.Vector3(0,0,-1).applyQuaternion(interpolated);
  const quaternion=atEnd?qEnd.clone():lookQuaternion(position,position.clone().add(direction));
  const forward=new T.Vector3(0,0,-1).applyQuaternion(quaternion);
  const focusPull=ease((seconds-4.9)/2.1),focusPoint=detail.clone().lerp(endTarget,focusPull);
  const focusDistance=atEnd?referenceFocus:Math.max(.25,focusPoint.clone().sub(position).dot(forward));
  // Detail priority: the main figure remains fully sharp throughout.
  // The unchanged DOF pass is disabled at every pose, with no focus snap.
  const focusStrength=0;
  const targetWitness=atEnd?endTarget.clone():position.clone().addScaledVector(forward,focusDistance);
  const fov=atEnd?reference.fov:T.MathUtils.lerp(openingFov,reference.fov,u);
  return {seconds,t,u,position,quaternion,forward,targetWitness,focusPoint,focusDistance,focusStrength,fNumber:11,fov,atEnd};
 }
 return {sample,info:{revision:'scene06-low-statue-retreat189-r02-crisp-face',duration,subject:{label:'Actual central Amida eye-bridge/face surface; main figure DOF disabled for fine detail',point:detail.toArray(),source:'Unchanged SC07 actual face vertex40685, uniform scale2.50/3.26 and existing seat/altar translation; no model edits',license:'CC-BY-NC-SA-4.0'},legacyCenserLocator:{...legacyCenserLocator,usedForThisPath:false},controls:controls.map(p=>p.toArray()),start:{position:start.toArray(),target:startAim.toArray(),quaternion:qStart.toArray(),fov:openingFov},end:{position:[...reference.position],target:[...reference.target],quaternion:qEnd.toArray(),fov:reference.fov},orientation:'Shortest quaternion slerp independent of cubic rail, with world-up roll correction; exact original ending quaternion',timeCurve:'quintic smootherstep; zero first/second derivatives at endpoints',lens:'Actual perspective FOV42 to unchanged reference FOV, smoothly widened with rail progress; no image scaling',focus:{mode:'DOF disabled for every pose; face/eyes/lips/robe retain native detail, with no focus snap',firstPullSeconds:4.9,lastPullSeconds:7,fNumber:11,referenceFocusDistance:referenceFocus,referenceMode:'Original no-DOF reference mode restored exactly at7s'}}};
}
