import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve as pathResolve,dirname} from 'node:path';
const root=pathResolve(dirname(fileURLToPath(import.meta.url)),'../..');
export async function resolve(specifier,context,nextResolve){
 if(specifier==='three')return {url:pathToFileURL(root+'/vendor/build/three.module.js').href,shortCircuit:true};
 if(specifier.startsWith('three/addons/'))return {url:pathToFileURL(root+'/vendor/examples/jsm/'+specifier.slice(13)).href,shortCircuit:true};
 return nextResolve(specifier,context);
}
