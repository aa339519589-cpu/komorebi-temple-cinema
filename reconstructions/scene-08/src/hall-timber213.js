import * as T from 'three';

export function surfaceNormal213(P,side,t,u){
 const lo=Math.max(0,t-.0008),hi=Math.min(1,t+.0008),a=Math.max(-1,u-.0008),b=Math.min(1,u+.0008),along=new T.Vector3(...P(side,hi,u)).sub(new T.Vector3(...P(side,lo,u))),across=new T.Vector3(...P(side,t,b)).sub(new T.Vector3(...P(side,t,a))),n=new T.Vector3().crossVectors(along,across).normalize();
 if(n.lengthSq()<.01)return new T.Vector3(0,1,0);if(n.y<0)n.negate();return n;
}
export function roofRowWidth213(P,side,t,u,step){
 const lo=Math.max(-1,u-step/2),hi=Math.min(1,u+step/2);
 return new T.Vector3(...P(side,t,hi)).distanceTo(new T.Vector3(...P(side,t,lo)))*step/(hi-lo);
}

// Authored finish graph on unchanged construction. All fields are functions
// of the same independent one-metre scan; no photographic pixel is sampled.
// This is material authoring, not a screen colour operation or baked light.
export function installHallTimber213({mats,materials,pigmentTimber}){
 const spec={
  hallLacquer213:{color:'#aa4b27',finish:'lacquer',coat:.08,normal:.62,wear:.025,bump:.00045,use:'Soft satin vermilion lacquer on turned columns and upright framing'},
  hallBeam213:{color:'#7e3d22',finish:'timber',coat:.025,normal:.70,wear:.08,bump:.00080,use:'Deep warm-brown primary beams separating the brighter heads'},
  hallFascia213:{color:'#a1572a',finish:'timber',coat:.035,normal:.68,wear:.06,bump:.00065,use:'Warm red-brown narrow fascia with restrained oil sheen'},
  hallArm213:{color:'#a15829',finish:'timber',coat:.030,normal:.75,wear:.09,bump:.00085,use:'Amber red-brown bracket shoulders with restrained worn grain'},
  hallReceiver213:{color:'#af7034',finish:'timber',coat:.025,normal:.70,wear:.10,bump:.00075,use:'Warmer amber receiving dou separating each bracket layer'},
  hallRafter213:{color:'#aa6331',finish:'timber',coat:.025,normal:.70,wear:.08,bump:.00070,use:'Warm amber-brown timber rafters and flying tails'},
  hallCut213:{color:'#dfb864',finish:'gilt',coat:0,normal:.45,wear:0,bump:.00018,metal:.80,use:'Actual held rafter-end blocks with rough worn gold-leaf finish'},
  hallSoffit213:{color:'#773c22',finish:'sheltered',coat:.015,normal:.75,wear:.06,bump:.00065,use:'Sheltered warm-brown board field behind the finer rafters'},
  hallWindow213:{color:'#a48a60',finish:'timber',coat:.025,normal:.60,wear:.035,bump:.00050,use:'Projecting window muntins and frame reveals'},
  hallPanel213:{color:'#4a2a1b',finish:'sheltered',coat:0,normal:.50,wear:.020,bump:.00045,use:'Recessed dark red-brown window backing'}
 };
 const linear=q=>q<=.04045?q/12.92:Math.pow((q+.055)/1.055,2.4),srgb=q=>q<=.0031308?q*12.92:1.055*Math.pow(q,1/2.4)-.055;
 const imagePixels=image=>{const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(image,0,0);return {canvas:c,context:x,pixels:x.getImageData(0,0,c.width,c.height)};};
 const roughSource=imagePixels(mats.wood.roughnessMap.image),grainSource=imagePixels(mats.wood.map.image),normalSource=imagePixels(mats.wood.normalMap.image),roughPixels=roughSource.pixels.data,grainPixels=grainSource.pixels.data;
 const roughOriginal=i=>T.MathUtils.clamp((roughPixels[i+1]-173)/76.5,0,1);
 let meanGrain=0;for(let i=0;i<grainPixels.length;i+=4)meanGrain+=.2126*linear(grainPixels[i]/255)+.7152*linear(grainPixels[i+1]/255)+.0722*linear(grainPixels[i+2]/255);meanGrain/=grainPixels.length/4;
 const microCanvas=document.createElement('canvas');microCanvas.width=grainSource.canvas.width;microCanvas.height=grainSource.canvas.height;
 const microContext=microCanvas.getContext('2d'),microPixels=microContext.createImageData(microCanvas.width,microCanvas.height);
 for(let i=0;i<grainPixels.length;i+=4){const l=.2126*linear(grainPixels[i]/255)+.7152*linear(grainPixels[i+1]/255)+.0722*linear(grainPixels[i+2]/255),q=Math.round(255*T.MathUtils.clamp(.5+.34*(l/meanGrain-1),.18,.82));microPixels.data[i]=microPixels.data[i+1]=microPixels.data[i+2]=q;microPixels.data[i+3]=255;}
 microContext.putImageData(microPixels,0,0);
 const micro=new T.CanvasTexture(microCanvas);micro.name='grand-hall-213-scan-correlated-submillimetre-grain';micro.colorSpace=T.NoColorSpace;micro.wrapS=micro.wrapT=T.MirroredRepeatWrapping;micro.anisotropy=8;
 // Preserve the weak measured normal and add a conservative authored grain
 // slope to it. The one-metre scan fixes the derivative's physical scale.
 // Carved members use the matching bump fallback after the existing helper
 // removes their normal map; their actual14mm coves remain untouched.
 const normalCanvas=document.createElement('canvas');normalCanvas.width=normalSource.canvas.width;normalCanvas.height=normalSource.canvas.height;
 const normalContext=normalCanvas.getContext('2d'),normalPixels=normalContext.createImageData(normalCanvas.width,normalCanvas.height),mw=microCanvas.width,mh=microCanvas.height,mp=microPixels.data,np=normalSource.pixels.data;
 const height=(x,y)=>mp[(Math.max(0,Math.min(mh-1,y))*mw+Math.max(0,Math.min(mw-1,x)))*4]/255;let normalSquares=0,normalCount=0;
 for(let y=0;y<normalCanvas.height;y++)for(let x=0;x<normalCanvas.width;x++){
  const i=(y*normalCanvas.width+x)*4,u=Math.floor(x*mw/normalCanvas.width),v=Math.floor(y*mh/normalCanvas.height),dx=(height(u+1,v)-height(u-1,v))*mw*.5*.00065,dy=(height(u,v+1)-height(u,v-1))*mh*.5*.00065,nx=np[i]/127.5-1-dx,ny=np[i+1]/127.5-1+dy,nz=np[i+2]/127.5-1,inv=1/Math.sqrt(nx*nx+ny*ny+nz*nz);
  normalPixels.data[i]=Math.round((nx*inv*.5+.5)*255);normalPixels.data[i+1]=Math.round((ny*inv*.5+.5)*255);normalPixels.data[i+2]=Math.round((nz*inv*.5+.5)*255);normalPixels.data[i+3]=255;if(i%64===0){normalSquares+=(normalPixels.data[i]/127.5-1)**2+(normalPixels.data[i+1]/127.5-1)**2;normalCount++;}
 }
 normalContext.putImageData(normalPixels,0,0);const grainNormal=new T.CanvasTexture(normalCanvas);grainNormal.name='grand-hall-213-measured-normal-plus-authored-grain-slope';grainNormal.colorSpace=T.NoColorSpace;grainNormal.wrapS=grainNormal.wrapT=T.MirroredRepeatWrapping;grainNormal.anisotropy=8;
 const ranges={lacquer:[.49,.73],timber:[.51,.79],sheltered:[.58,.82],gilt:[.34,.58]},roughMaps=new Map(),ownedTextureRefs=new Map();
 function roughMap(finish){
  if(roughMaps.has(finish))return roughMaps.get(finish);const range=ranges[finish],canvas=document.createElement('canvas');canvas.width=roughSource.canvas.width;canvas.height=roughSource.canvas.height;
  const context=canvas.getContext('2d'),pixels=context.createImageData(canvas.width,canvas.height);let min=1,max=0,total=0;
  for(let i=0;i<roughPixels.length;i+=4){const t=T.MathUtils.smoothstep(roughOriginal(i),.12,.47),r=T.MathUtils.lerp(range[0],range[1],t),q=Math.round(r*255);pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=q;pixels.data[i+3]=255;min=Math.min(min,q/255);max=Math.max(max,q/255);total+=q/255;}
  context.putImageData(pixels,0,0);const map=new T.CanvasTexture(canvas);map.name='grand-hall-213-'+finish+'-scan-roughness';map.wrapS=map.wrapT=T.MirroredRepeatWrapping;map.colorSpace=T.NoColorSpace;map.anisotropy=8;map.userData={authoredRange:range,actualRange:[min,max],actualMean:total/(roughPixels.length/4),sourceDimensions:[canvas.width,canvas.height],scanRegistered:true};roughMaps.set(finish,map);return map;
 }
 function ownMaps(material,maps){
  for(const t of maps)ownedTextureRefs.set(t,(ownedTextureRefs.get(t)??0)+1);
  material.addEventListener('dispose',()=>{for(const t of maps){const n=ownedTextureRefs.get(t)-1;if(n===0){t.dispose();ownedTextureRefs.delete(t);}else ownedTextureRefs.set(t,n);}});
 }
 for(const [name,s]of Object.entries(spec)){
  const m=mats.wood.clone();m.name='grand-hall-213-'+name;
  pigmentTimber(m,s.color);
  const pigment=new T.Color(s.color),canvas=m.map.image,context=canvas.getContext('2d',{willReadFrequently:true}),pixels=context.getImageData(0,0,canvas.width,canvas.height),raw=pixels.data;
  for(let i=0;i<raw.length;i+=4){
   const x=(i/4)%canvas.width,y=Math.floor(i/4/canvas.width),ridx=(Math.min(roughSource.canvas.height-1,Math.floor(y*roughSource.canvas.height/canvas.height))*roughSource.canvas.width+Math.min(roughSource.canvas.width-1,Math.floor(x*roughSource.canvas.width/canvas.width)))*4;
   const grain=T.MathUtils.clamp(Math.pow(linear(raw[i]/255)/Math.max(.0001,pigment.r),1.12),.68,1.38),wear=s.wear*T.MathUtils.smoothstep(roughOriginal(ridx),.265,.46),base=[pigment.r,pigment.g,pigment.b],exposed=[.29,.125,.044];
   for(let k=0;k<3;k++){const q=T.MathUtils.lerp(base[k]*grain,exposed[k]*grain,wear);raw[i+k]=Math.round(srgb(T.MathUtils.clamp(q,0,.96))*255);}
  }
  context.putImageData(pixels,0,0);m.map.needsUpdate=true;m.color.setRGB(1,1,1);
  m.metalness=s.metal??0;m.roughness=1;m.roughnessMap=roughMap(s.finish);
  m.clearcoat=s.coat;m.clearcoatRoughness=.58;m.normalMap=grainNormal;m.normalScale.setScalar(s.normal);m.bumpMap=micro;m.bumpScale=s.bump;
  m.aoMap=null;m.emissive.setRGB(0,0,0);m.emissiveIntensity=0;m.envMapIntensity=1;
  m.userData.hallTimber213={role:name,use:s.use,pigment:s.color,finish:s.finish,scanCorrelatedWear:s.wear,carvedMicroBumpSurvivesNormalMapRemoval:true};ownMaps(m,[m.roughnessMap,micro,grainNormal]);
  materials.push(m);mats[name]=m;
 }
 const inlay=new T.MeshStandardMaterial({name:'grand-hall-213-hallInlay213',metalness:.88,roughness:1,roughnessMap:roughMap('gilt')});inlay.color.setRGB(.79,.52,.14);inlay.userData.hallTimber213={role:'hallInlay213',use:'Narrow real gold-leaf terminal fields and capital petal inlays'};ownMaps(inlay,[inlay.roughnessMap]);materials.push(inlay);mats.hallInlay213=inlay;
 return{info(){return{revision:'scene08-satin-amber-wood-worn-gold-finish213-r23',inlay:{linearRGB:inlay.color.toArray(),metalness:inlay.metalness,roughness:inlay.roughness,roughnessMap:inlay.roughnessMap.userData,emissive:inlay.emissive.toArray(),capture:inlay.userData.actualCourtCapture213},normalizedSourceGrainAppliedOnce:true,baseColorAfterPortableAlbedo:[1,1,1],sourceScan:'reconstructions/scene-08/assets/timber/diffuse-2k.jpg',sourceRoughness:'reconstructions/scene-08/assets/timber/roughness-2k.jpg',sourceNormal:'reconstructions/scene-08/assets/timber/normal-gl-2k.png',sourceRoughnessRemap:'Recover original linear roughness from the held source remap, then scan-registered finish ranges; physical scalar1.',microRelief:{source:'Independent normalized scan grain plus original measured normal; conservative authored submillimetre height, not measured height',heightCoefficientMetres:.00065,dimensions:[microCanvas.width,microCanvas.height],normalDimensions:[normalCanvas.width,normalCanvas.height],normalTangentRMS:Math.sqrt(normalSquares/normalCount),fallbackOnActualCarvedTimber:true,actual14mmCarvingsPreserved:true},roughnessMaps:[...roughMaps].map(([finish,m])=>({finish,...m.userData})),roles:Object.entries(spec).map(([name,s])=>{
   const m=mats[name],a=m.map.image.getContext('2d').getImageData(0,0,m.map.image.width,m.map.image.height).data,mean=[0,0,0];let n=0;
   for(let i=0;i<a.length;i+=256){for(let k=0;k<3;k++){const v=a[i+k]/255;mean[k]+=v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}n++;}
   return{role:name,use:s.use,pigment:s.color,linearPigment:new T.Color(s.color).toArray(),meanPortableAlbedoLinear:mean.map(v=>v/n),baseColor:m.color.toArray(),metalness:m.metalness,roughnessScalar:m.roughness,actualRoughnessMap:m.roughnessMap.userData,normalScale:m.normalScale.toArray(),bumpScaleMetres:m.bumpScale,carvedMicroReliefRetained:true,scanCorrelatedWear:s.wear,clearcoat:m.clearcoat,AOMap:!!m.aoMap,emissive:m.emissive.toArray(),environment:m.envMap?'actual-scene-court-capture':'measured-outdoor-sky',captureHeightRole:m.userData.actualCourtCapture213,environmentGain:m.envMapIntensity};
  }),carvedOverrides:materials.filter(m=>m.name.startsWith('grand-hall-213-')&&m.name.endsWith('-real-carved197')).map(m=>({name:m.name,role:m.userData.hallTimber213?.role,normalMap:!!m.normalMap,bumpMap:!!m.bumpMap,bumpScaleMetres:m.bumpScale,bumpDimensions:m.bumpMap?[m.bumpMap.image.width,m.bumpMap.image.height]:null,roughnessScalar:m.roughness,actualRoughnessMap:m.roughnessMap?.userData,baseColor:m.color.toArray(),emissive:m.emissive.toArray(),actualCourtCapture:m.userData.actualCourtCapture213})),cameraExposureChanged:false,lightsAdded:0,visualAccepted:false};}};
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
