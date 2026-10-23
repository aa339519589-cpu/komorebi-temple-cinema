import {pathToFileURL} from 'node:url';
import {resolve as pathResolve} from 'node:path';
const root=pathResolve(new URL('../..',import.meta.url).pathname);
export async function resolve(name,context,next){if(name==='three')return{url:pathToFileURL(pathResolve(root,'vendor/build/three.module.js')).href,shortCircuit:true};if(name.startsWith('three/addons/'))return{url:pathToFileURL(pathResolve(root,'vendor/examples/jsm',name.slice(13))).href,shortCircuit:true};return next(name,context);}
