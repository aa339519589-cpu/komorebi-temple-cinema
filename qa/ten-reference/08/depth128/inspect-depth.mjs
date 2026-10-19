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

const camera=new T.PerspectiveCamera(49,1,.06,180);camera.position.set(0,2.65,13);camera.lookAt(0,6.65,-9);camera.updateMatrixWorld(true);
const galleries=[{name:'west-legacy',position:[-3.25,.1,-10],yaw:.13,w:7.5,d:7.4,h:2.9,raised:3.5},{name:'east-legacy',position:[6.8,0,-13],yaw:0,w:10.8,d:7.2,h:2.8,raised:2.5},{name:'rear-legacy',position:[1.7,0,-18],yaw:0,w:10,d:5.8,h:2.9,raised:1.5}],assemblies=[];
const matrix=new T.Matrix4();for(const G of galleries){const a={...G,parts:[],worldBounds:new T.Box3(),projectedBounds:{min:[Infinity,Infinity],max:[-Infinity,-Infinity]}};scene.traverse(o=>{if(!o.isInstancedMesh)return;o.geometry.computeBoundingBox();const p=o.geometry.attributes.position;for(let i=0;i<o.count;i++){const r=o.userData.debugRecords?.[i],g=r?.groups?.[0]?.args;if(r?.role!=='layered-walkways'||!g||!G.position.every((v,j)=>Math.abs(v-g[j])<1e-8))continue;o.getMatrixAt(i,matrix);const box=o.geometry.boundingBox.clone().applyMatrix4(matrix);a.worldBounds.union(box);a.parts.push({geometryType:o.geometry.type,material:o.material.name,geometryName:o.geometry.name,matrix:matrix.toArray(),localBounds:{min:o.geometry.boundingBox.min.toArray(),max:o.geometry.boundingBox.max.toArray()}});for(let v=0;v<p.count;v++){const q=new T.Vector3().fromBufferAttribute(p,v).applyMatrix4(matrix).project(camera),pixel=[(q.x+1)*627,(1-q.y)*627];for(let j=0;j<2;j++){a.projectedBounds.min[j]=Math.min(a.projectedBounds.min[j],pixel[j]);a.projectedBounds.max[j]=Math.max(a.projectedBounds.max[j],pixel[j]);}}}});a.worldBounds={min:a.worldBounds.min.toArray(),max:a.worldBounds.max.toArray()};assemblies.push(a);}
const hits=[],ray=new T.Raycaster();for(let y=450;y<=850;y+=20)for(let x=200;x<=1140;x+=20){ray.setFromCamera(new T.Vector2(x/627-1,1-y/627),camera);const h=ray.intersectObjects(scene.children,false)[0],r=h?.object.userData.debugRecords?.[h.instanceId??0],g=r?.groups?.[0]?.args;const G=g&&galleries.find(G=>G.position.every((v,j)=>Math.abs(v-g[j])<1e-8));if(G&&r?.role==='layered-walkways')hits.push({pixel:[x,y],assembly:G.name,material:h.object.material.name,point:h.point.toArray()});}
const compact=assemblies.map(({parts,...a})=>({...a,partCount:parts.length,materialCounts:parts.reduce((n,p)=>(n[p.material]=(n[p.material]||0)+1,n),{})}));await writeFile(new URL('./assembly-inventory.json',import.meta.url),JSON.stringify({camera:{position:camera.position.toArray(),target:[0,6.65,-9],fov:49},assemblies:compact,visibleRaySamples:hits},null,2));console.log(JSON.stringify({assemblies:assemblies.map(a=>({...a,parts:a.parts.length})),visibleRaySamples:hits},null,2));world.dispose();
