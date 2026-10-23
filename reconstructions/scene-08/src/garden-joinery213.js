import * as T from 'three';
import{createNaturalJoinery197}from'./natural-joinery197.js';

// Closed stepped dou blocks keep the original bearing planes and extents,
// while replacing the inflated pillow profile with cut timber shoulders.
export function createSteppedReceiver213(width,height,depth,bottom=.65){
 const levels=[[0,bottom],[.12,bottom],[.18,bottom+.035],[.72,.94],[.81,.94],[.86,1],[1,1]],p=[],uv=[],ix=[];
 for(const[y,s]of levels){const w=width*s/2,d=depth*s/2,c=Math.min(w,d)*.10;for(const[x,z]of[[-w+c,-d],[w-c,-d],[w,-d+c],[w,d-c],[w-c,d],[-w+c,d],[-w,d-c],[-w,-d+c]]){p.push(x,y*height,z);uv.push(x+z,y*height);}}
 for(let j=0;j<levels.length-1;j++)for(let i=0;i<8;i++){const a=j*8+i,b=j*8+(i+1)%8,c=a+8,d=b+8;ix.push(a,c,b,b,c,d);}
 const lo=p.length/3,hi=lo+1;p.push(0,0,0,0,height,0);uv.push(0,0,0,height);for(let i=0;i<8;i++){const j=(i+1)%8;ix.push(lo,i,j,hi,(levels.length-1)*8+j,(levels.length-1)*8+i);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();flat.name='scene08-213-stepped-closed-timber-dou';flat.userData={loadPath213:true,originalBearingExtentsHeld:true};return flat;
}
export function createGardenJoinery213(){
 const kit=createNaturalJoinery197(),replaced=[];
 for(const i of[0,3,4,5,6,11,12,13,14]){
  const old=kit.parts[i];old.geometry.computeBoundingBox();const b=old.geometry.boundingBox,size=b.getSize(new T.Vector3()),centre=b.getCenter(new T.Vector3()),g=createSteppedReceiver213(size.x,size.y,size.z,i===0?.64:.72);g.translate(centre.x,b.min.y,centre.z);kit.resources.add(g);kit.parts[i]={...old,geometry:g,material:'red'};replaced.push({index:i,bounds:[b.min.toArray(),b.max.toArray()]});
 }
 kit.info213={revision:'scene08-stepped-dou-profile213-r02',replaced,originalTopBottomPlanesHeld:true,originalCrossArmsAnd191PortalSpaceHeld:true,referenceImageSampled:false,visualAccepted:false};return kit;
}
