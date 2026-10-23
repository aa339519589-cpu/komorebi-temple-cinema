// Closed plank bridge and laminated arch girders. All red and metal surfaces
// are actual independently lit solids, with an open water passage below.
export function buildArchedBridge03(T,{at,emit,box,ell,between,sweep,wood,woodDark,gold,black,seal},spec={position:[-3.1,.55,7.05],yaw:-.28,span:7.2,deckDepth:1.94}){
 const span=spec.span,half=span/2,halfDepth=spec.deckDepth/2,depthRatio=spec.deckDepth/1.94,deckRise=spec.deckRise??1.10,
  deck=x=>1.13+deckRise*(1-(x/half)**2),rail=x=>1.13+1.10*(1-(x/half)**2),slope=x=>Math.atan(-2*deckRise*x/(half*half)),
  girderDepth=x=>(spec.girderEndDepth??.42)+((spec.girderCrownDepth??.42)-(spec.girderEndDepth??.42))*(1-(x/half)**2),
  capRank=x=>Math.max(.45,Math.min(1.9,(spec.capBaseScale??1)-(spec.capTaper??0)*(x/half)));
 const finial=new T.LatheGeometry([[0,-.16],[.045,-.15],[.10,-.12],[.135,-.06],[.14,0],[.12,.055],[.07,.105],[.044,.12],[.030,.17],[0,.205]].map(([x,y])=>new T.Vector2(x,y)),40);finial.name='scene03-closed-ranked-gilt-bridge-bulb106';
 at(spec.position,spec.yaw,()=>{
  for(let j=0;j<72;j++){
   const x=-half+span*(j+.5)/72,y=deck(x);
   box([x,y,0],[span/72-.004,.16,spec.deckDepth],wood,[0,0,slope(x)]);
   for(const z of[-halfDepth+.11,halfDepth-.11])ell([x,y+.084,z],[.018,.010,.018],black);
  }
  for(const z of[-halfDepth+.01,halfDepth-.01]){
   // A full-depth closed red girder replaces the old pipe below the deck.
   const outline=new T.Shape();
   for(let j=0;j<=96;j++){const x=-half+span*j/96;j?outline.lineTo(x,deck(x)-.07):outline.moveTo(x,deck(x)-.07);}
   for(let j=96;j>=0;j--){const x=-half+span*j/96;outline.lineTo(x,deck(x)-.07-girderDepth(x));}
   outline.closePath();
   const g=new T.ExtrudeGeometry(outline,{depth:.18,steps:1,bevelEnabled:true,bevelSize:.016,bevelThickness:.012,bevelSegments:2,curveSegments:20});g.translate(0,0,-.09);g.name='scene03-closed-variable-depth-main-bridge-girder106';g.userData={closedLoadMember:true,depthAtEnds:spec.girderEndDepth??.42,depthAtCrown:spec.girderCrownDepth??.42};emit(g,wood,[0,0,z]);
   const points=Array.from({length:65},(_,j)=>{const x=-half+span*j/64;return[x,deck(x)-.07-girderDepth(x)-.025,z];});
   sweep(points,.043,woodDark);
   for(const lift of[.20,.64,1.05])sweep(points.map(p=>[p[0],rail(p[0])+lift,p[2]]),lift===1.05?.083:.058,wood);
   for(let j=0;j<=12;j++){
    const x=-half+span*j/12,y=deck(x),rY=rail(x),major=j===0||j===4||j===8||j===12,rank=major?capRank(x):1,w=major?.19*rank:.105,top=major?rY+1.25-.10*rank:rY+1.145,bottom=y-.03;
    box([x,(top+bottom)/2,z],[w,top-bottom,w*1.10],wood);
    if(major){
     for(const yy of[y+.09,top-.07*rank])box([x,yy,z],[w*1.12,.050*rank,w*1.2],gold);
     emit(finial,gold,[x,rY+1.25,z],[rank,rank,rank]);
     // A small backed cast fitting sits on the real broad principal post.
     const face=w*.55;
     box([x,rY+.68,z+(z>0?face+.015:-face-.015)],[.14*rank,.27*rank,.030],black);
     seal([x,rY+.68,z+(z>0?face+.037:-face-.037)],.065*rank);
    }
   }
   for(const x of[-2.80,-.95,1.0,2.83])seal([x,deck(x)-.07-girderDepth(x)*.56,z+(z>0?.115:-.115)],Math.min(.16,girderDepth(x)*.38));
   for(let j=0;j<20;j++){const x=-half+span*(j+.5)/20;between([x,deck(x)-.12,z+.095],[x,deck(x)-.07-girderDepth(x)+.035,z+.095],.008,woodDark,true,.008);}
  }
  for(let j=0;j<10;j++){const x=-half+.25+j*(span-.5)/9;between([x,deck(x)-.28,-halfDepth-.07],[x,deck(x)-.28,halfDepth+.07],.15,woodDark,true,.19);}
  for(const z of[-.66*depthRatio,.66*depthRatio]){
   // Closed solid arch ribs bear against the actual transverse joist
   // undersides. The previous low round pipes had no upper contact.
   const shape=new T.Shape();for(let j=0;j<=96;j++){const x=-half+span*j/96;j?shape.lineTo(x,deck(x)-.365):shape.moveTo(x,deck(x)-.365);}for(let j=96;j>=0;j--){const x=-half+span*j/96;shape.lineTo(x,deck(x)-.635);}shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:.22,steps:1,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,curveSegments:16});g.translate(0,0,-.11);g.name='scene03-closed-joist-bearing-arch-rib106';emit(g,woodDark,[0,0,z]);
  }
 });
 return {span,deckDepth:spec.deckDepth,deckRise,railingRise:1.10,girderDepth:{ends:spec.girderEndDepth??.42,crown:spec.girderCrownDepth??.42},capScale:{base:spec.capBaseScale??1,taper:spec.capTaper??0},yaw:spec.yaw,position:[...spec.position],closedArchGirders:true,closedJoistBearingArchRibs:true,referenceTexture:false};
}
