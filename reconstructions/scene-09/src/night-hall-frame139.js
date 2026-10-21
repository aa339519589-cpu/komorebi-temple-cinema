import * as T from 'three';
import {makeClosedCarvedLeaf} from './carved-joinery.js';

// Scene09-only reconstruction. Every timber, infill and relief is geometry;
// the photograph supplies dimensions/composition, never a surface projection.
export function createNightCarpentry139(api){
 const {emit,box,between,group,materials:M}=api,boss=new T.SphereGeometry(1,10,6),leaf=makeClosedCarvedLeaf({length:.40,width:.095,relief:.037,turn:.14,segments:18,radial:8});
 const extrude=(s,d=.25,bevel=.009)=>{const g=new T.ExtrudeGeometry(s,{depth:d,steps:1,curveSegments:12,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2});g.translate(0,0,-d/2);return g;};
 function arm(length,lap='none'){
  const h=length/2,s=new T.Shape();s.moveTo(-h,.11);
  if(lap==='top'){s.lineTo(-.135,.11);s.lineTo(-.135,-.035);s.lineTo(.135,-.035);s.lineTo(.135,.11);}
  s.lineTo(h,.11);s.quadraticCurveTo(h+.018,.015,h-.06,-.025);s.bezierCurveTo(h-.18,-.025,h-.20,-.155,h-.33,-.165);s.bezierCurveTo(h-.45,-.18,.18,-.245,.11,-.245);
  if(lap==='bottom'){s.lineTo(.135,-.245);s.lineTo(.135,-.035);s.lineTo(-.135,-.035);s.lineTo(-.135,-.245);}else s.lineTo(-.11,-.245);
  s.bezierCurveTo(-.18,-.245,-h+.45,-.18,-h+.33,-.165);s.bezierCurveTo(-h+.20,-.155,-h+.18,-.025,-h+.06,-.025);s.quadraticCurveTo(-h-.018,.015,-h,.11);s.closePath();return extrude(s,.27);
 }
 const first=[arm(1.12,'top'),arm(1.12,'bottom')],cross=arm(1.31),upper=arm(1.61);
 const cs=new T.Shape();cs.moveTo(-.16,0);cs.lineTo(.16,0);cs.lineTo(.205,.075);cs.lineTo(.20,.16);cs.lineTo(-.20,.16);cs.lineTo(-.205,.075);cs.closePath();const cushion=extrude(cs,.34);
 function flower(x,y,z,r=.15,mat=M.gold){
  for(let k=0;k<7;k++)emit(leaf,mat,x,y,z,r*2.5,r*2.5,.37,[0,0,k*Math.PI*2/7]);
  emit(boss,mat,x,y,z+.025,r*.20,r*.20,.024);
 }
 function fitting(x,y,z,w=.25,h=.29){
  box(x,y,z,w,h,.036,M.bronze);for(const dx of[-w/2+.018,w/2-.018])box(x+dx,y,z+.024,.024,h-.015,.022,M.gold);
  for(const dy of[-h/2+.018,h/2-.018])box(x,y+dy,z+.025,w-.016,.024,.022,M.gold);
  flower(x,y-h*.16,z+.029,Math.min(w,h)*.42);
 }
 function capital(x,y,z,scale=1,depth=1,vertical=scale){group(x,y,z,0,()=>{
  box(0,.055,0,.51,.11,.51,M.dark);emit(cushion,M.wood,0,.11,0,1.15,1,1.15);
  emit(first[0],M.wood,0,.385,0);emit(first[1],M.wood,0,.385,0,1,1,1,Math.PI/2);
  for(const sign of[-1,1]){emit(cushion,M.red,sign*.35,.50,0,.66,.70,.70);emit(cushion,M.red,0,.50,sign*.35,.66,.70,.70,Math.PI/2);}
  for(const sign of[-1,1]){emit(cross,M.wood,sign*.35,.76,0,1,1,1,Math.PI/2);emit(cross,M.wood,0,.76,sign*.35);}
  for(const sx of[-1,1])for(const sz of[-1,1])emit(cushion,M.wood,sx*.35,.88,sz*.35,.68,.74,.68);
  emit(upper,M.wood,0,1.10,.37);for(const side of[-1,1]){emit(upper,M.wood,side*.35,1.10,.35,1,1,1,[.23,Math.PI/2,0]);emit(cushion,M.wood,side*.66,.88,.35,.64,.72,.68);emit(cushion,M.wood,side*.35,.88,.66,.64,.72,.68);}box(0,1.23,.37,1.72,.14,.30,M.wood);
  for(const sign of[-1,1])box(sign*.35,1.19,.28,.28,.13,1.50,M.wood);
  for(const side of[-1,1])between([side*.18,.16,.12],[side*.18,1.03,1.00],.13,.18,M.wood);fitting(0,.18,.285,.27,.32);fitting(0,.385,.59,.20,.21);fitting(0,.76,1.015,.22,.23);for(const side of[-1,1])fitting(side*.35,.76,.77,.20,.22);
  for(const side of[-1,1])group(side*.67,.76,.35,side*Math.PI/2,()=>fitting(0,0,.145,.21,.23));
 },[scale,vertical,scale*depth]);}
 function frieze(a,b,y,z,height=.28,mat=M.wood){
  const width=b-a,cx=(a+b)/2;box(cx,y,z,width,height,.30,mat);box(cx,y,z+.16,width-.10,height-.075,.022,M.dark);
  for(const dy of[-height/2+.025,height/2-.025])box(cx,y+dy,z+.185,width,.025,.026,M.gold);
  const n=Math.max(2,Math.ceil(width/.39));for(let i=0;i<n;i++){
   const x=a+(i+.5)*width/n;flower(x,y-height*.14,z+.19,height*.38);
   for(const sign of[-1,1])emit(leaf,M.gold,x+sign*.11,y-height*.22,z+.193,.52,.62,.42,[0,0,sign*1.15]);
  }
 }
 function bayArch(a,b,y,z){const w=b-a-.26,cx=(a+b)/2,s=new T.Shape();s.moveTo(-w/2,.14);s.lineTo(w/2,.14);s.lineTo(w/2,.025);s.bezierCurveTo(w*.36,.01,w*.34,-.24,w*.23,-.22);s.bezierCurveTo(w*.13,-.19,w*.13,-.065,0,-.065);s.bezierCurveTo(-w*.13,-.065,-w*.13,-.19,-w*.23,-.22);s.bezierCurveTo(-w*.34,-.24,-w*.36,.01,-w/2,.025);s.closePath();emit(extrude(s,.23),M.wood,cx,y,z);for(const sign of[-1,1])emit(leaf,M.gold,cx+sign*w*.18,y-.12,z+.13,.55,.68,.48,[0,0,sign*.93]);}
 return{capital,frieze,fitting,flower,bayArch,revision:'scene09-seated-curved-timber-139'};
}

function bearingHeight139(x,z,upper){
 const S=upper?{w:20.09,front:9,back:6,e:9.8,rise:6,curl:.78,left:6.48,right:4.20,cut:.43,power:1.72}:{w:21.30,front:8.30,back:6.20,e:7.25,rise:3,curl:.62,left:21.30*.24,right:21.30*.24,cut:0,power:1.49},half=S.w/2,span=(t,r)=>r+(half-r)*(S.cut?Math.max(0,(t-S.cut)/(1-S.cut)):t);
 let t=Math.abs(z)/(z>=0?S.front:S.back),u=(2*x+span(t,S.left)-span(t,S.right))/(span(t,S.left)+span(t,S.right));
 if(x>span(t,S.right)||x< -span(t,S.left)){const r=x>=0?S.right:S.left;t=S.cut+(1-S.cut)*(Math.abs(x)-r)/(half-r);u=z/((z>=0?S.front:S.back)*t);}
 return S.e+S.rise*Math.pow(Math.max(0,1-t),S.power)+S.curl*Math.pow(t,10)*(.17+.83*Math.pow(Math.abs(u),8))+(upper?.11:.035)*Math.pow(1-t,8)*Math.pow(Math.abs(u),8)-.31;
}

export function buildNightHallFrame139(api,C){
 const {emit,box,between,group,post,lantern,materials:M}=api,railBoss=new T.SphereGeometry(1,10,6),lower=[-9.8,-7.2,-4.3,-1.2,2.1,5.2,7.4],upper=[-7.9,-4.34,-.96,2.10,4.84,7.07],floor=3.09;
 // The old cream rectangles are removed. A shadowed enclosure sits behind
 // a real 3.5m deep colonnade; cream survives only as recessed transoms.
 box(0,1.25,0,21,3.5,12,M.cutStoneDark);box(0,3.02,0,21.2,.14,12.2,M.cutStone);
 for(const z of[4.8,-4.5]){
  for(const x of lower){const base=6.55,head=bearingHeight139(x,z,false);post(x,z,floor,base-floor-.30,.29);C.capital(x,base,z,.92,1.28,Math.max(.22,(head-base)/1.30));}
  for(let i=0;i<lower.length-1;i++){const x=(lower[i]+lower[i+1])/2;C.capital(x,6.77,z,.51,1.30,Math.max(.22,(bearingHeight139(x,z,false)-6.77)/1.30));}box(0,6.63,z,19.2,.27,.38,M.wood);for(let i=0;i<66;i++){const a=-10+i*20/66,b=-10+(i+1)*20/66;between([a,bearingHeight139(a,z+.30,false)-.11,z+.30],[b,bearingHeight139(b,z+.30,false)-.11,z+.30],.20,.34,M.wood);}
  for(let i=0;i<lower.length-1;i++){const a=lower[i]+.16,b=lower[i+1]-.16;C.frieze(a,b,6.66,z+.24,.31);C.bayArch(a,b,7.16,z+.13);}
 }
 function windowBay(cx,z,width=2.75){
  box(cx,4.72,z,width,3.24,.18,M.dark);box(cx,4.65,z+.105,width-.28,2.60,.022,M.windowPaper);
  for(const dx of[-width/2+.06,width/2-.06]){box(cx+dx,4.73,z+.13,.13,3.23,.20,M.red);C.fitting(cx+dx,6.12,z+.25,.13,.20);}
  for(const y of[3.20,6.24])box(cx,y,z+.14,width,.14,.22,M.wood);
  for(let i=0;i<=14;i++)box(cx-(width-.31)/2+i*(width-.31)/14,4.65,z+.15,.025,2.60,.036,M.wood);
  for(let j=0;j<=15;j++)box(cx,3.35+j*2.60/15,z+.16,width-.28,.022,.035,M.bronze);
  box(cx,6.48,z,width-.15,.28,.16,M.ivory);C.frieze(cx-width/2,cx+width/2,6.61,z+.08,.20);
 }
 for(const x of[-7.5,-4.5,4.5,7.5])windowBay(x,1.19);
 for(const side of[-1,1])group(side*9.35,0,-1.13,side*Math.PI/2,()=>{box(0,4.71,0,8.7,3.3,.18,M.dark);for(const xx of[-2.85,0,2.85])windowBay(xx,.05,2.78);});
 box(0,4.80,-4.45,18.6,3.44,.22,M.dark);
 // A deep open portal frames the actual freestanding Buddha and altar.
 for(const x of[-2.65,2.65]){
  box(x,4.73,3.20,.36,3.45,.48,M.dark);box(x,4.73,3.455,.25,3.34,.035,M.bronze);
  for(let row=0;row<9;row++)C.flower(x,3.23+row*.36,3.485,.13);
 }
 box(0,6.37,3.30,5.66,.48,.50,M.wood);C.frieze(-2.83,2.83,6.39,3.58,.38);
 for(const sign of[-1,1])group(sign*3.05,0,2.5,sign*.80,()=>{box(0,4.70,0,1.52,3.12,.13,M.wood);C.frieze(-.72,.72,6.12,.09,.24);for(let j=0;j<11;j++)box(-.68+j*.136,4.70,.09,.035,2.65,.04,M.bronze);});
 box(-1.1,4.77,.14,4.45,3.25,.12,M.dark);
 for(let bay=0;bay<4;bay++){
  const cx=-2.72+bay*1.08;box(cx,4.77,.235,1.00,3.20,.055,M.bronze);
  for(const dx of[-.49,.49])box(cx+dx,4.77,.28,.05,3.22,.07,M.gold);
  for(let row=0;row<8;row++)for(const dx of[-.22,.22])C.flower(cx+dx,3.36+row*.39,.29,.185);
 }
 for(const [a,b]of[[-9.6,-3.6],[3.6,9.6]]){
  for(const y of[floor+.25,floor+.75])box((a+b)/2,y,5.73,b-a,.10,.13,M.red);
  for(let i=0;i<=Math.ceil((b-a)/.75);i++){const x=a+(b-a)*i/Math.ceil((b-a)/.75);box(x,floor+.48,5.73,.10,.95,.10,M.red);if(i%2===0){emit(railBoss,M.gold,x,floor+1.03,5.73,.09,.13,.09);}}
 }
 // The upper wall is recessed behind independent posts. The sill continues
 // across the lower capital grid and supports the upper gallery floor.
 box(0,8.05,.45,18.7,.24,10.5,M.dark);box(0,8.16,.45,18.5,.10,10.5,M.wood);box(0,8.02,5.35,19.0,.26,.36,M.wood);
 for(const x of lower)if(Math.abs(x)<9.1){const seat=bearingHeight139(x,4.80,false),top=7.945;box(x,(seat+top)/2,4.80,.32,top-seat+.020,.40,M.wood);}
 for(const z of[3.30,-4.45]){
  box(0,8.94,z,18.3,1.56,.18,M.dark);
  for(let i=0;i<upper.length-1;i++){
   const a=upper[i],b=upper[i+1],cx=(a+b)/2;
   for(const [y,h]of[[8.64,.25],[9.20,.28],[9.57,.17]])box(cx,y,z+.11,b-a-.20,h,.08,M.ivory);
   for(const y of[8.36,8.92,9.43])box(cx,y,z+.16,b-a,.14,.20,M.wood);
   C.frieze(a+.08,b-.08,8.94,z+.19,.19);C.bayArch(a,b,9.62,z+.14);
  }
 }
 for(const z of[5.20,-4.30]){
  for(const x of upper){const base=9.25;post(x,z,8.19,base-8.19-.30,.18);C.capital(x,base,z,.88,1.12,Math.max(.22,(bearingHeight139(x,z,true)-base)/1.30));C.fitting(x,8.73,z+.22,.22,.25);}
  for(let i=0;i<upper.length-1;i++){const x=(upper[i]+upper[i+1])/2;C.capital(x,9.66,z,.46,1.2,Math.max(.20,(bearingHeight139(x,z,true)-9.66)/1.30));}box(0,9.57,z,18.8,.18,.30,M.wood);C.frieze(-9.4,9.4,9.56,z+.20,.23);
  for(const y of[8.42,8.83])box(0,y,z+.26,18.6,.075,.10,M.red);
  for(let i=0;i<49;i++)box(-9.1+i*18.2/48,8.60,z+.26,.045,.43,.055,M.red);
 }
 for(const side of[-1,1])group(side*9.14,0,-.58,side*Math.PI/2,()=>{
  box(0,8.94,0,7.4,1.56,.15,M.dark);for(const y of[8.65,9.20])box(0,y,.09,7.2,.26,.07,M.ivory);for(const x of[-3.5,-1.17,1.17,3.5])box(x,8.95,.14,.13,1.65,.20,M.wood);
 });
 for(const x of[-9,-6,-3,3,6,9]){lantern(x,5.50,4.90,.80);lantern(x,9.50,5.25,.48);}
 return{revision:C.revision,lowerAxes:lower,upperAxes:upper,upperWallZ:3.30,upperPostZ:5.20,cream:'Narrow recessed transoms only',sillReceivers:lower.filter(x=>Math.abs(x)<9.1).map(x=>({x,z:4.80,bottom:bearingHeight139(x,4.80,false)-.010,top:7.955})),completeLoadPath:true};
}
