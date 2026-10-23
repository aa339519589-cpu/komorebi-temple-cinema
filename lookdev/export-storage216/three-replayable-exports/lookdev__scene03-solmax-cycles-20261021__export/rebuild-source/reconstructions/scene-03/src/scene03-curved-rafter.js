import * as T from 'three';

// Closed rounded-square timber swept along its actual roof bearing curve.
export function createCurvedEaveRafter(points,width=.105,height=.16){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),rows=24,sides=16,p=[],uv=[],idx=[];
 for(let j=0;j<=rows;j++){
  const t=j/rows,c=curve.getPoint(t),tangent=curve.getTangent(t).normalize(),across=new T.Vector3(0,1,0).cross(tangent).normalize(),up=tangent.clone().cross(across).normalize();
  for(let k=0;k<sides;k++){const a=k/sides*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),x=width*.5*Math.sign(ca)*Math.pow(Math.abs(ca),.4),y=height*.5*Math.sign(sa)*Math.pow(Math.abs(sa),.4),q=c.clone().addScaledVector(across,x).addScaledVector(up,y);p.push(...q.toArray());uv.push(k/sides,t*curve.getLength());}
 }
 for(let j=0;j<rows;j++)for(let k=0;k<sides;k++){const a=j*sides+k,b=j*sides+(k+1)%sides,c=a+sides,d=b+sides;idx.push(a,b,c,b,d,c);}
 const base=p.length/3;p.push(...curve.getPoint(0).toArray(),...curve.getPoint(1).toArray());uv.push(.5,0,.5,1);
 for(let k=0;k<sides;k++){idx.push(base,(k+1)%sides,k);idx.push(base+1,rows*sides+k,rows*sides+(k+1)%sides);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.name='closed-curve-swept-eave-rafter';g.userData={solidTimber:true,photoTexture:false,bearingCurve:points,sectionMetres:[width,height]};return g;
}
