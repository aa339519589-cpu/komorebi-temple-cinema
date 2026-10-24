import * as T from 'three';

const hash=(x,z)=>{const q=Math.sin(x*127.1+z*311.7)*43758.5453;return q-Math.floor(q);};
export function terrainBankHeight212(x,z,stairPlan,waterY=-.10,soilY=-.045){
 const edge=stairPlan.halfWidth(z)+.44,d=Math.max(0,Math.abs(x)-edge),fade=T.MathUtils.smoothstep(d,.15,6.80),inner=Math.max(soilY,stairPlan.walkY(z)-.15);
 const water=waterY-.14,undulation=(.25*Math.sin(x*1.17+z*.91)+.14*Math.sin(x*2.81-z*1.67))*Math.sin(Math.PI*fade);
 return T.MathUtils.lerp(inner,water,fade)+undulation;
}
export function createWetKnoll212(cx,cz,rx,rz,top=-.08){
 const N=64,R=16,p=[],id=[],colors=[],uv=[],height=(r,a)=>top-.205*T.MathUtils.smoothstep(r,.38,1)+.035*Math.sin(a*5+cx)*Math.sin(Math.PI*r)*T.MathUtils.smoothstep(r,.18,.50);
 p.push(cx,top,cz);colors.push(.78,.87,.69);uv.push(cx*.7,cz*.7);
 for(let j=1;j<=R;j++)for(let k=0;k<N;k++){
  const r=j/R,a=k*Math.PI*2/N,warp=1+.05*Math.sin(a*5+cx)+.026*Math.sin(a*11+cz),x=cx+Math.cos(a)*rx*r*warp,z=cz+Math.sin(a)*rz*r*warp,y=height(r,a),tone=.61+.30*hash(x*9,z*9);
  p.push(x,y,z);uv.push(x*.7,z*.7);colors.push(tone*.78,tone,tone*.58);
 }
 for(let k=0;k<N;k++)id.push(0,1+(k+1)%N,1+k);
 for(let j=0;j<R-1;j++)for(let k=0;k<N;k++){const a=1+j*N+k,b=1+j*N+(k+1)%N,c=a+N,d=b+N;id.push(a,d,c,a,b,d);}
 const bottom=p.length/3;p.push(cx,-.90,cz);colors.push(.3,.33,.25);uv.push(0,0);
 const ring=p.length/3;for(let k=0;k<N;k++){const q=1+(R-1)*N+k;p.push(p[q*3],-.90,p[q*3+2]);colors.push(.3,.33,.25);uv.push(p[q*3]*.7,p[q*3+2]*.7);}
 for(let k=0;k<N;k++){const next=(k+1)%N,a=1+(R-1)*N+k,b=1+(R-1)*N+next,c=ring+k,d=ring+next;id.push(a,b,c,b,d,c,bottom,c,d);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(id);g.computeVertexNormals();g.userData.wetBank212={closed:true,centralSeat:top,outerBank:top-.205,waterFed:true,referenceImageUsedAsTexture:false};return g;
}
