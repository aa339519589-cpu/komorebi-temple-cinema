import * as T from 'three';

// Fixed 3D terrain occlusion for distant tree aggregates beyond the close
// architectural shadow-map footprint. This attenuates the actual direct
// solar light record only. Sky irradiance, local environments, exposure and
// camera pixels are not darkened. No camera input or screen-space mask.
export function createMountainTransport238({profiles=[],direction,surfaceGrid=null}){
 const d=new T.Vector3(...direction).normalize();let crowns=0,rays=0,blocked=0,surfaceSamples=0;
 const nx=480,nz=100,frontNZ=44,stride=nx+1;
 // Cache the same Float32 vertex heights used by the actual terrain mesh.
 // Queries interpolate its two real triangles, rather than evaluating an
 // unsampled analytic noise field between the modeled vertices.
 const meshes=surfaceGrid?[]:profiles.map(({base,surface,noise2})=>{
  const back=new Float32Array(stride*(nz+1)),front=new Float32Array(stride*(frontNZ+1)),backZ=new Float32Array(nz+1);
  for(let j=0;j<=nz;j++){const z=base-j*.96;backZ[j]=z;for(let i=0;i<=nx;i++)back[j*stride+i]=surface(-150+i*300/nx,z);}
  for(let j=0;j<=frontNZ;j++)for(let i=0;i<=nx;i++){
   const x=-150+i*300/nx,t=j/frontNZ,z=base+22*(1-t),blend=t*t*(3-2*t);
   front[j*stride+i]=j===frontNZ?back[i]:-3+(surface(x,base)+3)*blend+1.5*(noise2(x*.22,z*.22)-.5)*Math.sin(t*Math.PI);
  }
  return{base,back,front,backZ};
 });
 const triangleHeight=(data,i,j,u,v,lineStride=stride)=>{
  const a=data[j*lineStride+i],b=data[j*lineStride+i+1],c=data[(j+1)*lineStride+i],d=data[(j+1)*lineStride+i+1];
  return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
 };
 function height(x,z){
  if(surfaceGrid){
   const g=surfaceGrid;if(x<g.minX||x>g.maxX||z<g.minZ||z>g.maxZ)return-Infinity;
   const xx=(x-g.minX)/g.dx,zz=(g.maxZ-z)/g.dz,i=Math.min(g.nx-1,Math.max(0,Math.floor(xx))),j=Math.min(g.nz-1,Math.max(0,Math.floor(zz)));
   return triangleHeight(g.heights,i,j,xx-i,zz-j,g.nx+1);
  }
  if(x< -150||x>150)return-Infinity;
  let y=-Infinity;const xx=(x+150)/.625,i=Math.min(nx-1,Math.max(0,Math.floor(xx))),u=xx-i;
  for(const {base,back,front,backZ}of meshes){
   if(z>base+22||z<base-96)continue;
   let h;
   if(z>base){const q=(base+22-z)/.5,j=Math.min(frontNZ-1,Math.max(0,Math.floor(q)));h=triangleHeight(front,i,j,u,q-j);}
   else{let j=Math.min(nz-1,Math.max(0,Math.floor((base-z)/.96)));if(j>0&&z>backZ[j])j--;else if(j<nz-1&&z<backZ[j+1])j++;const v=(backZ[j]-z)/(backZ[j]-backZ[j+1]);h=triangleHeight(back,i,j,u,v);}
   y=Math.max(y,h);
  }
  return y;
 }
 function visible(x,y,z){
  rays++;
  for(let t=.80;t<360;t+=.90+t*.035){
   const xx=x+d.x*t,zz=z+d.z*t;
   if(zz<-205)break;
   if(height(xx,zz)>y+d.y*t+.10){blocked++;return 0;}
  }
  return 1;
 }
 function crownVisibility(x,y,z,h,r){
  crowns++;
  const side=new T.Vector3(d.z,0,-d.x).normalize().multiplyScalar(r*.55);
  const samples=[[0,h*.26,0],[0,h*.56,0],[0,h*.88,0],[side.x,h*.56,side.z],[-side.x,h*.56,-side.z]];
  return samples.reduce((sum,p)=>sum+visible(x+p[0],y+p[1],z+p[2]),0)/samples.length;
 }
 const surfaceVisibility=(x,y,z)=>{surfaceSamples++;return visible(x,y,z);};
 return{height,crownVisibility,surfaceVisibility,info:()=>({revision:surfaceGrid?'scene07-continuous-canopy-triangle-solar-transport238-r29':'scene07-triangulated-terrain-solar-crown-occlusion238-r27',crowns,surfaceSamples,rays,blocked,sourceDirection:d.toArray(),samplePositionsPerCrown:5,heightQueryUsesActualFloat32MeshTriangles:true,terrainGrid:surfaceGrid?[surfaceGrid.nx,surfaceGrid.nz,0]:[nx,nz,frontNZ],worldFixed:true,changesDirectSolarOnly:true,changesSkyOrExposure:false,scope:'Discrete visibility rays against actual Float32 triangle heights. Crown-area and interpolated surface-control/raymarch approximations; not exact per-leaf intersection or multi-bounce transport.',visualAccepted:false})};
}

export function installMountainTransport238(material){
 const before=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=s=>{
  before.call(material,s);
  s.vertexShader='attribute float mountainSunVisibility238;varying float vMountainSunVisibility238;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMountainSunVisibility238=mountainSunVisibility238;');
  s.fragmentShader='varying float vMountainSunVisibility238;\n'+s.fragmentShader;
  const chunk=T.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );\n directLight.color*=clamp(vMountainSunVisibility238,0.,1.);');
  s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_begin>',chunk);
 };
 material.customProgramCacheKey=()=>key()+':actual-terrain-direct-solar-occlusion238-r27';
 material.userData.mountainSunTransport238=true;material.needsUpdate=true;
}
