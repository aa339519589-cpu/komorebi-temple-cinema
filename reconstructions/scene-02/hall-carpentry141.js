import {T,V} from './kernel.js';
import {createCarvedTimber157} from './carved-timber157.js';
import {buildCornerReceiver158} from './corner-receiver158.js';
import {buildMonumentalGable170} from './gable170.js';

// Authored solid timber and cast fittings, in the hall's structural coordinates.
// The heads follow column -> abacus -> arms -> bearing blocks -> purlins.
// Gold belongs to exposed metal faces; the load-bearing surfaces remain wood.
export function createHallCarpentry141({b,mats}){
 const counts={primaryHeads:0,intermediateHeads:0,sideHeads:0,bearingBlocks:0,carvedBeamEnds:0,transomBays:0};
 mats.hallBearing=mats.cedar.clone();mats.hallBearing.name='scene02-hall-aged-bearing-timber';mats.hallBearing.color.setHex(0x492816);mats.hallBearing.roughness=.65;
 mats.hallOxide=mats.red.clone();mats.hallOxide.name='scene02-hall-recessed-oxide-lacquer';mats.hallOxide.color.setHex(0x612c19);mats.hallOxide.roughness=.47;
 mats.hallColumnRed=mats.red.clone();mats.hallColumnRed.name='scene02-hall-deep-vermilion-shaft';mats.hallColumnRed.color.setHex(0x883426);mats.hallColumnRed.clearcoat=.34;mats.hallColumnRed.clearcoatRoughness=.19;
 mats.hallPlaster=new T.MeshStandardMaterial({name:'scene02-hall-warm-lime-infill',color:0xb7aa8a,roughness:.91,metalness:0});
 const carved=createCarvedTimber157({b,mats});
 const petal=new T.Shape();petal.moveTo(0,-.06);petal.bezierCurveTo(-.12,-.025,-.10,.09,0,.17);petal.bezierCurveTo(.10,.09,.12,-.025,0,-.06);petal.closePath();
 const reliefLeaf=new T.ExtrudeGeometry(petal,{depth:.016,bevelEnabled:true,bevelSize:.007,bevelThickness:.005,bevelSegments:1,curveSegments:5});
 function rosette(x,y,z,r=.14){
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;b.put(reliefLeaf,'oldgold',[x+Math.cos(a)*r*.42,y+Math.sin(a)*r*.42,z],[r*2.0,r*1.50,.8],[0,0,a-Math.PI/2]);}
  b.ball(x,y,z+.028,r*.18,r*.18,.025,'gold');
 }
 const facePlate=carved.facePlate,bearing=carved.bearing,cloudEnd=carved.cloudEnd;
 function head(x,y,z,s=1,kind='primary',yaw=0){carved.head(x,y,z,s,kind,yaw);if(kind==='primary'||kind==='inner')counts.primaryHeads++;else if(kind==='side'||kind==='rear')counts.sideHeads++;else counts.intermediateHeads++;}
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
 function frontEave(axes,roof){
  const cx=(axes[0]+axes.at(-1))/2,span=axes.at(-1)-axes[0],footY=roof.gableEave+.38;
  carved.stats.diagonalCorners=buildCornerReceiver158({b,carved,roof,axes});
  b.box(cx,8.13,4.72,span+1.75,.32,.59,'hallBearing');
  b.box(cx,8.38,5.30,span+2.55,.24,.41,'hallOxide');
  const bayWidth=span/5-.45;
  for(let i=0;i<axes.length-1;i++){
   const x=(axes[i]+axes[i+1])/2;head(x,8.45,5.55,.78,'intermediate');
   carved.spandrel(x,7.99,5.08,bayWidth);
  }
  // The three purlins follow the actual shallow apron section. Their arms
  // carry load back through short attic struts and the column-head cross ties.
  for(const t of[.20,.50,.78]){
   const z=T.MathUtils.lerp(roof.gableFront,roof.roofFront,t),w=T.MathUtils.lerp(roof.gableWidth,roof.roofWidth,t),y=T.MathUtils.lerp(footY,roof.roofEave,t)-.96*t*(1-t)+roof.roofCurl*Math.pow(t,8)*.22-.48;
   carved.cornice(cx,y,z,w,.48,roof.roofCurl*Math.pow(t,8)*.78);
  }
  for(const x of axes){
   b.line([x,8.73,5.30],[x,9.27,8.54],.18,'hallBearing',true,.24);b.box(x,9.04,7.05,.23,.24,2.72,'hallOxide');
   b.line([x,8.61,4.84],[x,footY-.39,roof.gableFront-.12],.19,'hallBearing',true,.23);
   bearing(x,9.14,6.20,.43,.44,'hallOxide',true);bearing(x,9.49,6.20,.43,.44,'hallBearing',true);
   cloudEnd(x,9.00,7.95,Math.PI/2,.72);
  }
  for(const sign of[-1,1]){
   const columnX=sign<0?axes[0]:axes.at(-1),innerX=roof.gableCenterX+sign*roof.gableWidth/2;
   for(let z=-5.55;z<=5.56;z+=1.45)head(columnX+sign*.38,8.46,z,.80,'side',sign*Math.PI/2);
   for(const t of[.20,.50,.78]){
    const x=T.MathUtils.lerp(innerX,roof.gableCenterX+sign*roof.roofWidth/2,t),y=T.MathUtils.lerp(footY,roof.roofEave,t)-.96*t*(1-t)+roof.roofCurl*Math.pow(t,8)*.22-.48,z=(T.MathUtils.lerp(roof.gableBack,roof.roofBack,t)+T.MathUtils.lerp(roof.gableFront,roof.roofFront,t))/2,d=T.MathUtils.lerp(roof.gableFront-roof.gableBack,roof.roofFront-roof.roofBack,t);
    b.at([x,y,z],sign*Math.PI/2,()=>carved.cornice(0,0,0,d,.50,roof.roofCurl*Math.pow(t,8)*.78));
   }
   b.line([columnX,8.71,4.70],[innerX+sign*.75,footY-.67,roof.gableFront+.78],.24,'hallBearing',true,.29);
   for(let z=-5.8;z<6;z+=.74){b.line([columnX,8.91,z],[innerX+sign*2.10,9.12,z],.16,'hallBearing',true,.20);b.line([columnX,8.51,z],[innerX,footY-.4,z],.15,'hallBearing',true,.20);}
  }
 }
 function sanctuaryBackdrop(cx=.9){
  // Gilded lotus-and-vine relief is actual raised geometry behind the altar.
  // Lamp light catches the relief differently from the dark oxidised backing.
  for(const x of[cx-2.10,cx,cx+2.10]){
   b.box(x,4.88,-5.46,1.94,3.87,.18,'oldgold',0,.58);
   for(const sign of[-1,1]){b.box(x+sign*.99,4.88,-5.32,.065,4.02,.12,'hallBearing');b.box(x,4.88+sign*1.99,-5.32,2.03,.075,.12,'gold');}
   b.tube([[x,3.14,-5.32],[x-.15,3.68,-5.29],[x+.13,4.30,-5.30],[x-.08,5.01,-5.30],[x+.06,5.82,-5.30],[x,6.57,-5.30]],.031,'gold',48);
   for(let j=0;j<7;j++){
    const yy=3.30+j*.46,sign=j%2?-1:1;
    b.tube([[x,yy,-5.30],[x+sign*.42,yy+.17,-5.28],[x+sign*.76,yy+.38,-5.27],[x+sign*.70,yy+.66,-5.28],[x+sign*.49,yy+.70,-5.28],[x+sign*.39,yy+.54,-5.28],[x+sign*.54,yy+.47,-5.28]],.021,'gold',28);
    for(let k=0;k<3;k++)b.put(reliefLeaf,k%2?'gold':'oldgold',[x+sign*(.24+k*.18),yy+.14+k*.16,-5.25],[1.8,1.8,1.6],[0,sign*.15,sign*(.52+k*.18)]);
   }
   for(let j=0;j<14;j++){const a=j*Math.PI/7;b.put(reliefLeaf,j%3?'gold':'oldgold',[x+Math.cos(a)*.30,5.55+Math.sin(a)*.30,-5.22],[2.0,2.5,1.7],[0,0,a-Math.PI/2]);}
   b.ball(x,5.55,-5.15,.14,.14,.07,'gold');
  }
 }
 return{head,transomBay,facePlate,cloudEnd,frontEave,sanctuaryBackdrop,gable:roof=>{counts.gableMass170=buildMonumentalGable170({b,mats,carved,roof});return counts.gableMass170;},tail:carved.tail,stats:Object.assign(counts,{carved:carved.stats})};
}
