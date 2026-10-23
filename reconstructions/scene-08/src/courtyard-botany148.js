import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Original CC0 meshes/maps stay immutable. Individual connected broadleaf
// blades are derived from the independent periwinkle mesh for authored woody
// shrubs. No reference-image pixel is present in any material or geometry.
export async function loadCourtyardBotany(){
 const loader=new GLTFLoader(),assets=[],materials=new Set(),geometries=new Set(),textures=new Set();
 for(const [id,file]of[['shrub-02','shrub_02_4k.gltf'],['periwinkle-plant','periwinkle_plant_4k.gltf']]){
  const gltf=await loader.loadAsync('/assets/polyhaven/'+id+'/'+file);gltf.scene.updateMatrixWorld(true);const variants=[];
  for(const root of gltf.scene.children){
   const bounds=new T.Box3().setFromObject(root),centre=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),parts=[];
   root.traverse(o=>{
    if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.translate(-centre.x,-bounds.min.y,-centre.z);geometries.add(geometry);
    const material=o.material.clone();material.name='scene08-cc0-'+id+'-'+root.name;material.shadowSide=T.DoubleSide;
    if(id==='periwinkle-plant'){material.transparent=false;material.alphaTest=.42;material.depthWrite=true;}
    for(const key of['map','normalMap','roughnessMap','metalnessMap','aoMap'])if(material[key]){material[key].anisotropy=8;textures.add(material[key]);}
    material.onBeforeCompile=shader=>{
     shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n #if NUM_DIR_LIGHTS > 0\n vec3 leafSun=directionalLights[0].direction;float thinLeaf=max(0.,dot(-normal,leafSun));reflectedLight.indirectDiffuse+=diffuseColor.rgb*directLight.color*vec3(.045,.040,.025)*thinLeaf;\n #endif');
    };material.customProgramCacheKey=()=> 'scene08-botanical-thin-leaf147';materials.add(material);parts.push({geometry,material});
   });variants.push({name:root.name,width:Math.max(size.x,size.z),height:size.y,parts});
  }assets.push({id,variants});
 }
 const leaves=[],sourcePart=assets[1].variants[0].parts[0],source=sourcePart.geometry,pos=source.attributes.position,uv=source.attributes.uv,indices=source.index.array,parent=Array.from({length:pos.count},(_,i)=>i);
 const find=a=>{while(parent[a]!==a){parent[a]=parent[parent[a]];a=parent[a];}return a;},join=(a,b)=>parent[find(a)]=find(b);
 // The glTF duplicates vertices at normal/UV seams. Weld by coincident
 // physical position for component discovery; preserve all source vertices,
 // UVs and triangle indices when constructing each complete blade below.
 const welded=new Map();for(let i=0;i<pos.count;i++){
  const key=[pos.getX(i),pos.getY(i),pos.getZ(i)].map(x=>Math.round(x*1e6)).join(',');
  if(welded.has(key))join(i,welded.get(key));else welded.set(key,i);
 }
 for(let i=0;i<indices.length;i+=3){join(indices[i],indices[i+1]);join(indices[i],indices[i+2]);}
 const groups=new Map();for(let i=0;i<pos.count;i++){const root=find(i);if(!groups.has(root))groups.set(root,[]);groups.get(root).push(i);}
 const canvas=document.createElement('canvas'),map=sourcePart.material.map;canvas.width=map.image.width;canvas.height=map.image.height;
 const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(map.image,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
 for(const ids of groups.values()){
  if(ids.length<25||ids.length>150)continue;
  const box=new T.Box3();let us=0,vs=0,uMin=1,uMax=0;
  for(const id of ids){box.expandByPoint(new T.Vector3().fromBufferAttribute(pos,id));us+=uv.getX(id);vs+=uv.getY(id);uMin=Math.min(uMin,uv.getX(id));uMax=Math.max(uMax,uv.getX(id));}
  const size=box.getSize(new T.Vector3());if(Math.max(size.x,size.y,size.z)>.085||Math.max(size.x,size.y,size.z)<.015)continue;
  const x=Math.min(canvas.width-1,Math.max(0,Math.floor(us/ids.length*canvas.width))),y=Math.min(canvas.height-1,Math.max(0,Math.floor((map.flipY?1-vs/ids.length:vs/ids.length)*canvas.height))),offset=(y*canvas.width+x)*4,r=pixels[offset],g=pixels[offset+1],b=pixels[offset+2];
  if(g<r*.90||g<b*1.2||g<28)continue;
  const base=new T.Vector3(),tip=new T.Vector3();let baseN=0,tipN=0;
  for(const id of ids){if(uv.getX(id)<uMin+(uMax-uMin)*.08){base.add(new T.Vector3().fromBufferAttribute(pos,id));baseN++;}if(uv.getX(id)>uMax-(uMax-uMin)*.08){tip.add(new T.Vector3().fromBufferAttribute(pos,id));tipN++;}}
  base.divideScalar(baseN);tip.divideScalar(tipN);const forward=tip.sub(base).normalize(),normal=new T.Vector3().fromBufferAttribute(source.attributes.normal,ids[0]),across=new T.Vector3().crossVectors(normal,forward).normalize(),up=new T.Vector3().crossVectors(forward,across).normalize();
  const matrix=new T.Matrix4().makeBasis(across,up,forward).invert().multiply(new T.Matrix4().makeTranslation(-base.x,-base.y,-base.z)),remap=new Map(ids.map((id,i)=>[id,i])),pp=[],nn=[],tt=[],ix=[];
  for(const id of ids){pp.push(pos.getX(id),pos.getY(id),pos.getZ(id));nn.push(source.attributes.normal.getX(id),source.attributes.normal.getY(id),source.attributes.normal.getZ(id));tt.push(uv.getX(id),uv.getY(id));}
  for(let j=0;j<indices.length;j+=3)if(remap.has(indices[j]))ix.push(remap.get(indices[j]),remap.get(indices[j+1]),remap.get(indices[j+2]));
  const geometry=new T.BufferGeometry();
  // Preserve every original glTF attribute, including baked vertex RGBA and
  // the second UV set. Omitting vertex color would turn this material black.
  for(const [name,attribute]of Object.entries(source.attributes)){
   const values=[];for(const id of ids)for(let c=0;c<attribute.itemSize;c++)values.push(attribute.getComponent(id,c));
   geometry.setAttribute(name,new T.Float32BufferAttribute(values,attribute.itemSize));
  }
  geometry.setIndex(ix);geometry.applyMatrix4(matrix);geometries.add(geometry);geometry.computeBoundingBox();const bladeSize=geometry.boundingBox.getSize(new T.Vector3());leaves.push({geometry,material:sourcePart.material,length:Math.max(bladeSize.x,bladeSize.y,bladeSize.z)});if(leaves.length===32)break;
 }
 if(leaves.length<4)throw Error('Independent scanned broadleaf extraction produced too few green blades');
 // A derived red albedo is a surface-pigment variant of the independent CC0
 // blade scan. It contains no reference-scene pixels and survives PBR export.
 const greenCanvas=document.createElement('canvas');greenCanvas.width=canvas.width;greenCanvas.height=canvas.height;const gc=greenCanvas.getContext('2d'),gi=gc.createImageData(greenCanvas.width,greenCanvas.height);
 for(let k=0;k<pixels.length;k+=4){for(let c=0;c<3;c++){const q=pixels[k+c]/255,v=q<=.04045?q/12.92:Math.pow((q+.055)/1.055,2.4),p=Math.min(.78,v*1.70);gi.data[k+c]=Math.round((p<=.0031308?p*12.92:1.055*Math.pow(p,1/2.4)-.055)*255);}gi.data[k+3]=255;}
 gc.putImageData(gi,0,0);const greenMap=new T.CanvasTexture(greenCanvas);greenMap.colorSpace=T.SRGBColorSpace;greenMap.flipY=map.flipY;greenMap.anisotropy=8;textures.add(greenMap);
 const leafMaterials={};
 for(const [kind,color]of Object.entries({leaf:'#ffffff',leaflight:'#e8edba',azalea:'#e3e4b5'})){
  const m=sourcePart.material.clone();m.name='scene08-mature-'+kind+'-scanned-blade148';m.color.set(color);m.map=greenMap;m.roughness=.76;m.metalness=0;m.aoMapIntensity=.55;m.normalScale.set(.32,.32);m.onBeforeCompile=sourcePart.material.onBeforeCompile;m.customProgramCacheKey=()=> 'scene08-191-restored-thin-leaf';materials.add(m);leafMaterials[kind]=m;
 }
 const redCanvas=document.createElement('canvas');redCanvas.width=canvas.width;redCanvas.height=canvas.height;
 const redContext=redCanvas.getContext('2d'),redImage=redContext.createImageData(redCanvas.width,redCanvas.height),pigment=new T.Color('#96391d');
 for(let k=0;k<pixels.length;k+=4){
  const rgb=[pixels[k],pixels[k+1],pixels[k+2]].map(q=>((q/255)<=.04045?(q/255)/12.92:Math.pow(((q/255)+.055)/1.055,2.4))),l=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2],grain=T.MathUtils.clamp(Math.pow(Math.max(.0001,l)/.07,.55),.50,1.55);
  for(let c=0;c<3;c++)redImage.data[k+c]=Math.round(((v)=>v<=.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-.055)(Math.min(.95,[pigment.r,pigment.g,pigment.b][c]*grain))*255);redImage.data[k+3]=255;
 }
 redContext.putImageData(redImage,0,0);const redMap=new T.CanvasTexture(redCanvas);redMap.colorSpace=T.SRGBColorSpace;redMap.flipY=map.flipY;redMap.anisotropy=8;textures.add(redMap);
 const redMaterial=sourcePart.material.clone();redMaterial.name='scene08-oxide-red-scanned-foliage148';redMaterial.map=redMap;redMaterial.vertexColors=false;redMaterial.color.set('#ffffff');redMaterial.roughness=.65;redMaterial.metalness=0;redMaterial.onBeforeCompile=sourcePart.material.onBeforeCompile;redMaterial.customProgramCacheKey=()=> 'scene08-191-restored-thin-leaf-red';materials.add(redMaterial);leafMaterials.maple=redMaterial;
 let plantNumber=0,leafNumber=0,seed=814815;const R=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296),rr=(a,b)=>a+(b-a)*R();
 const stats={revision:'scene08-fine-stems-dense-terminal-leaves213-r02',transmissionUsesActualSunAndShadow:true,greenLinearGain:1.70,clonedThinLeafCallbackRestored:true,geometryAndPlacementUnchanged:false,originalScannedBladeAttributesHeld:true,shrubs:0,groundcover:0,scannedBlades:0,bladeVariants:leaves.length,bladeLengths:leaves.map(l=>l.length),bladeAttributes:Object.keys(source.attributes),variants:assets.map(a=>({asset:a.id,variants:a.variants.map(v=>({name:v.name,width:v.width,height:v.height}))})),construction:'Mature rooted multi-stem shrubs, physically forked lateral branches, clumped opposite/whorled scanned blades with measured physical length. Original source attributes retained; red foliage uses an independently pigmented original scan.',referenceSceneImageUsed:false};
 function place({emit,height,x,z,width,flower=false,index=plantNumber++,yaw=rr(0,Math.PI*2),yOffset=0}){
  const choices=assets[flower?1:0].variants,variant=choices[index%choices.length],s=width/variant.width,y=height(x,z)+yOffset-.012;
  for(const part of variant.parts)emit(part.geometry,part.material,x,y,z,s,s,s,[0,yaw,0],rr(.92,1.05));stats[flower?'groundcover':'shrubs']++;
 }
 function foliage({emit,between,start,end,kind,leafLength,nodes=8}){
  const branchRadius=Math.max(.0014,leafLength*.027);between(start,end,branchRadius,'bark',true);
  const material=leafMaterials[kind]||leafMaterials.leaf;
  for(let j=0;j<nodes;j++){
   const t=.25+.75*(j+.35+rr(-.18,.18))/nodes,root=start.map((v,c)=>v+(end[c]-v)*t),a=j*2.399963+rr(-.40,.40),length=leafLength*rr(.68,1.28),reach=length*rr(.15,.33);
   for(let n=0;n<5;n++){
    const angle=a+n*1.256637+rr(-.28,.28),tip=[root[0]+Math.cos(angle)*reach,root[1]+rr(-.016,.028),root[2]+Math.sin(angle)*reach];between(root,tip,branchRadius*.31,'bark',true);
    const blade=leaves[leafNumber++%leaves.length],s=length/blade.length,direction=new T.Vector3(Math.cos(angle),rr(-.17,.64),Math.sin(angle)).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),direction).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),rr(-.75,.75))),e=new T.Euler().setFromQuaternion(q);
    emit(blade.geometry,material,...tip,s*rr(.98,1.23),s,s,[e.x,e.y,e.z],rr(.69,1.16));stats.scannedBlades++;
   }
  }
 }
 function shrub({emit,between,height,x,z,r,h,kind='leaf'}){
  const y=height(x,z),primary=h<.85?5:8,rootWidth=Math.min(.040,.006+h*.006),leafLength=(h<.85?rr(.055,.076):rr(.085,.120))*(z>7.5?.70:1);
  stats.shrubs++;
  // Limbs begin at the rooted crown, divide at several heights and keep their
  // lower lateral branches. No detached sphere or clipped leaf shell is used.
  for(let j=0;j<primary;j++){
   const a=j*2.399963+rr(-.20,.20),crownRadius=r*rr(.46,.73),root=[x+rr(-.08,.08)*r,y,z+rr(-.08,.08)*r],elbow=[x+Math.cos(a)*r*.19,y+h*rr(.17,.32),z+Math.sin(a)*r*.19],fork=[x+Math.cos(a)*crownRadius,y+h*rr(.42,.69),z+Math.sin(a)*crownRadius];
   between(root,elbow,rootWidth*rr(.74,1.05),'bark',true);between(elbow,fork,rootWidth*.57,'bark',true);
   for(let k=0;k<5;k++){
    const aa=a+(k-2)*.53+rr(-.16,.16),branchOrigin=elbow.map((v,c)=>v+(fork[c]-v)*(.15+k*.16)),tip=[fork[0]+Math.cos(aa)*r*rr(.28,.47),y+h*rr(.61,.98),fork[2]+Math.sin(aa)*r*rr(.28,.47)];between(branchOrigin,tip,rootWidth*.24,'bark',true);
    for(let n=0;n<5;n++){
     const f=.10+n*.205,start=branchOrigin.map((v,c)=>v+(tip[c]-v)*f),angle=aa+(n-2)*.65+rr(-.30,.30),reach=r*rr(.19,.36),end=[start[0]+Math.cos(angle)*reach,start[1]+h*rr(.035,.17),start[2]+Math.sin(angle)*reach];
     foliage({emit,between,start,end,kind,leafLength:leafLength*rr(.82,1.14),nodes:z>7.5?14:8});
    }
   }
  }
 }
 return {stats,place,shrub,dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
