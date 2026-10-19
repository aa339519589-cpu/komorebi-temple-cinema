// Editable solid timber/plaster infill for the three upper visible pagoda rooms.
// Only construction is inferred from comparisons. No image, emission or light.
export function emitTowerEnclosureFace(box,{width,faceZ,floor,top}){
  const h=top-floor,openingWidth=Math.min(.56,width*.20),openingHeight=Math.min(.56,h*.68),cy=(floor+top)/2;
  const low=cy-openingHeight/2,high=cy+openingHeight/2,centres=[-width*.25,0,width*.25],parts=[],windows=[];
  function part(tag,x,y,z,w,h,d,material){if(!(w>0&&h>0&&d>0))throw Error('Invalid tower infill solid');parts.push({tag,center:[x,y,z],size:[w,h,d],material});box(x,y,z,w,h,d,material);}
  // Real 120mm infill piers and spandrels surround open apertures. There is no
  // full opaque backing sheet behind these windows, unlike the previous wall.
  part('lower-plaster-spandrel',0,(floor+low)/2,faceZ,width,low-floor,.12,'plaster');
  part('upper-plaster-spandrel',0,(high+top)/2,faceZ,width,top-high,.12,'plaster');
  let left=-width/2;
  for(let i=0;i<=centres.length;i++){
    const right=i<centres.length?centres[i]-openingWidth/2:width/2;
    part('plaster-pier-'+i,(left+right)/2,cy,faceZ,right-left,openingHeight,.12,'plaster');
    if(i<centres.length)left=centres[i]+openingWidth/2;
  }
  // Ledger bears on the retained closed floor; projecting sills overlap it.
  part('continuous-floor-bearing-ledger',0,floor+.035,faceZ,width+.02,.07,.15,'cedar');
  part('header-under-existing-red-beam',0,top-.025,faceZ,width+.02,.06,.15,'cedar');
  for(let i=0;i<centres.length;i++){
    const x=centres[i],jamb=.050,frameZ=faceZ+.005;
    for(const sign of[-1,1]){
      part('window-'+i+'-jamb',x+sign*(openingWidth/2+jamb/2),cy,frameZ,jamb,openingHeight+.10,.16,'cedar');
      part('window-'+i+'-head-sill',x,cy+sign*(openingHeight/2+jamb/2),frameZ,openingWidth,jamb,.16,'cedar');
    }
    part('window-'+i+'-bearing-sill',x,low-.052,faceZ+.065,openingWidth+.15,.045,.19,'cedar');
    // Recessed timber lattice: five open columns by three rows. The aperture
    // itself is empty, not an alpha mask or a pasted black/paper rectangle.
    for(let j=1;j<5;j++)part('window-'+i+'-vertical-bar',x-openingWidth/2+j*openingWidth/5,cy,faceZ+.008,.022,openingHeight,.034,'cedar');
    for(let j=1;j<3;j++)part('window-'+i+'-horizontal-bar',x,low+j*openingHeight/3,faceZ+.008,openingWidth,.020,.034,'cedar');
    windows.push({center:[x,cy,faceZ],clearSize:[openingWidth,openingHeight],wallThickness:.12,frameDepth:.16,latticeCells:[5,3],emission:false});
  }
  return{parts,windows,floor,top,width,faceZ};
}
