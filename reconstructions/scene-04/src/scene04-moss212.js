import * as T from 'three';

// Small, independently lit adhered moss clumps on the actual authored stone.
// Positions and normals are sampled from that stone, not a photograph or card.
const hash=(x,y,z,s=1)=>{const q=Math.sin(x*127.1+y*311.7+z*74.7+s*17.13)*43758.5453;return q-Math.floor(q);};
function noise(x,y,z,s=1){const a=Math.floor(x),b=Math.floor(y),c=Math.floor(z),u=x-a,v=y-b,w=z-c,U=u*u*(3-2*u),V=v*v*(3-2*v),W=w*w*(3-2*w),l=T.MathUtils.lerp;return l(l(l(hash(a,b,c,s),hash(a+1,b,c,s),U),l(hash(a,b+1,c,s),hash(a+1,b+1,c,s),U),V),l(l(hash(a,b,c+1,s),hash(a+1,b,c+1,s),U),l(hash(a,b+1,c+1,s),hash(a+1,b+1,c+1,s),U),V),W);}
export function adheredMossGeometry212(g,seed){
 const cap=!!g.userData.seat212,source=g.index?g.toNonIndexed():g,p=source.attributes.position,n=source.attributes.normal,pp=[],nn=[],uv=[],colors=[],coverage=[];let tufts=0;
 const sample=i=>{const q=new T.Vector3().fromBufferAttribute(p,i),normal=new T.Vector3().fromBufferAttribute(n,i),f=cap?.58*noise(q.x*9,q.y*6,q.z*9,seed)+.42*noise(q.x*31,q.y*27,q.z*31,seed+7)+.18*noise(q.x*81,q.y*77,q.z*81,seed+13)-.68:noise(q.x*5.4,q.y*2.5,q.z*5.4,seed)+.24*noise(q.x*21,q.y*19,q.z*21,seed+7)+.12*noise(q.x*61,q.y*57,q.z*61,seed+13)-.710;return{q,normal,f:Math.min(f,(normal.y-.13)*.6)};};
 const push=(q,normal,f,tone=1)=>{pp.push(...q.toArray());nn.push(...normal.toArray());uv.push(q.x*4,q.z*4);const age=(.60+.34*noise(q.x*93,q.y*87,q.z*93,seed+19))*tone;colors.push(age*.91,age,age*.54);coverage.push(f);};
 for(let i=0;i<p.count;i+=3){
  const tri=[0,1,2].map(k=>sample(i+k)),poly=[];
  for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],aa=a.f>=0,bb=b.f>=0;if(aa)poly.push(a);if(aa!==bb){const t=a.f/(a.f-b.f);poly.push({q:a.q.clone().lerp(b.q,t),normal:a.normal.clone().lerp(b.normal,t).normalize(),f:0});}}
  for(let k=1;k<poly.length-1;k++){
   const vertices=[poly[0],poly[k],poly[k+1]];
   for(const v of vertices)push(v.q.clone().addScaledVector(v.normal,.0016),v.normal,v.f);
   // Actual millimetre clumps break the skin silhouette and shade each other.
   const q=vertices.reduce((q,v)=>q.add(v.q),new T.Vector3()).multiplyScalar(1/3),normal=vertices.reduce((q,v)=>q.add(v.normal),new T.Vector3()).normalize(),f=vertices.reduce((s,v)=>s+v.f,0)/3;
   if(f<.012||hash(q.x,q.y,q.z,seed+47)>.83)continue;
   const tangent=new T.Vector3(1,0,0).cross(normal).normalize(),bitangent=new T.Vector3().crossVectors(normal,tangent),radius=.0027+.0035*hash(q.x,q.y,q.z,seed+53),height=.0020+.0035*hash(q.x,q.y,q.z,seed+59),centre=q.clone().addScaledVector(normal,.0012),apex=centre.clone().addScaledVector(normal,height),phase=hash(q.x,q.y,q.z,seed+61)*Math.PI*2;
   for(let side=0;side<5;side++){
    const a=phase+side*Math.PI*2/5,b=a+Math.PI*2/5,point=t=>centre.clone().addScaledVector(tangent,Math.cos(t)*radius).addScaledVector(bitangent,Math.sin(t)*radius);
    for(const[v,tilt]of[[point(a),a],[point(b),b],[apex,null]]){const shading=tilt===null?normal:normal.clone().addScaledVector(tangent,.38*Math.cos(tilt)).addScaledVector(bitangent,.38*Math.sin(tilt)).normalize();push(v,shading,.12,.78+.34*hash(q.x,q.y,q.z,seed+side+71));}
   }
   tufts++;
  }
 }
 if(source!==g)source.dispose();const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(pp,3));result.setAttribute('normal',new T.Float32BufferAttribute(nn,3));result.setAttribute('uv',new T.Float32BufferAttribute(uv,2));result.setAttribute('color',new T.Float32BufferAttribute(colors,3));result.setAttribute('moss212Coverage',new T.Float32BufferAttribute(coverage,1));result.userData.adheredMoss212={tufts,underlayOffsetMetres:.0016,tuftHeightMetres:[.0020,.0055],sourceNormalsRetained:true,closedStoneClaim:false};return result;
}
export function createAdheredMossMaterial212(){
 const material=new T.MeshStandardMaterial({name:'scene04-212-actual-granular-adhered-moss',color:'#35431e',roughness:1,vertexColors:true,side:T.DoubleSide});
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\nattribute float moss212Coverage;varying float vMoss212Coverage;varying vec3 vMoss212Position;`).replace('#include <project_vertex>',`vMoss212Coverage=moss212Coverage;vMoss212Position=(modelMatrix*vec4(transformed,1.)).xyz;\n#include <project_vertex>`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying float vMoss212Coverage;varying vec3 vMoss212Position;
   float moss212Hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   float moss212Noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(moss212Hash(i),moss212Hash(i+vec3(1,0,0)),f.x),mix(moss212Hash(i+vec3(0,1,0)),moss212Hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(moss212Hash(i+vec3(0,0,1)),moss212Hash(i+vec3(1,0,1)),f.x),mix(moss212Hash(i+vec3(0,1,1)),moss212Hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  `).replace('#include <color_fragment>',`#include <color_fragment>
   float moss212Grain=moss212Noise(vMoss212Position*330.);
   if(vMoss212Coverage<.024*(moss212Grain-.28))discard;
   diffuseColor.rgb*=.57+.67*moss212Grain;
  `);
 };
 material.customProgramCacheKey=()=> 'scene04-212-source-normal-frayed-granular-moss-r05';return material;
}
