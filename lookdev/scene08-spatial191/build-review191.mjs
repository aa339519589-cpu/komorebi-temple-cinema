import{readFile,writeFile}from'node:fs/promises';
import{createHash}from'node:crypto';
const root=new URL('../../',import.meta.url),dir=new URL('./',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root))),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const revision='scene08-spatial191-r06',pin=await read('lookdev/scene08-spatial191/r06-source-identity.json'),proof=await read('lookdev/scene08-spatial191/protected-native-proof-r06.json'),reports=await Promise.all([read(`qa/ten-reference/08/iteration-${revision}/report.json`),read(`qa/ten-reference/08/iteration-${revision}-low3q/report.json`)]);
if(!proof.pass||reports.some(r=>r.source.hash!==pin.hash||r.frames.some(f=>!f.valid)))throw Error('Frozen source/native proof does not pass');
const roundNames=['baseline','r01','r02','r03','r04','r05','r06'],rounds=[];
for(const round of roundNames){const s=await read(`lookdev/scene08-spatial191/${round}-source-identity.json`),archive=`${round}-source-scripts.tgz`;rounds.push({round,sourceHash:s.hash,inputs:Object.keys(s.files).length,sourceScripts:archive,archiveSha256:hash(await readFile(new URL(archive,dir))),status:round==='r06'?'Worker-held actual checkpoint; parent photographic review pending':round==='baseline'?'Parent-held171 R06 reference baseline':'Intermediate native review, preserved with failed-candidate findings',visualAccepted:false});}
const images=[];for(const [i,r]of reports.entries())for(const f of r.frames){const path=`qa/ten-reference/08/iteration-${revision}${i?'-low3q':''}/${f.name==='reference'?'reference.png':f.name==='detail-native'?'detail-native.png':'inspection-view.png'}`,bytes=await readFile(new URL(path,root));images.push({path,sha256:hash(bytes),nativeSize:[f.width,f.height],nativeRGBA:f.rgbaSha256,valid:f.valid,sourceHash:r.source.hash,pose:f.pose,subfrustum:f.detailCrop??null,visualAccepted:false});}
const findings=[
 'The six full-depth grand-hall/gallery portal openings expose actual folded doors, floors, joists and occupied room layers in full, true hero and low3q views.',
 'Four new front-gallery supports meet receivers queried from the held actual roof triangles; the uncovered fifth requested support is skipped.',
 'Profile-fitted closed capital/end skins, bounded metal/lacquer response and restored mature thin-leaf callback improve the material hierarchy. The near finial restores the useful171 exact gold finish after native trials exposed a pale regression.',
 'Original171 full grandMass171/roof receiver arrays, peony source/mount info, sky controls, camera, garden/RNG, bridge/site/foreground/right-hall/pagoda geometry are retained by exact source blocks and native info comparisons.'
];
const limitations=[
 'Roof/corner silhouette and broad bracket profiles remain less precise and less sculpturally specific than the supplied photograph.',
 'The stone-lantern/finial profile and erosion, garden leaf morphology/scale and photographic warm indirect-light transport remain visibly different.',
 'The actual fitted metal skins are plain compared with the photograph carving; no exact historical or source motif match is claimed.',
 'Hidden rooms and carpentry are single-view construction inferences; no claim of surveyed dimensions, complete film or photographic acceptance.'
];
const ledger={revision,sourceHash:pin.hash,sourceInputs:Object.keys(pin.files).length,baselineSource:rounds[0].sourceHash,status:'Actual native checkpoint held for parent review; photographic fidelity unaccepted',visualAccepted:false,reference:'references/hd/7-照片-8.jpg',reviewPage:'lookdev/scene08-spatial191/review.html',nativeImages:images,sourceRounds:rounds,findings,limitations,protectedProof:'lookdev/scene08-spatial191/protected-native-proof-r06.json',closedPrimitiveAudit:'lookdev/scene08-spatial191/primitive-audit-r04.json',externalAssetsAdded:false,newScanInstances:0,referenceRGBUsedInScene:false,renderQueue:'Official tools/render-one-reconstruction.mjs shared FIFO only',newFilm:false,newBlenderOrPhysicalExport:false};
await writeFile(new URL('review191-r06.json',dir),JSON.stringify(ledger,null,2)+'\n');
const image=(caption,path)=>`<figure><figcaption>${caption}</figcaption><a href="../../${path}"><img loading="lazy" src="../../${path}"></a></figure>`;
const base='qa/ten-reference/08/iteration-scene08-mass171-r06',held=`qa/ten-reference/08/iteration-${revision}`;
const html=`<!doctype html><meta charset="utf-8"><title>Scene08 spatial191 R06 — actual source review</title>
<style>body{margin:24px;background:#181818;color:#eee;font:16px/1.5 system-ui}h1{font-size:24px}p{max-width:1100px}a{color:#f0c780}section{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin:24px 0}section.pair{grid-template-columns:repeat(2,minmax(0,1fr))}figure{margin:0}figcaption{margin:0 0 9px}img{width:100%;height:auto;display:block}code{overflow-wrap:anywhere}li{margin:5px 0}@media(max-width:850px){section,section.pair{grid-template-columns:1fr}}</style>
<h1>Scene08 spatial191 R06</h1>
<p>Actual3D checkpoint. Photographic acceptance remains false. Source <code>${pin.hash}</code>,${Object.keys(pin.files).length} inputs. The supplied photograph and genuine native images below have no repainting, added grading or replacement imagery.</p>
<p>Six real portal throats, continuous room carpentry, four actual-roof-queried gallery supports, profile-fitted cast end skins and bounded metal/lacquer/leaf response. The camera, original171 frame/roof receivers, real peony mounts, right hall, bridge, near anchors and garden placement remain held. One native court reflection probe serves selected entry metal; the finial and exposed tower keep the outdoor environment.</p>
<section>${image('Supplied HD reference08','references/hd/7-照片-8.jpg')}${image('Held171 R06 — native1254',base+'/reference.png')}${image('Spatial191 R06 — native1254',held+'/reference.png')}</section>
<section class="pair">${image('Held171 R06 — true native hall detail',base+'/detail-native.png')}${image('Spatial191 R06 — true native hall detail',held+'/detail-native.png')}</section>
<section class="pair">${image('Held171 R06 — native low three-quarter',base+'-low-oblique/inspection-view.png')}${image('Spatial191 R06 — same native low three-quarter pose',held+'-low3q/inspection-view.png')}</section>
<p>The full and hero retain the physical reference camera. The hero is an independent1254 render of the730-source-pixel camera subfrustum at [180,110]. The low structural pose is [1.6,2.2,5.6] looking at [-3,8.2,-8], FOV51.</p>
<p>${limitations.join(' ')}</p>
<ul><li><a href="r06-source-identity.json">Final source identity</a> · <a href="r06-source-scripts.tgz">exact source scripts</a> · <a href="protected-native-proof-r06.json">protected source/native proof</a></li>
<li><a href="primitive-audit-r04.json">closed primitive CPU audit</a> · <a href="../../reconstructions/scene-08/assets/spatial191-provenance.json">construction/provenance</a> · <a href="../../reconstructions/scene-07/assets/floral157/ATTRIBUTION.md">retained real peony attribution</a></li>
<li>Preserved intermediate findings: ${['r01','r02','r03','r04','r05'].map(n=>`<a href="rejected-${n}.json">${n.toUpperCase()}</a>`).join(' · ')}. Every round retains exact scripts, identities and actual native full/detail/low images.</li><li><a href="review191-r06.json">Review ledger and limitations</a></li></ul>`;
await writeFile(new URL('review.html',dir),html+'\n');
await writeFile(new URL('reconstructions/scene-08/README.md',root),`# Scene08 — occupied courtyard spatial191 R06

This is an unaccepted actual 3D checkpoint of reference08, built on held mass171 R06. The camera remains position [0,1.78,13], target [0,6.10,-9], FOV49. Reference pixels are comparison inputs only. Final source identity: ${pin.hash} (${Object.keys(pin.files).length} inputs).

Six grand-hall/gallery bays now contain actual open portal throats, full jamb returns, folded framed leaves, thresholds, floorboards and overhead joists. Continuous inner room members replace disconnected partition pods. Four added upper-gallery front posts query the held roof triangles for receiver heights; the fifth requested position is outside coverage and is skipped. Original broad171 shafts, crossed frame, roof contours, sixteen receiver arrays, peony mounts and corrected rotated right hall are retained.

Closed flared capital cladding and cast end skins fit the existing carried arm profiles. Ordinary non-emissive bounded PBR metal, modest dielectric lacquer and the restored cloned thin-leaf callback provide a clearer finish hierarchy. A128-pixel native cube probe captures the modeled court for selected entry metal only; the near finial restores its exact171 gold finish and outdoor response after native comparison exposed a pale trial. Main/tower sky, direct lighting and exposure remain held. The probe runs inside the official FIFO job, with no photograph, painted environment or stored raster bake.

Bridge, stairs, terrain, stream, near gate/column/rail geometry and garden placement/RNG are unchanged. Existing four complete peony instances retain the actual CC BY4.0 Diana Liu / Thunk3D source, original triangles/normals, explicit dependencies and attribution. No new scans or scan counts were added. Existing independent Poly Haven foliage, stone, timber and measured sky retain their CC0 provenance.

Actual1254 full, true hall detail and low three-quarter renders for R01–R06, including intermediate failures, remain in qa/ten-reference/08/iteration-scene08-spatial191-*. Exact source identities, scripts, protected checks, primitive closure audit and review.html live in lookdev/scene08-spatial191/. All actual images use tools/render-one-reconstruction.mjs and the shared GPU FIFO. Primitive audits use plain CPU JavaScript only.

Photographic acceptance remains false. ${limitations.join(' ')} Native validity is not photographic acceptance. No new film or physical export is claimed.
`);
await writeFile(new URL('HANDOFF.txt',dir),`Scene08 spatial191 R06\nSource ${pin.hash}\n${Object.keys(pin.files).length} inputs; no Git mutation, no other scene/shared edits.\nReview: lookdev/scene08-spatial191/review.html\nNative full/hero: ${held}/\nNative low3q: ${held}-low3q/\nProtected source/native proof: lookdev/scene08-spatial191/protected-native-proof-r06.json\nAll final native1254 frames inspected by worker; parent photographic review pending. Visual acceptance false.\n\n${findings.join('\n')}\n\n${limitations.join('\n')}\n`);
console.log(JSON.stringify({source:pin.hash,frames:images.length,rounds:rounds.length,visualAccepted:false,review:'lookdev/scene08-spatial191/review.html'}));
