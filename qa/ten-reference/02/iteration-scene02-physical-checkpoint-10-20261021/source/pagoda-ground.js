import {T,Builder,gridGeometry} from './kernel.js';
import {layout} from './layout117.js';

// Closed, planted ground volume under the raised tower. Coordinates in this
// group are metres, unlike the tower's .9/1.1/.9 architectural scale.
export function buildPagodaGrounding(mats){
 const b=new Builder(mats),cx=layout.pagoda.position[0],cz=layout.pagoda.position[2],yaw=layout.pagoda.yaw;
 let seed=205102;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const smooth=(a,c,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(c-a)));return t*t*(3-2*t);};
 const start=-11.55,end=-4.20,flightWidth=1.65,plinthBottom=layout.pagoda.position[1],shoulder=plinthBottom-.45;
 function height(u,v){
  const radius=Math.pow((Math.abs(u)/12)**4+(Math.abs(v)/10)**4,.25),angle=Math.atan2(v,u);
  const r=radius*(1+smooth(.47,.82,radius)*(.027*Math.sin(angle*5)+.018*Math.sin(angle*9+.6)));
  let h=r<.46?shoulder:r<.60?shoulder-(shoulder-3.45)*smooth(.46,.60,r):r<.77?3.45-1.8*smooth(.60,.77,r):1.65-1.77*smooth(.77,1,r);
  h=Math.max(h,-.12+(shoulder+.12)*(1-smooth(4.25,5.70,Math.max(Math.abs(u),Math.abs(v)))));
  h+=smooth(.47,.65,r)*(1-smooth(.90,1,r))*(.17*Math.sin(u*.72)*Math.cos(v*.91)+.055*Math.sin(u*2.7+v*1.9));
  // A real cut receives the west stair; soil is lower than every stone tread.
  if(u>start-.25&&u<end+.10){const stair=Math.max(0,Math.min(1,(u-start)/(end-start)))*plinthBottom-.18,w=1-smooth(flightWidth/2,flightWidth/2+.45,Math.abs(v));h-=w*Math.max(0,h-stair);}
  return Math.max(-.12,h);
 }
 const hillsideRock=mats.rock||mats.stone;
 const soil=mats.moss.clone();soil.name='scene02-pagoda-soil';soil.color.setHex(0x344025);soil.roughness=1;
 const rockGeo=new T.IcosahedronGeometry(1,2),rp=rockGeo.attributes.position;
 for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),q=1+.10*Math.sin(x*6.1+z*4.2+y*3.7);rp.setXYZ(i,x*q,Math.max(-.65,Math.min(.70,y*q)),z*q);}rockGeo.computeVertexNormals();
 const leaf=new T.BufferGeometry();leaf.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.14,.025,.24,0,.035,.53,.14,.025,.24],3));leaf.setIndex([0,1,2,0,2,3]);leaf.computeVertexNormals();
 b.at([cx,0,cz],yaw,()=>{
  const uAxis=[-60,-45,-30,-20,-16,...Array.from({length:113},(_,i)=>-14+i*.25),16,20,30,45,60],vAxis=[-60,-45,-30,-20,-16,...Array.from({length:101},(_,i)=>-12.5+i*.25),16,20,30,45,60],nx=uAxis.length-1,nz=vAxis.length-1,rows=vAxis.map(v=>uAxis.map(u=>[u,height(u,v),v]));
  const g=gridGeometry(rows),pos=Array.from(g.attributes.position.array),indices=Array.from(g.index.array),ring=[];
  for(let i=0;i<=nx;i++)ring.push(i);for(let j=1;j<=nz;j++)ring.push(j*(nx+1)+nx);for(let i=nx-1;i>=0;i--)ring.push(nz*(nx+1)+i);for(let j=nz-1;j>0;j--)ring.push(j*(nx+1));
  const lower=ring.map(id=>{const n=pos.length/3;pos.push(pos[id*3],-.92,pos[id*3+2]);return n;}),bottom=pos.length/3;pos.push(0,-.92,0);
  for(let k=0;k<ring.length;k++){const j=(k+1)%ring.length,a=ring[k],c=ring[j],la=lower[k],lc=lower[j];indices.push(a,c,la,c,lc,la,bottom,la,lc);}
  const ground=new T.BufferGeometry();ground.setAttribute('position',new T.Float32BufferAttribute(pos,3));ground.setIndex(indices);ground.setAttribute('uv',new T.Float32BufferAttribute(pos.flatMap((_,i)=>i%3===0?[pos[i]*.35,pos[i+2]*.35]:[]),2));ground.computeVertexNormals();ground.userData.closedGroundVolume=true;b.put(ground,soil);g.dispose();
  // One low masonry course bears directly on the 4.65m shoulder. Its 5.10m
  // top is exactly the existing tower footing's lower face.
  b.box(0,(shoulder+plinthBottom)/2,0,8.18,plinthBottom-shoulder,8.18,'stone');
  for(let side=0;side<4;side++)b.at([0,0,0],side*Math.PI/2,()=>{
   for(let i=0;i<8;i++)b.box(-3.675+i*1.05,4.875,4.085,1.025,.44,.23,'stone',0,.82+random()*.25);
   b.box(0,5.075,4.10,8.4,.05,.35,'lightstone');
  });
  for(let i=0;i<31;i++){const u0=start+(end-start)*i/31,u1=start+(end-start)*(i+1)/31,top=plinthBottom*(i+1)/31;b.box((u0+u1)/2,(top-.12)/2,0,u1-u0+.006,top+.12,flightWidth,'stone',0,.82+random()*.22);b.box((u0+u1)/2,top-.016,0,u1-u0,.032,flightWidth+.05,'lightstone');}
  const gallery=plinthBottom+layout.pagoda.scale[1]*(.8+.19+.075/2);
  for(let i=0;i<6;i++){const u0=end+1.60*i/6,u1=end+1.60*(i+1)/6,top=plinthBottom+(gallery-plinthBottom)*(i+1)/6;b.box((u0+u1)/2,(top+plinthBottom)/2,0,u1-u0+.006,top-plinthBottom,flightWidth,'stone');b.box((u0+u1)/2,top-.014,0,u1-u0,.028,flightWidth+.05,'lightstone');}
  // Low contour courses retain planted shoulders; there is no exposed 5m wall.
  for(let side of[-1,1])for(let i=0;i<9;i++){const u=side*(5.55+.18*Math.sin(i)),v=-3.7+i*.90,h=height(u,v);b.put(rockGeo,hillsideRock,[u,h-.04,v],[.48,.24,.48],[0,random()*3,0],.82+random()*.25);}
  for(let i=0;i<170;i++){
   const u=-12+random()*24,v=-10+random()*20,r=Math.pow((Math.abs(u)/12)**4+(Math.abs(v)/10)**4,.25);
   if(r<.48||r>.97||(u<end&&u>start&&Math.abs(v)<1.28))continue;
   const h=height(u,v),s=.23+random()*.48;b.put(rockGeo,random()<.28?mats.moss:hillsideRock,[u,h+s*.20,v],[s,s*(.58+random()*.25),s*(.7+random()*.5)],[random()*.2,random()*6.28,random()*.25],.72+random()*.32);
  }
  for(let i=0;i<72;i++){
   const u=-11.5+random()*23,v=-9.5+random()*19,r=Math.pow((Math.abs(u)/12)**4+(Math.abs(v)/10)**4,.25);
   if(r<.48||r>.96||(u<end&&u>start&&Math.abs(v)<1.3))continue;
   const h=height(u,v),size=.45+random()*.65;
   for(let stem=0;stem<10;stem++){const a=stem*2.4+random()*.3,reach=size*(.3+random()*.35),tip=[u+Math.cos(a)*reach,h+size*(.42+random()*.35),v+Math.sin(a)*reach];b.line([u,h-.02,v],tip,.012,'trunk');
    for(let j=1;j<=16;j++){const t=j/16,sign=j%2?1:-1,s=.26+random()*.17;b.put(leaf,'leaf',[u+(tip[0]-u)*t,h+(tip[1]-h)*t,v+(tip[2]-v)*t],[s,s,s],[.25,a+sign*.8,sign*.2],.75+random()*.35);}}
  }
 });
 return {group:b.finish(),stats:{closedGroundVolume:true,groundBottom:-.92,groundJoin:-.12,siteGroundHalfExtent:60,raisedHillHalfExtent:[12,10],shoulderY:shoulder,footingContactY:plinthBottom,galleryLandingY:plinthBottom+layout.pagoda.scale[1]*(.8+.19+.075/2),mainSteps:31,upperSteps:6,instances:b.count,buckets:b.buckets.size,worldCentre:[cx,cz],yaw}};
}
