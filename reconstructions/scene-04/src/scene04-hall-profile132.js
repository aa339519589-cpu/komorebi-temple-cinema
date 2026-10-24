import {setTurnedShaftTimberUV04} from './scene04-timber-precision134.js';
// Common architectural contour/structure, inferred from the whole photograph.
// Numeric observations never become image UVs, albedo or scene radiance.
export function createHallProfile132(C){
 const origin=C.hallOrigin??[.12,0,-.10],half=6.45,front=1.55,back=-2.4,ridgeHalf=C.upperRoofWidth*(C.upperRidgeHalfRatio??.312),fullHalf=C.upperRoofWidth/2,neckPower=3.25,pitchPower=1.87,
 contour=[[0,11.50],[.10,11.38],[.24,10.99],[.42,10.45],[.60,10.00],[.76,9.56],[.90,9.28],[1,9.16]],lerp=(a,b,t)=>a+(b-a)*t,clamp=t=>Math.max(0,Math.min(1,t));
 function arch(x){const u=clamp(Math.abs(x)/half);let i=0;while(i<contour.length-2&&u>contour[i+1][0])i++;const a=contour[i],b=contour[i+1],before=contour[Math.max(0,i-1)],after=contour[Math.min(contour.length-1,i+2)],h=b[0]-a[0],t=(u-a[0])/h,ma=i===0?0:(b[1]-before[1])/(b[0]-before[0]),mb=(after[1]-a[1])/(after[0]-a[0]);return(2*t*t*t-3*t*t+1)*a[1]+(t*t*t-2*t*t+t)*h*ma+(-2*t*t*t+3*t*t)*b[1]+(t*t*t-t*t)*h*mb;}
 const span=t=>ridgeHalf+(fullHalf-ridgeHalf)*Math.pow(clamp(t),neckPower)+Math.max(0,t-1)*(fullHalf-ridgeHalf)*.75,height=(t,u)=>C.upperEaveY+(C.ridgeY-C.upperEaveY)*Math.pow(Math.max(0,1-t),pitchPower)+C.upperRoofCurl*Math.pow(clamp(t),8)*(.22+.78*Math.pow(Math.abs(u),6))+Math.max(0,t-1)*1.2,canopy=(x,z)=>arch(x)+.35*(front-z)/(front-back);
 function mainPoint(side,t,u){let x,z;const s=span(t);if(side===0||side===2){x=u*s;z=(side===0?1:-1)*4.5*t;}else{x=(side===1?1:-1)*s;z=u*4.5*t;}return[x+lerp(C.upperRidgeOffsetX,C.upperEaveOffsetX,t),height(t,u),C.ridgeZ+z];}
 function upperRaw(x,z){const t=clamp((z-C.ridgeZ)/4.5),u=(x-lerp(C.upperRidgeOffsetX,C.upperEaveOffsetX,t))/span(t);return height(t,u);}
 return{origin,half,front,back,arch,canopy,span,mainPoint,upperRaw,neckPower,pitchPower,ridgeHalf,contour};
}
export function buildHallBearing132(T,{emit,box,between,profile,C}){
 box(C.upperRidgeOffsetX,C.ridgeY-.30,C.ridgeZ,profile.ridgeHalf*2+.12,.30,.34,'cedar');
 // A closed hall roof has real interior bearing paths, including the loft.
 // Cross ties sit on the rear hall frames; king posts and braces carry the
 // principal purlins rather than leaving a large unsupported weather skin.
 for(const z of[-7.8,-3.6]){box(0,10.18,z,14.15,.25,.30,'cedar');for(const x of[-7.05,-2.99,2.99,7.05])box(x,9.85,z,.22,.66,.24,'darkwood');}
 for(const x of[-4.7,-2.9,0,2.9,4.7]){
  between([x,10.30,-9.1],[x,10.30,-.9],.22,.25,'cedar');between([x,10.30,C.ridgeZ],[x,C.ridgeY-.35,C.ridgeZ],.19,.24,'darkwood');
  for(const z of[-7.65,-2.35])between([x,10.43,z],[x,14.45,C.ridgeZ],.14,.18,'cedar');
 }
 for(const side of[-1,1]){
  const shape=new T.Shape(),points=[];for(let j=0;j<=32;j++){const z=C.ridgeZ-2.7+j*5.4/32,t=Math.abs(z-C.ridgeZ)/4.5;points.push([-z,Math.max(12.09,profile.mainPoint(z>=C.ridgeZ?0:2,t,0)[1]-.30)]);}
  shape.moveTo(points[0][0],12.05);for(const p of points)shape.lineTo(...p);shape.lineTo(points.at(-1)[0],12.05);shape.closePath();const wall=new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:false,steps:1});wall.rotateY(Math.PI/2);emit(wall,'darkwood',side*(profile.ridgeHalf-.06),0,0);
  for(let j=0;j<12;j++){const z=C.ridgeZ-2.55+j*5.1/11,t=Math.abs(z-C.ridgeZ)/4.5,top=Math.max(12.09,profile.mainPoint(z>=C.ridgeZ?0:2,t,0)[1]-.32);box(side*(profile.ridgeHalf+.015),(12.05+top)/2,z,.075,top-12.05,.075,'cedar');}
 }
 for(const t of[.12,.34,.57,.78,.96]){const a=profile.mainPoint(0,t,-.94),b=profile.mainPoint(0,t,.94);a[1]-=.31;b[1]-=.31;between(a,b,.19,.27,'cedar');}
 for(const side of[0,1,2,3])for(let row=0;row<19;row++){const u=-.95+1.90*row/18;for(let j=0;j<30;j++){const a=profile.mainPoint(side,.04+.96*j/30,u),b=profile.mainPoint(side,.04+.96*(j+1)/30,u);a[1]-=.245;b[1]-=.245;between(a,b,.055,.13,'darkwood');}}
 for(const x of C.columnAxes){const cap=Math.abs(x)<3.2?C.capitalTop+.26:Math.abs(x)<5.5?C.capitalTop-.62:C.capitalTop-.94,r=Math.abs(x)<3.2?.327:.286,bottom=C.stairTopY,h=cap-.18-(bottom+.25),points=[[0,0],[r*.97,0],[r,.12*h],[r*1.035,.35*h],[r*1.015,.60*h],[r*.975,.85*h],[r*.945,h],[0,h]].map(p=>new T.Vector2(...p));emit(new T.CylinderGeometry(r*1.30,r*1.47,.18,48),'granite',x,bottom+.09,0);emit(new T.CylinderGeometry(r*1.12,r*1.30,.07,48),'stone',x,bottom+.215,0);emit(setTurnedShaftTimberUV04(new T.LatheGeometry(points,64)),Math.abs(x)<3.2?'red':'cedar',x,bottom+.25,0);box(x,cap-.105,0,r*2.22,.15,r*2.22,'cedar');box(x,cap-.018,0,r*2.65,.045,r*2.65,'oldgold');}
 return{revision:'hall132-common-profile-bearing',frontColumns:C.columnAxes.length,roofRafters:76,purlinRows:5,shaftFootY:C.stairTopY,columnAxes:C.columnAxes,origin:profile.origin,visualAccepted:false};
}
