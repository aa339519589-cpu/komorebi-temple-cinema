import fs from 'node:fs/promises';
import * as T from 'three';
import {buildStoneLantern} from '../../reconstructions/scene-10/src/stone-lantern.js';
import {buildRainBanks210} from '../../reconstructions/scene-10/src/rain-banks210.js';
import {scene10Layout125 as L} from '../../reconstructions/scene-10/src/layout125.js';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
const revision=process.argv[2]||'r10',meshes=[],material=new T.MeshPhysicalMaterial();
const emit=g=>{if(g.name==='210-closed-shared-ring-lantern-profile')meshes.push({kind:'Actual new shared-ring lamp profile',g});},box=()=>{},group=(x,y,z,a,fn)=>fn();
buildStoneLantern({T,emit,box,group,R:()=>.5,scene:new T.Scene(),materials:{granite:material},layout:L,x:-2.8,z:-3,s:1,isNear:true});
// The three authored plinth solids are independent of scan buffers or
// botanical geometry. Disable all placement candidates for this topology
// check; do not claim this is a bank-root/collision/asset-closure audit.
const empty=()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([],3));return g;};
const excludedScan=new T.BoxGeometry(1,1,1);
buildRainBanks210({emit:g=>{if(g!==excludedScan)meshes.push({kind:'Actual authored closed lantern plinth course',g});},scannedStones:{variants:Array.from({length:6},()=>({wet:material,geometry:excludedScan}))},heightAt:()=>0,reserved:()=>true,wood:material,leaf:material,groundcover:{variants:[]},makeShrub:()=>({wood:empty(),foliage:empty()}),makeFern:()=>({}),layout:L,plinthMaterial:material});
const records=[];for(const {kind,g}of meshes){const p=g.attributes.position,idx=g.index,vertices=[],weld=new Map(),edges=new Map();let volume=0,nonfinite=0,degenerate=0;for(let i=0;i<p.count;i++){const a=[p.getX(i),p.getY(i),p.getZ(i)];for(const x of a)if(!Number.isFinite(x))nonfinite++;const key=a.map(v=>Math.round(v*1e6)).join(':');if(!weld.has(key))weld.set(key,weld.size);vertices.push(weld.get(key));}for(let i=0;i<(idx?.count??p.count);i+=3){const ids=[0,1,2].map(k=>idx?idx.getX(i+k):i+k),q=ids.map(k=>new T.Vector3().fromBufferAttribute(p,k));if(q[1].clone().sub(q[0]).cross(q[2].clone().sub(q[0])).lengthSq()<1e-24)degenerate++;volume+=q[0].dot(q[1].clone().cross(q[2]))/6;for(let k=0;k<3;k++){const a=vertices[ids[k]],b=vertices[ids[(k+1)%3]],key=[Math.min(a,b),Math.max(a,b)].join(':'),e=edges.get(key)||[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);}}records.push({kind,name:g.name||g.type,triangles:(idx?.count??p.count)/3,nonfinite,degenerate,unclosedEdges:[...edges.values()].filter(e=>e[0]!==2).length,windingEdges:[...edges.values()].filter(e=>e[1]!==0).length,volume});}
const result={source:await reconstructionSourceIdentity(process.cwd(),'10'),scope:'Exact new lamp shared-ring profiles and three independently authored plinth solids only. No renderer, asset export, original CC0 scan closure, plant contact, full collision or photographic acceptance.',records,visualAccepted:false};result.passed=records.length===8&&records.every(r=>r.nonfinite===0&&r.degenerate===0&&r.unclosedEdges===0&&r.windingEdges===0&&r.volume>0);await fs.writeFile(`lookdev/scene10-support207/rain-geometry-audit-${revision}.json`,JSON.stringify(result,null,2)+'\n');console.log({passed:result.passed,meshes:records.length,records});if(!result.passed)process.exitCode=1;
