import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
const lane=import.meta.dirname,root=resolve(lane,'../..'),candidate=resolve(lane,'candidate-r01'),sha=b=>createHash('sha256').update(b).digest('hex');
const before=await reconstructionSourceIdentity(candidate,'06');if(before.hash!=='c85f7579e790a6103e8ad0372dff2c7f74d12467fb878cecaf04cfba96438f7e')throw Error('Combined base changed');
const changes={'altar260.js':'d8269bccd5cda5b15782392de678c94b9a42cb9dfbf20c3599d70378c0dc00fe','cabinet-cases293.js':'a79f400ad335c157649df8f66f81daff212dcdc5a950826bbebaf0d128551801','restoration-altar.js':'1bfa4c980409dcd2a66caf5b720c31f7f3d3700615d1f788042cc4e9d4e903ca','mandorla205.js':'de8beca442ac15a51fc4933d50a9ffeec6b75270ce3398127963dad4890c4645'};
const patches=['lookdev/scene06-cabinet293/r02-cabinet293.patch','lookdev/scene06-mandorla305/integration-delta305.patch'];const receipts=[];
for(const patch of patches){const file=resolve(root,patch),args=['--directory=lookdev/scene06-integrated309/candidate-r01',file];execFileSync('git',['apply','--check',...args],{cwd:root});execFileSync('git',['apply',...args],{cwd:root});receipts.push({patch,sha256:sha(await readFile(file))});}
for(const [f,h]of Object.entries(changes))if(sha(await readFile(resolve(candidate,'reconstructions/scene-06/src',f)))!==h)throw Error('Module mismatch '+f);
const after=await reconstructionSourceIdentity(candidate,'06');await writeFile(resolve(lane,'combined-source309.json'),JSON.stringify({status:'combined-cabinet293-and-mandorla305-awaiting-native-review',base:before.hash,source:after,changes,patches:receipts,preservesCanonicalFloor299:true,central295AndSide257NotIncluded:true,photographicAccepted:false},null,2)+'\n',{flag:'wx'});console.log(after.hash);
