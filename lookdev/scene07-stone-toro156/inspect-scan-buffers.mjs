import{readFile,writeFile}from'node:fs/promises';import * as T from'../../vendor/build/three.module.js';
const b=await readFile(new URL('./sources/ccby-3dlunatic-toro/source-objaverse.glb',import.meta.url)),n=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+n).toString()),binary=b.subarray(28+n),coords=[],box=new T.Box3();
function walk(id,parent=new T.Matrix4()){
 const node=g.nodes[id],m=parent.clone().multiply(node.matrix?new T.Matrix4().fromArray(node.matrix):new T.Matrix4().compose(new T.Vector3(...(node.translation||[0,0,0])),new T.Quaternion(...(node.rotation||[0,0,0,1])),new T.Vector3(...(node.scale||[1,1,1]))));
 if(node.mesh!==undefined)for(const prim of g.meshes[node.mesh].primitives){const a=g.accessors[prim.attributes.POSITION],v=g.bufferViews[a.bufferView],start=(v.byteOffset||0)+(a.byteOffset||0),stride=v.byteStride||12;for(let i=0;i<a.count;i++){const p=new T.Vector3(binary.readFloatLE(start+i*stride),binary.readFloatLE(start+i*stride+4),binary.readFloatLE(start+i*stride+8)).applyMatrix4(m);coords.push(p);box.expandByPoint(p);}}
 for(const child of node.children||[])walk(child,m);
}
for(const id of g.scenes[g.scene||0].nodes)walk(id);const size=box.getSize(new T.Vector3()),sections=[];
for(let j=0;j<20;j++){const y0=box.min.y+size.y*j/20,y1=box.min.y+size.y*(j+1)/20,points=coords.filter(p=>p.y>=y0&&p.y<y1);const b=new T.Box3().setFromPoints(points);sections.push({relativeY:[j/20,(j+1)/20],count:points.length,boundsXZ:[b.min.x,b.max.x,b.min.z,b.max.z],spanXZ:[b.max.x-b.min.x,b.max.z-b.min.z]});}
const r={scope:'Actual unchanged public GLB vertex buffers and full original hierarchy matrices; coordinates Y-up',bounds:[box.min.toArray(),box.max.toArray()],size:size.toArray(),sourceVertices:coords.length,meshTriangles:g.meshes.map(m=>m.primitives.reduce((s,p)=>s+g.accessors[p.indices].count/3,0)),sections};await writeFile(new URL('./sources/scan-buffer-inspection.json',import.meta.url),JSON.stringify(r,null,2));console.log(JSON.stringify(r,null,2));
