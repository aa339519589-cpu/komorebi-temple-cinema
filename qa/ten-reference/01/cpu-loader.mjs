import {pathToFileURL} from 'node:url';
import {resolve as pathResolve} from 'node:path';
const root=pathResolve(import.meta.dirname,'../../..');
export function resolve(specifier,context,nextResolve){if(specifier==='three')return{url:pathToFileURL(pathResolve(root,'vendor/build/three.module.js')).href,shortCircuit:true};if(specifier.startsWith('three/addons/'))return{url:pathToFileURL(pathResolve(root,'vendor/examples/jsm',specifier.slice('three/addons/'.length))).href,shortCircuit:true};return nextResolve(specifier,context);}
