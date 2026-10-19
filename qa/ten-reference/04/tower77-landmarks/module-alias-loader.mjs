const root=new URL('../../../../',import.meta.url);
export async function resolve(s,c,next){if(s==='three')return{url:new URL('vendor/build/three.module.js',root).href,shortCircuit:true};return next(s,c);}
