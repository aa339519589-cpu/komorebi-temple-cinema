// Frozen 76a helper is imported from its retained source, not the later candidate.
import * as T from 'three';
import {createPhysicalFixtures} from '../../../../reconstructions/scene-09/src/physical-night-fixtures.js';
import {createHeroHangingLantern} from './retained-source/reconstructions/scene-09/src/hero-hanging-lantern.js';
import {writeFile} from 'node:fs/promises';
const M=Object.fromEntries(['paper','lanternMetal','lanternEdge','lanternWood'].map(name=>[name,new T.MeshStandardMaterial({name})])),materials=[],textures=[];
const current=createHeroHangingLantern(M,materials,textures),legacy=createPhysicalFixtures(M,{});
function capture(build){
 const stack=[new T.Matrix4()],bounds=new T.Box3(),paper=[],lights=[],cube=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(1,1,1,12),V=a=>new T.Vector3(...a);
 const api={emit(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0){const r=Array.isArray(rot)?new T.Euler(...rot):new T.Euler(0,rot,0),tr=new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromEuler(r),V([sx,sy,sz])).premultiply(stack.at(-1));const p=g.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(tr));if(m===M.paper)paper.push(tr.toArray());},group(x,y,z,a,fn,s=1){stack.push(stack.at(-1).clone().multiply(new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromAxisAngle(V([0,1,0]),a),V([s,s,s]))));fn();stack.pop();},light(x,y,z,intensity,distance){const scale=new T.Vector3().setFromMatrixScale(stack.at(-1)).x;lights.push({position:V([x,y,z]).applyMatrix4(stack.at(-1)).toArray(),color:0xffd39b,intensity:intensity*scale*scale,distance:distance*scale,decay:2});}};
 api.box=(x,y,z,w,h,d,m)=>api.emit(cube,m,x,y,z,w,h,d);
 api.between=(a,b,w,d,m,round)=>{a=V(a);b=V(b);const r=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(V([0,1,0]),b.clone().sub(a).normalize()));api.emit(round?cyl:cube,m,...a.clone().add(b).multiplyScalar(.5).toArray(),w,a.distanceTo(b),d,r.toArray().slice(0,3));};
 build(api);return{bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},paper,lights};
}
const old=capture(api=>legacy.hangingLantern(api,7.7,7.3,21.6,1.35,true)),next=capture(api=>current.install(api));
const boundDelta=Math.max(...['min','max'].flatMap(key=>old.bounds[key].map((x,i)=>Math.abs(x-next.bounds[key][i]))));
if(boundDelta>1e-5||JSON.stringify(old.paper)!==JSON.stringify(next.paper)||JSON.stringify(old.lights)!==JSON.stringify(next.lights))throw Error(JSON.stringify({boundDelta,oldBounds:old.bounds,newBounds:next.bounds,paper:old.paper,lights:old.lights,next:next.lights}));
const solids=[];
for(const g of current.prototypes){
 const p=g.attributes.position,ix=g.index,weld=new Map(),ids=[],edges=new Map();let volume=0;
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(':');if(!weld.has(key))weld.set(key,weld.size);ids.push(weld.get(key));}
 for(let i=0;i<(ix?.count??p.count);i+=3){const vs=[0,1,2].map(j=>ix?ix.getX(i+j):i+j),ws=vs.map(v=>ids[v]);if(new Set(ws).size<3)continue;const ps=vs.map(k=>new T.Vector3().fromBufferAttribute(p,k));volume+=ps[0].dot(ps[1].clone().cross(ps[2]))/6;for(let j=0;j<3;j++){const a=ws[j],b=ws[(j+1)%3],key=a<b?a+':'+b:b+':'+a;edges.set(key,(edges.get(key)||0)+1);}}
 const bad=[...edges.values()].filter(v=>v!==2).length;const record={triangles:(ix?.count??p.count)/3,volume,nonmanifoldEdges:bad,finite:Array.from(p.array).every(Number.isFinite)};solids.push(record);if(bad||volume<=0||!record.finite)throw Error('Non-closed solid '+JSON.stringify(record));
}
const result={status:'actual-hero-solids-and-unchanged-paper-light-envelope-audited',baseCommit:'db08d1e',oldWorldBounds:old.bounds,newWorldBounds:next.bounds,maximumBoundsDifferenceMetres:boundDelta,paperTransformsIdentical:true,paperMaterialObjectRetained:true,lightsIdentical:true,originalLight:old.lights,triangles:current.info.triangles,closedComponents:current.info.closedMetalComponents,prototypeCount:current.prototypes.length,allFinitePositiveVolume:true,nonmanifoldEdges:0,metadata:current.info,solids,visualAccepted:false};
await writeFile(new URL('./geometry-receipt.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify({triangles:result.triangles,closedComponents:result.closedComponents,prototypeCount:result.prototypeCount,boundDelta,paperSame:true,lightSame:true}));
