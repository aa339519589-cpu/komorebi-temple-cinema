import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const base=dirname(fileURLToPath(import.meta.url)),folder=resolve(base,'derived/floral-frieze157-r01'),report=JSON.parse(await readFile(resolve(folder,'component-provenance.json'),'utf8')),source=await readFile(resolve(base,report.source)),length=source.readUInt32LE(12),original=JSON.parse(source.subarray(20,20+length).toString()),sourceBin=source.subarray(20+length+8),derived=JSON.parse(await readFile(resolve(folder,'component.gltf'),'utf8')),derivedBin=await readFile(resolve(folder,'component.bin')),trace=await readFile(resolve(folder,'source-face-trace.bin'));
const hash=b=>createHash('sha256').update(b).digest('hex'),widths={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
function layout(d,index){const a=d.accessors[index],v=d.bufferViews[a.bufferView],size=widths[a.componentType]*components[a.type];return{a,offset:(v.byteOffset||0)+(a.byteOffset||0),stride:v.byteStride||size,size};}
const checks=[];let triangles=0,attributeValues=0,failures=0;
for(let i=0;i<report.trace.length;i++){
 const item=report.trace[i],a=original.meshes[item.sourceMesh].primitives[item.sourcePrimitive],b=derived.meshes[i].primitives[0],sourceIndices=layout(original,a.indices),newIndices=layout(derived,b.indices),vertexIds=item.sourceVertexIds,faceIds=item.sourceTriangleIds;
 function indexAt(layout,data,n){return layout.a.componentType===5123?data.readUInt16LE(layout.offset+n*layout.stride):data.readUInt32LE(layout.offset+n*layout.stride);}
 const attrs={};
 for(const key of Object.keys(a.attributes)){
  const left=layout(original,a.attributes[key]),right=layout(derived,b.attributes[key]);let mismatches=0;
  for(let j=0;j<item.vertices;j++){
   const old=trace.readUInt32LE(vertexIds.byteOffset+j*4),p=left.offset+old*left.stride,q=right.offset+j*right.stride;
   if(!sourceBin.subarray(p,p+left.size).equals(derivedBin.subarray(q,q+right.size)))mismatches++;
  }
  attrs[key]={comparedVertices:item.vertices,byteMismatches:mismatches};attributeValues+=item.vertices;failures+=mismatches;
 }
 let wrongFaces=0;
 for(let j=0;j<item.triangles;j++){
  const oldFace=trace.readUInt32LE(faceIds.byteOffset+j*4);
  for(let k=0;k<3;k++){
   const newVertex=indexAt(newIndices,derivedBin,j*3+k),oldVertex=trace.readUInt32LE(vertexIds.byteOffset+newVertex*4),expected=indexAt(sourceIndices,sourceBin,oldFace*3+k);if(oldVertex!==expected)wrongFaces++;
  }
 }
 triangles+=item.triangles;failures+=wrongFaces;checks.push({sourceMesh:item.sourceMesh,sourcePrimitive:item.sourcePrimitive,triangles:item.triangles,wrongTriangleCorners:wrongFaces,attributes:attrs});
}
const m=derived.nodes[0].matrix,scale=[0,1,2].map(c=>Math.hypot(m[c*4],m[c*4+1],m[c*4+2])),uniform=Math.max(...scale)-Math.min(...scale)<1e-10;
const result={status:failures?'failed':'exact-source-subset-validated',sourceSha256:hash(source),derivedBinarySha256:hash(derivedBin),traceSha256:hash(trace),sourceHashMatchesAcquisition:hash(source)===report.sourceSha256,trianglesCompared:triangles,vertexAttributesCompared:attributeValues,attributeAndTriangleMismatches:failures,wrapperUniformScale:scale,uniformScaleOnly:uniform,originalMaterialJSONPreserved:JSON.stringify(original.materials)===JSON.stringify(derived.materials),originalUVPresent:report.originalHasUV,originalNormalMapPresent:report.originalHasNormalMap,geometryNormalsPreserved:true,unitConversionVerified:false,checks};
if(!uniform||!result.sourceHashMatchesAcquisition||!result.originalMaterialJSONPreserved||failures)throw Error(JSON.stringify(result));await writeFile(resolve(folder,'attribute-preservation-validation.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,checks:undefined}));
