import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export const NIGHT_FIXTURE_REVISION='scene09-stone-fixtures-and-local-light-70';
const hash=(x,y=0,z=0)=>{const a=Math.sin(x*127.1+y*311.7+z*74.7+91.3)*43758.5453;return a-Math.floor(a);};
const V=a=>new T.Vector3(...a);

// The source photographs are never sampled. Both scans below are the public
// project's previously verified CC0 Poly Haven assets, declared separately.
export async function installNightScans(M,materials,textures){
  const loader=new T.TextureLoader(),wood='/assets/polyhaven/lacquered-cherry-wood/';
  const [albedo,normal,rough,rock]=await Promise.all([
    loader.loadAsync(wood+'diffuse-2k.jpg'),loader.loadAsync(wood+'normal-gl-2k.png'),loader.loadAsync(wood+'roughness-2k.jpg'),
    new GLTFLoader().loadAsync('/assets/polyhaven/rock-moss-set-01/rock_moss_set_01_4k.gltf')
  ]);
  albedo.colorSpace=T.SRGBColorSpace;for(const t of[albedo,normal,rough]){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;textures.push(t);}
  const colors={red:[4.7,2.6,1.85],wood:[3.8,3.1,2.5],dark:[.80,.90,.95],porch:[4.3,2.7,1.9]};
  for(const [key,gain]of Object.entries(colors)){
    const m=M[key];m.color.setRGB(...gain);m.map=albedo;m.normalMap=normal;m.normalScale.set(.26,.26);m.bumpMap=null;m.roughnessMap=rough;m.roughness=.93;m.metalness=0;
    m.onBeforeCompile=()=>{};m.customProgramCacheKey=()=> 'scene09-cc0-metric-timber-68';m.userData.metricTimberGrain=true;m.envMapIntensity=.65;
  }
  const variants=[];let sourceMaterial;rock.scene.updateMatrixWorld(true);rock.scene.traverse(o=>{
    if(!o.isMesh)return;sourceMaterial||=o.material;
    const g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.computeBoundingBox();const c=g.boundingBox.getCenter(new T.Vector3()),size=g.boundingBox.getSize(new T.Vector3());g.translate(-c.x,-c.y,-c.z);const q=2/Math.max(size.x,size.z);g.scale(q,q,q);
    const m=o.material.clone();m.name='scene09-cc0-scanned-fixture-foundation-'+variants.length;m.color.setRGB(.60,.72,.76);m.roughness=.92;materials.push(m);variants.push({geometry:g,material:m});
  });
  // A fixed material-space patch of the rock scan is processed to neutral
  // cut-stone albedo. This is a PBR texture crop, not a scene/view texture.
  const bounds=[1696,768,544,544];
  function patch(source,color=false){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');c.drawImage(source.image,...bounds,0,0,512,512);
    if(color){const p=c.getImageData(0,0,512,512);for(let i=0;i<p.data.length;i+=4){const l=.2126*p.data[i]+.7152*p.data[i+1]+.0722*p.data[i+2];p.data[i]=l*.98;p.data[i+1]=l;p.data[i+2]=l*.99;}c.putImageData(p,0,0);}
    const t=new T.CanvasTexture(canvas);if(color)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;textures.push(t);return t;
  }
  const stoneAlbedo=patch(sourceMaterial.map,true),stoneNormal=patch(sourceMaterial.normalMap),stoneRough=patch(sourceMaterial.roughnessMap);
  M.cutStone=new T.MeshStandardMaterial({name:'scene09-neutral-cut-stone-from-cc0-scan',color:0xb6bfbc,map:stoneAlbedo,normalMap:stoneNormal,normalScale:new T.Vector2(.58,.58),roughnessMap:stoneRough,roughness:.95,metalness:0});
  M.cutStone.color.setRGB(1.70,1.85,1.85);M.cutStone.normalScale.set(.19,.19);
  M.cutStoneDark=M.cutStone.clone();M.cutStoneDark.name='scene09-damp-recessed-stone';M.cutStoneDark.color.setHex(0x78847c);M.cutStoneDark.roughness=.85;
  M.stoneMoss=M.cutStone.clone();M.stoneMoss.name='scene09-stone-moss-growth';M.stoneMoss.color.setRGB(.55,.69,.26);M.stoneMoss.roughness=1;
  M.lanternWood=M.wood.clone();M.lanternWood.name='scene09-carved-aged-lantern-timber';M.lanternWood.color.setRGB(1.75,1.50,1.22);
  M.lanternMetal=new T.MeshStandardMaterial({name:'scene09-oxidised-bronze-lantern-hardware',color:0x483c28,metalness:.80,roughness:.49});
  M.lanternEdge=M.lanternMetal.clone();M.lanternEdge.name='scene09-rubbed-brass-edges';M.lanternEdge.color.setHex(0x9e824a);M.lanternEdge.roughness=.36;
  for(const m of[M.cutStone,M.cutStoneDark,M.stoneMoss,M.lanternWood,M.lanternMetal,M.lanternEdge])materials.push(m);
  for(const key of['map','normalMap','roughnessMap'])if(sourceMaterial[key]&&!textures.includes(sourceMaterial[key]))textures.push(sourceMaterial[key]);
  return{variants,info:{timber:'Poly Haven lacquered_cherry_wood, CC0-1.0',stone:'Poly Haven rock_moss_set_01, Kless Gyzen, CC0-1.0',cutStoneTextureProcessing:{sourceAtlasPixels:bounds,neutralizedAlbedo:true,size:512},scenePhotoSampled:false}};
}

// UVs are baked in metres per geometry/scale bucket. They therefore survive a
// standard PBR scene export and do not depend on a custom rendering shader.
export function metricTimberGeometry(geometry,matrix,cache){
  const scale=new T.Vector3().setFromMatrixScale(matrix),s=[scale.x,scale.y,scale.z],key=geometry.uuid+':'+s.map(x=>x.toFixed(4)).join(',');if(cache.has(key))return cache.get(key);
  const g=geometry.clone();g.computeBoundingBox();const size=g.boundingBox.getSize(new T.Vector3()),length=[size.x*s[0],size.y*s[1],size.z*s[2]],long=length.indexOf(Math.max(...length)),p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){
    const pos=[p.getX(i),p.getY(i),p.getZ(i)],nn=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],other=[0,1,2].filter(a=>a!==long),cross=other[0]===nn.indexOf(Math.max(...nn))?other[1]:other[0];
    if(nn[long]>.85){uv[i*2]=pos[other[0]]*s[other[0]];uv[i*2+1]=pos[other[1]]*s[other[1]];}else{uv[i*2]=pos[long]*s[long];uv[i*2+1]=pos[cross]*s[cross];}
  }
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));cache.set(key,g);return g;
}

export function installNightPaper(M,materials,textures){
  const n=256,base=new Uint8Array(n*n*4),emission=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const i=(y*n+x)*4,fiber=.85+.09*hash(x,y)+.055*Math.sin(x*.63+Math.sin(y*.12))+.025*Math.sin(y*1.9),r=Math.hypot((x/n-.5)*1.25,(y/n-.5)*.95),lamp=.24+.76*Math.exp(-r*r*7.5);
    base[i]=240*fiber;base[i+1]=224*fiber;base[i+2]=185*fiber;base[i+3]=255;emission[i]=emission[i+1]=emission[i+2]=255*lamp*fiber;emission[i+3]=255;
  }
  const tex=d=>{const t=new T.DataTexture(d,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true;textures.push(t);return t;},paper=tex(base),light=tex(emission);paper.colorSpace=T.SRGBColorSpace;
  M.paper.name='scene09-independent-lantern-paper';M.paper.color.setHex(0xbda06a);M.paper.emissive.setHex(0xffba5a);M.paper.emissiveIntensity=2.10;M.paper.map=paper;M.paper.emissiveMap=light;M.paper.bumpMap=paper;M.paper.bumpScale=.0015;M.paper.roughness=.84;
  M.windowPaper=M.paper.clone();M.windowPaper.name='scene09-recessed-room-paper';M.windowPaper.color.setHex(0xa48c64);M.windowPaper.emissiveIntensity=.72;
  M.pagodaPaper=M.windowPaper.clone();M.pagodaPaper.name='scene09-pagoda-paper';M.pagodaPaper.color.setHex(0x97805a);M.pagodaPaper.emissiveIntensity=.54;
  M.stonePaper=M.paper.clone();M.stonePaper.name='scene09-stone-lantern-inset-paper';M.stonePaper.emissiveIntensity=1.50;
  materials.push(M.windowPaper,M.pagodaPaper,M.stonePaper);
}

function stoneProfile(profile,{sides=8,wear=.007,capCurl=0}={}){
  const points=[],uv=[],indices=[],N=sides*8;
  for(let j=0;j<profile.length;j++)for(let k=0;k<N;k++){
    const t=k/8,index=Math.floor(t),f=t-index,a=index/sides*Math.PI*2+Math.PI/sides,b=(index+1)/sides*Math.PI*2+Math.PI/sides,r=profile[j][0],corner=Math.cos(f*Math.PI*2)*.5+.5;
    let x=((1-f)*Math.cos(a)+f*Math.cos(b))*r,z=((1-f)*Math.sin(a)+f*Math.sin(b))*r,y=profile[j][1]+capCurl*corner*Math.max(0,(r-.45)/.5);
    const nick=wear*(hash(k,j)*.7+Math.sin(k*.77+j*1.93)*.3);x*=1-nick;z*=1-nick;y+=wear*.25*Math.sin(k*1.71+j*3.03);points.push(x,y,z);
    const nn=Math.abs(x)>Math.abs(z);uv.push((nn?z:x)*2.0,y*2.0);
  }
  for(let j=0;j<profile.length-1;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N,c=a+N,d=b+N;indices.push(a,c,b,b,c,d);}
  for(const [j,top]of[[0,false],[profile.length-1,true]]){
    const center=points.length/3;points.push(0,profile[j][1],0);uv.push(.5,.5);for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N;if(top)indices.push(center,b,a);else indices.push(center,a,b);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  // Keep a projection chart constant for each actual cut face. A shared UV
  // at differently facing rim vertices would stretch the scan across seams.
  const expanded=g.toNonIndexed();g.dispose();const p=expanded.attributes.position,t=expanded.attributes.uv;
  for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2),nn=b.sub(a).cross(c.sub(a)).normalize(),up=Math.abs(nn.y)>.58,side=Math.abs(nn.x)>Math.abs(nn.z);for(let j=0;j<3;j++)t.setXY(i+j,up?p.getX(i+j)*2:(side?p.getZ(i+j):p.getX(i+j))*2,up?p.getZ(i+j)*2:p.getY(i+j)*2);}return expanded;
}

function mossPatch(g){
  const p=g.attributes.position,n=g.attributes.normal,oldUV=g.attributes.uv,ix=g.index,positions=[],normals=[],uv=[];
  const emit=i=>{const v=new T.Vector3().fromBufferAttribute(p,i).addScaledVector(new T.Vector3().fromBufferAttribute(n,i),.006);positions.push(...v.toArray());normals.push(n.getX(i),n.getY(i),n.getZ(i));uv.push(oldUV.getX(i),oldUV.getY(i));};
  for(let k=0,N=ix?.count??p.count;k<N;k+=3){const ids=[0,1,2].map(i=>ix?ix.getX(k+i):k+i),up=ids.reduce((s,i)=>s+n.getY(i),0)/3,c=ids.map(i=>new T.Vector3().fromBufferAttribute(p,i)).reduce((a,b)=>a.add(b),new T.Vector3()).multiplyScalar(1/3),damp=Math.sin(c.x*2.7+1.5)+.58*Math.cos(c.z*4.6-1.1)+.22*Math.sin((c.x+c.z)*7.3);if(up>.22&&damp>1.0)for(const i of ids)emit(i);}
  const m=new T.BufferGeometry();m.setAttribute('position',new T.Float32BufferAttribute(positions,3));m.setAttribute('normal',new T.Float32BufferAttribute(normals,3));m.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return m;
}

function piercedLanternPanel(){
  const s=new T.Shape();for(let j=0;j<=160;j++){const a=j/160*Math.PI*2,r=.255+.060*Math.cos(a*8);if(j)s.lineTo(Math.cos(a)*r,Math.sin(a)*r);else s.moveTo(Math.cos(a)*r,Math.sin(a)*r);}s.closePath();
  for(let j=0;j<8;j++){
    const a=j*Math.PI/4,c=Math.cos(a),q=Math.sin(a),pt=(x,y)=>[c*x-q*y,q*x+c*y],h=new T.Path();h.moveTo(...pt(0,.055));h.bezierCurveTo(...pt(-.064,.135),...pt(-.058,.231),...pt(0,.275));h.bezierCurveTo(...pt(.058,.231),...pt(.064,.135),...pt(0,.055));h.closePath();s.holes.push(h);
  }
  const g=new T.ExtrudeGeometry(s,{depth:.035,steps:1,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2,curveSegments:14});g.translate(0,0,-.0175);return g;
}

export function createPhysicalFixtures(M,scans){
  const parts={
    foot:stoneProfile([[.73,0],[.76,.07],[.76,.17],[.71,.23],[.61,.30],[.56,.36]]),
    stem:stoneProfile([[.46,.36],[.51,.42],[.51,.50],[.40,.59],[.30,.67],[.265,.82],[.245,1.41],[.28,1.60],[.41,1.73]]),
    capital:stoneProfile([[.39,1.70],[.48,1.77],[.55,1.84],[.62,1.92],[.62,2.02],[.54,2.10]]),
    chamberBottom:stoneProfile([[.53,2.06],[.60,2.12],[.60,2.21],[.51,2.26]]),
    chamberTop:stoneProfile([[.51,3.00],[.58,3.03],[.61,3.12],[.60,3.18]]),
    roof:stoneProfile([[.58,3.15],[.80,3.13],[.94,3.18],[.94,3.25],[.84,3.28],[.69,3.33],[.52,3.42],[.35,3.53],[.22,3.59]],{capCurl:.045}),
    finial:stoneProfile([[.21,3.57],[.22,3.64],[.15,3.69],[.17,3.78],[.12,3.89],[.045,4.02],[0,4.06]],{sides:16,wear:.004}),
    pillar:stoneProfile([[.072,0],[.090,.025],[.080,.10],[.065,.65],[.080,.82],[.09,.87]],{sides:8,wear:.005}),
    panel:piercedLanternPanel(),
    shaft:new T.LatheGeometry([[0,0],[.99,0],[1.012,.08],[1.016,.22],[1.006,.58],[.976,.88],[.95,1],[0,1]].map(p=>new T.Vector2(...p)),64),
    sleeve:new T.LatheGeometry([[1,0],[1.04,.03],[1.04,.94],[1,1],[.96,1],[.96,0],[1,0]].map(p=>new T.Vector2(...p)),64),
    finialBrass:new T.LatheGeometry([[0,0],[.09,0],[.11,.04],[.105,.09],[.08,.14],[.15,.21],[.17,.30],[.145,.40],[.07,.46],[.025,.52],[0,.54]].map(p=>new T.Vector2(...p)),48)
  };
  parts.roofMoss=mossPatch(parts.roof);parts.capitalMoss=mossPatch(parts.capital);parts.footMoss=mossPatch(parts.foot);
  function stoneLantern(api,x,z,s=1){const{group,emit,box,light}=api;group(x,0,z,0,()=>{
    for(const name of['foot','stem','capital','chamberBottom','chamberTop','roof','finial'])emit(parts[name],M.cutStone);
    for(const name of['roofMoss','capitalMoss','footMoss'])emit(parts[name],M.stoneMoss);
    for(let face=0;face<8;face++)group(0,0,0,face*Math.PI/4,()=>{
      emit(parts.pillar,M.cutStone,.20,2.21,.48);
      box(0,2.63,.438,.285,.68,.012,M.stonePaper);
      for(const xx of[-.135,0,.135])box(xx,2.63,.469,.021,.72,.022,M.lanternMetal);
      for(const yy of[2.28,2.98])box(0,yy,.47,.35,.035,.035,M.lanternMetal);
    });
    // Recessed stone panels and chisel borders make the stem a cut octagonal
    // member rather than an unarticulated cylindrical pedestal.
    for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
      box(0,1.13,.246,.14,.42,.012,M.cutStoneDark);
      for(const xx of[-.078,.078])box(xx,1.13,.255,.018,.45,.018,M.cutStone);
      for(const yy of[.90,1.36])box(0,yy,.255,.17,.025,.018,M.cutStone);
    });
    if(s>1){const v=scans.variants[2];emit(v.geometry,v.material,.25,-.13,-.22,.61,.47,.60,.32);}
    light(0,2.62,0,7.2,3.6);
  },s);}
  function hangingLantern(api,x,y,z,s=1,large=false){
    const{group,emit,box,between,light}=api;
    if(!large)return false;
    group(x,y,z,0,()=>{
      for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
        box(0,0,.311,.612,.77,.009,M.paper);emit(parts.panel,M.lanternWood,0,0,.344);
        for(const xx of[-.35,.35]){box(xx,0,.35,.065,.98,.075,M.lanternWood);box(xx,0,.396,.024,.90,.017,M.lanternEdge);}
        for(const yy of[-.45,.45]){box(0,yy,.35,.78,.075,.085,M.lanternMetal);box(0,yy+.033,.40,.74,.015,.022,M.lanternEdge);}
        for(const xx of[-.29,.29])for(const yy of[-.37,.37])box(xx,yy,.382,.036,.035,.02,M.lanternMetal);
      });
      box(0,.51,0,.82,.10,.82,M.lanternMetal);box(0,.575,0,.73,.03,.73,M.lanternEdge);
      emit(new T.CylinderGeometry(.30,.56,.18,4),M.lanternMetal,0,.68,0,1,1,1,Math.PI/4);box(0,.79,0,.40,.06,.40,M.lanternEdge);
      for(let j=0;j<6;j++)emit(new T.TorusGeometry(.045,.010,5,12),M.lanternMetal,0,.87+j*.10,0,1,1,1,[0,j%2*Math.PI/2,0]);
      box(0,-.52,0,.77,.10,.77,M.lanternMetal);box(0,-.58,0,.69,.025,.69,M.lanternEdge);
      emit(new T.CylinderGeometry(.47,.27,.14,4),M.lanternMetal,0,-.68,0,1,1,1,Math.PI/4);
      for(const a of[-1,1])for(const b of[-1,1]){between([a*.29,-.58,b*.29],[a*.20,-.77,b*.20],.021,.021,M.lanternEdge,true);}
      emit(parts.finialBrass,M.lanternEdge,0,-.94,0,.29,.29,.29);
      light(0,0,0,38,7.0);
    },s*.88);return true;
  }
  return{parts,stoneLantern,hangingLantern};
}
