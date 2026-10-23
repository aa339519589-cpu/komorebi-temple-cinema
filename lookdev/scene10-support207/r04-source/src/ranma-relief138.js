import * as T from 'three';

// Generated sculpting-guide values become independently lit solid geometry.
// The guide is never loaded by any visible material, sky or camera projection.
const url=new URL('../../../assets/ranma-relief-v01/height-field.json',import.meta.url);
const response=await fetch(url);if(!response.ok)throw Error('Relief field unavailable');
const field=await response.json();

export function createRanmaRelief138(){
 const {columns:W,rows:H,height,cutoff}=field,positions=[],uv=[],index=[],active=new Uint8Array((W-1)*(H-1));
 const at=(x,y)=>height[y*W+x],cell=(x,y)=>y*(W-1)+x,inside=(x,y)=>x>=0&&y>=0&&x<W-1&&y<H-1&&active[cell(x,y)];
 for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++)active[cell(x,y)]=(at(x,y)+at(x+1,y)+at(x,y+1)+at(x+1,y+1))*.25>cutoff?1:0;
 for(let side=0;side<2;side++)for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const u=x/(W-1),v=y/(H-1),h=Math.max(0,(at(x,y)-cutoff)/(255-cutoff));
  positions.push(u-.5,.5-v,side===0?.004+.080*Math.pow(h,1.25):-.012);uv.push(u,v);
 }
 const bottom=W*H;
 for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++)if(inside(x,y)){
  const a=y*W+x,b=a+1,c=a+W,d=c+1;index.push(a,c,b,b,c,d,a+bottom,b+bottom,c+bottom,b+bottom,d+bottom,c+bottom);
  // Close every cut-out boundary down to the buried solid backing face.
  const wall=(i,j)=>index.push(i,j,i+bottom,j,j+bottom,i+bottom);
  if(!inside(x,y-1))wall(a,b);if(!inside(x-1,y))wall(c,a);
  if(!inside(x,y+1))wall(d,c);if(!inside(x+1,y))wall(b,d);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();g.computeBoundingBox();
 g.name='closed-sculpted-lotus-karakusa-relief138';g.userData={closedSolid:true,source:'assets/ranma-relief-v01/provenance.json',bitmapInMaterial:false,nonMetricGuide:true,triangles:index.length/3};return g;
}
