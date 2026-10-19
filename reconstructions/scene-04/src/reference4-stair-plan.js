// One physical datum and one flared plan own treads, landings and balustrades.
// All hidden dimensions remain an authored single-view reconstruction.
export function createReference4StairPlan(C){
 const count=C.stairCount??18,baseY=C.stairBaseY??.048,topY=C.stairTopY,z0=C.stairTopZ,z1=C.stairBottomZ,topWidth=C.stairTopWidth??4.4,bottomWidth=C.stairWidth,run=z1-z0,cap=.10;
 if(!(Number.isInteger(count)&&count>=3&&run>0&&topY>baseY&&topWidth>0&&bottomWidth>=topWidth))throw Error('Invalid unified flared stair plan');
 const clamp=t=>Math.max(0,Math.min(1,t)),halfWidth=z=>{const t=clamp((z-z0)/run);return .5*(topWidth+(bottomWidth-topWidth)*t);},walkY=z=>topY+(baseY-topY)*clamp((z-z0)/run),steps=[];
 for(let i=0;i<count;i++){
  const back=z0+run*i/count,front=z0+run*(i+1)/count,top=topY-(topY-baseY)*i/count;
  steps.push({index:i,back,front,top,coreTop:top-cap,bottom:-.12,cap,outline:[[-halfWidth(back),back],[halfWidth(back),back],[halfWidth(front),front],[-halfWidth(front),front]]});
 }
 const railPoint=(side,t,level='upper')=>{t=clamp(t);const z=z0+run*t,offset=level==='upper'?.82+.83*t:level==='lower'?.34+.38*t:.08;return[side*(halfWidth(z)+.23),walkY(z)+offset,z];};
 const terminals=[-1,1].map(side=>({side,x:side*(halfWidth(z1)+.23),z:z1+.02,bottom:baseY,postTop:baseY+1.73,finialTop:baseY+2.13}));
 return{count,baseY,topY,z0,z1,run,topWidth,bottomWidth,halfWidth,walkY,steps,railPoint,terminals,landing:{back:-9.225,front:z0,wingFront:z0+.425,halfWidth:7.725,top:topY,cap:.13},assumptions:'18 closed treads and an outward-flared flight inferred from the whole-image stair/portal proportions; not independent ray-picked elevations'};
}
