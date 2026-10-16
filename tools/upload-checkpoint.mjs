import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const exec=promisify(execFile),repo='aa339519589-cpu/komorebi-temple-cinema',tag='checkpoint-2026-10-16';
const run=async args=>(await exec('gh',args,{maxBuffer:8*1024*1024})).stdout;
const api=async path=>{
 for(let attempt=1;attempt<=3;attempt++){
  try{return JSON.parse(await run(['api',path,'-H','Cache-Control: no-cache']))}
  catch(error){if(attempt===3)throw error;await new Promise(resolve=>setTimeout(resolve,2000*attempt));}
 }
};
const manifest=JSON.parse(await readFile('archives/checkpoint-manifest.json','utf8'));
const inventory=await readFile('.publication/checkpoint-manifest.json');
const files=[{file:'checkpoint-manifest.json',bytes:inventory.length,sha256:createHash('sha256').update(inventory).digest('hex')},...manifest.assets];
for(const file of files){
 let done=false;
 for(let attempt=1;attempt<=3&&!done;attempt++){
  const release=await api(`repos/${repo}/releases/tags/${tag}`),previous=release.assets.find(a=>a.name===file.file);
  if(previous?.state==='uploaded'){
   if(previous.size!==file.bytes||previous.digest!=='sha256:'+file.sha256)throw Error('Existing completed asset differs: '+file.file);
   console.log(JSON.stringify({file:file.file,state:'already uploaded and verified'}));done=true;break;
  }
  if(previous){
   if(previous.state!=='starter')throw Error('Unexpected asset state: '+previous.state);
   await run(['api','--method','DELETE',`repos/${repo}/releases/assets/${previous.id}`]);
  }
  const progress={file:file.file,bytes:file.bytes,attempt,state:'uploading one asset at a time',createdAt:new Date().toISOString()};
  await writeFile('.publication/upload-progress.json',JSON.stringify(progress,null,2));console.log(JSON.stringify(progress));
  try{
   await run(['release','upload',tag,'.publication/'+file.file,'--repo',repo]);
   const after=await api(`repos/${repo}/releases/tags/${tag}`),asset=after.assets.find(a=>a.name===file.file);
   if(asset?.state!=='uploaded'||asset.size!==file.bytes||asset.digest!=='sha256:'+file.sha256)throw Error('Remote size or digest is not confirmed: '+file.file);
   console.log(JSON.stringify({file:file.file,state:'uploaded and verified',bytes:asset.size}));done=true;
  }catch(error){
   console.log(JSON.stringify({file:file.file,attempt,state:'failed',error:String(error.message).slice(0,1200)}));
   if(attempt===3)throw error;
   await new Promise(resolve=>setTimeout(resolve,5000));
  }
 }
}
await writeFile('.publication/upload-progress.json',JSON.stringify({state:'all assets uploaded and verified',completedAt:new Date().toISOString()},null,2));
