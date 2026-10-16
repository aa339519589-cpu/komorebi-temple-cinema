import * as T from 'three';

// Fractured granite with a flattened foot and broad cleavage faces.
// A shared analytical field keeps coincident vertices watertight.
export function granite(seed=1){
 const g=new T.IcosahedronGeometry(1,3),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  let x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  const r=1+.17*Math.sin(x*3.2+seed)*Math.sin(y*4.3+z*2.7)+.065*Math.cos(z*8.2+x*5.1+seed*2.3);
  x*=r;y*=r;z*=r;
  y=Math.min(y,.69+x*.16+Math.cos(z*3.1+seed)*.035);
  y=Math.max(y,-.66+x*.035-z*.026);
  x=Math.min(x,.85+y*.14-z*.09);
  p.setXYZ(i,x,y,z);
 }
 g.computeVertexNormals();return g;
}

export function grassTuft(){
 const p=[],id=[];
 for(let k=0;k<5;k++){
  const a=k*2.39996,c=Math.cos(a),s=Math.sin(a),h=.23+.07*Math.sin(k*9+2),start=p.length/3;
  for(let j=0;j<3;j++){
   const t=j/2,w=.023*(1-t)+.0005,r=.045+.20*t*t;
   p.push(c*r-s*w,h*t,s*r+c*w,c*r+s*w,h*t,s*r-c*w);
  }
  for(let j=0;j<2;j++){const n=start+j*2;id.push(n,n+1,n+2,n+1,n+3,n+2);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(id);g.computeVertexNormals();return g;
}
