import * as T from 'three';

// The exposed nose has a broad flat head and a narrower lower foot. This
// section is shared by the actual wood cut and its worked copper sleeve.
// NormalizedY is measured from the new finite cut centre, -0.5..+0.5.
export function bearingWidth196(normalizedY){
 return .76+.24*T.MathUtils.smoothstep(normalizedY,-.5,.10);
}
export function createFittedBearingCopper196(parts){
 const output=parts.map(part=>{
  const geometry=part.geometry.clone(),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++)p.setX(i,p.getX(i)*bearingWidth196(p.getY(i)));
  geometry.computeVertexNormals();geometry.userData.bearingCut196={bottomWidthRatio:.76,topWidthRatio:1,closedSourceRetained:true};
  return{...part,geometry};
 });
 return{parts:output,info:{construction:'Closed copper sections fitted to the actual broad-head/narrow-foot bearing cut, with a real shallow sleeve return',bottomWidthRatio:.76,photoTexture:false},dispose(){for(const p of output)p.geometry.dispose();}};
}
