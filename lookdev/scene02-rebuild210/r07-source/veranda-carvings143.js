import {T,V} from './kernel.js';
import {createHangingLantern210} from './veranda-metal210.js';

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
 const fixture210=createHangingLantern210({b,mats});
 return{lantern:fixture210.lantern,stats:{...stats,fixture210:fixture210.stats}};
}
