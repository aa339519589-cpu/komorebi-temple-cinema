import * as T from 'three';
import {carvedTimber197} from './natural-joinery197.js';
import {createSteppedReceiver213} from './garden-joinery213.js';

// HD08 supplies whole-frame proportions. All members are closed physical
// timber/stone/plaster solids; the photograph never enters a scene material.
const V=p=>new T.Vector3(...p),UP=V([0,1,0]);
const area=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2;
function metric(g){const raw=g.index?g.toNonIndexed():g;raw.name=g.name;raw.userData={...g.userData};const p=raw.attributes.position,uv=[];for(let i=0;i<p.count;i+=3){const a=V([p.getX(i),p.getY(i),p.getZ(i)]),b=V([p.getX(i+1),p.getY(i+1),p.getZ(i+1)]),c=V([p.getX(i+2),p.getY(i+2),p.getZ(i+2)]),n=b.sub(a).cross(c.sub(a));for(let j=i;j<i+3;j++)if(Math.abs(n.y)>Math.max(Math.abs(n.x),Math.abs(n.z)))uv.push(p.getX(j),p.getZ(j));else if(Math.abs(n.x)>Math.abs(n.z))uv.push(p.getZ(j),p.getY(j));else uv.push(p.getX(j),p.getY(j));}raw.setAttribute('uv',new T.Float32BufferAttribute(uv,2));raw.computeVertexNormals();if(raw!==g)g.dispose();return raw;}
function solid(poly,lo,hi,name){
 if(area(poly)<0)poly=[...poly].reverse();const p=[],ix=[],N=poly.length;for(const y of[lo,hi])for(const q of poly)p.push(q[0],typeof y==='function'?y(q):y,q[1]);
 for(const[a,b,c]of T.ShapeUtils.triangulateShape(poly.map(q=>new T.Vector2(...q)),[]))ix.push(a,c,b,a+N,b+N,c+N);for(let i=0;i<N;i++){const j=(i+1)%N;ix.push(i,j,i+N,j,j+N,i+N);}
 let volume=0;for(let i=0;i<ix.length;i+=3)volume+=V(p.slice(ix[i]*3,ix[i]*3+3)).dot(V(p.slice(ix[i+1]*3,ix[i+1]*3+3)).cross(V(p.slice(ix[i+2]*3,ix[i+2]*3+3))))/6;if(volume<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.name='374-closed-'+name;g.userData={corridor374:true,closedVolume:Math.abs(volume)};return metric(g);
}
const rect=(x0,x1,z0,z1)=>[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
const shortArmCache=new Map();
function shortArm(span,depth){
 const key=[span,depth].join('|');if(shortArmCache.has(key))return shortArmCache.get(key);const h=span/2,s=new T.Shape();s.moveTo(-h,.045);s.lineTo(h,.045);s.lineTo(h,.005);s.lineTo(h-.030,.005);s.lineTo(h-.030,-.015);s.bezierCurveTo(h*.55,-.020,h*.38,-.050,0,-.050);s.bezierCurveTo(-h*.38,-.050,-h*.55,-.020,-h+.030,-.015);s.lineTo(-h+.030,.005);s.lineTo(-h,.005);s.closePath();
 const g=carvedTimber197(s,depth,[[[-h+.045,.018],[-h*.45,-.015],[0,-.022],[h*.45,-.015],[h-.045,.018]]],'374-short-shallow-graduated-bearing-arm'),p=g.attributes.position,ix=g.index;let volume=0;for(let i=0;i<ix.count;i+=3)volume+=new T.Vector3().fromBufferAttribute(p,ix.getX(i)).dot(new T.Vector3().fromBufferAttribute(p,ix.getX(i+1)).cross(new T.Vector3().fromBufferAttribute(p,ix.getX(i+2))))/6;g.userData.closedVolume=Math.abs(volume);g.userData.shallowBracket374={span,depth,maximumProfileHeight:.095};shortArmCache.set(key,g);return g;
}

// A compact dou cluster remains at the column. A straight principal timber
// carries the rest of the projection; curves do not march out to the eave.
export function buildShallowEaveCarrier374({emit},{x,z,dx,dz,reach,headTop,roofY,ceilingAt}){
 if(![x,z,dx,dz,reach,headTop,roofY].every(Number.isFinite)||reach<.06)throw Error('Invalid374 eave carrier');
 const angle=Math.atan2(-dz,dx),end=[x+dx*reach,z+dz*reach],target=roofY-.32,top=roofY-.14,perp=[-dz,dx];let levels=0,clusterReach=0,minimumClearance=null;
 if(reach>.45){
  if(typeof ceilingAt!=='function')throw Error('374 principal carrier needs actual roof clearance');
  const clearance=n=>{const u0=n?Math.min(.32,reach*.28):0,plane=headTop+n*.18;let margin=Infinity;
   for(let j=0;j<=12;j++){const t=j/12,u=u0+(reach-u0)*t,y=plane+.14+(target-plane-.14)*t;for(const v of[-.08,0,.08]){const q=ceilingAt(x+dx*u+perp[0]*v,z+dz*u+perp[1]*v);if(Number.isFinite(q))margin=Math.min(margin,q-.14-y);}}
   if(n)for(let i=0;i<n;i++){const u=u0*(i+1)/n,span=.46+i*.06,depth=.16+i*.01,armTop=headTop+i*.18+.08,capTop=headTop+(i+1)*.18;for(const du of[-span/2,span/2])for(const v of[-depth/2,depth/2]){const q=ceilingAt(x+dx*(u+du)+perp[0]*v,z+dz*(u+du)+perp[1]*v);if(Number.isFinite(q))margin=Math.min(margin,q-.14-armTop);}for(const du of[-.11,.11])for(const v of[-.12,.12]){const q=ceilingAt(x+dx*(u+du)+perp[0]*v,z+dz*(u+du)+perp[1]*v);if(Number.isFinite(q))margin=Math.min(margin,q-.14-capTop);}}
   return margin;
  };
  minimumClearance=clearance(0);for(let n=1;n<=3;n++){const m=clearance(n);if(m>=.005){levels=n;minimumClearance=m;}}clusterReach=levels?Math.min(.32,reach*.28):0;
 }
 if(Number.isFinite(minimumClearance)&&minimumClearance<-.002)throw Error('374 principal timber intersects the actual roof');
 if(reach<=.45){emit(solid(rect(end[0]-.11,end[0]+.11,end[1]-.12,end[1]+.12),Math.min(headTop,target),top,'short-eave-receiver-directly-seated-on-head'),'hallReceiver213');return{end,receiverTop:top,levels:0,principalSpan:0,directHead:true,maximumCurvedSpan:0};}
 let plane=headTop;
 for(let i=0;i<levels;i++){const u=clusterReach*(i+1)/levels,px=x+dx*u,pz=z+dz*u,span=.46+i*.06;emit(shortArm(span,.16+i*.01),'hallArm213',px,plane+.035,pz,1,1,1,[0,angle,0]);emit(createSteppedReceiver213(.22,.10,.24,.72),'hallReceiver213',px,plane+.08,pz,1,1,1,[0,angle,0]);plane+=.18;}
 const root=[x+dx*clusterReach,z+dz*clusterReach],span=reach-clusterReach,poly=[[root[0]+perp[0]*.08,root[1]+perp[1]*.08],[end[0]+perp[0]*.08,end[1]+perp[1]*.08],[end[0]-perp[0]*.08,end[1]-perp[1]*.08],[root[0]-perp[0]*.08,root[1]-perp[1]*.08]],height=q=>{const u=((q[0]-root[0])*dx+(q[1]-root[1])*dz)/span;return plane+.14+(target-plane-.14)*u;};
 emit(solid(poly,q=>height(q)-.14,height,'straight-principal-eave-timber'),'hallBeam213');
 emit(solid(rect(end[0]-.11,end[0]+.11,end[1]-.12,end[1]+.12),target,top,'outer-eave-receiver-seated-on-straight-carrier'),'hallReceiver213');
 return{end,receiverTop:top,levels,principalSpan:span,directHead:false,maximumCurvedSpan:levels?.46+(levels-1)*.06:0,clusterProjection:clusterReach,sampledMinimumRoofClearance:minimumClearance};
}
const lintelCache=new Map();
function carvedLintel(width){const k=width.toFixed(4);if(lintelCache.has(k))return lintelCache.get(k);const h=width/2,s=new T.Shape();s.moveTo(-h,.10);s.lineTo(h,.10);s.lineTo(h,-.035);s.bezierCurveTo(h*.72,-.05,h*.57,-.24,h*.28,-.18);s.bezierCurveTo(h*.12,-.14,h*.10,-.065,0,-.09);s.bezierCurveTo(-h*.10,-.065,-h*.12,-.14,-h*.28,-.18);s.bezierCurveTo(-h*.57,-.24,-h*.72,-.05,-h,-.035);s.closePath();const g=carvedTimber197(s,.24,[[[-h+.07,.018],[-h*.54,-.052],[0,-.025],[h*.54,-.052],[h-.07,.018]]],'374-closed-load-seated-carved-door-lintel');lintelCache.set(k,g);return g;}

export function buildOccupiedCorridor374(api,{roofWorld,edgeWorld}){
 const {emit,box,group,between,lantern,lattice,spatial191,galleryJoinery}=api,a=[-2.09,-7.35],b=[2.24,-9.80],run=Math.hypot(b[0]-a[0],b[1]-a[1]),yaw=Math.atan2(-(b[1]-a[1]),b[0]-a[0]),c=Math.cos(yaw),s=Math.sin(yaw),origin=[(a[0]+b[0])/2,(a[1]+b[1])/2],grade=-1.30/run;
 const axes=Array.from({length:4},(_,i)=>-run*.46+i*run*.92/3),rows=[-.89,.84],contacts=[],columns=[],bays=[];
 const world=(x,z)=>[origin[0]+c*x+s*z,origin[1]-s*x+c*z],local=p=>{const dx=p[0]-origin[0],dz=p[2]-origin[1];return[c*dx-s*dz,p[1],s*dx+c*dz];};
 const eaveAnchors=axes.map(x=>{const W=world(x,.84);let p=edgeWorld[0];for(const q of edgeWorld)if(Math.hypot(q[0]-W[0],q[2]-W[1])<Math.hypot(p[0]-W[0],p[2]-W[1]))p=q;return{x,y:p[1],world:p};});
 const eave=x=>{let i=0;while(i<eaveAnchors.length-2&&x>eaveAnchors[i+1].x)i++;const a=eaveAnchors[i],b=eaveAnchors[i+1];return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);},legacyEave=x=>8.75+grade*x,floor=x=>4.45-.60*x/run,shaftTop=x=>eave(x)-.930,kitBase=x=>eave(x)-.670,kitTop=x=>eave(x)-.27;
 function shaft(x,z,r){const low=floor(x)+.20,top=shaftTop(x),height=top-low;if(height<1.6)throw Error('374 insufficient physical column height');const g=new T.LatheGeometry([[0,0],[r*.98,0],[r,.07*height],[r*1.035,.38*height],[r*.99,.80*height],[r*.95,height],[0,height]].map(q=>new T.Vector2(...q)),40);g.name='374-closed-entasis-corridor-shaft';const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getY(i),Math.atan2(p.getZ(i),p.getX(i))*r);emit(g,'hallLacquer213',x,low,z);emit(new T.CylinderGeometry(r*1.38,r*1.48,.20,32),'hallFoundation',x,floor(x)+.10,z);
  // The longitudinal girder occupies the open centre of the head receiver.
  // Separate front/back cheeks support the crossed bracket kit above it.
  for(const sign of[-1,1]){const z0=sign<0?z-.225:z+.112,z1=sign<0?z-.112:z+.225;emit(solid(rect(x-.225,x+.225,z0,z1),q=>shaftTop(q[0]),q=>shaftTop(q[0])+.18,'housed-column-head-cheek'),'hallReceiver213');}
  for(const part of galleryJoinery.parts)emit(part.geometry,part.material,x,kitBase(x),z,.55,.50,.55);
  columns.push({axis:[x,z],floor:floor(x),shaftTop:top,radius:r,headReceiverTop:top+.18,bracketTop:kitTop(x),weatherInterior:roofWorld(...world(x,z)),headFollowsOccupiedCornice:true});
 }
 group(origin[0],0,origin[1],yaw,()=>{
  // One continuous sloping floor, individual laid deck boards and seated
  // transverse sleepers replace the old three competing rows of uprights.
  emit(solid(rect(-run/2,run/2,-1.135,1.135),q=>floor(q[0])-.24,q=>floor(q[0])-.065,'continuous-carried-corridor-floor'),'hallBeam213');
  for(let i=0;i<28;i++){const x=-run/2+(i+.5)*run/28;emit(solid(rect(x-run/56+.003,x+run/56-.003,-1.115,1.115),q=>floor(q[0])-.065,q=>floor(q[0]),'individual-sloping-floor-board'),'hallBeam213');}
  for(const x of axes)for(const z of rows){const top=floor(x)-.24;box(x,(1.40+top)/2,z,.38,top-1.40,.42,'hallFoundation');shaft(x,z,z>0?.215:.19);}
  for(const z of rows)for(let i=0;i<axes.length-1;i++)emit(solid(rect(axes[i]+.002,axes[i+1]-.002,z-.11,z+.11),q=>shaftTop(q[0]),q=>shaftTop(q[0])+.18,'separate-sloping-girder-received-in-column-heads'),'hallBeam213');
  for(const x of axes){emit(solid(rect(x-.10,x+.10,rows[0]-.10,rows[1]+.10),kitTop(x),kitTop(x)+.10,'transverse-bearing-tie-seated-on-both-bracket-heads'),'hallBeam213');}
  for(let i=0;i<axes.length-1;i++){
   const x0=axes[i],x1=axes[i+1],x=(x0+x1)/2,fy=floor(x),clear=x1-x0-.36,header=shaftTop(x)-.44,doorTop=Math.max(fy+1.85,header-.18),doorWidth=clear-.04;
   // Deep real wall/door returns create occupied frontage. Only the middle
   // bay has open folded leaves; no opaque surface crosses that aperture.
   box(x,header+.19,.58,clear,.34,.20,'wall');for(const y of[header+.39,header-.015])box(x,y,.69,clear+.12,.11,.27,'hallBeam213');
   emit(carvedLintel(clear+.08),'hallLacquer213',x,doorTop+.055,.91);
   if(i===1)spatial191.portal({x,z:.46,lo:fy+.035,hi:doorTop,width:doorWidth,depth:1.12,jamb:.10,label:'374-occupied-upper-corridor-through-bay'});
   else{box(x,fy+.31,-.11,doorWidth,.51,.21,'hallLacquer213');lattice(x,(fy+.62+doorTop-.10)/2,-.02,doorWidth-.10,Math.max(1.05,doorTop-fy-.72));for(const sign of[-1,1])box(x+sign*(doorWidth/2+.04),(fy+doorTop)/2,.035,.105,doorTop-fy,.34,'hallLacquer213');}
   // The threshold is a real three-stone bed crossing the full jamb depth.
   for(let j=0;j<3;j++){const u0=x-doorWidth/2+doorWidth*j/3+.0015,u1=x-doorWidth/2+doorWidth*(j+1)/3-.0015;emit(solid(rect(u0,u1,-.70,.72),q=>floor(q[0])-.09,q=>floor(q[0])+.035,'seated-closed-stone-door-threshold'),'stone');}
   for(const z of[-.78,.20])emit(solid(rect(x0+.04,x1-.04,z-.065,z+.065),q=>shaftTop(q[0])-.03,q=>shaftTop(q[0])+.13,'deep-room-transverse-ceiling-ledger'),'hallBeam213');
   bays.push({axis:x,clearWidth:doorWidth,floor:fy,doorTop,wallDepth:.20,portalDepth:i===1?1.12:null,thresholdStones:3,openVolume:i===1});
  }
  // Query the actual OUTER eave. The retired receiver sampled the high hip
  // interior and grew a needle post toward the ridge above these bays.
  for(const x of axes){const start=[x,kitTop(x),.84],W=world(x,.84);let target=edgeWorld[0];for(const p of edgeWorld)if(Math.hypot(p[0]-W[0],p[2]-W[1])<Math.hypot(target[0]-W[0],target[2]-W[1]))target=p;const q=local(target),dx=q[0]-x,dz=q[2]-.84,reach=Math.hypot(dx,dz),rise=q[1]-.32-start[1],angle=Math.atan2(-dz,dx);if(reach<.10)throw Error('374 eave arm has no projection');
   const bearing=buildShallowEaveCarrier374({emit},{x,z:.84,dx:dx/reach,dz:dz/reach,reach,headTop:kitTop(x),roofY:q[1],ceilingAt:(X,Z)=>roofWorld(...world(X,Z))});
   contacts.push({column:[...W],headY:start[1],outerEave:target,receiverTop:q[1]-.14,actualRoofUnderside:q[1]-.14,reach,compactDouLevels:bearing.levels,principalStraightSpan:bearing.principalSpan,maximumCurvedSpan:bearing.maximumCurvedSpan,sampledMinimumRoofClearance:bearing.sampledMinimumRoofClearance??null,directHeadReceiver:bearing.directHead,oldInteriorWeather:roofWorld(...W),closedCantilever:true});
  }
  // The two established hanging fixtures retain their original positions.
  for(const x of[-run*.36,run*.36])lantern(x,legacyEave(x)-1.29,1.13,.30);
 });
 return{revision:'corridor374-r04',run,yaw,origin,eaveAnchors,frontAxes:axes,postRows:rows,columns,bays,roofContacts:contacts,floorRange:[floor(-run/2),floor(run/2)],mainRoofWeatherOutlineHeld:true,postHeadsFollowOuterCornice:true,retiredInteriorHipNeedlePosts:true,existingFixturePositionsHeld:true,photographicAccepted:false};
}

export function buildGrandAccess374({emit,box},floor){
 const count=7,base=3.70,run=1.80,rise=(floor-base)/count;
 emit(solid(rect(-2.10,1.30,-2.75,2.65),3.65,floor-.34,'recessed-grand-floor-bearing-core'),'hallFoundation');
 for(let i=0;i<count;i++){const x=1.48+(i+.5)*run/count,top=floor-i*rise;box(x,(base+top-.075)/2,-.60,run/count-.003,top-.075-base,1.40,'hallFoundation');emit(solid(rect(x-run/count/2-.025,x+run/count/2-.003,-1.30,.10),top-.075,top,'grand-hall-seated-cut-stone-access-flag'),'stone');}
 return{count,base,top:floor,run,riser:rise,tread:run/count,closedFlags:true};
}

export function buildLowerTransition374({emit,box}){
 const count=6,base=3.98,top=4.75,run=1.32,rise=(top-base)/count;
 for(let i=0;i<count;i++){const x=-.30+(i+.5)*run/count,y=top-i*rise;box(x,(base+y-.065)/2,0,run/count-.003,y-.065-base,1.16,'hallFoundation');emit(solid(rect(x-run/count/2-.023,x+run/count/2-.002,-.58,.58),y-.065,y,'upper-to-lower-seated-stone-transition'),'stone');}
 return{count,base,top,run,riser:rise,tread:run/count,closedFlags:true};
}
