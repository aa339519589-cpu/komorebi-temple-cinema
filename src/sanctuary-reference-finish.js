/** Reversible reference-six finish study using actual geometry and scene lights. */
import * as T from 'three';
const KEY='reference6-finish-study';
const number=(v,min,max,label)=>{if(!Number.isFinite(v)||v<min||v>max)throw Error('Invalid '+label);return v;};
const tint=(v,label)=>{if(v!==null&&!/^#[0-9a-f]{6}$/i.test(v))throw Error('Invalid '+label);return v;};
export function createSanctuaryFinishStudy(temple){
 if(!temple?.scene?.isScene||typeof temple.renderReference!=='function')throw Error('Require the current temple scene');
 const scene=temple.scene,pendants=scene.getObjectByName('restoration-reference6-side-pendants');
 if(!pendants?.isGroup||pendants.getObjectByName(KEY))throw Error('Require one existing unmodified pendant assembly');
 const materials=new Set(),lights=[];
 scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.isMeshStandardMaterial)materials.add(m);if(o.isLight)lights.push(o);});
 const list=[...materials],find=name=>list.find(m=>m.name===name);
 const gilt=find('restoration-private-room-gold')||find('gold'),shadowGilt=find('restoration-private-room-oldgold')||find('oldgold');
 if(!gilt||!shadowGilt)throw Error('Existing shared gilt materials not found');
 const root=new T.Group();root.name=KEY;root.visible=false;pendants.add(root);
 root.userData={reference:6,scope:'Existing hanging standards only; camera, altar, statue and room dimensions unchanged',source:'Procedural geometry, no reference pixels loaded'};
 const ownedGeometry=[],ownedMaterial=[];
 const backing=new T.MeshStandardMaterial({name:'reference6-chased-gilt-backing',color:0x9d6529,metalness:.88,roughness:.39,envMap:shadowGilt.envMap,envMapIntensity:shadowGilt.envMapIntensity});ownedMaterial.push(backing);
 const slab=new T.BoxGeometry(.712,3.15,.012),bead=new T.SphereGeometry(1,8,6);ownedGeometry.push(slab,bead);
 const petalShape=new T.Shape();petalShape.moveTo(0,0);petalShape.bezierCurveTo(-.42,.18,-.40,.66,0,1);petalShape.bezierCurveTo(.40,.66,.42,.18,0,0);
 const petal=new T.ExtrudeGeometry(petalShape,{depth:.075,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.022,bevelThickness:.025,curveSegments:6});ownedGeometry.push(petal);
 const petalMatrices=[],beadMatrices=[];const dummy=new T.Object3D();
 const matrix=(x,y,z,sx,sy,sz,rz=0)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,0,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();return dummy.matrix.clone();};
 for(const side of [-1,1]){
  const board=new T.Mesh(slab,backing);board.name='reference6-pendant-chased-base-'+side;board.position.set(side*4.15,6.30-1.60,2.026);board.castShadow=board.receiveShadow=true;root.add(board);
  for(let row=0;row<20;row++)for(let col=0;col<3;col++){
   const cx=side*4.15+(col-1)*.211+(row%2?-.016:.016),cy=6.30-.100-row*.155,angle=(row%3)*.13+col*.19;
   for(let k=0;k<6;k++){const a=k*Math.PI/3+angle;petalMatrices.push(matrix(cx,cy,2.034,.042,.068,.060,-a));}
   beadMatrices.push(matrix(cx,cy,2.043,.009,.009,.006));
  }
  for(const edge of [-1,1])for(let n=0;n<104;n++)beadMatrices.push(matrix(side*4.15+edge*.343,6.30-.045-n*.0301,2.036,.0042,.0057,.0042));
 }
 function instances(geometry,material,matrices,name){const mesh=new T.InstancedMesh(geometry,material,matrices.length);mesh.name=name;matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();root.add(mesh);return mesh;}
 instances(petal,gilt,petalMatrices,'reference6-pendant-fine-cast-petals');instances(bead,gilt,beadMatrices,'reference6-pendant-beaded-margins');
 const floor=scene.getObjectByName('restoration-sanctuary-floor-clearcoat');
 const atmosphere=temple.composer.passes.find(p=>p.uniforms?.density&&p.uniforms?.sunColor&&typeof p.sync==='function');
 if(!floor?.material.uniforms.floorReflectionLod||!atmosphere){root.removeFromParent();ownedGeometry.forEach(g=>g.dispose());backing.dispose();throw Error('Existing floor reflection or physical scattering pass unavailable');}
 const original={exposure:temple.renderer.toneMappingExposure,environment:scene.environmentIntensity,floorLod:floor.material.uniforms.floorReflectionLod.value,floorStrength:floor.material.uniforms.floorStrength.value,atmosphereSync:atmosphere.sync,atmosphereDensity:atmosphere.uniforms.density.value,materials:list.map(m=>({m,color:m.color.clone(),roughness:m.roughness,envMapIntensity:m.envMapIntensity})),lights:lights.map(l=>({l,intensity:l.intensity,color:l.color.clone()}))};
 let active=null,disposed=false;
 function restore(){
  if(disposed)return;root.visible=false;temple.renderer.toneMappingExposure=original.exposure;scene.environmentIntensity=original.environment;floor.material.uniforms.floorReflectionLod.value=original.floorLod;floor.material.uniforms.floorStrength.value=original.floorStrength;
  atmosphere.sync=original.atmosphereSync;atmosphere.uniforms.density.value=original.atmosphereDensity;
  for(const {m,color,roughness,envMapIntensity} of original.materials){m.color.copy(color);m.roughness=roughness;m.envMapIntensity=envMapIntensity;}
  for(const {l,intensity,color} of original.lights){l.intensity=intensity;l.color.copy(color);}
  temple.renderer.shadowMap.needsUpdate=true;active=null;
 }
 function apply(options={}){
  if(disposed)throw Error('Finish study disposed');
  if(temple.info().lightingMode!=='sanctuary')throw Error('This finish study is sanctuary-only; restore before changing reference');
  restore();
  const p={panels:options.panels!==false,exposure:number(options.exposure??1.45,.5,3,'exposure'),environmentGain:number(options.environmentGain??1.20,.5,2.5,'environment gain'),metalGain:number(options.metalGain??1.35,.5,2.5,'metal gain'),sunGain:number(options.sunGain??1.25,.5,2.5,'sun gain'),practicalGain:number(options.practicalGain??1.20,.5,3,'practical gain'),floorLod:number(options.floorLod??.9,0,4,'floor reflection LOD'),floorStrength:number(options.floorStrength??1,0,1.2,'floor strength'),redWood:options.redWood!==false,warmTimber:options.warmTimber===true,hazeGain:number(options.hazeGain??1,.05,1.5,'haze gain'),giltColor:tint(options.giltColor??null,'gilt color'),agedGoldColor:tint(options.agedGoldColor??null,'aged gilt color'),statueGoldColor:tint(options.statueGoldColor??null,'statue gold color'),backingColor:tint(options.backingColor??null,'chased backing color'),metalRoughnessGain:number(options.metalRoughnessGain??1,.55,1.5,'metal roughness')};
  root.visible=p.panels;temple.renderer.toneMappingExposure=p.exposure;scene.environmentIntensity=original.environment*p.environmentGain;
  for(const record of original.materials){const m=record.m;
   if(m.metalness>=.7&&m.envMap&&(/restoration-private-room/.test(m.name)||/buddha|sculptureGold/.test(m.name)))m.envMapIntensity=record.envMapIntensity*p.metalGain;
   if(p.giltColor&&/^(restoration-private-room-gold|architecture_gold)$/.test(m.name)){m.color.set(p.giltColor);m.roughness=record.roughness*p.metalRoughnessGain;}
   if(p.agedGoldColor&&/^(restoration-private-room-oldgold|architecture_oldgold)$/.test(m.name)){m.color.set(p.agedGoldColor);m.roughness=record.roughness*p.metalRoughnessGain;}
   if(p.statueGoldColor&&/^(buddha|sculptureGold)$/.test(m.name)){m.color.set(p.statueGoldColor);m.roughness=record.roughness*p.metalRoughnessGain;}
   if(p.redWood&&/^(red|architecture_red)$/.test(m.name)){m.color.set('#873820');m.roughness=.43;}
   if(p.warmTimber&&m.name==='architecture_cedar'){m.color.set('#78391d');m.roughness=.54;}
   if(p.warmTimber&&m.name==='architecture_endwood'){m.color.set('#7d4827');m.roughness=.59;}
   if(p.warmTimber&&m.name==='architecture_paintIvory')m.color.set('#c5a375');
  }
  backing.color.set(p.backingColor||'#9d6529');backing.roughness=.39*p.metalRoughnessGain;backing.envMap=shadowGilt.envMap;backing.envMapIntensity=shadowGilt.envMapIntensity;
  for(const record of original.lights){const l=record.l;if(l.isDirectionalLight&&l.castShadow)l.intensity=record.intensity*p.sunGain;else if(l.isRectAreaLight||l.isSpotLight||l.isPointLight)l.intensity=record.intensity*p.practicalGain;}
  // Change optical dust density only. Keep the original ray integration,
  // shadow-map occlusion, sun color and light direction intact.
  atmosphere.sync=function(profile){original.atmosphereSync.call(this,profile);this.uniforms.density.value*=p.hazeGain;};
  floor.material.uniforms.floorReflectionLod.value=p.floorLod;floor.material.uniforms.floorStrength.value=p.floorStrength;
  temple.renderer.shadowMap.needsUpdate=true;active=p;return info();
 }
 function info(){return{active:active!==null,parameters:active,geometry:{panels:2,castPetals:petalMatrices.length,beads:beadMatrices.length,originalPrimaryVinesRetained:true,originalOpenTerminalsRetained:true,root:root.name},floorReflection:'Existing real planar reflection with adjusted surface micro-roughness',scattering:'Original shadow-occluded ray integration with explicit optical density',newLights:0,referencePixelsUsedInScene:false,roomEnvironmentRebaked:false};}
 return{apply,restore,info,dispose(){if(disposed)return;restore();root.removeFromParent();ownedGeometry.forEach(g=>g.dispose());ownedMaterial.forEach(m=>m.dispose());disposed=true;}};
}
