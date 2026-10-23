import * as T from 'three';
import {Builder,materialSet} from '../../reconstructions/scene-01/src/kernel.js';
import {buildBridge208,buildCourt208,PLAN208} from '../../reconstructions/scene-01/src/bridge-court208.js';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
import {writeFile} from 'node:fs/promises';

const B=new Builder(materialSet());buildBridge208(B);buildCourt208(B);
function audit(g){
 const p=g.attributes.position,index=g.index?.array??Array.from({length:p.count},(_,i)=>i),edges=new Map(),key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(',');let volume=0,degenerate=0,finite=true;
 for(const v of p.array)finite&&=Number.isFinite(v);
 for(let j=0;j<index.length;j+=3){const ids=Array.from(index.slice(j,j+3)),[a,b,c]=ids.map(i=>new T.Vector3().fromBufferAttribute(p,i));if(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()<1e-24)degenerate++;volume+=a.dot(b.clone().cross(c))/6;const q=ids.map(key);for(let k=0;k<3;k++){const a=q[k],b=q[(k+1)%3],key=a<b?a+'|'+b:b+'|'+a,v=edges.get(key)??{count:0,balance:0};v.count++;v.balance+=a<b?1:-1;edges.set(key,v);}}
 return{name:g.name,vertices:p.count,triangles:index.length/3,finite,signedVolume:volume,degenerate,boundaryOrNonmanifoldEdges:[...edges.values()].filter(v=>v.count!==2).length,opposedEdgePairs:[...edges.values()].filter(v=>v.count===2&&v.balance!==0).length};
}
const geometries=[...new Set([...B.buckets.values()].map(b=>b.g))].filter(g=>g.name.startsWith('structure208-')).map(audit),failed=geometries.filter(g=>!g.finite||g.signedVolume<=0||g.degenerate||g.boundaryOrNonmanifoldEdges||g.opposedEdgePairs);
const iteration=process.env.ITERATION??'r01',source=await reconstructionSourceIdentity(process.cwd(),'01'),report={iteration,source,scope:'Actual scene01 bridge, fitted timber bearings, masonry route and forecourt topology; these checks do not prove photographic fidelity.',visualAccepted:false,plan:PLAN208,geometries,failed};
await writeFile(`lookdev/scene01-structure208/geometry208-${iteration}.json`,JSON.stringify(report,null,2),{flag:'wx'});
console.log(JSON.stringify({sourceHash:source.hash,geometries:geometries.length,failed}));if(failed.length)process.exitCode=1;
