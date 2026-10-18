// CPU geometry/transform validation only; this does not substitute for actual GPU review.
import fs from 'node:fs';
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})})};
const {buildReference6Scene}=await import('../../../reconstructions/scene-06/src/reference6-scene.js');
const r=buildReference6Scene();let meshes=0,instances=0,triangles=0;
r.scene.traverse(o=>{if(!o.isMesh)return;meshes++;instances+=o.isInstancedMesh?o.count:1;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);for(const x of o.geometry.attributes.position.array)if(!Number.isFinite(x))throw Error('Nonfinite vertex: '+o.name);if(o.isInstancedMesh)for(const x of o.instanceMatrix.array)if(!Number.isFinite(x))throw Error('Nonfinite instance transform: '+o.name);});
const result={revision:r.configuration.revision,meshes,instances,triangles,geometryFinite:true,gpuValidated:false,visualAccepted:false};
fs.writeFileSync(new URL('./cpu-validation.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
