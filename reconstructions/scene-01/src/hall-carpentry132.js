import * as T from 'three';
import {V,TAU} from './kernel.js';
import {layout124 as L} from './layout124.js';

// Recovered visible construction of HD01. All relief, infill and bearing
// members below are closed solids. The photo is only a measurement input.
export function buildHallCarpentry132(B,{column,carvedFitting,rosette}){
 const own=new Set(),keep=g=>{own.add(g);B.resources.add(g);return g;};
 const cream=B.m.plaster.clone();cream.name='hall132-lime-infill';cream.color.setHex(0x9f8b6a);cream.roughness=.96;
 const sap=B.m.wood.clone();sap.name='hall132-pale-rafter-end';sap.color.setRGB(8.0,6.2,3.8);sap.clearcoat=.015;sap.roughness=1;
 const gild=B.m.gold.clone();gild.name='hall132-aged-gold-leaf';gild.color.setHex(0xd8ae58);gild.metalness=.58;gild.roughness=.43;B.m.hallInfill132=cream;B.m.hallSap132=sap;B.m.hallGilt132=gild;
 function solid(shape,depth,bevel=.009){const g=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:14,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2});g.translate(0,0,-depth/2);return keep(g);}
 function arm(length,depth=.23){const h=length/2,s=new T.Shape();s.moveTo(-h,.10);s.lineTo(h,.10);s.quadraticCurveTo(h+.02,.015,h-.075,-.025);s.bezierCurveTo(h-.22,-.04,h-.22,-.16,h-.39,-.17);s.bezierCurveTo(h-.48,-.18,.18,-.27,.10,-.27);s.lineTo(-.10,-.27);s.bezierCurveTo(-.18,-.27,-h+.48,-.18,-h+.39,-.17);s.bezierCurveTo(-h+.22,-.16,-h+.22,-.04,-h+.075,-.025);s.quadraticCurveTo(-h-.02,.015,-h,.10);s.closePath();return solid(s,depth);}
 const arms=[arm(.92,.26),arm(1.24,.23),arm(1.50,.22)];
 const blockShape=new T.Shape();blockShape.moveTo(-.16,0);blockShape.lineTo(.16,0);blockShape.lineTo(.205,.095);blockShape.lineTo(.20,.16);blockShape.lineTo(-.20,.16);blockShape.lineTo(-.205,.095);blockShape.closePath();const block=solid(blockShape,.34);
 const vine=keep(new T.TubeGeometry(new T.CatmullRomCurve3([[-.48,-.025,0],[-.36,.055,0],[-.22,.065,0],[-.10,-.035,0],[.06,-.05,0],[.19,.055,0],[.34,.065,0],[.48,-.025,0]].map(V)),28,.010,6,false));
 const scroll=keep(new T.TubeGeometry(new T.CatmullRomCurve3([[0,0,0],[.11,.04,0],[.15,.12,0],[.09,.17,0],[.025,.13,0],[.055,.075,0],[.11,.085,0]].map(V)),24,.008,5,false));
 const pendant=(()=>{const s=new T.Shape();s.moveTo(-.25,.08);s.lineTo(.25,.08);s.bezierCurveTo(.22,-.02,.13,-.04,.13,-.18);s.quadraticCurveTo(0,-.27,-.13,-.18);s.bezierCurveTo(-.13,-.04,-.22,-.02,-.25,.08);s.closePath();return solid(s,.10,.006);})();
 function giltFace(x,y,z,w,h){B.box(x,y,z,w,h,.026,'goldDark');B.box(x,y,z+.018,w-.035,h-.035,.014,'gold');if(B.joineryKit)B.emit(B.joineryKit.relief,'hallGilt132',x,y,z+.033,w*.86,h*.86,.12);B.emit(vine,'goldLight',x,y,z+.03,w*.88,h*2.0,1);for(const sign of[-1,1])B.emit(scroll,'goldLight',x+sign*w*.16,y-h*.24,z+.033,h*1.45,h*1.45,1,[0,0,sign<0?Math.PI:0]);}
 function bracket(x,y,z,{scale=1,depth=1,corner=false}={}){B.with(x,y,z,0,()=>{
  // The daito seats on the round post. Each subsequent arm is supported by
  // the preceding pair of makito; the two outward arms carry real purlins.
  B.box(0,.06,0,.48,.12,.48,'darkwood');B.emit(block,'wood',0,.10,0,1.15,1,1.15);
  for(let course=0;course<3;course++){
   const y=.38+course*.31,reach=.26+course*.16;
   B.emit(arms[course],'wood',0,y,course*.18,1,1,1);
   B.emit(arms[course],'wood',0,y,course*.18,1,1,1,Math.PI/2);
   for(const sign of[-1,1]){
    B.emit(block,'wood',sign*reach,y+.10,course*.18,.64,.65,.69);
    B.emit(block,'wood',0,y+.10,course*.18+sign*reach,.64,.65,.69,Math.PI/2);
   }
   for(const side of[-1,1])B.with(side*(.46+course*.155),y-.02,course*.18,side*Math.PI/2,()=>giltFace(0,0,.135,.18,.19));giltFace(0,y-.005,course*.18+.48+course*.155,.20,.24);
  }
  B.box(0,1.155,.40,1.58,.13,.26,'wood');
  for(const side of[-1,1])B.box(side*.40,1.12,.26,.25,.12,1.40,'wood');
  // The deeper diagonal corner members remain seated on the same capital.
  if(corner)for(const sign of[-1,1])B.between([0,.49,0],[sign*.73,.99,1.0],.15,.20,'wood');
  giltFace(0,.13,.265,.30,.34);
 },[scale,scale,scale*depth]);}
 function frieze(left,right,y,z,rich=true){const width=right-left,cx=(left+right)/2;
  B.box(cx,y,z,width,.28,.34,'wood');B.box(cx,y,z+.18,width-.12,.18,.022,'darkwood');
  for(const dy of[-.12,.12])B.box(cx,y+dy,z+.20,width,.023,.022,'goldDark');
  const pieces=Math.max(2,Math.round(width/.34));for(let i=0;i<pieces;i++){const x=left+(i+.5)*width/pieces;B.emit(vine,'hallGilt132',x,y,z+.208,width/pieces*.92,1,1);if(B.joineryKit)B.emit(B.joineryKit.relief,'hallGilt132',x,y,z+.217,.205,.15,.12);if(rich){for(const sign of[-1,1])B.emit(scroll,'gold',x,y-.06,z+.21, .70,.70,1,[0,0,sign<0?Math.PI:0]);}}
 }
 function bayArch(left,right,y,z){const width=right-left-.30,cx=(left+right)/2,s=new T.Shape();s.moveTo(-width/2,.13);s.lineTo(width/2,.13);s.lineTo(width/2,.005);s.bezierCurveTo(width*.35,-.02,width*.31,-.21,width*.22,-.20);s.bezierCurveTo(width*.13,-.18,width*.12,-.085,0,-.085);s.bezierCurveTo(-width*.12,-.085,-width*.13,-.18,-width*.22,-.20);s.bezierCurveTo(-width*.31,-.21,-width*.35,-.02,-width/2,.005);s.closePath();B.emit(solid(s,.18),'wood',cx,y,z);B.emit(vine,'goldDark',cx,y-.015,z+.103,width*.81,1,1);}
 const lower=L.hall.frontAxes,upper=Array.from({length:9},(_,i)=>-10.2+i*2.6);
 B.label('hall132-lower-posts-and-seated-capitals',()=>{
  for(const z of[5.15,-.1,-5.1])for(const x of(z===5.15?lower:Array.from({length:7},(_,i)=>-10.5+i*3.5))){column(x,z,1.35,3.95,.31);bracket(x,5.19,z,{scale:1.01,depth:z===5.15?1.28:1,corner:Math.abs(x)>9});}
  for(const [y,h,d,z]of[[5.49,.19,.36,5.15],[6.37,.18,.28,5.66]])B.box(0,y,z,23.0,h,d,'wood');
  for(let i=0;i<lower.length-1;i++){const major=lower[i+1]-lower[i]>4;frieze(lower[i]+.15,lower[i+1]-.15,major?5.57:5.01,major?5.47:5.32);if(!major)bayArch(lower[i],lower[i+1],5.61,5.22);}
  // A single continuous bearing course is carried by the capitals, with fine
  // shadowed mortises between the ends rather than a floating gold strip.
  for(let k=0;k<77;k++){const x=-11.4+k*.30;B.box(x,6.32,6.35,.15,.17,.63,'darkwood');B.box(x,6.32,6.68,.12,.12,.055,'hallSap132');}
 });
 B.label('hall132-upper-timber-frame-and-cream-infill',()=>{
  // A concealed sill transfers every upper post into the lower capitals.
  B.box(0,6.82,5.18,22.4,.22,.40,'wood');for(const x of lower)B.box(x,6.56,5.15,.30,.31,.36,'wood');
  for(const z of[4.2,-4.8]){
   B.box(0,8.09,z-.12,21.3,3.17,.20,'darkwood');
   for(let i=0;i<upper.length-1;i++){
    const a=upper[i],b=upper[i+1],cx=(a+b)/2;
    for(const [y,h]of[[7.57,.43],[8.49,.48],[9.05,.27]])B.box(cx,y,z+.005,b-a-.22,h,.105,'hallInfill132');
    B.box(cx,7.08,z+.045,b-a-.23,.38,.09,'darkwood');
    for(let j=0;j<16;j++)B.box(a+.20+j*(b-a-.40)/15,7.08,z+.105,.025,.35,.035,'wood');for(const dy of[-.1,.1])B.box(cx,7.08+dy,z+.12,b-a-.25,.022,.035,'wood');
    frieze(a+.09,b-.09,7.88,z+.09,false);
    bayArch(a,b,8.89,z+.10);
   }
   for(const y of[6.80,7.30,8.16,8.80,9.34])B.box(0,y,z+.11,21.65,.14,.24,'wood');
   for(let i=0;i<upper.length;i++){
    const x=upper[i],front=z>0?z+.85:z;B.box(x,8.14,z+.11,.18,2.96,.29,'wood');B.box(x,8.14,z+.52,.15,2.96,.14,'wood');
    B.cyl(x,8.0,front+.13,.145,2.38,'red');bracket(x,9.19,front+.13,{scale:.91,depth:z>0?1.10:1.35,corner:i===0||i===8});giltFace(x,7.46,front+.31,.30,.32);B.cyl(x,7.02,front+.13,.152,.15,'goldDark');B.cyl(x,8.78,front+.13,.151,.14,'goldDark');
   }
   frieze(-10.8,10.8,9.35,z+.20);
   B.box(0,10.27,z+(z>0?1.0:.60),22.5,.21,.33,'wood');B.box(0,9.22,z+(z>0?.98:.13),21.65,.18,.32,'wood');
   for(let i=0;i<75;i++){const x=-11.1+i*.30;B.box(x,10.25,z+1.22,.14,.14,.66,'wood');B.box(x,10.25,z+1.57,.105,.105,.035,'hallSap132');}
  }
  // The front plaque has a real frame and modeled brush-like strokes.
  B.box(-.8,8.43,4.46,1.06,1.22,.13,'goldDark');B.box(-.8,8.43,4.54,.88,1.06,.035,'black');
  for(const dy of[-.55,.55])B.box(-.8,8.43+dy,4.56,.98,.035,.025,'gold');
  for(const dx of[-.48,.48])B.box(-.8+dx,8.43,4.56,.035,1.10,.025,'gold');
  for(let row=0;row<3;row++){const y=8.77-row*.33;for(const sign of[-1,1])B.between([-.8+sign*.14,y+.07,4.58],[-.8+sign*.11,y-.07,4.58],.025,.025,'gold');B.box(-.8,y,4.58,.29,.024,.026,'gold');B.between([-.84,y+.11,4.58],[-.78,y-.11,4.58],.023,.023,'gold');}
 });
 B.label('hall132-rear-purlin-bearings',()=>{
  for(const z of[4.2,-4.8]){const t=Math.abs(z+.35)/6.8,under=L.hall.upperEave+L.hall.mainRoofRise*Math.pow(1-t,1.46)-.21;
   B.box(0,under-.13,z,21.8,.26,.30,'wood');for(let k=0;k<7;k++){const x=-10.5+k*3.5,base=10.35,h=under-.27-base;if(h>.08)B.box(x,base+h/2,z,.25,h,.30,'wood');}
  }
 });
 return {revision:'hall132-source-measured-bearing-and-infill',resources:own.size};
}
