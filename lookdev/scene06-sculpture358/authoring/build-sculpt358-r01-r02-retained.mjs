import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {loadInputs,makeLocalGraph,fair,smooth,updateNormals,writeMesh,sha,LANE} from './mesh358.mjs';
const configPath=resolve(import.meta.dirname,process.argv[2]??'sculpt-r01.json'),C=JSON.parse(await readFile(configPath));
if(!/^r\d\d[a-z]?$/.test(C.revision))throw Error('Explicit independent revision');
const {original,posed}=await loadInputs(),P=new Float32Array(posed.P),graph=makeLocalGraph(posed,original),out=resolve(LANE,'authored-'+C.revision);
await mkdir(out);const bands=(k,s)=>s.x&&s.y&&s.z?[s.x,s.y,s.z].reduce((v,b,j)=>v*smooth(b[0],b[1],original.P[k+j])*(1-smooth(b[2],b[3],original.P[k+j])),1):0;
const stages=[];
for(const name of ['sleeveFold','sleeveLip']){
 const s=C[name],weights=Float32Array.from(graph.ids,v=>bands(v*3,s)*(s.strength??1));
 const before=new Float32Array(P),vertices=fair(P,graph,weights,s.steps,s.lambda);let max=0;
 for(const v of graph.ids){const k=v*3;max=Math.max(max,Math.hypot(P[k]-before[k],P[k+1]-before[k+1],P[k+2]-before[k+2]));}
 stages.push({name,vertices,steps:s.steps,maximumAdditionalDisplacement:max});
}
// The real R03/R06 hand was rigidly rotated by this frame. Keep the wrist
// and root unchanged, taper into the source palm, and curl the true fingertips.
const q=[.465187630346821,-.4358069438751233,.39511268819857864,.6614822294415984];
const [w,x,y,z]=q,rx=[1-2*(y*y+z*z),2*(x*y+w*z),2*(x*z-w*y)],rz=[2*(x*z+w*y),2*(y*z-w*x),1-2*(x*x+y*y)],h=C.hand;
let handVertices=0;
for(const v of graph.ids){const k=v*3,sx=original.P[k],sy=original.P[k+1],sz=original.P[k+2];if(sx<=.36||sy<=1.48||sz<=.1)continue;
 const palmBlend=smooth(1.48,1.64,sy),distal=smooth(h.distalStartSourceY,h.distalEndSourceY,sy),side=-h.lateralContraction*(sx-h.lateralCenterSourceX)*palmBlend,lift=h.cupLift*distal*distal;
 for(let j=0;j<3;j++)P[k+j]+=rx[j]*side+rz[j]*lift;handVertices++;
}
if(h.smoothingSteps){const weights=Float32Array.from(graph.ids,v=>{const k=v*3;return original.P[k]>.36&&original.P[k+1]>1.48&&original.P[k+2]>.1?smooth(1.48,1.57,original.P[k+1])*h.smoothingStrength:0;});fair(P,graph,weights,h.smoothingSteps,.36);}
stages.push({name:'original-hand-continuous-cup',vertices:handVertices,originalFrameQuaternionWXYZ:q});
const normal=updateNormals(P,posed),N=normal.N;let changedPositions=0,changedNormals=0,maxDisplacement=0,protectedPositionChanges=0,protectedNormalChanges=0;
const min=[9,9,9],max=[-9,-9,-9];
for(let v=0;v<posed.n;v++){
 const k=v*3,dp=Math.hypot(P[k]-posed.P[k],P[k+1]-posed.P[k+1],P[k+2]-posed.P[k+2]),dn=N[k]!==posed.N[k]||N[k+1]!==posed.N[k+1]||N[k+2]!==posed.N[k+2],protectedVertex=original.P[k]<=0||original.P[k+1]<=.70||original.P[k+1]>=2.10;
 if(dp){changedPositions++;maxDisplacement=Math.max(maxDisplacement,dp);for(let j=0;j<3;j++){min[j]=Math.min(min[j],original.P[k+j]);max[j]=Math.max(max[j],original.P[k+j]);}if(protectedVertex)protectedPositionChanges++;}
 // Protected normals must be byte exact even at the fairing boundary.
 if(protectedVertex){if(dn)for(let j=0;j<3;j++)N[k+j]=posed.N[k+j];}
 if(N[k]!==posed.N[k]||N[k+1]!==posed.N[k+1]||N[k+2]!==posed.N[k+2]){changedNormals++;if(protectedVertex)protectedNormalChanges++;}
}
if(protectedPositionChanges||protectedNormalChanges||normal.degenerate||maxDisplacement>C.maxAdditionalPositionDisplacement)throw Error('Preservation/area/displacement bound failed');
const filename='central-original-sleeve-sculpt358-'+C.revision+'-gzip.bin',d=await writeMesh(resolve(out,filename),P,N,posed),m=structuredClone(posed.m);
m.revision='scene06-sculpture358-'+C.revision+'-continuous-original-wrist-sleeve';
m.variants.central[0]={...m.variants.central[0],file:filename,...d,effectiveGeometrySha256:d.uncompressedSha256};
m.attribution+=' SCULPT358 '+C.revision+' declares additional original-source wrist/sleeve fairing and restrained original-palm/finger cupping on the same continuous indexed mesh. All original triangles, vertex identities, UVs, head/ears/scalp, figure-right hand, legs and bearing/contact band remain. No global intersection-free or photographic-match claim.';
m.productionIntegrated=false;m.visualAccepted=false;m.photographicFidelityAccepted=false;
m.nativeMaterialStudyChange='Original source PBR, UV textures and CM07 color mask unchanged. Additional actual original wrist/sleeve/palm positions and physical normals are declared modified.';
m.sculpture358={config:C,sourcePoseRawSha256:sha(posed.raw),sourceOriginalRawSha256:sha(original.raw),sourceScripts:{[configPath]:sha(await readFile(configPath)),[resolve(import.meta.dirname,'build-sculpt358.mjs')]:sha(await readFile(resolve(import.meta.dirname,'build-sculpt358.mjs'))),[resolve(import.meta.dirname,'mesh358.mjs')]:sha(await readFile(resolve(import.meta.dirname,'mesh358.mjs')))},audit:{stages,changedPositions,changedNormals,maxAdditionalDisplacement:maxDisplacement,changedOriginalSourceBounds:{min,max},protectedPositionChanges,protectedNormalChanges,degenerateTrianglesTouched:normal.degenerate,minimumTwiceAreaTouched:normal.minTwiceArea,trianglesTouched:normal.trianglesTouched,vertices:posed.n,triangles:posed.I.length/3,allOriginalIndicesAndUvBytesExact:true,allCM07BytesExact:true,originalTriangleOrVertexDeletion:false,visualAccepted:false}};
await writeFile(resolve(out,'manifest.json'),JSON.stringify(m,null,2)+'\n',{flag:'wx'});
for(const name of ['LICENSE-DONOR173-CC-BY-4.0-ATTRIBUTION.txt','LICENSE-NC-SOURCE-CC-BY-NC-SA-4.0.txt','actual-root-coverage199-r08a-6131443d8f997b39.bin'])await copyFile(resolve(posed.folder,name),resolve(out,name));
await writeFile(resolve(out,'sculpture358-provenance.json'),JSON.stringify({revision:C.revision,license:m.license,sourceLicenses:m.sourceLicenses,userAuthorization:m.userAuthorization,method:C.method,sourcePose:m.sculpture358.sourcePoseRawSha256,sourceOriginal:m.sculpture358.sourceOriginalRawSha256,scriptHashes:m.sculpture358.sourceScripts,sculpture358Audit:m.sculpture358.audit,visualAccepted:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,...d,...m.sculpture358.audit},null,2));
