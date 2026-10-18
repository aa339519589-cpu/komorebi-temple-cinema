import * as T from 'three';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

// Local geometry-derived contact shading. The rendered scene supplies depth;
// no photographic image, environment asset, temporal accumulation or RAF.
export function createContactShading(renderer,scene,camera,width,height){
 if(!renderer.capabilities)return null;
 const depth=new T.DepthTexture(width,height,T.UnsignedIntType);
 const color=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthTexture:depth,samples:4});
 const shaded=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:false});
 const ao=new GTAOPass(scene,camera,width,height);
 ao.setGBuffer(depth);
 ao.updateGtaoMaterial({radius:1.15,distanceExponent:2,thickness:1.6,distanceFallOff:1,scale:1.2,samples:24});
 ao.updatePdMaterial({radius:4,lumaPhi:10,depthPhi:2,normalPhi:3,samples:16});
 ao.blendIntensity=.88;
 // GTAOPass' denoising noise normally depends on Math.random at creation.
 // Rebuild it deterministically, keeping the same fixed samples on every call.
 const bytes=ao.pdNoiseTexture.image.data;
 for(let i=0;i<bytes.length;i++){
  let q=Math.imul(i+17,374761393);q=Math.imul(q^(q>>>13),1274126177);bytes[i]=(q^(q>>>16))&255;
 }
 ao.pdNoiseTexture.needsUpdate=true;
 const output=new OutputPass();output.renderToScreen=true;
 return{
  render(){
   renderer.setRenderTarget(color);renderer.render(scene,camera);
   const info={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
   ao.render(renderer,shaded,color);output.render(renderer,null,shaded);
   return{calls:info.calls+5,triangles:info.triangles+10};
  },
  dispose(){color.dispose();depth.dispose();shaded.dispose();ao.dispose();ao.blendMaterial.dispose();output.dispose();}
 };
}
