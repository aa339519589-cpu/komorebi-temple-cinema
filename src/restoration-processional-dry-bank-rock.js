// Optional repair of one original4 dry-bank rock assembly beside the fixed path.
// Apply the same world translation to its original stone body and five moss parts.
// No new random draw, scale, rotation, camera, path or bridge change is authorized.
export const processionalDryBankRockPlan=Object.freeze({
  version:'reference4-dry-bank-rock-clearance-v1',
  originalWorldAnchor:Object.freeze([-3.467408596161282,-.042,21.040772027405048]),
  worldDelta:Object.freeze([-.27,.0008297470288352038,.05]),
  originalAssemblyParts:6,
  source:'Actual original4-style curb / source-rock triangle contact in v49, plus actual terrain support and bounded neighbouring-solid check.',
  limits:'Authored clearance repair, not recovered photographic coordinates. Preserve the original stone and five moss parts as one assembly. Final integrated-source audit required.'
});
export function referenceProcessionalDryBankRockDelta(originalWorldAnchor){
  if(!Array.isArray(originalWorldAnchor)||originalWorldAnchor.length!==3||!originalWorldAnchor.every(Number.isFinite))throw new TypeError('A finite original world-space anchor is required.');
  return processionalDryBankRockPlan.originalWorldAnchor.every((x,i)=>Math.abs(x-originalWorldAnchor[i])<1e-8)?[...processionalDryBankRockPlan.worldDelta]:null;
}
