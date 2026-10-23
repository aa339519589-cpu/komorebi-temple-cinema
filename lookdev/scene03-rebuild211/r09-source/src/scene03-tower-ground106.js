import * as T from 'three';

// A raised tower site needs actual ground below its original stone base.
// The mound is authored geometry, not recovered photo depth or a backdrop.
export function buildTowerGround106({emit,bankEarth,bankStone,rocks,gardenAssets,spec}){
 const [cx,siteY,cz]=spec.position,top=siteY-.10,base=-.55,rx=7.1,rz=7.8,N=80,R=22,p=[],uv=[];
 const y=(t,a)=>-.15+(top+.15)*(1-T.MathUtils.smoothstep(t,.47,1))+.035*Math.sin(a*7)*Math.sin(Math.PI*t),
  P=(t,a)=>[cx+Math.cos(a)*rx*t*(1+.018*Math.sin(a*5)),y(t,a),cz+Math.sin(a)*rz*t*(1+.023*Math.sin(a*3))],tri=(a,b,c)=>{for(const q of[a,b,c]){p.push(...q);uv.push(q[0],q[2]);}};
 for(let j=0;j<R;j++)for(let i=0;i<N;i++){const a=i/N*Math.PI*2,b=(i+1)/N*Math.PI*2,A=P(j/R,a),B=P(j/R,b),C=P((j+1)/R,a),D=P((j+1)/R,b);tri(A,B,C);tri(B,D,C);}
 for(let i=0;i<N;i++){const a=P(1,i/N*Math.PI*2),b=P(1,(i+1)/N*Math.PI*2),aa=[a[0],base,a[2]],bb=[b[0],base,b[2]];tri(a,b,aa);tri(b,bb,aa);tri([cx,base,cz],aa,bb);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.name='scene03-closed-tower-hill-foundation106';emit(g,bankEarth);
 let count=0;
 for(let j=0;j<62;j++){const a=j*2.39996,t=.52+.44*(.5+.5*Math.sin(j*7.13)),q=P(t,a),s=.48+.28*(.5+.5*Math.sin(j*3.7));emit(rocks[j%rocks.length],bankStone,[q[0],q[1]-.15,q[2]],[s,s*.7,s],[0,j*.53,0],.88+.035*(j%7));
  if(j%2===0){gardenAssets.plant('shrub',j,[q[0],q[1]-.07,q[2]],[.75,.75,.75],[0,j*.7,0],.93);count++;}
  gardenAssets.plant('groundcover',j,[q[0]+.2,q[1]-.05,q[2]],[1.8,1.6,1.8],[0,j*.6,0],1.05);
 }
 return{closedBody:true,sitePosition:[...spec.position],plateauY:top,soilBottomY:base,foundationBottomY:siteY-.3*spec.scale,rootedUnderstory:count,photographicAccepted:false};
}
