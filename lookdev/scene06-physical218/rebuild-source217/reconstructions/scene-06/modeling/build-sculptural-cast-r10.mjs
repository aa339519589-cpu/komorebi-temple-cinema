// CPU-only procedural source export for the real three-dimensional R10 source-led casts.
// Run from repository root, then run fuse-sculptural-cast-r10.py with the shared
// tools/run-blender-queued.mjs wrapper. No photographic pixels enter geometry.
import {registerHooks} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=process.cwd();
registerHooks({resolve(specifier,context,next){
 if(specifier==='three')return{url:pathToFileURL(resolve(root,'vendor/build/three.module.js')).href,shortCircuit:true};
 if(specifier.startsWith('three/addons/'))return{url:pathToFileURL(resolve(root,'vendor/examples/jsm',specifier.slice(13))).href,shortCircuit:true};
 return next(specifier,context);
}});
const {restoredBuddhaParts}=await import('../src/restoration-buddha.js');
const out=resolve(root,'qa/ten-reference/06/sculptural-cast-r10-build/raw');await mkdir(out,{recursive:true});
const manifest={revision:'scene06-sculptural-cast-r10',source:'reconstructions/scene-06/src/restoration-buddha.js',sourceSha256:createHash('sha256').update(await readFile(resolve(root,'reconstructions/scene-06/src/restoration-buddha.js'))).digest('hex'),variants:{},visualAccepted:false};
for(const variant of['central','left','right']){
 manifest.variants[variant]=[];
 for(const {geometry:g,material}of restoredBuddhaParts(variant)){
  const p=g.attributes.position.array,ix=g.index.array,indices=new Uint32Array(ix),head=Buffer.alloc(12);head.write('R7RW');head.writeUInt32LE(p.length/3,4);head.writeUInt32LE(indices.length,8);
  const name=`${variant}-${material}.raw.bin`;await writeFile(resolve(out,name),Buffer.concat([head,Buffer.from(p.buffer,p.byteOffset,p.byteLength),Buffer.from(indices.buffer)]));
  manifest.variants[variant].push({material,file:name,vertices:p.length/3,triangles:indices.length/3,parts:g.userData.parts});
  console.log(JSON.stringify({variant,material,vertices:p.length/3,triangles:indices.length/3}));
 }
}
await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('Exported editable procedural casts to '+out);
