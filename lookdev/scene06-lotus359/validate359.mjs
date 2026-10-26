import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=process.cwd(),lane=resolve(root,'lookdev/scene06-lotus359'),candidate=resolve(process.argv[2]||resolve(lane,'candidate-r01'));
const three=pathToFileURL(resolve(root,'vendor/build/three.module.js')).href,T=await import(three);
const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const utils=data((await readFile(resolve(root,'vendor/examples/jsm/utils/BufferGeometryUtils.js'),'utf8')).replaceAll("'three'",JSON.stringify(three)));
const gilt=data((await readFile(resolve(candidate,'reconstructions/scene-06/src/lotus-gilt222.js'),'utf8')).replaceAll("'three'",JSON.stringify(three)));
async function load(name){return import(data((await readFile(resolve(candidate,'reconstructions/scene-06/src',name),'utf8')).replaceAll("'three'",JSON.stringify(three)).replaceAll("'three/addons/utils/BufferGeometryUtils.js'",JSON.stringify(utils)).replaceAll("'./lotus-gilt222.js'",JSON.stringify(gilt))));}
const profile=JSON.parse(await readFile(resolve(candidate,'reconstructions/scene-06/assets/lotus-contact179-r07/profiles.json'),'utf8')).profiles.central;
function builder(){return{root:{userData:{}},records:[],materials:Object.fromEntries(['lotusGold','lotusGiltSoft','lotusEdge','lotusCore','lotusShadow'].map(k=>[k,new T.MeshStandardMaterial()])),geometry:(key,fn)=>{const g=fn();g.name=key;return g;},add(g,m){this.records.push({g,m});},lathe(){},torus(){}};}
const old=builder(),current=builder(),options={radius:1.18,height:.64,depthAspect:.72,sourceBearing:profile};
(await load('lotus-throne222.js')).buildLayeredLotus222(old,options);
(await load('lotus-throne359.js')).buildLayeredLotus359(current,options);
const hash=g=>createHash('sha256').update(g.attributes.position.array).update(g.attributes.normal.array).update(g.attributes.uv.array).update(g.index.array).digest('hex');
const result={candidate,parameters:options,coreExact258:hash(old.records[0].g)===hash(current.records[0].g),coreSha256:hash(current.records[0].g),oldTriangles:old.records.reduce((n,{g})=>n+g.index.count/3,0),newTriangles:0,geometries:[],photographicAccepted:false};delete result.parameters.sourceBearing;
for(const {g,m}of current.records){
 const p=g.attributes.position,ix=g.index.array,edges=new Map();let minArea=Infinity,degenerate=0,nonfinite=0;
 for(const x of p.array)if(!Number.isFinite(x))nonfinite++;
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(let j=0;j<ix.length;j+=3){a.fromBufferAttribute(p,ix[j]);b.fromBufferAttribute(p,ix[j+1]);c.fromBufferAttribute(p,ix[j+2]);const area=b.sub(a).cross(c.sub(a)).length()/2;minArea=Math.min(minArea,area);if(area<1e-12)degenerate++;
  for(const [u,v]of[[ix[j],ix[j+1]],[ix[j+1],ix[j+2]],[ix[j+2],ix[j]]]){const key=u<v?u+','+v:v+','+u;edges.set(key,(edges.get(key)||0)+1);}
 }
 g.computeBoundingBox();const triangles=ix.length/3;result.newTriangles+=triangles;
 result.geometries.push({name:g.name,material:m,vertices:p.count,triangles,nonfinite,degenerate,minArea,edgesWithOneIncidentTriangle:[...edges.values()].filter(n=>n===1).length,edgesWithMoreThanTwoIncidentTriangles:[...edges.values()].filter(n=>n>2).length,bounds:[g.boundingBox.min.toArray(),g.boundingBox.max.toArray()]});
}
result.valid=result.coreExact258&&result.geometries.every(g=>g.nonfinite===0&&g.degenerate===0&&(!g.name.includes('layer')||g.edgesWithOneIncidentTriangle===0&&g.edgesWithMoreThanTwoIncidentTriangles===0));
await writeFile(resolve(lane,candidate.split('/').at(-1)+'-geometry-validation.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({valid:result.valid,coreExact258:result.coreExact258,oldTriangles:result.oldTriangles,newTriangles:result.newTriangles,geometries:result.geometries}));
if(!result.valid)process.exitCode=1;
