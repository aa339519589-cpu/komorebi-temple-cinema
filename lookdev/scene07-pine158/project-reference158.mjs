import * as T from '../../vendor/build/three.module.js';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const here=dirname(fileURLToPath(import.meta.url)),project=resolve(here,'../..'),out=resolve(here,process.env.PINE_REVISION||'r04');
const terrainPath=resolve(project,'reconstructions/scene-07/src/garden-terrain.js'),terrain=await readFile(terrainPath,'utf8');
const moduleText=terrain.replace("from 'three'",'from '+JSON.stringify(pathToFileURL(resolve(project,'vendor/build/three.module.js')).href)).replace("from './layout118-data.js'",'from '+JSON.stringify(pathToFileURL(resolve(project,'reconstructions/scene-07/src/layout118-data.js')).href));
const {gardenHeight}=await import('data:text/javascript;base64,'+Buffer.from(moduleText).toString('base64'));
const data=JSON.parse(await readFile(resolve(out,'model.json'),'utf8')),binary=await readFile(resolve(out,data.binary));
const camera=new T.PerspectiveCamera(47,1,.1,500);camera.position.set(10.7,12.8,36);camera.lookAt(0,7,-2);camera.updateMatrixWorld();
const garden=new T.Matrix4().makeTranslation(0,0,-3).multiply(new T.Matrix4().makeScale(1,1,.6));
const pixel=point=>{const p=point.clone().project(camera);return [(p.x+1)*627,(1-p.y)*627];};
const trees=data.trees.map(tree=>{
  const o=tree.origin,rootY=Math.max(0,gardenHeight(o.x,o.z*.6-3)),matrix=garden.clone().multiply(new T.Matrix4().compose(new T.Vector3(o.x,rootY,o.z),new T.Quaternion().setFromEuler(new T.Euler(0,o.yaw,0)),new T.Vector3(1,1,1)));
  const a=data.meshes[tree.bark].attributes.position,positions=new Float32Array(binary.buffer,binary.byteOffset+a.byteOffset,a.count),min=[Infinity,Infinity],max=[-Infinity,-Infinity];
  for(let i=0;i<positions.length;i+=3){const p=pixel(new T.Vector3(positions[i],positions[i+2],-positions[i+1]).applyMatrix4(matrix));for(let axis=0;axis<2;axis++){min[axis]=Math.min(min[axis],p[axis]);max[axis]=Math.max(max[axis],p[axis]);}}
  return {id:tree.id,rootWorld:[o.x,rootY,o.z*.6-3],rootPixel:pixel(new T.Vector3().applyMatrix4(matrix)),woodScreenBounds:{min,max},scope:'Perspective projection of the exact wood buffers, not a render or image similarity score. Needle tips extend beyond wood bounds.'};
});
const audit={revision:data.revision,sourceSha256:data.sourceSha256,terrainSha256:createHash('sha256').update(terrain).digest('hex'),referenceCamera:{position:[10.7,12.8,36],target:[0,7,-2],verticalFovDegrees:47,size:[1254,1254]},trees,visualAccepted:false,scope:'Frozen geometry placement check against the current physical reference camera. No module code reads a camera or projected position at runtime.'};
await writeFile(resolve(out,'reference-projection.json'),JSON.stringify(audit,null,2));console.log(JSON.stringify(audit));
