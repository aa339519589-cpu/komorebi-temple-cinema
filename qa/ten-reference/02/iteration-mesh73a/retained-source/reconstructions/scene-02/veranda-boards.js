import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Board ends and concealed framing are a structural interpretation: the
// original photograph resolves only a narrow strip behind the foreground rail.
const fract=x=>x-Math.floor(x),hash=(a,b=0)=>fract(Math.sin(a*127.17+b*311.71+73.12)*43758.5453);

function boardGeometry(T,width,length,index,worldX,worldZ){
 const thickness=.045,arris=.0015+.0007*hash(index,2),g=new RoundedBoxGeometry(width,thickness,length,3,arris),p=g.attributes.position;
 const difference=.0024*(hash(index,5)-.5),bow=.0009*(hash(index,8)-.5),walk=Math.exp(-(((worldX-15.55)/.58)**4)),phase=hash(index,11)*Math.PI*2;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),u=x/(width/2),t=(z+length/2)/length,blend=T.MathUtils.smoothstep(y,-thickness/2+.004,thickness/2-.008);
  const cup=-.00065*(1-u*u),longBow=bow*Math.sin(Math.PI*t)**2,wear=-.00065*walk*(.5+.5*Math.sin((z+worldZ)*1.1+phase))**2;
  p.setY(i,y+(difference+cup+longBow+wear)*blend);
 }
 g.computeBoundingBox();g.computeBoundingSphere();
 if(!Array.from(p.array).every(Number.isFinite))throw Error('Nonfinite closed veranda board');
 g.userData.verandaBoard={closedBackAndSides:true,arrisMetres:arris,topDifferenceMetres:difference,undersideY:-.0225,thicknessMetres:thickness,lengthMetres:length,widthMetres:width,referencePhotoUsed:false};
 return g;
}

export function buildVerandaBoards(T,b){
 const xStart=14.42,pitch=.235,width=.228,zStart=9,zEnd=39,endGap=.004,segments=[];let boards=0,nails=0,joists=0,bearers=0,triangles=0;
 for(let column=0;column<25;column++){
  const x=xStart+column*pitch,phase=[0,1.2,2.4][column%3],cuts=[zStart,zEnd];
  for(let k=0;k<10;k++){const z=zStart+phase+k*3.6;if(z>zStart+.45&&z<zEnd-.45)cuts.push(z);}
  cuts.sort((a,b)=>a-b);
  for(let j=0;j<cuts.length-1;j++){
   const a=cuts[j]+(j?endGap/2:0),d=cuts[j+1]-(j<cuts.length-2?endGap/2:0),length=d-a,z=(a+d)/2,index=column*19+j;
   const g=boardGeometry(T,width,length,index,x,z);b.put(g,'floor',[x,1.3275,z],[1,1,1],[0,0,0],.94+.11*hash(index,17));
   triangles+=(g.index?.count??g.attributes.position.count)/3;boards++;segments.push({column,x,z,start:a,end:d,length,topVariation:g.userData.verandaBoard.topDifferenceMetres});
   // Small actual fastener heads sit over the transverse bearing grid.
   for(const zz of[a+.035,d-.035])for(const side of[-1,1]){b.cyl(x+side*.064,1.350+g.userData.verandaBoard.topDifferenceMetres,zz,.0035,.002,'black');nails++;}
  }
 }
 const deckCentre=(14.306+20.174)/2,deckWidth=20.174-14.306;
 const joistG=new RoundedBoxGeometry(deckWidth,.18,.10,2,.0015);
 for(let j=0;j<=50;j++){b.put(joistG,'cedar',[deckCentre,1.215,zStart+j*.6]);joists++;}
 const bearerG=new RoundedBoxGeometry(.18,.22,4.996,2,.0015);
 for(const x of[14.42,16.0,19.94])for(let j=0;j<6;j++){b.put(bearerG,'cedar',[x,1.015,11.5+j*5]);bearers++;}
 return {boardCount:boards,boardColumns:25,direction:'Z, along the retained veranda',boardWidthMetres:width,thicknessMetres:.045,longJointMetres:pitch-width,endJointMetres:endGap,lengthRangeMetres:[Math.min(...segments.map(s=>s.length)),Math.max(...segments.map(s=>s.length))],arrisRangeMetres:[.0015,.0022],topDifferenceRangeMetres:[-.0012,.0012],originalFootprint:{minX:14.306,maxX:20.174,minZ:zStart,maxZ:zEnd,nominalTopY:1.35},joists,joistPitchMetres:.6,bearers,undersideY:1.305,joistTopY:1.305,bearerTopY:1.125,nails,triangles,segmentExamples:segments.filter(s=>s.column<3&&s.start<21).map(s=>[s.column,s.start,s.end]),limits:'Board end layout and concealed framing are inferred structural detailing; not individually measured from the supplied photograph.'};
}

export function buildLowerVerandaRail(T,b){
 // Called inside the retained local rail transform [.2,.27,0] * scaleY.8.
 // All middle/top rails, post shafts, finials and metal inserts remain in
 // their original source and positions. Only this lowest rail is replaced.
 const posts=Array.from({length:10},(_,i)=>8+i*3.6),ends=[...posts,41];let rails=0,tenons=0,sills=0;
 for(let i=0;i<ends.length-1;i++){
  const a=ends[i],d=ends[i+1],span=d-a,z=(a+d)/2;
  b.put(new RoundedBoxGeometry(.082,.1125,span-.16,2,.002),'red',[14.4,1.55,z]);rails++;
  for(const end of[a,d]){b.put(new RoundedBoxGeometry(.045,.060,.12,2,.001),'cedar',[14.4,1.55,end]);tenons++;}
  b.put(new RoundedBoxGeometry(.225,.080,span-.004,2,.002),'cedar',[14.4,1.37,z]);sills++;
 }
 return {lowerRailSegments:rails,closedEndTenons:tenons,footSillSegments:sills,worldLowerRailCentreY:1.51,worldFootSillBoundsY:[1.334,1.398],referencePhotoUsed:false,limits:'Lower-rail bearing/shoulder detail is a construction interpretation; upper metalwork is retained.'};
}
