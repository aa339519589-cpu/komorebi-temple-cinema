import * as T from 'three';
import {CORRIDOR_LAYOUT as L} from './corridor-layout.js';

const W=L.wing,wingMatrix=new T.Matrix4().makeTranslation(...W.position).multiply(new T.Matrix4().makeRotationY(W.yaw));
const toWorld=([x,z])=>{const p=new T.Vector3(x,0,z).applyMatrix4(wingMatrix);return[p.x,p.z];};
export const CORRIDOR_SITE130={
 revision:'attached-low-galleries130',leftFloor:4.5,rightFloor:4.2,
 leftPlan:[[.35,-4.5],[3.30,-4.5],[3.30,2.1],[.35,2.1]].map(toWorld),
 rightPlan:[[3.75,-11.7],[4.25,-11.7],[4.25,-12.9],[11.2,-12.9],[11.2,-6.6],[6.6,-6.6],[6.6,-9.35],[3.75,-9.35]],
 rightSoil:3.98,
};
const area=P=>P.reduce((s,a,i)=>{const b=P[(i+1)%P.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2;
function half(P,a,b,inside){const out=[],cross=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length],u=cross(p),v=cross(q),ip=inside?u>=-1e-8:u<=1e-8,iq=inside?v>=-1e-8:v<=1e-8;if(ip)out.push(p);if(ip!==iq){const t=u/(u-v);out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}}return out;}
function subtract(P,C){if(area(C)<0)C=C.slice().reverse();const out=[];let remaining=P;for(let i=0;i<C.length&&remaining.length;i++){const a=C[i],b=C[(i+1)%C.length],part=half(remaining,a,b,false);if(part.length>2&&Math.abs(area(part))>.001)out.push(part);remaining=half(remaining,a,b,true);}return out;}
export function pointInPlan(x,z,P){let inside=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function floorSolid(P,top,depth,name){const shape=new T.Shape();P.forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1});g.rotateX(Math.PI/2);g.translate(0,top,0);g.name=name;g.userData.corridor130={closed:true,role:'load-bearing-floor'};return g;}
function stoneCourse(w,d,y0,y1,name){const rings=[],ch=.025;for(const [y,inset]of [[y0,.012],[y0+.008,0],[y1-.008,0],[y1,.012]]){const a=w/2-inset,b=d/2-inset;rings.push([[-a+ch,-b],[a-ch,-b],[a,-b+ch],[a,b-ch],[a-ch,b],[-a+ch,b],[-a,b-ch],[-a,-b+ch]].map(([x,z])=>[x,y,z]));}const p=rings.flat(2),ix=[];for(let j=0;j<3;j++)for(let k=0;k<8;k++){const a=j*8+k,b=j*8+(k+1)%8,c=a+8,e=b+8;ix.push(a,c,b,b,c,e);}for(const [row,reverse]of [[0,true],[3,false]]){const centre=p.length/3;p.push(0,row?y1:y0,0);for(let k=0;k<8;k++)ix.push(...(reverse?[centre,row*8+k,row*8+(k+1)%8]:[centre,row*8+(k+1)%8,row*8+k]));}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();g.name=name;g.userData.corridor130={closed:true,role:'coursed-bearing-pier'};return g;}
function bearingPier(api,x,z,bottom,top,label,records){if(!(top>bottom))throw Error('Invalid130pier '+label);const n=Math.max(1,Math.ceil((top-bottom)/.25));for(let i=0;i<n;i++){const width=.46-.07*i/n;api.emit(stoneCourse(width,width+.04,bottom+(top-bottom)*i/n,bottom+(top-bottom)*(i+1)/n,label+'-course-'+i),'stone',x,0,z);}records.push({label,x,z,bottom,top,courses:n});}
function porchColumn(api,x,z,floor,top,r=.12){api.box(x,floor+.07,z,r*2.7,.14,r*2.7,'stone');api.between([x,floor+.14,z],[x,top,z],r,'red',true);for(const y of[floor+.18,top-.04])api.box(x,y,z,r*2.1,.06,r*2.1,'oldgold');}
function leanRoof(api){const x0=2.02,x1=3.35,z0=-3.1,z1=1.1;
 const P=(u,v)=>[x0+(x1-x0)*u,6.25-1.10*Math.pow(u,1.25)+.15*Math.pow(u,8)*Math.pow(Math.abs(v*2-1),5),z0+(z1-z0)*v];
 const pp=[],uv=[],ix=[],nu=16,nv=44;for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const p=P(i/nu,j/nv);pp.push(...p);uv.push(p[0],p[2]);if(i<nu&&j<nv){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;ix.push(a,c,b,b,c,d);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.name='corridor130-attached-curved-lean-roof';api.emit(g,'tile');const coreP=pp.map((v,i)=>i%3===1?v-.02:v).concat(pp.map((v,i)=>i%3===1?v-.14:v)),count=pp.length/3,coreI=ix.slice();for(let i=0;i<ix.length;i+=3)coreI.push(ix[i]+count,ix[i+2]+count,ix[i+1]+count);const edge=[...Array.from({length:nu},(_,i)=>i),...Array.from({length:nv},(_,j)=>j*(nu+1)+nu),...Array.from({length:nu},(_,i)=>nv*(nu+1)+nu-i),...Array.from({length:nv},(_,j)=>(nv-j)*(nu+1))];for(let i=0;i<edge.length;i++){const a=edge[i],b=edge[(i+1)%edge.length];coreI.push(a,b,a+count,b,b+count,a+count);}const core=new T.BufferGeometry();core.setAttribute('position',new T.Float32BufferAttribute(coreP,3));core.setIndex(coreI);core.computeVertexNormals();core.name='corridor130-attached-closed-roof-core';core.userData.corridor130={closed:true,role:'curved-timber-roof-core'};api.emit(core,'wood');
 for(let j=0;j<=28;j++){const v=j/28;for(let i=0;i<8;i++){const a=P(i/8,v),b=P((i+1.035)/8,v);a[1]+=.025;b[1]+=.025;api.ceramicTile(a,b,.070,.97);}if(j%2===0){const a=P(0,v),b=P(1,v);a[1]-=.22;b[1]-=.22;api.between(a,b,.065,'wood',false,.11);}}
 for(const u of[0,1])for(let j=0;j<24;j++){const a=P(u,j/24),b=P(u,(j+1)/24);a[1]-=.16;b[1]-=.16;api.between(a,b,.085,'redlight',false,.14);}for(const v of[0,1])for(let i=0;i<16;i++){const a=P(i/16,v),b=P((i+1)/16,v);a[1]+=.02;b[1]+=.02;api.between(a,b,.065,'tileedge',true);}
 return{innerLocalX:x0,outerLocalX:x1,z:[z0,z1],innerWorldY:7.75,eaveWorldY:6.65,curl:.15};
}

export function buildAttachedPorch130(api,terrain,upperRoofY){
 const {emit,box,between,lattice}=api,main=new T.Matrix4().makeTranslation(...L.hall.position).multiply(new T.Matrix4().makeRotationY(L.hall.yaw)),inverse=wingMatrix.clone().invert(),clip=[[-5.075,-3.575],[5.075,-3.575],[5.075,3.575],[-5.075,3.575]].map(([x,z])=>{const p=new T.Vector3(x,0,z).applyMatrix4(main).applyMatrix4(inverse);return[p.x,p.z];}),base=[[.35,-4.5],[3.3,-4.5],[3.3,2.1],[.35,2.1]],floorParts=subtract(base,clip),piers=[];
 for(const [i,P]of floorParts.entries()){emit(floorSolid(P,2.88,.18,'corridor130-left-stone-floor-'+i),'stone');emit(floorSolid(P,3,.12,'corridor130-left-timber-floor-'+i),'wood');}
 for(const x of[.65,1.90,3.12])for(const z of[-4.1,-3.0,-.05,1.15]){if(!floorParts.some(P=>pointInPlan(x,z,P)))continue;const samples=[[-.23,-.25],[.23,-.25],[.23,.25],[-.23,.25],[0,0]].map(([dx,dz])=>{const p=new T.Vector3(x+dx,0,z+dz).applyMatrix4(wingMatrix);return{x:p.x,z:p.z,soil:terrain.heightAt(p.x,p.z)};}),top=2.40,bottom=Math.min(...samples.map(p=>p.soil-W.position[1]-.12),top-.30);bearingPier(api,x,z,bottom,top,'corridor130-left-bearing-'+piers.length,piers);piers.at(-1).groundSamples=samples;}
 for(const x of[.65,1.9,3.12])for(const P of floorParts){let strip=[[x-.14,-4.4],[x+.14,-4.4],[x+.14,2.0],[x-.14,2.0]],C=area(P)>0?P:P.slice().reverse();for(let i=0;i<C.length&&strip.length;i++)strip=half(strip,C[i],C[(i+1)%C.length],true);if(strip.length>2&&Math.abs(area(strip))>.001)emit(floorSolid(strip,2.70,.30,'corridor130-left-supported-floor-beam'),'wood');}
 for(const z of[-3.0,-.05,1.15]){porchColumn(api,3.12,z,3,4.92);between([1.9,4.92,z],[3.12,4.92,z],.11,'redlight',false,.18);}box(3.12,4.99,-.925,.18,.14,4.65,'red');
 // A real tall side facade carries the main roof; the low covered walkway
 // abuts it. The doorway is a void between infill bays, not a dark painted box.
 for(const z of[-4.3,-3.0,-1.5,0,1.4]){const top=upperRoofY(z)-.06;porchColumn(api,1.908,z,3,top,.14);}
 for(const [a,b]of[[-4.3,-3],[-3,-1.5],[-1.5,-.55],[.55,1.4]]){const z=(a+b)/2,d=b-a;box(1.908,4.02,z,.14,1.82,d-.14,'wall');api.group(1.99,0,z,Math.PI/2,()=>lattice(0,4.10,0,d*.68,1.32));box(1.908,6.05,z,.15,.24,d,'red');const top=Math.min(upperRoofY(a),upperRoofY(b))-.5;if(top>6.6){box(1.908,(top+6.35)/2,z,.13,top-6.35,d-.16,'wall');api.group(2.0,0,z,Math.PI/2,()=>lattice(0,(top+6.38)/2,0,d*.68,Math.max(.2,top-6.52)));}}
 for(const z of[-.55,.55])box(1.908,4.20,z,.23,2.4,.16,'red');box(1.908,5.42,0,.25,.18,1.25,'red');
 const start=new T.Vector3(5.06,4.95-L.hall.position[1],1.1).applyMatrix4(main).applyMatrix4(inverse),end=new T.Vector3(2.8,3,1.5),dir=end.clone().sub(start),run=Math.hypot(dir.x,dir.z),yaw=Math.atan2(dir.x,dir.z);for(let i=0;i<3;i++){const t=(i+.5)/3,top=start.y+(end.y-start.y)*(i+1)/3;box(start.x+dir.x*t,top-.07,start.z+dir.z*t,.90,.14,run/3+.04,'wood',yaw);}for(const side of[-1,1]){const ox=-dir.z/run*.31*side,oz=dir.x/run*.31*side;between([start.x+ox,start.y-.21,start.z+oz],[end.x+ox,end.y-.21,end.z+oz],.13,'wood',false,.19);}
 const roof=leanRoof(api);
 return{revision:'one-attached-main-hall-porch130',floorWorldY:4.5,floorLocalPolygons:floorParts,mainFoundationClipLocal:clip,roof,piers,doorLocalZ:[-.55,.55],mainHallConnection:{from:start.toArray(),to:end.toArray(),steps:3},photoReading:'Covered side porch attached to the tall hall facade, not another complete independent hall',physicalAcceptance:false};
}

export function buildRightCourt130(api,terrain){
 const {emit,box,between}=api,P=CORRIDOR_SITE130.rightPlan;
 emit(floorSolid(P,4.08,.20,'corridor130-right-shared-stone-court'),'stone');emit(floorSolid(P,4.2,.12,'corridor130-right-shared-timber-court'),'wood');
 const pillars=[];for(const x of[3.95,5.85,7.75])for(const z of[-11.5,-9.55]){porchColumn(api,x,z,4.2,6.34,.12);pillars.push({x,z,bottom:4.2,top:6.34});}
 for(const z of[-11.5,-9.55])box(5.85,6.46,z,4.10,.24,.20,'red');for(const x of[3.95,5.85,7.75])between([x,6.56,-11.5],[x,6.56,-9.55],.10,'wood',false,.16);
 api.group(5.9,0,-10.6,0,()=>api.roof(4.6,2.8,6.7,1.5,.45,.22,.22));
 // The taller pavilion has its posts outside the low roof footprint and
 // continuous upper beams above its crown. Both levels share one L-shaped deck.
 const highPosts=[[6.8,-7.9],[10.8,-7.9],[4.6,-12.55],[10.8,-12.55]];for(const [x,z]of highPosts){porchColumn(api,x,z,4.2,8.45,.18);api.brackets(x,8.3,z,.65);}for(const [a,b]of[[highPosts[0],highPosts[1]],[highPosts[2],highPosts[3]],[highPosts[1],highPosts[3]],[highPosts[0],highPosts[2]]])between([a[0],8.60,a[1]],[b[0],8.60,b[1]],.16,'red',false,.24);
 function upperSurfaceY(x,z){const dx=x-7.9,dz=z+9.6,c=Math.cos(-.15),s=Math.sin(-.15),xx=Math.abs(c*dx-s*dz),zz=Math.abs(s*dx+c*dz),rh=7.5*.22,hw=3.75,hd=2.8,t=Math.max(zz/hd,(xx-rh)/(hw-rh)),span=rh+(hw-rh)*t,u=zz/hd>=((xx-rh)/(hw-rh))?xx/span:zz/(hd*t);return 9+1.85*Math.pow(Math.max(0,1-t),1.65)+.60*Math.pow(t,8)*(.22+.78*Math.pow(u,7));}
 for(const [x,z]of highPosts){const top=upperSurfaceY(x,z)-.26;if(top>8.76)box(x,(top+8.76)/2,z,.18,top-8.76,.20,'wood');}
 api.group(7.9,0,-9.6,-.15,()=>api.roof(7.5,5.6,9,1.85,.60,.22,.35));
 // Back infill belongs to the walkway and leaves its garden side open.
 for(const [a,b]of[[4.05,5.75],[5.95,7.65]]){box((a+b)/2,4.85,-11.55,b-a,.95,.14,'wall');api.lattice((a+b)/2,5.82,-11.48,(b-a)*.80,1.05);}
 return{revision:'shared-open-right-pavilion-and-low-gallery130',floorWorldY:4.2,plan:P,soilCourtY:CORRIDOR_SITE130.rightSoil,lowRoof:{centre:[5.9,-10.6],w:4.6,d:2.8,eave:6.7,rise:1.5,curl:.45},lowPosts:pillars,highPosts,highRoof:{centre:[7.9,-9.6],w:7.5,d:5.6,eave:9},bridgeLanding:L.bridge.b,physicalAcceptance:false};
}
