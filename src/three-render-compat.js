// Pinned r186 renderer with coefficient-preserving lookup and material sampler sharing.
// Geometry, light sources, shadow receivers and material values are unchanged.
export * from '../vendor/build/three.module.js';
import {WebGLRenderer as PinnedWebGLRenderer} from '../vendor/build/three.module.js';
import {installBrdfLookupAtlas} from './brdf-lookup-atlas.js';
import {installMaterialSamplerSharing} from './material-sampler-sharing.js';
export class WebGLRenderer extends PinnedWebGLRenderer {
 constructor(options){
  super(options);
  let atlas;
  try{atlas=installBrdfLookupAtlas(this);installMaterialSamplerSharing(this);}catch(error){this.dispose();this.forceContextLoss();throw error;}
  this.brdfLookupAtlasInfo=atlas.info;
  const dispose=this.dispose.bind(this);let disposed=false;
  this.dispose=()=>{if(disposed)return;disposed=true;try{dispose();}finally{atlas.dispose();}};
 }
}
