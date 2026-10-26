// Immutable-film receipt validation. No browser or graphics launch.
import {createHash,randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile,rename,mkdir,stat,access} from 'node:fs/promises';
import {spawn,execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
export const CAPTURE_SEMANTICS='native-half-frame-times-v1-rgba-yflip-lanczos-h264-crf15-bt709';
export const LEGACY_EQUIVALENT_DRIVER='d05f71049c090f6763cc70cee0d5fcd003f41f238b45be0bbb5e993045926645';
export const FILM_SPEC=Object.freeze({size:1080,nativeSize:1620,scale:1.5,fps:24,shotSeconds:7,framesPerShot:168,shots:10,fullSeconds:70,fullFrames:1680,minuteSeconds:60,minuteFrames:1440,overlapFrames:[27,27,27,27,27,27,26,26,26]});
export const sha=b=>createHash('sha256').update(b).digest('hex');
export async function shaFile(file){const h=createHash('sha256');for await(const b of createReadStream(file))h.update(b);return h.digest('hex');}
export async function exists(file){try{await access(file);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}}
export async function atomicJson(file,value){await mkdir(dirname(file),{recursive:true});const temporary=file+'.tmp-'+process.pid+'-'+randomUUID();await writeFile(temporary,JSON.stringify(value,null,2)+'\n',{flag:'wx'});await rename(temporary,file);}
export function pidAlive(pid){if(!Number.isInteger(pid)||pid<1)return false;try{process.kill(pid,0);return true;}catch(e){if(e.code==='ESRCH')return false;if(e.code==='EPERM')return true;throw e;}}
export async function run(file,args,{cwd,env={},log,detached=false,onStart}={}){await mkdir(dirname(log||resolve(cwd||'.','unused-log')),{recursive:true});let handle;if(log)handle=await import('node:fs/promises').then(fs=>fs.open(log,'a'));const child=spawn(file,args,{cwd,env:{...process.env,...env},detached,stdio:log?['ignore',handle.fd,handle.fd]:'inherit'});const completion=new Promise((yes,no)=>{child.once('error',no);child.once('exit',(code,signal)=>code===0?yes({pid:child.pid,code,signal}):no(Object.assign(Error(`${file} exited ${code??signal}`),{pid:child.pid,code,signal})));});completion.catch(()=>{});await handle?.close();await onStart?.(child.pid);return completion;}
export function probeVideo(file){return JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_entries','stream=index,codec_name,codec_type,width,height,r_frame_rate,avg_frame_rate,nb_read_frames,pix_fmt,color_space,color_transfer,color_primaries:format=duration','-of','json',file],{encoding:'utf8',maxBuffer:4*1024*1024}));}
export async function decodeVideo(file,{log,cwd}={}){await run('ffmpeg',['-v','error','-xerror','-i',file,'-f','null','-'],{cwd,log});return{fullDecode:true,errors:0};}
export function mainMsaaEvidence(frame){const a=frame.msaaEvidence;if(a?.mainPasses?.some(p=>!p.override&&p.width>=1620&&p.height>=1620&&p.actualSamples>=2))return{kind:'observed-main-geometry-framebuffer-samples',minimumSamples:Math.min(...a.mainPasses.filter(p=>!p.override&&p.width>=1620&&p.height>=1620&&p.actualSamples>=2).map(p=>p.actualSamples))};return null;}
function sourceEqual(a,b){if(a.hash!==b.hash)return false;const ak=Object.keys(a.files).sort(),bk=Object.keys(b.files).sort();return JSON.stringify(ak)===JSON.stringify(bk)&&ak.every(k=>a.files[k]===b.files[k]);}
// Old F did not numerically log per-pass samples. These two exact-source
// contracts establish the same main composer MSAA path, not a forged GL count.
// They require the same complete vendor/runtime bytes and all actual frames' GL
// success. Any changed source, unknown driver, low sampling or partial clip fails.
export async function legacyMsaaContract(receipt,{snapshotRoot,snapshotProof,originSnapshotProof}={}){
 const known={2:{hash:'dc68c596e79e406e4a47015f901aee2f07c5a43ac66fd187c0ad559ba3b4c8a6',file:'reconstructions/scene-02/main.js',need:['composer.renderTarget1.samples=4','composer.renderTarget2.samples=4','new RenderPass(scene,camera)']},9:{hash:'4757862cf5799582aefaef4e6fe8d88b20945ce0cfcabc7bff38a5b3c8f2590f',file:'reconstructions/scene-09/src/main.js',need:['composer.renderTarget1.samples=Math.min(4,renderer.capabilities.maxSamples)','composer.renderTarget2.samples=Math.min(4,renderer.capabilities.maxSamples)','new RenderPass(scene,camera)']}};
 const k=known[receipt.reference];if(!k||receipt.source?.hash!==k.hash||receipt.renderDriver?.sha256!==LEGACY_EQUIVALENT_DRIVER||receipt.backend!=='metal')return null;
 if(!snapshotProof?.files||!originSnapshotProof?.files)return null;
 const dependencies=Object.keys(snapshotProof.files).filter(f=>f.startsWith('vendor/')||f==='tools/render-runtime.mjs');
 const oldDependencies=Object.keys(originSnapshotProof.files).filter(f=>f.startsWith('vendor/')||f==='tools/render-runtime.mjs');
 if(JSON.stringify(dependencies.sort())!==JSON.stringify(oldDependencies.sort()))return null;
 if(!dependencies.length||dependencies.some(f=>snapshotProof.files[f].sha256!==originSnapshotProof.files[f]?.sha256))return null;
 const bytes=await readFile(resolve(snapshotRoot,k.file));if(sha(bytes)!==receipt.source.files[k.file]||k.need.some(s=>!bytes.toString().includes(s)))return null;
 return{kind:'audited-identical-source-main-composer-msaa-semantics',references:[receipt.reference],sourceFile:k.file,sourceFileSha256:sha(bytes),sourceAssertions:k.need,vendorRuntimeFileCount:dependencies.length,legacyDriverSha256:LEGACY_EQUIVALENT_DRIVER,numericalLegacySamplesRecorded:false,evidence:'Exact archived main-composer multisample setup plus unchanged vendor/runtime implementation and 168 actual successful native WebGL2 frame receipts. This is source-contract evidence, not a newly invented historical numeric GL observation.'};
}
export async function validateShot(receiptFile,{expectedSource,snapshotRoot,snapshotProof,driverSha,originSnapshotProof,allowLegacy=true,decode=false,decodeLog,videoOverride,expectedVideoSha256}={}){
 const receiptBytes=await readFile(receiptFile),r=JSON.parse(receiptBytes),reasons=[],S=FILM_SPEC;
 if(!['motion-review-rendered','motion-review-rendered-recovered'].includes(r.status))reasons.push('terminal native motion receipt required');
 if(!expectedSource||!sourceEqual(r.source||{},expectedSource))reasons.push('complete scene source/hash differs');
 if(r.size!==S.size||r.motion?.fps!==S.fps||r.motion?.expectedFrames!==S.framesPerShot||Math.abs((r.motion?.duration??0)-S.shotSeconds)>.00001)reasons.push('output/fps/shot-frame contract differs');
 const p=r.renderSampling;if(p?.nativeWidth!==S.nativeSize||p?.nativeHeight!==S.nativeSize||p?.outputWidth!==S.size||p?.outputHeight!==S.size||p?.scale!==S.scale||!p.downsampling?.includes('Lanczos'))reasons.push('actual 1620 to 1080 Lanczos sampling not proven');
 if(r.frames?.length!==S.framesPerShot||!r.frames.every((f,i)=>f.valid&&f.width===S.nativeSize&&f.height===S.nativeSize&&f.glError===0&&!f.contextLost&&Math.abs(f.localTime-(i+.5)/S.fps)<1e-9&&(f.programs?.every(x=>x.linked)??f.programsLinked===true)))reasons.push('168 successful exact native frame times required');
 if(r.errors?.length||r.motion?.decodeErrors!==0)reasons.push('native/encoding errors present');
 if(reasons.length)return{valid:false,reasons,receiptFile,reference:r.reference};
 const currentDriver=r.renderDriver?.sha256===driverSha&&r.captureContract?.id===CAPTURE_SEMANTICS,legacyDriver=allowLegacy&&r.renderDriver?.sha256===LEGACY_EQUIVALENT_DRIVER;
 if(!currentDriver&&!legacyDriver)reasons.push('capture driver semantics not audited equivalent');
 let msaa=null;if(r.frames?.length&&r.frames.every(f=>mainMsaaEvidence(f)))msaa={kind:'observed-main-scene-MSAA-all-frames',minimumSamples:Math.min(...r.frames.map(f=>mainMsaaEvidence(f).minimumSamples))};
 if(!msaa&&legacyDriver)msaa=await legacyMsaaContract(r,{snapshotRoot,snapshotProof,originSnapshotProof});
 if(!msaa)reasons.push('main-scene MSAA evidence absent/incompatible');
 const file=videoOverride||r.motion?.file;if(!file||!await exists(file))reasons.push('encoded source clip missing');
 if(reasons.length)return{valid:false,reasons,receiptFile,reference:r.reference};
 const before=await stat(file),probe=probeVideo(file),v=probe.streams.find(s=>s.codec_type==='video');
 if(v?.width!==S.size||v?.height!==S.size||v?.r_frame_rate!=='24/1'||Number(v?.nb_read_frames)!==S.framesPerShot||Math.abs(Number(probe.format.duration)-S.shotSeconds)>.002)reasons.push('encoded clip probe differs');
 if(reasons.length)return{valid:false,reasons,receiptFile,reference:r.reference};
 const videoSha256=await shaFile(file);if(expectedVideoSha256&&videoSha256!==expectedVideoSha256)return{valid:false,reasons:['encoded cached clip bytes differ from completed film receipt'],reference:r.reference,receiptFile};let decoded=null;if(decode)decoded=await decodeVideo(file,{log:decodeLog,cwd:snapshotRoot});
 const after=await stat(file);if(after.size!==before.size||after.mtimeMs!==before.mtimeMs)throw Error('Clip changed during validation: '+file);
 return{valid:true,reference:r.reference,file,videoSha256,videoBytes:after.size,receipt:receiptFile,receiptSha256:sha(receiptBytes),source:r.source,originSourceCommit:r.sourceCommit,renderSampling:r.renderSampling,renderDriver:r.renderDriver,captureSemantics:CAPTURE_SEMANTICS,msaaEvidence:msaa,probe,...(decoded?{decode:decoded}:{}),duration:7,frames:168,fps:24,actualWebgl:true,visualAccepted:false};
}
