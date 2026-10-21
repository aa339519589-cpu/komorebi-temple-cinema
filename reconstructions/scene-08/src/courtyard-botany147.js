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
     shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n vec3 leafSun=normalize((viewMatrix*vec4(-30.,18.,25.,0.)).xyz);float thinLeaf=max(0.,dot(-normal,leafSun));reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(.22,.17,.075)*thinLeaf;');
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
  geometry.setIndex(ix);geometry.applyMatrix4(matrix);geometries.add(geometry);leaves.push({geometry,material:sourcePart.material});if(leaves.length===32)break;
 }
 if(leaves.length<4)throw Error('Independent scanned broadleaf extraction produced too few green blades');
 let plantNumber=0,leafNumber=0,seed=814715;const R=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296),rr=(a,b)=>a+(b-a)*R();
 const stats={revision:'scene08-supported-colored-blades147-r15',shrubs:0,groundcover:0,scannedBlades:0,bladeVariants:leaves.length,bladeAttributes:Object.keys(source.attributes),variants:assets.map(a=>({asset:a.id,variants:a.variants.map(v=>({name:v.name,width:v.width,height:v.height}))})),construction:'Connected original scanned green blades with all original vertexRGBA, UV sets and4K PBR maps, on physically modeled woody forks; complete periwinkle plants retained only at soil level.',referenceSceneImageUsed:false};
 function place({emit,height,x,z,width,flower=false,index=plantNumber++,yaw=rr(0,Math.PI*2),yOffset=0}){
  const choices=assets[flower?1:0].variants,variant=choices[index%choices.length],s=width/variant.width,y=height(x,z)+yOffset-.012;
  for(const part of variant.parts)emit(part.geometry,part.material,x,y,z,s,s,s,[0,yaw,0],rr(.92,1.05));stats[flower?'groundcover':'shrubs']++;
 }
 function foliage({emit,between,start,end,kind,leafScale}){
  between(start,end,.0065,'bark',true);
  for(let j=0;j<18;j++){
   const t=(j+.5)/18,root=start.map((v,c)=>v+(end[c]-v)*t),a=j*2.399963+rr(-.20,.20),s=leafScale*rr(.82,1.18),reach=.035*s;
   for(const sign of[-1,1]){
    const tip=[root[0]+Math.cos(a)*reach*sign,root[1]+rr(.003,.016),root[2]+Math.sin(a)*reach*sign];between(root,tip,.0018,'bark',true);
    const blade=leaves[leafNumber++%leaves.length],direction=new T.Vector3(Math.cos(a)*sign,rr(.12,.58),Math.sin(a)*sign).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),direction),e=new T.Euler().setFromQuaternion(q);
    emit(blade.geometry,blade.material,...tip,s,s,s,[e.x,e.y,e.z],rr(.78,1.09));stats.scannedBlades++;
   }
  }
 }
 function shrub({emit,between,height,x,z,r,h,kind='leaf'}){
  const y=height(x,z),primary=h<.85?5:7;
  // Each supported fork divides into leafy shoots at different heights/angles.
  // Leaves follow twigs, not an ellipsoid surface or a clipped crown shell.
  for(let j=0;j<primary;j++){
   const a=j*2.399963+rr(-.15,.15),root=[x,y,z],elbow=[x+Math.cos(a)*r*.22,y+h*.28,z+Math.sin(a)*r*.22],fork=[x+Math.cos(a)*r*.56,y+h*(.44+.15*Math.sin(j*1.73)),z+Math.sin(a)*r*.56];
   between(root,elbow,.027,'bark',true);between(elbow,fork,.018,'bark',true);
   for(let k=0;k<5;k++){
    const aa=a+(k-2)*.41,t=.73+.12*Math.sin(j*.9+k*1.7),tip=[fork[0]+Math.cos(aa)*r*.35,y+h*t,fork[2]+Math.sin(aa)*r*.35];between(fork,tip,.010,'bark',true);
    for(let n=0;n<5;n++){
     const f=.12+n*.20,start=elbow.map((v,c)=>v+(tip[c]-v)*f),angle=aa+(n-2)*.49,end=[start[0]+Math.cos(angle)*r*.24,start[1]+h*.13,start[2]+Math.sin(angle)*r*.24];
     foliage({emit,between,start,end,kind,leafScale:h<.85?1.6:2.1});
    }
   }
  }
  if(kind==='azalea')for(let j=0;j<4;j++){const a=j*2.399963,d=r*rr(.30,.85);place({emit,height,x:x+Math.cos(a)*d,z:z+Math.sin(a)*d,width:rr(.14,.25),flower:true});}
 }
 return {stats,place,shrub,dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
