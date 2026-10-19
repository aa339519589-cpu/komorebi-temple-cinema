import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Reference03 pale fields below upper brackets and above the lower roof:
// solid infill behind a short open timber rail, not large glazed windows.
// Hidden seats are construction hypotheses. No photo pixels or new maps.
export function buildUpperGalleryInfill03({emit,role}){
 const bottom=9.95,top=11.23,left=-6.8,right=6.8,cache=new Map();
 const axes=[-6.72,...Array.from({length:11},(_,i)=>(i-5)*1.25),6.72];
 const counts={plasterFields:0,framePosts:0,openRailCells:0,railStiles:0,solids:0};
 function solid(x,y,z,w,h,d,material,arris=.004){
  const key=[w,h,d,arris].map(n=>n.toFixed(6)).join('/');let g=cache.get(key);
  if(!g){g=new RoundedBoxGeometry(w,h,d,2,Math.min(arris,w/5,h/5,d/5));g.userData.architectureMember='scene03-closed-upper-gallery-infill';g.userData.closedSolid=true;cache.set(key,g);}
  emit(g,material,x,y,z);counts.solids++;
 }
 role('upper-gallery-segmented-closed-grey-infill',()=>{
  // New posts terminate at the retained11.35m beam's lower11.23m face.
  solid(0,10.02,-.82,right-left,.14,.38,'cedar');
  solid(0,11.165,-.82,right-left,.13,.38,'cedar');
  for(const x of axes){solid(x,(bottom+top)/2,-.82,.16,top-bottom,.38,'red');counts.framePosts++;}
  for(let j=0;j<axes.length-1;j++){
   const a=axes[j]+.08,b=axes[j+1]-.08;
   solid((a+b)/2,10.595,-1.01,b-a,1.01,.18,'roofFrieze',.003);counts.plasterFields++;
  }
 });
 role('upper-gallery-front-edge-and-actual-open-timber-rail',()=>{
  // The finite edge seats the rail stiles above the retained lower roof.
  solid(0,10.06,-.56,right-left,.16,.78,'cedar');
  solid(0,10.05,-.17,right-left,.18,.06,'red');
  solid(0,10.18,-.35,right-left,.07,.095,'red');
  solid(0,10.62,-.35,right-left,.085,.12,'red');
  for(const x of axes){solid(x,10.39,-.35,.07,.50,.10,'red');counts.railStiles++;}
  for(let j=0;j<axes.length-1;j++){
   const a=axes[j],b=axes[j+1],divisions=b-a>.8?3:1;
   for(let k=1;k<divisions;k++){solid(a+(b-a)*k/divisions,10.40,-.35,.038,.39,.055,'cedar',.002);counts.railStiles++;}
   counts.openRailCells+=divisions;
  }
 });
 return {revision:'scene03-upper-front-infill99',localBounds:{x:[left,right],y:[bottom,top],z:[-1.10,-.11]},retainedTopBeamBottomY:11.23,plaster:{thickness:.18,frontZ:-.92,rearZ:-1.10},frontRail:{frontZ:-.29,rearZ:-.41,wallToRailDepth:.51,actualOpenCells:true},galleryEdge:{topY:10.14,bottomY:9.98},counts,referenceScope:'Closed pale wall fields and short open front rail below the upper brackets; no invented large transparent windows.',limits:'Single-view dimensions and hidden seats are inferred; no new carving or material change.'};
}
