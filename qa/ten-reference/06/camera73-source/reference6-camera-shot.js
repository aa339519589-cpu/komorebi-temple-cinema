import * as T from 'three';

const clamp=T.MathUtils.clamp;
const ease=x=>{x=clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
const point=a=>new T.Vector3(...a);
const lookQuaternion=(position,target)=>new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(position,target,new T.Vector3(0,1,0)));

// A physical kneeling dolly, not a moving world-space lookAt target. The
// orientation is interpolated on SO(3), independently of the cubic rail.
// Quintic time easing gives zero velocity/acceleration at both shot ends.
export function createReference6CameraShot(reference,subject){
 const duration=7,end=point(reference.position),endTarget=point(reference.target),detail=point(subject.point);
 const start=new T.Vector3(detail.x+.18,.82,detail.z+.95);
 const controls=[start,new T.Vector3(detail.x+.24,.80,T.MathUtils.lerp(start.z,end.z,.25)),new T.Vector3(-.07,.60,T.MathUtils.lerp(start.z,end.z,.79)),end];
 const rail=new T.CubicBezierCurve3(...controls),qStart=lookQuaternion(start,detail),qEnd=lookQuaternion(end,endTarget);
 const referenceFocus=end.distanceTo(endTarget);
 function sample(localTime=0){
  const seconds=clamp(Number.isFinite(Number(localTime))?Number(localTime):0,0,duration),t=seconds/duration,u=ease(t),atEnd=seconds===duration;
  const position=atEnd?end.clone():rail.getPoint(u),quaternion=atEnd?qEnd.clone():qStart.clone().slerp(qEnd,u).normalize();
  const forward=new T.Vector3(0,0,-1).applyQuaternion(quaternion);
  // First hold the real near cartouche, then pull toward the original altar
  // plane as the room is revealed. This point affects focus only, never aim.
  const focusPull=ease((seconds-2.0)/4.1),focusPoint=detail.clone().lerp(endTarget,focusPull);
  const focusDistance=atEnd?referenceFocus:Math.max(.25,focusPoint.clone().sub(position).dot(forward));
  const focusStrength=atEnd?0:1-ease((seconds-5.9)/1.1);
  const targetWitness=atEnd?endTarget.clone():position.clone().addScaledVector(forward,focusDistance);
  return {seconds,t,u,position,quaternion,forward,targetWitness,focusPoint,focusDistance,focusStrength,fNumber:2.8,fov:reference.fov,atEnd};
 }
 return {sample,info:{revision:'scene06-kneeling-censer-dolly-camera73',duration,subject:{...subject,point:detail.toArray()},controls:controls.map(p=>p.toArray()),start:{position:start.toArray(),quaternion:qStart.toArray(),fov:reference.fov},end:{position:[...reference.position],target:[...reference.target],quaternion:qEnd.toArray(),fov:reference.fov},orientation:'Shortest quaternion slerp independent of cubic rail',timeCurve:'quintic smootherstep; zero first/second derivatives at endpoints',focus:{firstPullSeconds:2.0,lastPullSeconds:6.1,fNumber:2.8,referenceFocusDistance:referenceFocus,referenceMode:'Original scene has no DOF; pass disabled for renderReference/renderView and at7s'}}};
}
