import * as T from 'three';

// Independent sky-only panorama; decoded LDR values are authored radiance,
// not a measurement and never a photographic temple or garden projection.
export async function loadMeasuredSky(sunDirection){
 const source=await new T.TextureLoader().loadAsync('/assets/generated-golden-sky-v01/sky-equirectangular.png');
 const width=source.image.width,height=source.image.height,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source.image,0,0);
 const rgba=ctx.getImageData(0,0,width,height).data,data=new Float32Array(width*height*4),gain=3.5;
 const linear=c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const a=((height-1-y)*width+x)*4,b=(y*width+x)*4;
  const r=linear(rgba[a]/255),g=linear(rgba[a+1]/255),blue=linear(rgba[a+2]/255),luma=.2126*r+.7152*g+.0722*blue;data[b]=(r*.90+luma*.10)*gain*.97;data[b+1]=(g*.90+luma*.10)*gain;data[b+2]=(blue*.90+luma*.10)*gain*1.08;data[b+3]=1;
 }
 source.dispose();
 const texture=new T.DataTexture(data,width,height,T.RGBAFormat,T.FloatType);texture.colorSpace=T.LinearSRGBColorSpace;texture.mapping=T.EquirectangularReflectionMapping;texture.minFilter=texture.magFilter=T.LinearFilter;texture.needsUpdate=true;
 const wantedLongitude=Math.atan2(sunDirection.z,sunDirection.x),wantedLatitude=Math.asin(sunDirection.y);
 const sourceLongitude=-Math.PI/2,sourceLatitude=3.6*Math.PI/180;
 const yaw=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),sourceLongitude-wantedLongitude);
 const pitch=new T.Quaternion().setFromAxisAngle(new T.Vector3(-Math.sin(wantedLongitude),0,Math.cos(wantedLongitude)),wantedLatitude-sourceLatitude);
 const orientation=pitch.multiply(yaw),inverse=new T.Matrix3().setFromMatrix4(new T.Matrix4().makeRotationFromQuaternion(orientation).invert());
 const material=new T.ShaderMaterial({name:'authored-golden-cloud-radiance',side:T.BackSide,depthWrite:false,
  uniforms:{radiance:{value:texture},worldToSky:{value:inverse},sunDirection:{value:sunDirection},skyIntensity:{value:.40}},
  vertexShader:`varying vec3 vRay;void main(){vec4 world=modelMatrix*vec4(position,1.);vRay=world.xyz-cameraPosition;gl_Position=projectionMatrix*viewMatrix*world;}`,
  fragmentShader:`varying vec3 vRay;uniform sampler2D radiance;uniform mat3 worldToSky;uniform vec3 sunDirection;uniform float skyIntensity;
   void main(){vec3 ray=normalize(vRay),d=normalize(worldToSky*ray);vec2 uv=vec2(atan(d.z,d.x)/6.28318530718+.5,asin(clamp(d.y,-1.,1.))/3.14159265359+.5);
   vec3 color=texture2D(radiance,uv).rgb*skyIntensity;
   float facing=max(0.,dot(ray,sunDirection));color+=vec3(.75,.22,.025)*pow(facing,190.);
   color+=vec3(40.,23.,8.)*smoothstep(.999960,.999972,facing);gl_FragColor=vec4(color,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }`});
 const mesh=new T.Mesh(new T.SphereGeometry(180,48,28),material);mesh.name='independently-authored-sky-only-environment';mesh.renderOrder=-100;
 return{mesh,texture,rotation:new T.Euler().setFromQuaternion(orientation),info:{provider:'OpenAI built-in imagegen',asset:'generated-golden-sky-v01',generated:true,referencePhotographUsed:false,scope:'Sky-only spherical environment and reflected radiance. All architecture, sculpture and plants remain independently modeled meshes.',radianceConversion:'sRGB decode, 10% luminance mixing, linear gains [.97,1,1.08], authored gain3.5; not a measured HDRI',sourceGlowElevationDegrees:3.6,targetSunDirection:sunDirection.toArray()},dispose(){texture.dispose();material.dispose();mesh.geometry.dispose();}};
}
