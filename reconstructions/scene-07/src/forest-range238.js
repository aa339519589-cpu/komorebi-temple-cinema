import * as T from 'three';
import {createMountainTransport238,installMountainTransport238} from './mountain-transport238.js';

// Original inferred landscape, rebuilt as a closed, coherent forested mass.
// Fine canopy relief is metric surface geometry. No repeated crown skins,
// photographic albedo projection, camera-facing plane or screen adjustment.
export function createForestRange238({emit,noise2,direction}){
 const minX=-150,maxX=150,minZ=-201,maxZ=-26,nx=960,nz=560,dx=(maxX-minX)/nx,dz=(maxZ-minZ)/nz,stride=nx+1,topCount=stride*(nz+1),bottomY=-18;
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 const profiles=Array.from({length:4},(_,i)=>{const layer=3-i,base=-48-layer*19;return{layer,base,surface:(x,z)=>{
  const ridge=8+layer*1.7+(8+layer)*Math.pow(.5+.5*Math.sin(x*.025+layer*1.3),2)+3.5*Math.sin(x*.062+layer*.7),j=(base-z)/.96,leftDrop=12*Math.max(0,Math.min(1,(-x-20)/40));
  return Math.max(-2,ridge*(1-.65*j/100)+.7*Math.sin(x*.12+j*.7)+1.25*(noise2(x*.13,z*.13)-.5)+.28*(noise2(x*.48,z*.48)-.5)-leftDrop);
 }};});
 function ground(x,z){
  let y=-3;
  for(const {base,surface}of profiles){
   if(z>base+22||z<base-96)continue;let h;
   if(z>base){const t=1-(z-base)/22;h=-3+(surface(x,base)+3)*t*t*(3-2*t)+1.5*(noise2(x*.22,z*.22)-.5)*Math.sin(t*Math.PI);}
   else h=-3+(surface(x,z)+3)*smooth(0,12,z-(base-96));
   const k=.24,b=Math.max(0,k-Math.abs(y-h))/k;y=Math.max(y,h)+b*b*k*.25;
  }
  return y;
 }
 const groundHeights=new Float32Array(topCount),heights=new Float32Array(topCount),positions=[],colors=[],index=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const x=minX+i*dx,z=maxZ-j*dz,k=j*stride+i,base=ground(x,z),cover=smooth(-1.5,2.5,base),relief=cover*(.10+.30*noise2(x*.60,z*.60)+.14*noise2(x*2.3,z*2.3)),y=base+relief;
  groundHeights[k]=base;heights[k]=y;positions.push(x,heights[k],z);
  const species=noise2(x*.08+13,z*.08-7),q=.65+.35*noise2(x*.70,z*.70)+.15*noise2(x*3.1+11,z*3.1-5);
  colors.push(q*(.84+.10*species),q,q*(.61+.10*species));
 }
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*stride+i,b=a+1,c=a+stride,d=c+1;index.push(a,b,c,b,d,c);}
 const perimeter=[...Array.from({length:nx+1},(_,i)=>i),...Array.from({length:nz},(_,j)=>(j+1)*stride+nx),...Array.from({length:nx},(_,i)=>nz*stride+nx-1-i),...Array.from({length:nz-1},(_,j)=>(nz-1-j)*stride)],bottomStart=positions.length/3;
 for(const k of perimeter){positions.push(positions[k*3],bottomY,positions[k*3+2]);colors.push(.25,.22,.16);}
 const bottomCentre=positions.length/3;positions.push((minX+maxX)/2,bottomY,(minZ+maxZ)/2);colors.push(.25,.22,.16);
 for(let i=0;i<perimeter.length;i++){
  const j=(i+1)%perimeter.length,a=perimeter[i],b=perimeter[j],c=bottomStart+i,d=bottomStart+j;
  index.push(a,c,b,b,c,d,bottomCentre,d,c);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(index);geometry.computeVertexNormals();geometry.userData.naturalMember='closed-coherent-forested-terrain-volume238-r29';
 const grid={nx,nz,minX,maxX,minZ,maxZ,dx,dz,heights},transport=createMountainTransport238({surfaceGrid:grid,direction});
 const step=4,cnx=nx/step,cnz=nz/step,cstride=cnx+1,controls=new Float32Array(cstride*(cnz+1));
 for(let j=0;j<=cnz;j++)for(let i=0;i<=cnx;i++){const gi=i*step,gj=j*step,k=gj*stride+gi;controls[j*cstride+i]=transport.surfaceVisibility(minX+gi*dx,heights[k]+.08,maxZ-gj*dz);}
 const visibility=new Float32Array(geometry.attributes.position.count);visibility.fill(1);
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const xx=i/step,zz=j/step,a=Math.min(cnx-1,Math.floor(xx)),b=Math.min(cnz-1,Math.floor(zz)),u=xx-a,v=zz-b,A=controls[b*cstride+a],B=controls[b*cstride+a+1],C=controls[(b+1)*cstride+a],D=controls[(b+1)*cstride+a+1];
  visibility[j*stride+i]=(A*(1-u)+B*u)*(1-v)+(C*(1-u)+D*u)*v;
 }
 geometry.setAttribute('mountainSunVisibility238',new T.Float32BufferAttribute(visibility,1));
 const material=new T.MeshPhysicalMaterial({name:'scene07-coherent-forest-canopy-aggregate238-r29',roughness:.96,metalness:0,ior:1.38,specularIntensity:.12,vertexColors:true});material.color.setRGB(.045,.090,.030);installMountainTransport238(material);emit(geometry,material,0,0,0);
 function groundHeight(x,z){
  if(x<minX||x>maxX||z<minZ||z>maxZ)return-Infinity;
  const xx=(x-minX)/dx,zz=(maxZ-z)/dz,i=Math.min(nx-1,Math.max(0,Math.floor(xx))),j=Math.min(nz-1,Math.max(0,Math.floor(zz))),u=xx-i,v=zz-j,a=groundHeights[j*stride+i],b=groundHeights[j*stride+i+1],c=groundHeights[(j+1)*stride+i],d=groundHeights[(j+1)*stride+i+1];
  return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
 }
 return{transport,groundHeight,geometry,grid,info:{revision:'scene07-continuous-closed-forest-range238-r29',sourceProfiles:4,coherentClosedVolume:true,grid:[nx,nz],spacingModelMetres:[dx,dz],topVertices:topCount,vertices:geometry.attributes.position.count,triangles:geometry.index.count/3,surfaceSolarControlGrid:[cnx,cnz],sourcePointControls:controls.length,canopyReliefModelMetres:[.10,.54],smallCrownSkinsRemoved:true,resolvedSourcePinesRetained:true,effectiveCanopyBSDF:{linearColor:[.045,.090,.030],roughness:.96,ior:1.38,specularIntensity:.12},newTextureSamplers:0,cameraInput:false,sourceImageSampled:false,visualAccepted:false}};
}
