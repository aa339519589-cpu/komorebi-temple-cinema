import * as T from 'three';

// Closed thin botanical solids: cupped upper/lower faces joined at a rolled rim.
export function createRestorationLotusPetal(seed=1,layer=0){
 const rows=38,cols=28,p=[],uv=[],ids=[],extent=[.72,.55,.35][layer],rise=[.32,.46,.56][layer],width=[.29,.265,.19][layer];
 const shape=(t,u)=>{
  const c=Math.sin(Math.PI*t),w=width*Math.sqrt(Math.max(0,c))*(.88+.13*t),side=Math.pow(Math.abs(u),4),wave=.00065*Math.sin(u*22+t*7+seed)*c*(1-u*u);
  return new T.Vector3(u*w+.014*Math.sin(seed+t*4)*c,rise*(1+.07*Math.sin(seed*1.13))*(.08*t+.92*t*t)+.014*c+.040*u*u*c+.006*side*Math.pow(c,.7)+wave+.008*Math.sin(seed+t*3)*u*c,extent*(t-.095*t*t*t)*(1+.045*Math.sin(seed*2.14))-.063*u*u*c-.018*side*c);
 };
 function normalAt(t,u){const e=.0002,a=shape(Math.max(.0001,t-e),u),b=shape(Math.min(.9999,t+e),u),c=shape(t,Math.max(-1,u-e)),d=shape(t,Math.min(1,u+e));return b.sub(a).cross(d.sub(c)).normalize();}
 const samples=[[0,0]];for(let j=1;j<rows;j++)for(let i=0;i<=cols;i++)samples.push([j/rows,i/cols*2-1]);const tip=samples.length;samples.push([1,0]);
 const count=samples.length;
 for(let side=0;side<2;side++)for(const [t,u]of samples){const n=normalAt(T.MathUtils.clamp(t,.0001,.9999),u),thickness=(.0016+.0008*Math.sin(Math.PI*t))*(.65+.35*(1-u*u)),q=shape(t,u).addScaledVector(n,(side===0?1:-1)*thickness*.5);p.push(...q.toArray());uv.push((u+1)/2,t);}
 const tri=(a,b,c)=>{ids.push(a,b,c,c+count,b+count,a+count);};
 for(let i=0;i<cols;i++)tri(0,1+i,2+i);
 for(let j=0;j<rows-2;j++)for(let i=0;i<cols;i++){const a=1+j*(cols+1)+i,b=a+cols+1;tri(a,b,a+1);tri(a+1,b,b+1);}
 const last=1+(rows-2)*(cols+1);for(let i=0;i<cols;i++)tri(last+i,tip,last+i+1);
 const edge=[0,...Array.from({length:rows-1},(_,j)=>1+j*(cols+1)),tip,...Array.from({length:rows-1},(_,j)=>1+(rows-2-j)*(cols+1)+cols)];
 for(let k=0;k<edge.length;k++){const a=edge[k],b=edge[(k+1)%edge.length];ids.push(b,a,a+count,b,a+count,b+count);}
 const g=new T.BufferGeometry();g.name=`closed-cupped-lotus-petal-${layer}-${seed}`;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.userData={botanicalSolid:true,thicknessMetres:[.001,.0024],features:['rounded ovate plan','compound cup','rolled edges','geometric fine pleats'],photoTexture:false};return g;
}

export function createRestorationLotusBud(){
 const rings=56,sectors=64,p=[0,0,0],uv=[.5,0],ids=[];
 for(let j=1;j<rings;j++)for(let i=0;i<sectors;i++){const t=j/rings,a=i/sectors*Math.PI*2,s=Math.sin(Math.PI*t),r=.118*Math.sqrt(s)*(1-.20*t)*(1+.022*Math.cos(5*a+.4)*s);p.push(Math.cos(a)*r,.48*t,Math.sin(a)*r);uv.push(i/sectors,t);}
 const tip=p.length/3;p.push(0,.48,0);uv.push(.5,1);
 for(let i=0;i<sectors;i++)ids.push(0,1+i,1+(i+1)%sectors);
 for(let j=0;j<rings-2;j++)for(let i=0;i<sectors;i++){const a=1+j*sectors+i,b=1+j*sectors+(i+1)%sectors,c=a+sectors,d=b+sectors;ids.push(a,c,b,b,c,d);}
 const last=1+(rings-2)*sectors;for(let i=0;i<sectors;i++)ids.push(last+i,tip,last+(i+1)%sectors);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.name='closed-ovoid-five-lobed-lotus-bud';g.userData={botanicalSolid:true,photoTexture:false};return g;
}
