// CPU registration/connection evidence, not generated or substituted pixels.
import {registerHooks} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=new URL('../../../../',import.meta.url);
registerHooks({resolve(s,c,next){if(s==='three')return next(new URL('vendor/build/three.module.js',root).href,c);if(s.startsWith('three/addons/'))return next(new URL('vendor/examples/jsm/'+s.slice(13),root).href,c);return next(s,c);}});
const T=await import(new URL('vendor/build/three.module.js',root)),{CORRIDOR_LAYOUT:L}=await import(new URL('reconstructions/scene-08/src/corridor-layout.js',root));
const camera=new T.PerspectiveCamera(49,1,.06,180);camera.position.set(0,2.65,13);camera.lookAt(0,6.65,-9);camera.updateMatrixWorld(true);
const matrix=(p,a,s=1)=>new T.Matrix4().makeTranslation(...p).multiply(new T.Matrix4().makeRotationY(a)).multiply(new T.Matrix4().makeScale(s,s,s));
const project=(p,m=new T.Matrix4())=>{const q=new T.Vector3(...p).applyMatrix4(m).project(camera);return[(q.x+1)*627,(1-q.y)*627];};
function rowPoint(x,z,row,m=new T.Matrix4()){let lo=-3,hi=10;for(let k=0;k<60;k++){const y=(lo+hi)/2;if(project([x,y,z],m)[1]>row)lo=y;else hi=y;}return project([x,(lo+hi)/2,z],m);}
function atScreenX(a,b,ya,yb,x){let lo=0,hi=1;for(let k=0;k<60;k++){const t=(lo+hi)/2,p=project([a[0]+(b[0]-a[0])*t,ya+(yb-ya)*t,a[1]+(b[1]-a[1])*t]);if(p[0]<x)lo=t;else hi=t;}const t=(lo+hi)/2;return project([a[0]+(b[0]-a[0])*t,ya+(yb-ya)*t,a[1]+(b[1]-a[1])*t]);}
const oldHall=matrix([-6.5,2.35,-5.8],.08),newHall=matrix(L.hall.position,L.hall.yaw),oldWing=matrix([-2.2,1.5,-7.5],-.55),newWing=matrix(L.wing.position,L.wing.yaw),portal=matrix(L.portal.origin,L.portal.yaw),oldTower=matrix([4.7,-.2,-24],-.4,1.2),newTower=matrix(L.pagoda.position,L.pagoda.yaw,1.2);
const oldPostT=2/7,oldPost=[-3.05+6.15*oldPostT,1.15+.02*oldPostT+1.65+.12+.19,4.5+5.5*oldPostT],newPost=[L.nearRail.a[0]+(L.nearRail.b[0]-L.nearRail.a[0])*L.nearRail.postT,L.nearRail.floor+L.nearRail.postHeight+.36,L.nearRail.a[1]+(L.nearRail.b[1]-L.nearRail.a[1])*L.nearRail.postT];
const observations=[
 ['portal-left-inner-at-row900',[174,900],rowPoint(-1.995,7.58,900),rowPoint(-L.portal.halfSpan+.305,-.32,900,portal)],
 ['portal-right-inner-at-row900',[1130,900],rowPoint(2.145,7.58,900),rowPoint(L.portal.halfSpan-.305,-.32,900,portal)],
 ['left-hall-front-column-foot',[412,685],project([3.96,1.95,2.96],oldHall),project([3.96,L.hall.raised,2.96],newHall)],
 ['left-hall-front-column-head',[410,385],project([3.96,7.35,2.96],oldHall),project([3.96,L.hall.raised+L.hall.h-.65,2.96],newHall)],
 ['left-hall-right-eave-corner',[565,215],project([5.5,8.65,4],oldHall),project([5.5,L.hall.h+L.hall.raised-L.hall.roofEaveDrop+L.hall.roofCurl,4],newHall)],
 ['receding-wing-far-eave',[809,500],project([2.65,7.7,-5.15],oldWing),project([2.65,7.7,-5.15],newWing)],
 ['near-handrail-at-x265',[265,1009],atScreenX([-3.05,4.5],[3.1,10],2.23,2.25,265),project([L.nearRail.a[0],1.91,L.nearRail.a[1]])],
 ['near-handrail-at-x1131',[1131,1110],atScreenX([-3.05,4.5],[3.1,10],2.23,2.25,1131),project([L.nearRail.b[0],1.91,L.nearRail.b[1]])],
 ['near-post-finial-tip',[415,808],project(oldPost),project(newPost)],
 ['pagoda-crown-apex',[789,190],project([0,18.48,0],oldTower),project([0,.75+4*L.pagoda.tierPitch+L.pagoda.roomHeight+.15+L.pagoda.topRoofRise,0],newTower)],
 ['pagoda-upper-front-floor',[770,323],project([0,12.95,6.14*.30+.46],oldTower),project([0,.75+4*L.pagoda.tierPitch,6.14*.30+.46],newTower)],
 ['pagoda-second-front-floor',[770,434],project([0,9.90,6.43*.30+.46],oldTower),project([0,.75+3*L.pagoda.tierPitch,6.43*.30+.46],newTower)],
 ['bridge-left-landing',[780,846],project([-.1,2.5,-3.7]),project(L.bridge.a)],
 ['bridge-right-gallery-landing',[1130,762],project([6.9,2.5,-4.15]),project(L.bridge.b)],
 ['stair-upper-gallery-landing',[716,750],project([.8,4,-7.1]),project(L.stair.b)],
].map(([id,target,before,after])=>({id,target,before,after,beforeError:Math.hypot(...before.map((v,k)=>v-target[k])),afterError:Math.hypot(...after.map((v,k)=>v-target[k]))}));
const source=await readFile(new URL('reconstructions/scene-08/src/scene.js',root),'utf8'),base=execFileSync('git',['show','814c879ad6e9b1552f254005e90902ce219501c5:reconstructions/scene-08/src/scene.js'],{cwd:root,encoding:'utf8'}),main=await readFile(new URL('reconstructions/scene-08/src/main.js',root));
const light=s=>s.slice(s.indexOf("scene.add(new T.HemisphereLight"),s.indexOf('return {scene,setTime'));
const material=s=>s.slice(s.indexOf('const mats='),s.indexOf('const v=a=>'));
const inversePortal=portal.clone().invert(),frontRailLocal=[L.nearRail.a,L.nearRail.b].map(p=>new T.Vector3(p[0],1.91,p[1]).applyMatrix4(inversePortal));
function segmentBox(a,b,box){let lo=0,hi=1;const d=b.clone().sub(a);for(const k of ['x','y','z']){if(Math.abs(d[k])<1e-9){if(a[k]<box.min[k]||a[k]>box.max[k])return false;}else{let u=(box.min[k]-a[k])/d[k],v=(box.max[k]-a[k])/d[k];if(u>v)[u,v]=[v,u];lo=Math.max(lo,u);hi=Math.min(hi,v);if(lo>hi)return false;}}return true;}
const railColumnCollisions=[-1,1].filter(sign=>segmentBox(frontRailLocal[0],frontRailLocal[1],new T.Box3(new T.Vector3(sign*L.portal.halfSpan-.305-.095,.94,-.32-.095),new T.Vector3(sign*L.portal.halfSpan+.305+.095,6.425,.32+.095))));
const rightFront=new T.Vector3(0,0,7.2*.37).applyMatrix4(matrix(L.rightGallery.position,L.rightGallery.yaw));
const middleInv=matrix(L.middleGallery.position,L.middleGallery.yaw).invert(),stairLocal=new T.Vector3(...L.stair.b).applyMatrix4(middleInv);
const connections={
 columnBeamBearingOverlapMetres:L.portal.columnTop-(L.portal.beamCentre-L.portal.beamDepth/2),
 beamRafterGapMetres:L.portal.rafterBottom-(L.portal.beamCentre+L.portal.beamDepth/2),
 rafterBoardingGapMetres:(L.portal.rafterBottom+.28-.04)-(L.portal.rafterBottom+.24),
 frontRailColumnCollisionCount:railColumnCollisions.length,
 bridgeStairSharedLandingError:new T.Vector3(...L.bridge.a).distanceTo(new T.Vector3(...L.stair.a)),
 bridgeRightGalleryPlanError:Math.hypot(rightFront.x-L.bridge.b[0],rightFront.z-L.bridge.b[2]),
 bridgeRightGalleryFloorError:Math.abs(L.bridge.b[1]-L.rightGallery.floor),
 stairMiddleGalleryFloorError:Math.abs(L.stair.b[1]-L.middleGallery.floor),
 stairUpperLandingInsideFloor:Math.abs(stairLocal.x)<4*.46&&Math.abs(stairLocal.z)<4.5*.445,
 bridgeRailPostEdgeInsetMetres:.08-.065,
 stairRailPostEdgeInsetMetres:.06-.045,
 upperEntryTreadRises:Array(3).fill((1.4-L.portal.floor)/3),
 pagodaCrownWorldY: L.pagoda.position[1]+L.pagoda.scale*(.75+4*L.pagoda.tierPitch+L.pagoda.roomHeight+.15+L.pagoda.topRoofRise),
 pagodaSpireTipWorldY:L.pagoda.position[1]+L.pagoda.scale*(21.89+L.pagoda.spireLocalOffset),
 pagodaFoundationGroundY:L.pagoda.foundationGround,
 wingPierTopWorldY:L.wing.position[1]+L.wing.raised-.64,
 wingBeamBottomWorldY:L.wing.position[1]+L.wing.raised-.49-.15,
 wingBeamTopWorldY:L.wing.position[1]+L.wing.raised-.49+.15,
 wingStonePlatformBottomWorldY:L.wing.position[1]+L.wing.raised-.23-.11,
 wingFinishedTimberFloorWorldY:L.wing.position[1]+L.wing.raised,
 middleFinishedTimberFloorWorldY:L.middleGallery.position[1]+.22,
 rightFinishedTimberFloorWorldY:L.rightGallery.position[1]+.5,
 bridgeFinishedSurfaceToGalleryThresholdMetres:.005,
};
const stairDirection=new T.Vector3(...L.stair.b).sub(new T.Vector3(...L.stair.a)).normalize(),stairRotation=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),stairDirection),stairX=new T.Vector3(1,0,0).applyQuaternion(stairRotation),stairZ=new T.Vector3(0,0,1).applyQuaternion(stairRotation),stringerVerticalHalf=.11*Math.abs(stairX.y)+.12*Math.abs(stairZ.y);
connections.stairStringerToTreadBearingOverlapMetres=stringerVerticalHalf-(.24+.5*(L.stair.b[1]-L.stair.a[1])/10-.20);
const report={scope:'Fifteen manually measured contour features under the original fixed camera, plus physical connection contracts. Not photographic acceptance or exhaustive collision detection.',baseCommit:'814c879ad6e9b1552f254005e90902ce219501c5',camera:{position:[0,2.65,13],target:[0,6.65,-9],fov:49},annotationUncertaintyPixels:[10,25],landmarks:observations,beforeRms:Math.sqrt(observations.reduce((s,p)=>s+p.beforeError**2,0)/observations.length),afterRms:Math.sqrt(observations.reduce((s,p)=>s+p.afterError**2,0)/observations.length),connections,lightsSourceExact:light(source)===light(base),materialSetupExact:material(source)===material(base),cameraMainSHA256:createHash('sha256').update(main).digest('hex'),layout:L,limits:['Sparse anchors and uncertain partly occluded contours','Side-return rail deliberately shares the same supported guard height; its upper photo contour remains unmatched','No exhaustive collision proof for inherited hidden roof/wall interiors','Metric terrace heights and depth are nonunique single-photo estimates']};
report.passed=report.lightsSourceExact&&report.materialSetupExact&&connections.frontRailColumnCollisionCount===0&&Math.abs(connections.columnBeamBearingOverlapMetres)<=.01&&Math.abs(connections.beamRafterGapMetres)<1e-9&&Math.abs(connections.rafterBoardingGapMetres)<1e-9&&connections.bridgeStairSharedLandingError<1e-9&&connections.bridgeRightGalleryPlanError<.001&&connections.bridgeRightGalleryFloorError<1e-9&&connections.stairMiddleGalleryFloorError<1e-9&&connections.stairUpperLandingInsideFloor&&Math.abs(connections.wingPierTopWorldY-connections.wingBeamBottomWorldY)<1e-9&&Math.abs(connections.wingBeamTopWorldY-connections.wingStonePlatformBottomWorldY)<1e-9&&connections.stairStringerToTreadBearingOverlapMetres>=0;
await writeFile(new URL('./layout-measurements.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,beforeRms:report.beforeRms,afterRms:report.afterRms,connections,landmarks:observations.map(p=>({id:p.id,before:p.before.map(v=>+v.toFixed(1)),after:p.after.map(v=>+v.toFixed(1)),error:+p.afterError.toFixed(1)}))},null,2));if(!report.passed)process.exitCode=1;
