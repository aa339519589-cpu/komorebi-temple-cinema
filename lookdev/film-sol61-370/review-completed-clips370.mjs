// Decode completed, hash-verified H source clips. No 3D rendering or image grading.
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {shaFile,exists,atomicJson,run} from '../../tools/film-snapshot-contract.mjs';
const lane=resolve(import.meta.dirname),a=JSON.parse(await readFile(resolve(lane,'source-authorization.json'),'utf8'));
const through=Number(process.argv[2]||8),indices=[0,24,48,72,84,96,120,144,167];
if(!Number.isInteger(through)||through<1||through>10)throw Error('Choose 1..10 completed source clips');
const out=resolve(a.snapshotRoot,'output',a.iteration,'source-clip-review370');await mkdir(out,{recursive:true});
const boards=[];
for(let reference=1;reference<=through;reference++){
 const id=String(reference).padStart(2,'0'),certificate=JSON.parse(await readFile(resolve(lane,'shots',id+'.json'),'utf8'));
 if(!certificate.valid||certificate.expectedGCommit!==a.commit||await shaFile(certificate.file)!==certificate.videoSha256)throw Error('Completed clip identity differs: '+id);
 const file=resolve(out,'source-'+id+'-nine-encoded-frames.jpg'),meta=resolve(out,'source-'+id+'.json');
 if(await exists(meta)){
  const old=JSON.parse(await readFile(meta,'utf8'));
  if(old.sourceVideoSha256!==certificate.videoSha256||await shaFile(file)!==old.sha256||JSON.stringify(old.indices)!==JSON.stringify(indices))throw Error('Preserve changed review output: '+id);
  boards.push(old);continue;
 }
 const select=indices.map(n=>`eq(n,${n})`).join('+');
 await run('ffmpeg',['-n','-v','error','-threads','2','-i',certificate.file,'-filter_threads','1','-vf',`select='${select}',scale=400:400:flags=lanczos,tile=3x3:nb_frames=9`,'-frames:v','1','-q:v','2',file],{cwd:a.snapshotRoot,log:resolve(out,'source-'+id+'.decode.log')});
 const record={reference,file,sha256:await shaFile(file),indices,seconds:indices.map(n=>n/24),cellSize:[400,400],layout:'3x3 row-major',sourceVideo:certificate.file,sourceVideoSha256:certificate.videoSha256,sourceHash:certificate.source.hash,sourceCommit:a.commit,scope:'Nine actual decoded encoded source-clip frames, reduced for inspection only; not all-frame visual proof or new 3D rendering.',personallyViewed:false,photographicAccepted:false};
 await atomicJson(meta,record);boards.push(record);console.log(JSON.stringify({reference,file}));
}
await atomicJson(resolve(out,'index.json'),{sourceCommit:a.commit,through,boards,scope:'Completed original seven-second clips only. Final60/70 edits and cuts require separate review.',photographicAccepted:false});
