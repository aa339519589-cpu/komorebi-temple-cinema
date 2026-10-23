import {T} from './kernel.js';
import {revolveProfile} from './sorin-solids.js';

// Photo02's close fixtures are constructed in their own local frame. The
// photograph supplies proportion/silhouette evidence only; all apertures,
// turned courses, roof thickness and cast ribs are actual three-dimensional
// surfaces. Hidden castings are inferred, not measured historical objects.
export function createRailFinial210(b,seatY=.905){
 const brass=b.mats.gold.clone();brass.name='scene02-soft-cast-foreground-brass210';brass.color.setHex(0xb69a52);brass.roughness=.32;brass.metalness=.84;brass.userData.verandaMetal210=true;b.mats.verandaBrass210=brass;
 const profile=[[0,0],[.071,0],[.079,.004],[.081,.010],[.080,.016],[.073,.022],
  [.065,.027],[.064,.034],[.068,.039],[.069,.045],[.065,.051],[.054,.057],
  [.048,.062],[.051,.066],[.059,.071],[.063,.077],[.062,.084],[.054,.091],
  [.041,.096],[.038,.101],[.044,.107],[.046,.113],[.040,.118],[.030,.123],
  [.041,.129],[.052,.140],[.060,.153],[.062,.165],[.058,.177],[.050,.185],
  [.039,.191],[.025,.196],[.022,.200],[.020,.204],[.010,.210],[0,.212]];
 const solid=revolveProfile(profile,96,'scene02-layered-giboshi-cast-body210');
 const rim=new T.TorusGeometry(.0755,.0025,8,72);rim.rotateX(Math.PI/2);
 const petalShape=new T.Shape();petalShape.moveTo(0,-.009);
 petalShape.bezierCurveTo(-.007,-.005,-.008,.006,0,.015);
 petalShape.bezierCurveTo(.008,.006,.007,-.005,0,-.009);petalShape.closePath();
 const petal=new T.ExtrudeGeometry(petalShape,{depth:.0026,bevelEnabled:true,bevelSize:.0012,bevelThickness:.001,bevelSegments:1,curveSegments:5});
 const ring=new T.TorusGeometry(.0645,.0019,7,64);ring.rotateX(Math.PI/2);
 function place(){
  b.put(solid,'verandaBrass210',[0,seatY,0]);b.put(rim,'oldgold',[0,seatY+.010,0]);b.put(ring,'oldgold',[0,seatY+.033,0]);
  // Cast overlapping lotus scales on the low drum. Each leaf has thickness;
  // its back intersects the drum rather than hovering above the post.
  for(let j=0;j<16;j++){
   const a=j*Math.PI/8;b.at([Math.sin(a)*.066,seatY+.044,Math.cos(a)*.066],a,()=>b.put(petal,j%4?'gold':'oldgold'));
  }
 }
 return{place,stats:{revision:'scene02-photo-shaped-layered-giboshi210-r07',height:.212,maxRadius:.081,postSeatY:seatY,closedTurnedBody:true,castLotusScales:16,profile,referenceTexture:false,visualAccepted:false}};
}

function closedCastStem(points,name){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments=28,radial=7;
 const tube=new T.TubeGeometry(curve,segments,.0034,radial,false),p=Array.from(tube.attributes.position.array),ix=Array.from(tube.index.array);
 for(const end of[0,1]){
  const centre=curve.getPoint(end),normal=curve.getTangent(end).multiplyScalar(end?1:-1),id=p.length/3,ring=end?segments*(radial+1):0;p.push(...centre.toArray());
  for(let j=0;j<radial;j++){
   const a=ring+j,c=ring+j+1,va=new T.Vector3().fromArray(p,a*3).sub(centre),vc=new T.Vector3().fromArray(p,c*3).sub(centre);
   if(va.cross(vc).dot(normal)>0)ix.push(id,a,c);else ix.push(id,c,a);
  }
 }
 tube.dispose();const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();g.name=name;return g;
}

export function createRailRelief210(b){
 // Dense cast chrysanthemum/acanthus infill replaces the sparse large wire
 // curls. The relief is embedded into its real wooden panel backing, with
 // closed curled stems and thick cupped leaves rather than an image decal.
 const shape=new T.Shape();shape.moveTo(0,0);shape.bezierCurveTo(-.012,.009,-.017,.033,0,.052);shape.bezierCurveTo(.017,.033,.012,.009,0,0);shape.closePath();
 const leaf=new T.ExtrudeGeometry(shape,{depth:.006,bevelEnabled:true,bevelSize:.0018,bevelThickness:.0012,bevelSegments:2,curveSegments:7});
 leaf.rotateY(Math.PI/2);const lp=leaf.attributes.position;
 for(let j=0;j<lp.count;j++)lp.setX(j,lp.getX(j)+.0038*Math.sin(Math.PI*Math.max(0,Math.min(1,lp.getY(j)/.052))));leaf.computeVertexNormals();leaf.name='scene02-closed-cupped-rail-relief-leaf210';
 const boss=new T.SphereGeometry(1,24,14),ring=new T.TorusGeometry(.027,.0026,8,48);ring.rotateY(Math.PI/2);
 const cache=new Map(),stats={revision:'scene02-cast-chrysanthemum-and-acanthus-panels210-r07',panels:0,closedStems:0,cuppedLeaves:0,woodBackingRetained:true,referenceTexture:false,visualAccepted:false};
 function panel(width,height){
  const factor=height/.18,edge=width/2-.017,key=width.toFixed(6)+':'+height.toFixed(6);let paths=cache.get(key);
  if(!paths){paths=[];for(const side of[-1,1])for(const vertical of[-1,1]){
   const points=[[.0345,vertical*.017*factor,side*.056],[.0345,vertical*.050*factor,side*.110],[.0345,vertical*.064*factor,side*(edge-.047)],[.0345,vertical*.047*factor,side*edge],[.0345,vertical*.014*factor,side*(edge-.009)],[.0345,vertical*.007*factor,side*(edge-.049)],[.0345,vertical*.031*factor,side*(edge-.071)],[.0345,vertical*.044*factor,side*(edge-.046)],[.0345,vertical*.030*factor,side*(edge-.029)]];
   paths.push({geometry:closedCastStem(points,'scene02-closed-foliate-rail-stem210'),curve:new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),side,vertical});
  }cache.set(key,paths);}
  for(let j=0;j<12;j++){
   const a=j*Math.PI/6;
   b.put(leaf,j%3?'verandaBrass210':'oldgold',[.031,Math.cos(a)*.011*factor,Math.sin(a)*.011*factor],[1,factor,factor],[a,0,0]);stats.cuppedLeaves++;
  }
  b.put(ring,'oldgold',[.044,0,0],[1,factor,factor]);b.put(boss,'verandaBrass210',[.043,0,0],[.012,.024*factor,.024*factor]);
  for(const {geometry,curve,side,vertical}of paths){
   b.put(geometry,'verandaBrass210');stats.closedStems++;
   for(let j=0;j<6;j++){
    const t=.14+j*.135,p=curve.getPoint(t),v=curve.getTangent(t),a=Math.atan2(v.z,v.y)+(j%2?1:-1)*.78;
    b.put(leaf,j%3?'verandaBrass210':'oldgold',[.031,p.y,p.z],[.75,.52*factor,.52*factor],[a,0,0]);stats.cuppedLeaves++;
   }
   b.put(boss,'oldgold',[.043,vertical*(height/2-.012),side*(width/2-.012)],[.0045,.0045,.0045]);
  }
  stats.panels++;
 }
 return{panel,stats};
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
 for(const sign of[-1,1])for(let row=0;row<5;row++){
  const y=sign*(.174+row*.055),xs=[-.138,-.069,0,.069,.138];
  for(const x of xs)diamond(x+(row%2?.013:0),y,.029,.026);
 }
 for(const sign of[-1,1])for(const y of[-.108,-.035,.038,.111])diamond(sign*.168,y,.022,.028);
 ellipse(0,0,.041,.041);
 for(let j=0;j<12;j++){
  const a=j*Math.PI/6,r=.094;ellipse(Math.cos(a)*r,Math.sin(a)*r,.013,.028,a-Math.PI/2);
 }
 const g=new T.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:true,bevelSize:.0022,bevelThickness:.0022,bevelSegments:1,curveSegments:7});
 g.name='scene02-thick-cast-diamond-and-flower-perforated-lamp-facet210';g.userData={apertures:holes,actualThroughHoles:true,referenceTexture:false};return g;
}

export function createHangingLantern210({b,mats}){
 mats.lanternCast210=mats.oldgold.clone();mats.lanternCast210.name='scene02-dark-patinated-lamp-casting210';mats.lanternCast210.color.setHex(0x78603a);mats.lanternCast210.roughness=.40;mats.lanternCast210.metalness=.84;mats.lanternCast210.userData.verandaMetal210=true;
 mats.lanternRib210=mats.oldgold.clone();mats.lanternRib210.name='scene02-rubbed-lamp-frame-ribs210';mats.lanternRib210.color.setHex(0x9b793c);mats.lanternRib210.roughness=.36;mats.lanternRib210.userData.verandaMetal210=true;
 const pane=new T.MeshStandardMaterial({name:'scene02-recessed-amber-lamp-chamber210',color:0x916525,emissive:0xffa136,emissiveIntensity:1.25,roughness:.87});mats.lanternPane210=pane;
 const roof=closedHexRoof(),facet=piercedFacet(),hexRing=new T.CylinderGeometry(.455,.455,.044,6),link=new T.TorusGeometry(.035,.0105,8,20);
 const crown=revolveProfile([[0,.79],[.095,.79],[.105,.81],[.095,.84],[.060,.858],[.055,.89],[.075,.906],[.074,.934],[.049,.954],[.043,.98],[.063,1.004],[.063,1.027],[.039,1.05],[.027,1.079],[0,1.09]],48,'scene02-stepped-lamp-crown-and-chain-bearing210');
 const bowl=revolveProfile([[0,-.445],[.39,-.445],[.455,-.460],[.47,-.478],[.47,-.506],[.44,-.519],[.43,-.54],[.35,-.554],[.33,-.587],[.28,-.613],[.20,-.64],[.145,-.66],[.11,-.69],[.10,-.72],[.12,-.735],[.12,-.76],[.092,-.78],[.06,-.81],[.07,-.83],[.074,-.853],[.059,-.882],[.035,-.91],[.03,-.948],[.01,-.98],[0,-.99]],48,'scene02-closed-stepped-lamp-bowl-and-pendant210');
 const flowerRing=new T.TorusGeometry(.135,.008,7,48),tinyRing=new T.TorusGeometry(.054,.004,6,32);
 const stats={revision:'scene02-short-faceted-pierced-bronze-lamp210-r06',lamps:0,piercedFacets:0,apertures:0,chainLinks:0,facetHeight:.85,facetWidth:.41,recessMetres:.077,fixtureOffsetLocalY:-.10,closedRoof:true,referenceTexture:false,visualAccepted:false};
 function lantern(x,y,z,s=1,ceiling=9.3){
  const mountY=y-.10*s;
  b.at([x,mountY,z],0,()=>{
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
  const top=mountY+1.09*s,step=.058;
  for(let yy=top;yy<ceiling+.015;yy+=step){
   b.put(link,'lanternCast210',[x,yy,z],[1,1,1],[0,Math.round((yy-top)/step)%2*Math.PI/2,0]);stats.chainLinks++;
  }
  stats.lamps++;
  const light=new T.PointLight(0xffac42,16*s,7.5*s,2);light.position.set(x,mountY,z);return light;
 }
 return{lantern,stats};
}
