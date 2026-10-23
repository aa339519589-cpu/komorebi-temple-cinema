import * as T from 'three';
import {HDRLoader} from './vendor/HDRLoader.js';
export const SUN_AXIS108=new T.Vector3(-20,21,16).normalize();
export function attachLeafSun108(shader){shader.uniforms.scene03SunDirection108={value:SUN_AXIS108};shader.fragmentShader='uniform vec3 scene03SunDirection108;\n'+shader.fragmentShader;}

export async function installDaylight108({scene,skyDome,sunAxis,textures}){
 const hdr=await new HDRLoader().setDataType(T.FloatType).loadAsync(new URL('../assets/daylight108/sky-4k.hdr',import.meta.url).href);
 hdr.name='scene03-independent-CC0-daylight-sky108';hdr.mapping=T.EquirectangularReflectionMapping;textures.add(hdr);
 const {width,height,data}=hdr.image;let peak=-1,peakIndex=0;
 for(let i=0;i<width*height;i++){const k=i*4,l=.2126*data[k]+.7152*data[k+1]+.0722*data[k+2];if(l>peak){peak=l;peakIndex=i;}}
 const longitude=(peakIndex%width+.5)/width*Math.PI*2-Math.PI,latitude=(.5-(Math.floor(peakIndex/width)+.5)/height)*Math.PI;
 // The independently scanned sky's solar elevation governs the same
 // shadow key and botanical transmission; keep the retained key azimuth.
 const azimuth=Math.atan2(sunAxis.z,sunAxis.x);sunAxis.set(Math.cos(latitude)*Math.cos(azimuth),Math.sin(latitude),Math.cos(latitude)*Math.sin(azimuth));SUN_AXIS108.copy(sunAxis);
 const
  yaw=longitude-Math.atan2(sunAxis.z,sunAxis.x),ibl=new Float32Array(data),sourceDirection=new T.Vector3(Math.cos(latitude)*Math.cos(longitude),Math.sin(latitude),Math.cos(latitude)*Math.sin(longitude));
 // Keep the photographed cloud structure/radiance. Only the solar disc in
 // IBL is capped: the existing finite-shadow sun already supplies that key.
 // This is independent licensed sky light, never a projected temple image.
 let capped=0;for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const a=(x+.5)/width*Math.PI*2-Math.PI,b=(.5-(y+.5)/height)*Math.PI,d=new T.Vector3(Math.cos(b)*Math.cos(a),Math.sin(b),Math.cos(b)*Math.sin(a)),k=(y*width+x)*4;
  if(d.dot(sourceDirection)>.99966){for(let c=0;c<3;c++)ibl[k+c]=Math.min(ibl[k+c],3.0);capped++;}
 }
 const light=new T.DataTexture(ibl,width,height,T.RGBAFormat,T.FloatType);light.name='scene03-daylight-solar-disc-capped-IBL108';light.mapping=T.EquirectangularReflectionMapping;light.colorSpace=T.LinearSRGBColorSpace;light.flipY=hdr.flipY;light.needsUpdate=true;textures.add(light);
 scene.background=hdr;scene.backgroundIntensity=1.5;scene.backgroundRotation.set(0,yaw,0);skyDome.visible=false;
 scene.environment=light;scene.environmentIntensity=.95;scene.environmentRotation.set(0,yaw,0);
 //180: the whole independent pure-sky capture, IBL and captured sun rotate
 // together. The pitch brings the actual cumulus field above the low eave.
 const skyPitch180=.24;scene.backgroundRotation.set(skyPitch180,yaw,0);scene.environmentRotation.copy(scene.backgroundRotation);sunAxis.applyAxisAngle(new T.Vector3(1,0,0),skyPitch180);SUN_AXIS108.copy(sunAxis);
 return{revision:108,asset:'Poly Haven / Kloofendal48d Partly Cloudy Pure Sky',license:'CC0-1.0',provenance:'reconstructions/scene-03/assets/daylight108/provenance.json',yawRadians:yaw,wholeSkyPitchRadians180:skyPitch180,sourceSunElevationDegrees:latitude*180/Math.PI,shadowSunElevationDegrees:Math.asin(sunAxis.y)*180/Math.PI,sunAxis:sunAxis.toArray(),solarIblCapPixels:capped,referencePhotoUsed:false,nativeGIClaimed:false};
}
