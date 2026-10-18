/** Dense woven brocade; every pattern pixel is produced by code, not a reference photo. */
import * as T from 'three';
function drawBrocade(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');if(!c)throw Error('Canvas2D unavailable for procedural fabric');
 c.fillStyle='#171612';c.fillRect(0,0,512,512);
 c.lineCap='round';c.lineJoin='round';
 // A restrained under-weave survives grazing light without large metal badges.
 for(let k=0;k<256;k++){c.strokeStyle=k%2?'#222018':'#1c1a15';c.lineWidth=.65;c.beginPath();c.moveTo(k*2,0);c.lineTo(k*2,512);c.stroke();c.strokeStyle=k%3?'#201d16':'#262117';c.beginPath();c.moveTo(0,k*2);c.lineTo(512,k*2);c.stroke();}
 function leaf(x,y,angle,scale=1){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.fillStyle='#b58a43';c.strokeStyle='#d6b273';c.lineWidth=1.4;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-22,-17,-25,-48,0,-73);c.bezierCurveTo(21,-45,18,-17,0,0);c.fill();c.stroke();c.strokeStyle='#67532e';c.lineWidth=1.8;c.beginPath();c.moveTo(0,-3);c.bezierCurveTo(-3,-24,1,-43,0,-63);c.stroke();c.restore();}
 function flower(x,y,r,turn=0){c.save();c.translate(x,y);c.rotate(turn);for(let ring=0;ring<2;ring++)for(let k=0;k<8;k++){const a=k*Math.PI/4+ring*Math.PI/8;c.save();c.rotate(a);c.fillStyle=ring?'#bb9858':'#93713d';c.strokeStyle='#d2b278';c.lineWidth=1.6;c.beginPath();c.moveTo(-4,-r*.16);c.bezierCurveTo(-r*.21,-r*.29,-r*.29,-r*.62,-r*.13,-r*.73);c.bezierCurveTo(-r*.21,-r*.90,-r*.10,-r*.98,0,-r);c.bezierCurveTo(r*.10,-r*.98,r*.21,-r*.90,r*.13,-r*.73);c.bezierCurveTo(r*.29,-r*.62,r*.21,-r*.29,4,-r*.16);c.closePath();c.fill();c.stroke();c.restore();}c.fillStyle='#d1ab61';c.beginPath();c.arc(0,0,r*.13,0,Math.PI*2);c.fill();c.restore();}
 // Seamless central medallion and corner rosettes with continuous curved stems.
 flower(256,256,102,.12);
 for(const x of [0,512])for(const y of [0,512])flower(x,y,73,.34);
 for(let side=0;side<4;side++){
  c.save();c.translate(256,256);c.rotate(side*Math.PI/2);c.strokeStyle='#b38f4d';c.lineWidth=3.0;c.beginPath();c.moveTo(38,-96);c.bezierCurveTo(135,-100,178,-216,118,-246);c.bezierCurveTo(72,-267,52,-209,92,-195);c.bezierCurveTo(121,-185,137,-222,109,-230);c.stroke();
  c.strokeStyle='#ddbd82';c.lineWidth=.8;c.beginPath();c.moveTo(41,-101);c.bezierCurveTo(133,-106,172,-216,117,-241);c.stroke();
  leaf(76,-124,.65,.49);leaf(120,-158,2.8,.44);leaf(130,-190,.1,.38);leaf(22,-156,-.5,.54);
  flower(-63,-167,30,.18);c.restore();
 }
 let seed=712347;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 // Sparse tiny flecks suggest broken threads; fixed seed keeps film frames stable.
 for(let i=0;i<620;i++){const x=random()*512,y=random()*512;c.fillStyle=i%3?'#8a7041':'#b69759';c.globalAlpha=.35;c.fillRect(x,y,.75+random(),.65+random());}c.globalAlpha=1;
 const texture=new T.CanvasTexture(canvas);texture.name='reference6-code-woven-brocade';texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=8;texture.needsUpdate=true;return texture;
}
export function createSanctuaryFabricStudy(temple){
 const root=temple.scene.getObjectByName('restoration-reference6-altar');if(!root)throw Error('Existing altar not found');
 const cushions=[],oldEmbroidery=[];root.traverse(o=>{if(!o.isMesh)return;if(o.geometry.userData.cushionContactY!==undefined)cushions.push(o);if(o.geometry.userData.cushionEmbroidery)oldEmbroidery.push(o);});
 if(cushions.length!==1||oldEmbroidery.length!==1)throw Error('Expected exactly the original cushion and its original coarse embroidery');
 const cushion=cushions[0],oldMaterial=cushion.material,oldVisibility=oldEmbroidery[0].visible;
 if(oldMaterial.name!=='restoration-black-brocade')throw Error('Unexpected cloth material');
 const texture=drawBrocade(),material=oldMaterial.clone();material.name='reference6-fine-woven-brocade';material.map=texture;material.color.set('#ffffff');material.roughness=.91;material.metalness=.02;
 const inherit=oldMaterial.onBeforeCompile,cache=oldMaterial.customProgramCacheKey.bind(oldMaterial);
 material.onBeforeCompile=(shader,renderer)=>{
  inherit.call(oldMaterial,shader,renderer);
  shader.vertexShader='varying vec3 vBrocadeLocal;varying vec3 vBrocadeNormal;\n'+shader.vertexShader;
  if(!shader.vertexShader.includes('#include <begin_vertex>'))throw Error('Pinned cloth vertex shader changed');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBrocadeLocal=vec3(position.x*1.02,position.y*.18,position.z*.47);vBrocadeNormal=normal;');
  shader.fragmentShader='varying vec3 vBrocadeLocal;varying vec3 vBrocadeNormal;\n'+shader.fragmentShader;
  const map=`#ifdef USE_MAP
vec3 clothWeight=pow(abs(normalize(vBrocadeNormal)),vec3(6.0));clothWeight/=max(dot(clothWeight,vec3(1.0)),.0001);
vec3 clothX=texture2D(map,vBrocadeLocal.zy/vec2(.22,.19)).rgb;
vec3 clothY=texture2D(map,vBrocadeLocal.xz/vec2(.24,.22)).rgb;
vec3 clothZ=texture2D(map,vBrocadeLocal.xy/vec2(.24,.19)).rgb;
vec3 clothColor=clothX*clothWeight.x+clothY*clothWeight.y+clothZ*clothWeight.z;
diffuseColor.rgb*=clothColor;
float referenceThreadMask=smoothstep(.018,.16,dot(clothColor,vec3(.2126,.7152,.0722)));
#else
float referenceThreadMask=0.0;
#endif`;
  if(!shader.fragmentShader.includes('#include <map_fragment>')||!shader.fragmentShader.includes('#include <roughnessmap_fragment>')||!shader.fragmentShader.includes('#include <metalnessmap_fragment>'))throw Error('Pinned cloth material shader changed');
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',map).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.91,.48,referenceThreadMask);').replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(.02,.66,referenceThreadMask);');
 };
 material.customProgramCacheKey=()=>cache()+':reference6-dense-brocade-triplanar-v1';material.needsUpdate=true;
 let active=false,disposed=false;
 function setEnabled(enabled){if(disposed)throw Error('Fabric study disposed');active=!!enabled;cushion.material=active?material:oldMaterial;oldEmbroidery[0].visible=active?false:oldVisibility;temple.renderer.shadowMap.needsUpdate=true;return info();}
 function info(){return{active,source:'Deterministic code-drawn woven motif, no photographic texture',cushionGeometryUnchanged:true,cushionTransformUnchanged:true,originalEmbroideryRetainedForRestore:true,textureSize:[512,512],physicalPatternPeriod:[.24,.19],material:'reference6-fine-woven-brocade',threadMetalness:.66,groundMetalness:.02};}
 return{setEnabled,info,dispose(){if(disposed)return;setEnabled(false);material.dispose();texture.dispose();disposed=true;}};
}
