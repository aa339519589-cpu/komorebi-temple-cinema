import * as T from 'three';

// A single closed curved stem, including both root and peltate/flower neck.
// Underwater pigment is an explicit native approximation, not absorption.
export function createRootedLotusStem107(bottom,top,radius){
 const a=new T.Vector3(...bottom),b=new T.Vector3(...top),length=a.distanceTo(b),phase=bottom[0]*3.7+bottom[2]*2.1,bow=Math.min(.085,length*.055),side=new T.Vector3(Math.cos(phase)*bow,0,Math.sin(phase)*bow),curve=new T.CatmullRomCurve3([a,a.clone().lerp(b,.29).addScaledVector(side,.62),a.clone().lerp(b,.72).add(side),b]),g=new T.TubeGeometry(curve,20,radius,8,false),p=[...g.attributes.position.array],uv=[...g.attributes.uv.array],ids=[...g.index.array],stride=9;
 for(const [ring,point,reverse]of[[0,a,true],[20,b,false]]){
  const c=p.length/3;p.push(...point.toArray());uv.push(.5,ring/20);
  for(let j=0;j<8;j++){const x=ring*stride+j,y=x+1;ids.push(...(reverse?[c,x,y]:[c,y,x]));}
 }
 const colors=[];for(let j=0;j<p.length;j+=3){const t=T.MathUtils.smoothstep(p[j+1],-.080,-.043),c=new T.Color().setRGB(.23,.34,.31).lerp(new T.Color(1,1,1),t);colors.push(...c.toArray());}
 g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ids);g.computeVertexNormals();g.name='scene03-closed-rooted-curved-lotus-stem107';g.userData={closedStem:true,root:[...bottom],neck:[...top],radius,waterline:-.055,underwater:'standard vertex pigment approximation only',referenceRGB:false};return g;
}
