// Prepare one improved coherent H source: reuse unchanged completed clips,
// recapture only scene04. No renderer is started by this guard.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {shaFile,exists,atomicJson} from '../../tools/film-snapshot-contract.mjs';
const lane=resolve(import.meta.dirname),oldLane=resolve(lane,'../film-sol61-370');
const json=p=>readFile(p,'utf8').then(JSON.parse);
const progress=await json(resolve(oldLane,'progress.json'));
const missing=[];for(let r=1;r<=10;r++)if(!await exists(resolve(oldLane,'shots',String(r).padStart(2,'0')+'.json')))missing.push(r);
if(missing.length||progress.status!=='ten-source-shots-verified-ready-to-assemble'){
 console.log(JSON.stringify({status:'waiting-for-original-H-completion-no-render-submitted',missing,upstreamStatus:progress.status}));process.exit(2);
}
const oldA=await json(resolve(oldLane,'source-authorization.json')),a=await json(resolve(lane,'source-authorization.json'));
const oldP=await json(resolve(oldLane,'snapshot-proof.json')),p=await json(resolve(lane,'snapshot-proof.json'));
if(oldA.commit!=='4dfc441cdaf852e9701c110472fbef95ef024d3e'||a.commit!=='285423ae11a2b7e9d355a15fbeb40d15d8742877')throw Error('Unexpected frozen revisions; preserve both runs');
if(await shaFile(resolve(oldLane,'snapshot-proof.json'))!==oldA.snapshotProofSha256||await shaFile(resolve(lane,'snapshot-proof.json'))!==a.snapshotProofSha256)throw Error('Frozen source proof changed');
if(oldA.driverSha256!==a.driverSha256)throw Error('Capture driver differs');
const runtime=n=>/^(assets|vendor|src|tools)\//.test(n)||n==='package.json'||n==='reconstructions/ten-scenes.json';
const oldNames=Object.keys(oldP.files).filter(runtime).sort(),names=Object.keys(p.files).filter(runtime).sort();
if(JSON.stringify(oldNames)!==JSON.stringify(names)||names.some(n=>oldP.files[n].sha256!==p.files[n].sha256))throw Error('Shared renderer/runtime/asset bytes differ');
const changed=[],sources=[];
for(let reference=1;reference<=10;reference++){
 const before=oldP.sourceIdentities[reference-1].actualSnapshot,after=p.sourceIdentities[reference-1].actualSnapshot;
 const same=before.hash===after.hash&&JSON.stringify(before.files)===JSON.stringify(after.files);
 if(!same)changed.push(reference);sources.push({reference,before:before.hash,after:after.hash,identical:same});
}
if(JSON.stringify(changed)!=='[4]'||sources[3].after!=='57972b32c0d44bd029f6545b924cb62ac07b5867e90514e364ef4050aaba4e26')throw Error('Only integrated ground367 may change in this refinement');
const shots=[];
for(let reference=1;reference<=10;reference++){
 const c=await json(resolve(oldLane,'shots',String(reference).padStart(2,'0')+'.json'));
 if(!c.valid||c.expectedGCommit!==oldA.commit||c.source.hash!==sources[reference-1].before||c.frames!==168||c.fps!==24||c.duration!==7)throw Error('Incomplete upstream certificate '+reference);
 if(await shaFile(c.file)!==c.videoSha256||await shaFile(c.receipt)!==c.receiptSha256)throw Error('Upstream media/receipt changed '+reference);
 shots.push(c);
}
const library=resolve(oldLane,'completed-clips-for-reuse379.json');
await atomicJson(library,{status:'ten-complete-native-source-clips-no-original-H-edit-published',sourceCommit:oldA.commit,shots,scope:'Original H370 capture preserved. New379 must reject04 source and recapture it; other nine require the strict per-shot receipt contract.',photographicAccepted:false});
await atomicJson(resolve(lane,'runtime-reuse-proof379.json'),{status:'reuse-nine-exact-scene-and-runtime-clips-recapture04',sourceCommit:a.commit,originCommit:oldA.commit,driverSha256:a.driverSha256,sharedRuntimeFiles:names.length,sharedRuntimeAndAssetBytesExact:true,sources,changedReferences:changed,library,videoAndReceiptHashesVerified:10,sourceShotsRemainSevenSeconds:true,photographicAccepted:false});
console.log(JSON.stringify({status:'guard-passed-capture379-may-start',library,reusedReferences:sources.filter(s=>s.identical).map(s=>s.reference),recaptureReferences:changed}));
