// Whole, concentric square storeys. The source's lower near corner is a
// shallow waist pent roof ON the main story, not a previous full eave. A
// single geometric progression fitted to that mistaken anchor displaced the
// complete upper corner axis. Each complete real storey now has its own
// positive scale/base; roof, frame, fixtures and galleries move together.
export const TIER_SPEC=Object.freeze({width:8.8,roofAddition:5.87173815,roofHeight:4.08731086,roofRise:3.83660786,bearingVerticalScale:1.38,bearingHorizontalScale:1.18,baseY:.35,tailCutHeight:2.50,tailReach:.75,lanternHeight:2.73535574});
export const STORIES=Object.freeze([
 {scale:1,baseY:-.90,roofHeight:4.65,roofRise:3.25,bearingVerticalScale:.75,tailCutHeight:.65,lanternHeight:1.0,lowerOccupiedFrame:true},
 {scale:.90258765,baseY:4.36459084},
 {scale:.64193827,baseY:11.44746026},
 {scale:.53004841,baseY:16.49041769},
 {scale:.43994018,baseY:20.65511826}
].map(Object.freeze));
export const POSE=Object.freeze({position:[12.38431455,.8,14.60021708],target:[-17.09887615,15,-5.55294464],fov:38.94129879,principal:[.30303030,.77495212]});
export function tierPlacement(level){const t=STORIES[level];if(!t)throw new RangeError('Unknown pagoda storey');return{level,...TIER_SPEC,...t};}
export function tierWorldPoint(level,p){const t=tierPlacement(level);return[p[0]*t.scale,t.baseY+p[1]*t.scale,p[2]*t.scale];}
const nearLanternRadius=(TIER_SPEC.width+TIER_SPEC.roofAddition)/2*1.025;
export const DOLLY=Object.freeze({"points":[[8.1,0.72,10],[9.55,0.74,11.55],[11.05,0.78,13.2],[12.38431455,0.8,14.60021708]],"nearTarget":[-13.080656879175743,31.031739780932924,-0.4702753920168554],"farTarget":[-17.09887615,15,-5.55294464],"fov":38.94129879});
