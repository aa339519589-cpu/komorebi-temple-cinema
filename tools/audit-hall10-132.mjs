import * as T from 'three';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRestorationArchitecture} from '../reconstructions/scene-10/src/architecture.js';
import {buildHall132} from '../reconstructions/scene-10/src/hall-front132.js';
import {scene10Layout125 as L} from '../reconstructions/scene-10/src/layout125.js';

// CPU construction/contact audit, not an image-quality acceptance test.
const stack=[new T.Matrix4()],seen=new Set(),bounds=new T.Box3(),byMaterial={},cube=new T.BoxGeometry(),sphere=new T.SphereGeometry(),cylinder=new T.CylinderGeometry(),V=p=>new T.Vector3(...p);
let instances=0,randomCalls=0;
function emit(g,material,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0){
  if(typeof g==='string')g=({box:cube,sphere,cylinder})[g];
  if(!g?.isBufferGeometry)throw Error('Invalid geometry');
  const q=rot?.isQuaternion?rot:new T.Quaternion().setFromEuler(new T.Euler(...(Array.isArray(rot)?rot:[0,rot||0,0]))),matrix=new T.Matrix4().compose(V([x,y,z]),q,V([sx,sy,sz])).premultiply(stack.at(-1));
  if(!matrix.elements.every(Number.isFinite))throw Error('Nonfinite transform');
  if(!seen.has(g)){for(const a of Object.values(g.attributes))if(!Array.from(a.array).every(Number.isFinite))throw Error('Nonfinite geometry');g.computeBoundingBox();seen.add(g);}
  bounds.union(g.boundingBox.clone().applyMatrix4(matrix));instances++;byMaterial[material]=(byMaterial[material]||0)+1;
}
function box(x,y,z,w,h,d,material='cedar',rot=0){if(w>0&&h>0&&d>0)emit(cube,material,x,y,z,w,h,d,rot);}
function group(x,y,z,yaw,fn,scale=1){stack.push(stack.at(-1).clone().multiply(new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromAxisAngle(V([0,1,0]),yaw),V(Array.isArray(scale)?scale:[scale,scale,scale]))));try{fn();}finally{stack.pop();}}
function between(a,b,r,material='cedar',square=false){const d=V(b).sub(V(a)),center=V(a).add(V(b)).multiplyScalar(.5);emit(square?cube:cylinder,material,...center.toArray(),r,d.length(),r,new T.Quaternion().setFromUnitVectors(V([0,1,0]),d.normalize()));}
function tube(points,r,material){emit(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(V)),Math.max(12,points.length*3),r,7,false),material);}
const arch=createRestorationArchitecture({instance:emit,box,group,stack,columns:[],roofAudit:[]}),scene=new T.Scene();
const receipt=buildHall132({emit,box,group,between,tube,arch,scene,stack,R:()=>{randomCalls++;return .96;},lantern:()=>{randomCalls+=24;},emitRestoredBuddha:()=>{}},L);
if(randomCalls!==419)throw Error('The hall changed the later garden RNG sequence.');
for(const c of receipt.columns)if(Math.abs(c.shaftTop-c.bearingBeamCenter)>1e-9)throw Error('Detached column/header');
const base='5333c11d9ec313841a29199c3ae352586c693f8e',mainPath='reconstructions/scene-10/src/main.js',layoutPath='reconstructions/scene-10/src/layout125.js';
const before=execFileSync('git',['show',base+':'+mainPath],{encoding:'utf8'}),after=await readFile(mainPath,'utf8'),part=s=>s.slice(s.indexOf('// One closed bridge, turning landing'),s.indexOf('function captureNearEnvironment'));
if(part(before)!==part(after))throw Error('Bridge, stairs, garden or camera changed.');
const layoutBefore=execFileSync('git',['show',base+':'+layoutPath],{encoding:'utf8'}),layoutAfter=await readFile(layoutPath,'utf8');
if(layoutBefore!==layoutAfter)throw Error('Layout125 changed.');
const sha=s=>createHash('sha256').update(s).digest('hex'),result={status:'construction-audited-not-visually-accepted',scope:'Finite closed members, explicit bearings, and unchanged physical route/camera. These checks do not establish photographic fidelity.',base,layout125Sha256:sha(layoutAfter),unchangedRouteGardenCameraSectionSha256:sha(part(after)),rngCalls:randomCalls,instances,uniqueGeometry:seen.size,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},byMaterial,hall:receipt};
await mkdir('qa/ten-reference/10/hall132',{recursive:true});await writeFile('qa/ten-reference/10/hall132/construction-audit.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({status:result.status,instances,uniqueGeometry:seen.size,rngCalls:randomCalls,roofs:receipt.roofs.length,bearingRows:receipt.bearingRows.length,columns:receipt.columns.length,ornament:receipt.ornament,unchangedRouteGardenCameraSectionSha256:result.unchangedRouteGardenCameraSectionSha256}));
