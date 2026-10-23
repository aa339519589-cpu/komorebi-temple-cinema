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

// Closed hip/ridge clay with a broad overlapping skirt. The section bridges
// both roof planes; capped short units overlap along the actual weather seam.
export function createClosedRidge174(points,width=.28,height=.16,variant=0){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),R=8,section=[[-.50,-.045],[-.50,.012],[-.43,.018]];
 for(let k=1;k<=24;k++){const a=Math.PI-k/24*Math.PI;section.push([.43*Math.cos(a),.018+height*Math.sin(a)]);}
 section.push([.50,.012],[.50,-.045],[.35,-.052],[-.35,-.052]);
 const N=section.length,p=[],uv=[],ids=[],colors=[],shade=.92+.07*(.5+.5*Math.sin(variant*4.71));
 for(let j=0;j<=R;j++){
  const t=j/R,c=curve.getPoint(t),tan=curve.getTangent(t).normalize(),across=new T.Vector3(0,1,0).cross(tan).normalize(),up=tan.clone().cross(across).normalize();
  for(let k=0;k<N;k++){const [a,b]=section[k],q=c.clone().addScaledVector(across,a*width).addScaledVector(up,b);p.push(...q.toArray());uv.push(k/N*width,t*curve.getLength());colors.push(shade,shade,shade);}
 }
 for(let j=0;j<R;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N;ids.push(a,b,a+N,b,b+N,a+N);}
 const n=p.length/3;for(const t of[0,1]){const q=curve.getPoint(t);q.y+=height*.30;p.push(...q.toArray());uv.push(.5,t);colors.push(shade,shade,shade);}for(let k=0;k<N;k++)ids.push(n,(k+1)%N,k,n+1,R*N+k,R*N+(k+1)%N);
 let volume=0;for(let i=0;i<ids.length;i+=3){const a=ids[i]*3,b=ids[i+1]*3,c=ids[i+2]*3;volume+=(p[a]*(p[b+1]*p[c+2]-p[b+2]*p[c+1])+p[a+1]*(p[b+2]*p[c]-p[b]*p[c+2])+p[a+2]*(p[b]*p[c+1]-p[b+1]*p[c]))/6;}if(volume<0)for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ids);g.computeVertexNormals();g.name='scene03-closed-skirted-lap-ridge174';g.userData={closedClay:true,source:'Authored clay section and weather seam',photoTexture:false,signedVolumeMetres3:Math.abs(volume)};return g;
}
