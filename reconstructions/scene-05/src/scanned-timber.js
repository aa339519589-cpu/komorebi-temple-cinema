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
  const l=.2126*linear[pigmentPixels.data[i]]+.7152*linear[pigmentPixels.data[i+1]]+.0722*linear[pigmentPixels.data[i+2]],v=Math.max(.36,Math.min(.98,.19+.63*Math.sqrt(l/meanLuma)));
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
 const pigments={red:'#b4673c',cedar:'#ae7144',endwood:'#be925b',darkwood:'#784b31'};
 for(const key of keys){
  const mat=mats[key];if(!mat)continue;
  const kind=key.includes('darkwood')?'darkwood':key.includes('endwood')?'endwood':key.includes('cedar')?'cedar':'red';
  const painted=true;mat.map=pigmentMap;mat.normalMap=normal;mat.normalScale.set(kind==='endwood'?.11:.075,kind==='endwood'?.11:.075);mat.bumpMap=null;mat.roughnessMap=roughness;mat.roughness=.80;
  if(painted)mat.color.set(pigments[kind]);else mat.color.setRGB(...colors[kind]);mat.metalness=0;
  if(mat.isMeshPhysicalMaterial){mat.clearcoat=.17;mat.clearcoatRoughness=.34;mat.specularIntensity=.55;}
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
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.245,.178,.116)*(.72+.28*texture2D(map,woodUv).r),worn*.34);
     float phase190=length(vWoodEndUv190*vec2(1.,.94)+vec2(.018,-.024))*1250.+sin(vWoodEndUv190.x*31.)*.7;
     float filtered190=1.-smoothstep(.7,2.5,fwidth(phase190)),growth190=.5+.5*cos(phase190)*filtered190;
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.230,.125,.055)*(.94+.06*growth190),smoothstep(.75,.98,vWoodCut190)*.70);
    #endif`);
  };mat.customProgramCacheKey=()=> 'scene05-light196-subdued-grain-varnish-cut-response';
  mat.userData.metricTimberGrain=true;mat.envMapIntensity=painted?.70:.7;mat.needsUpdate=true;
 }
 return {info:{provider:'Poly Haven',asset:'lacquered_cherry_wood',license:'CC0-1.0',physicalTileMetres:1,grain:'Member-aligned metric UV, subdued scanned normals, longitudinal aged tissue and bounded fine checks',pigments,pigmentCoverage:'CC0 scan luminance .36–.98 and10% source chroma under warm red-brown stain; broad rub-through to natural timber; scene photograph unused',sourceMeanLinearLuma:meanLuma},
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
  cut[i]=n[long];endUv[i*2]=(p[perpendicular[0]]-centre[perpendicular[0]])*s[perpendicular[0]];endUv[i*2+1]=(p[perpendicular[1]]-centre[perpendicular[1]])*s[perpendicular[1]];
  if(n[long]>.85){uv[i*2]=p[perpendicular[0]]*s[perpendicular[0]]+offset;uv[i*2+1]=p[perpendicular[1]]*s[perpendicular[1]]+offset*.37;}
  else{uv[i*2]=p[long]*s[long]+offset;uv[i*2+1]=p[cross]*s[cross]+offset*.37;}
 }
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setAttribute('woodCut190',new T.Float32BufferAttribute(cut,1));geometry.setAttribute('woodEndUv190',new T.Float32BufferAttribute(endUv,2));
}
