import * as T from 'three';

// Seeded scalar material masks, never scene photographs or painted lighting.
// UVs belong to each actual cast leaf. A small height field breaks its perfect
// reflection; it does not stand in for the leaf's modeled cup, rim or point.
let masks;
function giltMasks(){
 if(masks)return masks;
 const size=512,height=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4);
 const hash=(x,y)=>{let v=Math.imul(x+17083,374761393)^Math.imul(y+9163,668265263);v=Math.imul(v^(v>>>13),1274126177);return((v^(v>>>16))>>>0)/4294967295;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4,fine=hash(x,y)-.5,beaten=hash(x>>2,y>>2)-.5;
  const h=Math.round(128+45*fine+17*beaten),r=Math.round(238+14*beaten+8*fine);
  height[i]=height[i+1]=height[i+2]=h;height[i+3]=255;
  rough[i]=rough[i+1]=rough[i+2]=r;rough[i+3]=255;
 }
 function texture(data,name){const t=new T.DataTexture(data,size,size,T.RGBAFormat,T.UnsignedByteType);t.name=name;t.colorSpace=T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.repeat.set(2,2);t.anisotropy=8;t.needsUpdate=true;return t;}
 return masks={height:texture(height,'lotus222-seeded-beaten-leaf-height'),rough:texture(rough,'lotus222-seeded-beaten-leaf-roughness')};
}
export function configureLotusGilt222(materials){
 const maps=giltMasks();
 for(const [name,color,roughness]of[
  ['lotusGold',[.72,.46,.145],.43],
  ['lotusGiltSoft',[.63,.38,.105],.46],
  ['lotusEdge',[.80,.56,.21],.39]
 ]){
  const m=materials[name];if(m.userData.lotusGilt222==='r07')continue;
  m.name='scene06-lotus222-r07-beaten-gilt-'+name;m.color.setRGB(...color);m.metalness=.94;m.roughness=roughness;
  m.roughnessMap=maps.rough;m.bumpMap=maps.height;m.bumpScale=.00018;
  m.userData.lotusGilt222='r07';m.userData.physicalMaskScale={heightAmplitudeMetres:.00018,repeatPerLeaf:[2,2],seed:17083,scope:'Authored fine gilt response; not a measurement of the reference metal'};m.needsUpdate=true;
 }
}
