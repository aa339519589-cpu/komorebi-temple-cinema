// Original scene03 ritual entrance solids. Reference03 is a comparison input;
// no photograph, depth surface, new light, or camera-dependent geometry.
export function buildRitualLantern371(T,{emit,gold,bronze,paper,wood,noren},pose=[5.70,6.84,-4.0]){
 const stats={revision:'scene03-closed-rounded-pierced-ritual-lantern371-r04',poseFixture:pose,poseHall:[pose[0]-5,pose[1],pose[2]+3],panelCount:16,piercedCells:128,physicalMount:true,newLights:0,photographicAccepted:false};
 const profile=[[-.48,.18],[-.42,.34],[-.28,.49],[-.08,.565],[.12,.56],[.30,.48],[.43,.30],[.48,.18]],radius=y=>{let i=0;while(i<profile.length-2&&y>profile[i+1][0])i++;const a=profile[i],b=profile[i+1];return T.MathUtils.lerp(a[1],b[1],(y-a[0])/(b[0]-a[0]));};
 const at=(g,ma,p=[0,0,0],r=[0,0,0])=>emit(g,ma,[pose[0]+p[0],pose[1]+p[1],pose[2]+p[2]],[1,1,1],r);
 function oriented(g,name){const p=g.attributes.position,ids=g.index?Array.from(g.index.array):Array.from({length:p.count},(_,i)=>i);let v=0;for(let i=0;i<ids.length;i+=3){const a=new T.Vector3().fromBufferAttribute(p,ids[i]),b=new T.Vector3().fromBufferAttribute(p,ids[i+1]),c=new T.Vector3().fromBufferAttribute(p,ids[i+2]);v+=a.dot(b.cross(c))/6;}if(v<0)for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];g.setIndex(ids);g.computeVertexNormals();g.name=name;g.userData={closedRitualSolid371:true,signedVolume:Math.abs(v),photographicPixels:false};return g;}
 function turned(points,ma,name,sides=64){return at(oriented(new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),sides),name),ma);}
 function ring(y,r,width=.025,height=.025,ma=gold){turned([[r-width,y-height],[r+width,y-height],[r+width,y+height],[r-width,y+height],[r-width,y-height]],ma,'scene03-371-closed-cast-annular-moulding');}
 function cappedTube(points,r,ma,name){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),R=Math.max(24,points.length*5),N=10,frames=curve.computeFrenetFrames(R,false),p=[],uv=[],ix=[];
  for(let j=0;j<=R;j++){const c=curve.getPointAt(j/R);for(let k=0;k<N;k++){const a=k/N*Math.PI*2,q=c.clone().addScaledVector(frames.normals[j],Math.cos(a)*r).addScaledVector(frames.binormals[j],Math.sin(a)*r);p.push(...q.toArray());uv.push(j/R,k/N);}}
  for(let j=0;j<R;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N;ix.push(a,b,a+N,b,b+N,a+N);}
  const c=p.length/3;p.push(...curve.getPointAt(0).toArray(),...curve.getPointAt(1).toArray());uv.push(.5,0,.5,1);for(let k=0;k<N;k++)ix.push(c,(k+1)%N,k,c+1,R*N+k,R*N+(k+1)%N);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);at(oriented(g,name),ma);
 }
 // A closed thin inner chamber sits behind the actual pierced copper shell.
 turned([[0,-.405],[.18,-.405],...profile.filter(p=>p[0]>-.405&&p[0]<.405).map(([y,r])=>[r-.100,y]),[.22,.405],[0,.405]],paper,'scene03-371-closed-recessed-paper-chamber');
 const panel=new T.Shape();panel.moveTo(-.183,-.405);panel.lineTo(.183,-.405);panel.lineTo(.183,.405);panel.lineTo(-.183,.405);panel.closePath();
 for(const u of[-.082,.082])for(const y of[-.285,-.095,.095,.285]){
  const pts=[];for(let k=0;k<40;k++){const a=k/40*Math.PI*2,f=.86+.14*Math.cos(a*4);pts.push(new T.Vector2(u+.036*Math.cos(a)*f,y+.061*Math.sin(a)*f));}
  if(T.ShapeUtils.isClockWise(pts)===T.ShapeUtils.isClockWise(panel.getPoints()))pts.reverse();const hole=new T.Path(pts);hole.closePath();panel.holes.push(hole);
 }
 const base=new T.ExtrudeGeometry(panel,{depth:.013,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:2,curveSegments:12,steps:1});
 for(let k=0;k<16;k++){
  const a=k*Math.PI/8,g=base.clone(),p=g.attributes.position;
  for(let j=0;j<p.count;j++){const angle=a+p.getX(j),y=p.getY(j),r=radius(y)+p.getZ(j);p.setXYZ(j,Math.sin(angle)*r,y,Math.cos(angle)*r);}
  at(oriented(g,'scene03-371-closed-warped-pierced-globular-panel'),gold);
  cappedTube(profile.map(([y,r])=>[Math.sin(a+Math.PI/16)*r,y,Math.cos(a+Math.PI/16)*r]),.021,bronze,'scene03-371-closed-continuous-body-rib');
  for(const y of[-.29,.285])at(oriented(new T.SphereGeometry(.016,12,8),'scene03-371-real-panel-rivet'),gold,[Math.sin(a)*radius(y),y,Math.cos(a)*radius(y)]);
 }
 // Closed repousse petals are warped onto the panel surface, with their
 // reverse faces seated in the metal. This breaks the long flat highlight
 // without a texture, detached badge or change to light/material energy.
 const petalShape=new T.Shape();petalShape.moveTo(0,0);petalShape.bezierCurveTo(-.028,.027,-.034,.077,0,.112);petalShape.bezierCurveTo(.034,.077,.028,.027,0,0);petalShape.closePath();
 const petalBase=new T.ExtrudeGeometry(petalShape,{depth:.013,bevelEnabled:true,bevelSize:.0025,bevelThickness:.0025,bevelSegments:2,curveSegments:12});
 for(let panel=0;panel<16;panel++)for(let petal=0;petal<8;petal++){
  const az=panel*Math.PI/8,angle=petal*Math.PI/4,g=petalBase.clone(),p=g.attributes.position;
  for(let j=0;j<p.count;j++){const xx=(p.getX(j)*Math.cos(angle)-p.getY(j)*Math.sin(angle))*.72,yy=.018+(p.getX(j)*Math.sin(angle)+p.getY(j)*Math.cos(angle))*.72,a=az+xx/.565,r=radius(yy)+.015+p.getZ(j);p.setXYZ(j,Math.sin(a)*r,yy,Math.cos(a)*r);}
  at(oriented(g,'scene03-371-closed-panel-seated-repousse-petal'),gold);
 }
 petalBase.dispose();stats.panelSeatedRepoussePetals=128;
 base.dispose();for(const [y,r]of[[-.42,.34],[-.28,.49],[.30,.48],[.43,.30]])ring(y,r,.019,.018);
 // Closed cast basin, lotus neck/crown, suspension loops and one pendant.
 turned([[0,-.57],[.12,-.57],[.26,-.52],[.36,-.43],[.34,-.40],[.28,-.42],[.17,-.49],[0,-.49]],gold,'scene03-371-closed-rounded-cast-basin');
 turned([[0,.435],[.23,.435],[.27,.465],[.235,.505],[.16,.53],[.14,.61],[.095,.65],[0,.65]],bronze,'scene03-371-closed-lotus-crown-neck');
 ring(.51,.175,.021,.018);ring(-.535,.17,.020,.014);
 for(let k=0;k<12;k++){
  const a=k*Math.PI/6,shape=new T.Shape();shape.moveTo(-.050,0);shape.bezierCurveTo(-.095,.09,-.065,.17,0,.24);shape.bezierCurveTo(.065,.17,.095,.09,.050,0);shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,curveSegments:12});g.translate(0,0,-.009);at(oriented(g,'scene03-371-closed-crown-lotus-petal'),gold,[Math.sin(a)*.185,.415,Math.cos(a)*.185],[0,a,0]);
 }
 turned([[0,-.80],[.023,-.78],[.042,-.71],[.070,-.66],[.045,-.61],[0,-.60]],gold,'scene03-371-closed-lotus-finial-pendant',32);
 at(oriented(new T.TorusGeometry(.045,.012,10,32),'scene03-371-closed-upper-hanging-eye'),gold,[0,.692,0]);
 const mountY=7.96-pose[1],linkTop=mountY-.11,linkBottom=.73;
 cappedTube([[0,.73,0],[0,linkTop,0]],.010,bronze,'scene03-371-closed-short-suspension-staff');
 for(let j=0;j<3;j++)at(oriented(new T.TorusGeometry(.026,.008,10,28),'scene03-371-closed-suspension-link'),gold,[0,linkBottom+(linkTop-linkBottom)*j/2,0],[0,j%2*Math.PI/2,0]);
 const timber=new T.BoxGeometry(.16,.18,2.30);at(oriented(timber,'scene03-371-real-ceiling-lantern-bearer'),wood,[0,mountY,-.20]);
 // The bearer enters the old front header and the added inner ceiling tie.
 for(const dz of[-1.20,.80]){
  at(oriented(new T.BoxGeometry(.23,.020,.22),'scene03-371-closed-bearer-upper-clamp'),bronze,[0,mountY+.104,dz]);
  for(const sx of[-1,1])at(oriented(new T.BoxGeometry(.018,.21,.22),'scene03-371-closed-bearer-clamp-cheek'),bronze,[sx*.092,mountY,dz]);
 }
 if(noren){
  const relative=(x,y,z)=>[x-pose[0],y-pose[1],z-pose[2]],top=noren.topY,rodY=top+.045;
  cappedTube([relative(noren.centreX-.72,rodY,noren.frontZ),relative(noren.centreX+.72,rodY,noren.frontZ)],.018,bronze,'scene03-371-closed-noren-support-rod');
  for(const side of[-1,1]){
   const x=noren.centreX+side*.54;
   at(oriented(new T.BoxGeometry(.055,.075,.79),'scene03-371-housed-noren-outreach'),wood,relative(x,7.82,noren.frontZ-.35));
   cappedTube([relative(x,7.795,noren.frontZ),relative(x,rodY+.035,noren.frontZ)],.008,bronze,'scene03-371-closed-noren-suspension');
  }
  for(let j=0;j<4;j++)at(oriented(new T.TorusGeometry(.020,.005,8,24),'scene03-371-closed-noren-hanging-loop'),gold,relative(noren.centreX+(j-1.5)*noren.width/4,top+.020,noren.frontZ));
  stats.norenMount={...noren,rodY,actualClosedHousedOutreach:true,originalTopHeld:true};
 }
 stats.radius=.565;stats.bodyHeight=.96;stats.lowestHallY=pose[1]-.80;stats.ceilingBearerHallY=7.96;stats.mountEndpointsHall=[[pose[0]-5,7.96,pose[2]+3+.95],[pose[0]-5,7.96,pose[2]+3-1.35]];return stats;
}

export function buildInnerThreshold371(T,{floor,box,mesh,own,timber,lacquer,endgrain,gilt,oldgold,carving}){
 const info={revision:'scene03-receding-carved-threshold371-r04',floorY:floor,frames:[],newLights:0,photographicPixels:false};
 for(const [z,half,height,depth]of[[-1.68,1.99,3.55,.25],[-3.05,1.76,3.30,.25]]){
  for(const side of[-1,1]){
   box('portal371-founded-inner-jamb',[side*half,floor+height/2,z],[.20,height,depth],timber,.012);
   for(const y of[floor+.15,floor+height-.13])box('portal371-inner-jamb-collar',[side*half,y,z+.14],[.25,.10,.038],oldgold,.004);
   for(let j=0;j<5;j++)mesh(carving.foliateStrut(),gilt,[side*half,floor+.29+j*(height-.76)/4,z+.132],[.080,.32,.28],[0,0,0],'portal371-embedded-open-foliate-jamb');
  }
  box('portal371-deep-carried-lintel',[0,floor+height,z],[half*2+.35,.26,.42],timber,.012);
  box('portal371-lintel-recess',[0,floor+height-.025,z+.235],[half*2-.14,.16,.035],lacquer,.004);
  for(let j=-3;j<=3;j++)mesh(carving.foliateStrut(),gilt,[j*(half*2-.40)/7,floor+height-.11,z+.25],[.205,.11,.35],[0,0,0],'portal371-seated-open-lintel-carving');
  for(const side of[-1,1]){const low=floor+height+.13,high=floor+3.93;box('portal371-lintel-seat-upstand',[side*half,(low+high)/2,z],[.22,high-low,.28],endgrain,.009);}
  info.frames.push({z,clearWidth:half*2-.20,clearHeight:height-.13,jambSection:[.20,depth],headDepth:.42});
 }
 // Ceiling ties enter both old side returns and lie below the real ceiling.
 for(const z of[-1.68,-2.60,-3.05,-3.65,-4.70])box('portal371-housed-ceiling-tie',[0,floor+3.99,z],[4.52,.16,.21],timber,.008);
 for(const x of[-1.45,-.48,.48,1.45])box('portal371-ceiling-coffer-longitudinal',[x,floor+3.94,-3.10],[.08,.14,3.30],endgrain,.006);
 for(const x of[-1.0,0,1.0])for(const z of[-2.05,-3.10,-4.15]){
  box('portal371-recessed-ceiling-coffer',[x,floor+4.035,z],[.87,.035,.86],lacquer,.003);
  mesh(carving.foliateStrut(),oldgold,[x,floor+4.005,z],[.18,.18,.25],[-Math.PI/2,0,0],'portal371-open-coffer-relief-on-real-backing');
 }
 // A founded low ritual screen leaves a real1.10m central aisle. It frames
 // the shrine instead of exposing the whole icon against an empty black box.
 for(const side of[-1,1]){
  const a=side*.55,b=side*1.91,c=(a+b)/2,w=Math.abs(b-a);
  for(const x of[a,b]){
   box('portal371-screen-foot',[x,floor+.04,-1.32],[.24,.08,.28],lacquer,.008);box('portal371-screen-post',[x,floor+.43,-1.32],[.11,.78,.11],timber,.008);box('portal371-screen-post-cap',[x,floor+.845,-1.32],[.16,.07,.17],oldgold,.006);
  }
  for(const y of[.24,.77])box('portal371-joined-screen-rail',[c,floor+y,-1.32],[w+.10,.085,.11],timber,.007);
  box('portal371-screen-recess-backing',[c,floor+.48,-1.34],[w-.13,.37,.045],lacquer,.003);
  for(let j=0;j<3;j++)mesh(carving.foliateStrut(),oldgold,[c+(j-1)*w*.27,floor+.35,-1.31],[.18,.22,.38],[0,0,0],'portal371-mounted-open-screen-relief');
 }
 box('portal371-low-closed-threshold-sill',[0,floor+.025,-.93],[4.05,.05,.24],endgrain,.006);
 info.centralAisleWidth=1.10;info.ceilingContactY=floor+4.07;return info;
}
