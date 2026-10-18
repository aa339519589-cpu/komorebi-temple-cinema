import {T,V,mix,Builder,gridGeometry} from './kernel.js';
export function buildArchitecture(mats){
 const b=new Builder(mats),lights=[];const torus=new T.TorusGeometry(1,.075,6,20);
 function rosette(x,y,z,r=.2){for(let i=0;i<8;i++){let a=i*Math.PI/4;b.put(b.sphere,'gold',[x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.55,z],[r*.36,r*.18,r*.075],[0,0,a]);}b.ball(x,y,z+.02,r*.23,r*.23,r*.1);}
 function fitting(x,y,z,w,h){b.box(x,y,z,w,h,.035,'darkwood');for(let s of[-1,1]){b.box(x+s*w*.46,y,z+.025,w*.07,h,.025,'gold');b.box(x,y+s*h*.44,z+.025,w,h*.07,.025,'gold');}rosette(x,y,z+.04,Math.min(w,h)*.38);}
 const closeCylinder=new T.CylinderGeometry(1,1,1,48);
 function column(x,z,base,h,r=.24){
  const cy=(yy,rr,hh,ma)=>r>.4?b.put(closeCylinder,ma,[x,yy,z],[rr,hh,rr]):b.cyl(x,yy,z,rr,hh,ma);
  cy(base+.15,r*1.37,.30,'black');cy(base+.32,r*1.32,.07,'gold');cy(base+h/2+.3,r,h-.3,'red');
  for(let y of[base+.4,base+h-.05]){cy(y,r*1.04,.12,'oldgold');for(let j=0;j<10;j++){let a=j*Math.PI/5;b.ball(x+Math.cos(a)*r,y,z+Math.sin(a)*r,r*.16,.09,r*.16,'gold');}}
  if(r>.4){cy(base+.72,r*1.015,.72,'oldgold');for(let yy of[base+.36,base+1.08])cy(yy,r*1.09,.055,'gold');for(let j=0;j<16;j++){let a=j*Math.PI/8,rad=r*1.03,pts=[];for(let k=0;k<20;k++){let t=k/19,aa=a+.10*Math.sin(t*6.28);pts.push([x+Math.cos(aa)*rad,base+.40+t*.63,z+Math.sin(aa)*rad]);}b.tube(pts,.010,'gold',24);for(let k=0;k<4;k++){let aa=a+.065*Math.sin(k*2);b.ball(x+Math.cos(aa)*r*1.05,base+.46+k*.15,z+Math.sin(aa)*r*1.05,.018,.032,.018,'gold');}}}
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
 function roof({w,d,eave,rise,center=[0,0,0],curl=.65,inner=0,scale=1}){b.at(center,0,()=>{
  const hw=w/2,hd=d/2,ridge=w*.24;const P=(side,t,u)=>{let x,z,span=mix(ridge,hw,t);if(side%2===0){x=u*span;z=(side===0?1:-1)*hd*t;}else{x=(side===1?1:-1)*span;z=u*hd*t;}let y=eave+rise*Math.pow(Math.max(0,1-t),1.5)+curl*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),6));return[x,y,z];};
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
 function gableRoof(w,d,eave,rise,zcenter){const hw=w/2;const P=(s,t,z)=>[s*hw*t,eave+rise*Math.pow(1-t,1.28)+.38*Math.pow(t,8),zcenter+z];
  for(let s of[-1,1]){let rows=Array.from({length:25},(_,j)=>Array.from({length:37},(_,i)=>P(s,i/36,-d/2+d*j/24)));let g=gridGeometry(rows);const m=mats.slate.clone();m.side=T.DoubleSide;b.put(g,m);const under=g.clone();under.translate(0,-.2,0);b.put(under,'darkwood');
   for(let k=0;k<=Math.ceil(d/.22);k++){let z=-d/2+d*k/Math.ceil(d/.22);for(let j=0;j<14;j++){let a=P(s,j/14,z),c=P(s,(j+1)/14,z);a[1]+=.055;c[1]+=.055;b.line(a,c,.055,'slate');}}
   // Wide carved bargeboards at the front face and timber rafters underneath.
   for(let z of[-d/2,d/2]){let pts=Array.from({length:40},(_,i)=>{let p=P(s,i/39,z);p[1]-=.04;return p;});b.tube(pts,.19,'cedar',48);b.tube(pts.map(p=>[p[0],p[1]+.06,p[2]+.10]),.055,'gold',48);}
   const x=s*hw;b.box(x,eave-.05,zcenter,.18,.35,d+.2,'darkwood');for(let k=0;k<Math.ceil(d/.22);k++)roofEnd([x,eave+.42,zcenter-d/2+k*.22],s*Math.PI/2);
  }
  b.box(0,eave+rise+.18,zcenter,.32,.32,d+.7,'slate');for(let z of[zcenter-d/2,zcenter+d/2]){b.tube([[0,eave+rise+.1,z],[0,eave+rise+.55,z+.14],[0,eave+rise+.8,z+.38]],.13,'slate');b.ball(0,eave+rise+.85,z+.38,.13,.16,.12,'oldgold');}
 }
 function windowPanel(x,y,z,w,h){b.box(x,y,z,w,h,.16,'darkwood');b.box(x,y,z+.13,w-.13,h-.13,.03,'paper');for(let j=0;j<=18;j++)b.box(x-w/2+w*j/18,y,z+.18,.019,h,.04,'cedar');for(let j=0;j<=22;j++)b.box(x,y-h/2+h*j/22,z+.19,w,.016,.035,'cedar');for(let xx of[-w/2,w/2])b.box(x+xx,y,z+.18,.065,h,.11,'red');}
 function rail(length,base=0,height=1.05){for(let y of[.28,.73,height])b.box(0,base+y,0,length,y===height?.16:.10,.15,'red');let n=Math.ceil(length/1.75);for(let k=0;k<=n;k++){const x=-length/2+length*k/n;b.box(x,base+.55,0,.18,1.1,.18,'red');b.cyl(x,base+1.13,0,.12,.10,'gold');b.ball(x,base+1.26,0,.095,.12,.095);}for(let k=0;k<n*3;k++)b.box(-length/2+length*(k+.5)/(n*3),base+.5,0,.045,.42,.045,'red');}
 // The main hall is a tall, occupied building raised over an articulated stone terrace.
 b.at([4,1.2,-10],0,()=>{
  b.box(0,.298,-.8,18.4,3.204,13.5,'stone');b.box(0,2.05,-.8,19,.32,13.8,'lightstone');
  for(let i=0;i<24;i++){let y=(24-i)*3.224/24,z=6.15+i*.27;b.box(0,(y/2-1.2)/.92,z,5.7,y/.92,.28,'stone',0,.90+.10*Math.sin(i));b.box(0,(y-.027-1.2)/.92,z+.1,5.85,.055,.10,'lightstone');}
  for(let s of[-1,1]){b.line([s*3.1,3.2,6.0],[s*3.1,-.2174,12.7],.12,'red');for(let i=0;i<10;i++){let t=i/9;column(s*3.1,mix(6,12.7,t),(3.224*(1-t)-1.2)/.92,.9,.07);}b.at([s*6.2,2.2,6.15],0,()=>rail(5.1));}
  const axes=[-7.8,-5.2,-2.6,0,2.6,5.2,7.8];for(let z of[4.7,-.8,-6.3])for(let x of axes){if((z===-.8&&Math.abs(x)<7)||(z===4.7&&x===0))continue;column(x,z,2.2,6.1,.27);bracket(x,8.28,z,.92);}
  for(let z of[4.7,-6.3]){b.box(0,8.15,z,16.8,.42,.5,'red');b.box(0,8.65,z,18.6,.3,.55,'cedar');for(let x of axes)fitting(x,8.15,z+.27,.55,.31);}
  for(let x of[-7.8,7.8])b.box(x,8.15,-.8,.45,.42,11.5,'red');
  b.box(0,5.05,-5.9,15.8,5.7,.25,'red');for(let x of[-6.45,-3.9,-1.3,1.3,3.9,6.45])windowPanel(x,4.85,-5.7,2.25,4.4);
  for(let x of[-6.5,6.5])windowPanel(x,4.8,3.7,2.2,4.5); // large central opening remains real, with deep lit interior
  for(let x of[-7.8,7.8])for(let z of[-4.5,-1.8,1.0]){b.at([x,0,z],Math.PI/2,()=>windowPanel(0,4.8,0,2.2,4.5));}
  for(let x of[-2.7,2.7]){b.box(x,4.9,4.25,.32,5.3,.5,'red');for(let j=0;j<12;j++)fitting(x,2.55+j*.42,4.52,.29,.29);}
  b.box(0,7.65,4.3,5.8,.55,.6,'red');for(let i=-5;i<=5;i++){b.put(scroll,'oldgold',[i*.48,7.65,4.65],[.68,.68,.68],[0,0,i%2?Math.PI:0]);rosette(i*.48,7.65,4.67,.065);}
  // Lower hipped skirt carries dense parallel tile courses and exposed bracket tiers.
  roof({w:22.8,d:16,eave:9.0,rise:3.4,center:[0,0,-.8],curl:.7,inner:.36});
  // A broad blue tiled hipped roof encloses the volume. A small carved gable
  // is seated within its front slope rather than replacing the whole roof with a wall.
  b.at([0,0,-1.0],Math.PI/2,()=>roof({w:14.6,d:21.7,eave:10.65,rise:5.65,curl:.68}));
  const tri=new T.BufferGeometry();tri.setAttribute('position',new T.Float32BufferAttribute([-4.65,11.25,5.45,4.65,11.25,5.45,0,15.05,5.45],3));tri.computeVertexNormals();const face=mats.darkwood.clone();face.side=T.DoubleSide;b.put(tri,face);
  gableRoof(10.2,4.9,11.15,4.25,3.0);
  for(let s of[-1,1]){
   const points=Array.from({length:40},(_,i)=>{let t=i/39;return[s*5.1*t,11.15+4.25*Math.pow(1-t,1.28)+.38*Math.pow(t,8)-.15,5.59];});
   b.tube(points,.10,'oldgold',48);b.tube(points.map(p=>[p[0],p[1]+.08,p[2]+.03]),.034,'gold',48);
   for(let j=0;j<21;j++){const p=points[Math.round((j+.5)*39/21)];rosette(p[0],p[1]-.18,p[2]+.04,.11);}
  }
  // Deep timber trusses hold smaller nested cloud carvings in the gable recess.
  b.box(0,12.05,5.52,6.7,.16,.20,'cedar');for(let x of[-1.75,1.75])b.box(x,12.78,5.53,.15,2.6,.20,'cedar');
  for(let row=0;row<4;row++){const yy=11.65+row*.72,half=3.5-row*.76;for(let x=-half+.2;x<half;x+=.52){b.put(scroll,'oldgold',[x,yy,5.62],[.75,.85,.8],[0,0,(row+Math.round(x*2))%2?Math.PI:0]);rosette(x,yy+.12,5.65,.055);}}
  rosette(0,13.72,5.62,.23);b.cyl(0,12.25,5.59,.055,1.3,'gold');b.box(0,11.35,5.48,9.6,.17,.25,'cedar');
  // Closely spaced multi-tier bracket clusters cast real shadows under the deep eave.
  for(let x=-9.2;x<=9.21;x+=.66){bracket(x,7.95,6.0,.90);b.box(x,9.26,6.45,.17,.17,1.58,'cedar');fitting(x,8.64,6.48,.16,.22);}
  for(let z=-6.2;z<6.3;z+=.72)for(let x of[-8.55,8.55]){bracket(x,7.95,z,.87);b.box(x,9.22,z,1.3,.16,.16,'cedar');}
  for(let s of[-1,1]){const light=new T.PointLight(0xffae49,45,12,2);light.position.set(4+s*2.2,6.26,-10.5);lights.push(light);}
  // Golden altar, vase and central statue silhouette seen through the four-column entry.
  b.box(0,2.75,-3.7,3.5,.85,1.3,'oldgold');b.box(0,3.22,-3.7,3.75,.13,1.5,'gold');b.ball(0,4.4,-3.7,.62,.93,.40,'gold');b.ball(0,5.4,-3.7,.36,.43,.32,'gold');b.ball(0,5.83,-3.7,.20,.18,.20,'oldgold');b.ball(0,3.7,-3.3,.9,.22,.5,'gold');
 },[1,.92,1]);
 // Five-storey pagoda, wider eaves alternating with open galleries, prominent ringed sorin.
 b.at([-15,.6,-16],0,()=>{
  b.box(0,.3,0,7.6,.6,7.6,'stone');b.box(0,.65,0,8,.14,8,'lightstone');
  for(let level=0;level<5;level++){let floor=.8+level*3.45,w=9.4-level*.45,body=w*.56,eave=floor+2.6;
   b.box(0,floor,0,body+.6,.2,body+.6,'cedar');
   for(let side=0;side<4;side++)b.at([0,0,0],side*Math.PI/2,()=>{b.box(0,floor+1.25,-body/2,body,2.45,.15,'darkwood');for(let x of[-body*.36,0,body*.36]){windowPanel(x,floor+1.35,body/2-.1,body*.25,1.35);column(x,body/2+.15,floor,2.2,.12);bracket(x,eave-.35,body/2+.15,.5);}b.at([0,floor,body/2+.38],0,()=>rail(body+.6,0,.63));b.box(0,eave-.17,body/2,body+.9,.24,.35,'red');});
   roof({w,d:w,eave,rise:1.05,curl:.55});
  }
  const base=18.25; b.cyl(0,base+2.8,0,.055,5.6,'gold');for(let j=0;j<19;j++){let r=.48-j*.012;b.put(torus,'gold',[0,base+.3+j*.255,0],[r,r,r],[Math.PI/2,0,0]);}b.ball(0,23.65,0,.17,.24,.17);b.cyl(0,24.2,0,.025,.7,'gold');
 },1.1);
 // Enclosing low galleries anchor the far pond edge and continue behind the main hall.
 function gallery(pos,length,yaw=0){b.at(pos,yaw,()=>{b.box(0,.35,0,length,.7,4.3,'stone');for(let x=-length/2+.6;x<length/2;x+=2){column(x,1.2,.7,3.6,.14);bracket(x,4.4,1.2,.55);windowPanel(x,2.35,-1.1,1.7,2.5);}b.box(0,4.35,1.2,length+.5,.28,.3,'red');roof({w:length+1.5,d:5.5,eave:4.8,rise:1.6,curl:.4});b.at([0,.7,1.6],0,()=>rail(length));});}
 gallery([-14,0,-6],15);gallery([16,1,-11],12);gallery([-22,0,0],10,Math.PI/2);
 // Curved bridge carries actual curved deck strips, balusters, gilded caps and stone piers.
 b.at([1,0,5],0,()=>{const arch=x=>1.2+1.8*(1-(x/7.5)**2);for(let i=0;i<60;i++){let x=-7.5+15*(i+.5)/60,dy=-3.6*x/56.25;b.box(x,arch(x),0,.27,.22,2.9,'cedar',[0,0,Math.atan(dy)]);}
  for(let z of[-1.5,1.5]){for(let i=0;i<50;i++){let x=-7.5+15*i/50,xx=-7.5+15*(i+1)/50;for(let h of[-.16,.35,.85])b.line([x,arch(x)+h,z],[xx,arch(xx)+h,z],h<0?.40:.12,'red',true,h<0?.35:.14);}
   for(let i=0;i<=10;i++){let x=-7.5+i*1.5,y=arch(x);b.box(x,y+.48,z,.22,1.05,.22,'red');b.cyl(x,y+1.03,z,.16,.12,'gold');b.ball(x,y+1.18,z,.13,.17,.13);if(i%2===0)fitting(x,y-.06,z+.16,.38,.38);}
   for(let i=0;i<40;i++){let x=-7.3+i*.375;b.box(x,arch(x)+.46,z,.075,.49,.075,'red');}
  }for(let x of[-5.3,0,5.3])for(let z of[-.9,.9]){let support=arch(x)-.3;b.cyl(x,support/2,z,.34,support,'stone');b.box(x,support+.06,z,.75,.18,.75,'lightstone');}
 });
 // Foreground veranda is constructed at human scale around the low camera.
 const deck={x:15.5,y:1.35,z:25};
 for(let i=0;i<25;i++){let x=14.42+i*.235;b.box(x,1.27,24,.228,.16,30,'floor',0,.85+.2*(.5+.5*Math.sin(i*5.7)));for(let z of[12,20,28,36]){b.cyl(x,1.355,z,.013,.007,'black');}}
 for(let z of[10,18,26,34,40]){column(16.0,z,1.36,7.6,.48);bracket(16.0,8.7,z,1.35);} // substantial vermilion column is cropped at the far right
 for(let z of[10,18,26,34,40]){b.box(15.6,9.0,z,8.7,.45,.52,'cedar');for(let x=12.3;x<20;x+=.9)fitting(x,9.0,z+.28,.34,.34);}
 b.box(16,9.62,25,9.8,.28,33,'darkwood');
 const flare=z=>{let t=Math.max(0,Math.min(1,(z-11)/8));return t*t*(3-2*t);};for(let z=8.5;z<41;z+=.46){let t=flare(z);b.box(16,9.42,z,10.8+2.2*t,.30,.22,'cedar');b.box(10.73-1.1*t,9.42,z,.13,.31,.26,'darkwood');}
 for(let j=0;j<36;j++){let z=8+j*34/36,zz=8+(j+1)*34/36;b.line([11.1-1.1*flare(z),9.08,z],[11.1-1.1*flare(zz),9.08,zz],.38,'red',true,.45);}b.box(19.6,9.08,25,.38,.45,34,'red');
 // Open lacquered balustrade: fine gilt castings sit between rounded red rails.
 const finial=new T.LatheGeometry([[0,0],[.085,0],[.10,.03],[.075,.06],[.065,.11],[.12,.15],[.10,.19],[.055,.22],[.04,.27],[0,.30]].map(p=>new T.Vector2(...p)),24);
 for(let z=8;z<=41;z+=3.6){let x=14.4;b.box(x,1.81,z,.16,.94,.16,'red');b.put(finial,'gold',[x,2.25,z]);b.cyl(x,1.44,z,.12,.15,'oldgold');}
 for(let y of[1.55,1.96,2.27])b.line([14.4,y,8],[14.4,y,41],y===2.27?.065:.037,'red');
 for(let z=9.8;z<40;z+=3.6){b.at([14.34,1.77,z],Math.PI/2,()=>{
  // Small dense cast-bronze inserts occupy the lower centre of each timber bay.
  b.box(0,0,0,1.15,.55,.025,'darkwood');for(let yy of[-.275,.275])b.box(0,yy,.026,1.17,.025,.025,'oldgold');for(let xx of[-.575,.575])b.box(xx,0,.026,.025,.55,.025,'oldgold');
  for(let ss of[-1,1])for(let row=0;row<3;row++){let cx=ss*(.13+row*.13);b.tube([[cx,-.24,.035],[cx-ss*.13,-.15,.045],[cx+ss*.11,.03,.045],[cx-ss*.08,.22,.045],[cx+ss*.03,.12,.045],[cx+ss*.08,.01,.045]],.012,'gold',24);for(let k=0;k<4;k++)b.put(b.sphere,'oldgold',[cx+ss*.06*Math.sin(k*2),-.19+k*.12,.055],[.025,.043,.015],[0,0,ss*(k%2?.7:-.7)]);}
  for(let yy of[-.12,.12]){b.put(torus,'gold',[0,yy,.048],[.09,.09,.09]);rosette(0,yy,.056,.047);}
 });}
 // Six sided bronze lantern with emitting pierced panes, lattice curls and cast roof.
 const lampGlow=new T.MeshBasicMaterial({color:0xffc478,toneMapped:false});
 function lantern(x,y,z,s=1,ceiling=9.3){b.at([x,y,z],0,()=>{
  for(let sign of[-1,1]){b.put(new T.CylinderGeometry(.43,.43,.07,6),'oldgold',[0,sign*.60,0]);b.put(new T.CylinderGeometry(sign>0?.20:.46,sign>0?.46:.20,.23,6),'black',[0,sign*.76,0]);for(let j=0;j<6;j++){let a=j*Math.PI/3;b.ball(Math.sin(a)*.43,sign*.63,Math.cos(a)*.43,.045,.045,.045,'gold');}}
  for(let side=0;side<6;side++)b.at([0,0,0],side*Math.PI/3,()=>{
   b.box(0,0,.366,.378,1.08,.035,lampGlow);for(let xx of[-.205,.205]){b.box(xx,0,.40,.045,1.22,.055,'black');b.box(xx-.008,0,.43,.012,1.19,.018,'oldgold');}for(let yy of[-.55,.55]){b.box(0,yy,.40,.43,.055,.06,'black');for(let k=-3;k<=3;k++)b.ball(k*.052,yy,.438,.017,.022,.012,'gold');}
   b.put(torus,'oldgold',[0,0,.43],[.135,.20,.25]);rosette(0,0,.443,.074);
   for(let row=0;row<4;row++)for(let ss of[-1,1]){let yy=-.42+row*.24;b.tube([[0,yy,.428],[ss*.14,yy-.07,.432],[ss*.175,yy+.06,.432],[ss*.065,yy+.12,.432],[ss*.025,yy+.045,.432]],.012,'oldgold',16);b.put(b.sphere,'gold',[ss*.14,yy+.02,.444],[.018,.030,.012],[0,0,ss*.5]);}
  });
  b.ball(0,.98,0,.13,.14,.13,'black');b.ball(0,-1.00,0,.11,.16,.11,'oldgold');b.ball(0,-1.21,0,.045,.11,.045,'gold');
 },s);
  const top=y+1.11*s;b.line([x,top,z],[x,ceiling,z],.016,'oldgold');for(let yy=top+.06;yy<ceiling;yy+=.13)b.put(torus,'oldgold',[x,yy,z],[.035,.048,.035],[0,yy*8,0]);const light=new T.PointLight(0xffb75f,22*s,8*s,2);light.position.set(x,y,z);lights.push(light);}
 lantern(13.6,6.5,15.5,.77);lantern(13.2,7.5,5.5,.48,9.3);lantern(18,7.8,7,.5,9.3);
 return{group:b.finish(),lights,stats:{instances:b.count,buckets:b.buckets.size},deck};
}
