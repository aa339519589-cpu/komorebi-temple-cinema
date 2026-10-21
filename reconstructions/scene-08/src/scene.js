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
float mineral=sin(vMineral.x*19.+sin(vMineral.z*13.)*2.)*sin(vMineral.y*23.+vMineral.z*11.);float vein=pow(max(0.,sin(vMineral.y*14.+vMineral.x*3.+sin(vMineral.z*8.)*.7)),12.);diffuseColor.rgb*=.84+.18*mineral-.15*vein;`);};material('bark','#554735',.98);material('leaf','#385b2e',.73);material('leaflight','#708b43',.70);material('maple','#a2473a',.90);material('flower','#e28c91',.84);material('paper','#e9c985',.8);material('lanternamber','#d6a04e',.82);mats.lanternamber.emissive=new T.Color('#d58b2b');mats.lanternamber.emissiveIntensity=.35;mats.paper.emissive=new T.Color('#f7aa34');mats.paper.emissiveIntensity=.28;
material('joinerygilt','#8d682d',.55,.73);material('hardwarebrass','#a67c36',.49,.84);material('hardwareRecess','#69502c',.57,.80);material('gallerytile','#526b8a',.46,.025);material('tileEnd','#172c41',.84,.015);mats.tileedge.color.set('#263e5b');mats.tile.color.set('#2f4867');
// Procedural mineral/bark detail; the namespaced CC0 timber scan is installed below.
function texture(kind){const n=128,d=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const p=(y*n+x)*4,h=(()=>{const q=Math.sin((x+17.3)*(y+41.7)*12.9898)*43758.5453;return q-Math.floor(q);})(),warp=x+3.4*Math.sin(y*.055)+1.1*Math.sin(y*.17+x*.025),grain=Math.sin(warp*.46)+.42*Math.sin(warp*1.91+y*.08)+.18*Math.sin(warp*5.7+y*.22),broad=Math.sin(x*.07+Math.sin(y*.031)*2.0),q=kind==='wood'?.84+.052*grain+.024*broad+.018*(h-.5):kind==='plaster'?.91+.06*(h-.5)+.014*Math.sin(x*.22+y*.12):.73+.22*(h-.5)+.035*Math.sin(x*.4+Math.sin(y*.13)*2.);const r=T.MathUtils.clamp(q,0,1),g=T.MathUtils.clamp(q*(kind==='wood'?.96:1),0,1),b=T.MathUtils.clamp(q*(kind==='wood'?.89:1),0,1);d[p]=255*r;d[p+1]=255*g;d[p+2]=255*b;d[p+3]=255;random();}const t=new T.DataTexture(d,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;textures.push(t);return t;}
const envW=256,envH=128,envData=new Uint8Array(envW*envH*4),fract=x=>x-Math.floor(x),hash2=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453),noise2=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=hash2(ix,iy),b=hash2(ix+1,iy),c=hash2(ix,iy+1),d=hash2(ix+1,iy+1);return(a+(b-a)*sx)+((c+(d-c)*sx)-(a+(b-a)*sx))*sy;},envSmooth=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};for(let ey=0;ey<envH;ey++)for(let ex=0;ex<envW;ex++){const u=ex/(envW-1),v=ey/(envH-1),q=(ey*envW+ex)*4,upper=v<.5,t=upper?v*2:(v-.5)*2,top=[.25,.48,.80],horizon=[.70,.82,.94],ground=[.12,.14,.08],base=upper?top.map((c,k)=>c+(horizon[k]-c)*t):horizon.map((c,k)=>c+(ground[k]-c)*t);let n=0,a=.53,x=u*9,y=v*7;for(let octave=0;octave<5;octave++){n+=a*noise2(x,y);x=x*2.02+13.1;y=y*2.02+7.7;a*=.48;}const du=Math.min(Math.abs(u-.81),1-Math.abs(u-.81)),sunHalo=Math.exp(-Math.pow(du/.095,2)-Math.pow((v-.445)/.075,2)),sunDisk=Math.exp(-Math.pow(du/.010,2)-Math.pow((v-.445)/.014,2)),cloud=envSmooth(.49,.66,n)*envSmooth(.06,.44,v)*(1-envSmooth(.77,.98,v)),west= Math.exp(-Math.pow(du/.23,2))*Math.exp(-Math.pow((v-.48)/.20,2)),cloudTint=[1.0,.98,.94],out=[];for(let k=0;k<3;k++){let c=base[k];c+=(cloudTint[k]-c)*cloud*.62;c+=(k===0?1:k===1?.62:.28)*sunHalo*.42;c+=(k===0?1:k===1?.88:.64)*sunDisk;c+=(k===0?1:k===1?.55:.33)*west*.04;out.push(Math.round(T.MathUtils.clamp(c,0,1)*255));}envData[q]=out[0];envData[q+1]=out[1];envData[q+2]=out[2];envData[q+3]=255;}const env=new T.DataTexture(envData,envW,envH);env.mapping=T.EquirectangularReflectionMapping;env.colorSpace=T.SRGBColorSpace;env.needsUpdate=true;textures.push(env);scene.environment=env;scene.environmentIntensity=.58;
const wood=texture('wood'),stone=texture('stone');mats.wall.map=texture('plaster');mats.moss.map=stone;mats.bark.map=wood;mats.bark.bumpMap=stone;mats.bark.bumpScale=.055;for(const n of ['red','redlight','wood','dark']){mats[n].map=wood;mats[n].bumpMap=wood;mats[n].bumpScale=.012;}for(const n of ['rock','tile']){mats[n].map=stone;mats[n].bumpMap=stone;mats[n].bumpScale=.025;}mats.stone.map=null;mats.stone.bumpMap=null;mats.stone.color.set('#85857a');mats.stone.roughness=.94;
// Declared CC0 PBR scans add surface-scale grain to authored geometry. They
// contain neither the reference photograph nor a replacement scene image.
const loader=new T.TextureLoader(),assetUrl=p=>new URL('../assets/'+p,import.meta.url).href;
const [timberColor,timberNormal,timberRough,graniteColor,graniteNormal,graniteRough]=await Promise.all([
 'timber/diffuse-2k.jpg','timber/normal-gl-2k.png','timber/roughness-2k.jpg',
 'granite/granite-face-diff.png','granite/granite-face-nor_gl.png','granite/granite-face-rough.png'
].map(p=>loader.loadAsync(assetUrl(p))));
for(const t of[timberColor,timberNormal,timberRough,graniteColor,graniteNormal,graniteRough]){t.wrapS=t.wrapT=T.MirroredRepeatWrapping;t.anisotropy=8;textures.push(t);}
timberColor.colorSpace=graniteColor.colorSpace=T.SRGBColorSpace;
// The source is a lacquer scan. Its raw low roughness would make the painted
// structure mirror-like; preserve its variation inside a weathered range.
{const canvas=document.createElement('canvas');canvas.width=timberRough.image.width;canvas.height=timberRough.image.height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(timberRough.image,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height);for(let i=0;i<pixels.data.length;i+=4){const q=173+Math.round(pixels.data[i+1]*.30);pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=q;}c.putImageData(pixels,0,0);timberRough.image=canvas;timberRough.needsUpdate=true;}
for(const name of['red','redlight','wood','dark']){mats[name].bumpMap=null;mats[name].normalMap=timberNormal;mats[name].normalScale=new T.Vector2(.055,.055);mats[name].roughnessMap=timberRough;mats[name].roughness=name==='dark'?.92:name==='wood'?.78:.66;}
mats.wood.map=timberColor;mats.wood.color.set('#b48b63');
for(const t of[graniteColor,graniteNormal,graniteRough])t.repeat.set(2,1.5);
mats.rock.map=graniteColor;mats.rock.bumpMap=null;mats.rock.normalMap=graniteNormal;mats.rock.normalScale=new T.Vector2(.30,.30);mats.rock.roughnessMap=graniteRough;mats.rock.color.set('#a2a6a0');
const carvedGranite=[graniteColor,graniteNormal,graniteRough].map(t=>{const c=t.clone();c.repeat.set(1.5,3);textures.push(c);return c;});
const boxG=new T.BoxGeometry(1,1,1),cylG=new T.CylinderGeometry(1,1,1,12),ballG=new T.SphereGeometry(1,8,6),torusG=new T.TorusGeometry(1,.12,5,16),leafG=new T.BufferGeometry();{const pos=[];for(let i=0;i<6;i++){const a=i/6,b=(i+1)/6,wa=Math.sin(a*Math.PI)*.34,wb=Math.sin(b*Math.PI)*.34,ya=Math.sin(a*Math.PI)*.11,yb=Math.sin(b*Math.PI)*.11;for(const side of[-1,1])for(const p of[[0,ya,a],[side*wa,ya*.2,a],[side*wb,yb*.2,b],[0,ya,a],[side*wb,yb*.2,b],[0,yb,b]])pos.push(...p);}leafG.setAttribute('position',new T.Float32BufferAttribute(pos,3));leafG.computeVertexNormals();}mats.leaf.side=mats.leaflight.side=mats.maple.side=mats.flower.side=T.DoubleSide;
{
 const p=leafG.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)/.68+.5,p.getZ(i));leafG.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 const n=128,h=256,data=new Uint8Array(n*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<n;x++){
  const u=x/(n-1)*2-1,v=y/(h-1),rib=Math.exp(-u*u/.0018),vein=Math.exp(-Math.pow(Math.sin((v*7.0+Math.abs(u)*1.6)*Math.PI)*16,2)),shade=.89+.055*rib+.035*vein+.014*Math.sin(v*29+u*3),q=(y*n+x)*4;
  data[q]=data[q+1]=data[q+2]=Math.round(shade*255);data[q+3]=255;
 }
 const leafTexture=new T.DataTexture(data,n,h);leafTexture.colorSpace=T.SRGBColorSpace;leafTexture.needsUpdate=true;textures.push(leafTexture);
 for(const ma of[mats.leaf,mats.leaflight,mats.maple]){ma.map=leafTexture;ma.bumpMap=leafTexture;ma.bumpScale=.0006;}
}

const galleryJoinery=createGalleryCurvedJoinery(),clayCoverG=createClayCoverTile();for(const g of galleryJoinery.resources)geometries.add(g);mats.gallerytile.map=stone;mats.gallerytile.bumpMap=stone;mats.gallerytile.bumpScale=.005;
mats.leaf.color.set('#3b4d1f');mats.leaflight.color.set('#667632');mats.leaf.roughness=.46;mats.leaflight.roughness=.49;
material('pine','#2e512b',.82);const needleG=new T.BufferGeometry(),needleP=[];for(let k=0;k<9;k++){const a=k*2.39996,dx=Math.cos(a),dz=Math.sin(a),p=[[0,0,0],[dx*.027,.11,dz*.027],[dx*.09,.23,dz*.09]];for(let j=0;j<2;j++){const aa=p[j],bb=p[j+1],ww=.016*(1-j*.45);needleP.push(aa[0]-dz*ww,aa[1],aa[2]+dx*ww,aa[0]+dz*ww,aa[1],aa[2]-dx*ww,...bb);}}needleG.setAttribute('position',new T.Float32BufferAttribute(needleP,3));needleG.computeVertexNormals();mats.pine.side=T.DoubleSide;
const v=a=>new T.Vector3(...a);
function emit(g,ma,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=[0,0,0],tint=1){const m=typeof ma==='string'?mats[ma]:ma,key=g.uuid+m.uuid;let b=buckets.get(key);if(!b)buckets.set(key,b={g,m,items:[]});const matrix=new T.Matrix4().compose(v([x,y,z]),new T.Quaternion().setFromEuler(new T.Euler(...rot)),v([sx,sy,sz])).premultiply(stack.at(-1));b.items.push({matrix,tint});geometries.add(g);roles[role]=(roles[role]||0)+1;}
const bevels=new Map();function bevelBox(w,h,d){const key=[w,h,d].join(',');if(bevels.has(key))return bevels.get(key);const geo=new T.BoxGeometry(w,h,d,3,3,3),p=geo.attributes.position,n=geo.attributes.normal,r=Math.min(.028,Math.min(w,h,d)*.13),half=[w/2-r,h/2-r,d/2-r];for(let i=0;i<p.count;i++){const point=new T.Vector3(p.getX(i),p.getY(i),p.getZ(i)),core=point.clone();core.x=T.MathUtils.clamp(core.x,-half[0],half[0]);core.y=T.MathUtils.clamp(core.y,-half[1],half[1]);core.z=T.MathUtils.clamp(core.z,-half[2],half[2]);const normal=point.clone().sub(core).normalize();point.copy(core).addScaledVector(normal,r);p.setXYZ(i,point.x,point.y,point.z);n.setXYZ(i,normal.x,normal.y,normal.z);}const dims=[w,h,d],longest=dims.indexOf(Math.max(...dims)),uv2=[];
for(let i=0;i<p.count;i++){
 const coords=[p.getX(i),p.getY(i),p.getZ(i)],nn=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],face=nn.indexOf(Math.max(...nn)),along=longest===face?(face+1)%3:longest,across=[0,1,2].find(k=>k!==face&&k!==along);
 uv2.push(coords[along],coords[across]);
}
geo.setAttribute('uv',new T.Float32BufferAttribute(uv2,2));bevels.set(key,geo);return geo;}const bevelRoles=new Set(['foreground-veranda','left-grand-hall','layered-walkways','main-hall-sanctum','five-tier-pagoda','arched-stream-bridge','gallery-stone-stair']);const box=(x,y,z,w,h,d,ma='red',yaw=0)=>bevelRoles.has(role)?emit(bevelBox(w,h,d),ma,x,y,z,1,1,1,[0,yaw,0]):emit(boxG,ma,x,y,z,w,h,d,[0,yaw,0]);
function group(x,y,z,yaw,fn,scale=1){stack.push(stack.at(-1).clone().multiply(new T.Matrix4().compose(v([x,y,z]),new T.Quaternion().setFromAxisAngle(v([0,1,0]),yaw),v(Array.isArray(scale)?scale:[scale,scale,scale]))));fn();stack.pop();}
function between(a,b,r,ma='red',round=false,depth=r){const av=v(a),bv=v(b),delta=bv.clone().sub(av),m=new T.Matrix4().compose(av.add(bv).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(v([0,1,0]),delta.clone().normalize()),v([r,delta.length(),depth])).premultiply(stack.at(-1)),g=round?cylG:boxG,key=g.uuid+mats[ma].uuid;let bucket=buckets.get(key);if(!bucket)buckets.set(key,bucket={g,m:mats[ma],items:[]});bucket.items.push({matrix:m,tint:1});geometries.add(g);roles[role]=(roles[role]||0)+1;}
function line(points,r,ma='gold'){const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v)),Math.max(6,points.length*3),r,5,false);emit(g,ma);}
function rosette(x,y,z,r=.13){emit(torusG,'oldgold',x,y,z,r,r,r);for(let i=0;i<8;i++){const a=i*Math.PI/4;emit(ballG,'gold',x+Math.cos(a)*r*.65,y+Math.sin(a)*r*.65,z+.015,r*.25,r*.14,r*.12,[0,0,a]);}emit(ballG,'gold',x,y,z+.025,r*.29,r*.29,r*.14);}
function plaque(x,y,z,w,h){for(const p of createGatePlaque(w,h))emit(p.geometry,p.material,x,y,z);}
const columnShapes=new Map();
function column(x,z,y,h,r=.20){emit(cylG,role==='left-grand-hall'?'hallFoundation':'stone',x,y+.10,z,r*1.37,.20,r*1.37);const key=r+','+h;let shaft=columnShapes.get(key);
if(!shaft){shaft=new T.CylinderGeometry(r,r,h,24);const uv=shaft.attributes.uv;for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);uv.setXY(i,v*h,u*Math.PI*2*r);}columnShapes.set(key,shaft);}
emit(shaft,'red',x,y+h/2+.2,z);for(const yy of[y+.24,y+h-.03])emit(cylG,'oldgold',x,yy,z,r*1.04,.075,r*1.04);for(let k=0;k<3;k++)box(x,y+h-.08+k*.04,z+r*.99,r*1.4,.045,.035,'gold');if(role==='left-grand-hall'&&h>3.0)for(const f of[.28,.65,.88])rosette(x,y+h*f,z+r*1.02,r*.32);}
const corbelShape=new T.Shape();corbelShape.moveTo(-.5,.13);corbelShape.lineTo(-.5,.27);corbelShape.quadraticCurveTo(-.38,.28,-.32,.18);corbelShape.lineTo(-.19,.18);corbelShape.quadraticCurveTo(-.16,-.02,0,-.035);corbelShape.quadraticCurveTo(.16,-.02,.19,.18);corbelShape.lineTo(.32,.18);corbelShape.quadraticCurveTo(.38,.28,.5,.27);corbelShape.lineTo(.5,.13);corbelShape.quadraticCurveTo(.36,.05,.30,-.04);corbelShape.quadraticCurveTo(.15,-.13,0,-.14);corbelShape.quadraticCurveTo(-.15,-.13,-.30,-.04);corbelShape.quadraticCurveTo(-.36,.05,-.5,.13);const corbelG=new T.ExtrudeGeometry(corbelShape,{depth:1,steps:1,curveSegments:5,bevelEnabled:true,bevelThickness:.025,bevelSize:.018,bevelSegments:1});corbelG.translate(0,0,-.5);
function brackets(x,y,z,s=.8){if(role==='left-grand-hall'){for(const p of galleryJoinery.parts)emit(p.geometry,p.material,x,y,z,s,s,s);return;}for(let level=0;level<3;level++){const off=level*.15*s;for(const dir of[0,1]){const span=(.70+level*.17)*s;emit(corbelG,'red',x,y+off,z,span,.52*s,.15*s,[0,dir*Math.PI/2,0]);for(const sign of[-1,1]){const dx=dir?0:sign*(.22+level*.09)*s,dz=dir?sign*(.22+level*.09)*s:0;box(x+dx,y+off-.07*s,z+dz,.14*s,.17*s,.14*s,'wood');if(level===2)box(x+dx,y+off+.06*s,z+dz,.13*s,.045*s,.13*s,'oldgold');}}}box(x,y+.53*s,z,1.48*s,.12*s,.34*s,'wood');box(x,y+.59*s,z+.18*s,.08*s,.05*s,.035*s,'gold');}
function ceramicTile(a,b,r=.077,tint=1){
 const av=v(a),bv=v(b),tangent=bv.clone().sub(av).normalize(),across=new T.Vector3().crossVectors(v([0,1,0]),tangent).normalize(),up=new T.Vector3().crossVectors(tangent,across).normalize();
 const basis=new T.Matrix4().makeBasis(across,up,tangent),rotation=new T.Euler().setFromRotationMatrix(basis),center=av.clone().add(bv).multiplyScalar(.5);
 emit(clayCoverG,'gallerytile',center.x,center.y,center.z,r,r,av.distanceTo(bv),[rotation.x,rotation.y,rotation.z],tint);
}
const tileEndG=new T.CylinderGeometry(1,1,1,24);
function eaveTileEnd(p,side){
 const yaw=side===0?0:side===1?Math.PI/2:side===2?Math.PI:-Math.PI/2;
 group(...p,yaw,()=>{
  emit(tileEndG,'tileEnd',0,0,0,.102,.075,.102,[Math.PI/2,0,0]);
  emit(torusG,'tileedge',0,0,.043,.094,.094,.094);
  if(role==='left-grand-hall'){
   emit(torusG,'tileedge',0,0,.047,.062,.062,.062);
   for(let k=0;k<8;k++){
    const a=k*Math.PI/4;
    emit(ballG,'tileedge',Math.sin(a)*.040,Math.cos(a)*.040,.047,.012,.026,.007,[0,0,-a]);
   }
   emit(ballG,'tileedge',0,0,.051,.019,.019,.008);
  }
 });
}
// Four continuously meeting hip panels, individually curved ceramic rolls,
// deep curved timber rafters, edge discs and gilded fittings.
function roof(w,d,eave,rise,curl=.65,ridgeRatio=.22,hornHeight=.52){const hw=w/2,hd=d/2,rh=w*ridgeRatio;
function P(side,t,u){const span=rh+(hw-rh)*t;let x=side%2?(side===1?1:-1)*span:u*span,z=side%2?u*hd*t:(side===0?1:-1)*hd*t;return [x,eave+rise*Math.pow(Math.max(0,1-t),1.65)+curl*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),7)),z];}
for(let side=0;side<4;side++){const pp=[],uv=[],tri=(a,b,c)=>{for(const p of[a,b,c]){pp.push(...p);uv.push(p[0],p[2]);}};for(let j=0;j<18;j++)for(let i=0;i<36;i++){const a=P(side,j/18,-1+2*i/36),b=P(side,(j+1)/18,-1+2*i/36),c=P(side,j/18,-1+2*(i+1)/36),d=P(side,(j+1)/18,-1+2*(i+1)/36);if(side%2===0){tri(a,b,c);tri(b,d,c);}else{tri(a,c,b);tri(b,c,d);}}
const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();mats.tile.side=T.DoubleSide;emit(g,'tile');const underside=g.clone(),up=underside.attributes.position;for(let k=0;k<up.count;k++)up.setY(k,up.getY(k)-.14);underside.computeVertexNormals();mats.wood.side=T.DoubleSide;emit(underside,role==='left-grand-hall'?'red':'wood');
const n=Math.ceil((side%2?d:w)/.24);for(let i=0;i<=n;i++){const u=-1+2*i/n,p=P(side,1,u);for(let j=0;j<14;j++){const a=P(side,j/14,u),b=P(side,Math.min(1,(j+(role==='left-grand-hall'?1.055:.96))/14),u);a[1]+=.020;b[1]+=.020;if(role==='left-grand-hall')ceramicTile(a,b,.077,.94+.055*Math.sin(i*1.33+j*2.71+side*.81));else{a[1]+=.025;b[1]+=.025;between(a,b,.085,'tileedge',true);}}const discRot=side%2?[0,0,Math.PI/2]:[Math.PI/2,0,0];eaveTileEnd(p,side);if(i%2===0){if(role==='left-grand-hall'){const path=Array.from({length:15},(_,j)=>{const q=P(side,j/14,u);q[1]-=.26;return q;});emit(createContinuousTimber(path,.075,.12,.009),'red');const tail=Array.from({length:6},(_,j)=>{const q=P(side,.72+j*.29/5,u);q[1]-=.18;return q;});emit(createContinuousTimber(tail,.09,.12,.009),'wood');emit(bevelBox(.070,.095,.025),'joinerygilt',p[0],p[1]-.18,p[2]);}else{for(let rj=0;rj<9;rj++){const ra=P(side,rj/9,u),rb=P(side,(rj+1)/9,u);ra[1]-=.26;rb[1]-=.26;between(ra,rb,.075,'redlight',false,.12);}let q=P(side,.72,u);const qq=P(side,1.01,u);q[1]-=.18;qq[1]-=.18;between(q,qq,.09,'wood',false,.12);emit(boxG,'gold',p[0],p[1]-.18,p[2],.07,.095,.07);}}}
for(let i=0;i<36;i++){const a=P(side,1,-1+2*i/36),b=P(side,1,-1+2*(i+1)/36);for(const dy of[-.12,-.25]){a[1]+=dy;b[1]+=dy;between(a,b,dy===-.12?.115:.052,dy===-.12?'wood':'red');a[1]-=dy;b[1]-=dy;}}
for(const u of [-1,1]){const pts=Array.from({length:17},(_,i)=>P(side,i/16,u).map((q,k)=>q+(k===1?.10:0)));line(pts,.095,'tileedge');const tip=P(side,1,u);line([tip,[tip[0]*1.035,tip[1]+hornHeight*.58,tip[2]*1.035],[tip[0]*1.04,tip[1]+hornHeight,tip[2]*1.04]],.09,'tileedge');}}
box(0,eave+rise+.07,0,rh*2+.3,.19,.25,'tileedge');if(ridgeRatio>.1)for(const sx of[-1,1])line([[sx*rh,eave+rise,0],[sx*(rh+.13),eave+rise+.34,0],[sx*(rh+.18),eave+rise+.55,0]],.095,'tileedge');}
// A curved tiled gable is an actual bonnet in front of the hip roof. Its
// stepped timber infill, bargeboards and ceramic rolls share the curved crown.
function curvedGable(cx,z,eave,width=4.0,rise=1.5,depth=2.2,closeFace=true,ornate=true){
 const profile=u=>eave+rise*Math.exp(-3.4*u*u)+.24*Math.pow(Math.abs(u),10);
 const P=(u,t)=>[cx+u*width/2,profile(u)-.33*rise*Math.exp(-3.4*u*u)*t+.58*t,z-depth*t];
 const pp=[],uv=[];for(let j=0;j<16;j++)for(let i=0;i<64;i++){
  const a=P(-1+2*i/64,j/16),b=P(-1+2*(i+1)/64,j/16),c=P(-1+2*i/64,(j+1)/16),d=P(-1+2*(i+1)/64,(j+1)/16);
  for(const v of[a,c,b,b,c,d]){pp.push(...v);uv.push(v[0],v[2]);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();emit(g,'tile');
 if(closeFace){const panel=new T.Shape();panel.moveTo(cx-width/2,eave-.04);for(let i=0;i<=64;i++){const u=-1+2*i/64;panel.lineTo(cx+u*width/2,profile(u)-.16);}panel.lineTo(cx+width/2,eave-.04);panel.closePath();const pg=new T.ExtrudeGeometry(panel,{depth:.13,steps:1,bevelEnabled:true,bevelThickness:.025,bevelSize:.02,bevelSegments:2});emit(pg,'wood',0,0,z-.10);}
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
 if(ornate){rosette(cx,eave+.57,z+.12,.19);for(const sign of[-1,1])line([[cx+sign*.2,eave+.55,z+.13],[cx+sign*.46,eave+.43,z+.13],[cx+sign*.68,eave+.55,z+.13],[cx+sign*.92,eave+.28,z+.13]],.035,'oldgold');}
}
function lattice(x,y,z,w,h){box(x,y,z,w,h,.09,'dark');for(let i=0;i<=Math.ceil(w/.14);i++)box(x-w/2+i*w/Math.ceil(w/.14),y,z+.065,.028,h,.03,'dark');for(let i=0;i<=Math.ceil(h/.19);i++)box(x,y-h/2+i*h/Math.ceil(h/.19),z+.08,w,.028,.03,'wood');for(const sx of[-1,1])box(x+sx*w/2,y,z+.10,.09,h+.12,.13,'red');}
function hall(w,d,h,{raised=.5,walls=true,lanterns=true,roofRise=Math.min(w,d)*.26,buildRoof=true,roofEaveDrop=0,roofCurl=.65,roofHorn=.52,frontHeight=h*.63,frontCenter=raised+h*.42,frontOpening=false}={}){if(role==='left-grand-hall'){box(0,raised-.12,0,w*.9,.24,d*.62,'hallFoundation');}else box(0,raised/2,0,w*.9,raised,d*.86,'stone');box(0,raised+.06,0,w*.88,.12,role==='left-grand-hall'?d*.62:d*.89,role==='left-grand-hall'?'dark':'stone');const front=d*.37;
for(const z of[-front,front]){if(role==='left-grand-hall'&&raised>2)for(let x=-w*.36;x<=w*.37;x+=w*.18)column(x,z,0,raised-.25,.13);for(let x=-w*.36;x<=w*.37;x+=w*.18){if(frontOpening&&z>0&&Math.abs(x)<w*.28)continue;column(x,z,raised,h-.85,.18);brackets(x,h+raised-.7,z,.78);}box(0,h+raised-.12,z,w*.88,.29,.33,'red');box(0,h+raised-.52,z,w*.86,.20,.26,'red');for(let i=0;i<Math.ceil(w/.27);i++)box(-w*.44+i*.27,h+raised-.42,z+.19,.09,.1,.05,'gold');}
for(const x of[-w*.36,w*.36])for(const z of[-d*.18,0,d*.18]){if(role==='left-grand-hall'&&raised>2)column(x,z,0,raised-.25,.13);column(x,z,raised,h-.85,.18);brackets(x,h+raised-.7,z,.78);}
if(walls){if(role==='left-grand-hall'){
 // Each long return is framed as eight narrow timber bays. Small plaster
 // spandrels stop at the sill and lintel; the dark lattice panels sit in the
 // openings instead of floating over one continuous cream wall slab.
 const sideStart=-d*.36,sideSpan=d*.72,sidePitch=sideSpan/8;
 for(const sign of[-1,1]){
  const xx=sign*w*.36;
  for(let i=0;i<8;i++){
   const zz=sideStart+(i+.5)*sidePitch,bayW=sidePitch*.74;
   group(xx-sign*.17,0,zz,sign*Math.PI/2,()=>{
    box(0,raised+.53,0,bayW,.24,.12,'wall');
    lattice(0,raised+2.10,0,bayW*.64,1.95);
    box(0,raised+3.47,0,bayW,.30,.12,'wall');
   });
   group(xx+sign*.15,h+raised-.72,zz,sign*Math.PI/2,()=>brackets(0,0,0,.39));
  }
  for(const yy of[raised+.22,raised+1.08,raised+3.15,raised+h*.65,raised+h*.80])box(xx+sign*.11,yy,0,.22,.16,d*.76,'red');
  for(let j=0;j<=8;j++){
   const zz=sideStart+j*sidePitch;
   box(xx+sign*.11,raised+h*.48,zz,.22,h*.92,.20,'red');
  }
 }
 // A shadowed, timber-gridded inner return gives the front lattice real depth
 // and removes the broad pale wall that showed through every open bay.
 box(0,raised+2.20,-front,w*.72,4.40,.14,'wood');
 for(const x of[-w*.36,-w*.18,0,w*.18,w*.36])box(x,raised+2.20,-front+.12,.14,4.20,.18,'red');
 for(const yy of[raised+.34,raised+1.12,raised+3.47,raised+4.16])box(0,yy,-front+.13,w*.72,.14,.18,'red');
 // Four measured facade bays keep the existing post rhythm but shrink the
 // bright infill to low spandrels around recessed, dark timber screens.
 const facadeXs=[-w*.27,-w*.09,w*.09,w*.27],facadeBay=w*.18;
 for(const x of facadeXs){
  box(x,raised+.52,front-.32,facadeBay*.78,.24,.12,'wall');
  lattice(x,raised+2.55,front-.28,facadeBay*.64,2.30);
  box(x,raised+3.85,front-.32,facadeBay*.78,.28,.12,'wall');
 }
 for(const yy of[raised+1.29,raised+3.70,raised+4.65])box(0,yy,front-.03,w*.76,.13,.18,'red');
}else{
 for(const sign of[-1,1]){const xx=sign*w*.36,sideWallH=h*.79,sideWallY=raised+h*.42;box(xx,sideWallY,0,.14,sideWallH,d*.73,'wall');const sideWindowH=Math.min(4.4,h*.59);for(const zz of[-d*.27,-d*.09,d*.09,d*.27])group(xx+sign*.09,0,zz,sign*Math.PI/2,()=>lattice(0,raised+sideWindowH/2+.25,.0,d*.14,sideWindowH));for(const yy of[raised+.22,raised+h*.65,raised+h*.80])box(xx+sign*.11,yy,0,.22,.21,d*.76,'red');for(let j=0;j<=8;j++){const zz=-d*.36+j*d*.09;box(xx+sign*.11,raised+h*.48,zz,.22,h*.92,.20,'red');if(h>7)brackets(xx+sign*.15,h+raised-.75,zz,.76);}}
 box(0,raised+h*.48,-front,w*.75,h*.87,.16,'wall');box(-w*.36,raised+h*.48,0,.12,h*.87,d*.72,'wall');
 for(const x of[-w*.27,-w*.09,w*.09,w*.27]){lattice(x,frontCenter,front-.22,w*.14,frontHeight);box(x,raised+h*.84,front-.1,w*.14,h*.13,.12,'wall');}
 for(const y of[raised+.2,raised+h*.74])box(0,y,front-.12,w*.76,.18,.19,'red');
}}
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
 const {w,zMin,zMax,lowY,highY}=wingFrame,span=zMax-zMin;
 roof(w+1.0,span+1.0,lowY,1.48,.54,.14,.24);
 const ledgerX=-w/2+.10,ledgerY=lowY-.24;
 box(ledgerX,ledgerY,(zMin+zMax)/2,.18,.25,span+.12,'wood');
 for(const z of wingFrame.postZ){
  column(ledgerX,z,.50,ledgerY-.60,.15);
  brackets(ledgerX,ledgerY-.40,z,.44);
  box(0,lowY-.10,z,w*.98,.16,.20,'wood');
 }
 for(const side of[-1,1]){
  const x=side*w/2;
  for(const y of[lowY-.12,lowY-.39])box(x,y,0,.19,.17,span+.10,'red');
 }
 // Keep the far porch return open: only short infill bands sit behind its
 // post line, while dark framed lattice doors occupy the sheltered bays.
 const wallZ=zMin-.08,bottom=.50,bounds=[-w/2+.08,0,w/2-.08],topAt=x=>lowY-.16;
 for(let b=0;b<2;b++){
  const x0=bounds[b],x1=bounds[b+1],xc=(x0+x1)/2,bayW=x1-x0,windowW=.88,windowBottom=.80,windowTop=Math.max(1.05,topAt(xc)-.42);
  box(xc,.83,wallZ+.05,bayW-.10,.26,.12,'wall');
  box(xc,topAt(xc)-.30,wallZ+.05,bayW-.10,.24,.12,'wall');
  lattice(xc,(windowBottom+windowTop)/2,wallZ+.12,windowW,windowTop-windowBottom);
  for(const y of[windowBottom,windowTop])box(xc,y,wallZ+.16,windowW+.16,.12,.18,'red');
  for(const x of(b===0?[x0,x1]:[x1])){const top=topAt(x);box(x,(bottom+top)/2,wallZ+.10,.16,top-bottom,.19,'red');}
 }
 box(0,.66,wallZ+.10,w*.96,.16,.20,'red');
}

// The reference hall is broad across the image: its short right return
// recedes behind a deep bracket cornice. A two-storey-height rectangular
// screen wall and a reversed roof azimuth had hidden this load path before.
// These coordinates are the physical timber frame, not a camera-space mesh.
const grandFrame={x:-4.30,z:-7.50,yaw:-.28,w:9,d:6,floor:4.40,lintel:8.15,eave:10.15,rise:3.50};
function monumentalHall(){
 const original={red:mats.red,redlight:mats.redlight,wood:mats.wood,dark:mats.dark};
 for(const [name,color]of Object.entries({red:'#8b4324',redlight:'#9d5226',wood:'#4e2919',dark:'#211b15'})){
  const m=mats[name].clone();m.name='grand-hall-'+name;m.color.set(color);materials.push(m);mats[name]=m;
 }
 const {w,d,floor,lintel,eave,rise}=grandFrame,bw=4.60,bd=3.20,front=bd/2,postXs=[-2.30,-1.15,0,1.15,2.30];
 // Closed deck and stone/timber supports remain rooted in the garden bed.
 box(0,floor-.20,0,bw+.50,.28,bd+.46,'hallFoundation');
 box(0,floor-.035,0,bw+.42,.10,bd+.38,'wood');
 for(let j=0;j<27;j++)box(-2.46+j*.19,floor+.026,0,.18,.025,bd+.27,'wood');
 for(const z of[-front,front])for(const x of postXs){
  box(x,(floor-.06)/2,z,.38,floor-.06,.38,'hallFoundation');box(x,floor-.16,z,.62,.22,.62,'stone');
  column(x,z,floor,lintel-floor-.10,.225);
 }
 for(const x of[-bw/2,bw/2])for(const z of[-.63,.63]){
  box(x,(floor-.06)/2,z,.34,floor-.06,.34,'hallFoundation');column(x,z,floor,lintel-floor-.10,.205);
 }
 // Dark recessed room screens, separate red jambs and small cream infill.
 // Each bay has an actual timber transom, lintel and deep sheltered recess.
 for(const z of[-front+.22,front-.25])for(let i=0;i<4;i++){
  const x=-1.725+i*1.15;
  box(x,floor+.31,z,.97,.42,.11,'wood');
  lattice(x,floor+1.66,z,.92,2.17);
  box(x,lintel-.30,z,.98,.30,.13,'wall');
  for(const xx of[x-.515,x+.515])box(xx,floor+1.70,z+.055,.095,3.10,.16,'red');
 }
 for(const sign of[-1,1])group(sign*bw/2,0,0,sign*Math.PI/2,()=>{
  for(const z of[-1.05,0,1.05]){
   box(z,floor+.28,-sign*.09,.92,.38,.12,'wood');
   lattice(z,floor+1.66,-sign*.09,.83,2.17);
   box(z,lintel-.29,-sign*.09,.92,.28,.14,'wall');
  }
 });
 // Heavy continuous head beams, with paired lower ties and end fittings.
 for(const z of[-front,front]){
  for(const [yy,hh,depth]of[[floor+.30,.14,.19],[lintel-.58,.18,.28],[lintel-.12,.33,.41],[lintel+.28,.21,.39]]){
   box(0,yy,z,bw+.40,hh,depth,'red');
  }
  for(const x of postXs){rosette(x,lintel-.58,z+Math.sign(z)*.24,.092);rosette(x,lintel-.10,z+Math.sign(z)*.24,.10);}
 }
 for(const x of[-bw/2,bw/2])for(const yy of[lintel-.58,lintel-.12,lintel+.28])box(x,yy,0,.33,.22,bd+.40,'red');
 // Three interlocked spreading bracket stages form a deep, supported
 // cornice. The receiver of each stage touches the next timber ring.
 for(let tier=0;tier<3;tier++){
  const by=lintel+.10+tier*.50,out=tier*.45,s=.52;
  for(const sign of[-1,1]){
   const zz=sign*(front+out);
   const n=4;
   for(let j=0;j<=n;j++)brackets(-bw/2+j*bw/n,by,zz,s);
   box(0,by+.49,zz,bw+.70+out*2,.15,.28,'red');
   box(0,by+.39,zz+sign*.19,bw+.60+out*2,.08,.13,'wood');
   for(let j=0;j<=15;j++){
    const x=-bw*.52+j*bw*1.04/15;
    box(x,by+.46,zz+sign*.17,.075,.095,.08,'joinerygilt');
   }
  }
  for(const sign of[-1,1]){
   const xx=sign*(bw/2+out);
   for(let j=0;j<=2;j++)brackets(xx,by,-front+j*bd/2,s);
   box(xx,by+.49,0,.28,.15,bd+.70+out*2,'red');
  }
 }
 // The ceramic and timber surfaces meet on all four hips; no floating
 // bonnet, extra sheet or decorative front gable is used for the silhouette.
 roof(w,d,eave,rise,.45,.12,.32);
 // Raised ceramic corner seals sit on the hip ends.
 // Their shaded petals and rolled margins articulate the plain hip terminals.
 for(const sx of[-1,1])for(const sz of[-1,1])group(sx*(w/2-.05),eave+.53,sz*(d/2+.035),sz>0?0:Math.PI,()=>{
  emit(tileEndG,'gallerytile',0,0,0,.172,.080,.172,[Math.PI/2,0,0]);
  emit(torusG,'tileedge',0,0,.047,.156,.156,.156);
  emit(torusG,'tileedge',0,0,.054,.111,.111,.111);
  for(let k=0;k<9;k++){const a=k*Math.PI*2/9;emit(ballG,'tileedge',Math.sin(a)*.075,Math.cos(a)*.075,.055,.022,.047,.012,[0,0,-a]);}
  emit(ballG,'tileedge',0,0,.063,.036,.036,.014);
 });
 for(const z of[-2.75,2.75]){
  for(let i=0;i<=36;i++){
   const x=-4.1+i*8.2/36,u=x/4.5,yy=eave+.45*(.22+.78*Math.abs(u)**7)-.37;
   box(x,yy,z,.115,.17,.18,'redlight');
   box(x,yy-.025,z+Math.sign(z)*.075,.083,.11,.025,'joinerygilt');
  }
 }
 for(const x of[-2.10,2.10])lantern(x,lintel-.82,front+.35,.36);
 Object.assign(mats,original);
}
role='left-grand-hall';group(grandFrame.x,0,grandFrame.z,grandFrame.yaw,monumentalHall);
// A lower hipped gallery is connected to the hall's right return. Its high
// ledger bears against that wall and every outer post meets a stone pier.
const wingYaw=.65,wingScale=.90,wingW=4.2,wingHighWorldY=7.50,wingLowWorldY=6.40,wingGroupY=3.50,wingHighY=(wingHighWorldY-wingGroupY)/wingScale,wingLowY=(wingLowWorldY-wingGroupY)/wingScale,wingZMin=-3.0,wingZMax=3.0,wingPostZ=[-2.7,-1.35,0,1.35,2.7];
const wingAnchorX=grandFrame.x+3.2*Math.cos(grandFrame.yaw)-.60*Math.sin(grandFrame.yaw),wingAnchorZ=grandFrame.z-3.2*Math.sin(grandFrame.yaw)-.60*Math.cos(grandFrame.yaw),wingNearX=wingScale*(-wingW/2*Math.cos(wingYaw)+wingZMax*Math.sin(wingYaw)),wingNearZ=wingScale*(wingW/2*Math.sin(wingYaw)+wingZMax*Math.cos(wingYaw)),wingX=wingAnchorX-wingNearX,wingZ=wingAnchorZ-wingNearZ,wingFrame={x:wingX,y:wingGroupY,z:wingZ,yaw:wingYaw,scale:wingScale,w:wingW,zMin:wingZMin,zMax:wingZMax,lowY:wingLowY,highY:wingHighY,postZ:wingPostZ};
group(grandFrame.x,0,grandFrame.z,grandFrame.yaw,()=>{
 for(let j=0;j<3;j++){const top=grandFrame.floor-j*.15;box(2.43+j*.30,(3.70+top)/2,-.60,.34,top-3.70,1.40,'wood');}
});
group(wingX,wingGroupY,wingZ,wingYaw,()=>{const deckDepth=wingZMax-wingZMin,deckCenter=(wingZMax+wingZMin)/2;box(0,.43,deckCenter,wingW*.92,.14,deckDepth,'dark');for(let i=0;i<=16;i++){const x=-wingW*.42+i*wingW*.84/16;box(x,.515,deckCenter,.052,.045,deckDepth-.06,'wood');}for(const x of[-wingW*.44,wingW*.44])emit(createContinuousTimber(Array.from({length:17},(_,i)=>[x,.36,wingZMin+i*deckDepth/16]),.105,.15,.01),'wood');for(const z of wingPostZ){column(wingW*.5,z,.5,wingLowY-.7,.14);brackets(wingW*.5,wingLowY-.28,z,.46);}recedingWingRoof();},wingScale);
role='layered-walkways';group(-4.0,.1,-13,.13,()=>hall(7.5,7.4,5.9),.82);group(-1.5,.0,-17,0,()=>hall(7.6,6.5,4.8),.80);group(7.8,3.0,-14.2,-.15,()=>{const w=9.2,d=8.3,front=d*.37,raised=2.1;hall(w,d,10.0,{raised,roofRise:3.65,roofCurl:.95,roofHorn:.32,walls:false,frontOpening:true});box(0,9.55,front-.12,7.4,1.18,.15,'wood');for(const x of[-2.7,-.9,.9,2.7])lattice(x,9.55,front-.02,1.35,.74);for(const y of[8.90,10.20])box(0,y,front+.04,7.7,.18,.26,'red');box(0,2.8,-d*.40,w*.85,6.25,.20,'dark');for(const sx of[-1,1])box(sx*w*.43,2.8,0,.18,6.25,d*.78,'wood');for(const sx of[-1,1]){box(sx*3.15,4.25,front+.02,1.65,4.30,.13,'wall');lattice(sx*3.15,4.25,front+.11,1.20,3.70);column(sx*2.16,front+.06,raised,7.10,.16);lattice(sx*1.35,4.05,front+.10,1.12,3.70);for(const yy of[2.35,3.05,5.05])rosette(sx*1.35,yy,front+.19,.09);for(let k=0;k<7;k++)box(sx*1.35,2.55+k*.50,front+.20,.022,.34,.03,'oldgold');}for(const yy of[2.17,6.05,7.50])box(0,yy,front+.02,w*.88,.17,.26,'red');for(let i=0;i<13;i++){const x=-3.75+i*.625;box(x,6.60,-d*.39,.045,2.75,.05,'oldgold');}for(const sx of[-1,1]){const lanternX=sx*2.80;lantern(lanternX,6.50,front-.25,.38);}},.62);group(2.0,3.5,-21,0,()=>hall(10.0,5.8,3.9),.93);
// A closed masonry platform carries the rear hall above the planted valley.
// The stream terminates at its retaining wall, rather than at low door panels.
group(2.0,0,-21,0,()=>{
 box(0,2.00,0,9.10,4.00,5.10,'hallFoundation');
 for(let row=0;row<12;row++)for(let col=0;col<9;col++){
  const x=-4.0+col+(row%2?.18:-.12),y=.18+row*.327;
  box(x,y,2.58,.94,.30,.22,'rock');
 }
});
role='main-hall-sanctum';material('statueGold','#b68135',.29,.72);{const statue=new T.SphereGeometry(1,32,24);geometries.add(statue);group(6.10,3.97,-13.26,-.15,()=>{for(let i=0;i<4;i++){const w=3.35-i*.34,y=.71+i*.18;box(0,y,0,w,.17,1.02-i*.10,'dark');box(0,y+.094,.015,w+.08,.035,1.05-i*.10,'oldgold');for(const x of[-w*.42,-w*.21,0,w*.21,w*.42])rosette(x,y+.12,.54,.055);}box(0,1.58,.02,1.30,.28,.72,'oldgold');emit(statue,'statueGold',0,1.77,.02,.52,.19,.39);emit(statue,'statueGold',0,2.19,-.035,.35,.47,.27);emit(statue,'statueGold',0,2.69,.04,.17,.20,.18);emit(statue,'statueGold',0,2.92,.03,.065,.09,.07);for(const side of[-1,1]){emit(statue,'statueGold',side*.39,2.15,.02,.18,.42,.18,[0,0,side*.18]);emit(statue,'statueGold',side*.55,1.92,.16,.13,.29,.13,[0,0,side*.30]);emit(statue,'statueGold',side*.11,2.64,.04,.045,.14,.045,[0,0,side*.2]);}emit(torusG,'gold',0,2.54,-.28,.52,.52,.055,[0,0,0]);emit(torusG,'oldgold',0,2.54,-.30,.38,.38,.04,[0,0,0]);for(let i=0;i<12;i++){const a=i*Math.PI/6;emit(ballG,'gold',Math.cos(a)*.46,2.54+Math.sin(a)*.46,-.25,.035,.045,.035);}},.70);}
// Source anchors: compact white/red storeys, closely carved cornices,
// a true four-slope blue-tiled crown and narrow many-ring sorin.
role='five-tier-pagoda';group(4.80,2.764,-24,-.40,()=>{
 box(0,.35,0,5.8,.7,5.8,'stone');
 for(let level=0;level<5;level++){
  const floor=.75+level*2.55,h=2.20,w=7.3-level*.29,body=w*.60,hh=body/2;
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
  roof(w*.93,w*.84,floor+h+.15,level===4?2.71:1.40,.44,.028,.24);
 }
 const y=14.59;emit(new T.CylinderGeometry(.025,.29,4.85,16),'oldgold',0,y+2.40,0);
 for(let i=0;i<23;i++){
  const r=.34-i*.0116;emit(torusG,'gold',0,y+.16+i*.185,0,r,r*.72,r,[Math.PI/2,0,0]);
 }
 emit(ballG,'gold',0,19.42,0,.115,.20,.115);
},[1.10,1.20,1.10]);
// Porch is genuinely close to the lens. Its painted members frame distant rooms.
role='foreground-veranda';
material('foregroundSoffit','#9b4b23',.92,0);
// A pitched timber ceiling is visible across the upper frame. Its joists
// meet the front head beam and both close gate posts in actual 3D space.
for(let j=0;j<10;j++){
 const t=j/9,z=9.05-2.65*t,y=4.92+1.36*t;
 emit(boxG,'foregroundSoffit',0,y+.16,z,7.2,.11,.36,[.474,0,0]);
}
for(let i=0;i<25;i++){
 const x=-3.35+i*.29;
 between([x,4.92,9.05],[x,6.28,6.40],.17,'foregroundSoffit',false,.23);
 box(x,5.08,8.50,.13,.10,.035,'oldgold');
}
box(0,5.50,8.20,7.1,.34,.38,'foregroundSoffit');
for(const x of[-2.30,2.08]){
 box(x,2.60,7.9,x<0?.61:.38,5.8,x<0?.64:.45,'red');
 for(const y of[.2,1.9,x<0?5.7:4.40])plaque(x,y,8.24,x<0?.47:.32,y===1.9?(x<0?1.35:1.05):.85);
 for(const part of createGateColumnShoe(x<0?.61:.38,x<0?.64:.45,.24))emit(part.geometry,part.material,x,.27,7.9);
 const facing=x<0?1:-1,innerHardware=x<0?[[3.30,.42,.58]]:[[4.10,.32,.68],[2.58,.32,.78]];
 for(const [py,pw,ph]of innerHardware){
  const parts=createGatePlaque(pw,ph);
  for(const part of parts)emit(part.geometry,part.material,x+facing*(x<0?.317:.205),py,7.9,1,1,1,[0,facing*Math.PI/2,0]);
 }
}
lantern(-1.95,5.52,6.8,.40);
const railBalusterG=new T.LatheGeometry([[.09,0],[.09,.09],[.065,.17],[.05,.30],[.05,.57],[.075,.67],[.10,.76],[.10,.84]].map(p=>new T.Vector2(...p)),8);function railing(a,b,y,near=false){const length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(length/(near?1.45:.9));for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,yy=typeof y==='function'?y(t):y;if(near&&i!==n)emit(railBalusterG,'red',x,yy+.12,z,.76,.82,.76,[0,Math.PI/8,0]);else box(x,yy+(near?.41:.425),z,near?.11:.13,near?.82:.85,near?.11:.14,'red');if(near?i===n:i%3===0){const ph=near?.82:.94;box(x,yy+ph/2,z,.14,ph,.14,'red');emit(ballG,'gold',x,yy+ph+.04,z,.065,.065,.065);emit(cylG,'gold',x,yy+ph-.02,z,.075,.08,.075);}if(i<n){const tt=(i+1)/n,ny=typeof y==='function'?y(tt):y;for(const dy of(near?[.12,.57,.76]:[.13,.58,.77]))between([x,yy+dy,z],[a[0]+(b[0]-a[0])*tt,ny+dy,a[1]+(b[1]-a[1])*tt],near?.082:.095,'redlight',false,near?.105:.12);}}}
railing([-2.30,5.7],[1.85,9.1],t=>.65-.20*t,true);railing([-2.30,7.55],[-2.30,5.7],t=>1.20+.05*t,true);
{
 const x=-1.05,z=6.72,base=.62;
 box(x,base+.58,z,.18,1.16,.18,'red');
 const finial=new T.LatheGeometry([[.11,0],[.13,.06],[.12,.15],[.20,.19],[.21,.27],[.18,.33],[.09,.38],[.055,.43],[0,.48]].map(p=>new T.Vector2(...p)),28);
 emit(finial,'gold',x,base+1.16,z,.83,.83,.83);
 rosette(x,base+.24,z+.103,.070);
}
// The crossing follows the stream in depth: its near landing sits left and its far landing recedes toward the right-hand buildings.
role='arched-stream-bridge';
const bridgeStart=[.40,-5.6],bridgeEnd=[9.40,-13.30],bridgeDX=bridgeEnd[0]-bridgeStart[0],bridgeDZ=bridgeEnd[1]-bridgeStart[1],bridgeRun=Math.hypot(bridgeDX,bridgeDZ),bridgeNX=-bridgeDZ/bridgeRun,bridgeNZ=bridgeDX/bridgeRun,bridgeYaw=Math.atan2(bridgeNX,bridgeNZ),bridgeArch=t=>2.60+1.30*t+.45*Math.sin(t*Math.PI),bridgePoint=(t,side=0)=>[bridgeStart[0]+bridgeDX*t+bridgeNX*side,bridgeArch(t),bridgeStart[1]+bridgeDZ*t+bridgeNZ*side];
for(let i=0;i<46;i++){const t=(i+.5)/46,p=bridgePoint(t);box(p[0],p[1]-.09,p[2],.225,.16,1.50,'wood',bridgeYaw);}
for(const side of[-.58,0,.58])line(Array.from({length:41},(_,i)=>{const p=bridgePoint(i/40,side);p[1]-=.21;return p;}),side===0?.15:.095,'wood');
for(let i=2;i<44;i+=4){const p=bridgePoint(i/45);between([p[0]-bridgeNX*.50,p[1]-.18,p[2]-bridgeNZ*.50],[p[0]+bridgeNX*.50,p[1]-.18,p[2]+bridgeNZ*.50],.043,'redlight');}
const bridgeFinial=new T.LatheGeometry([[.065,0],[.085,.035],[.075,.08],[.12,.12],[.13,.18],[.10,.22],[.045,.26],[0,.30]].map(p=>new T.Vector2(...p)),24);
function bridgeRail(side){
 const top=[],low=[];
 for(let i=0;i<=20;i++){
  const t=i/20,p=bridgePoint(t,side*.72);top.push([p[0],p[1]+.88,p[2]]);low.push([p[0],p[1]+.29,p[2]]);
  if(i%2===0){
   const main=i%4===0,h=main?1.02:.75;
   box(p[0],p[1]+h/2,p[2],main?.18:.09,h,main?.18:.115,'red');
   if(main){
    emit(bridgeFinial,'gold',p[0],p[1]+h,p[2]);
    for(const dy of[.12,.82])emit(cylG,'oldgold',p[0],p[1]+dy,p[2],.096,.045,.096);
    rosette(p[0],p[1]+.34,p[2]+side*bridgeNZ*.10,.070);
   }
  }
 }
 line(top,.082,'redlight');line(low,.052,'red');
}
bridgeRail(-1);bridgeRail(1);
for(let j=0;j<3;j++){const t=-(j+1)*.30/bridgeRun,p=bridgePoint(0),top=p[1]-(j+1)*.15;box(p[0]+bridgeDX*t,top-.10,p[2]+bridgeDZ*t,.36,.20,1.55,'stone',bridgeYaw);}

role='gallery-stone-stair';{const a=[9.4,3.90,-13.3],b=[8.7,4.30,-16.7],dx=b[0]-a[0],dz=b[2]-a[2],run=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz),steps=12,width=2.35,profile=new T.Shape();profile.moveTo(0,0);profile.lineTo(0,(b[1]-a[1])/steps);for(let i=0;i<steps;i++){profile.lineTo((i+1)*run/steps,(i+1)*(b[1]-a[1])/steps);if(i<steps-1)profile.lineTo((i+1)*run/steps,(i+2)*(b[1]-a[1])/steps);}profile.lineTo(run,b[1]-a[1]);profile.lineTo(run,0);profile.closePath();const flight=new T.ExtrudeGeometry(profile,{depth:width,steps:1,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:1});flight.translate(0,0,-width/2);group(a[0],a[1],a[2],Math.atan2(-dz,dx),()=>emit(flight,'stone'));for(let i=0;i<steps;i++){const t=(i+.5)/steps,top=a[1]+(b[1]-a[1])*(i+1)/steps,x=a[0]+dx*t,z=a[2]+dz*t;box(x,top-.015,z,2.47,.065,run/steps+.085,'stone',yaw);}for(const side of[-1,1]){const off=side*1.58,p0=[a[0]+Math.cos(yaw)*off,a[1],a[2]-Math.sin(yaw)*off],p1=[b[0]+Math.cos(yaw)*off,b[1],b[2]-Math.sin(yaw)*off];between([p0[0],p0[1]+.08,p0[2]],[p1[0],p1[1]+.08,p1[2]],.105,'stone',false,.17);const upper0=[p0[0],p0[1]+.92,p0[2]],upper1=[p1[0],p1[1]+.92,p1[2]];between(upper0,upper1,.082,'redlight',false,.12);for(let i=0;i<=8;i++){const t=i/8,x=p0[0]+(p1[0]-p0[0])*t,y=p0[1]+.1+(p1[1]-p0[1])*.0+(p1[1]-p0[1])*0,z=p0[2]+(p1[2]-p0[2])*t,yy=a[1]+(b[1]-a[1])*t;box(x,yy+.49,z,.105,.90,.12,'red');}}}
// A narrow, winding stream cuts a planted shallow valley rather than a full-frame water sheet.
role='garden-ground';
const ground=z=>.50+Math.max(0,Math.min(3.50,(6-z)*.14));
const riverProfile=[[-15,4.7],[-13,4.5],[-11,4.3],[-9,4.0],[-7,3.6],[-5,3.1],[-3,3.0],[-1,2.8],[0,2.7],[2,2.4],[4,2.0],[6,1.7],[7.5,1.5]];
function riverXAt(z){if(z<=riverProfile[0][0])return riverProfile[0][1];if(z>=riverProfile.at(-1)[0])return riverProfile.at(-1)[1];for(let i=0;i<riverProfile.length-1;i++){const [za,xa]=riverProfile[i],[zb,xb]=riverProfile[i+1];if(z>=za&&z<=zb)return T.MathUtils.lerp(xa,xb,(z-za)/(zb-za));}return 0;}
const landHeight=(x,z)=>ground(z)-.08+.035*Math.sin(x*.43+z*.27)*Math.sin(z*.31-x*.22);
const terrainHeight=(x,z)=>{const d=Math.abs(x-riverXAt(z)),channel=(z>-21&&z<8)?1-T.MathUtils.smoothstep(d,.70,2.00):0;return Math.max(landHeight(x,z)*(1-channel)-.88*channel,2.55*Math.exp(-((x-5.6)**2+(z+13.2)**2)/.62));};
const earth=new T.MeshStandardMaterial({name:'scene08-organic-earth-no-grid',color:'#535a49',roughness:1,metalness:0});earth.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vEarthLocal;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvEarthLocal=transformed;');shader.fragmentShader='varying vec3 vEarthLocal;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat earthMottle=sin(vEarthLocal.x*.63+sin(vEarthLocal.z*.29)*1.8)*sin(vEarthLocal.z*.47-vEarthLocal.x*.17);float earthPatch=sin(vEarthLocal.x*.19+vEarthLocal.z*.11)*sin(vEarthLocal.z*.16-vEarthLocal.x*.08);float earthSoft=sin(vEarthLocal.x*.075+sin(vEarthLocal.z*.095)*2.1)*sin(vEarthLocal.z*.064-vEarthLocal.x*.052);diffuseColor.rgb*=.80+.10*earthMottle+.12*earthPatch+.08*earthSoft;`);};materials.push(earth);
const nx=144,nz=144,pp=[],uv=[],ix=[];
for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-28+i*56/nx,z=-42+j*60/nz,y=terrainHeight(x,z);pp.push(x,y,z);uv.push(x*.08,z*.08);}
for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ix.push(a,c,b,b,c,d);}
const terrain=new T.BufferGeometry();terrain.setAttribute('position',new T.Float32BufferAttribute(pp,3));terrain.setAttribute('uv',new T.Float32BufferAttribute(uv,2));terrain.setIndex(ix);terrain.computeVertexNormals();emit(terrain,earth);geometries.add(terrain);
const waterYAt=z=>.52;const waterPath=riverProfile.map(([z,x])=>new T.Vector3(x,waterYAt(z),z)),waterCurve=new T.CatmullRomCurve3(waterPath,false,'centripetal');
const waterFlatP=[],waterUv=[],waterIx=[],waterN=100,waterM=18;for(let j=0;j<=waterN;j++){const t=j/waterN,center=waterCurve.getPoint(t),tangent=waterCurve.getTangent(t).normalize(),across=new T.Vector3(-tangent.z,0,tangent.x).normalize(),width=(.56+.32*T.MathUtils.smoothstep(t,.18,.78)+.26*T.MathUtils.smoothstep(t,.82,1))*T.MathUtils.smoothstep(t,0,.09);for(let i=0;i<=waterM;i++){const u=i/waterM*2-1,edge=.035*Math.sin(t*79+u*4),p=center.clone().addScaledVector(across,u*width+edge);waterFlatP.push(p.x,-p.z,0);waterUv.push(t*8,i/waterM*2);}}
for(let j=0;j<waterN;j++)for(let i=0;i<waterM;i++){const a=j*(waterM+1)+i,b=a+1,c=a+waterM+1,d=c+1;waterIx.push(a,b,c,b,d,c);}
const waterG=new T.BufferGeometry();waterG.setAttribute('position',new T.Float32BufferAttribute(waterFlatP,3));waterG.setAttribute('uv',new T.Float32BufferAttribute(waterUv,2));waterG.setIndex(waterIx);waterG.computeVertexNormals();
const waterReflectShader={...Reflector.ReflectorShader,uniforms:T.UniformsUtils.clone(Reflector.ReflectorShader.uniforms),vertexShader:Reflector.ReflectorShader.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec2 vWaterUV;').replace('vUv = textureMatrix * vec4( position, 1.0 );','vWaterUV=uv; vUv = textureMatrix * vec4( position, 1.0 );'),fragmentShader:Reflector.ReflectorShader.fragmentShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec2 vWaterUV;').replace('vec4 base = texture2DProj( tDiffuse, vUv );','vec4 uvw=vUv;uvw.xy+=vec2(sin(vWaterUV.x*47.+vWaterUV.y*19.),sin(vWaterUV.y*61.-vWaterUV.x*13.))*.00036*vUv.w;vec4 base=texture2DProj(tDiffuse,uvw);').replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );','gl_FragColor = vec4( mix( color, base.rgb, .52 ), 1.0 );')};const stream=new Reflector(waterG,{color:'#283d2e',textureWidth:1024,textureHeight:1024,clipBias:.003,shader:waterReflectShader,multisample:2});stream.rotation.x=-Math.PI/2;stream.position.y=.52;stream.name='scene08-reflective-meander';stream.receiveShadow=true;scene.add(stream);geometries.add(waterG);
material('waterglint','#b9ab84',.24,.01);mats.waterglint.emissive=new T.Color('#292314');mats.waterglint.emissiveIntensity=.12;role='stream-surface-glints';for(let i=0;i<7;i++){const z=-10+i*2.3,x=riverXAt(z)+Math.sin(i*2.3)*.13,y=waterYAt(z)+.035,length=.18+.08*Math.sin(i*1.7),tangent=new T.Vector3(.045,0,.999).normalize();line([[x-tangent.x*length,y,z-tangent.z*length],[x,y+.006,z],[x+tangent.x*length,y,z+tangent.z*length]],.014,'waterglint');}
const rocks=Array.from({length:9},(_,i)=>createWeatheredBoulderGeometry(T,{scale:[1,1,1],seed:803+i,sectors:32,rings:18})),moss=rocks.map(g=>createBoulderMossGeometry(T,g));
function rock(x,y,z,sx,sy,sz,i){y+=ground(z);emit(rocks[i%9],'rock',x,y,z,sx,sy,sz,[0,i*.71,0]);emit(moss[i%9],'moss',x,y,z,sx,sy,sz,[0,i*.71,0]);}
// Stone pier cores continue below the modeled channel bed and meet the open wing's outer timber posts.
role='left-grand-hall';group(wingFrame.x,wingFrame.y,wingFrame.z,wingFrame.yaw,()=>{const floor=.5,x=wingFrame.w*.5;for(let i=0;i<wingFrame.postZ.length;i++){const z=wingFrame.postZ[i],rot=i*.59,worldX=wingFrame.x+wingFrame.scale*(Math.cos(wingFrame.yaw)*x+Math.sin(wingFrame.yaw)*z),worldZ=wingFrame.z+wingFrame.scale*(-Math.sin(wingFrame.yaw)*x+Math.cos(wingFrame.yaw)*z),bottom=(terrainHeight(worldX,worldZ)-.12-wingFrame.y)/wingFrame.scale,height=floor-bottom,waterLocal=(waterYAt(worldZ)-wingFrame.y)/wingFrame.scale;box(x,(bottom+floor)/2,z,.34,height,.34,'hallFoundation');box(x,bottom+.12,z,.70,.24,.70,'stone',rot);box(x,floor-.08,z,.66,.16,.66,'stone',rot);emit(rocks[i%9],'rock',x,waterLocal+.18,z,.38,.34,.42,[.02,rot,.01]);emit(moss[i%9],'moss',x,waterLocal+.18,z,.38,.34,.42,[.02,rot,.01]);emit(rocks[(i+4)%9],'rock',x-.10,floor-.32,z+.18,.30,.28,.34,[.03,rot+.41,.02]);emit(moss[(i+4)%9],'moss',x-.10,floor-.32,z+.18,.30,.28,.34,[.03,rot+.41,.02]);}});
// The near bridge landing bears on an interlocked granite abutment; the upper
// course reaches the deck underside while the lower stones key into the bank.
role='arched-stream-bridge';{
 const p=bridgePoint(0),bottom=terrainHeight(p[0],p[2])-.15,top=p[1]-.17;
 group(p[0],0,p[2],bridgeYaw,()=>{
  box(0,(bottom+top)/2,0,1.30,top-bottom,1.85,'hallFoundation');
  const courses=Math.ceil((top-bottom)/.32),course=(top-bottom)/courses;
  for(let row=0;row<courses;row++)for(let col=0;col<3;col++){
   const xx=(col-1)*.59+(row%2?.12:-.10),yy=bottom+(row+.5)*course,i=(row*3+col)%9;
   emit(rocks[i],'rock',-.50,yy,xx,.40,course*.58,.37,[.01,(row*3+col)*.29,.01]);
   if(row===courses-1)emit(moss[i],'moss',-.50,yy,xx,.40,course*.58,.37,[.01,(row*3+col)*.29,.01]);
  }
 });
}

function riverRock(x,z,sx,sy,sz,i){const y=terrainHeight(x,z)+sy*.70,rot=i*.71;emit(rocks[i%9],'rock',x,y,z,sx,sy,sz,[0,rot,0]);emit(moss[i%9],'moss',x,y,z,sx,sy,sz,[0,rot,0]);}
role='weathered-garden-rocks';rock(-.65,.05,-2.8,.52,1.40,.55,27);for(let i=0;i<78;i++){const z=rr(-21,6),side=i%2?-1:1,x=riverXAt(z)+side*rr(4.1,7.1);rock(x,rr(-.16,.25),z,rr(.32,.98),rr(.38,1.05),rr(.32,.98),i);}
role='stream-bank-granite';for(let i=134;i>0;i--){const z=-19.6+i*.20,side=i%2?-1:1,x=riverXAt(z)+side*rr(1.25,1.80),sx=rr(.34,.72),sy=rr(.28,.62);riverRock(x,z,sx,sy,rr(.34,.72),i+18);if(i%2===0)riverRock(x+side*rr(.40,.68),z+rr(-.13,.13),sx*.70,sy*.76,rr(.30,.58),i+43);}
role='left-garden-stone-island';for(const [x,z,sx,sy,sz,i]of[[-7.8,-3.6,1.00,.70,1.05,11],[-6.5,-2.2,1.18,.82,1.02,12],[-5.0,-1.5,.82,.56,.76,13],[-4.2,-.1,1.26,.82,1.10,14],[-2.8,.8,1.02,.70,.84,15],[-6.0,1.2,.88,.58,.92,16],[-8.2,.4,1.16,.76,1.04,17],[-3.8,2.2,.84,.58,.78,18],[-6.6,-4.6,1.02,.70,.96,19]])riverRock(x,z,sx,sy,sz,i);for(const [x,z,sx,sy,sz,i]of[[.1,3.0,.86,.55,.92,51],[4.8,2.8,1.05,.68,1.08,52],[-1.4,4.2,.92,.58,.98,53],[1.0,5.0,1.10,.70,1.20,54],[5.0,4.8,.96,.62,.90,55],[-3.2,5.6,1.16,.72,1.25,56]])riverRock(x,z,sx,sy,sz,i);for(const [x,z,sx,sy,sz,i]of[[-5.0,-4.0,1.05,.72,1.12,31],[-3.8,-3.2,1.10,.76,1.02,32],[-2.8,-2.2,.90,.55,.82,33],[-1.6,-1.1,1.00,.66,.92,34],[-5.2,-.7,1.24,.74,1.32,35],[-3.8,.4,1.02,.62,.92,36],[-2.4,1.4,.86,.52,.82,37],[-4.5,2.4,1.12,.72,1.04,38],[-1.4,2.8,.92,.55,.80,39],[-6.5,3.2,1.16,.70,1.12,40],[-2.8,4.0,.94,.62,.86,41],[-.5,4.5,1.00,.60,.92,42]])riverRock(x,z,sx,sy,sz,i);rock(-5.8,.20,.2,.9,1.2,.8,5);rock(-6.0,.1,-2.2,.8,1.0,.7,6);rock(-6.8,.05,-.5,.8,1.2,.8,4);rock(5.5,.0,3.5,1.15,.95,1.0,7);rock(-7.2,.2,.6,1.0,1.0,1.1,8);for(let i=0;i<10;i++){const z=-5+i*1.0,side=i%2?1:-1;rock(.3+side*rr(4.4,5.0),.45,z,rr(.55,.88),rr(.58,.92),rr(.48,.78),i+5);}for(const p of[[-5.35,.06,-4.8,1.18,.72,1.05,2],[-5.9,.02,-3.0,.92,.62,.83,5],[-5.35,.08,-1.1,1.12,.72,.86,1],[-5.8,.04,1.1,.85,.52,.74,4],[5.2,.04,-5.3,.9,.62,.86,3],[5.7,.06,-3.5,1.12,.74,.98,6],[5.55,.03,-1.2,.82,.52,.77,0],[5.9,.04,1.0,1.08,.7,.88,7]])rock(...p);
// Weathered, carved granite: a curved four-hip kasa with a double curled rim,
// a pierced lamp chamber, molded lotus collars and an uneven stone shaft.
material('carvedstone','#a7a18f',.96);mats.carvedstone.map=carvedGranite[0];mats.carvedstone.bumpMap=null;mats.carvedstone.normalMap=carvedGranite[1];mats.carvedstone.normalScale=new T.Vector2(.38,.38);mats.carvedstone.roughnessMap=carvedGranite[2];mats.carvedstone.color.set('#babeb4');
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
role='stone-lanterns';stoneLantern(-3.55,.6,1.30,1.32);stoneLantern(1.35,-7,2.2,.85);stoneLantern(5.3,-9.2,.65,.65);
// Each crown is a hierarchy of tapering branches with distributed individual
// folded leaves. The silhouettes retain air, asymmetry and branch direction.
function leaf(x,y,z,size,ma='leaf',yaw=0){if(ma==='pine'){emit(needleG,ma,x,y,z,size*3.0,size*3.0,size*3.0,[rr(-.5,.5),yaw,rr(-.8,.8)],rr(.72,1.25));return;}size*=z>4.5?.70:.78;emit(leafG,ma,x,y,z,size*.78,size,size,[rr(-1.15,1.15),yaw,rr(-1.1,1.1)],rr(.67,1.24));}
const bloomG=new T.BufferGeometry(),bloomP=[];for(let k=0;k<5;k++){const a=k*Math.PI*2/5,ca=Math.cos(a),sa=Math.sin(a),fan=[];for(let j=0;j<=7;j++){const t=j/7*Math.PI*2,xx=.038+.028*Math.cos(t),zz=.020*Math.sin(t);fan.push([ca*xx-sa*zz,.008*Math.sin(t)*Math.sin(t),sa*xx+ca*zz]);}for(let j=0;j<7;j++)bloomP.push(0,-.004,0,...fan[j],...fan[j+1]);}bloomG.setAttribute('position',new T.Float32BufferAttribute(bloomP,3));bloomG.computeVertexNormals();
function leafyTwig(a,b,spread,ma='leaf',count=100){between(a,b,count>3000?.068:spread*.026,'bark',true);
if(count>3000)for(let k=0;k<13;k++){const t=(k+.5)/13,q=a.map((v,c)=>v+(b[c]-v)*t),aa=k*2.39996;between(q,[q[0]+Math.cos(aa)*spread*.48,q[1]+Math.sin(k*.8)*spread*.22,q[2]+Math.sin(aa)*spread*.48],.015,'bark',true);}
for(let j=0;j<count;j++){const cl=j%13,t=count>3000?T.MathUtils.clamp((cl+.5)/13+rr(-.045,.045),0,1):random(),pad=count>3000?spread*(.65+.28*Math.sin(cl*2.13)):spread,r=Math.sqrt(random())*pad,aa=rr(0,Math.PI*2),x=a[0]+(b[0]-a[0])*t+Math.cos(aa)*r,y=a[1]+(b[1]-a[1])*t+rr(-.35,.48)*pad,z=a[2]+(b[2]-a[2])*t+Math.sin(aa)*r;if(ma==='cherry'){if(j%3===0)leaf(x,y,z,rr(.075,.14),'leaf',aa);if(j%2===0)emit(bloomG,'flower',x,y,z,.70,.70,.70,[rr(-1,1),aa,rr(-1,1)],rr(.82,1.20));}else leaf(x,y,z,rr(.075,.17),ma,aa);if(ma==='maple'&&j%9===0)emit(bloomG,'flower',x,y+.03,z,rr(.8,1.5),1,rr(.8,1.5),[rr(-1,1),aa,rr(-1,1)],rr(.85,1.2));}}
function shrub(x,y,z,r,h,ma='leaf',count=1000){
 y+=Math.max(terrainHeight(x,z),waterYAt(z)-.15);const plantMa=ma==='azalea'?'leaf':ma;
 // Woody branch forks are enclosed by overlapping irregular leaf pads.
 // Broad leaves are centimeters long; densely packed tips hide most stems.
 for(let j=0;j<7;j++){
  const a=j*2.39996,root=[x,y,z],elbow=[x+Math.cos(a)*r*.20,y+h*.30,z+Math.sin(a)*r*.20],fork=[x+Math.cos(a)*r*.57,y+h*(.54+.13*Math.sin(j*1.7)),z+Math.sin(a)*r*.57];
  between(root,elbow,.027,'bark',true);between(elbow,fork,.018,'bark',true);
  for(let k=0;k<3;k++){
   const aa=a+(k-1)*.68,tip=[fork[0]+Math.cos(aa)*r*.29,y+h*(.78+.13*Math.sin(j*1.9+k)),fork[2]+Math.sin(aa)*r*.29];
   between(fork,tip,.011,'bark',true);
  }
 }
 const total=Math.ceil(count*3.8);
 for(let i=0;i<total;i++){
  const cl=i%13,a=cl*2.39996,cr=r*(cl<3?.22:.60+.13*Math.sin(cl*2.7)),cx=x+Math.cos(a)*cr,cz=z+Math.sin(a)*cr,cy=y+h*(.52+.23*Math.sin(cl*.86)+.13*(cl<3));
  const rad=Math.cbrt(random()),az=rr(0,Math.PI*2),up=rr(-1,1),wide=Math.sqrt(1-up*up),xx=cx+Math.cos(az)*wide*rad*r*.49,zz=cz+Math.sin(az)*wide*rad*r*.44,yy=cy+up*rad*h*.32;
  leaf(xx,yy,zz,rr(.100,.160),plantMa,az);
  if(ma==='azalea'&&i%13===0)emit(bloomG,'flower',xx,yy+.025,zz,.52,.52,.52,[rr(-.9,.9),az,rr(-.7,.7)],rr(.85,1.1));
 }
}

function tree(x,z,h,spread,ma='leaf'){const trunk=[[x,0,z],[x-.15,h*.36,z+.1],[x+.10,h*.71,z-.13],[x-.24,h,z]];for(let i=0;i<3;i++)between(trunk[i],trunk[i+1],.23*(1-i*.22),'bark',true);for(let j=0;j<15;j++){const f=.38+j*.041,a=j*2.39996,rad=spread*(.7+.3*Math.sin(j*3)),start=[x+.08,h*f,z],tip=[x+Math.cos(a)*rad,h*f+rr(.35,1.25),z+Math.sin(a)*rad];between(start,tip,.095*(1-f*.7),'bark',true);for(let k=0;k<5;k++){const b=[tip[0]+rr(-.65,.65),tip[1]+rr(-.1,.6),tip[2]+rr(-.65,.65)];leafyTwig(tip,b,spread*.32,ma,390);}}}
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
role='branching-garden-trees';group(0,2.4,0,0,()=>pine(5.60,-13.2,5.8,2.4));tree(9.6,-11.4,9.2,2.4,'cherry');tree(-10,-9,15,4.3,'leaf');tree(11,-22,14,3.8,'leaf');tree(-8,-28,13,3.8,'leaf');tree(13,-2,11,3.1,'leaf');for(let i=0;i<5;i++)tree(8+i*3.2,-30-i*1.7,16+i*.8,4.2,'leaf');
group(0,3.0,0,0,()=>tree(.2,-21,7.6,2.4,'leaf'));
role='distant-forest-ridge';{const nx=144,nz=28,pp=[],uv=[],colors=[],ix=[],peaks=[[-29,10.0,8.0],[-18,13.0,7.5],[-5,12.0,8.0],[2,13.0,8.5],[14,14.0,8.0],[26,11.0,7.0]];for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-48+i*96/nx,z=-53+j*25/nz;let ridge=0;for(const [cx,height,width] of peaks)ridge=Math.max(ridge,height*Math.exp(-Math.pow((x-cx)/width,2)*.5));const depthFactor=1-.42*j/nz,grain=Math.sin(x*1.83+z*.43)*Math.sin(z*.71-x*.57)*.24+Math.sin(x*.43+z*.31)*.32,y=-2+ridge*depthFactor+grain;pp.push(x,y,z);uv.push(x*.12,z*.12);const shade=.72+Math.max(0,ridge)*.013+grain*.035;colors.push(shade*.045,shade*.075,shade*.028);}for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ix.push(a,c,b,b,c,d);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();const m=new T.MeshStandardMaterial({name:'distant-forest-ridge',vertexColors:true,roughness:1,metalness:0,side:T.DoubleSide});materials.push(m);emit(g,m);}
role='hanging-veranda-foliage';// Overhanging canopy is high and lateral; the pagoda has a clean sky opening.
for(const [aa,bb,r]of[[[-10.10,10.90,-9.0],[-8.20,12.00,-7.0],.18],[[-8.20,12.00,-7.0],[-5.20,12.90,-4.40],.11],[[12.70,9.90,-2.10],[10.40,11.50,-3.00],.16],[[10.40,11.50,-3.00],[8.00,11.70,-3.50],.095]])between(aa,bb,r,'bark',true);
leafyTwig([-5.2,12.9,-4.4],[.1,12.4,-3.5],1.35,'leaf',18000);leafyTwig([-3.3,12.65,-4.0],[-.3,12.1,-3.0],1.0,'leaflight',9500);leafyTwig([8.0,11.7,-3.5],[4.5,10.3,-2.2],1.65,'leaf',18000);
role='dense-layered-shrubs';for(let i=54;i>0;i--){const z=rr(-18,6.5),side=i%2?1:-1,x=riverXAt(z)+side*rr(1.7,3.0);shrub(x,.08,z,rr(.40,.78),rr(.38,.78),i%7===0?'leaflight':i%3===0?'leaflight':'leaf',280);}shrub(-2.65,.20,8.05,1.65,1.25,'leaf',2200);shrub(6.8,.0,2.3,1.25,.85,'maple',1000);
for(const [x,z,leafKind]of[[-4.8,-3.8,'leaf'],[-3.2,-3.0,'leaflight'],[-5.6,-1.6,'leaf'],[-2.6,-.8,'maple'],[-4.2,.4,'leaf'],[-1.5,1.6,'leaflight']])shrub(x,.05,z,.82,1.18,leafKind,520);shrub(-5.3,.18,-1.2,1.2,1.4,'leaf',1250);shrub(-5.7,.18,-2.0,1.1,2.2,'leaflight',1500);shrub(-7.0,.2,2.0,1.1,1.7,'leaf',1200);shrub(-6.3,.1,1.0,1.0,2.2,'leaf',1400);shrub(7.0,.1,1.8,1.1,1.6,'maple',1300);shrub(7.2,.1,-1.0,1.0,1.8,'leaf',1250);shrub(-5.0,.12,-8.7,1.18,1.25,'leaflight',900);shrub(5.4,.12,-9.0,1.18,1.35,'maple',950);shrub(-4.9,.1,-2.7,1.05,1.35,'leaf',950);shrub(5.0,.1,-2.6,1.10,1.30,'leaflight',900);
shrub(-3.45,.06,-2.3,1.72,2.45,'leaf',2100);shrub(-1.75,.06,-5.5,1.28,2.25,'azalea',1500);shrub(-4.5,.05,.8,1.44,2.00,'leaf',1500);shrub(-1.80,.06,1.6,1.28,1.38,'leaf',1450);shrub(5.10,.05,-1.4,1.85,2.65,'azalea',2300);shrub(4.45,.03,-5.0,1.30,1.48,'leaf',1400);shrub(4.25,.04,2.6,1.50,1.45,'leaf',1500);shrub(-1.45,-.20,9.9,1.35,1.35,'leaf',1900);shrub(-2.60,.02,8.9,1.38,1.80,'leaflight',2000);
shrub(1.2,.05,-9.3,1.30,1.90,'azalea',1700);shrub(2.1,.03,-10.7,1.30,1.65,'leaf',1500);
role='fern-and-ground-cover';for(let j=0;j<180;j++){const z=rr(-18,6.5),side=j%2?1:-1,x=riverXAt(z)+side*rr(2.3,3.9),s=rr(.21,.40);for(let k=0;k<5;k++){const a=k*2.39996+j,h=s*.8;for(let n=1;n<8;n++){const t=n/8,r=s*t,yy=ground(z)+.15+h*Math.sin(t*Math.PI*.9);for(const side of[-1,1])leaf(x+Math.cos(a)*r-side*Math.sin(a)*s*.10,yy,z+Math.sin(a)*r+side*Math.cos(a)*s*.10,s*.20,'leaflight',a+side*.7);}}}
role='garden-flowers';for(let j=0;j<64;j++){const z=rr(-12,4.5),x=riverXAt(z)+rr(4.1,5.9);const y=ground(z)+rr(.5,1.2);if(j%4===0)between([x,.1,z],[x,y,z],.013,'leaf',true);for(let i=0;i<5;i++){const a=i*1.256;leaf(x+Math.cos(a)*.04,y,z+Math.sin(a)*.04,.07,'flower',a);}}
// A few small lotus leaves sit in the slow water, leaving the channel readable.
role='stream-lotus';const lotus=new T.CircleGeometry(1,24,.12,6.04);lotus.rotateX(-Math.PI/2);for(let i=0;i<14;i++){const z=-19+rr(0,25.5),x=riverXAt(z)+rr(-.36,.36),y=waterYAt(z)+.045,s=rr(.12,.27);emit(lotus,'leaflight',x,y,z,s,1,s*.85,[0,rr(0,6.2),0]);if(i%5===0){const stem=rr(.12,.22);between([x,y,z],[x,y+stem,z],.010,'leaf',true);for(let p=0;p<5;p++)emit(bloomG,'flower',x+Math.cos(p*Math.PI*2/5)*.035,y+stem,z+Math.sin(p*Math.PI*2/5)*.035,.78,1,.78,[0,p*Math.PI*2/5,0],.92);}}
const skyG=new T.SphereGeometry(120,48,32),skyM=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,toneMapped:false,vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 direction;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}float fbm(vec2 p){float v=0.0,a=.52;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(13.7,8.1);a*=.48;}return v;}void main(){vec3 d=normalize(direction);float h=clamp(d.y,0.0,1.0);vec2 p=d.xz/(.10+abs(d.y))*2.65;float n=fbm(p+vec2(.0,.07*sin(p.x*1.6)));float cloud=smoothstep(.48,.65,n)*smoothstep(.0,.88,h);vec3 zenith=vec3(.25,.51,.83);vec3 horizon=vec3(.79,.87,.97);vec3 c=mix(horizon,zenith,smoothstep(.0,.42,h));float westGlow=exp(-pow((d.x+.43)*2.4,2.0))*exp(-h*2.2);c=mix(c,vec3(1.0,.85,.64),westGlow*.08);c=mix(c,vec3(1.0,.99,.96),cloud*.85);vec3 sunDir=normalize(vec3(-.36,.21,-.93));float sd=dot(d,sunDir);float halo=exp((sd-1.0)*70.0);float disk=smoothstep(.99935,.99978,sd);c=mix(c,vec3(1.0,.89,.64),clamp(halo*.66+disk,0.0,1.0));c=mix(c,vec3(.90,.93,.96),exp(-h*3.6)*.10);gl_FragColor=vec4(pow(c,vec3(2.2)),1.0);}'});
const skyMesh=new T.Mesh(skyG,skyM);skyMesh.renderOrder=-10;scene.add(skyMesh);geometries.add(skyG);materials.push(skyM)
const bounceMats=new Set(['red','redlight','wood','dark','gold','oldgold','wall','joinerygilt','hardwarebrass','hardwareRecess'].map(k=>mats[k]));
let instances=0,triangles=0;for(const {g,m,items} of buckets.values()){const mesh=new T.InstancedMesh(g,m,items.length);for(let i=0;i<items.length;i++){mesh.setMatrixAt(i,items[i].matrix);mesh.setColorAt(i,new T.Color().setScalar(items[i].tint));}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;if(g===leafG)mesh.castShadow=true;mesh.frustumCulled=true;if(bounceMats.has(m)||m.name.startsWith('grand-hall-')||m.name==='foregroundSoffit')mesh.layers.enable(1);scene.add(mesh);instances+=items.length;triangles+=(g.index?.count??g.attributes.position.count)/3*items.length;}
scene.add(new T.HemisphereLight('#d4e1e8','#5c4e33',.88));scene.add(new T.AmbientLight('#d7b98f',.10));const porchBounce=new T.DirectionalLight('#ffdcac',.34);porchBounce.position.set(7,6,16);scene.add(porchBounce);const eaveBounce=new T.DirectionalLight('#ffce8f',.78);eaveBounce.layers.set(1);eaveBounce.position.set(4,1.8,5);eaveBounce.target.position.set(-4,9,-10);scene.add(eaveBounce,eaveBounce.target);const sun=new T.DirectionalLight('#ffd092',6.5);sun.position.set(-30,22,18);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);sun.shadow.radius=2.4;Object.assign(sun.shadow.camera,{left:-27,right:27,top:33,bottom:-18,near:1,far:90});sun.shadow.bias=-.00014;sun.shadow.normalBias=.035;sun.target.position.set(0,4,-7);scene.add(sun,sun.target);const fill=new T.DirectionalLight('#c3d4df',.24);fill.position.set(-10,14,-18);scene.add(fill);
return {scene,setTime(time){void time;},stats:{instances,triangles,roles,seed:80247,rngFinalState:seed,revision:'scene08-solmax-supported-courtyard-r10-20261021',externalAssets:true,proceduralPlaqueGeometry:true,description:'Rebuilt broad timber hip and deep supported cornice, short raised facade and connected gallery stair, compact pagoda, transverse bridge, mounded garden banks and namespaced CC0 PBR surfaces.'},dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();stream.dispose();}};
}
