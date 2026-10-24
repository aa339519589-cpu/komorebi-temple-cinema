// Execute only the actual source's pure CPU roof-authoring block. No scene,
// renderer, viewport, capture, export or Blender is created by this audit.
import fs from 'node:fs';
import * as T from 'three';
import {createContinuousTimber} from '../../reconstructions/scene-08/src/gallery-joinery.js';
import {createGrandRoofProfile213} from '../../reconstructions/scene-08/src/fine-hall213.js';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
const source=await reconstructionSourceIdentity(process.cwd(),'08'),s=fs.readFileSync('reconstructions/scene-08/src/scene.js','utf8');
const frame=Function('return '+s.match(/const grandFrame=(\{[^;]+\});/)[1])();
const profile=createGrandRoofProfile213({frame,w:frame.w,d:frame.d,eave:frame.eave,rise:frame.rise,curl:.34,ridgeRatio:.20});
const begin=s.indexOf('for(let side=0;side<4;side++){const pp=[]'),end=s.indexOf('if(falling)emit(createContinuousTimber(Array.from');
if(begin<0||end<=begin)throw Error('Actual source authoring anchors missing');
const captured=[],noop=()=>{};
Function('T','P','falling','role','mats','emit','createContinuousTimber','ceramicTile','ceramicPan','eaveTileEnd','bevelBox','boxG','between','line','w','d','hornHeight',s.slice(begin,end))(
 T,profile.point,true,'left-grand-hall',{tile:{},wood:{},red:{}},(g,ma)=>captured.push({g,ma}),createContinuousTimber,noop,noop,noop,(w,h,d)=>new T.BoxGeometry(w,h,d),new T.BoxGeometry(1,1,1),noop,noop,frame.w,frame.d,.30
);
function solid(g){const p=g.attributes.position,ix=g.index.array,edges=new Map();let volume=0;
 for(let i=0;i<ix.length;i+=3){const a=ix[i],b=ix[i+1],c=ix[i+2];for(const[u,v]of[[a,b],[b,c],[c,a]]){const k=u<v?u+','+v:v+','+u;edges.set(k,(edges.get(k)||0)+1);}volume+=(p.getX(a)*(p.getY(b)*p.getZ(c)-p.getZ(b)*p.getY(c))+p.getY(a)*(p.getZ(b)*p.getX(c)-p.getX(b)*p.getZ(c))+p.getZ(a)*(p.getX(b)*p.getY(c)-p.getY(b)*p.getX(c)))/6;}
 return{finite:Array.from(p.array).every(Number.isFinite),badEdges:[...edges.values()].filter(n=>n!==2).length,signedVolume:volume};
}
const facing=captured.filter(({g,ma})=>ma==='tile'||ma==='hallSoffit213'&&g.attributes.position.count===3888).map(({g,ma})=>{
 const a=g.attributes.normal;let positive=0,negative=0;for(let i=0;i<a.count;i++){const y=a.getY(i);if(y>1e-6)positive++;if(y< -1e-6)negative++;}
 return{role:ma,positive,negative,correct:ma==='tile'?negative===0:positive===0};
});
const members=captured.filter(({g})=>g.index&&g.type==='BufferGeometry').map(({g,ma})=>({role:ma,...solid(g)}));
const r={source:source.hash,scope:'Actual source roof authoring block, real continuous-sweep helper and original weather profile on CPU only. End caps use dimension-matched boxes in this audit; native verifies their actual bevels. No render or export.',weatherAndUndersidePanels:facing,allEightPanelsFaceOutward:facing.length===8&&facing.every(x=>x.correct),closedContinuousMembers:members,allClosed:members.every(m=>m.finite&&m.badEdges===0&&Math.abs(m.signedVolume)>1e-9),visualAccepted:false};
fs.writeFileSync('lookdev/scene08-rebuild213/timber-audit-r16.json',JSON.stringify(r,null,2)+'\n');
console.log(JSON.stringify({source:r.source,panels:facing,closedMembers:members.length,allClosed:r.allClosed}));
if(!r.allEightPanelsFaceOutward||!r.allClosed)process.exitCode=1;

// Check the remaining visible blue strips against actual roof geometry,
// retaining the source's front-sided soffit / double-sided weather surface.
const roofGroup=new T.Group();roofGroup.position.set(frame.x,0,frame.z);roofGroup.rotation.y=frame.yaw;
for(const {g,ma}of captured.filter(({ma})=>ma==='tile'||ma==='hallSoffit213')){const m=new T.Mesh(g,new T.MeshBasicMaterial({side:ma==='tile'?T.DoubleSide:T.FrontSide}));m.name=ma;roofGroup.add(m);}roofGroup.updateMatrixWorld(true);
const camera=new T.PerspectiveCamera(49,1,.06,180);camera.setViewOffset(1254,1254,155,190,650,650);camera.position.set(0,1.78,13);camera.lookAt(0,6.1,-9);camera.updateMatrixWorld(true);
const rays=[];for(const[x,y]of[[375,230],[400,210],[430,218],[330,205],[420,195]]){
 const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x/1254*2-1,1-y/1254*2),camera);const hits=ray.intersectObject(roofGroup,true).slice(0,2);
 rays.push({detailPixel:[x,y],firstRoofHits:hits.map(h=>({material:h.object.name,point:h.point.toArray(),face:h.faceIndex,normal:h.face.normal.clone().transformDirection(h.object.matrixWorld).toArray()}))});
}
fs.writeFileSync('lookdev/scene08-rebuild213/roof-frontside-rays-r16.json',JSON.stringify({source:source.hash,scope:'CPU actual weather/soffit surfaces only, with native source material sidedness. Excludes other scene solids, shading and texture colour.',rays},null,2)+'\n');
console.log(JSON.stringify({frontSidedRoofRayHits:rays}));
