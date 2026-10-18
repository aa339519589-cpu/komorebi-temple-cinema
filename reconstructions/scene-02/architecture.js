import {T,V,mix,Builder,gridGeometry} from './kernel.js';
export function buildArchitecture(mats){
 const b=new Builder(mats),lights=[];const torus=new T.TorusGeometry(1,.075,6,20);
 function rosette(x,y,z,r=.2){for(let i=0;i<8;i++){let a=i*Math.PI/4;b.put(b.sphere,'gold',[x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.55,z],[r*.36,r*.18,r*.075],[0,0,a]);}b.ball(x,y,z+.02,r*.23,r*.23,r*.1);}
 function fitting(x,y,z,w,h){b.box(x,y,z,w,h,.035,'oldgold');for(let s of[-1,1]){b.box(x+s*w*.46,y,z+.025,w*.07,h,.025,'gold');b.box(x,y+s*h*.44,z+.025,w,h*.07,.025,'gold');}rosette(x,y,z+.04,Math.min(w,h)*.38);}
 function column(x,z,base,h,r=.24){b.cyl(x,base+.15,z,r*1.37,.30,'black');b.cyl(x,base+.32,z,r*1.32,.07,'gold');b.cyl(x,base+h/2+.3,z,r,h-.3,'red');for(let y of[base+.4,base+h-.05]){b.cyl(x,y,z,r*1.04,.12,'oldgold');for(let j=0;j<10;j++){let a=j*Math.PI/5;b.ball(x+Math.cos(a)*r,y,z+Math.sin(a)*r,r*.16,.09,r*.16,'gold');}}}
 function bracket(x,y,z,s=1){b.at([x,y,z],0,()=>{b.box(0,-.02,0,.42,.24,.42,'red');for(let k=0;k<3;k++){let yy=k*.23,span=.4+k*.28;b.box(0,yy,0,span*2,.15,.24,'cedar');b.box(0,yy+.045,0,.23,.15,span*2,'red');for(let q of[-1,1]){b.box(q*span,yy+.10,0,.2,.2,.32,'cedar');b.box(0,yy+.13,q*span,.32,.22,.2,'red');fitting(q*span,yy+.10,.17,.17,.17);}}},s);}
 const cap=new T.CylinderGeometry(.075,.075,.045,12);cap.rotateX(Math.PI/2);
 function roofEnd(p,yaw=0){b.put(cap,'tileEnd',p,[1,1,1],[0,yaw,0]);b.ball(p[0],p[1],p[2]+.027,.025,.025,.017,'oldgold');}
 function roof({w,d,eave,rise,center=[0,0,0],curl=.65,inner=0,scale=1}){b.at(center,0,()=>{
  const hw=w/2,hd=d/2,ridge=w*.24;const P=(side,t,u)=>{let x,z,span=mix(ridge,hw,t);if(side%2===0){x=u*span;z=(side===0?1:-1)*hd*t;}else{x=(side===1?1:-1)*span;z=u*hd*t;}let y=eave+rise*Math.pow(Math.max(0,1-t),1.5)+curl*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),6));return[x,y,z];};
  for(let side=0;side<4;side++){
   const rows=Array.from({length:19},(_,j)=>Array.from({length:49},(_,i)=>P(side,mix(inner,1,j/18),-1+2*i/48)));
   const g=gridGeometry(rows);
   b.put(g,'slate');const under=g.clone();under.translate(0,-.17,0);b.put(under,'cedar');
   const tiles=Math.ceil((side%2?d:w)/.23),segments=9;
   for(let i=0;i<=tiles;i++){const u=-1+2*i/tiles;for(let j=0;j<segments;j++){let a=P(side,mix(inner,1,j/segments),u),c=P(side,mix(inner,1,(j+1)/segments),u);a[1]+=.035;c[1]+=.035;b.line(a,c,.052,'slate');}const e=P(side,1,u);roofEnd([e[0],e[1]+.03,e[2]+(side===0?.04:0)],side*Math.PI/2);const a=P(side,.78,u),c=P(side,1.035,u);a[1]-=.27;c[1]-=.27;b.line(a,c,.105,'cedar',true,.14);}
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
 function windowPanel(x,y,z,w,h){b.box(x,y,z,w,h,.16,'darkwood');b.box(x,y,z+.09,w-.12,h-.12,.018,'paper');for(let j=0;j<=8;j++)b.box(x-w/2+w*j/8,y,z+.13,.045,h,.06,'cedar');for(let j=0;j<=12;j++)b.box(x,y-h/2+h*j/12,z+.14,w,.035,.06,'cedar');}
 function rail(length,base=0,height=1.05){for(let y of[.28,.73,height])b.box(0,base+y,0,length,y===height?.16:.10,.15,'red');let n=Math.ceil(length/1.75);for(let k=0;k<=n;k++){const x=-length/2+length*k/n;b.box(x,base+.55,0,.18,1.1,.18,'red');b.cyl(x,base+1.13,0,.12,.10,'gold');b.ball(x,base+1.26,0,.095,.12,.095);}for(let k=0;k<n*3;k++)b.box(-length/2+length*(k+.5)/(n*3),base+.5,0,.045,.42,.045,'red');}
 // The main hall is a tall, occupied building raised over an articulated stone terrace.
 b.at([4,0,-10],0,()=>{
  b.box(0,.95,-.8,18.4,1.9,13.5,'stone');b.box(0,2.05,-.8,19,.32,13.8,'lightstone');
  for(let i=0;i<24;i++){let y=(24-i)*2.2/24,z=6.15+i*.27;b.box(0,y/2,z,5.7,y,.28,'stone',0,.90+.10*Math.sin(i));b.box(0,y-.027,z+.1,5.85,.055,.10,'lightstone');}
  for(let s of[-1,1]){b.line([s*3.1,3.2,6.0],[s*3.1,1,12.7],.12,'red');for(let i=0;i<10;i++){let t=i/9;column(s*3.1,mix(6,12.7,t),mix(2.2,0,t),.9,.07);}b.at([s*6.2,2.2,6.15],0,()=>rail(5.1));}
  const axes=[-7.8,-5.2,-2.6,0,2.6,5.2,7.8];for(let z of[4.7,-.8,-6.3])for(let x of axes){if(z===-.8&&Math.abs(x)<7)continue;column(x,z,2.2,6.1,.27);bracket(x,8.28,z,.92);}
  for(let z of[4.7,-6.3]){b.box(0,8.15,z,16.8,.42,.5,'red');b.box(0,8.65,z,18.6,.3,.55,'cedar');for(let x of axes)fitting(x,8.15,z+.27,.55,.31);}
  for(let x of[-7.8,7.8])b.box(x,8.15,-.8,.45,.42,11.5,'red');
  b.box(0,5.05,-5.9,15.8,5.7,.25,'red');for(let x of[-6.45,-3.9,-1.3,1.3,3.9,6.45])windowPanel(x,4.85,-5.7,2.25,4.4);
  for(let x of[-6.5,-3.9,3.9,6.5])windowPanel(x,4.8,3.7,2.2,4.5); // large central opening remains real, with deep lit interior
  for(let x of[-7.8,7.8])for(let z of[-4.5,-1.8,1.0]){b.at([x,0,z],Math.PI/2,()=>windowPanel(0,4.8,0,2.2,4.5));}
  for(let x of[-2.7,2.7]){b.box(x,4.9,4.25,.32,5.3,.5,'red');for(let j=0;j<12;j++)fitting(x,2.55+j*.42,4.52,.29,.29);}
  b.box(0,7.65,4.3,5.8,.55,.6,'red');for(let i=-5;i<=5;i++)rosette(i*.48,7.65,4.65,.16);
  // Lower hipped skirt carries dense parallel tile courses and exposed bracket tiers.
  roof({w:22.8,d:16,eave:9.0,rise:3.4,center:[0,0,-.8],curl:.7,inner:.36});
  // A tall gabled roof rises above the skirt; the carved triangular front is fully three-dimensional.
  b.box(0,10.45,5.05,16,1.42,.22,'darkwood');for(let x=-7.5;x<=7.5;x+=.5)b.box(x,10.45,5.19,.10,1.42,.12,'cedar');b.box(0,11.16,5.16,16.3,.2,.30,'red');
  const tri=new T.BufferGeometry();tri.setAttribute('position',new T.Float32BufferAttribute([-8,11.15,5.1,8,11.15,5.1,0,17.2,5.1],3));tri.computeVertexNormals();const face=mats.darkwood.clone();face.side=T.DoubleSide;b.put(tri,face);
  for(let k=-7;k<=7;k++){let h=5.7*(1-Math.abs(k)/8);b.box(k,11.2+h/2,5.13,.13,h,.16,'cedar');}for(let y=11.4;y<16.5;y+=.6){let w=16*(1-(y-11.15)/6.1);b.box(0,y,5.18,w,.10,.15,'cedar');}
  gableRoof(17.5,12.3,11.4,6.3,-.7);
  for(let s of[-1,1]){let points=Array.from({length:32},(_,i)=>{let t=i/31;return[s*8.75*t,11.4+6.3*Math.pow(1-t,1.28)+.38*Math.pow(t,8)-.27,5.56];});b.tube(points,.14,'gold',44);for(let i=1;i<22;i++){let p=points[Math.round(i*31/22)];rosette(p[0],p[1]-.26,p[2],.17);}}
  fitting(0,12.5,5.35,2.1,1.1);rosette(0,15.1,5.37,.45);
  for(let s of[-1,1]){const light=new T.PointLight(0xffae49,45,12,2);light.position.set(s*2.2,5.5,-.5);lights.push(light);}
  // Golden altar, vase and central statue silhouette seen through the four-column entry.
  b.box(0,2.75,-3.7,3.5,.85,1.3,'oldgold');b.box(0,3.22,-3.7,3.75,.13,1.5,'gold');b.ball(0,4.4,-3.7,.62,.93,.40,'gold');b.ball(0,5.4,-3.7,.36,.43,.32,'gold');b.ball(0,5.83,-3.7,.20,.18,.20,'oldgold');b.ball(0,3.7,-3.3,.9,.22,.5,'gold');
 });
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
 for(let i=0;i<34;i++){let x=12.1+i*.235;b.box(x,1.27,24,.228,.16,30,'floor',0,.85+.2*(.5+.5*Math.sin(i*5.7)));for(let z of[12,20,28,36]){b.cyl(x,1.355,z,.013,.007,'black');}}
 for(let z of[10,18,26,34,40]){column(16.0,z,1.36,8.6,.48);bracket(16.0,9.7,z,1.35);} // substantial vermilion column is cropped at the far right
 for(let z of[10,18,26,34,40]){b.box(15.6,10,z,8.7,.45,.52,'cedar');for(let x=12.3;x<20;x+=.9)fitting(x,10,z+.28,.34,.34);}
 b.box(16,10.62,25,9.8,.28,33,'darkwood');
 for(let z=8.5;z<41;z+=.46){b.box(16,10.42,z,10.8,.30,.22,'cedar');b.box(10.73,10.42,z,.13,.31,.26,'darkwood');}
 b.box(11.1,10.08,25,.38,.45,34,'red');b.box(19.6,10.08,25,.38,.45,34,'red');
 // The nearest balustrade runs diagonally across the image through physical perspective.
 for(let z=8;z<=41;z+=2.6){let x=11.7;b.box(x,1.85,z,.25,1.0,.25,'red');b.cyl(x,2.34,z,.23,.12,'gold');b.cyl(x,2.44,z,.15,.12,'gold');b.ball(x,2.53,z,.23,.12,.23);b.ball(x,2.66,z,.10,.10,.10);b.cyl(x,1.48,z,.20,.17,'oldgold');}
 for(let y of[1.6,1.96,2.28])b.box(11.7,y,24.5,.20,y===2.28?.19:.12,33,'red');
 for(let z=9.3;z<40;z+=2.6){b.box(11.7,1.82,z,.07,.64,1.77,'darkwood');b.at([11.58,1.82,z],Math.PI/2,()=>{for(let zz of[-.29,.29])b.box(0,zz,0,1.74,.065,.04,'gold');for(let xx of[-.84,.84])b.box(xx,0,0,.065,.64,.04,'gold');rosette(0,0,.035,.25);for(let s of[-1,1])for(let j=0;j<3;j++){let x=s*(.32+j*.15);b.tube([[x,-.22,.025],[x-s*.12,.05,.06],[x+s*.04,.22,.06],[x+s*.1,.04,.03]],.025,'oldgold',12);}});}
 // Large hexagonal bronze lanterns: emitting panes behind intricate metal tracery.
 function lantern(x,y,z,s=1,ceiling=10.3){b.at([x,y,z],0,()=>{for(let h of[-.67,.67]){b.put(new T.CylinderGeometry(.48,.48,.10,6),'gold',[0,h,0]);b.put(new T.CylinderGeometry(h>0?.27:.53,h>0?.53:.27,.25,6),'oldgold',[0,h+Math.sign(h)*.16,0]);}for(let side=0;side<6;side++){b.at([0,0,0],side*Math.PI/3,()=>{b.box(0,0,.414,.44,1.22,.025,'paper');for(let xx of[-.23,.23])b.box(xx,0,.44,.045,1.36,.06,'gold');for(let yy of[-.59,.59])b.box(0,yy,.44,.48,.055,.06,'gold');b.put(torus,'oldgold',[0,0,.45],[.19,.28,.32],[0,0,0]);for(let k=0;k<5;k++){let yy=-.5+k*.25;for(let ss of[-1,1])b.line([-.20,yy,.45],[.20,yy+ss*.23,.45],.017,'oldgold');}rosette(0,0,.47,.13);});}b.ball(0,-1.03,0,.15,.2,.15);b.ball(0,-1.26,0,.065,.13,.065);},s);
  const top=y+.99*s; b.line([x,top,z],[x,ceiling,z],.023,'oldgold');for(let yy=top+.1;yy<ceiling;yy+=.14)b.put(torus,'gold',[x,yy,z],[.047,.065,.047],[0,yy*8,0]);const light=new T.PointLight(0xffb75f,15*s,8*s,2);light.position.set(x,y,z);lights.push(light);}
 lantern(12.8,6.7,15.5,.88);lantern(12.8,7.6,5.5,.62,10.3);lantern(18,7.8,7,.65,10.3);
 return{group:b.finish(),lights,stats:{instances:b.count,buckets:b.buckets.size},deck};
}
