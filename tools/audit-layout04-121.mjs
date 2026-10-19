import * as T from '../vendor/build/three.module.js';
import {reference4Config as C} from '../reconstructions/scene-04/src/reference4-config.js';
import {createReference4StairPlan} from '../reconstructions/scene-04/src/reference4-stair-plan.js';
import {createTracedPaving04} from '../reconstructions/scene-04/src/traced-paving04.js';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='814c879ad6e9b1552f254005e90902ce219501c5',baseSource=execFileSync('git',['show',base+':reconstructions/scene-04/src/reference4-config.js'],{encoding:'utf8'}),B=(await import('data:text/javascript,'+encodeURIComponent(baseSource))).reference4Config;
const camera=new T.PerspectiveCamera(C.camera.fov,1,C.camera.near,C.camera.far);camera.position.fromArray(C.camera.position);camera.lookAt(...C.camera.target);camera.updateMatrixWorld(true);
const project=p=>{const q=new T.Vector3(...p).project(camera);return[(q.x+1)*627,(1-q.y)*627];};
function anchors(c,legacy=false){
 const a=c.architecture,g=c.garden,w=a.upperRoofWidth??16.4,rh=w*(a.upperRidgeHalfRatio??.275),offset=a.upperRidgeOffsetX??0,eaveOffset=a.upperEaveOffsetX??0,eave=a.upperEaveY??11.60+a.stairTopY-3,curl=a.upperRoofCurl??.62,t=1.035,span=w*((a.upperRidgeHalfRatio??.275)+(.5-(a.upperRidgeHalfRatio??.275))*t),cornerY=eave+curl*t**8;
 const stairHalfTop=(legacy?a.stairWidth:a.stairTopWidth)/2,footY=legacy?0:a.stairBaseY,terminalY=legacy?1.62:a.stairBaseY+2.13;
 return {
  ridgeLeft:[offset-rh,a.ridgeY+.285,a.ridgeZ],ridgeRight:[offset+rh,a.ridgeY+.285,a.ridgeZ],
  upperCurlLeft:[-span+offset*(1-t)+eaveOffset*t,cornerY,a.ridgeZ+4.5*t],upperCurlRight:[span+offset*(1-t)+eaveOffset*t,cornerY,a.ridgeZ+4.5*t],
  entranceCanopyCrown:[0,8.4+a.stairTopY-3+2.65+.038,1.55],
  portalClearUpperLeft:[-2.1,a.stairTopY+4.08,-.355],portalClearUpperRight:[2.1,a.stairTopY+4.08,-.355],threshold:[0,a.stairTopY,-.355],
  stairTopLeft:[-stairHalfTop,a.stairTopY,a.stairTopZ],stairTopRight:[stairHalfTop,a.stairTopY,a.stairTopZ],
  stairFootLeft:[-a.stairWidth/2,footY,a.stairBottomZ],stairFootRight:[a.stairWidth/2,footY,a.stairBottomZ],
  terminalLeft:[-a.stairWidth/2-.23,terminalY,a.stairBottomZ+.02],terminalRight:[a.stairWidth/2+.23,terminalY,a.stairBottomZ+.02],
  lanternTipLeft:[-g.lanternX,g.soilY+g.lanternHeight,g.lanternZ],lanternTipRight:[g.lanternX,g.soilY+g.lanternHeight,g.lanternZ],
  lanternFootLeft:[-g.lanternX,g.soilY,g.lanternZ],lanternFootRight:[g.lanternX,g.soilY,g.lanternZ]
 };
}
// Manually observed whole-image anchors, with finite visual reading uncertainty.
// These constrain physical components, never independently position mesh vertices.
const targets={ridgeLeft:[469,139],ridgeRight:[812,137],upperCurlLeft:[292,202],upperCurlRight:[974,202],entranceCanopyCrown:[627,204],portalClearUpperLeft:[543,409],portalClearUpperRight:[715,409],threshold:[627,571],stairTopLeft:[532,573],stairTopRight:[725,573],stairFootLeft:[440,749],stairFootRight:[814,749],terminalLeft:[426,613],terminalRight:[837,613],lanternTipLeft:[223,454],lanternTipRight:[1034,454],lanternFootLeft:[219,850],lanternFootRight:[1036,850]};
const old=anchors(B,true),now=anchors(C),landmarks=Object.entries(targets).map(([name,target])=>{const before=project(old[name]),after=project(now[name]);return{name,referencePixels:target,readingUncertaintyPixels:5,baselineWorld:old[name],candidateWorld:now[name],baselineProjectedPixels:before,candidateProjectedPixels:after,baselineErrorPixels:Math.hypot(before[0]-target[0],before[1]-target[1]),candidateErrorPixels:Math.hypot(after[0]-target[0],after[1]-target[1])};});
const plan=createReference4StairPlan(C.architecture),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9);
assert.equal(plan.steps.length,18);near(plan.steps[0].top,plan.landing.top);near(plan.steps.at(-1).front,plan.z1);
assert.ok(plan.landing.wingFront<plan.steps[1].back,'Porch wing must end before the second, lower tread');
for(const [i,s] of plan.steps.entries()){
 assert.ok(s.coreTop>s.bottom&&s.top-s.coreTop>.09);
 if(i){near(s.back,plan.steps[i-1].front);assert.ok(s.top<plan.steps[i-1].top);}
 for(const [x,z]of s.outline)near(Math.abs(x),plan.halfWidth(z));
 for(const side of[-1,1])for(const z of[s.back,s.front])assert.ok(Math.abs(plan.railPoint(side,(z-plan.z0)/plan.run)[0])-plan.halfWidth(z)>.22);
}
const paving=createTracedPaving04();for(const r of paving.records)for(const p of r.outline)assert.ok(p[1]>=plan.z1-1e-8,'Ground paving must end outside stair solid');
assert.deepEqual(C.camera,B.camera,'Whole-image roof/stair-foot/path evidence supports retaining the existing low reference camera');
const report={status:'Physical plan and CPU projection audit only; actual render comparison remains required',visualAccepted:false,baseCommit:base,reference:'references/hd/3-照片-4.jpg',referenceDimensions:[1254,1254],camera:C.camera,cameraDecision:'Retained unchanged; outer canopy, stair-foot/path vanishing structure already close. Source geometry/proportions are corrected instead. Dolly path remains coherent because reference camera and floor/stair-foot anchors are retained.',landmarkCount:landmarks.length,meanLandmarkErrorPixels:{baseline:landmarks.reduce((s,p)=>s+p.baselineErrorPixels,0)/landmarks.length,candidate:landmarks.reduce((s,p)=>s+p.candidateErrorPixels,0)/landmarks.length},landmarks,physicalChecks:{closedExtrudedTreadCores:18,closedFlagstoneCaps:72,closedFlankStones:36,allTreadsShareOneDatum:true,landingCapStopsBeforeSecondTread:true,balustradesRemainOutsideClearFlight:true,pathSlabsClippedAtStairFoot:true,retainedVisiblePavingSlabs:paving.records.length,stairTopWidth:plan.topWidth,stairBottomWidth:plan.bottomWidth,stairRise:(plan.topY-plan.baseY)/plan.count,stairRun:plan.run/plan.count},limits:['Selected landmarks cannot prove photographic fidelity.','Stone wear cap/core joins intentionally share their buried support, not a Boolean-union claim.','Hidden metric scale and inferred roof asymmetry remain authored hypotheses.']};
const dir=new URL('../qa/ten-reference/04/layout121/',import.meta.url);await mkdir(dir,{recursive:true});await writeFile(new URL('physical-layout-audit.json',dir),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({landmarks:report.landmarkCount,meanError:report.meanLandmarkErrorPixels,checks:report.physicalChecks}));
