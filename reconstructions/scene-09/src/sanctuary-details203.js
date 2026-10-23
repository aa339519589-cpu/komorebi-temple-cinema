import * as T from 'three';
import{HALL_ENVELOPE143 as H}from'./hall-envelope143.js';

// Two inferred standing oil offerings in the occupied altar bay. These are
// real closed turned brass, dish, wick and flame solids, not an image glow.
export function buildSanctuaryDetails203(api,ownedMaterials){
 const{emit,group,light,materials:M}=api;
 const brass=M.gold.clone();brass.name='scene09-203-turned-sanctuary-oil-lamp';brass.color.setHex(0xa58443);brass.roughness=.38;brass.userData.nightVolume203='hall';
 const oil=new T.MeshPhysicalMaterial({name:'scene09-203-votive-oil-meniscus',color:0x22180a,roughness:.12,metalness:0,clearcoat:1,clearcoatRoughness:.08});oil.userData.nightVolume203='hall';
 const wick=new T.MeshStandardMaterial({name:'scene09-203-charred-cotton-wick',color:0x1c1007,roughness:1});
 const flame=new T.MeshStandardMaterial({name:'scene09-203-votive-flame-volume',color:0xffc978,emissive:0xff9728,emissiveIntensity:9,roughness:1});flame.userData.physicalEmitter203=true;
 ownedMaterials.push(brass,oil,wick,flame);
 const turn=p=>new T.LatheGeometry(p.map(q=>new T.Vector2(...q)),32),stand=turn([[0,0],[.19,0],[.20,.025],[.20,.065],[.16,.085],[.105,.11],[.12,.145],[.10,.18],[.046,.24],[.035,.74],[.053,.80],[.085,.83],[.061,.87],[.052,.93],[.12,.96],[.15,.98],[.155,1.01],[.13,1.035],[.095,1.04],[.055,1.01],[0,1.01]]),dish=turn([[0,0],[.07,0],[.14,.025],[.18,.08],[.18,.095],[.165,.105],[.15,.085],[.095,.048],[0,.042]]),oilGeo=new T.CylinderGeometry(.12,.12,.006,32),wickGeo=new T.CylinderGeometry(.006,.008,.034,10),flameGeo=new T.SphereGeometry(1,14,10),records=[];
 group(...H.position,H.yaw,()=>{
  for(const[x,z,cd]of[[-2.58,2.84,12],[.38,2.69,10]]){
   group(x,H.floor+.04,z,0,()=>{
    emit(stand,brass);emit(dish,brass,0,1.015,0);emit(oilGeo,oil,0,1.069,0);emit(wickGeo,wick,0,1.091,0);emit(flameGeo,flame,.003,1.137,0,.014,.049,.014,[0,0,-.12]);
    light(.003,1.13,0,cd,4.8,{kind:'sanctuary-votive203'});
   });
   records.push({localAnchor:[x,H.floor+.04,z],localFlameHeight:H.floor+1.17,requestedCandela:cd,inferredPlacement:true});
  }
 },H.scale);
 return{revision:'scene09-solid-sanctuary-votives203-r08',fixtures:records,closedPartsPerFixture:5,source:'Authored metric lathe/solid geometry; reference comparison only',newExternalAsset:false,visualAccepted:false};
}
