import * as T from '../../../vendor/build/three.module.js';
import {hallPlacement,referenceCamera} from '../../../reconstructions/scene-03/src/hall-layout.js';
import {writeFile} from 'node:fs/promises';
const camera=new T.PerspectiveCamera(referenceCamera.fov,1,.08,180);camera.position.fromArray(referenceCamera.position);camera.lookAt(...referenceCamera.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
const points=[
 {id:'upper-left',local:[-7.5,14.74,-.5],target:[.384,.221]},
 {id:'upper-right',local:[7.5,14.74,-.5],target:[.900,.127]},
 {id:'lower-left',local:[-9,9.96,.6],target:[.318,.343]},
 {id:'lower-right',local:[9,9.96,.6],target:[.992,.246]}
];
function project(pose){
 const matrix=new T.Matrix4().makeTranslation(pose.x,0,pose.z-4).multiply(new T.Matrix4().makeRotationY(pose.yaw)).multiply(new T.Matrix4().makeTranslation(0,0,4));
 const anchors=points.map(p=>{const v=new T.Vector3(...p.local).applyMatrix4(matrix).project(camera),image=[(v.x+1)/2,(1-v.y)/2];return{...p,image,errorPixelsAt1254:Math.hypot(image[0]-p.target[0],image[1]-p.target[1])*1254};});
 return{pose,anchors,meanAnchorErrorPixelsAt1254:anchors.reduce((n,p)=>n+p.errorPixelsAt1254,0)/anchors.length};
}
const before=project({yaw:.12,x:5,z:-3}),after=project(hallPlacement);
const result={scope:'Four manually read projected eave corners only; not pixel similarity or photographic acceptance',manualTargetUncertaintyPixels:15,camera:referenceCamera,before,after,independentTowerBaseBefore:[-5.4,-.4,-11.3],independentTowerBaseAfter:[(-5.4-hallPlacement.x)+hallPlacement.x,-.4,(-11.3-hallPlacement.z)+hallPlacement.z],towerAndBridgeMustRemainFixed:true,visualAccepted:false};
if(after.meanAnchorErrorPixelsAt1254>=before.meanAnchorErrorPixelsAt1254)throw Error('Calibration regressed its stated eave correspondences');
await writeFile(new URL('./hall-axis-calibration.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify({before:before.meanAnchorErrorPixelsAt1254,after:after.meanAnchorErrorPixelsAt1254,scope:result.scope}));
