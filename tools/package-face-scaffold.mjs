import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
if(!process.env.WORKTREE)throw Error('Set WORKTREE to an isolated candidate checkout.');
const target=resolve(process.env.WORKTREE,'reconstructions/scene-06/src');
const bytes=await readFile(resolve(root,'lookdev/buddha-face-study/closed-face-scaffold.glb'));
if(bytes.subarray(0,4).toString()!=='glTF'||bytes.readUInt32LE(8)!==bytes.length)throw Error('Invalid scaffold GLB');
const length=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+length));
const binStart=20+length+8,bin=bytes.subarray(binStart);
const readAccessor=id=>{
 const a=gltf.accessors[id],v=gltf.bufferViews[a.bufferView],sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4},components=sizes[a.type];
 const types={5126:[4,'getFloat32',1],5125:[4,'getUint32',4294967295],5123:[2,'getUint16',65535],5121:[1,'getUint8',255]};
 const [size,method,maximum]=types[a.componentType]??[];if(!size||!components||a.sparse)throw Error('Unsupported scaffold accessor');
 const view=new DataView(bin.buffer,bin.byteOffset,bin.byteLength),result=[];
 for(let i=0;i<a.count;i++)for(let c=0;c<components;c++){
  let value=view[method]((v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??components*size)+c*size,true);
  if(a.normalized)value/=maximum;if(!Number.isFinite(value))throw Error('Nonfinite scaffold buffer');result.push(value);
 }
 return {array:result,itemSize:components,count:a.count};
};
const meshes=gltf.meshes.flatMap(m=>m.primitives);
if(meshes.length!==1)throw Error('Expected one uniformly shaded scaffold primitive');
for(const node of gltf.nodes)if(node.mesh!=null&&((node.translation?.some(v=>v!==0))||(node.scale?.some(v=>v!==1))||node.rotation||node.matrix))throw Error('Unexpected source object transform');
const p=meshes[0],position=readAccessor(p.attributes.POSITION),normal=readAccessor(p.attributes.NORMAL),color=readAccessor(p.attributes.COLOR_0),index=readAccessor(p.indices);
if(position.count!==normal.count||position.count!==color.count||Math.max(...index.array)>=position.count)throw Error('Scaffold attribute/index mismatch');
const data={sourceSha256:createHash('sha256').update(bytes).digest('hex'),position:position.array,normal:normal.array,color:color.array,colorItemSize:color.itemSize,index:index.array,
 scope:'Unaccepted original-reference landmark scaffold with inferred depth; canonical topology Apache-2.0. No photograph or generated guide is used as albedo.'};
await writeFile(resolve(target,'reference-face-data.js'),'// Derived from the separately reviewed closed Blender skin scaffold.\n// Canonical topology: Google MediaPipe, Apache-2.0; see reference-face-LICENSE.\nexport const referenceFaceData='+JSON.stringify(data)+';\n');
await copyFile(resolve(root,'lookdev/buddha-face-study/vendor/LICENSE'),resolve(target,'reference-face-LICENSE'));
console.log(JSON.stringify({target,vertices:position.count,triangles:index.count/3,colorChannels:color.itemSize,sourceSha256:data.sourceSha256,sceneSelected:false}));
