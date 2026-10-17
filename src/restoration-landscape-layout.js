import * as T from 'three';

// Unified site-plan transform used by the current indoor/outdoor integration.
// It is a measurable reconstruction candidate, not pixel acceptance. Historical
// snapshots retain their own coordinates; this module never mutates a scene.
const scale=.60,translation=[-5.140726762,0,-.515090396];
const oldCamera=[1.90121127,.55763555,30.52515066];
const oldTarget=[-2.60986582,8.13817458,-3.34497794];
const mapPoint=p=>[p[0]*scale+translation[0],p[1]*scale,p[2]*scale+translation[2]];
const oldIslands=[[-8,-3,3.4,2.2],[13,3,3.4,2.4],[-18,5,5.6,3.5],[1.1,16,2.0,2.7],[10.9,16,2.1,3.4],[-17.4,10.8,6.0,4.4]];
const oldLanterns=[[-17,0,10,1.25],[15,0,7,1.2],[1.1,0,16,1.1],[10.9,0,16,1.1],[-19,0,-1,1.05],[18,0,-7,1.15],[-6,0,-7,.9],[22,0,14,1.2]];
export const referenceExteriorPlan=Object.freeze({
  version:'reference3-8-spatial-candidate-v1',scale,translation,
  camera:{position:mapPoint(oldCamera),target:mapPoint(oldTarget),fov:58.276164718,time:18.6},
  bridge:{oldAnchor:[-6,0,11],anchor:mapPoint([-6,0,11]),span:15.6*scale,width:3.25*scale,yaw:.08},
  hall:{oldAnchor:[6,0,-11],anchor:mapPoint([6,0,-11]),bodyWidth:20*1.35*scale,bodyDepth:16*1.28*scale,maxHeight:34.475*scale},
  tower:{oldAnchor:[-21.5,0,-25],anchor:mapPoint([-21.5,0,-25]),maxHeight:47.215*scale},
  axisPath:{centreX:mapPoint([6,0,0])[0],width:5*scale,nearStairZ:mapPoint([0,0,4])[2],southEndZ:mapPoint([0,0,49.14])[2],stoneTop:.04*scale,
    // The retained route needs continuous masonry through the unscaled pond.
    // It is not a broad plaza or a new route; it supports the existing axis.
    foundationBottom:-.90},
  islands:oldIslands.map(([x,z,rx,rz])=>{const p=mapPoint([x,0,z]);return{x:p[0],z:p[2],radiusX:rx*scale,radiusZ:rz*scale};}),
  lanterns:oldLanterns.map(p=>[...mapPoint(p.slice(0,3)),p[3]*scale]),
  retainWater:{centre:[0,4.8],radii:[22.3,14.2],waterY:-.12,shape:'existing harmonic shoreline, unchanged'},
  retainPlants:{lotusDimensions:true,reference3Foreground:false,oldTreeLeafCards:true},
  status:'Common indoor/outdoor site-plan candidate, checked against original refs3/8 with CPU dimensions, projection and support tests. Not pixel-accepted. The .60 scale is a reconstruction choice, not a metric recovered uniquely from the photos.'
});
export function createReferenceExteriorMatrix(){return new T.Matrix4().makeTranslation(...translation).multiply(new T.Matrix4().makeScale(scale,scale,scale));}
export function mapReferenceExteriorPoint(point){return mapPoint(point);}
export function referenceRetainedPondContains(x,z,margin=1){const a=Math.atan2((z-4.8)/14.2,x/22.3),r=1+.115*Math.sin(a*3)+.055*Math.cos(a*7)+.026*Math.sin(a*11);return Math.hypot(x/22.3,(z-4.8)/14.2)<r*margin;}
// Apply AFTER deciding whether the old paving loop would have emitted a paver.
// Always preserve its random draws, even when the new physical footprint is clipped.
export function retainMappedReferencePaver(oldX,oldZ){
  if(oldX>3.4&&oldX<8.6)return true;
  const p=mapPoint([oldX,0,oldZ]);return !referenceRetainedPondContains(p[0],p[2],1.025);
}
