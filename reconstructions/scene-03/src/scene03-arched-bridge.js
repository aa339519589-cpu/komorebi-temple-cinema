// Closed plank bridge and laminated arch girders. All red and metal surfaces
// are actual independently lit solids, with an open water passage below.
export function buildArchedBridge03(T,{at,emit,box,ell,between,sweep,wood,woodDark,gold,black,seal}){
 const span=7.20,half=span/2,deck=x=>1.13+1.10*(1-(x/half)**2),slope=x=>Math.atan(-2.20*x/(half*half));
 at([-3.10,.55,7.05],-.28,()=>{
  for(let j=0;j<72;j++){
   const x=-half+span*(j+.5)/72,y=deck(x);
   box([x,y,0],[span/72-.004,.16,1.94],wood,[0,0,slope(x)]);
   for(const z of[-.86,.86])ell([x,y+.084,z],[.018,.010,.018],black);
  }
  for(const z of[-.96,.96]){
   // A full-depth closed red girder replaces the old pipe below the deck.
   const outline=new T.Shape();
   for(let j=0;j<=96;j++){const x=-half+span*j/96;j?outline.lineTo(x,deck(x)-.07):outline.moveTo(x,deck(x)-.07);}
   for(let j=96;j>=0;j--){const x=-half+span*j/96;outline.lineTo(x,deck(x)-.49);}
   outline.closePath();
   const g=new T.ExtrudeGeometry(outline,{depth:.18,steps:1,bevelEnabled:true,bevelSize:.016,bevelThickness:.012,bevelSegments:2,curveSegments:20});g.translate(0,0,-.09);emit(g,wood,[0,0,z]);
   const points=Array.from({length:65},(_,j)=>{const x=-half+span*j/64;return[x,deck(x)-.52,z];});
   sweep(points,.043,woodDark);
   for(const lift of[.20,.64,1.05])sweep(points.map(p=>[p[0],p[1]+.52+lift,p[2]]),lift===1.05?.083:.058,wood);
   for(let j=0;j<=12;j++){
    const x=-half+span*j/12,y=deck(x),major=j===0||j===4||j===8||j===12,w=major?.19:.105;
    box([x,y+.55,z],[w,1.19,w*1.10],wood);
    if(major){
     for(const yy of[y+.09,y+1.06])box([x,yy,z],[w*1.12,.050,w*1.2],gold);
     ell([x,y+1.25,z],[.14,.12,.14],gold);ell([x,y+1.40,z],[.065,.10,.065],gold);ell([x,y+1.51,z],[.028,.065,.028],gold);
     // A small backed cast fitting sits on the real broad principal post.
     box([x,y+.68,z+(z>0?.115:-.115)],[.14,.27,.030],black);
     seal([x,y+.68,z+(z>0?.137:-.137)],.065);
    }
   }
   for(const x of[-2.80,-.95,1.0,2.83])seal([x,deck(x)-.32,z+(z>0?.115:-.115)],.16);
   for(let j=0;j<20;j++){const x=-half+span*(j+.5)/20;between([x,deck(x)-.12,z+.095],[x,deck(x)-.44,z+.095],.008,woodDark,true,.008);}
  }
  for(let j=0;j<10;j++){const x=-3.35+j*6.7/9;between([x,deck(x)-.28,-1.04],[x,deck(x)-.28,1.04],.15,woodDark,true,.19);}
  for(const z of[-.66,.66]){
   const points=Array.from({length:49},(_,j)=>{const x=-half+span*j/48;return[x,deck(x)-.74,z];});sweep(points,.14,woodDark);
  }
 });
 return {span,position:[-3.10,.55,7.05],closedArchGirders:true,referenceTexture:false};
}
