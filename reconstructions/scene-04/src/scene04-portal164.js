import * as T from 'three';
import {createSanctuaryCarving164} from './scene04-porch-sculpture135.js';
// A closed carved reveal and a curved timber canopy occupy real depth behind
// the exterior threshold. No rendered reference image or facing proxy exists.
export function buildPortalDepth164({emit,box,tube,rosette,mats,materials,floorY=3.5}){
 const top=4.38,revealFront=-.79,revealBack=-2.40;
 const gilt=mats.oldgold.clone();gilt.name='scene04-164-worn-sanctuary-reveal-gilt';gilt.color.setHex(0x9e7838);gilt.roughness=.52;materials.push(gilt);mats.portal164gilt=gilt;
 const pap=new T.MeshStandardMaterial({name:'scene04-164-oil-lantern-paper',color:0xc4a675,emissive:0xffb65e,emissiveIntensity:.20,roughness:.86});materials.push(pap);mats.portal164paper=pap;
 const leaf=new T.Shape();leaf.moveTo(0,0);leaf.bezierCurveTo(-.11,.05,-.12,.22,-.025,.37);leaf.bezierCurveTo(.015,.28,.15,.18,.095,.08);leaf.bezierCurveTo(.065,.025,.025,.025,0,0);leaf.closePath();
 const leafG=new T.ExtrudeGeometry(leaf,{depth:.052,steps:1,bevelEnabled:true,bevelSize:.012,bevelThickness:.009,bevelSegments:2,curveSegments:12});
 const lp=leafG.attributes.position;for(let i=0;i<lp.count;i++){const x=lp.getX(i),y=lp.getY(i),z=lp.getZ(i),v=Math.max(0,Math.min(1,y/.37));lp.setZ(i,z+.062*Math.sin(Math.PI*v)+.018*(x/.12)**2*Math.sin(Math.PI*v)-.012*x/.12*v);}lp.needsUpdate=true;leafG.computeVertexNormals();
 // Continuous side panels provide a deep wooden reveal. Recesses, moulded
 // edges, capitals and leaves interrupt the former nested rectangular collars.
 for(const side of[-1,1]){
  const x=side*2.15,z=(revealFront+revealBack)/2;
  box(x,floorY+top/2,z,.22,top,revealFront-revealBack,'darkwood');
  box(side*2.085,floorY+top/2,z,.065,top-.06,1.58,'cedar');
  box(side*2.047,floorY+top/2,revealFront+.025,.040,top-.09,.075,'portal164gilt');
  for(const [y,h,w,d]of[[.19,.32,.28,1.63],[3.92,.25,.32,1.64],[4.14,.19,.40,1.58]])box(side*2.12,floorY+y,z,w,h,d,'cedar');
  for(let row=0;row<11;row++)for(let depth=0;depth<5;depth++){
   const yy=floorY+.43+row*.303,zz=-.94-depth*.28;
   emit(leafG,(row+depth)%4?'portal164gilt':'oldgold',side*2.043,yy,zz,1,1,1,[0,-side*Math.PI/2,side*(row%2?.63:-.63)]);
  }
  for(const yy of[.43,1.40,2.37,3.34]){
   rosette(side*2.04,floorY+yy,revealFront+.075,.069,'oldgold');
   box(side*2.13,floorY+yy,-1.63,.20,.035,1.60,'portal164gilt');
  }
 }
 // A thick gently sagging carved lintel is supported by the reveal capitals.
 const canopy=new T.Shape(),n=60,width=4.12,upper=x=>top+.035+.045*(1-(x/2.06)**2),lower=x=>3.94+.18*(Math.abs(x)/2.06)**1.4;
 for(let i=0;i<=n;i++){const x=-width/2+width*i/n;i?canopy.lineTo(x,upper(x)):canopy.moveTo(x,upper(x));}
 for(let i=n;i>=0;i--){const x=-width/2+width*i/n;canopy.lineTo(x,lower(x));}canopy.closePath();
 const beam=new T.ExtrudeGeometry(canopy,{depth:.37,steps:1,bevelEnabled:true,bevelSize:.018,bevelThickness:.014,bevelSegments:3,curveSegments:12});beam.translate(0,floorY,-1.13);beam.userData.architectureMember='164-deep-curved-portal-rainbow-lintel';emit(beam,'cedar');
 for(const offset of[.018,.24]){
  const pts=[];for(let j=0;j<=30;j++){const x=-2.00+4*j/30;pts.push([x,floorY+lower(x)+offset,-.735]);}tube(pts,offset<.1?.018:.012,'portal164gilt',50);
 }
 for(const skin of[false,true]){
  const g=createSanctuaryCarving164({width:3.88,height:.25,nx:580,ny:54,depth:.078,back:.025,uRepeat:2,skin,warp:(x,y,z)=>[x,floorY+lower(x)+.18+y,z-.735]});
  emit(g,skin?'portal164gilt':'cedar');
 }
 // Real dark ceiling coffers and sparse worn fillets; the broad timber faces
 // remain legible under the front canopy instead of a bright wire grid.
 box(0,floorY+4.49,-1.58,4.18,.20,1.74,'darkwood');
 for(const z of[-1.08,-1.77,-2.36])for(const x of[-1.50,-.50,.50,1.50]){
  box(x,floorY+4.36,z,.89,.085,.57,'cedar');
  for(const xx of[-.42,.42])box(x+xx,floorY+4.30,z,.032,.075,.58,'endwood');
  for(const zz of[-.27,.27])box(x,floorY+4.30,z+zz,.88,.075,.035,'endwood');
  emit(new T.TorusGeometry(.071,.012,6,24),'oldgold',x,floorY+4.305,z,1,1,1,[Math.PI/2,0,0]);
 }
 const ring=new T.TorusGeometry(.018,.005,6,14),drop=new T.SphereGeometry(1,12,8);
 for(let j=0;j<11;j++){
  const x=-1.70+j*.34,len=.14+.09*Math.cos(x*.8)**2,anchor=floorY+lower(x)-.04,z=-.86;
  for(let k=0;k<4;k++)emit(ring,'oldgold',x,anchor-k*len/4,z,1,1,1,[0,k%2*Math.PI/2,0]);
  emit(drop,'oldgold',x,anchor-len-.015,z,.021,.045,.021);
 }
 const lights=[];
 for(const side of[-1,1]){
  const x=side*1.56,y=floorY+3.46,z=-1.67;
  box(x,floorY+4.38,z,.11,.06,.11,'oldgold');tube([[x,floorY+4.35,z],[x,y+.23,z]],.009,'oldgold',10);
  emit(new T.CylinderGeometry(.095,.095,.30,8),'portal164paper',x,y,z);
  for(const yy of[y-.17,y+.17])emit(new T.CylinderGeometry(.13,.13,.045,8),'oldgold',x,yy,z);
  for(let j=0;j<8;j++){const a=j*Math.PI/4;box(x+Math.cos(a)*.103,y,z+Math.sin(a)*.103,.014,.33,.014,'oldgold');}
  lights.push([x,y,z]);
 }
 return{revision:'scene04-164-r03-curved-leaf-and-carved-reveal',clearHeight:top,revealDepth:revealFront-revealBack,carvedSideLeaves:110,continuousCarvedLintel:true,coffers:12,hangingDrops:11,lights,visualAccepted:false};
}
