import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {acquireGpuRenderSlot} from './gpu-render-slot.mjs';
const release=await acquireGpuRenderSlot('local-triposg-untextured-head');
let child;
try{
 child=spawn('/Users/mima1234/.cache/temple-triposg-venv/bin/python',[resolve('tools/generate-local-triposg-head.py')],{stdio:'inherit',env:{...process.env,PYTORCH_ENABLE_MPS_FALLBACK:'1'}});
 const forward=signal=>child.kill(signal);process.once('SIGINT',()=>forward('SIGINT'));process.once('SIGTERM',()=>forward('SIGTERM'));
 const code=await new Promise((yes,no)=>{child.once('error',no);child.once('exit',yes)});process.exitCode=code??1;
}finally{release();}
