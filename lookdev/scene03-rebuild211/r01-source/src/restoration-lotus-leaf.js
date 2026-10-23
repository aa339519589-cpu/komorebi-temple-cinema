import * as T from 'three';

export function createRestorationLotusLeaf(seed=1){
 const sectors=192,rings=44,p=[],uv=[],colors=[],ids=[],stride=1+rings*sectors;
 const shape=(r,a)=>{
  // A peltate leaf has a continuous attachment, a shallow basin and strong
  // radial folds. Unequal rim lobes are correlated with those folds rather
  // than an independent sinusoidal frill around a flat circular plate.
  const phase=a*19+.075*Math.sin(r*4),primary=Math.pow(Math.max(0,Math.cos(phase)),24),
   edge=1+.022*Math.sin(a*3+seed*.71)+.017*Math.sin(a*7+seed)+.009*Math.cos(phase),
   rr=r*edge,fold=(.018*Math.sin(a*5+seed*.72)+.008*Math.sin(a*9-seed))*(.13*r+.87*r**2),
   pleat=.0063*Math.sin(phase)*Math.pow(r,.9)*(1-.30*r),
   curl=(.039+.022*Math.sin(a*3+seed)+.014*Math.sin(a*7+seed*.4))*r**8,
   edgeRoll=.010*Math.sin(a*4+seed*.73)*r**18,
   ridge=.0020*primary*Math.sin(Math.PI*r*.97),
   asym=.025*Math.sin(a+seed*.66)*r*r;
  return [Math.cos(a)*rr*.5,-.034+.106*r*r+fold+pleat+curl+edgeRoll+ridge+asym,Math.sin(a)*rr*(.455+.018*Math.sin(seed))];
 };
 for(let side=0;side<2;side++){
  p.push(0,-.034+(side?-.0014:.0011),0);uv.push(.5,.5);colors.push(...(side?[.78,.86,.69]:[.76,.89,.72]));
  for(let j=1;j<=rings;j++)for(let i=0;i<sectors;i++){const r=j/rings,a=i/sectors*Math.PI*2,q=shape(r,a),thick=.0016+.0012*(1-r),v=.82+.07*Math.sin(a*3+seed)*r+.025*Math.sin(r*8+seed);q[1]+=(side?-.5:.5)*thick;p.push(...q);uv.push(.5+Math.cos(a)*r*.49,.5+Math.sin(a)*r*.49);colors.push(...(side?[v*.90,v*1.04,v*.80]:[v*.88,v,v*.80]));}
 }
 const tri=(a,b,c)=>ids.push(a,b,c,c+stride,b+stride,a+stride);
 for(let i=0;i<sectors;i++)tri(0,1+(i+1)%sectors,1+i);
 for(let j=0;j<rings-1;j++)for(let i=0;i<sectors;i++){const a=1+j*sectors+i,b=1+j*sectors+(i+1)%sectors,c=a+sectors,d=b+sectors;tri(a,d,c);tri(a,b,d);}
 const edge=1+(rings-1)*sectors;for(let i=0;i<sectors;i++){const a=edge+i,b=edge+(i+1)%sectors;ids.push(a,b,a+stride,b,b+stride,a+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ids);g.computeVertexNormals();g.name=`closed-folded-peltate-lotus-leaf105-${seed}`;g.userData={botanicalSolid:true,thicknessMetres:[.0016,.0028],features:['depressed rooted peltate centre','compound cupped lamina','19 coherent radial folds and fine raised veins','unequal rolled rim lobes','paler lower face'],photoTexture:false};return g;
}
