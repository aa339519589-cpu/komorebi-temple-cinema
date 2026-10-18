import * as T from 'three';
import {buildReference4Architecture} from '../../../reconstructions/scene-03/src/reference4-architecture.js';
import {createRestorationLotusLeaf} from '../../../reconstructions/scene-03/src/restoration-lotus-leaf.js';
import {createRestorationLotusPetal} from '../../../reconstructions/scene-03/src/restoration-lotus-petal.js';
const architecture=buildReference4Architecture(T,{stairTopY:2.2,stairBottomZ:7.8,stairWidth:5.5,towerPosition:[-14,-.4,-8.3],towerHeight:15.4,towerSceneScale:1.06});let vertices=0;
for(const g of[...architecture.group.children.map(o=>o.geometry),...Array.from({length:6},(_,i)=>createRestorationLotusLeaf(i+3)),...Array.from({length:5},(_,i)=>createRestorationLotusPetal(i+5))]){for(const x of g.attributes.position.array)if(!Number.isFinite(x))throw Error('nonfinite geometry');vertices+=g.attributes.position.count;}
console.log(JSON.stringify({ok:true,vertices,architecture:architecture.stats,bounds:architecture.bounds}));architecture.dispose();
