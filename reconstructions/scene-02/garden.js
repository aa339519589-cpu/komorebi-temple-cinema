import {T,V,mix,rand,Builder,gridGeometry} from './kernel.js';
export function buildGarden(mats){
 const b=new Builder(mats),lights=[];
 const leafGeo=(()=>{let p=[0,0,0,-.5,.06,.3,-.36,.08,.75,0,.02,1,.36,.08,.75,.5,.06,.3],idx=[0,1,2,0,2,3,0,3,4,0,4,5];let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;})();mats.leaf.side=mats.leaflight.side=T.DoubleSide;
 const petalGeo=(()=>{let rows=Array.from({length:9},(_,j)=>Array.from({length:7},(_,i)=>{let t=j/8,s=-1+2*i/6;return[s*Math.sin(Math.PI*t)*.38,.5*t*t+.05*Math.cos(s*Math.PI/2),t];}));return gridGeometry(rows);})();
 const rockGeos=Array.from({length:7},(_,k)=>{const g=new T.IcosahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+.12*Math.sin(x*7+y*8+z*9+k)+.06*Math.cos(x*13-z*11);p.setXYZ(i,x*n,y*n,z*n);}g.computeVertexNormals();return g;});
 function rock(x,y,z,r=1){b.put(rockGeos[Math.floor(rand()*7)],rand()<.12?'moss':'stone',[x,y,z],[r*(.65+rand()*.7),r*(.6+rand()*.5),r*(.6+rand()*.7)],[rand()*.4,rand()*6.28,rand()*.4],.7+rand()*.5);}
 function branch(a,c,r){b.line(a,c,r,'trunk');}
 function leafCluster(x,y,z,rx,ry,rz,n=100){for(let i=0;i<n;i++){const a=rand()*6.28,u=rand()*2-1,q=Math.cbrt(rand()),f=Math.sqrt(1-u*u),p=[x+Math.cos(a)*f*rx*q,y+u*ry*q,z+Math.sin(a)*f*rz*q],s=.18+rand()*.26;b.put(leafGeo,rand()<.28?'leaflight':'leaf',p,[s,s,s*1.4],[rand()*1.4-.7,rand()*6.28,rand()*.6],.75+rand()*.5);}}
 function shrub(x,y,z,r=1,flower=false){for(let j=0;j<5;j++){let a=j*6.28/5,rr=r*.4;leafCluster(x+Math.cos(a)*rr,y+r*.45,z+Math.sin(a)*rr,r*.65,r*.55,r*.65,60);}if(flower)for(let j=0;j<50*r;j++){let a=rand()*6.28,u=rand(),p=[x+Math.cos(a)*r*Math.sqrt(u),y+r*.5+rand()*r*.6,z+Math.sin(a)*r*Math.sqrt(u)];for(let k=0;k<5;k++)b.put(petalGeo,rand()<.3?'pinkDark':'pink',p,[.08,.08,.12],[0,k*6.28/5,Math.PI/3]);}}
 function tree(x,z,h=5,r=3,pine=false){const base=.1,lean=(rand()-.5)*1.1,top=[x+lean,h,z+.2];branch([x,base,z],[x+.2,h*.52,z],.16+h*.015);branch([x+.2,h*.52,z],top,.09+h*.006);
  for(let j=0;j<8;j++){let a=j*2.4+(rand()-.5)*.4,y=h*(.45+j*.055),reach=r*(.7+rand()*.4),end=[x+Math.cos(a)*reach,y+.35+rand()*.35,z+Math.sin(a)*reach],start=[x+lean*.5,y-.5,z];branch(start,end,.055+j*.002);let last=end;for(let k=0;k<3;k++){let aa=a+(k-1)*.6,p=[end[0]+Math.cos(aa)*r*.35,end[1]+.35,end[2]+Math.sin(aa)*r*.35];branch(end,p,.02);last=p;leafCluster(p[0],p[1],p[2],r*.49,pine?.25:r*.44,r*.49,110);} }
  leafCluster(top[0],top[1],top[2],r*.7,pine?.35:r*.55,r*.7,180);
 }
 function cherry(x,z,h=5,r=3){branch([x,0,z],[x+.25,h*.62,z],.18);for(let j=0;j<12;j++){let a=j*2.4,y=h*(.5+rand()*.45),end=[x+Math.cos(a)*r*(.4+rand()*.6),y,z+Math.sin(a)*r];branch([x+.2,h*.5,z],end,.035+rand()*.04);for(let k=0;k<50;k++){let aa=rand()*6.28,u=rand()*2-1,p=[end[0]+Math.cos(aa)*r*.4*Math.sqrt(1-u*u),end[1]+u*r*.32,end[2]+Math.sin(aa)*r*.4*Math.sqrt(1-u*u)];for(let n=0;n<5;n++)b.put(petalGeo,rand()<.2?'pinkDark':'pink',p,[.12,.12,.15],[rand()*.8,n*1.256,1.1+rand()*.3]);}}}
 // Mossy islets alternate with open water, preserving a continuous pond under the bridge.
 b.box(-8,-.52,11,49,.8,58,'black');b.box(6,-.08,1.0,14,.26,7,'stone');
 for(let i=0;i<25;i++){let x=-27+i*1.7;rock(x,.07,1.2+Math.sin(i*.8)*.7,.65+rand()*.55);if(i%2===0)shrub(x,.15,.7,1+rand()*.6,i%3===0);}
 for(let i=0;i<21;i++){let z=-2+i*1.75;rock(10+.6*Math.sin(i),.2,z,.65+rand()*.5);if(i%2===0)shrub(10.2,.35,z,1+rand()*.8,i%3===0);}
 const islands=[[-1,0,8,1.5],[2,0,13,1.1],[8.2,0,8,1.4],[8.8,0,20,1.1],[10,0,24,1.1],[-9,0,1.8,1.5]];
 for(let [x,y,z,r]of islands){b.put(b.lowSphere,'moss',[x,-.05,z],[r*1.45,.35,r]);for(let i=0;i<12;i++){let a=rand()*6.28,rr=r*(.6+rand()*.55);rock(x+Math.cos(a)*rr,.1,z+Math.sin(a)*rr,.35+rand()*.7);}for(let i=0;i<5;i++)shrub(x+(rand()-.5)*r*1.2,.2,z+(rand()-.5)*r*1.1,r*.43+rand()*.35,i%2===0);}
 // Garden height is deliberately varied: dense low flowers, articulated rocks, pruned pines and blossom canopies.
 tree(-6.5,-.5,5.6,3.1,true);tree(-20,-4,7,3.5,true);tree(6,4,4.4,2,true);tree(10,-3,6,3,true);tree(-2,1,3.8,1.9,true);
 cherry(15,0,5.8,3.3);cherry(-10,0,4.4,2.8);cherry(9,-4,5,2.8);
 for(let j=0;j<16;j++){let x=-26+rand()*37,z=-4+rand()*4;shrub(x,.2,z,.7+rand()*.7,j%3===0);}
 // Left framing canopy enters the sky with individual leaves and crooked visible branches.
 tree(-19,0,17,7.5,false);tree(-26,-8,12,5,false);
 // Irregular azalea beds climbing either side of the temple stairs.
 for(let s of[-1,1])for(let i=0;i<14;i++){let z=1+rand()*6,x=4+s*(3.6+rand()*3.2);rock(x,.5,z,.38+rand()*.6);shrub(x,.45,z,.45+rand()*.65,true);}
 function stoneLantern(x,z,h=3.3,s=1){b.at([x,0,z],0,()=>{b.box(0,.12,0,1.1,.24,1.1,'stone');b.box(0,.3,0,.85,.16,.85,'lightstone');b.cyl(0,h*.38,0,.24,h*.56,'stone');b.box(0,h*.67,0,1.0,.2,1.0,'lightstone');b.box(0,h*.83,0,.7,h*.32,.7,'darkwood');for(let side=0;side<4;side++)b.at([0,0,0],side*Math.PI/2,()=>{b.box(0,h*.83,.36,.55,h*.27,.02,'paper');for(let xx of[-.30,.30])b.box(xx,h*.83,.4,.07,h*.33,.07,'stone');for(let k=-2;k<=2;k++)b.box(k*.10,h*.83,.39,.022,h*.27,.03,'oldgold');});let yy=h*1.02;const shape=new T.ConeGeometry(.85,.45,4);shape.rotateY(Math.PI/4);b.put(shape,'stone',[0,yy,0]);b.ball(0,yy+.32,0,.13,.22,.13,'lightstone');},s);const l=new T.PointLight(0xffb54f,10*s,7*s,2);l.position.set(x,h*.83*s,z);lights.push(l);}
 stoneLantern(-2.5,8,3.7,1.1);stoneLantern(10.4,5.9,3.2,.95);stoneLantern(-22,0,3.1,.8);
 // Lotus leaves are shallow ribbed basins with a radial slit, cupped rim and raised midribs.
 const lotusGeo=(()=>{let rings=7,N=36,rows=[];for(let j=0;j<=rings;j++){let t=.012+.988*j/rings;rows.push(Array.from({length:N+1},(_,i)=>{let a=.13+(Math.PI*2-.26)*i/N,r=t*(1+.035*Math.sin(a*7));return[Math.cos(a)*r,.045*Math.sin(a*7)*t*t+.14*Math.pow(t,5)-.055*(1-t),Math.sin(a)*r];}));}return gridGeometry(rows);})();
 const lotusMaterials=[0x53701e,0x688025,0x3b5b1a,0x87923a].map(c=>new T.MeshStandardMaterial({color:c,roughness:.40,side:T.DoubleSide}));
 for(let i=0;i<285;i++){let x=-7+rand()*18,z=5+rand()*20;if(x>7&&z<15)continue;let s=.25+rand()*.45,y=.05+rand()*.1,yaw=rand()*6.28;b.put(lotusGeo,lotusMaterials[i%4],[x,y,z],[s,s,s],[0,yaw,0]);if(i%4===0){b.at([x,y+.012,z],yaw,()=>{for(let k=0;k<8;k++){let a=.22+k*.74;b.line([0,-.04,0],[Math.cos(a)*s*.9,.08*s,Math.sin(a)*s*.9],.004,'leaflight');}});}if(i%6===0){let fy=.3+rand()*.45;b.line([x,0,z],[x,fy,z],.012,'leaf');b.ball(x,fy,z,.075,.055,.075,'gold');for(let ring=0;ring<3;ring++){let N=ring===0?6:9;for(let k=0;k<N;k++)b.put(petalGeo,ring===2?'pinkDark':'petal',[x,fy,z],[.18+ring*.055,.3,.32+ring*.07],[.3+ring*.25,k*6.28/N+ring*.3,0]);}}}
 // Tiny floating leaves and ripple highlights catch the low sunset without image overlays.
 const ripple=new T.TorusGeometry(1,.006,3,24);for(let i=0;i<90;i++){let x=-23+rand()*33,z=4+rand()*30,r=.18+rand()*.5;b.put(ripple,'water',[x,.025,z],[r,r,r],[Math.PI/2,0,0]);}
 // Terrain silhouettes: true finite ridges, then several layers of distant woodland.
 const mountainMat=new T.MeshStandardMaterial({color:0x4c5844,roughness:1});for(let layer=0;layer<3;layer++){const z=-48-layer*30,rows=[[],[]];for(let i=0;i<=70;i++){let x=-100+i*3,top=4+layer*2+5*Math.sin(i*.085+layer)+2*Math.sin(i*.37)+rand()*.8;rows[0].push([x,-2,z]);rows[1].push([x,top,z]);}const g=gridGeometry(rows),m=mountainMat.clone();m.color.lerp(new T.Color(0xc39266),layer*.22);m.side=T.DoubleSide;b.put(g,m);}
 for(let i=0;i<80;i++){let x=-60+rand()*100,z=-30-rand()*16,h=3+rand()*5;const g=new T.ConeGeometry(1,1,7);b.put(g,'leaf',[x,h*.5,z],[1+rand()*1.5,h,1.5],[0,rand()*6,0],.65+rand()*.6);}
 return {group:b.finish(),lights,stats:{instances:b.count,buckets:b.buckets.size}};
}
