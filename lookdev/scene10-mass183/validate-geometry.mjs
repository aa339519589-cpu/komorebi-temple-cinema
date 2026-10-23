import * as T from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {createRestorationArchitecture} from '../../reconstructions/scene-10/src/architecture.js';
import {createCarpentryMass183} from '../../reconstructions/scene-10/src/carpentry-mass183.js';
import {buildTowerMass183} from '../../reconstructions/scene-10/src/tower-mass183.js';
import {loadLicensedCloud183} from '../../reconstructions/scene-10/src/licensed-cloud183.js';
import {scene10Layout125 as L} from '../../reconstructions/scene-10/src/layout125.js';
globalThis.ProgressEvent=class ProgressEvent{constructor(type,data){this.type=type;Object.assign(this,data);}};
globalThis.self=globalThis;
globalThis.fetch=async input=>new Response(await readFile(new URL(typeof input==='string'||input instanceof URL?input:input.url)),{status:200});
const stack=[new T.Matrix4()],geometries=new Set(),emissions=[];
function emit(g,ma,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0){if(typeof g==='string')return;if(!g?.isBufferGeometry)throw Error('Bad geometry');for(const a of Object.values(g.attributes))if(!Array.from(a.array).every(Number.isFinite))throw Error('Nonfinite geometry');geometries.add(g);emissions.push({g,ma,x,y,z,sx,sy,sz});}
function box(x,y,z,w,h,d){if(![x,y,z,w,h,d].every(Number.isFinite)||!(w>0&&h>0&&d>0))throw Error('Bad solid box');}
function group(x,y,z,yaw,fn,scale=1){stack.push(stack.at(-1).clone().multiply(new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw),new T.Vector3(...(Array.isArray(scale)?scale:[scale,scale,scale])))));try{fn();}finally{stack.pop();}}
function between(a,b,r){if(![...a,...b,r].every(Number.isFinite))throw Error('Bad member');}
const scene=new T.Scene(),arch=createRestorationArchitecture({instance:emit,box,group,stack,columns:[],roofAudit:[]});
const tower=buildTowerMass183({emit,box,group,between,tube(){},arch,scene,stack},L);
const source=await loadLicensedCloud183();
const carpentry=createCarpentryMass183({emit,box,group,carvedCloud:source,parentScale:L.hall.scale});
carpentry.column(0,4.3,1.3,5.4,.285);carpentry.capital(0,5.4,4.3,{scan:true});carpentry.frieze(0,4.8,3.0,1.76,.34);carpentry.arch(0,5.2,4.23,1.78,.43);
const surface=source.surface,positions=surface.attributes.position,keys=new Map();
for(let i=0;i<positions.count;i++){const key=[positions.getX(i),positions.getY(i),positions.getZ(i)].join(',');if(!keys.has(key))keys.set(key,i);}
const capToSource=[],caps=source.caps.attributes.position;for(let i=0;i<caps.count;i++){const key=[caps.getX(i),caps.getY(i),caps.getZ(i)].join(',');if(!keys.has(key))throw Error('Mount cap moved off source boundary');capToSource.push(keys.get(key));}
const edges=new Map();let zeroArea=0,subThreshold=0,minSquaredCross=Infinity;
function addTri(a,b,c){const A=new T.Vector3().fromBufferAttribute(positions,a),B=new T.Vector3().fromBufferAttribute(positions,b),C=new T.Vector3().fromBufferAttribute(positions,c);const areaSq=B.sub(A).cross(C.sub(A)).lengthSq();minSquaredCross=Math.min(minSquaredCross,areaSq);if(areaSq===0)zeroArea++;if(areaSq<1e-20)subThreshold++;for(const[u,v]of[[a,b],[b,c],[c,a]]){const key=u<v?u+':'+v:v+':'+u;edges.set(key,(edges.get(key)||0)+1);}}
const canonical=Array.from({length:positions.count},(_,i)=>keys.get([positions.getX(i),positions.getY(i),positions.getZ(i)].join(',')));
for(let i=0;i<surface.index.count;i+=3)addTri(...[0,1,2].map(k=>canonical[surface.index.getX(i+k)]));
for(let i=0;i<caps.count;i+=3)addTri(capToSource[i],capToSource[i+1],capToSource[i+2]);
const openEdges=[...edges.values()].filter(n=>n===1).length,nonmanifold=[...edges.values()].filter(n=>n>2).length;
if(openEdges||nonmanifold||zeroArea)throw Error('Closed mounted cloud topology failed: '+JSON.stringify({openEdges,nonmanifold,zeroArea}));
const report={revision:'scene10-mass183-r02-cpu-geometry-check',scope:'Pure CPU construction, contact parameters and exact scanned-cut closure; no renderer, image, export, UV bake, Blender or GPU.',finiteGeometry:true,uniqueGeneratedGeometries:geometries.size,emissions:emissions.length,tower:{revision:tower.revision,frames:tower.frames,floors:tower.floors,roofs:tower.roofs},carpentry:{parts:carpentry.parts,prototypes:carpentry.geometries.size},mountedSource:{...source.info,capVerticesExactlyOnSourceBoundary:true,subThresholdSquaredCross1e20:subThreshold,minSquaredCross,openEdges,nonmanifoldEdges:nonmanifold,zeroAreaTriangles:zeroArea},visualAccepted:false};
await writeFile('lookdev/scene10-mass183/geometry183-r02.json',JSON.stringify(report,null,2));console.log(JSON.stringify({finiteGeometry:true,closedCloud:true,openEdges,nonmanifold,zeroArea,geometries:geometries.size,annularRoofs:tower.roofs.filter(r=>r.kind.includes('annular')).length}));
