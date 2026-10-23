import fs from 'node:fs/promises';
import * as T from 'three';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
import {buildHallFoundation207,buildSupportRoute207,createApproachPlan207,routeReserved207} from '../../reconstructions/scene-10/src/support-route207.js';
import {scene10Layout125 as L,createBridgeHallStairPlan125,leftPathEdge125,rightPathEdge125} from '../../reconstructions/scene-10/src/layout125.js';

const plan=createBridgeHallStairPlan125(),approach=createApproachPlan207(L),meshes=[];
const api={
 emit(g,material,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0){
  const q=rot?.isQuaternion?rot:new T.Quaternion().setFromEuler(new T.Euler(...(Array.isArray(rot)?rot:[0,rot,0])));
  meshes.push({g,material,matrix:new T.Matrix4().compose(new T.Vector3(x,y,z),q,new T.Vector3(sx,sy,sz))});
 },
 box(x,y,z,w,h,d,material){this.emit(new T.BoxGeometry(w,h,d),material,x,y,z);},
 tube(){},between(){}
};
// The builders destructure the emitter functions, so bind their API receiver.
api.box=api.box.bind(api);api.emit=api.emit.bind(api);
const hall=buildHallFoundation207(api,L),route=buildSupportRoute207(api,L,plan,approach);
const result={source:await reconstructionSourceIdentity(process.cwd(),'10'),scope:'CPU inspection of actual authored structural buffers and circulation triangle constraints. Excludes botanical mesh closure, rail tube end caps, full-scene collision and engineering certification. Not photographic acceptance.',meshes:[],circulation:{},contacts:{},visualAccepted:false};
for(const {g,material}of meshes){
 const p=g.attributes.position,index=g.index,ids=[],weld=new Map(),edges=new Map(),A=new T.Vector3(),B=A.clone(),C=A.clone();let nonfinite=0,degenerate=0,volume=0;
 for(const a of Object.values(g.attributes))for(const v of a.array)if(!Number.isFinite(v))nonfinite++;
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(':');if(!weld.has(key))weld.set(key,weld.size);ids.push(weld.get(key));}
 for(let k=0;k<(index?.count??p.count);k+=3){const ix=[0,1,2].map(n=>index?index.getX(k+n):k+n),v=ix.map(i=>ids[i]);A.fromBufferAttribute(p,ix[0]);B.fromBufferAttribute(p,ix[1]);C.fromBufferAttribute(p,ix[2]);if(B.clone().sub(A).cross(C.clone().sub(A)).lengthSq()<1e-24)degenerate++;volume+=A.dot(B.clone().cross(C))/6;for(let e=0;e<3;e++){const a=v[e],b=v[(e+1)%3];if(a===b)continue;const key=[Math.min(a,b),Math.max(a,b)].join(':'),value=edges.get(key)||[0,0];value[0]++;value[1]+=a<b?1:-1;edges.set(key,value);}}
 result.meshes.push({name:g.name||g.type,material,vertices:p.count,triangles:(index?.count??p.count)/3,nonfinite,degenerate,unclosedEdges:[...edges.values()].filter(v=>v[0]!==2).length,windingEdges:[...edges.values()].filter(v=>v[1]!==0).length,signedVolume:volume});
}

function getReserved(code){const begin=code.indexOf('function circulationReserved125('),end=code.indexOf('// Porous wet mineral support',begin);return new Function('routeReserved207','bridgeHallPlan','bridgeApproach207','leftPathEdge125','rightPathEdge125','L',code.slice(begin,end)+';return circulationReserved125;')(routeReserved207,plan,approach,leftPathEdge125,rightPathEdge125,L);}
const now=getReserved(await fs.readFile('reconstructions/scene-10/src/main.js','utf8')),before=getReserved(await fs.readFile('lookdev/scene10-support207/checkpoint-r03-source/src/main.js','utf8'));
const points=[];
for(let z=-2;z<19.32;z+=.025)for(const offset of[0,.11,.22])points.push({kind:'right-curb',p:[rightPathEdge125(z)+offset,z]});
for(let i=0;i<96;i++){const a=i*Math.PI/48,c=Math.cos(a),s=Math.sin(a);points.push({kind:'veranda-footstone',p:[L.veranda.column[0]+Math.sign(c)*Math.pow(Math.abs(c),.44)*.81,L.veranda.column[2]+Math.sign(s)*Math.pow(Math.abs(s),.44)*.74]});}
for(let z=L.path.turnEndZ;z<=20;z+=.05)for(const x of[L.path.nearRight,4.6])points.push({kind:'returning-rail-apron',p:[x,z]});
for(const [label,fn]of [['r03',before],['current',now]]){let uncovered=0;const examples=[];for(const item of points){const [x,z]=item.p,x0=Math.floor(x/.25)*.25,z0=Math.floor(z/.25)*.25,covered=[[x0,z0],[x0+.25,z0],[x0,z0+.25],[x0+.25,z0+.25]].every(([xx,zz])=>fn(xx,zz));if(!covered){uncovered++;if(examples.length<8)examples.push(item);}}result.circulation[label]={sampledHardSurfaceBoundaryPoints:points.length,adjacentGridCellsWithUnreservedVertices:uncovered,examples};}
result.contacts={
 hallCapToPier:hall.frontPiers.map(p=>({gap:p.worldBottom-hall.worldCap,localTop:p.top})),
 hallPierToBeamGap:L.hall.position[1]+hall.beamBottom*L.hall.scale[1]-hall.frontPiers[0].worldTop,
 hallBeamToFloorGap:hall.galleryFloor.bottom-hall.beamTop,
 hallLastTreadToGalleryGap:plan.hallLanding[1]-route.hallStair.steps.at(-1).top,
 nearLastTreadToBridgeGap:approach.end[1]-route.nearApproach.steps.at(-1).top,
 hallFootingPadTop:.04,hallStairPierBottom:.04,
 hallStringerToCrossheadGap:0,hallBedToStringerGap:0,
 scope:'Analytic shared bearing planes of the generated solids; rounded edge relief and the complete assembly are reviewed in native views.'
};
result.datums={hall,route:{before:route.before,after:route.after},nearApproach:approach};
result.summary={meshes:result.meshes.length,nonfinite:result.meshes.reduce((s,m)=>s+m.nonfinite,0),exactOrSubNanometreDegenerates:result.meshes.reduce((s,m)=>s+m.degenerate,0),unclosedEdges:result.meshes.reduce((s,m)=>s+m.unclosedEdges,0),windingEdges:result.meshes.reduce((s,m)=>s+m.windingEdges,0),nonpositiveVolumeMeshes:result.meshes.filter(m=>m.signedVolume<=0).length,circulationUncoveredBefore:result.circulation.r03.adjacentGridCellsWithUnreservedVertices,circulationUncoveredAfter:result.circulation.current.adjacentGridCellsWithUnreservedVertices};
await fs.writeFile(process.argv[2]||'lookdev/scene10-support207/geometry-audit-r04.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.summary));
