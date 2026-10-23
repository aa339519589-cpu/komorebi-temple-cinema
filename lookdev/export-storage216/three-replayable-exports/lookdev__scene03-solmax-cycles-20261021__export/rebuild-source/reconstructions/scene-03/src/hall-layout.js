// The low physical camera is retained. The visible hall roof, landing and
// principal shafts constrain this placement; unseen dimensions stay inferred.
// These parameters do not constitute photographic acceptance of this scene.
// The independent pond camera is retained. The main hall is raised on its
// taller stone podium and set 0.80 m farther right after reading the visible
// lower/upper left eave and entry-landing correspondences together.
export const hallPlacement=Object.freeze({yaw:-.5942,x:7.1163,y:1.25,z:-1.2975,pivotZ:-4});
export const referenceCamera=Object.freeze({position:Object.freeze([-2.4,.72,18.2]),target:Object.freeze([1.6,7.1,-3]),fov:58});
export function hallFixtureMatrix(T){
 return new T.Matrix4().makeTranslation(hallPlacement.x,hallPlacement.y,hallPlacement.z+hallPlacement.pivotZ)
  .multiply(new T.Matrix4().makeRotationY(hallPlacement.yaw))
  .multiply(new T.Matrix4().makeTranslation(-5,0,7));
}
