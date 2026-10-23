import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from '../../vendor/build/three.module.js';
import {terminalDistance204 as field,terminalVolume204 as spec} from '../../reconstructions/scene-05/src/terminal-volume204.js';
const started=Date.now(),step=spec.gridStep,min=spec.bounds[0],dims=spec.bounds[1].map((v,i)=>Math.ceil((v-min[i])/step)+1),[nx,ny,nz]=dims,total=nx*ny*nz,values=new Float32Array(total),point=id=>{const z=Math.floor(id/(nx*ny)),rest=id-z*nx*ny,y=Math.floor(rest/nx),x=rest-y*nx;return[min[0]+x*step,min[1]+y*step,min[2]+z*step];};
let boundaryMinimum=Infinity;
for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const id=(z*ny+y)*nx+x,v=field(min[0]+x*step,min[1]+y*step,min[2]+z*step);values[id]=v;if(!x||!y||!z||x===nx-1||y===ny-1||z===nz-1)boundaryMinimum=Math.min(boundaryMinimum,v);}
console.log(JSON.stringify({phase:'field',dims,samples:total,boundaryMinimum,seconds:(Date.now()-started)/1000}));if(boundaryMinimum<=0)throw Error('Volume touches grid boundary');
const position=[],indices=[],edgeCache=new Map(),tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]],corner=[0,1,nx+1,nx,nx*ny,nx*ny+1,nx*ny+nx+1,nx*ny+nx];
function vertex(a,b){const lo=Math.min(a,b),hi=Math.max(a,b),key=lo*total+hi;if(edgeCache.has(key))return edgeCache.get(key);const t=values[a]/(values[a]-values[b]),p=point(a),q=point(b),at=position.length/3;position.push(p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,p[2]+(q[2]-p[2])*t);edgeCache.set(key,at);return at;}
function tri(a,b,c,out){const p=new T.Vector3(...position.slice(a*3,a*3+3)),q=new T.Vector3(...position.slice(b*3,b*3+3)),r=new T.Vector3(...position.slice(c*3,c*3+3)),n=q.sub(p).cross(r.sub(p));if(n.lengthSq()<1e-24)return;if(n.dot(out)<0)[b,c]=[c,b];indices.push(a,b,c);}
for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
 const base=(z*ny+y)*nx+x,cube=corner.map(v=>base+v),n=cube.filter(v=>values[v]<0).length;if(!n||n===8)continue;
 for(const t of tetra){const ids=t.map(i=>cube[i]),inside=ids.filter(i=>values[i]<0),outside=ids.filter(i=>values[i]>=0);if(!inside.length||!outside.length)continue;const centre=a=>a.reduce((p,id)=>{const q=point(id);return p.add(new T.Vector3(...q).multiplyScalar(1/a.length));},new T.Vector3()),out=centre(outside).sub(centre(inside));
  if(inside.length===1||outside.length===1){const a=inside.length===1?inside[0]:outside[0],other=inside.length===1?outside:inside,v=other.map(b=>vertex(a,b));tri(v[0],v[1],v[2],out);}
  else{const a=vertex(inside[0],outside[0]),b=vertex(inside[0],outside[1]),c=vertex(inside[1],outside[0]),d=vertex(inside[1],outside[1]);tri(a,c,d,out);tri(a,d,b,out);}
 }
}
const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));geometry.setIndex(indices);geometry.computeVertexNormals();
const p=geometry.attributes.position.array,n=geometry.attributes.normal.array,ix=geometry.index.array,bytes=Buffer.alloc(20+p.byteLength+n.byteLength+ix.length*4);bytes.write('T204',0);bytes.writeUInt32LE(1,4);bytes.writeUInt32LE(p.length/3,8);bytes.writeUInt32LE(ix.length,12);bytes.writeUInt32LE(20,16);Buffer.from(p.buffer,p.byteOffset,p.byteLength).copy(bytes,20);Buffer.from(n.buffer,n.byteOffset,n.byteLength).copy(bytes,20+p.byteLength);const indexBytes=new Uint32Array(ix);Buffer.from(indexBytes.buffer).copy(bytes,20+p.byteLength+n.byteLength);
const root='reconstructions/scene-05/assets/terminal204-authored';await mkdir(root,{recursive:true});await writeFile(root+'/face204.bin',bytes);
const hash=b=>createHash('sha256').update(b).digest('hex'),report={status:'authored-volume-for-native-review',spec,grid:dims,samples:total,boundaryMinimum,vertices:p.length/3,triangles:ix.length/3,bytes:bytes.length,sha256:hash(bytes),sourceFieldSha256:hash(await readFile('reconstructions/scene-05/src/terminal-volume204.js')),recipeSha256:hash(await readFile('lookdev/scene05-terminal204/author-volume204.mjs')),cpuSeconds:(Date.now()-started)/1000,photoPixelsUsed:false,externalScanUsed:false,visualAccepted:false};await writeFile(root+'/provenance204.json',JSON.stringify(report,null,2)+'\n');await writeFile('lookdev/scene05-terminal204/volume204-r01-receipt.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
