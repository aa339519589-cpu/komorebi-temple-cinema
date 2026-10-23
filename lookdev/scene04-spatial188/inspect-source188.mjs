import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import {loadSpatial188Assets} from '../../reconstructions/scene-04/src/licensed-carving188.js';
globalThis.self=globalThis;
globalThis.ProgressEvent=class ProgressEvent{constructor(type,data){this.type=type;Object.assign(this,data);}};
globalThis.fetch=async input=>new Response(await readFile(new URL(typeof input==='string'||input instanceof URL?input:input.url)),{status:200});
const context={WebAssembly,Promise,TextDecoder,TextEncoder,ArrayBuffer,Uint8Array,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,Float32Array,Float64Array,Math,Date,console,setTimeout,clearTimeout,performance};context.globalThis=context;
vm.runInNewContext(await readFile('reconstructions/scene-04/assets/amida188-CC-BY-NC-SA-4.0/draco/draco_wasm_wrapper.js','utf8'),context);
globalThis.DracoDecoderModule=context.DracoDecoderModule;
const assets=await loadSpatial188Assets(),info=assets.info();let vertices=0,nonfinite=0;
for(const g of assets.parts){vertices+=g.attributes.position.count;for(const k of['position','normal'])for(const v of g.attributes[k].array)if(!Number.isFinite(v))nonfinite++;}
if(nonfinite||vertices!==1124928)throw Error('Source geometry identity or finite-attribute failure');
const report={status:'CPU-source-geometry-inspected-no-render',referencePhotoOrDepthUsed:false,originalComponentPositionsNormalsAndTrianglesCopied:true,finiteAttributes:true,...info};
await writeFile('lookdev/scene04-spatial188/source188-geometry-inspection.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({vertices,triangles:info.floral.triangles,bounds:info.floral.nativeBounds,finite:true,cloudCapTriangles:info.cloud.capTriangles,amida:info.amida}));
