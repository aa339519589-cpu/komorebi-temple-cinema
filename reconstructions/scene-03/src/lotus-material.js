import * as T from 'three';

export function createLotusPetalMaterials(){
 const width=128,height=512,bytes=new Uint8Array(width*height*4);
 const base=[255,245,224],middle=[253,211,224],tip=[230,151,184];
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
  roughness:.66,metalness:0,sheen:.12,sheenRoughness:.85,
  sheenColor:new T.Color('#ffe5ed'),specularIntensity:.30,clearcoat:0,side:T.DoubleSide
 }));
 for(const material of materials){material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
  vec3 petalSun=normalize((viewMatrix*vec4(-.4472,.7826,.4472,0.)).xyz);
  float transmittedPetalLight=pow(max(0.,dot(-normal,petalSun)),1.4)*.22;
  reflectedLight.indirectDiffuse+=diffuseColor.rgb*transmittedPetalLight;`);};material.customProgramCacheKey=()=> 'reference03-lotus-thin-petal-light-38';}
 return{materials,texture};
}
