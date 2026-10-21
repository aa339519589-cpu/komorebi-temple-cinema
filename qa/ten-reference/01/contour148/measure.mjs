import * as T from '../../../../vendor/build/three.module.js';
import {layout124 as L} from '../../../../reconstructions/scene-01/src/layout124.js';
import {writeFile} from 'node:fs/promises';
const camera=new T.PerspectiveCamera(59,1,.1,260);camera.position.fromArray(L.camera.position);camera.lookAt(...L.camera.target);camera.updateMatrixWorld();
function project(point,pose){const world=new T.Vector3(...point).applyMatrix4(new T.Matrix4().compose(new T.Vector3(...pose.position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),pose.yaw||0),new T.Vector3(...(pose.scale||[1,1,1])))),p=world.clone().project(camera);return{world:world.toArray(),pixel:[(1+p.x)*627,(1-p.y)*627]};}
const hallPoints=[
 {name:'first clear lower capital in occupied facade',referenceApprox:[649,575],uncertaintyPixels:8,beforeLocal:[-10.36673804934024,5.19,5.15],afterLocal:[-7.952162871635822,5.19,5.15]},
 {name:'first upper pilaster midpoint',referenceApprox:[677,464],uncertaintyPixels:8,beforeLocal:[-10.2,8.14,5.18],afterLocal:[-6.770258796240704,8.14,5.18]},
 {name:'upper outer eave left corner retained',referenceApprox:[488,400],uncertaintyPixels:8,beforeLocal:[-12.75,10.64,6.45],afterLocal:[-12.75,10.64,6.45]},
 {name:'portal-side lower post floor datum retained',referenceApprox:[848,718],uncertaintyPixels:8,beforeLocal:[-1.894491687074025,1.35,5.15],afterLocal:[-1.894491687074025,1.35,5.15]},
 {name:'upper plaque physical centre in wider central structural bay',referenceApprox:[930,425],uncertaintyPixels:10,beforeLocal:[-.8,8.43,4.54],afterLocal:[.06272051680546703,8.43,4.54]}
].map(p=>{const before=project(p.beforeLocal,L.hall),after=project(p.afterLocal,L.hall);return{...p,before,after,beforeErrorPixels:Math.hypot(before.pixel[0]-p.referenceApprox[0],before.pixel[1]-p.referenceApprox[1]),afterErrorPixels:Math.hypot(after.pixel[0]-p.referenceApprox[0],after.pixel[1]-p.referenceApprox[1])};});
const towerTargets=[[413,78],[377,220],[276,268],[537,269],[367,555],[267,577],[548,592]],tower=[];
const E=k=>5.6+k*L.pagoda.tierPitch,W=k=>L.pagoda.bottomRoofWidth+(L.pagoda.topRoofWidth-L.pagoda.bottomRoofWidth)*k/4;
tower.push({name:'finial tip',local:[0,E(4)+1.25+L.pagoda.finialHeight,0]});
for(const k of[4,0])for(const [name,x,z]of[['near',1,1],['outer left',-1,1],['outer right',1,-1]])tower.push({name:'tier'+(k+1)+' '+name+' eave corner',local:[x*W(k)/2,E(k)+.44,z*W(k)/2]});
for(let i=0;i<tower.length;i++){const p=project(tower[i].local,L.pagoda);Object.assign(tower[i],{referenceApprox:towerTargets[i],projected:p,errorPixels:Math.hypot(p.pixel[0]-towerTargets[i][0],p.pixel[1]-towerTargets[i][1]),unchangedByPhase148:true});}
const data={reference:'references/hd/0-照片-1.jpg',pixelSystem:'1254 square, top-left origin',camera:L.camera,method:'Common fixed low camera. Actual frame/roof/post geometry is fit; no reference image texture, camera-space surface or independent projected landmark deformation is used.',limitations:'These hand-observed selected points have stated uncertainty and are not a survey, complete contour fit or photographic-fidelity score. New upper-axis x positions are solved as a coherent physical frame; hidden depth remains inferred.',hallPoints,pagoda:tower,unchangedLayout:{bridge:L.bridge,stair:L.stair,waterfall:L.waterfall,foreground:L.foreground}};
await writeFile(new URL('./landmarks148.json',import.meta.url),JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({hall:hallPoints.map(p=>({name:p.name,before:p.beforeErrorPixels,after:p.afterErrorPixels})),pagodaErrors:tower.map(p=>p.errorPixels)},null,2));
