import {T,V} from './kernel.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {revolveProfile} from './sorin-solids.js';

const TAU=Math.PI*2,STONE_REPEAT=2*650/4096;
// One ground-contact pose and one common vertical axis, recovered at the retained
// reference camera. All levels below are connected physical dimensions in metres.
export const foregroundLantern120={
 anchor:[.99884134,.15,13.20506184],yaw:-.15,
 height:4.09,roofHalfWidth:.68,roofEdgeY:3.38,roofCrownY:3.76,
 windowSide:.86,windowBottom:2.48,windowTop:3.28,
 stemBottom:.85,stemTop:1.95,stemBottomSide:.40,stemTopSide:.36,
 baseSide:.78,footingBearingY:0,
 footingRocks:[[-.79,-.14,.67,.36,.30,.43],[.72,-.16,.56,.35,.29,.39],[-.91,-.13,-.26,.34,.27,.43],[1.15,-.11,.65,.63,.38,.52],[2.25,-.15,1.25,1.00,.45,.70]],
};

export async function loadForegroundStone120(){
 const loader=new T.TextureLoader(),names=['diff','nor_gl','rough'];
 const textures=await Promise.all(names.map(name=>loader.loadAsync(new URL(`./assets/foreground-lantern120/granite-face-${name}.png`,import.meta.url).href)));
 for(const [i,t]of textures.entries()){t.wrapS=t.wrapT=T.MirroredRepeatWrapping;t.anisotropy=8;if(i===0)t.colorSpace=T.SRGBColorSpace;}
 function mineral(name,tint){const m=new T.MeshStandardMaterial({name,roughness:.91,metalness:0,map:textures[0],normalMap:textures[1],roughnessMap:textures[2]});m.color.setRGB(...tint);m.normalScale.set(.32,.32);m.userData.provenance='CC0 Poly Haven Granite Tile 04, same single-face .3173828125m crop used by scene07; no reference pixels';return m;}
 return{textures,mats:{foregroundGranite120:mineral('scene02-foreground-carved-granite120',[1.45,1.39,1.22]),foregroundCap120:mineral('scene02-foreground-weathered-roof120',[1.00,1.06,.94]),foregroundRecess120:mineral('scene02-foreground-stone-recess120',[.85,.94,.82]),foregroundRock120:mineral('scene02-foreground-bearing-rock120',[.70,.81,.67])}};
}

function metricUV(g){
 if(!g.attributes.normal)g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){const axis=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))].indexOf(Math.max(Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))));uv[i*2]=(axis===0?p.getZ(i):p.getX(i))/STONE_REPEAT;uv[i*2+1]=(axis===1?p.getZ(i):p.getY(i))/STONE_REPEAT;}
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;
}
function closedGeometry(positions,indices,name){
 // The same helper closes the square shaft, thick stone roof and rock bearing.
 let volume=0;for(let i=0;i<indices.length;i+=3){const a=V(positions.slice(indices[i]*3,indices[i]*3+3)),b=V(positions.slice(indices[i+1]*3,indices[i+1]*3+3)),c=V(positions.slice(indices[i+2]*3,indices[i+2]*3+3));volume+=a.dot(b.cross(c))/6;}
 if(volume<0)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();g.name=name;g.userData.closedVolume=Math.abs(volume);return metricUV(g);
}
function squareStoneProfile(rows,name='closed-profiled-square-stone'){
 const p=[],ix=[],outline=[[-1,-1+.12],[-1+.12,-1],[1-.12,-1],[1,-1+.12],[1,1-.12],[1-.12,1],[-1+.12,1],[-1,1-.12]];
 for(const [side,y,cut=.12]of rows){
  const h=side/2;
  const cornerCut=Math.min(.28,Math.max(.04,cut));
  const points=[[-1,-1+cornerCut],[-1+cornerCut,-1],[1-cornerCut,-1],[1,-1+cornerCut],[1,1-cornerCut],[1-cornerCut,1],[-1+cornerCut,1],[-1,1-cornerCut]];
  for(const [x,z]of points)p.push(x*h,y,z*h);
 }
 const ringSize=8,ringCount=rows.length;
 for(let r=0;r<ringCount-1;r++)for(let k=0;k<ringSize;k++){
  const a=r*ringSize+k,b=r*ringSize+(k+1)%ringSize,c=a+ringSize,d=b+ringSize;
  ix.push(a,b,c,b,d,c);
 }
 for(let end=0;end<2;end++){
  const n=p.length/3,row=end?ringCount-1:0,cy=rows[row][1];p.push(0,cy,0);
  for(let k=0;k<ringSize;k++){
   const a=row*ringSize+k,b=row*ringSize+(k+1)%ringSize;
   end?ix.push(n,a,b):ix.push(n,b,a);
  }
 }
 return closedGeometry(p,ix,name);
}
function squareShaft(bottomSide,topSide,y0,y1){
 const p=[],ix=[],cut=.025;
 for(const [side,y]of[[bottomSide,y0],[topSide,y1]])for(const [x,z]of[[-1,-1+cut],[-1+cut,-1],[1-cut,-1],[1,-1+cut],[1,1-cut],[1-cut,1],[-1+cut,1],[-1,1-cut]])p.push(x*side/2,y,z*side/2);
 for(let i=0;i<8;i++){const j=(i+1)%8;ix.push(i,j,i+8,j,j+8,i+8);}
 for(let end=0;end<2;end++){const n=p.length/3;p.push(0,end?y1:y0,0);for(let i=0;i<8;i++){const j=(i+1)%8;end?ix.push(n,8+i,8+j):ix.push(n,j,i);}}
 return closedGeometry(p,ix,'closed-chamfered-square-stone-shaft');
}
function closedKasa(){
 const cfg=foregroundLantern120,N=96,p=[0,cfg.roofCrownY,0],ix=[];
 // The square hip turns through a softly clipped plan. Its broad planes rise
 // gently to a low crown, while the outer rings form a carved, rolled fascia.
 const upper=[[.13,3.735],[.28,3.695],[.44,3.635],[.60,3.565],[.75,3.495],[.88,3.445],[.96,3.418],[1.0,3.400],[1.025,3.378],[1.048,3.389],[1.064,3.365],[1.064,3.325]];
 const lower=[[1.0,3.325],[.84,3.325],[.62,3.325],[.36,3.325],[.12,3.325]];
 const rings=[];
 function ring(radius,y,raiseCorners){
  const ids=[];
  if(radius===0){ids.push(p.length/3);p.push(0,y,0);return ids;}
  for(let k=0;k<N;k++){
   const a=k/N*TAU,dx=Math.cos(a),dz=Math.sin(a),norm=(Math.abs(dx)**12+Math.abs(dz)**12)**(1/12),sx=dx/norm,sz=dz/norm;
   const corner=Math.min(Math.abs(sx),Math.abs(sz))/Math.max(Math.abs(sx),Math.abs(sz));
   ids.push(p.length/3);p.push(sx*radius*cfg.roofHalfWidth,y+(raiseCorners?.045*corner**8:0),sz*radius*cfg.roofHalfWidth);
  }
  return ids;
 }
 const crown=[0];rings.push(crown);
 for(const [r,y]of upper)rings.push(ring(r,y,r<=1.0));
 for(const [r,y]of lower)rings.push(ring(r,y,false));
 const baseCenter=ring(0,3.325,false);
 const first=rings[1];for(let k=0;k<N;k++)ix.push(crown[0],first[k],first[(k+1)%N]);
 for(let j=1;j<rings.length-1;j++){
  const aRing=rings[j],bRing=rings[j+1];
  for(let k=0;k<N;k++){const n=(k+1)%N,a=aRing[k],b=aRing[n],c=bRing[k],d=bRing[n];ix.push(a,c,b,b,c,d);}
 }
 const last=rings[rings.length-1];for(let k=0;k<N;k++)ix.push(baseCenter[0],last[(k+1)%N],last[k]);
 return closedGeometry(p,ix,'closed-four-hip-carved-stone-kasa-with-rolled-eaves');
}
function bearingRock(){
 const N=80,M=10,p=[0,0,0],ix=[];
 for(let j=1;j<=M;j++)for(let k=0;k<N;k++){
  const a=k/N*TAU,t=j/M,warp=1+.055*Math.sin(a*5)+.035*Math.cos(a*9),x=Math.cos(a)*1.18*t*warp,z=Math.sin(a)*1.13*t*warp;
  // A flat real bearing patch contains every masonry-foot corner. Outside it,
  // the closed stone slopes down through the waterline rather than floating.
  const y=t<=.60?0:-.28*T.MathUtils.smoothstep(t,.60,1)+.024*Math.sin(a*7)*Math.sin((t-.6)*Math.PI/.4);
  p.push(x,y,z);
 }
 for(let k=0;k<N;k++)ix.push(0,1+(k+1)%N,1+k);
 for(let j=0;j<M-1;j++)for(let k=0;k<N;k++){const a=1+j*N+k,b=1+j*N+(k+1)%N,c=a+N,d=b+N;ix.push(a,b,c,b,d,c);}
 const bottom=p.length/3;p.push(0,-.48,0);
 for(let k=0;k<N;k++){const n=(k+1)%N,a=1+(M-1)*N+k,b=1+(M-1)*N+n;ix.push(bottom,a,b);}
 return closedGeometry(p,ix,'closed-natural-rock-with-flat-masonry-bearing');
}

export function foregroundLanternFootprint120(x,z,margin=0){
 const [cx,,cz]=foregroundLantern120.anchor,dx=x-cx,dz=z-cz,c=Math.cos(foregroundLantern120.yaw),s=Math.sin(foregroundLantern120.yaw),u=c*dx-s*dz,v=s*dx+c*dz;
 return(u/(1.28+margin))**2+(v/(1.28+margin))**2<1||foregroundLantern120.footingRocks.some(([x,,z,sx,,sz])=>((u-x)/(sx+margin))**2+((v-z)/(sz+margin))**2<1);
}

export function buildForegroundStoneLantern120({b,mats}){
 const cfg=foregroundLantern120,granite=mats.foregroundGranite120,cap=mats.foregroundCap120,recess=mats.foregroundRecess120,rock=mats.foregroundRock120;
 const bronze=new T.MeshStandardMaterial({name:'scene02-foreground-lantern-bronze120',color:0x574223,roughness:.65,metalness:.56}),glow=new T.MeshStandardMaterial({name:'scene02-foreground-lantern-inner-paper120',color:0x9c5e20,emissive:0xffb743,emissiveIntensity:1.7,roughness:.65,side:T.DoubleSide});mats.foregroundBronze120=bronze;mats.foregroundGlow120=glow;
 let pieces=0;const geos=[];
 function put(g,ma,p=[0,0,0],rot=[0,0,0]){g.applyMatrix4(new T.Matrix4().compose(V(p),new T.Quaternion().setFromEuler(new T.Euler(...rot)),V([1,1,1])));metricUV(g);b.put(g,ma);geos.push(g);pieces++;}
 function box(size,p,ma=granite,bevel=.009){put(new RoundedBoxGeometry(...size,2,bevel),ma,p);}
 function turn(profile,ma=granite,segments=48){put(revolveProfile(profile,segments,'closed-scene02-stone-turning'),ma);}
 function face(g,ma,x,y,z,yaw,rz=0){const m=new T.Matrix4().makeRotationY(yaw).multiply(new T.Matrix4().makeTranslation(x,y,z)).multiply(new T.Matrix4().makeRotationZ(rz));g.applyMatrix4(m);put(g,ma);}
 b.at(cfg.anchor,cfg.yaw,()=>{
  put(bearingRock(),rock);
  for(const [x,y,z,sx,sy,sz]of cfg.footingRocks){
   const g=new T.IcosahedronGeometry(1,4),p=g.attributes.position;
   for(let i=0;i<p.count;i++){const xx=p.getX(i),yy=p.getY(i),zz=p.getZ(i),q=1+.08*Math.sin(xx*9+yy*7-zz*6);p.setXYZ(i,xx*q*sx,yy*q*sy,zz*q*sz);}g.computeVertexNormals();put(g,rock,[x,y,z]);
  }
  // Broad carved foot, a square shaft and a continuous compression capital.
  box([.78,.60,.78],[0,.30,0]);box([.94,.14,.94],[0,.67,0]);box([.61,.11,.61],[0,.795,0]);
  put(squareShaft(.50,.43,.85,1.95),granite);put(squareShaft(.46,.93,1.95,2.13),granite);
  box([1.10,.24,1.10],[0,2.25,0]);box([1.16,.08,1.16],[0,2.41,0]);box([1.00,.08,1.00],[0,2.49,0]);
  // Actual recessed fields and small raised stone leaves, on the solid stem.
  const petalShape=new T.Shape();petalShape.moveTo(0,0);petalShape.bezierCurveTo(-.035,.03,-.035,.10,0,.145);petalShape.bezierCurveTo(.035,.10,.035,.03,0,0);
  for(let f=0;f<4;f++){
   const a=f*Math.PI/2;
   face(new RoundedBoxGeometry(.63,.36,.018,2,.003),recess,0,.31,.398,a);
   face(new RoundedBoxGeometry(.20,.80,.018,2,.003),recess,0,1.38,.233,a);
   for(let k=0;k<4;k++){const petal=new T.ExtrudeGeometry(petalShape,{depth:.012,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,steps:1,curveSegments:5,bevelSegments:1});face(petal,granite,.025*Math.sin(k*2),1.03+k*.20,.245,a,(k%2?1:-1)*.65);}
  }
  // Four true open/recessed light faces, with thick stone corner reveals.
  for(const x of[-.36,.36])for(const z of[-.36,.36])box([.14,.72,.14],[x,2.89,z]);
  box([1.00,.09,1.00],[0,3.295,0]);
  for(let f=0;f<4;f++){
   const a=f*Math.PI/2;
   face(new T.PlaneGeometry(.59,.66),glow,0,2.88,.325,a);
   for(let k=-2;k<=2;k++)face(new T.BoxGeometry(.014,.66,.020),bronze,k*.105,2.88,.356,a);
   for(let k=-2;k<=2;k++)face(new T.BoxGeometry(.59,.012,.021),bronze,0,2.88+k*.116,.360,a);
   face(new T.TorusGeometry(.119,.012,7,32),bronze,0,2.88,.374,a);
  }
  put(closedKasa(),cap);
  turn([[0,3.73],[.105,3.73],[.15,3.76],[.14,3.80],[.105,3.82],[.095,3.85],[.12,3.88],[.12,3.92],[.10,3.96],[.065,4.0],[.04,4.025],[.023,4.055],[0,4.09]],cap);
 });
 const light=new T.PointLight(0xffb450,8,5,2);light.position.copy(V([0,2.88,0]).applyAxisAngle(V([0,1,0]),cfg.yaw).add(V(cfg.anchor)));
 const matrix=new T.Matrix4().compose(V(cfg.anchor),new T.Quaternion().setFromAxisAngle(V([0,1,0]),cfg.yaw),V([1,1,1])),bounds=new T.Box3();
 geos.forEach(g=>{g.computeBoundingBox();bounds.union(g.boundingBox.clone().applyMatrix4(matrix));});
 return{light,stats:{revision:'scene02-foreground-stonelantern120',pieces,commonAnchor:cfg.anchor,commonYaw:cfg.yaw,levels:cfg,worldBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},bearingContactWorldY:cfg.anchor[1],masonryBottomWorldY:cfg.anchor[1],bearingPatchRadiusMetres:.60,maximumMasonryCornerRadiusMetres:Math.hypot(.39,.39),closedRoof:true,closedSquareShaft:true,closedBearingRock:true,metricStoneRepeatMetres:STONE_REPEAT,referencePhotographUsedAsTexture:false,visualAccepted:false}};
}
