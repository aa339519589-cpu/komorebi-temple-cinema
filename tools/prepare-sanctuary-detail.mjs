import {readFile,writeFile} from 'node:fs/promises';
function replaceOne(text,from,to){if(text.split(from).length!==2)throw Error('Unexpected source anchor: '+from.slice(0,100));return text.replace(from,to);}
let p=await readFile('src/sanctuary-production.js','utf8');
p=replaceOne(p,"import * as T from 'three';","import * as T from 'three';\nimport {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';\nimport {applySanctuaryCarvedDetail} from './sanctuary-carved-detail.js';");
p=replaceOne(p,'const buildMs=performance.now()-began;let lastView=null',"const carving=params.get('details')==='0'?null:applySanctuaryCarvedDetail(world);\nconst buildMs=performance.now()-began;let lastView=null");
p=replaceOne(p,'let hdr,scattered,finalTarget;',`let hdr,scattered,finalTarget,aoTarget;
let ao;const rng=Math.random;let seed=90371;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
try{ao=new GTAOPass(scene,camera,width,height)}finally{Math.random=rng}
ao.renderToScreen=false;ao.output=GTAOPass.OUTPUT.Default;ao.blendIntensity=.85;
ao.updateGtaoMaterial({radius:.26,thickness:.20,distanceExponent:1.2,distanceFallOff:1.0,scale:1,samples:24});
ao.updatePdMaterial({lumaPhi:8,depthPhi:2,normalPhi:3,radius:4,rings:3,samples:24});
const nativeOverride=ao._renderOverride.bind(ao);
ao._renderOverride=(...args)=>{const exclusions=[];scene.traverse(o=>{if(o.visible&&o.isMesh&&(o.isReflector||o.material?.transparent||o.material?.transmission>0)){exclusions.push(o);o.visible=false}});try{return nativeOverride(...args)}finally{exclusions.forEach(o=>o.visible=true)}};`);
p=replaceOne(p,'function createTargets(){',"function createTargets(){\n aoTarget=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:false,stencilBuffer:false});");
p=replaceOne(p,'hdr.dispose();scattered.dispose();finalTarget.dispose();','hdr.dispose();scattered.dispose();finalTarget.dispose();aoTarget.dispose();');
p=replaceOne(p,'camera.fov=view.fov||78;camera.updateProjectionMatrix();camera.updateMatrixWorld();',"camera.fov=view.fov||78;if(Number.isFinite(view.shiftY)&&view.shiftY!==0)camera.setViewOffset(width,height,0,Math.round(view.shiftY*height),width,height);else camera.clearViewOffset();camera.updateProjectionMatrix();camera.updateMatrixWorld();");
p=replaceOne(p,'let beauty=hdr;if(configuration?.scattering)',"let beauty=hdr;if(params.get('ao')!=='0'){ao.render(renderer,aoTarget,hdr);beauty=aoTarget;}if(configuration?.scattering)");
p=replaceOne(p,'atmosphere.render(renderer,scattered,hdr);','atmosphere.uniforms.sunColor.value.multiplyScalar(2.3);atmosphere.render(renderer,scattered,beauty);');
p=replaceOne(p,'lastView={position:camera.position.toArray(),target:[...view.target],fov:camera.fov,time};','lastView={position:camera.position.toArray(),target:[...view.target],fov:camera.fov,time,shiftY:view.shiftY||0};');
p=replaceOne(p,"revision:'v60-native-sanctuary-r5'","revision:'v60-sanctuary-carved-r12',carving:carving?.report,contactOcclusion:{enabled:params.get('ao')!=='0',radius:.26,blend:.85}");
p=replaceOne(p,'window.production={ready:true,','window.production={ready:true,carving,ao,');
await writeFile('src/sanctuary-detail-production.js',p);
let h=await readFile('sanctuary-production.html','utf8');h=replaceOne(h,'sanctuary-production.js','sanctuary-detail-production.js');await writeFile('sanctuary-detail.html',h);
let r=await readFile('tools/produce-sanctuary.mjs','utf8');
r=replaceOne(r,"const out='output/production'","const out='output/detail-production'");r=r.replaceAll("'tools/production-request.json'","'tools/detail-request.json'");
r=replaceOne(r,'/sanctuary-production.html?','/sanctuary-detail.html?');
r=replaceOne(r,"&scope=${request.scope||'interior'}`","&scope=${request.scope||'interior'}&details=${request.details===false?0:1}&ao=${request.ao===false?0:1}`");
await writeFile('tools/produce-sanctuary-detail.mjs',r);
console.log('Built additive detail production source and renderer; original source unchanged.');
