import * as T from 'three';

// A low camera retreats from the modeled lantern to the canonical courtyard.
// Eye position, focus target and their first derivatives remain continuous.
export function createDollyPath({points,nearTarget,farTarget,fov=59}){
 const path=new T.CubicBezierCurve3(...points.map(p=>new T.Vector3(...p)));
 const near=new T.Vector3(...nearTarget),far=new T.Vector3(...farTarget);
 return time=>{
  const t=T.MathUtils.clamp(time/7,0,1),s=t*t*(3-2*t);
  const position=path.getPoint(s),target=near.clone().lerp(far,s);
  return{position:position.toArray(),target:target.toArray(),focusDistance:position.distanceTo(target),fov};
 };
}
