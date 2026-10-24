import * as T from 'three';

const roles={
 beam:{mean:[.12,.034,.0136],bump:.00045},
 beamUnderside:{mean:[.065,.020,.008],bump:.00030},
 rearFrame:{mean:[.055,.020,.008],bump:.00025},
 ceilingWood:{mean:[.135,.054,.026],bump:.00035}
};
const srgbToLinear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
const linearToSrgb=v=>v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055;
const endMaterials=new WeakMap();

export function configureTimberReflectance228(materials,source){
 const image=source.image,w=image.width,h=image.height,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
 const rgba=context.getImageData(0,0,w,h).data,mean=[0,0,0];
 for(let i=0;i<rgba.length;i+=4)for(let c=0;c<3;c++)mean[c]+=srgbToLinear(rgba[i+c]/255)/(w*h);
 const meanL=.2126*mean[0]+.7152*mean[1]+.0722*mean[2];
 function texture(data,name,width=w,height=h){
  const c=document.createElement('canvas');c.width=width;c.height=height;c.getContext('2d').putImageData(new ImageData(data,width,height),0,0);
  const map=new T.CanvasTexture(c);map.name=name;map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.minFilter=T.LinearMipmapLinearFilter;map.magFilter=T.LinearFilter;map.anisotropy=8;return map;
 }
 function endMap(target){
  const n=256,data=new Uint8ClampedArray(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
   const i=(y*n+x)*4,dx=(x/n-.54)*.32,dz=(y/n-.48)*.32;
   const radius=Math.hypot(dx*1.04,dz),rings=Math.sin(radius*1820+2.4*Math.sin(Math.atan2(dz,dx)*3));
   const value=.98+.065*rings+.015*Math.sin(x*2.71+y*4.31);
   for(let c=0;c<3;c++)data[i+c]=Math.round(255*linearToSrgb(target[c]*value*.92));data[i+3]=255;
  }
  return texture(data,'timber228-authored-end-grain',n,n);
 }
 const report={revision:'timber228-r02',sourceLinearMean:mean,roles:{},scope:'Bounded authored wood reflectance targets and metric grain UVs, not a measured reconstruction of the reference illumination'};
 for(const [key,role]of Object.entries(roles)){
  const data=new Uint8ClampedArray(rgba.length);
  for(let i=0;i<rgba.length;i+=4){
   const lum=.2126*srgbToLinear(rgba[i]/255)+.7152*srgbToLinear(rgba[i+1]/255)+.0722*srgbToLinear(rgba[i+2]/255);
   const density=T.MathUtils.clamp(1+.35*(lum/meanL-1),.68,1.32);
   for(let c=0;c<3;c++)data[i+c]=Math.round(255*linearToSrgb(role.mean[c]*density));data[i+3]=255;
  }
  const m=materials[key],before=m.color.toArray();m.color.setRGB(1,1,1);m.map=texture(data,'timber228-'+key+'-bounded-albedo');m.bumpMap=m.map;m.bumpScale=role.bump;
  m.userData.timber228={role:key,authoredTargetLinearMean:role.mean,sourceMean:mean,sourceAlreadyContainsWoodPigment:true,doubleTintRemoved:true,metricGrainAcrossMetres:.32,metricGrainAlongMetres:2.4};m.needsUpdate=true;
  const end=m.clone();end.name=m.name+'-actual-end-grain228';end.map=endMap(role.mean);end.bumpMap=end.map;end.bumpScale=.00015;endMaterials.set(m,end);
  report.roles[key]={beforeTint:before,beforeApproximateLinearMean:mean.map((v,c)=>v*before[c]),authoredMeanTarget:role.mean,materialBaseColor:[1,1,1],roughness:m.roughness,bumpScaleMetres:role.bump};
 }
 return report;
}

export function isTimberRole228(material){return(Array.isArray(material)?material:[material]).some(m=>m.userData.timber228);}

export function bindMetricBoxTimber228(geometry,material,origin=[0,0,0]){
 const list=Array.isArray(material)?[...material]:Array(6).fill(material);
 if(!list.some(m=>m.userData.timber228))return material;
 const size=[geometry.parameters.width,geometry.parameters.height,geometry.parameters.depth],grain=size.indexOf(Math.max(...size)),position=geometry.attributes.position,normal=geometry.attributes.normal,uv=geometry.attributes.uv;
 const seed=Math.sin(origin[0]*12.9898+origin[1]*78.233+origin[2]*19.613)*43758.5453,phase=seed-Math.floor(seed),faceAxes=new Uint8Array(position.count);
 // Rounded corners have diagonal normals on every face. Actual Box/RoundedBox
 // material groups identify its end planes; a corner-normal threshold cannot.
 for(const group of geometry.groups)for(let k=group.start;k<group.start+group.count;k++)faceAxes[geometry.index?geometry.index.getX(k):k]=Math.floor(group.materialIndex/2);
 for(let i=0;i<position.count;i++){
  const p=[position.getX(i),position.getY(i),position.getZ(i)],face=faceAxes[i];
  if(face===grain){const axes=[0,1,2].filter(k=>k!==grain);uv.setXY(i,p[axes[0]]/.32,p[axes[1]]/.32);}
  else{const across=[0,1,2].find(k=>k!==grain&&k!==face);uv.setXY(i,p[across]/.32+phase,p[grain]/2.4+phase*.71);}
 }
 for(const group of geometry.groups){
  if(Math.floor(group.materialIndex/2)===grain&&endMaterials.has(list[group.materialIndex]))list[group.materialIndex]=endMaterials.get(list[group.materialIndex]);
 }
 uv.needsUpdate=true;geometry.userData.metricTimber228={grainAxis:grain,acrossMetres:.32,alongMetres:2.4,actualEndGrainFaces:true};return list;
}
