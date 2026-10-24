// Inferred architectural reconstruction from HD07, in the established hall's
// local metre coordinates. No source image is sampled or projected onto it.
export const OCCUPIED_HALL_REVISION152='scene07-recessed-plaster-shutters-and-flat-gallery-rails214-r09';
export function buildOccupiedUpperHall152({box,group,column,bracket,carvedPanel,lattice,rail,eaveFrame}){
  const floor=8.50,ceiling=10.55,front=2.75,back=-4.38,half=6.56;
  function galleryRail(points,height=.82){
    for(let i=0;i<points.length;i++){
      const [x,y,z]=points[i],major=i===0||i===points.length-1||i%4===0,w=major?.16:.105;
      box(x,y+height*.48,z,w,height,w,'red');box(x,y+.055,z,w*1.34,.11,w*1.34,'dark');
      box(x,y+height,z,w*1.27,.055,w*1.27,major?'gold':'red');
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
  // Front and rear walls have distinct opaque lime spandrels, recessed dark
  // shutters, thick jambs and a continuous load-bearing frame. The gallery
  // outside the wall is ~1.6m deep, rather than the old empty 5.8m cavity.
  for(const [z,angle]of[[front,0],[back,Math.PI]])group(0,0,z,angle,1,()=>{
    box(0,8.77,-.045,13.12,.54,.22,'plaster');
    box(0,10.24,-.045,13.12,.51,.22,'plaster');
    for(const y of[8.55,9.03,9.93,10.48])box(0,y,.095,13.40,.12,.25,'red');
    for(let i=0;i<=7;i++){
      const x=-6.56+i*13.12/7;box(x,9.51,.08,.19,1.93,.27,'red');
      if(i<7){const cx=x+13.12/14,w=13.12/7-.25;
        const finish=['plaster','shutter','lattice','open','lattice','shutter','plaster'][i];
        box(cx,9.49,-.13,w,.86,.16,finish==='plaster'?'plaster':'dark');
        if(finish==='plaster'){
          for(const xx of[-w*.35,w*.35])box(cx+xx,9.49,.005,.034,.84,.055,'wood');
        }else if(finish==='lattice'){
          for(let k=0;k<9;k++)box(cx-w/2+(k+.5)*w/9,9.49,.005,.033,.84,.060,'wood');
          for(const yy of[9.23,9.49,9.75])box(cx,yy,.028,w,.026,.045,'wood');
        }else{
          // Separate thick shutter leaves rotate about real jambs. Their
          // recessed shadow gaps break the former uninterrupted black strip.
          for(const side of[-1,1])group(cx+side*w*.48,9.49,.015,-side*(finish==='open'?.65:.28),1,()=>{
            box(-side*w*.205,0,0,w*.41,.84,.065,'wood');
            for(let k=0;k<5;k++)box(-side*w*.205-w*.16+k*w*.08,0,.043,.027,.78,.026,'red');
          });
        }
        for(const yy of[9.12,9.49,9.85])box(cx,yy,.043,w,.043,.075,'red');
        carvedPanel(cx,10.27,.17,w-.13,.23);
      }
    }
  });
  // Return walls and corner posts close the volume from above and obliques.
  for(const sign of[-1,1]){
    group(sign*half,0,(front+back)/2,sign*Math.PI/2,1,()=>{
      box(0,9.51,-.06,front-back,1.95,.20,'plaster');
      for(let j=0;j<4;j++){
        const x=-(front-back)/2+(j+.5)*(front-back)/4;
        box(x,9.50,.10,1.25,.96,.15,'dark');
        for(let k=0;k<8;k++)box(x-.57+k*.163,9.5,.20,.035,.93,.07,'wood');
      }
      for(const y of[8.58,9.02,9.99,10.48])box(0,y,.16,front-back,.13,.24,'red');
      for(let j=0;j<=4;j++)box(-(front-back)/2+j*(front-back)/4,9.51,.18,.17,1.94,.27,'red');
    });
    for(const z of[back,front])box(sign*half,9.50,z,.28,2.02,.28,'red');
  }
  // Solid, darker ceiling and transverse ties create shade below the roof.
  box(0,ceiling-.045,-.45,13.25,.14,8.0,'dark');
  for(let i=0;i<=7;i++)box(-6.56+i*13.12/7,10.40,-.45,.19,.27,8.0,'wood');
  for(const z of[-4.55,3.4])for(let i=-3;i<=3;i++){
    if(eaveFrame)eaveFrame(i*2.22,z,8.58,10.43,.205);
    else{column(i*2.22,z,8.58,1.85,.24);bracket(i*2.22,10.43,z,.90);}
  }
  for(const z of[-4.55,3.4])for(const y of[10.02,10.40,10.68])box(0,y,z,14.8,.20,.42,'red');
  for(let i=-3;i<3;i++)carvedPanel((i+.5)*2.22,10.35,3.64,1.80,.29);
  galleryRail(Array.from({length:17},(_,i)=>[-7.2+i*.9,floor,3.95]),.82);
  for(const sign of[-1,1])galleryRail(Array.from({length:9},(_,i)=>[sign*7.2,floor,-4.45+i*1.05]),.82);
  return{revision:OCCUPIED_HALL_REVISION152,floorY:floor,frontWallZ:front,rearWallZ:back,halfWidth:half,ceilingY:ceiling,frontGalleryDepth:1.20,closedRoom:true,galleryRailing:'Flat timber crests, narrow pickets and selected small metal caps; no repeated bulbous gold finials',frontBays:['plaster','shutter','lattice','open','lattice','shutter','plaster'],photoEquivalent:false};
}
