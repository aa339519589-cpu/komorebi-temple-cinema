import * as T from 'three';
import {createGardenFern} from './garden-ferns.js';

export const WATEREDGE221_REVISION='scene09-aged-brass-and-diffused-wet-film221-r09';
const hash=(x,y=0)=>{const n=Math.sin(x*127.1+y*311.7+226)*43758.5453;return n-Math.floor(n);};

// Low closed mineral shelves, seated stones and actual narrow folded blades
// occupy selected banks. The open middle channel is deliberately retained.
export function buildWateredge221({emit,materials:M},scans,ownedMaterials,ownedTextures){
 const soil=new T.MeshStandardMaterial({name:'scene09-221-damp-shallow-bank-mineral',color:0x3d4030,map:M.cutStoneDark.map,normalMap:M.cutStoneDark.normalMap,normalScale:new T.Vector2(.24,.24),roughness:.96}),reed=new T.MeshStandardMaterial({name:'scene09-221-rooted-rush-blades',color:0x53643a,roughness:.91}),fern=new T.MeshStandardMaterial({name:'scene09-221-low-bank-ferns',color:0x485c32,roughness:.92,vertexColors:true});ownedMaterials.push(soil,reed,fern);
 const stoneMaterials=scans.variants.map((v,i)=>{const s=v.material,m=new T.MeshPhysicalMaterial({name:'scene09-221-partly-wet-bank-stone-'+i,color:new T.Color().setRGB(.57,.61,.56),map:s.map,normalMap:s.normalMap,normalScale:new T.Vector2(.30,.30),roughnessMap:s.roughnessMap,roughness:1,metalness:0,clearcoat:.27,clearcoatRoughness:.24});ownedMaterials.push(m);return m;});
 const blades=[];for(let k=0;k<6;k++){const s=new T.Shape(),curve=t=>[.07*t*t*Math.sin(k*1.7)+.025*Math.sin(t*3),t],half=t=>(.006+.003*hash(k,7))*Math.sin(Math.PI*t)**.8;for(let j=0;j<=20;j++){const t=j/20,[x,y]=curve(t);j?s.lineTo(x-half(t),y):s.moveTo(x,y);}for(let j=20;j>=0;j--){const t=j/20,[x,y]=curve(t);s.lineTo(x+half(t),y);}s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.0013,bevelEnabled:false,steps:1,curveSegments:12}),p=g.attributes.position;for(let j=0;j<p.count;j++){const y=p.getY(j);p.setZ(j,p.getZ(j)+.035*Math.sin(y*Math.PI)*Math.sin(k*1.17)+.09*y*y);}g.computeVertexNormals();blades.push(g);}
 const fernForms=[createGardenFern(2261),createGardenFern(2267),createGardenFern(2273)],patches=[];
 for(const[index,p]of[[-6.1,8.5,1.2,1.65],[-4.3,14.8,.8,1.5],[-3.7,19.6,.65,1.25],[8.6,9.4,1.35,1.6],[10.4,16.4,1.35,2.05]].entries()){
  const[cx,cz,rx,rz]=p,bed=(x,z)=>{const r=Math.hypot((x-cx)/rx,(z-cz)/rz);return-.045+.16*Math.max(0,1-r*r)**1.6+.017*Math.sin(x*4.1+z*2.9)*Math.max(0,1-r);},N=40,R=10,pos=[],uv=[],ix=[];
  for(let j=0;j<=R;j++)for(let k=0;k<N;k++){const a=k*Math.PI*2/N,t=(.001+.999*j/R)*(1+.09*Math.sin(a*3+index)+.05*Math.cos(a*7)),x=cx+Math.cos(a)*rx*t,z=cz+Math.sin(a)*rz*t;pos.push(x,bed(x,z),z);uv.push(x*2,z*2);if(j<R){const a=j*N+k,b=j*N+(k+1)%N;ix.push(a,b+N,a+N,a,b,b+N);}}
  const rim=R*N,foot=pos.length/3;for(let k=0;k<N;k++){pos.push(pos[(rim+k)*3],-.18,pos[(rim+k)*3+2]);uv.push(0,0);const q=(k+1)%N;ix.push(rim+k,foot+k,rim+q,rim+q,foot+k,foot+q);}const centre=pos.length/3;pos.push(cx,-.18,cz);uv.push(0,0);for(let k=0;k<N;k++)ix.push(centre,foot+(k+1)%N,foot+k);
  const g=new T.BufferGeometry();g.name='scene09-221-closed-shallow-bank-shelf';g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();emit(g,soil);
  const stones=[];for(let j=0;j<24;j++){const a=hash(j,index+1)*Math.PI*2,r=.52+.53*hash(j,index+3),x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r,v=scans.variants[(j+index)%scans.variants.length],sx=.13+.25*hash(j,index+9),sy=.09+.18*hash(j,index+11),sz=.13+.20*hash(j,index+13);v.geometry.computeBoundingBox();const y=bed(x,z)-v.geometry.boundingBox.min.y*sy-.045;emit(v.geometry,stoneMaterials[(j+index)%stoneMaterials.length],x,y,z,sx,sy,sz,[.12*(hash(j,19)-.5),a,.08*(hash(j,23)-.5)],.78+.20*hash(j,29));stones.push([x,z]);}
  let roots=0;for(let j=0;j<44;j++){const a=hash(j,index+31)*Math.PI*2,r=Math.sqrt(hash(j,index+37))*.90,x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r;if(stones.some(q=>Math.hypot(q[0]-x,q[1]-z)<.20))continue;const y=bed(x,z)-.005,height=.20+.35*hash(j,index+41),n=5+Math.floor(hash(j,index+43)*5);for(let k=0;k<n;k++){const angle=a+k*2.399;emit(blades[(j+k)%6],reed,x+Math.cos(angle)*.025,y,z+Math.sin(angle)*.025,.85+.30*hash(j,k),height*(.7+.35*hash(k,j)),1,[.08*Math.sin(angle),angle,.08*Math.cos(angle)],.75+.24*hash(k,index));}if(j%5===0){const s=.22+.18*hash(j,67);emit(fernForms[j%3],fern,x,y,z,s,s,s,a,.85);}roots++;}
  patches.push({centre:[cx,cz],radii:[rx,rz],closedBed:true,stones:24,rootedRushClumps:roots});
 }
 return{revision:WATEREDGE221_REVISION,patches,openMiddleChannel:true,source:'Authored mineral shelves/folded blades and existing declared CC0 scan stones; no scene image sampled',newExternalAssets:false,visualAccepted:false};
}

// A thin water coat has a smoother normal than the riven mineral beneath it.
// Patchy coat and mineral roughness are independent PBR scalar maps.
export function calibrateWetPavers221(materials,ownedTextures){
 const n=256,base=new Uint8Array(n*n*4),coat=new Uint8Array(n*n*4),coatRough=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4,h=hash(x,y),p=.5+.25*Math.sin(x*.049+y*.021)+.20*Math.sin(y*.027-x*.013),wet=T.MathUtils.smoothstep(p,.24,.72),a=Math.round(255*(.63+.26*h)),b=Math.round(255*(.24+.70*wet)),c=Math.round(255*(.075+.18*(1-wet)+.055*h));base.set([a,a,a,255],i);coat.set([b,b,b,255],i);coatRough.set([c,c,c,255],i);}
 const tex=d=>{const t=new T.DataTexture(d,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=8;t.needsUpdate=true;ownedTextures.push(t);return t;},rough=tex(base),wet=tex(coat),filmRough=tex(coatRough),changed=[];
 for(const m of materials)if(m.name.startsWith('scene09-cc0-wet-granite-veranda-paver-')){m.roughness=1;m.roughnessMap=rough;m.clearcoat=1;m.clearcoatMap=wet;m.clearcoatRoughness=.32;m.clearcoatRoughnessMap=null;m.clearcoatNormalMap=null;m.specularIntensity=.68;m.needsUpdate=true;changed.push(m.name);}
 return{maps:{wet,filmRough},info:{revision:WATEREDGE221_REVISION,changed,mineralRoughness:[.63,.89],waterCoatRoughness:.32,nativePlanarFilterRoughness:[.075,.31],coatNormal:'Actual slab geometry; finer smoother film normal in the native planar layer',albedoHeld:true,actualReflectedSceneHeld:true,visualAccepted:false}};
}

// A complete low case stands on the actual right veranda tread. Its four
// legs and braces place the real paper source inside the visible grazing
// stone-reflection footprint.
export function buildLowVerandaCase221(api,ownedMaterials){
 const{group,emit,box,between,light,materials:M}=api,paper=M.paper.clone();paper.name='scene09-221-low-veranda-washi-paper';paper.emissiveIntensity=3.8;paper.userData={...paper.userData,paperEmitter221:true,physicalEmitter203:true};ownedMaterials.push(paper);
 const cap=new T.CylinderGeometry(.09,.29,.15,4,1,false);
 group(11.2,0,16.2,-.61,()=>{
  box(2.30,1.56,8.50,.52,.07,.52,M.lanternMetal);box(2.30,2.47,8.50,.49,.045,.47,M.lanternMetal);
  for(const x of[2.13,2.47])for(const z of[8.33,8.67])box(x,2.02,z,.038,.88,.038,M.lanternMetal);
  for(const y of[1.85,2.27]){box(2.30,y,8.33,.36,.020,.021,M.lanternMetal);box(2.30,y,8.67,.36,.020,.021,M.lanternMetal);box(2.13,y,8.50,.021,.020,.36,M.lanternMetal);box(2.47,y,8.50,.021,.020,.36,M.lanternMetal);}
  group(2.30,2.745,8.50,0,()=>{
   for(let f=0;f<4;f++)group(0,0,0,f*Math.PI/2,()=>{box(0,0,.185,.36,.49,.009,paper);for(const x of[-.192,.192])box(x,0,.201,.026,.55,.029,M.lanternMetal);for(const y of[-.263,.263])box(0,y,.202,.42,.030,.036,M.lanternEdge);for(const x of[-.09,.09])box(x,0,.203,.012,.47,.017,M.lanternMetal);for(const y of[-.13,.12])box(0,y,.203,.36,.013,.018,M.lanternMetal);});
   box(0,-.294,0,.45,.06,.45,M.lanternMetal);box(0,.295,0,.45,.055,.45,M.lanternMetal);emit(cap,M.lanternMetal,0,.398,0,1,1,1,Math.PI/4);box(0,.49,0,.12,.055,.12,M.lanternEdge);light(0,0,0,8,8,{kind:'veranda-low221'});
  },.78);
 });
 return{revision:WATEREDGE221_REVISION,worldChamber:[8.218,2.745,24.484],assemblyScale:.78,mount:'Four-legged closed bronze stand with transverse braces, seated on the actual right veranda tread at y1.525',candela:8,sourcePaperExitance:3.8,inferredPlacement:true,visualAccepted:false};
}

export function createForegroundBrass221(ownedMaterials,ownedTextures){
 const n=128,rough=new Uint8Array(n*n*4),bump=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4,a=Math.round(196+33*hash(x,y)),b=Math.round(128+8*Math.sin(y*1.9)+3*(hash(x+37,y)-.5));rough.set([a,a,a,255],i);bump.set([b,b,b,255],i);}
 const tex=d=>{const t=new T.DataTexture(d,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.needsUpdate=true;ownedTextures.push(t);return t;};
 const material=new T.MeshPhysicalMaterial({name:'scene09-221-turned-local-reflection-brass',color:new T.Color().setRGB(.92,.53,.075),metalness:.84,roughness:.29,roughnessMap:tex(rough),bumpMap:tex(bump),bumpScale:.00008});material.userData.nightVolume203='veranda';material.userData.finish221='Authored aged-brass/oxide mixture, not claimed measured pure-gold reflectance';ownedMaterials.push(material);return material;
}

export function buildVisibleLotus221({emit,between,materials:M},leaves,petals,lotus,petal){
 const records=[];for(let j=0;j<54;j++){const a=j*2.39996,r=Math.sqrt((j+.5)/54),x=-1.85+Math.cos(a)*1.55*r+.12*Math.sin(j*2.17),z=16.8+Math.sin(a)*2.4*r,s=.45+.22*hash(j,71);emit(leaves[j%leaves.length],lotus,x,.026+.015*hash(j,73),z,s,s,s,[.018*Math.sin(a),a,.018*Math.cos(a)],.80+.18*hash(j,79));}
 for(const[i,p]of[[-2.6,15.4],[-1.9,16.8],[-.8,17.9],[-2.8,18.6]].entries()){const[x,z]=p,y=.27+.12*hash(i,83);between([x,-.18,z],[x,y,z],.015,.015,M.leaf,true);for(let k=0;k<22;k++){const inner=k>=14,a=(k-(inner?14:0))*Math.PI*2/(inner?8:14)+i*.37,s=inner?.20:.28;emit(petals[k%petals.length],petal,x,y,z,s,s,s,[inner?.03:-.23,a,0],.88+.12*hash(k,i));}records.push({anchor:[x,y,z],petals:22});}
 return{revision:WATEREDGE221_REVISION,leafCount:54,flowers:records,scope:'Actual cupped 3D leaf and petal laminae with rooted stems in the visible left shallow-water margin; inferred rhizome below the water plane',newLights:false,visualAccepted:false};
}

export const pondFragment221=`uniform sampler2D tDiffuse;uniform vec3 color;uniform float time;varying vec4 vUv;varying vec3 vWorld;
float h221(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n221(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);return mix(mix(h221(i),h221(i+vec2(1,0)),f.x),mix(h221(i+vec2(0,1)),h221(i+vec2(1,1)),f.x),f.y);}
float height221(vec2 p){vec2 q=mat2(.83,-.56,.56,.83)*p;float a=.0011*(n221(p*vec2(.8,2.1)+vec2(time*.08,0.))-.5)+.00045*(n221(q*9.3-vec2(0.,time*.19))-.5)+.00011*(n221(p*31.7+vec2(time*.28,3.))-.5);float r=length(p-vec2(-6.1,8.5));a+=.00038*sin(r*28.-time*1.7)*exp(-r*.28);return a;}
void main(){vec2 uv=vUv.xy/vUv.w,p=vWorld.xz;float e=.003;vec2 g=vec2(height221(p+vec2(e,0))-height221(p-vec2(e,0)),height221(p+vec2(0,e))-height221(p-vec2(0,e)))/(2.*e);vec3 normal=normalize(vec3(-g.x,1.,-g.y)),view=normalize(cameraPosition-vWorld),ray=reflect(-view,normal),planarRay=reflect(-view,vec3(0,1,0));
// Project the normal-induced ray change through the actual local capture
// Jacobian. The1.2m reflection stratum is a finite native approximation.
vec2 delta=(ray.xz/max(.15,ray.y)-planarRay.xz/max(.15,planarRay.y))*1.2,px=dFdx(vWorld.xz),py=dFdy(vWorld.xz),ux=dFdx(uv),uy=dFdy(uv);float det=px.x*py.y-px.y*py.x;if(abs(det)>.0000001){vec2 s=vec2(py.y*delta.x-py.x*delta.y,-px.y*delta.x+px.x*delta.y)/det;uv+=ux*s.x+uy*s.y;}
vec3 r=texture2D(tDiffuse,uv).rgb*.44;r+=texture2D(tDiffuse,uv+ux*.85+uy*.23).rgb*.14;r+=texture2D(tDiffuse,uv-ux*.85-uy*.23).rgb*.14;r+=texture2D(tDiffuse,uv+uy*.92-ux*.17).rgb*.14;r+=texture2D(tDiffuse,uv-uy*.92+ux*.17).rgb*.14;float f=.02037+.97963*pow(1.-clamp(abs(dot(view,normal)),0.,1.),5.);gl_FragColor=vec4(color*(1.-f)*.22+r*f,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

export const wetVerandaFragment221=`uniform sampler2D tDiffuse;uniform sampler2D roughMap;uniform sampler2D normalMap203;uniform sampler2D coatMask221;uniform vec3 color;varying vec4 rUv;varying vec2 pUv;varying vec3 wPos;
vec2 filmRayOffset221(vec3 view,vec3 normal,vec3 changed,vec2 wx,vec2 wy,vec2 ux,vec2 uy,float det){vec3 a=reflect(-view,normal),b=reflect(-view,changed);vec2 d=(b.xz/max(.10,b.y)-a.xz/max(.10,a.y))*1.3;if(abs(det)<.0000001)return vec2(0.);vec2 q=vec2(wy.y*d.x-wy.x*d.y,-wx.y*d.x+wx.x*d.y)/det;return ux*q.x+uy*q.y;}
void main(){vec2 u=rUv.xy/rUv.w;float rough=texture2D(roughMap,pUv*.80).g,wet=texture2D(coatMask221,pUv*.80).r;vec2 relief=texture2D(normalMap203,pUv*2.52).xy*2.-1.;vec3 normal=normalize(vec3(-relief.x*.025,1.,-relief.y*.025)),view=normalize(cameraPosition-wPos);vec2 offset=relief*.0007,wx=dFdx(wPos.xz),wy=dFdy(wPos.xz),ux=dFdx(u),uy=dFdy(u);float det=wx.x*wy.y-wx.y*wy.x,sigma=.008+.022*rough;vec2 a=filmRayOffset221(view,normal,normalize(normal+vec3(sigma,0,0)),wx,wy,ux,uy,det),b=filmRayOffset221(view,normal,normalize(normal+vec3(0,0,sigma)),wx,wy,ux,uy,det);vec3 r=texture2D(tDiffuse,u+offset).rgb*.28;r+=texture2D(tDiffuse,u+offset+a).rgb*.18;r+=texture2D(tDiffuse,u+offset-a).rgb*.18;r+=texture2D(tDiffuse,u+offset+b).rgb*.18;r+=texture2D(tDiffuse,u+offset-b).rgb*.18;
float cosine=clamp(abs(dot(view,normal)),0.,1.),f=.02037+.97963*pow(1.-cosine,5.);gl_FragColor=vec4(r,clamp(f*wet,.008,.90));
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
