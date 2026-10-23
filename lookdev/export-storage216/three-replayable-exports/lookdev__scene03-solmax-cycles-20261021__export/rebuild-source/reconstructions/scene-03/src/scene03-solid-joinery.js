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
 function curvedArm(length=1.30,notch='none'){
  const h=length/2,s=new T.Shape();s.moveTo(-h,.10);
  if(notch==='top'){s.lineTo(-.12,.10);s.lineTo(-.12,0);s.lineTo(.12,0);s.lineTo(.12,.10);}
  s.lineTo(h,.10);s.quadraticCurveTo(h+.025,.005,h-.09,-.015);
  s.bezierCurveTo(h-.22,-.01,h-.19,-.11,h-.30,-.115);
  s.bezierCurveTo(h-.42,-.12,.22,-.225,.12,-.225);
  if(notch==='bottom'){s.lineTo(.12,0);s.lineTo(-.12,0);s.lineTo(-.12,-.225);}else s.lineTo(-.12,-.225);
  s.bezierCurveTo(-.22,-.225,-h+.42,-.12,-h+.30,-.115);
  s.bezierCurveTo(-h+.19,-.11,-h+.22,-.01,-h+.09,-.015);
  s.quadraticCurveTo(-h-.025,.005,-h,.10);s.closePath();return extrude(s,.22,.012);
 }
 function beam(length,depth,bottom,top,notches=[]){
  const xs=[-length/2,...notches.flatMap(n=>[n.x-n.width/2,n.x+n.width/2]),length/2].sort((a,b)=>a-b),s=new T.Shape();
  const topPoints=[],bottomPoints=[];
  for(let i=0;i<xs.length-1;i++){const mid=(xs[i]+xs[i+1])/2,n=notches.find(n=>n.side==='top'&&Math.abs(mid-n.x)<n.width/2),yy=n?n.y:top;topPoints.push([xs[i],yy],[xs[i+1],yy]);}
  for(let i=xs.length-2;i>=0;i--){const mid=(xs[i]+xs[i+1])/2,n=notches.find(n=>n.side==='bottom'&&Math.abs(mid-n.x)<n.width/2),yy=n?n.y:bottom;bottomPoints.push([xs[i+1],yy],[xs[i],yy]);}
  [...topPoints,...bottomPoints].forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return extrude(s,depth,.008);
 }
 function cushion(radius=.28,height=.12){
  const p=[],uv=[],idx=[],levels=10,N=32;
  for(let j=0;j<=levels;j++){
   const t=j/levels,r=radius*(.64+.36*Math.sin(t*Math.PI/2)),y=height*t;
   for(let i=0;i<N;i++){const a=i/N*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),power=7,x=r*Math.sign(ca)*Math.pow(Math.abs(ca),2/power),z=r*Math.sign(sa)*Math.pow(Math.abs(sa),2/power);p.push(x,y,z);uv.push(i/N,t);}
  }
  for(let j=0;j<levels;j++)for(let i=0;i<N;i++){const a=j*N+i,b=j*N+(i+1)%N,c=(j+1)*N+i,d=(j+1)*N+(i+1)%N;idx.push(a,c,b,b,c,d);}
  p.push(0,0,0,0,height,0);uv.push(.5,.5,.5,.5);const lo=p.length/3-2,hi=lo+1;
  for(let i=0;i<N;i++){idx.push(lo,i,(i+1)%N);idx.push(hi,levels*N+(i+1)%N,levels*N+i);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return keep(g);
 }
 // Retained shaft/purlin contacts, with a rounded, flaring daito and genuinely
 // half-lapped first cross. Each later arm bears on a separate curved block.
 // .31*.64*1.04*1.15=.237 m: the foot seats on the retained .235m shaft.
 part(cushion(.31,.20),'kit_cedar',[0,-.15,0]);
 part(curvedArm(1.30,'top'),'kit_cedar',[0,.225,0]);part(curvedArm(1.30,'bottom'),'kit_cedar',[0,.225,0],Math.PI/2);
 for(const side of[-1,1]){part(cushion(.145,.055),'kit_cedar',[side*.40,.325,0]);part(cushion(.145,.055),'kit_cedar',[0,.325,side*.40]);}
 for(const side of[-1,1]){part(curvedArm(1.50),'kit_cedar',[side*.40,.60,0],Math.PI/2);part(curvedArm(1.50),'kit_cedar',[0,.60,side*.40]);}
 for(const sx of[-1,1])for(const sz of[-1,1])part(cushion(.14,.10),'kit_cedar',[sx*.40,.70,sz*.40]);
 for(const side of[-1,1])part(beam(1.54,.23,.80,.93,[{x:0,width:.24,side:'top',y:.865}]),'kit_cedar',[0,0,side*.40]);
 part(beam(1.52,.24,.865,.970,[-1,1].map(sign=>({x:sign*.40,width:.23,side:'bottom',y:.93}))),'kit_endwood',[0,0,0],Math.PI/2);
 // Actual raked ang at true corner posts only, between cross-arm and hip.
 const diagonal=curvedArm(2.02);const a=diagonal.attributes.position;
 for(let i=0;i<a.count;i++)a.setY(i,a.getY(i)+a.getX(i)*.22+.45);diagonal.computeVertexNormals();part(diagonal,'kit_cedar',[0,0,0],0,true);

 // Original bracket root is -.15 and its receiver is .82 above the group
 // datum. Compress only the new vertical profiles to those retained seats.
 const heightScale=.970/1.120;
 for(const part of parts){const p=part.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,(p.getY(i)+.15)*heightScale-.15);part.geometry.computeVertexNormals();}
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
 return {bracket:parts,relief:endRelief,cornerMask:mask,sculpted:true,info:{source:'Scene05 photo-anchored closed curve-profile timber, half laps, stepped cushions, raked corner ang, deep open foliate gilt and recessed ceramic mask',guideRole:'Authored 3D curves and solid profiles; no image-plane or displacement-guide replacement'},dispose(){for(const g of owned)g.dispose();}};
}
