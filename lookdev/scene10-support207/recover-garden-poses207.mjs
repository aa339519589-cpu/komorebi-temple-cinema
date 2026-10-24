import fs from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import * as T from 'three';
import {buildNatural193} from './r06-source/src/natural193.js';
import * as lo from './r06-source/src/layout125.js';
import * as su from './r06-source/src/support-route207.js';

// Read-only CPU replay of the held R06 recipe. No browser, image, viewport,
// renderer, external request or mesh export. It records eleven actual rigid
// tree poses, and accepts them only when all reported R06 plant/rock records
// reproduce. Plant meshes only need their source primitive counts for RNG;
// rock ray hits use the exact local original position/index/normal buffers.
const main=await fs.readFile('lookdev/scene10-support207/r06-source/src/main.js','utf8'),L=lo.scene10Layout125,plan=lo.createBridgeHallStairPlan125(),approach=su.createApproachPlan207(L);
const part=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
const fns=new Function('T','L','routeReserved207','bridgeHallPlan','bridgeApproach207','leftPathEdge125','rightPathEdge125',part(main,'function hillHeight(','const terrainPos')+main.match(/function forestHeight141\(x,z\)\{[^\n]+\}/)[0]+main.match(/function bridgeWaterChannel125\(x,z\)\{[^\n]+\}/)[0]+part(main,'function circulationReserved125(','// Porous wet mineral support')+'return {hillHeight,forestHeight:forestHeight141,reserved:circulationReserved125,channel:bridgeWaterChannel125};')(T,L,su.routeReserved207,plan,approach,lo.leftPathEdge125,lo.rightPathEdge125);
const material=new T.MeshPhysicalMaterial(),dummy=new T.BoxGeometry(.1,.1,.1);
async function partsOnly(path){const j=JSON.parse(await fs.readFile(path,'utf8'));return j.scenes[j.scene||0].nodes.map(n=>({parts:j.meshes[j.nodes[n].mesh].primitives.map(()=>({geometry:dummy,material:material.clone()}))}));}
async function exactScans(path){
 const j=JSON.parse(await fs.readFile(path,'utf8')),buffers=await Promise.all(j.buffers.map(b=>fs.readFile(resolve(dirname(path),b.uri))));
 const accessor=i=>{const a=j.accessors[i],v=j.bufferViews[a.bufferView],b=buffers[v.buffer],offset=(v.byteOffset||0)+(a.byteOffset||0),size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],Type={5121:Uint8Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array}[a.componentType];if(v.byteStride||a.sparse)throw Error('Unexpected scan accessor');const copy=b.buffer.slice(b.byteOffset+offset,b.byteOffset+offset+a.count*size*Type.BYTES_PER_ELEMENT);return new T.BufferAttribute(new Type(copy),size);};
 return j.scenes[j.scene||0].nodes.map(n=>{const node=j.nodes[n],p=j.meshes[node.mesh].primitives[0],g=new T.BufferGeometry();g.setAttribute('position',accessor(p.attributes.POSITION));g.setAttribute('normal',accessor(p.attributes.NORMAL));if(p.attributes.TEXCOORD_0!==undefined)g.setAttribute('uv',accessor(p.attributes.TEXCOORD_0));g.setIndex(accessor(p.indices));const m=new T.Matrix4().compose(new T.Vector3(...(node.translation||[0,0,0])),new T.Quaternion(...(node.rotation||[0,0,0,1])),new T.Vector3(...(node.scale||[1,1,1])));g.applyMatrix4(m);g.computeBoundingBox();const center=g.boundingBox.getCenter(new T.Vector3()),size=g.boundingBox.getSize(new T.Vector3());g.translate(-center.x,-center.y,-center.z);g.scale(...Array(3).fill(2/Math.max(size.x,size.z)));return {geometry:g,wet:material.clone()};});
}
const scannedStones={variants:await exactScans('assets/polyhaven/rock-moss-set-01/rock_moss_set_01_4k.gltf')},groundcover={variants:await partsOnly('assets/polyhaven/periwinkle-plant/periwinkle_plant_4k.gltf'),leaves:[{material:material.clone()}]},pines={variants:await partsOnly('reconstructions/scene-10/assets/pine-sapling-cc0-141/pine_sapling_small_1k.gltf'),trunkMaterial:material.clone()},shrubs={variants:await partsOnly('assets/polyhaven/shrub-02/shrub_02_4k.gltf')};
const ecologyAnchors207=JSON.parse(await fs.readFile('reconstructions/scene-10/ecology193-held207.json','utf8')),poses=[];
const emit=(g,ma,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=0)=>{if(g.name.startsWith('natural193-connected-garden-wood-'))poses.push({geometry:g.name,position:[x,y,z],scale:[sx,sy,sz],yaw:rot});};
const current=buildNatural193({emit,scene:new T.Scene(),scannedStones,shrubs,groundcover,pines,...fns,stairEmbankment:su.createNarrowStairCore207(plan),layout:L,mineralMaterial:material,ecologyAnchors207,bearingSurfaces207:[]}).info;
const recorded=JSON.parse(await fs.readFile('qa/ten-reference/10/iteration-scene10-support207-r06-bank/report.json','utf8')).frames[0].info.natural193;
function maxNumberDelta(a,b){if(typeof a==='number'&&typeof b==='number')return Math.abs(a-b);if(Array.isArray(a)&&Array.isArray(b)){if(a.length!==b.length)return Infinity;return Math.max(0,...a.map((x,i)=>maxNumberDelta(x,b[i])));}if(a&&b&&typeof a==='object'&&typeof b==='object'){const k=Object.keys(a);if(k.length!==Object.keys(b).length)return Infinity;return Math.max(0,...k.map(k=>maxNumberDelta(a[k],b[k])));}return a===b?0:Infinity;}
const check={roots:current.roots.length,expectedRoots:recorded.roots.length,rocks:current.rocks.length,expectedRocks:recorded.rocks.length,rootMaxDelta:maxNumberDelta(current.roots,recorded.roots),rockMaxDelta:maxNumberDelta(current.rocks,recorded.rocks),forestMaxDelta:maxNumberDelta(current.forest,recorded.forest),forestByteEqual:JSON.stringify(current.forest)===JSON.stringify(recorded.forest),gardenPoses:poses.length};
const passed=check.gardenPoses===11&&check.rootMaxDelta<2e-6&&check.rockMaxDelta<2e-6&&check.forestMaxDelta<2e-6;
const result={sourceHash:'c4fbd7afd7b098cf8a570632f0d2dbeef6d4d2dba996f82976ca3bde997e3421',scope:'Exact frozen R06 CPU geometry/RNG replay, source primitive counts and real scan ray buffers. Eleven garden tree rigid poses only; no image/renderer/export.',check,passed,poses};await fs.writeFile('lookdev/scene10-support207/recovered-garden-poses-r06.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(check));if(!passed)throw Error('R06 replay did not reproduce the native runtime records');
