import {readFile,writeFile,mkdir,lstat,rename} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {reconstructionSourceIdentity} from '../tools/reconstruction-source-identity.mjs';
const root=resolve(import.meta.dirname,'..'),candidate=resolve(root,'lookdev/scene04-rebuild212/candidate-root'),out=resolve(root,'lookdev/scene04-canonical236');
const delta=JSON.parse(await readFile(resolve(root,'lookdev/scene04-rebuild212/r22-to-r25-source212.json'),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const before=await reconstructionSourceIdentity(root,'04'),frozen=await reconstructionSourceIdentity(candidate,'04');
if(before.hash!==delta.baselineHash||frozen.hash!==delta.candidateHash)throw Error('Source boundary changed. Preserve it; do not overwrite.');
await mkdir(out);
const receipt={status:'integrating-root-reviewed-working-candidate',before:before.hash,candidate:frozen.hash,changed:[],rootViewedActual:['R25 full reference camera','R25 true native facade crop','R25 original low view'],photographicAccepted:false,scope:'Nine-file material/real bevel refinement. Current full film remains independently frozen at c355c5d4/R22; this does not relabel its pixels.'};
await writeFile(resolve(out,'integration.json'),JSON.stringify(receipt,null,2));
for(const item of delta.files){
 const src=resolve(candidate,item.file),dst=resolve(root,item.file),bytes=await readFile(src);
 if(sha(bytes)!==item.afterSha256||!(await lstat(src)).isFile())throw Error('Candidate changed: '+item.file);
 if(item.beforeSha256){
  if(sha(await readFile(dst))!==item.beforeSha256)throw Error('Canonical changed: '+item.file);
  const backup=resolve(out,'before',item.file);await mkdir(dirname(backup),{recursive:true});execFileSync('cp',['-c','-p',dst,backup]);
 }else{try{await lstat(dst);throw Error('Unexpected preexisting new-file destination.');}catch(e){if(e.code!=='ENOENT')throw e;}}
 await mkdir(dirname(dst),{recursive:true});const temporary=dst+'.integration236';execFileSync('cp',['-c','-p',src,temporary]);
 if(sha(await readFile(temporary))!==item.afterSha256)throw Error('Independent copy differs.');
 await rename(temporary,dst);receipt.changed.push(item);
}
const actual=await reconstructionSourceIdentity(root,'04');if(actual.hash!==frozen.hash)throw Error('Canonical no longer exactly reproduces the inspected source.');
Object.assign(receipt,{status:'working-canonical-r25-source-exact',actual:actual.hash,files:actual.files});await writeFile(resolve(out,'integration.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,source:actual.hash,changedFiles:receipt.changed.length,photographicAccepted:false}));
