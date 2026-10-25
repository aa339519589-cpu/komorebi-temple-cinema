import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
const lane=import.meta.dirname,root=resolve(lane,'../..'),review=JSON.parse(await readFile(resolve(lane,'root-review299.json'))),sha=b=>createHash('sha256').update(b).digest('hex');
const before=await reconstructionSourceIdentity(root,'06');if(before.hash!==review.baseSourceHash)throw Error('Canonical changed');
for(const[f,h]of Object.entries(review.files)){const file=resolve(lane,'candidate-r01',f);if(sha(await readFile(file))!==h)throw Error('Candidate changed');await copyFile(file,resolve(root,f));}
const after=await reconstructionSourceIdentity(root,'06');if(after.hash!==review.selectedSourceHash)throw Error('Integration differs');
await writeFile(resolve(lane,'integration299.json'),JSON.stringify({status:'working-floor-construction-integrated',before:before.hash,after:after.hash,files:review.files,photographicAccepted:false,old284VideoIncludesThis:false},null,2)+'\n',{flag:'wx'});console.log(after.hash);
