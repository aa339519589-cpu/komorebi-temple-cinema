// All scene/addon exports remain the pinned r186 implementation.
// Only the renderer constructor installs a coefficient-preserving LUT atlas
// before the scene's first shader compile. No light or shadow is dropped.
export * from '../vendor/build/three.module.js';
import {WebGLRenderer as PinnedWebGLRenderer} from '../vendor/build/three.module.js';
import {installBrdfLookupAtlas} from './brdf-lookup-atlas.js';
export class WebGLRenderer extends PinnedWebGLRenderer {
 constructor(options){
  super(options);
  let atlas;
  try{atlas=installBrdfLookupAtlas(this);}catch(error){this.dispose();this.forceContextLoss();throw error;}
  this.brdfLookupAtlasInfo=atlas.info;
  const dispose=this.dispose.bind(this);let disposed=false;
  this.dispose=()=>{if(disposed)return;disposed=true;try{dispose();}finally{atlas.dispose();}};
 }
}
