import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const rev=process.argv[2];
if(!/^r\d\d[a-z]?$/.test(rev??''))throw Error('Explicit retained revision required');
const root=process.cwd(),src=resolve(root,'lookdev/scene06-sculpture165',rev,'sc07');
const target=resolve(root,'reconstructions/scene-06/assets','sculpture165-'+rev);
const manifest=JSON.parse(await readFile(resolve(src,'manifest.json'),'utf8'));
const build=JSON.parse(await readFile(resolve(src,'..','build-report.json'),'utf8'));
const measuredCloth=manifest.sourceLicense?.includes('CC0-1.0');
const measuredHead=Boolean(manifest.actualHeadPreservation);
if(manifest.revision!=='scene06-sculpture165-'+rev)throw Error('Candidate identity mismatch');
if(build.revision!==manifest.revision)throw Error('Build report identity mismatch');
await mkdir(target,{recursive:true});
for(const part of manifest.variants.central){
 const bytes=await readFile(resolve(src,part.file));
 if(createHash('sha256').update(bytes).digest('hex')!==part.sha256)throw Error('Binary identity mismatch '+part.file);
 await copyFile(resolve(src,part.file),resolve(target,part.file));
}
const runtime={...manifest};delete runtime.lotusOnly;delete runtime.assemblyBounds;delete runtime.faceCore;
runtime.canonicalPackageScope='Body-only SC07. Existing independently authored lotus and altar retained; actual full/head-core study files remain in lookdev.';
await writeFile(resolve(target,'manifest.json'),JSON.stringify(runtime,null,2));
await writeFile(resolve(target,'provenance.json'),JSON.stringify({
 status:'actual-3D-candidate-awaiting-native-review',visualAccepted:false,
 heldIncomingSourceHash:'a13508d8bd925ad42347e677676d5b3878436bab1fd878d8b8925f02df4383d4',
 builder:build.reproducer,
 geometry:build.reproducer.replace(/build\.py$/,build.helperFiles?.['anatomy.py']?'anatomy.py':'geometry.py'),
 builderSha256:build.builderSha256,geometrySha256:build.geometrySha256,
 additionalHelperHashes:build.helperFiles??null,
 exactBuildSource:'lookdev/scene06-sculpture165/'+rev,
 sourceAttribution:manifest.sourceAttribution,sourceLicense:manifest.sourceLicense,
 sourceURL:manifest.sourceURL,sourceLimit:manifest.sourceLimit,sourceRetarget:manifest.sourceRetarget,
 additionalSourceAttributions:manifest.additionalSourceAttributions??[],
 actualHeadPreservation:manifest.actualHeadPreservation??null,headUniformFit:manifest.headUniformFit??null,
 authoredChanges:rev==='r01'?['Closed broad variable-section thigh/knee/shin masses replace inflated returning leg tubes.','Unequal broad robe turns, short tributary creases and a gathered side stole displace the continuous torso skin.','Long sleeve load paths gather at the elbow; wider cast cloth planes replace repeating narrow ribs.','Connected raised loop hands, actual joined throat and fine cap curls retained.']:measuredCloth?['Genuine CC0 DanielPett Tang knee/hip and torso cloth surfaces provide weighted anatomy and unequal original folds, under an explicitly recorded affine fit.',manifest.sourceRetarget.method,measuredHead?'Actual peel-3d.com CC BY face/ears/jaw/neck receive only a declared uniform fit, with original face triangles and normals retained. Measured crown/neck cuts join authored scalp/neck closure.':'Main head/ears are fully authored3D anatomical volumes, with intrinsic downcast eyelids/lip cleft and nasal tissue; no projected donor face or separate incision floors.','Authored arm/hand geometry receives its own local CPU union; no such modifier touches measured cloth.','Source stone erosion and ragged hem remain for bounded local native gold review.','Source preservation, orientation checks and successful mesh creation do not establish likeness.']:['R01 knees retained explicitly unresolved, pending separately licensed genuine cloth donor.','Dense frontal head tissue is newly sculpted with downcast lids, malar/chin planes, long bridge/alar volumes and quiet closed lips.','Closed incised bronze eye/lip floor solids follow the curved face; actual native profile review is required to exclude floating.','Closed thick shoulder-to-knee cloak and flared covered elbows provide actual side thickness.','Curved ankle/heel/arch/ball feet replace the R01 flat stacked instep bars.','Material roughness cloth.48/face.42/hand.40; PBR response still requires native visual comparison.'],
 noNoncommercialGeometry:true,noPhotoOrGeneratedFrame:true,
 limits:[measuredCloth?(measuredHead?'CC0 Tang cloth and CC BY head are different artifacts. Head culture/period is undocumented; no verified Japanese/Amida attribution.':'CC0 Tang cloth is a different Chinese artifact; main head is newly authored and still requires anatomical/likeness review.'):'CC BY donor is a different sculpture; facial identity still differs.','Topology and valid rendering do not establish photographic fidelity.']
},null,2));
console.log(JSON.stringify({revision:runtime.revision,target,files:runtime.variants.central.map(p=>p.file),visualAccepted:false}));
