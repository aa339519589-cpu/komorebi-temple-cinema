import {T,V,mix,Builder,gridGeometry} from './kernel.js';
import {buildHallEntry} from './hall-entry.js';
import {buildTurnedSorin} from './sorin-solids.js';
import {buildVerandaBoards} from './veranda-boards.js';
import {buildVerandaRail} from './veranda-rail117.js';
import {layout} from './layout117.js';
import {createHallCarpentry141} from './hall-carpentry141.js';
import {buildVerandaCarvings143} from './veranda-carvings143.js';
export function buildArchitecture(mats){
 // The exposed tower finial must use the outdoor sky environment rather
 // than the close veranda probe later assigned to the shared gold material.
 mats.sorinGold=mats.gold.clone();mats.sorinGold.name='scene02-exposed-sorin-gold';mats.sorinGold.color.set('#cfab60');mats.sorinGold.roughness=.34;mats.sorinGold.metalness=.94;mats.sorinGold.envMap=null;
 mats.sorinBronze=mats.oldgold.clone();mats.sorinBronze.name='scene02-exposed-sorin-bronze';mats.sorinBronze.color.set('#a47d3d');mats.sorinBronze.roughness=.42;mats.sorinBronze.envMap=null;
 const b=new Builder(mats),lights=[];let sorinStats=null;const torus=new T.TorusGeometry(1,.075,6,20);
 const hallCarpentry=createHallCarpentry141({b,mats});
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
 // A square pagoda roof meets at one central peak, with four true hips.
 // The old long-ridge sampler made every tier read as a shallow rectangular shelf.
 function pagodaRoof(w,eave,rise=1.4,curl=.52){
  const h=w/2,P=(side,t,u)=>{let x,z;if(side<2){x=u*h*t;z=(side===0?1:-1)*h*t;}else{x=(side===2?1:-1)*h*t;z=u*h*t;}return[x,eave+rise*Math.pow(Math.max(0,1-t),1.46)+curl*Math.pow(t,7)*(.18+.82*Math.pow(Math.abs(u),8)),z];};
  for(let side=0;side<4;side++){
   const g=gridGeometry(Array.from({length:25},(_,j)=>Array.from({length:49},(_,i)=>P(side,.002+.998*j/24,-1+2*i/48))));
   const ids=g.index.array;let ny=0;for(let k=0;k<g.attributes.normal.count;k++)ny+=g.attributes.normal.getY(k);if(ny<0){for(let k=0;k<ids.length;k+=3)[ids[k+1],ids[k+2]]=[ids[k+2],ids[k+1]];g.computeVertexNormals();}b.put(g,'slate');
   const under=g.clone();under.translate(0,-.16,0);const ui=under.index.array;for(let k=0;k<ui.length;k+=3)[ui[k+1],ui[k+2]]=[ui[k+2],ui[k+1]];under.computeVertexNormals();b.put(under,'darkwood');
   const count=Math.ceil(w/.18);for(let i=0;i<=count;i++){const u=-1+2*i/count;for(let j=0;j<12;j++){const a=P(side,.04+.96*j/12,u),c=P(side,.04+.96*(j+1)/12,u);a[1]+=.035;c[1]+=.035;b.line(a,c,.043,'slate');}const end=P(side,1,u);roofEnd([end[0],end[1]+.025,end[2]],side<2?side*Math.PI:(side===2?Math.PI/2:-Math.PI/2));
    for(let j=0;j<7;j++){const a=P(side,.42+.58*j/7,u),c=P(side,.42+.58*(j+1)/7,u);a[1]-=.25;c[1]-=.25;b.line(a,c,.066,'cedar',true,.085);}}
   const edge=Array.from({length:33},(_,j)=>P(side,1,-1+2*j/32));b.tube(edge.map(p=>[p[0],p[1]-.13,p[2]]),.10,'darkwood',40);b.tube(edge.map(p=>[p[0],p[1]-.24,p[2]]),.028,'oldgold',40);
   if(side<2)for(let sign of[-1,1])b.tube(Array.from({length:29},(_,j)=>{const p=P(side,.025+.995*j/28,sign);p[1]+=.07;return p;}),.075,'slate',40);
  }
  b.cyl(0,eave+rise+.055,0,.20,.11,'slate');
 }
 function gableRoof(w,d,eave,rise,zcenter){const hw=w/2;const P=(s,t,z)=>[s*hw*t,eave+rise*Math.pow(1-t,1.28)+.38*Math.pow(t,8),zcenter+z];
  for(let s of[-1,1]){let rows=Array.from({length:25},(_,j)=>Array.from({length:37},(_,i)=>P(s,i/36,-d/2+d*j/24)));let g=gridGeometry(rows);const m=mats.slate.clone();m.side=T.DoubleSide;b.put(g,m);const under=g.clone();under.translate(0,-.2,0);b.put(under,'darkwood');
   for(let k=0;k<=Math.ceil(d/.22);k++){let z=-d/2+d*k/Math.ceil(d/.22);for(let j=0;j<14;j++){let a=P(s,j/14,z),c=P(s,(j+1)/14,z);a[1]+=.055;c[1]+=.055;b.line(a,c,.055,'slate');}}
   // Wide carved bargeboards at the front face and timber rafters underneath.
   for(let z of[-d/2,d/2]){let pts=Array.from({length:40},(_,i)=>{let p=P(s,i/39,z);p[1]-=.04;return p;});b.tube(pts,.19,'cedar',48);b.tube(pts.map(p=>[p[0],p[1]+.06,p[2]+.10]),.055,'gold',48);}
   const x=s*hw;b.box(x,eave-.05,zcenter,.18,.35,d+.2,'darkwood');for(let k=0;k<Math.ceil(d/.22);k++)roofEnd([x,eave+.42,zcenter-d/2+k*.22],s*Math.PI/2);
  }
  b.box(0,eave+rise+.18,zcenter,.32,.32,d+.7,'slate');for(let z of[zcenter-d/2,zcenter+d/2]){b.tube([[0,eave+rise+.1,z],[0,eave+rise+.55,z+.14],[0,eave+rise+.8,z+.38]],.13,'slate');b.ball(0,eave+rise+.85,z+.38,.13,.16,.12,'oldgold');}
 }
 function windowPanel(x,y,z,w,h,pane='paper'){b.box(x,y,z,w,h,.16,'darkwood');b.box(x,y,z+.13,w-.13,h-.13,.03,pane);for(let j=0;j<=18;j++)b.box(x-w/2+w*j/18,y,z+.18,.019,h,.04,'cedar');for(let j=0;j<=22;j++)b.box(x,y-h/2+h*j/22,z+.19,w,.016,.035,'cedar');for(let xx of[-w/2,w/2])b.box(x+xx,y,z+.18,.065,h,.11,'red');}
 function rail(length,base=0,height=1.05){for(let y of[.28,.73,height])b.box(0,base+y,0,length,y===height?.16:.10,.15,'red');let n=Math.ceil(length/1.75);for(let k=0;k<=n;k++){const x=-length/2+length*k/n;b.box(x,base+.55,0,.18,1.1,.18,'red');b.cyl(x,base+1.13,0,.12,.10,'gold');b.ball(x,base+1.26,0,.095,.12,.095);}for(let k=0;k<n*3;k++)b.box(-length/2+length*(k+.5)/(n*3),base+.5,0,.045,.42,.045,'red');}
 // The main hall is a tall, occupied building raised over an articulated stone terrace.
 const hallBase=layout.hall.position[1],hallY=layout.hall.scale[1],hallX=layout.hall.scale[0],hallZ=layout.hall.scale[2],hallFloor=hallBase+2.2*hallY;
 columnXComp=1/hallX;columnZComp=1/hallZ;b.at(layout.hall.position,layout.hall.yaw,()=>{
  const foundationBottom=-hallBase/hallY,foundationTop=1.9;
  b.box(0,(foundationBottom+foundationTop)/2,-.8,18.4,foundationTop-foundationBottom,13.5,'stone');for(let row=0;row<11;row++){const yy=foundationBottom+.25+row*.50;for(let j=0;j<17;j++){let x=-8.8+j*1.1+(row%2)*.5;b.box(x,yy,6.02,1.075,.475,.13,'stone',0,.82+.22*(.5+.5*Math.sin(j*9+row*4)));}for(let j=0;j<12;j++)b.box(9.24,yy,-7.1+j*1.1,.13,.475,1.075,'stone',0,.85+.18*Math.sin(j*6+row));}b.box(0,2.05,-.8,19,.32,13.8,'lightstone');
  for(let side of[-1,1])b.at([side*6.2,2.2,6.15],0,()=>rail(5.1));
  const axes=[-7.8,-5.2,-2.6,0,2.6,5.2,7.8];
  buildHallEntry({b,mats,lights,column,carpentry:hallCarpentry,fitting,rosette,scroll});
  // Lower hipped skirt carries dense parallel tile courses and exposed bracket tiers.
  b.at([0,0,(layout.hall.roofFront+layout.hall.roofBack)/2],Math.PI/2,()=>roof({w:layout.hall.roofFront-layout.hall.roofBack,d:layout.hall.roofWidth,eave:9.0,rise:6.2,curl:.7,ridgeOffset:layout.hall.gableCenterX}));
  // A small front gable is seated into one continuous steep hip roof.
  // Its lower edges sink into the tile plane rather than creating a second full eave.
  const {gableWidth:gW,gableEave:gE,gableRise:gR,gableFront:gF,gableCenterX:gX}=layout.hall;
  b.at([gX,0,0],0,()=>{
  gableRoof(gW,4.0,gE,gR,gF-2);
  const tri=new T.BufferGeometry();tri.setAttribute('position',new T.Float32BufferAttribute([-gW*.47,gE+.30,gF-.02,gW*.47,gE+.30,gF-.02,0,gE+gR-.18,gF-.02],3));tri.computeVertexNormals();const face=mats.darkwood.clone();face.side=T.DoubleSide;b.put(tri,face);
  for(let sign of[-1,1]){
   const points=Array.from({length:49},(_,i)=>{const t=i/48;return[sign*gW/2*t,gE+gR*Math.pow(1-t,1.28)+.38*Math.pow(t,8)-.13,gF+.10];});
   b.tube(points,.105,'oldgold',56);b.tube(points.map(p=>[p[0],p[1]+.065,p[2]+.03]),.028,'gold',56);
   for(let j=1;j<24;j++){const p=points[Math.round(j*48/25)];rosette(p[0],p[1]-.13,p[2]+.04,.095);}
   b.line([0,gE+gR-.8,gF+.03],[sign*gW*.35,gE+.55,gF+.03],.13,'cedar',true,.15);
  }
  b.box(0,gE+.90,gF+.01,gW*.74,.21,.22,'cedar');for(let x of[-gW*.16,0,gW*.16])b.box(x,gE+gR*.42,gF+.02,.18,gR*.39,.22,'cedar');
  for(let x=-gW*.30;x<gW*.31;x+=.55){b.put(scroll,'oldgold',[x,gE+.93,gF+.15],[.85,1.05,.8],[0,0,Math.round(x*2)%2?Math.PI:0]);rosette(x,gE+1.03,gF+.17,.07);}
  rosette(0,gE+gR*.63,gF+.14,.29);for(let sign of[-1,1])b.put(scroll,'oldgold',[sign*.45,gE+gR*.56,gF+.14],[1.4,1.5,.9],[0,0,sign<0?Math.PI:0]);
  // Open, cast botanical carving follows the gable's timber load path.
  // These are shallow solids and curls, with dark air between the branches.
  const reliefZ=gF+.205;
  for(const sign of[-1,1]){
   const vine=[];
   for(let j=0;j<=40;j++){
    const t=j/40,x=sign*gW*.425*t,y=gE+gR*Math.pow(1-t*.88,1.28)-.38;
    vine.push([x,y,reliefZ]);
   }
   b.tube(vine,.035,'gold',56);
   for(let j=1;j<18;j++){
    const t=j/19,x=sign*gW*.425*t,y=gE+gR*Math.pow(1-t*.88,1.28)-.38;
    const a=sign*(.72+.10*Math.sin(j*2.1)),f=.50+.20*Math.sin(j*.8)**2;
    b.put(scroll,j%3?'gold':'oldgold',[x-sign*.12,y-.13,reliefZ+.025],[f,f*.85,.60],[0,0,a]);
    for(const side of[-1,1])b.put(reliefLeaf,j%3?'oldgold':'gold',[x+side*.12,y-.14-side*.045,reliefZ+.035],[1.6,1.9,.8],[0,side*.10,side*.78+sign*.32]);
   }
  }
  for(const sign of[-1,1]){
   b.tube([[0,gE+1.12,reliefZ],[sign*gW*.10,gE+1.48,reliefZ+.025],[sign*gW*.20,gE+1.16,reliefZ],[sign*gW*.31,gE+1.42,reliefZ]],.030,'oldgold',40);
   for(let j=0;j<10;j++){
    const x=sign*(.4+j*gW*.027),y=gE+1.23+.13*Math.sin(j*.9);
    b.put(scroll,j%3?'oldgold':'gold',[x,y,reliefZ+.035],[.73,.70,.72],[0,0,j%2?.25:-.25]);
    b.put(reliefLeaf,'gold',[x,y+.10,reliefZ+.05],[1.4,1.6,.8],[0,.15,sign*.72]);
   }
  }
  rosette(0,gE+gR*.62,reliefZ+.04,.46);
  b.put(torus,'oldgold',[0,gE+gR*.62,reliefZ+.015],[.53,.53,.55]);
  for(let k=0;k<16;k++){
   const a=k*Math.PI/8;
   b.put(reliefLeaf,k%3?'gold':'oldgold',[Math.cos(a)*.63,gE+gR*.62+Math.sin(a)*.63,reliefZ+.05],[2.2,2.6,.8],[0,0,a-Math.PI/2]);
  }

  });
  hallCarpentry.frontEave(axes);
 },layout.hall.scale);columnXComp=columnZComp=1;
 // The photographed forecourt stair reaches the raised bridge approach.
 // Its plan is recovered independently of the hall column grid.
 const hallMatrix=new T.Matrix4().compose(V(layout.hall.position),new T.Quaternion().setFromAxisAngle(V([0,1,0]),layout.hall.yaw),V(layout.hall.scale));
 const stairTop=V([0,2.2,6.15]).applyMatrix4(hallMatrix),stairBottom=V([5.55722966,1.7,1.34483218]),stairDirection=stairTop.clone().sub(stairBottom),stairRun=Math.hypot(stairDirection.x,stairDirection.z),stairYaw=Math.atan2(stairDirection.x,stairDirection.z),stairWidth=2.85;
 for(let i=0;i<20;i++){const t=(i+.5)/20,p=stairBottom.clone().lerp(stairTop,t),top=T.MathUtils.lerp(stairBottom.y,stairTop.y,(i+1)/20);b.at([p.x,0,p.z],stairYaw,()=>{b.box(0,(top+1.35)/2,0,stairWidth,top-1.35,stairRun/20+.014,'stone');b.box(0,top-.025,0,stairWidth+.06,.05,stairRun/20,'lightstone');for(let side of[-1,1]){b.box(side*(stairWidth/2+.16),(top+1.64)/2,0,.25,top-1.10,stairRun/20+.015,'stone');b.box(side*(stairWidth/2+.16),top+.33,0,.31,.09,stairRun/20+.015,'lightstone');}});}
 // A shallow stone approach bears on a graded planted bank, not a tall
 // exposed retaining block across the pond.
 b.box(5.9,1.48,.55,5.4,.36,2.1,'stone');b.box(5.9,1.68,.55,5.5,.08,2.2,'lightstone');
 const bridgeApproachA=V([5.71,2.10,3.38]),bridgeApproachB=V([5.75,1.63,1.4]);b.line(bridgeApproachA.toArray(),bridgeApproachB.toArray(),2.30,'stone',true,.18);
 const bankRows=Array.from({length:25},(_,j)=>Array.from({length:33},(_,i)=>{const x=.3+i*11.9/32,z=-4.4+j*7.2/24,q=Math.max(Math.abs(x-5.9)/4.8,Math.abs(z+.8)/3.6);return[x,1.35*(1-T.MathUtils.smoothstep(q,.55,1))-.05,z];})),bank=gridGeometry(bankRows),bp=Array.from(bank.attributes.position.array),bi=Array.from(bank.index.array),ring=[];
 for(let i=0;i<33;i++)ring.push(i);for(let j=1;j<25;j++)ring.push(j*33+32);for(let i=31;i>=0;i--)ring.push(24*33+i);for(let j=23;j>0;j--)ring.push(j*33);
 const lower=ring.map(i=>{const n=bp.length/3;bp.push(bp[i*3],-.3,bp[i*3+2]);return n;}),bottom=bp.length/3;bp.push(5.9,-.3,1.2);
 for(let i=0;i<ring.length;i++){const n=(i+1)%ring.length;bi.push(ring[i],ring[n],lower[i],ring[n],lower[n],lower[i],bottom,lower[i],lower[n]);}
 const bankSolid=new T.BufferGeometry();bankSolid.setAttribute('position',new T.Float32BufferAttribute(bp,3));bankSolid.setIndex(bi);bankSolid.computeVertexNormals();b.put(bankSolid,'moss');bank.dispose();
 // Native photograph contours recover the opposite near-corner orientation
 // from the old positive yaw, and a shorter physical tier pitch.
 b.at(layout.pagoda.position,layout.pagoda.yaw,()=>{
  b.box(0,.30,0,7.6,.6,7.6,'stone');b.box(0,.65,0,8,.14,8,'lightstone');
  mats.pagodaPaper=mats.paper.clone();mats.pagodaPaper.name='scene02-pagoda-paper';mats.pagodaPaper.color.setHex(0x634125);mats.pagodaPaper.emissive.setHex(0xba641e);mats.pagodaPaper.emissiveIntensity=.70;
  for(let level=0;level<5;level++){
   const floor=.8+level*layout.pagoda.tierPitch,w=9.4-level*.45,body=w*.48,eave=floor+2.10;
   b.box(0,floor+.04,0,body+1.18,.24,body+1.18,'cedar');b.box(0,floor+.19,0,body+1.26,.075,body+1.26,'red');
   for(let side=0;side<4;side++)b.at([0,0,0],side*Math.PI/2,()=>{
    b.box(0,floor+.39,body/2-.10,body,.39,.16,'red');b.box(0,floor+1.58,body/2-.10,body,.28,.16,'darkwood');
    for(let x of[-.35,-.115,.115,.35]){if(level===0&&side===3&&Math.abs(x)<.2)continue;windowPanel(x*body,floor+1.02,body/2-.36,body*.205,.96,Math.abs(x)<.2?'pagodaPaper':'darkwood');}
    for(let yy of[floor+.43,floor+1.56])b.box(0,yy,body/2+.035,body,.19,.065,'lightstone');
    for(let x of[-.46,-.23,0,.23,.46]){column(x*body,body/2+.35,floor+.12,1.62,.13);bracket(x*body,floor+1.68,body/2+.35,.60);b.box(x*body,floor+2.18,body/2+.61,.18,.20,1.16,'cedar');}
    for(let y of[floor+1.86,floor+2.15])b.box(0,y,body/2+.35,body+1.05,.17,.31,'red');
    const front=body/2+.56,entry=level===0&&side===3,gap=1.86;for(let y of[floor+.38,floor+.69]){if(entry){const span=(body+1-gap)/2;for(let sign of[-1,1])b.box(sign*(gap/2+span/2),y,front,span,.075,.10,'red');}else b.box(0,y,front,body+1.0,.075,.10,'red');}
    for(let i=0;i<=8;i++){const x=-(body+1)/2+(body+1)*i/8;if(entry&&Math.abs(x)<gap/2)continue;b.box(x,floor+.48,front,.085,.55,.085,'red');b.box(x,floor+.77,front,.12,.055,.12,'oldgold');}
    for(let i=0;i<8;i++){const x=-(body+1)/2+(body+1)*(i+.5)/8;if(entry&&Math.abs(x)<gap/2+.3)continue;b.box(x,floor+.43,front-.025,(body+1)/8-.10,.12,.035,'lightstone');}
   });
   for(let x of[-body*.16,body*.16]){b.cyl(x,floor+1.16,0,.11,.09,'oldgold');b.put(b.sphere,'hallFlame',[x,floor+1.29,0],[.055,.095,.055]);}
   pagodaRoof(w,eave,1.40,.52);
  }
  // The solid finial moves with the recovered top roof seat. Its physical
  // annular plates and central spindle remain three-dimensional.
  b.at([0,layout.pagoda.sorinYOffset,0],0,()=>{sorinStats=buildTurnedSorin(b);});
 },layout.pagoda.scale);
 // Enclosing low galleries anchor the far pond edge and continue behind the main hall.
 function gallery(pos,length,yaw=0){b.at(pos,yaw,()=>{b.box(0,.35,0,length,.7,4.3,'stone');for(let x=-length/2+.6;x<length/2;x+=2){column(x,1.2,.7,3.6,.14);bracket(x,4.4,1.2,.55);windowPanel(x,2.35,-1.1,1.7,2.5);}b.box(0,4.35,1.2,length+.5,.28,.3,'red');roof({w:length+1.5,d:5.5,eave:4.8,rise:1.6,curl:.4});b.at([0,.7,1.6],0,()=>rail(length));});}
 gallery([-14,.65,-6],15);gallery([16,3.3,-11],12);gallery([-22,1.1,0],10,Math.PI/2);
 // One continuous cambered fascia rib on each side carries the plank deck.
 // Its lower edge stays visible between the arch feet, instead of being broken
 // up by repeated supports in the pond.
 b.at(layout.bridge.position,layout.bridge.yaw,()=>{const arch=x=>1.2+layout.bridge.archRise*(1-(x/7.5)**2)+layout.bridge.slope*x/7.5,archSlope=x=>-2*layout.bridge.archRise*x/56.25+layout.bridge.slope/7.5;
  for(let i=0;i<60;i++){let x=-7.5+15*(i+.5)/60,dy=archSlope(x);b.box(x,arch(x),0,.27,.22,2.9,'cedar',[0,0,Math.atan(dy)]);}
  const ribZ=[-1.20,1.20],ribStart=-7.5,ribEnd=7.5,ribSteps=96,ribDepth=.34;
  for(let z of ribZ){
   const side=new T.Shape(),topY=x=>arch(x)-.075,bottomY=x=>arch(x)-.57;
   side.moveTo(ribStart,topY(ribStart));
   for(let i=1;i<=ribSteps;i++){const x=ribStart+(ribEnd-ribStart)*i/ribSteps;side.lineTo(x,topY(x));}
   for(let i=ribSteps;i>=0;i--){const x=ribStart+(ribEnd-ribStart)*i/ribSteps;side.lineTo(x,bottomY(x));}
   side.closePath();const web=new T.ExtrudeGeometry(side,{depth:ribDepth,bevelEnabled:false,curveSegments:1});web.translate(0,0,z-ribDepth/2);b.put(web,'red');
   // Dark lower edging and diagonal braces meet the continuous rib at its face.
   const outerZ=Math.sign(z)*1.39;
   b.tube(Array.from({length:97},(_,i)=>{const x=ribStart+(ribEnd-ribStart)*i/96;return[x,bottomY(x)+.035,outerZ];}),.035,'cedar',192);
   for(let i=0;i<10;i++){const xa=-6.9+1.38*i,xb=xa+1.38,ya=bottomY(xa)+.06,yb=bottomY(xb)+.06,yt=arch((xa+xb)/2)-.14;if(i%2===0)b.line([xa,ya,outerZ],[xb,yt,outerZ],.047,'darkwood',true,.07);else b.line([xa,yt,outerZ],[xb,yb,outerZ],.047,'darkwood',true,.07);}
  }
  // Keep all three guard rails clear of the deck surface and tie them together
  // with posts that land just above the plank edge.
  for(let z of[-1.5,1.5]){
   for(const [h,r] of[[-.34,.085],[.25,.075],[.65,.09]])b.tube(Array.from({length:65},(_,i)=>{const x=-7.5+15*i/64;return[x,arch(x)+h,z];}),r,'red',128);
   for(let i=0;i<=10;i++){const x=-7.5+i*1.5,y=arch(x);b.box(x,y+.36,z,.22,.70,.22,'red');b.cyl(x,y+.73,z,.16,.10,'gold');b.ball(x,y+.87,z,.13,.14,.13);if(i%2===0)fitting(x,y-.06,z+.16,.38,.38);}
   for(let i=0;i<40;i++){const x=-7.3+i*.375;b.box(x,arch(x)+.34,z,.075,.37,.075,'red');}
  }
  const bridgeRock=new T.IcosahedronGeometry(1,2),bridgeRockPos=bridgeRock.attributes.position;
  for(let i=0;i<bridgeRockPos.count;i++){const x=bridgeRockPos.getX(i),y=bridgeRockPos.getY(i),z=bridgeRockPos.getZ(i),q=1+.10*Math.sin(x*7.1+y*5.7-z*8.3);bridgeRockPos.setXYZ(i,x*q,y*q,z*q);}bridgeRock.computeVertexNormals();
  // Broad masonry abutments support both ribs at the shore and sit inside
  // irregular waterline stones so the bridge reads as one supported span.
  for(const sign of[-1,1]){const x=sign*7.08,footTop=arch(x)-.47,footHeight=footTop+layout.bridge.position[1],footY=(footTop-layout.bridge.position[1])/2;
   const base=-layout.bridge.position[1]-.05,courses=Math.max(3,Math.ceil((footTop-base)/.28)),courseH=(footTop-base)/courses;
   for(let j=0;j<courses;j++)for(let k=0;k<5;k++){
    const dz=(k-2)*.69+(j%2?.10:-.04),tone=.72+.18*(.5+.5*Math.sin(j*9+k*13));
    b.box(x+.03*Math.sin(j*4+k),base+(j+.5)*courseH,dz,1.14+.10*Math.sin(k*3+j),courseH-.018,.71+.04*Math.sin(k+j),'stone',[0,.015*Math.sin(j*3+k),.006*Math.cos(j+k)],tone);
   }
   b.box(x,footTop-.025,0,1.24,.12,3.42,'lightstone');
   b.box(x-sign*.43,.08-layout.bridge.position[1],0,.66,.26,3.46,'stone');
   const rockOffsets=[[-.74,.13,-1.32,.72,.28,.54],[-.28,.17,.72,.64,.31,.61],[.56,.10,-.62,.82,.24,.70],[.82,.15,1.12,.73,.27,.58]];
   for(let i=0;i<rockOffsets.length;i++){const [dx,worldY,dz,sx,sy,sz]=rockOffsets[i];b.put(bridgeRock,'stone',[x+sign*dx,worldY-layout.bridge.position[1],dz],[sx,sy,sz],[.08*i,.21*i*sign,-.12*i],.88+.04*i);}
  }
 },layout.bridge.scale);
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
 return{group:b.finish(),lights,stats:{instances:b.count,buckets:b.buckets.size,sorin:sorinStats,hallCarpentry:hallCarpentry.stats,verandaCarvings:verandaCarvings.stats,verandaBoards,foregroundRail,layoutFit:{method:'fixed-camera native contour recovery',source:'tools/fit-layout02-117.py',visualAccepted:false}},deck};
}
