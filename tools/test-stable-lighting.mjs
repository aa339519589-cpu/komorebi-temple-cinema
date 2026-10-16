import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stableAreaLightChunk} from '../src/stable-lighting.js';
const source=await readFile(new URL('../vendor/build/three.module.js',import.meta.url),'utf8');
assert(source.includes('T1 = normalize( V - N * dot( V, N ) );'));
const original='T1 = normalize( V - N * dot( V, N ) );';
assert(stableAreaLightChunk(original).includes('tangentLength2 > 1e-10'));
assert.throws(()=>stableAreaLightChunk('different shader'));
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],normal=a=>{const l=Math.hypot(...a);return a.map(x=>x/l)};
for(const n of [[0,0,1],[0,1,0],[1,0,0],normal([1,2,3])])for(const sign of [-1,1]){
  const v=n.map(x=>x*sign),d=dot(v,n),t=v.map((x,i)=>x-n[i]*d),l=dot(t,t);
  const b=l>1e-10?t.map(x=>x/Math.sqrt(l)):normal(cross(Math.abs(n[2])<.999?[0,0,1]:[0,1,0],n));
  assert(b.every(Number.isFinite));assert(Math.abs(dot(b,n))<1e-12);assert(Math.abs(Math.hypot(...b)-1)<1e-12);
}
console.log('LTC basis patch: pinned-source check and parallel/antiparallel finite orthonormal cases passed. GPU cause still requires readback.');
