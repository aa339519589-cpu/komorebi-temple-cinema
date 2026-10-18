import * as T from 'three';
const fract=x=>x-Math.floor(x);
const hash=(x,z,s=1)=>fract(Math.sin(x*127.1+z*311.7+s*13.7)*43758.5453);
function smoothNoise(x,z,s=1){const a=Math.floor(x),b=Math.floor(z),u=x-a,v=z-b,U=u*u*(3-2*u),V=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(a,b,s),hash(a+1,b,s),U),T.MathUtils.lerp(hash(a,b+1,s),hash(a+1,b+1,s),U),V);}
export function metricStoneMaps(seed=1,size=512){
 const albedo=new Uint8Array(size*size*4),rough=new Uint8Array(albedo.length),normal=new Uint8Array(albedo.length),height=new Float32Array(size*size);
 // One texture repeat is 250 mm. Quartz/feldspar crystals are 0.5–2 mm,
 // never the centimetre gravel formerly stretched once across an entire slab.
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const i=z*size+x,q=hash(x,z,seed),coarse=smoothNoise(x*.16,z*.16,seed+9),mica=q<.075?.12:0,quartz=q>.89?.08:0,f=.84+.075*(coarse-.5)+.045*(q-.5)-mica+quartz;
  albedo[i*4]=Math.min(255,255*f);albedo[i*4+1]=Math.min(255,250*f);albedo[i*4+2]=Math.min(255,240*f);albedo[i*4+3]=255;
  const rr=235+15*(q-.5);rough[i*4]=rough[i*4+1]=rough[i*4+2]=rr;rough[i*4+3]=255;height[i]=.5+.07*(q-.5)+.03*(coarse-.5);
 }
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const i=z*size+x,dx=(height[z*size+(x+1)%size]-height[z*size+(x+size-1)%size])*.32,dz=(height[((z+1)%size)*size+x]-height[((z+size-1)%size)*size+x])*.32,v=new T.Vector3(-dx,-dz,1).normalize();normal[i*4]=(v.x*.5+.5)*255;normal[i*4+1]=(v.y*.5+.5)*255;normal[i*4+2]=(v.z*.5+.5)*255;normal[i*4+3]=255;
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
 const maps=metricStoneMaps(seed),m=new T.MeshPhysicalMaterial({name,color,...maps,roughness,normalScale:new T.Vector2(.32,.32),metalness:0,clearcoat:0});
 m.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 ssPosition;').replace('#include <project_vertex>',`vec4 ssP=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nssP=instanceMatrix*ssP;\n#endif\nssPosition=(modelMatrix*ssP).xyz;\n#include <project_vertex>`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 ssPosition;\n'+shaderNoise)
   .replace('#include <color_fragment>',`#include <color_fragment>\nfloat ssMacro=ssNoise(ssPosition.xz*.73)+.5*ssNoise(ssPosition.xz*2.41);diffuseColor.rgb*=.83+.16*ssMacro;`)
   .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\n${wet?'float ssWet=smoothstep(.53,.76,ssNoise(ssPosition.xz*.93+vec2(7.3,1.1))+.18*ssNoise(ssPosition.xz*3.1));roughnessFactor=mix(roughnessFactor,.19,ssWet*.88);diffuseColor.rgb*=1.0-.23*ssWet;':''}`);
 };
 m.customProgramCacheKey=()=>`scene04-metric-stone-${wet}`;m.userData.physicalTextureRepeatMetres=.25;m.userData.maps=maps;return m;
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
 const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,p.getY(i)+.002*Math.sin(x*3.9+seed)*Math.sin(z*5.1-seed));}g.computeVertexNormals();g=applyMetricUV(g);return g;
}
