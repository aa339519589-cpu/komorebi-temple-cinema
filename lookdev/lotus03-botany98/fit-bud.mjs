// node --loader ./qa/ten-reference/04/tower77-landmarks/module-alias-loader.mjs lookdev/lotus03-botany98/fit-bud.mjs
import * as T from '../../vendor/build/three.module.js';
import {createRestorationLotusBud} from '../../reconstructions/scene-03/src/restoration-lotus-petal.js';
import {referenceCamera as c} from '../../reconstructions/scene-03/src/hall-layout.js';
import {writeFile} from 'node:fs/promises';
const camera=new T.PerspectiveCamera(c.fov,1,.08,180);
camera.position.fromArray(c.position);camera.lookAt(...c.target);camera.updateMatrixWorld(true);
const geometry=createRestorationLotusBud(),vertices=geometry.attributes.position;
function bounds(q,angle=0){
 const matrix=new T.Matrix4().compose(new T.Vector3(q[0],q[1],16.45),new T.Quaternion().setFromEuler(new T.Euler(0,0,angle)),new T.Vector3().setScalar(q[2]));
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(let i=0;i<vertices.count;i++){
  const v=new T.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(matrix).project(camera),x=(v.x*.5+.5)*1254,y=(.5-v.y*.5)*1254;
  minX=Math.min(x,minX);maxX=Math.max(x,maxX);minY=Math.min(y,minY);maxY=Math.max(y,maxY);
 }
 return{minX,minY,maxX,maxY,cx:(minX+maxX)/2,cy:(minY+maxY)/2,height:maxY-minY,width:maxX-minX};
}
const target=[105,1060,180],q=[-2.88,.18,.55],angle=-.26;
for(let iteration=0;iteration<12;iteration++){
 const b=bounds(q,angle),f=[b.cx,b.cy,b.height],error=f.map((x,i)=>target[i]-x),J=[];
 for(let j=0;j<3;j++){const v=[...q];v[j]+=.00001;const bb=bounds(v,angle);J.push([bb.cx,bb.cy,bb.height].map((x,i)=>(x-f[i])/.00001));}
 const derivative=new T.Matrix3().set(J[0][0],J[1][0],J[2][0],J[0][1],J[1][1],J[2][1],J[0][2],J[1][2],J[2][2]);
 const step=new T.Vector3(...error).applyMatrix3(derivative.invert());q[0]+=step.x;q[1]+=step.y;q[2]+=step.z;
}
const result={before:bounds([-2.88,.18,1]),target,after:bounds(q,angle),parameters:{position:[q[0],q[1],16.45],scale:q[2],rotation:[0,0,angle]},note:'AABB fit to manually observed reference silhouette, not photographic or metric depth recovery',photographicAcceptance:false};
await writeFile(new URL('./fit.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));geometry.dispose();
