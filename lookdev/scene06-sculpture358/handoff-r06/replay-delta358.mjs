// Exact ordinary-JS mesh delta replay only. Does not edit canonical sources,
// launch Blender/browser, acquire a graphics queue, render, export or UV bake.
import{readFile,writeFile,mkdir,copyFile}from'node:fs/promises';import{resolve}from'node:path';import{gunzipSync,gzipSync}from'node:zlib';import{createHash}from'node:crypto';
const[repoArg,packetArg,outArg]=process.argv.slice(2);if(!repoArg||!packetArg||!outArg)throw Error('Usage: node replay-delta358.mjs REPO PACKET_DIRECTORY NEW_OUTPUT_DIRECTORY');
const repo=resolve(repoArg),packet=resolve(packetArg),out=resolve(outArg),sha=b=>createHash('sha256').update(b).digest('hex');
if(out.startsWith(resolve(repo,'reconstructions')+'/'))throw Error('Replay creates independent output only; Root owns canonical integration');
const plan=JSON.parse(await readFile(resolve(packet,'replay-plan358.json'))),source=resolve(repo,plan.baseAssetDirectory),baseM=JSON.parse(await readFile(resolve(source,'manifest.json'))),baseD=baseM.variants.central[0],packed=await readFile(resolve(source,baseD.file));
if(sha(packed)!==plan.basePackedSha256)throw Error('Frozen R06 packed base changed');const raw=gunzipSync(packed);if(sha(raw)!==plan.baseRawSha256)throw Error('Frozen R06 raw base changed');
const deltaPacked=await readFile(resolve(packet,plan.delta.file));if(sha(deltaPacked)!==plan.delta.sha256)throw Error('Delta hash mismatch');const delta=gunzipSync(deltaPacked),n=raw.readUInt32LE(4),count=delta.readUInt32LE(8);
if(delta.toString('ascii',0,4)!=='SP58'||delta.readUInt32LE(4)!==n||delta.readUInt32LE(12)!==28||delta.readUInt32LE(16)!==1||delta.length!==24+count*28)throw Error('Delta identity/layout failed');let prev=-1;
for(let i=0;i<count;i++){const k=24+i*28,v=delta.readUInt32LE(k);if(v<=prev||v>=n)throw Error('Delta original vertex order');prev=v;delta.copy(raw,20+v*12,k+4,k+16);delta.copy(raw,20+n*12+v*12,k+16,k+28);}
if(sha(raw)!==plan.targetRawSha256)throw Error('Exact authored raw replay failed');const target=gzipSync(raw,{level:9});if(sha(target)!==plan.targetPackedSha256)throw Error('Exact authored packed replay failed');
await mkdir(out);await writeFile(resolve(out,plan.targetFile),target,{flag:'wx'});
for(const f of plan.packetCopies)await copyFile(resolve(packet,f),resolve(out,f));for(const f of plan.existingCopies){const b=await readFile(resolve(repo,f.source));if(sha(b)!==f.sha256)throw Error('Existing original CM07/provenance changed');await writeFile(resolve(out,f.file),b,{flag:'wx'});}
console.log(JSON.stringify({out,rawSha256:sha(raw),packedSha256:sha(target),originalVertexRecords:count,bytes:target.length,canonicalModified:false,visualAccepted:false}));
