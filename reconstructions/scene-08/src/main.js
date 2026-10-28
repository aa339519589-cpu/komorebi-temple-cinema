import {createDollyPath} from '/reconstructions/camera-dolly.js';
import * as T from 'three';
import {buildScene} from './scene.js';
import {createCameraPass} from './post.js';
const Q=new URLSearchParams(location.search),w=Math.min(2048,+(Q.get('w')||768)),h=Math.min(2048,+(Q.get('h')||768));
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(w,h);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;document.body.append(renderer.domElement);
const {scene,stats,dispose,setTime}=await buildScene({renderer}),camera=new T.PerspectiveCamera(49,w/h,.06,180);
const cameraPass=createCameraPass(renderer,w,h);
const reference={position:[0,1.78,13],target:[0,6.10,-9],fov:49};
function renderView(position,target,time=0,fov=49){setTime(time);camera.position.fromArray(position);camera.userData.focusDistance=new T.Vector3(...position).distanceTo(new T.Vector3(...target));camera.fov=fov;camera.lookAt(...target);camera.updateProjectionMatrix();scene.updateMatrixWorld(true);cameraPass.render(scene,camera);return {position,target,time,fov};}
function renderReference(n=8){if(n!==8)throw Error('Independent reference 08');return renderView(reference.position,reference.target,0,reference.fov);}
const lowCameraSpecification={revision:'scene08-low-angle-dolly-20261028-r03',points:[[.45,1.30,9.65],[.40,1.33,10.35],[.15,1.38,11.80],[0,1.40,13]],nearTarget:[-1.8,3.85,2],farTarget:reference.target,fov:reference.fov,scope:'Camera-only independent film revision; current374 geometry/material/lighting unchanged; original reference pose retained.'};
const dolly=createDollyPath(lowCameraSpecification);
// CPU spatial checks against the already built actual 3D scene. No extra
// renderer, viewport, image plate or GPU work is used by these diagnostics.
function verifyLowCameraPath(){
 scene.updateMatrixWorld(true);const poses=Array.from({length:169},(_,i)=>dolly(i*7/168));
 const region=new T.Box3(new T.Vector3(-.35,-.25,9.30),new T.Vector3(.80,1.75,13.35));
 const tris=[],world=new T.Matrix4(),inst=new T.Matrix4(),box=new T.Box3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();let testedInstances=0;
 function append(g,m,sourceName){if(!g.boundingBox)g.computeBoundingBox();box.copy(g.boundingBox).applyMatrix4(m);if(!box.intersectsBox(region))return;testedInstances++;const p=g.attributes.position,idx=g.index,N=idx?idx.count:p.count;
  for(let i=0;i<N;i+=3){a.fromBufferAttribute(p,idx?idx.getX(i):i).applyMatrix4(m);b.fromBufferAttribute(p,idx?idx.getX(i+1):i+1).applyMatrix4(m);c.fromBufferAttribute(p,idx?idx.getX(i+2):i+2).applyMatrix4(m);box.setFromPoints([a,b,c]);if(box.intersectsBox(region))tris.push(Object.assign(new T.Triangle(a.clone(),b.clone(),c.clone()),{sourceName}));}
 }
 scene.traverseVisible(o=>{if(!o.isMesh)return;if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,inst);world.multiplyMatrices(o.matrixWorld,inst);append(o.geometry,world,(o.geometry.name||o.geometry.type)+'/'+(o.material?.name||'unnamed')+'/instance-'+i);}}else append(o.geometry,o.matrixWorld,(o.geometry.name||o.geometry.type)+'/'+(o.material?.name||'unnamed'));});
 const closest=new T.Vector3(),hit=new T.Vector3(),down=new T.Vector3(0,-1,0);let minSurface=Infinity,minFloor=Infinity,maxStep=0;
 const samples=poses.map((pose,i)=>{const p=new T.Vector3(...pose.position),ray=new T.Ray(p,down);let surface=Infinity,floor=Infinity,nearestSurface=null,downwardSurface=null;for(const tri of tris){const d=tri.closestPointToPoint(p,closest).distanceTo(p);if(d<surface){surface=d;nearestSurface={source:tri.sourceName,point:closest.toArray()};}if(ray.intersectTriangle(tri.a,tri.b,tri.c,false,hit)&&p.y-hit.y<floor){floor=p.y-hit.y;downwardSurface={source:tri.sourceName,point:hit.toArray()};}}minSurface=Math.min(minSurface,surface);minFloor=Math.min(minFloor,floor);if(i)maxStep=Math.max(maxStep,p.distanceTo(new T.Vector3(...poses[i-1].position)));const d=new T.Vector3(...pose.target).sub(p);return{time:i*7/168,position:pose.position,upwardPitchDegrees:T.MathUtils.radToDeg(Math.atan2(d.y,Math.hypot(d.x,d.z))),nearestSurfaceMetres:surface,downwardFloorMetres:floor,nearestSurface,downwardSurface};});
 const passed=Number.isFinite(minSurface)&&Number.isFinite(minFloor)&&minSurface-maxStep>=.18&&minFloor>=.5;console.log('low-camera-clearance',JSON.stringify({minSurface,minFloor,maxStep,passed,worstSurface:samples.reduce((a,b)=>a.nearestSurfaceMetres<b.nearestSurfaceMetres?a:b),worstDownward:samples.reduce((a,b)=>a.downwardFloorMetres<b.downwardFloorMetres?a:b)}));
 return{method:'Exact world triangles within conservative path region;169 path samples, entire intersample motion bounded by maximumStep; nearest-surface and downward floor ray checks.',samples:169,candidateTriangles:tris.length,testedInstances,minimumNearestSurfaceMetres:minSurface,maximumStepMetres:maxStep,conservativeContinuousClearanceMetres:minSurface-maxStep,minimumDownwardFloorMetres:minFloor,upwardPitchDegrees:[Math.min(...samples.map(s=>s.upwardPitchDegrees)),Math.max(...samples.map(s=>s.upwardPitchDegrees))],start:samples[0],middle:samples[84],end:samples[168],worstSurface:samples.reduce((a,b)=>a.nearestSurfaceMetres<b.nearestSurfaceMetres?a:b),worstDownward:samples.reduce((a,b)=>a.downwardFloorMetres<b.downwardFloorMetres?a:b),passed};
}
const lowCameraClearance=verifyLowCameraPath();
function renderShot(localTime=0){const p=dolly(localTime);return renderView(p.position,p.target,localTime,p.fov);}
window.temple={ready:true,renderer,scene,camera,renderReference,renderView,renderShot,info:()=>({reference:8,revision:'scene08-corridor374-low-camera-20261028-r03',...stats,filmCamera:{...lowCameraSpecification,clearance:lowCameraClearance},camera:reference,renderer:cameraPass.info()}),dispose(){cameraPass.dispose();dispose();renderer.dispose();}};
if(!Q.has('defer'))renderReference();
