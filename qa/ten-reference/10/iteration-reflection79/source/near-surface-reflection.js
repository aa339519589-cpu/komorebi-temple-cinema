// Occlusion data from the twelve complete authored stone meshes, not a photo
// depth estimate. The atlas only removes the old high planar reflection where
// a camera ray actually meets one of these lower three-dimensional surfaces.
export function createNearSurfaceReflectionMask(T){
 const stones=[];
 return{
  add(geometry,id){stones.push({geometry,id});},
  finish(){
   const box=new T.Box3();for(const {geometry}of stones){geometry.computeBoundingBox();box.union(geometry.boundingBox);}
   const margin=.025,x0=box.min.x-margin,z0=box.min.z-margin,spanX=box.max.x-box.min.x+margin*2,spanZ=box.max.z-box.min.z+margin*2;
   const width=1024,height=Math.ceil(width*spanZ/spanX/64)*64,heights=new Float32Array(width*height);heights.fill(-1);
   let topTriangles=0,minSurfaceY=Infinity,maxSurfaceY=-Infinity;
   for(const {geometry}of stones){
    const p=geometry.attributes.position;
    for(let i=0;i<p.count;i+=3){
     const ax=p.getX(i),az=p.getZ(i),ay=p.getY(i),bx=p.getX(i+1),bz=p.getZ(i+1),by=p.getY(i+1),cx=p.getX(i+2),cz=p.getZ(i+2),cy=p.getY(i+2);
     const denominator=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);
     // Upward cap / arris faces only. Full side and bottom meshes are retained
     // by the scene; they are not replaced by this optical lookup.
     if(denominator>=-1e-14)continue;
     const ix0=Math.max(0,Math.floor((Math.min(ax,bx,cx)-x0)/spanX*width)),ix1=Math.min(width-1,Math.floor((Math.max(ax,bx,cx)-x0)/spanX*width));
     const iz0=Math.max(0,Math.floor((Math.min(az,bz,cz)-z0)/spanZ*height)),iz1=Math.min(height-1,Math.floor((Math.max(az,bz,cz)-z0)/spanZ*height));
     for(let iz=iz0;iz<=iz1;iz++)for(let ix=ix0;ix<=ix1;ix++){
      const x=x0+(ix+.5)/width*spanX,z=z0+(iz+.5)/height*spanZ;
      const a=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/denominator,b=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/denominator,c=1-a-b;
      if(a<-.00001||b<-.00001||c<-.00001)continue;
      const y=a*ay+b*by+c*cy,index=iz*width+ix;if(y>heights[index])heights[index]=y;
     }
     topTriangles++;minSurfaceY=Math.min(minSurfaceY,ay,by,cy);maxSurfaceY=Math.max(maxSurfaceY,ay,by,cy);
    }
   }
   const data=new Uint8Array(width*height*4),heightScale=.08;let coveredTexels=0;
   for(let i=0;i<heights.length;i++)if(heights[i]>=0){data[i*4]=Math.round(Math.max(0,Math.min(1,heights[i]/heightScale))*255);data[i*4+1]=255;data[i*4+3]=255;coveredTexels++;}
   const texture=new T.DataTexture(data,width,height);texture.name='authored-twelve-stone-height-and-coverage-for-planar-occlusion';texture.colorSpace=T.NoColorSpace;texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.anisotropy=8;texture.needsUpdate=true;
   return{texture,bounds:new T.Vector4(x0,z0,spanX,spanZ),heightScale,info:{stoneIds:stones.map(s=>s.id),dimensions:[width,height],boundsXZ:[x0,z0,x0+spanX,z0+spanZ],texelMetres:[spanX/width,spanZ/height],heightQuantizationMetres:heightScale/255,actualTopYRange:[minSurfaceY,maxSurfaceY],topTrianglesRead:topTriangles,coveredTexels,newTriangles:0,source:'Runtime rasterization of actual authored cap/arris vertices. No reference RGB/depth.',planeExclusion:'Camera-ray intersection with the actual lower stone height/coverage; 16 height intervals and five bisections; mipmapped edge feather.'}};
  }
 };
}

export function installNearSurfacePlaneExclusion(T,mirror,surface){
 mirror.material.uniforms.nearStoneSurfaceMap={value:surface.texture};mirror.material.uniforms.nearStoneSurfaceBounds={value:surface.bounds};
 const functions=`
uniform sampler2D nearStoneSurfaceMap;
uniform vec4 nearStoneSurfaceBounds;
vec4 nearStoneSurface(vec2 p){
 vec2 uv=(p-nearStoneSurfaceBounds.xy)/nearStoneSurfaceBounds.zw;
 if(any(lessThan(uv,vec2(0.0)))||any(greaterThan(uv,vec2(1.0))))return vec4(0.0);
 return texture2D(nearStoneSurfaceMap,uv);
}
float nearStoneHeight(vec4 h){return .08*h.r/max(h.g,.00001);}
float nearStoneOcclusion(vec3 planePoint){
 vec3 ray=planePoint-cameraPosition;float drop=cameraPosition.y-planePoint.y;
 if(drop<.005)return 0.0;
 // A fixed XZ hole would leave a floating halo at a low eye. Project the
 // lower mesh along this camera ray, so the exclusion follows real occlusion.
 vec2 high=(planePoint+ray*((planePoint.y-.058)/drop)).xz;
 vec2 low=(planePoint+ray*((planePoint.y-.005)/drop)).xz;
 vec2 b0=nearStoneSurfaceBounds.xy,b1=b0+nearStoneSurfaceBounds.zw;
 if(any(lessThan(max(high,low),b0))||any(greaterThan(min(high,low),b1)))return 0.0;
 float previous=.058;
 for(int i=0;i<16;i++){
  float y=mix(.058,.005,float(i+1)/16.0);
  vec3 point=planePoint+ray*((planePoint.y-y)/drop);vec4 h=nearStoneSurface(point.xz);
  if(h.g>.08&&y<=nearStoneHeight(h)+.00015){
   float above=previous,below=y;
   for(int j=0;j<5;j++){
    float middle=(above+below)*.5;vec3 candidate=planePoint+ray*((planePoint.y-middle)/drop);vec4 test=nearStoneSurface(candidate.xz);
    if(test.g>.08&&middle<=nearStoneHeight(test)+.00015)below=middle;else above=middle;
   }
   vec3 hit=planePoint+ray*((planePoint.y-below)/drop);float coverage=nearStoneSurface(hit.xz).g;
   return smoothstep(.08,.92,coverage);
  }
  previous=y;
 }
 return 0.0;
}
`;
 mirror.material.fragmentShader=functions+mirror.material.fragmentShader;
 mirror.material.fragmentShader=mirror.material.fragmentShader.replace('gl_FragColor=vec4(base.rgb,alpha);','float nearCoverage=nearStoneOcclusion(sp);if(nearCoverage>.999)discard;alpha*=1.0-nearCoverage;\ngl_FragColor=vec4(base.rgb,alpha);');
 mirror.material.customProgramCacheKey=()=> 'scene10-planar-ray-exclusion-of-twelve-real-stones79';
 mirror.material.needsUpdate=true;
}
