import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Individually closed fired-clay pan/cover pieces. Their short overlaps and
// small differences in roll radius are geometry, not painted roof detail.
export function createClayTile05(points,width=.17,{cover=true,variant=0}={}){
 const curve=new T.CatmullRomCurve3(points.map(p=>p.isVector3?p:new T.Vector3(...p))),rows=4,cols=cover?10:8,p=[],uv=[],ix=[],col=[],stride=(rows+1)*(cols+1);
 const gain=.82+.22*(.5+.5*Math.sin(variant*7.17)),thickness=.018+.0015*Math.sin(variant*2.13);
 for(let side=0;side<2;side++)for(let j=0;j<=rows;j++){
  const t=j/rows,c=curve.getPoint(t),tangent=curve.getTangent(t).normalize(),across=new T.Vector3(0,1,0).cross(tangent).normalize(),up=new T.Vector3().crossVectors(tangent,across).normalize();
  for(let k=0;k<=cols;k++){
   const u=k/cols*2-1,r=.064*(.96+.070*Math.sin(variant*1.17)),roll=cover?r*Math.sqrt(Math.max(0,1-u*u)):.026*u*u,
     skew=.0018*Math.sin(variant*2.71+u*5.3)*(.25+.75*Math.sin(Math.PI*t)**2);
   const q=c.clone().addScaledVector(across,u*width/2).addScaledVector(tangent,skew).addScaledVector(up,(cover?.028:.009)+roll+.0021*Math.sin(variant+u*4+t*3)-(side?thickness:0)),wear=.035*Math.abs(u)**7+.025*Math.pow(Math.max(0,(t-.78)/.22),2);
   p.push(...q.toArray());uv.push(k/cols*.27,t*.34);col.push(gain+wear,(gain+wear)*(.99+.014*Math.sin(variant*.7)),(gain+wear)*(.975+.025*Math.sin(variant*.47)));
  }
 }
 const tri=(a,b,c)=>ix.push(a,c,b,b+stride,c+stride,a+stride);
 for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j*(cols+1)+k,b=a+1,c=a+cols+1,d=c+1;tri(a,b,c);tri(b,d,c);}
 const edge=[...Array.from({length:cols},(_,i)=>i),...Array.from({length:rows},(_,j)=>j*(cols+1)+cols),...Array.from({length:cols},(_,i)=>rows*(cols+1)+cols-i),...Array.from({length:rows},(_,j)=>(rows-j)*(cols+1))];
 for(let k=0;k<edge.length;k++){const a=edge[k],b=edge[(k+1)%edge.length];ix.push(a,b,a+stride,b,b+stride,a+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(ix);g.computeVertexNormals();g.userData={closedCeramic:true,clayThickness:thickness,kind:cover?'cylindrical-cover':'concave-rain-pan',kilnShape220:'Independent pressed radius, finite cut skew, subtle warped tissue and worn-edge pigment'};return g;
}

export function createHandlaidRoof05(sample,w,d,opening=null){
 const pieces=[],mix=(a,b,t)=>a+(b-a)*t;
 const hash=q=>{const a=Math.sin(q*127.17+17.13)*43758.5453;return a-Math.floor(a);};
 function segments(lo,hi,count,phase){const pitch=(hi-lo)/count,cuts=[lo];for(let t=lo+phase*pitch;t<hi-.00001;t+=pitch)if(t>lo+pitch*.06)cuts.push(t);cuts.push(hi);return cuts.slice(0,-1).map((a,k)=>[a,Math.min(hi,cuts[k+1]+pitch*.055)]);}
 for(let face=0;face<4;face++){
  const width=face<2?w:d,depth=face<2?d:w,lanes=Math.max(8,Math.round(width/.315));
  for(let i=0;i<=lanes;i++){
   const u=-1+2*i/lanes,x=u*width/2,insideAcross=opening&&(face<2?x>opening.minX-.12&&x<opening.maxX+.12:x>opening.minZ-.12&&x<opening.maxZ+.12),inner=opening?(face<2?(face===0?opening.maxZ:-opening.minZ):(face===2?opening.maxX:-opening.minX)):0,lo=Math.max(.04,Math.abs(u)+.004,insideAcross?(inner-.022)/(depth/2):0),hi=1.025;
   const courses=Math.max(1,Math.ceil((hi-lo)*Math.hypot(depth/2,2)/.34));
   const P=(t,uu)=>sample(face,t,Math.max(-1,Math.min(1,uu/t)),.004);
   const phase=.05+.37*hash(i+face*17),laneShift=(hash(i*3.1+face*5)-.5)*.006/(width/2);
   for(const [j,[a,b]]of segments(lo,hi,courses,phase).entries()){
    const ts=Array.from({length:5},(_,k)=>mix(a,b,k/4));pieces.push(createClayTile05(ts.map(t=>P(t,u+laneShift)),.182*(.96+.07*hash(i*7.13+j)),{cover:true,variant:i*1.37+j*.71+face*19}));
   }
   if(i<lanes&&lo<.980){const uu=u+1/lanes;for(const [j,[a,b]]of segments(lo,Math.min(hi,.980),courses,(phase+.48)%1).entries())if(Math.abs(uu)<a+.02){const ts=Array.from({length:5},(_,k)=>mix(a,b,k/4));pieces.push(createClayTile05(ts.map(t=>P(t,uu)),.270*(.98+.04*hash(j*3.71+i)),{cover:false,variant:i*.93+j*1.27+face*11}));}}
  }
 }
 const merged=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());merged.name='scene05-closed-short-handlaid-ceramic-courses';return merged;
}
