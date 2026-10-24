import * as T from 'three';

// Authored woody structure with individual cupped palmate leaves. This is a
// real near tree rooted outside the right apron, never a screen or backdrop.
export function buildRainFrameMaple142({emit,branch,leaf,veins,palette,veinMaterial}){
 let state=142103;const r=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;},range=(a,b)=>a+(b-a)*r();
 const branches=[],leafPads=[];
 const bough=(a,b,radius)=>{branch(a,b,radius,'mapleBark');branches.push({a,b,radius});};
 const spine=[[8.9,-.1,1.7],[8.52,2.7,1.8],[7.25,5.4,2.5],[5.8,7.3,3.6],[4.2,8.0,4.7],[3.0,7.5,5.0]];
 for(let k=0;k<spine.length-1;k++)bough(spine[k],spine[k+1],.23*Math.pow(.70,k));
 for(let n=0;n<19;n++){
  const f=range(3.0,4.8),i=Math.floor(f),t=f-i,start=new T.Vector3(...spine[i]).lerp(new T.Vector3(...spine[i+1]),t).toArray(),end=[start[0]+range(-.9,.65),start[1]+range(-.25,.80),start[2]+range(-.50,.70)];
  bough(start,end,range(.014,.040));
  for(let fork=0;fork<3;fork++){
   const tip=[end[0]+range(-.75,.52),end[1]+range(-.35,.45),end[2]+range(-.60,.70)];bough(end,tip,.006+range(0,.005));
   const rx=range(.34,.66),rz=range(.30,.60),count=65+Math.floor(r()*45);leafPads.push({tip,radius:[rx,.26,rz],count});
   for(let k=0;k<count;k++){
    const angle=range(0,Math.PI*2),rad=Math.sqrt(r()),x=tip[0]+Math.cos(angle)*rad*rx,y=tip[1]+range(-.25,.19),z=tip[2]+Math.sin(angle)*rad*rz,s=range(.070,.115),rotation=[range(.65,1.30),range(0,Math.PI*2),range(-.35,.35)],ma=palette[Math.floor(r()*palette.length)];
    emit(leaf,ma,x,y,z,s,s,s,rotation,range(.73,1.20));
    if(k%4===0)emit(veins,veinMaterial,x,y+.001,z,s,s,s,rotation,.72);
   }
  }
 }
 return{revision:'scene10-rooted-overhead-maple142',root:spine[0],branches:branches.length,leafPads:leafPads.length,leaves:leafPads.reduce((n,p)=>n+p.count,0),scope:'True woody boughs and individually cupped palmate leaves, rooted right of the stone apron; no photograph sampled',visualAccepted:false};
}
