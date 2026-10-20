import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createRestorationArchitecture} from './reference4-detail-kernel.js';
import {createReference4MaterialSet} from './reference4-materials.js';
import {createSculptedJoinery} from './scene03-solid-joinery.js';
import {createCurvedEaveRafter} from './scene03-curved-rafter.js';
import {createClosedRoofTile} from './scene03-roof-solids.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createGraniteEntrySteps} from './granite-entry-steps.js';
import {emitTowerEnclosureFace} from './tower-enclosure03.js';
import {buildUpperGalleryInfill03} from './upper-gallery-infill03.js';

// A new complete exterior reconstruction after the execution filesystem reset.
// NOT a byte recovery of v3/371b. Original 4 and the actual v3 image are references.
export const REFERENCE4_ARCHITECTURE_REVISION='scene03-hall99-and-pagoda102-solid-enclosures';
export function buildReference4Architecture(T,options={}) {
 const C={stairTopY:1.8,stairTopZ:0,stairBottomZ:8,stairWidth:5.6,columnAxes:[-6.88,-4.73,-2.86,2.86,4.73,6.88],capitalTop:7.15,ridgeY:13.2,ridgeZ:-5,lowerRoofWidth:18,upperRoofWidth:15.0,towerPosition:[-14.21,-.64,-12.0044],towerHeight:15.3,towerSceneScale:1.16,...options};
 if(!(C.stairTopY>0&&C.stairBottomZ>C.stairTopZ&&C.ridgeY>C.capitalTop+3))throw Error('Invalid complete exterior dimensions');
 const group=new T.Group();group.name=REFERENCE4_ARCHITECTURE_REVISION;
 const {mats,materials,textures}=createReference4MaterialSet(T,C),geometries=new Set(),buckets=new Map(),stack=[new T.Matrix4()],roles={};
 const cube=new RoundedBoxGeometry(1,1,1,2,.025),cyl=new T.CylinderGeometry(1,1,1,24),sphere=new T.SphereGeometry(1,12,8);let activeRole='architecture';
 const V=a=>new T.Vector3(...a), H=y=>y+C.stairTopY-3;
 const hallTurn=new T.Matrix4().makeTranslation(0,0,-4).multiply(new T.Matrix4().makeRotationY(C.hallYaw??.12)).multiply(new T.Matrix4().makeTranslation(0,0,4));
 function emit(g,ma,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0,tint=1){const m=typeof ma==='string'?mats[ma]:ma;if(!m)throw Error('Missing material '+ma);const e=Array.isArray(rot)?new T.Euler(...rot):new T.Euler(0,Number(rot)||0,0),tr=new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromEuler(e),V([sx,sy,sz])).premultiply(stack.at(-1));put(g,m,tr,tint);}
 function put(g,m,tr,tint=1){if(!activeRole.startsWith('tower'))tr=hallTurn.clone().multiply(tr);if(!tr.elements.every(Number.isFinite))throw Error('Nonfinite transform');const key=g.uuid+':'+m.uuid;let b=buckets.get(key);if(!b){b={g,m,items:[]};buckets.set(key,b);}if(m===mats.red||m===mats.cedar){const a=tr.elements;const h=Math.sin(a[12]*13.7+a[13]*5.2+a[14]*18.3)*43758.5453;tint*=.90+.16*(h-Math.floor(h));}b.items.push({tr,tint,role:activeRole});geometries.add(g);roles[activeRole]=(roles[activeRole]||0)+1;}
 function box(x,y,z,w,h,d,ma='cedar',rot=0,tint=1){if(w>0&&h>0&&d>0)emit(cube,ma,x,y,z,w,h,d,rot,tint);}
 function grouped(x,y,z,yaw,fn,scale=1){const q=new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromAxisAngle(V([0,1,0]),yaw),V([scale,scale,scale]));stack.push(stack.at(-1).clone().multiply(q));try{fn();}finally{stack.pop();}}
 function role(name,fn){const r=activeRole;activeRole=name;try{return fn();}finally{activeRole=r;}}
 function between(a,b,w,d,ma='cedar',round=false){a=V(a);b=V(b);const v=b.clone().sub(a);if(v.length()<1e-8)return;put(round?cyl:cube,mats[ma],new T.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(V([0,1,0]),v.clone().normalize()),V([w,v.length(),d])).premultiply(stack.at(-1)));}
 const legacyArch=createRestorationArchitecture({instance:emit,group:grouped,box,stack,columns:[],roofAudit:[]}),solidJoinery=createSculptedJoinery(),bearingBounds=new T.Box3();
 const bearingGilt=mats.gold.clone();bearingGilt.name='scene03-burnished-bearing-gilt';bearingGilt.color.set('#d5b36b');bearingGilt.roughness=.32;bearingGilt.metalness=.88;materials.push(bearingGilt);mats.bearingGilt=bearingGilt;
 const roofCeramic=new T.MeshPhysicalMaterial({name:'scene03-blue-grey-fired-clay',color:'#52636e',map:mats.slate.map,bumpMap:mats.slate.bumpMap,bumpScale:.002,roughness:.56,metalness:.015,clearcoat:.16,clearcoatRoughness:.38,vertexColors:true});materials.push(roofCeramic);mats.roofCeramic=roofCeramic;
 const roofFrieze=mats.plaster.clone();roofFrieze.name='scene03-recessed-grey-frieze-panels';roofFrieze.color.set('#7c8580');roofFrieze.roughness=.93;materials.push(roofFrieze);mats.roofFrieze=roofFrieze;
 const gableRecess=mats.darkwood.clone();gableRecess.name='scene03-shadowed-gable-timber';gableRecess.color.set('#271a14');gableRecess.roughness=.89;gableRecess.bumpScale=.008;materials.push(gableRecess);mats.gableRecess=gableRecess;
 const stairGranite=new T.MeshStandardMaterial({name:'scene03-CC0-granite-entry-blocks',color:'#858c91',roughness:.90,vertexColors:true}),stairBed=new T.MeshStandardMaterial({name:'scene03-step-hidden-dark-stone-core',color:'#45494a',roughness:.96});materials.push(stairGranite,stairBed);mats.stairGranite=stairGranite;mats.stairBed=stairBed;
 const stairSet=createGraniteEntrySteps(T,{count:20,width:C.stairWidth,height:C.stairTopY,front:C.stairTopZ,back:C.stairBottomZ});
 for(const part of solidJoinery.bracket)if(!part.cornerOnly){part.geometry.computeBoundingBox();bearingBounds.union(part.geometry.boundingBox);}
 let closedBearingInstances=0,curvedRafters=0;
 const arch={...legacyArch,brackets(x,y,z,s=1,options={}){
  if(activeRole.startsWith('tower'))return legacyArch.brackets(x,y,z,s,options);
  const base=options.baseY??y-.15*s,receiver=options.receiverY??y+.82*s,sx=.88*s,sz=.92*s,sy=(receiver-base)/(bearingBounds.max.y-bearingBounds.min.y),offset=base-bearingBounds.min.y*sy;
  if(!(sy>0))throw Error('Curved bracket requires a positive physical bearing gap');
  grouped(x,0,z,0,()=>{
   for(const part of solidJoinery.bracket)if(!part.cornerOnly)emit(part.geometry,part.material==='kit_endwood'?'endwood':'cedar',0,offset,0,sx,sy,sz);
   for(const axis of[0,Math.PI/2])grouped(0,0,0,axis,()=>{for(const side of[-1,1])for(const row of[0,1]){
    const xx=side*(row?.755:.655)*sx,yy=offset+(((row?.645:.27)+.15)*(.970/1.120)-.15)*sy;
    for(const branch of(row?[-.40,.40]:[0]))grouped(xx,yy,branch*sz,side*Math.PI/2,()=>emit(solidJoinery.relief,'bearingGilt',0,0,.012,.205*s,.15*s,.105*s));
   }});
  });closedBearingInstances++;
 }};
 function curvedRafter(points,w=.105,h=.16){emit(createCurvedEaveRafter(points,w,h),'cedar');curvedRafters++;}
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
  const physical=name==='main-upper-roof',tileParts=[],hw=w/2,hd=d/2,rh=w*.275;const P=(side,t,u)=>{const span=rh+(hw-rh)*t;let x,z;if(side===0||side===2){x=u*span;z=(side===0?1:-1)*hd*t;}else{x=(side===1?1:-1)*span;z=u*hd*t;}
   const roofT=Math.min(1,t),overhang=Math.max(0,t-1),edge=Math.abs(u);let y=eave+rise*Math.pow(Math.max(0,1-roofT),1.48)+curl*Math.pow(roofT,8)*(.22+.78*Math.pow(edge,6))+overhang*(.16+.40*Math.pow(edge,4));z+=centerZ;if(connected&&side===0)y=joinTop(x,z);return[x,y,z];};
  for(let side=0;side<4;side++){
   const ranges=side===0&&frontGap?[[-1,-.001],[.001,1]]:[[-1,1]];
   for(const range of ranges){const ts=lin(inner,1,22),us=lin(range[0],range[1],48);let grid=ts.map(t=>us.map(u=>{if(side===0&&frontGap){const span=rh+(hw-rh)*t;u=Math.sign(u)*(frontGap/span+(1-frontGap/span)*Math.abs(u));}return P(side,t,u);}));
    if(connected&&side===0){const uu=Array.from(new Set([...lin(-1,1,64),...xs.map(x=>x/hw)].map(x=>x.toFixed(10)))).map(Number).sort((a,b)=>a-b);grid=ts.map(t=>uu.map(u=>P(side,t,u)));}
    emit(shell(grid,-.06,0,name+'-ceramic-layer'),'slate');emit(shell(grid,-.185,-.06,name+'-timber-deck'),'darkwood');
   }
   const rows=Math.max(12,Math.round((side%2?d:w)/.205));
   for(let i=0;i<=rows;i++){const u=-1+2*i/rows;if(side===0&&frontGap&&Math.abs(P(side,1,u)[0])<frontGap+.08)continue;
    const pieces=Math.max(6,Math.ceil(Math.hypot(side%2?hw-rh:hd,rise)*(1-inner)/.36));
    for(let j=0;j<pieces;j++){const t0=physical?Math.max(.008,inner+(1-inner)*j/pieces):inner+(1-inner)*j/pieces,t1=inner+(1-inner)*(j+(physical?1.025:.96))/pieces;if(physical){tileParts.push(createClosedRoofTile(lin(t0,t1,4).map(t=>P(side,t,u)),.145,{cover:true,variant:i*1.31+j*.79+side*17}));if(i<rows)tileParts.push(createClosedRoofTile(lin(t0,t1,4).map(t=>P(side,t,u+1/rows)),.18,{cover:false,variant:i*1.71+j*.59+side*13}));}else{const p=P(side,t0,u),q=P(side,t1,u);tileBetween(p,q,.065,.94+.10*(.5+.5*Math.sin(i*11.3+j*4.7)));}}
    if(physical){const eaveCourses=[[.965,1.025],[1.02,1.06],[1.055,1.095],[1.09,1.13]];for(let k=0;k<eaveCourses.length;k++){const[aT,bT]=eaveCourses[k];tileParts.push(createClosedRoofTile(lin(aT,bT,4).map(t=>P(side,t,u)),.155,{cover:true,variant:i*1.77+side*19+k*3.1}));if(i<rows)tileParts.push(createClosedRoofTile(lin(aT,bT,4).map(t=>P(side,t,u+1/rows)),.18,{cover:false,variant:i*1.51+side*23+k*5.3}));}}
    const end=P(side,physical?1.13:1,u);if(physical)end[1]+=.025;if(!(connected&&side===0&&Math.abs(end[0])<gHalf)){arch.tileEnd(V(end),side*Math.PI/2,physical?.092:.074,i%2===0);if(name.startsWith('main-')||name.startsWith('lower-')){if(side!==0||physical)curvedRafter(lin(.66,physical?1.12:1.012,9).map(t=>{const p=P(side,t,u);p[1]-=.285;return p;}),physical?.09:.105,physical?.14:.16);}else{const a=P(side,.75,u),b=P(side,1.035,u);a[1]-=.24;b[1]-=.24;between(a,b,.105,.16,'red');}}
   }
   // The main eave has one deep closed fascia, so short rafters end behind
   // its moulded lower lip rather than appearing as isolated needle teeth.
   if(physical){
    const curve=lin(-1,1,80).map(u=>{const p=P(side,1.08,u);p[1]-=.27;return p;});emit(createCurvedEaveRafter(curve,.43,.36),'darkwood');
    const lip=lin(-1,1,80).map(u=>{const p=P(side,1.12,u);p[1]-=.39;return p;});emit(createCurvedEaveRafter(lip,.45,.13),'red');
    tube(lin(-1,1,80).map(u=>{const p=P(side,1.125,u);p[1]-=.24;return p;}),.022,'bearingGilt',96);
   }else for(let i=0;i<36;i++){const u=-1+2*i/36,v=-1+2*(i+1)/36,a=P(side,1,u),b=P(side,1,v);if(side===0&&(frontGap&&Math.min(Math.abs(a[0]),Math.abs(b[0]))<frontGap||connected&&Math.max(Math.abs(a[0]),Math.abs(b[0]))<gHalf))continue;a[1]-=.24;b[1]-=.24;between(a,b,.13,.23,'cedar');}
   if(side<2)for(const sign of[-1,1]){const pts=lin(inner,physical?1.13:1.035,16).map(t=>{const p=P(side,t,sign);p[1]+=.075;return p;});tube(pts,.095,'slate',32);}
  }
  if(physical)for(const t of[.58,.77,.94])for(let side=0;side<4;side++){
   const points=lin(-1,1,72).map(u=>{const p=P(side,t,u);p[1]-=.18;return p;});curvedRafter(points,t===.58?.18:.15,t===.58?.14:.12);
  }
  if(tileParts.length){emit(mergeGeometries(tileParts,false),'roofCeramic');for(const g of tileParts)g.dispose();}
  if(inner===0){box(0,eave+rise+.10,centerZ,rh*2+.12,.30,.24,'slate');box(0,eave+rise+.285,centerZ,rh*2+.14,.07,.30,'tileEdge');for(const s of[-1,1]){tube([[s*rh,eave+rise+.1,centerZ],[s*(rh+.15),eave+rise+.22,centerZ],[s*(rh+.23),eave+rise+.51,centerZ]],.095,'slate',16);rosette(s*(rh-.16),eave+rise+.12,centerZ+.145,.10,'oldgold');}}
  return {P,bounds:{w,d,eave,rise},centerZ};
 });}

 role('temple-platform-stair',()=>{
  box(0,(C.stairTopY-.9)/2,-4.4,15.2,C.stairTopY+.9,9.5,'stone');
  // Keep the rear and two side regions of the old platform cap unchanged.
  // Its central front0.425m strip is now the five stone caps in stairSet,
  // at the exact original top/bottom/front bounds rather than a white lip.
  const sideCap=(15.45-C.stairWidth)/2;
  for(const s of[-1,1])box(s*(C.stairWidth/2+sideCap/2),C.stairTopY-.065,-4.4,sideCap,.13,9.65,'granite');
  box(0,C.stairTopY-.065,(-9.225+C.stairTopZ)/2,C.stairWidth,.13,C.stairTopZ+9.225,'granite');
  const n=20,run=C.stairBottomZ-C.stairTopZ;for(let i=0;i<n;i++){const top=C.stairTopY*(n-i-1)/n,z0=C.stairTopZ+run*i/n,z1=C.stairTopZ+run*(i+1)/n;if(top>0)box(0,top/2,(z0+z1)/2,C.stairWidth,top,z1-z0,'stairBed');}
  for(const stone of stairSet.slabs)emit(stone,'stairGranite');
  // The porch rails stop at the stair landing; no unsupported red rail runs
  // down the exposed flight in the low pond-side view.
  for(const s of[-1,1])for(const y of[C.stairTopY+.38,C.stairTopY+.81])box(s*5.35,y,.23,4.8,.12,.14,'red');
  for(const s of[-1,1])for(let i=0;i<9;i++)box(s*(3.2+i*.55),C.stairTopY+.49,.23,.11,.84,.11,'red');
 });
 role('hall-red-columns',()=>{for(let i=0;i<C.columnAxes.length;i++){const x=C.columnAxes[i],cap=C.capitalTop-.10*Math.abs(x)/6.88,u=x/(4.95+4.05*(4.5/5.1)),roofUnder=9.4+3.1*Math.pow(1-4.5/5.1,1.48)+.56*Math.pow(4.5/5.1,8)*(.22+.78*Math.pow(Math.abs(u),6))-.37;arch.footColumn(x,0,C.stairTopY,cap-C.stairTopY-.3,Math.abs(x)<3?.29:.26);arch.brackets(x,cap-.06,0,.84,{baseY:cap-.14,receiverY:roofUnder});}
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
  // The former single 13.5 m panel and its rails incorrectly crossed the
  // declared 4.2 x 4.08 m entrance. Keep the two side fields, and close only
  // the real transom above the existing portal lintel.
  const openingHalf=2.10,openingTop=C.stairTopY+4.08,panelTop=8.825;
  for(const s of[-1,1])box(s*(6.75+openingHalf)/2,7.55,-.72,6.75-openingHalf,2.55,.18,'darkwood');
  if(panelTop>openingTop)box(0,(panelTop+openingTop)/2,-.72,openingHalf*2,panelTop-openingTop,.18,'darkwood');
  for(const y of[6.48,7.25,8.28]){
   if(y-.115>=openingTop){box(0,y,-.40,13.8,.23,.42,'cedar');box(0,y+.045,-.16,13.6,.052,.035,'oldgold');}
   else for(const s of[-1,1]){box(s*(6.9+openingHalf)/2,y,-.40,6.9-openingHalf,.23,.42,'cedar');box(s*(6.8+openingHalf)/2,y+.045,-.16,6.8-openingHalf,.052,.035,'oldgold');}
  }
  for(let j=-13;j<=13;j++){const x=j*.49;if(Math.abs(x)<openingHalf+.20)continue;relief(x,7.72,-.49,.40,.46);rosette(x,6.83,-.49,.10);}
  for(const x of[-6.4,-4.7,-2.9,0,2.9,4.7,6.4]){arch.brackets(x,8.60,-.22,.71);if(Math.abs(x)>openingHalf)box(x,7.47,-.39,.16,2.6,.23,'red');}
 });
 role('central-real-portal',()=>{
  const clearW=4.2,clearH=4.08,z=-.62,y0=C.stairTopY;
  for(const s of[-1,1]){box(s*(clearW/2+.21),y0+clearH/2,z,.42,clearH,.50,'cedar');box(s*(clearW/2+.21),y0+clearH/2,z+.264,.33,clearH,.028,'oldgold');for(let j=0;j<10;j++)relief(s*(clearW/2+.21),y0+.23+j*.405,z+.285,.29,.28);box(s*(clearW/2+.035),y0+clearH/2,z-.08,.07,clearH,.42,'gold');}
  box(0,y0+clearH+.23,z,5.04,.46,.50,'cedar');box(0,y0+clearH+.23,z+.265,4.85,.34,.026,'oldgold');for(let j=-5;j<=5;j++)relief(j*.405,y0+clearH+.23,z+.285,.35,.24);box(0,y0+.035,z,4.2,.07,.60,'darkwood');
  // Retain both structural beams. The separately loaded closed ranma module
  // replaces only these two faces' former thin gold tubes and flower dots.
  for(const y of[C.capitalTop-.40,C.capitalTop+.20])box(0,y,.06,6.15,.36,.52,'red');
  for(const s of[-1,1])for(const span of[[2.86,4.73,C.capitalTop-.9],[4.73,6.88,C.capitalTop-1.3]]){const x=s*(span[0]+span[1])/2,w=span[1]-span[0];box(x,span[2]+.12,.04,w,.32,.44,'red');relief(x,span[2]+.12,.272,w*.84,.24);}
 });

 const upperEave=15.4,upperWidth=15.2;
 const upper=roof({name:'main-upper-roof',w:upperWidth,d:10.4,eave:upperEave,rise:C.ridgeY-upperEave,curl:.72,centerZ:C.ridgeZ,connected:false});
 roof({name:'lower-shoulder-roof',w:C.lowerRoofWidth,d:10.2,eave:9.4,rise:3.1,curl:.56,centerZ:-4.5,inner:.45,frontGap:0});
 role('lower-eave-complete-parallel-rafters',()=>{
  const P=(u,t)=>[u*(4.95+4.05*t),9.4+3.1*Math.pow(Math.max(0,1-t),1.48)+.56*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),6))-.34,5.1*t-4.5];
  for(let j=0;j<=68;j++){const u=-1+2*j/68;curvedRafter(lin(.45,1.012,12).map(t=>{const p=P(u,t);p[1]+=.055;return p;}));const p=P(u,1.012);arch.squareFitting(p[0],p[1]+.055,p[2]+.025,.095,.135,0,j%4===0);}
  for(const t of[.58,.77,.94])for(let k=0;k<44;k++){let a=P(-1+2*k/44,t),b=P(-1+2*(k+1)/44,t);a[1]-=.11;b[1]-=.11;between(a,b,.18,.25,'red');}
 });
 role('front-gable-thick-ceramics-and-recessed-carving',()=>grouped(.60,0,0,0,()=>{
  // Photo landmarks are lifted onto the retained front plane, not matched by
  // a new focal length: crown ~[781,76], left shoulder ~[638,219].
  const hw=3.45,front=.25,back=-5.0,base=15.94,foot=16.20,peak=18.62;
  const curve=x=>base+(peak-base)*Math.pow(Math.max(0,1-Math.abs(x)/hw),1.48)+.060*Math.pow(Math.abs(x)/hw,8);
  const mainHeight=(x,z)=>{const t=(z-C.ridgeZ)/5.2,span=upperWidth*(.275+.225*t),u=(x+.60)/span;return upperEave+(C.ridgeY-upperEave)*Math.pow(Math.max(0,1-t),1.48)+.72*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),6));};
  const weather=(x,z)=>Math.max(curve(x)+.20*(front-z)/(front-back),mainHeight(x,z)+.018);
  emit(shell(gridAt(lin(-hw,hw,72),lin(back,front,24),weather),-.135,0,'closed-dormer-curved-ceramic-bedding'),'slate');
  const tiles=[],lanes=42,courses=14;
  for(let i=0;i<=lanes;i++)for(let j=0;j<courses;j++){
   const x=-hw+2*hw*i/lanes,z0=back+(front-back)*j/courses,z1=back+(front-back)*(j+1.025)/courses;
   tiles.push(createClosedRoofTile(lin(z0,z1,4).map(z=>[x,weather(x,z),z]),.14,{cover:true,variant:i*1.39+j*.71}));
   if(i<lanes){const xx=x+hw/lanes;tiles.push(createClosedRoofTile(lin(z0,z1,4).map(z=>[xx,weather(xx,z),z]),.18,{cover:false,variant:i*1.13+j*.97}));}
  }
  emit(mergeGeometries(tiles,false),'roofCeramic');for(const g of tiles)g.dispose();
  const tail=[];for(let i=0;i<=lanes;i++){const x=-hw+2*hw*i/lanes,y=weather(x,front);tail.push(createClosedRoofTile([[x,y,front-.012],[x,y+.006,front+.13],[x,y,front+.29]],.16,{cover:true,variant:i*.93}));if(i<lanes){const xx=x+hw/lanes,yy=weather(xx,front);tail.push(createClosedRoofTile([[xx,yy,front-.012],[xx,yy+.006,front+.13],[xx,yy,front+.29]],.18,{cover:false,variant:i*1.19}));}arch.tileEnd(V([x,y+.026,front+.305]),0,.100,i%3===0);}emit(mergeGeometries(tail,false),'roofCeramic');for(const g of tail)g.dispose();
  // A small, genuinely recessed diaphragm replaces the huge exposed wood
  // triangle. It has a closed edge and is partly hidden by the thick apron.
  const innerHalf=hw*(1-Math.pow((foot+.44-base)/(peak-base),1/1.48)),panel=new T.Shape();panel.moveTo(-innerHalf,foot);panel.lineTo(innerHalf,foot);
  for(const x of lin(innerHalf,-innerHalf,64))panel.lineTo(x,Math.max(foot,curve(x)-.44));panel.closePath();
  const rear=new T.ExtrudeGeometry(panel,{depth:.22,steps:1,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,curveSegments:12});emit(rear,'gableRecess',0,0,front-.48);
  const barge=lin(-hw,hw,96).map(x=>[x,curve(x)-.22,front+.08]);emit(createCurvedEaveRafter(barge,.35,.30),'red');
  const lower=lin(-hw+.08,hw-.08,96).map(x=>[x,curve(x)-.43,front+.025]);emit(createCurvedEaveRafter(lower,.27,.10),'cedar');
  tube(lin(-hw,hw,100).map(x=>[x,curve(x)-.115,front+.275]),.018,'bearingGilt',120);
  tube(lin(-hw+.10,hw-.10,100).map(x=>[x,curve(x)-.39,front+.18]),.013,'oldgold',120);
  // Heavy timber truss is behind the arch; it does not draw a second bright
  // triangle across the ceramic surface.
  box(0,foot+.085,front-.23,innerHalf*1.95,.17,.27,'gableRecess');
  for(const sign of[-1,1])between([0,peak-.58,front-.20],[sign*innerHalf*.89,foot+.16,front-.20],.15,.14,'cedar');
  box(0,(foot+peak-.60)/2,front-.21,.15,peak-.60-foot,.20,'red');
  for(const x of[-1.75,0,1.75]){
   const y=curve(x)-.48,leaf=new T.Shape();leaf.moveTo(-.24,0);leaf.bezierCurveTo(-.28,-.07,-.18,-.19,-.09,-.13);leaf.quadraticCurveTo(0,-.30,.09,-.13);leaf.bezierCurveTo(.18,-.19,.28,-.07,.24,0);leaf.quadraticCurveTo(0,.11,-.24,0);leaf.closePath();
   emit(new T.ExtrudeGeometry(leaf,{depth:.11,bevelEnabled:true,bevelSize:.018,bevelThickness:.015,bevelSegments:3,curveSegments:18}),'bearingGilt',x,y,front+.20,1,x===0?1.25:.85,1);
   for(const sign of[-1,1])tube([[x+sign*.20,y+.025,front+.33],[x+sign*.31,y-.025,front+.35],[x+sign*.27,y-.13,front+.35],[x+sign*.13,y-.10,front+.35]],.018,'bearingGilt',24);
  }
  // A shallow dimensional gilt frieze tracks the gable's lower timber crest.
  for(let j=-6;j<=6;j++){const x=j*.40;relief(x,16.28,front+.34,.25,.21);}
  // Ref03 has a family-medallion crest rather than the Ref05 mask's eyes
  // and teeth. Reuse only its closed lobed ceramic backing.
  emit(solidJoinery.cornerMask[0].geometry,'slate',0,peak+.08,front+.07,1.10,1.10,.95);
  emit(new T.TorusGeometry(.145,.025,10,40),'bearingGilt',0,peak+.34,front+.22);rosette(0,peak+.34,front+.25,.12,'bearingGilt');emit(sphere,'bearingGilt',0,peak+.98,front+.10,.065,.12,.055);
 }));

 role('main-roof-gilded-lotus-finial',()=>{
  const x=3.8,z=-4.6,y=19.9,t=(z-C.ridgeZ)/5.2,u=x/(upperWidth*(.275+.225*t)),roofY=upper.P(0,t,u)[1]+.08,seatY=y-.23;emit(new T.CylinderGeometry(.18,.25,seatY-roofY,24),'slate',x,(roofY+seatY)/2,z);emit(cyl,'oldgold',x,y+1.9,z,.055,3.8,.055);emit(cyl,'oldgold',x,y-.08,z,.25,.30,.25);emit(sphere,'gold',x,y+.10,z,.22,.18,.22);
  for(let j=0;j<8;j++){let h=y+.22+j*.42,r=.37*(1-j*.073);emit(cyl,'oldgold',x,h+.03,z,r*.48,.18,r*.48);for(let k=0;k<6;k++){let a=k*Math.PI*2/6;emit(sphere,'gold',x+Math.cos(a)*r*.62,h+.12,z+Math.sin(a)*r*.62,.075,.18,.105,[0,a,Math.sin(a)*.3]);}emit(new T.TorusGeometry(r,.025,7,24),'gold',x,h,z,1,1,1,[Math.PI/2,0,0]);for(let k=0;k<7;k++){let a=k*Math.PI*2/7;between([x+Math.cos(a)*r*.7,h,z+Math.sin(a)*r*.7],[x+Math.cos(a)*r*1.2,h+.20,z+Math.sin(a)*r*1.2],.024,.024,'gold',true);}}
  emit(sphere,'gold',x,y+3.85,z,.105,.22,.105);
 });
 let upperFrontInfill;
 role('upper-storey-dense-bracket-frieze',()=>{
  // Compress the redundant tall timber story below the great roof. The
  // lower pale gallery remains on the subordinate roof; this upper band is
  // one short, continuously framed timber gallery beneath the retained eave.
  const retainedBottom=12.32,retainedTop=14.325,bandCenter=(retainedBottom+retainedTop)/2,bandHeight=retainedTop-retainedBottom;
  box(0,bandCenter,-1.02,13.6,bandHeight,.22,'darkwood');
  upperFrontInfill=buildUpperGalleryInfill03({emit,role});
  for(const sign of[-1,1])box(sign*6.76,bandCenter,-4.45,.22,bandHeight,7.1,'darkwood');box(0,bandCenter,-8.0,13.6,bandHeight,.22,'darkwood');
  const galleryAxes=[...C.columnAxes,0].sort((a,b)=>a-b);
  for(let i=0;i<galleryAxes.length-1;i++){
   const left=galleryAxes[i],right=galleryAxes[i+1],x=(left+right)/2,w=right-left-.32;
   box(x,13.32,-.83,w,.58,.13,'gableRecess');
   // Fine timber lattice breaks the broad upper infill into dark framed bays.
   for(let gx=left+.30;gx<right-.15;gx+=.235)box(gx,13.32,-.675,.046,.49,.065,'darkwood');
   for(const gy of[13.09,13.32,13.55])box(x,gy,-.675,w-.08,.045,.065,'darkwood');
   relief(x,13.32,-.585,Math.min(.76,w*.39),.31);
  }

  for(const y of[11.35,12.40,14.05]){box(0,y,-.70,13.4,.24,.45,'cedar');box(0,y+.04,-.425,13.1,.065,.045,'oldgold');}
  // A narrow intermediate girt receives the fine nested bracket clusters.
  // It sits below the deep roof soffit and passes behind the seven major
  // column-aligned bearings, tying the smaller supports into one course.
  box(0,14.56,-.70,13.4,.16,.45,'darkwood');
  box(0,14.59,-.455,13.12,.035,.045,'oldgold');
  for(const x of galleryAxes){const t=(-.55-C.ridgeZ)/5.2,u=x/(upperWidth*(.275+.225*t)),receiver=upper.P(0,t,u)[1]-.37,scale=Math.abs(x)>6?.52:Math.abs(x)>4?.47:.43;arch.brackets(x,14.30,-.55,scale,{baseY:14.17,receiverY:receiver});box(x,13.34,-.7,.20,1.84,.24,'red');}
  for(let i=0;i<galleryAxes.length-1;i++){
   const left=galleryAxes[i],right=galleryAxes[i+1];
   for(let j=1;j<=2;j++){
    const x=left+(right-left)*j/3,scale=.22+((i+j)%2)*.014;
    arch.brackets(x,14.35,-.55,scale,{baseY:14.17,receiverY:14.48});
   }
  }
  for(const x of galleryAxes)arch.brackets(x,11.6,-.48,.26,{baseY:11.47,receiverY:12.25});
  // The mesh64 curved parts are retained. The upper assembly follows the
  // raised receiver beam; a row of bare upright gap-fillers is not exposed.
  for(let j=0;j<=64;j++){const u=-1+2*j/64;curvedRafter(lin(.40,1.012,12).map(t=>{const p=upper.P(0,t,u);p[1]-=.285;return p;}),.105,.16);const p=upper.P(0,1.012,u);arch.squareFitting(p[0],p[1]-.285,p[2]+.018,.095,.135,0,j%4===0);}
 });
 const towerLevels=[];grouped(...C.towerPosition,Math.PI/4,()=>{
  role('tower-stone-foundation',()=>{box(0,-.075,0,5.1,.45,5.1,'stone');box(0,.21,0,5.35,.12,5.35,'granite');});
  const widths=[6.3,6.12,5.95,5.78,5.60],eaves=[6.9,9.4,12.0,14.6,17.1];
  for(let level=0;level<5;level++){const w=widths[level],y=eaves[level],floor=level?eaves[level-1]+.90:.34,body=w*.61,half=body/2;towerLevels.push({level:level+1,eave:y,width:w,floor});
   role('tower-storey-'+(level+1),()=>{
    box(0,floor-.06,0,body+.55,.12,body+.55,'cedar');for(const z of[-body/2,body/2])for(let j=-2;j<=2;j++){arch.brackets(j*body/5,y-.29,z,.42);box(j*body/5,y-.42,z+.02,.31,.08,.37,'oldgold');}
    for(const x of[-half,0,half])for(const z of[-half,half]){arch.footColumn(x,z,floor,Math.max(.25,y-floor-.56),.105);arch.brackets(x,y-.33,z,.39);}
    for(const z of[-half,0,half])for(const x of[-half,half])if(z===0){arch.footColumn(x,z,floor,Math.max(.25,y-floor-.56),.105);arch.brackets(x,y-.33,z,.39);}
    // The old four continuous back walls rotated over the front windows.
    // Only the three clearly exposed upper rooms get segmented thick infill
    // and real openings. Lower garden-occluded construction is retained.
    if(level>=2)box(0,y-.44,0,body-.14,.08,body-.14,'darkwood');
    for(const side of[0,1,2,3])grouped(0,0,0,side*Math.PI/2,()=>{
     if(level>=2)emitTowerEnclosureFace(box,{width:body,faceZ:half,floor,top:y-.4});
     else box(0,(floor+y-.4)/2,-half,body,Math.max(.25,y-.4-floor),.12,'darkwood');
     box(0,y-.30,half,body+.55,.19,.22,'red');box(0,floor+.38,half+.2,body+.62,.10,.10,'red');box(0,floor+.12,half+.2,body+.62,.09,.10,'red');
     for(let i=0;i<=12;i++)box(-body*.49+i*body*.98/12,floor+.25,half+.2,.06,.34,.06,'red');
     if(level<2)for(const x of[-body*.25,0,body*.25]){const h=Math.min(.68,(y-floor)*.55),yy=(floor+y-.4)/2;box(x,yy,half-.06,.60,h,.08,'plaster',0,.64);for(let k=0;k<=3;k++)box(x-.28+k*.56/3,yy,half+.005,.025,h,.035,'oldgold');for(let k=0;k<=3;k++)box(x,yy-h/2+k*h/3,half+.008,.60,.025,.035,'cedar');}
    });
   });roof({name:'tower-roof-'+(level+1),w,d:w,eave:y,rise:1.06,curl:.37});role('tower-corner-bells-'+level,()=>{for(const sx of[-1,1])for(const sz of[-1,1]){const x=sx*w*.493,z=sz*w*.493;between([x,y+.20,z],[x,y-.24,z],.012,.012,'oldgold',true);emit(new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.075,0),new T.Vector2(.065,.045),new T.Vector2(.040,.14),new T.Vector2(0,.17)],16),'oldgold',x,y-.42,z);emit(sphere,'gold',x,y-.46,z,.024,.035,.024);}});
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
 return {group,sockets,bounds,materials:mats,stats:{meshes:group.children.length,instances,triangles,roles,closedBearingInstances,curvedRafters,entryStair:stairSet.info,roofConstruction:{upperWidth,upperEave,mainRidgeY:C.ridgeY,closedClayThickness:.018,dormerCrown:18.62,dormerFront:-.60}},config:C,limits:['New complete v4 source after workspace reset; not byte-identical v3 recovery.','Original-photo dimensions and unseen joints remain reconstruction hypotheses.','No GPU or image acceptance from CPU construction.','Separate closed roof-layer panels share contacts; not a global Boolean-union or structural engineering certification.'],dispose(){solidJoinery.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
