import * as T from 'three';

// A separate CC0 material scan, never the supplied temple photograph.  The
// same sampled relief controls the closed terrain and its root insertions.
export async function installRootSurfaces108({bankEarth,textures}){
 const root=new URL('../assets/forest-floor108/',import.meta.url),loader=new T.TextureLoader();
 const [albedo,normal,rough,height]=await Promise.all(['diffuse-2k.jpg','normal-gl-2k.jpg','roughness-2k.jpg','displacement-2k.jpg'].map(x=>loader.loadAsync(new URL(x,root).href)));
 for(const [i,t]of [albedo,normal,rough,height].entries()){
  t.name='scene03-CC0-mossy-root-floor108-'+i;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;
  if(i===0)t.colorSpace=T.SRGBColorSpace;textures.add(t);
 }
 bankEarth.name='scene03-continuous-moss-litter-earth108';bankEarth.color.set('#7f9467');
 bankEarth.map=albedo;bankEarth.normalMap=normal;bankEarth.normalScale.set(.70,.70);
 bankEarth.bumpMap=null;bankEarth.roughnessMap=rough;bankEarth.roughness=.94;bankEarth.metalness=0;
 bankEarth.userData.independentSurface={provider:'Poly Haven / Rob Tuytel',asset:'forest_leaves_02',license:'CC0-1.0',tileMetres:3,referencePhotoUsed:false,geometricReliefMetres:.052};
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(height.image,0,0,512,512);
 const bytes=ctx.getImageData(0,0,512,512).data,fract=x=>x-Math.floor(x);
 const sample=(x,z)=>{
  const u=fract(x/3)*511,v=(1-fract(z/3))*511,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,
   h=(xx,yy)=>bytes[(yy*512+xx)*4]/255;
  return T.MathUtils.lerp(T.MathUtils.lerp(h(i,j),h((i+1)%512,j),a),T.MathUtils.lerp(h(i,(j+1)%512),h((i+1)%512,(j+1)%512),a),b);
 };
 return{reliefAt:(x,z)=>(sample(x,z)-.48)*.052,info:{revision:108,physicalTileMetres:3,reliefAmplitudeMetres:.052,provenance:'reconstructions/scene-03/assets/forest-floor108/provenance.json',referenceImageTexture:false}};
}

export function createRootMoss108(seed=0){
 const p=[],uv=[],ids=[];
 for(let k=0;k<17;k++){
  const a=k*2.399963+seed*.6,r=.018+.066*((k*.6180339+seed*.13)%1),x=Math.cos(a)*r,z=Math.sin(a)*r,h=.014+.027*((k*.41421356+seed*.17)%1),n=p.length/3;
  for(let j=0;j<4;j++){
   const y=h*j/3,lean=.18*y,half=.0038*(1-j/4);
   p.push(x+Math.cos(a)*lean-Math.sin(a)*half,y,z+Math.sin(a)*lean+Math.cos(a)*half,x+Math.cos(a)*lean+Math.sin(a)*half,y,z+Math.sin(a)*lean-Math.cos(a)*half);
   uv.push(0,j/3,1,j/3);if(j<3)ids.push(n+j*2,n+j*2+2,n+j*2+1,n+j*2+1,n+j*2+2,n+j*2+3);
  }
  // The short side fronds belong to this same stem, below the capillary tip.
  for(let sign of[-1,1])for(let j=1;j<4;j++){
   const q=p.length/3,y=h*j/4,l=.008*(1-j/5),nx=-Math.sin(a)*sign,nz=Math.cos(a)*sign;
   p.push(x,y-.003,z,x+nx*l,y+.002,z+nz*l,x,y+.004,z);uv.push(.5,0,0,1,1,1);ids.push(q,q+1,q+2);
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.name='scene03-root-contact-moss-fronds108-'+seed;
 g.userData={authoredBotanicalGeometry:true,referencePhotoUsed:false,scaleMetres:[.014,.041],rootedOnSameClosedSoil:true};return g;
}
