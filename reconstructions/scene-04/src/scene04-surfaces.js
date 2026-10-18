import * as T from 'three';
import {scannedStoneMaps,scannedStoneRepeatMetres} from './scene04-scanned-stone.js';
const fract=x=>x-Math.floor(x);
const hash=(x,z,s=1)=>fract(Math.sin(x*127.1+z*311.7+s*13.7)*43758.5453);
function smoothNoise(x,z,s=1){const a=Math.floor(x),b=Math.floor(z),u=x-a,v=z-b,U=u*u*(3-2*u),V=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(a,b,s),hash(a+1,b,s),U),T.MathUtils.lerp(hash(a,b+1,s),hash(a+1,b+1,s),U),V);}
function periodicNoise(x,z,period,seed,size=512){const u=x/size*period,v=z/size*period,a=Math.floor(u),b=Math.floor(v),f=u-a,g=v-b,U=f*f*(3-2*f),V=g*g*(3-2*g),wrap=k=>((k%period)+period)%period;return T.MathUtils.lerp(T.MathUtils.lerp(hash(wrap(a),wrap(b),seed),hash(wrap(a+1),wrap(b),seed),U),T.MathUtils.lerp(hash(wrap(a),wrap(b+1),seed),hash(wrap(a+1),wrap(b+1),seed),U),V);}
export function metricStoneMaps(seed=1,size=512){
 const albedo=new Uint8Array(size*size*4),rough=new Uint8Array(albedo.length),normal=new Uint8Array(albedo.length),height=new Float32Array(size*size);
 // One repeat is 250 mm. The photograph contains angular 3–9 mm mineral
 // grains, smaller mica, and 15–35 mm eroded pockets. Separate these scales:
 // the former smooth, low-amplitude noise read as a flat ochre fabric.
 const crystal=(x,z)=>{
  const cells=23,u=x/size*cells,v=z/size*cells,a=Math.floor(u),b=Math.floor(v),wrap=k=>(k%cells+cells)%cells;
  let nearest=10,second=10,mineral=0;
  for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
   const ix=a+i,iz=b+j,wx=wrap(ix),wz=wrap(iz);if(hash(wx,wz,seed+95)<.13)continue;const sx=ix+.06+.88*hash(wx,wz,seed+41),sz=iz+.06+.88*hash(wx,wz,seed+67),d=(u-sx)**2+(v-sz)**2;
   if(d<nearest){second=nearest;nearest=d;mineral=hash(wx,wz,seed+87);}else if(d<second)second=d;
  }
  return{radius:Math.sqrt(nearest),edge:Math.sqrt(second)-Math.sqrt(nearest),mineral};
 };
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const i=z*size+x,q=hash(x,z,seed),wx=x+33*(periodicNoise(x,z,5,seed+52,size)-.5)+11*(periodicNoise(x,z,17,seed+63,size)-.5),wz=z+31*(periodicNoise(x,z,7,seed+65,size)-.5)+13*(periodicNoise(x,z,13,seed+69,size)-.5),c=crystal(wx,wz),meso=periodicNoise(x,z,9,seed+9,size),fractured=periodicNoise(wx,wz,31,seed+25,size),fine=periodicNoise(x,z,113,seed+17,size),quartz=T.MathUtils.smoothstep(c.mineral,.74,.93),mica=1-T.MathUtils.smoothstep(c.mineral,.12,.27),feldspar=T.MathUtils.smoothstep(c.mineral,.34,.65)*(1-quartz),grain=1-T.MathUtils.smoothstep(c.radius,.05+.15*c.mineral,.48+.24*c.mineral),pocket=T.MathUtils.smoothstep(meso,.53,.77),fracture=1-T.MathUtils.smoothstep(c.edge,.008,.07);
  const f=.76+.16*(meso-.5)+.09*(fine-.5)+.07*(q-.5)+.13*quartz-.32*mica-.04*fracture;
  albedo[i*4]=Math.min(255,255*(f+.028*feldspar));albedo[i*4+1]=Math.min(255,255*f);albedo[i*4+2]=Math.min(255,255*(f-.022*feldspar));albedo[i*4+3]=255;
  const rr=232-46*quartz+12*pocket-7*mica;rough[i*4]=rough[i*4+1]=rough[i*4+2]=rr;rough[i*4+3]=255;
  // Heights are in metres, so finite differences yield an actual surface slope.
  height[i]=(.0004+.0018*c.mineral)*grain*T.MathUtils.smoothstep(c.mineral,.18,.56)+.0019*(fractured-.5)+.00045*(fine-.5)-.0038*pocket-.0006*fracture-.0007*mica;
 }
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const i=z*size+x,spacing=.5/size,dx=(height[z*size+(x+1)%size]-height[z*size+(x+size-1)%size])/spacing,dz=(height[((z+1)%size)*size+x]-height[((z+size-1)%size)*size+x])/spacing,v=new T.Vector3(-dx,-dz,1).normalize();normal[i*4]=(v.x*.5+.5)*255;normal[i*4+1]=(v.y*.5+.5)*255;normal[i*4+2]=(v.z*.5+.5)*255;normal[i*4+3]=255;
 }
 const tex=(d,color=false)=>{const t=new T.DataTexture(d,size,size);t.wrapS=t.wrapT=T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.anisotropy=8;if(color)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;};
 return{map:tex(albedo,true),roughnessMap:tex(rough),normalMap:tex(normal)};
}
export function applyMetricUV(g,scale=4){
 const h=g.index?g.toNonIndexed():g,p=h.attributes.position,n=h.attributes.normal,uv=[];
 for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));ny>=nx&&ny>=nz?uv.push(p.getX(i)*scale,p.getZ(i)*scale):nx>=nz?uv.push(p.getZ(i)*scale,p.getY(i)*scale):uv.push(p.getX(i)*scale,p.getY(i)*scale);}
 h.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return h;
}
const shaderNoise=`
float ssHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float ssNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(ssHash(i),ssHash(i+vec2(1,0)),f.x),mix(ssHash(i+vec2(0,1)),ssHash(i+vec2(1,1)),f.x),f.y);}
`;
export function stoneMaterial(name,color='#82725e',{wet=false,seed=1,roughness=.96}={}){
 const scan=name.startsWith('metre-scaled-worn-wet-paver-')&&scannedStoneMaps,maps=scan?Object.fromEntries(Object.entries(scannedStoneMaps).map(([k,t])=>[k,t.clone()])):metricStoneMaps(seed),m=new T.MeshPhysicalMaterial({name,color:scan?['#c6dcff','#c0d7f7','#d1dff2','#bcd4f6'][Number(name.split('-').at(-1))%4]:color,...maps,roughness,normalScale:new T.Vector2(scan?.28:.46,scan?.28:.46),metalness:0,clearcoat:0});
 m.onBeforeCompile=shader=>{
  m.userData.compiledShader=shader;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 ssPosition;\nvarying vec3 ssWorldNormal;').replace('#include <project_vertex>',`vec4 ssP=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nssP=instanceMatrix*ssP;\n#endif\nssPosition=(modelMatrix*ssP).xyz;vec3 ssN=normal;
#ifdef USE_INSTANCING
ssN=mat3(instanceMatrix)*ssN;
#endif
ssWorldNormal=normalize(mat3(modelMatrix)*ssN);\n#include <project_vertex>`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 ssPosition;\nvarying vec3 ssWorldNormal;\n'+shaderNoise+`
vec3 ssWeights(){vec3 w=pow(abs(normalize(ssWorldNormal)),vec3(6.0));return w/(w.x+w.y+w.z);}
vec4 ssTriSample(sampler2D tex){vec3 w=ssWeights(),p=ssPosition*4.0;return texture2D(tex,p.zy)*w.x+texture2D(tex,p.xz)*w.y+texture2D(tex,p.xy)*w.z;}
`)
   .replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','ssTriSample(map)'))
   .replace('#include <normal_fragment_maps>',`
vec3 ssW=ssWeights(),ssBase=normalize(ssWorldNormal),ssP=ssPosition*4.0;
vec3 ssNX=texture2D(normalMap,ssP.zy).xyz*2.0-1.0,ssNY=texture2D(normalMap,ssP.xz).xyz*2.0-1.0,ssNZ=texture2D(normalMap,ssP.xy).xyz*2.0-1.0;
ssNX.xy*=normalScale;ssNY.xy*=normalScale;ssNZ.xy*=normalScale;
vec3 ssAX=vec3(ssBase.x*abs(ssNX.z),ssBase.y+ssNX.y,ssBase.z+ssNX.x),ssAY=vec3(ssBase.x+ssNY.x,ssBase.y*abs(ssNY.z),ssBase.z+ssNY.y),ssAZ=vec3(ssBase.x+ssNZ.x,ssBase.y+ssNZ.y,ssBase.z*abs(ssNZ.z));
normal=normalize(mat3(viewMatrix)*normalize(ssAX*ssW.x+ssAY*ssW.y+ssAZ*ssW.z));
`)
   .replace('#include <color_fragment>',`#include <color_fragment>\nvec3 ssCW=ssWeights();float ssMacro=dot(vec3(ssNoise(ssPosition.zy*1.9),ssNoise(ssPosition.xz*1.9),ssNoise(ssPosition.xy*1.9)),ssCW);float ssWeather=dot(vec3(ssNoise(ssPosition.zy*8.3)+.23*ssNoise(ssPosition.zy*49.0),ssNoise(ssPosition.xz*8.3)+.23*ssNoise(ssPosition.xz*49.0),ssNoise(ssPosition.xy*8.3)+.23*ssNoise(ssPosition.xy*49.0)),ssCW);float ssPale=smoothstep(.66,.84,ssWeather);diffuseColor.rgb*=.78+.40*ssMacro;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.40+vec3(.015,.017,.020),ssPale*.42);`)
   .replace('#include <roughnessmap_fragment>',`${T.ShaderChunk.roughnessmap_fragment.replace('texture2D( roughnessMap, vRoughnessMapUv )','ssTriSample(roughnessMap)')}\n${wet?'float ssWet=smoothstep(.53,.76,ssNoise(ssPosition.xz*.93+vec2(7.3,1.1))+.18*ssNoise(ssPosition.xz*3.1))*smoothstep(.30,.74,ssNoise(ssPosition.xz*4.7)+.2*ssNoise(ssPosition.xz*9.1));roughnessFactor=mix(roughnessFactor,.19,ssWet*.88);diffuseColor.rgb*=1.0-.23*ssWet;':''}`);
 };
 if(scan){const inherit=m.onBeforeCompile;m.onBeforeCompile=shader=>{inherit(shader);shader.fragmentShader=shader.fragmentShader.replaceAll('ssPosition*4.0',`(ssPosition*4.44444444+vec3(${((seed*.17)%1).toFixed(6)},${((seed*.31)%1).toFixed(6)},${((seed*.43)%1).toFixed(6)}))`).replace('roughnessFactor=mix(roughnessFactor,.19,ssWet*.88);diffuseColor.rgb*=1.0-.23*ssWet;','roughnessFactor=mix(roughnessFactor,.28,ssWet*.52);diffuseColor.rgb*=1.0-.12*ssWet;');};}
 m.customProgramCacheKey=()=>`scene04-world-triplanar-stone-scan47-${wet}-${!!scan}-${scan?seed:0}`;m.userData.physicalTextureRepeatMetres=scan?scannedStoneRepeatMetres:.25;m.userData.maps=maps;return m;
}
export function polygonSlab(outline,top=.045,thickness=.075,seed=1){
 const cx=outline.reduce((a,p)=>a+p[0],0)/outline.length,cz=outline.reduce((a,p)=>a+p[1],0)/outline.length,points=outline.map(([x,z])=>{const r=Math.hypot(x-cx,z-cz);return[x+(cx-x)*.012/r,z+(cz-z)*.012/r];}),shape=new T.Shape();
 const boundary=[];
 for(let j=0;j<points.length;j++){
  const a=points[j],b=points[(j+1)%points.length],v=new T.Vector2(b[0]-a[0],b[1]-a[1]),len=v.length(),n=new T.Vector2(-v.y,v.x).normalize();
  const count=Math.max(4,Math.ceil(len/.045));
  const corner=.022+.020*hash(j,0,seed+13);
  for(let k=0;k<=count;k++){const t=corner+(1-2*corner)*k/count,inset=k===0||k===count?0:.002+.025*Math.pow(hash(j,k,seed),5),chip=inset+.0025*(hash(j,k,seed+7)-.5);boundary.push([a[0]+v.x*t+n.x*chip,a[1]+v.y*t+n.y*chip]);}
 }
 boundary.forEach(([x,z],j)=>j?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 let g=new T.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:1,curveSegments:1,steps:1});g.rotateX(-Math.PI/2);g.translate(0,top-thickness,0);
 const source=g.attributes.position,oldNormals=g.attributes.normal,pp=[],flags=[];
 function pushTri(a,b,c,flag,depth=0){
  const lengths=[a.distanceToSquared(b),b.distanceToSquared(c),c.distanceToSquared(a)],m=Math.max(...lengths);
  if(flag&&m>.002025&&depth<15){const k=lengths.indexOf(m);if(k===0){const q=a.clone().add(b).multiplyScalar(.5);pushTri(a,q,c,flag,depth+1);pushTri(q,b,c,flag,depth+1);}else if(k===1){const q=b.clone().add(c).multiplyScalar(.5);pushTri(a,b,q,flag,depth+1);pushTri(a,q,c,flag,depth+1);}else{const q=c.clone().add(a).multiplyScalar(.5);pushTri(a,b,q,flag,depth+1);pushTri(q,b,c,flag,depth+1);}return;}
  for(const q of[a,b,c]){pp.push(q.x,q.y,q.z);flags.push(flag);}
 }
 for(let i=0;i<source.count;i+=3){const pts=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(source,i+j)),flag=[0,1,2].every(j=>oldNormals.getY(i+j)>.85);pushTri(...pts,flag);}
 g.dispose();g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));
 const edgeDistance=(x,z)=>{let d=10;for(let j=0;j<points.length;j++){const a=points[j],b=points[(j+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);d=Math.min(d,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));}return d;};
 // Broad wear changes the actual low-angle silhouette. Chipped joint lips sit
 // below the centres; the metre-scaled shader supplies the smaller aggregate.
 const field=(x,z)=>.0045*(smoothNoise(x*14,z*14,seed)-.5)+.0015*(smoothNoise(x*36,z*36,seed+18)-.5)-.014*(1-T.MathUtils.smoothstep(edgeDistance(x,z),.008,.055))*(.42+.58*smoothNoise(x*24,z*24,seed+39)),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),blend=T.MathUtils.smoothstep(p.getY(i),top-thickness+.015,top-.015);p.setY(i,p.getY(i)+field(x,z)*blend);}
 g.computeVertexNormals();const normals=g.attributes.normal;
 for(let i=0;i<p.count;i++)if(flags[i]){const x=p.getX(i),z=p.getZ(i),e=.002,dx=(field(x+e,z)-field(x-e,z))/(2*e),dz=(field(x,z+e)-field(x,z-e))/(2*e),n=new T.Vector3(-dx,1,-dz).normalize();normals.setXYZ(i,n.x,n.y,n.z);}
 g=applyMetricUV(g);return g;
}
