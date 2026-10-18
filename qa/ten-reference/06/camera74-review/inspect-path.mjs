// Pure camera mathematics and retained-source inspection. No frames/movie or
// scene-wide test suite are rendered by this script.
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as T from '../../../../vendor/build/three.module.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../../..'),base='1f88db08d9f38c584f20c6bb43fb76aa9f987880';
const report=JSON.parse(await readFile(resolve(root,'qa/ten-reference/06/iteration-camera74/report.json'),'utf8'));
const failure=JSON.parse(await readFile(resolve(root,'qa/ten-reference/06/iteration-camera73/report.json'),'utf8'));
const config=report.frames[0].info.cameraShot,reference={position:config.end.position,target:config.end.target,fov:config.end.fov};
const raw=await readFile(resolve(root,'reconstructions/scene-06/src/reference6-camera-shot.js'),'utf8'),source=raw.replace("from 'three'",`from '${pathToFileURL(resolve(root,'vendor/build/three.module.js')).href}'`);
const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const shot=module.createReference6CameraShot(reference,config.subject),dt=1/60,samples=Array.from({length:421},(_,i)=>shot.sample(i*dt));
const speeds=[],angularSpeeds=[],heights=[],fovs=[],rolls=[];
for(let i=0;i<samples.length;i++){
 const s=samples[i];heights.push(s.position.y);fovs.push(s.fov);rolls.push(Math.abs(new T.Euler().setFromQuaternion(s.quaternion,'YXZ').z)*180/Math.PI);
 if(i){speeds.push(s.position.distanceTo(samples[i-1].position)/dt);angularSpeeds.push(s.quaternion.angleTo(samples[i-1].quaternion)/dt*180/Math.PI);}
}
const end=samples.at(-1),canonical=new T.PerspectiveCamera(reference.fov,1,.06,60);canonical.position.fromArray(reference.position);canonical.lookAt(new T.Vector3(...reference.target));canonical.updateMatrixWorld(true);
const attitudeDelta=end.quaternion.clone().invert().multiply(canonical.quaternion),attitudeError=2*Math.atan2(Math.hypot(attitudeDelta.x,attitudeDelta.y,attitudeDelta.z),Math.abs(attitudeDelta.w))*180/Math.PI;
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]),hash=b=>createHash('sha256').update(b).digest('hex');
const files=['reference6-scene.js','restoration-buddha.js','restoration-altar.js','restoration-lighting.js','floor-varnish.js','reference6-coffer-relief.js','reference6-column-collar.js','lens-bloom.js'];
const retained=[];
for(const name of files){const path='reconstructions/scene-06/src/'+name,now=await readFile(resolve(root,path)),before=execFileSync('git',['show',base+':'+path],{cwd:root,maxBuffer:32*1024*1024});retained.push({path,sha256:hash(now),unchangedFromBase:now.equals(before)});}
const receipt={
 candidate:'camera74',status:'three-still-camera-review-not-full-motion-acceptance',baseCommit:base,
 branch:'work/camera-reference-06-20261019',preservedPreviousBranch:{name:'work/mesh-reference-06-20261018',commit:execFileSync('git',['rev-parse','work/mesh-reference-06-20261018'],{cwd:root,encoding:'utf8'}).trim()},
 subject:config.subject,controls:config.controls,start:config.start,end:config.end,
 mathOnlySampling:{seconds:7,interval:dt,samples:samples.length,eyeHeightRange:[Math.min(...heights),Math.max(...heights)],fovRange:[Math.min(...fovs),Math.max(...fovs)],maxSpeedMetresPerSecond:Math.max(...speeds),maxAngularSpeedDegreesPerSecond:Math.max(...angularSpeeds),firstSecondAngularChangeDegrees:samples[0].quaternion.angleTo(shot.sample(1).quaternion)*180/Math.PI,firstSecondTravelMetres:samples[0].position.distanceTo(shot.sample(1).position),firstStepSpeed:speeds[0],lastStepSpeed:speeds.at(-1),maxRollDegrees:Math.max(...rolls),endpointVelocityAndAcceleration:'Analytically zero from quintic smootherstep; finite-difference values shown separately'},
 endpoint:{positionExact:equal(end.position.toArray(),reference.position),targetExact:equal(end.targetWitness.toArray(),reference.target),fovExact:end.fov===reference.fov,quaternionAngularErrorDegrees:attitudeError,actualRenderedQuaternionArrayExact:equal(report.frames.at(-1).pose.camera.quaternion,canonical.quaternion.toArray()),actualRenderedPositionExact:equal(report.frames.at(-1).pose.camera.position,reference.position),actualRenderedTargetExact:equal(report.frames.at(-1).pose.camera.target,reference.target),focusPassDisabledAtEnd:report.frames.at(-1).pose.focus.enabled===false,referenceFocusMode:'Original scene has no DOF; new pass is bypassed, not refocused at the endpoint'},
 retainedWorldFiles:retained,unselected66HeadImported:/BUDDHA_HEAD_ANATOMICAL|HEAD_MESH62|HEAD_SCULPT/.test(await readFile(resolve(root,'reconstructions/scene-06/src/restoration-buddha.js'),'utf8')),
 nativeFrames:report.frames.map(f=>({time:f.localTime,name:f.name,valid:f.valid,pose:f.pose.camera,focus:f.pose.focus,sha256:f.rgbaSha256})),
 rendering:{calls:2,failedStartup:{iteration:'camera73',frames:failure.frames?.length??0,status:failure.status,reason:'Censer body guard omitted the pre-existing table Z+.62 transform; fixed by reading the actual ritual-axis anchor'},successfulNativeFrames:3,shotTimes:[0,3.5,7],fullMovie:false,testSuite:false,errors:report.errors},
 limits:['Only three actual stills inspected; mathematical continuity does not replace a full-motion aesthetic review','Depth-aware optical defocus uses actual opaque depth; transparent glass/hidden layers are approximations','Existing scene geometry, material and fidelity limitations remain outside this camera pass'],visualAccepted:false
};
await writeFile(new URL('./path-receipt.json',import.meta.url),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({eyeHeight:receipt.mathOnlySampling.eyeHeightRange,fov:receipt.mathOnlySampling.fovRange,firstSecondAngle:receipt.mathOnlySampling.firstSecondAngularChangeDegrees,maxSpeed:receipt.mathOnlySampling.maxSpeedMetresPerSecond,maxAngularSpeed:receipt.mathOnlySampling.maxAngularSpeedDegreesPerSecond,maxRoll:receipt.mathOnlySampling.maxRollDegrees,endpoint:receipt.endpoint,allWorldFilesUnchanged:retained.every(f=>f.unchangedFromBase)}));
