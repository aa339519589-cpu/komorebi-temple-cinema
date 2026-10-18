import * as T from 'three';

// Procedural woven cloth and painted sixteen-petal crest. The crest is in the
// material of a thin folded sheet, rather than a cluster of thick gold spheres.
export function createNoren(){
 const n=512,mask=new Uint8Array(n*n*4),rough=new Uint8Array(mask.length),height=new Uint8Array(mask.length);
 const coverage=new Float32Array(n*n),aspect=1.45/1.15;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const u=(x+.5)/n,v=(y+.5)/n,dx=u-.5,dy=(v-.5)*aspect,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
  const sector=Math.PI/8,local=angle-Math.round(angle/sector)*sector;
  const along=r*Math.cos(local),across=r*Math.sin(local);
  const ellipse=((along-.145)/.135)**2+(across/.027)**2;
  const petal=1-T.MathUtils.smoothstep(ellipse,.90,1.05),centre=1-T.MathUtils.smoothstep(r,.033,.037);
  const ink=Math.max(petal,centre),i=(y*n+x)*4;coverage[y*n+x]=ink;
  const fibre=(Math.sin(x*Math.PI*.5)+Math.sin(y*Math.PI*.5))*.5;
  const metal=Math.round(ink*255),rr=Math.round(230-ink*65+fibre*3),hh=Math.round(128+fibre*8+ink*3);
  mask[i]=mask[i+1]=mask[i+2]=metal;mask[i+3]=255;
  rough[i]=rough[i+1]=rough[i+2]=rr;rough[i+3]=255;
  height[i]=height[i+1]=height[i+2]=hh;height[i+3]=255;
 }
 const textures=[];
 const texture=(data,srgb=false)=>{const t=new T.DataTexture(data,n,n,T.RGBAFormat);t.flipY=false;if(srgb)t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=8;t.needsUpdate=true;textures.push(t);return t;};
 const metalnessMap=texture(mask),roughnessMap=texture(rough),bumpMap=texture(height);
 const material=background=>{
  const data=new Uint8Array(n*n*4),ink=[211,165,62];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
   const i=(y*n+x)*4,t=coverage[y*n+x],weave=(Math.sin(x*Math.PI*.5)+Math.sin(y*Math.PI*.5))*.55;
   for(let c=0;c<3;c++)data[i+c]=Math.round(background[c]*(1-t)+ink[c]*t+weave);data[i+3]=255;
  }
  return new T.MeshStandardMaterial({name:'woven-noren-with-painted-crest',map:texture(data,true),color:0xffffff,metalness:.9,metalnessMap,roughness:1,roughnessMap,bumpMap,bumpScale:.00022,side:T.DoubleSide});
 };
 const materials=[material([231,222,199]),material([28,32,28])];
 const p=[],uv=[],indices=[],nx=24,ny=36;
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const u=i/nx,t=j/ny,z=.016*Math.sin(u*Math.PI*7+.35)*Math.sin(t*Math.PI*.5);
  p.push(u-.5,-t+.003*Math.sin(u*Math.PI*5)*t*t,z);uv.push(u,1-t);
 }
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;indices.push(a,b,a+1,a+1,b,b+1);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
 return{geometry,materials,textures};
}
