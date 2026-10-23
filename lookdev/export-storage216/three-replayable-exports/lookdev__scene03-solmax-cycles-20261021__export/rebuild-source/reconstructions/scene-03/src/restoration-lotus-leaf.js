import * as T from 'three';

export function createRestorationLotusLeaf(seed=1){
 const sectors=128,rings=30,p=[],uv=[],colors=[],ids=[],stride=1+rings*sectors;
 const shape=(r,a)=>{
  const edge=1+.028*Math.sin(a*7+seed)+.017*Math.sin(a*13-seed),rr=r*edge,veinPhase=a*19+.10*Math.sin(r*5+seed),ridge=.0032*Math.pow(Math.max(0,Math.cos(veinPhase)),12)*Math.sin(Math.PI*r*.94);
  const fold=(.022*Math.sin(a*5+seed*.72)+.009*Math.sin(a*11-seed))*Math.pow(r,2.2),curl=(.038+.024*Math.sin(a*3+seed))*Math.pow(r,9)+.016*Math.sin(a*2+seed)*r*r*r;
  return [Math.cos(a)*rr*.5,-.034+.063*r*r+fold+curl+ridge,Math.sin(a)*rr*(.455+.018*Math.sin(seed))];
 };
 for(let side=0;side<2;side++){
  p.push(0,-.034+(side?-.0014:.0011),0);uv.push(.5,.5);colors.push(...(side?[.75,.83,.70]:[.88,.94,.82]));
  for(let j=1;j<=rings;j++)for(let i=0;i<sectors;i++){const r=j/rings,a=i/sectors*Math.PI*2,q=shape(r,a),thick=.0016+.0012*(1-r),v=.88+.10*Math.sin(a*3+seed)*r+.04*Math.sin(r*8+seed);q[1]+=(side?-.5:.5)*thick;p.push(...q);uv.push(.5+Math.cos(a)*r*.49,.5+Math.sin(a)*r*.49);colors.push(...(side?[v*.84,v*.93,v*.79]:[v*.95,v,v*.88]));}
 }
 const tri=(a,b,c)=>ids.push(a,b,c,c+stride,b+stride,a+stride);
 for(let i=0;i<sectors;i++)tri(0,1+(i+1)%sectors,1+i);
 for(let j=0;j<rings-1;j++)for(let i=0;i<sectors;i++){const a=1+j*sectors+i,b=1+j*sectors+(i+1)%sectors,c=a+sectors,d=b+sectors;tri(a,d,c);tri(a,b,d);}
 const edge=1+(rings-1)*sectors;for(let i=0;i<sectors;i++){const a=edge+i,b=edge+(i+1)%sectors;ids.push(a,b,a+stride,b,b+stride,a+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ids);g.computeVertexNormals();g.name=`closed-peltate-lotus-leaf-${seed}`;g.userData={botanicalSolid:true,thicknessMetres:[.0016,.0028],features:['depressed peltate centre','uneven radial folds','local rolled rim','19 real raised primary veins','paler lower face'],photoTexture:false};return g;
}
