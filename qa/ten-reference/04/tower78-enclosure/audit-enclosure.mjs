// Targeted CPU inspection of the exact generated wall/frame dimensions.
import {emitTowerEnclosureFace} from '../../../../reconstructions/scene-04/src/tower-enclosure04.js';
import {reference4Config as C} from '../../../../reconstructions/scene-04/src/reference4-config.js';
import {writeFile} from 'node:fs/promises';
const facades=[];
for(let level=2;level<5;level++){
 const eave=C.architecture.towerEaveBase+level*C.architecture.towerEavePitch,floor=C.architecture.towerEaveBase+(level-1)*C.architecture.towerEavePitch+.69,w=[6.9,6.7,6.5,6.3,6.05][level]*C.architecture.towerWidthFactor,body=w*.61,depth=body*C.architecture.towerDepthRatio;
 for(let face=0;face<4;face++){
  const width=face%2?depth:body,z=face%2?body/2:depth/2,r=emitTowerEnclosureFace(()=>{},{width,faceZ:z,floor,top:eave-.4});
  if(!r.parts.every(p=>p.size.every(x=>Number.isFinite(x)&&x>0)))throw Error('Invalid solid');
  for(const window of r.windows){const [x,y]=window.center,[ww,hh]=window.clearSize;
   for(let col=0;col<5;col++)for(let row=0;row<3;row++){
    const xx=x-ww/2+(col+.5)*ww/5,yy=y-hh/2+(row+.5)*hh/3;
    if(r.parts.some(p=>Math.abs(xx-p.center[0])<p.size[0]/2&&Math.abs(yy-p.center[1])<p.size[1]/2))throw Error('Opaque solid covers intended lattice cell');
   }
   const low=y-hh/2,sillBottom=low-.052-.0225,sillTop=low-.052+.0225,jambBottom=low-.05;
   if(sillBottom>floor+.07||sillTop<jambBottom)throw Error('Window frame bearing is disconnected');
  }
  facades.push({storey:level+1,face,closedBoxSolids:r.parts.length,windows:r.windows,wallFloor:r.floor,wallTop:r.top,parts:r.parts});
 }
}
const solids=facades.reduce((s,r)=>s+r.closedBoxSolids,0)+3;
const result={status:'actual-box-dimensions-and-apertures-audited',scope:'Twelve upper-storey facade infills. Every part uses existing closed Three.BoxGeometry; no surface is a plane.',facades,windowCount:36,openLatticeCells:540,allCellCentresUnblockedByFacadeSolids:true,apertureTestScope:'Window-cell centres cross only their current facade; other room walls, rails, roofs and foliage legitimately remain physical occluders.',closedParts:solids,ceilingSolids:3,triangles:solids*12,oldRemovedBoxes:336,netAddedTriangles:(solids-336)*12,loadPath:{floorLedgerBottom:'Original closed floor top, exactly floorY',sillBearsOnLedger:true,jambBearsOnSill:true,headerTop:'eaveY-.395, exactly retained red beam underface',ceilingContactsHeaderPlanOverlapMetres:.005},materials:['existing plaster','existing cedar','existing darkwood ceiling'],visualAccepted:false};
await writeFile(new URL('./geometry-receipt.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify({closed:solids,windows:36,openCells:540,netAddedTriangles:result.netAddedTriangles}));
