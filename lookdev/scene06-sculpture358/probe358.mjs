import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {loadInputs,loadMesh,probe,LANE} from './authoring/mesh358.mjs';
const rev=process.argv[2];if(!/^r\d\d[a-z]?$/.test(rev??''))throw Error('Explicit revision');
const {original}=await loadInputs(),authored=await loadMesh(resolve(LANE,'authored-'+rev));
const report=probe(authored.P,original,{fullPairs:true});report.authoredRawSha256=authored.d.uncompressedSha256;report.visualAccepted=false;
await writeFile(resolve(LANE,rev+'-contact358.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...report,newPairs:report.newPairs.slice(0,1)},null,2));
