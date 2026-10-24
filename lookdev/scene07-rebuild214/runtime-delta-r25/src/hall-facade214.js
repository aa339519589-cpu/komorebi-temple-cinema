import * as T from 'three';

// Original inferred joinery over the retained hall datum. Every reveal,
// casement, curved transom and metal insert is a real closed solid. The HD
// photograph is a comparison input; no photographic surface is used here.
export function createHallFacade214({emit:instance,box:member,group,mats,carvedPanel}){
 const stats={revision:'scene07-primary-secondary-paired-knees-and-returned-eave-system214-r25',lowerWindowBays:0,upperWindowBays:0,returnBays:0,smallBearingClusters:0,eaveCarriers:0,curvedKnees:0,instances:0};
 const emit=(...a)=>{stats.instances++;instance(...a);},box=(...a)=>{stats.instances++;member(...a);};
 mats.hallPlaster214=new T.MeshStandardMaterial({name:'scene07-aged-lime-infill214-r23',color:0xe8dfc9,roughness:.90});
 mats.hallPaper214=new T.MeshStandardMaterial({name:'scene07-recessed-ivory-window-panels214-r23',color:0xd3bf91,roughness:.86});
 mats.hallGilt214=mats.gold.clone();mats.hallGilt214.name='scene07-inlaid-lintel-and-window-metal214-r23';mats.hallGilt214.roughness=.42;
 for(const key of['hallPlaster214','hallPaper214','hallGilt214'])mats[key].userData.hallFinish214=true;
 mats.gold.userData.hallFinish214=true;
 const profile=new T.Shape();profile.moveTo(-.5,.5);profile.lineTo(.5,.5);profile.lineTo(.5,-.13);profile.bezierCurveTo(.43,-.51,.34,-.48,.25,-.13);profile.bezierCurveTo(.14,.07,-.14,.07,-.25,-.13);profile.bezierCurveTo(-.34,-.48,-.43,-.51,-.5,-.13);profile.closePath();
 const curved=new T.ExtrudeGeometry(profile,{depth:1,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,curveSegments:14});curved.translate(0,0,-.5);
 const petal=new T.Shape();petal.moveTo(0,0);petal.bezierCurveTo(.15,-.06,.43,.03,.50,.19);petal.bezierCurveTo(.31,.10,.34,.30,.19,.25);petal.bezierCurveTo(.08,.21,.12,.08,0,0);petal.closePath();
 const leaves=[-1,1].map(sign=>{const s=new T.Shape(petal.getPoints(18).map(p=>new T.Vector2(sign*p.x,p.y)));return new T.ExtrudeGeometry(s,{depth:.014,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,curveSegments:10});});
 const boss=new T.CylinderGeometry(.025,.025,.012,12).rotateX(Math.PI/2),hinge=new T.CylinderGeometry(.019,.019,.15,12);
 function fittings(cx,cy,z,w,h){
  for(const sx of[-1,1])for(const sy of[-1,1]){
   box(cx+sx*(w/2-.065),cy+sy*(h/2-.060),z,.080,.070,.012,'hallGilt214');
   emit(boss,mats.hallGilt214,cx+sx*(w/2-.065),cy+sy*(h/2-.060),z+.010,.43,.43,.43);
  }
 }
 function casements(cx,cy,z,w,h,{opening=.08,upper=false,opaque=false,opaqueSide=0}={}){
  // Thick fixed jambs frame two real leaves. Their hinge axes sit inside
  // the reveal; they are not pasted over a dark wall plane.
  // Four thick reveal members leave a real opening into the occupied room.
  // A full black backing plane would intersect the inward-swinging leaves.
  for(const sx of[-1,1])box(cx+sx*(w/2+.035),cy,z-.10,.09,h+.16,.40,'dark');
  for(const sy of[-1,1])box(cx,cy+sy*(h/2+.035),z-.10,w+.16,.09,.40,'dark');
  for(const sx of[-1,1])box(cx+sx*(w/2+.055),cy,z+.005,.11,h+.23,.28,'red');
  for(const sy of[-1,1])box(cx,cy+sy*(h/2+.055),z+.005,w+.22,.11,.28,'red');
  box(cx,cy-h/2-.10,z+.075,w+.34,.10,.39,'wood');
  for(const side of[-1,1])group(cx+side*w*.495,cy,z+.035,-side*opening,1,()=>{
   const lw=w*.49,x=-side*lw/2,solid=opaque||side===opaqueSide,kick=upper?0:Math.min(.50,h*.25),paneHeight=upper?h-.055:h-kick-.07,paneY=upper?0:kick*.5+.005;
   if(solid)box(x,0,-.012,lw-.035,h-.03,.065,'wood');
   else{
    box(x,paneY,-.012,lw-.055,paneHeight,.050,'hallPaper214');
    if(kick){
     box(x,-h/2+kick/2+.005,-.006,lw-.045,kick-.04,.075,'wood');
     box(x,-h/2+kick, .033,lw,.075,.085,'red');
     box(x,-h/2+kick/2+.005,.037,lw-.16,kick-.14,.018,'red');
    }
   }
   for(const xx of[-lw/2,lw/2])box(x+xx,0,.024,.052,h+.015,.072,'red');
   for(const yy of[-h/2,h/2])box(x,yy,.024,lw,.053,.072,'red');
   if(solid){for(let i=1;i<6;i++)box(x-lw/2+i*lw/6,0,.042,.022,h-.10,.030,'wood');}
   else{
    const nx=upper?5:7,ny=upper?5:11;
    for(let i=1;i<nx;i++)box(x-lw/2+i*lw/nx,paneY,.043,.017,paneHeight-.015,.032,'wood');
    for(let i=1;i<ny;i++)box(x,paneY-paneHeight/2+i*paneHeight/ny,.049,lw-.055,.018,.028,'wood');
   }
   fittings(x,0,.066,lw,h);
   for(const yy of[-h*.31,h*.31])emit(hinge,mats.hallGilt214,0,yy,.035);
  });
 }
 function scrollEnds(x,y,z,w,h=1){
  for(let i=0;i<2;i++)emit(leaves[i],mats.hallGilt214,x+(i?1:-1)*w*.29,y,z,w*.39,h,1);
 }
 function lintel(x,y,z,w,h=.24){
  emit(curved,mats.red,x,y,z,w,h,.22);
  scrollEnds(x,y-h*.25,z+.127,w,h*.72);
  for(const sign of[-1,1])emit(boss,mats.hallGilt214,x+sign*w*.40,y+h*.25,z+.130,.72,.72,.72);
 }
 function smallBearing(x,y,z,roofAt,{upper=false}={}){
  const half=upper?.38:.48,depth=.50,top=Math.min(...[-half,0,half].flatMap(dx=>[-.12,depth].map(dz=>roofAt(x+dx,z+dz))))-.035,available=top-y;
  if(available<.28)return;
  const h=Math.min(upper?.45:.62,available),base=top-h;
  box(x,base+.045,z,.27,.09,.27,'wood');
  lintel(x,base+h*.25,z,half*1.55,.14);
  for(const sx of[-1,1]){
   box(x+sx*half*.48,base+h*.43,z,.15,.12,.17,'wood');
   emit(curved,mats.red,x+sx*half*.48,base+h*.62,z+.18,.64,.14,.15,[0,Math.PI/2,0]);
   box(x+sx*half*.48,base+h*.80,z+.43,.14,.12,.18,'wood');
   box(x+sx*half*.48,top-.035,z+.43,.16,.07,.24,'wood');
   emit(boss,mats.hallGilt214,x+sx*half*.48,base+h*.61,z+.513,.67,.67,.67);
  }
  stats.smallBearingClusters++;
 }
 function lowerFront(roofAt){
  const front=2.65,base=2.85;
  // Four window bays and one open portal are joined by the same sill,
  // jamb/transom frame. No oversized black holes behind isolated screens.
  for(const x of[-5.75,-3.45,3.45,5.75]){
   box(x,base+.22,front-.06,2.12,.44,.27,'hallPlaster214');
   box(x,5.76,front-.09,2.12,.49,.22,'dark');
   box(x,5.975,front-.06,2.12,.08,.25,'hallPlaster214');
   casements(x,4.36,front,1.80,2.04,{opening:Math.abs(x)<4?(x<0?.18:.30):.045,opaqueSide:Math.abs(x)>5?(x<0?-1:1):0});
   box(x,5.48,front+.08,2.06,.11,.29,'red');
   lintel(x,5.82,front+.12,2.10,.29);
   if(Math.abs(x)<4)carvedPanel(x,5.73,front+.075,1.66,.24);
   stats.lowerWindowBays++;
  }
  for(const x of[-6.90,-4.60,-2.30,2.30,4.60,6.90]){
   box(x,4.49,front+.005,.16,3.28,.32,'red');
   box(x,2.97,front+.005,.27,.24,.40,'wood');
  }
  for(const y of[5.53,6.03])box(0,y,front,14.12,.12,.32,'red');
  for(const sign of[-1,1])box(sign*4.62,3.10,front,4.88,.12,.32,'red');
  // The central sanctuary remains an actual open room behind a deep,
  // separately fitted portal. The solid crown is carried by the jambs.
  for(const x of[-2.13,2.13]){
   box(x,4.43,front+.16,.19,3.14,.37,'wood');
   box(x,4.43,front+.363,.085,2.99,.018,'hallGilt214');
   for(let j=0;j<7;j++)emit(boss,mats.hallGilt214,x,3.10+j*.43,front+.380,.64,.64,.64);
  }
  lintel(0,5.94,front+.19,4.44,.38);
  carvedPanel(0,5.80,front+.34,1.86,.33);
  // Distinct two-level horizontal load paths, curved intercolumn transoms,
  // and lighter intermediate brackets replace the old three broad bars.
  for(const [y,h,d]of[[6.10,.18,.32],[6.40,.14,.34]])box(0,y,3.70,14.75,h,d,'red');
  for(const x of[-5.75,-3.45,3.45,5.75]){
   lintel(x,6.15,3.91,2.04,.31);smallBearing(x,6.43,3.70,roofAt);
  }
  for(const x of[-1.15,1.15])smallBearing(x,6.43,3.70,roofAt);
 }
 function lowerReturns(returnSign=0){
  for(const sign of(returnSign?[returnSign]:[-1,1]))group(sign*7.0,0,-.69,sign*Math.PI/2,1,()=>{
   const width=6.78;
   for(let i=0;i<3;i++){
    const x=-width/2+(i+.5)*width/3;
    box(x,3.19,-.07,width/3-.12,.65,.22,'hallPlaster214');
    box(x,5.73,-.07,width/3-.12,.65,.22,'hallPlaster214');
    casements(x,4.43,0,1.62,1.81,{opening:i===1?.20:.04,opaque:i===0});
    lintel(x,5.89,.10,2.06,.25);stats.returnBays++;
   }
   for(let i=0;i<=3;i++)box(-width/2+i*width/3,4.50,.055,.16,3.32,.30,'red');
   for(const y of[2.91,5.47,6.18,6.47])box(0,y,.045,width+.20,.14,.32,'red');
  });
 }
 function upperWall(z,angle=0,width=13.12,count=6){
  group(0,0,z,angle,1,()=>{
   const bay=width/count;
   for(let i=0;i<count;i++){
    const x=-width/2+(i+.5)*bay,w=bay-.20;
    box(x,8.77,-.055,w,.48,.24,'hallPlaster214');
    box(x,10.23,-.055,w,.47,.24,'hallPlaster214');
    casements(x,9.49,0,w-.20,.89,{opening:i===2?.28:i===3?.38:i===0||i===count-1?.12:.025,upper:true,opaque:i===0||i===count-1});
    lintel(x,10.25,.12,w,.22);
    stats.upperWindowBays++;
   }
   for(let i=0;i<=count;i++)box(-width/2+i*bay,9.51,.075,.145,1.93,.30,'red');
   for(const y of[8.55,9.035,9.965,10.48])box(0,y,.075,width+.28,.105,.29,'red');
  });
 }
 function upperFrontJoinery(roofAt){
  if(!roofAt)return;
  const z=3.40,seat=x=>Math.min(...[-.80,-.57,0,.57,.80].flatMap(dx=>[-.36,-.19,0,.30,.78,.94].map(dz=>roofAt(x+dx,z+dz))))-.62+.065;
  for(let i=0;i<48;i++){
   const ax=-6.66+i*13.32/48,bx=-6.66+(i+1)*13.32/48,ay=seat(ax),by=seat(bx),length=Math.hypot(bx-ax,by-ay),angle=Math.atan2(by-ay,bx-ax);
   box((ax+bx)/2,(ay+by)/2,z,length+.004,.13,.29,'red',[0,0,angle]);
  }
  for(const x of[-5.55,-3.33,-1.11,1.11,3.33,5.55]){
   const y=seat(x);lintel(x,y+.075,3.65,1.82,.22);smallBearing(x,y+.10,3.40,roofAt,{upper:true});
  }
 }
 function eaveCarriers(roofAt,{upper=false,returnSign=0,isReturn=false,outerLimit=0}={}){
  if(returnSign){
   // Rotate the same real construction into each return. Its height still
   // comes from the shared hall roof, including the asymmetric skew plan.
   group(0,0,0,returnSign*Math.PI/2,1,()=>eaveCarriers((x,z)=>roofAt(returnSign*z,-returnSign*x),{upper,isReturn:true,outerLimit:upper?(returnSign<0?7.78:8.08):7.78}));return;
  }
  const axes=isReturn?[-3.35,-1.10,1.15,3.40]:upper?Array.from({length:13},(_,i)=>-6.66+i*1.11):[-6.9,-5.75,-4.6,-3.45,-2.3,-1.15,0,1.15,2.3,3.45,4.6,5.75,6.9],z0=isReturn?7.04:upper?4.02:4.35,z1=isReturn?outerLimit:upper?6.02:5.72,columnZ=isReturn?6.94:upper?3.40:3.70;
  for(let axis=0;axis<axes.length;axis++){
   const x=axes[axis],primary=isReturn||(upper?axis%2===0:[0,2,4,8,10,12].includes(axis));
   // A closed bent carrier takes each capital's outer seat to the actual
   // flying-rafter bed. Its top is queried over the complete timber width.
   const p=[],ix=[],uv=[],N=20,width=upper?.145:.16;
   for(let i=0;i<=N;i++){
    const t=i/N,z=z0+(z1-z0)*t,top=Math.min(...[-width/2,0,width/2].flatMap(dx=>[-.02,0,.02].map(dz=>roofAt(x+dx,z+dz))))-.015,h=.16+.045*Math.sin(t*Math.PI);
    for(const q of[[x-width/2,top,z],[x+width/2,top,z],[x+width/2,top-h,z],[x-width/2,top-h,z]]){p.push(...q);uv.push(q[2],q[1]);}
   }
   const quad=(a,b,c,d)=>ix.push(a,b,c,a,c,d);
   for(let i=0;i<N;i++)for(let k=0;k<4;k++)quad(i*4+k,(i+1)*4+k,(i+1)*4+(k+1)%4,i*4+(k+1)%4);
   quad(0,1,2,3);quad(N*4+3,N*4+2,N*4+1,N*4);
   let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g=g.toNonIndexed();g.computeVertexNormals();g.userData.architectureMember='closed-roof-contacting-eave-carrier214-r24';emit(g,mats.wood,0,0,0);
   const top=p[N*12+1],bottom=p[N*12+7];box(x,(top+bottom)/2,z1+.009,width*.92,(top-bottom)*.88,.015,'hallGilt214');
   stats.eaveCarriers++;
   // Curved cheek knees meet the column-side first arm and the underside
   // of that carrier. The open space around the solid is real geometry.
   const rootZ=columnZ+(isReturn?.24:primary?.50:.80),endZ=z1-.32,rootY=roofAt(x,rootZ)-.24,endY=roofAt(x,endZ)-.205,mid=(rootZ+endZ)*.5;
   const shape=new T.Shape();shape.moveTo(-rootZ,rootY+.075);shape.bezierCurveTo(-(rootZ+.18),rootY+.09,-(endZ-.20),endY+.05,-endZ,endY+.05);shape.lineTo(-(endZ+.045),endY-.045);shape.bezierCurveTo(-(endZ-.18),endY-.085,-(mid-.04),rootY-.035,-rootZ,rootY-.040);shape.closePath();
   const thickness=primary?.052:.070,knee=new T.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2,curveSegments:14});knee.rotateY(Math.PI/2);knee.translate(-thickness/2,0,0);knee.userData.architectureMember='closed-primary-secondary-paired-curved-knee214-r25';
   for(const offset of(primary?[-.070,.070]:[0])){emit(knee,mats.wood,x+offset,0,0);stats.curvedKnees++;}
  }
 }
 return{lowerFront,lowerReturns,upperWall,upperFrontJoinery,eaveCarriers,smallBearing,info:()=>({...stats,inferredConstruction:true,sceneCards:false,photographicSurface:false,newLights:0,newDownloadedAssets:0,visualAccepted:false})};
}
