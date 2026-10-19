import * as T from 'three';
import {EXRLoader} from 'three/addons/loaders/EXRLoader.js';

// A photographed CC0 sky is distant illumination, never a temple/photo plate.
// Split its solar radiance from the environment so the direct sun can cast
// actual geometry shadows instead of being counted twice as ambient light.
export async function createGoldenSky116(renderer,scene){
  const texture=await new EXRLoader().setDataType(T.FloatType).loadAsync(
    new URL('../../../assets/polyhaven/qwantani-sunset-puresky/sky-2k.exr',import.meta.url).href);
  texture.mapping=T.EquirectangularReflectionMapping;
  const {data,width,height}=texture.image,channels=data.length/(width*height);
  let peak=-Infinity,peakIndex=0;
  for(let i=0;i<width*height;i++){
    const o=i*channels,l=.2126*data[o]+.7152*data[o+1]+.0722*data[o+2];
    if(l>peak){peak=l;peakIndex=i;}
  }
  const px=peakIndex%width,py=Math.floor(peakIndex/width);
  // EXRLoader returns bottom-first scanlines with flipY=false. The pinned
  // Three.js equirectUv maps asin(y)/PI+.5 to the numerical row coordinate.
  const ray=(x,y)=>{const az=((x+.5)/width-.5)*Math.PI*2,alt=((y+.5)/height-.5)*Math.PI;return new T.Vector3(Math.cos(alt)*Math.cos(az),Math.sin(alt),Math.cos(alt)*Math.sin(az));};
  const nativeSun=ray(px,py),target=new T.Vector3(-.6178388972054449,.04241821563840393,-.7851597239301145).normalize();
  const yaw=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(nativeSun.z,nativeSun.x)-Math.atan2(target.z,target.x));
  const yawed=nativeSun.clone().applyQuaternion(yaw),tilt=new T.Quaternion().setFromUnitVectors(yawed,target);
  const rotation=tilt.multiply(yaw),euler=new T.Euler().setFromQuaternion(rotation);
  const diffuseData=new Float32Array(data),solar=[0,0,0],radius=.018,cosRadius=Math.cos(radius);
  const ring=[];
  for(let y=Math.max(0,py-16);y<Math.min(height,py+17);y++)for(let x=px-16;x<=px+16;x++){
    const xx=(x+width)%width,d=ray(xx,y).dot(nativeSun);
    if(d<Math.cos(.025)&&d>Math.cos(.045)){const o=(y*width+xx)*channels;ring.push([data[o],data[o+1],data[o+2]]);}
  }
  const ambient=[0,1,2].map(c=>{const a=ring.map(p=>p[c]).sort((a,b)=>a-b);return a[Math.floor(a.length/2)]??.15;});
  let splitPixels=0;
  for(let y=Math.max(0,py-16);y<Math.min(height,py+17);y++)for(let x=px-16;x<=px+16;x++){
    const xx=(x+width)%width,d=ray(xx,y).dot(nativeSun);if(d<cosRadius)continue;
    const o=(y*width+xx)*channels,solidAngle=2*Math.PI/width*Math.PI/height*Math.cos(((y+.5)/height-.5)*Math.PI);
    for(let c=0;c<3;c++){const residual=Math.max(0,data[o+c]-ambient[c]);solar[c]+=residual*solidAngle;diffuseData[o+c]=Math.min(data[o+c],ambient[c]);}
    splitPixels++;
  }
  const ambientTexture=new T.DataTexture(diffuseData,width,height,T.RGBAFormat,T.FloatType);
  ambientTexture.colorSpace=T.LinearSRGBColorSpace;ambientTexture.mapping=T.EquirectangularReflectionMapping;ambientTexture.flipY=texture.flipY;
  ambientTexture.minFilter=ambientTexture.magFilter=T.LinearFilter;ambientTexture.needsUpdate=true;
  const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromEquirectangular(ambientTexture);pmrem.dispose();
  const gain=.70;
  scene.background=texture;scene.backgroundRotation.copy(euler);scene.backgroundIntensity=gain;
  scene.environment=environment.texture;scene.environmentRotation.copy(euler);scene.environmentIntensity=gain;
  const maximum=Math.max(...solar),sun=new T.DirectionalLight(new T.Color().setRGB(...solar.map(v=>v/maximum)),maximum*gain);
  sun.name='sky116-single-shadow-casting-sun';sun.position.copy(target).multiplyScalar(120).add(new T.Vector3(0,7,0));sun.target.position.set(0,7,0);
  sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-42,right:42,top:38,bottom:-32,near:1,far:220});
  sun.shadow.bias=-.00006;sun.shadow.normalBias=.012;scene.add(sun,sun.target);
  const audit={revision:'sky116',source:'Poly Haven qwantani_sunset_puresky, Greg Zaal / Jarod Guest, CC0-1.0',skySha256:'f738ddd35a5e1a291eb45b30eea73b4d296dc4a05a412ae2f187ef5e95dc076a',referencePhotographInScene:false,peakPixel:[px,py],nativeSun:nativeSun.toArray(),targetSun:target.toArray(),solarIrradiance:solar,radianceGain:gain,solarSplitRadiusRadians:radius,splitPixels,ambientUnderSun:ambient,geometryChanged:false,visualAccepted:false};
  return{audit,sun,dispose(){texture.dispose();ambientTexture.dispose();environment.dispose();}};
}
