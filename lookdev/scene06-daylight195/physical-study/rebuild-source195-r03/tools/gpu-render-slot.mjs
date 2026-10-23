import {mkdir,readFile,writeFile,stat,rm,readdir} from 'node:fs/promises';
import {readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';

// All ten modelling worktrees share one actual GPU. Atomic filesystem ownership
// lets their independent review jobs queue without constructing ten worlds at once.
export async function acquireGpuRenderSlot(label){
 const directory=join(tmpdir(),'komorebi-reconstruction-gpu-slot'),ownerPath=join(directory,'owner.json');
 const owner={pid:process.pid,nonce:randomUUID(),label,startedAt:new Date().toISOString()};
 const began=Date.now(),waiting=directory+'.waiters';let announced=false;
 await mkdir(waiting,{recursive:true});
 const ticketPath=join(waiting,`${began}-${process.pid}-${owner.nonce}.json`);
 await writeFile(ticketPath,JSON.stringify({...owner,queuedAt:began}),{flag:'wx'});
 const removeTicket=()=>{try{rmSync(ticketPath,{force:true});}catch{}};
 process.once('exit',removeTicket);
 const announce=()=>{if(!announced){console.log(JSON.stringify({event:'gpu-slot-queued',label,pid:process.pid,order:'fifo'}));announced=true;}};
 async function firstLiveWaiter(){
  const live=[];
  for(const name of await readdir(waiting)){
   if(!name.endsWith('.json'))continue;const path=join(waiting,name);
   try{const ticket=JSON.parse(await readFile(path,'utf8'));if(!Number.isInteger(ticket.pid)||!Number.isFinite(ticket.queuedAt))continue;
    try{process.kill(ticket.pid,0);}catch(e){if(e.code==='ESRCH'){await rm(path,{force:true});continue;}if(e.code!=='EPERM')throw e;}
    live.push(ticket);
   }catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}
  }
  live.sort((a,b)=>a.queuedAt-b.queuedAt||a.pid-b.pid);return live[0];
 }
 while(true){
  const first=await firstLiveWaiter();
  if(first&&first.pid!==process.pid){announce();await new Promise(resolve=>setTimeout(resolve,400));continue;}
  try{
   await mkdir(directory);await writeFile(ownerPath,JSON.stringify(owner));
   removeTicket();process.removeListener('exit',removeTicket);
   const release=()=>{try{const current=JSON.parse(readFileSync(ownerPath,'utf8'));if(current.pid===owner.pid&&current.nonce===owner.nonce)rmSync(directory,{recursive:true,force:true});}catch{}};
   process.once('exit',release);
   console.log(JSON.stringify({event:'gpu-slot-acquired',label,pid:process.pid,waitSeconds:(Date.now()-began)/1000}));
   return()=>{release();process.removeListener('exit',release);};
  }catch(error){
   if(error.code!=='EEXIST')throw error;
   announce();
   try{
    const previous=JSON.parse(await readFile(ownerPath,'utf8'));
    try{process.kill(previous.pid,0);}catch(e){if(e.code==='ESRCH'){await rm(directory,{recursive:true,force:true});continue;}}
   }catch{
    // Never remove the short interval between mkdir and the owner's write.
    try{if(Date.now()-(await stat(directory)).mtimeMs>120000)await rm(directory,{recursive:true,force:true});}catch{}
   }
   await new Promise(resolve=>setTimeout(resolve,400));
  }
 }
}
