// Read-only runtime geometry validation. No browser, scene capture, renderer,
// mesh binary export, UV bake, Blender or GPU compute is used here.
import {registerHooks} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
const vendor=fileURLToPath(new URL('../../vendor/',import.meta.url));
registerHooks({resolve(s,c,next){if(s==='three')return{url:pathToFileURL(vendor+'build/three.module.js').href,shortCircuit:true};if(s.startsWith('three/addons/'))return{url:pathToFileURL(vendor+'examples/jsm/'+s.slice(13)).href,shortCircuit:true};return next(s,c);}});
const candidate=resolve(process.argv[2]||'candidate-r05');
const{createBearingBoot361,createCeramicCap361}=await import(pathToFileURL(resolve(candidate,'reconstructions/scene-05/src/eave-craft361.js')).href);
function audit(g){
 const p=g.attributes.position,ix=g.index,N=ix?.count??p.count,I=i=>ix?ix.getX(i):i,P=i=>[p.getX(i),p.getY(i),p.getZ(i)],K=i=>P(i).map(v=>Math.round(v*1e7)).join(':'),edges=new Map();let volume=0,collapsed=0;
 for(let j=0;j<N;j+=3){const v=[I(j),I(j+1),I(j+2)],k=v.map(K);if(new Set(k).size<3){collapsed++;continue;}const[a,b,c]=v.map(P);volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
  for(let n=0;n<3;n++){const a=k[n],b=k[(n+1)%3],key=a<b?a+'|'+b:b+'|'+a;if(!edges.has(key))edges.set(key,{count:0,winding:0});const e=edges.get(key);e.count++;e.winding+=a<b?1:-1;}}
 return{triangles:N/3,finite:Array.from(p.array).every(Number.isFinite),signedVolume:volume,boundaryEdges:[...edges.values()].filter(e=>e.count!==2).length,inconsistentEdges:[...edges.values()].filter(e=>e.winding!==0).length,collapsedTriangles:collapsed};
}
const{createSculptedJoinery}=await import(pathToFileURL(resolve(candidate,'reconstructions/scene-05/src/sculpted-joinery.js')).href);
const joinery=createSculptedJoinery(),blocks=[...new Set([...joinery.bracket,...joinery.cornerFan,...joinery.waistBearing].map(p=>p.geometry).filter(g=>g.userData.bearingBlock?.kind==='closed-smooth-coved-clipped-square-dou361'))],blockAudits=blocks.map(g=>({...audit(g),section:g.userData.bearingBlock}));
const boot=createBearingBoot361(),ceramic=createCeramicCap361(),identity=await reconstructionSourceIdentity(candidate,'05');
const result={source:identity.hash,candidate,scope:'Read-only pure Node validation of the runtime constructors; no capture, export, baking, binary authoring or Blender',boot:{info:boot.info,solids:boot.audit},douReceivers:blockAudits,ceramic:Object.fromEntries(Object.entries(ceramic).filter(([k,v])=>v?.isBufferGeometry).map(([k,g])=>[k,audit(g)]))};
result.valid=blockAudits.every(g=>g.finite&&g.signedVolume>0&&g.boundaryEdges===0&&g.inconsistentEdges===0&&g.collapsedTriangles===0)&&boot.info.finite&&boot.info.positiveVolume&&Object.values(boot.info.topology).every(n=>n===0)&&Object.values(result.ceramic).every(g=>g.finite&&g.signedVolume>0&&g.boundaryEdges===0&&g.inconsistentEdges===0&&g.collapsedTriangles===0);
await writeFile(process.argv[3]||'r05-geometry-validation.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({valid:result.valid,source:result.source,boot:boot.info,ceramic:result.ceramic},null,2));
joinery.dispose();boot.dispose();Object.values(ceramic).filter(g=>g?.isBufferGeometry).forEach(g=>g.dispose());if(!result.valid)process.exitCode=1;
