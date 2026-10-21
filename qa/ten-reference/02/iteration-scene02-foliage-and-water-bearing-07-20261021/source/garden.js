import {T,V,mix,rand,Builder,gridGeometry} from './kernel.js';
import {buildForegroundStoneLantern120,foregroundLanternFootprint120} from './foreground-stone-lantern120.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {loadScannedGardenStones} from './scanned-garden-stones.js';
import {buildRootedCanopy142} from './rooted-canopy142.js';
import {createGardenPines145} from './garden-pines145.js';
export async function buildGarden(mats){
 const scanned=await loadScannedGardenStones();let scannedRockPlacements=0;
 for(const [i,stone]of scanned.variants.entries()){mats['scannedGardenDry'+i]=stone.dry;mats['scannedGardenWet'+i]=stone.wet;}
 const b=new Builder(mats),lights=[],gardenPines=createGardenPines145(b,mats);mats.rock=mats.stone.clone();mats.rock.color.setHex(0x77786f);mats.rock.roughness=.92;mats.rock.metalness=0;mats.rock.flatShading=true;mats.pondBed=mats.moss.clone();mats.pondBed.name='scene02-muted-pond-bed';mats.pondBed.color.setHex(0x3b4236);mats.pondBed.roughness=.98;
 const leafGeo=(()=>{let p=[0,0,0,-.5,.06,.3,-.36,.08,.75,0,.02,1,.36,.08,.75,.5,.06,.3],idx=[0,1,2,0,2,3,0,3,4,0,4,5];let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;})();mats.leaf.side=mats.leaflight.side=mats.pink.side=mats.pinkDark.side=T.DoubleSide;
 const petalGeo=(()=>{let rows=Array.from({length:9},(_,j)=>Array.from({length:7},(_,i)=>{let t=j/8,s=-1+2*i/6;return[s*Math.sin(Math.PI*t)*.38,.65*t*t+.13*Math.sin(Math.PI*t)*(1-s*s),t];}));return gridGeometry(rows);})();
 function rock(x,y,z,r=1){
  // Retain the prior random-draw sequence and footprint, but place an actual
  // eroded scan on its lowest transformed point, partially embedded in soil.
  const sx=r*(.76+rand()*.53),sy=r*(.46+rand()*.30),sz=r*(.72+rand()*.55),rotation=[(rand()-.5)*.92,rand()*6.28,(rand()-.5)*.78],variant=Math.floor(rand()*7)%scanned.variants.length,stone=scanned.variants[variant],scale=[sx,sy/.62,sz],tint=.78+rand()*.34;
  const matrix=new T.Matrix4().compose(new T.Vector3(),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),V(scale)),p=stone.geometry.attributes.position,v=new T.Vector3();let bottom=Infinity,top=-Infinity;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);bottom=Math.min(bottom,v.y);top=Math.max(top,v.y);}
  const base=y-bottom-r*.065,material=y<.12?stone.wet:stone.dry;
  b.put(stone.geometry,material,[x,base,z],scale,rotation,tint);scannedRockPlacements++;
  // The scan already contains attached moss; consume the old cap's draws
  // without restoring an opaque floating polygon moss lid.
  if(rand()<.42){rand();rand();rand();rand();rand();}
  if(rand()<.14)leafCluster(x+(rand()-.5)*sx*.18,base+top-.025,z+(rand()-.5)*sz*.18,sx*.20,sy*.12,sz*.19,18);
 }
 const twigGeo=new T.CylinderGeometry(1,1,1,6);function branch(a,c,r){const len=V(a).distanceTo(V(c));if(r>.045&&len>1){let last=a;for(let j=1;j<=4;j++){let t=j/4,p=[mix(a[0],c[0],t)+Math.sin(t*Math.PI)*len*.05*Math.sin(c[2]*3),mix(a[1],c[1],t),mix(a[2],c[2],t)+Math.sin(t*Math.PI)*len*.055*Math.cos(c[0]*2)];b.line(last,p,r*(1-.35*t),'trunk');last=p;}}else b.line(a,c,r,'trunk',false,r,r<.05?twigGeo:null);}
 let canopyLeafScale=1;
 function leafCluster(x,y,z,rx,ry,rz,n=100){
  // Sparse terminal shoots make each plant read as an irregular rounded mass,
  // with individual leaves turned through depth instead of repeating flat fans.
  const shoots=Math.max(8,Math.ceil(Math.sqrt(n)*1.45)),perShoot=Math.max(4,Math.ceil(n/shoots*.62));
  for(let j=0;j<shoots;j++){
   const a=j*2.399+rand()*.58,u=rand()*1.72-.86,f=Math.sqrt(1-u*u),q=.58+.42*Math.cbrt(rand());
   const tip=[x+Math.cos(a)*f*rx*q,y+u*ry*q,z+Math.sin(a)*f*rz*q],elbow=[mix(x,tip[0],.52)+rand()*.06,mix(y,tip[1],.5)+ry*.08,mix(z,tip[2],.52)+rand()*.06];
   branch([x,y-ry*.16,z],elbow,.010+rx*.0018);branch(elbow,tip,.006+rx*.0008);
   const sideAxis=a+Math.PI*.5;
   for(let k=0;k<perShoot;k++){
    const t=.18+.78*(k+.5)/perShoot,side=(k%2?1:-1)*( .7+rand()*.7),s=(.075+rand()*.09)*canopyLeafScale;
    const p=[mix(elbow[0],tip[0],t)+Math.cos(sideAxis)*side*s*.55,mix(elbow[1],tip[1],t)+(rand()-.5)*ry*.16,mix(elbow[2],tip[2],t)+Math.sin(sideAxis)*side*s*.55];
    b.put(leafGeo,rand()<.18?'leaflight':'leaf',p,[s*(.78+rand()*.48),s*.72,s*(1.10+rand()*.72)],[-.85+rand()*1.55,a+side*.55+(rand()-.5)*.8,rand()*6.28],.72+rand()*.52);
   }
  }
 }
 function shrub(x,y,z,r=1,flower=false){
  const lobes=5+Math.floor(rand()*2);
  for(let j=0;j<lobes;j++){const a=j*6.283/lobes+rand()*.52,d=r*(.20+rand()*.32),cy=y+r*(.28+rand()*.30);leafCluster(x+Math.cos(a)*d,cy,z+Math.sin(a)*d,r*(.40+rand()*.16),r*(.34+rand()*.20),r*(.38+rand()*.18),36+Math.floor(rand()*20));}
  if(flower)for(let j=0;j<2+Math.floor(rand()*2);j++){const a=rand()*6.283,u=rand()*1.6-.8,f=Math.sqrt(1-u*u),q=Math.cbrt(rand()),p=[x+Math.cos(a)*f*r*.42*q,y+r*(.36+u*.24)*q,z+Math.sin(a)*f*r*.42*q];blossomCluster(p[0],p[1],p[2],r*.23,r*.22,r*.23,5+Math.floor(rand()*5));}
 }
 function shorelineShrub(x,z,r=.55){
  // Two low, connected leaf masses meet the wet bank instead of hovering as a broad crown.
  for(let j=0;j<2;j++){
   const a=j*2.4+.35,ox=Math.cos(a)*r*.18,oz=Math.sin(a)*r*.18;
   branch([x+ox,0,z+oz],[x+ox,.22*r,z+oz],.018);
   leafCluster(x+ox,.43*r,z+oz,r*.42,r*.44,r*.42,36);
  }
 }
 function smallFlowerCluster(x,z,r=.5,count=4){
  const colors=['pink','petal','pinkDark'];
  for(let j=0;j<count;j++){
   const a=rand()*6.28,d=Math.sqrt(rand())*r*.58,px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;
   const top=.11+rand()*.10,petal=.038+rand()*.022,material=colors[Math.floor(rand()*colors.length)],petals=4+(j%3);
   b.line([px,.012,pz],[px,top,pz],.008,'leaf');b.ball(px,top,pz,.018,.014,.018,'gold');
   for(let k=0;k<petals;k++)b.put(petalGeo,material,[px,top,pz],[petal,petal,petal*1.25],[.24,k*6.28/petals+a*.12,0]);
  }
 }
 function fern(x,y,z,s=.8){
  const fronds=5+Math.floor(rand()*3);
  for(let j=0;j<fronds;j++){
   const a=j*6.283/fronds+rand()*.38,len=s*(.70+rand()*.52),tip=[x+Math.cos(a)*len*.43,y+len*(.56+rand()*.25),z+Math.sin(a)*len*.43];
   branch([x,y,z],tip,.010*s);
   for(let k=1;k<=6;k++){
    const t=k/7,px=mix(x,tip[0],t),py=mix(y,tip[1],t),pz=mix(z,tip[2],t),width=s*(.22*(1-t)+.065);
    for(const side of[-1,1]){
     const aa=a+side*(.64+rand()*.24),leafLen=width*(.95+rand()*.5),rot=[-.12+rand()*.8,aa,rand()*6.283];
     b.put(leafGeo,rand()<.32?'leaflight':'leaf',[px+Math.cos(aa)*leafLen*.22,py+.025*s,pz+Math.sin(aa)*leafLen*.22],[width*.42,width*.36,leafLen],rot,.72+rand()*.5);
    }
   }
  }
 }
 function tree(x,z,h=5,r=3,pine=false){if(pine)return gardenPines.add(x,z,h,r*.84);const base=.1,lean=(rand()-.5)*1.1,top=[x+lean,h,z+.2];branch([x,base,z],[x+.2,h*.52,z],.16+h*.015);branch([x+.2,h*.52,z],top,.09+h*.006);
  for(let j=0;j<8;j++){let a=j*2.4+(rand()-.5)*.4,y=h*(.45+j*.055),reach=r*(.7+rand()*.4),end=[x+Math.cos(a)*reach,y+.35+rand()*.35,z+Math.sin(a)*reach],start=[x+lean*.5,y-.5,z];branch(start,end,.055+j*.002);let last=end;for(let k=0;k<3;k++){let aa=a+(k-1)*.6,p=[end[0]+Math.cos(aa)*r*.35,end[1]+.35,end[2]+Math.sin(aa)*r*.35];branch(end,p,.02);last=p;leafCluster(p[0],p[1],p[2],r*.34,pine?.58:r*.30,r*.34,125);} }
  leafCluster(top[0],top[1],top[2],r*.52,pine?.58:r*.43,r*.52,190);
 }
 function prunedPine(x,z,h=2.5,r=1.25){
  const lean=(rand()-.5)*.22;branch([x,.02,z],[x+lean*.45,h*.55,z],.085);branch([x+lean*.45,h*.55,z],[x+lean,h*.94,z+.04],.037);
  for(let tier=0;tier<4;tier++){
   const cy=h*(.25+tier*.17),arms=tier===0?5:4,reach=r*(1-tier*.13)*(.84+rand()*.26);
   for(let j=0;j<arms;j++){
    const a=j*6.283/arms+tier*.51+(rand()-.5)*.35,start=[x+lean*cy/h,cy,z],mid=[start[0]+Math.cos(a)*reach*.58,cy+.10*h/4,start[2]+Math.sin(a)*reach*.58],tip=[x+lean*cy/h+Math.cos(a)*reach,cy+.16*h/4,z+Math.sin(a)*reach];
    branch(start,mid,.022);branch(mid,tip,.012);
    for(let k=0;k<2;k++){const aa=a+(k?1:-1)*(.28+rand()*.20),end=[tip[0]+Math.cos(aa)*reach*.20,tip[1]+.035*h,tip[2]+Math.sin(aa)*reach*.20];branch(tip,end,.009);leafCluster(end[0],end[1],end[2],reach*.31,.28*h/4,reach*.27,88);}
   }
  }
 }
 function blossomCluster(x,y,z,rx,ry,rz,count=22){
  for(let i=0;i<count;i++){
   if(rand()<.12)continue;
   const u=rand()*2-1,a=rand()*6.283,f=Math.sqrt(1-u*u)*Math.cbrt(rand()),p=[x+Math.cos(a)*f*rx,y+u*f*ry,z+Math.sin(a)*f*rz],petals=4+(rand()<.42?1:0),size=.048+rand()*.034;
   for(let k=0;k<petals;k++){
    const angle=rand()*6.283+k*6.283/petals,material=rand()<.19?'pinkDark':'pink';
    b.put(petalGeo,material,[p[0]+Math.cos(angle)*size*.17,p[1]+(rand()-.5)*size*.3,p[2]+Math.sin(angle)*size*.17],[size*(.72+rand()*.58),size*(.68+rand()*.62),size*(1.05+rand()*.62)],[-.50+rand()*1.22,angle+rand()*.55,-1.1+rand()*2.2],.70+rand()*.58);
   }
  }
 }
 function cherry(x,z,h=5,r=3){
  const trunkTop=[x+.22,h*.61,z+.08];branch([x,.05,z],trunkTop,.16);
  const limbs=9;
  for(let j=0;j<limbs;j++){
   const a=j*6.283/limbs+(rand()-.5)*.46,baseY=h*(.25+rand()*.44),reach=r*(.48+rand()*.58),root=[x+.22,h*(.34+rand()*.25),z],elbow=[x+Math.cos(a)*reach*.48,baseY+h*(.02+rand()*.20),z+Math.sin(a)*reach*.48],tip=[x+Math.cos(a)*reach,baseY+h*(-.07+rand()*.28),z+Math.sin(a)*reach];
   branch(root,elbow,.050+rand()*.020);branch(elbow,tip,.026+rand()*.012);
   // Small flowering twigs make rounded, separated blossom clumps around the
   // branch tips. Open air remains visible between bough groups.
   for(let k=0;k<3;k++){
    const aa=a+(k===0?-.40:.40)+(rand()-.5)*.22,len=r*(.18+rand()*.17),cy=baseY+h*(-.05+rand()*.20),sub=[tip[0]+Math.cos(aa)*len,cy,tip[2]+Math.sin(aa)*len];
    branch(tip,sub,.012+rand()*.006);
    if(rand()>.13)blossomCluster(sub[0],sub[1],sub[2],.46+rand()*.20,.44+rand()*.22,.46+rand()*.20,28+Math.floor(rand()*14));
   }
   if(j%2===0){const mid=[mix(elbow[0],tip[0],.58),mix(elbow[1],tip[1],.58)+(rand()-.5)*h*.12,mix(elbow[2],tip[2],.58)];branch(elbow,mid,.016);blossomCluster(mid[0],mid[1],mid[2],.30,.34,.31,12+Math.floor(rand()*6));}
  }
 }
 function plantedTerrace(side,z0,z1,count=22){
  // Overlapping talus courses rise away from the wet edge and root at the
  // terrain instead of forming one evenly spaced line of rounded stones.
  for(let row=0;row<3;row++){
   const rowCount=Math.max(11,count-row*3),phase=rand()*6.283;
   for(let i=0;i<rowCount;i++){
    if(rand()<.16+row*.035)continue;
    const t=(i+.12+rand()*.76)/rowCount,z=z0+(z1-z0)*t+(rand()-.5)*.92,xBase=(side<0?-9.3:9.7)+side*row*.86;
    const x=xBase+Math.sin(z*.46+row*1.7+phase)*(.42+row*.13)+(rand()-.5)*.76,ground=.07+row*.27+.12*Math.sin(z*.72+row*.9+phase),r=.34+rand()*.56+(row===0?.10:0);
    rock(x,ground,z,r);
    if(rand()<.72)rock(x-side*(.24+rand()*.45),ground+.015,z+.25+(rand()-.5)*.52,r*(.38+rand()*.28));
    if(i%3===0)fern(x+side*.30,ground,z+.10,.60+rand()*.40);
    if(row>0&&i%4===1)shrub(x+side*.28,ground+.08,z-.15,.38+rand()*.29,row===2&&rand()<.45);
   }
  }
 }
 // A muted shallow basin sits beneath the bounded irregular pond surface.
 // Its olive-gray bed avoids a black rectangle showing through gaps between highlights.
 b.box(-8,-.52,11,49,.8,58,'pondBed');b.box(6,-.23,1.0,14,.26,7,'pondBed');
 plantedTerrace(-1,-1.5,21.0,18);plantedTerrace(1,-1.4,17.0,16);
 const islands=[[-5.8,0,9.3,.78],[8.3,0,5.5,1.25],[4.6,0,13.5,.55],[-9,0,1.8,1.1]];
 for(let [x,y,z,r]of islands){b.put(b.lowSphere,'moss',[x,-.05,z],[r*1.45,.35,r]);for(let i=0;i<7;i++){let a=rand()*6.28,rr=r*(.6+rand()*.55);rock(x+Math.cos(a)*rr,.05,z+Math.sin(a)*rr,.20+rand()*.38);}for(let i=0;i<3;i++)shrub(x+(rand()-.5)*r*1.2,.2,z+(rand()-.5)*r*1.1,r*.30+rand()*.25,i%2===0);}
 // Garden height is deliberately varied: dense low flowers, articulated rocks, pruned pines and blossom canopies.
 tree(-6.5,-.5,5.6,3.1,true);tree(-20,-4,7,3.5,true);tree(8.5,2.0,3.6,1.8,true);b.at([12.5,.04,-2],0,()=>b.at([-10,0,3],0,()=>tree(10,-3,6,3,true)),[.70,3.5/6,.70]);tree(-2,1,3.8,1.9,true);
 // Smaller pruned pines bridge the height change from talus to mature canopy.
  prunedPine(-14.2,4.0,2.5,1.15);prunedPine(-15.6,10.0,2.8,1.30);prunedPine(-12.8,16.0,2.35,1.08);prunedPine(11.8,8.0,2.25,.98);
 cherry(15,0,5.8,3.3);cherry(-10,0,4.4,2.8);cherry(9,-4,5,2.8);
 // Tighter clumps at both ends of the bridge keep the far-bank planting legible.
 const bridgeBankClumps=[[-7.8,.8,.54],[-6.0,2.0,.46],[-4.4,3.2,.50],[7.2,.5,.50],[8.5,1.8,.44],[6.9,3.1,.48]];
 for(let j=0;j<bridgeBankClumps.length;j++){
  const [x,z,r]=bridgeBankClumps[j];shorelineShrub(x,z,r);
  if(j%2===0)shorelineShrub(x+(x<0?.55:-.48),z+.42,r*.76);
  smallFlowerCluster(x+(x<0?.34:-.32),z+.14,r*.9,3+j%3);
 }
 // Tiered rock-and-flower planting climbs the high terrace on both sides of the stair.
 for(let side of[-1,1])for(let j=0;j<18;j++){let z=-1+rand()*6,x=4+side*(3.8+rand()*3.0),y=2.8*(1-(z+1)/6);rock(x,y*.68,z,.38+rand()*.4);shrub(x,y,z,.4+rand()*.35,j%3===0);}
 const grass=gridGeometry(Array.from({length:7},(_,j)=>{let t=j/6;return[[-.5*Math.sin(Math.PI*t),t,.35*t*t],[.5*Math.sin(Math.PI*t),t,.35*t*t]];}));
 for(let j=0;j<90;j++){let z=rand()*17,x=9.6+rand()*.9;for(let k=0;k<18;k++){let a=rand()*6.28,r=rand()*.24;b.put(grass,k%4?'leaf':'leaflight',[x+Math.cos(a)*r,.24,z+Math.sin(a)*r],[.02+rand()*.025,.16+rand()*.25,.2+rand()*.15],[-.48+rand()*.96,a+(rand()-.5)*.36,(rand()-.5)*1.10]);}}
 // Connected mature framing tree is rooted in the same bank rather than
 // a long unbranched rod terminating in detached spherical leaf clumps.
 const rootedCanopy=buildRootedCanopy142(b,mats);tree(-28,-8,10,3.2,false);
 b.put(b.lowSphere,'moss',[-7.74,-.13,10.6],[2.1,.52,2.4]);
 for(let k=0;k<12;k++){const a=k*Math.PI/6;rock(-7.74+Math.cos(a)*1.65,.02,10.6+Math.sin(a)*1.85,.38+rand()*.20);}

 // Broken azalea-and-fern pockets climb the stair shoulders without making a pink shelf.
 for(let s of[-1,1])for(let i=0;i<10;i++){
  let z=1+rand()*6,x=4+s*(3.8+rand()*3.5),y=.20+rand()*.38,r=.34+rand()*.42;
  rock(x,y,z,r);if(i%2===0)fern(x+s*.28,y,z+.12,.55+rand()*.35);
  shrub(x+s*.13,y+.18,z,.40+rand()*.46,i%4===0);
 }
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
 const foregroundStoneLantern=buildForegroundStoneLantern120({b,mats});lights.push(foregroundStoneLantern.light);stoneLantern(10.4,5.9,3.0,.92);stoneLantern(-22,0,3.0,.8);
 // Lotus leaves are shallow ribbed basins with a radial slit, cupped rim and raised midribs.
 const lotusGeo=(()=>{let rings=7,N=36,rows=[];for(let j=0;j<=rings;j++){let t=.012+.988*j/rings;rows.push(Array.from({length:N+1},(_,i)=>{let a=.13+(Math.PI*2-.26)*i/N,r=t*(1+.035*Math.sin(a*7));return[Math.cos(a)*r,.045*Math.sin(a*7)*t*t+.14*Math.pow(t,5)-.055*(1-t),Math.sin(a)*r];}));}return gridGeometry(rows);})();
 const lotusMaterials=[0x53701e,0x688025,0x3b5b1a,0x87923a].map(c=>new T.MeshStandardMaterial({color:c,roughness:.40,side:T.DoubleSide}));
 let culledPondPlantsForSolidFooting=0,culledPondPlantsForOpenChannel=0,plantedLotusPads=0;
 const corridorHalfWidth=1.55,bedStations=[5.6,8.1,10.6,13.1,15.6,18.1,20.6,23.1],lotusBeds=[];
 for(let station=0;station<bedStations.length;station++){
  const z=bedStations[station],channelCenter=.4+.22*(z-5);
  // Inner beds hug both sides of the reflected lane; the veranda-side bed tapers out as the pond narrows.
  lotusBeds.push({x:channelCenter-2.55,z,count:20,kind:station});
  if(station<6)lotusBeds.push({x:channelCenter+2.55,z,count:20,kind:station+8});
  // A second, looser bed continues along the broad left reach of the pond.
  lotusBeds.push({x:-5.8+(z-5.6)*.075,z,count:12,kind:station+16});
 }
 for(let bedIndex=0;bedIndex<lotusBeds.length;bedIndex++){
  const bed=lotusBeds[bedIndex];
  for(let j=0;j<bed.count;j++){
   const a=rand()*6.28,rho=Math.sqrt(rand()),shape=.82+rand()*.30;
   const x=bed.x+Math.cos(a)*.66*rho*shape,z=bed.z+Math.sin(a)*1.28*rho;
   const s=.25+rand()*.21,y=.024+rand()*.025,yaw=rand()*6.28,aspect=.86+rand()*.28;
   const channelCenter=.4+.22*(z-5),inOpenChannel=z>4&&z<24&&Math.abs(x-channelCenter)<corridorHalfWidth+s*.52;
   const underLantern=foregroundLanternFootprint120(x,z,s*.45),clear=!underLantern&&!inOpenChannel,bloomRoll=rand(),bloomHeight=rand();
   // Every candidate consumes the same draws before either rejection, keeping the seeded garden repeatable.
   if(clear){
    b.put(lotusGeo,lotusMaterials[(bed.kind+j)%4],[x,y,z],[s*aspect,s,s],[0,yaw,0]);plantedLotusPads++;
    if(j%4===0)b.at([x,y+.006,z],yaw,()=>{for(let k=0;k<8;k++){const aa=.22+k*.74;b.line([0,-.035,0],[Math.cos(aa)*s*.82,.06*s,Math.sin(aa)*s*.82],.0035,'leaflight');}});
    if(bloomRoll<.075){const fy=y+.16+bloomHeight*.10;b.line([x,y,z],[x,fy,z],.010,'leaf');b.ball(x,fy,z,.036,.029,.036,'gold');for(let ring=0;ring<3;ring++){const N=ring===0?6:9;for(let k=0;k<N;k++)b.put(petalGeo,ring===2?'pinkDark':'petal',[x,fy,z],[.075+ring*.018,.16,.14+ring*.02],[.28+ring*.18,k*6.28/N+ring*.3,0]);}}
   }else if(underLantern)culledPondPlantsForSolidFooting++;else if(inOpenChannel)culledPondPlantsForOpenChannel++;
  }
 }
 // Low, layered bank growth and compact blossoms frame the pads while leaving a clear three-metre water path.
 const shorelineStations=[5.7,8.2,10.7,13.2,15.7,18.2,20.7,23.0];
 for(let i=0;i<shorelineStations.length;i++){
  const z=shorelineStations[i],c=.4+.22*(z-5),outerX=-7.6+(z-5.7)*.105;
  shorelineShrub(outerX,z+.18,.48+(i%3)*.035);
  if(i%2===0)shorelineShrub(outerX+.62,z-.42,.39);
  smallFlowerCluster(outerX+.48,z+.46,.52,3+i%3);
  if(i<6){
   const rightX=c+4.05;
   shorelineShrub(rightX,z-.22,.43+(i%2)*.05);
   smallFlowerCluster(rightX-.36,z+.34,.46,3+(i+1)%3);
  }
 }
 // Low sun picks up broken, directional ripple facets along the open water lane.
 // These are real shallow water-surface strips, not a screen-space sparkle texture.
 mats.pondGlint=new T.MeshBasicMaterial({name:'scene02-amber-water-glints',color:0xffae4f,transparent:true,opacity:.15,depthWrite:false,toneMapped:false});
 const glintStrip=new T.BoxGeometry(1,.006,1),flowYaw=-Math.atan2(1,.22);
 for(let i=0;i<360;i++){
  const z=i<220?4.5+rand()*20:8+rand()*17,center=.4+.22*(z-5),x=i<220?center+(rand()-.5)*5.2:-22+rand()*12;
  const length=.11+rand()*.34,width=.010+rand()*.020,yaw=flowYaw+(rand()-.5)*.34,brightness=.48+rand()*.43;
  b.put(glintStrip,mats.pondGlint,[x,.022,z],[length,1,width],[0,yaw,0],brightness);
 }
 // Terrain silhouettes: true finite ridges, then several layers of distant woodland.
 const mountainMat=new T.MeshStandardMaterial({color:0x45533a,roughness:1,map:mats.stone.map,bumpMap:mats.stone.bumpMap,bumpScale:.16});
 const ridgeTop=(x,layer)=>10+layer*2+12*Math.exp(-(((x+66)/34)**2))+1.4*Math.sin(x*.15+layer)+.65*Math.sin(x*.57);
 const mountainSurface=(x,z,layer,zbase)=>{const t=Math.max(0,Math.min(1,(zbase-z)/28.8)),shape=Math.pow(Math.sin(Math.PI*t),.8);return -1+shape*(ridgeTop(x,layer)+1)+shape*.65*Math.sin(x*.43+t*24*.81);};
 let mountainCanopyTrees=0,forestSeed=0x4217a29d;
 const forestRand=()=>{forestSeed=(Math.imul(forestSeed,1664525)+1013904223)>>>0;return forestSeed/4294967296;};
 const branchUnit=new T.CylinderGeometry(1,1,1,5,1),canopyUnit=new T.SphereGeometry(1,10,8);
 const canopyPosition=canopyUnit.attributes.position;
 for(let i=0;i<canopyPosition.count;i++){const x=canopyPosition.getX(i),y=canopyPosition.getY(i),z=canopyPosition.getZ(i),r=1+.10*Math.sin(x*5.3+z*3.7)*Math.cos(y*4.6-z*2.8)+.035*Math.sin(x*11.2+y*8.7+z*5.4);canopyPosition.setXYZ(i,x*r,y*r,z*r);}
 canopyUnit.computeVertexNormals();
 function movedPart(base,position,scale,rotation=[0,0,0]){const g=base.clone(),q=new T.Quaternion().setFromEuler(new T.Euler(...rotation));g.applyMatrix4(new T.Matrix4().compose(V(position),q,V(scale)));return g;}
 function joinedParts(parts){
  const prepared=parts.map(g=>{if(g.index){const flat=g.toNonIndexed();g.dispose();return flat;}return g;});
  const merged=mergeGeometries(prepared,false);for(const g of prepared)g.dispose();
  if(!merged)throw Error('Unable to merge mountain tree geometry.');return merged;
 }
 function addBranch(parts,a,c,r){
  const start=V(a),end=V(c),axis=end.clone().sub(start),q=new T.Quaternion().setFromUnitVectors(V([0,1,0]),axis.clone().normalize());
  const g=branchUnit.clone();g.applyMatrix4(new T.Matrix4().compose(start.add(end).multiplyScalar(.5),q,V([r,axis.length(),r])));parts.push(g);
 }
 const forestVariants=Array.from({length:16},(_,variant)=>{
  const branches=[],dark=[],lit=[],tiers=3+variant%4,phase=forestRand()*Math.PI*2;
  addBranch(branches,[0,0,0],[.008,.94,.015],.018+variant*.0008);
  for(let tier=0;tier<tiers;tier++){
   const t=tier/Math.max(1,tiers-1),cy=.23+.61*t+(forestRand()-.5)*.10,arms=3+(variant+tier*2)%4,spread=.48*(1-.14*t)*(.72+forestRand()*.56);
   for(let arm=0;arm<arms;arm++){
    const a=phase+arm*Math.PI*2/arms+tier*.43+(forestRand()-.5)*.62,reach=spread*(.77+forestRand()*.52),start=[0,cy-.075,0],middle=[Math.cos(a)*reach*.55,cy-.01+forestRand()*.09,Math.sin(a)*reach*.55],tip=[Math.cos(a)*reach,cy+.012+forestRand()*.11,Math.sin(a)*reach];
    addBranch(branches,start,middle,.006+forestRand()*.003);addBranch(branches,middle,tip,.004+forestRand()*.002);
    const crown=[tip[0]+Math.cos(a)*.045,tip[1]+.025,tip[2]+Math.sin(a)*.045],size=.13+forestRand()*.10,scale=[size*(.92+forestRand()*.82),size*(.48+forestRand()*.72),size*(.88+forestRand()*.76)];
    (forestRand()<.27?lit:dark).push(movedPart(canopyUnit,crown,scale,[forestRand()*.25,a,forestRand()*.35]));
    if(forestRand()<.72){const inner=[middle[0]*.72,middle[1]+.035,middle[2]*.72],small=.082+forestRand()*.048;(forestRand()<.28?lit:dark).push(movedPart(canopyUnit,inner,[small,small*.88,small],[forestRand()*.35,a+.5,forestRand()*.4]));}
   }
  }
  for(let j=0;j<3;j++){const a=phase+j*Math.PI*2/3,cy=.79+j*.055,rad=.11+forestRand()*.035,p=[Math.cos(a)*.065,cy,Math.sin(a)*.065];(j===1?lit:dark).push(movedPart(canopyUnit,p,[rad*.9,rad*1.18,rad],[.2,a,forestRand()*.4]));}
  return{branches:joinedParts(branches),dark:joinedParts(dark),lit:joinedParts(lit)};
 });branchUnit.dispose();canopyUnit.dispose();
 const nearPine=mats.leaf.clone(),nearPineLight=mats.leaflight.clone(),middlePine=mats.leaf.clone(),middlePineLight=mats.leaflight.clone(),farPine=mats.leaf.clone(),farPineLight=mats.leaflight.clone();
 nearPine.name='scene02-opaque-near-woodland';nearPine.color.setHex(0x233b2c);nearPine.roughness=.94;nearPine.side=T.FrontSide;
 nearPineLight.name='scene02-near-woodland-sunlit-sprays';nearPineLight.color.setHex(0x43573a);nearPineLight.roughness=.94;nearPineLight.side=T.FrontSide;
 middlePine.name='scene02-mid-distance-pine';middlePine.color.setHex(0x35443b);middlePine.roughness=.96;
 middlePineLight.name='scene02-mid-distance-pine-tips';middlePineLight.color.setHex(0x4a5948);middlePineLight.roughness=.96;
 farPine.name='scene02-atmospheric-pine';farPine.color.setHex(0x4c5856);farPine.roughness=.98;
 farPineLight.name='scene02-atmospheric-pine-tips';farPineLight.color.setHex(0x626d67);farPineLight.roughness=.98;
 Object.assign(mats,{mountainNearPine:nearPine,mountainNearPineLight:nearPineLight,mountainMidPine:middlePine,mountainMidPineLight:middlePineLight,mountainFarPine:farPine,mountainFarPineLight:farPineLight});
 const forestMaterials=[[nearPine,nearPineLight],[middlePine,middlePineLight],[farPine,farPineLight]];
 const mountainRows=[9,8,7],mountainColumns=64,mountainDensity=[.90,.85,.78];
 for(let layer=0;layer<3;layer++){
  const z=-34-layer*30,rows=Array.from({length:25},(_,j)=>Array.from({length:111},(_,i)=>{const x=-110+i*2,t=j/24,crest=ridgeTop(x,layer),shape=Math.pow(Math.sin(Math.PI*t),.8);return[x,-1+shape*(crest+1)+shape*.65*Math.sin(x*.43+j*.81),z-j*1.2];}));
  const g=gridGeometry(rows),m=mountainMat.clone();m.color.lerp(new T.Color(0xb39a76),layer*.24);m.side=T.DoubleSide;b.put(g,m);
  const rowN=mountainRows[layer],density=mountainDensity[layer],baseHeight=[3.8,2.8,1.9][layer],heightRange=[3.2,2.4,1.65][layer];
  for(let row=0;row<rowN;row++)for(let col=0;col<mountainColumns;col++){
   const x=-108+col*(216/(mountainColumns-1))+(forestRand()-.5)*2.8,t=.10+row*(.80/Math.max(1,rowN-1))+(forestRand()-.5)*.11,zt=z-t*28.8+(forestRand()-.5)*1.55;
   const patch=.5+.5*Math.sin(x*.085+layer*1.7)*Math.cos(zt*.13-layer*.8);if(forestRand()>density-.15+patch*.27)continue;
   const sunX=16.2+(-.87/-.75)*(zt-25);if(zt>-78&&zt<-28&&Math.abs(x-sunX)<11.5)continue;
   const y=mountainSurface(x,zt,layer,z),rawHeight=baseHeight+forestRand()*heightRange,cap=Math.max(1.5,ridgeTop(x,layer)+[4.0,3.2,2.3][layer]-y),h=Math.min(rawHeight,cap),spread=.78+forestRand()*.42,variant=Math.floor(forestRand()*forestVariants.length),tree=forestVariants[variant],yaw=forestRand()*Math.PI*2,tint=.84+forestRand()*.32;
   b.put(tree.branches,'trunk',[x,y,zt],[h*spread,h,h*spread*.92],[0,yaw,0],.72+forestRand()*.38);
   b.put(tree.dark,forestMaterials[layer][0],[x,y,zt],[h*spread,h,h*spread*.92],[0,yaw,0],tint);
   b.put(tree.lit,forestMaterials[layer][1],[x,y,zt],[h*spread,h,h*spread*.92],[0,yaw,0],.72+forestRand()*.46);
   mountainCanopyTrees++;
  }
 }
 const matureGardenPines=gardenPines.finish();
 return {group:b.finish(),lights,dispose(){scanned.dispose();},stats:{scannedGardenStones:{...scanned.info,placements:scannedRockPlacements,groundContact:"Actual transformed scan minima with a 6.5 percent radius soil embed; no image projection"},instances:b.count,buckets:b.buckets.size,rootedCanopy,matureGardenPines,foregroundStoneLantern:foregroundStoneLantern.stats,culledPondPlantsForSolidFooting,culledPondPlantsForOpenChannel,plantedLotusPads,lotusBedClusters:lotusBeds.length,mountainCanopyTrees,openWaterCorridor:{centerline:'(0.4,5) to (4.6,24)',halfWidthMetres:corridorHalfWidth,geometry:'clear three-metre reflection channel reserved under the bridge and toward the foreground veranda'}}};
}
