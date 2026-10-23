import * as T from 'three';

// A low camera retreats from the modeled finial to the canonical courtyard.
// Eye position, focus target and their first derivatives remain continuous.
export function createDollyPath({points,nearTarget,farTarget,fov=59}){
 const path=new T.CubicBezierCurve3(...points.map(p=>new T.Vector3(...p)));
 const near=new T.Vector3(...nearTarget),far=new T.Vector3(...farTarget);
 return time=>{
  const t=T.MathUtils.clamp(time/7,0,1),s=t*t*(3-2*t);
  const position=path.getPoint(s);
  // Angular aim is independent of range: blending world targets made the
  // distant hall dominate the close subject almost immediately.
  const nearDirection=near.clone().sub(position).normalize();
  const farDirection=far.clone().sub(position).normalize();
  const direction=nearDirection.lerp(farDirection,s).normalize();
  const focusDistance=T.MathUtils.lerp(position.distanceTo(near),position.distanceTo(far),s);
  const target=position.clone().addScaledVector(direction,focusDistance);
  return{position:position.toArray(),target:target.toArray(),focusDistance:position.distanceTo(target),fov};
 };
}
