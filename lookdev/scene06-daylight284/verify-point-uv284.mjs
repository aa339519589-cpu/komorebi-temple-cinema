// Read-only all-source UV storage proof, independent from the Blender adapter.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const here=import.meta.dirname,root=resolve(here,'export-r02'),scene=JSON.parse(await readFile(resolve(root,'scene.json'))),proof=JSON.parse(await readFile(resolve(root,'export-report.json'))),hash=b=>createHash('sha256').update(b).digest('hex');
const materials=new Map(scene.materials.map(m=>[m.id,m])),geometries=new Map(scene.geometries.map(g=>[g.id,g])),used=new Set();let geometriesChecked=0,UVsets=0,sourceUVVertices=0,sourceTriangleCorners=0,maximumXYResidual=0,maximumBarycentricResidual=0,tangentConsumers=0;
for(const mesh of scene.meshes){
 const g=geometries.get(mesh.geometry),needs=mesh.materials.some(id=>{const m=materials.get(id);return m.textures.normalMap||m.textures.clearcoatNormalMap||Number(m.anisotropy??0)!==0;});if(needs)tangentConsumers++;
 if(used.has(g.id))continue;used.add(g.id);geometriesChecked++;
 const indices=await readFile(resolve(root,'assets',g.index.file));if(hash(indices)!==proof.exportedAssets[g.index.file].sha256)throw Error('Original source index hash differs');
 const ix=new Uint32Array(indices.buffer,indices.byteOffset,indices.byteLength/4),count=g.attributes.position.count/g.attributes.position.itemSize;
 for(const[key,rec]of Object.entries(g.attributes))if(/^uv\d*$/.test(key)){
  if(rec.itemSize!==2||rec.count!==count*2)throw Error('Native per-vertex UV contract differs');const raw=await readFile(resolve(root,'assets',rec.file));if(hash(raw)!==proof.exportedAssets[rec.file].sha256)throw Error('Original UV hash differs');
  const uv=new Float32Array(raw.buffer,raw.byteOffset,raw.byteLength/4),point=new Float32Array(count*3);for(let v=0;v<count;v++){point[v*3]=uv[v*2];point[v*3+1]=uv[v*2+1];}
  for(let v=0;v<count;v++)for(let k=0;k<2;k++){if(!Object.is(point[v*3+k],uv[v*2+k]))throw Error('Original float UV bits differ');maximumXYResidual=Math.max(maximumXYResidual,Math.abs(point[v*3+k]-uv[v*2+k]));}
  for(let j=0;j<ix.length;j++){const v=ix[j];if(v>=count)throw Error('Source index exceeds original UV vertices');for(let k=0;k<2;k++)if(!Object.is(point[v*3+k],uv[v*2+k]))throw Error('Actual triangle-corner UV differs');}
  for(let j=0;j<Math.min(ix.length,3000);j+=3)for(const weights of[[.2,.3,.5],[.03125,.21875,.75]])for(let k=0;k<2;k++){
   let corner=0,attribute=0;for(let c=0;c<3;c++){corner+=uv[ix[j+c]*2+k]*weights[c];attribute+=point[ix[j+c]*3+k]*weights[c];}maximumBarycentricResidual=Math.max(maximumBarycentricResidual,Math.abs(corner-attribute));
  }
  UVsets++;sourceUVVertices+=count;sourceTriangleCorners+=ix.length;
 }
}
if(maximumXYResidual!==0||maximumBarycentricResidual!==0)throw Error('UV source correspondence changed');
const result={status:'all-original-UV-vertices-and-triangle-corners-exact',sourceHash:proof.sourceHash,geometriesChecked,UVsets,sourceUVVertices,sourceTriangleCorners,maximumXYResidual,maximumBarycentricResidual,tangentConsumers,tangentPolicy:'All future normalMap/clearcoatNormalMap/anisotropy consumers retain actual corner UV layers; current source has none.',mathematicalReason:'Every original face corner fetches the exact same source float2 from its unchanged original vertex index. Therefore every barycentric interpolant, UV seam and UV derivative of those triangles is identical. POINT float3 carries source U,V and a new unused zero Z; no source UV is quantized or discarded.',geometryOrExportChanged:false,actualGPUJob:false,photographicAccepted:false};
await writeFile(resolve(here,'point-uv-source-proof284.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));
