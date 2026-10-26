// Whole physical assemblies inferred from the supplied rain-veranda image.
// No reference RGB, depth image or independently fitted vertex heights.
export const scene10Layout125=Object.freeze({
 revision:'scene10-rain210-garden-entry-and-open-creek-r14',
 camera:{position:[0,1,14],target:[0,4.65,-14],fov:60},
 pagoda:{position:[-7.00,6.50,-20],yaw:-.10,scale:[.86,.70,.86],tierDecrement:.055,finialHeight:8.0},
 hall:{position:[14,2.6,-14],yaw:-.58,scale:[1.12,.95,1.12],floorLocalY:1.3,entranceX:-2.85,upperLandingLocal:[-3.6,1.3,6.75]},
 bridge:{position:[2.5064822373237057,1.07,-5.558258933768967],yaw:.09219438406608582,span:9.955243325862906,width:2.0,archRise:1.40,phaseSkew:.20,endRise:.58,entryFlatT:.12,entryFirstPostT:.009,deckOffset:.25,deckThickness:.18,approachCount:4,approachRun:.28,approachGroundY:.78,railHeight:1.0,hallApproachLandingRun:1.31,turningHalfWidth:1.35,exitRailCutT:1.0},
 veranda:{column:[-3.35,0,7.9],radius:.42,shoeHeight:.80,ceilingY:7.1,ceilingYaw:.75,ceilingCenter:[.07,-1.4],hangingLamp:[-2.83,5.85,6.35],lampScale:.76},
 foregroundRail:{position:[1.20,0,11.8],baseY:.10,postHeight:.87,postWidth:.39,capWidth:.48,finialBase:.925,finialHeightScale:.68,finialWidthScale:.58,returnEnd:[.72,0,14.2],levels:[.27,.52,.78]},
 heroStoneLantern:{position:[-2.96,1.4538758854458425,-4.10],scale:[1.15,.877177980766595,1.15],supportTop:1.3838758854458424,bearingPadWidth:1.22,plinthCourseWidths:[1.65,1.44,1.23],plinthBaseOffset:.6838758854458423},
 drain:{position:[-2.072854,-.004,8.5],yaw:.586734,halfWidth:.067,length:13},
 path:{farRight:3.9,turnStartZ:5.0,nearRight:1.0,turnEndZ:11.4,nearBankOffsetX:1.45},
 inspection:{position:[-4,7.5,1],target:[6.5,2.5,-6.5],fov:63},
 groundY:.067
});

export function rightPathEdge125(z){const p=scene10Layout125.path,t=Math.max(0,Math.min(1,(z-p.turnStartZ)/(p.turnEndZ-p.turnStartZ)));return p.farRight+(p.nearRight-p.farRight)*t;}
export function leftPathEdge125(z){const base=-3.9-.65*Math.max(0,Math.min(1,(z+2)/21.32)),v=scene10Layout125.veranda;return Math.abs(z-v.column[2])<1.10?Math.max(base,v.column[0]+.80):base;}

export function bridgePoint125(t,side=0,dy=0){
 const b=scene10Layout125.bridge,p=b.phaseSkew,u=Math.max(0,(t-(b.entryFlatT||0))/(1-(b.entryFlatT||0)));
 return[-b.span/2+b.span*t,b.deckOffset+b.archRise*Math.sin(Math.PI*(u-p*u*(1-u)))+b.endRise*u+dy,side];
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
 const bridgeEnd=bridgeToWorld125(bridgePoint125(1)),hallLanding=hallToWorld125(scene10Layout125.hall.upperLandingLocal),start=[4.25,2.16,-9.10],dx=hallLanding[0]-start[0],dz=hallLanding[2]-start[2],run=Math.hypot(dx,dz),ux=dx/run,uz=dz/run,count=9,width=2.20,rise=hallLanding[1]-start[1],steps=[];
 for(let i=0;i<count;i++){const a=run*i/count,b=run*(i+1)/count,top=start[1]+rise*(i+1)/count,p=(t,side)=>[start[0]+ux*t-uz*side,start[2]+uz*t+ux*side];steps.push({index:i,top,bottom:start[1]+rise*i/count-.24,undersideFront:start[1]+rise*i/count-.24,undersideBack:top-.24,riser:rise/count,tread:run/count,outline:[p(a,-width/2),p(b,-width/2),p(b,width/2),p(a,width/2)]});}
 const hall=scene10Layout125.hall,last=steps.at(-1),centre=hall.upperLandingLocal[0],backLeft=hallToWorld125([centre-1.45,hall.floorLocalY,5.30]),backRight=hallToWorld125([centre+1.45,hall.floorLocalY,5.30]),upperLanding={outline:[last.outline[1],last.outline[2],[backRight[0],backRight[2]],[backLeft[0],backLeft[2]]],top:hallLanding[1],bottom:hallLanding[1]-.24,scope:'Closed stair head at left side of the existing hall gallery, connected to the unchanged floor'};
 const A=[Math.cos(scene10Layout125.bridge.yaw),-Math.sin(scene10Layout125.bridge.yaw)],B=[-A[1],A[0]],pt=(a,b)=>[bridgeEnd[0]+A[0]*a+B[0]*b,bridgeEnd[2]+A[1]*a+B[1]*b],outline=[pt(0,-1.20),pt(.95,-1.20),pt(.95,1.20),pt(0,1.20)],galleryApproach={points:[bridgeEnd,[7.85,2.03,-8.25],start],width:1.12,scope:'Narrow returning stone gallery behind the bridge connects the far landing to the visible stair foot; no giant convex platform spans the creek'};
 return{revision:'route366-r02-returning-hall-stair',bridgeEnd,hallLanding,start,width,count,run,rise,unit:[ux,uz],steps,upperLanding,galleryApproach,turningLanding:{center:bridgeEnd,halfWidth:scene10Layout125.bridge.turningHalfWidth,outline,top:bridgeEnd[1],bottom:bridgeEnd[1]-.18},bearing:{type:'Closed seated stone flight on a compact dressed mineral bearing bank; narrow returning gallery',riser:rise/count,tread:run/count,bedThickness:.075}};
}

function convexHull207(points){const p=[...points].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const q of p){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),q)<=0)lo.pop();lo.push(q);}for(const q of p.reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),q)<=0)hi.pop();hi.push(q);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
