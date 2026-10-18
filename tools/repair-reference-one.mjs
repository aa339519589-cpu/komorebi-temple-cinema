import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const path='references/hd/0-照片-1.jpg';
const sha=b=>createHash('sha256').update(b).digest('hex');
const expected='988668375f41c19386115b7514ccead940e2f89a6bf5f6b8c71fa6c6df02835d';
const duplicate='904536ae5349c806e629d49ebdcfbd3043882beb8234a878afc45835d904c29a';
const before=sha(await readFile(path));
if(before===expected){console.log('Canonical reference 1 is already correct.');process.exit(0);}
if(before!==duplicate)throw Error('Reference changed concurrently; refuse to overwrite an unrecognized source');
const url=process.env.REFERENCE_SOURCE_URL;
if(!url||new URL(url).origin!=='https://at.adobe.com')throw Error('Require the staged user-supplied reference asset');
const response=await fetch(url,{signal:AbortSignal.timeout(60000)});
if(!response.ok)throw Error('Source asset download failed: '+response.status);
const data=Buffer.from(await response.arrayBuffer());
if(data.length!==898411||sha(data)!==expected||data[0]!==255||data[1]!==216)throw Error('Downloaded bytes do not match the exact supplied JPEG');
await writeFile(path,data);
console.log(JSON.stringify({reference:1,path,before,after:expected,bytes:data.length,meaning:'Left hanging lantern and near column, NOT right-veranda reference 2'}));
