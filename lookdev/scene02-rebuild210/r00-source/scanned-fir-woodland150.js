import {T,V} from './kernel.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Scene02-local original-model loader. The unchanged provider meshes and4K
// botanical surfaces replace the rejected smooth/oversized authored crowns.
export async function loadFirWoodland150(mats){
 const gltf=await new GLTFLoader().loadAsync(new URL('./assets/fir-sapling/fir_sapling_4k.gltf',import.meta.url).href);gltf.scene.updateMatrixWorld(true);
 const variants=[],textures=new Set(),sources=new Map(),materials=new Map();
 for(const root of gltf.scene.children){
  const bounds=new T.Box3().setFromObject(root),height=bounds.max.y-bounds.min.y;let x=0,z=0,n=0;
  root.traverse(o=>{
   if(!o.isMesh||!o.material.name.includes('branches'))return;
   const p=o.geometry.attributes.position,v=new T.Vector3();
   for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);if(v.y<bounds.min.y+height*.025){x+=v.x;z+=v.z;n++;}}
  });
  const center=bounds.getCenter(new T.Vector3()),origin=[n?x/n:center.x,bounds.min.y,n?z/n:center.z],parts=[];
  root.traverse(o=>{
   if(!o.isMesh)return;
   const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.translate(-origin[0],-origin[1],-origin[2]);geometry.computeBoundingBox();geometry.name='scene02-original-'+root.name+'-'+o.material.name;
   sources.set(o.material.name,o.material);parts.push({geometry,materialKey:o.material.name});
   for(const key of['map','normalMap','roughnessMap','metalnessMap','aoMap'])if(o.material[key]){o.material[key].anisotropy=8;textures.add(o.material[key]);}
  });
  variants.push({name:root.name,parts,height,sourceRoot:origin});
 }
 if(variants.length!==3||variants.some(v=>v.parts.length!==2))throw Error('Expected three original fir variants with separate trunk/twig meshes.');
 function materialFor(key,layer){
  const id=key+':'+layer;if(materials.has(id))return materials.get(id);
  const m=sources.get(key).clone(),twig=key.includes('twigs');m.name='scene02-original-woodland-'+key+'-layer'+layer;m.roughness=twig?.89:.96;m.metalness=0;m.transparent=false;m.opacity=1;m.depthWrite=true;m.side=T.DoubleSide;
  if(m.normalScale)m.normalScale.set(twig?.75:.55,twig?.75:.55);m.userData.thinLeaf=twig;m.userData.thinLeafTransmission=twig?.30:0;m.userData.provenance='assets/fir-sapling/provenance.json';mats['firWoodland150_'+key+'_'+layer]=m;materials.set(id,m);return m;
 }
 return{variants,materialFor,info:{asset:'fir_sapling',authors:{'Rico Cilliers':'modeling','Rob Tuytel':'photography'},license:'CC0-1.0',source:'https://polyhaven.com/a/fir_sapling',provenance:'assets/fir-sapling/provenance.json',originalVariantCount:3,geometry:'Original provider meshes, normals and UVs; no geometry decimation or scene-photo projection',maps:'Original4K diffuse, OpenGL normal and ARM atlases; provider MD5 and exact byte sizes verified, SHA256 recorded'},dispose(){for(const t of textures)t.dispose();}};
}

export function buildFirWoodland150({b,library,ridgeTop,mountainSurface}){
 let state=0x150c0ffe;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const stats={trees:0,originalVariants:library.variants.length,layerPlacements:[],source:library.info};
 const settings=[{rows:7,columns:43,x0:-70,x1:36,h0:3.8,dh:3.6},{rows:7,columns:40,x0:-77,x1:42,h0:3.5,dh:3.6},{rows:6,columns:38,x0:-84,x1:48,h0:3.4,dh:3.7}];
 for(let layer=0;layer<3;layer++){
  const cfg=settings[layer],zbase=-34-layer*30;let placed=0;
  for(let row=0;row<cfg.rows;row++)for(let col=0;col<cfg.columns;col++){
   const x=cfg.x0+(cfg.x1-cfg.x0)*(col+.1+random()*.7)/cfg.columns,t=.11+(row+.12+random()*.60)/cfg.rows*.78,z=zbase-t*28.8,y=mountainSurface(x,z,layer,zbase),variant=library.variants[(row*5+col+layer)%library.variants.length],sunX=16.2+(-.87/-.75)*(z-25),nearSun=z>-78&&z<-28&&Math.abs(x-sunX)<11.5;
   const cap=Math.max(1.7,ridgeTop(x,layer)+[3.7,3.0,2.3][layer]-y),sunLimit=nearSun?2.72+(.23/-.75)*(z-25)-1.65-y:100,h=Math.max(1.0,Math.min(cfg.h0+random()*cfg.dh,cap,sunLimit)),s=h/variant.height,spread=1.12+random()*.27,yaw=random()*Math.PI*2;
   if(random()<.08&&row!==0)continue;
   const modelScale=[s*spread,s,s*spread*(.94+random()*.12)],tint=.83+random()*.22;
   for(const part of variant.parts)b.put(part.geometry,library.materialFor(part.materialKey,layer),[x,y-.035,z],modelScale,[0,yaw,0],tint);
   stats.trees++;placed++;
  }
  stats.layerPlacements.push({layer,trees:placed,ground:'Same actual finite ridge-height surface as the visible terrain',rootEmbedMetres:.035});
 }
 return{...stats,visualAccepted:false};
}
