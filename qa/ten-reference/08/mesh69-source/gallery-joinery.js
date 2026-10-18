import * as T from 'three';

// Scene08-local closed joinery derived from scene01/sculpted-joinery.js.
// Applies only to the left grand hall/gallery. The pagoda and site stay fixed.
export function createGalleryCurvedJoinery(){
 const owned=new Set(),parts=[];
 const keep=g=>{owned.add(g);return g;};
 function extrude(shape,depth=.22,bevel=.012){const g=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:10,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2});g.translate(0,0,-depth/2);return keep(g);}
 function part(g,material='redlight',position=[0,0,0],rotation=0,cornerOnly=false){const q=keep(g.clone());q.rotateY(rotation);q.translate(...position);parts.push({geometry:q,material,cornerOnly,cornerAxis:cornerOnly});return q;}
 function curvedArm(length=1.30,notch='none'){
  const h=length/2,s=new T.Shape();s.moveTo(-h,.10);
  if(notch==='top'){s.lineTo(-.12,.10);s.lineTo(-.12,0);s.lineTo(.12,0);s.lineTo(.12,.10);}
  s.lineTo(h,.10);s.quadraticCurveTo(h+.025,.005,h-.09,-.015);
  s.bezierCurveTo(h-.22,-.01,h-.19,-.11,h-.30,-.115);
  s.bezierCurveTo(h-.42,-.12,.22,-.225,.12,-.225);
  if(notch==='bottom'){s.lineTo(.12,0);s.lineTo(-.12,0);s.lineTo(-.12,-.225);}else s.lineTo(-.12,-.225);
  s.bezierCurveTo(-.22,-.225,-h+.42,-.12,-h+.30,-.115);
  s.bezierCurveTo(-h+.19,-.11,-h+.22,-.01,-h+.09,-.015);
  s.quadraticCurveTo(-h-.025,.005,-h,.10);s.closePath();return extrude(s,.22,.012);
 }
 function beam(length,depth,bottom,top,notches=[]){
  const xs=[-length/2,...notches.flatMap(n=>[n.x-n.width/2,n.x+n.width/2]),length/2].sort((a,b)=>a-b),s=new T.Shape();
  const topPoints=[],bottomPoints=[];
  for(let i=0;i<xs.length-1;i++){const mid=(xs[i]+xs[i+1])/2,n=notches.find(n=>n.side==='top'&&Math.abs(mid-n.x)<n.width/2),yy=n?n.y:top;topPoints.push([xs[i],yy],[xs[i+1],yy]);}
  for(let i=xs.length-2;i>=0;i--){const mid=(xs[i]+xs[i+1])/2,n=notches.find(n=>n.side==='bottom'&&Math.abs(mid-n.x)<n.width/2),yy=n?n.y:bottom;bottomPoints.push([xs[i+1],yy],[xs[i],yy]);}
  [...topPoints,...bottomPoints].forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return extrude(s,depth,.008);
 }
 function cushion(radius=.28,height=.12){
  const p=[],uv=[],idx=[],levels=10,N=32;
  for(let j=0;j<=levels;j++){
   const t=j/levels,r=radius*(.64+.36*Math.sin(t*Math.PI/2)),y=height*t;
   for(let i=0;i<N;i++){const a=i/N*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),power=7,x=r*Math.sign(ca)*Math.pow(Math.abs(ca),2/power),z=r*Math.sign(sa)*Math.pow(Math.abs(sa),2/power);p.push(x,y,z);uv.push(i/N,t);}
  }
  for(let j=0;j<levels;j++)for(let i=0;i<N;i++){const a=j*N+i,b=j*N+(i+1)%N,c=(j+1)*N+i,d=(j+1)*N+(i+1)%N;idx.push(a,c,b,b,c,d);}
  p.push(0,0,0,0,height,0);uv.push(.5,.5,.5,.5);const lo=p.length/3-2,hi=lo+1;
  for(let i=0;i<N;i++){idx.push(lo,i,(i+1)%N);idx.push(hi,levels*N+(i+1)%N,levels*N+i);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return keep(g);
 }
 // Retained shaft/purlin contacts, with a rounded, flaring daito and genuinely
 // half-lapped first cross. Each later arm bears on a separate curved block.
 part(cushion(.31,.20),'redlight',[0,-.15,0]);
 part(curvedArm(1.30,'top'),'redlight',[0,.225,0]);part(curvedArm(1.30,'bottom'),'redlight',[0,.225,0],Math.PI/2);
 for(const side of[-1,1]){part(cushion(.145,.055),'redlight',[side*.40,.325,0]);part(cushion(.145,.055),'redlight',[0,.325,side*.40]);}
 for(const side of[-1,1]){part(curvedArm(1.50),'redlight',[side*.40,.60,0],Math.PI/2);part(curvedArm(1.50),'redlight',[0,.60,side*.40]);}
 for(const sx of[-1,1])for(const sz of[-1,1])part(cushion(.14,.10),'redlight',[sx*.40,.70,sz*.40]);
 for(const side of[-1,1])part(beam(1.54,.23,.80,.93,[{x:0,width:.24,side:'top',y:.865}]),'redlight',[0,0,side*.40]);
 part(beam(1.52,.24,.865,.970,[-1,1].map(sign=>({x:sign*.40,width:.23,side:'bottom',y:.93}))),'wood',[0,0,0],Math.PI/2);

 // Small dark-gilt end shoes protect the cut ends. They are thin cast metal
 // plates following the arm's actual end face, rather than gold support cubes.
 function endShoe(){
  const s=new T.Shape(),w=.213,h=.112,r=.020;
  s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
  s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);
  s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  s.closePath();return extrude(s,.012,.003);
 }
 const shoe=endShoe();
 for(const sign of[-1,1]){
  part(shoe,'joinerygilt',[sign*.657,.267,0],sign*Math.PI/2);
  part(shoe,'joinerygilt',[0,.267,sign*.657],sign<0?Math.PI:0);
  for(const cross of[-1,1]){
   part(shoe,'joinerygilt',[cross*.40,.642,sign*.757],sign<0?Math.PI:0);
   part(shoe,'joinerygilt',[sign*.757,.642,cross*.40],sign*Math.PI/2);
  }
 }

 // Fit the retained hall bearing envelope rather than scaling the scene05
 // datum directly: that kit starts at -.15 and ends near .82. Exact solid
 // bounds include the bevel, so neither the foot nor receiver floats.
 const bounds=new T.Box3();
 for(const {geometry} of parts){geometry.computeBoundingBox();bounds.union(geometry.boundingBox);}
 const size=bounds.getSize(new T.Vector3()),xz=1.72/Math.max(size.x,size.z),sy=.96/size.y,baseY=bounds.min.y;
 for(const {geometry} of parts){geometry.translate(0,-baseY,0);geometry.scale(xz,sy,xz);geometry.translate(0,-.16,0);geometry.computeBoundingBox();}
 const seat=(x,y,z)=>[x*xz,(y-baseY)*sy-.16,z*xz];
 return {parts,resources:owned,seat,scale:[xz,sy,xz]};
}

// A closed solid sweep with a bevelled rectangular section. Parallel frames
// use the physical roof-up vector so the broad timber face stays under tiles.
export function createContinuousTimber(points,width=.075,depth=.12,bevel=.009){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');
 const sections=Math.max(16,points.length*3),r=Math.min(bevel,width*.3,depth*.3),a=width/2,b=depth/2;
 const section=[[-a+r,-b],[a-r,-b],[a,-b+r],[a,b-r],[a-r,b],[-a+r,b],[-a,b-r],[-a,-b+r]];
 const p=[],uv=[],ix=[],up=new T.Vector3(0,1,0);
 for(let j=0;j<=sections;j++){
  const t=j/sections,c=curve.getPoint(t),tangent=curve.getTangent(t).normalize(),across=new T.Vector3().crossVectors(up,tangent).normalize(),normal=new T.Vector3().crossVectors(tangent,across).normalize();
  for(let i=0;i<8;i++){const [x,y]=section[i],q=c.clone().addScaledVector(across,x).addScaledVector(normal,y);p.push(...q);uv.push(t*curve.getLength(),i/8);}
 }
 for(let j=0;j<sections;j++)for(let i=0;i<8;i++){const n=(i+1)%8,a=j*8+i,b=j*8+n,c=(j+1)*8+i,d=(j+1)*8+n;ix.push(a,b,c,b,d,c);}
 for(let i=1;i<7;i++){ix.push(0,i+1,i);const o=sections*8;ix.push(o,o+i,o+i+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}

// One hollow half-round ceramic cover, with real wall thickness and closed
// cut ends. Unit radius and length are scaled by the physical tile segment.
// Its upper headlap flares gently; adjacent pieces overlap at their joint.
export function createClayCoverTile(){
 const p=[],uv=[],ix=[],N=16,L=6,rows=(L+1)*(N+1);
 for(let side=0;side<2;side++)for(let j=0;j<=L;j++)for(let i=0;i<=N;i++){
  const t=j/L,a=-Math.PI/2+i/N*Math.PI,head=1+.065*Math.max(0,1-t/.24)**2,r=(side===0?1:.78)*head;
  p.push(Math.sin(a)*r,Math.cos(a)*r-.025,t-.5);uv.push(i/N,t);
 }
 for(let side=0;side<2;side++)for(let j=0;j<L;j++)for(let i=0;i<N;i++){
  const a=side*rows+j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;
  if(side===0)ix.push(a,c,b,b,c,d);else ix.push(a,b,c,b,d,c);
 }
 for(const j of[0,L])for(let i=0;i<N;i++){
  const a=j*(N+1)+i,b=a+1,c=a+rows,d=b+rows;
  if(j===0)ix.push(a,b,c,b,d,c);else ix.push(a,c,b,b,c,d);
 }
 for(const i of[0,N])for(let j=0;j<L;j++){
  const a=j*(N+1)+i,b=a+N+1,c=a+rows,d=b+rows;
  if(i===0)ix.push(a,c,b,b,c,d);else ix.push(a,b,c,b,d,c);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
