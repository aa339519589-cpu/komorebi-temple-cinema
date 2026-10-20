import * as T from 'three';
import {Reflector} from '../../../vendor/examples/jsm/objects/Reflector.js';
import {createWeatheredBoulderGeometry,createBoulderMossGeometry} from './rocks.js';
import {createGalleryCurvedJoinery,createContinuousTimber,createClayCoverTile} from './gallery-joinery.js';
import {createGatePlaque,createGateColumnShoe} from './gate-hardware.js';
export async function buildScene(){
const scene=new T.Scene();scene.background=new T.Color('#a4c3df');scene.fog=new T.Fog('#b2c5c1',47,105);
let seed=80247;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),rr=(a,b)=>a+(b-a)*random();
const mats={},geometries=new Set(),materials=[],textures=[],buckets=new Map(),stack=[new T.Matrix4()],roles={};let role='architecture';
function material(name,color,roughness=.75,metalness=0){const m=new T.MeshStandardMaterial({name,color,roughness,metalness});materials.push(m);return mats[name]=m;}
material('red','#893524',.43);material('redlight','#9d4026',.46);material('wood','#61301f');material('dark','#302b26');material('gold','#d7a54c',.32,.68);material('oldgold','#a27b3b',.47,.5);material('tile','#243b52',.39,.08);material('tileedge','#50667e',.43,.05);material('wall','#e0d4b7');material('stone','#96958a',.95);material('rock','#72796a',.97);material('moss','#536333',1);material('hallFoundation','#5d574b',.96);mats.rock.color.set('#777a72');mats.rock.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vMineral;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMineral=position;');shader.fragmentShader='varying vec3 vMineral;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float mineral=sin(vMineral.x*19.+sin(vMineral.z*13.)*2.)*sin(vMineral.y*23.+vMineral.z*11.);float vein=pow(max(0.,sin(vMineral.y*14.+vMineral.x*3.+sin(vMineral.z*8.)*.7)),12.);diffuseColor.rgb*=.79+.22*mineral-.20*vein;`);};material('bark','#554735',.98);material('leaf','#385b2e',.73);material('leaflight','#708b43',.70);material('maple','#a2473a',.90);material('flower','#e28c91',.84);material('paper','#e9c985',.8);material('lanternamber','#d6a04e',.82);mats.lanternamber.emissive=new T.Color('#d58b2b');mats.lanternamber.emissiveIntensity=.35;mats.paper.emissive=new T.Color('#f7aa34');mats.paper.emissiveIntensity=.28;
material('joinerygilt','#8d682d',.55,.73);material('hardwarebrass','#bb8b38',.43,.86);material('hardwareRecess','#6e5027',.54,.82);material('gallerytile','#405363',.72,.025);
// Procedural mineral/bark detail; the namespaced CC0 timber scan is installed below.
function texture(kind){const n=128,d=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const p=(y*n+x)*4,h=(()=>{const q=Math.sin((x+17.3)*(y+41.7)*12.9898)*43758.5453;return q-Math.floor(q);})(),warp=x+3.4*Math.sin(y*.055)+1.1*Math.sin(y*.17+x*.025),grain=Math.sin(warp*.46)+.42*Math.sin(warp*1.91+y*.08)+.18*Math.sin(warp*5.7+y*.22),broad=Math.sin(x*.07+Math.sin(y*.031)*2.0),q=kind==='wood'?.84+.052*grain+.024*broad+.018*(h-.5):kind==='plaster'?.91+.06*(h-.5)+.014*Math.sin(x*.22+y*.12):.73+.22*(h-.5)+.035*Math.sin(x*.4+Math.sin(y*.13)*2.);const r=T.MathUtils.clamp(q,0,1),g=T.MathUtils.clamp(q*(kind==='wood'?.96:1),0,1),b=T.MathUtils.clamp(q*(kind==='wood'?.89:1),0,1);d[p]=255*r;d[p+1]=255*g;d[p+2]=255*b;d[p+3]=255;random();}const t=new T.DataTexture(d,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;textures.push(t);return t;}
const envW=256,envH=128,envData=new Uint8Array(envW*envH*4),fract=x=>x-Math.floor(x),hash2=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453),noise2=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=hash2(ix,iy),b=hash2(ix+1,iy),c=hash2(ix,iy+1),d=hash2(ix+1,iy+1);return(a+(b-a)*sx)+((c+(d-c)*sx)-(a+(b-a)*sx))*sy;},envSmooth=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};for(let ey=0;ey<envH;ey++)for(let ex=0;ex<envW;ex++){const u=ex/(envW-1),v=ey/(envH-1),q=(ey*envW+ex)*4,upper=v<.5,t=upper?v*2:(v-.5)*2,top=[.28,.43,.72],horizon=[.96,.60,.35],ground=[.13,.12,.095],base=upper?top.map((c,k)=>c+(horizon[k]-c)*t):horizon.map((c,k)=>c+(ground[k]-c)*t);let n=0,a=.53,x=u*9,y=v*7;for(let octave=0;octave<5;octave++){n+=a*noise2(x,y);x=x*2.02+13.1;y=y*2.02+7.7;a*=.48;}const du=Math.min(Math.abs(u-.81),1-Math.abs(u-.81)),sunHalo=Math.exp(-Math.pow(du/.095,2)-Math.pow((v-.445)/.075,2)),sunDisk=Math.exp(-Math.pow(du/.010,2)-Math.pow((v-.445)/.014,2)),cloud=envSmooth(.49,.66,n)*envSmooth(.06,.44,v)*(1-envSmooth(.77,.98,v)),west= Math.exp(-Math.pow(du/.23,2))*Math.exp(-Math.pow((v-.48)/.20,2)),cloudTint=[1.0,.77,.58],out=[];for(let k=0;k<3;k++){let c=base[k];c+=(cloudTint[k]-c)*cloud*.62;c+=(k===0?1:k===1?.62:.28)*sunHalo*.42;c+=(k===0?1:k===1?.88:.64)*sunDisk;c+=(k===0?1:k===1?.55:.33)*west*.18;out.push(Math.round(T.MathUtils.clamp(c,0,1)*255));}envData[q]=out[0];envData[q+1]=out[1];envData[q+2]=out[2];envData[q+3]=255;}const env=new T.DataTexture(envData,envW,envH);env.mapping=T.EquirectangularReflectionMapping;env.colorSpace=T.SRGBColorSpace;env.needsUpdate=true;textures.push(env);scene.environment=env;scene.environmentIntensity=.62;
const wood=texture('wood'),stone=texture('stone');mats.wall.map=texture('plaster');mats.moss.map=stone;mats.bark.map=wood;mats.bark.bumpMap=stone;mats.bark.bumpScale=.055;for(const n of ['red','redlight','wood','dark']){mats[n].map=wood;mats[n].bumpMap=wood;mats[n].bumpScale=.012;}for(const n of ['rock','tile']){mats[n].map=stone;mats[n].bumpMap=stone;mats[n].bumpScale=.025;}mats.stone.map=null;mats.stone.bumpMap=null;mats.stone.color.set('#85857a');mats.stone.roughness=.94;
const boxG=new T.BoxGeometry(1,1,1),cylG=new T.CylinderGeometry(1,1,1,12),ballG=new T.SphereGeometry(1,8,6),torusG=new T.TorusGeometry(1,.12,5,16),leafG=new T.BufferGeometry();{const pos=[];for(let i=0;i<6;i++){const a=i/6,b=(i+1)/6,wa=Math.sin(a*Math.PI)*.34,wb=Math.sin(b*Math.PI)*.34,ya=Math.sin(a*Math.PI)*.11,yb=Math.sin(b*Math.PI)*.11;for(const side of[-1,1])for(const p of[[0,ya,a],[side*wa,ya*.2,a],[side*wb,yb*.2,b],[0,ya,a],[side*wb,yb*.2,b],[0,yb,b]])pos.push(...p);}leafG.setAttribute('position',new T.Float32BufferAttribute(pos,3));leafG.computeVertexNormals();}mats.leaf.side=mats.leaflight.side=mats.maple.side=mats.flower.side=T.DoubleSide;
const galleryJoinery=createGalleryCurvedJoinery(),clayCoverG=createClayCoverTile();for(const g of galleryJoinery.resources)geometries.add(g);mats.gallerytile.map=stone;mats.gallerytile.bumpMap=stone;mats.gallerytile.bumpScale=.005;
material('pine','#2e512b',.82);const needleG=new T.BufferGeometry(),needleP=[];for(let k=0;k<9;k++){const a=k*2.39996,dx=Math.cos(a),dz=Math.sin(a),p=[[0,0,0],[dx*.027,.11,dz*.027],[dx*.09,.23,dz*.09]];for(let j=0;j<2;j++){const aa=p[j],bb=p[j+1],ww=.016*(1-j*.45);needleP.push(aa[0]-dz*ww,aa[1],aa[2]+dx*ww,aa[0]+dz*ww,aa[1],aa[2]-dx*ww,...bb);}}needleG.setAttribute('position',new T.Float32BufferAttribute(needleP,3));needleG.computeVertexNormals();mats.pine.side=T.DoubleSide;
const v=a=>new T.Vector3(...a);
function emit(g,ma,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=[0,0,0],tint=1){const m=typeof ma==='string'?mats[ma]:ma,key=g.uuid+m.uuid;let b=buckets.get(key);if(!b)buckets.set(key,b={g,m,items:[]});const matrix=new T.Matrix4().compose(v([x,y,z]),new T.Quaternion().setFromEuler(new T.Euler(...rot)),v([sx,sy,sz])).premultiply(stack.at(-1));b.items.push({matrix,tint});geometries.add(g);roles[role]=(roles[role]||0)+1;}
const bevels=new Map();function bevelBox(w,h,d){const key=[w,h,d].join(',');if(bevels.has(key))return bevels.get(key);const geo=new T.BoxGeometry(w,h,d,3,3,3),p=geo.attributes.position,n=geo.attributes.normal,r=Math.min(.028,Math.min(w,h,d)*.13),half=[w/2-r,h/2-r,d/2-r];for(let i=0;i<p.count;i++){const point=new T.Vector3(p.getX(i),p.getY(i),p.getZ(i)),core=point.clone();core.x=T.MathUtils.clamp(core.x,-half[0],half[0]);core.y=T.MathUtils.clamp(core.y,-half[1],half[1]);core.z=T.MathUtils.clamp(core.z,-half[2],half[2]);const normal=point.clone().sub(core).normalize();point.copy(core).addScaledVector(normal,r);p.setXYZ(i,point.x,point.y,point.z);n.setXYZ(i,normal.x,normal.y,normal.z);}bevels.set(key,geo);return geo;}const bevelRoles=new Set(['foreground-veranda','left-grand-hall','layered-walkways','main-hall-sanctum','five-tier-pagoda','arched-stream-bridge','gallery-stone-stair']);const box=(x,y,z,w,h,d,ma='red',yaw=0)=>bevelRoles.has(role)?emit(bevelBox(w,h,d),ma,x,y,z,1,1,1,[0,yaw,0]):emit(boxG,ma,x,y,z,w,h,d,[0,yaw,0]);
function group(x,y,z,yaw,fn,scale=1){stack.push(stack.at(-1).clone().multiply(new T.Matrix4().compose(v([x,y,z]),new T.Quaternion().setFromAxisAngle(v([0,1,0]),yaw),v([scale,scale,scale]))));fn();stack.pop();}
function between(a,b,r,ma='red',round=false,depth=r){const av=v(a),bv=v(b),delta=bv.clone().sub(av),m=new T.Matrix4().compose(av.add(bv).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(v([0,1,0]),delta.clone().normalize()),v([r,delta.length(),depth])).premultiply(stack.at(-1)),g=round?cylG:boxG,key=g.uuid+mats[ma].uuid;let bucket=buckets.get(key);if(!bucket)buckets.set(key,bucket={g,m:mats[ma],items:[]});bucket.items.push({matrix:m,tint:1});geometries.add(g);roles[role]=(roles[role]||0)+1;}
function line(points,r,ma='gold'){const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v)),Math.max(6,points.length*3),r,5,false);emit(g,ma);}
function rosette(x,y,z,r=.13){emit(torusG,'oldgold',x,y,z,r,r,r);for(let i=0;i<8;i++){const a=i*Math.PI/4;emit(ballG,'gold',x+Math.cos(a)*r*.65,y+Math.sin(a)*r*.65,z+.015,r*.25,r*.14,r*.12,[0,0,a]);}emit(ballG,'gold',x,y,z+.025,r*.29,r*.29,r*.14);}
function plaque(x,y,z,w,h){for(const p of createGatePlaque(w,h))emit(p.geometry,p.material,x,y,z);}
function column(x,z,y,h,r=.20){emit(cylG,'stone',x,y+.10,z,r*1.37,.20,r*1.37);emit(cylG,'red',x,y+h/2+.2,z,r,h,r);for(const yy of[y+.24,y+h-.03])emit(cylG,'oldgold',x,yy,z,r*1.04,.075,r*1.04);for(let k=0;k<3;k++)box(x,y+h-.08+k*.04,z+r*.99,r*1.4,.045,.035,'gold');if(role==='left-grand-hall'&&h>3.0)for(const f of[.28,.65,.88])rosette(x,y+h*f,z+r*1.02,r*.32);}
const corbelShape=new T.Shape();corbelShape.moveTo(-.5,.13);corbelShape.lineTo(-.5,.27);corbelShape.quadraticCurveTo(-.38,.28,-.32,.18);corbelShape.lineTo(-.19,.18);corbelShape.quadraticCurveTo(-.16,-.02,0,-.035);corbelShape.quadraticCurveTo(.16,-.02,.19,.18);corbelShape.lineTo(.32,.18);corbelShape.quadraticCurveTo(.38,.28,.5,.27);corbelShape.lineTo(.5,.13);corbelShape.quadraticCurveTo(.36,.05,.30,-.04);corbelShape.quadraticCurveTo(.15,-.13,0,-.14);corbelShape.quadraticCurveTo(-.15,-.13,-.30,-.04);corbelShape.quadraticCurveTo(-.36,.05,-.5,.13);const corbelG=new T.ExtrudeGeometry(corbelShape,{depth:1,steps:1,curveSegments:5,bevelEnabled:true,bevelThickness:.025,bevelSize:.018,bevelSegments:1});corbelG.translate(0,0,-.5);
function brackets(x,y,z,s=.8){if(role==='left-grand-hall'){for(const p of galleryJoinery.parts)emit(p.geometry,p.material,x,y,z,s,s,s);return;}for(let level=0;level<3;level++){const off=level*.15*s;for(const dir of[0,1]){const span=(.70+level*.17)*s;emit(corbelG,'red',x,y+off,z,span,.52*s,.15*s,[0,dir*Math.PI/2,0]);for(const sign of[-1,1]){const dx=dir?0:sign*(.22+level*.09)*s,dz=dir?sign*(.22+level*.09)*s:0;box(x+dx,y+off-.07*s,z+dz,.14*s,.17*s,.14*s,'wood');if(level===2)box(x+dx,y+off+.06*s,z+dz,.13*s,.045*s,.13*s,'oldgold');}}}box(x,y+.53*s,z,1.48*s,.12*s,.34*s,'wood');box(x,y+.59*s,z+.18*s,.08*s,.05*s,.035*s,'gold');}
function ceramicTile(a,b,r=.077,tint=1){
 const av=v(a),bv=v(b),tangent=bv.clone().sub(av).normalize(),across=new T.Vector3().crossVectors(v([0,1,0]),tangent).normalize(),up=new T.Vector3().crossVectors(tangent,across).normalize();
 const basis=new T.Matrix4().makeBasis(across,up,tangent),rotation=new T.Euler().setFromRotationMatrix(basis),center=av.clone().add(bv).multiplyScalar(.5);
 emit(clayCoverG,'gallerytile',center.x,center.y,center.z,r,r,av.distanceTo(bv),[rotation.x,rotation.y,rotation.z],tint);
}
// Four continuously meeting hip panels, individually curved ceramic rolls,
// deep curved timber rafters, edge discs and gilded fittings.
function roof(w,d,eave,rise,curl=.65,ridgeRatio=.22,hornHeight=.52){const hw=w/2,hd=d/2,rh=w*ridgeRatio;
function P(side,t,u){const span=rh+(hw-rh)*t;let x=side%2?(side===1?1:-1)*span:u*span,z=side%2?u*hd*t:(side===0?1:-1)*hd*t;return [x,eave+rise*Math.pow(Math.max(0,1-t),1.65)+curl*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),7)),z];}
for(let side=0;side<4;side++){const pp=[],uv=[],tri=(a,b,c)=>{for(const p of[a,b,c]){pp.push(...p);uv.push(p[0],p[2]);}};for(let j=0;j<18;j++)for(let i=0;i<36;i++){const a=P(side,j/18,-1+2*i/36),b=P(side,(j+1)/18,-1+2*i/36),c=P(side,j/18,-1+2*(i+1)/36),d=P(side,(j+1)/18,-1+2*(i+1)/36);if(side%2===0){tri(a,b,c);tri(b,d,c);}else{tri(a,c,b);tri(b,c,d);}}
const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();mats.tile.side=T.DoubleSide;emit(g,'tile');const underside=g.clone(),up=underside.attributes.position;for(let k=0;k<up.count;k++)up.setY(k,up.getY(k)-.14);underside.computeVertexNormals();mats.wood.side=T.DoubleSide;emit(underside,'wood');
const n=Math.ceil((side%2?d:w)/.24);for(let i=0;i<=n;i++){const u=-1+2*i/n,p=P(side,1,u);for(let j=0;j<14;j++){const a=P(side,j/14,u),b=P(side,Math.min(1,(j+(role==='left-grand-hall'?1.055:.96))/14),u);a[1]+=.020;b[1]+=.020;if(role==='left-grand-hall')ceramicTile(a,b,.077,.94+.055*Math.sin(i*1.33+j*2.71+side*.81));else{a[1]+=.025;b[1]+=.025;between(a,b,.085,'tileedge',true);}}const discRot=side%2?[0,0,Math.PI/2]:[Math.PI/2,0,0];emit(cylG,'tileedge',p[0],p[1],p[2],.105,.09,.105,discRot);emit(torusG,'tileedge',p[0]+(side===1?.044:side===3?-.044:0),p[1],p[2]+(side===0?.044:side===2?-.044:0),.095,.095,.095,[0,side%2?Math.PI/2:0,0]);if(i%2===0){if(role==='left-grand-hall'){const path=Array.from({length:15},(_,j)=>{const q=P(side,j/14,u);q[1]-=.26;return q;});emit(createContinuousTimber(path,.075,.12,.009),'red');const tail=Array.from({length:6},(_,j)=>{const q=P(side,.72+j*.29/5,u);q[1]-=.18;return q;});emit(createContinuousTimber(tail,.09,.12,.009),'wood');emit(bevelBox(.070,.095,.025),'joinerygilt',p[0],p[1]-.18,p[2]);}else{for(let rj=0;rj<9;rj++){const ra=P(side,rj/9,u),rb=P(side,(rj+1)/9,u);ra[1]-=.26;rb[1]-=.26;between(ra,rb,.075,'redlight',false,.12);}let q=P(side,.72,u);const qq=P(side,1.01,u);q[1]-=.18;qq[1]-=.18;between(q,qq,.09,'wood',false,.12);emit(boxG,'gold',p[0],p[1]-.18,p[2],.07,.095,.07);}}}
for(let i=0;i<36;i++){const a=P(side,1,-1+2*i/36),b=P(side,1,-1+2*(i+1)/36);for(const dy of[-.12,-.25]){a[1]+=dy;b[1]+=dy;between(a,b,dy===-.12?.115:.052,dy===-.12?'wood':'red');a[1]-=dy;b[1]-=dy;}}
for(const u of [-1,1]){const pts=Array.from({length:17},(_,i)=>P(side,i/16,u).map((q,k)=>q+(k===1?.10:0)));line(pts,.095,'tileedge');const tip=P(side,1,u);line([tip,[tip[0]*1.035,tip[1]+hornHeight*.58,tip[2]*1.035],[tip[0]*1.04,tip[1]+hornHeight,tip[2]*1.04]],.09,'tileedge');}}
box(0,eave+rise+.07,0,rh*2+.3,.19,.25,'tileedge');if(ridgeRatio>.1)for(const sx of[-1,1])line([[sx*rh,eave+rise,0],[sx*(rh+.13),eave+rise+.34,0],[sx*(rh+.18),eave+rise+.55,0]],.095,'tileedge');}
// A curved tiled gable is an actual bonnet in front of the hip roof. Its
// stepped timber infill, bargeboards and ceramic rolls share the curved crown.
function curvedGable(cx,z,eave,width=4.0,rise=1.5,depth=2.2){
 const profile=u=>eave+rise*Math.exp(-3.4*u*u)+.24*Math.pow(Math.abs(u),10);
 const P=(u,t)=>[cx+u*width/2,profile(u)-.33*rise*Math.exp(-3.4*u*u)*t+.58*t,z-depth*t];
 const pp=[],uv=[];for(let j=0;j<16;j++)for(let i=0;i<64;i++){
  const a=P(-1+2*i/64,j/16),b=P(-1+2*(i+1)/64,j/16),c=P(-1+2*i/64,(j+1)/16),d=P(-1+2*(i+1)/64,(j+1)/16);
  for(const v of[a,c,b,b,c,d]){pp.push(...v);uv.push(v[0],v[2]);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();emit(g,'tile');
 const panel=new T.Shape();panel.moveTo(cx-width/2,eave-.04);for(let i=0;i<=64;i++){const u=-1+2*i/64;panel.lineTo(cx+u*width/2,profile(u)-.16);}panel.lineTo(cx+width/2,eave-.04);panel.closePath();
 const pg=new T.ExtrudeGeometry(panel,{depth:.13,steps:1,bevelEnabled:true,bevelThickness:.025,bevelSize:.02,bevelSegments:2});emit(pg,'wood',0,0,z-.10);
 for(const drop of[.05,.20,.31])line(Array.from({length:65},(_,i)=>{const u=-1+2*i/64;return[cx+u*width/2,profile(u)-drop,z+.035];}),drop===.05?.075:drop===.20?.075:.023,drop===.31?'oldgold':drop===.05?'tileedge':'red');
 for(let i=0;i<=24;i++){
  const u=-1+2*i/24;for(let j=0;j<8;j++){const a=P(u,j/8),b=P(u,Math.min(1,(j+1.05)/8));a[1]+=.012;b[1]+=.012;ceramicTile(a,b,.055,.95+.045*Math.sin(i*2.11+j*1.31));}
  const yy=profile(u);emit(cylG,'tileedge',cx+u*width/2,yy+.025,z+.035,.073,.07,.073,[Math.PI/2,0,0]);
  emit(torusG,'tileedge',cx+u*width/2,yy+.025,z+.08,.064,.064,.064);
 }
 for(const sign of[-1,1]){
  const x=cx+sign*width*.47,y=profile(sign*.94)+.05;
  line([[x,y,z+.03],[x+sign*.17,y+.16,z+.03],[x+sign*.12,y+.33,z+.03],[x,y+.30,z+.03]],.055,'tileedge');
  for(let j=0;j<7;j++){
   const xx=cx+sign*(.29+j*.20),u=(xx-cx)/(width/2),top=profile(u)-.35;
   if(top>eave+.06)box(xx,(eave+top)/2,z+.05,.035,top-eave,.035,'redlight');
  }
 }
 rosette(cx,eave+.57,z+.12,.19);for(const sign of[-1,1])line([[cx+sign*.2,eave+.55,z+.13],[cx+sign*.46,eave+.43,z+.13],[cx+sign*.68,eave+.55,z+.13],[cx+sign*.92,eave+.28,z+.13]],.035,'oldgold');
}
function lattice(x,y,z,w,h){box(x,y,z,w,h,.09,'dark');for(let i=0;i<=Math.ceil(w/.14);i++)box(x-w/2+i*w/Math.ceil(w/.14),y,z+.065,.028,h,.03,'dark');for(let i=0;i<=Math.ceil(h/.19);i++)box(x,y-h/2+i*h/Math.ceil(h/.19),z+.08,w,.028,.03,'wood');for(const sx of[-1,1])box(x+sx*w/2,y,z+.10,.09,h+.12,.13,'red');}
function hall(w,d,h,{raised=.5,walls=true,lanterns=true,roofRise=Math.min(w,d)*.26,buildRoof=true,roofEaveDrop=0,roofCurl=.65,roofHorn=.52,frontHeight=h*.63,frontCenter=raised+h*.42,frontOpening=false}={}){if(role==='left-grand-hall'){box(0,raised-.12,0,w*.9,.24,d*.62,'hallFoundation');}else box(0,raised/2,0,w*.9,raised,d*.86,'stone');box(0,raised+.06,0,w*.88,.12,role==='left-grand-hall'?d*.62:d*.89,role==='left-grand-hall'?'dark':'stone');const front=d*.37;
for(const z of[-front,front]){if(role==='left-grand-hall'&&raised>2)for(let x=-w*.36;x<=w*.37;x+=w*.18)column(x,z,0,raised-.25,.13);for(let x=-w*.36;x<=w*.37;x+=w*.18){if(frontOpening&&z>0&&Math.abs(x)<w*.28)continue;column(x,z,raised,h-.85,.18);brackets(x,h+raised-.7,z,.78);}box(0,h+raised-.12,z,w*.88,.29,.33,'red');box(0,h+raised-.52,z,w*.86,.20,.26,'red');for(let i=0;i<Math.ceil(w/.27);i++)box(-w*.44+i*.27,h+raised-.42,z+.19,.09,.1,.05,'gold');}
for(const x of[-w*.36,w*.36])for(const z of[-d*.18,0,d*.18]){if(role==='left-grand-hall'&&raised>2)column(x,z,0,raised-.25,.13);column(x,z,raised,h-.85,.18);brackets(x,h+raised-.7,z,.78);}
if(walls){for(const sign of[-1,1]){const xx=sign*w*.36;box(xx,raised+h*.42,0,.14,h*.79,d*.73,'wall');for(const zz of[-d*.27,-d*.09,d*.09,d*.27])group(xx+sign*.09,0,zz,sign*Math.PI/2,()=>lattice(0,raised+Math.min(4.4,h*.59)/2+.25,.0,d*.14,Math.min(4.4,h*.59)));for(const yy of[raised+.22,raised+h*.65,raised+h*.80])box(xx+sign*.11,yy,0,.22,.21,d*.76,'red');for(let j=0;j<=8;j++){const zz=-d*.36+j*d*.09;box(xx+sign*.11,raised+h*.48,zz,.22,h*.92,.20,'red');if(h>7)brackets(xx+sign*.15,h+raised-.75,zz,.76);}}box(0,raised+h*.48,-front,w*.75,h*.87,.16,'wall');box(-w*.36,raised+h*.48,0,.12,h*.87,d*.72,'wall');for(const x of[-w*.27,-w*.09,w*.09,w*.27]){lattice(x,frontCenter,front-.22,w*.14,frontHeight);box(x,raised+h*.84,front-.1,w*.14,h*.13,.12,'wall');}for(const y of[raised+.2,raised+h*.74])box(0,y,front-.12,w*.76,.18,.19,'red');}
// A second, close-spaced bracket line supports the projecting canopy rather
// than leaving a bare rectangular girder across each elevation.
for(const sign of[-1,1]){
 const z=sign*d*.42,n=Math.ceil(w/(role==='left-grand-hall'?.95:.76));for(let i=0;i<=n;i++){
  const x=-w*.42+i*w*.84/n;brackets(x,h+raised-.57,z,role==='left-grand-hall'?.42:.48);
  box(x,h+raised-.82,z,.21,.22,.28,'red');
  group(x,h+raised-.84,z+sign*.16,sign<0?Math.PI:0,()=>rosette(0,0,0,.072));
 }
 for(const yy of[h+raised-.72,h+raised-.93])box(0,yy,sign*d*.375,w*.85,.105,.22,'red');
}
if(buildRoof)roof(w,d,h+raised-roofEaveDrop,roofRise+roofEaveDrop,roofCurl,.22,roofHorn);if(lanterns)for(const x of[-w*.30,w*.30])lantern(x,h+raised-1.25,front+.25,.38);}
function lantern(x,y,z,s=.5){between([x,y+s*.9,z],[x,y+s*2.9,z],s*.045,'oldgold',true);box(x,y,z,s*.92,s*1.45,s*.83,'paper');for(const sx of[-1,1])for(const sz of[-1,1])box(x+sx*s*.47,y,z+sz*s*.43,s*.07,s*1.5,s*.07,'dark');for(let j=-3;j<=3;j++)for(const zz of[-1,1]){box(x+j*s*.13,y,z+zz*s*.45,s*.024,s*1.4,s*.025,'oldgold');box(x,y+j*s*.21,z+zz*s*.46,s*.92,s*.022,s*.025,'oldgold');}for(const yy of[-1,1]){box(x,y+yy*s*.78,z,s*1.08,s*.14,s*1.03,'dark');emit(cylG,'gold',x,y+yy*s*.94,z,s*.2,s*.2,s*.2);}for(const zz of[-1,1])rosette(x,y,z+zz*s*.48,s*.30);}
function recedingWingRoof(){
 const w=5.3,d=10.3,hd=d/2,zMax=2.35,span=zMax+hd;
 const P=(t,z)=>[-w/2+w*t,7.6+(z+hd)/d*2.1+1.9*Math.pow(1-t,1.6)+.56*Math.pow(t,8)*(.15+.85*Math.pow(Math.abs(z)/hd,7)),z];
 const pp=[],uv=[],tri=(a,b,c)=>{for(const p of[a,b,c]){pp.push(...p);uv.push(p[0],p[2]);}};
 for(let j=0;j<52;j++)for(let i=0;i<22;i++){
  const z=-hd+j*span/52,zz=-hd+(j+1)*span/52,a=P(i/22,z),b=P((i+1)/22,z),c=P(i/22,zz),e=P((i+1)/22,zz);tri(a,c,b);tri(b,c,e);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();emit(g,'tile');
 const under=g.clone();for(let i=0;i<under.attributes.position.count;i++)under.attributes.position.setY(i,under.attributes.position.getY(i)-.15);under.computeVertexNormals();emit(under,'wood');
 for(let j=0;j<=40;j++){
  const z=-hd+j*span/40;
  for(let i=0;i<14;i++){const a=P(i/14,z),b=P(Math.min(1,(i+1.055)/14),z);a[1]+=.020;b[1]+=.020;ceramicTile(a,b,.077,.94+.055*Math.sin(j*1.33+i*2.71));}
  if(j%2===0){const path=Array.from({length:18},(_,i)=>{const p=P(i/17,z);p[1]-=.26;return p;});emit(createContinuousTimber(path,.08,.13,.010),'red');}
  const e=P(1,z);emit(cylG,'tileedge',e[0],e[1]+.04,e[2],.105,.09,.105,[0,0,Math.PI/2]);emit(torusG,'tileedge',e[0]+.05,e[1]+.04,e[2],.095,.095,.095,[0,Math.PI/2,0]);
 }
 for(const drop of[.18,.34]){
  const path=Array.from({length:36},(_,j)=>{const p=P(1,-hd+j*span/35);p[1]-=drop;return p;});emit(createContinuousTimber(path,drop===.18?.115:.045,.19,.008),drop===.18?'wood':'red');
 }
 const pts=Array.from({length:30},(_,i)=>P(i/29,-hd));line(pts,.10,'tileedge');emit(createContinuousTimber(pts.map(p=>[p[0],p[1]-.20,p[2]]),.14,.15,.012),'wood');
 for(let j=0;j<=8;j++){const z=-hd+j*span/8,e=P(.82,z),top=e[1]-.34;box(w*.36,(top+6.15)/2,z,.15,Math.max(.1,top-6.15),.18,'red');brackets(w*.36,top-.4,z,.65);}
 const end=new T.Shape();end.moveTo(-w/2,6.65);for(let i=0;i<=28;i++){const p=P(i/28,zMax);end.lineTo(p[0],p[1]-.24);}end.lineTo(w/2,6.65);end.closePath();
 const endG=new T.ExtrudeGeometry(end,{depth:.18,steps:1,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:1});emit(endG,'wood',0,0,zMax-.17);
 for(let i=0;i<=7;i++){const x=-w*.45+i*w*.9/7,p=P((x+w/2)/w,zMax);box(x,(p[1]+6.65)/2,zMax+.04,.105,p[1]-6.65-.24,.16,'red');brackets(x,p[1]-.67,zMax+.04,.45);}box(0,6.76,zMax+.03,w*.94,.19,.22,'red');
}

role='left-grand-hall';group(-4.4,0,-7.5,.08,()=>{hall(11.0,8.0,6.45,{raised:2.0,roofRise:5.0,roofEaveDrop:.45,roofCurl:1.10,roofHorn:.26,frontHeight:3.2,frontCenter:4.0});},1.04);group(-3.8,1.3,-7.5,-.55,()=>{box(0,-.6,0,4.7,1.8,8.8,'stone');hall(5.3,10.3,6.2,{roofRise:2.4,buildRoof:false});recedingWingRoof();},.90);
role='layered-walkways';group(-4.0,.1,-13,.13,()=>hall(7.5,7.4,5.9),.82);group(-1.5,.0,-17,0,()=>hall(7.6,6.5,4.8),.80);group(7.8,.45,-14.2,-.15,()=>{const w=9.2,d=8.3,front=d*.37,raised=2.1;hall(w,d,8.0,{raised,roofRise:3.65,roofCurl:.95,roofHorn:.32,walls:false,frontOpening:true});box(0,2.8,-d*.40,w*.85,6.25,.20,'dark');for(const sx of[-1,1])box(sx*w*.43,2.8,0,.18,6.25,d*.78,'wood');for(const sx of[-1,1]){box(sx*3.15,4.25,front+.02,1.65,4.30,.13,'wall');lattice(sx*3.15,4.25,front+.11,1.20,3.70);column(sx*2.16,front+.06,raised,7.10,.16);lattice(sx*1.35,4.05,front+.10,1.12,3.70);for(const yy of[2.35,3.05,5.05])rosette(sx*1.35,yy,front+.19,.09);for(let k=0;k<7;k++)box(sx*1.35,2.55+k*.50,front+.20,.022,.34,.03,'oldgold');}for(const yy of[2.17,6.05,7.50])box(0,yy,front+.02,w*.88,.17,.26,'red');for(let i=0;i<13;i++){const x=-3.75+i*.625;box(x,6.60,-d*.39,.045,2.75,.05,'oldgold');}for(const sx of[-1,1]){const lanternX=sx*2.80;lantern(lanternX,6.50,front-.25,.38);}curvedGable(0,front+.10,8.70,5.5,2.0,2.4);},.62);group(2.0,.0,-21,0,()=>hall(10.0,5.8,3.9),.93);
role='main-hall-sanctum';material('statueGold','#b68135',.29,.72);{const statue=new T.SphereGeometry(1,32,24);geometries.add(statue);group(6.10,1.42,-13.26,-.15,()=>{for(let i=0;i<4;i++){const w=3.35-i*.34,y=.71+i*.18;box(0,y,0,w,.17,1.02-i*.10,'dark');box(0,y+.094,.015,w+.08,.035,1.05-i*.10,'oldgold');for(const x of[-w*.42,-w*.21,0,w*.21,w*.42])rosette(x,y+.12,.54,.055);}box(0,1.58,.02,1.30,.28,.72,'oldgold');emit(statue,'statueGold',0,1.77,.02,.52,.19,.39);emit(statue,'statueGold',0,2.19,-.035,.35,.47,.27);emit(statue,'statueGold',0,2.69,.04,.17,.20,.18);emit(statue,'statueGold',0,2.92,.03,.065,.09,.07);for(const side of[-1,1]){emit(statue,'statueGold',side*.39,2.15,.02,.18,.42,.18,[0,0,side*.18]);emit(statue,'statueGold',side*.55,1.92,.16,.13,.29,.13,[0,0,side*.30]);emit(statue,'statueGold',side*.11,2.64,.04,.045,.14,.045,[0,0,side*.2]);}emit(torusG,'gold',0,2.54,-.28,.52,.52,.055,[0,0,0]);emit(torusG,'oldgold',0,2.54,-.30,.38,.38,.04,[0,0,0]);for(let i=0;i<12;i++){const a=i*Math.PI/6;emit(ballG,'gold',Math.cos(a)*.46,2.54+Math.sin(a)*.46,-.25,.035,.045,.035);}},.70);}
// Source anchors: compact white/red storeys, closely carved cornices,
// a true four-slope blue-tiled crown and narrow many-ring sorin.
role='five-tier-pagoda';group(4.2,-.2,-24,-.40,()=>{
 box(0,.35,0,5.8,.7,5.8,'stone');
 for(let level=0;level<5;level++){
  const floor=.75+level*3.05,h=2.67,w=7.3-level*.29,body=w*.60,hh=body/2;
  box(0,floor+h*.5,0,body,h,body,'wall');
  for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5])group(0,0,0,angle,()=>{
   // Three closed bays: the narrow central shutter sits between the posts;
   // white side infill and small lower grilles remain continuous walls.
   for(const x of[-hh,-body*.17,body*.17,hh]){
    column(x,hh+.055,floor,h-.32,.145);
    brackets(x,floor+h-.68,hh+.12,.66);
    for(const yy of[floor+.82,floor+h-.79])rosette(x,yy,hh+.215,.057);
   }
   lattice(0,floor+h*.52,hh+.045,body*.255,h*.37);
   for(const sign of[-1,1]){
    const x=sign*body*.337;
    box(x,floor+h*.52,hh+.035,body*.275,h*.39,.09,'wall');
    for(let i=0;i<7;i++)box(x-body*.085+i*body*.17/6,floor+h*.405,hh+.10,.018,h*.11,.026,'wood');
    box(x,floor+h*.40,hh+.115,body*.205,.035,.035,'red');
   }
   for(const yy of[floor+.18,floor+.82,floor+h-.63])box(0,yy,hh+.16,body+.22,.13,.22,'red');
   // Deep load-bearing cornice: crossed curved brackets, continuous girders
   // and nested bearing blocks occupy the wall-to-eave transition.
   box(0,floor+h-.31,hh+.20,body+.64,.25,.52,'red');
   box(0,floor+h-.59,hh+.24,body+.48,.16,.45,'wood');
   for(let i=0;i<9;i++){
    const x=-body*.48+i*body*.96/8;
    brackets(x,floor+h-.65,hh+.36,.59);
    box(x,floor+h-.23,hh+.63,.10,.08,.11,'gold');
    for(const dx of[-.09,.09])box(x+dx,floor+h-.51,hh+.55,.07,.13,.10,'oldgold');
   }
   // Raised balcony has a solid decorated sill under the close-spaced rails.
   box(0,floor+.06,hh+.20,body+.62,.17,.65,'red');
   box(0,floor+.26,hh+.43,body+.47,.18,.10,'red');
   for(const yy of[floor+.23,floor+.73])box(0,yy,hh+.46,body+.49,.095,.12,'redlight');
   for(let i=0;i<19;i++)box(-body*.54+i*body*1.08/18,floor+.49,hh+.46,.05,.45,.07,'red');
   for(const x of[-body*.37,0,body*.37])rosette(x,floor+.26,hh+.50,.055);
  });
  // A compact four-slope hip exposes the illuminated right return. The crown
  // rise offsets the higher cornice so its surveyed apex stays at (789,199).
  roof(w*.93,w*.84,floor+h+.15,level===4?2.71:1.40,.44,.028);
 }
 const y=17.06;emit(new T.CylinderGeometry(.025,.29,4.85,16),'oldgold',0,y+2.40,0);
 for(let i=0;i<23;i++){
  const r=.34-i*.0116;emit(torusG,'gold',0,y+.16+i*.185,0,r,r*.72,r,[Math.PI/2,0,0]);
 }
 emit(ballG,'gold',0,21.89,0,.115,.20,.115);
},1.20);
// Porch is genuinely close to the lens. Its painted members frame distant rooms.
role='foreground-veranda';box(0,7.32,8.5,7.2,.22,3.8,'wood');for(let j=0;j<8;j++)box(0,7.18,6.7+j*.5,7.1,.08,.41,'redlight');for(const x of[-1.6,1.6]){box(x,6.96,8.3,.20,.24,3.3,'red');}for(const x of[-2.30,3.10]){box(x,3.5,7.9,x<0?.61:.32,8.7,x<0?.64:.42,'red');for(const y of[.2,1.9,5.7])plaque(x, y,8.24,.47,y===1.9?1.35:.85);for(const part of createGateColumnShoe(x<0?.61:.32,x<0?.64:.42,.24))emit(part.geometry,part.material,x,.27,7.9);const facing=x<0?1:-1,innerHardware=x<0?[[3.30,.42,.58]]:[[5.28,.32,.68],[2.58,.32,.78]];for(const [py,pw,ph]of innerHardware){const parts=createGatePlaque(pw,ph);for(const part of parts)emit(part.geometry,part.material,x+facing*.317,py,7.9,1,1,1,[0,facing*Math.PI/2,0]);}}box(0,7.28,8.2,7.1,.45,1.5,'red');for(let i=0;i<24;i++){box(-3.35+i*.29,7.01,7.9,.17,.32,2.3,'redlight');box(-3.35+i*.29,6.86,8.98,.12,.10,.05,'gold');}lantern(-1.95,5.75,6.8,.45);
const railBalusterG=new T.LatheGeometry([[.09,0],[.09,.09],[.065,.17],[.05,.30],[.05,.57],[.075,.67],[.10,.76],[.10,.84]].map(p=>new T.Vector2(...p)),8);function railing(a,b,y,near=false){const length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(length/(near?1.45:.9));for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,yy=typeof y==='function'?y(t):y;if(near&&i!==n)emit(railBalusterG,'red',x,yy+.12,z,.76,.82,.76,[0,Math.PI/8,0]);else box(x,yy+(near?.41:.425),z,near?.11:.13,near?.82:.85,near?.11:.14,'red');if(near?i===n:i%3===0){const ph=near?.82:.94;box(x,yy+ph/2,z,.14,ph,.14,'red');emit(ballG,'gold',x,yy+ph+.04,z,.065,.065,.065);emit(cylG,'gold',x,yy+ph-.02,z,.075,.08,.075);}if(i<n){const tt=(i+1)/n,ny=typeof y==='function'?y(tt):y;for(const dy of(near?[.12,.57,.76]:[.13,.58,.77]))between([x,yy+dy,z],[a[0]+(b[0]-a[0])*tt,ny+dy,a[1]+(b[1]-a[1])*tt],near?.082:.095,'redlight',false,near?.105:.12);}}}
railing([-3.03,5.7],[1.85,9.1],t=>.40-.40*t,true);railing([-3.03,7.55],[-3.03,5.7],t=>.40+.05*t,true);
// The crossing follows the stream in depth: its near landing sits left and its far landing recedes toward the right-hand buildings.
role='arched-stream-bridge';
const bridgeStart=[1.0,-3.0],bridgeEnd=[5.5,-14.6],bridgeDX=bridgeEnd[0]-bridgeStart[0],bridgeDZ=bridgeEnd[1]-bridgeStart[1],bridgeRun=Math.hypot(bridgeDX,bridgeDZ),bridgeNX=-bridgeDZ/bridgeRun,bridgeNZ=bridgeDX/bridgeRun,bridgeYaw=Math.atan2(bridgeNX,bridgeNZ),bridgeArch=t=>1.35+1.05*Math.sin(t*Math.PI),bridgePoint=(t,side=0)=>[bridgeStart[0]+bridgeDX*t+bridgeNX*side,bridgeArch(t),bridgeStart[1]+bridgeDZ*t+bridgeNZ*side];
for(let i=0;i<46;i++){const t=(i+.5)/46,p=bridgePoint(t);box(p[0],p[1]-.09,p[2],.225,.16,1.50,'wood',bridgeYaw);}
for(const side of[-.58,0,.58])line(Array.from({length:41},(_,i)=>{const p=bridgePoint(i/40,side);p[1]-=.21;return p;}),side===0?.15:.095,'wood');
for(let i=2;i<44;i+=4){const p=bridgePoint(i/45);between([p[0]-bridgeNX*.50,p[1]-.18,p[2]-bridgeNZ*.50],[p[0]+bridgeNX*.50,p[1]-.18,p[2]+bridgeNZ*.50],.043,'redlight');}
function bridgeRail(side){const top=[],low=[];for(let i=0;i<=28;i++){const t=i/28,p=bridgePoint(t,side*.72);top.push([p[0],p[1]+.88,p[2]]);low.push([p[0],p[1]+.29,p[2]]);if(i%2===0){const h=i===0||i===28?.96:.72;box(p[0],p[1]+h/2,p[2],i%8===0?.16:.09,h,.115,'red');if(i%8===0){emit(ballG,'gold',p[0],p[1]+h+.045,p[2],.065,.065,.065);rosette(p[0],p[1]+.15,p[2]+side*bridgeNZ*.05,.060);}}}line(top,.082,'redlight');line(low,.052,'red');}
bridgeRail(-1);bridgeRail(1);

role='gallery-stone-stair';{const a=[5.5,1.35,-14.6],b=[7.0,2.25,-17.6],dx=b[0]-a[0],dz=b[2]-a[2],run=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz),steps=12,width=2.35,profile=new T.Shape();profile.moveTo(0,0);profile.lineTo(0,(b[1]-a[1])/steps);for(let i=0;i<steps;i++){profile.lineTo((i+1)*run/steps,(i+1)*(b[1]-a[1])/steps);if(i<steps-1)profile.lineTo((i+1)*run/steps,(i+2)*(b[1]-a[1])/steps);}profile.lineTo(run,b[1]-a[1]);profile.lineTo(run,0);profile.closePath();const flight=new T.ExtrudeGeometry(profile,{depth:width,steps:1,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:1});flight.translate(0,0,-width/2);group(a[0],a[1],a[2],Math.atan2(-dz,dx),()=>emit(flight,'stone'));for(let i=0;i<steps;i++){const t=(i+.5)/steps,top=a[1]+(b[1]-a[1])*(i+1)/steps,x=a[0]+dx*t,z=a[2]+dz*t;box(x,top-.015,z,2.47,.065,run/steps+.085,'stone',yaw);}for(const side of[-1,1]){const off=side*1.58,p0=[a[0]+Math.cos(yaw)*off,a[1],a[2]-Math.sin(yaw)*off],p1=[b[0]+Math.cos(yaw)*off,b[1],b[2]-Math.sin(yaw)*off];between([p0[0],p0[1]+.08,p0[2]],[p1[0],p1[1]+.08,p1[2]],.105,'stone',false,.17);const upper0=[p0[0],p0[1]+.92,p0[2]],upper1=[p1[0],p1[1]+.92,p1[2]];between(upper0,upper1,.082,'redlight',false,.12);for(let i=0;i<=8;i++){const t=i/8,x=p0[0]+(p1[0]-p0[0])*t,y=p0[1]+.1+(p1[1]-p0[1])*.0+(p1[1]-p0[1])*0,z=p0[2]+(p1[2]-p0[2])*t,yy=a[1]+(b[1]-a[1])*t;box(x,yy+.49,z,.105,.90,.12,'red');}}}
// A narrow, winding stream cuts a planted shallow valley rather than a full-frame water sheet.
role='garden-ground';
const ground=z=>Math.max(0,Math.min(1.7,(4-z)*.07));
const riverProfile=[[-15,2.8],[-13,2.4],[-11,2.2],[-9,2.4],[-7,2.6],[-5,2.9],[-3,3.0],[-1,2.8],[0,2.7],[2,2.4],[4,2.0],[6,1.7],[7.5,1.5]];
function riverXAt(z){if(z<=riverProfile[0][0])return riverProfile[0][1];if(z>=riverProfile.at(-1)[0])return riverProfile.at(-1)[1];for(let i=0;i<riverProfile.length-1;i++){const [za,xa]=riverProfile[i],[zb,xb]=riverProfile[i+1];if(z>=za&&z<=zb)return T.MathUtils.lerp(xa,xb,(z-za)/(zb-za));}return 0;}
const landHeight=(x,z)=>ground(z)-.08+.035*Math.sin(x*.43+z*.27)*Math.sin(z*.31-x*.22);
const terrainHeight=(x,z)=>{const d=Math.abs(x-riverXAt(z)),channel=(z>-21&&z<8)?1-T.MathUtils.smoothstep(d,1.1,2.9):0;return landHeight(x,z)*(1-channel)-.88*channel;};
const earth=new T.MeshStandardMaterial({name:'scene08-organic-earth-no-grid',color:'#535a49',roughness:1,metalness:0});earth.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vEarthLocal;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvEarthLocal=transformed;');shader.fragmentShader='varying vec3 vEarthLocal;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat earthMottle=sin(vEarthLocal.x*.63+sin(vEarthLocal.z*.29)*1.8)*sin(vEarthLocal.z*.47-vEarthLocal.x*.17);float earthPatch=sin(vEarthLocal.x*.19+vEarthLocal.z*.11)*sin(vEarthLocal.z*.16-vEarthLocal.x*.08);float earthSoft=sin(vEarthLocal.x*.075+sin(vEarthLocal.z*.095)*2.1)*sin(vEarthLocal.z*.064-vEarthLocal.x*.052);diffuseColor.rgb*=.80+.10*earthMottle+.12*earthPatch+.08*earthSoft;`);};materials.push(earth);
const nx=144,nz=144,pp=[],uv=[],ix=[];
for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-28+i*56/nx,z=-42+j*60/nz,y=terrainHeight(x,z);pp.push(x,y,z);uv.push(x*.08,z*.08);}
for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ix.push(a,c,b,b,c,d);}
const terrain=new T.BufferGeometry();terrain.setAttribute('position',new T.Float32BufferAttribute(pp,3));terrain.setAttribute('uv',new T.Float32BufferAttribute(uv,2));terrain.setIndex(ix);terrain.computeVertexNormals();emit(terrain,earth);geometries.add(terrain);
const waterYAt=z=>.52;const waterPath=riverProfile.map(([z,x])=>new T.Vector3(x,waterYAt(z),z)),waterCurve=new T.CatmullRomCurve3(waterPath,false,'centripetal');
const waterFlatP=[],waterUv=[],waterIx=[],waterN=100,waterM=18;for(let j=0;j<=waterN;j++){const t=j/waterN,center=waterCurve.getPoint(t),tangent=waterCurve.getTangent(t).normalize(),across=new T.Vector3(-tangent.z,0,tangent.x).normalize(),width=(.72+.48*T.MathUtils.smoothstep(t,.18,.78)+.46*T.MathUtils.smoothstep(t,.82,1))*T.MathUtils.smoothstep(t,0,.09);for(let i=0;i<=waterM;i++){const u=i/waterM*2-1,edge=.035*Math.sin(t*79+u*4),p=center.clone().addScaledVector(across,u*width+edge);waterFlatP.push(p.x,-p.z,0);waterUv.push(t*8,i/waterM*2);}}
for(let j=0;j<waterN;j++)for(let i=0;i<waterM;i++){const a=j*(waterM+1)+i,b=a+1,c=a+waterM+1,d=c+1;waterIx.push(a,b,c,b,d,c);}
const waterG=new T.BufferGeometry();waterG.setAttribute('position',new T.Float32BufferAttribute(waterFlatP,3));waterG.setAttribute('uv',new T.Float32BufferAttribute(waterUv,2));waterG.setIndex(waterIx);waterG.computeVertexNormals();
const waterReflectShader={...Reflector.ReflectorShader,uniforms:T.UniformsUtils.clone(Reflector.ReflectorShader.uniforms),vertexShader:Reflector.ReflectorShader.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec2 vWaterUV;').replace('vUv = textureMatrix * vec4( position, 1.0 );','vWaterUV=uv; vUv = textureMatrix * vec4( position, 1.0 );'),fragmentShader:Reflector.ReflectorShader.fragmentShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec2 vWaterUV;').replace('vec4 base = texture2DProj( tDiffuse, vUv );','vec4 uvw=vUv;uvw.xy+=vec2(sin(vWaterUV.x*47.+vWaterUV.y*19.),sin(vWaterUV.y*61.-vWaterUV.x*13.))*.0011*vUv.w;vec4 base=texture2DProj(tDiffuse,uvw);').replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );','gl_FragColor = vec4( mix( color, base.rgb, .38 ), 1.0 );')};const stream=new Reflector(waterG,{color:'#4c6559',textureWidth:1024,textureHeight:1024,clipBias:.003,shader:waterReflectShader,multisample:2});stream.rotation.x=-Math.PI/2;stream.position.y=.52;stream.name='scene08-reflective-meander';stream.receiveShadow=true;scene.add(stream);geometries.add(waterG);
material('waterglint','#b9ab84',.24,.01);mats.waterglint.emissive=new T.Color('#292314');mats.waterglint.emissiveIntensity=.12;role='stream-surface-glints';for(let i=0;i<7;i++){const z=-10+i*2.3,x=riverXAt(z)+Math.sin(i*2.3)*.13,y=waterYAt(z)+.035,length=.18+.08*Math.sin(i*1.7),tangent=new T.Vector3(.045,0,.999).normalize();line([[x-tangent.x*length,y,z-tangent.z*length],[x,y+.006,z],[x+tangent.x*length,y,z+tangent.z*length]],.014,'waterglint');}
const rocks=Array.from({length:9},(_,i)=>createWeatheredBoulderGeometry(T,{seed:803+i,sectors:20,rings:11})),moss=rocks.map(g=>createBoulderMossGeometry(T,g));
function rock(x,y,z,sx,sy,sz,i){y+=ground(z);emit(rocks[i%9],'rock',x,y,z,sx,sy,sz,[0,i*.71,0]);emit(moss[i%9],'moss',x,y,z,sx,sy,sz,[0,i*.71,0]);}
// The near bridge landing bears on an interlocked granite abutment; the upper
// course reaches the deck underside while the lower stones key into the bank.
role='arched-stream-bridge';{const p=bridgePoint(0),base=ground(p[2]);for(const [side,course]of[[-.46,0],[.46,0],[-.48,1],[0,1],[.48,1]]){const upper=course===1,cy=upper?1.015:base+.205,sy=upper?.205:.275,sx=upper?.57:.64,sz=upper?.48:.58,x=p[0]+bridgeNX*side,z=p[2]+bridgeNZ*side,i=(Math.round((side+1)*10)+course*3)%9,yaw=bridgeYaw+side*.27;emit(rocks[i],'rock',x,cy,z,sx,sy,sz,[.035,yaw,.025]);emit(moss[i],'moss',x,cy,z,sx,sy,sz,[.035,yaw,.025]);}}
function riverRock(x,z,sx,sy,sz,i){const y=terrainHeight(x,z)+sy*.70,rot=i*.71;emit(rocks[i%9],'rock',x,y,z,sx,sy,sz,[0,rot,0]);emit(moss[i%9],'moss',x,y,z,sx,sy,sz,[0,rot,0]);}
role='weathered-garden-rocks';for(let i=0;i<78;i++){const z=rr(-21,6),side=i%2?-1:1,x=riverXAt(z)+side*rr(4.1,7.1);rock(x,rr(-.16,.25),z,rr(.32,.98),rr(.38,1.05),rr(.32,.98),i);}
role='stream-bank-granite';for(let i=134;i>0;i--){const z=-19.6+i*.20,side=i%2?-1:1,x=riverXAt(z)+side*rr(1.82,2.48),sx=rr(.34,.72),sy=rr(.28,.62);riverRock(x,z,sx,sy,rr(.34,.72),i+18);if(i%2===0)riverRock(x+side*rr(.40,.68),z+rr(-.13,.13),sx*.70,sy*.76,rr(.30,.58),i+43);}
role='left-garden-stone-island';for(const [x,z,sx,sy,sz,i]of[[-7.8,-3.6,1.00,.70,1.05,11],[-6.5,-2.2,1.18,.82,1.02,12],[-5.0,-1.5,.82,.56,.76,13],[-4.2,-.1,1.26,.82,1.10,14],[-2.8,.8,1.02,.70,.84,15],[-6.0,1.2,.88,.58,.92,16],[-8.2,.4,1.16,.76,1.04,17],[-3.8,2.2,.84,.58,.78,18],[-6.6,-4.6,1.02,.70,.96,19]])riverRock(x,z,sx,sy,sz,i);for(const [x,z,sx,sy,sz,i]of[[.1,3.0,.86,.55,.92,51],[4.8,2.8,1.05,.68,1.08,52],[-1.4,4.2,.92,.58,.98,53],[1.0,5.0,1.10,.70,1.20,54],[5.0,4.8,.96,.62,.90,55],[-3.2,5.6,1.16,.72,1.25,56]])riverRock(x,z,sx,sy,sz,i);for(const [x,z,sx,sy,sz,i]of[[-5.0,-4.0,1.05,.72,1.12,31],[-3.8,-3.2,1.10,.76,1.02,32],[-2.8,-2.2,.90,.55,.82,33],[-1.6,-1.1,1.00,.66,.92,34],[-5.2,-.7,1.24,.74,1.32,35],[-3.8,.4,1.02,.62,.92,36],[-2.4,1.4,.86,.52,.82,37],[-4.5,2.4,1.12,.72,1.04,38],[-1.4,2.8,.92,.55,.80,39],[-6.5,3.2,1.16,.70,1.12,40],[-2.8,4.0,.94,.62,.86,41],[-.5,4.5,1.00,.60,.92,42]])riverRock(x,z,sx,sy,sz,i);rock(-5.8,.20,.2,.9,1.2,.8,5);rock(-6.0,.1,-2.2,.8,1.0,.7,6);rock(-6.8,.05,-.5,.8,1.2,.8,4);rock(5.5,.0,3.5,1.15,.95,1.0,7);rock(-7.2,.2,.6,1.0,1.0,1.1,8);for(let i=0;i<10;i++){const z=-5+i*1.0,side=i%2?1:-1;rock(.3+side*rr(4.4,5.0),.45,z,rr(.55,.88),rr(.58,.92),rr(.48,.78),i+5);}for(const p of[[-5.35,.06,-4.8,1.18,.72,1.05,2],[-5.9,.02,-3.0,.92,.62,.83,5],[-5.35,.08,-1.1,1.12,.72,.86,1],[-5.8,.04,1.1,.85,.52,.74,4],[5.2,.04,-5.3,.9,.62,.86,3],[5.7,.06,-3.5,1.12,.74,.98,6],[5.55,.03,-1.2,.82,.52,.77,0],[5.9,.04,1.0,1.08,.7,.88,7]])rock(...p);
// Weathered, carved granite: a curved four-hip kasa with a double curled rim,
// a pierced lamp chamber, molded lotus collars and an uneven stone shaft.
material('carvedstone','#a7a18f',.96);mats.carvedstone.map=stone;mats.carvedstone.bumpMap=stone;mats.carvedstone.bumpScale=.06;
mats.carvedstone.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 vCarvedStone;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCarvedStone=position;');
 shader.fragmentShader='varying vec3 vCarvedStone;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float grain=fract(sin(dot(vCarvedStone,vec3(127.1,311.7,73.3)))*43758.5453);
 float weather=sin(vCarvedStone.x*13.+sin(vCarvedStone.z*9.)*2.)*sin(vCarvedStone.y*19.+vCarvedStone.z*7.);
 diffuseColor.rgb*=.81+.22*grain+.10*weather;`);
};
function stoneLantern(x,z,y,scale){group(x,y,z,.08,()=>{
 const shaft=new T.LatheGeometry([[.48,0],[.51,.09],[.48,.19],[.36,.28],[.25,.36],[.23,.61],[.20,1.07],[.29,1.14],[.40,1.21],[.44,1.31],[.38,1.41]].map(p=>new T.Vector2(...p)),24);emit(shaft,'carvedstone');
 for(let j=0;j<5;j++)emit(torusG,'carvedstone',0,.33+j*.18,0,.245+(j%2)*.014,.245,.245+(j%2)*.014,[Math.PI/2,0,0]);
 emit(new T.CylinderGeometry(.43,.36,.20,8),'carvedstone',0,1.42,0,1,1,1,[0,Math.PI/8,0]);
 box(0,1.98,0,.78,.82,.78,'carvedstone');
 for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5])group(0,0,0,angle,()=>{
  box(0,1.98,.398,.53,.57,.025,'lanternamber');
  for(const xx of[-.34,.34]){
   box(xx,1.97,.425,.10,.84,.11,'carvedstone');
   for(const dx of[-.023,.023])box(xx+dx,1.97,.487,.012,.70,.013,'stone');
  }
  for(const xx of[-.19,-.095,0,.095,.19])box(xx,1.98,.424,.018,.57,.028,'dark');
  for(const yy of[1.80,1.98,2.17])box(0,yy,.433,.53,.017,.026,'dark');
  for(const yy of[1.53,1.61,2.36])box(0,yy,.418,.91,.075,.15,'carvedstone');
  for(let j=0;j<7;j++){
   const xx=-.35+j*.116;emit(ballG,'carvedstone',xx,1.65,.454,.043,.055,.035);
   line([[xx-.046,2.30,.455],[xx,2.25,.477],[xx+.046,2.30,.455]],.013,'stone');
  }
 });
 const capM=mats.carvedstone.clone();capM.onBeforeCompile=mats.carvedstone.onBeforeCompile;capM.vertexColors=true;materials.push(capM);
 const W=.70,D=.66,N=40,pp=[],colors=[],indices=[];
 const H=(xx,zz)=>{const u=xx/W,vv=zz/D,t=Math.max(Math.abs(u),Math.abs(vv)),corner=Math.pow(Math.min(Math.abs(u),Math.abs(vv)),7);return 2.48+.57*Math.pow(Math.max(0,1-t),1.6)+.17*Math.pow(t,8)*(.13+.87*corner);};
 for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
  const xx=-W+2*W*i/N,zz=-D+2*D*j/N,yy=H(xx,zz)+.005*Math.sin(xx*47+zz*31);pp.push(xx,yy,zz);
  const q=Math.sin(xx*13+Math.sin(zz*9)*1.7)*Math.cos(zz*17-xx*7),c=new T.Color(q>.26?'#5c633d':q<-.5?'#837b65':'#b1aa94');colors.push(c.r,c.g,c.b);
 }
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;indices.push(a,c,b,b,c,d);}
 const cap=new T.BufferGeometry();cap.setAttribute('position',new T.Float32BufferAttribute(pp,3));cap.setAttribute('color',new T.Float32BufferAttribute(colors,3));cap.setIndex(indices);cap.computeVertexNormals();emit(cap,capM);
 // Continuous solid edge thickness follows the compound curvature, with two
 // swept lips instead of the earlier four flat rectangular cap bars.
 for(const side of[0,1,2,3]){
  const edge=t=>{const u=-1+2*t;return side===0?[W*u,H(W*u,D),D]:side===1?[W,H(W,D*u),D*u]:side===2?[W*u,H(W*u,-D),-D]:[-W,H(-W,D*u),D*u];};
  const wall=[];for(let i=0;i<40;i++){
   const a=edge(i/40),b=edge((i+1)/40),c=a.slice(),d=b.slice();c[1]-=.13;d[1]-=.13;for(const q of[a,c,b,b,c,d])wall.push(...q);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(wall,3));g.computeVertexNormals();mats.carvedstone.side=T.DoubleSide;emit(g,'carvedstone');
  for(const drop of[.015,.12])line(Array.from({length:41},(_,i)=>{const p=edge(i/40);p[1]-=drop;return p;}),drop===.015?.035:.025,'carvedstone');
 }
 emit(new T.LatheGeometry([[.20,3.0],[.26,3.09],[.24,3.18],[.16,3.29],[.19,3.40],[.15,3.51],[.06,3.60],[0,3.63]].map(p=>new T.Vector2(...p)),24),'carvedstone');
 for(let k=0;k<17;k++){
  const a=k*2.39996,xx=Math.cos(a)*.57,zz=Math.sin(a)*.53;emit(rocks[k%9],'moss',xx,H(xx,zz)+.02,zz,.055,.025,.07,[0,a,0]);
 }
},scale);}
role='stone-lanterns';stoneLantern(-3.1,.6,2.36,1.22);stoneLantern(1.35,-7,1.2,1.1);stoneLantern(5.3,-9.2,.15,.65);
// Each crown is a hierarchy of tapering branches with distributed individual
// folded leaves. The silhouettes retain air, asymmetry and branch direction.
function leaf(x,y,z,size,ma='leaf',yaw=0){if(ma==='pine'){emit(needleG,ma,x,y,z,size*3.0,size*3.0,size*3.0,[rr(-.5,.5),yaw,rr(-.8,.8)],rr(.72,1.25));return;}size*=z>4.5?.57:1.05;emit(leafG,ma,x,y,z,size*.78,size,size,[rr(-1.15,1.15),yaw,rr(-1.1,1.1)],rr(.67,1.24));}
const bloomG=new T.BufferGeometry(),bloomP=[];for(let k=0;k<5;k++){const a=k*Math.PI*2/5,ca=Math.cos(a),sa=Math.sin(a),fan=[];for(let j=0;j<=7;j++){const t=j/7*Math.PI*2,xx=.038+.028*Math.cos(t),zz=.020*Math.sin(t);fan.push([ca*xx-sa*zz,.008*Math.sin(t)*Math.sin(t),sa*xx+ca*zz]);}for(let j=0;j<7;j++)bloomP.push(0,-.004,0,...fan[j],...fan[j+1]);}bloomG.setAttribute('position',new T.Float32BufferAttribute(bloomP,3));bloomG.computeVertexNormals();
function leafyTwig(a,b,spread,ma='leaf',count=100){between(a,b,spread*.026,'bark',true);for(let j=0;j<count;j++){const t=random(),r=Math.sqrt(random())*spread,aa=rr(0,Math.PI*2),x=a[0]+(b[0]-a[0])*t+Math.cos(aa)*r,y=a[1]+(b[1]-a[1])*t+rr(-.35,.48)*spread,z=a[2]+(b[2]-a[2])*t+Math.sin(aa)*r;leaf(x,y,z,rr(.075,.17),ma,aa);if(ma==='maple'&&j%9===0)emit(bloomG,'flower',x,y+.03,z,rr(.8,1.5),1,rr(.8,1.5),[rr(-1,1),aa,rr(-1,1)],rr(.85,1.2));}}
function shrub(x,y,z,r,h,ma='leaf',count=1000){y+=ground(z);for(let j=0;j<5;j++){const a=j*2.39996,root=[x,y,z],elbow=[x+Math.cos(a)*r*.24,y+h*.31,z+Math.sin(a)*r*.24],fork=[x+Math.cos(a)*r*.58,y+h*rr(.54,.68),z+Math.sin(a)*r*.58];between(root,elbow,.045,'bark',true);between(elbow,fork,.034,'bark',true);for(let k=0;k<3;k++){const aa=a+(k-1)*.62,tip=[fork[0]+Math.cos(aa)*r*.33,y+h*rr(.76,.97),fork[2]+Math.sin(aa)*r*.33];between(fork,tip,.020,'bark',true);for(let m=0;m<2;m++){const ab=aa+(m?1:-1)*.6,end=[tip[0]+Math.cos(ab)*r*.22,tip[1]+rr(-.06,.12)*h,tip[2]+Math.sin(ab)*r*.22];leafyTwig([fork[0]+(tip[0]-fork[0])*.25,fork[1]+(tip[1]-fork[1])*.25,fork[2]+(tip[2]-fork[2])*.25],end,r*.27,ma,Math.ceil(count/20));}}}}
function tree(x,z,h,spread,ma='leaf'){const trunk=[[x,0,z],[x-.15,h*.36,z+.1],[x+.10,h*.71,z-.13],[x-.24,h,z]];for(let i=0;i<3;i++)between(trunk[i],trunk[i+1],.23*(1-i*.22),'bark',true);for(let j=0;j<15;j++){const f=.38+j*.041,a=j*2.39996,rad=spread*(.7+.3*Math.sin(j*3)),start=[x+.08,h*f,z],tip=[x+Math.cos(a)*rad,h*f+rr(.35,1.25),z+Math.sin(a)*rad];between(start,tip,.095*(1-f*.7),'bark',true);for(let k=0;k<5;k++){const b=[tip[0]+rr(-.65,.65),tip[1]+rr(-.1,.6),tip[2]+rr(-.65,.65)];leafyTwig(tip,b,spread*.32,ma,210);}}}
function pine(x,z,h,spread){
 let old=[x,0,z];for(let i=1;i<=8;i++){const q=[x+Math.sin(i*.69)*.55,h*i/8,z+Math.cos(i*.57)*.33];between(old,q,.31*(1-i/10),'bark',true);old=q;}
 // Horizontal, broken crown pads leave the bent trunk and rising branch forks
 // visible instead of filling the whole crown with a vertical olive curtain.
 for(let j=0;j<13;j++){
  const a=j*2.39996,f=.33+j*.041,r=spread*(1-f*.58),start=[x+Math.sin(f*5)*.45,h*f,z],mid=[x+Math.cos(a)*r*.56,h*f-.20,z+Math.sin(a)*r*.56],end=[x+Math.cos(a)*r,h*f+.40,z+Math.sin(a)*r];between(start,mid,.11,'bark',true);between(mid,end,.065,'bark',true);
  for(let k=0;k<4;k++){
   const aa=a+(k-1.5)*.38,c=[end[0]+Math.cos(aa)*.55,end[1]+rr(.03,.25),end[2]+Math.sin(aa)*.55];between(end,c,.022,'bark',true);
   for(let n=0;n<900;n++){
    const rad=Math.sqrt(random()),az=rr(0,6.283),px=c[0]+Math.cos(az)*rad*.82,pz=c[2]+Math.sin(az)*rad*.61,py=c[1]+.42*Math.sqrt(1-rad*rad)+rr(-.12,.12);
    leaf(px,py,pz,rr(.075,.14),'pine',az);
   }
  }
 }
}
role='branching-garden-trees';pine(-1.4,-15,6.3,2.1);tree(11,-15,8.7,2.6,'maple');tree(-10,-9,15,4.3,'leaf');tree(11,-22,14,3.8,'leaf');tree(-8,-28,13,3.8,'leaf');tree(13,-2,11,3.1,'leaf');for(let i=0;i<5;i++)tree(8+i*3.2,-30-i*1.7,16+i*.8,4.2,'leaf');
role='distant-forest-ridge';{const nx=144,nz=28,pp=[],uv=[],colors=[],ix=[],peaks=[[-29,11.0,8.0],[-18,18.0,7.5],[-5,15.0,8.0],[2,22.0,8.5],[14,19.0,8.0],[26,12.0,7.0]];for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-48+i*96/nx,z=-53+j*25/nz;let ridge=0;for(const [cx,height,width] of peaks)ridge=Math.max(ridge,height*Math.exp(-Math.pow((x-cx)/width,2)*.5));const depthFactor=1-.42*j/nz,grain=Math.sin(x*1.83+z*.43)*Math.sin(z*.71-x*.57)*.24+Math.sin(x*.43+z*.31)*.32,y=-2+ridge*depthFactor+grain;pp.push(x,y,z);uv.push(x*.12,z*.12);const shade=.72+Math.max(0,ridge)*.013+grain*.035;colors.push(shade*.56,shade*.70,shade*.48);}for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ix.push(a,c,b,b,c,d);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();const m=new T.MeshStandardMaterial({name:'distant-forest-ridge',vertexColors:true,roughness:1,metalness:0,side:T.DoubleSide});materials.push(m);emit(g,m);}
role='hanging-veranda-foliage';// Overhanging canopy is high and lateral; the pagoda has a clean sky opening.
leafyTwig([-5.5,10.55,2.0],[-1.7,10.0,2.5],1.2,'leaf',5000);leafyTwig([-2.9,10.6,2.3],[-.6,10.3,2.0],.88,'leaflight',2600);leafyTwig([7.6,9.7,2.1],[4.0,8.8,3.0],1.5,'leaf',6000);
role='dense-layered-shrubs';for(let i=54;i>0;i--){const z=rr(-18,6.5),side=i%2?1:-1,x=riverXAt(z)+side*rr(2.1,3.8);shrub(x,.08,z,rr(.40,.78),rr(.38,.78),i%7===0?'leaflight':i%3===0?'leaflight':'leaf',280);}shrub(-2.65,.95,8.05,1.65,1.25,'leaf',2200);shrub(6.8,.0,2.3,1.25,.85,'maple',1000);
for(const [x,z,leafKind]of[[-4.8,-3.8,'leaf'],[-3.2,-3.0,'leaflight'],[-5.6,-1.6,'leaf'],[-2.6,-.8,'maple'],[-4.2,.4,'leaf'],[-1.5,1.6,'leaflight']])shrub(x,.05,z,.82,1.18,leafKind,520);shrub(-5.3,.18,-1.2,1.2,1.4,'leaf',1250);shrub(-5.7,.18,-2.0,1.1,2.2,'leaflight',1500);shrub(-7.0,.2,2.0,1.1,1.7,'leaf',1200);shrub(-6.3,.1,1.0,1.0,2.2,'leaf',1400);shrub(7.0,.1,1.8,1.1,1.6,'maple',1300);shrub(7.2,.1,-1.0,1.0,1.8,'leaf',1250);shrub(-5.0,.12,-8.7,1.18,1.25,'leaflight',900);shrub(5.4,.12,-9.0,1.18,1.35,'maple',950);shrub(-4.9,.1,-2.7,1.05,1.35,'leaf',950);shrub(5.0,.1,-2.6,1.10,1.30,'leaflight',900);
role='fern-and-ground-cover';for(let j=0;j<180;j++){const z=rr(-18,6.5),side=j%2?1:-1,x=riverXAt(z)+side*rr(2.3,3.9),s=rr(.21,.40);for(let k=0;k<5;k++){const a=k*2.39996+j,h=s*.8;for(let n=1;n<8;n++){const t=n/8,r=s*t,yy=ground(z)+.15+h*Math.sin(t*Math.PI*.9);for(const side of[-1,1])leaf(x+Math.cos(a)*r-side*Math.sin(a)*s*.10,yy,z+Math.sin(a)*r+side*Math.cos(a)*s*.10,s*.20,'leaflight',a+side*.7);}}}
role='garden-flowers';for(let j=0;j<64;j++){const z=rr(-12,4.5),x=riverXAt(z)+rr(4.1,5.9);const y=ground(z)+rr(.5,1.2);if(j%4===0)between([x,.1,z],[x,y,z],.013,'leaf',true);for(let i=0;i<5;i++){const a=i*1.256;leaf(x+Math.cos(a)*.04,y,z+Math.sin(a)*.04,.07,'flower',a);}}
// A few small lotus leaves sit in the slow water, leaving the channel readable.
role='stream-lotus';const lotus=new T.CircleGeometry(1,24,.12,6.04);lotus.rotateX(-Math.PI/2);for(let i=0;i<14;i++){const z=-19+rr(0,25.5),x=riverXAt(z)+rr(-.36,.36),y=waterYAt(z)+.045,s=rr(.12,.27);emit(lotus,'leaflight',x,y,z,s,1,s*.85,[0,rr(0,6.2),0]);if(i%5===0){const stem=rr(.12,.22);between([x,y,z],[x,y+stem,z],.010,'leaf',true);for(let p=0;p<5;p++)emit(bloomG,'flower',x+Math.cos(p*Math.PI*2/5)*.035,y+stem,z+Math.sin(p*Math.PI*2/5)*.035,.78,1,.78,[0,p*Math.PI*2/5,0],.92);}}
const skyG=new T.SphereGeometry(120,48,32),skyM=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,toneMapped:false,vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 direction;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}float fbm(vec2 p){float v=0.0,a=.52;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(13.7,8.1);a*=.48;}return v;}void main(){vec3 d=normalize(direction);float h=clamp(d.y,0.0,1.0);vec2 p=d.xz/(.10+abs(d.y))*2.65;float n=fbm(p+vec2(.0,.07*sin(p.x*1.6)));float cloud=smoothstep(.34,.54,n)*smoothstep(.0,.88,h);vec3 zenith=vec3(.23,.45,.79);vec3 horizon=vec3(1.0,.64,.35);vec3 c=mix(horizon,zenith,smoothstep(.0,.42,h));float westGlow=exp(-pow((d.x+.43)*2.4,2.0))*exp(-h*2.2);c=mix(c,vec3(1.0,.49,.27),westGlow*.56);c=mix(c,vec3(1.0,.67,.42),cloud*.90);vec3 sunDir=normalize(vec3(-.36,.21,-.93));float sd=dot(d,sunDir);float halo=exp((sd-1.0)*70.0);float disk=smoothstep(.99935,.99978,sd);c=mix(c,vec3(1.0,.89,.64),clamp(halo*.66+disk,0.0,1.0));c=mix(c,vec3(.94,.76,.57),exp(-h*3.6)*.18);gl_FragColor=vec4(pow(c,vec3(2.2)),1.0);}'});
const skyMesh=new T.Mesh(skyG,skyM);skyMesh.renderOrder=-10;scene.add(skyMesh);geometries.add(skyG);materials.push(skyM)
const bounceMats=new Set(['red','redlight','wood','dark','gold','oldgold','wall','joinerygilt','hardwarebrass','hardwareRecess'].map(k=>mats[k]));
let instances=0,triangles=0;for(const {g,m,items} of buckets.values()){const mesh=new T.InstancedMesh(g,m,items.length);for(let i=0;i<items.length;i++){mesh.setMatrixAt(i,items[i].matrix);mesh.setColorAt(i,new T.Color().setScalar(items[i].tint));}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;if(g===leafG)mesh.castShadow=true;mesh.frustumCulled=true;if(bounceMats.has(m))mesh.layers.enable(1);scene.add(mesh);instances+=items.length;triangles+=(g.index?.count??g.attributes.position.count)/3*items.length;}
scene.add(new T.HemisphereLight('#d9e4f0','#9d7651',1.16));scene.add(new T.AmbientLight('#d7b98f',.10));const porchBounce=new T.DirectionalLight('#ffdcac',.34);porchBounce.position.set(7,6,16);scene.add(porchBounce);const eaveBounce=new T.DirectionalLight('#ffc780',.85);eaveBounce.layers.set(1);eaveBounce.position.set(4,1.8,5);eaveBounce.target.position.set(-4,9,-10);scene.add(eaveBounce,eaveBounce.target);const sun=new T.DirectionalLight('#ffd093',5.1);sun.position.set(-30,22,18);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);sun.shadow.radius=2.4;Object.assign(sun.shadow.camera,{left:-27,right:27,top:33,bottom:-18,near:1,far:90});sun.shadow.bias=-.00014;sun.shadow.normalBias=.035;sun.target.position.set(0,4,-7);scene.add(sun,sun.target);const fill=new T.DirectionalLight('#f0d0a0',.34);fill.position.set(-10,14,-18);scene.add(fill);
return {scene,setTime(time){void time;},stats:{instances,triangles,roles,seed:80247,rngFinalState:seed,revision:'scene08-reflective-river-rock-garden-20261020e',externalAssets:false,proceduralPlaqueGeometry:true,description:'Raised hall on a thin grounded floor, diagonal bridge over a reflective meander, planted rock banks and left garden island, slim near veranda edge.'},dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();stream.dispose();}};
}
