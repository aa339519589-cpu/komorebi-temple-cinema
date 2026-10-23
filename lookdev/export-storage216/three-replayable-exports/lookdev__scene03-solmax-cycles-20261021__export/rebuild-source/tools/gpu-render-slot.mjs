import {mkdir,readFile,writeFile,stat,rm} from 'node:fs/promises';
import {readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';

// All ten modelling worktrees share one actual GPU. Atomic filesystem ownership
// lets their independent review jobs queue without constructing ten worlds at once.
export async function acquireGpuRenderSlot(label){
 const directory=join(tmpdir(),'komorebi-reconstruction-gpu-slot'),ownerPath=join(directory,'owner.json');
 const owner={pid:process.pid,nonce:randomUUID(),label,startedAt:new Date().toISOString()};
 const began=Date.now();let announced=false;
 while(true){
  try{
   await mkdir(directory);await writeFile(ownerPath,JSON.stringify(owner));
   const release=()=>{try{const current=JSON.parse(readFileSync(ownerPath,'utf8'));if(current.pid===owner.pid&&current.nonce===owner.nonce)rmSync(directory,{recursive:true,force:true});}catch{}};
   process.once('exit',release);
   console.log(JSON.stringify({event:'gpu-slot-acquired',label,pid:process.pid,waitSeconds:(Date.now()-began)/1000}));
   return()=>{release();process.removeListener('exit',release);};
  }catch(error){
   if(error.code!=='EEXIST')throw error;
   if(!announced){console.log(JSON.stringify({event:'gpu-slot-queued',label,pid:process.pid}));announced=true;}
   try{
    const previous=JSON.parse(await readFile(ownerPath,'utf8'));
    try{process.kill(previous.pid,0);}catch(e){if(e.code==='ESRCH'){await rm(directory,{recursive:true,force:true});continue;}}
   }catch{
    // Never remove the short interval between mkdir and the owner's write.
    try{if(Date.now()-(await stat(directory)).mtimeMs>120000)await rm(directory,{recursive:true,force:true});}catch{}
   }
   if(Date.now()-began>3600000)throw Error('GPU review queue timeout after one hour.');
   await new Promise(resolve=>setTimeout(resolve,400));
  }
 }
}
