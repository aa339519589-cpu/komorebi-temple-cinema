// Bounded closed-solid inspection of the new end fitting, not a test suite.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../../..'),three=pathToFileURL(resolve(root,'vendor/build/three.module.js')).href;
let util=await readFile(resolve(root,'vendor/examples/jsm/utils/BufferGeometryUtils.js'),'utf8');util=util.replace(/from 'three'/g,`from '${three}'`);
const utils='data:text/javascript;base64,'+Buffer.from(util).toString('base64');
const path=resolve(root,'reconstructions/scene-05/src/rafter-end-copper.js'),raw=await readFile(path,'utf8');
const source=raw.replace("from 'three'",`from '${three}'`).replace("from 'three/addons/utils/BufferGeometryUtils.js'",`from '${utils}'`);
const factory=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function inspect(g){
 const p=g.attributes.position,points=new Map(),weld=[],edges=new Map();let finite=true,collapsed=0;
 for(let i=0;i<p.count;i++){const xyz=[p.getX(i),p.getY(i),p.getZ(i)];finite&&=xyz.every(Number.isFinite);const key=xyz.map(v=>Math.round(v*1e6)).join(',');if(!points.has(key))points.set(key,points.size);weld.push(points.get(key));}
 const n=g.index?.count??p.count;
 for(let i=0;i<n;i+=3){const ids=[0,1,2].map(k=>weld[g.index?g.index.getX(i+k):i+k]);if(new Set(ids).size<3){collapsed++;continue;}for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],key=a<b?`${a},${b}`:`${b},${a}`;edges.set(key,(edges.get(key)??0)+1);}}
 g.computeBoundingBox();return {finite,triangles:n/3,weldedVertices:points.size,collapsedTrianglesAfterWeld:collapsed,boundaryEdges:[...edges.values()].filter(n=>n===1).length,nonmanifoldEdges:[...edges.values()].filter(n=>n>2).length,bounds:{min:g.boundingBox.min.toArray(),max:g.boundingBox.max.toArray()}};
}
const details={};
for(const detail of['full','small']){const fitting=factory.createRafterEndCopper({detail});details[detail]=fitting.parts.map(p=>({material:p.material,...inspect(p.geometry)}));fitting.dispose();}
const receipt={candidate:'mesh72',status:'new-solid-topology-inspected-not-visually-accepted',source:'reconstructions/scene-05/src/rafter-end-copper.js',sourceSha256:createHash('sha256').update(raw).digest('hex'),weldTolerance:1e-6,details,referencePhotographTexture:false,depthFromPhoto:false,scope:'Only new closed copper sleeves and broad cast petals/volutes; no scene-wide suite or movie.',visualAccepted:false};
await writeFile(new URL('./solid-receipt.json',import.meta.url),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(details).map(([k,ps])=>[k,{triangles:ps.reduce((s,p)=>s+p.triangles,0),finite:ps.every(p=>p.finite),boundaryEdges:ps.reduce((s,p)=>s+p.boundaryEdges,0),nonmanifoldEdges:ps.reduce((s,p)=>s+p.nonmanifoldEdges,0)}]))));
