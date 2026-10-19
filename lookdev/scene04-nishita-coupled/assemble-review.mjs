import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';

const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../..'),out=resolve(here,'results');
const source=await reconstructionSourceIdentity(root,'04');
if(source.hash!=='d1f02ccbe5cd1489e5211d8a831508aa592908cbe24733f3dee8bc74f37ce2a8')throw Error('Frozen scene source changed');
const photograph=resolve(process.env.REFERENCE_ROOT??'/Users/mima1234/temple-cinema-live-sync','references/hd/3-照片-4.jpg'),native=resolve(root,'qa/ten-reference/04/iteration-integrated-paving93/reference.png'),physical=resolve(out,'scene04-nishita-coupled.png');
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',photograph,'-i',native,'-i',physical,'-filter_complex','[0:v]setsar=1[a];[1:v]setsar=1[b];[2:v]setsar=1[c];[a][b][c]hstack=inputs=3[out]','-map','[out]','-frames:v','1',resolve(out,'comparison-original-native-nishita.png')]);
const unchanged=execFileSync('git',['diff','b93edbf','--','reconstructions','tools','lookdev/scene04-physical'],{cwd:root,encoding:'utf8'});
if(unchanged)throw Error('Protected source or old study changed');
const report=JSON.parse(await readFile(resolve(out,'report.json'),'utf8'));
const receipt={status:'actual-one-frame-coupled-sky-comparison',sourceHash:source.hash,sourceCommit:report.sourceCommit,panels:await Promise.all([photograph,native,physical].map(async(p,i)=>({order:i+1,role:['reference photograph','source-matched actual native1254','actual coupled-Nishita Cycles1254'][i],file:p,sha256:await sha(p)}))),comparison:'comparison-original-native-nishita.png',imageScale:1,colorGrading:false,referenceUsedForSceneTextureLightingOrBackground:false,protectedDiffEmpty:!unchanged,producerSHA256:await sha(resolve(here,'render-coupled-nishita.py')),environmentReadAuditSHA256:await sha(resolve(here,'audit-existing-probe.py')),actualFullFrames:1,worldOnlyFloatSamples:1,suites:0,movies:0,push:false};
await writeFile(resolve(out,'comparison-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
process.stdout.write(JSON.stringify({sourceHash:source.hash,actualFullFrames:1,worldOnlyFloatSamples:1})+'\n');
