import * as T from '../../vendor/build/three.module.js';
import {createGardenGround213} from '../../reconstructions/scene-08/src/layered-banks213.js';
import {createWeatheredToro213} from '../../reconstructions/scene-08/src/weathered-toro213.js';
import {writeFile} from 'node:fs/promises';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';

// Pure CPU rays against the same authored Float32 buffers. This is a contact
// audit, and cannot establish photographic fidelity or render acceptance.
const revision=process.env.REVISION||'r03',ground=createGardenGround213({x:-3.954,z:-8.701,yaw:-.28}),p=[],ix=[],nx=144,nz=144;
const source=(await reconstructionSourceIdentity(process.cwd(),'08')).hash,expected={r03:'ca61f18635894d3e62e089ab11cb742e805b7568ae6876f7bee1a5b60757929f',r04:'2627ddf97e4a84700b74242c6b1cd691072061709225e1d69ac29804bde75dd2'};
if(source!==expected[revision])throw Error('Restore the exact revision source archive before running this contact audit.');
for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-28+i*56/nx,z=-42+j*60/nz;p.push(x,ground.analytic(x,z),z);}
for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ix.push(a,c,b,b,c,d);}
const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);
const plain=new T.MeshBasicMaterial({side:T.DoubleSide}),mesh=new T.Mesh(g,plain),ray=new T.Raycaster(),contacts=[];mesh.updateMatrixWorld(true);
for(let i=0;i<81;i++){const x=-7.2+(i%9)*1.03,z=-12+Math.floor(i/9)*1.15;ray.set(new T.Vector3(x,30,z),new T.Vector3(0,-1,0));const hit=ray.intersectObject(mesh)[0];contacts.push({x,z,rootY:ground.sample(x,z),triangleY:hit?.point.y,error:Math.abs(ground.sample(x,z)-hit.point.y)});}
const terrain={scope:'CPU ray/actual float32 triangle contact; no rendering or scene export',revision,source,samples:contacts.length,maxRootTriangleErrorMetres:Math.max(...contacts.map(c=>c.error)),pass:contacts.every(c=>c.error<.00001),checks:contacts};

const ms=[],ts=[],src=new T.MeshStandardMaterial({map:new T.Texture(),normalMap:new T.Texture(),roughnessMap:new T.Texture()}),paper=new T.MeshStandardMaterial(),kit=createWeatheredToro213({materials:{carvedstone:src,lanternamber:paper},ownedMaterials:ms,ownedTextures:ts}),emitted=[];
kit.build({group(x,y,z,yaw,fn){fn();},emit(geometry,m,x=0,y=0,z=0){const o=new T.Mesh(geometry,plain);o.position.set(x,y,z);o.updateMatrixWorld(true);emitted.push({o,m:m.name});},box(){}},0,0,0,1);
const cap=emitted.find(e=>e.m==='scene08-213-damp-granite-kasa').o,head=emitted.filter(e=>e.m==='scene08-213-cut-and-pitted-pale-granite').find(e=>Math.abs(e.o.position.y-2.43)<.001).o,checks=[];
for(const[x,z]of[[-.40,-.40],[.40,-.40],[-.40,.40],[.40,.40],[0,-.40],[0,.40],[-.44,0],[.44,0]]){ray.set(new T.Vector3(x,1.90,z),new T.Vector3(0,1,0));const bottom=ray.intersectObject(cap)[0]?.point.y;ray.set(new T.Vector3(x,4,z),new T.Vector3(0,-1,0));const top=ray.intersectObject(head)[0]?.point.y;checks.push({x,z,lintelTop:top,kasaUnderside:bottom,verticalGap:bottom-top});}
const kasa={scope:'CPU rays against exact emitted cap and lintel buffers; support contact, not visual acceptance',revision,source,checks,maxGap:Math.max(...checks.map(c=>c.verticalGap)),requiresRepair:checks.some(c=>c.verticalGap>.01)};
for(const[name,report]of[['terrain-contact',terrain],['kasa-bearing',kasa]])await writeFile(new URL(`${name}-${revision}.json`,import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({revision,terrainPass:terrain.pass,terrainMaxError:terrain.maxRootTriangleErrorMetres,kasaMaxGap:kasa.maxGap,kasaRequiresRepair:kasa.requiresRepair}));
if(!terrain.pass)process.exitCode=1;
