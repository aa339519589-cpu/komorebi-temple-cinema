// Actual masonry under the existing raised gallery floors. The former .7m
// box began at position.y and left its rear faces suspended above site soil.
// These closed cores descend into the common -0.12m finite ground volume.
export function buildGalleryFooting162({b,position,length}){
 const bottom=-position[1]-.25,coreTop=.64,top=.70,depth=4.30,height=coreTop-bottom;
 b.box(0,(bottom+coreTop)/2,0,length,height,depth,'terraceBody');
 b.box(0,bottom+.09,0,length+.18,.18,depth+.20,'terraceBody');
 b.box(0,.65,0,length+.10,.10,depth+.10,'terraceTread');
 const rows=Math.max(2,Math.ceil((.59-bottom)/.34)),pitch=(.59-bottom)/rows,columns=Math.ceil(length/.95);let clasts=0;
 for(let row=0;row<rows;row++){
  const y=bottom+(row+.5)*pitch,w=length/columns;
  for(const sign of[-1,1])for(let j=0;j<columns;j++){
   const x=-length/2+(j+.5)*w,tint=.87+.17*(.5+.5*Math.sin(row*5.17+j*9.7+sign));
   b.box(x,y,sign*(depth/2+.025),w-.012,pitch-.014,.09,'terraceBody',0,tint);clasts++;
  }
  const ends=5,run=depth/ends;
  for(const sign of[-1,1])for(let j=0;j<ends;j++){
   b.box(sign*(length/2+.025),y,-depth/2+(j+.5)*run,.09,pitch-.014,run-.012,'terraceBody',0,.89+.12*Math.sin(row*3+j*5)**2);clasts++;
  }
 }
 return{worldPosition:position,lengthMetres:length,depthMetres:depth,worldBottom:-.25,commonSoilDatum:-.12,worldFloorTop:position[1]+top,floorAndSuperstructureMoved:false,closedBearingCore:true,masonryFaceClasts:clasts,sourcePhotoPixels:false};
}
