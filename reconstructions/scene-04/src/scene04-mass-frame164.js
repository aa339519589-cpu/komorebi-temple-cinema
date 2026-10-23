// Authored structural solids for the scene04 porch. Dimensions are a
// single-view hypothesis; these members remain visible in oblique inspection.
export function buildMassFrame164(T,{emit,box,between,tube,rosette,mats,materials,profile,C}){
 const grain=mats.cedar.clone();grain.name='scene04-mass164-oiled-enduring-cedar';grain.color.setHex(0x6c361c);grain.roughness=.72;grain.clearcoat=.07;grain.clearcoatRoughness=.48;materials.push(grain);
 const old=mats.oldgold.clone();old.name='scene04-mass164-tarnished-brass-inlay';old.color.setHex(0x95713a);old.roughness=.54;materials.push(old);
 const member=(shape,depth,x,y,z,ma='cedar',yaw=0,bevel=.018)=>{const g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel*.65,bevelSegments:3,curveSegments:24});g.userData.architectureMember='mass164-closed-bearing-solid';emit(g,ma,x,y,z,1,1,1,[0,yaw,0]);};
 function curvedRib(z,drop,width=6.46,thick=.20,depth=.28){
  const s=new T.Shape(),n=80;
  for(let j=0;j<=n;j++){const x=-width/2+width*j/n,y=profile.canopy(x,z)-drop;j?s.lineTo(x,y):s.moveTo(x,y);}
  for(let j=n;j>=0;j--){const x=-width/2+width*j/n;s.lineTo(x,profile.canopy(x,z)-drop-thick);}s.closePath();
  member(s,depth,0,0,z-depth/2,grain,0,.012);
 }
 // The broad curved inner arch physically receives the front curved rafters.
 // Smaller arches retreat into the dark vault, with 0.48m of real parallax.
 curvedRib(.90,.53,6.72,.27,.42);
 for(const z of[-.12,-1.12,-2.12])curvedRib(z,.68,6.40,.19,.20);
 const arm=new T.Shape();arm.moveTo(-.69,.12);arm.lineTo(.69,.12);arm.bezierCurveTo(.74,.01,.57,-.18,.42,-.15);arm.bezierCurveTo(.29,-.11,.22,-.29,.10,-.26);arm.lineTo(-.10,-.26);arm.bezierCurveTo(-.22,-.29,-.29,-.11,-.42,-.15);arm.bezierCurveTo(-.57,-.18,-.74,.01,-.69,.12);arm.closePath();
 for(const side of[-1,1]){
  const x=side*C.columnAxes[3],bearing=C.capitalTop+.26;
  // Deep arms and orthogonal arms meet over the circular shaft and carry
  // the transfer ends. Each receiver meets the next bearing face.
  member(arm,.43,x,bearing+.045,-.17,'cedar',0,.014);
  member(arm,.37,x-.185,bearing+.045,.27,'cedar',Math.PI/2,.014);
  box(x,bearing+.24,.20,.88,.17,.78,'cedar');
  for(const sx of[-1,1])box(x+sx*.43,bearing+.18,.20,.20,.17,.55,'endwood');
  const archY=profile.canopy(x,.70)-.60;
  between([x,bearing+.25,.25],[x,archY,.83],.31,.43,'cedar');
  // Rear returns reveal how the front transfer sits in a deep timber bay.
  box(x,bearing+.24,-.78,.31,.30,1.72,'red');
  between([x,bearing+.31,-.15],[x,bearing+1.18,-1.21],.19,.22,'cedar');
 }
 // The reference-fitted higher hafu shoulders now have their own deep
 // paired braces. They grow from the retained middle column capitals and
 // meet the same curved carrier underside as the weather/rafter geometry.
 const shoulderContacts=[],grid=profile.carrierGridXs;
 const actualCarrier=(x,z)=>{
  let hi=grid.findIndex(v=>v>=x);if(hi<0)hi=grid.length-1;else if(hi<1)hi=1;const lo=grid[hi-1],up=grid[hi],t=(x-lo)/(up-lo);
  return profile.canopy(lo,z)*(1-t)+profile.canopy(up,z)*t-.43;
 };
 for(const side of[-1,1])for(const dx of[-.20,.20]){
  const x=side*C.columnAxes[4]+dx,cap=C.capitalTop-.62,width=.23,xs=[x-width/2,...grid.filter(v=>v>x-width/2&&v<x+width/2),x+width/2],positions=[],indices=[],uv=[],rings=[];
  const ring=xx=>{
   const seatRear=actualCarrier(xx,.57),seatFront=actualCarrier(xx,.73),r=[[.02,cap+.03],[.02,cap+.26],[.57,seatRear],[.73,seatFront],[.73,seatFront-.16]];
   for(let j=1;j<=16;j++){const t=j/16,u=1-t;r.push([u*u*u*.73+3*u*u*t*.55+3*u*t*t*.31+t*t*t*.12,u*u*u*(seatFront-.16)+3*u*u*t*(cap+.57)+3*u*t*t*(cap+.04)+t*t*t*(cap+.02)]);}
   return r;
  };
  const N=ring(x).length;
  for(const xx of xs){const r=ring(xx);rings.push(r);for(const[z,y]of r){positions.push(xx,y,z);uv.push(z/1.45,y/.38);}}
  const tri=(a,b,c,n)=>{const A=new T.Vector3().fromArray(positions,a*3),B=new T.Vector3().fromArray(positions,b*3),D=new T.Vector3().fromArray(positions,c*3);if(B.sub(A).cross(D.sub(A)).dot(n)<0)[b,c]=[c,b];indices.push(a,b,c);};
  for(let row=0;row<xs.length-1;row++)for(let k=0;k<N;k++){
   const next=(k+1)%N,a=row*N+k,b=row*N+next,c=(row+1)*N+next,d=(row+1)*N+k,edge=new T.Vector2(rings[row][next][0]-rings[row][k][0],rings[row][next][1]-rings[row][k][1]),normal=new T.Vector3(0,edge.x,-edge.y);tri(a,b,c,normal);tri(a,c,d,normal);
  }
  for(const end of[0,xs.length-1])for(const ids of T.ShapeUtils.triangulateShape(rings[end].map(p=>new T.Vector2(...p)),[]))tri(...ids.map(i=>end*N+i),new T.Vector3(end===0?-1:1,0,0));
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.userData.architectureMember='spatial188-full-depth-cloud-knee-with-real-carrier-seat';emit(g,'cedar');
  let maxGap=0;for(let row=0;row<xs.length;row++)for(const k of[2,3]){const at=row*N+k,xx=g.attributes.position.getX(at),yy=g.attributes.position.getY(at),zz=g.attributes.position.getZ(at);maxGap=Math.max(maxGap,Math.abs(actualCarrier(xx,zz)-yy));}
  shoulderContacts.push({x,closedSolid:true,width,seatZ:[.57,.73],sampledActualCarrierGrid:true,seatVertices:xs.length*2,maxFloat32CarrierYGap:maxGap,source:'Actual same authored transverse-carrier grid, not a photo/depth surface'});
 }
 // Side bays share the load: full-depth header and receiving blocks replace
 // the former purely front-facing rail impression beneath the shoulder eave.
 for(const side of[-1,1])for(const [a,b,drop]of[[C.columnAxes[3],C.columnAxes[4],.72],[C.columnAxes[4],C.columnAxes[5],1.0]]){
  const x=side*(a+b)/2,w=b-a+.08,y=C.capitalTop-drop+.16;
  box(x,y,-.23,w,.35,.82,'cedar');
  for(const xx of[side*a,side*b]){box(xx,y+.25,-.18,.39,.17,.76,'endwood');between([xx,y+.21,.12],[xx,y+.82,-.42],.17,.23,'cedar');}
 }
 // Long timber ties cross the newly recessed upper wall plane and carry
 // the high eave as a deep overhang; this is visible at the roof shoulders.
 for(const side of[-1,1])for(let j=0;j<8;j++){
  const x=side*(3.36+j*.52),top=profile.upperRaw(x,C.ridgeZ+4.5)-.27;
  between([x,top-.63,-2.35],[x,top-.17,-.50],.17,.25,'cedar');
  box(x,top-.71,-1.50,.21,.22,2.02,'darkwood');
  box(x,top-.20,-.62,.39,.19,.53,'endwood');
 }
 // Large round floral lattice centres provide an occupied timber wall plane
 // behind the deep columns, rather than four unbroken black rectangles.
 for(const side of[-1,1])for(const [a,b]of[[C.columnAxes[3],C.columnAxes[4]],[C.columnAxes[4],C.columnAxes[5]]]){
  const x=side*(a+b)/2,y=C.stairTopY+1.98,z=-.30,r=Math.min(.44,(b-a)*.24);
  const ring=new T.TorusGeometry(r,.026,8,48);emit(ring,'cedar',x,y,z);
  emit(new T.TorusGeometry(r*.82,.011,6,48),'oldgold',x,y,z+.016);
  for(let j=0;j<12;j++){
   const a=j*Math.PI/6,xx=x+Math.cos(a)*r*.64,yy=y+Math.sin(a)*r*.64;
   between([x+Math.cos(a)*r*.20,y+Math.sin(a)*r*.20,z+.012],[xx,yy,z+.012],.019,.026,'oldgold');
   rosette(xx,yy,z+.018,.070,'oldgold');
  }
  rosette(x,y,z+.034,.17,'oldgold');
 }
 return{revision:'scene04-mass164-closed-bearing-hierarchy',deepArches:4,pairedColumnReceivers:2,sideBayHeaders:4,upperOverhangTies:16,latticeCentres:4,spatial188ShoulderBraces:shoulderContacts,visualAccepted:false};
}
