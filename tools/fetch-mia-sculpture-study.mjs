import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(new URL('..',import.meta.url).pathname),out=resolve(root,'assets/mia-amoghasiddhi-study');
const uid='33699be99fd64375bf0371c0e0c12f70';
const metadataUrl='https://api.sketchfab.com/v3/models/'+uid;
const mirror='https://huggingface.co/datasets/allenai/objaverse/resolve/main/glbs/000-062/'+uid+'.glb';
const response=await fetch(metadataUrl,{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw Error('Museum model metadata unavailable '+response.status);
const metadata=await response.json();
if(metadata.uid!==uid||metadata.user?.username!=='artsmia'||metadata.license?.label!=='CC0 Public Domain')throw Error('Unverified model attribution or CC0 license');
await mkdir(out,{recursive:true});let bytes;
try{bytes=await readFile(resolve(out,'source.glb'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(!bytes){
 const source=await fetch(mirror,{signal:AbortSignal.timeout(120000)});
 if(!source.ok)throw Error('Public CC0 dataset mirror unavailable '+source.status);
 bytes=Buffer.from(await source.arrayBuffer());
 if(bytes.length>60_000_000||bytes.subarray(0,4).toString()!=='glTF'||bytes.readUInt32LE(8)!==bytes.length)throw Error('Invalid or unexpectedly large source GLB');
 await writeFile(resolve(out,'source.glb'),bytes);
}
const sha256=createHash('sha256').update(bytes).digest('hex');
await writeFile(resolve(out,'provenance.json'),JSON.stringify({
 title:metadata.name,author:'Minneapolis Institute of Art',authorProfile:'https://sketchfab.com/artsmia',uid,
 originalModel:'https://sketchfab.com/3d-models/'+uid,metadataSource:metadataUrl,
 publicDatasetMirror:mirror,sourceBytes:bytes.length,sha256,license:'CC0-1.0',licenseLabelVerified:metadata.license.label,
 licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',
 sourceTriangles:metadata.faceCount,sourceVertices:metadata.vertexCount,
 status:'Anatomical sculpture study; not yet selected or integrated into a reference scene.',
 limits:'Different historical sculpture from the supplied reference. Any pose and clothing differences require explicit modeling and actual visual review.'
},null,2));
console.log(JSON.stringify({title:metadata.name,bytes:bytes.length,sha256,licenseVerified:true,output:out}));
