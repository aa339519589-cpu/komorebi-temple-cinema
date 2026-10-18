import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import * as T from '../../../../vendor/build/three.module.js';
const root=new URL('../../../../',import.meta.url);
const assetRoot=new URL('reconstructions/scene-08/assets/gate-plaque-v04/',root);
const bytes=await readFile(new URL('gate-plaque.glb',assetRoot));
if(bytes.toString('ascii',0,4)!=='glTF'||bytes.readUInt32LE(4)!==2)throw Error('Not GLB2');
const doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
const bounds=new T.Box3(),parts=[];
function visit(i,parent){
 const n=doc.nodes[i],local=n.matrix?new T.Matrix4().fromArray(n.matrix):new T.Matrix4().compose(new T.Vector3(...(n.translation??[0,0,0])),new T.Quaternion(...(n.rotation??[0,0,0,1])),new T.Vector3(...(n.scale??[1,1,1]))),world=parent.clone().multiply(local);
 if(n.mesh!==undefined){for(const p of doc.meshes[n.mesh].primitives){const a=doc.accessors[p.attributes.POSITION],box=new T.Box3();for(const x of[a.min[0],a.max[0]])for(const y of[a.min[1],a.max[1]])for(const z of[a.min[2],a.max[2]])box.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(world));bounds.union(box);parts.push({name:n.name,triangles:(doc.accessors[p.indices]?.count??a.count)/3,bounds:{min:box.min.toArray(),max:box.max.toArray()}});}}
 for(const child of n.children??[])visit(child,world);
}
for(const n of doc.scenes[doc.scene??0].nodes)visit(n,new T.Matrix4());
const unchanged=['src/main.js','src/gate-hardware.js','src/gallery-joinery.js','src/scanned-timber.js','src/rocks.js'];
const sourceUnchanged=[];
for(const file of unchanged){const rel='reconstructions/scene-08/'+file,base=execFileSync('git',['show','2abf69f:'+rel],{cwd:root,encoding:null}),now=await readFile(new URL(rel,root));if(!base.equals(now))throw Error('Out-of-scope source changed: '+file);sourceUnchanged.push(file);}
const build=JSON.parse(await readFile(new URL('build-report.json',assetRoot),'utf8'));
const expectedClosed=build.prototypeParts.every(p=>p.boundaryEdges===0&&p.nonmanifoldEdges===0&&p.signedVolumeM3>0);
if(doc.images?.length||doc.textures?.length||parts.length!==5||!expectedClosed||parts.reduce((n,p)=>n+p.triangles,0)!==92112)throw Error('Invalid one-board export');
const size=bounds.getSize(new T.Vector3()).toArray();
if(Math.abs(size[0]-.42)>.002||Math.abs(size[1]-.58)>.002||Math.abs(bounds.min.z+.012)>.002)throw Error('Export lost authored width, height or backplate');
const report={status:'export-audited-not-visual-acceptance',visualAccepted:false,asset:'gate-plaque-v04',sha256:createHash('sha256').update(bytes).digest('hex'),meshCount:doc.meshes.length,materialCount:doc.materials.length,images:doc.images??[],textures:doc.textures??[],parts,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray(),size},closedSolidAudit:build.prototypeParts,unchangedAgainst:'2abf69f',sourceUnchanged,scope:'Exactly one inner-face plate at [-1.983,3.3,7.9], rotationY=pi/2. Main camera, movement, focus, FOV, architecture, lights and all other fittings retain the base source.'};
await writeFile(new URL('export-audit.json',assetRoot),JSON.stringify(report,null,2)+'\n');
await writeFile(new URL('export-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({asset:report.asset,meshes:parts.length,triangles:parts.reduce((n,p)=>n+p.triangles,0),bounds:report.bounds,closed:expectedClosed,unchanged:sourceUnchanged}));
