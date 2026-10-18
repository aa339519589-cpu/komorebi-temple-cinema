// CPU-only photographic layout probes. Source anchors are approximate manual
// observations of the supplied photograph, not automatically measured truth.
import * as T from '../../../vendor/build/three.module.js';
const camera=new T.PerspectiveCamera(60,1,.08,220);
camera.position.set(0,1,14);camera.lookAt(0,5.4,-14);camera.updateMatrixWorld(true);
const observed={lowerLeftEave:[.473,.352],upperLeftEave:[.496,.264],entryThreshold:[.87,.51],bridgeRailCrest:[.70,.48],towerFinialTip:[.331,.024]};
function project(point,matrix=new T.Matrix4()){
 const p=new T.Vector3(...point).applyMatrix4(matrix).project(camera);
 return[(p.x+1)/2,(1-p.y)/2];
}
function hallProbes({position,scale,yaw,interval,lowerCurl=.65,upperCurl=.65,entryX=0}){
 const matrix=new T.Matrix4().compose(new T.Vector3(...position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw),new T.Vector3(...scale));
 return{
  lowerLeftEave:project([-11.5,1.3+4.1+.65+lowerCurl,7],matrix),
  upperLeftEave:project([-10.75,1.3+interval+4.1+.65+upperCurl,6.65],matrix),
  entryThreshold:project([entryX,1.3,4],matrix)
 };
}
const current={position:[11.5,0,-14],scale:[1.12,1.12,1.12],yaw:-.30,interval:4.9};
const proposed={position:[14,3.6,-14],scale:[1.12,.95,1.12],yaw:-.58,interval:4.4,lowerCurl:1.1,upperCurl:.4,entryX:-.8};
const currentProbes=hallProbes(current),proposedProbes=hallProbes(proposed);
function report(probes){return Object.fromEntries(Object.entries(probes).map(([k,p])=>[k,{renderProjection:p,referenceApproximate:observed[k],delta:p.map((q,i)=>q-observed[k][i])}]));}
console.log(JSON.stringify({method:'Approximate manual photograph anchors and exact CPU perspective projection; no GPU image acceptance.',iteration05Baseline:{parameters:current,anchors:report(currentProbes)},iteration06Installed:{parameters:proposed,anchors:report(proposedProbes)}},null,2));
