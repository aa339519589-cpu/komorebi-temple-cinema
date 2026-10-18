import * as T from 'three';
import {installScannedTimber,addTimberExtent} from './scanned-timber.js';
import {Reflector} from '../../../vendor/examples/jsm/objects/Reflector.js';
import {createWeatheredBoulderGeometry,createBoulderMossGeometry} from './rocks.js';
export async function buildScene(){
const scene=new T.Scene();scene.background=new T.Color('#a4c3df');scene.fog=new T.Fog('#b2c5c1',47,105);
let seed=80247;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),rr=(a,b)=>a+(b-a)*random();
const mats={},geometries=new Set(),materials=[],textures=[],buckets=new Map(),stack=[new T.Matrix4()],roles={};let role='architecture';
function material(name,color,roughness=.75,metalness=0){const m=new T.MeshStandardMaterial({name,color,roughness,metalness});materials.push(m);return mats[name]=m;}
material('red','#893524',.43);material('redlight','#9d4026',.46);material('wood','#61301f');material('dark','#302b26');material('gold','#d7a54c',.32,.68);material('oldgold','#a27b3b',.47,.5);material('tile','#243b52',.39,.08);material('tileedge','#50667e',.43,.05);material('wall','#e0d4b7');material('stone','#96958a',.95);material('rock','#72796a',.97);material('moss','#536333',1);mats.rock.color.set('#777a72');mats.rock.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vMineral;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMineral=position;');shader.fragmentShader='varying vec3 vMineral;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float mineral=sin(vMineral.x*19.+sin(vMineral.z*13.)*2.)*sin(vMineral.y*23.+vMineral.z*11.);float vein=pow(max(0.,sin(vMineral.y*14.+vMineral.x*3.+sin(vMineral.z*8.)*.7)),12.);diffuseColor.rgb*=.79+.22*mineral-.20*vein;`);};material('bark','#554735',.98);material('leaf','#244623',.73);material('leaflight','#42622e',.70);material('maple','#8b3330',.90);material('flower','#e28c91',.84);material('paper','#e9c985',.8);material('lanternamber','#d6a04e',.82);mats.lanternamber.emissive=new T.Color('#d58b2b');mats.lanternamber.emissiveIntensity=.35;mats.paper.emissive=new T.Color('#f7aa34');mats.paper.emissiveIntensity=.28;
// Procedural mineral/bark detail; the namespaced CC0 timber scan is installed below.
function texture(kind){const n=128,d=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const p=(y*n+x)*4,q=kind==='wood'?.94+.013*Math.sin(x*.49+Math.sin(y*.025)*3+Math.sin(x*.029)*6)+rr(0,.025):kind==='plaster'?.97+rr(0,.025):.8+rr(0,.2);d[p]=d[p+1]=d[p+2]=255*q;d[p+3]=255;}const t=new T.DataTexture(d,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;textures.push(t);return t;}
const envData=new Uint8Array(128*64*4);for(let ey=0;ey<64;ey++)for(let ex=0;ex<128;ex++){const q=(ey*128+ex)*4,f=ey/63,up=f<.5,blend=up?f*2:(f-.5)*2,c=up?[.40+.40*blend,.57+.25*blend,.75+.12*blend]:[.36-.24*blend,.40-.24*blend,.25-.14*blend];for(let k=0;k<3;k++)envData[q+k]=255*c[k];envData[q+3]=255;}const env=new T.DataTexture(envData,128,64);env.mapping=T.EquirectangularReflectionMapping;env.colorSpace=T.SRGBColorSpace;env.needsUpdate=true;textures.push(env);scene.environment=env;scene.environmentIntensity=.38;
const wood=texture('wood'),stone=texture('stone');mats.wall.map=texture('plaster');mats.moss.map=stone;mats.bark.map=wood;mats.bark.bumpMap=stone;mats.bark.bumpScale=.055;for(const n of ['red','redlight','wood','dark']){mats[n].map=wood;mats[n].bumpMap=wood;mats[n].bumpScale=.012;}for(const n of ['stone','rock','tile']){mats[n].map=stone;mats[n].bumpMap=stone;mats[n].bumpScale=.025;}
const boxG=new T.BoxGeometry(1,1,1),cylG=new T.CylinderGeometry(1,1,1,12),ballG=new T.SphereGeometry(1,8,6),torusG=new T.TorusGeometry(1,.12,5,16),leafG=new T.BufferGeometry();{const pos=[];for(let i=0;i<6;i++){const a=i/6,b=(i+1)/6,wa=Math.sin(a*Math.PI)*.34,wb=Math.sin(b*Math.PI)*.34,ya=Math.sin(a*Math.PI)*.11,yb=Math.sin(b*Math.PI)*.11;for(const side of[-1,1])for(const p of[[0,ya,a],[side*wa,ya*.2,a],[side*wb,yb*.2,b],[0,ya,a],[side*wb,yb*.2,b],[0,yb,b]])pos.push(...p);}leafG.setAttribute('position',new T.Float32BufferAttribute(pos,3));leafG.computeVertexNormals();}mats.leaf.side=mats.leaflight.side=mats.maple.side=mats.flower.side=T.DoubleSide;
material('pine','#2e512b',.82);const needleG=new T.BufferGeometry(),needleP=[];for(let k=0;k<9;k++){const a=k*2.39996,dx=Math.cos(a),dz=Math.sin(a),p=[[0,0,0],[dx*.027,.11,dz*.027],[dx*.09,.23,dz*.09]];for(let j=0;j<2;j++){const aa=p[j],bb=p[j+1],ww=.016*(1-j*.45);needleP.push(aa[0]-dz*ww,aa[1],aa[2]+dx*ww,aa[0]+dz*ww,aa[1],aa[2]-dx*ww,...bb);}}needleG.setAttribute('position',new T.Float32BufferAttribute(needleP,3));needleG.computeVertexNormals();mats.pine.side=T.DoubleSide;
const v=a=>new T.Vector3(...a);
function emit(g,ma,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=[0,0,0],tint=1){const m=typeof ma==='string'?mats[ma]:ma,key=g.uuid+m.uuid;let b=buckets.get(key);if(!b)buckets.set(key,b={g,m,items:[]});const matrix=new T.Matrix4().compose(v([x,y,z]),new T.Quaternion().setFromEuler(new T.Euler(...rot)),v([sx,sy,sz])).premultiply(stack.at(-1));b.items.push({matrix,tint});geometries.add(g);roles[role]=(roles[role]||0)+1;}
const bevels=new Map();function bevelBox(w,h,d){const key=[w,h,d].join(',');if(bevels.has(key))return bevels.get(key);const geo=new T.BoxGeometry(w,h,d,3,3,3),p=geo.attributes.position,n=geo.attributes.normal,r=Math.min(.028,Math.min(w,h,d)*.13),half=[w/2-r,h/2-r,d/2-r];for(let i=0;i<p.count;i++){const point=new T.Vector3(p.getX(i),p.getY(i),p.getZ(i)),core=point.clone();core.x=T.MathUtils.clamp(core.x,-half[0],half[0]);core.y=T.MathUtils.clamp(core.y,-half[1],half[1]);core.z=T.MathUtils.clamp(core.z,-half[2],half[2]);const normal=point.clone().sub(core).normalize();point.copy(core).addScaledVector(normal,r);p.setXYZ(i,point.x,point.y,point.z);n.setXYZ(i,normal.x,normal.y,normal.z);}bevels.set(key,geo);return geo;}const box=(x,y,z,w,h,d,ma='red',yaw=0)=>role==='foreground-veranda'?emit(bevelBox(w,h,d),ma,x,y,z,1,1,1,[0,yaw,0]):emit(boxG,ma,x,y,z,w,h,d,[0,yaw,0]);
function group(x,y,z,yaw,fn,scale=1){stack.push(stack.at(-1).clone().multiply(new T.Matrix4().compose(v([x,y,z]),new T.Quaternion().setFromAxisAngle(v([0,1,0]),yaw),v([scale,scale,scale]))));fn();stack.pop();}
function between(a,b,r,ma='red',round=false,depth=r){const av=v(a),bv=v(b),delta=bv.clone().sub(av),m=new T.Matrix4().compose(av.add(bv).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(v([0,1,0]),delta.clone().normalize()),v([r,delta.length(),depth])).premultiply(stack.at(-1)),g=round?cylG:boxG,key=g.uuid+mats[ma].uuid;let bucket=buckets.get(key);if(!bucket)buckets.set(key,bucket={g,m:mats[ma],items:[]});bucket.items.push({matrix:m,tint:1});geometries.add(g);roles[role]=(roles[role]||0)+1;}
function line(points,r,ma='gold'){const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v)),Math.max(6,points.length*3),r,5,false);emit(g,ma);}
function rosette(x,y,z,r=.13){emit(torusG,'oldgold',x,y,z,r,r,r);for(let i=0;i<8;i++){const a=i*Math.PI/4;emit(ballG,'gold',x+Math.cos(a)*r*.65,y+Math.sin(a)*r*.65,z+.015,r*.25,r*.14,r*.12,[0,0,a]);}emit(ballG,'gold',x,y,z+.025,r*.29,r*.29,r*.14);}
function plaque(x,y,z,w,h){box(x,y,z,w,h,.035,'gold');box(x,y,z+.025,w*.83,h*.88,.025,'oldgold');for(const sx of [-1,1])for(const sy of[-1,1])rosette(x+sx*w*.35,y+sy*h*.38,z+.05,w*.1);for(let i=0;i<6;i++){const yy=y-h*.32+i*h*.12;line([[x-w*.3,yy,z+.06],[x-w*.15,yy+h*.065,z+.09],[x,yy-h*.025,z+.08],[x+w*.21,yy+h*.06,z+.07]],w*.028);}rosette(x,y,z+.09,Math.min(w*.3,h*.22));}
function column(x,z,y,h,r=.20){emit(cylG,'stone',x,y+.10,z,r*1.37,.20,r*1.37);emit(cylG,'red',x,y+h/2+.2,z,r,h,r);for(const yy of[y+.24,y+h-.03])emit(cylG,'oldgold',x,yy,z,r*1.04,.075,r*1.04);for(let k=0;k<3;k++)box(x,y+h-.08+k*.04,z+r*.99,r*1.4,.045,.035,'gold');if(role==='left-grand-hall'&&h>3.0)for(const f of[.28,.65,.88])rosette(x,y+h*f,z+r*1.02,r*.32);}
const corbelShape=new T.Shape();corbelShape.moveTo(-.5,.13);corbelShape.lineTo(-.5,.27);corbelShape.quadraticCurveTo(-.38,.28,-.32,.18);corbelShape.lineTo(-.19,.18);corbelShape.quadraticCurveTo(-.16,-.02,0,-.035);corbelShape.quadraticCurveTo(.16,-.02,.19,.18);corbelShape.lineTo(.32,.18);corbelShape.quadraticCurveTo(.38,.28,.5,.27);corbelShape.lineTo(.5,.13);corbelShape.quadraticCurveTo(.36,.05,.30,-.04);corbelShape.quadraticCurveTo(.15,-.13,0,-.14);corbelShape.quadraticCurveTo(-.15,-.13,-.30,-.04);corbelShape.quadraticCurveTo(-.36,.05,-.5,.13);const corbelG=new T.ExtrudeGeometry(corbelShape,{depth:1,steps:1,curveSegments:5,bevelEnabled:true,bevelThickness:.025,bevelSize:.018,bevelSegments:1});corbelG.translate(0,0,-.5);
function brackets(x,y,z,s=.8){for(let level=0;level<4;level++){const off=level*.17*s;for(const dir of [0,1]){emit(corbelG,'redlight',x,y+off,z,(.70+level*.24)*s,.62*s,.19*s,[0,dir*Math.PI/2,0]);for(const sign of[-1,1]){const dx=dir?0:sign*(.25+level*.10)*s,dz=dir?sign*(.25+level*.10)*s:0;box(x+dx,y+off-.09*s,z+dz,.17*s,.23*s,.17*s,'oldgold');box(x+dx,y+off+.09*s,z+dz,.21*s,.07*s,.21*s,'gold');}}}box(x,y+.74*s,z,1.72*s,.14*s,.40*s,'wood');}
// Four continuously meeting hip panels, individually curved ceramic rolls,
// deep curved timber rafters, edge discs and gilded fittings.
function roof(w,d,eave,rise,curl=.65,ridgeRatio=.22){const hw=w/2,hd=d/2,rh=w*ridgeRatio;
function P(side,t,u){const span=rh+(hw-rh)*t;let x=side%2?(side===1?1:-1)*span:u*span,z=side%2?u*hd*t:(side===0?1:-1)*hd*t;return [x,eave+rise*Math.pow(Math.max(0,1-t),1.65)+curl*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),7)),z];}
for(let side=0;side<4;side++){const pp=[],uv=[],tri=(a,b,c)=>{for(const p of[a,b,c]){pp.push(...p);uv.push(p[0],p[2]);}};for(let j=0;j<18;j++)for(let i=0;i<36;i++){const a=P(side,j/18,-1+2*i/36),b=P(side,(j+1)/18,-1+2*i/36),c=P(side,j/18,-1+2*(i+1)/36),d=P(side,(j+1)/18,-1+2*(i+1)/36);if(side%2===0){tri(a,b,c);tri(b,d,c);}else{tri(a,c,b);tri(b,c,d);}}
const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();mats.tile.side=T.DoubleSide;emit(g,'tile');const underside=g.clone(),up=underside.attributes.position;for(let k=0;k<up.count;k++)up.setY(k,up.getY(k)-.14);underside.computeVertexNormals();mats.wood.side=T.DoubleSide;emit(underside,'wood');
const n=Math.ceil((side%2?d:w)/.24);for(let i=0;i<=n;i++){const u=-1+2*i/n,p=P(side,1,u);for(let j=0;j<14;j++){const a=P(side,j/14,u),b=P(side,(j+.96)/14,u);a[1]+=.045;b[1]+=.045;between(a,b,.085,'tileedge',true);}const discRot=side%2?[0,0,Math.PI/2]:[Math.PI/2,0,0];emit(cylG,'tileedge',p[0],p[1],p[2],.105,.09,.105,discRot);emit(torusG,'tileedge',p[0]+(side===1?.044:side===3?-.044:0),p[1],p[2]+(side===0?.044:side===2?-.044:0),.095,.095,.095,[0,side%2?Math.PI/2:0,0]);if(i%2===0){for(let rj=0;rj<9;rj++){const ra=P(side,rj/9,u),rb=P(side,(rj+1)/9,u);ra[1]-=.26;rb[1]-=.26;between(ra,rb,.075,'redlight',false,.12);}let q=P(side,.72,u);const qq=P(side,1.01,u);q[1]-=.18;qq[1]-=.18;between(q,qq,.09,'wood',false,.12);emit(boxG,'gold',p[0],p[1]-.18,p[2],.07,.095,.07);}}
for(let i=0;i<36;i++){const a=P(side,1,-1+2*i/36),b=P(side,1,-1+2*(i+1)/36);for(const dy of[-.12,-.25]){a[1]+=dy;b[1]+=dy;between(a,b,dy===-.12?.115:.052,dy===-.12?'wood':'red');a[1]-=dy;b[1]-=dy;}}
for(const u of [-1,1]){const pts=Array.from({length:17},(_,i)=>P(side,i/16,u).map((q,k)=>q+(k===1?.10:0)));line(pts,.095,'tileedge');const tip=P(side,1,u);line([tip,[tip[0]*1.035,tip[1]+.3,tip[2]*1.035],[tip[0]*1.04,tip[1]+.52,tip[2]*1.04]],.09,'tileedge');}}
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
  const u=-1+2*i/24;line(Array.from({length:9},(_,j)=>{const q=P(u,j/8);q[1]+=.055;return q;}),.055,'tileedge');
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
function hall(w,d,h,{raised=.5,walls=true,lanterns=true,roofRise=Math.min(w,d)*.26,buildRoof=true,frontHeight=h*.63,frontCenter=raised+h*.42}={}){box(0,raised/2,0,w*.9,raised,d*.86,'stone');box(0,raised+.06,0,w*.92,.12,d*.89,'wood');const front=d*.37;
for(const z of[-front,front]){for(let x=-w*.36;x<=w*.37;x+=w*.18){column(x,z,raised,h-.85,.18);brackets(x,h+raised-.7,z,.78);}box(0,h+raised-.12,z,w*.88,.29,.33,'red');box(0,h+raised-.52,z,w*.86,.20,.26,'red');for(let i=0;i<Math.ceil(w/.27);i++)box(-w*.44+i*.27,h+raised-.42,z+.19,.09,.1,.05,'gold');}
for(const x of[-w*.36,w*.36])for(const z of[-d*.18,0,d*.18]){column(x,z,raised,h-.85,.18);brackets(x,h+raised-.7,z,.78);}
if(walls){for(const sign of[-1,1]){const xx=sign*w*.36;box(xx,raised+h*.42,0,.14,h*.79,d*.73,'wall');for(const zz of[-d*.27,-d*.09,d*.09,d*.27])group(xx+sign*.09,0,zz,sign*Math.PI/2,()=>lattice(0,raised+Math.min(4.4,h*.59)/2+.25,.0,d*.14,Math.min(4.4,h*.59)));for(const yy of[raised+.22,raised+h*.65,raised+h*.80])box(xx+sign*.11,yy,0,.22,.21,d*.76,'red');for(let j=0;j<=8;j++){const zz=-d*.36+j*d*.09;box(xx+sign*.11,raised+h*.48,zz,.22,h*.92,.20,'red');if(h>7)brackets(xx+sign*.15,h+raised-.75,zz,.76);}}box(0,raised+h*.48,-front,w*.75,h*.87,.16,'wall');box(-w*.36,raised+h*.48,0,.12,h*.87,d*.72,'wall');for(const x of[-w*.27,-w*.09,w*.09,w*.27]){lattice(x,frontCenter,front-.22,w*.14,frontHeight);box(x,raised+h*.84,front-.1,w*.14,h*.13,.12,'wall');}for(const y of[raised+.2,raised+h*.74])box(0,y,front-.12,w*.76,.18,.19,'red');}
// A second, close-spaced bracket line supports the projecting canopy rather
// than leaving a bare rectangular girder across each elevation.
for(const sign of[-1,1]){
 const z=sign*d*.42,n=Math.ceil(w/.76);for(let i=0;i<=n;i++){
  const x=-w*.42+i*w*.84/n;brackets(x,h+raised-.57,z,.48);
  box(x,h+raised-.82,z,.21,.22,.28,'red');
  group(x,h+raised-.84,z+sign*.16,sign<0?Math.PI:0,()=>rosette(0,0,0,.072));
 }
 for(const yy of[h+raised-.72,h+raised-.93])box(0,yy,sign*d*.375,w*.85,.105,.22,'red');
}
if(buildRoof)roof(w,d,h+raised,roofRise,.65);if(lanterns)for(const x of[-w*.30,w*.30])lantern(x,h+raised-1.25,front+.25,.38);}
function lantern(x,y,z,s=.5){between([x,y+s*.9,z],[x,y+s*2.9,z],s*.045,'oldgold',true);box(x,y,z,s*.92,s*1.45,s*.83,'paper');for(const sx of[-1,1])for(const sz of[-1,1])box(x+sx*s*.47,y,z+sz*s*.43,s*.07,s*1.5,s*.07,'dark');for(let j=-3;j<=3;j++)for(const zz of[-1,1]){box(x+j*s*.13,y,z+zz*s*.45,s*.024,s*1.4,s*.025,'oldgold');box(x,y+j*s*.21,z+zz*s*.46,s*.92,s*.022,s*.025,'oldgold');}for(const yy of[-1,1]){box(x,y+yy*s*.78,z,s*1.08,s*.14,s*1.03,'dark');emit(cylG,'gold',x,y+yy*s*.94,z,s*.2,s*.2,s*.2);}for(const zz of[-1,1])rosette(x,y,z+zz*s*.48,s*.30);}
function recedingWingRoof(){const w=5.3,d=10.3,hd=d/2,zMax=2.0,span=zMax+hd,P=(t,z)=>[-w/2+w*t,7.6+(z+hd)/d*2.1+1.4*Math.pow(1-t,1.6)+.48*Math.pow(t,8)*(.15+.85*Math.pow(Math.abs(z)/hd,7)),z];const pp=[],uv=[],tri=(a,b,c)=>{for(const p of[a,b,c]){pp.push(...p);uv.push(p[0],p[2]);}};for(let j=0;j<52;j++)for(let i=0;i<22;i++){const z=-hd+j*span/52,zz=-hd+(j+1)*span/52,a=P(i/22,z),b=P((i+1)/22,z),c=P(i/22,zz),e=P((i+1)/22,zz);tri(a,c,b);tri(b,c,e);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();emit(g,'tile');const under=g.clone();for(let i=0;i<under.attributes.position.count;i++)under.attributes.position.setY(i,under.attributes.position.getY(i)-.15);emit(under,'wood');for(let j=0;j<=40;j++){const z=-hd+j*span/40;for(let i=0;i<14;i++){const a=P(i/14,z),b=P((i+.96)/14,z);a[1]+=.05;b[1]+=.05;between(a,b,.085,'tileedge',true);if(j%2===0){a[1]-=.31;b[1]-=.31;between(a,b,.09,'redlight',false,.13);}}const e=P(1,z);emit(cylG,'tileedge',e[0],e[1]+.04,e[2],.105,.09,.105,[0,0,Math.PI/2]);emit(torusG,'tileedge',e[0]+.05,e[1]+.04,e[2],.095,.095,.095,[0,Math.PI/2,0]);}for(let j=0;j<52;j++){const a=P(1,-hd+j*span/52),b=P(1,-hd+(j+1)*span/52);for(const drop of[.18,.34]){const p=a.slice(),q=b.slice();p[1]-=drop;q[1]-=drop;between(p,q,drop===.18?.115:.045,drop===.18?'wood':'red',false,.19);}}for(const z of[-hd]){const pts=Array.from({length:24},(_,i)=>P(i/23,z));line(pts,.10,'tileedge');for(let i=0;i<pts.length-1;i++){const a=pts[i].slice(),b=pts[i+1].slice();a[1]-=.2;b[1]-=.2;between(a,b,.14,'wood');}}for(let j=0;j<=8;j++){const z=-hd+j*span/8,e=P(.82,z),top=e[1]-.34;box(w*.36,(top+6.15)/2,z,.15,Math.max(.1,top-6.15),.18,'red');brackets(w*.36,top-.4,z,.65);}}
role='left-grand-hall';group(-6.5,2.35,-5.8,.08,()=>{box(0,-1.05,0,10.0,2.7,6.9,'stone');hall(11.0,8.0,6.05,{raised:1.95,roofRise:4.2,frontHeight:3.2,frontCenter:4.0});curvedGable(2.85,3.72,8.02,4.0,1.5,2.2);});group(-2.2,1.5,-7.5,-.55,()=>{box(0,-.6,0,4.7,1.8,8.8,'stone');hall(5.3,10.3,6.2,{roofRise:2.4,buildRoof:false});recedingWingRoof();});
role='layered-walkways';group(-3.25,.1,-10,.13,()=>hall(7.5,7.4,5.9));group(0.0,3.5,-9.0,-.1,()=>{box(0,-1.75,0,3.6,3.6,4.0,'stone');hall(4.0,4.5,2.8,{walls:false});});group(6.8,.0,-13,0,()=>hall(10.8,7.2,4.8));group(8.5,1.8,-10,-.15,()=>{box(0,-.9,0,6.7,2.0,6.3,'stone');hall(7.5,7.2,7,{walls:false});});group(1.7,.0,-18,0,()=>hall(10.0,5.8,3.9));
// Source anchors: compact white/red storeys, closely carved cornices,
// a true four-slope blue-tiled crown and narrow many-ring sorin.
role='five-tier-pagoda';group(4.7,-.2,-24,.22,()=>{
 box(0,.35,0,5.8,.7,5.8,'stone');
 for(let level=0;level<5;level++){
  const floor=.75+level*3.05,h=2.35,w=7.3-level*.29,body=w*.60,hh=body/2;
  box(0,floor+h*.5,0,body,h,body,'wall');
  for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5])group(0,0,0,angle,()=>{
   for(const x of[-hh,-body*.17,body*.17,hh]){
    column(x,hh+.06,floor,h-.22,.145);
    brackets(x,floor+h-.47,hh+.15,.61);
   }
   // Two inset central shutter bays leave substantial plaster wall around them.
   for(const x of[-body*.16,body*.16]){
    lattice(x,floor+h*.57,hh+.035,body*.21,h*.40);
    box(x,floor+h*.33,hh+.10,body*.23,.12,.10,'red');
   }
   for(const yy of[floor+.18,floor+.81,floor+h-.28])box(0,yy,hh+.16,body+.20,.13,.22,'red');
   for(const x of[-body*.35,body*.35]){
    box(x,floor+h*.54,hh+.13,body*.20,.055,.035,'oldgold');
    rosette(x,floor+h*.28,hh+.15,.075);
   }
   // Carved red panels, gold-ended bracket arms and projecting balcony.
   box(0,floor+.05,hh+.20,body+.68,.16,.68,'red');
   for(const yy of[floor+.24,floor+.73])box(0,yy,hh+.46,body+.48,.10,.12,'redlight');
   for(let i=0;i<19;i++)box(-body*.54+i*body*1.08/18,floor+.48,hh+.46,.05,.47,.07,'red');
   for(let i=0;i<9;i++){
    const x=-body*.47+i*body*.94/8;
    brackets(x,floor+h-.45,hh+.41,.42);
    box(x,floor+h-.16,hh+.68,.08,.085,.09,'gold');
   }
  });
  roof(w,w,floor+h+.15,level===4?3.03:1.72,.44,.028);
 }
 const y=17.06;emit(new T.CylinderGeometry(.025,.29,4.85,16),'oldgold',0,y+2.40,0);
 for(let i=0;i<23;i++){
  const r=.34-i*.0116;emit(torusG,'gold',0,y+.16+i*.185,0,r,r*.72,r,[Math.PI/2,0,0]);
 }
 emit(ballG,'gold',0,21.89,0,.115,.20,.115);
},1.2);
// Porch is genuinely close to the lens. Its painted members frame distant rooms.
role='foreground-veranda';const deckShape=new T.Shape();deckShape.moveTo(-3.2,4.4);deckShape.lineTo(3.2,10.0);deckShape.lineTo(3.2,18);deckShape.lineTo(-3.2,18);deckShape.closePath();const deckG=new T.ExtrudeGeometry(deckShape,{depth:.4,steps:1,bevelEnabled:false});deckG.rotateX(Math.PI/2);deckG.translate(0,1.4,0);emit(deckG,'wood');box(0,7.32,8.5,7.2,.22,3.8,'wood');for(let j=0;j<8;j++)box(0,7.18,6.7+j*.5,7.1,.08,.41,'redlight');for(const x of[-1.6,1.6]){box(x,6.96,8.3,.20,.24,3.3,'red');}for(const x of[-2.30,2.45]){box(x,3.5,7.9,.61,8.7,.64,'red');for(const y of[.2,1.9,5.7])plaque(x, y,8.24,.47,y===1.9?1.35:.85);box(x,.27,7.9,.65,.24,.67,'gold');}box(0,7.28,8.2,7.1,.45,1.5,'red');for(let i=0;i<24;i++){box(-3.35+i*.29,7.01,7.9,.17,.32,2.3,'redlight');box(-3.35+i*.29,6.86,8.98,.12,.10,.05,'gold');}lantern(-1.75,6.35,6.8,.48);
const railBalusterG=new T.LatheGeometry([[.09,0],[.09,.09],[.065,.17],[.05,.30],[.05,.57],[.075,.67],[.10,.76],[.10,.84]].map(p=>new T.Vector2(...p)),8);function railing(a,b,y,near=false){const length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(length/(near?1.2:.9));for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,yy=typeof y==='function'?y(t):y;if(near&&i!==2)emit(railBalusterG,'red',x,yy+.18,z,1,1,1,[0,Math.PI/8,0]);else box(x,yy+(near?.59:.425),z,near?.16:.13,near?1.18:.85,near?.17:.14,'red');if(near?i===2:i%3===0){const ph=near?1.65:.94;box(x,yy+ph/2,z,.25,ph,.25,'red');emit(ballG,'gold',x,yy+ph+.12,z,.19,.19,.19);emit(cylG,'gold',x,yy+ph-.02,z,.21,.15,.21);}if(i<n){const tt=(i+1)/n,ny=typeof y==='function'?y(tt):y;for(const dy of(near?[.18,.83,1.08]:[.13,.58,.77]))between([x,yy+dy,z],[a[0]+(b[0]-a[0])*tt,ny+dy,a[1]+(b[1]-a[1])*tt],near?.13:.095,'redlight',false,near?.18:.12);}}}
railing([-3.05,4.5],[3.1,10.0],t=>1.15+.02*t,true);railing([-3.03,7.05],[-3.03,4.9],1.10,true);
// Curved bridge with a stone landing and continuous arched timber balustrades.
role='arched-stream-bridge';const arch=t=>2.50+.65*Math.sin(t*Math.PI);for(let i=0;i<28;i++){const t=(i+.5)/28,x=-.1+t*7,z=-3.7-t*.45;box(x,arch(t)-.10,z,.28,.19,1.5,'wood');}for(const side of[-1,1])railing([-.1,-3.7+side*.83],[6.9,-4.15+side*.83],arch);box(.15,.7,-3.7,1.0,2.1,1.9,'stone');box(6.45,.7,-4.12,1.0,2.1,1.9,'stone');
role='gallery-stone-stair';{const a=[-.1,2.5,-3.7],b=[.8,4.0,-7.1],dx=b[0]-a[0],dz=b[2]-a[2],run=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);for(let i=0;i<10;i++){const t=(i+.5)/10,top=a[1]+(b[1]-a[1])*(i+1)/10,x=a[0]+dx*t,z=a[2]+dz*t;box(x,(top+.7)/2,z,1.08,top-.7,run/10+.025,'stone',yaw);box(x,top-.025,z,1.11,.05,run/10+.03,'stone',yaw);}const px=-dz/run*.61,pz=dx/run*.61;for(const side of[-1,1]){for(const h of[.35,.72])between([a[0]+px*side,a[1]+h,a[2]+pz*side],[b[0]+px*side,b[1]+h,b[2]+pz*side],.075,'red');for(let i=0;i<=5;i++){const t=i/5,x=a[0]+dx*t+px*side,z=a[2]+dz*t+pz*side,y=a[1]+(b[1]-a[1])*t;box(x,y+.39,z,.09,.78,.09,'red');}}}
// Broad basin is broken by hand-placed craggy banks and a winding reflective rill.
role='garden-ground';box(0,-.9,-12,70,1,64,'moss');const water=new T.MeshPhysicalMaterial({color:'#364e3a',roughness:.14,metalness:.32,clearcoat:1});materials.push(water);const rShader={...Reflector.ReflectorShader,uniforms:T.UniformsUtils.clone(Reflector.ReflectorShader.uniforms),fragmentShader:Reflector.ReflectorShader.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );','vec4 uvw=vUv;uvw.xy+=vec2(sin(vWaterUV.x*93.+vWaterUV.y*37.+waterTime*.30),sin(vWaterUV.y*117.-vWaterUV.x*29.+waterTime*.22))*.0008*vUv.w;vec4 base=texture2DProj(tDiffuse,uvw);')};rShader.uniforms.waterTime={value:0};rShader.vertexShader=rShader.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec2 vWaterUV;').replace('vUv = textureMatrix * vec4( position, 1.0 );','vWaterUV=uv; vUv = textureMatrix * vec4( position, 1.0 );');rShader.fragmentShader=rShader.fragmentShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec2 vWaterUV; uniform float waterTime;');const stream=new Reflector(new T.PlaneGeometry(3.2,15),{color:0x61745c,textureWidth:512,textureHeight:512,clipBias:.003,shader:rShader,multisample:2});stream.rotation.x=-Math.PI/2;stream.position.set(.8,1.0,1.2);stream.name='actual-planar-stream-reflection';scene.add(stream);geometries.add(stream.geometry);for(let i=0;i<48;i++){const z=6-i*.34,x=.8+Math.sin(i*.3)*.32;emit(torusG,'gold',x,1.03,z,rr(.05,.27),.012,rr(.03,.12),[Math.PI/2,0,rr(0,6.28)],.7);}
const rocks=Array.from({length:9},(_,i)=>createWeatheredBoulderGeometry(T,{seed:803+i,sectors:20,rings:11})),moss=rocks.map(g=>createBoulderMossGeometry(T,g));
const ground=z=>Math.max(0,Math.min(1.7,(4-z)*.07));{const pp=[],uv=[],ix=[],nx=100,nz=100;for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-28+i*56/nx,z=-42+j*60/nz,channel=(z>-7&&z<9)?1-T.MathUtils.smoothstep(Math.abs(x-.8),1.4,2.0):0,land=ground(z)-.08+.06*Math.sin(x*1.7+z*.9)*Math.sin(z*1.4-x*.6);pp.push(x,land*(1-channel)-.5*channel,z);uv.push(x*.45,z*.45);}for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ix.push(a,c,b,b,c,d);}const terrain=new T.BufferGeometry();terrain.setAttribute('position',new T.Float32BufferAttribute(pp,3));terrain.setAttribute('uv',new T.Float32BufferAttribute(uv,2));terrain.setIndex(ix);terrain.computeVertexNormals();emit(terrain,'moss');}function rock(x,y,z,sx,sy,sz,i){y+=ground(z);emit(rocks[i%9],'rock',x,y,z,sx,sy,sz,[0,i*.71,0]);emit(moss[i%9],'moss',x,y,z,sx,sy,sz,[0,i*.71,0]);}
role='weathered-garden-rocks';for(let i=0;i<115;i++){const z=rr(-21,7),side=i%2?-1:1,x=.8+side*rr(2,8.6);rock(x,rr(-.2,.35),z,rr(.35,1.25),rr(.45,1.4),rr(.4,1.35),i);}rock(-1.45,1.10,.4,.9,2.5,.8,5);rock(-.55,1.35,-.3,.95,2.7,.9,2);rock(-1.2,1.45,-2.2,.6,1.1,.65,6);rock(-2.4,1.6,-.5,.8,1.2,.8,4);rock(3.4,.05,3.5,1.4,1.1,1.1,7);rock(-3.1,1.05,.6,1.1,1.1,1.2,8);for(let i=0;i<14;i++){const z=-3+i*.68,side=i%2?1:-1;rock(.8+side*rr(1.8,2.15),.65,z,rr(.65,1.0),rr(.65,1.0),rr(.55,.9),i+5);}
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
role='branching-garden-trees';pine(3,-6,7.5,2.9);pine(-1.1,-15,6.3,2.1);tree(8,-9,10.6,3.1,'maple');tree(-10,-9,15,4.9,'leaf');tree(10,-22,15,4.6,'leaf');tree(-7,-28,13,4,'leaf');tree(13,-2,14,4.7,'leaf');for(let i=0;i<5;i++)tree(8+i*3.2,-30-i*1.7,17+i*.8,4.5,'leaf');
role='hanging-veranda-foliage';// Overhanging canopy is high and lateral; the pagoda has a clean sky opening.
leafyTwig([-5.5,10.55,2.0],[-1.7,10.0,2.5],1.2,'leaf',5000);leafyTwig([-2.9,10.6,2.3],[-.6,10.3,2.0],.88,'leaflight',2600);leafyTwig([7.6,9.7,2.1],[4.0,8.8,3.0],1.5,'leaf',6000);
role='dense-layered-shrubs';for(let i=0;i<66;i++){const z=rr(-17,7.7),side=i%2?1:-1,x=.8+side*rr(2.15,7.5);shrub(x,.1,z,rr(.5,1.2),rr(.5,1.3),i%7===0?'maple':i%3===0?'leaflight':'leaf',550);}shrub(-2.65,.95,8.05,1.9,1.6,'leaf',4200);shrub(4.0,.0,2.3,1.75,1.2,'maple',2100);
shrub(-3.4,.2,-1.2,1.8,2.2,'leaf',2300);shrub(-1.8,.25,-2.0,1.7,4.2,'leaflight',3000);shrub(-4.0,.2,2.0,1.6,2.3,'leaf',2000);shrub(-3.8,.1,1.0,1.4,3.6,'leaf',2600);shrub(3.4,.1,1.8,1.8,2.6,'maple',2400);shrub(5.2,.1,-1.0,1.6,2.9,'leaf',2100);
role='fern-and-ground-cover';for(let j=0;j<220;j++){const z=rr(-12,7.5),side=j%2?1:-1,x=.8+side*rr(1.7,6.4),s=rr(.23,.55);for(let k=0;k<5;k++){const a=k*2.39996+j,h=s*.8;for(let n=1;n<8;n++){const t=n/8,r=s*t,yy=ground(z)+.15+h*Math.sin(t*Math.PI*.9);for(const side of[-1,1])leaf(x+Math.cos(a)*r-side*Math.sin(a)*s*.10,yy,z+Math.sin(a)*r+side*Math.cos(a)*s*.10,s*.20,'leaflight',a+side*.7);}}}
role='garden-flowers';for(let j=0;j<450;j++){const z=rr(-8,6),x=.8+(j%2?-1:1)*rr(2.2,6.1);const y=ground(z)+rr(.8,1.7);if(j%4===0)between([x,.1,z],[x,y,z],.013,'leaf',true);for(let i=0;i<5;i++){const a=i*1.256;leaf(x+Math.cos(a)*.04,y,z+Math.sin(a)*.04,.07,'flower',a);}}
// A few lotus leaves sit within the narrow visible water channel.
role='stream-lotus';const lotus=new T.CircleGeometry(1,24,.12,6.04);lotus.rotateX(-Math.PI/2);for(let i=0;i<8;i++){const x=.8+rr(-.9,.9),z=rr(-1,5);emit(lotus,'leaflight',x,1.06,z,rr(.07,.17),1,rr(.07,.17),[0,rr(0,6.2),0]);}
const skyG=new T.SphereGeometry(120,32,20),skyM=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,toneMapped:false,vertexShader:`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`varying vec3 direction;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}void main(){vec3 d=normalize(direction);float h=max(d.y,0.0);vec3 c=mix(vec3(.76,.83,.86),vec3(.38,.62,.84),pow(h,.4));vec2 p=d.xz/(.18+abs(d.y))*2.5;float n=.57*noise(p)+.27*noise(p*2.1)+.12*noise(p*4.3);float cloud=smoothstep(.46,.64,n)*smoothstep(.03,.30,d.y);c=mix(c,vec3(.96,.96,.90),cloud*.80);gl_FragColor=vec4(pow(c,vec3(2.2)),1.0);}`});const skyMesh=new T.Mesh(skyG,skyM);skyMesh.renderOrder=-10;scene.add(skyMesh);geometries.add(skyG);materials.push(skyM);
const scannedTimber=await installScannedTimber(mats);const timberMats=new Set(['red','redlight','wood','dark'].map(k=>mats[k]));const bounceMats=new Set(['red','redlight','wood','dark','gold','oldgold','wall'].map(k=>mats[k]));
let instances=0,triangles=0;for(const {g,m,items} of buckets.values()){if(timberMats.has(m))addTimberExtent(g);const mesh=new T.InstancedMesh(g,m,items.length);for(let i=0;i<items.length;i++){mesh.setMatrixAt(i,items[i].matrix);mesh.setColorAt(i,new T.Color().setScalar(items[i].tint));}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;if(g===leafG)mesh.castShadow=true;mesh.frustumCulled=true;if(bounceMats.has(m))mesh.layers.enable(1);scene.add(mesh);instances+=items.length;triangles+=(g.index?.count??g.attributes.position.count)/3*items.length;}
scene.add(new T.HemisphereLight('#c5def5','#78633d',1.05));scene.add(new T.AmbientLight('#a5b9d6',.06));const porchBounce=new T.DirectionalLight('#ffdcac',.34);porchBounce.position.set(7,6,16);scene.add(porchBounce);const eaveBounce=new T.DirectionalLight('#ffc780',.85);eaveBounce.layers.set(1);eaveBounce.position.set(4,1.8,5);eaveBounce.target.position.set(-4,9,-10);scene.add(eaveBounce,eaveBounce.target);const sun=new T.DirectionalLight('#ffdda5',4.4);sun.position.set(15,20,8);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-27,right:27,top:33,bottom:-18,near:1,far:90});sun.shadow.bias=-.00014;sun.shadow.normalBias=.035;sun.target.position.set(0,4,-7);scene.add(sun,sun.target);const fill=new T.DirectionalLight('#b4cff1',.30);fill.position.set(-10,14,-18);scene.add(fill);
return {scene,setTime(time){stream.material.uniforms.waterTime.value=Number.isFinite(time)?time:0;},stats:{instances,triangles,roles,seed:80247,description:'Independent veranda frame, grand left hall, layered galleries, five-storey pagoda, curved bridge, narrow rill and individually leafed garden.'},dispose(){scannedTimber.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();stream.dispose();}};
}
