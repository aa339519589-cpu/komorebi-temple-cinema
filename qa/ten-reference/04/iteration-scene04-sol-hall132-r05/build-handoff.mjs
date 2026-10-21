// QA packaging only. Runtime source and native receipts are never rewritten.
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {dirname, resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {reconstructionSourceIdentity} from '../../../../tools/reconstruction-source-identity.mjs';

const out=dirname(fileURLToPath(import.meta.url)),root=resolve(out,'../../../..');
const expected='45f00b80a7ea83fd1870b699ba74fe381f537600ed085284d5b458b5e6b93275';
const rel=p=>relative(root,p),json=async p=>JSON.parse(await readFile(p,'utf8'));
const digest=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const source=await reconstructionSourceIdentity(root,'04');
if(source.hash!==expected)throw Error('Held Scene04 source changed; do not label the new source as this checkpoint.');
const lanes=[
 ['full-and-portal-roof-detail',out],
 ['oblique',resolve(out,'../iteration-scene04-sol-hall132-r05-oblique')],
 ['three-native-film-poses',resolve(out,'../iteration-scene04-sol-hall132-r05-poses')]
];
const captures=[];
for(const [kind,folder] of lanes){
 const reportPath=resolve(folder,'report.json'),r=await json(reportPath);
 if(r.status!=='rendered-review'||r.source.hash!==expected||r.errors.length||!r.frames.every(f=>f.valid&&f.pngSaved&&f.width===1254&&f.height===1254))throw Error('Incomplete or different-source native capture: '+reportPath);
 const frames=[];
 for(const f of r.frames){const p=resolve(folder,f.name+'.png');frames.push({file:rel(p),width:f.width,height:f.height,sha256:await digest(p),rgbaSha256:f.rgbaSha256,localTime:f.localTime,detailCrop:f.detailCrop,pose:f.pose});}
 captures.push({kind,report:rel(reportPath),reportSha256:await digest(reportPath),sourceHash:r.source.hash,renderSampling:r.renderSampling,inspectionView:r.inspectionView??null,detailCrop:r.detailCrop??null,frames});
}
await writeFile(resolve(out,'retained-source.json'),JSON.stringify(source,null,2)+'\n');
const scripts=Object.keys(source.files).filter(p=>p.startsWith('reconstructions/scene-04/')&&/\.(js|mjs|html|json)$/.test(p)).sort();
await writeFile(resolve(out,'retained-source-script-list.txt'),scripts.join('\n')+'\n');
const archive=resolve(out,'source-scripts-and-provenance.tar.gz');
execFileSync('tar',['-czf',archive,'-C',root,...scripts]);
const photo=resolve(root,'references/hd/3-照片-4.jpg'),full=resolve(out,'reference.png'),detail=resolve(out,'detail-native.png');
const baseline=resolve(root,'qa/ten-reference/04/iteration-scene04-sol-model131-r05/reference.png');
const composites=[
 ['comparison-left-reference-right-native.png',[photo,full],'[0:v][1:v]hstack=inputs=2'],
 ['comparison-roof-left-reference-right-native.png',[photo,detail],'[0:v]crop=710:710:275:120,scale=1254:1254:flags=lanczos[p];[p][1:v]hstack=inputs=2'],
 ['comparison-hall-before-after.png',[baseline,full],'[0:v]crop=850:470:200:100[b];[1:v]crop=850:470:200:100[a];[b][a]hstack=inputs=2']
];
const comparisonFiles=[];
for(const [name,inputs,filter] of composites){const dest=resolve(out,name);execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error',...inputs.flatMap(p=>['-i',p]),'-filter_complex',filter,'-frames:v','1',dest]);comparisonFiles.push({file:rel(dest),sha256:await digest(dest),scope:'CPU comparison composite only; never a rendered scene asset.'});}
const architecture=(await json(resolve(out,'report.json'))).frames[0].info.architecture;
const manifest={
 revision:'scene04-sol-hall132-r05',status:'held-unaccepted-native-geometry-checkpoint',visualAccepted:false,sourceHash:expected,
 reference:{file:'references/hd/3-照片-4.jpg',sha256:await digest(photo),usage:'Comparison and approximate manually observed numeric contours only; no photograph RGB/depth/scene plate enters the render.'},
 sourceManifest:{file:rel(resolve(out,'retained-source.json')),sha256:await digest(resolve(out,'retained-source.json')),scope:'All runtime source and declared asset hashes, including frozen shared dependencies.'},
 sourceArchive:{file:rel(archive),sha256:await digest(archive),files:scripts,scope:'Editable Scene04 namespace scripts/HTML and asset provenance/dependency JSON. Bitmap/mesh dependencies remain at their exact hashed repository paths in retained-source.json.'},
 captures,comparisonFiles,
 baseline:{folder:'qa/ten-reference/04/iteration-scene04-sol-model131-r05',sourceHash:'a54f64c748ae854462e55429449a78611f7c8feb45f95f02f94dbd3636e61668'},
 implementation:[
  'A shared nonlinear four-face roof profile holds a narrow steep neck before the late sweeping wing flare. The weather deck, metric tile courses, rafters and purlins follow it.',
  'An eight-station Hermite karahafu profile drives the porch roof, deeper curved trimmers, bargeboard, vault, carving and support sockets.',
  'Six turned entasis front columns, feet, window bays and attached carving use common bay axes and the same hall origin. The original 3.5m landing, stairs, toro, approach and camera/film path remain fixed.',
  'Added closed gable infill, ridge timber, king posts, cross ties, diagonal braces, seated rafters and real interlocking upper-eave bearings. Oblique iteration removed the unsupported-looking false clerestory grid.',
  'Main roof cover/pan tile lanes keep a 270mm width and start at the actual hip boundary, avoiding progressive squeezing into the shorter ridge. Ridge sculptures and roof return horns are closed geometry.',
  'R05 replaces the left ridge sculpture negative X scale with a rigid Y rotation, preserving outward winding. Main roof/body/porch dimensions are the reviewed R04 geometry.'
 ],
 preserved:{referenceCamera:[0,1.35,23.34],target:[0,2.3,0],fov:64.1754241,stairLandingY:3.5,stairPavingToroGeometry:true,filmPath:true,lightingAndMaterialsFromBaseline:true},
 architectureStats:architecture.stats??null,
 review:{
  fullAndDetail:'Visually inspected against the original whole photograph. The neck/wing silhouette and coupled porch/column assembly are a substantive geometry correction; the frame remains visibly stylized.',
  obliqueAndFilmPoses:'Actual final oblique and 0/3.5/7-second native poses must be visually reviewed before handoff; record that review in README.txt.',
  remainingGaps:[
   'Upper roof tiles have simplified seams and exposed warm deck marks; crest/oni/karahafu carving shapes remain approximations.',
   'Timber brackets, carved transoms, lattice bays and sanctuary are still generic compared with the dense photographed joinery.',
   'Native illumination, mineral/timber response, vegetation silhouettes and toro weathering remain much less photographic.',
   'All hidden dimensions and joints are authored single-view inferences. Nominal support projections and finite geometry do not prove photo fidelity or structural engineering validity.'
  ]
 },
 iterationHistory:{retained:'R01 failure and R01b/R02/R03/R04 actual native candidates and obliques remain in neighboring QA folders.',r01Failure:'An internal role wrapper omitted a return value for portalDepth; fixed before R01b. Failed receipt retained.'},
 physicalStudy:'Earlier Cycles vertex-state R05 remains immutable in lookdev/scene04-solmax-cycles-20261021 and uses the different old runtime source a54f64c. It is not evidence for this hall132 source.'
};
await writeFile(resolve(out,'final-review.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({sourceHash:expected,manifest:rel(resolve(out,'final-review.json')),captures:captures.map(c=>c.report),archive:rel(archive),archiveSha256:manifest.sourceArchive.sha256}));
