import * as T from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';

export async function createGlobalGrade109(){
 const response=await fetch(new URL('../assets/grade109/curves.json',import.meta.url));if(!response.ok)throw Error('Missing grade109 curves');
 const record=await response.json(),data=new Float32Array(256*4);
 for(let i=0;i<256;i++){for(let c=0;c<3;c++)data[i*4+c]=record.curves[c][i];data[i*4+3]=1;}
 const curve=new T.DataTexture(data,256,1,T.RGBAFormat,T.FloatType);curve.minFilter=curve.magFilter=T.LinearFilter;curve.generateMipmaps=false;curve.needsUpdate=true;
 const pass=new ShaderPass({uniforms:{tDiffuse:{value:null},curves:{value:curve}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec2 vUv;uniform sampler2D tDiffuse;uniform sampler2D curves;float u(float v){return(.5+255.*clamp(v,0.,1.))/256.;}void main(){vec4 p=texture2D(tDiffuse,vUv);gl_FragColor=vec4(texture2D(curves,vec2(u(p.r),.5)).r,texture2D(curves,vec2(u(p.g),.5)).g,texture2D(curves,vec2(u(p.b),.5)).b,p.a);}'
 });
 pass.material.toneMapped=false;pass.name='Fixed global display-colour study109';
 const dispose=pass.dispose.bind(pass);pass.dispose=()=>{curve.dispose();dispose();};
 return pass;
}
