import * as T from '../../vendor/build/three.module.js';
import {readFile,writeFile} from 'node:fs/promises';
import {createGardenGround213,dressLayeredBanks213} from '../../reconstructions/scene-08/src/layered-banks213.js';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';

// Decode only original glTF POSITION buffers on CPU. No image loader, scene
// export, browser, graphics context or render is involved in this audit.
const source=(await reconstructionSourceIdentity(process.cwd(),'08')).hash;
if(source!=='2627ddf97e4a84700b74242c6b1cd691072061709225e1d69ac29804bde75dd2')throw Error('Restore exact R04 source before running its rock embedding audit.');
const base=new URL('../../assets/polyhaven/rock-moss-set-01/',import.meta.url),gltf=JSON.parse(await readFile(new URL('rock_moss_set_01_4k.gltf',base),'utf8')),bin=await readFile(new URL(gltf.buffers[0].uri,base)),view=new DataView(bin.buffer,bin.byteOffset,bin.byteLength),variants=[];
for(const nodeId of gltf.scenes[0].nodes){const node=gltf.nodes[nodeId],part=gltf.meshes[node.mesh].primitives[0],a=gltf.accessors[part.attributes.POSITION],b=gltf.bufferViews[a.bufferView],start=(b.byteOffset||0)+(a.byteOffset||0),stride=b.byteStride||12,points=[];
 if(a.componentType!==5126||a.type!=='VEC3')throw Error('Unexpected original glTF position encoding.');
 for(let i=0;i<a.count;i++)points.push(new T.Vector3(...[0,1,2].map(k=>view.getFloat32(start+i*stride+k*4,true)+(node.translation?.[k]||0))));
 const bounds=new T.Box3().setFromPoints(points),centre=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());for(const p of points)p.sub(new T.Vector3(centre.x,bounds.min.y,centre.z));
 variants.push({name:node.name,width:Math.max(size.x,size.z),height:size.y,points});
}
const frame={x:-3.954,z:-8.701,yaw:-.28},terrain=createGardenGround213(frame),placed=[],info={variants},stone={info,place(options){placed.push(options);}},bank=dressLayeredBanks213({emit(){},scannedStones:stone,botany:{place(){}},height:terrain.sample,riverXAt:()=>3,materials:[],grandFrame:frame}),checks=[];
for(const authored of bank.retaining){const placement=placed.find(p=>p.x===authored.x&&p.z===authored.z),variant=variants[placement.index%variants.length],scale=Math.min(placement.width/variant.width,placement.heightLimit/variant.height),yaw=placement.index*.71,c=Math.cos(yaw),s=Math.sin(yaw),deltas=[];
 for(const p of variant.points){const x=placement.x+scale*(c*p.x+s*p.z),y=placement.height-.07+scale*p.y,z=placement.z+scale*(-s*p.x+c*p.z);deltas.push(y-terrain.sample(x,z));}
 const above=deltas.filter(d=>d>0).length;checks.push({...authored,sourceVariant:variant.name,scale,vertices:deltas.length,minSurfaceDifference:Math.min(...deltas),maxSurfaceDifference:Math.max(...deltas),exposedVertexFraction:above/deltas.length,intersectsActualTerrain:deltas.some(d=>d<-.01)&&deltas.some(d=>d>.01)});
}
const report={revision:process.env.REVISION||'r04',source,scope:'Original independent scan vertices transformed exactly as native placement, sampled against the actual terrain triangles. Contact evidence only, not photographic acceptance.',count:checks.length,pass:checks.every(c=>c.intersectsActualTerrain),checks};
await writeFile(new URL(`bank-embedding-${report.revision}.json`,import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({revision:report.revision,count:report.count,pass:report.pass,ranges:checks.map(c=>({source:c.sourceVariant,min:c.minSurfaceDifference,max:c.maxSurfaceDifference,exposed:c.exposedVertexFraction}))}));if(!report.pass)process.exitCode=1;
