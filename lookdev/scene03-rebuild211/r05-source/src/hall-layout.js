// Shared source03 candidate from the bounded architectural landmark fit.
// Dimensions/feature identities are inferred, not a recovered survey.
// The low camera and hall/stair transforms are consumed by actual geometry.
import {ARCHITECTURE106 as fit} from './architecture-layout106.js';
export const hallPlacement=Object.freeze(fit.hall);
// The stair is a narrower flight on a raised rock terrace. Its independent
// 0.20rad turn follows the observed bridge approach rather than continuing
// the hall's facade normal down into the open pond.
export const stairPlacement=Object.freeze({width:4.0,relativeYaw:.20,centerX:-.55,run:7.8,bottomWorldY:2.15,topWorldY:4+hallPlacement.y});
export const referenceCamera=Object.freeze(fit.camera);
export function hallFixtureMatrix(T){
 return new T.Matrix4().makeTranslation(hallPlacement.x,hallPlacement.y,hallPlacement.z+hallPlacement.pivotZ)
  .multiply(new T.Matrix4().makeRotationY(hallPlacement.yaw))
  .multiply(new T.Matrix4().makeTranslation(-5,0,7));
}
