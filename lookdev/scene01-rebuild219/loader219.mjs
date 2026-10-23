const root=new URL('../../',import.meta.url);
export async function resolve(specifier,context,next){
 if(specifier==='three')return{url:new URL('vendor/build/three.module.js',root).href,shortCircuit:true};
 if(specifier.startsWith('three/addons/'))return{url:new URL('vendor/examples/jsm/'+specifier.slice(13),root).href,shortCircuit:true};
 return next(specifier,context);
}
