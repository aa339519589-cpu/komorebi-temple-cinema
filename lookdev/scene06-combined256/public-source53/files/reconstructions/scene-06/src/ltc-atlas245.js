import * as T from 'three';

// Preserve both complete native LTC tables and their numeric type/filters.
// Packing them side by side saves one binding, not any shading information.
export function createPackedLtc245(renderer){
 const mode=renderer.extensions.has('OES_texture_float_linear')?'FLOAT':'HALF';
 const a=T.UniformsLib['LTC_'+mode+'_1'],b=T.UniformsLib['LTC_'+mode+'_2'];
 if(!a||!b||a.type!==b.type||a.format!==b.format)throw Error('Pinned native LTC inputs unavailable.');
 const {width:w,height:h,data:first}=a.image,second=b.image.data;
 if(w!==64||h!==64||b.image.width!==w||b.image.height!==h||first.constructor!==second.constructor)throw Error('Pinned native LTC dimensions changed.');
 const data=new first.constructor(w*2*h*4);
 for(let y=0;y<h;y++){
  data.set(first.subarray(y*w*4,(y+1)*w*4),y*w*8);
  data.set(second.subarray(y*w*4,(y+1)*w*4),y*w*8+w*4);
 }
 for(let y=0;y<h;y++)for(let x=0;x<w*4;x++)if(!Object.is(data[y*w*8+x],first[y*w*4+x])||!Object.is(data[y*w*8+w*4+x],second[y*w*4+x]))throw Error('LTC table values changed in packing.');
 const texture=new T.DataTexture(data,w*2,h,a.format,a.type);
 for(const key of['wrapS','wrapT','minFilter','magFilter','generateMipmaps','flipY','colorSpace','unpackAlignment'])texture[key]=a[key];
 texture.name='scene06-lossless-native-LTC-pair245';texture.needsUpdate=true;
 texture.userData.packing245={mode,sourceSize:[w,h],atlasSize:[w*2,h],nativeType:a.type,allSourceValuesRetained:true,lookupPrecisionReduced:false,sourceTextureNames:[a.name,b.name]};
 return texture;
}

export function bindPackedLtc245(shader,texture){
 const declaration=/uniform\s+sampler2D\s+ltc_1\s*;\s*uniform\s+sampler2D\s+ltc_2\s*;/;
 const header=T.ShaderChunk.lights_pars_begin;
 if(!declaration.test(header))throw Error('Pinned LTC declarations changed.');
 let lookups=0;
 const physical=T.ShaderChunk.lights_physical_pars_fragment.replace(/texture2D\(\s*ltc_([12])\s*,\s*(\w+)\s*\)/g,(_,index,uv)=>{
  lookups++;return `texture2D(scene06LtcAtlas245,vec2((${uv}.x+${index==='1'?'0.0':'1.0'})*.5,${uv}.y))`;
 });
 if(lookups!==4)throw Error('Pinned base/clearcoat LTC lookup sites changed.');
 for(const anchor of['#include <lights_pars_begin>','#include <lights_physical_pars_fragment>'])if(shader.fragmentShader.split(anchor).length!==2)throw Error('Expected one native light chunk insertion.');
 shader.uniforms.scene06LtcAtlas245={value:texture};
 shader.fragmentShader=shader.fragmentShader.replace('#include <lights_pars_begin>',header.replace(declaration,'uniform sampler2D scene06LtcAtlas245;')).replace('#include <lights_physical_pars_fragment>',physical);
 // Keep the original JS ltc_1/2 uniform objects for the renderer's light state
 // refresh. They are no longer active GLSL samplers and allocate no bindings.
}
