import * as T from 'three';

// Folded leaflets and curved stems, authored as real geometry for grazing light.
export function createGardenFern(seed=91){
  let state=seed;const random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296);
  const p=[],colors=[];
  const tri=(a,b,c,shade)=>{for(const q of[a,b,c]){p.push(...q);colors.push(shade*.94,shade,shade*.78);}};
  for(let f=0;f<8;f++){
    const a=f*2.399963+random()*.22,len=.58+random()*.32,lift=.30+random()*.17;
    const stem=t=>[Math.cos(a)*len*t,.035+Math.sin(t*Math.PI*.82)*lift,Math.sin(a)*len*t];
    for(let k=0;k<12;k++){
      const a0=stem(k/12),b=stem((k+1)/12),sx=Math.sin(a)*.006,sz=-Math.cos(a)*.006;
      tri([a0[0]+sx,a0[1],a0[2]+sz],[a0[0]-sx,a0[1],a0[2]-sz],b,.70);
    }
    for(let j=1;j<=9;j++)for(const side of[-1,1]){
      const t=j/10,c=stem(t),dir=a+side*1.06,L=(.18+random()*.045)*(1-t*.78),w=.028*(1-t*.65);
      const forward=new T.Vector3(Math.cos(dir),.10,Math.sin(dir)).normalize(),lateral=new T.Vector3(-forward.z,0,forward.x);
      const base=new T.Vector3(...c),tip=base.clone().addScaledVector(forward,L),ridge=base.clone().addScaledVector(forward,L*.52);ridge.y+=w*.55;
      const sides=[];for(const sign of[-1,1])for(const [q,width]of[[.17,.48],[.34,.82],[.51,1],[.69,.68],[.84,.42]])sides.push(base.clone().addScaledVector(forward,L*q).addScaledVector(lateral,sign*w*width));
      for(let s=0;s<2;s++){
        const edge=[base,...sides.slice(s*5,s*5+5),tip];
        for(let k=0;k<edge.length-1;k++)tri(edge[k].toArray(),edge[k+1].toArray(),ridge.toArray(),.70+random()*.38);
      }
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
