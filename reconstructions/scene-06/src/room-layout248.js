// Room248 R01 draft. Front-row dimensions are held to the verified234 camera
// projection. Rear depth is an explicitly testable hypothesis, not a measured
// historic plan. Root's native-pixel landmarks can replace these values.
export const ROOM_LAYOUT248={
 revision:'room248-r05b-visible-inner-bearings-on-outer-masu-line',
 cameraHeld:{position:[0,.58,8.4],target:[0,2.4,-2.3],fov:64},
 bounds:{halfWidth:6.8,frontZ:10,backZ:-9.0,ceilingY:7.2,roofTopY:7.4},
 postRows:[
  {key:'rear-apse',z:-7.5,axisX:5.1,radius:.39,observed:'Inferred depth places this pillar clear of the observed small rear lattice field'},
  {key:'visible-main',z:-2.6,axisX:5.1,radius:.4875,observed:'Retained234 front silhouette and ground projection'},
  {key:'front-bay',z:1.6,axisX:5.1,radius:.4875,observed:'Inferred continuation mostly outside reference frustum'},
  {key:'entrance-bay',z:5.6,axisX:5.1,radius:.4875,observed:'Inferred entrance-side continuation'}
 ],
 columns:{bottom:.2,shaftTop:6.9,cuffBottomY:.40,cuffTopY:6.57},
 primaryGirder:{bottomY:6.78,topY:7.40,rearFromRow:-.15,frontFromRow:.37,halfSpan:5.82},
 naveLongitudinal:{axisX:5.55,width:.44,bottomY:6.62,topY:7.40},
 aisle:{insideX:5.3,outsideX:6.94,soffitBottomY:6.70,soffitTopY:6.80,crossBottomY:6.42,crossTopY:6.80,cofferDrop:.40},
 coffers:{innerX:[-3.82,-2.98,2.98,3.82],outerX:[-6,6],mainY:7.101,field:[.762,1.274],fitToBearings:true,frameEnvelopeDepth:1.34,minimumBayClearance:.08,boardLift:.060,frameTopLift:.079,clipLift:-.028,frameDepth:.100},
 rearBay:{screenZ:-8.1,insideX:5.3,outsideX:6.8,bodyBottom:.2,bodyTop:6.55,openingCenterX:5.95,openingWidth:.49,openingBottom:4.20,openingTop:5.18,rearPaperCenterX:6.2,rearPaperWidth:.8,rearPaperBottom:3.8,rearPaperTop:5.8,visibleReferencePixels:[260,521,289,580],planeAndDepthInferred:true},
 unchanged:{camera:true,altarOrigin:[0,.045,-2.3],figures:true,altar:true,table:true,allLightParameters:true,materialDefinitions:true,shojiApertureCoordinates:true},
 inference:['No reference measurement is asserted for the entrance outside the photograph.','R01 rear depth must be reviewed against visible reference floor/post landmarks and two native view rounds.'],
 photographicMatch:false
};

export function cofferPlan248(layout=ROOM_LAYOUT248){
 const C=layout.coffers,rows=[];
 if(C.fitToBearings){
  const bearings=[layout.bounds.backZ+.25,...layout.postRows.map(r=>r.z),layout.bounds.frontZ-.35].sort((a,b)=>a-b);
  for(let bay=0;bay<bearings.length-1;bay++){
   const lo=bearings[bay]+layout.primaryGirder.frontFromRow,hi=bearings[bay+1]+layout.primaryGirder.rearFromRow,span=hi-lo,n=Math.floor((span-C.minimumBayClearance)/(C.frameEnvelopeDepth+C.minimumBayClearance));
   if(n<1)continue;const gap=(span-n*C.frameEnvelopeDepth)/(n+1);
   for(let k=0;k<n;k++)rows.push({z:lo+gap+C.frameEnvelopeDepth/2+k*(C.frameEnvelopeDepth+gap),bay,clearBounds:[lo,hi],endClearance:gap});
  }
 }else for(const z of C.rows)rows.push({z});
 const plan=[];for(const[lane,xs,baseY]of[['inner',C.innerX,C.mainY],['aisle',C.outerX,C.mainY-layout.aisle.cofferDrop]])for(const x of xs)for(const[row,r]of rows.entries())plan.push({x,y:baseY+(C.boardLift??0),frameY:baseY+(C.frameTopLift??.004),clipY:baseY+(C.clipLift??-.041),frameDepth:C.frameDepth??.042,z:r.z,lane,region:r.z<-2.6?'rear-black-gilt':'front-painted',variant:(row+(x<0?1:0))%4,bearingBay:r.bay,bearingClearBounds:r.clearBounds,bearingEndClearance:r.endClearance,recessMetres:.064});return plan;
}
