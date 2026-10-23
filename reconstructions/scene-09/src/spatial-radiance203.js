import * as T from 'three';

// SH3 integration of genuine fixed CubeCamera pixels. Cube-face directions
// come from those cameras' actual inverse projections, not a painted field.
export function integrateNativeCell203(renderer,target,probe){
 const n=target.width,bytes=new Uint16Array(n*n*4),coefficients=Array.from({length:9},()=>[0,0,0]),basis=new Float64Array(9),ray=new T.Vector3(),origin=probe.getWorldPosition(new T.Vector3()),meanRadiance=[0,0,0];let total=0;
 for(let face=0;face<6;face++){
  renderer.readRenderTargetPixels(target,0,0,n,n,bytes,face);const camera=probe.children[face];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
   const u=2*(x+.5)/n-1,v=2*(y+.5)/n-1,weight=4/((1+u*u+v*v)**1.5),i=(y*n+x)*4;
   ray.set(u,v,1).unproject(camera).sub(origin).normalize();T.SphericalHarmonics3.getBasisAt(ray,basis);total+=weight;
   for(let a=0;a<3;a++){const value=T.DataUtils.fromHalfFloat(bytes[i+a]);if(!Number.isFinite(value))throw new Error('Nonfinite native radiance203 cell');meanRadiance[a]+=value*weight;for(let b=0;b<9;b++)coefficients[b][a]+=value*basis[b]*weight;}
  }
 }
 for(let a=0;a<3;a++){meanRadiance[a]/=total;for(let b=0;b<9;b++)coefficients[b][a]*=4*Math.PI/total;}
 if(Math.max(...meanRadiance)<=0)throw new Error('Empty actual radiance203 cell');return{coefficients,meanRadiance};
}

export function installSpatialIrradiance203(materials,cells,gain){
 const groups={outside:cells.filter(c=>c.family==='outside'),hall:cells.filter(c=>c.family==='hall'),pagoda:cells.filter(c=>c.family==='pagoda'),veranda:cells.filter(c=>c.label==='veranda')};
 for(const m of materials){
  if(!m.isMeshStandardMaterial||m.emissiveIntensity||m.userData.exteriorCeramic203)continue;
  const family=m.userData.nightVolume203||'outside',chosen=groups[family]||groups.outside,count=chosen.length,uniforms={radianceCellPosition203:{value:chosen.map(c=>new T.Vector3(...c.position))},radianceCellSH203:{value:chosen.flatMap(c=>c.coefficients.map(v=>new T.Vector3(...v)))},radianceCellGain203:{value:gain}};
  const old=m.onBeforeCompile,oldKey=m.customProgramCacheKey.bind(m);
  m.onBeforeCompile=shader=>{old.call(m,shader);Object.assign(shader.uniforms,uniforms);
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vRadianceWorld203;').replace('#include <project_vertex>',`#include <project_vertex>
vec4 radianceWorld203=vec4(transformed,1.);
#ifdef USE_BATCHING
 radianceWorld203=batchingMatrix*radianceWorld203;
#endif
#ifdef USE_INSTANCING
 radianceWorld203=instanceMatrix*radianceWorld203;
#endif
vRadianceWorld203=(modelMatrix*radianceWorld203).xyz;`);
   const pars=`varying vec3 vRadianceWorld203;
uniform vec3 radianceCellPosition203[${count}];
uniform vec3 radianceCellSH203[${count*9}];
uniform float radianceCellGain203;
vec3 spatialIrradiance203(vec3 normal){
 vec3 n=transformNormalByInverseViewMatrix(normal,viewMatrix),sum=vec3(0.);float weights=0.;
 for(int k=0;k<${count};k++){
  vec3 delta=vRadianceWorld203-radianceCellPosition203[k];float w=1./pow(1.0+dot(delta,delta)*.16,2.);int b=k*9;float x=n.x,y=n.y,z=n.z;
  vec3 E=radianceCellSH203[b]*.886227;
  E+=radianceCellSH203[b+1]*1.023328*y+ radianceCellSH203[b+2]*1.023328*z+ radianceCellSH203[b+3]*1.023328*x;
  E+=radianceCellSH203[b+4]*.858086*x*y+ radianceCellSH203[b+5]*.858086*y*z;
  E+=radianceCellSH203[b+6]*(.743125*z*z-.247708)+ radianceCellSH203[b+7]*.858086*x*z+ radianceCellSH203[b+8]*.429043*(x*x-y*y);
  sum+=max(E,vec3(0.))*w;weights+=w;
 }
 return sum/max(.000001,weights)*radianceCellGain203;
}`;
   shader.fragmentShader=shader.fragmentShader.replace('#include <envmap_physical_pars_fragment>','#include <envmap_physical_pars_fragment>\n'+pars).replace('#include <lights_fragment_maps>',T.ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );','iblIrradiance += spatialIrradiance203( geometryNormal );'));
  };
  m.customProgramCacheKey=()=>oldKey()+'-actual-spatial-SH203-r07-'+family+'-'+count;m.userData.spatialRadiance203={family,cells:chosen.map(c=>c.label),gain,source:'Actual fixed native cube pixels; SH3 cosine irradiance, smooth world-space inverse-distance blend',approximateVisibility:true};m.needsUpdate=true;
 }
}
