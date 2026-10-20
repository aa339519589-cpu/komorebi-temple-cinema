// Whole physical assemblies inferred from the supplied rain-veranda image.
// No reference RGB, depth image or independently fitted vertex heights.
export const scene10Layout125=Object.freeze({
 revision:'scene10-whole-layout125',
 camera:{position:[0,1,14],target:[0,4.65,-14],fov:60},
 pagoda:{position:[-7.24,6.79,-20],yaw:-.10,scale:[.88,.83,.88],tierDecrement:.055,finialHeight:7.20},
 hall:{position:[14,2.6,-14],yaw:-.58,scale:[1.12,.95,1.12],floorLocalY:1.3,entranceX:-2.85,upperLandingLocal:[-2.85,1.3,6.75]},
 bridge:{position:[3.80,1.22,-4.2],yaw:.12,span:8.0,width:2.0,archRise:1.08,phaseSkew:.20,endRise:.53,deckOffset:.25,deckThickness:.18,approachCount:7,approachRun:.25,railHeight:1.0,hallApproachLandingRun:1.55,turningHalfWidth:1.75,exitRailCutT:.82},
 veranda:{column:[-3.35,0,7.9],radius:.42,shoeHeight:.80,ceilingY:7.1,ceilingYaw:.75,ceilingCenter:[.07,-1.4],hangingLamp:[-2.83,5.85,6.35],lampScale:.76},
 foregroundRail:{position:[1.20,0,11.8],baseY:.10,postHeight:.87,postWidth:.39,capWidth:.48,finialBase:.925,finialHeightScale:.68,finialWidthScale:.58,returnEnd:[.72,0,14.2],levels:[.27,.52,.78]},
 heroStoneLantern:{position:[-2.80,.77,-3.0],scale:[1.066,.98,1.066],supportTop:.70},
 drain:{position:[-1.9,-.004,8.5],yaw:.56275,halfWidth:.095,length:13},
 path:{farRight:3.9,turnStartZ:5.0,nearRight:1.0,turnEndZ:11.4,nearBankOffsetX:1.45},
 inspection:{position:[-4,7.5,1],target:[6.5,2.5,-6.5],fov:63},
 groundY:.067
});

export function rightPathEdge125(z){const p=scene10Layout125.path,t=Math.max(0,Math.min(1,(z-p.turnStartZ)/(p.turnEndZ-p.turnStartZ)));return p.farRight+(p.nearRight-p.farRight)*t;}
export function leftPathEdge125(z){const base=-3.9-.65*Math.max(0,Math.min(1,(z+2)/21.32)),v=scene10Layout125.veranda;return Math.abs(z-v.column[2])<1.10?Math.max(base,v.column[0]+.80):base;}

export function bridgePoint125(t,side=0,dy=0){
 const b=scene10Layout125.bridge,p=b.phaseSkew;
 return[-b.span/2+b.span*t,b.deckOffset+b.archRise*Math.sin(Math.PI*(t-p*t*(1-t)))+b.endRise*t+dy,side];
}

export function bridgeToWorld125(point){
 const b=scene10Layout125.bridge,[x,y,z]=point,c=Math.cos(b.yaw),s=Math.sin(b.yaw);
 return[b.position[0]+c*x+s*z,b.position[1]+y,b.position[2]-s*x+c*z];
}

export function hallToWorld125(point){
 const h=scene10Layout125.hall,[x,y,z]=point,c=Math.cos(h.yaw),s=Math.sin(h.yaw),[sx,sy,sz]=h.scale;
 return[h.position[0]+c*x*sx+s*z*sz,h.position[1]+y*sy,h.position[2]-s*x*sx+c*z*sz];
}

export function createBridgeHallStairPlan125(){
 const bridgeEnd=bridgeToWorld125(bridgePoint125(1)),hallLanding=hallToWorld125(scene10Layout125.hall.upperLandingLocal),dx=hallLanding[0]-bridgeEnd[0],dz=hallLanding[2]-bridgeEnd[2],distance=Math.hypot(dx,dz),ux=dx/distance,uz=dz/distance,landingRun=scene10Layout125.bridge.hallApproachLandingRun,count=12,width=2.90,start=[bridgeEnd[0]+ux*landingRun,bridgeEnd[1],bridgeEnd[2]+uz*landingRun],run=distance-landingRun,rise=hallLanding[1]-start[1],steps=[];
 if(!(rise>0&&run>2&&count>0))throw Error('Invalid connected bridge/hall stair plan');
 for(let i=0;i<count;i++){
  const a=run*i/count,b=run*(i+1)/count,top=start[1]+rise*(i+1)/count;
  const p=(t,side)=>[start[0]+ux*t-uz*side,start[2]+uz*t+ux*side];
  steps.push({index:i,top,bottom:-.18,outline:[p(a,-width/2),p(b,-width/2),p(b,width/2),p(a,width/2)]});
 }
 const hall=scene10Layout125.hall,last=steps.at(-1),backLeft=hallToWorld125([hall.entranceX-1.45,hall.floorLocalY,5.30]),backRight=hallToWorld125([hall.entranceX+1.45,hall.floorLocalY,5.30]),upperLanding={outline:[last.outline[1],last.outline[2],[backRight[0],backRight[2]],[backLeft[0],backLeft[2]]],top:hallLanding[1],bottom:hallLanding[1]-.24,scope:'Full slanted stair edge meets one closed wedge reaching into the hall floor'};
 return{bridgeEnd,hallLanding,start,width,count,run,rise,unit:[ux,uz],steps,upperLanding,turningLanding:{center:bridgeEnd,halfWidth:scene10Layout125.bridge.turningHalfWidth,top:bridgeEnd[1],bottom:-.18}};
}
