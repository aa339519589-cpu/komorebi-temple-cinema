import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createRestorationArchitecture} from './reference4-detail-kernel.js';
import {createReference4MaterialSet} from './reference4-materials.js';

// A new complete exterior reconstruction after the execution filesystem reset.
// NOT a byte recovery of v3/371b. Original 4 and the actual v3 image are references.
export const REFERENCE4_ARCHITECTURE_REVISION='reference4-foundation-v4-rebuilt-connected-eaves';
export function buildReference4Architecture(T,options={}) {
 const C={stairTopY:1.8,stairTopZ:0,stairBottomZ:8,stairWidth:5.6,columnAxes:[-6.88,-4.73,-2.86,2.86,4.73,6.88],capitalTop:7.15,ridgeY:13.2,ridgeZ:-5,lowerRoofWidth:18,upperRoofWidth:15.0,towerPosition:[-14.21,-.64,-12.0044],towerHeight:15.3,towerSceneScale:1.16,...options};
 if(!(C.stairTopY>0&&C.stairBottomZ>C.stairTopZ&&C.ridgeY>C.capitalTop+3))throw Error('Invalid complete exterior dimensions');
 const group=new T.Group();group.name=REFERENCE4_ARCHITECTURE_REVISION;
 const {mats,materials,textures}=createReference4MaterialSet(T,C),geometries=new Set(),buckets=new Map(),stack=[new T.Matrix4()],roles={};
 const cube=new RoundedBoxGeometry(1,1,1,2,.025),cyl=new T.CylinderGeometry(1,1,1,24),sphere=new T.SphereGeometry(1,12,8);let activeRole='architecture';
 const V=a=>new T.Vector3(...a), H=y=>y+C.stairTopY-3;
 function emit(g,ma,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0,tint=1){const m=typeof ma==='string'?mats[ma]:ma;if(!m)throw Error('Missing material '+ma);const e=Array.isArray(rot)?new T.Euler(...rot):new T.Euler(0,Number(rot)||0,0),tr=new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromEuler(e),V([sx,sy,sz])).premultiply(stack.at(-1));put(g,m,tr,tint);}
 function put(g,m,tr,tint=1){if(!activeRole.startsWith('tower')){tr=new T.Matrix4().makeTranslation(0,0,-4).multiply(new T.Matrix4().makeRotationY(.12)).multiply(new T.Matrix4().makeTranslation(0,0,4)).multiply(tr);}if(!tr.elements.every(Number.isFinite))throw Error('Nonfinite transform');const key=g.uuid+':'+m.uuid;let b=buckets.get(key);if(!b){b={g,m,items:[]};buckets.set(key,b);}if(m===mats.red||m===mats.cedar){const a=tr.elements;const h=Math.sin(a[12]*13.7+a[13]*5.2+a[14]*18.3)*43758.5453;tint*=.90+.16*(h-Math.floor(h));}b.items.push({tr,tint,role:activeRole});geometries.add(g);roles[activeRole]=(roles[activeRole]||0)+1;}
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
  const n=20,run=C.stairBottomZ-C.stairTopZ;for(let i=0;i<n;i++){const top=C.stairTopY*(n-i)/n,z0=C.stairTopZ+run*i/n,z1=C.stairTopZ+run*(i+1)/n;box(0,top/2,(z0+z1)/2,C.stairWidth,top,z1-z0,'stone',0,.94+.07*Math.sin(i*3.1));box(0,top-.025,z1-.035,C.stairWidth+.02,.05,.07,'granite');}
  for(const s of[-1,1]){const x=s*(C.stairWidth/2+.23);between([x,C.stairTopY+.9,C.stairTopZ],[x,.9,C.stairBottomZ],.13,.14,'red');between([x,C.stairTopY+.44,C.stairTopZ],[x,.44,C.stairBottomZ],.11,.11,'red');for(let i=0;i<=8;i++){const t=i/8,y=C.stairTopY*(1-t),z=C.stairTopZ+run*t;box(x,y+.51,z,.17,1.02,.17,'red');emit(sphere,'oldgold',x,y+1.03,z,.12,.15,.12);}}
  for(const s of[-1,1])for(const y of[C.stairTopY+.38,C.stairTopY+.81])box(s*5.35,y,.23,4.8,.12,.14,'red');
  for(const s of[-1,1])for(let i=0;i<9;i++)box(s*(3.2+i*.55),C.stairTopY+.49,.23,.11,.84,.11,'red');
 });
 role('hall-red-columns',()=>{for(let i=0;i<C.columnAxes.length;i++){const x=C.columnAxes[i],cap=C.capitalTop-.10*Math.abs(x)/6.88;arch.footColumn(x,0,C.stairTopY,cap-C.stairTopY-.3,Math.abs(x)<3?.29:.26);arch.brackets(x,cap-.06,0,.84);}
  for(const z of[-3.6,-7.8])for(const x of[-6.88,-2.86,2.86,6.88]){arch.footColumn(x,z,C.stairTopY,5.8,.27);arch.brackets(x,C.stairTopY+6.02,z,.78);}
 });
 role('hall-enclosure-doors',()=>{
  box(0,5.65,-8.65,14.2,6.9,.23,'darkwood');for(const s of[-1,1]){box(s*7.02,5.65,-4.5,.20,6.9,8.4,'darkwood');for(let j=0;j<6;j++){box(s*6.88,6.35,-1.4-j*1.25,.16,3.4,.085,'cedar');box(s*6.84,7.85,-1.4-j*1.25,.12,.12,1.2,'oldgold');for(let k=0;k<5;k++){box(s*7.14,5.85,-1.85-j*1.25+k*.22,.055,2.0,.025,'oldgold');box(s*7.14,4.95+k*.44,-1.40-j*1.25,.055,.025,1.0,'cedar');}}}
  for(const s of[-1,1])for(const seg of[[3.0,4.55],[4.95,6.7]]){const x=s*(seg[0]+seg[1])/2,w=seg[1]-seg[0],h=3.8,y=C.stairTopY+h/2+.22;box(x,y,-.57,w,h,.16,'darkwood');for(const xx of[-w/2,w/2])box(x+xx,y,-.42,.09,h+.13,.12,'red');for(const yy of[-h/2,h/2])box(x,y+yy,-.39,w,.11,.13,'cedar');for(let k=1;k<8;k++)box(x-w/2+w*k/8,y,-.39,.032,h-.15,.045,'oldgold');for(let k=1;k<13;k++)box(x,y-h/2+h*k/13,-.385,w-.1,.025,.05,'cedar');}
  // Upper gallery is enclosed timber, not an unrelated open lattice triangle.
  
 });
 role('columns-gilt-bronze-collars',()=>{
  for(const x of C.columnAxes){const rr=Math.abs(x)<3?.297:.267;for(const y of[4.65,5.34,7.88]){emit(cyl,'oldgold',x,y,.0,rr,.065,rr);emit(cyl,'black',x,y+.11,.0,rr+.002,.13,rr+.002);}for(let j=0;j<4;j++){const y=5.75+j*.31;relief(x,y,.29,.31,.29);}for(const y of[4.95,7.4]){box(x,y,.285,.30,.32,.038,'black');rosette(x,y,.315,.10,'oldgold');}}
 });
 role('closed-sanctuary-carved-transoms',()=>{
  box(0,7.55,-.72,13.5,2.55,.18,'darkwood');
  for(const y of[6.48,7.25,8.28]){box(0,y,-.40,13.8,.23,.42,'cedar');box(0,y+.045,-.16,13.6,.052,.035,'oldgold');}
  for(let j=-13;j<=13;j++){let x=j*.49;relief(x,7.72,-.49,.40,.46);rosette(x,6.83,-.49,.10);}
  for(const x of[-6.4,-4.7,-2.9,0,2.9,4.7,6.4]){arch.brackets(x,8.60,-.22,.71);box(x,7.47,-.39,.16,2.6,.23,'red');}
 });
 role('central-real-portal',()=>{
  const clearW=4.2,clearH=4.08,z=-.62,y0=C.stairTopY;
  for(const s of[-1,1]){box(s*(clearW/2+.21),y0+clearH/2,z,.42,clearH,.50,'cedar');box(s*(clearW/2+.21),y0+clearH/2,z+.264,.33,clearH,.028,'oldgold');for(let j=0;j<10;j++)relief(s*(clearW/2+.21),y0+.23+j*.405,z+.285,.29,.28);box(s*(clearW/2+.035),y0+clearH/2,z-.08,.07,clearH,.42,'gold');}
  box(0,y0+clearH+.23,z,5.04,.46,.50,'cedar');box(0,y0+clearH+.23,z+.265,4.85,.34,.026,'oldgold');for(let j=-5;j<=5;j++)relief(j*.405,y0+clearH+.23,z+.285,.35,.24);box(0,y0+.035,z,4.2,.07,.60,'darkwood');
  for(const y of[C.capitalTop-.40,C.capitalTop+.20]){box(0,y,.06,6.15,.36,.52,'red');for(const x of[-2.4,-1.6,-.8,0,.8,1.6,2.4])relief(x,y,.333,.68,.25);}
  for(const s of[-1,1])for(const span of[[2.86,4.73,C.capitalTop-.9],[4.73,6.88,C.capitalTop-1.3]]){const x=s*(span[0]+span[1])/2,w=span[1]-span[0];box(x,span[2]+.12,.04,w,.32,.44,'red');relief(x,span[2]+.12,.272,w*.84,.24);}
 });

 const upper=roof({name:'main-upper-roof',w:C.upperRoofWidth,d:9,eave:14.4,rise:C.ridgeY-14.4,curl:.34,centerZ:C.ridgeZ,connected:false});
 roof({name:'lower-shoulder-roof',w:C.lowerRoofWidth,d:10.2,eave:9.4,rise:3.1,curl:.56,centerZ:-4.5,inner:.45,frontGap:0});
 role('lower-eave-complete-parallel-rafters',()=>{
  const P=(u,t)=>[u*(4.95+4.05*t),9.4+3.1*Math.pow(Math.max(0,1-t),1.48)+.56*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),6))-.34,5.1*t-4.5];
  for(let j=0;j<=80;j++){const u=-1+2*j/80;for(let k=0;k<8;k++)between(P(u,.45+.585*k/8),P(u,.45+.585*(k+1)/8),.105,.17,'cedar');const p=P(u,1.035);box(p[0],p[1],p[2]+.03,.11,.16,.06,'oldgold');}
  for(const t of[.58,.77,.94])for(let k=0;k<44;k++){let a=P(-1+2*k/44,t),b=P(-1+2*(k+1)/44,t);a[1]-=.20;b[1]-=.20;between(a,b,.18,.25,'red');}
 });
 role('front-gable-fine-woodwork',()=>{
  const hw=4.5,front=1.6,back=-2.9,base=14.4,peak=18.30,curve=x=>base+(peak-base)*Math.pow(Math.max(0,1-Math.abs(x)/hw),1.20);
  const pp=[],uu=[];for(let i=0;i<60;i++){let a=-hw+2*hw*i/60,b=-hw+2*hw*(i+1)/60;for(let p of[[a,base,front-.34],[b,base,front-.34],[a,curve(a)-.17,front-.34],[a,curve(a)-.17,front-.34],[b,base,front-.34],[b,curve(b)-.17,front-.34]]){pp.push(...p);uu.push(p[0],p[1]);}}emit(meshFromTriangles(pp,uu,'closed-carved-gable'),'darkwood');
  const grid=gridAt(lin(-hw,hw,60),lin(back,front,16),(x,z)=>curve(x));emit(shell(grid,-.14,0,'gable-ceramic'),'slate');
  for(let i=0;i<=36;i++){let x=-hw+2*hw*i/36,y=curve(x);for(let j=0;j<10;j++)tileBetween([x,y+.025,back+(front-back)*j/10],[x,y+.025,back+(front-back)*(j+.98)/10],.065);arch.tileEnd(V([x,y+.025,front+.03]),0,.075,i%2===0);between([x,y-.24,back],[x,y-.24,front+.07],.105,.14,'cedar');}
  for(let i=0;i<40;i++){const x0=-hw+2*hw*i/40,x1=-hw+2*hw*(i+1)/40;between([x0,curve(x0)-.16,front],[x1,curve(x1)-.16,front],.15,.21,'red');between([x0,curve(x0)-.045,front+.13],[x1,curve(x1)-.045,front+.13],.027,.035,'gold');}
  box(0,base+.10,front-.1,hw*1.9,.24,.24,'cedar');
  for(let i=-10;i<=10;i++){const x=i*.35,h=curve(x)-base-.35;if(h>.12){box(x,base+.15+h/2,front-.25,.12,h,.18,'darkwood');if(i%2===0)relief(x,base+.35+h*.44,front-.13,.30,Math.min(.7,h*.7));}}
  for(let j=0;j<6;j++){const y=base+.35+j*.38,w=2*hw*Math.pow(Math.max(0,1-(y-base)/(peak-base)),1/1.20);if(w>.1)box(0,y,front-.24,w,.055,.13,'oldgold');}
  rosette(0,base+.66,front-.05,.34);rosette(0,peak-.24,front+.1,.17);
 });

 role('main-roof-gilded-lotus-finial',()=>{
  const x=3.8,z=-4.6,y=18.8;emit(cyl,'oldgold',x,y+1.9,z,.055,3.8,.055);
  for(let j=0;j<8;j++){let h=y+.22+j*.42,r=.32*(1-j*.073);emit(new T.TorusGeometry(r,.025,7,24),'gold',x,h,z,1,1,1,[Math.PI/2,0,0]);for(let k=0;k<7;k++){let a=k*Math.PI*2/7;between([x+Math.cos(a)*r*.7,h,z+Math.sin(a)*r*.7],[x+Math.cos(a)*r*1.2,h+.20,z+Math.sin(a)*r*1.2],.024,.024,'gold',true);}}
  emit(sphere,'gold',x,y+3.85,z,.105,.22,.105);
 });
 role('upper-storey-dense-bracket-frieze',()=>{
  for(let j=-6;j<=6;j++)box(j*1.06,11.17,-.76,.86,.65,.08,'plaster');for(const y of[10.80,11.55])box(0,y,-.68,13.5,.08,.10,'oldgold');for(let j=-13;j<=13;j++){const x=j*.49;relief(x,11.17,-.66,.40,.31);}
  box(0,12.50,-1.02,13.6,3.65,.22,'darkwood');for(const sign of[-1,1])box(sign*6.76,12.50,-4.45,.22,3.65,7.1,'darkwood');box(0,12.50,-8.0,13.6,3.65,.22,'darkwood');
  for(let j=-6;j<=6;j++){const x=j*1.06;box(x,12.35,-.85,.92,.65,.075,'plaster');for(const y of[11.98,12.72])box(x,y,-.75,1.0,.08,.09,'oldgold');relief(x,12.35,-.71,.65,.36);}

  for(const y of[11.35,12.85,13.6]){box(0,y,-.70,13.4,.24,.45,'cedar');box(0,y+.04,-.425,13.1,.065,.045,'oldgold');}
  box(0,12.53,-.95,13.0,.72,.13,'black');
  for(let j=-6;j<=6;j++){let x=j*1.06;arch.brackets(x,13.85,-.55,.91);arch.brackets(x,11.6,-.48,.72);box(x,12.55,-.7,.18,2.2,.23,'red');relief(x+.49,12.55,-.82,.55,.45);}
  for(let j=-6;j<=6;j++){let x=j*1.05;rosette(x,13.15,-.42,.12);}
  for(let j=0;j<72;j++){let x=-7.8+j*15.6/71;between([x,13.97,-2.5],[x,14.20,.20],.095,.14,'cedar');box(x,14.16,.20,.11,.14,.16,'oldgold');}
 });
 const towerLevels=[];grouped(...C.towerPosition,Math.PI/4,()=>{
  role('tower-stone-foundation',()=>{box(0,-.075,0,5.1,.45,5.1,'stone');box(0,.21,0,5.35,.12,5.35,'granite');});
  const widths=[6.3,6.12,5.95,5.78,5.60],eaves=[6.9,9.4,12.0,14.6,17.1];
  for(let level=0;level<5;level++){const w=widths[level],y=eaves[level],floor=level?eaves[level-1]+.90:.34,body=w*.61,half=body/2;towerLevels.push({level:level+1,eave:y,width:w,floor});
   role('tower-storey-'+(level+1),()=>{
    box(0,floor-.06,0,body+.55,.12,body+.55,'cedar');for(const z of[-body/2,body/2])for(let j=-2;j<=2;j++){arch.brackets(j*body/5,y-.29,z,.42);box(j*body/5,y-.42,z+.02,.31,.08,.37,'oldgold');}
    for(const x of[-half,0,half])for(const z of[-half,half]){arch.footColumn(x,z,floor,Math.max(.25,y-floor-.56),.105);arch.brackets(x,y-.33,z,.39);}
    for(const z of[-half,0,half])for(const x of[-half,half])if(z===0){arch.footColumn(x,z,floor,Math.max(.25,y-floor-.56),.105);arch.brackets(x,y-.33,z,.39);}
    for(const side of[0,1,2,3])grouped(0,0,0,side*Math.PI/2,()=>{box(0,(floor+y-.4)/2,-half,body,Math.max(.25,y-.4-floor),.12,'darkwood');box(0,y-.30,half,body+.55,.19,.22,'red');box(0,floor+.38,half+.2,body+.62,.10,.10,'red');box(0,floor+.12,half+.2,body+.62,.09,.10,'red');for(let i=0;i<=12;i++)box(-body*.49+i*body*.98/12,floor+.25,half+.2,.06,.34,.06,'red');for(const x of[-body*.25,0,body*.25]){const h=Math.min(.68,(y-floor)*.55),yy=(floor+y-.4)/2;box(x,yy,half-.06,.60,h,.08,'black');for(let k=0;k<=3;k++)box(x-.28+k*.56/3,yy,half+.005,.025,h,.035,'oldgold');for(let k=0;k<=3;k++)box(x,yy-h/2+k*h/3,half+.008,.60,.025,.035,'cedar');}});
   });roof({name:'tower-roof-'+(level+1),w,d:w,eave:y,rise:1.06,curl:.37});
  }
  role('tower-finial',()=>{const bottom=eaves[4]+1.06+.31,top=C.towerHeight;emit(cyl,'oldgold',0,(bottom+top-.25)/2,0,.038,top-bottom-.25,.038);for(let i=0;i<13;i++){const y=bottom+.15+i*(top-bottom-.58)/12,r=.39*(1-i*.043);const g=new T.TorusGeometry(r,.027,6,28);emit(g,'oldgold',0,y,0,1,1,1,[Math.PI/2,0,0]);}emit(sphere,'oldgold',0,top-.16,0,.11,.16,.11);});
 },C.towerSceneScale);

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
