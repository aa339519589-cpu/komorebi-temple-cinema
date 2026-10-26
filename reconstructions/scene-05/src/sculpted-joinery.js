import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {bearingWidth196} from './bearing-ends196.js';

// Actual solid profiles authored from the visible Ref05 corner silhouette.
// This replaces the old rectangular capital kit; no image or displacement
// sheet supplies any of the timber, chased end or ceramic mask geometry.
export function createSculptedJoinery(){
 const owned=new Set(),parts=[];
 const keep=g=>{owned.add(g);return g;};
 function extrude(shape,depth=.22,bevel=.012){const g=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:10,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2});g.translate(0,0,-depth/2);return keep(g);}
 function part(g,material='kit_cedar',position=[0,0,0],rotation=0,cornerOnly=false){const q=keep(g.clone());q.rotateY(rotation);q.translate(...position);parts.push({geometry:q,material,cornerOnly,cornerAxis:cornerOnly});return q;}
 function armUnderside(x,length){
  // Hijiki has a shallow central web and a deep, downturned outboard nose.
  // The former centre-heavy parabola became a staircase when stretched.
  const u=Math.abs(x)/(length/2),t=T.MathUtils.smoothstep(u,.43,.87);
  return -.090-.132*t+.010*Math.exp(-Math.pow((u-.94)/.07,2));
 }
 function profileLoop220(shape){
  const poly=[];for(const q of shape.getPoints())if(!poly.length||q.distanceTo(poly.at(-1))>1e-8)poly.push(q.clone());
  if(poly[0].distanceTo(poly.at(-1))<1e-8)poly.pop();
  let changed=true;while(changed){changed=false;for(let i=0;i<poly.length;i++){
   const a=poly[(i+poly.length-1)%poly.length],b=poly[i],c=poly[(i+1)%poly.length],ab=b.clone().sub(a),bc=c.clone().sub(b);
   if(Math.abs(ab.x*bc.y-ab.y*bc.x)<1e-10&&ab.dot(bc)>0){poly.splice(i,1);changed=true;break;}
  }}return poly;
 }
 function insetLoop220(poly,distance){
  const clockwise=T.ShapeUtils.isClockWise(poly),inward=(a,b)=>{const d=b.clone().sub(a).normalize();return clockwise?new T.Vector2(d.y,-d.x):new T.Vector2(-d.y,d.x);};
  return poly.map((b,i)=>{const n1=inward(poly[(i+poly.length-1)%poly.length],b),n2=inward(b,poly[(i+1)%poly.length]),m=n1.clone().add(n2).multiplyScalar(distance/Math.max(.15,1+n1.dot(n2)));return b.clone().add(m);});
 }
 function insetShape220(shape,distance){const s=new T.Shape(insetLoop220(profileLoop220(shape),distance));s.closePath();return s;}
 function arrisedProfile(shape,depth,arris=.009){
  // Actual quarter-round edge bands run from the full load-bearing outline
  // toward an inset face. The carved skin uses the SAME inset outline, so
  // it can no longer cover the geometric easing with a sharp full-size rim.
  const poly=profileLoop220(shape),clockwise=T.ShapeUtils.isClockWise(poly),inset=insetLoop220(poly,arris),rings=[];
  for(const sign of[-1,1])for(const i of(sign<0?[4,3,2,1,0]:[0,1,2,3,4])){
   const angle=i*Math.PI/8,points=insetLoop220(poly,arris*(1-Math.cos(angle))),z=sign*(depth/2-arris+arris*Math.sin(angle));rings.push({points,z});
  }
  const p=[],uv=[],ix=[],N=poly.length,last=(rings.length-1)*N;
  for(const{points,z}of rings)for(const q of points){p.push(q.x,q.y,z);uv.push(q.x,q.y);}
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<N;i++){
   const a=j*N+i,b=j*N+(i+1)%N,c=a+N,d=b+N;
   if(clockwise)ix.push(a,c,b,b,c,d);else ix.push(a,b,c,b,d,c);
  }
  for(const[a,b,c]of T.ShapeUtils.triangulateShape(inset,[])){
   const positive=(inset[b].x-inset[a].x)*(inset[c].y-inset[a].y)-(inset[b].y-inset[a].y)*(inset[c].x-inset[a].x)>0;
   ix.push(...(positive?[a,c,b]:[a,b,c]),...(positive?[a+last,b+last,c+last]:[a+last,c+last,b+last]));
  }
  const indexed=new T.BufferGeometry();indexed.setAttribute('position',new T.Float32BufferAttribute(p,3));indexed.setAttribute('uv',new T.Float32BufferAttribute(uv,2));indexed.setIndex(ix);
  const g=indexed.toNonIndexed();indexed.dispose();g.computeVertexNormals();g.userData.arrisMetres=arris;g.userData.arrisBands=4;return keep(g);
 }
 function curvedArm(length=1.30,notch='none',notchCentres=[0],width=.22,variant=0){
  const h=length/2,halfSlot=width/2,coords=[-h,h,...Array.from({length:81},(_,i)=>-h+length*i/80),...notchCentres.flatMap(x=>[x-halfSlot,x+halfSlot])].filter(x=>x>=-h&&x<=h).sort((a,b)=>a-b),xs=[...new Set(coords)],s=new T.Shape();
  const bottom=x=>armUnderside(x,length);
  const inSlot=x=>notchCentres.some(c=>Math.abs(x-c)<halfSlot-1e-8);
  for(let i=0;i<xs.length-1;i++){const yy=notch==='top'&&inSlot((xs[i]+xs[i+1])/2)?-.015:.1;i?s.lineTo(xs[i],yy):s.moveTo(xs[i],yy);s.lineTo(xs[i+1],yy);}
  for(let i=xs.length-2;i>=0;i--){const slot=notch==='bottom'&&inSlot((xs[i]+xs[i+1])/2),a=slot?-.015:bottom(xs[i+1]),b=slot?-.015:bottom(xs[i]);s.lineTo(xs[i+1],a);s.lineTo(xs[i],b);}s.closePath();
  const protectedX=Math.max(0,...notchCentres.map(Math.abs))+width/2+.025,carveDepth=.004,
    body=arrisedProfile(s,width-carveDepth*2,.012),caps=[];
  const setColor=(g,rgb)=>{const colors=new Float32Array(g.attributes.position.count*3);for(let k=0;k<g.attributes.position.count;k++)colors.set(rgb,k*3);g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g;};
  setColor(body,[.94,.90,.86]);
  const skin=insetShape220(s,.012);
  // True shallow pockets in each wide cheek: a finite wooden face layer
  // surrounds cut channels, with a darker complete wooden core4mm behind.
  // This produces carved recesses instead of a painted or raised wire motif.
  for(const sign of[-1,1]){
   const cut=new T.Shape();cut.moveTo(.12,.32);cut.bezierCurveTo(.29,.25,.40,.57,.61,.58);cut.bezierCurveTo(.87,.60,.91,.30,.71,.29);cut.bezierCurveTo(.55,.28,.55,.48,.70,.46);cut.lineTo(.70,.41);cut.bezierCurveTo(.62,.43,.62,.35,.71,.35);cut.bezierCurveTo(.83,.36,.79,.53,.62,.52);cut.bezierCurveTo(.41,.49,.31,.20,.12,.32);cut.closePath();
   const lower=new T.Shape();lower.moveTo(.23,.18);lower.bezierCurveTo(.43,.11,.56,.24,.77,.19);lower.quadraticCurveTo(.68,.29,.53,.23);lower.quadraticCurveTo(.36,.17,.23,.18);lower.closePath();
   const reeded=new T.Shape();reeded.moveTo(.13,.40);reeded.bezierCurveTo(.31,.31,.48,.48,.68,.39);reeded.quadraticCurveTo(.81,.33,.88,.37);reeded.bezierCurveTo(.72,.44,.63,.51,.47,.44);reeded.bezierCurveTo(.30,.37,.24,.47,.13,.40);reeded.closePath();
   const patterns=variant%3===0?[cut,lower]:[reeded,lower];
   for(const [index,pattern]of patterns.entries()){
    const points=pattern.getPoints(16).map(q=>{const x=sign*(protectedX+(h-protectedX-.018)*q.x),b=bottom(x),v=index===0?.44+(q.y-.44)*(variant%3===2?.48:.62):q.y;return new T.Vector2(x,b+v*(.1-b));});skin.holes.push(new T.Path(points));
   }
  }
  for(const sign of[-1,1]){
   const face=new T.ExtrudeGeometry(skin,{depth:carveDepth,steps:1,curveSegments:8,bevelEnabled:false});face.translate(0,0,sign>0?width/2-carveDepth:-width/2);setColor(face,[1,1,1]);keep(face);caps.push(face);
  }
  const g=keep(mergeGeometries([body,...caps].map(q=>q.index?q.toNonIndexed():q),false)),p=g.attributes.position;
  //190: the exposed cheek necks in three dimensions, beyond all lap and
  // bearing footprints. FlatY seats, slot widths and true cut ends stay fixed.
  const protectedVertices196=[];
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),e=Math.abs(x),u=T.MathUtils.clamp((e-protectedX)/(length/2-protectedX),0,1),neck=1-.10*Math.sin(Math.PI*u)**2,w=T.MathUtils.smoothstep(u,0,1),bottom=armUnderside(x,length),newBottom=bottom+.050*w+.070*Math.sin(Math.PI*u)**2,ny=(p.getY(i)-bottom)/(.1-bottom);
   if(e<=protectedX){protectedVertices196.push(i);continue;}
   // Only the free nose beyond every existing seat/lap changes. Its top
   // plane stays at+.1, its under-tip rises50mm, and its lower cheeks taper
   // toward a finite cut foot. All protected contact vertices remain exact.
   const y=newBottom+ny*(.1-newBottom),cutY=ny-.5,section=1+w*(bearingWidth196(cutY)-1);
   p.setY(i,y);p.setZ(i,p.getZ(i)*neck*section);
  }
  g.computeVertexNormals();g.userData.armProfile='361-retained-four-mm-recess-and-twelve-mm-carved-arrises';g.userData.protectedSeatHalfSpan=protectedX;g.userData.carvedCheek220={depthMetres:carveDepth,construction:'Closed wood core with real9mm quarter-round arrises; closed pierced face layers share its inset outline and reveal real4mm recesses on both wide cheeks',freeUndersideScoopMetres:.070};g.userData.freeTip196={underTipLift:.050,bottomWidthRatio:.76,protectedContactsUnchanged:true,protectedVertexIndices:protectedVertices196};return g;
 }
 function beam(length,depth,bottom,top,notches=[]){
  const xs=[-length/2,...notches.flatMap(n=>[n.x-n.width/2,n.x+n.width/2]),length/2].sort((a,b)=>a-b),s=new T.Shape();
  const topPoints=[],bottomPoints=[];
  for(let i=0;i<xs.length-1;i++){const mid=(xs[i]+xs[i+1])/2,n=notches.find(n=>n.side==='top'&&Math.abs(mid-n.x)<n.width/2),yy=n?n.y:top;topPoints.push([xs[i],yy],[xs[i+1],yy]);}
  for(let i=xs.length-2;i>=0;i--){const mid=(xs[i]+xs[i+1])/2,n=notches.find(n=>n.side==='bottom'&&Math.abs(mid-n.x)<n.width/2),yy=n?n.y:bottom;bottomPoints.push([xs[i+1],yy],[xs[i],yy]);}
  [...topPoints,...bottomPoints].forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return extrude(s,depth,.008);
 }
 function cushion(radius=.28,height=.12){
  //361: keep the original lower and upper seating envelopes. The visible
  // cove is a continuous closed timber section, with smooth vertical normals
  // on each of eight separate faces and hard normals at the clipped corners.
  // The former flat-shaded triangulated profile read as a stack of boards.
  const bevel=Math.min(.002,height*.07),foot=radius*.64,corner=Math.min(.0035,radius*.025),
   stations=[[.12,(foot+bevel)/radius],[.22,.625],[.34,.65],[.46,.73],[.59,.845],[.72,.94],[.81,.985],[.85,1]],
   profile=[[foot,0],[foot+bevel,bevel],[foot+bevel,height*.12]];
  const slope=stations.map((q,i)=>{if(i===0||i===stations.length-1)return 0;const a=(q[1]-stations[i-1][1])/(q[0]-stations[i-1][0]),b=(stations[i+1][1]-q[1])/(stations[i+1][0]-q[0]);return a*b<=0?0:Math.sign(a)*Math.min(Math.abs(a),Math.abs(b));});
  for(let k=0;k<stations.length-1;k++)for(let j=1;j<=5;j++){
   const t=j/5,t2=t*t,t3=t2*t,a=stations[k],b=stations[k+1],h=b[0]-a[0],
    r=(2*t3-3*t2+1)*a[1]+(t3-2*t2+t)*h*slope[k]+(-2*t3+3*t2)*b[1]+(t3-t2)*h*slope[k+1];
   profile.push([r*radius,(a[0]+h*t)*height]);
  }
  profile.push([radius,height-bevel],[radius-bevel,height]);
  const ring=r=>{const c=Math.min(corner,r*.05);return[[-r+c,-r],[r-c,-r],[r,-r+c],[r,r-c],[r-c,r],[-r+c,r],[-r,r-c],[-r,-r+c]];},p=[],uv=[],ix=[];
  for(let side=0;side<8;side++){
   const base=p.length/3;
   for(const[r,y]of profile)for(const index of[side,(side+1)%8]){const[x,z]=ring(r)[index];p.push(x,y,z);uv.push(x,z);}
   for(let j=0;j<profile.length-1;j++){const a=base+j*2,b=a+1,c=a+2,d=a+3;ix.push(a,c,b,b,c,d);}
  }
  for(const top of[false,true]){
   const[r,y]=profile[top?profile.length-1:0],base=p.length/3;p.push(0,y,0);uv.push(0,0);
   for(const[x,z]of ring(r)){p.push(x,y,z);uv.push(x,z);}
   for(let k=0;k<8;k++){const a=base+1+k,b=base+1+(k+1)%8;ix.push(...(top?[base,b,a]:[base,a,b]));}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
  g.userData.bearingBlock={kind:'closed-smooth-coved-clipped-square-dou361',radius,height,baseHalfWidth:foot,arrisMetres:bevel,capSideNormalsSeparated:true,planCornerNormalsSeparated:true,profile};return keep(g);
 }
 function carvedCorbel(){
  const s=new T.Shape();s.moveTo(-.19,0);s.lineTo(.19,0);s.lineTo(.19,.06);
  s.bezierCurveTo(.19,.12,.09,.14,.09,.20);s.bezierCurveTo(.09,.26,.19,.28,.19,.34);
  s.lineTo(-.19,.34);s.bezierCurveTo(-.19,.28,-.09,.26,-.09,.20);
  s.bezierCurveTo(-.09,.14,-.19,.12,-.19,.06);s.closePath();
  const g=extrude(s,.22,.006);g.userData.architectureJoint='scene05-curved-seated-corner-corbel';return g;
 }
 // Every course is carried by the actual crossing timbers below. The two
 // upper paired courses spread in PLAN as well as in length; receiver heights
 // are measured to their curved undersides. The final four seats meet the
 // .82 purlin datum used by the frame, without a stretched column capital.
 const bracketFittings=[],cornerFan=[],cornerFanFittings=[];
 function buildCourses(corner=false){
  // The photographed capital is a carpentered field of small sections,
  // rather than three equal chunky crosses. These are new closed timber
  // profiles and bearing footprints, while the post/purlin datums stay put.
  const lengths=corner?[.98,1.34,1.76]:[.90,1.24,1.62],widths=[.178,.168,.158],armY=.65,ys=[.0785,.350,.635],spreads=[0,.265,.420],fit=corner?cornerFanFittings:bracketFittings;
  const add=(g,pos=[0,0,0],rot=0,material='kit_cedar',role='bearing',cornerAxis=false)=>{
   g.userData.architectureJoint='scene05-three-step-'+role;
   if(corner)cornerFan.push({geometry:g,material,position:pos,rotation:rot,role,cornerAxis});else part(g,material,pos,rot,false);
  };
  add(cushion(.252,.17),[0,-.15,0],0,'kit_endwood','post-head-daito');
  for(let stage=0;stage<3;stage++){
   const length=lengths[stage],width=widths[stage],yy=ys[stage],off=spreads[stage],offsets=stage===0?[0]:[-off,off],slots=offsets;
   for(let axis=0;axis<2;axis++)for(const offset of offsets){
    const g=curvedArm(length,axis===0?'top':'bottom',slots,width,stage),pos=axis===0?[0,yy,offset]:[offset,yy,0],rot=axis*Math.PI/2;g.scale(1,armY,1);g.computeVertexNormals();
    add(g,pos,rot,'kit_cedar','half-lapped-ogee-hijiki');
    const tipBottom=armUnderside(length/2,length)+.050,tipCentre=(.1+tipBottom)/2,tipHeight=.1-tipBottom;
    for(const sign of[-1,1])fit.push({position:axis===0?[sign*(length/2+.004),yy+tipCentre*armY,offset]:[offset,yy+tipCentre*armY,sign*(length/2+.004)],yaw:axis===0?sign*Math.PI/2:(sign<0?Math.PI:0),width:width+.001,height:tipHeight*armY,stage,profile196:true});
    // The timber itself now carries the carved cloud channels. The former
    // repeated applied gold hook/leaf is deliberately absent here.
    // A real short hardwood drawbore dowel passes through the cheeks at
    // each bearing shoulder. Its small cut face breaks the repeated plates.
    for(const sign of[-1,1]){const pin=keep(new T.CylinderGeometry(.007,.007,width+.003,8));pin.rotateX(Math.PI/2);pin.translate(sign*(Math.max(...slots.map(Math.abs))+width*.60),-.012,0);add(pin,pos,rot,'kit_endwood','drawbored-bearing-shoulder');}
   }
   const base=yy+.100*armY;
   if(stage<2){
    const next=spreads[stage+1],old=spreads[stage],height=ys[stage+1]+armUnderside(old,lengths[stage+1])*armY-base;
    for(const sign of[-1,1])for(const side of(stage?[-1,1]:[0])){
     add(cushion(.105,height),[sign*next,base,side*old],0,'kit_endwood','measured-curved-underside-receiver');
     add(cushion(.105,height),[side*old,base,sign*next],0,'kit_endwood','measured-curved-underside-receiver');
    }
   }else for(const sign of[-1,1]){
    add(cushion(.118,.820-base),[sign*off,base,0],0,'kit_endwood','direct-roof-purlin-seat');
    add(cushion(.118,.820-base),[0,base,sign*off],0,'kit_endwood','direct-roof-purlin-seat');
   }
  }
  if(corner){
   // One diagonal sumigi receiver is specific to a corner. The two small
   // seats land at the true +/- .265 orthogonal upper-arm crossings; they
   // are not another superposed whole capital. The architectural caller
   // rotates this diagonal toward each corner's actual hip beam.
   const diagonalY=.1435+.09*.56,diagonalLength=1.46,diagonalWidth=.150,
     diagonal=curvedArm(diagonalLength,'none',[],diagonalWidth);
   diagonal.scale(1,.56,1);diagonal.computeVertexNormals();
   add(diagonal,[0,diagonalY,0],0,'kit_cedar','diagonal-hip-kneeler',true);
   const bearingBase=diagonalY+.10*.56,bearingTop=ys[1]+armUnderside(spreads[1],lengths[1])*armY;
   for(const sign of[-1,1])add(cushion(.082,bearingTop-bearingBase),[sign*spreads[1]*Math.SQRT2,bearingBase,0],0,'kit_cedar','diagonal-to-crossing-seat',true);
   const tipBottom=armUnderside(diagonalLength/2,diagonalLength)+.050;
   for(const sign of[-1,1])fit.push({position:[sign*(diagonalLength/2+.004),diagonalY+(.1+tipBottom)/2*.56,0],yaw:sign*Math.PI/2,width:diagonalWidth+.001,height:(.1-tipBottom)*.56,stage:0,profile196:true,cornerAxis:true});
  }
 }
 buildCourses(false);buildCourses(true);
 // The waist gallery has a compact single bearing, not a third full pagoda
 // roof capital. Its true .3868 head-to-purlin height is shared by the frame.
 const waistBearing=[],waistFittings=[];
 const waistPart=(geometry,position,rotation=0)=>waistBearing.push({geometry,material:'kit_cedar',position,rotation,role:'compact-waist-gallery-bearing'});
 waistPart(cushion(.285,.17),[0,-.15,0]);
 for(let axis=0;axis<2;axis++){
  const g=curvedArm(1.05,axis?'bottom':'top',[0]);g.scale(1,.72,1);g.computeVertexNormals();waistPart(g,[0,.0848,0],axis*Math.PI/2);
  const tipBottom=armUnderside(1.05/2,1.05)+.050,tipCentre=(.1+tipBottom)/2;
  for(const sign of[-1,1])waistFittings.push({position:axis?[0,.0848+tipCentre*.72,sign*.531]:[sign*.531,.0848+tipCentre*.72,0],yaw:axis?(sign<0?Math.PI:0):sign*Math.PI/2,width:.221,height:(.1-tipBottom)*.72,profile196:true});
 }
 for(const sign of[-1,1]){waistPart(cushion(.14,.08),[sign*.285,.1568,0]);waistPart(cushion(.14,.08),[0,.1568,sign*.285]);}
 // Narrow pierced acanthus collars fit the square post neck. Three paired
 // folded fronds replace the four-lobed square badge stretched vertically.
 const relief=[];const frame=new T.Shape();frame.moveTo(-.44,-.5);frame.lineTo(.44,-.5);frame.quadraticCurveTo(.5,-.5,.5,-.44);frame.lineTo(.5,.44);frame.quadraticCurveTo(.5,.5,.44,.5);frame.lineTo(-.44,.5);frame.quadraticCurveTo(-.5,.5,-.5,.44);frame.lineTo(-.5,-.44);frame.quadraticCurveTo(-.5,-.5,-.44,-.5);
 const inner=new T.Path();inner.moveTo(-.38,-.38);inner.lineTo(-.38,.38);inner.lineTo(.38,.38);inner.lineTo(.38,-.38);inner.closePath();frame.holes.push(inner);relief.push(extrude(frame,.075,.014));
 const leaf=new T.Shape();leaf.moveTo(.010,-.105);leaf.bezierCurveTo(.105,-.045,.320,-.085,.350,.045);leaf.bezierCurveTo(.390,.175,.225,.230,.180,.125);leaf.bezierCurveTo(.145,.050,.245,.010,.270,.070);leaf.bezierCurveTo(.247,.057,.225,.095,.255,.112);leaf.bezierCurveTo(.307,.135,.323,.052,.280,.024);leaf.bezierCurveTo(.190,-.010,.105,.065,.010,-.105);leaf.closePath();
 const leafG=extrude(leaf,.070,.009),lp=leafG.attributes.position;
 for(let i=0;i<lp.count;i++){const x=lp.getX(i),y=lp.getY(i),lift=.040*Math.max(0,1-Math.pow((x-.18)/.23,2))*Math.max(0,1-Math.pow((y-.03)/.23,2));lp.setZ(i,lp.getZ(i)+lift);}leafG.computeVertexNormals();
 leafG.scale(1,.80,1);
 for(const sign of[-1,1])for(const yy of[-.29,0,.29]){const q=keep(leafG.clone());if(sign<0)q.rotateZ(Math.PI);q.translate(0,yy,.065);relief.push(q);}
 const stem=new T.Shape();stem.moveTo(-.026,-.43);stem.bezierCurveTo(-.048,-.15,.046,.15,.026,.43);stem.lineTo(-.005,.43);stem.bezierCurveTo(.010,.15,-.071,-.15,-.056,-.43);stem.closePath();const stemG=extrude(stem,.038,.006);stemG.translate(0,0,.062);relief.push(stemG);
 for(let k=0;k<4;k++){const x=k%2?.41:-.41,y=k<2?-.41:.41;const q=new T.SphereGeometry(.034,10,6);q.translate(x,y,.062);relief.push(keep(q));}
 const normalize=g=>{const q=g.index?g.toNonIndexed():g.clone();for(const key of Object.keys(q.attributes))if(!['position','normal','uv'].includes(key))q.deleteAttribute(key);if(!q.attributes.uv)q.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(q.attributes.position.count*2),2));return q;};
 const endRelief=keep(mergeGeometries(relief.map(normalize),false));

 // Ceramic corner mask: pointed brow/eyes, a raised nose bridge and curled
 // bargeboard crest. The openings are actual recesses, not painted features.
 const mask=[];
 const backing=new T.Shape();backing.moveTo(-.23,-.13);backing.quadraticCurveTo(-.39,.03,-.29,.26);backing.bezierCurveTo(-.37,.35,-.32,.49,-.18,.48);backing.quadraticCurveTo(-.07,.46,0,.59);backing.quadraticCurveTo(.07,.46,.18,.48);backing.bezierCurveTo(.32,.49,.37,.35,.29,.26);backing.quadraticCurveTo(.39,.03,.23,-.13);backing.quadraticCurveTo(0,-.18,-.23,-.13);const backingG=extrude(backing,.09,.008);backingG.translate(0,0,-.055);mask.push({geometry:backingG,material:'slate'});
 const face=new T.Shape();face.moveTo(-.19,-.075);face.quadraticCurveTo(-.29,.08,-.23,.275);face.quadraticCurveTo(-.17,.40,0,.405);face.quadraticCurveTo(.17,.40,.23,.275);face.quadraticCurveTo(.29,.08,.19,-.075);face.quadraticCurveTo(0,-.13,-.19,-.075);
 for(const sx of[-1,1]){const h=new T.Path();h.moveTo(sx*.037,.246);h.lineTo(sx*.154,.230);h.quadraticCurveTo(sx*.138,.193,sx*.063,.204);h.closePath();face.holes.push(h);}
 const mouth=new T.Path();mouth.moveTo(-.11,.075);mouth.lineTo(.11,.075);mouth.quadraticCurveTo(.105,.025,.075,.025);mouth.lineTo(-.075,.025);mouth.quadraticCurveTo(-.105,.025,-.11,.075);mouth.closePath();face.holes.push(mouth);
 const faceG=extrude(face,.14,.012);faceG.translate(0,0,.07);mask.push({geometry:faceG,material:'slate'});
 const tube=(points,r,material='slate')=>{const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,8,false);mask.push({geometry:keep(g),material});};
 for(const sx of[-1,1]){
  const brow=new T.Shape();brow.moveTo(sx*.018,.278);brow.lineTo(sx*.072,.326);brow.quadraticCurveTo(sx*.145,.294,sx*.204,.248);brow.lineTo(sx*.184,.227);brow.lineTo(sx*.095,.272);brow.lineTo(sx*.035,.248);brow.closePath();const bg=extrude(brow,.038,.007);bg.translate(0,0,.165);mask.push({geometry:bg,material:'slate'});
  const horn=new T.Shape();horn.moveTo(sx*.155,.29);horn.bezierCurveTo(sx*.255,.295,sx*.31,.385,sx*.265,.472);horn.bezierCurveTo(sx*.238,.529,sx*.146,.542,sx*.14,.467);horn.bezierCurveTo(sx*.217,.49,sx*.223,.415,sx*.176,.392);horn.bezierCurveTo(sx*.126,.369,sx*.108,.326,sx*.155,.29);horn.closePath();const hg=extrude(horn,.085,.008);hg.translate(0,0,.028);mask.push({geometry:hg,material:'slate'});
  tube([[sx*.055,.13,.17],[sx*.145,.11,.175],[sx*.21,.15,.165],[sx*.165,.187,.155]],.013);
  const pupil=keep(new T.SphereGeometry(.009,10,6));pupil.scale(1,.8,.5);pupil.translate(sx*.092,.222,.146);mask.push({geometry:pupil,material:'oldgold'});
 }
 const bridge=new T.Shape();bridge.moveTo(-.017,.29);bridge.lineTo(.017,.29);bridge.quadraticCurveTo(.027,.195,.058,.142);bridge.lineTo(.029,.113);bridge.lineTo(-.029,.113);bridge.lineTo(-.058,.142);bridge.quadraticCurveTo(-.027,.195,-.017,.29);const ng=extrude(bridge,.067,.008);ng.translate(0,0,.175);mask.push({geometry:ng,material:'slate'});
 const crest=new T.Shape();crest.moveTo(-.055,.365);crest.quadraticCurveTo(-.078,.47,0,.565);crest.quadraticCurveTo(.078,.47,.055,.365);crest.closePath();const cg=extrude(crest,.075,.008);cg.translate(0,0,.015);mask.push({geometry:cg,material:'slate'});
 // Layered ceramic brow, cheek bosses and curled beard are sculptural depth,
 // not a flat black face shape. These catch the warm reflected courtyard
 // light at the same grazing angles as the photographed old gray ceramic.
 for(const sx of[-1,1]){
  const cheek=keep(new T.SphereGeometry(1,18,12));cheek.scale(.078,.058,.040);cheek.translate(sx*.177,.120,.188);mask.push({geometry:cheek,material:'slate'});
  tube([[sx*.031,.296,.204],[sx*.093,.333,.216],[sx*.175,.291,.205],[sx*.227,.235,.183]],.010);
  tube([[sx*.027,.317,.176],[sx*.081,.367,.180],[sx*.166,.334,.166],[sx*.214,.292,.157]],.007);
  tube([[sx*.232,.193,.160],[sx*.291,.123,.139],[sx*.265,.037,.145],[sx*.197,.027,.173],[sx*.173,.062,.194]],.012);
  tube([[sx*.202,-.075,.135],[sx*.275,-.103,.116],[sx*.284,-.147,.107],[sx*.241,-.158,.114],[sx*.225,-.129,.126]],.012);
 }
 for(let k=-2;k<=2;k++){
  const xx=k*.050,points=[];for(let j=0;j<=18;j++){const t=j/18,a=t*Math.PI*1.6,r=.028*(1-t*.55);points.push([xx+Math.sin(a)*r,-.080-t*.057+Math.cos(a)*r*.65,.174-t*.035]);}tube(points,.0065);
 }
 tube([[-.17,-.086,.185],[-.090,-.116,.210],[0,-.126,.222],[.090,-.116,.210],[.17,-.086,.185]],.011);
 for(const xx of[-.07,-.026,.026,.07]){const tooth=keep(new T.ConeGeometry(.009,.030,6));tooth.rotateZ(Math.PI);tooth.translate(xx,.056,.145);mask.push({geometry:tooth,material:'slate'});}
 return {bracket:parts,bracketFittings,cornerFan,cornerFanFittings,waistBearing,waistFittings,relief:endRelief,cornerMask:mask,sculpted:true,info:{source:'Scene05 r10: inset closed carved faces reveal real9mm quarter-round edges; true4mm recessed channels and hollowed ogee free lengths retain seated three-jump structure',cornerFan:{levels:3,orthogonalArms:10,diagonalKneelers:1,receivers:18,footprintM:[.98,1.34,1.76],sectionWidthsM:[.178,.168,.158],armVerticalFactor:.65,construction:'Independent closed small-section bowed arms; restrained shoulders derive from actual lap bounds, not a length heuristic. Corner-specific diagonal and two small seated crossings follow the real hip yaw. Upper flat seats retain the .820 purlin datum.'},waistGallery:{courses:1,headToPurlin:.3868,arms:2,receivers:4},bearingCorrection:'Old broad courses are preserved in the baseline receipt. New main capital dimensions and contacts are reconstruction hypotheses, not recovered historic joinery. Actual recessed wood channels replace applied generic gold leaves. New chased boots follow the retained cut planes; hardwood drawbore pegs remain on real shoulders.',guideRole:'Authored 3D curves and closed solids; no scene photograph, AI frame or displacement-guide replacement'},dispose(){for(const g of owned)g.dispose();}};
}
