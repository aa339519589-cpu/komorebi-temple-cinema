import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const base=resolve('reconstructions/scene-03/src'),three=pathToFileURL(resolve('vendor/build/three.module.js')).href,T=await import(three);
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const rafters=url((await readFile(resolve(base,'scene03-curved-rafter.js'),'utf8')).replace("'three'",JSON.stringify(three)));
const src=(await readFile(resolve(base,'scene03-bearing174.js'),'utf8')).replace("'./scene03-curved-rafter.js'",JSON.stringify(rafters));
const {createBearing174}=await import(url(src)),bearing=createBearing174(T,{emit(){},grouped(){},keep:g=>g});
const roof=await import(url((await readFile(resolve(base,'scene03-roof-solids.js'),'utf8')).replace("'three'",JSON.stringify(three))));
const fixtures=[...bearing.prototypes,roof.createClosedRidge174([[-.7,.1,-.7],[0,.28,0],[.7,.55,.7]])];
function audit(g){const p=g.attributes.position,idx=g.index?.array??Array.from({length:p.count},(_,i)=>i),quant=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(','),edges=new Map();let volume=0,degenerate=0,finite=true;for(let i=0;i<p.array.length;i++)finite&&=Number.isFinite(p.array[i]);for(let i=0;i<idx.length;i+=3){const ids=Array.from(idx.slice(i,i+3)),a=new T.Vector3().fromBufferAttribute(p,ids[0]),b=new T.Vector3().fromBufferAttribute(p,ids[1]),c=new T.Vector3().fromBufferAttribute(p,ids[2]);volume+=a.dot(b.clone().cross(c))/6;if(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()<1e-19){degenerate++;continue;}const qs=ids.map(quant);for(let k=0;k<3;k++){const a=qs[k],b=qs[(k+1)%3],key=a<b?a+'|'+b:b+'|'+a;edges.set(key,(edges.get(key)??0)+1);}}return{name:g.name,vertices:p.count,triangles:idx.length/3,finite,signedVolume:volume,degenerate,nonmanifoldEdges:[...edges.values()].filter(v=>v!==2).length};}
const report={scope:'Actual authored prototype topology validity only; no photographic acceptance claim',visualAccepted:false,prototypes:fixtures.map(audit)};await writeFile('lookdev/scene03-mass174/geometry174-'+(process.env.ITERATION??'r01')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(report.prototypes.some(x=>!x.finite||x.signedVolume<=0||x.nonmanifoldEdges))process.exitCode=1;
