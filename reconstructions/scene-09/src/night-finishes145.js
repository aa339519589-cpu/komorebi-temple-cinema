import * as T from 'three';

// Scalar PBR maps authored for construction surfaces, never a view or image
// plate. All maps export as ordinary material textures to physical renderers.
const hash=(x,y)=>{const q=Math.sin(x*127.1+y*311.7+145)*43758.5453;return q-Math.floor(q);};
export function installNightFinishes145(M,materials,textures){
 const n=256,plaster=new Uint8Array(n*n*4),clay=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4),gilt=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=(y*n+x)*4,h=hash(x,y),b=.50+.21*Math.sin(x*.033+y*.021)+.18*Math.sin(x*.079-y*.047),q=.93+.05*b+.02*h;
  plaster.set([Math.round(225*q),Math.round(222*q),Math.round(209*q),255],i);
  const t=.75+.13*b+.12*h;clay.set([Math.round(200*t),Math.round(207*t),Math.round(214*t),255],i);
  const r=Math.round(177+28*b+15*h);rough.set([r,r,r,255],i);
  const g=Math.round(125+10*h+4*Math.sin(x*.37+y*.29));gilt.set([g,g,g,255],i);
 }
 const tex=(data,srgb=false)=>{const t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=8;if(srgb)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;textures.push(t);return t;};
 const mineral=tex(plaster,true),fired=tex(clay,true),r=tex(rough),hammer=tex(gilt);
 M.ivory.name='scene09-hand-trowelled-recessed-lime-plaster145';M.ivory.color.setHex(0xc9c6b4);M.ivory.map=mineral;M.ivory.roughness=.97;M.ivory.bumpMap=hammer;M.ivory.bumpScale=.0014;
 M.wood.color.setRGB(3.35,3.22,2.65);M.red.color.setRGB(4.05,2.78,1.96);M.wood.normalScale.set(.16,.16);M.red.normalScale.set(.18,.18);
 M.gold.name='scene09-aged-gilt145';M.gold.color.setHex(0xb6a06a);M.gold.roughness=.47;M.gold.roughnessMap=r;M.gold.bumpMap=hammer;M.gold.bumpScale=.00065;M.gold.metalness=.83;
 M.bronze.color.setHex(0x796344);M.bronze.roughness=.55;M.bronze.roughnessMap=r;
 M.eaveDark=M.wood.clone();M.eaveDark.name='scene09-deep-aged-cedar-eave145';M.eaveDark.color.setRGB(1.75,1.84,1.73);M.eaveDark.roughness=.95;
 M.carvedTimber=M.wood.clone();M.carvedTimber.name='scene09-recessed-carved-timber145';M.carvedTimber.color.setRGB(2.50,2.43,2.08);M.carvedTimber.roughness=.94;
 M.darkGilt=M.gold.clone();M.darkGilt.name='scene09-recessed-oxidised-gilt145';M.darkGilt.color.setHex(0x796443);M.darkGilt.roughness=.64;
 M.sanctuaryGilt=M.gold.clone();M.sanctuaryGilt.name='scene09-hammered-sanctuary-gold145';M.sanctuaryGilt.color.setHex(0x805c22);M.sanctuaryGilt.roughness=.39;M.sanctuaryGilt.metalness=.89;
 M.buddha.color.setHex(0x393022);M.buddha.roughness=.44;M.buddha.metalness=.88;
 M.tile.name='scene09-fired-cobalt-grey-ceramic145';M.tile.map=fired;M.tile.roughnessMap=r;M.tile.color.setHex(0x273a50);M.tile.roughness=.66;M.tile.metalness=.01;M.tile.vertexColors=true;
 M.tileEdge.map=fired;M.tileEdge.roughnessMap=r;M.tileEdge.color.setHex(0x56616a);M.tileEdge.roughness=.73;M.tileEdge.vertexColors=true;
 // A real dielectric glaze above the pigmented ceramic catches the cobalt
 // sky independently from its fired-clay diffuse body.
 for(const key of['tile','tileEdge']){
  const old=M[key],edge=key==='tileEdge';M[key]=new T.MeshPhysicalMaterial({name:old.name+'-clear-glaze',color:old.color.clone(),map:old.map,roughnessMap:old.roughnessMap,roughness:edge?.61:.50,metalness:.01,bumpMap:old.bumpMap,bumpScale:old.bumpScale,clearcoat:edge?.37:.68,clearcoatRoughness:edge?.25:.18,envMapIntensity:1.03,vertexColors:true});materials.push(M[key]);
 }
 for(const m of[M.eaveDark,M.carvedTimber,M.darkGilt,M.sanctuaryGilt])materials.push(m);
 return{revision:'scene09-authored-mineral-fired-clay-and-aged-gilt145',source:'Existing declared CC0 cherry timber scan; original scalar mathematical plaster, clay, roughness and hammered-gilt maps',scenePhotoSampled:false};
}
