import * as THREE from 'three';

// OpenCV camera: +X right, +Y down, +Z forward. Three camera: +X right,
// +Y up, -Z forward. Apply the same proper rotation to the Gaussian field.
export const CV_TO_THREE = new THREE.Matrix4().makeRotationX(Math.PI);
const finite = (a, n) => Array.isArray(a) && a.length === n && a.every(Number.isFinite);
export function sourceCalibration(rec) {
  const i = rec.intrinsics ?? rec.camera?.intrinsics ?? rec;
  const image = rec.image ?? rec;
  const width = Number(i.width ?? image.width ?? rec.imageWidth);
  const height = Number(i.height ?? image.height ?? rec.imageHeight);
  const k = i.K ?? rec.K;
  const fx = Number(i.fx ?? k?.[0]?.[0] ?? k?.[0]);
  const fy = Number(i.fy ?? k?.[1]?.[1] ?? k?.[4] ?? fx);
  const cx = Number(i.cx ?? k?.[0]?.[2] ?? k?.[2] ?? width / 2);
  const cy = Number(i.cy ?? k?.[1]?.[2] ?? k?.[5] ?? height / 2);
  if (![width,height,fx,fy,cx,cy].every(Number.isFinite) || Math.min(width,height,fx,fy) <= 0) throw Error('Scene metadata requires image width/height and finite fx/fy/cx/cy.');
  const raw = rec.sourceCamera?.cameraToWorld ?? rec.cameraToWorld;
  let matrix = new THREE.Matrix4();
  if (raw) {
    const values = raw.flat();
    if (!finite(values,16)) throw Error('cameraToWorld must contain 16 finite row-major numbers.');
    matrix.set(...values);
  }
  return {width,height,fx,fy,cx,cy,sourceMatrixCV:matrix};
}

export function applyIntrinsics(camera,k,width,height) {
  // Contain the calibrated source sensor in the viewport. No FOV animation.
  const scale = Math.min(width/k.width,height/k.height);
  const fx=k.fx*scale,fy=k.fy*scale;
  const cx=k.cx*scale+(width-k.width*scale)/2;
  const cy=k.cy*scale+(height-k.height*scale)/2;
  const near=camera.near,far=camera.far;
  camera.aspect=width/height;
  camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(height/(2*fy)));
  camera.projectionMatrix.set(2*fx/width,0,1-2*cx/width,0, 0,2*fy/height,2*cy/height-1,0, 0,0,-(far+near)/(far-near),-2*far*near/(far-near), 0,0,-1,0);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  return {width,height,fx,fy,cx,cy,projection:camera.projectionMatrix.toArray()};
}

export function poseFromCV(camera,calibration,{translation=[0,0,0],rotation=[0,0,0],cameraToWorld}={}) {
  if (!finite(translation,3)||!finite(rotation,3)) throw Error('Pose translation and rotation require finite 3-vectors.');
  let relative = new THREE.Matrix4();
  if (cameraToWorld) {
    if (!finite(cameraToWorld.flat(),16)) throw Error('Explicit CV cameraToWorld requires 16 row-major numbers.');
    relative.set(...cameraToWorld.flat());
  } else {
    // All three translations and yaw/pitch/roll are real camera transforms,
    // expressed relative to the original camera, in original metric units.
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation[0],rotation[1],rotation[2],'YXZ'));
    relative.compose(new THREE.Vector3(...translation),q,new THREE.Vector3(1,1,1));
    relative.premultiply(calibration.sourceMatrixCV);
  }
  const world=CV_TO_THREE.clone().multiply(relative).multiply(CV_TO_THREE);
  world.decompose(camera.position,camera.quaternion,camera.scale);
  camera.updateMatrixWorld(true);
  return {translationCV:[...translation],rotationCV:[...rotation],cameraToWorldCV:relative.toArray(),cameraToWorld:camera.matrixWorld.toArray(),position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),projection:camera.projectionMatrix.toArray()};
}

export const DEFAULT_KEYFRAMES = [
  {time:0,translation:[0,0,0],rotation:[0,0,0]},
  {time:1.75,translation:[-.025,-.005,.02],rotation:[.004,-.012,-.003]},
  {time:3.5,translation:[.025,.006,.01],rotation:[-.004,.012,.003]},
  {time:5.25,translation:[.012,-.004,-.035],rotation:[.003,.006,-.002]},
  {time:7,translation:[0,0,-.06],rotation:[0,0,0]},
];
export function trajectoryPose(time,depth,keyframes=DEFAULT_KEYFRAMES) {
  const t=THREE.MathUtils.clamp(Number(time),keyframes[0].time,keyframes.at(-1).time);
  if(!Number.isFinite(t)||!Number.isFinite(depth)||depth<=0)throw Error('Finite time and positive physical scene depth required.');
  let a=keyframes[0],b=keyframes.at(-1);
  for(let j=1;j<keyframes.length;j++)if(t<=keyframes[j].time){a=keyframes[j-1];b=keyframes[j];break;}
  let u=(t-a.time)/(b.time-a.time);u=u*u*(3-2*u);
  const translation=a.translation.map((v,j)=>THREE.MathUtils.lerp(v,b.translation[j],u)*depth);
  const qa=new THREE.Quaternion().setFromEuler(new THREE.Euler(...a.rotation,'YXZ'));
  const qb=new THREE.Quaternion().setFromEuler(new THREE.Euler(...b.rotation,'YXZ'));
  const e=new THREE.Euler().setFromQuaternion(qa.slerp(qb,u),'YXZ');
  return {translation,rotation:[e.x,e.y,e.z],time:t};
}
