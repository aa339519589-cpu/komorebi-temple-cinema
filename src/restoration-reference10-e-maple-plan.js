import * as T from 'three';

// Opt-in E-camera scene hypothesis. This module creates no geometry and never
// moves a tree by itself. Do not apply to the common site or other references.
export const restorationReference10EMaplePlan=Object.freeze({
  version:'reference10-E-existing-red-maple-placement-1',reference:10,
  oldCall:Object.freeze([19,12,9.4,'maple','leafRed',-.6]),
  oldRoot:Object.freeze([19,-.2,12]),
  anchor:Object.freeze([-10.7,-.09329421754475263,18.5]),
  relativeYawRadians:0,scale:1,horizontalDisplacement:30.402960382173312,
  rootDiskRadius:.58,oldWorldRandomDraws:201,preserveOriginalFiveRootStones:true,
  camera:Object.freeze({position:Object.freeze([-16.22035572983939,.6962882489311694,24.074999999999996]),target:Object.freeze([-11.02454356790217,2.2683799187311875,-5.429780354369882]),fov:60.07108337546772}),
  support:Object.freeze({kind:'existing actual triangulated terrain',minimumSoilHeight:-.0812942209304201,maximumSoilHeight:-.07682139535044577,minimumEmbedding:.011999996614332528,minimumSoilAboveWater:.03870577906957989,continuousCircle:true}),
  evidence:Object.freeze({sourceCheckpoint:'v45 CPU candidate',worldSha256:'ed3940676beaa004ba8b87ad7d3269f4ea148b34367b0cc61cefc47fcec87fdb',architectureSha256:'488795f9ff00009bc2f9bfc0b23bf0c3a65238528bf239ac96bb564089f7b7dd',nearSolidInstances:3212,exactWoodSurfaceContacts:0,sampledWoodContainments:0,projectedLeafCentres:1680,opaqueUnblockedLeafCentres:1510}),
  limits:'A substantial 30.403m reference10-only layout hypothesis, not uniquely recovered coordinates or a small support repair. Same old tree, no scale/crown change, no extra tree/island/platform, no deleted architecture. Projection and opaque rays do not establish alpha-covered area, lighting or photographic match. Rerun exact support/clearance after source/camera changes.'
});
export function createRestorationReference10EMapleTransform(){
  const p=restorationReference10EMaplePlan;
  return new T.Matrix4().makeTranslation(...p.anchor)
    .multiply(new T.Matrix4().makeRotationY(p.relativeYawRadians))
    .multiply(new T.Matrix4().makeTranslation(...p.oldRoot.map(v=>-v)));
}
