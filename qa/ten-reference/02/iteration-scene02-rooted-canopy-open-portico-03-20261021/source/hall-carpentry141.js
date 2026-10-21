import {T,V} from './kernel.js';

// Authored solid timber and cast fittings, in the hall's structural coordinates.
// The heads follow column -> abacus -> arms -> bearing blocks -> purlins.
// Gold belongs to exposed metal faces; the load-bearing surfaces remain wood.
export function createHallCarpentry141({b,mats}){
 const counts={primaryHeads:0,intermediateHeads:0,sideHeads:0,bearingBlocks:0,carvedBeamEnds:0,transomBays:0};
 mats.hallBearing=mats.cedar.clone();mats.hallBearing.name='scene02-hall-aged-bearing-timber';mats.hallBearing.color.setHex(0x492816);mats.hallBearing.roughness=.65;
 mats.hallOxide=mats.red.clone();mats.hallOxide.name='scene02-hall-recessed-oxide-lacquer';mats.hallOxide.color.setHex(0x612c19);mats.hallOxide.roughness=.47;
 mats.hallPlaster=new T.MeshStandardMaterial({name:'scene02-hall-warm-lime-infill',color:0xb7aa8a,roughness:.91,metalness:0});
 const armShape=new T.Shape();
 armShape.moveTo(-1,-.025);armShape.lineTo(-1,.11);armShape.bezierCurveTo(-.91,.27,-.84,.28,-.76,.23);armShape.quadraticCurveTo(-.66,.11,-.51,.115);armShape.lineTo(.51,.115);armShape.quadraticCurveTo(.66,.11,.76,.23);armShape.bezierCurveTo(.84,.28,.91,.27,1,.11);armShape.lineTo(1,-.025);armShape.quadraticCurveTo(.79,-.12,.57,-.08);armShape.lineTo(-.57,-.08);armShape.quadraticCurveTo(-.79,-.12,-1,-.025);armShape.closePath();
 const arm=new T.ExtrudeGeometry(armShape,{depth:1,bevelEnabled:true,bevelSize:.016,bevelThickness:.015,bevelSegments:2,steps:1,curveSegments:8});arm.translate(0,0,-.5);
 const blockShape=new T.Shape();blockShape.moveTo(-.50,.13);blockShape.lineTo(.50,.13);blockShape.lineTo(.48,-.015);blockShape.lineTo(.32,-.13);blockShape.lineTo(-.32,-.13);blockShape.lineTo(-.48,-.015);blockShape.closePath();
 const block=new T.ExtrudeGeometry(blockShape,{depth:1,bevelEnabled:true,bevelSize:.015,bevelThickness:.01,bevelSegments:1,steps:1});block.translate(0,0,-.5);
 const endShape=new T.Shape();endShape.moveTo(-.28,-.11);endShape.lineTo(.12,-.11);endShape.bezierCurveTo(.38,-.10,.46,.09,.28,.23);endShape.bezierCurveTo(.16,.30,.02,.22,.09,.14);endShape.bezierCurveTo(.14,.08,.24,.12,.18,.16);endShape.lineTo(-.28,.12);endShape.closePath();
 const end=new T.ExtrudeGeometry(endShape,{depth:.15,bevelEnabled:true,bevelSize:.014,bevelThickness:.008,bevelSegments:2,curveSegments:10});end.translate(0,0,-.075);
 const petal=new T.Shape();petal.moveTo(0,-.06);petal.bezierCurveTo(-.12,-.025,-.10,.09,0,.17);petal.bezierCurveTo(.10,.09,.12,-.025,0,-.06);petal.closePath();
 const reliefLeaf=new T.ExtrudeGeometry(petal,{depth:.016,bevelEnabled:true,bevelSize:.007,bevelThickness:.005,bevelSegments:1,curveSegments:5});
 function rosette(x,y,z,r=.14){
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;b.put(reliefLeaf,'oldgold',[x+Math.cos(a)*r*.42,y+Math.sin(a)*r*.42,z],[r*2.0,r*1.50,.8],[0,0,a-Math.PI/2]);}
  b.ball(x,y,z+.028,r*.18,r*.18,.025,'gold');
 }
 function facePlate(x,y,z,w=.46,h=.23){
  b.box(x,y,z,w,h,.025,'oldgold');
  for(const sign of[-1,1]){b.box(x+sign*w*.46,y,z+.016,.016,h*.92,.013,'gold');b.box(x,y+sign*h*.43,z+.016,w*.92,.014,.013,'gold');}
  rosette(x,y,z+.019,Math.min(w,h)*.43);
 }
 function bearing(x,y,z,w=.38,d=.32,ma='hallBearing'){
  b.put(block,ma,[x,y,z],[w,1,d]);counts.bearingBlocks++;
 }
 function cloudEnd(x,y,z,yaw=0,s=1){
  b.at([x,y,z],yaw,()=>{
   b.put(end,'hallBearing',[0,0,0],[s,s,s]);
   b.tube([[-.22,.095,.086],[-.02,.105,.086],[.14,.16,.086],[.25,.16,.086],[.29,.10,.086],[.22,.045,.086],[.13,.065,.086]],.011,'oldgold',24);
   b.put(reliefLeaf,'oldgold',[-.12,.01,.087],[.55,.55,.5],[0,0,-.7]);
  });counts.carvedBeamEnds++;
 }
 function head(x,y,z,s=1,kind='primary',yaw=0){
  b.at([x,y,z],yaw,()=>{
   b.box(0,-.10,0,.71,.20,.72,'hallBearing');
   b.box(0,.025,0,.91,.09,.88,'hallOxide');
   const stages=kind==='inner'?2:3;
   for(let k=0;k<stages;k++){
    const yy=.12+k*.265,span=.64+k*.23,out=.10+k*.44;
    // The lower transverse arm crosses the long outward arm in a housed joint.
    b.put(arm,k%2?'hallBearing':'hallOxide',[0,yy,out],[span,1,.25]);
    b.put(arm,'hallBearing',[0,yy+.095,out-.12],[.66+k*.20,1,.26],[0,Math.PI/2,0]);
    for(const sign of[-1,1]){
     bearing(sign*span*.76,yy+.255,out,.34+k*.035,.34);
     bearing(0,yy+.255,out+sign*(.48+k*.12),.32,.35);
     if(k!==1)facePlate(sign*span*.77,yy+.235,out+.183,.27,.17);
    }
    // Small dark open intervals remain between the blocks and the next arm.
    b.box(0,yy+.24,out,.27,.24,.32,'hallOxide');
    if(k===2){cloudEnd(-span+.10,yy+.04,out+.17,Math.PI,.65);cloudEnd(span-.10,yy+.04,out+.17,0,.65);}
   }
   const top=.12+(stages-1)*.265;
   b.box(0,top+.37,.56+(stages-1)*.20,.38,.18,1.76+(stages-1)*.20,'hallBearing');
   cloudEnd(0,-.19,.44,Math.PI/2,.75);
  },s);
  if(kind==='primary'||kind==='inner')counts.primaryHeads++;else if(kind==='side')counts.sideHeads++;else counts.intermediateHeads++;
 }
 function transomBay(x,y,z,width){
  // Small recessed lime panels sit above a separately carved lintel. The lime
  // surfaces have thickness and visible dark reveals, never luminous paper.
  for(const sign of[-1,1]){
   b.box(x+sign*width*.26,y+.11,z-.17,width*.42,.29,.10,'hallPlaster');
   b.box(x+sign*width*.49,y+.10,z,.075,.39,.23,'hallOxide');
  }
  b.box(x,y+.10,z-.01,.16,.40,.24,'hallOxide');
  for(const h of[-.13,.32])b.box(x,y+h,z,width+.16,.085,.28,'hallOxide');
  b.box(x,y-.34,z-.02,width,.31,.055,'darkwood');
  for(const sign of[-1,1])b.box(x,y-.34+sign*.18,z,width+.15,.07,.29,'hallBearing');
  const stems=[-1,1];
  for(const sign of stems){
   const path=[];
   for(let i=0;i<=32;i++){const t=i/32;path.push([x+sign*(.12+(width*.43-.12)*t),y-.33+.075*Math.sin(t*Math.PI*2.2),z+.025]);}
   b.tube(path,.019,'oldgold',36);
   for(let k=0;k<5;k++){const t=(k+.5)/5,px=x+sign*(.12+(width*.43-.12)*t),py=y-.33+.075*Math.sin(t*Math.PI*2.2);b.put(reliefLeaf,k%3?'oldgold':'gold',[px,py,z+.03],[.58,.49,.8],[0,0,sign*(.62+(k%2)*1.5)]);}
  }
  facePlate(x,y-.34,z+.035,.29,.25);counts.transomBays++;
 }
 function frontEave(axes){
  // The primary heads coincide with the columns. Mid-bay heads sit on the deep
  // continuous tie beam and carry the outer purlin through three stepped levels.
  b.box(0,7.58,4.72,17.35,.32,.59,'hallBearing');
  b.box(0,7.83,5.30,18.15,.24,.41,'hallOxide');
  for(let i=0;i<axes.length-1;i++)head((axes[i]+axes[i+1])/2,7.94,5.55,.78,'intermediate');
  for(const [z,y,w] of[[6.40,8.50,18.8],[7.35,8.79,19.8],[8.15,9.01,20.8]]){
   b.box(0,y,z,w,.19,.24,'hallBearing');
   for(let x=-w/2+.25;x<w/2;x+=.48){b.box(x,y+.055,z+.16,.12,.14,.16,'hallOxide');if(Math.abs(z-7.35)<.1)facePlate(x,y-.015,z+.255,.085,.10);}
  }
  // Diagonal tails are real members extending back into the roof frame.
  for(const x of axes){b.line([x,8.22,5.30],[x,9.66,8.34],.18,'hallBearing',true,.24);b.box(x,8.68,7.05,.23,.24,2.72,'hallOxide');}
  // The east and west returns close the same structural ring at the corners.
  for(const sign of[-1,1]){
   for(let z=-5.55;z<=5.56;z+=1.45)head(sign*8.18,7.95,z,.80,'side',sign*Math.PI/2);
   for(const [x,y] of[[8.92,8.50],[9.80,8.78],[10.55,9.02]])b.box(sign*x,y,0,.24,.19,14.8,'hallBearing');
   for(let z=-6.4;z<6.5;z+=.74)b.line([sign*8.0,8.4,z],[sign*11.0,9.45,z],.16,'hallBearing',true,.20);
  }
 }
 return{head,transomBay,facePlate,cloudEnd,frontEave,stats:counts};
}
