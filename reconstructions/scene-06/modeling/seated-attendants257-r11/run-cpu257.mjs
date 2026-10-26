// Only the exact primary-reviewed CPU recipe may launch Blender. No GPU slot,
// viewport, render, scene export, bake or network is reachable in this recipe.
import {readFile,writeFile,open,unlink,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
const L=resolve(import.meta.dirname,'..'),[reviewName,configName]=process.argv.slice(2);
if(!reviewName||!/^r[0-9a-z]+-config257\.json$/.test(configName??''))throw Error('Primary review and exact round config required');
const reviewPath=resolve(L,reviewName),configPath=resolve(L,configName);
if(!reviewPath.startsWith(L+'/')||!configPath.startsWith(L+'/'))throw Error('Owned lane paths required');
const review=JSON.parse(await readFile(reviewPath)),cfg=JSON.parse(await readFile(configPath)),rev=cfg.revision;
if(!/allow|approv/i.test(review.status??'')||/reject|denied|await/i.test(review.status??''))throw Error('Explicit completed primary source allowance required');
const files=['authoring/build_attendants257.py','authoring/mesh257.py','authoring/run-cpu257.mjs',configName],sha=b=>createHash('sha256').update(b).digest('hex');
async function verify(){if(Object.keys(review.files??{}).sort().join('\0')!==files.slice().sort().join('\0'))throw Error('Complete transitive recipe table differs');for(const f of files)if(sha(await readFile(resolve(L,f)))!==review.files[f])throw Error('Primary-reviewed source changed '+f);}
await verify();
for(const p of [resolve(L,'authored-'+rev),resolve(L,rev+'-cpu-authoring-receipt257.json')])try{await access(p);throw Error('Preserve existing output/receipt '+p);}catch(e){if(e.code!=='ENOENT')throw e;}
const lock=resolve(tmpdir(),'komorebi-reviewed-cpu-authoring.lock');
const h=await open(lock,'wx');await h.writeFile(JSON.stringify({pid:process.pid,recipe:'attendants257-'+rev,startedAt:new Date().toISOString()}));await h.close();
const receipt={revision:rev,status:'primary-reviewed-cpu-authoring-active',startedAt:new Date().toISOString(),primaryReview:reviewPath,files:review.files,threads:4,scope:'One CPU Blender child. Actual source/body mesh construction and compact SC07+JSON only. No render/browser/GPU/viewport/export/Blend/bake/image/network.',canonicalModified:false,combined53bModified:false,photographicFidelityAccepted:false};
let child;
try{
 child=spawn('/Applications/Blender.app/Contents/MacOS/Blender',['-b','--factory-startup','--disable-autoexec','-t','4','--python-exit-code','1','--python',resolve(L,'authoring/build_attendants257.py')],{cwd:L,env:{...process.env,ATTENDANTS257_CONFIG:configPath,OMP_NUM_THREADS:'4',OPENBLAS_NUM_THREADS:'1',VECLIB_MAXIMUM_THREADS:'4'},stdio:'inherit'});
 receipt.childPid=child.pid;await writeFile(resolve(L,rev+'-cpu-authoring-receipt257.json'),JSON.stringify(receipt,null,2)+'\n');
 const stop=()=>child?.kill('SIGTERM');process.once('SIGINT',stop);process.once('SIGTERM',stop);
 const code=await new Promise((yes,no)=>{child.on('error',no);child.on('exit',(code,signal)=>yes(code??(signal?1:0)));});
 process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);await verify();
 receipt.exitCode=code;receipt.status=code===0?'true-seated-mesh-written-awaiting-official-native-review':'cpu-authoring-failed-preserved';if(code)process.exitCode=code;
}catch(e){receipt.status='cpu-authoring-failed-preserved';receipt.error=String(e.stack??e);process.exitCode=1;}
finally{
 receipt.completedAt=new Date().toISOString();await writeFile(resolve(L,rev+'-cpu-authoring-receipt257.json'),JSON.stringify(receipt,null,2)+'\n');
 const owner=JSON.parse(await readFile(lock));if(owner.pid!==process.pid)throw Error('Never clear another live CPU lock');await unlink(lock);
 console.log(JSON.stringify(receipt));
}
