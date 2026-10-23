import * as T from 'three';

// Manually observed closed-bud silhouette in the supplied 1254px reference:
// approximate bounds x54..156, y970..1150 (uncertainty about 8px because of
// foreground blur). Depth is retained, not recovered from the photograph.
export const foregroundBudPose98=Object.freeze({
 position:Object.freeze([-2.824303235236658,.4066152839039479,16.45]),
 scale:.4972191802539969,rotation:Object.freeze([0,0,-.26]),
});

export function createLotusBudMaterial98(){
 const width=256,height=512,diffuse=new Uint8Array(width*height*4),relief=new Uint8Array(diffuse.length);
 const stops=[[0,[105,132,52]],[.23,[161,174,87]],[.40,[220,204,160]],[.58,[235,185,204]],[.83,[205,130,171]],[1,[158,82,129]]];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const t=y/(height-1),u=x/width,angle=u*Math.PI*2;
  let k=0;while(k<stops.length-2&&t>stops[k+1][0])k++;
  const f=T.MathUtils.smoothstep(t,stops[k][0],stops[k+1][0]),a=stops[k][1],b=stops[k+1][1];
  // Fine longitudinal tissue follows the bud's cylindrical UVs. Five curved
  // overlap lines belong to petal edges, rather than noise lit as hard ribs.
  const fold=Math.pow(Math.max(0,Math.cos(angle*5+.18*Math.sin(t*4))),36)*Math.sin(Math.PI*t),vein=Math.pow(Math.max(0,Math.cos(angle*51+.8*Math.sin(t*7+angle*3))),22),grain=Math.sin(x*12.71+y*1.27)*Math.sin(x*3.17-y*2.13),shade=1-.065*fold-.016*vein+.004*grain,at=(y*width+x)*4;
  for(let c=0;c<3;c++)diffuse[at+c]=Math.round((a[c]+(b[c]-a[c])*f)*shade);
  const h=128-30*fold+3*vein;relief[at]=relief[at+1]=relief[at+2]=h;diffuse[at+3]=relief[at+3]=255;
 }
 const texture=(data,srgb)=>{const t=new T.DataTexture(data,width,height,T.RGBAFormat);t.flipY=false;t.wrapS=T.RepeatWrapping;if(srgb)t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=8;t.needsUpdate=true;return t;};
 const map=texture(diffuse,true),bump=texture(relief,false),material=new T.MeshPhysicalMaterial({name:'closed-bud-green-sepal-to-rose-tissue98',color:0xffffff,map,bumpMap:bump,bumpScale:.00018,roughness:.57,metalness:0,clearcoat:.025,clearcoatRoughness:.65,sheen:.14,sheenRoughness:.8,sheenColor:new T.Color('#ead6df'),specularIntensity:.25,side:T.FrontSide});
 material.userData={source:'Authored longitudinal tissue and five petal-overlap traces; not a photograph or measured botanical scan',photographicAcceptance:false};
 return{material,textures:[map,bump]};
}
