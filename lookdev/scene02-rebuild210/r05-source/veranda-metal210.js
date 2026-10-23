import {T} from './kernel.js';
import {revolveProfile} from './sorin-solids.js';

// Photo02's close fixtures are constructed in their own local frame. The
// photograph supplies proportion/silhouette evidence only; all apertures,
// turned courses, roof thickness and cast ribs are actual three-dimensional
// surfaces. Hidden castings are inferred, not measured historical objects.
export function createRailFinial210(b){
 const profile=[[0,0],[.071,0],[.079,.004],[.081,.010],[.080,.016],[.073,.022],
  [.065,.027],[.065,.034],[.071,.039],[.073,.047],[.070,.054],[.060,.061],
  [.052,.065],[.053,.070],[.063,.075],[.068,.082],[.067,.089],[.059,.097],
  [.046,.102],[.043,.109],[.051,.114],[.058,.121],[.060,.129],[.057,.137],
  [.048,.144],[.036,.150],[.033,.155],[.045,.158],[.055,.164],[.059,.172],
  [.058,.177],[.052,.182],[.041,.186],[.027,.189],[.020,.193],[.022,.198],
  [.017,.204],[.009,.209],[0,.212]];
 const solid=revolveProfile(profile,96,'scene02-layered-giboshi-cast-body210');
 const rim=new T.TorusGeometry(.0755,.0025,8,72);rim.rotateX(Math.PI/2);
 const petalShape=new T.Shape();petalShape.moveTo(0,-.009);
 petalShape.bezierCurveTo(-.007,-.005,-.008,.006,0,.015);
 petalShape.bezierCurveTo(.008,.006,.007,-.005,0,-.009);petalShape.closePath();
 const petal=new T.ExtrudeGeometry(petalShape,{depth:.0026,bevelEnabled:true,bevelSize:.0012,bevelThickness:.001,bevelSegments:1,curveSegments:5});
 const ring=new T.TorusGeometry(.0645,.0019,7,64);ring.rotateX(Math.PI/2);
 function place(){
  b.put(solid,'gold',[0,.905,0]);b.put(rim,'oldgold',[0,.915,0]);b.put(ring,'oldgold',[0,.938,0]);
  // Cast overlapping lotus scales on the low drum. Each leaf has thickness;
  // its back intersects the drum rather than hovering above the post.
  for(let j=0;j<16;j++){
   const a=j*Math.PI/8;b.at([Math.sin(a)*.066,.949,Math.cos(a)*.066],a,()=>b.put(petal,j%4?'gold':'oldgold'));
  }
 }
 return{place,stats:{revision:'scene02-photo-shaped-layered-giboshi210-r05',height:.212,maxRadius:.081,postSeatY:.905,closedTurnedBody:true,castLotusScales:16,profile,referenceTexture:false,visualAccepted:false}};
}

function closedHexRoof(){
 // One continuous solid, with curved roof planes, upturned six corners,
 // returned underside and a closed crown. No open cone or paper roof.
 const section=[[0,.815],[.11,.815],[.15,.764],[.23,.697],[.33,.618],
  [.44,.551],[.54,.493],[.59,.482],[.59,.453],[.54,.460],[.43,.502],
  [.31,.561],[.18,.605],[0,.605]],n=72,p=[],idx=[],rings=[];
 for(const [radius,y]of section){
  const ring=[];
  if(!radius){ring.push(p.length/3);p.push(0,y,0);}
  else for(let j=0;j<n;j++){
   const a=j/n*Math.PI*2,sector=((a+Math.PI/6)%(Math.PI/3))-Math.PI/6;
   const rr=radius*Math.cos(Math.PI/6)/Math.cos(sector);
   const curl=.067*Math.pow(radius/.59,5)*Math.pow(.5-.5*Math.cos(a*6),5);
   ring.push(p.length/3);p.push(Math.sin(a)*rr,y+curl,Math.cos(a)*rr);
  }
  rings.push(ring);
 }
 for(let k=0;k<rings.length-1;k++)for(let j=0;j<n;j++){
  const a=rings[k],c=rings[k+1],next=(j+1)%n;
  if(a.length===1)idx.push(a[0],c[j],c[next]);
  else if(c.length===1)idx.push(a[j],c[0],a[next]);
  else idx.push(a[j],c[j],a[next],a[next],c[j],c[next]);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();
 // Keep a consistent outer winding, including the returned underside.
 let volume=0;for(let k=0;k<idx.length;k+=3){const a=new T.Vector3().fromArray(p,idx[k]*3),c=new T.Vector3().fromArray(p,idx[k+1]*3),d=new T.Vector3().fromArray(p,idx[k+2]*3);volume+=a.dot(c.cross(d))/6;}
 if(volume<0){for(let k=0;k<idx.length;k+=3)[idx[k+1],idx[k+2]]=[idx[k+2],idx[k+1]];g.setIndex(idx);g.computeVertexNormals();}
 g.name='scene02-solid-six-corner-upturned-cast-lamp-roof210';g.userData={closedSolid:true,volume:Math.abs(volume),referenceTexture:false};return g;
}

function piercedFacet(){
 const shape=new T.Shape();shape.moveTo(-.205,-.425);shape.lineTo(.205,-.425);shape.lineTo(.205,.425);shape.lineTo(-.205,.425);shape.closePath();
 let holes=0;
 function diamond(x,y,rx=.023,ry=.031){const q=new T.Path();q.moveTo(x,y-ry);q.lineTo(x-rx,y);q.lineTo(x,y+ry);q.lineTo(x+rx,y);q.closePath();shape.holes.push(q);holes++;}
 function ellipse(x,y,rx,ry,angle=0){const q=new T.Path();q.absellipse(x,y,rx,ry,0,Math.PI*2,true,angle);shape.holes.push(q);holes++;}
 // Small lozenges form the repeated open lattice, with a solid rosette web.
 for(const sign of[-1,1])for(let row=0;row<3;row++){
  const y=sign*(.205+row*.078),xs=row%2?[-.137,-.0685,0,.0685,.137]:[-.137,-.0685,0,.0685,.137];
  for(const x of xs)diamond(x+(row%2?.012:0),y,.022,.030);
 }
 for(const sign of[-1,1])for(const y of[-.106,-.026,.054,.134])diamond(sign*.169,y,.016,.025);
 ellipse(0,0,.041,.041);
 for(let j=0;j<12;j++){
  const a=j*Math.PI/6,r=.094;ellipse(Math.cos(a)*r,Math.sin(a)*r,.013,.028,a-Math.PI/2);
 }
 const g=new T.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:true,bevelSize:.0022,bevelThickness:.0022,bevelSegments:1,curveSegments:7});
 g.name='scene02-thick-cast-diamond-and-flower-perforated-lamp-facet210';g.userData={apertures:holes,actualThroughHoles:true,referenceTexture:false};return g;
}

export function createHangingLantern210({b,mats}){
 mats.lanternCast210=mats.oldgold.clone();mats.lanternCast210.name='scene02-dark-patinated-lamp-casting210';mats.lanternCast210.color.setHex(0x4b3c24);mats.lanternCast210.roughness=.44;
 mats.lanternRib210=mats.oldgold.clone();mats.lanternRib210.name='scene02-rubbed-lamp-frame-ribs210';mats.lanternRib210.color.setHex(0x9b793c);mats.lanternRib210.roughness=.36;
 const pane=new T.MeshStandardMaterial({name:'scene02-recessed-amber-lamp-chamber210',color:0x916525,emissive:0xffa136,emissiveIntensity:1.25,roughness:.87});mats.lanternPane210=pane;
 const roof=closedHexRoof(),facet=piercedFacet(),hexRing=new T.CylinderGeometry(.455,.455,.044,6),link=new T.TorusGeometry(.035,.0105,8,20);
 const crown=revolveProfile([[0,.79],[.095,.79],[.105,.81],[.095,.84],[.060,.858],[.055,.89],[.075,.906],[.074,.934],[.049,.954],[.043,.98],[.063,1.004],[.063,1.027],[.039,1.05],[.027,1.079],[0,1.09]],48,'scene02-stepped-lamp-crown-and-chain-bearing210');
 const bowl=revolveProfile([[0,-.445],[.39,-.445],[.45,-.468],[.47,-.499],[.455,-.534],[.40,-.55],[.32,-.567],[.29,-.618],[.23,-.665],[.17,-.69],[.12,-.72],[.095,-.752],[.092,-.799],[.065,-.832],[.052,-.856],[.071,-.884],[.072,-.911],[.046,-.94],[.034,-.977],[.012,-1.025],[0,-1.043]],6,'scene02-closed-stepped-lamp-bowl-and-pendant210');
 const flowerRing=new T.TorusGeometry(.135,.008,7,48),tinyRing=new T.TorusGeometry(.054,.004,6,32);
 const stats={revision:'scene02-short-faceted-pierced-bronze-lamp210-r05',lamps:0,piercedFacets:0,apertures:0,chainLinks:0,facetHeight:.85,facetWidth:.41,recessMetres:.077,closedRoof:true,referenceTexture:false,visualAccepted:false};
 function lantern(x,y,z,s=1,ceiling=9.3){
  b.at([x,y,z],0,()=>{
   b.put(roof,'lanternCast210');b.put(crown,'lanternCast210');b.put(bowl,'lanternCast210');
   for(const sign of[-1,1])b.put(hexRing,'lanternCast210',[0,sign*.447,0]);
   for(let side=0;side<6;side++){
    const angle=side*Math.PI/3;
    b.at([0,0,0],angle,()=>{
     b.box(0,0,.321,.390,.822,.025,pane);
     b.put(facet,'lanternCast210',[0,0,.398]);
     for(const sign of[-1,1]){
      b.box(sign*.215,.012,.403,.030,1.04,.039,'lanternCast210');
      b.box(sign*.217,.01,.427,.006,.95,.011,'lanternRib210');
      b.box(0,sign*.441,.408,.453,.042,.051,'lanternCast210');
      b.box(0,sign*.443,.437,.422,.007,.012,'lanternRib210');
     }
     b.put(flowerRing,'lanternRib210',[0,0,.423]);b.put(tinyRing,'lanternRib210',[0,0,.426]);
     // Cast corner leaf ribs connect the roof to the frame, with a rolled
     // lip following the real upswept roof corner rather than a flat disc.
     b.tube([[0,.805,.08],[0,.73,.20],[0,.63,.33],[0,.55,.46],[0,.53,.55]],.009,'lanternRib210',24);
     b.tube([[-.254,.48,.44],[0,.482,.511],[.254,.48,.44]],.009,'lanternRib210',24);
     b.tube([[0,-.465,.41],[0,-.565,.29],[0,-.66,.18]],.012,'lanternRib210',18);
     stats.piercedFacets++;stats.apertures+=facet.userData.apertures;
    });
    const a=angle+Math.PI/6;
    b.ball(Math.sin(a)*.588,.549,Math.cos(a)*.588,.018,.031,.018,'lanternRib210');
    b.ball(Math.sin(a)*.40,-.555,Math.cos(a)*.40,.024,.036,.024,'lanternRib210');
   }
   for(const yy of[.826,.933,1.026])b.cyl(0,yy,0,yy===.826?.099:.062,.014,'lanternRib210');
  },s);
  const top=y+1.09*s,step=.058;
  for(let yy=top;yy<ceiling+.015;yy+=step){
   b.put(link,'lanternCast210',[x,yy,z],[1,1,1],[0,Math.round((yy-top)/step)%2*Math.PI/2,0]);stats.chainLinks++;
  }
  stats.lamps++;
  const light=new T.PointLight(0xffac42,16*s,7.5*s,2);light.position.set(x,y,z);return light;
 }
 return{lantern,stats};
}
