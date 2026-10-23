import * as T from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {HALL_ENVELOPE143} from './hall-envelope143.js';
import {PAGODA_FRAME143} from './pagoda-frame143.js';

// Retain the public CC0 metric lacquered-cherry maps. The physical topcoat
// adds a separate broad reflection lobe above the dark scanned wood body.
export async function installTimberFinish181(M,materials,textures){
 const roughness=await new T.TextureLoader().loadAsync(new URL('../assets/bridge-coating-roughness-2k.png',import.meta.url).href);roughness.wrapS=roughness.wrapT=T.RepeatWrapping;roughness.anisotropy=8;textures.push(roughness);
 const changed=[];
 for(const key of['wood','red']){
  const old=M[key],m=new T.MeshPhysicalMaterial({name:'scene09-181-scanned-lacquer-'+key,color:old.color.clone(),map:old.map,normalMap:old.normalMap,normalScale:old.normalScale.clone(),roughnessMap:roughness,roughness:1,metalness:0,clearcoat:key==='red'?.18:.12,clearcoatRoughnessMap:roughness,clearcoatRoughness:.70,envMapIntensity:.70});
  m.userData={...old.userData,finish181:'Dielectric lacquer above existing scanned metric timber, no new albedo image'};M[key]=m;materials.push(m);changed.push({key,roughness:m.roughness,clearcoat:m.clearcoat,clearcoatRoughness:m.clearcoatRoughness});
 }
 for(const m of[M.eaveDark,M.carvedTimber]){m.roughnessMap=roughness;m.roughness=1;}
 return{revision:'scene09-181-bounded-satin-dielectric-lacquer-r04',changed,roughnessMap:'Existing CC0-derived numeric bridge-coating-roughness-2k.png, R=.50+.20*sourceG, actual range .5333..6980; source albedo and metric normals retained',referencePixelsSampled:false};
}

// Finite warm sources approximate aggregate lantern interreflection in the
// native raster renderer. Existing modeled inverse-square practical lamps
// and their shadows remain the primary local light. LTC does not claim the
// transport or shadow equivalence of a path-traced physical render.
export function installArchitecturalBounce181(scene){
 RectAreaLightUniformsLib.init();const records=[];
 function area(pose,name,position,target,width,height,intensity){
  const matrix=new T.Matrix4().compose(new T.Vector3(...pose.position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),pose.yaw),new T.Vector3(...pose.scale)),light=new T.RectAreaLight(0xffd2a5,intensity,width*pose.scale[0],height*pose.scale[1]);
  light.name=name;light.position.fromArray(position).applyMatrix4(matrix);light.lookAt(new T.Vector3(...target).applyMatrix4(matrix));light.userData={inferred:true,scope:'Finite native lantern-bounce approximation, no emissive architectural material'};scene.add(light);
  records.push({name,position:light.position.toArray(),target:new T.Vector3(...target).applyMatrix4(matrix).toArray(),width:light.width,height:light.height,intensity});
 }
 area(HALL_ENVELOPE143,'scene09-181-west-sanctuary-lantern-bounce',[-4.0,5.8,7.1],[-4.0,6.1,.3],7.3,2.55,1.30);
 area(HALL_ENVELOPE143,'scene09-181-east-sanctuary-lantern-bounce',[4.0,5.8,7.1],[4.0,6.1,.3],7.3,2.55,1.30);
 area(HALL_ENVELOPE143,'scene09-181-gallery-lantern-bounce',[0,10.10,6.85],[0,11.10,1.15],14.6,1.25,.95);
 area(PAGODA_FRAME143,'scene09-181-pagoda-front-lantern-bounce',[0,8.0,5.20],[0,8.0,0],4.25,13.5,.49);
 area(PAGODA_FRAME143,'scene09-181-pagoda-return-lantern-bounce',[5.20,8.0,0],[0,8.0,0],4.25,13.5,.38);
 return{revision:'scene09-181-finite-native-lantern-interreflection',sources:records,pathTracedEquivalence:false,emissionGainAddedToArchitecture:false,visualAccepted:false};
}
