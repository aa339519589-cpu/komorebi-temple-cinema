import * as T from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {TAU,V,rng,noise,lin,surface} from './kernel.js';
import {layout124 as L} from './layout124.js';
import {makeLanternGranite132} from './garden-surface132.js';
import {bankHeight124,solidTerrain124,bridgeSupport124} from './layout-components124.js';
export function garden(B,A){const random=rng(100219),rr=(a,b)=>a+(b-a)*random();
function scanned132(scan,material,...args){B.emit(scan.geometry,material,...args);if(scan.mossGeometry)B.emit(scan.mossGeometry,'moss',...args);}
function site124(x,z){const edge=-.70+.34*Math.sin(x*.72)+.18*Math.sin(x*2.1),t=T.MathUtils.smoothstep(edge-z,0,3.75),original=.055+1.48*t+.12*noise(x*.6,z*.7,381)*t,height=bankHeight124(x,z,original);return{height,raised:height>original+.06};}

// Smooth narrow elliptical leaves with cupped cross sections and a modeled rib.
const foliage=(()=>{const p=[],uv=[],ix=[],N=6;for(let j=0;j<=N;j++){const t=j/N,w=.28*Math.sin(Math.PI*t)**.8;for(let i=0;i<3;i++){const u=-1+i;p.push(u*w,.043*(1-u*u)*Math.sin(Math.PI*t)+.025*t*t,(t-.5)*1.02);uv.push(i/2,t);if(i<2&&j<N){const q=j*3+i;ix.push(q,q+3,q+1,q+1,q+3,q+4);}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;})();
const maple=(()=>{
 // A cupped seven-lobed, serrated blade with a real basal cleft. Its outline
 // and folds are geometry, including in the cast shadow, rather than a card.
 const p=[0,.028,0],uv=[.5,.5],ix=[],N=112;
 for(let i=0;i<N;i++){
  const a=-Math.PI/2+i*TAU/N,delta=Math.atan2(Math.sin(a-Math.PI/2),Math.cos(a-Math.PI/2));
  const lobe=Math.pow(.5+.5*Math.cos(7*(a+Math.PI/2)),.78);
  const r=(.27+.38*lobe)*(1-.82*Math.exp(-Math.pow(delta/.30,2)))*(i%2?.966:1);
  const y=.035*(1-Math.pow(r/.65,2))-.024*Math.cos(a*7)*Math.pow(r/.65,1.4)+.018*Math.sin(a+1)*r;
  const x=Math.cos(a)*r,z=Math.sin(a)*r;p.push(x,y,z);uv.push(.5+x/1.3,.5+z/1.3);
 }
 for(let i=0;i<N;i++)ix.push(0,i+1,(i+1)%N+1);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
})();
const petal=(()=>{const p=[],uv=[],idx=[];const n=7,m=6;for(let j=0;j<=n;j++){const t=j/n,w=Math.sin(Math.PI*t)**.7*.50;for(let i=0;i<=m;i++){const s=-1+2*i/m;p.push(s*w,.36*t*t+.11*s*s*Math.sin(t*Math.PI),t);uv.push(i/m,t);if(i<m&&j<n){const a=j*(m+1)+i;idx.push(a,a+1,a+m+1,a+1,a+m+2,a+m+1);}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;})();
const leafDisc=(()=>{const p=[],uv=[],idx=[],n=60,rings=8;for(let j=0;j<=rings;j++){const t=j/rings;for(let i=0;i<=n;i++){const a=.13+(TAU-.26)*i/n,r=t*(1+.035*Math.sin(a*7)+.016*Math.cos(a*13)),y=.08*(1-t)**2+.025*Math.sin(a*12)*t*t+.035*t**6;p.push(Math.cos(a)*r,y,Math.sin(a)*r);uv.push(.5+.5*Math.cos(a)*r,.5+.5*Math.sin(a)*r);if(i<n&&j<rings){const k=j*(n+1)+i;idx.push(k,k+n+1,k+1,k+1,k+n+1,k+n+2);}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;})();
const trunks=[];
// Each pine shoot has individual slender needles in paired fascicles, rather
// than the broad deciduous blades used by the garden shrubs.
const pineShoot=(()=>{const p=[],uv=[],ix=[];for(let k=0;k<30;k++){
 const a=k*2.399963,t=(k+.5)/30,len=.28+.14*Math.sin(k*4.7),base=V([0,t*.16,0]);
 for(const side of[-1,1]){
  const tip=V([Math.cos(a+side*.06)*len,t*.16+.09+len*.40,Math.sin(a+side*.06)*len]),wide=V([-Math.sin(a)*.0045,0,Math.cos(a)*.0045]);
  const mid=base.clone().lerp(tip,.55);mid.y+=.023;const q=p.length/3;
  for(const v of[base.clone().sub(wide),base.clone().add(wide),mid.clone().sub(wide),mid.clone().add(wide),tip])p.push(...v.toArray());
  uv.push(0,0,1,0,0,.55,1,.55,.5,1);ix.push(q,q+2,q+1,q+1,q+2,q+3,q+2,q+4,q+3);
 }
}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;})();
function branch(points,r,tip=.18,n=12,radial=7){const curve=new T.CatmullRomCurve3(points.map(V)),g=new T.TubeGeometry(curve,n,r,radial,false),p=g.attributes.position;for(let j=0;j<=n;j++){const center=curve.getPointAt(j/n);for(let k=0;k<=radial;k++){const i=j*(radial+1)+k,q=new T.Vector3().fromBufferAttribute(p,i).sub(center).multiplyScalar((1-(1-tip)*j/n)*(1+.055*Math.sin(k*2.7+j*.37)+.040*noise(j*.39,k*.71,132))).add(center);p.setXYZ(i,q.x,q.y,q.z);}}g.computeVertexNormals();g.applyMatrix4(B.stack.at(-1));trunks.push(g);}
function leafCluster(x,y,z,rx,ry,rz,count=250,ma='leaf',scale=.2,mapleLeaf=false,pineNeedle=false){for(let k=0;k<Math.ceil(count*(pineNeedle?.55:mapleLeaf?.40:3.8));k++){const a=rr(0,TAU),q=Math.cbrt(random()),v=rr(-1,1),r=Math.sqrt(1-v*v);const xx=x+rx*Math.cos(a)*r*q,zz=z+rz*Math.sin(a)*r*q,yy=y+ry*v*q;const s=scale*rr(.65,1.25)*(pineNeedle?1.35:mapleLeaf?1.45:.42);B.emit(pineNeedle?pineShoot:mapleLeaf?maple:foliage,pineNeedle?'pineLeaf':mapleLeaf?(ma==='leafLight'?'mapleLight':ma==='leafDark'?'mapleDark':'mapleLeaf'):ma,xx,yy,zz,s,s,s,[rr(-.6,.6),rr(0,TAU),rr(-.35,.35)],rr(.66,1.17));}}
function shrub(x,y,z,r=1,h=.85,flowers=false){const ground=site124(x,z);y=Math.max(y,ground.height+.015);if(ground.raised){h=Math.min(h,1.1);r=Math.min(r,1.65);}B.with(x,y,z,0,()=>{const stems=7;for(let i=0;i<stems;i++){const a=i*2.39996,reach=r*rr(.35,.85),tip=[Math.cos(a)*reach,h*rr(.60,.94),Math.sin(a)*reach];branch([[0,0,0],[tip[0]*.4,h*.6,tip[2]*.4],tip],r*.029,.12,7,5);leafCluster(tip[0],tip[1],tip[2],r*.45,h*.33,r*.45,rr(90,145),'leafDark',r*.20);leafCluster(tip[0],tip[1]+h*.10,tip[2],r*.42,h*.22,r*.42,rr(70,120),'leaf',r*.17);if(flowers)for(let k=0;k<100;k++){const a=rr(0,TAU),d=rr(.08,.38)*r,xx=tip[0]+Math.cos(a)*d,zz=tip[2]+Math.sin(a)*d,yy=tip[1]+h*rr(.22,.40);const s=rr(.020,.040);if(k%2)continue;for(let p=0;p<5;p++){const a=p*TAU/5;B.sphere(xx+Math.cos(a)*s*.7,yy,zz+Math.sin(a)*s*.7,s*.65,s*.28,s*.65,k%3?'pink':'pinkLight');}B.sphere(xx,yy+.018,zz,s*.28,s*.20,s*.28,'pollen');}}});}
function pine(x,y,z,h=4,r=2.2){const ground=site124(x,z);y=Math.max(y,ground.height+.02);B.with(x,y,z,rr(-.4,.4),()=>{const lean=rr(-.6,.6);branch([[0,0,0],[lean*.4,h*.25,.05],[lean,h*.6,-.10],[lean*.8,h,.02]],h*.06,.13,20,9);for(let k=0;k<10;k++){const a=k*2.39996,yy=h*(.30+.065*k),extent=r*(1-k*.055),tip=[lean*.7+Math.cos(a)*extent,yy+.20,Math.sin(a)*extent];branch([[lean*.5,yy-.2,0],[tip[0]*.65,yy-.10,tip[2]*.65],tip],h*.025*(1-k*.055),.15,9,6);leafCluster(...tip,extent*.60,h*.10,extent*.42,340,k%3?'leafDark':'leaf',rr(.34,.44),false,true);}});}
const rocks=[];for(let k=0;k<9;k++){const raw=new T.IcosahedronGeometry(1,4);raw.deleteAttribute("normal");raw.deleteAttribute("uv");const g=mergeVertices(raw,.0001);raw.dispose();const p=g.attributes.position;for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),f=.78+.26*noise(v.x*2.8+k*3,v.y*2.8+v.z,41)+.14*noise(v.z*8,v.y*8,k);v.multiplyScalar(f);v.y*=.8+.12*noise(v.x*5,v.z*5,k);p.setXYZ(i,v.x,v.y,v.z);}const rockUv=[];for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).normalize();rockUv.push(.5+Math.atan2(v.z,v.x)/TAU,.5-Math.asin(v.y)/Math.PI);}g.setAttribute("uv",new T.Float32BufferAttribute(rockUv,2));g.computeVertexNormals();rocks.push(g);}
function rock(x,y,z,sx=1,sy=.8,sz=1,wet=false,moss=true){if(z+sz>L.waterfall.z[0]-.20&&z-sz<L.waterfall.z[1]+.8&&Math.abs(x-L.waterfall.x)<sx+.65)x=L.waterfall.x+(x<L.waterfall.x?-1:1)*(sx+.65);const ground=site124(x,z);y=Math.max(y,ground.height+sy*.02);const i=Math.floor(rr(0,rocks.length));const scan=B.scannedStones?.variants[i%B.scannedStones.variants.length];const rot=[rr(-.10,.10),rr(0,TAU),rr(-.10,.10)],tint=rr(.90,1.10);if(scan)scanned132(scan,wet?scan.wet:scan.dry,x,y,z,sx,sy,sz,rot,tint);else B.emit(rocks[i],wet?'rockWet':'rock',x,y,z,sx,sy,sz,rot,tint);if(moss)for(let k=0;k<12;k++){const a=rr(0,TAU),q=rr(.08,.67);B.sphere(x+Math.cos(a)*sx*q,y+sy*(.76-.45*q)+rr(-.04,.04),z+Math.sin(a)*sz*q,rr(.025,.065),rr(.012,.027),rr(.025,.065),'moss');}}
function fern(x,y,z,s=1){if(z>L.waterfall.z[0]-.2&&z<L.waterfall.z[1]+.9&&Math.abs(x-L.waterfall.x)<.55)return;const ground=site124(x,z);y=Math.max(y,ground.height+.015);for(let k=0;k<8;k++){const a=k*TAU/8+rr(-.1,.1),len=s*rr(.6,1.0),end=[x+Math.cos(a)*len,y+s*rr(.35,.6),z+Math.sin(a)*len];for(let j=1;j<10;j++){const t=j/10,xx=x+(end[0]-x)*t,zz=z+(end[2]-z)*t,yy=y+Math.sin(t*Math.PI*.8)*s*.7;for(const sign of[-1,1]){const q=a+sign*.75,sz=.18*s*Math.sin(t*Math.PI);B.emit(foliage,'leaf',xx+Math.cos(q)*sz*.2,yy,zz+Math.sin(q)*sz*.2,sz,.7,sz*1.5,[.15,q,sign*.3],rr(.7,1.15));}}}}
function bridge(){const G=L.bridge;B.label('layout124-connected-arched-red-bridge',()=>B.with(...G.position,G.yaw,()=>{
 const half=G.halfSpan,hd=1.05,Y=x=>G.deckBaseline+G.archRise*(1-(x/half)**2)+G.slope*x/half,xs=lin(-half,half,64);
 for(let i=0;i<64;i++){const a=xs[i],b=xs[i+1],x=(a+b)/2,y=Y(x),slope=-2*G.archRise*x/(half*half)+G.slope/half;B.box(x,y,0,b-a+.008,.17,hd*2,'wood',[0,0,Math.atan(slope)]);
  for(const side of[-1,1])for(const [h,w,d]of[[.97,.14,.18],[.51,.13,.12],[.16,.13,.11]])B.between([a,Y(a)+h,side*(hd+.07)],[b,Y(b)+h,side*(hd+.07)],w,d,'redLight');
 }
 const shape=new T.Shape();xs.forEach((x,i)=>i?shape.lineTo(x,Y(x)-.12):shape.moveTo(x,Y(x)-.12));[...xs].reverse().forEach(x=>shape.lineTo(x,Y(x)-.64));shape.closePath();const solidArch=new T.ExtrudeGeometry(shape,{depth:.30,steps:1,bevelEnabled:true,bevelSize:.014,bevelThickness:.014,bevelSegments:2});for(const side of[-1,1])B.emit(solidArch,'darkwood',0,0,side*hd-.15);
 for(let j=0;j<=12;j++){const x=-half+2*half*j/12;B.box(x,Y(x)-.28,0,.17,.18,hd*2+.55,'wood');}
 for(let k=0;k<=8;k++){const x=-half+2*half*k/8,y=Y(x);for(const side of[-1,1]){const z=side*(hd+.07);B.box(x,y+.59,z,.16,1.20,.16,'redLight');B.box(x,y+.30,z,.23,.16,.21,'goldDark');A.rosette(x,y+.3,z+.12,.09,'gold');if(k%2===0){B.box(x,y+1.0,z,.22,.10,.22,'goldDark');B.sphere(x,y+1.15,z,.13,.16,.13,'gold');B.sphere(x,y+1.33,z,.065,.08,.065,'goldDark');}}}
 // The ends bear on compact dry-laid masonry rather than inflated soil cones.
 // Each joint has a real recess and broken block heights; stone ties overlap
 // across courses and the final timber sleeper meets the deck soffit.
 for(const sign of[-1,1]){
  const end=sign*half,top=Y(end)-.17,base=.13-G.position[1],courses=7,h=(top-base)/courses;
  for(let j=0;j<courses;j++)for(let k=0;k<3;k++){
   const z=(k-1)*.72+(j%2?.12:-.06),x=end+sign*(.09+.025*Math.sin(j*3+k));
   B.box(x,base+(j+.5)*h,z,.54+.08*Math.sin(j+k),h-.018,.76+.05*Math.sin(j*2+k),'stone',[0,.012*Math.sin(j*7+k),.005*Math.cos(j+k)],.79+.13*noise(j,k,910));
  }
  B.box(end,top+.015,0,.70,.10,2.40,'wood');
 }
 // The photographed central transverse bent carries the two longitudinal arch
 // girders. Its wood front leg and stone rear leg have actual bearing tops.
 const bentX=-.50,seat=Y(bentX)-.64,beamBottom=seat-.20,plinthTop=1.10-G.position[1],water=.13-G.position[1];B.box(bentX,seat-.10,0,.48,.20,hd*2+.28,'wood');
 for(const side of[-1,1]){const z=side*.76;B.box(bentX,(plinthTop+beamBottom)/2,z,.36,beamBottom-plinthTop,.40,side>0?'wood':'stone');B.box(bentX,(water+plinthTop)/2,z,.70,plinthTop-water,.72,'stone');}
 for(let k=0;k<9;k++){const x=-half+2*half*k/8;B.sphere(x,Y(x)-.35,hd+.18,.17,.085,.025,'goldDark');if(B.joineryKit)B.emit(B.joineryKit.relief,'gold',x,Y(x)-.35,hd+.205,.27,.125,.09);}
 },G.scale));B.layout124??={};B.layout124.bridge={position:G.position,centralBent:true,waterY:.13,seatDepthBelowDeck:.64,woodAndStoneLegs:true};}
function stoneLantern(){const granite=makeLanternGranite132(B.m.stone);B.m.lanternGranite132=granite.stone;B.m.lanternGraniteLight132=granite.light;B.label('foreground-weathered-sculpted-stone-lantern',()=>{B.with(5.30,.30,6.20,.02,()=>{
const profile=[[.72,0],[.77,.12],[.69,.24],[.52,.33],[.39,.47],[.33,.66],[.30,1.30],[.37,1.49],[.53,1.63],[.63,1.72],[.68,1.82],[.60,1.93]];const shaft=new T.LatheGeometry([[0,0],...profile,[0,1.93]].map(p=>new T.Vector2(...p)),8).toNonIndexed();shaft.computeVertexNormals();B.emit(shaft,'lanternGranite132');for(let k=0;k<14;k++){const a=k*TAU/14;B.emit(foliage,'lanternGranite132',Math.sin(a)*.325,1.09,Math.cos(a)*.325,.075,.2,.25,[Math.PI/2,a,0]);}
const stoneScroll=new T.TubeGeometry(new T.CatmullRomCurve3([[-.24,0,0],[-.15,.075,0],[0,-.035,0],[.15,.075,0],[.24,0,0]].map(V)),20,.018,6,false);for(let face=0;face<6;face++)B.with(0,0,0,face*TAU/6,()=>{B.box(0,1.96,.62,.57,.23,.055,'lanternGranite132');B.emit(stoneScroll,'lanternGraniteLight132',0,1.96,.66);for(let p=0;p<6;p++){const a=p*TAU/6;B.sphere(Math.cos(a)*.06,1.96+Math.sin(a)*.06,.67,.045,.026,.018,'lanternGraniteLight132',[0,0,a]);}});
// Four square windows and narrow corner piers leave a real lantern cavity.
B.box(0,2.07,0,1.31,.19,1.31,'lanternGraniteLight132');
B.box(0,3.05,0,1.37,.16,1.37,'lanternGranite132');
for(const xx of[-.57,.57])for(const zz of[-.57,.57])B.box(xx,2.57,zz,.17,.87,.17,'lanternGraniteLight132');
for(let side=0;side<4;side++)B.with(0,0,0,side*TAU/4,()=>{const z=.594;B.box(0,2.57,z,.92,.79,.025,'paperGlow');
for(const x of[-.47,.47])B.box(x,2.57,z+.025,.073,.86,.10,'lanternGranite132');
for(const yy of[2.16,2.99])B.box(0,yy,z+.025,1.05,.10,.10,'lanternGranite132');
const lattice=[[-.43,-.35,-.28,-.35],[-.28,-.35,-.28,-.08],[-.28,-.08,-.09,-.08],[-.09,-.08,-.09,-.35],[.09,-.35,.09,-.08],[.09,-.08,.28,-.08],[.28,-.08,.28,-.35],[.28,-.35,.43,-.35],[-.43,.35,-.28,.35],[-.28,.35,-.28,.08],[-.28,.08,-.09,.08],[-.09,.08,-.09,.35],[.09,.35,.09,.08],[.09,.08,.28,.08],[.28,.08,.28,.35],[.28,.35,.43,.35],[-.43,0,-.18,0],[-.18,0,0,.18],[0,.18,.18,0],[.18,0,0,-.18],[0,-.18,-.18,0],[.18,0,.43,0],[-.43,-.20,-.28,-.20],[.28,-.20,.43,-.20],[-.43,.20,-.28,.20],[.28,.20,.43,.20]];
for(const [ax,ay,bx,by]of lattice)B.between([ax,2.57+ay,z+.044],[bx,2.57+by,z+.044],.025,.026,'darkwood');});
const pp=[],uv=[],ids=[],N=72,R=12;for(let j=0;j<=R;j++){const t=j/R,r=1.02*(1-t)+.20*t;for(let k=0;k<=N;k++){const a=k/N*TAU,edge=.04*Math.sin(a*15)+.024*Math.cos(a*23),rad=r/(Math.abs(Math.cos(a))**5+Math.abs(Math.sin(a))**5)**.2*(1+edge*.30),corner=Math.abs(Math.sin(a*2))**8,y=3.12+.58*t**1.55+.21*(1-t)**8*corner+.035*Math.sin(a*9+t*7)+.038*noise(Math.cos(a)*r*8,Math.sin(a)*r*8,132);pp.push(Math.cos(a)*rad,y,Math.sin(a)*rad);uv.push(.5+Math.cos(a)*r*.5,.5+Math.sin(a)*r*.5);if(k<N&&j<R){const q=j*(N+1)+k;ids.push(q,q+N+1,q+1,q+1,q+N+1,q+N+2);}}}const roofCount=pp.length/3,roofFaces=ids.length;for(let i=0;i<roofCount;i++){pp.push(pp[i*3],pp[i*3+1]-.14,pp[i*3+2]);uv.push(uv[i*2],uv[i*2+1]);}for(let i=0;i<roofFaces;i+=3)ids.push(ids[i]+roofCount,ids[i+2]+roofCount,ids[i+1]+roofCount);for(const ring of[0,R])for(let k=0;k<N;k++){const a=ring*(N+1)+k,b=a+1;ids.push(a,a+roofCount,b,b,a+roofCount,b+roofCount);}const roof=new T.BufferGeometry();roof.setAttribute('position',new T.Float32BufferAttribute(pp,3));roof.setAttribute('uv',new T.Float32BufferAttribute(uv,2));roof.setIndex(ids);roof.computeVertexNormals();B.emit(roof,'rockWet');for(let k=0;k<55;k++){const a=rr(0,TAU),r=rr(.23,.94),t=1-r/.98;B.sphere(Math.sin(a)*r,3.15+.62*t**1.15,Math.cos(a)*r,rr(.015,.045),.018,rr(.015,.045),'moss');}// A shallow contiguous moss skin follows the actual roof, including the
// curling corners; its broken edge and thickness cast real small shadows.
const mp=[],mi=[],MN=112,MR=26;for(let j=0;j<=MR;j++){const t=.04+.88*j/MR,r=1.02*(1-t)+.20*t;for(let k=0;k<=MN;k++){const a=k/MN*TAU,rad=r/(Math.abs(Math.cos(a))**5+Math.abs(Math.sin(a))**5)**.2,corner=Math.abs(Math.sin(a*2))**8,x=Math.cos(a)*rad,z=Math.sin(a)*rad,y=3.142+.58*t**1.55+.21*(1-t)**8*corner+.035*Math.sin(a*9+t*7)+.038*noise(Math.cos(a)*r*8,Math.sin(a)*r*8,132);mp.push(x,y,z);if(j<MR&&k<MN){const mask=noise(x*3.2,z*3.2,494)*.64+noise(x*11,z*11,781)*.36;if(mask>.46){const q=j*(MN+1)+k;mi.push(q,q+MN+1,q+1,q+1,q+MN+1,q+MN+2);}}}}const mossSkin=new T.BufferGeometry();mossSkin.setAttribute('position',new T.Float32BufferAttribute(mp,3));const mu=[];for(let q=0;q<mp.length;q+=3)mu.push(mp[q]*2,mp[q+2]*2);mossSkin.setAttribute('uv',new T.Float32BufferAttribute(mu,2));mossSkin.setIndex(mi);mossSkin.computeVertexNormals();B.emit(mossSkin,'moss');const tuft=new T.ConeGeometry(.004,.018,4);for(let k=0;k<1500;k++){const a=k*2.399963,r=.22+.78*Math.sqrt((k+.5)/1500),t=(1.02-r)/.82,rad=r/(Math.abs(Math.cos(a))**5+Math.abs(Math.sin(a))**5)**.2,x=Math.cos(a)*rad,z=Math.sin(a)*rad,mask=noise(x*3.2,z*3.2,494)*.64+noise(x*11,z*11,781)*.36;if(mask<.45)continue;const yy=3.145+.58*t**1.55+.21*(1-t)**8*Math.abs(Math.sin(a*2))**8+.035*Math.sin(a*9+t*7)+.038*noise(Math.cos(a)*r*8,Math.sin(a)*r*8,132);B.emit(tuft,'moss',x,yy,z,1,1,1,0,.76+.38*noise(x*40,z*40,782));}
const budProfile=[[0,3.65],[.22,3.65],[.28,3.74],[.23,3.82],[.31,3.91],[.33,4.04],[.28,4.19],[.18,4.34],[.035,4.44],[0,4.46]],bud=new T.LatheGeometry(budProfile.map(p=>new T.Vector2(...p)),48);B.emit(bud,'rock');for(let k=0;k<12;k++){const a=k*TAU/12;B.tube([[Math.cos(a)*.23,3.84,Math.sin(a)*.23],[Math.cos(a+.12)*.33,4.00,Math.sin(a+.12)*.33],[Math.cos(a+.17)*.23,4.25,Math.sin(a+.17)*.23],[Math.cos(a+.20)*.025,4.43,Math.sin(a+.20)*.025]],.014,'rock',16,5);}
});});}
function lotus(x,z,s=1,bloom=true){const y=.17+rr(0,.04);B.emit(leafDisc,'lotusLeaf',x,y,z,s,s*.6,s,[rr(-.08,.08),rr(0,TAU),rr(-.06,.06)],rr(.6,1.08));if(s>.10)for(let j=0;j<1;j++){const a=j*2.8+noise(x*3,z*3,132)*TAU,scale=s*(.66+.16*j);B.emit(leafDisc,'lotusLeaf',x+Math.cos(a)*s*1.2,y+.008+j*.005,z+Math.sin(a)*s,scale,scale*.6,scale,[.07*Math.sin(a),a,.07*Math.cos(a)],.80+.10*j);}if(bloom){const xx=x+s*.22,zz=z+s*.10,stem=.10+rr(0,.12);B.between([xx,.12,zz],[xx,y+stem,zz],.018,.018,'leaf',true);for(let ring=0;ring<3;ring++){const n=ring===0?9:7;for(let k=0;k<n;k++){const a=k*TAU/n+ring*.40,siz=s*(.60-ring*.15);B.emit(petal,ring===2?'lotusInside':'lotus',xx,y+stem+ring*.025,zz,siz,siz*(1.0+ring*.6),siz,[-.12-ring*.28,a,0]);}}B.sphere(xx,y+stem+.10,zz,s*.09,s*.045,s*.09,'pollen');}}
B.label('garden-landforms',()=>{B.box(0,-.65,-7,40,1.0,30,'earth');for(const [x,z,rx,rz,h]of[[-8,-2.3,5.8,3.7,1.4],[4,-5.5,8,3.6,1.8],[11,-.2,4.4,9.5,1.3],[-11,6,3,8,1.0],[0,-.8,2.0,1.3,.50],[-1,11,4,1.5,.45]])B.sphere(x,.05,z,rx,h,rz,'earth');});
bridge();stoneLantern();B.label('stone-lantern-founded-shore-island',()=>{B.sphere(5.30,.05,6.2,1.05,.43,1.02,'earth');for(let k=0;k<9;k++){const a=k*TAU/9;rock(5.30+Math.cos(a)*.76,.18,6.2+Math.sin(a)*.73,.40,.45,.37,k%3===0,true);}});
const bankHeight=(x,z)=>site124(x,z).height;
B.label('continuous-soil-bank-from-stair-to-pond',()=>{const grid=lin(-6.1,3.2,64).map(z=>lin(-11,9.5,84).map(x=>[x,bankHeight(x,z),z]));B.emit(solidTerrain124(grid),'earth');});
B.label('layout124-supported-shore-rock-masses',()=>{for(let i=0;i<23;i++){const x=i<11?-8.0+(i%11)*.40:5.4+(i-11)*.35,z=i<11?.55+.26*Math.sin(x*.8):.55+.28*Math.sin(x),ground=site124(x,z);if(Math.abs(x-L.waterfall.x)<1.17)continue;const scan=B.scannedStones.variants[i%6];scanned132(scan,scan.wet,x,ground.height+.12,z,.46,.62,.50,[.04,i*.67,.03],1.0);}});
B.label('layout124-front-bank-rock-buttresses',()=>{for(const [i,x,y,z,sx,sy,sz]of[[0,3.8,.85,.05,1.25,1.65,1.10],[2,5.15,.83,.35,1.10,1.55,1.15],[4,.48,1.18,.23,.90,1.60,.90]]){const scan=B.scannedStones.variants[i];scanned132(scan,scan.wet,x,y,z,sx,sy,sz,[.04,i*.54,.02],1.0);}});
B.label('planted-stair-bank-ferns-and-low-rocks',()=>{for(let k=0;k<90;k++){const x=rr(-7.8,8.5),z=rr(-3.4,-.7);if(Math.abs(x-1.65)<.65&&z> -1.7)continue;const y=bankHeight(x,z);if(k%3===0)rock(x,y-.04,z,rr(.24,.52),rr(.32,.62),rr(.30,.60),k%4===0,false);fern(x,y+.02,z,rr(.20,.48));}});

B.label('garden-shore-boulders-moss-and-crevices',()=>{for(let i=0;i<45;i++){const x=-12+i*.56,z=-1.8+.5*Math.sin(x*.8);if(x>-5.4&&x<-.8)continue;rock(x,.40,z,rr(.32,.72),rr(.34,.68),rr(.40,.78),true,true);}for(let i=0;i<25;i++){const z=-1.8+i*.50;rock(9.0+.3*Math.sin(z),.38,z,rr(.48,.86),rr(.38,.70),rr(.42,.82),true,true);rock(-9.4+.3*Math.sin(z*.7),.30,z,rr(.48,.82),rr(.34,.65),rr(.40,.78),false,true);}for(let k=0;k<30;k++){const x=k%2===0?rr(-9,-5.8):rr(5.8,9),z=rr(11,15);rock(x,.10,z,rr(.32,.78),rr(.32,.62),rr(.38,.78),false,true);}rock(-6.4,.53,-1.6,.58,.62,.66,true,true);rock(-4.8,.87,-2.2,.62,.68,.70,true,true);rock(6.4,.60,-1.5,.66,.62,.68,true,true);rock(8.0,.35,-.3,.58,.48,.62,true,true);for(let k=0;k<900;k++){const x=rr(-12,12),z=rr(-2,15);if(x>-8.5&&x<8.4&&z>1.5&&z<11.7)continue;const s=rr(.025,.13);B.sphere(x,.08+rr(0,.16),z,s,s*.7,s*.85,'stone',rr(0,TAU),rr(.5,1.0));}});
B.label('foreground-east-island-boulder-and-ferns',()=>{rock(5.55,.85,12.5,.55,.62,.60,false,true);rock(6.35,.43,11.8,.48,.48,.58,true,true);for(let k=0;k<16;k++)fern(rr(5.15,6.8),rr(.35,.75),rr(11.6,12.9),rr(.25,.50));});
B.label('west-bridge-root-rocks-and-flowering-groundcover',()=>{for(let k=0;k<18;k++){const x=rr(-7.9,-3.0),z=rr(1.0,5.4);rock(x,rr(.23,.54),z,rr(.40,.87),rr(.55,.94),rr(.50,.90),k%4===0,true);fern(x,.65,z,rr(.27,.52));}for(let k=0;k<7;k++)shrub(rr(-7.2,-4.3),.45,rr(2,6),rr(.6,.9),rr(.5,.8),k%3===0);});
B.label('deep-layered-rock-bank-and-understory',()=>{for(let k=0;k<48;k++){const x=k%2===0?rr(-9,-4.4):rr(5.2,8),z=rr(-4.5,-2.2),h=.25+.65*noise(x*.4,z*.8,77);rock(x,h,z,rr(.32,.82),rr(.32,.68),rr(.38,.82),k%3===0,true);}rock(-4.2,1.04,-2.25,.58,.64,.62,true,true);rock(6.0,1.00,-2.4,.58,.64,.68,true,true);for(let k=0;k<280;k++){const side=k%3,x=side===0?rr(-9,-6.5):side===1?rr(6.2,9.3):rr(-8,7),z=side===2?rr(-2.8,-1.0):rr(1.0,12);fern(x,rr(.17,.35),z,rr(.20,.51));}});
B.label('layout124-raised-stair-landing-flagstones',()=>{B.with(L.stair.bottom[0]-3.8,L.stair.landingY-.06-1.49,L.stair.bottom[2]+3.55,0,()=>{for(let ix=0;ix<9;ix++)for(let iz=0;iz<7;iz++){const x=2.0+ix*.44,z=-4.8+iz*.42;B.box(x,1.49+rr(-.004,.004),z,.425,.12,.405,'stoneLight',rr(-.025,.025),rr(.82,1.06));}for(let k=0;k<18;k++){const x=rr(2.3,6.4),z=rr(-3.8,-2.8);fern(x,1.46,z,rr(.20,.42));}});});
B.label('layout124-waterfall-stone-channel-beds',()=>{for(const [z,y,w,d]of[[L.waterfall.z[0]-.09,L.waterfall.lips[0]-.08,.80,.40],[L.waterfall.z[1]-.07,L.waterfall.lips[1]-.08,.85,.34],[L.waterfall.z[1]+.57,.08,1.1,.50]])B.box(L.waterfall.x,y-.06,z,w,.12,d,'rockWet');});
B.label('distant-haze-woodland',()=>{for(let k=0;k<95;k++){const x=rr(-36,3),z=rr(-42,-23),h=rr(3.8,8.5);B.cyl(x,.8+h*.30,z,.09,h*.55,'bark');for(let j=0;j<7;j++){const a=j*2.399+k,yy=.8+h*(.25+.095*j),r=h*(.23-.018*j);B.emit(rocks[j%9],k%3?'leafDark':'leaf',x+Math.cos(a)*r*.4,yy,z+Math.sin(a)*r*.4,r,h*.17,r,rr(0,TAU),rr(.65,.90));}}});
B.label('sculptural-layered-pines',()=>{pine(-9,.7,-6.5,5.0,2.8);pine(-12,1,-12,6.0,3);pine(-3,1,-14,4.6,2.6);});
B.label('hall-terrace-rooted-pine-and-rock-garden',()=>{
 // The reference's middle ground rises in planted shelves, with a clear
 // nine-tread approach between them. Roots sit on the actual bank height.
 pine(-4.05,site124(-4.05,-5.8).height,-5.8,3.9,2.45);
 pine(8.45,site124(8.45,-2.2).height,-2.2,3.05,1.70);
 for(const [x,z,r,h,f]of[[-1.8,-3.4,1.12,1.26,false],[.25,-3.7,.84,1.12,true],[6.2,-2.9,.93,1.16,true],[7.55,-3.4,1.12,1.30,false],[8.35,-.8,.82,.94,true],[-6.5,-.1,.92,1.10,false]]){
  const y=site124(x,z).height;
  rock(x-.38,y+.08,z+.20,r*.60,.58,r*.52,true,false);
  rock(x+.45,y+.03,z+.32,r*.43,.43,r*.47,true,true);
  shrub(x,y+.02,z,r,h,f);
  for(let k=0;k<5;k++)fern(x+rr(-r,r),y+.12,z+rr(.10,.75),rr(.24,.42));
 }
 // Broken, planted rock toes soften the masonry abutments at the waterline.
 const G=L.bridge,c=Math.cos(G.yaw),sn=Math.sin(G.yaw);
 for(const sign of[-1,1]){
  const u=sign*G.halfSpan*G.scale[0],px=G.position[0]+c*u,pz=G.position[2]-sn*u;
  for(let j=0;j<7;j++){
   const a=j*TAU/7,xx=px+Math.cos(a)*.67,zz=pz+Math.sin(a)*.92;
   rock(xx,.20,zz,.34+.08*Math.sin(j),.47+.13*Math.cos(j*2),.39,j%2===0,true);
   fern(xx,.30,zz,.30+.06*Math.sin(j));
  }
 }
});
B.label('flowering-garden-shrubs',()=>{for(const [x,y,z,r,h,f]of[[-9.0,.45,.5,1.35,1.5,true],[-7.5,.6,-2.5,1.15,1.45,true],[-4.6,.7,-1.8,1.05,1.35,true],[6.2,.7,-2.4,1.10,1.45,true],[8.25,.4,.5,1.20,1.45,true],[9.15,.3,6.6,1.25,1.3,true],[-8,.45,7,1.25,1.25,false],[-6.6,.6,-6,1.35,1.55,false],[-9.5,.4,10,1.2,1.5,false],[-5.4,.4,12,.85,1.05,false]])shrub(x,y,z,r,h,f);for(let k=0;k<45;k++){const x=rr(-10,10),z=rr(-1,13);if(x>-8&&x<8&&z>1&&z<10)continue;fern(x,.12,z,rr(.35,.8));}});
B.label('lotus-leaves-and-layered-pink-blossoms',()=>{const beds=[[-6.8,4.7,12,.75,1.20,.040,.075,.18],[-5.2,8.6,8,.90,.85,.038,.070,.14],[-2.7,8.7,12,.78,1.10,.038,.075,.17],[6.7,4.8,16,.70,1.25,.040,.080,.20],[7.6,8.8,12,.72,1.20,.038,.072,.17]];for(const [cx,cz,count,rx,rz,smin,smax,flowerRate]of beds){for(let k=0;k<count;k++){const a=rr(0,TAU),q=Math.sqrt(random()),x=cx+Math.cos(a)*rx*q,z=cz+Math.sin(a)*rz*q;lotus(x,z,rr(smin,smax),random()<flowerRate);}}});
B.label('photograph-calibrated-lotus-beds',()=>{const cam=new T.PerspectiveCamera(59,1,.1,260);cam.position.set(0,3.2,17);cam.lookAt(0,6.2,-13);cam.updateMatrixWorld(true);for(let k=0;k<48;k++){let u,v;if(k<8){u=rr(.23,.38);v=rr(.82,.89);}else if(k<20){u=rr(.50,.68);v=rr(.89,.95);}else if(k<42){u=rr(.73,.90);v=rr(.78,.86);}else{u=rr(.80,.90);v=rr(.86,.89);}const d=new T.Vector3(u*2-1,1-v*2,.5).unproject(cam).sub(cam.position).normalize(),pos=cam.position.clone().addScaledVector(d,(.18-cam.position.y)/d.y),depth=17-pos.z,size=rr(28,42)*depth/(768*2.25);lotus(pos.x,pos.z,size,k%3===0);}});

B.label('garden132-supported-bridge-to-hall-garden-path',()=>{
 const G=L.bridge,start=[G.position[0]+G.halfSpan*G.scale[0],G.position[1]+G.deckBaseline+G.slope,G.position[2]],route=[start,[.52,2.48,-3.1],[3.9,2.1,-4.6]];
 for(let seg=0;seg<route.length-1;seg++){
  const [ax,ay,az]=route[seg],[bx,by,bz]=route[seg+1],dx=bx-ax,dz=bz-az,run=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz),steps=5;
  for(let i=0;i<steps;i++){const t=(i+.5)/steps,x=ax+dx*t,z=az+dz*t,top=ay+(by-ay)*(i+1)/steps,bottom=Math.min(site124(x,z).height,top-.22),courses=Math.max(1,Math.ceil((top-bottom)/.28)),hh=(top-bottom)/courses;
   B.with(x,0,z,yaw,()=>{for(let row=0;row<courses;row++)for(const side of[-1,1])B.box(side*.24,bottom+(row+.5)*hh,0,.47,hh-.012,run/steps+.015,'stone',[0,.012*Math.sin(row*4+i),0],.72+.13*noise(row,i,132));B.box(0,top+.025,0,1.00,.055,run/steps-.012,'stoneLight');});
  }
 }
});
B.label('garden132-planted-central-bent-and-cascade-lips',()=>{
 for(const [x,z,sx,sy,sz]of[[-4.02,.1,.72,1.16,.72],[-3.7,.75,.60,.76,.62],[-4.6,.48,.63,.83,.67],[-5.2,1.1,.82,.86,.78]]){rock(x,.43,z,sx,sy,sz,true,true);shrub(x-.14,.55,z-.25,sx*.76,.73,false);}
 for(let level=0;level<2;level++)for(const side of[-1,1]){const scan=B.scannedStones.variants[(level*2+(side>0?1:0))%6],x=L.waterfall.x+side*.48,z=L.waterfall.z[level]-.12,y=L.waterfall.lips[level]-.12;scanned132(scan,scan.wet,x,y,z,.40,.42,.35,[.04,side*.5,.02],1);}
});
B.label('garden132-organic-planted-bridge-and-waterfall-shelves',()=>{
 // Broken, overlapping strata carry the soil and plants at the pond edge.
 // The stones are actual CC0 scan solids, set into the same bank surface.
 const shelves=[[-7.9,.2,1.0,.65,.72],[-7.1,1.45,1.15,.78,.86],[-5.65,1.20,1.0,.72,.82],[-4.2,1.9,.86,.57,.73],[-1.3,-.40,.84,.65,.78],[.25,-.06,.82,.60,.68],[1.05,-1.65,.61,.62,.66],[2.93,-1.34,.72,.68,.68],[3.20,-.15,.80,.73,.71],[4.18,.4,.92,.73,.78],[5.1,.8,.95,.70,.76],[6.2,1.2,1.05,.80,.91],[7.2,2.5,1.0,.76,.88],[.35,-1.55,.77,1.35,.72],[-.38,-1.15,.68,.96,.65],[1.05,-2.7,.71,1.18,.65]];
 for(let i=0;i<shelves.length;i++){
  const [x,z,sx,sy,sz]=shelves[i],g=site124(x,z),scan=B.scannedStones.variants[(i+2)%6];
  scanned132(scan,i%3?scan.wet:scan.dry,x,g.height+sy*.14,z,sx,sy,sz,[.04,i*1.17,-.025],1.03);
  for(let j=0;j<7;j++){const a=j*2.399+i,xx=x+Math.cos(a)*sx*.66,zz=z+Math.sin(a)*sz*.67;fern(xx,g.height+.12,zz,.25+.12*noise(i,j,132));}
  shrub(x-.12,g.height+.12,z-.24,sx*.63,.52,i%3===0);
 }
 for(const [x,z,r,h]of[[-7.95,-.1,1.3,1.38],[-5.7,-2.4,1.15,1.32],[-1.1,-1.1,1.10,1.1],[4.75,-2.2,1.5,1.5],[6.25,-1.25,1.3,1.36],[7.45,.6,1.18,1.18],[.86,-1.62,1.32,1.95],[1.65,-3.3,1.10,1.25],[-.28,-1.75,1.0,1.45]])shrub(x,site124(x,z).height,z,r,h,true);
});
function broadTree132(x,z,h,r,seed){const rnd=rng(seed),range=(a,b)=>a+(b-a)*rnd(),base=site124(x,z).height;
 B.with(x,base,z,range(-.35,.35),()=>{
  branch([[0,-.1,0],[-.14,h*.26,.04],[.11,h*.54,0],[.27,h*.83,-.10]],h*.064,.12,26,10);
  for(let i=0;i<12;i++){
   const a=i*2.39996+range(-.2,.2),yy=h*(.39+i*.035),reach=r*range(.55,.94),tip=[Math.cos(a)*reach,yy+range(.12,.42),Math.sin(a)*reach*.68];
   branch([[.02,yy-.22,0],[tip[0]*.58,yy+.02,tip[2]*.58],tip],h*.025*(1-i*.035),.10,13,7);
   leafCluster(...tip,r*.46,h*.16,r*.33,160,i%3?'leafDark':'leafLight',r*.15);
   leafCluster(tip[0]-.10,tip[1]+h*.10,tip[2],r*.43,h*.12,r*.32,180,i%2?'leaf':'leafLight',r*.15);
  }
 });
}
B.label('garden132-rounded-broadleaf-middle-ground',()=>{broadTree132(-.48,-4.7,3.6,2.15,13209);broadTree132(-7.7,-9.9,4.1,2.7,13210);broadTree132(-10.3,-5.4,3.7,2.15,13211);});
B.label('maple-rooted-east-shore-extension',()=>{
 B.sphere(17.1,.0,5.55,2.4,.55,3.0,'earth');
 for(let k=0;k<12;k++){
  const a=k*TAU/12;
  rock(17.1+Math.cos(a)*1.9,.18,5.55+Math.sin(a)*2.30,.46,.55,.49,k%2===0,true);
 }
});
B.label('upper-right-maple-framing-boughs',()=>{B.with(12,2.9,4.0,-.2,()=>{
 const mapleRandom=rng(781205),mapleRange=(a,b)=>a+(b-a)*mapleRandom();
 const mapleCrown=(x,y,z,rx,ry,rz,count,scale,tone)=>{for(let k=0;k<Math.ceil(count*.4);k++){const a=mapleRange(0,TAU),q=Math.cbrt(mapleRandom()),v=mapleRange(-1,1),r=Math.sqrt(1-v*v),xx=x+rx*Math.cos(a)*r*q,zz=z+rz*Math.sin(a)*r*q,yy=y+ry*v*q,s=scale*mapleRange(.78,1.18);B.emit(maple,tone,xx,yy,zz,s,s,s,[mapleRange(-.65,.65),mapleRange(0,TAU),mapleRange(-.42,.42)],mapleRange(.68,1.18));}};
 // One continuous, tapering scaffold enters from beyond the right edge and
 // sweeps left above the hall roof; each fan below grows directly from it.
 const stem=[[3.2,5.7,.4],[1.8,6.7,.35],[0,7.7,.15],[-2,8.5,-.1],[-4.2,9.1,-.35],[-6.7,9.4,-.65],[-9.1,9.3,-.95],[-10.8,8.9,-1.15]];
 // The pullback opening sees beyond the old photographic crop. Continue the
 // bough down into a rooted trunk instead of exposing a sawn-off tube in air.
 branch([[6.0,-2.83,2.8],[5.85,-.6,2.50],[5.30,2.4,1.85],[4.45,4.5,1.10],stem[0]],.62,.63,40,15);

 branch(stem,.39,.075,64,15);
 const fans=[
  {at:stem[1],bend:[.65,7.85,.15],tip:[-.55,9.05,-1.35],tone:'mapleLight'},
  {at:stem[1],bend:[2.4,7.8,1.2],tip:[.95,8.85,2.35],tone:'mapleLeaf'},
  {at:stem[2],bend:[-.35,8.85,-.8],tip:[-1.75,9.55,-2.5],tone:'mapleLeaf'},
  {at:stem[2],bend:[.55,8.8,1.1],tip:[-.25,9.45,2.65],tone:'mapleLight'},
  {at:stem[3],bend:[-1.9,9.45,-1.35],tip:[-3.55,10.05,-2.95],tone:'mapleDark'},
  {at:stem[3],bend:[-1.2,9.55,.85],tip:[-2.65,10.0,2.75],tone:'mapleLeaf'},
  {at:stem[4],bend:[-4.25,9.85,-1.45],tip:[-5.9,10.25,-2.95],tone:'mapleLight'},
  {at:stem[4],bend:[-3.7,9.95,.75],tip:[-5.15,10.2,2.65],tone:'mapleLeaf'},
  {at:stem[5],bend:[-6.9,9.95,-1.35],tip:[-8.65,10.2,-2.75],tone:'mapleLeaf'},
  {at:stem[5],bend:[-6.15,10.0,.55],tip:[-8.25,10.15,2.35],tone:'mapleDark'},
  {at:stem[6],bend:[-9.35,9.75,-1.45],tip:[-11.25,9.9,-2.65],tone:'mapleLight'},
  {at:stem[6],bend:[-8.55,9.85,.35],tip:[-11.75,9.85,1.8],tone:'mapleLeaf'}
 ];
 for(let i=0;i<fans.length;i++){
  const f=fans[i],mid=[(f.at[0]+f.tip[0])*.5,(f.at[1]+f.tip[1])*.5+.12,(f.at[2]+f.tip[2])*.5];
  branch([f.at,f.bend,f.tip],.145,.09,22,9);
  mapleCrown(f.bend[0],f.bend[1],f.bend[2],.95,.52,.92,190,.32,f.tone);
  mapleCrown(f.tip[0],f.tip[1],f.tip[2],1.05,.58,1.0,205,.34,f.tone);
  for(const t of[.28,.57,.82]){
   const x=f.at[0]+(f.tip[0]-f.at[0])*t,y=f.at[1]+(f.tip[1]-f.at[1])*t,z=f.at[2]+(f.tip[2]-f.at[2])*t;
   const side=(i%2?1:-1),twig=[x+mapleRange(-.65,.55),y+mapleRange(.45,1.0),z+side*mapleRange(.55,1.15)];
   branch([[x,y,z],[(x+twig[0])*.5,y+.35,(z+twig[2])*.5],twig],.052,.12,9,6);
   mapleCrown(twig[0],twig[1],twig[2],.78,.42,.76,150,.31,i%3?'mapleLeaf':'mapleLight');
  }
  mapleCrown(mid[0],mid[1],mid[2],.88,.48,.86,165,.31,i%3?'mapleLeaf':'mapleDark');
 }
 // Overlapping leaf masses close the crown's interior while preserving an
 // uneven palmate outline and an open strip above the temple roofline.
 for(const [x,y,z,tone]of[[-1.1,8.85,-.45,'mapleLeaf'],[-3.2,9.45,.35,'mapleLight'],[-5.3,9.8,-.15,'mapleDark'],[-7.6,9.75,.05,'mapleLeaf'],[-10.0,9.45,-.4,'mapleLight'],[-12.1,8.95,-.45,'mapleLeaf']])mapleCrown(x,y,z,1.1,.55,1.05,195,.34,tone);
 // A thinner connected continuation reaches the left edge of the crown.
 branch([stem[7],[-12.2,8.7,-1.2],[-13.3,8.5,-1.1],[-14.0,8.4,-.95]],.12,.05,24,8);
 for(const [x,y,z,tone]of[[-11.2,9.05,-.5,'mapleLight'],[-12.8,8.72,-.45,'mapleLeaf'],[-13.7,8.55,-.25,'mapleDark']]){
  const twig=[x-.8,y+.55,z+.85];branch([[x,y,z],[x-.3,y+.45,z+.45],twig],.032,.11,8,5);
  mapleCrown(x,y,z,.62,.27,.58,130,.29,tone);
  mapleCrown(twig[0],twig[1],twig[2],.70,.34,.68,120,.29,tone);
 }
 // Lift the left shoulder into the sky: this fork stays tied to the main
 // scaffold and fills the upper-left crown edge without dropping over eaves.
 const shoulder=[stem[7],[-12.0,9.15,-1.42],[-13.55,9.45,-1.6],[-14.65,9.25,-1.48]];
 branch(shoulder,.095,.045,26,8);
 for(let i=1;i<=3;i++){
  const t=i/4,x=shoulder[0][0]+(shoulder[3][0]-shoulder[0][0])*t,y=shoulder[0][1]+(shoulder[3][1]-shoulder[0][1])*t,z=shoulder[0][2]+(shoulder[3][2]-shoulder[0][2])*t;
  const side=i%2?1:-1,tip=[x+mapleRange(-.35,.25),y+mapleRange(.48,.82),z+side*mapleRange(.48,.85)];
  branch([[x,y,z],[(x+tip[0])*.5,y+.28,(z+tip[2])*.5],tip],.036,.10,8,5);
  mapleCrown(tip[0],tip[1],tip[2],.78,.39,.72,145,.30,i%2?'mapleLight':'mapleLeaf');
 }
 mapleCrown(-12.55,9.55,-1.25,.85,.43,.76,155,.31,'mapleLeaf');
 mapleCrown(-14.15,9.42,-1.35,.77,.39,.72,135,.30,'mapleLight');
 // Drooping branchlets occupy the reference's broken lower crown edge.
 for(const [at,bend,tip,tone]of[
  [stem[3],[-2.8,7.6,.45],[-3.5,6.9,.9],'mapleLight'],
  [stem[4],[-5.0,8.1,.7],[-5.8,7.2,1.1],'mapleLeaf'],
  [stem[5],[-7.1,8.3,.3],[-7.7,7.5,.75],'mapleLight'],
  [stem[6],[-9.6,8.3,-.1],[-10.2,7.7,.45],'mapleLeaf']
 ]){branch([at,bend,tip],.065,.075,18,7);mapleCrown(tip[0],tip[1],tip[2],.70,.49,.65,145,.27,tone);mapleCrown(bend[0],bend[1],bend[2],.66,.39,.60,105,.26,tone);}
 // Keep the seeded placement sequence used by the following garden labels.
 for(let k=0;k<29560;k++)random();
});});
// Smaller foreground vine uses actual leaves arranged along the balustrade.
const foreA=L.foreground.postL,foreB=L.foreground.postN,oldAngle=Math.atan2(.52,1),newAngle=Math.atan2(foreB[0]-foreA[0],foreB[2]-foreA[2]),vineScale=Math.hypot(foreB[0]-foreA[0],foreB[2]-foreA[2])/(5.4*Math.hypot(.52,1));
B.with(foreA[0],.4,foreA[2],newAngle,()=>B.with(0,0,0,-oldAngle,()=>B.with(3.2,0,-10,0,()=>{
B.label('foreground-vine-over-balustrade',()=>{for(let k=0;k<8;k++){
 const z=10.3+k*.70,x=-3.2+(z-10)*.52;
 const curve=new T.CatmullRomCurve3([[x,1.4,z],[x+.10,1.83,z-.07],[x+.28,2.17,z+.06],[x+.45,2.35,z+.15]].map(V));
 branch([[x,1.4,z],[x+.10,1.83,z-.07],[x+.28,2.17,z+.06],[x+.45,2.35,z+.15]],.012,.16,12,6);
 for(let j=1;j<=13;j++)for(const sign of[-1,1]){
  const t=j/14,node=curve.getPoint(t),angle=k*.71+j*1.12+sign*.92,len=.16+.055*Math.sin(j*2.1+k),end=node.clone().add(V([Math.cos(angle)*len,.035+.035*Math.sin(j),Math.sin(angle)*len]));
  B.between(node.toArray(),end.toArray(),.0028,.0028,'leaf',true);
  const sz=.28+.11*(.5+.5*Math.sin(j*4.8+k));
  B.emit(foliage,'vineLeaf',end.x+Math.cos(angle)*sz*.51,end.y,end.z+Math.sin(angle)*sz*.51,sz,sz,sz,[-.10+sign*.09,Math.PI/2-angle,sign*.18],.85+.18*Math.sin(j*1.7+k));
 }
}});
B.label('foreground-vine-blossoms',()=>{for(let k=0;k<120;k++){const z=rr(10.2,15.4),x=-3.2+(z-10)*.52+rr(-.30,.30),y=rr(1.7,2.30),r=rr(.009,.018);for(let p=0;p<5;p++){const a=p*TAU/5;B.sphere(x+Math.cos(a)*r*.7,y, z+Math.sin(a)*r*.7,r*.55,r*.22,r*.55,k%4?'flowerCream':'pinkLight');}B.sphere(x,y+.006,z,r*.20,r*.12,r*.20,'pollen');}});
})),[vineScale,1,vineScale]);
B.label('foreground-reference-boulder-and-crevice-ferns',()=>{const hero=B.scannedStones.variants[0];scanned132(hero,hero.dry,2.85,.54,10.70,1.25,1.75,1.35,[.09,-1.10,.07],1.04);for(let k=0;k<14;k++)fern(2.08+k*.070,.92,11.60+.20*Math.sin(k*2.4),.18+.07*Math.sin(k));});
B.label('bridge-abutment-rock-and-herb-understory',()=>{for(let k=0;k<42;k++){const x=-8.7+(k%7)*.60,z=.4+Math.floor(k/7)*.72,top=.23+.12*Math.sin(k*.7);if(k%2===0)rock(x,top,z,.40,.50,.37,k%3===0,false);fern(x,top+.26,z,.28+.10*Math.sin(k*2.1));}});
if(trunks.length){const g=mergeGeometries(trunks);B.label('connected-garden-bark-branch-sweeps',()=>B.emit(g,'bark'));trunks.forEach(g=>g.dispose());}
return{rock,stats:{branches:trunks.length}};
}
