import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {loadInputs,probe,LANE,sha} from './mesh358.mjs';
const {original,posed}=await loadInputs();
const report=probe(posed.P,original,{fullPairs:true});
report.sourceR06RawSha256=sha(posed.raw);report.visualAccepted=false;
await writeFile(resolve(LANE,'baseline-r06-diagnosis358.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...report,newPairs:report.newPairs.slice(0,1)},null,2));
