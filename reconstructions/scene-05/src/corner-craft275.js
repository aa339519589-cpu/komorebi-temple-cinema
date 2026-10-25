import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {closedWire190,finishSolid190} from './detail190-solids.js';
export {closedWire190};

export function cast275(shape,depth=.008,bevel=.0012){
 const data=shape.extractPoints(12),outer=data.shape;if(!T.ShapeUtils.isClockWise(outer))outer.reverse();const normalized=new T.Shape(outer);for(const points of data.holes){if(T.ShapeUtils.isClockWise(points))points.reverse();const hole=new T.Path(points);hole.closePath();normalized.holes.push(hole);}
 const g=new T.ExtrudeGeometry(normalized,{depth,steps:1,curveSegments:12,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2});g.translate(0,0,-depth/2);return g;
}
export function ring275(rx,ry,cy=0,z=0,r=.006,N=64){
 const points=Array.from({length:N},(_,j)=>{const a=j/N*Math.PI*2;return new T.Vector3(rx*Math.cos(a),cy+ry*Math.sin(a),z);});
 return new T.TubeGeometry(new T.CatmullRomCurve3(points,true),N,r,8,true);
}
export function lathe275(profile,segments=6,name='scene05-closed-cast-profile275'){
 const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),segments,-Math.PI/6);const result=finishSolid190(Array.from(g.attributes.position.array),Array.from(g.attributes.uv.array),Array.from(g.index.array),name);g.dispose();return result;
}
export function ribbon275(points,width=.015,depth=.007,{segments=36,taper=.38,ridge=.65}={}){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),N=7,p=[],uv=[],ix=[];
 for(let j=0;j<=segments;j++){
  const t=j/segments,c=curve.getPoint(t),tangent=curve.getTangent(t),side=new T.Vector3(-tangent.y,tangent.x,0).normalize(),w=width*(taper+(1-taper)*Math.sin(Math.PI*t)**.65),d=depth,
   section=[[-w/2,-d/2],[w/2,-d/2],[w/2,d*.08],[w*.28,d*.45],[0,d*ridge],[-w*.28,d*.45],[-w/2,d*.08]];
  for(const[x,z]of section){const q=c.clone().addScaledVector(side,x);q.z+=z;p.push(...q.toArray());uv.push(t,x/width);}
 }
 for(let j=0;j<segments;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N,c=a+N,d=b+N;ix.push(a,b,c,b,d,c);}
 const ci=p.length/3;p.push(...curve.getPoint(0).toArray(),...curve.getPoint(1).toArray());uv.push(0,0,1,0);
 for(let k=0;k<N;k++)ix.push(ci,(k+1)%N,k,ci+1,segments*N+k,segments*N+(k+1)%N);
 return finishSolid190(p,uv,ix,'scene05-closed-folded-cast-ribbon275');
}
export function leaf275(length=.12,width=.040,{hole=true,depth=.006,fold=.009}={}){
 const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(-width*.5,length*.12,-width*.57,length*.31,-width*.32,length*.40);s.lineTo(-width*.48,length*.50);s.bezierCurveTo(-width*.52,length*.63,-width*.17,length*.88,0,length);s.bezierCurveTo(width*.12,length*.85,width*.52,length*.64,width*.40,length*.50);s.lineTo(width*.24,length*.43);s.bezierCurveTo(width*.54,length*.30,width*.42,length*.13,0,0);s.closePath();
 if(hole){const h=new T.Path();h.moveTo(0,length*.22);h.bezierCurveTo(width*.18,length*.35,width*.19,length*.57,0,length*.79);h.bezierCurveTo(-width*.16,length*.58,-width*.20,length*.36,0,length*.22);h.closePath();s.holes.push(h);}
 const g=cast275(s,depth,.0011),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);p.setZ(i,z+fold*Math.sin(Math.PI*y/length)*(1-Math.min(1,Math.abs(x)/width)));}g.computeVertexNormals();g.userData.closedCastLeaf275=true;return g;
}
export function craftCollector275(label){
 const bins=new Map(),owned=[],audit=[];let pieces=0;
 const add=(g,material,p=[0,0,0],rot=[0,0,0],scale=[1,1,1])=>{g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...p),rot.isQuaternion?rot:new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(...scale)));if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!g.attributes.color)g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));for(const key of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(key))g.deleteAttribute(key);owned.push(g);if(!bins.has(material))bins.set(material,[]);bins.get(material).push(g);pieces++;return g;};
 function finish(){
  // Validate each source solid before sharing the cast prototypes. This runs
  // in the same official queued native construction job; no mesh is exported.
  for(const g of owned){const p=g.attributes.position,ix=g.index,count=ix?.count??p.count,index=i=>ix?ix.getX(i):i,V=i=>new T.Vector3().fromBufferAttribute(p,i);let volume=0;for(let i=0;i<count;i+=3)volume+=V(index(i)).dot(V(index(i+1)).cross(V(index(i+2))))/6;
   if(volume<0&&ix){for(let i=0;i<ix.count;i+=3){const q=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,q);}g.computeVertexNormals();volume=-volume;}
   const edges=new Map(),key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e7)).join(':'),finite=Array.from(p.array).every(Number.isFinite);let degenerate=0;
   for(let i=0;i<count;i+=3){const v=[index(i),index(i+1),index(i+2)],k=v.map(key);if(new Set(k).size<3){degenerate++;continue;}for(let j=0;j<3;j++){const a=k[j],b=k[(j+1)%3],q=a<b?a+'|'+b:b+'|'+a;if(!edges.has(q))edges.set(q,{count:0,orientation:0});const e=edges.get(q);e.count++;e.orientation+=a<b?1:-1;}}
   const boundary=Array.from(edges.values()).filter(e=>e.count!==2).length,inconsistent=Array.from(edges.values()).filter(e=>e.orientation!==0).length;
   audit.push({name:g.name||g.type,vertices:p.count,triangles:count/3,finite,volume,boundary,inconsistent,collapsedDegenerate:degenerate});if(!finite||volume<=0)throw Error('Invalid new cast solid '+label);
  }
  const parts=[];for(const[material,list]of bins){const expanded=list.map(g=>g.index?g.toNonIndexed():g.clone()),geometry=mergeGeometries(expanded,false);expanded.forEach(g=>g.dispose());geometry.userData.ornament275Shared=true;geometry.name=label+'-'+material;owned.push(geometry);parts.push({geometry,material});}
  return{parts,pieces,audit,dispose(){owned.forEach(g=>g.dispose());}};
 }
 return{add,finish};
}
