// Analytic world-scale colour and roughness detail; no external image texture.
export const detailNoise=`
float sdHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float sdNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(sdHash(i),sdHash(i+vec3(1,0,0)),f.x),mix(sdHash(i+vec3(0,1,0)),sdHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(sdHash(i+vec3(0,0,1)),sdHash(i+vec3(1,0,1)),f.x),mix(sdHash(i+vec3(0,1,1)),sdHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float sdFbm(vec3 p){return .57*sdNoise(p)+.28*sdNoise(p*2.07)+.15*sdNoise(p*4.19);}
`;
export function installSurfaceDetail(material,kind){
 material.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 vSurfacePosition;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
 vec4 detailWorld=vec4(transformed,1.0);
 #ifdef USE_INSTANCING
 detailWorld=instanceMatrix*detailWorld;
 #endif
 vSurfacePosition=(modelMatrix*detailWorld).xyz;`);
 shader.fragmentShader='varying vec3 vSurfacePosition;\n'+detailNoise+shader.fragmentShader;if(kind==='wet'){shader.uniforms.floorWetMap={value:material.userData.floorWetMap};shader.fragmentShader='uniform sampler2D floorWetMap;\n'+shader.fragmentShader;}
 let code='';
 if(kind==='stone'||kind==='wet')code=`
 vec3 sp=vSurfacePosition;
 float broad=sdFbm(sp*3.4),grain=sdNoise(sp*210.),fine=sdNoise(sp*470.);
 diffuseColor.rgb*=.52+.70*broad+.28*grain;
 diffuseColor.rgb+=vec3(.085,.078,.060)*smoothstep(.84,.96,fine)*(.25+.75*broad);
 diffuseColor.rgb*=1.-.35*smoothstep(.80,.93,sdNoise(sp*91.));`;
 if(kind==='wet')code+=`\nvec4 stoneWetSample=texture2D(floorWetMap,vec2((vSurfacePosition.x+4.6)/9.2,(vSurfacePosition.z+2.)/21.4));diffuseColor.rgb*=mix(.72,1.18,stoneWetSample.g)*mix(.28,1.,stoneWetSample.r);`;
 if(kind==='wood')code=`
 vec3 sp=vSurfacePosition;float warp=sdFbm(vec3(sp.x*4.,sp.y*.3,sp.z*4.));
 float grain=.5+.5*sin(sp.x*150.+sp.z*109.+warp*17.);
 float wear=sdFbm(sp*7.5);diffuseColor.rgb*=.76+.20*wear+.10*grain;
 diffuseColor.rgb+=vec3(.045,.025,.009)*smoothstep(.86,.97,sdNoise(sp*180.));`;
 if(kind==='moss')code=`float tuft=sdFbm(vSurfacePosition*34.);diffuseColor.rgb*=.5+.95*tuft;diffuseColor.rgb+=vec3(.025,.035,.008)*smoothstep(.72,.91,sdNoise(vSurfacePosition*165.));`;
 if(kind==='gold')code=`float age=sdFbm(vSurfacePosition*45.);diffuseColor.rgb*=.75+.25*age;`;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+code);
 if(kind==='wet')shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>\n#ifdef USE_CLEARCOAT\nfloat surfaceWet=smoothstep(.40,.67,sdFbm(vSurfacePosition*2.7));surfaceWet*=mix(.40,1.,stoneWetSample.g);material.clearcoat*=.20+.80*surfaceWet;material.clearcoatRoughness=mix(.16,.035,surfaceWet);\n#endif\n`);
 if(kind==='wet')shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 roughnessFactor=clamp(roughnessFactor+(.65-stoneWetSample.g)*.18+(sdFbm(vSurfacePosition*4.)-.48)*.36,.13,.49);`);
 };
 material.customProgramCacheKey=()=>`rain-surface-v9-${kind}`;
 material.needsUpdate=true;
}
