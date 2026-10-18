import * as T from 'three';

// One open, cupped petal lamina. The two narrow ends are unique shared vertices,
// not 13 coincident copies forming collapsed triangles. Shape/UV range retained.
export function createRestorationLotusPetal(seed=1){
  const rows=28,cols=20,p=[0,0,0],uv=[.5,0],ids=[];
  for(let j=1;j<rows;j++)for(let i=0;i<=cols;i++){
    const t=j/rows,u=i/cols*2-1,w=.25*Math.pow(Math.sin(Math.PI*t),.52)*(1-.13*t);
    const lean=.026*Math.sin(seed*2.1)*Math.sin(t*Math.PI),twist=.023*Math.sin(seed+t*3)*u*Math.sin(t*Math.PI);
    p.push(u*w+lean,.12*t+.54*t*t+.068*u*u*Math.sin(Math.PI*t)+twist,.74*t-.062*u*u*Math.sin(Math.PI*t));
    uv.push(i/cols,t);
  }
  const tip=p.length/3;p.push(0,.66,.74);uv.push(.5,1);
  for(let i=0;i<cols;i++)ids.push(0,1+i,2+i);
  for(let j=0;j<rows-2;j++)for(let i=0;i<cols;i++){
    const k=1+j*(cols+1)+i;ids.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);
  }
  const last=1+(rows-2)*(cols+1);for(let i=0;i<cols;i++)ids.push(last+i,tip,last+i+1);
  const g=new T.BufferGeometry();g.name=`lotus-petal-shared-ends-${seed}`;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();
  g.userData={topology:'open lamina, unique base and tip, shared interior grid',retained:'same cupping, twist, width profile, placement and material as v4'};return g;
}
