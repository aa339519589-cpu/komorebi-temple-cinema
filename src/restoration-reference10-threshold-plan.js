// Explicit reference10-only surface/support contract. No scene mutation.
const origin=[-13.840726762,0,22.584909604];
const radius=.3335504;
const cutouts=[];
for(const x of[-11.5,-5.5,5.5,11.5])for(const z of[-2,2]){
  const centre=[origin[0]+x*.6,.072,origin[2]+z*.6];
  cutouts.push(Object.freeze({centre:Object.freeze(centre),radius,segments:32,
    worldPolygon:Object.freeze(Array.from({length:32},(_,k)=>Object.freeze([centre[0]+radius*Math.sin(k*Math.PI/16),centre[2]+radius*Math.cos(k*Math.PI/16)])))}));
}
export const restorationReference10ThresholdPlan=Object.freeze({
  reference:10,conditional:true,worldSpace:true,
  origin:Object.freeze(origin),
  bounds:Object.freeze({minX:-21.120226762,maxX:-6.580726762,minZ:20.904909604,maxZ:24.264909604}),
  oldBounds:Object.freeze({minX:-21.120226762,maxX:-6.681226762,minZ:20.904909604,maxZ:24.264909604}),
  stoneTop:.108,stoneBottom:.048,stoneThickness:.060,platformTop:.048,
  platformBottom:-.10349285212601732,columnPadTop:.072,
  originalBaseMaximumRadius:.3285504,cutouts:Object.freeze(cutouts),
  terrainRange:Object.freeze([-.08349285212601731,-.06454485650130672]),
  minimumFoundationEmbedding:.020,
  removeOnly:'The 86 original cedar board emissions inside group(-14.5,0,38.5); retain all columns, bases, roof and railing.',
  worldRandomDraws:0,
  limitations:'Conditional reference10 threshold only. Ground support and dimensions are CPU verified against final v40. No drain across the pond, new platform beyond this dry rectangle, reflection plane or camera correction is implied.'
});
