import{readFile,writeFile}from'node:fs/promises';
import{resolve}from'node:path';import{pathToFileURL}from'node:url';import{createHash}from'node:crypto';
import * as T from '../../vendor/build/three.module.js';
let code=await readFile('vendor/examples/jsm/loaders/EXRLoader.js','utf8');code=code.replace("from 'three'","from '"+pathToFileURL(resolve('vendor/build/three.module.js')).href+"'").replace("from '../libs/fflate.module.js'","from '"+pathToFileURL(resolve('vendor/examples/jsm/libs/fflate.module.js')).href+"'");
const{EXRLoader}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const path='assets/polyhaven/qwantani-sunset-puresky/sky-2k.exr',bytes=await readFile(path),data=new EXRLoader().setDataType(T.FloatType).parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const r=JSON.parse(await readFile('qa/ten-reference/07/iteration-scene07-pierced-gilt154-smooth-forest155-r02-20261021/report.json','utf8')),sky=r.frames[0].info.garden.skyRadiance,rotation=new T.Matrix4().makeRotationFromEuler(new T.Euler(...sky.environment.rotation.slice(0,3))),areas=[new T.Vector3(0,1,0),new T.Vector3(0,0,1),new T.Vector3(1,0,0),new T.Vector3(0,0,-1)],flux=areas.map(()=>0);
let peak=0,total=0,omega=0;
for(let y=0;y<data.height;y++)for(let x=0;x<data.width;x++){
 const i=(y*data.width+x)*4,L=.2126*data.data[i]+.7152*data.data[i+1]+.0722*data.data[i+2],lat=((y+.5)/data.height-.5)*Math.PI,lon=((x+.5)/data.width-.5)*2*Math.PI,c=Math.cos(lat),d=new T.Vector3(c*Math.cos(lon),Math.sin(lat),c*Math.sin(lon)).applyMatrix4(rotation),w=c*(Math.PI/data.height)*(2*Math.PI/data.width);peak=Math.max(peak,L);total+=L*w;omega+=w;areas.forEach((n,j)=>flux[j]+=L*Math.max(0,n.dot(d))*w);
}
const out={file:path,sha256:createHash('sha256').update(bytes).digest('hex'),width:data.width,height:data.height,peakLinearLuminance:peak,solidAngle:omega,meanLinearLuminance:total/omega,incidentIrradianceLuma:{up:flux[0],facadePositiveZ:flux[1],positiveX:flux[2],negativeZ:flux[3]},skySourceInfo:sky};await writeFile('lookdev/scene07-physical155/measured-radiance.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));
