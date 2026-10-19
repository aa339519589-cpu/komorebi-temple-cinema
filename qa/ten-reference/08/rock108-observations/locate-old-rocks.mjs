import * as T from '../../../../vendor/build/three.module.js';
import {createWeatheredBoulderGeometry} from '../../../../reconstructions/scene-08/src/rocks.js';
import {writeFile} from 'node:fs/promises';
const camera=new T.PerspectiveCamera(49,1,.06,180);camera.position.set(0,2.65,13);camera.lookAt(0,6.65,-9);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
const project=p=>{const v=p.clone().project(camera);return[(v.x+1)*627,(1-v.y)*627];};
let seed=80247,calls=0;const random=()=>{calls++;return(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;},rr=(a,b)=>a+(b-a)*random();
for(let i=0;i<3*128*128+48*3;i++)random();
const ground=z=>Math.max(0,Math.min(1.7,(4-z)*.07)),records=[],meshes=[],geos=Array.from({length:9},(_,i)=>createWeatheredBoulderGeometry(T,{seed:803+i,sectors:20,rings:11}));
const mat=new T.MeshBasicMaterial({side:T.DoubleSide});
function rock(x,y,z,sx,sy,sz,i,label){const m=new T.Mesh(geos[i%9],mat);m.position.set(x,y+ground(z),z);m.scale.set(sx,sy,sz);m.rotation.y=i*.71;m.updateMatrixWorld(true);const p=m.geometry.attributes.position,bb=new T.Box2();for(let k=0;k<p.count;k++)bb.expandByPoint(new T.Vector2(...project(new T.Vector3().fromBufferAttribute(p,k).applyMatrix4(m.matrixWorld))));const r={label,index:i,center:m.position.toArray(),scale:m.scale.toArray(),yaw:m.rotation.y,pixelBounds:{min:bb.min.toArray(),max:bb.max.toArray()}};m.userData.record=r;meshes.push(m);records.push(r);}
for(let i=0;i<115;i++){const z=rr(-21,7),side=i%2?-1:1,x=.8+side*rr(2,8.6);rock(x,rr(-.2,.35),z,rr(.35,1.25),rr(.45,1.4),rr(.4,1.35),i,'random-'+i);}
rock(-1.45,1.10,.4,.9,2.5,.8,5,'fixed-front-left-tall');rock(-.55,1.35,-.3,.95,2.7,.9,2,'fixed-centre-tall');rock(-1.2,1.45,-2.2,.6,1.1,.65,6,'fixed-rear-middle');rock(-2.4,1.6,-.5,.8,1.2,.8,4,'fixed-left-upper');rock(3.4,.05,3.5,1.4,1.1,1.1,7,'fixed-right-near');rock(-3.1,1.05,.6,1.1,1.1,1.2,8,'fixed-left-near');
for(let i=0;i<14;i++){const z=-3+i*.68,side=i%2?1:-1;rock(.8+side*rr(1.8,2.15),.65,z,rr(.65,1.0),rr(.65,1.0),rr(.55,.9),i+5,'channel-'+i);}
const probes=[[589,900],[559,864],[622,917],[515,884],[597,850]].map(([x,y])=>{const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x/627-1,1-y/627),camera);return{pixel:[x,y],hits:ray.intersectObjects(meshes,false).slice(0,3).map(h=>({label:h.object.userData.record.label,point:h.point.toArray(),distance:h.distance}))};});
const r={scope:'Exact old procedural rock geometry/placement and pre-plant RNG consumption; ignores plants/rail occlusion, not a new render',records,probes,rngCallsAtRocksEnd:calls,rngStateAtRocksEnd:seed,sourceProceduralVariants:9};await writeFile(new URL('./old-rock-locations.json',import.meta.url),JSON.stringify(r,null,2));console.log(JSON.stringify({fixed:records.filter(r=>r.label.startsWith('fixed')),probes,rngState:seed,rngCalls:calls},null,2));
