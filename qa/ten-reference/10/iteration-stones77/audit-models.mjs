import * as T from '../../../../vendor/build/three.module.js';
import {nearRainStoneProfiles,createNearRainFlagstone,createNearJointBed} from './source/near-rain-stones.js';
import {clipPavingAtDrain} from './source/paving-mask.js';
import {writeFile} from 'node:fs/promises';
let seed=1037;
const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296},R=(a,b)=>a+(b-a)*rand();
// The unchanged main.js consumes these draws before its node layout: 323 hall
// plinth stones, 96 main-hall tassels, 28 bridge-pier courses, 9 stairs,
// 10 return steps, 24 near-lantern tassels, and 65,536 old bump texels.
for(let n=0;n<66026;n++)rand();
const rows=26,cols=8,verts=[];
for(let j=0;j<=rows;j++){verts[j]=[];for(let i=0;i<=cols;i++){const t=j/rows,left=-3.9-.65*t,right=1.6+2.81*t;verts[j][i]=[left+(right-left)*i/cols+(i&&i<cols?R(-.13,.13):0),-2+j*.82+(j&&j<rows?R(-.14,.14):0)];}}
function topology(g){
 const p=g.attributes.position,edges=new Map();let volume=0,degenerate=0;
 const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e6)).join(',');
 for(let i=0;i<p.count;i+=3){
  const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2);
  if(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()<1e-20)degenerate++;
  volume+=a.dot(b.clone().cross(c))/6;
  for(let k=0;k<3;k++){const a=key(i+k),b=key(i+(k+1)%3);if(a===b)continue;const id=a<b?a+'|'+b:b+'|'+a,e=edges.get(id)||{uses:0,balance:0};e.uses++;e.balance+=a<b?1:-1;edges.set(id,e);}
 }
 return{triangles:p.count/3,openEdges:[...edges.values()].filter(x=>x.uses===1).length,nonManifoldEdges:[...edges.values()].filter(x=>x.uses>2).length,edgeUsesNotTwo:[...edges.values()].filter(x=>x.uses!==2).length,inconsistentEdgeOrientation:[...edges.values()].filter(x=>x.balance!==0).length,degenerateTriangles:degenerate,signedVolumeCubicMetres:volume};
}
const stones=[];
for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
 const slabSeed=seed,id=j+':'+i,original=[verts[j][i],verts[j][i+1],verts[j+1][i+1],verts[j+1][i]],topOffset=R(-.005,.005);R(.74,1.13);
 for(const points of clipPavingAtDrain(original)){
  const cx=points.reduce((a,p)=>a+p[0],0)/points.length,cz=points.reduce((a,p)=>a+p[1],0)/points.length,chipped=[];
  points.forEach((p,k)=>{const next=points[(k+1)%points.length];for(let n=0;n<5;n++){const t=n/5;let x=p[0]*(1-t)+next[0]*t,z=p[1]*(1-t)+next[1]*t;x+=(cx-x)*.013+R(-.006,.006);z+=(cz-z)*.013+R(-.006,.006);chipped.push([x,z]);}});
  if(nearRainStoneProfiles[id]){
   const g=createNearRainFlagstone(T,{points:chipped,topOffset,seed:j*97+i*37+1037,id}),bed=createNearJointBed(T,{points:original,seed:j*97+i*37+1037});
   stones.push({model:g.userData.nearRainStone,topology:topology(g),bed:topology(bed),bedScope:bed.userData.nearJointBed});g.dispose();bed.dispose();
  }
 }
 seed=slabSeed;for(let k=0;k<42;k++)rand();
}
const output={scope:'Direct asset topology / dimension audit. No GPU image, unit suite, film, or photographic-fidelity assertion.',stones,visualAccepted:false};
await writeFile(new URL('./geometry-audit.json',import.meta.url),JSON.stringify(output,null,2));
console.log(JSON.stringify({stones:stones.length,triangles:stones.reduce((n,s)=>n+s.topology.triangles,0),badEdges:stones.reduce((n,s)=>n+s.topology.edgeUsesNotTwo+s.bed.edgeUsesNotTwo,0),badOrientation:stones.reduce((n,s)=>n+s.topology.inconsistentEdgeOrientation+s.bed.inconsistentEdgeOrientation,0),negativeVolumes:stones.filter(s=>s.topology.signedVolumeCubicMetres<=0||s.bed.signedVolumeCubicMetres<=0).length}));
