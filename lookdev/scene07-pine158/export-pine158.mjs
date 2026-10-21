import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import * as T from '../../vendor/build/three.module.js';

const here=dirname(fileURLToPath(import.meta.url)),out=resolve(here,process.env.PINE_REVISION||'r01');await mkdir(out,{recursive:true});
const source=await readFile(resolve(here,'hero-pines158.js'),'utf8');
const moduleText=source.replace("from 'three'",'from '+JSON.stringify(pathToFileURL(resolve(here,'../../vendor/build/three.module.js')).href));
const module=await import('data:text/javascript;base64,'+Buffer.from(moduleText).toString('base64'));
const chunks=[],meshes=[],trees=[];let byteOffset=0;
function storeArray(array,type) {
  const padding=(4-byteOffset%4)%4;if(padding){chunks.push(Buffer.alloc(padding));byteOffset+=padding;}
  const bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength),info={byteOffset,byteLength:bytes.length,count:array.length,type};chunks.push(bytes);byteOffset+=bytes.length;return info;
}
function geometry(g,role) {
  const attributes={};
  for(const [key,attribute] of Object.entries(g.attributes)) {
    const raw=attribute.array.slice();
    if(key==='position'||key==='normal')for(let i=0;i<raw.length;i+=3){const y=raw[i+1];raw[i+1]=-raw[i+2];raw[i+2]=y;}
    attributes[key]={...storeArray(raw,'Float32'),itemSize:attribute.itemSize};
  }
  const index=g.index?storeArray(new Uint32Array(g.index.array),'Uint32'):null;
  const id=meshes.length;meshes.push({name:g.name,role,attributes,index});return id;
}
const variants=Array.from({length:12},(_,i)=>module.createPineShoot158(158701+i*73)).map(v=>({needle:geometry(v.needle,'needle'),interior:v.interior?.attributes.position.count?geometry(v.interior,'interior'):null,twig:geometry(v.twig,'twig')}));
const C=new T.Matrix4().makeRotationX(Math.PI/2),Ci=C.clone().invert();
for(const origin of module.HERO_PINE_ORIGINS.slice(0,2)) {
  const tree=module.buildPineGeometry158(origin),bark=geometry(tree.bark,'bark'),cuts=geometry(tree.cuts,'cut');
  const instances=tree.shoots.map(item=>{
    const m=new T.Matrix4().compose(new T.Vector3(...item.p),new T.Quaternion().setFromEuler(new T.Euler(...item.rotation)),new T.Vector3(item.scale,item.scale,item.scale));
    const b=C.clone().multiply(m).multiply(Ci);
    return {variant:item.variant,matrix:b.elements.map(v=>Math.round(v*1e7)/1e7),tip:item.material==='heroPineNeedleTip148',tint:item.tint};
  });
  trees.push({id:origin.id,origin,bark,cuts,instances,stats:tree.stats});
}
// Regression check: this exact replay is part of the148 downstream layout contract.
const oldSource=await readFile(resolve(here,'../../reconstructions/scene-07/src/hero-pines148.js'),'utf8');
const oldModule=await import('data:text/javascript;base64,'+Buffer.from(oldSource.replace("from 'three'",'from '+JSON.stringify(pathToFileURL(resolve(here,'../../vendor/build/three.module.js')).href))).toString('base64'));
const randomReplay=[0,1,7118,148031,4294967295].map(seed=>({seed,old:oldModule.advanceLegacyPineRandom148(seed),candidate:module.advanceLegacyPineRandom148(seed)}));
if(randomReplay.some(x=>x.old!==x.candidate))throw Error('Legacy random replay mismatch');
const sameOrigins=module.HERO_PINE_ORIGINS.every((p,i)=>['id','x','z','h','spread','yaw','seed'].every(k=>p[k]===oldModule.HERO_PINE_ORIGINS[i][k]));
if(!sameOrigins)throw Error('Pine origins changed');
const blob=Buffer.concat(chunks),manifest={format:'pine158-exact-module-model-review-v1',revision:module.HERO_PINES_REVISION,visualAccepted:false,sourceSha256:createHash('sha256').update(source).digest('hex'),coordinateSystem:'Blender Z-up, positions and transforms rotated once from the source Three Y-up system by +90deg around X; all metres',source:'hero-pines158.js',binary:'pine158-model.bin',meshes,variants,trees,randomReplay,sameOrigins};
await writeFile(resolve(out,'pine158-model.bin'),blob);await writeFile(resolve(out,'model.json'),JSON.stringify(manifest));
await writeFile(resolve(out,'geometry-audit.json'),JSON.stringify({revision:manifest.revision,sourceSha256:manifest.sourceSha256,binaryBytes:blob.length,sameOrigins,randomReplay,trees:trees.map(({id,origin,stats,instances})=>({id,origin,stats,shootInstances:instances.length})),visualAccepted:false},null,2));

// Exercise the public build path for all eight fixed roots without a GPU or
// browser. Only the image loader is stubbed; geometry/material creation and
// every emitted placement use the actual module implementation unchanged.
const originalLoadAsync=T.TextureLoader.prototype.loadAsync,seen=new Set(),groups=[],usedMaterialKeys=new Set();let emissions=0,nonFinite=0,badIndex=0;
T.TextureLoader.prototype.loadAsync=async()=>new T.Texture();
let apiStats;
try {
  apiStats=await module.buildHeroPines({mats:{},barkAssetBase:'file:///pine158-geometry-only-test/',hillHeight:()=>0,
    group:(x,y,z,yaw,scale,fn)=>{groups.push({x,y,z,yaw,scale});fn();},
    emit:(g,key,x,y,z,sx=1,sy=1,sz=1,rotation=[0,0,0],tint=1)=>{
      emissions++;usedMaterialKeys.add(key);if(![x,y,z,sx,sy,sz,...rotation,tint].every(Number.isFinite))nonFinite++;
      if(seen.has(g))return;seen.add(g);
      for(const a of Object.values(g.attributes))for(const v of a.array)if(!Number.isFinite(v))nonFinite++;
      if(g.index)for(const i of g.index.array)if(i<0||i>=g.attributes.position.count)badIndex++;
    }});
} finally { T.TextureLoader.prototype.loadAsync=originalLoadAsync; }
if(nonFinite||badIndex||groups.length!==8)throw Error('Public geometry build failed');
const apiAudit={revision:manifest.revision,sourceSha256:manifest.sourceSha256,scope:'Actual eight-tree public API build; empty Texture objects replace image loading only. GPU shader/material validation belongs to the native integration render.',emissions,uniqueGeometries:seen.size,nonFinite,badIndex,groups,usedMaterialKeys:[...usedMaterialKeys],stats:apiStats,visualAccepted:false};
await writeFile(resolve(out,'public-api-audit.json'),JSON.stringify(apiAudit,null,2));for(const g of seen)g.dispose();
console.log(JSON.stringify({out,revision:manifest.revision,binaryBytes:blob.length,trees:trees.map(t=>({id:t.id,...t.stats}))}));
