import {createCurvedEaveRafter} from './scene03-curved-rafter.js';
import {createCarvedReceivers106} from './scene03-carved-receivers106.js';
import {createSculptedTimber109} from './scene03-sculpted-timber109.js';
import {createKumimono211 as createBearing174} from './scene03-kumimono211-r11.js';

//109 replaces thin separated ranks with an occupied, stepped bearing canopy.
// All altered cross-sections, carved noses, cups, girts and returns are actual
// closed wood; the retained outer roof surface and site/camera are not moved.
export function buildHallCarpentry03(T,api){
 const {C,emit,box,grouped,role,mats,upper,lin,tube}=api,axes=[-5.70,-3.42,-1.14,1.14,3.42,5.70],wallZ=-.80;
 const owned=new Set(),keep=g=>{owned.add(g);return g;},carvedReceivers=createCarvedReceivers106(T,{emit,keep}),carving=createSculptedTimber109(T,keep);
 const curved=(points,w,h,ma='cedar')=>emit(keep(createCurvedEaveRafter(points,w,h)),ma);
 const bearing174=createBearing174(T,{emit,grouped,keep}),cluster=bearing174.cluster;
 function atticPanel174(half,base,topAt,depth,material='darkwood'){
  const shape=new T.Shape();shape.moveTo(-half,base);shape.lineTo(half,base);for(const u of lin(half,-half,80))shape.lineTo(u,topAt(u));shape.closePath();
  const g=keep(new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:2,curveSegments:24}));g.name='scene03-closed-roof-following-attic-diaphragm174';emit(g,material);
 }
 const seat=(x,z)=>{const t=(z-C.ridgeZ)/5.2,u=x/(api.upperWidth*(.275+.225*t));return upper.P(0,t,u)[1]-.30;},curveAt=(y,x,z)=>y+seat(x,z)-seat(0,z);
 function girt(y,z,half=6.03,w=.46,h=.31,ma='red'){curved(lin(-half,half,72).map(x=>[x,curveAt(y,x,z),z]),w,h,ma);}
 role('upper-rebuilt-connected-gallery211-r11',()=>{
  // A taller short-post storey replaces the low concealed wall and floating
  // thin rails. Real recessed panels and sill/head timbers fill this band.
  box(0,12.20,wallZ-.18,12.04,1.74,.30,'darkwood');
  box(0,12.20,-8.0,12.04,1.74,.30,'darkwood');
  for(const sign of[-1,1]){
   for(const y of[11.35,12.64,13.04])box(sign*5.94,y,-4.5,.34,.18,7.35,'red');
   for(const z of[-2.75,-4.95,-7.15])grouped(sign*5.94,0,z,sign*Math.PI/2,()=>{
    box(0,12.22,-.15,2.10,.74,.18,'roofFrieze');
    for(const edge of[-1,1]){box(edge*.98,12.24,.015,.095,1.55,.22,'cedar');box(0,12.22+edge*.43,.02,2.10,.10,.24,'red');}
    box(0,12.22,.10,.27,1.72,.38,'red');
   });
  }
  for(const[y,h,d]of[[11.35,.24,.40],[11.76,.14,.34],[12.64,.14,.34],[13.04,.24,.40]])girt(y,wallZ+.08,6.04,d,h,'red');
  const braceShape=new T.Shape();braceShape.moveTo(-.96,0);braceShape.lineTo(.96,0);braceShape.bezierCurveTo(.92,.10,.77,.12,.61,.16);braceShape.bezierCurveTo(.38,.20,.32,.32,.13,.34);braceShape.quadraticCurveTo(0,.41,-.13,.34);braceShape.bezierCurveTo(-.32,.32,-.38,.20,-.61,.16);braceShape.bezierCurveTo(-.77,.12,-.92,.10,-.96,0);braceShape.closePath();
  for(const sign of[-1,1]){const hole=new T.Path();hole.moveTo(sign*.72,.055);hole.lineTo(sign*.24,.055);hole.quadraticCurveTo(sign*.20,.16,sign*.24,.22);hole.bezierCurveTo(sign*.39,.20,sign*.43,.12,sign*.57,.105);hole.quadraticCurveTo(sign*.69,.09,sign*.72,.055);hole.closePath();braceShape.holes.push(hole);}
  const brace=keep(new T.ExtrudeGeometry(braceShape,{depth:.18,steps:1,curveSegments:20,bevelEnabled:true,bevelSize:.010,bevelThickness:.010,bevelSegments:2}));brace.name='scene03-r11-pierced-double-shoulder-gallery-brace';
  for(let i=0;i<axes.length-1;i++){
   const x=(axes[i]+axes[i+1])/2,w=axes[i+1]-axes[i]-.30;
   box(x,12.20,wallZ-.045,w,.74,.18,'roofFrieze');
   for(const sign of[-1,1]){box(x,12.20+sign*.43,wallZ+.08,w+.06,.10,.22,'cedar');box(x+sign*(w/2+.015),12.20,wallZ+.07,.075,.92,.20,'red');}
   api.rosette(x,12.20,wallZ+.16,.105,'oldgold');
   emit(brace,'gableCarving',x,12.65,wallZ+.03,w/1.96,1,1);
  }
  for(const x of axes){box(x,12.20,wallZ+.16,.27,1.72,.42,'red');box(x,12.88,wallZ+.16,.36,.12,.47,'cedar');}
  for(const y of[11.55,11.84])girt(y,-.30,6.02,.11,.085,'red');
  for(let i=0;i<=29;i++)box(-5.94+i*11.88/29,11.69,-.30,.040,.35,.085,'red');
 });
 role('upper-rebuilt-fine-carved-kumimono211-r11',()=>{
  grouped(0,0,-1.57,0,()=>atticPanel174(5.98,13.04,x=>seat(x,-1.38)+.11,.34));
  for(const[y,z,w,h]of[[13.04,-.72,.40,.24],[13.41,-.65,.22,.12],[13.69,-.30,.20,.12],[14.15,.333,.22,.13]])girt(y,z,6.03,w,h,'cedar');
  for(const x of axes){const base=curveAt(13.04,x,-.80),front=-.80+1.10*1.03;cluster(x,base,-.80,seat(x,front)-.13,1.0,true,1.03);}
  // Rafters keep a constant transverse station. Their inner cuts stop at
  // the actual hip; the former fixed-u rows incorrectly fanned to the ridge.
  for(let j=1;j<80;j++){
   const x=(-1+2*j/80)*api.upperWidth*(.275+.225*1.115);
   for(const [start,end,drop,w,h,ma]of[[.34,1.115,.32,.14,.22,'cedar'],[.76,1.13,.56,.12,.17,'red']]){
    const lo=Math.max(start,(Math.abs(x)/api.upperWidth-.275)/.225+.002);if(lo>=end)continue;
    curved(lin(lo,end,18).map(t=>{const p=upper.P(0,t,x/(api.upperWidth*(.275+.225*t)));p[1]-=drop;return p;}),w,h,ma);
   }
  }
  for(const t of[.51,.68,.84,1.0])curved(lin(-1,1,80).map(u=>{const p=upper.P(0,t,u);p[1]-=.39;return p;}),.35,.25,'cedar');
 });
 role('upper-return-occupied-bearing174',()=>{
  const height=(x,z)=>{
   const hw=api.upperWidth/2,rh=api.upperWidth*.275,hd=5.2,tx=Math.max(0,(Math.abs(x)-rh)/(hw-rh)),tz=Math.abs(z-C.ridgeZ)/hd,t=Math.max(tx,tz,.0001);
   return tx>tz?upper.P(x>0?1:3,t,(z-C.ridgeZ)/(hd*t))[1]:upper.P(z>C.ridgeZ?0:2,t,x/(rh+(hw-rh)*t))[1];
  };
  for(const sign of[-1,1]){
   grouped(sign*5.60,0,-4.50,sign*Math.PI/2,()=>atticPanel174(3.46,13.02,u=>height(sign*5.60,-4.50-sign*u)-.19,.42));
   for(const z of[-2.75,-4.95,-7.15])grouped(sign*5.60,0,z,sign*Math.PI/2,()=>{
    box(0,13.56,.44,1.74,.36,.10,'roofFrieze');
    for(const edge of[-1,1]){box(edge*.93,13.58,.49,.09,.65,.20,'cedar');box(0,13.56+edge*.24,.49,1.96,.09,.20,'red');}
   });
  }
  for(const sign of[-1,1])for(const z of[-2.75,-4.95,-7.15]){
   const x=sign*5.94,ds=.68,s=.87,top=Math.min(...lin(-1.12*s,1.12*s,16).map(a=>height(x+sign*1.10*ds,z+a)-.43));
   grouped(x,0,z,sign*Math.PI/2,()=>cluster(0,13.04,0,top,s,true,ds));
  }
 });
 return{axes,get bearingSets(){return bearing174.instances;},bearingSeats174:bearing174.seats,get carvedReceiverFaces(){return carvedReceivers.count;},get deepCarvedNoses(){return 0;},bearingCluster:cluster,wallClosed:true,construction:bearing174.construction,dispose(){for(const g of owned)g.dispose();}};
}
