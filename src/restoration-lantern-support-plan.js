import {referenceExteriorPlan} from './restoration-landscape-layout.js';
import {restorationIslandSurface} from './restoration-island-planting.js';

// Placement correction only. No geometry, ground, island or extra lamp is made.
// These points are physical-support/clearance candidates, not unique positions
// recovered photogrammetrically from the references.
function moundSeat(islandIndex,x,z,scale){
  const island=referenceExteriorPlan.islands[islandIndex];let minY=Infinity,maxY=-Infinity;
  for(let k=0;k<360;k++){const a=k/360*Math.PI*2,p=restorationIslandSurface(island,x+Math.cos(a)*(.50*scale+.045),z+Math.sin(a)*(.50*scale+.045));if(!p.inside)throw Error('Lantern root disk leaves original island');minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
  // The whole flat bottom is slightly buried, rather than balancing the base
  // at the highest soil point and leaving its downslope half floating.
  return{anchor:[x,minY-.006,z,scale],support:{kind:'existing-island',islandIndex,minY,maxY,embedded:true}};
}
const old=referenceExteriorPlan.lanterns;
const records=[
  moundSeat(5,old[0][0],old[0][2],old[0][3]),
  moundSeat(1,3.719273238,1.344909604,old[1][3]),
  moundSeat(3,old[2][0],old[2][2],old[2][3]),
  moundSeat(4,old[3][0],old[3][2],old[3][3]),
  moundSeat(2,-16.810726762,1.094909604,old[4][3]),
  {anchor:[7.27,-.07438280284902547,-9.825,old[5][3]],support:{kind:'existing-triangulated-terrain',minimumCheckedHeight:-.07038280284902547,maximumCheckedHeight:-.06755409236061094,embedded:true}},
  moundSeat(0,-10.905726762,-3.085090396,old[6][3]),
  {anchor:[8.19,.354,7.384909604,old[7][3]],support:{kind:'existing-east-veranda-cedar-deck',walkingTop:.354,stoneSubstrate:.30,boardJointWidth:.012}}
];
export const restorationLanternSupportPlan=Object.freeze(records.map((r,index)=>Object.freeze({...r,index,oldAnchor:[...old[index]],horizontalMove:Math.hypot(r.anchor[0]-old[index][0],r.anchor[2]-old[index][2]),scaleUnchanged:r.anchor[3]===old[index][3]})));
export const restorationSupportedLanternAnchors=Object.freeze(restorationLanternSupportPlan.map(p=>Object.freeze([...p.anchor])));
// Existing low shrubs can clip their spread around the final hardscape bases.
export const restorationLanternPlantingExclusions=Object.freeze(restorationSupportedLanternAnchors.map(([x,y,z,s])=>Object.freeze({x,z,radius:.655*s+.06})));
export const restorationLanternSupportStatus=Object.freeze({
  scope:'Eight existing lanterns, no added bases/islands; same scales and 144 old world random draws.',
  evidence:'Original refs4/8 constrain outdoor garden/courtyard placement; exact coordinates are physical reconstruction choices, not unique photographic recovery.',
  sideVerandaSearch:'Original-size right lantern found no safe side-veranda point on the tested 25 mm grid after actual triangle, full footprint, wall/rail and timber/stone step checks. Conservative whole-platform search excluded indoor positions and the central doorway. It is instead on the nearest supported original land strip, not stacked on the right island.',
  clearance:'Full base and roof envelope checked against architecture and woody plants. The bottom .43 unit stone plinth is intentionally inset into existing soil/paving and dressing stones; those ground contacts are not claimed to be disjoint.',
  integration:'Pass these anchors to buildRestorationStoneLanterns, then refresh getEmitterMetadata before connecting lights. Do not apply the site transform a second time.'
});
