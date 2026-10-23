import {T,V,mix,Builder,gridGeometry} from './kernel.js';
import {buildHallEntry} from './hall-entry.js';
import {buildTurnedSorin} from './sorin-solids.js';
import {buildVerandaBoards} from './veranda-boards.js';
import {buildVerandaRail} from './veranda-rail117.js';
import {layout} from './layout117.js';
import {createHallCarpentry141} from './hall-carpentry141.js';
import {buildVerandaCarvings143} from './veranda-carvings143.js';
import {installHallTerraceMaterials144,buildHallStair144} from './hall-terrace144.js';
import {buildBridge210,buildBridgeApproaches210} from './bridge-site210.js';
import {ensureBankSoil147} from './planted-shoulders147.js';
import {buildHallRoof154} from './hall-roof154.js';
import {buildPagodaEnsemble160} from './pagoda-ensemble160.js';
import {buildGalleryFooting162} from './gallery-footings162.js';
export function buildArchitecture(mats,scanned,sculpture186=null){
 installHallTerraceMaterials144(mats);ensureBankSoil147(mats);
 mats.bridgeRed161=mats.red.clone();mats.bridgeRed161.name='scene02-bridge-weathered-vermilion161';mats.bridgeRed161.color.setHex(0x8d3823);mats.bridgeRed161.clearcoat=.22;mats.bridgeRed161.clearcoatRoughness=.32;
 mats.bridgeCedar161=mats.cedar.clone();mats.bridgeCedar161.name='scene02-bridge-worn-tread-timber161';mats.bridgeCedar161.color.setHex(0x764124);mats.bridgeCedar161.clearcoat=.12;mats.bridgeCedar161.clearcoatRoughness=.38;
 // The exposed tower finial must use the outdoor sky environment rather
 // than the close veranda probe later assigned to the shared gold material.
 mats.sorinGold=mats.gold.clone();mats.sorinGold.name='scene02-exposed-sorin-gold';mats.sorinGold.color.set('#cfab60');mats.sorinGold.roughness=.34;mats.sorinGold.metalness=.94;mats.sorinGold.envMap=null;
 mats.sorinBronze=mats.oldgold.clone();mats.sorinBronze.name='scene02-exposed-sorin-bronze';mats.sorinBronze.color.set('#a47d3d');mats.sorinBronze.roughness=.42;mats.sorinBronze.envMap=null;
 mats.railRed170=mats.red.clone();mats.railRed170.name='scene02-veranda-rubbed-top-rail170';mats.railRed170.clearcoat=.22;mats.railRed170.clearcoatRoughness=.28;
 mats.sorinSeat170=mats.sorinBronze.clone();mats.sorinSeat170.name='scene02-roof-fitted-aged-bronze-boot-skirt170';mats.sorinSeat170.color.setHex(0xa47a39);mats.sorinSeat170.roughness=.48;mats.sorinSeat170.metalness=.78;
 const b=new Builder(mats),lights=[];let sorinStats=null,bridgeBearings=null,hallRoof=null,hallEntry186=null;const galleryFootings=[];const torus=new T.TorusGeometry(1,.075,6,20);
 const hallCarpentry=createHallCarpentry141({b,mats,sculpture186});
 function rosette(x,y,z,r=.2){for(let i=0;i<8;i++){let a=i*Math.PI/4;b.put(b.sphere,'gold',[x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.55,z],[r*.36,r*.18,r*.075],[0,0,a]);}b.ball(x,y,z+.02,r*.23,r*.23,r*.1);}
 function fitting(x,y,z,w,h){b.box(x,y,z,w,h,.035,'darkwood');for(let s of[-1,1]){b.box(x+s*w*.46,y,z+.025,w*.07,h,.025,'gold');b.box(x,y+s*h*.44,z+.025,w,h*.07,.025,'gold');}rosette(x,y,z+.04,Math.min(w,h)*.38);}
 const leafShape=new T.Shape();leafShape.moveTo(0,-.06);leafShape.bezierCurveTo(-.04,-.035,-.055,.025,0,.075);leafShape.bezierCurveTo(.045,.025,.035,-.025,0,-.06);const reliefLeaf=new T.ExtrudeGeometry(leafShape,{depth:.016,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:1,steps:1,curveSegments:4});
 let columnXComp=1,columnZComp=1;const closeCylinder=new T.CylinderGeometry(1,1,1,48);
 function column(x,z,base,h,r=.24,shaftMaterial='red'){
  const cy=(yy,rr,hh,ma)=>b.put(r>.4?closeCylinder:b.cylinderGeo,ma,[x,yy,z],[rr*columnXComp,hh,rr*columnZComp]);
  cy(base+.15,r*1.37,.30,'black');cy(base+.32,r*1.32,.07,'gold');cy(base+h/2+.3,r,h-.3,shaftMaterial);
  for(let y of[base+.4,base+h-.05]){cy(y,r*1.04,.12,'oldgold');for(let j=0;j<10;j++){let a=j*Math.PI/5;b.ball(x+Math.cos(a)*r,y,z+Math.sin(a)*r,r*.16,.09,r*.16,'gold');}}
  if(r>.4){cy(base+.72,r*1.015,.72,'oldgold');for(let yy of[base+.36,base+1.08])cy(yy,r*1.09,.055,'gold');for(let j=0;j<16;j++){let a=j*Math.PI/8,rad=r*1.03,pts=[];for(let k=0;k<20;k++){let t=k/19,aa=a+.10*Math.sin(t*6.28);pts.push([x+Math.cos(aa)*rad,base+.40+t*.63,z+Math.sin(aa)*rad]);}b.tube(pts,.010,'gold',24);for(let k=0;k<4;k++){let aa=a+.065*Math.sin(k*2);b.put(reliefLeaf,k%2?'oldgold':'gold',[x+Math.cos(aa)*r*1.04,base+.46+k*.15,z+Math.sin(aa)*r*1.04],[.65,.65,.65],[0,Math.PI/2-aa,(k%2?1:-1)*.6]);}}}
 }
 const armShape=new T.Shape();armShape.moveTo(-.5,0);armShape.lineTo(-.5,.14);armShape.quadraticCurveTo(-.35,.20,-.27,.11);armShape.lineTo(.27,.11);armShape.quadraticCurveTo(.35,.20,.5,.14);armShape.lineTo(.5,0);armShape.closePath();const bracketArm=new T.ExtrudeGeometry(armShape,{depth:1,bevelEnabled:false,curveSegments:6});bracketArm.translate(0,0,-.5);
 function bracket(x,y,z,s=1){b.at([x,y,z],0,()=>{
  b.box(0,-.04,0,.34,.22,.34,'darkwood');
  for(let k=0;k<5;k++){const yy=k*.20,span=.24+k*.13;b.put(bracketArm,k%2?'red':'cedar',[0,yy,0],[span*2,1,.22]);b.put(bracketArm,'cedar',[0,yy+.08,0],[span*2,1,.20],[0,Math.PI/2,0]);b.box(0,yy+.1,0,.27,.20,.27,'red');
   for(let q of[-1,1]){b.box(q*span*.85,yy+.18,0,.19,.19,.28,'cedar');b.box(0,yy+.25,q*span*.85,.27,.18,.17,'cedar');b.box(q*span*.85,yy+.18,.145,.11,.10,.018,'oldgold');}
  }
 },s);}
 const scroll=new T.TubeGeometry(new T.CatmullRomCurve3([[-.24,-.09,0],[-.31,.05,.018],[-.10,.14,.025],[.08,.02,.026],[.25,.13,.018],[.31,-.02,.015],[.09,-.1,.02]].map(V)),24,.022,6,false);
 const cap=new T.CylinderGeometry(.075,.075,.045,12);cap.rotateX(Math.PI/2);
 function roofEnd(p,yaw=0){b.put(cap,'tileEnd',p,[1,1,1],[0,yaw,0]);b.put(torus,'tileEnd',[p[0],p[1],p[2]+.026],[.043,.043,.043],[0,yaw,0]);}
 function roof({w,d,eave,rise,center=[0,0,0],curl=.65,inner=0,scale=1,ridgeOffset=0}){b.at(center,0,()=>{
  const hw=w/2,hd=d/2,ridge=w*.24;const P=(side,t,u)=>{let x,z,span=mix(ridge,hw,t);if(side%2===0){x=u*span;z=(side===0?1:-1)*hd*t;}else{x=(side===1?1:-1)*span;z=u*hd*t;}let y=eave+rise*Math.pow(Math.max(0,1-t),1.5)+curl*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),6));return[x,y,z+ridgeOffset*(1-t)];};
  for(let side=0;side<4;side++){
   const rows=Array.from({length:19},(_,j)=>Array.from({length:49},(_,i)=>P(side,mix(inner,1,j/18),-1+2*i/48)));
   const g=gridGeometry(rows);
   b.put(g,'slate');const under=g.clone();under.translate(0,-.17,0);b.put(under,'darkwood');
   const tiles=Math.ceil((side%2?d:w)/.23),segments=9;
   for(let i=0;i<=tiles;i++){const u=-1+2*i/tiles;for(let j=0;j<segments;j++){let a=P(side,mix(inner,1,j/segments),u),c=P(side,mix(inner,1,(j+1)/segments),u);a[1]+=.035;c[1]+=.035;b.line(a,c,.052,'slate',false,.052,null,.86+.22*(.5+.5*Math.sin(i*4.71+j*8.3)));}const e=P(side,1,u);roofEnd([e[0],e[1]+.03,e[2]+(side===0?.04:0)],side*Math.PI/2);for(let k=0;k<3;k++){const a=P(side,.56+k*.158,u),c=P(side,.56+(k+1)*.158,u);a[1]-=.29;c[1]-=.29;b.line(a,c,.11,'cedar',true,.14);}}
   for(let i=0;i<36;i++){let a=P(side,1,-1+2*i/36),c=P(side,1,-1+2*(i+1)/36);a[1]-=.19;c[1]-=.19;b.line(a,c,.18,'darkwood',true,.24);a[1]-=.16;c[1]-=.16;b.line(a,c,.055,'oldgold');}
   if(side<2)for(let sign of[-1,1])b.tube(Array.from({length:25},(_,j)=>{let p=P(side,mix(inner,1.045,j/24),sign);p[1]+=.1;return p;}),.09,'slate',36);
  }
  if(inner===0){b.box(0,eave+rise+.13,0,ridge*2+.4,.25,.35,'slate');for(let sign of[-1,1])b.tube([[sign*ridge,eave+rise+.12,0],[sign*(ridge+.3),eave+rise+.35,0],[sign*(ridge+.42),eave+rise+.7,0]],.12,'slate');}
 },scale);}
 function windowPanel(x,y,z,w,h,pane='paper'){b.box(x,y,z,w,h,.16,'darkwood');b.box(x,y,z+.13,w-.13,h-.13,.03,pane);for(let j=0;j<=18;j++)b.box(x-w/2+w*j/18,y,z+.18,.019,h,.04,'cedar');for(let j=0;j<=22;j++)b.box(x,y-h/2+h*j/22,z+.19,w,.016,.035,'cedar');for(let xx of[-w/2,w/2])b.box(x+xx,y,z+.18,.065,h,.11,'red');}
 function rail(length,base=0,height=1.05){for(let y of[.28,.73,height])b.box(0,base+y,0,length,y===height?.16:.10,.15,'red');let n=Math.ceil(length/1.75);for(let k=0;k<=n;k++){const x=-length/2+length*k/n;b.box(x,base+.55,0,.18,1.1,.18,'red');b.cyl(x,base+1.13,0,.12,.10,'gold');b.ball(x,base+1.26,0,.095,.12,.095);}for(let k=0;k<n*3;k++)b.box(-length/2+length*(k+.5)/(n*3),base+.5,0,.045,.42,.045,'red');}
 // The main hall is a tall, occupied building raised over an articulated stone terrace.
 const hallBase=layout.hall.position[1],hallY=layout.hall.scale[1],hallX=layout.hall.scale[0],hallZ=layout.hall.scale[2],hallFloor=hallBase+2.2*hallY;
 columnXComp=1/hallX;columnZComp=1/hallZ;b.at(layout.hall.position,layout.hall.yaw,()=>{
  const foundationBottom=-hallBase/hallY,foundationTop=1.9,hallCentre=layout.hall.bearingGrid.centre;
  b.box(hallCentre,(foundationBottom+foundationTop)/2,-.8,18.4,foundationTop-foundationBottom,13.5,'terraceBody');for(let row=0;row<11;row++){const yy=foundationBottom+.25+row*.50;for(let j=0;j<17;j++){let x=hallCentre-8.8+j*1.1+(row%2)*.5;b.box(x,yy,6.02,1.075,.475,.13,'terraceBody',0,.82+.22*(.5+.5*Math.sin(j*9+row*4)));}for(let j=0;j<12;j++)b.box(hallCentre+9.24,yy,-7.1+j*1.1,.13,.475,1.075,'terraceBody',0,.85+.18*Math.sin(j*6+row));}b.box(hallCentre,2.05,-.8,19,.32,13.8,'terraceTread');
  for(const [a,c]of[[layout.hall.bearingGrid.axes[0]-.5,-2.65],[2.65,layout.hall.bearingGrid.axes.at(-1)+.5]])b.at([(a+c)/2,2.2,6.15],0,()=>rail(c-a));
  const axes=layout.hall.bearingGrid.axes;
  hallEntry186=buildHallEntry({b,mats,lights,column,carpentry:hallCarpentry,fitting,rosette,scroll,frame:layout.hall.bearingGrid});
  // The roof, gable and lower hip aprons share one bearing-centred ridge.
  hallRoof=buildHallRoof154({b,mats,roof:layout.hall});
  hallCarpentry.gable(layout.hall);
  hallCarpentry.frontEave(axes,layout.hall);
 },layout.hall.scale);columnXComp=columnZComp=1;
 // The photographed forecourt stair reaches the raised bridge approach.
 // Its plan is recovered independently of the hall column grid.
 const hallMatrix=new T.Matrix4().compose(V(layout.hall.position),new T.Quaternion().setFromAxisAngle(V([0,1,0]),layout.hall.yaw),V(layout.hall.scale));
 const stairTop=V([0,2.2,6.15]).applyMatrix4(hallMatrix),stairBottom=V([5.55722966,1.7,1.34483218]),stairDirection=stairTop.clone().sub(stairBottom),stairRun=Math.hypot(stairDirection.x,stairDirection.z),stairYaw=Math.atan2(stairDirection.x,stairDirection.z),stairWidth=2.85;
 const hallStair=buildHallStair144({b,top:stairTop,bottom:stairBottom,width:stairWidth});
 const bridgeApproaches210=buildBridgeApproaches210({b,stairTop,stairBottom,stairWidth});
 const bankRows=Array.from({length:25},(_,j)=>Array.from({length:33},(_,i)=>{const x=.3+i*11.9/32,z=-4.4+j*7.2/24,q=Math.max(Math.abs(x-5.9)/4.8,Math.abs(z+.8)/3.6);return[x,1.35*(1-T.MathUtils.smoothstep(q,.55,1))-.05,z];})),bank=gridGeometry(bankRows),bp=Array.from(bank.attributes.position.array),bi=Array.from(bank.index.array),ring=[];
 for(let i=0;i<33;i++)ring.push(i);for(let j=1;j<25;j++)ring.push(j*33+32);for(let i=31;i>=0;i--)ring.push(24*33+i);for(let j=23;j>0;j--)ring.push(j*33);
 const lower=ring.map(i=>{const n=bp.length/3;bp.push(bp[i*3],-.3,bp[i*3+2]);return n;}),bottom=bp.length/3;bp.push(5.9,-.3,1.2);
 for(let i=0;i<ring.length;i++){const n=(i+1)%ring.length;bi.push(ring[i],ring[n],lower[i],ring[n],lower[n],lower[i],bottom,lower[i],lower[n]);}
 const bankSolid=new T.BufferGeometry();bankSolid.setAttribute('position',new T.Float32BufferAttribute(bp,3));bankSolid.setIndex(bi);bankSolid.computeVertexNormals();b.put(bankSolid,'bankSoil147');bank.dispose();
 // Five deep occupied storeys and the roof/column bracket cage share the
 // photographed tower envelope; all tiled shells and fascia have real thickness.
 const pagodaEnsemble=buildPagodaEnsemble160({b,mats,column,carpentry:hallCarpentry});sorinStats=pagodaEnsemble.sorin;
 // Enclosing low galleries anchor the far pond edge and continue behind the main hall.
 function gallery(pos,length,yaw=0,wing=false){b.at(pos,yaw,()=>{galleryFootings.push(buildGalleryFooting162({b,position:pos,length}));for(let x=-length/2+.6;x<length/2;x+=2){column(x,1.2,.7,3.6,.14);if(wing)hallCarpentry.head(x,4.0,1.2,.39,'side');else bracket(x,4.4,1.2,.55);windowPanel(x,2.35,-1.1,1.7,2.5,wing?'hallPlaster':'paper');}b.box(0,4.35,1.2,length+.5,.28,.3,'red');roof({w:length+1.5,d:5.5,eave:4.8,rise:1.6,curl:.4});b.at([0,.7,1.6],0,()=>rail(length));});}
 gallery([-14,.65,-6],15);gallery([16,3.3,-11],12,0,true);gallery([-22,1.1,0],10,Math.PI/2);
 // Layered load-bearing bridge with slender stone piers and connected approaches.
 bridgeBearings=buildBridge210({b,mats,fitting});
 // Foreground veranda is constructed at human scale around the low camera.
 const deck={x:15.5,y:1.35,z:25};
 const verandaBoards=buildVerandaBoards(T,b);
 const canopy=layout.canopy,edgeX=z=>canopy.entryWorld[0]+(z-canopy.entryWorld[2])*(canopy.farWorld[0]-canopy.entryWorld[0])/(canopy.farWorld[2]-canopy.entryWorld[2]);
 const verandaCarvings=buildVerandaCarvings143({b,mats,canopy});
 for(let z of[2,10,18,26,34,40]){column(canopy.columnX,z,1.36,7.6,.48,'verandaRed');bracket(canopy.columnX,8.7,z,1.35);}
 for(let z of[2,10,18,26,34,40]){const outside=edgeX(z),span=20.5-outside;b.box(outside+span/2,9.0,z,span,.45,.52,'cedar');for(let x=outside+.6;x<20;x+=.9)fitting(x,9.0,z+.28,.34,.34);}
 // Closed deck strips and real rafter ends follow the measured outer envelope.
 // The former short horizontal fascia is replaced by one continuing canopy.
 for(let z=-2;z<41;z+=.46){const outside=edgeX(z),span=20.5-outside;b.box(outside+span/2,9.62,z,span,.28,.465,'darkwood');b.box(outside+span/2,9.30,z,span,.44,.22,'cedar');b.box(outside+.07,9.30,z,.14,.44,.26,'darkwood');}
 b.line([20.35,9.08,-2],[20.35,9.08,41],.38,'red',true,.45);
 const foregroundRail=buildVerandaRail(T,b);
 // Faceted bronze lamps have actual perforated cast panels and warm paper
 // recessed behind them. Each link joins the fixture to the beam overhead.
 for(const lamp of layout.hangingLamps)lights.push(verandaCarvings.lantern(...lamp.position,lamp.scale,9.3));lights.push(verandaCarvings.lantern(18,7.8,7,.5,9.3));
 return{group:b.finish(),lights,stats:{instances:b.count,buckets:b.buckets.size,sorin:sorinStats,pagodaEnsemble,galleryFootings,bridgeBearings,bridgeApproaches210,hallRoof,hallCarpentry:hallCarpentry.stats,hallEntry186,hallStair,verandaCarvings:verandaCarvings.stats,verandaBoards,foregroundRail,layoutFit:{method:'joint fixed-contact perspective and common five-bay roof/bearing-grid recovery',source:'qa/ten-reference/02/iteration-scene02-coupled-hall-fit-19-20261021/fit-common-architecture.py',visualAccepted:false}},deck};
}
