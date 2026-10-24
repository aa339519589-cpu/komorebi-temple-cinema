import {readFile,writeFile,mkdir,lstat,rename} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {reconstructionSourceIdentity} from '../tools/reconstruction-source-identity.mjs';

const root=resolve(import.meta.dirname,'..'),candidate=resolve(root,'lookdev/scene04-rebuild212/candidate-root'),out=resolve(root,'lookdev/scene04-canonical230');
const delta=JSON.parse(await readFile(resolve(root,'lookdev/scene04-rebuild212/root-r22-vs-canonical-delta230.json'),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const before=await reconstructionSourceIdentity(root,'04'),frozen=await reconstructionSourceIdentity(candidate,'04');
if(before.hash!==delta.before||frozen.hash!==delta.candidate||delta.extra.length)throw Error('Source boundary changed; do not overwrite a different working tree.');
await mkdir(out);
const receipt={status:'integrating-reviewed-working-candidate',before:before.hash,candidate:frozen.hash,changed:[],rootViewedActual:['R14 reference-left/native-right comparison','R15 full','R16 full returned for washed reflection','R19 full','R22 full'],visualAccepted:false,photographicAccepted:false,scope:'Install the isolated212R22 real3D working candidate in scene04, preserving the previous188R03 source and every prior candidate. Not a claim of exact photographic reconstruction.'};
await writeFile(resolve(out,'integration.json'),JSON.stringify(receipt,null,2));
for(const item of delta.changed){
 const src=resolve(candidate,item.path),dst=resolve(root,item.path),bytes=await readFile(src);
 if(sha(bytes)!==item.after||!(await lstat(src)).isFile())throw Error('Candidate bytes changed: '+item.path);
 if(item.before){
  if(sha(await readFile(dst))!==item.before)throw Error('Live source changed: '+item.path);
  const old=resolve(out,'before',item.path);await mkdir(dirname(old),{recursive:true});execFileSync('cp',['-c','-p',dst,old]);
 }
 await mkdir(dirname(dst),{recursive:true});const temporary=dst+'.integration230';
 execFileSync('cp',['-c','-p',src,temporary]);if(sha(await readFile(temporary))!==item.after)throw Error('Clone differs: '+item.path);
 await rename(temporary,dst);receipt.changed.push(item);
}
const actual=await reconstructionSourceIdentity(root,'04');if(actual.hash!==frozen.hash)throw Error('Integrated source does not exactly reproduce inspected R22.');
receipt.status='working-canonical-r22-source-exact';receipt.actual=actual.hash;receipt.files=actual.files;await writeFile(resolve(out,'integration.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,source:actual.hash,changedFiles:receipt.changed.length,photographicAccepted:false}));
