import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {ROOM_LAYOUT248,cofferPlan248} from './room-layout248.js';

// Structure only. Materials, lighting, sculpture, altar and furniture are owned
// by the caller. All returned pieces are actual opaque closed solids.
export function buildRoomStructure248({materials,layout=ROOM_LAYOUT248,bindTimber=(g,m)=>m,columnCollar=null,apertures=[],floorPanelMaterial=null,paper234=null}={}){
 if(!materials?.column||!materials?.beam||!materials?.dark)throw Error('Room248 requires existing room materials');
 const group=new T.Group();group.name='scene06-room248-closed-interior-frame';
 const geometries=new Set(),blockers=[],pillarRoots=[],contacts=[],mountPlanes=[],rearApertures=[],paintedPlan=cofferPlan248(layout);
 const role=n=>materials[n]??materials.beam;
 function mesh(g,m,name,p=[0,0,0],rotation=null){const o=new T.Mesh(g,m);o.name=name;o.position.fromArray(p);if(rotation)o.rotation.set(...rotation);o.castShadow=o.receiveShadow=true;group.add(o);geometries.add(g);blockers.push(o);return o;}
 function box(p,s,m=role('beam'),name='room248-bearing-timber'){
  const radius=name.includes('floorboard')?.0004:Math.min(.009,Math.min(...s)*.10),g=new RoundedBoxGeometry(...s,2,radius);g.parameters={...g.parameters,width:s[0],height:s[1],depth:s[2]};return mesh(g,bindTimber(g,m,p),name,p);
 }
 function extrude(shape,depth,p,name,{yaw=0,vertical=false,m=role('beam')}={}){
  const g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.009,bevelThickness:.007,bevelSegments:4,curveSegments:26});g.translate(0,0,-depth/2);const q=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<q.count;i++)uv.setXY(i,(vertical?q.getY(i):q.getX(i))/2.4,(vertical?q.getX(i):q.getY(i))/.32);return mesh(g,m,name,p,[0,yaw,0]);
 }
 function masu(x,y,z,w,h,d){
  const rings=[[-.50,.80],[-.30,.97],[.20,1],[.50,.85]],p=[],ix=[];
  for(const[yy,f]of rings){const a=w*f/2,b=d*f/2,c=Math.min(w,d)*.08;for(const [xx,zz]of[[-a+c,-b],[a-c,-b],[a,-b+c],[a,b-c],[a-c,b],[-a+c,b],[-a,b-c],[-a,-b+c]])p.push(xx,yy*h,zz);}
  for(let j=0;j<3;j++)for(let k=0;k<8;k++){const n=(k+1)%8,a=j*8+k,b=j*8+n,c=a+8,d=b+8;ix.push(a,c,b,b,c,d);}const lo=p.length/3;p.push(0,-h/2,0);const hi=p.length/3;p.push(0,h/2,0);for(let k=0;k<8;k++){const n=(k+1)%8;ix.push(lo,n,k,hi,24+k,24+n);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(p.flatMap((v,i)=>i%3===0?[p[i]/2.4,p[i+2]/.32]:[]),2));g.setIndex(ix);g.computeVertexNormals();return mesh(g,role('beam'),'room248-waisted-closed-masu',[x,y,z]);
 }
 function arm(x,y,z,w,h,d,yaw=0){
  const s=new T.Shape();s.moveTo(-w/2,h*.45);s.lineTo(w/2,h*.45);s.bezierCurveTo(w*.55,-h*.04,w*.41,-h*.33,w*.30,-h*.20);s.quadraticCurveTo(w*.18,-h*.48,0,-h*.42);s.quadraticCurveTo(-w*.18,-h*.48,-w*.30,-h*.20);s.bezierCurveTo(-w*.41,-h*.33,-w*.55,-h*.04,-w/2,h*.45);s.closePath();return extrude(s,d,[x,y,z],'room248-interlocked-curved-capital-arm',{yaw});
 }
 function capital(x,z,r){
  const k=r/.4875;masu(x,6.67,z+.08,1.12*k,.22,1.12*k);
  for(const[i,y]of[6.78,6.97].entries()){
   const w=(1.65+i*.40)*k,fore=.30+i*.08;
   arm(x,y,z+fore,w,.25,(.55+i*.09)*k);
   arm(x,y+.014,z+.12+i*.08,(1.75+i*.25)*k,.25,.44*k,Math.PI/2);
   for(const side of[-1,1])masu(x+side*w*.34,y+.105,z+fore+.10,.27*k,.14,.36*k);
  }
  box([x,6.97,z+.32],[.40*k,.20,1.60*k],role('beam'),'room248-capital-fore-aft-bearing-tie');
  contacts.push({kind:'post-capital-girder',at:[x,z],shaftTop:layout.columns.shaftTop,footMasuWidth:1.12*k,shaftDiameter:2*r,masuBottom:6.56,frontArmFaceFromAxis:.70,foreAftArmFaceFromAxis:1.20*k,primaryFrontFromAxis:layout.primaryGirder.frontFromRow,primaryBottom:layout.primaryGirder.bottomY,actualOverlapAuthored:true});
 }
 function column(row,side){
  const x=side*row.axisX,z=row.z,r=row.radius,h=layout.columns.shaftTop-layout.columns.bottom,pts=[[0,0],[r*1.015,0],[r*1.01,h*.18],[r*1.012,h*.48],[r*.99,h*.80],[r,h],[0,h]].map(p=>new T.Vector2(...p)),g=new T.LatheGeometry(pts,64),p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,Math.atan2(p.getZ(i),p.getX(i))*r/.32,p.getY(i)/2.4);const o=mesh(g,role('column'),'room248-column-'+row.key+'-'+side,[x,layout.columns.bottom,z]);pillarRoots.push(o);
  const cs=r/.39;box([x,.10,z],[.92*cs,.20,.92*cs],role('black'),'room248-closed-post-plinth');
  for(const[y,hh]of[[layout.columns.cuffBottomY,.46],[layout.columns.cuffTopY,.30]]){
   if(columnCollar){const b=mesh(columnCollar.body,role('ceilingLacquer'),'room248-retained-closed-column-cuff',[x,y,z]);b.scale.set(cs,hh/.46,cs);const a=mesh(columnCollar.relief,role('oldgold'),'room248-retained-source-cuff-relief',[x,y,z]);a.scale.set(cs,hh/.46,cs);}else mesh(new T.CylinderGeometry(r*1.10,r*1.10,hh,64),role('ceilingLacquer'),'room248-closed-column-cuff',[x,y,z]);
   // Rounded old-gilt edges leave the black cuff visible; a filled bright
   // cylinder end face would become the unwanted white collar band.
   for(const yy of[y-hh/2,y+hh/2])mesh(new T.TorusGeometry(r*1.10,r*.020,10,64),role('oldgold'),'room248-old-gilt-cuff-edge',[x,yy,z],[Math.PI/2,0,0]);
  }capital(x,z,r);
 }
 const B=layout.bounds,back=B.backZ-.10,front=B.frontZ+.20,depth=front-back,cz=(front+back)/2;
 function piercedAisleDeck(side){
  const A=layout.aisle,x0=side<0?-A.outsideX:A.insideX,x1=side<0?-A.insideX:A.outsideX,s=new T.Shape();s.moveTo(x0,-front);s.lineTo(x1,-front);s.lineTo(x1,-back);s.lineTo(x0,-back);s.closePath();
  for(const e of paintedPlan.filter(p=>p.lane==='aisle'&&p.x*side>0)){const h=new T.Path(),a=.390,b=.650;h.moveTo(e.x-a,-e.z-b);h.lineTo(e.x-a,-e.z+b);h.lineTo(e.x+a,-e.z+b);h.lineTo(e.x+a,-e.z-b);h.closePath();s.holes.push(h);}
  const g=new T.ExtrudeGeometry(s,{depth:A.soffitTopY-A.soffitBottomY,steps:1,bevelEnabled:false,curveSegments:1});g.rotateX(-Math.PI/2);g.translate(0,A.soffitBottomY,0);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getZ(i)/2.4,p.getX(i)/.32);g.userData.room248RoutedDeck={actualThroughOpenings:paintedPlan.filter(p=>p.lane==='aisle'&&p.x*side>0).length,holeSize:[.780,1.300],closedTimberThickness:A.soffitTopY-A.soffitBottomY};mesh(g,role('ceilingWood'),'room248-closed-side-soffit-with-actual-coffer-openings');
 }
 // The main girder gains substance upward and forward. Its underside and rear
 // face remain at the old234 clearance, preserving the held mandorla envelope.
 function crossGirder(z){
  const d=layout.primaryGirder,w=d.halfSpan*2,h=d.topY-d.bottomY;
  box([0,(d.topY+d.bottomY)/2,z+(d.frontFromRow+d.rearFromRow)/2],[w,h,d.frontFromRow-d.rearFromRow],role('beam'),'room248-primary-transverse-girder');
  box([0,d.bottomY+.055,z+d.frontFromRow+.015],[w-.12,.11,.11],role('beam'),'room248-real-receiving-girder-toe');
  mountPlanes.push({rowZ:z,frontFaceZ:z+d.frontFromRow,facingCentreZ:z+d.frontFromRow+.008,facingFrontZ:z+d.frontFromRow+.028,reliefZ:z+d.frontFromRow+.030,y:6.98,width:w-.24,scope:'Existing optional coffer-relief mounts on the actual closed girder'});
 }
 for(const row of layout.postRows){for(const side of[-1,1])column(row,side);crossGirder(row.z);}
 crossGirder(B.backZ+.25);crossGirder(B.frontZ-.35);
 for(const side of[-1,1]){
  const n=layout.naveLongitudinal;box([side*n.axisX,(n.bottomY+n.topY)/2,cz],[n.width,n.topY-n.bottomY,depth],role('beam'),'room248-continuous-nave-aisle-bearing');
  const a=layout.aisle;piercedAisleDeck(side);
  for(const z of layout.postRows.map(r=>r.z))box([side*(B.halfWidth+n.axisX)/2,(a.crossBottomY+a.crossTopY)/2,z],[B.halfWidth-n.axisX+.16,a.crossTopY-a.crossBottomY,.30],role('beam'),'room248-side-aisle-cross-bearing');
  for(const z of[-5.7,-3.3,-.9,1.5,3.9,6.3,8.7])box([side*6.64,3.37,z],[.26,6.74,.28],role('rearFrame'),'room248-structural-side-wall-stud');
  box([side*B.halfWidth,3.6,(back-5.8)/2],[.24,7.2,-5.8-back],role('dark'),'room248-opaque-rear-aisle-return');
 }
 // A returned side bay has two distinct planes: a real front timber grille
 // and an actual paper window in the rear closure. The visible white field
 // is not a photographed/depth card. Its hidden metre-depth is an inference.
 const R=layout.rearBay,wall=new T.Shape();wall.moveTo(-6.9,0);wall.lineTo(6.9,0);wall.lineTo(6.9,7.2);wall.lineTo(-6.9,7.2);wall.closePath();
 for(const side of[-1,1]){const cx=side*R.rearPaperCenterX,hole=new T.Path();hole.moveTo(cx-R.rearPaperWidth/2,R.rearPaperBottom);hole.lineTo(cx-R.rearPaperWidth/2,R.rearPaperTop);hole.lineTo(cx+R.rearPaperWidth/2,R.rearPaperTop);hole.lineTo(cx+R.rearPaperWidth/2,R.rearPaperBottom);hole.closePath();wall.holes.push(hole);}
 extrude(wall,.26,[0,0,B.backZ],'room248-closed-apse-wall-with-two-true-window-openings',{m:role('dark')});
 for(let i=1;i<7;i++){const x=-5.95+i*1.70;box([x,3.35,B.backZ+.19],[1.55,5.5,.14],role('rearPanel'),'room248-recessed-apse-wall-field');for(const dx of[-.78,.78])box([x+dx,3.35,B.backZ+.30],[.13,5.68,.38],role('rearFrame'),'room248-deep-apse-vertical-frame');for(const yy of[.56,3.5,6.14])box([x,yy,B.backZ+.30],[1.67,.14,.38],role('rearFrame'),'room248-deep-apse-horizontal-frame');}
 for(const side of[-1,1]){
  const pcx=side*R.rearPaperCenterX,pcy=(R.rearPaperBottom+R.rearPaperTop)/2,pz=B.backZ+.095;
  const paper=paper234?(side<0?paper234.left:paper234.right):role('rearPanel');
  const sheet=box([pcx,pcy,pz],[R.rearPaperWidth+.006,R.rearPaperTop-R.rearPaperBottom+.006,.0018],paper,'room248-real-thick-paper-rear-window');sheet.userData.room248PaperBoundary={existing234Material:true,transmissionApproximation:true,physicalThickness:.0018};
  for(const dx of[-1,1])box([pcx+dx*(R.rearPaperWidth/2+.055),pcy,B.backZ+.14],[.11,R.rearPaperTop-R.rearPaperBottom+.22,.20],role('rearFrame'),'room248-rear-window-returned-jamb');
  for(const yy of[R.rearPaperBottom-.055,R.rearPaperTop+.055])box([pcx,yy,B.backZ+.14],[R.rearPaperWidth+.22,.11,.20],role('rearFrame'),'room248-rear-window-returned-header');
  const x0=side<0?-R.outsideX:R.insideX,x1=side<0?-R.insideX:R.outsideX,cx=side*R.openingCenterX,s=new T.Shape();s.moveTo(x0,R.bodyBottom);s.lineTo(x1,R.bodyBottom);s.lineTo(x1,R.bodyTop);s.lineTo(x0,R.bodyTop);s.closePath();
  const opening=new T.Path();opening.moveTo(cx-R.openingWidth/2,R.openingBottom);opening.lineTo(cx-R.openingWidth/2,R.openingTop);opening.lineTo(cx+R.openingWidth/2,R.openingTop);opening.lineTo(cx+R.openingWidth/2,R.openingBottom);opening.closePath();s.holes.push(opening);
  extrude(s,.18,[0,0,R.screenZ],'room248-closed-returned-side-bay-screen',{m:role('rearFrame')});
  box([side*(R.insideX+R.outsideX)/2,.12,R.screenZ],[R.outsideX-R.insideX+.12,.24,.30],role('rearFrame'),'room248-returned-bay-closed-ground-sill');
  box([side*(R.insideX+R.outsideX)/2,6.65,R.screenZ],[R.outsideX-R.insideX+.12,.20,.28],role('rearFrame'),'room248-returned-bay-closed-ceiling-header');
  const cy=(R.openingBottom+R.openingTop)/2,h=R.openingTop-R.openingBottom,gz=R.screenZ+.11;
  for(const dx of[-1,1])box([cx+dx*(R.openingWidth/2+.04),cy,gz],[.08,h+.16,.12],role('rearFrame'),'room248-rear-bay-grille-stile');
  for(const yy of[R.openingBottom-.04,R.openingTop+.04])box([cx,yy,gz],[R.openingWidth+.16,.08,.12],role('rearFrame'),'room248-rear-bay-grille-rail');
  for(let i=1;i<5;i++)box([cx-R.openingWidth/2+i*R.openingWidth/5,cy,gz],[.012,h+.012,.055],role('rearFrame'),'room248-rear-bay-real-vertical-lattice');
  for(let i=1;i<8;i++)box([cx,R.openingBottom+i*h/8,gz],[R.openingWidth+.012,.012,.055],role('rearFrame'),'room248-rear-bay-real-horizontal-lattice');
  rearApertures.push({normal:[0,0,1],paperCenter:[pcx,pcy,pz],paperSize:[R.rearPaperWidth,R.rearPaperTop-R.rearPaperBottom],paperThickness:.0018,frontGrille:{center:[cx,cy,gz],size:[R.openingWidth,h]},physicalLayerSeparation:gz-pz,existingPaperRadianceValuesHeld:true,hiddenPlaneAndDepthInferred:true,referenceVisiblePixels:R.visibleReferencePixels});
 }
 box([0,6.42,B.backZ+.40],[13.6,.28,.40],role('rearFrame'),'room248-apse-bearing-header');
 // The selective rear extension has a real jointed floor. The caller binds
 // the same scan/varnish/reflection state used by its retained floorboards.
 box([0,-.17,(back-5.9)/2],[13.8,.24,-5.9-back],role('dark'),'room248-closed-rear-floor-underlay');
 for(let i=0;i<19;i++){const x=-6.84+(i+.5)*.72,offset=(i%3)*.58;for(let k=-1;k<4;k++){const lo=Math.max(back,back+k*1.74+offset),hi=Math.min(-5.9,back+(k+1)*1.74+offset);if(hi-lo<.002)continue;const p=[x,-.025,(lo+hi)/2],s=[.7193,.05,hi-lo-.0008],m=floorPanelMaterial?floorPanelMaterial({position:p,size:s,seed:401+i*13+k*7}):role('floor');box(p,s,m,'room248-jointed-rear-floorboard');}}
 box([0,7.25,cz],[14.2,.16,depth+.2],role('dark'),'room248-closed-ceiling-deck');
 for(let i=0;i<16;i++)box([-1.875+i*.25,7.1425,cz],[.245,.055,depth],role('ceilingWood'),'room248-closed-central-ceiling-board');
 // Real support grids receive the old closed painted boards; aisle fields
 // become one narrower row at a lower level, not a second wall-sized plane.
 for(const side of[-1,1]){
  for(const x of[2.56,3.40,4.24])box([side*x,7.07,cz],[.09,.12,depth],role('ceilingLacquer'),'room248-inner-coffer-longitudinal-receiver');
  for(const x of[5.59,6.41])box([side*x,6.67,cz],[.075,.12,depth],role('ceilingLacquer'),'room248-aisle-coffer-longitudinal-receiver');
  for(const z of [...new Set(paintedPlan.map(p=>p.z))])for(const dz of[-.663,.663]){box([side*3.4,7.07,z+dz],[1.76,.12,.07],role('ceilingLacquer'),'room248-inner-coffer-cross-receiver');box([side*6,6.67,z+dz],[.90,.12,.07],role('ceilingLacquer'),'room248-aisle-coffer-cross-receiver');}
 }
 // Deeper jambs stay outside the existing clear opening, holding the234 paper
 // geometry and all current radiance/aperture coordinates intact.
 for(const a of apertures){const x=a.side*6.57,y=(a.bottom+a.top)/2;for(const dz of[-1,1])box([x,y,a.z+dz*(a.width/2+.09)],[.26,a.top-a.bottom+.34,.16],role('rearFrame'),'room248-deep-window-jamb');for(const yy of[a.bottom-.09,a.top+.09])box([x,yy,a.z],[.26,.16,a.width+.34],role('rearFrame'),'room248-deep-window-sill-header');}
 // Existing hanging anchors retain their world pose, with actual timber ties.
 for(const x of[-3.5,3.5])box([x,6.89,1.92],[.18,.16,.88],role('beam'),'room248-retained-pendant-anchor-bearing');
 group.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(group),bounds={min:bb.min.toArray(),max:bb.max.toArray()};
 const stats={revision:layout.revision,closedStructure:true,postRows:layout.postRows,columns:pillarRoots.length,cofferPlan:paintedPlan,cofferRowsFitActualBearingBays:true,cofferRecessMetres:.064,aisleDeckHasActualThroughOpenings:true,returnedBaysMeetFloorAndCeiling:true,contacts,mountPlanes,rearApertures,bounds,held:{camera:true,figures:true,altar:true,table:true,materialDefinitions:true,lightParameters:true,existingApertureCoordinates:true},newRearPaperWindows:2,rearPaperMaterialsSupplied:!!paper234,inferredBackBoundary:B.backZ,photographicMatch:false};group.userData.room248=stats;
 return{group,blockers,pillarRoots,cofferPlan:stats.cofferPlan,mountPlanes,rearApertures,bounds,stats,integration:{removeOldColumnsBeamsRearClosure:true,keepExistingShoji234:true,rearFloorIsClosed:true,reflectorSuggested:{width:13.4,depth:B.frontZ-B.backZ,centerZ:(B.frontZ+B.backZ)/2},actualBoundsMustReachRootLighting:true},dispose(){for(const g of geometries)g.dispose();}};
}
