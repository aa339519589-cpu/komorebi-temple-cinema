import * as T from 'three';

const directory='/assets/polyhaven/lacquered-cherry-wood/';
export async function installScannedTimber(mats){
 const loader=new T.TextureLoader();
 const [albedo,normal,rawRoughness]=await Promise.all([
  loader.loadAsync(directory+'diffuse-2k.jpg'),loader.loadAsync(directory+'normal-gl-2k.png'),loader.loadAsync(directory+'roughness-2k.jpg')
 ]);
 const canvas=document.createElement('canvas');canvas.width=rawRoughness.image.width;canvas.height=rawRoughness.image.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(rawRoughness.image,0,0);
 const values=ctx.getImageData(0,0,canvas.width,canvas.height);
 // Retain broad but visible sunlight glints in the sealed lacquer without
 // turning the large structural faces into chrome-like reflections.
 for(let i=0;i<values.data.length;i+=4){const q=Math.round(Math.min(255,values.data[i]*.95+38));values.data[i]=values.data[i+1]=values.data[i+2]=q;}
 ctx.putImageData(values,0,0);const roughness=new T.CanvasTexture(canvas);rawRoughness.dispose();
 // A thin warm red-brown stain retains the scan's broad heartwood variation.
 // Its original normal and roughness remain bounded physical microstructure;
 // no colour, surface depth or material map comes from the scene photograph.
 const pigmentCanvas=document.createElement('canvas');pigmentCanvas.width=albedo.image.width;pigmentCanvas.height=albedo.image.height;
 const pigmentCtx=pigmentCanvas.getContext('2d',{willReadFrequently:true});pigmentCtx.drawImage(albedo.image,0,0);
 const pigmentPixels=pigmentCtx.getImageData(0,0,pigmentCanvas.width,pigmentCanvas.height),linear=Array.from({length:256},(_,i)=>{const v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
 let meanLuma=0;for(let i=0;i<pigmentPixels.data.length;i+=4)meanLuma+=.2126*linear[pigmentPixels.data[i]]+.7152*linear[pigmentPixels.data[i+1]]+.0722*linear[pigmentPixels.data[i+2]];
 meanLuma/=pigmentPixels.data.length/4;
 for(let i=0;i<pigmentPixels.data.length;i+=4){
  const l=.2126*linear[pigmentPixels.data[i]]+.7152*linear[pigmentPixels.data[i+1]]+.0722*linear[pigmentPixels.data[i+2]],v=Math.max(.22,Math.min(.94,.16+.62*Math.pow(l/meanLuma,.68)));
  const chroma=[linear[pigmentPixels.data[i]],linear[pigmentPixels.data[i+1]],linear[pigmentPixels.data[i+2]]].map(c=>T.MathUtils.clamp(c/Math.max(l,.001),.65,1.4));
  for(let c=0;c<3;c++){const value=v*(.90+.10*chroma[c]),srgb=value<=.0031308?value*12.92:1.055*value**(1/2.4)-.055;pigmentPixels.data[i+c]=Math.round(T.MathUtils.clamp(srgb,0,1)*255);}
 }
 pigmentCtx.putImageData(pigmentPixels,0,0);const pigmentMap=new T.CanvasTexture(pigmentCanvas);pigmentMap.colorSpace=T.SRGBColorSpace;
 albedo.colorSpace=T.SRGBColorSpace;
 for(const tex of [normal,roughness])tex.colorSpace=T.NoColorSpace;
 for(const tex of [albedo,normal,roughness,pigmentMap]){
  tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.minFilter=T.LinearMipmapLinearFilter;
  tex.magFilter=T.LinearFilter;tex.generateMipmaps=true;tex.anisotropy=8;tex.needsUpdate=true;
 }
 const keys=['red','cedar','endwood','darkwood','architecture_red','architecture_cedar','architecture_endwood','architecture_darkwood','kit_cedar','kit_endwood'];
 // Linear albedo gains represent the lighter stained temple timber. The
 // supplied scan is a very dark table: measured linear maxima .0666/.0452/
 // .0222. These gains keep every sampled albedo channel below one.
 const colors={red:[6.0,3.8,3.0],cedar:[6.8,4.6,3.5],endwood:[7.6,5.8,4.2],darkwood:[2.2,1.9,1.65]};
 const pigments={red:'#9b4335',cedar:'#94513a',endwood:'#8c5b40',darkwood:'#5e4339'};
 for(const key of keys){
  const mat=mats[key];if(!mat)continue;
  const kind=key.includes('darkwood')?'darkwood':key.includes('endwood')?'endwood':key.includes('cedar')?'cedar':'red';
  const painted=true;mat.map=pigmentMap;mat.normalMap=normal;mat.normalScale.set(kind==='endwood'?.13:.085,kind==='endwood'?.13:.085);mat.bumpMap=null;mat.roughnessMap=roughness;mat.roughness=kind==='darkwood'?.90:kind==='endwood'?.88:kind==='cedar'?.81:.76;
  if(painted)mat.color.set(key==='kit_cedar'?'#913a30':key==='kit_endwood'?'#754433':pigments[kind]);else mat.color.setRGB(...colors[kind]);mat.metalness=0;
  if(mat.isMeshPhysicalMaterial){mat.clearcoat=kind==='red'?.080:.050;mat.clearcoatRoughness=.47;mat.specularIntensity=.42;}
  mat.onBeforeCompile=shader=>{
   shader.vertexShader='attribute float woodCut190;attribute vec2 woodEndUv190;varying float vWoodCut190;varying vec2 vWoodEndUv190;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vWoodCut190=woodCut190;vWoodEndUv190=woodEndUv190;');
   shader.fragmentShader='varying float vWoodCut190;varying vec2 vWoodEndUv190;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    #ifdef USE_MAP
     vec2 woodUv=vMapUv;
     float fibre=woodUv.y*1020.+sin(woodUv.x*3.7+sin(woodUv.y*9.))*2.4;
     float filterFibre=1.-smoothstep(.6,2.4,fwidth(fibre));
     float longitudinal=(sin(fibre)*.023+sin(fibre*2.71)*.011)*filterFibre;
     float age=.040*sin(woodUv.x*1.9+woodUv.y*21.)+.024*sin(woodUv.x*5.2+woodUv.y*7.);
     float worn=smoothstep(.48,.88,sin(woodUv.x*3.1+sin(woodUv.y*16.)*.42)*sin(woodUv.x*.81+woodUv.y*3.2));
     float checkPhase=woodUv.y*184.+sin(woodUv.x*3.2+woodUv.y*9.)*.16;
     float checkFilter=1.-smoothstep(.55,1.8,fwidth(checkPhase));
     float check=pow(max(0.,sin(checkPhase)),46.)*smoothstep(.12,.80,sin(woodUv.x*8.1+woodUv.y*3.))*checkFilter;
     diffuseColor.rgb*=.97+longitudinal+age-check*.15;
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.156,.092,.068)*(.62+.38*texture2D(map,woodUv).r),worn*.22);
     vec2 cut220=vWoodEndUv190*vec2(1.,.91)+vec2(.060,-.040);
     float radius220=length(cut220),angle220=atan(cut220.y,cut220.x);
     float phase190=(radius220+.0017*sin(angle220*7.+radius220*43.))*2300.;
     float filtered190=1.-smoothstep(.7,2.5,fwidth(phase190));
     float latewood220=pow(.5+.5*cos(phase190),7.)*filtered190;
     float rays220=pow(max(0.,sin(angle220*31.+sin(radius220*29.))),32.)*smoothstep(.025,.12,radius220);
     vec3 end220=mix(diffuseColor.rgb*vec3(.94,.85,.78),vec3(.155,.066,.040),.24)*(1.-latewood220*.25-rays220*.16);
     diffuseColor.rgb=mix(diffuseColor.rgb,end220,smoothstep(.75,.98,vWoodCut190)*.88);
    #endif`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    #ifdef USE_MAP
     float oldCoat220=.5+.5*sin(vMapUv.x*.83+sin(vMapUv.y*5.7)*.6)*sin(vMapUv.y*2.1+vMapUv.x*.47);
     roughnessFactor=clamp(roughnessFactor*(.88+.21*oldCoat220)+.025,.36,.96);
    #endif`);
  };mat.customProgramCacheKey=()=> 'scene05-r05-oxide-timber-varied-coat-eccentric-endgrain';
  mat.userData.metricTimberGrain=true;mat.envMapIntensity=painted?.70:.7;mat.needsUpdate=true;
 }
 return {info:{provider:'Poly Haven',asset:'lacquered_cherry_wood',license:'CC0-1.0',physicalTileMetres:1,grain:'Member-aligned metric UV with scanned tissue, role-specific deep red/brown stains, varied worn-coat roughness, eccentric latewood bands and radial end checks',pigments,pigmentCoverage:'CC0 scan luminance .22–.94 and10% source chroma under oxide-red, brown and weathered stains. Independent per-member finish modulation. Scene photograph unused as material data.',sourceMeanLinearLuma:meanLuma},
  dispose(){for(const tex of[albedo,normal,roughness,pigmentMap])tex.dispose();}};
}

export function assignMetricTimberUV(geometry,matrix){
 if(geometry.userData.metricPathUV){
  geometry.setAttribute('woodCut190',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count),1));geometry.setAttribute('woodEndUv190',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
  const s=new T.Vector3().setFromMatrixScale(matrix),gain=(s.x+s.y+s.z)/3,uv=geometry.attributes.uv,
   seed=Math.sin(matrix.elements[12]*12.713+matrix.elements[13]*4.13+matrix.elements[14]*5.71)*43758.5453,offset=seed-Math.floor(seed);
  for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*gain+offset,uv.getY(i)*gain+offset*.37);return;
 }
 geometry.computeBoundingBox();const size=geometry.boundingBox.getSize(new T.Vector3()),scale=new T.Vector3().setFromMatrixScale(matrix);
 const lengths=[size.x*scale.x,size.y*scale.y,size.z*scale.z],long=lengths.indexOf(Math.max(...lengths)),s=[scale.x,scale.y,scale.z];
 const position=geometry.attributes.position,normal=geometry.attributes.normal,uv=new Float32Array(position.count*2),cut=new Float32Array(position.count),endUv=new Float32Array(position.count*2),centre=geometry.boundingBox.getCenter(new T.Vector3()).toArray();
 const seed=Math.sin(matrix.elements[12]*12.713+matrix.elements[13]*4.13+matrix.elements[14]*5.71)*43758.5453,offset=seed-Math.floor(seed);
 for(let i=0;i<position.count;i++){
  const p=[position.getX(i),position.getY(i),position.getZ(i)],n=[Math.abs(normal.getX(i)),Math.abs(normal.getY(i)),Math.abs(normal.getZ(i))];
  const perpendicular=[0,1,2].filter(a=>a!==long);
  const cross=perpendicular[0]===n.indexOf(Math.max(...n))?perpendicular[1]:perpendicular[0];
  cut[i]=n[long];endUv[i*2]=(p[perpendicular[0]]-centre[perpendicular[0]])*s[perpendicular[0]]+(offset-.5)*.13;endUv[i*2+1]=(p[perpendicular[1]]-centre[perpendicular[1]])*s[perpendicular[1]]+((offset*7.17)%1-.5)*.11;
  if(n[long]>.85){uv[i*2]=p[perpendicular[0]]*s[perpendicular[0]]+offset;uv[i*2+1]=p[perpendicular[1]]*s[perpendicular[1]]+offset*.37;}
  else{uv[i*2]=p[long]*s[long]+offset;uv[i*2+1]=p[cross]*s[cross]+offset*.37;}
 }
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setAttribute('woodCut190',new T.Float32BufferAttribute(cut,1));geometry.setAttribute('woodEndUv190',new T.Float32BufferAttribute(endUv,2));
}
