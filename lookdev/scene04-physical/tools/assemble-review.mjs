import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {reconstructionSourceIdentity} from '../../../tools/reconstruction-source-identity.mjs';

const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../../..'),look=resolve(here,'..'),result=resolve(look,'results');
const photograph=resolve(process.env.REFERENCE_ROOT??'/Users/mima1234/temple-cinema-live-sync','references/hd/3-照片-4.jpg');
const native=resolve(root,'qa/ten-reference/04/iteration-integrated-paving93/reference.png');
const sha=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const identity=await reconstructionSourceIdentity(root,'04');
if(identity.hash!=='d1f02ccbe5cd1489e5211d8a831508aa592908cbe24733f3dee8bc74f37ce2a8')throw Error('Frozen scene04 changed');
await mkdir(result,{recursive:true});
const physicalFrames=[];
for(const iteration of ['physical01','physical02']){
 const physical=resolve(look,`results/${iteration}/scene04-${iteration}.png`);physicalFrames.push(physical);
 const comparison=`comparison-original-native-${iteration}.png`;
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',photograph,'-i',native,'-i',physical,'-filter_complex','[0:v]setsar=1[a];[1:v]setsar=1[b];[2:v]setsar=1[c];[a][b][c]hstack=inputs=3[out]','-map','[out]','-frames:v','1',resolve(result,comparison)]);
 const receipt={status:'actual-render-comparison',sourceHash:identity.hash,frozenCommit:'4cb7c2b83d51d448c10a2b319ada51b662a0aaa0',sceneSourceDiff:execFileSync('git',['diff','4cb7c2b','--','reconstructions'],{cwd:root,encoding:'utf8'}),panels:await Promise.all([photograph,native,physical].map(async(p,i)=>({order:i+1,role:['reference photograph','source-matched actual native1254',`actual Cycles1254 ${iteration}`][i],file:p,sha256:await sha(p)}))),comparison,scale:1,colorGrading:false,referenceUsedForLightingOrTexture:false,testsRun:false,filmRun:false,pushed:false};
 if(receipt.sceneSourceDiff)throw Error('Scene source changed');
 await writeFile(resolve(result,`comparison-receipt-${iteration}.json`),JSON.stringify(receipt,null,2)+'\n');
}
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',physicalFrames[0],'-i',physicalFrames[1],'-filter_complex','[0:v]setsar=1[a];[1:v]setsar=1[b];[a][b]hstack=inputs=2[out]','-map','[out]','-frames:v','1',resolve(result,'comparison-physical01-left-physical02-right.png')]);
const nativeFloor=resolve(root,'qa/ten-reference/04/iteration-integrated-paving93/detail-native.png'),physicalFloor=resolve(look,'results/physical01/scene04-physical01-floor-native.png');
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',nativeFloor,'-i',physicalFloor,'-filter_complex','[0:v]setsar=1[a];[1:v]setsar=1[b];[a][b]hstack=inputs=2[out]','-map','[out]','-frames:v','1',resolve(result,'comparison-floor-native-left-physical-right.png')]);
const exported=resolve(root,'output/scene04-physical-frozen-export');
await copyFile(resolve(exported,'export-report.json'),resolve(result,'frozen-export-report.json'));
await copyFile(resolve(exported,'assets/source-frame.png'),resolve(result,'source-frame-640.png'));
await writeFile(resolve(result,'comparison-receipt-floor.json'),JSON.stringify({file:'comparison-floor-native-left-physical-right.png',panels:await Promise.all([nativeFloor,physicalFloor].map(async p=>({file:p,sha256:await sha(p)}))),crop:[80,850,400,1254],bothNative3DSubfrusta:true,scale:1,colorGrading:false},null,2)+'\n');
process.stdout.write(JSON.stringify({sourceHash:identity.hash,fullComparisons:2,floorComparisons:1})+'\n');
