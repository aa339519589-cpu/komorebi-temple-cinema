import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
const lane=import.meta.dirname,root=resolve(lane,'../..'),candidate=resolve(lane,'candidate-r01'),spec=JSON.parse(await readFile(resolve(lane,'combined-source309.json'))),sha=b=>createHash('sha256').update(b).digest('hex');
const current=await reconstructionSourceIdentity(root,'06');if(current.hash!==spec.base)throw Error('Canonical changed');
const dir=resolve(candidate,'qa/ten-reference/06/iteration-scene06-integrated309-cabinet-halo'),report=JSON.parse(await readFile(resolve(dir,'report.json')));if(report.status!=='rendered-review'||report.errors.length||report.source.hash!==spec.source.hash||report.frames.some(f=>!f.valid))throw Error('Actual integrated native source evidence differs');
for(const [f,h]of Object.entries(spec.changes)){const source=resolve(candidate,'reconstructions/scene-06/src',f);if(sha(await readFile(source))!==h)throw Error('Reviewed module changed '+f);await copyFile(source,resolve(root,'reconstructions/scene-06/src',f));}
const after=await reconstructionSourceIdentity(root,'06');if(after.hash!==spec.source.hash)throw Error('Integrated source mismatch');
await writeFile(resolve(lane,'integration309.json'),JSON.stringify({status:'working-cabinet-and-continuous-mandorla-integrated',before:current.hash,after:after.hash,changedModules:spec.changes,rootPersonallyViewed:['293 R02 full/case/section oblique','305 R03 full/detail/three-quarter','309 combined actual full and altar detail'],nativeFullSha256:sha(await readFile(resolve(dir,'reference.png'))),nativeDetailSha256:sha(await readFile(resolve(dir,'detail-native.png'))),photographicAccepted:false,central295AndSide257Included:false,existingFilmContainsThis:false},null,2)+'\n',{flag:'wx'});console.log(after.hash);
