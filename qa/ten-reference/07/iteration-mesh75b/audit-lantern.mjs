// CPU audit of actual lamp solids and the exact legacy generator envelope.
// Run with the neighboring75a module-alias-loader, without a browser.
import * as T from 'three';
import {stoneLanternRoof} from '../../../../reconstructions/scene-07/src/natural-details.js';
import {buildIslandStoneLantern} from '../../../../reconstructions/scene-07/src/island-stone-lantern.js';
import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
const parentMatrix=new T.Matrix4().makeTranslation(0,0,-3).multiply(new T.Matrix4().makeScale(1,1,.6));
const source=execFileSync('git',['show','cedb249:reconstructions/scene-07/src/main.js'],{encoding:'utf8'}),start=source.indexOf('const lanternRoof=stoneLanternRoof()'),end=source.indexOf('\nlantern(4.8',start),code=source.slice(start,end);
let matrix=parentMatrix.clone();const oldBounds=new T.Box3(),unitBox=new T.BoxGeometry(1,1,1);
function emit(g,mat,x,y,z,sx=1,sy=1,sz=1,rot=[0,0,0]){
 g.computeBoundingBox();const m=matrix.clone().multiply(new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(sx,sy,sz)));oldBounds.union(g.boundingBox.clone().applyMatrix4(m));
}
function group(x,y,z,a,s,fn){const prior=matrix;matrix=matrix.clone().multiply(new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(0,a,0)),new T.Vector3(s,s,s)));fn();matrix=prior;}
const box=(x,y,z,w,h,d,m)=>emit(unitBox,m,x,y,z,w,h,d),ring=(x,y,z,r,t,m)=>emit(new T.TorusGeometry(r,t,5,16),m,x,y,z,1,1,1,[Math.PI/2,0,0]);
new Function('T','stoneLanternRoof','group','box','emit','ring',code+';lantern(4.8,14.2,5.8,.2);')(T,stoneLanternRoof,group,box,emit,ring);
const current=buildIslandStoneLantern({parentMatrix}),newBounds=new T.Box3().setFromObject(current.group),difference=Math.max(...oldBounds.min.toArray().map((v,k)=>Math.abs(v-newBounds.min.getComponent(k))),...oldBounds.max.toArray().map((v,k)=>Math.abs(v-newBounds.max.getComponent(k))));
if(difference>1e-5)throw Error('Outer envelope changed '+difference);
let minVolume=Infinity,triangles=0;
for(const g of current.prototypes){
 const p=g.attributes.position,ix=g.index,ids=[],weld=new Map(),edges=new Map();let volume=0;
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(':');if(!weld.has(key))weld.set(key,weld.size);ids.push(weld.get(key));}
 for(let i=0;i<(ix?.count??p.count);i+=3){
  const v=[0,1,2].map(j=>ix?ix.getX(i+j):i+j),ws=v.map(k=>ids[k]);if(new Set(ws).size<3)continue;const ps=v.map(k=>new T.Vector3().fromBufferAttribute(p,k));volume+=ps[0].dot(ps[1].clone().cross(ps[2]))/6;
  for(let j=0;j<3;j++){const a=ws[j],b=ws[(j+1)%3],key=a<b?a+':'+b:b+':'+a;edges.set(key,(edges.get(key)||0)+1);}
 }
 const bad=[...edges.values()].filter(v=>v!==2).length;
 if(bad||volume<=0||!Array.from(p.array).every(Number.isFinite))throw Error(JSON.stringify({bad,volume,triangles:(ix?.count??p.count)/3}));
 minVolume=Math.min(minVolume,volume);triangles+=(ix?.count??p.count)/3;
}
const receipt={status:'actual-lantern-solids-and-envelope-audited',baseCommit:'cedb249',parts:current.prototypes.length,mergedMeshes:current.group.children.length,closedAfterSpatialWeld:true,nonmanifoldEdges:0,allFinitePositiveVolume:true,minVolumeM3:minVolume,triangles,oldWorldBounds:{min:oldBounds.min.toArray(),max:oldBounds.max.toArray()},newWorldBounds:{min:newBounds.min.toArray(),max:newBounds.max.toArray()},maximumEnvelopeDifferenceMetres:difference,worldAnchor:current.info.worldAnchor,localBounds:current.info.localBounds,lightsAdded:0,originalGlowMaterialRetained:true,visualAccepted:false};
await writeFile(new URL('./geometry-receipt.json',import.meta.url),JSON.stringify(receipt,null,2));
console.log(JSON.stringify({parts:receipt.parts,meshes:receipt.mergedMeshes,closed:true,triangles,envelopeDifference:difference,anchor:receipt.worldAnchor}));
