import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createRestorationArchitecture} from './reference4-detail-kernel.js';
import {createReference4MaterialSet} from './reference4-materials.js';
import {createSculptedJoinery} from './scene03-solid-joinery.js';
import {createCurvedEaveRafter} from './scene03-curved-rafter.js';
import {createClosedRoofTile,createClosedRidge174} from './scene03-roof-solids.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createGraniteEntrySteps} from './granite-entry-steps.js';
import {emitTowerEnclosureFace} from './tower-enclosure03.js';
import {buildHallCarpentry03} from './scene03-hall-carpentry.js';
import {createCarvedReceivers106} from './scene03-carved-receivers106.js';
import {createSculptedTimber109} from './scene03-sculpted-timber109.js';
import {buildEnclosure109} from './scene03-enclosure109.js';
import {buildGableTimber180} from './scene03-gable180.js';

// A new complete exterior reconstruction after the execution filesystem reset.
// NOT a byte recovery of v3/371b. Original 4 and the actual v3 image are references.
export const REFERENCE4_ARCHITECTURE_REVISION='scene03-rebuilt-bearing211-r02';
export function buildReference4Architecture(T,options={}) {
 const C={stairTopY:1.8,stairTopZ:0,stairBottomZ:8,stairWidth:5.6,columnAxes:[-6.88,-4.73,-2.86,2.86,4.73,6.88],capitalTop:7.15,ridgeY:13.2,ridgeZ:-5,lowerRoofWidth:18,upperRoofWidth:15.0,towerPosition:[-14.21,-.64,-12.0044],towerHeight:15.3,towerSceneScale:1.16,...options};
 Object.assign(C,{lowerEave:C.lowerEave??10.5,upperEave:C.upperEave??14.6,portalHeight:C.portalHeight??4.08,gablePeak:C.gablePeak??19.12,gableCenter:C.gableCenter??.10,towerYaw:C.towerYaw??Math.PI/4,towerPitch:C.towerPitch??2.55,towerWidthScale:C.towerWidthScale??1});
 C.columnAxes=C.columnAxes.map(x=>x*(C.bodyWidthScale??1));
 if(!(C.stairTopY>0&&C.stairBottomZ>C.stairTopZ&&C.ridgeY>C.capitalTop+3))throw Error('Invalid complete exterior dimensions');
 const group=new T.Group();group.name=REFERENCE4_ARCHITECTURE_REVISION;
 const {mats,materials,textures}=createReference4MaterialSet(T,C),geometries=new Set(),buckets=new Map(),stack=[new T.Matrix4()],roles={};
 const cube=new RoundedBoxGeometry(1,1,1,2,.025),cyl=new T.CylinderGeometry(1,1,1,24),sphere=new T.SphereGeometry(1,12,8);let activeRole='architecture';
 const V=a=>new T.Vector3(...a), H=y=>y+C.stairTopY-3;
 const gableReceivers=createCarvedReceivers106(T,{emit,keep:g=>{geometries.add(g);return g;}}),carvedTimber109=createSculptedTimber109(T,g=>{geometries.add(g);return g;});
 const hallTurn=new T.Matrix4().makeTranslation(0,0,-4).multiply(new T.Matrix4().makeRotationY(C.hallYaw??.12)).multiply(new T.Matrix4().makeTranslation(0,0,4));
 function emit(g,ma,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0,tint=1){const m=typeof ma==='string'?mats[ma]:ma;if(!m)throw Error('Missing material '+ma);const e=Array.isArray(rot)?new T.Euler(...rot):new T.Euler(0,Number(rot)||0,0),tr=new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromEuler(e),V([sx,sy,sz])).premultiply(stack.at(-1));put(g,m,tr,tint);}
 function put(g,m,tr,tint=1){if(!activeRole.startsWith('tower'))tr=hallTurn.clone().multiply(tr);if(!tr.elements.every(Number.isFinite))throw Error('Nonfinite transform');const key=g.uuid+':'+m.uuid;let b=buckets.get(key);if(!b){b={g,m,items:[]};buckets.set(key,b);}if(m===mats.red||m===mats.cedar){const a=tr.elements;const h=Math.sin(a[12]*13.7+a[13]*5.2+a[14]*18.3)*43758.5453;tint*=.90+.16*(h-Math.floor(h));}b.items.push({tr,tint,role:activeRole});geometries.add(g);roles[activeRole]=(roles[activeRole]||0)+1;}
 function box(x,y,z,w,h,d,ma='cedar',rot=0,tint=1){if(w>0&&h>0&&d>0)emit(cube,ma,x,y,z,w,h,d,rot,tint);}
 function grouped(x,y,z,yaw,fn,scale=1){const q=new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromAxisAngle(V([0,1,0]),yaw),V([scale,scale,scale]));stack.push(stack.at(-1).clone().multiply(q));try{fn();}finally{stack.pop();}}
 function role(name,fn){const r=activeRole;activeRole=name;try{return fn();}finally{activeRole=r;}}
 function between(a,b,w,d,ma='cedar',round=false){a=V(a);b=V(b);const v=b.clone().sub(a);if(v.length()<1e-8)return;put(round?cyl:cube,mats[ma],new T.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(V([0,1,0]),v.clone().normalize()),V([w,v.length(),d])).premultiply(stack.at(-1)));}
 const legacyArch=createRestorationArchitecture({instance:emit,group:grouped,box,stack,columns:[],roofAudit:[]}),solidJoinery=createSculptedJoinery(),bearingBounds=new T.Box3();
 const bearingGilt=mats.gold.clone();bearingGilt.name='scene03-worn-edge-binding-gilt';bearingGilt.color.set('#af8b46');bearingGilt.roughness=.49;bearingGilt.metalness=.68;materials.push(bearingGilt);mats.bearingGilt=bearingGilt;
 const bearingPatina211=new T.MeshStandardMaterial({name:'scene03-dark-patinated-copper-cut-ground211',color:'#694e2c',roughness:.76,metalness:.58});materials.push(bearingPatina211);mats.bearingPatina211=bearingPatina211;
 const roofCeramic=new T.MeshPhysicalMaterial({name:'scene03-blue-grey-fired-clay',color:'#52636e',map:mats.slate.map,bumpMap:mats.slate.bumpMap,bumpScale:.002,roughness:.56,metalness:.015,clearcoat:.16,clearcoatRoughness:.38,vertexColors:true});materials.push(roofCeramic);mats.roofCeramic=roofCeramic;
 const roofFrieze=mats.plaster.clone();roofFrieze.name='scene03-recessed-grey-frieze-panels';roofFrieze.color.set('#526675');roofFrieze.roughness=.93;materials.push(roofFrieze);mats.roofFrieze=roofFrieze;
 const gableRecess=mats.darkwood.clone();gableRecess.name='scene03-shadowed-gable-timber';gableRecess.color.set('#271a14');gableRecess.roughness=.89;gableRecess.bumpScale=.008;materials.push(gableRecess);mats.gableRecess=gableRecess;
 const gableInfill=new T.MeshStandardMaterial({name:'scene03-recessed-ochre-gable-infill',color:'#93815f',roughness:.88});materials.push(gableInfill);mats.gableInfill=gableInfill;
 const gableCarving=mats.cedar.clone();gableCarving.name='scene03-oiled-deep-openwork-gable-wood109-r02';gableCarving.color.set('#754322');gableCarving.roughness=.66;gableCarving.bumpScale=.004;materials.push(gableCarving);mats.gableCarving=gableCarving;
 const gableTimber180=mats.red.clone();gableTimber180.name='scene03-deep-pigmented-lacquered-gable-timber180';gableTimber180.clearcoat=.10;gableTimber180.specularIntensity=.38;materials.push(gableTimber180);mats.gableTimber180=gableTimber180;
 const foundationStone=mats.stone.clone();foundationStone.name='scene03-recessed-rubble-foundation';foundationStone.color.set('#60655b');foundationStone.roughness=.96;materials.push(foundationStone);mats.foundationStone=foundationStone;
 const stairGranite=new T.MeshStandardMaterial({name:'scene03-CC0-granite-entry-blocks',color:'#858c91',roughness:.90,vertexColors:true}),stairBed=new T.MeshStandardMaterial({name:'scene03-step-hidden-dark-stone-core',color:'#45494a',roughness:.96});materials.push(stairGranite,stairBed);mats.stairGranite=stairGranite;mats.stairBed=stairBed;
 const hallElevation=C.hallElevation??0,groundY=-hallElevation,stairBottomLocalY=(C.stairBottomWorldY??0)-hallElevation,physicalStairHeight=C.stairTopY-stairBottomLocalY;
 const stairSet=createGraniteEntrySteps(T,{count:20,width:C.stairWidth,height:physicalStairHeight,front:C.stairTopZ,back:C.stairBottomZ});
 for(const g of stairSet.slabs)g.translate(0,stairBottomLocalY,0);
 stairSet.info.placement={centerX:C.stairCenterX??0,relativeYaw:C.stairYawRelative??0,worldTopY:C.stairTopY+hallElevation,worldBottomY:C.stairBottomWorldY??0};
 for(const part of solidJoinery.bracket)if(!part.cornerOnly){part.geometry.computeBoundingBox();bearingBounds.union(part.geometry.boundingBox);}
 let closedBearingInstances=0,curvedRafters=0,gable180;
 const arch={...legacyArch,brackets(x,y,z,s=1,options={}){
  if(activeRole.startsWith('tower'))return legacyArch.brackets(x,y,z,s,options);
  const base=options.baseY??y-.15*s,receiver=options.receiverY??y+.82*s,sx=.88*s,sz=.92*s,sy=(receiver-base)/(bearingBounds.max.y-bearingBounds.min.y),offset=base-bearingBounds.min.y*sy;
  if(!(sy>0))throw Error('Curved bracket requires a positive physical bearing gap');
  grouped(x,0,z,0,()=>{
   const bracketWood=options.material??'cedar';
   for(const part of solidJoinery.bracket)if(!part.cornerOnly)emit(part.geometry,part.material==='kit_endwood'?'endwood':bracketWood,0,offset,0,sx,sy,sz);
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
  const physical=name==='main-upper-roof'||name==='lower-shoulder-roof',physicalCeramics=physical||name.startsWith('tower-roof-'),tileParts=[],hw=w/2,hd=d/2,rh=w*.275;const P=(side,t,u)=>{const span=rh+(hw-rh)*t;let x,z;if(side===0||side===2){x=u*span;z=(side===0?1:-1)*hd*t;}else{x=(side===1?1:-1)*span;z=u*hd*t;}
   const roofT=Math.min(1,t),overhang=Math.max(0,t-1),edge=Math.abs(u);let y=eave+rise*Math.pow(Math.max(0,1-roofT),1.48)+curl*Math.pow(roofT,8)*(.22+.78*Math.pow(edge,6))+overhang*(.16+.40*Math.pow(edge,4));z+=centerZ;if(connected&&side===0)y=joinTop(x,z);return[x,y,z];};
  for(let side=0;side<4;side++){
   const ranges=side===0&&frontGap?[[-1,-.001],[.001,1]]:[[-1,1]];
   for(const range of ranges){const ts=lin(inner,1,22),us=lin(range[0],range[1],48);let grid=ts.map(t=>us.map(u=>{if(side===0&&frontGap){const span=rh+(hw-rh)*t;u=Math.sign(u)*(frontGap/span+(1-frontGap/span)*Math.abs(u));}return P(side,t,u);}));
    if(connected&&side===0){const uu=Array.from(new Set([...lin(-1,1,64),...xs.map(x=>x/hw)].map(x=>x.toFixed(10)))).map(Number).sort((a,b)=>a-b);grid=ts.map(t=>uu.map(u=>P(side,t,u)));}
    emit(shell(grid,-.06,0,name+'-ceramic-layer'),'slate');emit(shell(grid,-.185,-.06,name+'-timber-deck'),'darkwood');
   }
   const rows=Math.max(12,Math.round((side%2?d:w)/(physical?.245:.205)));
   for(let i=0;i<=rows;i++){const u=-1+2*i/rows;if(side===0&&frontGap&&Math.abs(P(side,1,u)[0])<frontGap+.08)continue;
    const pieces=Math.max(6,Math.ceil(Math.hypot(side%2?hw-rh:hd,rise)*(1-inner)/.36));
    for(let j=0;j<pieces;j++){const t0=physicalCeramics?Math.max(.008,inner+(1-inner)*j/pieces):inner+(1-inner)*j/pieces,t1=inner+(1-inner)*(j+(physicalCeramics?1.025:.96))/pieces;if(physicalCeramics){tileParts.push(createClosedRoofTile(lin(t0,t1,4).map(t=>P(side,t,u)),physical?.145:.115,{cover:true,variant:i*1.31+j*.79+side*17}));if(i<rows)tileParts.push(createClosedRoofTile(lin(t0,t1,4).map(t=>P(side,t,u+1/rows)),physical?.18:.16,{cover:false,variant:i*1.71+j*.59+side*13}));}else{const p=P(side,t0,u),q=P(side,t1,u);tileBetween(p,q,.065,.94+.10*(.5+.5*Math.sin(i*11.3+j*4.7)));}}
    if(physical){const eaveCourses=[[.965,1.025],[1.02,1.06],[1.055,1.095],[1.09,1.13]];for(let k=0;k<eaveCourses.length;k++){const[aT,bT]=eaveCourses[k];tileParts.push(createClosedRoofTile(lin(aT,bT,4).map(t=>P(side,t,u)),.155,{cover:true,variant:i*1.77+side*19+k*3.1}));if(i<rows)tileParts.push(createClosedRoofTile(lin(aT,bT,4).map(t=>P(side,t,u+1/rows)),.18,{cover:false,variant:i*1.51+side*23+k*5.3}));}}
    const end=P(side,physical?1.13:1,u);if(physical)end[1]+=.025;if(!(connected&&side===0&&Math.abs(end[0])<gHalf)){arch.tileEnd(V(end),side*Math.PI/2,physical?.092:.074,i%2===0);if(physical){const nn=V([Math.sin(side*Math.PI/2),0,Math.cos(side*Math.PI/2)]),mark=V(end).addScaledVector(nn,.023);emit(new T.TorusGeometry(.039,.008,6,16),'oldgold',mark.x,mark.y,mark.z,1,1,1,[0,side*Math.PI/2,0]);emit(sphere,'bearingGilt',mark.x+nn.x*.005,mark.y,mark.z+nn.z*.005,.019,.019,.009,[0,side*Math.PI/2,0]);}if(name.startsWith('main-')||name.startsWith('lower-')){if(side!==0||physical)curvedRafter(lin(.66,physical?1.12:1.012,9).map(t=>{const p=P(side,t,u);p[1]-=.285;return p;}),physical?.09:.105,physical?.14:.16);}else{curvedRafter(lin(.48,1.035,14).map(t=>{const p=P(side,t,u);p[1]-=.24;return p;}),.105,.16);}}
   }
   // The main eave has one deep closed fascia, so short rafters end behind
   // its moulded lower lip rather than appearing as isolated needle teeth.
   if(physical){
    const curve=lin(-1,1,80).map(u=>{const p=P(side,1.08,u);p[1]-=.27;return p;});emit(createCurvedEaveRafter(curve,.25,.22),'red');
    const lip=lin(-1,1,80).map(u=>{const p=P(side,1.12,u);p[1]-=.39;return p;});emit(createCurvedEaveRafter(lip,.29,.11),'red');
    tube(lin(-1,1,80).map(u=>{const p=P(side,1.125,u);p[1]-=.24;return p;}),.022,'bearingGilt',96);
   }else for(let i=0;i<36;i++){const u=-1+2*i/36,v=-1+2*(i+1)/36,a=P(side,1,u),b=P(side,1,v);if(side===0&&(frontGap&&Math.min(Math.abs(a[0]),Math.abs(b[0]))<frontGap||connected&&Math.max(Math.abs(a[0]),Math.abs(b[0]))<gHalf))continue;a[1]-=.24;b[1]-=.24;between(a,b,.13,.23,'cedar');}
   if(side<2)for(const sign of[-1,1]){
    if(physicalCeramics){const end=physical?1.13:1.015,n=Math.ceil((end-inner)*Math.hypot(hw-rh,hd,rise)/.31);for(let j=0;j<n;j++){const a=inner+(end-inner)*j/n,b=Math.min(end+.005,inner+(end-inner)*(j+1.08)/n);tileParts.push(createClosedRidge174(lin(a,b,5).map(t=>{const q=P(side,t,sign);q[1]+=.012;return q;}),physical?.28:.20,physical?.16:.12,j+side*13));}}
    else{const pts=lin(inner,1.035,16).map(t=>{const p=P(side,t,sign);p[1]+=.075;return p;});tube(pts,.095,'slate',32);}
   }
  }
  if(physical)for(const t of[.58,.77,.94])for(let side=0;side<4;side++){
   const points=lin(-1,1,72).map(u=>{const p=P(side,t,u);p[1]-=.18;return p;});curvedRafter(points,t===.58?.18:.15,t===.58?.14:.12);
  }
  if(tileParts.length){emit(mergeGeometries(tileParts,false),'roofCeramic');for(const g of tileParts)g.dispose();}
  if(inner===0){
   if(physicalCeramics){
    box(0,eave+rise+.045,centerZ,rh*2+.10,.16,.36,'slate');const caps=[],n=Math.ceil(rh*2/.30);for(let j=0;j<n;j++){const a=-rh+rh*2*j/n,b=Math.min(rh+.04,-rh+rh*2*(j+1.08)/n);caps.push(createClosedRidge174([[a,eave+rise+.12,centerZ],[b,eave+rise+.12,centerZ]],.34,.17,j+71));}emit(mergeGeometries(caps,false),'roofCeramic');for(const g of caps)g.dispose();
    for(const sign of[-1,1])emit(createClosedRidge174([[sign*rh,eave+rise+.13,centerZ],[sign*(rh+.15),eave+rise+.25,centerZ],[sign*(rh+.23),eave+rise+.49,centerZ]],.18,.095,sign),'roofCeramic');
   }else{box(0,eave+rise+.10,centerZ,rh*2+.12,.30,.24,'slate');box(0,eave+rise+.285,centerZ,rh*2+.14,.07,.30,'tileEdge');for(const sign of[-1,1])tube([[sign*rh,eave+rise+.1,centerZ],[sign*(rh+.15),eave+rise+.22,centerZ],[sign*(rh+.23),eave+rise+.51,centerZ]],.095,'slate',16);}
  }
  return {P,bounds:{w,d,eave,rise},centerZ};
 });}

 role('temple-platform-stair',()=>{
  box(0,(C.stairTopY-.9+groundY)/2,-4.75,15.0,C.stairTopY+.9-groundY,9.0,'foundationStone');
  // Six supported stone column footings join the recessed masonry core.
  // The connected planted rock banks in main.js surround their front faces.
  for(const x of C.columnAxes)box(x,(C.stairTopY+groundY)/2,-.17,1.05,C.stairTopY-groundY,1.0,'foundationStone');
  // Keep the rear and two side regions of the old platform cap unchanged.
  // Its central front0.425m strip is now the five stone caps in stairSet,
  // at the exact original top/bottom/front bounds rather than a white lip.
  const sideCap=(15.45-C.stairWidth)/2;
  for(const s of[-1,1])box(s*(C.stairWidth/2+sideCap/2),C.stairTopY-.065,-4.4,sideCap,.13,9.65,'granite');
  box(0,C.stairTopY-.065,(-9.225+C.stairTopZ)/2,C.stairWidth,.13,C.stairTopZ+9.225,'granite');
  grouped(0,0,0,C.stairYawRelative??0,()=>grouped(C.stairCenterX??0,0,0,0,()=>{
   const n=20,run=C.stairBottomZ-C.stairTopZ;for(let i=0;i<n;i++){const top=physicalStairHeight*(n-i-1)/n+stairBottomLocalY,z0=C.stairTopZ+run*i/n,z1=C.stairTopZ+run*(i+1)/n;if(top>groundY)box(0,(top+groundY)/2,(z0+z1)/2,C.stairWidth,top-groundY,z1-z0,'stairBed');}
   for(const stone of stairSet.slabs)emit(stone,'stairGranite');
  }));
  // A closed bearing wedge joins the turned upper tread to the original
  // hall landing. Its cap and foundation overlap the retained podium.
  if(C.stairYawRelative){
   box((C.stairCenterX??0)*.5,(C.stairTopY-.15+groundY)/2,-.02,C.stairWidth+.95,C.stairTopY-.15-groundY,1.30,'foundationStone');
   box((C.stairCenterX??0)*.5,C.stairTopY-.075,-.31,C.stairWidth+.95,.15,.70,'granite');
  }
  // The porch rails stop at the stair landing; no unsupported red rail runs
  // down the exposed flight in the low pond-side view.
  for(const s of[-1,1])for(const y of[C.stairTopY+.38,C.stairTopY+.81])box(s*5.35,y,.23,4.8,.12,.14,'red');
  for(const s of[-1,1])for(let i=0;i<9;i++)box(s*(3.2+i*.55),C.stairTopY+.49,.23,.11,.84,.11,'red');
 });
 role('hall-red-columns',()=>{for(let i=0;i<C.columnAxes.length;i++){const x=C.columnAxes[i],cap=C.capitalTop-.10*Math.abs(x)/6.88,u=x/(4.95+4.05*(4.5/5.1)),roofUnder=10.5+3.1*Math.pow(1-4.5/5.1,1.48)+.56*Math.pow(4.5/5.1,8)*(.22+.78*Math.pow(Math.abs(u),6))-.37;arch.footColumn(x,0,C.stairTopY,cap-C.stairTopY-.3,Math.abs(x)<3?.43:.39);}
  for(const z of[-3.6,-7.8])for(const x of[-2.86,2.86]){arch.footColumn(x,z,C.stairTopY,5.8,.27);arch.brackets(x,C.stairTopY+6.02,z,.78);}
  for(const z of[-3.6,-7.8])for(const sign of[-1,1])arch.footColumn(sign*6.88,z,C.stairTopY,C.capitalTop-C.stairTopY-.30,.34);
 });
 const enclosure109=buildEnclosure109(T,{C,emit,box,grouped,role,mats,materials,keep:g=>{geometries.add(g);return g;},tube,addLight(light,p){light.position.fromArray(p).applyMatrix4(hallTurn);group.add(light);}});
 role('columns-gilt-bronze-collars',()=>{
  for(const x of C.columnAxes){
   const rr=Math.abs(x)<3?.437:.397;
   emit(cyl,'black',x,4.78,0,rr+.004,.85,rr+.004);
   for(const y of[4.39,4.61,5.12])emit(cyl,'oldgold',x,y,0,rr+.012,.043,rr+.012);
   const neck=C.capitalTop-.50-.10*Math.abs(x)/6.88;
   emit(cyl,'oldgold',x,C.capitalTop-.31-.10*Math.abs(x)/6.88,0,rr+.010,.055,rr+.010);
   // Hollow bronze follows the real round shaft. Four short cast fasteners
   // physically join a smaller foliate front plate to the curved sleeve.
   emit(gableReceivers.cuff(rr,.42),'black',x,neck,0);
   gableReceivers.face(x,neck,rr,.46,.34,.38);
   for(const sx of[-1,1])for(const sy of[-1,1]){
    const xx=sx*.16,shaftZ=Math.sqrt(rr*rr-xx*xx),front=rr+.025;
    emit(new T.CylinderGeometry(.008,.008,front-shaftZ+.010,10),'oldgold',x+xx,neck+sy*.105,(front+shaftZ)/2,1,1,1,[Math.PI/2,0,0]);
    emit(sphere,'bearingGilt',x+xx,neck+sy*.105,front,.012,.012,.005);
   }
  }
 });
 role('continuous-deep-transom-header109',()=>{
  const top=8.825,bottom=C.stairTopY+3.75;
  for(const sign of[-1,1])box(sign*(6.75+2.10)/2,(top+bottom)/2,-.98,6.75-2.10,top-bottom,.30,'darkwood');
  for(const[y,h,d]of[[8.10,.31,.60],[8.65,.35,.67]])box(0,y,-.40,13.82,h,d,'cedar');
  for(const sign of[-1,1])for(let j=0;j<6;j++){const x=sign*(2.47+j*.72);emit(carvedTimber109.scrollFace(j%3),'endwood',x,8.30,-.005,.60,.49,.23);}
 });

 const upperEave=C.upperEave,upperWidth=C.upperRoofWidth;
 const upper=roof({name:'main-upper-roof',w:upperWidth,d:10.4,eave:upperEave,rise:C.ridgeY-upperEave,curl:.72,centerZ:C.ridgeZ,connected:false});
 const lowerRoof174=roof({name:'lower-shoulder-roof',w:C.lowerRoofWidth,d:10.2,eave:C.lowerEave,rise:3.1,curl:.56,centerZ:-4.5,inner:.45,frontGap:0});
 role('lower-eave-complete-parallel-rafters',()=>{
  const P=(u,t)=>[u*(C.lowerRoofWidth*.275+C.lowerRoofWidth*.225*t),C.lowerEave+3.1*Math.pow(Math.max(0,1-t),1.48)+.56*Math.pow(Math.min(1,t),8)*(.22+.78*Math.pow(Math.abs(u),6))+Math.max(0,t-1)*(.16+.4*Math.pow(Math.abs(u),6))-.34,5.1*t-4.5];
  for(let j=0;j<=68;j++){const u=-1+2*j/68;curvedRafter(lin(.45,1.012,12).map(t=>{const p=P(u,t);p[1]+=.055;return p;}));const p=P(u,1.012);arch.squareFitting(p[0],p[1]+.055,p[2]+.025,.095,.135,0,j%4===0);}
  for(const t of[.58,.77,.94])for(let k=0;k<44;k++){let a=P(-1+2*k/44,t),b=P(-1+2*(k+1)/44,t);a[1]-=.11;b[1]-=.11;between(a,b,.18,.25,'red');}
 });
 role('front-gable-thick-ceramics-and-recessed-carving',()=>grouped(C.gableCenter,0,0,0,()=>{
  // Photo landmarks are lifted onto the retained front plane, not matched by
  // a new focal length: crown ~[781,76], left shoulder ~[638,219].
  const hw=3.15,front=.25,back=-5.0,base=15.14,foot=15.44,peak=C.gablePeak;
  const curve=x=>base+(peak-base)*Math.pow(Math.max(0,1-Math.abs(x)/hw),1.48)+.060*Math.pow(Math.abs(x)/hw,8);
  const mainHeight=(x,z)=>{const t=(z-C.ridgeZ)/5.2,span=upperWidth*(.275+.225*t),u=(x+.10)/span;return upperEave+(C.ridgeY-upperEave)*Math.pow(Math.max(0,1-t),1.48)+.72*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),6));};
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
  gable180=buildGableTimber180(T,{emit,box,lin,tube,curve,hw,front,foot,peak});
  // Ref03 has a family-medallion crest rather than the Ref05 mask's eyes
  // and teeth. Reuse only its closed lobed ceramic backing.
  emit(solidJoinery.cornerMask[0].geometry,'slate',0,peak+.08,front+.07,1.10,1.10,.95);
  emit(new T.TorusGeometry(.145,.025,10,40),'bearingGilt',0,peak+.34,front+.22);rosette(0,peak+.34,front+.25,.12,'bearingGilt');emit(sphere,'bearingGilt',0,peak+.98,front+.10,.065,.12,.055);
 }));

 role('main-roof-gilded-lotus-finial',()=>{
  const x=3.8,z=-4.6,y=19.3,t=(z-C.ridgeZ)/5.2,u=x/(upperWidth*(.275+.225*t)),roofY=upper.P(0,t,u)[1]+.08,seatY=y-.23;emit(new T.CylinderGeometry(.18,.25,seatY-roofY,24),'slate',x,(roofY+seatY)/2,z);emit(cyl,'oldgold',x,y+1.9,z,.055,3.8,.055);emit(cyl,'oldgold',x,y-.08,z,.25,.30,.25);emit(sphere,'gold',x,y+.10,z,.22,.18,.22);
  for(let j=0;j<8;j++){let h=y+.22+j*.42,r=.37*(1-j*.073);emit(cyl,'oldgold',x,h+.03,z,r*.48,.18,r*.48);for(let k=0;k<6;k++){let a=k*Math.PI*2/6;emit(sphere,'gold',x+Math.cos(a)*r*.62,h+.12,z+Math.sin(a)*r*.62,.075,.18,.105,[0,a,Math.sin(a)*.3]);}emit(new T.TorusGeometry(r,.025,7,24),'gold',x,h,z,1,1,1,[Math.PI/2,0,0]);for(let k=0;k<7;k++){let a=k*Math.PI*2/7;between([x+Math.cos(a)*r*.7,h,z+Math.sin(a)*r*.7],[x+Math.cos(a)*r*1.2,h+.20,z+Math.sin(a)*r*1.2],.024,.024,'gold',true);}}
  emit(sphere,'gold',x,y+3.85,z,.105,.22,.105);
 });
 const hallCarpentry=buildHallCarpentry03(T,{C,emit,box,grouped,role,between,mats,upper,upperWidth,lin,tube,rosette});
 role('lower-three-step-bearing-capitals-and-girts',()=>{
  const lowerSeat=x=>{const t=4.5/5.1,u=x/(C.lowerRoofWidth*(.275+.225*t));return C.lowerEave+3.1*Math.pow(1-t,1.48)+.56*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),6))-.37;};
  // A returned timber cornice closes the old bright slots behind the lower
  // capitals. Its top follows the same actual roof bearing datum, and its
  // thick end returns connect into both side walls rather than ending in air.
  const cornice=new T.Shape(),half=7.05,bottom=8.59;
  cornice.moveTo(-half,bottom);cornice.lineTo(half,bottom);for(const x of lin(half,-half,72))cornice.lineTo(x,lowerSeat(x)+.20);cornice.closePath();
  const core=new T.ExtrudeGeometry(cornice,{depth:.50,steps:1,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2});emit(core,'darkwood',0,0,-1.27);
  for(const sign of[-1,1]){
   box(sign*6.94,9.31,-4.65,.36,1.46,7.52,'darkwood');
   box(sign*6.98,9.80,-4.65,.50,.24,7.70,'red');
  }
  for(const y of[8.75,9.23,9.67])emit(createCurvedEaveRafter(lin(-half,half,64).map(x=>[x,y+.075*Math.pow(Math.abs(x)/half,6),-.66]),.36,.19),'red');
  for(let i=0;i<C.columnAxes.length-1;i++){
   const a=C.columnAxes[i],b=C.columnAxes[i+1],x=(a+b)/2;
   box(x,9.44,-.745,b-a-.14,.24,.10,'gableRecess');
   if(b-a<3)gableReceivers.face(x,9.43,-.61,.46,.26,.35);
  }
  for(const x of C.columnAxes){const cap=C.capitalTop-.10*Math.abs(x)/6.88;hallCarpentry.bearingCluster(x,cap-.14,-.04,lowerSeat(x),1.11,true,.90);}
  for(const[y,z]of[[9.72,-.18],[10.30,.12]])emit(createCurvedEaveRafter(lin(-7.04,7.04,64).map(x=>[x,y+C.lowerEave-10.5+.075*Math.pow(Math.abs(x)/7.04,6),z]),.37,.28),'red');
 });
 role('lower-fully-seated-return-bearing174',()=>{
  const height=(x,z)=>{
   const w=C.lowerRoofWidth,hw=w/2,rh=w*.275,hd=5.1,tx=Math.max(0,(Math.abs(x)-rh)/(hw-rh)),tz=Math.abs(z+4.5)/hd,t=Math.max(tx,tz,.0001);
   return tx>tz?lowerRoof174.P(x>0?1:3,t,(z+4.5)/(hd*t))[1]:lowerRoof174.P(z> -4.5?0:2,t,x/(rh+(hw-rh)*t))[1];
  };
  for(const sign of[-1,1]){
   // The side attic closes against the real underside, rather than letting
   // background sky shine through rectangular holes behind the capitals.
   const shape=new T.Shape(),half=4.12,base=C.capitalTop-.22;shape.moveTo(-half,base);shape.lineTo(half,base);for(const u of lin(half,-half,84))shape.lineTo(u,height(sign*6.50,-4.5-sign*u)-.19);shape.closePath();
   const core=new T.ExtrudeGeometry(shape,{depth:.43,steps:1,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2});
   grouped(sign*6.50,0,-4.50,sign*Math.PI/2,()=>emit(core,'darkwood'));
   for(const z of[-2.35,-5.35,-7.75])grouped(sign*6.50,0,z,sign*Math.PI/2,()=>{
    box(0,9.43,.45,1.65,.56,.09,'roofFrieze');for(const edge of[-1,1]){box(edge*.88,9.43,.50,.11,.77,.18,'cedar');box(0,9.43+edge*.34,.50,1.87,.11,.18,'red');}
   });
   box(sign*6.88,C.capitalTop-.17,-4.02,.46,.37,8.36,'red');
   for(const z of[-3.6,-7.8]){
    const ds=.82,s=.92,x=sign*6.88,top=Math.min(...lin(-1.12*s,1.12*s,20).map(a=>height(x+sign*1.43*ds,z+a)-.43));
    grouped(x,0,z,sign*Math.PI/2,()=>hallCarpentry.bearingCluster(0,C.capitalTop-.14,0,top,s,true,ds));
   }
  }
 });
 const towerLevels=[];grouped(...C.towerPosition,C.towerYaw,()=>{
  role('tower-stone-foundation',()=>{box(0,-.075,0,5.1,.45,5.1,'stone');box(0,.21,0,5.35,.12,5.35,'granite');});
  const widths=[6.3,6.12,5.95,5.78,5.60].map(w=>w*C.towerWidthScale),eaves=Array.from({length:5},(_,i)=>6.9+i*C.towerPitch);
  for(let level=0;level<5;level++){const w=widths[level],y=eaves[level],floor=level?eaves[level-1]+.90:.34,body=w*.61,half=body/2;towerLevels.push({level:level+1,eave:y,width:w,floor});
   role('tower-storey-'+(level+1),()=>{
    box(0,floor-.06,0,body+.55,.12,body+.55,'cedar');if(level===0)for(const z of[-body/2,body/2])for(let j=-2;j<=2;j++){arch.brackets(j*body/5,y-.29,z,.42);box(j*body/5,y-.42,z+.02,.31,.08,.37,'oldgold');}
    for(const x of[-half,0,half])for(const z of[-half,half]){arch.footColumn(x,z,floor,Math.max(.25,y-floor-(level?1.21:.56)),level?.12:.105);if(level===0)arch.brackets(x,y-.33,z,.39);}
    for(const z of[-half,0,half])for(const x of[-half,half])if(z===0){arch.footColumn(x,z,floor,Math.max(.25,y-floor-(level?1.21:.56)),level?.12:.105);if(level===0)arch.brackets(x,y-.33,z,.39);}
    // The old four continuous back walls rotated over the front windows.
    // Only the three clearly exposed upper rooms get segmented thick infill
    // and real openings. Lower garden-occluded construction is retained.
    if(level>=1)box(0,y-.44,0,body-.14,.08,body-.14,'darkwood');
    for(const side of[0,1,2,3])grouped(0,0,0,side*Math.PI/2,()=>{
     if(level>=1)emitTowerEnclosureFace(box,{width:body,faceZ:half,floor,top:y-1.0});
     else{box(0,(floor+y-1.0)/2,half,body,y-1.0-floor,.14,'darkwood');for(const xx of[-.46,-.23,0,.23,.46])box(xx*body,(floor+y-1.0)/2,half+.09,.075,y-1.0-floor,.12,'cedar');for(const yy of[floor+.36,floor+1.4,y-1.28])box(0,yy,half+.09,body,.10,.12,'red');}
     if(level>=1){box(0,y-.96,half,body+.24,.19,.30,'red');for(let k=-2;k<=2;k++){
      const x=k*body/4,ds=.36,z=half-.10,t=(z+1.43*ds)/(w/2),span=w*(.275+.225*t),top=y+1.06*Math.pow(1-t,1.48)+.37*Math.pow(t,8)*(.22+.78*Math.pow(Math.max(0,Math.abs(x)-.46*1.12)/span,6))-.43;
      hallCarpentry.bearingCluster(x,y-.94,z,top,.46,k%2===0,ds);
     }}
     box(0,y-.30,half,body+.55,.19,.22,'red');box(0,floor+.38,half+.2,body+.62,.10,.10,'red');box(0,floor+.12,half+.2,body+.62,.09,.10,'red');
     for(let i=0;i<=12;i++)box(-body*.49+i*body*.98/12,floor+.25,half+.2,.06,.34,.06,'red');
    });
   });roof({name:'tower-roof-'+(level+1),w,d:w,eave:y,rise:1.06,curl:.37});role('tower-corner-bells-'+level,()=>{for(const sx of[-1,1])for(const sz of[-1,1]){const x=sx*w*.493,z=sz*w*.493;between([x,y+.20,z],[x,y-.24,z],.012,.012,'oldgold',true);emit(new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.075,0),new T.Vector2(.065,.045),new T.Vector2(.040,.14),new T.Vector2(0,.17)],16),'oldgold',x,y-.42,z);emit(sphere,'gold',x,y-.46,z,.024,.035,.024);}});
  }
  role('tower-finial',()=>{const bottom=eaves[4]+1.06+.31,top=C.towerHeight;emit(cyl,'gold',0,(bottom+top-.25)/2,0,.082,top-bottom-.25,.082);for(let i=0;i<17;i++){const y=bottom+.15+i*(top-bottom-.58)/16,r=.42*(1-i*.037);const g=new T.TorusGeometry(r,.053,8,32);emit(g,'gold',0,y,0,1,.82,1,[Math.PI/2,0,0]);emit(cyl,'oldgold',0,y-.07,0,r*.58,.17,r*.58);}emit(sphere,'oldgold',0,top-.16,0,.11,.16,.11);});
 },C.towerSceneScale);

 // Flush grouped geometry into real shadow-casting ordinary meshes/instances.
 let instances=0,triangles=0;for(const {g,m,items}of buckets.values()){
  const object=items.length===1?new T.Mesh(g,m):new T.InstancedMesh(g,m,items.length);
  if(items.length===1){object.matrixAutoUpdate=false;object.matrix.copy(items[0].tr);}else{for(let i=0;i<items.length;i++){object.setMatrixAt(i,items[i].tr);object.setColorAt(i,new T.Color().setScalar(items[i].tint));}object.instanceMatrix.needsUpdate=true;object.instanceColor.needsUpdate=true;}
  object.castShadow=object.receiveShadow=true;object.userData.reference4Roles=[...new Set(items.map(a=>a.role))];object.userData.reference4InstanceRoles=items.map(a=>a.role);object.name=object.userData.reference4Roles.join('+');group.add(object);instances+=items.length;triangles+=(g.index?.count??g.attributes.position.count)/3*items.length;
 }
 group.updateMatrixWorld(true);const b=new T.Box3().setFromObject(group),tip=[C.towerPosition[0],C.towerPosition[1]+C.towerHeight*C.towerSceneScale,C.towerPosition[2]];
 const stairSocket=(z,y)=>{const a=C.stairYawRelative??0,x=C.stairCenterX??0;return[Math.cos(a)*x+Math.sin(a)*z,y,-Math.sin(a)*x+Math.cos(a)*z];};
 const sockets={entrance:{center:[0,C.stairTopY+2.04,-.62],clearWidth:4.2,clearHeight:C.portalHeight,frontZ:-.355},sanctuary:{center:[0,C.stairTopY,-4.65],floor:C.stairTopY,floorY:C.stairTopY,frontOpeningWidth:4.2,width:4.2,depth:5.0,frontZ:-.65},stair:{top:stairSocket(C.stairTopZ,C.stairTopY),bottom:stairSocket(C.stairBottomZ,stairBottomLocalY),width:C.stairWidth,coordinates:'Hall-local before common hallTurn; actual offset/turned flight'},mainRidge:[0,C.ridgeY,C.ridgeZ],canopy:{front:gFront,back:gBack,halfWidth:gHalf,crest:[0,canopy(0,gFront),gFront],bargeboardMember:'entrance-saddled-bargeboard'},tower:{position:[...C.towerPosition],top:tip,height:C.towerHeight*C.towerSceneScale,levels:towerLevels,scale:C.towerSceneScale},lanternSupports:[-5.55,5.55].map(x=>({x,probeZ:1.5,bodyCenter:[x,5.8,1.7]}))};
 const bounds={min:b.min.toArray(),max:b.max.toArray()};
 return {group,sockets,bounds,gable180,materials:mats,stats:{meshes:group.children.length,instances,triangles,roles,closedBearingInstances,curvedRafters,enclosure109,gable180,hallCarpentry:{bearingSets:hallCarpentry.bearingSets,bearingSeats174:hallCarpentry.bearingSeats174,deepCarvedNoses:hallCarpentry.deepCarvedNoses,carvedReceiverFaces:hallCarpentry.carvedReceiverFaces,gableReceiverFaces:gableReceivers.count,wallClosed:hallCarpentry.wallClosed,construction:hallCarpentry.construction},entryStair:stairSet.info,roofConstruction:{upperWidth,upperEave,mainRidgeY:C.ridgeY,closedClayThickness:.018,dormerCrown:C.gablePeak,dormerFront:.25}},config:C,limits:['New complete v4 source after workspace reset; not byte-identical v3 recovery.','Original-photo dimensions and unseen joints remain reconstruction hypotheses.','No GPU or image acceptance from CPU construction.','Separate closed roof-layer panels share contacts; not a global Boolean-union or structural engineering certification.'],dispose(){hallCarpentry.dispose();solidJoinery.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
