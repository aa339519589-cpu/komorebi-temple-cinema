/** Separate wet-film reflection on the actual 0.108 m conditional threshold. */
import * as T from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';
export function installRainThresholdOptics(world,{resolution=1536,stoneGain=.44,strength=1,practicalGain=1}={}){
 const surface=world.thresholdSurface;
 if(world.referenceScene.variant!=='reference10-porch'||!surface?.slabs?.length)throw Error('Requires existing conditional reference10 flagstones');
 if(!Number.isInteger(resolution)||resolution<256||resolution>2048||!Number.isFinite(stoneGain)||stoneGain<.15||stoneGain>1||!Number.isFinite(strength)||strength<0||strength>1||!Number.isFinite(practicalGain)||practicalGain<.5||practicalGain>3)throw Error('Invalid wet threshold optics');
 const meta=surface.getSurfaceMetadata();if(Math.abs(meta.worldPlaneNormal[1]-1)>1e-8)throw Error('Threshold must be horizontal');
 const center=new T.Vector3().setFromMatrixPosition(surface.group.matrixWorld),top=meta.worldPlanePoint[1],positions=[];
 // Copy top triangles only. Preserve every existing stone gap and actual column cutout.
 for(const slab of surface.slabs){const p=slab.geometry.getAttribute('position');for(let i=0;i<p.count;i+=3){
  const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2);
  if(Math.min(a.y,b.y,c.y)<surface.plan.stoneTop-.002||new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(c,a)).y<=0)continue;
  for(const v of[a,b,c])positions.push(v.x,-v.z,0);
 }}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const film=new Reflector(geometry,{textureWidth:resolution,textureHeight:resolution,multisample:0,clipBias:.0001,color:0xffffff});
 film.name='reference10-threshold-physical-rain-film';film.rotation.x=-Math.PI/2;film.position.set(center.x,top+.00035,center.z);film.renderOrder=4;
 film.userData.excludeFromGTAO=true;film.userData.excludeFromEnvironmentBake=true;
 const texture=film.getRenderTarget().texture;texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;
 const m=film.material;m.name='reference10-water-film-dielectric';m.transparent=true;m.depthWrite=false;m.depthTest=true;
 m.uniforms.time={value:66.5};m.uniforms.strength={value:strength};m.uniforms.texel={value:new T.Vector2(1/resolution,1/resolution)};
 m.vertexShader=`uniform mat4 textureMatrix;varying vec4 reflectedUv;varying vec3 surfaceWorld;void main(){surfaceWorld=(modelMatrix*vec4(position,1.)).xyz;reflectedUv=textureMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
 m.fragmentShader=`uniform sampler2D tDiffuse;uniform float time,strength;uniform vec2 texel;varying vec4 reflectedUv;varying vec3 surfaceWorld;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
vec2 rings(vec2 p){vec2 cell=floor(p/.45),q=fract(p/.45)*.45,g=vec2(0);for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 k=cell+vec2(float(i),float(j));vec2 center=(vec2(float(i),float(j))+vec2(h(k),h(k+19.3)))*.45;float age=fract(time*.7+h(k+7.8));vec2 d=q-center;float r=max(length(d),.0001),wave=r-age*.17;float env=exp(-wave*wave/0.00017)*(1.-age)*(1.-age);g+=d/r*cos(wave*245.)*env*.025;}return g;}
void main(){vec2 p=surfaceWorld.xz;vec2 ripple=rings(p);vec3 n=normalize(vec3(-ripple.x,1.,-ripple.y));vec3 view=normalize(cameraPosition-surfaceWorld);float fresnel=.0204+.9796*pow(1.-max(0.,dot(n,view)),5.);vec2 uv=reflectedUv.xy/reflectedUv.w;
 uv+=ripple*.006+vec2(sin(p.x*54.+p.y*7.),sin(p.y*48.))*texel*.10;
 float grain=noise(p*2.1),lod=mix(.15,1.25,grain);vec3 reflected=textureLod(tDiffuse,uv,lod).rgb;
 float coverage=.88+.12*noise(p*1.3);gl_FragColor=vec4(reflected,clamp(fresnel*strength*coverage,0.,.94));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
 const other=[];world.scene.traverse(o=>{if(o.isReflector)other.push(o)});
 const base=film.onBeforeRender;
 film.onBeforeRender=function(...args){const visibility=other.map(o=>o.visible);other.forEach(o=>o.visible=false);try{m.uniformsNeedUpdate=true;return base.apply(this,args);}finally{other.forEach((o,i)=>o.visible=visibility[i]);}};
 const callbacks=other.map(o=>({o,original:o.onBeforeRender}));for(const record of callbacks){record.o.onBeforeRender=function(...args){const v=film.visible;film.visible=false;try{return record.original.apply(this,args)}finally{film.visible=v}};record.installed=record.o.onBeforeRender;}
 const materials=surface.materials.stone.map(material=>({material,color:material.color.clone(),roughness:material.roughness}));for(const s of materials){s.material.color.multiplyScalar(stoneGain);s.material.roughness=Math.min(s.material.roughness,.18);}
 const lights=[],emissives=[],seen=new Set();world.scene.traverse(o=>{if((o.isPointLight||o.isSpotLight)&&o.intensity>0){lights.push({o,intensity:o.intensity});o.intensity*=practicalGain;}if(o.isMesh)for(const material of Array.isArray(o.material)?o.material:[o.material]){if(!material||seen.has(material))continue;seen.add(material);if(material.emissive?.getHex()>0&&material.emissiveIntensity>0){emissives.push({material,intensity:material.emissiveIntensity});material.emissiveIntensity*=practicalGain;}}});
 world.scene.add(film);film.updateMatrixWorld(true);
 const report={version:'reference10-optics-r1',planeY:top+.00035,stoneTop:top,oldPuddlePlaneUnchanged:true,slabs:surface.slabs.length,topTriangles:positions.length/9,cutouts:surface.cutouts.length,reflectionResolution:[resolution,resolution],waterIOR:1.333,fresnelNormal:.0204,stoneGain,practicalGain,strength,geometryPolicy:'Existing stone top triangle footprints; preserve original slab gaps and column cutouts',newReferencePixels:false,reflection:'Actual scene reflected across a separate physically coplanar water film',rainRipples:'Deterministic continuous surface normals, no image animation'};
 return{film,report,update(t){if(!Number.isFinite(t))throw Error('Invalid rain time');m.uniforms.time.value=t;},dispose(){film.removeFromParent();callbacks.forEach(r=>{if(r.o.onBeforeRender===r.installed)r.o.onBeforeRender=r.original});materials.forEach(s=>{s.material.color.copy(s.color);s.material.roughness=s.roughness});lights.forEach(s=>s.o.intensity=s.intensity);emissives.forEach(s=>s.material.emissiveIntensity=s.intensity);film.dispose();geometry.dispose();}};
}
