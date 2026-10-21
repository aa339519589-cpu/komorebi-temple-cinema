import {buildDeepEntranceCarving} from './scene04-carving.js';
import {buildPortalDepth131} from './scene04-portal-depth131.js';
import {createGraniteStairBlock131} from './scene04-stair-block131.js';
import {createRestorationArchitecture} from './reference4-detail-kernel.js';
import {createReference4MaterialSet} from './reference4-materials.js';
import {createWeatheredFlagstone} from './reference4-garden-stone.js';
import {emitTowerEnclosureFace} from './tower-enclosure04.js';
import {createReference4StairPlan} from './reference4-stair-plan.js';
import {createHallProfile132,buildHallBearing132} from './scene04-hall-profile132.js';

// A new complete exterior reconstruction after the execution filesystem reset.
// NOT a byte recovery of v3/371b. Original 4 and the actual v3 image are references.
export const REFERENCE4_ARCHITECTURE_REVISION='reference4-hall132-irimoya-karahafu-bearing';
export function buildReference4Architecture(T,options={}) {
 const C={stairTopY:1.8,stairTopZ:0,stairBottomZ:8,stairWidth:5.6,columnAxes:[-6.88,-4.73,-2.86,2.86,4.73,6.88],capitalTop:7.15,ridgeY:13.2,ridgeZ:-5,lowerRoofWidth:18,upperRoofWidth:16.4,towerPosition:[-14.21,-.64,-12.0044],towerHeight:15.3,towerSceneScale:1.16,towerYaw:0,towerWidthFactor:1,towerDepthRatio:1,towerEaveBase:4.3,towerEavePitch:1.6,towerTopRoofRise:.66,towerTopRidgeHalfRatio:.275,towerGroundY:-.8,...options};
 if(!(C.stairTopY>0&&C.stairBottomZ>C.stairTopZ&&C.ridgeY>C.capitalTop+3))throw Error('Invalid complete exterior dimensions');
 const group=new T.Group();group.name=REFERENCE4_ARCHITECTURE_REVISION;
 const {mats,materials,textures}=createReference4MaterialSet(T,C),geometries=new Set(),buckets=new Map(),stack=[new T.Matrix4()],roles={};
 const cube=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(1,1,1,24),sphere=new T.SphereGeometry(1,12,8);let activeRole='architecture';
 const V=a=>new T.Vector3(...a), H=y=>y+C.stairTopY-3;
 const stairPlan=createReference4StairPlan(C);
 function emit(g,ma,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0,tint=1){const m=typeof ma==='string'?mats[ma]:ma;if(!m)throw Error('Missing material '+ma);const e=Array.isArray(rot)?new T.Euler(...rot):new T.Euler(0,Number(rot)||0,0),tr=new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromEuler(e),V([sx,sy,sz])).premultiply(stack.at(-1));put(g,m,tr,tint);}
 function put(g,m,tr,tint=1){if(!tr.elements.every(Number.isFinite))throw Error('Nonfinite transform');const key=g.uuid+':'+m.uuid;let b=buckets.get(key);if(!b){b={g,m,items:[]};buckets.set(key,b);}b.items.push({tr,tint,role:activeRole});geometries.add(g);roles[activeRole]=(roles[activeRole]||0)+1;}
 function box(x,y,z,w,h,d,ma='cedar',rot=0,tint=1){if(w>0&&h>0&&d>0)emit(cube,ma,x,y,z,w,h,d,rot,tint);}
 function grouped(x,y,z,yaw,fn,scale=1){const q=new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromAxisAngle(V([0,1,0]),yaw),V([scale,scale,scale]));stack.push(stack.at(-1).clone().multiply(q));try{return fn();}finally{stack.pop();}}
 const hallProfile=createHallProfile132(C);
 function role(name,fn){const r=activeRole;activeRole=name;const hall=/^(hall-|central-real-portal|main-|lower-shoulder-roof|entrance-|deep-coffered-portal)/.test(name);try{return hall?grouped(...hallProfile.origin,0,fn):fn();}finally{activeRole=r;}}
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
 function ceramicSection(pan=false){
  const pp=[],uv=[],nn=[],N=pan?14:20,point=(u,z,inside=false)=>pan?[u,(.25*u*u+.02)-(inside?.24:0),z]:[Math.cos(u)*(inside?.76:1),Math.sin(u)*(inside?.76:1),z];
  const tri=(a,b,c,normal)=>{const first=typeof normal==='function'?normal(a):normal;if(V(b).sub(V(a)).cross(V(c).sub(V(a))).dot(V(first))<0)[b,c]=[c,b];for(const q of[a,b,c]){pp.push(...q);uv.push(q[0],q[2]);const n=typeof normal==='function'?normal(q):normal;nn.push(...n);}},quad=(a,b,c,d,n)=>{tri(a,b,c,n);tri(b,d,c,n);};
  for(let i=0;i<N;i++){
   const u=pan?-1+2*i/N:i*Math.PI/N,v=pan?-1+2*(i+1)/N:(i+1)*Math.PI/N,
    outer=q=>pan?V([-.5*q[0],1,0]).normalize().toArray():[q[0]/Math.hypot(q[0],q[1]),q[1]/Math.hypot(q[0],q[1]),0],
    inner=q=>outer(q).map(x=>-x);
   if(pan){quad(point(u,-.5),point(u,.5),point(v,-.5),point(v,.5),outer);quad(point(u,-.5,true),point(v,-.5,true),point(u,.5,true),point(v,.5,true),inner);}
   else{quad(point(u,-.5),point(v,-.5),point(u,.5),point(v,.5),outer);quad(point(u,-.5,true),point(u,.5,true),point(v,-.5,true),point(v,.5,true),inner);}
   quad(point(u,-.5,true),point(u,-.5),point(v,-.5,true),point(v,-.5),[0,0,-1]);
   quad(point(u,.5),point(u,.5,true),point(v,.5),point(v,.5,true),[0,0,1]);
  }
  for(const u of pan?[-1,1]:[0,Math.PI])quad(point(u,-.5,true),point(u,.5,true),point(u,-.5),point(u,.5),pan?[Math.sign(u),0,0]:[0,-1,0]);
  const g=meshFromTriangles(pp,uv,pan?'closed-concave-pan-ceramic':'closed-smooth-cover-ceramic');g.setAttribute('normal',new T.Float32BufferAttribute(nn,3));return g;
 }
 const barrel=ceramicSection(false),panTile=ceramicSection(true);
 function tileBetween(a,b,r=.067,tint=1,pan=false){a=V(a);b=V(b);const z=b.clone().sub(a),len=z.length();if(len<.03)return;z.normalize();let x=V([0,1,0]).cross(z).normalize();if(x.length()<.1)x.set(1,0,0);const y=z.clone().cross(x).normalize();const m=new T.Matrix4().makeBasis(x,y,z);m.scale(V([r,r,len]));m.setPosition(a.clone().add(b).multiplyScalar(.5));m.premultiply(stack.at(-1));put(pan?panTile:barrel,mats.slate,m,tint);}

 // Common curved canopy/main-roof weather profile. Front remains the source-led arch.
 const gHalf=hallProfile.half,gFront=hallProfile.front,upperFront=C.ridgeZ+4.5,gBack=hallProfile.back,xs=Array.from(new Set([...lin(-gHalf,gHalf,80),...lin(-C.upperRoofWidth/2,C.upperRoofWidth/2,64).filter(x=>Math.abs(x)<=gHalf)].map(x=>x.toFixed(9)))).map(Number).sort((a,b)=>a-b);
 // Measured on the 1254 px reference: broad shoulders, a 211 px crown and
 // lower 320 px ends. The former narrow Gaussian pinched the gable and its
 // strong upturn raised both ends into a flat, single-sheet-looking canopy.
 const archFront=hallProfile.arch,rawCanopy=hallProfile.canopy;
 const upperEave=C.upperEaveY??H(11.60),upperCurl=C.upperRoofCurl??.62,upperRidgeHalfRatio=C.upperRidgeHalfRatio??.275,upperRidgeOffset=C.upperRidgeOffsetX??0,upperEaveOffset=C.upperEaveOffsetX??0;
 const upperRaw=hallProfile.upperRaw;
 function joinTop(x,z){return z>=gBack&&Math.abs(x)<=gHalf?Math.max(upperRaw(x,z),rawCanopy(x,z)+.025):upperRaw(x,z);}
 // The entrance canopy is its own shallow roof. Only the upper hipped roof
 // rises to meet its central crown. Pulling every canopy shoulder up to the
 // high eave made the former giant slate curtain and hid the front frieze.
 const canopy=(x,z)=>rawCanopy(x,z),mainEaveOpeningHalf=2.8;
 // A moulded bargeboard follows its own curved normal, with a recessed face,
 // rounded lip and underside bead. It replaces the single flat fascia slab.
 function mouldedBargeboard(){
  const rim=[[-.025,-.16],[-.025,.035],[-.060,.105],[-.105,.105],[-.135,.045],[-.19,.045],[-.21,.072],[-.36,.072],[-.39,.025],[-.445,.025],[-.46,-.16]],p=[],uv=[],path=lin(-gHalf,gHalf,144),P=(i,k)=>{const x=path[i],dy=(canopy(x+.002,gFront)-canopy(x-.002,gFront))/.004,n=1/Math.sqrt(1+dy*dy),[drop,z]=rim[k];return[x-dy*n*drop,canopy(x,gFront)+n*drop,gFront+z];},tri=(a,b,c,ua,ub,uc)=>{p.push(...a,...b,...c);uv.push(...ua,...ub,...uc);};
  for(let i=0;i<path.length-1;i++)for(let k=0;k<rim.length;k++){const l=(k+1)%rim.length,a=P(i,k),b=P(i+1,k),c=P(i,l),d=P(i+1,l);tri(a,c,b,[i*.08,k*.07],[i*.08,l*.07],[(i+1)*.08,k*.07]);tri(b,c,d,[(i+1)*.08,k*.07],[i*.08,l*.07],[(i+1)*.08,l*.07]);}
  for(const i of[0,path.length-1])for(let k=1;k<rim.length-1;k++){const a=P(i,0),b=P(i,k),c=P(i,k+1);if(i===0)tri(a,c,b,[0,0],[0,1],[1,1]);else tri(a,b,c,[0,0],[1,1],[0,1]);}
  return meshFromTriangles(p,uv,'entrance-saddled-bargeboard');
 }
 function roof({name,w,d,eave,rise,curl=.45,centerZ=0,inner=.0,frontGap=0,connected=false,ridgeHalfRatio=.275,ridgeOffsetX=0,eaveOffsetX=0}){return role(name,()=>{
  const hw=w/2,hd=d/2,rh=w*ridgeHalfRatio;const P=(side,t,u)=>{if(name==='main-upper-roof'){const p=hallProfile.mainPoint(side,t,u);if(side===0)p[1]=joinTop(p[0],p[2]);return p;}const span=rh+(hw-rh)*t;let x,z;if(side===0||side===2){x=u*span;z=(side===0?1:-1)*hd*t;}else{x=(side===1?1:-1)*span;z=u*hd*t;}
   let y=eave+rise*Math.pow(Math.max(0,1-t),1.48)+curl*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),6));x+=ridgeOffsetX*(1-t)+eaveOffsetX*t;z+=centerZ;if(connected&&side===0)y=joinTop(x,z);return[x,y,z];};
  for(let side=0;side<4;side++){
   const ranges=side===0&&frontGap?[[-1,-.001],[.001,1]]:[[-1,1]];
   for(const range of ranges){const ts=lin(inner,1,22),us=lin(range[0],range[1],48);let grid=ts.map(t=>us.map(u=>{if(side===0&&frontGap){const span=rh+(hw-rh)*t;u=Math.sign(u)*(frontGap/span+(1-frontGap/span)*Math.abs(u));}return P(side,t,u);}));
    if(connected&&side===0){const uu=Array.from(new Set([...lin(-1,1,64),...xs.map(x=>x/hw)].map(x=>x.toFixed(10)))).map(Number).sort((a,b)=>a-b);grid=ts.map(t=>uu.map(u=>P(side,t,u)));}
    emit(shell(grid,-.06,0,name+'-ceramic-layer'),'slate');emit(shell(grid,-.185,-.06,name+'-timber-deck'),'darkwood');
   }
   if(name==='main-upper-roof'){
    // Constant metric tile lanes terminate at the actual hip, rather than
    // squeezing every eave course into the shorter upper ridge.
    const half=side%2?hd:hw,rows=Math.round(2*half/.27),pitch=2*half/rows;
    const lane=(coordinate,pan=false)=>{if(Math.abs(coordinate)>half)return;const t0=side%2?Math.abs(coordinate)/hd:Math.pow(Math.max(0,(Math.abs(coordinate)-hallProfile.ridgeHalf)/(hw-hallProfile.ridgeHalf)),1/hallProfile.neckPower),count=Math.max(2,Math.ceil((1-t0)*Math.hypot(hd,rise)/.30)),at=t=>P(side,t,side%2?(t<1e-8?0:coordinate/(hd*t)):coordinate/hallProfile.span(t));
     for(let j=0;j<count;j++){const a=t0+(1-t0)*j/count,b=t0+(1-t0)*(j+.97)/count;tileBetween(at(a),at(b),pan?.085:.074,.96+.04*Math.sin(coordinate*7+j*1.7),pan);}
     if(!pan&&!(side===0&&Math.abs(coordinate)<mainEaveOpeningHalf)){const end=at(1);arch.tileEnd(V(end),side*Math.PI/2,.085,Math.round(coordinate/pitch)%2===0);const a=at(.83),b=at(1.012);a[1]-=.24;b[1]-=.24;between(a,b,.075,.12,'red');}
    };
    for(let i=0;i<=rows;i++){lane(-half+i*pitch);if(i<rows)lane(-half+(i+.5)*pitch,true);}
   }else{
   const rows=Math.max(12,Math.round((side%2?d:w)/.205));
   for(let i=0;i<=rows;i++){const u=-1+2*i/rows;if(side===0&&frontGap&&Math.abs(P(side,1,u)[0])<frontGap+.08)continue;
    const pieces=Math.max(6,Math.ceil(Math.hypot(side%2?hw-rh:hd,rise)*(1-inner)/.36));
    for(let j=0;j<pieces;j++){const t0=inner+(1-inner)*j/pieces,t1=inner+(1-inner)*(j+.96)/pieces;const p=P(side,t0,u),q=P(side,t1,u);tileBetween(p,q,.065,.94+.10*(.5+.5*Math.sin(i*11.3+j*4.7)));if(i<rows){const um=u+1/rows;tileBetween(P(side,t0,um),P(side,t1,um),.060,.92+.07*Math.sin(i*3.1+j),true);}}
    const end=P(side,1,u);if(!(connected&&side===0&&Math.abs(end[0])<mainEaveOpeningHalf)){arch.tileEnd(V(end),side*Math.PI/2,.074,i%2===0);const a=P(side,.75,u),b=P(side,1.035,u);a[1]-=.24;b[1]-=.24;between(a,b,.105,.16,'red');}
   }
   }
   // Exposed eave fascia follows the real curled roof. Central joined edge is not a second fascia.
   for(let i=0;i<36;i++){const u=-1+2*i/36,v=-1+2*(i+1)/36,a=P(side,1,u),b=P(side,1,v);if(side===0&&(frontGap&&Math.min(Math.abs(a[0]),Math.abs(b[0]))<frontGap||connected&&Math.max(Math.abs(a[0]),Math.abs(b[0]))<mainEaveOpeningHalf))continue;a[1]-=.24;b[1]-=.24;between(a,b,connected&&side===0?.20:.13,connected&&side===0?.20:.23,'cedar');
    if(connected&&side===0){a[1]-=.15;b[1]-=.15;a[2]+=.12;b[2]+=.12;between(a,b,.035,.055,'oldgold');}
   }
   if(side<2)for(const sign of[-1,1]){const pts=lin(inner,1.035,16).map(t=>{const p=P(side,t,sign);p[1]+=.075;return p;});tube(pts,.095,'slate',32);}
  }
  if(inner===0){box(ridgeOffsetX,eave+rise+.10,centerZ,rh*2+.12,.30,.24,'slate');box(ridgeOffsetX,eave+rise+.285,centerZ,rh*2+.14,.07,.30,'tileEdge');for(const s of[-1,1]){tube([[ridgeOffsetX+s*rh,eave+rise+.1,centerZ],[ridgeOffsetX+s*(rh+.15),eave+rise+.22,centerZ],[ridgeOffsetX+s*(rh+.23),eave+rise+.51,centerZ]],.095,'slate',16);rosette(ridgeOffsetX+s*(rh-.16),eave+rise+.12,centerZ+.145,.10,'oldgold');}}
  return {P,bounds:{w,d,eave,rise},centerZ};
 });}

 function solidFootprint(outline,bottom,top,ma,tag){
  const shape=new T.Shape();outline.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth:top-bottom,bevelEnabled:false,steps:1,curveSegments:1});g.rotateX(-Math.PI/2);g.translate(0,bottom,0);g.userData.architectureMember=tag;emit(g,ma);return g;
 }
 role('temple-platform-stair',()=>{
  const p=stairPlan,l=p.landing,back=l.back,front=l.front,wing=l.wingFront;
  // A back landing and two side wings leave an exact flared stair opening.
  // The former uncut cap extended through the next lower tread at z=.40.
  box(0,(C.stairTopY-l.cap-.9)/2,(back+front)/2,15.2,C.stairTopY-l.cap+.9,front-back,'stone');
  box(0,C.stairTopY-l.cap/2,(back+front)/2,15.45,l.cap,front-back,'granite');
  for(const s of[-1,1]){
   const outline=[[s*p.halfWidth(front),front],[s*7.725,front],[s*7.725,wing],[s*p.halfWidth(wing),wing]];
   solidFootprint(outline,-.9,C.stairTopY-l.cap,'stone','closed-porch-wing-core');
   solidFootprint(outline,C.stairTopY-l.cap,C.stairTopY,'granite','closed-porch-wing-cap');
  }
  for(const step of p.steps){
   const stoneThickness=step.cap;
   solidFootprint(step.outline,step.bottom,step.top-stoneThickness,'stairGranite','closed-flared-tread-core-'+step.index);
   // Vary the stone courses from tread to tread: a uniform four-panel grid
   // made the entire stair read as one mechanically repeated stack. Each
   // closed granite cap is now a slightly different, staggered cut block.
   const pieces=4+(step.index%2),cuts=[-1],h0=p.halfWidth(step.back),h1=p.halfWidth(step.front);
   for(let j=1;j<pieces;j++){
    const q=(Math.sin((step.index+1)*127.1+j*311.7)*43758.5453)%1,noise=q<0?q+1:q;
    cuts.push(-1+2*j/pieces+(noise-.5)*.18);
   }
   cuts.push(1);
   for(let k=0;k<pieces;k++){
    const a=cuts[k],b=cuts[k+1],g=createGraniteStairBlock131({leftBack:a*h0,rightBack:b*h0,leftFront:a*h1,rightFront:b*h1,back:step.back,front:step.front,top:step.top,thickness:stoneThickness,seed:1307+step.index*31+k*107});
    g.userData.architectureMember='closed-staggered-flared-tread-cap-'+step.index+'-'+k;
    const tint=.88+.17*(.5+.5*Math.sin((step.index+1)*19.17+(k+1)*43.73));g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(tint),3));emit(g,'stairGranite');
   }
   for(const s of[-1,1]){
    const a=p.halfWidth(step.back),b=p.halfWidth(step.front),outline=[[s*(a+.025),step.back],[s*(a+.31),step.back],[s*(b+.31),step.front],[s*(b+.025),step.front]];
    solidFootprint(outline,step.bottom,step.top+.095,'stone','closed-stair-flank-'+step.index);
   }
  }
  for(const s of[-1,1]){
   for(const level of['upper','lower']){
    const points=lin(0,1,32).map(t=>p.railPoint(s,t,level));tube(points,level==='upper'?.095:.067,'red',64);
   }
   for(let i=0;i<6;i++){
    const t=i/6,z=p.z0+p.run*t,x=s*(p.halfWidth(z)+.23),base=p.steps[Math.min(p.count-1,Math.floor(t*p.count))].top+.095,top=p.railPoint(s,t)[1]+.17;
    box(x,(base+top)/2,z,.20,top-base,.20,'red');box(x,top+.025,z,.24,.05,.24,'oldgold');emit(sphere,'black',x,top+.12,z,.105,.12,.105);
   }
  }
  for(const terminal of p.terminals){
   const {x,z,bottom,postTop,finialTop}=terminal,h=postTop-bottom;
   box(x,bottom+h/2,z,.34,h,.34,'red');box(x,bottom+.08,z,.43,.16,.43,'oldgold');
   box(x,postTop+.04,z,.40,.08,.40,'oldgold');emit(sphere,'black',x,finialTop-.20,z,.145,.20,.145);
   for(const t of[.22,.50,.79]){const yy=bottom+h*t;arch.squareFitting(x,yy,z+.183,.285,.31,0,true);relief(x,yy,z+.20,.25,.27);}
   for(const s of[-1,1])box(x+s*.145,bottom+h/2,z+.18,.025,h-.07,.026,'oldgold');
  }
  for(const s of[-1,1])for(const y of[C.stairTopY+.48,C.stairTopY+1.12])box(s*5.025,y,.23,5.25,.14,.16,'red');
  for(const s of[-1,1])for(let i=0;i<10;i++)box(s*(2.58+i*.56),C.stairTopY+.60,.23,.12,1.16,.12,'red');
 });
 let hallBearing;role('hall-red-columns',()=>{hallBearing=buildHallBearing132(T,{emit,box,between,profile:hallProfile,C});for(const x of C.columnAxes){const cap=Math.abs(x)<3.2?C.capitalTop:Math.abs(x)<5.5?C.capitalTop-.72:C.capitalTop-1.0;arch.brackets(x,cap-.06,0,.78);}
  for(const z of[-3.6,-7.8])for(const x of[C.columnAxes[0],C.columnAxes[2],C.columnAxes[3],C.columnAxes[5]]){arch.footColumn(x,z,C.stairTopY,5.8,.27);arch.brackets(x,C.stairTopY+6.02,z,.78);}
 });
 role('hall-enclosure-doors',()=>{
  box(0,C.stairTopY+3.75,-8.65,14.2,7.5,.23,'darkwood');for(const s of[-1,1])box(s*7.02,C.stairTopY+2.9,-4.5,.20,5.8,8.4,'red');
  for(const s of[-1,1])for(const seg of[[C.columnAxes[3]+.26,C.columnAxes[4]-.26],[C.columnAxes[4]+.26,C.columnAxes[5]-.26]]){const x=s*(seg[0]+seg[1])/2,w=seg[1]-seg[0],h=3.8,y=C.stairTopY+h/2+.22;box(x,y,-.57,w,h,.16,'darkwood');for(const xx of[-w/2,w/2])box(x+xx,y,-.42,.09,h+.13,.12,'red');for(const yy of[-h/2,h/2])box(x,y+yy,-.39,w,.11,.13,'cedar');for(let k=1;k<8;k++)box(x-w/2+w*k/8,y,-.39,.032,h-.15,.045,'oldgold');for(let k=1;k<13;k++)box(x,y-h/2+h*k/13,-.385,w-.1,.025,.05,'cedar');}
  for(const sign of[-1,1])for(const [cx,w]of[[(C.columnAxes[3]+C.columnAxes[4])/2,C.columnAxes[4]-C.columnAxes[3]-.52],[(C.columnAxes[4]+C.columnAxes[5])/2,C.columnAxes[5]-C.columnAxes[4]-.52]]){
   box(sign*cx,C.stairTopY+4.22,-.57,w,.66,.18,'darkwood');
   for(const yy of[C.stairTopY+3.93,C.stairTopY+4.50])box(sign*cx,yy,-.435,w,.075,.085,'cedar');
  }
  // Opaque timber cladding and a deep interlocked bearing storey replace
  // the exposed window-like grid. These are full boards behind the brackets.
  box(0,H(9.7),-1.15,14.25,2.22,.16,'darkwood');for(let i=0;i<55;i++){const x=-7.0+i*14/54;if(Math.abs(x)>3.15)box(x,H(9.7),-1.025,.247,2.18,.095,'cedar');}
  for(const side of[-1,1]){for(const y of[9.45,10.35])box(side*5.15,y,-.96,3.75,.115,.16,'red');for(let j=0;j<9;j++){const x=side*(3.45+j*.43);arch.brackets(x,upperRaw(x,upperFront)-1.12,-.82,.30,{detail:true,interlocked:true,material:'cedar'});}}
 });
 role('central-real-portal',()=>{
  const clearW=4.2,clearH=4.38,z=-.62,y0=C.stairTopY;
  for(const s of[-1,1]){box(s*(clearW/2+.21),y0+clearH/2,z,.42,clearH,.50,'cedar');box(s*(clearW/2+.21),y0+clearH/2,z+.264,.33,clearH,.028,'oldgold');for(let j=0;j<10;j++)relief(s*(clearW/2+.21),y0+.23+j*.405,z+.285,.29,.28);box(s*(clearW/2+.035),y0+clearH/2,z-.08,.07,clearH,.42,'gold');}
  box(0,y0+clearH+.23,z,5.04,.46,.50,'cedar');box(0,y0+clearH+.23,z+.265,4.85,.34,.026,'oldgold');for(let j=-5;j<=5;j++)relief(j*.405,y0+clearH+.23,z+.285,.35,.24);box(0,y0+.035,z,4.2,.07,.60,'darkwood');
  for(const y of[C.capitalTop-.40,C.capitalTop+.20]){box(0,y,.06,6.15,.36,.52,'red');for(const x of[-2.4,-1.6,-.8,0,.8,1.6,2.4])relief(x,y,.333,.68,.25);}
  for(const s of[-1,1])for(const span of[[C.columnAxes[3],C.columnAxes[4],C.capitalTop-.72],[C.columnAxes[4],C.columnAxes[5],C.capitalTop-1.0]]){const x=s*(span[0]+span[1])/2,w=span[1]-span[0];box(x,span[2]+.12,.04,w,.32,.44,'red');relief(x,span[2]+.12,.272,w*.84,.24);}
 });

 const upper=roof({name:'main-upper-roof',w:C.upperRoofWidth,d:9,eave:upperEave,rise:C.ridgeY-upperEave,curl:upperCurl,centerZ:C.ridgeZ,connected:true,ridgeHalfRatio:upperRidgeHalfRatio,ridgeOffsetX:upperRidgeOffset,eaveOffsetX:upperEaveOffset});
 role('main-ridge-gilt-rosettes',()=>{for(const x of[-3.9,0,3.9])rosette(x+upperRidgeOffset,C.ridgeY+.13,C.ridgeZ+.18,.17,'oldgold');
  for(const side of[-1,1]){const end=hallProfile.mainPoint(0,1,side);tube([end,[end[0]+side*.07,end[1]+.16,end[2]-.06],[end[0]+side*.10,end[1]+.32,end[2]-.14],[end[0]+side*.025,end[1]+.37,end[2]-.20]],.078,'slate',24);
   const x=upperRidgeOffset+side*hallProfile.ridgeHalf,h=side>0?.88:.58;const p=new T.Shape();p.moveTo(-.16,0);p.lineTo(.21,0);p.bezierCurveTo(.31,.18,.22,.34,.14,.44);p.bezierCurveTo(.09,.58,.27,.76,.25,.91);p.lineTo(.07,1);p.bezierCurveTo(.10,.78,-.06,.67,-.12,.48);p.lineTo(-.16,0);p.closePath();const g=new T.ExtrudeGeometry(p,{depth:.23,bevelEnabled:true,bevelSize:.025,bevelThickness:.015,bevelSegments:2,curveSegments:12});g.scale(1,h,1);emit(g,'slate',x,C.ridgeY+.15,C.ridgeZ+(side<0?.12:-.11),1,1,1,[0,side<0?Math.PI:0,0]);rosette(x,C.ridgeY+.27,C.ridgeZ+.145,.12,'oldgold');
  }
 });
 role('main-upper-roof-bearing-frieze',()=>{
  // Separate upper eaves expose an actual two-tier bearing row. Its girts
  // and small closed bracket assemblies follow the hip, above the gallery.
  for(const sign of[-1,1]){
   const axes=Array.from({length:9},(_,i)=>sign*(3.05+i*.57));
   for(const x of axes)for(const drop of[.62,.31])arch.brackets(x,upperRaw(x,upperFront)-drop,upperFront-.03,.28,{detail:true,material:'cedar'});
   for(let i=0;i<axes.length-1;i++)for(const drop of[.69,.30]){
    const x=axes[i],xx=axes[i+1];between([x,upperRaw(x,upperFront)-drop,upperFront+.04],[xx,upperRaw(xx,upperFront)-drop,upperFront+.04],.115,.30,'red');
   }
  }
 });
 roof({name:'lower-shoulder-roof',w:C.lowerRoofWidth,d:10.2,eave:H(7.90),rise:2.17,curl:.56,centerZ:-4.5,inner:.50,frontGap:6.43});
 role('entrance-deep-connected-canopy',()=>{
  const zs=lin(upperFront,gFront,15),weather=gridAt(xs,zs,canopy);emit(shell(weather,-.035,.025,'connected-canopy-ceramics'),'slate');emit(shell(weather,-.16,-.035,'connected-canopy-timber-deck'),'cedar');
  // 37 individually solid rough-sawn rafters. Boards are above them, so the
  // underside presents true member depth and air gaps, not a smooth false skin.
  const rr=lin(-gHalf+.1,gHalf-.1,36);for(let k=0;k<rr.length;k++){const x=rr[k],rgrid=gridAt([x-.065,x+.065],lin(gBack,gFront+.09,30),canopy);emit(shell(rgrid,-.39,-.16,'visible-curved-cedar-rafter'),'cedar');}
  for(const z of[gBack,-.48,.57]){const curve=gridAt(xs,[z-.11,z+.11],canopy);emit(shell(curve,-.64,-.39,'transverse-curved-carrier'),'red');}
  // Front bargeboard is a real closed curved beam, queried by the lantern arms.
  emit(mouldedBargeboard(),'cedar');
  for(const drop of[-.11,-.39])tube(xs.map(x=>[x,canopy(x,gFront)+drop,gFront+(drop>-.2?.110:.045)]),.012,'oldgold',120);
  for(let i=0;i<rr.length;i++){const x=rr[i],y=canopy(x,gFront)-.47;box(x,y,gFront+.085,.095,.115,.22,'cedar');if(i%4===0)arch.squareFitting(x,y,gFront+.204,.085,.10,0,true);}
  for(let i=0;i<=48;i++){const x=-gHalf+2*gHalf*i/48;const ts=lin(upperFront,gFront+.06,8);for(let j=0;j<ts.length-1;j++){tileBetween([x,canopy(x,ts[j])+.038,ts[j]],[x,canopy(x,ts[j+1])+.038,ts[j+1]],.088,.94+.07*Math.sin(i*5+j));if(i<48){const xx=x+gHalf/48;tileBetween([xx,canopy(xx,ts[j])+.038,ts[j]],[xx,canopy(xx,ts[j+1])+.038,ts[j+1]],.079,.96,true);}}arch.tileEnd(V([x,canopy(x,gFront+.06)+.038,gFront+.095]),0,.108,i%2===0);if(i%4===0)rosette(x,canopy(x,gFront+.06)+.038,gFront+.127,.037,'oldgold');}
  // Discrete curved ribs and inset timber panels retain the arch depth.
  for(const x of[-2.9,0,2.9]){const y=canopy(x,.57)-.65;box(x,(y+C.capitalTop+.36)/2,.57,.18,Math.max(.05,y-C.capitalTop-.36),.20,'red');}
  relief(0,canopy(0,gFront+.08)-.25,gFront+.10,1.05,.29);
  const peak=canopy(0,gFront)+.025,oni=new T.Shape();oni.moveTo(-.39,0);oni.lineTo(-.29,.13);oni.bezierCurveTo(-.52,.30,-.50,.63,-.31,.65);oni.lineTo(-.22,.43);oni.lineTo(-.14,.92);oni.quadraticCurveTo(0,1.13,.14,.92);oni.lineTo(.22,.43);oni.lineTo(.31,.65);oni.bezierCurveTo(.50,.63,.52,.30,.29,.13);oni.lineTo(.39,0);oni.closePath();const crest=new T.ExtrudeGeometry(oni,{depth:.20,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:3,curveSegments:18});emit(crest,'slate',0,peak,gFront-.07,1,1.25,1);emit(new T.TorusGeometry(.205,.032,8,36),'tileEdge',0,peak+.62,gFront+.17);rosette(0,peak+.62,gFront+.207,.165,'oldgold');
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
  const mouth=stairPlan.halfWidth(.37)+.30;
  for(const sign of[-1,1]){wall(sign<0?-7.65:mouth,sign<0?-mouth:7.65,.37,C.stairTopY-.05);wall(sign<0?-17.8:7.7,sign<0?-7.7:17.8,-1.82,2.8);}
 });
 // Full-deep entrance joinery: curved arch ribs, closely spaced bearing sets,
 // pierced floral carving and the small shrine inside the karahafu recess.
 role('entrance-layered-joinery',()=>{
  // Continuous recessed timber closes the bearing storey under the broad
  // upper eave. Its cap follows the actual roof underside at every strip.
  for(let i=0;i<35;i++){const x=-6.8+i*.4,bottom=H(8.05),top=canopy(x,-1.04)-.17;if(Math.abs(x)>3.15)box(x,(bottom+top)/2,-1.13,.406,top-bottom,.19,'cedar',0,.73+.05*Math.sin(i*2.1));}
  for(const side of[-1,1])for(let i=0;i<6;i++){
   const x=side*(3.25+i*.58);
   arch.brackets(x,canopy(x,.78)-.83,-.10,.54,{detail:true,material:'cedar'});
   arch.brackets(x,canopy(x,gFront)-.98,.30,.52,{detail:false,material:'cedar'});
  }
  for(const x of C.columnAxes){const y=canopy(x,gFront)-.995;arch.brackets(x,y,.16,.64,{detail:true,material:'red'});}
  // A recessed timber vault and separate curved ribs replace the flat
  // vertical-board infill visible inside the photographed broken gable.
  const vaultXs=lin(-3.2,3.2,64),vault=gridAt(vaultXs,lin(-1.8,.78,24),(x,z)=>canopy(x,z)-.82);
  emit(shell(vault,-.11,.015,'karahafu-recessed-timber-vault'),'cedar');
  for(const z of [.78,.17,-.44,-1.05]){const grid=gridAt(vaultXs,[z-.07,z+.07],(x,zz)=>canopy(x,zz)-.64);emit(shell(grid,-.105,.025,'separate-curved-vault-rib'),'red');}
  // Front-facing nested ribs catch the daylight entering beneath the eave.
  // The deeper soffit remains a real vault, rather than a black flat mask.
  for(let layer=0;layer<2;layer++){const xx=lin(-3.18+layer*.13,3.18-layer*.13,64),z=1.27-layer*.64,grid=gridAt(xx,[z-.105,z+.105],x=>canopy(x,gFront)-.60-layer*.34);emit(shell(grid,-.185,.025,'nested-front-curved-timber-rib'),layer%2?'cedar':'red');}
  const panel=new T.Shape(),foot=C.capitalTop+.36;panel.moveTo(-3.0,foot);for(const x of lin(-3.0,3.0,80))panel.lineTo(x,Math.max(foot+.025,canopy(x,gFront)-1.0));panel.lineTo(3.0,foot);panel.closePath();
  for(const x of[-2.2,-1.4,-.7,.7,1.4,2.2]){const hole=new T.Path(),y=foot+.19+.16*(1-Math.abs(x)/2.3);hole.absellipse(x,y,.105,.085,0,Math.PI*2,true);panel.holes.push(hole);}
  // The carved rear gable is behind four structural ribs. Its previous face
  // at z=.49 filled the photographed vault with a flat perforated triangle.
  emit(new T.ExtrudeGeometry(panel,{depth:.18,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,curveSegments:16}),'cedar',0,0,-.78);
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
   for(const [j,x]of[-2.32,-1.18,0,1.18,2.32].entries()){
    const scale=j===2?1.24:j%2?.92:.82;
    for(const sign of[-1,1]){
     const curl=[[x+sign*.045*scale,y-.065*scale,.69],[x+sign*.12*scale,y+.10*scale,.71],[x+sign*.28*scale,y+.12*scale,.73],[x+sign*.36*scale,y+.015*scale,.75],[x+sign*.30*scale,y-.060*scale,.77],[x+sign*.20*scale,y-.035*scale,.79],[x+sign*.18*scale,y+.025*scale,.80]];
     tube(curl,.014,'oldgold',20);
     tube([[x+sign*.035*scale,y-.10*scale,.70],[x+sign*.12*scale,y-.16*scale,.74],[x+sign*.22*scale,y-.13*scale,.77]],.010,'gold',12);
    }
    rosette(x,y,.735,.10*scale,j===2?'gold':'oldgold');
   }
  }
  const shrineY=C.capitalTop+.68;
  box(0,shrineY+.40,.87,.46,.85,.18,'black');
  for(const sign of[-1,1]){
   box(sign*.25,shrineY+.40,.98,.025,.89,.026,'oldgold');
   tube([[sign*.25,shrineY,.97],[sign*.52,shrineY+.04,.97],[sign*.67,shrineY+.18,.97],[sign*.55,shrineY+.31,.97],[sign*.42,shrineY+.21,.97]],.022,'gold',22);
  }
  emit(sphere,'oldgold',0,shrineY+.22,1.0,.15,.06,.065);emit(sphere,'gold',0,shrineY+.38,1.0,.087,.15,.055);emit(sphere,'gold',0,shrineY+.59,1.0,.064,.075,.055);for(const side of[-1,1])emit(sphere,'oldgold',side*.11,shrineY+.29,1.025,.10,.045,.055,[0,0,side*.25]);
  box(0,shrineY+.85,.98,.53,.04,.04,'oldgold');
  // Lower eaves have real purlin ends and alternating engraved finials.
  for(const sign of[-1,1])for(let i=0;i<22;i++){
   const x=sign*(3.25+i*.25);if(Math.abs(x)>8.9)continue;
   const y=H(7.90)+.24+.28*Math.pow(Math.abs(x)/9,8);
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

 // Scene04 tower-only dimensions fitted to documented 1254px silhouette points.
 // Member radii, tile sections, materials and uniform assembly scale are retained.
 const towerLevels=[];grouped(...C.towerPosition,C.towerYaw,()=>{
  const q=C.towerWidthFactor,dr=C.towerDepthRatio,ground=(C.towerGroundY-C.towerPosition[1])/C.towerSceneScale;
  role('tower-stone-foundation',()=>{if(ground<-.30)box(0,(ground-.30)/2,0,5.1*q,-.30-ground,5.1*q*dr,'stone');box(0,-.075,0,5.1*q,.45,5.1*q*dr,'stone');box(0,.21,0,5.35*q,.12,5.35*q*dr,'granite');});
  const widths=[6.90,6.70,6.50,6.30,6.05].map(w=>w*q),eaves=Array.from({length:5},(_,i)=>C.towerEaveBase+i*C.towerEavePitch);
  for(let level=0;level<5;level++){const w=widths[level],d=w*dr,y=eaves[level],floor=level?eaves[level-1]+.69:.34,body=w*.61,bodyDepth=d*.61,half=body/2,halfDepth=bodyDepth/2;towerLevels.push({level:level+1,eave:y,width:w,depth:d,floor});
   role('tower-storey-'+(level+1),()=>{
    box(0,floor-.06,0,body+.55,.12,bodyDepth+.55,'cedar');
    for(const x of[-half,0,half])for(const z of[-halfDepth,halfDepth]){arch.footColumn(x,z,floor,Math.max(.25,y-floor-.56),.105);arch.brackets(x,y-.33,z,.39);}
    for(const z of[-halfDepth,0,halfDepth])for(const x of[-half,half])if(z===0){arch.footColumn(x,z,floor,Math.max(.25,y-floor-.56),.105);arch.brackets(x,y-.33,z,.39);}
    if(level>=2)box(0,y-.44,0,body-.14,.08,bodyDepth-.14,'darkwood'); // closed inner ceiling, supported by the retained frame
    for(const side of[0,1,2,3])grouped(0,0,0,side*Math.PI/2,()=>{const faceBody=side%2?bodyDepth:body,faceHalf=side%2?half:halfDepth;
      if(level>=2)emitTowerEnclosureFace(box,{width:faceBody,faceZ:faceHalf,floor,top:y-.4});
      else box(0,(floor+y-.4)/2,-faceHalf,faceBody,Math.max(.25,y-.4-floor),.12,'darkwood');
      box(0,y-.30,faceHalf,faceBody+.55,.19,.22,'red');box(0,floor+.38,faceHalf+.2,faceBody+.62,.10,.10,'red');box(0,floor+.12,faceHalf+.2,faceBody+.62,.09,.10,'red');for(let i=0;i<=12;i++)box(-faceBody*.49+i*faceBody*.98/12,floor+.25,faceHalf+.2,.06,.34,.06,'red');
      if(level<2)for(const x of[-faceBody*.25,0,faceBody*.25]){const h=Math.min(.68,(y-floor)*.55),yy=(floor+y-.4)/2;box(x,yy,faceHalf-.06,.60,h,.08,'black');for(let k=0;k<=3;k++)box(x-.28+k*.56/3,yy,faceHalf+.005,.025,h,.035,'oldgold');for(let k=0;k<=3;k++)box(x,yy-h/2+k*h/3,faceHalf+.008,.60,.025,.035,'cedar');}
    });
   });roof({name:'tower-roof-'+(level+1),w,d,eave:y,rise:level===4?C.towerTopRoofRise:.66,curl:.37,ridgeHalfRatio:level===4?C.towerTopRidgeHalfRatio:.275});
  }
  role('tower-finial',()=>{const bottom=eaves[4]+C.towerTopRoofRise+.31,top=C.towerHeight;emit(cyl,'oldgold',0,(bottom+top-.25)/2,0,.038,top-bottom-.25,.038);for(let i=0;i<13;i++){const y=bottom+.15+i*(top-bottom-.58)/12,r=.39*(1-i*.043);const g=new T.TorusGeometry(r,.027,6,28);emit(g,'oldgold',0,y,0,1,1,1,[Math.PI/2,0,0]);}emit(sphere,'oldgold',0,top-.16,0,.11,.16,.11);});
 },C.towerSceneScale);

 const carving=buildDeepEntranceCarving(mats,{capitalTop:C.capitalTop,canopyAt:x=>canopy(x,gFront+.08),front:gFront+.115,columnAxes:C.columnAxes.filter(x=>x>0)});carving.position.fromArray(hallProfile.origin);group.add(carving);
 const portalDepth=role('deep-coffered-portal',()=>buildPortalDepth131({emit,box,tube,rosette,mats,materials,floorY:C.stairTopY}));portalDepth.lights=portalDepth.lights.map(p=>p.map((v,i)=>v+hallProfile.origin[i]));
 // Flush grouped geometry into real shadow-casting ordinary meshes/instances.
 let instances=0,triangles=0;for(const {g,m,items}of buckets.values()){
  const object=items.length===1?new T.Mesh(g,m):new T.InstancedMesh(g,m,items.length);
  if(items.length===1){object.matrixAutoUpdate=false;object.matrix.copy(items[0].tr);}else{for(let i=0;i<items.length;i++){object.setMatrixAt(i,items[i].tr);object.setColorAt(i,new T.Color().setScalar(items[i].tint));}object.instanceMatrix.needsUpdate=true;object.instanceColor.needsUpdate=true;}
  object.castShadow=object.receiveShadow=true;object.userData.reference4Roles=[...new Set(items.map(a=>a.role))];object.userData.reference4InstanceRoles=items.map(a=>a.role);object.name=object.userData.reference4Roles.join('+');group.add(object);instances+=items.length;triangles+=(g.index?.count??g.attributes.position.count)/3*items.length;
 }
 group.updateMatrixWorld(true);const b=new T.Box3().setFromObject(group),tip=[C.towerPosition[0],C.towerPosition[1]+C.towerHeight*C.towerSceneScale,C.towerPosition[2]];
 const sockets={entrance:{center:[0,C.stairTopY+2.19,-.62],clearWidth:4.2,clearHeight:4.38,frontZ:-.355},sanctuary:{center:[0,C.stairTopY,-4.65],floor:C.stairTopY,floorY:C.stairTopY,frontOpeningWidth:4.2,width:4.2,depth:5.0,frontZ:-.65},stair:{top:[0,C.stairTopY,C.stairTopZ],bottom:[0,stairPlan.baseY,C.stairBottomZ],width:C.stairWidth,topWidth:stairPlan.topWidth,treads:stairPlan.steps,landing:stairPlan.landing,terminals:stairPlan.terminals,scope:stairPlan.assumptions},mainRidge:[upperRidgeOffset,C.ridgeY,C.ridgeZ],canopy:{front:gFront,back:gBack,halfWidth:gHalf,crest:[0,canopy(0,gFront),gFront],bargeboardMember:'entrance-saddled-bargeboard'},tower:{position:[...C.towerPosition],top:tip,height:C.towerHeight*C.towerSceneScale,levels:towerLevels,scale:C.towerSceneScale},lanternSupports:[-5.55,5.55].map(x=>({x,probeZ:1.5,bodyCenter:[x,5.8+(C.stairTopY-1.8),1.7]}))};
 const hallWorld=p=>p.map((v,i)=>v+hallProfile.origin[i]);sockets.entrance.center=hallWorld(sockets.entrance.center);sockets.entrance.frontZ+=hallProfile.origin[2];sockets.sanctuary.center=hallWorld(sockets.sanctuary.center);sockets.sanctuary.frontZ+=hallProfile.origin[2];sockets.lanternSupports=sockets.lanternSupports.map(s=>({...s,x:s.x+hallProfile.origin[0],probeZ:s.probeZ+hallProfile.origin[2],bodyCenter:hallWorld(s.bodyCenter)}));sockets.mainRidge=hallWorld(sockets.mainRidge);sockets.canopy.crest=hallWorld(sockets.canopy.crest);sockets.canopy.front+=hallProfile.origin[2];sockets.canopy.back+=hallProfile.origin[2];
 const bounds={min:b.min.toArray(),max:b.max.toArray()};
 return {group,sockets,bounds,materials:mats,portalDepth,hallBearing,hallProfile,stats:{meshes:group.children.length,instances,triangles,roles},config:C,limits:['New complete v4 source after workspace reset; not byte-identical v3 recovery.','Original-photo dimensions and unseen joints remain reconstruction hypotheses.','No GPU or image acceptance from CPU construction.','Separate closed roof-layer panels share contacts; not a global Boolean-union or structural engineering certification.'],dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
