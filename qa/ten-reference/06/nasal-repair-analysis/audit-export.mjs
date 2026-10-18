import {readFile,writeFile,copyFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import * as T from '../../../../vendor/build/three.module.js';
const root=new URL('../../../../',import.meta.url),version=process.env.NASAL_ASSET??'learned-face-v03-nasal',iteration=process.env.NASAL_ITERATION??'nasal87',asset='reconstructions/scene-06/assets/'+version+'/';
async function getAsset(name){
 const bytes=await readFile(new URL(name+'central-face.glb',root)),j=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12))),bounds=new T.Box3();let parts=0,triangles=0;
 function visit(i,parent){const n=j.nodes[i],local=n.matrix?new T.Matrix4().fromArray(n.matrix):new T.Matrix4().compose(new T.Vector3(...(n.translation??[0,0,0])),new T.Quaternion(...(n.rotation??[0,0,0,1])),new T.Vector3(...(n.scale??[1,1,1]))),world=parent.clone().multiply(local);if(n.mesh!==undefined)for(const p of j.meshes[n.mesh].primitives){const a=j.accessors[p.attributes.POSITION];for(const x of[a.min[0],a.max[0]])for(const y of[a.min[1],a.max[1]])for(const z of[a.min[2],a.max[2]])bounds.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(world));parts++;triangles+=(p.indices===undefined?a.count:j.accessors[p.indices].count)/3;}for(const c of n.children??[])visit(c,world);}
 for(const n of j.scenes[j.scene??0].nodes)visit(n,new T.Matrix4());
 return{sha256:createHash('sha256').update(bytes).digest('hex'),parts,triangles,images:j.images??[],textures:j.textures??[],materials:j.materials??[],bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};
}
const before=await getAsset('reconstructions/scene-06/assets/learned-face-v02/'),after=await getAsset(asset);
if(after.parts!==1||after.images.length||after.textures.length||after.materials.length)throw Error('Nose asset must remain one untextured explicit mesh');
if(JSON.stringify(before.bounds)!==JSON.stringify(after.bounds))throw Error('Nose repair changed entire head bounds or placement');
const unchanged={};
for(const file of await readdir(new URL('reconstructions/scene-06/src/',root))){if(file==='learned-face-asset.js')continue;const rel='reconstructions/scene-06/src/'+file,base=execFileSync('git',['show','8082e52:'+rel],{cwd:root,maxBuffer:16*1024*1024}),now=await readFile(new URL(rel,root));if(!base.equals(now))throw Error('Unrelated source changed: '+file);unchanged[file]=createHash('sha256').update(now).digest('hex');}
const report={status:'closed-local-mesh-export-audited-not-visual-acceptance',visualAccepted:false,baseCommit:'8082e52',before,after,unchangedSource:unchanged,scope:'Only alar closure geometry and its loader asset path. Camera/FOV/focus, lights, roughness .42, crown, native neck/body and all other source retain exact base bytes.'};
await writeFile(new URL('qa/ten-reference/06/iteration-'+iteration+'/export-audit.json',root),JSON.stringify(report,null,2)+'\n');
for(const n of ['learned-face-asset.js','reference6-main.js','reference6-scene.js','restoration-buddha.js'])await copyFile(new URL('reconstructions/scene-06/src/'+n,root),new URL('qa/ten-reference/06/iteration-'+iteration+'/source/'+n,root));
await copyFile(new URL(asset+'build-report.json',root),new URL('qa/ten-reference/06/iteration-'+iteration+'/asset-build-report.json',root));
console.log(JSON.stringify({parts:after.parts,triangles:after.triangles,bounds:after.bounds,unchangedSources:Object.keys(unchanged).length}));
