import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname),out=resolve(root,'assets/polyhaven/lacquered-cherry-wood');
await mkdir(out,{recursive:true});
const files=[
 {name:'diffuse-2k.jpg',channel:'baseColor',url:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/lacquered_cherry_wood/lacquered_cherry_wood_diff_2k.jpg',md5:'abffe0901084d6e0ef2455331e08cce7',bytes:2694321},
 {name:'normal-gl-2k.png',channel:'normalOpenGL',url:'https://dl.polyhaven.org/file/ph-assets/Textures/png/2k/lacquered_cherry_wood/lacquered_cherry_wood_nor_gl_2k.png',md5:'4b435d3ed2487352625f4f1c7cd0c792',bytes:20562079},
 {name:'roughness-2k.jpg',channel:'roughness',url:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/lacquered_cherry_wood/lacquered_cherry_wood_rough_2k.jpg',md5:'ed7d642b352a52dfdde4e60434118a27',bytes:2589669}
];
const digest=(algo,b)=>createHash(algo).update(b).digest('hex');
for(const file of files){
 let bytes;try{bytes=await readFile(resolve(out,file.name));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(!bytes||digest('md5',bytes)!==file.md5){
  const response=await fetch(file.url,{headers:{'User-Agent':'TempleCinemaLookdev/1.0 (+https://github.com/aa339519589-cpu/komorebi-temple-cinema)'},signal:AbortSignal.timeout(120000)});
  if(!response.ok)throw Error('Material download failed '+response.status+' '+file.name);
  bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length!==file.bytes||digest('md5',bytes)!==file.md5)throw Error('Material checksum mismatch '+file.name);
  await writeFile(resolve(out,file.name),bytes);
 }
 file.sha256=digest('sha256',bytes);console.log(JSON.stringify({file:file.name,bytes:bytes.length,verified:true}));
}
await writeFile(resolve(out,'provenance.json'),JSON.stringify({
 title:'Lacquered Cherry Wood',provider:'Poly Haven',source:'https://polyhaven.com/a/lacquered_cherry_wood',
 authors:{'Jenelle van Heerden':'Scanning','Rico Cilliers':'Processing'},
 license:'CC0-1.0',licenseSource:'https://polyhaven.com/license',
 licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',
 documentedPhysicalTileMetres:[1,1],files,
 use:'User-authorized scanned PBR surface detail on actual modeled timber; not a reference-photo or replacement-frame asset.'
},null,2));
