import * as T from 'three';
const fract=x=>x-Math.floor(x);
const hash=(x,z,s=1)=>fract(Math.sin(x*127.1+z*311.7+s*13.7)*43758.5453);
function smoothNoise(x,z,s=1){const a=Math.floor(x),b=Math.floor(z),u=x-a,v=z-b,U=u*u*(3-2*u),V=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(a,b,s),hash(a+1,b,s),U),T.MathUtils.lerp(hash(a,b+1,s),hash(a+1,b+1,s),U),V);}
function periodicNoise(x,z,period,seed,size=512){const u=x/size*period,v=z/size*period,a=Math.floor(u),b=Math.floor(v),f=u-a,g=v-b,U=f*f*(3-2*f),V=g*g*(3-2*g),wrap=k=>((k%period)+period)%period;return T.MathUtils.lerp(T.MathUtils.lerp(hash(wrap(a),wrap(b),seed),hash(wrap(a+1),wrap(b),seed),U),T.MathUtils.lerp(hash(wrap(a),wrap(b+1),seed),hash(wrap(a+1),wrap(b+1),seed),U),V);}
export function metricStoneMaps(seed=1,size=512){
 const albedo=new Uint8Array(size*size*4),rough=new Uint8Array(albedo.length),normal=new Uint8Array(albedo.length),height=new Float32Array(size*size);
 // One texture repeat is 250 mm. Quartz/feldspar crystals are 0.5–2 mm,
 // never the centimetre gravel formerly stretched once across an entire slab.
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const i=z*size+x,q=hash(x,z,seed),wx=x+27*(periodicNoise(x,z,4,seed+52,size)-.5),wz=z+25*(periodicNoise(x,z,5,seed+63,size)-.5),meso=periodicNoise(x,z,9,seed+9,size),granule=.67*periodicNoise(wx,wz,29,seed+17,size)+.33*periodicNoise(wx,wz,61,seed+45,size),quartz=T.MathUtils.smoothstep(granule,.61,.78),mica=T.MathUtils.smoothstep(periodicNoise(wx,wz,47,seed+33,size),.61,.79),f=.78+.28*(meso-.5)+.16*(granule-.5)+.05*(q-.5)+.17*quartz-.16*mica;
  albedo[i*4]=Math.min(255,255*f);albedo[i*4+1]=Math.min(255,247*f);albedo[i*4+2]=Math.min(255,230*f);albedo[i*4+3]=255;
  const rr=221+26*granule-23*quartz;rough[i*4]=rough[i*4+1]=rough[i*4+2]=rr;rough[i*4+3]=255;height[i]=.5+.17*(granule-.5)+.11*(meso-.5)+.055*(q-.5)-.05*mica;
 }
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const i=z*size+x,dx=(height[z*size+(x+1)%size]-height[z*size+(x+size-1)%size])*5.8,dz=(height[((z+1)%size)*size+x]-height[((z+size-1)%size)*size+x])*5.8,v=new T.Vector3(-dx,-dz,1).normalize();normal[i*4]=(v.x*.5+.5)*255;normal[i*4+1]=(v.y*.5+.5)*255;normal[i*4+2]=(v.z*.5+.5)*255;normal[i*4+3]=255;
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
 const maps=metricStoneMaps(seed),m=new T.MeshPhysicalMaterial({name,color,...maps,roughness,normalScale:new T.Vector2(.70,.70),metalness:0,clearcoat:0});
 m.onBeforeCompile=shader=>{
  m.userData.compiledShader=shader;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 ssPosition;').replace('#include <project_vertex>',`vec4 ssP=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nssP=instanceMatrix*ssP;\n#endif\nssPosition=(modelMatrix*ssP).xyz;\n#include <project_vertex>`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 ssPosition;\n'+shaderNoise)
   .replace('#include <color_fragment>',`#include <color_fragment>\nfloat ssMacro=ssNoise(ssPosition.xz*.73)+.5*ssNoise(ssPosition.xy*2.41);diffuseColor.rgb*=.76+.23*ssMacro;`)
   .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\n${wet?'float ssWet=smoothstep(.53,.76,ssNoise(ssPosition.xz*.93+vec2(7.3,1.1))+.18*ssNoise(ssPosition.xz*3.1));roughnessFactor=mix(roughnessFactor,.19,ssWet*.88);diffuseColor.rgb*=1.0-.23*ssWet;':''}`);
 };
 m.customProgramCacheKey=()=>`scene04-metric-stone-meso-r4-${wet}`;m.userData.physicalTextureRepeatMetres=.25;m.userData.maps=maps;return m;
}
export function polygonSlab(outline,top=.045,thickness=.075,seed=1){
 const cx=outline.reduce((a,p)=>a+p[0],0)/outline.length,cz=outline.reduce((a,p)=>a+p[1],0)/outline.length,points=outline.map(([x,z])=>{const r=Math.hypot(x-cx,z-cz);return[x+(cx-x)*.012/r,z+(cz-z)*.012/r];}),shape=new T.Shape();
 const boundary=[];
 for(let j=0;j<points.length;j++){
  const a=points[j],b=points[(j+1)%points.length],v=new T.Vector2(b[0]-a[0],b[1]-a[1]),len=v.length(),n=new T.Vector2(-v.y,v.x).normalize();
  for(const t of [.025,.32,.66,.975]){const chip=t===.32||t===.66?(hash(j,t,seed)-.5)*.013:0;boundary.push([a[0]+v.x*t+n.x*chip,a[1]+v.y*t+n.y*chip]);}
 }
 boundary.forEach(([x,z],j)=>j?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 let g=new T.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:1,curveSegments:1,steps:1});g.rotateX(-Math.PI/2);g.translate(0,top-thickness,0);
 const source=g.attributes.position,oldNormals=g.attributes.normal,pp=[],flags=[];
 function pushTri(a,b,c,flag,depth=0){
  const lengths=[a.distanceToSquared(b),b.distanceToSquared(c),c.distanceToSquared(a)],m=Math.max(...lengths);
  if(flag&&m>.0121&&depth<12){const k=lengths.indexOf(m);if(k===0){const q=a.clone().add(b).multiplyScalar(.5);pushTri(a,q,c,flag,depth+1);pushTri(q,b,c,flag,depth+1);}else if(k===1){const q=b.clone().add(c).multiplyScalar(.5);pushTri(a,b,q,flag,depth+1);pushTri(a,q,c,flag,depth+1);}else{const q=c.clone().add(a).multiplyScalar(.5);pushTri(a,b,q,flag,depth+1);pushTri(q,b,c,flag,depth+1);}return;}
  for(const q of[a,b,c]){pp.push(q.x,q.y,q.z);flags.push(flag);}
 }
 for(let i=0;i<source.count;i+=3){const pts=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(source,i+j)),flag=[0,1,2].every(j=>oldNormals.getY(i+j)>.85);pushTri(...pts,flag);}
 g.dispose();g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));
 const field=(x,z)=>.0046*(.65*smoothNoise(x*19,z*19,seed)+.35*smoothNoise(x*47,z*47,seed+18)-.5),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),blend=T.MathUtils.smoothstep(p.getY(i),top-thickness+.015,top-.015);p.setY(i,p.getY(i)+field(x,z)*blend);}
 g.computeVertexNormals();const normals=g.attributes.normal;
 for(let i=0;i<p.count;i++)if(flags[i]){const x=p.getX(i),z=p.getZ(i),e=.002,dx=(field(x+e,z)-field(x-e,z))/(2*e),dz=(field(x,z+e)-field(x,z-e))/(2*e),n=new T.Vector3(-dx,1,-dz).normalize();normals.setXYZ(i,n.x,n.y,n.z);}
 g=applyMetricUV(g);return g;
}
