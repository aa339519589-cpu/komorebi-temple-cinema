// CPU projective fitting only. The reference contributes hand-picked outline
// landmarks, never RGB, a projection texture or replacement scene geometry.
import * as T from '../../../../vendor/build/three.module.js';
import {writeFile} from 'node:fs/promises';
const camera=new T.PerspectiveCamera(47,1,.1,350);camera.position.set(10.7,12.8,36);camera.lookAt(0,7,-2);camera.updateMatrixWorld(true);
const dimensions={ridgeHalf:1.9,eaveHalf:4.8,tilePitch:.48,capStride:2};
const observations=[
 {id:'hip-ridge-junction',kind:'hip',t:0,u:1,target:[58,754],weight:1},
 {id:'hip-eave-corner',kind:'cap',t:1,u:1,target:[421,937],weight:1},
 {id:'near-eave-terminal',kind:'cap',t:1,x:2.4,target:[56,1137],weight:1},
 {id:'middle-eave-terminal',kind:'cap',t:1,x:3.36,target:[232,1056],weight:1},
 {id:'far-eave-terminal',kind:'cap',t:1,x:4.32,target:[376,1003],weight:1},
];
// x,y,z,yaw,run,rise,curl. Physical scale is an explicit hypothesis because a
// single photograph cannot independently recover all roof dimensions/depths.
const bounds=[[-5,8],[5.3,9.8],[22,32],[.1,1.65],[1.6,7.5],[.30,2.50],[.03,1.20],[.4,4.0]];
function point(t,u,p){const span=p[7]+(dimensions.eaveHalf-p[7])*t;return new T.Vector3(u*span,p[5]*(1-t)**1.65+p[6]*t**7*(.2+.8*Math.abs(u)**5),p[4]*t);}
function frame(t,u,p,parallel=false){const pos=point(t,u,p),e=.00001,a=Math.max(0,t-e),b=Math.min(1,t+e),span=t=>p[7]+(dimensions.eaveHalf-p[7])*t,ta=point(a,parallel?pos.x/span(a):u,p),tb=point(b,parallel?pos.x/span(b):u,p),f=tb.sub(ta).normalize(),x=new T.Vector3(0,1,0).cross(f).normalize(),up=f.clone().cross(x).normalize();return{pos,f,up};}
function project(o,p){const u=o.u??o.x/dimensions.eaveHalf,f=frame(o.t,u,p,o.kind==='cap'),local=f.pos.addScaledVector(f.up,o.kind==='cap'?.24:.35).addScaledVector(f.f,o.kind==='cap'?.095:0),world=local.applyMatrix4(new T.Matrix4().makeRotationY(p[3])).add(new T.Vector3(p[0],p[1],p[2])),v=world.clone().project(camera);return{pixel:[(v.x+1)*627,(1-v.y)*627],world:world.toArray()};}
function loss(p){
 let error=0;for(let j=0;j<p.length;j++){const [a,b]=bounds[j],d=p[j]<a?p[j]-a:p[j]>b?p[j]-b:0;error+=d*d*1e7;}
 if(!Number.isFinite(error))return 1e30;
 for(const o of observations){const v=project(o,p).pixel;error+=o.weight*((v[0]-o.target[0])**2+(v[1]-o.target[1])**2);}
 // A mild shallow-roof prior prevents a degenerate flat or extreme curl fit.
 error+=((p[4]-3.2)/1.4)**2*4+((p[5]-.9)/.6)**2*4+((p[6]-.36)/.35)**2*2;
 return error;
}
function nelder(start,steps){
 const n=start.length,simplex=[start,...start.map((_,j)=>start.map((x,k)=>x+(j===k?steps[j]:0)))].map(p=>({p,f:loss(p)}));
 const make=p=>({p,f:loss(p)});
 for(let iteration=0;iteration<5000;iteration++){
  simplex.sort((a,b)=>a.f-b.f);const best=simplex[0],worst=simplex[n],centre=Array(n).fill(0);
  for(let i=0;i<n;i++)for(let k=0;k<n;k++)centre[k]+=simplex[i].p[k]/n;
  const candidate=factor=>make(centre.map((x,k)=>x+factor*(centre[k]-worst.p[k]))),reflected=candidate(1);
  if(reflected.f<best.f){const expanded=candidate(2);simplex[n]=expanded.f<reflected.f?expanded:reflected;}
  else if(reflected.f<simplex[n-1].f)simplex[n]=reflected;
  else{
   const contracted=reflected.f<worst.f?candidate(.5):candidate(-.5);
   if(contracted.f<Math.min(worst.f,reflected.f))simplex[n]=contracted;
   else for(let i=1;i<=n;i++)simplex[i]=make(simplex[i].p.map((x,k)=>(x+best.p[k])*.5));
  }
  if(iteration%100===0&&Math.max(...simplex.map(v=>Math.abs(v.f-best.f)))<1e-9)break;
 }
 return simplex.sort((a,b)=>a.f-b.f)[0];
}
let seed=1197;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const candidates=[];for(let i=0;i<40;i++){
 const start=i===0?[2.3,6.8,24.5,1.1,3.2,.9,.36,1.9]:[1+random()*4,6+random()*2,23+random()*5,.4+random(),2+random()*3,.5+random(),.15+random()*.5,1+random()*2];
 candidates.push(nelder(start,[.2,.15,.2,.06,.2,.1,.05,.15]));
}
const selected=candidates.sort((a,b)=>a.f-b.f)[0],p=selected.p;
const fitted=observations.map(o=>({...o,...project(o,p),errorPixels:Math.hypot(...project(o,p).pixel.map((v,k)=>v-o.target[k]))}));
const report={scope:'Whole foreground gallery roof orientation, slope and footprint fit; hand-measured features with approximately 10–20px annotation uncertainty. Not an exact photographic recovery.',camera:{position:camera.position.toArray(),target:[0,7,-2],fov:47,size:1254},dimensions:{...dimensions,ridgeHalf:p[7]},parameterOrder:['x','y','z','yawRadians','run','rise','curl','ridgeHalf'],parameters:p,objective:selected.f,bounds,observations:fitted,rmsPixels:Math.sqrt(fitted.reduce((s,f)=>s+f.errorPixels**2,0)/fitted.length),physicalScaleInferred:true,referenceRGBUsed:false};
await writeFile(new URL('./fit-result.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
