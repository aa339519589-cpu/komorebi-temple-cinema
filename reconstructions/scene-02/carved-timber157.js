import {T,V} from './kernel.js';
import {layout} from './layout117.js';
import {revolveProfile} from './sorin-solids.js';
import {createCarvedRosette170} from './carved-rosette170.js';

// Scene02 authored closed carving/support vocabulary. No raster or photographed
// relief is used. The same reproducible meshes serve the load-bearing heads,
// moulded receivers, pierced spandrels, cornice courses and seated gable.
export function createCarvedTimber157({b,mats}){
 const stats={revision:'scene02-monumental-fitted-ensemble161',closedPrototypeKinds:0,heads:0,carvedCapitals:0,cloudNoses:0,sculptedLeafInstances:0,corniceTiers:0,piercedSpandrels:0,gableBuilt:false,construction:'Closed sculpted timber arms, moulded bearing bowls, flared carved receivers and geometric gilded leaf/scroll relief; shared R22 seats and bearing grid',photoTexture:false};
 const sx=layout.hall.scale[0],sz=layout.hall.scale[2];
 const gold=mats.gold.clone();gold.name='scene02-carved-hall-worn-gilt157';gold.color.setRGB(.78,.53,.20);gold.roughness=.33;gold.metalness=.94;gold.envMap=null;mats.carvingGold157=gold;
 const bronze=mats.oldgold.clone();bronze.name='scene02-carved-hall-recessed-bronze157';bronze.color.setHex(0x96703e);bronze.roughness=.56;bronze.metalness=.66;bronze.envMap=null;mats.carvingBronze157=bronze;
 const dark=mats.darkwood.clone();dark.name='scene02-carved-openwork-shadow157';dark.color.setHex(0x27170f);dark.roughness=.8;mats.carvingRecess157=dark;
 const flower170=createCarvedRosette170({b});stats.carvedRosette170=flower170.stats;
 const prototypes=[];
 function record(g,name){g.name=name;prototypes.push(g);stats.closedPrototypeKinds++;return g;}
 function mirrorX(g,name){const c=g.clone();c.scale(-1,1,1);if(!c.index)c.setIndex(Array.from({length:c.attributes.position.count},(_,i)=>i));const a=c.index.array;for(let i=0;i<a.length;i+=3)[a[i+1],a[i+2]]=[a[i+2],a[i+1]];c.computeVertexNormals();return record(c,name);}
 function extruded(shape,depth,name,bevel=.012,steps=1){const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel*.75,bevelSegments:3,steps,curveSegments:12});g.translate(0,0,-depth/2);return record(g,name);}
 // Full volumetric lobed leaves: longitudinal closed rings, a fluted face,
 // central raised midrib, curled tip and a continuous thinner reverse surface.
 const leaf=(()=>{const R=30,N=16,p=[0,0,0],uv=[.5,0],ids=[],rings=[[0]];for(let j=1;j<R;j++){
  const t=j/R,w=.245*Math.pow(Math.sin(Math.PI*t),.72)*(.77+.23*Math.cos(t*Math.PI*3)**2),center=.015*Math.sin(Math.PI*t)+.025*t*t*t,ring=[];
  for(let k=0;k<N;k++){const a=k*Math.PI*2/N,q=Math.cos(a),top=Math.max(0,Math.sin(a)),bottom=Math.max(0,-Math.sin(a)),vein=.0035*Math.sin(t*Math.PI*5+Math.abs(q)*3.0)**2*top,depth=(.028*Math.pow(top,.62)+.012*Math.exp(-q*q/.055)*top+vein-.007*bottom)*Math.pow(Math.sin(Math.PI*t),.7);ring.push(p.length/3);p.push(w*q,t,center+depth);uv.push(k/N,t);}rings.push(ring);
 }rings.push([p.length/3]);p.push(0,1,.025);uv.push(.5,1);for(let j=0;j<rings.length-1;j++){const a=rings[j],c=rings[j+1];for(let k=0;k<N;k++){const n=(k+1)%N;if(a.length===1)ids.push(a[0],c[k],c[n]);else if(c.length===1)ids.push(a[k],c[0],a[n]);else ids.push(a[k],c[k],a[n],a[n],c[k],c[n]);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return record(g,'scene02-closed-fluted-acanthus-leaf157');})();
 // Sweep a closed chamfered section through a curved three-dimensional guide.
 // The section's x axis stays in the guide's XY carving plane, z is relief.
 function sweep(points,width,depth,name,taper=false){
  const curve=new T.CatmullRomCurve3(points.map(V)),R=Math.max(20,points.length*2),section=[[-.5,-.32],[-.36,-.5],[.36,-.5],[.5,-.32],[.5,.32],[.36,.5],[-.36,.5],[-.5,.32]],p=[],uv=[],ids=[],N=section.length;
  for(let j=0;j<=R;j++){const t=j/R,c=curve.getPoint(t),d=curve.getTangent(t),n=V([-d.y,d.x,0]).normalize(),s=taper?.57+.43*Math.sin(Math.PI*t)**.55:1;for(let k=0;k<N;k++){const [u,v]=section[k];p.push(c.x+n.x*u*width*s,c.y+n.y*u*width*s,c.z+v*depth*s);uv.push(t,k/N);}}
  for(let j=0;j<R;j++)for(let k=0;k<N;k++){const a=j*N+k,c=j*N+(k+1)%N;ids.push(a,c,a+N,c,c+N,a+N);}for(const j of[0,R]){const n=p.length/3,c=curve.getPoint(j/R);p.push(...c.toArray());uv.push(.5,.5);for(let k=0;k<N;k++){const a=j*N+k,c=j*N+(k+1)%N;j?ids.push(n,a,c):ids.push(n,c,a);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return record(g,name);
 }
 const volute=sweep(Array.from({length:49},(_,i)=>{const t=i/48,a=t*Math.PI*2.42,r=.24*(1-.79*t);return[-.13+.45*t+Math.cos(a)*r,Math.sin(a)*r,.022+.024*Math.sin(t*Math.PI)];}),.090,.072,'scene02-closed-tapered-foliated-volute157',true);
 const armShape=new T.Shape();armShape.moveTo(-1.04,.10);armShape.lineTo(-1.04,.24);armShape.bezierCurveTo(-.95,.37,-.83,.38,-.72,.24);armShape.bezierCurveTo(-.65,.16,-.54,.14,-.37,.16);armShape.lineTo(.37,.16);armShape.bezierCurveTo(.54,.14,.65,.16,.72,.24);armShape.bezierCurveTo(.83,.38,.95,.37,1.04,.24);armShape.lineTo(1.04,.10);armShape.quadraticCurveTo(.99,.035,.88,.06);armShape.bezierCurveTo(.79,.10,.79,-.08,.65,-.13);armShape.bezierCurveTo(.53,-.16,.40,-.14,.28,-.10);armShape.bezierCurveTo(.11,-.04,-.11,-.04,-.28,-.10);armShape.bezierCurveTo(-.40,-.14,-.53,-.16,-.65,-.13);armShape.bezierCurveTo(-.79,-.08,-.79,.10,-.88,.06);armShape.quadraticCurveTo(-.99,.035,-1.04,.10);armShape.closePath();const arm=extruded(armShape,.31,'scene02-closed-sculpted-cloud-lever157',.024);
 const receiverShape=new T.Shape();receiverShape.moveTo(-.50,.17);receiverShape.lineTo(.50,.17);receiverShape.quadraticCurveTo(.56,.09,.46,.015);receiverShape.lineTo(.34,-.035);receiverShape.bezierCurveTo(.35,-.17,.22,-.23,0,-.20);receiverShape.bezierCurveTo(-.22,-.23,-.35,-.17,-.34,-.035);receiverShape.lineTo(-.46,.015);receiverShape.quadraticCurveTo(-.56,.09,-.50,.17);receiverShape.closePath();const receiver=extruded(receiverShape,.44,'scene02-closed-flared-bearing-bowl157',.02);
 const noseShape=new T.Shape();noseShape.moveTo(-.36,-.17);noseShape.lineTo(-.36,.15);noseShape.bezierCurveTo(-.15,.12,-.02,.42,.20,.30);noseShape.bezierCurveTo(.45,.20,.37,-.07,.19,-.08);noseShape.bezierCurveTo(.04,-.13,.19,-.25,-.04,-.24);noseShape.quadraticCurveTo(-.23,-.20,-.36,-.17);noseShape.closePath();const nose=extruded(noseShape,.32,'scene02-closed-carved-cloud-nose157',.025);
 const noseLeft=mirrorX(nose,'scene02-closed-carved-cloud-nose-left157'),voluteLeft=mirrorX(volute,'scene02-closed-tapered-foliated-volute-left157');
 const capitalProfile=[[0,-.34],[.232,-.34],[.268,-.30],[.272,-.26],[.247,-.22],[.247,-.10],[.285,-.035],[.325,.035],[.349,.105],[.344,.17],[.294,.205],[0,.205]],collar=record(revolveProfile(capitalProfile,64,'scene02-closed-flared-column-receiver157'),'scene02-closed-flared-column-receiver157');
 const wrappedCapitalLeaves=(()=>{
  const surface=capitalProfile.filter(p=>p[0]>0),p=[],uv=[],idx=[],base=leaf.attributes.position;
  function radius(y){for(let i=0;i<surface.length-1;i++){const a=surface[i],c=surface[i+1];if(y>=a[1]&&y<=c[1])return T.MathUtils.lerp(a[0],c[0],(y-a[1])/(c[1]-a[1]));}return surface.at(-1)[0];}
  for(let j=0;j<14;j++){const off=p.length/3;for(let i=0;i<base.count;i++){const y=-.29+.43*base.getY(i),r=radius(y+.04),a=j*Math.PI*2/14+base.getX(i)*.52*sx/r,rr=r+base.getZ(i)*.42-.001;p.push(Math.sin(a)*rr/sx,y,Math.cos(a)*rr/sz);uv.push(...[leaf.attributes.uv.getX(i),leaf.attributes.uv.getY(i)]);}for(const n of leaf.index.array)idx.push(n+off);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return record(g,'scene02-closed-capital-surface-fitted-leaves159');
 })();
 const rim=record(revolveProfile([[.248,-.034],[.277,-.034],[.286,-.014],[.286,.014],[.277,.034],[.248,.034]],64,'scene02-closed-capital-chased-annulus157'),'scene02-closed-capital-chased-annulus157');
 const spandrelShape=new T.Shape();spandrelShape.moveTo(-1.10,0);spandrelShape.bezierCurveTo(-.79,.02,-.62,.12,-.47,.34);spandrelShape.bezierCurveTo(-.27,.65,-.15,.72,0,.66);spandrelShape.bezierCurveTo(.15,.72,.27,.65,.47,.34);spandrelShape.bezierCurveTo(.62,.12,.79,.02,1.10,0);spandrelShape.lineTo(1.10,-.12);spandrelShape.lineTo(-1.10,-.12);spandrelShape.closePath();
 for(const sign of[-1,1]){const hole=new T.Path();hole.moveTo(sign*.20,.19);hole.bezierCurveTo(sign*.23,.36,sign*.31,.44,sign*.40,.36);hole.bezierCurveTo(sign*.45,.27,sign*.52,.20,sign*.63,.15);hole.quadraticCurveTo(sign*.40,.12,sign*.20,.19);hole.closePath();const hp=hole.getPoints(12),outerClockwise=T.ShapeUtils.isClockWise(spandrelShape.getPoints(12));if(T.ShapeUtils.isClockWise(hp)===outerClockwise)hp.reverse();const orientedHole=new T.Path(hp);orientedHole.closePath();spandrelShape.holes.push(orientedHole);}const spandrel=extruded(spandrelShape,.18,'scene02-closed-pierced-cloud-spandrel157',.012);
 const shieldShape=new T.Shape();shieldShape.moveTo(-.5,.28);shieldShape.quadraticCurveTo(-.5,.48,-.28,.48);shieldShape.lineTo(.28,.48);shieldShape.quadraticCurveTo(.5,.48,.5,.28);shieldShape.lineTo(.5,-.22);shieldShape.bezierCurveTo(.30,-.22,.30,-.48,0,-.51);shieldShape.bezierCurveTo(-.30,-.48,-.30,-.22,-.5,-.22);shieldShape.closePath();const shield=extruded(shieldShape,.052,'scene02-closed-scalloped-cast-escutcheon157',.015);
 function leafAt(p,length=.45,width=.65,yaw=0,roll=0,material='carvingGold157',depth=1){b.put(leaf,material,p,[width,length,depth],[0,yaw,roll]);stats.sculptedLeafInstances++;}
 function scrollAt(p,s=.8,yaw=0,roll=0,material='carvingGold157'){b.put(volute,material,p,[s,s,s],[0,yaw,roll]);}
 function facePlate(x,y,z,w=.46,h=.23){
  const depthScale=Math.max(.06,Math.min(w,h)*.45),front=.03725*depthScale-.0005;b.put(shield,'carvingBronze157',[x,y,z],[w,h,depthScale]);
  for(const sign of[-1,1]){scrollAt([x+sign*w*.16,y-h*.015,z+front],Math.min(w*.74,h*1.23),sign<0?Math.PI:0,sign*.10);leafAt([x+sign*w*.19,y-h*.28,z+front],h*.58,w*.55,0,sign*-.62,'carvingGold157',h*.70);}
  leafAt([x,y-h*.28,z+front],h*.65,w*.44,0,0,'carvingGold157',h*.70);
 }
 function cloudEnd(x,y,z,yaw=0,s=1,mirror=false){b.at([x,y,z],yaw,()=>{const q=mirror?-1:1;b.put(mirror?noseLeft:nose,'hallBearing');b.put(mirror?voluteLeft:volute,'hallBearing',[-q*.01,.035,.171],[.88,.88,.88],[0,0,-q*.20]);leafAt([-q*.23,-.12,.175],.45,.67,0,-q*.55,'carvingBronze157',.45);leafAt([q*.15,-.13,.177],.36,.45,0,q*.57,'hallBearing',.40);},s);stats.cloudNoses++;}
 function bearing(x,y,z,w=.42,d=.36,material='hallBearing',ornament=true){b.put(receiver,material,[x,y,z],[w,1,d/.44]);if(ornament){leafAt([x,y-.16,z+d/2+.010],.25,w*.52,0,0,'carvingGold157',.35);for(const sign of[-1,1])scrollAt([x+sign*w*.20,y-.018,z+d/2+.010],w*.42,0,sign<0?Math.PI:0,'carvingBronze157');}}
 function capital(s=1){
  b.put(collar,'carvingBronze157',[0,-.04,0],[1/sx,1,1/sz]);b.put(rim,'carvingGold157',[0,-.30,0],[1/sx,1,1/sz]);b.put(rim,'carvingGold157',[0,.13,0],[1.22/sx,1,1.22/sz]);
  b.put(wrappedCapitalLeaves,'carvingGold157');stats.sculptedLeafInstances+=14;
  stats.carvedCapitals++;
 }
 function head(x,y,z,s=1,kind='primary',yaw=0){
  const stages=kind==='inner'?2:kind==='intermediate'?3:kind==='side'||kind==='rear'||kind==='tower'?4:5,primary=kind==='primary';
  b.at([x,y,z],yaw,()=>{
   if(primary){capital();flower170.stamp([0,-.06,.43],.40);}
   b.put(receiver,'hallBearing',[0,.12,0],[1.18,1,1.14/.44]);b.box(0,.29,0,1.28,.12,1.15,'hallOxide');
   for(let k=0;k<stages;k++){
    const yy=.40+k*.335,span=.56+k*.095,out=.14+k*.37;
    // Opposed curved levers cross in an actual housed joint. The receiver
    // bowls sit on the arm ends, rather than floating as rectangular pads.
    b.put(arm,k%2?'hallBearing':'hallOxide',[0,yy,out],[span,1,1]);
    b.put(arm,'hallBearing',[0,yy+.11,out-.035],[.53+k*.075,1,.92],[0,Math.PI/2,0]);
    for(const sign of[-1,1]){
     bearing(sign*span*.76,yy+.30,out,.38+k*.018,.34,'hallBearing',k===0||k===stages-1);
     bearing(0,yy+.375,out+sign*(.40+k*.075),.35,.34,'hallOxide',sign>0&&(k===0||k===stages-1));
     cloudEnd(sign*span*.86,yy+.055,out+.19,0,.48+k*.035,sign<0);
    }
    b.box(0,yy+.30,out,.25,.30,.31,'hallOxide');
    if(primary)facePlate(0,yy+.30,out+.160,.245,.275); // Fitted casting on the actual housed centre block.
    // Raised chased leaves follow the curved timber face, with dark edge
    // reveals. The load-bearing body remains wood through its full depth.
    for(const sign of[-1,1]){scrollAt([sign*span*.42,yy+.055,out+.184],.48+k*.025,0,sign<0?Math.PI:0,'hallBearing');leafAt([sign*span*.65,yy-.075,out+.192],.28,.40,0,-sign*.7,'carvingBronze157',.40);}
   }
   const top=.40+(stages-1)*.335,forward=.14+(stages-1)*.37;
   // Upper housed arm bears below the fixed purlin; its nose stops inside
   // the R22 apron, preserving the roof seat and the open inter-bay spaces.
   b.put(arm,'hallBearing',[0,top+.08,forward+.26],[.71,1,.88],[0,Math.PI/2,0]);bearing(0,top+.29,forward+.72,.40,.45,'hallBearing',true);
   if(primary)cloudEnd(0,-.22,.43,Math.PI/2,.72);
  },[s*(primary?1.40:kind==='inner'||kind==='intermediate'?1.30:1.12),s*(kind==='tower'?1:kind==='inner'?.78:kind==='side'?.78:.74),s*(primary||kind==='inner'||kind==='intermediate'?1.18:1.12)]);stats.heads++;
 }
 function spandrelAt(x,y,z,width){const scale=width/2.2;b.put(spandrel,'hallBearing',[x,y,z],[scale,1,1]);for(const sign of[-1,1]){scrollAt([x+sign*.47*scale,y+.19,z+.12],.72,0,sign<0?Math.PI:0,'carvingGold157');leafAt([x+sign*.73*scale,y+.04,z+.13],.43,.66,0,-sign*.65,'carvingBronze157',.65);leafAt([x+sign*.20*scale,y+.18,z+.14],.48,.66,0,sign*.46,'carvingGold157',.65);}leafAt([x,y+.05,z+.15],.48,.75,0,0,'carvingGold157',.6);stats.piercedSpandrels++;}
 function cornice(x,y,z,width,pitch=.48,endLift=0){
  // Closed receiver courses follow the actual curled apron section. Their
  // bedding strips meet the original rafter tails without moving the roof.
  const lift=xx=>endLift*Math.pow(Math.abs(xx)/(width/2),6),bend=g=>{const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+lift(p.getX(i)));g.computeVertexNormals();return g;};
  const beam=record(bend(new T.BoxGeometry(width,.19,.25,64,1,1)),'scene02-closed-bent-cornice-core157-'+stats.corniceTiers),bedding=record(bend(new T.BoxGeometry(width,.10,.19,64,1,1)),'scene02-closed-bent-rafter-bedding157-'+stats.corniceTiers);b.put(beam,'hallBearing',[x,y,z]);b.put(bedding,'hallBearing',[x,y+.15,z-.04]);
  const section=new T.Shape();section.moveTo(-.15,-.14);section.lineTo(.12,-.14);section.quadraticCurveTo(.22,-.08,.16,-.025);section.quadraticCurveTo(.12,.015,.21,.07);section.lineTo(.21,.12);section.lineTo(-.15,.12);section.closePath();const g=extruded(section,width,'scene02-closed-profiled-cornice157-'+stats.corniceTiers,.008,64);g.rotateY(-Math.PI/2);bend(g);b.put(g,'hallOxide',[x,y,z+.04]);
  const n=Math.floor(width/pitch);for(let i=0;i<=n;i++){const xx=-width/2+(i+.5)*width/(n+1),yy=y+lift(xx);b.put(nose,'hallBearing',[x+xx,yy+.04,z+.18],[.22,.28,.54]);facePlate(x+xx,yy+.014,z+.278,.105,.105);}
  stats.corniceTiers++;
 }
 function tail(x,y,z,length=2.55,width=.60){b.put(arm,'hallBearing',[x,y-.035,z],[length/2.08,.70,width/.31],[0,Math.PI/2,0]);cloudEnd(x,y-.015,z+length/2,0,.58);}
 function pendant(p,length=1,width=.95){
  b.at(p,0,()=>{leafAt([0,0,0],length,width,0,Math.PI,'carvingGold157',1);for(const sign of[-1,1]){leafAt([sign*.10,-.09,.025],length*.80,width*.68,0,Math.PI-sign*.45,'carvingGold157',.8);scrollAt([sign*.20,-.22,.07],width*.75,0,sign<0?Math.PI:0,'carvingBronze157');leafAt([sign*.28,-.32,.07],length*.46,width*.48,0,Math.PI-sign*.70,'carvingGold157',.75);}});
 }
 function gable(roof){
  const {gableWidth:w,gableEave:e,gableRise:r,gableFront:z,gableCenterX:cx}=roof;
  b.at([cx,0,0],0,()=>{
   // Full-depth boarded loft remains behind the pierced carved truss.
   for(let x=-w*.45;x<=w*.451;x+=.34){const t=Math.abs(x)/(w/2),top=e+r*Math.pow(1-t,1.28)+.38*Math.pow(t,8)-.24,bot=e+.32;if(top>bot)b.box(x,(top+bot)/2,z-.10,.325,top-bot,.12,'carvingRecess157',0,.85+.10*Math.sin(x*8.1)**2);}
   const curve=t=>[w/2*t,e+r*Math.pow(1-t,1.28)+.38*Math.pow(t,8)-.10,z+.125];
   for(const sign of[-1,1]){
    const points=Array.from({length:65},(_,j)=>{const p=curve(j/64);p[0]*=sign;return p;});
    // Deep continuous timber rake, narrow metal edge, and four fitted plate
    // groups. The solid wood remains visible between those applied castings.
    b.put(sweep(points,.40,.34,'scene02-closed-thick-timber-bargeboard160-'+sign),'hallOxide');
    b.put(sweep(points.map(p=>[p[0],p[1]+.08,p[2]+.18]),.060,.048,'scene02-closed-bargeboard-bead160-'+sign),'carvingGold157');
    for(const t of[.10,.34,.64,.89]){
     const p=curve(t),a=curve(t-.006),c=curve(t+.006);p[0]*=sign;const roll=Math.atan2(-(c[0]-a[0])*sign,c[1]-a[1]);
     b.at([p[0],p[1]-.12,z+.33],0,()=>{
      // A small closed geometric metal field follows the timber tangent.
      b.put(shield,'carvingBronze157',[0,0,0],[.49,.72,.30],[0,0,roll]);
      for(let i=0;i<7;i++){const q=i/6;leafAt([Math.sin(roll)*(.13+q*.29),-Math.cos(roll)*(.13+q*.29),.022],.28,.34,0,roll+(i%2?.67:-.67),'carvingGold157',.32);}
      for(const side of[-1,1])scrollAt([side*.13,-.05,.028],.35,0,roll+side*.28,'carvingGold157');
     });
    }
    // Twin curved struts have real seated ends at the collar and king post.
    b.put(sweep([[0,e+r-1.07,z+.05],[sign*w*.09,e+r*.64,z+.045],[sign*w*.20,e+1.55,z+.04],[sign*w*.34,e+.55,z+.04]],.22,.29,'scene02-closed-curved-loft-strut160-'+sign),'hallBearing');
   }
   b.box(0,e+.62,z+.02,w*.78,.22,.35,'hallOxide');b.box(0,e+1.72,z+.015,w*.48,.20,.30,'hallBearing');
   // Dense small raised stems and foliage occupy recessed coffer fields.
   // Every branch and leaf is seated on the same opaque backing panel.
   function floralField(x,py,pw,ph,seed){
    const face=z+.17;b.box(x,py,z+.03,pw,ph,.15,'carvingRecess157');
    for(const sign of[-1,1]){b.box(x+sign*pw/2,py,z+.13,.10,ph+.16,.25,'hallOxide');b.box(x,py+sign*ph/2,z+.13,pw+.08,.085,.25,'hallBearing');}
    b.tube([[x-pw*.42,py-.07,face],[x-pw*.19,py+.06,face+.01],[x,py-.03,face+.01],[x+pw*.20,py+.07,face],[x+pw*.42,py-.04,face]],.018,'carvingBronze157',40);
    for(const sign of[-1,1])for(let j=0;j<5;j++){
     const xx=x+sign*(.15+j*pw*.075),yy=py+.08*Math.sin(j*1.7+seed),dy=(j%2?1:-1)*ph*.30;
     b.tube([[xx,yy,face],[xx+sign*.08,yy+dy*.5,face+.016],[xx+sign*.15,yy+dy,face+.012]],.013,'carvingGold157',16);
     leafAt([xx+sign*.06,yy,face+.016],Math.min(.28,ph*.37),Math.min(.55,pw*.25),0,sign*(j%2?.62:2.3),'carvingGold157',.30);
     leafAt([xx+sign*.13,yy+dy*.44,face+.016],Math.min(.23,ph*.25),Math.min(.45,pw*.23),0,-sign*.7,'carvingBronze157',.26);
     if(j%2===0)scrollAt([xx,yy+dy*.50,face+.025],.24,0,sign<0?Math.PI:0,'carvingGold157');
    }
    for(let j=0;j<8;j++){const a=j*Math.PI/4;leafAt([x+Math.cos(a)*.11,py+Math.sin(a)*.11,face+.035],.24,.30,0,a-Math.PI/2,'carvingGold157',.28);}
    b.ball(x,py,face+.052,.043,.043,.018,'carvingBronze157');
   }
   for(const [i,x]of[-w*.22,0,w*.22].entries())floralField(x,e+1.02,w*.180,.64,i);
   // Upper paired fields sit well below the rake. Fine slats continue behind
   // the raised botanical carving, so the attic reads as an enclosed volume.
   for(const sign of[-1,1]){
    const px=sign*w*.112,py=e+r*.407,pw=w*.125,ph=r*.238;
    for(let j=0;j<9;j++)b.box(px+(j-4)*pw/9,py,z-.005,.035,ph,.12,'hallBearing');
    floralField(px,py,pw,ph,sign+4);
    b.put(shield,'carvingBronze157',[px,py-ph*.50-.12,z+.27],[.42,.33,.28]);
   }
   b.box(0,e+r*.49,z+.04,.20,r*.98,.28,'hallOxide');
   for(const yy of[e+.80,e+r*.47,e+r*.80]){
    b.box(0,yy,z+.215,.23,.26,.032,'carvingBronze157');
    for(const sign of[-1,1])leafAt([sign*.06,yy-.08,z+.235],.18,.24,0,-sign*.55,'carvingGold157',.22);
   }
   // Small plaques form a connected lower frieze rather than free curls.
   for(let j=0;j<31;j++){const x=-w*.36+j*w*.72/30;facePlate(x,e+.57,z+.22,.16,.12);}
   // Closed ridge-end cloud boss wraps the retained terminal seat. Its full
   // mass is below the existing R22 tip; no ridge/camera/roof points move.
   b.put(nose,'hallTile1542',[0,e+r+.18,z+.22],[.9,1.0,1.0],[0,0,-.26]);scrollAt([0,e+r+.20,z+.43],.78,0,-.25,'carvingGold157');leafAt([-.11,e+r-.18,z+.43],.62,.72,0,-.2,'carvingBronze157',.8);
  });
  // Roof corner ceramic/gilt crests are seated on the preserved hip end.
  for(const sign of[-1,1]){
   const p=[cx+sign*roof.roofWidth/2,roof.roofEave+roof.roofCurl,roof.roofFront];b.at(p,0,()=>{b.put(sign<0?noseLeft:nose,'hallTile1542',[0,.30,0],[.80,1.25,1.25],[0,0,sign*.12]);b.put(sign<0?noseLeft:nose,'hallTile1542',[-sign*.12,.64,-.15],[.44,.74,.80],[0,0,-sign*.35]);scrollAt([-sign*.03,.29,.20],.70,0,sign<0?Math.PI:0,'carvingGold157');leafAt([-sign*.21,.09,.25],.45,.61,0,-sign*.35,'carvingBronze157',.7);});
  }
  stats.gableBuilt=true;
 }
 return{head,facePlate,cloudEnd,bearing,spandrel:spandrelAt,cornice,leaf:leafAt,scroll:scrollAt,gable,tail,sweep,rosette:flower170.stamp,stats,prototypes};
}
