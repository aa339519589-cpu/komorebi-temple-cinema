import {createCurvedEaveRafter} from './scene03-curved-rafter.js';

// Four-rank tokyo with flat working seats, curved lower cheeks and canted
// relief below the seats. The cut fittings follow the actual reduced end
// section; the arm's whole side is timber, not an applied square gold badge.
export function createBearing211(T,{emit,grouped,keep=g=>g}){
 const prototypes=[],seats=[];let instances=0;
 function own(g,name){g.name=name;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();prototypes.push(g);return keep(g);}
 function cast(shape,depth,name,bevel=.002){const g=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:10,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2});g.translate(0,0,-depth/2);return own(g,name);}
 function arm(length,depth,lap='',slots=[0],slotWidth=depth,halfHeight=.11){
  const h=length/2,xs=[...Array.from({length:49},(_,i)=>-h+length*i/48),...slots.flatMap(x=>[x-slotWidth/2,x+slotWidth/2])].filter(x=>x>=-h&&x<=h).sort((a,b)=>a-b),xx=[...new Set(xs)],s=new T.Shape();
  const workingSeat=x=>slots.length?T.MathUtils.smoothstep(Math.min(...slots.map(q=>Math.abs(x-q)-slotWidth/2)),0,.075):1;
  const bottom=x=>-halfHeight+(-.130*T.MathUtils.smoothstep(Math.abs(x)/h,.22,.66)+.160*T.MathUtils.smoothstep(Math.abs(x)/h,.68,1))*workingSeat(x),inside=x=>slots.some(q=>Math.abs(x-q)<slotWidth/2-1e-8);
  for(let i=0;i<xx.length-1;i++){const y=lap==='top'&&inside((xx[i]+xx[i+1])/2)?0:halfHeight;i?s.lineTo(xx[i],y):s.moveTo(xx[i],y);s.lineTo(xx[i+1],y);}
  for(let i=xx.length-2;i>=0;i--){const cut=lap==='bottom'&&inside((xx[i]+xx[i+1])/2);s.lineTo(xx[i+1],cut?0:bottom(xx[i+1]));s.lineTo(xx[i],cut?0:bottom(xx[i]));}s.closePath();
  const g=cast(s,depth,'scene03-211-coved-cheek-flat-seated-hijiki-r06-'+length+'-'+lap,.007),p=g.attributes.position;
  // The lower cheek narrows into a waist and two shallow chisel hollows.
  // Its top remains the full rectangular bearing seat for the next dou.
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),e=Math.abs(x)/h,lower=1-T.MathUtils.smoothstep(y,-halfHeight*.65,halfHeight*.50),waist=.22*Math.exp(-(((e-.73)/.16)**2))*lower;
   const cove=.010*Math.exp(-(((e-.50)/.24)**2))*lower;
   p.setZ(i,z*(1-waist)-Math.sign(z)*cove*Math.min(1,Math.abs(z)/(depth*.45)));
  }
  p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
 }
 function cup(width,height){
  const N=8,p=[],uv=[],ix=[],profile=[[.66,0],[.66,.12],[.61,.24],[.66,.38],[.79,.59],[.95,.77],[1,.88],[1,1]];
  for(const[r,t]of profile){const h=width*r/2,c=Math.min(.027,width*.065),ring=[[-h+c,-h],[h-c,-h],[h,-h+c],[h,h-c],[h-c,h],[-h+c,h],[-h,h-c],[-h,-h+c]];for(const[x,z]of ring){p.push(x,t*height,z);uv.push(x,z);}}
  for(let j=0;j<profile.length-1;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N;ix.push(a,a+N,b,b,a+N,b+N);}
  const c=p.length/3;p.push(0,0,0,0,height,0);uv.push(0,0,0,0);for(let k=0;k<N;k++)ix.push(c,k,(k+1)%N,c+1,(profile.length-1)*N+(k+1)%N,(profile.length-1)*N+k);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);return own(g,'scene03-211-square-concave-neck-dou');
 }
 const capParts=[];
 const plate=new T.Shape();plate.moveTo(-.48,-.50);plate.lineTo(.48,-.50);plate.quadraticCurveTo(.50,-.50,.50,-.48);plate.lineTo(.50,.48);plate.quadraticCurveTo(.50,.50,.48,.50);plate.lineTo(-.48,.50);plate.quadraticCurveTo(-.50,.50,-.50,.48);plate.lineTo(-.50,-.48);plate.quadraticCurveTo(-.50,-.50,-.48,-.50);plate.closePath();
 capParts.push({g:cast(plate,.024,'scene03-211-thin-worked-cut-plate',.004),m:'bearingPatina211',z:.008});
 const frame=plate.clone(),hole=new T.Path();hole.moveTo(-.47,-.47);hole.lineTo(-.47,.47);hole.lineTo(.47,.47);hole.lineTo(.47,-.47);hole.closePath();frame.holes.push(hole);capParts.push({g:cast(frame,.026,'scene03-211-narrow-cut-plate-binding-r06',.002),m:'bearingGilt',z:.027});
 for(let k=0;k<8;k++){
  const s=new T.Shape();s.moveTo(-.014,.050);s.bezierCurveTo(-.031,.12,-.029,.23,0,.29);s.bezierCurveTo(.029,.23,.031,.12,.014,.050);s.closePath();
  const g=cast(s,.018,'scene03-211-incised-eight-lobe-copper-crest-r06',.004);g.rotateZ(k*Math.PI/4);capParts.push({g,m:'bearingGilt',z:.030});
 }
 const boss=own(new T.SphereGeometry(.042,12,8),'scene03-211-small-copper-rivet-r06');boss.scale(1,1,.22);capParts.push({g:boss,m:'bearingGilt',z:.048});
 const A={
  a0:arm(1.24,.30,'top',[0],.30),b0:arm(1.24,.30,'bottom',[0],.30),
  a1:arm(1.61,.29,'top',[-.36,.36],.28),b1:arm(1.26,.28,'bottom',[0],.29),
  a2:arm(1.98,.29,'top',[-.50,.50],.27),b2:arm(1.55,.27,'bottom',[0],.29),
  b3:arm(1.02,.25,'',[.20],.25,.14)
 },cups=[cup(.73,.25),cup(.29,.18),cup(.29,.20),cup(.27,.31)],receiver=own(createCurvedEaveRafter([[-1.10,1.98,1.43],[0,1.98,1.43],[1.10,1.98,1.43]],.32,.20),'scene03-211-closed-roof-receiver');
 const tail=own(createCurvedEaveRafter([[0,.20,-.12],[0,.55,.16],[0,.98,.60],[0,1.45,1.12]],.19,.21),'scene03-211-seated-diagonal-tail');
 function cluster(x,base,z,top,scale=1,major=true,depthScale=scale){
  const sy=(top-base)/2.08;if(!(sy>0))throw Error('211 requires a positive roof-bearing gap');
  const beam=(g,p,yaw=0,ma='red')=>emit(g,ma,p[0]*scale,p[1]*sy,p[2]*depthScale,yaw?depthScale:scale,sy,yaw?scale:depthScale,yaw);
  function capped(g,length,width,y,p,yaw,rank){
   beam(g,[p[0],y,p[1]],yaw,rank%2?'red':'cedar');
   // Copper wraps the actual cut plane; it is not a floating front badge.
   const hh=rank===3?.250:.190,cy=.015;
   for(const sign of[-1,1]){
    const at=yaw?[p[0],y+cy,p[1]+sign*(length/2+.004)]:[p[0]+sign*(length/2+.004),y+cy,p[1]],angle=yaw?(sign>0?0:Math.PI):(sign>0?Math.PI/2:-Math.PI/2),w=width*(yaw?scale:depthScale),h=hh*sy;
    grouped(at[0]*scale,at[1]*sy,at[2]*depthScale,angle,()=>{for(const q of capParts)emit(q.g,q.m,0,0,q.z*Math.min(w,h),w,h,Math.min(w,h));});
   }
  }
  grouped(x,base,z,0,()=>{
   beam(cups[0],[0,0,0]);capped(A.a0,1.24,.30,.36,[0,0],0,0);capped(A.b0,1.24,.30,.36,[0,0],Math.PI/2,0);
   for(const sign of[-1,1])beam(cups[1],[sign*.36,.47,0]);
   capped(A.a1,1.61,.29,.76,[0,.28],0,1);for(const sign of[-1,1])capped(A.b1,1.26,.28,.76,[sign*.36,.28],Math.PI/2,1);
   for(const sign of[-1,1])beam(cups[2],[sign*.50,.87,.28]);
   capped(A.a2,1.98,.29,1.18,[0,.70],0,2);for(const sign of[-1,1])capped(A.b2,1.55,.27,1.18,[sign*.50,.70],Math.PI/2,2);
   for(const sign of[-1,1]){beam(cups[3],[sign*.50,1.29,1.23]);capped(A.b3,1.02,.25,1.74,[sign*.50,1.03],Math.PI/2,3);if(major)beam(tail,[sign*.23,0,0]);}
   beam(receiver,[0,0,0]);
  });
  instances++;seats.push({column:[x,base,z],roofReceiverY:top,normalizedGap:top-base,major,sectionScale:[scale,sy,depthScale],normalizedContacts:[[0,.25],[.47,.65],[.87,1.07],[1.29,1.60],[1.88,2.08]],changedConstruction:'R06 retains four complementary flat half-lapped ranks; coves and canted waists are below the working seats, with smaller fittings matched to the lifted end cut'});
 }
 return{cluster,prototypes,seats,get instances(){return instances;},construction:'Closed four-rank hijiki with flat half-laps, curved canted lower cheeks, incised waists, necked dou at common seats, slim raking tails and narrow copper cut bindings; historic details interpreted'};
}
