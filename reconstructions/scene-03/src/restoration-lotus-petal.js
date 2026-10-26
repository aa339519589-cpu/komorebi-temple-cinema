import * as T from 'three';

// Metric tissue authored for a 26 cm Nelumbo flower. Each blade is a closed
// thin solid with a narrow basal claw; none is a ring or a photographed card.
export function createRestorationLotusPetal(seed=1,layer=0){
 const rows=48,cols=24,p=[],uv=[],ids=[],sepal=layer===3,
  extent=[.121,.103,.076,.079][layer]*(1+.045*Math.sin(seed*1.73)),
  rise=[.025,.061,.084,-.005][layer]*(1+.23*Math.sin(seed*.91)),
  width=[.037,.034,.025,.015][layer]*(1+.17*Math.sin(seed*2.37));
 const shape=(t,u)=>{
  const c=Math.max(0,Math.sin(Math.PI*t)),w=width*Math.pow(c,[.96,1.06,1.03,1.18][layer])*(.72+.35*t),
   v=1-t,p1z=extent*.23,p2z=extent*.82,p1y=sepal?-.007:.006,
   p2y=sepal?-.013:layer===0?.040:rise*1.03,
   centerY=3*v*v*t*p1y+3*v*t*t*p2y+t*t*t*rise,
   centerZ=3*v*v*t*p1z+3*v*t*t*p2z+t*t*t*extent,
   // A gentle transverse arch and unequal edge curl, rather than a high
   // U-shaped cross section which made the previous petals read as bowls.
   cup=[.0046,.0052,.0040,.0028][layer]*u*u*c,
   twist=.0024*Math.sin(seed*.71+t*3.1)*u*c,
   fine=.000065*Math.cos(u*31+.28*Math.sin(t*5))*c*(1-u*u),
   rim=.00045*Math.sin(t*17+seed*.7)*Math.pow(Math.abs(u),8)*c,
   shoulder=.0016*Math.sin(t*7+seed*.9)*u*c*c;
  return new T.Vector3(u*w*(1+.13*u*Math.sin(seed*1.7)*c)+.0024*Math.sin(seed+t*4)*c,centerY+cup+twist+fine+rim+shoulder,
   centerZ-.006*u*u*c+.0036*u*Math.sin(seed*.81)*c+.0018*Math.sin(seed)*c);
 };
 function normalAt(t,u){const e=.0002,a=shape(Math.max(.0001,t-e),u),b=shape(Math.min(.9999,t+e),u),c=shape(t,Math.max(-1,u-e)),d=shape(t,Math.min(1,u+e));return b.sub(a).cross(d.sub(c)).normalize();}
 const samples=[[0,0]];for(let j=1;j<rows;j++)for(let i=0;i<=cols;i++)samples.push([j/rows,i/cols*2-1]);const tip=samples.length;samples.push([1,0]);
 const count=samples.length;
 for(let side=0;side<2;side++)for(const [t,u]of samples){const n=normalAt(T.MathUtils.clamp(t,.0001,.9999),u),thickness=(sepal?.00058:.00032+.00012*Math.sin(Math.PI*t))*(.55+.45*(1-u*u)),q=shape(t,u).addScaledVector(n,(side===0?1:-1)*thickness*.5);p.push(...q.toArray());uv.push((u+1)/2,t);}
 const tri=(a,b,c)=>{ids.push(a,b,c,c+count,b+count,a+count);};
 for(let i=0;i<cols;i++)tri(0,1+i,2+i);
 for(let j=0;j<rows-2;j++)for(let i=0;i<cols;i++){const a=1+j*(cols+1)+i,b=a+cols+1;tri(a,b,a+1);tri(a+1,b,b+1);}
 const last=1+(rows-2)*(cols+1);for(let i=0;i<cols;i++)tri(last+i,tip,last+i+1);
 const edge=[0,...Array.from({length:rows-1},(_,j)=>1+j*(cols+1)),tip,...Array.from({length:rows-1},(_,j)=>1+(rows-2-j)*(cols+1)+cols)];
 for(let k=0;k<edge.length;k++){const a=edge[k],b=edge[(k+1)%edge.length];ids.push(b,a,a+count,b,a+count,b+count);}
 const g=new T.BufferGeometry();g.name=`metric-lotus355-closed-${sepal?'sepal':'petal'}-${layer}-${seed}`;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.userData={botanicalSolid:true,thicknessMetres:sepal?[.00032,.00058]:[.00018,.00044],features:['narrow basal attachment','unequal ovate shoulders','reflexed outer tip','shallow tissue arch and torsion','submillimetre closed rim'],photoTexture:false};return g;
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
