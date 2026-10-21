import * as T from '../../../../vendor/build/three.module.js';
import {HALL_ENVELOPE143 as H} from '../../../../reconstructions/scene-09/src/hall-envelope143.js';
import {PAGODA_FRAME143 as P} from '../../../../reconstructions/scene-09/src/pagoda-frame143.js';
import {writeFile} from 'node:fs/promises';
const camera=new T.PerspectiveCamera(52,1,.1,250);camera.position.set(6,2.7,33);camera.lookAt(0,5.5,-10);camera.updateMatrixWorld();
const matrix=(p,y,s)=>new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),y),new T.Vector3(...s));
const hall=matrix(H.position,H.yaw,H.scale),pagoda=matrix(P.position,P.yaw,P.scale),baseline=matrix([-13.6,5.82,-17],.16,[1.18,1.14,1.18]);
function project(a,m){const world=new T.Vector3(...a).applyMatrix4(m),p=world.clone().project(camera);return{local:a,world:world.toArray(),pixel:[627*(1+p.x),627*(1-p.y)].map(v=>+v.toFixed(2))};}
const refs={hallRidgeLeft:[704,313],hallRidgeRight:[984,244],pagodaApex:[333,169],finialTip:[333,24]};
const measured={hallRidgeLeft:project([-H.upper.ridgeLeft,H.upper.e+H.upper.rise,0],hall),hallRidgeRight:project([H.upper.ridgeRight,H.upper.e+H.upper.rise,0],hall),pagodaApex:project([0,P.floor+4*P.pitch+P.roofSeat+P.topRise,0],pagoda),finialTip:project([0,P.floor+4*P.pitch+P.roofSeat+P.topRise+5.45,0],pagoda)};
for(const [key,p]of Object.entries(measured)){p.referencePixel=refs[key];p.errorPixels=Math.hypot(...p.pixel.map((v,i)=>v-refs[key][i]));}
const referenceEaves=[[[166,542],[480,543]],[[177,458],[470,457]],[[186,374],[464,374]],[[197,293],[455,293]],[[210,212],[447,211]]];
const eaves=[];
for(let k=0;k<5;k++){
 const corners=(w,y,m)=>{const a=[];for(const x of[-w/2,w/2])for(const z of[-w/2,w/2])a.push(project([x,y,z],m));a.sort((a,b)=>a.pixel[0]-b.pixel[0]);return[a[0],a.at(-1)];};
 const current=corners(P.roofWidth-k*P.roofTaper,P.floor+k*P.pitch+P.roofSeat+P.curl,pagoda),old=corners(9.35-k*.66,.7+k*2.7+2.93+.61,baseline);
 eaves.push({tier:k+1,referencePixels:referenceEaves[k],current,baseline:old,currentErrorPixels:current.map((p,i)=>Math.hypot(...p.pixel.map((v,j)=>v-referenceEaves[k][i][j]))),baselineErrorPixels:old.map((p,i)=>Math.hypot(...p.pixel.map((v,j)=>v-referenceEaves[k][i][j])))});
}
const record={scope:'Common real3D camera and architectural landmark fit; no view-dependent deformations',camera:{position:[6,2.7,33],target:[0,5.5,-10],fov:52},reference:'references/hd/8-照片-9.jpg',referenceAnnotation:'Manual silhouette landmarks, approximate±4px; eave endpoints have partial ornament occlusion. They constrain a square roof/frame stack, not an image warp.',sourceEnvelopes:{hall:H,pagoda:P},measured,eaves,notPhotographicAcceptance:true,visualAccepted:false};
await writeFile(new URL('landmark-measurements.json',import.meta.url),JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({landmarks:measured,eaves:eaves.map(p=>({tier:p.tier,currentError:p.currentErrorPixels,baselineError:p.baselineErrorPixels}))}));
