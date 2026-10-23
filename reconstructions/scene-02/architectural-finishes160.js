import {T} from './kernel.js';

// Deterministic fired-clay microstructure. These are material-scale fields,
// never image plates: the same maps wrap the individually closed roof units.
export function installArchitecturalFinishes160(mats){
 const n=512,albedo=new Uint8Array(n*n*4),height=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4);
 const hash=(x,y)=>{const h=Math.sin(x*127.1+y*311.7+19.7)*43758.5453;return h-Math.floor(h);};
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=(y*n+x)*4,grain=hash(x,y),broad=hash(x>>5,y>>5),streak=Math.sin(x*.13+Math.sin(y*.017)*1.7),pore=Math.max(0,(hash(x>>1,y>>1)-.91)/.09),firing=.84+.09*broad+.045*streak+.035*grain;
  albedo[i]=Math.round(255*firing*.95);albedo[i+1]=Math.round(255*firing*.98);albedo[i+2]=Math.round(255*firing);albedo[i+3]=255;
  const h=Math.round(126+14*(grain-.5)+10*(broad-.5)-31*pore);height[i]=height[i+1]=height[i+2]=h;height[i+3]=255;
  const r=Math.round(163+24*(broad-.5)+24*pore);rough[i]=rough[i+1]=rough[i+2]=r;rough[i+3]=255;
 }
 function texture(data,color=false){const t=new T.DataTexture(data,n,n);t.needsUpdate=true;t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=8;t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;return t;}
 const map=texture(albedo,true),bump=texture(height),roughness=texture(rough),tileColors=[0x405167,0x475c73,0x384b60,0x51637a,0x3b5068,0x4a596b];
 for(let i=0;i<tileColors.length;i++){
  const m=new T.MeshPhysicalMaterial({name:`scene02-ceramic-fired-unit160-${i}`,color:tileColors[i],roughness:.80,metalness:0,map,bumpMap:bump,bumpScale:.0035,roughnessMap:roughness,clearcoat:.42,clearcoatRoughness:.22});
  mats[`ceramic160${i}`]=m;
 }
 mats.pagodaPlaster160=new T.MeshStandardMaterial({name:'scene02-pagoda-recessed-aged-lime160',color:0xb4a585,roughness:.92});
 mats.pagodaShadow160=mats.darkwood.clone();mats.pagodaShadow160.name='scene02-pagoda-deep-wall-and-soffit160';mats.pagodaShadow160.color.setHex(0x302018);mats.pagodaShadow160.roughness=.84;
 mats.pagodaRed160=mats.red.clone();mats.pagodaRed160.name='scene02-pagoda-worn-vermilion160';mats.pagodaRed160.color.setHex(0x6f291c);mats.pagodaRed160.roughness=.57;
 return{textures:[map,bump,roughness],info:{revision:'scene02-fitted-ceramic-and-lime160-physical-glaze186-r05',construction:'Authored deterministic fired-ceramic microstructure on physical closed tiles; aged lime sits behind real timber frames',photographicPixels:false}};
}
