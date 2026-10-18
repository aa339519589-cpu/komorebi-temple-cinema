import * as T from 'three';

// Individually cupped laminae: open outer petals, rising middle petals and
// narrow inner petals have different curvature rather than scaled copies.
export function createRestorationLotusPetal(seed=1,layer=0){
 const rows=32,cols=24,pp=[],uv=[],ids=[];
 const extent=[.78,.61,.39][layer],rise=[.28,.57,.73][layer],width=[.27,.255,.19][layer];
 const shape=(t,u)=>{
  const w=width*Math.pow(Math.sin(Math.PI*t),.63)*(1-.10*t),c=Math.sin(Math.PI*t);
  const variation=1+.045*Math.sin(seed*2.14);
  return [u*w+.013*Math.sin(seed+t*4)*c,rise*(.14*t+.86*t*t)+(.10+.03*layer)*u*u*c+.065*c,extent*(t-.09*t*t)*variation-.065*u*u*c];
 };
 pp.push(0,0,0);uv.push(.5,0);
 for(let j=1;j<rows;j++)for(let i=0;i<=cols;i++){let t=j/rows,u=i/cols*2-1;pp.push(...shape(t,u));uv.push(i/cols,t);}
 const tip=pp.length/3;pp.push(...shape(1,0));uv.push(.5,1);
 for(let i=0;i<cols;i++)ids.push(0,1+i,2+i);
 for(let j=0;j<rows-2;j++)for(let i=0;i<cols;i++){let k=1+j*(cols+1)+i;ids.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}
 const last=1+(rows-2)*(cols+1);for(let i=0;i<cols;i++)ids.push(last+i,tip,last+i+1);
 const g=new T.BufferGeometry();g.name=`lotus-petal-lamina-layer-${layer}-seed-${seed}`;g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
}
