import {pathToFileURL} from 'node:url';
const root=new URL('../../../',import.meta.url);
export async function resolve(specifier,context,nextResolve){
 if(specifier==='three')return nextResolve(new URL('vendor/build/three.module.js',root).href,context);
 if(specifier.startsWith('three/addons/'))return nextResolve(new URL('vendor/examples/jsm/'+specifier.slice(13),root).href,context);
 return nextResolve(specifier,context);
}
