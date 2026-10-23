import {T,V} from './kernel.js';

// Scene-local solid bronze piercings, carved beam noses and column-head clamps.
// These sit on the veranda's actual beams; there is no projected decoration.
export function buildVerandaCarvings143({b,mats,canopy}){
 const stats={carvedBeamNoses:0,columnHeadClamps:0,piercedLanternFaces:0,chainLinks:0};
 mats.verandaRed=mats.red.clone();mats.verandaRed.name='scene02-veranda-rubbed-lacquer-shaft';mats.verandaRed.color.setHex(0x8d3520);mats.verandaRed.clearcoat=.27;mats.verandaRed.clearcoatRoughness=.22;
 mats.verandaBronze=mats.oldgold.clone();mats.verandaBronze.name='scene02-aged-lantern-cast-bronze';mats.verandaBronze.color.setHex(0x4e361e);mats.verandaBronze.roughness=.47;
 const leafShape=new T.Shape();leafShape.moveTo(0,-.035);leafShape.bezierCurveTo(-.13,.02,-.12,.14,0,.25);leafShape.bezierCurveTo(.12,.14,.13,.02,0,-.035);leafShape.closePath();
 const leaf=new T.ExtrudeGeometry(leafShape,{depth:.025,bevelEnabled:true,bevelSize:.010,bevelThickness:.008,bevelSegments:2,curveSegments:7});
 const smallRing=new T.TorusGeometry(1,.060,6,32);
 function flower(x,y,z,r){
  b.put(smallRing,'oldgold',[x,y,z],[r,r,.65*r]);
  for(let k=0;k<10;k++){const a=k*Math.PI/5;b.put(leaf,k%3?'oldgold':'gold',[x+Math.cos(a)*r*.30,y+Math.sin(a)*r*.30,z+.014],[r*2.8,r*2.8,r],[0,0,a-Math.PI/2]);}
  b.ball(x,y,z+.045,r*.21,r*.21,r*.10,'gold');
 }
 const noseShape=new T.Shape();noseShape.moveTo(-.80,-.15);noseShape.lineTo(.24,-.15);noseShape.bezierCurveTo(.58,-.13,.76,.03,.65,.26);noseShape.bezierCurveTo(.59,.41,.37,.51,.25,.38);noseShape.bezierCurveTo(.15,.25,.26,.12,.37,.17);noseShape.bezierCurveTo(.47,.24,.36,.31,.30,.27);noseShape.lineTo(-.12,.24);noseShape.bezierCurveTo(-.37,.27,-.58,.38,-.80,.31);noseShape.closePath();
 const nose=new T.ExtrudeGeometry(noseShape,{depth:.44,bevelEnabled:true,bevelSize:.024,bevelThickness:.018,bevelSegments:2,curveSegments:12});nose.translate(0,0,-.22);
 function beamNose(x,y,z,s=1){
  b.at([x,y,z],0,()=>{
   b.put(nose,'cedar');
   for(const side of[-1,1]){
    const zz=side*.247;
    b.tube([[-.72,.27,zz],[-.39,.21,zz],[-.06,.18,zz],[.18,.24,zz],[.31,.36,zz],[.48,.35,zz],[.55,.21,zz],[.46,.07,zz],[.29,.04,zz]],.020,'oldgold',40);
    flower(-.30,.07,zz,.15);
    for(let j=0;j<4;j++)b.put(leaf,j%2?'gold':'oldgold',[-.66+j*.20,.04+(j%2)*.05,zz],[.72,.72,.65],[0,side<0?Math.PI:0,j%2?-.78:.60]);
   }
   b.box(-.73,.06,0,.055,.42,.49,'oldgold');
  },s);stats.carvedBeamNoses++;
 }
 const plaqueShape=new T.Shape();plaqueShape.moveTo(-.40,-.30);plaqueShape.lineTo(.40,-.30);plaqueShape.lineTo(.40,.06);plaqueShape.bezierCurveTo(.39,.25,.24,.34,.18,.29);plaqueShape.quadraticCurveTo(0,.43,-.18,.29);plaqueShape.bezierCurveTo(-.24,.34,-.39,.25,-.40,.06);plaqueShape.closePath();
 for(const x of[-.26,.26]){const p=new T.Path();p.absellipse(x,-.10,.055,.090,0,Math.PI*2,true,.20*Math.sign(x));plaqueShape.holes.push(p);}
 const plaque=new T.ExtrudeGeometry(plaqueShape,{depth:.038,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:2,curveSegments:12});
 const outside=z=>canopy.entryWorld[0]+(z-canopy.entryWorld[2])*(canopy.farWorld[0]-canopy.entryWorld[0])/(canopy.farWorld[2]-canopy.entryWorld[2]);
 for(const z of[2,10,18,26,34]){
  b.at([canopy.columnX,8.72,z],0,()=>{
   b.box(0,-.03,0,.91,.25,.91,'cedar');
   for(const yaw of[0,Math.PI/2,Math.PI,-Math.PI/2])b.at([0,0,0],yaw,()=>{
    b.put(plaque,'oldgold',[0,-.17,.48]);flower(0,-.12,.526,.20);
    for(const sign of[-1,1])b.tube([[0,-.23,.529],[sign*.15,-.24,.53],[sign*.27,-.15,.53],[sign*.22,-.02,.53],[sign*.11,-.06,.53]],.014,'gold',24);
   });
  });stats.columnHeadClamps++;
  beamNose(canopy.columnX-.70,8.65,z+.13,.88);
  beamNose(outside(z)+.68,8.70,z+.13,.73);
 }
 mats.lanternCast160=mats.verandaBronze.clone();mats.lanternCast160.name='scene02-lantern-dark-chased-bronze160';mats.lanternCast160.color.setHex(0x49351c);mats.lanternCast160.roughness=.42;
 const lampPane=new T.MeshStandardMaterial({name:'scene02-physical-emitting-paper160',color:0xad7433,emissive:0xffb559,emissiveIntensity:2.15,roughness:.84,side:T.DoubleSide});
 const grilleShape=new T.Shape();grilleShape.moveTo(-.211,-.55);grilleShape.lineTo(.211,-.55);grilleShape.lineTo(.211,.55);grilleShape.lineTo(-.211,.55);grilleShape.closePath();
 function aperture(x,y,rx,ry,a=0){const p=new T.Path();p.absellipse(x,y,rx,ry,0,Math.PI*2,true,a);grilleShape.holes.push(p);}
 for(const sign of[-1,1]){
  const hole=new T.Path();hole.moveTo(-.175,sign*.20);hole.lineTo(.175,sign*.20);hole.lineTo(.175,sign*.512);hole.lineTo(-.175,sign*.512);hole.closePath();grilleShape.holes.push(hole);
 }
 aperture(0,0,.163,.163);
 const grille=new T.ExtrudeGeometry(grilleShape,{depth:.026,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:1,curveSegments:10});
 const topProfile=[[0,.94],[.075,.94],[.095,.86],[.20,.82],[.34,.76],[.47,.67],[.53,.62],[.53,.58],[.40,.58],[0,.58]].map(p=>new T.Vector2(...p));
 const bottomProfile=[[0,-1.015],[.028,-.995],[.065,-.92],[.082,-.86],[.145,-.82],[.20,-.78],[.31,-.72],[.44,-.66],[.48,-.62],[.42,-.58],[0,-.58]].map(p=>new T.Vector2(...p));
 const capTop=new T.LatheGeometry(topProfile,6),capBottom=new T.LatheGeometry(bottomProfile,6),link=new T.TorusGeometry(.034,.009,7,16);
 function lantern(x,y,z,s=1,ceiling=9.3){
  b.at([x,y,z],0,()=>{
   b.put(capTop,'verandaBronze');b.put(capBottom,'verandaBronze');
   for(const sign of[-1,1]){b.put(new T.CylinderGeometry(.44,.44,.055,6),'oldgold',[0,sign*.58,0]);for(let j=0;j<6;j++){const a=j*Math.PI/3;b.ball(Math.sin(a)*.49,sign*.645,Math.cos(a)*.49,.036,.044,.036,'oldgold');}}
   for(let side=0;side<6;side++)b.at([0,0,0],side*Math.PI/3,()=>{
    b.box(0,0,.363,.404,1.08,.018,lampPane);
    b.put(grille,'lanternCast160',[0,0,.398]);
    // The large open piercings carry cast curling stems and small raised leaves,
    // with genuine air between them and the paper four centimetres behind.
    for(const sign of[-1,1])for(const side of[-1,1]){
     const yy=sign*.347;
     b.tube([[0,sign*.205,.430],[side*.11,sign*.245,.433],[side*.145,sign*.346,.435],[side*.080,sign*.435,.434],[side*.025,sign*.385,.434],[side*.060,sign*.329,.435],[side*.106,sign*.359,.434]],.008,'lanternCast160',30);
     for(let j=0;j<3;j++)b.put(leaf,j%2?'lanternCast160':'oldgold',[side*(.06+j*.035),sign*(.235+j*.083),.435],[.19,.19,.30],[0,0,side*sign*(.60+j*.5)]);
     b.tube([[side*.16,sign*.49,.433],[side*.10,sign*.465,.433],[side*.04,sign*.49,.433],[0,sign*.505,.433]],.0065,'lanternCast160',18);
    }
    for(let j=0;j<10;j++){const a=j*Math.PI/5;b.put(leaf,j%3?'lanternCast160':'oldgold',[Math.cos(a)*.044,Math.sin(a)*.044,.435],[.30,.30,.35],[0,0,a-Math.PI/2]);}
    b.ball(0,0,.453,.032,.032,.017,'gold');
    for(const sign of[-1,1]){
     b.box(sign*.217,0,.397,.047,1.24,.064,'black');b.box(sign*.214,0,.434,.012,1.20,.017,'gold');
     b.box(0,sign*.565,.409,.45,.055,.066,'black');b.box(0,sign*.562,.447,.44,.013,.016,'oldgold');
    }
    b.put(smallRing,'lanternCast160',[0,0,.438],[.169,.169,.12]);
    for(let k=0;k<6;k++){const a=k*Math.PI/3;b.ball(Math.cos(a)*.170,Math.sin(a)*.170,.446,.012,.012,.009,'gold');}
    stats.piercedLanternFaces++;
   });
   for(let j=0;j<6;j++){const a=j*Math.PI/3;beamNose(Math.cos(a)*.24,.72,Math.sin(a)*.24,.19);}
   for(let j=0;j<6;j++){const a=j*Math.PI/3;for(let k=0;k<3;k++){const yy=-.68-k*.06,r=.41-k*.105;b.put(leaf,k%2?'oldgold':'gold',[Math.sin(a)*r,yy,Math.cos(a)*r],[.22,.23,.25],[0,a,Math.PI]);}}
   b.ball(0,.98,0,.085,.12,.085,'oldgold');b.ball(0,-1.035,0,.032,.055,.032,'gold');
  },s);
  const top=y+1.09*s;
  for(let yy=top;yy<ceiling;yy+=.065){b.put(link,'oldgold',[x,yy,z],[1,1,1],[0,Math.round((yy-top)/.065)%2*Math.PI/2,0]);stats.chainLinks++;}
  const light=new T.PointLight(0xffb35c,20*s,7.5*s,2);light.position.set(x,y,z);return light;
 }
 return{lantern,stats};
}
