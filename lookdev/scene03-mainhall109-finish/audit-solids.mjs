import * as T from '../../vendor/build/three.module.js';
import {createSculptedTimber109} from '../../reconstructions/scene-03/src/scene03-sculpted-timber109.js';
import {writeFile} from 'node:fs/promises';
const carving=createSculptedTimber109(T),objects=[...[[1.24,.42],[1.6,.39],[1.8,.42],[1.9,.39],[2.04,.42],[1.52,.36]].map(([l,d],rank)=>carving.cantileverArm(l,d,rank)),carving.bearingHead(0),carving.foliateStrut()];
const audit=[];
for(const g of objects){
 const p=g.attributes.position,idx=g.index.array,edges=new Map();let volume=0;
 for(let i=0;i<idx.length;i+=3){const a=idx[i],b=idx[i+1],c=idx[i+2],va=new T.Vector3().fromBufferAttribute(p,a),vb=new T.Vector3().fromBufferAttribute(p,b),vc=new T.Vector3().fromBufferAttribute(p,c);volume+=va.dot(vb.cross(vc))/6;
  for(const [u,v]of[[a,b],[b,c],[c,a]]){const key=u<v?u+','+v:v+','+u,edge=edges.get(key)||{count:0,direction:0};edge.count++;edge.direction+=u<v?1:-1;edges.set(key,edge);}
 }
 g.computeBoundingBox();const bad=[...edges.values()].filter(e=>e.count!==2||e.direction!==0).length,finite=Array.from(p.array).every(Number.isFinite);
 const record={name:g.name,vertices:p.count,triangles:idx.length/3,finite,boundaryOrInconsistentEdges:bad,signedVolume:volume,bounds:[g.boundingBox.min.toArray(),g.boundingBox.max.toArray()]};audit.push(record);if(!finite||bad||!(volume>0))throw Error(JSON.stringify(record));
}
await writeFile(new URL('./solid-audit-r03.json',import.meta.url),JSON.stringify({status:'closed-finite-oriented-solids',visualAccepted:false,scope:'Actual new wood prototypes only; neither similarity nor structural engineering acceptance.',audit},null,2)+'\n');
console.log(JSON.stringify(audit.map(({name,triangles,boundaryOrInconsistentEdges,signedVolume})=>({name,triangles,boundaryOrInconsistentEdges,signedVolume})),null,2));
