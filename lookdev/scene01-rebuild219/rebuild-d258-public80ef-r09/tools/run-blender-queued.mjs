import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {acquireGpuRenderSlot} from './gpu-render-slot.mjs';
const script=resolve(process.argv[2]||'');
if(!script.endsWith('.py')||!existsSync(script))throw Error('Provide an existing Blender Python script.');
const blender=process.env.BLENDER_BINARY||'/Applications/Blender.app/Contents/MacOS/Blender';
if(!existsSync(blender))throw Error('Blender application binary is missing.');
const release=await acquireGpuRenderSlot('blender-'+script.split('/').at(-1));
let child;
try{
 child=spawn(blender,['-b','-t','4','--python-exit-code','1','--python',script],{stdio:'inherit',env:process.env});
 const stop=()=>child?.kill('SIGTERM');process.once('SIGINT',stop);process.once('SIGTERM',stop);
 const code=await new Promise((yes,no)=>{child.on('error',no);child.on('exit',(c,s)=>yes(c??(s?1:0)));});
 process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);
 if(code)process.exitCode=code;
}finally{release();}
