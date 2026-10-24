// Deterministic CPU-only original-pixel crops. No resampling or image synthesis.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {resolve} from 'node:path';
import {encodeWebglPng} from '../../tools/encode-webgl-png.mjs';
const here=resolve('lookdev/scene01-rebuild219'),hash=b=>createHash('sha256').update(b).digest('hex');
function decode(png){
 if(!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Expected actual PNG');
 const chunks=[];let width,height,type,bit,interlace;
 for(let at=8;at<png.length;){const size=png.readUInt32BE(at),kind=png.toString('ascii',at+4,at+8),part=png.subarray(at+8,at+8+size);if(kind==='IHDR'){width=part.readUInt32BE(0);height=part.readUInt32BE(4);bit=part[8];type=part[9];interlace=part[12];}if(kind==='IDAT')chunks.push(part);at+=size+12;}
 if(bit!==8||![2,6].includes(type)||interlace!==0)throw Error('Only original noninterlaced RGB/RGBA8 is supported');
 const channels=type===2?3:4,stride=width*channels,raw=inflateSync(Buffer.concat(chunks)),pixels=Buffer.alloc(width*height*channels);if(raw.length!==height*(stride+1))throw Error('PNG pixel length differs');let at=0;
 const paeth=(a,b,c)=>{const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c;};
 for(let y=0;y<height;y++){const filter=raw[at++];if(filter>4)throw Error('Unsupported PNG row filter');for(let x=0;x<stride;x++){const a=x<channels?0:pixels[y*stride+x-channels],b=y===0?0:pixels[(y-1)*stride+x],c=y===0||x<channels?0:pixels[(y-1)*stride+x-channels];pixels[y*stride+x]=(raw[at++]+(filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c)))&255;}}
 return {width,height,channels,pixels};
}
const bounds={left:1040,top:560,width:214,height:570},results=[];
for(const iteration of ['r10','r11']){
 const directory=resolve(here,'physical-'+iteration),report=JSON.parse(await readFile(resolve(directory,'report.json'))),png=await readFile(report.renderFile);
 if(report.status!=='path-traced-review'||report.sourceHash!=='d2587c2f5426ba656dc4c0d385b6499a452fbf26ff7352b9e712adb82e449dbd'||hash(png)!==report.renderSha256)throw Error('Actual physical identity differs '+iteration);
 const source=decode(png);if(source.width!==1254||source.height!==1254)throw Error('Original1254 frame required');
 const rgba=Buffer.alloc(bounds.width*bounds.height*4);for(let y=0;y<bounds.height;y++)for(let x=0;x<bounds.width;x++){const from=((bounds.top+y)*source.width+bounds.left+x)*source.channels,to=((bounds.height-1-y)*bounds.width+x)*4;for(let c=0;c<3;c++)rgba[to+c]=source.pixels[from+c];rgba[to+3]=255;}
 const sourceColorChunks=[];for(let at=8;at<png.length;){const size=png.readUInt32BE(at),kind=png.toString('ascii',at+4,at+8);if(['sRGB','gAMA','cHRM','iCCP'].includes(kind))sourceColorChunks.push(png.subarray(at,at+size+12));at+=size+12;}
 const basic=encodeWebglPng(bounds.width,bounds.height,rgba),encoded=Buffer.concat([basic.subarray(0,33),...sourceColorChunks,basic.subarray(33)]),output=resolve(directory,'stone-lantern219-'+iteration+'-native-crop.png');await writeFile(output,encoded,{flag:'wx'});
 const checked=decode(await readFile(output));for(let y=0;y<bounds.height;y++)for(let x=0;x<bounds.width;x++)for(let c=0;c<3;c++)if(checked.pixels[(y*bounds.width+x)*checked.channels+c]!==source.pixels[((bounds.top+y)*source.width+bounds.left+x)*source.channels+c])throw Error('Crop pixel does not equal actual full frame');
 results.push({iteration,sourceFullPNG:report.renderFile,sourceFullSha256:report.renderSha256,output,sha256:hash(encoded),bytes:encoded.length,bounds,noResampling:true,scale:1,allCroppedRGBBytesEqualOriginalPixels:true,originalColorMetadataChunksPreserved:true});
}
const receipt={status:'actual-physical-original-pixel-crops-verified',createdAt:new Date().toISOString(),cropScriptSha256:hash(await readFile(new URL(import.meta.url))),scope:'Root-authorized CPU original-pixel crop only. No new camera, GPU job, interpolation, sharpening, generated detail or full-frame edits.',results};await writeFile(resolve(here,'physical-r11-original-crops.json'),JSON.stringify(receipt,null,2),{flag:'wx'});console.log(JSON.stringify(receipt));
