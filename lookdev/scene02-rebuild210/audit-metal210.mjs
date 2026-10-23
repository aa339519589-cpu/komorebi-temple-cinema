import {T,Builder,materials} from '../../reconstructions/scene-02/kernel.js';
import {createRailFinial210,createHangingLantern210} from '../../reconstructions/scene-02/veranda-metal210.js';
import {layout} from '../../reconstructions/scene-02/layout117.js';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
import {writeFile} from 'node:fs/promises';
const {mats}=materials(),b=new Builder(mats),finial=createRailFinial210(b),fixture=createHangingLantern210({b,mats});
finial.place();for(const lamp of layout.hangingLamps)fixture.lantern(...lamp.position,lamp.scale,9.3);
function audit(g){
 const p=g.attributes.position,ix=g.index?.array??Array.from({length:p.count},(_,i)=>i),edges=new Map();let signedVolume=0,degenerate=0;
 const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e7)).join(',');
 for(let j=0;j<ix.length;j+=3){const ids=Array.from(ix.slice(j,j+3)),[a,c,d]=ids.map(i=>new T.Vector3().fromBufferAttribute(p,i));
  if(c.clone().sub(a).cross(d.clone().sub(a)).lengthSq()<1e-25)degenerate++;
  signedVolume+=a.dot(c.clone().cross(d))/6;
  const q=ids.map(key);for(let k=0;k<3;k++){const a=q[k],c=q[(k+1)%3],s=a<c?a+'|'+c:c+'|'+a,v=edges.get(s)??{count:0,balance:0};v.count++;v.balance+=a<c?1:-1;edges.set(s,v);}
 }
 return{name:g.name,vertices:p.count,triangles:ix.length/3,finite:Array.from(p.array).every(Number.isFinite),signedVolume,degenerate,boundaryOrNonmanifold:[...edges.values()].filter(e=>e.count!==2).length,inconsistentWinding:[...edges.values()].filter(e=>e.count===2&&e.balance!==0).length};
}
const named=[...new Set([...b.buckets.values()].map(k=>k.g))].filter(g=>g.name.startsWith('scene02-')),geometries=named.map(audit),failed=geometries.filter(g=>!g.finite||g.signedVolume<=0||g.degenerate||g.boundaryOrNonmanifold||g.inconsistentWinding);
const source=await reconstructionSourceIdentity(process.cwd(),'02'),iteration=process.env.ITERATION??'r05';
const report={source,iteration,scope:'CPU topology of authored turned finial, solid hex roof, perforated casting, crown and bowl. Decorative tube endpoints are outside this closed-casting assertion. Geometry-only validation is not visual acceptance.',finial:finial.stats,fixture:fixture.stats,geometries,failed,contacts:{postCastingSeatMetres:.905,postCapTopMetres:.905,facetRecessMetres:.077,frameToRoofOverlapMetres:.02,chainCrownTopLocalY:1.09,chainFirstLinkLocalY:1.09,ceilingAnchorWorldY:9.3},visualAccepted:false};
await writeFile(`lookdev/scene02-rebuild210/geometry-metal210-${iteration}.json`,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({sourceHash:source.hash,geometries,failed}));if(failed.length)process.exitCode=1;
