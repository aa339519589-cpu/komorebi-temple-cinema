import * as T from 'three';
export const REBUILD213_REVISION='scene08-satin-amber-wood-worn-gold213-r23';

const hash=(x,y,z=0)=>{const a=Math.sin(x*127.1+y*311.7+z*74.7+213.6)*43758.5453;return a-Math.floor(a);};
function noise(x,y,z){const a=Math.floor(x),b=Math.floor(y),c=Math.floor(z),f=[x-a,y-b,z-c].map(t=>t*t*(3-2*t)),mix=T.MathUtils.lerp;return mix(mix(mix(hash(a,b,c),hash(a+1,b,c),f[0]),mix(hash(a,b+1,c),hash(a+1,b+1,c),f[0]),f[1]),mix(mix(hash(a,b,c+1),hash(a+1,b,c+1),f[0]),mix(hash(a,b+1,c+1),hash(a+1,b+1,c+1),f[0]),f[1]),f[2]);}

// Coordinate-continuous displacement keeps duplicate seam vertices together.
// The same mineral colour field follows the actual stone, never a view image.
function age(g,seed=0,wear=.008){
 const p=g.attributes.position,uv=[],colors=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),q=noise(x*14+seed,y*14,z*14),r=noise(x*47,y*47+seed,z*47);
  p.setXYZ(i,x+wear*(noise(x*19+9,y*19,z*19)-.5),y+wear*(q-.5)+wear*.28*(r-.5),z+wear*(noise(x*17,y*17,z*17+13)-.5));
  const broad=noise(x*4+seed,y*3.8,z*4),speck=noise(x*39,y*39,z*39),lichen=T.MathUtils.smoothstep(noise(x*12+seed*.31,y*8,z*12),.49,.69),salt=T.MathUtils.smoothstep(noise(x*8+seed,y*11,z*8),.53,.72),tone=(.56+.33*broad+.17*speck)*(1-.63*lichen)+.20*salt;
  colors.push(tone*(1-.075*lichen),tone*(1-.015*lichen),tone*(1-.19*lichen));uv.push(x*1.10+z*.31,y*1.10);
 }
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();const out=g.index?g.toNonIndexed():g;if(out!==g)g.dispose();const v=out.attributes.position,t=out.attributes.uv;
 for(let i=0;i<v.count;i+=3){const a=new T.Vector3().fromBufferAttribute(v,i),b=new T.Vector3().fromBufferAttribute(v,i+1),c=new T.Vector3().fromBufferAttribute(v,i+2),n=b.sub(a).cross(c.sub(a)).normalize(),up=Math.abs(n.y)>.55,side=Math.abs(n.x)>Math.abs(n.z);for(let k=0;k<3;k++)t.setXY(i+k,(up?v.getX(i+k):side?v.getZ(i+k):v.getX(i+k))*1.1,(up?v.getZ(i+k):v.getY(i+k))*1.1);}
 out.computeBoundingBox();out.userData={...out.userData,authoredWeatheredSolid213:true,metricTriangleUVs:true};return out;
}
function course(profile,sides=64,seed=1){
 const pts=[];for(let j=0;j+1<profile.length;j++)for(let k=0;k<5;k++){const t=k/5;pts.push(new T.Vector2(T.MathUtils.lerp(profile[j][0],profile[j+1][0],t),T.MathUtils.lerp(profile[j][1],profile[j+1][1],t)));}pts.push(new T.Vector2(...profile.at(-1)));
 return age(new T.LatheGeometry(pts,sides),seed,.018);
}
function stoneBlock(w,h,d,seed){
 const g=new T.BoxGeometry(w,h,d,12,14,12),p=g.attributes.position,r=Math.min(.018,w*.08,h*.08,d*.08),half=[w/2-r,h/2-r,d/2-r];
 for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),c=new T.Vector3(T.MathUtils.clamp(v.x,-half[0],half[0]),T.MathUtils.clamp(v.y,-half[1],half[1]),T.MathUtils.clamp(v.z,-half[2],half[2]));v.sub(c).normalize().multiplyScalar(r).add(c);p.setXYZ(i,v.x,v.y,v.z);}return age(g,seed,.018);
}
function roof(){
 const W=.65,D=.61,C=.115,perEdge=18,pp=[],ix=[],uv=[],outline=[[-W,-D+C],[-W+C,-D],[W-C,-D],[W,-D+C],[W,D-C],[W-C,D],[-W+C,D],[-W,D-C]],edge=[];
 for(let side=0;side<8;side++)for(let j=0;j<perEdge;j++){const t=j/perEdge,a=outline[side],b=outline[(side+1)%8];edge.push([T.MathUtils.lerp(a[0],b[0],t),T.MathUtils.lerp(a[1],b[1],t)]);}
 const add=(x,y,z)=>{const i=pp.length/3;pp.push(x,y,z);uv.push(x,z);return i;},corner=(x,z)=>Math.pow(Math.min(Math.abs(x/W),Math.abs(z/D)),5),height=(x,z,t)=>2.66+.48*Math.pow(Math.max(0,1-t),1.45)+.125*Math.pow(t,8)*corner(x,z);
 const top=add(0,3.14,0),rings=[];
 // One closed cut-corner stone body: four broad hipped faces, eight plan
 // corners, a separately turned drip edge, and a flat inner bearing seat.
 for(let j=1;j<=28;j++){const t=j/28;rings.push(edge.map(([x,z])=>add(x*t,height(x,z,t),z*t)));}
 for(const [scale,drop]of[[1.018,.043],[.997,.128]])rings.push(edge.map(([x,z])=>add(x*scale,height(x,z,1)-drop,z*scale)));
 rings.push(edge.map(([x,z])=>add(x*.92,2.508+.125*corner(x,z),z*.92)));
 rings.push(edge.map(([x,z])=>add(x*.64,2.588,z*.64)));
 const bottom=add(0,2.588,0),N=edge.length;
 for(let k=0;k<N;k++){const j=(k+1)%N;ix.push(top,rings[0][j],rings[0][k]);}
 for(let r=0;r+1<rings.length;r++)for(let k=0;k<N;k++){const j=(k+1)%N,a=rings[r][k],b=rings[r][j],c=rings[r+1][k],d=rings[r+1][j];ix.push(a,b,c,b,d,c);}
 for(let k=0;k<N;k++){const j=(k+1)%N;ix.push(bottom,rings.at(-1)[k],rings.at(-1)[j]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);const out=age(g,41,.018);out.name='scene08-213-cut-corner-hipped-kasa-solid';out.userData={...out.userData,cutCorners:8,bearingSoffitY:2.588,raisedRim:true};return out;
}
function mossOn(geometry){
 const p=geometry.attributes.position,n=geometry.attributes.normal,ix=geometry.index,pp=[],cc=[],tris=[],vertices=new Map(),boundary=new Map();let grownArea=0,stoneArea=0;
 const sample=i=>{const v=new T.Vector3().fromBufferAttribute(p,i),nn=new T.Vector3().fromBufferAttribute(n,i),growth=.62*noise(v.x*6+7,v.y*3,v.z*6)+.38*noise(v.x*19,v.y*7+3,v.z*19);return{v,n:nn,f:Math.min(growth-.545,(nn.y-.30)*.4,v.y-2.73,.615-Math.abs(v.x),.575-Math.abs(v.z))};};
 function vertex(a){const key=a.v.toArray().map(v=>Math.round(v*1e6)).join(',');if(vertices.has(key))return vertices.get(key);const i=pp.length/3,nn=a.n.clone().normalize(),shade=.48+.35*noise(a.v.x*27,a.v.y*27,a.v.z*27),bottom=a.v.clone().addScaledVector(nn,.001),top=a.v.clone().addScaledVector(nn,.0018+(.008+.024*noise(a.v.x*31,a.v.y*31,a.v.z*31))*T.MathUtils.smoothstep(a.f,0,.065));pp.push(...bottom.toArray(),...top.toArray());for(let j=0;j<2;j++)cc.push(shade*.78,shade,shade*.60);vertices.set(key,i);return i;}
 for(let k=0,N=ix?.count??p.count;k<N;k+=3){const src=[0,1,2].map(i=>sample(ix?ix.getX(k+i):k+i)),cross=src[1].v.clone().sub(src[0].v).cross(src[2].v.clone().sub(src[0].v)),area=cross.length()*.5;if(cross.y<=0)continue;stoneArea+=area;const poly=[];
  for(let i=0;i<3;i++){const a=src[i],b=src[(i+1)%3];if(a.f>=0)poly.push(a);if((a.f>=0)!==(b.f>=0)){const t=a.f/(a.f-b.f);poly.push({v:a.v.clone().lerp(b.v,t),n:a.n.clone().lerp(b.n,t).normalize(),f:0});}}
  if(poly.length<3)continue;const ids=poly.map(vertex);for(let j=1;j+1<poly.length;j++){tris.push(ids[0]+1,ids[j]+1,ids[j+1]+1,ids[0],ids[j+1],ids[j]);grownArea+=poly[j].v.clone().sub(poly[0].v).cross(poly[j+1].v.clone().sub(poly[0].v)).length()*.5;}
  for(let i=0;i<ids.length;i++){const a=ids[i],b=ids[(i+1)%ids.length];if(a===b)continue;const key=[Math.min(a,b),Math.max(a,b)].join(','),e=boundary.get(key);if(e)e.count++;else boundary.set(key,{a,b,count:1});}
 }
 for(const{a,b,count}of boundary.values())if(count===1)tris.push(a,b,b+1,a,b+1,a+1);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('color',new T.Float32BufferAttribute(cc,3));g.setIndex(tris);g.computeVertexNormals();g.name='scene08-213-closed-clipped-moss-colonies';g.userData={mossAreaFraction:grownArea/stoneArea,closedColonyShell:true,edgeWallsOnlyOnExposedBoundaries:true};return g;
}
function scallopedSeat(){
 const profile=[[0,1.475],[.265,1.475],[.365,1.515],[.455,1.58],[.49,1.655],[.492,1.70],[.455,1.77],[0,1.77]],N=128,pp=[],ix=[];
 for(let j=0;j<profile.length;j++)for(let k=0;k<=N;k++){
  const a=k/N*Math.PI*2,face=((a+Math.PI/8)%(Math.PI/4))-Math.PI/8,[r,y]=profile[j],rr=r*Math.cos(Math.PI/8)/Math.cos(face),lobe=(.5+.5*Math.cos(a*8))*([0,0,.042,.031,.006,0,0,0][j]);pp.push(Math.sin(a)*rr,y-lobe,Math.cos(a)*rr);
 }
 for(let j=0;j+1<profile.length;j++)for(let k=0;k<N;k++){const a=j*(N+1)+k,b=a+1,c=a+N+1,d=c+1;ix.push(a,b,c,b,d,c);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setIndex(ix);const out=age(g,17,.013);out.name='scene08-213-octagonal-integral-scalloped-seat';return out;
}
function cornerScroll(){
 const s=new T.Shape();s.moveTo(.44,2.685);s.bezierCurveTo(.54,2.70,.65,2.745,.72,2.79);s.bezierCurveTo(.805,2.84,.79,2.948,.72,2.965);s.bezierCurveTo(.645,2.985,.60,2.907,.638,2.856);s.bezierCurveTo(.657,2.829,.695,2.843,.690,2.867);s.bezierCurveTo(.682,2.885,.664,2.875,.670,2.865);s.bezierCurveTo(.650,2.885,.675,2.926,.713,2.915);s.bezierCurveTo(.755,2.903,.751,2.858,.709,2.838);s.bezierCurveTo(.63,2.80,.535,2.765,.44,2.753);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:.066,steps:1,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,curveSegments:16});g.translate(0,0,-.033);const out=age(g,48,.007);out.name='scene08-213-solid-carved-kasa-corner-scroll';return out;
}

export function createWeatheredToro213({materials,ownedMaterials,ownedTextures}){
 const source=materials.carvedstone,maps=[source.map,source.normalMap,source.roughnessMap].map(t=>{const q=t.clone();q.repeat.set(1,1);q.needsUpdate=true;ownedTextures.push(q);return q;}),stone=new T.MeshStandardMaterial({name:'scene08-213-cut-and-pitted-pale-granite',color:0xe8e4d7,map:maps[0],normalMap:maps[1],normalScale:new T.Vector2(.62,.62),roughnessMap:maps[2],roughness:.98,vertexColors:true}),damp=stone.clone(),moss=new T.MeshStandardMaterial({name:'scene08-213-solid-moss-cushions',color:0x3f4c2c,roughness:1,vertexColors:true}),metal=new T.MeshStandardMaterial({name:'scene08-213-oxidised-chamber-grille',color:0x353122,roughness:.81,metalness:.36}),paper=materials.lanternamber.clone();damp.name='scene08-213-damp-granite-kasa';damp.color.setHex(0xc3c6b6);paper.name='scene08-213-recessed-stone-lamp-paper';paper.color.setHex(0xe0bf86);paper.emissiveIntensity=.16;ownedMaterials.push(stone,damp,moss,metal,paper);
 const foot=course([[0,0],[.43,0],[.49,.05],[.49,.12],[.45,.21],[.34,.27],[0,.27]],8,2),shaft=[];
 for(let j=0;j<3;j++){const lo=.255+j*.405,hi=lo+.395;shaft.push(course([[0,lo],[.218,lo],[.230,lo+.04],[.227,hi-.025],[.214,hi],[0,hi]],48,8+j));}
 const collar=course([[0,1.45],[.24,1.45],[.31,1.48],[.35,1.525],[.33,1.57],[0,1.57]],8,13),bowl=scallopedSeat(),sill=stoneBlock(.82,.095,.78,21),sillBead=stoneBlock(.78,.045,.74,22),pier=stoneBlock(.125,.775,.125,23),pierBead=stoneBlock(.026,.70,.032,24),lintel=stoneBlock(.85,.11,.81,27),lintelBead=stoneBlock(.80,.038,.76,28),kasa=roof(),mossGeo=mossOn(kasa),neck=course([[0,3.11],[.091,3.11],[.10,3.14],[.080,3.178],[0,3.178]],32,31),ball=age(new T.SphereGeometry(.147,56,36).translate(0,3.319,0),37,.015),scroll=cornerScroll(),builds=[];
 function build(api,x,z,y,scale){const{group,emit,box}=api,yaw=scale>1?-.20:.08;group(x,y,z,yaw,()=>{
  emit(foot,stone);for(const g of shaft)emit(g,stone);emit(collar,stone);emit(bowl,stone);emit(sill,stone,0,1.805,0);emit(sillBead,stone,0,1.866,0);emit(lintel,stone,0,2.55,0);emit(lintelBead,stone,0,2.488,0);
  for(const xx of[-.2975,.2975])for(const zz of[-.2775,.2775])emit(pier,stone,xx,2.155,zz);
  for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
   const wide=face%2?.425:.465,plane=face%2?.293:.273;
   box(0,2.172,plane,wide,.592,.009,paper);for(const xx of[-wide/2,wide/2])box(xx,2.172,plane+.038,.018,.608,.022,metal);for(const yy of[1.87,2.475])box(0,yy,plane+.038,wide,.019,.022,metal);
   for(const xx of[-wide*.30,-wide*.10,wide*.10,wide*.30])box(xx,2.172,plane+.043,.009,.592,.014,metal);for(const yy of[2.025,2.172,2.319])box(0,yy,plane+.044,wide,.009,.014,metal);
   for(const sign of[-1,1])emit(pierBead,stone,sign*(wide/2+.035),2.165,plane+.065);
  });
  for(const a of[Math.atan2(.61,.65),Math.PI-Math.atan2(.61,.65),Math.PI+Math.atan2(.61,.65),-Math.atan2(.61,.65)])emit(scroll,damp,0,0,0,1,1,1,[0,-a,0]);
  emit(kasa,damp);emit(mossGeo,moss);emit(neck,stone);emit(ball,stone);
 },scale);builds.push({anchor:[x,y,z],scale,yaw,singleCrownSphere:true,localHeight:3.466,capHalfWidth:.65,capHalfDepth:.61,cutCornerPlan:true,capScrolls:4,capEdgeThickness:.128,solidCrownThickness:.552,levelBearingSoffitY:2.588,chamberClearHeight:.592,integralScallopedSeat:true,detachedLotusPetals:0,closedHollowChamber:true});}
 return{build,info:{revision:'scene08-chamfered-carved-stone-toro213-r21',builds,moss:mossGeo.userData,source:'Authored closed stone geometry, same independent CC0 granite scans; comparison photograph never sampled',originalStackedBulbsRetired:true,newExternalAssets:false,visualAccepted:false}};
}
