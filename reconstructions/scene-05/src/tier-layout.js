// One common low camera and one canonical tier. The positive uniform tier
// transforms act on roofs, frames, bearings, galleries and fixtures together.
// Parameters come from the bounded manual-landmark fit retained in scene05 QA;
// they remain a reconstruction hypothesis, not a recovered survey or lens.
export const TIER_SPEC=Object.freeze({width:8.8,pitch:5.70,ratio:.83656108,roofAddition:4.38973926,roofHeight:3.85697332,roofRise:3.50,bearingVerticalScale:1.65313409,bearingHorizontalScale:1.12,baseY:.35,tailCutHeight:1.92});
export const POSE=Object.freeze({position:[14.82335137,.8,14.62564576],target:[-4.93362536,15,-.40723472],fov:27.82285810});
export function tierPlacement(level){const scale=TIER_SPEC.ratio**level,baseY=TIER_SPEC.baseY+TIER_SPEC.pitch*(1-scale)/(1-TIER_SPEC.ratio);return{level,scale,baseY};}
export function tierWorldPoint(level,p){const t=tierPlacement(level);return[p[0]*t.scale,t.baseY+p[1]*t.scale,p[2]*t.scale];}
const nearLanternRadius=(TIER_SPEC.width+TIER_SPEC.roofAddition)/2*1.025;
export const DOLLY=Object.freeze({points:[[10.2,.72,11.4],[11.2,.76,12.2],[13.8,.80,13.8],POSE.position],nearTarget:tierWorldPoint(1,[nearLanternRadius,2.60,nearLanternRadius]),farTarget:POSE.target,fov:POSE.fov});
