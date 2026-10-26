// Small crash-recovery evidence for the official native motion driver.
import {readFile,writeFile,appendFile,rename} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
export const NATIVE_CAPTURE_CONTRACT='native-half-frame-times-v1-rgba-yflip-lanczos-h264-crf15-bt709';
export async function createMotionJournal(directory,initial){
 const stateFile=resolve(directory,'capture-state.json'),sourceFile=resolve(directory,'capture-source.json'),framesFile=resolve(directory,'capture-frames.jsonl');
 const state={...initial,pid:process.pid,nonce:randomUUID(),status:'queued',capturedFrames:0,startedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),captureContract:NATIVE_CAPTURE_CONTRACT};
 await writeFile(stateFile,JSON.stringify(state,null,2)+'\n',{flag:'wx'});await writeFile(framesFile,'',{flag:'wx'});
 let pending=Promise.resolve();
 async function save(extra){Object.assign(state,extra,{updatedAt:new Date().toISOString()});const tmp=stateFile+'.tmp-'+process.pid;await writeFile(tmp,JSON.stringify(state,null,2)+'\n');await rename(tmp,stateFile);}
 return{stateFile,sourceFile,framesFile,
  async started(source){await writeFile(sourceFile,JSON.stringify(source,null,2)+'\n',{flag:'wx'});await save({status:'capturing-native-motion',sourceHash:source.source.hash});},
  async frame(frame,index){const minimal={index,name:frame.name,localTime:frame.localTime,width:frame.width,height:frame.height,valid:frame.valid,glError:frame.glError,contextLost:frame.contextLost,programsLinked:frame.programs.every(p=>p.linked),rgbaSha256:frame.rgbaSha256,nonblackFraction:frame.nonblackFraction,opaqueFraction:frame.opaqueFraction,pose:frame.pose,msaaEvidence:frame.msaaEvidence};pending=pending.then(()=>appendFile(framesFile,JSON.stringify(minimal)+'\n'));await pending;if(index===0||(index+1)%initial.fps===0||index+1===initial.expectedFrames)await save({capturedFrames:index+1,lastNativeTime:frame.localTime});},
  async encoding(){await pending;await save({status:'native-frames-captured-awaiting-encoder',capturedFrames:initial.expectedFrames});},
  async finish(status,extra={}){await pending;await save({status,...extra,completedAt:new Date().toISOString()});}
 };
}
