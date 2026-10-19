import * as T from 'three';
import {CORRIDOR_LAYOUT as L} from './corridor-layout.js';
const A=L.bridge.a,B=L.bridge.b,dx=B[0]-A[0],dz=B[2]-A[2],span=Math.hypot(dx,dz),D=[dx/span,dz/span],N=[-D[1],D[0]];
const front=-6.6,xFront=B[0]-(front-B[2])*D[1]/D[0],zLeft=B[2]-(6.6-B[0])*D[0]/D[1];
export const WATERCOURT131={
 revision:'continuous-bank-stair-arch-route131',waterY:.82,
 westPlan:[[-.90,-4.05],[.75,-4.05],[.75,-4.85],[2.15,-4.85],[2.15,-3.05],[.75,-3.05],[.75,-3.25],[-.90,-3.25]],westSoil:2.50,
 rightCourtPlan:[[3.75,-11.7],[4.25,-11.7],[4.25,-12.9],[11.2,-12.9],[11.2,front],[xFront,front],[6.6,zLeft],[6.6,-9.35],[3.75,-9.35]],
 stairOpeningLocal:[[2.12,.39],[3.34,.39],[3.34,1.41],[2.12,1.41]],
 bridge:L.bridge,stair:L.stair,
};
function prism(P,top,depth,name){const s=new T.Shape();P.forEach(([x,z],i)=>i?s.lineTo(x,z):s.moveTo(x,z));s.closePath();const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,steps:1});g.rotateX(Math.PI/2);g.translate(0,top,0);g.name=name;return g;}
function beam(a,b,width,height,name){const d=new T.Vector3(b[0]-a[0],0,b[2]-a[2]).normalize(),n=new T.Vector3(-d.z,0,d.x),p=[];for(const v of[a,b])for(const y of[0,-height])for(const side of[-1,1])p.push(v[0]+n.x*width/2*side,v[1]+y,v[2]+n.z*width/2*side);const ix=[0,4,1,1,4,5,2,3,6,3,7,6,0,2,4,2,6,4,1,5,3,3,5,7,0,1,2,1,3,2,4,6,5,5,6,7],g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];g.setIndex(ix);g.computeVertexNormals();g.name=name;return g;}
const floorAt=t=>A[1]+(B[1]-A[1])*t+L.bridge.arch*Math.sin(t*Math.PI);
function finial(api,x,y,z,scale=1){const g=new T.LatheGeometry([[0,0],[.115,0],[.115,.035],[.09,.055],[.09,.105],[.06,.14],[0,.18]].map(([r,h])=>new T.Vector2(r*scale,h*scale)),18);g.name='watercourt131-small-cast-finial';api.emit(g,'oldgold',x,y,z);}
function guard(api,points,{endCaps=true,skipEndPost=false}={}){
 const length=points.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-points[i][0],p[2]-points[i][2]),0),n=Math.max(2,Math.round(length/1.0));
 function at(t){const u=t*(points.length-1),i=Math.min(points.length-2,Math.floor(u)),a=points[i],b=points[i+1],f=u-i;return a.map((v,j)=>v+(b[j]-v)*f);}
 for(let i=0;i<=n;i++){if(skipEndPost&&i===n)continue;const p=at(i/n),major=i===0||i===n||i%2===0;if(major){api.box(p[0],p[1]+.43,p[2],.19,.86,.19,'red');if(endCaps)finial(api,p[0],p[1]+.86,p[2]);}else api.box(p[0],p[1]+.39,p[2],.095,.78,.095,'red');}
 for(let i=0;i<points.length-1;i++)for(const h of[.18,.55,.78]){const a=points[i].slice(),b=points[i+1].slice();a[1]+=h;b[1]+=h;api.between(a,b,h===.78?.075:.055,h===.78?'redlight':'red',false,h===.78?.11:.075);}
 return{height:.78,postHeight:.86,totalEndPostHeight:1.04,posts:n+1};
}
export function buildWatercourtRoute131(api,terrain){
 const {emit,box,between}=api,capTop=A[1]-.35,west=[];
 for(const [i,[x,z]]of[[1.02,-4.5],[1.92,-4.5],[1.02,-3.45],[1.92,-3.45],[-.65,-3.65],[.55,-3.65]].entries()){const bottom=Math.min(terrain.heightAt(x,z)-.12,2.36),n=Math.max(1,Math.ceil((2.60-bottom)/.23));for(let j=0;j<n;j++){const top=bottom+(2.60-bottom)*(j+1)/n,h=(2.60-bottom)/n,w=.36-.04*j/n;box(x,top-h/2,z,w,h,w+.04,'stone');}west.push({x,z,bottom,top:2.60});}emit(prism(WATERCOURT131.westPlan,2.83,.23,'watercourt131-west-bearing-platform'),'stone');emit(prism(WATERCOURT131.westPlan,2.95,.12,'watercourt131-west-walking-deck'),'wood');
 const yaw=Math.atan2(-dz,dx),pieces=L.bridge.segments;
 for(let i=0;i<pieces;i++){const t=(i+.5)/pieces;box(A[0]+dx*t,floorAt(t)-.06,A[2]+dz*t,span/pieces+.012,.12,L.bridge.width,'wood',yaw);}
 for(const side of[-1,1])for(let i=0;i<pieces;i++){const t0=i/pieces,t1=(i+1)/pieces,a=[A[0]+dx*t0+N[0]*side*.43,floorAt(t0)-.12,A[2]+dz*t0+N[1]*side*.43],b=[A[0]+dx*t1+N[0]*side*.43,floorAt(t1)-.12,A[2]+dz*t1+N[1]*side*.43];emit(beam(a,b,.18,.23-(t0>.94?.03:0),'watercourt131-curved-load-stringer'),'wood');}
 const half=.52;for(const side of[-1,1])guard(api,Array.from({length:25},(_,i)=>{const t=i/24;return[A[0]+dx*t+N[0]*side*half,floorAt(t),A[2]+dz*t+N[1]*side*half];}));
 // Both primary stringers seat on real bank abutments; no pier is put in the
 // water aperture. The east timber bearing is notched above the stone seat.
 const footD=1.36,footW=.86;box(B[0],3.67,B[2],footW,.30,footD,'stone',yaw);box(B[0],3.85,B[2],.92,.06,1.42,'stone',yaw);
 const low=L.stair.a,high=L.stair.b,sdx=low[0]-high[0],sdz=low[2]-high[2],srun=Math.hypot(sdx,sdz),syaw=Math.atan2(sdx,sdz),sn=[-sdz/srun,sdx/srun];
 for(let i=0;i<10;i++){const t=(i+.5)/10,top=high[1]+(low[1]-high[1])*(i+1)/10;box(high[0]+sdx*t,top-.065,high[2]+sdz*t,.94,.13,srun/10+.035,'stone',syaw);}
 for(const side of[-1,1]){const a=[high[0]+sn[0]*side*.34,high[1]-.12,high[2]+sn[1]*side*.34],b=[low[0]+sn[0]*side*.34,low[1]-.12,low[2]+sn[1]*side*.34];emit(beam(a,b,.17,.25,'watercourt131-stair-supported-stringer'),'wood');guard(api,[[high[0]+sn[0]*side*.45,high[1],high[2]+sn[1]*side*.45],[low[0]+sn[0]*side*.45,low[1],low[2]+sn[1]*side*.45]],{endCaps:false});}
 guard(api,[[-.78,2.95,-3.35],[.75,2.95,-3.35],[A[0]+N[0]*.52,2.95,A[2]+N[1]*.52]],{endCaps:false,skipEndPost:true});
 return{revision:WATERCOURT131.revision,bridge:{a:A,b:B,width:1.20,arch:L.bridge.arch,span,bankSeats:[{world:[A[0],capTop,A[2]],soil:terrain.heightAt(A[0],A[2])},{world:[B[0],3.88,B[2]],soil:terrain.heightAt(B[0],B[2])}],waterClearSpan:true},stair:{upper:high,lower:low,steps:10,riser:(high[1]-low[1])/10,run:srun,width:.94},westPlan:WATERCOURT131.westPlan,westGroundedPiers:west,photoRGBOrProjection:false,visualAccepted:false};
}

// Object-space pruning of connected twigs, never a camera/image mask.
export function createPlantClearance131(){
 const boxes=[],grid=new Map(),cell=2;let cuts=0;
 const key=(i,j)=>i+','+j;
 function add(geometry,matrix){geometry.computeBoundingBox();const b=geometry.boundingBox.clone().applyMatrix4(matrix);if(![...b.min.toArray(),...b.max.toArray()].every(Number.isFinite))return;const id=boxes.length;boxes.push(b);for(let i=Math.floor(b.min.x/cell);i<=Math.floor(b.max.x/cell);i++)for(let j=Math.floor(b.min.z/cell);j<=Math.floor(b.max.z/cell);j++){const k=key(i,j);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(id);}}
 function blocked(a,b,r=.05){const aa=new T.Vector3(...a),bb=new T.Vector3(...b),query=new T.Box3().setFromPoints([aa,bb]).expandByScalar(r),ids=new Set();for(let i=Math.floor(query.min.x/cell);i<=Math.floor(query.max.x/cell);i++)for(let j=Math.floor(query.min.z/cell);j<=Math.floor(query.max.z/cell);j++)for(const id of grid.get(key(i,j))??[])ids.add(id);const d=bb.clone().sub(aa),len=d.length();if(len<1e-6)return false;const ray=new T.Ray(aa,d.multiplyScalar(1/len)),p=new T.Vector3();for(const id of ids){const box=boxes[id].clone().expandByScalar(r);if(box.containsPoint(aa)||box.containsPoint(bb)||ray.intersectBox(box,p)&&p.distanceTo(aa)<=len){cuts++;return true;}}return false;}
 return{add,blocked,info:()=>({method:'Prune complete generated bough/twig branches against real structural mesh bounds in world space',structuralBounds:boxes.length,blockedBranchQueries:cuts,notCameraDependent:true})};
}
