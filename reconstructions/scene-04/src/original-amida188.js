import * as T from 'three';

// Original unpaired Scan-the-World Japanese Amida, personal noncommercial
// CC BY-NC-SA4.0. Decode the compact original; do not retopologize, weld,
// reflect, alter anatomy, repair hands or recompute its source normals.
export async function loadOriginalAmida188(){
 const base=new URL('../assets/amida188-CC-BY-NC-SA-4.0/',import.meta.url),decoderBase=new URL('draco/',base);
 if(!globalThis.DracoDecoderModule)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('draco_wasm_wrapper.js',decoderBase).href;script.onload=resolve;script.onerror=()=>reject(Error('Local Apache2 Draco decoder did not load'));document.head.appendChild(script);});
 const [sourceResponse,wasmResponse]=await Promise.all([fetch(new URL('original-source-CC-BY-NC-SA-4.0.glb',base)),fetch(new URL('draco_decoder.wasm',decoderBase))]);
 if(!sourceResponse.ok||!wasmResponse.ok)throw Error('Original Japanese Amida source/decoder missing');
 const bytes=await sourceResponse.arrayBuffer(),draco=await globalThis.DracoDecoderModule({wasmBinary:await wasmResponse.arrayBuffer()}),view=new DataView(bytes),jsonLength=view.getUint32(12,true),gltf=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,jsonLength))),binStart=28+jsonLength,primitive=gltf.meshes[0].primitives[0],extension=primitive.extensions.KHR_draco_mesh_compression,bufferView=gltf.bufferViews[extension.bufferView],encoded=new Int8Array(bytes,binStart+(bufferView.byteOffset||0),bufferView.byteLength);
 const decoder=new draco.Decoder(),buffer=new draco.DecoderBuffer();buffer.Init(encoded,encoded.byteLength);const mesh=new draco.Mesh(),status=decoder.DecodeBufferToMesh(buffer,mesh);
 if(!status.ok())throw Error('Original Amida decode failed: '+status.error_msg());
 const count=mesh.num_points(),faces=mesh.num_faces(),attributes={};
 for(const [name,id]of Object.entries(extension.attributes)){
  const attr=decoder.GetAttributeByUniqueId(mesh,id),components=attr.num_components(),n=count*components,ptr=draco._malloc(n*4);
  try{if(!decoder.GetAttributeDataArrayForAllPoints(mesh,attr,draco.DT_FLOAT32,n*4,ptr))throw Error('Amida '+name+' did not decode');attributes[name]=new Float32Array(draco.HEAPF32.buffer,ptr,n).slice();}finally{draco._free(ptr);}
 }
 const indexBytes=faces*3*4,indexPointer=draco._malloc(indexBytes);let indices;
 try{if(!decoder.GetTrianglesUInt32Array(mesh,indexBytes,indexPointer))throw Error('Amida source indices did not decode');indices=new Uint32Array(draco.HEAPU32.buffer,indexPointer,faces*3).slice();}finally{draco._free(indexPointer);}
 draco.destroy(mesh);draco.destroy(buffer);draco.destroy(decoder);draco.destroy(status);
 if(indices.length!==1137366||count!==gltf.accessors[primitive.attributes.POSITION].count)throw Error('Original Amida source identity changed');
 for(const data of Object.values(attributes))for(const n of data)if(!Number.isFinite(n))throw Error('Nonfinite source sculpture');
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(attributes.POSITION,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(attributes.NORMAL,3));geometry.setIndex(new T.BufferAttribute(indices,1));geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.name='original-Japanese-Amida188-unpaired-CC-BY-NC-SA4';
 const bounds=geometry.boundingBox.clone(),size=bounds.getSize(new T.Vector3()),centre=bounds.getCenter(new T.Vector3()),mounts=[];
 return{geometry,bounds,size,emitOnAltar(emit,material,{topY=1.065,height=1.55,centreZ=.04}={}){
  const scale=height/size.y,x=-centre.x*scale,y=topY-bounds.min.y*scale,z=centreZ-centre.z*scale;
  if(!(scale>0))throw Error('Amida fit requires a positive uniform scale');emit(geometry,material,x,y,z,scale,scale,scale);
  const row={scale,topY,worldSourceBottom:bounds.min.y*scale+y,worldSourceCrown:bounds.max.y*scale+y,sourcePlinthWidth:size.x*scale,sourcePlinthDepth:size.z*scale,position:[x,y,z],orientation:'+Y up / +Z front, original axes unchanged',anatomyPoseNormalsAndIndicesUnmodified:true};mounts.push(row);return row;
 },info(){return{title:'Seated Amida, the Buddha of the Western Paradise at the Sainsbury Centre for Visual Arts, Norwich',author:'Scan-the-World',source:'https://doi.org/10.5281/zenodo.21353739',license:'CC-BY-NC-SA-4.0',personalNoncommercialUseOnly:true,derivedImageryLicense:'CC-BY-NC-SA-4.0',sourceSha256:'96e474a19a4108d0e2e331172d0601fe74518157dca35d61bfef566d7618e3ec',vertices:count,triangles:faces,rawBounds:[bounds.min.toArray(),bounds.max.toArray()],mounts,originalUnpairedPose:true,originalRectangularPlinthRetained:true,sourceFaceGeometryUnchanged:true,positiveUniformFittingOnly:true,exactReferenceArtifact:false,visualAccepted:false};}};
}
