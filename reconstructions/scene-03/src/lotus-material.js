import * as T from 'three';

export function createLotusPetalMaterials(){
 const width=128,height=512,bytes=new Uint8Array(width*height*4);
 const base=[253,230,220],middle=[249,197,218],tip=[231,150,183];
 const smooth=x=>x*x*(3-2*x);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const t=y/(height-1),u=x/(width-1),a=t<.56?base:middle,b=t<.56?middle:tip;
  const blend=smooth(t<.56?t/.56:(t-.56)/.44);
  const vessel=Math.exp(-Math.pow(Math.sin((u*11+.08*Math.sin(t*5))*Math.PI),2)*160)*Math.sin(t*Math.PI)*2.8;
  const fine=.45*Math.sin(x*12.81+y*1.17),at=(y*width+x)*4;
  for(let c=0;c<3;c++)bytes[at+c]=Math.round(a[c]+(b[c]-a[c])*blend-vessel+fine);
  bytes[at+3]=255;
 }
 const texture=new T.DataTexture(bytes,width,height,T.RGBAFormat);
 texture.name='procedural-ivory-base-pink-petal-tips';texture.flipY=false;
 texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=true;
 texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;
 texture.anisotropy=4;texture.needsUpdate=true;
 const materials=['#ffffff','#fff7fb','#fffafd'].map((color,i)=>new T.MeshPhysicalMaterial({
  name:'curved lotus petal '+i,color,map:texture,bumpMap:texture,bumpScale:.00012,
  roughness:.56,metalness:0,sheen:.15,sheenRoughness:.72,
  sheenColor:new T.Color('#ffe5ed'),specularIntensity:.25,clearcoat:0,clearcoatRoughness:.68,side:T.FrontSide
 }));
 for(const material of materials){material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
  vec3 petalSun=normalize((viewMatrix*vec4(-.4472,.7826,.4472,0.)).xyz);
  float transmittedPetalLight=pow(max(0.,dot(-normal,petalSun)),1.4)*.22;
  reflectedLight.indirectDiffuse+=diffuseColor.rgb*transmittedPetalLight;`);};material.customProgramCacheKey=()=> 'reference03-closed-lotus-petal-light-mesh64';}
 return{materials,texture};
}

export async function createLotusLeafMaterial(){
 const size=512,c=new Uint8Array(size*size*4),h=new Uint8Array(c.length);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=(x/(size-1)-.5)*2,v=(y/(size-1)-.5)*2,r=Math.hypot(u,v),a=Math.atan2(v,u),primary=Math.pow(Math.max(0,Math.cos(a*19+.10*Math.sin(r*5))),24),secondary=Math.pow(Math.max(0,Math.cos(r*95+Math.sin(a*19)*3)),24),grain=Math.sin(x*12.713+y*3.713)*43758.5453%1,q=.91+.035*Math.sin(a*3+r*6)-.055*primary-.012*secondary+.008*grain,i=(y*size+x)*4;
  c[i]=Math.min(255,249*q);c[i+1]=Math.min(255,255*q);c[i+2]=Math.min(255,235*q);c[i+3]=255;
  const hh=128+28*primary+5*secondary+3*grain;h[i]=h[i+1]=h[i+2]=hh;h[i+3]=255;
 }
 const tex=(bytes,srgb)=>{const t=new T.DataTexture(bytes,size,size,T.RGBAFormat);if(srgb)t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=8;t.needsUpdate=true;return t;};
 const root=new URL('../assets/lotus-leaf96/',import.meta.url),record=await(await fetch(new URL('material.json',root))).json();
 const albedo=await new T.TextureLoader().loadAsync(new URL('neutral-leaf-diffuse-v01.png',root).href);albedo.name='generated-neutral-peltate-leaf-tissue96';albedo.colorSpace=T.SRGBColorSpace;albedo.flipY=false;albedo.generateMipmaps=true;albedo.minFilter=T.LinearMipmapLinearFilter;albedo.magFilter=T.LinearFilter;albedo.anisotropy=8;
 const bump=tex(h,false),color=new T.Color().setRGB(...record.materialLinearColorGain),material=new T.MeshPhysicalMaterial({name:'closed-lotus-leaf-waxy-cuticle-fine-tissue96',color,map:albedo,bumpMap:bump,bumpScale:.00045,vertexColors:true,roughness:.48,metalness:0,clearcoat:.08,clearcoatRoughness:.58,sheen:.13,sheenRoughness:.8,sheenColor:new T.Color('#adc482'),side:T.FrontSide});
 material.userData.atlasStudy={asset:'lotus-leaf96',inputImageSize:record.imageSize,meanLinearAlbedo:record.targetMeanLinearRGB,generatedMaterialGuide:true,referenceRGBProjected:false,photographicAcceptance:false};
 return{material,textures:[albedo,bump]};
}
