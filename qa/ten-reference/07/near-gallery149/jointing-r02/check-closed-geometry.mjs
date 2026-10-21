import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const root=process.cwd(),threeUrl=pathToFileURL(resolve(root,'vendor/build/three.module.js')).href;
const T=await import(threeUrl);
// CPU-only geometry inspection: substitute local image decode with a neutral
// pixel. This does not compile a material, render an image or accept fidelity.
T.TextureLoader.prototype.loadAsync=async function(){const t=new T.DataTexture(new Uint8Array([255,255,255,255]),1,1,T.RGBAFormat);return t;};
let utility=await readFile('vendor/examples/jsm/utils/BufferGeometryUtils.js','utf8');
utility=utility.replaceAll("from 'three'",`from '${threeUrl}'`);
const utilUrl='data:text/javascript;base64,'+Buffer.from(utility).toString('base64');
let source=await readFile('reconstructions/scene-07/src/foreground-gallery-roof.js','utf8');
source=source.replaceAll("from 'three'",`from '${threeUrl}'`).replace("from 'three/addons/utils/BufferGeometryUtils.js'",`from '${utilUrl}'`).replace("new URL('../assets/near-gallery149/',import.meta.url).href","'cpu-only://neutral/'");
const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let baselineSource=await readFile('qa/ten-reference/07/near-gallery149/foreground-gallery-roof-before.js','utf8');
baselineSource=baselineSource.replaceAll("from 'three'",`from '${threeUrl}'`).replace("from 'three/addons/utils/BufferGeometryUtils.js'",`from '${utilUrl}'`);
const baseline=await import('data:text/javascript;base64,'+Buffer.from(baselineSource).toString('base64'));
if(JSON.stringify(baseline.FOREGROUND_ROOF_LAYOUT)!==JSON.stringify(module.FOREGROUND_ROOF_LAYOUT))throw Error('Fitted layout changed.');
for(let t=0;t<=1;t+=.1)for(let u=-1;u<=1;u+=.1){const a=baseline.foregroundPoint(t,u),b=module.foregroundPoint(t,u);if(a.some((v,i)=>v!==b[i]))throw Error('Physical roof profile changed.');}
let r01Source=await readFile('qa/ten-reference/07/near-gallery149/jointing-r02/foreground-gallery-roof-held-r01.js','utf8');
r01Source=r01Source.replaceAll("from 'three'",`from '${threeUrl}'`).replace("from 'three/addons/utils/BufferGeometryUtils.js'",`from '${utilUrl}'`).replace("new URL('../assets/near-gallery149/',import.meta.url).href","'cpu-only://neutral/'");
const r01=await import('data:text/javascript;base64,'+Buffer.from(r01Source).toString('base64'));
const oldCapPoses=[];
r01.buildForegroundGalleryRoof({emit(g,m,x,y,z,sx=1,sy=1,sz=1,rot=[0,0,0]){if(g.name==='gallery-closed-rounded-six-scroll-cast-relief')oldCapPoses.push({position:[x,y,z],rotation:rot});},rod(){},box(){}});
const unique=new Map(),placements=[];
const build=module.buildForegroundGalleryRoof({emit(g,m,x,y,z,sx=1,sy=1,sz=1,rot=[0,0,0]){unique.set(g.uuid,{g,m});placements.push({g:g.name,material:m.name,position:[x,y,z],rotation:rot,scale:[sx,sy,sz]});},rod(){},box(){}});
function inspect({g,m}){
 const p=g.attributes.position,ix=g.index.array,edges=new Map(),directions=new Map();let volume=0,minNormal=1,nonfinite=0;
 for(let i=0;i<p.array.length;i++)if(!Number.isFinite(p.array[i]))nonfinite++;
 for(let i=0;i<ix.length;i+=3){const a=ix[i],b=ix[i+1],c=ix[i+2],v=new T.Vector3().fromBufferAttribute(p,a),w=new T.Vector3().fromBufferAttribute(p,b),z=new T.Vector3().fromBufferAttribute(p,c);volume+=v.dot(w.cross(z))/6;for(const[u,v]of[[a,b],[b,c],[c,a]]){const k=u<v?`${u},${v}`:`${v},${u}`;edges.set(k,(edges.get(k)||0)+1);const d=`${u},${v}`;directions.set(d,(directions.get(d)||0)+1);}}
 g.computeBoundingBox();return{name:g.name,material:m.name,vertices:p.count,triangles:ix.length/3,nonfinite,volume,nonManifoldEdges:[...edges.values()].filter(v=>v!==2).length,inconsistentDirectedEdges:[...directions.entries()].filter(([k,count])=>{const [a,b]=k.split(',');return count!==1||directions.get(`${b},${a}`)!==1;}).length,bounds:[g.boundingBox.min.toArray(),g.boundingBox.max.toArray()],userData:g.userData};
}
const newCapPoses=placements.filter(p=>p.g==='gallery-closed-rounded-six-scroll-cast-relief').map(({position,rotation})=>({position,rotation}));
if(JSON.stringify(oldCapPoses)!==JSON.stringify(newCapPoses))throw Error('Held medallion anchors/matrices changed.');
const geometries=[...unique.values()].map(inspect),result={scope:'CPU geometry inspection only; not native render, shading validation or photographic fidelity.',layout:module.FOREGROUND_ROOF_LAYOUT,baselineLayoutAndProfileIdentical:true,r01MedallionAnchorsAndMatricesIdentical:true,medallionCount:oldCapPoses.length,audit:build.audit,geometryCount:geometries.length,placements:placements.length,geometries,visualAccepted:false};
await writeFile('qa/ten-reference/07/near-gallery149/jointing-r02/closed-geometry-audit.json',JSON.stringify(result,null,2)+'\n');
if(geometries.some(g=>g.nonfinite||g.nonManifoldEdges||g.inconsistentDirectedEdges||g.volume<=0))throw Error('Closed geometry has a nonfinite, winding or topology failure.');
console.log(JSON.stringify({geometryCount:geometries.length,placements:placements.length,closed:true,positiveVolume:true,consistentOrientation:true,r01CapMatricesPreserved:true,counts:build.audit.counts,cast:geometries.filter(g=>g.name.includes('six-scroll')).map(g=>({triangles:g.triangles,volume:g.volume,bounds:g.bounds})),layout:module.FOREGROUND_ROOF_LAYOUT,visualAccepted:false},null,2));
