import * as T from 'three';
// Existing independently generated sky-only asset. Linear authored radiance,
// not measured HDR and never a temple/garden/reference-frame projection.
export async function loadGoldenBoundary353(wantedDirection){
 const source=await new T.TextureLoader().loadAsync('/assets/generated-golden-sky-v01/sky-equirectangular.png'),w=source.image.width,h=source.image.height,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source.image,0,0);const rgba=ctx.getImageData(0,0,w,h).data,data=new Float32Array(w*h*4),gain=.8,linear=c=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);
 // Reproject the authored upper cloud layer in spherical latitude, before
 // either display or PMREM. Horizon/solar anchor and all input colours stay.
 const anchor353=3.6*Math.PI/180;
 for(let y=0;y<h;y++){
  const lat=((y+.5)/h-.5)*Math.PI;let sourceLat=lat;
  if(lat>anchor353){const u=(lat-anchor353)/(Math.PI/2-anchor353),eased=1-Math.pow(1-u,4.5),blend=T.MathUtils.smoothstep(u,0,.12);sourceLat=anchor353+(u+(eased-u)*blend)*(Math.PI/2-anchor353);}
  const sy=T.MathUtils.clamp((.5-sourceLat/Math.PI)*h-.5,0,h-1),y0=Math.floor(sy),y1=Math.min(h-1,y0+1),fy=sy-y0;
  for(let x=0;x<w;x++){
   const lon=((x+.5)/w-.5)*Math.PI*2,anchorLon=-Math.PI/2,delta=lon-anchorLon;
   // A monotone periodic longitude map: no tiled clouds or antipodal seam.
   // It places smaller cloudlets around the same fixed solar meridian.
   const sourceLon=lon+.75*Math.sin(delta),sx=((sourceLon/(Math.PI*2)+.5)*w-.5+w*2)%w,x0=Math.floor(sx),x1=(x0+1)%w,fx=sx-x0,b=(y*w+x)*4;
   for(let c=0;c<3;c++){
    const p00=linear(rgba[(y0*w+x0)*4+c]/255),p10=linear(rgba[(y0*w+x1)*4+c]/255),p01=linear(rgba[(y1*w+x0)*4+c]/255),p11=linear(rgba[(y1*w+x1)*4+c]/255);
    data[b+c]=((p00*(1-fx)+p10*fx)*(1-fy)+(p01*(1-fx)+p11*fx)*fy)*gain;
   }
   data[b+3]=1;
  }
 }
 source.dispose();
 const sourceLon=-Math.PI/2,sourceLat=3.6*Math.PI/180,wLon=Math.atan2(wantedDirection.z,wantedDirection.x),wLat=Math.asin(wantedDirection.y),orientation=new T.Quaternion().setFromAxisAngle(new T.Vector3(-Math.sin(wLon),0,Math.cos(wLon)),wLat-sourceLat).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),sourceLon-wLon)),inverse=new T.Matrix3().setFromMatrix4(new T.Matrix4().makeRotationFromQuaternion(orientation).invert());
 const color=[1,.50,.15],heldSolarY=.2126*12.899227673342414+.7152*4.451224858658505+.0722*.3343671425207852,intensity=heldSolarY/(.2126*color[0]+.7152*color[1]+.0722*color[2]);
 const texture=new T.DataTexture(data,w,h,T.RGBAFormat,T.FloatType);texture.colorSpace=T.LinearSRGBColorSpace;texture.mapping=T.EquirectangularReflectionMapping;texture.wrapS=T.RepeatWrapping;texture.minFilter=texture.magFilter=T.LinearFilter;texture.needsUpdate=true;
 const material=new T.ShaderMaterial({name:'353-common-golden-cloud-boundary',side:T.BackSide,depthWrite:false,uniforms:{radiance:{value:texture},worldToSky:{value:inverse},sunDirection:{value:wantedDirection},sunColor:{value:new T.Color().setRGB(...color)},skyIntensity:{value:1},solarDisplayEnabled353:{value:1}},vertexShader:'varying vec3 vRay;void main(){vec4 w=modelMatrix*vec4(position,1.);vRay=w.xyz-cameraPosition;gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:`varying vec3 vRay;uniform sampler2D radiance;uniform mat3 worldToSky;uniform vec3 sunDirection,sunColor;uniform float skyIntensity,solarDisplayEnabled353;
 void main(){vec3 ray=normalize(vRay),d=normalize(worldToSky*ray);vec2 uv=vec2(atan(d.z,d.x)/6.28318530718+.5,asin(clamp(d.y,-1.,1.))/3.14159265359+.5);vec3 rgb=texture2D(radiance,uv).rgb*skyIntensity;float a=acos(clamp(dot(ray,sunDirection),-1.,1.));rgb+=sunColor*50000.0*solarDisplayEnabled353*(1.-smoothstep(.00440,.00485,a));gl_FragColor=vec4(rgb,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const mesh=new T.Mesh(new T.SphereGeometry(180,48,28),material);mesh.name='353-common-independent-golden-sky-boundary';mesh.renderOrder=-100;
 return{mesh,texture,rotation:new T.Euler().setFromQuaternion(orientation),solar:{intensity,colorLinear:color,irradianceRGB:color.map(v=>v*intensity),inferredNotMeasured:true},info:{provider:'OpenAI built-in imagegen, existing independent sky-only asset',asset:'generated-golden-sky-v01',generated:true,sourceAsset:'assets/generated-golden-sky-v01/sky-equirectangular.png',sourceProvenance:'assets/generated-golden-sky-v01/provenance.json',referencePhotographPixelsUsed:false,containsArchitectureOrGarden:false,width:w,height:h,linearRadianceGain:gain,upperCloudLatitudeModel353:{solarAnchorDegrees:3.6,easing:'easeOut power4.5 with smooth onset0.12',longitudeMap:'lambda +0.75sin(lambda-solarMeridian), monotone derivative0.25..1.75',horizonAndSolarAnchorHeld:true,allColoursUnchanged:true,resampledSharedSkyAndIBLField:true},visibleAndIBLScale:1,sharedFieldForVisibleIBLAndLocalCaptures:true,noDisplayOnlyTintOrScreenMask:true,noLuminanceDesaturationOrOldAltitudeColourRemapping:true,solarDirection:wantedDirection.toArray(),solarColourLinear:color,solarIntensity:intensity,heldSolarLuminanceY:heldSolarY,solarAngularRadius:.00465,visibleSolarDiscRadianceCap:50000,skyHasNoRasterSolarDisc:true,inferredNotMeasured:true,scope:'LDR sRGB decoded once and clouds reprojected with one smooth spherical map into one shared linear authored radiance field; same spherical boundary drives display, IBL, water and two actual local captures. Sky gain and analytic solar spectrum are inferred golden-hour art direction, not in-situ or absolute photometric measurement.'},dispose(){texture.dispose();material.dispose();mesh.geometry.dispose();}};
}
