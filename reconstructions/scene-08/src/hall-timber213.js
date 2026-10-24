import * as T from 'three';

export function surfaceNormal213(P,side,t,u){
 const lo=Math.max(0,t-.0008),hi=Math.min(1,t+.0008),a=Math.max(-1,u-.0008),b=Math.min(1,u+.0008),along=new T.Vector3(...P(side,hi,u)).sub(new T.Vector3(...P(side,lo,u))),across=new T.Vector3(...P(side,t,b)).sub(new T.Vector3(...P(side,t,a))),n=new T.Vector3().crossVectors(along,across).normalize();
 if(n.lengthSq()<.01)return new T.Vector3(0,1,0);if(n.y<0)n.negate();return n;
}
export function roofRowWidth213(P,side,t,u,step){
 const lo=Math.max(-1,u-step/2),hi=Math.min(1,u+step/2);
 return new T.Vector3(...P(side,t,hi)).distanceTo(new T.Vector3(...P(side,t,lo)))*step/(hi-lo);
}

// Authored finish roles on real construction. The independent scan supplies
// normalized grain once; the resulting albedo is not multiplied by a tint.
// No emission, screen-space colour operation, added light or photograph map.
export function installHallTimber213({mats,materials,pigmentTimber}){
 const spec={
  hallLacquer213:{color:'#a64b2c',roughness:.76,coat:.12,normal:.10,use:'Sparse turned lacquer columns and vertical framing'},
  hallBeam213:{color:'#805239',roughness:.88,coat:.025,normal:.09,use:'Dark brown primary beams, tie members and purlins'},
  hallFascia213:{color:'#6b3926',roughness:.89,coat:.02,normal:.07,use:'Thin exposed brown-red fascia courses, distinct from pale cut ends'},
  hallArm213:{color:'#95683f',roughness:.85,coat:.018,normal:.08,use:'Weathered warm timber bracket arms'},
  hallReceiver213:{color:'#aa8552',roughness:.86,coat:.01,normal:.08,use:'Cut timber dou and actual bearing receivers'},
  hallRafter213:{color:'#9c7447',roughness:.83,coat:.015,normal:.08,use:'Distinct parallel rafter bodies and flying eave tails'},
  hallCut213:{color:'#ba9661',roughness:.86,coat:0,normal:.055,use:'Exposed nonmetallic cut ends on actual profiled timber'},
  hallSoffit213:{color:'#705038',roughness:.91,coat:0,normal:.07,use:'Sheltered solid roof boards'},
  hallWindow213:{color:'#a48a60',roughness:.86,coat:.015,normal:.06,use:'Projecting window muntins and frame reveals'},
  hallPanel213:{color:'#59432e',roughness:.94,coat:0,normal:.04,use:'Recessed dark-brown timber window backing'}
 };
 for(const [name,s]of Object.entries(spec)){
  const m=mats.wood.clone();m.name='grand-hall-213-'+name;
  pigmentTimber(m,s.color);m.metalness=0;m.roughness=s.roughness;
  m.clearcoat=s.coat;m.clearcoatRoughness=.54;m.normalScale.setScalar(s.normal);
  m.aoMap=null;m.emissive.setRGB(0,0,0);m.emissiveIntensity=0;m.envMapIntensity=1;
  m.userData.hallTimber213={role:name,use:s.use,pigment:s.color};
  materials.push(m);mats[name]=m;
 }
 return{info(){return{revision:'scene08-outward-soffit-height-resolved-timber213-r16',normalizedSourceGrainAppliedOnce:true,baseColorAfterPortableAlbedo:[1,1,1],sourceScan:'reconstructions/scene-08/assets/timber/diffuse-2k.jpg',sourceRoughnessRemap:'0.6784 + 0.30 * source channel, then physical role scalar',roles:Object.entries(spec).map(([name,s])=>{
   const m=mats[name],a=m.map.image.getContext('2d').getImageData(0,0,m.map.image.width,m.map.image.height).data,mean=[0,0,0];let n=0;
   for(let i=0;i<a.length;i+=256){for(let k=0;k<3;k++){const v=a[i+k]/255;mean[k]+=v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}n++;}
   return{role:name,use:s.use,pigment:s.color,linearPigment:new T.Color(s.color).toArray(),meanPortableAlbedoLinear:mean.map(v=>v/n),baseColor:m.color.toArray(),metalness:m.metalness,roughnessScalar:m.roughness,normalScale:m.normalScale.toArray(),clearcoat:m.clearcoat,AOMap:!!m.aoMap,emissive:m.emissive.toArray(),environment:m.envMap?'actual-scene-court-capture':'measured-outdoor-sky',captureHeightRole:m.userData.actualCourtCapture213,environmentGain:m.envMapIntensity};
  }),cameraExposureChanged:false,lightsAdded:0,visualAccepted:false};}};
}

// A real recessed panel and crossing 90/110 mm deep muntins replace the
// former nearly coplanar 28 mm strips. All glassless backing remains behind
// the frames; the separate 191 occupied portal volumes are not touched.
export function createHallLattice213({box}){
 let windows=0,verticalMuntins=0,horizontalMuntins=0;
 function build(x,y,z,w,h){
  box(x,y,z-.095,w-.025,h-.025,.055,'hallPanel213');
  const nx=Math.max(4,Math.ceil(w/.145)),ny=Math.max(4,Math.ceil(h/.20));
  for(let i=0;i<=nx;i++){box(x-w/2+i*w/nx,y,z+.025,.043,h,.11,'hallWindow213');verticalMuntins++;}
  for(let i=0;i<=ny;i++){box(x,y-h/2+i*h/ny,z+.058,w,.037,.09,'hallWindow213');horizontalMuntins++;}
  for(const sign of[-1,1]){box(x+sign*(w/2+.025),y,z+.030,.11,h+.22,.22,'hallBeam213');box(x,y+sign*(h/2+.045),z+.038,w+.16,.12,.22,'hallBeam213');}
  windows++;
 }
 return{build,info:()=>({windows,verticalMuntins,horizontalMuntins,backingSetback:.095,muntinDepths:[.11,.09],frameDepth:.22,portalGeometryHeld:true,photographSampled:false,visualAccepted:false})};
}
