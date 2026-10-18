import * as T from 'three';

// A lamina follows a curved meridian, rather than a straight conical wall.
// Outer petals arch outward and droop; middle/inner petals stand progressively
// higher. Width, transverse cup and slight asymmetric roll vary independently.
export function createRestorationLotusPetal(seed=1,layer=0){
 const rows=48,cols=24,pp=[],uv=[],ids=[];
 const profiles=[[[0,0],[.08,.22],[.66,.29],[.85,.12]],[[.01,.01],[.01,.31],[.32,.57],[.61,.42]],[[.01,.015],[-.035,.24],[.06,.53],[.29,.47]]];
 const width=[.30,.265,.175][layer],control=profiles[layer];
 const cubic=(t,k)=>{const s=1-t;return s*s*s*control[0][k]+3*s*s*t*control[1][k]+3*s*t*t*control[2][k]+t*t*t*control[3][k];};
 const shape=(t,u)=>{
  const c=Math.max(0,Math.sin(Math.PI*t)),variation=1+.035*Math.sin(seed*2.14);
  const w=width*Math.pow(c,.78)*(.83+.17*t)*variation;
  const roll=.014*Math.sin(seed*.7+t*5.2)*u*u*u*c;
  return [u*w+.008*Math.sin(seed+t*3)*c,
   cubic(t,1)+(.055+.012*layer)*u*u*c+roll,
   cubic(t,0)*(1+.025*Math.cos(seed*1.7))-.026*u*u*c];
 };
 pp.push(0,0,0);uv.push(.5,0);
 for(let j=1;j<rows;j++)for(let i=0;i<=cols;i++){let t=j/rows,u=i/cols*2-1;pp.push(...shape(t,u));uv.push(i/cols,t);}
 const tip=pp.length/3;pp.push(...shape(1,0));uv.push(.5,1);
 for(let i=0;i<cols;i++)ids.push(0,1+i,2+i);
 for(let j=0;j<rows-2;j++)for(let i=0;i<cols;i++){let k=1+j*(cols+1)+i;ids.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}
 const last=1+(rows-2)*(cols+1);for(let i=0;i<cols;i++)ids.push(last+i,tip,last+i+1);
 const g=new T.BufferGeometry();g.name=`lotus-petal-lamina-layer-${layer}-seed-${seed}`;g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
}
