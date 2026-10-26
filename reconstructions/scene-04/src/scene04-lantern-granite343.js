// Lantern-only physical mineral/weather response. Existing CC0 granite scan
// normal and roughness maps are retained. No scene/reference RGB is sampled.
export function applyLanternGranite343(material,kind='body'){
 const inherit=material.onBeforeCompile,key=material.customProgramCacheKey;
 material.onBeforeCompile=shader=>{
  inherit(shader);const normalMarker='normal=normalize(mat3(viewMatrix)*normalize(ax*w.x+ay*w.y+az*w.z));';if(!shader.fragmentShader.includes(normalMarker)||!shader.fragmentShader.includes('varying vec3 r4StonePosition'))throw Error('343 granite boundary changed');
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 s343Local;').replace('#include <project_vertex>','s343Local=transformed;\n#include <project_vertex>');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 s343Local;float s343Height=0.,s343Damp=0.;float r4StoneHash(vec3 p);
   vec3 s343Cell(vec2 p){vec2 b=floor(p);float nearD=9.,second=9.,pigment=.5;for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 c=b+vec2(float(i),float(j)),jitter=vec2(r4StoneHash(vec3(c,3.7)),r4StoneHash(vec3(c,8.9))),d=c+.10+.80*jitter-p;float a=dot(d,d)+.22*abs(d.x*d.y);if(a<nearD){second=nearD;nearD=a;pigment=r4StoneHash(vec3(c,19.7));}else second=min(second,a);}return vec3(pigment,sqrt(second)-sqrt(nearD),sqrt(nearD));}
  `).replace('clamp(pow(max(mineral,.0001)/.153180782734,.88),.38,1.65)','clamp(pow(max(mineral,.0001)/.153180782734,.96),.26,1.70)').replace('mix(.53,1.04,smoothstep(.22,.73,damp))','mix(.80,1.02,smoothstep(.22,.73,damp))')
   .replace('#include <color_fragment>',`#include <color_fragment>
   {vec3 P=r4StonePosition,W=pow(abs(normalize(r4StoneNormal)),vec3(6.));W/=dot(W,vec3(1.));
    vec3 cell=s343Cell(P.zy*143.)*W.x+s343Cell(P.xz*143.)*W.y+s343Cell(P.xy*143.)*W.z;
    float footprint=max(length(dFdx(P)),length(dFdy(P))),detail=.25+.75*(1.-smoothstep(.004,.015,footprint)),mica=1.-smoothstep(.16,.28,cell.x),quartz=smoothstep(.74,.90,cell.x),seam=1.-smoothstep(.012,.055,cell.y);
    float coarse=r4StoneNoise(P*vec3(57.,49.,61.)+vec3(8.1,3.7,11.4)),darkClump=1.-smoothstep(.24,.43,coarse),macro=r4StoneNoise(P*vec3(4.4,3.1,4.4)+vec3(13.,5.,2.));
    float joint=exp(-abs(s343Local.y-.745)/.027)+exp(-abs(s343Local.y-1.83)/.027)+exp(-abs(s343Local.y-2.435)/.025)+exp(-abs(s343Local.y-3.02)/.025);
    s343Damp=clamp(.43*joint+.27*(1.-smoothstep(.38,.66,macro))${kind==='cap'?'+.30*(1.-smoothstep(.35,.65,r4StoneNoise(P*vec3(7.,4.,7.))))+.22*(1.-smoothstep(3.09,3.28,s343Local.y))*(.45+.55*r4StoneNoise(P*vec3(12.,2.,12.)))':kind==='finial'?'+.20':''},0.,.85);
    diffuseColor.rgb*=.91+.14*macro;diffuseColor.rgb*=1.-.39*mica*detail-.10*seam*detail-.22*darkClump-.26*s343Damp;
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.24+vec3(.008,.009,.008),quartz*.20*detail);
    s343Height=(.0007*(cell.x-.5)-.00045*seam-.0007*darkClump)*detail;}
   `).replace('float roughnessFactor=clamp(roughness*r4StoneSample(roughnessMap).g,.78,.96);','float roughnessFactor=clamp(roughness*r4StoneSample(roughnessMap).g-.10*s343Damp,.76,.98);')
   .replace(normalMarker,`${normalMarker}
    vec3 A343=dFdx(-vViewPosition),B343=dFdy(-vViewPosition),R1343=cross(B343,normal),R2343=cross(normal,A343);float D343=dot(A343,R1343);vec3 G343=sign(D343)*(dFdx(s343Height)*R1343+dFdy(s343Height)*R2343);normal=normalize(abs(D343)*normal-G343);
   `);
 };
 material.customProgramCacheKey=()=>key.call(material)+'-343-granular-damp-metric-r02-'+kind;material.userData.lantern343={revision:'343-r02',kind,grainScaleWorldMetres:[.002,.012],coarseMineralWorldMetres:[.015,.035],jointDampWidthLocalMetres:[.025,.027],newImageAssets:false,scan:'PolyHaven GraniteTile04,AmalKumar,CC0 retained',referenceRGBUsed:false};return material;
}
