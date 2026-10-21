import {T,V} from './kernel.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// One rooted evergreen at the pond's left bank. Closed, tapered limbs divide
// into successively smaller attached shoots; every leaf starts at a shoot.
// No alpha cards, camera-facing crowns or photographic canopy surfaces.
export function buildRootedCanopy142(b,mats){
 let state=0x1420cafe;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const stats={root:[-7.74,.04,10.6],closedTaperedLimbs:0,terminalShoots:0,individualLeaves:0},limbGeometries=[];
 const dark=mats.leaf.clone(),green=mats.leaf.clone(),light=mats.leaflight.clone();
 dark.name='scene02-mature-evergreen-shadow-leaf';dark.color.setHex(0x25381d);
 green.name='scene02-mature-evergreen-green-leaf';green.color.setHex(0x3c5026);
 light.name='scene02-mature-evergreen-lit-leaf';light.color.setHex(0x6b7437);
 for(const m of[dark,green,light]){m.side=T.DoubleSide;m.roughness=.65;m.userData.thinLeaf=true;}
 Object.assign(mats,{rootedCanopyDark:dark,rootedCanopyGreen:green,rootedCanopyLight:light});
 const leaf=(()=>{
  const positions=[],uv=[],indices=[],rows=8;
  for(let i=0;i<=rows;i++){
   const t=i/rows,w=.48*Math.pow(Math.sin(Math.PI*t),.78),bend=.10*Math.sin(Math.PI*t)+.07*t*t;
   for(const side of[-1,0,1]){positions.push(side*w,bend-Math.abs(side)*.065*Math.sin(Math.PI*t),t);uv.push((side+1)/2,t);}
  }
  for(let i=0;i<rows;i++)for(let j=0;j<2;j++){const a=i*3+j;indices.push(a,a+3,a+1,a+1,a+3,a+4);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.name='folded-evergreen-leaf-with-petiole-seat';return g;
 })();
 function limb(points,r0,r1,ma='trunk'){
  const curve=new T.CatmullRomCurve3(points.map(V),false,'centripetal'),length=curve.getLength(),N=Math.max(8,Math.ceil(length*5)),R=12,frames=curve.computeFrenetFrames(N,false),pos=[],uv=[],idx=[];
  for(let i=0;i<=N;i++){
   const t=i/N,p=curve.getPoint(t),radius=r1+(r0-r1)*Math.pow(1-t,1.13);
   for(let j=0;j<=R;j++){
    const a=j/R*Math.PI*2,rough=1+.045*Math.sin(a*7+t*21)+.025*Math.sin(a*11-t*37),v=p.clone().addScaledVector(frames.normals[i],Math.cos(a)*radius*rough).addScaledVector(frames.binormals[i],Math.sin(a)*radius*rough);
    pos.push(...v.toArray());uv.push(j/R,length*t);
   }
  }
  for(let i=0;i<N;i++)for(let j=0;j<R;j++){const a=i*(R+1)+j,c=a+R+1;idx.push(a,c,a+1,a+1,c,c+1);}
  for(const end of[0,N]){const p=curve.getPoint(end/N),c=pos.length/3;pos.push(...p.toArray());uv.push(.5,end/N);for(let j=0;j<R;j++){const a=end*(R+1)+j;end?idx.push(c,a,a+1):idx.push(c,a+1,a);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.name='closed-rooted-evergreen-tapered-limb';limbGeometries.push(g);stats.closedTaperedLimbs++;return curve;
 }
 const root=V(stats.root);
 // Mature main stem stays west of the photographic opening; large curved
 // boughs spread across it, rather than one long diagonal sapling pole.
 const trunk=limb([stats.root,[-8.0,1.55,10.35],[-8.45,4.1,10.10],[-8.8,6.8,9.9],[-8.3,9.3,10.0],[-7.3,11.3,10.2],[-5.8,13.2,10.6],[-4.5,14.6,10.9]],.43,.048);
 for(let j=0;j<7;j++){
  const a=j*Math.PI*2/7,len=.68+random()*.44;
  limb([[root.x+Math.cos(a)*len,-.018,root.z+Math.sin(a)*len],[root.x+Math.cos(a)*.42,.10,root.z+Math.sin(a)*.42],[root.x,1.00,root.z]],.085,.17);
 }
 const boughs=[
  {from:.34,points:[[-7.1,6.9,9.6],[-5.4,7.8,9.2],[-3.4,8.2,8.9],[-1.5,8.4,9.2]],radius:.20},
  {from:.51,points:[[-6.7,8.7,10.3],[-4.7,9.6,10.65],[-1.6,10.1,11.0],[2.0,10.7,11.8]],radius:.20},
  {from:.65,points:[[-5.8,10.7,10.6],[-3.6,11.4,11.0],[-1.2,11.8,11.4],[1.0,12.2,11.5]],radius:.17},
  {from:.40,points:[[-7.1,7.8,9.1],[-5.4,8.4,8.3],[-3.6,9.0,8.2],[-1.8,9.3,8.6]],radius:.15},
  {from:.60,points:[[-6.3,10.4,9.3],[-4.6,11.6,9.0],[-1.4,12.4,9.6]],radius:.16},
  {from:.73,points:[[-5.0,12.2,10.7],[-3.8,13.5,11.1],[-1.8,14.2,11.4]],radius:.14},
  {from:.47,points:[[-8.3,8.9,11.2],[-6.1,9.9,11.9],[-3.8,10.8,12.4]],radius:.16},
  {from:.80,points:[[-5.8,13.7,9.6],[-4.1,14.9,9.7],[-2.4,15.4,10.1]],radius:.11}
 ];
 const crownCurves=[trunk];
 for(const item of boughs){const start=trunk.getPoint(item.from);crownCurves.push(limb([start.toArray(),...item.points],item.radius,.026));}
 const terminalAnchors=[
  [-7.0,9.6,8.8],[-5.9,9.3,8.3],[-4.8,8.5,8.6],[-3.5,8.7,8.7],[-2.0,8.5,9.0],[-1.3,8.5,9.3],
  [-6.8,10.3,9.4],[-5.4,10.2,10.4],[-3.8,10.3,10.8],[-2.0,10.1,11.0],[-.4,10.6,11.4],[1.4,10.8,11.8],
  [-5.8,11.7,9.0],[-4.3,12.0,9.2],[-2.6,12.4,9.5],[-1.1,12.5,9.8],[-4.5,11.7,10.9],[-2.7,11.7,11.3],[-.6,12.1,11.4],[1.0,12.1,11.7],
  [-6.1,13.3,10.4],[-4.4,13.6,10.6],[-2.8,14.0,11.2],[-1.7,14.3,11.4],[-4.7,14.8,9.7],[-2.8,15.2,10.1],
  [-7.4,10.0,11.8],[-5.5,10.7,12.2],[-3.8,11.0,12.4],[-3.1,9.5,8.5]
 ];
 function nearestSeat(point){let distance=Infinity,seat=null;for(const curve of crownCurves)for(let j=3;j<=24;j++){const p=curve.getPoint(j/24),d=p.distanceToSquared(point);if(d<distance){distance=d;seat=p;}}return seat;}
 function leafyShoot(start,end,size){
  const middle=start.clone().lerp(end,.53);middle.y+=size*.12;
  const curve=limb([start.toArray(),middle.toArray(),end.toArray()],.010+size*.0013,.0035);
  const pairs=11+Math.floor(random()*6),axis=end.clone().sub(start),yaw=Math.atan2(axis.x,axis.z);
  for(let i=0;i<pairs;i++){
   const t=.08+.89*(i+.5)/pairs,p=curve.getPoint(t),side=i%2?1:-1,leafSize=(.095+random()*.070)*(.82+.23*Math.sin(Math.PI*t)),angle=yaw+side*(.55+random()*.55),tilt=-.78+random()*.90,roll=(random()-.5)*.72;
   const leafBase=p.clone().add(new T.Vector3(Math.sin(angle)*.023,.006,Math.cos(angle)*.023));
   b.line(p.toArray(),leafBase.toArray(),.0028,'trunk');
   const material=random()<.12?light:random()<.40?green:dark;
   b.put(leaf,material,leafBase.toArray(),[leafSize*.72,leafSize,leafSize*1.5],[tilt,angle,roll],.78+random()*.42);stats.individualLeaves++;
  }
  stats.terminalShoots++;
 }
 for(let ci=0;ci<terminalAnchors.length;ci++){
  const target=V(terminalAnchors[ci]),seat=nearestSeat(target),center=seat.clone().lerp(target,.78),reach=.85+random()*.44,secondary=limb([seat.toArray(),center.clone().lerp(target,.45).toArray(),target.toArray()],.035+random()*.025,.009);
  for(let j=0;j<11;j++){
   const t=.18+.78*(j+.5)/11,shootSeat=secondary.getPoint(t),angle=j*2.399+ci*.51,up=(random()-.5)*1.30;
   const end=target.clone().add(new T.Vector3(Math.cos(angle)*reach*(.55+random()*.48),up*.56+random()*.24,Math.sin(angle)*reach*(.52+random()*.42)));
   leafyShoot(shootSeat,end,reach);
   const forkSeat=shootSeat.clone().lerp(end,.58),forkEnd=end.clone().add(new T.Vector3(Math.cos(angle+.78)*reach*.54,(random()-.35)*.54,Math.sin(angle+.78)*reach*.52));
   leafyShoot(forkSeat,forkEnd,reach*.55);
  }
 }
 const limbs=mergeGeometries(limbGeometries,false);if(!limbs)throw Error('Scene02 rooted canopy limb merge failed.');limbs.name='scene02-rooted-evergreen-continuous-branch-network';b.put(limbs,'trunk');for(const g of limbGeometries)g.dispose();
 return{...stats,construction:'One soil-embedded trunk, seven closed buttress roots, attached tapered boughs and alternate folded leaves; all geometry exists through camera motion',visualAccepted:false};
}
