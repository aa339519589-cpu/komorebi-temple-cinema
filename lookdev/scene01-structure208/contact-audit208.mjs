import * as T from 'three';
import {Builder,materialSet} from '../../reconstructions/scene-01/src/kernel.js';
import {buildBridge208,buildCourt208} from '../../reconstructions/scene-01/src/bridge-court208.js';
import {layout124 as L} from '../../reconstructions/scene-01/src/layout124.js';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
import {writeFile} from 'node:fs/promises';

const B=new Builder(materialSet());buildBridge208(B);buildCourt208(B);
const G=L.bridge,H=G.halfSpan,D=x=>G.deckBaseline+.085+G.archRise*(1-(x/H)**2)+G.slope*x/H,matrix=new T.Matrix4().compose(new T.Vector3(...G.position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),G.yaw),new T.Vector3(...G.scale)),inverse=matrix.clone().invert();
const items=[...B.buckets.values()].flatMap(b=>b.items.map(item=>({g:b.g,m:item.m}))),isArch=g=>g.name==='structure208-closed-arched-member-with-joist-seats',isSleeper=g=>g.name==='structure208-curved-end-sleeper-in-receiving-pocket',isBent=g=>g.name==='structure208-fitted-central-bent-cap';
function triangles(item){const p=item.g.attributes.position,index=item.g.index?.array??Array.from({length:p.count},(_,i)=>i),out=[];for(let i=0;i<index.length;i+=3)out.push(Array.from(index.slice(i,i+3)).map(j=>new T.Vector3().fromBufferAttribute(p,j).applyMatrix4(item.m)));return out;}
const arch=items.filter(o=>isArch(o.g)).flatMap(triangles),sleepers=items.filter(o=>isSleeper(o.g)).flatMap(triangles),bent=items.filter(o=>isBent(o.g)).flatMap(triangles);
function surfaceAt(tris,u,v,expected){const point=new T.Vector3(u,0,v).applyMatrix4(matrix),ray=new T.Ray(new T.Vector3(point.x,12,point.z),new T.Vector3(0,-1,0)),hit=new T.Vector3(),heights=[];for(const t of tris)if(ray.intersectTriangle(...t,false,hit))heights.push(hit.y);return heights.sort((a,b)=>Math.abs(a-expected)-Math.abs(b-expected))[0]??null;}
const samples=[];
for(const sign of[-1,1])for(const inset of[.02,.10,.20])for(const v of[-.96,0,.96]){const u=sign*(H-inset),expected=G.position[1]+D(u)-.53,girder=surfaceAt(arch,u,v,expected),bearing=surfaceAt(sleepers,u,v,expected);samples.push({kind:'girder-to-curved-sleeper',localXZ:[u,v],girderY:girder,bearingY:bearing,gapMetres:girder===null||bearing===null?null:girder-bearing});}
for(const u of[-.68,-.50,-.32])for(const v of[-.96,0,.96]){const expected=G.position[1]+D(u)-.53,girder=surfaceAt(arch,u,v,expected),bearing=surfaceAt(bent,u,v,expected);samples.push({kind:'girder-to-central-bent',localXZ:[u,v],girderY:girder,bearingY:bearing,gapMetres:girder===null||bearing===null?null:girder-bearing});}
const masonry=items.filter(o=>/landing-bearing|bearing-pocket|landing-solid-behind|stone-lintel-above|mortar|level-end-landing-cap/.test(o.g.name)).map(o=>{const box=new T.Box3();for(const p of triangles(o).flat())box.expandByPoint(p.applyMatrix4(inverse));return{name:o.g.name,box};});
let sleeperSamples=0;const intrusions=[];
for(const item of items.filter(o=>isSleeper(o.g)))for(const tri of triangles(item))for(const p of[...tri,tri[0].clone().add(tri[1]).add(tri[2]).multiplyScalar(1/3)]){
 p.applyMatrix4(inverse);sleeperSamples++;for(const {name,box}of masonry){const inset=1e-5;if(p.x>box.min.x+inset&&p.x<box.max.x-inset&&p.y>box.min.y+inset&&p.y<box.max.y-inset&&p.z>box.min.z+inset&&p.z<box.max.z-inset)intrusions.push({name,point:p.toArray()});}
}
const maxAbsBearingDelta=Math.max(...samples.map(s=>s.gapMetres===null?Infinity:Math.abs(s.gapMetres))),source=await reconstructionSourceIdentity(process.cwd(),'01'),iteration=process.env.ITERATION??'r03';
const report={source,iteration,scope:'CPU intersection of the actual emitted triangle meshes. Vertical bearing differences are measured at27points; sleeper vertex/face-centroid samples are checked against the actual rectangular receiving-pocket solids. This does not prove engineering adequacy, render quality or photographic fidelity.',visualAccepted:false,samples,maxAbsBearingDeltaMetres:maxAbsBearingDelta,pocketSamples:sleeperSamples,pocketIntrusions:intrusions,pass:maxAbsBearingDelta<=.0003&&intrusions.length===0};
await writeFile(`lookdev/scene01-structure208/contact208-${iteration}.json`,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({sourceHash:source.hash,maxAbsBearingDeltaMetres:maxAbsBearingDelta,pocketSamples:sleeperSamples,pocketIntrusions:intrusions.length,pass:report.pass}));if(!report.pass)process.exitCode=1;
