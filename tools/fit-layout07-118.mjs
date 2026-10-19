import * as T from '../vendor/build/three.module.js';
import {writeFile} from 'node:fs/promises';
const camera=new T.PerspectiveCamera(47,1,.1,350);camera.position.set(10.7,12.8,36);camera.lookAt(0,7,-2);camera.updateMatrixWorld(true);
const place=(pixel,y)=>{const r=new T.Vector3(pixel[0]/1254*2-1,1-pixel[1]/1254*2,.5).unproject(camera).sub(camera.position).normalize();return camera.position.clone().addScaledVector(r,(y-camera.position.y)/r.y).toArray();};
const project=p=>{const q=new T.Vector3(...p).project(camera);return[(q.x+1)*627,(1-q.y)*627];};
const samples={
 railCorner:{pixel:[479,1005],height:7.40},
 railRightEnd:{pixel:[1390,1298],height:7.40},
 railLeftEnd:{pixel:[-180,1307],height:7.40},
 bridgeLeft:{pixel:[404,710],height:3.8},
 bridgeQuarter:{pixel:[475,699],height:4.5},
 bridgeCrown:{pixel:[561,702],height:5.0},
 bridgeThreeQuarter:{pixel:[653,725],height:4.5},
 bridgeRight:{pixel:[755,759],height:4.5},
 bridgeStairEnd:{pixel:[1005,817],height:2.5},
};
const output={revision:'layout118',imageDimensions:[1254,1254],reference:'references/hd/6-照片-7.jpg',method:'Manually observed image landmarks. Actual3D camera ray intersects authored physical height; depths and unseen joinery are inferred, not recovered ground truth. No reference texture/depth projection.',camera:{position:camera.position.toArray(),target:[0,7,-2],fov:47},landmarks:{}};
for(const[name,s]of Object.entries(samples)){const world=place(s.pixel,s.height);output.landmarks[name]={...s,world,reprojection:project(world)};}
const points=[[653,677],[788,680],[810,726],[720,732]];
output.landing=points.map(pixel=>({pixel,world:place(pixel,4)}));
await writeFile('qa/ten-reference/07/layout118/observed-layout.json',JSON.stringify(output,null,2)+'\n');
await writeFile('reconstructions/scene-07/src/layout118-data.js','// Authored landmark fits; depths inferred at fixed physical heights. See tools/fit-layout07-118.mjs.\nexport const layout118='+JSON.stringify(output,null,2)+';\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(output.landmarks).map(([k,v])=>[k,v.world])),null,2));
