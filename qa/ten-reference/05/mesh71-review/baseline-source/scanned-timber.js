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
 // The scan is a very smooth furniture varnish. The exposed temple coating
 // has a broader, subdued highlight; remap roughness as material processing.
 for(let i=0;i<values.data.length;i+=4){const q=Math.round(Math.min(255,values.data[i]*1.40+62));values.data[i]=values.data[i+1]=values.data[i+2]=q;}
 ctx.putImageData(values,0,0);const roughness=new T.CanvasTexture(canvas);rawRoughness.dispose();
 albedo.colorSpace=T.SRGBColorSpace;
 for(const tex of [normal,roughness])tex.colorSpace=T.NoColorSpace;
 for(const tex of [albedo,normal,roughness]){
  tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.minFilter=T.LinearMipmapLinearFilter;
  tex.magFilter=T.LinearFilter;tex.generateMipmaps=true;tex.anisotropy=8;tex.needsUpdate=true;
 }
 const keys=['red','cedar','endwood','darkwood','architecture_red','architecture_cedar','architecture_endwood','architecture_darkwood','kit_cedar','kit_endwood'];
 // Linear albedo gains represent the lighter stained temple timber. The
 // supplied scan is a very dark table: measured linear maxima .0666/.0452/
 // .0222. These gains keep every sampled albedo channel below one.
 const colors={red:[6.0,3.8,3.0],cedar:[6.8,4.6,3.5],endwood:[7.6,5.8,4.2],darkwood:[2.2,1.9,1.65]};
 for(const key of keys){
  const mat=mats[key];if(!mat)continue;
  const kind=key.includes('darkwood')?'darkwood':key.includes('endwood')?'endwood':key.includes('cedar')?'cedar':'red';
  mat.map=albedo;mat.normalMap=normal;mat.normalScale.set(.30,.30);mat.bumpMap=null;mat.roughnessMap=roughness;mat.roughness=1;
  mat.color.setRGB(...colors[kind]);mat.metalness=0;
  if(mat.isMeshPhysicalMaterial){mat.clearcoat=.04;mat.clearcoatRoughness=.45;mat.specularIntensity=.5;}
  mat.onBeforeCompile=()=>{};mat.customProgramCacheKey=()=> 'temple-scanned-varnished-timber-v01';
  mat.userData.metricTimberGrain=true;mat.envMapIntensity=.7;mat.needsUpdate=true;
 }
 return {info:{provider:'Poly Haven',asset:'lacquered_cherry_wood',license:'CC0-1.0',physicalTileMetres:1,grain:'Member-aligned metric UV; filtered normal and roughness maps'},
  dispose(){for(const tex of[albedo,normal,roughness])tex.dispose();}};
}

export function assignMetricTimberUV(geometry,matrix){
 geometry.computeBoundingBox();const size=geometry.boundingBox.getSize(new T.Vector3()),scale=new T.Vector3().setFromMatrixScale(matrix);
 const lengths=[size.x*scale.x,size.y*scale.y,size.z*scale.z],long=lengths.indexOf(Math.max(...lengths)),s=[scale.x,scale.y,scale.z];
 const position=geometry.attributes.position,normal=geometry.attributes.normal,uv=new Float32Array(position.count*2);
 const seed=Math.sin(matrix.elements[12]*12.713+matrix.elements[13]*4.13+matrix.elements[14]*5.71)*43758.5453,offset=seed-Math.floor(seed);
 for(let i=0;i<position.count;i++){
  const p=[position.getX(i),position.getY(i),position.getZ(i)],n=[Math.abs(normal.getX(i)),Math.abs(normal.getY(i)),Math.abs(normal.getZ(i))];
  const perpendicular=[0,1,2].filter(a=>a!==long);
  const cross=perpendicular[0]===n.indexOf(Math.max(...n))?perpendicular[1]:perpendicular[0];
  if(n[long]>.85){uv[i*2]=p[perpendicular[0]]*s[perpendicular[0]]+offset;uv[i*2+1]=p[perpendicular[1]]*s[perpendicular[1]]+offset*.37;}
  else{uv[i*2]=p[long]*s[long]+offset;uv[i*2+1]=p[cross]*s[cross]+offset*.37;}
 }
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
}
