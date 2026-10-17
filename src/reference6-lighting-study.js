import * as T from '../vendor/build/three.module.js';
/** Reversible reference6 studies. Geometry, shadows and reflection passes remain. */
const states=new WeakMap();
export const REFERENCE6_LOOKS=Object.freeze({
 baseline:Object.freeze({exposure:1.10,metalEnvironment:1,key:0,rim:0,wood:false,floorStrength:.88,floorLod:2.4}),
 exposure:Object.freeze({exposure:1.55,metalEnvironment:1,key:0,rim:0,wood:false,floorStrength:.88,floorLod:2.4}),
 warmWindow:Object.freeze({exposure:1.30,metalEnvironment:1.45,key:5,rim:1.6,wood:true,floorStrength:.98,floorLod:1.8}),
 luminousWindow:Object.freeze({exposure:1.40,metalEnvironment:1.7,key:8,rim:2.2,wood:true,floorStrength:1.0,floorLod:1.8})
});
function stateFor(temple){
 if(states.has(temple))return states.get(temple);
 if(temple.info().lightingMode!=='sanctuary')throw Error('Sanctuary look requires sanctuary lighting mode first');
 const seen=new Set(),materials=[];
 temple.scene.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.isMeshStandardMaterial&&!seen.has(m)){seen.add(m);materials.push({material:m,color:m.color.clone(),roughness:m.roughness,envMapIntensity:m.envMapIntensity});}});
 const group=new T.Group();group.name='reference6-photographic-window-bounce-study';
 // Broad indirect window/wood bounce, inside the actual hall, not a replacement sun.
 const key=new T.RectAreaLight('#ffe1b1',0,4.0,4.0);key.name='reference6-left-window-bounce';key.position.set(-6.4,7.1,-4.6);key.lookAt(-1.54,6.7,-9.4);
 const rim=new T.RectAreaLight('#ffdda2',0,2.3,3.0);rim.name='reference6-right-wood-bounce';rim.position.set(3.6,7.3,-6.0);rim.lookAt(-1.54,6.5,-9.5);
 group.add(key,rim);group.visible=false;temple.scene.add(group);
 const floor=temple.scene.getObjectByName('restoration-sanctuary-floor-clearcoat'),uniforms=floor?.material?.uniforms;
 const state={materials,group,key,rim,floor:uniforms,floorOriginal:uniforms?{strength:uniforms.floorStrength.value,lod:uniforms.floorReflectionLod.value}:null};
 states.set(temple,state);return state;
}
export function applyReference6Look(temple,name='baseline'){
 if(!Object.hasOwn(REFERENCE6_LOOKS,name))throw Error('Unknown explicit reference6 look');
 const s=stateFor(temple),p=REFERENCE6_LOOKS[name],changed=[];
 for(const r of s.materials){const m=r.material;m.color.copy(r.color);m.roughness=r.roughness;m.envMapIntensity=r.envMapIntensity;
  if(['buddha','restoration-private-room-gold','restoration-private-room-oldgold'].includes(m.name)){m.envMapIntensity=Math.min(4,r.envMapIntensity*p.metalEnvironment);changed.push({material:m.name,envMapIntensity:m.envMapIntensity});}
  if(p.wood&&m.name==='architecture_red'){m.color.setHex(0x98492e);m.roughness=.42;changed.push({material:m.name,color:m.color.getHexString(),roughness:m.roughness});}
  if(p.wood&&m.name==='architecture_cedar'){m.color.setHex(0x854b2e);m.roughness=.53;changed.push({material:m.name,color:m.color.getHexString(),roughness:m.roughness});}
 }
 s.group.visible=p.key>0||p.rim>0;s.key.intensity=p.key;s.rim.intensity=p.rim;
 if(s.floor){s.floor.floorStrength.value=p.floorStrength;s.floor.floorReflectionLod.value=p.floorLod;}
 temple.renderer.toneMappingExposure=p.exposure;
 const receipt={preset:name,parameters:p,changedMaterials:changed,addedLights:[s.key,s.rim].map(l=>({name:l.name,visible:s.group.visible,intensity:l.intensity,position:l.position.toArray(),color:l.color.getHexString(),width:l.width,height:l.height})),unchanged:'Geometry, original light count/strength, shadow maps, original metalness and bump/normal maps, all AO and reflection passes',acceptance:'Visual study, not accepted final'};
 temple.reference6LookInfo=()=>receipt;return receipt;
}
export function disposeReference6Look(temple){const s=states.get(temple);if(!s)return;for(const r of s.materials){r.material.color.copy(r.color);r.material.roughness=r.roughness;r.material.envMapIntensity=r.envMapIntensity;}if(s.floor){s.floor.floorStrength.value=s.floorOriginal.strength;s.floor.floorReflectionLod.value=s.floorOriginal.lod;}s.group.removeFromParent();s.key.dispose();s.rim.dispose();states.delete(temple);}
