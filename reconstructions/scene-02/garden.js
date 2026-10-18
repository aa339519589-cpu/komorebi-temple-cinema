import {T,V,mix,rand,Builder,gridGeometry} from './kernel.js';
export function buildGarden(mats){
 const b=new Builder(mats),lights=[];mats.rock=mats.stone.clone();mats.rock.color.setHex(0x555b50);mats.rock.roughness=.72;mats.rock.metalness=.06;
 const leafGeo=(()=>{let p=[0,0,0,-.5,.06,.3,-.36,.08,.75,0,.02,1,.36,.08,.75,.5,.06,.3],idx=[0,1,2,0,2,3,0,3,4,0,4,5];let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;})();mats.leaf.side=mats.leaflight.side=mats.pink.side=mats.pinkDark.side=T.DoubleSide;
 const petalGeo=(()=>{let rows=Array.from({length:9},(_,j)=>Array.from({length:7},(_,i)=>{let t=j/8,s=-1+2*i/6;return[s*Math.sin(Math.PI*t)*.38,.65*t*t+.13*Math.sin(Math.PI*t)*(1-s*s),t];}));return gridGeometry(rows);})();
 const rockGeos=Array.from({length:7},(_,k)=>{const g=new T.IcosahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+.12*Math.sin(x*7+y*8+z*9+k)+.06*Math.cos(x*13-z*11);p.setXYZ(i,x*n,y*n,z*n);}const normal=g.attributes.normal;for(let i=0;i<p.count;i++){const v=new T.Vector3(p.getX(i),p.getY(i),p.getZ(i)).normalize();normal.setXYZ(i,v.x,v.y,v.z);}normal.needsUpdate=true;return g;});
 function rock(x,y,z,r=1){b.put(rockGeos[Math.floor(rand()*7)],rand()<.12?'moss':'rock',[x,y,z],[r*(.65+rand()*.7),r*(.6+rand()*.5),r*(.6+rand()*.7)],[rand()*.4,rand()*6.28,rand()*.4],.7+rand()*.5);}
 const twigGeo=new T.CylinderGeometry(1,1,1,6);function branch(a,c,r){const len=V(a).distanceTo(V(c));if(r>.045&&len>1){let last=a;for(let j=1;j<=4;j++){let t=j/4,p=[mix(a[0],c[0],t)+Math.sin(t*Math.PI)*len*.05*Math.sin(c[2]*3),mix(a[1],c[1],t),mix(a[2],c[2],t)+Math.sin(t*Math.PI)*len*.055*Math.cos(c[0]*2)];b.line(last,p,r*(1-.35*t),'trunk');last=p;}}else b.line(a,c,r,'trunk',false,r,r<.05?twigGeo:null);}
 function leafCluster(x,y,z,rx,ry,rz,n=100){
  // A continuous canopy is made from many small leaves attached to branching shoots.
  // There is no low-poly crown shell or floating random leaf cloud.
  const shoots=Math.max(12,Math.ceil(rx*rz*35));
  for(let j=0;j<shoots;j++){
   const a=j*2.399+rand()*.3,u=rand()*1.8-.9,f=Math.sqrt(1-u*u),q=.60+.4*Math.cbrt(rand()),tip=[x+Math.cos(a)*f*rx*q,y+u*ry*q,z+Math.sin(a)*f*rz*q],elbow=[mix(x,tip[0],.55),mix(y,tip[1],.5)+ry*.12,mix(z,tip[2],.55)];
   branch([x,y-ry*.20,z],elbow,.012+rx*.002);branch(elbow,tip,.007+rx*.001);
   for(let k=0;k<26;k++){const t=.25+.75*(k+.5)/26,side=k%2?1:-1,s=.065+rand()*.085,p=[mix(elbow[0],tip[0],t)+side*Math.cos(a+1.57)*s*.42,mix(elbow[1],tip[1],t)+rand()*.03,mix(elbow[2],tip[2],t)+side*Math.sin(a+1.57)*s*.42];b.put(leafGeo,rand()<.18?'leaflight':'leaf',p,[s,s,s*1.45],[-.25+rand()*.5,a+side*.82,rand()*.3],.78+rand()*.42);}
  }
 }
 function shrub(x,y,z,r=1,flower=false){for(let j=0;j<5;j++){let a=j*6.28/5,rr=r*.4;leafCluster(x+Math.cos(a)*rr,y+r*.45,z+Math.sin(a)*rr,r*.65,r*.55,r*.65,60);}if(flower)for(let j=0;j<50*r;j++){let a=rand()*6.28,u=rand(),p=[x+Math.cos(a)*r*Math.sqrt(u),y+r*.5+rand()*r*.6,z+Math.sin(a)*r*Math.sqrt(u)];for(let k=0;k<5;k++)b.put(petalGeo,rand()<.3?'pinkDark':'pink',p,[.08,.08,.12],[0,k*6.28/5,Math.PI/3]);}}
 function tree(x,z,h=5,r=3,pine=false){const base=.1,lean=(rand()-.5)*1.1,top=[x+lean,h,z+.2];branch([x,base,z],[x+.2,h*.52,z],.16+h*.015);branch([x+.2,h*.52,z],top,.09+h*.006);
  for(let j=0;j<8;j++){let a=j*2.4+(rand()-.5)*.4,y=h*(.45+j*.055),reach=r*(.7+rand()*.4),end=[x+Math.cos(a)*reach,y+.35+rand()*.35,z+Math.sin(a)*reach],start=[x+lean*.5,y-.5,z];branch(start,end,.055+j*.002);let last=end;for(let k=0;k<3;k++){let aa=a+(k-1)*.6,p=[end[0]+Math.cos(aa)*r*.35,end[1]+.35,end[2]+Math.sin(aa)*r*.35];branch(end,p,.02);last=p;leafCluster(p[0],p[1],p[2],r*.34,pine?.58:r*.30,r*.34,125);} }
  leafCluster(top[0],top[1],top[2],r*.52,pine?.58:r*.43,r*.52,190);
 }
 function cherry(x,z,h=5,r=3){branch([x,0,z],[x+.25,h*.62,z],.18);for(let j=0;j<12;j++){let a=j*2.4,y=h*(.5+rand()*.45),end=[x+Math.cos(a)*r*(.4+rand()*.6),y,z+Math.sin(a)*r];branch([x+.2,h*.5,z],end,.035+rand()*.04);for(let k=0;k<100;k++){let aa=rand()*6.28,u=rand()*2-1,p=[end[0]+Math.cos(aa)*r*.24*Math.sqrt(1-u*u),end[1]+u*r*.22,end[2]+Math.sin(aa)*r*.24*Math.sqrt(1-u*u)];for(let n=0;n<5;n++)b.put(petalGeo,rand()<.2?'pinkDark':'pink',p,[.075,.075,.10],[rand()*.8,n*1.256,1.1+rand()*.3]);}}}
 // Mossy islets alternate with open water, preserving a continuous pond under the bridge.
 b.box(-8,-.52,11,49,.8,58,'black');b.box(6,-.08,1.0,14,.26,7,'stone');
 for(let i=0;i<25;i++){let x=-27+i*1.7;rock(x,.07,1.2+Math.sin(i*.8)*.7,.65+rand()*.55);if(i%2===0)shrub(x,.15,.7,1+rand()*.6,i%3===0);}
 for(let i=0;i<12;i++){let z=-2+i*1.75;rock(10+.6*Math.sin(i),.12,z,.32+rand()*.35);if(i%2===0)shrub(10.2,.20,z,.55+rand()*.55,i%3===0);}
 const islands=[[-1.5,0,7.5,1.0],[8.3,0,5.5,1.25],[4.6,0,13.5,.55],[-9,0,1.8,1.1]];
 for(let [x,y,z,r]of islands){b.put(b.lowSphere,'moss',[x,-.05,z],[r*1.45,.35,r]);for(let i=0;i<7;i++){let a=rand()*6.28,rr=r*(.6+rand()*.55);rock(x+Math.cos(a)*rr,.05,z+Math.sin(a)*rr,.20+rand()*.38);}for(let i=0;i<3;i++)shrub(x+(rand()-.5)*r*1.2,.2,z+(rand()-.5)*r*1.1,r*.30+rand()*.25,i%2===0);}
 // Garden height is deliberately varied: dense low flowers, articulated rocks, pruned pines and blossom canopies.
 tree(-6.5,-.5,5.6,3.1,true);tree(-20,-4,7,3.5,true);tree(6,4,4.4,2,true);tree(10,-3,6,3,true);tree(-2,1,3.8,1.9,true);
 cherry(15,0,5.8,3.3);cherry(-10,0,4.4,2.8);cherry(9,-4,5,2.8);
 for(let j=0;j<16;j++){let x=-26+rand()*37,z=-4+rand()*4;shrub(x,.2,z,.7+rand()*.7,j%3===0);}
 // Left framing canopy enters the sky with individual leaves and crooked visible branches.
 branch([-28,11,-3],[-18,16,-3],.23);branch([-18,16,-3],[-9,18,-3],.12);for(let j=0;j<9;j++){const end=[-23+j*1.65,17.7+Math.sin(j*1.8)*1.5,-4+Math.cos(j*2)*1.5];branch([-21+j,16+j*.18,-3],end,.045);leafCluster(end[0],end[1],end[2],1.3,.8,1.3,180);}leafCluster(-16,21,-4,2.0,1.4,1.5,220);leafCluster(-21,22,-5,2.0,1.5,1.5,220);leafCluster(-11.5,20.5,-4,1.5,1.2,1.4,220);tree(-28,-8,10,3.2,false);
 // Irregular azalea beds climbing either side of the temple stairs.
 for(let s of[-1,1])for(let i=0;i<14;i++){let z=1+rand()*6,x=4+s*(3.6+rand()*3.2);rock(x,.5,z,.38+rand()*.6);shrub(x,.45,z,.45+rand()*.65,true);}
 const stoneGlow=new T.MeshBasicMaterial({color:0xffbd60,toneMapped:false});const lanternRoof=mats.stone.clone();lanternRoof.color.setHex(0x565a53);lanternRoof.side=T.DoubleSide;
 function stoneLantern(x,z,h=3.3,s=1){b.at([x,0,z],0,()=>{
  b.put(new T.CylinderGeometry(.58,.64,.18,8),'stone',[0,.09,0]);b.put(new T.CylinderGeometry(.42,.53,.18,8),'lightstone',[0,.25,0]);
  const stem=new T.CylinderGeometry(.17,.24,h*.52,8,10);const sp=stem.attributes.position;for(let j=0;j<sp.count;j++){let xx=sp.getX(j),yy=sp.getY(j),zz=sp.getZ(j),q=.005*Math.sin(xx*71+yy*33+zz*63);sp.setXYZ(j,xx+q,yy,zz+q*.7);}stem.computeVertexNormals();b.put(stem,'stone',[0,.40+h*.26,0]);
  const floor=h*.64,cy=floor+.33;
  const capital=new T.LatheGeometry([[0,0],[.21,0],[.25,.05],[.26,.11],[.36,.17],[.45,.20],[.50,.26],[.48,.31],[0,.31]].map(v=>new T.Vector2(...v)),8);b.put(capital,'stone',[0,floor-.33,0]);
  b.put(new T.CylinderGeometry(.49,.5,.10,6),'lightstone',[0,floor,0]);
  for(let side=0;side<6;side++)b.at([0,0,0],side*Math.PI/3,()=>{
   b.box(0,cy,.330,.32,.52,.027,stoneGlow);for(let xx of[-.185,.185])b.box(xx,cy,.353,.045,.66,.05,'darkwood');for(let yy of[-.28,.28])b.box(0,cy+yy,.36,.38,.04,.05,'oldgold');
   const ring=new T.TorusGeometry(.10,.010,5,16);b.put(ring,'oldgold',[0,cy,.371],[1,1.5,1]);
   for(let ss of[-1,1])for(let k=0;k<3;k++){let yy=cy-.22+k*.21;b.tube([[0,yy,.37],[ss*.13,yy-.04,.374],[ss*.14,yy+.08,.374],[ss*.04,yy+.13,.374]],.008,'oldgold',12);}
  });
  const top=cy+.37;b.put(new T.CylinderGeometry(.46,.48,.12,6),'stone',[0,top,0]);
  for(let side=0;side<6;side++)b.at([0,0,0],side*Math.PI/3,()=>{
   const P=(t,u)=>{let r=.12+.51*t;return[u*r*.57735,top+.48*Math.pow(1-t,1.4)+.12*Math.pow(t,8)*Math.pow(Math.abs(u),4),r];};
   b.put(gridGeometry(Array.from({length:13},(_,j)=>Array.from({length:17},(_,i)=>P(j/12,-1+2*i/16)))),lanternRoof);
   for(let k=-3;k<=3;k++){let pts=Array.from({length:14},(_,j)=>P(j/13,k/3));b.tube(pts,.010,'stone',18);}
   b.tube(Array.from({length:17},(_,i)=>P(1,-1+2*i/16)),.022,'stone',24);
  });
  b.put(new T.CylinderGeometry(.14,.22,.13,8),'stone',[0,top+.53,0]);b.ball(0,top+.71,0,.12,.17,.12,'stone');b.ball(0,top+.87,0,.045,.09,.045,'stone');
 },s);const l=new T.PointLight(0xffaa42,9*s,7*s,2);l.position.set(x,(h*.64+.33)*s,z);lights.push(l);}
 stoneLantern(-3.8,8,3.5,1.0);stoneLantern(10.4,5.9,3.0,.92);stoneLantern(-22,0,3.0,.8);
 // Lotus leaves are shallow ribbed basins with a radial slit, cupped rim and raised midribs.
 const lotusGeo=(()=>{let rings=7,N=36,rows=[];for(let j=0;j<=rings;j++){let t=.012+.988*j/rings;rows.push(Array.from({length:N+1},(_,i)=>{let a=.13+(Math.PI*2-.26)*i/N,r=t*(1+.035*Math.sin(a*7));return[Math.cos(a)*r,.045*Math.sin(a*7)*t*t+.14*Math.pow(t,5)-.055*(1-t),Math.sin(a)*r];}));}return gridGeometry(rows);})();
 const lotusMaterials=[0x53701e,0x688025,0x3b5b1a,0x87923a].map(c=>new T.MeshStandardMaterial({color:c,roughness:.40,side:T.DoubleSide}));
 for(let i=0;i<190;i++){let x=-7+rand()*18,z=5+rand()*20;if(x>7&&z<15)continue;let s=.23+rand()*.35,y=.05+rand()*.1,yaw=rand()*6.28;b.put(lotusGeo,lotusMaterials[i%4],[x,y,z],[s,s,s],[0,yaw,0]);if(i%4===0){b.at([x,y+.012,z],yaw,()=>{for(let k=0;k<8;k++){let a=.22+k*.74;b.line([0,-.04,0],[Math.cos(a)*s*.9,.08*s,Math.sin(a)*s*.9],.004,'leaflight');}});}if(i%6===0){let fy=.22+rand()*.28;b.line([x,0,z],[x,fy,z],.012,'leaf');b.ball(x,fy,z,.042,.034,.042,'gold');for(let ring=0;ring<3;ring++){let N=ring===0?6:9;for(let k=0;k<N;k++)b.put(petalGeo,ring===2?'pinkDark':'petal',[x,fy,z],[.105+ring*.027,.22,.20+ring*.035],[.3+ring*.25,k*6.28/N+ring*.3,0]);}}}
 // Tiny floating leaves and ripple highlights catch the low sunset without image overlays.
 const ripple=new T.TorusGeometry(1,.006,3,24);for(let i=0;i<90;i++){let x=-23+rand()*33,z=4+rand()*30,r=.18+rand()*.5;b.put(ripple,'water',[x,.025,z],[r,r,r],[Math.PI/2,0,0]);}
 // Terrain silhouettes: true finite ridges, then several layers of distant woodland.
 const mountainMat=new T.MeshStandardMaterial({color:0x4c5844,roughness:1});for(let layer=0;layer<3;layer++){const z=-48-layer*30,rows=[[],[]];for(let i=0;i<=70;i++){let x=-100+i*3,top=4+layer*2+5*Math.sin(i*.085+layer)+2*Math.sin(i*.37)+rand()*.8;rows[0].push([x,-2,z]);rows[1].push([x,top,z]);}const g=gridGeometry(rows),m=mountainMat.clone();m.color.lerp(new T.Color(0xc39266),layer*.22);m.side=T.DoubleSide;b.put(g,m);}
 for(let i=0;i<80;i++){let x=-60+rand()*100,z=-30-rand()*16,h=3+rand()*5;const g=new T.ConeGeometry(1,1,7);b.put(g,'leaf',[x,h*.5,z],[1+rand()*1.5,h,1.5],[0,rand()*6,0],.65+rand()*.6);}
 return {group:b.finish(),lights,stats:{instances:b.count,buckets:b.buckets.size}};
}
