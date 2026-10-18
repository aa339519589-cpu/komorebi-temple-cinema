// Bounded mesh inspection, not a scene/test suite or visual acceptance.
import {readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../../..');
async function moduleAt(name,directory='reconstructions/scene-08/src'){
 const s=await readFile(resolve(root,directory,name),'utf8');
 const source=s.replace("from 'three'",`from '${pathToFileURL(resolve(root,'vendor/build/three.module.js')).href}'`);
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const joinery=await moduleAt('gallery-joinery.js'),hardware=await moduleAt('gate-hardware.js');
const previous=await moduleAt('gallery-joinery.js','qa/ten-reference/08/mesh68-source');
function inspect(g){
 const p=g.attributes.position,remap=[],welded=new Map();let finite=true;
 for(let i=0;i<p.count;i++){
  const xyz=[p.getX(i),p.getY(i),p.getZ(i)];finite&&=xyz.every(Number.isFinite);
  const k=xyz.map(x=>Math.round(x*1e5)).join(',');if(!welded.has(k))welded.set(k,welded.size);remap.push(welded.get(k));
 }
 const edges=new Map(),n=g.index?.count??p.count;let degenerate=0;
 for(let i=0;i<n;i+=3){
  const ids=[0,1,2].map(k=>remap[g.index?g.index.getX(i+k):i+k]);
  if(new Set(ids).size<3){degenerate++;continue;}
  for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],key=a<b?`${a},${b}`:`${b},${a}`;edges.set(key,(edges.get(key)??0)+1);}
 }
 return {finite,vertices:p.count,weldedVertices:welded.size,triangles:n/3,collapsedTrianglesAfterWeld:degenerate,boundaryEdges:[...edges.values()].filter(x=>x===1).length,nonmanifoldEdges:[...edges.values()].filter(x=>x>2).length};
}
const kit=joinery.createGalleryCurvedJoinery();
const priorKit=previous.createGalleryCurvedJoinery();
function geometryHash(g){const hash=createHash('sha256');for(const a of[g.attributes.position.array,g.index?.array].filter(Boolean))hash.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));return hash.digest('hex');}
const sets={
 leftGalleryCurvedJoinery:kit.parts.map(p=>p.geometry),
 continuousRafter:[joinery.createContinuousTimber([[0,0,0],[0,-.3,1],[0,-.35,2],[0,-.1,3]],.075,.12,.009)],
 closedClayCover:[joinery.createClayCoverTile()],
 castSidePlaque:hardware.createGatePlaque(.42,.58).map(p=>p.geometry),
 columnShoe:hardware.createGateColumnShoe(.61,.64,.24).map(p=>p.geometry)
};
const groups=Object.fromEntries(Object.entries(sets).map(([name,gs])=>{const parts=gs.map(inspect);return[name,{parts:parts.length,finite:parts.every(p=>p.finite),boundaryEdges:parts.reduce((a,p)=>a+p.boundaryEdges,0),nonmanifoldEdges:parts.reduce((a,p)=>a+p.nonmanifoldEdges,0),triangles:parts.reduce((a,p)=>a+p.triangles,0),partInspections:parts}];}));
const receipt={candidate:'mesh70',status:'topology-inspected-not-visually-accepted',weldTolerance:1e-5,scope:'New local solid parts; no scene-wide test suite, performance test or movie run.',groups,geometryMatchesFirstNativeMesh68:kit.parts.length===priorKit.parts.length&&kit.parts.every((p,i)=>geometryHash(p.geometry)===geometryHash(priorKit.parts[i].geometry)),woodMaterialChangeSinceMesh68:'red -> redlight; closed member geometry unchanged',photographicTexturesUsedForModeling:false,photoDepth:false,visualAccepted:false};
await writeFile(new URL('./solid-receipt.json',import.meta.url),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(groups).map(([name,g])=>[name,{parts:g.parts,finite:g.finite,boundaryEdges:g.boundaryEdges,nonmanifoldEdges:g.nonmanifoldEdges,triangles:g.triangles}]))));
for(const gs of Object.values(sets))for(const g of gs)g.dispose();
