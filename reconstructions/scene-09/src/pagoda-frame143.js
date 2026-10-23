import {continuousTimber181,cloudCarrier181} from './night-mass181.js';
// Exact existing site pose, ground landing and finial summit are retained.
// Each floor is a full framed chamber carrying its own deep annular roof.
export const PAGODA_FRAME143={position:[-13.45,5.82,-17],yaw:1.05,scale:[1.18,1.14,1.18],floor:.70,pitch:3.03,roofWidth:7.80,roofTaper:.365,roofSeat:2.62,curl:.38,topRise:1.62,revision:'scene09-181-occupied-carried-pagoda-r01'};
export function buildPagodaFrame143(api,C,mainRoof,installFinial,scene,ownedMaterials,transform){
 const {emit,box,between,group,post,lantern,materials:M}=api,S=PAGODA_FRAME143,levels=[],contacts=[],widths=[7.80,7.50,7.12,6.72,6.34],bodies=[4.92,4.52,4.12,3.75,3.40],sweep=(p,w,h,m=M.wood)=>emit(continuousTimber181(p,w,h),m);
 box(0,.25,0,6.5,.7,6.5,M.cutStoneDark);box(0,.61,0,6.08,.13,6.08,M.cutStone);
 for(let k=0;k<5;k++){
  const floor=S.floor+k*S.pitch,body=bodies[k],w=widths[k],rise=k===4?S.topRise:1.72,half=body/2,shaftTop=floor+1.78,upperBody=bodies[k+1],inner=k<4?(upperBody+.55)/w:0;
  const roofY=(x,z)=>{const t=Math.max(Math.abs(x),Math.abs(z))/(w/2),u=Math.abs(x)>Math.abs(z)?z/(w/2*t):x/(w/2*t);return floor+S.roofSeat+rise*Math.pow(Math.max(0,1-t),1.49)+S.curl*Math.pow(t,10)*(.17+.83*Math.pow(Math.abs(u),8))+.035*Math.pow(1-t,8)*Math.pow(Math.abs(u),8);};
  box(0,floor-.12,0,body+.79,.27,body+.79,M.red);box(0,floor+.05,0,body+.69,.08,body+.69,M.wood);
  for(let i=0;i<23;i++)box(-body*.5+i*body/22,floor+.115,0,body/23*.96,.045,body+.58,M.wood);
  box(0,floor+.91,0,body-.91,1.64,body-.91,M.dark);
  // Continuous round entasis shafts, before the enclosed chambers, are
  // supported on the actual gallery. Roof loads pass through crossed dou.
  for(const x of[-half,0,half])for(const z of[-half,half]){
   post(x,z,floor+.10,shaftTop-floor-.40,.17+k*.002,M.red,true);
   const top=roofY(x,z)-.62;C.capital(x,shaftTop,z,.66,1.42,Math.max(.20,top-shaftTop)/1.37);contacts.push({floor:k+1,axis:[x,z],shaftTop,roofBearing:top});
  }
  for(const side of[-1,1]){
   post(side*half,0,floor+.10,shaftTop-floor-.40,.17+k*.002,M.red,true);
   const top=roofY(side*half,0)-.62;group(side*half,shaftTop,0,side*Math.PI/2,()=>C.capital(0,0,0,.66,1.42,Math.max(.20,top-shaftTop)/1.37));
  }
  for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
   const wallZ=half-.40,ends=[];
   for(const x of[-body*.31,0,body*.31]){
    const ww=body*.205;box(x,floor+.95,wallZ,ww+.15,1.60,.17,M.ivory);box(x,floor+.98,wallZ+.10,ww,1.13,.13,M.dark);box(x,floor+.98,wallZ+.175,ww-.14,.99,.016,M.pagodaPaper);
    for(const dx of[-ww/2,0,ww/2])box(x+dx,floor+.98,wallZ+.215,.053,1.17,.14,M.wood);
    for(let row=0;row<7;row++)box(x,floor+.46+row*.173,wallZ+.22,ww,.029,.066,M.bronze);
    for(const yy of[floor+.38,floor+1.57])box(x,yy,wallZ+.22,ww+.16,.105,.19,M.red);
    C.frieze(x-ww*.61,x+ww*.61,floor+1.67,wallZ+.24,.23);C.flower(x,floor+.25,wallZ+.245,.105,M.darkGilt);
   }
   for(const x of[-half,0,half]){
    C.fitting(x,shaftTop-.19,half+.18,.18,.24);
    const endZ=w*.435,top=roofY(x,endZ)-.62,start=shaftTop+.15,reach=endZ-half;
    for(const dx of[-.15,.15])emit(cloudCarrier181(reach,top-start,.25),M.wood,x+dx,start,half,1,1,1,[0,-Math.PI/2,0]);
    for(const u of[.40,.78]){const z=half+reach*u,y=start+(top-start)*u;box(x,y+.12,z,.88,.17,.25,M.red);box(x,y+.25,z,.27,.17,.31,M.wood);}
    box(x,top+.08,endZ,.38,.16,.38,M.wood);ends.push([x,top+.08,endZ]);
   }
   sweep(ends,.33,.28,M.wood);box(0,shaftTop-.12,half,body+.38,.31,.49,M.red);C.frieze(-half-.10,half+.10,shaftTop-.13,half+.255,.25);
   for(let j=0,n=6;j<n;j++){
    const x=-half+body*(j+.5)/n,top=roofY(x,half+.12)-.62;C.capital(x,shaftTop+.15,half+.08,.42,1.50,Math.max(.17,top-shaftTop-.15)/1.37);
   }
   // Open rail follows the gallery edge, leaving a shadowed circulation
   // strip in front of the independently framed lime/paper enclosure.
   const rail=half+.33;for(const yy of[floor+.30,floor+.80])box(0,yy,rail,body+.80,.10,.13,M.red);
   for(let j=0;j<=12;j++)box(-(body+.67)/2+j*(body+.67)/12,floor+.56,rail,j%6===0?.105:.055,.67,.075,M.red);
   for(const x of[-(body+.67)/2,(body+.67)/2]){box(x,floor+.53,rail,.15,.88,.15,M.red);C.fitting(x,floor+.82,rail+.083,.13,.12);}
   lantern(0,floor+1.39,half+.27,.46,false,.40);
  });
  // A short closed framed neck receives the following occupied floor.
  // Its lower edge is hidden inside this roof's real central opening.
  if(k<4){
   const bottom=floor+2.51,top=floor+S.pitch-.14,neck=upperBody+.30;
   box(0,(bottom+top)/2,0,neck,top-bottom,neck,M.dark);
   for(const side of[-1,1])for(const x of[-neck*.45,0,neck*.45]){box(x,(bottom+top)/2,side*neck*.5,.16,top-bottom+.08,.18,M.red);box(side*neck*.5,(bottom+top)/2,x,.18,top-bottom+.08,.16,M.red);}
   box(0,top+.04,0,neck+.25,.16,neck+.25,M.wood);
  }
  mainRoof({w,d:w,frontDepth:w/2,backDepth:w/2,e:floor+S.roofSeat,rise,curl:S.curl,pagoda:true,ridgeLeft:0,ridgeRight:0,inner,label:'scene09-181-deep-carried-pagoda-roof-'+(k+1)});
  levels.push({floor,bodyWidth:body,roofWidth:w,shaftTop,roofEave:floor+S.roofSeat,roofRise:rise,innerOpening:inner,returningGalleryDepth:.40});
 }
 const base=S.floor+4*S.pitch+S.roofSeat+S.topRise,finial=installFinial({emit,materials:ownedMaterials,scene,transform,base});
 return{...finial,frame:{...S,levels,base,fullHeightPaperWall:false,actualIndependentReturningFaces:true,roofBearingContacts:contacts,unchangedTopRoofSummit:17.06,visualAccepted:false}};
}
