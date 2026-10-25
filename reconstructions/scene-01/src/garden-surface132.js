import * as T from 'three';
import {noise} from './kernel.js';

// A thin closed skin follows selected scan faces. It is actual moss volume
// attached to the stone, including in shadows and reflected views.
export function mossSkin132(geometry){
 const src=geometry.attributes.position,srcNormal=geometry.attributes.normal,index=geometry.index,points=[],directions=[],topFaces=[],lookup=new Map();
 const point=i=>new T.Vector3().fromBufferAttribute(src,i),normal=i=>new T.Vector3().fromBufferAttribute(srcNormal,i);
 function id(q,n){const key=q.toArray().map(v=>v.toFixed(6)).join(',');if(lookup.has(key))return lookup.get(key);const value=points.length;lookup.set(key,value);points.push(q);directions.push(n.clone().normalize());return value;}
 function patch(q,n){
  const c=q[0].clone().add(q[1]).add(q[2]).multiplyScalar(1/3),up=n[0].y+n[1].y+n[2].y,field=.68*noise(c.x*4.2,c.z*4.2,132)+.32*noise(c.x*13,c.z*13,219);
  if(up<1.45||field<.64)return;topFaces.push(q.map((v,i)=>id(v,n[i])));
 }
 for(let face=0;face<index.count;face+=3){
  const ids=[index.getX(face),index.getX(face+1),index.getX(face+2)],q=ids.map(point),n=ids.map(normal),m=[],mn=[];
  for(let i=0;i<3;i++){const j=(i+1)%3;m.push(q[i].clone().add(q[j]).multiplyScalar(.5));mn.push(n[i].clone().add(n[j]).normalize());}
  patch([q[0],m[0],m[2]],[n[0],mn[0],mn[2]]);patch([m[0],q[1],m[1]],[mn[0],n[1],mn[1]]);patch([m[2],m[1],q[2]],[mn[2],mn[1],n[2]]);patch([m[0],m[1],m[2]],[mn[0],mn[1],mn[2]]);
 }
 const p=[],uv=[],normals=[],ix=[],edges=new Map(),count=points.length;
 const vertex=(q,n)=>{p.push(q.x,q.y,q.z);normals.push(n.x,n.y,n.z);uv.push(q.x*4.5,q.z*4.5);return p.length/3-1;};
 for(const upper of[true,false])for(let i=0;i<count;i++){const q=points[i],n=directions[i],h=upper?.005+.006*noise(q.x*27,q.z*27,321):.0015;vertex(q.clone().addScaledVector(n,h),upper?n:n.clone().negate());}
 for(const face of topFaces){ix.push(...face,face[0]+count,face[2]+count,face[1]+count);for(let k=0;k<3;k++){const a=face[k],b=face[(k+1)%3],key=Math.min(a,b)+','+Math.max(a,b);if(edges.has(key))edges.get(key).uses++;else edges.set(key,{a,b,uses:1});}}
 const get=i=>new T.Vector3(p[i*3],p[i*3+1],p[i*3+2]);
 for(const {a,b,uses}of edges.values())if(uses===1){const loA=get(a+count),loB=get(b+count),hiA=get(a),hiB=get(b),side=new T.Vector3().crossVectors(loB.clone().sub(loA),hiA.clone().sub(loA)).normalize(),j=[vertex(loA,side),vertex(loB,side),vertex(hiA,side),vertex(hiB,side)];ix.push(j[0],j[1],j[2],j[1],j[3],j[2]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.name='surface-conformed-welded-closed-moss-skin132';return g;
}

export function makeLanternGranite132(base){
 const side=512,albedo=new Uint8Array(side*side*4),bump=new Uint8Array(albedo.length),rough=new Uint8Array(albedo.length);
 let state=132219;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
 for(let y=0;y<side;y++)for(let x=0;x<side;x++){
  const i=(y*side+x)*4,r=random(),mineral=noise(x*.41,y*.41,132),broad=noise(x*.023,y*.023,198),dark=r<.12||mineral<.17,light=r>.84;
  const tone=dark?.23+random()*.24:light?.95+random()*.12:.56+.27*mineral+.10*broad;
  albedo[i]=Math.min(255,tone*255);albedo[i+1]=Math.min(255,tone*.97*255);albedo[i+2]=Math.min(255,tone*.90*255);albedo[i+3]=255;
  bump[i]=bump[i+1]=bump[i+2]=(dark?.27:light?.76:.45+.18*random())*255;bump[i+3]=255;
  rough[i]=rough[i+1]=rough[i+2]=(dark?.66:.85+.12*random())*255;rough[i+3]=255;
 }
 const map=(data,srgb)=>{const tex=new T.DataTexture(data,side,side);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(.65,.95);tex.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;tex.generateMipmaps=true;tex.anisotropy=8;tex.needsUpdate=true;return tex;};
 const m=base.clone();m.name='lantern132-crystalline-warm-granite';m.color.setHex(0xaaa79c);m.map=map(albedo,true);m.bumpMap=map(bump,false);m.bumpScale=.006;m.roughnessMap=map(rough,false);m.roughness=.93;m.onBeforeCompile=()=>{};m.customProgramCacheKey=()=> 'lantern132-crystalline-granite-v1';
 const light=m.clone();light.name='lantern132-light-granite-edge';light.color.setHex(0xb8b5aa);
 return {stone:m,light};
}
