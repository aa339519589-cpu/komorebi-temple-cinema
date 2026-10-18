// Pinned scene/addon exports; compatibility only, not a replacement scene.
export * from '../vendor/build/three.module.js';
import {WebGLRenderer as PinnedWebGLRenderer} from '../vendor/build/three.module.js';
import {installBrdfLookupAtlas} from './brdf-lookup-atlas.js';
import {installMaterialSamplerPacking} from './material-sampler-packing.js';
export class WebGLRenderer extends PinnedWebGLRenderer {
 constructor(options){
  super(options);
  let atlas,packing;
  try{atlas=installBrdfLookupAtlas(this);packing=installMaterialSamplerPacking();}
  catch(error){packing?.dispose();atlas?.dispose();this.dispose();this.forceContextLoss();throw error;}
  this.brdfLookupAtlasInfo=atlas.info;
  this.materialSamplerPackingInfo=packing.info;
  const render=this.render.bind(this),compile=this.compile.bind(this),dispose=this.dispose.bind(this);
  this.render=(scene,camera)=>{packing.prepare(scene);return render(scene,camera);};
  this.compile=(scene,camera,targetScene)=>{packing.prepare(scene);if(targetScene)packing.prepare(targetScene);return compile(scene,camera,targetScene);};
  let disposed=false;
  this.dispose=()=>{if(disposed)return;disposed=true;try{dispose();}finally{packing.dispose();atlas.dispose();}};
 }
}
