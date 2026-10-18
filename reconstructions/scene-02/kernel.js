import * as T from 'three';
export {T};
export let seed=22018;
export function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
export const V=a=>new T.Vector3(...a),mix=(a,b,t)=>a+(b-a)*t;
export function materials(){
 const mats={},textures=[]; const noise=(x,y)=>{const h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h);};
 function tex(kind,bump=false){const n=256,d=new Uint8Array(n*n*4);for(let j=0;j<n;j++)for(let i=0;i<n;i++){let v=kind==='wood'?.5+.2*Math.sin(i*.25+Math.sin(j*.025)*2+noise(i>>3,j>>3)*.7)+.10*Math.sin(i*1.8+j*.014):.5+.17*noise(i,j)+.15*noise(i>>2,j>>2)+.11*Math.sin(i*.13+j*.2);let k=(j*n+i)*4,c=255*(bump?v:.73+.27*v);d[k]=d[k+1]=d[k+2]=c;d[k+3]=255;}const t=new T.DataTexture(d,n,n);t.needsUpdate=true;t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.colorSpace=bump?T.NoColorSpace:T.SRGBColorSpace;textures.push(t);return t;}
 const wood=tex('wood'),grain=tex('wood',true),stone=tex('stone'),stoneBump=tex('stone',true);
 const palette={red:[0x742917,.3,0],cedar:[0x6d2e14,.40,0],darkwood:[0x20120b,.53,0],gold:[0xd5ae5a,.26,.86],oldgold:[0x996b25,.44,.7],slate:[0x3c516b,.46,.03],tileEnd:[0x69747c,.5,.14],stone:[0x8c8b7c,.87,0],lightstone:[0xb4b09e,.83,0],black:[0x111311,.5,.1],leaf:[0x263b16,.78,0],leaflight:[0x4c6125,.72,0],moss:[0x586122,.95,0],trunk:[0x514028,.92,0],pink:[0xf3a4ad,.58,0],pinkDark:[0xbf5573,.6,0],petal:[0xf9b4bb,.48,0],water:[0x182d20,.13,.42],paper:[0xffd28a,.62,0]};
 for(const [n,[color,roughness,metalness]]of Object.entries(palette)){const m=new T.MeshStandardMaterial({color,roughness,metalness});m.name='scene02-'+n;if(['red','cedar','darkwood','trunk'].includes(n))Object.assign(m,{map:wood,bumpMap:grain,bumpScale:n==='trunk'?.08:.008});if(['slate','stone','lightstone'].includes(n))Object.assign(m,{map:stone,bumpMap:stoneBump,bumpScale:n==='slate'?.025:.07});if(['gold','oldgold'].includes(n))Object.assign(m,{bumpMap:stoneBump,bumpScale:.0012});if(n==='paper')Object.assign(m,{emissive:0xff9b35,emissiveIntensity:2.2,side:T.DoubleSide});if(n==='petal')m.side=T.DoubleSide;mats[n]=m;}
 mats.floor=mats.darkwood.clone();Object.assign(mats.floor,{roughness:.16,metalness:.2});
 return {mats,textures};
}
export class Builder{
 constructor(mats){this.mats=mats;this.group=new T.Group();this.buckets=new Map();this.stack=[new T.Matrix4()];this.cube=new T.BoxGeometry();this.cylinderGeo=new T.CylinderGeometry(1,1,1,16);this.sphere=new T.SphereGeometry(1,10,7);this.lowSphere=new T.IcosahedronGeometry(1,1);this.count=0;}
 put(g,ma,p=[0,0,0],s=[1,1,1],r=[0,0,0],color=1){let m=typeof ma==='string'?this.mats[ma]:ma;if(!m)throw Error('Unknown material '+ma);let key=g.uuid+':'+m.uuid,b=this.buckets.get(key);if(!b){b={g,m,items:[]};this.buckets.set(key,b);}const matrix=new T.Matrix4().compose(V(p),new T.Quaternion().setFromEuler(new T.Euler(...r)),V(s));matrix.premultiply(this.stack.at(-1));if(!matrix.elements.every(Number.isFinite))throw Error('Nonfinite transform');b.items.push({matrix,color});this.count++;return matrix;}
 box(x,y,z,w,h,d,ma='red',r=0,c=1){this.put(this.cube,ma,[x,y,z],[w,h,d],Array.isArray(r)?r:[0,r,0],c);}
 cyl(x,y,z,r,h,ma='red',c=1){this.put(this.cylinderGeo,ma,[x,y,z],[r,h,r],[0,0,0],c);}
 ball(x,y,z,rx,ry,rz,ma='gold',c=1){this.put(this.sphere,ma,[x,y,z],[rx,ry,rz],[0,0,0],c);}
 line(a,b,r,ma='red',square=false,d=r){let va=V(a),vb=V(b),delta=vb.clone().sub(va),g=square?this.cube:this.cylinderGeo,m=new T.Matrix4().compose(va.add(vb).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(V([0,1,0]),delta.clone().normalize()),V([r,delta.length(),d]));m.premultiply(this.stack.at(-1));const key=g.uuid+':'+this.mats[ma].uuid;let bucket=this.buckets.get(key);if(!bucket){bucket={g,m:this.mats[ma],items:[]};this.buckets.set(key,bucket);}bucket.items.push({matrix:m,color:1});this.count++;}
 at(p,yaw,fn,scale=1){const m=new T.Matrix4().compose(V(p),new T.Quaternion().setFromAxisAngle(V([0,1,0]),yaw),V([scale,scale,scale]));this.stack.push(this.stack.at(-1).clone().multiply(m));fn();this.stack.pop();}
 tube(points,r,ma='gold',segments=24){this.put(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(V)),segments,r,6,false),ma);}
 finish(){for(const {g,m,items}of this.buckets.values()){const mesh=new T.InstancedMesh(g,m,items.length);for(let i=0;i<items.length;i++){mesh.setMatrixAt(i,items[i].matrix);mesh.setColorAt(i,new T.Color().setScalar(items[i].color));}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;this.group.add(mesh);}return this.group;}
}
export function gridGeometry(rows){const pos=[],uv=[],idx=[],nx=rows[0].length;for(let j=0;j<rows.length;j++)for(let i=0;i<nx;i++){pos.push(...rows[j][i]);uv.push(i/(nx-1),j/(rows.length-1));}for(let j=0;j<rows.length-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,c=a+nx,d=c+1;idx.push(a,c,b,b,c,d);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
