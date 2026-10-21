import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {verandaEdge,verandaTangent} from './veranda-rail117.js';

// Board ends and concealed framing are a structural interpretation: the
// original photograph resolves only a narrow strip behind the foreground rail.
const fract=x=>x-Math.floor(x),hash=(a,b=0)=>fract(Math.sin(a*127.17+b*311.71+73.12)*43758.5453);

function boardGeometry(T,width,length,index,worldX,worldZ){
 const thickness=.045,arris=.0015+.0007*hash(index,2),g=new RoundedBoxGeometry(width,thickness,length,3,arris),p=g.attributes.position,n=g.attributes.normal;
 const difference=.0024*(hash(index,5)-.5),bow=.0009*(hash(index,8)-.5),walk=Math.exp(-(((worldX-15.55)/.58)**4)),phase=hash(index,11)*Math.PI*2;
 const field=(x,z)=>{const u=x/(width/2),t=(z+length/2)/length;return difference-.00065*(1-u*u)+bow*Math.sin(Math.PI*t)**2-.00065*walk*(.5+.5*Math.sin((z+worldZ)*1.1+phase))**2;};
 const blendAt=y=>T.MathUtils.smoothstep(y,-thickness/2+.004,thickness/2-.008),e=.0002,edgeAtCentre=verandaEdge(worldZ);
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),blend=blendAt(y),f=field(x,z),dx=(field(x+e,z)-field(x-e,z))/(2*e)*blend,dz=(field(x,z+e)-field(x,z-e))/(2*e)*blend,dy=1+f*(blendAt(y+e)-blendAt(y-e))/(2*e);
  // Inverse-transpose of the actual millimetre cup/wear deformation. The
  // back remains at its bearing plane; the small real arris stays rounded.
  const ny=n.getY(i)/dy,normal=new T.Vector3(n.getX(i)-dx*ny,ny,n.getZ(i)-dz*ny).normalize();
  const edge=verandaEdge(z+worldZ),tangent=verandaTangent(z+worldZ);
  normal.z-=tangent[0]*normal.x+tangent[1]*normal.y;normal.normalize();
  n.setXYZ(i,normal.x,normal.y,normal.z);p.setXYZ(i,x+edge[0]-edgeAtCentre[0],y+f*blend+edge[1]-1.35,z);
 }
 g.computeBoundingBox();g.computeBoundingSphere();
 if(!Array.from(p.array).every(Number.isFinite))throw Error('Nonfinite closed veranda board');
 g.userData.verandaBoard={closedBackAndSides:true,arrisMetres:arris,topDifferenceMetres:difference,undersideY:-.0225,thicknessMetres:thickness,lengthMetres:length,widthMetres:width,normalPolicy:'Actual deformation inverse-transpose, not a flat shading normal or stretched unit bevel',referencePhotoUsed:false};
 return g;
}

export function buildVerandaBoards(T,b){
 const pitch=.235,width=.228,zStart=9,zEnd=39,endGap=.004,segments=[];let boards=0,nails=0,joists=0,bearers=0,triangles=0;
 for(let column=0;column<25;column++){
  const phase=[0,1.2,2.4][column%3],cuts=[zStart,zEnd];
  for(let k=0;k<10;k++){const z=zStart+phase+k*3.6;if(z>zStart+.45&&z<zEnd-.45)cuts.push(z);}
  cuts.sort((a,b)=>a-b);
  for(let j=0;j<cuts.length-1;j++){
   const a=cuts[j]+(j?endGap/2:0),d=cuts[j+1]-(j<cuts.length-2?endGap/2:0),length=d-a,z=(a+d)/2,index=column*19+j,x=verandaEdge(z)[0]+.044+column*pitch;
   const g=boardGeometry(T,width,length,index,x,z);b.put(g,'floor',[x,1.3275,z],[1,1,1],[0,0,0],.94+.11*hash(index,17));
   triangles+=(g.index?.count??g.attributes.position.count)/3;boards++;segments.push({column,x,z,start:a,end:d,length,topVariation:g.userData.verandaBoard.topDifferenceMetres});
   // Small actual fastener heads sit over the transverse bearing grid.
   for(const zz of[a+.035,d-.035])for(const side of[-1,1]){const edge=verandaEdge(zz);b.cyl(edge[0]+.044+column*pitch+side*.064,edge[1]+g.userData.verandaBoard.topDifferenceMetres,zz,.0035,.002,'black');nails++;}
  }
 }
 const deckWidth=5.868;
 const joistG=new RoundedBoxGeometry(deckWidth,.18,.10,2,.0015);
 for(let j=0;j<=50;j++){const z=zStart+j*.6,edge=verandaEdge(z);b.put(joistG,'cedar',[edge[0]-.07+deckWidth/2,edge[1]-.135,z]);joists++;}
 const bearerG=new RoundedBoxGeometry(.18,.22,4.996,2,.0015);
 for(const offset of[.044,1.624,5.564])for(let j=0;j<6;j++){const z=11.5+j*5,edge=verandaEdge(z);b.put(bearerG,'cedar',[edge[0]+offset,edge[1]-.335,z]);bearers++;}
 return {boardCount:boards,boardColumns:25,direction:'Z, following recovered veranda edge and bearing plane',boardWidthMetres:width,thicknessMetres:.045,longJointMetres:pitch-width,endJointMetres:endGap,lengthRangeMetres:[Math.min(...segments.map(s=>s.length)),Math.max(...segments.map(s=>s.length))],arrisRangeMetres:[.0015,.0022],topDifferenceRangeMetres:[-.0012,.0012],footprint:{edge:'shared verandaEdge(z) with foreground rail',widthMetres:deckWidth,minZ:zStart,maxZ:zEnd},joists,joistPitchMetres:.6,bearers,nails,triangles,segmentExamples:segments.filter(s=>s.column<3&&s.start<21).map(s=>[s.column,s.start,s.end]),limits:'Board end layout and concealed framing are inferred; deck edge and level follow the recovered balustrade.'};
}
