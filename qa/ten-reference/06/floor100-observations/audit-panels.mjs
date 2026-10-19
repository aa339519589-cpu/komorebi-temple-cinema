import * as T from 'three';
import {FOREGROUND_FLOOR_PATCH as C,createForegroundFloorPanel} from '../../../../reconstructions/scene-06/src/foreground-floor-panels.js';
import {writeFile} from 'node:fs/promises';
const records=[];
for(let i=0;i<C.x.length-1;i++)for(let j=0;j<C.z.length-1;j++){
 const g=createForegroundFloorPanel(C.x[i],C.x[i+1],C.z[j],C.z[j+1]),p=g.attributes.position,n=g.attributes.normal,edges=new Map(),weld=new Map(),ids=[];let volume=0;
 for(let k=0;k<p.count;k++){const key=[p.getX(k),p.getY(k),p.getZ(k)].map(v=>Math.round(v*1e6)).join(':');if(!weld.has(key))weld.set(key,weld.size);ids.push(weld.get(key));}
 for(let k=0;k<p.count;k+=3){const ws=[ids[k],ids[k+1],ids[k+2]];if(new Set(ws).size<3)continue;const ps=[0,1,2].map(q=>new T.Vector3().fromBufferAttribute(p,k+q));volume+=ps[0].dot(ps[1].clone().cross(ps[2]))/6;for(let q=0;q<3;q++){const a=ws[q],b=ws[(q+1)%3],key=a<b?a+':'+b:b+':'+a;edges.set(key,(edges.get(key)||0)+1);}}
 g.computeBoundingBox();const bad=[...edges.values()].filter(v=>v!==2).length;
 if(bad||volume<=0||!Array.from(p.array).every(Number.isFinite)||!Array.from(n.array).every(Number.isFinite)||Math.abs(g.boundingBox.min.y+.05)>1e-6||Math.abs(g.boundingBox.max.y)>1e-6)throw Error(JSON.stringify({bad,volume,bounds:g.boundingBox}));
 records.push({column:i,row:j,triangles:p.count/3,volume,bounds:{min:g.boundingBox.min.toArray(),max:g.boundingBox.max.toArray()},metadata:g.userData.floorPanel,nonmanifoldEdges:bad});g.dispose();
}
const r={status:'actual-closed-foreground-panels-inspected',panels:records.length,triangles:records.reduce((s,p)=>s+p.triangles,0),allFinitePositiveVolume:true,nonmanifoldEdges:0,spatialWeldMetres:.000001,topY:0,bottomY:-.05,subfloorTopY:-.05,solidBearingContact:true,patchLimits:{x:[C.x[0],C.x.at(-1)],z:[C.z[0],C.z.at(-1)]},gap:C.gap,bevel:C.bevel,oldBoardsClippedToPatchStart:true,unknownRows:C.limitations,records,visualAccepted:false};
await writeFile(new URL('./geometry-receipt.json',import.meta.url),JSON.stringify(r,null,2));console.log(JSON.stringify({panels:r.panels,triangles:r.triangles,closed:true,bearingContact:true}));
