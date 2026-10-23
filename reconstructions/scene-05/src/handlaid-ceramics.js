import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Individually closed fired-clay pan/cover pieces. Their short overlaps and
// small differences in roll radius are geometry, not painted roof detail.
export function createClayTile05(points,width=.17,{cover=true,variant=0}={}){
 const curve=new T.CatmullRomCurve3(points.map(p=>p.isVector3?p:new T.Vector3(...p))),rows=4,cols=cover?10:8,p=[],uv=[],ix=[],col=[],stride=(rows+1)*(cols+1);
 const gain=.91+.13*(.5+.5*Math.sin(variant*7.17));
 for(let side=0;side<2;side++)for(let j=0;j<=rows;j++){
  const t=j/rows,c=curve.getPoint(t),tangent=curve.getTangent(t).normalize(),across=new T.Vector3(0,1,0).cross(tangent).normalize(),up=new T.Vector3().crossVectors(tangent,across).normalize();
  for(let k=0;k<=cols;k++){
   const u=k/cols*2-1,r=.064*(.96+.045*Math.sin(variant)),roll=cover?r*Math.sqrt(Math.max(0,1-u*u)):.026*u*u;
   const q=c.clone().addScaledVector(across,u*width/2).addScaledVector(up,(cover?.028:.009)+roll+.0012*Math.sin(variant+u*4+t*3)-(side?.019:0));
   p.push(...q.toArray());uv.push(k/cols*.27,t*.34);col.push(gain,gain,gain);
  }
 }
 const tri=(a,b,c)=>ix.push(a,c,b,b+stride,c+stride,a+stride);
 for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j*(cols+1)+k,b=a+1,c=a+cols+1,d=c+1;tri(a,b,c);tri(b,d,c);}
 const edge=[...Array.from({length:cols},(_,i)=>i),...Array.from({length:rows},(_,j)=>j*(cols+1)+cols),...Array.from({length:cols},(_,i)=>rows*(cols+1)+cols-i),...Array.from({length:rows},(_,j)=>(rows-j)*(cols+1))];
 for(let k=0;k<edge.length;k++){const a=edge[k],b=edge[(k+1)%edge.length];ix.push(a,b,a+stride,b,b+stride,a+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(ix);g.computeVertexNormals();g.userData={closedCeramic:true,clayThickness:.019,kind:cover?'cylindrical-cover':'concave-rain-pan'};return g;
}

export function createHandlaidRoof05(sample,w,d,opening=null){
 const pieces=[],mix=(a,b,t)=>a+(b-a)*t;
 for(let face=0;face<4;face++){
  const width=face<2?w:d,depth=face<2?d:w,lanes=Math.max(8,Math.round(width/.315));
  for(let i=0;i<=lanes;i++){
   const u=-1+2*i/lanes,x=u*width/2,insideAcross=opening&&(face<2?x>opening.minX-.12&&x<opening.maxX+.12:x>opening.minZ-.12&&x<opening.maxZ+.12),inner=opening?(face<2?(face===0?opening.maxZ:-opening.minZ):(face===2?opening.maxX:-opening.minX)):0,lo=Math.max(.04,Math.abs(u)+.004,insideAcross?(inner-.022)/(depth/2):0),hi=1.025;
   const courses=Math.max(1,Math.ceil((hi-lo)*Math.hypot(depth/2,2)/.34));
   const P=(t,uu)=>sample(face,t,Math.max(-1,Math.min(1,uu/t)),.004);
   for(let j=0;j<courses;j++){
    const a=mix(lo,hi,j/courses),b=mix(lo,hi,Math.min(1,(j+1.045)/courses)),ts=Array.from({length:5},(_,k)=>mix(a,b,k/4));
    pieces.push(createClayTile05(ts.map(t=>P(t,u)),.182,{cover:true,variant:i*1.37+j*.71+face*19}));
    if(i<lanes){const uu=u+1/lanes;if(Math.abs(uu)<a+.02)pieces.push(createClayTile05(ts.map(t=>P(t,uu)),.270,{cover:false,variant:i*.93+j*1.27+face*11}));}
   }
  }
 }
 const merged=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());merged.name='scene05-closed-short-handlaid-ceramic-courses';return merged;
}
