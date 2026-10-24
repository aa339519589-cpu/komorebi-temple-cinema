import * as T from 'three';
import {EXRLoader} from 'three/addons/loaders/EXRLoader.js';

// Licensed measured SKY radiance, not a reference photograph, scene plate or
// model substitute. The unchanged source asset/provenance are hash-declared.
export async function installMeasuredSky(scene,targetDirection,{environmentIntensity=.14,backgroundIntensity=1.6}={}){
 const path='/reconstructions/scene-05/assets/kloofendal-48d-sky/sky-2k.exr',texture=await new EXRLoader().setDataType(T.FloatType).loadAsync(path);
 texture.mapping=T.EquirectangularReflectionMapping;texture.colorSpace=T.LinearSRGBColorSpace;
 const {data,width,height}=texture.image,channels=data.length/(width*height);let maximum=-Infinity,at=0,mean=0;
 for(let i=0;i<width*height;i++){const l=.2126*data[i*channels]+.7152*data[i*channels+1]+.0722*data[i*channels+2];mean+=l;if(l>maximum){maximum=l;at=i;}}
 // Three's equirectUv: u=atan(z,x)/2pi+.5, v=asin(y)/pi+.5.
 const u=(at%width+.5)/width,v=(Math.floor(at/width)+.5)/height,az=(u-.5)*Math.PI*2,alt=(v-.5)*Math.PI,
   source=new T.Vector3(Math.cos(alt)*Math.cos(az),Math.sin(alt),Math.cos(alt)*Math.sin(az)),target=targetDirection.clone().normalize(),targetAz=Math.atan2(target.z,target.x),
   yaw=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),az-targetAz),aligned=source.clone().applyQuaternion(yaw),tilt=new T.Quaternion().setFromUnitVectors(aligned,target),q=tilt.multiply(yaw),rotation=new T.Euler().setFromQuaternion(q,'XYZ');
 // Native IBL is unshadowed. Represent the solar disk with the existing
 // shadow-casting directional key, and keep only sunless measured sky in
 // the diffuse/reflection environment. R04 showed that retaining both made
 // every sheltered copper face bright and flattened the complete roof mass.
 const fillData=new Float32Array(data),cone=Math.cos(2.3*Math.PI/180);let separatedPixels=0;
 for(let yy=0;yy<height;yy++)for(let xx=0;xx<width;xx++){
  const a=((xx+.5)/width-.5)*Math.PI*2,h=((yy+.5)/height-.5)*Math.PI,c=Math.cos(h),dot=c*Math.cos(a)*source.x+Math.sin(h)*source.y+c*Math.sin(a)*source.z;
  if(dot<cone)continue;const i=(yy*width+xx)*channels,l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];if(l<=3)continue;
  const scale=3/l;for(let k=0;k<3;k++)fillData[i+k]*=scale;separatedPixels++;
 }
 const fill=new T.DataTexture(fillData,width,height,T.RGBAFormat,T.FloatType);fill.mapping=T.EquirectangularReflectionMapping;fill.colorSpace=T.LinearSRGBColorSpace;fill.flipY=texture.flipY;fill.minFilter=fill.magFilter=T.LinearFilter;fill.needsUpdate=true;
 scene.background=texture;scene.environment=fill;scene.backgroundRotation.copy(rotation);scene.environmentRotation.copy(rotation);scene.backgroundIntensity=backgroundIntensity;scene.backgroundBlurriness=0;scene.environmentIntensity=environmentIntensity;
 // Low open sky reaches the vertical timber cheeks through the actual
 // eave gaps. Two visible solid-angle-integrated measured sectors cast geometry
 // shadows, instead of raising an unoccluded ambient or the whole exposure.
 // This finite quadrature is a bounded native approximation to the dome.
 const bins=Array.from({length:4},()=>({rgb:[0,0,0],direction:new T.Vector3(),solidAngle:0,luma:0})),step=4,ray=new T.Vector3(),gain=.90;
 for(let yy=0;yy<height;yy+=step)for(let xx=0;xx<width;xx+=step){
  const a=((xx+.5)/width-.5)*Math.PI*2,h=((yy+.5)/height-.5)*Math.PI,c=Math.cos(h);ray.set(c*Math.cos(a),Math.sin(h),c*Math.sin(a)).applyQuaternion(q);
  if(ray.y<.025||ray.y>.50)continue;
  const bin=bins[Math.floor((Math.atan2(ray.z,ray.x)+Math.PI)/(Math.PI/2))%4],omega=c*Math.PI/height*2*Math.PI/width*step*step,i=(yy*width+xx)*channels,luma=.2126*fillData[i]+.7152*fillData[i+1]+.0722*fillData[i+2];
  for(let k=0;k<3;k++)bin.rgb[k]+=fillData[i+k]*omega;
  bin.direction.addScaledVector(ray,luma*omega);bin.solidAngle+=omega;bin.luma+=luma*omega;
 }
 const shadowedSky=bins.flatMap((bin,i)=>{
  // The far half of the sky remains in the restrained environment. Keep
  // the two near measured sectors inside this GPU's sampler budget.
  if(i<2)return[];
  const peak=Math.max(...bin.rgb),direction=bin.direction.normalize(),light=new T.DirectionalLight(new T.Color().setRGB(...bin.rgb.map(v=>v/Math.max(peak,1e-8))),peak*gain);light.name='scene05-measured-low-sky-sector220-'+i;
  light.target.position.set(0,10,0);light.position.copy(light.target.position).addScaledVector(direction,48);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-18,right:18,top:24,bottom:-15,near:1,far:100});light.shadow.bias=-.000018;light.shadow.normalBias=.0035;light.shadow.radius=1.8;light.shadow.autoUpdate=false;light.shadow.needsUpdate=true;scene.add(light,light.target);
  return[{sector:i,direction:direction.toArray(),integratedLinearRGB:bin.rgb,solidAngle:bin.solidAngle,intensity:light.intensity,colorLinear:light.color.toArray(),castsActualShadows:true,mapSize:2048}];
 });
 return{info:{provider:'Poly Haven',asset:'kloofendal_48d_partly_cloudy_puresky',license:'CC0-1.0',path,source:'https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky',authors:['Greg Zaal','Jarod Guest'],sourceSunPixel:[at%width,Math.floor(at/width)],maximumLuma:maximum,meanLuma:mean/(width*height),sourceDirectionYUp:source.toArray(),targetDirectionYUp:target.toArray(),rotationXYZ:rotation.toArray(),nativeEnvironmentIntensity:environmentIntensity,backgroundIntensity,shadowedSky220:{gain,elevationSineRange:[.025,.50],method:'Two near measured low-sky solid-angle sectors with actual static geometry shadows; far sectors remain in restrained environment. Not uniform ambient or traced GI',sectors:shadowedSky},solarSeparation:{coneDegrees:2.3,fillRadianceCeiling:3,pixels:separatedPixels},scope:'Original measured CC0 sky is the background. Sunless near low-sky quadrature has geometry occlusion; far sky IBL and courtyard-bounce proxy remain approximations. Cycles uses full measured sky and traced GI. No reference RGB, scene plate or depth mesh.'},dispose(){texture.dispose();fill.dispose();}};
}
