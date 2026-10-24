import {registerHooks} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),repo=resolve(root,'../..');
registerHooks({resolve(specifier,context,next){if(specifier==='three')return next(pathToFileURL(resolve(repo,'vendor/build/three.module.js')).href,context);return next(specifier,context);}});
const {createDragonPeonyGeometry224}=await import(pathToFileURL(resolve(root,'candidate-root/reconstructions/scene-06/src/ornament224.js')).href);
const scalar=new Uint8Array(readFileSync(resolve(root,'candidate-root/reconstructions/scene-06/assets/ornament224-r01/dragon-peony-height.gray8.bin')));
const g=createDragonPeonyGeometry224({width:1.584,height:.23763,depth:.041,back:.006,mirror:-1,scalar}),p=g.attributes.position,ix=g.index,n=g.attributes.normal,edges=new Map();let nonfinite=0,volume=0,degenerate=0,negativeCornerNormals=0,minNormalDot=1;
for(const a of [p.array,n.array])for(const v of a)if(!Number.isFinite(v))nonfinite++;
for(let t=0;t<ix.count;t+=3){
 const ids=[ix.getX(t),ix.getX(t+1),ix.getX(t+2)],a=ids[0],b=ids[1],c=ids[2],ax=p.getX(a),ay=p.getY(a),az=p.getZ(a),bx=p.getX(b),by=p.getY(b),bz=p.getZ(b),cx=p.getX(c),cy=p.getY(c),cz=p.getZ(c),nx=(by-ay)*(cz-az)-(bz-az)*(cy-ay),ny=(bz-az)*(cx-ax)-(bx-ax)*(cz-az),nz=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax),l=Math.hypot(nx,ny,nz);
 if(l<1e-16)degenerate++;
 else for(const i of ids){const dot=(nx*n.getX(i)+ny*n.getY(i)+nz*n.getZ(i))/l;minNormalDot=Math.min(dot,minNormalDot);if(dot<=1e-6)negativeCornerNormals++;}
 volume+=(ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx))/6;
 for(const[u,v]of [[a,b],[b,c],[c,a]]){const key=Math.min(u,v)*p.count+Math.max(u,v),e=edges.get(key)||[0,0];e[0]++;e[1]+=u<v?1:-1;edges.set(key,e);}
}
let boundaryEdges=0,nonmanifoldEdges=0,windingConflicts=0;
for(const[count,balance]of edges.values()){if(count===1)boundaryEdges++;if(count!==2)nonmanifoldEdges++;if(balance!==0)windingConflicts++;}
const report={scope:'Pure CPU authored geometry audit; no render, GPU or image export',mesh:g.userData,vertices:p.count,triangles:ix.count/3,nonfinite,degenerate,boundaryEdges,nonmanifoldEdges,windingConflicts,signedVolume:volume,negativeCornerNormalsBeforeFinalBuilderRepair:negativeCornerNormals,minNormalDot,bounds:[g.boundingBox.min.toArray(),g.boundingBox.max.toArray()],closedOrientedTopology:!nonfinite&&!degenerate&&!boundaryEdges&&!nonmanifoldEdges&&!windingConflicts&&volume>0,photographicAccepted:false};
writeFileSync(resolve(root,'r01-cpu-geometry-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
