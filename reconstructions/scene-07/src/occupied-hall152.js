// Inferred architectural reconstruction from HD07, in the established hall's
// local metre coordinates. No source image is sampled or projected onto it.
import * as T from 'three';
export const OCCUPIED_HALL_REVISION152='scene07-one-metre-returned-upper-veranda238-r26';
export function buildOccupiedUpperHall152({box,group,column,bracket,carvedPanel,lattice,rail,eaveFrame,emit,roofBottomAt=null,wallBays,frontJoinery}){
  const floor=8.50,ceiling=10.55,front=2.75,back=-4.38,half=5.89;
  const galleryPosts=new Set();
  function galleryRail(points,height=.82){
    for(let i=0;i<points.length;i++){
      const [x,y,z]=points[i],major=i===0||i===points.length-1||i%4===0,w=major?.16:.105;
      const key=[x,y,z].map(v=>v.toFixed(5)).join(',');
      if(!galleryPosts.has(key)){
        galleryPosts.add(key);box(x,y+height*.48,z,w,height,w,'red');box(x,y+.055,z,w*1.34,.11,w*1.34,'dark');
        box(x,y+height,z,w*1.27,.055,w*1.27,major?'gold':'red');
      }
      if(!i)continue;
      const [ax,ay,az]=points[i-1],dx=x-ax,dz=z-az,len=Math.hypot(dx,dz),yaw=-Math.atan2(dz,dx);
      for(const [h,bh,bd]of[[.14,.085,.12],[.43,.085,.10],[height-.035,.12,.15]])box((x+ax)/2,(y+ay)/2+h,(z+az)/2,len,bh,bd,'red',[0,yaw,0]);
      for(const t of[1/3,2/3])box(ax+dx*t,ay+(y-ay)*t+.43,az+dz*t,.035,.49,.052,'red',[0,yaw,0]);
    }
  }
  // Joined perimeter and transverse joists carry a physical boarded floor.
  for(const z of[-4.60,2.35,3.78])box(0,floor-.22,z,14.45,.30,.30,'wood');
  for(let i=0;i<=14;i++)box(-7.0+i, floor-.23,-.42,.16,.29,8.54,'wood');
  for(let i=0;i<48;i++)box(-7.20+(i+.5)*14.4/48,floor-.035,-.40,14.4/48-.006,.13,8.50,'red');
  // Joined recessed casements and lime spandrels share continuous jambs,
  // sills and transoms; returned corners enclose the same occupied room.
  wallBays(front,0,half*2,6);wallBays(back,Math.PI,half*2,6);
  for(const sign of[-1,1]){
    group(sign*half,0,(front+back)/2,sign*Math.PI/2,1,()=>wallBays(0,0,front-back,4,sign));
    for(const z of[back,front])box(sign*half,9.50,z,.24,2.02,.28,'red');
  }
  // Solid, darker ceiling and transverse ties create shade below the roof.
  if(emit&&roofBottomAt){
    const p=[],ix=[],nx=32,nz=20,stride=(nx+1)*(nz+1);
    for(let layer=0;layer<2;layer++)for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
      const x=-6.625+i*13.25/nx,z=-4.45+j*8/nz,top=Math.min(ceiling+.025,roofBottomAt(x,z)-.06);p.push(x,top-layer*.14,z);
    }
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ix.push(a,c,b,b,c,d,a+stride,b+stride,c+stride,b+stride,d+stride,c+stride);}
    const edge=[...Array.from({length:nx},(_,i)=>i),...Array.from({length:nz},(_,j)=>j*(nx+1)+nx),...Array.from({length:nx},(_,i)=>nz*(nx+1)+nx-i),...Array.from({length:nz},(_,j)=>(nz-j)*(nx+1))];
    for(let i=0;i<edge.length;i++){const a=edge[i],b=edge[(i+1)%edge.length];ix.push(a,b,a+stride,b,b+stride,a+stride);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();g.setAttribute('uv',new T.Float32BufferAttribute(p.flatMap((v,i)=>i%3===0?[v,p[i+2]]:[]),2));g.userData.architectureMember='roof-fitted-closed-upper-ceiling214-r20';emit(g,'dark',0,0,0);
  }else box(0,ceiling-.045,-.45,13.25,.14,8.0,'dark');
  for(let i=0;i<=7;i++)box(-6.56+i*13.12/7,10.40,-.45,.19,.27,8.0,'wood');
  for(const z of[-4.55,3.4])for(let i=-3;i<=3;i++){
    if(eaveFrame)eaveFrame(i*2.22,z,8.58,10.43,.175);
    else{column(i*2.22,z,8.58,1.85,.24);bracket(i*2.22,10.43,z,.90);}
  }
  for(const z of[-4.55,3.4])for(const y of[10.02,10.40,10.68]){
    if(!roofBottomAt){box(0,y,z,14.8,.20,.42,'red');continue;}
    const step=.05,N=296,valid=x=>Math.min(roofBottomAt(x,z-.23),roofBottomAt(x,z),roofBottomAt(x,z+.23))>y+.135;let start=null;
    for(let i=0;i<=N;i++){const x=-7.4+i*step,on=valid(x);if(on&&start===null)start=x;if(start!==null&&(!on||i===N)){const end=on?x:x-step;if(end-start>.10)box((start+end)/2,y,z,end-start,.20,.42,'red');start=null;}}
  }
  frontJoinery(roofBottomAt);
  galleryRail(Array.from({length:17},(_,i)=>[-7.2+i*.9,floor,3.95]),.82);
  for(const sign of[-1,1])galleryRail(Array.from({length:9},(_,i)=>[sign*7.2,floor,-4.45+i*1.05]),.82);
  return{revision:OCCUPIED_HALL_REVISION152,floorY:floor,frontWallZ:front,rearWallZ:back,halfWidth:half,ceilingY:ceiling,roofFittedClosedCeiling:!!roofBottomAt,upperTiesTrimmedToActualRoof:!!roofBottomAt,frontGalleryDepth:1.20,returnedWallToColumnAxis:6.94-half,returnedWallToRailAxis:7.20-half,closedRoom:true,galleryRailing:'Flat timber crests, narrow pickets and selected small metal caps; no repeated bulbous gold finials',frontBays:'Six joined recessed paired casement bays; four returned bays at each end; returned windows and corner jambs share the same deeper room perimeter',photoEquivalent:false};
}
