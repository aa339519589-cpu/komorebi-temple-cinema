import * as T from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {buildRestorationAltar,buildRestorationHangingOrnaments} from './restoration-altar.js';
import {emitRestoredBuddha} from './restoration-buddha.js';

// Independent room, not a material patch over the exterior-world reconstruction.
// Metres, floorY=0; altar front +Z. Only generated geometry/textures, no photo planes.
export const REFERENCE6_FOUNDATION=Object.freeze({revision:'reference6-foundation-v1',roomWidth:13.6,ceilingY:7.2,backZ:-5.8,frontZ:10.0,altarOrigin:[0,.045,-2.3],camera:{position:[0,1.50,7.60],target:[0,2.15,-2.3],fov:68},sunDirection:[-1,.48,-.50],sunIntensity:6.4,sourceLimit:'Independent room, complete altar67480d and sculpturecd8930 reconstruction candidates. No photo acceptance.'});
function woodMap(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const c=canvas.getContext('2d'),im=c.createImageData(512,512);let seed=19473;const r=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){const u=x+.85*Math.sin(y*.019)+.35*Math.sin(y*.061);const v=230+5*Math.sin(u*.38)+4*Math.sin(u*1.77)+(r()-.5)*4,j=(y*512+x)*4;im.data[j]=im.data[j+1]=im.data[j+2]=v;im.data[j+3]=255;}c.putImageData(im,0,0);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;return map;
}
export function buildReference6Scene({reflectionSize=768,shadowSize=2048,roomCubeSize=128}={}){
 const scene=new T.Scene();scene.background=new T.Color('#dce8f6').multiplyScalar(2.1);const architecture=new T.Group();architecture.name='reference6-independent-room';scene.add(architecture);const wood=woodMap();
 const materials={
  column:new T.MeshPhysicalMaterial({name:'reference6-red-lacquer-column',color:'#963a25',map:wood,bumpMap:wood,bumpScale:.0012,roughness:.25,metalness:0,clearcoat:.8,clearcoatRoughness:.17}),
  beam:new T.MeshStandardMaterial({name:'reference6-red-brown-ceiling-timber',color:'#71341f',map:wood,bumpMap:wood,bumpScale:.0015,roughness:.39}),
  dark:new T.MeshStandardMaterial({name:'reference6-deep-brown-recess',color:'#21110b',map:wood,roughness:.42}),
  floor:new T.MeshStandardMaterial({name:'reference6-varnished-red-brown-floor-body',color:'#60341f',map:wood,bumpMap:wood,bumpScale:.0005,roughness:.26}),
  black:new T.MeshPhysicalMaterial({name:'reference6-black-lacquer-recess',color:'#090806',roughness:.27,clearcoat:.65,clearcoatRoughness:.2}),
  gold:new T.MeshStandardMaterial({name:'reference6-cast-gilt',color:'#f6cf83',metalness:.97,roughness:.23}),
  oldgold:new T.MeshStandardMaterial({name:'reference6-carved-gilt-recess',color:'#d7a856',metalness:.94,roughness:.32}),
  buddha:new T.MeshStandardMaterial({name:'reference6-statue-gilt',color:'#f2c572',metalness:.98,roughness:.25}),
  hair:new T.MeshStandardMaterial({name:'reference6-dark-sculpture-hair',color:'#19170e',roughness:.65,metalness:0}),
  ivory:new T.MeshStandardMaterial({name:'reference6-painted-coffer-ivory',color:'#e1cfa7',roughness:.75}),
  mat:new T.MeshStandardMaterial({name:'reference6-woven-straw',color:'#c7b78d',roughness:.91}),
 };
 const blockers=[],apertures=[],pillarRoots=[];
 function mesh(g,m,p=[0,0,0],rot=null,parent=architecture){const o=new T.Mesh(g,m);o.position.fromArray(p);if(rot)o.rotation.set(...rot);o.castShadow=true;o.receiveShadow=true;parent.add(o);blockers.push(o);return o;}
 const box=(p,s,m=materials.beam)=>mesh(new T.BoxGeometry(...s),m,p);
 const cylinder=(p,r,h,m=materials.column)=>mesh(new T.CylinderGeometry(r,r*1.015,h,48),m,p);
 box([0,-.13,2.1],[13.8,.24,16.2],materials.dark);
 for(let i=0;i<30;i++){const x=-6.6+(i+.5)*.44;const board=box([x,-.025,2.1],[.436,.05,16.0],materials.floor);board.name='reference6-long-polished-floorboard';}
 box([0,3.6,-5.8],[13.8,7.2,.26],materials.dark);box([0,3.6,10.2],[13.8,7.2,.24],materials.dark);
 for(const side of [-1,1]){
  const x=side*6.8;
  box([x,.43,2.1],[.24,.86,16],materials.beam);box([x,6.48,2.1],[.30,1.44,16],materials.beam);
  for(let b=0;b<6;b++){
   const z=-4.5+b*2.4,width=2.16,bottom=.94,top=5.76;
   for(const zz of [z-width/2-.06,z+width/2+.06])box([x,3.32,zz],[.27,4.98,.12],materials.column);
   for(const yy of [bottom-.05,top+.05])box([x,yy,z],[.29,.10,width+.14],materials.beam);
   // Actual voids between slender timber lattice, not an opaque or emissive window plane.
   for(let k=1;k<13;k++)box([x,3.35,z-width/2+k*width/13],[.045,top-bottom,.022],materials.beam);
   for(let k=1;k<18;k++)box([x,bottom+k*(top-bottom)/18,z],[.045,.018,width],materials.beam);
   apertures.push({side,x,z,bottom,top,width,unobstructedSideExterior:true});
  }
 }
 // Complete ceiling and red cross frames. No unrelated exterior roofs participate.
 box([0,7.25,2.1],[14.2,.16,16.4],materials.dark);
 for(const z of [-4.8,-1.6,1.6,4.8,8.0])box([0,6.98,z],[13.8,.40,.30],materials.beam);
 for(const x of [-6.7,-4.6,-2.3,0,2.3,4.6,6.7])box([x,7.05,2.1],[.25,.30,16],materials.beam);
 for(const side of [-1,1])for(const z of [-4.8,-1.6,5.6]){
  const x=side*(z===5.6?6.25:4.6);box([x,.10,z],[.92,.20,.92],materials.black);const o=cylinder([x,3.55,z],.39,6.7);o.name='reference6-red-column';pillarRoots.push(o);
  for(const y of [.25,6.80]){cylinder([x,y,z],.42,.10,materials.oldgold);box([x,y+.11,z],[.88,.12,.88],materials.black);}
  box([x,6.72,z],[1.25,.22,.9],materials.beam);
 }
 for(const x of [-5.55,-3.4,3.4,5.55])for(const z of [-3.4,-.2,3.0,6.2]){
  box([x,7.10,z],[1.65,.035,2.5],materials.ivory);
  for(const dx of [-.80,.80])box([x+dx,7.065,z],[.035,.035,2.5],materials.black);
  for(const dz of [-1.22,1.22])box([x,7.064,z+dz],[1.65,.035,.035],materials.black);
  for(let k=0;k<8;k++){let a=k*Math.PI/4;const leaf=mesh(new T.SphereGeometry(1,10,6),materials.oldgold,[x+Math.cos(a)*.28,7.045,z+Math.sin(a)*.28]);leaf.scale.set(.22,.012,.09);leaf.rotation.y=-a;}
 }
 // Black rear cupboards and framed gold fields are spatial recesses, not yellow walls.
 for(let i=0;i<8;i++){const x=-5.95+i*1.70;box([x,3.35,-5.62],[1.55,5.5,.06],materials.black);for(const dx of[-.75,.75])box([x+dx,3.35,-5.565],[.018,5.5,.018],materials.oldgold);}
 // Separate straw rectangles retain a wide reflective central aisle.
 for(const side of[-1,1])for(const z of[3.1,5.8]){box([side*4.75,.013,z],[3.65,.026,2.45],materials.mat);for(const dz of[-1.2,1.2])box([side*4.75,.029,z+dz],[3.65,.009,.035],materials.black);}
 const furniture=new T.Group();furniture.name='reference6-rebuilt-furnishings';furniture.position.fromArray(REFERENCE6_FOUNDATION.altarOrigin);scene.add(furniture);
 const altar=buildRestorationAltar({materials,layout:{sideFigureX:2.63,headHaloCenters:[4.813,4.208819]}}),hanging=buildRestorationHangingOrnaments({materials,layout:{sidePendantWidth:.60}});furniture.add(altar,hanging);
 // Near-black lacquer is geometry material, not a screen grade. Full independent
 // altar/sculpture reconstruction candidates are mounted at the unchanged local seats.
 for(const root of[altar,hanging])root.traverse(o=>{if(!o.isMesh)return;if(o.material.name==='restoration-black-brown-lacquer'){o.material.color.set('#080706');o.material.roughness=.25;}if(o.material.name==='restoration-lantern-warm-paper'){o.material.color.set('#fff0cd');o.material.emissive.set('#ffd68b');o.material.emissiveIntensity=1.3;o.castShadow=false;}});
 const sculptures=new T.Group();sculptures.name='reference6-rebuilt-triad';furniture.add(sculptures);
 const emit=(g,key,x,y,z,sx,sy,sz)=>{if(!g?.isBufferGeometry)throw Error('Sculpture must emit actual geometry.');const m=new T.Mesh(g,key==='oldgold'?materials.hair:key==='gold'?materials.gold:materials.buddha);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;sculptures.add(m);};
 emitRestoredBuddha(emit,{x:0,y:3,z:0,scale:2.1/3.26,widthScale:1.75/1.35,depthScale:1.75/1.28});for(const side of[-1,1])emitRestoredBuddha(emit,{variant:side<0?'left':'right',x:side*2.63,y:2.85,z:-.08,scale:1.45/3.26,widthScale:1.75/1.35,depthScale:1.75/1.28});
 const sun=new T.DirectionalLight('#fff0d9',REFERENCE6_FOUNDATION.sunIntensity);sun.name='reference6-physical-left-window-daylight';sun.target.position.set(0,2.6,1.2);sun.position.copy(sun.target.position).addScaledVector(new T.Vector3(...REFERENCE6_FOUNDATION.sunDirection).normalize(),40);sun.castShadow=true;sun.shadow.mapSize.set(shadowSize,shadowSize);Object.assign(sun.shadow.camera,{left:-12,right:12,top:11,bottom:-11,near:1,far:90});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00008;sun.shadow.normalBias=.009;sun.shadow.radius=1.1;scene.add(sun,sun.target);
 // Diffuse sky admitted at actual window rectangles. RectArea proxy is explicitly
 // unshadowed, low energy, not a frontal key. Direct sun provides the real shadows.
 RectAreaLightUniformsLib.init();const windowSky=[];
 for(const side of[-1,1])for(const z of[-2.6,3.2]){const l=new T.RectAreaLight('#dfeaff',side<0?.75:.28,5.2,4.6);l.name='reference6-side-window-diffuse-sky-proxy';l.position.set(side*6.60,3.35,z);l.lookAt(0,3.0,z+.1);scene.add(l);windowSky.push(l);}
 const practicals=[];for(const side of[-1,1]){const l=new T.PointLight('#ffc577',4.0,3.5,2);l.name='reference6-floor-lantern-source';l.position.set(side*3.2-.025,1.35,-.12);l.castShadow=true;l.shadow.mapSize.set(256,256);l.shadow.bias=-.00015;l.shadow.normalBias=.008;scene.add(l);practicals.push(l);}
 const floor=new Reflector(new T.PlaneGeometry(13.4,15.8),{textureWidth:reflectionSize,textureHeight:reflectionSize,clipBias:.002,multisample:0,color:0xffffff});floor.name='reference6-polished-floor-reflection';floor.rotation.x=-Math.PI/2;floor.position.set(0,.004,2.1);floor.material.transparent=true;floor.material.depthWrite=false;floor.material.uniforms.reference6ReflectionLod={value:.35};const ft=floor.getRenderTarget().texture;ft.generateMipmaps=true;ft.minFilter=T.LinearMipmapLinearFilter;const fm=floor.material;
 fm.vertexShader=fm.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv;varying vec3 vReferenceFloor;').replace('vUv = textureMatrix','vReferenceFloor=(modelMatrix*vec4(position,1.0)).xyz;vUv = textureMatrix');
 fm.fragmentShader=fm.fragmentShader.replace('varying vec4 vUv;','varying vec4 vUv;varying vec3 vReferenceFloor;uniform float reference6ReflectionLod;').replace('vec4 base = texture2DProj( tDiffuse, vUv );','vec4 base=vec4(texture2DLodEXT(tDiffuse,vUv.xy/vUv.w,reference6ReflectionLod).rgb,1.0);').replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',`vec3 d=cameraPosition-vReferenceFloor;float c=clamp(d.y/max(length(d),.0001),0.0,1.0);float f=.045+.955*pow(1.0-c,5.0);float q=fract((vReferenceFloor.x+6.6)/.44);float edge=min(q,1.0-q)*.44;float seam=smoothstep(.001,.004,edge);gl_FragColor=vec4(base.rgb,clamp(f*1.10,0.0,.88)*seam);`);floor.renderOrder=2;scene.add(floor);
 scene.updateMatrixWorld(true);let environment=null,cubeTarget=null,environmentInitialized=false;
 function initializeEnvironment(renderer){if(environmentInitialized)throw Error('Reference6 environment initialized once.');const prior=floor.visible;floor.visible=false;cubeTarget=new T.WebGLCubeRenderTarget(roomCubeSize,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});const cube=new T.CubeCamera(.08,60,cubeTarget);cube.position.set(0,4.35,.2);const pmrem=new T.PMREMGenerator(renderer);const oldShadowAuto=renderer.shadowMap.autoUpdate,oldShadowNeeds=renderer.shadowMap.needsUpdate;try{renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;cube.update(renderer,scene);environment=pmrem.fromCubemap(cubeTarget.texture);scene.environment=environment.texture;scene.environmentIntensity=1.0;environmentInitialized=true;}catch(error){renderer.shadowMap.autoUpdate=oldShadowAuto;renderer.shadowMap.needsUpdate=oldShadowNeeds;environment?.dispose();cubeTarget.dispose();throw error;}finally{floor.visible=prior;pmrem.dispose();}cubeTarget.dispose();cubeTarget=null;renderer.shadowMap.autoUpdate=false;}
 const depthExclusions=[];scene.traverse(o=>{if(o.isMesh&&(o===floor||o.userData.excludeFromOpaqueDepth||o.material.transparent||o.material.transmission>0))depthExclusions.push(o);});
 return{scene,architecture,materials,sun,windowSky,practicals,floor,altar,hanging,sculptures,furniture,apertures,blockers,pillarRoots,depthExclusions,initializeEnvironment,configuration:REFERENCE6_FOUNDATION,limits:['Independent room with complete reconstructed altar67480d and sculpturecd8930, not yet visually accepted.','Low-energy RectArea window-sky proxies have no own occlusion; direct sun and lantern shadows are geometric.','One room reflection capture is not iterative global illumination.','No camera/geometry/color photographic acceptance until actual comparison.']};
}
