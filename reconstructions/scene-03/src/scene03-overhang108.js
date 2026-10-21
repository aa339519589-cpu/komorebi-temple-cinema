import * as T from 'three';
import {attachLeafSun108} from './scene03-daylight108.js';

// An Acer-like leaf is authored as a thin, lobed, folded closed lamina.  The
// serrated perimeter and relief carry real light, independent of the photo.
function mapleLeaf108(variant){
 const sectors=112,rings=5,p=[],uv=[],colors=[],ids=[],stride=1+rings*sectors;
 const profile=a=>{
  // Seven unequal palmate lobes, separated by deep sinuses, with small teeth.
  const lobes=[[-2.58,.46,.25],[-1.96,.74,.28],[-1.18,.94,.28],[0,1.15,.32],[1.18,.94,.28],[1.96,.74,.28],[2.58,.46,.25]];
  let r=.115;
  for(const [angle,length,width]of lobes){const d=Math.atan2(Math.sin(a-angle),Math.cos(a-angle));r=Math.max(r,length*Math.exp(-Math.pow(Math.abs(d)/width,1.62)));}
  return r*(1+.023*Math.sin(a*61+variant*.6)+.012*Math.sin(a*97));
 };
 const point=(r,a)=>{const edge=profile(a),x=Math.sin(a)*edge*r*.18,z=Math.cos(a)*edge*r*.18,
  y=.009*Math.sin(a*3+variant)*r*r+.008*Math.cos(a*7)*r*r+.016*r*(1-r)+.007*Math.sin(a+variant)*r**5;
  return[x,y,z];};
 for(let side=0;side<2;side++){
  p.push(0,side?-.00045:.00045,0);uv.push(.5,.12);colors.push(...(side?[.84,.93,.70]:[.83,.98,.73]));
  for(let j=1;j<=rings;j++)for(let k=0;k<sectors;k++){
   const r=j/rings,a=-Math.PI+k/sectors*Math.PI*2,q=point(r,a);q[1]+=(side?-.00045:.00045);p.push(...q);uv.push(q[0]/.42+.5,q[2]/.43+.47);
   const v=.84+.10*Math.sin(a*5+variant)+.05*r;colors.push(...(side?[v*.98,v,v*.76]:[v*.88,v,v*.71]));
  }
 }
 const tri=(a,b,c)=>ids.push(a,b,c,c+stride,b+stride,a+stride);
 for(let k=0;k<sectors;k++)tri(0,1+k,1+(k+1)%sectors);
 for(let j=0;j<rings-1;j++)for(let k=0;k<sectors;k++){const a=1+j*sectors+k,b=1+j*sectors+(k+1)%sectors;tri(a,a+sectors,b);tri(b,a+sectors,b+sectors);}
 const e=1+(rings-1)*sectors;for(let k=0;k<sectors;k++){const a=e+k,b=e+(k+1)%sectors;ids.push(a,b,a+stride,b,b+stride,a+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ids);g.computeVertexNormals();g.name='scene03-closed-serrated-palmate-leaf108-'+variant;return g;
}

function taperedBranch108(points,radius){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),N=36,S=9,frames=curve.computeFrenetFrames(N,false),p=[],uv=[],ids=[];
 for(let j=0;j<=N;j++){
  const t=j/N,centre=curve.getPointAt(t),r=.0022+(radius-.0022)*(1-t)**.85;
  for(let k=0;k<S;k++){const a=k/S*Math.PI*2,q=centre.clone().addScaledVector(frames.normals[j],Math.cos(a)*r).addScaledVector(frames.binormals[j],Math.sin(a)*r);p.push(...q.toArray());uv.push(k/S,t*curve.getLength());}
 }
 for(let j=0;j<N;j++)for(let k=0;k<S;k++){const a=j*S+k,b=j*S+(k+1)%S;ids.push(a,b,a+S,b,b+S,a+S);}
 for(let end=0;end<2;end++){const c=p.length/3,q=curve.getPointAt(end);p.push(...q.toArray());uv.push(.5,.5);for(let k=0;k<S;k++){const a=end*N*S+k,b=end*N*S+(k+1)%S;end?ids.push(c,a,b):ids.push(c,b,a);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.name='scene03-closed-tapered-maple-branch108';return g;
}

export function buildOverhang108({emit,sweep,between,mat,bark,textures}){
 let seed=108742;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296},range=(a,b)=>a+(b-a)*rand();
 const bytes=new Uint8Array(256*256*4),height=new Uint8Array(bytes.length);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const xx=(x/255-.5)*2,zz=(y/255-.47)*2,a=Math.atan2(xx,zz),r=Math.hypot(xx,zz),vein=Math.exp(-Math.pow(Math.sin(a*7+.04*Math.sin(r*11)),2)*450),fine=.025*Math.sin(x*7.11+y*12.71),v=.84+.08*Math.sin(x*.07+y*.03)-.075*vein+fine,k=(y*256+x)*4;
  bytes[k]=Math.round(211*v);bytes[k+1]=Math.round(234*v);bytes[k+2]=Math.round(161*v);bytes[k+3]=255;height[k]=height[k+1]=height[k+2]=Math.round(125+38*vein+fine*100);height[k+3]=255;
 }
 const texture=(b,srgb)=>{const t=new T.DataTexture(b,256,256,T.RGBAFormat);if(srgb)t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=8;t.needsUpdate=true;textures.add(t);return t;};
 const leaf=mat('scene03-folded-maple-tissue108','#6b8336',.66);leaf.map=texture(bytes,true);leaf.bumpMap=texture(height,false);leaf.bumpScale=.00032;leaf.vertexColors=true;
 leaf.onBeforeCompile=s=>{attachLeafSun108(s);s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
  vec3 leafSun=normalize((viewMatrix*vec4(scene03SunDirection108,0.)).xyz);
  reflectedLight.indirectDiffuse+=diffuseColor.rgb*pow(max(0.,dot(-normal,leafSun)),1.4)*.30;`);};leaf.customProgramCacheKey=()=> 'scene03-thin-palmate-maple108';
 const geos=Array.from({length:5},(_,i)=>mapleLeaf108(i));let leaves=0,twigs=0;
 // Root and stem remain outside the left framing but join this actual tree.
 sweep([[-12.7,-.22,6.6],[-12.1,3.4,6.9],[-11.4,7.2,6.6],[-10.2,9.75,6.3],[-8.4,10.55,5.6]],.19,bark);
 const limbs=[
  [[-10.2,9.75,6.3],[-8.7,10.7,5.9],[-5.8,11.5,5.2],[-2.7,12.7,4.6]],
  [[-10.7,9.1,6.5],[-8.5,10.8,7.0],[-6.3,11.7,6.6],[-3.6,12.6,6.0]],
  [[-10.1,9.8,6.2],[-8.9,11.2,5.2],[-6.4,12.6,4.1],[-3.0,13.8,3.6]],
  [[-11.0,8.9,6.4],[-10.4,10.6,4.7],[-7.8,12.8,3.3],[-4.3,14.4,3.2]],
 ];
 for(let l=0;l<limbs.length;l++){
  const curve=new T.CatmullRomCurve3(limbs[l].map(p=>new T.Vector3(...p)));emit(taperedBranch108(limbs[l],.047-l*.005),bark);
  for(let j=0;j<17;j++){
   const t=.13+.85*j/16,start=curve.getPoint(t),direction=curve.getTangent(t),sign=j%2?1:-1,
    end=start.clone().add(new T.Vector3(sign*range(.30,.78),range(.15,.49),range(-.70,.65))),mid=start.clone().lerp(end,.50).add(new T.Vector3(0,.08,0));
   emit(taperedBranch108([start.toArray(),mid.toArray(),end.toArray()],.009*range(.65,1)),bark);twigs++;
   for(let k=0;k<9;k++){
    const u=.17+.79*k/8,centre=start.clone().lerp(end,u).add(new T.Vector3(range(-.10,.10),.03,range(-.09,.09)));
    for(const s of[-1,1]){
     const p=centre.clone().add(new T.Vector3(s*range(.05,.16),range(-.03,.06),range(-.06,.08)));
     if(p.x>-4.6&&p.x<-3.40&&p.z>3.3&&p.z<6.5)continue;
     const scale=range(.70,1.12),yaw=Math.atan2(direction.x,direction.z)+s*range(.5,1.3),rot=[range(-.45,.50),yaw,range(-.5,.5)];
     between(centre.toArray(),p.toArray(),.0016,bark);emit(geos[(k+l)%5],leaf,p.toArray(),[scale,scale,scale],rot,range(.79,1.23));leaves++;
    }
   }
  }
 }
 return{revision:108,rootedCurvedTree:true,closedPalmateLamina:true,leaves,twigs,referencePhotoUsed:false};
}
