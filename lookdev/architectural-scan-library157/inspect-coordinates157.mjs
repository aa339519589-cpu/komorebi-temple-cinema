import {readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Matrix4,Vector3} from '../../vendor/build/three.module.js';
const base=dirname(fileURLToPath(import.meta.url));
for(const [slug,folder]of[['rinzai-gate','ccby-areong-rinzai-gate'],['floral-panel','ccby-diana-liu-floral-panel']]){
 const root=resolve(base,'sources',folder),raw=await readFile(resolve(root,'source-objaverse.glb')),len=raw.readUInt32LE(12),d=JSON.parse(raw.subarray(20,20+len).toString()),bo=20+len+8;
 const primary=JSON.parse(await readFile(resolve(root,'source-inspection.json'),'utf8')),inspection=JSON.parse(await readFile(resolve(base,'inspection-r02',slug+'-source-inspection.json'),'utf8')),pose=new Matrix4().set(...inspection.previewTransform.flat()).multiply(new Matrix4().makeRotationX(Math.PI/2)),values=[[],[],[]];
 for(const rec of primary.meshes){
  const a=d.accessors[rec.attributes.POSITION],view=d.bufferViews[a.bufferView],offset=bo+(view.byteOffset||0)+(a.byteOffset||0),stride=view.byteStride||12,data=new DataView(raw.buffer,raw.byteOffset,raw.byteLength),M=pose.clone().multiply(new Matrix4().set(...rec.worldMatrix.flat())),p=new Vector3();
  for(let j=0;j<a.count;j++){p.set(data.getFloat32(offset+j*stride,true),data.getFloat32(offset+j*stride+4,true),data.getFloat32(offset+j*stride+8,true)).applyMatrix4(M);values[0].push(p.x);values[1].push(p.y);values[2].push(p.z);}
 }
 const stats=values.map(v=>{v.sort((a,b)=>a-b);const at=q=>v[Math.floor(q*(v.length-1))];return{min:v[0],max:v.at(-1),quantiles:Object.fromEntries([0,.01,.05,.10,.25,.5,.75,.9,.95,.99,1].map(q=>[q,at(q)]))};});
 const report={slug,frame:'The valid inspection-r02 preview Z-up coordinates; source files/attributes unchanged',vertices:values[0].length,axes:{x:stats[0],y:stats[1],z:stats[2]}};await writeFile(resolve(base,'inspection-r02',slug+'-coordinate-distribution.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}
