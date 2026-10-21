import * as T from '../../../../vendor/build/three.module.js';
import {writeFile} from 'node:fs/promises';
const camera=new T.PerspectiveCamera(49,1,.06,180);camera.position.set(0,1.78,13);camera.lookAt(0,6.10,-9);camera.updateMatrixWorld();
const before={x:-4.30,z:-7.50,yaw:-.28,w:9,d:6,floor:4.4,lintel:8.15,eave:10.15,rise:3.5},after={x:-3.954,z:-8.701,yaw:-.28,w:9.30,d:8.5,floor:4.4,lintel:8.55,eave:10.15,rise:3.85};
function project(frame,local){const world=new T.Vector3(...local).applyMatrix4(new T.Matrix4().compose(new T.Vector3(frame.x,0,frame.z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),frame.yaw),new T.Vector3(1,1,1))),p=world.clone().project(camera);return{world:world.toArray(),pixel:[(1+p.x)*627,(1-p.y)*627]};}
const points=[
 {label:'near main eave corner, before horn',observedApprox:[574,197],before:[4.5,10.60,3],after:[4.65,10.60,4.25]},
 {label:'far end of receding main eave, before horn',observedApprox:[714,422],before:[4.5,10.60,-3],after:[4.65,10.60,-4.25]},
 {label:'near facade corner column lintel datum',observedApprox:[390,410],before:[2.3,8.15,1.6],after:[1.35,8.55,2.8]},
 {label:'same corner column floor datum',observedApprox:[385,700],before:[2.3,4.4,1.6],after:[1.35,4.4,2.8]}
].map(p=>{const a=project(before,p.before),b=project(after,p.after);return{label:p.label,observedApprox:p.observedApprox,before:a,after:b,beforeErrorPixels:Math.hypot(a.pixel[0]-p.observedApprox[0],a.pixel[1]-p.observedApprox[1]),afterErrorPixels:Math.hypot(b.pixel[0]-p.observedApprox[0],b.pixel[1]-p.observedApprox[1])};});
const data={reference:'references/hd/7-照片-8.jpg',coordinateSystem:'1254square top-left pixels',status:'Manual coupled physical landmark fit, not a camera-space deformation or recovered survey. Source landmarks are approximate human estimates from the photograph; no numerical acceptance threshold is claimed.',camera:{position:[0,1.78,13],target:[0,6.10,-9],fov:49},beforeFrame:before,afterFrame:after,bodyAfter:{centerLocal:[-.4,0,.6],width:3.5,depth:4.4},points};
await writeFile(new URL('./landmark-fit.json',import.meta.url),JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify(points.map(p=>({point:p.label,beforeError:p.beforeErrorPixels,afterError:p.afterErrorPixels})),null,2));
