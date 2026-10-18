import * as T from 'three';

// Geometry-only correction for the audited degenerate centre in v2/v3 leaves.
// This does NOT claim to fix the horizontal bands seen in actual Mac014; those
// need a controlled shadow/normal-pass comparison. No separate vein geometry.
export function createRestorationLotusLeaf(seed=1){
  const sectors=96,rings=24,p=[0,-.018,0],uv=[.5,.5],ids=[];
  for(let j=1;j<=rings;j++)for(let i=0;i<sectors;i++){
    const a=i/sectors*Math.PI*2,r=j/rings,edge=1+.024*Math.sin(a*7+seed)+.012*Math.sin(a*15-seed),rr=r*edge;
    const fold=.011*Math.sin(a*7+seed*.72)+.006*Math.sin(a*13-seed);
    const y=-.018+.035*r*r+.065*Math.pow(r,9)+fold*Math.pow(r,2.3)+.019*Math.sin(a*2+seed)*Math.pow(r,3)+.0012*Math.cos(a*21)*r*r;
    p.push(Math.cos(a)*rr*.5,y,Math.sin(a)*rr*(.455+.018*Math.sin(seed)));
    uv.push(.5+Math.cos(a)*r*.49,.5+Math.sin(a)*r*.49);
  }
  for(let i=0;i<sectors;i++)ids.push(0,1+(i+1)%sectors,1+i);
  for(let j=0;j<rings-1;j++)for(let i=0;i<sectors;i++){
    const a=1+j*sectors+i,an=1+j*sectors+(i+1)%sectors,b=a+sectors,bn=an+sectors;
    ids.push(a,bn,b,a,an,bn);
  }
  const g=new T.BufferGeometry();g.name=`peltate-lotus-single-pole-${seed}`;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();
  g.userData={topology:'one shared centre; wrapped angular ring indices; one layer only',veins:'colour-map only, no overlapping vein faces',status:'geometry audited; Mac014 horizontal stripe cause remains unverified'};
  return g;
}
