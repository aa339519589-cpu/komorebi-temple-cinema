import {deflateSync,inflateSync} from 'node:zlib';
import assert from 'node:assert/strict';
const table=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0});
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function chunk(type,data){const name=Buffer.from(type,'ascii'),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));return Buffer.concat([len,name,data,crc])}
export function encodeWebglPng(width,height,rgba){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>8192||height>8192||!(rgba instanceof Uint8Array)||rgba.byteLength!==width*height*4)throw Error('Invalid WebGL RGBA dimensions');
 const pixels=Buffer.from(rgba.buffer,rgba.byteOffset,rgba.byteLength),stride=width*4,scanlines=Buffer.alloc((stride+1)*height);
 // WebGL readPixels starts at the lower left; PNG starts at the upper left.
 for(let y=0;y<height;y++)pixels.copy(scanlines,y*(stride+1)+1,(height-1-y)*stride,(height-y)*stride);
 const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',deflateSync(scanlines,{level:6})),chunk('IEND',Buffer.alloc(0))]);
}
if(process.argv.includes('--self-test')){
 const rgba=Buffer.from([255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255]);
 const png=encodeWebglPng(2,2,rgba);let cursor=8,compressed=[];
 while(cursor<png.length){const length=png.readUInt32BE(cursor),type=png.toString('ascii',cursor+4,cursor+8),data=png.subarray(cursor+8,cursor+8+length);assert.equal(crc32(png.subarray(cursor+4,cursor+8+length)),png.readUInt32BE(cursor+8+length));if(type==='IDAT')compressed.push(data);cursor+=length+12;}
 const decoded=inflateSync(Buffer.concat(compressed));assert.deepEqual([...decoded],[0,0,0,255,255,255,255,255,255,0,255,0,0,255,0,255,0,255]);
 console.log(JSON.stringify({crc:true,rgbaExact:true,verticalOrientation:true,passed:true}));
}
