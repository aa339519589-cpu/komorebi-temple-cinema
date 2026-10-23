import{readFile,writeFile}from'node:fs/promises';
import{resolve}from'node:path';
import{pathToFileURL}from'node:url';
import{createHash}from'node:crypto';
import*as T from'../../vendor/build/three.module.js';

const root=resolve(import.meta.dirname,'../..'),path=resolve(root,process.argv[3]||'reconstructions/scene-09/src/court-rebuild221.js');
const source=await readFile(path,'utf8'),sourceSha256=createHash('sha256').update(source).digest('hex'),code=source.replace("from 'three'",`from '${pathToFileURL(resolve(root,'vendor/build/three.module.js')).href}'`).replace("from './hall-envelope143.js'",`from '${pathToFileURL(resolve(root,'reconstructions/scene-09/src/hall-envelope143.js')).href}'`);
const{buildMasonryGardenBridge221}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const materials={},owned=[],meshes=[],boxes=[];
for(const key of['cutStone','bridgeDeck','bridgeTimber','bridgeRed','bronze','gold'])materials[key]=new T.MeshPhysicalMaterial({name:key,roughness:.7});
const info=buildMasonryGardenBridge221({materials,emit(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0){meshes.push({g,m,x,y,z,sx,sy,sz,rot});},box(...a){boxes.push(a);},between(){},lantern(){}},owned);
const records=[];
for(const{g,m}of meshes){
 const p=g.attributes.position,ix=g.index,uv=g.attributes.uv,vertices=new Map(),canonical=[],edges=new Map();let finite=true,zeroArea=0,collapsedUVTriangles=0;
 for(let i=0;i<p.count;i++){
  const q=[p.getX(i),p.getY(i),p.getZ(i)];if(q.some(x=>!Number.isFinite(x)))finite=false;
  const k=q.map(x=>Math.round(x*1e6)).join(',');if(!vertices.has(k))vertices.set(k,vertices.size);canonical[i]=vertices.get(k);
 }
 for(let j=0;j<(ix?.count??p.count);j+=3){
  const ids=[0,1,2].map(k=>ix?ix.getX(j+k):j+k),a=new T.Vector3().fromBufferAttribute(p,ids[0]),b=new T.Vector3().fromBufferAttribute(p,ids[1]),c=new T.Vector3().fromBufferAttribute(p,ids[2]);
  if(b.sub(a).cross(c.sub(a)).lengthSq()<1e-16)zeroArea++;
  if(uv){const[a,b,c]=ids,det=(uv.getX(b)-uv.getX(a))*(uv.getY(c)-uv.getY(a))-(uv.getY(b)-uv.getY(a))*(uv.getX(c)-uv.getX(a));if(Math.abs(det)<1e-12)collapsedUVTriangles++;}
  for(let k=0;k<3;k++){const a=canonical[ids[k]],b=canonical[ids[(k+1)%3]],key=a<b?a+':'+b:b+':'+a;edges.set(key,(edges.get(key)||0)+1);}
 }
 const boundaryEdges=[...edges.values()].filter(n=>n===1).length,nonmanifoldEdges=[...edges.values()].filter(n=>n!==2).length;
 g.computeBoundingBox();records.push({geometry:g.name,solidParts:g.userData.solidParts||1,material:m.name,vertices:p.count,triangles:(ix?.count??p.count)/3,finite,zeroArea,collapsedUVTriangles,boundaryEdges,nonmanifoldEdges,bounds:[g.boundingBox.min.toArray(),g.boundingBox.max.toArray()]});
}
const stones=records.filter(r=>r.geometry.startsWith('scene09-221-closed-masonry-arch-voussoir')),rails=records.filter(r=>r.geometry==='scene09-221-closed-arched-vermilion-rail');
const result={scope:'Pure CPU evaluation of the exact authored bridge source. No renderer, scene capture, export or GPU.',source:path,geometry:info,stoneMeshes:stones.length,railMeshes:rails.length,allFinite:records.every(r=>r.finite),allStoneManifold:stones.every(r=>r.zeroArea===0&&r.boundaryEdges===0&&r.nonmanifoldEdges===0),allRailsClosed:rails.every(r=>r.boundaryEdges===0),centralMasonryPierBoxes:boxes.filter(b=>b[6]?.name==='scene09-221-wet-cut-granite-arch'&&Math.abs(b[0])<7.5).length,stoneMinimumY:Math.min(...stones.map(r=>r.bounds[0][1])),nativeRenderRequired:true,visualAccepted:false};
result.sourceSha256=sourceSha256;
result.stoneCollapsedUVTriangles=stones.reduce((n,r)=>n+r.collapsedUVTriangles,0);
result.stoneChartsNoncollapsed=result.stoneCollapsedUVTriangles===0;
if(!result.allFinite||!result.allStoneManifold||!result.allRailsClosed||result.centralMasonryPierBoxes)throw Error(JSON.stringify(result));
await writeFile(resolve(import.meta.dirname,(process.argv[2]||'r01')+'-bridge-geometry-proof.json'),JSON.stringify({...result,records},null,2));
console.log(JSON.stringify(result));
