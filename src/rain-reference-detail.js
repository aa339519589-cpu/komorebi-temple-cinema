/** Camera-independent 3D courtyard detail reconstructed from the rainy reference. */
import * as T from 'three';
const TAU=2*Math.PI,UP=new T.Vector3(0,1,0);
function rng(seed){return()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);}
function leafGeometry(){
 const p=[0,0,0,-.25,.055,.4,0,.09,.46,.25,.055,.4,0,.01,1],uv=[.5,0,0,.4,.5,.46,1,.4,.5,1];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex([0,2,1,0,3,2,1,2,4,2,3,4]);g.computeVertexNormals();return g;
}
function grainMaterial(name,color,roughness,metalness=0,scale=12){
 const material=new T.MeshStandardMaterial({name,color,roughness,metalness});
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vRainDetail;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
   vec4 dp=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\n dp=instanceMatrix*dp;\n#endif\n vRainDetail=(modelMatrix*dp).xyz;`);
  shader.fragmentShader='varying vec3 vRainDetail;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float grain=sin(vRainDetail.x*${scale.toFixed(2)}+sin(vRainDetail.z*${(scale*.77).toFixed(2)}))*sin(vRainDetail.z*${(scale*1.9).toFixed(2)}+sin(vRainDetail.y*31.0));
   float fleck=sin(dot(vRainDetail,vec3(271.31,379.73,197.87)))*sin(dot(vRainDetail,vec3(137.91,497.77,173.32)));
   diffuseColor.rgb*=.86+.13*grain+.04*fleck;`);
 };
 material.customProgramCacheKey=()=>`reference-rain-detail-${name}-${scale}`;return material;
}
export function buildRainReferenceDetail(){
 const group=new T.Group();group.name='reference10-fitted-courtyard-detail';
 const random=rng(7417321),rr=(a,b)=>a+(b-a)*random(),owned=[],buckets=new Map(),temp=new T.Object3D(),colour=new T.Color();
 const own=x=>(owned.push(x),x);
 const materials={rock:own(grainMaterial('rain-bank-granite','#303737',.51,0,28)),moss:own(grainMaterial('rain-bank-moss','#334126',.93,0,38)),slab:own(grainMaterial('rain-walkway-granite','#595952',.20,0,49)),foundation:own(grainMaterial('rain-walkway-masonry','#3d4443',.72,0,19)),leaf:own(new T.MeshStandardMaterial({name:'rain-shrub-curved-leaf',color:'#344827',roughness:.38,side:T.DoubleSide})),fern:own(new T.MeshStandardMaterial({name:'rain-fern-pinna',color:'#455c32',roughness:.46,side:T.DoubleSide})),petal:own(new T.MeshStandardMaterial({name:'rain-azalea-petal',color:'#b76c83',roughness:.57,side:T.DoubleSide})),bark:own(grainMaterial('rain-shrub-bark','#4c4439',.84,0,22)),red:own(grainMaterial('rain-near-railing-lacquer','#7e251a',.22,0,18)),gold:own(grainMaterial('rain-near-railing-brass','#d1a240',.19,.91,32)),black:own(new T.MeshStandardMaterial({name:'rain-rail-iron',color:'#1c2020',roughness:.27,metalness:.76}))};
 const box=own(new T.BoxGeometry(1,1,1)),cylinder=own(new T.CylinderGeometry(1,1,1,8)),leaf=own(leafGeometry());
 function emit(geometry,material,position,scale,rotation=null,shade=1){const key=geometry.uuid+'/'+material.uuid;if(!buckets.has(key))buckets.set(key,{geometry,material,items:[]});temp.position.fromArray(position);temp.scale.fromArray(scale);if(rotation?.isQuaternion)temp.quaternion.copy(rotation);else temp.rotation.set(...(rotation??[0,0,0]));temp.updateMatrix();buckets.get(key).items.push({matrix:temp.matrix.clone(),shade});}
 function beam(a,b,r,material){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),q=new T.Quaternion().setFromUnitVectors(UP,d.clone().normalize());emit(cylinder,material,av.add(bv).multiplyScalar(.5).toArray(),[r,d.length(),r],q);}
 const rocks=[];
 for(let k=0;k<6;k++){
  let g=own(new T.IcosahedronGeometry(1,2));const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),f=.84+.13*Math.sin(x*5.4+k)*Math.sin(z*7.1-y*3.7)+.07*Math.cos(y*8.3+x*2.1+k);p.setXYZ(i,x*f,y*f,z*f);}g.computeVertexNormals();const mp=[],index=g.index,n=g.attributes.normal;
  for(let i=0;i<(index?.count??p.count);i+=3){const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j),cx=ids.reduce((s,j)=>s+p.getX(j),0)/3,cz=ids.reduce((s,j)=>s+p.getZ(j),0)/3,cy=ids.reduce((s,j)=>s+p.getY(j),0)/3;if(cy<.15||ids.reduce((s,j)=>s+n.getY(j),0)/3<.18||Math.sin(cx*9.3+cz*5.7+k)<-.25)continue;for(const id of ids)mp.push(p.getX(id)*1.008,p.getY(id)*1.008+.005,p.getZ(id)*1.008);}
  const m=own(new T.BufferGeometry());m.setAttribute('position',new T.Float32BufferAttribute(mp,3));m.computeVertexNormals();rocks.push({rock:g,moss:m});
 }
 function rock(x,y,z,sx,sy,sz){const shape=rocks[Math.floor(rr(0,rocks.length))],rot=[rr(-.1,.1),rr(0,TAU),rr(-.1,.1)];emit(shape.rock,materials.rock,[x,y,z],[sx,sy,sz],rot,rr(.8,1.14));emit(shape.moss,materials.moss,[x,y,z],[sx,sy,sz],rot,rr(.78,1.23));}
 function shrub(x,y,z,spread,height,bloom=false,forest=false){const branches=forest?10:8,leaves=forest?55:46;for(let b=0;b<branches;b++){const a=b*2.39996+rr(-.4,.4),reach=spread*rr(.4,.95),h=height*rr(.48,1),base=[x,y,z],end=[x+Math.cos(a)*reach,y+h,z+Math.sin(a)*reach],fork=[x+Math.cos(a)*reach*.4,y+h*.72,z+Math.sin(a)*reach*.4];beam(base,fork,forest?.07:.013,materials.bark);beam(fork,end,forest?.037:.006,materials.bark);for(let j=0;j<leaves;j++){const u=rr(0,TAU),r=rr(.06,.48)*spread,p=[end[0]+Math.cos(u)*r,end[1]+rr(-.22,.22)*height,end[2]+Math.sin(u)*r],s=forest?rr(.26,.48):rr(.07,.15);emit(leaf,materials.leaf,p,[s*rr(.75,1.25),s,s],[rr(-1.2,.7),rr(0,TAU),rr(-.65,.65)],rr(.64,1.25));if(bloom&&j%11===0){const size=rr(.035,.055);for(let q=0;q<5;q++)emit(leaf,materials.petal,p,[size*1.1,size*.4,size],[.3,q*TAU/5,rr(-.2,.2)],rr(.9,1.1));}}}}
 function fern(x,y,z,size){for(let q=0;q<8;q++){const a=q*2.39996,tip=[x+Math.cos(a)*size,y+.25*size,z+Math.sin(a)*size];for(let j=1;j<=12;j++){const t=j/13,h=.42*size*Math.sin(t*Math.PI*.85),p=[x+(tip[0]-x)*t,y+h,z+(tip[2]-z)*t],s=size*(.15-.10*t);for(const side of[-1,1])emit(leaf,materials.fern,p,[s*.6,s,s],[rr(-.3,.1),a+side*.95,side*.1],rr(.8,1.2));}}}
 const surfaceTriangles=[],path=[];
 for(let row=0;row<19;row++){const z=20.65-row*.69,x=-16.0+(20.65-z)*.064+.16*Math.sin(row*.35);path.push([x,z]);const width=1.62+rr(-.13,.13),depth=.65+rr(-.015,.02),seam=.018,half=width/2;emit(box,materials.foundation,[x,-.43,z],[width+.16,1.064,.76],null,rr(.8,1.03));for(let side=0;side<2;side++){const w=half-seam,xx=x+(side?1:-1)*(half/2+.004);emit(box,materials.slab,[xx,.062,z],[w,.092,depth],null,rr(.74,1.07));const x0=xx-w/2,x1=xx+w/2,z0=z-depth/2,z1=z+depth/2,y=.108;surfaceTriangles.push([x0,y,z0],[x0,y,z1],[x1,y,z0],[x1,y,z0],[x0,y,z1],[x1,y,z1]);}}
 for(let row=0;row<15;row++)for(const side of[-1,1]){const z=20.0-row*.86,x=-16.0+(20.65-z)*.064+.16*Math.sin(row*.35)+side*rr(1.05,1.42),s=rr(.42,.77);rock(x,-.01+s*.40,z,s,s*.74,s*.82);for(let j=0;j<4;j++)rock(x+rr(-.72,.72),rr(-.04,.04),z+rr(-.65,.65),rr(.12,.36),rr(.14,.36),rr(.15,.34));shrub(x+side*.19,.1+s*.36,z,rr(.42,.7),rr(.38,.83),row%5===0);fern(x-side*.25,.07,z+rr(-.3,.3),rr(.33,.6));}
 for(const [x,z,s]of[[-11,16,1],[-9.2,12.5,1.2],[-7.5,9,1.2],[-11.5,8,1],[-19.5,17,1],[-21,11,1.2],[-16.5,2.6,1.1]]){for(let j=0;j<8;j++){const a=j*2.39996,r=rr(.05,1.1)*s;rock(x+Math.cos(a)*r,rr(0,.18),z+Math.sin(a)*r,rr(.24,.73)*s,rr(.28,.65)*s,rr(.3,.7)*s);}shrub(x,.34,z,.95*s,.85*s,true);for(let j=0;j<4;j++)fern(x+rr(-1,1)*s,.1,z+rr(-1,1)*s,rr(.4,.7));}
 for(let i=0;i<24;i++){const x=-39+i*2.7+rr(-1.1,1.1),z=-40-rr(0,19),h=rr(12,23);beam([x,.2,z],[x+rr(-.7,.7),h*.82,z+rr(-.7,.7)],rr(.16,.30),materials.bark);for(let crown=0;crown<5;crown++)shrub(x+rr(-1.5,1.5),h*(.50+crown*.085),z+rr(-1.2,1.2),rr(1.1,2.4),rr(1.4,3),false,true);}
 const near=[-15.329,.108,22.914],far=[-14.799,.108,24.10],railHeight=.47;
 const postG=own(new T.CylinderGeometry(.098,.106,.57,32)),collarG=own(new T.CylinderGeometry(.119,.119,.07,32));
 const profile=[[0,0],[.108,0],[.114,.026],[.092,.045],[.095,.071],[.137,.107],[.143,.151],[.122,.19],[.078,.229],[.036,.252],[.015,.274],[0,.288]].map(([r,y])=>new T.Vector2(r,y));const cap=own(new T.LatheGeometry(profile,40));
 for(const point of[near,far]){emit(postG,materials.red,[point[0],point[1]+.285,point[2]],[1,1,1]);emit(collarG,materials.black,[point[0],point[1]+.56,point[2]],[1,1,1]);emit(cap,materials.gold,[point[0],point[1]+.59,point[2]],[.95,.72,.95]);}
 for(const y of[.22,railHeight]){const a=new T.Vector3(near[0],near[1]+y,near[2]),b=new T.Vector3(far[0],far[1]+y,far[2]),delta=b.clone().sub(a);emit(box,materials.red,a.add(b).multiplyScalar(.5).toArray(),[.115,.10,delta.length()],[0,Math.atan2(delta.x,delta.z),0]);}
 for(let i=0;i<23;i++)emit(box,materials.black,[-17.10+i*.102,.110,22.85+i*.045],[.036,.015,.22],[0,-.39,0]);
 let instances=0,triangles=0;for(const bucket of buckets.values()){const mesh=new T.InstancedMesh(bucket.geometry,bucket.material,bucket.items.length);mesh.name=bucket.material.name;mesh.castShadow=true;mesh.receiveShadow=true;bucket.items.forEach((item,i)=>{mesh.setMatrixAt(i,item.matrix);colour.setRGB(item.shade,item.shade,item.shade);mesh.setColorAt(i,colour);});mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);instances+=mesh.count;triangles+=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3*mesh.count;}
 const report={version:'reference10-garden-detail-r1',newGeometry:true,instances,triangles,pathRows:path.length,path:'Explicit raised masonry route from the original threshold toward the photographed lantern',nearRailAnchors:[near,far],assumption:'Reference-led local layout candidate; not exact surveyed dimensions or final fidelity'};
 return{group,surfaceTriangles,report,dispose(){group.removeFromParent();for(const resource of owned)resource.dispose();}};
}
