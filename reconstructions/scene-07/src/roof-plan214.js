import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {inverseRoofRise319,ridgeCamber319} from './roof-section319.js';

// A fixed inferred skew ridge over the retained eave perimeter. This changes
// actual roof/rafter/gable geometry. There is no camera or image coordinate
// input; the inverse is also used by column and ceiling contact queries.
function parameter214(spec,x,z){
 const hw=spec.w/2,hd=spec.d/2,ridge=spec.w*(spec.ridgeFraction??(spec.gabled?.30:.24)),cut=spec.gabled?.43:0;
 const side=Math.abs(x)>ridge?cut+(1-cut)*(Math.abs(x)-ridge)/(hw-ridge):0;
 return Math.max(Math.abs(z)/hd,side);
}
export function roofPlanPoint214(spec,p,parameter=null){
 if(!spec.ridgeSkew)return p;
 const t=parameter??parameter214(spec,p[0],p[2]),weight=Math.pow(Math.max(0,1-t),1.5);
 return[p[0],p[1],p[2]+spec.ridgeSkew*p[0]*weight];
}
export function roofPlanRawZ214(spec,x,z){
 if(!spec.ridgeSkew)return z;
 const hd=spec.d/2;if(Math.abs(z)>hd*1.04+Math.abs(spec.ridgeSkew*x))return z;
 let lo=-hd*1.04,hi=hd*1.04;
 for(let i=0;i<34;i++){const mid=(lo+hi)/2,mapped=roofPlanPoint214(spec,[x,0,mid])[2];if(mapped<z)lo=mid;else hi=mid;}
 return(lo+hi)/2;
}

// Ridge caps and the enclosing timber diaphragm are authored independently
// of the roof's parametric skin. Move these real solids into the same ridge
// plan; vertical gable boards follow the rise parameter at their own height.
export function createRoofDetailAPI214(api,spec){
 if(!spec.ridgeSkew)return api;
 const exponent=spec.gabled?1.72:1.49;
 const mapPoint=p=>{
  const ordinate=T.MathUtils.clamp((p[1]-spec.e)/spec.rise,0,1),ty=spec.profile319?inverseRoofRise319(ordinate):(1-Math.pow(ordinate,1/exponent)),t=Math.max(Math.abs(p[2])/(spec.d/2),ty),w=Math.pow(Math.max(0,1-t),1.5);
  return[p[0],p[1]+(spec.profile319?ridgeCamber319(spec,p[0],t):0),p[2]+spec.ridgeSkew*p[0]*w];
 };
 function geometry(g,matrix=new T.Matrix4()){
  g=g.clone().applyMatrix4(matrix);const p=g.attributes.position;
  for(let i=0;i<p.count;i++)p.setXYZ(i,...mapPoint([p.getX(i),p.getY(i),p.getZ(i)]));
  if(matrix.determinant()<0){if(!g.index)g.setIndex(Array.from({length:p.count},(_,i)=>i));const ix=g.index.array;for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];}
  g.computeVertexNormals();g.computeBoundingBox();return g;
 }
 const emit=(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=[0,0,0],tint=1)=>{
  const matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(sx,sy,sz));api.emit(geometry(g,matrix),m,0,0,0,1,1,1,[0,0,0],tint);
 };
 const box=(x,y,z,w,h,d,m,rot=[0,0,0],tint=1)=>{const g=new RoundedBoxGeometry(w,h,d,2,Math.min(.012,w*.1,h*.1,d*.1));emit(g,m,x,y,z,1,1,1,Array.isArray(rot)?rot:[0,rot,0],tint);g.dispose();};
 const rod=(a,b,r,m='wood',r2=r)=>{
  const p=new T.Vector3(...a),q=new T.Vector3(...b),d=q.clone().sub(p),matrix=new T.Matrix4().compose(p.add(q).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize()),new T.Vector3(1,1,1)),g=new T.CylinderGeometry(r2,r,d.length(),12);
  api.emit(geometry(g,matrix),m,0,0,0);g.dispose();
 };
 return{...api,emit,box,rod,geometry};
}
