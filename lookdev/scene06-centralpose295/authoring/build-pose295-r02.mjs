// CPU-only topology-preserving pose authoring. No renderer, browser, Blender,
// viewport, scene export, raster/depth sampling, UV bake, or GPU operation.
import {readFile,writeFile,mkdir,open,unlink,copyFile,access} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {gunzipSync,gzipSync} from 'node:zlib';
const LANE=resolve(import.meta.dirname,'..'),ROOT=resolve(LANE,'../..');
const configFile=resolve(import.meta.dirname,process.argv[2]??'pose-r02.json');
const config=JSON.parse(await readFile(configFile,'utf8'));
const sourceAnalysisFile=resolve(import.meta.dirname,config.sourceAnalysis),sourceAnalysis=JSON.parse(await readFile(sourceAnalysisFile,'utf8'));
if(!/^r\d{2}[a-z]?$/.test(config.revision))throw Error('Explicit unique pose revision required');
const OUT=resolve(LANE,'authored-'+config.revision);
for(const path of [OUT,resolve(LANE,config.revision+'-cpu-authoring-receipt.json')]){try{await access(path);throw Error('Preserve existing pose output/receipt: '+path);}catch(error){if(error.code!=='ENOENT')throw error;}}
const SOURCE=resolve(ROOT,'reconstructions/scene-06/assets/sculpture199-r08a-continuous-source-fit-mixed-licenses');
const sha=x=>createHash('sha256').update(x).digest('hex');
const sourceManifest=JSON.parse(await readFile(resolve(SOURCE,'manifest.json'),'utf8'));
const definition=sourceManifest.variants.central[0];
const sourceZip=await readFile(resolve(SOURCE,definition.file));
if(sha(sourceZip)!==definition.sha256)throw Error('Exact R08a packed source changed');
const raw=gunzipSync(sourceZip);
if(sha(raw)!==definition.uncompressedSha256||raw.readUInt32LE(0)!==0x37304353)throw Error('Exact R08a geometry changed');
const n=raw.readUInt32LE(4),ni=raw.readUInt32LE(8);
if(raw.length!==20+n*32+ni*4)throw Error('SC07 layout mismatch');
if(sourceAnalysis.sourceSha256!==definition.uncompressedSha256||sourceAnalysis.sourceVertices!==n)throw Error('Measured source analysis identity mismatch');
const P0=new Float32Array(raw.buffer,raw.byteOffset+20,n*3),N0=new Float32Array(raw.buffer,raw.byteOffset+20+n*12,n*3);
const I=new Uint32Array(raw.buffer,raw.byteOffset+20+n*32,ni),P=new Float32Array(P0),N=new Float32Array(N0);
const qConj=q=>[q[0],-q[1],-q[2],-q[3]];
const qMul=(a,b)=>[a[0]*b[0]-a[1]*b[1]-a[2]*b[2]-a[3]*b[3],a[0]*b[1]+a[1]*b[0]+a[2]*b[3]-a[3]*b[2],a[0]*b[2]-a[1]*b[3]+a[2]*b[0]+a[3]*b[1],a[0]*b[3]+a[1]*b[2]-a[2]*b[1]+a[3]*b[0]];
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const unit=a=>{const l=Math.hypot(...a);if(l<1e-15)throw Error('Singular direction');return a.map(v=>v/l);};
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const rotate=(q,p)=>qMul(qMul(q,[0,...p]),qConj(q)).slice(1);
const qBetween=(a,b)=>{const u=unit(a),v=unit(b),d=dot(u,v);if(d<-.99999){const k=Math.abs(u[0])<.8?[1,0,0]:[0,1,0];return[0,...unit(cross(u,k))];}return unit([1+d,...cross(u,v)]);};
function frame(finger,normal){const y=unit(finger),z=unit(sub(normal,mul(y,dot(normal,y)))),x=unit(cross(y,z));return[x,y,z];}
function qMatrix(m){const t=m[0][0]+m[1][1]+m[2][2];let q;if(t>0){const s=2*Math.sqrt(1+t);q=[s/4,(m[2][1]-m[1][2])/s,(m[0][2]-m[2][0])/s,(m[1][0]-m[0][1])/s];}else{let i=0;if(m[1][1]>m[i][i])i=1;if(m[2][2]>m[i][i])i=2;const j=(i+1)%3,k=(i+2)%3,s=2*Math.sqrt(1+m[i][i]-m[j][j]-m[k][k]);q=[0,0,0,0];q[0]=(m[k][j]-m[j][k])/s;q[i+1]=s/4;q[j+1]=(m[j][i]+m[i][j])/s;q[k+1]=(m[k][i]+m[i][k])/s;}return unit(q);}
function mapFrames(source,target){const m=Array.from({length:3},(_,r)=>Array.from({length:3},(_,c)=>source.reduce((s,a,k)=>s+target[k][r]*a[c],0)));return qMatrix(m);}
const E=config.elbowSource,W=config.wristSource;
const qH=mapFrames(frame(config.sourceFingerAxis,config.sourcePalmNormal),frame(config.targetFingerAxis,config.targetPalmNormal));
// Preserve the full source-hand frame when choosing forearm axial orientation.
// The remaining minimum rotation aligns its transported elbow-wrist axis.
// This carries supination in the forearm instead of forcing an axial flip into
// the short wrist blend. Joint endpoints and original source length stay exact.
const qF=qMul(qBetween(rotate(qH,sub(W,E)),config.forearmTargetDirection),qH),W1=add(E,rotate(qF,sub(W,E)));
const wristRelativeDegrees=2*Math.acos(Math.max(-1,Math.min(1,Math.abs(dot(qF,qH)))))*180/Math.PI;
const tF=sub(E,rotate(qF,E)),tH=sub(W1,rotate(qH,W));
const dq=(q,t)=>[...q,...mul(qMul([0,...t],q),.5)];
const D=[dq([1,0,0,0],[0,0,0]),dq(qF,tF),dq(qH,tH)];
// Quaternion hemisphere consistency prevents DQ cancellation at joint blends.
for(let j=1;j<3;j++)if(dot(D[j].slice(0,4),D[0].slice(0,4))<0)D[j]=mul(D[j],-1);
const smooth=(x,a,b)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*t*(t*(t*6-15)+10);};
const env=config.envelope,wb=config.wristBlend;
function weights(x,y,z){
 if(x<=config.protected.rightAtOrBelowX||y<=config.protected.legsAtOrBelowY||y>=config.protected.headAtOrAboveY)return[0,0];
 const release=env.frontSideRelease*smooth(z,env.frontSideStart,env.frontSideFull);
 const upper=config.upperSleeveHold,upperHold=upper?1-smooth(y,upper.startY,upper.fullY)*(1-smooth(z,upper.frontStart,upper.frontFull)):1;
 const arm=upperHold*smooth(x,env.sideStart-release,env.sideFull-release)*smooth(z,env.frontStart,env.frontFull)*smooth(y,env.bottomStart,env.bottomFull)*(1-smooth(y,env.topFull,env.topEnd));
 const hand=smooth(y,wb.startY,wb.fullY)*smooth(z,wb.startZ,wb.fullZ);
 return[arm,hand];
}
function blendDQ(arm,hand){const w=[1-arm,arm*(1-hand),arm*hand],d=new Array(8).fill(0);for(let j=0;j<3;j++)for(let k=0;k<8;k++)d[k]+=w[j]*D[j][k];const l=Math.hypot(...d.slice(0,4));for(let k=0;k<8;k++)d[k]/=l;const orth=dot(d.slice(0,4),d.slice(4));for(let k=0;k<4;k++)d[k+4]-=orth*d[k];return d;}
const sourceHashes={[import.meta.filename]:sha(await readFile(import.meta.filename)),[configFile]:sha(await readFile(configFile)),[sourceAnalysisFile]:sha(await readFile(sourceAnalysisFile)),[resolve(import.meta.dirname,'analyze-source295.mjs')]:sha(await readFile(resolve(import.meta.dirname,'analyze-source295.mjs'))),[resolve(SOURCE,'manifest.json')]:sha(await readFile(resolve(SOURCE,'manifest.json')))};
const receipt={revision:config.revision,sourceHashes,startedAt:new Date().toISOString(),status:'authoring-active',cpuThreads:1,cpuThreadMaximum:4,canonicalModified:false,visualAccepted:false};
const lock=resolve(tmpdir(),'komorebi-reviewed-cpu-authoring.lock'),lockFile=await open(lock,'wx');await lockFile.writeFile(JSON.stringify({pid:process.pid,recipe:import.meta.filename,revision:config.revision,startedAt:receipt.startedAt}));await lockFile.close();
try{
 await mkdir(OUT); // Never overwrite a failed or selected candidate.
 const armWeights=new Float32Array(n),handWeights=new Float32Array(n),moved=new Uint8Array(n),parent=new Int32Array(n).fill(-1);let count=0,maxDelta=0,allowedVertices=0;
 // Actual indexed connected-component extraction from a measured source-palm
 // seed. Spatial envelopes delimit only a local shoulder/elbow/sleeve domain;
 // isolated source fragments or unrelated positive-X surfaces cannot move.
 for(let v=0;v<n;v++){const k=v*3,[arm,hand]=weights(P0[k],P0[k+1],P0[k+2]);armWeights[v]=arm;handWeights[v]=hand;if(arm){parent[v]=v;allowedVertices++;}}
 function root(v){let r=v;while(parent[r]!==r)r=parent[r];while(parent[v]!==v){const t=parent[v];parent[v]=r;v=t;}return r;}
 function unite(a,b){if(parent[a]<0||parent[b]<0)return;const x=root(a),y=root(b);if(x!==y)parent[y]=x;}
 for(let t=0;t<ni;t+=3){const a=I[t],b=I[t+1],c=I[t+2];unite(a,b);unite(b,c);unite(c,a);}
 const palmSeed=config.sourcePalmSeedVertex;if(parent[palmSeed]<0)throw Error('Actual source palm seed outside pose domain');const componentRoot=root(palmSeed);
 let disconnectedExcluded=0;for(let v=0;v<n;v++)if(parent[v]>=0&&root(v)!==componentRoot){armWeights[v]=0;handWeights[v]=0;disconnectedExcluded++;}
 const movedBounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
 for(let v=0;v<n;v++){
  const k=v*3,arm=armWeights[v],hand=handWeights[v];if(!arm)continue;
  for(let j=0;j<3;j++){movedBounds.min[j]=Math.min(movedBounds.min[j],P0[k+j]);movedBounds.max[j]=Math.max(movedBounds.max[j],P0[k+j]);}
  let sourcePoint=Array.from(P0.subarray(k,k+3));
  if(config.wristCage){const c=config.wristCage,u=unit(config.sourceFingerAxis),d=sub(sourcePoint,W),s=dot(d,u),band=smooth(s,c.startS,c.fullStartS)*(1-smooth(s,c.fullEndS,c.endS))*(1-smooth(Math.hypot(...d),c.radiusFull,c.radiusEnd))*smooth(sourcePoint[2],c.frontStart,c.frontFull),scale=1-(1-c.radialScale)*band;sourcePoint=add(W,add(mul(u,s),mul(sub(d,mul(u,s)),scale)));}
  const d=blendDQ(arm,hand),q=d.slice(0,4),t=mul(qMul(d.slice(4),qConj(q)).slice(1),2),p=add(rotate(q,sourcePoint),t);
  P.set(p,k);moved[v]=1;count++;maxDelta=Math.max(maxDelta,Math.hypot(P[k]-P0[k],P[k+1]-P0[k+1],P[k+2]-P0[k+2]));
 }
 function geometricNormals(positions){const out=new Float64Array(n*3);for(let j=0;j<ni;j+=3){const a=I[j]*3,b=I[j+1]*3,c=I[j+2]*3,ux=positions[b]-positions[a],uy=positions[b+1]-positions[a+1],uz=positions[b+2]-positions[a+2],vx=positions[c]-positions[a],vy=positions[c+1]-positions[a+1],vz=positions[c+2]-positions[a+2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;for(const k of[a,b,c]){out[k]+=nx;out[k+1]+=ny;out[k+2]+=nz;}}for(let k=0;k<out.length;k+=3){const l=Math.hypot(out[k],out[k+1],out[k+2]);if(!l)throw Error('Zero geometric normal');out[k]/=l;out[k+1]/=l;out[k+2]/=l;}return out;}
 const G0=geometricNormals(P0),G1=geometricNormals(P),touched=new Uint8Array(moved);
 for(let j=0;j<ni;j+=3)if(moved[I[j]]||moved[I[j+1]]||moved[I[j+2]]){touched[I[j]]=1;touched[I[j+1]]=1;touched[I[j+2]]=1;}
 let normalsChanged=0,protectedChanges=0,headCount=0,rightCount=0,legCount=0,positionChangesExact=0;
 for(let v=0;v<n;v++){
  const k=v*3;if(touched[v]){const d=blendDQ(armWeights[v],handWeights[v]),q=d.slice(0,4),residual=rotate(q,sub(Array.from(N0.subarray(k,k+3)),Array.from(G0.subarray(k,k+3)))),normal=unit(add(Array.from(G1.subarray(k,k+3)),residual));N.set(normal,k);if(normal.some((a,j)=>N[k+j]!==N0[k+j]))normalsChanged++;}
  if([0,1,2].some(j=>P[k+j]!==P0[k+j]))positionChangesExact++;
  const held=P0[k+1]>=config.protected.headAtOrAboveY||P0[k]<=config.protected.rightAtOrBelowX||P0[k+1]<=config.protected.legsAtOrBelowY;
  if(P0[k+1]>=config.protected.headAtOrAboveY)headCount++;if(P0[k]<=0)rightCount++;if(P0[k+1]<=config.protected.legsAtOrBelowY)legCount++;
  if(held&&[0,1,2].some(j=>P[k+j]!==P0[k+j]||N[k+j]!==N0[k+j]))protectedChanges++;
 }
 if(protectedChanges)throw Error('Protected head/right/legs attributes changed: '+protectedChanges);
 let degenerate=0,minArea=Infinity,localTriangleCount=0,localAreaRatios=[];
 for(let j=0;j<ni;j+=3){const va=I[j],vb=I[j+1],vc=I[j+2];if(!touched[va]&&!touched[vb]&&!touched[vc])continue;localTriangleCount++;const a=va*3,b=vb*3,c=vc*3;
  function twiceArea(pp){return Math.hypot(...cross(sub(Array.from(pp.subarray(b,b+3)),Array.from(pp.subarray(a,a+3))),sub(Array.from(pp.subarray(c,c+3)),Array.from(pp.subarray(a,a+3)))));}
  const area=twiceArea(P),old=twiceArea(P0);minArea=Math.min(minArea,area);if(area<1e-13)degenerate++;localAreaRatios.push(area/old);
 }
 if(degenerate)throw Error('Degenerate posed triangles: '+degenerate);
 for(const arr of[P,N])if(arr.some(x=>!Number.isFinite(x)))throw Error('Nonfinite authored attributes');
 localAreaRatios.sort((a,b)=>a-b);
 const out=Buffer.from(raw);new Float32Array(out.buffer,out.byteOffset+20,n*3).set(P);new Float32Array(out.buffer,out.byteOffset+20+n*12,n*3).set(N);
 const packed=gzipSync(out,{level:7}),hash=sha(packed),file='central-left-arm-pose295-'+config.revision+'-'+hash.slice(0,16)+'-gzip.bin';await writeFile(resolve(OUT,file),packed);
 const influence=Buffer.alloc(20+count*12);influence.write('PW29');influence.writeUInt32LE(n,4);influence.writeUInt32LE(count,8);influence.writeUInt32LE(12,12);influence.writeUInt32LE(1,16);let at=20;
 for(let v=0;v<n;v++)if(moved[v]){influence.writeUInt32LE(v,at);influence.writeFloatLE(armWeights[v],at+4);influence.writeFloatLE(handWeights[v],at+8);at+=12;}
 const influenceFile='left-arm-identity-vertex-pose-weights295-'+config.revision+'.bin';await writeFile(resolve(OUT,influenceFile),influence);
 await copyFile(sourceAnalysisFile,resolve(OUT,basename(sourceAnalysisFile)));
 const coverage=sourceManifest.scalpMaterial.coverage;if(sha(await readFile(resolve(SOURCE,coverage.file)))!==coverage.sha256)throw Error('Original scalp coverage changed');await copyFile(resolve(SOURCE,coverage.file),resolve(OUT,coverage.file));if(sha(await readFile(resolve(OUT,coverage.file)))!==coverage.sha256)throw Error('Scalp coverage copy differs');
 for(const license of['LICENSE-DONOR173-CC-BY-4.0-ATTRIBUTION.txt','LICENSE-NC-SOURCE-CC-BY-NC-SA-4.0.txt'])await copyFile(resolve(SOURCE,license),resolve(OUT,license));
 const audit={sourceVertices:n,sourceTriangles:ni/3,authoredVertices:n,authoredTriangles:ni/3,indicesAndTriangleOrderByteExact:true,uvByteExact:true,vertexAndTriangleIdentityMapping:'output vertex v = R08a vertex v; output triangle t = R08a triangle t. All original R08a ancestor/midpoint/donor barycentric traces remain valid as ancestry, not unchanged-position claims.',changedPositions:positionChangesExact,selectedPoseVertices:count,sourceConnectedRegion:{palmSeedVertex:palmSeed,palmSeedSourcePosition:Array.from(P0.subarray(palmSeed*3,palmSeed*3+3)),allowedEnvelopeVertices:allowedVertices,connectedVertices:count,disconnectedExcluded,originalSourceBounds:movedBounds,selection:'Triangle-index connected component containing the measured original-source palm seed, inside a local left-arm/sleeve envelope. Not a whole positive-X selection.'},changedNormals:normalsChanged,maximumPositionDelta:maxDelta,headAtOrAboveY:config.protected.headAtOrAboveY,headHeldVertices:headCount,rightSideHeldVertices:rightCount,legsHeldVertices:legCount,protectedPositionOrNormalChanges:protectedChanges,scalpCoverageByteExact:true,sourceHandFingersRetained:true,forearmFrameMethod:config.forearmOrientation,wristRelativeDegrees,localOriginalWristCage:config.wristCage??null,upperSleeveHold:config.upperSleeveHold??null,localTriangleCount,localMinimumTwiceArea:minArea,localDegenerateTriangles:degenerate,localAreaRatioPercentiles:{minimum:localAreaRatios[0],p01:localAreaRatios[Math.floor(localAreaRatios.length*.01)],median:localAreaRatios[Math.floor(localAreaRatios.length*.5)],p99:localAreaRatios[Math.floor(localAreaRatios.length*.99)],maximum:localAreaRatios.at(-1)},selfIntersectionsChecked:false,visualAccepted:false};
 const attribution='Scan-the-World Sainsbury Amida, Zenodo21353739, https://doi.org/10.5281/zenodo.21353739, CC BY-NC-SA4.0. Preserved R08a connected-head derivative additionally incorporates source-supported geometry from Buddha head by peel-3d.com, https://sketchfab.com/3d-models/buddha-head-fb17c123ad9c4c0fb6baf723b3fffd79, CC BY4.0; donor culture/period unspecified. The R08a head/ear/scalp authorship and all original source mappings are retained unchanged. POSE295 '+config.revision+': declared real 3D left-arm/hand pose derivative of R08a. R02 chooses the forearm axial orientation from the complete original source-hand frame with only the minimum remaining elbow-wrist-axis rotation, spreading supination into the forearm instead of forcing an axial flip at the wrist. It additionally holds the original upper sleeve behind the forearm, applies a bounded local C2 radial cage to the original wrist/cuff, and lowers/tilts the original palm based on actual R01 native full/detail/three-quarter review. No original finger triangles are removed or replaced. The original +X/figure-left forearm is dual-quaternion posed around its elbow, the original palm and all source fingers rotate upward over the lap, and connected left sleeve/side garments deform continuously through the authored joint weights. Head/ears/curls at Y>=2.10, all -X/figure-right geometry, legs at Y<=0.70, bearing/contact band, all UVs, indices and vertex identity stay exact from R08a. Body and left palm positions/normals are intentionally changed. No reference/depth/image is sampled, no projected plane or replacement frame is used. Original source, licenses, ancestor mappings and all earlier failed candidates are retained. CC BY-NC-SA4.0 personal noncommercial-only adaptation; no endorsement implied.';
 const mesh={...definition,file,sha256:hash,uncompressedSha256:sha(out),effectiveGeometrySha256:sha(out),bytes:packed.length,uncompressedBytes:out.length,topology:{...definition.topology,poseDerivative:true,sourceIndexOrderExact:true}};
 const manifest={...sourceManifest,revision:'scene06-centralpose295-'+config.revision+'-left-arm-lap-pose',attribution,visualAccepted:false,photographicFidelityAccepted:false,productionIntegrated:false,variants:{central:[mesh]},sourceContactBearing:{...sourceManifest.sourceContactBearing,bodyUnchangedFrom199R05:false,bodyUnchangedFromR08a:false,contactBandPositionsUnchanged:true,method:sourceManifest.sourceContactBearing.method.replace('below the unchanged body','below the contact-band-preserved posed body')},poseDerivative:{sourceRevision:sourceManifest.revision,sourceGeometrySha256:definition.uncompressedSha256,sourceManifest:'../sculpture199-r08a-continuous-source-fit-mixed-licenses/manifest.json',inputHistoricalAttribution:sourceManifest.attribution,sourceAnalysis,sourceAnalysisFile:basename(sourceAnalysisFile),sourceBodyAndLeftPalmChanged:true,sourceIndexMapping:'identity',config,elbowSource:E,wristSource:W,wristTarget:W1,forearmQuaternionWXYZ:qF,handQuaternionWXYZ:qH,influence:{file:influenceFile,sha256:sha(influence),format:'PW29 header sourceVertices,records,recordBytes12,version1; records uint32 original vertex ID, float32 arm influence, float32 hand blend. Unlisted source vertices have arm weight 0.'},audit},nativeMaterialStudyChange:'Source color, metalness, roughness and rooted-scalp vertex coverage retained. Pose changes only real left-arm/sleeve positions and corresponding physical surface normals.'};
 const provenance={revision:manifest.revision,license:manifest.license,licenseUrl:manifest.licenseUrl,attribution,sourceLicenses:manifest.sourceLicenses,source:definition,sourceManifestHash:sourceHashes[resolve(SOURCE,'manifest.json')],builder:{file:import.meta.filename,sourceHashes},poseDerivative:manifest.poseDerivative,geometry:mesh,visualAccepted:false,photographicFidelityAccepted:false,limits:['Native full/front arm detail and three-quarter images must be personally reviewed.','Identical closed topology and finite nondegenerate triangles do not establish absence of self intersections or photographic fidelity.']};
 for(const[name,value]of[['manifest.json',manifest],['provenance.json',provenance],['preflight.json',audit]])await writeFile(resolve(OUT,name),JSON.stringify(value,null,2)+'\n');
 receipt.status='cpu-authored-pose-awaiting-native-review';receipt.audit=audit;receipt.geometry=mesh;receipt.wristTarget=W1;receipt.output=OUT;
 for(const[f,h]of Object.entries(sourceHashes))if(sha(await readFile(f))!==h)throw Error('Authoring source changed during execution');
 console.log(JSON.stringify(receipt,null,2));
}catch(error){receipt.status='failed';receipt.error=String(error.stack??error);process.exitCode=1;console.error(receipt.error);}finally{receipt.completedAt=new Date().toISOString();await writeFile(resolve(LANE,config.revision+'-cpu-authoring-receipt.json'),JSON.stringify(receipt,null,2)+'\n');const owner=JSON.parse(await readFile(lock,'utf8'));if(owner.pid!==process.pid)throw Error('Never clear another author CPU lock');await unlink(lock);}
