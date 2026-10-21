import * as T from 'three';

// Position and viewing attitude have independent, smooth trajectories. Blending
// a nearby and a distant look-at point changes the angle abruptly at the start.
export function createDollyPath({points,nearTarget,farTarget,fov=59}){
 const path=new T.CubicBezierCurve3(...points.map(p=>new T.Vector3(...p))),up=new T.Vector3(0,1,0);
 const attitude=(p,t)=>new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(p,t,up));
 const first=new T.Vector3(...points[0]),last=new T.Vector3(...points[3]);
 const near=new T.Vector3(...nearTarget),far=new T.Vector3(...farTarget),q0=attitude(first,near),q1=attitude(last,far);
 const d0=first.distanceTo(near),d1=last.distanceTo(far);
 return time=>{
  const t=T.MathUtils.clamp(time/7,0,1),s=t*t*t*(10+t*(-15+6*t));
  const p=path.getPointAt(s),q=q0.clone().slerp(q1,s),direction=new T.Vector3(0,0,-1).applyQuaternion(q);
  const focusDistance=1/((1-s)/d0+s/d1),target=p.clone().addScaledVector(direction,focusDistance);
  return{position:p.toArray(),target:target.toArray(),focusDistance,fov,phase:s};
 };
}
