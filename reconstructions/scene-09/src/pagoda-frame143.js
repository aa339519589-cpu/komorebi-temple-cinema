// Source09 square tower fitted as a common 3D frame/roof stack. The changed
// yaw is structural: the photograph resolves two balanced returning faces.
export const PAGODA_FRAME143={position:[-13.45,5.82,-17],yaw:1.05,scale:[1.18,1.14,1.18],floor:.70,pitch:3.03,roofWidth:7.80,roofTaper:.46,roofSeat:2.09,curl:.38,topRise:2.15,revision:'scene09-returning-pagoda-frame143-r12'};
export function buildPagodaFrame143(api,C,mainRoof,installFinial,scene,ownedMaterials,transform){
 const {emit,box,group,post,lantern,materials:M}=api,S=PAGODA_FRAME143,levels=[];
 box(0,.25,0,6.5,.7,6.5,M.cutStoneDark);
 for(let k=0;k<5;k++){
  const floor=S.floor+k*S.pitch,body=(7.7-k*.66)*.58,w=S.roofWidth-k*S.roofTaper,rise=k===4?S.topRise:1.72,half=body/2;
  box(0,floor,0,body+.48,.22,body+.48,M.wood);
  box(0,floor+.91,0,body-.66,1.58,body-.66,M.dark);
  for(const x of[-half,0,half])for(const z of[-half,half]){post(x,z,floor+.10,1.35,.135,M.wood);C.capital(x,floor+1.75,z,.55,1.18,.40);}
  for(const side of[-1,1]){post(side*half,0,floor+.10,1.35,.135,M.wood);group(side*half,floor+1.75,0,side*Math.PI/2,()=>C.capital(0,0,0,.55,1.18,.40));}
  for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
   const zz=half-.11;
   for(const x of[-body*.30,0,body*.30]){
    const ww=body*.185;box(x,floor+.98,zz,ww,.97,.13,M.dark);box(x,floor+.98,zz+.08,ww-.12,.83,.014,M.pagodaPaper);
    for(const dx of[-ww/2,0,ww/2])box(x+dx,floor+.98,zz+.115,.044,.99,.10,M.wood);
    for(let row=0;row<6;row++)box(x,floor+.56+row*.17,zz+.125,ww,.023,.03,M.bronze);
    for(const yy of[floor+.48,floor+1.50])box(x,yy,zz+.12,ww+.12,.09,.12,M.wood);
    C.frieze(x-ww*.55,x+ww*.55,floor+1.63,zz+.12,.19);
    for(const sign of[-1,1])C.flower(x+sign*ww*.28,floor+.28,zz+.13,.075);
   }
   for(const yy of[floor+.25,floor+.86])box(0,yy,half+.25,body+.55,.075,.10,M.red);
   for(let j=0;j<=16;j++)box(-half+j*body/16,floor+.57,half+.25,.04,.60,.052,M.red);
   for(let j=0,n=Math.ceil(body/.67);j<=n;j++)C.capital(-half+body*j/n,floor+1.84,half+.25,.36,1.15,.30);
   box(0,floor+2.17,half+.25,body+.62,.17,.27,M.wood);C.frieze(-half-.25,half+.25,floor+2.15,half+.43,.17);
   lantern(0,floor+1.32,half+.37,.46,false,.40);
  });
  const upperBody=(7.7-(k+1)*.66)*.58,inner=k<4?(upperBody+.50)/w:0;
  mainRoof({w,d:w,frontDepth:w/2,backDepth:w/2,e:floor+S.roofSeat,rise,curl:S.curl,pagoda:true,ridgeLeft:0,ridgeRight:0,inner,label:'scene09-returning-pagoda-roof143-'+(k+1)});
  levels.push({floor,bodyWidth:body,roofWidth:w,roofEave:floor+S.roofSeat,roofRise:rise,innerOpening:inner});
 }
 const base=S.floor+4*S.pitch+S.roofSeat+S.topRise,finial=installFinial({emit,materials:ownedMaterials,scene,transform,base});
 return{...finial,frame:{...S,levels,base,fullHeightPaperWall:false,actualReturningFaces:true}};
}
