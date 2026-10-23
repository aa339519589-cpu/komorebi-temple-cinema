import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){if(s==='three')return{url:new URL('../../vendor/build/three.module.js',import.meta.url).href,shortCircuit:true};return next(s,c);}});
const T=await import('../../vendor/build/three.module.js'),{edgeTable,triTable}=await import('../../vendor/examples/jsm/objects/MarchingCubes.js');
import {terminalDistance204 as field,terminalVolume204 as spec} from './staged-r04/terminal-volume204.js';
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
const weld=new Map(),wp=[],remap=new Uint32Array(position.length/3);for(let i=0;i<position.length;i+=3){const key=position.slice(i,i+3).map(v=>Math.round(v*2e5)).join(','),old=weld.get(key);if(old!==undefined)remap[i/3]=old;else{const at=wp.length/3;weld.set(key,at);remap[i/3]=at;wp.push(...position.slice(i,i+3));}}
const wi=[],faces=new Set();for(let i=0;i<indices.length;i+=3){const a=remap[indices[i]],b=remap[indices[i+1]],c=remap[indices[i+2]];if(a===b||b===c||a===c)continue;const key=[a,b,c].sort((x,y)=>x-y).join(',');if(faces.has(key))continue;faces.add(key);wi.push(a,b,c);}
let signedVolume=0;for(let i=0;i<wi.length;i+=3){const a=new T.Vector3(...wp.slice(wi[i]*3,wi[i]*3+3)),b=new T.Vector3(...wp.slice(wi[i+1]*3,wi[i+1]*3+3)),c=new T.Vector3(...wp.slice(wi[i+2]*3,wi[i+2]*3+3));signedVolume+=a.dot(b.cross(c))/6;}if(signedVolume<0)for(let i=0;i<wi.length;i+=3)[wi[i+1],wi[i+2]]=[wi[i+2],wi[i+1]];
const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(wp,3));geometry.setIndex(wi);geometry.computeVertexNormals();
const p=geometry.attributes.position.array,n=geometry.attributes.normal.array,ix=geometry.index.array,bytes=Buffer.alloc(20+p.byteLength+n.byteLength+ix.length*4);bytes.write('T204',0);bytes.writeUInt32LE(1,4);bytes.writeUInt32LE(p.length/3,8);bytes.writeUInt32LE(ix.length,12);bytes.writeUInt32LE(20,16);Buffer.from(p.buffer,p.byteOffset,p.byteLength).copy(bytes,20);Buffer.from(n.buffer,n.byteOffset,n.byteLength).copy(bytes,20+p.byteLength);const indexBytes=new Uint32Array(ix);Buffer.from(indexBytes.buffer).copy(bytes,20+p.byteLength+n.byteLength);
const root='lookdev/scene05-terminal204/staged-r04/assets/terminal204-authored';await mkdir(root,{recursive:true});await writeFile(root+'/face204.bin',bytes);
const hash=b=>createHash('sha256').update(b).digest('hex'),report={status:'authored-volume-for-native-review',spec,mesher:'Marching cubes with five-micron numerical weld; finite authored implicit volume',grid:dims,samples:total,boundaryMinimum,vertices:p.length/3,triangles:ix.length/3,bytes:bytes.length,sha256:hash(bytes),sourceFieldSha256:hash(await readFile('lookdev/scene05-terminal204/staged-r04/terminal-volume204.js')),recipeSha256:hash(await readFile('lookdev/scene05-terminal204/author-volume204-r05.mjs')),cpuSeconds:(Date.now()-started)/1000,photoPixelsUsed:false,externalScanUsed:false,visualAccepted:false};await writeFile(root+'/provenance204.json',JSON.stringify(report,null,2)+'\n');await writeFile('lookdev/scene05-terminal204/volume204-r05-receipt.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
