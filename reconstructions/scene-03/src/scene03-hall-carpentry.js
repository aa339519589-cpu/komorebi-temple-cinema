import {createCurvedEaveRafter} from './scene03-curved-rafter.js';
import {createCarvedReceivers106} from './scene03-carved-receivers106.js';
import {createSculptedTimber109} from './scene03-sculpted-timber109.js';

//109 replaces thin separated ranks with an occupied, stepped bearing canopy.
// All altered cross-sections, carved noses, cups, girts and returns are actual
// closed wood; the retained outer roof surface and site/camera are not moved.
export function buildHallCarpentry03(T,api){
 const {C,emit,box,grouped,role,mats,upper,lin,tube}=api,axes=[-5.70,-3.80,-1.90,0,1.90,3.80,5.70],wallZ=-1.10;
 const owned=new Set(),keep=g=>{owned.add(g);return g;},carvedReceivers=createCarvedReceivers106(T,{emit,keep}),carving=createSculptedTimber109(T,keep);let bearingSets=0,deepCarvedNoses=0;
 const curved=(points,w,h,ma='cedar')=>emit(keep(createCurvedEaveRafter(points,w,h)),ma);
 function cushion(width,height){
  const N=32,R=9,p=[],uv=[],ids=[];
  for(let j=0;j<=R;j++){const t=j/R,r=width/2*(.60+.40*Math.sin(t*Math.PI/2));for(let i=0;i<N;i++){const a=i/N*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);p.push(r*Math.sign(ca)*Math.abs(ca)**.30,height*t,r*Math.sign(sa)*Math.abs(sa)**.30);uv.push(i/N,t);}}
  for(let j=0;j<R;j++)for(let i=0;i<N;i++){const a=j*N+i,b=j*N+(i+1)%N;ids.push(a,b,a+N,b,b+N,a+N);}
  const q=p.length/3;p.push(0,0,0,0,height,0);uv.push(.5,0,.5,1);for(let i=0;i<N;i++)ids.push(q,(i+1)%N,i,q+1,R*N+i,R*N+(i+1)%N);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.name='scene03-closed-deep-dou-bearing-cup109';return keep(g);
 }
 const arms=[[1.24,.42],[1.60,.39],[1.80,.42],[1.90,.39],[2.04,.42],[1.52,.36]].map(([l,d],rank)=>carving.cantileverArm(l,d,rank)),dou=[cushion(.76,.30),cushion(.43,.24),cushion(.38,.23),cushion(.34,.20)];
 function endNose(x,y,z,w,h,detail=true,seed=0){
  emit(carving.bearingHead(seed%3),'endwood',x,y-.015,z,w*.96,h*.94,.38);deepCarvedNoses++;
  // Gold survives as narrow worn edge/chased ribs on real carved timber.
  if(detail)for(const sign of[-1,1])tube([[x+sign*w*.04,y-h*.20,z+.12],[x+sign*w*.28,y-h*.14,z+.135],[x+sign*w*.28,y+h*.12,z+.135],[x+sign*w*.10,y+h*.18,z+.12],[x+sign*w*.07,y,z+.14]],.0065,'oldgold',25);
 }
 function cluster(x,base,z,top,scale=1,major=true,depthScale=scale){
  const sy=(top-base)/2.08;if(!(sy>0))throw Error('109 bearing canopy needs a positive load path');
  grouped(x,base,z,0,()=>{
   emit(dou[0],'red',0,0,0,scale,sy,depthScale);
   emit(arms[0],'cedar',0,.39*sy,-.04*depthScale,scale,sy,depthScale);
   emit(arms[0],'red',0,.40*sy,0,depthScale,sy,scale,Math.PI/2);
   for(const sign of[-1,1]){
    emit(dou[1],'red',sign*.34*scale,.47*sy,.02*depthScale,scale,sy,depthScale);
    emit(arms[1],'cedar',sign*.34*scale,.75*sy,.18*depthScale,depthScale,sy,scale,Math.PI/2);
   }
   emit(arms[2],'red',0,1.04*sy,.46*depthScale,scale,sy,depthScale);
   for(const sign of[-1,1]){
    emit(dou[2],'cedar',sign*.48*scale,1.10*sy,.53*depthScale,scale,sy,depthScale);
    emit(arms[3],'cedar',sign*.48*scale,1.37*sy,.53*depthScale,depthScale,sy,scale,Math.PI/2);
   }
   emit(arms[4],'red',0,1.64*sy,.95*depthScale,scale,sy,depthScale);
   for(const sign of[-1,1]){
    emit(dou[3],'cedar',sign*.59*scale,1.70*sy,1.03*depthScale,scale,sy,depthScale);
    emit(arms[5],'cedar',sign*.59*scale,1.88*sy,.96*depthScale,depthScale,sy,scale,Math.PI/2);
   }
   curved([[-1.09*scale,1.98*sy,1.14*depthScale],[0,1.94*sy,1.14*depthScale],[1.09*scale,1.98*sy,1.14*depthScale]],.36*depthScale,.20*sy,'cedar');
   // End grain is now a full curved carved volume instead of a gold square.
   endNose(0,.39*sy,.675*depthScale,.39*scale,.36*sy,major,0);
   for(const sign of[-1,1]){
    endNose(sign*.34*scale,.75*sy,.995*depthScale,.38*scale,.34*sy,major,1);
    endNose(sign*.48*scale,1.37*sy,1.50*depthScale,.36*scale,.32*sy,major,2);
    if(major)endNose(sign*.59*scale,1.88*sy,1.745*depthScale,.32*scale,.28*sy,true,0);
   }
  });bearingSets++;
 }
 const seat=(x,z)=>{const t=(z-C.ridgeZ)/5.2,u=x/(api.upperWidth*(.275+.225*t));return upper.P(0,t,u)[1]-.30;},curveAt=(y,x,z)=>y+seat(x,z)-seat(0,z);
 function girt(y,z,half=6.03,w=.46,h=.31,ma='red'){curved(lin(-half,half,72).map(x=>[x,curveAt(y,x,z),z]),w,h,ma);}
 role('upper-compressed-deep-gallery109',()=>{
  // Short enclosed gallery and thick top rail carry the expanded capitals.
  box(0,11.66,wallZ-.20,12.02,1.18,.38,'darkwood');
  for(const sign of[-1,1])box(sign*5.94,11.66,-4.50,.34,1.18,7.1,'darkwood');
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
  for(let i=0;i<axes.length-1;i++)box((axes[i]+axes[i+1])/2,12.82,-1.48,1.72,1.38,.25,'darkwood');
  for(const[y,z,w,h]of[[12.25,-.94,.58,.34],[12.90,-.54,.47,.33],[13.56,-.04,.43,.30],[14.12,.45,.39,.27]])girt(y,z,6.05,w,h,'red');
  for(const x of axes)cluster(x,curveAt(12.25,x,-.95),-.95,seat(x,.64)-.13,1.05,true,1.03);
  for(let i=0;i<axes.length-1;i++){
   const x=(axes[i]+axes[i+1])/2;cluster(x,curveAt(12.94,x,-1.01),-1.01,seat(x,.56)-.16,.67,false,.88);
  }
  for(let j=0;j<=80;j++){
   const u=-1+2*j/80;
   curved(lin(.34,1.115,18).map(t=>{const p=upper.P(0,t,u);p[1]-=.32;return p;}),.14,.22,'cedar');
   curved(lin(.76,1.13,12).map(t=>{const p=upper.P(0,t,u);p[1]-=.56;return p;}),.12,.17,'red');
  }
  for(const t of[.51,.68,.84,1.0])curved(lin(-1,1,80).map(u=>{const p=upper.P(0,t,u);p[1]-=.39;return p;}),.35,.25,'cedar');
 });
 return{axes,get bearingSets(){return bearingSets;},get carvedReceiverFaces(){return carvedReceivers.count;},get deepCarvedNoses(){return deepCarvedNoses;},bearingCluster:cluster,wallClosed:true,construction:'109R02 four-rank lapped canopy: waisted variable-depth canted arms, rounded volute end bodies, swept top seats and occupied rear diaphragm',dispose(){for(const g of owned)g.dispose();}};
}
