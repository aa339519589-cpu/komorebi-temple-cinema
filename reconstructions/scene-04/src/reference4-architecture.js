import {buildDeepEntranceCarving} from './scene04-carving.js';
import {polygonSlab} from './scene04-surfaces.js';
import {createRestorationArchitecture} from './reference4-detail-kernel.js';
import {createReference4MaterialSet} from './reference4-materials.js';
import {createWeatheredFlagstone} from './reference4-garden-stone.js';

// A new complete exterior reconstruction after the execution filesystem reset.
// NOT a byte recovery of v3/371b. Original 4 and the actual v3 image are references.
export const REFERENCE4_ARCHITECTURE_REVISION='reference4-foundation-v4-rebuilt-connected-eaves';
export function buildReference4Architecture(T,options={}) {
 const C={stairTopY:1.8,stairTopZ:0,stairBottomZ:8,stairWidth:5.6,columnAxes:[-6.88,-4.73,-2.86,2.86,4.73,6.88],capitalTop:7.15,ridgeY:13.2,ridgeZ:-5,lowerRoofWidth:18,upperRoofWidth:16.4,towerPosition:[-14.21,-.64,-12.0044],towerHeight:15.3,towerSceneScale:1.16,...options};
 if(!(C.stairTopY>0&&C.stairBottomZ>C.stairTopZ&&C.ridgeY>C.capitalTop+3))throw Error('Invalid complete exterior dimensions');
 const group=new T.Group();group.name=REFERENCE4_ARCHITECTURE_REVISION;
 const {mats,materials,textures}=createReference4MaterialSet(T,C),geometries=new Set(),buckets=new Map(),stack=[new T.Matrix4()],roles={};
 const cube=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(1,1,1,24),sphere=new T.SphereGeometry(1,12,8);let activeRole='architecture';
 const V=a=>new T.Vector3(...a), H=y=>y+C.stairTopY-3;
 function emit(g,ma,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0,tint=1){const m=typeof ma==='string'?mats[ma]:ma;if(!m)throw Error('Missing material '+ma);const e=Array.isArray(rot)?new T.Euler(...rot):new T.Euler(0,Number(rot)||0,0),tr=new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromEuler(e),V([sx,sy,sz])).premultiply(stack.at(-1));put(g,m,tr,tint);}
 function put(g,m,tr,tint=1){if(!tr.elements.every(Number.isFinite))throw Error('Nonfinite transform');const key=g.uuid+':'+m.uuid;let b=buckets.get(key);if(!b){b={g,m,items:[]};buckets.set(key,b);}b.items.push({tr,tint,role:activeRole});geometries.add(g);roles[activeRole]=(roles[activeRole]||0)+1;}
 function box(x,y,z,w,h,d,ma='cedar',rot=0,tint=1){if(w>0&&h>0&&d>0)emit(cube,ma,x,y,z,w,h,d,rot,tint);}
 function grouped(x,y,z,yaw,fn,scale=1){const q=new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromAxisAngle(V([0,1,0]),yaw),V([scale,scale,scale]));stack.push(stack.at(-1).clone().multiply(q));try{fn();}finally{stack.pop();}}
 function role(name,fn){const r=activeRole;activeRole=name;try{return fn();}finally{activeRole=r;}}
 function between(a,b,w,d,ma='cedar',round=false){a=V(a);b=V(b);const v=b.clone().sub(a);if(v.length()<1e-8)return;put(round?cyl:cube,mats[ma],new T.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(V([0,1,0]),v.clone().normalize()),V([w,v.length(),d])).premultiply(stack.at(-1)));}
 const arch=createRestorationArchitecture({instance:emit,group:grouped,box,stack,columns:[],roofAudit:[]});
 function meshFromTriangles(pp,uv,tag){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.userData.architectureMember=tag;return g;}
 function shell(grid,down,up,tag){const pp=[],uv=[],nz=grid.length,nx=grid[0].length;const q=(p,h)=>[p[0],p[1]+h,p[2]];
  function tri(a,b,c){if(V(b).sub(V(a)).cross(V(c).sub(V(a))).lengthSq()<1e-18)return;const n=V(b).sub(V(a)).cross(V(c).sub(V(a)));const drop=[Math.abs(n.x),Math.abs(n.y),Math.abs(n.z)].indexOf(Math.max(Math.abs(n.x),Math.abs(n.y),Math.abs(n.z))),axes=[0,1,2].filter(k=>k!==drop);for(const p of[a,b,c]){pp.push(...p);uv.push(p[axes[0]],p[axes[1]]);}}
  const quad=(a,b,c,d)=>{tri(a,b,c);tri(b,d,c);};
  for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=grid[j][i],b=grid[j][i+1],c=grid[j+1][i],d=grid[j+1][i+1];quad(q(a,up),q(c,up),q(b,up),q(d,up));quad(q(a,down),q(b,down),q(c,down),q(d,down));}
  for(let i=0;i<nx-1;i++){quad(q(grid[0][i],down),q(grid[0][i],up),q(grid[0][i+1],down),q(grid[0][i+1],up));quad(q(grid[nz-1][i],up),q(grid[nz-1][i],down),q(grid[nz-1][i+1],up),q(grid[nz-1][i+1],down));}
  for(let j=0;j<nz-1;j++){quad(q(grid[j][0],up),q(grid[j][0],down),q(grid[j+1][0],up),q(grid[j+1][0],down));quad(q(grid[j][nx-1],down),q(grid[j][nx-1],up),q(grid[j+1][nx-1],down),q(grid[j+1][nx-1],up));}
  let volume=0;for(let i=0;i<pp.length;i+=9)volume+=V(pp.slice(i,i+3)).dot(V(pp.slice(i+3,i+6)).cross(V(pp.slice(i+6,i+9))))/6;if(volume<0)for(let i=0;i<pp.length;i+=9){for(let k=0;k<3;k++)[pp[i+3+k],pp[i+6+k]]=[pp[i+6+k],pp[i+3+k]];const j=i/3*2;for(let k=0;k<2;k++)[uv[j+2+k],uv[j+4+k]]=[uv[j+4+k],uv[j+2+k]];}return meshFromTriangles(pp,uv,tag);
 }
 function gridAt(xs,zs,fn){return zs.map(z=>xs.map(x=>[x,fn(x,z),z]));}
 const lin=(a,b,n)=>Array.from({length:n+1},(_,i)=>a+(b-a)*i/n), smooth=t=>t*t*(3-2*t);
 function tube(points,r,ma='oldgold',n=32){const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(V)),n,r,6,false);emit(g,ma);}
 function rosette(x,y,z,r,ma='gold'){for(let i=0;i<8;i++){const a=i*Math.PI/4;emit(sphere,ma,x+Math.cos(a)*r*.49,y+Math.sin(a)*r*.49,z,r*.32,r*.18,r*.08,[0,0,a]);}emit(sphere,ma,x,y,z+.005,r*.23,r*.23,r*.08);}
 function relief(x,y,z,w,h){for(const s of[-1,1])for(let j=0;j<3;j++){const xx=x+s*w*(.15+j*.115);tube([[xx-s*w*.09,y-h*.14,z],[xx-s*w*.04,y+h*.25,z+.012],[xx+s*w*.02,y+h*.13,z+.02],[xx+s*w*.05,y-h*.12,z]],.012,'oldgold',12);}rosette(x,y,z+.018,Math.min(.14,h*.42));}
 const barrel=(()=>{const pp=[],uv=[],N=8;const pt=(a,z,r)=>[Math.cos(a)*r,Math.sin(a)*r,z];const tri=(a,b,c)=>{for(const p of[a,b,c]){pp.push(...p);uv.push(p[0],p[2]);}},quad=(a,b,c,d)=>{tri(a,b,c);tri(b,d,c);};for(let i=0;i<N;i++){const a=i*Math.PI/N,b=(i+1)*Math.PI/N;quad(pt(a,-.5,1),pt(b,-.5,1),pt(a,.5,1),pt(b,.5,1));quad(pt(a,-.5,.76),pt(a,.5,.76),pt(b,-.5,.76),pt(b,.5,.76));quad(pt(a,-.5,.76),pt(b,-.5,.76),pt(a,-.5,1),pt(b,-.5,1));quad(pt(a,.5,.76),pt(a,.5,1),pt(b,.5,.76),pt(b,.5,1));}quad(pt(0,-.5,.76),pt(0,-.5,1),pt(0,.5,.76),pt(0,.5,1));quad(pt(Math.PI,-.5,1),pt(Math.PI,-.5,.76),pt(Math.PI,.5,1),pt(Math.PI,.5,.76));return meshFromTriangles(pp,uv,'closed-half-barrel-ceramic');})();
 function tileBetween(a,b,r=.067,tint=1){a=V(a);b=V(b);const z=b.clone().sub(a),len=z.length();if(len<.03)return;z.normalize();let x=V([0,1,0]).cross(z).normalize();if(x.length()<.1)x.set(1,0,0);const y=z.clone().cross(x).normalize();const m=new T.Matrix4().makeBasis(x,y,z);m.scale(V([r,r,len]));m.setPosition(a.clone().add(b).multiplyScalar(.5));m.premultiply(stack.at(-1));put(barrel,mats.slate,m,tint);}

 // Common curved canopy/main-roof weather profile. Front remains the source-led arch.
 const gHalf=6.5,gFront=1.55,upperFront=C.ridgeZ+4.5,gBack=Math.min(-2.4,upperFront-.3),xs=Array.from(new Set([...lin(-gHalf,gHalf,80),...lin(-C.upperRoofWidth/2,C.upperRoofWidth/2,64).filter(x=>Math.abs(x)<=gHalf)].map(x=>x.toFixed(9)))).map(Number).sort((a,b)=>a-b);
 const archFront=x=>H(8.2)+2.5*(Math.exp(-3.4*(x/gHalf)**2)-Math.exp(-3.4))/(1-Math.exp(-3.4));
 const rawCanopy=(x,z)=>archFront(x)+.35*(gFront-z)/(gFront-gBack);
 function upperRaw(x,z){const t=(z-C.ridgeZ)/4.5,span=C.upperRoofWidth*(.275+.225*t),u=x/span;return H(10.17)+(C.ridgeY-H(10.17))*Math.pow(Math.max(0,1-t),1.48)+.62*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),6));}
 function joinTop(x,z){return z>=gBack&&Math.abs(x)<=gHalf?Math.max(upperRaw(x,z),rawCanopy(x,z)+.025):upperRaw(x,z);}
 function canopy(x,z){if(z<=upperFront)return joinTop(x,z)-.025;const f=smooth(Math.max(0,Math.min(1,(gFront-z)/(gFront-upperFront))));return rawCanopy(x,z)+(joinTop(x,upperFront)-.025-rawCanopy(x,upperFront))*f;}
 function roof({name,w,d,eave,rise,curl=.45,centerZ=0,inner=.0,frontGap=0,connected=false}){return role(name,()=>{
  const hw=w/2,hd=d/2,rh=w*.275;const P=(side,t,u)=>{const span=rh+(hw-rh)*t;let x,z;if(side===0||side===2){x=u*span;z=(side===0?1:-1)*hd*t;}else{x=(side===1?1:-1)*span;z=u*hd*t;}
   let y=eave+rise*Math.pow(Math.max(0,1-t),1.48)+curl*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),6));z+=centerZ;if(connected&&side===0)y=joinTop(x,z);return[x,y,z];};
  for(let side=0;side<4;side++){
   const ranges=side===0&&frontGap?[[-1,-.001],[.001,1]]:[[-1,1]];
   for(const range of ranges){const ts=lin(inner,1,22),us=lin(range[0],range[1],48);let grid=ts.map(t=>us.map(u=>{if(side===0&&frontGap){const span=rh+(hw-rh)*t;u=Math.sign(u)*(frontGap/span+(1-frontGap/span)*Math.abs(u));}return P(side,t,u);}));
    if(connected&&side===0){const uu=Array.from(new Set([...lin(-1,1,64),...xs.map(x=>x/hw)].map(x=>x.toFixed(10)))).map(Number).sort((a,b)=>a-b);grid=ts.map(t=>uu.map(u=>P(side,t,u)));}
    emit(shell(grid,-.06,0,name+'-ceramic-layer'),'slate');emit(shell(grid,-.185,-.06,name+'-timber-deck'),'darkwood');
   }
   const rows=Math.max(12,Math.round((side%2?d:w)/.205));
   for(let i=0;i<=rows;i++){const u=-1+2*i/rows;if(side===0&&frontGap&&Math.abs(P(side,1,u)[0])<frontGap+.08)continue;
    const pieces=Math.max(6,Math.ceil(Math.hypot(side%2?hw-rh:hd,rise)*(1-inner)/.36));
    for(let j=0;j<pieces;j++){const t0=inner+(1-inner)*j/pieces,t1=inner+(1-inner)*(j+.96)/pieces;const p=P(side,t0,u),q=P(side,t1,u);tileBetween(p,q,.065,.94+.10*(.5+.5*Math.sin(i*11.3+j*4.7)));}
    const end=P(side,1,u);if(!(connected&&side===0&&Math.abs(end[0])<gHalf)){arch.tileEnd(V(end),side*Math.PI/2,.074,i%2===0);const a=P(side,.75,u),b=P(side,1.035,u);a[1]-=.24;b[1]-=.24;between(a,b,.105,.16,'red');}
   }
   // Exposed eave fascia follows the real curled roof. Central joined edge is not a second fascia.
   for(let i=0;i<36;i++){const u=-1+2*i/36,v=-1+2*(i+1)/36,a=P(side,1,u),b=P(side,1,v);if(side===0&&(frontGap&&Math.min(Math.abs(a[0]),Math.abs(b[0]))<frontGap||connected&&Math.max(Math.abs(a[0]),Math.abs(b[0]))<gHalf))continue;a[1]-=.24;b[1]-=.24;between(a,b,.13,.23,'cedar');}
   if(side<2)for(const sign of[-1,1]){const pts=lin(inner,1.035,16).map(t=>{const p=P(side,t,sign);p[1]+=.075;return p;});tube(pts,.095,'slate',32);}
  }
  if(inner===0){box(0,eave+rise+.10,centerZ,rh*2+.12,.30,.24,'slate');box(0,eave+rise+.285,centerZ,rh*2+.14,.07,.30,'tileEdge');for(const s of[-1,1]){tube([[s*rh,eave+rise+.1,centerZ],[s*(rh+.15),eave+rise+.22,centerZ],[s*(rh+.23),eave+rise+.51,centerZ]],.095,'slate',16);rosette(s*(rh-.16),eave+rise+.12,centerZ+.145,.10,'oldgold');}}
  return {P,bounds:{w,d,eave,rise},centerZ};
 });}

 role('temple-platform-stair',()=>{
  box(0,(C.stairTopY-.9)/2,-4.4,15.2,C.stairTopY+.9,9.5,'stone');box(0,C.stairTopY-.065,-4.4,15.45,.13,9.65,'granite');
  const n=20,run=C.stairBottomZ-C.stairTopZ;for(let i=0;i<n;i++){const top=C.stairTopY*(n-i)/n,z0=C.stairTopZ+run*i/n,z1=C.stairTopZ+run*(i+1)/n;box(0,top/2,(z0+z1)/2,C.stairWidth,top,z1-z0,'stone',0,.94+.07*Math.sin(i*3.1));for(let k=0;k<4;k++){
    const width=C.stairWidth/4-.018,x=-C.stairWidth/2+(k+.5)*C.stairWidth/4;
    const g=polygonSlab([[x-width/2,z0],[x+width/2,z0],[x+width/2,z1],[x-width/2,z1]],top+.006,.08,1307+i*31+k*107);
    emit(g,'granite');
   }}
  for(const s of[-1,1]){const x=s*(C.stairWidth/2+.23);between([x,C.stairTopY+.9,C.stairTopZ],[x,.9,C.stairBottomZ],.13,.14,'red');between([x,C.stairTopY+.44,C.stairTopZ],[x,.44,C.stairBottomZ],.11,.11,'red');for(let i=0;i<=8;i++){const t=i/8,y=C.stairTopY*(1-t),z=C.stairTopZ+run*t;box(x,y+.51,z,.17,1.02,.17,'red');emit(sphere,'oldgold',x,y+1.03,z,.12,.15,.12);}}
  for(const sign of[-1,1]){
   const x=sign*(C.stairWidth/2+.23),z=C.stairBottomZ+.02;
   box(x,.61,z,.32,1.22,.32,'red');box(x,.08,z,.40,.16,.40,'oldgold');
   box(x,1.25,z,.37,.08,.37,'oldgold');emit(sphere,'oldgold',x,1.42,z,.14,.20,.14);
   for(const yy of[.36,.73,1.04]){arch.squareFitting(x,yy,z+.173,.265,.26,0,true);relief(x,yy,z+.19,.24,.22);}
   for(const s of[-1,1])box(x+s*.135,.65,z+.17,.025,1.11,.026,'oldgold');
  }
  for(const s of[-1,1])for(const y of[C.stairTopY+.38,C.stairTopY+.81])box(s*5.35,y,.23,4.8,.12,.14,'red');
  for(const s of[-1,1])for(let i=0;i<9;i++)box(s*(3.2+i*.55),C.stairTopY+.49,.23,.11,.84,.11,'red');
 });
 role('hall-red-columns',()=>{for(let i=0;i<C.columnAxes.length;i++){const x=C.columnAxes[i],cap=Math.abs(x)<3?C.capitalTop:Math.abs(x)<5?C.capitalTop-.9:C.capitalTop-1.3;arch.footColumn(x,0,C.stairTopY,cap-C.stairTopY-.3,Math.abs(x)<3?.29:.26);arch.brackets(x,cap-.06,0,.84);}
  for(const z of[-3.6,-7.8])for(const x of[-6.88,-2.86,2.86,6.88]){arch.footColumn(x,z,C.stairTopY,5.8,.27);arch.brackets(x,C.stairTopY+6.02,z,.78);}
 });
 role('hall-enclosure-doors',()=>{
  box(0,C.stairTopY+3.75,-8.65,14.2,7.5,.23,'darkwood');for(const s of[-1,1])box(s*7.02,C.stairTopY+2.9,-4.5,.20,5.8,8.4,'red');
  for(const s of[-1,1])for(const seg of[[3.0,4.55],[4.95,6.7]]){const x=s*(seg[0]+seg[1])/2,w=seg[1]-seg[0],h=3.8,y=C.stairTopY+h/2+.22;box(x,y,-.57,w,h,.16,'darkwood');for(const xx of[-w/2,w/2])box(x+xx,y,-.42,.09,h+.13,.12,'red');for(const yy of[-h/2,h/2])box(x,y+yy,-.39,w,.11,.13,'cedar');for(let k=1;k<8;k++)box(x-w/2+w*k/8,y,-.39,.032,h-.15,.045,'oldgold');for(let k=1;k<13;k++)box(x,y-h/2+h*k/13,-.385,w-.1,.025,.05,'cedar');}
  for(const sign of[-1,1])for(const [cx,w]of[[3.77,1.62],[5.83,1.85]]){
   box(sign*cx,C.stairTopY+4.22,-.57,w,.66,.18,'darkwood');
   for(const yy of[C.stairTopY+3.93,C.stairTopY+4.50])box(sign*cx,yy,-.435,w,.075,.085,'cedar');
  }
  // Upper gallery is enclosed timber, not an unrelated open lattice triangle.
  box(0,H(9.7),-1.04,13.1,2.22,.18,'darkwood');for(let i=0;i<33;i++)box(-6.4+i*.4,H(9.7),-.925,.37,2.18,.055,'cedar',0,.94+.08*Math.sin(i));
 });
 role('central-real-portal',()=>{
  const clearW=4.2,clearH=4.08,z=-.62,y0=C.stairTopY;
  for(const s of[-1,1]){box(s*(clearW/2+.21),y0+clearH/2,z,.42,clearH,.50,'cedar');box(s*(clearW/2+.21),y0+clearH/2,z+.264,.33,clearH,.028,'oldgold');for(let j=0;j<10;j++)relief(s*(clearW/2+.21),y0+.23+j*.405,z+.285,.29,.28);box(s*(clearW/2+.035),y0+clearH/2,z-.08,.07,clearH,.42,'gold');}
  box(0,y0+clearH+.23,z,5.04,.46,.50,'cedar');box(0,y0+clearH+.23,z+.265,4.85,.34,.026,'oldgold');for(let j=-5;j<=5;j++)relief(j*.405,y0+clearH+.23,z+.285,.35,.24);box(0,y0+.035,z,4.2,.07,.60,'darkwood');
  for(const y of[C.capitalTop-.40,C.capitalTop+.20]){box(0,y,.06,6.15,.36,.52,'red');for(const x of[-2.4,-1.6,-.8,0,.8,1.6,2.4])relief(x,y,.333,.68,.25);}
  for(const s of[-1,1])for(const span of[[2.86,4.73,C.capitalTop-.9],[4.73,6.88,C.capitalTop-1.3]]){const x=s*(span[0]+span[1])/2,w=span[1]-span[0];box(x,span[2]+.12,.04,w,.32,.44,'red');relief(x,span[2]+.12,.272,w*.84,.24);}
 });

 const upper=roof({name:'main-upper-roof',w:C.upperRoofWidth,d:9,eave:H(10.17),rise:C.ridgeY-H(10.17),curl:.62,centerZ:C.ridgeZ,connected:true});
 for(const x of[-3.9,0,3.9])rosette(x,C.ridgeY+.13,C.ridgeZ+.18,.17,'oldgold');
 roof({name:'lower-shoulder-roof',w:C.lowerRoofWidth,d:10.2,eave:H(7.55),rise:2.36,curl:.56,centerZ:-4.5,inner:.50,frontGap:6.53});
 role('entrance-deep-connected-canopy',()=>{
  const zs=lin(upperFront,gFront,15),weather=gridAt(xs,zs,canopy);emit(shell(weather,-.035,.025,'connected-canopy-ceramics'),'slate');emit(shell(weather,-.16,-.035,'connected-canopy-timber-deck'),'cedar');
  // 37 individually solid rough-sawn rafters. Boards are above them, so the
  // underside presents true member depth and air gaps, not a smooth false skin.
  const rr=lin(-gHalf+.1,gHalf-.1,36);for(let k=0;k<rr.length;k++){const x=rr[k],rgrid=gridAt([x-.065,x+.065],lin(gBack,gFront+.09,30),canopy);emit(shell(rgrid,-.39,-.16,'visible-curved-cedar-rafter'),'cedar');}
  for(const z of[gBack,-.48,.57]){const curve=gridAt(xs,[z-.11,z+.11],canopy);emit(shell(curve,-.64,-.39,'transverse-curved-carrier'),'red');}
  // Front bargeboard is a real closed curved beam, queried by the lantern arms.
  const barge=shell(gridAt(xs,[gFront-.17,gFront+.07],canopy),-.47,-.02,'entrance-saddled-bargeboard');emit(barge,'cedar');
  for(const drop of[-.04,-.45])tube(xs.map(x=>[x,canopy(x,gFront+.08)+drop,gFront+.085]),.018,'oldgold',120);
  for(const x of[-5.6,-4.3,-2.9,-1.5,1.5,2.9,4.3,5.6]){const y=canopy(x,gFront+.08)-.25;box(x,y,gFront+.084,.27,.34,.025,'oldgold');for(const sx of[-1,1])box(x+sx*.126,y,gFront+.105,.016,.34,.012,'gold');for(const sy of[-1,1])box(x,y+sy*.16,gFront+.105,.25,.016,.012,'gold');rosette(x,y,gFront+.108,.057,'darkwood');for(const sx of[-1,1])for(const sy of[-1,1])emit(sphere,'gold',x+sx*.095,y+sy*.125,gFront+.113,.011,.011,.006);}
  for(let i=0;i<=62;i++){const x=-gHalf+2*gHalf*i/62;const ts=lin(upperFront,gFront+.04,7);for(let j=0;j<ts.length-1;j++)tileBetween([x,canopy(x,ts[j])+.025,ts[j]],[x,canopy(x,ts[j+1])+.025,ts[j+1]],.063,.96+.05*Math.sin(i*5+j));arch.tileEnd(V([x,canopy(x,gFront+.04)+.025,gFront+.06]),0,.074,i%2===0);}
  // Discrete curved ribs and inset timber panels retain the arch depth.
  for(const x of[-2.9,0,2.9]){const y=canopy(x,.57)-.65;box(x,(y+C.capitalTop+.36)/2,.57,.18,Math.max(.05,y-C.capitalTop-.36),.20,'red');}
  relief(0,canopy(0,gFront+.08)-.25,gFront+.10,1.05,.29);
  const peak=canopy(0,gFront)+.025;box(0,peak+.22,gFront-.1,.40,.45,.34,'slate');rosette(0,peak+.25,gFront+.09,.17,'gold');tube([[-.32,peak+.03,gFront-.1],[-.28,peak+.40,gFront-.1],[0,peak+.70,gFront-.1],[.28,peak+.4,gFront-.1],[.32,peak+.03,gFront-.1]],.09,'slate',32);emit(sphere,'oldgold',0,peak+.73,gFront-.1,.07,.13,.07);
 });



 // Individually jointed old retaining masonry around the stair opening.
 role('exposed-jointed-terrace-masonry',()=>{
  const wall=(x0,x1,z,height)=>{
   const courses=Math.ceil(height/.43);
   for(let j=0;j<courses;j++){
    const pitch=1.18,shift=j%2?.53:0;
    for(let x=x0-pitch+shift;x<x1;x+=pitch){const left=Math.max(x0,x),right=Math.min(x1,x+pitch-.018);if(right-left<.08)continue;
     const g=createWeatheredFlagstone(right-left,.414,.14,2281+j*79+Math.round(x*83));g.rotateX(Math.PI/2);emit(g,'stone',(left+right)/2,.22+j*.43,z,1,1,1,0,.83+.15*Math.sin(x*3+j));
    }
   }
  };
  for(const sign of[-1,1]){wall(sign<0?-7.65:2.96,sign<0?-2.96:7.65,.37,3.45);wall(sign<0?-17.8:7.7,sign<0?-7.7:17.8,-1.82,2.8);}
 });
 // Full-deep entrance joinery: curved arch ribs, closely spaced bearing sets,
 // pierced floral carving and the small shrine inside the karahafu recess.
 role('entrance-layered-joinery',()=>{
  for(const z of [.72,.15,-.6,-1.4]){
   for(const drop of [.70,.91,1.12]){
    const xx=xs.filter(x=>Math.abs(x)<3.05);
    const grid=gridAt(xx,[z-.055,z+.055],(x,zz)=>canopy(x,zz)-drop);
    emit(shell(grid,-.075,.075,'deep-karahafu-arched-rib'),'darkwood');
   }
  }
  for(let i=-6;i<=6;i++){
   const x=i*.44,top=canopy(x,.78)-1.25,bottom=C.capitalTop+.35;
   if(top>bottom+.12){box(x,(top+bottom)/2,.72,.095,top-bottom,.16,'cedar');rosette(x,bottom+.13,.818,.065,'oldgold');}
  }
  for(const z of [.53,-.26])for(let i=-5;i<=5;i++){
   const x=i*.53,y=C.capitalTop+.12;
   if(i%2===0)arch.brackets(x,y,z,.47,{detail:true,interlocked:true,material:'cedar'});
  }
  for(const side of[-1,1])for(let i=0;i<7;i++){
   const x=side*(3.2+i*.48),y=canopy(x,.62)-.95;
   arch.brackets(x,y,.60,.35,{detail:false,interlocked:true,material:'red'});
  }
  // Crossbeam has a pierced gold scrolling relief with visible wood behind it.
  for(const y of[C.capitalTop+.26,C.capitalTop-.40]){
   box(0,y,.49,5.7,.35,.35,'darkwood');
   for(let i=-8;i<=8;i++){
    const x=i*.315;
    tube([[x-.14,y-.04,.68],[x-.12,y+.075,.695],[x,y+.11,.70],[x+.12,y+.04,.695],[x+.10,y-.075,.695],[x-.01,y-.09,.70]],.012,'oldgold',16);
    if(i%2===0)rosette(x,y,.718,.065,'gold');
   }
  }
  const shrineY=C.capitalTop+.68;
  box(0,shrineY+.40,.87,.46,.85,.18,'black');
  for(const sign of[-1,1]){
   box(sign*.25,shrineY+.40,.98,.025,.89,.026,'oldgold');
   tube([[sign*.25,shrineY,.97],[sign*.52,shrineY+.04,.97],[sign*.67,shrineY+.18,.97],[sign*.55,shrineY+.31,.97],[sign*.42,shrineY+.21,.97]],.022,'gold',22);
  }
  for(let j=0;j<4;j++)emit(sphere,'gold',0,shrineY+.14+j*.17,1,.075-j*.01,.09-j*.01,.035);
  box(0,shrineY+.85,.98,.53,.04,.04,'oldgold');
  // Lower eaves have real purlin ends and alternating engraved finials.
  for(const sign of[-1,1])for(let i=0;i<22;i++){
   const x=sign*(3.25+i*.25);if(Math.abs(x)>8.9)continue;
   const y=H(7.55)+.24+.28*Math.pow(Math.abs(x)/9,8);
   box(x,y-.39,.61,.10,.13,.73,'cedar');
   if(i%4===0)arch.squareFitting(x,y-.39,1.00,.10,.12,0,false);
  }
 });
 // Low enclosing galleries are architecture, not a free-standing temple in a park.
 role('side-gallery-foundations',()=>{for(const s of[-1,1]){box(s*12.65,.95,-4.6,10.3,3.8,5.5,'stone');box(s*16.8,.95,.5,4.2,3.8,10.7,'stone');}});
 for(const s of[-1,1]){
  grouped(s*12.65,1.7,-4.6,0,()=>{role('side-gallery-red-frame',()=>{for(const z of[-1.7,1.7])for(let i=0;i<=5;i++){const x=-4.5+i*1.8;arch.footColumn(x,z,1.0,3.25,.15);arch.brackets(x,4.42,z,.55);}for(const z of[-1.7,1.7]){box(0,4.55,z,9.8,.22,.24,'red');box(0,1.28,z,9.8,.32,.15,'red');box(0,1.96,z,9.8,.11,.13,'red');for(let i=0;i<40;i++)box(-4.7+i*.24,1.62,z,.065,.60,.065,'red');}box(0,2.72,-1.85,9.75,2.6,.15,'plaster');for(let i=-2;i<=2;i++)box(i*1.82,2.65,-1.73,1.20,1.6,.10,'darkwood');});roof({name:'side-gallery-roof',w:10.5,d:5.6,eave:4.8,rise:1.26,curl:.35});});
  grouped(s*16.8,1.7,.6,Math.PI/2,()=>{role('return-gallery-red-frame',()=>{for(const z of[-1.35,1.35])for(let i=0;i<=5;i++){const x=-4.3+i*1.72;arch.footColumn(x,z,1,3.1,.15);arch.brackets(x,4.25,z,.52);}for(const z of[-1.35,1.35]){box(0,4.45,z,9.2,.24,.25,'red');box(0,1.8,z,9.2,.12,.14,'red');for(let i=0;i<37;i++)box(-4.3+i*.24,1.45,z,.07,.65,.07,'red');}box(0,2.7,-1.45,9.3,2.7,.15,'plaster');});roof({name:'return-gallery-roof',w:10.3,d:4.5,eave:4.65,rise:1.18,curl:.32});});
 }

 const towerLevels=[];grouped(...C.towerPosition,0,()=>{
  role('tower-stone-foundation',()=>{box(0,-.075,0,5.1,.45,5.1,'stone');box(0,.21,0,5.35,.12,5.35,'granite');});
  const widths=[6.90,6.70,6.50,6.30,6.05],eaves=[4.30,5.90,7.50,9.10,10.70];
  for(let level=0;level<5;level++){const w=widths[level],y=eaves[level],floor=level?eaves[level-1]+.69:.34,body=w*.61,half=body/2;towerLevels.push({level:level+1,eave:y,width:w,floor});
   role('tower-storey-'+(level+1),()=>{
    box(0,floor-.06,0,body+.55,.12,body+.55,'cedar');
    for(const x of[-half,0,half])for(const z of[-half,half]){arch.footColumn(x,z,floor,Math.max(.25,y-floor-.56),.105);arch.brackets(x,y-.33,z,.39);}
    for(const z of[-half,0,half])for(const x of[-half,half])if(z===0){arch.footColumn(x,z,floor,Math.max(.25,y-floor-.56),.105);arch.brackets(x,y-.33,z,.39);}
    for(const side of[0,1,2,3])grouped(0,0,0,side*Math.PI/2,()=>{box(0,(floor+y-.4)/2,-half,body,Math.max(.25,y-.4-floor),.12,'darkwood');box(0,y-.30,half,body+.55,.19,.22,'red');box(0,floor+.38,half+.2,body+.62,.10,.10,'red');box(0,floor+.12,half+.2,body+.62,.09,.10,'red');for(let i=0;i<=12;i++)box(-body*.49+i*body*.98/12,floor+.25,half+.2,.06,.34,.06,'red');for(const x of[-body*.25,0,body*.25]){const h=Math.min(.68,(y-floor)*.55),yy=(floor+y-.4)/2;box(x,yy,half-.06,.60,h,.08,'black');for(let k=0;k<=3;k++)box(x-.28+k*.56/3,yy,half+.005,.025,h,.035,'oldgold');for(let k=0;k<=3;k++)box(x,yy-h/2+k*h/3,half+.008,.60,.025,.035,'cedar');}});
   });roof({name:'tower-roof-'+(level+1),w,d:w,eave:y,rise:.66,curl:.37});
  }
  role('tower-finial',()=>{const bottom=eaves[4]+.66+.31,top=C.towerHeight;emit(cyl,'oldgold',0,(bottom+top-.25)/2,0,.038,top-bottom-.25,.038);for(let i=0;i<13;i++){const y=bottom+.15+i*(top-bottom-.58)/12,r=.39*(1-i*.043);const g=new T.TorusGeometry(r,.027,6,28);emit(g,'oldgold',0,y,0,1,1,1,[Math.PI/2,0,0]);}emit(sphere,'oldgold',0,top-.16,0,.11,.16,.11);});
 },C.towerSceneScale);

 group.add(buildDeepEntranceCarving(mats,{capitalTop:C.capitalTop,canopyAt:x=>canopy(x,gFront+.08),front:gFront+.115}));
 // Flush grouped geometry into real shadow-casting ordinary meshes/instances.
 let instances=0,triangles=0;for(const {g,m,items}of buckets.values()){
  const object=items.length===1?new T.Mesh(g,m):new T.InstancedMesh(g,m,items.length);
  if(items.length===1){object.matrixAutoUpdate=false;object.matrix.copy(items[0].tr);}else{for(let i=0;i<items.length;i++){object.setMatrixAt(i,items[i].tr);object.setColorAt(i,new T.Color().setScalar(items[i].tint));}object.instanceMatrix.needsUpdate=true;object.instanceColor.needsUpdate=true;}
  object.castShadow=object.receiveShadow=true;object.userData.reference4Roles=[...new Set(items.map(a=>a.role))];object.userData.reference4InstanceRoles=items.map(a=>a.role);object.name=object.userData.reference4Roles.join('+');group.add(object);instances+=items.length;triangles+=(g.index?.count??g.attributes.position.count)/3*items.length;
 }
 group.updateMatrixWorld(true);const b=new T.Box3().setFromObject(group),tip=[C.towerPosition[0],C.towerPosition[1]+C.towerHeight*C.towerSceneScale,C.towerPosition[2]];
 const sockets={entrance:{center:[0,C.stairTopY+2.04,-.62],clearWidth:4.2,clearHeight:4.08,frontZ:-.355},sanctuary:{center:[0,C.stairTopY,-4.65],floor:C.stairTopY,floorY:C.stairTopY,frontOpeningWidth:4.2,width:4.2,depth:5.0,frontZ:-.65},stair:{top:[0,C.stairTopY,C.stairTopZ],bottom:[0,0,C.stairBottomZ],width:C.stairWidth},mainRidge:[0,C.ridgeY,C.ridgeZ],canopy:{front:gFront,back:gBack,halfWidth:gHalf,crest:[0,canopy(0,gFront),gFront],bargeboardMember:'entrance-saddled-bargeboard'},tower:{position:[...C.towerPosition],top:tip,height:C.towerHeight*C.towerSceneScale,levels:towerLevels,scale:C.towerSceneScale},lanternSupports:[-5.55,5.55].map(x=>({x,probeZ:1.5,bodyCenter:[x,5.8,1.7]}))};
 const bounds={min:b.min.toArray(),max:b.max.toArray()};
 return {group,sockets,bounds,materials:mats,stats:{meshes:group.children.length,instances,triangles,roles},config:C,limits:['New complete v4 source after workspace reset; not byte-identical v3 recovery.','Original-photo dimensions and unseen joints remain reconstruction hypotheses.','No GPU or image acceptance from CPU construction.','Separate closed roof-layer panels share contacts; not a global Boolean-union or structural engineering certification.'],dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
