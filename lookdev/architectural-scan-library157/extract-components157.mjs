// Exact source-face extraction. Original vertex/normal/UV bytes are copied;
// coordinate changes live on a reversible, declared wrapper node.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,relative,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {Matrix4,Vector3,Quaternion} from '../../vendor/build/three.module.js';
const BASE=dirname(fileURLToPath(import.meta.url)),selectionPath=resolve(process.argv[2]||join(BASE,'component-selection157-r01.json'));
const config=JSON.parse(await readFile(selectionPath,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const types={5120:{bytes:1,get:'getInt8'},5121:{bytes:1,get:'getUint8'},5122:{bytes:2,get:'getInt16'},5123:{bytes:2,get:'getUint16'},5125:{bytes:4,get:'getUint32'},5126:{bytes:4,get:'getFloat32'}};
const sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
function parse(bytes){
 if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2)throw Error('Expected glTF2 GLB');
 let at=12,d,bin;
 while(at<bytes.length){const len=bytes.readUInt32LE(at),type=bytes.readUInt32LE(at+4),chunk=bytes.subarray(at+8,at+8+len);if(type===0x4e4f534a)d=JSON.parse(chunk.toString('utf8'));if(type===0x004e4942)bin=chunk;at+=8+len;}
 if(!d||!bin)throw Error('Incomplete source GLB');return{d,bin};
}
function nodeMatrix(n){return n.matrix?new Matrix4().fromArray(n.matrix):new Matrix4().compose(new Vector3().fromArray(n.translation||[0,0,0]),new Quaternion().fromArray(n.rotation||[0,0,0,1]),new Vector3().fromArray(n.scale||[1,1,1]));}
function primitiveRecords(d){
 const records=[];
 function walk(i,parent){const n=d.nodes[i],world=parent.clone().multiply(nodeMatrix(n));if(n.mesh!==undefined)d.meshes[n.mesh].primitives.forEach((p,j)=>records.push({p,node:i,mesh:n.mesh,primitive:j,name:n.name||d.meshes[n.mesh].name||'source-'+i,world}));for(const c of n.children||[])walk(c,world);}
 for(const i of d.scenes[d.scene||0].nodes)walk(i,new Matrix4());return records;
}
function accessor(d,bin,i){
 const a=d.accessors[i],b=d.bufferViews[a.bufferView];if(a.sparse||b.buffer!==0)throw Error('Sparse/external source accessor unsupported');
 const t=types[a.componentType],components=sizes[a.type],packed=t.bytes*components,stride=b.byteStride||packed,offset=(b.byteOffset||0)+(a.byteOffset||0),dv=new DataView(bin.buffer,bin.byteOffset,bin.byteLength);
 return{a,packed,components,get:(n,c=0)=>dv[t.get](offset+n*stride+c*t.bytes,true),bytes:n=>bin.subarray(offset+n*stride,offset+n*stride+packed)};
}
for(const spec of config.components){
 const source=resolve(BASE,spec.source),sourceBytes=await readFile(source),{d,bin}=parse(sourceBytes),inspection=JSON.parse(await readFile(resolve(BASE,spec.inspection),'utf8'));
 if(sha(sourceBytes)!==inspection.sourceSha256)throw Error('Inspection/source hash mismatch');
 const pose=new Matrix4().set(...inspection.previewTransform.flat()),yupToZup=new Matrix4().makeRotationX(Math.PI/2),center=spec.originZUp||spec.boundsZUp[0].map((v,k)=>(v+spec.boundsZUp[1][k])/2);
 const sourceToSelection=pose.clone().multiply(yupToZup),rootMatrix=yupToZup.clone().invert().multiply(new Matrix4().makeTranslation(...center.map(x=>-x))).multiply(sourceToSelection);
 const out=resolve(BASE,spec.output);await mkdir(out,{recursive:true});const chunks=[],views=[],accessors=[],meshes=[],nodes=[{name:spec.name,matrix:rootMatrix.toArray(),children:[]}],trace=[],traceChunks=[];let byteOffset=0,traceOffset=0,totalSelected=0,totalSource=0;
 function put(bytes,target){const pad=(4-byteOffset%4)%4;if(pad){chunks.push(Buffer.alloc(pad));byteOffset+=pad;}const at=views.length;views.push({buffer:0,byteOffset,byteLength:bytes.length,...(target?{target}:{})});chunks.push(bytes);byteOffset+=bytes.length;return at;}
 function putTrace(data){const bytes=Buffer.from(data.buffer,data.byteOffset,data.byteLength),at=traceOffset;traceChunks.push(bytes);traceOffset+=bytes.length;return{file:'source-face-trace.bin',byteOffset:at,byteLength:bytes.length,type:'Uint32Array',count:data.length,sha256:sha(bytes)};}
 for(const rec of primitiveRecords(d)){
  if((rec.p.mode??4)!==4)throw Error('Non-triangle source primitive');
  const attrs=Object.fromEntries(Object.entries(rec.p.attributes).map(([name,i])=>[name,accessor(d,bin,i)])),pos=attrs.POSITION,index=rec.p.indices===undefined?null:accessor(d,bin,rec.p.indices),count=index?index.a.count:pos.a.count;
  const selectedMatrix=sourceToSelection.clone().multiply(rec.world),allowed=new Uint8Array(pos.a.count),p=new Vector3();
  const [lo,hi]=spec.boundsZUp;
  for(let j=0;j<pos.a.count;j++){
   p.set(pos.get(j,0),pos.get(j,1),pos.get(j,2)).applyMatrix4(selectedMatrix);
   if(!p.toArray().every(Number.isFinite))throw Error('Nonfinite original position');
   allowed[j]=Number(p.x>=lo[0]&&p.x<=hi[0]&&p.y>=lo[1]&&p.y<=hi[1]&&p.z>=lo[2]&&p.z<=hi[2]);
  }
  const oldToNew=new Int32Array(pos.a.count).fill(-1),originalVertices=[],indices=[],originalFaces=[];
  for(let j=0;j<count;j+=3){
   const a=index?index.get(j):j,b=index?index.get(j+1):j+1,c=index?index.get(j+2):j+2;totalSource++;
   if(!(allowed[a]&&allowed[b]&&allowed[c]))continue;
   for(const old of[a,b,c]){if(oldToNew[old]===-1){oldToNew[old]=originalVertices.length;originalVertices.push(old);}indices.push(oldToNew[old]);}
   originalFaces.push(j/3);
  }
  if(!indices.length)continue;
  const targetAttrs={},attributeReceipts={};
  for(const [name,a]of Object.entries(attrs)){
   const values=Buffer.alloc(originalVertices.length*a.packed);originalVertices.forEach((old,j)=>a.bytes(old).copy(values,j*a.packed));const view=put(values,34962),record={bufferView:view,componentType:a.a.componentType,type:a.a.type,count:originalVertices.length,...(a.a.normalized?{normalized:true}:{})};
   if(name==='POSITION'){
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const old of originalVertices)for(let c=0;c<3;c++){const x=a.get(old,c);min[c]=Math.min(min[c],x);max[c]=Math.max(max[c],x);}record.min=min;record.max=max;
   }
   targetAttrs[name]=accessors.length;accessors.push(record);attributeReceipts[name]={sourceAccessor:rec.p.attributes[name],count:record.count,byteIdenticalSourceSubset:true,sha256:sha(values)};
  }
  const ix=Uint32Array.from(indices),view=put(Buffer.from(ix.buffer),34963),ia=accessors.length;accessors.push({bufferView:view,componentType:5125,type:'SCALAR',count:ix.length,min:[0],max:[originalVertices.length-1]});
  const name=rec.name+' selected source faces';const mi=meshes.length;meshes.push({name,primitives:[{attributes:targetAttrs,indices:ia,material:rec.p.material,mode:4,extras:{sourceNode:rec.node,sourceMesh:rec.mesh,sourcePrimitive:rec.primitive}}]});const ni=nodes.length;nodes.push({name,mesh:mi,matrix:rec.world.toArray()});nodes[0].children.push(ni);
  trace.push({sourceNode:rec.node,sourceMesh:rec.mesh,sourcePrimitive:rec.primitive,triangles:originalFaces.length,vertices:originalVertices.length,attributes:attributeReceipts,sourceVertexIds:putTrace(Uint32Array.from(originalVertices)),sourceTriangleIds:putTrace(Uint32Array.from(originalFaces))});totalSelected+=originalFaces.length;
 }
 if(totalSelected<(spec.minimumTriangles||1000))throw Error('Selection too small: '+spec.name+' '+totalSelected);
 const images=[];
 for(let i=0;i<(d.images||[]).length;i++){
  const img=d.images[i];if(img.bufferView===undefined)throw Error('Expected embedded original source image');const v=d.bufferViews[img.bufferView],bytes=bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength),ext=img.mimeType==='image/jpeg'?'jpg':'png';
  const textureDir=join(dirname(source),'original-textures');await mkdir(textureDir,{recursive:true});const texture=join(textureDir,'original-image-'+i+'.'+ext);try{const prior=await readFile(texture);if(sha(prior)!==sha(bytes))throw Error('Existing source texture differs');}catch(e){if(e.code==='ENOENT')await writeFile(texture,bytes);else throw e;}
  images.push({name:img.name||'Original source image '+i,uri:relative(out,texture).split('\\').join('/'),mimeType:img.mimeType});
 }
 const derived={asset:{version:'2.0',generator:'Architectural scan library157 exact source-face extraction',extras:{source:d.asset.extras,sourceSha256:sha(sourceBytes),changes:'Only spatial face selection and reversible wrapper-node placement/unit conversion; source attributes/materials/image bytes retained.',unitStatement:spec.unitStatement}},scene:0,scenes:[{nodes:[0]}],nodes,meshes,buffers:[{uri:'component.bin',byteLength:byteOffset}],bufferViews:views,accessors,materials:d.materials,textures:d.textures,samplers:d.samplers,images,...(d.extensionsUsed?{extensionsUsed:d.extensionsUsed}:{})};
 const binary=Buffer.concat(chunks),json=JSON.stringify(derived,null,2)+'\n';await writeFile(join(out,'component.gltf'),json);await writeFile(join(out,'component.bin'),binary);await writeFile(join(out,'source-face-trace.bin'),Buffer.concat(traceChunks));
 const report={status:'actual-source-component-extracted',name:spec.name,source:relative(BASE,source),sourceSha256:sha(sourceBytes),originalSourceTriangles:totalSource,selectedTriangles:totalSelected,selectedVertices:trace.reduce((s,r)=>s+r.vertices,0),boundsInInspectionZUp:spec.boundsZUp,componentOriginInInspectionZUp:center,sourceToComponentRootYUp:rootMatrix.toArray(),unitStatement:spec.unitStatement,sourceAttributesRetainedAsExactByteSubsets:true,geometryRemeshed:false,decimation:false,UVRebake:false,textureReencoding:false,originalMaterialsRetained:true,originalHasUV:trace.some(r=>'TEXCOORD_0'in r.attributes),originalHasNormalMap:(d.materials||[]).some(m=>m.normalTexture),images:images.map((im,i)=>{const view=d.bufferViews[d.images[i].bufferView],start=view.byteOffset||0;return{file:im.uri,sha256:sha(bin.subarray(start,start+view.byteLength))};}),sourceCropBoundaries:'Existing source triangles retained; crop edges can be open and should be embedded in a separate solid carrier. No caps/remesh disguised as original scan.',trace,files:{'component.gltf':{bytes:Buffer.byteLength(json),sha256:sha(json)},'component.bin':{bytes:binary.length,sha256:sha(binary)}},canonicalIntegration:false};await writeFile(join(out,'component-provenance.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({name:spec.name,triangles:totalSelected,vertices:report.selectedVertices,bytes:binary.length,output:relative(BASE,out)}));
}
