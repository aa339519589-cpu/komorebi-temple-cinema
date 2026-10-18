import * as T from '../../../vendor/build/three.module.js';
import {emitRestoredBuddha} from '../../../reconstructions/scene-09/src/restoration-buddha.js';
import {buildRestorationPrunedPine} from '../../../reconstructions/scene-09/src/restoration-pruned-pines-v1.js';
import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync(new URL('../../../reconstructions/scene-09/src/main.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('const scene='),source.indexOf('// A real offscreen reflected scene'));
const result=new Function('T','emitRestoredBuddha','buildRestorationPrunedPine','botany','const W=768,H=768;const foliageCard=new T.PlaneGeometry(1,1);foliageCard.scale(1,.22,1);'+body+`;let count=0,triangles=0;for(const b of buckets.values()){for(const [m]of b.items){if(!m.elements.every(Number.isFinite))throw new Error('Nonfinite transform');count++;}triangles+=(b.g.index?.count??b.g.attributes.position.count)/3*b.items.length;}return {finiteTransforms:true,instances:count,geometryBuckets:buckets.size,triangles,pointLights:scene.children.filter(x=>x.isPointLight).length,proceduralOnly:true};`)(T,emitRestoredBuddha,buildRestorationPrunedPine,{materials:Object.fromEntries(['bark','needleGreen','foliageGreen','foliageDark'].map(n=>[n,new T.MeshStandardMaterial()])),card:new T.PlaneGeometry(1,1)});
console.log(JSON.stringify(result,null,2));writeFileSync(new URL('./cpu-check.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
