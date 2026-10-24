import {readFile,writeFile,statfs,access} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
const here=resolve('lookdev/scene01-rebuild219'),settings=JSON.parse(await readFile(resolve(here,'physical-r08-settings.json')));
let disk=await statfs(process.cwd()),free=disk.bavail*disk.bsize,lastNotice=0;
while(free<settings.exportLimits.startFreeBytes&&process.env.WAIT_FOR_STORAGE==='1'){
 if(Date.now()-lastNotice>60000){console.log(JSON.stringify({event:'waiting-for-storage-no-export-or-gpu-slot',freeBytes:free,requiredBytes:settings.exportLimits.startFreeBytes}));lastNotice=Date.now();}
 await new Promise(yes=>setTimeout(yes,2000));disk=await statfs(process.cwd());free=disk.bavail*disk.bsize;
}
const source=await reconstructionSourceIdentity(process.cwd(),'01');disk=await statfs(process.cwd());free=disk.bavail*disk.bsize;
if(source.hash!==settings.expectedSourceHash)throw Error('Canonical source pin changed');
if(free<settings.exportLimits.startFreeBytes)throw Error('Do not start: free space below configured1GiB threshold');
try{await access(settings.exportDirectory);throw Error('Export path already exists; preserve prior attempt');}catch(e){if(e.code!=='ENOENT')throw e;}
const flags={REFERENCE:'1',SCENE_EXPORT:settings.exportDirectory,EXPORT_PORT:'48235',EXPORT_DIAGNOSTIC_REFLECTORS:'1',EXPORT_MAX_UNIQUE_BYTES:String(settings.exportLimits.maxUniqueBytes),EXPORT_MIN_FREE_BYTES:String(settings.exportLimits.minimumFreeBytes)},record={status:'submitted-official-export',sourceHash:source.hash,submittedAt:new Date().toISOString(),freeBeforeBytes:free,environment:flags,driver:'tools/export-reconstructed-scene.mjs',driverSha256:createHash('sha256').update(await readFile('tools/export-reconstructed-scene.mjs')).digest('hex')};
await writeFile(resolve(here,'export-attempt-r08.json'),JSON.stringify(record,null,2),{flag:'wx'});
const child=spawn(process.execPath,['tools/export-reconstructed-scene.mjs'],{cwd:process.cwd(),env:{...process.env,...flags},stdio:'inherit'});const code=await new Promise((yes,no)=>{child.on('error',no);child.on('exit',c=>yes(c??1));});record.completedAt=new Date().toISOString();record.exitCode=code;record.status=code?'official-export-failed':'official-export-finished';await writeFile(resolve(here,'export-attempt-r08.json'),JSON.stringify(record,null,2));process.exitCode=code;
