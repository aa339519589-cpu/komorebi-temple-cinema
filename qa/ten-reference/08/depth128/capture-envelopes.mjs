// Terrain127 physical audit. Builds the actual current mesh arrays on the CPU.
// Source instrumentation is in memory; no runtime file or image is modified.
// Image samplers are 1px placeholders because ray intersections use geometry,
// not texture pixels. Local glTF buffer geometry is loaded unchanged.
import {registerHooks} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=new URL('../../../../',import.meta.url),sceneURL=new URL('reconstructions/scene-08/src/scene.js',root).href;
const records=[],groupStack=[];Error.stackTraceLimit=24;
function frames(){return new Error().stack.split('\n').slice(2).filter(s=>s.includes('/reconstructions/scene-08/')).map(s=>s.trim().replaceAll(root.href,''));}
globalThis.__occluderDebug={
 group(args){const r={args,source:frames()};groupStack.push(r);},ungroup(){groupStack.pop();},
 record(role,g,ma,args,kind){const name=typeof ma==='string'?ma:ma.name,gray=['stone','carvedstone','rock'].includes(name)||name?.includes('rock01');const r={recordId:records.length,role,geometryType:g.type,material:name,kind,args,groups:groupStack.map(g=>({args:g.args,source:g.source.slice(0,4)})),source:gray?frames():undefined};records.push(r);return r;},
};
registerHooks({
 resolve(s,c,next){if(s==='three')return next(new URL('vendor/build/three.module.js',root).href,c);if(s.startsWith('three/addons/'))return next(new URL('vendor/examples/jsm/'+s.slice(13),root).href,c);return next(s,c);},
 load(url,context,next){const loaded=next(url,context);if(url===sceneURL){let s=String(loaded.source);s=s.replace('b.items.push({matrix,tint});',"b.items.push({matrix,tint,debug:globalThis.__occluderDebug.record(role,g,ma,{position:[x,y,z],scale:[sx,sy,sz],rotation:rot},'emit')});");s=s.replace('bucket.items.push({matrix:m,tint:1});',"bucket.items.push({matrix:m,tint:1,debug:globalThis.__occluderDebug.record(role,g,ma,{a,b,r,round,depth},'between')});");s=s.replace('fn();stack.pop();}',"globalThis.__occluderDebug.group([x,y,z,yaw,scale]);try{fn();}finally{globalThis.__occluderDebug.ungroup();stack.pop();}}");s=s.replace('const mesh=new T.InstancedMesh(g,m,items.length);','const mesh=new T.InstancedMesh(g,m,items.length);mesh.userData.debugRecords=items.map(i=>i.debug);');return{...loaded,source:s};}if(url.endsWith('/reconstructions/scene-08/src/hero-garden-rock.js')){const s=String(loaded.source).replace("'/assets/polyhaven/rock-moss-set-01/rock_moss_set_01_4k.gltf'",JSON.stringify(new URL('assets/polyhaven/rock-moss-set-01/rock_moss_set_01_4k.gltf',root).href));return{...loaded,source:s};}return loaded;},
});
const T=await import(new URL('vendor/build/three.module.js',root));
globalThis.self=globalThis;
globalThis.ProgressEvent=class{constructor(type,values){this.type=type;Object.assign(this,values);}};
const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,options)=>{const uri=typeof input==='string'?input:input.url;if(uri.startsWith('file:')){const bytes=await readFile(new URL(uri));return new Response(bytes,{status:200,headers:{'Content-Length':String(bytes.length)}});}if(uri.startsWith('data:')||uri.startsWith('blob:'))return originalFetch(input,options);throw Error('CPU audit forbids network fetch: '+uri);};
const omittedImages=[];T.TextureLoader.prototype.load=function(url,onLoad){omittedImages.push(url);const texture=new T.Texture({width:1,height:1});queueMicrotask(()=>onLoad?.(texture));return texture;};
const {buildScene}=await import(sceneURL),world=await buildScene(),scene=world.scene;scene.updateMatrixWorld(true);

const components=[{name:'fitted-hall',origin:[-6.7,2.95,-5.8],yaw:.08,role:'left-grand-hall'},{name:'wing',origin:[-1.86,1.5,-7.5],yaw:-.55,role:'left-grand-hall'},{name:'middle-gallery',origin:[1.47,4.28,-9],yaw:-.1,role:'layered-walkways'},{name:'right-gallery',origin:[7.9,3.7,-10],yaw:-.15,role:'layered-walkways'},{name:'pagoda',origin:[4.7,3.016,-24],yaw:-.4,role:'five-tier-pagoda'},{name:'west-legacy',origin:[-3.25,.1,-10],yaw:.13,role:'layered-walkways'},{name:'east-legacy',origin:[6.8,0,-13],yaw:0,role:'layered-walkways'},{name:'rear-legacy',origin:[1.7,0,-18],yaw:0,role:'layered-walkways'}];
for(const C of components){C.bounds=new T.Box3();C.partCount=0;C.parent=new T.Matrix4().makeTranslation(...C.origin).multiply(new T.Matrix4().makeRotationY(C.yaw));C.inverse=C.parent.clone().invert();}
const m=new T.Matrix4(),b=new T.Box3();scene.traverse(o=>{if(!o.isInstancedMesh)return;o.geometry.computeBoundingBox();for(let i=0;i<o.count;i++){const r=o.userData.debugRecords?.[i],g=r?.groups?.[0]?.args;if(!g)continue;const C=components.find(C=>C.role===r.role&&C.origin.every((v,j)=>Math.abs(v-g[j])<1e-8));if(!C)continue;o.getMatrixAt(i,m);m.premultiply(C.inverse);b.copy(o.geometry.boundingBox).applyMatrix4(m);C.bounds.union(b);C.partCount++;}});
const data=components.map(({name,origin,yaw,role,bounds,partCount})=>({name,origin,yaw,role,localEnvelope:{min:bounds.min.toArray(),max:bounds.max.toArray()},partCount,envelopeContains:'Every generated mesh/instance bounding box transformed into the whole assembly frame, including roofs, horns, walls, floors and bases; conservative empty interior included.'}));await writeFile(new URL('./component-envelopes.json',import.meta.url),JSON.stringify(data,null,2));console.log(JSON.stringify(data,null,2));world.dispose();
