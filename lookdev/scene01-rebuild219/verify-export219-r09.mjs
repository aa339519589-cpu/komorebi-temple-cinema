import {readFile,stat,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,basename} from 'node:path';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
import * as T from '../../vendor/build/three.module.js';
import {encodeWebglPng} from '../../tools/encode-webgl-png.mjs';
const here=resolve('lookdev/scene01-rebuild219'),settings=JSON.parse(await readFile(process.env.PHYSICAL219_SETTINGS??resolve(here,'physical-r09-settings.json'))),directory=resolve(settings.exportDirectory),report=JSON.parse(await readFile(resolve(directory,'export-report.json'))),manifestBytes=await readFile(resolve(directory,'scene.json')),current=await reconstructionSourceIdentity(process.cwd(),'01');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
if(report.status!=='exported-existing-geometry'||report.sourceHash!==settings.expectedSourceHash||current.hash!==settings.expectedSourceHash||report.errors.length||!report.servedSource?.allMatch)throw Error('Export/source identity invalid');
if(report.assetStorage.uniqueBytes>settings.exportLimits.maxUniqueBytes)throw Error('Export exceeds unique-byte cap');
const cache=new Map(),verified=[];let logicalBytes=0,verifiedUniqueBytes=0;
for(const [name,expected]of Object.entries(report.exportedAssets)){
 if(basename(name)!==name)throw Error('Unsafe export filename');const path=resolve(directory,'assets',name),s=await stat(path),key=[s.dev,s.ino,s.size,s.mtimeMs].join(':'),known=cache.get(key);let actual;
 if(known)actual=known;else{const bytes=await readFile(path);actual={bytes:bytes.length,sha256:hash(bytes)};cache.set(key,actual);verifiedUniqueBytes+=bytes.length;}
 if(actual.bytes!==expected.bytes||actual.sha256!==expected.sha256)throw Error('Export bytes/hash differ: '+name);
 logicalBytes+=actual.bytes;verified.push({file:name,bytes:actual.bytes,sha256:actual.sha256,exactByteVerified:true,sharedInodeAliases:!!known});
}
const manifest=JSON.parse(manifestBytes),water=manifest.diagnosticSurfaces?.find(s=>s.name==='real-reflected-garden-pond-ripple-surface');
const nativeRaw=await readFile(resolve(directory,'assets/source-frame.rgba')),nativePng=await readFile(resolve(directory,'assets/source-frame.png')),expectedPng=encodeWebglPng(manifest.sourceFrame.width,manifest.sourceFrame.height,nativeRaw);if(!nativePng.equals(expectedPng))throw Error('Native proof PNG differs from verified source RGBA');
if(!water||water.kind!=='actual-native-planar-reflector-geometry'||water.automaticMaterialTransfer!==false)throw Error('Actual diagnostic water geometry absent');
const geometry=manifest.geometries.find(g=>g.id===water.geometry),sourceCode=await readFile('reconstructions/scene-01/src/scene.js','utf8');
if(!sourceCode.includes('new Reflector(new T.PlaneGeometry(34,31)')||!sourceCode.includes('water.rotation.x=-Math.PI/2;water.position.set(0,.13,5.2)'))throw Error('Pinned water constructor changed');
// CPU reconstruction here is a byte-comparison oracle only. Blender imports
// the official held geometry below; it never creates this comparison plane.
const expectedGeometry=new T.PlaneGeometry(34,31),waterChecks=[];
for(const key of ['position','normal','uv']){const a=expectedGeometry.getAttribute(key),values=new Float32Array(a.count*a.itemSize);for(let i=0;i<a.count;i++)for(let j=0;j<a.itemSize;j++)values[i*a.itemSize+j]=a.getComponent(i,j);const actual=await readFile(resolve(directory,'assets',geometry.attributes[key].file)),expected=Buffer.from(values.buffer);if(!actual.equals(expected))throw Error('Held water attribute differs from pinned source: '+key);waterChecks.push({attribute:key,file:geometry.attributes[key].file,bytes:actual.length,sha256:hash(actual),exact:true});}
const expectedIndex=Buffer.from(new Uint32Array(expectedGeometry.index.array).buffer),actualIndex=await readFile(resolve(directory,'assets',geometry.index.file));if(!actualIndex.equals(expectedIndex))throw Error('Held water indices differ');
const expectedObject=new T.Object3D();expectedObject.rotation.x=-Math.PI/2;expectedObject.position.set(0,.13,5.2);expectedObject.updateMatrixWorld(true);const matrixResidual=Math.max(...water.matrix.map((v,i)=>Math.abs(v-expectedObject.matrixWorld.elements[i])));if(matrixResidual>1e-14||geometry.index.count!==6||manifest.statistics.diagnosticSurfaceTriangles!==2)throw Error('Held water transform/count differs');
const result={status:'all-export-payloads-byte-and-hash-verified',writtenAt:new Date().toISOString(),sourceHash:current.hash,manifestSha256:hash(manifestBytes),exportReportSha256:hash(await readFile(resolve(directory,'export-report.json'))),fileCount:verified.length,uniquePayloadCount:cache.size,logicalBytes,verifiedUniqueBytes,verification:'Every named exported file checked against expected length and SHA256; a verified immutable hard-link inode is read once and all same-inode aliases are stat-checked. Official writer separately compared duplicate bytes before linking.',assetStorage:report.assetStorage,nativeProof:{pngSha256:hash(nativePng),bytes:nativePng.length,exactRGBAEncodeVerified:true,usedAsPhysicalSceneTexture:false},water:{sourceGeometryId:geometry.id,sourceObject:water.name,attributes:waterChecks,index:{file:geometry.index.file,sha256:hash(actualIndex),exact:true},matrix:water.matrix,maxMatrixResidual:matrixResidual,triangles:2,CPUConstructorUsedOnlyForVerification:true,physicalImportMustUseActualExportedBuffers:true,reflectionImageImported:false},files:verified};
await writeFile(process.env.PHYSICAL219_VERIFICATION??resolve(here,'export-verification-r09.json'),JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({status:result.status,sourceHash:current.hash,fileCount:result.fileCount,uniquePayloadCount:cache.size,verifiedUniqueBytes,logicalBytes}));
