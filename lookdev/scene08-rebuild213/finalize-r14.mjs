// Read-only scene validation and compact review authoring. No rendering/export.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
import {createGardenStream213} from '../../reconstructions/scene-08/src/garden-depth213.js';

const root=path.resolve(import.meta.dirname,'../..'),out=import.meta.dirname;
const expected='17fc80c465fd3e5fe692949b6e25e1d2fa805e90d5e2b574419ef9284128a7f5';
const read=p=>fs.readFileSync(path.resolve(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const sha=s=>createHash('sha256').update(s).digest('hex');
const save=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n');
const assert=(value,message)=>{if(!value)throw Error(message);};
const current=await reconstructionSourceIdentity(root,'08');
assert(current.hash===expected,'Current source changed since R14 native rendering');
const r09=json('lookdev/scene08-rebuild213/r09-source-identity.json');
const r04=json('lookdev/scene08-rebuild213/r04-source-identity.json');
const sourceChanged=Object.keys(current.files).filter(k=>current.files[k]!==r09.files[k]);
const metadataChanged=['reconstructions/scene-08/asset-dependencies.json','reconstructions/scene-08/assets/rebuild213-provenance.json'];
assert(sourceChanged.every(k=>k.startsWith('reconstructions/scene-08/src/')||metadataChanged.includes(k)),'Unexpected asset/shared change relative to R09');

const rounds=[];
for(const round of ['r10','r11','r12','r13','r14']){
 const identity=json(`lookdev/scene08-rebuild213/${round}-source-identity.json`);
 const reportPaths=[`qa/ten-reference/08/iteration-scene08-rebuild213-${round}/report.json`];
 if(round!=='r10')reportPaths.push(`qa/ten-reference/08/iteration-scene08-rebuild213-${round}-low3q/report.json`);
 const reports=reportPaths.map(p=>{
  const r=json(p);
  assert(r.source.hash===identity.hash,`${p}: wrong source`);
  assert(r.status==='rendered-review'&&r.errors.length===0,`${p}: failed render`);
  assert(r.backend==='metal'&&r.renderSampling.scale===1&&r.renderSampling.downsampling==='none',`${p}: not native Metal`);
  const frames=r.frames.map(f=>{
   assert(f.valid&&f.pngSaved&&f.width===1254&&f.height===1254&&f.glError===0&&!f.contextLost&&f.programs.every(p=>p.linked),`${p}/${f.name}: invalid native frame`);
   const png=path.posix.join(path.posix.dirname(p),f.name+'.png');
   assert(fs.existsSync(path.resolve(root,png)),`${png}: missing`);
   return {name:f.name,png,width:f.width,height:f.height,glError:f.glError,contextLost:f.contextLost,allProgramsLinked:true,rgbaSha256:f.rgbaSha256};
  });
  return {path:p,source:r.source.hash,status:r.status,backend:r.backend,nativeScale:r.renderSampling.scale,errors:r.errors,frames};
 });
 const archive=`lookdev/scene08-rebuild213/${round}-source-scripts.tgz`;
 assert(fs.existsSync(path.resolve(root,archive)),`${archive}: missing`);
 rounds.push({round,source:identity.hash,archive,reports});
}
const full=json('qa/ten-reference/08/iteration-scene08-rebuild213-r14/report.json');
const info=full.frames[0].info,depth=info.rebuild213.banks.depthGarden;
const mats=depth.plants.filter(p=>p.actual?.authoredCreepingRunner);
assert(mats.length===266&&mats.every(p=>p.actual.actualLeafCount===84&&p.actual.terrainFollowingNodes===42),'Native root mats mismatch');
const flowers=depth.plants.map(p=>p.blossom).filter(Boolean);
assert(flowers.every(f=>f.height<=.180001),'Native flower height cap failed');
const audit=json('lookdev/scene08-rebuild213/depth-audit-r14.json');
assert(audit.source===expected&&audit.closedWood&&audit.connectedLowerBranches&&audit.allRocksIntersectSoil,'CPU geometry validation failed');
assert(audit.wood.length===121&&audit.rockContact.length===16,'CPU count mismatch');
const counts={closedWoodyBodies:audit.wood.length,rootedWoodyClumps:depth.branches.length,groupedScanRocks:depth.rocks.length,creepingRootMats:mats.length,actualScanLeafInstancesInMats:mats.reduce((n,p)=>n+p.actual.actualLeafCount,0),terrainFollowingNodesPerMat:42,maximumBlossomHeight:Math.max(0,...flowers.map(f=>f.height)),maximumLowerBranchJointDistanceMetres:Math.max(...audit.joints.map(j=>j.parentCentrelineDistance))};

const old=name=>execFileSync('tar',['-xOf',path.join(out,'r09-source-scripts.tgz'),`reconstructions/scene-08/src/${name}`],{encoding:'utf8'});
const now=name=>read(`reconstructions/scene-08/src/${name}`);
const components=['fine-hall213.js','grand-bearing171.js','garden-joinery213.js','spatial-portals191.js','arm-cladding191.js','post.js'];
const heldComponents=components.map(name=>{const file=`reconstructions/scene-08/src/${name}`;return {file,held:current.files[file]===r09.files[file],sha256:current.files[file]};});
const prefix=s=>s.slice(s.indexOf('const grandFrame='),s.indexOf("role='garden-ground';"));
assert(prefix(now('scene.js')).length>1000,'Architectural source anchors missing');
const cameraNormalize=s=>s.replace(/revision:'[^']+'/g,"revision:'HELD'");
const lanternNormalize=s=>s.replace(/export const REBUILD213_REVISION='[^']*'/g,"export const REBUILD213_REVISION='HELD'");
const boundary={source:expected,baseline:r09.hash,R04Source:r04.hash,heldComponents,architecturalPrefixHeld:prefix(now('scene.js'))===prefix(old('scene.js')),architecturalPrefixSha256:sha(prefix(now('scene.js'))),cameraRendererAndDollyHarnessHeldExceptRevision:cameraNormalize(now('main.js'))===cameraNormalize(old('main.js')),stoneLanternBodyHeldExceptRevision:lanternNormalize(now('weathered-toro213.js'))===lanternNormalize(old('weathered-toro213.js')),sourceChangedSinceR09:sourceChanged,sceneMetadataUpdated:metadataChanged,assetAndSharedDependencyHashesHeldExceptListedSceneMetadata:Object.entries(r09.files).filter(([k])=>!k.startsWith('reconstructions/scene-08/src/')&&!metadataChanged.includes(k)).every(([k,v])=>current.files[k]===v),R04AndR09BoundaryPresent:['lookdev/scene08-rebuild213/r04-source-identity.json','lookdev/scene08-rebuild213/r04-source-scripts.tgz','lookdev/scene08-rebuild213/r09-source-identity.json','lookdev/scene08-rebuild213/r09-source-scripts.tgz','qa/ten-reference/08/iteration-scene08-rebuild213-r04/reference.png','qa/ten-reference/08/iteration-scene08-rebuild213-r09/reference.png'],README08TouchedByThisContinuation:false,gitCommandsOrStagingByThisContinuation:false,BlenderOrSceneExportsByThisContinuation:false,visualBoardPromoted:false,scope:'Exact source preservation evidence; not photographic acceptance',visualAccepted:false};
assert(heldComponents.every(c=>c.held)&&boundary.architecturalPrefixHeld&&boundary.cameraRendererAndDollyHarnessHeldExceptRevision&&boundary.stoneLanternBodyHeldExceptRevision&&boundary.assetAndSharedDependencyHashesHeldExceptListedSceneMetadata,'Held source boundary violated');
assert(boundary.R04AndR09BoundaryPresent.every(p=>fs.existsSync(path.resolve(root,p))),'Historical boundary missing');
save('boundary-r14.json',boundary);

const stream=createGardenStream213(),widths=[];
for(let n=0;n<=1000;n++){const t=n/1000,z=stream.curve.getPoint(t).z;if(z>=-13&&z<=5)widths.push(stream.halfWidth(t)*2);}
const review={revision:'scene08-rebuild213-r14',source:expected,baseline:r09.hash,R04Boundary:r04.hash,status:'five-official-native-rounds-reviewed-photographic-fidelity-still-false',visualAccepted:false,reviewedAt:new Date().toISOString(),firstOriginalSizeComparison:'compare-r09-native.html',beforeFindings:'r10-before-findings.json',actualViewed:['references/hd/7-照片-8.jpg','qa/ten-reference/08/iteration-scene08-rebuild213-r14/reference.png','qa/ten-reference/08/iteration-scene08-rebuild213-r14/detail-native.png','qa/ten-reference/08/iteration-scene08-rebuild213-r14-low3q/inspection-view.png'],mainGeometryChanges:[
 'One shared narrow curving creek controls actual water and connected soil banks; foreground water bends out to the right instead of occupying the bottom opening.',
 'Seven rock groups use sixteen existing scanned stones with buried feet; eight rooted woody clumps have 121 closed curved and tapered branch solids.',
 '266 real creeping runner root mats bridge the near and midground soil. Each uses 42 terrain-following nodes and 84 original scanned leaf instances; R14 leaf frames partly follow actual terrain normals.',
 'Formerly tall flowering understory is capped at 0.18 m; the foreground has a lower branch tier connected to real parent trunks. Eight small closed stone paving slabs meet the gate footing.'
 ],materialAndLightingChanges:[
 'Wet stone roughness and diffuse darkening use a world-space waterline; mineral albedo is lifted while original moss colour separation remains.',
 'Actual 3 mm creek relief, Fresnel planar reflection and a shadow-receiving physical surface replace emissive fake glint lines. Planar reflection remains an approximation, not full volumetric water.',
 'One existing sun uses linear RGB [1,0.79,0.52], intensity 5.1; existing measured sky environment intensity is 0.80. Sun direction and camera exposure 1.10 are held; no new ambient or directional fills.'
 ],nativeCounts:counts,visibleCreekWidthMetresForZMinus13To5:{min:Math.min(...widths),max:Math.max(...widths)},validation:{officialFIFO:true,sourceMatched:true,nativeMetal1254:true,roundCount:rounds.length,frameCount:rounds.reduce((n,r)=>n+r.reports.reduce((m,p)=>m+p.frames.length,0),0),allFramesValid:true,allGLErrorsZero:true,allProgramsLinked:true,noContextLoss:true,CPUActualGeometry:'depth-audit-r14.json',scope:'Technical checks support source identity and geometry only; they do not establish a photographic match.'},findingsAfterPersonallyViewingR14:[
 'The wide near pool is gone. Grouped stone, woody stems and a low creeping layer form a narrower garden channel, and slope-facing leaves now cover more of the previously bare bank.',
 'The banks still read as smooth constructed mounds in places; leaf clusters and crown shapes remain repetitive and less species-specific than the photograph.',
 'Reference architecture, decorative carving, roof proportions and luminous warm material response remain substantially different. Those major photo mismatches are not resolved by this garden continuation.',
 'Foreground foliage is still thinner and more regular than the reference. The creek remains gray-green with a simplified reflection and does not reproduce the reference wet edge sparkle.',
 'The retained rear inlet arch was inferred during R09 and is not a photograph-verified feature.'
 ],retainedFailedRounds:['r10-review.json','r11-review.json','r12-review.json','r13-review.json'],rounds,sourceBoundary:'boundary-r14.json',sourceIdentity:'r14-source-identity.json',sourceArchive:'r14-source-scripts.tgz',visualBoard:'No promotion performed; root-current-review.json retained unchanged',scope:'Scene08 src and lookdev213/new QA08 only. README08 pre-existing changes were not touched or staged. No scene export, Blender invocation, new external assets, or shared-file writes.'};
save('review213-r14.json',review);

const photo='../../references/hd/7-照片-8.jpg',qa='../../qa/ten-reference/08/iteration-scene08-rebuild213-r14/';
const figure=(title,src)=>`<figure><figcaption>${title}</figcaption><a href="${src}"><img loading="lazy" width="1254" height="1254" src="${src}"></a></figure>`;
const head='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#161713;color:#ece9e0;margin:24px;font:15px/1.65 system-ui}main{max-width:1700px;margin:auto}a{color:#e2c388}code{overflow-wrap:anywhere}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:0}figcaption{font-weight:600;padding:10px 0}img{display:block;width:100%;height:auto}.status{color:#ffc38d}.native{display:flex;gap:20px;width:max-content}.native img{width:1254px;height:1254px}.native figure{width:1254px}@media(max-width:900px){.pair{grid-template-columns:1fr}}</style>';
fs.writeFileSync(path.join(out,'compare-r14-native.html'),`<!doctype html><html lang="zh-CN">${head}<title>Scene08 R14 原尺寸比较</title><h1>Scene08 R14：左参考，右实际原生</h1><p class="status">摄影未验收。1254×1254 原文件，不缩放、不改像素；横向滚动比较。</p><p>source <code>${expected}</code></p><div class="native">${figure('参考照片：仅比较输入',photo)}${figure('R14 官方FIFO / Metal 原生实际图',qa+'reference.png')}</div></html>`);
fs.writeFileSync(path.join(out,'review-r14.html'),`<!doctype html><html lang="zh-CN">${head}<title>Scene08 R14 actual native review — not accepted</title><main><h1>Scene08 / 213 · R14 实际原生复核</h1><p class="status">摄影还原未验收。五轮实际渲染支持建模进展，技术通过不等于照片还原通过。</p><p>source <code>${expected}</code> · official FIFO · Metal 1254×1254 · 原相机/曝光/太阳方向保持</p><p><a href="compare-r14-native.html">左参考 / 右实际：1254px 原尺寸比较</a></p><div class="pair">${figure('参考照片：仅比较输入',photo)}${figure('R14 实际完整机位',qa+'reference.png')}</div><div class="pair">${figure('R14 真正子视锥庭院细节',qa+'detail-native.png')}${figure('R14 保留的同一低3q实体复核机位',qa.replace('r14/','r14-low3q/')+'inspection-view.png')}</div><h2>本轮实修</h2><p>水土共用实际曲线，溪流转向右侧收窄；16 块扫描石分组入土，8 组木枝和 266 片走茎根床分层。低枝接回真实主干，叶片随坡面调整；湿石水线、真实小波面、太阳与天空辐照均进入原生渲染。</p><h2>仍存在的主要差距</h2><p>岸坡仍有平滑土包感，枝叶冠形与前景遮挡仍规整；参考建筑比例、精细雕刻和暖光材质明显不同。溪水仍是平面反射与物理表面的近似；后方石拱为 R09 推定，未从照片验证。</p><div class="pair">${figure('此前 R09 实际图：本次工作的起点',qa.replace('r14/','r09/')+'reference.png')}${figure('R04 精确历史边界，原图保留',qa.replace('r14/','r04/')+'reference.png')}</div><p><a href="review213-r14.json">完整复核与五轮来源</a> · <a href="r14-source-identity.json">R14 源码身份</a> · <a href="boundary-r14.json">R09/R04 保留边界</a> · <a href="depth-audit-r14.json">实际实体与土面 CPU 检查</a> · <a href="r14-source-scripts.tgz">紧凑源码归档</a></p><p>未替换现有 visual board；未触碰 README08、Git 或共享源码。</p></main></html>`);
console.log(JSON.stringify({source:expected,rounds:review.validation.roundCount,nativeFrames:review.validation.frameCount,counts,heldBoundary:true,sourceChanged,visualAccepted:false,review:'lookdev/scene08-rebuild213/review-r14.html'},null,2));
