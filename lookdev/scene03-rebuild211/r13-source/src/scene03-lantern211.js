// Closed six-sided hanging lantern: paper chamber, finite frame, hipped
// hood, open cast crown, small links and pendant. No texture projection.
export function buildHangingLantern211(T,{emit,gold,bronze,paper},x,y,z){
 const at=(g,ma,p=[0,0,0],r=[0,0,0])=>emit(g,ma,[x+p[0],y+p[1],z+p[2]],[1,1,1],r);
 function turned(profile,ma,sides=6){const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),sides,-Math.PI/6),p=g.attributes.position,ix=g.index.array,ids=[];let volume=0;for(let i=0;i<ix.length;i+=3){const a=new T.Vector3().fromBufferAttribute(p,ix[i]),b=new T.Vector3().fromBufferAttribute(p,ix[i+1]),c=new T.Vector3().fromBufferAttribute(p,ix[i+2]);if(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()<1e-24)continue;volume+=a.dot(b.clone().cross(c))/6;ids.push(ix[i],ix[i+1],ix[i+2]);}if(volume<0)for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];g.setIndex(ids);g.computeVertexNormals();g.name='scene03-211-closed-oriented-lantern-turning';at(g,ma);}
 function ring(yy,r,t=.009,ma=gold){turned([[r-t,yy-t],[r+t,yy-t],[r+t,yy+t],[r-t,yy+t],[r-t,yy-t]],ma);}
 function local(g,ma,a,p,rz=0){g.rotateZ(rz);g.translate(...p);g.rotateY(a);at(g,ma);}
 for(let k=0;k<6;k++){
  const a=k*Math.PI/3;
  local(new T.BoxGeometry(.183,.61,.008),paper,a,[0,-.055,.164]);
  for(const s of[-1,1])local(new T.BoxGeometry(.014,.65,.020),bronze,a,[s*.098,-.055,.175]);
  for(const yy of[-.37,.26])local(new T.BoxGeometry(.208,.018,.021),gold,a,[0,yy,.178]);
  for(const xx of[-.045,.045])local(new T.BoxGeometry(.006,.61,.012),gold,a,[xx,-.055,.180]);
  for(const yy of[-.27,-.055,.16])local(new T.BoxGeometry(.192,.007,.012),gold,a,[0,yy,.180]);
  for(const s of[-1,1])local(new T.BoxGeometry(.012,.215,.017),bronze,a,[s*.092,.575,.159]);
  const flower=new T.Shape();flower.moveTo(0,0);flower.bezierCurveTo(-.027,.026,-.027,.070,0,.104);flower.bezierCurveTo(.027,.070,.027,.026,0,0);flower.closePath();const hole=new T.Path();hole.moveTo(0,.022);hole.bezierCurveTo(.012,.041,.013,.060,0,.080);hole.bezierCurveTo(-.013,.060,-.012,.041,0,.022);hole.closePath();flower.holes.push(hole);
  for(let j=0;j<6;j++){const g=new T.ExtrudeGeometry(flower,{depth:.005,steps:1,curveSegments:7,bevelEnabled:true,bevelSize:.001,bevelThickness:.001,bevelSegments:1});local(g,gold,a,[0,.575,.169],j*Math.PI/3);}
  const boss=new T.SphereGeometry(.014,10,6);local(boss,gold,a,[0,.575,.176]);
  const angle=a+Math.PI/6;
  for(let j=0;j<3;j++)at(new T.TorusGeometry(.011,.0028,6,16),gold,[Math.sin(angle)*.32,.292-j*.024,Math.cos(angle)*.32],[0,angle,0]);
 }
 turned([[0,.43],[.07,.43],[.17,.405],[.27,.335],[.35,.32],[.35,.30],[.27,.309],[.16,.38],[.06,.407],[0,.407]],bronze);
 ring(.31,.335,.008);ring(.467,.182,.010);ring(.687,.182,.010);
 turned([[0,.69],[.182,.69],[.17,.714],[.12,.743],[.035,.76],[0,.76]],gold,18);
 turned([[0,-.57],[.028,-.57],[.11,-.48],[.19,-.39],[.213,-.38],[.213,-.365],[.18,-.365],[.10,-.46],[.022,-.545],[0,-.545]],bronze);
 for(let j=0;j<2;j++)at(new T.TorusGeometry(.015,.004,8,20),gold,[0,-.587-j*.032,0],[0,j*Math.PI/2,0]);
 turned([[0,-.72],[.019,-.70],[.035,-.657],[.025,-.638],[0,-.63]],gold,14);
 at(new T.TorusGeometry(.021,.005,8,20),gold,[0,.785,0]);
 return{centre:[x,y,z],topLinkY:y+.811,bodyHeight:.65,bodyAcrossFlats:.346,closedChamber:true,openCrown:true};
}
