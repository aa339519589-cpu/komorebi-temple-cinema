import {createCurvedEaveRafter} from './scene03-curved-rafter.js';
import {createCarvedReceivers106} from './scene03-carved-receivers106.js';
import {createSculptedTimber109} from './scene03-sculpted-timber109.js';
import {createBearing211 as createBearing174} from './scene03-bearing211.js';

//109 replaces thin separated ranks with an occupied, stepped bearing canopy.
// All altered cross-sections, carved noses, cups, girts and returns are actual
// closed wood; the retained outer roof surface and site/camera are not moved.
export function buildHallCarpentry03(T,api){
 const {C,emit,box,grouped,role,mats,upper,lin,tube}=api,axes=[-5.70,-3.42,-1.14,1.14,3.42,5.70],wallZ=-1.10;
 const owned=new Set(),keep=g=>{owned.add(g);return g;},carvedReceivers=createCarvedReceivers106(T,{emit,keep}),carving=createSculptedTimber109(T,keep);
 const curved=(points,w,h,ma='cedar')=>emit(keep(createCurvedEaveRafter(points,w,h)),ma);
 const bearing174=createBearing174(T,{emit,grouped,keep}),cluster=bearing174.cluster;
 function atticPanel174(half,base,topAt,depth,material='darkwood'){
  const shape=new T.Shape();shape.moveTo(-half,base);shape.lineTo(half,base);for(const u of lin(half,-half,80))shape.lineTo(u,topAt(u));shape.closePath();
  const g=keep(new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:2,curveSegments:24}));g.name='scene03-closed-roof-following-attic-diaphragm174';emit(g,material);
 }
 const seat=(x,z)=>{const t=(z-C.ridgeZ)/5.2,u=x/(api.upperWidth*(.275+.225*t));return upper.P(0,t,u)[1]-.30;},curveAt=(y,x,z)=>y+seat(x,z)-seat(0,z);
 function girt(y,z,half=6.03,w=.46,h=.31,ma='red'){curved(lin(-half,half,72).map(x=>[x,curveAt(y,x,z),z]),w,h,ma);}
 role('upper-compressed-deep-gallery109',()=>{
  // Short enclosed gallery and thick top rail carry the expanded capitals.
  box(0,11.66,wallZ-.20,12.02,1.18,.38,'darkwood');
  for(const sign of[-1,1]){
   for(const y of[11.10,12.16])box(sign*5.94,y,-4.5,.48,.26,7.3,'red');
   for(const z of[-2.75,-4.95,-7.15])grouped(sign*5.94,0,z,sign*Math.PI/2,()=>{
    box(0,11.66,-.16,2.18,.86,.22,'roofFrieze');
    for(const edge of[-1,1]){box(edge*.98,11.70,.045,.14,1.05,.27,'red');box(0,11.70+edge*.46,.025,2.12,.12,.25,'cedar');}
    for(let j=-4;j<=4;j++)box(j*.20,11.99,.015,.035,.30,.15,'cedar');
    box(0,11.67,.14,.43,1.27,.47,'red');
   });
  }
  box(0,11.66,-8.0,12.02,1.18,.34,'darkwood');
  for(const[y,h]of[[11.14,.25],[11.96,.22],[12.22,.34]])girt(y,wallZ+.04,6.06,.49,h,'red');
  for(let i=0;i<axes.length-1;i++){
   const x=(axes[i]+axes[i+1])/2,w=axes[i+1]-axes[i]-.48;
   box(x,11.59,wallZ-.025,w,.39,.17,'roofFrieze');
   for(const sign of[-1,1])box(x,11.59+sign*.23,wallZ+.09,w+.08,.075,.11,'cedar');
   for(let j=1;j<8;j++)box(x-w/2+w*j/8,11.98,wallZ+.005,.050,.32,.15,'cedar');
   for(const sign of[-1,1])box(x+sign*(w/2+.03),11.65,wallZ+.085,.09,.73,.20,'red');
   carvedReceivers.face(x,11.61,wallZ+.15,.40,.28,.44);
  }
  for(const x of axes){
   box(x,11.68,wallZ+.10,.43,1.30,.55,'red');
   emit(carving.scrollFace(1),'darkwood',x,11.65,wallZ+.39,.29,.73,.15);
   for(const sign of[-1,1])tube([[x,11.36,wallZ+.435],[x+sign*.10,11.48,wallZ+.46],[x+sign*.08,11.70,wallZ+.46],[x,11.91,wallZ+.435]],.016,'oldgold',24);
  }
  for(const y of[11.15,11.42])girt(y,-.36,6.04,.15,.12,'red');
  for(let i=0;i<=34;i++)box(-5.96+i*11.92/34,11.28,-.36,.065,.40,.10,'red');
 });
 role('upper-occupied-four-rank-bearing-canopy109',()=>{
  // Rear diaphragm, girts and the front/rear arm depths create one shadow
  // canopy. No new outer roof or camera contour is introduced.
  grouped(0,0,-1.72,0,()=>atticPanel174(5.98,12.22,x=>seat(x,-1.48)+.11,.40));
  for(let i=0;i<axes.length-1;i++){
   const x=(axes[i]+axes[i+1])/2,w=axes[i+1]-axes[i]-.39;
   box(x,13.30,-1.285,w,.74,.11,'roofFrieze');
   for(const edge of[-1,1]){box(x+edge*(w/2+.045),13.33,-1.18,.09,1.04,.20,'cedar');box(x,13.30+edge*.42,-1.18,w+.14,.10,.20,'red');}
   for(let j=-3;j<=3;j++)box(x+j*w/8,13.90,-1.20,.042,.34,.16,'cedar');
  }
  for(const[y,z,w,h]of[[12.25,-.94,.58,.34],[13.04,-.86,.43,.32],[13.97,-.78,.45,.20],[14.12,.45,.39,.27]])girt(y,z,6.05,w,h,'red');
  for(const x of axes)cluster(x,curveAt(12.25,x,-.95),-.95,seat(x,.64)-.13,1.05,true,1.03);
  // A real pierced kaerumata spans each intercolumn bay. The previous
  // half-pitch copy of the whole four-rank capital made a checkerboard of
  // unsupported noses and concealed the distinction between post and bay.
  const frog=carving.frogStrut();frog.computeBoundingBox();
  for(let i=0;i<axes.length-1;i++){
   const x=(axes[i]+axes[i+1])/2,base=curveAt(13.04,x,-.86)+.16;
   const head=curveAt(13.97,x,-.78)-.10;
   emit(frog,'gableCarving',x,base,-.78,.60,(head-base)/frog.boundingBox.max.y,.82);
   for(const sign of[-1,1]){
    // The two short sill blocks house the through-thickness strut feet.
    box(x+sign*.53,base-.025,-.78,.30,.10,.47,'cedar');
    tube([[x+sign*.60,base+.045,-.61],[x+sign*.45,base+.105,-.59],[x+sign*.30,base+.27,-.59],[x+sign*.14,base+.37,-.61]],.011,'oldgold',18);
   }
  }
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
   grouped(sign*5.60,0,-4.50,sign*Math.PI/2,()=>atticPanel174(3.46,12.18,u=>height(sign*5.60,-4.50-sign*u)-.19,.42));
   for(const z of[-2.75,-4.95,-7.15])grouped(sign*5.60,0,z,sign*Math.PI/2,()=>{
    box(0,13.20,.44,1.74,.95,.10,'roofFrieze');
    for(const edge of[-1,1]){box(edge*.93,13.27,.49,.12,1.29,.20,'cedar');box(0,13.20+edge*.54,.49,1.96,.12,.20,'red');}
   });
  }
  for(const sign of[-1,1])for(const z of[-2.75,-4.95,-7.15]){
   const x=sign*5.94,ds=.68,s=.87,top=Math.min(...lin(-1.12*s,1.12*s,16).map(a=>height(x+sign*1.43*ds,z+a)-.43));
   grouped(x,0,z,sign*Math.PI/2,()=>cluster(0,12.25,0,top,s,true,ds));
  }
 });
 return{axes,get bearingSets(){return bearing174.instances;},bearingSeats174:bearing174.seats,get carvedReceiverFaces(){return carvedReceivers.count;},get deepCarvedNoses(){return 0;},bearingCluster:cluster,wallClosed:true,construction:bearing174.construction,dispose(){for(const g of owned)g.dispose();}};
}
