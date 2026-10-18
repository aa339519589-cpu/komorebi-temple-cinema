import fs from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
let source=fs.readFileSync(path.join(root,'reconstructions/scene-08/src/scene.js'),'utf8')
.replace("from 'three'",`from '${pathToFileURL(path.join(root,'vendor/build/three.module.js'))}'`)
.replace("from './rocks.js'",`from '${pathToFileURL(path.join(root,'reconstructions/scene-08/src/rocks.js'))}'`);
const {buildScene}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const result=buildScene();
let invalid=0;
result.scene.traverse(object=>{if(object.isInstancedMesh){for(const n of object.instanceMatrix.array)if(!Number.isFinite(n))invalid++;}if(object.geometry){for(const n of object.geometry.attributes.position.array)if(!Number.isFinite(n))invalid++;}});
if(invalid)throw Error(`${invalid} non-finite geometry values`);
console.log(JSON.stringify({...result.stats,objects:result.scene.children.length,nonFiniteValues:invalid},null,2));
result.dispose();
