import * as T from 'three';

// Short closed pan/cover ceramics, in building metres. The raised roll and
// concave pan have separate top/bottom clay faces and closed four-side rims.
export function createClosedRoofTile(points,width=.16,{cover=true,variant=0}={}){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),rows=4,cols=cover?10:6,p=[],uv=[],ids=[],colors=[],stride=(rows+1)*(cols+1);
 for(let side=0;side<2;side++)for(let j=0;j<=rows;j++){
  const t=j/rows,c=curve.getPoint(t),tangent=curve.getTangent(t).normalize(),across=new T.Vector3(0,1,0).cross(tangent).normalize(),up=tangent.clone().cross(across).normalize();
  for(let k=0;k<=cols;k++){const q=k/cols*2-1,crest=cover?.063*Math.sqrt(Math.max(0,1-q*q)):.025*q*q,relief=.0016*Math.sin(q*4.3+variant*2.7+t*5),v=c.clone().addScaledVector(across,q*width/2).addScaledVector(up,(cover?.026:.010)+crest+relief-(side?.018:0));p.push(...v.toArray());uv.push(k/cols*.23,t*.38+variant*.17);const shade=.89+.16*(.5+.5*Math.sin(variant*12.1));colors.push(shade,shade,shade);}
 }
 const tri=(a,b,c)=>ids.push(a,b,c,c+stride,b+stride,a+stride);
 for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j*(cols+1)+k,b=a+1,c=a+cols+1,d=c+1;tri(a,c,b);tri(b,c,d);}
 const edge=[...Array.from({length:cols},(_,i)=>i),...Array.from({length:rows},(_,j)=>j*(cols+1)+cols),...Array.from({length:cols},(_,i)=>rows*(cols+1)+cols-i),...Array.from({length:rows},(_,j)=>(rows-j)*(cols+1))];
 for(let k=0;k<edge.length;k++){const a=edge[k],b=edge[(k+1)%edge.length];ids.push(a,b,a+stride,b,b+stride,a+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ids);g.computeVertexNormals();g.name=cover?'closed-short-fired-cover-tile':'closed-short-fired-pan-tile';g.userData={closedClay:true,thicknessMetres:.018,source:'Authored shape, not a photo projection or depth field'};return g;
}
