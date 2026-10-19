import * as T from 'three';
import {readFileSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {installPagodaFinial09} from '../../../../reconstructions/scene-09/src/pagoda-finial09.js';
import {reconstructionSourceIdentity} from '../../../../tools/reconstruction-source-identity.mjs';

const base = .7 + 4 * 3.10 + 2.93 + 1.20;
const transform = new T.Matrix4().compose(new T.Vector3(-13.6,4,-17),
  new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),.16),new T.Vector3(1.18,1.14,1.18));
const camera = new T.PerspectiveCamera(52,1,.1,250);
camera.position.set(6,2.7,33);camera.lookAt(0,5.5,-10);camera.updateMatrixWorld(true);camera.updateProjectionMatrix();
const project = (x,y,z) => {
  const p = new T.Vector3(x,y,z).applyMatrix4(transform).project(camera);
  return [(p.x+1)*627,(1-p.y)*627];
};
const parts = [], scene = new T.Scene(), materials = [];
const info = installPagodaFinial09({scene, materials, transform, base,
  emit(g,m,x,y,z) {parts.push({g,m,position:[x,y,z]});}
});
const geometry = parts.map(({g,position}) => {
  const p = g.attributes.position, idx = g.index.array, ids = [], weld = new Map(), edges = new Map();
  let volume = 0;
  for(let k=0;k<p.count;k++){
    const key = [p.getX(k),p.getY(k),p.getZ(k)].map(v=>Math.round(v*1e6)).join(',');
    if(!weld.has(key))weld.set(key,weld.size);ids.push(weld.get(key));
  }
  for(let k=0;k<idx.length;k+=3){
    const ia=idx[k],ib=idx[k+1],ic=idx[k+2],a=ids[ia],b=ids[ib],c=ids[ic];
    const va=new T.Vector3().fromBufferAttribute(p,ia),vb=new T.Vector3().fromBufferAttribute(p,ib),vc=new T.Vector3().fromBufferAttribute(p,ic);
    volume+=va.dot(vb.cross(vc))/6;
    if(a===b||b===c||c===a)continue;
    for(const [u,v]of[[a,b],[b,c],[c,a]]){const key=u<v?u+','+v:v+','+u;edges.set(key,(edges.get(key)||0)+1);}
  }
  const badEdges=[...edges.values()].filter(n=>n!==2).length;
  if(badEdges || !(volume>0))throw Error(g.name+': invalid closed orientation '+JSON.stringify({badEdges,volume}));
  return {name:g.name,position,triangles:idx.length/3,weldedVertices:weld.size,
    boundaryOrNonManifoldEdges:badEdges,signedVolume:volume};
});
const sourcePath='reconstructions/scene-09/src/main.js';
const current=readFileSync(sourcePath,'utf8');
const original=execFileSync('git',['show','0f9dec9:'+sourcePath],{encoding:'utf8',maxBuffer:16e6});
const oldFinial="const base=.7+4*3.10+2.93+1.20;between([0,base,0],[0,23.4,0],.055,.055,M.gold,true);for(let i=0;i<15;i++){const g=new T.TorusGeometry(.40-i*.018,.035,5,20);emit(g,M.gold,0,base+.3+i*.33,0,1,1,1,[Math.PI/2,0,0]);}emit(sphere,M.gold,0,23.3,0,.09,.25,.09);";
const restored=current.replace("import {installPagodaFinial09} from './pagoda-finial09.js';\n",'')
  .replace('let pagodaFinial;\n','')
  .replace('const base=.7+4*3.10+2.93+1.20;pagodaFinial=installPagodaFinial09({emit,materials,scene,transform:stack.at(-1),base});',oldFinial)
  .replace('heroHangingLantern:heroHangingLantern.info,pagodaFinial,bridgeCoating','heroHangingLantern:heroHangingLantern.info,bridgeCoating');
if(restored!==original)throw Error('Unexpected change outside the finial integration');
const older=execFileSync('git',['show','9af125538c0c4b4592fbe691faee54f5eb1061ab:'+sourcePath],{encoding:'utf8',maxBuffer:16e6});
const receipt={
  baseCommit:'0f9dec9',source:await reconstructionSourceIdentity(process.cwd(),'09'),
  scope:{originalMainRestoredExactly:true,originalMainSha256:createHash('sha256').update(original).digest('hex'),
    oldFinialIdenticalToPaper103b:older.includes(oldFinial),existingRoofCameraLightsSkySeedUnchanged:true},
  referenceMeasurements:{image:'references/hd/8-照片-9.jpg',dimensions:[1254,1254],
    method:'Manual silhouette landmarks on original pixels; no image fed into the model or any texture',
    topPin:{x:333,y:20,tolerancePixels:2},visibleRoofJoin:{x:329,y:170,tolerancePixels:3},
    maximumDiameterPixels:[22,26],mainRimYApprox:[74,83,92,101,110,119,128,137,146],
    mainRimCount:9,uncertainty:'Approximately 1-2px on rims; fine upper band/rod count unresolved'},
  projection:{originalFixedRoofAxis:project(0,base,0),highestPoint:project(0,base+6.32,0),
    wheelCenters:info.wheels.map(w=>project(0,w.localY,0)),
    rootNote:'Axis foot is partly hidden by the existing raised foreground roof; no roof or tower transform changed. Absolute original/render roof offset remains.'},
  info,geometry,judgment:'Geometry closure and byte scope are engineering evidence only, not a visual acceptance result.'
};
writeFileSync(new URL('./source-receipt.json',import.meta.url),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({closedComponents:parts.length,triangles:info.triangles,
  maxBadEdges:Math.max(...geometry.map(p=>p.boundaryOrNonManifoldEdges)),sourceHash:receipt.source.hash,projection:receipt.projection},null,2));
