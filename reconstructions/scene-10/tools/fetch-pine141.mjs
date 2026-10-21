import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';

// Exact public Poly Haven 1K model payload, verified against its public API.
// This downloads botanical geometry/PBR surfaces, never a replacement scene.
const out=resolve('reconstructions/scene-10/assets/pine-sapling-cc0-141');
const fileList=[
 ['pine_sapling_small_1k.gltf','Models/gltf/1k/pine_sapling_small/pine_sapling_small_1k.gltf',11442,'237a7672645631550ae571743aa9f55b'],
 ['pine_sapling_small.bin','Models/gltf/8k/pine_sapling_small/pine_sapling_small.bin',17771796,'76dd1802d8de128c812f2e124a258b35'],
 ['textures/pine_sapling_small_twig_arm_1k.jpg','Models/jpg/1k/pine_sapling_small/pine_sapling_small_twig_arm_1k.jpg',394056,'b5062030fc42ec7bd12eb3f052054104'],
 ['textures/pine_sapling_small_twig_diff_1k.jpg','Models/jpg/1k/pine_sapling_small/pine_sapling_small_twig_diff_1k.jpg',477942,'dacc918bb421968e9ccc1956d78a2dbe'],
 ['textures/pine_sapling_small_bark_nor_gl_1k.jpg','Models/jpg/1k/pine_sapling_small/pine_sapling_small_bark_nor_gl_1k.jpg',1016849,'bb6e3a6eea777d992cef48fabfdc538c'],
 ['textures/pine_sapling_small_bark_diff_1k.jpg','Models/jpg/1k/pine_sapling_small/pine_sapling_small_bark_diff_1k.jpg',725265,'7d3a558ed614c7e75594c7be3bf80311'],
 ['textures/pine_sapling_small_bark_arm_1k.jpg','Models/jpg/1k/pine_sapling_small/pine_sapling_small_bark_arm_1k.jpg',801278,'21d1abd15e40951825a4f3da110b20ea'],
 ['textures/pine_sapling_small_twig_nor_gl_1k.jpg','Models/jpg/1k/pine_sapling_small/pine_sapling_small_twig_nor_gl_1k.jpg',692711,'eebc5a81f8f6231d8e18ec4ad7292798']
];
const hash=(b,algorithm='sha256')=>createHash(algorithm).update(b).digest('hex');
const files=[];
for(const [name,path,bytes,md5]of fileList){
 const filename=resolve(out,name),url='https://dl.polyhaven.org/file/ph-assets/'+path;await mkdir(dirname(filename),{recursive:true});
 let data;try{data=await readFile(filename);}catch(e){if(e.code!=='ENOENT')throw e;}
 if(!data||data.length!==bytes||hash(data,'md5')!==md5){
  const response=await fetch(url,{headers:{'User-Agent':'TempleCinemaLookdev/1.0 (+https://github.com/aa339519589-cpu/komorebi-temple-cinema)'},signal:AbortSignal.timeout(120000)});
  if(!response.ok)throw Error('Asset download failed '+response.status+' '+name);data=Buffer.from(await response.arrayBuffer());
  if(data.length!==bytes||hash(data,'md5')!==md5)throw Error('Asset checksum mismatch '+name);await writeFile(filename,data);
 }
 files.push({name,url,bytes,md5,sha256:hash(data)});console.log(JSON.stringify({name,bytes,verified:true}));
}
await writeFile(resolve(out,'provenance.json'),JSON.stringify({
 asset:'Pine Sapling Small',provider:'Poly Haven',source:'https://polyhaven.com/a/pine_sapling_small',
 authors:{'Rico Cilliers':'Modeling','Rob Tuytel':'Photography'},license:'CC0-1.0',licenseSource:'https://polyhaven.com/license',
 apiSource:'https://api.polyhaven.com/files/pine_sapling_small',retrieved:'2026-10-21',files,
 use:'Rigid true 3D branch/needle crown variants and PBR surfaces are uniformly scaled on authored mature stems, supported lateral forks and rooted understory placements on 3D terrain; no photographed backdrop/depth projection.',
 limitations:['Sapling geometry is a botanical approximation for the distant grove, not a measured recovery of mature species in the reference.','Inferred placements and uniform scene scale do not claim real tree dimensions.'],visualAccepted:false,constructionScript:'reconstructions/scene-10/src/licensed-pine141.js and src/main.js'
},null,2)+'\n');
