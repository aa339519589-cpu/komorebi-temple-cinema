import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {registerHooks} from 'node:module';
const root=path.resolve(import.meta.dirname,'../../..');
registerHooks({resolve(specifier,context,next){if(specifier==='three')return {url:pathToFileURL(root+'/vendor/build/three.module.js').href,shortCircuit:true};if(specifier.startsWith('three/addons/'))return {url:pathToFileURL(root+'/vendor/examples/jsm/'+specifier.slice(13)).href,shortCircuit:true};return next(specifier,context);}});
let source=fs.readFileSync(root+'/reconstructions/scene-07/src/main.js','utf8');
source=source.replace("from 'three'",`from '${pathToFileURL(root+'/vendor/build/three.module.js')}'`)
.replace("from 'three/addons/objects/Reflector.js'",`from '${pathToFileURL(root+'/reconstructions/scene-07/src/cpu-reflector.mjs')}'`)
.replace("from './boulder.js'",`from '${pathToFileURL(root+'/reconstructions/scene-07/src/boulder.js')}'`)
.replace("new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'})","({setSize(){},setPixelRatio(){},shadowMap:{},domElement:{},setRenderTarget(){},render(){},dispose(){}})");
source=source.replace("from './architecture-kernel.js'",`from '${pathToFileURL(root+'/reconstructions/scene-07/src/architecture-kernel.js')}'`).replace("from './sanctuary.js'",`from '${pathToFileURL(root+'/reconstructions/scene-07/src/sanctuary.js')}'`);
source=source.replace("import {Reflector} from '"+pathToFileURL(root+'/reconstructions/scene-07/src/cpu-reflector.mjs')+"';",`class Reflector extends T.Mesh{constructor(g){super(g,new T.MeshBasicMaterial());this.material.uniforms={color:{value:new T.Color()}};}}`);
globalThis.location={search:'?render&defer&w=768&h=768'};globalThis.document={body:{append(){}},createElement(){return {getContext(){return {createLinearGradient(){return {addColorStop(){}}},fillRect(){}}}}}};globalThis.window={};
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const t=window.temple;if(!t.ready)throw Error('Not ready');
let bad=0;t.scene.traverse(o=>{let old=bad;if(o.isInstancedMesh){for(const value of o.instanceMatrix.array)if(!Number.isFinite(value))bad++;}if(o.geometry){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)if(!Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)))bad++;}if(bad>old)console.log("BAD",o.geometry?.type,o.material?.color?.getHexString(),o.count,bad-old,Array.from(o.instanceMatrix?.array.slice(0,16)||[]));});
if(bad)throw Error(`Nonfinite values: ${bad}`);t.renderReference(7);t.renderShot(0);t.renderShot(7);console.log(JSON.stringify({cpuOnly:true,...t.info(),nonfinite:bad},null,2));
