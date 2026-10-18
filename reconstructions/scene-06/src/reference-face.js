import * as T from 'three';
import {referenceFaceData as d} from './reference-face-data.js';

export function createReferenceFace(center){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(d.position,3));
 g.setAttribute('normal',new T.Float32BufferAttribute(d.normal,3));g.setAttribute('color',new T.Float32BufferAttribute(d.color,d.colorItemSize));g.setIndex(d.index);
 const uv=new Float32Array(d.position.length/3*2);
 for(let i=0;i<d.position.length/3;i++){uv[i*2]=d.position[i*3]/.66+.5;uv[i*2+1]=d.position[i*3+1]/.66+.5;}
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.translate(0,center,0);
 g.computeBoundingBox();g.computeBoundingSphere();
 g.userData.referenceBasedFace=true;g.userData.depthRecovered=false;g.userData.sourceSha256=d.sourceSha256;
 g.userData.frontAt=(x,y)=>{
  y-=center;let best=-Infinity;
  for(let i=0;i<d.index.length;i+=3){
   const a=d.index[i]*3,b=d.index[i+1]*3,c=d.index[i+2]*3;
   const ax=d.position[a],ay=d.position[a+1],bx=d.position[b],by=d.position[b+1],cx=d.position[c],cy=d.position[c+1];
   const det=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(det)<1e-12)continue;
   const u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/det,v=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/det,w=1-u-v;
   if(Math.min(u,v,w)>=-1e-7)best=Math.max(best,u*d.position[a+2]+v*d.position[b+2]+w*d.position[c+2]);
  }
  return Number.isFinite(best)?best:.20;
 };
 return g;
}
