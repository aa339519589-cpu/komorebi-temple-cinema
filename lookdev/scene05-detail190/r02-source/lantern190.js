import * as T from 'three';
import {closedWire190,finishSolid190} from './detail190-solids.js';

// A longer six-sided light chamber, shallow pitched hood, pierced neck and
// fine chased botanical tracery. All are authored solids; no bitmap relief.
export function createLantern190(){
 const parts=[],owned=[];const add=(g,material,p=[0,0,0],rot=[0,0,0])=>{g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(1,1,1)));owned.push(g);parts.push({geometry:g,material});};
 const box=(p,s,ma,rot=[0,0,0])=>add(new T.BoxGeometry(...s),ma,p,rot);
 function lathe(profile,ma,segments=6){const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),segments,-Math.PI/6),clean=finishSolid190(Array.from(g.attributes.position.array),Array.from(g.attributes.uv.array),Array.from(g.index.array),'scene05-closed-lantern-cast190');g.dispose();add(clean,ma);}
 const wire=(pts,r=.006,ma='oldgold')=>add(closedWire190(pts,r,Math.max(20,pts.length*5),8),ma);
 const ring=(y,r,t=.012,ma='oldgold')=>lathe([[r-t,y-t],[r+t,y-t],[r+t,y+t],[r-t,y+t],[r-t,y-t]],ma);
 function petal(){const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(-.040,.045,-.042,.119,0,.172);s.bezierCurveTo(.042,.119,.040,.045,0,0);s.closePath();const h=new T.Path();h.moveTo(0,.030);h.bezierCurveTo(.021,.067,.022,.107,0,.140);h.bezierCurveTo(-.022,.107,-.021,.067,0,.030);h.closePath();s.holes.push(h);return new T.ExtrudeGeometry(s,{depth:.006,steps:1,curveSegments:12,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:2});}
 const petalPrototype=petal();
 lathe([[0,.79],[.07,.79],[.13,.75],[.27,.63],[.43,.54],[.49,.55],[.49,.525],[.45,.505],[.30,.57],[.12,.74],[.05,.765],[0,.765]],'lanternBronze');
 ring(.535,.476,.012);ring(.49,.296,.013);
 for(let k=0;k<6;k++){const a=(k+.5)*Math.PI/3;add(new T.CylinderGeometry(.009,.009,.14,10),'lanternBronze',[Math.sin(a)*.285,.53,Math.cos(a)*.285]);}
 lathe([[.055,.755],[.12,.755],[.16,.805],[.16,.835],[.14,.835],[.12,.795],[.055,.785],[.055,.755]],'oldgold',18);
 lathe([[0,-.72],[.045,-.72],[.095,-.65],[.17,-.59],[.29,-.49],[.322,-.47],[.322,-.445],[.28,-.445],[.13,-.59],[.045,-.66],[0,-.66]],'lanternBronze');
 for(const yy of[-.465,.465])ring(yy,.301,.015);
 for(let face=0;face<6;face++){
  const angle=face*Math.PI/3,turn=g=>{g.rotateY(angle);return g;},localAdd=(g,ma,p=[0,0,0],rz=0)=>{g.rotateZ(rz);g.translate(...p);turn(g);add(g,ma);};
  localAdd(new T.BoxGeometry(.269,.91,.010),'lanternPaper',[0,0,.237]);
  for(const side of[-1,1]){
   localAdd(new T.BoxGeometry(.020,.95,.032),'lanternBronze',[side*.142,0,.253]);
   localAdd(new T.BoxGeometry(.005,.91,.006),'oldgold',[side*.144,0,.272]);
   for(const yy of[-.405,0,.405]){const g=new T.SphereGeometry(1,10,6);g.scale(.009,.009,.004);localAdd(g,'oldgold',[side*.144,yy,.275]);}
  }
  for(const yy of[-.45,.45])localAdd(new T.BoxGeometry(.287,.020,.025),'lanternBronze',[0,yy,.255]);
  for(const yy of[-.365,.365])localAdd(new T.BoxGeometry(.272,.005,.010),'oldgold',[0,yy,.268]);
  // One fine central flower and four branching corner sprays span each
  // long panel; the former two large loop flowers are removed.
  for(let k=0;k<8;k++){const petal=petalPrototype.clone();petal.scale(.76,.76,1);localAdd(petal,'oldgold',[0,0,.262],k*Math.PI/4);}
  const boss=new T.SphereGeometry(1,12,8);boss.scale(.025,.025,.007);localAdd(boss,'oldgold',[0,0,.272]);
  for(const sign of[-1,1])for(const side of[-1,1]){
   const pts=[[side*.015,sign*.12,.269],[side*.075,sign*.20,.271],[side*.11,sign*.30,.268],[side*.08,sign*.35,.268]],g=closedWire190(pts,.0045,28,8);turn(g);add(g,'oldgold');
   const leaf=petalPrototype.clone();leaf.scale(.53,.61,.70);localAdd(leaf,'oldgold',[side*.065,sign*.21,.264],side*sign*.8+(sign<0?Math.PI:0));
  }
  const neck=new T.Shape();neck.moveTo(-.070,.825);neck.lineTo(.070,.825);neck.lineTo(.064,1.205);neck.quadraticCurveTo(0,1.24,-.064,1.205);neck.closePath();
  for(const yy of[.92,1.11]){const h=new T.Path();h.moveTo(0,yy-.068);h.bezierCurveTo(-.037,yy-.022,-.037,yy+.030,0,yy+.068);h.bezierCurveTo(.037,yy+.030,.037,yy-.022,0,yy-.068);h.closePath();neck.holes.push(h);}
  const n=new T.ExtrudeGeometry(neck,{depth:.008,steps:1,curveSegments:12,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:2});localAdd(n,'oldgold',[0,0,.134]);
  const rib=closedWire190([[0,.79,.055],[0,.70,.18],[0,.59,.35],[0,.548,.481]],.006,28,8);turn(rib);add(rib,'oldgold');
 }
 for(const yy of[.82,1.21])ring(yy,.151,.013);
 lathe([[0,1.22],[.118,1.22],[.09,1.28],[.045,1.34],[0,1.34]],'oldgold',16);
 for(let j=0;j<5;j++)add(new T.TorusGeometry(.029,.007,8,24),'oldgold',[0,1.36+j*.058,0],[0,j%2?Math.PI/2:0,0]);
 for(let j=0;j<3;j++)add(new T.TorusGeometry(.022,.005,8,24),'oldgold',[0,-.73-j*.044,0],[0,j%2?Math.PI/2:0,0]);
 lathe([[0,-.99],[.02,-.99],[.055,-.93],[.058,-.88],[.025,-.845],[0,-.845]],'oldgold',16);
 petalPrototype.dispose();return{parts,info:{revision:190,bodyHeight:.91,bodyAcrossFlats:.4936,bodyAspect:1.8436,topLinkY:1.621,pendantBottomY:-.99,construction:'Closed six-sided long paper chamber, narrow chased stems/leaf apertures, shallow pitched hood and pierced cast neck; actual hook and anchor links',referencePhotographTexture:false},dispose(){for(const g of owned)g.dispose();}};
}
