import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Actual solid profiles authored from the visible Ref05 corner silhouette.
// This replaces the old rectangular capital kit; no image or displacement
// sheet supplies any of the timber, chased end or ceramic mask geometry.
export function createSculptedJoinery(){
 const owned=new Set(),parts=[];
 const keep=g=>{owned.add(g);return g;};
 function extrude(shape,depth=.22,bevel=.012){const g=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:10,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2});g.translate(0,0,-depth/2);return keep(g);}
 function part(g,material='kit_cedar',position=[0,0,0],rotation=0,cornerOnly=false){const q=keep(g.clone());q.rotateY(rotation);q.translate(...position);parts.push({geometry:q,material,cornerOnly,cornerAxis:cornerOnly});return q;}
 function curvedArm(length=1.30,notch='none',notchCentres=[0]){
  const h=length/2,halfSlot=.108,coords=[-h,h,...Array.from({length:65},(_,i)=>-h+length*i/64),...notchCentres.flatMap(x=>[x-halfSlot,x+halfSlot])].filter(x=>x>=-h&&x<=h).sort((a,b)=>a-b),xs=[...new Set(coords)],s=new T.Shape();
  const bottom=x=>{const u=Math.abs(x)/h;return -.290+.170*Math.pow(u,1.6)-.012*Math.exp(-Math.pow((u-.78)/.11,2));};
  const inSlot=x=>notchCentres.some(c=>Math.abs(x-c)<halfSlot-1e-8);
  for(let i=0;i<xs.length-1;i++){const yy=notch==='top'&&inSlot((xs[i]+xs[i+1])/2)?-.095:.1;i?s.lineTo(xs[i],yy):s.moveTo(xs[i],yy);s.lineTo(xs[i+1],yy);}
  for(let i=xs.length-2;i>=0;i--){const slot=notch==='bottom'&&inSlot((xs[i]+xs[i+1])/2),a=slot?-.095:bottom(xs[i+1]),b=slot?-.095:bottom(xs[i]);s.lineTo(xs[i+1],a);s.lineTo(xs[i],b);}s.closePath();
  return extrude(s,.24,.009);
 }
 function beam(length,depth,bottom,top,notches=[]){
  const xs=[-length/2,...notches.flatMap(n=>[n.x-n.width/2,n.x+n.width/2]),length/2].sort((a,b)=>a-b),s=new T.Shape();
  const topPoints=[],bottomPoints=[];
  for(let i=0;i<xs.length-1;i++){const mid=(xs[i]+xs[i+1])/2,n=notches.find(n=>n.side==='top'&&Math.abs(mid-n.x)<n.width/2),yy=n?n.y:top;topPoints.push([xs[i],yy],[xs[i+1],yy]);}
  for(let i=xs.length-2;i>=0;i--){const mid=(xs[i]+xs[i+1])/2,n=notches.find(n=>n.side==='bottom'&&Math.abs(mid-n.x)<n.width/2),yy=n?n.y:bottom;bottomPoints.push([xs[i+1],yy],[xs[i],yy]);}
  [...topPoints,...bottomPoints].forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return extrude(s,depth,.008);
 }
 function cushion(radius=.28,height=.12){
  // The old continuously bulging superellipse and shared cap normals made
  // these bearing blocks read as cushions. Keep their actual seat datums and
  // nominal envelope, with a short foot, planar tapered cheeks and a flat
  // upper bearing band. The2mm arrises are geometry, not a broad normal roll.
  const bevel=Math.min(.002,height*.07),foot=radius*.64,corner=Math.min(.0035,radius*.025);
  const profile=[[foot,0],[foot+bevel,bevel],[foot+bevel,height*.14],
   [radius*.70,height*.26],[radius*.96,height*.76],[radius,height*.85],
   [radius,height-bevel],[radius-bevel,height]];
  const p=[],uv=[],idx=[],N=8;
  for(const [r,y]of profile){const c=Math.min(corner,r*.05),ring=[[-r+c,-r],[r-c,-r],[r,-r+c],[r,r-c],[r-c,r],[-r+c,r],[-r,r-c],[-r,-r+c]];
   for(const [x,z]of ring){p.push(x,y,z);uv.push(x,z);}
  }
  for(let j=0;j<profile.length-1;j++)for(let i=0;i<N;i++){const a=j*N+i,b=j*N+(i+1)%N,c=(j+1)*N+i,d=(j+1)*N+(i+1)%N;idx.push(a,c,b,b,c,d);}
  p.push(0,0,0,0,height,0);uv.push(0,0,0,0);const lo=p.length/3-2,hi=lo+1;
  for(let i=0;i<N;i++){idx.push(lo,i,(i+1)%N);idx.push(hi,(profile.length-1)*N+(i+1)%N,(profile.length-1)*N+i);}
  const indexed=new T.BufferGeometry();indexed.setAttribute('position',new T.Float32BufferAttribute(p,3));indexed.setAttribute('uv',new T.Float32BufferAttribute(uv,2));indexed.setIndex(idx);
  const g=indexed.toNonIndexed();indexed.dispose();g.computeVertexNormals();
  g.userData.bearingBlock={kind:'closed-planar-tapered-clipped-square-dou',radius,height,baseHalfWidth:foot,arrisMetres:bevel,capSideNormalsSeparated:true,profile};
  return keep(g);
 }
 function carvedCorbel(){
  const s=new T.Shape();s.moveTo(-.19,0);s.lineTo(.19,0);s.lineTo(.19,.06);
  s.bezierCurveTo(.19,.12,.09,.14,.09,.20);s.bezierCurveTo(.09,.26,.19,.28,.19,.34);
  s.lineTo(-.19,.34);s.bezierCurveTo(-.19,.28,-.09,.26,-.09,.20);
  s.bezierCurveTo(-.09,.14,-.19,.12,-.19,.06);s.closePath();
  const g=extrude(s,.22,.006);g.userData.architectureJoint='scene05-curved-seated-corner-corbel';return g;
 }
 // Three real expanding courses occupy the fixed -.15 .. +.82 bearing
 // interval. The broadest arms are above the receivers, with genuine half
 // laps at every orthogonal crossing, not inverted stacks of broad slabs.
 const bracketFittings=[],cornerFan=[],cornerFanFittings=[];
 function buildCourses(corner=false){
  const lengths=corner?[1.06,1.54,2.05]:[1.00,1.34,1.70],ys=[.1982,.4694,.7406],fit=corner?cornerFanFittings:bracketFittings;
  const add=(g,pos=[0,0,0],rot=0,material='kit_cedar',role='bearing')=>{
   g.userData.architectureJoint='scene05-three-step-'+role;
   if(corner)cornerFan.push({geometry:g,material,position:pos,rotation:rot,role});else part(g,material,pos,rot,false);
  };
  add(cushion(.31,.18),[0,-.15,0],0,'kit_cedar','post-head-daito');
  for(let stage=0;stage<3;stage++){
   const length=lengths[stage],yy=ys[stage],offsets=stage===0?[0]:[-.31,.31],slots=stage===0?[0]:[-.31,.31];
   for(let axis=0;axis<2;axis++)for(const offset of offsets){
    const g=curvedArm(length,axis===0?'top':'bottom',slots);g.scale(1,.58,.80);g.computeVertexNormals();
    add(g,axis===0?[0,yy,offset]:[offset,yy,0],axis*Math.PI/2,'kit_cedar','half-lapped-paired-expanding-hijiki');
    for(const sign of[-1,1])fit.push({position:axis===0?[sign*(length/2+.018),yy-.0058,offset]:[offset,yy-.0058,sign*(length/2+.018)],yaw:axis===0?sign*Math.PI/2:(sign<0?Math.PI:0),width:.210,height:.148,stage});
   }
   const off=.31,base=[.2562,.5274,.7986][stage],height=stage===2?.0214:.0450;
   for(const sign of[-1,1]){add(cushion(stage===2?.17:.14,height),[sign*off,base,0],0,'kit_cedar','seated-receiver');add(cushion(stage===2?.17:.14,height),[0,base,sign*off],0,'kit_cedar','seated-receiver');}
  }
 }
 buildCourses(false);buildCourses(true);
 // Deep, open foliate metalwork. Full-depth apertures reveal the timber end;
 // this is not the prior flat image-guided flower boss scaled onto every end.
 const relief=[];const frame=new T.Shape();frame.moveTo(-.44,-.5);frame.lineTo(.44,-.5);frame.quadraticCurveTo(.5,-.5,.5,-.44);frame.lineTo(.5,.44);frame.quadraticCurveTo(.5,.5,.44,.5);frame.lineTo(-.44,.5);frame.quadraticCurveTo(-.5,.5,-.5,.44);frame.lineTo(-.5,-.44);frame.quadraticCurveTo(-.5,-.5,-.44,-.5);
 const inner=new T.Path();inner.moveTo(-.38,-.38);inner.lineTo(-.38,.38);inner.lineTo(.38,.38);inner.lineTo(.38,-.38);inner.closePath();frame.holes.push(inner);relief.push(extrude(frame,.075,.014));
 const leaf=new T.Shape();leaf.moveTo(0,0);leaf.bezierCurveTo(.22,.025,.35,.23,.13,.38);leaf.bezierCurveTo(-.04,.35,-.12,.17,0,0);
 const hole=new T.Path();hole.moveTo(.01,.09);hole.bezierCurveTo(-.03,.18,.01,.25,.11,.29);hole.bezierCurveTo(.21,.20,.15,.12,.01,.09);leaf.holes.push(hole);
 const leafG=extrude(leaf,.095,.010);
 for(let k=0;k<4;k++){const q=keep(leafG.clone());q.rotateZ(k*Math.PI/2);q.translate(0,0,.075);relief.push(q);}
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
 for(const xx of[-.07,-.026,.026,.07]){const tooth=keep(new T.ConeGeometry(.009,.030,6));tooth.rotateZ(Math.PI);tooth.translate(xx,.056,.145);mask.push({geometry:tooth,material:'slate'});}
 return {bracket:parts,bracketFittings,cornerFan,cornerFanFittings,relief:endRelief,cornerMask:mask,sculpted:true,info:{source:'Scene05 three expanding half-lapped timber bearing courses, actual separated receivers, true cut-plane cast copper fittings, pierced gilt and ceramic masks',cornerFan:{levels:3,arms:10,receivers:12,footprintM:[1.06,1.54,2.05],construction:'closed curved profiles; first orthogonal half lap and two paired expanding courses with complementary lap slots; all courses bear through four real seated receivers into the roof purlin'},bearingCorrection:'Closed planar tapered cushions are retained inside a fully rebuilt three-course paired bearing assembly, with direct receiver seats, complementary lap slots, smaller true end cuts and matching copper sleeves. Unseen historic joints and wear remain interpreted.',guideRole:'Authored 3D curves and solids; no image-plane or displacement-guide replacement'},dispose(){for(const g of owned)g.dispose();}};
}
