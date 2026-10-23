import * as T from 'three';
export const REBUILD213_REVISION='scene08-through-arch-stream-inlet213-r09';

const hash=(x,y,z=0)=>{const a=Math.sin(x*127.1+y*311.7+z*74.7+213.6)*43758.5453;return a-Math.floor(a);};
function noise(x,y,z){const a=Math.floor(x),b=Math.floor(y),c=Math.floor(z),f=[x-a,y-b,z-c].map(t=>t*t*(3-2*t)),mix=T.MathUtils.lerp;return mix(mix(mix(hash(a,b,c),hash(a+1,b,c),f[0]),mix(hash(a,b+1,c),hash(a+1,b+1,c),f[0]),f[1]),mix(mix(hash(a,b,c+1),hash(a+1,b,c+1),f[0]),mix(hash(a,b+1,c+1),hash(a+1,b+1,c+1),f[0]),f[1]),f[2]);}

// Coordinate-continuous displacement keeps duplicate seam vertices together.
// The same mineral colour field follows the actual stone, never a view image.
function age(g,seed=0,wear=.008){
 const p=g.attributes.position,uv=[],colors=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),q=noise(x*14+seed,y*14,z*14),r=noise(x*47,y*47+seed,z*47);
  p.setXYZ(i,x+wear*(noise(x*19+9,y*19,z*19)-.5),y+wear*(q-.5)+wear*.28*(r-.5),z+wear*(noise(x*17,y*17,z*17+13)-.5));
  const broad=noise(x*4+seed,y*3.8,z*4),speck=noise(x*39,y*39,z*39),tone=.55+.33*broad+.17*speck,lichen=T.MathUtils.smoothstep(noise(x*9+seed,y*9,z*9),.64,.79);
  colors.push(tone*(1-.10*lichen),tone*(1-.015*lichen),tone*(1-.22*lichen));uv.push(x*1.10+z*.31,y*1.10);
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
 const W=.74,D=.69,N=84,pp=[],ix=[],uv=[],at=(x,z)=>{const u=x/W,v=z/D,t=Math.max(Math.abs(u),Math.abs(v)),corner=Math.min(Math.abs(u),Math.abs(v));return 2.54+.46*Math.pow(Math.max(0,1-t),1.30)+.10*Math.pow(t,8)*(.13+.87*Math.pow(corner,6));};
 const add=(x,y,z)=>{const i=pp.length/3;pp.push(x,y,z);uv.push(x,z);return i;};
 // Granite kasa has a solid hipped body and a level bearing soffit above
 // the chamber. A constant-thickness curved sheet left a real 48mm gap.
 for(let layer=0;layer<2;layer++)for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=-W+2*W*i/N,z=-D+2*D*j/N,t=Math.max(Math.abs(x/W),Math.abs(z/D)),corner=Math.min(Math.abs(x/W),Math.abs(z/D)),bottom=2.468-.073*T.MathUtils.smoothstep(t,.68,1)+.10*Math.pow(t,8)*(.13+.87*Math.pow(corner,6));add(x*(layer?.94:1),layer?bottom:at(x,z),z*(layer?.94:1));}
 const S=(N+1)*(N+1);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;ix.push(a,c,b,b,c,d,a+S,b+S,c+S,b+S,d+S,c+S);}
 const edge=[];for(let i=0;i<N;i++)edge.push(i);for(let j=0;j<N;j++)edge.push(j*(N+1)+N);for(let i=N;i>0;i--)edge.push(N*(N+1)+i);for(let j=N;j>0;j--)edge.push(j*(N+1));
 const lip=edge.map(i=>add(pp[i*3]*1.012,pp[i*3+1]-.050,pp[i*3+2]*1.012));
 for(let k=0;k<edge.length;k++){const j=(k+1)%edge.length,a=edge[k],b=edge[j],v=[a,b,lip[j],lip[k],a+S,b+S].map(i=>add(pp[i*3],pp[i*3+1],pp[i*3+2]));ix.push(v[0],v[1],v[2],v[0],v[2],v[3],v[3],v[2],v[5],v[3],v[5],v[4]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);return age(g,41,.024);
}
function mossOn(geometry){
 const p=geometry.attributes.position,n=geometry.attributes.normal,ix=geometry.index,pp=[],cc=[],tris=[],vertices=new Map(),boundary=new Map();let grownArea=0,stoneArea=0;
 const sample=i=>{const v=new T.Vector3().fromBufferAttribute(p,i),nn=new T.Vector3().fromBufferAttribute(n,i),growth=.62*noise(v.x*6+7,v.y*3,v.z*6)+.38*noise(v.x*19,v.y*7+3,v.z*19);return{v,n:nn,f:Math.min(growth-.545,(nn.y-.30)*.4,v.y-2.57,.705-Math.abs(v.x),.645-Math.abs(v.z))};};
 function vertex(a){const key=a.v.toArray().map(v=>Math.round(v*1e6)).join(',');if(vertices.has(key))return vertices.get(key);const i=pp.length/3,nn=a.n.clone().normalize(),shade=.48+.35*noise(a.v.x*27,a.v.y*27,a.v.z*27),bottom=a.v.clone().addScaledVector(nn,.001),top=a.v.clone().addScaledVector(nn,.0018+(.008+.024*noise(a.v.x*31,a.v.y*31,a.v.z*31))*T.MathUtils.smoothstep(a.f,0,.065));pp.push(...bottom.toArray(),...top.toArray());for(let j=0;j<2;j++)cc.push(shade*.78,shade,shade*.60);vertices.set(key,i);return i;}
 for(let k=0,N=ix?.count??p.count;k<N;k+=3){const src=[0,1,2].map(i=>sample(ix?ix.getX(k+i):k+i)),cross=src[1].v.clone().sub(src[0].v).cross(src[2].v.clone().sub(src[0].v)),area=cross.length()*.5;if(cross.y<=0)continue;stoneArea+=area;const poly=[];
  for(let i=0;i<3;i++){const a=src[i],b=src[(i+1)%3];if(a.f>=0)poly.push(a);if((a.f>=0)!==(b.f>=0)){const t=a.f/(a.f-b.f);poly.push({v:a.v.clone().lerp(b.v,t),n:a.n.clone().lerp(b.n,t).normalize(),f:0});}}
  if(poly.length<3)continue;const ids=poly.map(vertex);for(let j=1;j+1<poly.length;j++){tris.push(ids[0]+1,ids[j]+1,ids[j+1]+1,ids[0],ids[j+1],ids[j]);grownArea+=poly[j].v.clone().sub(poly[0].v).cross(poly[j+1].v.clone().sub(poly[0].v)).length()*.5;}
  for(let i=0;i<ids.length;i++){const a=ids[i],b=ids[(i+1)%ids.length];if(a===b)continue;const key=[Math.min(a,b),Math.max(a,b)].join(','),e=boundary.get(key);if(e)e.count++;else boundary.set(key,{a,b,count:1});}
 }
 for(const{a,b,count}of boundary.values())if(count===1)tris.push(a,b,b+1,a,b+1,a+1);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('color',new T.Float32BufferAttribute(cc,3));g.setIndex(tris);g.computeVertexNormals();g.name='scene08-213-closed-clipped-moss-colonies';g.userData={mossAreaFraction:grownArea/stoneArea,closedColonyShell:true,edgeWallsOnlyOnExposedBoundaries:true};return g;
}
function lotusPetal(){const s=new T.Shape();s.moveTo(0,-.095);s.bezierCurveTo(-.080,-.045,-.078,.045,0,.105);s.bezierCurveTo(.078,.045,.080,-.045,0,-.095);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.025,bevelEnabled:true,bevelSize:.004,bevelThickness:.005,bevelSegments:2,curveSegments:12});g.translate(0,0,-.0125);return age(g,18,.005);}

export function createWeatheredToro213({materials,ownedMaterials,ownedTextures}){
 const source=materials.carvedstone,maps=[source.map,source.normalMap,source.roughnessMap].map(t=>{const q=t.clone();q.repeat.set(1,1);q.needsUpdate=true;ownedTextures.push(q);return q;}),stone=new T.MeshStandardMaterial({name:'scene08-213-cut-and-pitted-pale-granite',color:0xe8e4d7,map:maps[0],normalMap:maps[1],normalScale:new T.Vector2(.62,.62),roughnessMap:maps[2],roughness:.98,vertexColors:true}),damp=stone.clone(),moss=new T.MeshStandardMaterial({name:'scene08-213-solid-moss-cushions',color:0x3f4c2c,roughness:1,vertexColors:true}),metal=new T.MeshStandardMaterial({name:'scene08-213-oxidised-chamber-grille',color:0x353122,roughness:.81,metalness:.36}),paper=materials.lanternamber.clone();damp.name='scene08-213-damp-granite-kasa';damp.color.setHex(0xc3c6b6);paper.name='scene08-213-recessed-stone-lamp-paper';paper.color.setHex(0xe0bf86);paper.emissiveIntensity=.16;ownedMaterials.push(stone,damp,moss,metal,paper);
 const foot=course([[0,0],[.43,0],[.49,.05],[.49,.12],[.45,.21],[.34,.27],[0,.27]],8,2),shaft=[];
 for(let j=0;j<3;j++){const lo=.255+j*.36,hi=lo+.354;shaft.push(course([[0,lo],[.218,lo],[.230,lo+.04],[.227,hi-.025],[.214,hi],[0,hi]],48,8+j));}
 const collar=course([[0,1.31],[.24,1.31],[.31,1.36],[.40,1.42],[.45,1.49],[.42,1.55],[0,1.55]],48,13),bowl=course([[0,1.50],[.38,1.50],[.47,1.55],[.535,1.64],[.53,1.70],[.49,1.78],[0,1.78]],32,17),sill=stoneBlock(.94,.095,.90,21),pier=stoneBlock(.13,.655,.13,23),lintel=stoneBlock(.97,.11,.93,27),kasa=roof(),mossGeo=mossOn(kasa),neck=course([[0,2.98],[.083,2.98],[.088,3.015],[.075,3.055],[.073,3.12],[0,3.12]],48,31),ball=age(new T.SphereGeometry(.173,56,36).translate(0,3.288,0),37,.018),petal=lotusPetal(),builds=[];
 function build(api,x,z,y,scale){const{group,emit,box}=api;group(x,y,z,.08,()=>{
  emit(foot,stone);for(const g of shaft)emit(g,stone);emit(collar,stone);emit(bowl,stone);emit(sill,stone,0,1.805,0);emit(lintel,stone,0,2.43,0);
  for(const xx of[-.37,.37])for(const zz of[-.35,.35])emit(pier,stone,xx,2.095,zz);
  for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
   box(0,2.10,.333,.56,.52,.009,paper);for(const xx of[-.27,.27])box(xx,2.10,.379,.022,.57,.022,metal);for(const yy of[1.825,2.375])box(0,yy,.379,.56,.022,.022,metal);
   for(const xx of[-.18,0,.18])box(xx,2.10,.385,.011,.52,.015,metal);for(const yy of[1.94,2.10,2.26])box(0,yy,.386,.54,.010,.015,metal);
  });
  for(let j=0;j<12;j++){const a=j*Math.PI/6;emit(petal,stone,Math.sin(a)*.414,1.435,Math.cos(a)*.414,1,1,1,[0,a,0]);}
  emit(kasa,damp);emit(mossGeo,moss);emit(neck,stone);emit(ball,stone);
 },scale);builds.push({anchor:[x,y,z],scale,singleCrownSphere:true,localHeight:3.47,capEdgeThickness:.145,solidCrownThickness:.532,levelBearingSoffitY:2.468,chamberClearHeight:.52,closedHollowChamber:true});}
 return{build,info:{revision:'scene08-solid-granite-bearing-kasa213-r04',builds,moss:mossGeo.userData,source:'Authored closed stone geometry, same independent CC0 granite scans; comparison photograph never sampled',originalStackedBulbsRetired:true,newExternalAssets:false,visualAccepted:false}};
}
