import {createCurvedEaveRafter} from './scene03-curved-rafter.js';
import {createCarvedReceivers106} from './scene03-carved-receivers106.js';

// Scene03's visible upper hall, authored from the reference silhouette. The
// gallery is a shallow, closed timber body. Three projecting bearing levels
// belong to each column head; they are not independent rows of ornament.
// Every arm, cushion, receiver, wall field and rail is an independently lit
// closed solid. No scene photograph, inferred depth or image plane is used.
export function buildHallCarpentry03(T,api){
 const {C,emit,box,grouped,role,between,mats,upper,lin,tube,rosette}=api;
 const axes=[-5.70,-3.80,-1.90,0,1.90,3.80,5.70],wallZ=-.98;
 const owned=new Set();let bearingSets=0;
 const keep=g=>{owned.add(g);return g;};
 const carvedReceivers=createCarvedReceivers106(T,{emit,keep});
 const curved=(points,w,h,ma='cedar')=>emit(keep(createCurvedEaveRafter(points,w,h)),ma);
 function extrude(shape,depth,bevel=.012){const g=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:12,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2});g.translate(0,0,-depth/2);return keep(g);}
 // Broad cambered hijiki with deep hooked shoulders. Their upper bearing
 // faces stay horizontal; the curve is in the load-carrying timber itself.
 function arm(length=1.4,depth=.29){
  const h=length/2,s=new T.Shape();s.moveTo(-h,.12);s.lineTo(h,.12);
  s.quadraticCurveTo(h+.035,.005,h-.055,-.025);
  s.bezierCurveTo(h-.19,-.025,h-.16,-.15,h-.27,-.155);
  s.bezierCurveTo(h-.39,-.17,.25,-.255,.13,-.255);s.lineTo(-.13,-.255);
  s.bezierCurveTo(-.25,-.255,-h+.39,-.17,-h+.27,-.155);
  s.bezierCurveTo(-h+.16,-.15,-h+.19,-.025,-h+.055,-.025);
  s.quadraticCurveTo(-h-.035,.005,-h,.12);s.closePath();return extrude(s,depth);
 }
 function cushion(width=.40,height=.17){
  const N=24,rows=8,p=[],uv=[],ids=[];
  for(let j=0;j<=rows;j++){
   const t=j/rows,r=width/2*(.66+.34*Math.sin(t*Math.PI/2));
   for(let i=0;i<N;i++){const a=i/N*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);p.push(r*Math.sign(ca)*Math.pow(Math.abs(ca),.28),height*t,r*Math.sign(sa)*Math.pow(Math.abs(sa),.28));uv.push(i/N,t);}
  }
  for(let j=0;j<rows;j++)for(let i=0;i<N;i++){const a=j*N+i,b=j*N+(i+1)%N;ids.push(a,b,a+N,b,b+N,a+N);}
  const lo=p.length/3;p.push(0,0,0,0,height,0);uv.push(.5,0,.5,1);
  for(let i=0;i<N;i++){ids.push(lo,(i+1)%N,i,lo+1,rows*N+i,rows*N+(i+1)%N);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return keep(g);
 }
 const arms=[arm(1.02,.30),arm(1.42,.28),arm(1.74,.27)],dou=[cushion(.64,.23),cushion(.35,.16),cushion(.31,.14)];
 // Applied metal is a narrow edge binding around exposed end grain, with
 // one chased boss at major ends. It never replaces a member with gold.
 function endBinding(x,y,z,w,h,scale=1,detail=false){
  const b=.013*scale;
  box(x,y,z-.008,w,h,.035,'endwood');
  for(const sign of[-1,1]){box(x+sign*(w-b)/2,y,z+.016,b,h,.018,'bearingGilt');box(x,y+sign*(h-b)/2,z+.016,w-2*b,b,.018,'bearingGilt');}
  if(detail)carvedReceivers.face(x,y,z,w*.76,h*.76,.23);
 }
 function cluster(x,base,z,top,scale=1,major=true,depthScale=scale){
  const sy=(top-base)/1.65;
  grouped(x,base,z,0,()=>{
   // A daito on the shaft carries the first orthogonal, half-lapped pair.
   emit(dou[0],'red',0,0,0,scale,sy,depthScale);
   emit(arms[0],'cedar',0,.34*sy,0,scale,sy,depthScale);
   emit(arms[0],'cedar',0,.36*sy,0,depthScale,sy,scale,Math.PI/2);
   // Each later level steps toward the eave and rests on separate cushions.
   for(const sign of[-1,1]){
    emit(dou[1],'red',sign*.32*scale,.46*sy,.02*depthScale,scale,sy,depthScale);
    emit(arms[1],'cedar',sign*.32*scale,.75*sy,.20*depthScale,depthScale,sy,scale,Math.PI/2);
   }
   emit(arms[1],'red',0,.78*sy,.48*depthScale,scale,sy,depthScale);
   for(const sign of[-1,1]){
    emit(dou[2],'red',sign*.46*scale,.91*sy,.48*depthScale,scale,sy,depthScale);
    emit(arms[2],'cedar',sign*.46*scale,1.20*sy,.48*depthScale,depthScale,sy,scale,Math.PI/2);
   }
   emit(arms[2],'red',0,1.22*sy,.83*depthScale,scale,sy,depthScale);
   for(const sign of[-1,1])emit(dou[2],'cedar',sign*.53*scale,1.34*sy,.83*depthScale,scale,sy,depthScale);
   box(0,1.57*sy,.83*depthScale,1.78*scale,.16*sy,.33*depthScale,'cedar');
   // Beam tails are at the actual front ends of the projecting arms.
   endBinding(0,.37*sy,.535*depthScale,.30*scale,.21*sy,scale,major);
   for(const sign of[-1,1])endBinding(sign*.32*scale,.77*sy,.93*depthScale,.28*scale,.20*sy,scale,major);
   for(const sign of[-1,1])endBinding(sign*.46*scale,1.22*sy,1.365*depthScale,.27*scale,.20*sy,scale,major);
   if(major)for(const [length,y,zz]of[[1.02,.34,0],[1.42,.78,.48],[1.74,1.22,.83]]){
    const h=length/2;
    for(const sign of[-1,1])tube([[sign*h*scale,(y+.075)*sy,(zz+.16)*depthScale],[sign*(h-.08)*scale,(y-.035)*sy,(zz+.17)*depthScale],[sign*(h-.27)*scale,(y-.16)*sy,(zz+.17)*depthScale],[sign*.13*scale,(y-.245)*sy,(zz+.16)*depthScale]],.009,'oldgold',24);
   }
  });bearingSets++;
 }
 const seat=(x,z)=>{const t=(z-C.ridgeZ)/5.2,u=x/(api.upperWidth*(.275+.225*t));return upper.P(0,t,u)[1]-.30;};
 const curveAt=(y,x,z)=>y+seat(x,z)-seat(0,z);
 function girt(y,z,half=5.96,w=.34,h=.25,ma='red'){
  curved(lin(-half,half,72).map(x=>[x,curveAt(y,x,z),z]),w,h,ma);
 }
 role('upper-gallery-closed-timber-panels-and-rail',()=>{
  // Closed deep returns replace the former open two-rail rectangular frame.
  box(0,11.92,wallZ-.12,11.96,2.02,.22,'darkwood');
  for(const sign of[-1,1])box(sign*5.92,11.92,-4.50,.22,2.02,7.0,'darkwood');
  box(0,11.92,-8.0,11.95,2.02,.22,'darkwood');
  for(const y of[11.08,12.22,12.74])girt(y,wallZ+.02,6.0,.34,y===12.74?.30:.18,'red');
  for(let i=0;i<axes.length-1;i++){
   const x=(axes[i]+axes[i+1])/2,w=axes[i+1]-axes[i]-.42;
   box(x,11.73,wallZ+.025,w,.57,.11,'roofFrieze');
   for(const sign of[-1,1])box(x,11.73+sign*.31,wallZ+.09,w+.06,.055,.045,'oldgold');
   // Recessed transom lattice is small enough to read as timber depth.
   for(let j=1;j<7;j++)box(x-w/2+w*j/7,12.36,wallZ+.015,.038,.34,.085,'cedar');
   box(x,12.36,wallZ+.07,w,.07,.08,'red');
   // Carved cloud crowns stand on the wall's cap beam, not in free air.
   const crown=new T.Shape();crown.moveTo(-.46,0);crown.bezierCurveTo(-.54,.11,-.44,.20,-.31,.17);crown.bezierCurveTo(-.40,.34,-.20,.40,-.11,.28);crown.quadraticCurveTo(-.05,.47,0,.43);crown.quadraticCurveTo(.05,.47,.11,.28);crown.bezierCurveTo(.20,.40,.40,.34,.31,.17);crown.bezierCurveTo(.44,.20,.54,.11,.46,0);crown.closePath();
   for(const sign of[-1,1]){const h=new T.Path();h.moveTo(sign*.045,.055);h.bezierCurveTo(sign*.04,.25,sign*.20,.34,sign*.27,.27);h.bezierCurveTo(sign*.13,.31,sign*.22,.12,sign*.39,.10);h.quadraticCurveTo(sign*.23,.055,sign*.045,.055);crown.holes.push(h);}
   emit(extrude(crown,.095,.009),'oldgold',x,12.27,wallZ+.16);
   for(const sign of[-1,1])tube([[x+sign*.08,12.34,wallZ+.235],[x+sign*.16,12.47,wallZ+.25],[x+sign*.29,12.51,wallZ+.24],[x+sign*.35,12.45,wallZ+.235]],.018,'bearingGilt',20);
   carvedReceivers.face(x,11.73,wallZ+.070,.25,.32,.28);
  }
  for(const x of axes){
   box(x,11.93,wallZ+.08,.29,2.04,.39,'red');
   for(const y of[11.22,12.15,12.65])endBinding(x,y,wallZ+.29,.34,.17,1,false);
   box(x,11.75,wallZ+.285,.245,.65,.032,'darkwood');
   for(const sign of[-1,1])tube([[x,11.47,wallZ+.32],[x+sign*.075,11.57,wallZ+.34],[x+sign*.055,11.78,wallZ+.35],[x+sign*.085,11.96,wallZ+.34],[x,12.05,wallZ+.32]],.019,'oldgold',24);
  }
  // One shallow exterior gallery balustrade crosses the pale recessed fields.
  for(const y of[11.15,11.42])girt(y,-.34,6.00,.105,.09,'red');
  for(let i=0;i<=34;i++)box(-5.95+i*11.9/34,11.27,-.34,.055,.39,.065,'red');
 });
 role('upper-three-step-interlocking-bearing-clusters',()=>{
  // The roof load runs through continuous girts into seven main stations.
  for(const [y,z,w,h]of[[12.83,-.77,.46,.30],[13.43,-.30,.36,.26],[14.03,.16,.32,.22]])girt(y,z,6.02,w,h,'red');
  for(const x of axes){
   const top=seat(x,.56)-.13,base=curveAt(12.77,x,-.81);
   cluster(x,base,-.81,top,.98,true);
  }
  // Intermediate bearing blocks carry the common receiver between columns.
  for(let i=0;i<axes.length-1;i++){
   const x=(axes[i]+axes[i+1])/2,base=curveAt(13.40,x,-.31),top=seat(x,.52)-.13;
   cluster(x,base,-.31,top,.58,false);
  }
  // Principal rafters continue back over the real building body. A second
  // short flying course produces the broad, warm, two-depth eave soffit.
  for(let j=0;j<=80;j++){
   const u=-1+2*j/80;
   curved(lin(.38,1.11,16).map(t=>{const p=upper.P(0,t,u);p[1]-=.305;return p;}),.108,.18,'cedar');
   curved(lin(.77,1.13,10).map(t=>{const p=upper.P(0,t,u);p[1]-=.52;return p;}),.095,.13,'red');
   const p=upper.P(0,1.125,u);endBinding(p[0],p[1]-.51,p[2]+.038,.097,.13,.55,j%5===0);
  }
  for(const t of[.62,.80,.97])curved(lin(-1,1,80).map(u=>{const p=upper.P(0,t,u);p[1]-=.34;return p;}),.27,.20,'cedar');
 });
 return {axes,get bearingSets(){return bearingSets;},get carvedReceiverFaces(){return carvedReceivers.count;},bearingCluster:cluster,wallClosed:true,construction:'Three stepped connected bearing levels, closed recessed gallery, fitted pierced/cupped cast foliate receiver faces',dispose(){for(const g of owned)g.dispose();}};
}
