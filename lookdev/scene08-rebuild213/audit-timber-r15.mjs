import fs from 'node:fs';
import {createContinuousTimber} from '../../reconstructions/scene-08/src/gallery-joinery.js';
import {createGrandRoofProfile213} from '../../reconstructions/scene-08/src/fine-hall213.js';
import {createHallLattice213} from '../../reconstructions/scene-08/src/hall-timber213.js';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
const source=await reconstructionSourceIdentity(process.cwd(),'08');
const scene=fs.readFileSync('reconstructions/scene-08/src/scene.js','utf8');
const frame=Function('return '+scene.match(/const grandFrame=(\{[^;]+\});/)[1])();
const profile=createGrandRoofProfile213({frame,w:frame.w,d:frame.d,eave:frame.eave,rise:frame.rise,curl:.34,ridgeRatio:.20});
function audit(g){
 const p=g.attributes.position,ix=g.index.array,edges=new Map();let volume=0;
 for(let i=0;i<ix.length;i+=3){const a=ix[i],b=ix[i+1],c=ix[i+2];
  for(const[u,v]of[[a,b],[b,c],[c,a]]){const k=u<v?u+','+v:v+','+u;edges.set(k,(edges.get(k)||0)+1);}
  const A=[p.getX(a),p.getY(a),p.getZ(a)],B=[p.getX(b),p.getY(b),p.getZ(b)],C=[p.getX(c),p.getY(c),p.getZ(c)];
  volume+=(A[0]*(B[1]*C[2]-B[2]*C[1])+A[1]*(B[2]*C[0]-B[0]*C[2])+A[2]*(B[0]*C[1]-B[1]*C[0]))/6;
 }
 return{finite:Array.from(p.array).every(Number.isFinite),badEdges:[...edges.values()].filter(n=>n!==2).length,signedVolume:volume};
}
const members=[];
for(let side=0;side<4;side++){
 for(const[drop,w,d]of[[.105,.19,.11],[.245,.145,.10],[.355,.11,.09]]){
  const points=Array.from({length:37},(_,i)=>{const q=profile.point(side,1,-1+2*i/36);q[1]-=drop;return q;});
  members.push({kind:'actual-continuous-fascia-course',side,drop,...audit(createContinuousTimber(points,w,d,.008))});
 }
 const n=Math.ceil((side%2?frame.d:frame.w)/.24);
 for(let i=0;i<=n;i++){
  const u=-1+2*i/n;
  for(const[kind,start,end,drop,w,d,N]of[['rafter',0,1,.26,.070,.12,15],['flying-tail',.72,1.01,.18,.072,.10,6]]){
   const points=Array.from({length:N},(_,j)=>{const q=profile.point(side,start+(end-start)*j/(N-1),u);q[1]-=drop;return q;});
   members.push({kind,side,u,...audit(createContinuousTimber(points,w,d,.007))});
  }
 }
}
const windowPieces=[];const lattice=createHallLattice213({box:(x,y,z,w,h,d,material)=>windowPieces.push({position:[x,y,z],size:[w,h,d],material})});
lattice.build(0,0,0,1.37,1.75);
const r={source:source.hash,scope:'Pure CPU audit of exact profile/sweep geometry and actual window authoring helper. No renderer, scene export or image synthesis.',members,allClosed:members.every(m=>m.finite&&m.badEdges===0&&Math.abs(m.signedVolume)>1e-9),window:lattice.info(),windowPositiveFiniteDimensions:windowPieces.every(p=>[...p.position,...p.size].every(Number.isFinite)&&p.size.every(d=>d>0)),cameraPassSha256:source.files['reconstructions/scene-08/src/post.js'],visualAccepted:false};
fs.writeFileSync('lookdev/scene08-rebuild213/timber-audit-r15.json',JSON.stringify(r,null,2)+'\n');
console.log(JSON.stringify({source:r.source,closedMembers:r.members.length,allClosed:r.allClosed,window:r.window,windowPositiveFiniteDimensions:r.windowPositiveFiniteDimensions}));
if(!r.allClosed||!r.windowPositiveFiniteDimensions)process.exitCode=1;
