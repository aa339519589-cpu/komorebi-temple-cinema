import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve as pathResolve} from 'node:path';
const root=fileURLToPath(new URL('../../../',import.meta.url));
export function resolve(specifier,context,next){
 if(specifier==='three')return{url:pathToFileURL(pathResolve(root,'vendor/build/three.module.js')).href,shortCircuit:true};
 if(specifier.startsWith('three/addons/'))return{url:pathToFileURL(pathResolve(root,'vendor/examples/jsm',specifier.slice(13))).href,shortCircuit:true};
 return next(specifier,context);
}
