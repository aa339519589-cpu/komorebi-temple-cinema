import * as THREE from 'three';
import {SparkRenderer,SplatMesh} from '@sparkjsdev/spark';
import {CV_TO_THREE,sourceCalibration,applyIntrinsics,poseFromCV,trajectoryPose,DEFAULT_KEYFRAMES} from './camera.js';
import {inspectGaussianPly} from './ply-header.js';

const query=new URLSearchParams(location.search),capture=query.has('capture');
if(capture)document.body.classList.add('capture');
const status=document.querySelector('#loading'),canvas=document.querySelector('#view');
const metaURL=new URL(query.get('meta')??`../../output/sharp-study/${query.get('scene')??'01'}/viewer.json`,location.href);
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
renderer.setClearColor(0x000000,1);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(50,1,.001,10000);
const spark=new SparkRenderer({renderer,autoUpdate:false,enableLod:false,accumExtSplats:true,sortRadial:false,preBlurAmount:0,blurAmount:0,maxStdDev:Math.sqrt(8),minAlpha:.5/255});
scene.add(spark);
let record,calibration,model,header,depth=1,currentPose,currentTime=0,ready=false,modelURL,metadataDepth=null;
let renderSerial=Promise.resolve(),playStarted=null,playFrom=0,interactivePose={translation:[0,0,0],rotation:[0,0,0]};
const state={renderer,camera,scene,spark,ready:false,readyPromise:null};
window.temple=state;

function viewport() {
  if(capture)return [Number(query.get('w')??calibration.width),Number(query.get('h')??calibration.height)];
  const width=Math.max(180,Math.min(document.querySelector('main').clientWidth-56,1096,window.innerHeight*.76*calibration.width/calibration.height));
  return [Math.round(width),Math.round(width*calibration.height/calibration.width)];
}
function resize() {
  const [w,h]=viewport();renderer.setSize(w,h,true);applyIntrinsics(camera,calibration,w,h);
}
function info() {
  return {kind:'photo-reconstructed-3d-gaussian-field',title:'照片重建3D高斯场',viewerVersion:'sharp-study-spark-02',threeRevision:THREE.REVISION,sparkVersion:'2.3.1',ready,modelURL:modelURL?.pathname,metadataURL:metaURL.pathname,gaussianCount:header?.vertexCount,shDegree:header?.shDegree,gaussianProperties:header?.properties,coordinateSystem:record?.coordinateSystem??'opencv-camera',fieldTransform:CV_TO_THREE.toArray(),calibration:calibration?{width:calibration.width,height:calibration.height,fx:calibration.fx,fy:calibration.fy,cx:calibration.cx,cy:calibration.cy}:null,depthScale:depth,depthScaleMethod:metadataDepth?'metadata median source-camera z':'median of up to8192 nontransparent Gaussian centers in the source camera',intrinsicsAnimated:false,sourceBackgroundImage:false,colorEncoding:'PLY SH radiance is sRGB; Spark writes directly to an sRGB framebuffer without tone mapping or a second gamma transform',renderedPrimitives:'anisotropic 3D Gaussian ellipsoids projected from per-point covariance with depth-sorted alpha compositing',projection:camera.projectionMatrix.toArray(),pose:currentPose,renderer:renderer.info.render};
}
async function drawPose(pose,time=null) {
  if(!ready)throw Error('3D Gaussian model is not ready.');
  currentPose=poseFromCV(camera,calibration,pose);currentTime=time;
  scene.updateMatrixWorld(true);
  // Await the current camera's GPU generation and worker depth sort. Do not
  // capture before this Promise, or use a timeout to guess when sorting ends.
  await spark.update({scene,camera});
  renderer.render(scene,camera);renderer.getContext().finish();
  currentPose={...currentPose,time,depthScale:depth,sourceIntrinsicsPreserved:true,matrixStorage:'column-major'};
  return currentPose;
}
function renderPose(pose={},time=null) {
  const task=renderSerial.then(()=>drawPose(pose,time));renderSerial=task.catch(()=>{});return task;
}
function namedPose(name) {
  const presets={source:[0,0,0],left:[-.025*depth,0,0],right:[.025*depth,0,0],near:[0,0,.04*depth],far:[0,0,-.06*depth]};
  if(!presets[name])throw Error('Unknown camera preset '+name);
  return {translation:presets[name],rotation:[0,0,0]};
}
function stopPlayback(){playStarted=null;document.querySelector('#play').textContent='播放空间移动';}
Object.assign(state,{
  info,renderPose,
  async renderReference(){return renderPose(namedPose('source'),0);},
  async renderPreset(name){stopPlayback();interactivePose=namedPose(name);return renderPose(interactivePose,null);},
  async renderShot(time){return renderPose(trajectoryPose(time,depth,record?.trajectory??DEFAULT_KEYFRAMES),Number(time));},
  async setTime(time){return this.renderShot(time);},
  async renderFrame({time=0}={}){return this.renderShot(time);},
  async renderView(position,target,roll=0){
    if(![position,target].every(a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite))||!Number.isFinite(roll))throw Error('renderView expects world-space position, target and roll.');
    // Convert an explicit conventional Three world camera into source CV form.
    const c=camera.clone();c.position.fromArray(position);c.up.set(0,1,0);c.lookAt(new THREE.Vector3(...target));c.rotateZ(roll);c.updateMatrixWorld(true);
    const cv=CV_TO_THREE.clone().multiply(c.matrixWorld).multiply(CV_TO_THREE).transpose().toArray();
    return renderPose({cameraToWorld:cv},null);
  },
  async resize(width,height){renderer.setSize(width,height,true);applyIntrinsics(camera,calibration,width,height);return renderPose(interactivePose,currentTime);},
  duration:7,
});

async function initialize() {
  const response=await fetch(metaURL);if(!response.ok)throw Error(`Camera metadata HTTP ${response.status}: ${metaURL.pathname}`);
  record=await response.json();
  if(record.coordinateSystem&&!['opencv','opencv-camera','opencv-world'].includes(record.coordinateSystem))throw Error('Scene must declare its original OpenCV x-right/y-down/z-forward coordinates.');
  calibration=sourceCalibration(record);resize();
  const ply=record.model?.url??record.model?.ply??record.ply??record.plyUrl;
  if(!ply)throw Error('Camera metadata requires model.url pointing to an actual 3D Gaussian PLY.');
  modelURL=new URL(ply,metaURL);
  header=await inspectGaussianPly(modelURL);
  status.textContent=`正在加载 ${header.vertexCount.toLocaleString()} 个三维高斯…`;
  model=new SplatMesh({url:modelURL.href,extSplats:true,lod:false,enableLod:false,raycastable:false,onProgress:e=>{if(e.total)status.textContent=`正在读取三维场景 ${Math.round(100*e.loaded/e.total)}%`;}});
  model.applyMatrix4(CV_TO_THREE);scene.add(model);state.splatMesh=model;
  await model.initialized;
  const source=model.extSplats??model.packedSplats;
  const count=source.getNumSplats();
  if(count!==header.vertexCount)throw Error(`PLY count changed while loading: ${header.vertexCount} → ${count}`);
  const inverse=calibration.sourceMatrixCV.clone().invert(),zs=[];
  const stride=Math.max(1,Math.floor(count/8192));
  for(let j=0;j<count;j+=stride){const g=source.getSplat(j);if(g.opacity<.05)continue;const p=g.center.clone().applyMatrix4(inverse);if(p.z>0&&Number.isFinite(p.z))zs.push(p.z);}
  zs.sort((a,b)=>a-b);metadataDepth=record.depth?.median??record.depth?.positiveZQuantiles?.median??null;
  depth=Number(metadataDepth??zs[Math.floor(zs.length/2)]);
  if(!(depth>0))throw Error('Gaussian field has no finite positive source-camera depth. Check coordinate convention.');
  camera.near=Math.max(.0001,depth*.0001);camera.far=Math.max(100,depth*100);resize();
  model.maxSh=header.shDegree;
  ready=state.ready=true;state.metadata=record;state.plyHeader=header;
  document.querySelector('#scene-label').textContent=`照片重建 3D 高斯场 · ${String(record.id??query.get('scene')??'01').padStart(2,'0')}`;
  await state.renderReference();status.classList.add('done');
  return info();
}
state.readyPromise=initialize().catch(error=>{state.error=String(error.stack??error);status.textContent=`三维场景加载失败：${error.message}`;console.error(error);throw error;});
state.readyPromise.catch(()=>{});

for(const button of document.querySelectorAll('[data-pose]'))button.addEventListener('click',()=>state.renderPreset(button.dataset.pose));
const slider=document.querySelector('#time'),timeText=document.querySelector('#time-value');
slider.addEventListener('input',()=>{stopPlayback();const t=Number(slider.value);timeText.value=`${t.toFixed(3)} s`;state.renderShot(t);});
document.querySelector('#play').addEventListener('click',()=>{
  if(playStarted!==null){stopPlayback();return;}
  playFrom=Number(slider.value)>=7?0:Number(slider.value);playStarted=performance.now();document.querySelector('#play').textContent='暂停';
  const step=async now=>{if(playStarted===null)return;const t=Math.min(7,playFrom+(now-playStarted)/1000);slider.value=t;timeText.value=`${t.toFixed(3)} s`;await state.renderShot(t);if(t>=7)stopPlayback();else requestAnimationFrame(step);};requestAnimationFrame(step);
});
let drag=null;
canvas.addEventListener('pointerdown',event=>{if(!ready)return;stopPlayback();canvas.focus();canvas.setPointerCapture(event.pointerId);drag={x:event.clientX,y:event.clientY,rotation:[...interactivePose.rotation]};});
canvas.addEventListener('pointermove',event=>{if(!drag)return;const dx=(event.clientX-drag.x)*.002,dy=(event.clientY-drag.y)*.002;interactivePose.rotation=event.shiftKey?[...drag.rotation.slice(0,2),drag.rotation[2]+dx]:[drag.rotation[0]+dy,drag.rotation[1]+dx,drag.rotation[2]];renderPose(structuredClone(interactivePose));});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
function moveInCameraAxes(delta){
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...interactivePose.rotation,'YXZ'));
  const movement=new THREE.Vector3(...delta).applyQuaternion(q);
  interactivePose.translation=interactivePose.translation.map((v,j)=>v+movement.getComponent(j));
}
canvas.addEventListener('wheel',event=>{event.preventDefault();stopPlayback();moveInCameraAxes([0,0,-Math.sign(event.deltaY)*depth*.008]);renderPose(structuredClone(interactivePose));},{passive:false});
canvas.addEventListener('keydown',event=>{
  const map={a:[0,-1],d:[0,1],q:[1,-1],e:[1,1],w:[2,1],s:[2,-1]};
  if(event.key.toLowerCase()==='r'){state.renderPreset('source');return;}
  const move=map[event.key.toLowerCase()];if(!move||!ready)return;
  event.preventDefault();stopPlayback();const delta=[0,0,0];delta[move[0]]=move[1]*depth*.008*(event.shiftKey?3:1);moveInCameraAxes(delta);renderPose(structuredClone(interactivePose));
});
window.addEventListener('resize',()=>{if(ready&&!capture){resize();renderPose(structuredClone(interactivePose));}});
