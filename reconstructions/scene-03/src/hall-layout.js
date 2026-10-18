// Calibrated only against four manually read eave correspondences. The physical
// low camera, independent pagoda and pond/bridge geometry are kept as anchors.
// These parameters do not constitute photographic acceptance of this scene.
export const hallPlacement=Object.freeze({yaw:-.5942,x:6.3163,z:-1.2975,pivotZ:-4});
export const referenceCamera=Object.freeze({position:Object.freeze([-2.4,.72,18.2]),target:Object.freeze([1.6,6.1,-3]),fov:58});
export function hallFixtureMatrix(T){
 return new T.Matrix4().makeTranslation(hallPlacement.x,0,hallPlacement.z+hallPlacement.pivotZ)
  .multiply(new T.Matrix4().makeRotationY(hallPlacement.yaw))
  .multiply(new T.Matrix4().makeTranslation(-5,0,7));
}
