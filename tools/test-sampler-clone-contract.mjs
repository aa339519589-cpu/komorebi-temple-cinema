import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import * as T from '../vendor/build/three.module.js';
import {installMaterialSamplerPacking,packNormalRoughnessBytes} from '../src/material-sampler-packing.js';
const n=new Uint8Array([128,128,255,255,140,130,250,255,110,120,253,255,129,134,254,255]);
const r=new Uint8Array([199,199,199,255,230,230,230,255,211,211,211,255,175,175,175,255]);
const packed=packNormalRoughnessBytes(n,r),tests=[];
function test(name,fn){try{fn();tests.push({name,passed:true});}catch(error){tests.push({name,passed:false,error:String(error.message)});}}
test('RGB normal data unchanged',()=>{for(let i=0;i<n.length;i++)if(i%4!==3)assert.equal(packed[i],n[i]);});
test('Roughness green preserved in alpha',()=>{for(let i=3;i<n.length;i+=4)assert.equal(packed[i],r[i-2]);});
const normal=new T.DataTexture(n,2,2),roughness=new T.DataTexture(r,2,2);
normal.needsUpdate=true;roughness.needsUpdate=true;
const material=new T.MeshPhysicalMaterial({name:'wet-flagstone-contract',normalMap:normal,roughnessMap:roughness});
const scene=new T.Scene(),geometry=new T.PlaneGeometry(1,1);scene.add(new T.Mesh(geometry,material));
const lease=installMaterialSamplerPacking();
try{
 lease.prepare(scene);
 test('Base packed material uses alpha roughness',()=>assert.equal(material.defines.KOMOREBI_ROUGHNESS_IN_NORMAL_ALPHA,1));
 const clone=material.clone();clone.name='wet-flagstone-contract-clone';scene.add(new T.Mesh(geometry,clone));lease.prepare(scene);
 test('Cloned packed material retains alpha roughness',()=>assert.equal(clone.defines.KOMOREBI_ROUGHNESS_IN_NORMAL_ALPHA,1));
 test('Cloned normal RGB remains original',()=>{for(let i=0;i<n.length;i++)if(i%4!==3)assert.equal(clone.normalMap.image.data[i],n[i]);});
 test('Repeated preparation retains clone interpretation',()=>{lease.prepare(scene);assert.equal(clone.defines.KOMOREBI_ROUGHNESS_IN_NORMAL_ALPHA,1);});
 clone.dispose();
}finally{lease.dispose();material.dispose();geometry.dispose();normal.dispose();roughness.dispose();}
const report={scope:'CPU-only data/channel/lifecycle contract, not a scene visual acceptance',passed:tests.every(t=>t.passed),tests};await mkdir('output/sampler-contract',{recursive:true});await writeFile('output/sampler-contract/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
