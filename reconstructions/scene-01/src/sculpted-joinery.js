import * as T from 'three';

// Closed solid curve profiles derived from scene05/sculpted-joinery.js.
// Only the hall default capitals use these parts. The pagoda's separately
// loaded Blender kit and the hall's inner-purlin kit remain unchanged.
export function createHallCurvedJoinery(){
 const owned=new Set(),parts=[];
 const keep=g=>{owned.add(g);return g;};
 function extrude(shape,depth=.22,bevel=.012){const g=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:10,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2});g.translate(0,0,-depth/2);return keep(g);}
 function part(g,material='red',position=[0,0,0],rotation=0,cornerOnly=false){const q=keep(g.clone());q.rotateY(rotation);q.translate(...position);parts.push({geometry:q,material,cornerOnly,cornerAxis:cornerOnly});return q;}
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
 part(cushion(.31,.20),'red',[0,-.15,0]);
 part(curvedArm(1.30,'top'),'red',[0,.225,0]);part(curvedArm(1.30,'bottom'),'red',[0,.225,0],Math.PI/2);
 for(const side of[-1,1]){part(cushion(.145,.055),'red',[side*.40,.325,0]);part(cushion(.145,.055),'red',[0,.325,side*.40]);}
 for(const side of[-1,1]){part(curvedArm(1.50),'red',[side*.40,.60,0],Math.PI/2);part(curvedArm(1.50),'red',[0,.60,side*.40]);}
 for(const sx of[-1,1])for(const sz of[-1,1])part(cushion(.14,.10),'red',[sx*.40,.70,sz*.40]);
 for(const side of[-1,1])part(beam(1.54,.23,.80,.93,[{x:0,width:.24,side:'top',y:.865}]),'red',[0,0,side*.40]);
 part(beam(1.52,.24,.865,.970,[-1,1].map(sign=>({x:sign*.40,width:.23,side:'bottom',y:.93}))),'endwood',[0,0,0],Math.PI/2);

 // Fit the retained hall bearing envelope rather than scaling the scene05
 // datum directly: that kit starts at -.15 and ends near .82. Exact solid
 // bounds include the bevel, so neither the foot nor receiver floats.
 const bounds=new T.Box3();
 for(const {geometry} of parts){geometry.computeBoundingBox();bounds.union(geometry.boundingBox);}
 const size=bounds.getSize(new T.Vector3()),xz=1.72/Math.max(size.x,size.z),sy=1.23/size.y,baseY=bounds.min.y;
 for(const {geometry} of parts){geometry.translate(0,-baseY,0);geometry.scale(xz,sy,xz);geometry.computeBoundingBox();}
 const seat=(x,y,z)=>[x*xz,(y-baseY)*sy,z*xz];
 return {parts,resources:owned,seat,scale:[xz,sy,xz]};
}
