// Exact, root-reviewed CPU mesh authoring only. All graphics use the GPU FIFO.
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,open,unlink,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
const root=process.cwd(),recipe=process.argv[2];
const reviewed={
 'scene06-sculpture165-r01':{
  script:'reconstructions/scene-06/modeling/sculpture165/build.py',
  files:{
   'reconstructions/scene-06/modeling/sculpture165/build.py':'4b323f51b16397b7b1ddf79d2eff4654e5b54a743550b5b6cdf31e1aef62be32',
   'reconstructions/scene-06/modeling/sculpture165/geometry.py':'78a5cb8690534ead007accf6478d316440c6aa0ae6abced23a473827b2517db3'
  },
  receipt:'lookdev/scene06-sculpture165/r01-cpu-authoring-receipt.json',
  scope:'Root inspected complete scripts. Reachable Blender operators: empty startup, select/join, CPU voxel remesh/smooth/subdivision, CC BY GLB import. Only authored SC07 buffers and JSON/text are written. No render, scene export, viewport, UV bake or GPU compute.'
 },
 'scene06-sculpture165-r02':{
  script:'reconstructions/scene-06/modeling/sculpture165-r02/build.py',
  files:{
   'reconstructions/scene-06/modeling/sculpture165-r02/build.py':'59db66be60d565d33ff34045c35534590bfd61e644096b849355db4fe00d2577',
   'reconstructions/scene-06/modeling/sculpture165-r02/geometry.py':'f2dc8dd36421522538a79ff86623cb5320b06c132fae099c4c87148fcb897ee2'
  },
  receipt:'lookdev/scene06-sculpture165/r02-cpu-authoring-receipt.json',
  scope:'Root reviewed complete R01 sources and R02 differences: CPU facial tissue/sculpted closed incisions, cloak and feet construction, same CPU voxel/remesh/subdivision and local CC BY head import. Writes authored mesh buffers and text only. R01 knees retained pending independent CC0 donor. No render, scene export, viewport, UV bake or GPU compute.'
 }
};
reviewed['scene06-sculpture165-r02b']={...reviewed['scene06-sculpture165-r02'],
 files:{
  'reconstructions/scene-06/modeling/sculpture165-r02/build.py':'d6eadd4c661f21fca2adc9e48bd083fd2daa3abe4e75abdfaa008881a34e3c4e',
  'reconstructions/scene-06/modeling/sculpture165-r02/geometry.py':'f2dc8dd36421522538a79ff86623cb5320b06c132fae099c4c87148fcb897ee2'
 },receipt:'lookdev/scene06-sculpture165/r02b-cpu-authoring-receipt.json',
 scope:reviewed['scene06-sculpture165-r02'].scope+' Root reviewed the exact failed-R02 repair: fixed output identity r02b and renamed the facial crease material to avoid a numeric variable shadow. Operators and geometry algorithms unchanged.'};
reviewed['scene06-sculpture165-r03']={
 "script": "reconstructions/scene-06/modeling/sculpture165-r03/build.py",
 "files": {
  "reconstructions/scene-06/modeling/sculpture165-r03/build.py": "7a24aba9a981f7da210e4da42f05c023e243d4a311bf3aa957588a2b1b347e0b",
  "reconstructions/scene-06/modeling/sculpture165-r03/anatomy.py": "11992ae1a9cffbec2bfc967323af19d288e5462a28c9425721516fd5d062dea6",
  "reconstructions/scene-06/modeling/sculpture165/geometry.py": "78a5cb8690534ead007accf6478d316440c6aa0ae6abced23a473827b2517db3",
  "lookdev/statue-cc0-drapery169/r03/crossed-knees-hips-source-surface.sc07.bin": "9a25055d4ff1fce066c6d4341afbfc95e39900b40e084317181363ffc627a4c3",
  "lookdev/statue-cc0-drapery169/r03/torso-cloak-core-source-surface.sc07.bin": "362ece0f98baf4e7b47a5403b4b485d4cb7b209c46701fc87119eb6f1c8d649e",
  "lookdev/statue-cc0-drapery169/r03/crossed-knees-hips-mount-loops.json": "6ad3f4363bbebec7ab7f9e3e529a738551cac0d3d4cd120ed9e8baa7df00f6fc",
  "lookdev/statue-cc0-drapery169/r03/torso-cloak-core-mount-loops.json": "1c3aa2ea9b5f251b73081589689f60d579acd417b0dd4eaa0d0c1ff08aaa721c",
  "lookdev/statue-cc0-drapery169/r03/surface-anchors.json": "c54bd379a6369bf2ebd9252b4501fd9baf5072b371c351ecb1fa03b7d1b22c56",
  "lookdev/statue-cc0-drapery169/r03/native-manifest.json": "ca2ed43b9fbeec90c894ba8a99bd8ba1b8745183fc6b4094c425d5f0fd554de7",
  "lookdev/statue-cc0-drapery169/r03/manifest.json": "21028ca5a34c1453757e484b81b47e37f6f981ec26e3a9807b4f1da025d50807",
  "lookdev/statue-cc0-drapery169/r03/handoff-validation.json": "ad15bce469ecd1facf059f228b673b9ed6151d9e04244c238097c781a52d2542"
 },
 "receipt": "lookdev/scene06-sculpture165/r03-cpu-authoring-receipt.json",
 "scope": "Root read complete new integrated builder and anatomy module and reviewed reused hash-pinned CPU hand helper. CPU-only CC0 source mesh import, explicit local cloth mounts/bridges, newly authored closed anatomical head/ears and local authored unions. No native/physical render, scene export, viewport, image sampling, UV bake or GPU compute. Actual native/face/three-quarter review remains required; photographic fidelity unaccepted."
};
reviewed['scene06-sculpture165-r03b']={...reviewed['scene06-sculpture165-r03'],
 files:{...reviewed['scene06-sculpture165-r03'].files,
  'reconstructions/scene-06/modeling/sculpture165-r03/build.py':'118fbd06eae9619405f529fd0f210a4d644b91e6515cd97806100b5d4637eab9'},
 receipt:'lookdev/scene06-sculpture165/r03b-cpu-authoring-receipt.json',
 scope:reviewed['scene06-sculpture165-r03'].scope+' Root reviewed the exact cap API repair: accepts indexed or vector triangulation results, asserts valid source indices, and writes a distinct r03b output. All anatomy, donor input hashes and operations unchanged.'};
reviewed['scene06-sculpture165-r04']={
 "script": "reconstructions/scene-06/modeling/sculpture165-r04/build.py",
 "files": {
  "reconstructions/scene-06/modeling/sculpture165-r04/build.py": "e5dd61344d0563759d60ff931589e1234fca9942a26183d7bf8572ba9723fee3",
  "reconstructions/scene-06/modeling/sculpture165-r04/anatomy.py": "305c09f0d861e9ba8eca610b7feb910030111fc2e77cc0ce4a592e1b5ae77187",
  "reconstructions/scene-06/modeling/sculpture165/geometry.py": "78a5cb8690534ead007accf6478d316440c6aa0ae6abced23a473827b2517db3",
  "lookdev/statue-cc0-drapery169/r03/crossed-knees-hips-source-surface.sc07.bin": "9a25055d4ff1fce066c6d4341afbfc95e39900b40e084317181363ffc627a4c3",
  "lookdev/statue-cc0-drapery169/r03/torso-cloak-core-source-surface.sc07.bin": "362ece0f98baf4e7b47a5403b4b485d4cb7b209c46701fc87119eb6f1c8d649e",
  "lookdev/statue-cc0-drapery169/r03/crossed-knees-hips-mount-loops.json": "6ad3f4363bbebec7ab7f9e3e529a738551cac0d3d4cd120ed9e8baa7df00f6fc",
  "lookdev/statue-cc0-drapery169/r03/torso-cloak-core-mount-loops.json": "1c3aa2ea9b5f251b73081589689f60d579acd417b0dd4eaa0d0c1ff08aaa721c",
  "lookdev/statue-cc0-drapery169/r03/surface-anchors.json": "c54bd379a6369bf2ebd9252b4501fd9baf5072b371c351ecb1fa03b7d1b22c56",
  "lookdev/statue-cc0-drapery169/r03/native-manifest.json": "ca2ed43b9fbeec90c894ba8a99bd8ba1b8745183fc6b4094c425d5f0fd554de7",
  "lookdev/statue-cc0-drapery169/r03/manifest.json": "21028ca5a34c1453757e484b81b47e37f6f981ec26e3a9807b4f1da025d50807",
  "lookdev/statue-cc0-drapery169/r03/handoff-validation.json": "ad15bce469ecd1facf059f228b673b9ed6151d9e04244c238097c781a52d2542"
 },
 "receipt": "lookdev/scene06-sculpture165/r04-cpu-authoring-receipt.json",
 "scope": "Root reviewed complete prior source and exact R04 builder/anatomy differences: coincident-only seam welding, original source anchored connected orientation, exact boundary zipper bridges, local mounted shell and smoother authored nasal/pinna tissue. Same CPU-only mesh operations and original CC0 inputs; no render, scene export, viewport, image sampling, UV bake or GPU. All geometric/photographic acceptance remains pending real native review."
};
reviewed['scene06-sculpture165-r05']={
 "script": "reconstructions/scene-06/modeling/sculpture165-r05/build.py",
 "files": {
  "reconstructions/scene-06/modeling/sculpture165-r05/build.py": "03ca47100191556251a11af8a3813f832834938bd86ccdbad85a4c36482dac3e",
  "reconstructions/scene-06/modeling/sculpture165-r05/anatomy.py": "3b19e02e22bc5f49aff77c98ed50839fd83d8ce042f0b991d46955de1b455032",
  "reconstructions/scene-06/modeling/sculpture165/geometry.py": "78a5cb8690534ead007accf6478d316440c6aa0ae6abced23a473827b2517db3",
  "lookdev/statue-cc0-drapery169/r03/crossed-knees-hips-source-surface.sc07.bin": "9a25055d4ff1fce066c6d4341afbfc95e39900b40e084317181363ffc627a4c3",
  "lookdev/statue-cc0-drapery169/r03/torso-cloak-core-source-surface.sc07.bin": "362ece0f98baf4e7b47a5403b4b485d4cb7b209c46701fc87119eb6f1c8d649e",
  "lookdev/statue-cc0-drapery169/r03/crossed-knees-hips-mount-loops.json": "6ad3f4363bbebec7ab7f9e3e529a738551cac0d3d4cd120ed9e8baa7df00f6fc",
  "lookdev/statue-cc0-drapery169/r03/torso-cloak-core-mount-loops.json": "1c3aa2ea9b5f251b73081589689f60d579acd417b0dd4eaa0d0c1ff08aaa721c",
  "lookdev/statue-cc0-drapery169/r03/surface-anchors.json": "c54bd379a6369bf2ebd9252b4501fd9baf5072b371c351ecb1fa03b7d1b22c56",
  "lookdev/statue-cc0-drapery169/r03/native-manifest.json": "ca2ed43b9fbeec90c894ba8a99bd8ba1b8745183fc6b4094c425d5f0fd554de7",
  "lookdev/statue-cc0-drapery169/r03/manifest.json": "21028ca5a34c1453757e484b81b47e37f6f981ec26e3a9807b4f1da025d50807",
  "lookdev/statue-cc0-drapery169/r03/handoff-validation.json": "ad15bce469ecd1facf059f228b673b9ed6151d9e04244c238097c781a52d2542",
  "lookdev/statue-cc0-drapery169/r04-local-restoration/iteration-02/crossed-knees-hips-restored-surface.sc07.bin": "5e0831cf02b0be64b44450e537d0f1b1891c11a00629abf1d0bfd0abb535c9ce",
  "lookdev/statue-cc0-drapery169/r04-local-restoration/iteration-02/torso-cloak-core-restored-surface.sc07.bin": "c6253f7ce9084c3d0f689074846d547aa1ad99d1777970f1ce65cabc0a11d9d4",
  "lookdev/statue-cc0-drapery169/r04-local-restoration/iteration-02/restoration-validation.json": "0656ddc9f036be005aa3e9c341797cac0647a96a70f5f5e7f9e2e9dfddb98d96"
 },
 "receipt": "lookdev/scene06-sculpture165/r05-cpu-authoring-receipt.json",
 "scope": "Root reviewed exact R05 body/underside/waist changes, bounded restored-donor inputs and anatomy helper. CPU-only source-topology-preserving cloth mount, rounded underside return, tiny waist closure, local authored unions and compact SC07 writes. No render, scene export, viewport, image sampling, UV bake or GPU. Provisional authored head is not a selected likeness; actual body/seat native review required."
};
reviewed['scene06-sculpture165-r06']={
 "script": "reconstructions/scene-06/modeling/sculpture165-r06/build.py",
 "files": {
  "reconstructions/scene-06/modeling/sculpture165-r06/build.py": "10a9b08e3ee616204b7c1cf28ef27d8d233157e5f33eb65472cd039794c98c39",
  "reconstructions/scene-06/modeling/sculpture165-r06/anatomy.py": "f550f1695cf3c91d734486796d58b80d4b3aa2513ab97d990ac4b0738767842a",
  "reconstructions/scene-06/modeling/sculpture165/geometry.py": "78a5cb8690534ead007accf6478d316440c6aa0ae6abced23a473827b2517db3",
  "lookdev/statue-cc0-drapery169/r03/crossed-knees-hips-source-surface.sc07.bin": "9a25055d4ff1fce066c6d4341afbfc95e39900b40e084317181363ffc627a4c3",
  "lookdev/statue-cc0-drapery169/r03/torso-cloak-core-source-surface.sc07.bin": "362ece0f98baf4e7b47a5403b4b485d4cb7b209c46701fc87119eb6f1c8d649e",
  "lookdev/statue-cc0-drapery169/r03/crossed-knees-hips-mount-loops.json": "6ad3f4363bbebec7ab7f9e3e529a738551cac0d3d4cd120ed9e8baa7df00f6fc",
  "lookdev/statue-cc0-drapery169/r03/torso-cloak-core-mount-loops.json": "1c3aa2ea9b5f251b73081589689f60d579acd417b0dd4eaa0d0c1ff08aaa721c",
  "lookdev/statue-cc0-drapery169/r03/surface-anchors.json": "c54bd379a6369bf2ebd9252b4501fd9baf5072b371c351ecb1fa03b7d1b22c56",
  "lookdev/statue-cc0-drapery169/r03/native-manifest.json": "ca2ed43b9fbeec90c894ba8a99bd8ba1b8745183fc6b4094c425d5f0fd554de7",
  "lookdev/statue-cc0-drapery169/r03/manifest.json": "21028ca5a34c1453757e484b81b47e37f6f981ec26e3a9807b4f1da025d50807",
  "lookdev/statue-cc0-drapery169/r03/handoff-validation.json": "ad15bce469ecd1facf059f228b673b9ed6151d9e04244c238097c781a52d2542",
  "lookdev/statue-cc0-drapery169/r04-local-restoration/iteration-02/crossed-knees-hips-restored-surface.sc07.bin": "5e0831cf02b0be64b44450e537d0f1b1891c11a00629abf1d0bfd0abb535c9ce",
  "lookdev/statue-cc0-drapery169/r04-local-restoration/iteration-02/torso-cloak-core-restored-surface.sc07.bin": "c6253f7ce9084c3d0f689074846d547aa1ad99d1777970f1ce65cabc0a11d9d4",
  "lookdev/statue-cc0-drapery169/r04-local-restoration/iteration-02/restoration-validation.json": "0656ddc9f036be005aa3e9c341797cac0647a96a70f5f5e7f9e2e9dfddb98d96",
  "lookdev/calm-buddha-head173/component-r01/actual-face-ears-neck-sc07.bin": "ac34f7640878f9faf3df627eb224ac762a9a5e75ce52ea25f4e70344d636eee8",
  "lookdev/calm-buddha-head173/component-r01/measured-rings.json": "f9ad3cd57d6ef3daaa5d9daa44e018d6560fe5c803478d5737021b25e56b4b4a",
  "lookdev/calm-buddha-head173/component-r01/manifest.json": "c37a3a8b207cf42b0c9cf4f16800a88d1871c3a2404569bbdac3d0977437a859",
  "lookdev/calm-buddha-head173/component-r01/source-vertex-barycentric-trace.bin": "4f015fabdcb086d69e34eace47184ccd76d4ffe9082b5d71cef2ceaafeeceaa5",
  "lookdev/calm-buddha-head173/component-r01/source-triangle-trace.bin": "9514f9531cc1de3ccb23cc01fe8b481714a672f4ad81ccd347ea0e32b4283e06",
  "lookdev/calm-buddha-head173/LICENSE-ATTRIBUTION.txt": "a158e56f903c45f23f12daab882950284a3863dbde70d9bd2b49a027521ada85",
  "lookdev/calm-buddha-head173/sources/fb17c123ad9c4c0fb6baf723b3fffd79/provenance.json": "b93cf1a2a33d86ddeeb53682770d36decf21e6b907111a720f2042bdab7d1ac6",
  "lookdev/calm-buddha-head173/sources/fb17c123ad9c4c0fb6baf723b3fffd79/creator-primary-metadata.json": "b2dc138b701708325d14bbb0118d588933599f08121512356d5e170a6c257cb2"
 },
 "receipt": "lookdev/scene06-sculpture165/r06-cpu-authoring-receipt.json",
 "scope": "Root reviewed exact R06 builder differences and complete ring/under-leg/scalp helper. CPU-only actual CC BY source head under uniform fit with original source normals/triangles, CC0 bounded-restored cloth and local mounts. No face projection/remesh, render, scene export, viewport, image sampling, UV bake or GPU compute. Native likeness/fit remains unaccepted until actual full/hero/profile review."
};
reviewed['scene06-sculpture165-r07']={
 "script": "reconstructions/scene-06/modeling/sculpture165-r07/build.py",
 "files": {
  "reconstructions/scene-06/modeling/sculpture165-r07/build.py": "a4aefdc3deb8e70c2850806d2b591726544c712c976bfe6fa0e48ec0a3b1bc1d",
  "reconstructions/scene-06/modeling/sculpture165-r07/anatomy.py": "f550f1695cf3c91d734486796d58b80d4b3aa2513ab97d990ac4b0738767842a",
  "reconstructions/scene-06/modeling/sculpture165/geometry.py": "78a5cb8690534ead007accf6478d316440c6aa0ae6abced23a473827b2517db3",
  "lookdev/statue-cc0-drapery169/r03/crossed-knees-hips-source-surface.sc07.bin": "9a25055d4ff1fce066c6d4341afbfc95e39900b40e084317181363ffc627a4c3",
  "lookdev/statue-cc0-drapery169/r03/torso-cloak-core-source-surface.sc07.bin": "362ece0f98baf4e7b47a5403b4b485d4cb7b209c46701fc87119eb6f1c8d649e",
  "lookdev/statue-cc0-drapery169/r03/crossed-knees-hips-mount-loops.json": "6ad3f4363bbebec7ab7f9e3e529a738551cac0d3d4cd120ed9e8baa7df00f6fc",
  "lookdev/statue-cc0-drapery169/r03/torso-cloak-core-mount-loops.json": "1c3aa2ea9b5f251b73081589689f60d579acd417b0dd4eaa0d0c1ff08aaa721c",
  "lookdev/statue-cc0-drapery169/r03/surface-anchors.json": "c54bd379a6369bf2ebd9252b4501fd9baf5072b371c351ecb1fa03b7d1b22c56",
  "lookdev/statue-cc0-drapery169/r03/native-manifest.json": "ca2ed43b9fbeec90c894ba8a99bd8ba1b8745183fc6b4094c425d5f0fd554de7",
  "lookdev/statue-cc0-drapery169/r03/manifest.json": "21028ca5a34c1453757e484b81b47e37f6f981ec26e3a9807b4f1da025d50807",
  "lookdev/statue-cc0-drapery169/r03/handoff-validation.json": "ad15bce469ecd1facf059f228b673b9ed6151d9e04244c238097c781a52d2542",
  "lookdev/statue-cc0-drapery169/r04-local-restoration/iteration-02/crossed-knees-hips-restored-surface.sc07.bin": "5e0831cf02b0be64b44450e537d0f1b1891c11a00629abf1d0bfd0abb535c9ce",
  "lookdev/statue-cc0-drapery169/r04-local-restoration/iteration-02/torso-cloak-core-restored-surface.sc07.bin": "c6253f7ce9084c3d0f689074846d547aa1ad99d1777970f1ce65cabc0a11d9d4",
  "lookdev/statue-cc0-drapery169/r04-local-restoration/iteration-02/restoration-validation.json": "0656ddc9f036be005aa3e9c341797cac0647a96a70f5f5e7f9e2e9dfddb98d96",
  "lookdev/calm-buddha-head173/component-r01/actual-face-ears-neck-sc07.bin": "ac34f7640878f9faf3df627eb224ac762a9a5e75ce52ea25f4e70344d636eee8",
  "lookdev/calm-buddha-head173/component-r01/measured-rings.json": "f9ad3cd57d6ef3daaa5d9daa44e018d6560fe5c803478d5737021b25e56b4b4a",
  "lookdev/calm-buddha-head173/component-r01/manifest.json": "c37a3a8b207cf42b0c9cf4f16800a88d1871c3a2404569bbdac3d0977437a859",
  "lookdev/calm-buddha-head173/component-r01/source-vertex-barycentric-trace.bin": "4f015fabdcb086d69e34eace47184ccd76d4ffe9082b5d71cef2ceaafeeceaa5",
  "lookdev/calm-buddha-head173/component-r01/source-triangle-trace.bin": "9514f9531cc1de3ccb23cc01fe8b481714a672f4ad81ccd347ea0e32b4283e06",
  "lookdev/calm-buddha-head173/LICENSE-ATTRIBUTION.txt": "a158e56f903c45f23f12daab882950284a3863dbde70d9bd2b49a027521ada85",
  "lookdev/calm-buddha-head173/sources/fb17c123ad9c4c0fb6baf723b3fffd79/provenance.json": "b93cf1a2a33d86ddeeb53682770d36decf21e6b907111a720f2042bdab7d1ac6",
  "lookdev/calm-buddha-head173/sources/fb17c123ad9c4c0fb6baf723b3fffd79/creator-primary-metadata.json": "b2dc138b701708325d14bbb0118d588933599f08121512356d5e170a6c257cb2"
 },
 "receipt": "lookdev/scene06-sculpture165/r07-cpu-authoring-receipt.json",
 "scope": "Root reviewed exact measured neck-only repair against R06; complete unchanged helper remains pinned. CPU-only local cloth-neck trim, endpoint-tangent exact boundary strip, source-head positions/normals/fit unchanged. No render, scene export, image sampling, viewport, UV bake or GPU compute. Actual collar/seat/face review required; photographic fidelity unaccepted."
};
if(!Object.hasOwn(reviewed,recipe))throw Error('An exact root-reviewed CPU authoring recipe is required.');
const spec=reviewed[recipe],digest=b=>createHash('sha256').update(b).digest('hex');
async function verify(){for(const [name,expected]of Object.entries(spec.files))if(digest(await readFile(resolve(root,name)))!==expected)throw Error('Reviewed CPU source changed: '+name);}
await verify();
const path=resolve(root,spec.receipt);
try{await access(path);throw Error('Preserve the existing authoring receipt; use a newly reviewed recipe.');}catch(error){if(error.code!=='ENOENT')throw error;}
const lock=resolve(tmpdir(),'komorebi-reviewed-cpu-authoring.lock');
try{const file=await open(lock,'wx');await file.writeFile(JSON.stringify({pid:process.pid,recipe,startedAt:new Date().toISOString()}));await file.close();}
catch(error){if(error.code!=='EEXIST')throw error;throw Error('A reviewed CPU author is already active; do not overlap mesh builds.');}
const receipt={recipe,startedAt:new Date().toISOString(),status:'cpu-authoring-active',files:spec.files,threads:4,scope:spec.scope,gpuFifoAcquired:false,visualAccepted:false};
await mkdir(dirname(path),{recursive:true});
let child;
try{
 child=spawn('/Applications/Blender.app/Contents/MacOS/Blender',['-b','--factory-startup','--disable-autoexec','-t','4','--python-exit-code','1','--python',resolve(root,spec.script)],{cwd:root,stdio:'inherit',env:{...process.env,S165_REV:'r01'}});
 const stop=()=>child?.kill('SIGTERM');process.once('SIGINT',stop);process.once('SIGTERM',stop);
 receipt.childPid=child.pid;await writeFile(path,JSON.stringify(receipt,null,2)+'\n');
 const code=await new Promise((yes,no)=>{child.on('error',no);child.on('exit',(code,signal)=>yes(code??(signal?1:0)));});
 process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);await verify();
 receipt.exitCode=code;receipt.status=code===0?'cpu-authored-mesh-written-awaiting-native-review':'cpu-authoring-failed';if(code)process.exitCode=code;
}catch(error){receipt.status='cpu-authoring-failed';receipt.error=String(error.stack||error);process.exitCode=1;}
finally{receipt.completedAt=new Date().toISOString();await writeFile(path,JSON.stringify(receipt,null,2)+'\n');await unlink(lock);}
