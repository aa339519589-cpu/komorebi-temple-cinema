import * as T from 'three';
export let scannedStoneMaps=null;
export const scannedStoneRepeatMetres=2*650/4096;
export async function loadScannedStoneMaps(){
 const loader=new T.TextureLoader(),names=['diff','rough','nor_gl'];
 const maps=await Promise.all(names.map(name=>loader.loadAsync(new URL(`../assets/granite-tile-04/granite-face-${name}.png`,import.meta.url).href)));
 for(const [i,t] of maps.entries()){t.name='CC0-PolyHaven-granite-tile04-single-face-'+names[i];t.wrapS=t.wrapT=T.MirroredRepeatWrapping;t.anisotropy=8;if(i===0)t.colorSpace=T.SRGBColorSpace;}
 scannedStoneMaps={map:maps[0],roughnessMap:maps[1],normalMap:maps[2]};return scannedStoneMaps;
}

// A neutral mineral pigment with the real scan's fine normal/roughness.
// Normalized luminance preserves quartz/mica variation without multiplying
// warm scan RGB into an already warm architectural stone pigment.
export function createNeutralScannedGranite04(name,color='#77766f',normalStrength=.72){
 if(!scannedStoneMaps)throw Error('Granite maps must load before the stone material');
 const maps=scannedStoneMaps,m=new T.MeshPhysicalMaterial({name,color,...maps,normalScale:new T.Vector2(normalStrength,normalStrength),roughness:.94,metalness:0,clearcoat:.025,clearcoatRoughness:.36});
 m.onBeforeCompile=sh=>{
  m.userData.compiledShader=sh;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 r4StonePosition;varying vec3 r4StoneNormal;').replace('#include <project_vertex>',`vec4 r4StonePoint=vec4(transformed,1.0);
   #ifdef USE_INSTANCING
   r4StonePoint=instanceMatrix*r4StonePoint;
   #endif
   r4StonePosition=(modelMatrix*r4StonePoint).xyz;r4StoneNormal=inverseTransformDirection(transformedNormal,viewMatrix);
   #include <project_vertex>`);
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 r4StonePosition;varying vec3 r4StoneNormal;
   float r4StoneHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   float r4StoneNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(r4StoneHash(i),r4StoneHash(i+vec3(1,0,0)),f.x),mix(r4StoneHash(i+vec3(0,1,0)),r4StoneHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(r4StoneHash(i+vec3(0,0,1)),r4StoneHash(i+vec3(1,0,1)),f.x),mix(r4StoneHash(i+vec3(0,1,1)),r4StoneHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
   vec3 r4StoneWeights(){vec3 n=pow(abs(normalize(r4StoneNormal)),vec3(5.0));return n/(n.x+n.y+n.z);}
   vec4 r4StoneSample(sampler2D t){vec3 p=r4StonePosition*${(1/scannedStoneRepeatMetres).toFixed(10)},w=r4StoneWeights();return texture2D(t,p.zy)*w.x+texture2D(t,p.xz)*w.y+texture2D(t,p.xy)*w.z;}
   `).replace('#include <map_fragment>',`#ifdef USE_MAP
    vec3 granite=r4StoneSample(map).rgb;float mineral=dot(granite,vec3(.2126,.7152,.0722));diffuseColor.rgb*=clamp(pow(max(mineral,.0001)/.153180782734,.88),.38,1.65);
    float damp=r4StoneNoise(r4StonePosition*vec3(4.8,1.1,4.8)+vec3(3.8,9.1,7.3)),lichen=r4StoneNoise(r4StonePosition*31.0+vec3(7.3,2.1,13.7));
    diffuseColor.rgb*=mix(.53,1.04,smoothstep(.22,.73,damp));diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.65+vec3(.012,.016,.006),smoothstep(.72,.86,lichen)*.38);
   #endif`).replace('#include <normal_fragment_maps>',`
    vec3 p=r4StonePosition*${(1/scannedStoneRepeatMetres).toFixed(10)},w=r4StoneWeights(),base=normalize(r4StoneNormal);
    vec3 nx=texture2D(normalMap,p.zy).xyz*2.0-1.0,ny=texture2D(normalMap,p.xz).xyz*2.0-1.0,nz=texture2D(normalMap,p.xy).xyz*2.0-1.0;nx.xy*=normalScale;ny.xy*=normalScale;nz.xy*=normalScale;
    vec3 ax=vec3(base.x*abs(nx.z),base.y+nx.y,base.z+nx.x),ay=vec3(base.x+ny.x,base.y*abs(ny.z),base.z+ny.y),az=vec3(base.x+nz.x,base.y+nz.y,base.z*abs(nz.z));normal=normalize(mat3(viewMatrix)*normalize(ax*w.x+ay*w.y+az*w.z));
   `).replace('#include <roughnessmap_fragment>','float roughnessFactor=clamp(roughness*r4StoneSample(roughnessMap).g,.78,.96);');
 };
 m.customProgramCacheKey=()=> 'scene04-neutral-cc0-weathered-metric-granite131-r03';m.userData.maps=maps;m.userData.physicalTextureRepeatMetres=scannedStoneRepeatMetres;m.userData.provider='Poly Haven Granite Tile 04, CC0-1.0';m.userData.referenceRGBUsed=false;return m;
}
