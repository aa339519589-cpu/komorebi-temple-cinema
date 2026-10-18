/** Depth-derived contact occlusion for the existing, unrebuilt sanctuary. */
import * as T from 'three';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
export function installSanctuaryContactOptics(production,options={}){
 const {renderer,scene,camera}=production;
 if(!renderer?.isWebGLRenderer||!scene?.isScene||!camera)throw Error('Existing production scene required');
 const width=renderer.domElement.width,height=renderer.domElement.height,radius=options.radius??.34,intensity=options.intensity??.8;
 if(!Number.isFinite(radius)||radius<.02||radius>2||!Number.isFinite(intensity)||intensity<0||intensity>1.5)throw Error('Invalid contact optics');
 const savedRandom=Math.random;let seed=7711,ao;
 try{Math.random=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);ao=new GTAOPass(scene,camera,width,height);}finally{Math.random=savedRandom;}
 ao.output=GTAOPass.OUTPUT.Default;ao.blendIntensity=intensity;
 ao.updateGtaoMaterial({radius,thickness:.28,distanceExponent:1.25,distanceFallOff:1,scale:1,samples:32});
 ao.updatePdMaterial({lumaPhi:10,depthPhi:3,normalPhi:3,radius:4,rings:2,samples:16});
 let target=null,depth=null,inside=false,frames=0;const original=renderer.render;
 renderer.render=function(object,view){
  if(!inside&&object===scene&&view===camera)depth=this.getRenderTarget()?.depthTexture??null;
  const material=object?.material;
  if(inside||!depth||material?.name!=='OutputShader'||intensity===0)return original.call(this,object,view);
  inside=true;const destination=this.getRenderTarget(),source=material.uniforms.tDiffuse.value;
  try{
   if(target){target.dispose();ao.gtaoRenderTarget.dispose();ao.pdRenderTarget.dispose();ao.gtaoRenderTarget=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:false});ao.pdRenderTarget=ao.gtaoRenderTarget.clone();ao.pdMaterial.uniforms.tDiffuse.value=ao.gtaoRenderTarget.texture;}
   target=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:false});
   ao.setGBuffer(depth,undefined);ao.gtaoMaterial.needsUpdate=frames===0;ao.pdMaterial.needsUpdate=frames===0;
   ao.render(this,target,{texture:source});material.uniforms.tDiffuse.value=target.texture;material.uniformsNeedUpdate=true;
   this.setRenderTarget(destination);this.setViewport(0,0,width,height);
   const result=original.call(this,object,view);frames++;return result;
  }finally{material.uniforms.tDiffuse.value=source;inside=false;}
 };
 const info=()=>({type:'GTAO reconstructed from current HDR geometry depth',radius,intensity,frames,width,height,newSceneGeometry:false,referenceTexture:false,scope:'screen-space contact occlusion, not full global illumination'});
 production.contactOpticsInfo=info;
 return{info,dispose(){renderer.render=original;target?.dispose();ao.dispose();}};
}
