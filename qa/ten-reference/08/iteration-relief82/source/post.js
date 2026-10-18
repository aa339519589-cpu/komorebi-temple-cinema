import * as T from 'three';
// A deterministic camera pass: local contact occlusion from real depth, and
// a very small circle of confusion. No image plate or accumulated frames.
export function createCameraPass(renderer,width,height){
 const target=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true});target.depthTexture=new T.DepthTexture(width,height,T.UnsignedIntType);target.samples=4;
 const uniforms={colorMap:{value:target.texture},depthMap:{value:target.depthTexture},inverseProjection:{value:new T.Matrix4()},projection:{value:new T.Matrix4()},resolution:{value:new T.Vector2(width,height)},focus:{value:30},near:{value:.06},far:{value:180}};
 const material=new T.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,toneMapped:true,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`
 varying vec2 vUv;uniform sampler2D colorMap;uniform sampler2D depthMap;uniform mat4 inverseProjection;uniform mat4 projection;uniform vec2 resolution;uniform float focus;
 vec3 point(vec2 uv){float d=texture2D(depthMap,uv).r;vec4 p=inverseProjection*vec4(uv*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
 void main(){vec3 p=point(vUv);vec3 n=normalize(cross(dFdx(p),dFdy(p)));if(n.z<0.)n=-n;float depth=-p.z;float radius=clamp(.62*projection[1][1]*resolution.y/(2.*max(depth,1.)),2.,34.);float occ=0.,weight=0.;
 for(int i=0;i<16;i++){float f=float(i),a=f*2.399963,r=sqrt((f+.5)/16.);vec2 off=vec2(cos(a),sin(a))*r*radius/resolution;vec3 q=point(clamp(vUv+off,vec2(.001),vec2(.999)));vec3 d=q-p;float len=length(d);float range=1.-smoothstep(.12,.85,len);occ+=max(0.,dot(normalize(d+vec3(.00001)),n)-.10)*range;weight+=1.;}
 float ao=clamp(1.-occ/max(weight,1.)*2.2,.55,1.);float focalMM=18.*projection[1][1],focusMM=max(100.,focus*1000.),distanceMM=max(.06,depth)*1000.;float coc=abs(focalMM*focalMM*(distanceMM-focusMM)/(2.8*(focusMM-focalMM)*distanceMM));float blur=clamp(coc*resolution.x/72.,.12,6.0);vec3 color=texture2D(colorMap,vUv).rgb*2.;float sum=2.;
 for(int j=0;j<8;j++){float a=float(j)*.785398;vec2 off=vec2(cos(a),sin(a))*blur/resolution;color+=texture2D(colorMap,clamp(vUv+off,vec2(.001),vec2(.999))).rgb;sum+=1.;}color/=sum;color*=mix(1.,ao,.84);gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1),quad=new T.Mesh(new T.PlaneGeometry(2,2),material);scene.add(quad);let stats={};
 return {render(world,view){uniforms.focus.value=view.userData.focusDistance??30;uniforms.inverseProjection.value.copy(view.projectionMatrixInverse);uniforms.projection.value.copy(view.projectionMatrix);renderer.setRenderTarget(target);renderer.render(world,view);stats={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};renderer.setRenderTarget(null);renderer.render(scene,camera);},info:()=>({...stats,cameraPass:'depth-contact-occlusion-and-subtle-focus',focus:uniforms.focus.value}),dispose(){target.depthTexture.dispose();target.dispose();quad.geometry.dispose();material.dispose();}};
}
