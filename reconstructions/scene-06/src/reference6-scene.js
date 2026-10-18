import * as T from 'three';
import {createReference6ColumnCollar} from './reference6-column-collar.js';
import {createReference6CofferRelief} from './reference6-coffer-relief.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {buildRestorationAltar,buildRestorationHangingOrnaments} from './restoration-altar.js';
import {emitRestoredBuddha} from './restoration-buddha.js';

// Independent room, not a material patch over the exterior-world reconstruction.
// Metres, floorY=0; altar front +Z. Only generated geometry/textures, no photo planes.
export const REFERENCE6_FOUNDATION=Object.freeze({revision:'scene-06-grazing-light-r8',roomWidth:13.6,ceilingY:7.2,backZ:-5.8,frontZ:10.0,altarOrigin:[0,.045,-2.3],camera:{position:[0,.58,8.40],target:[0,2.40,-2.3],fov:62},sunDirection:[-1,.68,-.78],sunIntensity:42.0,sourceLimit:'Independent room, complete altar7365af and sculpture5338dd reconstruction candidates. No photo acceptance.'});
function woodMap(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const c=canvas.getContext('2d'),im=c.createImageData(512,512);let seed=19473;const r=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){const u=x+.85*Math.sin(y*.019)+.35*Math.sin(y*.061);const v=230+5*Math.sin(u*.38)+4*Math.sin(u*1.77)+(r()-.5)*4,j=(y*512+x)*4;im.data[j]=im.data[j+1]=im.data[j+2]=v;im.data[j+3]=255;}c.putImageData(im,0,0);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;return map;
}
// A repeatable physical woven-straw surface, not photographed pixels.
function strawWeave(){
 const n=256,bytes=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const reed=.5+.5*Math.cos(y*Math.PI/4),tie=.5+.5*Math.cos(x*Math.PI/32);
  const fibre=.5+.5*Math.sin(x*1.37+y*.19);
  const v=185+46*reed-12*Math.pow(tie,16)+5*fibre,j=4*(y*n+x);
  bytes[j]=bytes[j+1]=bytes[j+2]=v;bytes[j+3]=255;
 }
 const t=new T.DataTexture(bytes,n,n,T.RGBAFormat);t.colorSpace=T.SRGBColorSpace;
 t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;
}
export function buildReference6Scene({reflectionSize=768,shadowSize=2048,roomCubeSize=128}={}){
 const scene=new T.Scene();scene.background=new T.Color('#ead4aa').multiplyScalar(1.3);const architecture=new T.Group();architecture.name='reference6-independent-room';scene.add(architecture);const wood=woodMap();
 const materials={
  column:new T.MeshPhysicalMaterial({name:'reference6-red-lacquer-column',color:'#963a25',map:wood,bumpMap:wood,bumpScale:.0012,roughness:.38,metalness:0,clearcoat:.22,clearcoatRoughness:.28}),
  beam:new T.MeshStandardMaterial({name:'reference6-red-brown-ceiling-timber',color:'#71341f',map:wood,bumpMap:wood,bumpScale:.0015,roughness:.39}),
  dark:new T.MeshStandardMaterial({name:'reference6-deep-brown-recess',color:'#21110b',map:wood,roughness:.78}),
  floor:new T.MeshPhysicalMaterial({name:'reference6-varnished-red-brown-floor-body',color:'#68301c',map:wood,bumpMap:wood,bumpScale:.00038,roughness:.23,clearcoat:.72,clearcoatRoughness:.17}),
  rearPanel:new T.MeshStandardMaterial({name:'reference6-rough-shadowed-rear-wood',color:'#170b06',map:wood,bumpMap:wood,bumpScale:.0012,roughness:.80,metalness:0}),
  black:new T.MeshPhysicalMaterial({name:'reference6-black-lacquer-recess',color:'#090806',roughness:.27,clearcoat:.65,clearcoatRoughness:.2}),
  gold:new T.MeshStandardMaterial({name:'reference6-cast-gilt',color:'#c49233',metalness:.92,roughness:.36}),
  oldgold:new T.MeshStandardMaterial({name:'reference6-carved-gilt-recess',color:'#ac7424',metalness:.90,roughness:.38}),
  buddha:new T.MeshStandardMaterial({name:'reference6-statue-gilt',color:'#c69a43',metalness:.72,roughness:.35}),
  hair:new T.MeshStandardMaterial({name:'reference6-dark-sculpture-hair',color:'#332719',roughness:.52,metalness:.30}),
  ivory:new T.MeshStandardMaterial({name:'reference6-painted-coffer-ivory',color:'#aa8f66',roughness:.82}),
  cofferPaint:new T.MeshStandardMaterial({name:'reference6-coffer-dark-floral-paint',color:'#4a2e17',roughness:.80,metalness:0}),
  cofferGilt:new T.MeshStandardMaterial({name:'reference6-coffer-muted-gilt-paint',color:'#997126',roughness:.58,metalness:.38}),
  ceilingWood:new T.MeshStandardMaterial({name:'reference6-central-timber-ceiling',color:'#683722',map:wood,roughness:.72,bumpMap:wood,bumpScale:.001}),
  mat:new T.MeshStandardMaterial({name:'reference6-woven-straw',color:'#bda477',roughness:.91,bumpScale:.00045}),
 };
 materials.sculptureRecess=new T.MeshStandardMaterial({name:'scene06-recessed-gilt-anatomy',color:'#604018',metalness:.78,roughness:.43});
 materials.handGold=materials.buddha.clone();materials.handGold.name='scene06-cast-palm-gilt';materials.handGold.metalness=.92;materials.handGold.roughness=.29;
 materials.faceGold=materials.buddha.clone();materials.faceGold.name='scene06-polished-gilt-face';materials.faceGold.roughness=.32;materials.faceGold.metalness=.68;materials.faceGold.color.set('#cda44f');
 materials.statueGold=materials.gold.clone();materials.statueGold.name='reference6-statue-ornament-private-gilt';
 const blockers=[],apertures=[],pillarRoots=[];
 const columnCollar=createReference6ColumnCollar();
 function mesh(g,m,p=[0,0,0],rot=null,parent=architecture){const o=new T.Mesh(g,m);o.position.fromArray(p);if(rot)o.rotation.set(...rot);o.castShadow=true;o.receiveShadow=true;parent.add(o);blockers.push(o);return o;}
 const box=(p,s,m=materials.beam)=>mesh(new T.BoxGeometry(...s),m,p);
 const cylinder=(p,r,h,m=materials.column)=>mesh(new T.CylinderGeometry(r,r*1.015,h,48),m,p);
 box([0,-.13,2.1],[13.8,.24,16.2],materials.dark);
 for(let i=0;i<19;i++){
  const x=-6.84+(i+.5)*.72,offset=(i%3)*.58;
  for(let k=-1;k<10;k++){
   const lo=Math.max(-5.9,-5.9+k*1.74+offset),hi=Math.min(10.1,-5.9+(k+1)*1.74+offset);if(hi<=lo)continue;
   const m=materials.floor.clone();m.color.multiplyScalar(.91+.15*((i*13+k*7+71)%19)/18);const grain=wood.clone();grain.repeat.set(.6,(hi-lo)/.8);grain.offset.set((i*17%31)/31,(k*11%23)/23);grain.needsUpdate=true;m.map=m.bumpMap=grain;
   const board=box([x,-.025,(lo+hi)/2],[.7193,.05,hi-lo-.0008],m);board.name='scene06-jointed-polished-floorboard';
  }
 }
 box([0,3.6,-5.8],[13.8,7.2,.26],materials.dark);// Inferred broad entrance behind the camera, not a black reflection trap.
 box([-5.35,3.6,10.2],[3.1,7.2,.24],materials.dark);box([5.35,3.6,10.2],[3.1,7.2,.24],materials.dark);box([0,6.80,10.2],[7.6,.80,.24],materials.beam);box([0,.065,10.2],[7.6,.13,.24],materials.beam);
 // Photo-led receiving-domain reconstruction: real opaque wall fields separate
 // low front daylight openings from one upper middle clerestory. These are not
 // screen masks or selective material lighting flags. Every panel casts shadows.
 for(const side of [-1,1]){
  const x=side*6.8;
  box([x,.43,2.1],[.24,.86,16],materials.beam);box([x,7.05,2.1],[.30,.30,16],materials.beam);
  const bays=[
   {bottom:1.05,top:5.60,width:1.70,kind:'rear-daylight-window'},
   {bottom:1.05,top:5.60,width:1.70,kind:'rear-daylight-window'},
   {bottom:1.05,top:4.70,width:1.70,kind:'middle-daylight-window'},
   {bottom:1.05,top:2.70,width:1.70,kind:'front-low-daylight'},
   {bottom:1.05,top:2.45,width:1.70,kind:'front-low-daylight'},
   {bottom:.75,top:2.70,width:2.16,kind:'front-low-daylight'}
  ];
  for(let b=0;b<6;b++){
   const z=-4.5+b*2.4,{width,bottom,top,kind}=bays[b];
   box([x,bottom/2,z],[.24,bottom,2.4],materials.beam);
   box([x,(top+7.2)/2,z],[.24,7.2-top,2.4],materials.beam);
   const sideWidth=(2.4-width)/2;
   for(const sign of[-1,1])box([x,(bottom+top)/2,z+sign*(width/2+sideWidth/2)],[.24,top-bottom,sideWidth],materials.beam);
   for(const zz of[z-width/2-.045,z+width/2+.045])box([x,(bottom+top)/2,zz],[.28,top-bottom+.16,.09],materials.column);
   for(const yy of[bottom-.045,top+.045])box([x,yy,z],[.28,.09,width+.18],materials.beam);
   // Sliding timber shutters occupy part of each bay; the remaining
   // real openings preserve bright shafts through an otherwise dark hall.
   const shutterWidth=side<0?(b%2?.46:.28):.66;
   box([x-side*.10,(bottom+top)/2,z+(width-shutterWidth)/2],[.065,top-bottom,shutterWidth],materials.dark);
   for(let rail=0;rail<4;rail++)box([x-side*.15,bottom+(rail+.5)*(top-bottom)/4,z+(width-shutterWidth)/2],[.035,.035,shutterWidth],materials.beam);
   const columns=Math.ceil(width/.16),rows=Math.ceil((top-bottom)/.17);
   for(let k=1;k<columns;k++)box([x,(bottom+top)/2,z-width/2+k*width/columns],[.045,top-bottom,.012],materials.beam);
   for(let k=1;k<rows;k++)box([x,bottom+k*(top-bottom)/rows,z],[.045,.011,width],materials.beam);
   apertures.push({side,x,z,bottom,top,width,kind,unobstructedSideExterior:true});
  }
  // Close the old unframed end gaps; the next room is not an infinite side light.
  box([x,3.6,9.40],[.24,7.2,1.40],materials.beam);
  box([x,3.6,-5.80],[.24,7.2,.20],materials.beam);
 }
 // Complete ceiling and red cross frames. No unrelated exterior roofs participate.
 box([0,7.25,2.1],[14.2,.16,16.4],materials.dark);
 for(const z of [-4.8,-1.6,1.6,4.8,8.0])box([0,6.98,z],[13.8,.40,.30],materials.beam);
 for(const x of [-6.7,-4.6,-2.3,0,2.3,4.6,6.7])box([x,7.05,2.1],[.25,.30,16],materials.beam);
 for(const side of [-1,1])for(const z of [-4.8,-.8,5.6]){
  const x=side*(z===5.6?6.25:z===-.8?4.0:4.6);box([x,.10,z],[.92,.20,.92],materials.black);const o=cylinder([x,3.55,z],.39,6.7);o.name='reference6-red-column';pillarRoots.push(o);
  // Broad black-lacquer and gilt column cuffs visible in the photograph,
  // replacing the previous thin plain rings. The scroll relief is real geometry.
  for(const [y,h]of[[.40,.46],[6.57,.30]]){
   const cuff=mesh(columnCollar.body,materials.black,[x,y,z]);cuff.scale.y=h/.46;
   const vines=mesh(columnCollar.relief,materials.oldgold,[x,y,z]);vines.scale.y=h/.46;
   for(const yy of[y-h/2,y+h/2])cylinder([x,yy,z],.435,.026,materials.gold);
  }
  box([x,6.80,z],[.88,.12,.88],materials.black);
  box([x,6.72,z],[1.25,.22,.9],materials.beam);
 }
 // Original ceiling: pale floral coffer lanes separated by broad red-brown
 // timber, not the previous wall-to-wall mechanical ivory flower grid.
 const cofferRelief=createReference6CofferRelief();
 for(let i=0;i<16;i++)box([-1.875+i*.25,7.13,2.1],[.245,.035,16.0],materials.ceilingWood);
 for(const strip of[-5.55,-3.4,3.4,5.55])for(const dx of[-.42,.42])for(let row=0;row<10;row++){
  const x=strip+dx,z=-4.5+row*1.38;
  box([x,7.10,z],[.785,.035,1.30],z<0?materials.black:materials.ivory);
  for(const xx of[-.385,.385])box([x+xx,7.065,z],[.028,.040,1.30],materials.black);
  for(const zz of[-.63,.63])box([x,7.064,z+zz],[.785,.040,.028],materials.black);
  mesh(cofferRelief.paint,materials.cofferPaint,[x,7.0825,z]);
  mesh(cofferRelief.gilt,materials.cofferGilt,[x,7.0825,z]);
 }
 // Fine cast mounts on black beam faces and recessed rear fields.
 for(const z of[-4.8,-1.6,1.6,4.8,8.0]){
  box([0,6.98,z+.165],[13.4,.22,.040],materials.black);
  for(const y of[6.88,7.08])box([0,y,z+.191],[13.4,.008,.014],materials.oldgold);
  for(const x of[-5.7,-4.6,-3.4,-2.3,0,2.3,3.4,4.6,5.7]){
   const mount=mesh(cofferRelief.gilt,materials.gold,[x,6.98,z+.20],[-Math.PI/2,0,0]);mount.scale.setScalar(.21);
  }
 }
 // Black rear cupboards and framed gold fields are spatial recesses, not yellow walls.
 for(let i=0;i<8;i++){
  const x=-5.95+i*1.70;
  box([x,3.35,-5.62],[1.55,5.5,.06],materials.rearPanel);
  // Actual forward timber framing leaves the dark field recessed in depth.
  for(const dx of[-.78,.78])box([x+dx,3.35,-5.49],[.11,5.68,.22],materials.beam);
  for(const yy of[.56,3.50,6.14])box([x,yy,-5.49],[1.67,.12,.22],materials.beam);
 }
 box([0,6.42,-5.40],[13.6,.28,.36],materials.beam);
 // The original photograph has a transverse woven prayer-mat band, not
 // an empty central aisle. Side mats continue a little toward the camera;
 // the nearest foreground returns to reflective wood. All are true receivers.
 const prayerMats=[],weave=strawWeave();
 for(const [x,z,w,d]of[[0,2.82,4.00,.84],[-4.025,3.275,3.95,1.75],[4.025,3.275,3.95,1.75]]){
  const material=materials.mat.clone(),map=weave.clone();map.repeat.set(w/.32,d/.32);map.needsUpdate=true;material.map=material.bumpMap=map;
  const mat=box([x,.016,z],[w,.032,d],material);mat.name='reference6-woven-prayer-mat';prayerMats.push(mat);
  for(const dz of[-d/2,d/2])box([x,.034,z+dz],[w+.026,.008,.026],materials.black);
  for(const dx of[-w/2,w/2])box([x+dx,.034,z],[.026,.008,d],materials.black);
 }

 const furniture=new T.Group();furniture.name='reference6-rebuilt-furnishings';furniture.position.fromArray(REFERENCE6_FOUNDATION.altarOrigin);scene.add(furniture);
 const layout={terraceWidths:[4.9,5.12,5.42,5.67,6.05],carvedFrontWidths:[4.20,4.43,4.75],centralCanopy:[0,6.92,2.80,1.12,.88,.27,true],hangingCeilingContacts:[7.20,6.82,7.01],floorLampX:2.90,floorLampScale:.90,sidePendantX:3.50,sidePendantY:6.55,sidePendantLength:2.95,floorVaseX:4.50,floorUrnX:3.92,upperVaseX:2.93,sideFigureX:2.20,innerRitualLotusX:1.48,innerRitualLotusZ:.40,outerRitualLotusX:2.68,outerRitualLotusZ:.40,throneCompensation:[1,1],headHaloCenters:[3+(2.38/3.26)*2.815,2.85+(1.60/3.26)*3.055],mandorlaApexY:[6.75,5.30],sidePendantWidth:.60};const altar=buildRestorationAltar({materials,layout}),hanging=buildRestorationHangingOrnaments({materials,layout});furniture.add(altar,hanging);
 // Near-black lacquer is geometry material, not a screen grade. Full independent
 // altar/sculpture reconstruction candidates are mounted at the unchanged local seats.
 for(const root of[altar,hanging])root.traverse(o=>{if(!o.isMesh)return;if(o.material.name==='restoration-black-brown-lacquer'){o.material.color.set('#030201');o.material.roughness=.32;}if(o.material.name==='restoration-lantern-warm-paper'){o.material.color.set('#fff0cd');o.material.emissive.set('#ffd68b');o.material.emissiveIntensity=1.3;o.castShadow=false;}});
 const sculptures=new T.Group();sculptures.name='reference6-rebuilt-triad';furniture.add(sculptures);
 const emit=(g,key,x,y,z,sx,sy,sz)=>{if(!g?.isBufferGeometry)throw Error('Sculpture must emit actual geometry.');const m=new T.Mesh(g,key==='hand'?materials.handGold:key==='face'?materials.faceGold:key==='crease'?materials.sculptureRecess:key==='oldgold'?materials.hair:key==='gold'?materials.statueGold:materials.buddha);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;sculptures.add(m);};
 for(const [i,seat]of altar.userData.figureSeatAnchors.entries())emitRestoredBuddha(emit,{variant:['central','left','right'][i],x:seat[0],y:seat[1],z:seat[2],scale:(i===0?2.38:1.60)/3.26,widthScale:i===0?.98:.94,depthScale:1});
 const sun=new T.DirectionalLight('#ffe0a7',REFERENCE6_FOUNDATION.sunIntensity);sun.name='reference6-physical-left-window-daylight';sun.target.position.set(0,2.6,1.2);sun.position.copy(sun.target.position).addScaledVector(new T.Vector3(...REFERENCE6_FOUNDATION.sunDirection).normalize(),40);sun.castShadow=true;sun.shadow.mapSize.set(shadowSize,shadowSize);Object.assign(sun.shadow.camera,{left:-12,right:12,top:11,bottom:-11,near:1,far:90});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00008;sun.shadow.normalBias=.009;sun.shadow.radius=3.0;scene.add(sun,sun.target);
 // Diffuse sky admitted at actual window rectangles. RectArea proxy is explicitly
 // unshadowed, low energy, not a frontal key. Direct sun provides the real shadows.
 RectAreaLightUniformsLib.init();const windowSky=[];
 for(const side of[-1,1])for(const z of[-2.6,3.2]){const l=new T.RectAreaLight('#dfeaff',side<0?.40:.16,5.2,4.6);l.name='reference6-side-window-diffuse-sky-proxy';l.position.set(side*6.60,3.35,z);l.lookAt(0,3.0,z+.1);scene.add(l);windowSky.push(l);}
 // Broad entrance-sky and sunlit-floor reflection proxies establish the
 // photographed warm front field. These are explicitly unshadowed indirect
 // transport approximations, not a hidden frontal spot or a global grade.
 // Finite six-position quadrature of the inferred front window field. Unlike
 // the old RectArea proxy these real incident sources retain scene occlusion.
 const frontWindowSources=[];
 for(const y of[4.05,6.05])for(const x of[-3.65,-1.0,1.65]){
  const light=new T.SpotLight('#ffe5bb',35,30,.36,.45,2);
  light.name='reference6-shadowed-front-window-field';light.position.set(x,y,10.05);
  light.target.position.set(0,3.8,-2.3);light.castShadow=true;light.shadow.mapSize.set(1024,1024);
  light.shadow.camera.near=.10;light.shadow.camera.far=30;light.shadow.bias=-.00008;light.shadow.normalBias=.002;light.shadow.radius=5;
  scene.add(light,light.target);frontWindowSources.push(light);
 }
 const warmBounce=new T.HemisphereLight('#ffe2a7','#5d4023',.65);warmBounce.name='scene06-warm-diffuse-room-return';scene.add(warmBounce);
 const portalKey=new T.RectAreaLight('#ffdb9c',3.4,4.8,2.8);portalKey.name='scene06-entrance-warm-head-field';portalKey.position.set(0,5.4,7.0);portalKey.lookAt(0,4.8,-2.3);scene.add(portalKey);windowSky.push(portalKey);
 const floorBounce=new T.RectAreaLight('#ffd69c',1.30,4.0,3.0);floorBounce.name='reference6-sunlit-floor-bounce-proxy';floorBounce.position.set(0,.18,3.2);floorBounce.lookAt(0,4.2,-2.3);scene.add(floorBounce);windowSky.push(floorBounce);
 const practicals=[];for(const side of[-1,1]){const l=new T.PointLight('#ffc577',1.4,2.2,2);l.name='reference6-floor-lantern-source';l.position.set(side*3.2-.025,1.35,-.12);l.castShadow=true;l.shadow.mapSize.set(256,256);l.shadow.bias=-.00015;l.shadow.normalBias=.008;scene.add(l);practicals.push(l);}
 const floor=new Reflector(new T.PlaneGeometry(13.4,15.8),{textureWidth:reflectionSize,textureHeight:reflectionSize,clipBias:.002,multisample:0,color:0xffffff});floor.name='reference6-polished-floor-reflection';floor.rotation.x=-Math.PI/2;floor.position.set(0,.004,2.1);floor.material.transparent=true;floor.material.depthWrite=false;floor.material.uniforms.reference6ReflectionLod={value:.85};const ft=floor.getRenderTarget().texture;ft.generateMipmaps=true;ft.minFilter=T.LinearMipmapLinearFilter;const fm=floor.material;
 fm.vertexShader=fm.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv;varying vec3 vReferenceFloor;').replace('vUv = textureMatrix','vReferenceFloor=(modelMatrix*vec4(position,1.0)).xyz;vUv = textureMatrix');
 fm.fragmentShader=fm.fragmentShader.replace('varying vec4 vUv;','varying vec4 vUv;varying vec3 vReferenceFloor;uniform float reference6ReflectionLod;').replace('vec4 base = texture2DProj( tDiffuse, vUv );','float wear=.5+.5*sin(vReferenceFloor.x*2.8+vReferenceFloor.z*.91)*sin(vReferenceFloor.z*3.7-vReferenceFloor.x*1.14);float localLod=mix(.12,2.15,smoothstep(.18,.86,wear));vec2 footprint=mix(vec2(.65,1.5),vec2(2.1,4.8),wear)/768.0;float board=floor((vReferenceFloor.x+6.84)/.72);float phase=vReferenceFloor.z*3.4+board*1.73;vec2 surfaceWarp=vec2(sin(phase)*.60,sin(phase*.57+board)*1.8)/768.0;vec2 reflectionUV=vUv.xy/vUv.w+surfaceWarp;vec3 reflected=texture2DLodEXT(tDiffuse,reflectionUV,localLod).rgb*.16;for(int i=0;i<8;i++){float a=6.28318530718*(float(i)+.25)/8.0;vec2 d=vec2(cos(a),sin(a))*footprint;reflected+=texture2DLodEXT(tDiffuse,reflectionUV+d*.55,localLod).rgb*.075;reflected+=texture2DLodEXT(tDiffuse,reflectionUV+d,localLod).rgb*.03;}vec4 base=vec4(reflected,1.0);').replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',`vec3 d=cameraPosition-vReferenceFloor;float c=clamp(d.y/max(length(d),.0001),0.0,1.0);float f=(.055+.88*pow(1.0-c,5.0))*(.84+.16*(1.0-wear));float q=fract((vReferenceFloor.x+6.84)/.72);float edge=min(q,1.0-q)*.72;float seam=smoothstep(.0002,.0010,edge);float joint=mod(vReferenceFloor.z+5.9-mod(board,3.0)*.58,1.74);seam*=smoothstep(.0002,.0010,min(joint,1.74-joint));gl_FragColor=vec4(base.rgb,clamp(f*1.10,0.0,.88)*seam);`);floor.renderOrder=2;scene.add(floor);
 scene.updateMatrixWorld(true);let environment=null,statueEnvironment=null,environmentInitialized=false;
 function initializeEnvironment(renderer){
  if(environmentInitialized)throw Error('Reference6 environment initialized once.');
  const prior=floor.visible,oldShadowAuto=renderer.shadowMap.autoUpdate,oldShadowNeeds=renderer.shadowMap.needsUpdate,oldEnvironment=scene.environment;
  const pmrem=new T.PMREMGenerator(renderer),made=[];floor.visible=false;
  function capture(position){const target=new T.WebGLCubeRenderTarget(roomCubeSize,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});try{const camera=new T.CubeCamera(.08,60,target);camera.position.fromArray(position);camera.update(renderer,scene);const filtered=pmrem.fromCubemap(target.texture);made.push(filtered);return filtered;}finally{target.dispose();}}
  try{
   renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
   // Both captures see the same unseeded room. Do not bootstrap the second
   // capture from the first and accidentally count its indirect energy twice.
   scene.environment=null;environment=capture([.4,1.45,2.4]);statueEnvironment=capture([0,4.40,.5]);
   scene.environment=environment.texture;scene.environmentIntensity=1.0;
   materials.buddha.envMap=materials.handGold.envMap=materials.faceGold.envMap=statueEnvironment.texture;materials.statueGold.envMap=statueEnvironment.texture;
   materials.buddha.envMapIntensity=materials.handGold.envMapIntensity=materials.faceGold.envMapIntensity=materials.statueGold.envMapIntensity=1.0;
   environmentInitialized=true;
  }catch(error){scene.environment=oldEnvironment;renderer.shadowMap.autoUpdate=oldShadowAuto;renderer.shadowMap.needsUpdate=oldShadowNeeds;for(const target of made)target.dispose();throw error;}
  finally{floor.visible=prior;pmrem.dispose();}
 }
 const depthExclusions=[];scene.traverse(o=>{if(o.isMesh&&(o===floor||o.userData.excludeFromOpaqueDepth||o.material.transparent||o.material.transmission>0))depthExclusions.push(o);});
 return{scene,architecture,materials,sun,windowSky,frontWindowSources,practicals,floor,altar,hanging,sculptures,furniture,apertures,blockers,pillarRoots,prayerMats,depthExclusions,initializeEnvironment,layout,configuration:REFERENCE6_FOUNDATION,limits:['Small-radius screen-space geometric contact occlusion is a visibility approximation, not multi-bounce GI; reflections and off-screen occluders are not reconstructed by it.','Independent room with complete reconstructed altar7365af and sculpture5338dd, not yet visually accepted.','Side-window and sunlit-floor RectArea indirect proxies have no own occlusion; the inferred front field now has six real shadow-casting samples. This is finite source quadrature, not measured illumination or full GI.','Two spatial room environment captures (lower furnishings and higher triad) are local approximations, not iterative global illumination.','Front entrance outside the photograph is an inferred incident-radiance boundary, not a measured architectural claim. No photographic acceptance until actual comparison.']};
}
