import * as T from 'three';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
import {writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

// CPU-only measurement of the exact authored source geometry; no browser,
// graphics context, viewport, export, baking or image rendering is created.
const sourceFolder=resolve(process.env.SOURCE_FOLDER??'reconstructions/scene-01/src'),sourceUrl=pathToFileURL(sourceFolder+'/'),[{Builder,materialSet},{buildStoneLantern219}]=await Promise.all([import(new URL('kernel.js',sourceUrl)),import(new URL('stone-lantern219.js',sourceUrl))]);
const B=new Builder(materialSet()),info=buildStoneLantern219(B);
function audit(g){
 const p=g.attributes.position,ix=g.index?.array??Array.from({length:p.count},(_,i)=>i),edges=new Map();let volume=0,degenerate=0,finite=true;
 for(const v of p.array)finite&&=Number.isFinite(v);
 const id=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(',');
 for(let k=0;k<ix.length;k+=3){const ids=Array.from(ix.slice(k,k+3)),[a,b,c]=ids.map(i=>new T.Vector3().fromBufferAttribute(p,i));if(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()<1e-22){degenerate++;continue;}volume+=a.dot(b.clone().cross(c))/6;const q=ids.map(id);for(let j=0;j<3;j++){const a=q[j],b=q[(j+1)%3],key=a<b?a+'|'+b:b+'|'+a,v=edges.get(key)??{count:0,balance:0};v.count++;v.balance+=a<b?1:-1;edges.set(key,v);}}
 g.computeBoundingBox();return{name:g.name,vertices:p.count,triangles:ix.length/3,finite,signedVolume:volume,degenerate,boundaryOrNonmanifoldEdges:[...edges.values()].filter(e=>e.count!==2).length,unopposedPairs:[...edges.values()].filter(e=>e.count===2&&e.balance!==0).length,bounds:[g.boundingBox.min.toArray(),g.boundingBox.max.toArray()]};
}
const shapes=[...new Set([...B.buckets.values()].map(b=>b.g))].filter(g=>/lantern219-(?:rounded|firebox-deep|lobed|thick-closed|closed-moss|closed-overlapping)/.test(g.name)).map(audit),source=process.env.SOURCE_FOLDER?null:await reconstructionSourceIdentity(process.cwd(),'01'),moduleSha256=createHash('sha256').update(await readFile(resolve(sourceFolder,'stone-lantern219.js'))).digest('hex'),report={sourceHash:source?.hash??null,auditedSourceFolder:sourceFolder,auditedModuleSha256:moduleSha256,createdAt:new Date().toISOString(),scope:'Exact219 authored stone solids and attached closed moss skin, inspected by CPU topology/bounds only; no render and no proof of photographic fidelity.',visualAccepted:false,info,shapes};
await writeFile(`lookdev/scene01-rebuild219/geometry219-${process.env.ITERATION??'r04'}.json`,JSON.stringify(report,null,2),{flag:'wx'});
console.log(JSON.stringify({sourceHash:source?.hash??null,auditedModuleSha256:moduleSha256,shapes}));
