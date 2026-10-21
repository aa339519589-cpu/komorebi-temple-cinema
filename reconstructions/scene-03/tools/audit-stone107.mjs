import {writeFile,mkdir,readFile} from 'node:fs/promises';
import * as T from 'three';
import {createFracturedStone107,createKeyedScanBearing107} from '../src/scene03-fractured-stone107.js';
import {createRestorationLotusLeaf} from '../src/restoration-lotus-leaf.js';
import {createRestorationLotusPetal} from '../src/restoration-lotus-petal.js';
import {createRootedLotusStem107} from '../src/scene03-lotus-stem107.js';
function audit(g){
 const p=g.attributes.position,idx=g.index,edges=new Map(),directed=new Map(),key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(','),N=idx?idx.count:p.count;let volume=0,invalid=0,degenerate=0;
 for(let t=0;t<N;t+=3){const ids=[0,1,2].map(j=>idx?idx.getX(t+j):t+j),q=ids.map(i=>[p.getX(i),p.getY(i),p.getZ(i)]),[a,b,c]=q;if(q.flat().some(v=>!Number.isFinite(v)))invalid++;
  const cross=[b[1]*c[2]-b[2]*c[1],b[2]*c[0]-b[0]*c[2],b[0]*c[1]-b[1]*c[0]];volume+=(a[0]*cross[0]+a[1]*cross[1]+a[2]*cross[2])/6;
  const keys=ids.map(key);if(new Set(keys).size<3)degenerate++;
  for(let j=0;j<3;j++){const a=keys[j],b=keys[(j+1)%3],e=[a,b].sort().join('|');edges.set(e,(edges.get(e)||0)+1);directed.set(e,(directed.get(e)||0)+(a<b?1:-1));}
 }
 g.computeBoundingBox();return{name:g.name,triangles:N/3,signedVolume:volume,nonmanifoldEdges:[...edges.values()].filter(n=>n!==2).length,inconsistentWindingEdges:[...directed.values()].filter(n=>n!==0).length,invalidTriangles:invalid,degenerateTrianglesAt10MicronTolerance:degenerate,bounds:g.boundingBox};
}
const records=[...Array.from({length:7},(_,j)=>audit(createFracturedStone107(j+17))),audit(createFracturedStone107(10771,{bearing:true})),audit(createRestorationLotusLeaf(5)),...Array.from({length:3},(_,j)=>audit(createRestorationLotusPetal(5,j))),audit(createRootedLotusStem107([0,-.33,0],[.12,.78,-.07],.008))];
const source=new URL('../../../assets/polyhaven/rock-moss-set-01/',import.meta.url),gltf=JSON.parse(await readFile(new URL('rock_moss_set_01_4k.gltf',source),'utf8')),bin=await readFile(new URL('rock_moss_set_01.bin',source));
function accessor(i){const a=gltf.accessors[i],v=gltf.bufferViews[a.bufferView],Type=a.componentType===5126?Float32Array:Uint16Array,n={SCALAR:1,VEC3:3,VEC2:2}[a.type];return new Type(bin.buffer,bin.byteOffset+(v.byteOffset||0)+(a.byteOffset||0),a.count*n).slice();}
for(let j=0;j<gltf.meshes.length;j++)if(j!==3){const p=gltf.meshes[j].primitives[0],g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(accessor(p.attributes.POSITION),3));g.setIndex(new T.BufferAttribute(accessor(p.indices),1));records.push(audit(createKeyedScanBearing107(g,j)),audit(createKeyedScanBearing107(g,j,{level:false})));}
const out=new URL('../../../qa/ten-reference/03/fractured-garden107/closed-solids.json',import.meta.url);await mkdir(new URL('./',out),{recursive:true});await writeFile(out,JSON.stringify({revision:107,scope:'Actual imported source prototypes, quantized positional edge incidence and signed volume; no fidelity inference',records},null,2)+'\n');console.log(JSON.stringify(records));
if(records.some(r=>r.invalidTriangles||r.signedVolume<=0||r.nonmanifoldEdges||r.inconsistentWindingEdges))process.exitCode=1;
