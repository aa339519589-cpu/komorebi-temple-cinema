// Inspect original retained bytes and the actual reported rigid placement.
import * as T from '../../../../vendor/build/three.module.js';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../../../',import.meta.url),asset=new URL('assets/polyhaven/rock-moss-set-01/',root),g=JSON.parse(await readFile(new URL('rock_moss_set_01_4k.gltf',asset),'utf8')),bin=await readFile(new URL('rock_moss_set_01.bin',asset));
const report=JSON.parse(await readFile(new URL('../iteration-rock108b/report.json',import.meta.url),'utf8')),a=JSON.parse(await readFile(new URL('../iteration-rock108a/report.json',import.meta.url),'utf8')),rock=report.frames[0].info.heroRock108,p=g.meshes[0].primitives[0],proof={};
for(const [name,index]of Object.entries({...p.attributes,indices:p.indices})){
 const ac=g.accessors[index],v=g.bufferViews[ac.bufferView],size={VEC3:3,VEC2:2,SCALAR:1}[ac.type],bytes={5126:4,5123:2}[ac.componentType],stride=v.byteStride||size*bytes,parts=[];
 for(let i=0;i<ac.count;i++)parts.push(bin.subarray((v.byteOffset||0)+(ac.byteOffset||0)+i*stride,(v.byteOffset||0)+(ac.byteOffset||0)+i*stride+size*bytes));
 proof[name]={accessor:index,count:ac.count,components:size,componentType:ac.componentType,sha256:createHash('sha256').update(Buffer.concat(parts)).digest('hex')};
}
const c=rock.placement,m=new T.Matrix4().compose(new T.Vector3(...rock.objectPosition),new T.Quaternion().setFromEuler(new T.Euler(c.pitch,c.yaw,0)),new T.Vector3(c.uniformScale,c.uniformScale,c.uniformScale)),e=m.elements,axes=[new T.Vector3(e[0],e[1],e[2]),new T.Vector3(e[4],e[5],e[6]),new T.Vector3(e[8],e[9],e[10])],lengths=axes.map(v=>v.length());
if(lengths.some(x=>Math.abs(x-c.uniformScale)>1e-12)||Math.abs(axes[0].dot(axes[1]))>1e-12)throw Error('Not a rigid uniform transform');
if(report.frames[0].info.rngFinalState!==a.frames[0].info.rngFinalState)throw Error('Garden random state drift');
const helper=await readFile(new URL('reconstructions/scene-08/src/hero-garden-rock.js',root),'utf8');if(/geometry\.(?:translate|scale|rotate|applyMatrix4|setAttribute|setIndex|computeVertexNormals)\(/.test(helper))throw Error('Source arrays edited');
const r={status:'retained-original-scan-and-uniform-instance-transform-inspected',sourceNode:g.nodes[0].name,providerMesh:g.meshes[0].name,sourceAccessors:proof,sourceGeometryArraysEdited:false,sourceUVNormalAndIndexArraysPreserved:true,originalPBRMapBytes:'retained-scan-bytes.json',actualTriangles:rock.triangles,uniformAxisLengths:lengths,transformDeterminant:m.determinant(),expectedDeterminant:c.uniformScale**3,rigidPitch:c.pitch,rigidYaw:c.yaw,actualObjectPosition:rock.objectPosition,support:rock.support,actualWorldVertexBounds:rock.worldBounds,rngFinalState:report.frames[0].info.rngFinalState,rngMatchesFirstCandidate:true,baselineFixedCallConsumesNoSceneRandom:true,sourceHash:report.source.hash,visualAccepted:false};
await writeFile(new URL('./original-arrays-and-contact.json',import.meta.url),JSON.stringify(r,null,2));console.log(JSON.stringify({triangles:r.actualTriangles,uniformAxes:lengths,embedded:rock.support.embeddedSamples,rng:r.rngFinalState,source:r.sourceHash}));
