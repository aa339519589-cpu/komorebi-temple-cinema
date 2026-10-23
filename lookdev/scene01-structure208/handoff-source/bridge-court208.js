import * as T from 'three';
import {layout124 as L} from './layout124.js';
import {prism124} from './layout-components124.js';

// Actual bridge/court recovery208. The old low camera and bridge end seats
// remain. New routes are connected physical plans, not projected scene cards.
const G=L.bridge,H=G.halfSpan,S=L.stair,TAU=Math.PI*2;
const matrix=new T.Matrix4().compose(new T.Vector3(...G.position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),G.yaw),new T.Vector3(...G.scale)),inverse=matrix.clone().invert();
const D=x=>G.deckBaseline+.085+G.archRise*(1-(x/H)**2)+G.slope*x/H;
const W=(u,v)=>new T.Vector3(u,0,v).applyMatrix4(matrix),UV=(x,z)=>new T.Vector3(x,G.position[1],z).applyMatrix4(inverse);
const eastY=G.position[1]+D(H),westY=G.position[1]+D(-H),turnY=eastY-.504;
const hallYaw=L.hall.yaw,axisZ=new T.Vector3(Math.sin(hallYaw),0,Math.cos(hallYaw)),flightTop=new T.Vector3(...S.top).addScaledVector(axisZ,S.topLanding.forwardOffset),foot=new T.Vector3(...S.bottom),forward=foot.clone().sub(flightTop).setY(0).normalize(),across=new T.Vector3(-forward.z,0,forward.x);
const courtBackL=foot.clone().addScaledVector(across,1.90),courtBackR=foot.clone().addScaledVector(across,-1.90),courtFrontL=courtBackL.clone().addScaledVector(forward,1.95),courtFrontR=courtBackR.clone().addScaledVector(forward,1.95);
const leftA=UV(courtBackL.x,courtBackL.z),leftB=UV(courtFrontL.x,courtFrontL.z),endU=v=>leftA.x+(leftB.x-leftA.x)*(v-leftA.z)/(leftB.z-leftA.z);
const E=H+1.06,westU=-H-1.15,backV=-3.90,frontV=-2.65;
export const PLAN208={eastEndY:eastY,westEndY:westY,turnY,stairCourtY:S.landingY,bridgeDeckTop:D(0)+G.position[1],eastLanding:{u:[H,E],v:[-1.10,1.10]},northFlight:{u:[H,E],v:[-2.65,-1.10],risers:3},turnLanding:{u:[H,E],v:[backV,frontV]},eastFlight:{u0:E,v:[backV,frontV],risers:3,receivingEdge:'Actual oblique left boundary of forecourt'},westLanding:{u:[westU,-H],v:[-1.10,1.10]},westFlight:{u:[westU,-H],v:[-4.60,-1.10],risers:10},court:[courtBackL,courtBackR,courtFrontR,courtFrontL].map(p=>[p.x,p.z]),stairFoot:S.bottom,cameraOrDollyChanged:false};

function outsideRect(u,v,a,b,c,d){return Math.hypot(Math.max(a-u,0,u-b)*G.scale[0],Math.max(c-v,0,v-d)*G.scale[2]);}
function region208(u,v,margin=0){
 const east=outsideRect(u,v,H,E,-1.10,1.10),north=outsideRect(u,v,H,E,-2.65,-1.10),turn=outsideRect(u,v,H,E,backV,frontV),west=outsideRect(u,v,westU,-H,-1.10,1.10),westFlight=outsideRect(u,v,westU,-H,-4.60,-1.10);
 const vv=T.MathUtils.clamp(v,backV,frontV),eu=endU(vv),eastFlight=outsideRect(u,v,E,eu,backV,frontV);
 return[{distance:east,y:eastY},{distance:north,y:eastY-.504*T.MathUtils.clamp((-v-1.10)/1.55,0,1)},{distance:turn,y:turnY},{distance:eastFlight,y:turnY+(S.landingY-turnY)*T.MathUtils.clamp((u-E)/(eu-E),0,1)},{distance:west,y:westY},{distance:westFlight,y:westY+(1.69-westY)*T.MathUtils.clamp((-v-1.10)/3.50,0,1)}];
}
function courtCoordinates(x,z){const q=new T.Vector3(x,0,z).sub(foot),u=q.dot(across),v=q.dot(forward);return{u,v,distance:Math.hypot(Math.max(Math.abs(u)-1.90,0),Math.max(-v,0,v-1.95))};}
export function routeClearance208(x,z,margin=.15){
 const p=UV(x,z),regions=region208(p.x,p.z),court=courtCoordinates(x,z);
 return regions.some(q=>q.distance<=margin)||court.distance<=margin;
}
export function bank208(x,z,original){
 const p=UV(x,z);let y=original;
 for(const r of region208(p.x,p.z))if(r.distance<1.65)y=Math.max(y,r.y-.43-r.distance*1.03);
 const court=courtCoordinates(x,z);if(court.distance<1.30)y=Math.max(y,S.landingY-.19-court.distance*.76);
 // Keep the occupied channel beneath the bridge open. Raised end shoulders
 // stop at actual masonry abutments instead of filling the arch with a mound.
 if(p.x>-H+.22&&p.x<H-.22&&Math.abs(p.z)<1.55)y=Math.min(y,original+.10);
 return y;
}
function closedGeometry(p,uv,ix,name){
 const kept=[];let volume=0;
 for(let k=0;k<ix.length;k+=3){const [a,b,c]=ix.slice(k,k+3).map(i=>new T.Vector3(...p.slice(i*3,i*3+3)));if(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()<1e-23)continue;volume+=a.dot(b.clone().cross(c))/6;kept.push(...ix.slice(k,k+3));}
 if(volume<0)for(let k=0;k<kept.length;k+=3)[kept[k+1],kept[k+2]]=[kept[k+2],kept[k+1]];
 const g=new T.BufferGeometry();g.name=name;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(kept);g.computeVertexNormals();g.userData={closedBridge208:true,physicalVolume:Math.abs(volume)};return g;
}
function archMember208({z=0,depth=.24,top=x=>D(x)-.17,bottom=x=>D(x)-.53,notches=[]}){
 const sections=Array.from({length:81},(_,i)=>({x:-H+2*H*i/80,notch:false}));
 for(const x of notches){const a=x-.072,b=x+.072;for(let i=sections.length-1;i>=0;i--)if(sections[i].x>a&&sections[i].x<b)sections.splice(i,1);sections.push({x:a,notch:false},{x:a,notch:true},{x:b,notch:true},{x:b,notch:false});}
 sections.sort((a,b)=>a.x-b.x);const p=[],uv=[],ix=[];
 for(const s of sections){const hi=s.notch?D(s.x)-.29:top(s.x),lo=bottom(s.x);for(const q of[[s.x,lo,z-depth/2],[s.x,lo,z+depth/2],[s.x,hi,z+depth/2],[s.x,hi,z-depth/2]]){p.push(...q);uv.push(q[0],q[1]);}}
 for(let j=0;j<sections.length-1;j++)for(let k=0;k<4;k++){const a=j*4+k,b=j*4+(k+1)%4;ix.push(a,b,a+4,b,b+4,a+4);}
 const n=(sections.length-1)*4;ix.push(0,2,1,0,3,2,n,n+1,n+2,n,n+2,n+3);return closedGeometry(p,uv,ix,'structure208-closed-arched-member-with-joist-seats');
}
function curvedCrossbeam208(x0,x1,z0,z1,top,bottom,name){
 const p=[],uv=[],ix=[],N=4;
 for(let j=0;j<=N;j++){const x=x0+(x1-x0)*j/N;for(const q of[[x,bottom(x),z0],[x,bottom(x),z1],[x,top(x),z1],[x,top(x),z0]]){p.push(...q);uv.push(q[0],q[2]);}}
 for(let j=0;j<N;j++)for(let k=0;k<4;k++){const a=j*4+k,b=j*4+(k+1)%4;ix.push(a,b,a+4,b,b+4,a+4);}const n=N*4;ix.push(0,2,1,0,3,2,n,n+1,n+2,n,n+2,n+3);return closedGeometry(p,uv,ix,name);
}
function bronzeTie208(){
 const outline=[[1.167,.24],[1.173,.24],[1.173,-.022],[1.104,-.066],[1.104,-.42],[1.098,-.42],[1.098,-.062],[1.167,-.018]],s=new T.Shape();s.moveTo(...outline[0]);for(const q of outline.slice(1))s.lineTo(...q);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:.065,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:1,steps:1});g.rotateY(Math.PI/2);g.translate(-.0325,0,0);return g;
}
export function buildBridge208(B){
 B.label('structure208-half-lapped-arched-garden-bridge',()=>B.with(...G.position,G.yaw,()=>{
  const joists=Array.from({length:13},(_,i)=>-H+.18+(2*H-.36)*i/12);
  for(const z of[-.96,0,.96])B.emit(archMember208({z,depth:.26,notches:joists}),'darkwood');
  for(const side of[-1,1]){
   B.emit(archMember208({z:side*1.105,depth:.050,top:x=>D(x)-.025,bottom:x=>D(x)-.135}),'red');
   B.emit(archMember208({z:side*1.098,depth:.042,top:x=>D(x)-.462,bottom:x=>D(x)-.522}),'wood');
  }
  for(const x of joists)B.emit(curvedCrossbeam208(x-.072,x+.072,-1.105,1.105,a=>D(a)-.17,a=>D(a)-.29,'structure208-closed-cross-joist-on-matching-seats'),'wood');
  // Closed deck boards bear directly on seated joists and the un-notched
  // upper stringer faces. Real seams follow the transverse board direction.
  for(let i=0;i<57;i++){const a=-H+2*H*i/57+.0012,b=-H+2*H*(i+1)/57-.0012;B.emit(curvedCrossbeam208(a,b,-1.09,1.09,D,x=>D(x)-.17,'structure208-closed-transverse-deck-plank'),'wood',0,0,0,1,1,1,0,.93+.07*Math.sin(i*.8));}
  const tie=bronzeTie208();B.resources.add(tie);
  const cap=new T.LatheGeometry([[0,0],[.103,0],[.103,.018],[.071,.028],[.068,.075],[.093,.115],[.089,.158],[.066,.195],[.031,.221],[.022,.251],[0,.270]].map(p=>new T.Vector2(...p)),40);B.resources.add(cap);
  const headMaterial=B.m.hardwareBronze131??B.m.bronze;
  for(const side of[-1,1]){
   for(const [height,h,d]of[[.91,.108,.135],[.48,.095,.102],[.16,.100,.100]])B.emit(archMember208({z:side*1.085,depth:d,top:x=>D(x)+height+h/2,bottom:x=>D(x)+height-h/2}),'redLight');
   for(let i=0;i<=8;i++){
    const x=-H+2*H*i/8,y=D(x),z=side*1.085,major=i%2===0;
    B.box(x,y+.475,z,major?.168:.121,.950,major?.168:.121,'red');
    // The bent, closed strap lies against the post face and turns down onto
    // the arch girder. It is hardware carrying the post, not a gold rosette.
    B.emit(tie,headMaterial,x,y,0,1,1,side);
    for(const [yy,zz]of[[.13,1.179],[-.31,1.111]])B.emit(new T.CylinderGeometry(.017,.017,.009,16).rotateX(Math.PI/2),headMaterial,x,y+yy,side*zz);
    if(major){B.box(x,y+.967,z,.204,.025,.204,headMaterial);B.emit(cap,headMaterial,x,y+.979,z);B.emit(new T.TorusGeometry(.072,.004,6,32),'goldDark',x,y+1.045,z,1,1,1,[Math.PI/2,0,0]);}
   }
  }
  // A fitted transverse bent receives all three arch girders. Its curved
  // bearing face shares the exact girder underside; no long floating blocks.
  const bx=-.50,beamBottom=D(bx)-.735,plinthTop=.66-G.position[1],water=.13-G.position[1];
  B.emit(curvedCrossbeam208(bx-.22,bx+.22,-1.09,1.09,x=>D(x)-.53,()=>beamBottom,'structure208-fitted-central-bent-cap'),'wood');
  for(const side of[-1,1]){
   const z=side*.55,r=side>0?.27:.29;
   B.box(bx,(plinthTop+beamBottom)/2,z,r,beamBottom-plinthTop,r,side>0?'wood':'stone');
   B.box(bx,(water-.14+plinthTop)/2,z,.51,plinthTop-water+.14,.53,'stone');
   if(side>0){B.box(bx,plinthTop+.035,z,.285,.070,.285,'bronze');B.between([bx,beamBottom-.43,z],[bx,beamBottom+.01,side*.98],.105,.125,'wood');}
  }
  // Original bridge bearings remain at the same two end planes. The new
  // dry-laid seats meet the girder soffits, below separate level approach caps.
  for(const sign of[-1,1]){
   const end=sign*H,seat=D(end)-.53,base=.08-G.position[1];
   for(let row=0;row<6;row++)for(let k=0;k<3;k++)B.box(end+sign*.12,base+(row+.5)*(seat-base)/6,(k-1)*.70,.59,(seat-base)/6-.014,.69,'stone',0,.87+.07*Math.sin(row*1.1+k));
   for(const z of[-.96,0,.96])B.box(end,seat-.035,z,.45,.07,.40,'wood');
  }
 },G.scale));
 B.layout124??={};B.layout124.bridge208={revision:208,closedDeckAndThreeGirders:true,halfLappedJoists:13,originalEndSeatsRetained:true,handrailHeight:.91,centralBentTop:'exact curved girder underside',centralLegCentersLocal:[[-.50,.55],[-.50,-.55]],oversizedRosettesRemoved:true,actualPlan:PLAN208,visualAccepted:false};
}

function uvPoly208(poly){return poly.map(([u,v])=>{const p=W(u,v);return[p.x,p.z];});}
function block208(B,poly,lo,hi,mat,name){if(hi>lo)B.emit(prism124(poly,lo,hi,name),mat);}
function uvBlock208(B,a,b,c,d,lo,hi,mat,name){block208(B,uvPoly208([[a,c],[b,c],[b,d],[a,d]]),lo,hi,mat,name);}
export function buildCourt208(B){
 B.label('structure208-bearing-bridge-landings-and-turning-stair-route',()=>{
  uvBlock208(B,H,E,-1.10,1.10,.05,eastY-.065,'stone','structure208-east-end-landed-masonry');
  uvBlock208(B,H,E,-1.10,1.10,eastY-.065,eastY,'stoneLight','structure208-east-level-turning-landing');
  uvBlock208(B,westU,-H,-1.10,1.10,.05,westY-.065,'stone','structure208-west-end-landed-masonry');
  uvBlock208(B,westU,-H,-1.10,1.10,westY-.065,westY,'stoneLight','structure208-west-level-landing');
  for(let i=0;i<3;i++){
   const a=-1.10-1.55*i/3,b=-1.10-1.55*(i+1)/3,y=eastY-.504*(i+1)/3;
   uvBlock208(B,H,E,b,a,.05,y-.055,'stone','structure208-north-flight-bearing-course');uvBlock208(B,H,E,b,a,y-.055,y,'stoneLight','structure208-north-flight-tread');
  }
  uvBlock208(B,H,E,backV,frontV,.05,turnY-.055,'stone','structure208-full-width-corner-landing-footing');uvBlock208(B,H,E,backV,frontV,turnY-.055,turnY,'stoneLight','structure208-full-width-corner-turn-landing');
  for(let i=0;i<3;i++){
   const t0=i/3,t1=(i+1)/3,poly=uvPoly208([[E+(endU(backV)-E)*t0,backV],[E+(endU(backV)-E)*t1,backV],[E+(endU(frontV)-E)*t1,frontV],[E+(endU(frontV)-E)*t0,frontV]]),y=turnY+(S.landingY-turnY)*t1;
   block208(B,poly,.05,y-.055,'stone','structure208-angled-flight-bearing-course');block208(B,poly,y-.055,y,'stoneLight','structure208-angled-tread-to-exact-court-boundary');
  }
  for(let i=0;i<10;i++){
   const a=-1.10-3.50*i/10,b=-1.10-3.50*(i+1)/10,y=westY+(1.69-westY)*(i+1)/10;
   uvBlock208(B,westU,-H,b,a,.05,y-.055,'stone','structure208-west-garden-flight-footing');uvBlock208(B,westU,-H,b,a,y-.055,y,'stoneLight','structure208-west-flight-rooted-into-back-bank');
  }
 });
 B.label('structure208-stair-forecourt-meeting-oblique-flight-foot',()=>{
  const poly=PLAN208.court;block208(B,poly,.25,2.045,'stone','structure208-solid-forecourt-bearing');
  for(let i=0;i<6;i++)for(let j=0;j<4;j++){
   const at=(u,v)=>foot.clone().addScaledVector(across,-1.90+3.80*u).addScaledVector(forward,1.95*v),u0=i/6+.0010,u1=(i+1)/6-.0010,v0=j/4+.0015,v1=(j+1)/4-.0015,p=[at(u0,v0),at(u1,v0),at(u1,v1),at(u0,v1)].map(q=>[q.x,q.z]);
   block208(B,p,2.045,2.10,'stoneLight','structure208-court-closed-cut-stone-flag');
  }
 });
 B.layout124??={};B.layout124.court208={revision:208,plan:PLAN208,continuousMasonryBelowAllTreads:true,exactHallStairFoot:S.bottom,stoneForecourtWidth:3.80,stoneForecourtDepth:1.95,oldRaisedPavingAndNarrowDisconnectedRouteRemoved:true,visualAccepted:false};
}

// Reuse actual source instances for structural views. Full reference, hero,
// low camera and movie never omit anything. Only these explicit inspections
// remove foliage/roof occlusion so bridge/ground/route contact can be reviewed.
export function renderStructure208(scene,renderView,kind='plan'){
 const hidden=[],copies=[],group=new T.Group();group.name='structure208-actual-instance-contact-inspection';scene.updateMatrixWorld(true);
 const keep=role=>role.startsWith('structure208-')||['garden-landforms','continuous-soil-bank-from-stair-to-pond','great-hall-stone-platform','layout124-connected-hall-flight-and-landing','layout124-pagoda-supported-ground'].includes(role);
 scene.traverse(o=>{if(!o.isMesh)return;hidden.push([o,o.visible]);o.visible=false;if(!o.isInstancedMesh||!o.userData.instanceRoles)return;
  const ids=o.userData.instanceRoles.flatMap((r,i)=>keep(r)?[i]:[]);if(!ids.length)return;
  const m=new T.InstancedMesh(o.geometry,o.material,ids.length),matrix=new T.Matrix4(),color=new T.Color();m.matrixAutoUpdate=false;m.matrix.copy(o.matrixWorld);m.name=o.name;m.castShadow=o.castShadow;m.receiveShadow=o.receiveShadow;
  ids.forEach((id,i)=>{o.getMatrixAt(id,matrix);m.setMatrixAt(i,matrix);if(o.instanceColor){o.getColorAt(id,color);m.setColorAt(i,color);}});m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();group.add(m);copies.push(m);
 });
 const position=kind==='plan'?[-1,18,1.8]:[4.4,3.7,3.6],target=kind==='plan'?[-1,0,-2.8]:[-1.6,2.1,-2.1],fov=kind==='plan'?61:62;scene.add(group);
 try{return{...renderView(position,target,0,fov),inspection:{revision:208,kind:'actual-3D-'+kind+'-structural-contact-view',omitted:'Plants, water, sky, roofs and unrelated meshes only in this explicit view; all retained geometry/matrices/materials are the original actual source instances.',position,target,fov,instances:copies.reduce((s,m)=>s+m.count,0),visualAccepted:false}};}
 finally{scene.remove(group);for(const [o,v]of hidden)o.visible=v;for(const m of copies)m.dispose();}
}
