import * as T from 'three';
import {makeClosedCarvedLeaf} from './carved-joinery.js';
import {roofBearing143} from './hall-envelope143.js';

// Original solid carpentry; the photographic comparison supplies no pixels.
export function createNightCarpentry139(api){
 const {emit,box,between,group,materials:M}=api,boss=new T.SphereGeometry(1,12,8),leaf=makeClosedCarvedLeaf({length:.40,width:.095,relief:.037,turn:.14,segments:18,radial:8});
 const extrude=(s,d=.25,bevel=.012)=>{const g=new T.ExtrudeGeometry(s,{depth:d-2*bevel,steps:1,curveSegments:14,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2});g.translate(0,0,-d/2+bevel);return g;};
 function arm(length,lap='none'){
  const h=length/2,s=new T.Shape();s.moveTo(-h,.13);
  if(lap==='top'){s.lineTo(-.15,.13);s.lineTo(-.15,-.03);s.lineTo(.15,-.03);s.lineTo(.15,.13);}
  s.lineTo(h,.13);s.lineTo(h,-.035);s.bezierCurveTo(h-.13,-.05,h-.17,-.20,h-.32,-.22);s.bezierCurveTo(h-.43,-.24,.24,-.29,.13,-.29);
  if(lap==='bottom'){s.lineTo(.15,-.29);s.lineTo(.15,-.03);s.lineTo(-.15,-.03);s.lineTo(-.15,-.29);}else s.lineTo(-.13,-.29);
  s.bezierCurveTo(-.24,-.29,-h+.43,-.24,-h+.32,-.22);s.bezierCurveTo(-h+.17,-.20,-h+.13,-.05,-h,-.035);s.closePath();return extrude(s,.30);
 }
 const arms=[arm(1.18,'top'),arm(1.18,'bottom')],middle=arm(1.48),upper=arm(1.80);
 const cs=new T.Shape();cs.moveTo(-.23,0);cs.lineTo(.23,0);cs.lineTo(.27,.085);cs.lineTo(.24,.205);cs.lineTo(-.24,.205);cs.lineTo(-.27,.085);cs.closePath();const cushion=extrude(cs,.43);
 function flower(x,y,z,r=.15,mat=M.darkGilt||M.bronze){
  for(let k=0;k<7;k++)emit(leaf,mat,x,y,z,r*2.5,r*2.5,.37,[0,0,k*Math.PI*2/7]);
  emit(boss,mat,x,y,z+.025,r*.20,r*.20,.024);
 }
 function fitting(x,y,z,w=.25,h=.29){
  box(x,y,z,w,h,.025,M.bronze);
  for(const dx of[-w/2+.016,w/2-.016])box(x+dx,y,z+.018,.015,h-.025,.010,M.darkGilt||M.gold);
  for(const dy of[-h/2+.016,h/2-.016])box(x,y+dy,z+.019,w-.025,.015,.010,M.darkGilt||M.gold);
  for(const dx of[-w*.31,w*.31])for(const dy of[-h*.30,h*.30])emit(boss,M.gold,x+dx,y+dy,z+.027,.013,.013,.008);
  flower(x,y-h*.10,z+.026,Math.min(w,h)*.29,M.darkGilt||M.gold);
 }
 function capital(x,y,z,scale=1,depth=1,vertical=scale){group(x,y,z,0,()=>{
  // Joined dou blocks carry crossed hijiki; three staggered projections
  // occupy depth and support the existing common roof-bearing envelope.
  box(0,.065,0,.62,.13,.62,M.carvedTimber||M.wood);emit(cushion,M.wood,0,.13,0,1,1,1);
  emit(arms[0],M.wood,0,.44,0);emit(arms[1],M.wood,0,.44,0,1,1,1,Math.PI/2);
  for(const sign of[-1,1]){emit(cushion,M.red,sign*.40,.56,0,.62,.80,.64);emit(cushion,M.wood,0,.56,sign*.40,.62,.80,.64,Math.PI/2);}
  for(const sign of[-1,1]){emit(middle,M.wood,sign*.40,.83,.12,1,1,1,Math.PI/2);emit(middle,M.wood,0,.83,sign*.40);}
  for(const sx of[-1,1])for(const sz of[-1,1])emit(cushion,M.wood,sx*.40,.96,sz*.40,.64,.74,.65);
  emit(upper,M.wood,0,1.15,.42);
  for(const side of[-1,1]){
   emit(upper,M.wood,side*.40,1.15,.40,1,1,1,Math.PI/2);
   emit(cushion,M.red,side*.74,.96,.40,.60,.74,.65);
   emit(cushion,M.wood,side*.40,.96,.78,.60,.74,.65);
   // Lower tail and short diagonal are actual timber, with a dark lap joint.
   between([side*.19,.26,.09],[side*.19,.95,1.08],.17,.22,M.wood);
   box(side*.19,.85,.80,.22,.20,.25,M.carvedTimber||M.wood);
  }
  box(0,1.29,.42,1.86,.16,.36,M.wood);
  for(const sign of[-1,1])box(sign*.40,1.29,.26,.32,.16,1.62,M.wood);
  fitting(0,.43,.625,.15,.19);fitting(0,.82,1.13,.16,.20);
  for(const sign of[-1,1])group(sign*.76,.83,.40,sign*Math.PI/2,()=>fitting(0,0,.163,.15,.20));
 },[scale,vertical,scale*depth]);}
 function frieze(a,b,y,z,height=.28,mat=M.wood){
  const width=b-a,cx=(a+b)/2;box(cx,y,z,width,height,.34,mat);box(cx,y,z+.176,width-.10,height-.065,.022,M.carvedTimber||M.dark);
  for(const dy of[-height/2+.025,height/2-.025])box(cx,y+dy,z+.189,width,.028,.038,M.wood);
  const n=Math.max(2,Math.ceil(width/.59));for(let i=0;i<n;i++){
   const x=a+(i+.5)*width/n;
   // Low relief vine carving has wood mass; small worn gilt centres catch
   // the lamps without turning the full facade into a luminous gold stripe.
   for(const sign of[-1,1])emit(leaf,M.carvedTimber||M.wood,x+sign*.115,y-height*.24,z+.193,.71,.78,.56,[0,0,sign*1.08]);
   flower(x,y-height*.13,z+.211,height*.30,i%3===0?(M.darkGilt||M.bronze):(M.carvedTimber||M.wood));
  }
 }
 function bayArch(a,b,y,z){
  const w=b-a-.24,cx=(a+b)/2,s=new T.Shape();s.moveTo(-w/2,.17);s.lineTo(w/2,.17);s.lineTo(w/2,-.005);s.bezierCurveTo(w*.37,-.01,w*.34,-.30,w*.23,-.28);s.bezierCurveTo(w*.12,-.25,w*.13,-.09,0,-.09);s.bezierCurveTo(-w*.13,-.09,-w*.12,-.25,-w*.23,-.28);s.bezierCurveTo(-w*.34,-.30,-w*.37,-.01,-w/2,-.005);s.closePath();
  emit(extrude(s,.31),M.wood,cx,y,z);
  for(const sign of[-1,1])emit(leaf,M.carvedTimber||M.wood,cx+sign*w*.18,y-.16,z+.17,.72,.82,.59,[0,0,sign*.93]);
 }
 return{capital,frieze,fitting,flower,bayArch,revision:'scene09-deep-interlocked-dou-hijiki145'};
}

const bearingHeight139=roofBearing143;

export function buildNightHallFrame139(api,C){
 const {emit,box,between,group,post,lantern,materials:M}=api,railBoss=new T.SphereGeometry(1,10,6),lower=[-9.8,-7.2,-4.3,-1.2,2.1,5.2,7.4],upper=[-7.9,-4.34,-.96,2.10,4.84,7.07],floor=3.09;
 // The old cream rectangles are removed. A shadowed enclosure sits behind
 // a real 3.5m deep colonnade; cream survives only as recessed transoms.
 box(0,1.25,0,21,3.5,12,M.cutStoneDark);box(0,3.02,0,21.2,.14,12.2,M.cutStone);
 for(const z of[4.8,-4.5]){
  for(const x of lower){const base=6.55,head=bearingHeight139(x,z,false);post(x,z,floor,base-floor-.30,.29);C.capital(x,base,z,.92,1.28,Math.max(.22,(head-base)/1.30));}
  for(let i=0;i<lower.length-1;i++){const x=(lower[i]+lower[i+1])/2;C.capital(x,6.77,z,.64,1.30,Math.max(.22,(bearingHeight139(x,z,false)-6.77)/1.30));}box(0,6.63,z,19.2,.27,.38,M.wood);for(let i=0;i<66;i++){const a=-10+i*20/66,b=-10+(i+1)*20/66;between([a,bearingHeight139(a,z+.30,false)-.11,z+.30],[b,bearingHeight139(b,z+.30,false)-.11,z+.30],.20,.34,M.wood);}
  for(let i=0;i<lower.length-1;i++){const a=lower[i]+.16,b=lower[i+1]-.16;C.frieze(a,b,6.66,z+.24,.31);C.bayArch(a,b,7.16,z+.13);}
 }
 function screen(cx,z,width=.73){
  box(cx,4.65,z,width,2.83,.12,M.dark);box(cx,4.65,z+.075,width-.12,2.61,.014,M.windowPaper);
  for(const dx of[-width/2,width/2])box(cx+dx,4.65,z+.10,.075,2.91,.14,M.wood);
  for(const y of[3.22,6.08])box(cx,y,z+.11,width+.09,.085,.15,M.wood);
  for(let i=0;i<=5;i++)box(cx-width*.41+i*width*.82/5,4.65,z+.095,.019,2.67,.026,M.bronze);
  for(let j=0;j<=13;j++)box(cx,3.30+j*2.67/13,z+.10,width-.09,.019,.027,M.wood);
 }
 function portal(a,b,z,depth=2.3){
  const width=b-a,cx=(a+b)/2;
  // An actual open volume: jamb returns, header soffit, threshold and framed
  // deep ceiling. No dark/color plane spans the opening.
  for(const x of[a,b]){box(x,4.74,z,.18,3.26,.38,M.wood);box(x,4.74,z-depth/2,.16,3.26,depth,M.dark);C.fitting(x,6.13,z+.21,.16,.23);}
  box(cx,6.35,z-depth/2,width+.18,.25,depth+.28,M.dark);
  C.frieze(a-.09,b+.09,6.34,z+.23,.32);C.bayArch(a,b,6.50,z+.18);
  for(let i=0;i<=Math.ceil(width/.42);i++)box(a+i*width/Math.ceil(width/.42),6.20,z-depth/2,.08,.13,depth+.10,M.wood);
  box(cx,3.12,z-depth/2,width,.12,depth+.20,M.wood);
  // Narrow side lights and paired folded shutter leaves are hinged to the
  // actual jambs; they do not close the sanctuary's main view into the room.
  for(const side of[-1,1]){
   const x=side<0?a+.49:b-.49;screen(x,z-.10,.67);
   group(side<0?a+.88:b-.88,0,z-.32,side*.96,()=>{box(0,4.68,0,.72,2.98,.085,M.wood);for(const dx of[-.32,.32])box(dx,4.68,.055,.045,2.91,.06,M.bronze);for(const y of[3.25,6.10])box(0,y,.058,.71,.07,.06,M.bronze);for(let j=0;j<8;j++)C.flower(0,3.43+j*.34,.058,.105);});
  }
  // A narrow carved transom sits above the opening, rather than luminous
  // full-height infill. Golden depth continues onto the real jamb returns.
  for(let i=0;i<Math.ceil(width/.38);i++)C.flower(a+(i+.5)*width/Math.ceil(width/.38),6.04,z-.10,.12);
 }
 portal(-7.10,-3.20,1.24,2.25);portal(3.05,7.10,1.24,2.25);
 // Independent solid infill bays have lime plaster fields, deep timber
 // sills and slim paper windows, rather than a repeated full-height glow.
 for(const [a,b]of[[-9.38,-7.15],[7.15,9.38]]){
  const cx=(a+b)/2;box(cx,4.72,1.11,b-a,3.15,.24,M.wood);
  box(cx,4.74,1.255,b-a-.24,2.83,.055,M.ivory);
  for(const yy of[3.20,4.06,6.19])box(cx,yy,1.31,b-a+.05,.13,.18,M.wood);
  screen(cx,1.37,.72);
 }

 for(const side of[-1,1])group(side*7.15,0,-1.13,side*Math.PI/2,()=>{portal(-4.18,-.15,.05,1.45);portal(.35,4.18,.05,1.45);});
 box(0,4.80,-4.45,18.6,3.44,.22,M.dark);
 // Real shadowed room depth remains visible between the narrow side lights.
 // These carved back furnishings sit behind the jamb-return volumes.
 for(const cx of[-5.25,5.10]){
  box(cx,4.73,-1.20,3.0,3.20,.16,M.dark);
  for(const dx of[-1.35,0,1.35])box(cx+dx,4.73,-1.07,.14,3.20,.18,M.wood);
  for(const yy of[3.18,5.95,6.27])box(cx,yy,-1.02,3.02,.11,.20,M.wood);
  for(let col=0;col<4;col++){
   const x=cx-.99+col*.66;box(x,4.68,-1.08,.59,2.77,.055,M.bronze);
   for(let row=0;row<7;row++)for(const side of[-1,1])C.flower(x+side*.17,3.52+row*.35,-1.037,.135);
  }
  C.frieze(cx-1.5,cx+1.5,6.12,-.95,.30);
 }
 // Low sanctuary plinths and offering-table legs contact the unchanged floor.
 for(const [x,z,w,d]of[[-1.1,1.3,2.48,1.65],[6.05,-.20,1.70,1.25]]){
  box(x,3.17,z,w,.16,d,M.dark);box(x,3.28,z,w+.06,.08,d+.06,M.bronze);
  for(const yy of[3.12,3.25,3.32])box(x,yy,z+d/2+.015,w+.08,.025,.045,M.gold);
  for(let j=0;j<Math.ceil(w/.25);j++)C.flower(x-w*.43+j*w*.86/(Math.ceil(w/.25)-1),3.19,z+d/2+.03,.055);
 }
 for(const x of[-2.05,-.15])box(x,4.43,1.02,.075,2.68,.09,M.bronze);
 for(const x of[-2.25,.05])for(const z of[2.29,2.75])box(x,3.31,z,.10,.44,.10,M.wood);
 box(-1.1,3.54,2.52,2.74,.10,.69,M.wood);C.frieze(-2.47,.27,3.47,2.90,.14);
 // A deep open portal frames the actual freestanding Buddha and altar.
 for(const x of[-2.65,2.65]){
  box(x,4.73,3.20,.36,3.45,.48,M.dark);box(x,4.73,3.455,.25,3.34,.035,M.bronze);
  for(let row=0;row<9;row++)C.flower(x,3.23+row*.36,3.485,.13);
 }
 box(0,6.37,3.30,5.66,.48,.50,M.wood);C.frieze(-2.83,2.83,6.39,3.58,.38);
 for(const sign of[-1,1])group(sign*3.05,0,2.5,sign*.80,()=>{box(0,4.70,0,1.52,3.12,.13,M.wood);C.frieze(-.72,.72,6.12,.09,.24);for(let j=0;j<11;j++)box(-.68+j*.136,4.70,.09,.035,2.65,.04,M.bronze);});
 box(-1.1,4.77,.14,4.45,3.25,.12,M.dark);
 for(let bay=0;bay<4;bay++){
  const cx=-2.72+bay*1.08;box(cx,4.77,.235,1.00,3.20,.055,M.sanctuaryGilt||M.bronze);
  for(const dx of[-.49,.49])box(cx+dx,4.77,.28,.05,3.22,.07,M.gold);
  for(let row=0;row<13;row++)for(const dx of[-.26,0,.26])C.flower(cx+dx,3.35+row*.23,.29,.085,M.gold);
  for(let row=0;row<15;row++)for(let col=0;col<7;col++){
   const x=cx-.43+col*.143,y=3.32+row*.202;
   emit(railBoss,row%3?M.sanctuaryGilt:M.gold,x,y,.297,.043,.055,.028);
  }
  for(let col=0;col<8;col++)box(cx-.46+col*.132,4.77,.282,.023,3.14,.022,M.darkGilt);
 }
 for(const [a,b]of[[-9.6,-3.6],[3.6,9.6]]){
  for(const y of[floor+.25,floor+.75])box((a+b)/2,y,5.73,b-a,.10,.13,M.red);
  for(let i=0;i<=Math.ceil((b-a)/.75);i++){const x=a+(b-a)*i/Math.ceil((b-a)/.75);box(x,floor+.48,5.73,.10,.95,.10,M.red);if(i%2===0){emit(railBoss,M.gold,x,floor+1.03,5.73,.09,.13,.09);}}
 }
 // The upper wall is recessed behind independent posts. The sill continues
 // across the lower capital grid and supports the upper gallery floor.
 box(0,8.05,.45,18.7,.24,10.5,M.dark);box(0,8.16,.45,18.5,.10,10.5,M.wood);box(0,8.02,5.35,19.0,.26,.36,M.wood);
 for(const x of lower)if(Math.abs(x)<9.1){const seat=bearingHeight139(x,4.80,false),top=7.945;box(x,(seat+top)/2,4.80,.32,top-seat+.020,.40,M.wood);}
 // The returning colonnade carries the same upper-floor datum. Its posts
 // are inside the lower skirt opening; they do not pierce ceramic surfaces.
 for(const side of[-1,1]){
  for(const z of[-3.5,-1.2,1.1,3.4]){
   post(side*8.10,z,floor,6.55-floor-.30,.25);
   group(side*8.10,6.55,z,side*Math.PI/2,()=>C.capital(0,0,0,.82,1.02,(7.93-6.55)/1.30));
  }
  box(side*8.10,7.94,.45,.38,.20,9.25,M.wood);
  for(let i=0;i<=10;i++)box(side*8.73,7.95,-4.15+i*.91,1.56,.20,.18,M.wood);
  group(side*8.10,0,0,side*Math.PI/2,()=>{for(const z of[-3.5,-1.2,1.1,3.4]){const cx=-side*z;C.frieze(cx-.95,cx+.95,6.69,.22,.24);}});
 }
 for(const z of[3.30,-4.45]){
  box(0,8.94,z,18.3,1.56,.18,M.dark);
  for(let i=0;i<upper.length-1;i++){
   const a=upper[i],b=upper[i+1],cx=(a+b)/2;
   for(const [y,h]of[[8.61,.38],[9.19,.39],[9.61,.16]])box(cx,y,z+.11,b-a-.20,h,.08,M.ivory);
   for(const y of[8.36,8.92,9.43])box(cx,y,z+.16,b-a,.14,.20,M.wood);
   C.frieze(a+.08,b-.08,8.94,z+.19,.19);C.bayArch(a,b,9.62,z+.14);
  }
 }
 for(const z of[5.20,-4.30]){
  for(const x of upper){const base=9.25;post(x,z,8.19,base-8.19-.30,.18);C.capital(x,base,z,.88,1.12,Math.max(.22,(bearingHeight139(x,z,true)-base)/1.30));C.fitting(x,8.73,z+.22,.22,.25);}
  for(let i=0;i<upper.length-1;i++){const x=(upper[i]+upper[i+1])/2;C.capital(x,9.66,z,.57,1.2,Math.max(.20,(bearingHeight139(x,z,true)-9.66)/1.30));}box(0,9.57,z,18.8,.18,.30,M.wood);C.frieze(-9.4,9.4,9.56,z+.20,.23);
  for(const y of[8.42,8.83])box(0,y,z+.26,18.6,.075,.10,M.red);
  for(let i=0;i<49;i++)box(-9.1+i*18.2/48,8.60,z+.26,.045,.43,.055,M.red);
 }
 for(const side of[-1,1]){
  // Real side gallery: independently seated posts and roof receivers, with
  // the opaque enclosure set back behind a walkable floor and open railing.
  for(const z of[-3.4,-1.1,1.2,3.45]){
   post(side*8.10,z,8.19,9.25-8.19-.30,.18);
   const head=bearingHeight139(side*8.10,z,true);
   group(side*8.10,9.25,z,side*Math.PI/2,()=>C.capital(0,0,0,.76,1.06,Math.max(.22,(head-9.25)/1.30)));
  }
  for(let i=0;i<36;i++){
   const a=-4.30+i*9.5/36,b=-4.30+(i+1)*9.5/36;
   between([side*8.10,bearingHeight139(side*8.10,a,true)-.08,a],[side*8.10,bearingHeight139(side*8.10,b,true)-.08,b],.22,.30,M.wood);
  }
  for(const y of[8.42,8.83])box(side*9.10,y,.45,.10,.075,9.45,M.red);
  for(let i=0;i<=25;i++)box(side*9.10,8.60,-4.23+i*9.38/25,.055,.43,.045,M.red);
  group(side*6.85,0,-.58,side*Math.PI/2,()=>{
   const axes=[-3.5,-1.17,1.17,3.5];
   for(let i=0;i<axes.length-1;i++){
    const a=axes[i],b=axes[i+1],cx=(a+b)/2;
    box(cx,8.96,-.06,b-a-.10,1.55,.15,M.dark);
    for(const y of[8.61,9.18])box(cx,y,.045,b-a-.36,.36,.07,M.ivory);
    C.frieze(a+.06,b-.06,8.93,.085,.18);C.bayArch(a,b,9.62,.08);
   }
   for(const x of axes)box(x,8.96,.08,.14,1.70,.20,M.wood);
   for(const y of[8.33,9.45])box(0,y,.08,7.30,.14,.20,M.wood);
  });
 }
 for(const x of[-9,-6,-3,3,6,9]){lantern(x,5.50,4.90,.80);lantern(x,9.50,5.25,.48);}
 return{revision:'scene09-deep-interlocked-hall-and-plaster-bays145-r04',lowerAxes:lower,upperAxes:upper,upperWallZ:3.30,upperPostZ:5.20,sanctuary:{sideOpenings:[[-7.10,-3.20],[3.05,7.10]],sideLightWidth:.67,portalDepth:2.25,openJambReturns:true,fullHeightLuminousWallRemoved:true},returnGallery:{lowerWallX:7.15,upperWallX:6.85,structuralPostX:8.10,railX:9.10,lowerCapitalSeat:7.93,floorBearing:7.94,lowerCeramicNotPierced:true},cream:'Narrow recessed transoms only',sillReceivers:lower.filter(x=>Math.abs(x)<9.1).map(x=>({x,z:4.80,bottom:bearingHeight139(x,4.80,false)-.010,top:7.955})),completeLoadPath:true};
}
