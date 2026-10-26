import * as T from 'three';

// Surface response is attached to metre-scale member UVs and the existing
// CC0 scan, never to image coordinates, illumination or the reference photo.
const ROLES={
 lacquer:{color:'#a5442c',substrate:'#8c5433',rough:[.38,.68],normal:.13,coat:.11,coatRough:.46,specular:.46,anisotropy:0,variation:.22,raw:0},
 beam:{color:'#7d3d28',substrate:'#8f5d37',rough:[.46,.80],normal:.21,coat:.025,coatRough:.58,specular:.37,anisotropy:0,variation:.40,raw:0},
 raw:{color:'#a9794d',substrate:'#a9794d',rough:[.75,.95],normal:.20,coat:0,coatRough:.8,specular:.25,anisotropy:0,variation:.26,raw:.72},
 bracket:{color:'#843e29',substrate:'#935533',rough:[.51,.83],normal:.19,coat:.035,coatRough:.60,specular:.36,anisotropy:0,variation:.29,raw:0},
 dou:{color:'#8b452e',substrate:'#9e633b',rough:[.54,.85],normal:.17,coat:.025,coatRough:.65,specular:.33,anisotropy:0,variation:.30,raw:0},
 hip:{color:'#774325',substrate:'#8e5635',rough:[.90,.90],normal:.085,coat:.005,coatRough:.70,specular:.12,anisotropy:0,variation:0,raw:0},
 pier:{color:'#6c554c',substrate:'#806747',rough:[.63,.92],normal:.27,coat:.012,coatRough:.72,specular:.28,anisotropy:0,variation:.36,raw:0},
 transom:{color:'#76432c',substrate:'#865d39',rough:[.61,.88],normal:.17,coat:.025,coatRough:.64,specular:.31,anisotropy:0,variation:.29,raw:0},
 dark:{color:'#594332',substrate:'#705438',rough:[.67,.93],normal:.18,coat:.012,coatRough:.73,specular:.28,anisotropy:0,variation:.32,raw:0},
 sash:{color:'#858a7d',substrate:'#7b755c',rough:[.65,.91],normal:.15,coat:.015,coatRough:.71,specular:.28,anisotropy:0,variation:.21,raw:0},
 rafterCut:{color:'#a96848',substrate:'#aa744a',rough:[.78,.96],normal:.22,coat:0,coatRough:.8,specular:.24,anisotropy:0,variation:.23,raw:.82}
};
const END_EXPOSURE={lacquer:.08,beam:.26,raw:1,bracket:.12,dou:.08,hip:.16,pier:.08,transom:.12,dark:.18,sash:.05,rafterCut:1};
const roleFor=name=>name==='postwood'?'pier':name==='hipwood'?'hip':name==='rafterCut220'?'rafterCut':name==='windowBars'?'sash':name==='transomwood220'?'transom':name==='kit_cedar'?'bracket':name==='kit_endwood'?'dou':name.includes('endwood')?'raw':name.includes('darkwood')?'dark':name.includes('cedar')?'beam':'lacquer';
const tissueFunctions=`
float hash364(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise364(vec2 p){vec2 i=floor(p),f=fract(p),s=f*f*(3.-2.*f);return mix(mix(hash364(i),hash364(i+vec2(1.,0.)),s.x),mix(hash364(i+vec2(0.,1.)),hash364(i+vec2(1.,1.)),s.x),s.y);}
float tissue364(vec2 p){return noise364(p)*.64+noise364(p*2.13+vec2(7.1,3.6))*.25+noise364(p*4.77+vec2(2.4,8.3))*.11;}
`;
export function installTimberResponse364(mats){
 const assignments=[];
 for(const[name,input]of Object.entries(mats)){
  if(!input.userData.metricTimberGrain)continue;
  let mat=input,upgradedFrom=null;const retainedCompile=input.onBeforeCompile,retainedKey=input.customProgramCacheKey;
  // Closed end/edge UVs inherited from the geometry contain degenerate
  // derivative tangent frames. Keep an isotropic dielectric microfacet lobe
  // there: anisotropic GGX on a zero tangent frame produced white horizon
  // singularities. Real member pigment, normals and roughness remain intact.
  // Imported timber was Standard, so its claimed coat/specular settings had
  // no effect. Make the stained bearing wood use the same explicit dielectric
  // physical response as the other timber, retaining all original scan maps.
  if(mat.isMeshStandardMaterial&&!mat.isMeshPhysicalMaterial){
   upgradedFrom=mat.type;const previous=mat;
   mat=new T.MeshPhysicalMaterial({name:previous.name+'-physical364',color:previous.color,roughness:previous.roughness,metalness:0,map:previous.map,normalMap:previous.normalMap,normalScale:previous.normalScale,roughnessMap:previous.roughnessMap,bumpMap:previous.bumpMap,bumpScale:previous.bumpScale,vertexColors:previous.vertexColors,side:previous.side,transparent:previous.transparent,opacity:previous.opacity,alphaTest:previous.alphaTest,depthWrite:previous.depthWrite,emissive:previous.emissive,emissiveIntensity:previous.emissiveIntensity});
   mat.userData={...previous.userData};mats[name]=mat;
  }
  const role=roleFor(name),p=ROLES[role];mat.color.set(p.color);mat.metalness=0;mat.metalnessMap=null;mat.roughness=(p.rough[0]+p.rough[1])/2;mat.normalScale?.set(p.normal,p.normal);
  if(mat.isMeshPhysicalMaterial){mat.clearcoat=p.coat;mat.clearcoatRoughness=p.coatRough;mat.specularIntensity=p.specular;mat.anisotropy=p.anisotropy;mat.anisotropyRotation=0;}
  mat.userData.woodRole364=role;
  mat.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,{woodSubstrate364:{value:new T.Color(p.substrate)},woodRoughRange364:{value:new T.Vector2(...p.rough)},woodVariation364:{value:p.variation},woodRawFaces364:{value:p.raw},woodEndExposure364:{value:END_EXPOSURE[role]}});
   shader.vertexShader='attribute float woodCut190;attribute vec2 woodEndUv190;varying float vWoodCut364;varying vec2 vWoodEnd364;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWoodCut364=woodCut190;vWoodEnd364=woodEndUv190;');
   shader.fragmentShader='varying float vWoodCut364;varying vec2 vWoodEnd364;uniform vec3 woodSubstrate364;uniform vec2 woodRoughRange364;uniform float woodVariation364;uniform float woodRawFaces364;uniform float woodEndExposure364;\n'+tissueFunctions+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
#ifdef USE_MAP
 vec2 woodUv364=vMapUv;
 float heart364=tissue364(vec2(woodUv364.x*.86,woodUv364.y*8.7));
 float fibres364=tissue364(vec2(woodUv364.x*2.4,woodUv364.y*57.));
 float timberVariation364=1.+woodVariation364*(heart364*2.-1.)+(fibres364-.5)*.10;
 float phase364=woodUv364.y*1020.+sin(woodUv364.x*3.7+sin(woodUv364.y*9.))*2.4;
 float fibreFilter364=1.-smoothstep(.6,2.4,fwidth(phase364));
 diffuseColor.rgb*=timberVariation364+(sin(phase364)*.016+sin(phase364*2.71)*.008)*fibreFilter364;
 vec2 end364=vWoodEnd364*vec2(1.,.91)+vec2(.060,-.040);
 float radius364=length(end364),angle364=atan(end364.y,end364.x),ringPhase364=(radius364+.0017*sin(angle364*7.+radius364*43.))*2300.;
 float ringFilter364=1.-smoothstep(.7,2.5,fwidth(ringPhase364));
 float late364=pow(.5+.5*cos(ringPhase364),7.)*ringFilter364;
 float ray364=pow(max(0.,sin(angle364*31.+sin(radius364*29.))),32.)*smoothstep(.025,.12,radius364);
 vec3 cut364=woodSubstrate364*(.73+.27*heart364)*(1.-late364*.22-ray364*.11);
 float rawFace364=max(woodRawFaces364,smoothstep(.75,.98,vWoodCut364)*woodEndExposure364);
 diffuseColor.rgb=mix(diffuseColor.rgb,cut364,rawFace364);
#endif`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
#ifdef USE_MAP
 float scanRough364=.5;
 #ifdef USE_ROUGHNESSMAP
  scanRough364=texture2D(roughnessMap,vRoughnessMapUv).g;
 #endif
 float roughTissue364=clamp(scanRough364*.58+heart364*.29+fibres364*.13,0.,1.);
 roughnessFactor=mix(woodRoughRange364.x,woodRoughRange364.y,roughTissue364);
#endif`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
#if defined(USE_CLEARCOAT) && defined(USE_MAP)
 material.clearcoat*=.73+.27*heart364;
 material.clearcoatRoughness=clamp(material.clearcoatRoughness+(fibres364-.5)*.16,.28,.92);
#endif`);
  };
  mat.customProgramCacheKey=()=> 'scene05-member-role-satin364-r10';
  // The deeply coved long hip uses the proven361R05 fibre/endgrain and
  // reflection response. Its darker pigment and low-coat weathered BRDF are explicit. The new
  // generic tissue/roughness field produced pale longitudinal strips there.
  if(role==='hip'){mat.onBeforeCompile=retainedCompile;mat.customProgramCacheKey=()=>retainedKey.call(input);}
  mat.needsUpdate=true;assignments.push({material:name,role,type:mat.type,upgradedFrom,shader:role==='hip'?'Retained361R05 fibre/normal shader, darker pigment and diffuse weathered-hip BRDF364':'Role-specific364 substrate/coat response',...p,endExposure:END_EXPOSURE[role]});
 }
 return{info:{revision:364,assignments,method:'Separate physical lacquer, old structural timber, stained bracket/dou, gray weathered pier, sash and dry crosscut responses. Continuous pigment/roughness variation follows metre-scale member UV and original CC0 scan; Isotropic dielectric microfacets avoid singular anisotropic tangent frames on finite closed edges; member-aligned fibres remain in albedo/normal/roughness. No image-coordinate or light-dependent colour, no reference photograph texture, no exposure edit.',incidentRadiance:'Original361R05 shared physical court/temple/sky probe and common.22 wood gain retained exactly; no extra role-specific illumination',limits:'Inferred finish roles and native reflection response, not recovered temple coating measurements.'}};
}
