import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){if(s==='three')return{url:new URL('../../vendor/build/three.module.js',import.meta.url).href,shortCircuit:true};return next(s,c);}});
const T=await import('../../vendor/build/three.module.js'),{edgeTable,triTable}=await import('../../vendor/examples/jsm/objects/MarchingCubes.js');
import {terminalDistance204 as field,terminalVolume204 as spec} from './astra-r12b/terminal-volume204.js';
const started=Date.now(),step=spec.gridStep,min=spec.bounds[0],dims=spec.bounds[1].map((v,i)=>Math.ceil((v-min[i])/step)+1),[nx,ny,nz]=dims,total=nx*ny*nz,values=new Float32Array(total),point=id=>{const z=Math.floor(id/(nx*ny)),rest=id-z*nx*ny,y=Math.floor(rest/nx),x=rest-y*nx;return[min[0]+x*step,min[1]+y*step,min[2]+z*step];};
let boundaryMinimum=Infinity;
for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const id=(z*ny+y)*nx+x,v=field(min[0]+x*step,min[1]+y*step,min[2]+z*step);values[id]=v;if(!x||!y||!z||x===nx-1||y===ny-1||z===nz-1)boundaryMinimum=Math.min(boundaryMinimum,v);}
console.log(JSON.stringify({phase:'field',dims,samples:total,boundaryMinimum,seconds:(Date.now()-started)/1000}));if(boundaryMinimum<=0)throw Error('Volume touches grid boundary');
const position=[],indices=[],edgeCache=new Map(),corner=[0,1,nx+1,nx,nx*ny,nx*ny+1,nx*ny+nx+1,nx*ny+nx],edgeEnds=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
function vertex(a,b){const lo=Math.min(a,b),hi=Math.max(a,b),key=lo*total+hi;if(edgeCache.has(key))return edgeCache.get(key);const t=values[a]/(values[a]-values[b]),p=point(a),q=point(b),at=position.length/3;position.push(p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,p[2]+(q[2]-p[2])*t);edgeCache.set(key,at);return at;}
for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
 const base=(z*ny+y)*nx+x,cube=corner.map(v=>base+v);let ci=0;for(let k=0;k<8;k++)if(values[cube[k]]<0)ci|=1<<k;const mask=edgeTable[ci];if(!mask)continue;
 const vids=[];for(let e=0;e<12;e++)if(mask&(1<<e))vids[e]=vertex(cube[edgeEnds[e][0]],cube[edgeEnds[e][1]]);
 for(let i=ci*16;triTable[i]!==-1;i+=3)indices.push(vids[triTable[i]],vids[triTable[i+1]],vids[triTable[i+2]]);
}
// Weld only numerical coincidences of the implicit surface (five microns),
// remove collapsed/duplicate faces, and retain every resolved carved form.
const weld=new Map(),wp=[],remap=new Uint32Array(position.length/3),eps=.000001;
for(let i=0;i<position.length;i+=3){const p=position.slice(i,i+3),q=p.map(v=>Math.floor(v/eps));let old;
 for(let dx=-1;dx<=1&&old===undefined;dx++)for(let dy=-1;dy<=1&&old===undefined;dy++)for(let dz=-1;dz<=1&&old===undefined;dz++)for(const at of weld.get([q[0]+dx,q[1]+dy,q[2]+dz].join(','))??[]){if((p[0]-wp[at*3])**2+(p[1]-wp[at*3+1])**2+(p[2]-wp[at*3+2])**2<eps*eps){old=at;break;}}
 if(old!==undefined)remap[i/3]=old;else{const at=wp.length/3,key=q.join(',');remap[i/3]=at;wp.push(...p);if(!weld.has(key))weld.set(key,[]);weld.get(key).push(at);}
}
const wi=[],faces=new Set();for(let i=0;i<indices.length;i+=3){const a=remap[indices[i]],b=remap[indices[i+1]],c=remap[indices[i+2]];if(a===b||b===c||a===c)continue;const key=[a,b,c].sort((x,y)=>x-y).join(',');if(faces.has(key))continue;faces.add(key);wi.push(a,b,c);}
let signedVolume=0;for(let i=0;i<wi.length;i+=3){const a=new T.Vector3(...wp.slice(wi[i]*3,wi[i]*3+3)),b=new T.Vector3(...wp.slice(wi[i+1]*3,wi[i+1]*3+3)),c=new T.Vector3(...wp.slice(wi[i+2]*3,wi[i+2]*3+3));signedVolume+=a.dot(b.cross(c))/6;}if(signedVolume<0)for(let i=0;i<wi.length;i+=3)[wi[i+1],wi[i+2]]=[wi[i+2],wi[i+1]];
// Remove only unresolved numerical specks; a larger detached component
// is a modeling failure and must be repaired, not silently discarded.
const parents=Int32Array.from({length:wp.length/3},(_,i)=>i),find=a=>{let r=a;while(parents[r]!==r)r=parents[r];while(parents[a]!==a){const n=parents[a];parents[a]=r;a=n;}return r;};for(let i=0;i<wi.length;i+=3)for(const j of[1,2]){const a=find(wi[i]),b=find(wi[i+j]);if(a!==b)parents[b]=a;}
const componentFaces=new Map();for(let i=0;i<wi.length;i+=3){const r=find(wi[i]);componentFaces.set(r,(componentFaces.get(r)||0)+1);}const components=[...componentFaces.entries()].sort((a,b)=>b[1]-a[1]);if(components.slice(1).some(([,n])=>n>30))throw Error('Large detached ceramic component requires model repair');
const compact=[],compactIndices=[],used=new Map();for(let i=0;i<wi.length;i+=3){if(find(wi[i])!==components[0][0])continue;for(const v of wi.slice(i,i+3)){if(!used.has(v)){used.set(v,compact.length/3);compact.push(...wp.slice(v*3,v*3+3));}compactIndices.push(used.get(v));}}
const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(compact,3));geometry.setIndex(compactIndices);geometry.computeVertexNormals();
const p=geometry.attributes.position.array,n=geometry.attributes.normal.array,ix=geometry.index.array,bytes=Buffer.alloc(20+p.byteLength+n.byteLength+ix.length*4);bytes.write('T204',0);bytes.writeUInt32LE(1,4);bytes.writeUInt32LE(p.length/3,8);bytes.writeUInt32LE(ix.length,12);bytes.writeUInt32LE(20,16);Buffer.from(p.buffer,p.byteOffset,p.byteLength).copy(bytes,20);Buffer.from(n.buffer,n.byteOffset,n.byteLength).copy(bytes,20+p.byteLength);const indexBytes=new Uint32Array(ix);Buffer.from(indexBytes.buffer).copy(bytes,20+p.byteLength+n.byteLength);
const root='lookdev/scene05-terminal204/astra-r12b/assets/terminal204-authored';await mkdir(root,{recursive:true});await writeFile(root+'/face204.bin',bytes);
const hash=b=>createHash('sha256').update(b).digest('hex'),report={status:'authored-volume-for-native-review',spec,removedNumericalSpeckTriangles:components.slice(1).map(([,n])=>n),mesher:'Marching cubes with one-micron Euclidean numerical weld; finite authored implicit volume',grid:dims,samples:total,boundaryMinimum,vertices:p.length/3,triangles:ix.length/3,bytes:bytes.length,sha256:hash(bytes),sourceFieldSha256:hash(await readFile('lookdev/scene05-terminal204/astra-r12b/terminal-volume204.js')),recipeSha256:hash(await readFile('lookdev/scene05-terminal204/author-volume204-astra-r12b.mjs')),cpuSeconds:(Date.now()-started)/1000,photoPixelsUsed:false,externalScanUsed:false,visualAccepted:false};await writeFile(root+'/provenance204.json',JSON.stringify(report,null,2)+'\n');await writeFile('lookdev/scene05-terminal204/volume204-astra-r12b-receipt.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
